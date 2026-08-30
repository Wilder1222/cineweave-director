import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve, sep } from "node:path";
import {
  RUNTIME_VERSION,
  claimIdempotency,
  findApprovalDecision,
  findArtifact,
  findArtifactByVersion,
  putArtifact
} from "./artifact-store.mjs";
import { sha256Bytes, sha256Canonical } from "./canonical-json.mjs";

const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const sensitiveNamePattern = /(?:api.?key|token|secret|password|credential|endpoint|signed.?url|url)/i;
const unsafeValuePattern = /(?:https?:\/\/|file:|[?&](?:token|signature|sig|expires)=)/i;

function sameRef(left, right) {
  return left?.kind === right?.kind && left?.id === right?.id && left?.version === right?.version && left?.contentHash === right?.contentHash;
}

function isoNow(now) {
  const value = now();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) throw new TypeError("Clock returned an invalid date");
  return date.toISOString();
}

function durationMs(startedAt, finishedAt) {
  return Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
}

function normalizeError(error, fallbackStage = "adapter") {
  const stage = ["preflight", "authorization", "adapter", "output_verification", "receipt_persistence"].includes(error?.stage) ? error.stage : fallbackStage;
  const rawCode = String(error?.code || "execution_failed").toLowerCase().replace(/[^a-z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "") || "execution_failed";
  return {
    stage,
    code: identifierPattern.test(rawCode) ? rawCode : "execution.failed",
    retryable: error?.retryable === true,
    message: String(error?.message || error || "Execution failed.").slice(0, 1200)
  };
}

function policyError(stage, code, message) {
  const error = new Error(message);
  error.stage = stage;
  error.code = code;
  error.retryable = false;
  return error;
}

export class AdapterExecutionError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "AdapterExecutionError";
    this.code = options.code || "adapter.failed";
    this.retryable = options.retryable === true;
    this.costAmount = options.costAmount;
    this.currency = options.currency;
    this.providerRequestId = options.providerRequestId || null;
  }
}

export function createAdapterRegistry(adapters = []) {
  const entries = new Map();
  const registry = Object.freeze({
    get(entrypointId) { return entries.get(entrypointId) || null; },
    list() { return [...entries.values()].map(({ entrypointId, implementationContentHash }) => ({ entrypointId, implementationContentHash })); }
  });
  for (const adapter of adapters) registerAdapter(registry, adapter, entries);
  return registry;
}

function registerAdapter(registry, adapter, providedEntries) {
  const entries = providedEntries;
  if (!entries) throw new TypeError("Adapters can only be registered while creating a registry");
  if (!identifierPattern.test(adapter?.entrypointId || "")) throw new TypeError("Adapter entrypointId is invalid");
  if (!/^sha256:[0-9a-f]{64}$/.test(adapter?.implementationContentHash || "")) throw new TypeError("Adapter implementationContentHash is invalid");
  if (typeof adapter?.execute !== "function") throw new TypeError("Adapter execute function is required");
  if (entries.has(adapter.entrypointId)) throw new Error(`Duplicate adapter entrypoint: ${adapter.entrypointId}`);
  entries.set(adapter.entrypointId, Object.freeze(adapter));
  return registry;
}

