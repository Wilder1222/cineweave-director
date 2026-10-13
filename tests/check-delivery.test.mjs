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

// Added worksheet tests only. These do not verify provider capabilities or generated media.
import videoTest from "node:test";
import videoAssert from "node:assert/strict";
import { spawnSync as cwVideoSpawn } from "node:child_process";
import { mkdtempSync as cwVideoTemp, writeFileSync as cwVideoWrite, readFileSync as cwVideoRead, rmSync as cwVideoRm } from "node:fs";
import { tmpdir as cwVideoTmpdir } from "node:os";
import { join as cwVideoJoin } from "node:path";
import { fileURLToPath as cwVideoPath } from "node:url";
import { FORMAT as CWVF, NODE_TAGS as CWNT, escapeTagText as cwEsc, parseTaggedPrompt as cwParse,
  plainTextPreview as cwPlain, planTiming as cwTime, validateVideoWorkbook as cwCheck }
  from "../skills/cineweave-director/scripts/check-video-plan.mjs";
const cwFps = { numerator: 24, denominator: 1 };
const cwTimeData = () => ({ headFrames: 12, editFrames: 156, tailFrames: 24 });
const cwPolicy = () => ({ status: "fixture", source: "fixture:numerical-policy-not-a-vendor", checkedAt: "2026-09-13", allowedMs: [5000, 10000, 15000] });
function cwPrompt(type = "video_flf", id = "S1") {
  return [...new Set(["节点", "目标", "约束", ...CWNT[type]])].map((tag) => `<${tag}>${tag === "节点" ? id : `${tag}测试描述`}</${tag}>`).join("\n");
}
function cwRef(alias, role, mediaType = "image") {
  return { alias, roles: [role], mediaType, status: "fixture", source: `fixture:${alias}`, version: "v1", transfer: role, exclude: "unassigned roles" };
}
function cwWorkbook() {
  return { format: CWVF, frameRate: cwFps, nodes: [{ id: "S1", type: "video_flf", prompt: cwPrompt(), dependsOn: [],
    references: [cwRef("FIRST", "first_frame"), cwRef("LAST", "last_frame")],
    timing: cwTimeData(), durationPolicy: cwPolicy(), endpointPolicy: "hold_before_cut",
    cameraControl: { owner: "text", active: ["text"] },
    capability: { platform: "fixture", model: "fixture", surface: "fixture", mode: "first_last", status: "fixture", evidence: "fixture", checkedAt: "2026-09-13" },
    cues: [{ id: "MOVE", track: "subject", startFrame: 24, endFrame: 144 }],
  }] };
}
const cwCodes = (r) => r.errors.map((e) => e.code);
function cwMutation(name, mutate, code) { videoTest(name, () => { const b = cwWorkbook(); mutate(b); videoAssert.ok(cwCodes(cwCheck(b)).includes(code)); }); }

