// Deterministic checks for an adapter's own representation. No provider calls,
// source-prompt equality claims, Unicode normalization, or input mutation.

const MIDJOURNEY_PARAMETERS = new Map([
  ["--v", "version"], ["--version", "version"],
  ["--ar", "aspect-ratio"], ["--aspect", "aspect-ratio"],
  ["--s", "stylize"], ["--stylize", "stylize"],
  ["--c", "chaos"], ["--chaos", "chaos"],
  ["--w", "weird"], ["--weird", "weird"],
  ["--q", "quality"], ["--quality", "quality"],
  ["--seed", "seed"], ["--iw", "image-weight"],
  ["--sw", "style-weight"], ["--sv", "style-version"],
  ["--ow", "omni-weight"], ["--no", "exclusions"],
  ["--sref", "style-reference"], ["--oref", "omni-reference"],
  ["--p", "personalization"], ["--personalize", "personalization"],
  ["--raw", "raw"], ["--hd", "hd"], ["--sd", "sd"],
]);
const MIDJOURNEY_FLAGS = new Set(["--raw", "--hd", "--sd"]);
const PLACEHOLDER_PATTERN = /\bREF_[A-Z0-9_]{3,120}\b/gu;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function checkUnique(records, field, path, errors) {
  const seen = new Set();
  records.forEach((record, index) => {
    if (!isObject(record) || record[field] === undefined) return;
    if (seen.has(record[field])) errors.push(`${path}[${index}].${field} duplicates ${JSON.stringify(record[field])}`);
    seen.add(record[field]);
  });
}

function renderParameterToken(token, dialectId, path, errors, unverified) {
  if (dialectId !== "midjourney" || !MIDJOURNEY_PARAMETERS.has(token.name)) {
    unverified.push(`${path}.rendered syntax and parameter name repetition are unverified for dialect ${JSON.stringify(dialectId)} and name ${JSON.stringify(token.name)}`);
    return undefined;
  }
  if (MIDJOURNEY_FLAGS.has(token.name)) {
    if (token.value !== true) {
      errors.push(`${path}.value must be true for the documented ${token.name} flag; false/null have no defined rendering`);
      return undefined;
    }
    return token.name;
  }
  if (typeof token.value === "string") {
    if (!token.value.length || token.value !== token.value.trim() || /[\r\n]/u.test(token.value)) {
      errors.push(`${path}.value must be a non-empty single-line string without leading or trailing whitespace`);
      return undefined;
    }
    if (/(?:^|\s)--[a-z][a-z0-9-]*/u.test(token.value)) {
      errors.push(`${path}.value contains an embedded parameter delimiter; each control must have its own declared token`);
      return undefined;
    }
    return `${token.name} ${token.value}`;
  }
  if (typeof token.value === "number" && Number.isFinite(token.value)) return `${token.name} ${token.value}`;
  errors.push(`${path}.value must be a string or finite number for ${token.name}; boolean/null rendering is not defined`);
  return undefined;
}

