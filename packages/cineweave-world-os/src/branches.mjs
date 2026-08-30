import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { assertActionCatalogContract, actionCatalogRef } from "./actions.mjs";
import { evaluateCondition } from "./engine.mjs";
import { deepClone, exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
}

function assertStringArray(value, label, { minimum = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new TypeError(`${label} must contain at least ${minimum} non-empty strings`);
  }
  if (new Set(value).size !== value.length) throw new TypeError(`${label} must not contain duplicates`);
}

export function assertEventTemplateCatalogContract(catalog) {
  if (!isPlainObject(catalog) || catalog.kind !== ARTIFACT_KINDS.eventTemplateCatalog || catalog.contractVersion !== WORLD_OS_VERSION) {
    throw new Error("Unsupported event template catalog");
  }
  for (const field of ["catalogId", "worldId"]) assertString(catalog[field], field);
  if (!Number.isSafeInteger(catalog.version) || catalog.version < 1) throw new TypeError("Template catalog version must be positive");
  for (const field of ["worldCardRef", "triggerCatalogRef", "actionCatalogRef", "platformProfileRef"]) {
    if (!isExactRef(catalog[field])) throw new TypeError(`${field} must be exact`);
  }
  if (!Array.isArray(catalog.templates) || !catalog.templates.length) throw new TypeError("Template catalog must contain templates");
  const ids = new Set();
  for (const [index, template] of catalog.templates.entries()) {
    const label = `templates[${index}]`;
    if (!isPlainObject(template)) throw new TypeError(`${label} must be an object`);
    for (const field of [
      "id", "candidateId", "status", "eventId", "triggerId", "branchRole", "selectionScore", "clockAdvanceMinutes",
      "title", "publicSummary", "participants", "actionIds", "objective", "opposition", "choiceUnderPressure",
      "stateChange", "delayedConsequences", "irreversibility", "causesNext", "canonImpact", "publicationIntent",
      "differingPremise", "projectedDeltaSummary", "unresolvedInputs", "sourceBeatRefs"
    ]) if (!Object.hasOwn(template, field)) throw new TypeError(`${label} is missing ${field}`);
    for (const field of [
      "id", "candidateId", "eventId", "triggerId", "title", "publicSummary", "objective", "opposition",
      "choiceUnderPressure", "stateChange", "causesNext", "differingPremise", "projectedDeltaSummary"
    ]) assertString(template[field], `${label}.${field}`);
    if (template.status !== "proposed") throw new TypeError(`${label}.status must be proposed`);
    if (ids.has(template.id)) throw new TypeError(`Duplicate event template ${template.id}`);
    ids.add(template.id);
    if (!["baseline", "deterioration", "opportunity"].includes(template.branchRole)) throw new TypeError(`${label}.branchRole is invalid`);
    if (!Number.isSafeInteger(template.selectionScore) || template.selectionScore < 0 || template.selectionScore > 100) throw new TypeError(`${label}.selectionScore is invalid`);
    if (!Number.isSafeInteger(template.clockAdvanceMinutes) || template.clockAdvanceMinutes < 1 || template.clockAdvanceMinutes > 1440) throw new TypeError(`${label}.clockAdvanceMinutes is invalid`);
    for (const field of ["participants", "actionIds", "sourceBeatRefs"]) assertStringArray(template[field], `${label}.${field}`);
    assertStringArray(template.unresolvedInputs, `${label}.unresolvedInputs`, { minimum: 0 });
    if (!Array.isArray(template.delayedConsequences)) throw new TypeError(`${label}.delayedConsequences must be an array`);
    for (const [consequenceIndex, consequence] of template.delayedConsequences.entries()) {
      if (!isPlainObject(consequence)) throw new TypeError(`${label}.delayedConsequences[${consequenceIndex}] must be an object`);
      for (const field of ["id", "targetEventId", "description"]) assertString(consequence[field], `${label}.delayedConsequences[${consequenceIndex}].${field}`);
      if (!isPlainObject(consequence.when)) throw new TypeError(`${label}.delayedConsequences[${consequenceIndex}].when must be an object`);
    }
    if (!["reversible", "costly_to_reverse", "irreversible"].includes(template.irreversibility)) throw new TypeError(`${label}.irreversibility is invalid`);
    if (!["none", "candidate_fact", "canon_mutation"].includes(template.canonImpact)) throw new TypeError(`${label}.canonImpact is invalid`);
    if (!isPlainObject(template.publicationIntent)) throw new TypeError(`${label}.publicationIntent must be an object`);
  }
  return catalog;
}

