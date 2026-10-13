import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePayload } from "../scripts/validate-output.mjs";
import { canonicalize, sha256Canonical } from "../scripts/canonical-json.mjs";
import { ARTIFACT_ID_FIELDS, resolveExactArtifact, validateCapabilityResolutionContext } from "../scripts/contract-context.mjs";

const contractRoot = new URL("../skills/cineweave-director/resources/contracts/", import.meta.url);

async function fixture(stem) {
  return {
    schemaPath: fileURLToPath(new URL(`schemas/${stem}.schema.json`, contractRoot)),
    payload: JSON.parse(await readFile(new URL(`examples/${stem}.json`, contractRoot), "utf8")),
  };
}

function reference(document, idField = "profileId") {
  return { kind: document.kind, id: document[idField], version: document.version, contentHash: sha256Canonical(document) };
}

async function selectedFixture() {
  const { schemaPath, payload } = await fixture("capability-resolution-plan");
  const { payload: profile } = await fixture("capability-profile");
  payload.request.requirements = [payload.request.requirements[0]];
  payload.candidates[0].capabilityResults = [{ ...payload.candidates[0].capabilityResults[0], support: "strong", status: "pass", score: 1 }];
  payload.candidates[0].status = "selected";
  payload.candidates[0].capabilityProfileRef = reference(profile);
  payload.candidates[0].warnings = [];
  payload.status = "selected";
  payload.selection.status = "selected";
  payload.selection.selectedCandidateId = payload.candidates[0].candidateId;
  payload.selection.selectedCapabilityProfileRef = structuredClone(payload.candidates[0].capabilityProfileRef);
  return { schemaPath, payload, profile, artifacts: [{ ref: reference(profile), document: profile }] };
}

test("CapabilityResolutionPlan rejects handfilled strong/pass/selected claims against a partial exact profile", async () => {
  const { schemaPath, payload, artifacts } = await selectedFixture();
  const result = await validatePayload(schemaPath, payload, { artifacts });
  assert.equal(result.valid, false, "A local claim must not promote the supplied partial identity_consistency capability to strong support.");
  assert.match(result.errors.join("\n"), /support.*(profile|partial)|profile.*support/iu);
});

test("CapabilityResolutionPlan without exact source bodies passes local closure with explicit unresolved evidence", async () => {
  const { schemaPath, payload } = await selectedFixture();
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /exact.*unavailable/iu);
});

test("CapabilityResolutionPlan public API rejects malformed registries and matching-hash profile summaries", async () => {
  const data = await selectedFixture();
  for (const artifacts of [{}, [data.artifacts[0], structuredClone(data.artifacts[0])], [{ ref: data.artifacts[0].ref }]]) {
    const result = await validatePayload(data.schemaPath, data.payload, { artifacts });
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /artifacts|registry|binding/iu);
  }
  const summary = { kind: data.profile.kind, profileId: data.profile.profileId, version: data.profile.version, capabilities: data.profile.capabilities };
  const ref = reference(summary);
  data.payload.candidates[0].capabilityProfileRef = ref;
  data.payload.selection.selectedCapabilityProfileRef = structuredClone(ref);
  const result = await validatePayload(data.schemaPath, data.payload, { artifacts: [{ ref, document: summary }] });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /upstream document|contract body/iu);
});

async function validateStructure(ref, document) {
  const index = JSON.parse(await readFile(new URL("index.json", contractRoot), "utf8"));
  const contract = index.contracts.find((entry) => entry.kind === ref.kind);
  assert.ok(contract, `Missing fixture schema for ${ref.kind}`);
  return validatePayload(fileURLToPath(new URL(contract.schema, contractRoot)), document);
}

function binding(document, idField = "profileId") {
  return { ref: reference(document, idField), document };
}

async function resolveProfile(document, options = {}) {
  const entry = binding(document);
  return resolveExactArtifact(entry.ref, { artifacts: [entry], validateStructure, label: "$.profileRef", ...options });
}

