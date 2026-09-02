import { executeRequest } from "../../cineweave-runtime/src/adapter-runtime.mjs";
import {
  findArtifact,
  findArtifactByVersion,
  listArtifacts,
  putArtifact
} from "../../cineweave-runtime/src/artifact-store.mjs";
import { canonicalize, parseJsonStrict, sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, IDENTIFIER_PATTERN } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";
import { verifyProductionSlice } from "./production.mjs";

/**
 * The World OS owns the causal/production binding. The generic CineWeave
 * runtime owns adapter execution and media receipts. This module is the
 * narrow bridge between those two boundaries.
 *
 * It never accepts provider URLs, credentials or raw prompt text as an
 * execution parameter. A ProductionSlice is bound through exact immutable
 * input refs; the adapter runtime then performs its own preflight and receipt
 * checks again before any adapter call.
 */

export const PRODUCTION_EXECUTION_REQUEST_KIND = "cineweave_execution_request";
export const PRODUCTION_RENDER_PLAN_KIND = "cineweave_codex_render_plan";
export const PRODUCTION_PROMPT_KINDS = Object.freeze([
  "cineweave_codex_prompt_record",
  "cineweave_codex_image_prompt"
]);

const EXECUTION_MODES = new Set(["dry_run", "fixture", "external"]);
const MEDIA_KINDS = new Set(["image", "video"]);
const RENDER_MODES = new Set(["generate", "edit", "inpaint", "multi_reference"]);
const QUALITY_BUDGETS = new Set(["draft", "explore", "final"]);
const RENDER_CAPABILITIES = new Set([
  "native_image_generation",
  "multi_reference",
  "mask_inpaint",
  "exact_text",
  "high_resolution",
  "transparent_background",
  "identity_consistency",
  "pose_guidance",
  "scene_layout_guidance",
  "material_consistency",
  "lighting_consistency"
]);
const CANVAS_SIZE_CLASSES = new Set(["square", "portrait", "landscape", "wide", "tall", "custom", "unspecified"]);
const SAFE_PARAMETER_NAME = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const SAFE_PARAMETER_VALUE = /(?:https?:\/\/|file:|[?&](?:token|signature|sig|expires)=)/i;
const SENSITIVE_PARAMETER_NAME = /(?:api.?key|token|secret|password|credential|endpoint|signed.?url|url)/i;

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return new Date(value).toISOString();
}

function assertIdentifier(value, label) {
  if (!IDENTIFIER_PATTERN.test(value || "")) throw new TypeError(`${label} is invalid`);
  return value;
}

function assertExactArtifactRef(value, label) {
  if (!isExactRef(value)) throw new TypeError(`${label} must be an exact artifact reference`);
  return value;
}

function sourceRefFromSnapshot(snapshot) {
  return {
    kind: snapshot.contractKind,
    id: snapshot.sourceContractId,
    version: snapshot.sourceContractVersion,
    contentHash: snapshot.sourceContractHash
  };
}

function snapshotDocument(snapshot) {
  let document;
  try { document = parseJsonStrict(snapshot.documentJson); } catch { throw new Error(`Production snapshot ${snapshot.snapshotId} contains invalid JSON`); }
  if (!isPlainObject(document)) throw new Error(`Production snapshot ${snapshot.snapshotId} does not contain an object document`);
  return document;
}

function allSnapshotRefs(slice) {
  const refs = [];
  for (const value of Object.values(slice.contractRefs)) {
    for (const ref of Array.isArray(value) ? value : [value]) refs.push(ref);
  }
  return refs;
}

function uniqueRefs(refs) {
  const seen = new Set();
  const result = [];
  for (const ref of refs) {
    const key = canonicalize(ref);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ref);
  }
  return result;
}

function sourceSnapshots(verified, kind) {
  return verified.snapshots
    .filter((snapshot) => snapshot.contractKind === kind)
    .sort((left, right) => left.sourceContractId.localeCompare(right.sourceContractId));
}

function chooseSnapshot(verified, kind, options = {}) {
  const matches = sourceSnapshots(verified, kind);
  if (!matches.length) throw new Error(`ProductionSlice has no ${kind} snapshot`);
  if (options.ref) {
    const exact = assertExactArtifactRef(options.ref, `${kind} ref`);
    const found = matches.find((snapshot) => sameRef(sourceRefFromSnapshot(snapshot), exact));
    if (!found) throw new Error(`${kind} ref is not bound by the exact ProductionSlice`);
    return found;
  }
  const index = options.index === undefined ? 0 : Number(options.index);
  if (!Number.isSafeInteger(index) || index < 0 || index >= matches.length) throw new TypeError(`${kind} index is out of range`);
  return matches[index];
}

