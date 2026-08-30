import { resolve } from "node:path";
import { findArtifact, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { ARTIFACT_KINDS, WORLD_OS_IMPLEMENTATION_VERSION, WORLD_OS_VERSION } from "./constants.mjs";
import { adjudicateEvent } from "./engine.mjs";
import { branchSetRef, buildBranchSet, compileEventCandidates } from "./branches.mjs";
import { exactRef, sameRef } from "./json.mjs";
import { deriveStreamHead, runEventProposalDocument, verifyWorldOsProject } from "./store.mjs";
import { scanTriggerCatalog } from "./triggers.mjs";
import { listWorldRegistrations } from "./registry.mjs";

function latestPayload(artifacts, kind, predicate, label) {
  const matches = artifacts
    .filter((item) => item.envelope.payload?.kind === kind && predicate(item.envelope.payload))
    .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version);
  if (!matches.length) throw new Error(`No ${label} artifact is available`);
  const latestVersion = matches[0].envelope.artifactRef.version;
  if (matches.filter((item) => item.envelope.artifactRef.version === latestVersion).length !== 1) throw new Error(`Latest ${label} artifact is ambiguous`);
  return matches[0].envelope.payload;
}

async function loadRuntime(projectRoot, worldId) {
  const root = resolve(projectRoot);
  const artifacts = await listArtifacts(root);
  const workspace = latestPayload(artifacts, ARTIFACT_KINDS.workspace, () => true, "workspace");
  const worldCard = latestPayload(artifacts, ARTIFACT_KINDS.worldCard, (item) => item.worldId === worldId, `${worldId} world design`);
  const triggerCatalog = latestPayload(artifacts, ARTIFACT_KINDS.triggerCatalog, (item) => item.worldId === worldId, `${worldId} trigger catalog`);
  const actionCatalog = latestPayload(artifacts, ARTIFACT_KINDS.actionCatalog, (item) => item.worldId === worldId, `${worldId} action catalog`);
  const templateCatalog = latestPayload(artifacts, ARTIFACT_KINDS.eventTemplateCatalog, (item) => item.worldId === worldId, `${worldId} event template catalog`);
  const registrations = await listWorldRegistrations(root, { worldId });
  const latestRegistration = registrations.sort((left, right) => right.registration.version - left.registration.version)[0]?.registration;
  if (latestRegistration && latestRegistration.status !== "runnable") throw new Error(`World ${worldId} has a non-runnable latest WorldRegistration`);
  const platformRef = latestRegistration?.platformProfileRef || workspace.integrations.mcp.profileRef;
  const platformItem = await findArtifact(root, platformRef);
  const platform = platformItem.envelope.payload;
  const head = await deriveStreamHead(root, worldId, "simulation.main");
  const stateItem = await findArtifact(root, head?.stateRef || triggerCatalog.initialStateRef);
  const state = stateItem.envelope.payload;
  const parentCommit = head ? head.envelope.payload : null;
  return { root, workspace, worldCard, triggerCatalog, actionCatalog, templateCatalog, platform, head, state, parentCommit };
}

async function storeProposal(root, proposal) {
  return putArtifact(root, proposal, {
    kind: ARTIFACT_KINDS.proposal,
    id: proposal.proposalId,
    version: proposal.proposalVersion,
    status: "candidate",
    createdAt: proposal.proposedAt,
    createdBy: "codex.root"
  });
}

async function storeTemplateWorkItem(runtime, due) {
  const workItem = {
    kind: ARTIFACT_KINDS.templateWorkItem,
    contractVersion: WORLD_OS_VERSION,
    workItemId: `work.awaiting-codex-template.${runtime.worldCard.worldId.toLowerCase()}.s${String(runtime.state.sequence).padStart(6, "0")}.${due.triggerId}`,
    version: 1,
    worldId: runtime.worldCard.worldId,
    stream: "simulation.main",
    stateRef: exactRef(ARTIFACT_KINDS.state, runtime.state.stateId, runtime.state.version, runtime.state),
    simulationHeadRef: runtime.head?.commitRef || null,
    triggerCatalogRef: exactRef(ARTIFACT_KINDS.triggerCatalog, runtime.triggerCatalog.catalogId, runtime.triggerCatalog.version, runtime.triggerCatalog),
    triggerId: due.triggerId,
    requiredAction: "submit_event_template_catalog",
    status: "open",
    createdAt: runtime.state.clock.at,
    createdBy: { kind: "codex", id: "codex.root" },
    resolvedByCatalogRef: null
  };
  const stored = await putArtifact(runtime.root, workItem, {
    kind: ARTIFACT_KINDS.templateWorkItem,
    id: workItem.workItemId,
    version: workItem.version,
    status: "blocked",
    createdAt: workItem.createdAt,
    createdBy: "codex.root"
  });
  return stored.envelope.artifactRef;
}