export function eventTemplateCatalogRef(catalog) {
  assertEventTemplateCatalogContract(catalog);
  return exactRef(ARTIFACT_KINDS.eventTemplateCatalog, catalog.catalogId, catalog.version, catalog);
}

function addMinutes(iso, minutes) {
  const value = Date.parse(iso);
  if (Number.isNaN(value)) throw new TypeError("State clock is invalid");
  return new Date(value + minutes * 60_000).toISOString();
}

export function compileEventCandidates({ workspace, worldCard, state, parentCommitRef, platform, triggerCatalog, actionCatalog, templateCatalog, triggerId }) {
  assertActionCatalogContract(actionCatalog);
  assertEventTemplateCatalogContract(templateCatalog);
  const expectedWorldRef = exactRef(ARTIFACT_KINDS.worldCard, worldCard.worldId.toLowerCase().replace(/^/, "world."), worldCard.version, worldCard);
  if (!sameRef(actionCatalog.worldCardRef, expectedWorldRef) || !sameRef(templateCatalog.worldCardRef, expectedWorldRef)) {
    throw new Error("Decision catalogs are not bound to the exact world design");
  }
  const expectedTriggerRef = exactRef(ARTIFACT_KINDS.triggerCatalog, triggerCatalog.catalogId, triggerCatalog.version, triggerCatalog);
  if (!sameRef(templateCatalog.triggerCatalogRef, expectedTriggerRef) || !sameRef(templateCatalog.actionCatalogRef, actionCatalogRef(actionCatalog))) {
    throw new Error("Template catalog does not bind the exact trigger and action catalogs");
  }
  const platformRef = exactRef(ARTIFACT_KINDS.platformProfile, platform.profileId, platform.version, platform);
  if (!sameRef(templateCatalog.platformProfileRef, platformRef)) throw new Error("Template catalog platform binding is not exact");
  const trigger = (triggerCatalog.triggers || []).find((item) => item.id === triggerId);
  if (!trigger) throw new Error(`Unknown trigger ${triggerId}`);
  const templates = templateCatalog.templates
    .filter((template) => template.status === "proposed" && template.triggerId === triggerId)
    .sort((left, right) => right.selectionScore - left.selectionScore || left.id.localeCompare(right.id));
  if (templates.length > 3) throw new Error(`Trigger ${triggerId} exceeds the three-candidate decision bound`);
  const actionById = new Map(actionCatalog.actions.map((action) => [action.id, action]));
  return templates.map((template) => {
    if (template.eventId !== trigger.eventId) throw new Error(`Template ${template.id} is bound to the wrong event`);
    const actions = template.actionIds.map((id) => {
      const action = actionById.get(id);
      if (!action) throw new Error(`Template ${template.id} references missing action ${id}`);
      if (!action.applicableTriggerIds.includes(trigger.id)) throw new Error(`Action ${id} is not applicable to ${trigger.id}`);
      return action;
    });
    const duration = Math.max(...actions.map((action) => action.durationMinutes));
    if (duration !== template.clockAdvanceMinutes) throw new Error(`Template ${template.id} does not match catalog action duration`);
    const proposedAt = addMinutes(state.clock.at, duration);
    const sequenceLabel = String(state.sequence + 1).padStart(6, "0");
    const realizesConsequenceRefs = (state.pendingConsequences || [])
      .filter((item) => item.status === "pending" && item.targetEventId === template.eventId && evaluateCondition(item.when, state).result)
      .map((item) => item.id)
      .sort();
    return {
      $schema: "../schemas/event-proposal.schema.json",
      kind: ARTIFACT_KINDS.proposal,
      contractVersion: WORLD_OS_VERSION,
      proposalId: `proposal.${state.worldId.toLowerCase()}.s${sequenceLabel}.${template.candidateId}`,
      eventId: template.eventId,
      proposalVersion: 1,
      worldId: state.worldId,
      stream: state.stream,
      workspaceRef: exactRef(ARTIFACT_KINDS.workspace, workspace.workspaceId, workspace.version, workspace),
      worldCardRef: expectedWorldRef,
      baseStateRef: exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state),
      platformProfileRef: platformRef,
      triggerCatalogRef: expectedTriggerRef,
      actionCatalogRef: actionCatalogRef(actionCatalog),
      eventTemplateCatalogRef: eventTemplateCatalogRef(templateCatalog),
      eventTemplateId: template.id,
      parentCommitRef,
      expectedSequence: state.sequence,
      proposedAt,
      source: {
        origin: "codex",
        authority: "proposal_only",
        orchestratorId: "codex.root",
        basis: template.sourceBeatRefs.join("+")
      },
      branchRole: template.branchRole,
      title: template.title,
      publicSummary: template.publicSummary,
      objective: template.objective,
      opposition: template.opposition,
      choiceUnderPressure: template.choiceUnderPressure,
      stateChange: template.stateChange,
      causesNext: template.causesNext,
      irreversibility: template.irreversibility,
      delayedConsequences: deepClone(template.delayedConsequences),
      realizesConsequenceRefs,
      trigger: {
        triggerId: trigger.id,
        type: trigger.type,
        occurredAt: proposedAt,
        locationId: trigger.locationId,
        preconditions: deepClone(trigger.when),
        unknownPolicy: trigger.unknownPolicy
      },
      participants: deepClone(template.participants),
      actions: template.actionIds.map((actionId) => ({ actionId, parameters: {} })),
      canonImpact: template.canonImpact,
      publicationIntent: deepClone(template.publicationIntent)
    };
  });
}

