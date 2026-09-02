#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateByKind } from "./validate-contract-semantics.mjs";
import { validateDocument, validatePayload } from "./validate-output.mjs";

const RUNNER_VERSION = "1.1.0";
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const casesPath = join(repoRoot, "tests", "behavior", "live-cases.json");
const responseSchemaPath = join(repoRoot, "tests", "behavior", "live-response.schema.json");
const runSchemaPath = join(repoRoot, "packages", "cineweave-contracts", "schemas", "skill-evaluation-run.schema.json");
const manifestPath = join(repoRoot, "packages", "cineweave-contracts", "contracts", "manifest.json");
const pluginPath = join(repoRoot, ".codex-plugin", "plugin.json");
const supportedChecks = new Set(["text_any", "text_all", "text_none", "text_ordered", "questions_min", "questions_max", "unsupported_empty", "contracts_empty", "outcome"]);

function resolveCodexInvocation() {
  if (process.platform !== "win32") return { command: "codex", prefixArgs: [] };
  const pathEntries = (process.env.PATH || "").split(delimiter).filter(Boolean);
  for (const directory of pathEntries) {
    const executable = join(directory, "codex.exe");
    if (existsSync(executable)) return { command: executable, prefixArgs: [] };
    const wrapper = join(directory, "codex.cmd");
    const cli = join(directory, "node_modules", "@openai", "codex", "bin", "codex.js");
    if (existsSync(wrapper) && existsSync(cli)) return { command: process.execPath, prefixArgs: [cli] };
  }
  throw new Error("Codex CLI was not found on PATH");
}

function installedPluginInfo(invocation, pluginName) {
  const result = spawnSync(invocation.command, [...invocation.prefixArgs, "plugin", "list", "--json"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not inspect installed plugins: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  let inventory;
  try { inventory = JSON.parse(result.stdout); }
  catch (error) { throw new Error("Codex plugin inventory was not valid JSON", { cause: error }); }
  return (inventory.installed || []).find((item) => item.name === pluginName) || null;
}

function assertInstalledCandidate(plugin, installed) {
  if (!installed?.installed || !installed?.enabled) throw new Error(`${plugin.name} ${plugin.version} must be installed and enabled before a live evaluation`);
  if (installed.version !== plugin.version) throw new Error(`Live evaluation candidate mismatch: source is ${plugin.version}, installed plugin is ${installed.version}`);
  if (installed.source?.source === "git" && installed.source?.ref !== `v${plugin.version}`) throw new Error(`Live evaluation requires immutable ref v${plugin.version}; installed ref is ${installed.source?.ref || "missing"}`);
}

function parseArgs(values) {
  const flags = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) flags[key] = true;
    else { flags[key] = next; index += 1; }
  }
  return flags;
}

function usage() {
  return [
    "node scripts/run-live-skill-evals.mjs --validate",
    "node scripts/run-live-skill-evals.mjs --plan [--case <id>] [--model <model>]",
    "node scripts/run-live-skill-evals.mjs --grade <responses-dir> [--case <id>] [--out <run.json>]",
    "node scripts/run-live-skill-evals.mjs --run --acknowledge-model-costs --model <model> --out-dir <directory> [--case <id>] [--timeout-seconds <n>]"
  ].join("\n");
}

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameStrings(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]);
}

function uniqueStringsInOrder(values) {
  return [...new Set(values)];
}

async function loadDefinitions() {
  return {
    suite: JSON.parse(await readFile(casesPath, "utf8")),
    manifest: JSON.parse(await readFile(manifestPath, "utf8")),
    plugin: JSON.parse(await readFile(pluginPath, "utf8"))
  };
}

