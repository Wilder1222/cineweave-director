import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const readExample = (name) => readFile(join(contractRoot, "examples", name), "utf8").then(JSON.parse);

const [heroFrameAnchor, sequenceRhythmSpec, shotSpec, storyboard, temporalSpec] = await Promise.all([
  readExample("hero-frame-anchor.json"),
  readExample("sequence-rhythm-spec.json"),
  readExample("shot-spec.json"),
  readExample("storyboard-action-sequence.json"),
  readExample("temporal-spec.json")
]);

test("HeroFrameAnchor is schema-valid and exact against its ShotSpec", async () => {
  const schemaResult = await validatePayload(join(contractRoot, "schemas", "hero-frame-anchor.schema.json"), heroFrameAnchor);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(heroFrameAnchor, { shotSpec }), []);
});

test("HeroFrameAnchor rejects camera drift and protected-path overrides", () => {
  const invalidCamera = structuredClone(heroFrameAnchor);
  invalidCamera.visualDna.camera.focalLengthMm = 35;
  assert.match(validateByKind(invalidCamera, { shotSpec }).join("\n"), /focal length must match/);

  const invalidOverride = structuredClone(heroFrameAnchor);
  invalidOverride.inheritancePolicy.allowOverrides.push("character_identity.costume");
  assert.match(validateByKind(invalidOverride, { shotSpec }).join("\n"), /cannot override locked identity or geography path/);
});

test("SequenceRhythmSpec closes storyboard coverage on reduced integer frames", async () => {
  const schemaResult = await validatePayload(join(contractRoot, "schemas", "sequence-rhythm-spec.schema.json"), sequenceRhythmSpec);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(sequenceRhythmSpec, { storyboard }), []);
});

test("SequenceRhythmSpec rejects unreduced timebases and hidden gaps", () => {
  const invalidTimebase = structuredClone(sequenceRhythmSpec);
  invalidTimebase.timebase = { ...invalidTimebase.timebase, numerator: 48, denominator: 2 };
  assert.match(validateByKind(invalidTimebase, { storyboard }).join("\n"), /positive reduced rational/);

  const invalidGap = structuredClone(sequenceRhythmSpec);
  invalidGap.shotWindows.push({
    shotId: "shot.second",
    order: 2,
    startFrame: 105,
    endFrame: 176,
    purpose: "second coverage",
    breathing: false
  });
  assert.match(validateByKind(invalidGap).join("\n"), /contiguous with the previous window/);
});

test("TemporalSpec may continue from an exact HeroFrameAnchor", async () => {
  const continued = structuredClone(temporalSpec);
  continued.heroFrameAnchorRef = {
    kind: heroFrameAnchor.kind,
    id: heroFrameAnchor.heroFrameAnchorId,
    version: heroFrameAnchor.version,
    contentHash: sha256Canonical(heroFrameAnchor)
  };
  const schemaResult = await validatePayload(join(contractRoot, "schemas", "temporal-spec.schema.json"), continued);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(continued, { shotSpec, heroFrameAnchor }), []);

  const stale = structuredClone(continued);
  stale.heroFrameAnchorRef.contentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  assert.match(validateByKind(stale, { shotSpec, heroFrameAnchor }).join("\n"), /exact HeroFrameAnchor/);
});
