import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const behavior = JSON.parse(await readFile(join(repoRoot, "tests", "behavior", "cases.json"), "utf8"));
const liveBehavior = JSON.parse(await readFile(join(repoRoot, "tests", "behavior", "live-cases.json"), "utf8"));
const manifest = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "contracts", "manifest.json"), "utf8"));
const routeOwners = new Map(manifest.skills.flatMap((skill) => (skill.owns || []).map((route) => [route, skill.name])));

const requiredNeighborCases = [
  ["director.negative.character-identity", "cineweave-character", "character_morphology", "cineweave_codex_character_morphology_spec"],
  ["director.negative.scene-physical-light", "cineweave-scene", "scene_light_state", "cineweave_codex_scene_light_state"],
  ["director.negative.style-light-treatment", "cineweave-style", "style_light_grammar", "cineweave_codex_style_light_grammar"],
  ["director.negative.reference-ingest", "cineweave-reference", "reference_ingest", "cineweave_codex_reference_asset"],
  ["director.negative.general-prompt-library", "cineweave-prompt", "prompt_import", "cineweave_codex_prompt_record"],
  ["director.negative.provider-execution", "cineweave-production", "execution_request", "cineweave_execution_request"]
];

const requiredLiveNeighborCases = [
  ["live.character.semantic-morphology", "cineweave-character", "character_morphology"],
  ["live.scene.physical-space", "cineweave-scene", "scene_design"],
  ["live.style.representation-binding", "cineweave-style", "representation_binding"],
  ["live.reference.atomic-style-role", "cineweave-reference", "reference_observe"],
  ["live.prompt.observable-product", "cineweave-prompt", "prompt_design"],
  ["live.production.external-gate", "cineweave-production", "execution_request"]
];

test("Director has one explicit negative owner-boundary replay definition for every adjacent specialist", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const coveredSkills = [];
  for (const [caseId, expectedSkill, expectedRoute, expectedKind] of requiredNeighborCases) {
    const item = cases.get(caseId);
    assert.ok(item, "missing " + caseId);
    assert.equal(item.category, "negative", caseId + " must be a negative case");
    assert.equal(item.targetSkill, "cineweave-director", caseId + " must start at Director");
    assert.equal(item.expectedSkill, expectedSkill, caseId + " must route to its owning specialist");
    assert.equal(item.expectedRoute, expectedRoute, caseId + " must route to the expected specialist route");
    assert.equal(routeOwners.get(item.expectedRoute), expectedSkill, caseId + " route owner drifted");
    assert.ok(item.mustNotActivate.includes("cineweave-director"), caseId + " must not activate Director");
    assert.ok(item.mustProduce.includes(expectedKind), caseId + " must require the specialist contract");
    coveredSkills.push(item.expectedSkill);
  }
  assert.deepEqual(new Set(coveredSkills), new Set([
    "cineweave-character",
    "cineweave-scene",
    "cineweave-style",
    "cineweave-reference",
    "cineweave-prompt",
    "cineweave-production"
  ]));
});

test("Director remains excluded from live replays that belong to every adjacent specialist", () => {
  const cases = new Map(liveBehavior.cases.map((item) => [item.id, item]));
  const coveredSkills = [];
  for (const [caseId, expectedSkill, expectedRoute] of requiredLiveNeighborCases) {
    const item = cases.get(caseId);
    assert.ok(item, "missing " + caseId);
    assert.equal(item.expectedSkill, expectedSkill, caseId + " must select its owning specialist");
    assert.equal(item.expectedRoute, expectedRoute, caseId + " must select the expected specialist route");
    assert.equal(routeOwners.get(item.expectedRoute), expectedSkill, caseId + " route owner drifted");
    assert.ok(item.mustNotActivate.includes("cineweave-director"), caseId + " must exclude Director");
    coveredSkills.push(item.expectedSkill);
  }
  assert.deepEqual(new Set(coveredSkills), new Set([
    "cineweave-character",
    "cineweave-scene",
    "cineweave-style",
    "cineweave-reference",
    "cineweave-prompt",
    "cineweave-production"
  ]));
});