export function validateDefinitions(suite, manifest) {
  const errors = [];
  const knownSkills = new Set((manifest.skills || []).map((item) => item.name));
  const routeOwners = new Map();
  const skillRoutes = new Map();
  for (const skill of manifest.skills || []) for (const route of skill.owns || []) routeOwners.set(route, skill.name);
  for (const skill of manifest.skills || []) skillRoutes.set(skill.name, skill.owns || []);
  const contractOwners = new Map((manifest.contracts || []).map((item) => [item.kind, item.owner]));
  add(errors, suite.syntheticInputsOnly === true, "live suite must contain synthetic inputs only");
  add(errors, suite.suiteVersion === manifest.version, "live suite version must match contract manifest");
  const ids = new Set();
  for (const item of suite.cases || []) {
    add(errors, typeof item.id === "string" && item.id.length > 2, "live case lacks an ID");
    add(errors, !ids.has(item.id), `duplicate live case ${item.id}`);
    ids.add(item.id);
    add(errors, item.expectedSkill === "none" || knownSkills.has(item.expectedSkill), `${item.id} has unknown expectedSkill`);
    if (item.expectedSkill === "none") add(errors, item.expectedRoute === null, `${item.id} must use a null route when no Skill should activate`);
    else add(errors, routeOwners.get(item.expectedRoute) === item.expectedSkill, `${item.id} route is not owned by ${item.expectedSkill}`);
    add(errors, typeof item.request === "string" && item.request.trim().length >= 4, `${item.id} request is empty`);
    add(errors, Array.isArray(item.mustNotActivate), `${item.id} mustNotActivate must be an array`);
    for (const skill of item.mustNotActivate || []) add(errors, knownSkills.has(skill), `${item.id} excludes unknown Skill ${skill}`);
    add(errors, Array.isArray(item.mustProduceAny), `${item.id} mustProduceAny must be an array`);
    for (const kind of item.mustProduceAny || []) {
      add(errors, contractOwners.has(kind), `${item.id} references unknown contract ${kind}`);
      if (item.expectedSkill !== "none") add(errors, contractOwners.get(kind) === item.expectedSkill || contractOwners.get(kind) === "suite", `${item.id} contract ${kind} is not owned by ${item.expectedSkill}`);
    }
    add(errors, Array.isArray(item.checks) && item.checks.length > 0, `${item.id} has no deterministic checks`);
    const checkIds = new Set();
    for (const check of item.checks || []) {
      add(errors, typeof check.id === "string" && check.id.length > 2, `${item.id} check lacks ID`);
      add(errors, !checkIds.has(check.id), `${item.id} duplicates check ${check.id}`);
      checkIds.add(check.id);
      add(errors, ["activation", "output", "safety"].includes(check.scope), `${item.id}/${check.id} has invalid scope`);
      add(errors, supportedChecks.has(check.type), `${item.id}/${check.id} has unsupported type ${check.type}`);
      if (["text_any", "text_all", "text_none", "text_ordered"].includes(check.type)) add(errors, Array.isArray(check.values) && check.values.length > 0, `${item.id}/${check.id} needs values`);
      if (["questions_min", "questions_max"].includes(check.type)) add(errors, Number.isInteger(check.value) && check.value >= 0 && check.value <= 3, `${item.id}/${check.id} needs a question bound`);
      if (check.type === "outcome") add(errors, ["answer", "clarify", "decline"].includes(check.value), `${item.id}/${check.id} has invalid outcome`);
    }
  }
  for (const skill of knownSkills) add(errors, (suite.cases || []).some((item) => item.expectedSkill === skill), `${skill} lacks a live positive case`);
  add(errors, (suite.cases || []).some((item) => item.expectedSkill === "none"), "live suite lacks a should-not-activate case");

  const requiredRouteCoverage = suite.requiredRouteCoverage || {};
  add(errors, isObject(requiredRouteCoverage), "requiredRouteCoverage must be an object when supplied");
  if (isObject(requiredRouteCoverage)) {
    for (const [skill, routes] of Object.entries(requiredRouteCoverage)) {
      add(errors, knownSkills.has(skill), `requiredRouteCoverage names unknown Skill ${skill}`);
      add(errors, Array.isArray(routes), `${skill} requiredRouteCoverage must be an array`);
      if (!knownSkills.has(skill) || !Array.isArray(routes)) continue;
      const ownedRoutes = skillRoutes.get(skill) || [];
      add(errors, sameStrings(routes, ownedRoutes), `${skill} requiredRouteCoverage must exactly match manifest-owned routes`);
      add(errors, new Set(routes).size === routes.length, `${skill} requiredRouteCoverage contains duplicate routes`);
      for (const route of routes) {
        add(errors, routeOwners.get(route) === skill, `${skill} required route ${route} is not owned by that Skill`);
        add(errors, (suite.cases || []).some((item) => item.expectedSkill === skill && item.expectedRoute === route), `${skill} lacks required live route ${route}`);
      }
    }
  }
  return errors;
}

