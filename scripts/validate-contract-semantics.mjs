#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isObject(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function push(errors, condition, message) { if (!condition) errors.push(message); }
function unique(values) { return new Set(values).size === values.length; }
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
    ["CrossRepresentationBench", "cross_representation"]
  ]);
  const categories = new Set(cases.map((item) => item?.category));
  for (const scope of payload?.scopes || []) {
    const requiredCategory = requiredCategoryByScope.get(scope);
    if (requiredCategory) push(errors, categories.has(requiredCategory), `${scope} requires a ${requiredCategory} case`);
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
  const knownObservationIds = new Set(media.flatMap((item) => item?.candidateObservationIds || []));
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
      push(errors, payload.actionSequenceRef.id === actionSequenceSpec.actionSequenceId && payload.actionSequenceRef.version === actionSequenceSpec.version, "ShotSpec must bind the supplied exact ActionSequenceSpec identity and version");
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
  push(errors, nonEmpty(payload?.camera?.movementIntent), "ShotSpec needs a motivated movement intent, including static");
  push(errors, payload?.validation?.oneDominantCameraIdea === true, "ShotSpec requires one dominant camera idea");
  push(errors, payload?.validation?.axisCoherent === true, "ShotSpec must preserve axis coherence");
}

function validateShotLightingPlan(payload, errors, sceneLightState) {
  const known = new Set((sceneLightState?.sources || []).map((item) => item?.sourceId));
  const uses = [payload?.key, payload?.fill, payload?.rim, ...(payload?.practicals || [])].filter(Boolean);
  if (known.size) for (const use of uses) push(errors, known.has(use?.sourceId), `ShotLightingPlan uses unknown source ${use?.sourceId}`);
  push(errors, payload?.validation?.stylePhysicalSeparated === true, "ShotLightingPlan must separate style from physical sources");
  push(errors, payload?.validation?.continuityBound === true, "ShotLightingPlan must bind continuity");
}