function validateSkillReceipt(value, label = "skillReceipt") {
  if (!isPlainObject(value)) throw new TypeError(`${label} is required`);
  for (const key of ["repository", "ref", "commit", "installedBy", "usedAt"]) {
    if (typeof value[key] !== "string" || !value[key].trim()) throw new TypeError(`${label}.${key} is required`);
  }
  if (value.installedBy !== "codex-environment") throw new TypeError(`${label}.installedBy must be codex-environment`);
  assertDate(value.usedAt, `${label}.usedAt`);
  const receipt = {
    repository: value.repository,
    ref: value.ref,
    commit: value.commit,
    installedBy: value.installedBy,
    usedAt: new Date(value.usedAt).toISOString()
  };
  for (const key of ["contentHash", "environmentId"]) if (value[key] !== undefined) receipt[key] = value[key];
  return receipt;
}

function validateOutputRequest(input = {}) {
  if (!isPlainObject(input)) throw new TypeError("outputRequest must be an object");
  const mediaKind = input.mediaKind === undefined ? "image" : input.mediaKind;
  if (!MEDIA_KINDS.has(mediaKind)) throw new TypeError("outputRequest.mediaKind is invalid");
  const acceptedMimeTypes = input.acceptedMimeTypes === undefined ? (mediaKind === "image" ? ["image/png"] : ["video/mp4"]) : input.acceptedMimeTypes;
  if (!Array.isArray(acceptedMimeTypes) || !acceptedMimeTypes.length || acceptedMimeTypes.length > 12 || new Set(acceptedMimeTypes).size !== acceptedMimeTypes.length) {
    throw new TypeError("outputRequest.acceptedMimeTypes must be a unique non-empty array");
  }
  for (const mime of acceptedMimeTypes) if (typeof mime !== "string" || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/.test(mime)) throw new TypeError(`Invalid output MIME type: ${mime}`);
  const variantCount = input.variantCount === undefined ? 1 : Number(input.variantCount);
  if (!Number.isSafeInteger(variantCount) || variantCount < 1 || variantCount > 12) throw new TypeError("outputRequest.variantCount must be between 1 and 12 for a RenderPlan");
  return { mediaKind, acceptedMimeTypes: [...acceptedMimeTypes], variantCount, destinationPolicy: "project_execution_store" };
}

function validateBudget(input = {}) {
  if (!isPlainObject(input)) throw new TypeError("budget must be an object");
  const currency = input.currency === undefined ? "USD" : input.currency;
  if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError("budget.currency must be an ISO-4217-style uppercase code");
  const maxAmount = input.maxAmount === undefined ? 0 : Number(input.maxAmount);
  const maxAttempts = input.maxAttempts === undefined ? 1 : Number(input.maxAttempts);
  const maxWallSeconds = input.maxWallSeconds === undefined ? 300 : Number(input.maxWallSeconds);
  if (!Number.isFinite(maxAmount) || maxAmount < 0) throw new TypeError("budget.maxAmount must be a non-negative finite number");
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 8) throw new TypeError("budget.maxAttempts must be between 1 and 8");
  if (!Number.isSafeInteger(maxWallSeconds) || maxWallSeconds < 1 || maxWallSeconds > 86400) throw new TypeError("budget.maxWallSeconds must be between 1 and 86400");
  return { currency, maxAmount, maxAttempts, maxWallSeconds, unknownCostAction: "block" };
}

