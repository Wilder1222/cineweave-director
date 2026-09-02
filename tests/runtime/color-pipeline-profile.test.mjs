import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const schemaPath = join(contractRoot, "schemas", "color-pipeline-profile.schema.json");
const profile = JSON.parse(await readFile(join(contractRoot, "examples", "color-pipeline-profile.json"), "utf8"));

test("ColorPipelineProfile is Production-owned, OCIO-model-aligned and deliberately non-executing", async () => {
  assert.equal(profile.kind, "cineweave_codex_color_pipeline_profile");
  assert.equal(profile.contractVersion, "2.5.0");
  assert.equal(profile.profileStatus, "planned");
  assert.equal(profile.ocioConfig.referenceSpaceModel, "ocio-scene-and-display-reference");
  assert.equal(profile.ocioConfig.loadStatus, "not_loaded");
  assert.equal(profile.referenceSpacePolicy.sceneReferenceSpace, "scene_referred");
  assert.equal(profile.referenceSpacePolicy.displayReferenceSpace, "display_referred");
  assert.equal(profile.referenceSpacePolicy.workingRole, "scene_linear");
  assert.ok(profile.outputTargets.some((target) => target.purpose === "preview"));
  assert.ok(profile.outputTargets.some((target) => target.purpose === "delivery"));
  assert.equal(profile.creativeLookPolicy.appliesCreativeLook, false);
  assert.equal(profile.executionBoundary.loadsOcioConfig, false);
  assert.equal(profile.executionBoundary.appliesColorTransforms, false);
  assert.equal((await validatePayload(schemaPath, profile)).valid, true);
  assert.deepEqual(validateByKind(profile), []);
});

test("ColorPipelineProfile rejects dishonest source metadata, invalid OCIO view paths and execution claims", () => {
  const dishonestMetadata = structuredClone(profile);
  dishonestMetadata.sourceMedia[0].metadata.status = "unknown";
  assert.match(validateByKind(dishonestMetadata).join("\n"), /unknown metadata must keep every signal field unknown/);

  const incompleteViewPath = structuredClone(profile);
  delete incompleteViewPath.outputTargets[0].path.displayColorSpace;
  assert.match(validateByKind(incompleteViewPath).join("\n"), /view_transform path requires both viewTransform and displayColorSpace/);

  const executionClaim = structuredClone(profile);
  executionClaim.executionBoundary.appliesColorTransforms = true;
  assert.match(validateByKind(executionClaim).join("\n"), /must not load an OCIO config, apply transforms, write media or export LUTs/);
});
