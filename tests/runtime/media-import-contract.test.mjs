import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const mediaImportSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "media-import.schema.json");
const execFile = promisify(execFileCallback);
const fixturePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLdpAAAAABJRU5ErkJggg==", "base64");
const exactRenderPlan = "cineweave_codex_render_plan/render.cli-fixture@1/sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function createCliImport(t, options = {}) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-media-import-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const imagePath = join(root, "candidate.png");
  const receiptPath = join(root, "receipt.json");
  await writeFile(imagePath, fixturePng);
  await writeFile(receiptPath, JSON.stringify({
    repository: "https://github.com/cineweave/studio",
    ref: "v2.5.1",
    commit: "0123456789abcdef0123456789abcdef01234567",
    installedBy: "codex-environment",
    usedAt: "2026-09-01T00:00:00.000Z"
  }), "utf8");
  const result = await execFile(process.execPath, [
    join(repoRoot, "scripts", "verify-media-import.mjs"),
    imagePath,
    "--world-id", "world-cli-fixture",
    "--render-plan-ref", options.renderPlanRef ?? exactRenderPlan,
    "--receipt", receiptPath
  ], { windowsHide: true });
  return JSON.parse(result.stdout);
}

test("verify-media-import upgrades an exact RenderPlan ref to MediaImport 2.5", async (t) => {
  const mediaImport = await createCliImport(t);
  assert.equal(mediaImport.contractVersion, "2.5.0");
  assert.match(mediaImport.mediaImportId, /^media-import\./);
  assert.equal(mediaImport.version, 1);
  assert.deepEqual(mediaImport.renderPlanRef, {
    kind: "cineweave_codex_render_plan",
    id: "render.cli-fixture",
    version: 1,
    contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  });
  assert.equal(Object.hasOwn(mediaImport, "provenance"), true);
  const result = await validatePayload(mediaImportSchemaPath, mediaImport);
  assert.equal(result.valid, true);
  assert.deepEqual(validateByKind(mediaImport), []);
});

test("MediaImport 2.5 rejects a legacy RenderPlan string", async (t) => {
  const invalid = await createCliImport(t);
  invalid.renderPlanRef = "render-plan:legacy-string";
  const result = await validatePayload(mediaImportSchemaPath, invalid);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /renderPlanRef/);
});

test("MediaImport retains a schema-valid legacy 2.0 shape", async (t) => {
  const legacy = await createCliImport(t);
  legacy.contractVersion = "2.0.0";
  delete legacy.mediaImportId;
  delete legacy.version;
  delete legacy.provenance;
  legacy.renderPlanRef = "render-plan:legacy-string";
  const result = await validatePayload(mediaImportSchemaPath, legacy);
  assert.equal(result.valid, true);
});

test("verify-media-import preserves a non-canonical legacy RenderPlan string as 2.0", async (t) => {
  const legacy = await createCliImport(t, { renderPlanRef: "render-plan:legacy-string" });
  assert.equal(legacy.contractVersion, "2.0.0");
  assert.equal(legacy.renderPlanRef, "render-plan:legacy-string");
  assert.equal(Object.hasOwn(legacy, "mediaImportId"), false);
  const result = await validatePayload(mediaImportSchemaPath, legacy);
  assert.equal(result.valid, true);
});