function validateParameters(input = []) {
  if (!Array.isArray(input) || input.length > 48) throw new TypeError("parameters must contain at most 48 entries");
  const names = new Set();
  const parameters = input.map((item) => {
    if (!isPlainObject(item) || !SAFE_PARAMETER_NAME.test(item.name || "") || names.has(item.name)) throw new TypeError("Execution parameters must have unique safe names");
    names.add(item.name);
    if (item.sensitive !== false || SENSITIVE_PARAMETER_NAME.test(item.name)) throw new TypeError(`Sensitive execution parameter is forbidden: ${item.name}`);
    if (!["string", "number", "boolean"].includes(typeof item.value) && item.value !== null) throw new TypeError(`Execution parameter ${item.name} has an unsupported value type`);
    if (typeof item.value === "string" && (item.value.length > 1600 || SAFE_PARAMETER_VALUE.test(item.value))) throw new TypeError(`Unsafe execution parameter value: ${item.name}`);
    if (typeof item.value === "number" && !Number.isFinite(item.value)) throw new TypeError(`Execution parameter ${item.name} must be finite`);
    return { name: item.name, value: item.value, sensitive: false };
  });
  return parameters;
}

function capabilitySatisfies(capability, operation) {
  const declared = new Map((capability?.capabilities || []).map((item) => [item?.capabilityId, item?.support]));
  return (operation?.requiredCapabilityIds || []).every((id) => {
    const support = declared.get(id);
    return support && support !== "unsupported";
  });
}

function operationSupports(descriptor, operationId, outputRequest, inputCount, executionMode, renderMode) {
  const operation = descriptor?.operations?.find((item) => item.operationId === operationId);
  if (!operation) return { supported: false, operation: null };
  const supported = (descriptor.executionModes || []).includes(executionMode)
    && (operation.requestModes || []).includes(renderMode)
    && (operation.mediaKinds || []).includes(outputRequest.mediaKind)
    && Number.isSafeInteger(operation.maxOutputs) && outputRequest.variantCount <= operation.maxOutputs
    && Number.isSafeInteger(operation.maxInputs) && inputCount <= operation.maxInputs
    && outputRequest.acceptedMimeTypes.every((mime) => (operation.outputMimeTypes || []).includes(mime));
  return { supported, operation };
}

function rightsGateApproved(slice) {
  return slice.stage === "qa_pending" || slice.stage === "approved_asset" || slice.stage === "released";
}

function executionStageAllowed(slice, executionMode) {
  if (executionMode === "dry_run") return ["shot_bound", "qa_pending"].includes(slice.stage);
  return slice.stage === "qa_pending";
}

async function ensureSourceArtifact(projectRoot, snapshot, createdAt) {
  const document = snapshotDocument(snapshot);
  const sourceRef = sourceRefFromSnapshot(snapshot);
  const existing = await findArtifactByVersion(projectRoot, sourceRef.kind, sourceRef.id, sourceRef.version);
  if (existing && !sameRef(existing.envelope.artifactRef, sourceRef)) throw new Error(`Source contract version conflict: ${sourceRef.kind}/${sourceRef.id}@${sourceRef.version}`);
  const stored = existing || await putArtifact(projectRoot, document, {
    kind: sourceRef.kind,
    id: sourceRef.id,
    version: sourceRef.version,
    status: "candidate",
    createdAt,
    createdBy: "codex.root"
  });
  if (!sameRef(stored.envelope.artifactRef, sourceRef)) throw new Error(`Source contract hash mismatch for ${sourceRef.kind}/${sourceRef.id}`);
  return stored.envelope.artifactRef;
}