function statusRank(status) {
  if (status === "accepted_simulation") return 0;
  if (status === "needs_human_gate") return 1;
  return 2;
}

export function buildBranchSet({ state, trigger, actionCatalog, templateCatalog, candidates, evaluations }) {
  if (!Array.isArray(candidates) || candidates.length < 1 || candidates.length > 3 || candidates.length !== evaluations.length) {
    throw new Error("A BranchSet requires one to three candidates and one evaluation per candidate");
  }
  const templates = new Map(templateCatalog.templates.map((item) => [item.candidateId, item]));
  const rows = candidates.map((proposal, index) => {
    const suffix = proposal.proposalId.split(".").slice(3).join(".");
    const template = templates.get(suffix);
    if (!template) throw new Error(`No template metadata for proposal ${proposal.proposalId}`);
    const evaluation = evaluations[index];
    return {
      candidateId: template.candidateId,
      branchRole: template.branchRole,
      proposalRef: exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal),
      evaluationStatus: evaluation.status,
      hardConstraintsPassed: evaluation.status === "accepted_simulation",
      selectionScore: template.selectionScore,
      differingPremise: template.differingPremise,
      projectedDeltaSummary: template.projectedDeltaSummary,
      delayedConsequenceIds: proposal.delayedConsequences.map((item) => item.id),
      unresolvedInputs: deepClone(template.unresolvedInputs),
      failedCheckIds: evaluation.decision.checks.filter((item) => item.status === "fail").map((item) => item.id),
      gatedCheckIds: evaluation.decision.checks.filter((item) => item.status === "gate").map((item) => item.id)
    };
  });
  rows.sort((left, right) => statusRank(left.evaluationStatus) - statusRank(right.evaluationStatus)
    || right.selectionScore - left.selectionScore
    || left.candidateId.localeCompare(right.candidateId));
  const selected = rows[0];
  const sequenceLabel = String(state.sequence + 1).padStart(6, "0");
  return {
    kind: ARTIFACT_KINDS.branchSet,
    contractVersion: WORLD_OS_VERSION,
    branchSetId: `branchset.${state.worldId.toLowerCase()}.s${sequenceLabel}.${trigger.id}`,
    version: 1,
    worldId: state.worldId,
    stream: state.stream,
    baseStateRef: exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state),
    triggerCatalogRef: templateCatalog.triggerCatalogRef,
    triggerId: trigger.id,
    actionCatalogRef: templateCatalog.actionCatalogRef,
    templateCatalogRef: eventTemplateCatalogRef(templateCatalog),
    selectionPolicy: "hard_constraints_then_codex_score_then_candidate_id",
    candidates: rows,
    selectedProposalRef: selected.proposalRef,
    selectionStatus: selected.evaluationStatus === "accepted_simulation" ? "selected_for_simulation"
      : selected.evaluationStatus === "needs_human_gate" ? "selected_but_gated" : "no_valid_candidate"
  };
}

export function branchSetRef(branchSet) {
  return exactRef(ARTIFACT_KINDS.branchSet, branchSet.branchSetId, branchSet.version, branchSet);
}