export async function validatePayloadEvidence(response, manifest) {
  const errors = [];
  const payloads = Array.isArray(response?.payloads) ? response.payloads : [];
  const contracts = new Map((manifest?.contracts || []).map((item) => [item.kind, item]));
  const payloadKinds = payloads.map((entry) => entry?.kind);
  const derivedKinds = uniqueStringsInOrder(payloadKinds);
  add(errors, sameStrings(response?.contractKinds, derivedKinds), "contractKinds must exactly match unique payload kinds in first-seen order");

  for (let index = 0; index < payloads.length; index += 1) {
    const entry = payloads[index];
    const label = `payloads[${index}]`;
    if (!isObject(entry) || !isObject(entry.payload)) {
      errors.push(`${label} must contain an inline contract payload object`);
      continue;
    }
    add(errors, entry.payload.kind === entry.kind, `${label} wrapper kind must match payload.kind`);
    const contract = contracts.get(entry.kind);
    if (!contract) {
      errors.push(`${label} references unknown contract kind ${entry.kind}`);
      continue;
    }
    add(errors, contract.owner === response.selectedSkill || contract.owner === "suite", `${label} contract ${entry.kind} is owned by ${contract.owner}, not ${response.selectedSkill}`);
    const schemaResult = await validatePayload(join(contractRoot, contract.schema), entry.payload);
    for (const error of schemaResult.errors) errors.push(`${label} schema: ${error}`);
    if (schemaResult.valid) {
      for (const error of validateByKind(entry.payload)) errors.push(`${label} semantic: ${error}`);
    }
  }

  return { valid: errors.length === 0, errors, contractKinds: derivedKinds };
}

function contains(text, value) {
  return text.toLocaleLowerCase().includes(String(value).toLocaleLowerCase());
}

function checkResult(check, response) {
  const text = response.response || "";
  let passed = false;
  let message;
  if (check.type === "text_any") {
    passed = check.values.some((value) => contains(text, value));
    message = passed ? "Response contains at least one required expression." : `Response lacks all of: ${check.values.join(", ")}`;
  } else if (check.type === "text_all") {
    const missing = check.values.filter((value) => !contains(text, value));
    passed = missing.length === 0;
    message = passed ? "Response contains every required expression." : `Response lacks: ${missing.join(", ")}`;
  } else if (check.type === "text_none") {
    const found = check.values.filter((value) => contains(text, value));
    passed = found.length === 0;
    message = passed ? "Response excludes forbidden expressions." : `Response contains forbidden expressions: ${found.join(", ")}`;
  } else if (check.type === "text_ordered") {
    let cursor = -1;
    const source = text.toLocaleLowerCase();
    passed = check.values.every((value) => {
      const next = source.indexOf(String(value).toLocaleLowerCase(), cursor + 1);
      if (next < 0) return false;
      cursor = next;
      return true;
    });
    message = passed ? "Response preserves the required observation order." : `Response does not preserve order: ${check.values.join(" → ")}`;
  } else if (check.type === "questions_min") {
    passed = response.questions.length >= check.value;
    message = `${response.questions.length} questions; minimum ${check.value}.`;
  } else if (check.type === "questions_max") {
    passed = response.questions.length <= check.value;
    message = `${response.questions.length} questions; maximum ${check.value}.`;
  } else if (check.type === "unsupported_empty") {
    passed = response.unsupportedClaims.length === 0;
    message = passed ? "No unsupported claims were reported." : `${response.unsupportedClaims.length} unsupported claims were reported.`;
  } else if (check.type === "contracts_empty") {
    passed = response.contractKinds.length === 0;
    message = passed ? "No CineWeave contract was emitted." : `Unexpected contracts: ${response.contractKinds.join(", ")}`;
  } else if (check.type === "outcome") {
    passed = response.outcome === check.value;
    message = `Outcome ${response.outcome}; expected ${check.value}.`;
  }
  return { checkId: check.id, scope: check.scope, status: passed ? "pass" : "fail", message };
}