function buildRenderPlan(slice, sliceRef, promptSnapshot, shotSnapshot, promptRef, recipeRef, options, skillReceipt, rightsResolved, createdAt) {
  const outputRequest = options.outputRequest;
  const renderMode = options.renderMode === undefined ? "generate" : options.renderMode;
  if (!RENDER_MODES.has(renderMode)) throw new TypeError("renderMode is invalid");
  const qualityBudget = options.qualityBudget === undefined ? "explore" : options.qualityBudget;
  if (!QUALITY_BUDGETS.has(qualityBudget)) throw new TypeError("qualityBudget is invalid");
  const canvasInput = options.canvas === undefined ? { aspectRatio: "16:9", sizeClass: "wide", pixelDimensions: "1536x864" } : options.canvas;
  if (!isPlainObject(canvasInput)
    || !/^[1-9][0-9]*:[1-9][0-9]*$/.test(canvasInput.aspectRatio || "")
    || !CANVAS_SIZE_CLASSES.has(canvasInput.sizeClass)
    || (canvasInput.pixelDimensions !== undefined && !/^[1-9][0-9]*x[1-9][0-9]*$/.test(canvasInput.pixelDimensions))) {
    throw new TypeError("canvas must contain a valid aspectRatio, sizeClass and optional pixelDimensions");
  }
  const canvas = { aspectRatio: canvasInput.aspectRatio, sizeClass: canvasInput.sizeClass };
  if (canvasInput.pixelDimensions !== undefined) canvas.pixelDimensions = canvasInput.pixelDimensions;
  const requiredCapabilities = options.requiredCapabilities === undefined ? [] : options.requiredCapabilities;
  if (!Array.isArray(requiredCapabilities) || requiredCapabilities.length > 8 || new Set(requiredCapabilities).size !== requiredCapabilities.length
    || requiredCapabilities.some((capability) => !RENDER_CAPABILITIES.has(capability))) throw new TypeError("requiredCapabilities contains an unsupported value");
  const sourceShotRef = sourceRefFromSnapshot(shotSnapshot);
  const observationId = `obs.production.${sliceRef.contentHash.slice(7, 19)}`;
  const renderPlanIdentity = {
    contractVersion: "2.5.0",
    sliceRef,
    promptRef,
    shotRef: sourceShotRef,
    assetRecipeRef: recipeRef,
    mode: renderMode,
    outputRequest,
    qualityBudget,
    canvas
  };
  const renderPlanId = `render.production.${sha256Canonical(renderPlanIdentity).slice(7, 39)}`;
  const status = rightsResolved ? "approved" : "planned";
  const plan = {
    kind: PRODUCTION_RENDER_PLAN_KIND,
    contractVersion: "2.5.0",
    renderPlanId,
    version: 1,
    worldId: slice.worldId,
    shotId: sourceShotRef.id,
    proposalId: slice.sliceId,
    skillReceipt,
    mode: renderMode,
    promptRef,
    canvas,
    qualityBudget,
    variantCount: outputRequest.variantCount,
    inputs: [{
      observationId,
      role: "reference",
      preserve: ["exact ProductionSlice snapshot binding", "provider-neutral identity and geography constraints"],
      transformation: "Apply only the selected production task; do not rewrite World OS facts."
    }],
    requiredCapabilities,
    executionGate: { requiresHumanApproval: true, status },
    preflight: {
      status: rightsResolved ? "ready" : "blocked",
      checks: [
        { code: "production-slice-exact", status: "pass", message: `Bound to ${sliceRef.id}@${sliceRef.version}.` },
        { code: "rights-gate", status: rightsResolved ? "pass" : "fail", message: rightsResolved ? "Rights Gate is approved." : "Rights Gate is not approved; media execution is blocked." }
      ]
    },
    postflight: {
      requiredArtifacts: ["verified media bytes", "ExecutionReceipt", "QA evidence"],
      verify: ["output hash", "accepted MIME type", "project execution-store path", "no private URL export"],
      importStatus: "draft"
    },
    notes: `Codex compiled this provider-neutral RenderPlan from ProductionSlice ${slice.sliceId}; it does not grant public release.`,
    assetRecipeRef: recipeRef,
    recipeTaskIds: [slice.episodeId],
    capabilityProfileRef: options.capabilityProfileRef,
    licenseProfileRefs: options.licenseProfileRefs === undefined ? [] : options.licenseProfileRefs,
    provenance: {
      source: "codex_authored",
      createdAt,
      updatedAt: createdAt,
      parentId: slice.sliceId,
      changeLog: [
        `Compiled from exact ProductionSlice ${sliceRef.id}@${sliceRef.version}.`,
        "Preserves exact Prompt, AssetRecipe, CapabilityProfile and LicenseProfile references."
      ]
    }
  };
  if (plan.capabilityProfileRef === undefined) delete plan.capabilityProfileRef;
  return { renderPlanId, plan };
}

async function latestSliceRef(projectRoot, sliceId) {
  const items = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionSlice && item.envelope.payload.sliceId === sliceId)
    .sort((left, right) => right.envelope.payload.version - left.envelope.payload.version);
  return items[0]?.envelope.artifactRef || null;
}

/**
 * Compile a verified ProductionSlice into a generic ExecutionRequest.
 *
 * The returned request may be `blocked` when a Gate, capability, adapter
 * operation, budget or parameter preflight is incomplete. Blocked requests
 * are still persisted so the runtime can produce an auditable blocked receipt.
 */
