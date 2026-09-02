import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { findArtifact, listArtifacts, putArtifact } from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { adjudicateEvent, evaluateCondition } from "../../packages/cineweave-world-os/src/engine.mjs";
import { applyEffect, exactRef, pointerGet, readJson, sameRef } from "../../packages/cineweave-world-os/src/json.mjs";
import {
  createMcpDispatch,
  createLocalFixtureResponse,
  listOutbox,
  recordPublishReceipt
} from "../../packages/cineweave-world-os/src/outbox.mjs";
import {
  createFixtureProposalProvider,
  requestSimulationProposal
} from "../../packages/cineweave-world-os/src/providers.mjs";
import { reviewWorkspace } from "../../packages/cineweave-world-os/src/review.mjs";
import { scanTriggerCatalog } from "../../packages/cineweave-world-os/src/triggers.mjs";
import { evaluateTriggerTiming } from "../../packages/cineweave-world-os/src/timing.mjs";
import { advanceWorld, forecastWorld } from "../../packages/cineweave-world-os/src/scheduler.mjs";
import { advancePortfolio } from "../../packages/cineweave-world-os/src/portfolio.mjs";
import { inspectCodexBrain, runCodexBrainCycle } from "../../packages/cineweave-world-os/src/brain.mjs";
import { dispatchOutbox, listMcpAttempts, listMcpClaims } from "../../packages/cineweave-world-os/src/mcp.mjs";
import { listLlmShadowReceipts, runLlmShadow } from "../../packages/cineweave-world-os/src/shadow.mjs";
import { auditWorldOsProject } from "../../packages/cineweave-world-os/src/audit.mjs";
import {
  createGateRequest,
  deriveCanonHead,
  promoteCanon,
  recordGateDecision,
  resumeSimulation
} from "../../packages/cineweave-world-os/src/canon.mjs";
import { resumeTemplateWorkItem, submitEventTemplateCatalog } from "../../packages/cineweave-world-os/src/dynamic.mjs";
import {
  ingestExternalSignal,
  listExternalSignalUses,
  listExternalSignals,
  recordExternalSignalUse
} from "../../packages/cineweave-world-os/src/signals.mjs";
import {
  deriveStreamHead,
  rebuildSeedStore,
  reconcilePlatformProjections,
  runEventProposal,
  verifyWorldOsProject
} from "../../packages/cineweave-world-os/src/store.mjs";
import { validateDocument } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const exampleRoot = join(repoRoot, "examples", "multi-world-studio");
const docsRoot = join(repoRoot, "docs", "examples", "multi-world-studio");
const workspacePath = join(exampleRoot, "workspace.json");
const seedManifestPath = join(exampleRoot, "seed-manifest.json");
const proposalPath = join(exampleRoot, "events", "event.w01.rain-night-incense.json");
const nextProposalPath = join(exampleRoot, "events", "event.w01.official-search-pressure.json");
const platformPath = join(exampleRoot, "platforms", "studio-platform.json");

async function tempDirectory(t) {
  const path = await mkdtemp(join(tmpdir(), "cineweave-world-os-"));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

async function cloneExampleAsRepo(t) {
  const root = await tempDirectory(t);
  const exampleTarget = join(root, "examples", "multi-world-studio");
  const docsTarget = join(root, "docs", "examples", "multi-world-studio");
  await cp(exampleRoot, exampleTarget, { recursive: true });
  await cp(docsRoot, docsTarget, { recursive: true });
  return { root, exampleTarget, workspace: join(exampleTarget, "workspace.json") };
}

async function fixtureInputs() {
  return {
    workspace: await readJson(workspacePath),
    worldCard: await readJson(join(exampleRoot, "worlds", "W01.world.json")),
    state: await readJson(join(exampleRoot, "states", "W01.day0.json")),
    proposal: await readJson(proposalPath),
    triggerCatalog: await readJson(join(exampleRoot, "triggers", "W01.triggers.json")),
    actionCatalog: await readJson(join(exampleRoot, "actions", "W01.actions.json")),
    templateCatalog: await readJson(join(exampleRoot, "templates", "W01.events.json"))
  };
}

async function fileDigestMap(root) {
  const result = new Map();
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const bytes = await readFile(path);
        result.set(relative(root, path).replaceAll("\\", "/"), createHash("sha256").update(bytes).digest("hex"));
      }
    }
  }
  await visit(root);
  return [...result.entries()].sort(([left], [right]) => left.localeCompare(right));
}

test("workspace schemas and semantic review pass", async () => {
  const pairs = [
    ["workspace.schema.json", "workspace.json"],
    ["world-design.schema.json", "worlds/W01.world.json"],
    ["world-design.schema.json", "worlds/W02.world.json"],
    ["state.schema.json", "states/W01.day0.json"],
    ["state.schema.json", "states/W02.day0.json"],
    ["platform-profile.schema.json", "platforms/studio-platform.json"],
    ["event-proposal.schema.json", "events/event.w01.rain-night-incense.json"],
    ["event-proposal.schema.json", "events/event.w01.official-search-pressure.json"],
    ["event-proposal.schema.json", "events/event.w01.inspect-old-tag-order.json"],
    ["event-proposal.schema.json", "events/event.w02.begin-baseline-window-assessment.json"],
    ["action-catalog.schema.json", "actions/W01.actions.json"],
    ["action-catalog.schema.json", "actions/W02.actions.json"],
    ["event-template-catalog.schema.json", "templates/W01.events.json"],
    ["event-template-catalog.schema.json", "templates/W02.events.json"],
    ["seed-manifest.schema.json", "seed-manifest.json"],
    ["world-candidate-card.schema.json", "worlds/W03.card.json"],
    ["world-candidate-card.schema.json", "worlds/W04.card.json"],
    ["world-brand-echo.schema.json", "motifs/red-thread.brand-echo.json"],
    ["world-brand-echo-decision.schema.json", "motifs/red-thread.brand-echo-decision.json"],
    ["world-production-contract-snapshot.schema.json", "production/contract-snapshot.story.json"],
    ["world-production-slice.schema.json", "production/slice.example.json"],
    ["world-production-gate-decision.schema.json", "production/gate-decision.example.json"],
    ["codex-brain-run-receipt.schema.json", "brain/codex-brain-run-receipt.example.json"],
    ["review-report.schema.json", "reviews/baseline-review.json"],
    ["llm-provider-policy.schema.json", "providers/future-llm-policy.json"],
    ["simulation-request.schema.json", "providers/simulation-request.w01.next-event.json"],
    ["trigger-catalog.schema.json", "triggers/W01.triggers.json"],
    ["trigger-catalog.schema.json", "triggers/W02.triggers.json"]
  ];
  for (const [schema, payload] of pairs) {
    const result = await validateDocument(join(exampleRoot, "schemas", schema), join(exampleRoot, payload));
    assert.equal(result.valid, true, `${payload}: ${result.errors.join("; ")}`);
  }
  const review = await reviewWorkspace(workspacePath, { reviewedAt: "2026-08-22T08:00:00.000Z" });
  assert.equal(review.status, "pass");
  assert.deepEqual(review.summary, { error: 0, warning: 0, info: 0, strict: false });
});

