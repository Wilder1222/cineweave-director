function assertDate(value, label) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) throw new TypeError(`${label} must be a valid ISO date-time`);
  return parsed;
}

function occurrenceEntries(trigger, state) {
  return (state.timeline || []).filter((entry) => entry?.triggerId === trigger.id
    || (!entry?.triggerId && entry?.eventId === trigger.eventId));
}

/**
 * Evaluate time and recurrence gates from the exact state clock. This helper
 * is intentionally pure so trigger scans, adjudication and Portfolio runs
 * cannot disagree about whether an event is due.
 */
export function evaluateTriggerTiming(trigger, state) {
  if (!trigger || typeof trigger !== "object") throw new TypeError("trigger must be an object");
  const clockAt = assertDate(state?.clock?.at, "state.clock.at");
  const dueAt = trigger.dueAt === undefined || trigger.dueAt === null ? null : assertDate(trigger.dueAt, "trigger.dueAt");
  const cooldownMinutes = trigger.cooldownMinutes === undefined ? 0 : trigger.cooldownMinutes;
  if (!Number.isSafeInteger(cooldownMinutes) || cooldownMinutes < 0 || cooldownMinutes > 5_256_000) throw new TypeError("trigger.cooldownMinutes must be an integer from 0 to 5256000");
  const configuredMaxOccurrences = trigger.maxOccurrences === undefined || trigger.maxOccurrences === null
    ? null
    : trigger.maxOccurrences;
  if (trigger.once === true && configuredMaxOccurrences !== null && configuredMaxOccurrences !== 1) {
    throw new TypeError("trigger.once=true requires trigger.maxOccurrences to be 1 when both are present");
  }
  const maxOccurrences = configuredMaxOccurrences === null
    ? trigger.once === true ? 1 : null
    : configuredMaxOccurrences;
  if (maxOccurrences !== null && (!Number.isSafeInteger(maxOccurrences) || maxOccurrences < 1 || maxOccurrences > 1000)) throw new TypeError("trigger.maxOccurrences must be an integer from 1 to 1000");
  const occurrences = occurrenceEntries(trigger, state);
  const occurrenceTimes = occurrences
    .map((entry) => Date.parse(entry.at))
    .filter((value) => !Number.isNaN(value));
  const lastOccurrenceAt = occurrenceTimes.length ? Math.max(...occurrenceTimes) : null;
  const timeDue = dueAt === null || clockAt >= dueAt;
  const cooldownOpen = lastOccurrenceAt === null || clockAt >= lastOccurrenceAt + cooldownMinutes * 60_000;
  const occurrenceLimitOpen = maxOccurrences === null || occurrences.length < maxOccurrences;
  return {
    clockAt: new Date(clockAt).toISOString(),
    dueAt: dueAt === null ? null : new Date(dueAt).toISOString(),
    cooldownMinutes,
    maxOccurrences,
    occurrenceCount: occurrences.length,
    lastOccurrenceAt: lastOccurrenceAt === null ? null : new Date(lastOccurrenceAt).toISOString(),
    timeDue,
    cooldownOpen,
    occurrenceLimitOpen,
    ready: timeDue && cooldownOpen && occurrenceLimitOpen
  };
}
