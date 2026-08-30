import { resolve } from "node:path";
import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { collectContractRefs } from "../../cineweave-runtime/src/artifact-graph.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_OS_IMPLEMENTATION_VERSION, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, sameRef } from "./json.mjs";
import { inspectPortfolio, advancePortfolio } from "./portfolio.mjs";
import { dispatchOutbox, verifyMcpAttemptReceipt } from "./mcp.mjs";
import { listOutbox } from "./outbox.mjs";
import { runLlmShadow, verifyLlmShadowReceipt } from "./shadow.mjs";
import { verifyWorldOsProject } from "./store.mjs";
import { assertCodexBrainRunReceiptContract, healthSummary } from "./brain-contract.mjs";
import { listWorldRegistrations } from "./registry.mjs";
import { assertPortfolioRunReceiptContract } from "./portfolio-contract.mjs";
import { scanTriggerCatalog } from "./triggers.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;

function nowIso(value) {
  const candidate = typeof value === "function" ? value() : value || new Date().toISOString();
  if (typeof candidate !== "string" || Number.isNaN(Date.parse(candidate))) throw new TypeError("Codex Brain clock must be a valid ISO date-time");
  return new Date(candidate).toISOString();
}

function exactDocumentRef(document, kind, label) {
  const value = document?.artifactRef || document;
  if (isExactRef(value)) {
    if (value.kind !== kind) throw new TypeError(`${label} must reference ${kind}`);
    return value;
  }
  if (document?.kind !== kind || typeof document?.[kind === ARTIFACT_KINDS.simulationRequest ? "requestId" : "policyId"] !== "string") {
    throw new TypeError(`${label} must be an exact stored ${kind} document or reference`);
  }
  const idKey = kind === ARTIFACT_KINDS.simulationRequest ? "requestId" : "policyId";
  return exactRef(kind, document[idKey], document.version, document);
}

function shadowIdentity(input) {
  const requestRef = exactDocumentRef(input.requestDocument, ARTIFACT_KINDS.simulationRequest, "Codex Brain shadow request");
  const policyRef = exactDocumentRef(input.policyDocument, ARTIFACT_KINDS.providerPolicy, "Codex Brain shadow policy");
  const providerId = input.provider?.id;
  if (typeof providerId !== "string" || !IDENTIFIER_PATTERN.test(providerId)) throw new TypeError("Codex Brain shadow provider id is invalid");
  return {
    requestRef,
    policyRef,
    providerId,
    forceRetry: input.forceRetry === true,
    allowNetwork: input.allowNetwork === true
  };
}

async function loadPlatform(root, value, label) {
  const reference = value?.artifactRef
    || (value?.kind === ARTIFACT_KINDS.platformProfile && typeof value.profileId === "string"
      ? exactRef(ARTIFACT_KINDS.platformProfile, value.profileId, value.version, value)
      : value);
  if (!isExactRef(reference) || reference.kind !== ARTIFACT_KINDS.platformProfile) throw new TypeError(`${label} must be an exact platform profile reference or document`);
  const item = await findArtifact(root, reference);
  if (!sameRef(item.envelope.artifactRef, reference) || item.envelope.payload?.kind !== ARTIFACT_KINDS.platformProfile) throw new Error(`${label} is not the exact stored platform profile`);
  return { platform: item.envelope.payload, profileRef: item.envelope.artifactRef };
}