function gradeResponse(item, response, transcriptRef = null) {
  const checks = [];
  checks.push({ checkId: "activation.skill", scope: "activation", status: response.selectedSkill === item.expectedSkill ? "pass" : "fail", message: `Selected ${response.selectedSkill}; expected ${item.expectedSkill}.` });
  checks.push({ checkId: "activation.route", scope: "activation", status: response.route === item.expectedRoute ? "pass" : "fail", message: `Route ${response.route}; expected ${item.expectedRoute}.` });
  for (const skill of item.mustNotActivate || []) checks.push({ checkId: `activation.not.${skill}`, scope: "activation", status: response.selectedSkill !== skill ? "pass" : "fail", message: response.selectedSkill === skill ? `Forbidden Skill activated: ${skill}.` : `${skill} did not activate.` });
  if ((item.mustProduceAny || []).length) {
    const matched = item.mustProduceAny.filter((kind) => response.contractKinds.includes(kind));
    checks.push({ checkId: "output.contract.any", scope: "output", status: matched.length ? "pass" : "fail", message: matched.length ? `Produced accepted contract ${matched[0]}.` : `Expected one of: ${item.mustProduceAny.join(", ")}.` });
  }
  for (const check of item.checks || []) checks.push(checkResult(check, response));
  const secrets = /(?:sk-[a-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|[?&](?:token|signature|sig)=)/i.test(JSON.stringify(response));
  checks.push({ checkId: "safety.secret-scan", scope: "safety", status: secrets ? "fail" : "pass", message: secrets ? "Response contains a possible secret." : "Response passes the secret scan." });
  return {
    caseId: item.id,
    status: checks.every((check) => check.status === "pass") ? "pass" : "fail",
    selectedSkill: response.selectedSkill,
    route: response.route,
    responseHash: sha256Canonical(response),
    transcriptRef,
    checks,
    errors: []
  };
}

function errorResult(item, error, transcriptRef = null) {
  return { caseId: item.id, status: "error", selectedSkill: null, route: null, responseHash: null, transcriptRef, checks: [], errors: [String(error?.message || error).slice(0, 1200)] };
}

function selectCases(suite, selectedId) {
  if (!selectedId) return [...suite.cases];
  const found = suite.cases.find((item) => item.id === selectedId);
  if (!found) throw new Error(`Unknown live case: ${selectedId}`);
  return [found];
}

function runCommand(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: process.env, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, options.timeoutMs);
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolvePromise({ code, signal, timedOut, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") });
    });
    child.stdin.end(options.input || "");
  });
}

function evaluationPrompt(item) {
  return [
    "You are running one isolated CineWeave Studio Skill evaluation.",
    "Do not call tools, modify files, browse, or claim that media or an external action completed.",
    "Select the one installed CineWeave Skill whose documented goal and route best match the request; select none when the request is outside CineWeave.",
    "Follow that Skill's workflow boundary and answer the user's request in Chinese.",
    "Return only one JSON object matching the supplied response schema.",
    `Set caseId exactly to ${JSON.stringify(item.id)}.`,
    "selectedSkill must be the exact Skill name or none. route must be its exact route or null.",
    "payloads must contain the complete inline JSON object for every emitted CineWeave contract; prose alone is not a contract.",
    "contractKinds must exactly equal the unique payload kind values in first-seen order. Never list a contract kind without its schema-valid payload.",
    "unsupportedClaims lists any claim you could not support.",
    "",
    "User request:",
    item.request
  ].join("\n");
}

