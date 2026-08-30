import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, IDENTIFIER_PATTERN, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";
import { verifyProductionMediaImport } from "./production-media.mjs";
import { verifyProductionGateDecision, verifyProductionSlice } from "./production.mjs";

/*
 * Production Gates describe authority; these records describe the concrete
 * asset package that authority approved. Keeping them separate prevents a
 * generic Gate decision from being mistaken for an ApprovedAsset or Release.
 * Release is deliberately private_workspace-only until a separate platform
 * PublishReceipt is attached.
 */

const QA_KEYS = [
  "kind", "contractVersion", "reviewId", "version", "sliceRef", "worldId",
  "mediaBindingRefs", "qaSnapshotRefs", "decision", "status", "actor",
  "decidedAt", "checklist", "rationale", "authority", "recordedBy"
];
const CHECKLIST_KEYS = [
  "identityConsistent", "geographyConsistent", "styleConsistent",
  "rightsConsistent", "technicalValid", "continuityValid"
];
const APPROVED_ASSET_KEYS = [
  "kind", "contractVersion", "approvedAssetId", "version", "worldId",
  "sliceRef", "sourceQaReviewRef", "mediaBindingRefs", "mediaImportRefs",
  "status", "visibility", "approvedAt", "approvedBy", "recordedBy"
];
const RELEASE_KEYS = [
  "kind", "contractVersion", "releaseId", "version", "worldId", "sliceRef",
  "approvedAssetRefs", "releaseGateDecisionRef", "visibility", "public",
  "status", "destination", "releasedAt", "releasedBy", "publishReceiptRefs",
  "recordedBy"
];
const ACTOR_KEYS = ["kind", "id"];
const DESTINATION_KEYS = ["kind", "id"];
const QA_DECISIONS = new Set(["approve", "reject", "revise"]);
const QA_STATUSES = new Set(["approved", "rejected", "needs_revision"]);
const ASSET_STATUSES = new Set(["approved"]);
const VISIBILITY = "private_workspace";

function assertExactKeys(value, keys, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) {
    throw new TypeError(`${label} fields must be exact`);
  }
}

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return value;
}

