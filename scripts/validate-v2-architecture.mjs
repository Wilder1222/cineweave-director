#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const manifestPath = join(contractRoot, "contracts", "manifest.json");
const expectedSkills = ["cineweave", "cineweave-story", "cineweave-character", "cineweave-scene", "cineweave-style", "cineweave-reference", "cineweave-director", "cineweave-prompt", "cineweave-production"];

function fail(errors, condition, message) { if (!condition) errors.push(message); }
function unique(values) { return new Set(values).size === values.length; }
async function readJson(path) { return JSON.parse(await readFile(path, "utf8")); }
function forbidsRequiredProperty(schema, propertyName) {
  return schema?.not?.anyOf?.some((branch) => Array.isArray(branch?.required) && branch.required.length === 1 && branch.required[0] === propertyName) === true;
}

async function main() {
  const errors = [];
  const plugin = JSON.parse(await readFile(join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const [shotSchema, shotLightingSchema, shotLightingExample, temporalSchema, cameraPrevisSchema, cameraPrevisExample, heroFrameSchema, heroFrameExample, assetAliasSchema, assetAliasExample, cinematicSkillSchema, cinematicSkillExample, shotCompilerPlanSchema, shotCompilerPlanExample, shotExample, storyboardSchema, storyboardExample, sequenceRhythmSchema, sequenceRhythmExample, directorRepairSchema, directorRepairExample, proposalSchema, proposalExample, renderPlanSchema, renderPlanExample, mediaImportSchema, mediaImportExample, mediaTechnicalProbeSchema, mediaTechnicalProbeExample, editorialTimelineSchema, editorialTimelineExample, colorPipelineSchema, colorPipelineExample, contentCredentialInspectionSchema, contentCredentialInspectionExample, contentCredentialHandoffSchema, contentCredentialHandoffExample, repairRunReceiptSchema, repairRunReceiptExample, capabilityResolutionSchema, capabilityResolutionExample, executionPreviewSchema, executionPreviewExample] = await Promise.all([
    readJson(join(contractRoot, "schemas", "shot-spec.schema.json")),
    readJson(join(contractRoot, "schemas", "shot-lighting-plan.schema.json")),
    readJson(join(contractRoot, "examples", "shot-lighting-plan.json")),
    readJson(join(contractRoot, "schemas", "temporal-spec.schema.json")),
    readJson(join(contractRoot, "schemas", "camera-previs-spec.schema.json")),
    readJson(join(contractRoot, "examples", "camera-previs-spec.json")),
    readJson(join(contractRoot, "schemas", "hero-frame-anchor.schema.json")),
    readJson(join(contractRoot, "examples", "hero-frame-anchor.json")),
    readJson(join(contractRoot, "schemas", "asset-alias-registry.schema.json")),
    readJson(join(contractRoot, "examples", "asset-alias-registry.json")),
    readJson(join(contractRoot, "schemas", "cinematic-skill-manifest.schema.json")),
    readJson(join(contractRoot, "examples", "cinematic-skill-manifest.json")),
    readJson(join(contractRoot, "schemas", "shot-compiler-plan.schema.json")),
    readJson(join(contractRoot, "examples", "shot-compiler-plan.json")),
    readJson(join(contractRoot, "examples", "shot-spec.json")),
    readJson(join(contractRoot, "schemas", "storyboard-output.schema.json")),
    readJson(join(contractRoot, "examples", "storyboard-action-sequence.json")),
    readJson(join(contractRoot, "schemas", "sequence-rhythm-spec.schema.json")),
    readJson(join(contractRoot, "examples", "sequence-rhythm-spec.json")),
    readJson(join(contractRoot, "schemas", "director-repair.schema.json")),
    readJson(join(contractRoot, "examples", "director-repair.json")),
    readJson(join(contractRoot, "schemas", "proposal-output.schema.json")),
    readJson(join(contractRoot, "examples", "proposal-output.json")),
    readJson(join(contractRoot, "schemas", "render-plan.schema.json")),
    readJson(join(contractRoot, "examples", "character-render-plan.json")),
    readJson(join(contractRoot, "schemas", "media-import.schema.json")),
    readJson(join(contractRoot, "examples", "media-import.json")),
    readJson(join(contractRoot, "schemas", "media-technical-probe.schema.json")),
    readJson(join(contractRoot, "examples", "media-technical-probe.json")),
    readJson(join(contractRoot, "schemas", "editorial-timeline-plan.schema.json")),
    readJson(join(contractRoot, "examples", "editorial-timeline-plan.json")),
    readJson(join(contractRoot, "schemas", "color-pipeline-profile.schema.json")),
    readJson(join(contractRoot, "examples", "color-pipeline-profile.json")),
    readJson(join(contractRoot, "schemas", "content-credential-inspection.schema.json")),
    readJson(join(contractRoot, "examples", "content-credential-inspection.json")),
    readJson(join(contractRoot, "schemas", "content-credential-handoff.schema.json")),
    readJson(join(contractRoot, "examples", "content-credential-handoff.json")),
    readJson(join(contractRoot, "schemas", "repair-run-receipt.schema.json")),
    readJson(join(contractRoot, "examples", "repair-run-receipt.json")),
    readJson(join(contractRoot, "schemas", "capability-resolution-plan.schema.json")),
    readJson(join(contractRoot, "examples", "capability-resolution-plan.json")),
    readJson(join(contractRoot, "schemas", "execution-preview.schema.json")),
    readJson(join(contractRoot, "examples", "execution-preview.json"))
  ]);
  fail(errors, plugin.name === "cineweave-studio", "plugin package name must be cineweave-studio");
  fail(errors, plugin.version === "2.5.1", "plugin version must be 2.5.1");
  fail(errors, manifest.suite === "cineweave-studio" && manifest.version === "2.5.1", "contract package must be CineWeave Studio v2.5.1");
  fail(errors, manifest.entrySkill === "cineweave", "manifest entrySkill must be cineweave");
  fail(errors, manifest.composition?.specialistsMayRunWithoutRouter === true, "manifest must declare router-independent specialists");
  fail(errors, manifest.composition?.allowsImplicitConversationState === false, "manifest must forbid hidden conversational state");
  fail(errors, manifest.composition?.allowsCycles === false, "manifest must forbid workflow cycles");

  const skillNames = (manifest.skills || []).map((skill) => skill.name);
  fail(errors, unique(skillNames), "skill names must be unique");
  fail(errors, expectedSkills.length === skillNames.length && expectedSkills.every((name) => skillNames.includes(name)), "manifest must include exactly the router and eight specialists");
  const routes = [];
  const contractKinds = new Map();
  for (const contract of manifest.contracts || []) {
    fail(errors, !contractKinds.has(contract.kind), `duplicate contract kind ${contract.kind}`);
    contractKinds.set(contract.kind, contract);
    fail(errors, existsSync(join(contractRoot, contract.schema)), `missing schema ${contract.schema}`);
    fail(errors, existsSync(join(contractRoot, contract.example)), `missing example ${contract.example}`);
  }
  for (const skill of manifest.skills || []) {
    routes.push(...(skill.owns || []));
    const root = join(repoRoot, "skills", skill.name);
    const skillPath = join(root, "SKILL.md");
    const agentPath = join(root, "agents", "openai.yaml");
    const contractsPath = join(root, "contracts.json");
    fail(errors, existsSync(skillPath), `${skill.name} must have SKILL.md`);
    fail(errors, existsSync(agentPath), `${skill.name} must have agents/openai.yaml`);
    fail(errors, existsSync(contractsPath), `${skill.name} must have contracts.json`);
    if (!existsSync(skillPath) || !existsSync(contractsPath)) continue;
    const skillText = await readFile(skillPath, "utf8");
    const index = JSON.parse(await readFile(contractsPath, "utf8"));
    fail(errors, skillText.includes(`name: ${skill.name}`), `${skill.name} frontmatter name mismatch`);
    fail(errors, !skillText.includes("../../schemas/"), `${skill.name} retains a V1 schema path`);
    fail(errors, index.contractPackage === "cineweave-contracts@2.5.1", `${skill.name} must point to the V2.5 contract package`);
    fail(errors, Array.isArray(index.standalone?.accepts) && index.standalone.accepts.length > 0, `${skill.name} lacks standalone inputs`);
    fail(errors, Array.isArray(index.standalone?.produces) && index.standalone.produces.length > 0, `${skill.name} lacks standalone outputs`);
    fail(errors, Array.isArray(index.contractKinds) && index.contractKinds.length > 0, `${skill.name} must declare portable contracts`);
    for (const kind of index.contractKinds || []) fail(errors, contractKinds.has(kind), `${skill.name} references unknown contract ${kind}`);
    if (skill.name !== "cineweave") {
      fail(errors, skill.standalone === true && skill.composable === true, `${skill.name} must be both standalone and composable`);
    }
  }
  fail(errors, unique(routes), "each route must have one owner");
  const brief = contractKinds.get("cineweave_codex_creative_brief");
  const workflow = contractKinds.get("cineweave_codex_workflow_plan");
  fail(errors, brief?.owner === "cineweave", "CreativeBrief must be owned by cineweave");
  fail(errors, workflow?.owner === "cineweave", "WorkflowPlan must be owned by cineweave");
  fail(errors, contractKinds.get("cineweave_codex_story_brief")?.owner === "cineweave-story", "StoryBrief must be owned by cineweave-story");
  fail(errors, contractKinds.get("cineweave_codex_prompt_record")?.owner === "cineweave-prompt", "PromptRecord must be owned by cineweave-prompt");
  const directorProposalContract = contractKinds.get("cineweave_codex_director_proposals");
  fail(errors, directorProposalContract?.owner === "cineweave-director", "DirectorProposals must be owned by cineweave-director");
  fail(errors, directorProposalContract?.schema === "schemas/proposal-output.schema.json" && directorProposalContract?.example === "examples/proposal-output.json", "DirectorProposals must publish its schema and canonical example");
  const proposalLegacyBranch = proposalSchema?.allOf?.find((branch) => branch?.if?.properties?.contractVersion?.const === "2.0.0");
  const proposalModernBranch = proposalSchema?.allOf?.find((branch) => branch?.if?.properties?.contractVersion?.const === "2.5.0");
  const proposalModernRequired = proposalModernBranch?.then?.required || [];
  const proposalModernItemRules = proposalModernBranch?.then?.properties?.proposals?.items?.allOf || [];
  const proposalModernItemRequired = proposalModernItemRules.find((branch) => Array.isArray(branch?.required))?.required || [];
  fail(errors, proposalSchema?.properties?.contractVersion?.enum?.includes("2.0.0") === true && proposalLegacyBranch?.then?.properties?.proposals?.items?.required?.includes("recommendedProvider") === true, "DirectorProposals must retain the legacy 2.0 provider-shaped input for compatibility");
  fail(errors, proposalSchema?.properties?.contractVersion?.enum?.includes("2.5.0") === true, "DirectorProposals must publish the 2.5.0 contract revision");
  for (const property of ["proposalSetId", "version", "explorationAxes", "humanSelection", "executionBoundary", "validation", "provenance"]) {
    fail(errors, proposalModernRequired.includes(property), "DirectorProposals 2.5 must require " + property);
  }
  for (const property of ["proposalId", "primaryDelta", "capabilityRequirements", "costClass", "riskClass"]) {
    fail(errors, proposalModernItemRequired.includes(property), "DirectorProposals 2.5 proposal must require " + property);
  }
  fail(errors, proposalModernItemRules.some((branch) => branch?.not?.required?.includes("recommendedProvider")), "DirectorProposals 2.5 must forbid Provider selection");
  fail(errors, proposalSchema?.$defs?.proposal?.properties?.recommendedProvider?.deprecated === true, "DirectorProposals legacy Provider field must be explicitly deprecated");
  fail(errors, proposalExample?.contractVersion === "2.5.0" && proposalExample?.proposalSetId && proposalExample?.version === 1, "DirectorProposals example must use the versioned 2.5 shape");
  fail(errors, proposalExample?.humanSelection?.status === "pending" && proposalExample?.executionBoundary?.providerNeutral === true, "DirectorProposals example must preserve a pending human, Provider-neutral boundary");
  fail(errors, Array.isArray(proposalExample?.proposals) && proposalExample.proposals.every((proposal) => !Object.hasOwn(proposal, "recommendedProvider")), "DirectorProposals example must not choose a Provider");
  const renderPlanContract = contractKinds.get("cineweave_codex_render_plan");
  fail(errors, renderPlanContract?.owner === "cineweave-director", "RenderPlan must be owned by cineweave-director");
  fail(errors, renderPlanContract?.schema === "schemas/render-plan.schema.json" && renderPlanContract?.example === "examples/character-render-plan.json", "RenderPlan must publish its schema and canonical example");
  const renderPlanModernBranch = renderPlanSchema?.allOf?.find((branch) => branch?.if?.properties?.contractVersion?.const === "2.5.0");
  const renderPlanModernRequired = renderPlanModernBranch?.then?.required || [];
  fail(errors, renderPlanSchema?.properties?.contractVersion?.enum?.includes("2.0.0") === true && renderPlanSchema?.properties?.contractVersion?.enum?.includes("2.5.0") === true, "RenderPlan must retain 2.0 compatibility and publish 2.5");
  for (const property of ["renderPlanId", "version", "promptRef", "provenance"]) {
    fail(errors, renderPlanModernRequired.includes(property), "RenderPlan 2.5 must require " + property);
  }
  fail(errors, renderPlanModernBranch?.then?.not?.required?.includes("promptPayloadRef") === true && renderPlanSchema?.properties?.promptPayloadRef?.deprecated === true, "RenderPlan 2.5 must forbid the deprecated prompt string");
  fail(errors, renderPlanSchema?.$defs?.exactPromptRef?.allOf?.[1]?.properties?.kind?.enum?.includes("cineweave_codex_image_prompt") === true, "RenderPlan 2.5 must use an exact prompt contract reference");
  fail(errors, renderPlanSchema?.$defs?.exactAssetRecipeRef && renderPlanSchema?.$defs?.exactCapabilityProfileRef && renderPlanSchema?.$defs?.exactLicenseProfileRef, "RenderPlan 2.5 must define exact production source references");
  fail(errors, renderPlanExample?.contractVersion === "2.5.0" && renderPlanExample?.renderPlanId && renderPlanExample?.version === 1, "RenderPlan example must use the versioned 2.5 shape");
  fail(errors, renderPlanExample?.promptRef?.kind === "cineweave_codex_image_prompt" && !Object.hasOwn(renderPlanExample, "promptPayloadRef"), "RenderPlan example must bind an exact prompt instead of a legacy string");
  fail(errors, renderPlanExample?.assetRecipeRef?.kind === "cineweave_codex_asset_recipe" && renderPlanExample?.capabilityProfileRef?.kind === "cineweave_codex_capability_profile", "RenderPlan example must preserve exact production sources");
  const mediaImportContract = contractKinds.get("cineweave_codex_media_import");
  fail(errors, mediaImportContract?.owner === "cineweave-director", "MediaImport must be owned by cineweave-director");
  fail(errors, mediaImportContract?.schema === "schemas/media-import.schema.json" && mediaImportContract?.example === "examples/media-import.json", "MediaImport must publish its schema and canonical example");
  const mediaImportModernBranch = mediaImportSchema?.allOf?.find((branch) => branch?.if?.properties?.contractVersion?.const === "2.5.0");
  const mediaImportModernRequired = mediaImportModernBranch?.then?.required || [];
  fail(errors, mediaImportSchema?.properties?.contractVersion?.enum?.includes("2.0.0") === true && mediaImportSchema?.properties?.contractVersion?.enum?.includes("2.5.0") === true, "MediaImport must retain 2.0 compatibility and publish 2.5");
  for (const property of ["mediaImportId", "version", "provenance"]) {
    fail(errors, mediaImportModernRequired.includes(property), "MediaImport 2.5 must require " + property);
  }
  fail(errors, mediaImportSchema?.properties?.renderPlanRef?.anyOf?.some((branch) => branch?.type === "string" && branch?.deprecated === true) === true, "MediaImport must retain its deprecated legacy RenderPlan string");
  fail(errors, mediaImportModernBranch?.then?.properties?.renderPlanRef?.$ref === "#/$defs/exactRenderPlanRef", "MediaImport 2.5 must require an exact RenderPlan reference");
  fail(errors, mediaImportSchema?.$defs?.exactRenderPlanRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_render_plan", "MediaImport 2.5 must define an exact RenderPlan reference");
  fail(errors, mediaImportSchema?.$defs?.exactExecutionRequestRef && mediaImportSchema?.$defs?.exactExecutionReceiptRef, "MediaImport 2.5 must define exact execution references");
  fail(errors, mediaImportSchema?.dependentRequired?.executionRequestRef?.includes("executionReceiptRef") === true && mediaImportSchema?.dependentRequired?.executionReceiptRef?.includes("executionRequestRef") === true, "MediaImport execution references must remain paired");
  fail(errors, mediaImportExample?.contractVersion === "2.5.0" && mediaImportExample?.mediaImportId && mediaImportExample?.version === 1, "MediaImport example must use the versioned 2.5 shape");
  fail(errors, mediaImportExample?.renderPlanRef?.kind === "cineweave_codex_render_plan" && mediaImportExample?.executionRequestRef?.kind === "cineweave_execution_request" && mediaImportExample?.executionReceiptRef?.kind === "cineweave_execution_receipt", "MediaImport example must preserve exact RenderPlan and execution evidence");
  const mediaTechnicalProbeContract = contractKinds.get("cineweave_codex_media_technical_probe");
  fail(errors, mediaTechnicalProbeContract?.owner === "cineweave-production", "MediaTechnicalProbe must be owned by cineweave-production");
  fail(errors, mediaTechnicalProbeContract?.schema === "schemas/media-technical-probe.schema.json" && mediaTechnicalProbeContract?.example === "examples/media-technical-probe.json", "MediaTechnicalProbe must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "mediaTechnicalProbeId", "version", "mediaImportRef", "mediaId", "mediaContentHash", "mediaByteSize", "skillReceipt", "probeStatus", "probeTool", "container", "streams", "executionBoundary", "validation", "provenance"]) {
    fail(errors, mediaTechnicalProbeSchema?.required?.includes(property), "MediaTechnicalProbe must require " + property);
  }
  fail(errors, mediaTechnicalProbeSchema?.properties?.contractVersion?.const === "2.5.0", "MediaTechnicalProbe must publish the 2.5.0 contract revision");
  fail(errors, mediaTechnicalProbeSchema?.$defs?.mediaImportRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_media_import", "MediaTechnicalProbe must bind an exact MediaImport");
  fail(errors, mediaTechnicalProbeSchema?.properties?.probeStatus?.enum?.includes("planned") === true && mediaTechnicalProbeSchema?.properties?.probeStatus?.enum?.includes("recorded") === true, "MediaTechnicalProbe must distinguish uninvoked and recorded probes");
  fail(errors, mediaTechnicalProbeSchema?.$defs?.probeTool?.properties?.executionState?.enum?.includes("not_invoked") === true && mediaTechnicalProbeSchema?.$defs?.probeTool?.properties?.executionState?.enum?.includes("ffprobe_recorded") === true, "MediaTechnicalProbe must model fixed ffprobe execution evidence");
  fail(errors, mediaTechnicalProbeSchema?.$defs?.container?.properties?.metadataExcluded?.const === true && mediaTechnicalProbeSchema?.$defs?.streams?.required?.includes("video") && mediaTechnicalProbeSchema?.$defs?.streams?.required?.includes("audio"), "MediaTechnicalProbe must retain selected streams while excluding raw metadata");
  fail(errors, mediaTechnicalProbeSchema?.$defs?.videoStream?.required?.includes("frameRate") && mediaTechnicalProbeSchema?.$defs?.videoStream?.required?.includes("timeBase") && mediaTechnicalProbeSchema?.$defs?.videoStream?.required?.includes("colorSignals"), "MediaTechnicalProbe video streams must retain time and color-signal observations");
  fail(errors, mediaTechnicalProbeSchema?.$defs?.executionBoundary?.properties?.callsNetwork?.const === false && mediaTechnicalProbeSchema?.$defs?.executionBoundary?.properties?.writesSourceMedia?.const === false && mediaTechnicalProbeSchema?.$defs?.executionBoundary?.properties?.storesRawFilePath?.const === false && mediaTechnicalProbeSchema?.$defs?.executionBoundary?.properties?.storesRawContainerTags?.const === false, "MediaTechnicalProbe must be local, read-only and privacy-bounded");
  fail(errors, mediaTechnicalProbeExample?.probeStatus === "recorded" && mediaTechnicalProbeExample?.probeTool?.toolId === "ffprobe" && mediaTechnicalProbeExample?.container?.status === "probed" && mediaTechnicalProbeExample?.streams?.video?.length > 0, "MediaTechnicalProbe example must retain one recorded sanitized ffprobe report");
  const editorialTimelineContract = contractKinds.get("cineweave_codex_editorial_timeline_plan");
  fail(errors, editorialTimelineContract?.owner === "cineweave-production", "EditorialTimelinePlan must be owned by cineweave-production");
  fail(errors, editorialTimelineContract?.schema === "schemas/editorial-timeline-plan.schema.json" && editorialTimelineContract?.example === "examples/editorial-timeline-plan.json", "EditorialTimelinePlan must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "editorialTimelinePlanId", "version", "storyboardRef", "skillReceipt", "timelineName", "frameRate", "timelineRange", "conformStatus", "tracks", "transitions", "otioExchange", "executionBoundary", "validation", "provenance"]) {
    fail(errors, editorialTimelineSchema?.required?.includes(property), "EditorialTimelinePlan must require " + property);
  }
  fail(errors, editorialTimelineSchema?.properties?.contractVersion?.const === "2.5.0", "EditorialTimelinePlan must publish the 2.5.0 contract revision");
  fail(errors, editorialTimelineSchema?.$defs?.storyboardRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_storyboard_sequence", "EditorialTimelinePlan must bind an exact Storyboard");
  fail(errors, editorialTimelineSchema?.$defs?.mediaImportRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_media_import", "EditorialTimelinePlan must bind exact external MediaImport references");
  fail(errors, editorialTimelineSchema?.$defs?.frameRate?.required?.includes("numerator") && editorialTimelineSchema?.$defs?.frameRate?.required?.includes("denominator"), "EditorialTimelinePlan must make rational frame rates explicit");
  fail(errors, editorialTimelineSchema?.$defs?.segment?.properties?.segmentType?.enum?.includes("placeholder") === true && editorialTimelineSchema?.$defs?.transition?.properties?.type?.enum?.includes("cut") === true, "EditorialTimelinePlan must model placeholders and explicit transitions");
  fail(errors, editorialTimelineExample?.conformStatus === "partial" && editorialTimelineExample?.frameRate?.numerator === 24 && editorialTimelineExample?.frameRate?.denominator === 1, "EditorialTimelinePlan example must use a partial rational-frame timeline");
  fail(errors, editorialTimelineExample?.otioExchange?.externalMediaOnly === true && editorialTimelineExample?.otioExchange?.serializationStatus === "not_exported" && editorialTimelineExample?.executionBoundary?.exportsTimeline === false, "EditorialTimelinePlan example must remain external-media-only and non-executing");
  const colorPipelineContract = contractKinds.get("cineweave_codex_color_pipeline_profile");
  fail(errors, colorPipelineContract?.owner === "cineweave-production", "ColorPipelineProfile must be owned by cineweave-production");
  fail(errors, colorPipelineContract?.schema === "schemas/color-pipeline-profile.schema.json" && colorPipelineContract?.example === "examples/color-pipeline-profile.json", "ColorPipelineProfile must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "colorPipelineProfileId", "version", "skillReceipt", "profileStatus", "ocioConfig", "sourceMedia", "referenceSpacePolicy", "outputTargets", "creativeLookPolicy", "executionBoundary", "validation", "provenance"]) {
    fail(errors, colorPipelineSchema?.required?.includes(property), "ColorPipelineProfile must require " + property);
  }
  fail(errors, colorPipelineSchema?.properties?.contractVersion?.const === "2.5.0" && colorPipelineSchema?.properties?.profileStatus?.const === "planned", "ColorPipelineProfile must publish a planned 2.5.0 profile");
  fail(errors, colorPipelineSchema?.$defs?.mediaImportRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_media_import", "ColorPipelineProfile must bind exact MediaImport sources");
  fail(errors, colorPipelineSchema?.$defs?.mediaTechnicalProbeRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_media_technical_probe", "ColorPipelineProfile must require exact MediaTechnicalProbe evidence for verified metadata");
  fail(errors, colorPipelineSchema?.$defs?.referenceSpacePolicy?.properties?.sceneReferenceSpace?.const === "scene_referred" && colorPipelineSchema?.$defs?.referenceSpacePolicy?.properties?.displayReferenceSpace?.const === "display_referred", "ColorPipelineProfile must distinguish scene and display reference spaces");
  fail(errors, colorPipelineSchema?.$defs?.outputPath?.properties?.mode?.enum?.includes("view_transform_and_display_colorspace") === true && colorPipelineSchema?.$defs?.outputPath?.properties?.mode?.enum?.includes("colorspace") === true, "ColorPipelineProfile must model OCIO direct and paired view paths");
  fail(errors, colorPipelineExample?.ocioConfig?.loadStatus === "not_loaded" && colorPipelineExample?.sourceMedia?.[0]?.mediaImportRef?.kind === "cineweave_codex_media_import", "ColorPipelineProfile example must use a planned config and exact media source");
  fail(errors, colorPipelineExample?.referenceSpacePolicy?.workingRole === "scene_linear" && colorPipelineExample?.outputTargets?.some((target) => target.purpose === "preview") && colorPipelineExample?.outputTargets?.some((target) => target.purpose === "delivery"), "ColorPipelineProfile example must separate working, preview and delivery color spaces");
  fail(errors, colorPipelineExample?.creativeLookPolicy?.appliesCreativeLook === false && colorPipelineExample?.executionBoundary?.loadsOcioConfig === false && colorPipelineExample?.executionBoundary?.appliesColorTransforms === false && colorPipelineExample?.executionBoundary?.exportsLut === false, "ColorPipelineProfile example must not claim creative looks or adapter execution");
  const contentCredentialInspectionContract = contractKinds.get("cineweave_codex_content_credential_inspection");
  fail(errors, contentCredentialInspectionContract?.owner === "cineweave-reference", "ContentCredentialInspection must be owned by cineweave-reference");
  fail(errors, contentCredentialInspectionContract?.schema === "schemas/content-credential-inspection.schema.json" && contentCredentialInspectionContract?.example === "examples/content-credential-inspection.json", "ContentCredentialInspection must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "contentCredentialInspectionId", "version", "referenceAssetRef", "assetByteHash", "skillReceipt", "inspectionStatus", "validator", "manifestStore", "result", "executionBoundary", "validation", "provenance"]) {
    fail(errors, contentCredentialInspectionSchema?.required?.includes(property), "ContentCredentialInspection must require " + property);
  }
  fail(errors, contentCredentialInspectionSchema?.properties?.contractVersion?.const === "2.5.0", "ContentCredentialInspection must publish the 2.5.0 contract revision");
  fail(errors, contentCredentialInspectionSchema?.$defs?.referenceAssetRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_reference_asset", "ContentCredentialInspection must bind an exact ReferenceAsset");
  fail(errors, contentCredentialInspectionSchema?.$defs?.validator?.properties?.executionState?.enum?.includes("not_invoked") === true && contentCredentialInspectionSchema?.$defs?.validator?.properties?.executionState?.enum?.includes("external_report_recorded") === true, "ContentCredentialInspection must distinguish a planned inspection from an external report");
  for (const property of ["assertions", "claimSignature", "hardBinding", "ingredients", "timestamp", "credentialRevocation", "assetContent"]) {
    fail(errors, contentCredentialInspectionSchema?.$defs?.result?.properties?.checks?.required?.includes(property), "ContentCredentialInspection must retain the C2PA " + property + " check");
  }
  fail(errors, contentCredentialInspectionSchema?.$defs?.result?.properties?.rightsConclusion?.const === "not_determined" && contentCredentialInspectionSchema?.$defs?.result?.properties?.truthConclusion?.const === "not_determined", "ContentCredentialInspection must not turn C2PA evidence into rights or truth conclusions");
  fail(errors, contentCredentialInspectionSchema?.$defs?.executionBoundary?.properties?.runsValidator?.const === false && contentCredentialInspectionSchema?.$defs?.executionBoundary?.properties?.writesMedia?.const === false && contentCredentialInspectionSchema?.$defs?.executionBoundary?.properties?.writesManifest?.const === false, "ContentCredentialInspection must not execute a validator or write media/manifests");
  fail(errors, contentCredentialInspectionExample?.inspectionStatus === "planned" && contentCredentialInspectionExample?.validator?.executionState === "not_invoked" && contentCredentialInspectionExample?.manifestStore?.inspectionState === "not_inspected", "ContentCredentialInspection example must remain planned until an external report is recorded");
  fail(errors, contentCredentialInspectionExample?.result?.validationState === "not_checked" && contentCredentialInspectionExample?.result?.rightsConclusion === "not_determined" && contentCredentialInspectionExample?.result?.truthConclusion === "not_determined", "ContentCredentialInspection example must not claim a C2PA, rights or truth result");
  const contentCredentialHandoffContract = contractKinds.get("cineweave_codex_content_credential_handoff");
  fail(errors, contentCredentialHandoffContract?.owner === "cineweave-production", "ContentCredentialHandoff must be owned by cineweave-production");
  fail(errors, contentCredentialHandoffContract?.schema === "schemas/content-credential-handoff.schema.json" && contentCredentialHandoffContract?.example === "examples/content-credential-handoff.json", "ContentCredentialHandoff must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "contentCredentialHandoffId", "version", "referenceAssetRef", "contentCredentialInspectionRef", "skillReceipt", "handoffStatus", "inspectionRequirement", "provenancePlan", "executionBoundary", "validation", "provenance"]) {
    fail(errors, contentCredentialHandoffSchema?.required?.includes(property), "ContentCredentialHandoff must require " + property);
  }
  fail(errors, contentCredentialHandoffSchema?.properties?.contractVersion?.const === "2.5.0" && contentCredentialHandoffSchema?.properties?.handoffStatus?.const === "planned", "ContentCredentialHandoff must publish a planned 2.5.0 handoff");
  fail(errors, contentCredentialHandoffSchema?.$defs?.referenceAssetRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_reference_asset" && contentCredentialHandoffSchema?.$defs?.contentCredentialInspectionRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_content_credential_inspection", "ContentCredentialHandoff must bind exact ReferenceAsset and ContentCredentialInspection sources");
  fail(errors, contentCredentialHandoffSchema?.$defs?.inspectionRequirement?.properties?.requiresRecordedInspectionBeforeExternalTransfer?.const === true && contentCredentialHandoffSchema?.$defs?.inspectionRequirement?.properties?.requiresDerivedOutputRevalidation?.const === true, "ContentCredentialHandoff must require recorded inspection and derived-output revalidation");
  fail(errors, contentCredentialHandoffSchema?.$defs?.provenancePlan?.properties?.sourceRelationship?.const === "ingredient_planned" && contentCredentialHandoffSchema?.$defs?.provenancePlan?.properties?.manifestAction?.const === "not_performed" && contentCredentialHandoffSchema?.$defs?.provenancePlan?.properties?.rawManifestEmbedded?.const === false, "ContentCredentialHandoff must only plan an ingredient relationship without writing or embedding a manifest");
  fail(errors, contentCredentialHandoffSchema?.$defs?.executionBoundary?.properties?.invokesAdapter?.const === false && contentCredentialHandoffSchema?.$defs?.executionBoundary?.properties?.writesMedia?.const === false && contentCredentialHandoffSchema?.$defs?.executionBoundary?.properties?.writesManifest?.const === false, "ContentCredentialHandoff must remain non-executing");
  fail(errors, contentCredentialHandoffExample?.handoffStatus === "planned" && contentCredentialHandoffExample?.provenancePlan?.sourceRelationship === "ingredient_planned" && contentCredentialHandoffExample?.provenancePlan?.manifestAction === "not_performed", "ContentCredentialHandoff example must preserve the planned ingredient-only boundary");
  const repairRunContract = contractKinds.get("cineweave_codex_repair_run_receipt");
  fail(errors, repairRunContract?.owner === "cineweave-production", "RepairRunReceipt must be owned by cineweave-production");
  fail(errors, repairRunContract?.schema === "schemas/repair-run-receipt.schema.json" && repairRunContract?.example === "examples/repair-run-receipt.json", "RepairRunReceipt must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "repairRunId", "version", "status", "repairRef", "targetRef", "candidateRef", "before", "after", "preserve", "preservedInputRefs", "changeEvidence", "approvalEvidence", "adapter", "timing", "acceptance", "executionBoundary", "validation", "failure", "provenance"]) {
    fail(errors, repairRunReceiptSchema?.required?.includes(property), "RepairRunReceipt must require " + property);
  }
  fail(errors, repairRunReceiptSchema?.properties?.contractVersion?.const === "2.5.0", "RepairRunReceipt must publish the 2.5.0 contract revision");
  fail(errors, repairRunReceiptSchema?.properties?.status?.enum?.includes("awaiting_review") === true && repairRunReceiptSchema?.properties?.status?.enum?.includes("blocked") === true && repairRunReceiptSchema?.properties?.status?.enum?.includes("failed") === true, "RepairRunReceipt must distinguish reviewable, blocked and failed runs");
  fail(errors, repairRunReceiptSchema?.$defs?.executionBoundary?.properties?.callsNetwork?.const === false && repairRunReceiptSchema?.$defs?.executionBoundary?.properties?.writesSourceMedia?.const === false && repairRunReceiptSchema?.$defs?.executionBoundary?.properties?.mutatesParentArtifact?.const === false && repairRunReceiptSchema?.$defs?.executionBoundary?.properties?.claimsApproval?.const === false, "RepairRunReceipt must keep the local non-writing approval boundary");
  fail(errors, repairRunReceiptSchema?.$defs?.validation?.properties?.parentImmutable?.const === true && repairRunReceiptSchema?.$defs?.validation?.properties?.noSuccessClaim?.const === true, "RepairRunReceipt must require parent immutability and no success claim");
  fail(errors, repairRunReceiptExample?.status === "blocked" && repairRunReceiptExample?.candidateRef === null && repairRunReceiptExample?.approvalEvidence?.decision === "missing" && repairRunReceiptExample?.acceptance?.status === "pending", "RepairRunReceipt example must demonstrate a blocked exact-approval boundary");
  fail(errors, contractKinds.get("cineweave_codex_action_sequence_spec")?.owner === "cineweave-director", "ActionSequenceSpec must be owned by cineweave-director");
  fail(errors, contractKinds.get("cineweave_codex_shot_spec")?.owner === "cineweave-director", "ShotSpec must be owned by cineweave-director");
  const storyboardContract = contractKinds.get("cineweave_codex_storyboard_sequence");
  fail(errors, storyboardContract?.owner === "cineweave-director", "Storyboard must be owned by cineweave-director");
  fail(errors, storyboardContract?.example === "examples/storyboard-action-sequence.json", "Storyboard must publish the action-scoped coverage example");
  for (const property of ["kind", "contractVersion", "storyboardId", "version", "skillReceipt", "sequenceTitle", "scenePurpose", "shots", "coverageLedger", "executionBoundary", "validation", "provenance"]) {
    fail(errors, storyboardSchema?.required?.includes(property), "Storyboard must require " + property);
  }
  for (const property of ["shotId", "shotSpecRef", "order", "coverageLedgerIds", "framePrompt"]) {
    fail(errors, storyboardSchema?.$defs?.shot?.required?.includes(property), "Storyboard shot must require " + property);
  }
  fail(errors, storyboardSchema?.properties?.contractVersion?.const === "2.5.0", "Storyboard must publish the 2.5.0 contract revision");
  fail(errors, storyboardSchema?.dependentRequired?.actionSequenceRef?.includes("actionBeatIds") === true && storyboardSchema?.dependentRequired?.actionBeatIds?.includes("actionSequenceRef") === true, "Storyboard action references and beat selections must be paired");
  fail(errors, storyboardSchema?.$defs?.coverageLedgerEntry?.required?.includes("beatIds") && storyboardSchema?.$defs?.coverageLedgerEntry?.required?.includes("shotIds"), "Storyboard coverage entries must close beat and shot links");
  fail(errors, storyboardSchema?.$defs?.storyboardProductionBindings?.required?.includes("boardAssemblyPlanRef") && storyboardSchema?.$defs?.storyboardProductionBindings?.required?.includes("panels"), "Storyboard production bindings must use a BoardAssemblyPlan and panels");
  fail(errors, storyboardExample?.actionSequenceRef?.kind === "cineweave_codex_action_sequence_spec" && storyboardExample?.actionBeatIds?.length > 0, "Storyboard example must bind an ActionSequenceSpec scope");
  fail(errors, storyboardExample?.coverageLedger?.length > 0 && storyboardExample?.productionBindings?.panels?.length === storyboardExample?.shots?.length, "Storyboard example must close coverage and panel bindings");
  const sequenceRhythmContract = contractKinds.get("cineweave_codex_sequence_rhythm_spec");
  fail(errors, sequenceRhythmContract?.owner === "cineweave-director", "SequenceRhythmSpec must be owned by cineweave-director");
  fail(errors, sequenceRhythmContract?.schema === "schemas/sequence-rhythm-spec.schema.json" && sequenceRhythmContract?.example === "examples/sequence-rhythm-spec.json", "SequenceRhythmSpec must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "sequenceRhythmSpecId", "version", "storyboardRef", "skillReceipt", "rhythmIntent", "timebase", "shotDurationPolicy", "tempoPhases", "shotWindows", "breathingPoints", "transitions", "continuity", "executionBoundary", "validation", "provenance"]) {
    fail(errors, sequenceRhythmSchema?.required?.includes(property), "SequenceRhythmSpec must require " + property);
  }
  fail(errors, sequenceRhythmSchema?.properties?.contractVersion?.const === "2.5.0", "SequenceRhythmSpec must publish the 2.5.0 contract revision");
  fail(errors, sequenceRhythmSchema?.$defs?.storyboardRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_storyboard_sequence", "SequenceRhythmSpec must bind an exact Storyboard");
  fail(errors, sequenceRhythmSchema?.$defs?.timebase?.properties?.unit?.const === "frames" && sequenceRhythmSchema?.$defs?.timebase?.properties?.frameIndexOrigin?.const === 0, "SequenceRhythmSpec must use explicit zero-based integer frame timing");
  fail(errors, sequenceRhythmSchema?.$defs?.shotWindow?.required?.includes("startFrame") && sequenceRhythmSchema?.$defs?.shotWindow?.required?.includes("endFrame"), "SequenceRhythmSpec must require explicit shot windows");
  fail(errors, sequenceRhythmSchema?.$defs?.transition?.required?.includes("fromShotId") && sequenceRhythmSchema?.$defs?.transition?.required?.includes("toShotId") && sequenceRhythmSchema?.$defs?.transition?.required?.includes("grammar"), "SequenceRhythmSpec transitions must name adjacent shots and grammar");
  fail(errors, sequenceRhythmSchema?.$defs?.executionBoundary?.properties?.providerNeutral?.const === true && sequenceRhythmSchema?.$defs?.executionBoundary?.properties?.generatesMedia?.const === false && sequenceRhythmSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false && sequenceRhythmSchema?.$defs?.executionBoundary?.properties?.editsMedia?.const === false, "SequenceRhythmSpec must remain a non-editing provider-neutral plan");
  fail(errors, sequenceRhythmExample?.storyboardRef?.kind === "cineweave_codex_storyboard_sequence" && sequenceRhythmExample?.timebase?.numerator === 24 && sequenceRhythmExample?.timebase?.denominator === 1, "SequenceRhythmSpec example must bind a rational storyboard timebase");
  fail(errors, sequenceRhythmExample?.shotWindows?.length === sequenceRhythmExample?.tempoPhases?.[0]?.shotIds?.length && sequenceRhythmExample?.transitions?.length === 0, "SequenceRhythmSpec example must close its one-shot phase without inventing transitions");
  const directorRepairContract = contractKinds.get("cineweave_codex_director_repair");
  fail(errors, directorRepairContract?.owner === "cineweave-director", "DirectorRepair must be owned by cineweave-director");
  fail(errors, directorRepairContract?.schema === "schemas/director-repair.schema.json" && directorRepairContract?.example === "examples/director-repair.json", "DirectorRepair must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "repairId", "version", "disposition", "skillReceipt", "observedFailure", "preserve", "acceptanceChecks", "stopCondition", "executionGate", "executionBoundary", "validation", "provenance"]) {
    fail(errors, directorRepairSchema?.required?.includes(property), "DirectorRepair must require " + property);
  }
  fail(errors, directorRepairSchema?.properties?.contractVersion?.const === "2.5.0", "DirectorRepair must publish the 2.5.0 contract revision");
  fail(errors, directorRepairSchema?.$defs?.directorTargetRef?.oneOf?.some((branch) => branch?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_shot_spec") === true, "DirectorRepair must support exact ShotSpec targets");
  fail(errors, directorRepairExample?.disposition === "repair" && directorRepairExample?.targetRef?.kind === "cineweave_codex_shot_spec" && directorRepairExample?.change?.variable === "camera", "DirectorRepair example must demonstrate one exact Director camera repair");
  fail(errors, shotSchema?.properties?.lightingPlanRef?.deprecated === true, "ShotSpec lightingPlanRef must remain an explicit deprecated migration field");
  fail(errors, shotSchema?.properties?.temporalSpecRef?.deprecated === true, "ShotSpec temporalSpecRef must remain an explicit deprecated migration field");
  fail(errors, forbidsRequiredProperty(shotSchema, "lightingPlanRef"), "ShotSpec must forbid downstream ShotLightingPlan back-references");
  fail(errors, forbidsRequiredProperty(shotSchema, "temporalSpecRef"), "ShotSpec must forbid downstream TemporalSpec back-references");
  fail(errors, !Object.hasOwn(shotExample, "lightingPlanRef") && !Object.hasOwn(shotExample, "temporalSpecRef"), "ShotSpec example must not contain downstream back-references");
  fail(errors, shotLightingSchema?.required?.includes("shotSpecRef"), "ShotLightingPlan must require its upstream ShotSpec ref");
  const shotLightingModernBranch = shotLightingSchema?.allOf?.find((branch) => branch?.if?.properties?.contractVersion?.const === "2.5.0");
  fail(errors, shotLightingSchema?.properties?.contractVersion?.enum?.includes("2.2.0") === true && shotLightingSchema?.properties?.contractVersion?.enum?.includes("2.5.0") === true, "ShotLightingPlan must retain 2.2 compatibility and publish 2.5");
  fail(errors, shotLightingSchema?.properties?.fill?.$ref === "#/$defs/optionalShotLightUse", "ShotLightingPlan must permit an explicit nullable fill");
  fail(errors, shotLightingModernBranch?.then?.properties?.fill?.$ref === "#/$defs/optionalModernShotLightUse", "ShotLightingPlan 2.5 must require modern transport-aware fill semantics");
  fail(errors, shotLightingSchema?.$defs?.modernShotLightUse && shotLightingSchema?.$defs?.optionalModernShotLightUse, "ShotLightingPlan 2.5 must define transport-aware light uses");
  fail(errors, shotLightingExample?.contractVersion === "2.5.0" && shotLightingExample?.fill?.transport === "bounce" && shotLightingExample?.fill?.viaSurfaceAnchor, "ShotLightingPlan example must show a physical bounced fill path");
  fail(errors, shotLightingExample?.validation?.fillIntentional === true, "ShotLightingPlan 2.5 example must make its fill decision explicit");
  fail(errors, temporalSchema?.required?.includes("shotSpecRef"), "TemporalSpec must require its upstream ShotSpec ref");
  fail(errors, temporalSchema?.properties?.heroFrameAnchorRef?.$ref === "#/$defs/heroFrameAnchorRef" || temporalSchema?.properties?.heroFrameAnchorRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_hero_frame_anchor", "TemporalSpec must permit an optional exact HeroFrameAnchor ref");
  const heroFrameContract = contractKinds.get("cineweave_codex_hero_frame_anchor");
  fail(errors, heroFrameContract?.owner === "cineweave-director", "HeroFrameAnchor must be owned by cineweave-director");
  fail(errors, heroFrameContract?.schema === "schemas/hero-frame-anchor.schema.json" && heroFrameContract?.example === "examples/hero-frame-anchor.json", "HeroFrameAnchor must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "heroFrameAnchorId", "version", "heroFrameRef", "sourceSelection", "shotSpecRef", "bindingRefs", "skillReceipt", "visualDna", "inheritancePolicy", "executionBoundary", "validation", "provenance"]) {
    fail(errors, heroFrameSchema?.required?.includes(property), "HeroFrameAnchor must require " + property);
  }
  fail(errors, heroFrameSchema?.properties?.contractVersion?.const === "2.5.0", "HeroFrameAnchor must publish the 2.5.0 contract revision");
  fail(errors, heroFrameSchema?.$defs?.heroFrameRef?.oneOf?.some((branch) => branch?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_reference_asset") === true && heroFrameSchema?.$defs?.heroFrameRef?.oneOf?.some((branch) => branch?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_media_import") === true, "HeroFrameAnchor must accept only exact ReferenceAsset or MediaImport sources");
  fail(errors, heroFrameSchema?.$defs?.sourceSelection?.allOf?.some((branch) => branch?.then?.required?.includes("frameIndex")) === true && heroFrameSchema?.$defs?.sourceSelection?.allOf?.some((branch) => branch?.then?.required?.includes("timeSeconds")) === true, "HeroFrameAnchor must make MediaImport frame selection explicit");
  fail(errors, heroFrameSchema?.$defs?.inheritancePolicy?.required?.includes("preserve") && heroFrameSchema?.$defs?.inheritancePolicy?.required?.includes("allowOverrides") && heroFrameSchema?.$defs?.inheritancePolicy?.required?.includes("lockedPaths"), "HeroFrameAnchor must require an explicit inheritance policy");
  fail(errors, heroFrameSchema?.$defs?.executionBoundary?.properties?.providerNeutral?.const === true && heroFrameSchema?.$defs?.executionBoundary?.properties?.generatesMedia?.const === false && heroFrameSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false && heroFrameSchema?.$defs?.executionBoundary?.properties?.mutatesCanon?.const === false, "HeroFrameAnchor must remain provider-neutral, non-executing and non-mutating");
  fail(errors, heroFrameExample?.heroFrameRef?.kind === "cineweave_codex_reference_asset" && heroFrameExample?.shotSpecRef?.kind === "cineweave_codex_shot_spec" && heroFrameExample?.sourceSelection?.mode === "whole_asset", "HeroFrameAnchor example must bind an exact still and ShotSpec");
  fail(errors, heroFrameExample?.inheritancePolicy?.lockedPaths?.some((item) => item.path === "character_identity" && item.level === "hard") && heroFrameExample?.inheritancePolicy?.lockedPaths?.some((item) => item.path === "scene_geography" && item.level === "hard"), "HeroFrameAnchor example must hard-lock identity and geography inheritance");
  const assetAliasContract = contractKinds.get("cineweave_codex_asset_alias_registry");
  fail(errors, assetAliasContract?.owner === "cineweave-reference", "AssetAliasRegistry must be owned by cineweave-reference");
  fail(errors, assetAliasContract?.schema === "schemas/asset-alias-registry.schema.json" && assetAliasContract?.example === "examples/asset-alias-registry.json", "AssetAliasRegistry must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "assetAliasRegistryId", "version", "status", "scope", "aliases", "collisionPolicy", "resolutionPolicy", "skillReceipt", "executionBoundary", "validation", "provenance"]) {
    fail(errors, assetAliasSchema?.required?.includes(property), "AssetAliasRegistry must require " + property);
  }
  fail(errors, assetAliasSchema?.properties?.contractVersion?.const === "2.5.0", "AssetAliasRegistry must publish the 2.5.0 contract revision");
  fail(errors, assetAliasSchema?.$defs?.targetRef?.oneOf?.some((branch) => branch?.allOf?.[1]?.properties?.kind?.const === "character_binding") === true && assetAliasSchema?.$defs?.targetRef?.oneOf?.some((branch) => branch?.allOf?.[1]?.properties?.kind?.const === "scene_binding") === true, "AssetAliasRegistry must support exact domain binding refs");
  fail(errors, assetAliasSchema?.$defs?.resolutionPolicy?.properties?.allowLatest?.const === false && assetAliasSchema?.$defs?.resolutionPolicy?.properties?.inferFromPrompt?.const === false, "AssetAliasRegistry must forbid latest lookup and prompt inference");
  fail(errors, assetAliasSchema?.$defs?.executionBoundary?.properties?.resolvesReferencesOnly?.const === true && assetAliasSchema?.$defs?.executionBoundary?.properties?.generatesMedia?.const === false && assetAliasSchema?.$defs?.executionBoundary?.properties?.mutatesCanon?.const === false, "AssetAliasRegistry must remain a reference-only non-mutating plan");
  fail(errors, assetAliasExample?.aliases?.length === 3 && assetAliasExample?.aliases?.every((item) => item.alias.startsWith("@") && item.status === "resolved"), "AssetAliasRegistry example must demonstrate resolved @Asset aliases");
  const cinematicSkillContract = contractKinds.get("cineweave_codex_cinematic_skill_manifest");
  fail(errors, cinematicSkillContract?.owner === "cineweave-director", "CinematicSkillManifest must be owned by cineweave-director");
  fail(errors, cinematicSkillContract?.schema === "schemas/cinematic-skill-manifest.schema.json" && cinematicSkillContract?.example === "examples/cinematic-skill-manifest.json", "CinematicSkillManifest must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "cinematicSkillManifestId", "version", "title", "status", "skills", "skillReceipt", "executionBoundary", "validation", "provenance"]) {
    fail(errors, cinematicSkillSchema?.required?.includes(property), "CinematicSkillManifest must require " + property);
  }
  fail(errors, cinematicSkillSchema?.properties?.contractVersion?.const === "2.5.0", "CinematicSkillManifest must publish the 2.5.0 contract revision");
  fail(errors, cinematicSkillSchema?.$defs?.parameter?.required?.includes("valueType") && cinematicSkillSchema?.$defs?.parameter?.required?.includes("targets"), "CinematicSkillManifest parameters must be typed and owner-targeted");
  fail(errors, cinematicSkillSchema?.$defs?.programStep?.required?.includes("order") && cinematicSkillSchema?.$defs?.programStep?.required?.includes("ownerSkill") && cinematicSkillSchema?.$defs?.programStep?.required?.includes("target"), "CinematicSkillManifest programs must be ordered owner-routed steps");
  fail(errors, cinematicSkillSchema?.$defs?.executionBoundary?.properties?.providerNeutral?.const === true && cinematicSkillSchema?.$defs?.executionBoundary?.properties?.generatesMedia?.const === false && cinematicSkillSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false && cinematicSkillSchema?.$defs?.executionBoundary?.properties?.mutatesCanon?.const === false, "CinematicSkillManifest must remain provider-neutral, non-executing and non-mutating");
  fail(errors, cinematicSkillExample?.skills?.length === 12 && cinematicSkillExample?.skills?.some((skill) => skill.skillId === "slow-push-reaction") && cinematicSkillExample?.skills?.some((skill) => skill.skillId === "match-cut"), "CinematicSkillManifest example must publish the first twelve Atomic Cinematic Skills");
  fail(errors, cinematicSkillExample?.executionBoundary?.generatesMedia === false && cinematicSkillExample?.validation?.controlSurfaceProjectionOnly === true, "CinematicSkillManifest example must keep controls projection-only");
  const shotCompilerContract = contractKinds.get("cineweave_codex_shot_compiler_plan");
  fail(errors, shotCompilerContract?.owner === "cineweave-director", "ShotCompilerPlan must be owned by cineweave-director");
  fail(errors, shotCompilerContract?.schema === "schemas/shot-compiler-plan.schema.json" && shotCompilerContract?.example === "examples/shot-compiler-plan.json", "ShotCompilerPlan must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "shotCompilerPlanId", "version", "cinematicSkillManifestRef", "skillSelection", "intent", "parameterValues", "resolvedBindings", "upstreamRefs", "controlSurface", "handoffs", "compileTrace", "skillReceipt", "executionBoundary", "validation", "provenance"]) {
    fail(errors, shotCompilerPlanSchema?.required?.includes(property), "ShotCompilerPlan must require " + property);
  }
  fail(errors, shotCompilerPlanSchema?.properties?.contractVersion?.const === "2.5.0", "ShotCompilerPlan must publish the 2.5.0 contract revision");
  fail(errors, shotCompilerPlanSchema?.$defs?.manifestRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_cinematic_skill_manifest", "ShotCompilerPlan must bind an exact CinematicSkillManifest");
  fail(errors, shotCompilerPlanSchema?.$defs?.controlSurface?.properties?.projectionOnly?.const === true && shotCompilerPlanSchema?.$defs?.handoff?.properties?.status?.const === "planned", "ShotCompilerPlan controls must be projection-only and handoffs planned");
  fail(errors, shotCompilerPlanSchema?.$defs?.executionBoundary?.properties?.providerNeutral?.const === true && shotCompilerPlanSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false && shotCompilerPlanSchema?.$defs?.executionBoundary?.properties?.mutatesCanon?.const === false, "ShotCompilerPlan must remain provider-neutral, non-executing and non-mutating");
  fail(errors, shotCompilerPlanExample?.cinematicSkillManifestRef?.kind === "cineweave_codex_cinematic_skill_manifest" && shotCompilerPlanExample?.skillSelection?.skillId === "slow-push-reaction" && shotCompilerPlanExample?.controlSurface?.projectionOnly === true, "ShotCompilerPlan example must preserve exact skill selection and projection surface");
  fail(errors, shotCompilerPlanExample?.handoffs?.length === 3 && shotCompilerPlanExample?.handoffs?.every((handoff) => handoff.status === "planned"), "ShotCompilerPlan example must close three planned owner handoffs");
  fail(errors, existsSync(join(repoRoot, "packages", "cineweave-runtime", "src", "cinematic-skill-runtime.mjs")) && existsSync(join(repoRoot, "tests", "runtime", "cinematic-skill-runtime.test.mjs")), "Atomic Cinematic Skill runtime and tests must be present");
  const cameraPrevisContract = contractKinds.get("cineweave_codex_camera_previs_spec");
  fail(errors, cameraPrevisContract?.owner === "cineweave-director", "CameraPrevisSpec must be owned by cineweave-director");
  fail(errors, cameraPrevisContract?.schema === "schemas/camera-previs-spec.schema.json" && cameraPrevisContract?.example === "examples/camera-previs-spec.json", "CameraPrevisSpec must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "cameraPrevisSpecId", "version", "shotSpecRef", "sceneBindingRef", "skillReceipt", "coordinateSystem", "frameRate", "frameRange", "camera", "motion", "tracks", "endState", "executionBoundary", "validation", "provenance"]) {
    fail(errors, cameraPrevisSchema?.required?.includes(property), "CameraPrevisSpec must require " + property);
  }
  fail(errors, cameraPrevisSchema?.properties?.contractVersion?.const === "2.5.0", "CameraPrevisSpec must publish the 2.5.0 contract revision");
  fail(errors, cameraPrevisSchema?.$defs?.shotSpecRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_shot_spec", "CameraPrevisSpec must depend on an exact ShotSpec");
  fail(errors, cameraPrevisSchema?.$defs?.sceneBindingRef?.allOf?.[1]?.properties?.kind?.const === "scene_binding", "CameraPrevisSpec must depend on an exact SceneBinding");
  fail(errors, cameraPrevisSchema?.$defs?.temporalSpecRef?.allOf?.[1]?.properties?.kind?.const === "cineweave_codex_temporal_spec", "CameraPrevisSpec must use an optional exact TemporalSpec");
  fail(errors, cameraPrevisSchema?.$defs?.coordinateSystem?.properties?.linearUnit?.const === "meter" && cameraPrevisSchema?.$defs?.frameRate?.properties?.numerator?.type === "integer", "CameraPrevisSpec must make units and a rational frame rate explicit");
  fail(errors, cameraPrevisSchema?.$defs?.tracks?.required?.includes("pose") && cameraPrevisSchema?.$defs?.tracks?.required?.includes("intrinsics"), "CameraPrevisSpec must separate pose and intrinsic tracks");
  fail(errors, cameraPrevisExample?.shotSpecRef?.kind === "cineweave_codex_shot_spec" && cameraPrevisExample?.sceneBindingRef?.kind === "scene_binding" && cameraPrevisExample?.temporalSpecRef?.kind === "cineweave_codex_temporal_spec", "CameraPrevisSpec example must preserve exact directed-shot dependencies");
  fail(errors, cameraPrevisExample?.motion?.components?.includes("translation") === true && !cameraPrevisExample?.motion?.components?.includes("zoom"), "CameraPrevisSpec example must distinguish a dolly from zoom");
  fail(errors, contractKinds.get("cineweave_codex_scene_light_state")?.owner === "cineweave-scene", "SceneLightState must be owned by cineweave-scene");
  fail(errors, contractKinds.get("cineweave_codex_style_light_grammar")?.owner === "cineweave-style", "StyleLightGrammar must be owned by cineweave-style");
  fail(errors, contractKinds.get("cineweave_codex_reference_asset")?.owner === "cineweave-reference", "ReferenceAsset must be owned by cineweave-reference");
  fail(errors, contractKinds.get("cineweave_codex_reference_observation")?.owner === "cineweave-reference", "ReferenceObservation must be owned by cineweave-reference");
  fail(errors, contractKinds.get("cineweave_codex_reference_binding_set")?.owner === "cineweave-reference", "ReferenceBindingSet must be owned by cineweave-reference");
  const reference = await readFile(join(repoRoot, "skills", "cineweave-reference", "SKILL.md"), "utf8");
  const referenceContracts = JSON.parse(await readFile(join(repoRoot, "skills", "cineweave-reference", "contracts.json"), "utf8"));
  fail(errors, reference.includes("content_credentials") && reference.includes("content-credential-inspection.schema.json") && reference.includes("references/content-credentials.md"), "Reference must document the content_credentials route and its reference");
  fail(errors, referenceContracts?.standalone?.produces?.includes("ContentCredentialInspection") === true && referenceContracts?.composed?.produces?.includes("ContentCredentialInspection") === true, "Reference must publish ContentCredentialInspection in standalone and composed outputs");
  fail(errors, referenceContracts?.contractKinds?.includes("cineweave_codex_content_credential_inspection") === true, "Reference portable contracts must include ContentCredentialInspection");
  fail(errors, reference.includes("asset_alias") && reference.includes("asset-alias-registry.schema.json") && reference.includes("@Asset"), "Reference must document the asset_alias route and its boundary");
  fail(errors, referenceContracts?.standalone?.produces?.includes("AssetAliasRegistry") === true && referenceContracts?.composed?.produces?.includes("AssetAliasRegistry") === true, "Reference must publish AssetAliasRegistry in standalone and composed outputs");
  fail(errors, referenceContracts?.contractKinds?.includes("cineweave_codex_asset_alias_registry") === true, "Reference portable contracts must include AssetAliasRegistry");
  const production = await readFile(join(repoRoot, "skills", "cineweave-production", "SKILL.md"), "utf8");
  const productionContracts = JSON.parse(await readFile(join(repoRoot, "skills", "cineweave-production", "contracts.json"), "utf8"));
  fail(errors, production.includes("editorial_timeline") && production.includes("editorial-timeline-plan.schema.json") && production.includes("references/editorial-timeline.md"), "Production must document the editorial_timeline route and its reference");
  fail(errors, productionContracts?.standalone?.produces?.includes("EditorialTimelinePlan") === true && productionContracts?.composed?.produces?.includes("EditorialTimelinePlan") === true, "Production must publish EditorialTimelinePlan in standalone and composed outputs");
  fail(errors, productionContracts?.contractKinds?.includes("cineweave_codex_editorial_timeline_plan") === true, "Production portable contracts must include EditorialTimelinePlan");
  fail(errors, production.includes("color_pipeline") && production.includes("color-pipeline-profile.schema.json") && production.includes("references/color-pipeline.md"), "Production must document the color_pipeline route and its reference");
  fail(errors, productionContracts?.standalone?.produces?.includes("ColorPipelineProfile") === true && productionContracts?.composed?.produces?.includes("ColorPipelineProfile") === true, "Production must publish ColorPipelineProfile in standalone and composed outputs");
  fail(errors, productionContracts?.contractKinds?.includes("cineweave_codex_color_pipeline_profile") === true, "Production portable contracts must include ColorPipelineProfile");
  fail(errors, production.includes("media_technical_probe") && production.includes("media-technical-probe.schema.json") && production.includes("references/media-technical-probe.md"), "Production must document the media_technical_probe route and its reference");
  fail(errors, productionContracts?.standalone?.accepts?.includes("MediaImport") === true && productionContracts?.composed?.consumes?.includes("MediaImport") === true, "Production must accept MediaImport for technical probes in standalone and composed inputs");
  fail(errors, productionContracts?.standalone?.produces?.includes("MediaTechnicalProbe") === true && productionContracts?.composed?.produces?.includes("MediaTechnicalProbe") === true, "Production must publish MediaTechnicalProbe in standalone and composed outputs");
  fail(errors, productionContracts?.contractKinds?.includes("cineweave_codex_media_import") === true && productionContracts?.contractKinds?.includes("cineweave_codex_media_technical_probe") === true, "Production portable contracts must include MediaImport and MediaTechnicalProbe");
  fail(errors, production.includes("content_credential_handoff") && production.includes("content-credential-handoff.schema.json") && production.includes("references/content-credentials.md"), "Production must document the content_credential_handoff route and its reference");
  fail(errors, productionContracts?.standalone?.accepts?.includes("ContentCredentialInspection") === true && productionContracts?.composed?.consumes?.includes("ContentCredentialInspection") === true, "Production must accept ContentCredentialInspection in standalone and composed inputs");
  fail(errors, productionContracts?.standalone?.produces?.includes("ContentCredentialHandoff") === true && productionContracts?.composed?.produces?.includes("ContentCredentialHandoff") === true, "Production must publish ContentCredentialHandoff in standalone and composed outputs");
  fail(errors, productionContracts?.contractKinds?.includes("cineweave_codex_content_credential_inspection") === true && productionContracts?.contractKinds?.includes("cineweave_codex_content_credential_handoff") === true, "Production portable contracts must include the content credential chain");
  fail(errors, production.includes("repair_run") && production.includes("repair-run-receipt.schema.json") && production.includes("references/repair-runner.md"), "Production must document the repair_run route and its reference");
  fail(errors, production.includes("contract-aware repair runner") && production.includes("awaiting_review") && production.includes("不联网"), "Production must document the repair runner boundary and review handoff");
  for (const input of ["DirectorRepair", "CharacterRepair", "SceneRepair", "PromptRepair"]) {
    fail(errors, productionContracts?.standalone?.accepts?.includes(input) === true && productionContracts?.composed?.consumes?.includes(input) === true, "Production must accept " + input + " for repair runs");
  }
  fail(errors, productionContracts?.standalone?.produces?.includes("RepairRunReceipt") === true && productionContracts?.composed?.produces?.includes("RepairRunReceipt") === true, "Production must publish RepairRunReceipt in standalone and composed outputs");
  fail(errors, productionContracts?.contractKinds?.includes("cineweave_codex_repair_run_receipt") === true, "Production portable contracts must include RepairRunReceipt");
  const capabilityResolutionContract = contractKinds.get("cineweave_codex_capability_resolution_plan");
  fail(errors, capabilityResolutionContract?.owner === "cineweave-production", "CapabilityResolutionPlan must be owned by cineweave-production");
  fail(errors, capabilityResolutionContract?.schema === "schemas/capability-resolution-plan.schema.json" && capabilityResolutionContract?.example === "examples/capability-resolution-plan.json", "CapabilityResolutionPlan must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "resolutionPlanId", "version", "status", "request", "candidates", "selection", "explanation", "executionBoundary", "validation", "skillReceipt", "provenance"]) {
    fail(errors, capabilityResolutionSchema?.required?.includes(property), "CapabilityResolutionPlan must require " + property);
  }
  fail(errors, capabilityResolutionSchema?.properties?.contractVersion?.const === "2.5.0", "CapabilityResolutionPlan must publish the 2.5.0 contract revision");
  fail(errors, capabilityResolutionSchema?.$defs?.candidate?.required?.includes("capabilityProfileRef") && capabilityResolutionSchema?.$defs?.candidate?.required?.includes("adapterDescriptorRef"), "CapabilityResolutionPlan candidates must bind exact profile and adapter refs");
  fail(errors, capabilityResolutionSchema?.$defs?.selection?.properties?.humanApprovalRequired?.const === true && capabilityResolutionSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false, "CapabilityResolutionPlan must retain approval and non-execution boundaries");
  fail(errors, capabilityResolutionExample?.status === "selected" && capabilityResolutionExample?.selection?.humanApprovalRequired === true && capabilityResolutionExample?.executionBoundary?.executesAdapter === false, "CapabilityResolutionPlan example must preserve explainable selection without execution");
  fail(errors, existsSync(join(repoRoot, "packages", "cineweave-runtime", "src", "capability-resolution-runtime.mjs")) && existsSync(join(repoRoot, "tests", "runtime", "capability-resolution-runtime.test.mjs")), "Capability resolution runtime and tests must be present");
  fail(errors, production.includes("capability_resolve") && production.includes("capability-resolution-plan.schema.json") && production.includes("references/capability-resolution.md"), "Production must document the capability_resolve route and its reference");
  fail(errors, productionContracts?.standalone?.accepts?.includes("CapabilityProfile") === true && productionContracts?.standalone?.accepts?.includes("AdapterDescriptor") === true && productionContracts?.composed?.consumes?.includes("CapabilityProfile") === true && productionContracts?.composed?.consumes?.includes("AdapterDescriptor") === true, "Production must accept exact capability and adapter candidates");
  fail(errors, productionContracts?.standalone?.produces?.includes("CapabilityResolutionPlan") === true && productionContracts?.composed?.produces?.includes("CapabilityResolutionPlan") === true && productionContracts?.contractKinds?.includes("cineweave_codex_capability_resolution_plan") === true, "Production must publish CapabilityResolutionPlan in both portable modes");
  const executionPreviewContract = contractKinds.get("cineweave_codex_execution_preview");
  fail(errors, executionPreviewContract?.owner === "cineweave-production", "ExecutionPreview must be owned by cineweave-production");
  fail(errors, executionPreviewContract?.schema === "schemas/execution-preview.schema.json" && executionPreviewContract?.example === "examples/execution-preview.json", "ExecutionPreview must publish its schema and canonical example");
  for (const property of ["kind", "contractVersion", "previewId", "version", "status", "executionRequestRef", "capabilityResolutionPlanRef", "adapterDescriptorRef", "capabilityProfileRef", "requestSummary", "requirementsSummary", "costEstimate", "riskSummary", "approval", "executionBoundary", "validation", "skillReceipt", "provenance"]) {
    fail(errors, executionPreviewSchema?.required?.includes(property), "ExecutionPreview must require " + property);
  }
  fail(errors, executionPreviewSchema?.properties?.contractVersion?.const === "2.5.0", "ExecutionPreview must publish the 2.5.0 contract revision");
  fail(errors, executionPreviewSchema?.$defs?.costEstimate?.properties?.unknownCostAction?.const === "block" && executionPreviewSchema?.$defs?.approval?.properties?.status?.const === "pending", "ExecutionPreview must block unknown cost and keep approval pending");
  fail(errors, executionPreviewSchema?.$defs?.executionBoundary?.properties?.executesAdapter?.const === false && executionPreviewSchema?.$defs?.validation?.properties?.noExecution?.const === true, "ExecutionPreview must remain non-executing");
  fail(errors, executionPreviewExample?.status === "needs_review" && executionPreviewExample?.approval?.status === "pending" && executionPreviewExample?.executionBoundary?.writesFiles === false, "ExecutionPreview example must preserve pending approval and read-only boundary");
  fail(errors, existsSync(join(repoRoot, "packages", "cineweave-runtime", "src", "execution-preview-runtime.mjs")) && existsSync(join(repoRoot, "tests", "runtime", "capability-resolution-runtime.test.mjs")), "Execution preview runtime and tests must be present");
  fail(errors, production.includes("execution_preview") && production.includes("execution-preview.schema.json") && production.includes("references/execution-preview.md"), "Production must document the execution_preview route and its reference");
  fail(errors, productionContracts?.standalone?.accepts?.includes("ExecutionRequest") === true && productionContracts?.standalone?.accepts?.includes("CapabilityResolutionPlan") === true && productionContracts?.composed?.consumes?.includes("ExecutionRequest") === true && productionContracts?.composed?.consumes?.includes("CapabilityResolutionPlan") === true, "Production must accept exact execution and capability plans for previews");
  fail(errors, productionContracts?.standalone?.produces?.includes("ExecutionPreview") === true && productionContracts?.composed?.produces?.includes("ExecutionPreview") === true && productionContracts?.contractKinds?.includes("cineweave_codex_execution_preview") === true, "Production must publish ExecutionPreview in both portable modes");
  fail(errors, manifest.runtime?.contractAwareRepairRunner === true && manifest.runtime?.repairRunnerBoundary === "local_non_writing_provider_neutral", "Manifest must declare the contract-aware repair runner boundary");
  fail(errors, manifest.runtime?.scopedAssetAliasRegistry === true && manifest.runtime?.exactAssetAliasResolution === true, "Manifest must declare scoped exact AssetAlias resolution");
  fail(errors, manifest.runtime?.atomicCinematicSkills === true && manifest.runtime?.shotCompilerPlans === true && manifest.runtime?.creatorControlSurfaceProjection === true, "Manifest must declare Atomic Cinematic Skills and projection-only Shot Compiler plans");
  fail(errors, manifest.runtime?.explainableCapabilityResolution === true && manifest.runtime?.executionPreviews === true, "Manifest must declare explainable capability resolution and execution previews");
  fail(errors, manifest.boundaries?.assetAliasesDoNotInferOrMutate === true, "Manifest must forbid AssetAlias inference and mutation");
  fail(errors, manifest.boundaries?.creatorControlsAreProjectionOnly === true && manifest.boundaries?.shotCompilerDoesNotExecute === true, "Manifest must keep creator controls projection-only and the compiler non-executing");
  fail(errors, manifest.boundaries?.capabilityResolverDoesNotExecute === true && manifest.boundaries?.executionPreviewDoesNotApprove === true, "Manifest must keep capability resolution non-executing and previews non-approving");
  const director = await readFile(join(repoRoot, "skills", "cineweave-director", "SKILL.md"), "utf8");
  const directorContracts = JSON.parse(await readFile(join(repoRoot, "skills", "cineweave-director", "contracts.json"), "utf8"));
  fail(errors, !director.includes("`brief_compile`"), "Director must not own brief_compile in V2");
  fail(errors, director.includes("`primaryDelta`") && director.includes("`capabilityRequirements`") && director.includes("`humanSelection`"), "Director proposal route must require distinct capability-oriented alternatives and a human selection");
  fail(errors, director.includes("Do not select a Provider") && director.includes("proposal-output.schema.json"), "Director proposal route must keep Provider choice out of its contract");
  fail(errors, director.includes("`renderPlanId`") && director.includes("`promptRef`") && director.includes("exact contractRef"), "Director render plan route must require versioned exact source bindings");
  fail(errors, director.includes("`camera_previs`") && director.includes("camera-previs-spec.schema.json"), "Director camera previs route must return CameraPrevisSpec");
  fail(errors, director.includes("`cinematic_skill`") && director.includes("cinematic-skill-manifest.schema.json") && director.includes("references/cinematic-skill-manifest.md"), "Director must document the cinematic_skill route and its reference");
  fail(errors, director.includes("`shot_compile`") && director.includes("shot-compiler-plan.schema.json") && director.includes("references/shot-compiler.md"), "Director must document the shot_compile route and its reference");
  fail(errors, director.includes("director-repair.schema.json") && director.includes("references/director-repair.md"), "Director repair route must return DirectorRepair");
  fail(errors, directorContracts?.standalone?.produces?.includes("CameraPrevisSpec") === true && directorContracts?.composed?.produces?.includes("CameraPrevisSpec") === true, "Director must publish CameraPrevisSpec in standalone and composed outputs");
  fail(errors, directorContracts?.standalone?.produces?.includes("DirectorRepair") === true && directorContracts?.composed?.produces?.includes("DirectorRepair") === true, "Director must publish DirectorRepair in standalone and composed outputs");
  fail(errors, directorContracts?.composed?.consumes?.includes("BoardAssemblyPlan") === true, "Director must declare BoardAssemblyPlan as a composed input for production-bound Storyboards");
  fail(errors, directorContracts?.composed?.consumes?.includes("ControlBenchmarkReview") === true, "Director must declare ControlBenchmarkReview as a repair input");
  fail(errors, directorContracts?.contractKinds?.includes("cineweave_codex_board_assembly_plan") === true, "Director portable contracts must include BoardAssemblyPlan");
  fail(errors, directorContracts?.contractKinds?.includes("cineweave_codex_director_repair") === true, "Director portable contracts must include DirectorRepair");
  fail(errors, directorContracts?.contractKinds?.includes("cineweave_codex_camera_previs_spec") === true, "Director portable contracts must include CameraPrevisSpec");
  fail(errors, directorContracts?.contractKinds?.includes("cineweave_codex_control_benchmark_review") === true, "Director portable contracts must include ControlBenchmarkReview");
  fail(errors, directorContracts?.standalone?.produces?.includes("CinematicSkillManifest") === true && directorContracts?.composed?.produces?.includes("CinematicSkillManifest") === true, "Director must publish CinematicSkillManifest in standalone and composed outputs");
  fail(errors, directorContracts?.standalone?.produces?.includes("ShotCompilerPlan") === true && directorContracts?.composed?.produces?.includes("ShotCompilerPlan") === true, "Director must publish ShotCompilerPlan in standalone and composed outputs");
  fail(errors, directorContracts?.composed?.consumes?.includes("CinematicSkillManifest") === true && directorContracts?.composed?.consumes?.includes("AssetAliasRegistry") === true, "Director must consume exact manifest and alias registry inputs for shot compilation");
  fail(errors, directorContracts?.contractKinds?.includes("cineweave_codex_cinematic_skill_manifest") === true && directorContracts?.contractKinds?.includes("cineweave_codex_shot_compiler_plan") === true, "Director portable contracts must include Atomic Skill and Shot Compiler contracts");

  if (errors.length) { console.error(errors.map((error) => `- ${error}`).join("\n")); process.exitCode = 1; return; }
  console.log(`CineWeave Studio v2.5.1 architecture passes: ${skillNames.length} Skills, ${contractKinds.size} contracts and ${routes.length} owned routes.`);
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
