import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const proposal = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "proposal-output.json"), "utf8"));
const proposalSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "proposal-output.schema.json");

test("DirectorProposals 2.5 is versioned, provider-neutral and selection-gated", async () => {
  assert.equal(proposal.contractVersion, "2.5.0");
  assert.match(proposal.proposalSetId, /^proposal-set\./);
  assert.equal(proposal.version, 1);
  assert.ok(Array.isArray(proposal.explorationAxes) && proposal.explorationAxes.length > 0);
  assert.equal(proposal.humanSelection.required, true);
  assert.equal(proposal.humanSelection.status, "pending");
  assert.equal(proposal.executionBoundary.providerNeutral, true);
  assert.equal(proposal.executionBoundary.generatesMedia, false);
  assert.ok(proposal.proposals.every((item) => item.proposalId && item.primaryDelta && Array.isArray(item.capabilityRequirements)));
  assert.ok(proposal.proposals.every((item) => !Object.hasOwn(item, "recommendedProvider")));
  const result = await validatePayload(proposalSchemaPath, proposal);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(proposal), []);
});

test("DirectorProposals 2.5 rejects a Provider choice", async () => {
  const invalid = structuredClone(proposal);
  invalid.proposals[0].recommendedProvider = "codex";
  const result = await validatePayload(proposalSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must not match the forbidden schema/);
});

test("DirectorProposals 2.5 requires genuinely distinct primary deltas", () => {
  const invalid = structuredClone(proposal);
  invalid.proposals[1].primaryDelta = structuredClone(invalid.proposals[0].primaryDelta);
  assert.match(validateByKind(invalid).join("\n"), /primary deltas must be distinct/);
});

test("DirectorProposals retains a schema-valid 2.0 compatibility shape", async () => {
  const legacy = structuredClone(proposal);
  legacy.contractVersion = "2.0.0";
  for (const key of ["proposalSetId", "version", "sourceRefs", "explorationAxes", "humanSelection", "executionBoundary", "validation", "provenance"]) delete legacy[key];
  for (const item of legacy.proposals) {
    for (const key of ["proposalId", "primaryDelta", "capabilityRequirements", "costClass", "riskClass"]) delete item[key];
    item.recommendedProvider = "codex";
  }
  const result = await validatePayload(proposalSchemaPath, legacy);
  assert.equal(result.valid, true);
});
