import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { canonicalize, parseJsonStrict, sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, IDENTIFIER_PATTERN, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";
import { listWorldRegistrations } from "./registry.mjs";

export const PRODUCTION_GATES = Object.freeze([
  "story_ready",
  "character_identity",
  "scene_geography",
  "style_activation",
  "rights",
  "qa",
  "release"
]);

const STAGE_FOR_GATE = Object.freeze({
  story_ready: "story_bound",
  character_identity: "character_bound",
  scene_geography: "design_bound",
  style_activation: "shot_bound",
  rights: "qa_pending",
  qa: "approved_asset",
  release: "released"
});

const CONTRACT_ROLES = Object.freeze({
  storyBrief: new Set(["cineweave_codex_story_brief"]),
  beatSheet: new Set(["cineweave_codex_beat_sheet"]),
  scriptScene: new Set(["cineweave_codex_script_scene"]),
  characterSpecs: new Set(["cineweave_codex_character_spec"]),
  sceneSpecs: new Set(["cineweave_codex_scene_spec"]),
  stylePackages: new Set(["cineweave_codex_style_package"]),
  shotSpecs: new Set(["cineweave_codex_shot_spec"]),
  promptRecords: new Set(["cineweave_codex_prompt_record", "cineweave_codex_image_prompt"]),
  recipe: new Set(["cineweave_codex_asset_recipe"]),
  rightsProfile: new Set(["cineweave_codex_license_profile"]),
  qaReviews: new Set(["cineweave_codex_character_review", "cineweave_codex_scene_review", "cineweave_codex_style_review", "cineweave_codex_reference_review"])
});

const SNAPSHOT_KEYS = ["kind", "contractVersion", "snapshotId", "version", "contractKind", "sourceContractId", "sourceContractVersion", "sourceContractHash", "worldId", "documentJson", "capturedAt", "capturedBy"];
const SLICE_KEYS = ["kind", "contractVersion", "sliceId", "version", "workspaceRef", "worldId", "sourceCommitRef", "sourceStateRef", "episodeId", "title", "contractRefs", "requiredGates", "gateDecisionRefs", "stage", "status", "releaseVisibility", "createdAt", "updatedAt", "createdBy"];
const SLICE_CONTRACT_KEYS = ["storyBrief", "beatSheet", "scriptScene", "characterSpecs", "sceneSpecs", "stylePackages", "shotSpecs", "promptRecords", "recipe", "rightsProfile", "qaReviews"];
const DECISION_KEYS = ["kind", "contractVersion", "decisionId", "version", "sliceRef", "gate", "decision", "actor", "decidedAt", "rationale", "evidenceRefs", "authority", "recordedBy"];
const DECISIONS = new Set(["approve", "reject", "revise"]);
const STATUSES = new Set(["proposed", "approved", "released", "blocked"]);
const STAGES = new Set(["planned", "story_bound", "character_bound", "design_bound", "shot_bound", "qa_pending", "approved_asset", "released", "blocked"]);

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return value;
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function assertExactKeys(value, keys, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError(`${label} fields must be exact`);
}

function assertExternalContractRef(ref, label = "contractRef") {
  if (!isExactRef(ref) || ref.kind.startsWith("world_os_")) throw new TypeError(`${label} must be an exact external CineWeave contract reference`);
  return ref;
}

function contractId(document) {
  const keys = ["storyId", "beatSheetId", "scriptSceneId", "characterId", "sceneId", "stylePackageId", "shotSpecId", "promptId", "recipeId", "profileId", "licenseId", "reviewId", "assetId", "controlId", "evidenceBundleId"];
  const key = keys.find((candidate) => typeof document[candidate] === "string" && document[candidate].trim());
  const value = key ? document[key] : document.id;
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`External contract ${document.kind} has no stable identifier`);
  return value;
}

export function contractRefFromDocument(document) {
  if (!isPlainObject(document) || typeof document.kind !== "string" || document.kind.startsWith("world_os_")) throw new TypeError("External contract document must have a non-World-OS kind");
  const version = document.version;
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError(`External contract ${document.kind} must have a positive version`);
  return exactRef(document.kind, contractId(document), version, document);
}

function snapshotId(contractRef) {
  return `production-snapshot.${contractRef.contentHash.slice("sha256:".length, "sha256:".length + 32)}`;
}