test("resolveExactArtifact verifies complete source body, stable JCS key order and leaves inputs unchanged", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const entry = binding(profile);
  const reordered = Object.fromEntries(Object.entries(entry.ref).reverse());
  const artifacts = [{ document: profile, ref: reordered }];
  const before = canonicalize({ artifacts, ref: entry.ref });
  const result = await resolveExactArtifact(entry.ref, { artifacts, validateStructure, label: "$.profileRef" });
  assert.equal(result.status, "resolved", result.errors.join("\n"));
  assert.equal(result.document, profile);
  assert.deepEqual(result.errors, []);
  assert.equal(canonicalize({ artifacts, ref: entry.ref }), before);
});

test("resolveExactArtifact rejects document kind, ID, version and hash mismatches independently", async () => {
  const { payload: original } = await fixture("capability-profile");
  for (const [field, value, expected] of [
    ["kind", "cineweave_codex_license_profile", /kind/iu],
    ["profileId", "capability.impostor", /profileId|identity/iu],
    ["version", 2, /version/iu],
    ["title", "Changed document bytes", /hash/iu],
  ]) {
    const document = structuredClone(original);
    document[field] = value;
    const ref = reference(original);
    if (field !== "title") ref.contentHash = sha256Canonical(document);
    const result = await resolveExactArtifact(ref, { artifacts: [{ ref: structuredClone(ref), document }], validateStructure, label: "$.profileRef" });
    assert.equal(result.status, "invalid", field);
    assert.equal(result.document, null, field);
    assert.match(result.errors.join("\n"), expected, field);
    assert.ok(result.unverified.length > 0, field);
  }
});

test("resolveExactArtifact treats absent exact binding as unavailable without asserting invalidity", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const result = await resolveExactArtifact(reference(profile), { artifacts: [], validateStructure, label: "$.profileRef" });
  assert.equal(result.status, "unavailable");
  assert.equal(result.document, null);
  assert.deepEqual(result.errors, []);
  assert.match(result.unverified.join("\n"), /exact.*unavailable/iu);
});

test("resolveExactArtifact rejects malformed and nonarray registries, including unrelated malformed entries", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const entry = binding(profile);
  const inherited = Object.create({ ref: entry.ref, document: profile });
  for (const artifacts of [{}, null, [null], [42], [{}], [inherited], [{ ref: entry.ref }], [entry, { ref: {}, document: {} }]]) {
    const result = await resolveExactArtifact(entry.ref, { artifacts, validateStructure, label: "$.profileRef" });
    assert.equal(result.status, "invalid");
    assert.equal(result.document, null);
    assert.match(result.errors.join("\n"), /artifacts|registry|binding/iu);
  }
});

test("resolveExactArtifact rejects ambiguous duplicate registry bindings", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const entry = binding(profile);
  const result = await resolveExactArtifact(entry.ref, { artifacts: [entry, structuredClone(entry)], validateStructure, label: "$.profileRef" });
  assert.equal(result.status, "invalid");
  assert.match(result.errors.join("\n"), /ambiguous|duplicate/iu);
});

test("resolveExactArtifact never accepts matching-hash summaries or missing source-schema validators", async () => {
  const summary = { kind: "cineweave_codex_capability_profile", profileId: "capability.summary", version: 1, capabilities: [{ capabilityId: "identity_consistency", support: "strong" }] };
  const summaryResult = await resolveProfile(summary);
  assert.equal(summaryResult.status, "invalid");
  assert.match(summaryResult.errors.join("\n"), /upstream document|source.*schema|contract body/iu);
  const { payload: profile } = await fixture("capability-profile");
  const missingValidator = await resolveProfile(profile, { validateStructure: undefined });
  assert.equal(missingValidator.status, "invalid");
  assert.match(missingValidator.errors.join("\n"), /validateStructure|validator|schema/iu);
});

test("resolveExactArtifact catches failing and malformed source-schema callback results", async () => {
  const { payload: profile } = await fixture("capability-profile");
  for (const validator of [
    async () => { throw new Error("source schema is unavailable"); },
    async () => ({ valid: false, errors: [] }),
    async () => ({ valid: true }),
    async () => ({ valid: true, errors: [42] }),
    async () => ({ valid: true, errors: ["$.title is invalid"] }),
  ]) {
    const result = await resolveProfile(profile, { validateStructure: validator });
    assert.equal(result.status, "invalid");
    assert.equal(result.document, null);
    assert.ok(result.errors.length > 0);
  }
});

