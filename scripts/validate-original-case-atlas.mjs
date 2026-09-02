#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalize, parseJsonStrict, sha256Bytes, sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateByKind } from "./validate-contract-semantics.mjs";
import { validatePayload } from "./validate-output.mjs";
import { inspectStaticSvg } from "./svg-safety.mjs";
import { ATLAS_GENERATOR_VERSION, renderOriginalCaseSvg } from "../skills/cineweave-prompt/scripts/generate-original-case-atlas.mjs";
import { planOriginalCaseLoads } from "../skills/cineweave-prompt/scripts/route-original-case-atlas.mjs";

const defaultRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const ORIGINAL_CASE_CATEGORIES = Object.freeze([
  "portrait",
  "product",
  "food",
  "architecture",
  "editorial",
  "diagrams",
  "exact-text"
]);

const domainByCategory = Object.freeze({
  portrait: "portrait",
  product: "product",
  food: "food",
  architecture: "architecture",
  editorial: "editorial",
  diagrams: "technical",
  "exact-text": "technical"
});

const forbiddenIndexKeys = new Set(["prompt", "candidate", "visualSpec", "adapterContext", "reviewEvidence", "reproduction"]);
const contradictoryClaimPatterns = Object.freeze([
  /\b(?:human review|human reviewers?|reviewers?).{0,64}\b(?:completed|complete|approved|reviewed|accepted|validated|passed|confirmed|successful(?:ly)?)\b/iu,
  /\b(?:completed|approved|validated|confirmed|successful)\b.{0,48}\b(?:human review|human reviewers?|reviewers?)\b/iu,
  /\b(?:provider|model).{0,48}\b(?:quality|output).{0,48}\b(?:is|was|are|were|looks?|proved|rated|scored)\s+(?:excellent|good|great|high|approved|validated|acceptable|passing|production[- ]ready)\b/iu,
  /\b(?:excellent|good|great|high[- ]quality|approved|validated|production[- ]ready)\b.{0,48}\b(?:provider|model) (?:quality|output)\b/iu,
  /\bguarantee[sd]?.{0,64}\bpixel[- ](?:identical|equivalent|perfect)\b/iu,
  /\b(?:cross[- ]platform|every platform|all platforms?).{0,80}\b(?:font|rendering|pixels?).{0,48}\b(?:is|are|was|were|remain(?:s|ed)?)\s+(?:identical|equivalent|consistent|the same)\b/iu,
  /\b(?:font rendering|pixels?).{0,48}\b(?:is|are|was|were)\s+(?:identical|equivalent).{0,80}\b(?:cross[- ]platform|every platform|all platforms?)\b/iu,
  /人工.{0,16}(?:已审核|已批准|已通过|已完成|已确认|认可)/u,
  /(?:供应商|模型).{0,20}(?:输出|质量).{0,20}(?:优秀|优质|已验证|已通过|可发布)/u,
  /(?:全平台|跨平台).{0,20}(?:字体|渲染|像素).{0,20}(?:完全)?一致/u
]);

function add(errors, condition, message) {
  if (!condition) errors.push(message);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = text.indexOf(needle, offset)) !== -1) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

function sameArray(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function sameMembers(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function exactJson(left, right) {
  try { return canonicalize(left) === canonicalize(right); }
  catch { return false; }
}

function collectForbiddenIndexKeys(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectForbiddenIndexKeys(item, found);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenIndexKeys.has(key)) found.add(key);
      collectForbiddenIndexKeys(child, found);
    }
  }
  return found;
}

function collectStringValues(value, found = []) {
  if (typeof value === "string") found.push(value.normalize("NFKC"));
  else if (Array.isArray(value)) for (const item of value) collectStringValues(item, found);
  else if (value && typeof value === "object") for (const child of Object.values(value)) collectStringValues(child, found);
  return found;
}

async function listEntries(path) {
  return (await readdir(path, { withFileTypes: true }))
    .map((entry) => entry.isFile() ? entry.name : `${entry.name}/`)
    .sort();
}

async function parseFile(path) {
  const text = await readFile(path, "utf8");
  return { text, payload: parseJsonStrict(text) };
}