videoTest("video timing selects the smallest fitting discrete duration and preserves cut window", () => {
  const r = cwTime(cwTimeData(), cwFps, cwPolicy());
  videoAssert.equal(r.valid, true); videoAssert.equal(r.requiredDurationMs, 8000); videoAssert.equal(r.selectedDurationMs, 10000);
  videoAssert.deepEqual(r.editWindow, [12, 168]); videoAssert.equal(r.plannedFrameCapacity, 240); videoAssert.equal(r.extraTailFrames, 48);
});
videoTest("video timing does not lengthen an exactly fitting clip", () => {
  videoAssert.equal(cwTime({ headFrames: 12, editFrames: 84, tailFrames: 24 }, cwFps, cwPolicy()).selectedDurationMs, 5000);
});
videoTest("video timing refuses a duration ceiling rather than clipping action", () => {
  const r = cwTime({ headFrames: 12, editFrames: 360, tailFrames: 24 }, cwFps, cwPolicy());
  videoAssert.equal(r.valid, false); videoAssert.ok(cwCodes(r).includes("DURATION_NO_FIT")); videoAssert.equal(r.selectedDurationMs, null);
});
videoTest("video timing keeps unknown duration policy unresolved", () => {
  const r = cwTime(cwTimeData(), cwFps, { status: "unknown" }); videoAssert.equal(r.valid, true); videoAssert.equal(r.selectedDurationMs, null);
});
videoTest("video timing handles a stepped range without assuming continuous support", () => {
  const p = { status: "fixture", source: "fixture", checkedAt: "2026-09-13", rangeMs: { min: 4000, max: 15000, step: 2000 } };
  videoAssert.equal(cwTime({ headFrames: 12, editFrames: 160, tailFrames: 24 }, cwFps, p).selectedDurationMs, 10000);
});
videoTest("video timing uses exact 30000/1001 arithmetic instead of rounded fps", () => {
  const r = cwTime({ headFrames: 0, editFrames: 300, tailFrames: 0 }, { numerator: 30000, denominator: 1001 }, cwPolicy());
  videoAssert.equal(r.requiredDurationMs, 10010); videoAssert.equal(r.selectedDurationMs, 15000); videoAssert.equal(r.plannedFrameCapacity, 449);
});
videoTest("video timing flags excessive rounding residue", () => {
  videoAssert.ok(cwTime({ headFrames: 0, editFrames: 1, tailFrames: 0 }, cwFps, cwPolicy()).warnings.some((e) => e.code === "LARGE_PADDING"));
});
for (const [name, timing, fps, policy, code] of [
  ["negative handle", { headFrames: -1, editFrames: 24, tailFrames: 0 }, cwFps, cwPolicy(), "TIMING_FIELDS"],
  ["zero effective duration", { headFrames: 0, editFrames: 0, tailFrames: 0 }, cwFps, cwPolicy(), "TIMING_FIELDS"],
  ["fractional frames", { headFrames: 0, editFrames: 24.5, tailFrames: 0 }, cwFps, cwPolicy(), "TIMING_FIELDS"],
  ["rounded floating frame rate", cwTimeData(), { numerator: 29.97, denominator: 1 }, cwPolicy(), "FRAME_RATE"],
  ["duplicate duration choices", cwTimeData(), cwFps, { ...cwPolicy(), allowedMs: [5000, 5000] }, "DURATION_POLICY"],
  ["conflicting duration definitions", cwTimeData(), cwFps, { ...cwPolicy(), rangeMs: { min: 1000, max: 2000, step: 1000 } }, "DURATION_POLICY"],
  ["missing evidence declaration", cwTimeData(), cwFps, { status: "documented", allowedMs: [10000] }, "DURATION_EVIDENCE"],
  ["unsafe arithmetic output", { headFrames: Number.MAX_SAFE_INTEGER, editFrames: Number.MAX_SAFE_INTEGER, tailFrames: 1 }, cwFps, cwPolicy(), "ARITHMETIC_RANGE"],
]) videoTest(`video timing rejects ${name}`, () => videoAssert.ok(cwCodes(cwTime(timing, fps, policy)).includes(code)));
videoTest("tag parser preserves exact spoken punctuation and escaped literal tag characters", () => {
  const s = "别念<运镜>，也别改 A&B。"; videoAssert.equal(cwParse(`<台词>${cwEsc(s)}</台词>`).values["台词"], s);
});
for (const [name, p, code] of [
  ["missing closing tag", "<运镜>推进", "TAG_SYNTAX"],
  ["unwrapped prose", "extra<运镜>推进</运镜>", "TAG_SYNTAX"],
  ["mismatched tags", "<运镜>推进</表情>", "TAG_SYNTAX"],
  ["nested tags", "<运镜><情绪>安静</情绪></运镜>", "TAG_SYNTAX"],
  ["duplicate tags", "<运镜>推进</运镜><运镜>后退</运镜>", "DUPLICATE_TAG"],
  ["unknown label", "<运镜强度99>99</运镜强度99>", "UNKNOWN_TAG"],
  ["empty tag", "<运镜> </运镜>", "EMPTY_TAG"],
  ["unescaped ampersand", "<台词>A&B</台词>", "TAG_ESCAPE"],
]) videoTest(`tag parser rejects ${name}`, () => videoAssert.ok(cwParse(p).errors.some((e) => e.code === code)));
videoTest("plain text preview retains all labels and never claims to be a provider payload", () => {
  videoAssert.equal(cwPlain("<台词>一句话。</台词><剪辑余量>一秒。</剪辑余量>"), "台词：一句话。\n剪辑余量：一秒。");
});
videoTest("all 18 node types have explicit tag requirements", () => videoAssert.equal(Object.keys(CWNT).length, 18));
videoTest("fixture workbook validates structure while remaining unverified", () => {
  const r = cwCheck(cwWorkbook()); videoAssert.equal(r.valid, true); videoAssert.equal(r.declarationComplete, false);
  videoAssert.equal(r.capabilityVerified, false); videoAssert.equal(r.mediaVerified, false); videoAssert.equal(r.providerExecution, false);
});
videoTest("checking a workbook does not mutate it", () => { const b = cwWorkbook(), before = JSON.stringify(b); cwCheck(b); videoAssert.equal(JSON.stringify(b), before); });
cwMutation("reject missing type-specific tag", (b) => { b.nodes[0].prompt = b.nodes[0].prompt.replace(/<运镜>.*?<\/运镜>/u, ""); }, "MISSING_TAG");
cwMutation("reject mismatched visible node id", (b) => { b.nodes[0].prompt = b.nodes[0].prompt.replace("<节点>S1</节点>", "<节点>S2</节点>"); }, "NODE_LABEL");
cwMutation("reject duplicate node ids", (b) => { b.nodes.push(structuredClone(b.nodes[0])); }, "DUPLICATE_NODE");
cwMutation("reject nonexistent dependency", (b) => { b.nodes[0].dependsOn = ["ghost"]; }, "MISSING_DEPENDENCY");
cwMutation("reject dependency cycles", (b) => { b.nodes[0].dependsOn = ["S1"]; }, "DEPENDENCY_CYCLE");
cwMutation("reject absent last-frame role", (b) => { b.nodes[0].references.pop(); }, "MISSING_REFERENCE_ROLE");
cwMutation("reject duplicate reference alias", (b) => { b.nodes[0].references[1].alias = "FIRST"; }, "DUPLICATE_ALIAS");
cwMutation("reject two competing first-frame bindings", (b) => { b.nodes[0].references.push(cwRef("OTHER", "first_frame")); }, "CONFLICTING_ANCHORS");
cwMutation("reject a video in a first-frame image slot", (b) => { b.nodes[0].references[0].mediaType = "video"; }, "FRAME_MEDIA");
videoTest("voice role requires audio or an explicitly scoped video audio track, not an image", () => {
  const b = cwWorkbook(); b.nodes[0].references.push(cwRef("VOICE", "voice"));
  videoAssert.ok(cwCodes(cwCheck(b)).includes("AUDIO_MEDIA"));
  const last = b.nodes[0].references.at(-1); last.mediaType = "video";
  videoAssert.ok(cwCodes(cwCheck(b)).includes("AUDIO_MEDIA"));
  last.useAudioTrack = true;
  videoAssert.equal(cwCheck(b).valid, true);
});
cwMutation("reject omitted reference transfer exclusions", (b) => { delete b.nodes[0].references[0].exclude; }, "REFERENCE_SCOPE");
cwMutation("reject explicitly unsupported mode", (b) => { b.nodes[0].capability.status = "unsupported"; }, "UNSUPPORTED_MODE");
cwMutation("reject opposing camera control channels", (b) => { b.nodes[0].cameraControl.active.push("ui"); }, "CAMERA_CONTROL_CONFLICT");
cwMutation("reject a terminal-only last frame with a disposable tail", (b) => { delete b.nodes[0].endpointPolicy; }, "ENDPOINT_HANDLE_CONFLICT");
cwMutation("reject critical action outside the usable edit", (b) => { b.nodes[0].cues[0].endFrame = 180; }, "CUE_OUTSIDE_EDIT");
cwMutation("reject a cue extending beyond the generated capacity", (b) => { b.nodes[0].cues[0].endFrame = 260; b.nodes[0].cues[0].allowHandle = true; }, "CUE_OUTSIDE_GENERATION");
function cwSpeech(b) {
  const text = "这盏灯，你拿着。";
  b.nodes[0].prompt += `\n<台词>甲：${text}</台词>`;
  b.nodes[0].cues.push({ id: "D1", track: "dialogue", speaker: "A", text, authoritativeText: text, delivery: "on_screen", lipSyncRequired: true, startFrame: 24, endFrame: 96 });
}
videoTest("exact dialogue is accepted without pretending its duration was measured", () => {
  const b = cwWorkbook(); cwSpeech(b); const r = cwCheck(b); videoAssert.equal(r.valid, true); videoAssert.ok(r.warnings.some((e) => e.code === "SPEECH_TIMING_UNVERIFIED"));
});
cwMutation("reject silently rewritten dialogue", (b) => { cwSpeech(b); b.nodes[0].cues[1].text = "你拿着灯。"; }, "DIALOGUE_CHANGED");
cwMutation("reject dialogue that is absent from its tagged master", (b) => { cwSpeech(b); b.nodes[0].prompt = b.nodes[0].prompt.replace(/\n<台词>.*<\/台词>/u, ""); }, "DIALOGUE_TAG");
cwMutation("reject overlapping turns from the same speaker without declared permission", (b) => { cwSpeech(b); b.nodes[0].cues.push({ ...b.nodes[0].cues[1], id: "D2", startFrame: 60, endFrame: 110 }); }, "SPEAKER_OVERLAP");
cwMutation("reject canonical-contract impersonation", (b) => { b.kind = "cineweave_codex_image_prompt"; }, "NONCANONICAL");
videoTest("unknown platform surface remains pending rather than failing independent draft arithmetic", () => {
  const b = cwWorkbook(); delete b.nodes[0].capability; const r = cwCheck(b); videoAssert.equal(r.valid, true); videoAssert.ok(r.pending.some((e) => e.code === "CAPABILITY_SCOPE"));
});
videoTest("video helper CLI works with its bundled parser and writes no worksheet", () => {
  const dir = cwVideoTemp(cwVideoJoin(cwVideoTmpdir(), "cw-video-"));
  try {
    const cli = cwVideoJoin(dir, "check-video-plan.mjs"), input = cwVideoJoin(dir, "input.json");
    cwVideoWrite(cli, cwVideoRead(cwVideoPath(new URL("../skills/cineweave-director/scripts/check-video-plan.mjs", import.meta.url))));
    cwVideoWrite(cwVideoJoin(dir, "parse-json.mjs"), cwVideoRead(cwVideoPath(new URL("../skills/cineweave-director/scripts/parse-json.mjs", import.meta.url))));
    cwVideoWrite(cwVideoJoin(dir, "check-audio-returns.mjs"), cwVideoRead(cwVideoPath(new URL("../skills/cineweave-director/scripts/check-audio-returns.mjs", import.meta.url))));
    const before = JSON.stringify(cwWorkbook()); cwVideoWrite(input, before);
    const p = cwVideoSpawn(process.execPath, [cli, input], { encoding: "utf8" });
    videoAssert.equal(p.status, 0, p.stderr); videoAssert.equal(JSON.parse(p.stdout).valid, true); videoAssert.equal(cwVideoRead(input, "utf8"), before);
    const broken = cwWorkbook(); delete broken.nodes[0].endpointPolicy; cwVideoWrite(input, JSON.stringify(broken));
    videoAssert.equal(cwVideoSpawn(process.execPath, [cli, input]).status, 1);
    cwVideoWrite(input, "{bad json"); videoAssert.equal(cwVideoSpawn(process.execPath, [cli, input]).status, 1);
  } finally { cwVideoRm(dir, { recursive: true, force: true }); }
});