async function resolvePlatforms(root, workspace, dispatchOptions, worldIds) {
  if (dispatchOptions === false) return [];
  const values = [];
  if (dispatchOptions?.platform) values.push(dispatchOptions.platform);
  if (Array.isArray(dispatchOptions?.platforms)) values.push(...dispatchOptions.platforms);
  if (dispatchOptions?.platformRef) values.push(dispatchOptions.platformRef);
  if (!values.length) {
    values.push(workspace.integrations?.mcp?.profileRef);
    const registrations = await listWorldRegistrations(root);
    const latestByWorld = new Map();
    for (const item of registrations) {
      if (!worldIds.includes(item.registration.worldId) || item.registration.status !== "runnable") continue;
      const current = latestByWorld.get(item.registration.worldId);
      if (!current || item.registration.version > current.registration.version) latestByWorld.set(item.registration.worldId, item);
    }
    for (const worldId of worldIds) {
      const registration = latestByWorld.get(worldId)?.registration;
      if (registration?.platformProfileRef) values.push(registration.platformProfileRef);
    }
  }
  const resolved = [];
  const seen = new Set();
  for (const value of values) {
    const loaded = await loadPlatform(root, value, "Codex Brain dispatch platform");
    const key = `${loaded.profileRef.kind}/${loaded.profileRef.id}@${loaded.profileRef.version}/${loaded.profileRef.contentHash}`;
    if (!seen.has(key)) {
      seen.add(key);
      resolved.push(loaded);
    }
  }
  return resolved;
}

function dispatchMode(dispatchOptions) {
  if (dispatchOptions === false) return "disabled";
  return dispatchOptions?.allowNetwork === true && dispatchOptions?.dryRun !== true ? "network_opt_in" : "dry_run";
}

function dispatchSummary(mode) {
  return {
    status: mode === "disabled" ? "disabled" : mode === "network_opt_in" ? "network_opt_in" : "dry_run",
    profileRefs: [],
    pendingProjectionRefs: [],
    pendingCount: 0,
    dispatchedCount: 0,
    skippedCount: 0,
    failureCount: 0,
    attemptRefs: [],
    publishReceiptRefs: []
  };
}

function appendUniqueRef(target, ref) {
  const key = `${ref.kind}/${ref.id}@${ref.version}/${ref.contentHash}`;
  if (!target.some((item) => `${item.kind}/${item.id}@${item.version}/${item.contentHash}` === key)) target.push(ref);
}

async function runDispatch(root, platforms, dispatchOptions, mode, defaultNow) {
  const summary = dispatchSummary(mode);
  summary.profileRefs = platforms.map((item) => item.profileRef);
  if (mode === "disabled") return summary;
  for (const { platform } of platforms) {
    try {
      const before = await listOutbox(root, platform);
      for (const entry of before.entries.filter((item) => item.status === "pending")) appendUniqueRef(summary.pendingProjectionRefs, entry.projectionRef);
      const result = await dispatchOutbox(root, platform, dispatchOptions?.connector || null, {
        allowNetwork: mode === "network_opt_in",
        dryRun: mode === "dry_run",
        maxAttempts: Number(dispatchOptions?.maxAttempts ?? 3),
        leaseSeconds: Number(dispatchOptions?.leaseSeconds ?? 300),
        baseBackoffSeconds: Number(dispatchOptions?.baseBackoffSeconds ?? 30),
        timeoutMs: Number(dispatchOptions?.timeoutMs ?? 60_000),
        now: dispatchOptions?.now || defaultNow
      });
      summary.pendingCount += result.pending || 0;
      summary.dispatchedCount += result.dispatched || 0;
      summary.skippedCount += result.skipped?.length || 0;
      for (const ref of result.attempts || []) appendUniqueRef(summary.attemptRefs, ref);
      for (const ref of result.receipts || []) appendUniqueRef(summary.publishReceiptRefs, ref);
      summary.failureCount += (result.attemptResults || []).filter((item) => item.status !== "succeeded").length;
      if (result.mode === "idle" && summary.status !== "failed") summary.status = "idle";
    } catch {
      summary.failureCount += 1;
      summary.status = "failed";
    }
  }
  if (summary.failureCount > 0) summary.status = "failed";
  return summary;
}

function outcomeFor(portfolio, shadowFailureCount, dispatch) {
  if (shadowFailureCount > 0) return { status: "blocked", stopReason: "llm_shadow_failed" };
  if (dispatch.failureCount > 0) {
    const deadLetter = (dispatch.attemptRecords || []).some((attempt) => attempt.status === "dead_letter");
    return { status: "blocked", stopReason: deadLetter ? "mcp_dead_letter" : "mcp_dispatch_failed" };
  }
  if (portfolio.status === "stale") return { status: "stale", stopReason: "stale_after_race" };
  if (portfolio.status === "blocked") {
    const blockedRound = portfolio.rounds.find((round) => ["needs_human_gate", "awaiting_codex_template", "committed_projection_pending", "all_candidates_rejected"].includes(round.stopReason));
    return {
      status: "blocked",
      stopReason: blockedRound?.stopReason || "portfolio_blocked"
    };
  }
  if (portfolio.committedSteps > 0) return { status: "advanced", stopReason: portfolio.stopReason };
  return { status: "stopped", stopReason: portfolio.stopReason };
}