export async function compileProductionExecutionRequest(projectRoot, sliceRef, options = {}) {
  const root = projectRoot;
  const verified = await verifyProductionSlice(root, assertExactArtifactRef(sliceRef, "sliceRef"));
  const slice = verified.slice;
  const exactSliceRef = verified.sliceRef;
  const executionMode = options.executionMode === undefined ? "dry_run" : options.executionMode;
  if (!EXECUTION_MODES.has(executionMode)) throw new TypeError("executionMode is invalid");
  const renderMode = options.renderMode === undefined ? "generate" : options.renderMode;
  if (!RENDER_MODES.has(renderMode)) throw new TypeError("renderMode is invalid");
  const createdAt = assertDate(options.createdAt === undefined ? slice.updatedAt : options.createdAt, "createdAt");
  const adapterDescriptorRef = assertExactArtifactRef(options.adapterDescriptorRef, "adapterDescriptorRef");
  if (adapterDescriptorRef.kind !== "cineweave_adapter_descriptor") throw new TypeError("adapterDescriptorRef must target an AdapterDescriptor");
  const capabilityProfileRef = assertExactArtifactRef(options.capabilityProfileRef, "capabilityProfileRef");
  if (capabilityProfileRef.kind !== "cineweave_codex_capability_profile") throw new TypeError("capabilityProfileRef must target a CapabilityProfile");
  const descriptorArtifact = await findArtifact(root, adapterDescriptorRef);
  const capabilityArtifact = await findArtifact(root, capabilityProfileRef);
  const descriptor = descriptorArtifact.envelope.payload;
  const capability = capabilityArtifact.envelope.payload;
  if (descriptor?.status !== "active") throw new Error("AdapterDescriptor must be active");
  if (!sameRef(descriptor.capabilityProfileRef, capabilityProfileRef)) throw new Error("AdapterDescriptor does not bind the supplied CapabilityProfile");
  if (descriptor.adapterId !== capability.adapterId) throw new Error("AdapterDescriptor and CapabilityProfile adapter IDs differ");

  const promptKind = options.promptKind === undefined ? (sourceSnapshots(verified, "cineweave_codex_prompt_record").length
    ? "cineweave_codex_prompt_record"
    : "cineweave_codex_image_prompt") : options.promptKind;
  const promptSnapshot = chooseSnapshot(verified, promptKind, {
    index: options.promptIndex,
    ref: options.promptRef
  });
  const shotSnapshot = chooseSnapshot(verified, "cineweave_codex_shot_spec", {
    index: options.shotIndex,
    ref: options.shotRef
  });
  const recipeSnapshot = chooseSnapshot(verified, "cineweave_codex_asset_recipe");
  const promptRef = await ensureSourceArtifact(root, promptSnapshot, createdAt);
  const recipeRef = await ensureSourceArtifact(root, recipeSnapshot, createdAt);
  const outputRequest = validateOutputRequest(options.outputRequest === undefined ? options : options.outputRequest);
  const budget = validateBudget(options.budget === undefined ? options : options.budget);
  const defaultParameters = [
    { name: "slice_id", value: slice.sliceId, sensitive: false },
    { name: "episode_id", value: slice.episodeId, sensitive: false },
    { name: "shot_id", value: sourceRefFromSnapshot(shotSnapshot).id, sensitive: false }
  ];
  const parameters = validateParameters(options.parameters === undefined ? defaultParameters : options.parameters);
  const inputArtifactRefs = uniqueRefs([exactSliceRef, ...allSnapshotRefs(slice)]);
  if (inputArtifactRefs.length > 64) throw new Error("ProductionSlice has too many exact inputs for an ExecutionRequest");
  const operationId = options.operationId === undefined ? descriptor.operations?.[0]?.operationId : options.operationId;
  assertIdentifier(operationId, "operationId");
  const rightsResolved = rightsGateApproved(slice);
  const stageAllowed = executionStageAllowed(slice, executionMode);
  const renderPlanData = buildRenderPlan(slice, exactSliceRef, promptSnapshot, shotSnapshot, promptRef, recipeRef, {
    ...options,
    renderMode,
    outputRequest,
    capabilityProfileRef,
    licenseProfileRefs: options.licenseProfileRefs === undefined ? (descriptor.licenseProfileRefs || []) : options.licenseProfileRefs
  }, validateSkillReceipt(options.skillReceipt === undefined ? descriptor.skillReceipt : options.skillReceipt), rightsResolved && stageAllowed, createdAt);
  const existingRenderPlan = await findArtifactByVersion(root, PRODUCTION_RENDER_PLAN_KIND, renderPlanData.renderPlanId, 1);
  const renderPlanArtifact = existingRenderPlan || await putArtifact(root, renderPlanData.plan, {
    kind: PRODUCTION_RENDER_PLAN_KIND,
    id: renderPlanData.renderPlanId,
    version: 1,
    status: rightsResolved && stageAllowed ? "approved" : "candidate",
    createdAt,
    createdBy: "codex.root"
  });
  const renderPlanRef = renderPlanArtifact.envelope.artifactRef;

  const operationCheck = operationSupports(descriptor, operationId, outputRequest, inputArtifactRefs.length, executionMode, renderMode);
  const hardCapabilitiesSatisfied = capabilitySatisfies(capability, operationCheck.operation);
  const parameterSafe = parameters.every((item) => !SENSITIVE_PARAMETER_NAME.test(item.name) && !(typeof item.value === "string" && SAFE_PARAMETER_VALUE.test(item.value)));
  const exactRefsResolved = true;
  const budgetResolved = budget.maxAmount >= 0 && budget.maxAttempts >= 1;
  const preflightChecks = {
    exactRefsResolved,
    operationSupported: operationCheck.supported,
    hardCapabilitiesSatisfied,
    rightsResolved: rightsResolved && stageAllowed,
    budgetResolved,
    secretsAbsent: parameterSafe
  };
  const ready = Object.values(preflightChecks).every(Boolean);
  const authorization = executionMode === "external"
    ? { externalEffects: "exact_request_approval_required", approvalScope: "exact_execution_request" }
    : { externalEffects: "denied", approvalScope: "none" };
  const requestIdentity = {
    sliceRef: exactSliceRef,
    adapterDescriptorRef,
    capabilityProfileRef,
    renderPlanRef,
    promptRef,
    operationId,
    executionMode,
    inputArtifactRefs,
    outputRequest,
    parameters,
    budget
  };
  const requestHash = sha256Canonical(requestIdentity).slice(7, 39);
  const requestId = `production-execution.${requestHash}`;
  const request = {
    kind: PRODUCTION_EXECUTION_REQUEST_KIND,
    contractVersion: "2.3.0",
    requestId,
    version: 1,
    status: ready ? "ready" : "blocked",
    createdAt,
    skillReceipt: validateSkillReceipt(options.skillReceipt === undefined ? descriptor.skillReceipt : options.skillReceipt),
    adapterDescriptorRef,
    capabilityProfileRef,
    renderPlanRef,
    promptRef,
    operationId,
    executionMode,
    idempotencyKey: `production:${requestHash}`,
    inputArtifactRefs,
    observationIds: [`obs.production.${exactSliceRef.contentHash.slice(7, 19)}`],
    parameters,
    outputRequest,
    budget,
    authorization,
    preflight: { status: ready ? "ready" : "blocked", ...preflightChecks },
    provenance: {
      source: "codex_authored",
      createdAt,
      updatedAt: createdAt,
      parentId: slice.sliceId,
      changeLog: ["v1: compile exact ProductionSlice inputs into a provider-neutral ExecutionRequest"]
    }
  };
  const existingRequest = await findArtifactByVersion(root, PRODUCTION_EXECUTION_REQUEST_KIND, requestId, 1);
  if (existingRequest && !sameRef(existingRequest.envelope.artifactRef, exactRef(PRODUCTION_EXECUTION_REQUEST_KIND, requestId, 1, request))) {
    throw new Error(`Production ExecutionRequest ${requestId} is immutable and already bound to different content`);
  }
  const stored = existingRequest || await putArtifact(root, request, {
    kind: PRODUCTION_EXECUTION_REQUEST_KIND,
    id: requestId,
    version: 1,
    status: request.status === "ready" ? "candidate" : "blocked",
    createdAt,
    createdBy: "codex.root"
  });
  return {
    request,
    requestRef: stored.envelope.artifactRef,
    renderPlanRef,
    promptRef,
    sliceRef: exactSliceRef,
    preflight: preflightChecks,
    ready,
    idempotent: Boolean(existingRequest)
  };
}

