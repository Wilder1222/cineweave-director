import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findApprovalDecision,
  findArtifact,
  findArtifactByVersion,
  putArtifact,
  readStrictJson,
} from "./artifact-store.mjs";
import { collectContractRefs } from "./artifact-graph.mjs";
import { canonicalize, sha256Canonical } from "./canonical-json.mjs";
import { validateByKind } from "../../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../../scripts/validate-output.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const CONTRACT_ROOT = resolve(REPO_ROOT, "packages", "cineweave-contracts");
const MANIFEST_PATH = resolve(CONTRACT_ROOT, "contracts", "manifest.json");
const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const contentHashPattern = /^sha256:[0-9a-f]{64}$/;
const repairKinds = new Set([
  "cineweave_codex_director_repair",
  "cineweave_codex_character_repair",
  "cineweave_codex_scene_repair",
  "cineweave_codex_prompt_repair",
]);
const promptTargetKinds = new Set([
  "cineweave_codex_prompt_record",
  "cineweave_codex_image_prompt",
]);
const identityFields = {
  cineweave_codex_character_spec: "characterId",
  cineweave_codex_scene_spec: "sceneId",
  cineweave_codex_action_sequence_spec: "actionSequenceId",
  cineweave_codex_shot_spec: "shotSpecId",
  cineweave_codex_shot_lighting_plan: "lightingPlanId",
  cineweave_codex_temporal_spec: "temporalSpecId",
  cineweave_codex_camera_previs_spec: "cameraPrevisSpecId",
  cineweave_codex_storyboard_sequence: "storyboardId",
  cineweave_codex_render_plan: "renderPlanId",
  cineweave_codex_prompt_record: "promptId",
};
const failureMessages = {
  "repair.plan_invalid":
    "The exact repair plan failed schema, identity or semantic preflight.",
  "repair.delegated":
    "The repair plan delegates ownership and cannot be executed by this runner.",
  "repair.plan_gate":
    "The repair plan does not carry an approved embedded execution gate.",
  "repair.approval_missing":
    "The exact repair plan has no approved runtime decision.",
  "repair.approval_rejected":
    "The latest exact runtime decision rejects the repair plan.",
  "repair.adapter_missing":
    "No explicitly registered local repair adapter is available.",
  "repair.adapter_kind":
    "The selected local repair adapter does not support this repair kind.",
  "repair.unsupported_target":
    "The repair target kind is outside the bounded repair runner surface.",
  "repair.target_missing":
    "The exact parent artifact is not present in the immutable project store.",
  "repair.target_integrity":
    "The exact parent artifact failed immutable store integrity checks.",
  "repair.target_invalid":
    "The exact parent artifact failed schema or semantic validation.",
  "repair.adapter_failed":
    "The registered local repair adapter failed without producing a candidate.",
  "repair.adapter_output":
    "The registered local repair adapter returned an invalid output envelope.",
  "repair.candidate_invalid":
    "The candidate changed an unrequested path or failed exact output validation.",
  "repair.candidate_version_conflict":
    "The next immutable candidate version is already occupied by another hash.",
  "repair.receipt_invalid":
    "The runner could not persist a schema-valid repair receipt.",
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isExactRef(value) {
  return (
    isObject(value) &&
    Object.keys(value).length === 4 &&
    typeof value.kind === "string" &&
    identifierPattern.test(value.kind) &&
    typeof value.id === "string" &&
    identifierPattern.test(value.id) &&
    Number.isSafeInteger(value.version) &&
    value.version >= 1 &&
    contentHashPattern.test(value.contentHash || "")
  );
}

function sameRef(left, right) {
  return (
    isExactRef(left) &&
    isExactRef(right) &&
    left.kind === right.kind &&
    left.id === right.id &&
    left.version === right.version &&
    left.contentHash === right.contentHash
  );
}

function refKey(ref) {
  return (
    String(ref.kind) +
    "/" +
    String(ref.id) +
    "@" +
    String(ref.version) +
    ":" +
    String(ref.contentHash)
  );
}

function exactRefFromCustom(value, idKey, kind) {
  if (
    !isObject(value) ||
    typeof value[idKey] !== "string" ||
    !identifierPattern.test(value[idKey])
  )
    return null;
  if (
    !Number.isSafeInteger(value.version) ||
    value.version < 1 ||
    !contentHashPattern.test(value.contentHash || "")
  )
    return null;
  return {
    kind,
    id: value[idKey],
    version: value.version,
    contentHash: value.contentHash,
  };
}

function truncate(value, max = 1600) {
  return (
    String(value || "")
      .trim()
      .slice(0, max) || "Not captured."
  );
}

function uniqueStrings(values) {
  return [
    ...new Set(
      values
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim()),
    ),
  ];
}