async function readAndGrade(item, responsePath, manifest, transcriptRef = null) {
  const schemaResult = await validateDocument(responseSchemaPath, responsePath);
  if (!schemaResult.valid) throw new Error(`Response schema failed: ${schemaResult.errors.join("; ")}`);
  if (schemaResult.payload.caseId !== item.id) throw new Error(`Response caseId ${schemaResult.payload.caseId} does not match ${item.id}`);
  const evidence = await validatePayloadEvidence(schemaResult.payload, manifest);
  if (!evidence.valid) throw new Error(`Response payload evidence failed: ${evidence.errors.join("; ")}`);
  return gradeResponse(item, { ...schemaResult.payload, contractKinds: evidence.contractKinds }, transcriptRef);
}

function environmentInfo(plugin, mode, model, installedPlugin = null) {
  const invocation = mode === "live_codex" ? resolveCodexInvocation() : null;
  const codex = invocation ? spawnSync(invocation.command, [...invocation.prefixArgs, "--version"], { encoding: "utf8" }) : null;
  const commit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  return {
    platform: ["win32", "linux", "darwin"].includes(process.platform) ? process.platform : "other",
    nodeVersion: process.version,
    codexVersion: codex?.status === 0 ? codex.stdout.trim() : null,
    model: model || null,
    pluginVersion: mode === "live_codex" ? installedPlugin?.version || plugin.version : plugin.version,
    pluginSourceRef: mode === "live_codex" ? installedPlugin?.source?.ref || null : null,
    gitCommit: commit.status === 0 ? commit.stdout.trim() : "0000000",
    sandbox: mode === "live_codex" ? "read-only" : "fixture-replay"
  };
}

function buildRun({ suite, plugin, cases, results, mode, model, startedAt, finishedAt, command, installedPlugin = null }) {
  const scoped = (scope) => results.flatMap((result) => result.checks).filter((check) => scope.includes(check.scope));
  const activation = scoped(["activation"]);
  const output = scoped(["output", "safety"]);
  const rate = (checks) => checks.length ? checks.filter((check) => check.status === "pass").length / checks.length : 1;
  return {
    kind: "cineweave_skill_evaluation_run",
    contractVersion: "2.3.0",
    runId: `eval.${mode}.${randomUUID().toLowerCase()}`,
    runnerVersion: RUNNER_VERSION,
    suiteVersion: suite.suiteVersion,
    mode,
    startedAt,
    finishedAt,
    dataset: { datasetId: suite.datasetId, contentHash: sha256Canonical(suite), caseIds: cases.map((item) => item.id) },
    environment: environmentInfo(plugin, mode, model, installedPlugin),
    results,
    summary: {
      total: results.length,
      passed: results.filter((item) => item.status === "pass").length,
      failed: results.filter((item) => item.status === "fail").length,
      errors: results.filter((item) => item.status === "error").length,
      activationPassRate: rate(activation),
      outputPassRate: rate(output),
      releaseGatePassed: results.every((item) => item.status === "pass")
    },
    privacy: { syntheticInputsOnly: true, userAssetsIncluded: false, secretsScanned: true, rawResponsePolicy: mode === "live_codex" ? "local_uncommitted" : "discarded" },
    reproducibility: { command, caseOrderStable: true, graderDeterministic: true }
  };
}

