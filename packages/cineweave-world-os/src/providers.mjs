import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { assertEventProposalContract } from "./engine.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";

const BRANCH_ROLES = new Set(["baseline", "deterioration", "opportunity"]);

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function assertUniqueStringBounds(value, label) {
  if (!Array.isArray(value) || !value.length || value.some((item) => !isNonEmptyString(item)) || new Set(value).size !== value.length) {
    throw new Error(`Simulation request ${label} must be unique non-empty strings`);
  }
}

export function assertProviderPolicy(policy) {
  if (!isPlainObject(policy)) throw new TypeError("Provider policy must be an object");
  if (policy.kind !== "world_os_llm_provider_policy" || policy.contractVersion !== WORLD_OS_VERSION) throw new Error("Unsupported provider policy contract");
  if (!isNonEmptyString(policy.policyId) || !Number.isSafeInteger(policy.version) || policy.version < 1 || !isNonEmptyString(policy.modelAlias)) {
    throw new Error("Provider policy identity is invalid");
  }
  if (policy.outputScope !== "proposal_only" || policy.canApprove !== false || policy.canCommit !== false || policy.canWriteState !== false) {
    throw new Error("Simulation providers must be proposal-only and have no approval, commit or state-write authority");
  }
  if (policy.enabled !== true) throw new Error("Simulation provider policy is disabled");
  if (policy.requiredRequestKind !== ARTIFACT_KINDS.simulationRequest || policy.requiredResponseKind !== ARTIFACT_KINDS.proposal) throw new Error("Provider request or response contract is invalid");
  if (policy.endpointMode !== "runtime_injected" || policy.credentials !== "environment_only") throw new Error("Provider endpoint and credentials must be injected at runtime");
  if (!isPlainObject(policy.budgets) || !Number.isSafeInteger(policy.budgets.maxCandidates) || policy.budgets.maxCandidates < 1 || policy.budgets.maxCandidates > 3
    || !Number.isSafeInteger(policy.budgets.maxOutputTokens) || policy.budgets.maxOutputTokens < 1
    || !Number.isFinite(policy.budgets.maxCostUsd) || policy.budgets.maxCostUsd < 0
    || !Number.isSafeInteger(policy.budgets.timeoutMs) || policy.budgets.timeoutMs < 1) throw new Error("Provider budgets are invalid");
  if (policy.dataPolicy?.sendExactRefs !== true
    || policy.dataPolicy?.sendPrivateActorGoals !== false
    || policy.dataPolicy?.sendRightsRestrictedMedia !== false
    || policy.dataPolicy?.storeRawResponse !== false
    || policy.dataPolicy?.storeHiddenReasoning !== false
    || policy.dataPolicy?.retainUsageReceipt !== true) {
    throw new Error("Provider data policy exceeds the World OS privacy boundary");
  }
  return policy;
}

export function assertSimulationRequest(request, policy) {
  if (!isPlainObject(request) || request.kind !== ARTIFACT_KINDS.simulationRequest || request.contractVersion !== WORLD_OS_VERSION) throw new Error("Unsupported simulation request");
  if (!isNonEmptyString(request.requestId) || !Number.isSafeInteger(request.version) || request.version < 1) throw new Error("Simulation request identity is invalid");
  if (![request.workspaceRef, request.worldCardRef, request.stateRef, request.providerPolicyRef, request.triggerCatalogRef, request.actionCatalogRef].every(isExactRef)) throw new Error("Simulation request requires exact input references");
  const policyRef = exactRef(ARTIFACT_KINDS.providerPolicy, policy.policyId, policy.version, policy);
  if (!sameRef(request.providerPolicyRef, policyRef)) throw new Error("Simulation request is not bound to this exact provider policy");
  if (request.mutationAllowed !== false || request.requiredResponseKind !== ARTIFACT_KINDS.proposal) throw new Error("Simulation request must forbid mutation and require an event proposal");
  assertUniqueStringBounds(request.actorIds, "actorIds");
  assertUniqueStringBounds(request.allowedActionIds, "allowedActionIds");
  assertUniqueStringBounds(request.triggerIds, "triggerIds");
  if (request.requestedBy?.kind !== "codex" || request.requestedBy?.id !== "codex.root" || Number.isNaN(Date.parse(request.requestedAt))) throw new Error("Simulation requests must be issued by codex.root with a valid timestamp");
  const candidates = request.branchPolicy?.maxCandidates;
  const allowedBranches = request.branchPolicy?.allowed;
  if (!Array.isArray(allowedBranches) || !allowedBranches.length || allowedBranches.length > 3
    || allowedBranches.some((role) => !BRANCH_ROLES.has(role)) || new Set(allowedBranches).size !== allowedBranches.length
    || !Number.isSafeInteger(candidates) || candidates < 1 || candidates > 3 || candidates > policy.budgets.maxCandidates) {
    throw new Error("Simulation branch policy is invalid or exceeds provider policy");
  }
  if (!isPlainObject(request.budget)
    || !Number.isSafeInteger(request.budget.maxOutputTokens)
    || request.budget.maxOutputTokens < 1
    || request.budget.maxOutputTokens > policy.budgets.maxOutputTokens
    || !Number.isFinite(request.budget.maxCostUsd)
    || request.budget.maxCostUsd < 0
    || request.budget.maxCostUsd > policy.budgets.maxCostUsd
    || !Number.isSafeInteger(request.budget.timeoutMs)
    || request.budget.timeoutMs < 1
    || request.budget.timeoutMs > policy.budgets.timeoutMs) {
    throw new Error("Simulation request exceeds its token, cost or timeout budget");
  }
  return request;
}