test("review blocks multiple writers, MCP Canon writes and LLM state writes", async (t) => {
  const fixture = await cloneExampleAsRepo(t);
  const workspace = await readJson(fixture.workspace);
  workspace.authority.writerIds.push("external.writer");
  workspace.integrations.mcp.canWriteCanon = true;
  workspace.integrations.llmAdapters[0].canWriteState = true;
  await writeFile(fixture.workspace, `${JSON.stringify(workspace, null, 2)}\n`, "utf8");
  const review = await reviewWorkspace(fixture.workspace, { reviewedAt: "2026-08-22T08:00:00.000Z" });
  const codes = new Set(review.issues.map((item) => item.code));
  assert.equal(review.status, "fail");
  assert.equal(codes.has("MWS_SINGLE_WRITER_REQUIRED"), true);
  assert.equal(codes.has("MWS_MCP_CANON_WRITE_FORBIDDEN"), true);
  assert.equal(codes.has("MWS_LLM_SCOPE_MUST_BE_PROPOSAL_ONLY"), true);
});

test("review preserves undefined as unresolved rather than free", async (t) => {
  const fixture = await cloneExampleAsRepo(t);
  const workspace = await readJson(fixture.workspace);
  workspace.locks.find((lock) => lock.level === "undefined").value = "invented answer";
  await writeFile(fixture.workspace, `${JSON.stringify(workspace, null, 2)}\n`, "utf8");
  const review = await reviewWorkspace(fixture.workspace, { reviewedAt: "2026-08-22T08:00:00.000Z" });
  assert.equal(review.issues.some((item) => item.code === "MWS_UNDEFINED_HAS_VALUE"), true);
});

test("condition DSL is deterministic and blocks unknown facts", () => {
  const state = { resources: { water: 3 }, actors: { a: { knowledge: ["route"] } } };
  assert.equal(evaluateCondition({ all: [
    { path: "/resources/water", op: "lte", value: 3 },
    { path: "/actors/a/knowledge", op: "contains", value: "route" }
  ] }, state).result, true);
  const unknown = evaluateCondition({ path: "/resources/energy", op: "gt", value: 0 }, state);
  assert.equal(unknown.result, false);
  assert.equal(unknown.unknown, true);
});

test("state pointers reject prototype traversal and inherited properties", () => {
  const inherited = Object.create({ leaked: "inherited" });
  inherited.variables = { safe: true };
  assert.equal(pointerGet(inherited, "/leaked"), undefined);
  assert.throws(() => pointerGet(inherited, "/variables/__proto__/polluted"), /Unsafe JSON pointer token/);
  assert.throws(
    () => applyEffect(structuredClone(inherited), { op: "add", path: "/variables/__proto__/polluted", value: true }),
    /Unsafe JSON pointer token/
  );
  assert.equal(Object.prototype.polluted, undefined);
});

test("trigger catalogs expose eligible and blocked events from exact state", async () => {
  const inputs = await fixtureInputs();
  const scan = scanTriggerCatalog(inputs.triggerCatalog, inputs.state);
  assert.equal(scan.eligibleCount, 1);
  assert.equal(scan.entries[0].triggerId, "trigger.w01.injured-traveler-arrives");
  assert.equal(scan.entries.find((entry) => entry.triggerId === "trigger.w01.hidden-stock-pressure").status, "conditions_not_met");
});

test("trigger timing is deterministic for dueAt, cooldown and maxOccurrences", () => {
  const base = {
    worldId: "W01",
    clock: { at: "2026-04-20T10:00:00.000Z" },
    timeline: []
  };
  const trigger = {
    id: "trigger.test.timed",
    eventId: "event.test.timed",
    dueAt: "2026-04-20T11:00:00.000Z",
    cooldownMinutes: 30,
    maxOccurrences: 2
  };
  assert.equal(evaluateTriggerTiming(trigger, base).ready, false);
  assert.equal(evaluateTriggerTiming(trigger, base).timeDue, false);
  const due = { ...base, clock: { at: "2026-04-20T11:30:00.000Z" } };
  assert.equal(evaluateTriggerTiming(trigger, due).ready, true);
  const cooling = {
    ...due,
    timeline: [{ triggerId: trigger.id, eventId: trigger.eventId, at: "2026-04-20T11:15:00.000Z" }]
  };
  const coolingResult = evaluateTriggerTiming(trigger, cooling);
  assert.equal(coolingResult.cooldownOpen, false);
  assert.equal(coolingResult.ready, false);
  const capped = {
    ...due,
    timeline: [
      { triggerId: trigger.id, eventId: trigger.eventId, at: "2026-04-20T09:00:00.000Z" },
      { triggerId: trigger.id, eventId: trigger.eventId, at: "2026-04-20T09:30:00.000Z" }
    ]
  };
  const cappedResult = evaluateTriggerTiming(trigger, capped);
  assert.equal(cappedResult.occurrenceLimitOpen, false);
  assert.equal(cappedResult.ready, false);
  const unrelated = {
    ...due,
    timeline: [{ triggerId: "trigger.test.other", eventId: trigger.eventId, at: "2026-04-20T11:15:00.000Z" }]
  };
  assert.equal(evaluateTriggerTiming(trigger, unrelated).occurrenceCount, 0);
  assert.throws(() => evaluateTriggerTiming({ ...trigger, once: true, maxOccurrences: 2 }, due), /once=true/);
});

test("adjudication rechecks trigger event binding, status and one-shot history", async () => {
  const wrongEvent = await fixtureInputs();
  wrongEvent.proposal.eventId = "event.w01.unbound-event";
  const wrongEventResult = adjudicateEvent(wrongEvent);
  assert.equal(wrongEventResult.status, "rejected");
  assert.equal(wrongEventResult.decision.checks.some((item) => item.id === "trigger.event_binding"), true);

  const inactive = await fixtureInputs();
  inactive.triggerCatalog.triggers[0].status = "retired";
  const inactiveResult = adjudicateEvent(inactive);
  assert.equal(inactiveResult.status, "rejected");
  assert.equal(inactiveResult.decision.checks.some((item) => item.id === "trigger.status"), true);

  const repeated = await fixtureInputs();
  repeated.state.timeline.push({ sequence: 1, eventId: repeated.proposal.eventId, at: repeated.proposal.trigger.occurredAt, summary: "already happened" });
  const repeatedResult = adjudicateEvent(repeated);
  assert.equal(repeatedResult.status, "rejected");
  assert.equal(repeatedResult.decision.checks.some((item) => item.id === "trigger.once"), true);

  const future = await fixtureInputs();
  future.triggerCatalog.triggers[0].dueAt = "2027-01-01T00:00:00.000Z";
  const futureResult = adjudicateEvent(future);
  assert.equal(futureResult.status, "rejected");
  assert.equal(futureResult.decision.checks.some((item) => item.id === "trigger.due"), true);
});

test("event contract and actor state guard participants, knowledge and location", async () => {
  const malformed = await fixtureInputs();
  delete malformed.proposal.participants;
  assert.throws(() => adjudicateEvent(malformed), /missing participants/);

  const noKnowledge = await fixtureInputs();
  noKnowledge.state.actors["character.w01.viewpoint-recordkeeper"].knowledge = [];
  const knowledgeResult = adjudicateEvent(noKnowledge);
  assert.equal(knowledgeResult.status, "rejected");
  assert.equal(knowledgeResult.decision.checks.some((item) => item.id === "action.knowledge"), true);

  const wrongLocation = await fixtureInputs();
  wrongLocation.state.actors["character.w01.viewpoint-recordkeeper"].locationId = "scene.w01.tea-house";
  const locationResult = adjudicateEvent(wrongLocation);
  assert.equal(locationResult.status, "rejected");
  assert.equal(locationResult.decision.checks.some((item) => item.id === "action.location"), true);
});

