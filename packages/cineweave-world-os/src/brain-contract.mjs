import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_IMPLEMENTATION_VERSION, WORLD_OS_VERSION } from "./constants.mjs";
import { isExactRef, isPlainObject } from "./json.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const STATUS = new Set(["advanced", "stopped", "blocked", "stale", "failed"]);
const STOP_REASONS = new Set([
  "budget_exhausted",
  "all_worlds_stopped",
  "world_error",
  "stale_after_race",
  "needs_human_gate",
  "awaiting_codex_template",
  "all_candidates_rejected",
  "committed_projection_pending",
  "llm_shadow_failed",
  "mcp_dispatch_failed",
  "mcp_dead_letter",
  "portfolio_blocked"
]);
const LLM_MODES = new Set(["disabled", "proposal_only"]);
const MCP_MODES = new Set(["disabled", "dry_run", "network_opt_in"]);
const DISPATCH_STATUSES = new Set(["disabled", "idle", "dry_run", "network_opt_in", "failed"]);

function exactKeys(value, keys, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) {
    throw new TypeError(`${label} fields must be exact`);
  }
}

function exactRefKind(ref, kind, label, nullable = false) {
  if (nullable && ref === null) return;
  if (!isExactRef(ref) || ref.kind !== kind) throw new TypeError(`${label} must be an exact ${kind} reference`);
}

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return Date.parse(value);
}

