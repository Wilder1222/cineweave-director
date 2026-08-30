import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { applyEffect, deepClone, exactRef, isExactRef, isPlainObject, pointerGet, pointerTokens, sameRef } from "./json.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { actionCatalogRef, canonImpactWithinCeiling, materializeProposalActions } from "./actions.mjs";
import { evaluateTriggerTiming } from "./timing.mjs";

const EFFECT_ROOTS = ["/variables/", "/actors/", "/relationships/", "/threads/", "/entities/"];
const CONDITION_OPERATORS = new Set(["eq", "ne", "gt", "gte", "lt", "lte", "in", "contains", "exists"]);

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
}

function assertStringArray(value, label, { minimum = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new TypeError(`${label} must contain at least ${minimum} non-empty string${minimum === 1 ? "" : "s"}`);
  }
  if (new Set(value).size !== value.length) throw new TypeError(`${label} must not contain duplicates`);
}

function assertConditionContract(condition, label) {
  if (!isPlainObject(condition)) throw new TypeError(`${label} must be an object`);
  const compound = ["all", "any", "not"].filter((key) => Object.hasOwn(condition, key));
  const hasLeaf = Object.hasOwn(condition, "path") || Object.hasOwn(condition, "op");
  if (compound.length + Number(hasLeaf) !== 1) throw new TypeError(`${label} must contain exactly one condition form`);
  if (Object.hasOwn(condition, "all") || Object.hasOwn(condition, "any")) {
    const key = Object.hasOwn(condition, "all") ? "all" : "any";
    if (!Array.isArray(condition[key]) || !condition[key].length) throw new TypeError(`${label}.${key} must be a non-empty array`);
    condition[key].forEach((child, index) => assertConditionContract(child, `${label}.${key}[${index}]`));
    return;
  }
  if (Object.hasOwn(condition, "not")) {
    assertConditionContract(condition.not, `${label}.not`);
    return;
  }
  assertNonEmptyString(condition.path, `${label}.path`);
  pointerTokens(condition.path);
  if (!CONDITION_OPERATORS.has(condition.op)) throw new TypeError(`${label}.op is unsupported`);
  if (!Object.hasOwn(condition, "value")) throw new TypeError(`${label}.value is required`);
}

