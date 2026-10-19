import test from "node:test";
import assert from "node:assert/strict";
import { cp, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rm, rmdir, symlink, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildPluginBundle } from "../scripts/build-plugin-bundle.mjs";
import { createDistributionInventory, repositoryRoot, validateAuthoringSources, validateBundle, validateRepository } from "../scripts/validate-repository.mjs";
import { syncSkillExports } from "../scripts/sync-skill-exports.mjs";
import { validatePayload } from "../scripts/validate-output.mjs";
import { sha256Canonical } from "../scripts/canonical-json.mjs";

const director = "cineweave-director";
const platform = "cineweave-platform";
const specialistNames = [platform, "cineweave-reference", "cineweave-review"];
const leafTarget = (name) => ({ type: "skill", name });

// Fixtures deliberately select their own catalog stage. Future enabled source
// copies are never treated as another author authority or copied into P1/P2.
async function resetFixtureStage(source) {
  const catalogPath = join(source, "skill-catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  for (const name of specialistNames) catalog.skills[name].enabled = false;
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  for (const name of specialistNames) {
    for (const directory of ["skills", "skill-sources"]) {
      const target = join(source, directory, name);
      const containment = relative(source, target);
      assert.ok(containment && !isAbsolute(containment) && !containment.startsWith(".."));
      const stat = await lstat(target).catch((error) => { if (error.code === "ENOENT") return null; throw error; });
      if (stat) {
        assert.equal(stat.isSymbolicLink(), false);
        const actual = relative(await realpath(source), await realpath(target));
        assert.ok(actual && !isAbsolute(actual) && !actual.startsWith(".."));
      }
      await rm(target, { recursive: true, force: true });
    }
  }
  const authors = join(source, "skill-sources");
  if (await lstat(authors).catch((error) => { if (error.code === "ENOENT") return null; throw error; })) await rmdir(authors);
  const adaptDevelopmentLinks = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (directory === source && ["skills", "skill-sources", ".git", ".build", "node_modules"].includes(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await adaptDevelopmentLinks(path);
      else if (entry.name.endsWith(".md")) {
        const text = await readFile(path, "utf8");
        const adapted = text.replace(/(?:skills|skill-sources)\/cineweave-(?:platform|reference|review)\//gu, `skills/${director}/`);
        if (adapted !== text) await writeFile(path, adapted);
      }
    }
  };
  await adaptDevelopmentLinks(source);
}

async function fixture(action) {
  const directory = await mkdtemp(join(tmpdir(), "cw-skill-bundles-"));
  const source = join(directory, "source");
  try {
    await cp(repositoryRoot, source, { recursive: true, filter: (path) => {
      const first = relative(repositoryRoot, path).split(sep)[0];
      return ![".git", ".build", "node_modules"].includes(first);
    } });
    await resetFixtureStage(source);
    await action({ directory, source });
  } finally {
    const containment = relative(tmpdir(), directory);
    assert.ok(containment && !isAbsolute(containment) && !containment.startsWith(".."));
    await rm(directory, { recursive: true, force: true });
  }
}

async function enableSpecialist(source, name = platform) {
  const catalogPath = join(source, "skill-catalog.json");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  catalog.skills[name].enabled = true;
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
  const author = join(source, "skill-sources", name);
  await mkdir(join(author, "agents"), { recursive: true });
  await writeFile(join(author, "SKILL.md"), `---\nname: ${name}\ndescription: "适用于隔离测试中的专业任务。"\n---\n# 专业测试入口\n\n## 创作约定\n\n[共享工作模型](references/core/operating-model.md)\n`);
  await writeFile(join(author, "agents", "openai.yaml"), `interface:\n  display_name: "专业测试"\n  short_description: "隔离测试专用专业入口"\n  default_prompt: "使用 $${name} 检查任务。"\npolicy:\n  allow_implicit_invocation: false\n`);
  return author;
}

async function snapshot(root, prefix = "") {
  const hashes = {};
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name), key = `${prefix}${entry.name}`;
    assert.equal(entry.isSymbolicLink(), false);
    if (entry.isDirectory()) Object.assign(hashes, await snapshot(path, `${key}/`));
    else hashes[key] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
  return hashes;
}

async function altered(path, mutate, action) {
  const original = await readFile(path);
  try { await writeFile(path, mutate(original.toString("utf8"))); await action(); }
  finally { await writeFile(path, original); }
}

test("P1 sync is a zero-child no-op and plugin/leaf preserve the canonical profile", async () => {
  const productionCatalog = await readFile(join(repositoryRoot, "skill-catalog.json"));
  await fixture(async ({ directory, source }) => {
    const before = await snapshot(source);
    for (const check of [false, true]) {
      const result = await syncSkillExports({ sourceRoot: source, check });
      assert.equal(result.childCount, 0);
      assert.equal(result.filesChecked, 0);
      assert.equal(result.filesUpdated, 0);
    }
    assert.deepEqual(await snapshot(source), before);
    await assert.rejects(lstat(join(source, "skill-sources")), { code: "ENOENT" });
    const inventory = await createDistributionInventory(source);
    assert.equal(inventory.files.length, 166);
    assert.equal(inventory.skills.length, 1);
    assert.equal(inventory.skills[0].files.length, 164);
    assert.ok(inventory.exports.every((entry) => entry.source === entry.destination));
    const plugin = await buildPluginBundle(undefined, { sourceRoot: source });
    assert.equal(plugin.files, 166);
    const leaf = await buildPluginBundle(undefined, { sourceRoot: source, target: leafTarget(director) });
    assert.equal(leaf.files, 165);
    assert.equal(leaf.bundle, join(source, ".build", `${director}-skill`));
    assert.equal(leaf.roots, 52); assert.equal(leaf.schemas, 54);
    assert.equal(leaf.examples, 52); assert.equal(leaf.references, 47);
    assert.equal(leaf.skills.length, 1); assert.equal(leaf.byteIdentical, true);
    await assert.rejects(lstat(join(leaf.bundle, ".codex-plugin")), { code: "ENOENT" });
    await assert.rejects(validateBundle(leaf.bundle, source), /Bundle distribution file set/u);
    await assert.rejects(createDistributionInventory(source, { target: leafTarget(platform) }), /disabled/u);
    await verifyLeafSemantics(leaf.bundle, directory);
    await verifyInstalledHelpers(leaf.bundle, directory);
  });
  assert.ok((await readFile(join(repositoryRoot, "skill-catalog.json"))).equals(productionCatalog));
});

test("synthetic P2 sync, full plugin and professional leaf share one canonical authority", async (t) => {
  await fixture(async ({ source }) => {
    const author = await enableSpecialist(source);
    const readme = join(source, "README.md");
    await writeFile(readme, `${await readFile(readme, "utf8")}\n[平台入口](skills/${platform}/SKILL.md)\n`);
    const preflight = await validateAuthoringSources(source);
    assert.deepEqual(preflight.catalogModel.enabledSkills, [director, platform]);
    await assert.rejects(validateRepository(source), /skills\/ Skill directory set mismatch.*missing/u);
    const synced = await syncSkillExports({ sourceRoot: source });
    assert.equal(synced.childCount, 1); assert.equal(synced.filesUpdated, 164);
    assert.equal((await syncSkillExports({ sourceRoot: source, check: true })).filesChecked, 164);
    const checked = await validateRepository(source);
    assert.equal(checked.files, 330); assert.equal(checked.skills.length, 2);
    assert.equal(checked.skills.find((skill) => skill.name === platform).actualKinds.length, 1);
    const inventory = await createDistributionInventory(source);
    const child = inventory.skills.find((skill) => skill.name === platform);
    assert.equal(child.exports.find((entry) => entry.destination.endsWith("/SKILL.md")).source, `skill-sources/${platform}/SKILL.md`);
    assert.equal(child.exports.find((entry) => entry.destination.endsWith("/contracts.json")).source, `skills/${director}/contracts.json`);
    const plugin = await buildPluginBundle(undefined, { sourceRoot: source });
    const leaf = await buildPluginBundle(undefined, { sourceRoot: source, target: leafTarget(platform) });
    assert.equal(plugin.files, 330); assert.equal(plugin.totals.roots, 104);
    assert.equal(leaf.files, 165); assert.equal(leaf.skills[0].name, platform);
    assert.equal(leaf.skills[0].roots, 52);
    assert.ok((await readFile(join(leaf.bundle, "SKILL.md"))).equals(await readFile(join(author, "SKILL.md"))));
    assert.ok((await readFile(join(leaf.bundle, "contracts.json"))).equals(await readFile(join(source, "skills", director, "contracts.json"))));
    const bundleChild = join(plugin.bundle, "skills", platform);
    for (const [label, file, mutate, diagnostic] of [
      ["sibling dependency", "SKILL.md", (text) => `${text}\n[兄弟入口](../${director}/SKILL.md)\n`, /escapes the validation root/u],
      ["broken local fragment", "SKILL.md", (text) => `${text}\n[坏锚点](references/core/operating-model.md#missing-anchor)\n`, /broken local fragment/u],
      ["wrong identity", "SKILL.md", (text) => text.replace(`name: ${platform}`, `name: ${director}`), /name must match/u],
      ["wrong default caller", "agents/openai.yaml", (text) => text.replace(`$${platform}`, `$${director}`), /invoke only/u],
      ["shared reference drift", "references/core/operating-model.md", (text) => `${text}\n测试漂移\n`, /differs from source bytes/u],
      ["helper drift", "scripts/parse-json.mjs", (text) => `${text}\n// drift\n`, /differs from source bytes/u],
      ["schema hash drift", "resources/contracts/schemas/common.schema.json", (text) => `${text}\n`, /schema hash mismatch/iu],
      ["index hash lie", "resources/contracts/index.json", (text) => {
        const document = JSON.parse(text); document.contracts[0].schemaSha256 = "0".repeat(64); return JSON.stringify(document) + "\n";
      }, /Schema hash mismatch/u],
    ]) await t.test(label, async () => {
      await altered(join(bundleChild, file), mutate, () => assert.rejects(validateBundle(plugin.bundle, source), diagnostic));
    });
    await t.test("internal capability cannot silently become an implicit user entry", async () => {
      await altered(join(author, "agents/openai.yaml"), (text) => text.replace("allow_implicit_invocation: false", "allow_implicit_invocation: true"),
        () => assert.rejects(validateAuthoringSources(source), /Only the director workflow entry/u));
    });
    await t.test("the unified workflow entry must remain implicitly available", async () => {
      await altered(join(source, "skills", director, "agents/openai.yaml"), (text) => text.replace("allow_implicit_invocation: true", "allow_implicit_invocation: false"),
        () => assert.rejects(validateAuthoringSources(source), /Only the director workflow entry/u));
    });
    await t.test("missing schema, extra file and extra empty directory are rejected", async () => {
      const path = join(bundleChild, "resources/contracts/schemas/common.schema.json");
      const data = await readFile(path); await rm(path);
      await assert.rejects(validateBundle(plugin.bundle, source), /missing:.*common.schema.json/u);
      await writeFile(path, data);
      const extra = join(bundleChild, "extra.json"); await writeFile(extra, "{}\n");
      await assert.rejects(validateBundle(plugin.bundle, source), /extra:.*extra.json/u); await rm(extra);
      const empty = join(bundleChild, "unregistered-empty"); await mkdir(empty);
      await assert.rejects(validateBundle(plugin.bundle, source), /Unexpected directory/u); await rmdir(empty);
    });
    await t.test("a bundle cannot expand its whitelist with a catalog or unknown Skill", async () => {
      const catalog = join(plugin.bundle, "skill-catalog.json"); await writeFile(catalog, "{}\n");
      await assert.rejects(validateBundle(plugin.bundle, source), /extra:.*skill-catalog.json/u); await rm(catalog);
      const unknown = join(plugin.bundle, "skills", "cineweave-unknown"); await mkdir(unknown);
      await assert.rejects(validateBundle(plugin.bundle, source), /Unexpected directory/u); await rmdir(unknown);
    });
    await t.test("stale child requires explicit sync and build keeps prior output on source failure", async () => {
      const path = join(source, "skills", platform, "scripts", "parse-json.mjs");
      const pluginBefore = await snapshot(plugin.bundle);
      await altered(path, (text) => `${text}\n// stale\n`, async () => {
        await assert.rejects(syncSkillExports({ sourceRoot: source, check: true }), /stale/u);
        await assert.rejects(validateRepository(source), /differs from source bytes/u);
        await assert.rejects(buildPluginBundle(plugin.bundle, { sourceRoot: source }), /differs from source bytes/u);
        assert.deepEqual(await snapshot(plugin.bundle), pluginBefore);
        assert.equal((await syncSkillExports({ sourceRoot: source })).filesUpdated, 1);
      });
    });
    await t.test("sync refuses unknown file or empty directory before any write or deletion", async () => {
      const generated = join(source, "skills", platform);
      const extraFile = join(generated, "unexpected.txt"); await writeFile(extraFile, "keep\n");
      const before = await snapshot(generated);
      await assert.rejects(syncSkillExports({ sourceRoot: source }), /Unregistered derived Skill file/u);
      assert.deepEqual(await snapshot(generated), before); await rm(extraFile);
      const empty = join(generated, "unregistered-empty"); await mkdir(empty);
      await assert.rejects(syncSkillExports({ sourceRoot: source }), /Unregistered derived Skill directory/u);
      assert.equal((await lstat(empty)).isDirectory(), true); await rmdir(empty);
    });
    await t.test("authoring whitelist rejects extras, inactive roots and symbolic source entries", async () => {
      const extra = join(author, "unknown.md"); await writeFile(extra, "# 不登记\n");
      await assert.rejects(validateAuthoringSources(source), /author source file set mismatch.*extra/u); await rm(extra);
      const empty = join(author, "unregistered-empty"); await mkdir(empty);
      await assert.rejects(validateAuthoringSources(source), /Unexpected directory/u); await rmdir(empty);
      const inactive = join(source, "skill-sources", "cineweave-review"); await mkdir(inactive);
      await assert.rejects(validateAuthoringSources(source), /Unexpected skill-sources/u); await rmdir(inactive);
      const link = join(author, "linked");
      await symlink(join(source, "skills", director), link, process.platform === "win32" ? "junction" : "dir");
      await assert.rejects(validateAuthoringSources(source), /Symbolic links and junctions/u); await rm(link);
    });
    await t.test("author metadata cannot silently take the director identity", async () => {
      await altered(join(author, "SKILL.md"), (text) => text.replace(`name: ${platform}`, `name: ${director}`),
        () => assert.rejects(validateAuthoringSources(source), /name must match/u));
      await altered(join(author, "agents/openai.yaml"), (text) => text.replace(`$${platform}`, `$${director}`),
        () => assert.rejects(validateAuthoringSources(source), /invoke only/u));
    });
    assert.equal((await validateBundle(leaf.bundle, source, { target: leafTarget(platform) })).byteIdentical, true);
  });
});

test("build and validate CLI reject duplicate, incomplete and unknown flags", () => {
  for (const [script, argumentSets, status] of [
    ["build-plugin-bundle.mjs", [["--skill"], ["--output", "x", "--output", "y"], ["--unknown", "x"]], 1],
    ["validate-repository.mjs", [["--skill", director], ["--bundle"], ["--bundle", "x", "--bundle", "y"], ["--unknown", "x"]], 2],
  ]) for (const args of argumentSets) {
    const result = spawnSync(process.execPath, [join(repositoryRoot, "scripts", script), ...args], { encoding: "utf8", timeout: 10000 });
    assert.ifError(result.error); assert.equal(result.status, status, result.stderr); assert.match(result.stderr, /用法/u);
  }
});

test("a materialized synthetic P4 source resets to explicit P1/P2 fixture stages", async () => {
  await fixture(async ({ source }) => {
    for (const name of specialistNames) await enableSpecialist(source, name);
    const readme = join(source, "README.md");
    await writeFile(readme, `${await readFile(readme, "utf8")}\n[平台](skills/${platform}/SKILL.md)\n[审核](skills/cineweave-review/SKILL.md)\n[参考作者](skill-sources/cineweave-reference/agents/openai.yaml)\n`);
    assert.equal((await syncSkillExports({ sourceRoot: source })).filesUpdated, 492);
    const p4 = await validateRepository(source);
    assert.equal(p4.files, 658); assert.equal(p4.skills.length, 4);
    await resetFixtureStage(source);
    const p1 = await validateRepository(source);
    assert.equal(p1.files, 166); assert.deepEqual(p1.enabledSkills, [director]);
    await assert.rejects(lstat(join(source, "skill-sources")), { code: "ENOENT" });
    await enableSpecialist(source);
    assert.equal((await syncSkillExports({ sourceRoot: source })).filesUpdated, 164);
    assert.equal((await validateRepository(source)).files, 330);
  });
});

async function verifyLeafSemantics(leaf, directory) {
  const resources = join(leaf, "resources", "contracts");
  const load = async (name) => JSON.parse(await readFile(join(resources, "examples", `${name}.json`), "utf8"));
  for (const [stem, mutate, diagnostic] of [
    ["prompt-projection-plan", (p) => { p.renderedPrompt.copyText = "错误替换正文"; }, /copyText/u],
    ["capability-resolution-plan", (p) => { p.candidates[0].status = "eligible"; }, /cannot be eligible/u],
    ["shot-compiler-plan", (p) => { p.handoffs[1].ownerRoute = "scene"; }, /not owned by scene/u],
    ["workflow-plan", (p) => { p.steps[0].outputKinds = ["cineweave_codex_script_scene"]; }, /owned|produce/u],
    ["sequence-rhythm-spec", (p) => { p.shotWindows[0].startFrame = p.shotWindows[0].endFrame + 1; }, /startFrame must not exceed/u],
    ["repair-plan", (p) => { p.status = "approved"; p.humanGate.status = "rejected"; }, /approved|humanGate/u],
  ]) {
    const schema = join(resources, "schemas", `${stem}.schema.json`), payload = await load(stem);
    const before = structuredClone(payload), baseline = await validatePayload(schema, payload);
    assert.equal(baseline.valid, true, baseline.errors.join("\n")); assert.deepEqual(payload, before);
    if (["shot-compiler-plan", "sequence-rhythm-spec", "repair-plan"].includes(stem)) assert.ok(baseline.unverified.length > 0);
    mutate(payload); const invalid = await validatePayload(schema, payload);
    assert.equal(invalid.valid, false, stem); assert.match(invalid.errors.join("\n"), diagnostic);
    const input = join(directory, `${stem}.json`); await writeFile(input, JSON.stringify(payload));
    const inputBefore = await readFile(input);
    const cli = spawnSync(process.execPath, [join(repositoryRoot, "scripts", "validate-output.mjs"), schema, input], {
      cwd: directory, encoding: "utf8", timeout: 10000, env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
    });
    assert.ifError(cli.error); assert.equal(cli.status, 2, stem); assert.ok((await readFile(input)).equals(inputBefore));
  }
  const compiler = await load("shot-compiler-plan"), manifest = await load("cinematic-skill-manifest");
  compiler.cinematicSkillManifestRef = { kind: manifest.kind, id: manifest.cinematicSkillManifestId,
    version: manifest.version, contentHash: sha256Canonical(manifest) };
  const binding = { ref: structuredClone(compiler.cinematicSkillManifestRef), document: manifest };
  const schema = join(resources, "schemas", "shot-compiler-plan.schema.json");
  assert.equal((await validatePayload(schema, compiler, { artifacts: [binding] })).valid, true);
  for (const mutate of [
    (b) => { b.document.version += 1; },
    (b) => { b.document.cinematicSkillManifestId = "manifest.wrong"; },
    (b) => { b.document.skills = []; },
  ]) {
    const candidate = structuredClone(binding); mutate(candidate);
    assert.equal((await validatePayload(schema, compiler, { artifacts: [candidate] })).valid, false);
  }
  const summary = { kind: manifest.kind, cinematicSkillManifestId: manifest.cinematicSkillManifestId, version: manifest.version };
  const summaryRef = { ...compiler.cinematicSkillManifestRef, contentHash: sha256Canonical(summary) };
  const forged = { ...compiler, cinematicSkillManifestRef: summaryRef };
  const result = await validatePayload(schema, forged, { artifacts: [{ ref: summaryRef, document: summary }] });
  assert.equal(result.valid, false); assert.match(result.errors.join("\n"), /upstream|contract body|schema/iu);
}

async function verifyInstalledHelpers(leaf, directory) {
  const installed = join(directory, "installed-leaf"); await cp(leaf, installed, { recursive: true });
  const before = await snapshot(installed), helperRoot = join(installed, "scripts");
  const run = (name, args) => spawnSync(process.execPath, [join(helperRoot, name), ...args], {
    cwd: directory, encoding: "utf8", timeout: 10000, env: { ...process.env, NODE_PATH: "", NODE_OPTIONS: "" },
  });
  const count = run("check-delivery.mjs", ["--text", "值得专程回来"]);
  assert.ifError(count.error); assert.equal(count.status, 0, count.stderr); assert.equal(JSON.parse(count.stdout).hanCharacters, 6);
  const input = join(directory, "video-book.json");
  await writeFile(input, JSON.stringify({ format: "cineweave-video-workbook/v1", frameRate: { numerator: 24, denominator: 1 },
    nodes: [{ id: "B1", type: "brief", prompt: "<节点>B1</节点><项目>原创短片</项目><目标>设计草稿</目标><约束>不执行生成</约束>" }] }));
  const inputBefore = await readFile(input), video = run("check-video-plan.mjs", [input]);
  assert.ifError(video.error); assert.equal(video.status, 0, video.stderr);
  const result = JSON.parse(video.stdout); assert.equal(result.mediaVerified, false); assert.equal(result.providerExecution, false);
  assert.ok((await readFile(input)).equals(inputBefore));
  const audio = await import(pathToFileURL(join(helperRoot, "check-audio-returns.mjs")).href);
  const parser = await import(pathToFileURL(join(helperRoot, "parse-json.mjs")).href);
  assert.ok(Object.keys(audio).length > 0); assert.ok(Object.keys(parser).length > 0);
  assert.deepEqual(await snapshot(installed), before);
}