function safePreserve(plan) {
  const values = uniqueStrings(
    Array.isArray(plan?.preserve) ? plan.preserve : [],
  ).slice(0, 32);
  return values.length
    ? values.map((value) => truncate(value))
    : ["Preserve the immutable parent and all exact dependencies."];
}

function safeAcceptanceIds(plan) {
  const ids = [];
  if (Array.isArray(plan?.acceptanceChecks)) {
    for (const check of plan.acceptanceChecks) {
      const value = isObject(check) ? check.checkId : null;
      if (typeof value === "string" && identifierPattern.test(value))
        ids.push(value);
      else if (typeof check === "string" && ids.length < 12)
        ids.push("check.repair-" + String(ids.length + 1));
    }
  }
  const unique = uniqueStrings(ids)
    .filter((value) => identifierPattern.test(value))
    .slice(0, 12);
  return unique.length ? unique : ["check.repair-pending"];
}

function safeChange(planDetails) {
  return {
    variable: truncate(planDetails?.variable || "unresolved", 320),
    targetPath: truncate(planDetails?.targetPath || "unresolved", 500),
    requestedTargetState: truncate(
      planDetails?.requestedTargetState ||
        "No executable target state was captured.",
      1600,
    ),
  };
}

function isoNow(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new TypeError("Clock returned an invalid date");
  return date.toISOString();
}

function durationMs(startedAt, finishedAt) {
  return Math.max(0, Date.parse(finishedAt) - Date.parse(startedAt));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function cloneJson(value) {
  const clone = structuredClone(value);
  canonicalize(clone);
  return clone;
}

function decodePointerToken(value) {
  return String(value).replaceAll("~1", "/").replaceAll("~0", "~");
}

function pointerPath(segments) {
  if (!segments.length) return "/";
  return (
    "/" +
    segments
      .map((segment) =>
        String(segment).replaceAll("~", "~0").replaceAll("/", "~1"),
      )
      .join("/")
  );
}

function parsePath(value) {
  const source = String(value || "").trim();
  if (!source) return [];
  if (source.startsWith("/"))
    return source.slice(1).split("/").filter(Boolean).map(decodePointerToken);
  const segments = [];
  const tokens = source.replace(/\[([^\]]*)\]/g, ".$1").split(".");
  for (const token of tokens) {
    const trimmed = token.trim();
    if (trimmed) segments.push(trimmed);
  }
  return segments.map((segment) => (segment === "*" ? "*" : segment));
}

function parseTargetPath(value) {
  const source = String(value || "").trim();
  if (!source) return [];
  if (source.startsWith("/")) return parsePath(source);
  const segments = [];
  const matcher = /([^.[\]]+)|\[([^\]]*)\]/g;
  for (const match of source.matchAll(matcher)) {
    const token = match[1] ?? match[2];
    if (token)
      segments.push(
        /^\d+$/.test(token) || token === "*" ? token : match[2] ? "*" : token,
      );
  }
  return segments;
}

function pathsWithin(changedPath, targetPath) {
  const changed = parsePath(changedPath);
  const target = parseTargetPath(targetPath);
  if (!changed.length || !target.length || changed.length < target.length)
    return false;
  return target.every(
    (segment, index) => segment === "*" || segment === changed[index],
  );
}

function isIgnoredMetadataPath(path) {
  const segments = parsePath(path);
  return segments[0] === "version" || segments[0] === "provenance";
}

function equalJson(left, right) {
  try {
    return canonicalize(left) === canonicalize(right);
  } catch {
    return false;
  }
}

function diffPaths(before, after, segments = [], result = []) {
  if (equalJson(before, after)) return result;
  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      if (index >= before.length || index >= after.length)
        result.push(pointerPath([...segments, index]));
      else diffPaths(before[index], after[index], [...segments, index], result);
    }
    if (before.length !== after.length && !length)
      result.push(pointerPath(segments));
    return result;
  }
  if (isObject(before) && isObject(after)) {
    const keys = [
      ...new Set([...Object.keys(before), ...Object.keys(after)]),
    ].sort();
    for (const key of keys) {
      if (!Object.hasOwn(before, key) || !Object.hasOwn(after, key))
        result.push(pointerPath([...segments, key]));
      else diffPaths(before[key], after[key], [...segments, key], result);
    }
    return result;
  }
  result.push(pointerPath(segments));
  return result;
}

