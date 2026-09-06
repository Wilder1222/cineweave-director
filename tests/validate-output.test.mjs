import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDocument, validatePayload } from "../scripts/validate-output.mjs";
import { canonicalize, sha256Bytes } from "../scripts/canonical-json.mjs";

const contractRoot = fileURLToPath(new URL("../skills/cineweave-director/resources/contracts/", import.meta.url));

async function withDocuments(schema, payload, callback) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-validate-output-"));
  const schemaPath = join(root, "schema.json");
  const payloadPath = join(root, "payload.json");
  try {
    await writeFile(schemaPath, schema, "utf8");
    await writeFile(payloadPath, payload, "utf8");
    return await callback(schemaPath, payloadPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function loadContractFixture(stem) {
  return {
    schemaPath: join(contractRoot, "schemas", `${stem}.schema.json`),
    payload: JSON.parse(await readFile(join(contractRoot, "examples", `${stem}.json`), "utf8")),
  };
}

test("RepairPlan rejects contradictory approval, malformed paths and duplicate checks", async () => {
  const { schemaPath, payload } = await loadContractFixture("repair-plan");
  for (const mutate of [
    (p) => { p.status = "approved"; p.humanGate.status = "rejected"; },
    (p) => { p.status = "rejected"; p.humanGate.status = "approved"; },
    (p) => { p.change.targetPath = "/bad~2escape"; },
    (p) => { p.change.targetPath = "not-a-pointer"; },
    (p) => { p.acceptanceChecks.push(p.acceptanceChecks[0]); },
    (p) => { p.acceptanceChecks = {}; },
  ]) {
    const candidate = structuredClone(payload);
    mutate(candidate);
    assert.equal((await validatePayload(schemaPath, candidate)).valid, false);
  }
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true);
  assert.ok(result.unverified.some((value) => value.startsWith("sourceReviewRef:")));
});

test("RepairPlan checks exact registry hashes, findings, ownership and target pointers", async () => {
  const { schemaPath, payload } = await loadContractFixture("repair-plan");
  const { payload: review } = await loadContractFixture("creative-review");
  const target = { kind: payload.targetRef.kind, constraints: { "left/hand": { "support~anchor": "threshold" } } };
  payload.change.targetPath = "/constraints/left~1hand/support~0anchor";
  payload.targetRef.contentHash = sha256Bytes(canonicalize(target));
  review.targetRefs = [structuredClone(payload.targetRef)];
  payload.sourceReviewRef.contentHash = sha256Bytes(canonicalize(review));
  const artifacts = [
    { ref: structuredClone(payload.sourceReviewRef), document: review },
    { ref: structuredClone(payload.targetRef), document: target },
  ];
  assert.equal((await validatePayload(schemaPath, payload, { artifacts })).valid, true);
  for (const [field, value, pattern] of [
    ["findingId", "missing-finding", /findingId/],
    ["domain", "character", /owner/],
  ]) {
    const result = await validatePayload(schemaPath, { ...payload, [field]: value }, { artifacts });
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
  const badPath = structuredClone(payload);
  badPath.change.targetPath = "/constraints/missing";
  assert.equal((await validatePayload(schemaPath, badPath, { artifacts })).valid, false);
  const changed = structuredClone(artifacts);
  changed[1].document.constraints["left/hand"]["support~anchor"] = "changed";
  assert.match((await validatePayload(schemaPath, payload, { artifacts: changed })).errors.join("\n"), /hash/);
  assert.equal((await validatePayload(schemaPath, payload, { artifacts: [...artifacts, artifacts[0]] })).valid, false);
  const passed = structuredClone(artifacts);
  passed[0].document.findings[1].status = "pass";
  passed[0].ref.contentHash = sha256Bytes(canonicalize(passed[0].document));
  const passedPlan = { ...payload, sourceReviewRef: passed[0].ref };
  assert.match((await validatePayload(schemaPath, passedPlan, { artifacts: passed })).errors.join("\n"), /warn or fail/);
});

test("contract equality is independent of object key order", async () => {
  const result = await withDocuments(
    JSON.stringify({
      type: "object",
      properties: { value: { const: { first: 1, second: 2 } } },
      required: ["value"],
    }),
    JSON.stringify({ value: { second: 2, first: 1 } }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("uniqueItems treats structurally equal objects as duplicates", async () => {
  const result = await withDocuments(
    JSON.stringify({ type: "array", uniqueItems: true }),
    JSON.stringify([{ first: 1, second: 2 }, { second: 2, first: 1 }]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicates an earlier item/);
});

test("required and additionalProperties use own JSON properties", async () => {
  const requiredResult = await withDocuments(
    JSON.stringify({ type: "object", required: ["toString"] }),
    "{}",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(requiredResult.valid, false);
  assert.match(requiredResult.errors.join("\n"), /toString.*required/);

  const additionalResult = await withDocuments(
    JSON.stringify({ type: "object", additionalProperties: false }),
    JSON.stringify({ toString: "owned" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(additionalResult.valid, false);
  assert.match(additionalResult.errors.join("\n"), /toString.*not allowed/);
});

test("contract documents reject duplicate JSON object keys", async () => {
  await assert.rejects(
    () => withDocuments(
      '{"type":"object"}',
      '{"value":1,"value":2}',
      (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
    ),
    /Duplicate object key/,
  );
});

test("contract formats count Unicode code points and require RFC3339 date-times", async () => {
  const unicodeResult = await withDocuments(
    JSON.stringify({ type: "string", minLength: 1, maxLength: 1 }),
    JSON.stringify("😀"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(unicodeResult.valid, true);

  const dateResult = await withDocuments(
    JSON.stringify({ type: "string", format: "date-time" }),
    JSON.stringify("2026-08-21"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(dateResult.valid, false);
  assert.match(dateResult.errors.join("\n"), /date-time/);
});

test("contract array items support false schemas and tuple tails", async () => {
  const forbiddenResult = await withDocuments(
    JSON.stringify({ type: "array", items: false }),
    "[1]",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbiddenResult.valid, false);

  const tupleResult = await withDocuments(
    JSON.stringify({ type: "array", prefixItems: [{ type: "string" }], items: { type: "number" } }),
    JSON.stringify(["label", 1]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(tupleResult.valid, true);
});

test("not rejects forbidden required-property branches", async () => {
  const schema = JSON.stringify({
    type: "object",
    properties: {
      stable: { type: "string" },
      legacyRef: { type: "object" },
      otherLegacyRef: { type: "object" },
    },
    not: {
      anyOf: [
        { required: ["legacyRef"] },
        { required: ["otherLegacyRef"] },
      ],
    },
  });

  const allowed = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(allowed.valid, true);

  const forbidden = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only", legacyRef: {} }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbidden.valid, false);
  assert.match(forbidden.errors.join("\n"), /must not match the forbidden schema/);
});

test("PromptProjectionPlan readiness requires truthful compatibility and rights gates", async () => {
  const { schemaPath, payload } = await loadContractFixture("prompt-projection-plan");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);

  const blocking = structuredClone(payload);
  blocking.compatibilityChecks[1].status = "unknown";
  assert.equal((await validatePayload(schemaPath, blocking)).valid, false);

  const missingRights = structuredClone(payload);
  missingRights.compatibilityChecks = missingRights.compatibilityChecks.filter((check) => check.checkId !== "check.rights-licensing");
  assert.equal((await validatePayload(schemaPath, missingRights)).valid, false);

  const blockedDefault = structuredClone(payload);
  blockedDefault.manualHandoff.hiddenDefaultChecks[0].status = "blocked";
  assert.equal((await validatePayload(schemaPath, blockedDefault)).valid, false);

  const splitReadiness = structuredClone(payload);
  splitReadiness.status = "needs_review";
  assert.equal((await validatePayload(schemaPath, splitReadiness)).valid, false);
});

test("CapabilityResolutionPlan joins requirements, results, and selection truthfully", async () => {
  const { schemaPath, payload } = await loadContractFixture("capability-resolution-plan");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);

  const leakedSelection = structuredClone(payload);
  leakedSelection.selection.selectedCandidateId = leakedSelection.candidates[0].candidateId;
  assert.equal((await validatePayload(schemaPath, leakedSelection)).valid, false);

  const unknownPass = structuredClone(payload);
  unknownPass.candidates[0].capabilityResults[0].support = "unknown";
  unknownPass.candidates[0].capabilityResults[0].status = "pass";
  assert.equal((await validatePayload(schemaPath, unknownPass)).valid, false);

  const missingHardResult = structuredClone(payload);
  missingHardResult.candidates[0].capabilityResults.shift();
  assert.equal((await validatePayload(schemaPath, missingHardResult)).valid, false);

  const selectedWithPartialHardSupport = structuredClone(payload);
  selectedWithPartialHardSupport.status = "selected";
  selectedWithPartialHardSupport.selection.status = "selected";
  selectedWithPartialHardSupport.selection.selectedCandidateId = selectedWithPartialHardSupport.candidates[0].candidateId;
  selectedWithPartialHardSupport.selection.selectedCapabilityProfileRef = structuredClone(selectedWithPartialHardSupport.candidates[0].capabilityProfileRef);
  selectedWithPartialHardSupport.candidates[0].status = "selected";
  assert.equal((await validatePayload(schemaPath, selectedWithPartialHardSupport)).valid, false);

  const selected = structuredClone(selectedWithPartialHardSupport);
  selected.candidates[0].capabilityResults[0] = {
    ...selected.candidates[0].capabilityResults[0],
    support: "strong",
    status: "pass",
    score: 1,
    reason: "The exact profile records strong support for the hard identity requirement.",
  };
  selected.candidates[0].warnings = [];
  selected.candidates[0].rationale = "Every hard requirement is strongly supported and passing.";
  selected.selection.rationale = "Select the exact capability profile for the approved planning path.";
  selected.explanation.primaryDecision = "The exact capability profile satisfies every hard requirement.";
  assert.equal((await validatePayload(schemaPath, selected)).valid, true);
});