export async function readOriginalCaseAtlas(repoRoot = defaultRepoRoot) {
  const root = resolve(repoRoot);
  const skillRoot = join(root, "skills", "cineweave-prompt");
  const atlasRoot = join(skillRoot, "references", "original-case-atlas");
  const categoryRoot = join(atlasRoot, "categories");
  const caseRoot = join(atlasRoot, "cases");
  const candidateRoot = join(skillRoot, "assets", "original-case-atlas");
  const generatorPath = join(skillRoot, "scripts", "generate-original-case-atlas.mjs");
  const evalPath = join(root, "tests", "fixtures", "evals", "original-case-atlas-evals.json");

  const [indexFile, rightsFile, evalFile, generatorBytes, categoryEntries, caseEntries, candidateEntries] = await Promise.all([
    parseFile(join(atlasRoot, "index.json")),
    parseFile(join(atlasRoot, "rights", "license-profile.json")),
    parseFile(evalPath),
    readFile(generatorPath),
    listEntries(categoryRoot),
    listEntries(caseRoot),
    listEntries(candidateRoot)
  ]);

  const cases = Object.create(null);
  await Promise.all(ORIGINAL_CASE_CATEGORIES.map(async (category) => {
    const [caseFile, categoryDocument, candidateBytes] = await Promise.all([
      parseFile(join(caseRoot, `${category}-original.case.json`)),
      readFile(join(categoryRoot, `${category}.md`), "utf8"),
      readFile(join(candidateRoot, `${category}-original.svg`))
    ]);
    cases[category] = {
      caseText: caseFile.text,
      payload: caseFile.payload,
      categoryDocument,
      candidateBytes
    };
  }));

  return {
    repoRoot: root,
    atlasRoot,
    skillRoot,
    indexText: indexFile.text,
    index: indexFile.payload,
    rightsText: rightsFile.text,
    rights: rightsFile.payload,
    evalText: evalFile.text,
    evalFixture: evalFile.payload,
    generatorBytes,
    inventories: { categories: categoryEntries, cases: caseEntries, candidates: candidateEntries },
    cases
  };
}

async function appendSchemaErrors(errors, label, schemaPath, payload) {
  const result = await validatePayload(schemaPath, payload);
  for (const error of result.errors) errors.push(`${label} schema: ${error}`);
}

