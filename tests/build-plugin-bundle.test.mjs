import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSafeBuildRoot } from "../scripts/build-plugin-bundle.mjs";

test("bundle output cannot traverse an intermediate symlink or junction", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-build-safety-"));
  const buildRoot = join(root, ".build");
  const outsideRoot = join(root, "outside");
  const victimRoot = join(outsideRoot, "victim");
  const sentinelPath = join(victimRoot, "sentinel.txt");

  try {
    await mkdir(buildRoot, { recursive: true });
    await mkdir(victimRoot, { recursive: true });
    await writeFile(sentinelPath, "keep", "utf8");

    await assert.doesNotReject(() =>
      assertSafeBuildRoot(buildRoot, join(buildRoot, "cineweave-director")),
    );

    await symlink(
      outsideRoot,
      join(buildRoot, "redirect"),
      process.platform === "win32" ? "junction" : "dir",
    );

    await assert.rejects(
      () => assertSafeBuildRoot(buildRoot, join(buildRoot, "redirect", "victim")),
      /direct child directory of \.build/,
    );
    assert.equal(await readFile(sentinelPath, "utf8"), "keep");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// 仅检查知识和分发结构，不运行模型或判断媒体质量。
const cwSkillUrl = new URL("../skills/cineweave-director/", import.meta.url);
const cwNewReferences = [
  "references/optional/shot-design-workbench.md",
  "references/optional/generation-diagnostics.md",
];

function cwReadDocumentationJson(text, label) {
  const start = `<!-- ${label}:start -->`;
  const end = `<!-- ${label}:end -->`;
  assert.equal(text.split(start).length, 2, `${label} must have one start marker`);
  assert.equal(text.split(end).length, 2, `${label} must have one end marker`);
  const section = text.slice(text.indexOf(start) + start.length, text.indexOf(end));
  const match = section.match(/^\s*```json\s*\n([\s\S]*?)\n```\s*$/u);
  assert.ok(match, `${label} must contain exactly one JSON block`);
  return JSON.parse(match[1]);
}

async function cwDiagnosticFixture() {
  const text = await readFile(new URL(cwNewReferences[1], cwSkillUrl), "utf8");
  return {
    index: cwReadDocumentationJson(text, "diagnostic-index"),
    cases: JSON.parse(await readFile(new URL("evaluations/cinematic-cases.json", import.meta.url), "utf8")),
  };
}

test("cinematic guides are registered once using existing typed contexts", async () => {
  const lifecycle = JSON.parse(await readFile(new URL("reference-lifecycle.json", cwSkillUrl), "utf8"));
  const authority = JSON.parse(await readFile(new URL("contracts.json", cwSkillUrl), "utf8"));
  assert.deepEqual(new Set(lifecycle.contextCatalog.route), new Set(Object.keys(authority.routes)));
  const contexts = new Set(Object.values(lifecycle.contextCatalog).flat());
  for (const path of cwNewReferences) {
    const entries = lifecycle.references.filter((entry) => entry.path === path);
    assert.equal(entries.length, 1, path);
    assert.equal(entries[0].lifecycle, "optional");
    assert.ok(entries[0].loadContexts.length > 0);
    for (const context of entries[0].loadContexts) assert.ok(contexts.has(context), context);
    assert.ok((await readFile(new URL(path, cwSkillUrl), "utf8")).startsWith("# 可选参考："));
  }
});

test("cinematic diagnostic vocabulary has unique IDs and real route candidates", async () => {
  const { index } = await cwDiagnosticFixture();
  const authority = JSON.parse(await readFile(new URL("contracts.json", cwSkillUrl), "utf8"));
  assert.ok(Array.isArray(index) && index.length > 0);
  assert.equal(new Set(index.map((entry) => entry.id)).size, index.length);
  for (const entry of index) {
    assert.match(entry.id, /^CW-[A-Z]+(?:-[A-Z]+)*$/u);
    assert.ok(typeof entry.distinguish === "string" && entry.distinguish.trim().length > 0);
    assert.ok(Array.isArray(entry.ownerCandidates) && entry.ownerCandidates.length > 0);
    assert.equal(new Set(entry.ownerCandidates).size, entry.ownerCandidates.length);
    for (const route of entry.ownerCandidates) assert.ok(Object.hasOwn(authority.routes, route), route);
    assert.equal(Object.hasOwn(entry, "kind"), false, "worksheet data must not masquerade as a root artifact");
  }
});

test("cinematic evaluation definitions have concrete counterexamples and retain their initial state", async () => {
  const { cases } = await cwDiagnosticFixture();
  assert.ok(Array.isArray(cases) && cases.length >= 12);
  assert.equal(new Set(cases.map((entry) => entry.id)).size, cases.length);
  for (const entry of cases) {
    assert.match(entry.id, /^CD-E\d{2}$/u);
    assert.ok(typeof entry.request === "string" && entry.request.trim().length > 0);
    assert.equal(entry.status, "not_run");
    for (const key of ["must", "mustNot"]) {
      assert.ok(Array.isArray(entry[key]) && entry[key].length > 0);
      for (const statement of entry[key]) assert.ok(typeof statement === "string" && statement.trim().length > 0);
    }
    assert.equal(Object.hasOwn(entry, "score"), false, "unrun cases must not carry outcome scores");
  }
});

test("cinematic evaluation routes and diagnostic references resolve", async () => {
  const { index, cases } = await cwDiagnosticFixture();
  const ids = new Set(index.map((entry) => entry.id));
  const authority = JSON.parse(await readFile(new URL("contracts.json", cwSkillUrl), "utf8"));
  for (const entry of cases) {
    assert.ok(Array.isArray(entry.routes) && entry.routes.length > 0);
    assert.ok(Array.isArray(entry.diagnostics) && entry.diagnostics.length > 0);
    for (const route of entry.routes) assert.ok(Object.hasOwn(authority.routes, route), `${entry.id}: ${route}`);
    for (const id of entry.diagnostics) assert.ok(ids.has(id), `${entry.id}: ${id}`);
  }
});

test("cinematic research links pin revisions instead of moving branches", async () => {
  for (const path of cwNewReferences) {
    const text = await readFile(new URL(path, cwSkillUrl), "utf8");
    const links = [...text.matchAll(/https:\/\/github\.com\/[^\s)]+/gu)].map((match) => match[0]);
    assert.ok(links.length > 0);
    for (const link of links) assert.match(link, /\/(?:blob|tree)\/[a-f0-9]{40}(?:\/|$)/u);
  }
});

const cwVideoGuides = ["video-platform-adaptation.md", "tagged-video-nodes.md", "video-performance-direction.md", "video-timing-and-handles.md"];
test("video guides are distributed once with known typed load contexts", async () => {
  const lifecycle = JSON.parse(await readFile(new URL("reference-lifecycle.json", cwSkillUrl), "utf8"));
  const known = new Set(Object.values(lifecycle.contextCatalog).flat());
  for (const name of cwVideoGuides) {
    const path = `references/optional/${name}`;
    const entries = lifecycle.references.filter((r) => r.path === path);
    assert.equal(entries.length, 1); assert.equal(entries[0].lifecycle, "optional");
    for (const context of entries[0].loadContexts) assert.ok(known.has(context));
    assert.ok((await readFile(new URL(path, cwSkillUrl), "utf8")).startsWith("# 可选参考："));
  }
});
test("node guide documents every helper type and links to the bundled read-only helper", async () => {
  const { NODE_TAGS } = await import(new URL("scripts/check-video-plan.mjs", cwSkillUrl));
  const guide = await readFile(new URL("references/optional/tagged-video-nodes.md", cwSkillUrl), "utf8");
  for (const type of Object.keys(NODE_TAGS)) assert.ok(guide.includes(`\`${type}\``), type);
  assert.ok(guide.includes("../../scripts/check-video-plan.mjs"));
});

// 中文呈现与兼容性测试；不运行模型，不对媒体质量评分。
import { spawnSync as cwZhSpawn } from "node:child_process";
import { fileURLToPath as cwZhPath } from "node:url";
import { readFileSync as cwZhRead } from "node:fs";
import { withChineseVideoSummary as cwZhVideo, validateVideoWorkbook as cwZhValidate } from "../skills/cineweave-director/scripts/check-video-plan.mjs";
import { withChineseDeliverySummary as cwZhDelivery, checkDelivery as cwZhCheck, countText as cwZhCount } from "../skills/cineweave-director/scripts/check-delivery.mjs";
const cwZhRoot = new URL("../", import.meta.url);
const cwZhReadText = (path) => cwZhRead(new URL(path, cwZhRoot), "utf8");
const cwZhFixture = () => ({frameRate:{numerator:24,denominator:1},totalFrames:24,shots:[{id:"S1",startFrame:0,endFrame:24}],subtitles:[{id:"D1",startFrame:0,endFrame:24,text:"别走。",expectedHanCharacters:2}]});

test("中文入口保留激活标识并声明语言和精确文案规则", () => {
  const t=cwZhReadText("skills/cineweave-director/SKILL.md");
  assert.ok(t.startsWith("---\nname: cineweave-director\n"));
  const d=JSON.parse(t.match(/^description: (.+)$/m)[1]);
  assert.ok(/适用于/.test(d));assert.ok(d.length<=1024);assert.ok(t.split("\n").length<=500);
  for(const key of ["简体中文","台词","哈希","不生成","节点"]) assert.ok(t.includes(key),key);
});
test("知识清单与中文标题一致，合并指南已去重", () => {
  const l=JSON.parse(cwZhReadText("skills/cineweave-director/reference-lifecycle.json"));
  assert.ok(l.references.some(x=>x.path === "references/optional/prompt-detail-standard.md"));assert.equal(new Set(l.references.map(x=>x.path)).size,l.references.length);
  for(const r of l.references){const s=cwZhReadText("skills/cineweave-director/"+r.path);assert.match(s,/^# .*\p{Script=Han}/mu);assert.ok(!/^#+ (?:Optional|Route|Working|Quality)[: ]/mu.test(s));}
});
test("中文化不重命名 12 条机器路由与 52 种根契约", () => {
  const c=JSON.parse(cwZhReadText("skills/cineweave-director/contracts.json"));
  assert.equal(Object.keys(c.routes).length,12);assert.equal(c.contractKinds.length,52);
  assert.ok(Object.hasOwn(c.routes,"shot_direction"));assert.ok(c.contractKinds.includes("cineweave_codex_prompt_projection_plan"));
  for(const x of [...Object.keys(c.routes),...c.contractKinds])assert.ok(!/\p{Script=Han}/u.test(x));
});
test("插件、市场和 agent 中文展示信息一致，协议标识保留", () => {
  const p=JSON.parse(cwZhReadText(".codex-plugin/plugin.json"));
  const m=JSON.parse(cwZhReadText(".agents/plugins/marketplace.json"));
  const a=cwZhReadText("skills/cineweave-director/agents/openai.yaml");
  assert.equal(p.name,"cineweave-director");assert.equal(p.version,"3.2.0");assert.equal(p.interface.displayName,"CineWeave 导演");
  assert.equal(m.interface.displayName,p.interface.displayName);assert.equal(m.plugins[0].source.ref,"v3.2.0");
  assert.ok(a.includes(JSON.stringify(p.interface.defaultPrompt[0])));assert.ok(a.includes(JSON.stringify(p.interface.shortDescription)));
});
test("视频中文摘要保留原始诊断并不修改输入", () => {
  const raw={valid:false,errors:[{code:"ENDPOINT_HANDLE_CONFLICT",message:"original",nodeId:"S1"}],warnings:[],pending:[]};
  const old=structuredClone(raw),x=cwZhVideo(raw);assert.deepEqual(raw,old);assert.deepEqual(x.errors,old.errors);
  assert.match(x.localization.errors[0].message,/出点/);assert.equal(x.localization.errors[0].detail,"original");
  assert.equal(x.localization.locale,"zh-CN");
});
test("动态政策作用域诊断有中文对应而非静默漏译", () => {
  for(const code of ["DURATION_SCOPE","REFERENCE_SCOPE","DURATION_SCOPE_MISMATCH","REFERENCE_SCOPE_MISMATCH"]){
    const x=cwZhVideo({valid:false,errors:[{code,message:"detail"}],warnings:[],pending:[]});
    assert.ok(!x.localization.errors[0].message.includes("未识别"),code);
  }
});
test("未知诊断保留原始代码和细节，不虚构具体原因", () => {
  const x=cwZhVideo({valid:false,errors:[{code:"FUTURE_CODE",message:"future",nodeId:"N"}]});
  assert.equal(x.localization.errors[0].code,"FUTURE_CODE");assert.equal(x.localization.errors[0].detail,"future");assert.match(x.localization.errors[0].message,/未识别/);
});
test("视频检查未核验媒体和能力的标志在中文展示中不变化", () => {
  const raw=cwZhValidate({format:"cineweave-video-workbook/v1",canonical:false,frameRate:{numerator:24,denominator:1},nodes:[{id:"B1",type:"brief",prompt:"<节点>B1</节点><项目>原创短片</项目><目标>设计草稿</目标><约束>不执行生成</约束>"}]});
  const x=cwZhVideo(raw);assert.equal(x.capabilityVerified,false);assert.equal(x.mediaVerified,false);assert.equal(x.providerExecution,false);
});
test("交付中文摘要不改时间、SRT 或准确台词", () => {
  const plan=cwZhFixture(),before=structuredClone(plan),raw=cwZhCheck(plan),x=cwZhDelivery(raw);
  assert.deepEqual(plan,before);assert.deepEqual(x.srt,raw.srt);assert.equal(x.subtitles[0].text,"别走。");assert.equal(x.localization.locale,"zh-CN");assert.deepEqual(x.errors,raw.errors);
});
test("交付失败仍返回空 SRT 并给中文解释", () => {
  const p=cwZhFixture();p.shots[0].startFrame=1;const raw=cwZhCheck(p),x=cwZhDelivery(raw);
  assert.equal(x.valid,false);assert.equal(x.srt,null);assert.equal(x.errors.length,x.localization.errors.length);assert.match(x.localization.errors[0].message,/缺口/);
});
test("Unicode 文案不因中文默认而被规范化改写", () => {
  assert.deepEqual(cwZhCount("e\u0301👩‍👩‍👧‍👦"),{hanCharacters:0,codePoints:9,graphemes:2});
  assert.deepEqual(cwZhCount("值得专程回来！"),{hanCharacters:6,codePoints:7,graphemes:7});
});
for(const script of ["check-video-plan.mjs","check-delivery.mjs"]){
  test(`${script} 的真实 CLI 显示中文帮助`, () => {
    const r=cwZhSpawn(process.execPath,[cwZhPath(new URL("skills/cineweave-director/scripts/"+script,cwZhRoot)),"--help"],{encoding:"utf8"});
    assert.equal(r.status,0);assert.match(r.stdout,/用法/);assert.match(r.stdout,/只读/);
  });
}
test("真实字数 CLI 保留机器计数并附中文说明", () => {
  const r=cwZhSpawn(process.execPath,[cwZhPath(new URL("skills/cineweave-director/scripts/check-delivery.mjs",cwZhRoot)),"--text","值得专程回来"],{encoding:"utf8"});
  assert.equal(r.status,0);const x=JSON.parse(r.stdout);assert.equal(x.hanCharacters,6);assert.equal(x.localization.locale,"zh-CN");
});
// 覆盖活动契约资源的自然语言，保留真实协议参数和色彩配置名称。
test("所有契约说明与示例长文本使用中文", async () => {
  const index = JSON.parse(cwZhReadText("skills/cineweave-director/resources/contracts/index.json"));
  const schemas = [...index.contracts.map(x => x.schema), ...index.supportSchemas.map(x => x.schema)];
  const base = "skills/cineweave-director/resources/contracts/";
  const names = new Set(["ACES SDR Video", "Rec.709 SDR Master", "ACES Rec.709 Video"]);
  const failures = [];
  function inspect(value, file, schema, pointer = "") {
    if (Array.isArray(value)) return value.forEach((item, i) => inspect(item, file, schema, `${pointer}/${i}`));
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        const path = `${pointer}/${key}`;
        if (schema && ["title", "description", "$comment"].includes(key) && typeof item === "string" && !/\p{Script=Han}/u.test(item)) failures.push(`${file}${path}: ${item}`);
        inspect(item, file, schema, path);
      }
      return;
    }
    if (schema || typeof value !== "string" || /\p{Script=Han}/u.test(value) || !/\s/u.test(value)) return;
    if (names.has(value) || value.startsWith("--") || /^https?:\/\/\S+$/u.test(value)) return;
    if ((value.match(/[A-Za-z]+/gu) ?? []).length >= 3) failures.push(`${file}${pointer}: ${value}`);
  }
  for (const file of schemas) inspect(JSON.parse(cwZhReadText(base + file)), file, true);
  for (const { example } of index.contracts) inspect(JSON.parse(cwZhReadText(base + example)), example, false);
  assert.deepEqual(failures, [], "检查标题、说明和提示词正文；机器枚举及单词描述还需结合 schema 审阅");
});
