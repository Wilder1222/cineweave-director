#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function push(errors, condition, message) { if (!condition) errors.push(message); }
function unique(values) { return new Set(values).size === values.length; }
function isExactContractRef(value, acceptedKinds = []) {
  return isObject(value)
    && nonEmpty(value.kind)
    && nonEmpty(value.id)
    && Number.isSafeInteger(value.version)
    && value.version >= 1
    && /^sha256:[0-9a-f]{64}$/.test(value.contentHash || "")
    && (!acceptedKinds.length || acceptedKinds.includes(value.kind));
}
function sameExactRef(left, right) {
  return isExactContractRef(left)
    && isExactContractRef(right)
    && left.kind === right.kind
    && left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash;
}
function sameStrings(left, right) {
  return Array.isArray(left) && Array.isArray(right)
    && unique(left) && unique(right)
    && left.length === right.length
    && left.every((value) => right.includes(value));
}
function containsProviderWeightSyntax(value) {
  const pattern = /(?:<lora:[^>\r\n]+>|\([^()\r\n]{1,240}:\s*[-+]?(?:\d+\.\d+|\.\d+)\)|\b(?:prompt|token|style)[ _-]?weight\s*=|\b\d+(?:\.\d+)?\s*::)/i;
  if (typeof value === "string") return pattern.test(value);
  if (Array.isArray(value)) return value.some(containsProviderWeightSyntax);
  if (isObject(value)) return Object.values(value).some(containsProviderWeightSyntax);
  return false;
}

function validateCharacterSpec(payload, errors) {
  if (payload?.morphologySpecRef) push(errors, payload.morphologySpecRef.kind === "cineweave_codex_character_morphology_spec", "CharacterSpec morphologySpecRef must reference CharacterMorphologySpec");
  const anchors = payload?.identityCore?.immutableAnchors || [];
  push(errors, anchors.length >= 3, "CharacterSpec requires at least three immutable anchors");
  push(errors, unique(anchors.map((item) => item?.anchorId)), "CharacterSpec anchor IDs must be unique");
  push(errors, anchors.some((item) => item?.priority === "critical" && item?.visibleAt?.some((scale) => ["medium", "fullbody", "wide", "silhouette"].includes(scale))), "CharacterSpec needs a critical anchor visible beyond close-up");
  const variables = payload?.appearanceLayers?.controlledVariables || [];
  push(errors, unique(variables.map((item) => item?.variableId)), "Character appearance variable IDs must be unique");
  const states = payload?.behaviorModel?.states || [];
  push(errors, unique(states.map((item) => item?.stateId)), "Character behavior state IDs must be unique");
  const surface = payload?.identityCore?.surfaceProfile;
  if (surface) {
    push(errors, surface?.calibration?.providerNeutral === true, "CharacterSpec stable surface profile must remain Provider-neutral");
    push(errors, surface?.calibration?.notBiometric === true, "CharacterSpec stable surface profile must not be biometric");
    push(errors, surface?.calibration?.excludesMakeup === true, "CharacterSpec stable surface profile must exclude makeup state");
    push(errors, surface?.calibration?.excludesLighting === true, "CharacterSpec stable surface profile must exclude lighting treatment");
  }
  push(errors, payload?.rights?.sourceClass !== undefined, "CharacterSpec rights must be explicit");
}

function validateCharacterBinding(payload, errors) {
  push(errors, Array.isArray(payload?.activeAnchorIds) && payload.activeAnchorIds.length > 0, "CharacterBinding requires active anchors");
  push(errors, unique(payload?.activeAnchorIds || []), "CharacterBinding active anchor IDs must be unique");
  push(errors, typeof payload?.performanceState?.intensity === "number" && payload.performanceState.intensity >= 0 && payload.performanceState.intensity <= 1, "CharacterBinding intensity must be between 0 and 1");
  push(errors, typeof payload?.performanceState?.concealment === "number" && payload.performanceState.concealment >= 0 && payload.performanceState.concealment <= 1, "CharacterBinding concealment must be between 0 and 1");
  for (const key of ["startState", "trigger", "peakState", "endState"]) push(errors, nonEmpty(payload?.actionArc?.[key]), `CharacterBinding actionArc.${key} is required`);
  for (const key of ["posture", "gaze", "face", "hands", "breath"]) push(errors, nonEmpty(payload?.observablePerformance?.[key]), `CharacterBinding observablePerformance.${key} is required`);
  if (payload?.behaviorLogic) for (const key of ["perception", "appraisal", "chosenStrategy", "suppressedImpulse", "actionReason"]) push(errors, nonEmpty(payload.behaviorLogic[key]), `CharacterBinding behaviorLogic.${key} is required`);
  if (payload?.emotionControl) {
    push(errors, Math.abs(payload.emotionControl.intensity - payload.performanceState.intensity) < 1e-9, "emotionControl intensity must match performanceState intensity");
    push(errors, Math.abs(payload.emotionControl.concealment - payload.performanceState.concealment) < 1e-9, "emotionControl concealment must match performanceState concealment");
    push(errors, Array.isArray(payload.emotionControl.leakageChannels) && payload.emotionControl.leakageChannels.length > 0, "emotionControl requires leakage channels");
  }
}

function validateCharacterReferencePlan(payload, errors) {
  const phases = payload?.phases || [];
  const types = phases.map((phase) => phase?.type);
  push(errors, types.includes("identity"), "CharacterReferencePlan must include an identity phase");
  const appearanceIndex = types.indexOf("appearance");
  const identityIndex = types.indexOf("identity");
  if (appearanceIndex >= 0) push(errors, identityIndex >= 0 && identityIndex < appearanceIndex, "identity phase must precede appearance phase");
  for (const phase of phases) for (const frame of phase?.frameSpecs || []) {
    if (frame.semanticRole === "identity") push(errors, ["face", "body", "full_character"].includes(frame.scope), `${frame.frameId}: identity role has invalid scope`);
    if (frame.semanticRole === "performance") push(errors, ["expression", "pose", "motion"].includes(frame.scope), `${frame.frameId}: performance role has invalid scope`);
  }
  push(errors, payload?.executionBoundary?.generatesMedia === false, "Reference plan must not claim media generation");
}

function validateCharacterExplorationBrief(payload, errors) {
  const temperament = payload?.experienceAxes?.temperament || [];
  push(errors, temperament.length > 0 && unique(temperament.map((item) => item?.axisId)), "CharacterExplorationBrief temperament axis IDs must be unique");
  const weight = temperament.reduce((total, item) => total + (typeof item?.weight === "number" ? item.weight : 0), 0);
  push(errors, weight > 0 && weight <= 1.000001, "CharacterExplorationBrief temperament weights must total no more than 1");
  const locks = payload?.locks || {};
  const lockValues = ["hard", "soft", "free", "undefined"].flatMap((level) => locks[level] || []);
  push(errors, unique(lockValues), "CharacterExplorationBrief lock values must appear in one level only");
  for (const reference of payload?.referenceBindings || []) {
    const overlap = (reference?.preserve || []).filter((item) => (reference?.ignore || []).includes(item));
    push(errors, overlap.length === 0, `${reference?.referenceId}: preserve and ignore scopes must not overlap`);
  }
  push(errors, payload?.validation?.userControlsPreference === true, "CharacterExplorationBrief must keep preference under user control");
  push(errors, payload?.validation?.noUniversalBeautyScore === true, "CharacterExplorationBrief must prohibit universal beauty scores");
  push(errors, payload?.validation?.noBiometricInference === true, "CharacterExplorationBrief must prohibit biometric inference");
  push(errors, payload?.validation?.styleDoesNotOwnIdentity === true, "CharacterExplorationBrief must keep style separate from identity");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "CharacterExplorationBrief must not claim media generation");
}

function validateCharacterOptionSet(payload, errors) {
  const options = payload?.options || [];
  push(errors, options.length >= 2 && options.length <= 6, "CharacterOptionSet requires two to six options");
  push(errors, unique(options.map((item) => item?.optionId)), "CharacterOptionSet option IDs must be unique");
  for (const option of options) {
    push(errors, option?.primaryDelta?.axis === payload?.explorationAxis, `${option?.optionId}: primary delta must match the option set exploration axis`);
    push(errors, option?.primaryDelta?.direction && option?.primaryDelta?.hypothesis, `${option?.optionId}: primary delta requires direction and hypothesis`);
  }
  push(errors, payload?.qualityGate?.blocksIdentityLockOnFailure === true, "CharacterOptionSet quality gate must block identity lock on failure");
  push(errors, payload?.qualityGate?.doesNotScoreAttractiveness === true, "CharacterOptionSet must not score attractiveness");
  push(errors, payload?.selectionPolicy?.requiresHumanSelection === true, "CharacterOptionSet requires human selection");
  push(errors, payload?.selectionPolicy?.onePrimaryDeltaPerRound === true, "CharacterOptionSet requires one primary delta per round");
  push(errors, payload?.selectionPolicy?.convergenceRequiresNeutralEvidence === true, "CharacterOptionSet requires neutral evidence before convergence");
  push(errors, payload?.validation?.sharedFixtureLocked === true, "CharacterOptionSet must lock the shared fixture");
  push(errors, payload?.validation?.onePrimaryDeltaPerOption === true, "CharacterOptionSet must declare one primary delta per option");
  push(errors, payload?.validation?.noUniversalBeautyScore === true, "CharacterOptionSet must prohibit universal beauty scores");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "CharacterOptionSet must not claim media generation");
}

function validateCharacterPreferenceFeedback(payload, errors) {
  const signals = payload?.signals || [];
  push(errors, unique(signals.map((item) => item?.signalId)), "CharacterPreferenceFeedback signal IDs must be unique");
  for (const signal of signals) {
    if (signal?.type === "compare") {
      push(errors, nonEmpty(signal?.comparisonOptionId), `${signal?.signalId}: compare feedback requires comparisonOptionId`);
      push(errors, signal?.comparisonOptionId !== signal?.optionId, `${signal?.signalId}: compare feedback must name a different option`);
    }
  }
  if (payload?.convergence?.nextAction === "draft_character_spec") push(errors, (payload?.convergence?.selectedOptionIds || []).length > 0, "CharacterPreferenceFeedback needs a selected option before drafting CharacterSpec");
  push(errors, payload?.convergence?.identityLockRequested === false, "CharacterPreferenceFeedback cannot auto-lock identity");
  push(errors, payload?.policy?.userCanEditOrDelete === true, "CharacterPreferenceFeedback must remain editable and deletable by the user");
  push(errors, payload?.policy?.universalBeautyScoreProhibited === true, "CharacterPreferenceFeedback must prohibit universal beauty scores");
  push(errors, payload?.policy?.sensitiveInferenceProhibited === true, "CharacterPreferenceFeedback must prohibit sensitive inference");
  push(errors, payload?.policy?.realPersonLikenessNotInferred === true, "CharacterPreferenceFeedback must not infer real-person likeness");
  push(errors, payload?.validation?.optionSetBound === true, "CharacterPreferenceFeedback must bind to an option set");
  push(errors, payload?.validation?.identityNotAutoLocked === true, "CharacterPreferenceFeedback must not auto-lock identity");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "CharacterPreferenceFeedback must not claim media generation");
}

function validateCharacterMorphologySpec(payload, errors) {
  const axes = payload?.axes || [];
  const axisIds = axes.map((item) => item?.axisId);
  const knownAxes = new Set(axisIds);
  push(errors, unique(axisIds), "CharacterMorphologySpec axis IDs must be unique");
  for (const axis of axes) {
    push(errors, axis?.featurePath?.startsWith(`${axis?.region}.`), `${axis?.axisId}: featurePath must match its region`);
    if (axis?.lock === "hard") push(errors, axis?.variationRadius === 0, `${axis?.axisId}: hard-locked axis must have zero variation radius`);
  }
  const relations = payload?.relations || [];
  push(errors, unique(relations.map((item) => item?.relationId)), "CharacterMorphologySpec relation IDs must be unique");
  for (const relation of relations) {
    push(errors, unique(relation?.memberAxisIds || []), `${relation?.relationId}: relation members must be unique`);
    for (const axisId of relation?.memberAxisIds || []) push(errors, knownAxes.has(axisId), `${relation?.relationId}: unknown morphology axis ${axisId}`);
  }
  if (payload?.identityLockGate?.status === "approved") push(errors, isObject(payload?.identityLockGate?.approvalRef), "Approved morphology lock gate requires an exact approval ref");
  if (payload?.status === "approved") push(errors, payload?.identityLockGate?.status === "approved", "Approved morphology requires an approved human lock gate");
  push(errors, payload?.validation?.noBiometricInference === true, "CharacterMorphologySpec must prohibit biometric inference");
  push(errors, payload?.validation?.noUniversalBeautyScore === true, "CharacterMorphologySpec must prohibit universal beauty scores");
  push(errors, payload?.validation?.noRealPersonPartMashup === true, "CharacterMorphologySpec must prohibit real-person part mashups");
  push(errors, payload?.executionBoundary?.containsProviderWeights === false, "CharacterMorphologySpec cannot contain provider weights");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "CharacterMorphologySpec must not claim media generation");
}

function validateMorphologyReview(payload, errors) {
  const dimensions = payload?.dimensions || [];
  push(errors, unique(dimensions.map((item) => item?.dimensionId)), "MorphologyReview dimension IDs must be unique");
  const evidence = new Set(payload?.evidenceObservationIds || []);
  for (const dimension of dimensions) for (const id of dimension?.evidenceObservationIds || []) push(errors, evidence.has(id), `${dimension?.dimensionId}: review evidence must be declared at the review level`);
  const hasBlockingFailure = dimensions.some((item) => item?.status === "fail" && item?.severity === "blocking");
  const hasFailure = dimensions.some((item) => item?.status === "fail");
  if (hasBlockingFailure) push(errors, payload?.decision?.overallStatus === "fail", "MorphologyReview blocking failure requires overallStatus=fail");
  if (hasFailure) push(errors, payload?.decision?.identityLockApproved === false, "MorphologyReview with a failure cannot approve identity lock");
  if (payload?.decision?.identityLockApproved) {
    push(errors, payload?.decision?.overallStatus === "pass", "MorphologyReview identity lock requires overallStatus=pass");
    push(errors, payload?.decision?.nextAction === "lock_identity", "MorphologyReview identity lock requires nextAction=lock_identity");
    push(errors, isObject(payload?.decision?.approvalRef), "MorphologyReview identity lock requires an exact approval ref");
  }
  if (payload?.decision?.nextAction === "repair_axis") {
    const repair = payload?.repairRecommendation;
    push(errors, isObject(repair), "MorphologyReview repair_axis requires a repair recommendation");
    if (repair) {
      push(errors, !(repair?.preserveAxisIds || []).includes(repair?.changeOnlyAxisId), "MorphologyReview cannot preserve and change the same axis");
      push(errors, unique(repair?.preserveAxisIds || []), "MorphologyReview preserve axis IDs must be unique");
    }
  }
  push(errors, payload?.validation?.oneVariableRepair === true, "MorphologyReview must use one-variable repair");
  push(errors, payload?.validation?.noUniversalBeautyScore === true, "MorphologyReview must prohibit universal beauty scores");
}

function validateAppearanceState(payload, errors) {
  const assignments = payload?.assignments || [];
  push(errors, unique(assignments.map((item) => item?.variableId)), "AppearanceState variable assignments must be unique");
  push(errors, Array.isArray(payload?.preserveAnchorIds) && payload.preserveAnchorIds.length > 0, "AppearanceState must preserve identity anchors");
  push(errors, payload?.validation?.identityPreserved === true, "AppearanceState must assert identity preservation");
  if (payload?.styling) {
    const materials = payload.styling?.costume?.materials || [];
    push(errors, materials.length > 0, "Structured styling requires at least one costume material");
    push(errors, unique(materials.map((item) => item?.materialId)), "Costume material IDs must be unique");
    push(errors, payload.styling?.makeup?.identityPreservation?.length > 0, "Makeup must state identity preservation");
    push(errors, payload.styling?.costume?.pairingLogic?.length > 0, "Costume must declare pairing logic");
    const skin = payload.styling?.skinMaterial;
    if (skin) {
      push(errors, skin?.calibration?.scale === "normalized_creative_intent", "Skin material scales must be normalized creative intent");
      push(errors, skin?.calibration?.notMeasuredPhysicalProperty === true, "Skin material scales must not claim measured physical properties");
      push(errors, skin?.calibration?.notBiometric === true, "Skin material state must not be biometric");
      push(errors, skin?.calibration?.notProviderControl === true, "Skin material scales must not claim direct Provider controls");
      push(errors, nonEmpty(skin?.baselineRelation) && nonEmpty(skin?.identityPreservation), "Skin material state must preserve the CharacterSpec baseline");
    }
  }
}

function validateReview(payload, errors, domain) {
  const criteria = payload?.criteria || [];
  const hasBlockingFail = criteria.some((item) => item?.status === "fail" && item?.severity === "blocking");
  if (hasBlockingFail) {
    push(errors, payload?.summary?.overallStatus === "fail", `${domain} review with a blocking failure must have overallStatus=fail`);
    push(errors, payload?.decision?.nextAction !== "accept", `${domain} review with a blocking failure cannot accept`);
  }
  const evidence = criteria.flatMap((item) => item?.evidenceObservationIds || []);
  push(errors, evidence.length >= criteria.length, `${domain} review criteria require scoped evidence`);
  if (payload?.decision?.nextAction === "repair") push(errors, nonEmpty(payload?.decision?.smallestRepairVariable), `${domain} repair decision requires smallestRepairVariable`);
}

function validateRepair(payload, errors, domain) {
  push(errors, isObject(payload?.change), `${domain} repair requires one change object`);
  push(errors, payload?.validation?.singleVariable === true, `${domain} repair must be single-variable`);
  push(errors, payload?.validation?.parentImmutable === true, `${domain} repair must keep parent immutable`);
  push(errors, payload?.executionGate?.requiresHumanApproval === true, `${domain} repair requires human approval`);
  push(errors, Array.isArray(payload?.acceptanceChecks) && payload.acceptanceChecks.length > 0, `${domain} repair needs acceptance checks`);
}

function validateSceneSpec(payload, errors) {
  const zones = payload?.geography?.zones || [];
  const zoneIds = zones.map((item) => item?.zoneId);
  push(errors, zones.length >= 1 && unique(zoneIds), "SceneSpec zone IDs must be present and unique");
  const anchors = payload?.geography?.immutableAnchors || [];
  push(errors, anchors.length >= 3, "SceneSpec requires at least three immutable anchors");
  push(errors, unique(anchors.map((item) => item?.anchorId)), "SceneSpec anchor IDs must be unique");
  const knownZones = new Set(zoneIds);
  for (const connection of payload?.geography?.connections || []) {
    push(errors, knownZones.has(connection?.fromZone), `connection references unknown fromZone: ${connection?.fromZone}`);
    push(errors, knownZones.has(connection?.toZone), `connection references unknown toZone: ${connection?.toZone}`);
  }
  for (const item of payload?.geography?.entrancesExits || []) push(errors, knownZones.has(item?.zoneId), `entrance/exit references unknown zone: ${item?.zoneId}`);
  for (const item of payload?.architecture?.structures || []) push(errors, knownZones.has(item?.zoneId), `structure references unknown zone: ${item?.zoneId}`);
  for (const item of payload?.propLayout || []) push(errors, knownZones.has(item?.zoneId), `prop references unknown zone: ${item?.zoneId}`);
  for (const item of payload?.cameraTopology?.cameraAnchors || []) push(errors, knownZones.has(item?.zoneId), `camera anchor references unknown zone: ${item?.zoneId}`);
  const variableIds = (payload?.stateModel?.controllableVariables || []).map((item) => item?.variableId);
  push(errors, unique(variableIds), "SceneSpec controllable variable IDs must be unique");
}

function validateSceneState(payload, errors, sceneSpec) {
  const assignments = payload?.assignments || [];
  push(errors, unique(assignments.map((item) => item?.variableId)), "SceneState assignments must be unique");
  if (sceneSpec) {
    const declared = new Set((sceneSpec?.stateModel?.controllableVariables || []).map((item) => item?.variableId));
    for (const assignment of assignments) push(errors, declared.has(assignment?.variableId), `SceneState assigns undeclared variable: ${assignment?.variableId}`);
  }
  push(errors, payload?.validation?.geographyPreserved === true, "SceneState must preserve geography");
  push(errors, payload?.validation?.physicalLight === true, "SceneState must declare physical light");
  if (payload?.temporalContext) push(errors, nonEmpty(payload.temporalContext.continuityWindow), "SceneState temporal context requires a continuity window");
  if (payload?.backgroundState) push(errors, nonEmpty(payload.backgroundState.subjectSeparation), "SceneState background state requires subject separation logic");
}

function validateInteractionConstraints(constraints, errors, bindingIds = []) {
  const contacts = constraints?.contacts || [];
  push(errors, unique(contacts.map((item) => item?.contactId)), "Interaction contact IDs must be unique");
  const known = new Set(bindingIds);
  for (const list of [constraints?.contacts || [], constraints?.supports || [], constraints?.lightingResponse || [], constraints?.environmentResponse || [], constraints?.propInteractions || []]) {
    for (const item of list) if (known.size) push(errors, known.has(item?.subjectBindingId), `Interaction references unknown subject binding: ${item?.subjectBindingId}`);
  }
  const edges = new Set();
  for (const item of constraints?.occlusions || []) {
    const key = `${item.frontRef}>${item.backRef}`;
    const reverse = `${item.backRef}>${item.frontRef}`;
    push(errors, !edges.has(reverse), `Interaction occlusion cycle detected: ${key}`);
    edges.add(key);
  }
  for (const item of contacts.filter((entry) => entry?.required)) push(errors, nonEmpty(item.targetRef) && nonEmpty(item.subjectPart), `Required contact ${item.contactId} must be grounded`);
}

function validateInteractionSet(payload, errors) {
  const bindingIds = (payload?.characterBindingRefs || []).map((item) => item?.bindingId);
  push(errors, unique(bindingIds), "Interaction character binding refs must be unique");
  validateInteractionConstraints(payload?.constraints, errors, bindingIds);
  push(errors, payload?.validation?.contactsGrounded === true, "Interaction set must assert grounded contacts");
  push(errors, payload?.validation?.lightingMotivated === true, "Interaction set must assert motivated lighting");
}

function validateSceneBinding(payload, errors, sceneSpec) {
  push(errors, Array.isArray(payload?.activeAnchorIds) && payload.activeAnchorIds.length > 0, "SceneBinding requires active anchors");
  push(errors, Array.isArray(payload?.activeZoneIds) && payload.activeZoneIds.length > 0, "SceneBinding requires active zones");
  push(errors, nonEmpty(payload?.cameraPlacement?.axisId), "SceneBinding requires a camera axis");
  if (sceneSpec) {
    const anchors = new Set((sceneSpec?.geography?.immutableAnchors || []).map((item) => item?.anchorId));
    const zones = new Set((sceneSpec?.geography?.zones || []).map((item) => item?.zoneId));
    const cameraAnchors = new Set((sceneSpec?.cameraTopology?.cameraAnchors || []).map((item) => item?.cameraAnchorId));
    const axes = new Set((sceneSpec?.cameraTopology?.safeAxes || []).map((item) => item?.axisId));
    for (const id of payload.activeAnchorIds || []) push(errors, anchors.has(id), `SceneBinding references unknown anchor: ${id}`);
    for (const id of payload.activeZoneIds || []) push(errors, zones.has(id), `SceneBinding references unknown zone: ${id}`);
    push(errors, cameraAnchors.has(payload?.cameraPlacement?.cameraAnchorId), `SceneBinding references unknown camera anchor: ${payload?.cameraPlacement?.cameraAnchorId}`);
    push(errors, axes.has(payload?.cameraPlacement?.axisId), `SceneBinding references unknown axis: ${payload?.cameraPlacement?.axisId}`);
  }
  if (payload?.interactionConstraints) validateInteractionConstraints(payload.interactionConstraints, errors);
}

function validateAssetRecipe(payload, errors, controlSet) {
  const tasks = payload?.tasks || [];
  const taskIds = tasks.map((item) => item?.taskId);
  push(errors, unique(taskIds), "AssetRecipe task IDs must be unique");
  for (const task of tasks) push(errors, Array.isArray(task?.delta) && task.delta.length === 1, `${task?.taskId}: AssetRecipe task must change exactly one primary delta`);
  const order = payload?.assembly?.ordering || [];
  push(errors, order.length === tasks.length && order.every((id) => taskIds.includes(id)), "AssetRecipe assembly ordering must contain every task exactly once");
  push(errors, unique(order), "AssetRecipe assembly ordering must be unique");
  if (payload?.layout?.type === "contact_sheet" || payload?.layout?.type === "grid" || payload?.layout?.type === "turnaround") {
    push(errors, payload?.assembly?.mode === "deterministic_grid", "Grid recipes require deterministic_grid assembly");
    push(errors, payload?.retryPolicy?.strategy === "failed_tasks_only", "Grid recipes must retry failed tasks only");
  }
  if (controlSet) {
    const known = new Set((controlSet.channels || []).map((item) => item.channelId));
    for (const task of tasks) for (const id of task.controlChannelIds || []) push(errors, known.has(id), `${task.taskId}: unknown control channel ${id}`);
  }
  const acceptedKinds = new Set((payload?.inputSlots || []).flatMap((slot) => slot?.acceptedKinds || []));
  const deltaFields = tasks.map((task) => task?.delta?.[0]?.fieldPath);
  const deltaValues = new Set(tasks.map((task) => task?.delta?.[0]?.value));
  if (payload?.outputType === "morphology_turnaround") {
    push(errors, tasks.length === 3, "Morphology turnaround requires front, three-quarter and profile tasks");
    push(errors, ["front", "three_quarter", "profile"].every((value) => deltaValues.has(value)), "Morphology turnaround must cover front, three-quarter and profile views");
    push(errors, acceptedKinds.has("cineweave_codex_character_morphology_spec"), "Morphology turnaround requires CharacterMorphologySpec");
  }
  if (payload?.outputType === "human_realism_fixture") {
    push(errors, tasks.length === 3, "Natural-human benchmark requires exactly three fixtures");
    push(errors, ["neutral_close", "warm_backlight", "natural_fullbody"].every((value) => deltaValues.has(value)), "Natural-human benchmark must cover neutral close, warm backlight and natural full-body fixtures");
  }
  if (payload?.outputType === "style_exploration") {
    push(errors, tasks.length === 4, "Style exploration board requires exactly four comparable options");
    push(errors, deltaFields.every((field) => field === "styleOptionSet.options"), "Style exploration tasks must select StyleOptionSet options only");
    for (const kind of ["cineweave_codex_style_exploration_brief", "cineweave_codex_style_option_set", "cineweave_codex_character_spec", "cineweave_codex_character_appearance_state", "cineweave_codex_scene_spec"]) {
      push(errors, acceptedKinds.has(kind), `Style exploration requires ${kind}`);
    }
    push(errors, payload?.layout?.cameraConsistency === true && payload?.layout?.backgroundPolicy === "locked" && payload?.layout?.lightingPolicy === "locked", "Style exploration must lock camera, background and lighting");
  }
  if (payload?.outputType === "representation_fixture") {
    push(errors, tasks.length === 3, "Representation family benchmark requires exactly three fixtures");
    push(errors, acceptedKinds.has("cineweave_codex_representation_binding"), "Representation family benchmark requires RepresentationBinding");
    push(errors, acceptedKinds.has("cineweave_codex_style_compile"), "Representation family benchmark requires StyleCompile");
    if (payload?.recipeId?.includes("anime")) push(errors, [...deltaValues].every((value) => String(value).startsWith("anime_")), "Anime fixtures must use anime fixture profiles");
    if (payload?.recipeId?.includes("manga")) push(errors, [...deltaValues].every((value) => String(value).startsWith("manga_")), "Manga fixtures must use manga fixture profiles");
  }
  if (payload?.outputType === "cross_representation_sheet") {
    const requiredFamilies = ["photoreal", "anime", "manga", "illustration", "stylized_3d", "hybrid"];
    push(errors, tasks.length === requiredFamilies.length, "Cross-representation sheet requires exactly six family tasks");
    push(errors, deltaFields.every((field) => field === "representation.family"), "Cross-representation tasks may change only representation.family");
    push(errors, requiredFamilies.every((family) => deltaValues.has(family)), "Cross-representation sheet must cover photoreal, anime, manga, illustration, stylized-3D and hybrid families");
    push(errors, acceptedKinds.has("cineweave_codex_representation_binding"), "Cross-representation sheet requires RepresentationBindings");
    push(errors, payload?.layout?.cameraConsistency === true && payload?.layout?.backgroundPolicy === "locked" && payload?.layout?.lightingPolicy === "locked", "Cross-representation comparison must lock camera, background and lighting");
  }
  push(errors, payload?.executionBoundary?.generatesMedia === false, "AssetRecipe must not claim media generation");
}

function validateBoardAssemblyPlan(payload, errors) {
  const recipeRuns = payload?.recipeRuns || [];
  const regions = payload?.regions || [];
  const placements = payload?.tilePlacements || [];
  const runIds = recipeRuns.map((item) => item?.recipeRunId);
  const regionIds = regions.map((item) => item?.regionId);
  const tileIds = placements.map((item) => item?.tileId);
  push(errors, unique(runIds), "BoardAssemblyPlan recipe run IDs must be unique");
  push(errors, unique(regionIds), "BoardAssemblyPlan region IDs must be unique");
  push(errors, unique(tileIds), "BoardAssemblyPlan tile IDs must be unique");
  const expectedTaskKeys = new Set();
  for (const run of recipeRuns) {
    push(errors, run?.recipeRef?.kind === "cineweave_codex_asset_recipe", `${run?.recipeRunId}: BoardAssemblyPlan recipe ref must target AssetRecipe`);
    for (const taskId of run?.taskIds || []) expectedTaskKeys.add(`${run?.recipeRunId}/${taskId}`);
  }
  const placementTaskKeys = placements.map((item) => `${item?.recipeRunId}/${item?.taskId}`);
  push(errors, unique(placementTaskKeys), "BoardAssemblyPlan recipe tasks must have one final tile placement");
  push(errors, placementTaskKeys.every((key) => expectedTaskKeys.has(key)), "BoardAssemblyPlan placement references an undeclared recipe task");
  push(errors, expectedTaskKeys.size === placementTaskKeys.length && placementTaskKeys.every((key) => expectedTaskKeys.has(key)), "BoardAssemblyPlan must place every declared recipe task exactly once");
  for (const region of regions) {
    push(errors, region?.x + region?.width <= 1.000000001 && region?.y + region?.height <= 1.000000001, `${region?.regionId}: BoardAssemblyPlan region must remain inside the canvas`);
  }
  for (let left = 0; left < regions.length; left += 1) for (let right = left + 1; right < regions.length; right += 1) {
    const a = regions[left]; const b = regions[right];
    const overlaps = a?.x < b?.x + b?.width && a?.x + a?.width > b?.x && a?.y < b?.y + b?.height && a?.y + a?.height > b?.y;
    push(errors, !overlaps, `BoardAssemblyPlan regions overlap: ${a?.regionId}/${b?.regionId}`);
  }
  const regionById = new Map(regions.map((item) => [item?.regionId, item]));
  const occupiedCells = new Set();
  for (const placement of placements) {
    const region = regionById.get(placement?.regionId);
    push(errors, Boolean(region), `${placement?.tileId}: BoardAssemblyPlan placement uses unknown region`);
    if (region) {
      push(errors, placement?.row < region.rows && placement?.column < region.columns, `${placement?.tileId}: BoardAssemblyPlan placement lies outside its region grid`);
      const cell = `${placement.regionId}/${placement.row}/${placement.column}`;
      push(errors, !occupiedCells.has(cell), `${placement?.tileId}: BoardAssemblyPlan region cell is already occupied`);
      occupiedCells.add(cell);
    }
  }
  push(errors, payload?.failurePolicy?.strategy === "retry_failed_tiles_only", "BoardAssemblyPlan must retry failed tiles only");
  push(errors, payload?.failurePolicy?.preserveAcceptedOutputs === true, "BoardAssemblyPlan must preserve accepted outputs");
  push(errors, payload?.failurePolicy?.blockOnRequiredTileFailure === true, "BoardAssemblyPlan must block on a required tile failure");
  push(errors, payload?.validation?.exactRecipeTasks === true, "BoardAssemblyPlan must bind exact recipe tasks");
  push(errors, payload?.validation?.regionsNonOverlapping === true, "BoardAssemblyPlan must validate non-overlapping regions");
  push(errors, payload?.validation?.perTileProvenance === true, "BoardAssemblyPlan must preserve per-tile provenance");
  push(errors, payload?.validation?.heterogeneousLayoutsAllowed === true, "BoardAssemblyPlan must explicitly allow heterogeneous layouts");
  push(errors, payload?.validation?.deterministicAssembly === true, "BoardAssemblyPlan must use deterministic assembly");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "BoardAssemblyPlan must not claim media generation");
}

function validateControlSet(payload, errors) {
  const channels = payload?.channels || [];
  push(errors, unique(channels.map((item) => item?.channelId)), "ControlChannel IDs must be unique");
  for (const channel of channels) {
    if (channel?.enforcement === "hard") push(errors, channel?.fallback?.action === "block", `${channel.channelId}: hard control must block on failure`);
    if (channel?.enforcement === "advisory") push(errors, channel?.priority < 500, `${channel.channelId}: advisory control priority must remain below 500`);
    push(errors, nonEmpty(channel?.source?.ref), `${channel.channelId}: source ref is required`);
  }
  push(errors, payload?.conflictResolution?.lowerPriorityCannotOverrideHard === true, "Control set must protect hard controls from lower priority overrides");
}

function validateEvidenceBundle(payload, errors) {
  const evidence = payload?.evidence || [];
  push(errors, unique(evidence.map((item) => item?.evidenceId)), "Evidence IDs must be unique");
  push(errors, unique(evidence.map((item) => item?.observationId)), "Evidence Observation IDs must be unique");
  const roles = new Set(evidence.map((item) => item?.role));
  for (const role of payload?.requirements?.requiredRoles || []) push(errors, roles.has(role), `Evidence bundle is missing required role: ${role}`);
  for (const item of evidence) {
    push(errors, item?.quality?.confidence >= payload?.requirements?.minimumConfidence, `${item?.evidenceId}: confidence is below bundle minimum`);
    push(errors, isObject(item?.licenseProfileRef), `${item?.evidenceId}: license profile is required`);
  }
  if (payload?.requirements?.missingEvidencePolicy === "block") push(errors, payload?.rightsResolution?.allProfilesResolved === true, "Blocking evidence bundle requires all rights profiles resolved");
}

function validateCapabilityProfile(payload, errors) {
  const capabilities = payload?.capabilities || [];
  push(errors, unique(capabilities.map((item) => item?.capabilityId)), "Capability IDs must be unique");
  push(errors, Array.isArray(payload?.licenseProfileRefs) && payload.licenseProfileRefs.length > 0, "Capability profile requires license profiles");
  push(errors, payload?.matchingPolicy?.hardRequirementPolicy === "block", "Hard capability mismatch must block");
}