test("Director delegates editable editorial timeline representation to Production", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const item = cases.get("director.negative.editorial-timeline");
  assert.ok(item, "missing director.negative.editorial-timeline");
  assert.equal(item.category, "negative");
  assert.equal(item.targetSkill, "cineweave-director");
  assert.equal(item.expectedSkill, "cineweave-production");
  assert.equal(item.expectedRoute, "editorial_timeline");
  assert.equal(routeOwners.get(item.expectedRoute), "cineweave-production");
  assert.ok(item.mustNotActivate.includes("cineweave-director"));
  assert.ok(item.mustProduce.includes("cineweave_codex_editorial_timeline_plan"));
  assert.ok(item.mustNotProduce.includes("cineweave_codex_shot_spec"));

  const liveCases = new Map(liveBehavior.cases.map((candidate) => [candidate.id, candidate]));
  const liveItem = liveCases.get("live.production.editorial-timeline");
  assert.ok(liveItem, "missing live.production.editorial-timeline");
  assert.equal(liveItem.expectedSkill, "cineweave-production");
  assert.equal(liveItem.expectedRoute, "editorial_timeline");
  assert.equal(routeOwners.get(liveItem.expectedRoute), "cineweave-production");
  assert.ok(liveItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveItem.mustProduceAny.includes("cineweave_codex_editorial_timeline_plan"));
});

test("Director delegates technical color management to Production", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const item = cases.get("director.negative.color-pipeline");
  assert.ok(item, "missing director.negative.color-pipeline");
  assert.equal(item.category, "negative");
  assert.equal(item.targetSkill, "cineweave-director");
  assert.equal(item.expectedSkill, "cineweave-production");
  assert.equal(item.expectedRoute, "color_pipeline");
  assert.equal(routeOwners.get(item.expectedRoute), "cineweave-production");
  assert.ok(item.mustNotActivate.includes("cineweave-director"));
  assert.ok(item.mustProduce.includes("cineweave_codex_color_pipeline_profile"));
  assert.ok(item.mustNotProduce.includes("cineweave_codex_shot_spec"));

  const liveCases = new Map(liveBehavior.cases.map((candidate) => [candidate.id, candidate]));
  const liveItem = liveCases.get("live.production.color-pipeline");
  assert.ok(liveItem, "missing live.production.color-pipeline");
  assert.equal(liveItem.expectedSkill, "cineweave-production");
  assert.equal(liveItem.expectedRoute, "color_pipeline");
  assert.equal(routeOwners.get(liveItem.expectedRoute), "cineweave-production");
  assert.ok(liveItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveItem.mustProduceAny.includes("cineweave_codex_color_pipeline_profile"));
});

test("Director delegates local media technical probing to Production", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const item = cases.get("director.negative.media-technical-probe");
  assert.ok(item, "missing director.negative.media-technical-probe");
  assert.equal(item.category, "negative");
  assert.equal(item.targetSkill, "cineweave-director");
  assert.equal(item.expectedSkill, "cineweave-production");
  assert.equal(item.expectedRoute, "media_technical_probe");
  assert.equal(routeOwners.get(item.expectedRoute), "cineweave-production");
  assert.ok(item.mustNotActivate.includes("cineweave-director"));
  assert.ok(item.mustProduce.includes("cineweave_codex_media_technical_probe"));
  assert.ok(item.mustNotProduce.includes("cineweave_codex_shot_spec"));

  const liveCases = new Map(liveBehavior.cases.map((candidate) => [candidate.id, candidate]));
  const liveItem = liveCases.get("live.production.media-technical-probe");
  assert.ok(liveItem, "missing live.production.media-technical-probe");
  assert.equal(liveItem.expectedSkill, "cineweave-production");
  assert.equal(liveItem.expectedRoute, "media_technical_probe");
  assert.equal(routeOwners.get(liveItem.expectedRoute), "cineweave-production");
  assert.ok(liveItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveItem.mustProduceAny.includes("cineweave_codex_media_technical_probe"));
});

