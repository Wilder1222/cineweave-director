import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const checkerUrl = new URL("../skills/cineweave-director/scripts/check-change-impact.mjs", import.meta.url);
const checkerModule = await import(checkerUrl).catch((error) => {
  if (error.code === "ERR_MODULE_NOT_FOUND") return {};
  throw error;
});
function check(worksheet) {
  assert.equal(typeof checkerModule.checkChangeImpact, "function", "the change-impact checker must exist");
  return checkerModule.checkChangeImpact(worksheet);
}

function worksheet() {
  return {
    format: "cineweave-change-impact",
    canonical: false,
    artifacts: [
      { id: "appearance.courier", revision: 1, dependencyCoverage: "complete" },
      { id: "shot.coat", revision: 1, dependencyCoverage: "complete" },
      { id: "shot.face", revision: 1, dependencyCoverage: "complete" },
      { id: "prompt.coat", revision: 1, dependencyCoverage: "complete" },
      { id: "audio.ambience", revision: 1, dependencyCoverage: "complete" },
    ],
    dependencies: [
      { consumer: "shot.coat", source: "appearance.courier", sourceRevision: 1, paths: ["/wardrobe/color"] },
      { consumer: "shot.face", source: "appearance.courier", sourceRevision: 1, paths: ["/face"] },
      { consumer: "prompt.coat", source: "shot.coat", sourceRevision: 1, paths: ["/promptHandoff"] },
    ],
    changes: [
      { source: "appearance.courier", fromRevision: 1, toRevision: 2, paths: ["/wardrobe/color"], reason: "用户将外套改为蓝色" },
    ],
  };
}
function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function rejects(mutate, code) {
  const plan = worksheet();
  mutate(plan);
  const result = check(plan);
  assert.equal(result.valid, false);
  assert.equal(result.scope, "plan_only");
  assert.ok(result.errors.some((error) => error.code === code), JSON.stringify(result.errors));
  assert.deepEqual(result.affected, [], "invalid input must not claim a trustworthy impact set");
  assert.deepEqual(result.unaffected, []);
}
function cli(input, args = []) {
  const directory = mkdtempSync(join(tmpdir(), "cineweave-impact-test-"));
  try {
    const path = join(directory, "impact.json");
    const source = typeof input === "string" ? input : JSON.stringify(input);
    writeFileSync(path, source);
    const result = spawnSync(process.execPath, [fileURLToPath(checkerUrl), ...args, path], { encoding: "utf8" });
    assert.equal(readFileSync(path, "utf8"), source, "CLI must not rewrite the worksheet");
    return { ...result, json: JSON.parse(result.stdout) };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("change impact narrows direct fields and conservatively propagates descendants", () => {
  const result = check(worksheet());
  assert.equal(result.valid, true);
  assert.equal(result.scope, "plan_only");
  assert.deepEqual(result.changedSources, ["appearance.courier"]);
  assert.deepEqual(result.affected, ["shot.coat", "prompt.coat"]);
  assert.deepEqual(result.unaffected, ["shot.face", "audio.ambience"]);
  assert.deepEqual(result.needsReview, []);
  assert.deepEqual(result.errors, []);
  assert.equal(result.sourceAuthorityVerified, false);
  assert.equal(result.measurementVerified, false);
  assert.equal(result.changeEvidence[0].status, "declared_change");
});

test("change impact does not mutate deeply frozen worksheet, revisions or evidence", () => {
  const plan = worksheet();
  plan.changes[0].before = { color: "red", material: ["wool"] };
  plan.changes[0].after = { material: ["wool"], color: "blue" };
  const snapshot = JSON.stringify(plan);
  deepFreeze(plan);
  const result = check(plan);
  assert.equal(result.valid, true);
  assert.equal(JSON.stringify(plan), snapshot);
  assert.equal(plan.artifacts[0].revision, 1);
  assert.equal(result.changeEvidence[0].status, "supplied_difference");
});

test("change impact treats complete empty query and no declared changes as valid", () => {
  const plan = worksheet();
  plan.changes = [];
  assert.deepEqual(check(plan).unaffected, plan.artifacts.map((artifact) => artifact.id));
  plan.artifacts = [];
  plan.dependencies = [];
  assert.equal(check(plan).valid, true);
});

test("change impact compares decoded pointer tokens including slash, tilde and empty tokens", () => {
  const plan = worksheet();
  plan.dependencies[0].paths = ["/wardrobe/a~1b/~0color"];
  plan.dependencies[1].paths = ["/wardrobe/a/b/~0color"];
  plan.changes[0].paths = ["/wardrobe/a~1b"];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
  assert.deepEqual(check(plan).unaffected, ["shot.face", "audio.ambience"]);
  plan.dependencies[0].paths = ["/wardrobe//color"];
  plan.changes[0].paths = ["/wardrobe/"];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
  plan.dependencies[0].paths = ["/wardrobe/~01"];
  plan.dependencies[1].paths = ["/wardrobe/~1"];
  plan.changes[0].paths = ["/wardrobe/~01"];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
});

test("change impact matches ancestor and descendant paths without lexical prefix matches", () => {
  const plan = worksheet();
  plan.dependencies[0].paths = ["/faceColor"];
  plan.changes[0].paths = ["/face"];
  assert.deepEqual(check(plan).affected, ["shot.face"]);
  plan.dependencies[0].paths = ["/wardrobe"];
  plan.changes[0].paths = ["/wardrobe/color"];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
  plan.dependencies[0].paths = ["/wardrobe/color/value"];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
});

test("change impact allows explicit whole-document pointer and rejects absent path arrays", () => {
  const plan = worksheet();
  plan.changes[0].paths = [""];
  assert.deepEqual(check(plan).affected, ["shot.coat", "shot.face", "prompt.coat"]);
  plan.changes[0].paths = ["/other"];
  plan.dependencies[0].paths = [""];
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
  rejects((p) => { p.changes[0].paths = []; }, "PATHS");
  rejects((p) => { p.dependencies[0].paths = []; }, "PATHS");
});

test("change impact rejects malformed and duplicate JSON pointers", () => {
  for (const pointer of ["wardrobe/color", "/bad~", "/bad~2", "#/face", 3, null]) {
    rejects((p) => { p.changes[0].paths = [pointer]; }, "POINTER");
    rejects((p) => { p.dependencies[0].paths = [pointer]; }, "POINTER");
  }
  rejects((p) => { p.changes[0].paths = ["/face", "/face"]; }, "DUPLICATE_PATH");
});

test("change impact keeps every isolated partial or unknown artifact under review", () => {
  const plan = worksheet();
  plan.artifacts[2].dependencyCoverage = "partial";
  plan.artifacts[4].dependencyCoverage = "unknown";
  assert.deepEqual(check(plan).needsReview, ["shot.face", "audio.ambience"]);
  assert.deepEqual(check(plan).unaffected, []);
  plan.artifacts.push({ id: "isolated.prompt", revision: 1, dependencyCoverage: "unknown" });
  assert.ok(check(plan).needsReview.includes("isolated.prompt"));
  assert.ok(!check(plan).unaffected.includes("isolated.prompt"));
});

test("change impact propagates review uncertainty to declared descendants", () => {
  const plan = worksheet();
  plan.changes = [];
  plan.artifacts[0].dependencyCoverage = "partial";
  const result = check(plan);
  assert.deepEqual(result.needsReview, ["appearance.courier", "shot.coat", "shot.face", "prompt.coat"]);
  assert.deepEqual(result.unaffected, ["audio.ambience"]);
  plan.artifacts[0].dependencyCoverage = "complete";
  plan.artifacts[0].validity = "unresolved";
  assert.deepEqual(check(plan).needsReview, result.needsReview);
});

test("change impact propagates explicitly stale ancestors even without changes", () => {
  const plan = worksheet();
  plan.changes = [];
  plan.artifacts[0].validity = "stale";
  assert.deepEqual(check(plan).affected, ["appearance.courier", "shot.coat", "shot.face", "prompt.coat"]);
  assert.deepEqual(check(plan).unaffected, ["audio.ambience"]);
  plan.artifacts[0].validity = "valid";
  plan.artifacts[1].validity = "stale";
  plan.artifacts[3].dependencyCoverage = "partial";
  const result = check(plan);
  assert.deepEqual(result.affected, ["shot.coat", "prompt.coat"]);
  assert.deepEqual(result.needsReview, ["prompt.coat"]);
});

test("change impact requires exact declared IDs and revisions", () => {
  rejects((p) => { p.dependencies[0].source = "appearance.missing"; }, "SOURCE_ID");
  rejects((p) => { p.dependencies[0].consumer = "shot.missing"; }, "CONSUMER_ID");
  rejects((p) => { p.changes[0].source = "appearance.missing"; }, "SOURCE_ID");
  rejects((p) => { p.dependencies[0].sourceRevision = 2; }, "SOURCE_REVISION");
  rejects((p) => { p.changes[0].fromRevision = 2; }, "SOURCE_REVISION");
  rejects((p) => { p.artifacts[0].id = " appearance.courier"; }, "ARTIFACT_ID");
});

test("change impact rejects unsafe or incompatible revisions", () => {
  for (const revision of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1"]) {
    rejects((p) => { p.artifacts[0].revision = revision; }, "REVISION");
    rejects((p) => { p.dependencies[0].sourceRevision = revision; }, "REVISION");
    rejects((p) => { p.changes[0].toRevision = revision; }, "REVISION");
  }
  rejects((p) => { p.changes[0].toRevision = 1; }, "REVISION_ORDER");
  rejects((p) => { p.changes.push({ ...p.changes[0], toRevision: 3, paths: ["/face"] }); }, "INCOMPATIBLE_CHANGE");
});

test("change impact allows compatible multiple field changes and rejects duplicate edges or artifacts", () => {
  const plan = worksheet();
  plan.changes.push({ ...plan.changes[0], paths: ["/face"], reason: "用户修订面部草稿" });
  assert.equal(check(plan).valid, true);
  assert.deepEqual(check(plan).affected, ["shot.coat", "shot.face", "prompt.coat"]);
  rejects((p) => { p.artifacts.push({ ...p.artifacts[0] }); }, "DUPLICATE_ARTIFACT");
  rejects((p) => { p.dependencies.push({ ...p.dependencies[0] }); }, "DUPLICATE_DEPENDENCY");
  rejects((p) => { p.changes.push({ ...p.changes[0] }); }, "DUPLICATE_CHANGE");
});

test("change impact rejects self cycles and longer cycles", () => {
  rejects((p) => { p.dependencies.push({ consumer: "appearance.courier", source: "appearance.courier", sourceRevision: 1, paths: [""] }); }, "DEPENDENCY_CYCLE");
  rejects((p) => { p.dependencies.push({ consumer: "appearance.courier", source: "prompt.coat", sourceRevision: 1, paths: [""] }); }, "DEPENDENCY_CYCLE");
});

test("change impact recognizes no-op only from both supplied JSON values", () => {
  const plan = worksheet();
  plan.changes[0].before = { color: "red", nested: { b: 2, a: [1, null] } };
  plan.changes[0].after = { nested: { a: [1, null], b: 2 }, color: "red" };
  let result = check(plan);
  assert.equal(result.valid, true);
  assert.deepEqual(result.affected, []);
  assert.deepEqual(result.changedSources, []);
  assert.deepEqual(result.unaffected, plan.artifacts.map((artifact) => artifact.id));
  assert.equal(result.noOpChanges.length, 1);
  assert.equal(result.changeEvidence[0].status, "no_op");
  plan.changes[0].toRevision = 1;
  assert.equal(check(plan).valid, true, "an explicit no-op may retain its revision");
  delete plan.changes[0].after;
  plan.changes[0].toRevision = 2;
  result = check(plan);
  assert.deepEqual(result.affected, ["shot.coat", "prompt.coat"]);
  assert.deepEqual(result.noOpChanges, []);
  assert.equal(result.changeEvidence[0].status, "declared_change");
});

test("change impact does not equate absent evidence with null or ignore contradictory changes", () => {
  const plan = worksheet();
  plan.changes[0].before = null;
  assert.deepEqual(check(plan).affected, ["shot.coat", "prompt.coat"]);
  plan.changes[0].after = null;
  assert.deepEqual(check(plan).affected, []);
  const second = { ...plan.changes[0], before: "red", after: "blue" };
  plan.changes.push(second);
  assert.equal(check(plan).valid, false);
  assert.ok(check(plan).errors.some((error) => error.code === "CONFLICTING_EVIDENCE"));
});

test("change impact JSON preflight rejects accessor evidence without invoking its getter", () => {
  const plan = worksheet();
  let reads = 0;
  Object.defineProperty(plan.changes[0], "before", { enumerable: true, get() { reads += 1; return "red"; } });
  plan.changes[0].after = "red";
  const result = check(plan);
  assert.equal(reads, 0, "checking an accessor must not execute input code");
  assert.equal(result.valid, false);
  assert.deepEqual(result.noOpChanges, []);
  assert.deepEqual(result.unaffected, []);
  assert.ok(result.errors.some((error) => error.code === "EVIDENCE_JSON"));
});

test("change impact JSON preflight rejects hidden evidence fields instead of inferring no-op", () => {
  const plan = worksheet();
  plan.changes[0].before = Object.defineProperty({}, "a", { value: 1 });
  plan.changes[0].after = {};
  const result = check(plan);
  assert.equal(result.valid, false);
  assert.deepEqual(result.noOpChanges, []);
  assert.ok(result.errors.some((error) => error.code === "EVIDENCE_JSON"));
});

test("change impact JSON preflight inspects descriptors throughout the worksheet before reading values", () => {
  for (const install of [
    (plan, get) => Object.defineProperty(plan, "format", { enumerable: true, get }),
    (plan, get) => Object.defineProperty(plan.artifacts[0], "id", { enumerable: true, get }),
    (plan, get) => Object.defineProperty(plan.dependencies[0], "source", { enumerable: true, get }),
    (plan, get) => Object.defineProperty(plan.changes[0].paths, "0", { enumerable: true, get }),
    (plan, get) => { plan.changes[0].before = { nested: {} }; Object.defineProperty(plan.changes[0].before.nested, "color", { enumerable: true, get }); },
  ]) {
    const plan = worksheet();
    let reads = 0;
    install(plan, () => { reads += 1; return "red"; });
    const result = check(plan);
    assert.equal(reads, 0, "no field getter may run, including malformed required fields");
    assert.equal(result.valid, false);
    assert.deepEqual(result.noOpChanges, []);
  }
});

test("change impact JSON preflight rejects symbols, hidden fields, cycles and non-JSON data", () => {
  for (const mutate of [
    (plan) => { plan.changes[0].before = { [Symbol("hidden")]: "red" }; },
    (plan) => { plan.changes[0].before = { value: undefined }; },
    (plan) => { plan.changes[0].before = { value: Infinity }; },
    (plan) => { plan.changes[0].before = { value: NaN }; },
    (plan) => { plan.changes[0].before = { value: 1n }; },
    (plan) => { plan.changes[0].before = { value: () => "red" }; },
    (plan) => { plan.changes[0].before = new Date("2026-10-12T00:00:00Z"); },
    (plan) => { plan.changes[0].before = Object.create({ color: "red" }); },
    (plan) => { plan.changes[0].before = {}; plan.changes[0].before.self = plan.changes[0].before; },
    (plan) => { plan.changes[0].before = new Array(1); },
    (plan) => { plan.changes[0].before = ["red"]; plan.changes[0].before.extra = true; },
    (plan) => { plan.changes[0].before = ["red"]; Object.defineProperty(plan.changes[0].before, "0", { enumerable: false }); },
    (plan) => { Object.defineProperty(plan.artifacts[0], "revision", { value: 1, enumerable: false }); },
    (plan) => { plan.dependencies[0].paths = new Array(1); },
    (plan) => { plan.artifacts[Symbol("extra")] = true; },
    (plan) => { plan.unrelatedCycle = plan; },
  ]) {
    const plan = worksheet();
    mutate(plan);
    const result = check(plan);
    assert.equal(result.valid, false);
    assert.deepEqual(result.noOpChanges, []);
    assert.deepEqual(result.unaffected, []);
  }
});

test("change impact JSON preflight accepts deeply frozen real JSON evidence for no-op", () => {
  const plan = worksheet();
  plan.changes[0].before = { nested: { color: "red", values: [1, null, true] } };
  plan.changes[0].after = { nested: { values: [1, null, true], color: "red" } };
  deepFreeze(plan);
  const result = check(plan);
  assert.equal(result.valid, true);
  assert.equal(result.noOpChanges.length, 1);
  assert.deepEqual(result.affected, []);
  assert.equal(plan.artifacts[0].revision, 1);
});

test("change impact rejects unsupported fields and malformed worksheet values", () => {
  for (const invalid of [null, [], "impact", 3, {}]) assert.equal(check(invalid).valid, false);
  rejects((p) => { p.canonical = true; }, "FORMAT");
  rejects((p) => { p.format = "cineweave-working-draft"; }, "FORMAT");
  rejects((p) => { p.artifacts = {}; }, "ARRAY");
  rejects((p) => { p.dependencies = null; }, "ARRAY");
  rejects((p) => { p.changes = "unknown"; }, "ARRAY");
  rejects((p) => { p.kind = "NewCanonicalRoot"; }, "UNKNOWN_FIELD");
  rejects((p) => { p.artifacts[0].hash = "invented"; }, "UNKNOWN_FIELD");
  rejects((p) => { p.dependencies[0].outputPaths = ["/face"]; }, "UNKNOWN_FIELD");
  rejects((p) => { p.changes[0].approved = true; }, "UNKNOWN_FIELD");
  rejects((p) => { p.artifacts[0].dependencyCoverage = "verified"; }, "COVERAGE");
  rejects((p) => { p.artifacts[0].validity = "approved"; }, "VALIDITY");
  rejects((p) => { p.changes[0].reason = " "; }, "REASON");
  rejects((p) => { p.changes[0].before = { color: undefined }; }, "EVIDENCE_JSON");
});

test("change impact CLI returns stdout JSON with exit 0 for complete declarations", () => {
  const result = cli(worksheet());
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(result.json.valid, true);
  assert.deepEqual(result.json.affected, ["shot.coat", "prompt.coat"]);
});

test("change impact CLI returns exit 2 for valid unresolved coverage", () => {
  const plan = worksheet();
  plan.artifacts[4].dependencyCoverage = "unknown";
  const result = cli(plan);
  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");
  assert.equal(result.json.valid, true);
  assert.deepEqual(result.json.needsReview, ["audio.ambience"]);
});

test("change impact CLI returns exit 1 and stdout diagnostics for invalid worksheets", () => {
  const plan = worksheet();
  plan.dependencies[0].sourceRevision = 2;
  const result = cli(plan);
  assert.equal(result.status, 1);
  assert.equal(result.stderr, "");
  assert.equal(result.json.valid, false);
  assert.ok(result.json.errors.some((error) => error.code === "SOURCE_REVISION"));
});

test("change impact CLI rejects duplicate JSON members and malformed JSON", () => {
  for (const source of [JSON.stringify(worksheet()).replace('"canonical":false', '"canonical":false,"canonical":false'), '{"format":']) {
    const result = cli(source);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.equal(result.json.valid, false);
    assert.equal(result.json.errors[0].code, "INPUT");
    assert.deepEqual(result.json.unaffected, []);
  }
});

test("change impact CLI gives JSON help and JSON argument or file errors", () => {
  const path = fileURLToPath(checkerUrl);
  for (const args of [[], ["missing-impact-file.json"], ["--unsupported"]]) {
    const result = spawnSync(process.execPath, [path, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.equal(result.stderr, "");
    assert.equal(JSON.parse(result.stdout).valid, false);
  }
  const result = spawnSync(process.execPath, [path, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).scope, "plan_only");
});