function normalizePlan(plan) {
  const common = {
    planKindValid: repairKinds.has(plan?.kind),
    direct: false,
    targetRef: null,
    variable: "unresolved",
    targetPath: "unresolved",
    requestedTargetState: "No executable target state was captured.",
    preserve: safePreserve(plan),
    acceptanceCheckIds: safeAcceptanceIds(plan),
    gateStatus: plan?.executionGate?.status || "not_present",
    requiresEmbeddedGate: plan?.kind !== "cineweave_codex_prompt_repair",
    delegated: false,
  };
  if (plan?.kind === "cineweave_codex_director_repair") {
    return {
      ...common,
      direct: plan.disposition === "repair",
      delegated: plan.disposition === "delegate",
      targetRef: isExactRef(plan.targetRef) ? plan.targetRef : null,
      variable: plan.change?.variable || "unresolved",
      targetPath: plan.change?.targetPath || "unresolved",
      requestedTargetState:
        plan.change?.targetState || common.requestedTargetState,
    };
  }
  if (plan?.kind === "cineweave_codex_character_repair") {
    return {
      ...common,
      direct: true,
      targetRef: exactRefFromCustom(
        plan.characterSpecRef,
        "characterId",
        "cineweave_codex_character_spec",
      ),
      variable: plan.failure?.category || "unresolved",
      targetPath: plan.change?.targetPath || "unresolved",
      requestedTargetState:
        plan.change?.targetState || common.requestedTargetState,
    };
  }
  if (plan?.kind === "cineweave_codex_scene_repair") {
    return {
      ...common,
      direct: true,
      targetRef: exactRefFromCustom(
        plan.sceneSpecRef,
        "sceneId",
        "cineweave_codex_scene_spec",
      ),
      variable: plan.failure?.category || "unresolved",
      targetPath: plan.change?.targetPath || "unresolved",
      requestedTargetState:
        plan.change?.targetState || common.requestedTargetState,
    };
  }
  if (plan?.kind === "cineweave_codex_prompt_repair") {
    return {
      ...common,
      direct: true,
      targetRef: isExactRef(plan.parentPromptRef) ? plan.parentPromptRef : null,
      variable: plan.ownerPath || "unresolved",
      targetPath: plan.ownerPath || "unresolved",
      requestedTargetState: plan.target || common.requestedTargetState,
    };
  }
  return common;
}

function failure(code, stage, retryable = false) {
  return {
    stage,
    code,
    retryable,
    message: failureMessages[code] || "The repair run did not complete.",
  };
}

function approvalEvidence(approval) {
  const decision = approval?.record?.decision;
  const approved =
    decision === "approved" && isExactRef(approval?.record?.artifactRef);
  return {
    required: true,
    decision: ["approved", "rejected"].includes(decision)
      ? decision
      : "missing",
    approvalRecordHash: approved ? approval.record.approvalHash : null,
    exactRepairHashMatched: approved,
  };
}

function adapterEvidence(adapter) {
  if (!adapter) return null;
  return {
    adapterId: adapter.adapterId,
    implementationContentHash: adapter.implementationContentHash,
    networkAccess: false,
    writesMedia: false,
    mutatesParent: false,
    providerNeutral: true,
  };
}

function emptySnapshot(timestamp) {
  return {
    status: "not_captured",
    artifactRef: null,
    payloadHash: null,
    capturedAt: timestamp,
  };
}

function capturedSnapshot(ref, timestamp) {
  return {
    status: "captured",
    artifactRef: ref,
    payloadHash: ref.contentHash,
    capturedAt: timestamp,
  };
}

function preservedRefsFromPayload(payload) {
  const refs = collectContractRefs(payload).map((item) => item.artifactRef);
  const exact = refs.filter(isExactRef);
  const unique = [
    ...new Map(exact.map((ref) => [refKey(ref), ref])).values(),
  ].sort((left, right) => refKey(left).localeCompare(refKey(right)));
  return {
    refs: unique.slice(0, 64),
    exact: exact.length === unique.length && unique.length <= 64,
  };
}

function identityMatches(targetRef, payload) {
  if (!isObject(payload) || payload.kind !== targetRef.kind) return false;
  const field = identityFields[targetRef.kind];
  if (field && payload[field] !== targetRef.id) return false;
  return true;
}

function payloadVersionMatchesTarget(targetRef, targetPayload, candidate) {
  const expected = targetRef.version + 1;
  if (Object.hasOwn(targetPayload || {}, "version"))
    return candidate?.version === expected;
  return !Object.hasOwn(candidate || {}, "version");
}