export function productionContractSnapshotRef(snapshot) {
  assertProductionContractSnapshotContract(snapshot);
  return exactRef(ARTIFACT_KINDS.productionContractSnapshot, snapshot.snapshotId, snapshot.version, snapshot);
}

export function assertProductionContractSnapshotContract(snapshot) {
  if (!isPlainObject(snapshot) || snapshot.kind !== ARTIFACT_KINDS.productionContractSnapshot || snapshot.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ProductionContractSnapshot contract");
  assertExactKeys(snapshot, SNAPSHOT_KEYS, "ProductionContractSnapshot");
  const contractRef = { kind: snapshot.contractKind, id: snapshot.sourceContractId, version: snapshot.sourceContractVersion, contentHash: snapshot.sourceContractHash };
  assertExternalContractRef(contractRef, "ProductionContractSnapshot.sourceContract");
  let document;
  try { document = parseJsonStrict(snapshot.documentJson); } catch { throw new TypeError("ProductionContractSnapshot.documentJson must be valid JSON"); }
  if (!IDENTIFIER_PATTERN.test(snapshot.snapshotId) || snapshot.snapshotId !== snapshotId(contractRef) || snapshot.version !== 1
    || (snapshot.worldId !== null && (typeof snapshot.worldId !== "string" || !snapshot.worldId.trim()))
    || !isPlainObject(document) || document.kind !== snapshot.contractKind || sha256Canonical(document) !== contractRef.contentHash) throw new TypeError("ProductionContractSnapshot identity or payload hash is invalid");
  const derivedRef = contractRefFromDocument(document);
  if (!sameRef(derivedRef, contractRef)) throw new TypeError("ProductionContractSnapshot source contract identity does not match document");
  assertDate(snapshot.capturedAt, "ProductionContractSnapshot.capturedAt");
  assertWriter(snapshot.capturedBy, "ProductionContractSnapshot.capturedBy");
  return snapshot;
}

function snapshotDocument(snapshot) {
  try { return parseJsonStrict(snapshot.documentJson); } catch { throw new Error("ProductionContractSnapshot.documentJson is invalid"); }
}

function assertSnapshotRef(ref, label) {
  if (!isExactRef(ref) || ref.kind !== ARTIFACT_KINDS.productionContractSnapshot) throw new TypeError(`${label} must be an exact ProductionContractSnapshot reference`);
  return ref;
}

function assertRoleSnapshotRef(role, ref, label = role) {
  assertSnapshotRef(ref, label);
  return ref;
}

function assertContractRefs(contractRefs) {
  assertExactKeys(contractRefs, SLICE_CONTRACT_KEYS, "ProductionSlice.contractRefs");
  for (const role of ["storyBrief", "beatSheet", "scriptScene", "recipe", "rightsProfile"]) assertRoleSnapshotRef(role, contractRefs[role], `ProductionSlice.contractRefs.${role}`);
  for (const role of ["characterSpecs", "sceneSpecs", "stylePackages", "shotSpecs", "promptRecords", "qaReviews"]) {
    if (!Array.isArray(contractRefs[role]) || new Set(contractRefs[role].map((ref) => canonicalize(ref))).size !== contractRefs[role].length) throw new TypeError(`ProductionSlice.contractRefs.${role} must be a unique array`);
    for (const [index, ref] of contractRefs[role].entries()) assertRoleSnapshotRef(role, ref, `ProductionSlice.contractRefs.${role}[${index}]`);
  }
  if (!contractRefs.characterSpecs.length || !contractRefs.sceneSpecs.length || !contractRefs.stylePackages.length || !contractRefs.shotSpecs.length || !contractRefs.promptRecords.length) {
    throw new TypeError("ProductionSlice requires CharacterSpec, SceneSpec, StylePackage, ShotSpec and PromptRecord snapshots");
  }
  return contractRefs;
}

export function assertProductionSliceContract(slice) {
  if (!isPlainObject(slice) || slice.kind !== ARTIFACT_KINDS.productionSlice || slice.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ProductionSlice contract");
  assertExactKeys(slice, SLICE_KEYS, "ProductionSlice");
  if (!IDENTIFIER_PATTERN.test(slice.sliceId) || !Number.isSafeInteger(slice.version) || slice.version < 1 || !WORLD_ID_PATTERN.test(slice.worldId)
    || !isExactRef(slice.workspaceRef) || slice.workspaceRef.kind !== ARTIFACT_KINDS.workspace
    || !isExactRef(slice.sourceCommitRef) || slice.sourceCommitRef.kind !== ARTIFACT_KINDS.commit
    || !isExactRef(slice.sourceStateRef) || slice.sourceStateRef.kind !== ARTIFACT_KINDS.state
    || !IDENTIFIER_PATTERN.test(slice.episodeId) || typeof slice.title !== "string" || !slice.title.trim() || slice.title.length > 240
    || JSON.stringify(slice.requiredGates) !== JSON.stringify(PRODUCTION_GATES)
    || !Array.isArray(slice.gateDecisionRefs) || new Set(slice.gateDecisionRefs.map((ref) => canonicalize(ref))).size !== slice.gateDecisionRefs.length
    || !STAGES.has(slice.stage) || !STATUSES.has(slice.status) || slice.releaseVisibility !== "private_workspace") throw new TypeError("ProductionSlice identity, lifecycle or visibility is invalid");
  for (const [index, ref] of slice.gateDecisionRefs.entries()) if (!isExactRef(ref) || ref.kind !== ARTIFACT_KINDS.productionGateDecision) throw new TypeError(`ProductionSlice.gateDecisionRefs[${index}] is invalid`);
  assertContractRefs(slice.contractRefs);
  assertDate(slice.createdAt, "ProductionSlice.createdAt");
  assertDate(slice.updatedAt, "ProductionSlice.updatedAt");
  assertWriter(slice.createdBy, "ProductionSlice.createdBy");
  return slice;
}

function decisionId({ sliceRef, gate, decision, actor, decidedAt, evidenceRefs }) {
  return `production-gate.${sha256Canonical({ sliceRef, gate, decision, actor, decidedAt, evidenceRefs }).slice("sha256:".length, "sha256:".length + 32)}`;
}

export function productionGateDecisionRef(decision) {
  assertProductionGateDecisionContract(decision);
  return exactRef(ARTIFACT_KINDS.productionGateDecision, decision.decisionId, decision.version, decision);
}

export function assertProductionGateDecisionContract(decision) {
  if (!isPlainObject(decision) || decision.kind !== ARTIFACT_KINDS.productionGateDecision || decision.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ProductionGateDecision contract");
  assertExactKeys(decision, DECISION_KEYS, "ProductionGateDecision");
  if (!IDENTIFIER_PATTERN.test(decision.decisionId) || decision.version !== 1 || !isExactRef(decision.sliceRef) || decision.sliceRef.kind !== ARTIFACT_KINDS.productionSlice
    || !PRODUCTION_GATES.includes(decision.gate) || !DECISIONS.has(decision.decision)
    || !isPlainObject(decision.actor) || Object.keys(decision.actor).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000") || decision.actor.kind !== "human" || typeof decision.actor.id !== "string" || !decision.actor.id.trim() || decision.actor.id.length > 160
    || typeof decision.rationale !== "string" || !decision.rationale.trim() || decision.rationale.length > 2000 || !Array.isArray(decision.evidenceRefs) || !decision.evidenceRefs.length
    || decision.authority !== "human_gate") throw new TypeError("ProductionGateDecision authority or identity is invalid");
  for (const [index, ref] of decision.evidenceRefs.entries()) if (!isExactRef(ref)) throw new TypeError(`ProductionGateDecision.evidenceRefs[${index}] is invalid`);
  if (decision.decision === "approve" && decision.evidenceRefs.length === 0) throw new Error("Approved ProductionGateDecision requires evidence");
  if (decision.decisionId !== decisionId({ sliceRef: decision.sliceRef, gate: decision.gate, decision: decision.decision, actor: decision.actor, decidedAt: decision.decidedAt, evidenceRefs: decision.evidenceRefs })) throw new Error("ProductionGateDecision identity is not deterministic");
  assertDate(decision.decidedAt, "ProductionGateDecision.decidedAt");
  assertWriter(decision.recordedBy, "ProductionGateDecision.recordedBy");
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

async function knownWorldIds(root, workspace) {
  const registrations = await listWorldRegistrations(root);
  return new Set([
    ...(workspace.worlds || []).map((world) => world.id),
    ...registrations.filter((item) => !["rejected", "retired"].includes(item.registration.status)).map((item) => item.registration.worldId)
  ]);
}

async function verifySource(root, workspaceRef, worldId, sourceCommitRef, sourceStateRef) {
  const workspaceItem = await loadExact(root, workspaceRef, ARTIFACT_KINDS.workspace, "ProductionSlice workspace");
  const known = await knownWorldIds(root, workspaceItem.envelope.payload);
  if (!known.has(worldId)) throw new Error(`ProductionSlice references unknown world ${worldId}`);
  const commitItem = await loadExact(root, sourceCommitRef, ARTIFACT_KINDS.commit, "ProductionSlice source commit");
  const stateItem = await loadExact(root, sourceStateRef, ARTIFACT_KINDS.state, "ProductionSlice source state");
  const commit = commitItem.envelope.payload;
  const state = stateItem.envelope.payload;
  if (commit.worldId !== worldId || commit.stream !== "simulation.main" || state.worldId !== worldId || state.stream !== "simulation.main" || !commit.outputStateRefs.some((ref) => sameRef(ref, sourceStateRef))) throw new Error("ProductionSlice source commit/state are not the same exact simulation transition");
}

async function loadSnapshot(root, ref) {
  const item = await loadExact(root, ref, ARTIFACT_KINDS.productionContractSnapshot, "Production contract snapshot");
  const snapshot = assertProductionContractSnapshotContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, productionContractSnapshotRef(snapshot))) throw new Error("Production contract snapshot is not content-addressed exactly");
  return snapshot;
}

function roleDocuments(input) {
  if (!isPlainObject(input)) throw new TypeError("ProductionSlice contracts must be an object");
  const roles = {};
  for (const [role, value] of Object.entries(input)) {
    if (!Object.hasOwn(CONTRACT_ROLES, role)) throw new TypeError(`Unknown ProductionSlice contract role ${role}`);
    roles[role] = Array.isArray(value) ? value : [value];
    if ((!roles[role].length && role !== "qaReviews") || roles[role].some((document) => !isPlainObject(document))) throw new TypeError(`ProductionSlice contract role ${role} must contain contract documents`);
    for (const document of roles[role]) {
      const ref = contractRefFromDocument(document);
      if (!CONTRACT_ROLES[role].has(document.kind)) throw new TypeError(`Contract ${document.kind} is not allowed in ProductionSlice role ${role}`);
      if (document.worldId !== undefined && typeof document.worldId !== "string") throw new TypeError(`Contract ${document.kind}.worldId is invalid`);
      if (!ref) throw new Error("unreachable");
    }
  }
  for (const role of ["storyBrief", "beatSheet", "scriptScene", "characterSpecs", "sceneSpecs", "stylePackages", "shotSpecs", "promptRecords", "recipe", "rightsProfile"]) {
    if (!roles[role] || !roles[role].length) throw new TypeError(`ProductionSlice requires contract role ${role}`);
  }
  roles.qaReviews ||= [];
  return roles;
}

function sourceRefsForGate(slice, gate) {
  const refs = slice.contractRefs;
  const map = {
    story_ready: [refs.storyBrief, refs.beatSheet, refs.scriptScene],
    character_identity: refs.characterSpecs,
    scene_geography: refs.sceneSpecs,
    style_activation: refs.stylePackages,
    rights: [refs.rightsProfile, refs.recipe],
    qa: refs.qaReviews,
    release: [...refs.promptRecords, ...refs.shotSpecs]
  };
  return map[gate] || [];
}

async function decisionItemsForSlice(root, sliceId) {
  return (await listArtifacts(root)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionGateDecision && item.envelope.payload.sliceRef?.id === sliceId)
    .sort((left, right) => Date.parse(left.envelope.payload.decidedAt) - Date.parse(right.envelope.payload.decidedAt) || left.envelope.payload.decisionId.localeCompare(right.envelope.payload.decisionId));
}

function latestDecisionByGate(items) {
  const latest = new Map();
  for (const item of items) latest.set(item.envelope.payload.gate, item);
  return latest;
}

function gateForStage(stage) {
  if (stage === "planned") return -1;
  const entries = Object.entries(STAGE_FOR_GATE);
  const exact = entries.findIndex(([, value]) => value === stage);
  if (stage === "character_bound") return 1;
  if (stage === "design_bound") return 2;
  return exact;
}

export async function verifyProductionContractSnapshot(projectRoot, snapshotRef) {
  return loadSnapshot(projectRoot, snapshotRef);
}

export async function verifyProductionSlice(projectRoot, sliceRef) {
  const root = projectRoot;
  const item = await loadExact(root, sliceRef, ARTIFACT_KINDS.productionSlice, "ProductionSlice");
  const slice = assertProductionSliceContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.productionSlice, slice.sliceId, slice.version, slice))) throw new Error("ProductionSlice is not content-addressed exactly");
  await verifySource(root, slice.workspaceRef, slice.worldId, slice.sourceCommitRef, slice.sourceStateRef);
  const snapshots = [];
  for (const [role, refs] of Object.entries(slice.contractRefs)) {
    const list = Array.isArray(refs) ? refs : [refs];
    for (const ref of list) {
      const snapshot = await loadSnapshot(root, ref);
      if (!CONTRACT_ROLES[role]?.has(snapshot.contractKind)) throw new Error(`ProductionSlice role ${role} does not allow ${snapshot.contractKind}`);
      if (snapshot.worldId !== null && snapshot.worldId !== slice.worldId) throw new Error(`ProductionSlice contract ${snapshot.contractKind} belongs to ${snapshot.worldId}, not ${slice.worldId}`);
      snapshots.push(snapshot);
    }
  }
  const decisionsByGate = new Map();
  for (const ref of slice.gateDecisionRefs) {
    const decisionItem = await findArtifact(root, ref);
    const decision = assertProductionGateDecisionContract(decisionItem.envelope.payload);
    if (decision.sliceRef.id !== slice.sliceId || decision.sliceRef.version >= slice.version || decision.decision !== "approve") throw new Error("ProductionSlice gateDecisionRefs must contain approved decisions for earlier exact slice versions");
    if (decisionsByGate.has(decision.gate)) throw new Error(`ProductionSlice has duplicate gate decision for ${decision.gate}`);
    decisionsByGate.set(decision.gate, decisionItem);
  }
  const requiredCount = gateForStage(slice.stage);
  for (let index = 0; index <= requiredCount; index += 1) {
    const gate = PRODUCTION_GATES[index];
    if (!decisionsByGate.has(gate)) throw new Error(`ProductionSlice stage ${slice.stage} is missing approved gate ${gate}`);
  }
  for (const ref of slice.gateDecisionRefs) {
    const decisionItem = await findArtifact(root, ref);
    const decision = assertProductionGateDecisionContract(decisionItem.envelope.payload);
    for (const evidenceRef of decision.evidenceRefs) {
      if (evidenceRef.kind === ARTIFACT_KINDS.productionContractSnapshot) await loadSnapshot(root, evidenceRef);
      else await findArtifact(root, evidenceRef);
    }
  }
  return { slice, sliceRef, snapshots };
}

