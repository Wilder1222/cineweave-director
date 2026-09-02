import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const inspectionSchemaPath = join(contractRoot, "schemas", "content-credential-inspection.schema.json");
const handoffSchemaPath = join(contractRoot, "schemas", "content-credential-handoff.schema.json");
const inspection = JSON.parse(await readFile(join(contractRoot, "examples", "content-credential-inspection.json"), "utf8"));
const handoff = JSON.parse(await readFile(join(contractRoot, "examples", "content-credential-handoff.json"), "utf8"));

test("ContentCredentialInspection and ContentCredentialHandoff preserve C2PA boundaries without inventing a validator result", async () => {
  assert.equal(inspection.kind, "cineweave_codex_content_credential_inspection");
  assert.equal(inspection.inspectionStatus, "planned");
  assert.equal(inspection.validator.executionState, "not_invoked");
  assert.equal(inspection.manifestStore.inspectionState, "not_inspected");
  assert.equal(inspection.result.validationState, "not_checked");
  assert.equal(inspection.result.rightsConclusion, "not_determined");
  assert.equal(inspection.result.truthConclusion, "not_determined");
  assert.equal(handoff.kind, "cineweave_codex_content_credential_handoff");
  assert.equal(handoff.handoffStatus, "planned");
  assert.deepEqual(handoff.referenceAssetRef, inspection.referenceAssetRef);
  assert.equal(handoff.provenancePlan.manifestAction, "not_performed");
  assert.equal(handoff.executionBoundary.writesManifest, false);
  assert.equal((await validatePayload(inspectionSchemaPath, inspection)).valid, true);
  assert.equal((await validatePayload(handoffSchemaPath, handoff)).valid, true);
  assert.deepEqual(validateByKind(inspection), []);
  assert.deepEqual(validateByKind(handoff), []);
});

test("Content-credential chain rejects fabricated validation, truth or rights conclusions and manifest writes", () => {
  const fabricatedResult = structuredClone(inspection);
  fabricatedResult.result.validationState = "trusted";
  assert.match(validateByKind(fabricatedResult).join("\n"), /planned inspection cannot claim a manifest validation result/);

  const fabricatedTruth = structuredClone(inspection);
  fabricatedTruth.result.truthConclusion = "true";
  assert.match(validateByKind(fabricatedTruth).join("\n"), /must not make truth or rights conclusions/);

  const manifestWrite = structuredClone(handoff);
  manifestWrite.provenancePlan.manifestAction = "written";
  assert.match(validateByKind(manifestWrite).join("\n"), /must not claim a manifest was embedded or written/);
});
