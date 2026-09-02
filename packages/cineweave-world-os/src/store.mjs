import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  findArtifact,
  initProject,
  listArtifacts,
  putArtifact,
  verifyProject
} from "../../cineweave-runtime/src/artifact-store.mjs";
import { buildArtifactGraph } from "../../cineweave-runtime/src/artifact-graph.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { adjudicateEvent, assertEventProposalContract } from "./engine.mjs";
import { assertEventTemplateCatalogContract } from "./branches.mjs";
import { exactRef, isExactRef, readJson, resolveWorkspacePath, sameRef } from "./json.mjs";
import { buildPlatformProjection, platformProfileRef, projectionRef } from "./outbox.mjs";
import { reviewWorkspace } from "./review.mjs";
import { verifyExternalSignal, verifyExternalSignalUse } from "./signals.mjs";
import { assertPortfolioRunReceiptContract } from "./portfolio-contract.mjs";
import { verifyMcpAttemptReceipt, verifyMcpDispatchClaim } from "./mcp.mjs";
import { verifyLlmShadowReceipt } from "./shadow.mjs";
import { verifyWorldInceptionDecision, verifyWorldRegistration } from "./registry.mjs";
import { verifyBrandEcho, verifyBrandEchoDecision } from "./brand.mjs";
import { verifyProductionContractSnapshot, verifyProductionGateDecision, verifyProductionSlice } from "./production.mjs";
import { verifyProductionMediaImport } from "./production-media.mjs";
import { verifyProductionQaReview, verifyApprovedAsset, verifyPrivateReleaseReceipt } from "./production-release.mjs";
import { assertCodexBrainRunReceiptContract } from "./brain-contract.mjs";

