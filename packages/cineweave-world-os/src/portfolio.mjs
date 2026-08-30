import { resolve } from "node:path";
import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_IMPLEMENTATION_VERSION, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, sameRef } from "./json.mjs";
import { deriveStreamHead, verifyWorldOsProject } from "./store.mjs";
import { advanceWorld } from "./scheduler.mjs";
import { assertPortfolioRunReceiptContract } from "./portfolio-contract.mjs";
import { listWorldRegistrations } from "./registry.mjs";

function latestPayload(artifacts, kind, predicate, label) {
  const matches = artifacts
    .filter((item) => item.envelope.payload?.kind === kind && predicate(item.envelope.payload))
    .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version);
  if (!matches.length) throw new Error(`No ${label} artifact is available`);
  const version = matches[0].envelope.artifactRef.version;
  if (matches.filter((item) => item.envelope.artifactRef.version === version).length !== 1) throw new Error(`Latest ${label} artifact is ambiguous`);
  return matches[0].envelope.payload;
}

function assertWorldIds(worldIds) {
  if (!Array.isArray(worldIds) || !worldIds.length || new Set(worldIds).size !== worldIds.length || worldIds.some((id) => !WORLD_ID_PATTERN.test(id))) {
    throw new TypeError("worldIds must be unique W## identifiers");
  }
}

async function loadPortfolioRuntime(projectRoot, requestedWorldIds) {
  const root = resolve(projectRoot);
  const artifacts = await listArtifacts(root);
  const workspace = latestPayload(artifacts, ARTIFACT_KINDS.workspace, () => true, "workspace");
  const registrations = await listWorldRegistrations(root);
  const latestRegistrations = new Map();
  for (const item of registrations) {
    const current = latestRegistrations.get(item.registration.worldId);
    if (!current || item.registration.version > current.registration.version) latestRegistrations.set(item.registration.worldId, item);
  }
  const configuredWorldIds = [...new Set([
    ...(workspace.worlds || []).map((world) => world.id),
    ...[...latestRegistrations.values()].filter((item) => item.registration.status === "runnable").map((item) => item.registration.worldId)
  ])];
  const catalogKinds = [ARTIFACT_KINDS.worldCard, ARTIFACT_KINDS.triggerCatalog, ARTIFACT_KINDS.actionCatalog, ARTIFACT_KINDS.eventTemplateCatalog];
  const runnableWorldIds = configuredWorldIds.filter((worldId) => catalogKinds.every((kind) => artifacts.some((item) => item.envelope.payload?.kind === kind && item.envelope.payload.worldId === worldId)));
  const worldIds = requestedWorldIds || runnableWorldIds;
  assertWorldIds(worldIds);
  for (const worldId of worldIds) {
    if (!configuredWorldIds.includes(worldId)) throw new Error(`Portfolio world ${worldId} is not declared by the workspace`);
    if (!runnableWorldIds.includes(worldId)) throw new Error(`Portfolio world ${worldId} has no complete executable catalog set`);
  }
  const workspaceRef = exactRef(ARTIFACT_KINDS.workspace, workspace.workspaceId, workspace.version, workspace);
  const shares = new Map();
  for (const worldId of worldIds) {
    const registration = latestRegistrations.get(worldId)?.registration;
    const bucket = (workspace.allocation?.buckets || []).find((item) => (item.worldIds || []).includes(worldId));
    const share = registration?.status === "runnable"
      ? registration.allocationShare
      : bucket ? Math.floor(Number(bucket.share || 0) / Math.max(1, bucket.worldIds.length)) : 1;
    if (!Number.isSafeInteger(share) || share < 1) throw new Error(`Portfolio allocation for ${worldId} is not a positive integer share`);
    shares.set(worldId, share);
  }
  const heads = [];
  for (const worldId of worldIds) {
    const triggerCatalog = latestPayload(artifacts, ARTIFACT_KINDS.triggerCatalog, (item) => item.worldId === worldId, `${worldId} trigger catalog`);
    const head = await deriveStreamHead(root, worldId, "simulation.main");
    const stateRef = head?.stateRef || triggerCatalog.initialStateRef;
    const stateItem = await findArtifact(root, stateRef);
    const state = stateItem.envelope.payload;
    heads.push({ worldId, stateRef, commitRef: head?.commitRef || null, sequence: state.sequence, clockAt: state.clock.at });
  }
  return { root, workspace, workspaceRef, worldIds, shares, heads };
}

// Read-only planning surface used by the Codex Brain orchestrator. Keeping the
// world resolution logic in one place prevents a controller from accidentally
// scheduling a different world set than the Portfolio receipt records.
export async function inspectPortfolio(projectRoot, options = {}) {
  const runtime = await loadPortfolioRuntime(projectRoot, options.worldIds);
  return {
    workspaceRef: runtime.workspaceRef,
    worldIds: runtime.worldIds,
    shares: Object.fromEntries(runtime.shares.entries()),
    heads: runtime.heads
  };
}

function chooseWorld(activeWorldIds, served, shares) {
  return [...activeWorldIds].sort((left, right) => {
    const leftScore = (served.get(left) + 1) / shares.get(left);
    const rightScore = (served.get(right) + 1) / shares.get(right);
    return leftScore - rightScore || left.localeCompare(right);
  })[0];
}

