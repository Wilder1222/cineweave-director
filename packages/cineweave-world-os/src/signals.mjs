import { resolve } from "node:path";
import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, HASH_PATTERN, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";

const SIGNAL_TYPES = new Set(["reaction", "comment", "vote", "share", "view", "report", "moderation"]);
const COMMENT_CLASSES = new Set(["question", "praise", "criticism", "spoiler", "other"]);
const OBSERVATION_METRICS = SIGNAL_TYPES;
const PRIVACY_IDENTITIES = new Set(["none", "redacted", "hashed"]);
const PRIVACY_CONTENT = new Set(["none", "classified", "hashed"]);
const RETENTION_CLASSES = new Set(["ephemeral", "standard"]);
const SIGNAL_USE_OUTCOMES = new Set(["used_as_evidence", "deferred_for_context", "dismissed_as_noise"]);

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
}

function assertExactRef(value, kind, label) {
  if (!isExactRef(value) || value.kind !== kind) throw new TypeError(`${label} must be an exact ${kind} reference`);
  return value;
}

function assertStored(ref, item, label) {
  if (!item || !sameRef(ref, item.envelope.artifactRef)) throw new Error(`${label} is not the exact stored artifact`);
  return item.envelope.payload;
}

async function loadExact(root, ref, kind, label) {
  assertExactRef(ref, kind, label);
  return assertStored(ref, await findArtifact(root, ref), label);
}

function assertObservation(observation) {
  if (!isPlainObject(observation)) throw new TypeError("observation must be an object");
  const expectedKeys = ["metric", "value", "choiceId", "commentHash", "commentClass"];
  if (Object.keys(observation).sort().join("\u0000") !== expectedKeys.slice().sort().join("\u0000")) throw new TypeError("observation fields must be exact");
  if (!OBSERVATION_METRICS.has(observation.metric)) throw new TypeError("observation.metric is invalid");
  if (observation.value !== null && (typeof observation.value !== "number" || !Number.isFinite(observation.value) || observation.value < -1e9 || observation.value > 1e9)) {
    throw new TypeError("observation.value must be null or a finite bounded number");
  }
  if (observation.choiceId !== null && (typeof observation.choiceId !== "string" || !/^[a-z0-9][a-z0-9._-]{1,159}$/.test(observation.choiceId))) {
    throw new TypeError("observation.choiceId must be null or an identifier");
  }
  if (observation.commentHash !== null && !HASH_PATTERN.test(observation.commentHash)) throw new TypeError("observation.commentHash must be null or a SHA-256 hash");
  if (observation.commentClass !== null && !COMMENT_CLASSES.has(observation.commentClass)) throw new TypeError("observation.commentClass is invalid");
  if (observation.commentClass !== null && observation.commentHash === null) throw new Error("A classified comment must retain only its content hash");
  return observation;
}

function assertPrivacy(privacy, observation) {
  if (!isPlainObject(privacy)) throw new TypeError("privacy must be an object");
  const expectedKeys = ["identity", "content", "retention", "containsRawText"];
  if (Object.keys(privacy).sort().join("\u0000") !== expectedKeys.slice().sort().join("\u0000")) throw new TypeError("privacy fields must be exact");
  if (!PRIVACY_IDENTITIES.has(privacy.identity) || !PRIVACY_CONTENT.has(privacy.content) || !RETENTION_CLASSES.has(privacy.retention) || privacy.containsRawText !== false) {
    throw new Error("External signals must declare a bounded privacy policy without raw text");
  }
  if (observation.commentHash !== null && privacy.content !== "hashed") throw new Error("Comment hashes require privacy.content=hashed");
  return privacy;
}

function assertRouting(routing) {
  if (!isPlainObject(routing)
    || routing.mode !== "proposal_input_only"
    || routing.proposalOnly !== true
    || routing.stateMutation !== false
    || routing.canonMutation !== false
    || Object.keys(routing).length !== 4) {
    throw new Error("External signals are observation-only proposal inputs");
  }
  return routing;
}