test("resolveExactArtifact rejects malformed refs and never calls supplied object accessors", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const ref = reference(profile);
  for (const candidate of [null, {}, { ...ref, version: 0 }, { ...ref, id: "" }, { ...ref, contentHash: "sha256:short" }]) {
    assert.equal((await resolveExactArtifact(candidate, { artifacts: [], validateStructure })).status, "invalid");
  }
  let invoked = false;
  const document = structuredClone(profile);
  Object.defineProperty(document, "title", { enumerable: true, get() { invoked = true; throw new Error("must not run"); } });
  const result = await resolveExactArtifact(ref, { artifacts: [{ ref, document }], validateStructure });
  assert.equal(result.status, "invalid");
  assert.equal(invoked, false);
});

test("resolveExactArtifact requires own identity fields and rejects non-JSON documents without throwing", async () => {
  const { payload: profile } = await fixture("capability-profile");
  const ref = reference(profile);
  const inheritedIdentity = Object.create({ kind: profile.kind, profileId: profile.profileId, version: profile.version });
  for (const document of [inheritedIdentity, { ...profile, title: undefined }, null, [], { ...profile, version: undefined }]) {
    const result = await resolveExactArtifact(ref, { artifacts: [{ ref, document }], validateStructure });
    assert.equal(result.status, "invalid");
    assert.equal(result.document, null);
  }
  const inheritedRef = Object.create(ref);
  assert.equal((await resolveExactArtifact(inheritedRef, { artifacts: [], validateStructure })).status, "invalid");
});

test("supported source-kind IDs are explicit and ImagePrompt does not invent registry identity from shotId", async () => {
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_capability_profile, "profileId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_license_profile, "profileId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_prompt_record, "promptId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_reference_observation, "observationId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_cinematic_skill_manifest, "cinematicSkillManifestId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_asset_alias_registry, "assetAliasRegistryId");
  assert.equal(ARTIFACT_ID_FIELDS.cineweave_codex_image_prompt, null);
  const index = JSON.parse(await readFile(new URL("index.json", contractRoot), "utf8"));
  const contract = index.contracts.find((entry) => entry.kind === "cineweave_codex_image_prompt");
  const document = JSON.parse(await readFile(new URL(contract.example, contractRoot), "utf8"));
  const ref = { kind: document.kind, id: "prompt.registry-only", version: 7, contentHash: sha256Canonical(document) };
  const result = await resolveExactArtifact(ref, { artifacts: [{ ref, document }], validateStructure });
  assert.equal(result.status, "resolved", result.errors.join("\n"));
  assert.match(result.unverified.join("\n"), /identity.*version|ID.*version/iu);
  assert.equal(Object.hasOwn(document, "imagePromptId"), false);
});

test("CapabilityResolution context rejects promoted partial support but preserves aligned review claims", async () => {
  const data = await selectedFixture();
  const before = canonicalize(data.payload);
  const invalid = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.match(invalid.errors.join("\n"), /support.*(profile|partial)|profile.*support/iu);
  assert.equal(canonicalize(data.payload), before);
  data.payload.status = "needs_review";
  data.payload.selection.status = "needs_review";
  data.payload.selection.selectedCandidateId = null;
  data.payload.selection.selectedCapabilityProfileRef = null;
  data.payload.candidates[0].status = "needs_review";
  Object.assign(data.payload.candidates[0].capabilityResults[0], { support: "partial", status: "review" });
  const valid = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.deepEqual(valid.errors, []);
  assert.match(valid.unverified.join("\n"), /provider|account/iu);
  assert.match(valid.unverified.join("\n"), /rights|media/iu);
});

test("CapabilityResolution context leaves absent profiles unverified and rejects supplied summaries", async () => {
  const data = await selectedFixture();
  const absent = await validateCapabilityResolutionContext(data.payload, { artifacts: [], validateStructure });
  assert.deepEqual(absent.errors, []);
  assert.match(absent.unverified.join("\n"), /exact.*unavailable/iu);
  const summary = { kind: data.profile.kind, profileId: data.profile.profileId, version: 1, capabilities: data.profile.capabilities };
  const entry = binding(summary);
  data.payload.candidates[0].capabilityProfileRef = entry.ref;
  data.payload.selection.selectedCapabilityProfileRef = structuredClone(entry.ref);
  const invalid = await validateCapabilityResolutionContext(data.payload, { artifacts: [entry], validateStructure });
  assert.match(invalid.errors.join("\n"), /upstream document|contract body/iu);
});