async function readManifestContracts() {
  const manifest = await readStrictJson(MANIFEST_PATH);
  return new Map(
    (manifest.contracts || []).map((entry) => [entry.kind, entry]),
  );
}

async function validateContractPayload(entry, payload) {
  if (!entry?.schema)
    return {
      valid: false,
      errors: ["Contract is not registered in the canonical manifest."],
    };
  try {
    return await validatePayload(resolve(CONTRACT_ROOT, entry.schema), payload);
  } catch {
    return {
      valid: false,
      errors: ["Contract schema could not be loaded or evaluated."],
    };
  }
}

function validateSemantic(payload, context = {}) {
  try {
    const errors = validateByKind(payload, context);
    return { valid: errors.length === 0, errors };
  } catch {
    return { valid: false, errors: ["Contract semantic validation failed."] };
  }
}

function classifyTargetError(error) {
  const message = String(error?.message || "");
  if (
    message.includes("does not exist") ||
    message.includes("pointer does not exist")
  )
    return "repair.target_missing";
  return "repair.target_integrity";
}

async function resolveTarget(projectRoot, targetRef, contracts) {
  if (!isExactRef(targetRef))
    return {
      ok: false,
      code: "repair.target_missing",
      targetExact: false,
      preservedInputRefsExact: false,
      preservedInputRefs: [],
    };
  let artifact;
  try {
    artifact = await findArtifact(projectRoot, targetRef);
  } catch (error) {
    return {
      ok: false,
      code: classifyTargetError(error),
      targetExact: false,
      preservedInputRefsExact: false,
      preservedInputRefs: [],
    };
  }
  const payload = artifact.envelope.payload;
  const targetExact =
    sameRef(artifact.envelope.artifactRef, targetRef) &&
    identityMatches(targetRef, payload);
  const contract = contracts.get(targetRef.kind);
  const schema = await validateContractPayload(contract, payload);
  const semantic = validateSemantic(payload);
  const preserved = preservedRefsFromPayload(payload);
  return {
    ok: targetExact && schema.valid && semantic.valid,
    code: targetExact ? "repair.target_invalid" : "repair.target_integrity",
    artifact,
    payload,
    targetExact,
    schemaValid: schema.valid,
    semanticValid: semantic.valid,
    preservedInputRefsExact: preserved.exact,
    preservedInputRefs: preserved.refs,
  };
}

function candidateChecks(target, candidate, planDetails) {
  const targetRef = target.artifact.envelope.artifactRef;
  const targetPayload = target.payload;
  const candidateIdentity = identityMatches(targetRef, candidate);
  const candidateVersion = payloadVersionMatchesTarget(
    targetRef,
    targetPayload,
    candidate,
  );
  const targetContractVersion = targetPayload?.contractVersion;
  const contractVersion =
    targetContractVersion === undefined ||
    candidate?.contractVersion === targetContractVersion;
  const targetPreserved = preservedRefsFromPayload(targetPayload);
  const candidatePreserved = preservedRefsFromPayload(candidate);
  const preservedExact =
    targetPreserved.exact &&
    candidatePreserved.exact &&
    targetPreserved.refs.length === candidatePreserved.refs.length &&
    targetPreserved.refs.every((ref, index) =>
      sameRef(ref, candidatePreserved.refs[index]),
    );
  const changedPaths = diffPaths(targetPayload, candidate);
  const substantive = changedPaths.filter(
    (path) => !isIgnoredMetadataPath(path),
  );
  const changedPathBounded =
    substantive.length > 0 &&
    substantive.every((path) => pathsWithin(path, planDetails.targetPath)) &&
    substantive.some((path) => pathsWithin(path, planDetails.targetPath));
  return {
    candidateIdentity,
    candidateVersion,
    contractVersion,
    preservedExact,
    changedPaths: uniqueStrings(changedPaths),
    changedPathBounded,
    targetPreserved,
    candidatePreserved,
  };
}

