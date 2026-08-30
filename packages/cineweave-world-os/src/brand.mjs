import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { isExactRef, isPlainObject, exactRef, sameRef } from "./json.mjs";
import { listWorldRegistrations } from "./registry.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const DECISIONS = new Set(["approve", "reject", "revise"]);
const ECHO_STATUSES = new Set(["proposed", "approved", "retired"]);

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return value;
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function echoId({ workspaceRef, worldIds, symbolId, surfaceForm, semanticIntent }) {
  return `brand-echo.${sha256Canonical({ workspaceRef, worldIds, symbolId, surfaceForm, semanticIntent }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function decisionId({ brandEchoRef, decision, actor, decidedAt }) {
  return `brand-echo-decision.${sha256Canonical({ brandEchoRef, decision, actor, decidedAt }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function assertWorldIds(worldIds) {
  if (!Array.isArray(worldIds) || worldIds.length < 2 || new Set(worldIds).size !== worldIds.length || worldIds.some((id) => !WORLD_ID_PATTERN.test(id))) throw new TypeError("BrandEcho requires at least two unique W## world IDs");
  return [...worldIds].sort();
}

export function assertBrandEchoContract(echo) {
  if (!isPlainObject(echo) || echo.kind !== ARTIFACT_KINDS.brandEcho || echo.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported BrandEcho contract");
  const keys = ["kind", "contractVersion", "echoId", "version", "workspaceRef", "worldIds", "symbolId", "surfaceForm", "semanticIntent", "usageScope", "canonImpact", "crossWorldCausality", "sharedActorRefs", "sharedItemRefs", "status", "approvalRef", "approvedAt", "createdAt", "createdBy"];
  if (Object.keys(echo).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("BrandEcho fields must be exact");
  const sortedWorldIds = assertWorldIds(echo.worldIds);
  if (!IDENTIFIER_PATTERN.test(echo.echoId) || echo.echoId !== echoId(echo) || !Number.isSafeInteger(echo.version) || echo.version < 1
    || !isExactRef(echo.workspaceRef) || echo.workspaceRef.kind !== ARTIFACT_KINDS.workspace || JSON.stringify(sortedWorldIds) !== JSON.stringify(echo.worldIds)
    || typeof echo.symbolId !== "string" || !IDENTIFIER_PATTERN.test(echo.symbolId) || typeof echo.surfaceForm !== "string" || !echo.surfaceForm.trim()
    || typeof echo.semanticIntent !== "string" || !echo.semanticIntent.trim() || echo.usageScope !== "shared_motif_only" || echo.canonImpact !== "none"
    || echo.crossWorldCausality !== "forbidden" || !Array.isArray(echo.sharedActorRefs) || echo.sharedActorRefs.length !== 0
    || !Array.isArray(echo.sharedItemRefs) || echo.sharedItemRefs.length !== 0 || !ECHO_STATUSES.has(echo.status)) throw new TypeError("BrandEcho identity or L1 boundary is invalid");
  if (echo.approvalRef !== null && (!isExactRef(echo.approvalRef) || echo.approvalRef.kind !== ARTIFACT_KINDS.brandEchoDecision)) throw new TypeError("BrandEcho.approvalRef is invalid");
  if (echo.status === "proposed" && (echo.approvalRef !== null || echo.approvedAt !== null)) throw new Error("Proposed BrandEcho cannot carry an activation approval");
  if (echo.status === "approved" && (echo.approvalRef === null || echo.approvedAt === null)) throw new Error("Approved BrandEcho requires an exact human decision");
  if (echo.approvedAt !== null) assertDate(echo.approvedAt, "BrandEcho.approvedAt");
  assertDate(echo.createdAt, "BrandEcho.createdAt");
  assertWriter(echo.createdBy, "BrandEcho.createdBy");
  return echo;
}

export function assertBrandEchoDecisionContract(decision) {
  if (!isPlainObject(decision) || decision.kind !== ARTIFACT_KINDS.brandEchoDecision || decision.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported BrandEchoDecision contract");
  const keys = ["kind", "contractVersion", "decisionId", "version", "brandEchoRef", "decision", "actor", "decidedAt", "rationale", "authority", "recordedBy"];
  if (Object.keys(decision).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("BrandEchoDecision fields must be exact");
  if (!IDENTIFIER_PATTERN.test(decision.decisionId) || decision.decisionId !== decisionId(decision) || decision.version !== 1
    || !isExactRef(decision.brandEchoRef) || decision.brandEchoRef.kind !== ARTIFACT_KINDS.brandEcho || !DECISIONS.has(decision.decision)
    || !isPlainObject(decision.actor) || Object.keys(decision.actor).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || decision.actor.kind !== "human" || typeof decision.actor.id !== "string" || !decision.actor.id.trim() || decision.actor.id.length > 160
    || typeof decision.rationale !== "string" || !decision.rationale.trim() || decision.rationale.length > 2000
    || decision.authority !== "human_gate") throw new TypeError("BrandEchoDecision authority or identity is invalid");
  assertDate(decision.decidedAt, "BrandEchoDecision.decidedAt");
  assertWriter(decision.recordedBy, "BrandEchoDecision.recordedBy");
  return decision;
}

async function loadExact(root, ref, kind, label) {
  if (!isExactRef(ref) || ref.kind !== kind) throw new Error(`${label} must be an exact ${kind} reference`);
  const item = await findArtifact(root, ref);
  if (!sameRef(item.envelope.artifactRef, ref)) throw new Error(`${label} is not the exact stored artifact`);
  return item;
}

async function latestWorkspace(root) {
  const items = (await listArtifacts(root)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.workspace).sort((left, right) => right.envelope.payload.version - left.envelope.payload.version);
  if (!items.length) throw new Error("No workspace artifact is available");
  return items[0];
}

export function brandEchoRef(echo) {
  assertBrandEchoContract(echo);
  return exactRef(ARTIFACT_KINDS.brandEcho, echo.echoId, echo.version, echo);
}

export function brandEchoDecisionRef(decision) {
  assertBrandEchoDecisionContract(decision);
  return exactRef(ARTIFACT_KINDS.brandEchoDecision, decision.decisionId, decision.version, decision);
}

async function knownWorldIds(root, workspace) {
  const registrations = await listWorldRegistrations(root);
  return new Set([
    ...(workspace.worlds || []).map((world) => world.id),
    ...registrations.filter((item) => !["rejected", "retired"].includes(item.registration.status)).map((item) => item.registration.worldId)
  ]);
}

export async function verifyBrandEcho(projectRoot, echoRef) {
  const root = projectRoot;
  const item = await loadExact(root, echoRef, ARTIFACT_KINDS.brandEcho, "BrandEcho");
  const echo = assertBrandEchoContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, brandEchoRef(echo))) throw new Error("BrandEcho is not content-addressed exactly");
  const workspaceItem = await loadExact(root, echo.workspaceRef, ARTIFACT_KINDS.workspace, "BrandEcho workspace");
  const known = await knownWorldIds(root, workspaceItem.envelope.payload);
  for (const worldId of echo.worldIds) if (!known.has(worldId)) throw new Error(`BrandEcho references unknown world ${worldId}`);
  if (echo.status === "approved") {
    const decisionItem = await loadExact(root, echo.approvalRef, ARTIFACT_KINDS.brandEchoDecision, "BrandEcho approval");
    const decision = assertBrandEchoDecisionContract(decisionItem.envelope.payload);
    const previousItem = await findArtifactByVersion(root, ARTIFACT_KINDS.brandEcho, echo.echoId, echo.version - 1);
    if (!previousItem) throw new Error("BrandEcho approval is missing its previous exact proposal version");
    const previous = assertBrandEchoContract(previousItem.envelope.payload);
    if (previous.status !== "proposed" || decision.decision !== "approve" || !sameRef(decision.brandEchoRef, exactRef(ARTIFACT_KINDS.brandEcho, previous.echoId, previous.version, previous))) {
      throw new Error("BrandEcho approval is not bound to the previous exact proposal version");
    }
  }
  return echo;
}

export async function verifyBrandEchoDecision(projectRoot, decisionRef) {
  const item = await loadExact(projectRoot, decisionRef, ARTIFACT_KINDS.brandEchoDecision, "BrandEchoDecision");
  const decision = assertBrandEchoDecisionContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, brandEchoDecisionRef(decision))) throw new Error("BrandEchoDecision is not content-addressed exactly");
  await verifyBrandEcho(projectRoot, decision.brandEchoRef);
  return decision;
}

export async function listBrandEchoes(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEcho)
    .filter((item) => !options.status || item.envelope.payload.status === options.status)
    .sort((left, right) => left.envelope.payload.echoId.localeCompare(right.envelope.payload.echoId) || right.envelope.payload.version - left.envelope.payload.version);
  for (const item of items) await verifyBrandEcho(projectRoot, item.envelope.artifactRef);
  return items.map((item) => ({ echo: item.envelope.payload, echoRef: item.envelope.artifactRef }));
}

export async function createBrandEcho(projectRoot, input = {}) {
  const root = projectRoot;
  const workspaceItem = input.workspaceRef ? await loadExact(root, input.workspaceRef, ARTIFACT_KINDS.workspace, "BrandEcho workspace") : await latestWorkspace(root);
  const workspace = workspaceItem.envelope.payload;
  const worldIds = assertWorldIds(input.worldIds);
  const known = await knownWorldIds(root, workspace);
  for (const worldId of worldIds) if (!known.has(worldId)) throw new Error(`BrandEcho cannot introduce an unregistered world ${worldId}`);
  const createdAt = assertDate(input.createdAt || new Date().toISOString(), "BrandEcho.createdAt");
  const echo = {
    kind: ARTIFACT_KINDS.brandEcho,
    contractVersion: WORLD_OS_VERSION,
    echoId: echoId({ workspaceRef: workspaceItem.envelope.artifactRef, worldIds, symbolId: input.symbolId, surfaceForm: input.surfaceForm, semanticIntent: input.semanticIntent }),
    version: 1,
    workspaceRef: workspaceItem.envelope.artifactRef,
    worldIds,
    symbolId: input.symbolId,
    surfaceForm: input.surfaceForm,
    semanticIntent: input.semanticIntent,
    usageScope: "shared_motif_only",
    canonImpact: "none",
    crossWorldCausality: "forbidden",
    sharedActorRefs: [],
    sharedItemRefs: [],
    status: "proposed",
    approvalRef: null,
    approvedAt: null,
    createdAt,
    createdBy: { kind: "codex", id: "codex.root" }
  };
  assertBrandEchoContract(echo);
  const expectedRef = brandEchoRef(echo);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.brandEcho, echo.echoId, echo.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("BrandEcho identity is bound to different content");
    return { echo, echoRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, echo, { kind: ARTIFACT_KINDS.brandEcho, id: echo.echoId, version: echo.version, status: "candidate", createdAt, createdBy: "codex.root" });
  return { echo, echoRef: stored.envelope.artifactRef, idempotent: false };
}

export async function listBrandEchoDecisions(projectRoot, echoRef) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEchoDecision)
    .filter((item) => !echoRef || sameRef(item.envelope.payload.brandEchoRef, echoRef))
    .sort((left, right) => Date.parse(left.envelope.payload.decidedAt) - Date.parse(right.envelope.payload.decidedAt) || left.envelope.payload.decisionId.localeCompare(right.envelope.payload.decisionId));
  for (const item of items) {
    await verifyBrandEchoDecision(projectRoot, item.envelope.artifactRef);
  }
  return items.map((item) => ({ decision: item.envelope.payload, decisionRef: item.envelope.artifactRef }));
}