function assertWriter(value, label) {
  assertExactKeys(value, ["kind", "id"], label);
  if (value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function assertHuman(value, label) {
  assertExactKeys(value, ACTOR_KEYS, label);
  if (value.kind !== "human" || typeof value.id !== "string" || !value.id.trim() || value.id.length > 160) {
    throw new TypeError(`${label} must identify a human actor`);
  }
}

function assertRefList(value, kind, label, { min = 1, max = 64 } = {}) {
  if (!Array.isArray(value) || value.length < min || value.length > max
    || new Set(value.map((ref) => JSON.stringify(ref))).size !== value.length) throw new TypeError(`${label} must be a unique exact-ref list`);
  for (const [index, ref] of value.entries()) {
    if (!isExactRef(ref) || ref.kind !== kind) throw new TypeError(`${label}[${index}] must target ${kind}`);
  }
  return value;
}

function qaStatus(decision) {
  return decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "needs_revision";
}

function qaReviewId(input) {
  return `production-qa-review.${sha256Canonical(input).slice("sha256:".length, "sha256:".length + 32)}`;
}

function approvedAssetId(input) {
  return `approved-asset.${sha256Canonical(input).slice("sha256:".length, "sha256:".length + 32)}`;
}

function releaseId(input) {
  return `release.private.${sha256Canonical(input).slice("sha256:".length, "sha256:".length + 32)}`;
}

function assertChecklist(value, label = "checklist") {
  assertExactKeys(value, CHECKLIST_KEYS, label);
  for (const key of CHECKLIST_KEYS) if (typeof value[key] !== "boolean") throw new TypeError(`${label}.${key} must be boolean`);
  return value;
}

export function assertProductionQaReviewContract(review) {
  if (!isPlainObject(review) || review.kind !== ARTIFACT_KINDS.productionQaReview || review.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ProductionQaReview contract");
  assertExactKeys(review, QA_KEYS, "ProductionQaReview");
  if (!IDENTIFIER_PATTERN.test(review.reviewId || "") || review.version !== 1
    || !isExactRef(review.sliceRef) || review.sliceRef.kind !== ARTIFACT_KINDS.productionSlice
    || !WORLD_ID_PATTERN.test(review.worldId || "") || !QA_DECISIONS.has(review.decision)
    || !QA_STATUSES.has(review.status) || review.status !== qaStatus(review.decision)) throw new TypeError("ProductionQaReview identity or status is invalid");
  assertRefList(review.mediaBindingRefs, ARTIFACT_KINDS.productionMediaImport, "ProductionQaReview.mediaBindingRefs", { max: 12 });
  assertRefList(review.qaSnapshotRefs, ARTIFACT_KINDS.productionContractSnapshot, "ProductionQaReview.qaSnapshotRefs", { max: 64 });
  assertHuman(review.actor, "ProductionQaReview.actor");
  assertDate(review.decidedAt, "ProductionQaReview.decidedAt");
  assertChecklist(review.checklist);
  if (typeof review.rationale !== "string" || !review.rationale.trim() || review.rationale.length > 2000) throw new TypeError("ProductionQaReview.rationale is invalid");
  if (review.authority !== "human_qa") throw new TypeError("ProductionQaReview.authority is invalid");
  assertWriter(review.recordedBy, "ProductionQaReview.recordedBy");
  const identity = {
    sliceRef: review.sliceRef,
    worldId: review.worldId,
    mediaBindingRefs: review.mediaBindingRefs,
    qaSnapshotRefs: review.qaSnapshotRefs,
    decision: review.decision,
    actor: review.actor,
    decidedAt: review.decidedAt,
    checklist: review.checklist,
    rationale: review.rationale
  };
  if (review.reviewId !== qaReviewId(identity)) throw new Error("ProductionQaReview identity is not deterministic");
  if (review.decision === "approve" && Object.values(review.checklist).some((value) => value !== true)) throw new Error("Approved ProductionQaReview requires every checklist item to be true");
  return review;
}

export function assertApprovedAssetContract(asset) {
  if (!isPlainObject(asset) || asset.kind !== ARTIFACT_KINDS.approvedAsset || asset.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ApprovedAsset contract");
  assertExactKeys(asset, APPROVED_ASSET_KEYS, "ApprovedAsset");
  if (!IDENTIFIER_PATTERN.test(asset.approvedAssetId || "") || asset.version !== 1 || !WORLD_ID_PATTERN.test(asset.worldId || "")
    || !isExactRef(asset.sliceRef) || asset.sliceRef.kind !== ARTIFACT_KINDS.productionSlice
    || !isExactRef(asset.sourceQaReviewRef) || asset.sourceQaReviewRef.kind !== ARTIFACT_KINDS.productionQaReview
    || asset.status !== "approved" || asset.visibility !== VISIBILITY) throw new TypeError("ApprovedAsset identity or status is invalid");
  assertRefList(asset.mediaBindingRefs, ARTIFACT_KINDS.productionMediaImport, "ApprovedAsset.mediaBindingRefs", { max: 12 });
  assertRefList(asset.mediaImportRefs, "cineweave_codex_media_import", "ApprovedAsset.mediaImportRefs", { max: 12 });
  assertDate(asset.approvedAt, "ApprovedAsset.approvedAt");
  assertHuman(asset.approvedBy, "ApprovedAsset.approvedBy");
  assertWriter(asset.recordedBy, "ApprovedAsset.recordedBy");
  const identity = {
    sliceRef: asset.sliceRef,
    sourceQaReviewRef: asset.sourceQaReviewRef,
    mediaBindingRefs: asset.mediaBindingRefs,
    mediaImportRefs: asset.mediaImportRefs,
    approvedAt: asset.approvedAt,
    approvedBy: asset.approvedBy
  };
  if (asset.approvedAssetId !== approvedAssetId(identity)) throw new Error("ApprovedAsset identity is not deterministic");
  return asset;
}

export function assertPrivateReleaseReceiptContract(receipt) {
  if (!isPlainObject(receipt) || receipt.kind !== ARTIFACT_KINDS.releaseReceipt || receipt.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported private ReleaseReceipt contract");
  assertExactKeys(receipt, RELEASE_KEYS, "PrivateReleaseReceipt");
  if (!IDENTIFIER_PATTERN.test(receipt.releaseId || "") || receipt.version !== 1 || !WORLD_ID_PATTERN.test(receipt.worldId || "")
    || !isExactRef(receipt.sliceRef) || receipt.sliceRef.kind !== ARTIFACT_KINDS.productionSlice
    || !isExactRef(receipt.releaseGateDecisionRef) || receipt.releaseGateDecisionRef.kind !== ARTIFACT_KINDS.productionGateDecision
    || receipt.visibility !== VISIBILITY || receipt.public !== false || receipt.status !== "private_ready") throw new TypeError("PrivateReleaseReceipt identity or visibility is invalid");
  assertRefList(receipt.approvedAssetRefs, ARTIFACT_KINDS.approvedAsset, "PrivateReleaseReceipt.approvedAssetRefs", { max: 64 });
  assertRefList(receipt.publishReceiptRefs, ARTIFACT_KINDS.receipt, "PrivateReleaseReceipt.publishReceiptRefs", { min: 0, max: 64 });
  assertExactKeys(receipt.destination, DESTINATION_KEYS, "PrivateReleaseReceipt.destination");
  if (receipt.destination.kind !== VISIBILITY || !IDENTIFIER_PATTERN.test(receipt.destination.id || "")) throw new TypeError("PrivateReleaseReceipt.destination is invalid");
  assertDate(receipt.releasedAt, "PrivateReleaseReceipt.releasedAt");
  assertHuman(receipt.releasedBy, "PrivateReleaseReceipt.releasedBy");
  assertWriter(receipt.recordedBy, "PrivateReleaseReceipt.recordedBy");
  const identity = {
    worldId: receipt.worldId,
    sliceRef: receipt.sliceRef,
    approvedAssetRefs: receipt.approvedAssetRefs,
    releaseGateDecisionRef: receipt.releaseGateDecisionRef,
    destination: receipt.destination,
    releasedAt: receipt.releasedAt,
    releasedBy: receipt.releasedBy,
    publishReceiptRefs: receipt.publishReceiptRefs
  };
  if (receipt.releaseId !== releaseId(identity)) throw new Error("PrivateReleaseReceipt identity is not deterministic");
  return receipt;
}

async function exactArtifact(root, ref, kind, label) {
  if (!isExactRef(ref) || ref.kind !== kind) throw new TypeError(`${label} must target ${kind}`);
  const item = await findArtifact(root, ref);
  if (!sameRef(item.envelope.artifactRef, ref)) throw new Error(`${label} is not the exact stored artifact`);
  return item;
}

async function assertQaGateEvidence(root, approvedSlice, qaReviewRef) {
  for (const ref of approvedSlice.gateDecisionRefs) {
    const item = await findArtifact(root, ref);
    const decision = item.envelope.payload;
    if (decision.gate === "qa" && decision.decision === "approve" && decision.evidenceRefs.some((evidence) => sameRef(evidence, qaReviewRef))) return decision;
  }
  throw new Error("ApprovedAsset requires an approved QA Gate decision that cites the exact QA review");
}

export async function createProductionQaReview(projectRoot, sliceRef, input = {}) {
  const root = projectRoot;
  const verified = await verifyProductionSlice(root, sliceRef);
  const slice = verified.slice;
  if (slice.stage !== "qa_pending") throw new Error("ProductionQaReview can only be recorded for the current qa_pending slice");
  const mediaBindingRefs = input.mediaBindingRefs || input.mediaRefs;
  assertRefList(mediaBindingRefs, ARTIFACT_KINDS.productionMediaImport, "mediaBindingRefs", { max: 12 });
  for (const ref of mediaBindingRefs) {
    const media = await verifyProductionMediaImport(root, ref);
    if (!sameRef(media.binding.sliceRef, sliceRef) || media.binding.worldId !== slice.worldId) throw new Error("QA media evidence is not bound to the exact qa_pending ProductionSlice");
  }
  const qaSnapshotRefs = input.qaSnapshotRefs || slice.contractRefs.qaReviews;
  assertRefList(qaSnapshotRefs, ARTIFACT_KINDS.productionContractSnapshot, "qaSnapshotRefs", { max: 64 });
  for (const ref of qaSnapshotRefs) {
    if (!slice.contractRefs.qaReviews.some((candidate) => sameRef(candidate, ref))) throw new Error("QA snapshot is not one of the exact ProductionSlice QA snapshots");
    await findArtifact(root, ref);
  }
  const actor = { kind: "human", id: input.actorId };
  assertHuman(actor, "actor");
  const decidedAt = assertDate(input.decidedAt || new Date().toISOString(), "decidedAt");
  const checklist = assertChecklist(input.checklist || {
    identityConsistent: false,
    geographyConsistent: false,
    styleConsistent: false,
    rightsConsistent: false,
    technicalValid: false,
    continuityValid: false
  });
  const decision = input.decision || "approve";
  if (!QA_DECISIONS.has(decision)) throw new TypeError("QA decision must be approve, reject or revise");
  const rationale = input.rationale || "Human QA review recorded by the Canon owner.";
  const identity = { sliceRef, worldId: slice.worldId, mediaBindingRefs, qaSnapshotRefs, decision, actor, decidedAt, checklist, rationale };
  const review = {
    kind: ARTIFACT_KINDS.productionQaReview,
    contractVersion: WORLD_OS_VERSION,
    reviewId: qaReviewId(identity),
    version: 1,
    sliceRef,
    worldId: slice.worldId,
    mediaBindingRefs,
    qaSnapshotRefs,
    decision,
    status: qaStatus(decision),
    actor,
    decidedAt,
    checklist,
    rationale,
    authority: "human_qa",
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertProductionQaReviewContract(review);
  const expectedRef = exactRef(ARTIFACT_KINDS.productionQaReview, review.reviewId, review.version, review);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.productionQaReview, review.reviewId, review.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ProductionQaReview identity is bound to different content");
    return { review, reviewRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, review, {
    kind: ARTIFACT_KINDS.productionQaReview,
    id: review.reviewId,
    version: review.version,
    status: review.status === "approved" ? "approved" : review.status === "rejected" ? "rejected" : "candidate",
    createdAt: decidedAt,
    createdBy: "codex.root"
  });
  return { review, reviewRef: stored.envelope.artifactRef, idempotent: false };
}

export async function verifyProductionQaReview(projectRoot, reviewRef, options = {}) {
  const item = await exactArtifact(projectRoot, reviewRef, ARTIFACT_KINDS.productionQaReview, "ProductionQaReview");
  const review = assertProductionQaReviewContract(item.envelope.payload);
  const cache = options.cache?.qa;
  const cacheKey = JSON.stringify(reviewRef);
  if (cache?.has(cacheKey)) return cache.get(cacheKey);
  if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.productionQaReview, review.reviewId, review.version, review))) throw new Error("ProductionQaReview is not content-addressed exactly");
  const slice = (await verifyProductionSlice(projectRoot, review.sliceRef)).slice;
  if (slice.worldId !== review.worldId || slice.stage !== "qa_pending") throw new Error("ProductionQaReview must bind to a qa_pending slice");
  for (const ref of review.qaSnapshotRefs) {
    await findArtifact(projectRoot, ref);
    if (!slice.contractRefs.qaReviews.some((candidate) => sameRef(candidate, ref))) throw new Error("ProductionQaReview references a QA snapshot outside the exact slice");
  }
  for (const ref of review.mediaBindingRefs) {
    const media = await verifyProductionMediaImport(projectRoot, ref, options);
    if (!sameRef(media.binding.sliceRef, review.sliceRef) || media.binding.worldId !== review.worldId) throw new Error("ProductionQaReview media evidence is not exact");
  }
  const result = { review, reviewRef: item.envelope.artifactRef, slice };
  cache?.set(cacheKey, result);
  return result;
}

export async function createApprovedAsset(projectRoot, sliceRef, reviewRef) {
  const root = projectRoot;
  const verifiedSlice = await verifyProductionSlice(root, sliceRef);
  const slice = verifiedSlice.slice;
  if (slice.stage !== "approved_asset") throw new Error("ApprovedAsset requires the current slice to be at approved_asset");
  const qa = await verifyProductionQaReview(root, reviewRef);
  if (qa.review.decision !== "approve" || qa.review.sliceRef.id !== slice.sliceId || qa.review.sliceRef.version >= slice.version) throw new Error("ApprovedAsset requires an approved QA review for an earlier exact slice version");
  await assertQaGateEvidence(root, slice, reviewRef);
  const mediaImportRefs = [];
  for (const bindingRef of qa.review.mediaBindingRefs) {
    const media = await verifyProductionMediaImport(root, bindingRef);
    mediaImportRefs.push(media.mediaImportRef);
  }
  const approvedAt = qa.review.decidedAt;
  const approvedBy = qa.review.actor;
  const identity = { sliceRef, sourceQaReviewRef: reviewRef, mediaBindingRefs: qa.review.mediaBindingRefs, mediaImportRefs, approvedAt, approvedBy };
  const asset = {
    kind: ARTIFACT_KINDS.approvedAsset,
    contractVersion: WORLD_OS_VERSION,
    approvedAssetId: approvedAssetId(identity),
    version: 1,
    worldId: slice.worldId,
    sliceRef,
    sourceQaReviewRef: reviewRef,
    mediaBindingRefs: qa.review.mediaBindingRefs,
    mediaImportRefs,
    status: "approved",
    visibility: VISIBILITY,
    approvedAt,
    approvedBy,
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertApprovedAssetContract(asset);
  const expectedRef = exactRef(ARTIFACT_KINDS.approvedAsset, asset.approvedAssetId, asset.version, asset);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.approvedAsset, asset.approvedAssetId, asset.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("ApprovedAsset identity is bound to different content");
    return { asset, approvedAssetRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, asset, {
    kind: ARTIFACT_KINDS.approvedAsset,
    id: asset.approvedAssetId,
    version: asset.version,
    status: "approved",
    createdAt: approvedAt,
    createdBy: "codex.root"
  });
  return { asset, approvedAssetRef: stored.envelope.artifactRef, idempotent: false };
}

export async function verifyApprovedAsset(projectRoot, assetRef, options = {}) {
  const item = await exactArtifact(projectRoot, assetRef, ARTIFACT_KINDS.approvedAsset, "ApprovedAsset");
  const asset = assertApprovedAssetContract(item.envelope.payload);
  const cache = options.cache?.asset;
  const cacheKey = JSON.stringify(assetRef);
  if (cache?.has(cacheKey)) return cache.get(cacheKey);
  if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.approvedAsset, asset.approvedAssetId, asset.version, asset))) throw new Error("ApprovedAsset is not content-addressed exactly");
  const slice = (await verifyProductionSlice(projectRoot, asset.sliceRef)).slice;
  if (slice.worldId !== asset.worldId || slice.stage !== "approved_asset") throw new Error("ApprovedAsset must bind to an approved_asset slice");
  const qa = await verifyProductionQaReview(projectRoot, asset.sourceQaReviewRef, options);
  if (qa.review.decision !== "approve" || qa.review.sliceRef.id !== slice.sliceId || qa.review.sliceRef.version >= slice.version) throw new Error("ApprovedAsset QA review is not the exact predecessor approval");
  await assertQaGateEvidence(projectRoot, slice, asset.sourceQaReviewRef);
  if (asset.mediaBindingRefs.length !== qa.review.mediaBindingRefs.length || asset.mediaImportRefs.length !== qa.review.mediaBindingRefs.length) throw new Error("ApprovedAsset media evidence count differs from QA review");
  for (let index = 0; index < asset.mediaBindingRefs.length; index += 1) {
    const media = await verifyProductionMediaImport(projectRoot, asset.mediaBindingRefs[index], options);
    if (!sameRef(media.mediaImportRef, asset.mediaImportRefs[index])) throw new Error("ApprovedAsset media import ref is not exact");
  }
  const result = { asset, approvedAssetRef: item.envelope.artifactRef, slice, qaReview: qa.review };
  cache?.set(cacheKey, result);
  return result;
}

async function assertPublishReceipt(root, ref, slice) {
  const item = await exactArtifact(root, ref, ARTIFACT_KINDS.receipt, "PublishReceipt");
  const payload = item.envelope.payload;
  if (payload.status !== "succeeded" || payload.canonMutation !== false
    || !Array.isArray(payload.sourceCommitRefs) || !payload.sourceCommitRefs.some((sourceRef) => sameRef(sourceRef, slice.sourceCommitRef))) {
    throw new Error("Private release can only bind a successful non-authoritative PublishReceipt for the exact source commit");
  }
}

export async function createPrivateReleaseReceipt(projectRoot, sliceRef, approvedAssetRefs, input = {}) {
  const root = projectRoot;
  const verifiedSlice = await verifyProductionSlice(root, sliceRef);
  const slice = verifiedSlice.slice;
  if (slice.stage !== "released" || slice.status !== "released") throw new Error("Private ReleaseReceipt requires the current slice to be released");
  assertRefList(approvedAssetRefs, ARTIFACT_KINDS.approvedAsset, "approvedAssetRefs", { max: 64 });
  for (const ref of approvedAssetRefs) {
    const asset = await verifyApprovedAsset(root, ref);
    if (asset.asset.worldId !== slice.worldId || asset.asset.sliceRef.id !== slice.sliceId || asset.asset.sliceRef.version >= slice.version) throw new Error("Release approved asset is not bound to the exact released slice lineage");
  }
  let releaseGateDecisionRef = null;
  let releaseGateDecision = null;
  for (const ref of slice.gateDecisionRefs) {
    const decision = await verifyProductionGateDecision(root, ref);
    if (decision.gate === "release" && decision.decision === "approve") {
      releaseGateDecisionRef = ref;
      releaseGateDecision = decision;
    }
  }
  if (!releaseGateDecisionRef) throw new Error("Released slice has no exact approved release Gate decision");
  if (approvedAssetRefs.some((ref) => !releaseGateDecision.evidenceRefs.some((evidence) => sameRef(evidence, ref)))) {
    throw new Error("Release Gate evidence must cite every exact ApprovedAsset being released");
  }
  const publishReceiptRefs = input.publishReceiptRefs || [];
  assertRefList(publishReceiptRefs, ARTIFACT_KINDS.receipt, "publishReceiptRefs", { min: 0, max: 64 });
  for (const ref of publishReceiptRefs) await assertPublishReceipt(root, ref, slice);
  const releasedAt = assertDate(input.releasedAt || new Date().toISOString(), "releasedAt");
  const releasedBy = { kind: "human", id: input.actorId };
  assertHuman(releasedBy, "releasedBy");
  const destination = { kind: VISIBILITY, id: input.destinationId || "studio-local" };
  assertExactKeys(destination, DESTINATION_KEYS, "destination");
  if (!IDENTIFIER_PATTERN.test(destination.id)) throw new TypeError("destinationId is invalid");
  const identity = { worldId: slice.worldId, sliceRef, approvedAssetRefs, releaseGateDecisionRef, destination, releasedAt, releasedBy, publishReceiptRefs };
  const receipt = {
    kind: ARTIFACT_KINDS.releaseReceipt,
    contractVersion: WORLD_OS_VERSION,
    releaseId: releaseId(identity),
    version: 1,
    worldId: slice.worldId,
    sliceRef,
    approvedAssetRefs,
    releaseGateDecisionRef,
    visibility: VISIBILITY,
    public: false,
    status: "private_ready",
    destination,
    releasedAt,
    releasedBy,
    publishReceiptRefs,
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertPrivateReleaseReceiptContract(receipt);
  const expectedRef = exactRef(ARTIFACT_KINDS.releaseReceipt, receipt.releaseId, receipt.version, receipt);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.releaseReceipt, receipt.releaseId, receipt.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("Private ReleaseReceipt identity is bound to different content");
    return { receipt, releaseReceiptRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, receipt, {
    kind: ARTIFACT_KINDS.releaseReceipt,
    id: receipt.releaseId,
    version: receipt.version,
    status: "approved",
    createdAt: releasedAt,
    createdBy: "codex.root"
  });
  return { receipt, releaseReceiptRef: stored.envelope.artifactRef, idempotent: false };
}

export async function verifyPrivateReleaseReceipt(projectRoot, receiptRef, options = {}) {
  const item = await exactArtifact(projectRoot, receiptRef, ARTIFACT_KINDS.releaseReceipt, "PrivateReleaseReceipt");
  const receipt = assertPrivateReleaseReceiptContract(item.envelope.payload);
  const cache = options.cache?.release;
  const cacheKey = JSON.stringify(receiptRef);
  if (cache?.has(cacheKey)) return cache.get(cacheKey);
  if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.releaseReceipt, receipt.releaseId, receipt.version, receipt))) throw new Error("Private ReleaseReceipt is not content-addressed exactly");
  const slice = (await verifyProductionSlice(projectRoot, receipt.sliceRef)).slice;
  if (slice.worldId !== receipt.worldId || slice.stage !== "released" || slice.status !== "released") throw new Error("Private ReleaseReceipt must bind to a released slice");
  const gate = await verifyProductionGateDecision(projectRoot, receipt.releaseGateDecisionRef);
  if (gate.gate !== "release" || gate.decision !== "approve" || !slice.gateDecisionRefs.some((ref) => sameRef(ref, receipt.releaseGateDecisionRef))) throw new Error("Private ReleaseReceipt release Gate is not exact");
  if (receipt.approvedAssetRefs.some((ref) => !gate.evidenceRefs.some((evidence) => sameRef(evidence, ref)))) throw new Error("Private ReleaseReceipt ApprovedAsset is not cited by the release Gate evidence");
  for (const ref of receipt.approvedAssetRefs) {
    const asset = await verifyApprovedAsset(projectRoot, ref, options);
    if (asset.asset.worldId !== receipt.worldId || asset.asset.sliceRef.id !== slice.sliceId || asset.asset.sliceRef.version >= slice.version) throw new Error("Private ReleaseReceipt ApprovedAsset lineage is invalid");
  }
  for (const ref of receipt.publishReceiptRefs) await assertPublishReceipt(projectRoot, ref, slice);
  const result = { receipt, releaseReceiptRef: item.envelope.artifactRef, slice };
  cache?.set(cacheKey, result);
  return result;
}

export async function listProductionQaReviews(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionQaReview)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .filter((item) => !options.status || item.envelope.payload.status === options.status)
    .sort((left, right) => left.envelope.payload.reviewId.localeCompare(right.envelope.payload.reviewId));
  return Promise.all(items.map((item) => verifyProductionQaReview(projectRoot, item.envelope.artifactRef)));
}

export async function listApprovedAssets(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.approvedAsset)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .sort((left, right) => left.envelope.payload.approvedAssetId.localeCompare(right.envelope.payload.approvedAssetId));
  return Promise.all(items.map((item) => verifyApprovedAsset(projectRoot, item.envelope.artifactRef)));
}

export async function listPrivateReleaseReceipts(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.releaseReceipt)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .sort((left, right) => left.envelope.payload.releaseId.localeCompare(right.envelope.payload.releaseId));
  return Promise.all(items.map((item) => verifyPrivateReleaseReceipt(projectRoot, item.envelope.artifactRef)));
}
