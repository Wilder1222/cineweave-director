#!/usr/bin/env node
/** 只读检查非规范视频工作表，不联网、不处理媒体、不调用供应商。 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FORMAT = "cineweave-video-workbook/v1";
export const NODE_TAGS = Object.freeze({
  brief: ["项目", "目标", "约束"],
  storyboard: ["分镜", "时间线", "衔接"],
  character_image: ["主体", "外观", "构图", "光线", "质感"],
  scene_image: ["场景", "空间", "构图", "光线", "材质"],
  prop_image: ["主体", "形制", "材质", "构图", "光线"],
  reference_map: ["参考", "排除"],
  first_frame: ["参考", "首帧", "构图", "光线"],
  last_frame: ["参考", "尾帧", "构图", "光线"],
  video_t2v: ["起态", "动作", "运镜", "终态", "时长", "剪辑余量"],
  video_i2v: ["参考", "首帧", "动作", "运镜", "终态", "时长", "剪辑余量"],
  video_flf: ["参考", "首帧", "尾帧", "动作", "运镜", "时长", "剪辑余量"],
  video_reference: ["参考", "起态", "动作", "运镜", "终态", "时长", "剪辑余量"],
  video_extend: ["参考", "延长边界", "动作", "运镜", "终态", "时长", "剪辑余量"],
  video_edit: ["参考", "修改范围", "保留", "验收"],
  dialogue: ["台词", "声线", "语气", "情绪", "时间线"],
  sound: ["音效", "空间", "时间线"],
  edit: ["时间线", "衔接", "字幕"],
  review: ["证据", "验收"],
});
const COMMON = ["节点", "目标", "约束"];
export const TAGS = new Set([...COMMON, ...Object.values(NODE_TAGS).flat(),
  "情绪", "表情", "眼神", "表演", "特效", "环境", "声音", "对白", "台词",
  "声线", "语气", "节奏", "字幕", "平台", "模式", "景别", "焦点", "身份",
  "服装", "发型", "妆容", "画幅", "排除", "保留", "验收", "版本"]);
export const ROLES = new Set(["identity", "appearance", "costume", "scene", "prop", "style",
  "first_frame", "last_frame", "storyboard", "performance", "camera", "voice", "audio_timing", "vfx", "source_clip"]);
const VIDEO_MODES = Object.freeze({ video_t2v: "t2v", video_i2v: "i2v", video_flf: "first_last",
  video_reference: "multimodal", video_extend: "extend", video_edit: "video_edit" });
const TRACKS = new Set(["subject", "camera", "focus", "environment", "light", "vfx", "dialogue", "sound", "edit"]);
const issue = (code, message, nodeId = null) => ({ code, message, nodeId });
const own = (x, k) => Object.hasOwn(x, k);
const plain = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const text = (x) => typeof x === "string" && x.trim().length > 0;
const integer = (x, positive = false) => Number.isSafeInteger(x) && (positive ? x > 0 : x >= 0);
const sumSafe = (numbers) => numbers.reduce((a, b) => a + BigInt(b), 0n);
function safeNumber(n) {
  if (n > BigInt(Number.MAX_SAFE_INTEGER) || n < 0n) throw new Error("Arithmetic result is outside the safe integer range");
  return Number(n);
}
const ceilDiv = (a, b) => (a + b - 1n) / b;
export function escapeTagText(s) {
  if (typeof s !== "string") throw new TypeError("Tag text must be a string");
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
function decode(s) { return s.replace(/&(amp|lt|gt);/gu, (_, e) => ({ amp: "&", lt: "<", gt: ">" }[e])); }
export function parseTaggedPrompt(prompt) {
  const errors = [], values = Object.create(null);
  if (!text(prompt)) return { values, errors: [issue("EMPTY_PROMPT", "A tagged prompt is required")] };
  const pattern = /<([^<>\s/]+)>([^<>]*)<\/\1>/gu;
  let cursor = 0, match;
  while ((match = pattern.exec(prompt)) !== null) {
    if (prompt.slice(cursor, match.index).trim()) errors.push(issue("TAG_SYNTAX", "Unwrapped text, nested tags, or mismatched tag pairs"));
    const [, tag, body] = match;
    if (!TAGS.has(tag)) errors.push(issue("UNKNOWN_TAG", `Unknown worksheet tag: ${tag}`));
    if (own(values, tag)) errors.push(issue("DUPLICATE_TAG", `Repeated tag: ${tag}; combine its entries in one block`));
    if (!body.trim()) errors.push(issue("EMPTY_TAG", `Empty tag: ${tag}`));
    if (/&(?!amp;|lt;|gt;)/u.test(body)) errors.push(issue("TAG_ESCAPE", `Escape literal ampersands in ${tag}`));
    values[tag] = decode(body);
    cursor = pattern.lastIndex;
  }
  if (prompt.slice(cursor).trim()) errors.push(issue("TAG_SYNTAX", "Unwrapped or malformed trailing text"));
  return { values, errors };
}
/** 保留所有标签内容的审阅预览，不是供应商载荷。 */
export function plainTextPreview(prompt) {
  const parsed = parseTaggedPrompt(prompt);
  if (parsed.errors.length) throw new Error(parsed.errors.map((e) => e.code).join(", "));
  return Object.entries(parsed.values).map(([k, v]) => `${k}：${v}`).join("\n");
}
/** 输入区间使用声明的有理数时基与左闭右开帧边界。 */
export function planTiming(timing, frameRate, durationPolicy = null) {
  const errors = [], warnings = [];
  if (!plain(frameRate) || !integer(frameRate.numerator, true) || !integer(frameRate.denominator, true))
    return { valid: false, errors: [issue("FRAME_RATE", "Use positive integer numerator/denominator")], warnings };
  if (!plain(timing) || !["editFrames", "headFrames", "tailFrames"].every((k) => integer(timing[k], k === "editFrames")))
    return { valid: false, errors: [issue("TIMING_FIELDS", "Positive editFrames and nonnegative integer headFrames/tailFrames are required")], warnings };
  try {
    const n = BigInt(frameRate.numerator), d = BigInt(frameRate.denominator);
    const required = sumSafe([timing.headFrames, timing.editFrames, timing.tailFrames]);
    const requiredFrames = safeNumber(required);
    const requiredDurationMs = safeNumber(ceilDiv(required * d * 1000n, n));
    const result = { valid: true, errors, warnings, requiredFrames, requiredDurationMs,
      editWindow: [timing.headFrames, safeNumber(sumSafe([timing.headFrames, timing.editFrames]))],
      selectedDurationMs: null, plannedFrameCapacity: null, extraTailFrames: null,
      durationSelection: "unresolved", capabilityVerified: false };
    if (durationPolicy === null || durationPolicy === undefined || durationPolicy.status === "unknown") {
      warnings.push(issue("DURATION_UNKNOWN", "Supply the selected model/surface duration policy; no duration was invented"));
      return result;
    }
    if (!plain(durationPolicy) || !["documented", "user_supplied", "fixture"].includes(durationPolicy.status)) {
      errors.push(issue("DURATION_POLICY", "Invalid duration-policy declaration")); return { ...result, valid: false };
    }
    if (!text(durationPolicy.source) || !/^\d{4}-\d{2}-\d{2}$/u.test(durationPolicy.checkedAt ?? "")) {
      errors.push(issue("DURATION_EVIDENCE", "A source and dated check declaration are required")); return { ...result, valid: false };
    }
    const hasList = own(durationPolicy, "allowedMs"), hasRange = own(durationPolicy, "rangeMs");
    if (hasList === hasRange) {
      errors.push(issue("DURATION_POLICY", "Supply exactly one of allowedMs or rangeMs")); return { ...result, valid: false };
    }
    let selected = null;
    if (hasList) {
      const list = durationPolicy.allowedMs;
      if (!Array.isArray(list) || !list.length || !list.every((v) => integer(v, true)) || new Set(list).size !== list.length) {
        errors.push(issue("DURATION_POLICY", "allowedMs must contain unique positive integer milliseconds"));
        return { ...result, valid: false };
      }
      selected = [...list].sort((a, b) => a - b).find((v) => BigInt(v) * n >= required * d * 1000n) ?? null;
    } else {
      const r = durationPolicy.rangeMs;
      if (!plain(r) || !["min", "max", "step"].every((k) => integer(r[k], true)) || r.max < r.min) {
        errors.push(issue("DURATION_POLICY", "rangeMs needs positive min/max/step and max >= min"));
        return { ...result, valid: false };
      }
      const base = BigInt(r.min), step = BigInt(r.step), need = BigInt(requiredDurationMs);
      const candidate = base + (need <= base ? 0n : ceilDiv(need - base, step)) * step;
      if (candidate <= BigInt(r.max)) selected = safeNumber(candidate);
    }
    if (selected === null) {
      errors.push(issue("DURATION_NO_FIT", "No supported duration contains the required handles and edit window; do not clamp or speed up dialogue"));
      return { ...result, valid: false, durationSelection: "no_fit" };
    }
    const capacity = safeNumber(BigInt(selected) * n / (d * 1000n));
    const extra = capacity - requiredFrames;
    if (extra > timing.editFrames / 2) warnings.push(issue("LARGE_PADDING", "Rounding adds more than half the edit duration; review another supported duration/mode or redesign"));
    warnings.push(issue("CAPABILITY_UNVERIFIED", "Arithmetic uses a supplied policy; this utility does not verify its source or account controls"));
    return { ...result, selectedDurationMs: selected, plannedFrameCapacity: capacity, extraTailFrames: extra,
      durationSelection: "selected_from_declaration", policyStatus: durationPolicy.status };
  } catch (error) { return { valid: false, errors: [issue("ARITHMETIC_RANGE", error.message)], warnings }; }
}

