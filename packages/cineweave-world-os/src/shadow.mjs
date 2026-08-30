import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, HASH_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { assertEventProposalContract } from "./engine.mjs";
import { assertProviderPolicy, assertSimulationRequest, requestSimulationProposal } from "./providers.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";

const SHADOW_STATUSES = new Set(["proposal_generated", "failed"]);
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return Date.parse(value);
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function runIdentity({ requestRef, providerId, attemptNumber }) {
  return `llm-shadow.${sha256Canonical({ requestRef, providerId, attemptNumber }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function shadowProposalId({ requestRef, providerId, attemptNumber, providerProposalId }) {
  return `shadow-proposal.${sha256Canonical({ requestRef, providerId, attemptNumber, providerProposalId }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function safeErrorCode(error) {
  const value = error?.code || error?.name;
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value) ? value : "provider_error";
}

function nowIso(options) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date().toISOString();
  assertDate(value, "shadow clock");
  return new Date(value).toISOString();
}

export function assertLlmShadowReceiptContract(receipt) {
  if (!isPlainObject(receipt) || receipt.kind !== ARTIFACT_KINDS.llmShadowReceipt || receipt.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported LLMShadowReceipt contract");
  const keys = ["kind", "contractVersion", "shadowRunId", "version", "requestRef", "providerPolicyRef", "worldId", "providerId", "modelAlias", "attemptNumber", "requestedAt", "completedAt", "status", "proposalRef", "outputTokens", "costUsd", "responseHash", "errorCode", "errorHash", "rawResponseStored", "hiddenReasoningStored", "authority", "recordedBy"];
  if (Object.keys(receipt).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("LLMShadowReceipt fields must be exact");
  if (!IDENTIFIER_PATTERN.test(receipt.shadowRunId) || receipt.version !== 1 || !isExactRef(receipt.requestRef) || receipt.requestRef.kind !== ARTIFACT_KINDS.simulationRequest
    || !isExactRef(receipt.providerPolicyRef) || receipt.providerPolicyRef.kind !== ARTIFACT_KINDS.providerPolicy
    || !/^W[0-9]{2}$/.test(receipt.worldId) || !IDENTIFIER_PATTERN.test(receipt.providerId) || typeof receipt.modelAlias !== "string" || !receipt.modelAlias.trim()
    || !Number.isSafeInteger(receipt.attemptNumber) || receipt.attemptNumber < 1 || receipt.attemptNumber > 100
    || !SHADOW_STATUSES.has(receipt.status)) throw new TypeError("LLMShadowReceipt identity or status is invalid");
  const requested = assertDate(receipt.requestedAt, "LLMShadowReceipt.requestedAt");
  if (assertDate(receipt.completedAt, "LLMShadowReceipt.completedAt") < requested) throw new TypeError("LLMShadowReceipt.completedAt cannot precede requestedAt");
  if (receipt.proposalRef !== null && (!isExactRef(receipt.proposalRef) || receipt.proposalRef.kind !== ARTIFACT_KINDS.proposal)) throw new TypeError("LLMShadowReceipt.proposalRef is invalid");
  if (receipt.status === "proposal_generated" && receipt.proposalRef === null) throw new TypeError("Generated shadow receipt requires proposalRef");
  if (receipt.status === "failed" && receipt.proposalRef !== null) throw new TypeError("Failed shadow receipt cannot claim a proposal");
  if (!Number.isSafeInteger(receipt.outputTokens) || receipt.outputTokens < 0 || !Number.isFinite(receipt.costUsd) || receipt.costUsd < 0) throw new TypeError("LLMShadowReceipt usage is invalid");
  if (receipt.responseHash !== null && !HASH_PATTERN.test(receipt.responseHash)) throw new TypeError("LLMShadowReceipt.responseHash is invalid");
  if (receipt.errorCode !== null && !IDENTIFIER_PATTERN.test(receipt.errorCode)) throw new TypeError("LLMShadowReceipt.errorCode is invalid");
  if (receipt.errorHash !== null && !HASH_PATTERN.test(receipt.errorHash)) throw new TypeError("LLMShadowReceipt.errorHash is invalid");
  if (receipt.status === "proposal_generated" && (receipt.responseHash === null || receipt.errorCode !== null || receipt.errorHash !== null)) throw new TypeError("Generated shadow receipt evidence is inconsistent");
  if (receipt.status === "failed" && (receipt.responseHash !== null || receipt.errorCode === null || receipt.errorHash === null)) throw new TypeError("Failed shadow receipt evidence is inconsistent");
  if (receipt.rawResponseStored !== false || receipt.hiddenReasoningStored !== false || receipt.authority !== "proposal_only") throw new Error("LLM shadow receipts must never persist raw response, hidden reasoning or mutation authority");
  assertWriter(receipt.recordedBy, "LLMShadowReceipt.recordedBy");
  return receipt;
}

async function loadExact(root, ref, kind, label) {
  if (!isExactRef(ref) || ref.kind !== kind) throw new Error(`${label} must be an exact ${kind} reference`);
  const item = await findArtifact(root, ref);
  if (!sameRef(item.envelope.artifactRef, ref)) throw new Error(`${label} is not the exact stored artifact`);
  return item;
}

function assertProviderAdapter(provider, options) {
  if (!isPlainObject(provider) || typeof provider.id !== "string" || !IDENTIFIER_PATTERN.test(provider.id) || typeof provider.propose !== "function") {
    throw new TypeError("LLM provider must expose an identifier and propose(request, { signal })");
  }
  const localFixture = provider.localFixture === true;
  if (!localFixture && (provider.kind !== "world_os_llm_provider" || provider.trusted !== true)) {
    throw new TypeError("Network LLM providers must declare kind=world_os_llm_provider and trusted=true");
  }
  if (!localFixture && options.allowNetwork !== true) throw new Error("LLM network calls are disabled; pass allowNetwork=true only with a trusted provider");
}

export async function verifyLlmShadowReceipt(projectRoot, receiptRef) {
  const root = projectRoot;
  const receiptItem = await loadExact(root, receiptRef, ARTIFACT_KINDS.llmShadowReceipt, "LLMShadowReceipt");
  const receipt = assertLlmShadowReceiptContract(receiptItem.envelope.payload);
  const requestItem = await loadExact(root, receipt.requestRef, ARTIFACT_KINDS.simulationRequest, "LLMShadowReceipt request");
  const policyItem = await loadExact(root, receipt.providerPolicyRef, ARTIFACT_KINDS.providerPolicy, "LLMShadowReceipt provider policy");
  const request = requestItem.envelope.payload;
  const policy = policyItem.envelope.payload;
  assertProviderPolicy(policy);
  assertSimulationRequest(request, policy);
  if (!sameRef(request.providerPolicyRef, receipt.providerPolicyRef) || receipt.modelAlias !== policy.modelAlias) throw new Error("LLMShadowReceipt is not bound to its exact provider policy");
  const worldCard = await loadExact(root, request.worldCardRef, ARTIFACT_KINDS.worldCard, "LLMShadowReceipt world");
  if (worldCard.envelope.payload.worldId !== receipt.worldId || receipt.shadowRunId !== runIdentity({ requestRef: receipt.requestRef, providerId: receipt.providerId, attemptNumber: receipt.attemptNumber })) throw new Error("LLMShadowReceipt identity or world binding is invalid");
  if (receipt.status === "proposal_generated") {
    const proposal = (await loadExact(root, receipt.proposalRef, ARTIFACT_KINDS.proposal, "LLMShadowReceipt proposal")).envelope.payload;
    if (proposal.worldId !== receipt.worldId || proposal.source?.origin !== "llm_api" || proposal.source?.authority !== "proposal_only"
      || proposal.source?.providerId !== receipt.providerId || !sameRef(proposal.source?.requestRef, receipt.requestRef)) throw new Error("LLMShadowReceipt proposal authority or source binding is invalid");
  }
  return receipt;
}

export async function listLlmShadowReceipts(projectRoot, options = {}) {
  const receipts = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.llmShadowReceipt)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .filter((item) => !options.providerId || item.envelope.payload.providerId === options.providerId)
    .sort((left, right) => left.envelope.payload.attemptNumber - right.envelope.payload.attemptNumber
      || left.envelope.payload.shadowRunId.localeCompare(right.envelope.payload.shadowRunId));
  for (const item of receipts) await verifyLlmShadowReceipt(projectRoot, item.envelope.artifactRef);
  return receipts.map((item) => ({ receipt: item.envelope.payload, receiptRef: item.envelope.artifactRef }));
}

export async function runLlmShadow(projectRoot, requestDocument, policyDocument, provider, options = {}) {
  const root = projectRoot;
  assertProviderAdapter(provider, options);
  const requestRefInput = requestDocument?.artifactRef
    || (requestDocument?.kind === ARTIFACT_KINDS.simulationRequest ? exactRef(ARTIFACT_KINDS.simulationRequest, requestDocument.requestId, requestDocument.version, requestDocument) : requestDocument);
  const policyRefInput = policyDocument?.artifactRef
    || (policyDocument?.kind === ARTIFACT_KINDS.providerPolicy ? exactRef(ARTIFACT_KINDS.providerPolicy, policyDocument.policyId, policyDocument.version, policyDocument) : policyDocument);
  const requestItem = await loadExact(root, requestRefInput, ARTIFACT_KINDS.simulationRequest, "simulation request");
  const policyItem = await loadExact(root, policyRefInput, ARTIFACT_KINDS.providerPolicy, "provider policy");
  const request = requestItem.envelope.payload;
  const policy = policyItem.envelope.payload;
  assertProviderPolicy(policy);
  assertSimulationRequest(request, policy);
  const requestRef = requestItem.envelope.artifactRef;
  const providerPolicyRef = policyItem.envelope.artifactRef;
  const worldCard = await loadExact(root, request.worldCardRef, ARTIFACT_KINDS.worldCard, "simulation request world");
  const worldId = worldCard.envelope.payload.worldId;
  const existing = await listLlmShadowReceipts(root, { providerId: provider.id, worldId });
  const requestRuns = existing.filter((item) => sameRef(item.receipt.requestRef, requestRef));
  const latest = requestRuns.at(-1)?.receipt;
  if (latest && latest.status === "proposal_generated" && options.forceRetry !== true) {
    return { ...latest, receiptRef: requestRuns.at(-1).receiptRef, idempotent: true };
  }
  const attemptNumber = (latest?.attemptNumber || 0) + 1;
  if (attemptNumber > 100) throw new Error("LLM shadow attempt budget cannot exceed 100");
  const requestedAt = nowIso(options);
  let completedAt = requestedAt;
  let result = null;
  let error = null;
  try {
    result = await requestSimulationProposal(provider, request, policy);
    completedAt = nowIso(options);
  } catch (caught) {
    error = caught;
    completedAt = nowIso(options);
  }
  let proposalRef = null;
  let outputTokens = 0;
  let costUsd = 0;
  let responseHash = null;
  if (result) {
    // Shadow proposals are evidence, not the scheduler's canonical candidate.
    // Namespace their stored identity so a model reusing a Codex/template
    // proposalId cannot occupy the deterministic simulation proposal slot.
    const shadowProposal = structuredClone(result.proposal);
    shadowProposal.proposalId = shadowProposalId({
      requestRef,
      providerId: provider.id,
      attemptNumber,
      providerProposalId: result.proposal.proposalId
    });
    assertEventProposalContract(shadowProposal);
    const storedProposal = await putArtifact(root, shadowProposal, {
      kind: ARTIFACT_KINDS.proposal,
      id: shadowProposal.proposalId,
      version: shadowProposal.proposalVersion,
      status: "candidate",
      createdAt: shadowProposal.proposedAt,
      createdBy: "codex.root"
    });
    proposalRef = storedProposal.envelope.artifactRef;
    outputTokens = result.usage.outputTokens;
    costUsd = result.usage.costUsd;
    responseHash = sha256Canonical(shadowProposal);
  }
  const receipt = {
    kind: ARTIFACT_KINDS.llmShadowReceipt,
    contractVersion: WORLD_OS_VERSION,
    shadowRunId: runIdentity({ requestRef, providerId: provider.id, attemptNumber }),
    version: 1,
    requestRef,
    providerPolicyRef,
    worldId,
    providerId: provider.id,
    modelAlias: policy.modelAlias,
    attemptNumber,
    requestedAt,
    completedAt,
    status: result ? "proposal_generated" : "failed",
    proposalRef,
    outputTokens,
    costUsd,
    responseHash,
    errorCode: error ? safeErrorCode(error) : null,
    errorHash: error ? sha256Canonical({ message: String(error?.message || error) }) : null,
    rawResponseStored: false,
    hiddenReasoningStored: false,
    authority: "proposal_only",
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertLlmShadowReceiptContract(receipt);
  const existingReceipt = await findArtifactByVersion(root, ARTIFACT_KINDS.llmShadowReceipt, receipt.shadowRunId, receipt.version);
  const expectedRef = exactRef(ARTIFACT_KINDS.llmShadowReceipt, receipt.shadowRunId, receipt.version, receipt);
  if (existingReceipt) {
    if (!sameRef(existingReceipt.envelope.artifactRef, expectedRef)) throw new Error("LLMShadowReceipt identity is already bound to different content");
    return { ...receipt, receiptRef: existingReceipt.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, receipt, {
    kind: ARTIFACT_KINDS.llmShadowReceipt,
    id: receipt.shadowRunId,
    version: receipt.version,
    status: receipt.status === "failed" ? "failed" : "candidate",
    createdAt: receipt.completedAt,
    createdBy: "codex.root"
  });
  return { ...receipt, receiptRef: stored.envelope.artifactRef, idempotent: false };
}
