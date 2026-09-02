import { sha256Canonical } from "./canonical-json.mjs";
import { validateByKind } from "../../../scripts/validate-contract-semantics.mjs";

const PREVIEW_KIND = "cineweave_codex_execution_preview";
const REQUEST_KIND = "cineweave_execution_request";
const RESOLUTION_KIND = "cineweave_codex_capability_resolution_plan";
const CAPABILITY_KIND = "cineweave_codex_capability_profile";
const ADAPTER_KIND = "cineweave_adapter_descriptor";
const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/u;
const contentHashPattern = /^sha256:[0-9a-f]{64}$/u;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function exactRef(value, acceptedKinds = []) {
  return isObject(value)
    && Object.keys(value).length === 4
    && typeof value.kind === "string"
    && identifierPattern.test(value.kind)
    && typeof value.id === "string"
    && identifierPattern.test(value.id)
    && Number.isSafeInteger(value.version)
    && value.version >= 1
    && contentHashPattern.test(value.contentHash || "")
    && (!acceptedKinds.length || acceptedKinds.includes(value.kind));
}

function sameRef(left, right) {
  return exactRef(left) && exactRef(right)
    && left.kind === right.kind
    && left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash;
}

function fail(code, message, path = null, details = {}) {
  throw new ExecutionPreviewError(code, message, { path, ...details });
}

export class ExecutionPreviewError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ExecutionPreviewError";
    this.code = code;
    this.path = details.path || null;
    this.details = Object.freeze({ ...details });
  }
}

function assertDate(value, path) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) fail("TIMESTAMP_INVALID", "Execution preview timestamp must be a valid date-time", path);
  return new Date(value).toISOString();
}

function assertSemantic(payload, label, context = {}) {
  if (!isObject(payload)) fail("PAYLOAD_INVALID", `${label} must be an object`);
  const errors = validateByKind(payload, context);
  if (errors.length) fail("PAYLOAD_SEMANTICS_INVALID", `${label} failed semantic validation`, null, { errors });
}

function payloadRef(payload, kind, idField, versionOverride = undefined) {
  return { kind, id: payload[idField], version: versionOverride ?? payload.version, contentHash: sha256Canonical(payload) };
}

function assertPayloadRef(payload, kind, idField, expected, label) {
  const actual = payloadRef(payload, kind, idField, expected?.version);
  if (!sameRef(actual, expected)) fail("PAYLOAD_REF_STALE", `${label} does not match its exact immutable ref`);
  return actual;
}

function allPreflightChecksPass(request) {
  const keys = ["exactRefsResolved", "operationSupported", "hardCapabilitiesSatisfied", "rightsResolved", "budgetResolved", "secretsAbsent"];
  return request.status === "ready" && request.preflight?.status === "ready" && keys.every((key) => request.preflight?.[key] === true);
}

function requirementSummary(resolution) {
  const requirements = resolution.request.requirements || [];
  return {
    hard: requirements.filter((item) => item.level === "hard").length,
    soft: requirements.filter((item) => item.level === "soft").length,
    advisory: requirements.filter((item) => item.level === "advisory").length,
    hardSatisfied: resolution.selection.status === "selected"
      && resolution.candidates.find((candidate) => candidate.candidateId === resolution.selection.selectedCandidateId)?.hardFailures.length === 0
  };
}

function costEstimate(request, descriptor, options) {
  const amountInput = options.estimatedAmount ?? options.costEstimate?.amount;
  const amount = amountInput === undefined || amountInput === null ? null : Number(amountInput);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) fail("COST_INVALID", "estimatedAmount must be a non-negative finite number", "/estimatedAmount");
  const estimateStatus = amount === null ? "unknown" : descriptor.costPolicy?.estimateSupport === "exact" ? "exact" : "bounded";
  const currency = descriptor.costPolicy?.currency;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/u.test(currency)) fail("COST_CURRENCY_INVALID", "AdapterDescriptor cost currency is invalid");
  return {
    status: estimateStatus,
    currency,
    amount,
    maximumAmount: request.budget.maxAmount,
    basis: options.costBasis || (estimateStatus === "unknown" ? "AdapterDescriptor did not provide a bounded amount." : `Loaded ${estimateStatus} estimate for the exact request.`),
    attemptsIncluded: request.budget.maxAttempts,
    unknownCostAction: "block"
  };
}