export function validateVideoWorkbook(book) {
  const errors = [], warnings = [], pending = [], nodeResults = [];
  const add = (list, code, message, id = null) => list.push(issue(code, message, id));
  if (!plain(book) || book.format !== FORMAT || !Array.isArray(book.nodes) || !book.nodes.length)
    return { valid: false, errors: [issue("WORKBOOK", `Use ${FORMAT} with a nonempty nodes array`)], warnings, pending, nodes: [], mediaVerified: false, providerExecution: false };
  if (own(book, "kind") || own(book, "contractVersion")) add(errors, "NONCANONICAL", "This worksheet is not a canonical root contract");
  const ids = new Set();
  for (const node of book.nodes) {
    if (!plain(node) || !text(node.id)) { add(errors, "NODE_ID", "Every node needs an id"); continue; }
    if (ids.has(node.id)) add(errors, "DUPLICATE_NODE", "Duplicate node id", node.id);
    ids.add(node.id);
  }
  const adjacency = new Map();
  for (const node of book.nodes) {
    if (!plain(node) || !text(node.id)) continue;
    const id = node.id;
    if (!own(NODE_TAGS, node.type ?? "")) { add(errors, "NODE_TYPE", "Unknown node type", id); continue; }
    const parsed = parseTaggedPrompt(node.prompt);
    errors.push(...parsed.errors.map((e) => ({ ...e, nodeId: id })));
    for (const tag of new Set([...COMMON, ...NODE_TAGS[node.type]])) if (!own(parsed.values, tag)) add(errors, "MISSING_TAG", `Required <${tag}> block is missing`, id);
    if (own(parsed.values, "节点") && parsed.values["节点"].trim() !== id) add(errors, "NODE_LABEL", "The 节点 block must equal the worksheet node id", id);
    const deps = node.dependsOn ?? [];
    if (!Array.isArray(deps) || !deps.every(text) || new Set(deps).size !== deps.length) add(errors, "DEPENDENCIES", "Dependencies must be unique node IDs", id);
    else {
      adjacency.set(id, deps);
      for (const dep of deps) if (!ids.has(dep)) add(errors, "MISSING_DEPENDENCY", `Unknown dependency ${dep}`, id);
    }
    const refs = node.references ?? [], aliases = new Set(), roles = new Set();
    if (!Array.isArray(refs)) add(errors, "REFERENCES", "references must be an array", id);
    else for (const ref of refs) {
      if (!plain(ref) || !text(ref.alias) || !["image", "video", "audio"].includes(ref.mediaType) || !Array.isArray(ref.roles) || !ref.roles.length) {
        add(errors, "REFERENCE_SHAPE", "References need alias, mediaType and nonempty roles", id); continue;
      }
      if (aliases.has(ref.alias)) add(errors, "DUPLICATE_ALIAS", ref.alias, id);
      aliases.add(ref.alias);
      if (new Set(ref.roles).size !== ref.roles.length) add(errors, "DUPLICATE_ROLE", ref.alias, id);
      for (const role of ref.roles) {
        if (!ROLES.has(role)) add(errors, "REFERENCE_ROLE", `Unknown role ${role}`, id);
        roles.add(role);
        if (["first_frame", "last_frame"].includes(role) && ref.mediaType !== "image") add(errors, "FRAME_MEDIA", `${role} requires an image`, id);
        if (role === "storyboard" && ref.mediaType !== "image") add(errors, "STORYBOARD_MEDIA", "A storyboard image reference requires image media", id);
        if (["voice", "audio_timing"].includes(role) && !(ref.mediaType === "audio" || (ref.mediaType === "video" && ref.useAudioTrack === true))) add(errors, "AUDIO_MEDIA", `${role} requires audio or an explicitly scoped video audio track`, id);
        if (role === "source_clip" && ref.mediaType !== "video") add(errors, "CLIP_MEDIA", "source_clip requires video", id);
      }
      if (!text(ref.source) || !text(ref.version) || !["bound", "fixture", "unresolved"].includes(ref.status)) add(pending, "REFERENCE_UNRESOLVED", `Bind exact source/version/status for ${ref.alias}`, id);
      else if (ref.status !== "bound") add(pending, "REFERENCE_NOT_BOUND", `${ref.alias} is ${ref.status}, not an actual verified input`, id);
      if (!text(ref.transfer) || !text(ref.exclude)) add(errors, "REFERENCE_SCOPE", `State transfer and exclusion for ${ref.alias}`, id);
    }
    if (node.type === "video_t2v" && Array.isArray(refs) && refs.length) add(errors, "T2V_REFERENCE_MODE", "Text-to-video has no media conditioning; select a reference-based mode for bound media", id);
    const isVideo = own(VIDEO_MODES, node.type);
    if (isVideo) {
      const requiredRole = { video_i2v: ["first_frame"], video_flf: ["first_frame", "last_frame"], video_extend: ["source_clip"], video_edit: ["source_clip"] }[node.type] ?? [];
      for (const role of requiredRole) if (!roles.has(role)) add(errors, "MISSING_REFERENCE_ROLE", role, id);
      if (node.type !== "video_t2v" && (!Array.isArray(refs) || refs.length === 0)) add(errors, "MISSING_REFERENCE", "This video node requires at least one reference", id);
      for (const role of ["first_frame", "last_frame", "source_clip"]) {
        if (Array.isArray(refs) && refs.filter((r) => Array.isArray(r?.roles) && r.roles.includes(role)).length > 1) add(errors, "CONFLICTING_ANCHORS", `More than one ${role} assignment`, id);
      }
      const capability = node.capability;
      if (!plain(capability) || !["platform", "model", "surface", "evidence", "checkedAt"].every((k) => text(capability[k])) || capability.mode !== VIDEO_MODES[node.type])
        add(pending, "CAPABILITY_SCOPE", "Resolve platform/model/surface/mode and dated evidence separately", id);
      if (capability?.status === "unsupported") add(errors, "UNSUPPORTED_MODE", "Selected surface explicitly does not support this mode", id);
      else if (capability?.status !== "documented") add(pending, "MODE_UNKNOWN", "Mode support remains unresolved or a fixture", id);
      // Keep duration/reference declarations tied to the selected model and surface.
      for (const [label, declaration] of [["DURATION", node.durationPolicy], ["REFERENCE", node.referenceLimits]]) {
        if (!declaration || declaration.status === "unknown") continue;
        const scope = declaration.scope;
        if (!plain(scope) || !["platform", "model", "surface", "mode"].every((k) => text(scope[k])))
          add(pending, `${label}_SCOPE`, `Bind the ${label.toLowerCase()} policy to an exact model/surface/mode`, id);
        else if (plain(capability) && ["platform", "model", "surface", "mode"].some((k) => scope[k] !== capability[k]))
          add(errors, `${label}_SCOPE_MISMATCH`, "A policy from another model/surface/mode cannot be reused silently", id);
      }
      if (node.referenceLimits && node.referenceLimits.status !== "unknown") {
        const limit = node.referenceLimits;
        if (!plain(limit) || !["documented", "user_supplied", "fixture"].includes(limit.status) || !text(limit.source) || !text(limit.checkedAt) || !plain(limit.caps) ||
            !Object.keys(limit.caps).length || Object.entries(limit.caps).some(([k, v]) => !["image", "video", "audio", "total"].includes(k) || !integer(v)))
          add(errors, "REFERENCE_LIMITS", "Reference limits need dated evidence and nonnegative integer media/total caps", id);
        else if (Array.isArray(refs)) {
          const counts = { image: 0, video: 0, audio: 0, total: refs.length };
          for (const ref of refs) if (plain(ref) && own(counts, ref.mediaType) && ref.mediaType !== "total") counts[ref.mediaType]++;
          for (const [key, cap] of Object.entries(limit.caps)) if (counts[key] > cap) add(errors, "REFERENCE_LIMIT_EXCEEDED", `${key}: ${counts[key]} exceeds declared ${cap}`, id);
        }
      } else if (node.type === "video_reference") add(pending, "REFERENCE_LIMITS_UNKNOWN", "Do not infer current multimodal limits from another model", id);
      if (node.cameraControl) {
        const c = node.cameraControl;
        if (!plain(c) || !["text", "ui", "reference"].includes(c.owner) || !Array.isArray(c.active) || c.active.length !== 1 || c.active[0] !== c.owner)
          add(errors, "CAMERA_CONTROL_CONFLICT", "Select one authoritative camera-control channel; remove conflicting duplicates", id);
      }
    }
    let timing = null;
    if (node.timing || (isVideo && node.type !== "video_edit")) {
      timing = planTiming(node.timing, book.frameRate, node.durationPolicy ?? null);
      errors.push(...timing.errors.map((e) => ({ ...e, nodeId: id })));
      warnings.push(...timing.warnings.map((e) => ({ ...e, nodeId: id })));
      if (timing.selectedDurationMs === null) add(pending, "DURATION_SELECTION", "No generation duration selected", id);
      if (node.type === "video_flf" && node.timing?.tailFrames > 0) {
        if (node.endpointPolicy !== "hold_before_cut") add(errors, "ENDPOINT_HANDLE_CONFLICT", "A terminal-only last frame cannot establish the state before a trimmed tail; request a pre-cut hold or revise anchors", id);
        else add(warnings, "ENDPOINT_HOLD_UNVERIFIED", "Pre-cut hold is requested, not guaranteed; inspect returned frames before trimming", id);
      }
    }
    const cues = node.cues ?? [];
    if (!Array.isArray(cues)) add(errors, "CUES", "cues must be an array", id);
    else {
      const cueIds = new Set();
      for (const cue of cues) {
        if (!plain(cue) || !text(cue.id) || cueIds.has(cue.id) || !TRACKS.has(cue.track) || !integer(cue.startFrame) || !integer(cue.endFrame, true) || cue.endFrame <= cue.startFrame) {
          add(errors, "CUE_SHAPE", "Cue id/track or half-open frame range is invalid", id); continue;
        }
        cueIds.add(cue.id);
        if (timing?.valid && timing.editWindow) {
          const [a, b] = timing.editWindow;
          if ((cue.startFrame < a || cue.endFrame > b) && cue.allowHandle !== true) add(errors, "CUE_OUTSIDE_EDIT", `${cue.id} would be cut; move the cue or explicitly document a sound bridge/handle use`, id);
          if (timing.plannedFrameCapacity !== null && cue.endFrame > timing.plannedFrameCapacity) add(errors, "CUE_OUTSIDE_GENERATION", cue.id, id);
        }
        if (cue.track === "dialogue") {
          if (!text(cue.speaker) || !text(cue.text) || !["on_screen", "off_screen", "voiceover"].includes(cue.delivery)) add(errors, "DIALOGUE_FIELDS", "Dialogue needs speaker, exact text and delivery type", id);
          if (typeof cue.authoritativeText !== "string") add(pending, "DIALOGUE_AUTHORITY", `Supply authoritativeText for ${cue.id}`, id);
          else if (cue.text !== cue.authoritativeText) add(errors, "DIALOGUE_CHANGED", `Exact copy changed in ${cue.id}`, id);
          if (typeof cue.text === "string" && !(parsed.values["台词"] ?? "").includes(cue.text)) add(errors, "DIALOGUE_TAG", `Place the exact copy in <台词> for ${cue.id}`, id);
          if (cue.delivery === "on_screen" && typeof cue.lipSyncRequired !== "boolean") add(errors, "LIP_SYNC_SCOPE", "Declare whether visible speech requires lip sync", id);
          add(warnings, "SPEECH_TIMING_UNVERIFIED", `The frame window for ${cue.id} does not measure actual speech duration`, id);
        }
      }
      const speech = cues.filter((c) => plain(c) && c.track === "dialogue" && text(c.speaker));
      for (let i = 0; i < speech.length; i++) for (let j = i + 1; j < speech.length; j++) {
        const a = speech[i], b = speech[j];
        if (a.speaker === b.speaker && a.startFrame < b.endFrame && b.startFrame < a.endFrame && !(a.overlapAuthorized === true && b.overlapAuthorized === true)) add(errors, "SPEAKER_OVERLAP", `Overlapping speech for ${a.speaker}`, id);
      }
    }
    nodeResults.push({ id, type: node.type, timing, plainTextPreview: parsed.errors.length ? null : plainTextPreview(node.prompt) });
  }
  const visited = new Set(), visiting = new Set();
  function visit(id) {
    if (visiting.has(id)) { add(errors, "DEPENDENCY_CYCLE", `Cycle through ${id}`, id); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of adjacency.get(id) ?? []) if (ids.has(dep)) visit(dep);
    visiting.delete(id); visited.add(id);
  }
  for (const id of ids) visit(id);
  return { valid: errors.length === 0, errors, warnings, pending, nodes: nodeResults,
    declarationComplete: errors.length === 0 && pending.length === 0,
    capabilityVerified: false, mediaVerified: false, providerExecution: false,
    scope: "Worksheet syntax, declared bindings and exact timing arithmetic only. No capability, rights, semantic, media or platform-import verification." };
}