function buildReceipt(state, finishedAt) {
  const planDetails = state.planDetails;
  const change = safeChange(planDetails);
  const observedChangedPaths = uniqueStrings(state.observedChangedPaths || []);
  return {
    kind: "cineweave_codex_repair_run_receipt",
    contractVersion: "2.5.0",
    repairRunId: state.repairRunId,
    version: 1,
    status: state.status,
    repairRef: state.repairRef,
    targetRef: planDetails.targetRef,
    candidateRef: state.candidateRef || null,
    before: state.before || emptySnapshot(state.startedAt),
    after: state.after || emptySnapshot(finishedAt),
    preserve: planDetails.preserve,
    preservedInputRefs: state.preservedInputRefs || [],
    changeEvidence: {
      ...change,
      observedChangedPaths: observedChangedPaths.length
        ? observedChangedPaths
        : ["/not_executed"],
    },
    approvalEvidence: state.approvalEvidence,
    adapter: state.adapterEvidence || null,
    timing: {
      startedAt: state.startedAt,
      finishedAt,
      durationMs: durationMs(state.startedAt, finishedAt),
    },
    acceptance: {
      status: "pending",
      checkIds: planDetails.acceptanceCheckIds,
      humanReviewRequired: true,
    },
    executionBoundary: {
      providerNeutral: true,
      callsNetwork: false,
      writesSourceMedia: false,
      writesDerivedMedia: false,
      mutatesParentArtifact: false,
      claimsApproval: false,
      humanReviewRequired: true,
    },
    validation: {
      repairPlanValid: state.repairPlanValid === true,
      targetExact: state.targetExact === true,
      parentImmutable: true,
      preservedInputRefsExact: state.preservedInputRefsExact === true,
      changedPathBounded: state.changedPathBounded === true,
      candidateSchemaValid: state.candidateSchemaValid === true,
      candidateSemanticValid: state.candidateSemanticValid === true,
      noSuccessClaim: true,
    },
    failure: state.failure || null,
    provenance: {
      source: "codex_authored",
      createdAt: state.startedAt,
      updatedAt: finishedAt,
      parentId: state.repairRef.id,
      changeLog: [
        state.status === "awaiting_review"
          ? "Local contract-aware runner created a next-version candidate; human acceptance remains pending."
          : "Local contract-aware runner recorded " +
            state.status +
            " without mutating the parent artifact.",
      ],
    },
  };
}

async function persistReceipt(projectRoot, receipt, contracts, finishedAt) {
  const schema = await validateContractPayload(
    contracts.get(receipt.kind),
    receipt,
  );
  const semantic = validateSemantic(receipt);
  if (!schema.valid || !semantic.valid) {
    throw Object.assign(new Error(failureMessages["repair.receipt_invalid"]), {
      code: "repair.receipt_invalid",
    });
  }
  return putArtifact(projectRoot, receipt, {
    kind: receipt.kind,
    id: receipt.repairRunId,
    version: receipt.version,
    status: receipt.status === "awaiting_review" ? "candidate" : receipt.status,
    createdAt: finishedAt,
    createdBy: "cineweave-repair-runner",
  });
}

function ensureRegistry(registry) {
  if (!registry || typeof registry.get !== "function")
    throw new TypeError("A repair adapter registry is required");
}

function planFingerprint(repairRef, planDetails, approval, adapter, plan) {
  return {
    repairRef,
    targetRef: planDetails.targetRef,
    planHash: sha256Canonical(plan),
    gateStatus: planDetails.gateStatus,
    approval: approval?.record
      ? {
          decision: approval.record.decision,
          approvalHash: approval.record.approvalHash,
        }
      : null,
    adapter: adapter
      ? {
          adapterId: adapter.adapterId,
          implementationContentHash: adapter.implementationContentHash,
        }
      : null,
  };
}

function runIdFor(fingerprint) {
  return (
    "repair-run." +
    sha256Canonical(fingerprint).slice("sha256:".length, "sha256:".length + 32)
  );
}

export function createRepairAdapterRegistry(adapters = []) {
  if (!Array.isArray(adapters))
    throw new TypeError("Repair adapters must be an array");
  const entries = new Map();
  for (const adapter of adapters) {
    if (!isObject(adapter) || !identifierPattern.test(adapter.adapterId || ""))
      throw new TypeError("Repair adapter adapterId is invalid");
    if (!contentHashPattern.test(adapter.implementationContentHash || ""))
      throw new TypeError(
        "Repair adapter implementationContentHash is invalid",
      );
    if (typeof adapter.execute !== "function")
      throw new TypeError("Repair adapter execute function is required");
    if (
      adapter.networkAccess !== false ||
      adapter.writesMedia !== false ||
      adapter.mutatesParent !== false ||
      adapter.providerNeutral !== true
    ) {
      throw new TypeError(
        "Repair adapters must explicitly declare local, non-writing and provider-neutral boundaries",
      );
    }
    const supportedRepairKinds =
      adapter.supportedRepairKinds === undefined
        ? null
        : [...new Set(adapter.supportedRepairKinds)];
    if (
      supportedRepairKinds &&
      (!supportedRepairKinds.length ||
        supportedRepairKinds.some((kind) => !repairKinds.has(kind)))
    ) {
      throw new TypeError("Repair adapter supportedRepairKinds is invalid");
    }
    if (entries.has(adapter.adapterId))
      throw new Error("Duplicate repair adapter: " + adapter.adapterId);
    entries.set(
      adapter.adapterId,
      Object.freeze({
        adapterId: adapter.adapterId,
        implementationContentHash: adapter.implementationContentHash,
        supportedRepairKinds: supportedRepairKinds
          ? Object.freeze(supportedRepairKinds)
          : null,
        networkAccess: false,
        writesMedia: false,
        mutatesParent: false,
        providerNeutral: true,
        execute: adapter.execute,
      }),
    );
  }
  return Object.freeze({
    get(adapterId) {
      return entries.get(adapterId) || null;
    },
    list() {
      return [...entries.values()].map((adapter) => ({
        adapterId: adapter.adapterId,
        implementationContentHash: adapter.implementationContentHash,
        supportedRepairKinds: adapter.supportedRepairKinds,
      }));
    },
  });
}