function validateRequestShape(request) {
  if (request?.kind !== "cineweave_execution_request") throw policyError("preflight", "request.kind", "Artifact is not an ExecutionRequest");
  if (request?.status !== "ready" || request?.preflight?.status !== "ready") throw policyError("preflight", "request.not_ready", "ExecutionRequest is not ready");
  for (const check of ["exactRefsResolved", "operationSupported", "hardCapabilitiesSatisfied", "rightsResolved", "budgetResolved", "secretsAbsent"]) {
    if (request?.preflight?.[check] !== true) throw policyError("preflight", `request.${check}`, `ExecutionRequest preflight failed: ${check}`);
  }
  const names = new Set();
  for (const parameter of request.parameters || []) {
    if (names.has(parameter.name)) throw policyError("preflight", "parameter.duplicate", `Duplicate parameter: ${parameter.name}`);
    names.add(parameter.name);
    if (parameter.sensitive !== false || sensitiveNamePattern.test(parameter.name || "")) throw policyError("preflight", "parameter.sensitive", `Sensitive parameter is forbidden: ${parameter.name}`);
    if (typeof parameter.value === "string" && unsafeValuePattern.test(parameter.value)) throw policyError("preflight", "parameter.external_value", `Endpoint or signed URL values are forbidden: ${parameter.name}`);
  }
  if (!Number.isInteger(request?.budget?.maxAttempts) || request.budget.maxAttempts < 1) throw policyError("preflight", "budget.attempts", "Attempt budget is invalid");
  if (!Number.isFinite(request?.budget?.maxAmount) || request.budget.maxAmount < 0) throw policyError("preflight", "budget.amount", "Cost budget is invalid");
  const binding = request.workflowTemplateBinding;
  if (binding) {
    if (request.preflight?.workflowTemplateResolved !== true) throw policyError("preflight", "template.not_resolved", "ExecutionRequest preflight failed: workflowTemplateResolved");
    if (!binding.templateProfileRef || typeof binding.templateProfileRef !== "object") throw policyError("preflight", "template.profile_ref", "Workflow template profile reference is required");
    if (!["serialized", "provider_managed"].includes(binding.mode)) throw policyError("preflight", "template.mode", "Workflow template binding mode is invalid");
    if (binding.mode === "serialized" && !/^sha256:[0-9a-f]{64}$/.test(binding.templateContentHash || "")) throw policyError("preflight", "template.content_hash", "Serialized workflow template requires a lowercase SHA-256 hash");
    if (binding.mode === "provider_managed" && binding.templateContentHash !== null) throw policyError("preflight", "template.content_hash", "Provider-managed workflow template must not claim a serialized hash");
    if (!Array.isArray(binding.inputBindings) || !identifierPattern.test(binding.outputSlotId || "")) throw policyError("preflight", "template.bindings", "Workflow template bindings are malformed");
  }
}

function assertReceiptFields(request) {
  const refs = ["adapterDescriptorRef", "capabilityProfileRef"];
  if (!request || typeof request !== "object" || Array.isArray(request)) throw new TypeError("ExecutionRequest payload must be an object");
  if (!/^[a-z0-9][a-z0-9._:-]{7,239}$/.test(request.idempotencyKey || "") || !identifierPattern.test(request.requestId || "")) throw new TypeError("Malformed ExecutionRequest cannot produce an auditable receipt");
  if (!["dry_run", "fixture", "external"].includes(request.executionMode)) throw new TypeError("Malformed ExecutionRequest cannot produce an auditable receipt");
  if (!refs.every((key) => request[key] && typeof request[key] === "object")) throw new TypeError("Malformed ExecutionRequest cannot produce an auditable receipt");
  if (!/^[A-Z]{3}$/.test(request?.budget?.currency || "")) throw new TypeError("Malformed ExecutionRequest cannot produce an auditable receipt");
}

