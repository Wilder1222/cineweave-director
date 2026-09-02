import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, HASH_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { createMcpDispatch, listOutbox, platformProfileRef, projectionRef, recordPublishReceipt, validatePlatformResponse } from "./outbox.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";

const CLAIM_STATUSES = new Set(["active"]);
const ATTEMPT_STATUSES = new Set(["succeeded", "rejected", "failed", "dead_letter"]);
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return Date.parse(value);
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function claimIdentity({ projectionRef: sourceProjectionRef, attemptNumber }) {
  return `claim.${sha256Canonical({ projectionRef: sourceProjectionRef, attemptNumber }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function attemptIdentity(claimRef) {
  return `attempt.${sha256Canonical(claimRef).slice("sha256:".length, "sha256:".length + 32)}`;
}

export function assertMcpDispatchClaimContract(claim) {
  if (!isPlainObject(claim) || claim.kind !== ARTIFACT_KINDS.mcpDispatchClaim || claim.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported MCPDispatchClaim contract");
  const keys = ["kind", "contractVersion", "claimId", "version", "projectionRef", "platformProfileRef", "dispatchId", "idempotencyKey", "attemptNumber", "claimedAt", "leaseUntil", "claimedBy", "status"];
  if (Object.keys(claim).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("MCPDispatchClaim fields must be exact");
  if (!IDENTIFIER_PATTERN.test(claim.claimId) || claim.version !== 1 || !isExactRef(claim.projectionRef) || claim.projectionRef.kind !== ARTIFACT_KINDS.projection
    || !isExactRef(claim.platformProfileRef) || claim.platformProfileRef.kind !== ARTIFACT_KINDS.platformProfile
    || typeof claim.dispatchId !== "string" || !IDENTIFIER_PATTERN.test(claim.dispatchId)
    || typeof claim.idempotencyKey !== "string" || !claim.idempotencyKey.trim()
    || !Number.isSafeInteger(claim.attemptNumber) || claim.attemptNumber < 1 || claim.attemptNumber > 100
    || !CLAIM_STATUSES.has(claim.status)) throw new TypeError("MCPDispatchClaim identity or status is invalid");
  assertDate(claim.claimedAt, "MCPDispatchClaim.claimedAt");
  if (assertDate(claim.leaseUntil, "MCPDispatchClaim.leaseUntil") <= Date.parse(claim.claimedAt)) throw new TypeError("MCPDispatchClaim.leaseUntil must be after claimedAt");
  assertWriter(claim.claimedBy, "MCPDispatchClaim.claimedBy");
  return claim;
}

export function assertMcpAttemptReceiptContract(attempt) {
  if (!isPlainObject(attempt) || attempt.kind !== ARTIFACT_KINDS.mcpAttemptReceipt || attempt.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported MCPAttemptReceipt contract");
  const keys = ["kind", "contractVersion", "attemptId", "version", "claimRef", "projectionRef", "platformProfileRef", "dispatchId", "idempotencyKey", "attemptNumber", "startedAt", "endedAt", "status", "platformRecordId", "responseHash", "errorCode", "errorHash", "nextRetryAt", "recordedBy"];
  if (Object.keys(attempt).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("MCPAttemptReceipt fields must be exact");
  if (!IDENTIFIER_PATTERN.test(attempt.attemptId) || attempt.version !== 1 || !isExactRef(attempt.claimRef) || attempt.claimRef.kind !== ARTIFACT_KINDS.mcpDispatchClaim
    || !isExactRef(attempt.projectionRef) || attempt.projectionRef.kind !== ARTIFACT_KINDS.projection
    || !isExactRef(attempt.platformProfileRef) || attempt.platformProfileRef.kind !== ARTIFACT_KINDS.platformProfile
    || typeof attempt.dispatchId !== "string" || !IDENTIFIER_PATTERN.test(attempt.dispatchId)
    || typeof attempt.idempotencyKey !== "string" || !attempt.idempotencyKey.trim()
    || !Number.isSafeInteger(attempt.attemptNumber) || attempt.attemptNumber < 1 || attempt.attemptNumber > 100
    || !ATTEMPT_STATUSES.has(attempt.status)) throw new TypeError("MCPAttemptReceipt identity or status is invalid");
  const started = assertDate(attempt.startedAt, "MCPAttemptReceipt.startedAt");
  const ended = assertDate(attempt.endedAt, "MCPAttemptReceipt.endedAt");
  if (ended < started) throw new TypeError("MCPAttemptReceipt.endedAt cannot precede startedAt");
  if (attempt.platformRecordId !== null && (typeof attempt.platformRecordId !== "string" || !attempt.platformRecordId.trim())) throw new TypeError("MCPAttemptReceipt.platformRecordId is invalid");
  if (attempt.responseHash !== null && !HASH_PATTERN.test(attempt.responseHash)) throw new TypeError("MCPAttemptReceipt.responseHash is invalid");
  if (attempt.errorCode !== null && (typeof attempt.errorCode !== "string" || !IDENTIFIER_PATTERN.test(attempt.errorCode))) throw new TypeError("MCPAttemptReceipt.errorCode is invalid");
  if (attempt.errorHash !== null && !HASH_PATTERN.test(attempt.errorHash)) throw new TypeError("MCPAttemptReceipt.errorHash is invalid");
  if (attempt.nextRetryAt !== null && assertDate(attempt.nextRetryAt, "MCPAttemptReceipt.nextRetryAt") <= ended) throw new TypeError("MCPAttemptReceipt.nextRetryAt must be after endedAt");
  if (attempt.status === "succeeded" || attempt.status === "rejected") {
    if (attempt.platformRecordId === null || attempt.responseHash === null || attempt.errorCode !== null || attempt.errorHash !== null || attempt.nextRetryAt !== null) throw new TypeError("Terminal platform response receipt fields are inconsistent");
  }
  if (attempt.status === "failed" && (attempt.errorCode === null || attempt.errorHash === null || attempt.platformRecordId !== null)) throw new TypeError("Failed MCP attempt must retain only classified error evidence");
  if (attempt.status === "dead_letter" && (attempt.errorCode === null || attempt.errorHash === null || attempt.nextRetryAt !== null || attempt.platformRecordId !== null)) throw new TypeError("Dead-letter MCP attempt fields are inconsistent");
  assertWriter(attempt.recordedBy, "MCPAttemptReceipt.recordedBy");
  return attempt;
}

async function loadExact(root, ref, kind, label) {
  if (!isExactRef(ref) || ref.kind !== kind) throw new Error(`${label} must be an exact ${kind} reference`);
  const item = await findArtifact(root, ref);
  if (!sameRef(item.envelope.artifactRef, ref)) throw new Error(`${label} is not the exact stored artifact`);
  return item;
}

async function verifyClaimAgainstProjection(root, claim) {
  const projectionItem = await loadExact(root, claim.projectionRef, ARTIFACT_KINDS.projection, "MCP claim projection");
  const profileItem = await loadExact(root, claim.platformProfileRef, ARTIFACT_KINDS.platformProfile, "MCP claim platform profile");
  const dispatch = createMcpDispatch(projectionItem.envelope, profileItem.envelope.payload);
  if (claim.claimId !== claimIdentity({ projectionRef: claim.projectionRef, attemptNumber: claim.attemptNumber })
    || claim.platformProfileRef.contentHash !== platformProfileRef(profileItem.envelope.payload).contentHash
    || claim.dispatchId !== dispatch.dispatchId
    || claim.idempotencyKey !== dispatch.idempotencyKey) throw new Error("MCPDispatchClaim is not bound to the exact projection dispatch");
  return { projectionItem, profileItem, dispatch };
}

export async function verifyMcpDispatchClaim(projectRoot, claimRef) {
  const root = projectRoot;
  const item = await loadExact(root, claimRef, ARTIFACT_KINDS.mcpDispatchClaim, "MCPDispatchClaim");
  const claim = assertMcpDispatchClaimContract(item.envelope.payload);
  await verifyClaimAgainstProjection(root, claim);
  return claim;
}

export async function verifyMcpAttemptReceipt(projectRoot, attemptRef) {
  const root = projectRoot;
  const item = await loadExact(root, attemptRef, ARTIFACT_KINDS.mcpAttemptReceipt, "MCPAttemptReceipt");
  const attempt = assertMcpAttemptReceiptContract(item.envelope.payload);
  const claimItem = await loadExact(root, attempt.claimRef, ARTIFACT_KINDS.mcpDispatchClaim, "MCPAttemptReceipt claim");
  const claim = assertMcpDispatchClaimContract(claimItem.envelope.payload);
  await verifyClaimAgainstProjection(root, claim);
  if (attempt.attemptId !== attemptIdentity(attempt.claimRef) || !sameRef(attempt.projectionRef, claim.projectionRef)
    || !sameRef(attempt.platformProfileRef, claim.platformProfileRef) || attempt.dispatchId !== claim.dispatchId
    || attempt.idempotencyKey !== claim.idempotencyKey || attempt.attemptNumber !== claim.attemptNumber) throw new Error("MCPAttemptReceipt is not bound to its exact claim");
  if (attempt.status === "succeeded" || attempt.status === "rejected") {
    const projection = (await loadExact(root, attempt.projectionRef, ARTIFACT_KINDS.projection, "MCP attempt projection")).envelope.payload;
    const receipt = await findArtifactByVersion(root, ARTIFACT_KINDS.receipt, `receipt.${projection.projectionId}`, projection.version);
    if (!receipt || receipt.envelope.payload.status !== (attempt.status === "succeeded" ? "succeeded" : "failed")
      || !sameRef(receipt.envelope.payload.projectionRef, attempt.projectionRef)) throw new Error("MCP terminal attempt is missing its PublishReceipt");
  }
  return attempt;
}

export async function listMcpClaims(projectRoot, options = {}) {
  const claims = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpDispatchClaim)
    .filter((item) => !options.projectionRef || sameRef(item.envelope.payload.projectionRef, options.projectionRef))
    .sort((left, right) => left.envelope.payload.attemptNumber - right.envelope.payload.attemptNumber);
  for (const item of claims) await verifyMcpDispatchClaim(projectRoot, item.envelope.artifactRef);
  return claims.map((item) => ({ claim: item.envelope.payload, claimRef: item.envelope.artifactRef }));
}

export async function listMcpAttempts(projectRoot, options = {}) {
  const attempts = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpAttemptReceipt)
    .filter((item) => !options.projectionRef || sameRef(item.envelope.payload.projectionRef, options.projectionRef))
    .sort((left, right) => left.envelope.payload.attemptNumber - right.envelope.payload.attemptNumber);
  for (const item of attempts) await verifyMcpAttemptReceipt(projectRoot, item.envelope.artifactRef);
  return attempts.map((item) => ({ attempt: item.envelope.payload, attemptRef: item.envelope.artifactRef }));
}

function nowFrom(options) {
  const value = typeof options.now === "function" ? options.now() : options.now || new Date().toISOString();
  assertDate(value, "dispatcher now");
  return new Date(value).toISOString();
}

function safeErrorCode(error) {
  const value = error?.code || error?.name;
  return typeof value === "string" && IDENTIFIER_PATTERN.test(value) ? value : "connector_error";
}

function retryAt(endedAt, attemptNumber, baseBackoffSeconds) {
  return new Date(Date.parse(endedAt) + baseBackoffSeconds * (2 ** Math.max(0, attemptNumber - 1)) * 1000).toISOString();
}

async function putClaim(root, dispatch, projectionRefValue, platformProfileRefValue, attemptNumber, claimedAt, leaseSeconds) {
  const claim = {
    kind: ARTIFACT_KINDS.mcpDispatchClaim,
    contractVersion: WORLD_OS_VERSION,
    claimId: claimIdentity({ projectionRef: projectionRefValue, attemptNumber }),
    version: 1,
    projectionRef: projectionRefValue,
    platformProfileRef: platformProfileRefValue,
    dispatchId: dispatch.dispatchId,
    idempotencyKey: dispatch.idempotencyKey,
    attemptNumber,
    claimedAt,
    leaseUntil: new Date(Date.parse(claimedAt) + leaseSeconds * 1000).toISOString(),
    claimedBy: { kind: "codex", id: "codex.root" },
    status: "active"
  };
  assertMcpDispatchClaimContract(claim);
  const stored = await putArtifact(root, claim, {
    kind: ARTIFACT_KINDS.mcpDispatchClaim,
    id: claim.claimId,
    version: claim.version,
    status: "candidate",
    createdAt: claim.claimedAt,
    createdBy: "codex.root"
  });
  return { claim, claimRef: stored.envelope.artifactRef };
}

async function putAttempt(root, attempt) {
  assertMcpAttemptReceiptContract(attempt);
  const stored = await putArtifact(root, attempt, {
    kind: ARTIFACT_KINDS.mcpAttemptReceipt,
    id: attempt.attemptId,
    version: attempt.version,
    status: attempt.status === "succeeded" ? "succeeded" : attempt.status === "rejected" ? "failed" : attempt.status === "dead_letter" ? "failed" : "candidate",
    createdAt: attempt.endedAt,
    createdBy: "codex.root"
  });
  return stored.envelope.artifactRef;
}

function assertConnector(connector) {
  if (!isPlainObject(connector) || connector.kind !== "world_os_mcp_connector" || connector.trusted !== true
    || typeof connector.id !== "string" || !IDENTIFIER_PATTERN.test(connector.id) || typeof connector.call !== "function") {
    throw new TypeError("MCP connector must declare kind=world_os_mcp_connector, trusted=true, an identifier and call(dispatch, { signal })");
  }
}

export async function dispatchOutbox(projectRoot, platform, connector, options = {}) {
  const maxAttempts = Number(options.maxAttempts ?? 3);
  const leaseSeconds = Number(options.leaseSeconds ?? 300);
  const baseBackoffSeconds = Number(options.baseBackoffSeconds ?? 30);
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 10) throw new TypeError("maxAttempts must be an integer from 1 to 10");
  if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 86_400) throw new TypeError("leaseSeconds must be an integer from 1 to 86400");
  if (!Number.isSafeInteger(baseBackoffSeconds) || baseBackoffSeconds < 0 || baseBackoffSeconds > 86_400) throw new TypeError("baseBackoffSeconds must be an integer from 0 to 86400");
  const outbox = await listOutbox(projectRoot, platform);
  const pending = outbox.entries.filter((entry) => entry.status === "pending");
  if (!pending.length) return { kind: "world_os_mcp_dispatch_run", mode: "idle", pending: 0, dispatched: 0, skipped: [], attempts: [], attemptResults: [], receipts: [] };
  if (options.dryRun === true) return { kind: "world_os_mcp_dispatch_run", mode: "dry_run", pending: pending.length, dispatched: 0, skipped: pending.map((entry) => entry.projectionRef), attempts: [], attemptResults: [], receipts: [] };
  if (options.allowNetwork !== true) throw new Error("MCP network dispatch is disabled; pass allowNetwork=true only with a trusted connector");
  assertConnector(connector);
  const now = nowFrom(options);
  const timeoutMs = Number(options.timeoutMs ?? 60_000);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) throw new TypeError("timeoutMs must be an integer from 1 to 300000");
  const attempts = [];
  const attemptResults = [];
  const receipts = [];
  const skipped = [];
  for (const entry of pending) {
    const existingAttempts = await listMcpAttempts(projectRoot, { projectionRef: entry.projectionRef });
    const existingClaims = await listMcpClaims(projectRoot, { projectionRef: entry.projectionRef });
    const latestAttempt = existingAttempts.at(-1)?.attempt || null;
    const latestClaim = existingClaims.at(-1)?.claim || null;
    if (latestAttempt && ["succeeded", "rejected", "dead_letter"].includes(latestAttempt.status)) {
      skipped.push({ projectionRef: entry.projectionRef, reason: latestAttempt.status });
      continue;
    }
    if (latestAttempt?.nextRetryAt && Date.parse(latestAttempt.nextRetryAt) > Date.parse(now)) {
      skipped.push({ projectionRef: entry.projectionRef, reason: "backoff", nextRetryAt: latestAttempt.nextRetryAt });
      continue;
    }
    let attemptNumber = Math.max(latestAttempt?.attemptNumber || 0, latestClaim?.attemptNumber || 0) + 1;
    if (latestClaim && !latestAttempt && Date.parse(latestClaim.leaseUntil) > Date.parse(now)) {
      skipped.push({ projectionRef: entry.projectionRef, reason: "claim_active", leaseUntil: latestClaim.leaseUntil });
      continue;
    }
    if (attemptNumber > maxAttempts) {
      skipped.push({ projectionRef: entry.projectionRef, reason: "max_attempts" });
      continue;
    }
    const dispatch = entry.dispatch;
    const claimResult = await putClaim(projectRoot, dispatch, entry.projectionRef, outbox.platformProfileRef, attemptNumber, now, leaseSeconds);
    const startedAt = now;
    let endedAt = startedAt;
    let attemptStatus;
    let response = null;
    let error = null;
    const controller = new AbortController();
    let timeoutId;
    try {
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          reject(Object.assign(new Error(`MCP connector timed out after ${timeoutMs}ms`), { code: "connector_timeout" }));
        }, timeoutMs);
      });
      response = await Promise.race([Promise.resolve(connector.call(structuredClone(dispatch), { signal: controller.signal })), timeout]);
      validatePlatformResponse(response);
      endedAt = new Date(Math.max(Date.parse(startedAt), Date.parse(response.receivedAt))).toISOString();
      const storedReceipt = await recordPublishReceipt(projectRoot, await findArtifact(projectRoot, entry.projectionRef), response);
      receipts.push(storedReceipt.envelope.artifactRef);
      attemptStatus = response.status === "accepted" ? "succeeded" : "rejected";
    } catch (caught) {
      error = caught;
      endedAt = nowFrom(options);
      attemptStatus = attemptNumber >= maxAttempts ? "dead_letter" : "failed";
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
    const attempt = {
      kind: ARTIFACT_KINDS.mcpAttemptReceipt,
      contractVersion: WORLD_OS_VERSION,
      attemptId: attemptIdentity(claimResult.claimRef),
      version: 1,
      claimRef: claimResult.claimRef,
      projectionRef: entry.projectionRef,
      platformProfileRef: outbox.platformProfileRef,
      dispatchId: dispatch.dispatchId,
      idempotencyKey: dispatch.idempotencyKey,
      attemptNumber,
      startedAt,
      endedAt,
      status: attemptStatus,
      platformRecordId: response ? response.platformRecordId : null,
      responseHash: response
        ? (HASH_PATTERN.test(response.responseHash || "")
          ? response.responseHash
          : sha256Canonical({ status: response.status, platformRecordId: response.platformRecordId, idempotencyKey: response.idempotencyKey, receivedAt: response.receivedAt }))
        : null,
      errorCode: error ? safeErrorCode(error) : null,
      errorHash: error ? sha256Canonical({ message: String(error?.message || error) }) : null,
      nextRetryAt: error && attemptStatus === "failed" ? retryAt(endedAt, attemptNumber, baseBackoffSeconds) : null,
      recordedBy: { kind: "codex", id: "codex.root" }
    };
    const attemptRef = await putAttempt(projectRoot, attempt);
    attempts.push(attemptRef);
    attemptResults.push({ attemptRef, status: attempt.status, attemptNumber: attempt.attemptNumber, projectionRef: attempt.projectionRef });
  }
  return { kind: "world_os_mcp_dispatch_run", mode: "network_opt_in", pending: pending.length, dispatched: attempts.length, skipped, attempts, attemptResults, receipts };
}