export function assertEventProposalContract(proposal) {
  if (!isPlainObject(proposal)) throw new TypeError("Event proposal must be an object");
  for (const field of [
    "kind", "contractVersion", "proposalId", "eventId", "proposalVersion", "worldId", "stream", "workspaceRef", "worldCardRef",
    "baseStateRef", "platformProfileRef", "triggerCatalogRef", "actionCatalogRef", "eventTemplateCatalogRef", "eventTemplateId", "parentCommitRef", "expectedSequence", "proposedAt",
    "source", "branchRole", "title", "publicSummary", "objective", "opposition", "choiceUnderPressure", "stateChange",
    "causesNext", "irreversibility", "delayedConsequences", "realizesConsequenceRefs", "trigger", "participants", "actions",
    "canonImpact", "publicationIntent"
  ]) if (!Object.hasOwn(proposal, field)) throw new TypeError(`Event proposal is missing ${field}`);
  if (proposal.kind !== ARTIFACT_KINDS.proposal || proposal.contractVersion !== WORLD_OS_VERSION) throw new Error("Unsupported event proposal contract");
  for (const [field, ref] of [["workspaceRef", proposal.workspaceRef], ["worldCardRef", proposal.worldCardRef], ["baseStateRef", proposal.baseStateRef], ["platformProfileRef", proposal.platformProfileRef], ["triggerCatalogRef", proposal.triggerCatalogRef], ["actionCatalogRef", proposal.actionCatalogRef], ["eventTemplateCatalogRef", proposal.eventTemplateCatalogRef]]) {
    if (!isExactRef(ref)) throw new TypeError(`${field} must be an exact artifact reference`);
  }
  if (proposal.parentCommitRef !== null && !isExactRef(proposal.parentCommitRef)) throw new TypeError("parentCommitRef must be null or exact");
  for (const field of ["proposalId", "eventId", "worldId", "stream", "eventTemplateId", "title", "publicSummary", "objective", "opposition", "choiceUnderPressure", "stateChange", "causesNext"]) {
    assertNonEmptyString(proposal[field], field);
  }
  if (!Number.isSafeInteger(proposal.proposalVersion) || proposal.proposalVersion < 1) throw new TypeError("proposalVersion must be a positive integer");
  if (!Number.isSafeInteger(proposal.expectedSequence) || proposal.expectedSequence < 0) throw new TypeError("expectedSequence must be a non-negative integer");
  if (Number.isNaN(Date.parse(proposal.proposedAt))) throw new TypeError("proposedAt must be a valid date-time");
  if (!isPlainObject(proposal.source) || !["codex", "llm_api", "human_request", "external_signal"].includes(proposal.source.origin) || proposal.source.authority !== "proposal_only") throw new TypeError("source must declare a proposal-only supported origin");
  if (!["baseline", "deterioration", "opportunity"].includes(proposal.branchRole)) throw new TypeError("branchRole is invalid");
  if (!["reversible", "costly_to_reverse", "irreversible"].includes(proposal.irreversibility)) throw new TypeError("irreversibility is invalid");
  if (!Array.isArray(proposal.delayedConsequences)) throw new TypeError("delayedConsequences must be an array");
  const consequenceIds = new Set();
  for (const [index, consequence] of proposal.delayedConsequences.entries()) {
    if (!isPlainObject(consequence)) throw new TypeError(`delayedConsequences[${index}] must be an object`);
    for (const field of ["id", "targetEventId", "description"]) assertNonEmptyString(consequence[field], `delayedConsequences[${index}].${field}`);
    if (consequenceIds.has(consequence.id)) throw new TypeError(`Duplicate delayed consequence ${consequence.id}`);
    consequenceIds.add(consequence.id);
    assertConditionContract(consequence.when, `delayedConsequences[${index}].when`);
  }
  assertStringArray(proposal.realizesConsequenceRefs, "realizesConsequenceRefs", { minimum: 0 });
  const trigger = proposal.trigger;
  if (!isPlainObject(trigger)) throw new TypeError("trigger must be an object");
  for (const field of ["triggerId", "type", "occurredAt", "locationId", "preconditions", "unknownPolicy"]) if (!Object.hasOwn(trigger, field)) throw new TypeError(`trigger is missing ${field}`);
  for (const field of ["triggerId", "type", "locationId"]) assertNonEmptyString(trigger[field], `trigger.${field}`);
  if (Number.isNaN(Date.parse(trigger.occurredAt))) throw new TypeError("trigger.occurredAt must be a valid date-time");
  if (!["block", "allow"].includes(trigger.unknownPolicy)) throw new TypeError("trigger.unknownPolicy must be block or allow");
  assertConditionContract(trigger.preconditions, "trigger.preconditions");
  assertStringArray(proposal.participants, "participants");
  if (!Array.isArray(proposal.actions) || !proposal.actions.length) throw new TypeError("actions must be a non-empty array");
  const actionIds = new Set();
  for (const [index, reference] of proposal.actions.entries()) {
    if (!isPlainObject(reference) || typeof reference.actionId !== "string" || !reference.actionId.trim() || !isPlainObject(reference.parameters)) {
      throw new TypeError(`actions[${index}] must contain actionId and parameters`);
    }
    if (Object.keys(reference).some((key) => !["actionId", "parameters"].includes(key))) throw new TypeError(`actions[${index}] contains undeclared fields`);
    if (actionIds.has(reference.actionId)) throw new TypeError(`Duplicate proposal action ${reference.actionId}`);
    actionIds.add(reference.actionId);
  }
  if (!["none", "candidate_fact", "canon_mutation"].includes(proposal.canonImpact)) throw new TypeError("canonImpact is invalid");
  const publication = proposal.publicationIntent;
  if (!isPlainObject(publication) || typeof publication.platformId !== "string" || publication.lane !== "simulation_preview" || typeof publication.audience !== "string") throw new TypeError("publicationIntent is invalid");
  return proposal;
}

function check(id, status, message, path = "/") {
  return { id, status, path, message };
}

function compare(actual, op, expected) {
  if (op === "exists") return expected === false ? actual === undefined : actual !== undefined;
  if (actual === undefined) return false;
  if (op === "eq") return Object.is(actual, expected);
  if (op === "ne") return !Object.is(actual, expected);
  if (op === "gt") return actual > expected;
  if (op === "gte") return actual >= expected;
  if (op === "lt") return actual < expected;
  if (op === "lte") return actual <= expected;
  if (op === "in") return Array.isArray(expected) && expected.includes(actual);
  if (op === "contains") return Array.isArray(actual) ? actual.includes(expected) : typeof actual === "string" && actual.includes(String(expected));
  return false;
}

export function evaluateCondition(condition, state) {
  if (!isPlainObject(condition)) return { result: false, unknown: true, reason: "condition_not_object" };
  if (Array.isArray(condition.all)) {
    const results = condition.all.map((item) => evaluateCondition(item, state));
    return { result: results.every((item) => item.result), unknown: results.some((item) => item.unknown), children: results };
  }
  if (Array.isArray(condition.any)) {
    const results = condition.any.map((item) => evaluateCondition(item, state));
    return { result: results.some((item) => item.result), unknown: results.every((item) => item.unknown), children: results };
  }
  if (condition.not) {
    const result = evaluateCondition(condition.not, state);
    return { result: !result.result, unknown: result.unknown, child: result };
  }
  if (typeof condition.path !== "string" || !CONDITION_OPERATORS.has(condition.op)) {
    return { result: false, unknown: true, reason: "condition_leaf_invalid" };
  }
  const actual = pointerGet(state, condition.path);
  return {
    result: compare(actual, condition.op, condition.value),
    unknown: actual === undefined && condition.op !== "exists",
    actual
  };
}

