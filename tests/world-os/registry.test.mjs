import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateDocument } from "../../scripts/validate-output.mjs";
import { readJson } from "../../packages/cineweave-world-os/src/json.mjs";
import { activateWorld, createWorld, listWorldInceptionDecisions, listWorldRegistrations, recordWorldInceptionDecision, verifyWorldRegistration } from "../../packages/cineweave-world-os/src/registry.mjs";
import { auditWorldOsProject } from "../../packages/cineweave-world-os/src/audit.mjs";
import { rebuildSeedStore, verifyWorldOsProject } from "../../packages/cineweave-world-os/src/store.mjs";
import { advancePortfolio } from "../../packages/cineweave-world-os/src/portfolio.mjs";
import { exactRef } from "../../packages/cineweave-world-os/src/json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleRoot = join(repoRoot, "examples", "multi-world-studio");
const seedManifestPath = join(exampleRoot, "seed-manifest.json");
const candidatePath = join(exampleRoot, "worlds", "W03.card.json");

async function tempProject(t) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-world-registration-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  return project;
}

function replaceWorld(value, from, to) {
  if (typeof value === "string") return value.replaceAll(from, to).replaceAll(from.toLowerCase(), to.toLowerCase());
  if (Array.isArray(value)) return value.map((item) => replaceWorld(item, from, to));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [replaceWorld(key, from, to), replaceWorld(child, from, to)]));
  return value;
}

async function transformedRuntimePackage(worldId, displayName) {
  const from = "W01";
  const lower = worldId.toLowerCase();
  const world = replaceWorld(await readJson(join(exampleRoot, "worlds", "W01.world.json")), from, worldId);
  const state = replaceWorld(await readJson(join(exampleRoot, "states", "W01.day0.json")), from, worldId);
  const trigger = replaceWorld(await readJson(join(exampleRoot, "triggers", "W01.triggers.json")), from, worldId);
  const action = replaceWorld(await readJson(join(exampleRoot, "actions", "W01.actions.json")), from, worldId);
  const template = replaceWorld(await readJson(join(exampleRoot, "templates", "W01.events.json")), from, worldId);
  const platform = await readJson(join(exampleRoot, "platforms", "studio-platform.json"));
  world.displayName = displayName;
  world.worldId = worldId;
  state.worldId = worldId;
  state.stateId = `state.world.${lower}.simulation.main`;
  const worldRef = exactRef("world_os_world_design_proposal", `world.${lower}`, world.version, world);
  const stateRef = exactRef("world_os_state_snapshot", state.stateId, state.version, state);
  action.worldCardRef = worldRef;
  trigger.worldCardRef = worldRef;
  trigger.initialStateRef = stateRef;
  const triggerRef = exactRef("world_os_trigger_catalog", trigger.catalogId, trigger.version, trigger);
  const actionRef = exactRef("world_os_action_catalog", action.catalogId, action.version, action);
  template.worldCardRef = worldRef;
  template.triggerCatalogRef = triggerRef;
  template.actionCatalogRef = actionRef;
  template.platformProfileRef = exactRef("world_os_platform_profile", platform.profileId, platform.version, platform);
  return { worldCard: world, initialState: state, triggerCatalog: trigger, actionCatalog: action, eventTemplateCatalog: template, platformProfile: platform };
}

