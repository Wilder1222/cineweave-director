import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";
import { sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "contracts", "manifest.json"), "utf8"));
const directorRepair = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "director-repair.json"), "utf8"));
const shotSpec = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "shot-spec.json"), "utf8"));
const cameraPrevisSpec = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "camera-previs-spec.json"), "utf8"));
const renderPlan = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "render-plan.json"), "utf8"));
const directorRepairSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "director-repair.schema.json");

test("Director publishes an importable DirectorRepair contract for its repair route", () => {
  const contract = manifest.contracts.find((item) => item.kind === "cineweave_codex_director_repair");
  assert.ok(contract, "Director repair route must publish a contract kind");
  assert.equal(contract.owner, "cineweave-director");
  assert.equal(contract.schema, "schemas/director-repair.schema.json");
  assert.equal(contract.example, "examples/director-repair.json");
});

test("DirectorRepair rejects a camera repair targeting TemporalSpec", () => {
  const invalid = structuredClone(directorRepair);
  invalid.targetRef = {
    kind: "cineweave_codex_temporal_spec",
    id: "temporal.rain-courtyard-v1",
    version: 1,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  };
  assert.match(validateByKind(invalid).join("\n"), /camera repair must target ShotSpec or Storyboard/);
});

test("DirectorRepair delegation must name the cross-domain failure owner", () => {
  const invalid = structuredClone(directorRepair);
  invalid.disposition = "delegate";
  invalid.observedFailure.owningDomain = "character";
  invalid.observedFailure.variable = "identity";
  delete invalid.targetRef;
  delete invalid.change;
  invalid.delegation = {
    owner: "scene",
    reason: "The candidate changed a Character-owned identity anchor.",
    requiredInputKinds: ["cineweave_codex_character_binding"]
  };
  assert.match(validateByKind(invalid).join("\n"), /delegation must name the observed failure owner/);
});

test("DirectorRepair rejects a stale exact target reference", () => {
  const invalid = structuredClone(directorRepair);
  invalid.targetRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  assert.match(
    validateByKind(invalid, { directorTargets: [shotSpec] }).join("\n"),
    /targetRef must match the supplied exact target artifact/,
  );
});

test("DirectorRepair camera change stays inside a camera path", () => {
  const invalid = structuredClone(directorRepair);
  invalid.change.targetPath = "purpose";
  assert.match(validateByKind(invalid).join("\n"), /camera repair must change a camera path/);
});

test("DirectorRepair permits a single exact CameraPrevisSpec pose correction", async () => {
  const repair = structuredClone(directorRepair);
  repair.repairId = "repair.director.camera-previs-pose-v1";
  repair.targetRef = {
    kind: "cineweave_codex_camera_previs_spec",
    id: cameraPrevisSpec.cameraPrevisSpecId,
    version: cameraPrevisSpec.version,
    contentHash: sha256Canonical(cameraPrevisSpec)
  };
  repair.change = {
    variable: "camera",
    targetPath: "tracks.pose[2].positionMeters.z",
    currentState: "The dolly settles one frame too early.",
    targetState: "Preserve every other keyframe and settle at the approved final frame.",
    rationale: "Only the numeric camera pose timing changes; ShotSpec, SceneBinding and TemporalSpec remain immutable."
  };
  const schemaResult = await validatePayload(directorRepairSchemaPath, repair);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(repair, { directorTargets: [cameraPrevisSpec] }), []);
});

test("DirectorRepair resolves legacy RenderPlan through its immutable artifact reference", () => {
  const renderPlanRef = {
    kind: "cineweave_codex_render_plan",
    id: "render.production.fixture",
    version: 1,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  };
  const repair = structuredClone(directorRepair);
  repair.repairId = "repair.director.render-intent-v1";
  repair.observedFailure.variable = "render_intent";
  repair.observedFailure.description = "The approved task needs a single quality-budget adjustment before it is resubmitted.";
  repair.targetRef = renderPlanRef;
  repair.change = {
    variable: "render_intent",
    targetPath: "qualityBudget",
    currentState: "explore",
    targetState: "final after human approval",
    rationale: "Only the provider-neutral render intent changes; prompt, controls, rights and source artifacts remain immutable."
  };
  const targetArtifact = { envelope: { artifactRef: renderPlanRef, payload: renderPlan } };
  assert.deepEqual(validateByKind(repair, { directorTargets: [targetArtifact] }), []);
});

test("DirectorRepair render intent cannot rewrite the prompt binding", () => {
  const invalid = structuredClone(directorRepair);
  invalid.change.variable = "render_intent";
  invalid.observedFailure.variable = "render_intent";
  invalid.targetRef = {
    kind: "cineweave_codex_render_plan",
    id: "render.production.fixture",
    version: 1,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  };
  invalid.change.targetPath = "promptPayloadRef";
  assert.match(validateByKind(invalid).join("\n"), /render intent repair must change a render intent path/);
});

test("DirectorRepair direct example is exact and semantically closed", async () => {
  const result = await validatePayload(directorRepairSchemaPath, directorRepair);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(directorRepair, { directorTargets: [shotSpec] }), []);
});

test("DirectorRepair delegation schema forbids a direct target change", async () => {
  const invalid = structuredClone(directorRepair);
  invalid.disposition = "delegate";
  invalid.observedFailure.owningDomain = "character";
  invalid.observedFailure.variable = "identity";
  invalid.delegation = {
    owner: "character",
    reason: "Identity anchors remain Character-owned.",
    requiredInputKinds: ["character_binding"]
  };
  const result = await validatePayload(directorRepairSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must not match the forbidden schema/);
});
