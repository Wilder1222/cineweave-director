import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateDocument } from "../../scripts/validate-output.mjs";
import { readJson } from "../../packages/cineweave-world-os/src/json.mjs";
import {
  activateBrandEcho,
  assertBrandEchoContract,
  createBrandEcho,
  listBrandEchoDecisions,
  listBrandEchoes,
  recordBrandEchoDecision,
  verifyBrandEcho,
  verifyBrandEchoDecision
} from "../../packages/cineweave-world-os/src/brand.mjs";
import { auditWorldOsProject } from "../../packages/cineweave-world-os/src/audit.mjs";
import { rebuildSeedStore, verifyWorldOsProject } from "../../packages/cineweave-world-os/src/store.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleRoot = join(repoRoot, "examples", "multi-world-studio");
const seedManifestPath = join(exampleRoot, "seed-manifest.json");

async function tempProject(t) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-brand-echo-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  return project;
}

test("L1 BrandEcho is proposal-only until a human decision and remains non-causal", async (t) => {
  const project = await tempProject(t);
  const created = await createBrandEcho(project, {
    worldIds: ["W02", "W01"],
    symbolId: "red-thread",
    surfaceForm: "一缕红线",
    semanticIntent: "提醒观众注意重复出现的主题意象，但不共享人物、物件或因果。",
    createdAt: "2026-08-24T11:00:00.000Z"
  });
  assert.equal(created.echo.status, "proposed");
  assert.deepEqual(created.echo.worldIds, ["W01", "W02"]);
  assert.equal(created.echo.usageScope, "shared_motif_only");
  assert.equal(created.echo.crossWorldCausality, "forbidden");
  assert.equal(created.echo.sharedActorRefs.length, 0);
  assert.equal(created.echo.sharedItemRefs.length, 0);
  const repeated = await createBrandEcho(project, {
    worldIds: ["W01", "W02"],
    symbolId: "red-thread",
    surfaceForm: "一缕红线",
    semanticIntent: "提醒观众注意重复出现的主题意象，但不共享人物、物件或因果。",
    createdAt: "2026-08-24T11:00:00.000Z"
  });
  assert.equal(repeated.idempotent, true);
  await assert.rejects(() => createBrandEcho(project, {
    worldIds: ["W01", "W99"],
    symbolId: "unknown",
    surfaceForm: "未知",
    semanticIntent: "不能把未注册世界写入跨世界母题。"
  }), /unregistered world W99/);
  const invalid = { ...created.echo, sharedActorRefs: [{ kind: "character", id: "character.shared" }] };
  assert.throws(() => assertBrandEchoContract(invalid), /L1 boundary/);

  const echoPath = join(project, "brand-echo.json");
  await writeFile(echoPath, `${JSON.stringify(created.echo)}\n`, "utf8");
  assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-brand-echo.schema.json"), echoPath)).valid, true);

  const decision = await recordBrandEchoDecision(project, created.echoRef, {
    decision: "approve",
    actorId: "human.brand-owner",
    rationale: "仅作为跨世界可识别的视觉母题，不进入任何世界的事实、人物或状态。",
    decidedAt: "2026-08-24T11:05:00.000Z"
  });
  const decisionPath = join(project, "brand-echo-decision.json");
  await writeFile(decisionPath, `${JSON.stringify(decision.decision)}\n`, "utf8");
  assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-brand-echo-decision.schema.json"), decisionPath)).valid, true);
  await verifyBrandEchoDecision(project, decision.decisionRef);
  assert.equal((await listBrandEchoDecisions(project, created.echoRef)).length, 1);

  const activated = await activateBrandEcho(project, created.echoRef, decision.decisionRef);
  assert.equal(activated.echo.status, "approved");
  assert.equal(activated.echo.version, 2);
  assert.deepEqual(activated.echo.approvalRef, decision.decisionRef);
  assert.equal((await activateBrandEcho(project, created.echoRef, decision.decisionRef)).idempotent, true);
  const echoes = await listBrandEchoes(project);
  assert.equal(echoes.length, 2);
  assert.equal(echoes[0].echo.status, "approved");
  await verifyBrandEcho(project, activated.echoRef);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.brandEchoes, 2);
  assert.equal(audit.summary.brandEchoDecisions, 1);
});

test("BrandEcho activation cannot use a non-approve or non-latest decision", async (t) => {
  const project = await tempProject(t);
  const created = await createBrandEcho(project, {
    worldIds: ["W01", "W02"],
    symbolId: "shared-lantern",
    surfaceForm: "远处的灯",
    semanticIntent: "只提示不同世界中的相似情绪，不建立世界之间的传播。",
    createdAt: "2026-08-24T12:00:00.000Z"
  });
  const revise = await recordBrandEchoDecision(project, created.echoRef, {
    decision: "revise",
    actorId: "human.brand-owner",
    rationale: "先补充视觉识别规范。",
    decidedAt: "2026-08-24T12:01:00.000Z"
  });
  await assert.rejects(() => activateBrandEcho(project, created.echoRef, revise.decisionRef), /latest exact approved human decision/);
  const approve = await recordBrandEchoDecision(project, created.echoRef, {
    decision: "approve",
    actorId: "human.brand-owner",
    rationale: "补充规范后批准为非因果共享母题。",
    decidedAt: "2026-08-24T12:02:00.000Z"
  });
  await assert.rejects(() => activateBrandEcho(project, created.echoRef, revise.decisionRef), /latest exact approved human decision/);
  const activated = await activateBrandEcho(project, created.echoRef, approve.decisionRef);
  assert.equal(activated.echo.status, "approved");
});