function validateCapabilityResolutionPlan(payload, errors, context = {}) {
  if (payload?.contractVersion !== "2.5.0") return;
  const request = payload?.request || {};
  const candidates = payload?.candidates || [];
  const requirements = request.requirements || [];
  const candidateIds = candidates.map((candidate) => candidate?.candidateId);
  const requirementIds = requirements.map((requirement) => requirement?.requirementId);
  push(errors, nonEmpty(payload?.resolutionPlanId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "CapabilityResolutionPlan 2.5 requires a stable identity and version");
  push(errors, unique(candidateIds), "CapabilityResolutionPlan candidate IDs must be unique");
  push(errors, unique(requirementIds), "CapabilityResolutionPlan requirement IDs must be unique");
  push(errors, candidateIds.every((id, index) => index === 0 || String(candidateIds[index - 1]).localeCompare(String(id)) <= 0), "CapabilityResolutionPlan candidates must be stably ordered by candidateId");
  push(errors, requirements.length > 0 && requirements.every((requirement) => nonEmpty(requirement?.capabilityId) && ["hard", "soft", "advisory"].includes(requirement?.level)), "CapabilityResolutionPlan requirements must declare typed capability levels");
  const knownCandidates = new Set(candidateIds);
  for (const candidate of candidates) {
    push(errors, isExactContractRef(candidate?.capabilityProfileRef, ["cineweave_codex_capability_profile"]), `${candidate?.candidateId}: capabilityProfileRef must be exact`);
    push(errors, isExactContractRef(candidate?.adapterDescriptorRef, ["cineweave_adapter_descriptor"]), `${candidate?.candidateId}: adapterDescriptorRef must be exact`);
    push(errors, nonEmpty(candidate?.adapterId), `${candidate?.candidateId}: adapterId is required for explanation`);
    const operation = candidate?.operationSupport || {};
    const operationChecks = ["executionMode", "renderMode", "mediaKind", "inputCapacity", "outputCapacity", "mimeTypes"];
    push(errors, operation.status === (operationChecks.every((key) => operation[key] === true) ? "pass" : "fail"), `${candidate?.candidateId}: operation support status must match its checks`);
    const resultIds = (candidate?.capabilityResults || []).map((item) => item?.requirementId);
    push(errors, unique(resultIds), `${candidate?.candidateId}: capability result IDs must be unique`);
    push(errors, (candidate?.capabilityResults || []).length > 0, `${candidate?.candidateId}: capability results are required`);
    push(errors, typeof candidate?.score === "number" && candidate.score >= 0 && candidate.score <= 100, `${candidate?.candidateId}: capability score must be bounded`);
    const hardFailures = candidate?.hardFailures || [];
    const operationFailed = operation.status !== "pass";
    const hardResultFailed = (candidate?.capabilityResults || []).some((item) => item?.level === "hard" && item?.status === "fail");
    const hasReview = (candidate?.capabilityResults || []).some((item) => item?.status === "review");
    const expectedStatus = operationFailed || hardResultFailed || hardFailures.length > 0 ? "blocked" : hasReview ? "needs_review" : candidate?.status === "selected" ? "selected" : "eligible";
    push(errors, candidate?.status === expectedStatus, `${candidate?.candidateId}: candidate status must reflect operation and hard capability results`);
    push(errors, candidate?.status === "blocked" ? hardFailures.length > 0 : true, `${candidate?.candidateId}: blocked candidate must expose a hard failure reason`);
    if (context.candidates) {
      const supplied = context.candidates.find((item) => item?.candidateId === candidate?.candidateId);
      if (supplied?.capabilityProfile) {
        push(errors, sameExactRef(candidate.capabilityProfileRef, {
          kind: supplied.capabilityProfile.kind,
          id: supplied.capabilityProfile.profileId,
          version: supplied.capabilityProfile.version,
          contentHash: sha256Canonical(supplied.capabilityProfile)
        }), `${candidate?.candidateId}: CapabilityProfile ref must match supplied payload`);
      }
    }
  }
  const selectedCandidates = candidates.filter((candidate) => candidate?.status === "selected");
  const selection = payload?.selection || {};
  push(errors, selection.status === payload?.status, "CapabilityResolutionPlan selection status must match plan status");
  if (payload?.status === "selected") {
    push(errors, selectedCandidates.length === 1, "Selected CapabilityResolutionPlan must mark exactly one candidate selected");
    push(errors, selectedCandidates[0]?.candidateId === selection.selectedCandidateId, "Selected CapabilityResolutionPlan must identify its selected candidate");
    push(errors, isExactContractRef(selection.selectedCapabilityProfileRef, ["cineweave_codex_capability_profile"]) && isExactContractRef(selection.selectedAdapterDescriptorRef, ["cineweave_adapter_descriptor"]), "Selected CapabilityResolutionPlan must expose exact selected refs");
    if (selectedCandidates.length === 1) {
      push(errors, sameExactRef(selection.selectedCapabilityProfileRef, selectedCandidates[0].capabilityProfileRef), "CapabilityResolutionPlan selected CapabilityProfile ref must match the selected candidate");
      push(errors, sameExactRef(selection.selectedAdapterDescriptorRef, selectedCandidates[0].adapterDescriptorRef), "CapabilityResolutionPlan selected AdapterDescriptor ref must match the selected candidate");
    }
  } else {
    push(errors, selectedCandidates.length === 0 && selection.selectedCandidateId === null, "Unselected CapabilityResolutionPlan must not expose a selected candidate");
    push(errors, selection.selectedCapabilityProfileRef === null && selection.selectedAdapterDescriptorRef === null, "Unselected CapabilityResolutionPlan must not expose selected refs");
    if (payload?.status === "needs_review") push(errors, candidates.some((candidate) => candidate?.status === "needs_review"), "Review-needed CapabilityResolutionPlan must retain a review candidate");
    if (payload?.status === "blocked") push(errors, candidates.every((candidate) => candidate?.status === "blocked"), "Blocked CapabilityResolutionPlan must have no eligible or review candidate");
  }
  push(errors, (payload?.explanation?.fallbackCandidateIds || []).every((id) => knownCandidates.has(id)), "CapabilityResolutionPlan fallback candidates must be declared candidates");
  push(errors, nonEmpty(payload?.explanation?.primaryDecision) && nonEmpty(payload?.explanation?.rankingPolicy), "CapabilityResolutionPlan must explain the primary decision and ranking policy");
  push(errors, containsProviderWeightSyntax(payload?.explanation) === false, "CapabilityResolutionPlan explanation must not contain provider weight syntax");
  for (const [key, expected] of Object.entries({ providerNeutral: true, generatesMedia: false, executesAdapter: false, mutatesCanon: false, writesFiles: false, humanApprovalRequired: true })) {
    push(errors, payload?.executionBoundary?.[key] === expected, `CapabilityResolutionPlan execution boundary.${key} is unsafe`);
  }
  for (const key of ["candidateRefsExact", "descriptorBindingsExact", "hardRequirementsBlock", "rankingDeterministic", "explanationPresent", "noProviderSelection", "noExecution"]) {
    push(errors, payload?.validation?.[key] === true, `CapabilityResolutionPlan validation.${key} must be true`);
  }
}

function validateExecutionPreview(payload, errors, context = {}) {
  if (payload?.contractVersion !== "2.5.0") return;
  push(errors, nonEmpty(payload?.previewId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "ExecutionPreview 2.5 requires a stable identity and version");
  push(errors, isExactContractRef(payload?.executionRequestRef, ["cineweave_execution_request"]), "ExecutionPreview must bind an exact ExecutionRequest");
  push(errors, isExactContractRef(payload?.capabilityResolutionPlanRef, ["cineweave_codex_capability_resolution_plan"]), "ExecutionPreview must bind an exact CapabilityResolutionPlan");
  push(errors, isExactContractRef(payload?.adapterDescriptorRef, ["cineweave_adapter_descriptor"]), "ExecutionPreview must bind an exact AdapterDescriptor");
  push(errors, isExactContractRef(payload?.capabilityProfileRef, ["cineweave_codex_capability_profile"]), "ExecutionPreview must bind an exact CapabilityProfile");
  const risks = payload?.riskSummary || [];
  push(errors, unique(risks.map((risk) => risk?.riskId)), "ExecutionPreview risk IDs must be unique");
  const hasBlock = risks.some((risk) => risk?.status === "block");
  const hasReview = risks.some((risk) => risk?.status === "review");
  push(errors, payload?.status === (hasBlock ? "blocked" : hasReview ? "needs_review" : "ready"), "ExecutionPreview status must reflect its risk summary");
  push(errors, payload?.approval?.required === true && payload?.approval?.status === "pending" && payload?.approval?.action === "approve_exact_request", "ExecutionPreview must leave exact-request approval pending");
  push(errors, payload?.costEstimate?.unknownCostAction === "block", "ExecutionPreview unknown cost policy must block");
  push(errors, payload?.costEstimate?.status === "unknown" ? payload?.costEstimate?.amount === null : typeof payload?.costEstimate?.amount === "number", "ExecutionPreview cost status must match its amount visibility");
  push(errors, payload?.requestSummary?.currency === payload?.costEstimate?.currency, "ExecutionPreview request and cost currencies must match");
  if (context.executionRequest) {
    const request = context.executionRequest;
    push(errors, sameExactRef(payload.executionRequestRef, { kind: request.kind, id: request.requestId, version: request.version, contentHash: sha256Canonical(request) }), "ExecutionPreview executionRequestRef must match the supplied request");
    push(errors, sameExactRef(payload.adapterDescriptorRef, request.adapterDescriptorRef), "ExecutionPreview AdapterDescriptor ref must match the supplied request");
    push(errors, sameExactRef(payload.capabilityProfileRef, request.capabilityProfileRef), "ExecutionPreview CapabilityProfile ref must match the supplied request");
    push(errors, payload.approval.scope === (request.executionMode === "external" ? "exact_execution_request" : "none"), "ExecutionPreview approval scope must match the request execution mode");
  }
  if (context.capabilityResolutionPlan) {
    const resolution = context.capabilityResolutionPlan;
    push(errors, sameExactRef(payload.capabilityResolutionPlanRef, { kind: resolution.kind, id: resolution.resolutionPlanId, version: resolution.version, contentHash: sha256Canonical(resolution) }), "ExecutionPreview resolution ref must match the supplied plan");
    if (resolution.selection.status === "selected") {
      push(errors, sameExactRef(payload.adapterDescriptorRef, resolution.selection.selectedAdapterDescriptorRef) && sameExactRef(payload.capabilityProfileRef, resolution.selection.selectedCapabilityProfileRef), "ExecutionPreview selected refs must match the resolution plan");
    }
  }
  for (const [key, expected] of Object.entries({ providerNeutral: true, generatesMedia: false, executesAdapter: false, mutatesCanon: false, writesFiles: false, humanApprovalRequired: true })) {
    push(errors, payload?.executionBoundary?.[key] === expected, `ExecutionPreview execution boundary.${key} is unsafe`);
  }
  for (const key of ["exactRequestRef", "exactResolutionRef", "selectedAdapterMatches", "hardConstraintsVisible", "costVisible", "approvalPending", "noExecution"]) {
    push(errors, payload?.validation?.[key] === true, `ExecutionPreview validation.${key} must be true`);
  }
}

function validateLicenseProfile(payload, errors) {
  if (payload?.commercialUse === "allowed") {
    push(errors, payload?.status === "verified", "Commercial use allowed requires verified status");
    push(errors, (payload?.evidence || []).some((item) => item?.status === "verified"), "Commercial use allowed requires verified evidence");
  }
  push(errors, payload?.validation?.noAssumedCommercialUse === true, "License profile must not assume commercial use");
}

function validateBenchmark(payload, errors) {
  const metrics = payload?.metrics || [];
  const metricIds = metrics.map((item) => item?.metricId);
  const dimensions = payload?.dimensions || [];
  const cases = payload?.cases || [];
  const scopes = payload?.scopes || [];
  push(errors, unique(metricIds), "Benchmark metric IDs must be unique");
  push(errors, unique(dimensions.map((item) => item?.dimensionId)), "Benchmark dimension IDs must be unique");
  push(errors, unique(cases.map((item) => item?.caseId)), "Benchmark case IDs must be unique");
  const known = new Set(metricIds);
  for (const dimension of dimensions) for (const id of dimension.metricIds || []) push(errors, known.has(id), `${dimension.dimensionId}: unknown metric ${id}`);
  const requiredCategoryByScope = new Map([
    ["MorphologyBench", "morphology"],
    ["HumanRealismBench", "surface_realism"],
    ["AnimeBench", "anime_representation"],
    ["MangaBench", "manga_representation"],
    ["CrossRepresentationBench", "cross_representation"],
    ["CinematographyBench", "cinematography"],
    ["DirectorQualityBench", "director_quality"]
  ]);
  const categories = new Set(cases.map((item) => item?.category));
  for (const scope of scopes) {
    const requiredCategory = requiredCategoryByScope.get(scope);
    if (requiredCategory) push(errors, categories.has(requiredCategory), scope + " requires a " + requiredCategory + " case");
  }
  if (scopes.includes("CinematographyBench")) {
    const calibration = payload?.humanReview?.calibration;
    const anchors = calibration?.anchors || [];
    const knownDimensionIds = new Set(dimensions.map((item) => item?.dimensionId));
    push(errors, isObject(calibration), "CinematographyBench requires a calibration protocol");
    if (isObject(calibration)) {
      push(errors, calibration?.blindComparison === true, "CinematographyBench calibration requires blind comparison");
      push(errors, calibration?.trainingRequired === true, "CinematographyBench calibration requires reviewer training");
      push(errors, Number.isSafeInteger(calibration?.minimumIndependentReviewers) && calibration.minimumIndependentReviewers >= 2, "CinematographyBench calibration requires at least two independent reviewers");
      push(errors, typeof calibration?.minimumAgreement === "number" && calibration.minimumAgreement >= 0 && calibration.minimumAgreement <= 1, "CinematographyBench calibration requires a bounded agreement threshold");
      push(errors, payload?.humanReview?.reviewerCount >= calibration?.minimumIndependentReviewers, "CinematographyBench reviewerCount must meet the independent-reviewer minimum");
      push(errors, unique(anchors.map((item) => item?.anchorId)), "CinematographyBench calibration anchor IDs must be unique");
      for (const anchor of anchors) push(errors, knownDimensionIds.has(anchor?.dimensionId), "CinematographyBench calibration references an unknown dimension");
      push(errors, anchors.some((item) => item?.dimensionId === "dimension.cinematography"), "CinematographyBench calibration must anchor the cinematography dimension");
    }
  }
  if (scopes.includes("DirectorQualityBench")) {
    const calibration = payload?.humanReview?.calibration;
    const anchors = calibration?.anchors || [];
    const knownDimensionIds = new Set(dimensions.map((item) => item?.dimensionId));
    const pairing = calibration?.observedMediaCalibration;
    push(errors, isObject(calibration), "DirectorQualityBench requires a calibration protocol");
    if (isObject(calibration)) {
      push(errors, calibration?.blindComparison === true, "DirectorQualityBench calibration requires blind comparison");
      push(errors, calibration?.trainingRequired === true, "DirectorQualityBench calibration requires reviewer training");
      push(errors, Number.isSafeInteger(calibration?.minimumIndependentReviewers) && calibration.minimumIndependentReviewers >= 2, "DirectorQualityBench calibration requires at least two independent reviewers");
      push(errors, typeof calibration?.minimumAgreement === "number" && calibration.minimumAgreement >= 0 && calibration.minimumAgreement <= 1, "DirectorQualityBench calibration requires a bounded agreement threshold");
      push(errors, payload?.humanReview?.reviewerCount >= calibration?.minimumIndependentReviewers, "DirectorQualityBench reviewerCount must meet the independent-reviewer minimum");
      push(errors, unique(anchors.map((item) => item?.anchorId)), "DirectorQualityBench calibration anchor IDs must be unique");
      for (const anchor of anchors) push(errors, knownDimensionIds.has(anchor?.dimensionId), "DirectorQualityBench calibration references an unknown dimension");
      push(errors, anchors.some((item) => item?.dimensionId === "dimension.direction"), "DirectorQualityBench calibration must anchor the direction dimension");
      push(errors, isObject(pairing) && pairing?.mode === "paired_observed_media" && pairing?.requiresObservedMedia === true && pairing?.balancedPresentationOrder === true && pairing?.decisionScale === "left_right_tie" && Number.isSafeInteger(pairing?.minimumPairs) && pairing.minimumPairs >= 2, "DirectorQualityBench calibration requires paired observed-media design");
    }
    for (const testCase of cases.filter((item) => item?.category === "director_quality")) {
      const refs = testCase?.directorArtifactRefs || [];
      const kinds = new Set(refs.map((ref) => ref?.kind));
      push(errors, refs.length >= 4 && refs.every((ref) => isExactContractRef(ref)), "DirectorQualityBench cases require exact Director artifact references");
      push(errors, unique(refs.map((ref) => [ref?.kind, ref?.id, ref?.version, ref?.contentHash].join("@"))), "DirectorQualityBench artifact references must be unique");
      for (const requiredKind of ["cineweave_codex_action_sequence_spec", "cineweave_codex_shot_spec", "cineweave_codex_temporal_spec", "cineweave_codex_storyboard_sequence"]) {
        push(errors, kinds.has(requiredKind), "DirectorQualityBench cases require " + requiredKind);
      }
    }
  }
  for (const testCase of cases) {
    if (testCase?.category === "cinematography") {
      push(errors, isExactContractRef(testCase?.cameraPrevisRef, ["cineweave_codex_camera_previs_spec"]), "CinematographyBench requires an exact CameraPrevisSpec reference");
    }
  }
  push(errors, cases.some((item) => item?.category === "rights"), "ControlBench must include a rights case");
  push(errors, payload?.acceptance?.blockingDimensionPassRate === 1, "Blocking dimensions require perfect pass rate");
}

function validateBenchmarkReview(payload, errors, benchmark) {
  const results = payload?.caseResults || [];
  const media = payload?.mediaEvidence || [];
  push(errors, unique(results.map((item) => item?.caseId)), "ControlBenchmarkReview case IDs must be unique");
  push(errors, unique(media.map((item) => item?.mediaId)), "ControlBenchmarkReview media IDs must be unique");
  const knownMediaIds = new Set(media.map((item) => item?.mediaId));
  const allObservationIds = media.flatMap((item) => item?.candidateObservationIds || []);
  push(errors, unique(allObservationIds), "ControlBenchmarkReview candidate observation IDs must be unique across media");
  const knownObservationIds = new Set(allObservationIds);
  const observationMediaIds = new Map();
  for (const item of media) {
    for (const observationId of item?.candidateObservationIds || []) {
      if (!observationMediaIds.has(observationId)) observationMediaIds.set(observationId, new Set());
      observationMediaIds.get(observationId).add(item?.mediaId);
    }
  }
  const findingIds = [];
  for (const result of results) {
    push(errors, unique((result?.reviewedMediaIds || [])), `${result?.caseId}: reviewed media IDs must be unique`);
    for (const mediaId of result?.reviewedMediaIds || []) push(errors, knownMediaIds.has(mediaId), `${result?.caseId}: unknown reviewed media ${mediaId}`);
    push(errors, unique((result?.findings || []).map((item) => item?.findingId)), `${result?.caseId}: finding IDs must be unique`);
    push(errors, unique((result?.metricResults || []).map((item) => item?.metricId)), `${result?.caseId}: metric IDs must be unique`);
    for (const finding of result?.findings || []) {
      findingIds.push(finding?.findingId);
      for (const observationId of finding?.evidenceObservationIds || []) push(errors, knownObservationIds.has(observationId), `${finding?.findingId}: finding evidence must be bound to candidate media`);
      if (["warn", "fail"].includes(finding?.status)) push(errors, nonEmpty(finding?.smallestRepairVariable), `${finding?.findingId}: warning or failure requires one smallest repair variable`);
    }
    for (const metric of result?.metricResults || []) for (const observationId of metric?.evidenceObservationIds || []) push(errors, knownObservationIds.has(observationId), `${metric?.metricId}: metric evidence must be bound to candidate media`);
    if (["pass", "warn", "fail"].includes(result?.status)) {
      push(errors, (result?.reviewedMediaIds || []).length > 0, `${result?.caseId}: completed case requires reviewed media`);
      push(errors, (result?.findings || []).length > 0, `${result?.caseId}: completed case requires findings`);
      push(errors, (result?.metricResults || []).length > 0, `${result?.caseId}: completed case requires metrics`);
    }
  }
  push(errors, unique(findingIds), "ControlBenchmarkReview finding IDs must be unique across cases");
  if (benchmark) {
    const expectedCaseIds = (benchmark.cases || []).map((item) => item?.caseId).sort();
    const actualCaseIds = results.map((item) => item?.caseId).sort();
    const expectedMetricIds = new Set((benchmark.metrics || []).map((item) => item?.metricId));
    push(errors, JSON.stringify(actualCaseIds) === JSON.stringify(expectedCaseIds), "ControlBenchmarkReview must cover every bound benchmark case exactly once");
    push(errors, payload?.benchmarkRef?.id === benchmark?.suiteId && payload?.benchmarkRef?.version === benchmark?.version, "ControlBenchmarkReview benchmark ref must match the supplied ControlBenchmark");
    for (const result of results) for (const metric of result?.metricResults || []) push(errors, expectedMetricIds.has(metric?.metricId), `${result?.caseId}: unknown benchmark metric ${metric?.metricId}`);
  }
  const calibrationPlan = benchmark?.humanReview?.calibration;
  if (calibrationPlan) {
    const calibration = payload?.humanReview?.calibration;
    push(errors, isObject(calibration), "ControlBenchmarkReview must bind the benchmark calibration protocol");
    if (isObject(calibration)) {
      push(errors, calibration?.protocolId === calibrationPlan?.protocolId, "ControlBenchmarkReview calibration protocol must match the benchmark");
      if (payload?.status === "planned") {
        const noClaimedResults = ["not_started", "planned"].includes(calibration?.status)
          && calibration?.independentReviewerCount === 0
          && calibration?.agreementScore === null
          && calibration?.adjudicationStatus === "not_started";
        push(errors, noClaimedResults, "Planned ControlBenchmarkReview must not claim calibration results");
      }
      const pairingPlan = calibrationPlan?.observedMediaCalibration;
      const pairResults = Array.isArray(calibration?.pairResults) ? calibration.pairResults : [];
      if (pairingPlan && payload?.status === "planned") {
        push(errors, pairResults.length === 0, "Planned ControlBenchmarkReview must not claim observed-media calibration pairs");
      }
      if (payload?.status === "completed") {
        const completedCalibration = calibration?.status === "completed"
          && calibration?.independentReviewerCount >= calibrationPlan?.minimumIndependentReviewers
          && payload?.humanReview?.reviewerCount >= calibration?.independentReviewerCount
          && typeof calibration?.agreementScore === "number";
        push(errors, completedCalibration, "Completed ControlBenchmarkReview requires calibrated independent review");
        if (typeof calibration?.agreementScore === "number") {
          if (calibration.agreementScore < calibrationPlan.minimumAgreement) {
            push(errors, calibration?.adjudicationStatus === "completed" && nonEmpty(calibration?.adjudicationNotes), "Below-threshold calibration agreement requires completed adjudication notes");
          } else {
            push(errors, calibration?.adjudicationStatus === "not_required", "At-threshold calibration agreement must record adjudication as not required");
          }
        }
        if (pairingPlan) {
          const benchmarkCaseIds = new Set((benchmark?.cases || []).map((item) => item?.caseId));
          const benchmarkDimensionIds = new Set((benchmark?.dimensions || []).map((item) => item?.dimensionId));
          const directorQualityCaseIds = new Set((benchmark?.cases || []).filter((item) => item?.category === "director_quality").map((item) => item?.caseId));
          const directorQualityDimensionIds = new Set((benchmark?.dimensions || []).filter((item) => item?.scope === "direction").map((item) => item?.dimensionId));
          push(errors, pairResults.length >= pairingPlan.minimumPairs, "Completed ControlBenchmarkReview requires the configured observed-media calibration pairs");
          push(errors, unique(pairResults.map((item) => item?.pairId)), "Calibration pair result IDs must be unique");
          if (pairingPlan.balancedPresentationOrder === true) {
            push(errors, pairResults.some((item) => item?.presentationOrder === "left_first") && pairResults.some((item) => item?.presentationOrder === "right_first"), "Completed ControlBenchmarkReview requires balanced observed-media presentation order");
          }
          if (benchmark?.scopes?.includes("DirectorQualityBench")) {
            push(errors, pairResults.some((item) => directorQualityCaseIds.has(item?.caseId) && directorQualityDimensionIds.has(item?.dimensionId)), "Completed ControlBenchmarkReview requires a DirectorQualityBench calibration pair");
          }
          for (const pair of pairResults) {
            const pairLabel = String(pair?.pairId || "unknown-pair");
            push(errors, knownMediaIds.has(pair?.leftMediaId) && knownMediaIds.has(pair?.rightMediaId), pairLabel + ": calibration pair media must be bound to media evidence");
            push(errors, pair?.leftMediaId !== pair?.rightMediaId, pairLabel + ": calibration pair must compare two distinct media items");
            for (const observationId of pair?.evidenceObservationIds || []) push(errors, knownObservationIds.has(observationId), pairLabel + ": calibration pair evidence must be bound to candidate media");
            const evidenceMediaIds = new Set((pair?.evidenceObservationIds || []).flatMap((observationId) => [...(observationMediaIds.get(observationId) || [])]));
            push(errors, evidenceMediaIds.has(pair?.leftMediaId) && evidenceMediaIds.has(pair?.rightMediaId), pairLabel + ": calibration pair evidence must include observations bound to both media items");
            push(errors, benchmarkCaseIds.has(pair?.caseId), pairLabel + ": calibration pair must target a known benchmark case");
            push(errors, benchmarkDimensionIds.has(pair?.dimensionId), pairLabel + ": calibration pair must target a known benchmark dimension");
          }
        }
      }
    }
  }
  const blockingFailures = results.flatMap((result) => result?.findings || []).filter((finding) => finding?.severity === "blocking" && finding?.status === "fail").map((finding) => finding?.findingId).sort();
  const declaredBlockingFailures = [...(payload?.decision?.blockingFindingIds || [])].sort();
  push(errors, JSON.stringify(declaredBlockingFailures) === JSON.stringify(blockingFailures), "ControlBenchmarkReview must declare every and only failed blocking finding");
  if (payload?.status === "planned") {
    push(errors, media.length === 0, "Planned ControlBenchmarkReview cannot claim media evidence");
    push(errors, results.every((result) => result?.status === "planned"), "Planned ControlBenchmarkReview cases must remain planned");
    push(errors, payload?.decision?.overallStatus === "planned" && payload?.decision?.mayAdvanceToApproval === false, "Planned ControlBenchmarkReview cannot advance a candidate");
  }
  if (payload?.status === "completed") {
    push(errors, media.length > 0, "Completed ControlBenchmarkReview requires observed media evidence");
    push(errors, results.every((result) => result?.status !== "planned"), "Completed ControlBenchmarkReview cannot retain planned cases");
    push(errors, payload?.humanReview?.status === "completed" && payload?.humanReview?.reviewerCount >= 1, "Completed ControlBenchmarkReview requires completed human review");
  }
  if (blockingFailures.length > 0) {
    push(errors, payload?.decision?.overallStatus === "fail", "Blocking ControlBench failure requires overallStatus=fail");
    push(errors, payload?.decision?.nextAction === "repair" && payload?.decision?.mayAdvanceToApproval === false, "Blocking ControlBench failure must repair and cannot advance");
  }
  if (payload?.decision?.mayAdvanceToApproval) {
    push(errors, payload?.status === "completed" && payload?.decision?.overallStatus === "pass", "Only a completed passing ControlBenchmarkReview may advance");
    push(errors, blockingFailures.length === 0, "ControlBenchmarkReview with a blocking failure cannot advance");
  }
  for (const key of ["benchmarkBound", "casesComplete", "exactMediaEvidence", "blockingFailuresBlockAdvancement", "noAttractivenessScore", "noBiometricInference", "oneOwnerPerRepair"]) push(errors, payload?.validation?.[key] === true, `ControlBenchmarkReview validation.${key} must be true`);
  push(errors, payload?.executionBoundary?.generatesMedia === false && payload?.executionBoundary?.approvesAssets === false, "ControlBenchmarkReview cannot generate media or approve assets");
}

function validateAdapterDescriptor(payload, errors, capabilityProfile) {
  const operations = payload?.operations || [];
  push(errors, unique(operations.map((item) => item?.operationId)), "Adapter operation IDs must be unique");
  push(errors, payload?.security?.contractsMayContainSecrets === false, "Adapter contracts must forbid secrets");
  push(errors, payload?.security?.externalEffectsDefaultDenied === true, "Adapter external effects must default to denied");
  push(errors, payload?.security?.arbitraryCommandExecution === false, "Adapter descriptors must not authorize arbitrary commands");
  push(errors, payload?.security?.outputRootConstrained === true, "Adapter outputs must stay under the execution root");
  if ((payload?.executionModes || []).includes("external")) {
    push(errors, payload?.security?.networkAccess === "external_mode_only", "External adapters may use network only in external mode");
    push(errors, nonEmpty(payload?.security?.networkPolicyId), "External adapters require a network policy ID");
  } else {
    push(errors, payload?.security?.networkAccess === "forbidden", "Non-external adapters must forbid network access");
  }
  if (payload?.adapterClass === "fixture") {
    push(errors, !(payload?.executionModes || []).includes("external"), "Fixture adapters must not expose external mode");
    push(errors, (payload?.security?.credentialEnvVars || []).length === 0, "Fixture adapters must not request credentials");
  }
  const emphasis = payload?.semanticEmphasis || {};
  const acceptedLevels = emphasis?.acceptedLevels || [];
  push(errors, unique(acceptedLevels), "Adapter semantic emphasis levels must be unique");
  push(errors, emphasis?.providerSpecificSyntaxStored === false, "Adapter descriptors must not store provider-specific emphasis syntax");
  if (emphasis?.translationMode === "unsupported") push(errors, acceptedLevels.length === 0, "Unsupported semantic emphasis must not claim accepted levels");
  else push(errors, acceptedLevels.length > 0, "Semantic emphasis translation requires accepted levels");
  if (capabilityProfile) {
    push(errors, payload?.adapterId === capabilityProfile?.adapterId, "AdapterDescriptor adapterId must match CapabilityProfile adapterId");
    push(errors, payload?.capabilityProfileRef?.kind === capabilityProfile?.kind, "AdapterDescriptor must bind the CapabilityProfile kind");
  }
}

function validateExecutionRequest(payload, errors) {
  const parameters = payload?.parameters || [];
  push(errors, unique(parameters.map((item) => item?.name)), "ExecutionRequest parameter names must be unique");
  const sensitiveName = /(?:api.?key|token|secret|password|credential|endpoint|signed.?url|url)/i;
  for (const parameter of parameters) {
    push(errors, !sensitiveName.test(parameter?.name || ""), `${parameter?.name}: sensitive or endpoint-like parameter names are forbidden`);
    push(errors, parameter?.sensitive === false, `${parameter?.name}: sensitive values must not enter an ExecutionRequest`);
  }
  push(errors, payload?.adapterDescriptorRef?.kind === "cineweave_adapter_descriptor", "ExecutionRequest must bind an AdapterDescriptor");
  push(errors, payload?.capabilityProfileRef?.kind === "cineweave_codex_capability_profile", "ExecutionRequest must bind a CapabilityProfile");
  push(errors, payload?.renderPlanRef?.kind === "cineweave_codex_render_plan", "ExecutionRequest must bind a RenderPlan");
  push(errors, ["cineweave_codex_prompt_record", "cineweave_codex_image_prompt"].includes(payload?.promptRef?.kind), "ExecutionRequest must bind a PromptRecord or ImagePrompt");
  const checks = ["exactRefsResolved", "operationSupported", "hardCapabilitiesSatisfied", "rightsResolved", "budgetResolved", "secretsAbsent"];
  const ready = checks.every((key) => payload?.preflight?.[key] === true);
  if (payload?.status === "ready" || payload?.preflight?.status === "ready") push(errors, ready, "Ready ExecutionRequest requires every preflight check to pass");
  if (payload?.executionMode === "external") {
    push(errors, payload?.authorization?.externalEffects === "exact_request_approval_required", "External execution requires exact-request approval");
    push(errors, payload?.authorization?.approvalScope === "exact_execution_request", "External approval scope must be the exact ExecutionRequest");
  } else {
    push(errors, payload?.authorization?.externalEffects === "denied", "Dry-run and fixture requests must deny external effects");
    push(errors, payload?.authorization?.approvalScope === "none", "Local-only requests must not claim an external approval scope");
  }
}

function validateExecutionReceipt(payload, errors, request) {
  const attempts = payload?.attempts || [];
  const outputs = payload?.outputs || [];
  push(errors, unique(outputs.map((item) => item?.outputId)), "ExecutionReceipt output IDs must be unique");
  push(errors, unique(outputs.map((item) => item?.storageRef)), "ExecutionReceipt storage refs must be unique");
  for (let index = 0; index < attempts.length; index += 1) push(errors, attempts[index]?.attempt === index + 1, "ExecutionReceipt attempts must be sequential from one");
  const totalCost = attempts.reduce((sum, item) => sum + Number(item?.costAmount || 0), 0);
  push(errors, Math.abs(totalCost - Number(payload?.costSummary?.actualAmount || 0)) < 1e-9, "ExecutionReceipt actual cost must include all attempts");
  if (payload?.status === "succeeded") {
    push(errors, outputs.length > 0, "Successful execution requires verified outputs");
    push(errors, payload?.failure === null, "Successful execution must not carry a failure");
    push(errors, attempts.length > 0 && attempts.at(-1)?.status === "succeeded", "Successful execution requires a successful final attempt");
    for (const key of ["adapterMatched", "requestHashMatched", "inputsMatched", "outputHashesVerified", "secretsAbsent", "externalSideEffectAuthorized"]) {
      push(errors, payload?.validation?.[key] === true, `Successful execution requires validation.${key}`);
    }
  }
  if (payload?.status === "dry_run") {
    push(errors, payload?.executionMode === "dry_run", "Dry-run status requires dry_run execution mode");
    push(errors, outputs.length === 0, "Dry-run receipt must not claim media outputs");
    push(errors, attempts.length === 0, "Dry-run receipt must not claim adapter attempts");
    push(errors, payload?.failure === null, "Successful dry-run must not carry a failure");
  }
  if (payload?.status === "failed") {
    push(errors, isObject(payload?.failure), "Failed execution requires a normalized failure");
    push(errors, attempts.length > 0 && attempts.at(-1)?.status === "failed", "Failed execution requires a failed final attempt");
    push(errors, outputs.length === 0, "Failed execution must not claim completed outputs");
  }
  if (payload?.status === "blocked") {
    push(errors, isObject(payload?.failure), "Blocked execution requires a normalized failure");
    push(errors, attempts.length === 0, "Blocked execution must occur before adapter attempts");
    push(errors, outputs.length === 0, "Blocked execution must not claim outputs");
  }
  if (payload?.executionMode === "external") {
    push(errors, payload?.authorizationEvidence?.required === true, "External receipt requires authorization evidence");
    if (payload?.status === "blocked") {
      const decision = payload?.authorizationEvidence?.decision;
      push(errors, ["approved", "missing", "rejected"].includes(decision), "Blocked external receipt has an invalid authorization decision");
      if (decision === "missing") {
        push(errors, payload?.authorizationEvidence?.approvalRecordHash === null, "Missing external approval must not claim an approval hash");
        push(errors, payload?.authorizationEvidence?.exactRequestHashMatched === false, "Missing external approval cannot claim an exact hash match");
      } else {
        push(errors, payload?.authorizationEvidence?.exactRequestHashMatched === true, "External decision must match the exact request hash");
        push(errors, nonEmpty(payload?.authorizationEvidence?.approvalRecordHash), "External decision requires an approval record hash");
      }
      push(errors, payload?.validation?.externalSideEffectAuthorized === false, "Blocked external execution must not claim authorized side effects");
    } else {
      push(errors, payload?.authorizationEvidence?.decision === "approved", "Attempted external execution must record an approved decision");
      push(errors, payload?.authorizationEvidence?.exactRequestHashMatched === true, "External approval must match the exact request hash");
      push(errors, nonEmpty(payload?.authorizationEvidence?.approvalRecordHash), "External receipt requires an approval record hash");
      push(errors, payload?.validation?.externalSideEffectAuthorized === true, "Attempted external execution requires authorized side effects");
    }
  } else {
    push(errors, payload?.authorizationEvidence?.required === false, "Local-only receipt must not claim external authorization was required");
    push(errors, payload?.authorizationEvidence?.decision === "not_required", "Local-only receipt authorization decision must be not_required");
  }
  if (request) {
    push(errors, payload?.idempotencyKey === request?.idempotencyKey, "ExecutionReceipt idempotency key must match its request");
    push(errors, payload?.executionMode === request?.executionMode, "ExecutionReceipt mode must match its request");
    push(errors, payload?.costSummary?.currency === request?.budget?.currency, "ExecutionReceipt currency must match its request budget");
    push(errors, payload?.costSummary?.actualAmount <= request?.budget?.maxAmount, "ExecutionReceipt cost exceeds request budget");
    push(errors, attempts.length <= request?.budget?.maxAttempts, "ExecutionReceipt attempts exceed request budget");
  }
}

function validateSkillEvaluationRun(payload, errors) {
  const results = payload?.results || [];
  const datasetCaseIds = payload?.dataset?.caseIds || [];
  const resultCaseIds = results.map((item) => item?.caseId);
  push(errors, unique(resultCaseIds), "SkillEvaluationRun case result IDs must be unique");
  push(errors, datasetCaseIds.length === resultCaseIds.length && datasetCaseIds.every((id, index) => id === resultCaseIds[index]), "SkillEvaluationRun results must preserve the declared dataset case order");
  push(errors, Date.parse(payload?.startedAt) <= Date.parse(payload?.finishedAt), "SkillEvaluationRun finish time must not precede start time");

  for (const result of results) {
    const checks = result?.checks || [];
    const errorsForCase = result?.errors || [];
    push(errors, unique(checks.map((item) => item?.checkId)), `${result?.caseId}: check IDs must be unique`);
    const hasFailedCheck = checks.some((item) => item?.status === "fail");
    if (result?.status === "pass") {
      push(errors, checks.length > 0 && !hasFailedCheck && errorsForCase.length === 0, `${result?.caseId}: pass requires passing checks and no errors`);
      push(errors, nonEmpty(result?.responseHash), `${result?.caseId}: pass requires a response hash`);
    } else if (result?.status === "fail") {
      push(errors, hasFailedCheck && errorsForCase.length === 0, `${result?.caseId}: fail requires a failed check and no runner error`);
      push(errors, nonEmpty(result?.responseHash), `${result?.caseId}: graded failure requires a response hash`);
    } else if (result?.status === "error") {
      push(errors, errorsForCase.length > 0, `${result?.caseId}: error requires runner error evidence`);
    }
  }

  const passed = results.filter((item) => item?.status === "pass").length;
  const failed = results.filter((item) => item?.status === "fail").length;
  const runnerErrors = results.filter((item) => item?.status === "error").length;
  const activationChecks = results.flatMap((item) => item?.checks || []).filter((item) => item?.scope === "activation");
  const outputChecks = results.flatMap((item) => item?.checks || []).filter((item) => ["output", "safety"].includes(item?.scope));
  const passRate = (checks) => checks.length ? checks.filter((item) => item?.status === "pass").length / checks.length : 1;
  const close = (left, right) => Math.abs(Number(left) - Number(right)) < 1e-12;
  push(errors, payload?.summary?.total === results.length, "SkillEvaluationRun summary total must equal result count");
  push(errors, payload?.summary?.passed === passed && payload?.summary?.failed === failed && payload?.summary?.errors === runnerErrors, "SkillEvaluationRun summary status counts are inconsistent");
  push(errors, close(payload?.summary?.activationPassRate, passRate(activationChecks)), "SkillEvaluationRun activation pass rate is inconsistent");
  push(errors, close(payload?.summary?.outputPassRate, passRate(outputChecks)), "SkillEvaluationRun output pass rate is inconsistent");
  push(errors, payload?.summary?.releaseGatePassed === results.every((item) => item?.status === "pass"), "SkillEvaluationRun release gate is inconsistent");
  if (payload?.mode === "fixture_replay") {
    push(errors, payload?.environment?.sandbox === "fixture-replay", "Fixture replay must declare the fixture-replay sandbox");
    push(errors, payload?.environment?.pluginSourceRef === null, "Fixture replay must not claim an installed plugin source ref");
    push(errors, payload?.privacy?.rawResponsePolicy === "discarded", "Fixture replay must discard raw responses");
  } else if (payload?.mode === "live_codex") {
    push(errors, payload?.environment?.sandbox === "read-only", "Live Codex evaluation must use a read-only sandbox");
    push(errors, payload?.environment?.pluginSourceRef === `v${payload?.environment?.pluginVersion}`, "Live Codex evaluation must bind the immutable installed plugin tag");
    push(errors, payload?.privacy?.rawResponsePolicy === "local_uncommitted", "Live Codex responses must remain local and uncommitted");
  }
}

function validateIntegratedImage(payload, errors) {
  const sceneBlocks = ["sceneGeography", "sceneArchitecture", "sceneMaterials", "sceneLighting", "sceneAtmosphere", "spatialContinuity"];
  const hasSceneBlocks = sceneBlocks.some((name) => Array.isArray(payload?.promptBlocks?.[name]) && payload.promptBlocks[name].length > 0);
  if (hasSceneBlocks) push(errors, isObject(payload?.sceneBinding), "Scene prompt blocks require sceneBinding");
  if (Array.isArray(payload?.characterBindings) && payload.characterBindings.length > 0) push(errors, payload?.validation?.characterBindingsResolved === true, "Character bindings must be marked resolved");
  if (payload?.sceneBinding) push(errors, payload?.validation?.sceneBindingResolved === true, "Scene binding must be marked resolved");
  if (payload?.sceneBinding && payload?.characterBindings?.length) push(errors, payload?.validation?.crossSkillReceiptsChecked === true, "Integrated prompt must check cross-skill receipts");
  if (payload?.productionContext) push(errors, payload?.validation?.productionContextResolved === true, "Production context must be marked resolved");
  const hasInteraction = Array.isArray(payload?.promptBlocks?.sceneInteraction) && payload.promptBlocks.sceneInteraction.length > 0;
  if (hasInteraction) {
    push(errors, isObject(payload?.sceneBinding?.interactionConstraints), "sceneInteraction prompt block requires resolved interaction constraints");
    push(errors, payload?.validation?.interactionConstraintsResolved === true, "Interaction constraints must be marked resolved");
  }
  if (payload?.styleBinding) validateStyleBinding(payload.styleBinding, errors, "Image Prompt style binding");
  if (payload?.referenceTransform) validateReferenceTransform(payload.referenceTransform, errors, "Image Prompt reference transform");
  push(errors, !containsProviderWeightSyntax(payload?.promptBlocks), "Image Prompt blocks must not contain provider-specific weight syntax");
}

function validateStyleBinding(binding, errors, label = "Style binding") {
  const mode = binding?.mode;
  push(errors, ["inline_atoms", "package", "compiled"].includes(mode), `${label} mode is invalid`);
  push(errors, binding?.visualTemporalSeparated === true, `${label} must separate visual and temporal style`);
  push(errors, Array.isArray(binding?.preserve) && binding.preserve.length > 0, `${label} requires preserve rules`);
  push(errors, Array.isArray(binding?.allowedVariation) && binding.allowedVariation.length > 0, `${label} requires bounded variation`);
  push(errors, Array.isArray(binding?.forbidden) && binding.forbidden.length > 0, `${label} requires forbidden rules`);
  if (mode === "inline_atoms") push(errors, Array.isArray(binding?.atoms) && binding.atoms.length > 0, `${label} inline_atoms requires atoms`);
  if (mode === "package" || mode === "compiled") push(errors, isObject(binding?.stylePackageRef), `${label} package mode requires an exact StylePackage ref`);
  if (mode === "compiled") push(errors, isObject(binding?.styleCompileRef), `${label} compiled mode requires an exact StyleCompile ref`);
}

function validatePromptRecord(payload, errors) {
  if (payload?.styleBinding) validateStyleBinding(payload.styleBinding, errors, "PromptRecord style binding");
  for (const reference of payload?.references || []) {
    if (reference?.referenceReviewRef) push(errors, reference.referenceReviewRef.kind === "cineweave_codex_reference_review", "PromptRecord referenceReviewRef must target ReferenceReview");
  }
  if (payload?.referenceTransform) validateReferenceTransform(payload.referenceTransform, errors, "PromptRecord reference transform");
  push(errors, !containsProviderWeightSyntax(payload?.prompt), "PromptRecord blocks must not contain provider-specific weight syntax");
}

function validateReferenceTransform(transform, errors, label = "Reference transform") {
  const reviewRefs = transform?.sourceReviewRefs || [];
  const deltas = transform?.targetDeltas || [];
  const criteria = transform?.acceptanceCriteria || [];
  push(errors, reviewRefs.length > 0 && unique(reviewRefs.map(exactRefKey)), `${label} source review refs must be non-empty and unique`);
  for (const ref of reviewRefs) push(errors, ref?.kind === "cineweave_codex_reference_review", `${label} source review refs must target ReferenceReview`);
  push(errors, unique(deltas.map((item) => item?.dimension)), `${label} target dimensions must be unique`);
  push(errors, deltas.some((item) => ["replace", "exclude"].includes(item?.sourceTreatment)), `${label} must replace or exclude at least one source dimension`);
  for (const delta of deltas) {
    if (delta?.sourceTreatment === "replace") push(errors, ["user_declared", "target_contract", "safe_default"].includes(delta?.evidenceBasis), `${label} replacement ${delta?.dimension} must not claim source evidence as its target basis`);
  }
  if (deltas.some((item) => item?.sourceTreatment === "unresolved")) push(errors, Array.isArray(transform?.unknowns) && transform.unknowns.length > 0, `${label} unresolved dimensions require explicit unknowns`);
  push(errors, unique(criteria.map((item) => item?.criterionId)), `${label} acceptance criterion IDs must be unique`);
  push(errors, transform?.validation?.sourceReviewsBound === true, `${label} must bind source reviews`);
  push(errors, transform?.validation?.targetDeltasExplicit === true, `${label} must declare target deltas`);
  push(errors, transform?.validation?.changedDimensionsBounded === true, `${label} must bound changed dimensions`);
  push(errors, transform?.validation?.unknownsFlagged === true, `${label} must flag unknowns`);
}

function validateIntegratedStoryboard(payload, errors) {
  for (const shot of payload?.shots || []) {
    if (shot.sceneBinding) {
      push(errors, nonEmpty(shot?.continuity?.sceneState), `${shot.shotId}: sceneBinding requires continuity.sceneState`);
      push(errors, Array.isArray(shot?.continuity?.geographyAnchors) && shot.continuity.geographyAnchors.length > 0, `${shot.shotId}: sceneBinding requires geographyAnchors`);
    }
    if (shot.interactionConstraints || shot?.sceneBinding?.interactionConstraints) {
      push(errors, nonEmpty(shot?.continuity?.interactionState), `${shot.shotId}: interaction constraints require continuity.interactionState`);
      push(errors, nonEmpty(shot?.continuity?.propState), `${shot.shotId}: interaction constraints require continuity.propState`);
    }
  }
}

function validateStoryboardContract(payload, errors, context = {}) {
  const shots = payload?.shots || [];
  const coverageLedger = payload?.coverageLedger || [];
  const shotIds = shots.map((shot) => shot?.shotId);
  const coverageIds = coverageLedger.map((entry) => entry?.coverageId);
  const shotIdSet = new Set(shotIds);
  const coverageById = new Map(coverageLedger.map((entry) => [entry?.coverageId, entry]));

  push(errors, unique(shotIds), "Storyboard shot IDs must be unique");
  push(errors, unique(coverageIds), "Storyboard coverage IDs must be unique");
  for (const [index, shot] of shots.entries()) {
    const label = shot?.shotId || "<unknown shot>";
    push(errors, shot?.order === index + 1, label + ": storyboard shot order must be contiguous and sequence-ordered");
    push(errors, shot?.shotSpecRef?.kind === "cineweave_codex_shot_spec", label + ": storyboard shotSpecRef must target ShotSpec");
    push(errors, Array.isArray(shot?.coverageLedgerIds) && shot.coverageLedgerIds.length > 0 && unique(shot.coverageLedgerIds), label + ": storyboard coverageLedgerIds must be a non-empty unique selection");
    for (const coverageId of shot?.coverageLedgerIds || []) {
      const entry = coverageById.get(coverageId);
      push(errors, Boolean(entry), label + ": storyboard references unknown coverage " + coverageId);
      if (entry) push(errors, (entry.shotIds || []).includes(shot.shotId), label + ": coverage " + coverageId + " must link back to the shot");
    }
  }
  for (const entry of coverageLedger) {
    const label = entry?.coverageId || "<unknown coverage>";
    push(errors, unique(entry?.beatIds || []), label + ": coverage beat IDs must be unique");
    push(errors, unique(entry?.shotIds || []), label + ": coverage shot IDs must be unique");
    for (const shotId of entry?.shotIds || []) {
      const shot = shots.find((candidate) => candidate?.shotId === shotId);
      push(errors, shotIdSet.has(shotId), label + ": coverage references unknown shot " + shotId);
      if (shot) push(errors, (shot.coverageLedgerIds || []).includes(entry.coverageId), label + ": shot " + shotId + " must link back to the coverage");
    }
  }

  const actionSequenceRef = payload?.actionSequenceRef;
  const selectedBeatIds = payload?.actionBeatIds || [];
  if (actionSequenceRef) {
    push(errors, actionSequenceRef.kind === "cineweave_codex_action_sequence_spec", "Storyboard actionSequenceRef must target ActionSequenceSpec");
    push(errors, Array.isArray(selectedBeatIds) && selectedBeatIds.length > 0 && unique(selectedBeatIds), "Storyboard actionBeatIds must be a non-empty unique selection");
    const selectedBeatSet = new Set(selectedBeatIds);
    for (const shot of shots) {
      const label = shot?.shotId || "<unknown shot>";
      push(errors, Array.isArray(shot?.actionBeatIds) && shot.actionBeatIds.length > 0 && unique(shot.actionBeatIds), label + ": action-scoped storyboard shot must select ActionSequenceSpec beats");
      for (const beatId of shot?.actionBeatIds || []) push(errors, selectedBeatSet.has(beatId), label + ": selects action beat outside the storyboard action scope: " + beatId);
    }
    for (const entry of coverageLedger) for (const beatId of entry?.beatIds || []) {
      push(errors, selectedBeatSet.has(beatId), (entry?.coverageId || "<unknown coverage>") + ": coverage beat lies outside the storyboard action scope: " + beatId);
    }
    for (const beatId of selectedBeatIds) {
      push(errors, shots.some((shot) => (shot?.actionBeatIds || []).includes(beatId)), "Storyboard action beat " + beatId + " is not selected by a shot");
      push(errors, coverageLedger.some((entry) => (entry?.beatIds || []).includes(beatId)), "Storyboard action beat " + beatId + " is not covered by the ledger");
    }
    const actionSequenceSpec = context.actionSequenceSpec;
    if (actionSequenceSpec) {
      push(errors, actionSequenceRef.id === actionSequenceSpec.actionSequenceId && actionSequenceRef.version === actionSequenceSpec.version && actionSequenceRef.contentHash === sha256Canonical(actionSequenceSpec), "Storyboard must bind the supplied exact ActionSequenceSpec identity, version and canonical hash");
      const knownBeatIds = new Set((actionSequenceSpec.beats || []).map((beat) => beat?.beatId));
      for (const beatId of selectedBeatIds) push(errors, knownBeatIds.has(beatId), "Storyboard selects unknown action beat " + beatId);
      for (const requirement of actionSequenceSpec.coverageRequirements || []) {
        if (!(requirement?.beatIds || []).every((beatId) => selectedBeatSet.has(beatId))) continue;
        const entry = coverageById.get(requirement.coverageId);
        push(errors, Boolean(entry), "Storyboard must include fully scoped ActionSequenceSpec coverage " + requirement.coverageId);
        if (entry) push(errors, sameStrings(entry.beatIds, requirement.beatIds), requirement.coverageId + ": storyboard coverage beats must match the ActionSequenceSpec requirement exactly");
      }
    }
    push(errors, payload?.validation?.actionCoverageComplete === true, "Action-scoped Storyboard must declare action coverage complete");
  } else {
    push(errors, selectedBeatIds.length === 0, "Storyboard without ActionSequenceSpec must not declare actionBeatIds");
    for (const shot of shots) push(errors, !Object.hasOwn(shot || {}, "actionBeatIds"), (shot?.shotId || "<unknown shot>") + ": actionBeatIds require a storyboard ActionSequenceSpec");
    push(errors, payload?.validation?.actionCoverageComplete === false, "Storyboard without ActionSequenceSpec must declare action coverage not applicable");
  }

  const knownShotSpecs = context.shotSpecs || [];
  if (knownShotSpecs.length > 0) {
    const shotSpecsByKey = new Map(knownShotSpecs.map((shotSpec) => [String(shotSpec?.shotSpecId) + "@" + String(shotSpec?.version), shotSpec]));
    for (const shot of shots) {
      const key = String(shot?.shotSpecRef?.id) + "@" + String(shot?.shotSpecRef?.version);
      const shotSpec = shotSpecsByKey.get(key);
      push(errors, Boolean(shotSpec), (shot?.shotId || "<unknown shot>") + ": storyboard ShotSpec ref is outside supplied validation context");
      if (shotSpec) push(errors, shot?.shotSpecRef?.contentHash === sha256Canonical(shotSpec), (shot?.shotId || "<unknown shot>") + ": storyboard ShotSpec ref must use the supplied canonical hash");
    }
  }

  const productionBindings = payload?.productionBindings;
  if (productionBindings) {
    const panels = productionBindings?.panels || [];
    const panelIds = panels.map((panel) => panel?.panelId);
    const panelShotIds = panels.map((panel) => panel?.shotId);
    const taskKeys = panels.map((panel) => String(panel?.recipeRunId) + "/" + String(panel?.taskId));
    const tileKeys = panels.map((panel) => String(panel?.regionId) + "/" + String(panel?.tileId));
    push(errors, productionBindings?.boardAssemblyPlanRef?.kind === "cineweave_codex_board_assembly_plan", "Storyboard production bindings must target BoardAssemblyPlan");
    push(errors, panels.length === shots.length, "Storyboard must bind exactly one production panel for every shot");
    push(errors, unique(panelIds), "Storyboard production panel IDs must be unique");
    push(errors, unique(panelShotIds), "Storyboard production panel shot IDs must be unique");
    push(errors, unique(taskKeys), "Storyboard production task bindings must be unique");
    push(errors, unique(tileKeys), "Storyboard production tile bindings must be unique");
    for (const panel of panels) {
      const label = panel?.panelId || "<unknown panel>";
      push(errors, shotIdSet.has(panel?.shotId), label + ": production panel references unknown storyboard shot");
      if (panel?.status !== "planned") push(errors, Boolean(panel?.executionReceiptRef), label + ": executed production panel requires an execution receipt");
      if (panel?.status === "accepted") push(errors, Boolean(panel?.evidenceBundleRef), label + ": accepted production panel requires evidence");
    }
    const boardAssemblyPlan = context.boardAssemblyPlan;
    if (boardAssemblyPlan) {
      const boardRef = productionBindings.boardAssemblyPlanRef;
      push(errors, boardRef?.id === boardAssemblyPlan.boardPlanId && boardRef?.version === boardAssemblyPlan.version && boardRef?.contentHash === sha256Canonical(boardAssemblyPlan), "Storyboard must bind the supplied exact BoardAssemblyPlan identity, version and canonical hash");
      const tilePlacements = new Set((boardAssemblyPlan.tilePlacements || []).map((placement) => String(placement?.recipeRunId) + "/" + String(placement?.taskId) + "/" + String(placement?.regionId) + "/" + String(placement?.tileId)));
      for (const panel of panels) push(errors, tilePlacements.has(String(panel?.recipeRunId) + "/" + String(panel?.taskId) + "/" + String(panel?.regionId) + "/" + String(panel?.tileId)), (panel?.panelId || "<unknown panel>") + ": production panel does not match a BoardAssemblyPlan tile");
    }
    push(errors, payload?.validation?.productionBindingsExact === true, "Storyboard with production bindings must declare them exact");
  } else {
    push(errors, payload?.validation?.productionBindingsExact === false, "Storyboard without production bindings must declare them unavailable");
  }
}

function validateStyleExplorationBrief(payload, errors) {
  for (const binding of payload?.referenceBindings || []) {
    const overlap = (binding?.transfer || []).filter((item) => (binding?.ignore || []).includes(item));
    push(errors, overlap.length === 0, "StyleExplorationBrief transfer and ignore directives must be disjoint");
  }
  push(errors, payload?.selectionPolicy?.onePrimaryAxisPerRound === true, "StyleExplorationBrief requires one primary axis per round");
  push(errors, payload?.selectionPolicy?.fixedCanonRequired === true, "StyleExplorationBrief must fix canon across options");
  push(errors, payload?.validation?.namedStyleIsAliasOnly === true, "StyleExplorationBrief named styles must remain aliases only");
  push(errors, payload?.validation?.staticReferenceDoesNotProveMotion === true, "StyleExplorationBrief cannot infer motion grammar from static references");
  push(errors, payload?.validation?.styleDoesNotOwnIdentity === true, "StyleExplorationBrief must keep style separate from identity");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "StyleExplorationBrief must not claim media generation");
}

function validateStyleOptionSet(payload, errors) {
  const options = payload?.options || [];
  push(errors, options.length >= 2 && options.length <= 6, "StyleOptionSet requires two to six options");
  push(errors, unique(options.map((item) => item?.optionId)), "StyleOptionSet option IDs must be unique");
  for (const option of options) push(errors, option?.primaryDelta?.axis === payload?.explorationAxis, `${option?.optionId}: primary style delta must match the exploration axis`);
  push(errors, payload?.selectionPolicy?.requiresHumanSelection === true, "StyleOptionSet requires human selection");
  push(errors, payload?.selectionPolicy?.onePrimaryDeltaPerOption === true, "StyleOptionSet requires one primary delta per option");
  push(errors, payload?.validation?.canonFixedAcrossOptions === true, "StyleOptionSet must keep canon fixed across options");
  push(errors, payload?.validation?.styleNotAutoActivated === true, "StyleOptionSet must not auto-activate a style");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "StyleOptionSet must not claim media generation");
}