test("proposals cannot self-author effects or escape the exact action catalog", async () => {
  const outsideCatalog = await fixtureInputs();
  outsideCatalog.proposal.actions[0].actionId = "action.w01.unreviewed-invention";
  const rejected = adjudicateEvent(outsideCatalog);
  assert.equal(rejected.status, "rejected");
  assert.equal(rejected.decision.checks.some((item) => item.id === "action.catalog_action"), true);

  const selfAuthored = await fixtureInputs();
  selfAuthored.proposal.actions[0].effects = [{ op: "replace", path: "/variables/information/oldCaseExposure", value: "public" }];
  assert.throws(() => adjudicateEvent(selfAuthored), /undeclared fields/);

  const staleCatalog = await fixtureInputs();
  staleCatalog.proposal.actionCatalogRef = { ...staleCatalog.proposal.actionCatalogRef, contentHash: `sha256:${"0".repeat(64)}` };
  const stale = adjudicateEvent(staleCatalog);
  assert.equal(stale.status, "rejected");
  assert.equal(stale.decision.checks.some((item) => item.id === "action.catalog"), true);

  const forgedConsequence = await fixtureInputs();
  forgedConsequence.proposal.delayedConsequences = [{
    id: "consequence.forged",
    targetEventId: "event.w01.official-search-pressure",
    description: "forged consequence",
    when: { path: "/variables/information/oldCaseExposure", op: "eq", value: "low" }
  }];
  const consequenceResult = adjudicateEvent(forgedConsequence);
  assert.equal(consequenceResult.status, "rejected");
  assert.equal(consequenceResult.decision.checks.some((item) => item.id === "template.binding"), true);

  const downgradedIrreversibility = await fixtureInputs();
  downgradedIrreversibility.proposal.irreversibility = "reversible";
  const irreversibilityResult = adjudicateEvent(downgradedIrreversibility);
  assert.equal(irreversibilityResult.status, "rejected");
  assert.equal(irreversibilityResult.decision.checks.some((item) => item.id === "template.binding"), true);
});

test("Codex adjudication advances only the proposal simulation stream", async () => {
  const inputs = await fixtureInputs();
  const result = adjudicateEvent(inputs);
  assert.equal(result.status, "accepted_simulation");
  assert.equal(result.nextState.version, 2);
  assert.equal(result.nextState.sequence, 1);
  assert.equal(result.nextState.canonDisposition, "proposal");
  assert.equal(result.commit.authoritativeScope, "simulation_branch");
  assert.equal(result.commit.canonDisposition, "proposal");
  assert.equal(result.commit.terminalMarker, true);
  assert.equal(result.nextState.variables.information.oldCaseExposure, "low");
});

test("Canon-impacting proposals stop at a human Gate", async () => {
  const inputs = await fixtureInputs();
  inputs.actionCatalog.actions[0].canonImpactCeiling = "canon_mutation";
  inputs.proposal.actionCatalogRef = exactRef("world_os_action_catalog", inputs.actionCatalog.catalogId, inputs.actionCatalog.version, inputs.actionCatalog);
  inputs.templateCatalog.actionCatalogRef = inputs.proposal.actionCatalogRef;
  inputs.templateCatalog.templates[0].canonImpact = "canon_mutation";
  inputs.proposal.eventTemplateCatalogRef = exactRef("world_os_event_template_catalog", inputs.templateCatalog.catalogId, inputs.templateCatalog.version, inputs.templateCatalog);
  inputs.proposal.canonImpact = "canon_mutation";
  const result = adjudicateEvent(inputs);
  assert.equal(result.status, "needs_human_gate");
  assert.equal(result.nextState, null);
  assert.equal(result.commit, null);
  assert.equal(result.decision.checks.some((item) => item.status === "gate"), true);
});

test("stale state references cannot advance a stream", async () => {
  const inputs = await fixtureInputs();
  inputs.proposal.baseStateRef = { ...inputs.proposal.baseStateRef, contentHash: `sha256:${"0".repeat(64)}` };
  const result = adjudicateEvent(inputs);
  assert.equal(result.status, "rejected");
  assert.equal(result.decision.checks.some((item) => item.id === "proposal.expected_version"), true);
});

test("Decision Cycle commits require the exact selected BranchSet candidate", async (t) => {
  const project = join(await tempDirectory(t), "store");
  await rebuildSeedStore(seedManifestPath, project);
  const proposal = await readJson(proposalPath);
  const proposalRef = exactRef("world_os_event_proposal", proposal.proposalId, proposal.proposalVersion, proposal);
  const branchSet = {
    kind: "world_os_branch_set",
    contractVersion: "0.1.0",
    branchSetId: "branchset.attack-selection",
    version: 1,
    worldId: "W01",
    stream: "simulation.main",
    baseStateRef: proposal.baseStateRef,
    triggerCatalogRef: proposal.triggerCatalogRef,
    triggerId: proposal.trigger.triggerId,
    actionCatalogRef: proposal.actionCatalogRef,
    templateCatalogRef: proposal.eventTemplateCatalogRef,
    selectionPolicy: "hard_constraints_then_codex_score_then_candidate_id",
    candidates: [{
      candidateId: "rain-night-incense.baseline",
      branchRole: "baseline",
      proposalRef,
      evaluationStatus: "accepted_simulation",
      hardConstraintsPassed: true,
      selectionScore: 90,
      differingPremise: "fixture candidate",
      projectedDeltaSummary: "fixture delta",
      delayedConsequenceIds: ["consequence.w01.official-search-pressure"],
      unresolvedInputs: [],
      failedCheckIds: [],
      gatedCheckIds: []
    }],
    selectedProposalRef: proposalRef,
    selectionStatus: "selected_for_simulation"
  };
  const storedBranchSet = await putArtifact(project, branchSet, {
    kind: "world_os_branch_set", id: branchSet.branchSetId, version: 1,
    status: "candidate", createdAt: proposal.proposedAt, createdBy: "codex.root"
  });
  const forgedProposal = { ...structuredClone(proposal), proposalId: "proposal.w01.forged-selection" };
  const forgedProposalRef = exactRef("world_os_event_proposal", forgedProposal.proposalId, forgedProposal.proposalVersion, forgedProposal);
  await putArtifact(project, forgedProposal, {
    kind: "world_os_event_proposal", id: forgedProposal.proposalId, version: forgedProposal.proposalVersion,
    status: "candidate", createdAt: forgedProposal.proposedAt, createdBy: "codex.root"
  });
  const wrongSelection = structuredClone(branchSet);
  wrongSelection.branchSetId = "branchset.attack-wrong-selection";
  wrongSelection.selectedProposalRef = forgedProposalRef;
  wrongSelection.candidates.push({ ...structuredClone(wrongSelection.candidates[0]), candidateId: "forged-selection", proposalRef: forgedProposalRef });
  const wrongStored = await putArtifact(project, wrongSelection, {
    kind: "world_os_branch_set", id: wrongSelection.branchSetId, version: 1,
    status: "candidate", createdAt: proposal.proposedAt, createdBy: "codex.root"
  });
  await assert.rejects(
    runEventProposal(project, proposalPath, { selectionRef: wrongStored.envelope.artifactRef, requireSelection: true }),
    /selectedProposalRef/
  );
  assert.equal(await deriveStreamHead(project, "W01"), null);
  await assert.rejects(
    runEventProposal(project, proposalPath, { requireSelection: true }),
    /require an exact selected BranchSet/
  );
  const accepted = await runEventProposal(project, proposalPath, {
    selectionRef: storedBranchSet.envelope.artifactRef,
    requireSelection: true
  });
  assert.equal(accepted.status, "accepted_simulation");
  assert.ok(await deriveStreamHead(project, "W01"));
});

