import { canonicalize } from "./canonical-json.mjs";
import { resolveExactArtifact } from "./contract-context.mjs";

const objects = (value) => Array.isArray(value) ? value.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item)) : [];
const equal = (left, right) => canonicalize(left) === canonicalize(right);
const outputKey = (target) => canonicalize([target.contractKind, target.ownerRoute, target.route]);
const targetKey = (target) => canonicalize([target.contractKind, target.ownerRoute, target.route, target.fieldPath]);

function indexBy(items, field, path, errors, ordered = false) {
  const index = new Map();
  let previous = 0;
  for (const [position, item] of items.entries()) {
    if (index.has(item[field])) errors.push(`${path}[${position}].${field} duplicates ${item[field]}`);
    else index.set(item[field], item);
    if (ordered && item.order <= previous) errors.push(`${path}[${position}].order must be strictly increasing`);
    previous = item.order;
  }
  return index;
}

function checkValue(value, definition, path, errors) {
  const numeric = ["number", "frame_count"].includes(definition.valueType);
  const typeMatches = definition.valueType === "number" ? typeof value === "number" && Number.isFinite(value)
    : definition.valueType === "frame_count" ? Number.isSafeInteger(value)
      : definition.valueType === "boolean" ? typeof value === "boolean"
        : ["text", "enum"].includes(definition.valueType) && typeof value === "string";
  if (!typeMatches) {
    errors.push(`${path} must match declared valueType ${definition.valueType}`);
    return;
  }
  if (definition.valueType === "enum" && !definition.options?.includes(value)) errors.push(`${path} must be one of the declared options`);
  // step describes the UI increment. Existing continuous overrides do not
  // require quantization; only the declared inclusive bounds are enforced.
  if (numeric && definition.range) {
    if (value < definition.range.minimum) errors.push(`${path} is below manifest range minimum ${definition.range.minimum}`);
    if (value > definition.range.maximum) errors.push(`${path} exceeds manifest range maximum ${definition.range.maximum}`);
  }
}

function declarations(skill, path, errors) {
  const parameters = indexBy(objects(skill.parameters), "parameterId", `${path}.parameters`, errors);
  const slots = indexBy(objects(skill.bindingSlots), "slotId", `${path}.bindingSlots`, errors);
  const program = indexBy(objects(skill.program), "stepId", `${path}.program`, errors, true);
  const groups = indexBy(objects(skill.controlGroups), "groupId", `${path}.controlGroups`, errors, true);
  indexBy(objects(skill.qualityChecks), "checkId", `${path}.qualityChecks`, errors);
  const outputs = new Map();
  for (const [index, output] of objects(skill.outputContracts).entries()) {
    const key = outputKey(output);
    if (outputs.has(key)) errors.push(`${path}.outputContracts[${index}] duplicates an output contract definition`);
    else outputs.set(key, output);
  }
  const declaredTarget = (target, targetPath) => {
    if (!outputs.has(outputKey(target))) errors.push(`${targetPath} does not match a declared output contract, owner and route`);
  };
  for (const [index, parameter] of objects(skill.parameters).entries()) {
    const parameterPath = `${path}.parameters[${index}]`;
    if (parameter.range && parameter.range.minimum > parameter.range.maximum) errors.push(`${parameterPath}.range minimum cannot exceed maximum`);
    if (parameter.valueType === "enum" && (!Array.isArray(parameter.options) || parameter.options.length === 0)) errors.push(`${parameterPath}.options must declare the enum choices`);
    checkValue(parameter.defaultValue, parameter, `${parameterPath}.defaultValue`, errors);
    for (const [targetIndex, target] of objects(parameter.targets).entries()) declaredTarget(target, `${parameterPath}.targets[${targetIndex}]`);
  }
  for (const [index, group] of objects(skill.controlGroups).entries()) for (const parameterId of group.parameterIds ?? []) {
    if (!parameters.has(parameterId)) errors.push(`${path}.controlGroups[${index}].parameterIds references unknown parameter ${parameterId}`);
  }
  for (const [index, step] of objects(skill.program).entries()) {
    const stepPath = `${path}.program[${index}]`;
    declaredTarget(step.target, `${stepPath}.target`);
    if (step.ownerRoute !== step.target.ownerRoute) errors.push(`${stepPath}.ownerRoute must match its target owner`);
    if (step.source.type === "parameter") {
      const parameter = parameters.get(step.source.id);
      if (!parameter) errors.push(`${stepPath}.source references unknown parameter ${step.source.id}`);
      else if (!objects(parameter.targets).some((target) => targetKey(target) === targetKey(step.target))) errors.push(`${stepPath}.target must retain the parameter's declared target`);
    }
    if (step.source.type === "binding_slot" && !slots.has(step.source.id)) errors.push(`${stepPath}.source references unknown binding slot ${step.source.id}`);
  }
  // A quality check may inspect a declared input, such as an ActionSequenceSpec;
  // it does not create an additional output or prove actual media quality.
  const readableKinds = new Set([...outputs.values()].map((output) => output.contractKind));
  for (const slot of slots.values()) for (const kind of slot.acceptedContractKinds ?? []) readableKinds.add(kind);
  for (const [index, check] of objects(skill.qualityChecks).entries()) if (!readableKinds.has(check.targetContractKind)) {
    errors.push(`${path}.qualityChecks[${index}].targetContractKind must name a declared input or output kind`);
  }
  return { parameters, slots, program, groups, outputs };
}