async function resolveExecutionContext(projectRoot, request) {
  const descriptorArtifact = await findArtifact(projectRoot, request.adapterDescriptorRef);
  const capabilityArtifact = await findArtifact(projectRoot, request.capabilityProfileRef);
  await findArtifact(projectRoot, request.renderPlanRef);
  await findArtifact(projectRoot, request.promptRef);
  for (const ref of request.inputArtifactRefs || []) await findArtifact(projectRoot, ref);
  const descriptor = descriptorArtifact.envelope.payload;
  const capability = capabilityArtifact.envelope.payload;
  if (descriptor?.kind !== "cineweave_adapter_descriptor" || descriptor?.status !== "active") throw policyError("preflight", "adapter.inactive", "AdapterDescriptor is not active");
  if (!sameRef(descriptor.capabilityProfileRef, request.capabilityProfileRef)) throw policyError("preflight", "adapter.capability_ref", "AdapterDescriptor and ExecutionRequest bind different CapabilityProfiles");
  if (descriptor.adapterId !== capability.adapterId) throw policyError("preflight", "adapter.capability_id", "AdapterDescriptor and CapabilityProfile adapter IDs differ");
  if (!(descriptor.executionModes || []).includes(request.executionMode)) throw policyError("preflight", "adapter.mode", `Adapter does not support ${request.executionMode}`);
  const operation = descriptor.operations?.find((item) => item.operationId === request.operationId);
  if (!operation) throw policyError("preflight", "adapter.operation", `Adapter does not expose ${request.operationId}`);
  if (!(operation.mediaKinds || []).includes(request.outputRequest.mediaKind)) throw policyError("preflight", "adapter.media_kind", "Requested media kind is unsupported");
  if (request.outputRequest.variantCount > operation.maxOutputs) throw policyError("preflight", "adapter.output_count", "Requested variant count exceeds adapter limit");
  if ((request.inputArtifactRefs || []).length > operation.maxInputs) throw policyError("preflight", "adapter.input_count", "Input count exceeds adapter limit");
  for (const mime of request.outputRequest.acceptedMimeTypes || []) if (!(operation.outputMimeTypes || []).includes(mime)) throw policyError("preflight", "adapter.mime", `Unsupported output MIME type: ${mime}`);
  if (descriptor.costPolicy?.currency !== request.budget.currency) throw policyError("preflight", "budget.currency", "Adapter and request currencies differ");
  const workflowTemplate = await resolveWorkflowTemplateBinding(projectRoot, request, descriptor);
  return { descriptor, capability, operation, workflowTemplate };
}

async function resolveWorkflowTemplateBinding(projectRoot, request, descriptor) {
  const binding = request.workflowTemplateBinding;
  if (!binding) return null;
  const templateArtifact = await findArtifact(projectRoot, binding.templateProfileRef);
  const template = templateArtifact.envelope.payload;
  if (template?.kind !== "cineweave_codex_workflow_template_profile" || template?.status !== "active") {
    throw policyError("preflight", "template.inactive", "WorkflowTemplateProfile is not active");
  }
  if (template.adapterId !== descriptor.adapterId) throw policyError("preflight", "template.adapter_id", "WorkflowTemplateProfile and AdapterDescriptor adapter IDs differ");
  if (template.operationId !== request.operationId) throw policyError("preflight", "template.operation", "WorkflowTemplateProfile and ExecutionRequest operations differ");

  const identity = template.templateIdentity;
  if (!identity || typeof identity !== "object" || typeof identity.serializable !== "boolean") {
    throw policyError("preflight", "template.identity", "WorkflowTemplateProfile template identity is malformed");
  }
  const expectedMode = identity.serializable ? "serialized" : "provider_managed";
  if (binding.mode !== expectedMode) throw policyError("preflight", "template.mode", "WorkflowTemplateProfile and ExecutionRequest template modes differ");
  if (identity.serializable && binding.templateContentHash !== identity.contentHash) {
    throw policyError("preflight", "template.content_hash", "Workflow template content hash differs from the active profile");
  }
  if (!identity.serializable && binding.templateContentHash !== null) {
    throw policyError("preflight", "template.content_hash", "Provider-managed workflow template must not claim a serialized hash");
  }

  const slots = new Map();
  for (const slot of template.inputSlots || []) {
    if (!identifierPattern.test(slot?.slotId || "") || slots.has(slot.slotId)) throw policyError("preflight", "template.input_slots", "WorkflowTemplateProfile input slots are malformed");
    slots.set(slot.slotId, slot);
  }
  const boundSlots = new Set();
  for (const item of binding.inputBindings) {
    if (!identifierPattern.test(item?.slotId || "") || !item?.artifactRef || typeof item.artifactRef !== "object") {
      throw policyError("preflight", "template.input_binding", "Workflow template input binding is malformed");
    }
    if (boundSlots.has(item.slotId)) throw policyError("preflight", "template.input_duplicate", `Workflow template slot is bound more than once: ${item.slotId}`);
    const slot = slots.get(item.slotId);
    if (!slot) throw policyError("preflight", "template.input_slot", `Workflow template does not declare input slot: ${item.slotId}`);
    if (!(request.inputArtifactRefs || []).some((ref) => sameRef(ref, item.artifactRef))) {
      throw policyError("preflight", "template.input_ref", `Workflow template input is absent from inputArtifactRefs: ${item.slotId}`);
    }
    if (!(slot.acceptedArtifactKinds || []).includes(item.artifactRef.kind)) {
      throw policyError("preflight", "template.input_kind", `Workflow template input kind is unsupported for slot: ${item.slotId}`);
    }
    boundSlots.add(item.slotId);
  }
  for (const slot of slots.values()) {
    if (slot.required === true && !boundSlots.has(slot.slotId)) {
      throw policyError("preflight", "template.input_required", `Workflow template requires input slot: ${slot.slotId}`);
    }
  }

  const output = (template.outputSlots || []).find((slot) => slot?.slotId === binding.outputSlotId);
  if (!output) throw policyError("preflight", "template.output_slot", `Workflow template does not declare output slot: ${binding.outputSlotId}`);
  if (output.mediaKind !== request.outputRequest.mediaKind) throw policyError("preflight", "template.output_media_kind", "Workflow template output media kind differs from the request");
  for (const mime of request.outputRequest.acceptedMimeTypes || []) {
    if (!(output.acceptedMimeTypes || []).includes(mime)) throw policyError("preflight", "template.output_mime", `Workflow template output MIME is unsupported: ${mime}`);
  }
  for (const ref of template.licenseProfileRefs || []) await findArtifact(projectRoot, ref);
  return templateArtifact;
}