function risks(request, resolution, cost) {
  const result = [];
  const preflightPass = allPreflightChecksPass(request);
  result.push({
    riskId: "risk.request-preflight",
    severity: "hard",
    status: preflightPass ? "pass" : "block",
    message: preflightPass ? "Exact request preflight is ready." : "The exact ExecutionRequest is blocked or has an incomplete preflight."
  });
  const selected = resolution.selection.status === "selected";
  result.push({
    riskId: "risk.capability-selection",
    severity: "hard",
    status: selected ? "pass" : "block",
    message: selected ? "An explainable eligible capability candidate is selected." : "Capability resolution has no automatically eligible selected candidate."
  });
  const costKnown = cost.amount !== null;
  result.push({
    riskId: "risk.cost-visibility",
    severity: "hard",
    status: costKnown ? "pass" : "block",
    message: costKnown ? `Estimated ${cost.currency} cost is visible before approval.` : "Cost is unknown and the declared unknown-cost policy blocks execution."
  });
  const withinBudget = cost.amount !== null && cost.amount <= cost.maximumAmount;
  result.push({
    riskId: "risk.budget",
    severity: "hard",
    status: withinBudget ? "pass" : "block",
    message: withinBudget ? "The estimate fits the exact request budget." : "The estimate is unavailable or exceeds the exact request budget."
  });
  if (request.executionMode === "external") {
    result.push({
      riskId: "risk.approval",
      severity: "hard",
      status: "review",
      message: "An ApprovalRecord for this exact ExecutionRequest remains pending; the preview does not grant approval."
    });
  } else {
    result.push({
      riskId: "risk.external-effects",
      severity: "advisory",
      status: "pass",
      message: "Dry-run or fixture mode denies external effects."
    });
  }
  if (request.budget.maxAttempts > 1) {
    result.push({
      riskId: "risk.retry-budget",
      severity: "advisory",
      status: "info",
      message: `The preview includes up to ${request.budget.maxAttempts} attempts in the budget view.`
    });
  }
  return result;
}