function assertSeedManifest(manifest) {
  if (manifest.kind !== "world_os_seed_manifest" || manifest.contractVersion !== WORLD_OS_VERSION) throw new Error("Unsupported World OS seed manifest");
  if (!manifest.project || typeof manifest.project.id !== "string" || typeof manifest.project.name !== "string" || Number.isNaN(Date.parse(manifest.project.createdAt))) {
    throw new Error("Seed manifest project metadata is invalid");
  }
  if (!Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error("Seed manifest has no entries");
  const versions = new Set();
  for (const entry of manifest.entries) {
    const key = `${entry.kind}/${entry.id}@${entry.version}`;
    if (versions.has(key)) throw new Error(`Duplicate seed artifact version: ${key}`);
    versions.add(key);
    if (!Number.isSafeInteger(entry.version) || entry.version < 1 || !["draft", "candidate"].includes(entry.status)) throw new Error(`Invalid seed entry: ${key}`);
  }
  return manifest;
}

async function assertHealthyGraph(projectRoot) {
  const verification = await verifyProject(projectRoot);
  if (!verification.valid) throw new Error(`World OS project verification failed: ${verification.errors.join("; ")}`);
  const graph = await buildArtifactGraph(projectRoot);
  if (graph.summary.missingReferenceCount || graph.summary.hashMismatchReferenceCount || graph.summary.cycleCount) {
    throw new Error(`World OS artifact graph is unhealthy: missing=${graph.summary.missingReferenceCount}, mismatch=${graph.summary.hashMismatchReferenceCount}, cycles=${graph.summary.cycleCount}`);
  }
  return { verification, graph };
}

export async function rebuildSeedStore(manifestPath, projectRoot) {
  const sourcePath = resolve(manifestPath);
  const target = resolve(projectRoot);
  if (existsSync(join(target, ".cineweave"))) throw new Error(`Refusing to rebuild over an existing .cineweave store: ${target}`);
  const manifest = assertSeedManifest(await readJson(sourcePath));
  const workspaceEntry = manifest.entries.find((entry) => entry.kind === ARTIFACT_KINDS.workspace);
  if (!workspaceEntry) throw new Error("Seed manifest must include a workspace artifact");
  const workspacePath = resolveWorkspacePath(sourcePath, workspaceEntry.path, dirname(sourcePath));
  const review = await reviewWorkspace(workspacePath, { reviewedAt: manifest.project.createdAt });
  if (review.status === "fail") throw new Error(`Workspace review failed before rebuild: ${review.issues.filter((item) => item.severity === "error").map((item) => item.code).join(", ")}`);

  await initProject(target, {
    projectId: manifest.project.id,
    name: manifest.project.name,
    createdAt: manifest.project.createdAt
  });
  const artifacts = [];
  for (const entry of manifest.entries) {
    const payloadPath = resolveWorkspacePath(sourcePath, entry.path, dirname(sourcePath));
    const payload = await readJson(payloadPath);
    if (payload.kind !== entry.kind) throw new Error(`Seed kind mismatch for ${entry.path}: ${payload.kind} != ${entry.kind}`);
    const hash = sha256Canonical(payload);
    if (hash !== entry.expectedContentHash) throw new Error(`Seed hash mismatch for ${entry.path}: ${hash}`);
    const stored = await putArtifact(target, payload, {
      kind: entry.kind,
      id: entry.id,
      version: entry.version,
      status: entry.status,
      createdAt: entry.createdAt,
      createdBy: entry.createdBy
    });
    artifacts.push(stored.envelope.artifactRef);
  }
  const health = await assertHealthyGraph(target);
  if (health.verification.artifacts !== manifest.entries.length) throw new Error("Rebuilt artifact count differs from the seed manifest");
  return { projectRoot: target, manifest, review, artifacts, ...health };
}

function assertStoredSource(expectedRef, stored, label) {
  if (!sameRef(expectedRef, stored.envelope.artifactRef)) throw new Error(`${label} does not match its exact stored artifact`);
  return stored.envelope.payload;
}

function sameNullableRef(left, right) {
  return left === null && right === null || sameRef(left, right);
}

async function assertHumanGateApproval(root, gateDecisionRef, proposal, selectionRef, parentCommit) {
  if (!isExactRef(gateDecisionRef) || gateDecisionRef.kind !== ARTIFACT_KINDS.gateDecision) throw new Error("humanGateRef must point to a GateDecision artifact");
  const gate = assertStoredSource(gateDecisionRef, await findArtifact(root, gateDecisionRef), "Human Gate decision reference");
  if (gate.kind !== ARTIFACT_KINDS.gateDecision || gate.decision !== "approve" || gate.status !== "approved" || gate.worldId !== proposal.worldId || gate.stream !== proposal.stream) {
    throw new Error("humanGateRef is not an approved GateDecision for this world");
  }
  const request = assertStoredSource(gate.gateRequestRef, await findArtifact(root, gate.gateRequestRef), "Human Gate request reference");
  const proposalRef = exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal);
  if (request.kind !== ARTIFACT_KINDS.gateRequest || request.status !== "pending"
    || !sameRef(request.proposalRef, proposalRef) || !sameRef(request.selectionRef, selectionRef)
    || !sameRef(request.baseStateRef, proposal.baseStateRef)
    || !sameNullableRef(request.simulationHeadRef, parentCommit ? exactRef(ARTIFACT_KINDS.commit, parentCommit.commitId, parentCommit.version, parentCommit) : null)) {
    throw new Error("humanGateRef is not bound to the exact proposal, selection and simulation head");
  }
  const decisions = (await listArtifacts(root))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.gateDecision)
    .filter((item) => sameRef(item.envelope.payload.gateRequestRef, gate.gateRequestRef))
    .sort((left, right) => left.envelope.payload.version - right.envelope.payload.version);
  if (!decisions.length || !sameRef(decisions.at(-1).envelope.artifactRef, gateDecisionRef)) throw new Error("humanGateRef is not the latest GateDecision");
  const blocked = assertStoredSource(request.decisionRef, await findArtifact(root, request.decisionRef), "Human Gate blocked decision reference");
  if (blocked.kind !== ARTIFACT_KINDS.decision || blocked.status !== "needs_human_gate" || !sameRef(blocked.proposalRef, proposalRef)) throw new Error("Human Gate request does not point to its blocked decision");
}