async function authorizationEvidence(projectRoot, requestRef, request, allowExternal) {
  if (request.executionMode !== "external") return { required: false, decision: "not_required", approvalRecordHash: null, exactRequestHashMatched: true };
  const decision = await findApprovalDecision(projectRoot, requestRef);
  const evidence = {
    required: true,
    decision: decision?.record?.decision || "missing",
    approvalRecordHash: decision?.record?.approvalHash || null,
    exactRequestHashMatched: Boolean(decision && sameRef(decision.record.artifactRef, requestRef))
  };
  if (request.authorization?.externalEffects !== "exact_request_approval_required" || request.authorization?.approvalScope !== "exact_execution_request") throw policyError("authorization", "approval.scope", "External request does not require exact-request approval");
  if (!decision) throw Object.assign(policyError("authorization", "approval.missing", "External execution lacks approval for the exact request"), { authorizationEvidence: evidence });
  if (decision.record.decision !== "approved") throw Object.assign(policyError("authorization", "approval.rejected", "The latest exact-request decision is rejected"), { authorizationEvidence: evidence });
  if (allowExternal !== true) throw Object.assign(policyError("authorization", "external.disabled", "Caller did not explicitly enable external effects"), { authorizationEvidence: evidence });
  return evidence;
}

function receiptIdFor(prefix, value) {
  return `${prefix}.${sha256Bytes(Buffer.from(value, "utf8")).slice(7, 31)}`;
}

function checkedProviderRequestId(value) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,239}$/.test(text)) throw policyError("adapter", "provider_request_id.unsafe", "Provider request ID contains unsafe characters");
  return text;
}

async function persistReceipt(projectRoot, receipt, receiptId) {
  return putArtifact(projectRoot, receipt, {
    kind: "cineweave_execution_receipt",
    id: receiptId,
    version: 1,
    status: "candidate",
    createdAt: receipt.timing.finishedAt,
    createdBy: "cineweave-adapter-runtime"
  });
}