/**
 * Verify the binding immediately before adapter execution. A request must
 * point at the latest immutable slice version; this prevents a request made
 * for an older Gate state from being replayed after the slice changed.
 */
export async function verifyProductionExecutionRequest(projectRoot, requestRef, options = {}) {
  const exactRequestRef = assertExactArtifactRef(requestRef, "requestRef");
  if (exactRequestRef.kind !== PRODUCTION_EXECUTION_REQUEST_KIND) throw new TypeError("requestRef must target a CineWeave ExecutionRequest");
  const item = await findArtifact(projectRoot, exactRequestRef);
  const request = item.envelope.payload;
  if (request?.kind !== PRODUCTION_EXECUTION_REQUEST_KIND) throw new Error("Stored artifact is not an ExecutionRequest");
  const sliceRef = request.inputArtifactRefs?.find((ref) => ref.kind === ARTIFACT_KINDS.productionSlice);
  if (!sliceRef) throw new Error("ExecutionRequest is not bound to a ProductionSlice");
  const verified = await verifyProductionSlice(projectRoot, sliceRef);
  if (!Array.isArray(request.inputArtifactRefs) || new Set(request.inputArtifactRefs.map((ref) => canonicalize(ref))).size !== request.inputArtifactRefs.length) {
    throw new Error("ExecutionRequest input refs must be unique");
  }
  const expectedInputs = uniqueRefs([sliceRef, ...allSnapshotRefs(verified.slice)]);
  if (expectedInputs.some((expected) => !request.inputArtifactRefs.some((actual) => sameRef(actual, expected)))) {
    throw new Error("ExecutionRequest does not bind every exact ProductionSlice snapshot");
  }
  const latest = await latestSliceRef(projectRoot, verified.slice.sliceId);
  const stale = !latest || !sameRef(latest, sliceRef);
  if (stale && options.allowHistorical !== true) throw new Error("ExecutionRequest is bound to a stale ProductionSlice version");
  const promptSnapshot = sourceSnapshots(verified, request.promptRef?.kind)
    .find((snapshot) => sameRef(sourceRefFromSnapshot(snapshot), request.promptRef));
  if (!promptSnapshot || !sameRef(sourceRefFromSnapshot(promptSnapshot), request.promptRef)) throw new Error("ExecutionRequest promptRef is not bound to the exact ProductionSlice prompt snapshot");
  const renderPlan = (await findArtifact(projectRoot, request.renderPlanRef)).envelope.payload;
  if (renderPlan?.kind !== PRODUCTION_RENDER_PLAN_KIND || renderPlan.proposalId !== verified.slice.sliceId || renderPlan.worldId !== verified.slice.worldId) throw new Error("RenderPlan is not bound to the exact ProductionSlice");
  const executionEligible = executionStageAllowed(verified.slice, request.executionMode) && request.status === "ready";
  if (request.status === "ready" && !executionEligible && options.allowHistorical !== true) throw new Error(`ProductionSlice stage ${verified.slice.stage} is not eligible for ${request.executionMode} execution`);
  return { request, requestRef: exactRequestRef, slice: verified.slice, sliceRef, renderPlan, executionEligible, stale };
}