test("future LLM providers are proposal-only", async () => {
  const { proposal } = await fixtureInputs();
  const llmProposal = structuredClone(proposal);
  llmProposal.source.origin = "llm_api";
  const policy = await readJson(join(exampleRoot, "providers", "future-llm-policy.json"));
  policy.enabled = true;
  policy.modelAlias = "fixture";
  const request = await readJson(join(exampleRoot, "providers", "simulation-request.w01.next-event.json"));
  request.providerPolicyRef = exactRef("world_os_llm_provider_policy", policy.policyId, policy.version, policy);
  llmProposal.source.providerId = "fixture.proposal-provider";
  llmProposal.source.requestRef = exactRef("world_os_simulation_request", request.requestId, request.version, request);
  const result = await requestSimulationProposal(createFixtureProposalProvider(llmProposal), request, policy);
  assert.equal(result.proposal.kind, "world_os_event_proposal");
  assert.equal(result.usage.costUsd, 0);
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider({ kind: "world_os_state_snapshot" }), request, policy),
    /non-proposal/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal), request, { ...policy, canWriteState: true }),
    /proposal-only/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal), request, { ...policy, dataPolicy: { ...policy.dataPolicy, sendPrivateActorGoals: true } }),
    /privacy boundary/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal), { ...request, mutationAllowed: true }, policy),
    /forbid mutation/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal), { ...request, budget: { ...request.budget, maxCostUsd: 10 } }, policy),
    /exceeds/
  );
  const wrongActor = structuredClone(llmProposal);
  wrongActor.participants = ["character.w01.action-mirror"];
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(wrongActor), request, policy),
    /unrequested participant/
  );
  const wrongBranch = structuredClone(llmProposal);
  wrongBranch.branchRole = "opportunity";
  const baselineOnlyRequest = { ...request, branchPolicy: { allowed: ["baseline"], maxCandidates: 1 } };
  wrongBranch.source.requestRef = exactRef("world_os_simulation_request", baselineOnlyRequest.requestId, baselineOnlyRequest.version, baselineOnlyRequest);
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(wrongBranch), baselineOnlyRequest, policy),
    /unrequested branch role/
  );
  const wrongRequest = structuredClone(llmProposal);
  wrongRequest.source.requestRef = { ...wrongRequest.source.requestRef, contentHash: `sha256:${"0".repeat(64)}` };
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(wrongRequest), request, policy),
    /exact simulation request/
  );
  const wrongProvider = structuredClone(llmProposal);
  wrongProvider.source.providerId = "fixture.other-provider";
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(wrongProvider), request, policy),
    /provider identity/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal, { modelAlias: "substituted-model", outputTokens: 100, costUsd: 0 }), request, policy),
    /wrong model alias/
  );
  await assert.rejects(
    requestSimulationProposal({ id: "fixture.proposal-provider", async propose() { return { proposal: llmProposal }; } }, request, policy),
    /usage receipt/
  );
  await assert.rejects(
    requestSimulationProposal({ id: "fixture.proposal-provider", async propose() { return new Promise(() => {}); } }, { ...request, budget: { ...request.budget, timeoutMs: 5 } }, policy),
    /timed out/
  );
  await assert.rejects(
    requestSimulationProposal(createFixtureProposalProvider(llmProposal), { ...request, providerPolicyRef: { ...request.providerPolicyRef, contentHash: `sha256:${"0".repeat(64)}` } }, policy),
    /exact provider policy/
  );
});

test("LLM shadow mode persists only exact proposal and usage evidence, never mutation authority", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const { proposal: baseProposal } = await fixtureInputs();
  const policy = await readJson(join(exampleRoot, "providers", "future-llm-policy.json"));
  policy.version = 2;
  policy.enabled = true;
  policy.modelAlias = "fixture";
  const policyRef = exactRef("world_os_llm_provider_policy", policy.policyId, policy.version, policy);
  await putArtifact(project, policy, {
    kind: "world_os_llm_provider_policy",
    id: policy.policyId,
    version: policy.version,
    status: "candidate",
    createdAt: "2026-08-22T08:00:00.000Z",
    createdBy: "codex.root"
  });
  const request = await readJson(join(exampleRoot, "providers", "simulation-request.w01.next-event.json"));
  request.requestId = "simulation-request.w01.shadow";
  request.providerPolicyRef = policyRef;
  const requestRef = exactRef("world_os_simulation_request", request.requestId, request.version, request);
  await putArtifact(project, request, {
    kind: "world_os_simulation_request",
    id: request.requestId,
    version: request.version,
    status: "candidate",
    createdAt: request.requestedAt,
    createdBy: "codex.root"
  });
  const llmProposal = structuredClone(baseProposal);
  llmProposal.source.origin = "llm_api";
  llmProposal.source.providerId = "fixture.shadow-provider";
  llmProposal.source.requestRef = requestRef;
  const fixtureProvider = createFixtureProposalProvider(llmProposal, { modelAlias: "fixture", outputTokens: 123, costUsd: 0.02 });
  const provider = {
    ...fixtureProvider,
    kind: "world_os_llm_provider",
    trusted: true,
    localFixture: true,
    id: "fixture.shadow-provider"
  };
  const generated = await runLlmShadow(project, request, policy, provider, { now: "2026-08-22T08:01:00.000Z" });
  assert.equal(generated.status, "proposal_generated");
  assert.equal(generated.outputTokens, 123);
  assert.equal(generated.rawResponseStored, false);
  const repeated = await runLlmShadow(project, request, policy, provider, { now: "2026-08-22T08:01:00.000Z" });
  assert.equal(repeated.idempotent, true);
  const failedProvider = {
    kind: "world_os_llm_provider",
    trusted: true,
    localFixture: true,
    id: "fixture.shadow-failing",
    async propose() {
      throw Object.assign(new Error("model unavailable"), { code: "model_unavailable" });
    }
  };
  const failed = await runLlmShadow(project, request, policy, failedProvider, { now: "2026-08-22T08:02:00.000Z" });
  assert.equal(failed.status, "failed");
  assert.equal(failed.proposalRef, null);
  assert.equal(failed.errorCode, "model_unavailable");
  const receipts = await listLlmShadowReceipts(project, { worldId: "W01" });
  assert.equal(receipts.length, 2);
  const receiptPath = join(root, "llm-shadow-receipt.payload.json");
  const { receiptRef: _receiptRef, idempotent: _idempotent, ...receiptPayload } = generated;
  await writeFile(receiptPath, `${JSON.stringify(receiptPayload, null, 2)}\n`, "utf8");
  const validation = await validateDocument(join(exampleRoot, "schemas", "llm-shadow-receipt.schema.json"), receiptPath);
  assert.equal(validation.valid, true, validation.errors.join("; "));
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.llmShadowRuns, 2);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.graph.summary.missingReferenceCount, 0);
});

test("seed rebuild is byte-for-byte deterministic", async (t) => {
  const root = await tempDirectory(t);
  const first = join(root, "first");
  const second = join(root, "second");
  await rebuildSeedStore(seedManifestPath, first);
  await rebuildSeedStore(seedManifestPath, second);
  assert.deepEqual(await fileDigestMap(join(first, ".cineweave")), await fileDigestMap(join(second, ".cineweave")));
});