function validateStylePreferenceFeedback(payload, errors) {
  const signals = payload?.signals || [];
  push(errors, unique(signals.map((item) => item?.signalId)), "StylePreferenceFeedback signal IDs must be unique");
  const scopes = new Set(signals.map((item) => item?.scope));
  push(errors, scopes.size === 1, "StylePreferenceFeedback must address one exploration axis per round");
  for (const signal of signals) if (signal?.type === "compare") {
    push(errors, nonEmpty(signal?.comparisonOptionId), `${signal?.signalId}: compare feedback requires comparisonOptionId`);
    push(errors, signal?.comparisonOptionId !== signal?.optionId, `${signal?.signalId}: comparison must name a different option`);
  }
  if (payload?.convergence?.nextAction === "draft_style_package") push(errors, (payload?.convergence?.selectedOptionIds || []).length > 0, "StylePreferenceFeedback needs a selection before drafting StylePackage");
  push(errors, payload?.convergence?.styleActivationRequested === false, "StylePreferenceFeedback cannot request automatic style activation");
  push(errors, payload?.policy?.namedStyleIsAliasOnly === true, "StylePreferenceFeedback named styles must remain aliases only");
  push(errors, payload?.policy?.noUniversalQualityScore === true, "StylePreferenceFeedback must prohibit universal style scores");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "StylePreferenceFeedback must not claim media generation");
}

function validateRepresentationBinding(payload, errors) {
  const mappings = payload?.mapping || [];
  push(errors, unique(mappings.map((item) => item?.mappingId)), "RepresentationBinding mapping IDs must be unique");
  push(errors, unique(mappings.map((item) => item?.scope)), "RepresentationBinding scopes must be mapped at most once");
  const globalAnchors = new Set(payload?.preserveSemanticAnchorIds || []);
  const globalOverlap = (payload?.allowedTransformations || []).filter((item) => (payload?.forbiddenTransformations || []).includes(item));
  push(errors, globalOverlap.length === 0, "RepresentationBinding global allow and forbid transformations must be disjoint");
  for (const mapping of mappings) {
    const overlap = (mapping?.allowedTransformations || []).filter((item) => (mapping?.forbiddenTransformations || []).includes(item));
    push(errors, overlap.length === 0, `${mapping?.mappingId}: allowed and forbidden transformations must be disjoint`);
    for (const anchor of mapping?.preserveAnchorIds || []) push(errors, globalAnchors.has(anchor), `${mapping?.mappingId}: mapping anchor ${anchor} must be globally preserved`);
  }
  if (payload?.status === "active") {
    push(errors, payload?.activationGate?.status === "approved", "Active RepresentationBinding requires an approved gate");
    push(errors, payload?.activationGate?.validationPassed === true, "Active RepresentationBinding requires passed validation");
    push(errors, isObject(payload?.activationGate?.approvalRef), "Active RepresentationBinding requires an exact approval ref");
  }
  push(errors, payload?.validation?.characterOwnsIdentity === true, "RepresentationBinding must keep identity owned by Character");
  push(errors, payload?.validation?.styleDoesNotMutateCanon === true, "RepresentationBinding cannot mutate canon");
  push(errors, payload?.validation?.noProviderWeights === true, "RepresentationBinding cannot contain provider weights");
  push(errors, payload?.executionBoundary?.containsProviderWeights === false, "RepresentationBinding execution boundary must exclude provider weights");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "RepresentationBinding must not claim media generation");
}

function validateStylePackage(payload, errors) {
  const atoms = payload?.atoms || [];
  const atomIds = atoms.map((item) => item?.atomId);
  push(errors, atoms.length > 0 && unique(atomIds), "StylePackage atom IDs must be present and unique");
  const knownAtoms = new Set(atomIds);
  for (const ref of payload?.recipe?.atomRefs || []) push(errors, knownAtoms.has(ref?.atomId), `StyleRecipe references unknown atom: ${ref?.atomId}`);
  push(errors, Array.isArray(payload?.semanticSpec?.visualDna) && payload.semanticSpec.visualDna.length > 0, "StylePackage requires visual DNA");
  push(errors, Array.isArray(payload?.semanticSpec?.temporalDna) && payload.semanticSpec.temporalDna.length > 0, "StylePackage requires temporal DNA");
  push(errors, Array.isArray(payload?.validationSuite?.cases) && payload.validationSuite.cases.length >= 2, "StylePackage requires positive and boundary validation cases");
  push(errors, payload?.activationGate?.humanApprovalRequired === true, "StylePackage activation requires a human gate");
  const representationFields = [payload?.representationModel, payload?.abstractionBudget, payload?.detailBudgetByScale, payload?.identityTranslationPolicy];
  if (representationFields.some((item) => item !== undefined)) {
    push(errors, representationFields.every((item) => item !== undefined), "StylePackage representation foundation fields must be supplied together");
    const dimensions = payload?.abstractionBudget?.dimensions || [];
    push(errors, unique(dimensions.map((item) => item?.dimension)), "StylePackage abstraction dimensions must be unique");
    const policy = payload?.identityTranslationPolicy;
    if (policy) {
      push(errors, policy?.requiresRepresentationBinding === true, "StylePackage identity translation requires RepresentationBinding");
      const overlap = (policy?.allow || []).filter((item) => (policy?.forbid || []).includes(item));
      push(errors, overlap.length === 0, "StylePackage identity translation allow and forbid rules must be disjoint");
    }
  }
  if (payload?.status === "active") {
    push(errors, payload?.activationGate?.status === "approved", "Active StylePackage requires approved activation gate");
    push(errors, payload?.activationGate?.rightsResolved === true, "Active StylePackage requires resolved rights");
    push(errors, payload?.activationGate?.validationPassed === true, "Active StylePackage requires passed validation");
    push(errors, representationFields.every((item) => item !== undefined), "Active StylePackage requires a complete representation model");
  }
  push(errors, payload?.executionBoundary?.generatesMedia === false, "StylePackage must not claim media generation");
}

function validateStyleReferencePlan(payload, errors) {
  const refs = payload?.references || [];
  push(errors, unique(refs.map((item) => item?.referenceId)), "StyleReferencePlan reference IDs must be unique");
  for (const ref of refs) {
    push(errors, Array.isArray(ref?.extract) && ref.extract.length > 0, `${ref?.referenceId}: extraction scope is required`);
    push(errors, Array.isArray(ref?.ignore) && ref.ignore.length > 0, `${ref?.referenceId}: ignore scope is required`);
    if (ref?.sourceType === "video") push(errors, ["camera_motion", "performance", "temporal_atmosphere"].includes(ref?.role), `${ref?.referenceId}: video reference must use a temporal role`);
  }
  push(errors, payload?.validation?.temporalRolesSeparated === true, "StyleReferencePlan must separate temporal roles");
}

function validateStyleCompile(payload, errors) {
  const channels = payload?.blocks || [];
  push(errors, unique(channels.map((item) => item?.channel)), "StyleCompile channels must be unique");
  push(errors, channels.every((item) => ["required", "strong", "supporting"].includes(item?.importance)), "StyleCompile blocks must use semantic importance");
  push(errors, !containsProviderWeightSyntax(channels), "StyleCompile directives must not contain provider-specific weight syntax");
  push(errors, payload?.validation?.identityNotOverwritten === true, "StyleCompile must preserve identity");
  push(errors, payload?.validation?.sceneNotOverwritten === true, "StyleCompile must preserve scene facts");
  push(errors, payload?.validation?.temporalSeparated === true, "StyleCompile must separate temporal directives");
  push(errors, payload?.validation?.providerNeutral === true, "StyleCompile must remain Provider-neutral");
  const variant = payload?.representationVariant;
  if (variant) {
    push(errors, isObject(payload?.representationBindingRef), "Representation variants require an exact RepresentationBinding");
    push(errors, variant?.separateCompileArtifact === true, "Representation variants must use a separate StyleCompile artifact");
    push(errors, variant?.identityTranslationBound === true, "Representation variants must bind identity translation");
    const protectedDomains = new Set(variant?.protectedDomains || []);
    for (const domain of ["character_identity", "character_appearance", "scene_geography", "physical_light"]) push(errors, protectedDomains.has(domain), `Representation variants must protect ${domain}`);
  }
  const realism = payload?.realismProfile;
  if (realism) {
    push(errors, realism?.calibration?.scale === "normalized_creative_intent", "StyleCompile realism scales must be normalized creative intent");
    push(errors, realism?.calibration?.providerNeutral === true, "StyleCompile realism profile must remain Provider-neutral");
    push(errors, realism?.calibration?.notQualityScore === true, "StyleCompile realism profile must not become a quality score");
    push(errors, realism?.calibration?.identityProtected === true, "StyleCompile realism profile must protect identity");
    push(errors, realism?.calibration?.materialStateProtected === true, "StyleCompile realism profile must protect material state");
    push(errors, realism?.calibration?.doesNotPromiseOutput === true, "StyleCompile realism profile must not promise output quality");
  }
  push(errors, payload?.executionBoundary?.generatesMedia === false, "StyleCompile must not claim media generation");
}

function validateStyleReview(payload, errors) {
  push(errors, unique((payload?.dimensions || []).map((item) => item?.dimensionId)), "StyleReview dimensions must be unique");
  push(errors, (payload?.candidateObservationIds || []).length > 0, "StyleReview requires candidate Observation IDs");
  if (payload?.decision?.nextAction === "repair") push(errors, nonEmpty(payload?.decision?.smallestRepairVariable), "StyleReview repair requires one smallest variable");
  push(errors, payload?.validation?.identityPreserved === true, "StyleReview must state identity preservation");
}

function validateCreativeBrief(payload, errors) {
  const stages = payload?.stagePlan || [];
  push(errors, stages.length > 0 && unique(stages.map((item) => item?.stageId)), "CreativeBrief stage IDs must be present and unique");
  push(errors, Array.isArray(payload?.locks?.hard) && Array.isArray(payload?.locks?.soft) && Array.isArray(payload?.locks?.free) && Array.isArray(payload?.locks?.undefined), "CreativeBrief requires four lock levels");
  push(errors, payload?.styleSelection?.temporalRequired !== undefined, "CreativeBrief must declare temporal style requirement");
  for (const item of payload?.missingHighImpact || []) push(errors, item?.impact === "high" || item?.impact === "medium", "CreativeBrief missing questions must be prioritized");
  push(errors, payload?.validation?.styleDoesNotOwnIdentity === true, "CreativeBrief must keep style separate from identity");
}

function validateWorkflowPlan(payload, errors) {
  const steps = payload?.steps || [];
  const stepIds = steps.map((item) => item?.stepId);
  push(errors, steps.length > 0 && unique(stepIds), "WorkflowPlan requires unique step IDs");
  const known = new Set(stepIds);
  for (const step of steps) {
    push(errors, step?.skill !== "cineweave", `${step?.stepId}: WorkflowPlan steps must target a specialist Skill`);
    push(errors, Array.isArray(step?.requires), `${step?.stepId}: WorkflowPlan requires must be an array`);
    push(errors, Array.isArray(step?.produces) && step.produces.length > 0, `${step?.stepId}: WorkflowPlan must declare produced contracts`);
    for (const dependency of step?.dependsOn || []) push(errors, known.has(dependency) && dependency !== step.stepId, `${step?.stepId}: WorkflowPlan has an unknown or self dependency`);
  }
  const visiting = new Set(); const visited = new Set();
  const lookup = new Map(steps.map((step) => [step.stepId, step]));
  const visit = (id) => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const dependency of lookup.get(id)?.dependsOn || []) if (!visit(dependency)) return false;
    visiting.delete(id); visited.add(id); return true;
  };
  for (const id of stepIds) push(errors, visit(id), "WorkflowPlan must be acyclic");
  for (const output of payload?.outputs || []) push(errors, known.has(output?.producer), "WorkflowPlan output producer must name a step");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "WorkflowPlan must not claim media generation");
  push(errors, payload?.executionBoundary?.requiresHumanApproval === true, "WorkflowPlan requires a human execution gate");
}

function validateStoryBrief(payload, errors) {
  push(errors, nonEmpty(payload?.dramaticQuestion), "StoryBrief requires one dramatic question");
  for (const key of ["want", "need", "fear", "contradiction"]) push(errors, nonEmpty(payload?.protagonist?.[key]), `StoryBrief protagonist.${key} is required`);
  push(errors, payload?.validation?.protagonistCausality === true, "StoryBrief must be protagonist-causal");
  push(errors, payload?.validation?.stakesEscalate === true, "StoryBrief stakes must escalate");
  push(errors, payload?.validation?.noShotDecisions === true, "StoryBrief cannot own shot decisions");
}

function validateBeatSheet(payload, errors) {
  const beats = payload?.beats || [];
  push(errors, unique(beats.map((item) => item?.beatId)), "BeatSheet beat IDs must be unique");
  beats.forEach((beat, index) => {
    push(errors, beat?.order === index + 1, `${beat?.beatId}: BeatSheet order must be contiguous`);
    for (const key of ["objective", "conflict", "choice", "change", "causesNext"]) push(errors, nonEmpty(beat?.[key]), `${beat?.beatId}: ${key} is required`);
  });
  const shares = beats.map((item) => item?.estimatedShare).filter((value) => typeof value === "number");
  if (shares.length === beats.length) push(errors, Math.abs(shares.reduce((a, b) => a + b, 0) - 1) <= 0.001, "BeatSheet estimated shares must total 1");
  push(errors, payload?.validation?.causal === true, "BeatSheet must declare causal structure");
}

