import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const schemaPath = join(contractRoot, "schemas", "editorial-timeline-plan.schema.json");
const timeline = JSON.parse(await readFile(join(contractRoot, "examples", "editorial-timeline-plan.json"), "utf8"));

test("EditorialTimelinePlan is a Production-owned OTIO-model-aligned plan with exact external media references", async () => {
  assert.equal(timeline.kind, "cineweave_codex_editorial_timeline_plan");
  assert.equal(timeline.contractVersion, "2.5.0");
  assert.equal(timeline.storyboardRef.kind, "cineweave_codex_storyboard_sequence");
  assert.deepEqual(timeline.frameRate, { numerator: 24, denominator: 1, dropFrame: false });
  assert.equal(timeline.otioExchange.model, "otio-core");
  assert.equal(timeline.otioExchange.externalMediaOnly, true);
  assert.equal(timeline.otioExchange.serializationStatus, "not_exported");
  assert.equal(timeline.executionBoundary.embedsMedia, false);
  assert.equal(timeline.executionBoundary.exportsTimeline, false);
  assert.ok(timeline.tracks.some((track) => track.segments.some((segment) => segment.segmentType === "media")));
  assert.ok(timeline.tracks.some((track) => track.segments.some((segment) => segment.segmentType === "placeholder")));
  assert.equal((await validatePayload(schemaPath, timeline)).valid, true);
  assert.deepEqual(validateByKind(timeline), []);
});

test("EditorialTimelinePlan rejects false conformance, implicit gaps and unanchored transitions", () => {
  const falseConformance = structuredClone(timeline);
  falseConformance.conformStatus = "conformed";
  assert.match(validateByKind(falseConformance).join("\n"), /conformed timeline cannot retain placeholder segments/);

  const implicitGap = structuredClone(timeline);
  implicitGap.tracks[0].segments[1].timelineRange.startFrame += 1;
  assert.match(validateByKind(implicitGap).join("\n"), /segments must be contiguous/);

  const unanchoredTransition = structuredClone(timeline);
  unanchoredTransition.transitions[0].atFrame += 1;
  assert.match(validateByKind(unanchoredTransition).join("\n"), /must anchor at the shared segment boundary/);
});