test("a committed event unlocks the next trigger and preserves a linear stream", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const first = await runEventProposal(project, proposalPath);
  const catalog = await readJson(join(exampleRoot, "triggers", "W01.triggers.json"));
  const firstState = await findArtifact(project, first.nextStateRef);
  const scan = scanTriggerCatalog(catalog, firstState.envelope.payload);
  const officialSearch = scan.entries.find((entry) => entry.triggerId === "trigger.w01.official-search-escalates");
  assert.equal(officialSearch.eligible, true);
  assert.equal(scan.entries.find((entry) => entry.triggerId === "trigger.w01.injured-traveler-arrives").status, "already_occurred");

  const second = await runEventProposal(project, nextProposalPath);
  assert.equal(second.status, "accepted_simulation");
  assert.equal(second.commit.version, 2);
  assert.equal(second.nextState.version, 3);
  assert.equal(second.nextState.sequence, 2);
  assert.equal(second.nextState.variables.community.laneTrust, "strained");
  const head = await deriveStreamHead(project, "W01");
  assert.equal(sameRef(head.commitRef, second.commitRef), true);
  assert.equal(sameRef(head.stateRef, second.nextStateRef), true);
});

test("read-only forecast exposes bounded candidate branches without persisting simulation artifacts", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const beforeArtifacts = await listArtifacts(project);
  const beforeHead = await deriveStreamHead(project, "W01", "simulation.main");
  const forecast = await forecastWorld(project, "W01");
  assert.equal(forecast.kind, "world_os_world_forecast");
  assert.equal(forecast.authority, "proposal_only");
  assert.equal(forecast.persisted, false);
  assert.equal(forecast.writePolicy, "read_only");
  assert.equal(forecast.branchSetPersisted, false);
  assert.equal(forecast.status, "ready");
  assert.equal(forecast.candidates.length, 1);
  assert.equal(forecast.candidates[0].proposalPersisted, false);
  assert.equal(forecast.candidates[0].decisionPersisted, false);
  assert.equal(forecast.candidates[0].projectedStatePersisted, false);
  assert.ok(forecast.candidates[0].projectedState);
  assert.equal(forecast.branchSet.selectionStatus, "selected_for_simulation");
  const afterArtifacts = await listArtifacts(project);
  const afterHead = await deriveStreamHead(project, "W01", "simulation.main");
  assert.equal(afterArtifacts.length, beforeArtifacts.length);
  assert.deepEqual(afterHead, beforeHead);
});

test("Codex run selects one branch, realizes delayed consequences and stops safely", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const run = await advanceWorld(project, "W01", { maxSteps: 10 });
  assert.equal(run.status, "advanced");
  assert.equal(run.stopReason, "no_due_trigger");
  assert.equal(run.committedSteps, 3);
  assert.equal(run.endSequence, 3);

  const firstFixture = await readJson(proposalPath);
  assert.equal(sameRef(run.steps[0].selectedProposalRef, exactRef("world_os_event_proposal", firstFixture.proposalId, firstFixture.proposalVersion, firstFixture)), true);
  const branchSet = await findArtifact(project, run.steps[1].branchSetRef);
  assert.equal(branchSet.envelope.payload.candidates.length, 2);
  assert.equal(branchSet.envelope.payload.candidates[0].candidateId, "official-search-pressure.baseline");
  assert.equal(branchSet.envelope.payload.candidates[1].candidateId, "official-search-pressure.deterioration");

  const finalState = await findArtifact(project, run.endStateRef);
  assert.equal(finalState.envelope.payload.threads.old_case.nextInquiry, "father-ledger");
  assert.equal(finalState.envelope.payload.entities.carriers["carrier.old-incense-tag"].condition, "inspected_order_only");
  assert.deepEqual(finalState.envelope.payload.pendingConsequences.map((item) => item.status), ["realized", "realized"]);
  assert.equal(finalState.envelope.payload.actors["character.w01.viewpoint-recordkeeper"].knowledge.includes("tag-order-suggests-trade-route"), true);

  const runReceipt = await findArtifact(project, run.receiptRef);
  for (const [schema, payload] of [
    ["branch-set.schema.json", branchSet.envelope.payload],
    ["simulation-run-receipt.schema.json", runReceipt.envelope.payload],
    ["state.schema.json", finalState.envelope.payload]
  ]) {
    const payloadPath = join(root, `${schema}.generated.json`);
    await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    const validation = await validateDocument(join(exampleRoot, "schemas", schema), payloadPath);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
});

test("W02 advances only the safe baseline and then stops at the threshold Gate", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const run = await advanceWorld(project, "W02", { maxSteps: 10 });
  assert.equal(run.status, "blocked");
  assert.equal(run.stopReason, "needs_human_gate");
  assert.equal(run.committedSteps, 1);
  assert.equal(run.attemptedSteps, 2);
  assert.equal(run.endSequence, 1);
  assert.equal(run.steps[1].commitRef, null);
  assert.ok(run.steps[1].gateRequestRef);

  const state = await findArtifact(project, run.endStateRef);
  assert.equal(state.envelope.payload.variables.gate.assessmentStatus, "collecting_baseline");
  assert.equal(state.envelope.payload.variables.gate.stabilizationStatus, "not_started");
  assert.equal(state.envelope.payload.variables.ecology.remoteImpact, "unmeasured");
  const catalog = await readJson(join(exampleRoot, "triggers", "W02.triggers.json"));
  const scan = scanTriggerCatalog(catalog, state.envelope.payload);
  const gated = scan.entries.find((item) => item.triggerId === "trigger.w02.gate-window-assessment");
  assert.equal(gated.conditionMet, true);
  assert.equal(gated.transitionEligible, false);
  assert.equal(gated.status, "needs_human_gate");
});

test("Portfolio scheduling advances runnable worlds fairly and preserves independent heads", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const portfolio = await advancePortfolio(project, { worldIds: ["W01", "W02"], maxCycles: 10 });
  assert.equal(portfolio.status, "blocked");
  assert.equal(portfolio.stopReason, "all_worlds_stopped");
  assert.equal(portfolio.committedSteps, 4);
  assert.equal(portfolio.attemptedCycles, 6);
  assert.deepEqual(new Set(portfolio.rounds.map((round) => round.worldId)), new Set(["W01", "W02"]));
  assert.equal(portfolio.rounds.filter((round) => round.worldId === "W01" && round.committedSteps === 1).length, 3);
  assert.equal(portfolio.rounds.filter((round) => round.worldId === "W02" && round.committedSteps === 1).length, 1);
  assert.equal(portfolio.rounds.some((round) => round.stopReason === "needs_human_gate"), true);
  assert.equal(portfolio.startHeads.length, 2);
  assert.equal(portfolio.endHeads.length, 2);
  const receiptPath = join(root, "portfolio-run-receipt.payload.json");
  const { receiptRef: _receiptRef, idempotent: _idempotent, health: _health, ...portfolioPayload } = portfolio;
  await writeFile(receiptPath, `${JSON.stringify(portfolioPayload, null, 2)}\n`, "utf8");
  const validation = await validateDocument(join(exampleRoot, "schemas", "portfolio-run-receipt.schema.json"), receiptPath);
  assert.equal(validation.valid, true, validation.errors.join("; "));
  const heads = await Promise.all([deriveStreamHead(project, "W01"), deriveStreamHead(project, "W02")]);
  assert.equal(heads[0].commitRef.version, 3);
  assert.equal(heads[1].commitRef.version, 1);
  await assert.rejects(advancePortfolio(project, { worldIds: ["W03"], maxCycles: 1 }), /no complete executable catalog set/);
  const blockedOnly = await advancePortfolio(project, { worldIds: ["W02"], maxCycles: 1 });
  assert.equal(blockedOnly.status, "blocked");
  const repeated = await advancePortfolio(project, { worldIds: ["W02"], maxCycles: 1 });
  assert.equal(repeated.idempotent, true);
  assert.equal(repeated.portfolioRunId, blockedOnly.portfolioRunId);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.portfolioRuns, 2);
});

