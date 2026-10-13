import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePayload } from "../scripts/validate-output.mjs";
import { canonicalize, sha256Canonical } from "../scripts/canonical-json.mjs";
import { validateShotCompilerContext } from "../scripts/validate-shot-compiler.mjs";

const contractRoot = new URL("../skills/cineweave-director/resources/contracts/", import.meta.url);
const schemaPath = fileURLToPath(new URL("schemas/shot-compiler-plan.schema.json", contractRoot));
const templates = Promise.all(["shot-compiler-plan", "cinematic-skill-manifest", "asset-alias-registry"].map(async (name) =>
  JSON.parse(await readFile(new URL(`examples/${name}.json`, contractRoot), "utf8"))));

function exactRef(document, idField) {
  return { kind: document.kind, id: document[idField], version: document.version, contentHash: sha256Canonical(document) };
}

async function fixture() {
  const [payload, manifest, registry] = structuredClone(await templates);
  return { payload, manifest, registry };
}

function selected(data) {
  return data.manifest.skills.find((skill) => skill.skillId === "slow-push-reaction");
}

function context(data, includeRegistry = false) {
  data.payload.cinematicSkillManifestRef = exactRef(data.manifest, "cinematicSkillManifestId");
  const artifacts = [{ ref: structuredClone(data.payload.cinematicSkillManifestRef), document: data.manifest }];
  if (includeRegistry) {
    data.payload.assetAliasRegistryRef = exactRef(data.registry, "assetAliasRegistryId");
    artifacts.push({ ref: structuredClone(data.payload.assetAliasRegistryRef), document: data.registry });
  }
  return artifacts;
}

function setValue(data, value, parameterId = "push_intensity") {
  data.payload.parameterValues.find((parameter) => parameter.parameterId === parameterId).value = value;
  for (const group of data.payload.controlSurface.groups) for (const control of group.controls) {
    if (control.parameterId === parameterId) control.value = value;
  }
}

function aliasFixture(data) {
  const binding = data.payload.resolvedBindings[0];
  binding.source = "asset_alias";
  binding.alias = "@沈蘅";
  data.registry.aliases[0].targetRef = structuredClone(binding.refs[0]);
  return data;
}

async function check(data, includeRegistry = false) {
  return validatePayload(schemaPath, data.payload, { artifacts: context(data, includeRegistry) });
}

async function rejects(data, pattern, includeRegistry = false) {
  const result = await check(data, includeRegistry);
  assert.equal(result.valid, false, "Supplied exact source declarations must reject this contradiction.");
  assert.match(result.errors.join("\n"), pattern);
}

test("ShotCompilerPlan accepts an exact manifest and preserves explicit caller motivation and Chinese detail", async () => {
  const data = await fixture();
  const artifacts = context(data);
  const before = canonicalize({ payload: data.payload, artifacts });
  const result = await validatePayload(schemaPath, data.payload, { artifacts });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /caller constant.*preserved|constant.*authority/iu);
  assert.equal(canonicalize({ payload: data.payload, artifacts }), before);
  assert.equal(data.payload.handoffs[2].fieldAssignments[1].sourceType, "constant");
  assert.equal(data.payload.handoffs[2].fieldAssignments[1].targetPath, "cameraMotion.motivation");
  assert.match(data.payload.intent.summary, /察觉身后脚步却不回头/);
});

test("ShotCompilerPlan rejects an unknown selected skill even with the exact JCS manifest supplied", async () => {
  const data = await fixture();
  data.payload.skillSelection.skillId = "nonexistent-skill";
  await rejects(data, /skillSelection.*skillId|unknown.*skill|skill.*not.*(declared|found|manifest)/iu);
});

test("ShotCompilerPlan rejects 900 beyond the exact manifest range despite matching displayed controls", async () => {
  const data = await fixture();
  setValue(data, 900);
  await rejects(data, /parameterValues.*(maximum|range)|push_intensity.*(maximum|range)|maximum.*1/iu);
});

test("ShotCompilerPlan requires the selected skill version in the exact manifest", async () => {
  const data = await fixture();
  data.payload.skillSelection.version += 1;
  await rejects(data, /skillSelection.*version|skill.*version/iu);
});

test("ShotCompilerPlan accepts inclusive numeric range endpoints without inventing step snapping", async (t) => {
  for (const value of [0, 1, 0.62]) await t.test(String(value), async () => {
    const data = await fixture();
    setValue(data, value);
    const result = await check(data);
    assert.equal(result.valid, true, result.errors.join("\n"));
  });
});

