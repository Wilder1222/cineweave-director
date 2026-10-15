#!/usr/bin/env node

// 只读检查已编写的设计／提示词工作表，不检查生成媒体。
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseJsonStrict } from "./parse-json.mjs";

export const REVIEW_ROLES = Object.freeze(["direction", "performance", "staging", "cinematography", "prompt", "continuity"]);
const DOMAINS = ["world", "story", "character", "scene", "style", "reference", "action", "direction", "storyboard", "prompt", "production", "rights"];

function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} 必须是对象`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new TypeError(`不支持字段 ${label}.${key}`);
}

function text(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} 必须是非空文本`);
}

function choice(value, values, label) {
  if (!values.includes(value)) throw new TypeError(`${label} 必须取以下值之一：${values.join(", ")}`);
}

function list(value, label) {
  if (!Array.isArray(value) || !value.length) throw new TypeError(`${label} 必须是非空数组`);
}

export function countPrompt(textValue) {
  if (typeof textValue !== "string") throw new TypeError("提示词文本必须是字符串");
  // 排除 Unicode White_Space 后按码点计数，不是 UTF-16 长度或汉字数；不改写原文。
  return [...textValue].filter((character) => !/\p{White_Space}/u.test(character)).length;
}


const CAMERA_TECHNIQUE_RE = /^(?:K0[1-7]|C0[1-9]|M(?:0[1-9]|1[0-2])|F0[1-3]|E0[1-4]|neutral_static)$/u;
const CAMERA_MOTION_TECHNIQUES = new Set(["K04", "K06", "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M12"]);
const CAMERA_MOTION_TYPES = ["static", "dolly", "truck", "pan", "tilt", "arc", "crane", "handheld", "gimbal", "compound"];
const CAMERA_VIEW_FIELDS = ["shotScale", "position", "height", "angle", "perspectiveIntent", "focusTarget", "depthOfField", "axisSide", "movementIntent"];
const CAMERA_COMPOSITION_FIELDS = ["layout", "foreground", "midground", "background", "negativeSpace", "visualHierarchy"];
const CAMERA_MOTION_FIELDS = ["motivation", "path", "start", "acceleration", "peak", "deceleration", "end", "framingChange"];