export async function createProductionSlice(projectRoot, input = {}) {
  const root = projectRoot;
  const workspaceItem = input.workspaceRef ? await loadExact(root, input.workspaceRef, ARTIFACT_KINDS.workspace, "ProductionSlice workspace") : await latestWorkspace(root);
  if (!WORLD_ID_PATTERN.test(input.worldId || "")) throw new TypeError("ProductionSlice.worldId must be W##");
  if (!isExactRef(input.sourceCommitRef) || input.sourceCommitRef.kind !== ARTIFACT_KINDS.commit || !isExactRef(input.sourceStateRef) || input.sourceStateRef.kind !== ARTIFACT_KINDS.state) throw new TypeError("ProductionSlice requires exact sourceCommitRef and sourceStateRef");
  await verifySource(root, workspaceItem.envelope.artifactRef, input.worldId, input.sourceCommitRef, input.sourceStateRef);
  const roles = roleDocuments(input.contracts === undefined ? input.contractDocuments : input.contracts);
  const capturedAt = assertDate(input.createdAt === undefined ? new Date().toISOString() : input.createdAt, "ProductionSlice.createdAt");
  const contractRefs = {};
  const snapshots = [];
  for (const role of SLICE_CONTRACT_KEYS) {
    const documents = roles[role] || [];
    const snapshotRefs = [];
    for (const document of documents) {
      if (document.worldId !== undefined && document.worldId !== input.worldId) throw new Error(`Contract ${document.kind} belongs to ${document.worldId}, not ${input.worldId}`);
      const contractRef = contractRefFromDocument(document);
      const snapshot = {
        kind: ARTIFACT_KINDS.productionContractSnapshot,
        contractVersion: WORLD_OS_VERSION,
        snapshotId: snapshotId(contractRef),
        version: 1,
        contractKind: document.kind,
        sourceContractId: contractRef.id,
        sourceContractVersion: contractRef.version,
        sourceContractHash: contractRef.contentHash,
        worldId: document.worldId ?? null,
        documentJson: JSON.stringify(document),
        capturedAt,
        capturedBy: { kind: "codex", id: "codex.root" }
      };
      assertProductionContractSnapshotContract(snapshot);
      const expectedSnapshotRef = productionContractSnapshotRef(snapshot);
      const existingSnapshot = await findArtifactByVersion(root, ARTIFACT_KINDS.productionContractSnapshot, snapshot.snapshotId, 1);
      if (existingSnapshot) {
        const persisted = assertProductionContractSnapshotContract(existingSnapshot.envelope.payload);
        const persistedRef = productionContractSnapshotRef(persisted);
        if (!sameRef(persistedRef, existingSnapshot.envelope.artifactRef) || persisted.sourceContractHash !== contractRef.contentHash) throw new Error(`Production contract snapshot ${snapshot.snapshotId} is immutable`);
        snapshotRefs.push(existingSnapshot.envelope.artifactRef);
        snapshots.push({ snapshot: persisted, snapshotRef: existingSnapshot.envelope.artifactRef });
      } else {
        await putArtifact(root, snapshot, { kind: ARTIFACT_KINDS.productionContractSnapshot, id: snapshot.snapshotId, version: 1, status: "candidate", createdAt: capturedAt, createdBy: "codex.root" });
        snapshotRefs.push(expectedSnapshotRef);
        snapshots.push({ snapshot, snapshotRef: expectedSnapshotRef });
      }
    }
    contractRefs[role] = ["storyBrief", "beatSheet", "scriptScene", "recipe", "rightsProfile"].includes(role) ? snapshotRefs[0] : snapshotRefs;
  }
  const episodeId = input.episodeId;
  if (typeof episodeId !== "string" || !IDENTIFIER_PATTERN.test(episodeId)) throw new TypeError("ProductionSlice.episodeId is invalid");
  const title = input.title;
  if (typeof title !== "string" || !title.trim() || title.length > 240) throw new TypeError("ProductionSlice.title is invalid");
  const sliceId = `production-slice.${sha256Canonical({ workspaceRef: workspaceItem.envelope.artifactRef, worldId: input.worldId, sourceCommitRef: input.sourceCommitRef, sourceStateRef: input.sourceStateRef, episodeId, contractRefs }).slice("sha256:".length, "sha256:".length + 32)}`;
  const slice = {
    kind: ARTIFACT_KINDS.productionSlice,
    contractVersion: WORLD_OS_VERSION,
    sliceId,
    version: 1,
    workspaceRef: workspaceItem.envelope.artifactRef,
    worldId: input.worldId,
    sourceCommitRef: input.sourceCommitRef,
    sourceStateRef: input.sourceStateRef,
    episodeId,
    title,
    contractRefs,
    requiredGates: [...PRODUCTION_GATES],
    gateDecisionRefs: [],
    stage: "planned",
    status: "proposed",
    releaseVisibility: "private_workspace",
    createdAt: capturedAt,
    updatedAt: capturedAt,
    createdBy: { kind: "codex", id: "codex.root" }
  };
  assertProductionSliceContract(slice);
  const expectedRef = exactRef(ARTIFACT_KINDS.productionSlice, slice.sliceId, slice.version, slice);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.productionSlice, slice.sliceId, 1);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ProductionSlice identity is bound to different content");
    return { slice, sliceRef: existing.envelope.artifactRef, snapshots, idempotent: true };
  }
  const stored = await putArtifact(root, slice, { kind: ARTIFACT_KINDS.productionSlice, id: slice.sliceId, version: 1, status: "candidate", createdAt: capturedAt, createdBy: "codex.root" });
  return { slice, sliceRef: stored.envelope.artifactRef, snapshots, idempotent: false };
}

