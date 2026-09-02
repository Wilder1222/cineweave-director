import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const cameraPrevisSchemaPath = join(contractRoot, "schemas", "camera-previs-spec.schema.json");
const cameraPrevisSpec = JSON.parse(await readFile(join(contractRoot, "examples", "camera-previs-spec.json"), "utf8"));
const shotSpec = JSON.parse(await readFile(join(contractRoot, "examples", "shot-spec.json"), "utf8"));
const temporalSpec = JSON.parse(await readFile(join(contractRoot, "examples", "temporal-spec.json"), "utf8"));
const semanticContext = { shotSpec, temporalSpec };

test("CameraPrevisSpec 2.5 is an exact, provider-neutral downstream camera plan", async () => {
  assert.equal(cameraPrevisSpec.contractVersion, "2.5.0");
  assert.equal(cameraPrevisSpec.shotSpecRef.kind, "cineweave_codex_shot_spec");
  assert.equal(cameraPrevisSpec.sceneBindingRef.kind, "scene_binding");
  assert.equal(cameraPrevisSpec.temporalSpecRef.kind, "cineweave_codex_temporal_spec");
  assert.deepEqual(cameraPrevisSpec.motion.components, ["translation", "focus_pull"]);
  const result = await validatePayload(cameraPrevisSchemaPath, cameraPrevisSpec);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(cameraPrevisSpec, semanticContext), []);
});

test("CameraPrevisSpec rejects an unnormalized pose quaternion", () => {
  const invalid = structuredClone(cameraPrevisSpec);
  invalid.tracks.pose[1].orientationQuaternion.w = 1.5;
  assert.match(validateByKind(invalid, semanticContext).join("\n"), /unit quaternion/);
});

test("CameraPrevisSpec requires strictly ordered pose and intrinsic tracks", () => {
  const invalid = structuredClone(cameraPrevisSpec);
  invalid.tracks.pose[1].frame = invalid.tracks.pose[0].frame;
  invalid.tracks.intrinsics[1].frame = invalid.tracks.intrinsics[0].frame;
  const errors = validateByKind(invalid, semanticContext).join("\n");
  assert.match(errors, /pose frames must be strictly ordered/);
  assert.match(errors, /intrinsics frames must be strictly ordered/);
});

test("CameraPrevisSpec never labels a fixed-lens move as zoom", () => {
  const invalid = structuredClone(cameraPrevisSpec);
  invalid.motion.primaryBehavior = "zoom";
  invalid.motion.components = ["zoom"];
  assert.match(validateByKind(invalid, semanticContext).join("\n"), /zoom requires a focal-length change/);
});

test("CameraPrevisSpec declares an iris change instead of hiding it in intrinsics", () => {
  const invalid = structuredClone(cameraPrevisSpec);
  invalid.tracks.intrinsics[1].fStop = 2.8;
  assert.match(validateByKind(invalid, semanticContext).join("\n"), /changed iris data without declaring that motion component/);
});

test("CameraPrevisSpec keeps scene and temporal dependencies exact", () => {
  const invalid = structuredClone(cameraPrevisSpec);
  invalid.sceneBindingRef.id = "binding.scene-wrong";
  invalid.temporalSpecRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const errors = validateByKind(invalid, semanticContext).join("\n");
  assert.match(errors, /sceneBindingRef must exactly match the ShotSpec scene binding/);
  assert.match(errors, /must bind the supplied TemporalSpec content hash/);
});
