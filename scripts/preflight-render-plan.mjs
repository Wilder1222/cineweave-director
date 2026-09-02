#!/usr/bin/env node

import { readFile } from "node:fs/promises";

function usage() {
  console.error("Usage: node scripts/preflight-render-plan.mjs <render-plan.json>");
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value, path, errors) {
  if (typeof value !== "string" || !value.trim()) errors.push(`${path} must be a non-empty string`);
}

function isExactPromptRef(value) {
  return isRecord(value)
    && ["cineweave_codex_prompt_record", "cineweave_codex_image_prompt"].includes(value.kind)
    && typeof value.id === "string" && value.id.trim()
    && Number.isSafeInteger(value.version) && value.version >= 1
    && /^sha256:[0-9a-f]{64}$/.test(value.contentHash || "");
}

function check(checks, code, condition, message) {
  checks.push({ code, status: condition ? "pass" : "fail", message });
}

function containsForbiddenData(value, path = "payload") {
  const forbidden = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => forbidden.push(...containsForbiddenData(item, `${path}[${index}]`)));
    return forbidden;
  }
  if (!isRecord(value)) return forbidden;
  for (const [key, child] of Object.entries(value)) {
    if (/(accessToken|apiKey|cookie|password|secret|signedUrl|privateUrl|filePath|absolutePath)/i.test(key)) forbidden.push(`${path}.${key}`);
    forbidden.push(...containsForbiddenData(child, `${path}.${key}`));
  }
  return forbidden;
}

function placeholderReceipt(receipt) {
  return /owner\/repository|40-character-git-sha|placeholder|sha256:<|example/i.test(JSON.stringify(receipt));
}

async function main() {
  const planPath = process.argv[2];
  if (!planPath) {
    usage();
    process.exitCode = 2;
    return;
  }

  let plan;
  try {
    plan = JSON.parse(await readFile(planPath, "utf8"));
  } catch (error) {
    console.error(JSON.stringify({ valid: false, errors: [`cannot read RenderPlan: ${error instanceof Error ? error.message : String(error)}`] }, null, 2));
    process.exitCode = 2;
    return;
  }

  const errors = [];
  const checks = [];
  if (!isRecord(plan)) errors.push("RenderPlan must be an object");
  if (!isRecord(plan)) {
    console.error(JSON.stringify({ valid: false, errors }, null, 2));
    process.exitCode = 2;
    return;
  }

  requiredString(plan.worldId, "worldId", errors);
  const modern = plan.contractVersion === "2.5.0";
  if (modern) {
    requiredString(plan.renderPlanId, "renderPlanId", errors);
    check(checks, "EXACT_PROMPT_REF", isExactPromptRef(plan.promptRef), "RenderPlan 2.5 requires an exact PromptRecord or ImagePrompt reference");
    check(checks, "NO_LEGACY_PROMPT_STRING", !Object.hasOwn(plan, "promptPayloadRef"), "RenderPlan 2.5 must not retain the legacy prompt string");
  } else {
    requiredString(plan.promptPayloadRef, "promptPayloadRef", errors);
  }
  const modes = new Set(["generate", "edit", "inpaint", "multi_reference"]);
  check(checks, "MODE_SUPPORTED", modes.has(plan.mode), "mode must be generate, edit, inpaint or multi_reference");
  check(checks, "RECEIPT_PRESENT", isRecord(plan.skillReceipt) && !placeholderReceipt(plan.skillReceipt), "production preflight requires a real non-placeholder Skill receipt");
  check(checks, "HUMAN_APPROVAL_GATE", plan.executionGate?.requiresHumanApproval === true, "execution requires an explicit human approval gate");
  check(checks, "CANVAS_DECLARED", isRecord(plan.canvas) && typeof plan.canvas.aspectRatio === "string" && typeof plan.canvas.sizeClass === "string", "canvas aspect ratio and size class must be declared");
  check(checks, "QUALITY_BUDGET_DECLARED", ["draft", "explore", "final"].includes(plan.qualityBudget), "qualityBudget must be draft, explore or final");
  check(checks, "VARIANT_COUNT_BOUNDED", Number.isInteger(plan.variantCount) && plan.variantCount >= 1 && plan.variantCount <= 12, "variantCount must be between 1 and 12");

  const inputs = Array.isArray(plan.inputs) ? plan.inputs : [];
  const ids = inputs.map((input) => input?.observationId).filter((value) => typeof value === "string");
  check(checks, "REFERENCE_IDS_UNIQUE", new Set(ids).size === ids.length, "reference Observation IDs must be unique");
  check(checks, "EDIT_HAS_REFERENCE", plan.mode === "generate" || ids.length >= 1, "edit, inpaint and multi_reference modes require at least one reference input");
  check(checks, "MULTI_REFERENCE_HAS_TWO", plan.mode !== "multi_reference" || ids.length >= 2, "multi_reference mode requires at least two reference inputs");
  check(checks, "INPAINT_HAS_MASK", plan.mode !== "inpaint" || (ids.length >= 1 && isRecord(plan.mask)), "inpaint mode requires a primary reference and a mask");
  check(checks, "MASK_MODE_MATCH", !plan.mask || plan.mode === "inpaint", "a mask is only valid for inpaint mode");

  const forbiddenPaths = containsForbiddenData(plan);
  check(checks, "NO_SECRET_OR_PRIVATE_DATA", forbiddenPaths.length === 0, forbiddenPaths.length ? `forbidden data fields: ${forbiddenPaths.join(", ")}` : "no secret or private path fields found");
  const providerLeak = /gpt-image|openai|midjourney|stability|replicate|dall[- ]?e/i.test(JSON.stringify(plan));
  check(checks, "PROVIDER_NEUTRAL", !providerLeak, "RenderPlan must not contain provider names or vendor-specific parameters");
  check(checks, "POSTFLIGHT_DRAFT", plan.postflight?.importStatus === "draft", "postflight import status must remain draft until human review");

  const structuralErrors = [];
  if (plan.preflight?.status === "blocked") structuralErrors.push("plan.preflight.status is already blocked");
  if (plan.executionGate?.status === "approved" && (!plan.executionGate.approvedBy || !plan.executionGate.approvedAt)) structuralErrors.push("approved execution gate requires approvedBy and approvedAt");
  if (!Array.isArray(plan.postflight?.requiredArtifacts) || plan.postflight.requiredArtifacts.length === 0) structuralErrors.push("postflight.requiredArtifacts must not be empty");
  errors.push(...structuralErrors);

  const failedChecks = checks.filter((item) => item.status === "fail");
  const result = {
    valid: errors.length === 0 && failedChecks.length === 0,
    status: errors.length === 0 && failedChecks.length === 0 ? "ready_for_human_approval" : "blocked",
    plan: planPath,
    checks,
    errors
  };
  console.log(JSON.stringify(result, null, 2));
  if (!result.valid) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
