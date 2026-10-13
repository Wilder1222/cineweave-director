import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createDistributionInventory } from "../scripts/validate-repository.mjs";

async function snapshot(directory, prefix = "") {
  const hashes = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const key = `${prefix}${entry.name}`;
    const path = join(directory, entry.name);
    assert.equal(entry.isSymbolicLink(), false, path);
    if (entry.isDirectory()) Object.assign(hashes, await snapshot(path, `${key}/`));
    else hashes[key] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
  return hashes;
}

async function checkInstalledLayout(repository, skillName, standalone) {
  const directory = await mkdtemp(join(tmpdir(), "cw-installed-"));
  try {
    const bundle = join(directory, "plugin");
    // Both layouts consume only the generated distribution, never author sources.
    const built = resolve(repository, ".build/cineweave-director");
    if (standalone) {
      await cp(join(built, "skills", skillName), bundle, { recursive: true });
      await cp(join(built, "LICENSE"), join(bundle, "LICENSE"));
    } else await cp(built, bundle, { recursive: true });
    const helpers = standalone ? join(bundle, "scripts") : join(bundle, "skills", skillName, "scripts");
    const run = (name, args) => {
      const result = spawnSync(process.execPath, [join(helpers, `${name}.mjs`), ...args], {
        cwd: directory, encoding: "utf8", timeout: 10000,
        env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
      });
      assert.ifError(result.error);
      return result;
    };
    const bundleBefore = await snapshot(bundle);
    const fixtures = {
      delivery: {
        frameRate: { numerator: 24, denominator: 1 }, totalFrames: 288,
        shots: [{ id: "S1", startFrame: 0, endFrame: 288 }],
        subtitles: [{ id: "VO", startFrame: 192, endFrame: 264, text: "值得专程回来", expectedHanCharacters: 6 }],
      },
      video: {
        format: "cineweave-video-workbook/v1", frameRate: { numerator: 24, denominator: 1 },
        nodes: [{ id: "S1", type: "video_t2v", timing: { headFrames: 12, editFrames: 96, tailFrames: 24 },
          prompt: "<节点>S1</节点><目标>看见铜杯</目标><约束>仅规划</约束><起态>铜杯在木台中央</起态><动作>杯子保持静止</动作><运镜>固定</运镜><终态>杯子位置不变</终态><时长>采用4秒</时长><剪辑余量>头0.5秒，尾1秒</剪辑余量>" }],
      },
      review: {
        source: { type: "design", id: "fixture", version: 1 }, mode: "focused", roles: ["direction"], shotIds: ["S1"],
        reviews: [{ role: "direction", shotId: "S1", status: "pass", criterion: "检查杯子位置", observation: "规划文字保持杯子在木台中央", sourceLocator: "fixture / S1" }],
      },
      impact: {
        format: "cineweave-change-impact", canonical: false,
        artifacts: [{ id: "appearance", revision: 1, dependencyCoverage: "complete" }, { id: "shot", revision: 1, dependencyCoverage: "complete" }],
        dependencies: [{ consumer: "shot", source: "appearance", sourceRevision: 1, paths: ["/color"] }],
        changes: [{ source: "appearance", fromRevision: 1, toRevision: 2, paths: ["/color"], reason: "用户修改衣色" }],
      },
    };
    const paths = {};
    for (const [name, data] of Object.entries(fixtures)) {
      paths[name] = join(directory, `${name}.json`);
      await writeFile(paths[name], JSON.stringify(data));
    }
    const inputBefore = await snapshot(directory);
    const count = run("check-delivery", ["--text", "值得专程回来"]);
    assert.equal(count.status, 0, count.stderr);
    assert.equal(JSON.parse(count.stdout).hanCharacters, 6);
    const delivery = run("check-delivery", [paths.delivery]);
    assert.equal(delivery.status, 0, delivery.stderr);
    assert.equal(JSON.parse(delivery.stdout).srt, "1\n00:00:08,000 --> 00:00:11,000\n值得专程回来\n");
    const video = run("check-video-plan", [paths.video]);
    assert.equal(video.status, 0, video.stderr);
    const plan = JSON.parse(video.stdout);
    assert.equal(plan.valid, true);
    assert.equal(plan.declarationComplete, false);
    assert.ok(plan.pending.length > 0);
    assert.equal(plan.mediaVerified, false);
    assert.equal(plan.providerExecution, false);
    const review = run("check-shot-review", [paths.review]);
    assert.equal(review.status, 0, review.stderr);
    assert.equal(JSON.parse(review.stdout).reviewComplete, true);
    const impact = run("check-change-impact", [paths.impact]);
    assert.equal(impact.status, 0, impact.stderr);
    assert.equal(JSON.parse(impact.stdout).scope, "plan_only");
    assert.deepEqual(JSON.parse(impact.stdout).affected, ["shot"]);
    assert.deepEqual(await snapshot(directory), inputBefore);

    fixtures.review.reviews[0].status = "unknown";
    await writeFile(paths.review, JSON.stringify(fixtures.review));
    const unknownBefore = await snapshot(directory);
    const unresolved = run("check-shot-review", [paths.review]);
    assert.equal(unresolved.status, 2, unresolved.stderr);
    assert.equal(JSON.parse(unresolved.stdout).reviewComplete, false);
    assert.deepEqual(await snapshot(directory), unknownBefore);
    fixtures.impact.artifacts[1].dependencyCoverage = "unknown";
    await writeFile(paths.impact, JSON.stringify(fixtures.impact));
    const impactBefore = await snapshot(directory);
    const impactUnknown = run("check-change-impact", [paths.impact]);
    assert.equal(impactUnknown.status, 2, impactUnknown.stderr);
    assert.ok(JSON.parse(impactUnknown.stdout).needsReview.includes("shot"));
    assert.deepEqual(await snapshot(directory), impactBefore);
    for (const name of ["check-delivery", "check-video-plan", "check-shot-review", "check-change-impact"]) {
      await writeFile(paths.review, '{"status":"revise","status":"pass"}');
      const invalidBefore = await snapshot(directory);
      const invalid = run(name, [paths.review]);
      assert.equal(invalid.status, 1);
      if (name === "check-change-impact") {
        assert.equal(invalid.stderr, "");
        assert.equal(JSON.parse(invalid.stdout).valid, false);
        assert.match(JSON.parse(invalid.stdout).errors.map((error) => error.message).join("\n"), /Duplicate object key/u);
      } else assert.match(invalid.stderr, /Duplicate object key/u);
      assert.deepEqual(await snapshot(directory), invalidBefore);
    }
    assert.deepEqual(await snapshot(bundle), bundleBefore);
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test("actual enabled Skill installation matrix runs outside the repository without mutation", async (t) => {
  const repository = fileURLToPath(new URL("../", import.meta.url));
  const inventory = await createDistributionInventory(repository);
  for (const descriptor of inventory.skills) {
    for (const standalone of [false, true]) {
      await t.test(`${descriptor.name}: ${standalone ? "standalone Skill" : "full plugin"}`, async () => {
        await checkInstalledLayout(repository, descriptor.name, standalone);
      });
    }
  }
});