function checkAliases(payload, registry, slots, errors, unverified) {
  const aliases = new Map();
  for (const [index, alias] of objects(registry.aliases).entries()) {
    const path = `$.assetAliasRegistryRef.aliases[${index}]`;
    const normalized = alias.alias.normalize("NFC");
    if (alias.normalizedAlias !== normalized || alias.normalizedAlias !== alias.normalizedAlias.normalize("NFC")) errors.push(`${path}.normalizedAlias must match unicode_nfc_exact canonicalization`);
    if (aliases.has(normalized)) errors.push(`${path}.alias duplicates normalized alias ${normalized}`);
    else aliases.set(normalized, alias);
    if (!registry.scope.targetContractKinds.includes(alias.targetRef.kind)) errors.push(`${path}.targetRef.kind is outside the declared registry scope`);
  }
  for (const [index, binding] of objects(payload.resolvedBindings).entries()) {
    if (binding.source !== "asset_alias") continue;
    const path = `$.resolvedBindings[${index}]`;
    const alias = aliases.get(binding.alias.normalize("NFC"));
    if (!alias) {
      errors.push(`${path}.alias is not declared in the exact registry`);
      continue;
    }
    if (binding.refs.length !== 1 || !equal(binding.refs[0], alias.targetRef)) errors.push(`${path}.refs must equal the alias's one exact targetRef`);
    if (slots?.has(binding.slotId) && alias.role !== slots.get(binding.slotId).role) errors.push(`${path}.alias role must match its manifest slot role`);
    if (!slots) unverified.push(`${path}: manifest slot role is unavailable; alias role compatibility remains unverified`);
  }
  unverified.push("AssetAliasRegistry scope identity cannot be compared with this plan because ShotCompilerPlan has no project/sequence/shot scope identity field");
}

/**
 * Read-only comparison after the caller validates plan structure and local
 * semantics. validateStructure must check each complete exact source schema.
 * Parameter values can project into multiple declared groups or targets.
 */