function assertWriter(writer, label) {
  exactKeys(writer, ["kind", "id"], label);
  if (writer.kind !== "codex" || writer.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function assertRefList(values, kind, label, nullable = false) {
  if (!Array.isArray(values)) throw new TypeError(`${label} must be an array`);
  for (const [index, value] of values.entries()) exactRefKind(value, kind, `${label}[${index}]`, nullable);
  const keys = values.map((value) => `${value.kind}/${value.id}@${value.version}/${value.contentHash}`);
  if (new Set(keys).size !== keys.length) throw new TypeError(`${label} must not contain duplicate references`);
}

function assertHealthSummary(summary, label) {
  exactKeys(summary, ["status", "artifactCount", "referenceCount", "missingReferenceCount", "hashMismatchReferenceCount", "cycleCount"], label);
  if (summary.status !== "pass"
    || !Number.isSafeInteger(summary.artifactCount) || summary.artifactCount < 0
    || !Number.isSafeInteger(summary.referenceCount) || summary.referenceCount < 0
    || !Number.isSafeInteger(summary.missingReferenceCount) || summary.missingReferenceCount < 0
    || !Number.isSafeInteger(summary.hashMismatchReferenceCount) || summary.hashMismatchReferenceCount < 0
    || !Number.isSafeInteger(summary.cycleCount) || summary.cycleCount < 0) {
    throw new TypeError(`${label} is invalid`);
  }
}

function assertDispatch(dispatch) {
  exactKeys(dispatch, [
    "status", "profileRefs", "pendingProjectionRefs", "pendingCount", "dispatchedCount", "skippedCount", "failureCount", "attemptRefs", "publishReceiptRefs"
  ], "CodexBrainRunReceipt.dispatch");
  if (!DISPATCH_STATUSES.has(dispatch.status)) throw new TypeError("CodexBrainRunReceipt.dispatch.status is invalid");
  assertRefList(dispatch.profileRefs, ARTIFACT_KINDS.platformProfile, "CodexBrainRunReceipt.dispatch.profileRefs");
  assertRefList(dispatch.pendingProjectionRefs, ARTIFACT_KINDS.projection, "CodexBrainRunReceipt.dispatch.pendingProjectionRefs");
  assertRefList(dispatch.attemptRefs, ARTIFACT_KINDS.mcpAttemptReceipt, "CodexBrainRunReceipt.dispatch.attemptRefs");
  assertRefList(dispatch.publishReceiptRefs, ARTIFACT_KINDS.receipt, "CodexBrainRunReceipt.dispatch.publishReceiptRefs");
  for (const [label, value] of [
    ["pendingCount", dispatch.pendingCount],
    ["dispatchedCount", dispatch.dispatchedCount],
    ["skippedCount", dispatch.skippedCount],
    ["failureCount", dispatch.failureCount]
  ]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`CodexBrainRunReceipt.dispatch.${label} is invalid`);
  }
  if (dispatch.dispatchedCount !== dispatch.attemptRefs.length || dispatch.publishReceiptRefs.length > dispatch.attemptRefs.length) {
    throw new TypeError("CodexBrainRunReceipt.dispatch counters are inconsistent");
  }
}

export function assertCodexBrainRunReceiptContract(receipt) {
  const keys = [
    "kind", "contractVersion", "brainRunId", "version", "implementationVersion", "workspaceRef", "worldIds", "maxCycles",
    "simulationPolicy", "llmMode", "mcpMode", "startedAt", "endedAt", "writer", "portfolioRunRef", "shadowRunRefs",
    "shadowFailureCount", "dispatch", "preflight", "postflight", "status", "stopReason"
  ];
  exactKeys(receipt, keys, "CodexBrainRunReceipt");
  if (receipt.kind !== ARTIFACT_KINDS.codexBrainRunReceipt || receipt.contractVersion !== WORLD_OS_VERSION
    || receipt.implementationVersion !== WORLD_OS_IMPLEMENTATION_VERSION) throw new Error("Unsupported CodexBrainRunReceipt contract");
  if (!IDENTIFIER_PATTERN.test(receipt.brainRunId) || receipt.version !== 1) throw new TypeError("CodexBrainRunReceipt identity is invalid");
  exactRefKind(receipt.workspaceRef, ARTIFACT_KINDS.workspace, "CodexBrainRunReceipt.workspaceRef");
  if (!Array.isArray(receipt.worldIds) || !receipt.worldIds.length || new Set(receipt.worldIds).size !== receipt.worldIds.length
    || receipt.worldIds.some((worldId) => !WORLD_ID_PATTERN.test(worldId))) throw new TypeError("CodexBrainRunReceipt.worldIds are invalid");
  if (!Number.isSafeInteger(receipt.maxCycles) || receipt.maxCycles < 1 || receipt.maxCycles > 100) throw new TypeError("CodexBrainRunReceipt.maxCycles is invalid");
  if (receipt.simulationPolicy !== "weighted_fair_deficit_round_robin") throw new TypeError("CodexBrainRunReceipt.simulationPolicy is invalid");
  if (!LLM_MODES.has(receipt.llmMode) || !MCP_MODES.has(receipt.mcpMode)) throw new TypeError("CodexBrainRunReceipt execution modes are invalid");
  const started = assertDate(receipt.startedAt, "CodexBrainRunReceipt.startedAt");
  if (assertDate(receipt.endedAt, "CodexBrainRunReceipt.endedAt") < started) throw new TypeError("CodexBrainRunReceipt.endedAt cannot precede startedAt");
  assertWriter(receipt.writer, "CodexBrainRunReceipt.writer");
  exactRefKind(receipt.portfolioRunRef, ARTIFACT_KINDS.portfolioRunReceipt, "CodexBrainRunReceipt.portfolioRunRef");
  assertRefList(receipt.shadowRunRefs, ARTIFACT_KINDS.llmShadowReceipt, "CodexBrainRunReceipt.shadowRunRefs");
  if (!Number.isSafeInteger(receipt.shadowFailureCount) || receipt.shadowFailureCount < 0) throw new TypeError("CodexBrainRunReceipt.shadowFailureCount is invalid");
  assertDispatch(receipt.dispatch);
  assertHealthSummary(receipt.preflight, "CodexBrainRunReceipt.preflight");
  assertHealthSummary(receipt.postflight, "CodexBrainRunReceipt.postflight");
  if (!STATUS.has(receipt.status) || !STOP_REASONS.has(receipt.stopReason)) throw new TypeError("CodexBrainRunReceipt status or stopReason is invalid");
  if (receipt.llmMode === "disabled" && (receipt.shadowRunRefs.length || receipt.shadowFailureCount)) throw new TypeError("Disabled LLM mode cannot contain shadow runs");
  if (receipt.mcpMode === "disabled" && receipt.dispatch.status !== "disabled") throw new TypeError("Disabled MCP mode must have a disabled dispatch summary");
  if (receipt.mcpMode === "dry_run" && !["dry_run", "idle"].includes(receipt.dispatch.status)) throw new TypeError("Dry-run MCP mode has an invalid dispatch status");
  if (receipt.mcpMode === "network_opt_in" && !["network_opt_in", "idle", "failed"].includes(receipt.dispatch.status)) throw new TypeError("Network MCP mode has an invalid dispatch status");
  return receipt;
}

export function healthSummary(health) {
  if (!health?.verification?.valid || !health?.graph?.summary) throw new Error("World OS health is not a passing verification result");
  return {
    status: "pass",
    artifactCount: health.verification.artifacts,
    referenceCount: health.graph.summary.referenceCount,
    missingReferenceCount: health.graph.summary.missingReferenceCount,
    hashMismatchReferenceCount: health.graph.summary.hashMismatchReferenceCount,
    cycleCount: health.graph.summary.cycleCount
  };
}
