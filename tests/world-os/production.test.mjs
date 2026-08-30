import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateDocument } from "../../scripts/validate-output.mjs";
import { exactRef, readJson } from "../../packages/cineweave-world-os/src/json.mjs";
import { auditWorldOsProject } from "../../packages/cineweave-world-os/src/audit.mjs";
import { advanceWorld } from "../../packages/cineweave-world-os/src/scheduler.mjs";
import { deriveStreamHead, rebuildSeedStore, verifyWorldOsProject } from "../../packages/cineweave-world-os/src/store.mjs";
import {
  PRODUCTION_GATES,
  activateProductionStage,
  contractRefFromDocument,
  createProductionSlice,
  listProductionGateDecisions,
  listProductionSlices,
  recordProductionGateDecision,
  verifyProductionSlice
} from "../../packages/cineweave-world-os/src/production.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleRoot = join(repoRoot, "examples", "multi-world-studio");
const seedManifestPath = join(exampleRoot, "seed-manifest.json");

async function tempProject(t) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-production-slice-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await advanceWorld(project, "W01", { maxSteps: 1 });
  return project;
}

function contract(kind, id, extra = {}) {
  return { kind, version: 1, ...extra, [kind.includes("story_brief") ? "storyId" : kind.includes("beat_sheet") ? "beatSheetId" : kind.includes("script_scene") ? "scriptSceneId" : kind.includes("character_spec") ? "characterId" : kind.includes("scene_spec") ? "sceneId" : kind.includes("style_package") ? "stylePackageId" : kind.includes("shot_spec") ? "shotSpecId" : kind.includes("prompt") ? "promptId" : kind.includes("asset_recipe") ? "recipeId" : kind.includes("license_profile") ? "profileId" : "reviewId"]: id };
}

function fixtureContracts() {
  return {
    storyBrief: contract("cineweave_codex_story_brief", "story.w01.slice"),
    beatSheet: contract("cineweave_codex_beat_sheet", "beats.w01.slice"),
    scriptScene: contract("cineweave_codex_script_scene", "script.w01.slice"),
    characterSpecs: [contract("cineweave_codex_character_spec", "char.w01.hero", { worldId: "W01" })],
    sceneSpecs: [contract("cineweave_codex_scene_spec", "scene.w01.courtyard", { worldId: "W01" })],
    stylePackages: [contract("cineweave_codex_style_package", "style.w01.song-poetic", { worldId: "W01" })],
    shotSpecs: [contract("cineweave_codex_shot_spec", "shot.w01.first-reveal")],
    promptRecords: [contract("cineweave_codex_prompt_record", "prompt.w01.first-reveal")],
    recipe: contract("cineweave_codex_asset_recipe", "recipe.w01.first-reveal", { worldId: "W01" }),
    rightsProfile: contract("cineweave_codex_license_profile", "rights.w01.production"),
    qaReviews: [contract("cineweave_codex_character_review", "review.w01.identity")]
  };
}

test("ProductionSlice binds an event commit to contract snapshots and advances only through ordered human Gates", async (t) => {
  const project = await tempProject(t);
  const head = await deriveStreamHead(project, "W01", "simulation.main");
  const contracts = fixtureContracts();
  const created = await createProductionSlice(project, {
    worldId: "W01",
    sourceCommitRef: head.commitRef,
    sourceStateRef: head.stateRef,
    episodeId: "episode.w01.slice-01",
    title: "雨夜旧签：生产纵切片",
    contracts,
    createdAt: "2026-08-24T13:00:00.000Z"
  });
  assert.equal(created.slice.stage, "planned");
  assert.equal(created.slice.status, "proposed");
  assert.equal(created.snapshots.length, 11);
  assert.equal(contractRefFromDocument(contracts.storyBrief).kind, "cineweave_codex_story_brief");
  const repeated = await createProductionSlice(project, {
    worldId: "W01",
    sourceCommitRef: head.commitRef,
    sourceStateRef: head.stateRef,
    episodeId: "episode.w01.slice-01",
    title: "雨夜旧签：生产纵切片",
    contracts,
    createdAt: "2026-08-24T13:00:00.000Z"
  });
  assert.equal(repeated.idempotent, true);
  const slicePath = join(project, "production-slice.json");
  await writeFile(slicePath, `${JSON.stringify(created.slice)}\n`, "utf8");
  assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-production-slice.schema.json"), slicePath)).valid, true);
  await assert.rejects(() => recordProductionGateDecision(project, created.sliceRef, {
    gate: "release",
    decision: "approve",
    actorId: "human.producer",
    rationale: "越过前置 Gate 应被阻断。",
    decidedAt: "2026-08-24T13:01:00.000Z"
  }), /out of order/);

  let currentRef = created.sliceRef;
  const activatedStages = [];
  for (const [index, gate] of PRODUCTION_GATES.entries()) {
    const decision = await recordProductionGateDecision(project, currentRef, {
      gate,
      decision: "approve",
      actorId: "human.producer",
      rationale: `第 ${index + 1} 个生产 Gate 已由责任人审阅。`,
      decidedAt: `2026-08-24T13:${String(index + 2).padStart(2, "0")}:00.000Z`
    });
    const decisionPath = join(project, `production-decision-${index}.json`);
    await writeFile(decisionPath, `${JSON.stringify(decision.decision)}\n`, "utf8");
    if (index === 0) assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-production-gate-decision.schema.json"), decisionPath)).valid, true);
    const activated = await activateProductionStage(project, currentRef, decision.decisionRef, { updatedAt: `2026-08-24T13:${String(index + 2).padStart(2, "0")}:30.000Z` });
    activatedStages.push(activated.slice.stage);
    currentRef = activated.sliceRef;
  }
  assert.deepEqual(activatedStages, ["story_bound", "character_bound", "design_bound", "shot_bound", "qa_pending", "approved_asset", "released"]);
  const final = await verifyProductionSlice(project, currentRef);
  assert.equal(final.slice.status, "released");
  assert.equal(final.slice.releaseVisibility, "private_workspace");
  assert.equal((await listProductionSlices(project, { worldId: "W01" })).length, 8);
  assert.equal((await listProductionGateDecisions(project, currentRef)).length, 7);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.productionSnapshots, 11);
  assert.equal(audit.summary.productionSlices, 8);
  assert.equal(audit.summary.productionGateDecisions, 7);
});

test("ProductionSlice rejects cross-world contract snapshots and public release visibility", async (t) => {
  const project = await tempProject(t);
  const head = await deriveStreamHead(project, "W01", "simulation.main");
  const contracts = fixtureContracts();
  contracts.characterSpecs[0].worldId = "W02";
  await assert.rejects(() => createProductionSlice(project, {
    worldId: "W01",
    sourceCommitRef: head.commitRef,
    sourceStateRef: head.stateRef,
    episodeId: "episode.w01.invalid",
    title: "越界生产切片",
    contracts
  }), /belongs to W02/);
  contracts.characterSpecs[0].worldId = "W01";
  const valid = await createProductionSlice(project, {
    worldId: "W01",
    sourceCommitRef: head.commitRef,
    sourceStateRef: head.stateRef,
    episodeId: "episode.w01.valid",
    title: "可验证生产切片",
    contracts
  });
  const publicSlice = { ...valid.slice, releaseVisibility: "public" };
  await assert.rejects(() => Promise.resolve().then(() => import("../../packages/cineweave-world-os/src/production.mjs")).then(({ assertProductionSliceContract }) => assertProductionSliceContract(publicSlice)), /visibility/);
});
