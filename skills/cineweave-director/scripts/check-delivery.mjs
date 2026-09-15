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
    console.log("用法：node check-delivery.mjs worksheet.json | --text <准确文本>\n只读交付算术工具；参见 references/optional/video-sound-and-delivery.md。");
    return;
  }
  if (args.length === 2 && args[0] === "--text") {
    const counts = countText(args[1]);
    console.log(JSON.stringify({ ...counts, localization: { locale: "zh-CN", hanCharacters: "汉字", codePoints: "Unicode 码点", graphemes: "可见字素簇", summary: "文字计数不是实际语音时长。" } }, null, 2));
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Usage: node check-delivery.mjs worksheet.json | --text <exact text>");
  const result = checkDelivery(JSON.parse(await readFile(args[0], "utf8")));
  console.log(JSON.stringify(withChineseDeliverySummary(result), null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error("无法完成交付检查，请核对参数、文件和 JSON 内容。原始原因：" + error.message);
    process.exitCode = 1;
  });
}


/** 中文命令行摘要只作展示，原始字段与错误字符串保持兼容。 */
export function withChineseDeliverySummary(result) {
  const explain = (message) => {
    if (message.includes("Han characters")) return "台词汉字数量与预期不一致；原始数量见 detail。";
    if (/gap|overlap|out-of-order/.test(message)) return "存在时间缺口、重叠或顺序错误；检查镜头／字幕边界。";
    if (/duplicate id/.test(message)) return "条目标识符重复。";
    if (/positive duration/.test(message)) return "时间区间必须有正时长。";
    if (/exceeds totalFrames/.test(message)) return "区间超出成片总帧数。";
    if (/cover/.test(message)) return "镜头必须完整且连续覆盖成片区间。";
    if (/millisecond precision/.test(message)) return "字幕时间在毫秒舍入后塌缩为零。";
    return "交付工作表检查失败，请核对原始细节。";
  };
  return { ...result, localization: {
    locale: "zh-CN",
    summary: result.valid ? "剪辑覆盖与字幕算术检查通过，实际声音及画面同步仍未核验。" : "检查未通过，不应使用当前 SRT。",
    errors: result.errors.map((detail) => ({ message: explain(detail), detail })),
    scope: "仅检查硬切镜头覆盖、单字幕轨和文字计数；字数不等于口播时长，不证明可读性、同步、权利或媒体质量。",
  } };
}