export async function validateShotCompilerContext(payload, { artifacts = [], validateStructure } = {}) {
  const errors = [], unverified = [];
  const sources = [[payload.cinematicSkillManifestRef, "$.cinematicSkillManifestRef", "cinematicSkillManifestId"]];
  if (payload.assetAliasRegistryRef) sources.push([payload.assetAliasRegistryRef, "$.assetAliasRegistryRef", "assetAliasRegistryId"]);
  const resolved = await Promise.all(sources.map(([ref, label, idField]) => resolveExactArtifact(ref, { artifacts, validateStructure, label, idField })));
  for (const result of resolved) {
    errors.push(...result.errors);
    unverified.push(...result.unverified);
  }
  let definitions = null;
  if (resolved[0].status === "resolved") {
    const manifest = resolved[0].document;
    const skills = indexBy(objects(manifest.skills), "skillId", "$.cinematicSkillManifestRef.skills", errors);
    const skill = skills.get(payload.skillSelection.skillId);
    if (!skill) errors.push("$.skillSelection.skillId is not declared in the exact manifest");
    else if (skill.version !== payload.skillSelection.version) errors.push("$.skillSelection.version must match the selected manifest skill version");
    else {
      definitions = declarations(skill, `$.cinematicSkillManifestRef.skills[${manifest.skills.indexOf(skill)}]`, errors);
      if (payload.intent.storyFunction !== skill.storyFunction) errors.push("$.intent.storyFunction must match the selected manifest skill");
      if (payload.intent.targetLevel !== skill.targetLevel) errors.push("$.intent.targetLevel must match the selected manifest skill");
      const { parameters, slots, program, groups, outputs } = definitions;
      const values = indexBy(objects(payload.parameterValues), "parameterId", "$.parameterValues", errors);
      const bindings = indexBy(objects(payload.resolvedBindings), "slotId", "$.resolvedBindings", errors);
      for (const parameterId of parameters.keys()) if (!values.has(parameterId)) errors.push(`$.parameterValues requires an explicit resolved value for manifest parameter ${parameterId}`);
      for (const [index, parameter] of objects(payload.parameterValues).entries()) {
        const path = `$.parameterValues[${index}]`;
        const definition = parameters.get(parameter.parameterId);
        if (!definition) { errors.push(`${path}.parameterId is not declared in the selected manifest skill`); continue; }
        checkValue(parameter.value, definition, `${path}.value`, errors);
        if (parameter.source === "manifest_default" && !equal(parameter.value, definition.defaultValue)) errors.push(`${path}.value with manifest_default source must equal the declared defaultValue`);
      }
      for (const slot of slots.values()) if (slot.required && !bindings.has(slot.slotId)) errors.push(`$.resolvedBindings requires manifest slot ${slot.slotId}`);
      for (const [index, binding] of objects(payload.resolvedBindings).entries()) {
        const path = `$.resolvedBindings[${index}]`;
        const slot = slots.get(binding.slotId);
        if (!slot) { errors.push(`${path}.slotId is not declared in the selected manifest skill`); continue; }
        if (binding.refs.length > slot.maxBindings) errors.push(`${path}.refs exceeds slot maxBindings ${slot.maxBindings}`);
        for (const ref of binding.refs) if (!slot.acceptedContractKinds.includes(ref.kind)) errors.push(`${path}.refs kind ${ref.kind} is not accepted by the manifest slot`);
      }
      const handoffs = objects(payload.handoffs);
      for (const [index, handoff] of handoffs.entries()) if (!outputs.has(outputKey(handoff))) errors.push(`$.handoffs[${index}] output contract, owner and route must be declared by the selected manifest`);
      const assigned = (target, type, id) => handoffs.some((handoff) => outputKey(handoff) === outputKey(target)
        && objects(handoff.fieldAssignments).some((assignment) => assignment.targetPath === target.fieldPath && assignment.sourceType === type && assignment.sourceId === id));
      for (const output of outputs.values()) if (output.required && !handoffs.some((handoff) => outputKey(handoff) === outputKey(output))) errors.push(`$.handoffs requires the selected manifest output ${output.contractKind} on route ${output.route}`);
      for (const parameter of parameters.values()) for (const target of objects(parameter.targets)) if (!assigned(target, "parameter", parameter.parameterId)) errors.push(`$.handoffs requires the declared target mapping for parameter ${parameter.parameterId} at ${target.fieldPath}`);
      const trace = indexBy(objects(payload.compileTrace?.steps), "stepId", "$.compileTrace.steps", errors);
      for (const [stepId, declaration] of program) {
        if (!trace.has(stepId)) errors.push(`$.compileTrace.steps is missing required manifest program step ${stepId}`);
        if (declaration.operation !== "validate" && !assigned(declaration.target, declaration.source.type, declaration.source.id)) errors.push(`$.handoffs requires the manifest program target mapping for ${stepId}`);
      }
      for (const [index, step] of objects(payload.compileTrace?.steps).entries()) {
        const path = `$.compileTrace.steps[${index}]`;
        const declaration = program.get(step.stepId);
        if (!declaration) { errors.push(`${path}.stepId is not declared by the selected manifest program`); continue; }
        for (const key of ["order", "operation", "ownerRoute", "target", "source"]) if (!equal(step[key], declaration[key])) errors.push(`${path}.${key} must match its selected manifest program declaration`);
      }
      for (const [handoffIndex, handoff] of handoffs.entries()) for (const [assignmentIndex, assignment] of objects(handoff.fieldAssignments).entries()) {
        const path = `$.handoffs[${handoffIndex}].fieldAssignments[${assignmentIndex}]`;
        const target = { contractKind: handoff.contractKind, ownerRoute: handoff.ownerRoute, route: handoff.route, fieldPath: assignment.targetPath };
        const fromProgram = [...program.values()].some((step) => targetKey(step.target) === targetKey(target) && step.source.type === assignment.sourceType && step.source.id === assignment.sourceId);
        const fromParameter = assignment.sourceType === "parameter" && objects(parameters.get(assignment.sourceId)?.targets).some((definition) => targetKey(definition) === targetKey(target));
        if (!fromProgram && !fromParameter) {
          if (assignment.sourceType === "constant") unverified.push(`${path}: explicit caller constant design is preserved; its authority is not declared by the selected manifest`);
          else errors.push(`${path} target and source must be declared by the selected manifest program or parameter targets`);
        }
      }
      const controlGroups = indexBy(objects(payload.controlSurface?.groups), "groupId", "$.controlSurface.groups", errors);
      for (const [groupId, definition] of groups) {
        const group = controlGroups.get(groupId);
        if (!group) { errors.push(`$.controlSurface.groups requires manifest control group ${groupId}`); continue; }
        for (const parameterId of definition.parameterIds) if (!objects(group.controls).some((control) => control.parameterId === parameterId)) errors.push(`$.controlSurface.groups[${groupId}] requires its declared parameter control ${parameterId}`);
      }
      for (const [groupIndex, group] of objects(payload.controlSurface?.groups).entries()) {
        const groupPath = `$.controlSurface.groups[${groupIndex}]`;
        const definition = groups.get(group.groupId);
        if (!definition) { errors.push(`${groupPath}.groupId is not declared in manifest controlGroups`); continue; }
        if (group.domain !== definition.domain || group.order !== definition.order) errors.push(`${groupPath}.domain and order must match manifest controlGroups`);
        for (const [controlIndex, control] of objects(group.controls).entries()) {
          const path = `${groupPath}.controls[${controlIndex}]`;
          const parameter = parameters.get(control.parameterId);
          if (!parameter || !definition.parameterIds.includes(control.parameterId)) { errors.push(`${path}.parameterId must belong to its declared manifest control group`); continue; }
          if (control.enforcement !== parameter.controlLevel) errors.push(`${path}.enforcement must preserve manifest controlLevel ${parameter.controlLevel}`);
          if (control.domain !== definition.domain) errors.push(`${path}.domain must match its declared manifest control group`);
          if (control.unit !== parameter.unit) errors.push(`${path}.unit must match the declared parameter unit`);
          if (!objects(parameter.targets).some((target) => targetKey(target) === targetKey(control.target))) errors.push(`${path}.target must match a declared manifest parameter target`);
        }
      }
    }
  }
  if (resolved[1]?.status === "resolved") checkAliases(payload, resolved[1].document, definitions?.slots, errors, unverified);
  if (objects(payload.resolvedBindings).some((binding) => binding.source === "asset_alias") && !payload.assetAliasRegistryRef) errors.push("$.resolvedBindings alias resolution requires an exact assetAliasRegistryRef");
  unverified.push("Resolved asset refs, upstream content and explicit caller design remain planning declarations; exact manifest and alias hashes do not verify source asset content, generated media quality or external execution");
  return { errors: [...new Set(errors)], unverified: [...new Set(unverified)] };
}
