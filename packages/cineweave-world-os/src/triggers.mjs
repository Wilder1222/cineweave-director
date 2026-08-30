import { WORLD_OS_VERSION } from "./constants.mjs";
import { evaluateCondition } from "./engine.mjs";
import { evaluateTriggerTiming } from "./timing.mjs";

export function scanTriggerCatalog(catalog, state) {
  if (catalog?.kind !== "world_os_trigger_catalog" || catalog.contractVersion !== WORLD_OS_VERSION) throw new Error("Unsupported trigger catalog");
  if (catalog.worldId !== state?.worldId) throw new Error("Trigger catalog and state belong to different worlds");
  const entries = (catalog.triggers || []).map((trigger) => {
    const evaluation = evaluateCondition(trigger.when, state);
    const timing = evaluateTriggerTiming(trigger, state);
    const alreadyOccurred = trigger.once === true && !timing.occurrenceLimitOpen;
    const unknownBlocked = evaluation.unknown === true && trigger.unknownPolicy !== "allow";
    const rawConditionMet = evaluation.result === true && !unknownBlocked;
    const conditionMet = trigger.status === "proposed" && rawConditionMet && !alreadyOccurred && timing.ready;
    const gateOpen = new Set(["simulation_candidate_only", "auto_simulation"]).has(trigger.gatePolicy);
    const transitionEligible = conditionMet && gateOpen;
    const scheduleBlocked = !timing.occurrenceLimitOpen ? "max_occurrences_reached"
      : !timing.timeDue ? "not_due_yet"
        : !timing.cooldownOpen ? "cooldown_active" : null;
    return {
      triggerId: trigger.id,
      eventId: trigger.eventId,
      priority: trigger.priority,
      conditionMet,
      rawConditionMet,
      transitionEligible,
      eligible: transitionEligible,
      status: transitionEligible ? "eligible"
        : alreadyOccurred ? "already_occurred"
          : scheduleBlocked ? scheduleBlocked
          : unknownBlocked ? "unknown_blocked"
            : !evaluation.result ? "conditions_not_met"
              : trigger.status !== "proposed" ? "inactive"
                : "needs_human_gate",
      gatePolicy: trigger.gatePolicy,
      requiredRuleRefs: trigger.requiredRuleRefs,
      evaluation,
      timing
    };
  }).sort((left, right) => Number(right.transitionEligible) - Number(left.transitionEligible)
    || Number(right.conditionMet) - Number(left.conditionMet)
    || right.priority - left.priority
    || left.triggerId.localeCompare(right.triggerId));
  return {
    kind: "world_os_trigger_scan",
    contractVersion: WORLD_OS_VERSION,
    catalogId: catalog.catalogId,
    worldId: state.worldId,
    stateId: state.stateId,
    stateVersion: state.version,
    sequence: state.sequence,
    candidateCount: entries.filter((entry) => entry.conditionMet).length,
    eligibleCount: entries.filter((entry) => entry.transitionEligible).length,
    entries
  };
}