function stopReasonFor(status) {
  if (status === "needs_human_gate") return "needs_human_gate";
  if (status === "rejected") return "all_candidates_rejected";
  if (status === "stale_after_race") return "stale_after_race";
  if (status === "committed_projection_pending") return "committed_projection_pending";
  return null;
}

export async function advanceWorld(projectRoot, worldId, options = {}) {
  const maxSteps = Number(options.maxSteps ?? 1);
  if (!Number.isSafeInteger(maxSteps) || maxSteps < 1 || maxSteps > 100) throw new TypeError("maxSteps must be an integer from 1 to 100");
  let runtime = await loadRuntime(projectRoot, worldId);
  const startStateRef = exactRef(ARTIFACT_KINDS.state, runtime.state.stateId, runtime.state.version, runtime.state);
  const startSequence = runtime.state.sequence;
  const startedAt = runtime.state.clock.at;
  const steps = [];
  let stopReason = "max_steps_reached";

  while (steps.length < maxSteps) {
    const scan = scanTriggerCatalog(runtime.triggerCatalog, runtime.state);
    const due = scan.entries.find((entry) => entry.conditionMet);
    if (!due) {
      stopReason = "no_due_trigger";
      break;
    }
    const trigger = runtime.triggerCatalog.triggers.find((item) => item.id === due.triggerId);
    const proposals = compileEventCandidates({
      workspace: runtime.workspace,
      worldCard: runtime.worldCard,
      state: runtime.state,
      parentCommitRef: runtime.head?.commitRef || null,
      platform: runtime.platform,
      triggerCatalog: runtime.triggerCatalog,
      actionCatalog: runtime.actionCatalog,
      templateCatalog: runtime.templateCatalog,
      triggerId: due.triggerId
    });
    if (!proposals.length) {
      const workItemRef = await storeTemplateWorkItem(runtime, due);
      steps.push({
        sequenceAttempted: runtime.state.sequence + 1,
        triggerId: due.triggerId,
        scanStatus: due.status,
        branchSetRef: null,
        selectedProposalRef: null,
        resultStatus: "awaiting_codex_template",
        decisionRef: null,
        commitRef: null,
        outputStateRef: null,
        projectionRef: null,
        workItemRef
      });
      stopReason = "awaiting_codex_template";
      break;
    }
    const storedCandidates = await Promise.all(proposals.map((proposal) => storeProposal(runtime.root, proposal)));
    const evaluations = proposals.map((proposal) => adjudicateEvent({
      workspace: runtime.workspace,
      worldCard: runtime.worldCard,
      state: runtime.state,
      proposal,
      parentCommit: runtime.parentCommit,
      triggerCatalog: runtime.triggerCatalog,
      actionCatalog: runtime.actionCatalog,
      templateCatalog: runtime.templateCatalog
    }));
    const branchSet = buildBranchSet({
      state: runtime.state,
      trigger,
      actionCatalog: runtime.actionCatalog,
      templateCatalog: runtime.templateCatalog,
      candidates: proposals,
      evaluations
    });
    const storedBranchSet = await putArtifact(runtime.root, branchSet, {
      kind: ARTIFACT_KINDS.branchSet,
      id: branchSet.branchSetId,
      version: branchSet.version,
      status: branchSet.selectionStatus === "selected_for_simulation" ? "candidate" : "blocked",
      createdAt: proposals[0].proposedAt,
      createdBy: "codex.root"
    });
    const selectedIndex = storedCandidates.findIndex((item) => sameRef(item.envelope.artifactRef, branchSet.selectedProposalRef));
    if (selectedIndex < 0) throw new Error("BranchSet selected proposal was not stored");
    const selectedProposal = proposals[selectedIndex];
    let result;
    try {
      result = await runEventProposalDocument(runtime.root, selectedProposal, {
        selectionRef: branchSetRef(branchSet),
        requireSelection: true,
        beforeCommit: options.beforeCommit,
        afterCommit: options.afterCommit
      });
    } catch (error) {
      const observed = await loadRuntime(projectRoot, worldId);
      const expectedProposalRef = exactRef(ARTIFACT_KINDS.proposal, selectedProposal.proposalId, selectedProposal.proposalVersion, selectedProposal);
      const commitCompleted = observed.parentCommit
        && sameRef(observed.parentCommit.proposalRef, expectedProposalRef)
        && observed.state.sequence === runtime.state.sequence + 1;
      if (!commitCompleted) throw error;
      result = {
        status: "committed_projection_pending",
        decisionRef: observed.parentCommit.decisionRef,
        commitRef: observed.head.commitRef,
        nextStateRef: observed.head.stateRef,
        projectionRef: null,
        error: String(error?.message || error)
      };
    }
    let gateRequestRef = null;
    if (result.status === "needs_human_gate") {
      const { createGateRequest } = await import("./canon.mjs");
      const gate = await createGateRequest(runtime.root, result.stored?.decisionRef || result.decisionRef);
      gateRequestRef = gate.requestRef;
    }
    steps.push({
      sequenceAttempted: runtime.state.sequence + 1,
      triggerId: due.triggerId,
      scanStatus: due.status,
      branchSetRef: storedBranchSet.envelope.artifactRef,
      selectedProposalRef: branchSet.selectedProposalRef,
      resultStatus: result.status,
      decisionRef: result.stored?.decisionRef || result.decisionRef,
      commitRef: result.commitRef || null,
      outputStateRef: result.nextStateRef || null,
      projectionRef: result.projectionRef || null,
      ...(gateRequestRef ? { gateRequestRef } : {}),
      ...(result.error ? { error: result.error } : {})
    });
    const terminalReason = stopReasonFor(result.status);
    if (terminalReason) {
      stopReason = terminalReason;
      break;
    }
    runtime = await loadRuntime(projectRoot, worldId);
  }

  const finalRuntime = await loadRuntime(projectRoot, worldId);
  const endStateRef = exactRef(ARTIFACT_KINDS.state, finalRuntime.state.stateId, finalRuntime.state.version, finalRuntime.state);
  const endedAt = finalRuntime.state.clock.at;
  const runId = `run.${worldId.toLowerCase()}.simulation.main.s${String(startSequence).padStart(6, "0")}.m${String(maxSteps).padStart(3, "0")}.${stopReason}.e${String(finalRuntime.state.sequence).padStart(6, "0")}`;
  const receipt = {
    kind: ARTIFACT_KINDS.runReceipt,
    contractVersion: WORLD_OS_VERSION,
    runId,
    version: 1,
    implementationVersion: WORLD_OS_IMPLEMENTATION_VERSION,
    worldId,
    stream: "simulation.main",
    writer: { kind: "codex", id: "codex.root" },
    startedAt,
    endedAt,
    maxSteps,
    startStateRef,
    endStateRef,
    startSequence,
    endSequence: finalRuntime.state.sequence,
    committedSteps: steps.filter((item) => item.commitRef !== null).length,
    attemptedSteps: steps.length,
    stopReason,
    status: ["needs_human_gate", "awaiting_codex_template", "committed_projection_pending"].includes(stopReason) ? "blocked"
      : stopReason === "stale_after_race" ? "stale"
        : steps.some((item) => item.commitRef) ? "advanced" : "stopped",
    steps
  };
  const storedReceipt = await putArtifact(finalRuntime.root, receipt, {
    kind: ARTIFACT_KINDS.runReceipt,
    id: receipt.runId,
    version: receipt.version,
    status: receipt.status === "blocked" ? "blocked" : "candidate",
    createdAt: receipt.endedAt,
    createdBy: "codex.root"
  });
  const health = await verifyWorldOsProject(finalRuntime.root);
  return { ...receipt, receiptRef: storedReceipt.envelope.artifactRef, health };
}