function dedupeMaterial({ platformId, platformRecordId, sourceEventId, signalType }) {
  // The source event, not its mutable interpretation, owns identity. If a
  // connector sends a different observation for the same event, immutable
  // storage rejects it instead of silently creating a second signal.
  return { platformId, platformRecordId, sourceEventId, signalType };
}

export function externalSignalDedupeKey(input) {
  return sha256Canonical(dedupeMaterial(input));
}

export function assertExternalSignalContract(signal) {
  if (!isPlainObject(signal) || signal.kind !== ARTIFACT_KINDS.externalSignal || signal.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ExternalSignal contract");
  const expectedKeys = [
    "kind", "contractVersion", "signalId", "version", "worldId", "sourceProjectionRef", "sourceReceiptRef", "platformProfileRef",
    "signalType", "sourceEventId", "dedupeKey", "observedAt", "receivedAt", "observation", "privacy", "routing", "recordedBy"
  ];
  if (Object.keys(signal).sort().join("\u0000") !== expectedKeys.slice().sort().join("\u0000")) throw new TypeError("ExternalSignal fields must be exact");
  if (!/^[a-z0-9][a-z0-9._-]{1,159}$/.test(signal.signalId) || signal.version !== 1 || !WORLD_ID_PATTERN.test(signal.worldId)) throw new TypeError("ExternalSignal identity is invalid");
  assertExactRef(signal.sourceProjectionRef, ARTIFACT_KINDS.projection, "sourceProjectionRef");
  assertExactRef(signal.sourceReceiptRef, ARTIFACT_KINDS.receipt, "sourceReceiptRef");
  assertExactRef(signal.platformProfileRef, ARTIFACT_KINDS.platformProfile, "platformProfileRef");
  if (!SIGNAL_TYPES.has(signal.signalType) || typeof signal.sourceEventId !== "string" || !signal.sourceEventId.trim() || signal.sourceEventId !== signal.sourceEventId.trim() || signal.sourceEventId.length > 240 || !HASH_PATTERN.test(signal.dedupeKey)) throw new TypeError("ExternalSignal source identity is invalid");
  assertDate(signal.observedAt, "observedAt");
  assertDate(signal.receivedAt, "receivedAt");
  if (Date.parse(signal.receivedAt) < Date.parse(signal.observedAt)) throw new Error("receivedAt cannot precede observedAt");
  assertObservation(signal.observation);
  if (signal.observation.metric !== signal.signalType) throw new Error("ExternalSignal signalType must match observation.metric");
  assertPrivacy(signal.privacy, signal.observation);
  assertRouting(signal.routing);
  if (signal.recordedBy?.kind !== "codex" || signal.recordedBy?.id !== "codex.root") throw new Error("ExternalSignal must be recorded by codex.root");
  return signal;
}

async function validateSourceChain(root, signal) {
  const profile = await loadExact(root, signal.platformProfileRef, ARTIFACT_KINDS.platformProfile, "ExternalSignal platform profile");
  if (profile.authority !== "non_authoritative_view" || profile.allowCanonMutation !== false || profile.canWriteCanon !== false) throw new Error("ExternalSignal source profile must be non-authoritative");
  const projection = await loadExact(root, signal.sourceProjectionRef, ARTIFACT_KINDS.projection, "ExternalSignal projection");
  const receipt = await loadExact(root, signal.sourceReceiptRef, ARTIFACT_KINDS.receipt, "ExternalSignal publish receipt");
  if (projection.payload?.worldId !== signal.worldId || projection.platformId !== profile.platformId || !sameRef(projection.platformProfileRef, signal.platformProfileRef)) throw new Error("ExternalSignal projection is not bound to its world/profile");
  if (receipt.status !== "succeeded" || receipt.platformId !== profile.platformId || !sameRef(receipt.platformProfileRef, signal.platformProfileRef) || !sameRef(receipt.projectionRef, signal.sourceProjectionRef)) {
    throw new Error("ExternalSignal must reference a successful receipt for the exact projection");
  }
  if (typeof receipt.platformRecordId !== "string" || !receipt.platformRecordId.trim()) throw new Error("ExternalSignal source receipt has no platform record ID");
  return { profile, projection, receipt };
}

export async function verifyExternalSignal(projectRoot, signalRef) {
  const root = resolve(projectRoot);
  const signal = await loadExact(root, signalRef, ARTIFACT_KINDS.externalSignal, "ExternalSignal");
  assertExternalSignalContract(signal);
  const { profile, receipt } = await validateSourceChain(root, signal);
  const expectedDedupeKey = externalSignalDedupeKey({
    platformId: profile.platformId,
    platformRecordId: receipt.platformRecordId,
    sourceEventId: signal.sourceEventId,
    signalType: signal.signalType
  });
  if (signal.dedupeKey !== expectedDedupeKey) throw new Error("Stored ExternalSignal dedupeKey is not bound to its source receipt");
  const expectedSignalId = `signal.${expectedDedupeKey.slice("sha256:".length, "sha256:".length + 32)}`;
  if (signal.signalId !== expectedSignalId) throw new Error("Stored ExternalSignal ID is not derived from its source identity");
  return signal;
}

export function assertExternalSignalUseContract(use) {
  if (!isPlainObject(use) || use.kind !== ARTIFACT_KINDS.externalSignalUse || use.contractVersion !== WORLD_OS_VERSION) {
    throw new TypeError("Unsupported ExternalSignalUseReceipt contract");
  }
  const expectedKeys = ["kind", "contractVersion", "signalUseId", "version", "worldId", "signalRef", "proposalRef", "outcome", "recordedAt", "recordedBy"];
  if (Object.keys(use).sort().join("\u0000") !== expectedKeys.slice().sort().join("\u0000")) throw new TypeError("ExternalSignalUseReceipt fields must be exact");
  if (!/^[a-z0-9][a-z0-9._-]{1,159}$/.test(use.signalUseId) || use.version !== 1 || !WORLD_ID_PATTERN.test(use.worldId)) throw new TypeError("ExternalSignalUseReceipt identity is invalid");
  assertExactRef(use.signalRef, ARTIFACT_KINDS.externalSignal, "ExternalSignalUseReceipt.signalRef");
  if (use.proposalRef !== null) assertExactRef(use.proposalRef, ARTIFACT_KINDS.proposal, "ExternalSignalUseReceipt.proposalRef");
  if (!SIGNAL_USE_OUTCOMES.has(use.outcome)) throw new TypeError("ExternalSignalUseReceipt outcome is invalid");
  if (use.outcome === "used_as_evidence" && use.proposalRef === null) throw new Error("used_as_evidence requires an exact proposalRef");
  if (use.outcome !== "used_as_evidence" && use.proposalRef !== null) throw new Error("Only used_as_evidence may bind a proposalRef");
  assertDate(use.recordedAt, "recordedAt");
  if (!isPlainObject(use.recordedBy) || Object.keys(use.recordedBy).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || use.recordedBy.kind !== "codex" || use.recordedBy.id !== "codex.root") throw new Error("ExternalSignalUseReceipt must be recorded by codex.root");
  return use;
}

function signalUseIdentity({ signalRef, proposalRef, outcome }) {
  return sha256Canonical({ signalRef, proposalRef, outcome });
}

export async function verifyExternalSignalUse(projectRoot, useRef) {
  const root = resolve(projectRoot);
  const use = assertExternalSignalUseContract(await loadExact(root, useRef, ARTIFACT_KINDS.externalSignalUse, "ExternalSignalUseReceipt"));
  const signal = await verifyExternalSignal(root, use.signalRef);
  if (signal.worldId !== use.worldId || Date.parse(use.recordedAt) < Date.parse(signal.receivedAt)) throw new Error("ExternalSignalUseReceipt is outside its signal/world boundary");
  if (use.proposalRef !== null) {
    const proposal = await loadExact(root, use.proposalRef, ARTIFACT_KINDS.proposal, "ExternalSignalUseReceipt proposal");
    if (proposal.worldId !== use.worldId || proposal.stream !== "simulation.main") throw new Error("ExternalSignalUseReceipt proposal is outside its simulation world");
  }
  const expectedDigest = signalUseIdentity({ signalRef: use.signalRef, proposalRef: use.proposalRef, outcome: use.outcome });
  const expectedId = `signal-use.${expectedDigest.slice("sha256:".length, "sha256:".length + 32)}`;
  if (use.signalUseId !== expectedId) throw new Error("ExternalSignalUseReceipt ID is not derived from its exact inputs");
  return use;
}

export async function recordExternalSignalUse(projectRoot, input, options = {}) {
  const root = resolve(projectRoot);
  if (!isPlainObject(input)) throw new TypeError("ExternalSignalUseReceipt input must be an object");
  const allowedKeys = ["signalRef", "proposalRef", "outcome", "recordedAt", "signalUseId"];
  if (Object.keys(input).some((key) => !allowedKeys.includes(key))) throw new TypeError("ExternalSignalUseReceipt input fields must be exact");
  const signalRef = assertExactRef(input.signalRef, ARTIFACT_KINDS.externalSignal, "signalRef");
  const signal = await verifyExternalSignal(root, signalRef);
  const proposalRef = input.proposalRef === undefined || input.proposalRef === null
    ? null
    : assertExactRef(input.proposalRef, ARTIFACT_KINDS.proposal, "proposalRef");
  if (proposalRef !== null) {
    const proposal = await loadExact(root, proposalRef, ARTIFACT_KINDS.proposal, "proposalRef");
    if (proposal.worldId !== signal.worldId || proposal.stream !== "simulation.main") throw new Error("proposalRef is outside the signal world");
  }
  const outcome = input.outcome;
  const recordedAt = input.recordedAt || options.recordedAt || new Date().toISOString();
  assertDate(recordedAt, "recordedAt");
  if (Date.parse(recordedAt) < Date.parse(signal.receivedAt)) throw new Error("recordedAt cannot precede signal.receivedAt");
  const digest = signalUseIdentity({ signalRef, proposalRef, outcome });
  const signalUseId = input.signalUseId || `signal-use.${digest.slice("sha256:".length, "sha256:".length + 32)}`;
  if (signalUseId !== `signal-use.${digest.slice("sha256:".length, "sha256:".length + 32)}`) throw new Error("signalUseId must be derived from signalRef, proposalRef and outcome");
  const use = {
    kind: ARTIFACT_KINDS.externalSignalUse,
    contractVersion: WORLD_OS_VERSION,
    signalUseId,
    version: 1,
    worldId: signal.worldId,
    signalRef,
    proposalRef,
    outcome,
    recordedAt,
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertExternalSignalUseContract(use);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.externalSignalUse, signalUseId, 1);
  const expectedRef = exactRef(ARTIFACT_KINDS.externalSignalUse, signalUseId, 1, use);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ExternalSignalUseReceipt identity is already bound to different content");
    return { use, useRef: existing.envelope.artifactRef, idempotent: true };
  }
  try {
    const stored = await putArtifact(root, use, {
      kind: ARTIFACT_KINDS.externalSignalUse,
      id: signalUseId,
      version: 1,
      status: "candidate",
      createdAt: recordedAt,
      createdBy: "codex.root"
    });
    return { use, useRef: stored.envelope.artifactRef, idempotent: false };
  } catch (error) {
    const raced = await findArtifactByVersion(root, ARTIFACT_KINDS.externalSignalUse, signalUseId, 1);
    if (raced && sameRef(raced.envelope.artifactRef, expectedRef)) return { use, useRef: raced.envelope.artifactRef, idempotent: true };
    throw error;
  }
}

