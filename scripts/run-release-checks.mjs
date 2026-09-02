#!/usr/bin/env node

import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseJsonStrict } from "../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateDocument } from "./validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const manifestPath = join(contractRoot, "contracts", "manifest.json");
const failures = [];
const fail = (message) => failures.push(message);
const pass = (message) => console.log(`PASS ${message}`);

async function walk(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if ([".git", "node_modules", ".build"].includes(entry.name)) continue;
    const full = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else result.push(full);
  }
  return result;
}

async function checkJson() {
  const files = (await walk(repoRoot)).filter((path) => path.endsWith(".json"));
  for (const path of files) {
    try { parseJsonStrict(await readFile(path, "utf8")); }
    catch (error) { fail(`invalid JSON ${relative(repoRoot, path)}: ${error.message}`); }
  }
  if (!failures.some((item) => item.startsWith("invalid JSON"))) pass(`${files.length} JSON files parse`);
}

async function checkNodeSyntax() {
  const roots = [
    join(repoRoot, "scripts"),
    join(repoRoot, "packages", "cineweave-runtime", "src"),
    join(repoRoot, "packages", "cineweave-runtime", "bin"),
    join(repoRoot, "packages", "cineweave-world-os", "src"),
    join(repoRoot, "packages", "cineweave-world-os", "bin"),
    join(repoRoot, "tests", "runtime"),
    join(repoRoot, "tests", "world-os")
  ];
  const files = (await Promise.all(roots.map((root) => walk(root)))).flat().filter((path) => path.endsWith(".mjs"));
  for (const path of files) {
    const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    if (result.status !== 0) fail(`Node syntax failed ${relative(repoRoot, path)}: ${(result.stderr || result.stdout).trim()}`);
  }
  if (!failures.some((item) => item.includes("Node syntax"))) pass(`${files.length} Node scripts parse`);
}