function cwScope(b) { const { platform, model, surface, mode } = b.nodes[0].capability; return { platform, model, surface, mode }; }
cwMutation("reject a duration policy retained from a different model", (b) => { b.nodes[0].durationPolicy.scope = { ...cwScope(b), model: "older-model" }; }, "DURATION_SCOPE_MISMATCH");
cwMutation("reject reference limits copied from a different generation mode", (b) => { b.nodes[0].referenceLimits = { status: "fixture", source: "fixture", checkedAt: "2026-09-13", scope: { ...cwScope(b), mode: "multimodal" }, caps: { total: 10 } }; }, "REFERENCE_SCOPE_MISMATCH");
cwMutation("reject reference count above the selected declaration", (b) => { b.nodes[0].referenceLimits = { status: "fixture", source: "fixture", checkedAt: "2026-09-13", scope: cwScope(b), caps: { image: 1, total: 2 } }; }, "REFERENCE_LIMIT_EXCEEDED");
cwMutation("reject malformed negative reference caps", (b) => { b.nodes[0].referenceLimits = { status: "fixture", source: "fixture", checkedAt: "2026-09-13", scope: cwScope(b), caps: { image: -1 } }; }, "REFERENCE_LIMITS");
videoTest("a missing duration-policy scope stays pending", () => { const r = cwCheck(cwWorkbook()); videoAssert.ok(r.pending.some((e) => e.code === "DURATION_SCOPE")); });
videoTest("matching policy scopes and sufficient caps do not claim external verification", () => {
  const b = cwWorkbook(); b.nodes[0].durationPolicy.scope = cwScope(b);
  b.nodes[0].referenceLimits = { status: "fixture", source: "fixture", checkedAt: "2026-09-13", scope: cwScope(b), caps: { image: 2, total: 2 } };
  const r = cwCheck(b); videoAssert.equal(r.valid, true); videoAssert.equal(r.capabilityVerified, false);
});