export async function listExternalSignalUses(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const uses = (await listArtifacts(root))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.externalSignalUse)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .filter((item) => !options.outcome || item.envelope.payload.outcome === options.outcome)
    .sort((left, right) => Date.parse(left.envelope.payload.recordedAt) - Date.parse(right.envelope.payload.recordedAt)
      || left.envelope.payload.signalUseId.localeCompare(right.envelope.payload.signalUseId));
  for (const item of uses) await verifyExternalSignalUse(root, item.envelope.artifactRef);
  return uses.map((item) => ({ use: item.envelope.payload, useRef: item.envelope.artifactRef }));
}

export async function ingestExternalSignal(projectRoot, input, options = {}) {
  const root = resolve(projectRoot);
  if (!isPlainObject(input)) throw new TypeError("ExternalSignal input must be an object");
  const { profile, receipt } = await validateSourceChain(root, input);
  assertExactRef(input.sourceProjectionRef, ARTIFACT_KINDS.projection, "sourceProjectionRef");
  assertExactRef(input.sourceReceiptRef, ARTIFACT_KINDS.receipt, "sourceReceiptRef");
  assertExactRef(input.platformProfileRef, ARTIFACT_KINDS.platformProfile, "platformProfileRef");
  assertDate(input.observedAt, "observedAt");
  const receivedAt = input.receivedAt || options.receivedAt || new Date().toISOString();
  assertDate(receivedAt, "receivedAt");
  const observation = structuredClone(input.observation);
  assertObservation(observation);
  const dedupeKey = externalSignalDedupeKey({
    platformId: profile.platformId,
    platformRecordId: receipt.platformRecordId,
    sourceEventId: input.sourceEventId,
    signalType: input.signalType
  });
  if (input.dedupeKey && input.dedupeKey !== dedupeKey) throw new Error("ExternalSignal dedupeKey does not match its exact source identity");
  const signalId = input.signalId || `signal.${dedupeKey.slice("sha256:".length, "sha256:".length + 32)}`;
  const expectedSignalId = `signal.${dedupeKey.slice("sha256:".length, "sha256:".length + 32)}`;
  if (signalId !== expectedSignalId) throw new Error("ExternalSignal signalId must be derived from its exact dedupe key");
  const signal = {
    kind: ARTIFACT_KINDS.externalSignal,
    contractVersion: WORLD_OS_VERSION,
    signalId,
    version: 1,
    worldId: input.worldId,
    sourceProjectionRef: input.sourceProjectionRef,
    sourceReceiptRef: input.sourceReceiptRef,
    platformProfileRef: input.platformProfileRef,
    signalType: input.signalType,
    sourceEventId: input.sourceEventId,
    dedupeKey,
    observedAt: input.observedAt,
    receivedAt,
    observation,
    privacy: structuredClone(input.privacy),
    routing: {
      mode: "proposal_input_only",
      proposalOnly: true,
      stateMutation: false,
      canonMutation: false
    },
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertExternalSignalContract(signal);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.externalSignal, signal.signalId, signal.version);
  const expectedRef = exactRef(ARTIFACT_KINDS.externalSignal, signal.signalId, signal.version, signal);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ExternalSignal identity is already bound to different content");
    return { signal, signalRef: existing.envelope.artifactRef, idempotent: true };
  }
  try {
    const stored = await putArtifact(root, signal, {
      kind: ARTIFACT_KINDS.externalSignal,
      id: signal.signalId,
      version: signal.version,
      status: "candidate",
      createdAt: receivedAt,
      createdBy: "codex.root"
    });
    return { signal, signalRef: stored.envelope.artifactRef, idempotent: false };
  } catch (error) {
    // A concurrent identical ingest may win the immutable version pointer
    // between our read and write. Re-read once and preserve idempotence.
    const raced = await findArtifactByVersion(root, ARTIFACT_KINDS.externalSignal, signal.signalId, signal.version);
    if (raced && sameRef(raced.envelope.artifactRef, expectedRef)) return { signal, signalRef: raced.envelope.artifactRef, idempotent: true };
    throw error;
  }
}

export async function listExternalSignals(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const signals = (await listArtifacts(root))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.externalSignal)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .sort((left, right) => Date.parse(left.envelope.payload.observedAt) - Date.parse(right.envelope.payload.observedAt)
      || left.envelope.payload.signalId.localeCompare(right.envelope.payload.signalId));
  for (const item of signals) await verifyExternalSignal(root, item.envelope.artifactRef);
  return signals.map((item) => ({ signal: item.envelope.payload, signalRef: item.envelope.artifactRef }));
}
