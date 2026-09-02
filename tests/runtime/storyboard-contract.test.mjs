import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const storyboardSchemaPath = join(contractRoot, "schemas", "storyboard-output.schema.json");
const storyboard = JSON.parse(await readFile(join(contractRoot, "examples", "storyboard-action-sequence.json"), "utf8"));
const actionSequenceSpec = JSON.parse(await readFile(join(contractRoot, "examples", "action-sequence-spec.json"), "utf8"));
const shotSpec = JSON.parse(await readFile(join(contractRoot, "examples", "shot-spec-action.json"), "utf8"));
const boardAssemblyPlan = JSON.parse(await readFile(join(contractRoot, "examples", "board-assembly-plan-storyboard-rain-teahouse.json"), "utf8"));
const context = { actionSequenceSpec, shotSpecs: [shotSpec], boardAssemblyPlan };

test("Storyboard action example is schema-valid and semantically closed", async () => {
  const schemaResult = await validatePayload(storyboardSchemaPath, storyboard);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(storyboard, context), []);
});

test("Storyboard action scope requires an action beat selection", async () => {
  const invalid = structuredClone(storyboard);
  delete invalid.actionBeatIds;
  const result = await validatePayload(storyboardSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /actionBeatIds is required when actionSequenceRef is present/);
});

test("Storyboard semantic validation rejects a stale ShotSpec hash", () => {
  const invalid = structuredClone(storyboard);
  invalid.shots[0].shotSpecRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  assert.match(validateByKind(invalid, context).join("\n"), /ShotSpec ref must use the supplied canonical hash/);
});

test("Storyboard semantic validation rejects a panel outside its BoardAssemblyPlan", () => {
  const invalid = structuredClone(storyboard);
  invalid.productionBindings.panels[0].tileId = "tile.unknown";
  assert.match(validateByKind(invalid, context).join("\n"), /does not match a BoardAssemblyPlan tile/);
});