test("Codex Brain composes preflight, shadow-free Portfolio and MCP dry-run into one auditable receipt", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const brain = await runCodexBrainCycle(project, {
    worldIds: ["W01", "W02"],
    maxCycles: 10,
    runKey: "brain-test-idempotent",
    dispatch: { dryRun: true, now: "2026-08-24T15:00:00.000Z" },
    now: "2026-08-24T15:00:00.000Z"
  });
  assert.equal(brain.status, "blocked");
  assert.equal(brain.stopReason, "needs_human_gate");
  assert.equal(brain.llmMode, "disabled");
  assert.equal(brain.mcpMode, "dry_run");
  assert.equal(brain.dispatch.status, "dry_run");
  assert.equal(brain.dispatch.pendingCount, 4);
  assert.equal(brain.dispatch.pendingProjectionRefs.length, 4);
  assert.equal(brain.shadowRunRefs.length, 0);
  const stored = await findArtifact(project, brain.receiptRef);
  assert.equal(stored.envelope.payload.kind, "world_os_codex_brain_run_receipt");
  const receiptPath = join(root, "codex-brain-run-receipt.generated.json");
  const { receiptRef: _receiptRef, idempotent: _idempotent, health: _health, ...payload } = brain;
  await writeFile(receiptPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const validation = await validateDocument(join(exampleRoot, "schemas", "codex-brain-run-receipt.schema.json"), receiptPath);
  assert.equal(validation.valid, true, validation.errors.join("; "));
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.codexBrainRuns, 1);
  const artifactsBeforeStatus = (await listArtifacts(project)).length;
  const status = await inspectCodexBrain(project, { worldIds: ["W01", "W02"] });
  assert.equal((await listArtifacts(project)).length, artifactsBeforeStatus);
  assert.equal(status.kind, "world_os_codex_brain_status");
  assert.deepEqual(status.worldIds, ["W01", "W02"]);
  assert.equal(status.health.status, "pass");
  assert.equal(status.worlds.length, 2);
  assert.equal(status.totals.pendingProjectionCount, 4);
  assert.equal(status.latestBrainRun.brainRunId, brain.brainRunId);
  assert.equal(status.worlds.every((world) => world.triggerScan.entries.every((entry) => !Object.hasOwn(entry, "evaluation"))), true);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
  const repeated = await runCodexBrainCycle(project, {
    worldIds: ["W01", "W02"],
    maxCycles: 10,
    runKey: "brain-test-idempotent",
    dispatch: { dryRun: true, now: "2026-08-24T15:00:00.000Z" },
    now: "2026-08-24T15:00:00.000Z"
  });
  assert.equal(repeated.idempotent, true);
  assert.equal(repeated.brainRunId, brain.brainRunId);
});

test("an exact human Gate resumes once, promotes an independent Canon head and preserves conflicts", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const run = await advanceWorld(project, "W02", { maxSteps: 10 });
  const request = await createGateRequest(project, run.steps[1].decisionRef);
  const firstApproval = await recordGateDecision(project, request.requestRef, {
    decision: "approve",
    actorId: "human.canon-owner",
    actorRole: "canon-owner",
    rationale: "先批准精确候选进入模拟恢复，再审阅正史提升。",
    decidedAt: "2026-04-21T00:00:00.000Z"
  });
  const revised = await recordGateDecision(project, request.requestRef, {
    decision: "revise",
    actorId: "human.canon-owner",
    actorRole: "canon-owner",
    rationale: "补充边界说明后重新批准同一版本。",
    decidedAt: "2026-04-21T00:01:00.000Z"
  });
  await assert.rejects(resumeSimulation(project, firstApproval.decisionRef), /latest decision/);
  const approval = await recordGateDecision(project, request.requestRef, {
    decision: "approve",
    actorId: "human.canon-owner",
    actorRole: "canon-owner",
    rationale: "补充边界说明后批准精确版本。",
    decidedAt: "2026-04-21T00:02:00.000Z"
  });
  const duplicateApproval = await recordGateDecision(project, request.requestRef, {
    decision: "approve",
    actorId: "human.canon-owner",
    actorRole: "canon-owner",
    rationale: "补充边界说明后批准精确版本。",
    decidedAt: "2026-04-21T00:02:00.000Z"
  });
  assert.equal(duplicateApproval.idempotent, true);
  const resumed = await resumeSimulation(project, approval.decisionRef);
  assert.equal(resumed.status, "accepted_simulation");
  assert.equal(resumed.commit.approvalRefs.length, 1);
  assert.equal(sameRef(resumed.commit.approvalRefs[0], approval.decisionRef), true);
  const resumedAgain = await resumeSimulation(project, approval.decisionRef);
  assert.equal(resumedAgain.idempotent, true);
  const conflictingFact = {
    kind: "world_os_canon_fact",
    contractVersion: "0.1.0",
    canonFactId: "canon.w02.conflicting-claim",
    version: 1,
    worldId: "W02",
    factPath: "/events/event.w02.gate-window-assessment",
    value: { eventId: "event.w02.gate-window-assessment", publicSummary: "另一份未解决的候选叙述。" },
    validFromCommitRef: resumed.commitRef,
    validUntilCommitRef: null,
    status: "active",
    lock: "soft",
    sourceRefs: [resumed.commitRef, request.request.proposalRef],
    approvalRef: approval.decisionRef,
    conflictRefs: [],
    writer: { kind: "codex", id: "codex.root" },
    createdAt: "2026-04-21T00:02:00.000Z"
  };
  await putArtifact(project, conflictingFact, {
    kind: "world_os_canon_fact",
    id: conflictingFact.canonFactId,
    version: 1,
    status: "approved",
    createdAt: conflictingFact.createdAt,
    createdBy: "codex.root"
  });
  const promoted = await promoteCanon(project, approval.decisionRef);
  assert.equal(promoted.status, "promoted_with_conflicts");
  const promotedAgain = await promoteCanon(project, approval.decisionRef);
  assert.equal(promotedAgain.idempotent, true);
  const canonHead = await deriveCanonHead(project, "W02");
  assert.equal(canonHead.ledger.sequence, 1);
  assert.equal(canonHead.ledger.status, "conflicted");
  const fact = (await findArtifact(project, promoted.factRefs[0])).envelope.payload;
  const ledger = (await findArtifact(project, promoted.ledgerRef)).envelope.payload;
  const promotion = (await findArtifact(project, promoted.promotionRef)).envelope.payload;
  assert.equal(fact.status, "conflicted");
  assert.equal(ledger.conflicts[0].allowedInProduction, false);
  for (const [schema, payload] of [
    ["gate-request.schema.json", request.request],
    ["gate-decision.schema.json", approval.decision],
    ["event-commit.schema.json", resumed.commit],
    ["canon-fact.schema.json", fact],
    ["continuity-ledger.schema.json", ledger],
    ["canon-promotion.schema.json", promotion]
  ]) {
    const payloadPath = join(root, `${schema}.generated.json`);
    await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    const validation = await validateDocument(join(exampleRoot, "schemas", schema), payloadPath);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
  const health = await verifyWorldOsProject(project);
  assert.equal(health.graph.summary.missingReferenceCount, 0);
  assert.equal(health.graph.summary.cycleCount, 0);
  assert.equal(revised.decision.status, "revision_requested");
});