videoTest("详细创作示例可解析并在纯文本预览中完整保留每项内容", () => {
  const doc = cwVideoRead(new URL("../skills/cineweave-director/references/optional/prompt-detail-standard.md", import.meta.url), "utf8");
  const sections = [...doc.matchAll(/^### 分镜调度与视频复制稿\n([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gmu)];
  videoAssert.equal(sections.length, 1, "视频示例章节必须唯一，不能误读静态人物提示词");
  const blocks = [...sections[0][1].matchAll(/```text\n([\s\S]*?)```/gu)].map(m => m[1].trim());
  videoAssert.equal(blocks.length, 1);
  const parsed = cwParse(blocks[0]);
  videoAssert.deepEqual(parsed.errors, []);
  for (const tag of ["节点", "目标", "约束", ...CWNT.video_i2v]) videoAssert.ok(parsed.values[tag], tag);
  const preview = cwPlain(blocks[0]);
  for (const value of Object.values(parsed.values)) videoAssert.ok(preview.includes(value));
  const timing = cwTime({ headFrames: 12, editFrames: 144, tailFrames: 24 }, cwFps);
  videoAssert.equal(timing.requiredFrames, 180);
  videoAssert.equal(timing.requiredDurationMs, 7500);
  videoAssert.deepEqual(timing.editWindow, [12, 156]);
  videoAssert.equal(timing.capabilityVerified, false);
});

function cwTextVideo() {
  const b = cwWorkbook(), n = b.nodes[0];
  n.type = "video_t2v"; n.prompt = cwPrompt("video_t2v");
  delete n.references; delete n.endpointPolicy;
  n.capability.mode = "t2v";
  return b;
}
videoTest("文生视频无需伪造参考图且保留时长与未核验能力状态", () => {
  const r = cwCheck(cwTextVideo());
  videoAssert.equal(r.valid, true);
  videoAssert.equal(r.nodes[0].timing.requiredDurationMs, 8000);
  videoAssert.equal(r.capabilityVerified, false);
  videoAssert.ok(r.pending.some(e => e.code === "MODE_UNKNOWN"));
});
videoTest("文生视频仍拒绝缺失时长和越界动作", () => {
  const b = cwTextVideo(); delete b.nodes[0].timing;
  videoAssert.ok(cwCodes(cwCheck(b)).includes("TIMING_FIELDS"));
  const c = cwTextVideo(); c.nodes[0].cues[0].endFrame = 180;
  videoAssert.ok(cwCodes(cwCheck(c)).includes("CUE_OUTSIDE_EDIT"));
});
videoTest("文生视频不能隐含媒体绑定或绕过摄影机控制冲突", () => {
  const b = cwTextVideo(); b.nodes[0].references = [cwRef("F", "first_frame")];
  videoAssert.ok(cwCodes(cwCheck(b)).includes("T2V_REFERENCE_MODE"));
  const c = cwTextVideo(); c.nodes[0].cameraControl.active.push("ui");
  videoAssert.ok(cwCodes(cwCheck(c)).includes("CAMERA_CONTROL_CONFLICT"));
});
videoTest("无参考图的放宽不影响图生视频的首帧要求", () => {
  const b = cwTextVideo(); b.nodes[0].type = "video_i2v";
  b.nodes[0].prompt = cwPrompt("video_i2v"); b.nodes[0].capability.mode = "i2v";
  const codes = cwCodes(cwCheck(b));
  videoAssert.ok(codes.includes("MISSING_REFERENCE"));
  videoAssert.ok(codes.includes("MISSING_REFERENCE_ROLE"));
});

function cwFullFilm() {
  const doc = cwVideoRead(new URL("../skills/cineweave-director/references/optional/short-film-example.md", import.meta.url), "utf8");
  const section = doc.split("<!-- short-film-plan:start -->")[1]?.split("<!-- short-film-plan:end -->")[0];
  const match = section?.match(/```json\s*\n([\s\S]*?)\n```/u);
  videoAssert.ok(match, "the example must expose its actual plan");
  const copy = new Map([...doc.matchAll(/^### ([A-Z0-9-]+)\n([\s\S]*?)(?=^#{1,3} |$(?![\s\S]))/gmu)].map(m => [m[1], m[2].trim()]));
  return { plan: JSON.parse(match[1]), copy };
}
videoTest("完整短片的每项资产和镜头都能找到独立正文", () => {
  const { plan, copy } = cwFullFilm();
  videoAssert.equal(plan.shots.length, 4);
  videoAssert.equal(new Set(plan.assets).size, plan.assets.length);
  const usedPrompts = new Set();
  for (const asset of plan.assets) videoAssert.ok(copy.get(asset), asset);
  for (const shot of plan.shots) {
    for (const kind of ["image", "video", "sound"]) {
      videoAssert.ok(copy.get(shot[kind]), `${shot.id}: missing ${kind}`);
      videoAssert.ok(!usedPrompts.has(shot[kind]), "shots must not share a placeholder instead of their own copy");
      usedPrompts.add(shot[kind]);
    }
    for (const asset of shot.assets) videoAssert.ok(plan.assets.includes(asset), `${shot.id}: ${asset}`);
  }
});
videoTest("完整短片的源对白、准确文本、字幕和成片时轴相互对应", () => {
  const { plan, copy } = cwFullFilm();
  const delivery = checkDelivery({ frameRate: plan.frameRate, totalFrames: plan.totalFrames,
    shots: plan.shots.map(({ id, startFrame, endFrame }) => ({ id, startFrame, endFrame })), subtitles: plan.subtitles });
  videoAssert.equal(delivery.valid, true);
  videoAssert.equal(delivery.endTimecode, "00:00:24,000");
  const timing = cwTime(plan.timing, plan.frameRate);
  videoAssert.equal(timing.requiredDurationMs, 7500);
  videoAssert.deepEqual(timing.editWindow, [12, 156]);
  for (const shot of plan.shots) videoAssert.equal(shot.endFrame - shot.startFrame, plan.timing.editFrames);
  for (const cue of plan.dialogue) {
    const shot = plan.shots.find(s => s.id === cue.shot), sub = plan.subtitles.find(s => s.id === cue.id);
    videoAssert.ok(shot && sub);
    videoAssert.ok(copy.get(cue.voice));
    videoAssert.equal(copy.get(cue.copy), cue.text);
    videoAssert.equal(sub.text, cue.text);
    videoAssert.ok(cue.startFrame >= timing.editWindow[0] && cue.endFrame <= timing.editWindow[1]);
    videoAssert.ok(cue.startFrame < cue.endFrame);
    videoAssert.equal(sub.startFrame, shot.startFrame + cue.startFrame - timing.editWindow[0]);
    videoAssert.equal(sub.endFrame, shot.startFrame + cue.endFrame - timing.editWindow[0]);
    videoAssert.ok(copy.get(shot.video).includes(cue.text));
  }
});

function cwBoardVideo() {
  const b = cwWorkbook(), n = b.nodes[0];
  n.type = "video_reference"; n.prompt = cwPrompt("video_reference");
  n.references = [cwRef("BOARD", "storyboard")];
  n.references[0].transfer = "左、中、右格分别对应 S01、S02、S03；按顺序全画幅呈现";
  n.references[0].exclude = "边框、编号和分格布局不进入成片";
  n.capability.mode = "multimodal";
  delete n.endpointPolicy;
  return b;
}
videoTest("整板参考视频无需首尾帧且不冒充平台与媒体已核验", () => {
  const b = cwBoardVideo(), r = cwCheck(b);
  videoAssert.equal(r.valid, true);
  videoAssert.equal(r.capabilityVerified, false);
  videoAssert.equal(r.mediaVerified, false);
  videoAssert.deepEqual(b.nodes[0].references[0].roles, ["storyboard"]);
  videoAssert.ok(r.pending.some(e => e.code === "REFERENCE_LIMITS_UNKNOWN"));
});
videoTest("分镜参考板角色拒绝非图像媒体", () => {
  for (const media of ["audio", "video"]) {
    const b = cwBoardVideo(); b.nodes[0].references[0].mediaType = media;
    videoAssert.ok(cwCodes(cwCheck(b)).includes("STORYBOARD_MEDIA"));
  }
});
videoTest("分镜板不冒充图生视频首帧或绕过模式参考要求", () => {
  const b = cwBoardVideo(); b.nodes[0].type = "video_i2v";
  b.nodes[0].prompt = cwPrompt("video_i2v"); b.nodes[0].capability.mode = "i2v";
  videoAssert.ok(cwCodes(cwCheck(b)).includes("MISSING_REFERENCE_ROLE"));
  const c = cwBoardVideo(); c.nodes[0].references = [];
  videoAssert.ok(cwCodes(cwCheck(c)).includes("MISSING_REFERENCE"));
});