function validateScriptScene(payload, errors) {
  const participantIds = new Set((payload?.participants || []).map((item) => item?.participantId));
  const beats = payload?.beats || [];
  beats.forEach((beat, index) => {
    push(errors, beat?.order === index + 1, `ScriptScene beat ${index + 1} order must be contiguous`);
    if (beat?.speakerId) push(errors, participantIds.has(beat.speakerId), `ScriptScene references unknown speaker ${beat.speakerId}`);
  });
  push(errors, payload?.entryState !== payload?.exitState, "ScriptScene exit state must differ from entry state");
  push(errors, payload?.validation?.noCameraDirections === true, "ScriptScene cannot own camera directions");
}

function validateContinuityLedger(payload, errors) {
  const entries = payload?.entries || [];
  push(errors, unique(entries.map((item) => item?.entryId)), "ContinuityLedger entry IDs must be unique");
  for (const entry of entries) push(errors, Array.isArray(entry?.sourceRefs) && entry.sourceRefs.length > 0, `${entry?.entryId}: continuity fact needs exact sources`);
  push(errors, payload?.validation?.noSilentOverwrite === true, "ContinuityLedger must prohibit silent overwrite");
  push(errors, payload?.validation?.blockingConflictsVisible === true, "ContinuityLedger must surface blocking conflicts");
}

function validatePerformanceTimeline(payload, errors) {
  const phases = payload?.phases || [];
  push(errors, unique(phases.map((item) => item?.phaseId)), "PerformanceTimeline phase IDs must be unique");
  let previousEnd = 0;
  for (const phase of phases) {
    push(errors, phase?.startSeconds >= previousEnd, `${phase?.phaseId}: phases overlap or are unordered`);
    push(errors, phase?.endSeconds > phase?.startSeconds, `${phase?.phaseId}: end must follow start`);
    push(errors, phase?.endSeconds <= payload?.durationSeconds, `${phase?.phaseId}: phase exceeds duration`);
    previousEnd = phase?.endSeconds;
  }
  push(errors, payload?.validation?.noCameraDirections === true, "PerformanceTimeline cannot own camera directions");
}

function validateSceneLightState(payload, errors) {
  const sources = payload?.sources || [];
  push(errors, unique(sources.map((item) => item?.sourceId)), "SceneLightState source IDs must be unique");
  for (const source of sources) {
    push(errors, nonEmpty(source?.positionAnchor) && nonEmpty(source?.direction), `${source?.sourceId}: source must be geography-bound`);
    push(errors, nonEmpty(source?.motivatedBy), `${source?.sourceId}: source must be motivated`);
  }
  push(errors, payload?.validation?.noPostprocessOwnership === true, "SceneLightState cannot own post-process treatment");
}

function validateStyleLightGrammar(payload, errors) {
  push(errors, payload?.validation?.noPhysicalSourcePlacement === true, "StyleLightGrammar cannot place physical sources");
  push(errors, payload?.validation?.noGeographyOwnership === true, "StyleLightGrammar cannot own geography");
  push(errors, payload?.validation?.visualTemporalSeparated === true, "StyleLightGrammar must separate visual and temporal behavior");
}

function validateActionSequenceSpec(payload, errors) {
  const participants = payload?.participants || [];
  const participantIds = participants.map((item) => item?.participantId);
  const knownParticipants = new Set(participantIds);
  const weaponProfiles = payload?.weaponProfiles || [];
  const weaponIds = weaponProfiles.map((item) => item?.weaponId);
  const knownWeapons = new Set(weaponIds);
  const zones = new Set(payload?.geography?.activeZoneIds || []);
  const beats = payload?.beats || [];
  const beatIds = beats.map((item) => item?.beatId);
  const knownBeats = new Set(beatIds);
  const coverage = payload?.coverageRequirements || [];
  const coverageIds = coverage.map((item) => item?.coverageId);
  const coverageById = new Map(coverage.map((item) => [item?.coverageId, item]));
  const risks = payload?.riskRegister || [];
  const riskIds = risks.map((item) => item?.riskId);
  const riskById = new Map(risks.map((item) => [item?.riskId, item]));

  push(errors, unique(participantIds), "ActionSequenceSpec participant IDs must be unique");
  push(errors, unique(weaponIds), "ActionSequenceSpec weapon IDs must be unique");
  push(errors, payload?.bindings?.scene?.kind === "scene_binding", "ActionSequenceSpec must bind an exact SceneBinding");
  for (const ref of payload?.bindings?.interactionConstraints || []) push(errors, ref?.kind === "cineweave_codex_interaction_constraint_set", "ActionSequenceSpec interaction refs must target InteractionConstraintSet");
  for (const participant of participants) {
    push(errors, participant?.characterBindingRef?.kind === "character_binding", `${participant?.participantId}: participant must bind CharacterBinding`);
    if (participant?.performanceTimelineRef) push(errors, participant.performanceTimelineRef.kind === "cineweave_codex_performance_timeline", `${participant?.participantId}: performance ref must target PerformanceTimeline`);
    push(errors, zones.has(participant?.entryZoneId), `${participant?.participantId}: unknown entry zone ${participant?.entryZoneId}`);
    push(errors, zones.has(participant?.exitZoneId), `${participant?.participantId}: unknown exit zone ${participant?.exitZoneId}`);
  }
  for (const weapon of weaponProfiles) {
    push(errors, knownParticipants.has(weapon?.ownerParticipantId), `${weapon?.weaponId}: unknown weapon owner ${weapon?.ownerParticipantId}`);
    push(errors, nonEmpty(weapon?.name) && nonEmpty(weapon?.type), `${weapon?.weaponId}: weapon name and type are required`);
    push(errors, Array.isArray(weapon?.characteristics) && weapon.characteristics.length > 0, `${weapon?.weaponId}: weapon characteristics are required`);
    push(errors, nonEmpty(weapon?.combatFunction), `${weapon?.weaponId}: weapon combat function is required`);
    push(errors, nonEmpty(weapon?.initialState) && nonEmpty(weapon?.continuityRule), `${weapon?.weaponId}: weapon state and continuity rule are required`);
  }

  for (const path of payload?.geography?.movementPaths || []) {
    push(errors, zones.has(path?.fromZoneId), `${path?.pathRef}: unknown path start zone ${path?.fromZoneId}`);
    push(errors, zones.has(path?.toZoneId), `${path?.pathRef}: unknown path end zone ${path?.toZoneId}`);
  }
  for (const use of payload?.geography?.environmentUses || []) for (const beatId of use?.beatIds || []) push(errors, knownBeats.has(beatId), `${use?.anchorRef}: unknown action beat ${beatId}`);

  push(errors, unique(beatIds), "ActionSequenceSpec beat IDs must be unique");
  push(errors, unique(coverageIds), "ActionSequenceSpec coverage IDs must be unique");
  push(errors, unique(riskIds), "ActionSequenceSpec risk IDs must be unique");
  const eventIds = [];
  const eventById = new Map();
  const exchangeIds = [];
  for (const [index, beat] of beats.entries()) {
    push(errors, beat?.order === index + 1, `ActionSequenceSpec beat order must be contiguous at ${beat?.beatId}`);
    const beatEventIds = new Set();
    for (const event of beat?.actions || []) {
      eventIds.push(event?.eventId);
      beatEventIds.add(event?.eventId);
      eventById.set(event?.eventId, { beat, event });
      push(errors, knownParticipants.has(event?.participantId), `${event?.eventId}: unknown participant ${event?.participantId}`);
      push(errors, zones.has(event?.fromZoneId), `${event?.eventId}: unknown start zone ${event?.fromZoneId}`);
      push(errors, zones.has(event?.toZoneId), `${event?.eventId}: unknown end zone ${event?.toZoneId}`);
      push(errors, Array.isArray(event?.constraintRefs) && event.constraintRefs.length > 0, `${event?.eventId}: observable action must cite at least one interaction or support constraint`);
      if (event?.weaponRef) {
        const weapon = weaponProfiles.find((item) => item?.weaponId === event.weaponRef);
        push(errors, knownWeapons.has(event.weaponRef), `${event?.eventId}: unknown weapon ${event?.weaponRef}`);
        if (weapon && event?.propRef) push(errors, event.propRef === weapon.propRef, `${event?.eventId}: propRef must match its weapon profile`);
      }
      if (event?.exchangeRole) push(errors, Boolean(event?.exchangeId), `${event?.eventId}: exchangeRole requires exchangeId`);
      if (event?.responseToEventId) push(errors, event.responseToEventId !== event.eventId, `${event?.eventId}: action cannot respond to itself`);
    }
    if (beat?.exchange) {
      const exchange = beat.exchange;
      exchangeIds.push(exchange.exchangeId);
      push(errors, exchange.participantIds.every((id) => knownParticipants.has(id)), `${exchange.exchangeId}: unknown exchange participant`);
      push(errors, unique(exchange.sequence.map((step) => step?.eventId)), `${exchange.exchangeId}: exchange event IDs must be unique`);
      let lastStep = 0;
      for (const step of exchange.sequence || []) {
        push(errors, step?.step === lastStep + 1, `${exchange.exchangeId}: exchange steps must be contiguous`);
        lastStep = step?.step;
        const event = eventById.get(step?.eventId)?.event;
        push(errors, beatEventIds.has(step?.eventId), `${exchange.exchangeId}: step references an event outside its beat`);
        push(errors, Boolean(event), `${exchange.exchangeId}: unknown exchange event ${step?.eventId}`);
        push(errors, knownParticipants.has(step?.participantId), `${exchange.exchangeId}: unknown step participant ${step?.participantId}`);
        if (event) {
          push(errors, event.participantId === step.participantId, `${step?.eventId}: exchange participant must match action participant`);
          push(errors, event.exchangeId === exchange.exchangeId, `${step?.eventId}: action exchangeId must match beat exchange`);
          push(errors, event.exchangeRole === step.role, `${step?.eventId}: exchange role must match action exchangeRole`);
        }
        push(errors, exchange.participantIds.includes(step?.participantId), `${step?.eventId}: step participant must belong to the exchange`);
      }
    }
    for (const coverageId of beat?.coverageRequirementIds || []) {
      const item = coverageById.get(coverageId);
      push(errors, Boolean(item), `${beat?.beatId}: unknown coverage requirement ${coverageId}`);
      if (item) push(errors, item.beatIds.includes(beat.beatId), `${beat?.beatId}: coverage ${coverageId} must link back to the beat`);
    }
    for (const riskId of beat?.riskIds || []) {
      const item = riskById.get(riskId);
      push(errors, Boolean(item), `${beat?.beatId}: unknown risk ${riskId}`);
      if (item) push(errors, item.beatIds.includes(beat.beatId), `${beat?.beatId}: risk ${riskId} must link back to the beat`);
    }
  }
  push(errors, unique(eventIds), "ActionSequenceSpec event IDs must be unique");
  push(errors, unique(exchangeIds), "ActionSequenceSpec exchange IDs must be unique");
  for (const beat of beats) for (const event of beat?.actions || []) {
    if (event?.responseToEventId) {
      const response = eventById.get(event.responseToEventId);
      push(errors, Boolean(response), `${event?.eventId}: unknown response event ${event.responseToEventId}`);
      if (response) push(errors, response.beat.order <= beat.order, `${event?.eventId}: response event must not occur after the action`);
    }
  }

  const promptHandoff = payload?.promptHandoff;
  if (promptHandoff) {
    const blocks = promptHandoff.orderedBlocks || [];
    push(errors, unique(blocks), "ActionSequenceSpec prompt handoff blocks must be unique");
    if (promptHandoff.mode === "fight_specific") {
      for (const block of ["weapon_profile", "technique", "trajectory", "exchange", "contact_result"]) {
        push(errors, blocks.includes(block), `ActionSequenceSpec fight prompt handoff must include ${block}`);
      }
      for (const beat of beats) for (const event of beat?.actions || []) if (event?.exchangeRole) {
        push(errors, nonEmpty(event?.techniqueMechanics), `${event?.eventId}: fight exchange action requires technique mechanics`);
        push(errors, isObject(event?.trajectory), `${event?.eventId}: fight exchange action requires an explicit trajectory`);
        push(errors, isObject(event?.contact), `${event?.eventId}: fight exchange action requires contact or near-miss state`);
      }
    }
  }

  for (const check of payload?.physicalChecks || []) {
    for (const beatId of check?.beatIds || []) push(errors, knownBeats.has(beatId), `${check?.checkId}: unknown action beat ${beatId}`);
    if (check?.basis !== "declared_assumption") push(errors, Boolean(check?.basisRef), `${check?.checkId}: non-assumption physical check requires an exact basis ref`);
  }
  for (const item of coverage) for (const beatId of item?.beatIds || []) push(errors, knownBeats.has(beatId), `${item?.coverageId}: unknown action beat ${beatId}`);

  const tracks = payload?.continuityTracks || [];
  push(errors, unique(tracks.map((item) => item?.trackId)), "ActionSequenceSpec continuity track IDs must be unique");
  for (const track of tracks) {
    let lastOrder = 0;
    for (const change of track?.changes || []) {
      const beat = beats.find((item) => item?.beatId === change?.beatId);
      push(errors, Boolean(beat), `${track?.trackId}: unknown continuity beat ${change?.beatId}`);
      if (beat) {
        push(errors, beat.order > lastOrder, `${track?.trackId}: continuity changes must follow beat order`);
        lastOrder = beat.order;
      }
    }
    const finalChange = track?.changes?.at(-1);
    push(errors, finalChange?.state === track?.exitState, `${track?.trackId}: exit state must equal the final continuity change`);
  }

  for (const risk of risks) {
    for (const beatId of risk?.beatIds || []) push(errors, knownBeats.has(beatId), `${risk?.riskId}: unknown action beat ${beatId}`);
    if (["high", "critical"].includes(risk?.severity)) {
      push(errors, risk?.requiresQualifiedReview === true, `${risk?.riskId}: high or critical risk requires qualified review`);
      push(errors, risk?.status === "requires_review", `${risk?.riskId}: high or critical risk must remain in requires_review state`);
    }
  }
  if (payload?.handoff?.shotBreakdownReady === true) push(errors, (payload?.handoff?.blockers || []).length === 0, "ActionSequenceSpec cannot be ready for shot breakdown with blockers");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "ActionSequenceSpec must not claim media generation");
  push(errors, payload?.executionBoundary?.constitutesStuntSafetyApproval === false, "ActionSequenceSpec cannot constitute stunt-safety approval");
  push(errors, payload?.validation?.cameraDetailsDeferred === true, "ActionSequenceSpec must defer lens and exact camera curves to shot contracts");
  push(errors, payload?.validation?.performanceNotRewritten === true, "ActionSequenceSpec must preserve Character-owned performance");
  push(errors, payload?.validation?.storyCausalityNotInvented === true, "ActionSequenceSpec must preserve Story-owned causality");
}

function validateShotSpec(payload, errors, actionSequenceSpec) {
  const characterIds = new Set((payload?.bindings?.characters || []).map((item) => item?.id));
  for (const item of payload?.blocking || []) if (characterIds.size) push(errors, characterIds.has(item?.subjectRef), `ShotSpec blocking references unknown subject ${item?.subjectRef}`);
  if (payload?.actionSequenceRef) {
    push(errors, payload.actionSequenceRef.kind === "cineweave_codex_action_sequence_spec", "ShotSpec actionSequenceRef must target ActionSequenceSpec");
    push(errors, Array.isArray(payload?.actionBeatIds) && payload.actionBeatIds.length > 0 && unique(payload.actionBeatIds), "ShotSpec actionBeatIds must be a non-empty unique selection");
    if (actionSequenceSpec) {
      push(errors, payload.actionSequenceRef.id === actionSequenceSpec.actionSequenceId && payload.actionSequenceRef.version === actionSequenceSpec.version && payload.actionSequenceRef.contentHash === sha256Canonical(actionSequenceSpec), "ShotSpec must bind the supplied exact ActionSequenceSpec identity, version and canonical hash");
      const knownActionBeats = new Set((actionSequenceSpec.beats || []).map((item) => item?.beatId));
      for (const beatId of payload?.actionBeatIds || []) push(errors, knownActionBeats.has(beatId), `ShotSpec selects unknown action beat ${beatId}`);
    }
  }
  const actionBreakdown = payload?.promptHandoff?.actionBreakdown;
  if (actionBreakdown) {
    push(errors, Boolean(payload?.actionSequenceRef && Array.isArray(payload?.actionBeatIds) && payload.actionBeatIds.length > 0), "ShotSpec actionBreakdown requires selected ActionSequenceSpec beats");
    if (actionSequenceSpec) {
      const knownWeapons = new Set((actionSequenceSpec.weaponProfiles || []).map((item) => item?.weaponId));
      const profiles = new Map((actionSequenceSpec.weaponProfiles || []).map((item) => [item?.weaponId, item]));
      for (const weapon of actionBreakdown.weaponDetails || []) {
        push(errors, knownWeapons.has(weapon?.weaponRef), `ShotSpec actionBreakdown references unknown weapon ${weapon?.weaponRef}`);
        const profile = profiles.get(weapon?.weaponRef);
        if (profile) {
          push(errors, weapon.name === profile.name, `ShotSpec actionBreakdown weapon name must match ${weapon?.weaponRef}`);
          push(errors, weapon.type === profile.type, `ShotSpec actionBreakdown weapon type must match ${weapon?.weaponRef}`);
        }
      }
    }
  }
  push(errors, !Object.hasOwn(payload || {}, "lightingPlanRef"), "ShotSpec cannot back-reference downstream ShotLightingPlan");
  push(errors, !Object.hasOwn(payload || {}, "temporalSpecRef"), "ShotSpec cannot back-reference downstream TemporalSpec");
  push(errors, nonEmpty(payload?.camera?.movementIntent), "ShotSpec needs a motivated movement intent, including static");
  push(errors, payload?.validation?.oneDominantCameraIdea === true, "ShotSpec requires one dominant camera idea");
  push(errors, payload?.validation?.axisCoherent === true, "ShotSpec must preserve axis coherence");
}

function validateShotDependency(ref, shotSpec, label, errors) {
  push(errors, ref?.kind === "cineweave_codex_shot_spec", `${label} shotSpecRef must target ShotSpec`);
  if (!shotSpec) return;
  push(errors, ref?.id === shotSpec?.shotSpecId, `${label} must bind the supplied ShotSpec identity`);
  push(errors, ref?.version === shotSpec?.version, `${label} must bind the supplied ShotSpec version`);
  push(errors, ref?.contentHash === sha256Canonical(shotSpec), `${label} must bind the supplied ShotSpec content hash`);
}

function validateShotLightingPlan(payload, errors, sceneLightState, shotSpec) {
  validateShotDependency(payload?.shotSpecRef, shotSpec, "ShotLightingPlan", errors);
  const known = new Set((sceneLightState?.sources || []).map((item) => item?.sourceId));
  const uses = [payload?.key, payload?.fill, payload?.rim, ...(payload?.practicals || [])].filter(Boolean);
  if (known.size) for (const use of uses) push(errors, known.has(use?.sourceId), "ShotLightingPlan uses unknown source " + use?.sourceId);
  if (payload?.contractVersion === "2.5.0") {
    for (const use of uses) {
      const transport = use?.transport;
      push(errors, ["direct", "bounce", "transmitted"].includes(transport), "ShotLightingPlan 2.5 light use must declare direct, bounce or transmitted transport");
      if (["bounce", "transmitted"].includes(transport)) {
        push(errors, nonEmpty(use?.viaSurfaceAnchor), "ShotLightingPlan 2.5 bounced or transmitted light requires a physical viaSurfaceAnchor");
      }
      if (transport === "direct") {
        push(errors, !Object.hasOwn(use || {}, "viaSurfaceAnchor"), "ShotLightingPlan 2.5 direct light must not invent a bounce surface");
      }
    }
    push(errors, payload?.validation?.fillIntentional === true, "ShotLightingPlan 2.5 must make the fill or no-fill decision explicit");
  }
  push(errors, payload?.validation?.stylePhysicalSeparated === true, "ShotLightingPlan must separate style from physical sources");
  push(errors, payload?.validation?.continuityBound === true, "ShotLightingPlan must bind continuity");
}