test("ShotCompilerPlan rejects a value below the exact manifest minimum", async () => {
  const data = await fixture();
  setValue(data, -0.01);
  await rejects(data, /parameterValues.*(minimum|range)|push_intensity.*(minimum|range)/iu);
});

test("ShotCompilerPlan consumes the declared parameter value types", async (t) => {
  const cases = [
    ["number", 0.55, "0.55"],
    ["text", "她停住呼吸，仍维持前行", false],
    ["boolean", false, "false"],
    ["frame_count", 12, 12.5],
    ["enum", "restrained", "undeclared"],
  ];
  for (const [valueType, validValue, invalidValue] of cases) await t.test(valueType, async () => {
    const data = await fixture();
    const definition = selected(data).parameters[0];
    definition.valueType = valueType;
    definition.defaultValue = validValue;
    delete definition.range;
    delete definition.options;
    if (valueType === "enum") definition.options = ["restrained", "alert"];
    if (valueType === "frame_count") definition.range = { minimum: 0, maximum: 120 };
    setValue(data, validValue);
    const valid = await check(data);
    assert.equal(valid.valid, true, valid.errors.join("\n"));
    setValue(data, invalidValue);
    await rejects(data, /parameterValues|push_intensity|valueType|options/iu);
  });
});

test("ShotCompilerPlan rejects an undeclared parameter that is internally consistent", async () => {
  const data = await fixture();
  data.payload.parameterValues.push({ parameterId: "invented_control", value: 0.5, source: "user_override" });
  await rejects(data, /parameterValues.*(unknown|declared|manifest)|undeclared.*parameter/iu);
});

test("ShotCompilerPlan requires an explicit resolved value for each declared parameter", async () => {
  const data = await fixture();
  selected(data).parameters.push({ ...structuredClone(selected(data).parameters[0]), parameterId: "missing_value" });
  await rejects(data, /missing_value|parameterValues.*(missing|required)|parameter.*resolved value/iu);
});

test("ShotCompilerPlan keeps manifest_default values equal to their exact declared default", async () => {
  const data = await fixture();
  data.payload.parameterValues[0].source = "manifest_default";
  await rejects(data, /defaultValue|manifest_default|declared default/iu);
});

test("ShotCompilerPlan accepts an explicit exact manifest default", async () => {
  const data = await fixture();
  data.payload.parameterValues[0].source = "manifest_default";
  setValue(data, selected(data).parameters[0].defaultValue);
  const result = await check(data);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan enforces required binding slots", async () => {
  const data = await fixture();
  const scene = data.payload.resolvedBindings[1].refs[0];
  data.payload.resolvedBindings.splice(1, 1);
  for (const handoff of data.payload.handoffs) handoff.dependencyRefs = handoff.dependencyRefs.filter((ref) => ref.id !== scene.id);
  await rejects(data, /resolvedBindings.*(required|scene)|slot.*scene.*(required|missing)/iu);
});

test("ShotCompilerPlan rejects undeclared binding slots", async () => {
  const data = await fixture();
  data.payload.resolvedBindings.push({ ...structuredClone(data.payload.resolvedBindings[0]), slotId: "unknown_slot" });
  await rejects(data, /resolvedBindings.*(unknown|declared|manifest)|unknown_slot/iu);
});

test("ShotCompilerPlan enforces slot accepted contract kinds", async () => {
  const data = await fixture();
  selected(data).bindingSlots[0].acceptedContractKinds = ["scene_binding"];
  await rejects(data, /resolvedBindings.*(kind|accept)|slot.*(kind|accept)/iu);
});

test("ShotCompilerPlan enforces slot cardinality while preserving all local dependencies", async () => {
  const data = await fixture();
  const extra = { ...data.payload.resolvedBindings[0].refs[0], id: "binding.second-character" };
  data.payload.resolvedBindings[0].refs.push(extra);
  data.payload.handoffs[0].dependencyRefs.push(structuredClone(extra));
  await rejects(data, /resolvedBindings.*(maxBindings|cardinality|maximum)|slot.*(maxBindings|cardinality|maximum)/iu);
});