async function assertSelectionBinding(root, selectionRef, proposal, { state, triggerCatalog, actionCatalog, templateCatalog }) {
  if (!isExactRef(selectionRef) || selectionRef.kind !== ARTIFACT_KINDS.branchSet) throw new Error("selectionRef must point to an exact BranchSet artifact");
  const selectionItem = await findArtifact(root, selectionRef);
  const branchSet = assertStoredSource(selectionRef, selectionItem, "BranchSet selection reference");
  if (branchSet.kind !== ARTIFACT_KINDS.branchSet || branchSet.contractVersion !== WORLD_OS_VERSION
    || branchSet.worldId !== proposal.worldId || branchSet.stream !== proposal.stream
    || !["selected_for_simulation", "selected_but_gated", "no_valid_candidate"].includes(branchSet.selectionStatus)) {
    throw new Error("BranchSet is not an eligible simulation selection");
  }
  // A gated selection may be adjudicated to produce its immutable blocked
  // TransitionDecision. Only an approved humanGateRef can turn that same
  // exact selection into a commit; assertCommitSelectionChain enforces it.
  const proposalRef = exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal);
  if (!sameRef(branchSet.selectedProposalRef, proposalRef)) throw new Error("BranchSet selectedProposalRef does not match the submitted proposal");
  if (!sameRef(branchSet.baseStateRef, proposal.baseStateRef) || !sameRef(branchSet.baseStateRef, exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state))) {
    throw new Error("BranchSet base state is not the exact proposal state");
  }
  const expectedTriggerRef = exactRef(ARTIFACT_KINDS.triggerCatalog, triggerCatalog.catalogId, triggerCatalog.version, triggerCatalog);
  const expectedActionRef = exactRef(ARTIFACT_KINDS.actionCatalog, actionCatalog.catalogId, actionCatalog.version, actionCatalog);
  const expectedTemplateRef = exactRef(ARTIFACT_KINDS.eventTemplateCatalog, templateCatalog.catalogId, templateCatalog.version, templateCatalog);
  if (!sameRef(branchSet.triggerCatalogRef, expectedTriggerRef)
    || !sameRef(branchSet.actionCatalogRef, expectedActionRef)
    || !sameRef(branchSet.templateCatalogRef, expectedTemplateRef)
    || branchSet.triggerId !== proposal.trigger?.triggerId) {
    throw new Error("BranchSet is not bound to the exact decision catalogs");
  }
  const selected = (branchSet.candidates || []).find((candidate) => sameRef(candidate.proposalRef, proposalRef));
  const expectedEvaluationStatus = branchSet.selectionStatus === "selected_for_simulation" ? "accepted_simulation"
    : branchSet.selectionStatus === "selected_but_gated" ? "needs_human_gate" : "rejected";
  if (!selected || selected.branchRole !== proposal.branchRole || selected.evaluationStatus !== expectedEvaluationStatus
    || (expectedEvaluationStatus === "accepted_simulation" && selected.hardConstraintsPassed !== true)) {
    throw new Error("BranchSet selected candidate is not an accepted hard-constraint-passing proposal");
  }
  return branchSet;
}