export async function recordBrandEchoDecision(projectRoot, echoRef, input = {}) {
  const root = projectRoot;
  const echo = await verifyBrandEcho(root, echoRef);
  if (echo.status !== "proposed") throw new Error("Only a proposed BrandEcho can receive an inception decision");
  const decision = {
    kind: ARTIFACT_KINDS.brandEchoDecision,
    contractVersion: WORLD_OS_VERSION,
    decisionId: decisionId({ brandEchoRef: echoRef, decision: input.decision, actor: { kind: "human", id: input.actorId }, decidedAt: input.decidedAt || new Date().toISOString() }),
    version: 1,
    brandEchoRef: echoRef,
    decision: input.decision,
    actor: { kind: "human", id: input.actorId },
    decidedAt: input.decidedAt || new Date().toISOString(),
    rationale: input.rationale,
    authority: "human_gate",
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertBrandEchoDecisionContract(decision);
  const expectedRef = brandEchoDecisionRef(decision);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.brandEchoDecision, decision.decisionId, 1);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("BrandEchoDecision identity is bound to different content");
    return { decision, decisionRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, decision, { kind: ARTIFACT_KINDS.brandEchoDecision, id: decision.decisionId, version: 1, status: decision.decision === "approve" ? "approved" : decision.decision === "reject" ? "rejected" : "candidate", createdAt: decision.decidedAt, createdBy: "codex.root" });
  return { decision, decisionRef: stored.envelope.artifactRef, idempotent: false };
}

export async function activateBrandEcho(projectRoot, echoRef, decisionRef) {
  const root = projectRoot;
  const echo = await verifyBrandEcho(root, echoRef);
  if (echo.status !== "proposed") throw new Error("Only a proposed BrandEcho can be activated");
  const decisions = await listBrandEchoDecisions(root, echoRef);
  const latest = decisions.at(-1);
  if (!latest || !sameRef(latest.decisionRef, decisionRef) || latest.decision.decision !== "approve") throw new Error("BrandEcho activation requires the latest exact approved human decision");
  const activated = { ...echo, version: echo.version + 1, status: "approved", approvalRef: decisionRef, approvedAt: latest.decision.decidedAt };
  assertBrandEchoContract(activated);
  const expectedRef = brandEchoRef(activated);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.brandEcho, activated.echoId, activated.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("Activated BrandEcho identity is bound to different content");
    return { echo: activated, echoRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, activated, { kind: ARTIFACT_KINDS.brandEcho, id: activated.echoId, version: activated.version, status: "candidate", createdAt: activated.approvedAt, createdBy: "codex.root" });
  await verifyBrandEcho(root, stored.envelope.artifactRef);
  return { echo: activated, echoRef: stored.envelope.artifactRef, idempotent: false };
}