test("ShotCompilerPlan accepts a declared multi-binding slot at its exact maximum", async () => {
  const data = await fixture();
  selected(data).bindingSlots[0].maxBindings = 2;
  const extra = { ...data.payload.resolvedBindings[0].refs[0], id: "binding.second-character" };
  data.payload.resolvedBindings[0].refs.push(extra);
  data.payload.handoffs[0].dependencyRefs.push(structuredClone(extra));
  const result = await check(data);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan resolves an alias only through the exact declared registry", async () => {
  const data = aliasFixture(await fixture());
  const result = await check(data, true);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan rejects an alias absent from a supplied exact registry", async () => {
  const data = aliasFixture(await fixture());
  data.payload.resolvedBindings[0].alias = "@不存在";
  await rejects(data, /alias.*(unknown|declared|found|registry)|不存在/iu, true);
});

test("ShotCompilerPlan rejects an alias whose exact target differs from resolved binding refs", async () => {
  const data = aliasFixture(await fixture());
  data.registry.aliases[0].targetRef.version += 1;
  await rejects(data, /alias.*(target|ref)|resolvedBindings.*(target|ref)/iu, true);
});

test("ShotCompilerPlan rejects an alias whose declared role differs from its manifest slot", async () => {
  const data = aliasFixture(await fixture());
  data.registry.aliases[0].role = "scene";
  await rejects(data, /alias.*role|role.*(slot|character)|resolvedBindings.*role/iu, true);
});

test("ShotCompilerPlan does not infer aliases by case folding", async () => {
  const data = aliasFixture(await fixture());
  data.payload.resolvedBindings[0].alias = "@hero";
  data.registry.aliases[0].alias = "@Hero";
  data.registry.aliases[0].normalizedAlias = "@Hero";
  await rejects(data, /alias.*(unknown|declared|found|registry)|@hero/iu, true);
});

test("ShotCompilerPlan rejects duplicate source definitions even when object bodies differ", async (t) => {
  const mutations = [
    ["skillId", (data) => { data.manifest.skills.push({ ...structuredClone(selected(data)), title: "duplicate skill identity" }); }, /skillId.*duplicat|duplicat.*skill/iu],
    ["parameterId", (data) => { selected(data).parameters.push({ ...structuredClone(selected(data).parameters[0]), label: "duplicate parameter identity" }); }, /parameterId.*duplicat|duplicat.*parameter/iu],
    ["slotId", (data) => { selected(data).bindingSlots.push({ ...structuredClone(selected(data).bindingSlots[0]), label: "duplicate slot identity" }); }, /slotId.*duplicat|duplicat.*slot/iu],
    ["stepId", (data) => { selected(data).program.push({ ...structuredClone(selected(data).program[0]), order: 5, rationale: "duplicate program identity" }); }, /stepId.*duplicat|duplicat.*step/iu],
    ["groupId", (data) => { selected(data).controlGroups.push({ ...structuredClone(selected(data).controlGroups[0]), order: 4, label: "duplicate group identity" }); }, /groupId.*duplicat|duplicat.*group/iu],
    ["checkId", (data) => { selected(data).qualityChecks.push({ ...structuredClone(selected(data).qualityChecks[0]), label: "duplicate check identity" }); }, /checkId.*duplicat|duplicat.*check/iu],
  ];
  for (const [name, mutate, pattern] of mutations) await t.test(name, async () => {
    const data = await fixture();
    mutate(data);
    await rejects(data, pattern);
  });
});

test("ShotCompilerPlan rejects duplicate source alias identities", async () => {
  const data = aliasFixture(await fixture());
  data.registry.aliases.push({ ...structuredClone(data.registry.aliases[0]), description: "same alias with a different body" });
  await rejects(data, /alias.*duplicat|duplicat.*alias/iu, true);
});

test("ShotCompilerPlan keeps displayed control metadata on the selected manifest parameter", async (t) => {
  const mutations = [
    ["enforcement", (data) => { data.payload.controlSurface.groups[0].controls[0].enforcement = "advisory"; }, /enforcement|controlLevel/iu],
    ["target", (data) => {
      data.payload.controlSurface.groups[0].controls[0].target.fieldPath = "camera.focalLengthMm";
      data.payload.handoffs[0].fieldAssignments[1].targetPath = "camera.focalLengthMm";
      data.payload.compileTrace.steps[1].target.fieldPath = "camera.focalLengthMm";
    }, /target|fieldPath|program/iu],
    ["domain", (data) => { data.payload.controlSurface.groups[0].controls[0].domain = "blocking"; data.payload.controlSurface.groups[0].domain = "blocking"; }, /domain|controlGroups/iu],
  ];
  for (const [name, mutate, pattern] of mutations) await t.test(name, async () => {
    const data = await fixture();
    mutate(data);
    await rejects(data, pattern);
  });
});

