import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDefinitions, validatePayloadEvidence } from "../../scripts/run-live-skill-evals.mjs";
import { validateDocument, validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const manifest = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "contracts", "manifest.json"), "utf8"));
const shotSpec = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "shot-spec.json"), "utf8"));
const evaluationRun = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "skill-evaluation-run.json"), "utf8"));
const liveSuite = JSON.parse(await readFile(join(repoRoot, "tests", "behavior", "live-cases.json"), "utf8"));
const responseSchemaPath = join(repoRoot, "tests", "behavior", "live-response.schema.json");
const evaluationRunSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "skill-evaluation-run.schema.json");

function directorResponse(payload = structuredClone(shotSpec)) {
  return {
    selectedSkill: "cineweave-director",
    contractKinds: ["cineweave_codex_shot_spec"],
    payloads: [{ kind: "cineweave_codex_shot_spec", payload }]
  };
}

test("live evaluation accepts owner-matched schema-valid semantic payload evidence", async () => {
  const result = await validatePayloadEvidence(directorResponse(), manifest);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.contractKinds, ["cineweave_codex_shot_spec"]);
});

test("live evaluation locks declared full Director route replay coverage", () => {
  const complete = validateDefinitions(liveSuite, manifest);
  assert.deepEqual(complete, []);

  const incomplete = structuredClone(liveSuite);
  incomplete.cases = incomplete.cases.filter((item) => item.expectedRoute !== "media_import");
  const errors = validateDefinitions(incomplete, manifest);
  assert.match(errors.join("\\n"), /cineweave-director lacks required live route media_import/);

  const missingPrevis = structuredClone(liveSuite);
  missingPrevis.cases = missingPrevis.cases.filter((item) => item.expectedRoute !== "camera_previs");
  const previsErrors = validateDefinitions(missingPrevis, manifest);
  assert.match(previsErrors.join("\\n"), /cineweave-director lacks required live route camera_previs/);
});

test("live evaluation derives one declared kind from multiple payloads of that kind", async () => {
  const secondShot = structuredClone(shotSpec);
  secondShot.shotSpecId = "shot.rain-courtyard-recognition-v2";
  secondShot.version = 2;
  const result = await validatePayloadEvidence({
    selectedSkill: "cineweave-director",
    contractKinds: ["cineweave_codex_shot_spec"],
    payloads: [
      { kind: "cineweave_codex_shot_spec", payload: structuredClone(shotSpec) },
      { kind: "cineweave_codex_shot_spec", payload: secondShot }
    ]
  }, manifest);
  assert.equal(result.valid, true);
  assert.deepEqual(result.contractKinds, ["cineweave_codex_shot_spec"]);
});

test("live response schema requires payload evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-live-response-"));
  try {
    const path = join(root, "response.json");
    await writeFile(path, JSON.stringify({
      caseId: "live.director.motivated-shot",
      selectedSkill: "cineweave-director",
      route: "shot_direction",
      outcome: "answer",
      contractKinds: ["cineweave_codex_shot_spec"],
      response: "A prose-only answer",
      questions: [],
      unsupportedClaims: []
    }), "utf8");
    const result = await validateDocument(responseSchemaPath, path);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /payloads is required/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("evaluation records retain support for the prior runner version", async () => {
  const current = await validatePayload(evaluationRunSchemaPath, evaluationRun);
  assert.equal(current.valid, true);
  const prior = structuredClone(evaluationRun);
  prior.runnerVersion = "1.0.0";
  const priorResult = await validatePayload(evaluationRunSchemaPath, prior);
  assert.equal(priorResult.valid, true);
  const unknown = structuredClone(evaluationRun);
  unknown.runnerVersion = "1.2.0";
  const unknownResult = await validatePayload(evaluationRunSchemaPath, unknown);
  assert.equal(unknownResult.valid, false);
});

test("live evaluation rejects a self-declared contract kind without a payload", async () => {
  const result = await validatePayloadEvidence({
    selectedSkill: "cineweave-director",
    contractKinds: ["cineweave_codex_shot_spec"],
    payloads: []
  }, manifest);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /contractKinds must exactly match unique payload kinds/);
});

test("live evaluation rejects schema-invalid inline payloads", async () => {
  const result = await validatePayloadEvidence(directorResponse({ kind: "cineweave_codex_shot_spec" }), manifest);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /schema: .*required/);
});

test("live evaluation rejects contracts owned by a different selected Skill", async () => {
  const response = directorResponse();
  response.selectedSkill = "cineweave-prompt";
  const result = await validatePayloadEvidence(response, manifest);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /owned by cineweave-director, not cineweave-prompt/);
});

test("live evaluation runs contract semantic validation", async () => {
  const payload = structuredClone(shotSpec);
  payload.blocking[0].subjectRef = "binding.unknown";
  const result = await validatePayloadEvidence(directorResponse(payload), manifest);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /semantic: ShotSpec blocking references unknown subject/);
});

test("live evaluation rejects wrapper and payload kind disagreement", async () => {
  const payload = structuredClone(shotSpec);
  payload.kind = "cineweave_codex_temporal_spec";
  const result = await validatePayloadEvidence(directorResponse(payload), manifest);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /wrapper kind must match payload.kind/);
});