async function assertCommitSelectionChain(root, commit) {
  if (commit.selectionRef === null) {
    if ((commit.approvalRefs || []).length) throw new Error(`Commit ${commit.commitId}@${commit.version} cannot carry approvals without a selected BranchSet`);
    return;
  }
  if (!isExactRef(commit.selectionRef) || commit.selectionRef.kind !== ARTIFACT_KINDS.branchSet) throw new Error(`Commit ${commit.commitId}@${commit.version} has an invalid selectionRef`);
  const selectionItem = await findArtifact(root, commit.selectionRef);
  const branchSet = assertStoredSource(commit.selectionRef, selectionItem, "Commit selection reference");
  const proposalItem = await findArtifact(root, commit.proposalRef);
  const proposal = assertStoredSource(commit.proposalRef, proposalItem, "Commit proposal reference");
  const proposalRef = exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal);
  const gatedResume = branchSet.selectionStatus === "selected_but_gated";
  if (branchSet.kind !== ARTIFACT_KINDS.branchSet || branchSet.contractVersion !== WORLD_OS_VERSION
    || branchSet.worldId !== commit.worldId || branchSet.stream !== commit.stream
    || !["selected_for_simulation", "selected_but_gated"].includes(branchSet.selectionStatus)
    || branchSet.triggerId !== proposal.trigger?.triggerId
    || !sameRef(branchSet.selectedProposalRef, proposalRef)
    || !sameRef(branchSet.baseStateRef, proposal.baseStateRef)) {
    throw new Error(`Commit ${commit.commitId}@${commit.version} is not backed by its selected BranchSet candidate`);
  }
  const selected = (branchSet.candidates || []).find((candidate) => sameRef(candidate.proposalRef, proposalRef));
  const expectedStatus = gatedResume ? "needs_human_gate" : "accepted_simulation";
  if (!selected || selected.branchRole !== proposal.branchRole || selected.evaluationStatus !== expectedStatus
    || (!gatedResume && selected.hardConstraintsPassed !== true)) {
    throw new Error(`Commit ${commit.commitId}@${commit.version} selected a non-accepted BranchSet candidate`);
  }
  if (gatedResume) {
    const approvals = (commit.approvalRefs || []).filter((ref) => ref?.kind === ARTIFACT_KINDS.gateDecision);
    if (approvals.length !== 1 || (commit.approvalRefs || []).length !== 1) throw new Error(`Commit ${commit.commitId}@${commit.version} must carry exactly one human Gate approval`);
    const gateItem = await findArtifact(root, approvals[0]);
    const gate = assertStoredSource(approvals[0], gateItem, "Commit Gate approval reference");
    if (gate.kind !== ARTIFACT_KINDS.gateDecision || gate.decision !== "approve" || gate.status !== "approved"
      || gate.worldId !== commit.worldId || !isExactRef(gate.gateRequestRef) || gate.gateRequestRef.kind !== ARTIFACT_KINDS.gateRequest) {
      throw new Error(`Commit ${commit.commitId}@${commit.version} has an invalid human Gate approval`);
    }
    const requestItem = await findArtifact(root, gate.gateRequestRef);
    const request = assertStoredSource(gate.gateRequestRef, requestItem, "Commit Gate request reference");
    if (request.status !== "pending" || request.worldId !== commit.worldId || !sameRef(request.selectionRef, commit.selectionRef)
      || !sameRef(request.proposalRef, commit.proposalRef) || !sameRef(request.baseStateRef, commit.inputStateRefs?.[0])
      || !sameRef(request.simulationHeadRef, commit.parentCommitRef)) {
      throw new Error(`Commit ${commit.commitId}@${commit.version} does not match its exact Gate request`);
    }
  } else if ((commit.approvalRefs || []).length) {
    throw new Error(`Commit ${commit.commitId}@${commit.version} cannot carry approvals on an automatic BranchSet selection`);
  }
}

export async function runEventProposal(projectRoot, proposalPath, options = {}) {
  return runEventProposalDocument(projectRoot, await readJson(resolve(proposalPath)), options);
}

