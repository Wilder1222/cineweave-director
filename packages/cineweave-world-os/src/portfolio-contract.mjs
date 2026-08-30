import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_IMPLEMENTATION_VERSION, WORLD_OS_VERSION } from "./constants.mjs";
import { isExactRef, isPlainObject } from "./json.mjs";

const STATUS = new Set(["advanced", "stopped", "blocked", "stale"]);
const STOP_REASONS = new Set(["budget_exhausted", "all_worlds_stopped", "world_error", "stale_after_race"]);
const ROUND_STATUSES = new Set(["advanced", "stopped", "blocked", "stale", "scheduler_error"]);

function exactKeys(value, keys, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError(`${label} fields are not exact`);
}

function exactRefKind(ref, kind, label, nullable = false) {
  if (nullable && ref === null) return;
  if (!isExactRef(ref) || ref.kind !== kind) throw new TypeError(`${label} must be an exact ${kind} reference`);
}

function assertHead(head, label) {
  exactKeys(head, ["worldId", "stateRef", "commitRef"], label);
  if (!WORLD_ID_PATTERN.test(head.worldId)) throw new TypeError(`${label}.worldId is invalid`);
  exactRefKind(head.stateRef, ARTIFACT_KINDS.state, `${label}.stateRef`);
  exactRefKind(head.commitRef, ARTIFACT_KINDS.commit, `${label}.commitRef`, true);
}

function assertWriter(writer, label) {
  exactKeys(writer, ["kind", "id"], label);
  if (writer.kind !== "codex" || writer.id !== "codex.root") throw new TypeError(`${label} is not the Codex writer`);
}

export function assertPortfolioRunReceiptContract(receipt) {
  const keys = [
    "kind", "contractVersion", "portfolioRunId", "version", "implementationVersion", "workspaceRef", "worldIds", "allocationPolicy", "maxCycles",
    "startedAt", "endedAt", "writer", "startHeads", "endHeads", "rounds", "attemptedCycles", "committedSteps", "status", "stopReason"
  ];
  exactKeys(receipt, keys, "PortfolioRunReceipt");
  if (receipt.kind !== ARTIFACT_KINDS.portfolioRunReceipt || receipt.contractVersion !== WORLD_OS_VERSION || receipt.implementationVersion !== WORLD_OS_IMPLEMENTATION_VERSION) throw new Error("Unsupported PortfolioRunReceipt contract");
  if (typeof receipt.portfolioRunId !== "string" || !/^[a-z0-9][a-z0-9._-]{1,159}$/.test(receipt.portfolioRunId) || receipt.version !== 1) throw new TypeError("PortfolioRunReceipt identity is invalid");
  exactRefKind(receipt.workspaceRef, ARTIFACT_KINDS.workspace, "PortfolioRunReceipt.workspaceRef");
  if (!Array.isArray(receipt.worldIds) || !receipt.worldIds.length || new Set(receipt.worldIds).size !== receipt.worldIds.length || receipt.worldIds.some((id) => !WORLD_ID_PATTERN.test(id))) throw new TypeError("PortfolioRunReceipt.worldIds are invalid");
  if (receipt.allocationPolicy !== "weighted_fair_deficit_round_robin" || !Number.isSafeInteger(receipt.maxCycles) || receipt.maxCycles < 1 || receipt.maxCycles > 100) throw new TypeError("PortfolioRunReceipt scheduling policy is invalid");
  if (Number.isNaN(Date.parse(receipt.startedAt)) || Number.isNaN(Date.parse(receipt.endedAt)) || Date.parse(receipt.endedAt) < Date.parse(receipt.startedAt)) throw new TypeError("PortfolioRunReceipt time range is invalid");
  assertWriter(receipt.writer, "PortfolioRunReceipt.writer");
  if (!STATUS.has(receipt.status) || !STOP_REASONS.has(receipt.stopReason)) throw new TypeError("PortfolioRunReceipt authority or status is invalid");
  for (const [index, heads] of [["startHeads", receipt.startHeads], ["endHeads", receipt.endHeads]]) {
    if (!Array.isArray(heads) || heads.length !== receipt.worldIds.length) throw new TypeError(`PortfolioRunReceipt.${index} must cover every world exactly once`);
    for (const [headIndex, head] of heads.entries()) assertHead(head, `PortfolioRunReceipt.${index}[${headIndex}]`);
    if (heads.map((head) => head.worldId).join("\u0000") !== receipt.worldIds.join("\u0000")) throw new TypeError(`PortfolioRunReceipt.${index} crosses the declared world set or order`);
  }
  if (!Array.isArray(receipt.rounds) || receipt.rounds.length !== receipt.attemptedCycles || receipt.rounds.length > receipt.maxCycles) throw new TypeError("PortfolioRunReceipt rounds do not match its budget");
  for (const [index, round] of receipt.rounds.entries()) {
    exactKeys(round, ["cycle", "worldId", "allocationShare", "receiptRef", "resultStatus", "stopReason", "startSequence", "endSequence", "committedSteps", ...(round.error === undefined ? [] : ["error"])], `PortfolioRunReceipt.rounds[${index}]`);
    if (!Number.isSafeInteger(round.cycle) || round.cycle !== index + 1 || !receipt.worldIds.includes(round.worldId) || !Number.isSafeInteger(round.allocationShare) || round.allocationShare < 1 || round.allocationShare > 100) throw new TypeError(`PortfolioRunReceipt.rounds[${index}] identity is invalid`);
    exactRefKind(round.receiptRef, ARTIFACT_KINDS.runReceipt, `PortfolioRunReceipt.rounds[${index}].receiptRef`);
    if (!ROUND_STATUSES.has(round.resultStatus) || typeof round.stopReason !== "string" || !round.stopReason || !Number.isSafeInteger(round.startSequence) || !Number.isSafeInteger(round.endSequence) || round.endSequence < round.startSequence || !Number.isSafeInteger(round.committedSteps) || round.committedSteps < 0) throw new TypeError(`PortfolioRunReceipt.rounds[${index}] result is invalid`);
    if (round.resultStatus !== "stale" && round.endSequence !== round.startSequence + round.committedSteps) throw new TypeError(`PortfolioRunReceipt.rounds[${index}] sequence delta is inconsistent with committedSteps`);
    if (round.error !== undefined && (typeof round.error !== "string" || !round.error.trim())) throw new TypeError(`PortfolioRunReceipt.rounds[${index}].error is invalid`);
  }
  if (!Number.isSafeInteger(receipt.attemptedCycles) || receipt.attemptedCycles < 0 || !Number.isSafeInteger(receipt.committedSteps) || receipt.committedSteps < 0 || receipt.committedSteps !== receipt.rounds.reduce((sum, round) => sum + round.committedSteps, 0)) throw new TypeError("PortfolioRunReceipt counters are invalid");
  return receipt;
}