const activeRepairRunQueues = new Map();

export async function runRepair(
  projectRoot,
  repairRef,
  registry,
  options = {},
) {
  ensureRegistry(registry);
  if (!isExactRef(repairRef) || !repairKinds.has(repairRef.kind))
    throw new TypeError(
      "repairRef must be an exact supported repair-plan reference",
    );
  if (!isObject(options))
    throw new TypeError("Repair run options must be an object");
  const timeoutMs =
    options.timeoutMs === undefined ? 30_000 : options.timeoutMs;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 300_000
  ) {
    throw new TypeError("timeoutMs must be an integer between 1 and 300000");
  }
  if (options.signal !== undefined && !(options.signal instanceof AbortSignal)) {
    throw new TypeError("signal must be an AbortSignal");
  }
  const requestedAdapterId = options.adapterId || "repair.local";
  if (!identifierPattern.test(requestedAdapterId))
    throw new TypeError("adapterId is invalid");

  const queueKey = `${resolve(projectRoot)}\u0000${refKey(repairRef)}\u0000${requestedAdapterId}`;
  const previous = activeRepairRunQueues.get(queueKey) || Promise.resolve();
  let releaseTurn;
  const turn = new Promise((resolveTurn) => { releaseTurn = resolveTurn; });
  const queueTail = previous.then(() => turn, () => turn);
  activeRepairRunQueues.set(queueKey, queueTail);
  await previous.catch(() => {});
  try {
    return await runRepairOwned(projectRoot, repairRef, registry, options);
  } finally {
    releaseTurn();
    if (activeRepairRunQueues.get(queueKey) === queueTail) {
      activeRepairRunQueues.delete(queueKey);
    }
  }
}