export async function verifyProductionGateDecision(projectRoot, decisionRef) {
  const item = await loadExact(projectRoot, decisionRef, ARTIFACT_KINDS.productionGateDecision, "ProductionGateDecision");
  const decision = assertProductionGateDecisionContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, productionGateDecisionRef(decision))) throw new Error("ProductionGateDecision is not content-addressed exactly");
  await verifyProductionSlice(projectRoot, decision.sliceRef);
  for (const evidenceRef of decision.evidenceRefs) {
    if (evidenceRef.kind === ARTIFACT_KINDS.productionContractSnapshot) await loadSnapshot(projectRoot, evidenceRef);
    else await findArtifact(projectRoot, evidenceRef);
  }
  return decision;
}

export async function listProductionSlices(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionSlice)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .filter((item) => !options.status || item.envelope.payload.status === options.status)
    .sort((left, right) => left.envelope.payload.sliceId.localeCompare(right.envelope.payload.sliceId) || right.envelope.payload.version - left.envelope.payload.version);
  const result = [];
  for (const item of items) {
    const verified = await verifyProductionSlice(projectRoot, item.envelope.artifactRef);
    result.push({ slice: verified.slice, sliceRef: item.envelope.artifactRef });
  }
  return result;
}

export async function recordProductionGateDecision(projectRoot, sliceRef, input = {}) {
  const verified = await verifyProductionSlice(projectRoot, sliceRef);
  const slice = verified.slice;
  if (slice.status === "released") throw new Error("Released ProductionSlice cannot receive another Gate decision");
  if (!PRODUCTION_GATES.includes(input.gate)) throw new TypeError("ProductionGateDecision.gate is invalid");
  const currentGateRefs = new Map();
  for (const ref of slice.gateDecisionRefs) {
    const item = await findArtifact(projectRoot, ref);
    currentGateRefs.set(item.envelope.payload.gate, ref);
  }
  const expectedGate = PRODUCTION_GATES.find((gate) => !currentGateRefs.has(gate));
  if (input.gate !== expectedGate) throw new Error(`Production Gate ${input.gate} is out of order; expected ${expectedGate}`);
  const gateIndex = PRODUCTION_GATES.indexOf(input.gate);
  for (let index = 0; index < gateIndex; index += 1) {
    if (!currentGateRefs.has(PRODUCTION_GATES[index])) throw new Error(`Production Gate ${input.gate} requires approved ${PRODUCTION_GATES[index]}`);
  }
  if (input.gate === "qa" && !slice.contractRefs.qaReviews.length) throw new Error("Production Gate qa requires at least one QA review snapshot");
  if (input.gate === "release" && slice.contractRefs.qaReviews.length === 0) throw new Error("Production Gate release requires QA evidence");
  const evidenceRefs = input.evidenceRefs === undefined ? sourceRefsForGate(slice, input.gate) : input.evidenceRefs;
  if (!Array.isArray(evidenceRefs) || !evidenceRefs.length) throw new TypeError(`Production Gate ${input.gate} requires evidenceRefs`);
  for (const ref of evidenceRefs) {
    if (!isExactRef(ref)) throw new TypeError("ProductionGateDecision evidenceRefs must be exact refs");
    if (ref.kind === ARTIFACT_KINDS.productionContractSnapshot) await loadSnapshot(projectRoot, ref);
    else await findArtifact(projectRoot, ref);
  }
  const decidedAt = assertDate(input.decidedAt === undefined ? new Date().toISOString() : input.decidedAt, "ProductionGateDecision.decidedAt");
  const actor = { kind: "human", id: input.actorId };
  const decision = {
    kind: ARTIFACT_KINDS.productionGateDecision,
    contractVersion: WORLD_OS_VERSION,
    decisionId: decisionId({ sliceRef, gate: input.gate, decision: input.decision, actor, decidedAt, evidenceRefs }),
    version: 1,
    sliceRef,
    gate: input.gate,
    decision: input.decision,
    actor,
    decidedAt,
    rationale: input.rationale === undefined ? "Human production Gate decision recorded by the Canon owner." : input.rationale,
    evidenceRefs,
    authority: "human_gate",
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertProductionGateDecisionContract(decision);
  const expectedRef = productionGateDecisionRef(decision);
  const existing = await findArtifactByVersion(projectRoot, ARTIFACT_KINDS.productionGateDecision, decision.decisionId, 1);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ProductionGateDecision identity is bound to different content");
    return { decision, decisionRef: existing.envelope.artifactRef, idempotent: true };
  }
  const status = decision.decision === "approve" ? "approved" : decision.decision === "reject" ? "rejected" : "candidate";
  const stored = await putArtifact(projectRoot, decision, { kind: ARTIFACT_KINDS.productionGateDecision, id: decision.decisionId, version: 1, status, createdAt: decidedAt, createdBy: "codex.root" });
  return { decision, decisionRef: stored.envelope.artifactRef, idempotent: false };
}

