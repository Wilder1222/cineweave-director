#!/usr/bin/env node

// Read-only checks of an authored design/prompt worksheet, never of generated media.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const REVIEW_ROLES = Object.freeze(["direction", "performance", "staging", "cinematography", "prompt", "continuity"]);
const DOMAINS = ["world", "story", "character", "scene", "style", "reference", "action", "direction", "storyboard", "prompt", "production", "rights"];

function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new TypeError(`${label}.${key} is not supported`);
}

function text(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be non-empty text`);
}

function choice(value, values, label) {
  if (!values.includes(value)) throw new TypeError(`${label} must be one of ${values.join(", ")}`);
}

function list(value, label) {
  if (!Array.isArray(value) || !value.length) throw new TypeError(`${label} must be a non-empty array`);
}

export function countPrompt(textValue) {
  if (typeof textValue !== "string") throw new TypeError("prompt text must be a string");
  // Unicode White_Space, not UTF-16 length or Han-character count. Do not rewrite copy.
  return [...textValue].filter((character) => !/\p{White_Space}/u.test(character)).length;
}

export function checkShotReview(worksheet) {
  object(worksheet, "worksheet", ["source", "mode", "roles", "shotIds", "reviews", "prompt"]);
  object(worksheet.source, "source", ["type", "id", "version"]);
  choice(worksheet.source.type, ["design", "prompt"], "source.type");
  text(worksheet.source.id, "source.id");
  if (!Number.isSafeInteger(worksheet.source.version) || worksheet.source.version < 1) throw new TypeError("source.version must be a positive safe integer");
  choice(worksheet.mode, ["full", "focused"], "mode");
  if (worksheet.mode === "full" && worksheet.roles !== undefined) throw new TypeError("full mode uses all six roles; omit roles");
  const roles = worksheet.mode === "full" ? REVIEW_ROLES : worksheet.roles;
  list(roles, "roles");
  for (const role of roles) choice(role, REVIEW_ROLES, "role");
  list(worksheet.shotIds, "shotIds");
  for (const id of worksheet.shotIds) text(id, "shotId");
  if (!Array.isArray(worksheet.reviews)) throw new TypeError("reviews must be an array");

  const errors = [];
  if (new Set(roles).size !== roles.length) errors.push("roles must be unique");
  if (new Set(worksheet.shotIds).size !== worksheet.shotIds.length) errors.push("shotIds must be unique");
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
      if (row.status !== "revise") errors.push(`${label}: repair belongs only to a revise row`);
    }
    if (row.status === "revise" && row.repair === undefined) errors.push(`${label}: revise requires one owning repair domain, variable and acceptance check`);
    const pair = pairKey(row.role, row.shotId);
    if (!expected.has(pair)) { errors.push(`${label}: unexpected role-shot pair ${pair}`); pairErrors = true; }
    if (seen.has(pair)) { errors.push(`${label}: duplicate role-shot pair ${pair}`); pairErrors = true; }
    seen.add(pair);
    if (["revise", "unknown"].includes(row.status)) openItems.push({ role: row.role, shotId: row.shotId, status: row.status });
    if (row.status === "pass") hasApplicablePass = true;
  }
  const missing = [...expected].filter((pair) => !seen.has(pair)).map((pair) => {
    const [role, shotId] = JSON.parse(pair);
    return { role, shotId };
  });
  if (missing.length) errors.push(`missing ${missing.length} role-shot review rows`);

  let prompt = null;
  if (worksheet.prompt !== undefined) {
    object(worksheet.prompt, "prompt", ["text", "maxNonWhitespaceCodePoints"]);
    text(worksheet.prompt.text, "prompt.text");
    if (worksheet.source.type !== "prompt") errors.push("prompt text requires source.type prompt");
    const limit = worksheet.prompt.maxNonWhitespaceCodePoints;
    if (limit !== undefined && (!Number.isSafeInteger(limit) || limit < 1)) throw new TypeError("prompt.maxNonWhitespaceCodePoints must be a positive safe integer");
    const count = countPrompt(worksheet.prompt.text);
    if (limit !== undefined && count > limit) errors.push(`prompt has ${count} non-whitespace code points, exceeding ${limit}`);
    prompt = { nonWhitespaceCodePoints: count, limit: limit ?? null };
  }
  const coverageComplete = !pairErrors && !missing.length && new Set(roles).size === roles.length && new Set(worksheet.shotIds).size === worksheet.shotIds.length;
  const valid = errors.length === 0;
  return {
    valid, scope: "plan_only", coverageComplete,
    reviewComplete: valid && coverageComplete && !openItems.length && hasApplicablePass,
    expectedRows: expected.size, missing, openItems, prompt, errors,
    limitation: "Checks worksheet consistency only; does not verify cited content, artistic quality, media, rights, approval or execution.",
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new TypeError("Usage: node check-shot-review.mjs <worksheet.json>");
  const worksheet = JSON.parse(await readFile(args[0], "utf8"));
  const result = checkShotReview(worksheet);
  console.log(JSON.stringify(result, null, 2));
  // 0: complete worksheet; 1: malformed/inconsistent; 2: valid but unresolved review.
  process.exitCode = !result.valid ? 1 : result.reviewComplete ? 0 : 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ valid: false, scope: "plan_only", error: error.message }));
    process.exitCode = 1;
  });
}