export async function runEventProposalDocument(projectRoot, proposalDocument, options = {}) {
  const root = resolve(projectRoot);
  if (options.verifyHealth !== undefined && typeof options.verifyHealth !== "boolean") {
    throw new TypeError("verifyHealth must be boolean when provided");
  }
  const verifyHealth = options.verifyHealth !== false;
  const proposal = assertEventProposalContract(proposalDocument);
  const [workspaceItem, worldItem, stateItem, platformItem, triggerCatalogItem, actionCatalogItem, templateCatalogItem] = await Promise.all([
    findArtifact(root, proposal.workspaceRef),
    findArtifact(root, proposal.worldCardRef),
    findArtifact(root, proposal.baseStateRef),
    findArtifact(root, proposal.platformProfileRef),
    findArtifact(root, proposal.triggerCatalogRef),
    findArtifact(root, proposal.actionCatalogRef),
    findArtifact(root, proposal.eventTemplateCatalogRef)
  ]);
  const workspace = assertStoredSource(proposal.workspaceRef, workspaceItem, "Workspace reference");
  const worldCard = assertStoredSource(proposal.worldCardRef, worldItem, "World reference");
  const state = assertStoredSource(proposal.baseStateRef, stateItem, "State reference");
  const platform = assertStoredSource(proposal.platformProfileRef, platformItem, "Platform profile reference");
  const triggerCatalog = assertStoredSource(proposal.triggerCatalogRef, triggerCatalogItem, "Trigger catalog reference");
  const actionCatalog = assertStoredSource(proposal.actionCatalogRef, actionCatalogItem, "Action catalog reference");
  const templateCatalog = assertStoredSource(proposal.eventTemplateCatalogRef, templateCatalogItem, "Event template catalog reference");
  assertEventTemplateCatalogContract(templateCatalog);
  if (options.requireSelection === true && (options.selectionRef === undefined || options.selectionRef === null)) {
    throw new Error("Decision Cycle commits require an exact selected BranchSet");
  }
  if (options.selectionRef !== undefined && options.selectionRef !== null) {
    await assertSelectionBinding(root, options.selectionRef, proposal, {
      state,
      triggerCatalog,
      actionCatalog,
      templateCatalog
    });
  }
  const streamHead = await deriveStreamHead(root, proposal.worldId, proposal.stream);
  let parentCommit = null;
  if (streamHead) {
    if (!sameRef(proposal.parentCommitRef, streamHead.commitRef)) throw new Error("Proposal parentCommitRef is not the current stream head");
    if (!sameRef(proposal.baseStateRef, streamHead.stateRef)) throw new Error("Proposal baseStateRef is not the current stream-head state");
    parentCommit = streamHead.envelope.payload;
  } else if (proposal.parentCommitRef !== null || state.sequence !== 0) {
    throw new Error("A stream without commits must start from sequence 0 with a null parent");
  }
  if (options.humanGateRef !== undefined && options.humanGateRef !== null) {
    await assertHumanGateApproval(root, options.humanGateRef, proposal, options.selectionRef || null, parentCommit);
  }
  const storedProposal = await putArtifact(root, proposal, {
    kind: ARTIFACT_KINDS.proposal,
    id: proposal.proposalId,
    version: proposal.proposalVersion,
    status: "candidate",
    createdAt: proposal.proposedAt,
    createdBy: "codex.root"
  });
  const transition = adjudicateEvent({
    workspace,
    worldCard,
    state,
    proposal,
    parentCommit,
    triggerCatalog,
    actionCatalog,
    templateCatalog,
    selectionRef: options.selectionRef || null,
    humanGateRef: options.humanGateRef || null,
    approvalRefs: options.approvalRefs || [],
    decisionId: options.decisionId || `decision.${proposal.proposalId}`,
    decisionVersion: options.decisionVersion || proposal.proposalVersion
  });
  if (!sameRef(storedProposal.envelope.artifactRef, transition.proposalRef)) throw new Error("Stored proposal reference differs from the adjudicated proposal");

  if (transition.status !== "accepted_simulation") {
    const storedDecision = await putArtifact(root, transition.decision, {
      kind: ARTIFACT_KINDS.decision,
      id: transition.decision.decisionId,
      version: transition.decision.version,
      status: transition.status === "rejected" ? "rejected" : "blocked",
      createdAt: proposal.proposedAt,
      createdBy: "codex.root"
    });
    const health = verifyHealth ? await assertHealthyGraph(root) : null;
    return { ...transition, stored: { proposalRef: storedProposal.envelope.artifactRef, decisionRef: storedDecision.envelope.artifactRef }, health };
  }

  const storedState = await putArtifact(root, transition.nextState, {
    kind: ARTIFACT_KINDS.state,
    id: transition.nextState.stateId,
    version: transition.nextState.version,
    status: "candidate",
    createdAt: proposal.proposedAt,
    createdBy: "codex.root"
  });
  const storedDecision = await putArtifact(root, transition.decision, {
    kind: ARTIFACT_KINDS.decision,
    id: transition.decision.decisionId,
    version: transition.decision.version,
    status: "candidate",
    createdAt: proposal.proposedAt,
    createdBy: "codex.root"
  });
  if (!sameRef(storedState.envelope.artifactRef, transition.nextStateRef) || !sameRef(storedDecision.envelope.artifactRef, transition.decisionRef)) {
    throw new Error("Stored transition artifacts differ from their exact references");
  }
  if (typeof options.beforeCommit === "function") await options.beforeCommit({ projectRoot: root, transition, storedState, storedDecision });
  let storedCommit;
  try {
    storedCommit = await putArtifact(root, transition.commit, {
      kind: ARTIFACT_KINDS.commit,
      id: transition.commit.commitId,
      version: transition.commit.version,
      status: "candidate",
      createdAt: proposal.proposedAt,
      createdBy: "codex.root"
    });
  } catch (error) {
    if (!String(error?.message || error).includes("Version conflict")) throw error;
    const winnerHead = await deriveStreamHead(root, proposal.worldId, proposal.stream);
    const health = verifyHealth ? await assertHealthyGraph(root) : null;
    return {
      ...transition,
      status: "stale_after_race",
      commit: null,
      commitRef: null,
      projection: null,
      projectionRef: null,
      winnerHead,
      stored: {
        proposalRef: storedProposal.envelope.artifactRef,
        stateRef: storedState.envelope.artifactRef,
        decisionRef: storedDecision.envelope.artifactRef
      },
      health
    };
  }
  if (!sameRef(storedCommit.envelope.artifactRef, transition.commitRef)) throw new Error("Terminal commit reference mismatch");
  if (typeof options.afterCommit === "function") await options.afterCommit({ projectRoot: root, transition, storedCommit });

  const projection = buildPlatformProjection({ workspace, worldCard, proposal, transition, platform });
  const storedProjection = await putArtifact(root, projection, {
    kind: ARTIFACT_KINDS.projection,
    id: projection.projectionId,
    version: projection.version,
    status: "candidate",
    createdAt: proposal.proposedAt,
    createdBy: "codex.root"
  });
  const health = verifyHealth ? await assertHealthyGraph(root) : null;
  return {
    ...transition,
    projection,
    projectionRef: storedProjection.envelope.artifactRef,
    stored: {
      proposalRef: storedProposal.envelope.artifactRef,
      stateRef: storedState.envelope.artifactRef,
      decisionRef: storedDecision.envelope.artifactRef,
      commitRef: storedCommit.envelope.artifactRef,
      projectionRef: storedProjection.envelope.artifactRef
    },
    health
  };
}