async function persistBlockedReceipt(projectRoot, requestRef, request, startedAt, finishedAt, error, fallbackAuthorization, progress = {}) {
  const failure = normalizeError(error, "preflight");
  const id = receiptIdFor("receipt.blocked", `${requestRef.contentHash}:${failure.stage}:${failure.code}`);
  const existing = await findArtifactByVersion(projectRoot, "cineweave_execution_receipt", id, 1);
  if (existing) return existing;
  const evidence = error?.authorizationEvidence || fallbackAuthorization || {
    required: request.executionMode === "external",
    decision: request.executionMode === "external" ? "missing" : "not_required",
    approvalRecordHash: null,
    exactRequestHashMatched: request.executionMode !== "external"
  };
  const receipt = {
    kind: "cineweave_execution_receipt",
    contractVersion: "2.3.0",
    receiptId: id,
    runtimeVersion: RUNTIME_VERSION,
    status: "blocked",
    executionMode: request.executionMode,
    requestArtifactRef: requestRef,
    adapterDescriptorRef: request.adapterDescriptorRef,
    capabilityProfileRef: request.capabilityProfileRef,
    idempotencyKey: request.idempotencyKey,
    timing: { startedAt, finishedAt, durationMs: durationMs(startedAt, finishedAt) },
    authorizationEvidence: evidence,
    attempts: [],
    outputs: [],
    costSummary: { currency: request.budget.currency, estimatedAmount: null, actualAmount: 0, withinBudget: true, includesAllAttempts: true },
    failure,
    validation: {
      adapterMatched: progress.adapterMatched === true,
      requestHashMatched: true,
      inputsMatched: progress.contextResolved === true,
      outputHashesVerified: false,
      secretsAbsent: progress.requestValidated === true,
      externalSideEffectAuthorized: false
    }
  };
  return persistReceipt(projectRoot, receipt, id);
}

async function writeOutput(projectRoot, requestId, output, index, acceptedMimeTypes, expectedMediaKind) {
  if (!output || !Buffer.isBuffer(output.bytes) && !(output.bytes instanceof Uint8Array) && typeof output.bytes !== "string") throw policyError("output_verification", "output.bytes", "Adapter output bytes are missing");
  if (!acceptedMimeTypes.includes(output.mimeType)) throw policyError("output_verification", "output.mime", `Adapter returned unaccepted MIME type: ${output.mimeType}`);
  if (output.mediaKind !== expectedMediaKind) throw policyError("output_verification", "output.media_kind", "Adapter output media kind differs from the request");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(output.filename || "") || basename(output.filename) !== output.filename) throw policyError("output_verification", "output.filename", "Adapter output filename is unsafe");
  const bytes = Buffer.isBuffer(output.bytes) ? output.bytes : Buffer.from(output.bytes);
  const relativeRef = `executions/${requestId}/${output.filename}`;
  const storeRoot = resolve(projectRoot, ".cineweave");
  const outputPath = resolve(storeRoot, relativeRef);
  if (!outputPath.startsWith(`${storeRoot}${sep}`)) throw policyError("output_verification", "output.path", "Adapter output escapes the project execution store");
  await mkdir(resolve(storeRoot, "executions", requestId), { recursive: true });
  const hash = sha256Bytes(bytes);
  if (existsSync(outputPath)) {
    const existing = await readFile(outputPath);
    if (sha256Bytes(existing) !== hash) throw policyError("output_verification", "output.conflict", `Immutable execution output conflict: ${relativeRef}`);
  } else {
    await writeFile(outputPath, bytes, { flag: "wx" });
  }
  return {
    outputId: `output.${requestId}.${String(index + 1).padStart(2, "0")}`,
    mediaKind: output.mediaKind,
    mimeType: output.mimeType,
    byteLength: bytes.byteLength,
    contentHash: hash,
    storageRef: relativeRef,
    width: output.width ?? null,
    height: output.height ?? null,
    durationMs: output.durationMs ?? null
  };
}

