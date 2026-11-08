import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readStyleCards, parseStyleDocument, STYLE_DOCUMENTS, formatStyleCards } from "../skills/cineweave-director/scripts/read-style-card.mjs";
import { selectSection } from "../scripts/measure-resource-load.mjs";

const root = new URL("../skills/cineweave-director/", import.meta.url);
const documents = await Promise.all(STYLE_DOCUMENTS.map(async path => ({path, text: await readFile(new URL(path, root), "utf8")})));
const inventory = documents.flatMap(doc => parseStyleDocument(doc.text, doc.path));

test("all 68 ID and name selections preserve complete authored formula bytes and exact source lines", async () => {
  assert.equal(inventory.length, 68);
  for (const card of inventory) {
    const selected = await readStyleCards([card.id, card.name]);
    assert.equal(selected.length, 1);
    assert.equal(selected[0].text, card.text);
    const doc = documents.find(value => value.path === card.path).text;
    assert.equal(doc.split("\n").slice(card.startLine - 1, card.endLine).join("\n") + (card.text.endsWith("\n") ? "\n" : ""), card.text);
    assert.ok(card.revision >= 1);
  }
});

test("name punctuation and directory aliases resolve to current independent cards without restoring retired makeup", async () => {
  const selected = await readStyleCards(["宋韵清雅古偶柔光", "杏露薄妆 清雅日常"]);
  assert.deepEqual(selected.map(card => `${card.id}@r${card.revision}`), ["CG11@r2", "MU14@r3"]);
  assert.deepEqual((await readStyleCards(["章节主色·东方写意（r1）"])).map(c => `${c.id}@r${c.revision}`), ["CG05@r2"]);
  const [current] = await readStyleCards(["黛眉朱砂·古城端丽"]);
  assert.equal(current.revision, 3);
  assert.equal(current.name, "杏露薄妆·清雅日常");
  assert.deepEqual((await readStyleCards(["CG11"])).map(c => c.id), ["CG11"]);
  assert.deepEqual((await readStyleCards(["MU28"])).map(c => c.id), ["MU28"]);
});

test("unknown, retired revision and ambiguous names fail explicitly with no partial successful selection", async () => {
  await assert.rejects(readStyleCards(["CG11", "not-a-card"]), /Unknown card/u);
  await assert.rejects(readStyleCards(["MU14@r1"]), /current revision is r3/u);
  const temporary = await mkdtemp(resolve(tmpdir(), "cw-card-reader-"));
  try {
    await mkdir(resolve(temporary, "references/optional"), {recursive:true});
    await writeFile(resolve(temporary, STYLE_DOCUMENTS[0]), "## CG01 同一名称\n**卡片修订：**1。\n色彩规则\n");
    await writeFile(resolve(temporary, STYLE_DOCUMENTS[1]), "## MU01 同一名称\n卡片修订1；\n妆容规则");
    await assert.rejects(readStyleCards(["同一名称"], {skillRoot:temporary}), /Ambiguous card/u);
    const [last] = await readStyleCards(["MU01"], {skillRoot:temporary});
    assert.equal(last.endLine, 3);
  } finally { await rm(temporary, {recursive:true,force:true}); }
});

test("reader CLI works from another cwd, emits only requested full cards, and does not modify source", async () => {
  const helper = new URL("scripts/read-style-card.mjs", root);
  const before = await Promise.all(documents.map(doc => readFile(new URL(doc.path, root))));
  const result = spawnSync(process.execPath, [fileURLToPath(helper), "CG11", "MU14"], {cwd:tmpdir(),encoding:"utf8"});
  assert.ifError(result.error); assert.equal(result.status,0,result.stderr);
  assert.equal(result.stdout,formatStyleCards(await readStyleCards(["CG11","MU14"])));
  assert.equal((result.stdout.match(/^## (?:CG|MU)\d{2} /gmu)??[]).length,2);
  for (let i=0;i<documents.length;i++) assert.deepEqual(await readFile(new URL(documents[i].path,root)),before[i]);
});

test("section measurement includes nested expression guidance and stops before unrelated scenario stages", async () => {
  const text = await readFile(new URL("references/optional/prompt-detail-standard.md",root),"utf8");
  const span = selectSection(text,"人物"), selected = text.slice(span.start,span.end);
  assert.ok(selected.includes("### 人物情绪与表情生成"));
  assert.equal(selected.includes("## 场景"),false);
  assert.equal(selected.includes("## 图生视频"),false);
  assert.throws(()=>selectSection(text,"镜头与分镜"),/resolve once/u);
});
