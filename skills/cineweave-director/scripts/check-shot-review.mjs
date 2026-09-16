#!/usr/bin/env node

// 只读检查已编写的设计／提示词工作表，不检查生成媒体。
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

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

export function checkShotReview(worksheet) {
  object(worksheet, "worksheet", ["source", "mode", "roles", "shotIds", "reviews", "prompt"]);
  object(worksheet.source, "source", ["type", "id", "version"]);
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
  const coverageComplete = !pairErrors && !missing.length && new Set(roles).size === roles.length && new Set(worksheet.shotIds).size === worksheet.shotIds.length;
  const valid = errors.length === 0;
  return {
    valid, scope: "plan_only", coverageComplete,
    reviewComplete: valid && coverageComplete && !openItems.length && hasApplicablePass,
    expectedRows: expected.size, missing, openItems, prompt, errors,
    limitation: "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === "--help") {
    console.log("用法：node check-shot-review.mjs <worksheet.json>\n只读逐镜评审：退出码 0 表示完成，1 表示输入无效，2 表示有效但未解决；不核验媒体。");
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new TypeError("用法：node check-shot-review.mjs <worksheet.json>，或使用 --help");
  const worksheet = JSON.parse(await readFile(args[0], "utf8"));
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