test("ShotCompilerPlan requires each selected program step in its exact compile trace", async () => {
  const data = await fixture();
  data.payload.compileTrace.steps.splice(1, 1);
  await rejects(data, /compileTrace.*(missing|required)|program.*(missing|required)|set-push/iu);
});

test("ShotCompilerPlan rejects a locally consistent trace operation changed from the selected program", async () => {
  const data = await fixture();
  data.payload.compileTrace.steps[1].operation = "derive";
  await rejects(data, /compileTrace.*(operation|program)|program.*operation/iu);
});

test("ShotCompilerPlan rejects an extra parameter handoff outside the declared targets", async () => {
  const data = await fixture();
  data.payload.handoffs[0].fieldAssignments.push({ targetPath: "camera.focalLengthMm", sourceType: "parameter", sourceId: "push_intensity" });
  await rejects(data, /fieldAssignments.*(target|declared|program)|handoff.*target/iu);
});

test("ShotCompilerPlan rejects an undeclared handoff output even when its fields are caller constants", async () => {
  const data = await fixture();
  data.payload.handoffs.push({
    handoffId: "handoff.extra-style", order: 4, contractKind: "cineweave_codex_style_compile",
    ownerRoute: "style", route: "style", status: "planned", purpose: "caller constant design",
    dependencyRefs: [], fieldAssignments: [{ targetPath: "styleScope", sourceType: "constant", sourceId: "caller-style" }],
  });
  await rejects(data, /handoffs.*(output|contract|declared)/iu);
});

test("ShotCompilerPlan reports unavailable manifest context without pretending it is verified", async () => {
  const data = await fixture();
  const result = await validatePayload(schemaPath, data.payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /manifest.*(unavailable|unverified|missing)|cinematicSkillManifestRef.*unavailable/iu);
});

test("ShotCompilerPlan reports unavailable exact alias registry context", async () => {
  const data = aliasFixture(await fixture());
  context(data, true);
  const result = await validatePayload(schemaPath, data.payload, { artifacts: context(data) });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /assetAliasRegistryRef.*unavailable|alias.*registry.*(unavailable|unverified|missing)/iu);
});

test("ShotCompilerPlan rejects a supplied manifest body with the wrong JCS hash", async () => {
  const data = await fixture();
  const artifacts = context(data);
  data.manifest.title += " changed after binding";
  const result = await validatePayload(schemaPath, data.payload, { artifacts });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /manifest.*hash|cinematicSkillManifestRef.*hash/iu);
});

test("ShotCompilerPlan validates the full supplied source schema", async () => {
  const data = await fixture();
  delete selected(data).qualityChecks;
  await rejects(data, /upstream.*qualityChecks|source.*qualityChecks/iu);
});

test("ShotCompilerPlan rejects malformed or duplicate exact source registry bindings", async (t) => {
  for (const name of ["malformed", "duplicate"]) await t.test(name, async () => {
    const data = await fixture();
    const bindings = context(data);
    const artifacts = name === "malformed" ? "not-an-array" : [...bindings, structuredClone(bindings[0])];
    const result = await validatePayload(schemaPath, data.payload, { artifacts });
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /artifacts|registry|ambiguous|duplicat/iu);
  });
});

test("validateShotCompilerContext rejects contradictory complete source parameter definitions", async (t) => {
  const index = JSON.parse(await readFile(new URL("index.json", contractRoot), "utf8"));
  const validateStructure = (ref, document) => {
    const entry = index.contracts.find((contract) => contract.kind === ref.kind);
    return validatePayload(fileURLToPath(new URL(entry.schema, contractRoot)), document);
  };
  const mutations = [
    ["default type", (skill) => { skill.parameters[0].defaultValue = "numeric-looking text"; }, /defaultValue.*valueType/iu],
    ["default range", (skill) => { skill.parameters[0].defaultValue = 900; }, /defaultValue.*maximum/iu],
    ["reversed range", (skill) => { skill.parameters[0].range = { minimum: 2, maximum: 1 }; }, /range.*minimum.*maximum/iu],
    ["enum options", (skill) => { skill.parameters[0].valueType = "enum"; skill.parameters[0].defaultValue = "absent"; skill.parameters[0].options = ["present"]; }, /defaultValue.*options/iu],
    ["program source", (skill) => { skill.program[1].source.id = "absent"; }, /program.*unknown parameter/iu],
    ["group source", (skill) => { skill.controlGroups[0].parameterIds.push("absent"); }, /controlGroups.*unknown parameter/iu],
    ["output identity", (skill) => { skill.outputContracts.push({ ...structuredClone(skill.outputContracts[0]), purpose: "duplicate output identity" }); }, /outputContracts.*duplicates/iu],
  ];
  for (const [name, mutate, pattern] of mutations) await t.test(name, async () => {
    const data = await fixture();
    mutate(selected(data));
    const result = await validateShotCompilerContext(data.payload, { artifacts: context(data), validateStructure });
    assert.match(result.errors.join("\n"), pattern);
  });
});