function minIso(values) {
  return new Date(Math.min(...values.map((value) => Date.parse(value)))).toISOString();
}

function maxIso(values) {
  return new Date(Math.max(...values.map((value) => Date.parse(value)))).toISOString();
}

function stageTimes(portfolio, shadows, dispatch, now) {
  const starts = [portfolio.startedAt, now];
  const ends = [portfolio.endedAt];
  for (const shadow of shadows) {
    starts.push(shadow.requestedAt);
    ends.push(shadow.completedAt);
  }
  for (const attempt of dispatch.attemptRecords || []) {
    starts.push(attempt.startedAt);
    ends.push(attempt.endedAt);
  }
  return { startedAt: minIso(starts), endedAt: maxIso(ends) };
}

async function loadAttemptRecords(root, attemptRefs) {
  const records = [];
  for (const ref of attemptRefs) {
    const item = await findArtifact(root, ref);
    await verifyMcpAttemptReceipt(root, ref);
    records.push(item.envelope.payload);
  }
  return records;
}

export async function runCodexBrainCycle(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const maxCycles = Number(options.maxCycles ?? 10);
  if (!Number.isSafeInteger(maxCycles) || maxCycles < 1 || maxCycles > 100) throw new TypeError("Codex Brain maxCycles must be an integer from 1 to 100");
  if (options.runKey !== undefined && (typeof options.runKey !== "string" || !options.runKey.trim() || options.runKey.length > 240)) throw new TypeError("Codex Brain runKey must contain 1 to 240 characters");
  const plan = await inspectPortfolio(root, { worldIds: options.worldIds });
  const workspaceItem = await findArtifact(root, plan.workspaceRef);
  const workspace = workspaceItem.envelope.payload;
  const dispatchOptions = options.dispatch === false ? false : options.dispatch || {};
  const mcpMode = dispatchMode(dispatchOptions);
  const platforms = await resolvePlatforms(root, workspace, dispatchOptions, plan.worldIds);
  const shadowInputs = Array.isArray(options.shadowRuns) ? options.shadowRuns : [];
  const shadowPlan = shadowInputs.map(shadowIdentity);
  const resumePortfolioValue = options.resumePortfolioRef?.artifactRef
    || options.resumePortfolioRef?.receiptRef
    || options.resumePortfolioRef
    || null;
  if (resumePortfolioValue && (!isExactRef(resumePortfolioValue) || resumePortfolioValue.kind !== ARTIFACT_KINDS.portfolioRunReceipt)) throw new TypeError("Codex Brain resumePortfolioRef must be an exact PortfolioRunReceipt reference");
  const brainIdentity = {
    workspaceRef: plan.workspaceRef,
    worldIds: plan.worldIds,
    startHeads: options.runKey ? null : plan.heads.map(({ worldId, stateRef, commitRef }) => ({ worldId, stateRef, commitRef })),
    maxCycles,
    runKey: options.runKey || null,
    resumePortfolioRef: resumePortfolioValue,
    shadowPlan,
    mcpMode,
    profileRefs: platforms.map((item) => item.profileRef),
    connectorId: dispatchOptions?.connector?.id || null
  };
  const brainRunId = `brain-run.${sha256Canonical(brainIdentity).slice("sha256:".length, "sha256:".length + 32)}`;
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.codexBrainRunReceipt, brainRunId, 1);
  if (existing) {
    const receipt = assertCodexBrainRunReceiptContract(existing.envelope.payload);
    if (!sameRef(existing.envelope.artifactRef, exactRef(ARTIFACT_KINDS.codexBrainRunReceipt, brainRunId, 1, receipt))) throw new Error("CodexBrainRunReceipt identity is not content-addressed exactly");
    const health = await verifyWorldOsProject(root);
    return { ...receipt, receiptRef: existing.envelope.artifactRef, idempotent: true, health };
  }

  const clock = nowIso(options.now);
  const preflight = await verifyWorldOsProject(root);
  const preflightSummary = healthSummary(preflight);
  const shadowRunRefs = [];
  const shadowReceipts = [];
  let shadowFailureCount = 0;
  for (const input of shadowInputs) {
    try {
      const result = await runLlmShadow(root, input.requestDocument, input.policyDocument, input.provider, {
        allowNetwork: input.allowNetwork === true || options.allowNetwork === true,
        forceRetry: input.forceRetry === true,
        now: input.now || options.now
      });
      appendUniqueRef(shadowRunRefs, result.receiptRef);
      shadowReceipts.push(result);
      if (result.status === "failed") shadowFailureCount += 1;
    } catch {
      shadowFailureCount += 1;
      // A shadow provider is deliberately fail-soft: no proposal is promoted
      // and the bounded Portfolio simulation can still be audited/resumed.
    }
  }

  let portfolio;
  if (resumePortfolioValue) {
    const portfolioItem = await findArtifact(root, resumePortfolioValue);
    const resumed = assertPortfolioRunReceiptContract(portfolioItem.envelope.payload);
    if (!sameRef(portfolioItem.envelope.artifactRef, resumePortfolioValue)
      || !sameRef(resumed.workspaceRef, plan.workspaceRef)
      || resumed.worldIds.join("\u0000") !== plan.worldIds.join("\u0000")) throw new Error("Codex Brain resume Portfolio is not bound to the selected workspace/world set");
    portfolio = { ...resumed, receiptRef: portfolioItem.envelope.artifactRef, idempotent: true };
  } else {
    portfolio = await advancePortfolio(root, { worldIds: plan.worldIds, maxCycles });
  }
  const dispatch = await runDispatch(root, platforms, dispatchOptions, mcpMode, clock);
  dispatch.attemptRecords = await loadAttemptRecords(root, dispatch.attemptRefs);
  const postflight = await verifyWorldOsProject(root);
  const result = outcomeFor(portfolio, shadowFailureCount, dispatch);
  const times = stageTimes(portfolio, shadowReceipts, dispatch, clock);
  const receipt = {
    kind: ARTIFACT_KINDS.codexBrainRunReceipt,
    contractVersion: WORLD_OS_VERSION,
    brainRunId,
    version: 1,
    implementationVersion: WORLD_OS_IMPLEMENTATION_VERSION,
    workspaceRef: plan.workspaceRef,
    worldIds: plan.worldIds,
    maxCycles,
    simulationPolicy: "weighted_fair_deficit_round_robin",
    llmMode: shadowInputs.length ? "proposal_only" : "disabled",
    mcpMode,
    startedAt: times.startedAt,
    endedAt: times.endedAt,
    writer: { kind: "codex", id: "codex.root" },
    portfolioRunRef: portfolio.receiptRef,
    shadowRunRefs,
    shadowFailureCount,
    dispatch: {
      status: dispatch.status,
      profileRefs: dispatch.profileRefs,
      pendingProjectionRefs: dispatch.pendingProjectionRefs,
      pendingCount: dispatch.pendingCount,
      dispatchedCount: dispatch.dispatchedCount,
      skippedCount: dispatch.skippedCount,
      failureCount: dispatch.failureCount,
      attemptRefs: dispatch.attemptRefs,
      publishReceiptRefs: dispatch.publishReceiptRefs
    },
    preflight: preflightSummary,
    postflight: healthSummary(postflight),
    status: result.status,
    stopReason: result.stopReason
  };
  const postflightBeforeReceipt = receipt.postflight;
  const aggregateReferenceCount = collectContractRefs(receipt).length;
  receipt.postflight = {
    ...postflightBeforeReceipt,
    artifactCount: postflightBeforeReceipt.artifactCount + 1,
    referenceCount: postflightBeforeReceipt.referenceCount + aggregateReferenceCount
  };
  assertCodexBrainRunReceiptContract(receipt);
  const stored = await putArtifact(root, receipt, {
    kind: ARTIFACT_KINDS.codexBrainRunReceipt,
    id: receipt.brainRunId,
    version: receipt.version,
    status: receipt.status === "blocked" || receipt.status === "failed" ? "blocked" : "candidate",
    createdAt: receipt.endedAt,
    createdBy: "codex.root"
  });
  const health = await verifyWorldOsProject(root);
  const finalSummary = healthSummary(health);
  if (JSON.stringify(finalSummary) !== JSON.stringify(receipt.postflight)) throw new Error("CodexBrainRunReceipt postflight summary does not match final project health");
  return { ...receipt, receiptRef: stored.envelope.artifactRef, idempotent: false, health };
}

