import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateMarkdownFiles } from "../scripts/markdown-links.mjs";
import { repositoryRoot, validateRepository } from "../scripts/validate-repository.mjs";
import { FORMAT, NODE_TAGS, validateVideoWorkbook } from "../skills/cineweave-director/scripts/check-video-plan.mjs";

function videoBook() {
  const scope = { platform: "fixture", model: "fixture", surface: "fixture", mode: "t2v" };
  return { format: FORMAT, frameRate: { numerator: 24, denominator: 1 }, nodes: [{
    id: "S1", type: "video_t2v",
    prompt: [...new Set(["节点", "目标", "约束", ...NODE_TAGS.video_t2v])].map((tag) => `<${tag}>${tag === "节点" ? "S1" : "静止铜杯"}</${tag}>`).join("\n"),
    timing: { headFrames: 0, editFrames: 96, tailFrames: 0 },
    capability: { ...scope, status: "documented", evidence: "fixture:not-real-evidence", checkedAt: "2026-09-23" },
    durationPolicy: { scope, status: "fixture", source: "fixture:arithmetic", checkedAt: "2026-09-23", allowedMs: [4000] },
    referenceLimits: { scope, status: "fixture", source: "fixture:no-references", checkedAt: "2026-09-23", caps: { total: 0 } },
  }] };
}