function validateFieldPolicies(state, results) {
  for (const [index, policy] of (state.fieldPolicies || []).entries()) {
    const value = pointerGet(state, policy.path);
    if (policy.type === "enum" && !(policy.values || []).includes(value)) {
      results.push(check("state.field_policy", "fail", `${policy.path} must be one of the declared values`, `/fieldPolicies/${index}`));
    } else if (policy.type === "number" && (typeof value !== "number" || value < policy.minimum || value > policy.maximum)) {
      results.push(check("state.field_policy", "fail", `${policy.path} must stay within ${policy.minimum}..${policy.maximum}`, `/fieldPolicies/${index}`));
    }
  }
}

function activeLockForPath(worldCard, path) {
  return (worldCard.locks || []).find((lock) => lock.status === "active" && (path === lock.path || path.startsWith(`${lock.path}/`)));
}

const IRREVERSIBILITY_RANK = Object.freeze({ reversible: 0, costly_to_reverse: 1, irreversible: 2 });

function validateProposal(workspace, worldCard, state, proposal, parentCommit, triggerCatalog, actionCatalog, templateCatalog, materializedActions, { allowHumanGate = false } = {}) {
  const results = [];
  if (proposal.kind !== ARTIFACT_KINDS.proposal || proposal.contractVersion !== WORLD_OS_VERSION) {
    results.push(check("proposal.contract", "fail", "Unsupported event proposal contract", "/kind"));
  }
  if (workspace.authority?.singleWriter !== true || workspace.authority?.writer?.id !== "codex.root") {
    results.push(check("authority.single_writer", "fail", "Workspace does not grant sole write authority to codex.root", "/authority"));
  }
  if (proposal.source?.authority !== "proposal_only") {
    results.push(check("proposal.authority", "fail", "Every event source, including Codex and LLM providers, must enter as proposal_only", "/source/authority"));
  }
  if (!["codex", "llm_api", "human_request", "external_signal"].includes(proposal.source?.origin)) {
    results.push(check("proposal.origin", "fail", "Unknown proposal origin", "/source/origin"));
  }
  if (proposal.worldId !== worldCard.worldId || proposal.worldId !== state.worldId) {
    results.push(check("proposal.world", "fail", "Proposal, world design and base state must share one world ID", "/worldId"));
  }
  if (!actionCatalog || actionCatalog.kind !== ARTIFACT_KINDS.actionCatalog || actionCatalog.worldId !== proposal.worldId) {
    results.push(check("action.catalog", "fail", "Proposal must bind an action catalog for the same world", "/actionCatalogRef"));
  } else {
    const expectedActionCatalogRef = actionCatalogRef(actionCatalog);
    if (!sameRef(proposal.actionCatalogRef, expectedActionCatalogRef) || !sameRef(actionCatalog.worldCardRef, proposal.worldCardRef)) {
      results.push(check("action.catalog", "fail", "Action catalog or its world binding is not exact", "/actionCatalogRef"));
    }
  }
  if (!templateCatalog || templateCatalog.kind !== ARTIFACT_KINDS.eventTemplateCatalog || templateCatalog.worldId !== proposal.worldId) {
    results.push(check("template.catalog", "fail", "Proposal must bind an event template catalog for the same world", "/eventTemplateCatalogRef"));
  } else {
    const expectedTemplateCatalogRef = exactRef(ARTIFACT_KINDS.eventTemplateCatalog, templateCatalog.catalogId, templateCatalog.version, templateCatalog);
    if (!sameRef(proposal.eventTemplateCatalogRef, expectedTemplateCatalogRef)
      || !sameRef(templateCatalog.worldCardRef, proposal.worldCardRef)
      || !sameRef(templateCatalog.actionCatalogRef, proposal.actionCatalogRef)) {
      results.push(check("template.catalog", "fail", "Event template catalog or its world/action binding is not exact", "/eventTemplateCatalogRef"));
    }
    const template = (templateCatalog.templates || []).find((item) => item.id === proposal.eventTemplateId);
    if (!template) {
      results.push(check("template.id", "fail", "Event template ID is not present in the exact catalog", "/eventTemplateId"));
    } else {
      const templateOwnedFields = [
        "eventId", "triggerId", "branchRole", "title", "publicSummary", "objective", "opposition", "choiceUnderPressure",
        "stateChange", "delayedConsequences", "irreversibility", "causesNext", "canonImpact", "publicationIntent", "participants"
      ];
      for (const field of templateOwnedFields) {
        const proposalValue = field === "triggerId" ? proposal.trigger?.triggerId : proposal[field];
        if (sha256Canonical(proposalValue) !== sha256Canonical(template[field])) {
          results.push(check("template.binding", "fail", `Proposal field ${field} differs from its exact event template`, `/${field}`));
        }
      }
      const proposalActionIds = (proposal.actions || []).map((item) => item.actionId);
      if (sha256Canonical(proposalActionIds) !== sha256Canonical(template.actionIds)) {
        results.push(check("template.actions", "fail", "Proposal action IDs differ from its exact event template", "/actions"));
      }
      const actionFloor = Math.max(...(materializedActions || []).map((action) => IRREVERSIBILITY_RANK[action.irreversibility] ?? -1));
      if ((IRREVERSIBILITY_RANK[template.irreversibility] ?? -1) < actionFloor) {
        results.push(check("template.irreversibility", "fail", "Template irreversibility is weaker than one of its catalog actions", "/irreversibility"));
      }
    }
  }
  if (!triggerCatalog || triggerCatalog.kind !== ARTIFACT_KINDS.triggerCatalog || triggerCatalog.worldId !== proposal.worldId) {
    results.push(check("trigger.catalog", "fail", "Proposal must bind a trigger catalog for the same world", "/triggerCatalogRef"));
  } else {
    const expectedCatalogRef = exactRef(ARTIFACT_KINDS.triggerCatalog, triggerCatalog.catalogId, triggerCatalog.version, triggerCatalog);
    if (!sameRef(proposal.triggerCatalogRef, expectedCatalogRef) || !sameRef(triggerCatalog.worldCardRef, proposal.worldCardRef)) {
      results.push(check("trigger.catalog", "fail", "Trigger catalog or its world binding is not exact", "/triggerCatalogRef"));
    }
    const triggerSpec = (triggerCatalog.triggers || []).find((item) => item.id === proposal.trigger?.triggerId);
    if (!triggerSpec) results.push(check("trigger.catalog", "fail", "Trigger ID is not present in the bound catalog", "/trigger/triggerId"));
    else {
      if (triggerSpec.eventId !== proposal.eventId) results.push(check("trigger.event_binding", "fail", "Trigger is bound to a different event ID", "/eventId"));
      if (triggerSpec.status !== "proposed") results.push(check("trigger.status", "fail", "Only proposed triggers may execute", "/trigger/triggerId"));
      try {
        const timing = evaluateTriggerTiming(triggerSpec, state);
        if (!timing.timeDue) results.push(check("trigger.due", "fail", "Trigger is not due at the exact state clock", "/triggerCatalogRef"));
        if (!timing.cooldownOpen) results.push(check("trigger.cooldown", "fail", "Trigger is still inside its exact cooldown window", "/triggerCatalogRef"));
        if (!timing.occurrenceLimitOpen) {
          results.push(check(triggerSpec.once === true ? "trigger.once" : "trigger.max_occurrences", "fail",
            triggerSpec.once === true ? "A one-shot trigger cannot execute more than once" : "Trigger has reached its maximum occurrence count",
            "/trigger/triggerId"));
        }
      } catch (error) {
        results.push(check("trigger.schedule", "fail", error.message, "/triggerCatalogRef"));
      }
      const matches = triggerSpec.type === proposal.trigger.type
        && triggerSpec.locationId === proposal.trigger.locationId
        && triggerSpec.unknownPolicy === proposal.trigger.unknownPolicy
        && sha256Canonical(triggerSpec.when) === sha256Canonical(proposal.trigger.preconditions);
      if (!matches) results.push(check("trigger.catalog", "fail", "Proposal rewrites the catalog trigger type, location or condition", "/trigger"));
      const proposalRules = new Set((materializedActions || []).flatMap((action) => action.ruleRefs || []));
      for (const requiredRule of triggerSpec.requiredRuleRefs || []) if (!proposalRules.has(requiredRule)) {
        results.push(check("trigger.required_rules", "fail", `Trigger requires world rule ${requiredRule}`, "/actions"));
      }
      if (!new Set(["simulation_candidate_only", "auto_simulation"]).has(triggerSpec.gatePolicy) && !allowHumanGate) {
        results.push(check("trigger.gate_policy", "gate", `Trigger policy ${triggerSpec.gatePolicy} requires review before state transition`, "/triggerCatalogRef"));
      }
    }
  }
  if (proposal.stream !== "simulation.main" || state.stream !== "simulation.main") {
    results.push(check("proposal.stream", "fail", "This implementation only commits to the non-Canon simulation.main stream", "/stream"));
  }
  const expectedStateRef = exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state);
  if (!sameRef(proposal.baseStateRef, expectedStateRef)) {
    results.push(check("proposal.expected_version", "fail", "baseStateRef is missing, stale or not exact", "/baseStateRef"));
  }
  if (!Number.isSafeInteger(proposal.expectedSequence) || proposal.expectedSequence !== state.sequence) {
    results.push(check("proposal.expected_sequence", "fail", `Expected sequence ${state.sequence}`, "/expectedSequence"));
  }
  if (state.sequence === 0 && proposal.parentCommitRef !== null) {
    results.push(check("proposal.parent_commit", "fail", "The first stream event cannot name a parent commit", "/parentCommitRef"));
  }
  if (state.sequence > 0) {
    if (!parentCommit || !sameRef(
      proposal.parentCommitRef,
      exactRef(ARTIFACT_KINDS.commit, parentCommit.commitId, parentCommit.version, parentCommit)
    )) {
      results.push(check("proposal.parent_commit", "fail", "A continuing stream must bind the exact current parent commit", "/parentCommitRef"));
    } else if (!(parentCommit.outputStateRefs || []).some((ref) => sameRef(ref, proposal.baseStateRef))) {
      results.push(check("proposal.parent_state", "fail", "The base state is not the parent commit output", "/baseStateRef"));
    }
  }
  const occurredAt = Date.parse(proposal.trigger?.occurredAt);
  if (Number.isNaN(occurredAt) || occurredAt < Date.parse(state.clock?.at || "")) {
    results.push(check("trigger.time", "fail", "Trigger time must be valid and not precede the base state", "/trigger/occurredAt"));
  }
  if (proposal.proposedAt !== proposal.trigger?.occurredAt) {
    results.push(check("trigger.time", "fail", "A deterministic proposal must be authored at its catalog-derived occurrence time", "/proposedAt"));
  }
  const conditionResult = evaluateCondition(proposal.trigger?.preconditions || { all: [] }, state);
  if (!conditionResult.result || conditionResult.unknown && proposal.trigger?.unknownPolicy !== "allow") {
    results.push(check("trigger.preconditions", "fail", "Trigger preconditions are false or unresolved", "/trigger/preconditions"));
  } else {
    results.push(check("trigger.preconditions", "pass", "Trigger preconditions hold", "/trigger/preconditions"));
  }
  const rules = new Map((worldCard.rules || []).map((rule) => [rule.id, rule]));
  const actors = new Map((worldCard.characters || []).map((actor) => [actor.id, actor]));
  const participants = new Set(proposal.participants || []);
  for (const [participantIndex, participantId] of (proposal.participants || []).entries()) {
    if (!actors.has(participantId) || !state.actors?.[participantId]) results.push(check("participant.actor", "fail", `Unknown or inactive participant ${participantId}`, `/participants/${participantIndex}`));
  }
  const actionIds = new Set();
  for (const [actionIndex, action] of (materializedActions || []).entries()) {
    const path = `/actions/${actionIndex}`;
    if (!action.id || actionIds.has(action.id)) results.push(check("action.id", "fail", "Action IDs must be present and unique", `${path}/id`));
    actionIds.add(action.id);
    const actor = actors.get(action.actorId);
    const actorState = state.actors?.[action.actorId];
    if (!actor || !actorState) results.push(check("action.actor", "fail", `Unknown or inactive actor ${String(action.actorId)}`, `${path}/actorId`));
    if (!participants.has(action.actorId)) results.push(check("action.participant", "fail", "Every acting character must be listed as a participant", `${path}/actorId`));
    if (action.locationId !== proposal.trigger.locationId || actorState?.locationId !== action.locationId) {
      results.push(check("action.location", "fail", "Action, trigger and current actor location must match", `${path}/locationId`));
    }
    const goals = new Set((actor?.actorPolicy?.goals || []).map((item) => item.id));
    const capabilities = new Set(actor?.actorPolicy?.capabilities || []);
    const preferences = new Set(actor?.actorPolicy?.preferences || []);
    const limits = new Set(actor?.actorPolicy?.limits || []);
    const knowledge = new Set(actorState?.knowledge || []);
    const unknown = new Set(actorState?.unknown || []);
    for (const goal of action.goalRefs || []) if (!goals.has(goal)) results.push(check("action.goal", "fail", `Actor policy does not contain goal ${goal}`, `${path}/goalRefs`));
    for (const capability of action.capabilityRefs || []) if (!capabilities.has(capability)) results.push(check("action.capability", "fail", `Actor lacks capability ${capability}`, `${path}/capabilityRefs`));
    for (const fact of action.knowledgeRefs || []) if (!knowledge.has(fact) || unknown.has(fact)) results.push(check("action.knowledge", "fail", `Actor does not possess required knowledge ${fact}`, `${path}/knowledgeRefs`));
    for (const preference of action.preferenceRefs || []) if (!preferences.has(preference)) results.push(check("action.preference", "fail", `Actor policy does not contain preference ${preference}`, `${path}/preferenceRefs`));
    for (const limit of action.limitRefs || []) if (!limits.has(limit)) results.push(check("action.limit", "fail", `Actor policy does not contain limit ${limit}`, `${path}/limitRefs`));
    if (!(action.applicableTriggerIds || []).includes(proposal.trigger?.triggerId)) results.push(check("action.trigger", "fail", "Catalog action is not applicable to this trigger", `${path}/applicableTriggerIds`));
    const actionCondition = evaluateCondition(action.preconditions, state);
    if (!actionCondition.result || actionCondition.unknown) results.push(check("action.preconditions", "fail", "Catalog action preconditions are false or unresolved", `${path}/preconditions`));
    if (!(action.ruleRefs || []).length) results.push(check("action.rules", "fail", "Every consequential action must cite at least one world rule", `${path}/ruleRefs`));
    for (const ruleRef of action.ruleRefs || []) if (!rules.has(ruleRef)) results.push(check("action.rules", "fail", `Unknown world rule ${ruleRef}`, `${path}/ruleRefs`));
    for (const ruleCheck of action.ruleChecks || []) {
      if (!rules.has(ruleCheck.ruleRef) || ruleCheck.result !== "pass" || !ruleCheck.evidence) {
        results.push(check("action.rule_check", "fail", "Referenced rules require an explicit passing check and evidence", `${path}/ruleChecks`));
      }
    }
    const checkedRules = new Set((action.ruleChecks || []).map((item) => item.ruleRef));
    for (const ruleRef of action.ruleRefs || []) if (!checkedRules.has(ruleRef)) results.push(check("action.rule_check", "fail", `Rule ${ruleRef} has no explicit check`, `${path}/ruleChecks`));
    if (!(action.costs || []).length) results.push(check("action.cost", "fail", "Consequential actions must declare at least one cost", `${path}/costs`));
    if (!canonImpactWithinCeiling(proposal.canonImpact, action.canonImpactCeiling)) {
      results.push(check("action.canon_ceiling", "fail", `Proposal Canon impact exceeds action ${action.id} ceiling`, "/canonImpact"));
    }
    if (!new Set(["auto_simulation", "simulation_candidate_only"]).has(action.gatePolicy) && !allowHumanGate) {
      results.push(check("action.gate_policy", "gate", `Action policy ${action.gatePolicy} requires review before state transition`, `${path}/gatePolicy`));
    }
    for (const [effectIndex, effect] of (action.effects || []).entries()) {
      const effectPath = `${path}/effects/${effectIndex}`;
      if (!EFFECT_ROOTS.some((root) => effect.path?.startsWith(root))) results.push(check("effect.scope", "fail", "Effect path is outside the mutable simulation state", `${effectPath}/path`));
      if (!isPlainObject(effect) || !["replace", "add", "increment", "append"].includes(effect.op)) results.push(check("effect.operation", "fail", "Unsupported state effect", effectPath));
      const lock = activeLockForPath(worldCard, effect.path);
      if (lock?.level === "hard" && !allowHumanGate) results.push(check("effect.hard_lock", "gate", `Effect touches active hard lock ${lock.id}`, `${effectPath}/path`));
      if (lock?.level === "soft") results.push(check("effect.soft_lock", "warn", `Effect touches active soft lock ${lock.id}`, `${effectPath}/path`));
    }
  }
  if (!(materializedActions || []).length) results.push(check("proposal.actions", "fail", "At least one catalog action is required", "/actions"));
  const expectedOccurredAt = new Date(Date.parse(state.clock?.at || "") + Math.max(0, ...(materializedActions || []).map((action) => action.durationMinutes)) * 60_000).toISOString();
  if (proposal.trigger?.occurredAt !== expectedOccurredAt) {
    results.push(check("action.duration", "fail", "Trigger time must equal the exact catalog action duration from the base clock", "/trigger/occurredAt"));
  }
  const pendingById = new Map((state.pendingConsequences || []).map((item) => [item.id, item]));
  const declaredRealizations = new Set(proposal.realizesConsequenceRefs || []);
  const dueRealizations = new Set((state.pendingConsequences || [])
    .filter((item) => item.status === "pending" && item.targetEventId === proposal.eventId)
    .filter((item) => {
      const evaluation = evaluateCondition(item.when, state);
      return evaluation.result && !evaluation.unknown;
    })
    .map((item) => item.id));
  if (sha256Canonical([...declaredRealizations].sort()) !== sha256Canonical([...dueRealizations].sort())) {
    results.push(check("consequence.realization_set", "fail", "Proposal must realize exactly the due consequences for its event", "/realizesConsequenceRefs"));
  }
  for (const [index, id] of (proposal.realizesConsequenceRefs || []).entries()) {
    const consequence = pendingById.get(id);
    if (!consequence || consequence.status !== "pending" || consequence.targetEventId !== proposal.eventId) {
      results.push(check("consequence.realization", "fail", `Consequence ${id} is not pending for this event`, `/realizesConsequenceRefs/${index}`));
    } else {
      const evaluation = evaluateCondition(consequence.when, state);
      if (!evaluation.result || evaluation.unknown) results.push(check("consequence.realization", "fail", `Consequence ${id} is not due`, `/realizesConsequenceRefs/${index}`));
    }
  }
  const knownConsequenceIds = new Set((state.pendingConsequences || []).map((item) => item.id));
  const knownEventIds = new Set((triggerCatalog?.triggers || []).map((item) => item.eventId));
  for (const [index, consequence] of (proposal.delayedConsequences || []).entries()) {
    if (knownConsequenceIds.has(consequence.id)) results.push(check("consequence.duplicate", "fail", `Consequence ${consequence.id} already exists`, `/delayedConsequences/${index}/id`));
    if (!knownEventIds.has(consequence.targetEventId)) results.push(check("consequence.target", "fail", `Consequence target ${consequence.targetEventId} has no catalog trigger`, `/delayedConsequences/${index}/targetEventId`));
  }
  if (!["none", "candidate_fact", "canon_mutation"].includes(proposal.canonImpact)) results.push(check("proposal.canon_impact", "fail", "Unknown Canon impact", "/canonImpact"));
  if (proposal.canonImpact !== "none" && !allowHumanGate) results.push(check("proposal.canon_gate", "gate", "Any candidate fact or Canon mutation requires a human Gate", "/canonImpact"));
  return results;
}