export async function listCodexBrainRuns(projectRoot) {
  await verifyWorldOsProject(projectRoot);
  const runs = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.codexBrainRunReceipt)
    .sort((left, right) => left.envelope.payload.startedAt.localeCompare(right.envelope.payload.startedAt)
      || left.envelope.payload.brainRunId.localeCompare(right.envelope.payload.brainRunId));
  for (const item of runs) assertCodexBrainRunReceiptContract(item.envelope.payload);
  return runs.map((item) => ({ receipt: item.envelope.payload, receiptRef: item.envelope.artifactRef }));
}

function latestWorldCatalog(artifacts, worldId) {
  const matches = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.triggerCatalog
      && item.envelope.payload.worldId === worldId)
    .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version);
  if (!matches.length) throw new Error(`No ${worldId} trigger catalog is available`);
  const latest = matches[0];
  if (matches.filter((item) => item.envelope.artifactRef.version === latest.envelope.artifactRef.version).length !== 1) {
    throw new Error(`Latest ${worldId} trigger catalog is ambiguous`);
  }
  return latest;
}

function compactTriggerEntry(entry) {
  return {
    triggerId: entry.triggerId,
    eventId: entry.eventId,
    priority: entry.priority,
    conditionMet: entry.conditionMet,
    transitionEligible: entry.transitionEligible,
    status: entry.status,
    gatePolicy: entry.gatePolicy,
    requiredRuleRefs: entry.requiredRuleRefs,
    timing: entry.timing
  };
}