export async function reconcilePlatformProjections(projectRoot, platform) {
  const root = resolve(projectRoot);
  const profileRef = platformProfileRef(platform);
  const platformItem = await findArtifact(root, profileRef);
  assertStoredSource(profileRef, platformItem, "Platform profile reference");
  await assertHealthyGraph(root);
  const artifacts = await listArtifacts(root);
  const commits = artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.commit);
  const streamKeys = new Set(commits.map((item) => `${item.envelope.payload.worldId}\u0000${item.envelope.payload.stream}`));
  for (const key of streamKeys) {
    const [worldId, stream] = key.split("\u0000");
    await deriveStreamHead(root, worldId, stream);
  }
  const existingByVersion = new Map(
    artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.projection)
      .map((item) => [`${item.envelope.artifactRef.id}@${item.envelope.artifactRef.version}`, item])
  );
  const created = [];
  const existing = [];
  let ignored = 0;
  for (const commitItem of commits.sort((left, right) => left.envelope.payload.committedAt.localeCompare(right.envelope.payload.committedAt))) {
    const commit = commitItem.envelope.payload;
    const commitRef = commitItem.envelope.artifactRef;
    const proposalItem = await findArtifact(root, commit.proposalRef);
    const proposal = assertStoredSource(commit.proposalRef, proposalItem, "Commit proposal reference");
    if (!sameRef(proposal.platformProfileRef, profileRef)) {
      ignored += 1;
      continue;
    }
    const [workspaceItem, worldItem, stateItem, decisionItem] = await Promise.all([
      findArtifact(root, proposal.workspaceRef),
      findArtifact(root, proposal.worldCardRef),
      findArtifact(root, commit.outputStateRefs?.[0]),
      findArtifact(root, commit.decisionRef)
    ]);
    const workspace = assertStoredSource(proposal.workspaceRef, workspaceItem, "Proposal workspace reference");
    const worldCard = assertStoredSource(proposal.worldCardRef, worldItem, "Proposal world reference");
    const nextState = assertStoredSource(commit.outputStateRefs[0], stateItem, "Commit output state reference");
    const decision = assertStoredSource(commit.decisionRef, decisionItem, "Commit decision reference");
    if (decision.status !== "accepted_simulation" || !sameRef(decision.proposalRef, commit.proposalRef) || !sameRef(decision.transition?.toStateRef, commit.outputStateRefs[0])) {
      throw new Error(`Commit ${commit.commitId}@${commit.version} is not backed by an accepted exact transition decision`);
    }
    const transition = {
      status: "accepted_simulation",
      commit,
      commitRef,
      nextState,
      nextStateRef: commit.outputStateRefs[0]
    };
    const projection = buildPlatformProjection({ workspace, worldCard, proposal, transition, platform: platformItem.envelope.payload });
    const expectedRef = projectionRef(projection);
    const key = `${expectedRef.id}@${expectedRef.version}`;
    const current = existingByVersion.get(key);
    if (current) {
      if (!sameRef(current.envelope.artifactRef, expectedRef)) throw new Error(`Existing projection differs from deterministic rebuild: ${key}`);
      existing.push(expectedRef);
      continue;
    }
    const stored = await putArtifact(root, projection, {
      kind: ARTIFACT_KINDS.projection,
      id: projection.projectionId,
      version: projection.version,
      status: "candidate",
      createdAt: commit.committedAt,
      createdBy: "codex.root"
    });
    created.push(stored.envelope.artifactRef);
    existingByVersion.set(key, stored);
  }
  const health = await assertHealthyGraph(root);
  return { platformProfileRef: profileRef, created, existing, ignored, health };
}