test("invalid calendar declarations never produce a completed video declaration", () => {
  for (const value of ["2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "0000-01-01", "2026-1-01", "yesterday", 20260923]) {
    for (const field of ["capability", "durationPolicy", "referenceLimits"]) {
      const book = videoBook();
      book.nodes[0][field].checkedAt = value;
      const result = validateVideoWorkbook(book);
      assert.equal(result.declarationComplete, false, `${field}: ${value}`);
      if (field === "capability") assert.ok(result.pending.some((item) => item.code === "CAPABILITY_SCOPE"));
      else assert.equal(result.valid, false);
      assert.equal(result.capabilityVerified, false);
    }
  }
});

test("valid leap dates and ordinary dates preserve declaration-only semantics", () => {
  for (const date of ["2000-02-29", "2024-02-29", "2026-02-28", "2026-09-23"]) {
    const book = videoBook();
    for (const field of ["capability", "durationPolicy", "referenceLimits"]) book.nodes[0][field].checkedAt = date;
    const before = structuredClone(book);
    const result = validateVideoWorkbook(book);
    assert.equal(result.declarationComplete, true, date);
    assert.equal(result.capabilityVerified, false);
    assert.equal(result.mediaVerified, false);
    assert.deepEqual(book, before);
  }
});

test("all worksheet CLIs reject duplicate keys and malformed scalar strings before validation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cw-strict-json-"));
  try {
    const input = join(directory, "input.json");
    const documents = {
      "check-delivery": '{"frameRate":{"numerator":24,"denominator":1},"totalFrames":0,"totalFrames":24,"shots":[{"id":"S1","startFrame":0,"endFrame":24}]}',
      "check-shot-review": '{"source":{"type":"design","id":"draft","version":1},"mode":"focused","roles":["direction"],"shotIds":["S1"],"reviews":[{"role":"direction","shotId":"S1","status":"revise","status":"pass","criterion":"fixture","observation":"fixture","sourceLocator":"draft S1"}]}',
      "check-video-plan": JSON.stringify(videoBook()).replace('"editFrames":96', '"editFrames":0,"editFrames":96'),
    };
    for (const [name, raw] of Object.entries(documents)) {
      const cli = fileURLToPath(new URL(`../skills/cineweave-director/scripts/${name}.mjs`, import.meta.url));
      for (const [value, error] of [[raw, /Duplicate object key/u], ['{"note":"\\ud800"}', /unpaired high surrogate/u], ['{"number":1e400}', /finite IEEE-754/u]]) {
        await writeFile(input, value);
        const result = spawnSync(process.execPath, [cli, input], { cwd: directory, encoding: "utf8", timeout: 10000 });
        assert.equal(result.status, 1, `${name}: ${result.stderr}`);
        assert.match(result.stderr, error);
        assert.equal(result.stdout, "");
        assert.equal(await readFile(input, "utf8"), value);
      }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("local links resolve Chinese, repeated, encoded and explicit anchors, excluding code and footnote prose", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cw-markdown-"));
  try {
    const source = join(directory, "index.md"), target = join(directory, "guide.md");
    await writeFile(target, '# 人物情绪\n## 人物情绪\n## 人物情绪-1\n## 人物情绪\n\n摄影与声音\n---\n\n<a id="compat"></a>\n');
    await writeFile(source, '# 入口\n[自己](#入口)\n[人物](guide.md#人物情绪)\n[重复](guide.md#人物情绪-1)\n[碰撞](guide.md#人物情绪-1-1)\n[重复二](guide.md#人物情绪-2)\n[编码](guide.md#%E4%BA%BA%E7%89%A9%E6%83%85%E7%BB%AA)\n[旧锚点](guide.md#compat)\n[下划线标题](guide.md#摄影与声音)\n[引用][ref]\n[ref]: guide.md#人物情绪\n[^1]: 来源说明，不是路径。\n`[不是链接](missing.md)`\n```md\n[示例](missing.md)\n# 假标题\n```\n');
    const result = await validateMarkdownFiles(directory, ["index.md", "guide.md"]);
    assert.equal(result.fragments, 9);
    await writeFile(source, '[失效章节](guide.md#不存在)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[同文件失效](#不存在)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[假标题](guide.md#假标题)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[逃逸](../outside.md)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /escapes/u);
    await writeFile(source, '[坏编码](guide.md#%zz)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /invalid encoded/u);
    await writeFile(source, '[重命名前](guide.md#人物情绪)');
    await writeFile(target, '# 新标题\n');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("repository regression command ownership preserves release and source boundaries", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cw-repository-gates-"));
  const root = join(directory, "repository");
  const ignored = new Set([".git", ".build", "node_modules"]);
  try {
    await cp(repositoryRoot, root, {
      recursive: true,
      filter: (source) => !ignored.has(relative(repositoryRoot, source).split(sep)[0]),
    });
    const packagePath = join(root, "package.json");
    const workflowPath = join(root, ".github", "workflows", "validate.yml");
    const originalPackage = await readFile(packagePath, "utf8");
    const packageJson = JSON.parse(originalPackage);
    const regressionPaths = packageJson.scripts.test.slice("node --test ".length).split(" ");
    const originalWorkflow = await readFile(workflowPath, "utf8");
    const workflow = originalWorkflow.replace(`        run: ${packageJson.scripts.test}\n`, "        run: npm test\n");
    assert.match(workflow, /^        run: npm test$/mu);
    await writeFile(workflowPath, workflow);

    async function snapshot(path, prefix = "") {
      const files = {};
      for (const entry of await readdir(path, { withFileTypes: true })) {
        const key = `${prefix}${entry.name}`;
        const child = join(path, entry.name);
        if (entry.isDirectory()) Object.assign(files, await snapshot(child, `${key}/`));
        else files[key] = await readFile(child);
      }
      return files;
    }
    const before = await snapshot(root);
    await t.test("CI runs the package-owned regression command", async () => {
      await assert.doesNotReject(validateRepository(root));
    });
    await t.test("reviewed regression paths can be reordered without changing coverage", async () => {
      const changed = structuredClone(packageJson);
      changed.scripts.test = `node --test ${[...regressionPaths].reverse().join(" ")}`;
      const candidate = JSON.stringify(changed);
      try {
        await writeFile(packagePath, candidate);
        await assert.doesNotReject(validateRepository(root));
        assert.equal(await readFile(packagePath, "utf8"), candidate);
      } finally { await writeFile(packagePath, originalPackage); }
    });

    for (const lifecycle of ["pretest", "posttest"]) {
      await t.test(`rejects unregistered ${lifecycle} before npm execution`, async () => {
        const changed = structuredClone(packageJson);
        changed.scripts[lifecycle] = "node scripts/build-plugin-bundle.mjs";
        const candidate = JSON.stringify(changed);
        try {
          await writeFile(packagePath, candidate);
          await assert.rejects(validateRepository(root), /package\.json script inventory/u);
          assert.equal(await readFile(packagePath, "utf8"), candidate);
        } finally { await writeFile(packagePath, originalPackage); }
      });
    }

    const invalidCommands = [
      ["omitted regression", `node --test ${regressionPaths.slice(1).join(" ")}`],
      ["unregistered regression", `${packageJson.scripts.test} tests/unregistered.test.mjs`],
      ["duplicate regression", `${packageJson.scripts.test} ${regressionPaths[0]}`],
      ["bundle smoke in ordinary regressions", `${packageJson.scripts.test} tests/bundle-smoke.test.mjs`],
      ["shell suffix", `${packageJson.scripts.test} && node scripts/build-plugin-bundle.mjs`],
      ["extra spacing", packageJson.scripts.test.replace("node --test ", "node --test  ")],
      ["non-test Node command", packageJson.scripts.test.replace("node --test", "node --inspect --test")],
    ];
    for (const [label, command] of invalidCommands) {
      await t.test(`rejects ${label}`, async () => {
        const changed = structuredClone(packageJson);
        changed.scripts.test = command;
        const candidate = JSON.stringify(changed);
        try {
          await writeFile(packagePath, candidate);
          await assert.rejects(validateRepository(root), /package\.json (?:script test|test command|regression)/u);
          assert.equal(await readFile(packagePath, "utf8"), candidate);
        } finally { await writeFile(packagePath, originalPackage); }
      });
    }
    const invalidWorkflows = [
      ["unpinned checkout", /actions\/checkout@[a-f0-9]{40}/u, "actions/checkout@v4"],
      ["unpinned Node setup", /actions\/setup-node@[a-f0-9]{40}/u, "actions/setup-node@v4"],
      ["write permissions", "contents: read", "contents: write"],
      ["release tag bypass", "process.env.GITHUB_REF_NAME !== expected", "false"],
      ["source gate after npm lifecycle execution", "      - name: 校验源分发\n        run: node scripts/validate-repository.mjs\n      - name: 运行校验回归测试\n        run: npm test\n", "      - name: 运行校验回归测试\n        run: npm test\n      - name: 校验源分发\n        run: node scripts/validate-repository.mjs\n"],
    ];
    for (const [label, pattern, replacement] of invalidWorkflows) {
      await t.test(`rejects ${label}`, async () => {
        const candidate = workflow.replace(pattern, replacement);
        assert.notEqual(candidate, workflow);
        try {
          await writeFile(workflowPath, candidate);
          await assert.rejects(validateRepository(root), /read-only release-gate template/u);
          assert.equal(await readFile(workflowPath, "utf8"), candidate);
        } finally { await writeFile(workflowPath, workflow); }
      });
    }
    await t.test("unregistered executable cannot join regressions through filesystem discovery", async () => {
      const extra = join(root, "tests", "unregistered.test.mjs");
      const changed = structuredClone(packageJson);
      changed.scripts.test += " tests/unregistered.test.mjs";
      try {
        await writeFile(extra, "throw new Error('must not execute');\n");
        await writeFile(packagePath, JSON.stringify(changed));
        await assert.rejects(validateRepository(root), /tests source file set mismatch.*unregistered\.test\.mjs/u);
        assert.equal(await readFile(extra, "utf8"), "throw new Error('must not execute');\n");
      } finally {
        await rm(extra, { force: true });
        await writeFile(packagePath, originalPackage);
      }
    });
    assert.deepEqual(await snapshot(root), before, "repository validation must remain read-only");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
