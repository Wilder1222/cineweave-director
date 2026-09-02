import { sha256Canonical } from "./canonical-json.mjs";
import { validateByKind } from "../../../scripts/validate-contract-semantics.mjs";

const PLAN_KIND = "cineweave_codex_capability_resolution_plan";
const CAPABILITY_KIND = "cineweave_codex_capability_profile";
const ADAPTER_KIND = "cineweave_adapter_descriptor";
const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/u;
const contentHashPattern = /^sha256:[0-9a-f]{64}$/u;
const supportScores = Object.freeze({ strong: 1, partial: 0.6, experimental: 0.35, unsupported: 0, unknown: 0 });
const levelWeights = Object.freeze({ hard: 5, soft: 3, advisory: 1 });
const renderModes = new Set(["generate", "edit", "inpaint", "multi_reference"]);
const executionModes = new Set(["dry_run", "fixture", "external"]);
const mediaKinds = new Set(["image", "video"]);

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

function refKey(ref) {
  return `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
}

function validDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function fail(code, message, path = null, details = {}) {
  throw new CapabilityResolutionError(code, message, { path, ...details });
}

export class CapabilityResolutionError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CapabilityResolutionError";
    this.code = code;
    this.path = details.path || null;
    this.details = Object.freeze({ ...details });
  }
}

function assertDate(value, path) {
  if (!validDateTime(value)) fail("TIMESTAMP_INVALID", "Capability resolution timestamp must be a valid date-time", path);
  return new Date(value).toISOString();
}

function assertExactPayload(payload, kind, idField, label, versionOverride = undefined) {
  if (!isObject(payload) || payload.kind !== kind) fail("CANDIDATE_PAYLOAD_KIND_INVALID", `${label} has the wrong contract kind`);
  const errors = validateByKind(payload, kind === ADAPTER_KIND ? { capabilityProfile: null } : {});
  if (errors.length) fail("CANDIDATE_PAYLOAD_INVALID", `${label} failed semantic validation`, null, { errors });
  const ref = {
    kind,
    id: payload[idField],
    version: versionOverride ?? payload.version,
    contentHash: sha256Canonical(payload)
  };
  return ref;
}

function normalizeRequirement(item, index, prefix = "requirement") {
  if (!isObject(item)) fail("REQUIREMENT_INVALID", "Each capability requirement must be an object", `/requirements/${index}`);
  const capabilityId = item.capabilityId;
  if (typeof capabilityId !== "string" || !identifierPattern.test(capabilityId)) fail("REQUIREMENT_ID_INVALID", "Capability requirement needs a stable capabilityId", `/requirements/${index}/capabilityId`);
  const requirementId = item.requirementId ?? `${prefix}.${capabilityId}`;
  if (typeof requirementId !== "string" || !identifierPattern.test(requirementId)) fail("REQUIREMENT_ID_INVALID", "Capability requirement needs a stable requirementId", `/requirements/${index}/requirementId`);
  const level = item.level ?? "hard";
  if (!["hard", "soft", "advisory"].includes(level)) fail("REQUIREMENT_LEVEL_INVALID", "Capability requirement level is invalid", `/requirements/${index}/level`);
  const reason = item.reason ?? `Required capability: ${capabilityId}`;
  if (typeof reason !== "string" || reason.trim().length === 0 || reason.length > 800) fail("REQUIREMENT_REASON_INVALID", "Capability requirement reason must be bounded", `/requirements/${index}/reason`);
  return {
    requirementId,
    capabilityId,
    level,
    ...(item.scope === undefined ? {} : { scope: String(item.scope).slice(0, 160) }),
    reason: reason.trim()
  };
}

function normalizeRequest(input) {
  if (!isObject(input)) fail("REQUEST_INVALID", "Capability resolution request must be an object");
  const operationId = input.operationId;
  if (typeof operationId !== "string" || !identifierPattern.test(operationId)) fail("REQUEST_OPERATION_INVALID", "request.operationId must be a stable identifier", "/operationId");
  const renderMode = input.renderMode ?? "generate";
  if (!renderModes.has(renderMode)) fail("REQUEST_RENDER_MODE_INVALID", "request.renderMode is invalid", "/renderMode");
  const executionMode = input.executionMode ?? "dry_run";
  if (!executionModes.has(executionMode)) fail("REQUEST_EXECUTION_MODE_INVALID", "request.executionMode is invalid", "/executionMode");
  const mediaKind = input.mediaKind ?? "image";
  if (!mediaKinds.has(mediaKind)) fail("REQUEST_MEDIA_KIND_INVALID", "request.mediaKind is invalid", "/mediaKind");
  const inputCount = input.inputCount === undefined ? 0 : Number(input.inputCount);
  const outputCount = input.outputCount === undefined ? 1 : Number(input.outputCount);
  if (!Number.isSafeInteger(inputCount) || inputCount < 0 || inputCount > 64) fail("REQUEST_INPUT_COUNT_INVALID", "request.inputCount must be between 0 and 64", "/inputCount");
  if (!Number.isSafeInteger(outputCount) || outputCount < 1 || outputCount > 64) fail("REQUEST_OUTPUT_COUNT_INVALID", "request.outputCount must be between 1 and 64", "/outputCount");
  const acceptedMimeTypes = input.acceptedMimeTypes ?? (mediaKind === "image" ? ["image/png"] : ["video/mp4"]);
  if (!Array.isArray(acceptedMimeTypes) || acceptedMimeTypes.length < 1 || acceptedMimeTypes.length > 12 || new Set(acceptedMimeTypes).size !== acceptedMimeTypes.length) fail("REQUEST_MIME_INVALID", "request.acceptedMimeTypes must be unique and non-empty", "/acceptedMimeTypes");
  if (acceptedMimeTypes.some((mime) => typeof mime !== "string" || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/u.test(mime))) fail("REQUEST_MIME_INVALID", "request.acceptedMimeTypes contains an invalid MIME type", "/acceptedMimeTypes");
  const rawRequirements = input.requirements ?? (Array.isArray(input.requiredCapabilities)
    ? input.requiredCapabilities.map((capabilityId) => ({ capabilityId, level: "hard" }))
    : []);
  if (!Array.isArray(rawRequirements) || rawRequirements.length < 1 || rawRequirements.length > 32) fail("REQUEST_REQUIREMENTS_INVALID", "request.requirements must contain one to 32 items", "/requirements");
  const requirements = rawRequirements.map((item, index) => normalizeRequirement(item, index));
  if (new Set(requirements.map((item) => item.requirementId)).size !== requirements.length) fail("REQUIREMENT_DUPLICATE", "Capability requirement IDs must be unique", "/requirements");
  return { operationId, renderMode, executionMode, mediaKind, inputCount, outputCount, acceptedMimeTypes: [...acceptedMimeTypes], requirements };
}

function operationSupport(descriptor, request) {
  const operation = Array.isArray(descriptor.operations) ? descriptor.operations.find((item) => item?.operationId === request.operationId) : null;
  if (!operation) {
    return {
      operation: null,
      support: {
        operationId: request.operationId,
        status: "fail",
        executionMode: false,
        renderMode: false,
        mediaKind: false,
        inputCapacity: false,
        outputCapacity: false,
        mimeTypes: false,
        reason: `No operation ${request.operationId} is declared by this AdapterDescriptor.`
      }
    };
  }
  const checks = {
    executionMode: Array.isArray(descriptor.executionModes) && descriptor.executionModes.includes(request.executionMode),
    renderMode: Array.isArray(operation.requestModes) && operation.requestModes.includes(request.renderMode),
    mediaKind: Array.isArray(operation.mediaKinds) && operation.mediaKinds.includes(request.mediaKind),
    inputCapacity: Number.isSafeInteger(operation.maxInputs) && request.inputCount <= operation.maxInputs,
    outputCapacity: Number.isSafeInteger(operation.maxOutputs) && request.outputCount <= operation.maxOutputs,
    mimeTypes: Array.isArray(operation.outputMimeTypes) && request.acceptedMimeTypes.every((mime) => operation.outputMimeTypes.includes(mime))
  };
  const failed = Object.entries(checks).filter(([, value]) => !value).map(([key]) => key);
  return {
    operation,
    support: {
      operationId: request.operationId,
      status: failed.length ? "fail" : "pass",
      ...checks,
      reason: failed.length ? `Operation constraints failed: ${failed.join(", ")}.` : "Operation, mode, media, capacity and MIME constraints pass."
    }
  };
}

function operationRequirements(request, operation) {
  const requirements = [...request.requirements];
  const known = new Set(requirements.map((item) => item.capabilityId));
  for (const capabilityId of operation?.requiredCapabilityIds || []) {
    if (known.has(capabilityId)) continue;
    requirements.push({
      requirementId: `operation.${capabilityId}`,
      capabilityId,
      level: "hard",
      scope: "adapter_operation",
      reason: `The exact AdapterDescriptor declares ${capabilityId} for this operation.`
    });
    known.add(capabilityId);
  }
  return requirements;
}

function evaluateCapability(requirement, support, policy) {
  const score = supportScores[support] ?? 0;
  if (support === "strong") return { status: "pass", score, reason: "The candidate declares strong support." };
  if (support === "partial" || support === "experimental") {
    if (policy?.partialSupportPolicy === "block") return { status: "fail", score, reason: `The candidate declares ${support} support and its policy blocks partial support.` };
    if (requirement.level === "advisory") return { status: "warn", score, reason: `The candidate declares ${support} support for an advisory requirement.` };
    return { status: "review", score, reason: `The candidate declares ${support} support; human review is required before execution.` };
  }
  if (support === "unsupported") {
    if (requirement.level === "hard") return { status: "fail", score, reason: "The candidate explicitly declares this hard capability unsupported." };
    return { status: "review", score, reason: "The candidate does not support this capability; the non-hard tradeoff needs review." };
  }
  if (policy?.unknownCapabilityPolicy === "warn" && requirement.level !== "hard") return { status: "warn", score, reason: "The capability is absent from the profile and the profile permits an unknown-capability warning." };
  if (policy?.unknownCapabilityPolicy === "warn") return { status: "review", score, reason: "The capability is absent from the profile; a hard requirement cannot be assumed satisfied." };
  return { status: "fail", score, reason: "The capability is absent from the profile and unknown capabilities are blocked." };
}

function roundScore(value) {
  return Math.round(value * 100) / 100;
}

function evaluateCandidate(input, request) {
  if (!isObject(input)) fail("CANDIDATE_INVALID", "Each capability candidate must be an object");
  const profile = input.capabilityProfile;
  const descriptor = input.adapterDescriptor;
  const profileRefInput = input.capabilityProfileRef;
  const descriptorRefInput = input.adapterDescriptorRef;
  if (!exactRef(profileRefInput, [CAPABILITY_KIND])) fail("CAPABILITY_REF_INVALID", "candidate.capabilityProfileRef must be exact");
  if (!exactRef(descriptorRefInput, [ADAPTER_KIND])) fail("ADAPTER_REF_INVALID", "candidate.adapterDescriptorRef must be exact");
  const profileRef = assertExactPayload(profile, CAPABILITY_KIND, "profileId", "CapabilityProfile");
  const descriptorRef = assertExactPayload(descriptor, ADAPTER_KIND, "adapterId", "AdapterDescriptor", descriptorRefInput.version);
  if (!sameRef(profileRefInput, profileRef)) fail("CAPABILITY_REF_STALE", "CapabilityProfile ref does not match the supplied immutable payload");
  if (!sameRef(descriptorRefInput, descriptorRef)) fail("ADAPTER_REF_STALE", "AdapterDescriptor ref does not match the supplied immutable payload");
  if (!sameRef(descriptor.capabilityProfileRef, profileRef)) fail("ADAPTER_PROFILE_MISMATCH", "AdapterDescriptor must bind the exact supplied CapabilityProfile");
  if (descriptor.adapterId !== profile.adapterId) fail("ADAPTER_ID_MISMATCH", "AdapterDescriptor and CapabilityProfile adapter IDs differ");
  if (profile.status !== "active") fail("CAPABILITY_PROFILE_INACTIVE", "CapabilityProfile must be active for resolution");
  if (descriptor.status !== "active") fail("ADAPTER_INACTIVE", "AdapterDescriptor must be active for resolution");
  const candidateId = input.candidateId ?? `candidate.${descriptor.adapterId}.${profile.version}`;
  if (typeof candidateId !== "string" || !identifierPattern.test(candidateId)) fail("CANDIDATE_ID_INVALID", "candidateId must be a stable identifier");
  const operationResult = operationSupport(descriptor, request);
  const requirements = operationRequirements(request, operationResult.operation);
  const capabilityMap = new Map((profile.capabilities || []).map((item) => [item?.capabilityId, item?.support]));
  const capabilityResults = requirements.map((requirement) => {
    const support = capabilityMap.get(requirement.capabilityId) || "unknown";
    const result = evaluateCapability(requirement, support, profile.matchingPolicy);
    return {
      requirementId: requirement.requirementId,
      capabilityId: requirement.capabilityId,
      level: requirement.level,
      support,
      status: result.status,
      score: result.score,
      reason: result.reason
    };
  });
  const hardFailures = capabilityResults.filter((item) => item.level === "hard" && item.status === "fail").map((item) => `${item.requirementId}: ${item.reason}`);
  const warnings = capabilityResults.filter((item) => ["review", "warn"].includes(item.status)).map((item) => `${item.requirementId}: ${item.reason}`);
  if (operationResult.support.status === "fail") hardFailures.unshift(`operation: ${operationResult.support.reason}`);
  const totalWeight = capabilityResults.reduce((sum, item) => sum + (levelWeights[item.level] || 1), 0);
  const weightedSupport = capabilityResults.reduce((sum, item) => sum + item.score * (levelWeights[item.level] || 1), 0);
  const score = roundScore((operationResult.support.status === "pass" ? 100 : 0) * (totalWeight ? weightedSupport / totalWeight : 0));
  const status = hardFailures.length > 0 ? "blocked" : capabilityResults.some((item) => item.status === "review") ? "needs_review" : "eligible";
  const rationale = status === "blocked"
    ? `Blocked because ${hardFailures.slice(0, 3).join("; ")}`
    : status === "needs_review"
      ? `Review required because ${warnings.slice(0, 3).join("; ")}`
      : `Eligible with a deterministic capability score of ${score}.`;
  return {
    candidateId,
    capabilityProfileRef: clone(profileRefInput),
    adapterDescriptorRef: clone(descriptorRefInput),
    adapterId: descriptor.adapterId,
    operationSupport: operationResult.support,
    capabilityResults,
    score,
    status,
    hardFailures: [...new Set(hardFailures)],
    warnings: [...new Set(warnings)],
    rationale,
    profile,
    descriptor
  };
}

function timestampFor(request, candidates, options) {
  const timestamp = options.createdAt ?? request.createdAt ?? candidates[0]?.profile?.provenance?.updatedAt;
  return assertDate(timestamp, "/createdAt");
}

function skillReceiptFor(candidates, options) {
  const receipt = options.skillReceipt ?? candidates.find((candidate) => candidate.status !== "blocked")?.profile?.skillReceipt ?? candidates[0]?.profile?.skillReceipt;
  if (!isObject(receipt)) fail("SKILL_RECEIPT_MISSING", "Capability resolution needs an exact loaded Skill receipt");
  return clone(receipt);
}

export function resolveCapabilityPlan(requestInput, candidatesInput, options = {}) {
  const request = normalizeRequest(requestInput);
  if (!Array.isArray(candidatesInput) || candidatesInput.length < 1 || candidatesInput.length > 32) fail("CANDIDATES_INVALID", "Capability resolution requires one to 32 candidates", "/candidates");
  if (!isObject(options)) fail("OPTIONS_INVALID", "Capability resolution options must be an object");
  const candidates = candidatesInput.map((candidate) => evaluateCandidate(candidate, request));
  if (new Set(candidates.map((candidate) => candidate.candidateId)).size !== candidates.length) fail("CANDIDATE_DUPLICATE", "Capability candidate IDs must be unique");
  candidates.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  const ranked = [...candidates].sort((left, right) => right.score - left.score || left.adapterId.localeCompare(right.adapterId) || left.candidateId.localeCompare(right.candidateId));
  const eligible = ranked.filter((candidate) => candidate.status === "eligible");
  const selected = eligible[0] || null;
  const reviewCandidates = ranked.filter((candidate) => candidate.status === "needs_review");
  const status = selected ? "selected" : reviewCandidates.length ? "needs_review" : "blocked";
  const selectedCandidate = selected?.candidateId || null;
  for (const candidate of candidates) if (candidate.candidateId === selectedCandidate) candidate.status = "selected";
  const fallbackCandidateIds = ranked.filter((candidate) => candidate.candidateId !== selectedCandidate && candidate.status !== "blocked").slice(0, 16).map((candidate) => candidate.candidateId);
  const selectionRefs = selected ? {
    selectedCapabilityProfileRef: clone(selected.capabilityProfileRef),
    selectedAdapterDescriptorRef: clone(selected.adapterDescriptorRef)
  } : {
    selectedCapabilityProfileRef: null,
    selectedAdapterDescriptorRef: null
  };
  const hardConstraints = request.requirements.filter((item) => item.level === "hard").map((item) => `${item.requirementId}: ${item.reason}`);
  const tradeoffs = ranked.filter((candidate) => candidate.candidateId !== selectedCandidate).slice(0, 8).map((candidate) => `${candidate.candidateId} scored ${candidate.score} and is ${candidate.status}.`);
  const explanation = {
    primaryDecision: selected
      ? `Selected ${selected.adapterId} through ${selected.candidateId}; it is the highest deterministic eligible candidate after hard requirements.`
      : status === "needs_review"
        ? "No candidate is eligible without review; the highest-ranked partial or experimental candidate remains visible for human decision."
        : "No candidate satisfies the declared operation and hard capability requirements.",
    rankingPolicy: "Operation support is mandatory; capability support is weighted hard=5, soft=3, advisory=1, then tied by adapterId and candidateId. Partial, experimental and unknown support never silently becomes strong support.",
    hardConstraints,
    tradeoffs,
    fallbackCandidateIds
  };
  const createdAt = timestampFor(request, candidates, options);
  const version = options.version ?? 1;
  if (!Number.isSafeInteger(version) || version < 1) fail("PLAN_VERSION_INVALID", "Capability resolution version must be a positive safe integer", "/version");
  const identity = {
    request,
    candidates: candidates.map(({ profile, descriptor, ...candidate }) => candidate),
    selection: { status, selectedCandidateId: selectedCandidate, ...selectionRefs }
  };
  const explicitId = options.resolutionPlanId;
  const resolutionPlanId = explicitId === undefined
    ? `capability-resolution.${sha256Canonical(identity).slice(7, 39)}`
    : explicitId;
  if (typeof resolutionPlanId !== "string" || !identifierPattern.test(resolutionPlanId)) fail("PLAN_ID_INVALID", "resolutionPlanId must be a stable identifier", "/resolutionPlanId");
  const plan = {
    kind: PLAN_KIND,
    contractVersion: "2.5.0",
    resolutionPlanId,
    version,
    status,
    request,
    candidates: candidates.map(({ profile, descriptor, ...candidate }) => candidate),
    selection: {
      status,
      selectedCandidateId: selectedCandidate,
      ...selectionRefs,
      rationale: explanation.primaryDecision,
      humanApprovalRequired: true
    },
    explanation,
    executionBoundary: {
      providerNeutral: true,
      generatesMedia: false,
      executesAdapter: false,
      mutatesCanon: false,
      writesFiles: false,
      humanApprovalRequired: true,
      notes: "Capability Resolver 只比较 exact CapabilityProfile/AdapterDescriptor，不选择 Provider、不执行 adapter，也不授予审批。"
    },
    validation: {
      candidateRefsExact: true,
      descriptorBindingsExact: true,
      hardRequirementsBlock: true,
      rankingDeterministic: true,
      explanationPresent: true,
      noProviderSelection: true,
      noExecution: true
    },
    skillReceipt: skillReceiptFor(candidates, options),
    provenance: {
      source: "codex_authored",
      createdAt,
      updatedAt: createdAt,
      parentId: request.operationId,
      changeLog: ["v1: rank exact adapter capability candidates with explicit hard/soft/advisory explanations"]
    }
  };
  const errors = validateByKind(plan);
  if (errors.length) fail("PLAN_SEMANTICS_INVALID", errors.join("; "), null, { errors });
  return deepFreeze(plan);
}

export function createCapabilityResolver(candidates, options = {}) {
  if (!Array.isArray(candidates)) fail("CANDIDATES_INVALID", "Capability resolver candidates must be an array");
  return Object.freeze({
    resolve: (request) => resolveCapabilityPlan(request, candidates, options),
    candidateCount: candidates.length
  });
}