export async function requestSimulationProposal(provider, request, policy) {
  assertProviderPolicy(policy);
  assertSimulationRequest(request, policy);
  if (!provider || !isNonEmptyString(provider.id) || typeof provider.propose !== "function") throw new TypeError("Provider must expose a stable id and propose(request)");
  const controller = new AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`Simulation provider timed out after ${request.budget.timeoutMs}ms`));
    }, request.budget.timeoutMs);
  });
  let result;
  try {
    result = await Promise.race([
      Promise.resolve(provider.propose(structuredClone(request), { signal: controller.signal })),
      timeout
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
  if (!isPlainObject(result) || !isPlainObject(result.proposal) || !isPlainObject(result.usage)) throw new Error("Provider must return both proposal and usage receipt");
  const proposal = result.proposal;
  const usage = result.usage;
  if (!isPlainObject(proposal) || proposal.kind !== ARTIFACT_KINDS.proposal || proposal.contractVersion !== WORLD_OS_VERSION) {
    throw new Error("Provider returned a non-proposal payload");
  }
  assertEventProposalContract(proposal);
  if (proposal.source?.authority !== "proposal_only") throw new Error("Provider attempted to exceed proposal-only authority");
  if (proposal.source?.origin !== "llm_api") throw new Error("External simulation providers must identify their origin as llm_api");
  const requestRef = exactRef(ARTIFACT_KINDS.simulationRequest, request.requestId, request.version, request);
  if (!sameRef(proposal.source?.requestRef, requestRef) || proposal.source?.providerId !== provider.id) {
    throw new Error("Provider proposal is not bound to this exact simulation request and provider identity");
  }
  if (!sameRef(proposal.workspaceRef, request.workspaceRef) || !sameRef(proposal.worldCardRef, request.worldCardRef) || !sameRef(proposal.baseStateRef, request.stateRef) || !sameRef(proposal.triggerCatalogRef, request.triggerCatalogRef) || !sameRef(proposal.actionCatalogRef, request.actionCatalogRef)) {
    throw new Error("Provider proposal changed an exact simulation input reference");
  }
  if (!request.triggerIds.includes(proposal.trigger?.triggerId)) throw new Error("Provider proposal uses an unrequested trigger");
  if (!request.branchPolicy.allowed.includes(proposal.branchRole)) throw new Error("Provider proposal uses an unrequested branch role");
  for (const participant of proposal.participants || []) if (!request.actorIds.includes(participant)) throw new Error(`Provider proposal uses unrequested participant ${String(participant)}`);
  for (const action of proposal.actions || []) {
    if (Object.keys(action.parameters || {}).length) throw new Error("Provider proposal parameters must remain empty until a bounded parameter contract exists");
    if (!request.allowedActionIds.includes(action.actionId)) throw new Error(`Provider proposal uses unapproved action ${String(action.actionId)}`);
  }
  if (!Number.isSafeInteger(usage.outputTokens) || usage.outputTokens < 0 || usage.outputTokens > request.budget.maxOutputTokens
    || !Number.isFinite(usage.costUsd) || usage.costUsd < 0 || usage.costUsd > request.budget.maxCostUsd
    || usage.modelAlias !== policy.modelAlias) throw new Error("Provider usage receipt is invalid, over budget or from the wrong model alias");
  return { proposal, usage, providerId: provider.id };
}

export function createFixtureProposalProvider(proposal, usage = { modelAlias: "fixture", outputTokens: 100, costUsd: 0 }) {
  return {
    id: "fixture.proposal-provider",
    async propose() {
      return { proposal: structuredClone(proposal), usage: structuredClone(usage) };
    }
  };
}