export async function verifyWorldOsProject(projectRoot) {
  const root = resolve(projectRoot);
  const health = await assertHealthyGraph(root);
  const artifacts = await listArtifacts(root);
  const signals = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.externalSignal);
  for (const item of signals) await verifyExternalSignal(root, item.envelope.artifactRef);
  const signalUses = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.externalSignalUse);
  for (const item of signalUses) await verifyExternalSignalUse(root, item.envelope.artifactRef);
  const mcpClaims = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpDispatchClaim);
  for (const item of mcpClaims) await verifyMcpDispatchClaim(root, item.envelope.artifactRef);
  const mcpAttempts = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.mcpAttemptReceipt);
  for (const item of mcpAttempts) await verifyMcpAttemptReceipt(root, item.envelope.artifactRef);
  const llmShadowRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.llmShadowReceipt);
  for (const item of llmShadowRuns) await verifyLlmShadowReceipt(root, item.envelope.artifactRef);
  const worldRegistrations = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldRegistration);
  for (const item of worldRegistrations) await verifyWorldRegistration(root, item.envelope.artifactRef);
  const inceptionDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldInceptionDecision);
  for (const item of inceptionDecisions) await verifyWorldInceptionDecision(root, item.envelope.artifactRef);
  const brandEchoes = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEcho);
  for (const item of brandEchoes) await verifyBrandEcho(root, item.envelope.artifactRef);
  const brandEchoDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.brandEchoDecision);
  for (const item of brandEchoDecisions) await verifyBrandEchoDecision(root, item.envelope.artifactRef);
  const productionSnapshots = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionContractSnapshot);
  for (const item of productionSnapshots) await verifyProductionContractSnapshot(root, item.envelope.artifactRef);
  const productionSlices = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionSlice);
  for (const item of productionSlices) await verifyProductionSlice(root, item.envelope.artifactRef);
  const productionGateDecisions = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionGateDecision);
  for (const item of productionGateDecisions) await verifyProductionGateDecision(root, item.envelope.artifactRef);
  const productionMediaImports = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionMediaImport);
  const productionVerificationCache = {
    media: new Map(),
    qa: new Map(),
    asset: new Map(),
    release: new Map()
  };
  for (const item of productionMediaImports) await verifyProductionMediaImport(root, item.envelope.artifactRef, { cache: productionVerificationCache });
  const productionQaReviews = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionQaReview);
  for (const item of productionQaReviews) await verifyProductionQaReview(root, item.envelope.artifactRef, { cache: productionVerificationCache });
  const approvedAssets = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.approvedAsset);
  for (const item of approvedAssets) await verifyApprovedAsset(root, item.envelope.artifactRef, { cache: productionVerificationCache });
  const releaseReceipts = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.releaseReceipt);
  for (const item of releaseReceipts) await verifyPrivateReleaseReceipt(root, item.envelope.artifactRef, { cache: productionVerificationCache });
  const portfolioRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.portfolioRunReceipt);
  for (const item of portfolioRuns) {
    const receipt = assertPortfolioRunReceiptContract(item.envelope.payload);
    if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.portfolioRunReceipt, receipt.portfolioRunId, receipt.version, receipt))) {
      throw new Error(`PortfolioRunReceipt ${receipt.portfolioRunId}@${receipt.version} is not content-addressed exactly`);
      }
      for (const round of receipt.rounds) {
        const runItem = await findArtifact(root, round.receiptRef);
        const runReceipt = runItem.envelope.payload;
        if (runReceipt?.kind !== ARTIFACT_KINDS.runReceipt || runReceipt.worldId !== round.worldId || runReceipt.stream !== "simulation.main"
          || runReceipt.status !== round.resultStatus || runReceipt.stopReason !== round.stopReason
          || runReceipt.startSequence !== round.startSequence || runReceipt.endSequence !== round.endSequence
          || runReceipt.committedSteps !== round.committedSteps) {
          throw new Error(`Portfolio round ${round.cycle} does not reference its exact world RunReceipt`);
        }
      }
  }
  const brainRuns = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.codexBrainRunReceipt);
  for (const item of brainRuns) {
    const receipt = assertCodexBrainRunReceiptContract(item.envelope.payload);
    if (!sameRef(item.envelope.artifactRef, exactRef(ARTIFACT_KINDS.codexBrainRunReceipt, receipt.brainRunId, receipt.version, receipt))) {
      throw new Error(`CodexBrainRunReceipt ${receipt.brainRunId}@${receipt.version} is not content-addressed exactly`);
    }
    const portfolioItem = await findArtifact(root, receipt.portfolioRunRef);
    const portfolio = assertPortfolioRunReceiptContract(portfolioItem.envelope.payload);
    if (!sameRef(portfolioItem.envelope.artifactRef, receipt.portfolioRunRef)
      || !sameRef(portfolio.workspaceRef, receipt.workspaceRef)
      || portfolio.worldIds.join("\u0000") !== receipt.worldIds.join("\u0000")) {
      throw new Error(`CodexBrainRunReceipt ${receipt.brainRunId}@${receipt.version} is not bound to its exact Portfolio run`);
    }
    for (const shadowRef of receipt.shadowRunRefs) await verifyLlmShadowReceipt(root, shadowRef);
    for (const attemptRef of receipt.dispatch.attemptRefs) await verifyMcpAttemptReceipt(root, attemptRef);
    for (const profileRef of receipt.dispatch.profileRefs) {
      const profile = await findArtifact(root, profileRef);
      if (profile.envelope.payload?.kind !== ARTIFACT_KINDS.platformProfile) throw new Error(`CodexBrainRunReceipt ${receipt.brainRunId} has a non-platform dispatch profile`);
    }
    for (const projectionRef of receipt.dispatch.pendingProjectionRefs) {
      const projection = await findArtifact(root, projectionRef);
      if (projection.envelope.payload?.kind !== ARTIFACT_KINDS.projection) throw new Error(`CodexBrainRunReceipt ${receipt.brainRunId} has a non-projection pending ref`);
    }
    for (const publishRef of receipt.dispatch.publishReceiptRefs) {
      const publish = await findArtifact(root, publishRef);
      if (publish.envelope.payload?.kind !== ARTIFACT_KINDS.receipt) throw new Error(`CodexBrainRunReceipt ${receipt.brainRunId} has a non-publish receipt ref`);
    }
  }
  return health;
}