async function currentHead(root, worldId) {
  const artifacts = await listArtifacts(root);
  const head = await deriveStreamHead(root, worldId, "simulation.main");
  const stateRef = head?.stateRef || latestPayload(artifacts, ARTIFACT_KINDS.triggerCatalog, (item) => item.worldId === worldId, `${worldId} trigger catalog`).initialStateRef;
  const stateItem = await findArtifact(root, stateRef);
  return { worldId, stateRef, commitRef: head?.commitRef || null, sequence: stateItem.envelope.payload.sequence, clockAt: stateItem.envelope.payload.clock.at };
}

function portfolioStatus(stopReason, rounds) {
  if (stopReason === "stale_after_race") return "stale";
  if (rounds.some((round) => ["blocked", "scheduler_error"].includes(round.resultStatus))) return "blocked";
  if (rounds.some((round) => round.resultStatus === "advanced") || rounds.some((round) => round.committedSteps > 0)) return "advanced";
  return "stopped";
}

export async function advancePortfolio(projectRoot, options = {}) {
  const maxCycles = Number(options.maxCycles ?? 10);
  if (!Number.isSafeInteger(maxCycles) || maxCycles < 1 || maxCycles > 100) throw new TypeError("maxCycles must be an integer from 1 to 100");
  const runtime = await loadPortfolioRuntime(projectRoot, options.worldIds);
  const identity = {
    workspaceRef: runtime.workspaceRef,
    worldIds: runtime.worldIds,
    maxCycles,
    startHeads: runtime.heads.map(({ worldId, stateRef, commitRef }) => ({ worldId, stateRef, commitRef }))
  };
  const digest = sha256Canonical(identity);
  const portfolioRunId = `portfolio-run.${digest.slice("sha256:".length, "sha256:".length + 32)}`;
  const existing = await findArtifactByVersion(runtime.root, ARTIFACT_KINDS.portfolioRunReceipt, portfolioRunId, 1);
  if (existing) {
    const existingReceipt = assertPortfolioRunReceiptContract(existing.envelope.payload);
    if (existingReceipt.portfolioRunId !== portfolioRunId
      || !sameRef(existing.envelope.artifactRef, exactRef(ARTIFACT_KINDS.portfolioRunReceipt, portfolioRunId, 1, existingReceipt))) {
      throw new Error(`PortfolioRunReceipt ${portfolioRunId}@1 is not content-addressed exactly`);
    }
    const health = await verifyWorldOsProject(runtime.root);
    return { ...existingReceipt, receiptRef: existing.envelope.artifactRef, idempotent: true, health };
  }

  const active = new Set(runtime.worldIds);
  const served = new Map(runtime.worldIds.map((worldId) => [worldId, 0]));
  const rounds = [];
  let stopReason = "budget_exhausted";
  for (let cycle = 1; cycle <= maxCycles && active.size; cycle += 1) {
    const worldId = chooseWorld(active, served, runtime.shares);
    served.set(worldId, served.get(worldId) + 1);
    const before = await currentHead(runtime.root, worldId);
    const result = await advanceWorld(runtime.root, worldId, { maxSteps: 1 });
    const after = await currentHead(runtime.root, worldId);
    rounds.push({
      cycle,
      worldId,
      allocationShare: runtime.shares.get(worldId),
      receiptRef: result.receiptRef,
      resultStatus: result.status,
      stopReason: result.stopReason,
      startSequence: before.sequence,
      endSequence: after.sequence,
      committedSteps: result.committedSteps
    });
    if (result.stopReason !== "max_steps_reached" || result.committedSteps === 0) active.delete(worldId);
    if (result.stopReason === "stale_after_race") {
      stopReason = "stale_after_race";
      break;
    }
  }
  if (!active.size && stopReason !== "stale_after_race") stopReason = "all_worlds_stopped";
  const endHeads = [];
  for (const worldId of runtime.worldIds) endHeads.push(await currentHead(runtime.root, worldId));
  const endHeadRecords = endHeads.map(({ worldId, stateRef, commitRef }) => ({ worldId, stateRef, commitRef }));
  const startedAt = new Date(Math.min(...runtime.heads.map((head) => Date.parse(head.clockAt)))).toISOString();
  const endedAt = new Date(Math.max(...endHeads.map((head) => Date.parse(head.clockAt)))).toISOString();
  const committedSteps = rounds.reduce((sum, round) => sum + round.committedSteps, 0);
  const receipt = {
    kind: ARTIFACT_KINDS.portfolioRunReceipt,
    contractVersion: WORLD_OS_VERSION,
    portfolioRunId,
    version: 1,
    implementationVersion: WORLD_OS_IMPLEMENTATION_VERSION,
    workspaceRef: runtime.workspaceRef,
    worldIds: runtime.worldIds,
    allocationPolicy: "weighted_fair_deficit_round_robin",
    maxCycles,
    startedAt,
    endedAt,
    writer: { kind: "codex", id: "codex.root" },
    startHeads: runtime.heads.map(({ worldId, stateRef, commitRef }) => ({ worldId, stateRef, commitRef })),
    endHeads: endHeadRecords,
    rounds,
    attemptedCycles: rounds.length,
    committedSteps,
    status: portfolioStatus(stopReason, rounds),
    stopReason
  };
  assertPortfolioRunReceiptContract(receipt);
  const stored = await putArtifact(runtime.root, receipt, {
    kind: ARTIFACT_KINDS.portfolioRunReceipt,
    id: receipt.portfolioRunId,
    version: receipt.version,
    status: receipt.status === "blocked" ? "blocked" : receipt.status === "stale" ? "failed" : "candidate",
    createdAt: receipt.endedAt,
    createdBy: "codex.root"
  });
  const health = await verifyWorldOsProject(runtime.root);
  return { ...receipt, receiptRef: stored.envelope.artifactRef, idempotent: false, health };
}