test("Production owns the guarded repair-run handoff and keeps Director out of execution", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const item = cases.get("production.direct.repair-run");
  assert.ok(item, "missing production.direct.repair-run");
  assert.equal(item.expectedSkill, "cineweave-production");
  assert.equal(item.expectedRoute, "repair_run");
  assert.equal(routeOwners.get(item.expectedRoute), "cineweave-production");
  assert.ok(item.mustNotActivate.includes("cineweave-director"));
  assert.ok(item.mustProduce.includes("cineweave_codex_repair_run_receipt"));
  assert.ok(item.mustNotProduce.includes("cineweave_execution_request"));

  const liveCases = new Map(liveBehavior.cases.map((candidate) => [candidate.id, candidate]));
  const liveItem = liveCases.get("live.production.repair-run");
  assert.ok(liveItem, "missing live.production.repair-run");
  assert.equal(liveItem.expectedSkill, "cineweave-production");
  assert.equal(liveItem.expectedRoute, "repair_run");
  assert.equal(routeOwners.get(liveItem.expectedRoute), "cineweave-production");
  assert.ok(liveItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveItem.mustProduceAny.includes("cineweave_codex_repair_run_receipt"));
});

test("Director delegates C2PA inspection to Reference and provenance handoff to Production", () => {
  const cases = new Map(behavior.cases.map((item) => [item.id, item]));
  const inspectionItem = cases.get("director.negative.content-credentials");
  assert.ok(inspectionItem, "missing director.negative.content-credentials");
  assert.equal(inspectionItem.category, "negative");
  assert.equal(inspectionItem.targetSkill, "cineweave-director");
  assert.equal(inspectionItem.expectedSkill, "cineweave-reference");
  assert.equal(inspectionItem.expectedRoute, "content_credentials");
  assert.equal(routeOwners.get(inspectionItem.expectedRoute), "cineweave-reference");
  assert.ok(inspectionItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(inspectionItem.mustProduce.includes("cineweave_codex_content_credential_inspection"));
  assert.ok(inspectionItem.mustNotProduce.includes("cineweave_codex_shot_spec"));

  const handoffItem = cases.get("production.direct.content-credential-handoff");
  assert.ok(handoffItem, "missing production.direct.content-credential-handoff");
  assert.equal(handoffItem.expectedSkill, "cineweave-production");
  assert.equal(handoffItem.expectedRoute, "content_credential_handoff");
  assert.equal(routeOwners.get(handoffItem.expectedRoute), "cineweave-production");
  assert.ok(handoffItem.mustNotActivate.includes("cineweave-director"));
  assert.ok(handoffItem.mustProduce.includes("cineweave_codex_content_credential_handoff"));

  const liveCases = new Map(liveBehavior.cases.map((candidate) => [candidate.id, candidate]));
  const liveInspection = liveCases.get("live.reference.content-credentials");
  assert.ok(liveInspection, "missing live.reference.content-credentials");
  assert.equal(liveInspection.expectedSkill, "cineweave-reference");
  assert.equal(liveInspection.expectedRoute, "content_credentials");
  assert.equal(routeOwners.get(liveInspection.expectedRoute), "cineweave-reference");
  assert.ok(liveInspection.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveInspection.mustProduceAny.includes("cineweave_codex_content_credential_inspection"));

  const liveHandoff = liveCases.get("live.production.content-credential-handoff");
  assert.ok(liveHandoff, "missing live.production.content-credential-handoff");
  assert.equal(liveHandoff.expectedSkill, "cineweave-production");
  assert.equal(liveHandoff.expectedRoute, "content_credential_handoff");
  assert.equal(routeOwners.get(liveHandoff.expectedRoute), "cineweave-production");
  assert.ok(liveHandoff.mustNotActivate.includes("cineweave-director"));
  assert.ok(liveHandoff.mustProduceAny.includes("cineweave_codex_content_credential_handoff"));
});