async function validateRun(run, outputPath) {
  const temporaryRoot = outputPath ? null : await mkdtemp(join(tmpdir(), "cineweave-live-run-"));
  const target = outputPath || join(temporaryRoot, "run.json");
  try {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(run, null, 2)}\n`, outputPath ? { encoding: "utf8", flag: "wx" } : "utf8");
    const validation = await validateDocument(runSchemaPath, target);
    if (!validation.valid) throw new Error(`EvaluationRun schema failed: ${validation.errors.join("; ")}`);
    return target;
  } finally {
    if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function gradeDirectory({ suite, manifest, plugin, cases, directory, outputPath }) {
  const startedAt = new Date().toISOString();
  const results = [];
  for (const item of cases) {
    const path = join(directory, `${item.id}.json`);
    try {
      if (!existsSync(path)) throw new Error(`Missing response: ${path}`);
      results.push(await readAndGrade(item, path, manifest));
    } catch (error) { results.push(errorResult(item, error)); }
  }
  const finishedAt = new Date().toISOString();
  const run = buildRun({ suite, plugin, cases, results, mode: "fixture_replay", model: null, startedAt, finishedAt, command: "node scripts/run-live-skill-evals.mjs --grade tests/fixtures/live-responses" });
  await validateRun(run, outputPath);
  return run;
}

async function runLive({ suite, manifest, plugin, cases, directory, model, timeoutSeconds }) {
  const invocation = resolveCodexInvocation();
  const installedPlugin = installedPluginInfo(invocation, plugin.name);
  assertInstalledCandidate(plugin, installedPlugin);
  await mkdir(directory, { recursive: true });
  const work = await mkdtemp(join(tmpdir(), "cineweave-live-codex-"));
  const results = [];
  const startedAt = new Date().toISOString();
  try {
    for (const item of cases) {
      const responsePath = join(directory, `${item.id}.json`);
      const eventsName = `${item.id}.events.jsonl`;
      const eventsPath = join(directory, eventsName);
      const stderrPath = join(directory, `${item.id}.stderr.txt`);
      if ([responsePath, eventsPath, stderrPath].some((path) => existsSync(path))) throw new Error(`Refusing to overwrite an existing live eval file for ${item.id}`);
      const args = [
        "exec",
        "--ephemeral",
        "--sandbox", "read-only",
        "--skip-git-repo-check",
        "--ignore-rules",
        "--color", "never",
        "--json",
        "--output-schema", responseSchemaPath,
        "--output-last-message", responsePath,
        "--model", model,
        "-C", work,
        "-"
      ];
      try {
        const processResult = await runCommand(invocation.command, [...invocation.prefixArgs, ...args], { cwd: work, timeoutMs: timeoutSeconds * 1000, input: evaluationPrompt(item) });
        await writeFile(eventsPath, processResult.stdout, { encoding: "utf8", flag: "wx" });
        await writeFile(stderrPath, processResult.stderr, { encoding: "utf8", flag: "wx" });
        if (processResult.timedOut) throw new Error(`Codex timed out after ${timeoutSeconds} seconds`);
        if (processResult.code !== 0) throw new Error(`Codex exited ${processResult.code}: ${processResult.stderr.trim().slice(0, 800)}`);
        results.push(await readAndGrade(item, responsePath, manifest, eventsName));
      } catch (error) { results.push(errorResult(item, error, existsSync(eventsPath) ? eventsName : null)); }
    }
  } finally { await rm(work, { recursive: true, force: true }); }
  const finishedAt = new Date().toISOString();
  const command = `node scripts/run-live-skill-evals.mjs --run --acknowledge-model-costs --model ${model} --out-dir .cineweave-evals/run`;
  const run = buildRun({ suite, plugin, cases, results, mode: "live_codex", model, startedAt, finishedAt, command, installedPlugin });
  const runPath = join(directory, "evaluation-run.json");
  await validateRun(run, runPath);
  return { run, runPath };
}

async function validateCommittedFixtures(suite, manifest) {
  const directory = join(repoRoot, "tests", "fixtures", "live-responses");
  const errors = [];
  for (const item of suite.cases || []) {
    const path = join(directory, `${item.id}.json`);
    if (!existsSync(path)) { errors.push(`${item.id}: missing committed replay response`); continue; }
    const result = await validateDocument(responseSchemaPath, path);
    if (!result.valid) { errors.push(`${item.id}: ${result.errors.join("; ")}`); continue; }
    if (result.payload.caseId !== item.id) { errors.push(`${item.id}: response caseId is ${result.payload.caseId}`); continue; }
    const evidence = await validatePayloadEvidence(result.payload, manifest);
    if (!evidence.valid) errors.push(`${item.id}: ${evidence.errors.join("; ")}`);
  }
  return errors;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const modes = ["validate", "plan", "grade", "run"].filter((key) => flags[key]);
  if (modes.length !== 1 || flags.case === true) throw new Error(usage());
  const { suite, manifest, plugin } = await loadDefinitions();
  const definitionErrors = validateDefinitions(suite, manifest);
  if (definitionErrors.length) throw new Error(`Live evaluation definitions failed:\n${definitionErrors.map((item) => `- ${item}`).join("\n")}`);
  const fixtureErrors = await validateCommittedFixtures(suite, manifest);
  if (fixtureErrors.length) throw new Error(`Live replay fixtures failed:\n${fixtureErrors.map((item) => `- ${item}`).join("\n")}`);
  const cases = selectCases(suite, flags.case);
  if (flags.validate) {
    console.log(`Live Skill evaluation definitions pass: ${suite.cases.length} synthetic cases, ${manifest.skills.length} Skills, deterministic replay fixtures present.`);
    return;
  }
  if (flags.plan) {
    const invocation = resolveCodexInvocation();
    const installedPlugin = installedPluginInfo(invocation, plugin.name);
    const environment = environmentInfo(plugin, "live_codex", flags.model || null, installedPlugin);
    const candidateMatches = installedPlugin?.enabled === true && installedPlugin?.version === plugin.version && (installedPlugin?.source?.source !== "git" || installedPlugin?.source?.ref === `v${plugin.version}`);
    console.log(JSON.stringify({ mode: "plan_only", model: flags.model || null, codexVersion: environment.codexVersion, codexCliReady: Boolean(environment.codexVersion), sourcePluginVersion: plugin.version, installedPluginVersion: installedPlugin?.version || null, installedPluginRef: installedPlugin?.source?.ref || null, installedCandidateMatches: candidateMatches, cases: cases.map((item) => ({ id: item.id, expectedSkill: item.expectedSkill, expectedRoute: item.expectedRoute, promptHash: sha256Canonical(evaluationPrompt(item)) })), requiresExplicitCostAcknowledgement: true, externalEffects: false }, null, 2));
    return;
  }
  if (flags.grade) {
    if (flags.grade === true) throw new Error(usage());
    const outputPath = flags.out && flags.out !== true ? resolve(flags.out) : null;
    const run = await gradeDirectory({ suite, manifest, plugin, cases, directory: resolve(flags.grade), outputPath });
    console.log(JSON.stringify(flags["summary-only"] === true ? run.summary : run, null, 2));
    if (!run.summary.releaseGatePassed) process.exitCode = 1;
    return;
  }
  if (flags.run) {
    if (flags["acknowledge-model-costs"] !== true || !flags.model || flags.model === true || !flags["out-dir"] || flags["out-dir"] === true) throw new Error(usage());
    const timeoutSeconds = Number(flags["timeout-seconds"] || 180);
    if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 30 || timeoutSeconds > 900) throw new Error("timeout-seconds must be an integer from 30 to 900");
    const { run, runPath } = await runLive({ suite, manifest, plugin, cases, directory: resolve(flags["out-dir"]), model: flags.model, timeoutSeconds });
    console.log(JSON.stringify({ runPath, summary: run.summary }, null, 2));
    if (!run.summary.releaseGatePassed) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 2;
  });
}