function requiredCameraText(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${label} 缺少明确、非空的摄影语言设计`);
}

/** Check an authored camera decision worksheet, never rendering or verifying media. */
export function checkCameraLanguageDecisions(plan) {
  object(plan, "cameraLanguage", ["scope", "shotIds", "decisions"]);
  choice(plan.scope, ["narrative_video", "narrative_keyframe"], "cameraLanguage.scope");
  list(plan.shotIds, "cameraLanguage.shotIds");
  if (!Array.isArray(plan.decisions)) throw new TypeError("cameraLanguage.decisions 必须是数组");
  const errors = [], missing = [], seen = new Set(), expected = new Set(plan.shotIds);
  if (expected.size !== plan.shotIds.length) errors.push("cameraLanguage.shotIds 含重复镜号");
  for (const id of plan.shotIds) text(id, "cameraLanguage.shotId");

  for (const [index, row] of plan.decisions.entries()) {
    const loc = `cameraLanguage.decisions[${index}]`;
    object(row, loc, ["shotId", "decision", "camera", "composition", "temporal", "storyboardMovementType"]);
    text(row.shotId, `${loc}.shotId`);
    if (!expected.has(row.shotId)) errors.push(`${loc}.shotId 不属于已声明的镜号`);
    if (seen.has(row.shotId)) errors.push(`${loc}.shotId 决策重复`);
    seen.add(row.shotId);
    object(row.decision, `${loc}.decision`, [
      "primaryTechniqueId", "supportingTechniqueIds", "narrativeReason", "audiencePayoff",
      "trigger", "cameraMode", "focusMode", "noMotionReason", "focusTargetEnd", "exitMatch"
    ]);
    const d = row.decision;
    requiredCameraText(d.primaryTechniqueId, `${loc}.primaryTechniqueId`, errors);
    if (typeof d.primaryTechniqueId === "string" && !CAMERA_TECHNIQUE_RE.test(d.primaryTechniqueId)) errors.push(`${loc}.primaryTechniqueId 不是已登记的 35 种技法或 neutral_static`);
    if (!Array.isArray(d.supportingTechniqueIds)) errors.push(`${loc}.supportingTechniqueIds 必须是数组，可为空`);
    else {
      if (d.supportingTechniqueIds.length > 8 || new Set(d.supportingTechniqueIds).size !== d.supportingTechniqueIds.length) errors.push(`${loc}.supportingTechniqueIds 超限或重复`);
      for (const id of d.supportingTechniqueIds) if (typeof id !== "string" || !CAMERA_TECHNIQUE_RE.test(id) || id === "neutral_static" || id === d.primaryTechniqueId) errors.push(`${loc}.supportingTechniqueIds 含非法、自身重复或中性占位 ID`);
    }
    for (const field of ["narrativeReason", "audiencePayoff", "trigger", "exitMatch"]) requiredCameraText(d[field], `${loc}.${field}`, errors);
    choice(d.cameraMode, ["static", "moving", "compound"], `${loc}.cameraMode`);
    choice(d.focusMode, ["hold", "follow", "rack"], `${loc}.focusMode`);
    if (d.cameraMode === "static") requiredCameraText(d.noMotionReason, `${loc}.noMotionReason`, errors);
    if (d.focusMode === "rack") requiredCameraText(d.focusTargetEnd, `${loc}.focusTargetEnd`, errors);
    if (d.primaryTechniqueId === "neutral_static" && (d.cameraMode !== "static" || d.supportingTechniqueIds?.length)) errors.push(`${loc}：neutral_static 仅用于无其他技法的固定机位`);
    if (d.cameraMode === "static" && CAMERA_MOTION_TECHNIQUES.has(d.primaryTechniqueId)) errors.push(`${loc}：所选主技法要求摄影机运动，但 cameraMode 声明 static`);
    if (d.cameraMode !== "static" && d.primaryTechniqueId === "M11") errors.push(`${loc}：固定长镜头主技法与相机运动模式冲突`);
    if (d.primaryTechniqueId === "K07" && d.focusMode !== "rack") errors.push(`${loc}：K07 应记录实际的焦点转移`);

    object(row.camera, `${loc}.camera`, [...CAMERA_VIEW_FIELDS, "focalLengthMm"]);
    for (const field of CAMERA_VIEW_FIELDS) requiredCameraText(row.camera[field], `${loc}.camera.${field}`, errors);
    if (row.camera.focalLengthMm !== undefined && (!Number.isFinite(row.camera.focalLengthMm) || row.camera.focalLengthMm < 8 || row.camera.focalLengthMm > 1200))
      errors.push(`${loc}：数值焦距不合法；普通中文工作稿允许不填数值`);
    object(row.composition, `${loc}.composition`, CAMERA_COMPOSITION_FIELDS);
    for (const field of CAMERA_COMPOSITION_FIELDS) requiredCameraText(row.composition[field], `${loc}.composition.${field}`, errors);
    if (d.focusMode === "rack" && d.focusTargetEnd === row.camera.focusTarget) errors.push(`${loc}：移焦起止对象不能完全相同`);
    if (row.storyboardMovementType !== undefined && row.storyboardMovementType === "rack-focus")
      errors.push(`${loc}：新稿不得把 rack-focus 放入相机运动字段，改用相机真实状态及 focusTimeline`);

    if (plan.scope === "narrative_video" && row.temporal === undefined) errors.push(`${loc}：叙事视频缺少运镜、焦点及剪辑时间轨`);
    if (row.temporal !== undefined) {
      object(row.temporal, `${loc}.temporal`, ["durationSeconds", "cameraMotion", "focusTimeline", "edit"]);
      const motion = row.temporal.cameraMotion;
      object(motion, `${loc}.temporal.cameraMotion`, ["type", ...CAMERA_MOTION_FIELDS]);
      choice(motion.type, CAMERA_MOTION_TYPES, `${loc}.temporal.cameraMotion.type`);
      for (const field of CAMERA_MOTION_FIELDS) requiredCameraText(motion[field], `${loc}.temporal.cameraMotion.${field}`, errors);
      if (d.cameraMode === "static" && motion.type !== "static") errors.push(`${loc}：固定机位与实际运动轨不一致`);
      if (d.cameraMode === "moving" && ["static", "compound"].includes(motion.type)) errors.push(`${loc}：移动机位与运动轨不一致`);
      if (d.cameraMode === "compound" && motion.type !== "compound") errors.push(`${loc}：复合运镜必须由 compound 轨承载`);
      if (!Array.isArray(row.temporal.focusTimeline) || !row.temporal.focusTimeline.length) errors.push(`${loc}：至少声明一个焦点时序事件`);
      else {
        let last = -1;
        for (const [fi, event] of row.temporal.focusTimeline.entries()) {
          object(event, `${loc}.temporal.focusTimeline[${fi}]`, ["eventId", "timeSeconds", "description"]);
          requiredCameraText(event.eventId, `${loc}.focusTimeline.eventId`, errors);
          requiredCameraText(event.description, `${loc}.focusTimeline.description`, errors);
          if (typeof event.timeSeconds !== "number" || !Number.isFinite(event.timeSeconds) || event.timeSeconds < 0 || event.timeSeconds <= last)
            errors.push(`${loc}：焦点事件时序必须严格递增且非负`);
          if (typeof row.temporal.durationSeconds === "number" && event.timeSeconds > row.temporal.durationSeconds) errors.push(`${loc}：焦点事件超出镜头时长`);
          last = event.timeSeconds;
        }
        if (d.focusMode === "rack" && row.temporal.focusTimeline.length < 2) errors.push(`${loc}：焦点切换至少需要起点和转移事件`);
      }
      object(row.temporal.edit, `${loc}.temporal.edit`, ["entry", "exit", "preferredTransition", "soundBridge"]);
      for (const field of ["entry", "exit", "preferredTransition", "soundBridge"]) requiredCameraText(row.temporal.edit[field], `${loc}.temporal.edit.${field}`, errors);
    }
  }
  for (const shotId of plan.shotIds) if (!seen.has(shotId)) missing.push(shotId);
  if (missing.length) errors.push(`缺少 ${missing.length} 个真实镜号的镜头语言决定：${missing.join(", ")}`);
  const coverageComplete = !missing.length && !errors.some(x => /重复镜号|决策重复|不属于已声明的镜号/u.test(x));
  return {
    valid: errors.length === 0, coverageComplete, scope: "plan_only", expectedShots: plan.shotIds.length,
    missing, errors, limitation: "只读文本与声明一致性检查；不能核验实际相机轨迹、光学焦点、观众反应或模型实现。"
  };
}

export function checkShotReview(worksheet) {
  object(worksheet, "worksheet", ["source", "mode", "roles", "shotIds", "reviews", "prompt", "cameraDecisions"]);
  object(worksheet.source, "source", ["type", "id", "version", "cameraLanguageScope"]);
  choice(worksheet.source.type, ["design", "prompt"], "source.type");
  text(worksheet.source.id, "source.id");
  if (!Number.isSafeInteger(worksheet.source.version) || worksheet.source.version < 1) throw new TypeError("source.version 必须是安全范围内的正整数");
  choice(worksheet.mode, ["full", "focused"], "mode");
  if (worksheet.mode === "full" && worksheet.roles !== undefined) throw new TypeError("full 模式使用全部六个视角，请省略 roles");
  const roles = worksheet.mode === "full" ? REVIEW_ROLES : worksheet.roles;
  list(roles, "roles");
  for (const role of roles) choice(role, REVIEW_ROLES, "role");
  list(worksheet.shotIds, "shotIds");
  for (const id of worksheet.shotIds) text(id, "shotId");
  if (!Array.isArray(worksheet.reviews)) throw new TypeError("reviews 必须是数组");

  const errors = [];
  const cameraScope = worksheet.source.cameraLanguageScope;
  let cameraLanguage = null;
  if (cameraScope !== undefined) {
    choice(cameraScope, ["narrative_video", "narrative_keyframe"], "source.cameraLanguageScope");
    if (worksheet.cameraDecisions === undefined) errors.push("新叙事镜头正式评审必须提供 cameraDecisions");
    else {
      cameraLanguage = checkCameraLanguageDecisions({ scope: cameraScope, shotIds: worksheet.shotIds, decisions: worksheet.cameraDecisions });
      errors.push(...cameraLanguage.errors.map((problem) => `镜头语言：${problem}`));
    }
  } else if (worksheet.cameraDecisions !== undefined) errors.push("提供 cameraDecisions 必须同时声明 source.cameraLanguageScope");
  if (new Set(roles).size !== roles.length) errors.push("roles 不能重复");
  if (new Set(worksheet.shotIds).size !== worksheet.shotIds.length) errors.push("shotIds 不能重复");
  const pairKey = (role, shotId) => JSON.stringify([role, shotId]);
  const expected = new Set(roles.flatMap((role) => worksheet.shotIds.map((id) => pairKey(role, id))));
  const seen = new Set();
  const openItems = [];
  let hasApplicablePass = false;
  let pairErrors = false;
  for (const [index, row] of worksheet.reviews.entries()) {
    const label = `reviews[${index}]`;
    object(row, label, ["role", "shotId", "status", "criterion", "observation", "sourceLocator", "repair"]);
    choice(row.role, REVIEW_ROLES, `${label}.role`);
    text(row.shotId, `${label}.shotId`);
    choice(row.status, ["pass", "revise", "unknown", "not_applicable"], `${label}.status`);
    text(row.criterion, `${label}.criterion`);
    text(row.observation, `${label}.observation`);
    if (row.sourceLocator !== undefined) text(row.sourceLocator, `${label}.sourceLocator`);
    if (["pass", "revise"].includes(row.status)) text(row.sourceLocator, `${label}.sourceLocator`);
    if (row.repair !== undefined) {
      object(row.repair, `${label}.repair`, ["domain", "variable", "acceptance"]);
      choice(row.repair.domain, DOMAINS, `${label}.repair.domain`);
      text(row.repair.variable, `${label}.repair.variable`);
      text(row.repair.acceptance, `${label}.repair.acceptance`);
      if (row.status !== "revise") errors.push(`${label}：只有 revise 行可以包含 repair`);
    }
    if (row.status === "revise" && row.repair === undefined) errors.push(`${label}：revise 需要一个修复责任领域、变量和验收检查`);
    const pair = pairKey(row.role, row.shotId);
    if (!expected.has(pair)) { errors.push(`${label}：视角与镜头配对不在声明范围内 ${pair}`); pairErrors = true; }
    if (seen.has(pair)) { errors.push(`${label}：视角与镜头配对重复 ${pair}`); pairErrors = true; }
    seen.add(pair);
    if (["revise", "unknown"].includes(row.status)) openItems.push({ role: row.role, shotId: row.shotId, status: row.status });
    if (row.status === "pass") hasApplicablePass = true;
  }
  const missing = [...expected].filter((pair) => !seen.has(pair)).map((pair) => {
    const [role, shotId] = JSON.parse(pair);
    return { role, shotId };
  });
  if (missing.length) errors.push(`缺少 ${missing.length} 行视角与镜头配对评审`);

  let prompt = null;
  if (worksheet.prompt !== undefined) {
    object(worksheet.prompt, "prompt", ["text", "maxNonWhitespaceCodePoints"]);
    text(worksheet.prompt.text, "prompt.text");
    if (worksheet.source.type !== "prompt") errors.push("包含提示词文本时，source.type 必须为 prompt");
    const limit = worksheet.prompt.maxNonWhitespaceCodePoints;
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) throw new TypeError("prompt.maxNonWhitespaceCodePoints 必须是安全范围内的正整数");
    const count = countPrompt(worksheet.prompt.text);
    if (limit !== undefined && count > limit) errors.push(`提示词有 ${count} 个非空白码点，超过上限 ${limit}`);
    prompt = { nonWhitespaceCodePoints: count, limit: limit ?? null };
  }
  const coverageComplete = !pairErrors && !missing.length && new Set(roles).size === roles.length && new Set(worksheet.shotIds).size === worksheet.shotIds.length && (cameraScope === undefined || Boolean(cameraLanguage?.coverageComplete));
  const valid = errors.length === 0;
  return {
    valid, scope: "plan_only", coverageComplete,
    reviewComplete: valid && coverageComplete && !openItems.length && hasApplicablePass,
    expectedRows: expected.size, missing, openItems, prompt, errors, ...(cameraLanguage ? { cameraLanguage } : {}),
    limitation: "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 2 && args[0] === "--camera-language") {
    const input = parseJsonStrict(await readFile(args[1], "utf8"));
    const result = checkCameraLanguageDecisions(input);
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.valid ? 0 : 1;
    return;
  }
  if (args.length === 1 && args[0] === "--help") {
    console.log("用法：node check-shot-review.mjs <worksheet.json>，或 --camera-language <camera-workbook.json>\n只读逐镜评审：退出码 0 表示完成，1 表示输入无效，2 表示有效但未解决；不核验媒体。");
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new TypeError("用法：node check-shot-review.mjs <worksheet.json>，或使用 --help");
  const worksheet = parseJsonStrict(await readFile(args[0], "utf8"));
  const result = checkShotReview(worksheet);
  console.log(JSON.stringify({ ...result, localization: {
    locale: "zh-CN",
    summary: !result.valid ? "输入或覆盖检查未通过。" : result.reviewComplete ? "规划评审已完成；实际媒体仍未核验。" : "输入有效，评审仍有未决项或没有适用的通过项。",
  } }, null, 2));
  // 0：评审表完成；1：格式或一致性错误；2：有效但评审未解决。
  process.exitCode = !result.valid ? 1 : result.reviewComplete ? 0 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ valid: false, scope: "plan_only", error: error.message, messageZh: "无法完成逐镜评审，请核对参数、文件和工作表内容。" }));
    process.exitCode = 1;
  });
}