async function runRepairOwned(
  projectRoot,
  repairRef,
  registry,
  options = {},
) {
  ensureRegistry(registry);
  if (!isExactRef(repairRef) || !repairKinds.has(repairRef.kind))
    throw new TypeError(
      "repairRef must be an exact supported repair-plan reference",
    );
  if (!isObject(options))
    throw new TypeError("Repair run options must be an object");
  const timeoutMs =
    options.timeoutMs === undefined ? 30_000 : options.timeoutMs;
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 300_000
  ) {
    throw new TypeError("timeoutMs must be an integer between 1 and 300000");
  }
  const callerSignal = options.signal;
  if (callerSignal !== undefined && !(callerSignal instanceof AbortSignal)) {
    throw new TypeError("signal must be an AbortSignal");
  }
  const clock = options.now || (() => new Date());
  const startedAt = isoNow(clock);
  const contracts = await readManifestContracts();
  const repairArtifact = await findArtifact(projectRoot, repairRef);
  const plan = repairArtifact.envelope.payload;
  const planDetails = normalizePlan(plan);
  const requestedAdapterId = options.adapterId || "repair.local";
  if (!identifierPattern.test(requestedAdapterId))
    throw new TypeError("adapterId is invalid");
  const selectedAdapter = planDetails.direct
    ? registry.get(requestedAdapterId)
    : null;
  const approval = await findApprovalDecision(projectRoot, repairRef);
  const approvalView = approvalEvidence(approval);
  const fingerprint = planFingerprint(
    repairRef,
    planDetails,
    approval,
    selectedAdapter,
    plan,
  );
  const repairRunId = runIdFor(fingerprint);
  const existing = await findArtifactByVersion(
    projectRoot,
    "cineweave_codex_repair_run_receipt",
    repairRunId,
    1,
  );
  if (existing) return existing;

  const state = {
    repairRunId,
    repairRef,
    planDetails,
    startedAt,
    approvalEvidence: approvalView,
    adapterEvidence: adapterEvidence(selectedAdapter),
    preservedInputRefs: [],
    targetExact: false,
    preservedInputRefsExact: false,
    candidateSchemaValid: false,
    candidateSemanticValid: false,
    changedPathBounded: false,
    observedChangedPaths: [],
  };

  const manifestPlan = contracts.get(plan?.kind);
  const planSchema = await validateContractPayload(manifestPlan, plan);
  const identityValid =
    plan?.kind === repairRef.kind &&
    plan?.repairId === repairRef.id &&
    plan?.version === repairRef.version;
  let planSemantic = {
    valid: false,
    errors: ["Plan semantic validation was not run."],
  };
  if (planSchema.valid && identityValid && planDetails.planKindValid)
    planSemantic = validateSemantic(plan);
  state.repairPlanValid =
    planSchema.valid &&
    identityValid &&
    planDetails.planKindValid &&
    planSemantic.valid;

  const finishBlocked = async (reason, status = "blocked") => {
    state.status = status;
    state.failure = reason;
    const finishedAt = isoNow(clock);
    return persistReceipt(
      projectRoot,
      buildReceipt(state, finishedAt),
      contracts,
      finishedAt,
    );
  };
  const executionControlFailure = (code) => ({
    stage: "adapter",
    code,
    retryable: code === "repair.adapter_timeout",
    message:
      code === "repair.adapter_timeout"
        ? "The registered local repair adapter exceeded its bounded execution time."
        : "The registered local repair adapter was cancelled by the caller.",
  });

  if (!state.repairPlanValid)
    return finishBlocked(failure("repair.plan_invalid", "preflight"));
  if (planDetails.delegated)
    return finishBlocked(failure("repair.delegated", "preflight"));
  if (!planDetails.direct)
    return finishBlocked(failure("repair.plan_invalid", "preflight"));
  if (
    planDetails.requiresEmbeddedGate &&
    planDetails.gateStatus !== "approved"
  ) {
    return finishBlocked(failure("repair.plan_gate", "authorization"));
  }
  if (approvalView.decision === "missing")
    return finishBlocked(failure("repair.approval_missing", "authorization"));
  if (approvalView.decision === "rejected")
    return finishBlocked(failure("repair.approval_rejected", "authorization"));
  if (!selectedAdapter)
    return finishBlocked(failure("repair.adapter_missing", "preflight"));
  if (
    selectedAdapter.supportedRepairKinds &&
    !selectedAdapter.supportedRepairKinds.includes(plan.kind)
  ) {
    return finishBlocked(failure("repair.adapter_kind", "preflight"));
  }
  if (!planDetails.targetRef)
    return finishBlocked(failure("repair.unsupported_target", "preflight"));
  if (
    plan.kind === "cineweave_codex_prompt_repair" &&
    !promptTargetKinds.has(planDetails.targetRef.kind)
  ) {
    return finishBlocked(failure("repair.unsupported_target", "preflight"));
  }

  const target = await resolveTarget(
    projectRoot,
    planDetails.targetRef,
    contracts,
  );
  state.targetExact = target.targetExact === true;
  state.preservedInputRefsExact = target.preservedInputRefsExact === true;
  state.preservedInputRefs = target.preservedInputRefs || [];
  if (!target.ok) return finishBlocked(failure(target.code, "preflight"));
  state.before = capturedSnapshot(
    target.artifact.envelope.artifactRef,
    state.startedAt,
  );

  if (plan.kind === "cineweave_codex_director_repair") {
    planSemantic = validateSemantic(plan, {
      directorTargets: [target.artifact],
    });
    state.repairPlanValid = planSemantic.valid;
    if (!state.repairPlanValid)
      return finishBlocked(failure("repair.plan_invalid", "preflight"));
  }

  if (callerSignal?.aborted) {
    return finishBlocked(
      executionControlFailure("repair.adapter_cancelled"),
      "failed",
    );
  }

  let adapterResult;
  const controller = new AbortController();
  let timeoutHandle;
  let removeCallerAbortListener = () => {};
  let controlCode = null;
  try {
    const input = deepFreeze({
      repair: cloneJson(plan),
      target: cloneJson(target.payload),
      targetRef: cloneJson(target.artifact.envelope.artifactRef),
      expectedVersion: target.artifact.envelope.artifactRef.version + 1,
    });
    let rejectControl;
    const controlledStop = new Promise((_, reject) => {
      rejectControl = reject;
    });
    const stop = (code) => {
      if (controlCode) return;
      controlCode = code;
      controller.abort();
      rejectControl(new Error(code));
    };
    timeoutHandle = setTimeout(() => stop("repair.adapter_timeout"), timeoutMs);
    if (callerSignal) {
      const onCallerAbort = () => stop("repair.adapter_cancelled");
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
      removeCallerAbortListener = () =>
        callerSignal.removeEventListener("abort", onCallerAbort);
      if (callerSignal.aborted) onCallerAbort();
    }
    const invocation = Promise.resolve().then(() => {
      if (controlCode) throw new Error(controlCode);
      return {
        value: selectedAdapter.execute(
          input,
          Object.freeze({ signal: controller.signal }),
        ),
      };
    });
    const execution = invocation.then(({ value }) => {
      try {
        if (value instanceof Promise) {
          return value.then((resolvedValue) => ({ value: resolvedValue }));
        }
      } catch {
        return { value };
      }
      return { value };
    });
    const outcome = await Promise.race([execution, controlledStop]);
    adapterResult = outcome.value;
    if (controlCode) throw new Error(controlCode);
  } catch {
    if (controlCode)
      return finishBlocked(executionControlFailure(controlCode), "failed");
    return finishBlocked(failure("repair.adapter_failed", "adapter"), "failed");
  } finally {
    if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
    removeCallerAbortListener();
  }
  let candidate;
  try {
    if (!isObject(adapterResult)) throw new TypeError("Invalid adapter output");
    const envelopeKeys = Reflect.ownKeys(adapterResult);
    if (envelopeKeys.length !== 1 || envelopeKeys[0] !== "payload") {
      throw new TypeError("Invalid adapter output");
    }
    const payloadDescriptor = Object.getOwnPropertyDescriptor(
      adapterResult,
      "payload",
    );
    if (
      !payloadDescriptor ||
      payloadDescriptor.enumerable !== true ||
      !Object.hasOwn(payloadDescriptor, "value") ||
      !isObject(payloadDescriptor.value)
    ) {
      throw new TypeError("Invalid adapter output");
    }
    candidate = cloneJson(payloadDescriptor.value);
  } catch {
    return finishBlocked(failure("repair.adapter_output", "adapter"), "failed");
  }
  const checks = candidateChecks(target, candidate, planDetails);
  state.observedChangedPaths = checks.changedPaths;
  state.changedPathBounded = checks.changedPathBounded;
  state.preservedInputRefsExact = checks.preservedExact;
  const candidateContract = contracts.get(
    target.artifact.envelope.artifactRef.kind,
  );
  const candidateSchema = await validateContractPayload(
    candidateContract,
    candidate,
  );
  const candidateSemantic = validateSemantic(candidate);
  state.candidateSchemaValid = candidateSchema.valid;
  state.candidateSemanticValid = candidateSemantic.valid;
  if (
    !checks.candidateIdentity ||
    !checks.candidateVersion ||
    !checks.contractVersion ||
    !checks.preservedExact ||
    !checks.changedPathBounded ||
    !candidateSchema.valid ||
    !candidateSemantic.valid
  ) {
    return finishBlocked(
      failure("repair.candidate_invalid", "output_verification"),
      "failed",
    );
  }

  const candidateVersion = target.artifact.envelope.artifactRef.version + 1;
  const candidateCreatedAt = isoNow(clock);
  let candidateArtifact;
  try {
    candidateArtifact = await putArtifact(projectRoot, candidate, {
      kind: target.artifact.envelope.artifactRef.kind,
      id: target.artifact.envelope.artifactRef.id,
      version: candidateVersion,
      status: "candidate",
      createdAt: candidateCreatedAt,
      createdBy: "cineweave-repair-runner",
    });
  } catch (error) {
    if (String(error?.message || "").includes("Version conflict")) {
      return finishBlocked(
        failure("repair.candidate_version_conflict", "output_verification"),
        "failed",
      );
    }
    throw error;
  }

  state.status = "awaiting_review";
  state.candidateRef = candidateArtifact.envelope.artifactRef;
  state.after = capturedSnapshot(
    candidateArtifact.envelope.artifactRef,
    candidateCreatedAt,
  );
  state.failure = null;
  const finishedAt = isoNow(clock);
  return persistReceipt(
    projectRoot,
    buildReceipt(state, finishedAt),
    contracts,
    finishedAt,
  );
}