export async function deriveStreamHead(projectRoot, worldId, stream = "simulation.main") {
  const commits = (await listArtifacts(resolve(projectRoot)))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.commit
      && item.envelope.payload.worldId === worldId
      && item.envelope.payload.stream === stream)
    .sort((left, right) => left.envelope.payload.nextSequence - right.envelope.payload.nextSequence);
  if (!commits.length) return null;
  const expectedCommitId = `commit.${worldId.toLowerCase()}.${stream}`;
  let previous = null;
  for (const [index, item] of commits.entries()) {
    const commit = item.envelope.payload;
    const ref = item.envelope.artifactRef;
    const expectedSequence = index + 1;
    if (commit.commitId !== expectedCommitId || commit.version !== expectedSequence || commit.nextSequence !== expectedSequence || commit.expectedSequence !== expectedSequence - 1) {
      throw new Error(`Invalid commit sequence at ${commit.commitId}@${commit.version}`);
    }
    if (commit.terminalMarker !== true || commit.writer?.id !== "codex.root" || commit.authoritativeScope !== "simulation_branch") {
      throw new Error(`Invalid terminal commit authority at sequence ${expectedSequence}`);
    }
    if (previous === null && commit.parentCommitRef !== null) throw new Error("The first stream commit must have a null parent");
    if (previous !== null && !sameRef(commit.parentCommitRef, previous.commitRef)) throw new Error(`Broken parent commit chain at sequence ${expectedSequence}`);
    if (!Array.isArray(commit.outputStateRefs) || commit.outputStateRefs.length !== 1) throw new Error(`Commit ${expectedSequence} must name exactly one successor state`);
    await assertCommitSelectionChain(resolve(projectRoot), commit);
    previous = { envelope: item.envelope, commitRef: ref, stateRef: commit.outputStateRefs[0] };
  }
  return previous;
}
