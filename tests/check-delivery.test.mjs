import test from "node:test";
import assert from "node:assert/strict";
import { checkDelivery, countText, frameToSrt } from "../skills/cineweave-director/scripts/check-delivery.mjs";

function worksheet() {
  return {
    frameRate: { numerator: 24, denominator: 1 },
    totalFrames: 288,
    shots: [
      { id: "S1", startFrame: 0, endFrame: 96 },
      { id: "S2", startFrame: 96, endFrame: 192 },
      { id: "S3", startFrame: 192, endFrame: 288 },
    ],
    subtitles: [{ id: "VO1", startFrame: 192, endFrame: 264, text: "值得专程回来", expectedHanCharacters: 6 }],
  };
}

test("delivery preserves exact copy and checks six-character narration with frame-derived SRT", () => {
  const plan = worksheet();
  const result = checkDelivery(plan);
  assert.equal(result.valid, true);
  assert.deepEqual(result.duration, { numerator: "288", denominator: "24" });
  assert.equal(result.endTimecode, "00:00:12,000");
  assert.equal(result.srt, "1\n00:00:08,000 --> 00:00:11,000\n值得专程回来\n");
  assert.equal(plan.subtitles[0].text, result.subtitles[0].text);
  plan.subtitles[0].expectedHanCharacters = 7;
  assert.match(checkDelivery(plan).errors.join("\n"), /expected 7 Han characters, found 6/);
  assert.equal(checkDelivery(plan).srt, null);
});

test("text counts distinguish Han characters, code points and graphemes without normalizing copy", () => {
  assert.deepEqual(countText("值得专程回来！"), { hanCharacters: 6, codePoints: 7, graphemes: 7 });
  assert.deepEqual(countText("e\u0301👩‍👩‍👧‍👦"), { hanCharacters: 0, codePoints: 9, graphemes: 2 });
});

test("absolute rational-frame boundaries avoid fractional-rate drift and carry milliseconds", () => {
  const rate = { numerator: 30000, denominator: 1001 };
  assert.equal(frameToSrt(30, rate), "00:00:01,001");
  assert.equal(frameToSrt(108000, rate), "01:00:03,600");
  assert.equal(frameToSrt(599996, { numerator: 10000, denominator: 1 }), "00:01:00,000");
  assert.throws(() => frameToSrt(1, { numerator: 24, denominator: 0 }), /denominator/);
});

test("delivery rejects gaps, overlaps, invalid ranges, duplicate IDs and wrong copy counts", () => {
  for (const mutate of [
    (p) => { p.shots[1].startFrame += 1; },
    (p) => { p.shots[1].startFrame -= 1; },
    (p) => { p.shots[2].endFrame -= 1; },
    (p) => { p.shots[2].endFrame += 1; },
    (p) => { p.shots[1].endFrame = p.shots[1].startFrame; },
    (p) => { p.shots[1].id = "S1"; },
    (p) => { p.subtitles[0].endFrame = 289; },
    (p) => { p.subtitles.push({ ...p.subtitles[0], id: "VO2" }); },
    (p) => { p.frameRate.numerator = 100000; p.subtitles[0].endFrame = 193; },
  ]) {
    const plan = worksheet();
    mutate(plan);
    const result = checkDelivery(plan);
    assert.equal(result.valid, false);
    assert.equal(result.srt, null);
  }
});

test("delivery rejects unsupported worksheets instead of silently skipping checks", () => {
  for (const mutate of [
    (p) => { p.frameRate.numerator = 23.976; },
    (p) => { p.totalFrames = Number.MAX_SAFE_INTEGER + 1; },
    (p) => { p.shots[0].startFrame = -1; },
    (p) => { p.shots[0].endFrame = 95.5; },
    (p) => { p.transitions = []; },
    (p) => { p.subtitles = {}; },
    (p) => { p.subtitles[0].text = "line\n\nline"; },
    (p) => { p.subtitles[0].expectedHanCharaters = 7; },
  ]) {
    const plan = worksheet();
    mutate(plan);
    assert.throws(() => checkDelivery(plan));
  }
});