async function checkManifestContracts() {
  const manifest = parseJsonStrict(await readFile(manifestPath, "utf8"));
  const plugin = parseJsonStrict(await readFile(join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"));
  const packageJson = parseJsonStrict(await readFile(join(repoRoot, "package.json"), "utf8"));
  if (manifest.version !== "2.5.1" || plugin.version !== manifest.version || packageJson.version !== manifest.version || plugin.name !== "cineweave-studio") fail("package, plugin and contract manifest versions must all be CineWeave Studio 2.5.1");
  else pass(`package, plugin and contract manifest are CineWeave Studio v${plugin.version}`);

  const kinds = new Set();
  for (const item of manifest.contracts || []) {
    if (kinds.has(item.kind)) fail(`duplicate contract kind in manifest: ${item.kind}`);
    kinds.add(item.kind);
    const schemaPath = join(contractRoot, item.schema);
    const examplePath = join(contractRoot, item.example);
    if (!existsSync(schemaPath)) { fail(`missing schema: ${item.schema}`); continue; }
    if (!existsSync(examplePath)) { fail(`missing example: ${item.example}`); continue; }
    const result = await validateDocument(schemaPath, examplePath);
    if (!result.valid) fail(`${item.example} does not validate: ${result.errors.join("; ")}`);
    else pass(`${item.kind} schema/example`);
  }
  for (const [schema, example] of [
    ["schemas/execution-receipt.schema.json", "examples/execution-receipt-blocked.json"],
    ["schemas/media-import.schema.json", "examples/media-import-video.json"],
    ["schemas/shot-spec.schema.json", "examples/shot-spec-action.json"],
    ["schemas/prompt-record.schema.json", "examples/prompt-record-reference-reframe.json"],
    ["schemas/prompt-record.schema.json", "examples/prompt-record-cinematic-director-template.json"],
    ["schemas/image-prompt-output.schema.json", "examples/integrated-image-prompt-reference-reframe.json"],
    ["schemas/style-package.schema.json", "examples/style-package-anime.json"],
    ["schemas/style-package.schema.json", "examples/style-package-manga.json"],
    ["schemas/style-compile.schema.json", "examples/style-compile-anime.json"]
  ]) {
    const result = await validateDocument(join(contractRoot, schema), join(contractRoot, example));
    if (!result.valid) fail(`${example} does not validate: ${result.errors.join("; ")}`);
    else pass(`${example} supplemental schema example`);
  }

  const ownership = new Map();
  for (const skill of manifest.skills || []) {
    const root = join(repoRoot, "skills", skill.name);
    const skillPath = join(root, "SKILL.md");
    const agentPath = join(root, "agents", "openai.yaml");
    const contractsPath = join(root, "contracts.json");
    if (!existsSync(skillPath)) { fail(`missing Skill: ${skill.name}`); continue; }
    if (!existsSync(agentPath)) fail(`missing OpenAI interface for ${skill.name}`);
    if (!existsSync(contractsPath)) fail(`missing portable contracts index for ${skill.name}`);
    const text = await readFile(skillPath, "utf8");
    if (!text.includes(`name: ${skill.name}`)) fail(`${skill.name} frontmatter name mismatch`);
    for (const route of skill.owns || []) {
      if (ownership.has(route)) fail(`route ${route} owned by both ${ownership.get(route)} and ${skill.name}`);
      ownership.set(route, skill.name);
      if (!text.includes(`\`${route}\``) && !text.includes(route)) fail(`${skill.name} does not document owned route ${route}`);
    }
  }
  if (!failures.some((item) => item.includes("route")) && ownership.size) pass(`${ownership.size} routes have one owner`);
  if (!failures.some((item) => item.includes("OpenAI interface") || item.includes("portable contracts"))) pass("all CineWeave Studio Skills expose interface and portable contracts metadata");
}

async function checkRecipeCatalog() {
  const catalogPath = join(contractRoot, "recipes", "catalog.json");
  const catalog = parseJsonStrict(await readFile(catalogPath, "utf8"));
  if (catalog.version !== "2.5.1") fail("recipe catalog version must be 2.5.1");
  const ids = new Set();
  for (const item of catalog.recipes || []) {
    if (ids.has(item.recipeId)) fail(`duplicate recipe ID: ${item.recipeId}`);
    ids.add(item.recipeId);
    const path = join(contractRoot, item.path);
    if (!existsSync(path)) { fail(`missing recipe: ${item.path}`); continue; }
    const result = await validateDocument(join(contractRoot, catalog.schema), path);
    if (!result.valid) fail(`${item.path} does not validate: ${result.errors.join("; ")}`);
  }
  if (!failures.some((item) => item.includes("recipe"))) pass(`${ids.size} built-in AssetRecipes validate`);
}

async function runScript(label, script, args = []) {
  const result = spawnSync(process.execPath, [join(repoRoot, script), ...args], { encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) fail(`${label} failed`); else pass(label);
}

async function checkRuntimeTests() {
  const testFiles = (await walk(join(repoRoot, "tests", "runtime"))).filter((path) => path.endsWith(".test.mjs"));
  const result = spawnSync(process.execPath, ["--test", ...testFiles], { cwd: repoRoot, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) fail("deterministic runtime tests failed");
  else pass(`${testFiles.length} deterministic runtime test files`);
}

async function checkWorldOsTests() {
  const testFiles = (await walk(join(repoRoot, "tests", "world-os"))).filter((path) => path.endsWith(".test.mjs"));
  const result = spawnSync(process.execPath, ["--test", ...testFiles], { cwd: repoRoot, encoding: "utf8" });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (result.status !== 0) fail("World OS tests failed");
  else pass(`${testFiles.length} World OS test files`);
}

async function checkMigration() {
  const temp = await mkdtemp(join(tmpdir(), "cineweave-v2-migrate-"));
  try {
    const source = parseJsonStrict(await readFile(join(contractRoot, "examples", "character-appearance-state.json"), "utf8"));
    source.contractVersion = "1.1.0";
    const input = join(temp, "source-v11.json"); const out = join(temp, "migrated-v2.json"); const report = join(temp, "report.json");
    await writeFile(input, JSON.stringify(source, null, 2));
    const result = spawnSync(process.execPath, [join(repoRoot, "scripts/migrate-v1.1-to-v2.mjs"), input, "--out", out, "--report", report, "--schema", join(contractRoot, "schemas/character-appearance-state.schema.json")], { encoding: "utf8" });
    if (result.status !== 0) fail(`v1.1-to-v2 migration smoke test failed: ${(result.stderr || result.stdout).trim()}`);
    else {
      const migrated = parseJsonStrict(await readFile(out, "utf8"));
      const migrationReport = parseJsonStrict(await readFile(report, "utf8"));
      if (migrated.contractVersion !== "2.0.0" || migrationReport.targetVersion !== "2.0.0" || migrationReport.validation.targetSchemaChecked !== true) fail("migration did not produce a schema-checked V2 copy");
      else pass("v1.1-to-v2 migration creates a non-destructive schema-checked copy");
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function checkSecurity() {
  const files = await walk(repoRoot);
  const textFiles = files.filter((path) => /\.(?:json|md|mjs|yaml|yml)$/.test(path));
  const patterns = [
    [/(?:api[_-]?key|access[_-]?token|secret)["'\s]*[:=]["'\s]*[A-Za-z0-9_-]{20,}/i, "possible secret"],
    [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
    [/https?:\/\/[^\s"')]+\?(?:[^\s"')]*)(?:token|signature|sig|expires)=/i, "signed URL"],
    [/(?:^|["'\s])\/(?:Users|home)\/[^\s"']+/m, "private absolute path"],
    [new RegExp(`\\b(?:${["TO", "DO"].join("")}|${["FIX", "ME"].join("")}|${["T", "BD"].join("")})\\b`), "unfinished placeholder"]
  ];
  for (const path of textFiles) {
    const content = await readFile(path, "utf8");
    for (const [pattern, label] of patterns) if (pattern.test(content)) fail(`${label} in ${relative(repoRoot, path)}`);
  }
  if (!failures.some((item) => ["possible secret", "private key", "signed URL", "private absolute path", "unfinished placeholder"].some((label) => item.includes(label)))) pass("security, privacy and placeholder scan");
}

async function main() {
  await checkJson();
  await checkNodeSyntax();
  await checkManifestContracts();
  await checkRecipeCatalog();
  await checkRuntimeTests();
  await checkWorldOsTests();
  await runScript("World OS workspace review", "packages/cineweave-world-os/bin/world-os.mjs", ["review", join(repoRoot, "examples", "multi-world-studio", "workspace.json")]);
  await runScript("V2 architecture tests", "scripts/validate-v2-architecture.mjs");
  await runScript("V2 activation and workflow tests", "scripts/validate-v2-workflows.mjs");
  await runScript("contract semantic positive and negative tests", "scripts/validate-contract-semantics.mjs", ["--self-test"]);
  await runScript("ControlBench cross-contract tests", "scripts/validate-control-bench.mjs", ["--self-test"]);
  await runScript("source Skill link tests", "scripts/validate-skill-links.mjs", [join(repoRoot, "skills")]);
  await runScript("Director reference lifecycle audit", "scripts/validate-reference-lifecycle.mjs", [join(repoRoot, "skills", "cineweave-director")]);
  await runScript("standalone Skill bundle tests", "scripts/build-skill-bundles.mjs", ["--check"]);
  await runScript("focused Skill package tests", "scripts/validate-skill-packages.mjs");
  await runScript("Original Case Atlas tests", "scripts/validate-original-case-atlas.mjs");
  await runScript("distributable asset audit", "scripts/audit-distributable-assets.mjs");
  await runScript("behavior evaluation definition tests", "scripts/run-behavior-evals.mjs", ["--validate"]);
  await runScript("evaluation fixture definition tests", "scripts/validate-eval-fixtures.mjs");
  await runScript("live Skill evaluation definition tests", "scripts/run-live-skill-evals.mjs", ["--validate"]);
  await runScript("live Skill deterministic replay", "scripts/run-live-skill-evals.mjs", ["--grade", join(repoRoot, "tests", "fixtures", "live-responses"), "--summary-only"]);
  await checkMigration();
  await checkSecurity();
  if (failures.length) {
    console.error(`\nRelease checks failed (${failures.length}):`);
    for (const item of failures) console.error(`- ${item}`);
    process.exitCode = 1;
    return;
  }
  console.log("\nCineWeave Studio v2.5.1 release checks passed.");
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