test("create-world registers a candidate card idempotently and requires a latest human inception decision", async (t) => {
  const project = await tempProject(t);
  const candidate = await readJson(candidatePath);
  const created = await createWorld(project, candidate, { allocationShare: 5, createdAt: "2026-08-24T09:00:00.000Z" });
  assert.equal(created.registration.status, "candidate");
  assert.equal(created.registration.stage, "candidate_card");
  assert.equal(created.registration.portfolioRole, "lab");
  assert.equal(created.registration.worldCardRef, null);
  assert.equal(created.idempotent, false);
  const repeated = await createWorld(project, candidate, { allocationShare: 5, createdAt: "2026-08-24T09:00:00.000Z" });
  assert.equal(repeated.idempotent, true);
  assert.deepEqual(repeated.registrationRef, created.registrationRef);
  const registrations = await listWorldRegistrations(project, { worldId: "W03" });
  assert.equal(registrations.length, 1);
  assert.deepEqual(registrations[0].registrationRef, created.registrationRef);
  await assert.rejects(
    () => import("../../packages/cineweave-world-os/src/registry.mjs").then(({ requireLatestApprovedWorldDecision }) => requireLatestApprovedWorldDecision(project, created.registrationRef, null)),
    /latest exact approved inception decision/
  );
  const decision = await recordWorldInceptionDecision(project, created.registrationRef, {
    decision: "approve",
    actorId: "human.world-owner",
    rationale: "差异化、规则与低成本验证路径通过首轮人审。",
    decidedAt: "2026-08-24T09:05:00.000Z"
  });
  const decisions = await listWorldInceptionDecisions(project, created.registrationRef);
  assert.equal(decisions.length, 1);
  assert.deepEqual(decisions[0].decisionRef, decision.decisionRef);
  const registrationPath = join(project, "registration.json");
  const decisionPath = join(project, "inception-decision.json");
  await writeFile(registrationPath, `${JSON.stringify(created.registration)}\n`, "utf8");
  await writeFile(decisionPath, `${JSON.stringify(decision.decision)}\n`, "utf8");
  assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-registration.schema.json"), registrationPath)).valid, true);
  assert.equal((await validateDocument(join(exampleRoot, "schemas", "world-inception-decision.schema.json"), decisionPath)).valid, true);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.worldRegistrations, 1);
  assert.equal(audit.summary.worldInceptionDecisions, 1);
  await verifyWorldRegistration(project, created.registrationRef);
});

test("candidate registration rejects Canon claims and schema/authority tampering", async (t) => {
  const project = await tempProject(t);
  const candidate = await readJson(candidatePath);
  candidate.canonDisposition = "committed";
  await assert.rejects(() => createWorld(project, candidate), /proposal-only/);
  const candidateSchemaPath = join(exampleRoot, "schemas", "world-candidate-card.schema.json");
  const validCandidate = await readJson(candidatePath);
  const candidateCopy = join(await mkdtemp(join(tmpdir(), "cineweave-world-schema-")), "candidate.json");
  t.after(() => rm(dirname(candidateCopy), { recursive: true, force: true }));
  await writeFile(candidateCopy, `${JSON.stringify(validCandidate)}\n`, "utf8");
  assert.equal((await validateDocument(candidateSchemaPath, candidateCopy)).valid, true);
  validCandidate.extraAuthority = true;
  await writeFile(candidateCopy, `${JSON.stringify(validCandidate)}\n`, "utf8");
  assert.equal((await validateDocument(candidateSchemaPath, candidateCopy)).valid, false);
});

test("an approved candidate can attach a complete runtime package and becomes a dynamically schedulable world", async (t) => {
  const project = await tempProject(t);
  const candidate = await readJson(candidatePath);
  const created = await createWorld(project, candidate, { allocationShare: 5, createdAt: "2026-08-24T10:00:00.000Z" });
  const decision = await recordWorldInceptionDecision(project, created.registrationRef, {
    decision: "approve",
    actorId: "human.world-owner",
    rationale: "运行包仅作为原型验证，仍保持 proposal-only。",
    decidedAt: "2026-08-24T10:01:00.000Z"
  });
  const runtimePackage = await transformedRuntimePackage("W03", candidate.displayName);
  const activated = await activateWorld(project, created.registrationRef, decision.decisionRef, runtimePackage, {
    stage: "prototype",
    updatedAt: "2026-08-24T10:02:00.000Z"
  });
  assert.equal(activated.registration.status, "runnable");
  assert.equal(activated.registration.stage, "prototype");
  const registrations = await listWorldRegistrations(project, { worldId: "W03" });
  assert.equal(registrations.length, 2);
  assert.equal(registrations[0].registration.status, "runnable");
  const portfolio = await advancePortfolio(project, { worldIds: ["W03"], maxCycles: 1 });
  assert.equal(portfolio.worldIds[0], "W03");
  assert.equal(portfolio.rounds.length, 1);
  assert.equal(portfolio.rounds[0].worldId, "W03");
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
});
