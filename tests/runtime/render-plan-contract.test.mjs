import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const renderPlan = JSON.parse(await readFile(join(repoRoot, "packages", "cineweave-contracts", "examples", "render-plan.json"), "utf8"));
const renderPlanSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "render-plan.schema.json");
const execFile = promisify(execFileCallback);

test("RenderPlan 2.5 carries stable identity and an exact provider-neutral Prompt reference", async () => {
  assert.equal(renderPlan.contractVersion, "2.5.0");
  assert.match(renderPlan.renderPlanId, /^render\./);
  assert.equal(renderPlan.version, 1);
  assert.deepEqual(renderPlan.promptRef.kind, "cineweave_codex_image_prompt");
  assert.match(renderPlan.promptRef.contentHash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(Object.hasOwn(renderPlan, "promptPayloadRef"), false);
  assert.equal(renderPlan.assetRecipeRef.kind, "cineweave_codex_asset_recipe");
  assert.equal(renderPlan.capabilityProfileRef.kind, "cineweave_codex_capability_profile");
  const result = await validatePayload(renderPlanSchemaPath, renderPlan);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(renderPlan), []);
});

test("RenderPlan 2.5 rejects its legacy prompt string", async () => {
  const invalid = structuredClone(renderPlan);
  invalid.promptPayloadRef = "image-prompt:scene-01-shot-04";
  const result = await validatePayload(renderPlanSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must not match the forbidden schema/);
});

test("RenderPlan 2.5 semantic validation keeps prompt and optional source refs exact", () => {
  const invalid = structuredClone(renderPlan);
  invalid.promptPayloadRef = "image-prompt:scene-01-shot-04";
  invalid.capabilityProfileRef = {
    id: "capability.provider-neutral-image",
    version: 1,
    contentHash: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"
  };
  assert.match(
    validateByKind(invalid).join("\n"),
    /must not retain promptPayloadRef|capabilityProfileRef must be an exact CapabilityProfile reference/,
  );
});

test("RenderPlan 2.5 rejects an exact ref to a non-prompt contract", async () => {
  const invalid = structuredClone(renderPlan);
  invalid.promptRef.kind = "cineweave_codex_shot_spec";
  const result = await validatePayload(renderPlanSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must be one of/);
});

test("RenderPlan retains a schema-valid legacy 2.0 shape", async () => {
  const legacy = structuredClone(renderPlan);
  delete legacy.contractVersion;
  delete legacy.renderPlanId;
  delete legacy.version;
  delete legacy.promptRef;
  delete legacy.provenance;
  legacy.promptPayloadRef = "image-prompt:scene-01-shot-04";
  const result = await validatePayload(renderPlanSchemaPath, legacy);
  assert.equal(result.valid, true);
});

test("RenderPlan preflight accepts the versioned exact-prompt shape", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-render-plan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const plan = structuredClone(renderPlan);
  plan.skillReceipt = {
    repository: "https://github.com/cineweave/studio",
    ref: "v2.5.1",
    commit: "0123456789abcdef0123456789abcdef01234567",
    installedBy: "codex-environment",
    usedAt: "2026-09-01T00:00:00.000Z"
  };
  const planPath = join(root, "render-plan.json");
  await writeFile(planPath, JSON.stringify(plan), "utf8");
  const result = await execFile(process.execPath, [join(repoRoot, "scripts", "preflight-render-plan.mjs"), planPath], { windowsHide: true });
  const report = JSON.parse(result.stdout);
  assert.equal(report.valid, true);
  assert.equal(report.status, "ready_for_human_approval");
  assert.equal(report.checks.find((check) => check.code === "EXACT_PROMPT_REF")?.status, "pass");
});