export async function validateOriginalCaseAtlasSnapshot(snapshot) {
  const errors = [];
  const contractRoot = join(snapshot.repoRoot, "packages", "cineweave-contracts");
  const atlasRoot = snapshot.atlasRoot;
  const expectedCategoryFiles = ORIGINAL_CASE_CATEGORIES.map((category) => `${category}.md`).sort();
  const expectedCaseFiles = ORIGINAL_CASE_CATEGORIES.map((category) => `${category}-original.case.json`).sort();
  const expectedCandidateFiles = ORIGINAL_CASE_CATEGORIES.map((category) => `${category}-original.svg`).sort();

  add(errors, sameArray(snapshot.inventories.categories, expectedCategoryFiles), "atlas categories directory must contain exactly the seven routed category pages");
  add(errors, sameArray(snapshot.inventories.cases, expectedCaseFiles), "atlas cases directory must contain exactly one case for each routed category");
  add(errors, sameArray(snapshot.inventories.candidates, expectedCandidateFiles), "atlas candidate directory must contain exactly one SVG for each routed category");

  await appendSchemaErrors(errors, "index", join(atlasRoot, "index.schema.json"), snapshot.index);
  add(errors, Buffer.byteLength(snapshot.indexText, "utf8") <= 12 * 1024, "routing index must remain at or below 12 KiB");
  const forbiddenKeys = [...collectForbiddenIndexKeys(snapshot.index)];
  add(errors, forbiddenKeys.length === 0, `routing index must not embed case payload keys: ${forbiddenKeys.join(", ")}`);
  add(errors, !snapshot.indexText.includes(".svg"), "routing index must not embed or directly load candidate SVG paths");

  const routes = new Map();
  const routeCategories = [];
  const routeCaseIds = [];
  for (const route of snapshot.index?.categories || []) {
    routeCategories.push(route?.category);
    for (const caseId of route?.caseIds || []) routeCaseIds.push(caseId);
    if (!routes.has(route?.category)) routes.set(route?.category, route);
  }
  add(errors, new Set(routeCategories).size === routeCategories.length, "routing index categories must be unique");
  add(errors, sameMembers(routeCategories, ORIGINAL_CASE_CATEGORIES), "routing index must close over exactly the seven supported categories");
  add(errors, new Set(routeCaseIds).size === routeCaseIds.length, "routing index case IDs must be globally unique");

  await appendSchemaErrors(errors, "rights profile", join(contractRoot, "schemas", "license-profile.schema.json"), snapshot.rights);
  for (const error of validateByKind(snapshot.rights)) errors.push(`rights profile semantics: ${error}`);
  add(errors, snapshot.rights?.status === "verified", "atlas rights profile must remain verified");
  add(errors, snapshot.rights?.commercialUse === "allowed", "atlas rights profile must allow commercial use");
  add(errors, snapshot.rights?.redistribution === "allowed", "atlas rights profile must allow redistribution");
  add(errors, snapshot.rights?.derivativeUse === "allowed", "atlas rights profile must allow derivatives");
  add(errors, snapshot.rights?.identityRights?.publication === "allowed", "atlas rights profile must allow publication");
  add(errors, snapshot.rights?.identityRights?.likenessConsent === "not_applicable", "atlas fixtures must not require a real-person likeness");
  add(errors, snapshot.rights?.assetRights?.ownership === "creator_owned", "atlas SVG fixtures must remain creator-owned");
  add(errors, snapshot.rights?.assetRights?.generationUse === "allowed" && snapshot.rights?.assetRights?.publication === "allowed", "atlas asset rights must allow generation use and publication");
  add(errors, Array.isArray(snapshot.rights?.dependencies) && snapshot.rights.dependencies.length === 0, "atlas rights profile must not acquire third-party dependencies");
  add(errors, (snapshot.rights?.evidence || []).every((item) => item?.status === "verified"), "all atlas rights evidence must remain verified");

  const rightsHash = sha256Canonical(snapshot.rights);
  const generatorHash = sha256Bytes(Buffer.from(snapshot.generatorBytes));
  const caseIds = new Set();
  const promptIds = new Set();

  for (const category of ORIGINAL_CASE_CATEGORIES) {
    const label = `case ${category}`;
    const entry = snapshot.cases[category];
    const payload = entry?.payload;
    const route = routes.get(category);
    if (!entry || !payload) {
      errors.push(`${label} is missing`);
      continue;
    }

    await appendSchemaErrors(errors, label, join(atlasRoot, "case.schema.json"), payload);
    await appendSchemaErrors(errors, `${label} PromptRecord`, join(contractRoot, "schemas", "prompt-record.schema.json"), payload?.prompt?.record);
    for (const error of validateByKind(payload?.prompt?.record)) errors.push(`${label} PromptRecord semantics: ${error}`);

    const expectedCaseId = `case.atlas.${category}-original`;
    const expectedPromptId = `atlas-${category}-original`;
    const otherCategories = ORIGINAL_CASE_CATEGORIES.filter((item) => item !== category);
    add(errors, payload?.caseId === expectedCaseId, `${label} caseId must match its category and filename`);
    add(errors, payload?.category === category, `${label} payload category must match its filename`);
    add(errors, !caseIds.has(payload?.caseId), `${label} duplicates caseId ${payload?.caseId}`);
    caseIds.add(payload?.caseId);
    add(errors, payload?.prompt?.record?.promptId === expectedPromptId, `${label} PromptRecord ID must match the case category`);
    add(errors, !promptIds.has(payload?.prompt?.record?.promptId), `${label} duplicates PromptRecord ID ${payload?.prompt?.record?.promptId}`);
    promptIds.add(payload?.prompt?.record?.promptId);
    add(errors, payload?.prompt?.record?.version === 1, `${label} must bind an explicit PromptRecord version 1`);
    add(errors, payload?.prompt?.record?.domain === domainByCategory[category], `${label} PromptRecord domain must be ${domainByCategory[category]}`);
    add(errors, payload?.prompt?.contentHash === sha256Canonical(payload?.prompt?.record), `${label} prompt contentHash is stale`);

    add(errors, route?.referencePath === `categories/${category}.md`, `${label} index referencePath must route only to categories/${category}.md`);
    add(errors, exactJson(route?.caseIds, [expectedCaseId]), `${label} index route must expose exactly its own case ID`);
    add(errors, payload?.routing?.categoryPath === `../categories/${category}.md`, `${label} categoryPath crosses category boundaries`);
    add(errors, exactJson(payload?.routing?.triggers, route?.triggers), `${label} triggers must exactly match the routing index`);
    add(errors, sameMembers(payload?.routing?.excludedCategories, otherCategories), `${label} must exclude exactly the other six categories`);
    add(errors, payload?.reproduction?.caseSelector === category, `${label} reproduction selector must match its category`);

    const page = String(entry.categoryDocument || "");
    add(errors, Buffer.byteLength(page, "utf8") <= 4 * 1024, `${label} category page must remain small`);
    add(errors, page.includes("index.json"), `${label} category page must identify index routing`);
    add(errors, page.includes(`../cases/${category}-original.case.json`), `${label} category page must link its own case`);
    add(errors, page.includes(`../../../assets/original-case-atlas/${category}-original.svg`), `${label} category page must link its own candidate`);
    add(errors, page.includes("../rights/license-profile.json"), `${label} category page must link the shared rights profile`);
    add(errors, page.includes("../../../scripts/generate-original-case-atlas.mjs"), `${label} category page must link the deterministic generator`);
    for (const other of otherCategories) {
      add(errors, !page.includes(`case.atlas.${other}-original`) && !page.includes(`../cases/${other}-original.case.json`) && !page.includes(`${other}-original.svg`), `${label} category page must not load ${other} artifacts`);
    }
    add(errors, !page.includes("cineweave_codex_prompt_record") && !page.includes('"positive"'), `${label} category page must not embed the full PromptRecord`);

    add(errors, payload?.adapterContext?.implementationContentHash === generatorHash, `${label} adapter implementation hash is stale`);
    add(errors, payload?.reproduction?.generatorVersion === ATLAS_GENERATOR_VERSION, `${label} generator version does not match the implementation`);
    add(errors, payload?.rights?.profileContentHash === rightsHash, `${label} rights profile hash is stale`);
    add(errors, payload?.rights?.creatorOwned === true && payload?.rights?.thirdPartyAssets === false, `${label} must bind creator-owned, third-party-free rights`);
    add(errors, payload?.rights?.redistribution === "allowed" && payload?.rights?.publication === "allowed", `${label} must permit redistribution and publication`);

    const candidateBytes = Buffer.from(entry.candidateBytes);
    const candidateText = new TextDecoder("utf-8", { fatal: true }).decode(candidateBytes);
    const candidateHash = sha256Bytes(candidateBytes);
    const expectedCandidatePath = `../../assets/original-case-atlas/${category}-original.svg`;
    add(errors, payload?.candidate?.path === expectedCandidatePath, `${label} candidate path must remain category-local`);
    add(errors, payload?.candidate?.byteLength === candidateBytes.byteLength, `${label} candidate byteLength is stale`);
    add(errors, payload?.candidate?.contentHash === candidateHash, `${label} candidate contentHash is stale`);
    add(errors, payload?.reviewEvidence?.candidateContentHash === candidateHash, `${label} review evidence does not bind the candidate bytes`);
    add(errors, payload?.reproduction?.expectedContentHash === candidateHash, `${label} reproduction hash does not bind the candidate bytes`);

    const rebuiltBytes = Buffer.from(renderOriginalCaseSvg(payload), "utf8");
    add(errors, rebuiltBytes.equals(candidateBytes), `${label} candidate is not byte-identical to deterministic reconstruction`);
    for (const unsafeKind of inspectStaticSvg(candidateText)) {
      errors.push(`${label} candidate contains forbidden active or external SVG content: ${unsafeKind}`);
    }
    add(errors, candidateText.startsWith(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900"`), `${label} candidate must declare the fixed 1200x900 SVG canvas`);
    for (const element of payload?.visualSpec?.elements || []) {
      add(errors, candidateText.includes(`data-element="${element}"`), `${label} candidate is missing declared element ${element}`);
    }
    for (const literal of payload?.visualSpec?.exactText || []) {
      add(errors, literal === literal.normalize("NFC"), `${label} exactText must be NFC: ${literal}`);
      add(errors, countOccurrences(candidateText, escapeXml(literal)) === 1, `${label} candidate must contain exact text once: ${literal}`);
    }
    const fontFamilies = [...candidateText.matchAll(/font-family="([^"]+)"/gu)].map((match) => match[1]);
    add(errors, fontFamilies.length > 0 && fontFamilies.every((value) => value === "system-ui, sans-serif"), `${label} must use only the declared system-font fallback`);

    add(errors, payload?.reviewEvidence?.humanReview?.status === "not_performed" && payload?.reviewEvidence?.humanReview?.reviewerCount === 0, `${label} must not imply a completed human review`);
    add(errors, exactJson(payload?.reviewEvidence?.notAssessed, ["human aesthetic quality", "provider generation quality", "cross-platform font pixel equivalence"]), `${label} must retain the closed unassessed-quality set`);
    const boundary = payload?.claimsBoundary;
    add(errors, boundary?.scope === "mechanical_fixture_only", `${label} claims must remain mechanical-fixture-only`);
    add(errors, boundary?.humanReview === "not_performed", `${label} claims must state that human review was not performed`);
    add(errors, boundary?.providerOutput === "not_generated" && boundary?.providerQuality === "not_assessed", `${label} claims must not imply provider output or quality evidence`);
    add(errors, boundary?.photorealism === "not_assessed" && boundary?.domainFitness === "not_assessed", `${label} claims must leave photorealism and domain fitness unassessed`);
    add(errors, boundary?.crossPlatformFontPixels === "not_guaranteed", `${label} claims must not guarantee cross-platform font pixels`);
    for (const claimText of collectStringValues(payload)) {
      for (const pattern of contradictoryClaimPatterns) add(errors, !pattern.test(claimText), `${label} contains a contradictory human, provider or pixel-equivalence claim`);
    }
  }

  const evalCases = snapshot.evalFixture?.cases || [];
  const evalCategories = evalCases.map((item) => item?.category);
  add(errors, snapshot.evalFixture?.suite === "cineweave-original-case-atlas", "atlas eval fixture must use the dedicated suite name");
  add(errors, sameMembers(evalCategories, ORIGINAL_CASE_CATEGORIES), "atlas eval fixture must cover exactly the seven categories");
  add(errors, new Set(evalCategories).size === evalCategories.length, "atlas eval fixture categories must be unique");
  for (const category of ORIGINAL_CASE_CATEGORIES) {
    const item = evalCases.find((candidate) => candidate?.category === category);
    const expectedLoads = [
      "references/original-case-atlas/index.json",
      `references/original-case-atlas/categories/${category}.md`
    ];
    add(errors, item?.route === "prompt_design", `eval ${category} must exercise prompt_design`);
    add(errors, sameArray(item?.loads, expectedLoads), `eval ${category} must declare the index first and only its matching category page`);
    try {
      const plan = planOriginalCaseLoads(snapshot.index, item?.prompt);
      add(errors, plan.status === "matched" && plan.category === category, `eval ${category} request must execute to exactly its declared category`);
      add(errors, sameArray(plan.loads, expectedLoads) && sameArray(plan.loads, item?.loads), `eval ${category} executed route must observe exactly the declared two resource loads`);
    } catch (error) {
      errors.push(`eval ${category} route planning failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { valid: errors.length === 0, errors, caseCount: caseIds.size, rightsHash, generatorHash };
}

export async function validateOriginalCaseAtlas({ repoRoot = defaultRepoRoot } = {}) {
  return validateOriginalCaseAtlasSnapshot(await readOriginalCaseAtlas(repoRoot));
}

async function main(args) {
  let repoRoot = defaultRepoRoot;
  if (args.length) {
    if (args.length !== 2 || args[0] !== "--root") throw new Error("Usage: node scripts/validate-original-case-atlas.mjs [--root <repository-root>]");
    repoRoot = resolve(args[1]);
  }
  const result = await validateOriginalCaseAtlas({ repoRoot });
  if (!result.valid) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Original Case Atlas passes: ${result.caseCount} routed, rights-cleared, byte-reproducible cases.`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 2;
  });
}