test("ShotCompilerPlan allows multiple declared parameter targets and preserves all handoff mappings", async () => {
  const data = await fixture();
  const target = { ...structuredClone(selected(data).parameters[0].targets[0]), fieldPath: "composition.visualHierarchy" };
  selected(data).parameters[0].targets.push(target);
  data.payload.handoffs[0].fieldAssignments.push({ targetPath: target.fieldPath, sourceType: "parameter", sourceId: "push_intensity" });
  data.payload.controlSurface.groups[0].controls.push({ ...structuredClone(data.payload.controlSurface.groups[0].controls[0]), controlId: "control.second-target", target });
  selected(data).controlGroups.push({ groupId: "secondary-camera", order: 4, label: "Additional declared projection", domain: "camera", parameterIds: ["push_intensity"] });
  data.payload.controlSurface.groups.push({ groupId: "secondary-camera", order: 4, label: "Additional declared projection", domain: "camera", controls: [{ ...structuredClone(data.payload.controlSurface.groups[0].controls[0]), controlId: "control.shared-projection" }] });
  const result = await check(data);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan allows a manifest group to gather controls from a different parameter domain", async () => {
  const data = await fixture();
  // Built-in establishing-reveal groups composition.reveal_intensity under
  // camera; group membership determines the projected control domain.
  selected(data).parameters[0].domain = "composition";
  const result = await check(data);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan allows an omitted optional manifest binding slot", async () => {
  const data = await fixture();
  const optional = data.payload.resolvedBindings.pop().refs[0];
  for (const handoff of data.payload.handoffs) handoff.dependencyRefs = handoff.dependencyRefs.filter((ref) => ref.id !== optional.id);
  const result = await check(data);
  assert.equal(result.valid, true, result.errors.join("\n"));
});

test("ShotCompilerPlan resolves NFC-equivalent aliases without modifying the hashed source or input", async () => {
  const data = aliasFixture(await fixture());
  data.payload.resolvedBindings[0].alias = "@Cafe\u0301";
  data.registry.aliases[0].alias = "@Caf\u00e9";
  data.registry.aliases[0].normalizedAlias = "@Caf\u00e9";
  const artifacts = context(data, true);
  const before = canonicalize({ payload: data.payload, artifacts });
  const result = await validatePayload(schemaPath, data.payload, { artifacts });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(canonicalize({ payload: data.payload, artifacts }), before);
  assert.match(result.unverified.join("\n"), /scope.*(identity|compatib|compared)/iu);
});

test("ShotCompilerPlan rejects contradictory alias declarations in an exact source registry", async (t) => {
  const mutations = [
    ["normalization", (data) => { data.registry.aliases[0].normalizedAlias = "@different"; }, /normalizedAlias.*unicode_nfc_exact/iu],
    ["NFC collision", (data) => {
      data.registry.aliases[0].alias = "@Caf\u00e9";
      data.registry.aliases[0].normalizedAlias = "@Caf\u00e9";
      data.registry.aliases.push({ ...structuredClone(data.registry.aliases[0]), alias: "@Cafe\u0301" });
    }, /alias.*duplicates/iu],
    ["target kind scope", (data) => { data.registry.scope.targetContractKinds = ["scene_binding", "cineweave_codex_reference_asset"]; }, /targetRef.kind.*registry scope/iu],
    ["extra binding ref", (data) => {
      selected(data).bindingSlots[0].maxBindings = 2;
      const extra = { ...data.payload.resolvedBindings[0].refs[0], id: "binding.undeclared-alias-target" };
      data.payload.resolvedBindings[0].refs.push(extra);
      data.payload.handoffs[0].dependencyRefs.push(structuredClone(extra));
    }, /refs.*one exact targetRef/iu],
  ];
  for (const [name, mutate, pattern] of mutations) await t.test(name, async () => {
    const data = aliasFixture(await fixture());
    mutate(data);
    await rejects(data, pattern, true);
  });
});
