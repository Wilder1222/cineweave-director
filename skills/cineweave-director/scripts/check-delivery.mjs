#!/usr/bin/env node

// Pure planning checks; no provider calls, media probing, or file writes.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });

export function countText(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  return {
    codePoints: [...text].length,
    graphemes: [...segmenter.segment(text)].length,
    hanCharacters: (text.match(/\p{Script=Han}/gu) ?? []).length,
  };
}

function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new TypeError(`${label} must be a safe integer >= ${minimum}`);
}

function rate(frameRate) {
  integer(frameRate?.numerator, "frameRate.numerator", 1);
  integer(frameRate?.denominator, "frameRate.denominator", 1);
}

export function frameToSrt(frame, frameRate) {
  integer(frame, "frame");
  rate(frameRate);
  // Round each absolute boundary once. Never accumulate rounded clip durations.
  const divisor = BigInt(frameRate.numerator);
  const scaled = BigInt(frame) * BigInt(frameRate.denominator) * 1000n;
  const milliseconds = (scaled * 2n + divisor) / (divisor * 2n);
  const pad = (value, size = 2) => String(value).padStart(size, "0");
  return `${pad(milliseconds / 3600000n)}:${pad(milliseconds / 60000n % 60n)}:${pad(milliseconds / 1000n % 60n)},${pad(milliseconds % 1000n, 3)}`;
}

function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new TypeError(`${label}.${key} is not supported`);
}

export function checkDelivery(plan) {
  object(plan, "worksheet", ["frameRate", "totalFrames", "shots", "subtitles"]);
  object(plan.frameRate, "frameRate", ["numerator", "denominator"]);
  rate(plan.frameRate);
  integer(plan.totalFrames, "totalFrames", 1);
  if (!Array.isArray(plan.shots) || !plan.shots.length) throw new TypeError("shots must be a non-empty array");
  if (plan.subtitles !== undefined && !Array.isArray(plan.subtitles)) throw new TypeError("subtitles must be an array");
  const errors = [];
  const ids = new Set();
  const validateRange = (entry, label) => {
    if (typeof entry.id !== "string" || !entry.id.trim()) throw new TypeError(`${label}.id must be non-empty`);
    if (ids.has(entry.id)) errors.push(`${label}: duplicate id ${entry.id}`);
    ids.add(entry.id);
    integer(entry.startFrame, `${label}.startFrame`);
    integer(entry.endFrame, `${label}.endFrame`);
    if (entry.startFrame >= entry.endFrame) errors.push(`${label}: range must have positive duration`);
    if (entry.endFrame > plan.totalFrames) errors.push(`${label}: range exceeds totalFrames`);
  };
  let nextFrame = 0;
  for (const [i, shot] of plan.shots.entries()) {
    object(shot, `shots[${i}]`, ["id", "startFrame", "endFrame"]);
    validateRange(shot, `shots[${i}]`);
    if (shot.startFrame !== nextFrame) errors.push(`shots[${i}]: gap, overlap or out-of-order cut; expected startFrame ${nextFrame}`);
    nextFrame = shot.endFrame;
  }
  if (nextFrame !== plan.totalFrames) errors.push("shots must cover [0, totalFrames) exactly");
  const subtitles = [];
  let previousEnd = 0;
  for (const [i, cue] of (plan.subtitles ?? []).entries()) {
    object(cue, `subtitles[${i}]`, ["id", "startFrame", "endFrame", "text", "expectedHanCharacters"]);
    validateRange(cue, `subtitles[${i}]`);
    if (typeof cue.text !== "string" || !cue.text.trim() || /\r?\n[ \t]*\r?\n/u.test(cue.text)) throw new TypeError(`subtitles[${i}].text must be non-empty without blank cue separators`);
    if (cue.startFrame < previousEnd) errors.push(`subtitles[${i}]: overlapping or out-of-order cues in this single subtitle track`);
    previousEnd = cue.endFrame;
    const counts = countText(cue.text);
    if (cue.expectedHanCharacters !== undefined) {
      integer(cue.expectedHanCharacters, `subtitles[${i}].expectedHanCharacters`);
      if (cue.expectedHanCharacters !== counts.hanCharacters) errors.push(`subtitles[${i}]: expected ${cue.expectedHanCharacters} Han characters, found ${counts.hanCharacters}`);
    }
    const start = frameToSrt(cue.startFrame, plan.frameRate);
    const end = frameToSrt(cue.endFrame, plan.frameRate);
    if (start === end) errors.push(`subtitles[${i}]: duration collapses at SRT millisecond precision`);
    subtitles.push({ id: cue.id, text: cue.text, start, end, counts });
  }
  return {
    valid: errors.length === 0,
    errors,
    duration: { numerator: (BigInt(plan.totalFrames) * BigInt(plan.frameRate.denominator)).toString(), denominator: String(plan.frameRate.numerator) },
    endTimecode: frameToSrt(plan.totalFrames, plan.frameRate),
    subtitles,
    srt: errors.length ? null : subtitles.map((cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}\n`).join("\n"),
    scope: "Planning arithmetic only: cut-only shot coverage and one subtitle track. Text counts do not establish speech duration, readability, synchronization, rights, or media quality.",
  };
}

async function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    console.log("Usage: node check-delivery.mjs worksheet.json | --text <exact text>\nRead-only planning helper; see references/optional/video-sound-and-delivery.md.");
    return;
  }
  if (args.length === 2 && args[0] === "--text") {
    console.log(JSON.stringify(countText(args[1]), null, 2));
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Usage: node check-delivery.mjs worksheet.json | --text <exact text>");
  const result = checkDelivery(JSON.parse(await readFile(args[0], "utf8")));
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