export async function listProductionGateDecisions(projectRoot, sliceRef) {
  const sliceItem = await loadExact(projectRoot, sliceRef, ARTIFACT_KINDS.productionSlice, "ProductionSlice");
  const slice = assertProductionSliceContract(sliceItem.envelope.payload);
  const items = await decisionItemsForSlice(projectRoot, slice.sliceId);
  const result = [];
  for (const item of items) {
    const decision = await verifyProductionGateDecision(projectRoot, item.envelope.artifactRef);
    result.push({ decision, decisionRef: item.envelope.artifactRef });
  }
  return result;
}

export async function activateProductionStage(projectRoot, sliceRef, decisionRef, options = {}) {
  const verified = await verifyProductionSlice(projectRoot, sliceRef);
  const slice = verified.slice;
  const decision = await verifyProductionGateDecision(projectRoot, decisionRef);
  if (!sameRef(decision.sliceRef, sliceRef) || decision.decision !== "approve") throw new Error("Production stage activation requires an exact approved Gate decision for the current slice version");
  const existingGate = slice.gateDecisionRefs.find((ref) => ref.id === decision.decisionId);
  if (existingGate) return { slice, sliceRef: exactRef(ARTIFACT_KINDS.productionSlice, slice.sliceId, slice.version, slice), idempotent: true };
  const gateIndex = PRODUCTION_GATES.indexOf(decision.gate);
  const latestRefs = new Map();
  for (const ref of slice.gateDecisionRefs) {
    const item = await findArtifact(projectRoot, ref);
    latestRefs.set(item.envelope.payload.gate, ref);
  }
  const expectedGate = PRODUCTION_GATES.find((gate) => !latestRefs.has(gate));
  if (expectedGate !== decision.gate || gateIndex < 0) throw new Error(`Production stage activation requires the next Gate ${expectedGate}`);
  if (decision.gate === "qa" && !slice.contractRefs.qaReviews.length) throw new Error("Production stage activation requires QA snapshots");
  const gateDecisionRefs = [...latestRefs.entries(), [decision.gate, decisionRef]].sort((left, right) => PRODUCTION_GATES.indexOf(left[0]) - PRODUCTION_GATES.indexOf(right[0])).map(([, ref]) => ref);
  const updatedAt = assertDate(options.updatedAt === undefined ? decision.decidedAt : options.updatedAt, "ProductionSlice.updatedAt");
  const next = {
    ...slice,
    version: slice.version + 1,
    gateDecisionRefs,
    stage: STAGE_FOR_GATE[decision.gate],
    status: decision.gate === "release" ? "released" : "approved",
    updatedAt
  };
  assertProductionSliceContract(next);
  const expectedRef = exactRef(ARTIFACT_KINDS.productionSlice, next.sliceId, next.version, next);
  const existing = await findArtifactByVersion(projectRoot, ARTIFACT_KINDS.productionSlice, next.sliceId, next.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ProductionSlice stage version is bound to different content");
    return { slice: next, sliceRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(projectRoot, next, { kind: ARTIFACT_KINDS.productionSlice, id: next.sliceId, version: next.version, status: next.status === "released" ? "approved" : "candidate", createdAt: updatedAt, createdBy: "codex.root" });
  await verifyProductionSlice(projectRoot, stored.envelope.artifactRef);
  return { slice: next, sliceRef: stored.envelope.artifactRef, idempotent: false };
}