function buildRejectedDecision(proposal, proposalRef, checks, status, { decisionId = `decision.${proposal.proposalId}`, decisionVersion = proposal.proposalVersion } = {}) {
  return {
    kind: ARTIFACT_KINDS.decision,
    contractVersion: WORLD_OS_VERSION,
    decisionId,
    version: decisionVersion,
    proposalRef,
    worldId: proposal.worldId,
    stream: proposal.stream,
    decidedAt: proposal.proposedAt,
    decidedBy: { kind: "codex", id: "codex.root" },
    status,
    checks,
    transition: null,
    rationale: status === "needs_human_gate"
      ? "The proposal is structurally valid but crosses a human-controlled boundary."
      : "The proposal failed one or more deterministic World OS checks."
  };
}

export function adjudicateEvent({ workspace, worldCard, state, proposal, parentCommit = null, triggerCatalog = null, actionCatalog = null, templateCatalog = null, selectionRef = null, humanGateRef = null, approvalRefs = [], decisionId = `decision.${proposal.proposalId}`, decisionVersion = proposal.proposalVersion }) {
  assertEventProposalContract(proposal);
  const proposalRef = exactRef(ARTIFACT_KINDS.proposal, proposal.proposalId, proposal.proposalVersion, proposal);
  if (humanGateRef !== null && !isExactRef(humanGateRef)) throw new TypeError("humanGateRef must be null or exact");
  if (!Array.isArray(approvalRefs) || approvalRefs.length > 4 || approvalRefs.some((ref) => !isExactRef(ref))) throw new TypeError("approvalRefs must contain zero to four exact references");
  if (approvalRefs.some((ref, index) => approvalRefs.slice(0, index).some((prior) => sameRef(prior, ref)))) throw new TypeError("approvalRefs must not contain duplicates");
  if (humanGateRef !== null && !approvalRefs.some((ref) => sameRef(ref, humanGateRef))) throw new Error("humanGateRef must be included in approvalRefs");
  let materializedActions = [];
  let materializationError = null;
  try { materializedActions = materializeProposalActions(proposal, actionCatalog); }
  catch (error) { materializationError = error; }
  const checks = validateProposal(workspace, worldCard, state, proposal, parentCommit, triggerCatalog, actionCatalog, templateCatalog, materializedActions, { allowHumanGate: humanGateRef !== null });
  if (humanGateRef !== null) checks.unshift(check("human_gate.approved", "pass", "The exact approved human Gate is bound to this resume attempt", "/approvalRefs"));
  if (materializationError) checks.unshift(check("action.catalog_action", "fail", materializationError.message, "/actions"));
  if (selectionRef !== null && !isExactRef(selectionRef)) checks.unshift(check("selection.reference", "fail", "selectionRef must be null or exact", "/selectionRef"));
  const hasFailure = checks.some((item) => item.status === "fail");
  const needsGate = checks.some((item) => item.status === "gate");
  if (hasFailure || needsGate) {
    const decision = buildRejectedDecision(proposal, proposalRef, checks, hasFailure ? "rejected" : "needs_human_gate", { decisionId, decisionVersion });
    return {
      status: decision.status,
      proposal,
      proposalRef,
      decision,
      decisionRef: exactRef(ARTIFACT_KINDS.decision, decision.decisionId, decision.version, decision),
      nextState: null,
      commit: null
    };
  }

  const nextState = deepClone(state);
  for (const action of materializedActions) for (const effect of action.effects || []) applyEffect(nextState, effect);
  const postChecks = [];
  validateFieldPolicies(nextState, postChecks);
  checks.push(...postChecks);
  if (postChecks.some((item) => item.status === "fail")) {
    const decision = buildRejectedDecision(proposal, proposalRef, checks, "rejected", { decisionId, decisionVersion });
    return {
      status: "rejected",
      proposal,
      proposalRef,
      decision,
      decisionRef: exactRef(ARTIFACT_KINDS.decision, decision.decisionId, decision.version, decision),
      nextState: null,
      commit: null
    };
  }

  const baseStateRef = exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state);
  nextState.version = state.version + 1;
  nextState.sequence = state.sequence + 1;
  const sequenceLabel = String(nextState.sequence).padStart(6, "0");
  nextState.stateId = `state.${proposal.worldId.toLowerCase()}.${proposal.stream}.s${sequenceLabel}.${proposalRef.contentHash.slice(7, 23)}`;
  nextState.previousStateRef = baseStateRef;
  nextState.clock = { ...nextState.clock, at: proposal.trigger.occurredAt };
  nextState.lastEvent = { eventId: proposal.eventId, proposalRef };
  nextState.timeline = [...(nextState.timeline || []), {
    sequence: nextState.sequence,
    eventId: proposal.eventId,
    at: proposal.trigger.occurredAt,
    summary: proposal.publicSummary,
    objective: proposal.objective,
    opposition: proposal.opposition,
    choiceUnderPressure: proposal.choiceUnderPressure,
    stateChange: proposal.stateChange,
    causesNext: proposal.causesNext
  }];
  const realized = new Set(proposal.realizesConsequenceRefs || []);
  nextState.pendingConsequences = (nextState.pendingConsequences || []).map((item) => realized.has(item.id)
    ? { ...item, status: "realized", realizedAt: proposal.trigger.occurredAt, realizedByEventId: proposal.eventId, realizedByProposalRef: proposalRef }
    : item);
  nextState.pendingConsequences.push(...(proposal.delayedConsequences || []).map((item) => ({
    ...deepClone(item),
    status: "pending",
    scheduledAt: proposal.trigger.occurredAt,
    sourceProposalRef: proposalRef
  })));
  nextState.writer = { kind: "codex", id: "codex.root" };
  nextState.canonDisposition = "proposal";
  const nextStateRef = exactRef(ARTIFACT_KINDS.state, nextState.stateId, nextState.version, nextState);
  const decision = {
    kind: ARTIFACT_KINDS.decision,
    contractVersion: WORLD_OS_VERSION,
    decisionId,
    version: decisionVersion,
    proposalRef,
    worldId: proposal.worldId,
    stream: proposal.stream,
    decidedAt: proposal.proposedAt,
    decidedBy: { kind: "codex", id: "codex.root" },
    status: "accepted_simulation",
    checks,
    transition: {
      fromStateRef: baseStateRef,
      toStateRef: nextStateRef,
      expectedSequence: state.sequence,
      nextSequence: nextState.sequence,
      canonDisposition: "proposal"
    },
    rationale: "The proposal satisfies deterministic rules and may advance the non-Canon simulation branch."
  };
  const decisionRef = exactRef(ARTIFACT_KINDS.decision, decision.decisionId, decision.version, decision);
  const commit = {
    kind: ARTIFACT_KINDS.commit,
    contractVersion: WORLD_OS_VERSION,
    commitId: `commit.${proposal.worldId.toLowerCase()}.${proposal.stream}`,
    version: nextState.sequence,
    worldId: proposal.worldId,
    stream: proposal.stream,
    authoritativeScope: "simulation_branch",
    canonDisposition: "proposal",
    writer: { kind: "codex", id: "codex.root" },
    committedAt: proposal.proposedAt,
    expectedVersion: state.version,
    nextVersion: nextState.version,
    expectedSequence: state.sequence,
    nextSequence: nextState.sequence,
    parentCommitRef: proposal.parentCommitRef,
    selectionRef,
    proposalRef,
    actionCatalogRef: proposal.actionCatalogRef,
    decisionRef,
    inputStateRefs: [baseStateRef],
    outputStateRefs: [nextStateRef],
    approvalRefs: structuredClone(approvalRefs),
    choices: materializedActions.map((action) => ({ actionId: action.id, actorId: action.actorId, choice: action.choice })),
    costs: materializedActions.flatMap((action) => action.costs || []),
    changes: materializedActions.flatMap((action) => action.effects || []),
    causality: {
      objective: proposal.objective,
      opposition: proposal.opposition,
      choiceUnderPressure: proposal.choiceUnderPressure,
      stateChange: proposal.stateChange,
      causesNext: proposal.causesNext,
      irreversibility: proposal.irreversibility,
      realizedConsequenceRefs: proposal.realizesConsequenceRefs,
      scheduledConsequenceIds: proposal.delayedConsequences.map((item) => item.id)
    },
    terminalMarker: true
  };
  return {
    status: "accepted_simulation",
    proposal,
    proposalRef,
    decision,
    decisionRef,
    nextState,
    nextStateRef,
    commit,
    commitRef: exactRef(ARTIFACT_KINDS.commit, commit.commitId, commit.version, commit)
  };
}
