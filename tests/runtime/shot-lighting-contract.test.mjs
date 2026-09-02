import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const shotLightingPlan = JSON.parse(await readFile(join(contractRoot, "examples", "shot-lighting-plan.json"), "utf8"));
const sceneLightState = JSON.parse(await readFile(join(contractRoot, "examples", "scene-light-state.json"), "utf8"));
const shotSpec = JSON.parse(await readFile(join(contractRoot, "examples", "shot-spec.json"), "utf8"));
const shotLightingSchemaPath = join(contractRoot, "schemas", "shot-lighting-plan.schema.json");
const semanticContext = { sceneLightState, shotSpec };

test("ShotLightingPlan 2.5 preserves direct and bounced light transport", async () => {
  assert.equal(shotLightingPlan.contractVersion, "2.5.0");
  assert.equal(shotLightingPlan.key.transport, "direct");
  assert.equal(shotLightingPlan.fill.transport, "bounce");
  assert.equal(typeof shotLightingPlan.fill.viaSurfaceAnchor, "string");
  const result = await validatePayload(shotLightingSchemaPath, shotLightingPlan);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(shotLightingPlan, semanticContext), []);
});

test("ShotLightingPlan 2.5 permits an intentional no-fill decision", async () => {
  const noFill = structuredClone(shotLightingPlan);
  noFill.fill = null;
  noFill.validation.fillIntentional = true;
  const result = await validatePayload(shotLightingSchemaPath, noFill);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(noFill, semanticContext), []);
});

test("ShotLightingPlan 2.5 rejects bounced light without its physical surface", async () => {
  const invalid = structuredClone(shotLightingPlan);
  delete invalid.fill.viaSurfaceAnchor;
  const result = await validatePayload(shotLightingSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /(viaSurfaceAnchor|anyOf)/);
});

test("ShotLightingPlan 2.5 semantic validation rejects a direct light with a false bounce surface", () => {
  const invalid = structuredClone(shotLightingPlan);
  invalid.key.viaSurfaceAnchor = "invented white card";
  assert.match(
    validateByKind(invalid, semanticContext).join("\n"),
    /direct light must not invent a bounce surface/,
  );
});

test("ShotLightingPlan retains a schema-valid 2.2 shape for compatibility", async () => {
  const legacy = structuredClone(shotLightingPlan);
  legacy.contractVersion = "2.2.0";
  for (const use of [legacy.key, legacy.fill, legacy.rim, ...legacy.practicals].filter(Boolean)) {
    delete use.transport;
    delete use.viaSurfaceAnchor;
  }
  delete legacy.validation.fillIntentional;
  const result = await validatePayload(shotLightingSchemaPath, legacy);
  assert.equal(result.valid, true);
});