function validateTemporalSpec(payload, errors) {
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

function validatePromptRepair(payload, errors) {
  push(errors, Array.isArray(payload?.changeOnly) && payload.changeOnly.length === 1, "PromptRepair changes exactly one variable");
  push(errors, Array.isArray(payload?.evidenceObservationIds) && payload.evidenceObservationIds.length > 0, "PromptRepair requires observed evidence");
  push(errors, payload?.validation?.parentImmutable === true, "PromptRepair keeps its parent immutable");
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

function validateByKind(payload, context = {}) {
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
    case "cineweave_codex_license_profile": validateLicenseProfile(payload, errors); break;
    case "cineweave_codex_control_benchmark": validateBenchmark(payload, errors); break;
    case "cineweave_codex_control_benchmark_review": validateBenchmarkReview(payload, errors, context.benchmark); break;
    case "cineweave_adapter_descriptor": validateAdapterDescriptor(payload, errors, context.capabilityProfile); break;
    case "cineweave_execution_request": validateExecutionRequest(payload, errors); break;
    case "cineweave_execution_receipt": validateExecutionReceipt(payload, errors, context.executionRequest); break;
    case "cineweave_skill_evaluation_run": validateSkillEvaluationRun(payload, errors); break;
    case "cineweave_codex_image_prompt": validateIntegratedImage(payload, errors); break;
    case "cineweave_codex_prompt_record": validatePromptRecord(payload, errors); break;
    case "cineweave_codex_storyboard_sequence": validateIntegratedStoryboard(payload, errors); break;
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
    case "cineweave_codex_shot_lighting_plan": validateShotLightingPlan(payload, errors, context.sceneLightState); break;
    case "cineweave_codex_temporal_spec": validateTemporalSpec(payload, errors); break;
    case "cineweave_codex_prompt_repair": validatePromptRepair(payload, errors); break;
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
  const actionSequenceSpec = await readJson("examples/action-sequence-spec.json");
  const benchmark = await readJson("examples/control-benchmark.json");
  const referenceObservations = [{ artifactRef: referenceBindingSet.bindings[0].observationRef, payload: referenceObservation }];
  const cases = [
    ["examples/character-spec.json", {}], ["examples/character-morphology-spec.json", {}], ["examples/morphology-review.json", {}], ["examples/character-exploration-brief.json", {}], ["examples/character-option-set.json", {}], ["examples/character-preference-feedback.json", {}], ["examples/character-binding.json", {}], ["examples/character-reference-plan.json", {}], ["examples/character-appearance-state.json", {}], ["examples/character-review.json", {}], ["examples/character-repair.json", {}],
  ];
  if (mode === "all") cases.push(
    ["examples/story-brief.json", {}], ["examples/beat-sheet.json", {}], ["examples/script-scene.json", {}], ["examples/continuity-ledger.json", {}],
    ["examples/performance-timeline.json", {}],
    ["examples/scene-spec.json", {}], ["examples/scene-state.json", { sceneSpec }], ["examples/scene-binding.json", { sceneSpec }], ["examples/scene-reference-plan.json", { sceneSpec }], ["examples/interaction-constraint-set.json", {}], ["examples/scene-review.json", { sceneSpec }], ["examples/scene-repair.json", { sceneSpec }],
    ["examples/scene-light-state.json", {}],
    ["examples/asset-recipe.json", { controlSet }], ["recipes/character-morphology-neutral-3view.json", {}], ["recipes/character-identity-reference-sheet-3x3.json", {}], ["recipes/natural-human-fixtures-3up.json", {}], ["recipes/style-exploration-board-4up.json", {}], ["recipes/anime-character-fixtures-3up.json", {}], ["recipes/manga-character-fixtures-3up.json", {}], ["recipes/cross-representation-character-6up.json", {}], ["examples/board-assembly-plan.json", {}], ["examples/control-channel-set.json", {}], ["examples/evidence-bundle.json", {}], ["examples/capability-profile.json", {}], ["examples/license-profile.json", {}], ["examples/control-benchmark.json", {}], ["examples/control-benchmark-review.json", { benchmark }],
    ["examples/adapter-descriptor.json", {}], ["examples/execution-request.json", {}], ["examples/execution-receipt.json", {}], ["examples/execution-receipt-blocked.json", {}], ["examples/skill-evaluation-run.json", {}],
    ["examples/artifact-graph.json", {}], ["examples/project-bundle-manifest.json", {}],
    ["examples/reference-asset.json", {}], ["examples/reference-observation.json", { referenceAsset }],
    ["examples/reference-observation-portrait-face.json", { referenceAsset }], ["examples/reference-observation-portrait-skin.json", { referenceAsset }], ["examples/reference-observation-portrait-capture.json", { referenceAsset }],
    ["examples/reference-review.json", {}], ["examples/reference-binding-set.json", { referenceObservations }],
    ["examples/integrated-image-prompt.json", { sceneSpec }], ["examples/integrated-image-prompt-reference-reframe.json", {}], ["examples/integrated-storyboard.json", { sceneSpec }], ["examples/prompt-record.json", {}], ["examples/prompt-record-reference-reframe.json", {}], ["examples/prompt-record-cinematic-director-template.json", {}],
    ["examples/style-package.json", {}], ["examples/style-package-anime.json", {}], ["examples/style-package-manga.json", {}], ["examples/style-exploration-brief.json", {}], ["examples/style-option-set.json", {}], ["examples/style-preference-feedback.json", {}], ["examples/representation-binding.json", {}], ["examples/style-reference-plan.json", {}], ["examples/style-compile.json", {}], ["examples/style-compile-anime.json", {}], ["examples/style-light-grammar.json", {}], ["examples/style-review.json", {}],
    ["examples/action-sequence-spec.json", {}], ["examples/shot-spec.json", {}], ["examples/shot-spec-action.json", { actionSequenceSpec }], ["examples/shot-lighting-plan.json", { sceneLightState }], ["examples/temporal-spec.json", {}], ["examples/prompt-repair.json", {}],
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
  const badActionShot = await readJson("examples/shot-spec-action.json"); badActionShot.actionBeatIds[0] = "action-beat.unknown"; negative.push(["reject ShotSpec unknown action beat", badActionShot, { actionSequenceSpec }]);
  const badActionShotWeapon = await readJson("examples/shot-spec-action.json"); badActionShotWeapon.promptHandoff.actionBreakdown.weaponDetails[0].weaponRef = "weapon.unknown"; negative.push(["reject ShotSpec unknown action breakdown weapon", badActionShotWeapon, { actionSequenceSpec }]);
  const badShotLight = await readJson("examples/shot-lighting-plan.json"); badShotLight.key.sourceId = "light.unknown"; negative.push(["reject ShotLightingPlan unknown source", badShotLight, { sceneLightState }]);
  const badTemporal = await readJson("examples/temporal-spec.json"); badTemporal.actionTimeline[1].timeSeconds = 0.1; negative.push(["reject unordered TemporalSpec", badTemporal, {}]);
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

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