test("Codex can safely pause for a missing template and resume from the exact work item head", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const original = await readJson(join(exampleRoot, "templates", "W01.events.json"));
  const withheld = {
    ...structuredClone(original),
    version: 2,
    templates: original.templates.filter((template) => template.triggerId !== "trigger.w01.injured-traveler-arrives")
  };
  await submitEventTemplateCatalog(project, withheld);
  const waiting = await advanceWorld(project, "W01", { maxSteps: 1 });
  assert.equal(waiting.stopReason, "awaiting_codex_template");
  assert.equal(waiting.steps[0].resultStatus, "awaiting_codex_template");
  const workItem = (await findArtifact(project, waiting.steps[0].workItemRef)).envelope.payload;
  const complete = { ...structuredClone(original), version: 3 };
  const resumed = await resumeTemplateWorkItem(project, waiting.steps[0].workItemRef, complete);
  assert.equal(resumed.run.committedSteps, 1);
  assert.equal(resumed.run.endSequence, 1);
  assert.equal(resumed.workItem.status, "resolved");
  const workPath = join(root, "template-work-item.generated.json");
  await writeFile(workPath, `${JSON.stringify(resumed.workItem, null, 2)}\n`, "utf8");
  const validation = await validateDocument(join(exampleRoot, "schemas", "template-work-item.schema.json"), workPath);
  assert.equal(validation.valid, true, validation.errors.join("; "));
  const wrongWorld = { ...structuredClone(complete), version: 4, worldId: "W02" };
  await assert.rejects(submitEventTemplateCatalog(project, wrongWorld), /world boundary/);
  assert.equal(workItem.status, "open");
});

test("a pre-commit crash leaves classified staging and deterministic retry recovers", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await assert.rejects(
    advanceWorld(project, "W01", { maxSteps: 1, beforeCommit() { throw new Error("injected pre-commit crash"); } }),
    /injected pre-commit crash/
  );
  const interrupted = await auditWorldOsProject(project);
  assert.equal(interrupted.summary.terminalCommits, 0);
  assert.equal(interrupted.summary.stagedStates, 1);
  assert.equal(interrupted.summary.stagedDecisions, 1);

  const retry = await advanceWorld(project, "W01", { maxSteps: 1 });
  assert.equal(retry.committedSteps, 1);
  assert.equal(retry.endSequence, 1);
  const recovered = await auditWorldOsProject(project);
  assert.equal(recovered.summary.stagedStates, 0);
  assert.equal(recovered.summary.stagedDecisions, 0);
});

test("a post-commit projection failure still produces a recovery RunReceipt", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const run = await advanceWorld(project, "W01", {
    maxSteps: 1,
    afterCommit() { throw new Error("injected post-commit projection failure"); }
  });
  assert.equal(run.status, "blocked");
  assert.equal(run.stopReason, "committed_projection_pending");
  assert.equal(run.committedSteps, 1);
  assert.equal(run.steps[0].projectionRef, null);
  assert.match(run.steps[0].error, /injected post-commit/);
  assert.ok(await findArtifact(project, run.receiptRef));
  const platform = await readJson(platformPath);
  const reconciled = await reconcilePlatformProjections(project, platform);
  assert.equal(reconciled.created.length, 1);
});

test("projection reconciliation recovers a terminal commit after projection failure", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await assert.rejects(
    runEventProposal(project, proposalPath, { afterCommit() { throw new Error("injected projection failure"); } }),
    /injected projection failure/
  );
  const head = await deriveStreamHead(project, "W01");
  assert.equal(head.commitRef.version, 1);
  const platform = await readJson(platformPath);
  assert.equal((await listOutbox(project, platform)).pending, 0);
  const recovered = await reconcilePlatformProjections(project, platform);
  assert.equal(recovered.created.length, 1);
  assert.equal((await listOutbox(project, platform)).pending, 1);
  const repeated = await reconcilePlatformProjections(project, platform);
  assert.equal(repeated.created.length, 0);
  assert.equal(repeated.existing.length, 1);
});

test("trusted MCP dispatcher claims an exact projection and records a terminal attempt", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await runEventProposal(project, proposalPath);
  const platform = await readJson(platformPath);
  let calls = 0;
  const connector = {
    kind: "world_os_mcp_connector",
    trusted: true,
    id: "fixture.mcp",
    async call(dispatch) {
      calls += 1;
      return createLocalFixtureResponse(dispatch, "2026-08-22T08:05:00.000Z");
    }
  };
  const dispatched = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-22T08:05:00.000Z",
    maxAttempts: 3
  });
  assert.equal(calls, 1);
  assert.equal(dispatched.attemptResults[0].status, "succeeded");
  assert.equal(dispatched.receipts.length, 1);
  const claims = await listMcpClaims(project);
  const attempts = await listMcpAttempts(project);
  assert.equal(claims.length, 1);
  assert.equal(attempts.length, 1);
  for (const [schema, payload] of [
    ["mcp-dispatch-claim.schema.json", claims[0].claim],
    ["mcp-attempt-receipt.schema.json", attempts[0].attempt]
  ]) {
    const payloadPath = join(root, schema);
    await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    const validation = await validateDocument(join(exampleRoot, "schemas", schema), payloadPath);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.mcpClaims, 1);
  assert.equal(audit.summary.mcpAttempts, 1);
  assert.equal((await listOutbox(project, platform)).pending, 0);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.graph.summary.missingReferenceCount, 0);
});

test("MCP dispatcher applies deterministic backoff and dead-letters after the explicit attempt budget", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await runEventProposal(project, proposalPath);
  const platform = await readJson(platformPath);
  const connector = {
    kind: "world_os_mcp_connector",
    trusted: true,
    id: "fixture.failing-mcp",
    async call() {
      throw Object.assign(new Error("remote unavailable"), { code: "remote_unavailable" });
    }
  };
  const first = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-22T08:05:00.000Z",
    maxAttempts: 2,
    baseBackoffSeconds: 30
  });
  assert.equal(first.attemptResults[0].status, "failed");
  const backoff = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-22T08:05:15.000Z",
    maxAttempts: 2,
    baseBackoffSeconds: 30
  });
  assert.equal(backoff.skipped[0].reason, "backoff");
  const second = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-22T08:05:31.000Z",
    maxAttempts: 2,
    baseBackoffSeconds: 30
  });
  assert.equal(second.attemptResults[0].status, "dead_letter");
  assert.equal((await listMcpAttempts(project)).length, 2);
  assert.equal((await listOutbox(project, platform)).pending, 1);
  await assert.rejects(dispatchOutbox(project, platform, { id: "untrusted", async call() {} }, { allowNetwork: true }), /trusted=true/);
  await assert.rejects(dispatchOutbox(project, platform, connector, { allowNetwork: false }), /network dispatch is disabled/);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.graph.summary.missingReferenceCount, 0);
});

test("MCP dispatcher validates timeout options before creating a claim", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await runEventProposal(project, proposalPath);
  const platform = await readJson(platformPath);
  const connector = {
    kind: "world_os_mcp_connector",
    trusted: true,
    id: "fixture.timeout-validation",
    async call() {
      throw new Error("must not be called");
    }
  };

  await assert.rejects(
    () => dispatchOutbox(project, platform, connector, { allowNetwork: true, timeoutMs: 0 }),
    /timeoutMs must be an integer/,
  );
  assert.equal((await listMcpClaims(project)).length, 0);
  assert.equal((await listMcpAttempts(project)).length, 0);
  assert.equal((await listOutbox(project, platform)).pending, 1);
});