export async function executeRequest(projectRoot, requestArtifactRef, registry, options = {}) {
  const now = options.now || (() => new Date());
  const requestArtifact = await findArtifact(projectRoot, requestArtifactRef);
  const requestRef = requestArtifact.envelope.artifactRef;
  const request = requestArtifact.envelope.payload;
  assertReceiptFields(request);
  const startedAt = isoNow(now);
  const progress = { requestValidated: false, contextResolved: false, adapterMatched: false };
  let context;
  let authorization;
  let adapter;
  let estimate = null;
  try {
    validateRequestShape(request);
    progress.requestValidated = true;
    context = await resolveExecutionContext(projectRoot, request);
    progress.contextResolved = true;
    adapter = registry?.get(context.descriptor.implementation.entrypointId);
    if (!adapter || adapter.implementationContentHash !== context.descriptor.implementation.contentHash) throw policyError("preflight", "adapter.implementation", "Trusted adapter implementation is missing or its hash differs");
    progress.adapterMatched = true;
    authorization = await authorizationEvidence(projectRoot, requestRef, request, options.allowExternal === true);
    if (typeof adapter.estimate === "function") estimate = await adapter.estimate({ request, descriptor: context.descriptor });
    if (!estimate || !Number.isFinite(estimate.amount) || estimate.amount < 0 || estimate.currency !== request.budget.currency) throw policyError("preflight", "cost.unknown", "Adapter did not provide a valid cost estimate");
    if (estimate.amount > request.budget.maxAmount) throw policyError("preflight", "cost.estimate_exceeds_budget", "Estimated cost exceeds request budget");
  } catch (error) {
    const finishedAt = isoNow(now);
    return persistBlockedReceipt(projectRoot, requestRef, request, startedAt, finishedAt, error, authorization, progress);
  }

  const receiptId = receiptIdFor("receipt.execution", `${request.idempotencyKey}:${requestRef.contentHash}`);
  await claimIdempotency(projectRoot, request.idempotencyKey, requestRef, { claimedAt: startedAt });
  const existing = await findArtifactByVersion(projectRoot, "cineweave_execution_receipt", receiptId, 1);
  if (existing) return existing;

  if (request.executionMode === "dry_run") {
    const finishedAt = isoNow(now);
    return persistReceipt(projectRoot, {
      kind: "cineweave_execution_receipt",
      contractVersion: "2.3.0",
      receiptId,
      runtimeVersion: RUNTIME_VERSION,
      status: "dry_run",
      executionMode: request.executionMode,
      requestArtifactRef: requestRef,
      adapterDescriptorRef: request.adapterDescriptorRef,
      capabilityProfileRef: request.capabilityProfileRef,
      idempotencyKey: request.idempotencyKey,
      timing: { startedAt, finishedAt, durationMs: durationMs(startedAt, finishedAt) },
      authorizationEvidence: authorization,
      attempts: [],
      outputs: [],
      costSummary: { currency: request.budget.currency, estimatedAmount: estimate.amount, actualAmount: 0, withinBudget: true, includesAllAttempts: true },
      failure: null,
      validation: { adapterMatched: true, requestHashMatched: true, inputsMatched: true, outputHashesVerified: true, secretsAbsent: true, externalSideEffectAuthorized: true }
    }, receiptId);
  }

  const attempts = [];
  const outputs = [];
  let actualAmount = 0;
  let failure = null;
  for (let number = 1; number <= request.budget.maxAttempts; number += 1) {
    const attemptStartedAt = isoNow(now);
    let reportedCost = 0;
    let costKnown = false;
    let providerRequestId = null;
    try {
      const result = await adapter.execute({ request, descriptor: context.descriptor, attempt: number, idempotencyKey: request.idempotencyKey });
      const costAmount = Number(result?.costAmount);
      if (!Number.isFinite(costAmount) || costAmount < 0 || result?.currency !== request.budget.currency) throw policyError("adapter", "cost.invalid", "Adapter returned invalid attempt cost");
      reportedCost = costAmount;
      costKnown = true;
      providerRequestId = checkedProviderRequestId(result.providerRequestId);
      actualAmount += costAmount;
      if (actualAmount > request.budget.maxAmount) throw policyError("adapter", "cost.budget_exceeded", "Actual cost exceeds request budget");
      if (!Array.isArray(result.outputs) || result.outputs.length !== request.outputRequest.variantCount) throw policyError("output_verification", "output.count", "Adapter output count differs from the request");
      const attemptOutputs = [];
      for (let index = 0; index < result.outputs.length; index += 1) attemptOutputs.push(await writeOutput(projectRoot, request.requestId, result.outputs[index], index, request.outputRequest.acceptedMimeTypes, request.outputRequest.mediaKind));
      const attemptFinishedAt = isoNow(now);
      attempts.push({ attempt: number, status: "succeeded", startedAt: attemptStartedAt, finishedAt: attemptFinishedAt, providerRequestId, retryReason: null, errorCode: null, costAmount, currency: result.currency });
      outputs.push(...attemptOutputs);
      failure = null;
      break;
    } catch (error) {
      const attemptFinishedAt = isoNow(now);
      const errorCost = Number(error?.costAmount);
      if (!costKnown && (!Number.isFinite(errorCost) || errorCost < 0 || error?.currency !== request.budget.currency)) {
        failure = normalizeError(policyError("adapter", "cost.unknown_after_attempt", "Failed attempt did not report a valid cost"));
        attempts.push({ attempt: number, status: "failed", startedAt: attemptStartedAt, finishedAt: attemptFinishedAt, providerRequestId, retryReason: null, errorCode: failure.code, costAmount: 0, currency: request.budget.currency });
        break;
      }
      if (!costKnown) {
        reportedCost = errorCost;
        providerRequestId = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,239}$/.test(String(error?.providerRequestId || "")) ? String(error.providerRequestId) : null;
        actualAmount += errorCost;
      }
      failure = normalizeError(error);
      const retry = error?.retryable === true && number < request.budget.maxAttempts && actualAmount <= request.budget.maxAmount;
      attempts.push({ attempt: number, status: "failed", startedAt: attemptStartedAt, finishedAt: attemptFinishedAt, providerRequestId, retryReason: retry ? failure.code : null, errorCode: failure.code, costAmount: reportedCost, currency: request.budget.currency });
      if (!retry) break;
    }
  }
  const finishedAt = isoNow(now);
  const succeeded = outputs.length === request.outputRequest.variantCount && !failure;
  const receipt = {
    kind: "cineweave_execution_receipt",
    contractVersion: "2.3.0",
    receiptId,
    runtimeVersion: RUNTIME_VERSION,
    status: succeeded ? "succeeded" : "failed",
    executionMode: request.executionMode,
    requestArtifactRef: requestRef,
    adapterDescriptorRef: request.adapterDescriptorRef,
    capabilityProfileRef: request.capabilityProfileRef,
    idempotencyKey: request.idempotencyKey,
    timing: { startedAt, finishedAt, durationMs: durationMs(startedAt, finishedAt) },
    authorizationEvidence: authorization,
    attempts,
    outputs,
    costSummary: { currency: request.budget.currency, estimatedAmount: estimate.amount, actualAmount, withinBudget: actualAmount <= request.budget.maxAmount, includesAllAttempts: true },
    failure: succeeded ? null : failure || { stage: "adapter", code: "adapter.no_output", retryable: false, message: "Adapter completed without the requested outputs." },
    validation: {
      adapterMatched: true,
      requestHashMatched: true,
      inputsMatched: true,
      outputHashesVerified: succeeded,
      secretsAbsent: true,
      externalSideEffectAuthorized: request.executionMode !== "external" || authorization.decision === "approved"
    }
  };
  return persistReceipt(projectRoot, receipt, receiptId);
}

export function executionRequestHash(request) {
  return sha256Canonical(request);
}