export function createExecutionPreview(request, resolutionPlan, options = {}) {
  if (!isObject(options)) fail("OPTIONS_INVALID", "Execution preview options must be an object");
  assertSemantic(request, "ExecutionRequest");
  assertSemantic(resolutionPlan, "CapabilityResolutionPlan");
  const requestRefInput = options.executionRequestRef;
  const resolutionRefInput = options.capabilityResolutionPlanRef;
  if (!exactRef(requestRefInput, [REQUEST_KIND])) fail("REQUEST_REF_INVALID", "executionRequestRef must be exact", "/executionRequestRef");
  if (!exactRef(resolutionRefInput, [RESOLUTION_KIND])) fail("RESOLUTION_REF_INVALID", "capabilityResolutionPlanRef must be exact", "/capabilityResolutionPlanRef");
  const requestRef = assertPayloadRef(request, REQUEST_KIND, "requestId", requestRefInput, "ExecutionRequest");
  const resolutionRef = assertPayloadRef(resolutionPlan, RESOLUTION_KIND, "resolutionPlanId", resolutionRefInput, "CapabilityResolutionPlan");
  const descriptor = options.adapterDescriptor;
  const capability = options.capabilityProfile;
  assertSemantic(capability, "CapabilityProfile");
  assertSemantic(descriptor, "AdapterDescriptor", { capabilityProfile: capability });
  const descriptorRef = assertPayloadRef(descriptor, ADAPTER_KIND, "adapterId", request.adapterDescriptorRef, "AdapterDescriptor");
  const capabilityRef = assertPayloadRef(capability, CAPABILITY_KIND, "profileId", request.capabilityProfileRef, "CapabilityProfile");
  if (!sameRef(descriptor.capabilityProfileRef, capabilityRef)) fail("ADAPTER_PROFILE_MISMATCH", "AdapterDescriptor does not bind the exact CapabilityProfile");
  if (resolutionPlan.selection.status === "selected") {
    if (!sameRef(resolutionPlan.selection.selectedAdapterDescriptorRef, descriptorRef) || !sameRef(resolutionPlan.selection.selectedCapabilityProfileRef, capabilityRef)) {
      fail("RESOLUTION_REQUEST_MISMATCH", "Selected capability resolution does not match the exact ExecutionRequest refs");
    }
  }
  if (resolutionPlan.request.operationId !== request.operationId || resolutionPlan.request.executionMode !== request.executionMode) {
    fail("RESOLUTION_REQUEST_MISMATCH", "Capability resolution operation and execution mode do not match the exact ExecutionRequest");
  }
  const cost = costEstimate(request, descriptor, options);
  const riskSummary = risks(request, resolutionPlan, cost);
  const hasBlock = riskSummary.some((risk) => risk.status === "block");
  const hasReview = riskSummary.some((risk) => risk.status === "review");
  const status = hasBlock ? "blocked" : hasReview ? "needs_review" : "ready";
  const renderMode = request.renderMode ?? resolutionPlan.request.renderMode ?? "generate";
  const summary = {
    operationId: request.operationId,
    executionMode: request.executionMode,
    renderMode,
    mediaKind: request.outputRequest.mediaKind,
    variantCount: request.outputRequest.variantCount,
    inputCount: request.inputArtifactRefs.length,
    currency: request.budget.currency,
    maxAmount: request.budget.maxAmount,
    maxAttempts: request.budget.maxAttempts,
    maxWallSeconds: request.budget.maxWallSeconds
  };
  if (summary.currency !== cost.currency) fail("COST_CURRENCY_MISMATCH", "ExecutionRequest budget currency and AdapterDescriptor cost currency differ");
  const explicitId = options.previewId;
  const identity = { requestRef, resolutionRef, descriptorRef, capabilityRef, summary, cost, status };
  const previewId = explicitId ?? `execution-preview.${sha256Canonical(identity).slice(7, 39)}`;
  if (typeof previewId !== "string" || !identifierPattern.test(previewId)) fail("PREVIEW_ID_INVALID", "previewId must be a stable identifier", "/previewId");
  const createdAt = assertDate(options.createdAt ?? request.createdAt, "/createdAt");
  const skillReceipt = clone(options.skillReceipt ?? request.skillReceipt ?? capability.skillReceipt);
  if (!isObject(skillReceipt)) fail("SKILL_RECEIPT_MISSING", "Execution preview needs a loaded Skill receipt");
  const preview = {
    kind: PREVIEW_KIND,
    contractVersion: "2.5.0",
    previewId,
    version: options.version ?? 1,
    status,
    executionRequestRef: requestRef,
    capabilityResolutionPlanRef: resolutionRef,
    adapterDescriptorRef: descriptorRef,
    capabilityProfileRef: capabilityRef,
    requestSummary: summary,
    requirementsSummary: requirementSummary(resolutionPlan),
    costEstimate: cost,
    riskSummary,
    approval: {
      required: true,
      status: "pending",
      scope: request.executionMode === "external" ? "exact_execution_request" : "none",
      action: "approve_exact_request"
    },
    executionBoundary: {
      providerNeutral: true,
      generatesMedia: false,
      executesAdapter: false,
      mutatesCanon: false,
      writesFiles: false,
      humanApprovalRequired: true,
      notes: "Execution Preview 只展示 exact request、能力、预算和风险；它不批准、不调用 adapter、不写媒体。"
    },
    validation: {
      exactRequestRef: true,
      exactResolutionRef: true,
      selectedAdapterMatches: resolutionPlan.selection.status !== "selected" || (sameRef(resolutionPlan.selection.selectedAdapterDescriptorRef, descriptorRef) && sameRef(resolutionPlan.selection.selectedCapabilityProfileRef, capabilityRef)),
      hardConstraintsVisible: true,
      // The preview exposes an explicit `unknown` state as visible information;
      // the separate cost/budget risks still block execution when no estimate exists.
      costVisible: true,
      approvalPending: true,
      noExecution: true
    },
    skillReceipt,
    provenance: {
      source: "codex_authored",
      createdAt,
      updatedAt: createdAt,
      parentId: request.requestId,
      changeLog: ["v1: expose exact execution budget, capability risks and pending approval before adapter spend"]
    }
  };
  if (!Number.isSafeInteger(preview.version) || preview.version < 1) fail("PREVIEW_VERSION_INVALID", "preview version must be a positive safe integer", "/version");
  const errors = validateByKind(preview, { executionRequest: request, capabilityResolutionPlan: resolutionPlan });
  if (errors.length) fail("PREVIEW_SEMANTICS_INVALID", errors.join("; "), null, { errors });
  return deepFreeze(preview);
}