test("event to terminal commit to MCP outbox to receipt is end-to-end auditable", async (t) => {
  const root = await tempDirectory(t);
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const result = await runEventProposal(project, proposalPath);
  assert.equal(result.status, "accepted_simulation");
  assert.equal(result.health.graph.summary.missingReferenceCount, 0);
  assert.equal(result.health.graph.summary.cycleCount, 0);
  const head = await deriveStreamHead(project, "W01");
  assert.equal(sameRef(head.commitRef, result.commitRef), true);
  assert.equal(sameRef(head.stateRef, result.nextStateRef), true);
  await assert.rejects(runEventProposal(project, proposalPath), /current stream head/);

  const platform = await readJson(platformPath);
  const pending = await listOutbox(project, platform);
  assert.equal(pending.pending, 1);
  const entry = pending.entries[0];
  assert.equal(entry.dispatch.transport, "mcp");
  assert.equal(entry.dispatch.arguments.projection.canonLabel, "模拟分支／非正史");
  assert.equal(entry.dispatch.arguments.metadata.authority, "non_authoritative_view");

  const projection = await findArtifact(project, entry.projectionRef);
  const wrongPlatform = structuredClone(platform);
  wrongPlatform.profileId = "platform-profile.other-private";
  wrongPlatform.platformId = "platform.other-private";
  wrongPlatform.serverAlias = "other-server";
  wrongPlatform.toolName = "other_tool";
  assert.equal((await listOutbox(project, wrongPlatform)).pending, 0);
  assert.throws(() => createMcpDispatch(projection.envelope, wrongPlatform), /not bound to this exact MCP platform profile/);
  const response = createLocalFixtureResponse(entry.dispatch);
  const receipt = await recordPublishReceipt(project, projection, response);
  assert.equal(receipt.envelope.payload.canonMutation, false);
  assert.equal(receipt.envelope.payload.status, "succeeded");

  const signalInput = {
    worldId: "W01",
    sourceProjectionRef: entry.projectionRef,
    sourceReceiptRef: receipt.envelope.artifactRef,
    platformProfileRef: receipt.envelope.payload.platformProfileRef,
    signalType: "comment",
    sourceEventId: "platform-comment-001",
    observedAt: "2026-08-22T08:06:00.000Z",
    observation: {
      metric: "comment",
      value: 1,
      choiceId: null,
      commentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      commentClass: "question"
    },
    privacy: {
      identity: "redacted",
      content: "hashed",
      retention: "standard",
      containsRawText: false
    }
  };
  const signal = await ingestExternalSignal(project, signalInput, { receivedAt: "2026-08-22T08:06:01.000Z" });
  const signalAgain = await ingestExternalSignal(project, signalInput, { receivedAt: "2026-08-22T08:06:01.000Z" });
  assert.equal(signal.idempotent, false);
  assert.equal(signalAgain.idempotent, true);
  assert.equal(sameRef(signal.signalRef, signalAgain.signalRef), true);
  assert.equal((await listExternalSignals(project, { worldId: "W01" })).length, 1);
  await assert.rejects(
    ingestExternalSignal(project, {
      ...signalInput,
      observation: { ...signalInput.observation, value: 2 }
    }, { receivedAt: "2026-08-22T08:06:01.000Z" }),
    /identity is already bound to different content/
  );
  const signalPath = join(root, "external-signal.payload.json");
  await writeFile(signalPath, `${JSON.stringify(signal.signal, null, 2)}\n`, "utf8");
  const signalValidation = await validateDocument(join(exampleRoot, "schemas", "external-signal.schema.json"), signalPath);
  assert.equal(signalValidation.valid, true, signalValidation.errors.join("; "));
  const signalUse = await recordExternalSignalUse(project, {
    signalRef: signal.signalRef,
    proposalRef: result.stored.proposalRef,
    outcome: "used_as_evidence"
  }, { recordedAt: "2026-08-22T08:07:00.000Z" });
  const signalUseAgain = await recordExternalSignalUse(project, {
    signalRef: signal.signalRef,
    proposalRef: result.stored.proposalRef,
    outcome: "used_as_evidence"
  }, { recordedAt: "2026-08-22T08:07:00.000Z" });
  assert.equal(signalUse.idempotent, false);
  assert.equal(signalUseAgain.idempotent, true);
  assert.equal((await listExternalSignalUses(project, { worldId: "W01" })).length, 1);
  const signalUsePath = join(root, "external-signal-use.payload.json");
  await writeFile(signalUsePath, `${JSON.stringify(signalUse.use, null, 2)}\n`, "utf8");
  const signalUseValidation = await validateDocument(join(exampleRoot, "schemas", "external-signal-use.schema.json"), signalUsePath);
  assert.equal(signalUseValidation.valid, true, signalUseValidation.errors.join("; "));
  await assert.rejects(
    recordExternalSignalUse(project, {
      signalRef: signal.signalRef,
      proposalRef: result.stored.proposalRef,
      outcome: "deferred_for_context"
    }, { recordedAt: "2026-08-22T08:07:00.000Z" }),
    /Only used_as_evidence may bind a proposalRef/
  );
  await assert.rejects(
    ingestExternalSignal(project, {
      ...signalInput,
      sourceEventId: "platform-comment-002",
      observation: { ...signalInput.observation, commentHash: null, commentClass: "question" }
    }, { receivedAt: "2026-08-22T08:06:01.000Z" }),
    /classified comment must retain only its content hash/
  );
  await assert.rejects(
    ingestExternalSignal(project, {
      ...signalInput,
      sourceEventId: "platform-comment-003",
      observation: { ...signalInput.observation, rawText: "private user text" }
    }, { receivedAt: "2026-08-22T08:06:01.000Z" }),
    /observation fields must be exact/
  );

  const generatedContracts = [
    ["transition-decision.schema.json", result.decision],
    ["event-commit.schema.json", result.commit],
    ["platform-projection.schema.json", result.projection],
    ["mcp-dispatch.schema.json", entry.dispatch],
    ["publish-receipt.schema.json", receipt.envelope.payload]
  ];
  for (const [schema, payload] of generatedContracts) {
    const payloadPath = join(root, `${schema}.payload.json`);
    await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    const validation = await validateDocument(join(exampleRoot, "schemas", schema), payloadPath);
    assert.equal(validation.valid, true, `${schema}: ${validation.errors.join("; ")}`);
  }

  const delivered = await listOutbox(project, platform);
  assert.equal(delivered.pending, 0);
  assert.equal(delivered.entries[0].status, "succeeded");
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
  assert.equal(health.graph.summary.missingReferenceCount, 0);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.externalSignals, 1);
  assert.equal(audit.summary.externalSignalUses, 1);
  assert.equal(audit.health.graph.summary.cycleCount, 0);
  await putArtifact(project, {
    ...signal.signal,
    signalId: "signal.tampered",
    sourceEventId: "platform-comment-tampered"
  }, {
    kind: signal.signal.kind,
    id: "signal.tampered",
    version: 1,
    status: "candidate",
    createdAt: signal.signal.receivedAt,
    createdBy: "codex.root"
  });
  await assert.rejects(verifyWorldOsProject(project), /dedupeKey is not bound to its source receipt/);
});