/**
 * Read-only next-turn forecast for Codex or a studio UI.
 *
 * Forecasting deliberately reuses the exact catalog compiler and adjudicator
 * used by advanceWorld, but never stores a Proposal, BranchSet, Decision,
 * StateSnapshot, Commit, Projection or RunReceipt. The returned successor
 * states are explicitly marked as unpersisted proposal-only previews.
 */
export async function forecastWorld(projectRoot, worldId, options = {}) {
  if (options.includeProjectedState !== undefined && typeof options.includeProjectedState !== "boolean") {
    throw new TypeError("forecast includeProjectedState must be boolean when provided");
  }
  const includeProjectedState = options.includeProjectedState !== false;
  const runtime = await loadRuntime(projectRoot, worldId);
  const stateRef = exactRef(ARTIFACT_KINDS.state, runtime.state.stateId, runtime.state.version, runtime.state);
  const scan = scanTriggerCatalog(runtime.triggerCatalog, runtime.state);
  const due = scan.entries.find((entry) => entry.conditionMet) || null;
  const base = {
    kind: "world_os_world_forecast",
    contractVersion: WORLD_OS_VERSION,
    implementationVersion: WORLD_OS_IMPLEMENTATION_VERSION,
    worldId,
    stream: "simulation.main",
    authority: "proposal_only",
    persisted: false,
    writePolicy: "read_only",
    stateRef,
    parentCommitRef: runtime.head?.commitRef || null,
    triggerScan: scan,
    triggerId: due?.triggerId || null,
    candidates: [],
    branchSet: null,
    branchSetRef: null,
    branchSetPersisted: false
  };
  if (!due) return { ...base, status: "no_due_trigger" };

  const trigger = runtime.triggerCatalog.triggers.find((item) => item.id === due.triggerId);
  const proposals = compileEventCandidates({
    workspace: runtime.workspace,
    worldCard: runtime.worldCard,
    state: runtime.state,
    parentCommitRef: runtime.head?.commitRef || null,
    platform: runtime.platform,
    triggerCatalog: runtime.triggerCatalog,
    actionCatalog: runtime.actionCatalog,
    templateCatalog: runtime.templateCatalog,
    triggerId: due.triggerId
  });
  if (!proposals.length) return { ...base, status: "awaiting_codex_template" };

  const evaluations = proposals.map((proposal) => adjudicateEvent({
    workspace: runtime.workspace,
    worldCard: runtime.worldCard,
    state: runtime.state,
    proposal,
    parentCommit: runtime.parentCommit,
    triggerCatalog: runtime.triggerCatalog,
    actionCatalog: runtime.actionCatalog,
    templateCatalog: runtime.templateCatalog
  }));
  const branchSet = buildBranchSet({
    state: runtime.state,
    trigger,
    actionCatalog: runtime.actionCatalog,
    templateCatalog: runtime.templateCatalog,
    candidates: proposals,
    evaluations
  });
  const candidates = proposals.map((proposal, index) => {
    const evaluation = evaluations[index];
    return {
      proposal: structuredClone(proposal),
      proposalRef: exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal),
      proposalPersisted: false,
      status: evaluation.status,
      decision: structuredClone(evaluation.decision),
      decisionRef: evaluation.decisionRef,
      decisionPersisted: false,
      projectedState: includeProjectedState && evaluation.nextState ? structuredClone(evaluation.nextState) : null,
      projectedStateSummary: evaluation.nextState ? {
        stateId: evaluation.nextState.stateId,
        version: evaluation.nextState.version,
        sequence: evaluation.nextState.sequence,
        clockAt: evaluation.nextState.clock?.at || null
      } : null,
      projectedStatePersisted: false
    };
  });
  const branchSetRefValue = branchSetRef(branchSet);
  return {
    ...base,
    status: branchSet.selectionStatus === "selected_for_simulation" ? "ready"
      : branchSet.selectionStatus === "selected_but_gated" ? "needs_human_gate"
        : "all_candidates_rejected",
    candidates,
    branchSet: structuredClone(branchSet),
    branchSetRef: branchSetRefValue
  };
}