function emptyOutboxStatus(profileRef) {
  return {
    platformProfileRef: profileRef,
    entryCount: 0,
    pendingCount: 0,
    succeededCount: 0,
    failedCount: 0,
    pendingProjectionRefs: []
  };
}

/**
 * Read-only decision surface for operators and Codex itself.
 *
 * It deliberately performs no simulation, LLM call, claim, acknowledgement or
 * write. The result exposes the exact Portfolio heads, the latest trigger scan,
 * pending projection counts and the latest Brain receipt so a caller can make
 * an explicit bounded `brain-run` decision with no hidden in-memory state.
 */
export async function inspectCodexBrain(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const health = await verifyWorldOsProject(root);
  const plan = await inspectPortfolio(root, { worldIds: options.worldIds });
  const workspaceItem = await findArtifact(root, plan.workspaceRef);
  const workspace = workspaceItem.envelope.payload;
  const artifacts = await listArtifacts(root);
  const platforms = await resolvePlatforms(root, workspace, {}, plan.worldIds);
  const outboxViews = [];
  for (const { platform, profileRef } of platforms) {
    const view = await listOutbox(root, platform);
    outboxViews.push({ view, profileRef });
  }
  const brainItems = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.codexBrainRunReceipt)
    .filter((item) => item.envelope.payload.worldIds.some((worldId) => plan.worldIds.includes(worldId)));
  const latestBrainItem = brainItems
    .sort((left, right) => right.envelope.payload.endedAt.localeCompare(left.envelope.payload.endedAt)
      || right.envelope.payload.brainRunId.localeCompare(left.envelope.payload.brainRunId))[0] || null;
  if (latestBrainItem) assertCodexBrainRunReceiptContract(latestBrainItem.envelope.payload);
  const latestBrainByWorld = new Map();
  for (const item of brainItems) {
    for (const worldId of item.envelope.payload.worldIds) {
      if (!plan.worldIds.includes(worldId)) continue;
      const current = latestBrainByWorld.get(worldId);
      if (!current
        || item.envelope.payload.endedAt > current.envelope.payload.endedAt
        || (item.envelope.payload.endedAt === current.envelope.payload.endedAt
          && item.envelope.payload.brainRunId > current.envelope.payload.brainRunId)) latestBrainByWorld.set(worldId, item);
    }
  }

  const worldStatuses = [];
  let totalCandidates = 0;
  let totalEligible = 0;
  let totalPending = 0;
  for (const head of plan.heads) {
    const catalogItem = latestWorldCatalog(artifacts, head.worldId);
    const stateItem = await findArtifact(root, head.stateRef);
    const scan = scanTriggerCatalog(catalogItem.envelope.payload, stateItem.envelope.payload);
    const outbox = [];
    const worldPendingProjectionRefs = [];
    for (const { view, profileRef } of outboxViews) {
      const status = emptyOutboxStatus(profileRef);
      for (const entry of view.entries) {
        const projectionItem = await findArtifact(root, entry.projectionRef);
        // PlatformProjection keeps the public world id inside its bounded
        // payload; do not infer it from the projection id or platform name.
        if (projectionItem.envelope.payload?.payload?.worldId !== head.worldId) continue;
        status.entryCount += 1;
        if (entry.status === "pending") {
          status.pendingCount += 1;
          status.pendingProjectionRefs.push(entry.projectionRef);
          worldPendingProjectionRefs.push(entry.projectionRef);
        } else if (entry.status === "succeeded") status.succeededCount += 1;
        else if (entry.status === "failed") status.failedCount += 1;
      }
      if (status.entryCount > 0) outbox.push(status);
    }
    totalCandidates += scan.candidateCount;
    totalEligible += scan.eligibleCount;
    totalPending += worldPendingProjectionRefs.length;
    worldStatuses.push({
      worldId: head.worldId,
      head: {
        stateRef: head.stateRef,
        commitRef: head.commitRef,
        sequence: head.sequence,
        clockAt: head.clockAt
      },
      triggerCatalogRef: catalogItem.envelope.artifactRef,
      triggerScan: {
        stateId: scan.stateId,
        stateVersion: scan.stateVersion,
        sequence: scan.sequence,
        candidateCount: scan.candidateCount,
        eligibleCount: scan.eligibleCount,
        entries: scan.entries.map(compactTriggerEntry)
      },
      outbox,
      pendingProjectionRefs: worldPendingProjectionRefs,
      latestBrainRunRef: latestBrainByWorld.get(head.worldId)?.envelope.artifactRef || null
    });
  }
  return {
    kind: "world_os_codex_brain_status",
    contractVersion: WORLD_OS_VERSION,
    workspaceRef: plan.workspaceRef,
    worldIds: plan.worldIds,
    health: healthSummary(health),
    worlds: worldStatuses,
    totals: {
      candidateCount: totalCandidates,
      eligibleCount: totalEligible,
      pendingProjectionCount: totalPending,
      blockedWorldCount: worldStatuses.filter((world) => world.triggerScan.entries.some((entry) => [
        "needs_human_gate", "awaiting_codex_template", "unknown_blocked"
      ].includes(entry.status))).length,
      waitingWorldCount: worldStatuses.filter((world) => world.triggerScan.entries.some((entry) => [
        "cooldown_active", "not_due_yet"
      ].includes(entry.status))).length
    },
    latestBrainRun: latestBrainItem
      ? {
        receiptRef: latestBrainItem.envelope.artifactRef,
        brainRunId: latestBrainItem.envelope.payload.brainRunId,
        status: latestBrainItem.envelope.payload.status,
        stopReason: latestBrainItem.envelope.payload.stopReason,
        endedAt: latestBrainItem.envelope.payload.endedAt
      }
      : null
  };
}
