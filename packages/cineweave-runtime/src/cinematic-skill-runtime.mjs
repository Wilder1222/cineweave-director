import { sha256Canonical } from "./canonical-json.mjs";
import { createAssetAliasResolver } from "./asset-alias-runtime.mjs";
import { validateByKind } from "../../../scripts/validate-contract-semantics.mjs";

const MANIFEST_KIND = "cineweave_codex_cinematic_skill_manifest";
const PLAN_KIND = "cineweave_codex_shot_compiler_plan";
const ALIAS_REGISTRY_KIND = "cineweave_codex_asset_alias_registry";
const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/u;
const contentHashPattern = /^sha256:[0-9a-f]{64}$/u;
const providerWeightPattern = /(?:<lora:[^>\r\n]+>|\([^()\r\n]{1,240}:\s*[-+]?(?:\d+\.\d+|\.\d+)\)|\b(?:prompt|token|style)[ _-]?weight\s*=|\b\d+(?:\.\d+)?\s*::)/iu;
const allowedParameterSources = new Set(["manifest_default", "user_override", "derived"]);
const allowedIntentSources = new Set(["user_authored", "codex_normalized", "upstream_contract"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return structuredClone(value);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function exactRef(value, acceptedKinds = []) {
  return isObject(value)
    && Object.keys(value).length === 4
    && typeof value.kind === "string"
    && identifierPattern.test(value.kind)
    && typeof value.id === "string"
    && identifierPattern.test(value.id)
    && Number.isSafeInteger(value.version)
    && value.version >= 1
    && contentHashPattern.test(value.contentHash || "")
    && (!acceptedKinds.length || acceptedKinds.includes(value.kind));
}

function sameRef(left, right) {
  return exactRef(left) && exactRef(right)
    && left.kind === right.kind
    && left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash;
}

function refKey(ref) {
  return `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
}

function uniqueRefs(refs) {
  return [...new Map(refs.map((ref) => [refKey(ref), clone(ref)])).values()];
}

function scalarEqual(left, right) {
  return Object.is(left, right);
}

function providerSyntax(value) {
  if (typeof value === "string") return providerWeightPattern.test(value);
  if (Array.isArray(value)) return value.some(providerSyntax);
  if (isObject(value)) return Object.values(value).some(providerSyntax);
  return false;
}

function validDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function fail(code, message, path = null, details = {}) {
  throw new CinematicSkillCompileError(code, message, { path, ...details });
}

export class CinematicSkillCompileError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "CinematicSkillCompileError";
    this.code = code;
    this.path = details.path || null;
    this.details = Object.freeze({ ...details });
  }
}

function assertManifest(manifest) {
  if (!isObject(manifest) || manifest.kind !== MANIFEST_KIND) {
    fail("MANIFEST_KIND_INVALID", "CinematicSkillManifest kind is invalid", "/kind");
  }
  let semanticErrors;
  try {
    semanticErrors = validateByKind(manifest);
  } catch (error) {
    fail("MANIFEST_SEMANTICS_UNREADABLE", "CinematicSkillManifest semantic validation could not run", null, { cause: String(error?.message || error) });
  }
  if (semanticErrors.length) fail("MANIFEST_INVALID", semanticErrors.join("; "), null, { errors: semanticErrors });
  if (manifest.status === "deprecated") fail("MANIFEST_DEPRECATED", "A deprecated CinematicSkillManifest cannot be compiled", "/status");
  if (providerSyntax(manifest)) fail("MANIFEST_PROVIDER_SYNTAX", "CinematicSkillManifest contains provider weight syntax");

  for (const skill of manifest.skills) {
    for (const parameter of skill.parameters) validateParameterDefinition(parameter, `/${skill.skillId}/parameters/${parameter.parameterId}`);
  }
  return manifest;
}

function validateParameterDefinition(parameter, path) {
  if (!["enum", "number", "text", "boolean", "frame_count"].includes(parameter?.valueType)) {
    fail("PARAMETER_TYPE_INVALID", `Unsupported parameter type: ${parameter?.valueType}`, `${path}/valueType`);
  }
  if (parameter.valueType === "enum" && (!Array.isArray(parameter.options) || !parameter.options.includes(parameter.defaultValue))) {
    fail("PARAMETER_DEFAULT_INVALID", `Enum parameter default is not one of its options: ${parameter.parameterId}`, `${path}/defaultValue`);
  }
  validateParameterValue(parameter, parameter.defaultValue, `${path}/defaultValue`);
}

function validateParameterValue(parameter, value, path) {
  const label = parameter?.parameterId || "parameter";
  if (value === null || value === undefined) fail("PARAMETER_VALUE_INVALID", `${label} requires a typed value`, path);
  if (parameter.valueType === "enum" && (typeof value !== "string" || !parameter.options.includes(value))) {
    fail("PARAMETER_OPTION_INVALID", `${label} must use a declared option`, path);
  }
  if (parameter.valueType === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    fail("PARAMETER_NUMBER_INVALID", `${label} must be a finite number`, path);
  }
  if (parameter.valueType === "text" && (typeof value !== "string" || value.length > 1600)) {
    fail("PARAMETER_TEXT_INVALID", `${label} must be a bounded text value`, path);
  }
  if (parameter.valueType === "boolean" && typeof value !== "boolean") {
    fail("PARAMETER_BOOLEAN_INVALID", `${label} must be boolean`, path);
  }
  if (parameter.valueType === "frame_count" && (!Number.isSafeInteger(value) || value < 0)) {
    fail("PARAMETER_FRAME_INVALID", `${label} must be a non-negative integer frame count`, path);
  }
  if (parameter.range && typeof value === "number") {
    if (!Number.isFinite(parameter.range.minimum) || !Number.isFinite(parameter.range.maximum) || parameter.range.minimum > parameter.range.maximum) {
      fail("PARAMETER_RANGE_INVALID", `${label} declares an invalid range`, path);
    }
    if (value < parameter.range.minimum || value > parameter.range.maximum) {
      fail("PARAMETER_RANGE_EXCEEDED", `${label} exceeds its declared range`, path);
    }
  }
}

function manifestRef(manifest) {
  return {
    kind: MANIFEST_KIND,
    id: manifest.cinematicSkillManifestId,
    version: manifest.version,
    contentHash: sha256Canonical(manifest)
  };
}

function resolveSkill(manifest, invocation) {
  if (!isObject(invocation)) fail("INVOCATION_INVALID", "Shot compiler invocation must be an object");
  const selection = isObject(invocation.skillSelection) ? invocation.skillSelection : {};
  const skillId = invocation.skillId ?? selection.skillId;
  const version = invocation.skillVersion ?? selection.version;
  if (!identifierPattern.test(skillId || "")) fail("SKILL_SELECTION_INVALID", "A stable skillId is required", "/skillId");
  if (!Number.isSafeInteger(version) || version < 1) fail("SKILL_SELECTION_INVALID", "A positive skill version is required", "/skillVersion");
  const skill = manifest.skills.find((item) => item.skillId === skillId && item.version === version);
  if (!skill) fail("SKILL_NOT_FOUND", `No exact cinematic skill is declared for ${skillId}@${version}`, "/skillSelection");
  return { skill, skillId, version, selection };
}

function resolveIntent(skill, invocation) {
  const input = isObject(invocation.intent) ? invocation.intent : {};
  const summary = input.summary ?? invocation.intentSummary;
  if (typeof summary !== "string" || summary.trim().length === 0 || summary.length > 1600) fail("INTENT_INVALID", "Shot compiler intent needs a bounded summary", "/intent/summary");
  if (providerSyntax(summary)) fail("INTENT_PROVIDER_SYNTAX", "Shot compiler intent must not contain provider weight syntax", "/intent/summary");
  if (input.storyFunction !== undefined && input.storyFunction !== skill.storyFunction) fail("INTENT_MISMATCH", "Intent storyFunction differs from the selected skill", "/intent/storyFunction");
  if (input.targetLevel !== undefined && input.targetLevel !== skill.targetLevel) fail("INTENT_MISMATCH", "Intent targetLevel differs from the selected skill", "/intent/targetLevel");
  const source = input.source || "user_authored";
  if (!allowedIntentSources.has(source)) fail("INTENT_SOURCE_INVALID", "Intent source is not recognized", "/intent/source");
  return {
    summary: summary.trim(),
    storyFunction: skill.storyFunction,
    targetLevel: skill.targetLevel,
    source
  };
}

function parameterInputList(invocation) {
  if (invocation.parameterValues !== undefined && invocation.parameterOverrides !== undefined) {
    fail("PARAMETER_INPUT_AMBIGUOUS", "Use parameterValues or parameterOverrides, not both", "/parameterValues");
  }
  if (Array.isArray(invocation.parameterValues)) return invocation.parameterValues;
  if (isObject(invocation.parameterOverrides)) {
    return Object.entries(invocation.parameterOverrides).map(([parameterId, value]) => ({ parameterId, value, source: "user_override" }));
  }
  if (invocation.parameterValues !== undefined) fail("PARAMETER_INPUT_INVALID", "parameterValues must be an array", "/parameterValues");
  return [];
}

function resolveParameters(skill, invocation) {
  const input = parameterInputList(invocation);
  const parameterMap = new Map(skill.parameters.map((parameter) => [parameter.parameterId, parameter]));
  const seen = new Set();
  const overrides = new Map();
  for (const [index, item] of input.entries()) {
    if (!isObject(item) || !identifierPattern.test(item.parameterId || "") || !Object.hasOwn(item, "value")) {
      fail("PARAMETER_INPUT_INVALID", "Each parameter value needs parameterId and value", `/parameterValues/${index}`);
    }
    if (seen.has(item.parameterId)) fail("PARAMETER_DUPLICATE", `Parameter is supplied more than once: ${item.parameterId}`, `/parameterValues/${index}/parameterId`);
    seen.add(item.parameterId);
    const parameter = parameterMap.get(item.parameterId);
    if (!parameter) fail("PARAMETER_UNKNOWN", `The selected skill does not declare parameter: ${item.parameterId}`, `/parameterValues/${index}/parameterId`);
    const source = item.source || "user_override";
    if (!allowedParameterSources.has(source)) fail("PARAMETER_SOURCE_INVALID", `Unknown parameter source: ${source}`, `/parameterValues/${index}/source`);
    validateParameterValue(parameter, item.value, `/parameterValues/${index}/value`);
    if (source === "manifest_default" && !scalarEqual(item.value, parameter.defaultValue)) fail("PARAMETER_DEFAULT_MISMATCH", `${item.parameterId} is not the manifest default`, `/parameterValues/${index}/value`);
    const displayValue = item.displayValue === undefined ? undefined : String(item.displayValue).slice(0, 240);
    overrides.set(item.parameterId, { value: item.value, source, displayValue });
  }

  return skill.parameters.map((parameter) => {
    const provided = overrides.get(parameter.parameterId);
    const value = provided ? provided.value : parameter.defaultValue;
    validateParameterValue(parameter, value, `/parameterValues/${parameter.parameterId}/value`);
    const result = {
      parameterId: parameter.parameterId,
      value: clone(value),
      source: provided?.source || "manifest_default"
    };
    if (provided?.displayValue !== undefined) result.displayValue = provided.displayValue;
    return result;
  });
}

function bindingInputList(invocation) {
  if (invocation.bindingRequests !== undefined && invocation.bindings !== undefined) {
    fail("BINDING_INPUT_AMBIGUOUS", "Use bindingRequests or bindings, not both", "/bindingRequests");
  }
  const input = invocation.bindingRequests ?? invocation.bindings ?? [];
  if (!Array.isArray(input)) fail("BINDING_INPUT_INVALID", "bindingRequests must be an array", "/bindingRequests");
  return input;
}

function resolveBindings(skill, invocation, options) {
  const requests = bindingInputList(invocation);
  const slotMap = new Map(skill.bindingSlots.map((slot) => [slot.slotId, slot]));
  const requestMap = new Map();
  const aliasRequests = [];
  for (const [index, request] of requests.entries()) {
    if (!isObject(request) || !identifierPattern.test(request.slotId || "")) fail("BINDING_INPUT_INVALID", "Each binding request needs a stable slotId", `/bindingRequests/${index}/slotId`);
    if (requestMap.has(request.slotId)) fail("BINDING_DUPLICATE", `Binding slot is supplied more than once: ${request.slotId}`, `/bindingRequests/${index}/slotId`);
    const slot = slotMap.get(request.slotId);
    if (!slot) fail("BINDING_SLOT_UNKNOWN", `The selected skill does not declare binding slot: ${request.slotId}`, `/bindingRequests/${index}/slotId`);
    const hasAlias = typeof request.alias === "string";
    const hasRefs = request.refs !== undefined || request.ref !== undefined;
    if (hasAlias === hasRefs) fail("BINDING_INPUT_INVALID", `Binding ${request.slotId} must provide exactly one of alias or refs`, `/bindingRequests/${index}`);
    requestMap.set(request.slotId, request);
    if (hasAlias) aliasRequests.push(request);
  }

  const registryRefInput = invocation.assetAliasRegistryRef;
  let registry = null;
  let registryRef = null;
  if (aliasRequests.length > 0 || registryRefInput !== undefined) {
    if (!exactRef(registryRefInput, [ALIAS_REGISTRY_KIND])) fail("ALIAS_REGISTRY_REF_INVALID", "Asset aliases require an exact AssetAliasRegistry reference", "/assetAliasRegistryRef");
    registry = options.assetAliasRegistry;
    if (!registry) fail("ALIAS_REGISTRY_MISSING", "An exact AssetAliasRegistry payload is required to resolve an alias");
    if (registry.kind !== ALIAS_REGISTRY_KIND) fail("ALIAS_REGISTRY_KIND_INVALID", "Supplied alias registry has the wrong kind");
    const registryErrors = validateByKind(registry);
    if (registryErrors.length) fail("ALIAS_REGISTRY_INVALID", registryErrors.join("; "), null, { errors: registryErrors });
    registryRef = {
      kind: ALIAS_REGISTRY_KIND,
      id: registry.assetAliasRegistryId,
      version: registry.version,
      contentHash: sha256Canonical(registry)
    };
    if (!sameRef(registryRefInput, registryRef)) fail("ALIAS_REGISTRY_STALE", "AssetAliasRegistry reference does not match the supplied immutable payload", "/assetAliasRegistryRef");
  }
  const resolver = registry ? createAssetAliasResolver(registry) : null;
  const resolvedBindings = [];
  const unresolved = [];
  for (const slot of skill.bindingSlots) {
    const request = requestMap.get(slot.slotId);
    if (!request) {
      if (slot.required) fail("BINDING_REQUIRED", `Required binding slot is unresolved: ${slot.slotId}`, `/bindingRequests/${slot.slotId}`);
      unresolved.push(`Optional binding slot ${slot.slotId} remains unresolved for owner completion.`);
      continue;
    }
    let refs;
    let source;
    if (typeof request.alias === "string") {
      source = "asset_alias";
      let target;
      try {
        target = resolver.resolve(request.alias);
      } catch (error) {
        fail(error?.code || "ALIAS_RESOLUTION_FAILED", error?.message || "Asset alias resolution failed", `/bindingRequests/${slot.slotId}/alias`);
      }
      refs = [target];
    } else {
      source = "exact_ref";
      const rawRefs = request.refs === undefined ? [request.ref] : request.refs;
      if (!Array.isArray(rawRefs) || rawRefs.length < 1) fail("BINDING_REFS_INVALID", `Binding ${slot.slotId} needs at least one exact ref`, `/bindingRequests/${slot.slotId}/refs`);
      refs = rawRefs.map((ref, index) => {
        if (!exactRef(ref)) fail("BINDING_REF_INVALID", `Binding ${slot.slotId} contains a malformed exact ref`, `/bindingRequests/${slot.slotId}/refs/${index}`);
        return clone(ref);
      });
      if (new Set(refs.map(refKey)).size !== refs.length) fail("BINDING_DUPLICATE_REF", `Binding ${slot.slotId} contains duplicate exact refs`, `/bindingRequests/${slot.slotId}/refs`);
    }
    if (refs.length > slot.maxBindings) fail("BINDING_CAPACITY_EXCEEDED", `Binding ${slot.slotId} exceeds its declared capacity`, `/bindingRequests/${slot.slotId}`);
    for (const ref of refs) if (!slot.acceptedContractKinds.includes(ref.kind)) fail("BINDING_KIND_INVALID", `Binding ${slot.slotId} does not accept ${ref.kind}`, `/bindingRequests/${slot.slotId}`);
    const output = { slotId: slot.slotId, source, refs };
    if (source === "asset_alias") output.alias = request.alias;
    resolvedBindings.push(output);
  }
  return { resolvedBindings, registryRef, registry, unresolved };
}

function targetKey(target) {
  return `${target.contractKind}|${target.route}`;
}

function controlSurface(skill, parameterValues, unresolved) {
  const values = new Map(parameterValues.map((item) => [item.parameterId, item]));
  const parameters = new Map(skill.parameters.map((item) => [item.parameterId, item]));
  const groups = skill.controlGroups.map((group) => ({
    groupId: group.groupId,
    order: group.order,
    label: group.label,
    domain: group.domain,
    controls: group.parameterIds.map((parameterId) => {
      const parameter = parameters.get(parameterId);
      const value = values.get(parameterId);
      const target = parameter.targets[0];
      if (parameter.targets.length > 1) unresolved.push(`Parameter ${parameterId} has multiple canonical targets; the first declared target was projected and the owner must confirm the rest.`);
      const control = {
        controlId: `control.${skill.skillId}.${parameterId}`,
        parameterId,
        label: parameter.label,
        domain: group.domain,
        value: clone(value.value),
        state: value.source === "derived" ? "derived" : parameter.controlLevel === "hard" ? "locked" : "editable",
        enforcement: parameter.controlLevel,
        ownerSkill: target.ownerSkill,
        target: clone(target)
      };
      if (parameter.unit !== undefined) control.unit = parameter.unit;
      return control;
    })
  }));
  return { surfaceVersion: "1.0.0", projectionOnly: true, groups };
}

function dependencyRefsFor(output, skill, resolvedBindings, upstreamRefs) {
  const bindingMap = new Map(resolvedBindings.map((binding) => [binding.slotId, binding.refs]));
  const refs = [];
  const steps = skill.program.filter((step) => targetKey(step.target) === targetKey(output));
  for (const step of steps) {
    if (step.source.type === "binding_slot") refs.push(...(bindingMap.get(step.source.id) || []));
    if (step.source.type === "upstream_ref") {
      const matching = upstreamRefs.filter((ref) => ref.id === step.source.id);
      if (!matching.length) fail("UPSTREAM_REF_MISSING", `Program step ${step.stepId} needs upstream ref ${step.source.id}`, `/upstreamRefs`);
      refs.push(...matching);
    }
  }
  if (!steps.length) refs.push(...upstreamRefs);
  const unique = uniqueRefs(refs);
  if (unique.length > 32) fail("HANDOFF_DEPENDENCY_LIMIT", `Handoff ${output.contractKind}/${output.route} exceeds 32 exact dependencies`);
  return unique;
}

function handoffs(skill, resolvedBindings, upstreamRefs, unresolved) {
  return skill.outputContracts.map((output, index) => {
    const steps = skill.program.filter((step) => targetKey(step.target) === targetKey(output));
    const fieldAssignments = steps.map((step) => ({
      targetPath: step.target.fieldPath,
      sourceType: step.source.type,
      sourceId: step.source.id,
      note: step.rationale
    }));
    if (!fieldAssignments.length) {
      unresolved.push(`${output.contractKind}/${output.route} has no direct program assignment; owner completion remains required.`);
      fieldAssignments.push({
        targetPath: "ownerCompletion",
        sourceType: "preserve",
        sourceId: "owner_completion",
        note: "The selected skill declares this output without a direct field assignment. The owning Skill must complete it."
      });
    }
    return {
      handoffId: `handoff.${skill.skillId}.${output.route}`,
      order: index + 1,
      contractKind: output.contractKind,
      ownerSkill: output.ownerSkill,
      route: output.route,
      status: "planned",
      purpose: output.purpose,
      dependencyRefs: dependencyRefsFor(output, skill, resolvedBindings, upstreamRefs),
      fieldAssignments
    };
  });
}

function upstreamRefs(invocation) {
  const refs = invocation.upstreamRefs ?? [];
  if (!Array.isArray(refs) || refs.length > 32) fail("UPSTREAM_REFS_INVALID", "upstreamRefs must contain at most 32 exact refs", "/upstreamRefs");
  const result = refs.map((ref, index) => {
    if (!exactRef(ref)) fail("UPSTREAM_REF_INVALID", "upstreamRefs must contain exact contract refs", `/upstreamRefs/${index}`);
    return clone(ref);
  });
  if (new Set(result.map(refKey)).size !== result.length) fail("UPSTREAM_REF_DUPLICATE", "upstreamRefs must be unique", "/upstreamRefs");
  return result;
}

function traceFor(skill) {
  return skill.program.map((step) => ({
    stepId: step.stepId,
    order: step.order,
    operation: step.operation,
    ownerSkill: step.ownerSkill,
    target: clone(step.target),
    source: clone(step.source)
  }));
}

function planIdFor(skill, identity, invocation) {
  const explicit = invocation.planId ?? invocation.shotCompilerPlanId;
  if (explicit !== undefined) {
    if (typeof explicit !== "string" || !identifierPattern.test(explicit)) fail("PLAN_ID_INVALID", "shotCompilerPlanId must be a stable identifier", "/planId");
    return explicit;
  }
  const suffix = sha256Canonical(identity).slice(7, 19);
  return `shot-compiler.${skill.skillId}.${suffix}`;
}

function timestampFor(manifest, invocation, options) {
  const timestamp = invocation.createdAt ?? options.createdAt ?? manifest.provenance.updatedAt;
  if (!validDateTime(timestamp)) fail("TIMESTAMP_INVALID", "Compiler timestamp must be a valid date-time", "/createdAt");
  return new Date(timestamp).toISOString();
}

function semanticCheck(plan, manifest, registry) {
  const errors = validateByKind(plan, {
    cinematicSkillManifest: manifest,
    ...(registry ? { assetAliasRegistry: registry } : {})
  });
  if (errors.length) fail("PLAN_SEMANTICS_INVALID", errors.join("; "), null, { errors });
}

export function listAtomicCinematicSkills(manifest) {
  const checked = assertManifest(manifest);
  return deepFreeze(checked.skills.map((skill) => ({
    skillId: skill.skillId,
    version: skill.version,
    title: skill.title,
    storyFunction: skill.storyFunction,
    targetLevel: skill.targetLevel,
    summary: skill.summary
  })));
}

export function compileShotPlan(manifest, invocation, options = {}) {
  const checkedManifest = assertManifest(manifest);
  if (!isObject(options)) fail("OPTIONS_INVALID", "Shot compiler options must be an object");
  if (invocation?.version !== undefined && (!Number.isSafeInteger(invocation.version) || invocation.version < 1)) {
    fail("PLAN_VERSION_INVALID", "Plan version must be a positive safe integer", "/version");
  }
  const expectedManifestRef = manifestRef(checkedManifest);
  if (!sameRef(invocation?.cinematicSkillManifestRef, expectedManifestRef)) {
    fail("MANIFEST_REF_STALE", "Invocation must carry the exact canonical CinematicSkillManifest ref", "/cinematicSkillManifestRef");
  }
  const { skill, selection, skillId, version } = resolveSkill(checkedManifest, invocation);
  const intent = resolveIntent(skill, invocation);
  const parameterValues = resolveParameters(skill, invocation);
  const resolvedUpstreamRefs = upstreamRefs(invocation);
  const bindingResult = resolveBindings(skill, invocation, options);
  const unresolved = [...bindingResult.unresolved];
  const controls = controlSurface(skill, parameterValues, unresolved);
  const compiledHandoffs = handoffs(skill, bindingResult.resolvedBindings, resolvedUpstreamRefs, unresolved);
  const identity = {
    cinematicSkillManifestRef: expectedManifestRef,
    skillSelection: { skillId, version },
    intent,
    parameterValues,
    resolvedBindings: bindingResult.resolvedBindings,
    upstreamRefs: resolvedUpstreamRefs,
    assetAliasRegistryRef: bindingResult.registryRef
  };
  const createdAt = timestampFor(checkedManifest, invocation, options);
  const plan = {
    kind: PLAN_KIND,
    contractVersion: "2.5.0",
    shotCompilerPlanId: planIdFor(skill, identity, invocation),
    version: invocation.version ?? 1,
    cinematicSkillManifestRef: expectedManifestRef,
    ...(bindingResult.registryRef ? { assetAliasRegistryRef: bindingResult.registryRef } : {}),
    skillSelection: {
      skillId,
      version,
      selectionMode: selection.selectionMode === "recommended" ? "recommended" : "explicit",
      ...(typeof selection.selectionReason === "string" ? { selectionReason: selection.selectionReason.slice(0, 1200) } : {})
    },
    intent,
    parameterValues,
    resolvedBindings: bindingResult.resolvedBindings,
    upstreamRefs: resolvedUpstreamRefs,
    controlSurface: controls,
    handoffs: compiledHandoffs,
    compileTrace: {
      stages: ["resolve_intent", "resolve_exact_bindings", "resolve_parameters", "project_control_surface", "prepare_department_handoffs"],
      steps: traceFor(skill),
      unresolved: unresolved.length ? unresolved : ["No unresolved compiler decisions; owner Skills still author canonical contracts."],
      conflicts: []
    },
    skillReceipt: clone(checkedManifest.skillReceipt),
    executionBoundary: {
      providerNeutral: true,
      generatesMedia: false,
      executesAdapter: false,
      mutatesCanon: false,
      writesFiles: false,
      humanApprovalRequired: true,
      notes: "Shot Compiler 只生成可审阅的部门交接计划，不选择模型、不调用 provider，也不写入 Canon。"
    },
    validation: {
      manifestRefExact: true,
      skillSelectionExact: true,
      parametersResolved: true,
      bindingsResolved: true,
      controlsProjectionOnly: true,
      handoffsOwned: true,
      programTraceOrdered: true,
      noProviderSelection: true,
      noCanonMutation: true,
      noExecution: true
    },
    provenance: {
      source: "codex_authored",
      createdAt,
      updatedAt: createdAt,
      parentId: checkedManifest.cinematicSkillManifestId,
      changeLog: [`Compiled ${skillId}@${version} into exact owner handoffs and projection-only creator controls.`]
    }
  };
  semanticCheck(plan, checkedManifest, bindingResult.registry);
  return deepFreeze(plan);
}

export function createShotCompiler(manifest, options = {}) {
  const checkedManifest = assertManifest(manifest);
  return Object.freeze({
    manifestRef: deepFreeze(manifestRef(checkedManifest)),
    listSkills: () => listAtomicCinematicSkills(checkedManifest),
    compile: (invocation) => compileShotPlan(checkedManifest, invocation, options)
  });
}
