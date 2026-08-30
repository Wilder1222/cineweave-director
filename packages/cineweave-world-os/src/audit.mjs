import { resolve } from "node:path";
import { listArtifacts } from "../../cineweave-runtime/src/artifact-store.mjs";
import { ARTIFACT_KINDS } from "./constants.mjs";
import { deriveStreamHead, verifyWorldOsProject } from "./store.mjs";
import { deriveCanonHead } from "./canon.mjs";
import { listExternalSignals, listExternalSignalUses } from "./signals.mjs";

function refKey(ref) {
  return ref ? `${ref.kind}/${ref.id}@${ref.version}/${ref.contentHash}` : null;
}

export async function auditWorldOsProject(projectRoot) {
  const root = resolve(projectRoot);
  const artifacts = await listArtifacts(root);
  const commits = artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.commit);
  const committedStates = new Set(commits.flatMap((item) => item.envelope.payload.outputStateRefs || []).map(refKey));
  const committedDecisions = new Set(commits.map((item) => refKey(item.envelope.payload.decisionRef)));
  const committedSelections = new Set(commits.map((item) => refKey(item.envelope.payload.selectionRef)).filter(Boolean));
  const stagedStates = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.state && item.envelope.payload.sequence > 0)
    .filter((item) => !committedStates.has(refKey(item.envelope.artifactRef)))
    .map((item) => item.envelope.artifactRef);
  const stagedDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.decision)
    .filter((item) => item.envelope.payload.status === "accepted_simulation")
    .filter((item) => !committedDecisions.has(refKey(item.envelope.artifactRef)))
    .map((item) => item.envelope.artifactRef);
  const gatedDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.decision)
    .filter((item) => item.envelope.payload.status === "needs_human_gate")
    .map((item) => item.envelope.artifactRef);
  const uncommittedBranchSets = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.branchSet)
    .filter((item) => item.envelope.payload.selectionStatus !== "selected_but_gated")
    .filter((item) => !committedSelections.has(refKey(item.envelope.artifactRef)))
    .map((item) => ({
      branchSetRef: item.envelope.artifactRef,
      selectionStatus: item.envelope.payload.selectionStatus
    }));
  const gatedBranchSets = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.branchSet)
    .filter((item) => item.envelope.payload.selectionStatus === "selected_but_gated")
    .map((item) => item.envelope.artifactRef);
  const latestWorkItems = new Map();
  for (const item of artifacts.filter((candidate) => candidate.envelope.payload?.kind === ARTIFACT_KINDS.templateWorkItem)) {
    const current = latestWorkItems.get(item.envelope.payload.workItemId);
    if (!current || item.envelope.payload.version > current.envelope.payload.version) latestWorkItems.set(item.envelope.payload.workItemId, item);
  }
  const openTemplateWorkItems = [...latestWorkItems.values()]
    .filter((item) => item.envelope.payload.status === "open")
    .map((item) => item.envelope.artifactRef);
  const gateRequests = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.gateRequest)
    .map((item) => item.envelope.artifactRef);
  const gateDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.gateDecision)
    .map((item) => ({ ref: item.envelope.artifactRef, decision: item.envelope.payload.decision, status: item.envelope.payload.status }));
  const externalSignals = await listExternalSignals(root);
  const externalSignalUses = await listExternalSignalUses(root);
  const portfolioRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.portfolioRunReceipt)
    .map((item) => ({ ref: item.envelope.artifactRef, status: item.envelope.payload.status, stopReason: item.envelope.payload.stopReason }));
  const mcpClaims = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpDispatchClaim)
    .map((item) => ({ ref: item.envelope.artifactRef, projectionRef: item.envelope.payload.projectionRef, attemptNumber: item.envelope.payload.attemptNumber, leaseUntil: item.envelope.payload.leaseUntil }));
  const mcpAttempts = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpAttemptReceipt)
    .map((item) => ({ ref: item.envelope.artifactRef, projectionRef: item.envelope.payload.projectionRef, attemptNumber: item.envelope.payload.attemptNumber, status: item.envelope.payload.status, nextRetryAt: item.envelope.payload.nextRetryAt }));
  const llmShadowRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.llmShadowReceipt)
    .map((item) => ({ ref: item.envelope.artifactRef, worldId: item.envelope.payload.worldId, providerId: item.envelope.payload.providerId, attemptNumber: item.envelope.payload.attemptNumber, status: item.envelope.payload.status }));
  const worldRegistrations = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldRegistration)
    .map((item) => ({ ref: item.envelope.artifactRef, worldId: item.envelope.payload.worldId, stage: item.envelope.payload.stage, status: item.envelope.payload.status }));
  const worldInceptionDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldInceptionDecision)
    .map((item) => ({ ref: item.envelope.artifactRef, registrationRef: item.envelope.payload.registrationRef, worldId: item.envelope.payload.worldId, decision: item.envelope.payload.decision, actor: item.envelope.payload.actor.id }));
  const brandEchoes = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEcho)
    .map((item) => ({ ref: item.envelope.artifactRef, echoId: item.envelope.payload.echoId, version: item.envelope.payload.version, worldIds: item.envelope.payload.worldIds, symbolId: item.envelope.payload.symbolId, status: item.envelope.payload.status }));
  const brandEchoDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEchoDecision)
    .map((item) => ({ ref: item.envelope.artifactRef, brandEchoRef: item.envelope.payload.brandEchoRef, decision: item.envelope.payload.decision, actor: item.envelope.payload.actor.id }));
  const productionSnapshots = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionContractSnapshot)
    .map((item) => ({ ref: item.envelope.artifactRef, contractKind: item.envelope.payload.contractKind, worldId: item.envelope.payload.worldId }));
  const productionSlices = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionSlice)
    .map((item) => ({ ref: item.envelope.artifactRef, sliceId: item.envelope.payload.sliceId, version: item.envelope.payload.version, worldId: item.envelope.payload.worldId, stage: item.envelope.payload.stage, status: item.envelope.payload.status }));
  const productionGateDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionGateDecision)
    .map((item) => ({ ref: item.envelope.artifactRef, sliceRef: item.envelope.payload.sliceRef, gate: item.envelope.payload.gate, decision: item.envelope.payload.decision, actor: item.envelope.payload.actor.id }));
  const productionMediaImports = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionMediaImport)
    .map((item) => ({
      ref: item.envelope.artifactRef,
      importId: item.envelope.payload.importId,
      worldId: item.envelope.payload.worldId,
      sliceRef: item.envelope.payload.sliceRef,
      executionReceiptRef: item.envelope.payload.executionReceiptRef,
      mediaImportRef: item.envelope.payload.mediaImportRef,
      status: item.envelope.payload.status
    }));
  const productionQaReviews = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionQaReview)
    .map((item) => ({
      ref: item.envelope.artifactRef,
      reviewId: item.envelope.payload.reviewId,
      worldId: item.envelope.payload.worldId,
      sliceRef: item.envelope.payload.sliceRef,
      decision: item.envelope.payload.decision,
      status: item.envelope.payload.status,
      actor: item.envelope.payload.actor.id
    }));
  const approvedAssets = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.approvedAsset)
    .map((item) => ({
      ref: item.envelope.artifactRef,
      approvedAssetId: item.envelope.payload.approvedAssetId,
      worldId: item.envelope.payload.worldId,
      sliceRef: item.envelope.payload.sliceRef,
      sourceQaReviewRef: item.envelope.payload.sourceQaReviewRef,
      status: item.envelope.payload.status,
      visibility: item.envelope.payload.visibility
    }));
  const releaseReceipts = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.releaseReceipt)
    .map((item) => ({
      ref: item.envelope.artifactRef,
      releaseId: item.envelope.payload.releaseId,
      worldId: item.envelope.payload.worldId,
      sliceRef: item.envelope.payload.sliceRef,
      approvedAssetRefs: item.envelope.payload.approvedAssetRefs,
      status: item.envelope.payload.status,
      visibility: item.envelope.payload.visibility,
      public: item.envelope.payload.public
    }));
  const productionExecutionRequests = artifacts
    .filter((item) => item.envelope.payload?.kind === "cineweave_execution_request")
    .map((item) => ({
      ref: item.envelope.artifactRef,
      requestId: item.envelope.payload.requestId,
      sliceRef: item.envelope.payload.inputArtifactRefs?.find((ref) => ref.kind === ARTIFACT_KINDS.productionSlice) || null,
      executionMode: item.envelope.payload.executionMode,
      status: item.envelope.payload.status
    }));
  const productionExecutionReceipts = artifacts
    .filter((item) => item.envelope.payload?.kind === "cineweave_execution_receipt")
    .map((item) => ({
      ref: item.envelope.artifactRef,
      receiptId: item.envelope.payload.receiptId,
      requestRef: item.envelope.payload.requestArtifactRef,
      executionMode: item.envelope.payload.executionMode,
      status: item.envelope.payload.status
    }));
  const codexBrainRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.codexBrainRunReceipt)
    .map((item) => ({
      ref: item.envelope.artifactRef,
      brainRunId: item.envelope.payload.brainRunId,
      worldIds: item.envelope.payload.worldIds,
      status: item.envelope.payload.status,
      stopReason: item.envelope.payload.stopReason,
      portfolioRunRef: item.envelope.payload.portfolioRunRef,
      mcpMode: item.envelope.payload.mcpMode
    }));
  const streamKeys = new Set(commits.map((item) => `${item.envelope.payload.worldId}\u0000${item.envelope.payload.stream}`));
  const heads = [];
  for (const key of [...streamKeys].sort()) {
    const [worldId, stream] = key.split("\u0000");
    const head = await deriveStreamHead(root, worldId, stream);
    heads.push({ worldId, stream, commitRef: head.commitRef, stateRef: head.stateRef });
  }
  const canonWorlds = new Set(artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.continuityLedger).map((item) => item.envelope.payload.worldId));
  const canonHeads = [];
  for (const worldId of [...canonWorlds].sort()) {
    const head = await deriveCanonHead(root, worldId);
    canonHeads.push({ worldId, stream: "canon.main", ledgerRef: head.ledgerRef });
  }
  const health = await verifyWorldOsProject(root);
  return {
    status: "pass",
    policy: "classify_orphans_do_not_delete",
    heads,
    canonHeads,
    stagedStates,
    stagedDecisions,
    gatedDecisions,
    uncommittedBranchSets,
    gatedBranchSets,
    openTemplateWorkItems,
    gateRequests,
    gateDecisions,
    externalSignals: externalSignals.map((item) => item.signalRef),
    externalSignalUses: externalSignalUses.map((item) => item.useRef),
    portfolioRuns,
    mcpClaims,
    mcpAttempts,
    llmShadowRuns,
    worldRegistrations,
    worldInceptionDecisions,
    brandEchoes,
    brandEchoDecisions,
    productionSnapshots,
    productionSlices,
    productionGateDecisions,
    productionMediaImports,
    productionQaReviews,
    approvedAssets,
    releaseReceipts,
    productionExecutionRequests,
    productionExecutionReceipts,
    codexBrainRuns,
    summary: {
      terminalCommits: commits.length,
      stagedStates: stagedStates.length,
      stagedDecisions: stagedDecisions.length,
      uncommittedBranchSets: uncommittedBranchSets.length,
      gatedDecisions: gatedDecisions.length,
      gatedBranchSets: gatedBranchSets.length,
      openTemplateWorkItems: openTemplateWorkItems.length,
      gateRequests: gateRequests.length,
      gateDecisions: gateDecisions.length,
      externalSignals: externalSignals.length,
      externalSignalUses: externalSignalUses.length,
      portfolioRuns: portfolioRuns.length,
      mcpClaims: mcpClaims.length,
      mcpAttempts: mcpAttempts.length,
      llmShadowRuns: llmShadowRuns.length,
      worldRegistrations: worldRegistrations.length,
      worldInceptionDecisions: worldInceptionDecisions.length,
      brandEchoes: brandEchoes.length,
      brandEchoDecisions: brandEchoDecisions.length,
      productionSnapshots: productionSnapshots.length,
      productionSlices: productionSlices.length,
      productionGateDecisions: productionGateDecisions.length,
      productionMediaImports: productionMediaImports.length,
      productionQaReviews: productionQaReviews.length,
      approvedAssets: approvedAssets.length,
      releaseReceipts: releaseReceipts.length,
      productionExecutionRequests: productionExecutionRequests.length,
      productionExecutionReceipts: productionExecutionReceipts.length,
      codexBrainRuns: codexBrainRuns.length,
      canonHeads: canonHeads.length
    },
    health
  };
}