function validateHeroFrameAnchor(payload, errors, context = {}) {
  const shotSpec = context?.shotSpec;
  const heroFrameRef = payload?.heroFrameRef;
  const sourceSelection = payload?.sourceSelection || {};
  const bindingRefs = payload?.bindingRefs || {};
  const camera = payload?.visualDna?.camera || {};
  const inheritance = payload?.inheritancePolicy || {};
  const lockedPaths = inheritance.lockedPaths || [];
  const preserved = new Set(inheritance.preserve || []);
  const allowedOverrides = inheritance.allowOverrides || [];

  push(errors, isExactContractRef(heroFrameRef, ["cineweave_codex_reference_asset", "cineweave_codex_media_import"]), "HeroFrameAnchor heroFrameRef must be an exact ReferenceAsset or MediaImport");
  if (heroFrameRef?.kind === "cineweave_codex_reference_asset") {
    push(errors, sourceSelection.mode === "whole_asset", "HeroFrameAnchor ReferenceAsset must use whole_asset source selection");
  }
  if (heroFrameRef?.kind === "cineweave_codex_media_import") {
    push(errors, ["frame_index", "time_seconds"].includes(sourceSelection.mode), "HeroFrameAnchor MediaImport must select one frame");
  }

  validateShotDependency(payload?.shotSpecRef, shotSpec, "HeroFrameAnchor", errors);
  const characterRefs = bindingRefs.characterRefs || [];
  push(errors, characterRefs.every((ref) => isExactContractRef(ref, ["character_binding"])), "HeroFrameAnchor character bindings must be exact CharacterBinding refs");
  if (bindingRefs.sceneRef) push(errors, isExactContractRef(bindingRefs.sceneRef, ["scene_binding"]), "HeroFrameAnchor sceneRef must be an exact SceneBinding ref");
  if (bindingRefs.appearanceStateRef) push(errors, isExactContractRef(bindingRefs.appearanceStateRef, ["cineweave_codex_character_appearance_state"]), "HeroFrameAnchor appearanceStateRef must be an exact CharacterAppearanceState ref");
  if (bindingRefs.referenceBindingSetRef) push(errors, isExactContractRef(bindingRefs.referenceBindingSetRef, ["cineweave_codex_reference_binding_set"]), "HeroFrameAnchor referenceBindingSetRef must be an exact ReferenceBindingSet ref");

  if (shotSpec) {
    const expectedCharacters = shotSpec?.bindings?.characters || [];
    const actualCharacterKeys = characterRefs.map(exactRefKey);
    const expectedCharacterKeys = expectedCharacters.map(exactRefKey);
    push(errors, actualCharacterKeys.length === expectedCharacterKeys.length && actualCharacterKeys.every((key) => expectedCharacterKeys.includes(key)), "HeroFrameAnchor character bindings must exactly match the ShotSpec");
    if (shotSpec?.bindings?.scene) push(errors, sameExactRef(bindingRefs.sceneRef, shotSpec.bindings.scene), "HeroFrameAnchor sceneRef must exactly match the ShotSpec scene binding");
    else push(errors, !Object.hasOwn(bindingRefs, "sceneRef"), "HeroFrameAnchor must not invent a scene binding absent from the ShotSpec");
    push(errors, Math.abs(camera.focalLengthMm - shotSpec?.camera?.focalLengthMm) <= 1e-9, "HeroFrameAnchor focal length must match the ShotSpec");
    push(errors, camera.focusTarget === shotSpec?.camera?.focusTarget, "HeroFrameAnchor focus target must match the ShotSpec");
    push(errors, camera.axisSide === shotSpec?.camera?.axisSide, "HeroFrameAnchor axis side must match the ShotSpec");
  }

  if (payload?.cameraPrevisRef) push(errors, isExactContractRef(payload.cameraPrevisRef, ["cineweave_codex_camera_previs_spec"]), "HeroFrameAnchor cameraPrevisRef must be an exact CameraPrevisSpec ref");
  if (payload?.shotLightingPlanRef) push(errors, isExactContractRef(payload.shotLightingPlanRef, ["cineweave_codex_shot_lighting_plan"]), "HeroFrameAnchor shotLightingPlanRef must be an exact ShotLightingPlan ref");
  if (payload?.styleCompileRef) push(errors, isExactContractRef(payload.styleCompileRef, ["cineweave_codex_style_compile"]), "HeroFrameAnchor styleCompileRef must be an exact StyleCompile ref");
  if (payload?.cameraPrevisRef && context?.cameraPrevisSpec) {
    const cameraPrevis = context.cameraPrevisSpec;
    push(errors, payload.cameraPrevisRef.id === cameraPrevis.cameraPrevisSpecId && payload.cameraPrevisRef.version === cameraPrevis.version && payload.cameraPrevisRef.contentHash === sha256Canonical(cameraPrevis), "HeroFrameAnchor must bind the supplied exact CameraPrevisSpec");
    push(errors, sameExactRef(cameraPrevis.shotSpecRef, payload.shotSpecRef), "HeroFrameAnchor CameraPrevisSpec must share the exact ShotSpec dependency");
  }
  if (payload?.shotLightingPlanRef && context?.shotLightingPlan) {
    const shotLightingPlan = context.shotLightingPlan;
    push(errors, payload.shotLightingPlanRef.id === shotLightingPlan.lightingPlanId && payload.shotLightingPlanRef.version === shotLightingPlan.version && payload.shotLightingPlanRef.contentHash === sha256Canonical(shotLightingPlan), "HeroFrameAnchor must bind the supplied exact ShotLightingPlan");
    push(errors, sameExactRef(shotLightingPlan.shotSpecRef, payload.shotSpecRef), "HeroFrameAnchor ShotLightingPlan must share the exact ShotSpec dependency");
  }

  push(errors, unique(allowedOverrides), "HeroFrameAnchor allowOverrides must be unique");
  const forbiddenOverridePrefixes = ["character_identity", "scene_geography", "bindings.characters", "bindings.scene", "visualDna.appearance.identitySummary"];
  for (const path of allowedOverrides) {
    push(errors, !forbiddenOverridePrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`)), `HeroFrameAnchor cannot override locked identity or geography path ${path}`);
  }
  const lockedPathIds = lockedPaths.map((item) => item?.path);
  push(errors, unique(lockedPathIds), "HeroFrameAnchor locked path IDs must be unique");
  for (const requiredPath of ["character_identity", "scene_geography"]) {
    const lock = lockedPaths.find((item) => item?.path === requiredPath);
    push(errors, lock?.level === "hard", `HeroFrameAnchor must hard-lock ${requiredPath}`);
  }
  for (const requiredPreserved of ["character_identity", "scene_geography", "camera", "composition"]) {
    push(errors, preserved.has(requiredPreserved), `HeroFrameAnchor inheritance must preserve ${requiredPreserved}`);
  }
  push(errors, containsProviderWeightSyntax(payload?.visualDna) === false, "HeroFrameAnchor visual DNA must not contain provider weight syntax");
  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    generatesMedia: false,
    executesAdapter: false,
    mutatesCanon: false,
    humanApprovalRequired: true
  })) push(errors, payload?.executionBoundary?.[key] === expected, `HeroFrameAnchor execution boundary.${key} is unsafe`);
  for (const key of ["exactHeroFrameRef", "exactShotSpecRef", "visualDnaProviderNeutral", "inheritanceExplicit", "identityCannotBeOverridden", "geographyCannotBeOverridden", "cameraCompositionSeparated", "noMediaGeneration"]) {
    push(errors, payload?.validation?.[key] === true, `HeroFrameAnchor validation.${key} must be true`);
  }
}

function validateAssetAliasRegistry(payload, errors) {
  const acceptedKinds = [
    "cineweave_codex_reference_asset",
    "cineweave_codex_reference_observation",
    "cineweave_codex_reference_binding_set",
    "character_binding",
    "scene_binding",
    "cineweave_codex_style_compile"
  ];
  const aliases = payload?.aliases || [];
  const targetKinds = payload?.scope?.targetContractKinds || [];
  const normalizedAliases = aliases.map((item) => item?.normalizedAlias);
  const aliasText = JSON.stringify({ scope: payload?.scope, aliases });

  push(errors, unique(normalizedAliases), "AssetAliasRegistry aliases must be unique after normalization");
  push(errors, unique(targetKinds) && targetKinds.every((kind) => acceptedKinds.includes(kind)), "AssetAliasRegistry scope target kinds must be unique and supported");
  for (const entry of aliases) {
    const alias = entry?.alias;
    push(errors, typeof alias === "string" && /^@[^\s@]{1,120}$/.test(alias), "AssetAliasRegistry aliases must use a bounded @alias form");
    push(errors, typeof alias === "string" && alias !== "@latest", "AssetAliasRegistry must reserve @latest rather than treating it as an exact alias");
    push(errors, typeof alias === "string" && typeof alias.normalize === "function" && alias.normalize("NFC") === alias, `AssetAliasRegistry alias ${alias || "<unknown>"} must be NFC-normalized`);
    push(errors, entry?.normalizedAlias === alias, `AssetAliasRegistry alias ${alias || "<unknown>"} must equal its normalizedAlias`);
    push(errors, entry?.status === "resolved", `AssetAliasRegistry alias ${alias || "<unknown>"} must have resolved status`);
    push(errors, isExactContractRef(entry?.targetRef, acceptedKinds), `AssetAliasRegistry alias ${alias || "<unknown>"} must target one exact supported contract ref`);
    if (entry?.targetRef?.kind) push(errors, targetKinds.includes(entry.targetRef.kind), `AssetAliasRegistry alias ${alias || "<unknown>"} targets a kind outside its scope`);
  }
  push(errors, !/(?:file:\/\/|https?:\/\/|[A-Za-z]:[\\/]|\\\\|localhost|signedUrl|presigned)/i.test(aliasText), "AssetAliasRegistry must not contain private locators or URLs");
  push(errors, containsProviderWeightSyntax(aliases) === false, "AssetAliasRegistry must not contain provider weight syntax");

  for (const [key, expected] of Object.entries({
    mode: "declared_map_only",
    exactRefsOnly: true,
    allowLatest: false,
    inferFromPrompt: false,
    crossScopeResolution: false,
    executesProvider: false
  })) push(errors, payload?.resolutionPolicy?.[key] === expected, `AssetAliasRegistry resolutionPolicy.${key} is unsafe`);
  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    resolvesReferencesOnly: true,
    generatesMedia: false,
    executesAdapter: false,
    mutatesCanon: false,
    writesFiles: false,
    humanApprovalRequired: true
  })) push(errors, payload?.executionBoundary?.[key] === expected, `AssetAliasRegistry execution boundary.${key} is unsafe`);
  for (const key of ["aliasesUnique", "aliasesNfcNormalized", "exactTargetRefs", "noLatestResolution", "noInference", "noProviderSyntax", "noPrivateLocators", "noCanonMutation", "noExecution"]) {
    push(errors, payload?.validation?.[key] === true, `AssetAliasRegistry validation.${key} must be true`);
  }
}

function validateSequenceRhythmSpec(payload, errors, context = {}) {
  const storyboard = context?.storyboard;
  const timebase = payload?.timebase || {};
  const policy = payload?.shotDurationPolicy || {};
  const windows = payload?.shotWindows || [];
  const phases = payload?.tempoPhases || [];
  const breathingPoints = payload?.breathingPoints || [];
  const transitions = payload?.transitions || [];
  const storyboardShotIds = (storyboard?.shots || []).map((shot) => shot?.shotId);
  const windowShotIds = windows.map((window) => window?.shotId);

  push(errors, isExactContractRef(payload?.storyboardRef, ["cineweave_codex_storyboard_sequence"]), "SequenceRhythmSpec storyboardRef must be an exact Storyboard ref");
  if (storyboard) {
    push(errors, payload.storyboardRef.id === storyboard.storyboardId && payload.storyboardRef.version === storyboard.version && payload.storyboardRef.contentHash === sha256Canonical(storyboard), "SequenceRhythmSpec must bind the supplied exact Storyboard");
  }
  push(errors, Number.isSafeInteger(timebase.numerator) && Number.isSafeInteger(timebase.denominator) && timebase.numerator > 0 && timebase.denominator > 0 && greatestCommonDivisor(timebase.numerator, timebase.denominator) === 1, "SequenceRhythmSpec timebase must be a positive reduced rational");
  push(errors, timebase.unit === "frames" && timebase.frameIndexOrigin === 0, "SequenceRhythmSpec timebase must use zero-based integer frames");
  push(errors, Number.isSafeInteger(policy.minimumFrames) && Number.isSafeInteger(policy.preferredFrames) && Number.isSafeInteger(policy.maximumFrames) && policy.minimumFrames <= policy.preferredFrames && policy.preferredFrames <= policy.maximumFrames, "SequenceRhythmSpec shot duration policy must be ordered");

  push(errors, unique(windowShotIds), "SequenceRhythmSpec shot windows must contain each shot at most once");
  let previousEnd = -1;
  for (const [index, window] of windows.entries()) {
    push(errors, window?.order === index + 1, `SequenceRhythmSpec shot window ${window?.shotId || "<unknown>"} order must be contiguous`);
    push(errors, Number.isSafeInteger(window?.startFrame) && Number.isSafeInteger(window?.endFrame) && window.endFrame > window.startFrame, `SequenceRhythmSpec shot window ${window?.shotId || "<unknown>"} must have a positive inclusive range`);
    if (index === 0) push(errors, window?.startFrame === 0, "SequenceRhythmSpec must start at frame zero");
    else push(errors, window?.startFrame === previousEnd + 1, `SequenceRhythmSpec shot window ${window?.shotId || "<unknown>"} must be contiguous with the previous window`);
    const duration = window?.endFrame - window?.startFrame + 1;
    push(errors, duration >= policy.minimumFrames && duration <= policy.maximumFrames, `SequenceRhythmSpec shot window ${window?.shotId || "<unknown>"} must fit the duration policy`);
    previousEnd = window?.endFrame;
  }
  if (storyboard) {
    push(errors, unique(storyboardShotIds) && windowShotIds.length === storyboardShotIds.length && windowShotIds.every((shotId) => storyboardShotIds.includes(shotId)), "SequenceRhythmSpec shot windows must cover every Storyboard shot exactly once");
  }

  const phaseIds = phases.map((phase) => phase?.phaseId);
  const phaseShotIds = phases.flatMap((phase) => phase?.shotIds || []);
  push(errors, unique(phaseIds), "SequenceRhythmSpec phase IDs must be unique");
  push(errors, unique(phaseShotIds), "SequenceRhythmSpec phases must assign each shot to one phase");
  for (const [index, phase] of phases.entries()) {
    push(errors, phase?.order === index + 1, `SequenceRhythmSpec phase ${phase?.phaseId || "<unknown>"} order must be contiguous`);
    for (const shotId of phase?.shotIds || []) push(errors, windowShotIds.includes(shotId), `SequenceRhythmSpec phase references unknown shot ${shotId}`);
  }
  push(errors, phaseShotIds.length === windowShotIds.length && phaseShotIds.every((shotId) => windowShotIds.includes(shotId)), "SequenceRhythmSpec phase coverage must close over shot windows");

  const windowByShotId = new Map(windows.map((window) => [window?.shotId, window]));
  const breathingKeys = breathingPoints.map((point) => `${point?.shotId}@${point?.frame}`);
  push(errors, unique(breathingKeys), "SequenceRhythmSpec breathing points must be unique");
  for (const point of breathingPoints) {
    const window = windowByShotId.get(point?.shotId);
    push(errors, Boolean(window), `SequenceRhythmSpec breathing point references unknown shot ${point?.shotId}`);
    if (window) push(errors, point.frame >= window.startFrame && point.frame <= window.endFrame, `SequenceRhythmSpec breathing point for ${point.shotId} must stay within its shot window`);
  }

  push(errors, transitions.length === Math.max(0, windows.length - 1), "SequenceRhythmSpec must declare one transition for every adjacent shot pair");
  for (const [index, transition] of transitions.entries()) {
    push(errors, transition?.fromShotId === windows[index]?.shotId && transition?.toShotId === windows[index + 1]?.shotId, "SequenceRhythmSpec transitions must follow adjacent shot windows");
    push(errors, transition?.fromShotId !== transition?.toShotId, "SequenceRhythmSpec transitions cannot loop a shot onto itself");
  }
  for (const [key, expected] of Object.entries({
    preserveScreenDirection: true,
    stableEndStates: true,
    shotOrderLocked: true
  })) push(errors, payload?.continuity?.[key] === expected, `SequenceRhythmSpec continuity.${key} must be true`);
  push(errors, containsProviderWeightSyntax(payload) === false, "SequenceRhythmSpec must not contain provider weight syntax");
  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    generatesMedia: false,
    executesAdapter: false,
    editsMedia: false,
    humanApprovalRequired: true
  })) push(errors, payload?.executionBoundary?.[key] === expected, `SequenceRhythmSpec execution boundary.${key} is unsafe`);
  for (const key of ["exactStoryboardRef", "rationalTimebase", "shotWindowsOrdered", "storyboardShotsCovered", "phaseCoverageClosed", "transitionsAdjacent", "continuityExplicit", "providerNeutral", "noMediaGeneration"]) {
    push(errors, payload?.validation?.[key] === true, `SequenceRhythmSpec validation.${key} must be true`);
  }
}

function validateTemporalSpec(payload, errors, shotSpec, context = {}) {
  validateShotDependency(payload?.shotSpecRef, shotSpec, "TemporalSpec", errors);
  if (payload?.heroFrameAnchorRef) {
    push(errors, isExactContractRef(payload.heroFrameAnchorRef, ["cineweave_codex_hero_frame_anchor"]), "TemporalSpec heroFrameAnchorRef must target HeroFrameAnchor");
    if (context?.heroFrameAnchor) {
      const anchor = context.heroFrameAnchor;
      push(errors, payload.heroFrameAnchorRef.id === anchor.heroFrameAnchorId && payload.heroFrameAnchorRef.version === anchor.version && payload.heroFrameAnchorRef.contentHash === sha256Canonical(anchor), "TemporalSpec must bind the supplied exact HeroFrameAnchor");
      push(errors, sameExactRef(anchor.shotSpecRef, payload.shotSpecRef), "TemporalSpec HeroFrameAnchor must share the exact ShotSpec dependency");
    }
  }
  for (const [label, events] of [["focus", payload?.focusTimeline || []], ["action", payload?.actionTimeline || []], ["dynamic light", payload?.dynamicLighting || []]]) {
    let last = -1;
    for (const event of events) {
      push(errors, event?.timeSeconds >= last, `TemporalSpec ${label} events must be ordered`);
      push(errors, event?.timeSeconds <= payload?.durationSeconds, `TemporalSpec ${label} event exceeds duration`);
      last = event?.timeSeconds;
    }
  }
  push(errors, nonEmpty(payload?.cameraMotion?.motivation), "TemporalSpec camera movement must be motivated");
  push(errors, payload?.validation?.endStateStable === true, "TemporalSpec needs a stable end state");
}

const cinematicSkillOwnerRoutes = new Map([
  ["cineweave_codex_shot_spec", ["cineweave-director", "shot_direction"]],
  ["cineweave_codex_temporal_spec", ["cineweave-director", "temporal_direction"]],
  ["cineweave_codex_performance_timeline", ["cineweave-character", "performance_timeline"]],
  ["cineweave_codex_scene_binding", ["cineweave-scene", "scene_binding"]],
  ["scene_binding", ["cineweave-scene", "scene_binding"]],
  ["character_binding", ["cineweave-character", "character_design"]],
  ["cineweave_codex_action_sequence_spec", ["cineweave-director", "action_sequence"]],
  ["cineweave_codex_sequence_rhythm_spec", ["cineweave-director", "sequence_rhythm"]],
  ["cineweave_codex_style_compile", ["cineweave-style", "style_compile"]]
]);

function validateCinematicSkillTarget(target, errors, label) {
  const expected = cinematicSkillOwnerRoutes.get(target?.contractKind);
  push(errors, Boolean(expected), `${label} targets an unsupported contract kind`);
  if (!expected) return;
  push(errors, target?.ownerSkill === expected[0], `${label} ownerSkill does not own ${target?.contractKind}`);
  push(errors, target?.route === expected[1], `${label} route does not own ${target?.contractKind}`);
  push(errors, nonEmpty(target?.fieldPath), `${label} must name a target field path`);
}

function validateCinematicSkillManifest(payload, errors) {
  const skills = payload?.skills || [];
  push(errors, payload?.contractVersion === "2.5.0", "CinematicSkillManifest must use contract version 2.5.0");
  push(errors, nonEmpty(payload?.cinematicSkillManifestId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "CinematicSkillManifest requires a stable identity and version");
  push(errors, unique(skills.map((skill) => skill?.skillId)), "CinematicSkillManifest skill IDs must be unique");

  for (const skill of skills) {
    const label = `CinematicSkillManifest ${skill?.skillId || "<unknown>"}`;
    const slots = skill?.bindingSlots || [];
    const parameters = skill?.parameters || [];
    const program = skill?.program || [];
    const outputs = skill?.outputContracts || [];
    const groups = skill?.controlGroups || [];
    const checks = skill?.qualityChecks || [];
    const slotIds = slots.map((slot) => slot?.slotId);
    const parameterIds = parameters.map((parameter) => parameter?.parameterId);
    const outputKeys = outputs.map((output) => `${output?.contractKind}|${output?.route}`);
    const groupIds = groups.map((group) => group?.groupId);
    const checkIds = checks.map((check) => check?.checkId);
    push(errors, Number.isSafeInteger(skill?.version) && skill.version >= 1, `${label} version must be positive`);
    push(errors, unique(slotIds), `${label} binding slot IDs must be unique`);
    push(errors, unique(parameterIds), `${label} parameter IDs must be unique`);
    push(errors, unique(outputKeys), `${label} output contracts must be unique`);
    push(errors, unique(groupIds), `${label} control group IDs must be unique`);
    push(errors, unique(checkIds), `${label} quality check IDs must be unique`);
    push(errors, unique(program.map((step) => step?.stepId)), `${label} program step IDs must be unique`);

    const slotMap = new Map(slots.map((slot) => [slot?.slotId, slot]));
    const parameterMap = new Map(parameters.map((parameter) => [parameter?.parameterId, parameter]));
    const outputMap = new Map(outputs.map((output) => [`${output?.contractKind}|${output?.route}`, output]));
    let previousOrder = 0;
    for (const [index, step] of program.entries()) {
      push(errors, step?.order === index + 1, `${label} program order must be contiguous`);
      push(errors, step?.order > previousOrder, `${label} program steps must be ordered`);
      previousOrder = step?.order;
      validateCinematicSkillTarget(step?.target, errors, `${label} program step ${step?.stepId || index}`);
      const source = step?.source || {};
      if (source.type === "parameter") push(errors, parameterMap.has(source.id), `${label} program step ${step?.stepId || index} references an unknown parameter`);
      if (source.type === "binding_slot") push(errors, slotMap.has(source.id), `${label} program step ${step?.stepId || index} references an unknown binding slot`);
      if (["constant", "preserve", "upstream_ref"].includes(source.type)) push(errors, nonEmpty(source.id), `${label} program step ${step?.stepId || index} needs a named ${source.type} source`);
      push(errors, outputMap.has(`${step?.target?.contractKind}|${step?.target?.route}`), `${label} program target must be declared as an output or handoff`);
    }

    for (const parameter of parameters) {
      const parameterLabel = `${label} parameter ${parameter?.parameterId || "<unknown>"}`;
      const targets = parameter?.targets || [];
      push(errors, targets.length > 0, `${parameterLabel} must declare at least one canonical target`);
      for (const target of targets) validateCinematicSkillTarget(target, errors, parameterLabel);
      if (parameter?.valueType === "enum") push(errors, Array.isArray(parameter?.options) && parameter.options.length > 0, `${parameterLabel} enum parameters need options`);
      if (["number", "frame_count"].includes(parameter?.valueType)) {
        push(errors, typeof parameter?.defaultValue === "number" && Number.isFinite(parameter.defaultValue), `${parameterLabel} numeric parameters need a finite default`);
        if (parameter?.range) push(errors, parameter.range.minimum <= parameter.range.maximum, `${parameterLabel} range must be ordered`);
      }
      if (parameter?.valueType === "frame_count") push(errors, Number.isSafeInteger(parameter?.defaultValue), `${parameterLabel} frame_count defaults must be integers`);
    }

    let previousGroupOrder = 0;
    const groupedParameters = [];
    for (const [index, group] of groups.entries()) {
      push(errors, group?.order === index + 1 && group.order > previousGroupOrder, `${label} control group order must be contiguous`);
      previousGroupOrder = group?.order;
      for (const parameterId of group?.parameterIds || []) {
        push(errors, parameterMap.has(parameterId), `${label} control group references unknown parameter ${parameterId}`);
        groupedParameters.push(parameterId);
      }
    }
    push(errors, unique(groupedParameters), `${label} control groups must not expose a parameter twice`);
    push(errors, unique(groupedParameters) && groupedParameters.length === parameterIds.length && parameterIds.every((id) => groupedParameters.includes(id)), `${label} control groups must cover every parameter exactly once`);

    for (const output of outputs) validateCinematicSkillTarget({ contractKind: output?.contractKind, ownerSkill: output?.ownerSkill, route: output?.route, fieldPath: output?.contractKind }, errors, `${label} output ${output?.contractKind || "<unknown>"}`);
    const qualityInputKinds = slots.flatMap((slot) => slot?.acceptedContractKinds || []);
    for (const check of checks) {
      push(errors, outputs.some((output) => output?.contractKind === check?.targetContractKind) || qualityInputKinds.includes(check?.targetContractKind), `${label} quality check must target a declared output or exact input kind`);
      push(errors, nonEmpty(check?.targetPath), `${label} quality check must name a target path`);
    }
    push(errors, containsProviderWeightSyntax(skill) === false, `${label} must not contain provider weight syntax`);
  }

  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    generatesMedia: false,
    executesAdapter: false,
    mutatesCanon: false,
    writesFiles: false,
    humanApprovalRequired: true
  })) push(errors, payload?.executionBoundary?.[key] === expected, `CinematicSkillManifest execution boundary.${key} is unsafe`);
  for (const key of ["skillIdsUnique", "parametersUnique", "programOrdered", "targetOwnersDeclared", "controlSurfaceProjectionOnly", "noProviderSyntax", "noCanonMutation", "noExecution"]) {
    push(errors, payload?.validation?.[key] === true, `CinematicSkillManifest validation.${key} must be true`);
  }
}

function validateShotCompilerPlan(payload, errors, context = {}) {
  const manifest = context?.cinematicSkillManifest;
  const hasManifestContext = Boolean(manifest);
  const manifestRef = payload?.cinematicSkillManifestRef;
  const selection = payload?.skillSelection || {};
  const skill = manifest?.skills?.find((item) => item?.skillId === selection.skillId && item?.version === selection.version);
  const parameterValues = payload?.parameterValues || [];
  const resolvedBindings = payload?.resolvedBindings || [];
  const upstreamRefs = payload?.upstreamRefs || [];
  const handoffs = payload?.handoffs || [];
  const traceSteps = payload?.compileTrace?.steps || [];

  push(errors, isExactContractRef(manifestRef, ["cineweave_codex_cinematic_skill_manifest"]), "ShotCompilerPlan must bind an exact CinematicSkillManifest");
  if (manifest) {
    push(errors, manifestRef?.id === manifest.cinematicSkillManifestId && manifestRef?.version === manifest.version && manifestRef?.contentHash === sha256Canonical(manifest), "ShotCompilerPlan must bind the supplied exact CinematicSkillManifest");
    push(errors, Boolean(skill), "ShotCompilerPlan must select a declared skill and version");
  }
  if (skill) {
    push(errors, payload?.intent?.storyFunction === skill.storyFunction, "ShotCompilerPlan intent must preserve the selected skill story function");
    push(errors, payload?.intent?.targetLevel === skill.targetLevel, "ShotCompilerPlan intent must preserve the selected skill target level");
  }

  push(errors, unique(parameterValues.map((item) => item?.parameterId)), "ShotCompilerPlan parameter values must be unique");
  const parameterMap = new Map((skill?.parameters || []).map((parameter) => [parameter?.parameterId, parameter]));
  for (const item of parameterValues) {
    const parameter = parameterMap.get(item?.parameterId);
    if (hasManifestContext) {
      push(errors, Boolean(parameter), `ShotCompilerPlan references unknown parameter ${item?.parameterId}`);
      if (!parameter) continue;
      if (parameter.valueType === "enum") push(errors, typeof item.value === "string" && parameter.options.includes(item.value), `ShotCompilerPlan enum ${item.parameterId} must use a declared option`);
      if (parameter.valueType === "number") push(errors, typeof item.value === "number" && Number.isFinite(item.value), `ShotCompilerPlan number ${item.parameterId} must be finite`);
      if (parameter.valueType === "frame_count") push(errors, Number.isSafeInteger(item.value) && item.value >= 0, `ShotCompilerPlan frame_count ${item.parameterId} must be a non-negative integer`);
      if (parameter.range && typeof item.value === "number") push(errors, item.value >= parameter.range.minimum && item.value <= parameter.range.maximum, `ShotCompilerPlan ${item.parameterId} exceeds its declared range`);
    }
  }
  push(errors, skill ? parameterValues.length === skill.parameters.length && skill.parameters.every((parameter) => parameterValues.some((item) => item.parameterId === parameter.parameterId)) : true, "ShotCompilerPlan must resolve every selected skill parameter");

  const slotMap = new Map((skill?.bindingSlots || []).map((slot) => [slot?.slotId, slot]));
  const bindingSlots = resolvedBindings.map((item) => item?.slotId);
  push(errors, unique(bindingSlots), "ShotCompilerPlan binding slots must be unique");
  for (const binding of resolvedBindings) {
    const slot = slotMap.get(binding?.slotId);
    if (hasManifestContext) {
      push(errors, Boolean(slot), `ShotCompilerPlan references unknown binding slot ${binding?.slotId}`);
      push(errors, Array.isArray(binding?.refs) && binding.refs.length >= 1 && binding.refs.length <= (slot?.maxBindings || 12), `ShotCompilerPlan binding ${binding?.slotId} exceeds its slot capacity`);
      for (const ref of binding?.refs || []) push(errors, isExactContractRef(ref) && Boolean(slot?.acceptedContractKinds?.includes(ref.kind)), `ShotCompilerPlan binding ${binding?.slotId} must use an exact accepted ref`);
    } else {
      for (const ref of binding?.refs || []) push(errors, isExactContractRef(ref), `ShotCompilerPlan binding ${binding?.slotId} must use an exact ref`);
    }
    if (binding?.source === "asset_alias") {
      push(errors, /^@[^\s@]{1,120}$/.test(binding?.alias || ""), `ShotCompilerPlan asset alias for ${binding?.slotId} must be bounded`);
      push(errors, isExactContractRef(payload?.assetAliasRegistryRef, ["cineweave_codex_asset_alias_registry"]), "ShotCompilerPlan asset aliases require an exact AssetAliasRegistry");
      const registry = context?.assetAliasRegistry;
      if (registry && payload?.assetAliasRegistryRef) {
        push(errors, payload.assetAliasRegistryRef.id === registry.assetAliasRegistryId && payload.assetAliasRegistryRef.version === registry.version && payload.assetAliasRegistryRef.contentHash === sha256Canonical(registry), "ShotCompilerPlan must bind the supplied exact AssetAliasRegistry");
        const resolved = registry.aliases?.find((item) => item?.alias === binding.alias);
        push(errors, resolved?.targetRef && (binding.refs || []).some((ref) => sameExactRef(ref, resolved.targetRef)), `ShotCompilerPlan alias ${binding.alias} must resolve to its registry target`);
      }
    } else push(errors, !Object.hasOwn(binding || {}, "alias"), `ShotCompilerPlan exact binding ${binding?.slotId} must not carry an alias`);
  }
  if (hasManifestContext) {
    for (const slot of skill?.bindingSlots || []) if (slot.required) push(errors, bindingSlots.includes(slot.slotId), `ShotCompilerPlan must resolve required binding slot ${slot.slotId}`);
  }

  push(errors, unique(upstreamRefs.map(exactRefKey)), "ShotCompilerPlan upstream refs must be unique");
  for (const ref of upstreamRefs) push(errors, isExactContractRef(ref), "ShotCompilerPlan upstreamRefs must be exact contract refs");

  const controls = (payload?.controlSurface?.groups || []).flatMap((group) => group?.controls || []);
  push(errors, unique(controls.map((control) => control?.controlId)), "ShotCompilerPlan control IDs must be unique");
  push(errors, unique(controls.map((control) => control?.parameterId)) && controls.length === parameterValues.length, "ShotCompilerPlan must expose every parameter exactly once on the control surface");
  const valueMap = new Map(parameterValues.map((item) => [item.parameterId, item.value]));
  for (const control of controls) {
    const parameter = parameterMap.get(control?.parameterId);
    push(errors, Object.is(control.value, valueMap.get(control.parameterId)), `ShotCompilerPlan control ${control.controlId} must mirror its parameter value`);
    if (hasManifestContext) {
      push(errors, Boolean(parameter), `ShotCompilerPlan control references unknown parameter ${control?.parameterId}`);
      if (!parameter) continue;
      const target = parameter.targets?.find((item) => item.contractKind === control?.target?.contractKind && item.fieldPath === control?.target?.fieldPath);
      push(errors, Boolean(target), `ShotCompilerPlan control ${control.controlId} must target one declared parameter target`);
      if (target) {
        push(errors, control.ownerSkill === target.ownerSkill && control.target.ownerSkill === target.ownerSkill && control.target.route === target.route, `ShotCompilerPlan control ${control.controlId} must preserve target ownership`);
        push(errors, control.enforcement === parameter.controlLevel, `ShotCompilerPlan control ${control.controlId} must preserve enforcement level`);
      }
    }
  }
  for (const [index, group] of (payload?.controlSurface?.groups || []).entries()) push(errors, group?.order === index + 1, "ShotCompilerPlan control groups must be ordered");

  const outputMap = new Map((skill?.outputContracts || []).map((output) => [`${output?.contractKind}|${output?.route}`, output]));
  push(errors, unique(handoffs.map((handoff) => `${handoff?.contractKind}|${handoff?.route}`)), "ShotCompilerPlan handoffs must be unique");
  for (const [index, handoff] of handoffs.entries()) {
    const expected = outputMap.get(`${handoff?.contractKind}|${handoff?.route}`);
    if (hasManifestContext) push(errors, Boolean(expected), `ShotCompilerPlan handoff ${handoff?.handoffId || index} is not declared by the selected skill`);
    push(errors, handoff?.order === index + 1 && handoff?.status === "planned", `ShotCompilerPlan handoffs must be ordered planned records`);
    if (expected) push(errors, handoff.ownerSkill === expected.ownerSkill && handoff.route === expected.route, `ShotCompilerPlan handoff ${handoff.handoffId} must preserve owner and route`);
    for (const ref of handoff?.dependencyRefs || []) push(errors, isExactContractRef(ref), `ShotCompilerPlan handoff ${handoff?.handoffId || index} dependency refs must be exact`);
    for (const assignment of handoff?.fieldAssignments || []) {
      push(errors, nonEmpty(assignment?.targetPath) && nonEmpty(assignment?.sourceId), `ShotCompilerPlan handoff ${handoff?.handoffId || index} field assignment is incomplete`);
      if (hasManifestContext && assignment?.sourceType === "parameter") push(errors, parameterMap.has(assignment.sourceId), `ShotCompilerPlan handoff ${handoff?.handoffId || index} references an unknown parameter source`);
      if (hasManifestContext && assignment?.sourceType === "binding_slot") push(errors, slotMap.has(assignment.sourceId), `ShotCompilerPlan handoff ${handoff?.handoffId || index} references an unknown binding source`);
    }
  }
  push(errors, skill ? handoffs.length === skill.outputContracts.length && skill.outputContracts.every((output) => handoffs.some((handoff) => handoff.contractKind === output.contractKind && handoff.route === output.route)) : true, "ShotCompilerPlan must close over the selected skill outputs");

  const program = skill?.program || [];
  if (hasManifestContext) push(errors, traceSteps.length === program.length, "ShotCompilerPlan compileTrace must preserve the selected program step count");
  push(errors, unique(traceSteps.map((step) => step?.stepId)), "ShotCompilerPlan compileTrace step IDs must be unique");
  for (const [index, step] of traceSteps.entries()) {
    const expected = program[index];
    push(errors, step?.order === index + 1, "ShotCompilerPlan compileTrace steps must be ordered");
    if (expected) {
      push(errors, step.stepId === expected.stepId && step.operation === expected.operation, `ShotCompilerPlan compileTrace step ${index + 1} must preserve the manifest operation`);
      push(errors, JSON.stringify(step.target) === JSON.stringify(expected.target), `ShotCompilerPlan compileTrace step ${index + 1} must preserve its target`);
      push(errors, JSON.stringify(step.source) === JSON.stringify(expected.source), `ShotCompilerPlan compileTrace step ${index + 1} must preserve its source`);
    }
  }
  push(errors, containsProviderWeightSyntax(payload) === false, "ShotCompilerPlan must not contain provider weight syntax");
  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    generatesMedia: false,
    executesAdapter: false,
    mutatesCanon: false,
    writesFiles: false,
    humanApprovalRequired: true
  })) push(errors, payload?.executionBoundary?.[key] === expected, `ShotCompilerPlan execution boundary.${key} is unsafe`);
  for (const key of ["manifestRefExact", "skillSelectionExact", "parametersResolved", "bindingsResolved", "controlsProjectionOnly", "handoffsOwned", "programTraceOrdered", "noProviderSelection", "noCanonMutation", "noExecution"]) {
    push(errors, payload?.validation?.[key] === true, `ShotCompilerPlan validation.${key} must be true`);
  }
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) [a, b] = [b, a % b];
  return a;
}

function sameVector3(left, right) {
  return ["x", "y", "z"].every((axis) => Math.abs((left?.[axis] ?? NaN) - (right?.[axis] ?? NaN)) <= 1e-9);
}

function equivalentQuaternion(left, right) {
  const dot = ["x", "y", "z", "w"].reduce((sum, axis) => sum + (left?.[axis] ?? NaN) * (right?.[axis] ?? NaN), 0);
  return Math.abs(Math.abs(dot) - 1) <= 1e-6;
}

function hasFrameValueChange(track, equals) {
  return (track || []).some((keyframe, index) => index > 0 && !equals(track[index - 1], keyframe));
}

function validateCameraFrameTrack(track, label, frameRange, errors, validateKeyframe) {
  let previousFrame = -1;
  for (const keyframe of track || []) {
    const frame = keyframe?.frame;
    push(errors, Number.isSafeInteger(frame), `CameraPrevisSpec ${label} frame must be an integer`);
    push(errors, frame > previousFrame, `CameraPrevisSpec ${label} frames must be strictly ordered`);
    push(errors, frame >= frameRange?.startFrame && frame <= frameRange?.endFrame, `CameraPrevisSpec ${label} frame must stay within frameRange`);
    previousFrame = frame;
    validateKeyframe(keyframe);
  }
  if ((track || []).length) {
    push(errors, track[0]?.frame === frameRange?.startFrame, `CameraPrevisSpec ${label} track must begin at frameRange.startFrame`);
    push(errors, track.at(-1)?.frame === frameRange?.endFrame, `CameraPrevisSpec ${label} track must end at frameRange.endFrame`);
  }
}

function validateCameraPrevisSpec(payload, errors, context = {}) {
  const frameRate = payload?.frameRate || {};
  const frameRange = payload?.frameRange || {};
  const shotSpec = context?.shotSpec;
  const temporalSpec = context?.temporalSpec;
  const components = payload?.motion?.components || [];
  const poseTrack = payload?.tracks?.pose || [];
  const intrinsicsTrack = payload?.tracks?.intrinsics || [];
  const primaryBehavior = payload?.motion?.primaryBehavior;

  validateShotDependency(payload?.shotSpecRef, shotSpec, "CameraPrevisSpec", errors);
  push(errors, isExactContractRef(payload?.sceneBindingRef, ["scene_binding"]), "CameraPrevisSpec sceneBindingRef must target SceneBinding");
  if (shotSpec) push(errors, sameExactRef(payload?.sceneBindingRef, shotSpec?.bindings?.scene), "CameraPrevisSpec sceneBindingRef must exactly match the ShotSpec scene binding");

  if (payload?.temporalSpecRef) {
    push(errors, isExactContractRef(payload.temporalSpecRef, ["cineweave_codex_temporal_spec"]), "CameraPrevisSpec temporalSpecRef must target TemporalSpec");
    if (temporalSpec) {
      push(errors, payload.temporalSpecRef.id === temporalSpec.temporalSpecId && payload.temporalSpecRef.version === temporalSpec.version, "CameraPrevisSpec must bind the supplied TemporalSpec identity and version");
      push(errors, payload.temporalSpecRef.contentHash === sha256Canonical(temporalSpec), "CameraPrevisSpec must bind the supplied TemporalSpec content hash");
      push(errors, sameExactRef(temporalSpec.shotSpecRef, payload.shotSpecRef), "CameraPrevisSpec and TemporalSpec must share the exact ShotSpec dependency");
    }
  }

  push(errors, Number.isSafeInteger(frameRate.numerator) && Number.isSafeInteger(frameRate.denominator) && greatestCommonDivisor(frameRate.numerator || 0, frameRate.denominator || 0) === 1, "CameraPrevisSpec frameRate must be a reduced rational");
  push(errors, Number.isSafeInteger(frameRange.startFrame) && Number.isSafeInteger(frameRange.endFrame) && frameRange.endFrame > frameRange.startFrame, "CameraPrevisSpec frameRange must have an end after its start");
  push(errors, payload?.camera?.clippingRangeMeters?.far > payload?.camera?.clippingRangeMeters?.near, "CameraPrevisSpec clipping far distance must exceed near distance");
  push(errors, payload?.camera?.shutter?.closeFrameOffset >= payload?.camera?.shutter?.openFrameOffset, "CameraPrevisSpec shutter close must not precede shutter open");

  validateCameraFrameTrack(poseTrack, "pose", frameRange, errors, (keyframe) => {
    const quaternion = keyframe?.orientationQuaternion;
    const magnitude = Math.hypot(quaternion?.x ?? NaN, quaternion?.y ?? NaN, quaternion?.z ?? NaN, quaternion?.w ?? NaN);
    push(errors, Math.abs(magnitude - 1) <= 1e-6, "CameraPrevisSpec pose keyframes must use a unit quaternion");
  });
  validateCameraFrameTrack(intrinsicsTrack, "intrinsics", frameRange, errors, () => {});

  const hasTranslation = hasFrameValueChange(poseTrack, (left, right) => sameVector3(left?.positionMeters, right?.positionMeters));
  const hasRotation = hasFrameValueChange(poseTrack, (left, right) => equivalentQuaternion(left?.orientationQuaternion, right?.orientationQuaternion));
  const hasZoom = hasFrameValueChange(intrinsicsTrack, (left, right) => Math.abs((left?.focalLengthMm ?? NaN) - (right?.focalLengthMm ?? NaN)) <= 1e-9);
  const hasFocusPull = hasFrameValueChange(intrinsicsTrack, (left, right) => Math.abs((left?.focusDistanceMeters ?? NaN) - (right?.focusDistanceMeters ?? NaN)) <= 1e-9);
  const hasIris = hasFrameValueChange(intrinsicsTrack, (left, right) => Math.abs((left?.fStop ?? NaN) - (right?.fStop ?? NaN)) <= 1e-9);
  const componentChecks = [
    ["translation", hasTranslation, "CameraPrevisSpec translation requires a pose position change"],
    ["rotation", hasRotation, "CameraPrevisSpec rotation requires an orientation change"],
    ["zoom", hasZoom, "CameraPrevisSpec zoom requires a focal-length change"],
    ["focus_pull", hasFocusPull, "CameraPrevisSpec focus_pull requires a focus-distance change"],
    ["iris", hasIris, "CameraPrevisSpec iris requires an fStop change"]
  ];
  for (const [component, present, message] of componentChecks) {
    if (components.includes(component)) push(errors, present, message);
    if (present) push(errors, components.includes(component), `CameraPrevisSpec changed ${component} data without declaring that motion component`);
  }
  if (primaryBehavior === "static") push(errors, !components.some((component) => ["translation", "rotation", "zoom"].includes(component)), "CameraPrevisSpec static behavior cannot include spatial movement or zoom");
  if (["dolly", "truck", "arc", "crane"].includes(primaryBehavior)) push(errors, components.includes("translation"), `CameraPrevisSpec ${primaryBehavior} behavior requires translation`);
  if (["pan", "tilt"].includes(primaryBehavior)) push(errors, components.includes("rotation"), `CameraPrevisSpec ${primaryBehavior} behavior requires rotation`);
  if (primaryBehavior === "zoom") push(errors, components.includes("zoom"), "CameraPrevisSpec zoom behavior requires the zoom component");
  if (["handheld", "gimbal"].includes(primaryBehavior)) push(errors, components.some((component) => ["translation", "rotation", "shake"].includes(component)), `CameraPrevisSpec ${primaryBehavior} behavior requires a physical movement component`);
  if (primaryBehavior === "compound") push(errors, components.filter((component) => !["focus_pull", "iris"].includes(component)).length >= 2, "CameraPrevisSpec compound behavior needs at least two physical components");

  if (payload?.temporalSpecRef && temporalSpec && frameRate.numerator && frameRate.denominator && Number.isSafeInteger(frameRange.startFrame) && Number.isSafeInteger(frameRange.endFrame)) {
    const durationSeconds = (frameRange.endFrame - frameRange.startFrame) * frameRate.denominator / frameRate.numerator;
    push(errors, Math.abs(durationSeconds - temporalSpec.durationSeconds) <= 1e-6, "CameraPrevisSpec frameRange and frameRate must match the supplied TemporalSpec duration");
  }
  push(errors, payload?.executionBoundary?.providerNeutral === true && payload?.executionBoundary?.generatesMedia === false && payload?.executionBoundary?.executesAdapter === false, "CameraPrevisSpec must remain provider-neutral and non-executing");
  push(errors, payload?.validation?.tracksSeparate === true, "CameraPrevisSpec must keep intrinsic and extrinsic tracks separate");
  push(errors, payload?.validation?.keyframesOrdered === true, "CameraPrevisSpec must declare ordered keyframes");
}

function validatePromptRepair(payload, errors) {
  push(errors, Array.isArray(payload?.changeOnly) && payload.changeOnly.length === 1, "PromptRepair changes exactly one variable");
  push(errors, Array.isArray(payload?.evidenceObservationIds) && payload.evidenceObservationIds.length > 0, "PromptRepair requires observed evidence");
  push(errors, payload?.validation?.parentImmutable === true, "PromptRepair keeps its parent immutable");
}

function validateDirectorProposals(payload, errors) {
  if (payload?.contractVersion !== "2.5.0") return;
  const proposals = payload?.proposals || [];
  const deltas = proposals.map((item) => item?.primaryDelta || {});
  push(errors, nonEmpty(payload?.proposalSetId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "DirectorProposals 2.5 requires a stable proposal set identity and version");
  push(errors, proposals.length >= 2 && proposals.length <= 5, "DirectorProposals requires two to five alternatives");
  push(errors, unique(proposals.map((item) => item?.proposalId)), "DirectorProposals proposal IDs must be unique");
  push(errors, unique(deltas.map((item) => String(item?.axis) + "|" + String(item?.direction) + "|" + String(item?.hypothesis))), "DirectorProposals primary deltas must be distinct");
  const declaredAxes = new Set(payload?.explorationAxes || []);
  push(errors, declaredAxes.size > 0 && deltas.every((item) => declaredAxes.has(item?.axis)), "DirectorProposals primary delta axes must be declared at set level");
  for (const proposal of proposals) {
    const capabilities = proposal?.capabilityRequirements || [];
    push(errors, capabilities.length > 0 && unique(capabilities), String(proposal?.proposalId) + ": DirectorProposals capability requirements must be non-empty and unique");
    push(errors, !Object.hasOwn(proposal || {}, "recommendedProvider"), String(proposal?.proposalId) + ": DirectorProposals must not choose a Provider");
  }
  push(errors, payload?.humanSelection?.required === true && payload?.humanSelection?.status === "pending", "DirectorProposals must leave human selection pending");
  push(errors, payload?.executionBoundary?.providerNeutral === true, "DirectorProposals must remain Provider-neutral");
  push(errors, payload?.executionBoundary?.generatesMedia === false && payload?.executionBoundary?.approvesAssets === false, "DirectorProposals must not claim media generation or asset approval");
  push(errors, payload?.validation?.proposalSetVersioned === true && payload?.validation?.primaryDeltasDistinct === true, "DirectorProposals must declare versioned distinct alternatives");
  push(errors, payload?.validation?.capabilityRequirementsDeclared === true && payload?.validation?.humanSelectionRequired === true, "DirectorProposals must declare capability and human-selection validation");
}

function validateRenderPlan(payload, errors) {
  if (payload?.contractVersion !== "2.5.0") return;
  push(errors, nonEmpty(payload?.renderPlanId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "RenderPlan 2.5 requires a stable render plan identity and version");
  push(errors, isExactContractRef(payload?.promptRef, ["cineweave_codex_prompt_record", "cineweave_codex_image_prompt"]), "RenderPlan 2.5 promptRef must be an exact PromptRecord or ImagePrompt reference");
  push(errors, !Object.hasOwn(payload || {}, "promptPayloadRef"), "RenderPlan 2.5 must not retain promptPayloadRef");
  const optionalRefs = [
    ["assetRecipeRef", ["cineweave_codex_asset_recipe"], "AssetRecipe"],
    ["controlSetRef", ["cineweave_codex_control_channel_set"], "ControlChannelSet"],
    ["evidenceBundleRef", ["cineweave_codex_evidence_bundle"], "EvidenceBundle"],
    ["capabilityProfileRef", ["cineweave_codex_capability_profile"], "CapabilityProfile"]
  ];
  for (const [field, acceptedKinds, label] of optionalRefs) {
    if (payload?.[field] !== undefined) push(errors, isExactContractRef(payload[field], acceptedKinds), "RenderPlan 2.5 " + field + " must be an exact " + label + " reference");
  }
  for (const ref of payload?.licenseProfileRefs || []) {
    push(errors, isExactContractRef(ref, ["cineweave_codex_license_profile"]), "RenderPlan 2.5 licenseProfileRefs must contain exact LicenseProfile references");
  }
  push(errors, payload?.executionGate?.requiresHumanApproval === true, "RenderPlan 2.5 requires a human execution gate");
  push(errors, payload?.postflight?.importStatus === "draft", "RenderPlan 2.5 must keep imports in Draft");
}

function validateMediaImport(payload, errors) {
  if (payload?.contractVersion !== "2.5.0") return;
  push(errors, nonEmpty(payload?.mediaImportId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "MediaImport 2.5 requires a stable import identity and version");
  push(errors, isExactContractRef(payload?.renderPlanRef, ["cineweave_codex_render_plan"]), "MediaImport 2.5 renderPlanRef must be an exact RenderPlan reference");
  const hasRequest = Object.hasOwn(payload || {}, "executionRequestRef");
  const hasReceipt = Object.hasOwn(payload || {}, "executionReceiptRef");
  push(errors, hasRequest === hasReceipt, "MediaImport 2.5 execution request and receipt references must be paired");
  if (hasRequest) {
    push(errors, isExactContractRef(payload?.executionRequestRef, ["cineweave_execution_request"]), "MediaImport 2.5 executionRequestRef must be an exact ExecutionRequest reference");
    push(errors, isExactContractRef(payload?.executionReceiptRef, ["cineweave_execution_receipt"]), "MediaImport 2.5 executionReceiptRef must be an exact ExecutionReceipt reference");
  }
  const media = payload?.media || [];
  push(errors, unique(media.map((item) => item?.mediaId)), "MediaImport 2.5 media IDs must be unique");
  push(errors, unique(media.map((item) => item?.contentHash)), "MediaImport 2.5 media content hashes must be unique");
  push(errors, payload?.status === "draft" && payload?.verification?.status === "verified" && payload?.importContract?.statusOnCreation === "draft", "MediaImport 2.5 must remain a verified Draft");
  push(errors, nonEmpty(payload?.provenance?.source) && Array.isArray(payload?.provenance?.changeLog) && payload.provenance.changeLog.length > 0, "MediaImport 2.5 requires auditable provenance");
}

function validateEditorialTimelinePlan(payload, errors) {
  const isFrameRange = (value) => Number.isSafeInteger(value?.startFrame) && value.startFrame >= 0
    && Number.isSafeInteger(value?.durationFrames) && value.durationFrames >= 1;
  const rangeEnd = (value) => value.startFrame + value.durationFrames;
  const gcd = (left, right) => {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a;
  };
  const timelineRange = payload?.timelineRange;
  const rootRangeValid = isFrameRange(timelineRange);
  const timelineEnd = rootRangeValid ? rangeEnd(timelineRange) : null;
  const frameRate = payload?.frameRate || {};
  const tracks = payload?.tracks || [];
  const transitions = payload?.transitions || [];
  const trackIds = tracks.map((track) => track?.trackId);
  const transitionIds = transitions.map((transition) => transition?.transitionId);
  const transitionKeys = new Set();
  const tracksById = new Map();
  let mediaCount = 0;
  let placeholderCount = 0;

  push(errors, nonEmpty(payload?.editorialTimelinePlanId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "EditorialTimelinePlan requires a stable identity and version");
  push(errors, isExactContractRef(payload?.storyboardRef, ["cineweave_codex_storyboard_sequence"]), "EditorialTimelinePlan must bind an exact Storyboard");
  push(errors, Number.isSafeInteger(frameRate?.numerator) && Number.isSafeInteger(frameRate?.denominator) && frameRate.numerator > 0 && frameRate.denominator > 0 && gcd(frameRate.numerator || 0, frameRate.denominator || 0) === 1, "EditorialTimelinePlan frame rate must be a reduced rational value");
  push(errors, rootRangeValid, "EditorialTimelinePlan timelineRange must use positive integer frame duration");
  push(errors, unique(trackIds), "EditorialTimelinePlan track IDs must be unique");
  push(errors, unique(transitionIds), "EditorialTimelinePlan transition IDs must be unique");

  for (const [trackIndex, track] of tracks.entries()) {
    const label = track?.trackId || "Editorial timeline track";
    const segments = track?.segments || [];
    const segmentIds = segments.map((segment) => segment?.segmentId);
    const segmentById = new Map(segments.map((segment, index) => [segment?.segmentId, { segment, index }]));
    tracksById.set(track?.trackId, { track, segments, segmentById });
    push(errors, track?.order === trackIndex + 1, label + ": track order must be contiguous");
    push(errors, unique(segmentIds), label + ": segment IDs must be unique");
    let cursor = rootRangeValid ? timelineRange.startFrame : null;
    for (const segment of segments) {
      const segmentLabel = label + "/" + (segment?.segmentId || "segment");
      const range = segment?.timelineRange;
      const rangeValid = isFrameRange(range);
      push(errors, rangeValid, segmentLabel + ": timelineRange must use positive integer frame duration");
      if (rangeValid && cursor !== null) {
        push(errors, range.startFrame === cursor, segmentLabel + ": segments must be contiguous");
        cursor = rangeEnd(range);
        push(errors, cursor <= timelineEnd, segmentLabel + ": segment exceeds the timeline range");
      }
      const hasMediaBinding = Object.hasOwn(segment || {}, "mediaImportRef") || Object.hasOwn(segment || {}, "mediaId") || Object.hasOwn(segment || {}, "sourceRange");
      if (segment?.segmentType === "media") {
        mediaCount += 1;
        push(errors, isExactContractRef(segment?.shotSpecRef, ["cineweave_codex_shot_spec"]), segmentLabel + ": media segment must bind an exact ShotSpec");
        push(errors, isExactContractRef(segment?.mediaImportRef, ["cineweave_codex_media_import"]), segmentLabel + ": media segment must bind an exact MediaImport");
        push(errors, nonEmpty(segment?.mediaId), segmentLabel + ": media segment must name a MediaImport media ID");
        push(errors, isFrameRange(segment?.sourceRange), segmentLabel + ": media segment must declare an exact source frame range");
        if (rangeValid && isFrameRange(segment?.sourceRange)) push(errors, segment.sourceRange.durationFrames === range.durationFrames, segmentLabel + ": retiming is not implicit; source and timeline durations must match");
      } else if (segment?.segmentType === "placeholder") {
        placeholderCount += 1;
        push(errors, isExactContractRef(segment?.shotSpecRef, ["cineweave_codex_shot_spec"]), segmentLabel + ": placeholder must bind an exact ShotSpec");
        push(errors, !hasMediaBinding, segmentLabel + ": placeholder cannot claim imported media");
      } else if (segment?.segmentType === "gap") {
        push(errors, !Object.hasOwn(segment || {}, "shotId") && !Object.hasOwn(segment || {}, "shotSpecRef") && !Object.hasOwn(segment || {}, "temporalSpecRef") && !hasMediaBinding, segmentLabel + ": gap cannot carry creative or media bindings");
      }
      if (segment?.temporalSpecRef !== undefined) push(errors, isExactContractRef(segment.temporalSpecRef, ["cineweave_codex_temporal_spec"]), segmentLabel + ": temporalSpecRef must be exact when supplied");
    }
    if (cursor !== null && timelineEnd !== null) push(errors, cursor === timelineEnd, label + ": segments must close the timeline range without implicit gaps");
  }

  for (const transition of transitions) {
    const transitionLabel = transition?.transitionId || "Editorial timeline transition";
    const owner = tracksById.get(transition?.trackId);
    push(errors, owner !== undefined, transitionLabel + ": transition references an unknown track");
    if (!owner) continue;
    const from = owner.segmentById.get(transition?.fromSegmentId);
    const to = owner.segmentById.get(transition?.toSegmentId);
    push(errors, from !== undefined && to !== undefined, transitionLabel + ": transition must reference segments on its own track");
    if (!from || !to) continue;
    push(errors, from.index + 1 === to.index, transitionLabel + ": transition segments must be adjacent and ordered");
    push(errors, from.segment?.segmentType !== "gap" && to.segment?.segmentType !== "gap", transitionLabel + ": transitions cannot attach to a gap");
    const fromEnd = isFrameRange(from.segment?.timelineRange) ? rangeEnd(from.segment.timelineRange) : null;
    const toStart = to.segment?.timelineRange?.startFrame;
    push(errors, fromEnd !== null && fromEnd === toStart && transition?.atFrame === fromEnd, transitionLabel + ": transition must anchor at the shared segment boundary");
    if (transition?.type === "cut") push(errors, transition?.durationFrames === 0, transitionLabel + ": cut duration must be zero");
    else {
      push(errors, Number.isSafeInteger(transition?.durationFrames) && transition.durationFrames >= 1, transitionLabel + ": non-cut transition needs positive frame duration");
      const fromDuration = from.segment?.timelineRange?.durationFrames;
      const toDuration = to.segment?.timelineRange?.durationFrames;
      if (Number.isSafeInteger(fromDuration) && Number.isSafeInteger(toDuration) && Number.isSafeInteger(transition?.durationFrames)) {
        push(errors, transition.durationFrames <= Math.min(fromDuration, toDuration), transitionLabel + ": transition duration exceeds an adjacent segment");
      }
    }
    const key = String(transition?.trackId) + "|" + String(transition?.fromSegmentId) + "|" + String(transition?.toSegmentId);
    push(errors, !transitionKeys.has(key), transitionLabel + ": duplicate transition boundary");
    transitionKeys.add(key);
  }

  for (const [trackId, owner] of tracksById) {
    for (let index = 0; index < owner.segments.length - 1; index += 1) {
      const from = owner.segments[index];
      const to = owner.segments[index + 1];
      if (from?.segmentType === "gap" || to?.segmentType === "gap") continue;
      const key = String(trackId) + "|" + String(from?.segmentId) + "|" + String(to?.segmentId);
      push(errors, transitionKeys.has(key), String(trackId) + ": adjacent non-gap segments require an explicit transition");
    }
  }

  if (payload?.conformStatus === "planned") {
    push(errors, mediaCount === 0, "planned timeline cannot claim imported media segments");
    push(errors, placeholderCount > 0, "planned timeline requires at least one placeholder segment");
  } else if (payload?.conformStatus === "partial") {
    push(errors, mediaCount > 0 && placeholderCount > 0, "partial timeline requires both imported media and placeholders");
  } else if (payload?.conformStatus === "conformed") {
    push(errors, placeholderCount === 0, "conformed timeline cannot retain placeholder segments");
    push(errors, mediaCount > 0, "conformed timeline requires at least one imported media segment");
  }

  const markers = payload?.markers || [];
  push(errors, unique(markers.map((marker) => marker?.markerId)), "EditorialTimelinePlan marker IDs must be unique");
  if (rootRangeValid) for (const marker of markers) push(errors, Number.isSafeInteger(marker?.frame) && marker.frame >= timelineRange.startFrame && marker.frame <= timelineEnd, String(marker?.markerId || "marker") + ": marker lies outside the timeline range");
  push(errors, payload?.otioExchange?.model === "otio-core" && payload?.otioExchange?.externalMediaOnly === true && payload?.otioExchange?.serializationStatus === "not_exported", "EditorialTimelinePlan must remain an OTIO-model-aligned, external-media-only unexported plan");
  push(errors, payload?.executionBoundary?.providerNeutral === true && payload?.executionBoundary?.embedsMedia === false && payload?.executionBoundary?.exportsTimeline === false && payload?.executionBoundary?.humanApprovalRequired === true, "EditorialTimelinePlan must not embed media, export a timeline or claim execution");
  for (const key of ["rationalTimebase", "trackRangesClosed", "segmentsOrdered", "transitionsAnchored", "sourceRefsExact", "plannedMediaHonest", "providerNeutral"]) push(errors, payload?.validation?.[key] === true, "EditorialTimelinePlan validation." + key + " must be true");
}

function validateColorPipelineProfile(payload, errors, context = {}) {
  const sourceMedia = payload?.sourceMedia || [];
  const outputTargets = payload?.outputTargets || [];
  const metadataFields = ["primaries", "transfer", "matrix", "range"];
  const sourceIds = sourceMedia.map((item) => item?.bindingId);
  const sourceKeys = sourceMedia.map((item) => {
    const ref = item?.mediaImportRef || {};
    return [ref.kind, ref.id, ref.version, ref.contentHash, item?.mediaId].join("|");
  });
  const targetIds = outputTargets.map((item) => item?.targetId);
  const targetPurposes = outputTargets.map((item) => item?.purpose);
  const config = payload?.ocioConfig || {};

  push(errors, nonEmpty(payload?.colorPipelineProfileId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "ColorPipelineProfile requires a stable identity and version");
  push(errors, payload?.profileStatus === "planned", "ColorPipelineProfile must remain planned until an approved adapter records a separate execution result");
  push(errors, nonEmpty(config?.configId) && nonEmpty(config?.configVersion) && /^sha256:[0-9a-f]{64}$/.test(config?.contentHash || ""), "ColorPipelineProfile must identify an exact OCIO config version and content hash");
  push(errors, config?.referenceSpaceModel === "ocio-scene-and-display-reference" && config?.loadStatus === "not_loaded", "ColorPipelineProfile must model OCIO reference spaces without claiming the config was loaded");
  push(errors, unique(sourceIds), "ColorPipelineProfile source binding IDs must be unique");
  push(errors, unique(sourceKeys), "ColorPipelineProfile cannot bind one MediaImport media ID more than once");

  for (const source of sourceMedia) {
    const label = source?.bindingId || "ColorPipelineProfile source";
    const assignment = source?.inputColorSpace || {};
    const metadata = source?.metadata || {};
    const metadataStatus = metadata?.status;
    push(errors, isExactContractRef(source?.mediaImportRef, ["cineweave_codex_media_import"]), label + ": source media must bind an exact MediaImport");
    push(errors, nonEmpty(source?.mediaId), label + ": source media must name a MediaImport media ID");
    if (metadataStatus === "unknown") {
      push(errors, metadataFields.every((field) => metadata?.[field] === "unknown"), label + ": unknown metadata must keep every signal field unknown");
      push(errors, assignment?.assignmentStatus === "unknown" && assignment?.name === "unknown" && assignment?.basis === "unknown", label + ": unknown metadata cannot claim an input color space");
      push(errors, !Object.hasOwn(metadata, "evidence"), label + ": unknown metadata cannot claim probe evidence");
    } else if (metadataStatus === "declared") {
      push(errors, metadataFields.every((field) => nonEmpty(metadata?.[field]) && metadata[field] !== "unknown"), label + ": declared metadata must name every signal field without claiming unknown");
      push(errors, assignment?.assignmentStatus === "declared" && assignment?.name !== "unknown" && assignment?.basis !== "unknown", label + ": declared metadata requires a declared non-unknown input color space");
      push(errors, !Object.hasOwn(metadata, "evidence"), label + ": declared metadata must not claim verified probe evidence");
    } else if (metadataStatus === "verified") {
      const evidence = metadata?.evidence || {};
      push(errors, metadataFields.every((field) => nonEmpty(metadata?.[field]) && metadata[field] !== "unknown"), label + ": verified metadata must name every signal field");
      push(errors, assignment?.assignmentStatus === "verified" && assignment?.name !== "unknown" && assignment?.basis !== "unknown", label + ": verified metadata requires a verified input color space");
      push(errors, nonEmpty(evidence?.method) && nonEmpty(evidence?.tool) && nonEmpty(evidence?.toolVersion) && !Number.isNaN(Date.parse(evidence?.observedAt || "")), label + ": verified metadata requires dated probe evidence");
      push(errors, isExactContractRef(source?.technicalProbeRef, ["cineweave_codex_media_technical_probe"]), label + ": verified metadata requires an exact MediaTechnicalProbe");
      const probes = context?.mediaTechnicalProbes || [];
      const probe = probes.find((candidate) => sameExactRef(source?.technicalProbeRef, candidate?.artifactRef));
      if (Array.isArray(context?.mediaTechnicalProbes)) {
        push(errors, Boolean(probe?.payload), label + ": verified metadata must resolve to supplied MediaTechnicalProbe evidence");
      }
      if (probe?.payload) {
        push(errors, sameExactRef(source?.mediaImportRef, probe.payload.mediaImportRef) && source?.mediaId === probe.payload.mediaId, label + ": verified metadata probe must bind the same exact MediaImport media");
      }
    }
  }

  const policy = payload?.referenceSpacePolicy || {};
  push(errors, policy?.sceneReferenceSpace === "scene_referred" && policy?.displayReferenceSpace === "display_referred" && policy?.workingRole === "scene_linear" && nonEmpty(policy?.workingColorSpace), "ColorPipelineProfile must keep scene and display reference spaces distinct with a scene_linear working role");
  push(errors, unique(targetIds), "ColorPipelineProfile output target IDs must be unique");
  push(errors, targetPurposes.filter((purpose) => purpose === "preview").length === 1 && targetPurposes.filter((purpose) => purpose === "delivery").length === 1, "ColorPipelineProfile requires exactly one preview and one delivery target");
  for (const target of outputTargets) {
    const label = target?.targetId || "ColorPipelineProfile output target";
    const path = target?.path || {};
    if (path?.mode === "colorspace") {
      push(errors, nonEmpty(path?.colorspace) && !Object.hasOwn(path, "viewTransform") && !Object.hasOwn(path, "displayColorSpace"), label + ": colorspace path requires only a colorspace");
      push(errors, target?.outputColorSpace === path?.colorspace, label + ": colorspace path outputColorSpace must match its colorspace");
    } else if (path?.mode === "view_transform_and_display_colorspace") {
      push(errors, nonEmpty(path?.viewTransform) && nonEmpty(path?.displayColorSpace) && !Object.hasOwn(path, "colorspace"), label + ": view_transform path requires both viewTransform and displayColorSpace");
      push(errors, target?.outputColorSpace === path?.displayColorSpace, label + ": view_transform path outputColorSpace must match its displayColorSpace");
    }
  }

  push(errors, payload?.creativeLookPolicy?.appliesCreativeLook === false && Array.isArray(payload?.creativeLookPolicy?.creativeLookTransformNames) && payload.creativeLookPolicy.creativeLookTransformNames.length === 0 && payload?.creativeLookPolicy?.ownerBoundary === "style-intent-separate", "ColorPipelineProfile must keep creative looks with Style intent rather than silently applying them");
  push(errors, payload?.executionBoundary?.providerNeutral === true && payload?.executionBoundary?.loadsOcioConfig === false && payload?.executionBoundary?.appliesColorTransforms === false && payload?.executionBoundary?.writesMedia === false && payload?.executionBoundary?.exportsLut === false && payload?.executionBoundary?.humanApprovalRequired === true, "ColorPipelineProfile must not load an OCIO config, apply transforms, write media or export LUTs");
  for (const key of ["configIdentityExact", "sourceBindingsExact", "metadataHonest", "referenceSpacesSeparated", "outputPathsDeclared", "previewDeliverySeparated", "providerNeutral"]) push(errors, payload?.validation?.[key] === true, "ColorPipelineProfile validation." + key + " must be true");
}

function validateMediaTechnicalProbe(payload, errors, context = {}) {
  const container = payload?.container || {};
  const streams = payload?.streams || {};
  const probeTool = payload?.probeTool || {};
  const videoStreams = streams?.video || [];
  const audioStreams = streams?.audio || [];
  const allStreams = [...videoStreams, ...audioStreams];
  const isReported = (measurement) => measurement?.status === "reported" && Object.hasOwn(measurement, "value");
  const isReportedRational = (measurement) => measurement?.status === "reported"
    && Number.isSafeInteger(measurement?.numerator) && measurement.numerator > 0
    && Number.isSafeInteger(measurement?.denominator) && measurement.denominator > 0
    && measurement?.source !== "not_reported";

  push(errors, nonEmpty(payload?.mediaTechnicalProbeId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "MediaTechnicalProbe requires a stable identity and version");
  push(errors, isExactContractRef(payload?.mediaImportRef, ["cineweave_codex_media_import"]), "MediaTechnicalProbe must bind an exact MediaImport");
  push(errors, nonEmpty(payload?.mediaId) && /^sha256:[0-9a-f]{64}$/.test(payload?.mediaContentHash || "") && Number.isSafeInteger(payload?.mediaByteSize) && payload.mediaByteSize > 0, "MediaTechnicalProbe must bind one exact media ID, byte hash and size");
  push(errors, unique(allStreams.map((stream) => stream?.streamIndex)), "MediaTechnicalProbe stream indexes must be unique across video and audio streams");

  if (context?.mediaImport) {
    const sourceMedia = (context.mediaImport.media || []).find((item) => item?.mediaId === payload?.mediaId);
    push(errors, payload?.mediaImportRef?.id === context.mediaImport.mediaImportId && payload?.mediaImportRef?.version === context.mediaImport.version, "MediaTechnicalProbe mediaImportRef must match the supplied MediaImport");
    push(errors, Boolean(sourceMedia), "MediaTechnicalProbe mediaId must exist in the supplied MediaImport");
    if (sourceMedia) {
      push(errors, payload?.mediaContentHash === sourceMedia.contentHash, "MediaTechnicalProbe mediaContentHash must match the supplied MediaImport media bytes");
      push(errors, payload?.mediaByteSize === sourceMedia.byteSize, "MediaTechnicalProbe mediaByteSize must match the supplied MediaImport media");
    }
  }

  if (payload?.probeStatus === "planned") {
    push(errors, probeTool?.executionState === "not_invoked", "planned MediaTechnicalProbe cannot claim ffprobe execution");
    push(errors, container?.status === "not_probed" && (container?.formatNames || []).length === 0, "planned MediaTechnicalProbe cannot claim a container report");
    push(errors, streams?.status === "not_probed" && videoStreams.length === 0 && audioStreams.length === 0 && streams?.otherStreamCount === 0, "planned MediaTechnicalProbe cannot claim stream findings");
  } else if (payload?.probeStatus === "recorded") {
    push(errors, probeTool?.executionState === "ffprobe_recorded" && probeTool?.toolId === "ffprobe" && nonEmpty(probeTool?.toolVersion) && probeTool?.commandProfile === "ffprobe_format_streams_json_v1" && /^sha256:[0-9a-f]{64}$/.test(probeTool?.sanitizedReportHash || "") && !Number.isNaN(Date.parse(probeTool?.observedAt || "")), "recorded MediaTechnicalProbe requires an immutable sanitized ffprobe report");
    push(errors, container?.status === "probed" && Array.isArray(container?.formatNames) && container.formatNames.length > 0 && container?.metadataExcluded === true, "recorded MediaTechnicalProbe requires a sanitized container report");
    push(errors, streams?.status === "probed" && allStreams.length + Number(streams?.otherStreamCount || 0) > 0, "recorded MediaTechnicalProbe requires at least one observed stream");
    if (isReported(container?.reportedByteSize)) push(errors, container.reportedByteSize.value === payload?.mediaByteSize, "MediaTechnicalProbe reported container size must match the bound media size");
    for (const stream of videoStreams) {
      push(errors, Number.isSafeInteger(stream?.streamIndex) && stream.streamIndex >= 0 && nonEmpty(stream?.codecName) && Number.isSafeInteger(stream?.width) && stream.width > 0 && Number.isSafeInteger(stream?.height) && stream.height > 0, "MediaTechnicalProbe video streams require codec and dimensions");
      for (const measurement of [stream?.sampleAspectRatio, stream?.displayAspectRatio, stream?.frameRate, stream?.timeBase]) {
        if (measurement?.status === "reported") push(errors, isReportedRational(measurement), "MediaTechnicalProbe reported video rationals must be positive and explicit");
      }
      for (const measurement of [stream?.codecProfile, stream?.codecTag, stream?.pixelFormat, stream?.bitDepth, stream?.fieldOrder, stream?.durationSeconds, stream?.bitRate, stream?.colorSignals?.primaries, stream?.colorSignals?.transfer, stream?.colorSignals?.matrix, stream?.colorSignals?.range]) {
        if (measurement?.status === "reported") push(errors, isReported(measurement), "MediaTechnicalProbe reported video fields must retain their value");
      }
    }
    for (const stream of audioStreams) {
      push(errors, Number.isSafeInteger(stream?.streamIndex) && stream.streamIndex >= 0 && nonEmpty(stream?.codecName), "MediaTechnicalProbe audio streams require a codec");
      if (stream?.timeBase?.status === "reported") push(errors, isReportedRational(stream.timeBase), "MediaTechnicalProbe reported audio time bases must be positive and explicit");
      for (const measurement of [stream?.codecProfile, stream?.codecTag, stream?.sampleRate, stream?.channels, stream?.channelLayout, stream?.durationSeconds, stream?.bitRate]) {
        if (measurement?.status === "reported") push(errors, isReported(measurement), "MediaTechnicalProbe reported audio fields must retain their value");
      }
    }
  }

  push(errors, payload?.executionBoundary?.usesLocalProbeTool === true && payload?.executionBoundary?.callsNetwork === false && payload?.executionBoundary?.writesSourceMedia === false && payload?.executionBoundary?.writesDerivedMedia === false && payload?.executionBoundary?.storesRawFilePath === false && payload?.executionBoundary?.storesRawContainerTags === false && payload?.executionBoundary?.humanReviewRequired === true, "MediaTechnicalProbe must stay local, read-only and free of raw paths/tags");
  for (const key of ["sourceBindingExact", "mediaHashExact", "probeStateConsistent", "missingFieldsExplicit", "sensitiveFieldsExcluded"]) push(errors, payload?.validation?.[key] === true, "MediaTechnicalProbe validation." + key + " must be true");
}

function validateContentCredentialInspection(payload, errors, context = {}) {
  const checks = payload?.result?.checks || {};
  const checkNames = ["assertions", "claimSignature", "hardBinding", "ingredients", "timestamp", "credentialRevocation", "assetContent"];
  const result = payload?.result || {};
  const validator = payload?.validator || {};
  const manifestStore = payload?.manifestStore || {};
  const successCodes = result?.successCodes || [];
  const failureCodes = result?.failureCodes || [];
  const allChecks = (value) => checkNames.every((name) => checks?.[name] === value);

  push(errors, nonEmpty(payload?.contentCredentialInspectionId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "ContentCredentialInspection requires a stable identity and version");
  push(errors, isExactContractRef(payload?.referenceAssetRef, ["cineweave_codex_reference_asset"]), "ContentCredentialInspection must bind an exact ReferenceAsset");
  push(errors, /^sha256:[0-9a-f]{64}$/.test(payload?.assetByteHash || ""), "ContentCredentialInspection must bind an exact asset byte hash");
  if (context?.referenceAsset) {
    push(errors, payload?.referenceAssetRef?.id === context.referenceAsset.assetId && payload?.referenceAssetRef?.version === context.referenceAsset.version, "ContentCredentialInspection referenceAssetRef must match the supplied ReferenceAsset");
    push(errors, payload?.assetByteHash === context.referenceAsset.media?.contentHash, "ContentCredentialInspection assetByteHash must match the supplied ReferenceAsset bytes");
  }
  push(errors, result?.rightsConclusion === "not_determined" && result?.truthConclusion === "not_determined", "ContentCredentialInspection must not make truth or rights conclusions");

  if (payload?.inspectionStatus === "planned") {
    push(errors, validator?.executionState === "not_invoked" && !Object.hasOwn(validator, "validatorId") && !Object.hasOwn(validator, "reportHash"), "planned inspection cannot claim a validator was invoked");
    push(errors, manifestStore?.inspectionState === "not_inspected", "planned inspection cannot claim a manifest-store state");
    push(errors, result?.validationState === "not_checked" && result?.signerTrust === "not_checked" && allChecks("not_checked") && successCodes.length === 0 && failureCodes.length === 0, "planned inspection cannot claim a manifest validation result");
  } else if (payload?.inspectionStatus === "recorded") {
    push(errors, validator?.executionState === "external_report_recorded" && nonEmpty(validator?.validatorId) && nonEmpty(validator?.validatorVersion) && /^sha256:[0-9a-f]{64}$/.test(validator?.reportHash || "") && !Number.isNaN(Date.parse(validator?.recordedAt || "")), "recorded inspection requires immutable external validator report evidence");
    if (manifestStore?.inspectionState === "absent") {
      push(errors, result?.validationState === "absent" && allChecks("not_applicable") && result?.signerTrust === "not_checked" && successCodes.length === 0 && failureCodes.length === 0, "recorded absent manifest inspection must remain not applicable");
    } else if (manifestStore?.inspectionState === "present") {
      push(errors, Number.isSafeInteger(manifestStore?.manifestCount) && manifestStore.manifestCount >= 1 && nonEmpty(manifestStore?.activeManifestLabel) && /^sha256:[0-9a-f]{64}$/.test(manifestStore?.activeManifestHash || "") && nonEmpty(manifestStore?.specVersion), "recorded present manifest inspection requires active manifest identity");
      push(errors, !["not_checked", "absent"].includes(result?.validationState), "recorded present manifest inspection must report a validation state");
      if (["valid", "trusted"].includes(result?.validationState)) {
        push(errors, checks?.assertions === "pass" && checks?.claimSignature === "pass" && checks?.hardBinding === "pass" && checks?.assetContent === "pass" && failureCodes.length === 0, "valid or trusted C2PA result requires passing assertions, signature, hard binding and asset content");
      }
      if (result?.validationState === "valid") push(errors, ["valid_untrusted_signer", "trusted"].includes(result?.signerTrust), "valid C2PA result requires signer-trust classification");
      if (result?.validationState === "trusted") push(errors, result?.signerTrust === "trusted", "trusted C2PA result requires a trusted signer");
      if (result?.validationState === "invalid") push(errors, failureCodes.length > 0 || checkNames.some((name) => checks?.[name] === "fail"), "invalid C2PA result requires a failure code or failed validation check");
    }
  }

  push(errors, payload?.executionBoundary?.providerNeutral === true && payload?.executionBoundary?.runsValidator === false && payload?.executionBoundary?.writesMedia === false && payload?.executionBoundary?.writesManifest === false && payload?.executionBoundary?.humanReviewRequired === true, "ContentCredentialInspection records evidence but does not execute a validator or write media/manifests");
  for (const key of ["assetByteBindingExact", "statusConsistent", "c2paScopeOnly", "rightsSeparate", "truthSeparate", "noValidatorExecutionClaim"]) push(errors, payload?.validation?.[key] === true, "ContentCredentialInspection validation." + key + " must be true");
}

function validateContentCredentialHandoff(payload, errors, context = {}) {
  push(errors, nonEmpty(payload?.contentCredentialHandoffId) && Number.isSafeInteger(payload?.version) && payload.version >= 1, "ContentCredentialHandoff requires a stable identity and version");
  push(errors, isExactContractRef(payload?.referenceAssetRef, ["cineweave_codex_reference_asset"]), "ContentCredentialHandoff must bind an exact ReferenceAsset");
  push(errors, isExactContractRef(payload?.contentCredentialInspectionRef, ["cineweave_codex_content_credential_inspection"]), "ContentCredentialHandoff must bind an exact ContentCredentialInspection");
  if (context?.referenceAsset) push(errors, payload?.referenceAssetRef?.id === context.referenceAsset.assetId && payload?.referenceAssetRef?.version === context.referenceAsset.version, "ContentCredentialHandoff referenceAssetRef must match the supplied ReferenceAsset");
  if (context?.contentCredentialInspection) {
    push(errors, payload?.contentCredentialInspectionRef?.id === context.contentCredentialInspection.contentCredentialInspectionId && payload?.contentCredentialInspectionRef?.version === context.contentCredentialInspection.version, "ContentCredentialHandoff inspection ref must match the supplied ContentCredentialInspection");
    push(errors, sameExactRef(payload?.referenceAssetRef, context.contentCredentialInspection.referenceAssetRef), "ContentCredentialHandoff and ContentCredentialInspection must bind the same exact ReferenceAsset");
  }
  push(errors, payload?.handoffStatus === "planned", "ContentCredentialHandoff must remain planned until an approved adapter records a separate execution result");
  const requirement = payload?.inspectionRequirement || {};
  push(errors, requirement?.requiresRecordedInspectionBeforeExternalTransfer === true && requirement?.requiresDerivedOutputRevalidation === true && requirement?.credentialPresenceIsNotRightsEvidence === true && requirement?.credentialValidityIsNotTruthEvidence === true, "ContentCredentialHandoff must require inspection and keep C2PA separate from rights and truth");
  const plan = payload?.provenancePlan || {};
  push(errors, plan?.sourceRelationship === "ingredient_planned" && plan?.manifestAction === "not_performed" && plan?.rawManifestEmbedded === false && plan?.manifestLocationStored === false, "ContentCredentialHandoff must not claim a manifest was embedded or written");
  push(errors, payload?.executionBoundary?.providerNeutral === true && payload?.executionBoundary?.invokesAdapter === false && payload?.executionBoundary?.writesMedia === false && payload?.executionBoundary?.writesManifest === false && payload?.executionBoundary?.exportsAsset === false && payload?.executionBoundary?.humanApprovalRequired === true, "ContentCredentialHandoff must remain non-executing and non-writing");
  for (const key of ["sourceRefsExact", "inspectionRequired", "ingredientOnlyPlanned", "rightsSeparate", "truthSeparate", "providerNeutral"]) push(errors, payload?.validation?.[key] === true, "ContentCredentialHandoff validation." + key + " must be true");
}

function validateDirectorRepair(payload, errors, context = {}) {
  const observedFailure = payload?.observedFailure || {};
  const change = payload?.change || {};
  const targetKind = payload?.targetRef?.kind;
  const allowedKinds = {
    dramatic_purpose: ["cineweave_codex_shot_spec", "cineweave_codex_storyboard_sequence"],
    action_blocking: ["cineweave_codex_action_sequence_spec", "cineweave_codex_shot_spec", "cineweave_codex_storyboard_sequence"],
    camera: ["cineweave_codex_shot_spec", "cineweave_codex_storyboard_sequence", "cineweave_codex_camera_previs_spec"],
    composition: ["cineweave_codex_shot_spec", "cineweave_codex_storyboard_sequence"],
    shot_light_use: ["cineweave_codex_shot_lighting_plan"],
    temporal_curve: ["cineweave_codex_temporal_spec"],
    coverage: ["cineweave_codex_action_sequence_spec", "cineweave_codex_storyboard_sequence"],
    render_intent: ["cineweave_codex_render_plan"]
  };
  if (payload?.disposition === "repair") {
    push(errors, observedFailure?.owningDomain === "director", "DirectorRepair direct repair must retain Director ownership");
    push(errors, observedFailure?.variable === change?.variable, "DirectorRepair change variable must match the observed failure variable");
    const acceptedKinds = allowedKinds[change?.variable] || [];
    if (change?.variable === "camera") push(errors, acceptedKinds.includes(targetKind), "DirectorRepair camera repair must target ShotSpec or Storyboard; CameraPrevisSpec is also permitted");
    else push(errors, acceptedKinds.includes(targetKind), "DirectorRepair target contract is incompatible with its owning variable");
    if (change?.variable === "camera") {
      const targetPath = change?.targetPath || "";
      push(errors, targetPath.startsWith("camera.") || targetPath.startsWith("motion.") || /^tracks\.(?:pose|intrinsics)(?:\[|\.)/.test(targetPath) || /^shots\[\d+\]\.(?:cameraAngle|cameraHeight|lens|movement)/.test(targetPath), "DirectorRepair camera repair must change a camera path");
    }
    if (change?.variable === "render_intent") {
      const targetPath = change?.targetPath || "";
      push(errors, /^(?:mode|canvas(?:\.|$)|qualityBudget|variantCount|requiredCapabilities(?:\[|\.|$))/.test(targetPath), "DirectorRepair render intent repair must change a render intent path");
    }
    const targetIdFields = {
      cineweave_codex_action_sequence_spec: "actionSequenceId",
      cineweave_codex_shot_spec: "shotSpecId",
      cineweave_codex_shot_lighting_plan: "lightingPlanId",
      cineweave_codex_temporal_spec: "temporalSpecId",
      cineweave_codex_camera_previs_spec: "cameraPrevisSpecId",
      cineweave_codex_storyboard_sequence: "storyboardId",
      cineweave_codex_render_plan: "renderPlanId"
    };
    const targetIdField = targetIdFields[targetKind];
    const suppliedTargets = context?.directorTargets || [];
    if (targetIdField && suppliedTargets.length > 0) {
      const target = suppliedTargets.find((candidate) => {
        const artifactRef = candidate?.envelope?.artifactRef || candidate?.artifactRef;
        if (artifactRef) {
          return artifactRef?.kind === payload?.targetRef?.kind
            && artifactRef?.id === payload?.targetRef?.id
            && artifactRef?.version === payload?.targetRef?.version
            && artifactRef?.contentHash === payload?.targetRef?.contentHash;
        }
        const targetPayload = candidate?.envelope?.payload || candidate;
        return targetPayload?.kind === targetKind
          && targetPayload?.[targetIdField] === payload?.targetRef?.id
          && targetPayload?.version === payload?.targetRef?.version
          && payload?.targetRef?.contentHash === sha256Canonical(targetPayload);
      });
      push(errors, Boolean(target), "DirectorRepair targetRef must match the supplied exact target artifact");
    }
  }
  if (payload?.disposition === "delegate") {
    push(errors, observedFailure?.owningDomain !== "director", "DirectorRepair delegation cannot retain Director ownership");
    push(errors, payload?.delegation?.owner === observedFailure?.owningDomain, "DirectorRepair delegation must name the observed failure owner");
    push(errors, !Object.hasOwn(payload || {}, "targetRef") && !Object.hasOwn(payload || {}, "change"), "DirectorRepair delegation must not carry a direct change");
  }
  push(errors, Array.isArray(observedFailure?.evidenceObservationIds) && observedFailure.evidenceObservationIds.length > 0 && unique(observedFailure.evidenceObservationIds), "DirectorRepair requires unique observed evidence");
  push(errors, Array.isArray(payload?.acceptanceChecks) && payload.acceptanceChecks.length > 0 && payload.acceptanceChecks.every((check) => check?.status === "pending"), "DirectorRepair acceptance checks must remain pending");
  push(errors, payload?.executionBoundary?.generatesMedia === false, "DirectorRepair must not claim media generation");
  push(errors, payload?.executionBoundary?.approvesAssets === false, "DirectorRepair must not claim asset approval");
  push(errors, payload?.validation?.singleVariable === true, "DirectorRepair must change one variable");
  push(errors, payload?.validation?.parentImmutable === true, "DirectorRepair must keep parent artifacts immutable");
  push(errors, payload?.validation?.evidenceBound === true, "DirectorRepair must bind observed evidence");
  push(errors, payload?.validation?.ownershipResolved === true, "DirectorRepair must resolve ownership");
  push(errors, payload?.validation?.noSuccessClaim === true, "DirectorRepair must not claim repair success");
}

function validateRepairRunReceipt(payload, errors) {
  const repairKinds = [
    "cineweave_codex_director_repair",
    "cineweave_codex_character_repair",
    "cineweave_codex_scene_repair",
    "cineweave_codex_prompt_repair"
  ];
  push(errors, isExactContractRef(payload?.repairRef, repairKinds), "RepairRunReceipt must bind an exact repair plan");
  push(errors, ["blocked", "failed", "awaiting_review"].includes(payload?.status), "RepairRunReceipt status is invalid");
  push(errors, Array.isArray(payload?.preserve) && payload.preserve.length > 0 && unique(payload.preserve), "RepairRunReceipt must preserve explicit constraints");
  const preserved = payload?.preservedInputRefs || [];
  const preservedAreExact = Array.isArray(preserved) && preserved.every((ref) => isExactContractRef(ref));
  push(errors, preservedAreExact, "RepairRunReceipt preserved input refs must be exact contract refs");
  if (preservedAreExact) push(errors, unique(preserved.map(exactRefKey)), "RepairRunReceipt preserved input refs must be unique");
  const before = payload?.before || {};
  const after = payload?.after || {};
  if (before.status === "captured") {
    push(errors, isExactContractRef(before.artifactRef), "Captured before snapshot must bind an exact artifact");
    push(errors, before.payloadHash === before.artifactRef?.contentHash, "Captured before snapshot hash must match its artifact ref");
  } else {
    push(errors, before.status === "not_captured" && before.artifactRef === null && before.payloadHash === null, "Uncaptured before snapshot must not claim an artifact or hash");
  }
  if (after.status === "captured") {
    push(errors, isExactContractRef(after.artifactRef), "Captured after snapshot must bind an exact artifact");
    push(errors, after.payloadHash === after.artifactRef?.contentHash, "Captured after snapshot hash must match its artifact ref");
  } else {
    push(errors, after.status === "not_captured" && after.artifactRef === null && after.payloadHash === null, "Uncaptured after snapshot must not claim an artifact or hash");
  }
  const change = payload?.changeEvidence || {};
  push(errors, nonEmpty(change.variable) && nonEmpty(change.targetPath) && nonEmpty(change.requestedTargetState), "RepairRunReceipt must record the requested variable and path");
  push(errors, Array.isArray(change.observedChangedPaths) && change.observedChangedPaths.length > 0 && unique(change.observedChangedPaths), "RepairRunReceipt must record observed changed paths");
  const approval = payload?.approvalEvidence || {};
  push(errors, approval.required === true, "RepairRunReceipt must require human approval");
  if (approval.decision === "approved") {
    push(errors, isExactContractRef(payload?.repairRef) && /^sha256:[0-9a-f]{64}$/.test(approval.approvalRecordHash || "") && approval.exactRepairHashMatched === true, "Approved repair run must bind an exact approval record");
  } else {
    push(errors, ["missing", "rejected"].includes(approval.decision) && approval.approvalRecordHash === null && approval.exactRepairHashMatched === false, "Unapproved repair run must not claim approval evidence");
  }
  if (payload?.adapter !== null) {
    push(errors, isObject(payload.adapter) && nonEmpty(payload.adapter.adapterId) && /^sha256:[0-9a-f]{64}$/.test(payload.adapter.implementationContentHash || ""), "RepairRunReceipt adapter identity is invalid");
    push(errors, payload.adapter.networkAccess === false && payload.adapter.writesMedia === false && payload.adapter.mutatesParent === false && payload.adapter.providerNeutral === true, "RepairRunReceipt adapter must be local, non-writing and provider-neutral");
  }
  const boundary = payload?.executionBoundary || {};
  for (const [key, expected] of Object.entries({
    providerNeutral: true,
    callsNetwork: false,
    writesSourceMedia: false,
    writesDerivedMedia: false,
    mutatesParentArtifact: false,
    claimsApproval: false,
    humanReviewRequired: true
  })) push(errors, boundary[key] === expected, "RepairRunReceipt execution boundary." + key + " is unsafe");
  push(errors, payload?.acceptance?.status === "pending" && payload?.acceptance?.humanReviewRequired === true, "RepairRunReceipt acceptance must remain pending for human review");
  push(errors, Array.isArray(payload?.acceptance?.checkIds) && payload.acceptance.checkIds.length > 0 && unique(payload.acceptance.checkIds), "RepairRunReceipt acceptance check IDs must be unique");
  push(errors, payload?.validation?.parentImmutable === true && payload?.validation?.noSuccessClaim === true, "RepairRunReceipt must preserve the parent and avoid a success claim");
  if (payload?.status === "awaiting_review") {
    push(errors, isExactContractRef(payload?.targetRef) && isExactContractRef(payload?.candidateRef), "Awaiting-review receipt must bind exact target and candidate artifacts");
    push(errors, sameExactRef(payload?.before?.artifactRef, payload?.targetRef), "Awaiting-review before snapshot must match targetRef");
    push(errors, sameExactRef(payload?.after?.artifactRef, payload?.candidateRef), "Awaiting-review after snapshot must match candidateRef");
    push(errors, payload?.candidateRef?.kind === payload?.targetRef?.kind && payload?.candidateRef?.id === payload?.targetRef?.id && payload?.candidateRef?.version === payload?.targetRef?.version + 1, "Repair candidate must be the next immutable version of its target");
    push(errors, payload?.failure === null, "Awaiting-review receipt must not carry a failure");
    for (const key of ["repairPlanValid", "targetExact", "preservedInputRefsExact", "changedPathBounded", "candidateSchemaValid", "candidateSemanticValid"]) {
      push(errors, payload?.validation?.[key] === true, "Awaiting-review receipt requires validation." + key);
    }
  } else {
    push(errors, payload?.candidateRef === null && payload?.after?.status === "not_captured" && isObject(payload?.failure), "Blocked or failed repair run must not claim a candidate");
  }
}

function exactRefKey(ref) {
  return `${ref?.kind}/${ref?.id}@${ref?.version}:${ref?.contentHash}`;
}

function validateReferenceAsset(payload, errors) {
  const media = payload?.media || {};
  const blob = payload?.blob || {};
  const source = payload?.source || {};
  const digest = String(media.contentHash || "").replace(/^sha256:/, "");
  const expectedPath = `reference-blobs/sha256/${digest.slice(0, 2)}/${digest}.blob`;
  const expectedAssetId = `reference.${source.sourceClass}.${digest}`;
  const formats = {
    png: { kinds: ["image"], types: ["image/png"], extension: ".png" },
    jpeg: { kinds: ["image"], types: ["image/jpeg"], extension: ".jpg" },
    webp: { kinds: ["image"], types: ["image/webp"], extension: ".webp" },
    mp4: { kinds: ["video"], types: ["video/mp4"], extension: ".mp4" },
    quicktime: { kinds: ["video"], types: ["video/quicktime"], extension: ".mov" },
    webm: { kinds: ["video"], types: ["video/webm"], extension: ".webm" }
  };
  const format = formats[media.format];
  push(errors, Boolean(format), "ReferenceAsset format must be supported");
  if (format) {
    push(errors, format.kinds.includes(media.mediaKind), "ReferenceAsset media kind must match format");
    push(errors, format.types.includes(media.mediaType), "ReferenceAsset media type must match format");
    push(errors, format.extension === media.sourceExtension, "ReferenceAsset canonical source extension must match format");
  }
  push(errors, media.contentHash === blob.contentHash, "ReferenceAsset media and blob hashes must match");
  push(errors, media.byteLength === blob.byteLength, "ReferenceAsset media and blob byte lengths must match");
  push(errors, blob.relativePath === expectedPath, "ReferenceAsset blob path must match its SHA-256 digest and shard");
  push(errors, payload?.assetId === expectedAssetId, "ReferenceAsset ID must bind source class and byte digest");
  push(errors, payload?.label === `${media.mediaKind}-reference-${digest.slice(0, 12)}`, "ReferenceAsset label must be generated from media kind and digest");
  push(errors, source.sourceLocatorStored === false && source.originalFilenameStored === false && source.importCreatesRights === false, "ReferenceAsset must not retain source locators or imply rights");
  push(errors, payload?.privacy?.sourcePathStored === false && payload?.privacy?.originalBytesRetained === true, "ReferenceAsset privacy state must match immutable byte storage");
  push(errors, payload?.safety?.extensionAllowlisted === true && payload?.safety?.signatureMatched === true && payload?.safety?.activeContentExecuted === false, "ReferenceAsset safety state must record allow-listing, signature matching and no active execution");
  push(errors, payload?.rights?.requiresSeparateLicenseProfile === true, "ReferenceAsset rights require a separate LicenseProfile");
  const credentials = payload?.provenance?.contentCredentials || {};
  if (["not_checked", "absent"].includes(credentials.status)) push(errors, credentials.trust === "unknown" && !credentials.manifestHash && !credentials.specVersion, "ReferenceAsset unchecked or absent content credentials cannot claim manifest or trust evidence");
  if (credentials.status === "present_unverified") push(errors, ["unknown", "untrusted"].includes(credentials.trust), "ReferenceAsset unverified content credentials cannot claim a valid or trusted signer");
  if (credentials.status === "valid") push(errors, ["valid_untrusted_signer", "trusted"].includes(credentials.trust) && Boolean(credentials.manifestHash) && Boolean(credentials.specVersion), "ReferenceAsset valid content credentials require manifest, spec and signer-trust evidence");
  if (credentials.status === "invalid") push(errors, credentials.trust === "untrusted", "ReferenceAsset invalid content credentials must be untrusted");
  if (payload?.rights?.status === "unknown") {
    for (const key of ["assetOwnership", "generationUse", "redistribution", "trainingUse", "likenessConsent"]) push(errors, payload.rights[key] === "unknown", `ReferenceAsset unknown rights cannot claim ${key}`);
    push(errors, !payload.rights.licenseProfileRef, "ReferenceAsset unknown rights cannot cite a resolved LicenseProfile");
  }
  if (payload?.rights?.status === "verified") {
    push(errors, payload.rights.licenseProfileRef?.kind === "cineweave_codex_license_profile", "ReferenceAsset verified rights require an exact LicenseProfile");
    for (const key of ["assetOwnership", "generationUse", "redistribution", "trainingUse", "likenessConsent"]) push(errors, payload.rights[key] !== "unknown", `ReferenceAsset verified rights must resolve ${key}`);
  }
  if (media.mediaKind === "image") {
    push(errors, media.technical?.probeLevel === "signature_and_dimensions", "ReferenceAsset image must have signature and dimension evidence");
    push(errors, Number.isSafeInteger(media.technical?.width) && Number.isSafeInteger(media.technical?.height), "ReferenceAsset image dimensions must be known");
    if (Number.isSafeInteger(media.technical?.width) && Number.isSafeInteger(media.technical?.height)) {
      push(errors, media.technical.width <= 65535 && media.technical.height <= 65535 && media.technical.width * media.technical.height <= 100_000_000, "ReferenceAsset image dimensions must remain inside the runtime safety budget");
    }
    push(errors, media.byteLength <= 64 * 1024 * 1024, "ReferenceAsset image byte length must remain inside the runtime safety budget");
  } else {
    push(errors, media.technical?.probeLevel === "container_signature_only", "ReferenceAsset video ingest must not overstate its probe depth");
    push(errors, media.technical?.width === undefined && media.technical?.height === undefined, "ReferenceAsset video container probe cannot claim decoded dimensions");
  }
}

function validateReferenceObservation(payload, errors, referenceAsset) {
  const selector = payload?.selector || {};
  const transfer = payload?.transfer || {};
  push(errors, payload?.assetRef?.kind === "cineweave_codex_reference_asset", "ReferenceObservation must bind an exact ReferenceAsset");
  if (referenceAsset) {
    push(errors, payload?.assetRef?.id === referenceAsset.assetId && payload?.assetRef?.version === referenceAsset.version, "ReferenceObservation asset ref must match the supplied ReferenceAsset");
  }
  const expectedFields = {
    full_asset: [],
    spatial_rect: ["normalizedRect"],
    temporal_range: ["temporalRange"],
    spatiotemporal_rect: ["normalizedRect", "temporalRange"],
    mask_asset: ["maskAssetRef"]
  };
  const required = expectedFields[selector.type] || [];
  for (const field of ["normalizedRect", "temporalRange", "maskAssetRef"]) push(errors, required.includes(field) === (selector[field] !== undefined), `ReferenceObservation selector ${selector.type} has inconsistent ${field}`);
  if (selector.normalizedRect) {
    const { x, y, width, height } = selector.normalizedRect;
    push(errors, x + width <= 1.000000001 && y + height <= 1.000000001, "ReferenceObservation normalized rectangle must remain inside the asset");
  }
  if (selector.temporalRange) {
    push(errors, selector.temporalRange.startMs < selector.temporalRange.endMs, "ReferenceObservation temporal range must have positive duration");
    if (referenceAsset?.media?.mediaKind) push(errors, referenceAsset.media.mediaKind === "video", "ReferenceObservation temporal selectors require video media");
  }
  if (selector.maskAssetRef) push(errors, selector.maskAssetRef.kind === "cineweave_codex_reference_asset", "ReferenceObservation mask must be an exact ReferenceAsset ref");
  const extract = transfer.extract || [];
  const ignore = new Set((transfer.ignore || []).map((item) => String(item).trim().toLocaleLowerCase()));
  push(errors, extract.every((item) => !ignore.has(String(item).trim().toLocaleLowerCase())), "ReferenceObservation extract and ignore lists must be disjoint");
  const authorityDomain = {
    identity: "identity", face_identity: "identity", body_identity: "identity", face_morphology: "identity", body_morphology: "identity", skin_surface: "identity", eye_surface: "identity",
    appearance: "appearance", skin_material: "appearance", makeup: "appearance", hair: "appearance", hair_material: "appearance", costume: "appearance", prop: "appearance",
    expression: "performance", pose: "performance", motion: "performance", performance: "performance",
    capture: "capture", composition: "capture", lighting: "capture", camera_motion: "capture",
    palette: "style", material: "style", style: "style", representation_geometry: "style", shape_language: "style", linework: "style", surface_style: "style", shading: "style", color_system: "style", depth_language: "style", effects: "style", panel_layout: "style", typography: "style", motion_style: "style",
    environment: "environment", geography: "environment", architecture: "environment", prop_layout: "environment", atmosphere: "environment", temporal_atmosphere: "environment"
  }[payload?.role];
  if (authorityDomain) push(errors, (payload?.authority?.[authorityDomain] || 0) > 0, `ReferenceObservation primary role requires nonzero ${authorityDomain} authority`);
  const gate = payload?.rightsGate || {};
  if (["unknown", "restricted", "blocked"].includes(gate.status)) {
    push(errors, gate.allowedForProduction === false && gate.allowedForRedistribution === false, "ReferenceObservation unresolved or restricted rights must block production and redistribution");
  }
  if (gate.status === "verified") push(errors, gate.licenseProfileRef?.kind === "cineweave_codex_license_profile", "ReferenceObservation verified rights require an exact LicenseProfile ref");
}

function validateReferenceReview(payload, errors) {
  if (payload?.source?.assetRef) push(errors, payload.source.assetRef.kind === "cineweave_codex_reference_asset", "ReferenceReview source asset must be an exact ReferenceAsset");
  push(errors, nonEmpty(payload?.reviewId) && Number.isInteger(payload?.version), "ReferenceReview requires a versioned review identity");
  push(errors, payload?.validation?.reviewIdentityVersioned === true, "ReferenceReview must declare its versioned identity");
  const dimensions = (payload?.scores || []).map((item) => item?.dimension);
  push(errors, unique(dimensions), "ReferenceReview score dimensions must be unique");
  const contract = payload?.referenceContract || {};
  const groups = ["preserve", "borrow", "exclude"].map((key) => new Set((contract[key] || []).map((item) => String(item).trim().toLocaleLowerCase())));
  for (let left = 0; left < groups.length; left += 1) for (let right = left + 1; right < groups.length; right += 1) {
    push(errors, [...groups[left]].every((item) => !groups[right].has(item)), "ReferenceReview preserve, borrow and exclude lists must be disjoint");
  }
}

function validateReferenceBindingSet(payload, errors, observations = []) {
  const bindings = payload?.bindings || [];
  const keys = bindings.map((binding) => exactRefKey(binding?.observationRef));
  push(errors, unique(keys), "ReferenceBindingSet observation refs must be unique");
  for (const binding of bindings) push(errors, binding?.observationRef?.kind === "cineweave_codex_reference_observation", "ReferenceBindingSet bindings must reference ReferenceObservation artifacts");
  const targetKeys = (payload?.targetRefs || []).map(exactRefKey);
  push(errors, unique(targetKeys), "ReferenceBindingSet target refs must be unique");
  const order = payload?.resolutionOrder || [];
  push(errors, unique(order), "ReferenceBindingSet resolution order must not repeat roles");
  push(errors, bindings.every((binding) => order.includes(binding?.role)), "ReferenceBindingSet resolution order must include every bound role");
  if (payload?.conflictPolicy?.sameRoleConflict === "explicit_priority") {
    const priorities = new Map();
    for (const binding of bindings) {
      const values = priorities.get(binding.role) || [];
      values.push(binding.priority);
      priorities.set(binding.role, values);
    }
    for (const [role, values] of priorities) push(errors, unique(values), `ReferenceBindingSet ${role} conflicts require distinct priorities`);
  }
  push(errors, payload?.conflictPolicy?.identityCannotBeOverridden === true && payload?.conflictPolicy?.geographyCannotBeOverridden === true, "ReferenceBindingSet must protect identity and geography");
  const rights = payload?.rightsPolicy || {};
  const unresolved = rights.unresolvedObservationIds || [];
  push(errors, rights.allProfilesResolved === (unresolved.length === 0), "ReferenceBindingSet resolved status must match unresolved observations");
  if (rights.redistributionAllowed) push(errors, rights.allProfilesResolved === true && unresolved.length === 0, "ReferenceBindingSet redistribution requires all profiles resolved");
  if (["active", "locked"].includes(payload?.status)) {
    push(errors, rights.allProfilesResolved === true && unresolved.length === 0, "Active or locked ReferenceBindingSet cannot contain unresolved rights");
    push(errors, rights.unresolvedBehavior !== "warn_exploration", "Active or locked ReferenceBindingSet cannot use an exploration-only rights warning");
  }
  if (observations.length) {
    const byKey = new Map(observations.map((item) => [exactRefKey(item.artifactRef), item.payload || item]));
    for (const binding of bindings) {
      const observation = byKey.get(exactRefKey(binding.observationRef));
      if (!observation) continue;
      push(errors, observation.role === binding.role, "ReferenceBindingSet role must match its exact observation");
      if (["active", "locked"].includes(payload?.status)) push(errors, observation.status === "approved", "Active or locked bindings require approved observations");
    }
  }
}

function validateArtifactGraph(payload, errors) {
  const nodes = payload?.nodes || [];
  const edges = payload?.edges || [];
  const nodeKeys = new Set(nodes.map((node) => node?.key));
  push(errors, nodeKeys.size === nodes.length, "ArtifactGraph node keys must be unique");
  for (const node of nodes) push(errors, node?.key === exactRefKey(node?.artifactRef), `ArtifactGraph node key must match its exact ref: ${node?.key}`);
  for (const edge of edges) {
    push(errors, nodeKeys.has(exactRefKey(edge?.sourceArtifactRef)), "ArtifactGraph edge source must exist in scope");
    if (edge?.status === "resolved") push(errors, nodeKeys.has(exactRefKey(edge?.targetArtifactRef)), "ArtifactGraph resolved edge target must exist in scope");
    if (edge?.status !== "resolved") push(errors, edge?.targetVersionState === "unresolved", "ArtifactGraph unresolved edge must have unresolved version state");
  }
  const summary = payload?.summary || {};
  const approvals = { unreviewed: 0, approved: 0, rejected: 0 };
  for (const node of nodes) if (node?.approval?.state in approvals) approvals[node.approval.state] += 1;
  push(errors, summary.artifactCount === nodes.length, "ArtifactGraph artifact count must match nodes");
  push(errors, summary.referenceCount === edges.length, "ArtifactGraph reference count must match edges");
  push(errors, summary.resolvedReferenceCount === edges.filter((edge) => edge?.status === "resolved").length, "ArtifactGraph resolved count must match edges");
  push(errors, summary.missingReferenceCount === edges.filter((edge) => edge?.status === "missing").length, "ArtifactGraph missing count must match edges");
  push(errors, summary.hashMismatchReferenceCount === edges.filter((edge) => edge?.status === "hash_mismatch").length, "ArtifactGraph hash mismatch count must match edges");
  push(errors, summary.supersededArtifactCount === nodes.filter((node) => node?.versionState === "superseded").length, "ArtifactGraph superseded artifact count must match nodes");
  push(errors, summary.supersededReferenceCount === edges.filter((edge) => edge?.status === "resolved" && edge?.targetVersionState === "superseded").length, "ArtifactGraph superseded reference count must match edges");
  push(errors, summary.rootCount === nodes.filter((node) => node?.inboundReferenceCount === 0).length, "ArtifactGraph root count must match nodes");
  push(errors, summary.leafCount === nodes.filter((node) => node?.outboundReferenceCount === 0).length, "ArtifactGraph leaf count must match nodes");
  push(errors, summary.cycleCount === (payload?.cycles || []).length, "ArtifactGraph cycle count must match cycles");
  push(errors, JSON.stringify(summary.approvalCounts) === JSON.stringify(approvals), "ArtifactGraph approval counts must match nodes");
  if (payload?.gate) {
    push(errors, payload.gate.allowed === (payload.gate.blockingReasons.length === 0), "ArtifactGraph gate allowed state must match blocking reasons");
    push(errors, nodeKeys.has(exactRefKey(payload.gate.artifactRef)), "ArtifactGraph gate artifact must exist in scope");
  }
}

function validateProjectBundleManifest(payload, errors) {
  const entries = payload?.entries || [];
  const paths = entries.map((entry) => entry?.path);
  push(errors, unique(paths), "ProjectBundleManifest entry paths must be unique");
  push(errors, paths.every((path, index) => index === 0 || paths[index - 1].localeCompare(path) < 0), "ProjectBundleManifest entries must be sorted");
  const projectEntry = entries.find((entry) => entry?.path === "store/project.json");
  push(errors, Boolean(projectEntry), "ProjectBundleManifest requires store/project.json");
  push(errors, projectEntry?.contentHash === payload?.sourceProject?.projectManifestHash, "ProjectBundleManifest project hash must match its project entry");
  const categories = {
    project_manifest: "projectManifestCount",
    artifact_envelope: "artifactEnvelopeCount",
    version_pointer: "versionPointerCount",
    approval_record: "approvalRecordCount",
    idempotency_claim: "idempotencyClaimCount",
    execution_output: "executionOutputCount",
    reference_blob: "referenceBlobCount"
  };
  const expected = {
    fileCount: entries.length,
    totalBytes: entries.reduce((total, entry) => total + (entry?.byteLength || 0), 0),
    projectManifestCount: 0,
    artifactEnvelopeCount: 0,
    versionPointerCount: 0,
    approvalRecordCount: 0,
    idempotencyClaimCount: 0,
    executionOutputCount: 0,
    ...(payload?.bundleFormatVersion === "1.1.0" ? { referenceBlobCount: 0 } : {})
  };
  for (const entry of entries) {
    if (entry?.category === "reference_blob") {
      const digest = String(entry.contentHash || "").replace(/^sha256:/, "");
      push(errors, entry.path === `store/reference-blobs/sha256/${digest.slice(0, 2)}/${digest}.blob`, "ProjectBundleManifest reference blob path must match its digest");
    }
    if (categories[entry?.category] && categories[entry.category] in expected) expected[categories[entry.category]] += 1;
  }
  push(errors, Object.entries(expected).every(([key, value]) => payload?.summary?.[key] === value), "ProjectBundleManifest summary must match entries");
  const hashInput = {
    bundleFormatVersion: payload?.bundleFormatVersion,
    sourceProject: payload?.sourceProject,
    purpose: payload?.purpose,
    contentPolicy: payload?.contentPolicy,
    storeDirectory: payload?.storeDirectory,
    entries: payload?.entries,
    summary: payload?.summary
  };
  push(errors, payload?.bundleHash === sha256Canonical(hashInput), "ProjectBundleManifest bundle hash must match canonical contents");
  push(errors, payload?.contentPolicy?.redistributionAuthorized === false && payload?.contentPolicy?.rightsApprovalImplied === false, "ProjectBundleManifest must not imply redistribution or rights approval");
  if (payload?.bundleFormatVersion === "1.1.0") push(errors, payload?.contentPolicy?.containsReferenceMedia === entries.some((entry) => entry?.category === "reference_blob"), "ProjectBundleManifest reference-media policy must match its entries");
}

export function validateByKind(payload, context = {}) {
  const errors = [];
  switch (payload?.kind) {
    case "cineweave_codex_story_brief": validateStoryBrief(payload, errors); break;
    case "cineweave_codex_beat_sheet": validateBeatSheet(payload, errors); break;
    case "cineweave_codex_script_scene": validateScriptScene(payload, errors); break;
    case "cineweave_codex_continuity_ledger": validateContinuityLedger(payload, errors); break;
    case "cineweave_codex_character_spec": validateCharacterSpec(payload, errors); break;
    case "cineweave_codex_character_morphology_spec": validateCharacterMorphologySpec(payload, errors); break;
    case "cineweave_codex_morphology_review": validateMorphologyReview(payload, errors); break;
    case "cineweave_codex_character_exploration_brief": validateCharacterExplorationBrief(payload, errors); break;
    case "cineweave_codex_character_option_set": validateCharacterOptionSet(payload, errors); break;
    case "cineweave_codex_character_preference_feedback": validateCharacterPreferenceFeedback(payload, errors); break;
    case "cineweave_codex_character_reference_plan": validateCharacterReferencePlan(payload, errors); break;
    case "cineweave_codex_character_appearance_state": validateAppearanceState(payload, errors); break;
    case "cineweave_codex_character_review": validateReview(payload, errors, "Character"); break;
    case "cineweave_codex_character_repair": validateRepair(payload, errors, "Character"); break;
    case "cineweave_codex_performance_timeline": validatePerformanceTimeline(payload, errors); break;
    case "cineweave_codex_scene_spec": validateSceneSpec(payload, errors); break;
    case "cineweave_codex_scene_state": validateSceneState(payload, errors, context.sceneSpec); break;
    case "cineweave_codex_scene_reference_plan": push(errors, payload?.validation?.geographyFirst === true, "SceneReferencePlan must be geography-first"); break;
    case "cineweave_codex_interaction_constraint_set": validateInteractionSet(payload, errors); break;
    case "cineweave_codex_scene_review": validateReview(payload, errors, "Scene"); break;
    case "cineweave_codex_scene_repair": validateRepair(payload, errors, "Scene"); break;
    case "cineweave_codex_scene_light_state": validateSceneLightState(payload, errors); break;
    case "cineweave_codex_asset_recipe": validateAssetRecipe(payload, errors, context.controlSet); break;
    case "cineweave_codex_board_assembly_plan": validateBoardAssemblyPlan(payload, errors); break;
    case "cineweave_codex_control_channel_set": validateControlSet(payload, errors); break;
     case "cineweave_codex_evidence_bundle": validateEvidenceBundle(payload, errors); break;
     case "cineweave_codex_capability_profile": validateCapabilityProfile(payload, errors); break;
     case "cineweave_codex_capability_resolution_plan": validateCapabilityResolutionPlan(payload, errors, context); break;
     case "cineweave_codex_license_profile": validateLicenseProfile(payload, errors); break;
    case "cineweave_codex_control_benchmark": validateBenchmark(payload, errors); break;
    case "cineweave_codex_control_benchmark_review": validateBenchmarkReview(payload, errors, context.benchmark); break;
    case "cineweave_codex_repair_run_receipt": validateRepairRunReceipt(payload, errors); break;
    case "cineweave_adapter_descriptor": validateAdapterDescriptor(payload, errors, context.capabilityProfile); break;
     case "cineweave_execution_request": validateExecutionRequest(payload, errors); break;
     case "cineweave_codex_execution_preview": validateExecutionPreview(payload, errors, context); break;
     case "cineweave_execution_receipt": validateExecutionReceipt(payload, errors, context.executionRequest); break;
    case "cineweave_skill_evaluation_run": validateSkillEvaluationRun(payload, errors); break;
    case "cineweave_codex_image_prompt": validateIntegratedImage(payload, errors); break;
    case "cineweave_codex_prompt_record": validatePromptRecord(payload, errors); break;
    case "cineweave_codex_storyboard_sequence": validateIntegratedStoryboard(payload, errors); validateStoryboardContract(payload, errors, context); break;
    case "cineweave_codex_style_package": validateStylePackage(payload, errors); break;
    case "cineweave_codex_style_exploration_brief": validateStyleExplorationBrief(payload, errors); break;
    case "cineweave_codex_style_option_set": validateStyleOptionSet(payload, errors); break;
    case "cineweave_codex_style_preference_feedback": validateStylePreferenceFeedback(payload, errors); break;
    case "cineweave_codex_representation_binding": validateRepresentationBinding(payload, errors); break;
    case "cineweave_codex_style_reference_plan": validateStyleReferencePlan(payload, errors); break;
    case "cineweave_codex_style_compile": validateStyleCompile(payload, errors); break;
    case "cineweave_codex_style_review": validateStyleReview(payload, errors); break;
    case "cineweave_codex_style_light_grammar": validateStyleLightGrammar(payload, errors); break;
     case "cineweave_codex_action_sequence_spec": validateActionSequenceSpec(payload, errors); break;
     case "cineweave_codex_shot_spec": validateShotSpec(payload, errors, context.actionSequenceSpec); break;
     case "cineweave_codex_shot_lighting_plan": validateShotLightingPlan(payload, errors, context.sceneLightState, context.shotSpec); break;
     case "cineweave_codex_temporal_spec": validateTemporalSpec(payload, errors, context.shotSpec, context); break;
     case "cineweave_codex_camera_previs_spec": validateCameraPrevisSpec(payload, errors, context); break;
     case "cineweave_codex_director_proposals": validateDirectorProposals(payload, errors); break;
     case "cineweave_codex_cinematic_skill_manifest": validateCinematicSkillManifest(payload, errors); break;
     case "cineweave_codex_shot_compiler_plan": validateShotCompilerPlan(payload, errors, context); break;
     case "cineweave_codex_hero_frame_anchor": validateHeroFrameAnchor(payload, errors, context); break;
     case "cineweave_codex_asset_alias_registry": validateAssetAliasRegistry(payload, errors); break;
     case "cineweave_codex_sequence_rhythm_spec": validateSequenceRhythmSpec(payload, errors, context); break;
     case "cineweave_codex_render_plan": validateRenderPlan(payload, errors); break;
    case "cineweave_codex_media_import": validateMediaImport(payload, errors); break;
    case "cineweave_codex_media_technical_probe": validateMediaTechnicalProbe(payload, errors, context); break;
    case "cineweave_codex_editorial_timeline_plan": validateEditorialTimelinePlan(payload, errors); break;
    case "cineweave_codex_color_pipeline_profile": validateColorPipelineProfile(payload, errors, context); break;
    case "cineweave_codex_content_credential_inspection": validateContentCredentialInspection(payload, errors, context); break;
    case "cineweave_codex_content_credential_handoff": validateContentCredentialHandoff(payload, errors, context); break;
    case "cineweave_codex_prompt_repair": validatePromptRepair(payload, errors); break;
    case "cineweave_codex_director_repair": validateDirectorRepair(payload, errors, context); break;
    case "cineweave_codex_reference_asset": validateReferenceAsset(payload, errors); break;
    case "cineweave_codex_reference_observation": validateReferenceObservation(payload, errors, context.referenceAsset); break;
    case "cineweave_codex_reference_review": validateReferenceReview(payload, errors); break;
    case "cineweave_codex_reference_binding_set": validateReferenceBindingSet(payload, errors, context.referenceObservations); break;
    case "cineweave_codex_creative_brief": validateCreativeBrief(payload, errors); break;
    case "cineweave_codex_workflow_plan": validateWorkflowPlan(payload, errors); break;
    case "cineweave_artifact_graph": validateArtifactGraph(payload, errors); break;
    case "cineweave_project_bundle_manifest": validateProjectBundleManifest(payload, errors); break;
    default:
      if (payload?.characterSpecRef && payload?.performanceState) validateCharacterBinding(payload, errors);
      else if (payload?.sceneSpecRef && payload?.cameraPlacement) validateSceneBinding(payload, errors, context.sceneSpec);
  }
  return errors;
}

async function readJson(relativePath) { return JSON.parse(await readFile(resolve(repoRoot, "packages/cineweave-contracts", relativePath), "utf8")); }

async function runSelfTest(mode = "all") {
  const sceneSpec = await readJson("examples/scene-spec.json");
  const sceneLightState = await readJson("examples/scene-light-state.json");
  const controlSet = await readJson("examples/control-channel-set.json");
  const referenceAsset = await readJson("examples/reference-asset.json");
  const referenceObservation = await readJson("examples/reference-observation.json");
  const referenceBindingSet = await readJson("examples/reference-binding-set.json");
  const directorProposals = await readJson("examples/proposal-output.json");
  const renderPlan = await readJson("examples/render-plan.json");
  const mediaImport = await readJson("examples/media-import.json");
  const mediaImportVideo = await readJson("examples/media-import-video.json");
  const mediaTechnicalProbe = await readJson("examples/media-technical-probe.json");
  const editorialTimelinePlan = await readJson("examples/editorial-timeline-plan.json");
  const colorPipelineProfile = await readJson("examples/color-pipeline-profile.json");
  const contentCredentialInspection = await readJson("examples/content-credential-inspection.json");
  const contentCredentialHandoff = await readJson("examples/content-credential-handoff.json");
  const actionSequenceSpec = await readJson("examples/action-sequence-spec.json");
  const shotSpec = await readJson("examples/shot-spec.json");
   const actionShotSpec = await readJson("examples/shot-spec-action.json");
   const temporalSpec = await readJson("examples/temporal-spec.json");
    const cameraPrevisSpec = await readJson("examples/camera-previs-spec.json");
    const heroFrameAnchor = await readJson("examples/hero-frame-anchor.json");
    const assetAliasRegistry = await readJson("examples/asset-alias-registry.json");
    const sequenceRhythmSpec = await readJson("examples/sequence-rhythm-spec.json");
    const cinematicSkillManifest = await readJson("examples/cinematic-skill-manifest.json");
    const shotCompilerPlan = await readJson("examples/shot-compiler-plan.json");
   const storyboard = await readJson("examples/storyboard-action-sequence.json");
   const directorRepair = await readJson("examples/director-repair.json");
  const repairRunReceipt = await readJson("examples/repair-run-receipt.json");
  const storyboardBoardAssemblyPlan = await readJson("examples/board-assembly-plan-storyboard-rain-teahouse.json");
  const benchmark = await readJson("examples/control-benchmark.json");
  const referenceObservations = [{ artifactRef: referenceBindingSet.bindings[0].observationRef, payload: referenceObservation }];
   const storyboardContext = { actionSequenceSpec, shotSpecs: [actionShotSpec], boardAssemblyPlan: storyboardBoardAssemblyPlan, storyboard };
  const directorRepairContext = { directorTargets: [shotSpec] };
  const cases = [
    ["examples/character-spec.json", {}], ["examples/character-morphology-spec.json", {}], ["examples/morphology-review.json", {}], ["examples/character-exploration-brief.json", {}], ["examples/character-option-set.json", {}], ["examples/character-preference-feedback.json", {}], ["examples/character-binding.json", {}], ["examples/character-reference-plan.json", {}], ["examples/character-appearance-state.json", {}], ["examples/character-review.json", {}], ["examples/character-repair.json", {}],
  ];
  if (mode === "all") cases.push(
    ["examples/story-brief.json", {}], ["examples/beat-sheet.json", {}], ["examples/script-scene.json", {}], ["examples/continuity-ledger.json", {}],
    ["examples/performance-timeline.json", {}],
    ["examples/scene-spec.json", {}], ["examples/scene-state.json", { sceneSpec }], ["examples/scene-binding.json", { sceneSpec }], ["examples/scene-reference-plan.json", { sceneSpec }], ["examples/interaction-constraint-set.json", {}], ["examples/scene-review.json", { sceneSpec }], ["examples/scene-repair.json", { sceneSpec }],
    ["examples/scene-light-state.json", {}],
    ["examples/asset-recipe.json", { controlSet }], ["recipes/character-morphology-neutral-3view.json", {}], ["recipes/character-identity-reference-sheet-3x3.json", {}], ["recipes/natural-human-fixtures-3up.json", {}], ["recipes/style-exploration-board-4up.json", {}], ["recipes/anime-character-fixtures-3up.json", {}], ["recipes/manga-character-fixtures-3up.json", {}], ["recipes/cross-representation-character-6up.json", {}], ["examples/board-assembly-plan.json", {}], ["examples/board-assembly-plan-storyboard-rain-teahouse.json", {}], ["examples/control-channel-set.json", {}], ["examples/evidence-bundle.json", {}], ["examples/capability-profile.json", {}], ["examples/license-profile.json", {}], ["examples/control-benchmark.json", {}], ["examples/control-benchmark-review.json", { benchmark }],
    ["examples/adapter-descriptor.json", {}], ["examples/execution-request.json", {}], ["examples/execution-receipt.json", {}], ["examples/execution-receipt-blocked.json", {}], ["examples/skill-evaluation-run.json", {}],
    ["examples/artifact-graph.json", {}], ["examples/project-bundle-manifest.json", {}],
    ["examples/reference-asset.json", {}], ["examples/content-credential-inspection.json", { referenceAsset }], ["examples/content-credential-handoff.json", { referenceAsset, contentCredentialInspection }], ["examples/reference-observation.json", { referenceAsset }],
    ["examples/reference-observation-portrait-face.json", { referenceAsset }], ["examples/reference-observation-portrait-skin.json", { referenceAsset }], ["examples/reference-observation-portrait-capture.json", { referenceAsset }],
     ["examples/reference-review.json", {}], ["examples/reference-binding-set.json", { referenceObservations }],
     ["examples/asset-alias-registry.json", {}],
    ["examples/integrated-image-prompt.json", { sceneSpec }], ["examples/integrated-image-prompt-reference-reframe.json", {}], ["examples/storyboard-action-sequence.json", storyboardContext], ["examples/prompt-record.json", {}], ["examples/prompt-record-reference-reframe.json", {}], ["examples/prompt-record-cinematic-director-template.json", {}],
    ["examples/style-package.json", {}], ["examples/style-package-anime.json", {}], ["examples/style-package-manga.json", {}], ["examples/style-exploration-brief.json", {}], ["examples/style-option-set.json", {}], ["examples/style-preference-feedback.json", {}], ["examples/representation-binding.json", {}], ["examples/style-reference-plan.json", {}], ["examples/style-compile.json", {}], ["examples/style-compile-anime.json", {}], ["examples/style-light-grammar.json", {}], ["examples/style-review.json", {}],
     ["examples/proposal-output.json", {}], ["examples/render-plan.json", {}], ["examples/character-render-plan.json", {}], ["examples/media-import.json", {}], ["examples/media-import-video.json", {}], ["examples/media-technical-probe.json", { mediaImport: mediaImportVideo }], ["examples/editorial-timeline-plan.json", {}], ["examples/color-pipeline-profile.json", {}], ["examples/action-sequence-spec.json", {}], ["examples/shot-spec.json", {}], ["examples/shot-spec-action.json", { actionSequenceSpec }], ["examples/shot-lighting-plan.json", { sceneLightState, shotSpec }], ["examples/temporal-spec.json", { shotSpec }], ["examples/camera-previs-spec.json", { shotSpec, temporalSpec }], ["examples/hero-frame-anchor.json", { shotSpec }], ["examples/sequence-rhythm-spec.json", { storyboard }], ["examples/cinematic-skill-manifest.json", {}], ["examples/shot-compiler-plan.json", { cinematicSkillManifest }], ["examples/director-repair.json", directorRepairContext], ["examples/prompt-repair.json", {}], ["examples/repair-run-receipt.json", {}],
    ["examples/creative-brief.json", {}], ["examples/creative-brief-zero-prompt.json", {}], ["examples/workflow-plan.json", {}], ["examples/workflow-plan-character-exploration.json", {}], ["examples/workflow-plan-character-morphology.json", {}], ["examples/workflow-plan-cross-representation.json", {}], ["examples/workflow-plan-reference-prompt.json", {}], ["examples/workflow-plan-portrait-reference.json", {}], ["examples/workflow-plan-action-sequence.json", {}],
  );

  let ok = true;
  for (const [path, context] of cases) {
    const payload = await readJson(path);
    const errors = validateByKind(payload, context);
    if (errors.length) {
      ok = false;
      console.error(`Semantic validation failed: ${path}`);
      for (const error of errors) console.error(`- ${error}`);
    } else console.log(`Semantic pass: ${path}`);
  }

  const negative = [];
  const badReview = await readJson("examples/character-review.json"); badReview.decision.nextAction = "accept"; negative.push(["reject accept with blocking character failure", badReview, {}]);
  const badScene = await readJson("examples/scene-spec.json"); badScene.geography.connections[0].toZone = "zone.unknown"; negative.push(["reject unknown SceneSpec zone", badScene, {}]);
  const badPrompt = await readJson("examples/integrated-image-prompt.json"); delete badPrompt.sceneBinding; negative.push(["reject scene blocks without SceneBinding", badPrompt, {}]);
  const badControl = await readJson("examples/control-channel-set.json"); badControl.channels[0].fallback.action = "warn"; negative.push(["reject hard control that does not block", badControl, {}]);
  const badRecipe = await readJson("examples/asset-recipe.json"); badRecipe.assembly.ordering.pop(); negative.push(["reject incomplete recipe assembly", badRecipe, { controlSet }]);
  const badBoardAssemblyPlan = await readJson("examples/board-assembly-plan.json"); badBoardAssemblyPlan.tilePlacements[1].column = 0; negative.push(["reject duplicate BoardAssemblyPlan region cell", badBoardAssemblyPlan, {}]);
  const badStyleExplorationRecipe = await readJson("recipes/style-exploration-board-4up.json"); badStyleExplorationRecipe.tasks[0].delta[0].fieldPath = "camera.focalLength"; negative.push(["reject style exploration that changes camera", badStyleExplorationRecipe, {}]);
  const badCrossRepresentationRecipe = await readJson("recipes/cross-representation-character-6up.json"); badCrossRepresentationRecipe.tasks.pop(); badCrossRepresentationRecipe.assembly.ordering.pop(); negative.push(["reject incomplete cross-representation family coverage", badCrossRepresentationRecipe, {}]);
  const badEvidence = await readJson("examples/evidence-bundle.json"); badEvidence.evidence = badEvidence.evidence.filter((item) => item.role !== "body_identity"); negative.push(["reject missing required evidence role", badEvidence, {}]);
  const badCapability = await readJson("examples/capability-profile.json"); badCapability.capabilities.push(structuredClone(badCapability.capabilities[0])); negative.push(["reject duplicate capability", badCapability, {}]);
  const badFamilyBench = await readJson("examples/control-benchmark.json"); badFamilyBench.cases = badFamilyBench.cases.filter((item) => item.category !== "manga_representation"); negative.push(["reject MangaBench without manga case", badFamilyBench, {}]);
  const badCinematographyBench = await readJson("examples/control-benchmark.json"); delete badCinematographyBench.cases.find((item) => item.category === "cinematography").cameraPrevisRef; negative.push(["reject CinematographyBench without CameraPrevisSpec", badCinematographyBench, {}]);
  const badDirectorQualityBench = await readJson("examples/control-benchmark.json"); delete badDirectorQualityBench.cases.find((item) => item.category === "director_quality").directorArtifactRefs; negative.push(["reject DirectorQualityBench without exact Director artifacts", badDirectorQualityBench, {}]);
  const badCalibrationBench = await readJson("examples/control-benchmark.json"); delete badCalibrationBench.humanReview.calibration; negative.push(["reject CinematographyBench without calibration protocol", badCalibrationBench, {}]);
  const badCalibrationReview = await readJson("examples/control-benchmark-review.json"); badCalibrationReview.humanReview.calibration.agreementScore = 0.95; negative.push(["reject planned ControlBenchmarkReview calibration result", badCalibrationReview, { benchmark }]);
  const badPlannedCalibrationPair = await readJson("examples/control-benchmark-review.json"); badPlannedCalibrationPair.humanReview.calibration.pairResults = [{ pairId: "pair.planned", caseId: "case.director-quality-rain-teahouse", dimensionId: "dimension.direction", leftMediaId: "media.left", rightMediaId: "media.right", decision: "tie", evidenceObservationIds: ["obs.left", "obs.right"] }]; negative.push(["reject planned ControlBenchmarkReview calibration pairs", badPlannedCalibrationPair, { benchmark }]);
  const badBenchmarkReview = await readJson("examples/control-benchmark-review.json"); badBenchmarkReview.decision.mayAdvanceToApproval = true; negative.push(["reject planned ControlBenchmarkReview that advances", badBenchmarkReview, { benchmark }]);
  const badInteraction = await readJson("examples/interaction-constraint-set.json"); badInteraction.constraints.occlusions.push({ frontRef: badInteraction.constraints.occlusions[0].backRef, backRef: badInteraction.constraints.occlusions[0].frontRef, region: "reverse", ordering: "front_before_back" }); negative.push(["reject cyclic occlusion", badInteraction, {}]);
  const badStyle = await readJson("examples/style-package.json"); badStyle.recipe.atomRefs[0].atomId = "unknown.style.atom"; negative.push(["reject StylePackage unknown atom", badStyle, {}]);
  const badStyleActivation = await readJson("examples/style-package.json"); badStyleActivation.status = "active"; negative.push(["reject active StylePackage without activation approval", badStyleActivation, {}]);
  const badRealismProfile = await readJson("examples/style-compile.json"); badRealismProfile.realismProfile.calibration.identityProtected = false; negative.push(["reject StyleCompile realism profile that can overwrite identity", badRealismProfile, {}]);
  const badStyleCompileWeight = await readJson("examples/style-compile.json"); badStyleCompileWeight.blocks[0].directives.push("(natural human anatomy:1.2)"); negative.push(["reject provider-specific weight syntax in StyleCompile", badStyleCompileWeight, {}]);
  const badStyleCompileVariant = await readJson("examples/style-compile-anime.json"); badStyleCompileVariant.representationVariant.protectedDomains = badStyleCompileVariant.representationVariant.protectedDomains.filter((item) => item !== "scene_geography"); negative.push(["reject representation variant that does not protect scene geography", badStyleCompileVariant, {}]);
  const badBrief = await readJson("examples/creative-brief.json"); badBrief.validation.styleDoesNotOwnIdentity = false; negative.push(["reject CreativeBrief style identity overwrite", badBrief, {}]);
  const badStyleBinding = await readJson("examples/prompt-record.json"); badStyleBinding.styleBinding.mode = "compiled"; delete badStyleBinding.styleBinding.styleCompileRef; negative.push(["reject compiled PromptRecord without StyleCompile ref", badStyleBinding, {}]);
  const badWorkflow = await readJson("examples/workflow-plan.json"); badWorkflow.steps[0].dependsOn = [badWorkflow.steps[2].stepId]; negative.push(["reject cyclic WorkflowPlan", badWorkflow, {}]);
  const badOptionSet = await readJson("examples/character-option-set.json"); badOptionSet.options[0].primaryDelta.axis = "eye_expression"; negative.push(["reject CharacterOptionSet with mixed exploration axes", badOptionSet, {}]);
  const badFeedbackLock = await readJson("examples/character-preference-feedback.json"); badFeedbackLock.convergence.identityLockRequested = true; negative.push(["reject CharacterPreferenceFeedback automatic identity lock", badFeedbackLock, {}]);
  const badFeedbackScore = await readJson("examples/character-preference-feedback.json"); badFeedbackScore.policy.universalBeautyScoreProhibited = false; negative.push(["reject CharacterPreferenceFeedback beauty score policy", badFeedbackScore, {}]);
  const badSkinMaterial = await readJson("examples/character-appearance-state.json"); badSkinMaterial.styling.skinMaterial.calibration.notBiometric = false; negative.push(["reject biometric CharacterAppearanceState skin material scale", badSkinMaterial, {}]);
  const badMorphologyVariation = await readJson("examples/character-morphology-spec.json"); badMorphologyVariation.axes.find((axis) => axis.lock === "hard").variationRadius = 0.1; negative.push(["reject variation on hard-locked morphology axis", badMorphologyVariation, {}]);
  const badMorphologyRelation = await readJson("examples/character-morphology-spec.json"); badMorphologyRelation.relations[0].memberAxisIds.push("face.unknown.axis"); negative.push(["reject morphology relation with unknown axis", badMorphologyRelation, {}]);
  const badMorphologyReview = await readJson("examples/morphology-review.json"); badMorphologyReview.dimensions[0].status = "fail"; badMorphologyReview.decision.identityLockApproved = true; negative.push(["reject morphology identity lock after failed review", badMorphologyReview, {}]);
  const badStyleOptions = await readJson("examples/style-option-set.json"); badStyleOptions.options[0].primaryDelta.axis = "linework"; negative.push(["reject mixed-axis StyleOptionSet", badStyleOptions, {}]);
  const badStyleFeedback = await readJson("examples/style-preference-feedback.json"); badStyleFeedback.convergence.styleActivationRequested = true; negative.push(["reject automatic StylePreferenceFeedback activation", badStyleFeedback, {}]);
  const badRepresentationBinding = await readJson("examples/representation-binding.json"); badRepresentationBinding.mapping[0].forbiddenTransformations.push(badRepresentationBinding.mapping[0].allowedTransformations[0]); negative.push(["reject overlapping RepresentationBinding transformations", badRepresentationBinding, {}]);
  const badBeatSheet = await readJson("examples/beat-sheet.json"); badBeatSheet.beats[1].order = 1; negative.push(["reject unordered BeatSheet", badBeatSheet, {}]);
  const badPerformanceTimeline = await readJson("examples/performance-timeline.json"); badPerformanceTimeline.phases[1].startSeconds = 0.5; negative.push(["reject overlapping PerformanceTimeline", badPerformanceTimeline, {}]);
  const badSceneLight = await readJson("examples/scene-light-state.json"); badSceneLight.sources[1].sourceId = badSceneLight.sources[0].sourceId; negative.push(["reject duplicate SceneLightState source", badSceneLight, {}]);
  const badStyleLight = await readJson("examples/style-light-grammar.json"); badStyleLight.validation.noPhysicalSourcePlacement = false; negative.push(["reject StyleLightGrammar physical placement", badStyleLight, {}]);
  const badActionParticipant = await readJson("examples/action-sequence-spec.json"); badActionParticipant.beats[0].actions[0].participantId = "participant.unknown"; negative.push(["reject ActionSequenceSpec unknown participant", badActionParticipant, {}]);
  const badActionWeapon = await readJson("examples/action-sequence-spec.json"); badActionWeapon.beats[1].actions[0].weaponRef = "weapon.unknown"; negative.push(["reject ActionSequenceSpec unknown weapon", badActionWeapon, {}]);
  const badActionExchange = await readJson("examples/action-sequence-spec.json"); badActionExchange.beats[1].exchange.sequence[1].eventId = "event.unknown"; negative.push(["reject ActionSequenceSpec unknown exchange event", badActionExchange, {}]);
  const badActionPromptHandoff = await readJson("examples/action-sequence-spec.json"); badActionPromptHandoff.promptHandoff.orderedBlocks = badActionPromptHandoff.promptHandoff.orderedBlocks.filter((item) => item !== "trajectory"); negative.push(["reject incomplete fight prompt handoff", badActionPromptHandoff, {}]);
  const badActionCoverage = await readJson("examples/action-sequence-spec.json"); badActionCoverage.coverageRequirements[0].beatIds.shift(); negative.push(["reject ActionSequenceSpec asymmetric coverage link", badActionCoverage, {}]);
  const badActionRisk = await readJson("examples/action-sequence-spec.json"); badActionRisk.riskRegister[0].requiresQualifiedReview = false; negative.push(["reject unreviewed high-risk action", badActionRisk, {}]);
  const badActionContinuity = await readJson("examples/action-sequence-spec.json"); badActionContinuity.continuityTracks[0].exitState = "silently moved elsewhere"; negative.push(["reject open ActionSequenceSpec continuity", badActionContinuity, {}]);
  const badShot = await readJson("examples/shot-spec.json"); badShot.blocking[0].subjectRef = "binding.unknown"; negative.push(["reject ShotSpec unknown blocking subject", badShot, {}]);
  const badShotBackref = await readJson("examples/shot-spec.json"); badShotBackref.temporalSpecRef = { kind: "cineweave_codex_temporal_spec", id: "temporal.legacy-cycle", version: 1, contentHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000" }; negative.push(["reject ShotSpec downstream back-reference", badShotBackref, {}]);
  const badActionShot = await readJson("examples/shot-spec-action.json"); badActionShot.actionBeatIds[0] = "action-beat.unknown"; negative.push(["reject ShotSpec unknown action beat", badActionShot, { actionSequenceSpec }]);
  const badActionShotHash = await readJson("examples/shot-spec-action.json"); badActionShotHash.actionSequenceRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject ShotSpec stale ActionSequenceSpec hash", badActionShotHash, { actionSequenceSpec }]);
  const badActionShotWeapon = await readJson("examples/shot-spec-action.json"); badActionShotWeapon.promptHandoff.actionBreakdown.weaponDetails[0].weaponRef = "weapon.unknown"; negative.push(["reject ShotSpec unknown action breakdown weapon", badActionShotWeapon, { actionSequenceSpec }]);
  const badStoryboardCoverage = await readJson("examples/storyboard-action-sequence.json"); badStoryboardCoverage.coverageLedger = []; negative.push(["reject Storyboard missing action coverage", badStoryboardCoverage, storyboardContext]);
  const badStoryboardBeat = await readJson("examples/storyboard-action-sequence.json"); badStoryboardBeat.shots[0].actionBeatIds[0] = "action-beat.unknown"; negative.push(["reject Storyboard unknown action beat", badStoryboardBeat, storyboardContext]);
  const badStoryboardShotHash = await readJson("examples/storyboard-action-sequence.json"); badStoryboardShotHash.shots[0].shotSpecRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject Storyboard stale ShotSpec hash", badStoryboardShotHash, storyboardContext]);
  const badStoryboardPanel = await readJson("examples/storyboard-action-sequence.json"); badStoryboardPanel.productionBindings.panels[0].tileId = "tile.unknown"; negative.push(["reject Storyboard panel not in BoardAssemblyPlan", badStoryboardPanel, storyboardContext]);
  const badStoryboardOrder = await readJson("examples/storyboard-action-sequence.json"); badStoryboardOrder.shots[0].order = 2; negative.push(["reject Storyboard non-contiguous order", badStoryboardOrder, storyboardContext]);
  const badShotLight = await readJson("examples/shot-lighting-plan.json"); badShotLight.key.sourceId = "light.unknown"; negative.push(["reject ShotLightingPlan unknown source", badShotLight, { sceneLightState, shotSpec }]);
  const badShotLightHash = await readJson("examples/shot-lighting-plan.json"); badShotLightHash.shotSpecRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject ShotLightingPlan stale ShotSpec hash", badShotLightHash, { sceneLightState, shotSpec }]);
  const badShotLightBounce = await readJson("examples/shot-lighting-plan.json"); delete badShotLightBounce.fill.viaSurfaceAnchor; negative.push(["reject ShotLightingPlan bounce without physical surface", badShotLightBounce, { sceneLightState, shotSpec }]);
  const badShotLightFill = await readJson("examples/shot-lighting-plan.json"); badShotLightFill.fill = null; delete badShotLightFill.validation.fillIntentional; negative.push(["reject ShotLightingPlan implicit no-fill decision", badShotLightFill, { sceneLightState, shotSpec }]);
   const badTemporal = await readJson("examples/temporal-spec.json"); badTemporal.actionTimeline[1].timeSeconds = 0.1; negative.push(["reject unordered TemporalSpec", badTemporal, { shotSpec }]);
   const badTemporalIdentity = await readJson("examples/temporal-spec.json"); badTemporalIdentity.shotSpecRef.id = "shot.wrong-identity"; negative.push(["reject TemporalSpec wrong ShotSpec identity", badTemporalIdentity, { shotSpec }]);
   const badHeroFrameOverride = structuredClone(heroFrameAnchor); badHeroFrameOverride.inheritancePolicy.allowOverrides.push("character_identity.face"); negative.push(["reject HeroFrameAnchor identity override", badHeroFrameOverride, { shotSpec }]);
    const badHeroFrameCamera = structuredClone(heroFrameAnchor); badHeroFrameCamera.visualDna.camera.focalLengthMm = 85; negative.push(["reject HeroFrameAnchor camera drift", badHeroFrameCamera, { shotSpec }]);
    const badAssetAliasCollision = structuredClone(assetAliasRegistry); badAssetAliasCollision.aliases.push(structuredClone(badAssetAliasCollision.aliases[0])); negative.push(["reject AssetAliasRegistry alias collision", badAssetAliasCollision, {}]);
    const badAssetAliasLatest = structuredClone(assetAliasRegistry); badAssetAliasLatest.resolutionPolicy.allowLatest = true; negative.push(["reject AssetAliasRegistry latest resolution", badAssetAliasLatest, {}]);
    const badSequenceGap = structuredClone(sequenceRhythmSpec); badSequenceGap.shotWindows[0].startFrame = 2; negative.push(["reject SequenceRhythmSpec hidden opening gap", badSequenceGap, { storyboard }]);
   const badSequencePhase = structuredClone(sequenceRhythmSpec); badSequencePhase.tempoPhases[0].shotIds = ["shot.unknown"]; negative.push(["reject SequenceRhythmSpec phase unknown shot", badSequencePhase, { storyboard }]);
   const badSequenceTimebase = structuredClone(sequenceRhythmSpec); badSequenceTimebase.timebase.denominator = 2; negative.push(["reject SequenceRhythmSpec unreduced timebase", badSequenceTimebase, { storyboard }]);
   const temporalWithHero = structuredClone(temporalSpec); temporalWithHero.heroFrameAnchorRef = { kind: heroFrameAnchor.kind, id: heroFrameAnchor.heroFrameAnchorId, version: heroFrameAnchor.version, contentHash: sha256Canonical(heroFrameAnchor) };
   const badTemporalHeroFrame = structuredClone(temporalWithHero); badTemporalHeroFrame.heroFrameAnchorRef.id = "hero-frame.wrong-anchor"; negative.push(["reject TemporalSpec wrong HeroFrameAnchor identity", badTemporalHeroFrame, { shotSpec, heroFrameAnchor }]);
   const badCinematicManifest = structuredClone(cinematicSkillManifest); badCinematicManifest.skills[1].skillId = badCinematicManifest.skills[0].skillId; negative.push(["reject duplicate Atomic Cinematic Skill ID", badCinematicManifest, {}]);
   const badCompilerManifestRef = structuredClone(shotCompilerPlan); badCompilerManifestRef.cinematicSkillManifestRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject ShotCompilerPlan stale manifest", badCompilerManifestRef, { cinematicSkillManifest }]);
   const badCompilerControlOwner = structuredClone(shotCompilerPlan); badCompilerControlOwner.controlSurface.groups[0].controls[0].ownerSkill = "cineweave-production"; negative.push(["reject ShotCompilerPlan control ownership drift", badCompilerControlOwner, { cinematicSkillManifest }]);
   const badCameraPrevisQuaternion = structuredClone(cameraPrevisSpec); badCameraPrevisQuaternion.tracks.pose[1].orientationQuaternion.w = 1.5; negative.push(["reject CameraPrevisSpec non-unit quaternion", badCameraPrevisQuaternion, { shotSpec, temporalSpec }]);
  const badCameraPrevisZoom = structuredClone(cameraPrevisSpec); badCameraPrevisZoom.motion.primaryBehavior = "zoom"; badCameraPrevisZoom.motion.components = ["zoom"]; negative.push(["reject CameraPrevisSpec fixed-lens zoom", badCameraPrevisZoom, { shotSpec, temporalSpec }]);
  const badCameraPrevisIris = structuredClone(cameraPrevisSpec); badCameraPrevisIris.tracks.intrinsics[1].fStop = 2.8; negative.push(["reject CameraPrevisSpec undeclared iris change", badCameraPrevisIris, { shotSpec, temporalSpec }]);
  const badDirectorProposals = structuredClone(directorProposals); badDirectorProposals.proposals[1].primaryDelta = structuredClone(badDirectorProposals.proposals[0].primaryDelta); negative.push(["reject DirectorProposals duplicate primary delta", badDirectorProposals, {}]);
  const badRenderPlan = structuredClone(renderPlan); badRenderPlan.promptPayloadRef = "image-prompt:scene-01-shot-04"; negative.push(["reject RenderPlan 2.5 legacy prompt string", badRenderPlan, {}]);
  const badMediaImport = structuredClone(mediaImport); badMediaImport.renderPlanRef = "render-plan:legacy-string"; negative.push(["reject MediaImport 2.5 legacy RenderPlan string", badMediaImport, {}]);
  const badMediaTechnicalProbe = structuredClone(mediaTechnicalProbe); badMediaTechnicalProbe.mediaContentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject MediaTechnicalProbe stale media hash", badMediaTechnicalProbe, { mediaImport: mediaImportVideo }]);
  const badEditorialConform = structuredClone(editorialTimelinePlan); badEditorialConform.conformStatus = "conformed"; negative.push(["reject conformed EditorialTimelinePlan with a placeholder", badEditorialConform, {}]);
  const badEditorialTransition = structuredClone(editorialTimelinePlan); badEditorialTransition.transitions[0].atFrame += 1; negative.push(["reject EditorialTimelinePlan transition outside its cut boundary", badEditorialTransition, {}]);
  const badColorMetadata = structuredClone(colorPipelineProfile); badColorMetadata.sourceMedia[0].metadata.status = "unknown"; negative.push(["reject ColorPipelineProfile dishonest unknown metadata", badColorMetadata, {}]);
  const badColorPath = structuredClone(colorPipelineProfile); delete badColorPath.outputTargets[0].path.displayColorSpace; negative.push(["reject ColorPipelineProfile incomplete OCIO view path", badColorPath, {}]);
  const badCredentialInspection = structuredClone(contentCredentialInspection); badCredentialInspection.result.validationState = "trusted"; negative.push(["reject planned ContentCredentialInspection trusted claim", badCredentialInspection, { referenceAsset }]);
  const badCredentialHandoff = structuredClone(contentCredentialHandoff); badCredentialHandoff.provenancePlan.manifestAction = "written"; negative.push(["reject ContentCredentialHandoff manifest write claim", badCredentialHandoff, { referenceAsset, contentCredentialInspection }]);
  const badDirectorRepairTarget = structuredClone(directorRepair); badDirectorRepairTarget.targetRef.kind = "cineweave_codex_temporal_spec"; negative.push(["reject DirectorRepair camera target outside ShotSpec, Storyboard or CameraPrevisSpec", badDirectorRepairTarget, {}]);
  const badDirectorRepairHash = structuredClone(directorRepair); badDirectorRepairHash.targetRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; negative.push(["reject DirectorRepair stale target hash", badDirectorRepairHash, directorRepairContext]);
  const badRepairRunReceipt = structuredClone(repairRunReceipt); badRepairRunReceipt.status = "awaiting_review"; badRepairRunReceipt.candidateRef = null; negative.push(["reject awaiting RepairRunReceipt without a candidate", badRepairRunReceipt, {}]);
  const badDirectorRepairDelegation = structuredClone(directorRepair); badDirectorRepairDelegation.disposition = "delegate"; badDirectorRepairDelegation.observedFailure.owningDomain = "character"; badDirectorRepairDelegation.observedFailure.variable = "identity"; delete badDirectorRepairDelegation.targetRef; delete badDirectorRepairDelegation.change; badDirectorRepairDelegation.delegation = { owner: "scene", reason: "The observation concerns a Character-owned identity anchor.", requiredInputKinds: ["cineweave_codex_character_binding"] }; negative.push(["reject DirectorRepair delegation to wrong owner", badDirectorRepairDelegation, {}]);
  const badPromptRepair = await readJson("examples/prompt-repair.json"); badPromptRepair.changeOnly.push("also change composition"); negative.push(["reject multi-variable PromptRepair", badPromptRepair, {}]);
  const badAdapter = await readJson("examples/adapter-descriptor.json"); badAdapter.executionModes.push("external"); negative.push(["reject network-free adapter exposing external mode", badAdapter, {}]);
  const badAdapterEmphasis = await readJson("examples/adapter-descriptor.json"); badAdapterEmphasis.semanticEmphasis.acceptedLevels.push("required"); negative.push(["reject unsupported adapter semantic emphasis", badAdapterEmphasis, {}]);
  const badExecutionRequest = await readJson("examples/execution-request.json"); badExecutionRequest.parameters.push({ name: "api_key", value: "not-a-real-value", sensitive: false }); negative.push(["reject sensitive execution parameter", badExecutionRequest, {}]);
  const badExecutionReceipt = await readJson("examples/execution-receipt.json"); badExecutionReceipt.costSummary.actualAmount = 1; negative.push(["reject receipt cost that omits attempt accounting", badExecutionReceipt, {}]);
  const badEvaluationRun = await readJson("examples/skill-evaluation-run.json"); badEvaluationRun.summary.passed = 1; negative.push(["reject inconsistent SkillEvaluationRun summary", badEvaluationRun, {}]);
  const badArtifactGraph = await readJson("examples/artifact-graph.json"); badArtifactGraph.summary.supersededReferenceCount = 0; negative.push(["reject inconsistent ArtifactGraph summary", badArtifactGraph, {}]);
  const badProjectBundle = await readJson("examples/project-bundle-manifest.json"); badProjectBundle.contentPolicy.redistributionAuthorized = true; negative.push(["reject ProjectBundleManifest rights implication", badProjectBundle, {}]);
  const badReferenceAsset = await readJson("examples/reference-asset.json"); badReferenceAsset.blob.relativePath = badReferenceAsset.blob.relativePath.replace("/11/", "/22/"); negative.push(["reject ReferenceAsset digest/path mismatch", badReferenceAsset, {}]);
  const badReferencePixels = await readJson("examples/reference-asset.json"); badReferencePixels.media.technical.width = 20000; badReferencePixels.media.technical.height = 10000; negative.push(["reject ReferenceAsset excessive pixel dimensions", badReferencePixels, {}]);
  const badReferenceProvenance = await readJson("examples/reference-asset.json"); badReferenceProvenance.provenance.contentCredentials.trust = "trusted"; negative.push(["reject unchecked ReferenceAsset provenance trust", badReferenceProvenance, {}]);
  const badReferenceObservation = await readJson("examples/reference-observation.json"); badReferenceObservation.selector = { type: "spatial_rect", normalizedRect: { x: 0.8, y: 0.2, width: 0.4, height: 0.4 } }; negative.push(["reject ReferenceObservation region outside asset", badReferenceObservation, { referenceAsset }]);
  const badReferenceRights = await readJson("examples/reference-observation.json"); badReferenceRights.rightsGate.allowedForProduction = true; negative.push(["reject unresolved reference rights promoted to production", badReferenceRights, { referenceAsset }]);
  const badReferenceBinding = await readJson("examples/reference-binding-set.json"); badReferenceBinding.rightsPolicy.allProfilesResolved = true; negative.push(["reject inconsistent ReferenceBindingSet rights resolution", badReferenceBinding, { referenceObservations }]);
  const badReferenceTransform = await readJson("examples/prompt-record-reference-reframe.json"); badReferenceTransform.referenceTransform.targetDeltas[0].sourceTreatment = "replace"; badReferenceTransform.referenceTransform.targetDeltas[0].evidenceBasis = "source_visible"; negative.push(["reject source-evidence basis for a target replacement", badReferenceTransform, {}]);
  const badReferenceTransformDimension = await readJson("examples/integrated-image-prompt-reference-reframe.json"); badReferenceTransformDimension.referenceTransform.targetDeltas.push(structuredClone(badReferenceTransformDimension.referenceTransform.targetDeltas[0])); negative.push(["reject duplicate ReferenceTransform dimensions", badReferenceTransformDimension, {}]);
  const badReferenceBundlePolicy = await readJson("examples/project-bundle-manifest.json"); badReferenceBundlePolicy.contentPolicy.containsReferenceMedia = !badReferenceBundlePolicy.contentPolicy.containsReferenceMedia; negative.push(["reject inconsistent project bundle reference-media policy", badReferenceBundlePolicy, {}]);

  if (mode === "all") for (const [label, payload, context] of negative) {
    const errors = validateByKind(payload, context);
    if (!errors.length) { ok = false; console.error(`Negative semantic test failed: ${label}`); }
    else console.log(`Rejected as expected: ${label}`);
  }
  return ok;
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--self-test") { process.exitCode = (await runSelfTest("all")) ? 0 : 1; return; }
  if (args[0] === "--character-self-test") { process.exitCode = (await runSelfTest("character")) ? 0 : 1; return; }
  if (args.length !== 1) { console.error("Usage: node scripts/validate-contract-semantics.mjs <payload.json> | --self-test | --character-self-test"); process.exitCode = 2; return; }
  const payload = JSON.parse(await readFile(resolve(args[0]), "utf8"));
  const errors = validateByKind(payload);
  if (errors.length) { console.error(JSON.stringify({ valid: false, errors }, null, 2)); process.exitCode = 2; return; }
  console.log(JSON.stringify({ valid: true, payload: resolve(args[0]) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
}
