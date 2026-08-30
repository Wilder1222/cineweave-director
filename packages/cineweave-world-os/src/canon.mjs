import { resolve } from "node:path";
import { findArtifact, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { ARTIFACT_KINDS, GATE_DECISIONS, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, sameRef } from "./json.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { deriveStreamHead, runEventProposalDocument } from "./store.mjs";

function assertDate(value, label) {
  if (Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid date-time`);
}

function assertText(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
}

function assertStored(ref, item, label) {
  if (!item || !sameRef(ref, item.envelope.artifactRef)) throw new Error(`${label} is not the exact stored artifact`);
  return item.envelope.payload;
}

function sameNullable(left, right) {
  return left === null && right === null || sameRef(left, right);
}

function refFor(kind, payload, idField, versionField = "version") {
  return exactRef(kind, payload[idField], payload[versionField], payload);
}

async function loadExact(root, ref, label) {
  if (!isExactRef(ref)) throw new TypeError(`${label} must be an exact reference`);
  return assertStored(ref, await findArtifact(root, ref), label);
}

async function currentSimulation(root, worldId, baseStateRef) {
  const head = await deriveStreamHead(root, worldId, "simulation.main");
  const stateRef = head?.stateRef || baseStateRef;
  return { head, stateRef };
}

function gateStatus(decision) {
  return decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "revision_requested";
}

function decisionItems(artifacts, requestRef) {
  return artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.gateDecision)
    .filter((item) => sameRef(item.envelope.payload.gateRequestRef, requestRef))
    .sort((left, right) => left.envelope.payload.version - right.envelope.payload.version);
}

export async function deriveCanonHead(projectRoot, worldId) {
  const root = resolve(projectRoot);
  const ledgers = (await listArtifacts(root))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.continuityLedger && item.envelope.payload.worldId === worldId && item.envelope.payload.stream === "canon.main")
    .sort((left, right) => left.envelope.payload.sequence - right.envelope.payload.sequence);
  if (!ledgers.length) return null;
  const ledgerId = `continuity-ledger.${worldId.toLowerCase()}`;
  let previous = null;
  for (const [index, item] of ledgers.entries()) {
    const ledger = item.envelope.payload;
    const ref = item.envelope.artifactRef;
    const sequence = index + 1;
    if (ledger.ledgerId !== ledgerId || ledger.version !== sequence || ledger.sequence !== sequence) throw new Error(`Invalid Canon ledger sequence at ${ledger.ledgerId}@${ledger.version}`);
    if (previous === null && ledger.previousLedgerRef !== null) throw new Error("The first Canon ledger must have a null previous ref");
    if (previous !== null && !sameRef(ledger.previousLedgerRef, previous.ledgerRef)) throw new Error(`Broken Canon ledger chain at sequence ${sequence}`);
    if (ledger.status === "conflicted" && !(ledger.conflicts || []).length) throw new Error(`Conflicted Canon ledger ${ledger.ledgerId}@${ledger.version} has no conflict record`);
    previous = { envelope: item.envelope, ledgerRef: ref, ledger };
  }
  return previous;
}

export async function createGateRequest(projectRoot, decisionRef, options = {}) {
  const root = resolve(projectRoot);
  const decision = await loadExact(root, decisionRef, "Gate source decision");
  if (decision.kind !== ARTIFACT_KINDS.decision || decision.status !== "needs_human_gate") throw new Error("GateRequest requires a needs_human_gate TransitionDecision");
  const proposal = await loadExact(root, decision.proposalRef, "Gate source proposal");
  if (proposal.worldId !== decision.worldId || proposal.stream !== "simulation.main") throw new Error("Gate source proposal is not bound to the simulation world/stream");
  const runtime = await currentSimulation(root, proposal.worldId, proposal.baseStateRef);
  if (!sameRef(runtime.stateRef, proposal.baseStateRef)) throw new Error("GateRequest source proposal is stale against the current simulation head");
  const artifacts = await listArtifacts(root);
  const selections = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.branchSet)
    .filter((item) => item.envelope.payload.worldId === proposal.worldId && item.envelope.payload.stream === proposal.stream)
    .filter((item) => item.envelope.payload.selectionStatus === "selected_but_gated")
    .filter((item) => sameRef(item.envelope.payload.selectedProposalRef, decision.proposalRef));
  if (selections.length !== 1) throw new Error(`GateRequest requires exactly one selected gated BranchSet; found ${selections.length}`);
  const selection = selections[0];
  const selectionRef = selection.envelope.artifactRef;
  const canonHead = await deriveCanonHead(root, proposal.worldId);
  const requestedAt = options.requestedAt || proposal.proposedAt;
  assertDate(requestedAt, "requestedAt");
  const request = {
    kind: ARTIFACT_KINDS.gateRequest,
    contractVersion: WORLD_OS_VERSION,
    gateRequestId: `gate-request.${proposal.proposalId}`,
    version: 1,
    worldId: proposal.worldId,
    stream: proposal.stream,
    requestType: "canon_resume_and_promote",
    proposalRef: decision.proposalRef,
    decisionRef,
    selectionRef,
    baseStateRef: proposal.baseStateRef,
    simulationHeadRef: runtime.head?.commitRef || null,
    canonHeadRef: canonHead?.ledgerRef || null,
    approvalScope: "exact_proposal_resume_and_canon_promotion",
    status: "pending",
    requestedAt,
    requestedBy: { kind: "codex", id: "codex.root" }
  };
  const stored = await putArtifact(root, request, {
    kind: ARTIFACT_KINDS.gateRequest,
    id: request.gateRequestId,
    version: request.version,
    status: "blocked",
    createdAt: requestedAt,
    createdBy: "codex.root"
  });
  return { request, requestRef: stored.envelope.artifactRef };
}

export async function recordGateDecision(projectRoot, gateRequestRef, options = {}) {
  const root = resolve(projectRoot);
  const request = await loadExact(root, gateRequestRef, "GateRequest");
  if (request.kind !== ARTIFACT_KINDS.gateRequest || request.status !== "pending") throw new Error("GateRequest is not pending");
  const decision = options.decision;
  if (!GATE_DECISIONS.has(decision)) throw new TypeError("decision must be approve, reject or revise");
  const actorId = options.actorId;
  const actorRole = options.actorRole || "canon-owner";
  assertText(actorId, "actorId");
  assertText(actorRole, "actorRole");
  const rationale = options.rationale;
  assertText(rationale, "rationale");
  const decidedAt = options.decidedAt || request.requestedAt;
  assertDate(decidedAt, "decidedAt");
  const artifacts = await listArtifacts(root);
  const requestDecisions = decisionItems(artifacts, gateRequestRef);
  if (Date.parse(decidedAt) < Date.parse(request.requestedAt)) throw new Error("GateDecision cannot precede its GateRequest");
  if (requestDecisions.length && Date.parse(decidedAt) < Date.parse(requestDecisions.at(-1).envelope.payload.decidedAt)) throw new Error("GateDecision time cannot move backwards");
  const duplicate = requestDecisions.find((item) => {
    const payload = item.envelope.payload;
    return payload.decision === decision && payload.decidedBy?.id === actorId && payload.decidedBy?.role === actorRole
      && payload.decidedAt === decidedAt && payload.rationale === rationale;
  });
  if (duplicate) return { decision: duplicate.envelope.payload, decisionRef: duplicate.envelope.artifactRef, idempotent: true };
  const previous = requestDecisions.at(-1);
  const nextVersion = previous ? previous.envelope.payload.version + 1 : 1;
  const gateDecision = {
    kind: ARTIFACT_KINDS.gateDecision,
    contractVersion: WORLD_OS_VERSION,
    gateDecisionId: `gate-decision.${request.gateRequestId}`,
    version: nextVersion,
    worldId: request.worldId,
    stream: request.stream,
    gateRequestRef,
    previousDecisionRef: previous?.envelope.artifactRef || null,
    decision,
    status: gateStatus(decision),
    approvalScope: request.approvalScope,
    decidedAt,
    decidedBy: { kind: "human", id: actorId, role: actorRole },
    rationale
  };
  const stored = await putArtifact(root, gateDecision, {
    kind: ARTIFACT_KINDS.gateDecision,
    id: gateDecision.gateDecisionId,
    version: gateDecision.version,
    status: decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "blocked",
    createdAt: decidedAt,
    createdBy: actorId
  });
  return { decision: gateDecision, decisionRef: stored.envelope.artifactRef, idempotent: false };
}

async function loadApprovedGate(root, gateDecisionRef) {
  const gateDecision = await loadExact(root, gateDecisionRef, "GateDecision");
  if (gateDecision.kind !== ARTIFACT_KINDS.gateDecision || gateDecision.decision !== "approve" || gateDecision.status !== "approved") {
    throw new Error("Only an approved GateDecision can resume or promote a proposal");
  }
  const request = await loadExact(root, gateDecision.gateRequestRef, "GateRequest");
  const decisions = decisionItems(await listArtifacts(root), gateDecision.gateRequestRef);
  if (!decisions.length || !sameRef(decisions.at(-1).envelope.artifactRef, gateDecisionRef)) throw new Error("GateDecision is not the latest decision for its GateRequest");
  if (gateDecision.worldId !== request.worldId || gateDecision.stream !== request.stream) throw new Error("GateDecision crosses its GateRequest world or stream");
  if (request.kind !== ARTIFACT_KINDS.gateRequest || request.status !== "pending" || request.approvalScope !== "exact_proposal_resume_and_canon_promotion") {
    throw new Error("GateDecision is not bound to a pending exact GateRequest");
  }
  const proposal = await loadExact(root, request.proposalRef, "Gate proposal");
  const blockedDecision = await loadExact(root, request.decisionRef, "Gate blocked decision");
  if (blockedDecision.status !== "needs_human_gate" || !sameRef(blockedDecision.proposalRef, request.proposalRef)
    || request.worldId !== proposal.worldId || request.stream !== proposal.stream) {
    throw new Error("GateRequest decision/proposal binding is invalid");
  }
  return { gateDecision, request, proposal, blockedDecision };
}

export async function resumeSimulation(projectRoot, gateDecisionRef, options = {}) {
  const root = resolve(projectRoot);
  const { gateDecision, request, proposal } = await loadApprovedGate(root, gateDecisionRef);
  const artifacts = await listArtifacts(root);
  const existing = artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.commit
    && sameRef(item.envelope.payload.proposalRef, request.proposalRef)
    && (item.envelope.payload.approvalRefs || []).some((ref) => sameRef(ref, gateDecisionRef)));
  if (existing) {
    const commit = existing.envelope.payload;
    return {
      status: "accepted_simulation",
      idempotent: true,
      commit,
      commitRef: existing.envelope.artifactRef,
      nextStateRef: commit.outputStateRefs[0],
      decisionRef: commit.decisionRef,
      projectionRef: artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.projection
        && sameRef(item.envelope.payload.commitRef, existing.envelope.artifactRef))?.envelope.artifactRef || null
    };
  }
  const runtime = await currentSimulation(root, proposal.worldId, proposal.baseStateRef);
  if (!sameNullable(runtime.head?.commitRef || null, request.simulationHeadRef) || !sameRef(runtime.stateRef, request.baseStateRef)) {
    throw new Error("Approved Gate is stale: the simulation head changed after the request");
  }
  const result = await runEventProposalDocument(root, proposal, {
    selectionRef: request.selectionRef,
    requireSelection: true,
    humanGateRef: gateDecisionRef,
    approvalRefs: [gateDecisionRef],
    decisionId: `decision.${proposal.proposalId}.resume`,
    decisionVersion: gateDecision.version,
    afterCommit: options.afterCommit
  });
  if (result.status !== "accepted_simulation") throw new Error(`Approved Gate resume did not commit: ${result.status}`);
  return { ...result, idempotent: false };
}

function lockForIrreversibility(value) {
  if (value === "irreversible") return "hard";
  if (value === "costly_to_reverse") return "soft";
  return "free";
}

function factValue(proposal, commit) {
  return {
    eventId: proposal.eventId,
    title: proposal.title,
    publicSummary: proposal.publicSummary,
    stateChange: proposal.stateChange,
    causesNext: proposal.causesNext,
    effects: commit.changes,
    committedAt: commit.committedAt
  };
}

export async function promoteCanon(projectRoot, gateDecisionRef) {
  const root = resolve(projectRoot);
  const { gateDecision, request, proposal } = await loadApprovedGate(root, gateDecisionRef);
  const artifacts = await listArtifacts(root);
  const alreadyPromoted = artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.canonPromotion
    && sameRef(item.envelope.payload.gateDecisionRef, gateDecisionRef));
  if (alreadyPromoted) {
    const promotion = alreadyPromoted.envelope.payload;
    return {
      status: promotion.status,
      idempotent: true,
      promotion,
      promotionRef: alreadyPromoted.envelope.artifactRef,
      ledgerRef: promotion.outputLedgerRef,
      factRefs: promotion.factRefs
    };
  }
  const commitItem = artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.commit
    && sameRef(item.envelope.payload.proposalRef, request.proposalRef)
    && (item.envelope.payload.approvalRefs || []).some((ref) => sameRef(ref, gateDecisionRef)));
  if (!commitItem) throw new Error("Canon promotion requires a resumed simulation Commit with the exact Gate approval");
  const commit = commitItem.envelope.payload;
  const commitRef = commitItem.envelope.artifactRef;
  if (commit.worldId !== request.worldId || commit.stream !== request.stream || !sameRef(commit.parentCommitRef, request.simulationHeadRef)) {
    throw new Error("Simulation Commit is not the exact Gate-requested branch");
  }
  const simulationHead = await deriveStreamHead(root, request.worldId, request.stream);
  if (!simulationHead || !sameRef(simulationHead.commitRef, commitRef)) throw new Error("Canon promotion requires the approved simulation Commit to remain the current simulation head");
  const currentHead = await deriveCanonHead(root, request.worldId);
  const existingLedger = artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.continuityLedger
    && sameRef(item.envelope.payload.simulationCommitRef, commitRef)
    && sameRef(item.envelope.payload.gateDecisionRef, gateDecisionRef));
  if (existingLedger && !sameNullable(existingLedger.envelope.payload.previousLedgerRef || null, request.canonHeadRef)) {
    throw new Error("Canon promotion has a partial ledger from a different Canon head");
  }
  if (!existingLedger && !sameNullable(currentHead?.ledgerRef || null, request.canonHeadRef)) {
    throw new Error("Approved Gate is stale: the Canon head changed after the request");
  }
  const previousLedgerRef = existingLedger?.envelope.payload.previousLedgerRef || request.canonHeadRef || null;
  const previousLedger = currentHead && sameRef(currentHead.ledgerRef, previousLedgerRef) ? currentHead.ledger : null;
  const factPath = `/events/${proposal.eventId}`;
  const expectedFactId = `canon.${request.worldId.toLowerCase()}.${proposal.eventId}.${commit.nextSequence}`;
  const existingFact = artifacts.find((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.canonFact
    && item.envelope.payload.canonFactId === expectedFactId && item.envelope.payload.version === 1);
  const priorClaims = artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.canonFact
    && item.envelope.payload.worldId === request.worldId && item.envelope.payload.factPath === factPath && !sameRef(item.envelope.artifactRef, existingFact?.envelope.artifactRef || null));
  const value = factValue(proposal, commit);
  const valueHash = sha256Canonical(value);
  const conflictRefs = priorClaims.filter((item) => sha256Canonical(item.envelope.payload.value) !== valueHash).map((item) => item.envelope.artifactRef);
  const fact = existingFact?.envelope.payload || {
    kind: ARTIFACT_KINDS.canonFact,
    contractVersion: WORLD_OS_VERSION,
    canonFactId: expectedFactId,
    version: 1,
    worldId: request.worldId,
    factPath,
    value,
    validFromCommitRef: commitRef,
    validUntilCommitRef: null,
    status: conflictRefs.length ? "conflicted" : "active",
    lock: lockForIrreversibility(commit.causality.irreversibility),
    sourceRefs: [commitRef, request.proposalRef],
    approvalRef: gateDecisionRef,
    conflictRefs,
    writer: { kind: "codex", id: "codex.root" },
    createdAt: gateDecision.decidedAt
  };
  const factStored = existingFact || await putArtifact(root, fact, {
    kind: ARTIFACT_KINDS.canonFact,
    id: fact.canonFactId,
    version: fact.version,
    status: fact.status === "active" ? "approved" : "blocked",
    createdAt: fact.createdAt,
    createdBy: "codex.root"
  });
  const factRef = factStored.envelope.artifactRef;
  const sequence = existingLedger?.envelope.payload.sequence || ((currentHead?.ledger?.sequence || 0) + 1);
  const ledger = existingLedger?.envelope.payload || {
    kind: ARTIFACT_KINDS.continuityLedger,
    contractVersion: WORLD_OS_VERSION,
    ledgerId: `continuity-ledger.${request.worldId.toLowerCase()}`,
    version: sequence,
    worldId: request.worldId,
    stream: "canon.main",
    sequence,
    previousLedgerRef,
    simulationCommitRef: commitRef,
    gateDecisionRef,
    factRefs: [factRef],
    changes: [
      { path: factPath, changeType: conflictRefs.length ? "conflict" : previousLedger ? "updated" : "added", reason: proposal.causesNext },
      ...(commit.changes || []).map((effect) => ({
        path: effect.path,
        changeType: effect.op === "add" ? "added" : "updated",
        reason: proposal.stateChange
      }))
    ],
    conflicts: conflictRefs.length ? [{
      conflictId: `conflict.${request.worldId.toLowerCase()}.${proposal.eventId}.${sequence}`,
      factPath,
      claimRefs: [factRef, ...conflictRefs],
      status: "unresolved",
      allowedInProduction: false
    }] : [],
    status: conflictRefs.length ? "conflicted" : "active",
    writer: { kind: "codex", id: "codex.root" },
    createdAt: gateDecision.decidedAt
  };
  const ledgerStored = existingLedger || await putArtifact(root, ledger, {
    kind: ARTIFACT_KINDS.continuityLedger,
    id: ledger.ledgerId,
    version: ledger.version,
    status: ledger.status === "active" ? "approved" : "blocked",
    createdAt: ledger.createdAt,
    createdBy: "codex.root"
  });
  const ledgerRef = ledgerStored.envelope.artifactRef;
  const promotion = {
    kind: ARTIFACT_KINDS.canonPromotion,
    contractVersion: WORLD_OS_VERSION,
    promotionId: `canon-promotion.${request.worldId.toLowerCase()}.canon.main`,
    version: sequence,
    worldId: request.worldId,
    stream: "canon.main",
    status: ledger.status === "conflicted" ? "promoted_with_conflicts" : "promoted",
    simulationCommitRef: commitRef,
    gateRequestRef: request.gateRequestRef || exactRef(ARTIFACT_KINDS.gateRequest, request.gateRequestId, request.version, request),
    gateDecisionRef,
    previousCanonHeadRef: previousLedgerRef,
    outputLedgerRef: ledgerRef,
    factRefs: [factRef],
    promotedAt: gateDecision.decidedAt,
    promotedBy: { kind: "codex", id: "codex.root" }
  };
  const storedPromotion = await putArtifact(root, promotion, {
    kind: ARTIFACT_KINDS.canonPromotion,
    id: promotion.promotionId,
    version: promotion.version,
    status: ledger.status === "conflicted" ? "blocked" : "approved",
    createdAt: promotion.promotedAt,
    createdBy: "codex.root"
  });
  return { status: promotion.status, idempotent: false, promotion, promotionRef: storedPromotion.envelope.artifactRef, ledgerRef, factRefs: [factRef] };
}