/**
 * Execute only a verified ProductionSlice-bound request. For a persisted
 * blocked request the generic runtime is intentionally still called so it
 * writes a blocked ExecutionReceipt instead of silently dropping the reason.
 */
export async function executeProductionRequest(projectRoot, requestRef, registry, options = {}) {
  const binding = await verifyProductionExecutionRequest(projectRoot, requestRef);
  const receipt = await executeRequest(projectRoot, binding.requestRef, registry, options);
  return { ...binding, receipt };
}

export async function listProductionExecutionRequests(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === PRODUCTION_EXECUTION_REQUEST_KIND)
    .filter((item) => !options.status || item.envelope.payload.status === options.status)
    .sort((left, right) => left.envelope.payload.requestId.localeCompare(right.envelope.payload.requestId));
  const result = [];
  for (const item of items) {
    if (options.worldId) {
      const sliceRef = item.envelope.payload.inputArtifactRefs?.find((ref) => ref.kind === ARTIFACT_KINDS.productionSlice);
      if (!sliceRef) continue;
      const slice = (await findArtifact(projectRoot, sliceRef)).envelope.payload;
      if (slice.worldId !== options.worldId) continue;
    }
    result.push({ request: item.envelope.payload, requestRef: item.envelope.artifactRef });
  }
  return result;
}