test("CapabilityResolution context treats undeclared capabilities and requested scopes as unknown", async () => {
  const data = await selectedFixture();
  data.profile.capabilities = [{ capabilityId: "identity_consistency", support: "strong", supportedScopes: ["face", "body"], constraints: [] }];
  data.profile.evidenceRequirements = [];
  data.artifacts = [binding(data.profile)];
  data.payload.candidates[0].capabilityProfileRef = data.artifacts[0].ref;
  data.payload.selection.selectedCapabilityProfileRef = structuredClone(data.artifacts[0].ref);
  const scopeMismatch = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.match(scopeMismatch.errors.join("\n"), /scope|unknown/iu);
  assert.match(scopeMismatch.unverified.join("\n"), /scope.*sequence|sequence.*scope/iu);
  data.payload.candidates[0].status = "needs_review";
  Object.assign(data.payload.candidates[0].capabilityResults[0], { support: "unknown", status: "review" });
  assert.deepEqual((await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure })).errors, []);
  data.payload.request.requirements[0].capabilityId = "unlisted_capability";
  data.payload.candidates[0].capabilityResults[0].capabilityId = "unlisted_capability";
  const missing = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.deepEqual(missing.errors, []);
  assert.match(missing.unverified.join("\n"), /not declared|absent/iu);
});

test("CapabilityResolution context rejects duplicate source capability IDs rather than choosing one", async () => {
  const data = await selectedFixture();
  data.profile.capabilities.push(structuredClone(data.profile.capabilities[0]));
  data.artifacts = [binding(data.profile)];
  data.payload.candidates[0].capabilityProfileRef = data.artifacts[0].ref;
  const result = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.match(result.errors.join("\n"), /capabilityId.*duplicate|duplicate.*capability/iu);
});

async function oneCapabilityFixture(capability, { operation = "multi_reference", scope = "face", inputCount = 4, outputCount = 8 } = {}) {
  const data = await selectedFixture();
  data.profile.capabilities = [capability];
  data.profile.evidenceRequirements = [];
  Object.assign(data.payload.request, { operation, inputCount, outputCount });
  Object.assign(data.payload.request.requirements[0], { capabilityId: capability.capabilityId, scope });
  Object.assign(data.payload.candidates[0].capabilityResults[0], { capabilityId: capability.capabilityId });
  data.artifacts = [binding(data.profile)];
  data.payload.candidates[0].capabilityProfileRef = data.artifacts[0].ref;
  data.payload.selection.selectedCapabilityProfileRef = structuredClone(data.artifacts[0].ref);
  return data;
}

test("operation-wide input limits reject pass claims while bounded failed outcomes remain valid", async () => {
  const data = await oneCapabilityFixture({ capabilityId: "multi_reference", support: "strong", maxInputs: 3, supportedScopes: ["face"], constraints: [] });
  const result = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.match(result.errors.join("\n"), /inputCount.*maxInputs|input.*limit/iu);
  data.payload.candidates[0].status = "blocked";
  data.payload.candidates[0].capabilityResults[0].status = "fail";
  assert.deepEqual((await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure })).errors, []);
});

test("total input count is not applied to every capability and output count is not subject count", async () => {
  const data = await oneCapabilityFixture({ capabilityId: "face_identity", support: "strong", maxInputs: 1, maxSubjects: 1, supportedScopes: ["face"], constraints: [] });
  const result = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.deepEqual(result.errors, []);
  assert.match(result.unverified.join("\n"), /input.*attribution|per-capability.*input/iu);
  assert.match(result.unverified.join("\n"), /subject.*count|subjectCount/iu);
});

test("omitted source capacities remain unknown without manufacturing a limit", async () => {
  const data = await oneCapabilityFixture({ capabilityId: "multi_reference", support: "strong", supportedScopes: ["face"], constraints: [] });
  const result = await validateCapabilityResolutionContext(data.payload, { artifacts: data.artifacts, validateStructure });
  assert.deepEqual(result.errors, []);
  assert.match(result.unverified.join("\n"), /maxInputs.*unknown|input.*capacity.*unknown/iu);
});