/** 中文 CLI 展示层：保留原始返回值和稳定错误码，不修改输入结果。 */
export function withChineseVideoSummary(result) {
  const messages = {
    "T2V_REFERENCE_MODE": "文生视频节点不绑定媒体条件；需要图片或其他媒体约束时请选择对应参考模式。",
    "EMPTY_PROMPT": "需要非空的类型化标签提示词。",
    "TAG_SYNTAX": "存在标签外文字、嵌套标签、配对错误或格式错误。",
    "UNKNOWN_TAG": "存在未支持的工作表标签，请使用节点规范中的标签。",
    "DUPLICATE_TAG": "标签重复，请将同类条目合并到一个标签块。",
    "EMPTY_TAG": "标签内容不能为空。",
    "TAG_ESCAPE": "标签内容的 &、<、> 必须按规范转义。",
    "FRAME_RATE": "帧率分子、分母必须是正的安全整数。",
    "TIMING_FIELDS": "时长字段须为合法整数帧，有效区间须大于零。",
    "DURATION_UNKNOWN": "尚未提供目标模型／界面的时长政策，不会编造时长。",
    "DURATION_POLICY": "时长档位或步长声明不合法，不能同时声明两种形式。",
    "DURATION_EVIDENCE": "时长政策需提供来源与检查日期。",
    "DURATION_NO_FIT": "没有档位能容纳完整有效区间及余量；不能自动截台词或加速。",
    "LARGE_PADDING": "凑档余量较大，请审阅模式、长度或镜头计划。",
    "CAPABILITY_UNVERIFIED": "只按给定政策计算，未核验来源或账号控制。",
    "ARITHMETIC_RANGE": "算术结果超出安全整数范围。",
    "WORKBOOK": "工作簿格式或节点数组不合法。",
    "NONCANONICAL": "必须明确这是非规范工作表，不能冒充根契约。",
    "NODE_ID": "节点需要合法且唯一的标识符。",
    "NODE_TYPE": "节点类型不支持，请使用既有类型词汇。",
    "DUPLICATE_NODE": "节点标识符重复。",
    "NODE_LABEL": "<节点> 与工作表节点 ID 不一致。",
    "MISSING_TAG": "当前节点类型缺少必要标签。",
    "DEPENDENCIES": "依赖应为不含重复的合法 ID 数组。",
    "MISSING_DEPENDENCY": "依赖的节点不存在。",
    "DEPENDENCY_CYCLE": "节点依赖存在环。",
    "REFERENCES": "参考必须是数组。",
    "REFERENCE_SHAPE": "参考记录缺少必要标识或媒体类型等字段。",
    "DUPLICATE_ALIAS": "参考别名重复。",
    "DUPLICATE_ROLE": "同一参考的职责重复。",
    "REFERENCE_ROLE": "参考职责不受支持。",
    "REFERENCE_SCOPE": "需明确参考的允许迁移、排除范围，以及政策的精确平台绑定。",
    "DURATION_SCOPE": "时长政策需绑定精确平台、模型、界面及模式。",
    "REFERENCE_UNRESOLVED": "参考仍未解析，不能称为已完成绑定。",
    "REFERENCE_NOT_BOUND": "参考未出现在指定节点的实际绑定中。",
    "MISSING_REFERENCE": "缺少此模式所需的参考。",
    "MISSING_REFERENCE_ROLE": "缺少此模式要求的参考职责。",
    "CONFLICTING_ANCHORS": "边界锚点冲突，必须明确首帧与尾帧。",
    "FRAME_MEDIA": "首尾帧必须绑定适当的图像媒介。",
    "STORYBOARD_MEDIA": "分镜参考板必须使用图像媒介；动态预演应按视频的表演或运镜职责绑定。",
    "AUDIO_MEDIA": "声线或时序参考必须具有可用的音频媒介／音轨。",
    "CLIP_MEDIA": "来源片段需要视频媒介。",
    "CAPABILITY_SCOPE": "平台、模型、界面或模式声明仍不完整。",
    "MODE_UNKNOWN": "目标模式支持未知。",
    "UNSUPPORTED_MODE": "所选界面明确不支持所需模式。",
    "REFERENCE_LIMITS": "参考数量政策需有效上限、来源和检查日期。",
    "REFERENCE_LIMIT_EXCEEDED": "参考数量超过声明上限，具体计数见原始诊断。",
    "REFERENCE_LIMITS_UNKNOWN": "全能参考的当前数量限制未知，不沿用其他模型限制。",
    "CAMERA_CONTROL_CONFLICT": "主要运镜需选择一个权威通道，去除冲突指令。",
    "DURATION_SELECTION": "尚未选择可用生成时长。",
    "ENDPOINT_HANDLE_CONFLICT": "只约束最终帧不能保证剪辑出点前已到达终态；需提前到位保持或修订锚点。",
    "ENDPOINT_HOLD_UNVERIFIED": "已请求出点前保持，但未证明实现，裁切前检查实际帧。",
    "CUES": "时间提示必须是数组。",
    "CUE_SHAPE": "时间提示 ID、轨道或左闭右开区间不合法。",
    "CUE_OUTSIDE_EDIT": "提示超出有效剪辑区间，会被裁掉；应修正或明确声音桥／余量用途。",
    "CUE_OUTSIDE_GENERATION": "提示超出规划生成容量。",
    "DIALOGUE_FIELDS": "台词需说话人、准确原文及画内／画外／旁白类别。",
    "DIALOGUE_AUTHORITY": "尚未提供台词权威原文。",
    "DIALOGUE_CHANGED": "台词与权威原文不一致，不能无授权改写。",
    "DIALOGUE_TAG": "<台词> 标签中必须保留准确口播文字。",
    "LIP_SYNC_SCOPE": "画内说话必须明确是否要求口型同步。",
    "SPEECH_TIMING_UNVERIFIED": "帧窗口是计划，不是对实际语音时长的测量。",
    "SPEAKER_OVERLAP": "同一说话人的台词区间重叠且未明确授权。",
    "DURATION_SCOPE_MISMATCH": "时长政策属于其他模型、界面或模式，不能无声沿用。",
    "REFERENCE_SCOPE_MISMATCH": "参考数量政策属于其他模型、界面或模式，不能无声沿用。"
};
  const convert = (items) => (items ?? []).map((item) => ({
    code: item.code, nodeId: item.nodeId ?? null,
    message: messages[item.code] ?? "未识别的诊断，请核对原始代码与细节。",
    detail: item.message,
  }));
  return { ...result, localization: {
    locale: "zh-CN",
    summary: result.valid ? "结构与算术检查通过；仍需核验未决声明和实际媒体。" : "检查未通过，请先修正错误。",
    errors: convert(result.errors), warnings: convert(result.warnings), pending: convert(result.pending),
    scope: "仅检查工作表语法、声明的绑定和精确时间算术；不核验平台能力、权利、语义、媒体或导入。",
  } };
}

function main(args) {
  if (args.length === 1 && args[0] === "--help") { console.log(`用法：node check-video-plan.mjs worksheet.json\n只读检查 ${FORMAT} 工作表；向标准输出返回 JSON 和中文摘要，不调用平台、不写文件。`); return; }
  if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Provide one worksheet path or --help");
  const result = validateVideoWorkbook(JSON.parse(readFileSync(args[0], "utf8")));
  console.log(JSON.stringify(withChineseVideoSummary(result), null, 2));
  if (!result.valid) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (error) { console.error(JSON.stringify({ valid: false, error: error.message, messageZh: "无法读取或检查工作表，请核对路径、JSON 格式和参数；原始原因见 error。" })); process.exitCode = 1; }
}
