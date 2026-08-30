import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { deepClone, exactRef, isExactRef, isPlainObject, pointerTokens, sameRef } from "./json.mjs";

const EFFECT_OPERATIONS = new Set(["replace", "add", "increment", "append"]);
const CANON_IMPACT = Object.freeze({ none: 0, candidate_fact: 1, canon_mutation: 2 });

function assertString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be a non-empty string`);
}

function assertStringArray(value, label, { minimum = 1 } = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new TypeError(`${label} must contain at least ${minimum} non-empty strings`);
  }
  if (new Set(value).size !== value.length) throw new TypeError(`${label} must not contain duplicates`);
}

export function assertActionCatalogContract(catalog) {
  if (!isPlainObject(catalog) || catalog.kind !== ARTIFACT_KINDS.actionCatalog || catalog.contractVersion !== WORLD_OS_VERSION) {
    throw new Error("Unsupported action catalog");
  }
  for (const field of ["catalogId", "worldId"]) assertString(catalog[field], field);
  if (!Number.isSafeInteger(catalog.version) || catalog.version < 1) throw new TypeError("Action catalog version must be positive");
  if (!isExactRef(catalog.worldCardRef)) throw new TypeError("Action catalog worldCardRef must be exact");
  if (!Array.isArray(catalog.actions) || !catalog.actions.length) throw new TypeError("Action catalog must contain actions");
  const ids = new Set();
  for (const [index, action] of catalog.actions.entries()) {
    const label = `actions[${index}]`;
    if (!isPlainObject(action)) throw new TypeError(`${label} must be an object`);
    for (const field of [
      "id", "status", "actorId", "applicableTriggerIds", "locationId", "preconditions", "goalRefs",
      "capabilityRefs", "knowledgeRefs", "preferenceRefs", "limitRefs", "ruleRefs", "ruleChecks",
      "choice", "costs", "effects", "durationMinutes", "canonImpactCeiling", "irreversibility",
      "gatePolicy", "sourceBeatRefs"
    ]) if (!Object.hasOwn(action, field)) throw new TypeError(`${label} is missing ${field}`);
    for (const field of ["id", "actorId", "locationId", "choice", "gatePolicy"]) assertString(action[field], `${label}.${field}`);
    if (action.status !== "proposed") throw new TypeError(`${label}.status must be proposed`);
    if (ids.has(action.id)) throw new TypeError(`Duplicate catalog action ${action.id}`);
    ids.add(action.id);
    for (const field of [
      "applicableTriggerIds", "goalRefs", "capabilityRefs", "knowledgeRefs", "preferenceRefs", "limitRefs",
      "ruleRefs", "costs", "sourceBeatRefs"
    ]) assertStringArray(action[field], `${label}.${field}`);
    if (!isPlainObject(action.preconditions)) throw new TypeError(`${label}.preconditions must be an object`);
    if (!Array.isArray(action.ruleChecks) || !action.ruleChecks.length) throw new TypeError(`${label}.ruleChecks must not be empty`);
    for (const [ruleIndex, ruleCheck] of action.ruleChecks.entries()) {
      if (!isPlainObject(ruleCheck) || typeof ruleCheck.ruleRef !== "string" || ruleCheck.result !== "pass" || typeof ruleCheck.evidence !== "string" || !ruleCheck.evidence.trim()) {
        throw new TypeError(`${label}.ruleChecks[${ruleIndex}] is invalid`);
      }
    }
    if (!Array.isArray(action.effects) || !action.effects.length) throw new TypeError(`${label}.effects must not be empty`);
    for (const [effectIndex, effect] of action.effects.entries()) {
      if (!isPlainObject(effect) || !EFFECT_OPERATIONS.has(effect.op) || typeof effect.path !== "string" || !Object.hasOwn(effect, "value")) {
        throw new TypeError(`${label}.effects[${effectIndex}] is invalid`);
      }
      pointerTokens(effect.path);
    }
    if (!Number.isSafeInteger(action.durationMinutes) || action.durationMinutes < 1 || action.durationMinutes > 1440) {
      throw new TypeError(`${label}.durationMinutes must be an integer from 1 to 1440`);
    }
    if (!Object.hasOwn(CANON_IMPACT, action.canonImpactCeiling)) throw new TypeError(`${label}.canonImpactCeiling is invalid`);
    if (!["reversible", "costly_to_reverse", "irreversible"].includes(action.irreversibility)) throw new TypeError(`${label}.irreversibility is invalid`);
  }
  return catalog;
}

export function actionCatalogRef(catalog) {
  assertActionCatalogContract(catalog);
  return exactRef(ARTIFACT_KINDS.actionCatalog, catalog.catalogId, catalog.version, catalog);
}

export function materializeProposalActions(proposal, catalog) {
  assertActionCatalogContract(catalog);
  if (!sameRef(proposal.actionCatalogRef, actionCatalogRef(catalog))) throw new Error("Proposal does not bind this exact action catalog");
  if (catalog.worldId !== proposal.worldId || !sameRef(catalog.worldCardRef, proposal.worldCardRef)) {
    throw new Error("Action catalog world binding does not match the proposal");
  }
  if (!Array.isArray(proposal.actions) || !proposal.actions.length) throw new TypeError("Proposal must reference at least one action");
  const byId = new Map(catalog.actions.map((action) => [action.id, action]));
  const seen = new Set();
  return proposal.actions.map((reference, index) => {
    if (!isPlainObject(reference) || typeof reference.actionId !== "string" || !isPlainObject(reference.parameters)) {
      throw new TypeError(`actions[${index}] must contain actionId and parameters`);
    }
    if (Object.keys(reference.parameters).length) throw new Error("Parameterized catalog actions are reserved for a later contract version");
    if (seen.has(reference.actionId)) throw new Error(`Duplicate proposal action ${reference.actionId}`);
    seen.add(reference.actionId);
    const action = byId.get(reference.actionId);
    if (!action) throw new Error(`Action ${reference.actionId} is outside the exact action catalog`);
    return deepClone(action);
  });
}

export function canonImpactWithinCeiling(impact, ceiling) {
  return Object.hasOwn(CANON_IMPACT, impact) && Object.hasOwn(CANON_IMPACT, ceiling) && CANON_IMPACT[impact] <= CANON_IMPACT[ceiling];
}