function containsPrivateLocator(value) {
  if (typeof value !== "string") return false;
  return /\bfile:/iu.test(value)
    || /(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s]/u.test(value)
    || /\\\\[^\s\\]+\\/u.test(value)
    || /(?:^|[\s"'(])\/(?:Users|home|root|private|Volumes|mnt)\//iu.test(value)
    || /https?:\/\/[^\s/@:]+:[^\s/@]+@/iu.test(value)
    || /[?&](?:x-amz-(?:signature|credential|security-token)|x-goog-(?:signature|credential)|access_token|api_key|auth_token|sig|signature)=/iu.test(value);
}

function validateParameters(payload, rendered, errors, unverified) {
  const tokens = array(payload.parameterTokens);
  const dialectId = payload.dialect?.dialectId;
  checkUnique(tokens, "parameterId", "$.parameterTokens", errors);
  checkUnique(tokens, "order", "$.parameterTokens", errors);
  const knownNames = new Set();
  tokens.forEach((token, index) => {
    if (!isObject(token)) return;
    const path = `$.parameterTokens[${index}]`;
    if (dialectId === "midjourney" && MIDJOURNEY_PARAMETERS.has(token.name)) {
      const group = MIDJOURNEY_PARAMETERS.get(token.name);
      if (knownNames.has(group)) errors.push(`${path}.name repeats a singleton Midjourney parameter ${token.name}; supported multi-values belong in one token`);
      knownNames.add(group);
    }
    const expected = renderParameterToken(token, dialectId, path, errors, unverified);
    if (expected !== undefined && token.rendered !== expected) errors.push(`${path}.rendered must equal ${JSON.stringify(expected)} from its name and value`);
  });
  // Even when a dialect's serialization is unknown, the recorded ordered token
  // strings must reproduce the recorded tail. Sorting uses a fresh array.
  if (tokens.every((token) => isObject(token) && typeof token.rendered === "string" && Number.isInteger(token.order))) {
    const tail = [...tokens].sort((a, b) => a.order - b.order).map((token) => token.rendered).join(" ");
    if (rendered.parameterTail !== tail) errors.push("$.renderedPrompt.parameterTail must equal parameterTokens rendered in unique order joined by one ASCII space");
  }
}

function validateBindings(payload, rendered, errors, unverified) {
  const references = array(payload.referenceBindings);
  const profiles = array(payload.profileBindings);
  checkUnique(references, "bindingId", "$.referenceBindings", errors);
  checkUnique(references, "externalLocatorPlaceholder", "$.referenceBindings", errors);
  checkUnique(profiles, "bindingId", "$.profileBindings", errors);
  const referenceIds = new Set(references.map((binding) => binding?.bindingId));
  profiles.forEach((binding, index) => {
    if (!isObject(binding)) return;
    const path = `$.profileBindings[${index}]`;
    if (referenceIds.has(binding.bindingId)) errors.push(`${path}.bindingId duplicates a reference binding id`);
    if (typeof binding.providerHandle === "string" && /(?:https?:|file:|[\\/?#])/iu.test(binding.providerHandle)) errors.push(`${path}.providerHandle must be a provider identifier without a URL, path, query, or fragment`);
    const hasCode = typeof binding.resolvedCode === "string" && binding.resolvedCode.trim().length > 0;
    if (binding.resolvedCodeState === "returned_exact" && !hasCode) errors.push(`${path}.resolvedCode must be present for returned_exact`);
    if (["pending_external_submission", "not_applicable"].includes(binding.resolvedCodeState) && Object.hasOwn(binding, "resolvedCode")) errors.push(`${path}.resolvedCode must be absent for ${binding.resolvedCodeState}`);
    if (containsPrivateLocator(binding.resolvedCode)) errors.push(`${path}.resolvedCode contains a private locator rather than a provider code`);
  });
  const seenSlots = new Set();
  references.forEach((binding, index) => {
    if (!isObject(binding) || typeof binding.surfaceSlot !== "string") return;
    if (seenSlots.has(binding.surfaceSlot)) unverified.push(`$.referenceBindings[${index}].surfaceSlot cardinality is unverified for the repeated category ${JSON.stringify(binding.surfaceSlot)}; verify the exact capability and interface`);
    seenSlots.add(binding.surfaceSlot);
  });
  const declared = new Set(references.map((binding) => binding?.externalLocatorPlaceholder).filter((value) => typeof value === "string"));
  const placeholders = array(rendered.referencePlaceholders);
  const seen = new Set();
  placeholders.forEach((placeholder, index) => {
    if (seen.has(placeholder)) errors.push(`$.renderedPrompt.referencePlaceholders[${index}] duplicates ${JSON.stringify(placeholder)}`);
    if (!declared.has(placeholder)) errors.push(`$.renderedPrompt.referencePlaceholders[${index}] has no declared reference binding for ${JSON.stringify(placeholder)}`);
    seen.add(placeholder);
  });
  for (const placeholder of declared) {
    if (!seen.has(placeholder)) errors.push(`$.renderedPrompt.referencePlaceholders is missing declared binding ${JSON.stringify(placeholder)}`);
  }
  // Web attachment placeholders are side-channel metadata and need not appear
  // in body/copyText. A placeholder that does appear must still be declared.
  const copies = [
    ["$.promptBody", payload.promptBody],
    ["$.renderedPrompt.copyText", rendered.copyText],
    ...array(payload.experimentPlan?.variants).map((variant, index) => [`$.experimentPlan.variants[${index}].renderedPrompt`, variant?.renderedPrompt]),
  ];
  for (const [path, value] of copies) {
    if (typeof value !== "string") continue;
    for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
      if (!declared.has(match[0])) errors.push(`${path} contains undeclared reference placeholder ${match[0]}`);
    }
  }
}

function validateExperiments(payload, errors, unverified) {
  const plan = isObject(payload.experimentPlan) ? payload.experimentPlan : {};
  const variants = array(plan.variants);
  checkUnique(variants, "variantId", "$.experimentPlan.variants", errors);
  const baselines = variants.filter((variant) => variant?.role === "baseline");
  if (baselines.length !== 1) errors.push("$.experimentPlan.variants must contain exactly one baseline");
  if (!variants.some((variant) => variant?.variantId === plan.baselineVariantId && variant.role === "baseline")) errors.push("$.experimentPlan.baselineVariantId must resolve to the unique baseline variant");
  variants.forEach((variant, index) => {
    if (!isObject(variant)) return;
    const path = `$.experimentPlan.variants[${index}]`;
    if (variant.role === "baseline" && variant.changedVariable !== null) errors.push(`${path}.changedVariable must be null for a baseline`);
    if (variant.role === "single_variable_test") {
      if (typeof variant.changedVariable !== "string" || !variant.changedVariable.trim()) errors.push(`${path}.changedVariable must name a non-empty variable for single_variable_test`);
      unverified.push(`${path} single-variable heldConstants and expectedEffect are free-text claims requiring review against the baseline and actual returned media`);
    }
    if (containsPrivateLocator(variant.renderedPrompt)) errors.push(`${path}.renderedPrompt contains a private locator in adapter copy`);
  });
}

export function validateProjectionIntegrity(payload) {
  const errors = [];
  const unverified = [];
  if (!isObject(payload)) return { errors, unverified };
  const rendered = isObject(payload.renderedPrompt) ? payload.renderedPrompt : {};
  if (typeof payload.promptBody === "string" && rendered.body !== payload.promptBody) errors.push("$.renderedPrompt.body must exactly equal $.promptBody without Unicode normalization");
  validateParameters(payload, rendered, errors, unverified);
  if (typeof rendered.body === "string" && typeof rendered.parameterTail === "string") {
    const expectedCopy = rendered.parameterTail ? `${rendered.body} ${rendered.parameterTail}` : rendered.body;
    if (rendered.copyText !== expectedCopy) errors.push("$.renderedPrompt.copyText must equal body plus one ASCII space and parameterTail, or body alone when the tail is empty");
  }
  validateBindings(payload, rendered, errors, unverified);
  if (containsPrivateLocator(rendered.copyText)) errors.push("$.renderedPrompt.copyText contains a private locator in adapter copy despite containsPrivateLocator=false");
  validateExperiments(payload, errors, unverified);
  return { errors, unverified };
}
