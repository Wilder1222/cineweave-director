#!/usr/bin/env node

import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalize, parseJsonStrict, sha256Bytes } from "./canonical-json.mjs";
import { validateDocument } from "./validate-output.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(scriptDirectory);

const SKILL_NAME = "cineweave-director";
const SKILL_PREFIX = `skills/${SKILL_NAME}`;
const PLUGIN_PATH = ".codex-plugin/plugin.json";
const MARKETPLACE_PATH = ".agents/plugins/marketplace.json";
const LICENSE_PATH = "LICENSE";
const EXPECTED_VERSION = "3.0.0";
const EXPECTED_ROUTES = [
  "brief_world",
  "story",
  "character",
  "scene",
  "style",
  "reference_evidence",
  "action",
  "shot_direction",
  "storyboard_rhythm",
  "image_prompt",
  "production_plan",
  "review_repair",
];
const EXPECTED_PACKAGE_SCRIPTS = Object.freeze({
  test: "node --test tests/canonical-json.test.mjs tests/validate-output.test.mjs tests/build-plugin-bundle.test.mjs",
  build: "node scripts/build-plugin-bundle.mjs",
  "contracts:index": "node scripts/generate-contract-index.mjs",
  "contracts:index:check": "node scripts/generate-contract-index.mjs --check",
  validate: "node scripts/validate-repository.mjs",
  "validate:bundle": "node scripts/validate-repository.mjs --bundle .build/cineweave-director",
  "validate:output": "node scripts/validate-output.mjs",
});
const EXPECTED_CHECKOUT_ACTION = "actions/checkout@11d5960a326750d5838078e36cf38b85af677262";
const EXPECTED_SETUP_NODE_ACTION = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020";
const EXPECTED_RELEASE_TAG_COMMAND = `node --input-type=module -e "import { readFileSync } from 'node:fs'; const version = JSON.parse(readFileSync('package.json', 'utf8')).version; const expected = 'v' + version; if (process.env.GITHUB_REF_NAME !== expected) throw new Error('Release tag ' + process.env.GITHUB_REF_NAME + ' must equal ' + expected);"`;
const EXPECTED_LIFECYCLE_AUTHORITY = Object.freeze({
  routeOwnership: "contracts.json#/routes",
  referenceDistribution: "reference-lifecycle.json#/references",
  contractInventory: "resources/contracts/index.json",
});
const EXPECTED_WORKFLOW_CONTEXTS = ["multi_route", "contract_output", "continuity"];
const EXPECTED_CONDITION_CONTEXTS = [
  "rights",
  "real_person",
  "semantic_morphology",
  "camera_previsualization",
  "portrait",
  "natural_human",
  "surface_response",
  "comic",
  "manga",
  "cinematic_pattern",
  "shot_compile",
  "editorial",
  "color",
  "midjourney",
  "video_sound_delivery",
  "draft_revision",
  "skill_evaluation",
];
const EXPECTED_SUPPORT_SCHEMAS = new Set([
  "schemas/common.schema.json",
  "schemas/reference-transform.schema.json",
]);
const DISTRIBUTION_BASE_FILES = [
  PLUGIN_PATH,
  LICENSE_PATH,
  `${SKILL_PREFIX}/SKILL.md`,
  `${SKILL_PREFIX}/agents/openai.yaml`,
  `${SKILL_PREFIX}/contracts.json`,
  `${SKILL_PREFIX}/reference-lifecycle.json`,
  `${SKILL_PREFIX}/resources/contracts/index.json`,
];
const SOURCE_TOP_LEVEL = new Set([
  ".agents",
  ".build",
  ".codex-plugin",
  ".editorconfig",
  ".git",
  ".gitattributes",
  ".github",
  ".gitignore",
  "assets",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "node_modules",
  "package.json",
  "README.md",
  "scripts",
  "SECURITY.md",
  "skills",
  "tests",
]);
const EXPECTED_SOURCE_DIRECTORIES = new Map([
  [".agents", ["plugins/marketplace.json"]],
  [".codex-plugin", ["plugin.json"]],
  [".github", ["workflows/validate.yml"]],
  ["assets", ["cineweave-director-logo.png", "cineweave-director-plugin-icon.png"]],
  ["scripts", [
    "build-plugin-bundle.mjs",
    "canonical-json.mjs",
    "generate-contract-index.mjs",
    "validate-output.mjs",
    "validate-repository.mjs",
  ]],
  ["tests", ["build-plugin-bundle.test.mjs", "canonical-json.test.mjs", "validate-output.test.mjs"]],
]);
const EXPECTED_REPOSITORY = "https://github.com/Wilder1222/cineweave-director";
const TEXT_EXTENSIONS = new Set([".json", ".md", ".yaml", ".yml"]);
const FORBIDDEN_DISTRIBUTION_PATTERNS = [
  [/packages\/cineweave-runtime/iu, "legacy runtime package reference"],
  [/packages\/cineweave-world-os/iu, "legacy World OS package reference"],
  [/\bcineweave-studio\b/iu, "retired multi-Skill product identity"],
  [/\bbin\/cineweave(?:\.mjs)?\b/iu, "retired CLI entry point"],
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function toPosix(value) {
  return value.split(sep).join("/");
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function normalizeManifestPath(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
  assert(!value.includes("\\"), `${label} must use forward slashes: ${value}`);
  assert(!value.includes("\0"), `${label} contains a NUL byte`);
  assert(!isAbsolute(value) && !/^[A-Za-z]:/u.test(value), `${label} must be relative: ${value}`);
  const normalized = posix.normalize(value);
  assert(normalized === value && normalized !== "." && !normalized.startsWith("../"), `${label} is not normalized or escapes its root: ${value}`);
  return value;
}

function sortedUnique(values, label) {
  const result = [...values].sort((left, right) => left.localeCompare(right, "en"));
  assert(new Set(result).size === result.length, `${label} contains duplicate paths`);
  const caseFolded = new Map();
  for (const value of result) {
    const key = value.toLocaleLowerCase("en-US");
    const prior = caseFolded.get(key);
    assert(!prior || prior === value, `${label} contains a case-colliding path: ${prior} / ${value}`);
    caseFolded.set(key, value);
  }
  return result;
}

function compareFileSets(actualValues, expectedValues, label) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = [...expected].filter((value) => !actual.has(value)).sort();
  const extra = [...actual].filter((value) => !expected.has(value)).sort();
  assert(missing.length === 0 && extra.length === 0, `${label} mismatch${missing.length ? `; missing: ${missing.join(", ")}` : ""}${extra.length ? `; extra: ${extra.join(", ")}` : ""}`);
}

async function readStrictJson(root, relativePath) {
  const path = resolve(root, ...relativePath.split("/"));
  assert(isWithin(root, path), `JSON path escapes root: ${relativePath}`);
  return parseJsonStrict(await readFile(path, "utf8"));
}

async function walkRegularFiles(root, relativeDirectory = "") {
  const directory = resolve(root, ...relativeDirectory.split("/").filter(Boolean));
  assert(isWithin(root, directory), `Directory escapes root: ${relativeDirectory}`);
  const directoryStat = await lstat(directory);
  assert(directoryStat.isDirectory() && !directoryStat.isSymbolicLink(), `Expected a real directory: ${relativeDirectory || "."}`);
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const childRelative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
    const childPath = resolve(root, ...childRelative.split("/"));
    const stat = await lstat(childPath);
    assert(!stat.isSymbolicLink(), `Symbolic links and junctions are not allowed: ${childRelative}`);
    if (stat.isDirectory()) files.push(...await walkRegularFiles(root, childRelative));
    else {
      assert(stat.isFile(), `Only regular files are allowed: ${childRelative}`);
      files.push(childRelative);
    }
  }
  return files;
}

async function assertRegularPath(root, relativePath) {
  let current = root;
  const segments = relativePath.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    current = join(current, segments[index]);
    const stat = await lstat(current);
    assert(!stat.isSymbolicLink(), `Symbolic links and junctions are not allowed: ${relativePath}`);
    if (index < segments.length - 1) assert(stat.isDirectory(), `Expected directory segment in ${relativePath}: ${segments[index]}`);
    else assert(stat.isFile(), `Expected regular file: ${relativePath}`);
  }
  const realRoot = await realpath(root);
  const realFile = await realpath(current);
  assert(isWithin(realRoot, realFile), `Resolved file escapes distribution root: ${relativePath}`);
}

function flattenRouteKinds(routes) {
  const kinds = [];
  const ownership = new Map();
  for (const [routeId, route] of Object.entries(routes)) {
    assert(Array.isArray(route.produces) && route.produces.length > 0, `Route ${routeId} must produce at least one root kind`);
    for (const kind of route.produces) {
      assert(typeof kind === "string" && kind.length > 0, `Route ${routeId} contains an invalid kind`);
      assert(!ownership.has(kind), `Root kind is owned by multiple routes: ${kind}`);
      ownership.set(kind, routeId);
      kinds.push(kind);
    }
  }
  return { kinds, ownership };
}

export async function createDistributionInventory(root = repositoryRoot) {
  const absoluteRoot = resolve(root);
  const plugin = await readStrictJson(absoluteRoot, PLUGIN_PATH);
  const contracts = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/contracts.json`);
  const lifecycle = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/reference-lifecycle.json`);
  const index = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/resources/contracts/index.json`);

  assert(Array.isArray(lifecycle.references), "reference-lifecycle.json must contain references[]");
  assert(Array.isArray(index.contracts), "contract index must contain contracts[]");
  assert(Array.isArray(index.supportSchemas), "contract index must contain supportSchemas[]");

  const files = [...DISTRIBUTION_BASE_FILES];
  for (const [position, entry] of lifecycle.references.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Lifecycle entry ${position} must be an object`);
    const referencePath = normalizeManifestPath(entry.path, `Lifecycle entry ${position}`);
    assert(referencePath.startsWith("references/") && extname(referencePath) === ".md", `Lifecycle entry must name a Markdown file under references/: ${referencePath}`);
    files.push(`${SKILL_PREFIX}/${referencePath}`);
  }

  for (const [position, entry] of index.contracts.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Contract index entry ${position} must be an object`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.schema, `Contract schema ${position}`)}`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.example, `Contract example ${position}`)}`);
  }
  for (const [position, entry] of index.supportSchemas.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Support schema entry ${position} must be an object`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.schema, `Support schema ${position}`)}`);
  }

  return {
    root: absoluteRoot,
    files: sortedUnique(files.map((value) => normalizeManifestPath(value, "Distribution path")), "Distribution inventory"),
    plugin,
    contracts,
    lifecycle,
    index,
  };
}

function pointerGet(document, pointer, label) {
  if (!pointer) return document;
  assert(pointer.startsWith("/"), `Unsupported JSON pointer in ${label}: #${pointer}`);
  let current = document;
  for (const rawToken of pointer.slice(1).split("/")) {
    const token = decodeURIComponent(rawToken).replace(/~1/gu, "/").replace(/~0/gu, "~");
    assert(current !== null && typeof current === "object" && Object.hasOwn(current, token), `Unresolved JSON pointer in ${label}: #${pointer}`);
    current = current[token];
  }
  return current;
}

function collectRefs(value, refs = []) {
  if (Array.isArray(value)) {
    for (const child of value) collectRefs(child, refs);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref") refs.push(child);
      else collectRefs(child, refs);
    }
  }
  return refs;
}

async function validateSchemaRefClosure(root, inventory, schemaDocuments) {
  const resourceRoot = resolve(root, SKILL_PREFIX, "resources", "contracts");
  const schemaRoot = resolve(resourceRoot, "schemas");
  const allowedFiles = new Set([
    ...inventory.index.contracts.map((entry) => entry.schema),
    ...inventory.index.supportSchemas.map((entry) => entry.schema),
  ]);
  let refCount = 0;

  for (const [schemaRelative, document] of schemaDocuments) {
    const currentPath = resolve(resourceRoot, ...schemaRelative.split("/"));
    assert(isWithin(schemaRoot, currentPath), `Indexed schema escapes the schema directory: ${schemaRelative}`);
    for (const refValue of collectRefs(document)) {
      refCount += 1;
      assert(typeof refValue === "string" && refValue.length > 0, `${schemaRelative} contains an invalid $ref`);
      if (refValue.startsWith("#")) {
        pointerGet(document, refValue.slice(1), schemaRelative);
        continue;
      }
      assert(!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(refValue) && !refValue.startsWith("//"), `${schemaRelative} contains a remote or absolute $ref: ${refValue}`);
      assert(!refValue.includes("\\") && !refValue.includes("?") && !refValue.includes("\0"), `${schemaRelative} contains a non-local $ref: ${refValue}`);
      const [filePart, fragment = ""] = refValue.split("#", 2);
      assert(filePart.length > 0 && posix.normalize(filePart) === filePart && filePart !== "." && !filePart.startsWith("../"), `${schemaRelative} contains a non-normalized $ref: ${refValue}`);
      const targetPath = resolve(dirname(currentPath), filePart);
      assert(isWithin(schemaRoot, targetPath), `${schemaRelative} $ref escapes the schema directory: ${refValue}`);
      const targetRelative = toPosix(relative(resourceRoot, targetPath));
      assert(allowedFiles.has(targetRelative), `${schemaRelative} references an unindexed schema: ${refValue}`);
      const targetDocument = schemaDocuments.get(targetRelative);
      assert(targetDocument, `${schemaRelative} references a missing schema: ${refValue}`);
      if (fragment) pointerGet(targetDocument, fragment, `${schemaRelative} -> ${refValue}`);
    }
  }
  return refCount;
}

function visitSkillReceipts(value, callback, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((child, index) => visitSkillReceipts(child, callback, `${path}[${index}]`));
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (key === "skillReceipt") callback(child, childPath);
      visitSkillReceipts(child, callback, childPath);
    }
  }
}

async function validateContracts(root, inventory) {
  const { contracts, lifecycle, index } = inventory;
  assert(contracts.schemaVersion === EXPECTED_VERSION && contracts.version === EXPECTED_VERSION, "contracts.json must use Skill version 3.0.0");
  assert(contracts.skill === SKILL_NAME && index.skill === SKILL_NAME && lifecycle.skill === SKILL_NAME, "Skill identity is inconsistent across manifests");
  assert(index.schemaVersion === EXPECTED_VERSION && index.skillVersion === EXPECTED_VERSION, "Contract index must use Skill version 3.0.0");
  assert(lifecycle.catalogVersion === EXPECTED_VERSION, "Reference lifecycle must use catalogVersion 3.0.0");

  const routeIds = Object.keys(contracts.routes ?? {});
  assert(JSON.stringify(routeIds) === JSON.stringify(EXPECTED_ROUTES), `Route inventory must be exactly: ${EXPECTED_ROUTES.join(", ")}`);
  const { kinds: routeKinds, ownership } = flattenRouteKinds(contracts.routes);
  assert(Array.isArray(contracts.contractKinds), "contracts.json must contain contractKinds[]");
  compareFileSets(routeKinds, contracts.contractKinds, "Route-produced root inventory");
  assert(new Set(contracts.contractKinds).size === contracts.contractKinds.length, "contractKinds[] contains duplicates");

  assert(canonicalize(lifecycle.authority) === canonicalize(EXPECTED_LIFECYCLE_AUTHORITY), "reference-lifecycle.json authority map is invalid");
  assert(lifecycle.contextCatalog && typeof lifecycle.contextCatalog === "object" && !Array.isArray(lifecycle.contextCatalog), "reference-lifecycle.json must contain contextCatalog");
  compareFileSets(lifecycle.contextCatalog.route ?? [], EXPECTED_ROUTES, "Lifecycle route contexts");
  compareFileSets(lifecycle.contextCatalog.workflow ?? [], EXPECTED_WORKFLOW_CONTEXTS, "Lifecycle workflow contexts");
  compareFileSets(lifecycle.contextCatalog.condition ?? [], EXPECTED_CONDITION_CONTEXTS, "Lifecycle condition contexts");
  const allLoadContexts = [
    ...(lifecycle.contextCatalog.route ?? []),
    ...(lifecycle.contextCatalog.workflow ?? []),
    ...(lifecycle.contextCatalog.condition ?? []),
  ];
  assert(new Set(allLoadContexts).size === allLoadContexts.length, "Lifecycle context categories overlap");
  const knownLoadContexts = new Set(allLoadContexts);

  const lifecyclePaths = lifecycle.references.map((entry) => entry.path);
  assert(new Set(lifecyclePaths).size === lifecyclePaths.length, "reference-lifecycle.json contains duplicate paths");
  const lifecycleByPath = new Map(lifecycle.references.map((entry) => [entry.path, entry]));
  for (const [position, entry] of lifecycle.references.entries()) {
    assert(typeof entry.path === "string", `Lifecycle entry ${position} must declare a path`);
    const expectedLifecycle = entry.path.startsWith("references/core/")
      ? "core"
      : entry.path.startsWith("references/routes/")
        ? "routed"
        : entry.path.startsWith("references/optional/")
          ? "optional"
          : null;
    assert(expectedLifecycle !== null && entry.lifecycle === expectedLifecycle, `Lifecycle entry ${entry.path} must be classified as ${expectedLifecycle}`);
    assert(Array.isArray(entry.loadContexts) && entry.loadContexts.length > 0, `Lifecycle entry ${position} must declare loadContexts`);
    assert(new Set(entry.loadContexts).size === entry.loadContexts.length, `Lifecycle entry ${position} contains duplicate loadContexts`);
    for (const context of entry.loadContexts) assert(knownLoadContexts.has(context), `Lifecycle entry ${position} uses undeclared load context ${context}`);
    if (entry.lifecycle === "routed") {
      const owners = Object.entries(contracts.routes).filter(([, route]) => route.references?.includes(entry.path)).map(([routeId]) => routeId);
      assert(owners.length === 1, `Routed reference must have exactly one route owner: ${entry.path}`);
      assert(entry.loadContexts.length === 1 && entry.loadContexts[0] === owners[0], `Routed reference load context must equal its route owner: ${entry.path}`);
    }
  }
  for (const [routeId, route] of Object.entries(contracts.routes)) {
    assert(Array.isArray(route.references) && route.references.length > 0, `Route ${routeId} must list at least one reference`);
    for (const referencePath of route.references) {
      const lifecycleEntry = lifecycleByPath.get(referencePath);
      assert(lifecycleEntry, `Route ${routeId} references knowledge outside lifecycle: ${referencePath}`);
      assert(lifecycleEntry.lifecycle !== "optional", `Route ${routeId} cannot make optional knowledge a baseline: ${referencePath}`);
      assert(lifecycleEntry.loadContexts.includes(routeId), `Route ${routeId} reference must declare its route load context: ${referencePath}`);
    }
  }

  assert(index.contracts.length === contracts.contractKinds.length, "Contract index root count does not match contracts.json");
  assert(JSON.stringify(index.contracts.map((entry) => entry.kind)) === JSON.stringify(contracts.contractKinds), "Contract index kind order does not match contracts.json");
  assert(new Set(index.contracts.map((entry) => entry.schema)).size === index.contracts.length, "Contract index reuses a root schema");
  assert(new Set(index.contracts.map((entry) => entry.example)).size === index.contracts.length, "Contract index reuses a canonical example");
  compareFileSets(index.supportSchemas.map((entry) => entry.schema), EXPECTED_SUPPORT_SCHEMAS, "Support schema inventory");

  const excluded = new Set(contracts.excludedPlatformKinds ?? []);
  for (const kind of contracts.contractKinds) assert(!excluded.has(kind), `Excluded platform kind is registered as a root: ${kind}`);

  const schemaDocuments = new Map();
  const failures = [];
  let receiptCount = 0;
  for (const entry of index.contracts) {
    assert(entry.role === "root", `Contract index entry must have role=root: ${entry.kind}`);
    assert(ownership.get(entry.kind) === entry.domain, `Contract domain mismatch for ${entry.kind}`);
    const schemaRelative = `${SKILL_PREFIX}/resources/contracts/${entry.schema}`;
    const exampleRelative = `${SKILL_PREFIX}/resources/contracts/${entry.example}`;
    const schemaBytes = await readFile(resolve(root, ...schemaRelative.split("/")));
    const exampleBytes = await readFile(resolve(root, ...exampleRelative.split("/")));
    assert(sha256Bytes(schemaBytes) === entry.schemaSha256, `Schema hash mismatch: ${entry.schema}`);
    assert(sha256Bytes(exampleBytes) === entry.exampleSha256, `Example hash mismatch: ${entry.example}`);
    const schema = parseJsonStrict(schemaBytes.toString("utf8"));
    const example = parseJsonStrict(exampleBytes.toString("utf8"));
    schemaDocuments.set(entry.schema, schema);
    assert(schema?.properties?.kind?.const === entry.kind, `Root schema kind mismatch: ${entry.schema}`);
    assert(example?.kind === entry.kind, `Canonical example kind mismatch: ${entry.example}`);
    visitSkillReceipts(example, (receipt, receiptPath) => {
      receiptCount += 1;
      assert(receipt && typeof receipt === "object" && !Array.isArray(receipt), `${entry.example} ${receiptPath} must be an object`);
      assert(receipt.repository === EXPECTED_REPOSITORY, `${entry.example} ${receiptPath}.repository must use the release repository`);
      assert(receipt.ref === "v3.0.0", `${entry.example} ${receiptPath}.ref must be v3.0.0`);
    });
    const result = await validateDocument(resolve(root, ...schemaRelative.split("/")), resolve(root, ...exampleRelative.split("/")), { contracts });
    if (!result.valid) failures.push({ kind: entry.kind, errors: result.errors });
  }

  for (const entry of index.supportSchemas) {
    const relativePath = `${SKILL_PREFIX}/resources/contracts/${entry.schema}`;
    const bytes = await readFile(resolve(root, ...relativePath.split("/")));
    assert(sha256Bytes(bytes) === entry.schemaSha256, `Support schema hash mismatch: ${entry.schema}`);
    schemaDocuments.set(entry.schema, parseJsonStrict(bytes.toString("utf8")));
  }
  assert(failures.length === 0, `Canonical example validation failed:\n${JSON.stringify(failures, null, 2)}`);
  const schemaRefs = await validateSchemaRefClosure(root, inventory, schemaDocuments);
  return { roots: index.contracts.length, schemas: schemaDocuments.size, examples: index.contracts.length, receipts: receiptCount, schemaRefs };
}

async function validateDistributionClosure(root, inventory, requireWholeRoot) {
  for (const relativePath of inventory.files) await assertRegularPath(root, relativePath);

  const skillActual = (await walkRegularFiles(root, SKILL_PREFIX)).map((value) => `${SKILL_PREFIX}/${value.slice(SKILL_PREFIX.length + 1)}`);
  const skillExpected = inventory.files.filter((value) => value.startsWith(`${SKILL_PREFIX}/`));
  compareFileSets(skillActual, skillExpected, "Skill distribution closure");

  const pluginActual = (await walkRegularFiles(root, ".codex-plugin")).map((value) => `.codex-plugin/${value.slice(".codex-plugin/".length)}`);
  compareFileSets(pluginActual, [PLUGIN_PATH], "Plugin manifest closure");

  if (requireWholeRoot) {
    const allFiles = await walkRegularFiles(root);
    compareFileSets(allFiles, inventory.files, "Bundle file set");
  }
}

function extractLinkTargets(markdown) {
  const targets = [];
  const markdownLink = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/gu;
  const htmlLink = /\b(?:href|src)=["']([^"']+)["']/giu;
  for (const match of markdown.matchAll(markdownLink)) targets.push(match[1]);
  for (const match of markdown.matchAll(htmlLink)) targets.push(match[1]);
  return targets;
}

async function validateMarkdownLinks(root, inventory, sourceMode) {
  const markdownFiles = inventory.files.filter((value) => extname(value) === ".md");
  if (sourceMode) markdownFiles.push("README.md", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md");
  let linkCount = 0;
  for (const markdownPath of sortedUnique(markdownFiles, "Markdown validation paths")) {
    const content = await readFile(resolve(root, ...markdownPath.split("/")), "utf8");
    for (let target of extractLinkTargets(content)) {
      linkCount += 1;
      target = target.replace(/^<|>$/gu, "");
      if (target.startsWith("#") || /^(?:https?:|mailto:|data:)/iu.test(target)) {
        if (/^https?:/iu.test(target)) new URL(target);
        continue;
      }
      const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
      if (!withoutFragment) continue;
      let decoded;
      try { decoded = decodeURIComponent(withoutFragment); } catch { fail(`${markdownPath} contains an invalid encoded link: ${target}`); }
      assert(!decoded.includes("\\") && !isAbsolute(decoded), `${markdownPath} contains an absolute or backslash link: ${target}`);
      const resolvedTarget = resolve(root, dirname(markdownPath), decoded);
      assert(isWithin(root, resolvedTarget), `${markdownPath} link escapes the validation root: ${target}`);
      const stat = await lstat(resolvedTarget).catch(() => null);
      assert(stat && !stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), `${markdownPath} contains a broken local link: ${target}`);
    }
  }
  return { markdownFiles: markdownFiles.length, links: linkCount };
}

async function validateTextBoundaries(root, inventory) {
  let textFiles = 0;
  for (const relativePath of inventory.files) {
    if (!TEXT_EXTENSIONS.has(extname(relativePath))) continue;
    textFiles += 1;
    const bytes = await readFile(resolve(root, ...relativePath.split("/")));
    assert(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), `UTF-8 BOM is not allowed: ${relativePath}`);
    const text = bytes.toString("utf8");
    assert(!text.includes("\u0000"), `NUL byte is not allowed: ${relativePath}`);
    assert(!text.includes("\ufffd"), `Replacement character indicates invalid encoding: ${relativePath}`);
    assert(!text.includes("\r"), `Distribution text must use LF line endings: ${relativePath}`);
    for (const [pattern, label] of FORBIDDEN_DISTRIBUTION_PATTERNS) {
      assert(!pattern.test(text), `${relativePath} contains ${label}`);
    }
  }
  return { textFiles };
}

function validatePluginAndPackage(plugin, contracts, packageJson = null) {
  assert(plugin.name === SKILL_NAME && plugin.version === EXPECTED_VERSION, "Plugin identity/version mismatch");
  assert(plugin.skills === "./skills/", "Plugin must expose only ./skills/");
  assert(plugin.repository === EXPECTED_REPOSITORY && plugin.homepage === EXPECTED_REPOSITORY, "Plugin repository metadata mismatch");
  assert(plugin.license === "MIT", "Plugin license must be MIT");
  for (const forbidden of ["bin", "commands", "dependencies", "mcpServers", "runtime"]) {
    assert(!Object.hasOwn(plugin, forbidden), `Plugin manifest must not contain ${forbidden}`);
  }
  assert(contracts.version === plugin.version, "Plugin and Skill manifest versions must match");

  if (packageJson) {
    assert(packageJson.name === SKILL_NAME && packageJson.version === EXPECTED_VERSION, "package.json identity/version mismatch");
    assert(packageJson.private === true && packageJson.type === "module", "package.json must be a private ESM development harness");
    assert(packageJson.engines?.node === ">=22", "package.json must require Node.js >=22");
    assert(packageJson.license === "MIT", "package.json license must be MIT");
    for (const forbidden of ["bin", "main", "exports", "workspaces", "dependencies", "devDependencies", "optionalDependencies", "peerDependencies", "bundledDependencies"]) {
      assert(!Object.hasOwn(packageJson, forbidden), `package.json must not contain ${forbidden}`);
    }
    assert(packageJson.scripts && typeof packageJson.scripts === "object" && !Array.isArray(packageJson.scripts), "package.json must contain scripts");
    compareFileSets(Object.keys(packageJson.scripts), Object.keys(EXPECTED_PACKAGE_SCRIPTS), "package.json script inventory");
    for (const [scriptName, command] of Object.entries(EXPECTED_PACKAGE_SCRIPTS)) {
      assert(packageJson.scripts[scriptName] === command, `package.json script ${scriptName} must equal ${JSON.stringify(command)}`);
    }
  }
}

function validateMarketplace(marketplace, plugin) {
  assert(marketplace.name === SKILL_NAME, "Marketplace name must match the single Skill identity");
  assert(marketplace.interface?.displayName === plugin.interface?.displayName, "Marketplace display name must match plugin metadata");
  assert(Array.isArray(marketplace.plugins) && marketplace.plugins.length === 1, "Marketplace must contain exactly one plugin");
  const [entry] = marketplace.plugins;
  assert(entry.name === SKILL_NAME, "Marketplace plugin name mismatch");
  assert(entry.source?.source === "url", "Marketplace plugin source must use an immutable URL entry");
  assert(entry.source?.url === `${EXPECTED_REPOSITORY}.git`, "Marketplace repository URL mismatch");
  assert(entry.source?.ref === `v${EXPECTED_VERSION}`, "Marketplace ref must match the immutable release tag");
  assert(entry.policy?.installation === "AVAILABLE" && entry.policy?.authentication === "ON_INSTALL", "Marketplace policy mismatch");
  assert(entry.category === plugin.interface?.category, "Marketplace category must match plugin metadata");
}

function parseSkillFrontmatter(markdown) {
  assert(markdown.startsWith("---\n"), "SKILL.md must start with YAML frontmatter");
  const end = markdown.indexOf("\n---\n", 4);
  assert(end >= 0, "SKILL.md frontmatter is not terminated");
  const fields = Object.create(null);
  for (const line of markdown.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    assert(separator > 0, `SKILL.md contains unsupported frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    assert(/^[a-z][a-z0-9_-]*$/u.test(key) && rawValue.length > 0, `SKILL.md contains invalid frontmatter field: ${line}`);
    assert(!Object.hasOwn(fields, key), `SKILL.md repeats frontmatter field ${key}`);
    if (rawValue.startsWith('"')) {
      const value = parseJsonStrict(rawValue);
      assert(typeof value === "string" && value.length > 0, `SKILL.md frontmatter field ${key} must be a string scalar`);
      fields[key] = value;
    } else {
      assert(/^[a-z0-9][a-z0-9-]*$/u.test(rawValue), `SKILL.md frontmatter field ${key} must be a quoted string or safe slug`);
      fields[key] = rawValue;
    }
  }
  return fields;
}

function parseAgentYaml(yaml) {
  assert(!yaml.includes("\r") && !yaml.includes("\t"), "agents/openai.yaml must use LF line endings and spaces");
  const allowedFields = {
    interface: new Set(["display_name", "short_description", "default_prompt"]),
    policy: new Set(["allow_implicit_invocation"]),
  };
  const document = Object.create(null);
  let section = null;

  for (const [index, line] of yaml.trimEnd().split("\n").entries()) {
    const sectionMatch = line.match(/^([a-z][a-z0-9_]*):$/u);
    if (sectionMatch) {
      section = sectionMatch[1];
      assert(Object.hasOwn(allowedFields, section), `agents/openai.yaml contains unknown section ${section}`);
      assert(!Object.hasOwn(document, section), `agents/openai.yaml repeats section ${section}`);
      document[section] = Object.create(null);
      continue;
    }

    const fieldMatch = line.match(/^  ([a-z][a-z0-9_]*):\s*(.+)$/u);
    assert(fieldMatch && section, `agents/openai.yaml contains unsupported line ${index + 1}: ${line}`);
    const [, key, rawValue] = fieldMatch;
    assert(allowedFields[section].has(key), `agents/openai.yaml contains unknown ${section} field ${key}`);
    assert(!Object.hasOwn(document[section], key), `agents/openai.yaml repeats ${section}.${key}`);
    if (section === "policy") {
      assert(key === "allow_implicit_invocation" && rawValue === "true", "agents/openai.yaml policy must enable only implicit invocation");
      document[section][key] = true;
    } else {
      const value = parseJsonStrict(rawValue);
      assert(typeof value === "string" && value.length > 0, `agents/openai.yaml ${section}.${key} must be a non-empty quoted string`);
      document[section][key] = value;
    }
  }

  compareFileSets(Object.keys(document), Object.keys(allowedFields), "agents/openai.yaml sections");
  for (const [name, fields] of Object.entries(allowedFields)) {
    compareFileSets(Object.keys(document[name]), [...fields], `agents/openai.yaml ${name} fields`);
  }
  return document;
}

async function validateSkillSurfaces(root, plugin) {
  const skillMarkdown = await readFile(resolve(root, SKILL_PREFIX, "SKILL.md"), "utf8");
  const frontmatter = parseSkillFrontmatter(skillMarkdown);
  compareFileSets(Object.keys(frontmatter), ["name", "description"], "SKILL.md frontmatter fields");
  assert(frontmatter.name === SKILL_NAME, "SKILL.md name must match the plugin identity");
  assert(typeof frontmatter.description === "string" && frontmatter.description.length <= 1024, "SKILL.md description must be a non-empty Agent Skills description of at most 1024 characters");
  assert(/\bUse (?:for|when)\b/u.test(frontmatter.description), "SKILL.md description must state when the Skill applies");
  assert(skillMarkdown.split("\n").length <= 500, "SKILL.md must remain below the 500-line progressive-disclosure limit");

  const agentYaml = await readFile(resolve(root, SKILL_PREFIX, "agents", "openai.yaml"), "utf8");
  const agent = parseAgentYaml(agentYaml);
  assert(Array.isArray(plugin.interface?.defaultPrompt) && plugin.interface.defaultPrompt.length === 1, "Plugin interface must expose exactly one default prompt");
  assert(agent.interface.display_name === plugin.interface.displayName, "agents/openai.yaml display_name must match plugin.json");
  assert(agent.interface.short_description === plugin.interface.shortDescription, "agents/openai.yaml short_description must match plugin.json");
  assert(agent.interface.default_prompt === plugin.interface.defaultPrompt[0], "agents/openai.yaml default_prompt must match plugin.json");
  assert(agent.policy.allow_implicit_invocation === true, "agents/openai.yaml must explicitly allow implicit invocation");
}

async function validateWorkflowEntrypoints(root) {
  const workflow = await readFile(resolve(root, ".github", "workflows", "validate.yml"), "utf8");
  const expectedWorkflow = [
    "name: Validate",
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "    tags: [\"v*\"]",
    "  pull_request:",
    "",
    "permissions:",
    "  contents: read",
    "",
    "jobs:",
    "  validate:",
    "    runs-on: ubuntu-latest",
    "    steps:",
    "      - name: Checkout",
    `        uses: ${EXPECTED_CHECKOUT_ACTION} # v4`,
    "      - name: Use Node.js 22",
    `        uses: ${EXPECTED_SETUP_NODE_ACTION} # v4`,
    "        with:",
    "          node-version: \"22\"",
    "      - name: Test validation primitives",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS.test}`,
    "      - name: Verify contract index is current",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS["contracts:index:check"]}`,
    "      - name: Validate source distribution",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS.validate}`,
    "      - name: Verify release tag matches version",
    "        if: startsWith(github.ref, 'refs/tags/')",
    `        run: ${EXPECTED_RELEASE_TAG_COMMAND}`,
    "      - name: Build byte-identical plugin bundle",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS.build}`,
    "      - name: Validate built bundle",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS["validate:bundle"]}`,
    "",
  ].join("\n");
  assert(workflow === expectedWorkflow, "CI workflow must match the reviewed, read-only release-gate template exactly");
}

async function validateSourceStructure(root) {
  const topLevel = await readdir(root);
  const unexpected = topLevel.filter((entry) => !SOURCE_TOP_LEVEL.has(entry)).sort();
  assert(unexpected.length === 0, `Unexpected top-level repository entries: ${unexpected.join(", ")}`);
  for (const [directory, expected] of EXPECTED_SOURCE_DIRECTORIES) {
    compareFileSets(await walkRegularFiles(root, directory), expected.map((value) => `${directory}/${value}`), `${directory} source file set`);
  }
  const skillEntries = await readdir(resolve(root, "skills"), { withFileTypes: true });
  assert(skillEntries.length === 1 && skillEntries[0].isDirectory() && skillEntries[0].name === SKILL_NAME, "skills/ must contain exactly cineweave-director/");
}

async function validateDistributionRoot(root, { requireWholeRoot = false, sourceMode = false } = {}) {
  const inventory = await createDistributionInventory(root);
  await validateDistributionClosure(root, inventory, requireWholeRoot);
  validatePluginAndPackage(inventory.plugin, inventory.contracts);
  const contracts = await validateContracts(root, inventory);
  const markdown = await validateMarkdownLinks(root, inventory, sourceMode);
  const text = await validateTextBoundaries(root, inventory);
  return { inventory, contracts, markdown, text };
}

export async function validateRepository(root = repositoryRoot) {
  const absoluteRoot = resolve(root);
  await validateSourceStructure(absoluteRoot);
  const result = await validateDistributionRoot(absoluteRoot, { sourceMode: true });
  const packageJson = await readStrictJson(absoluteRoot, "package.json");
  const marketplace = await readStrictJson(absoluteRoot, MARKETPLACE_PATH);
  validatePluginAndPackage(result.inventory.plugin, result.inventory.contracts, packageJson);
  validateMarketplace(marketplace, result.inventory.plugin);
  await validateSkillSurfaces(absoluteRoot, result.inventory.plugin);
  await validateWorkflowEntrypoints(absoluteRoot);
  return {
    valid: true,
    mode: "source",
    root: absoluteRoot,
    files: result.inventory.files.length,
    references: result.inventory.lifecycle.references.length,
    ...result.contracts,
    ...result.markdown,
    ...result.text,
  };
}

export async function validateBundle(bundleRoot, sourceRoot = repositoryRoot) {
  const absoluteSource = resolve(sourceRoot);
  const absoluteBundle = resolve(bundleRoot);
  assert(absoluteBundle !== absoluteSource, "Bundle root must differ from source root");
  const source = await validateRepository(absoluteSource);
  const sourceInventory = await createDistributionInventory(absoluteSource);
  const bundle = await validateDistributionRoot(absoluteBundle, { requireWholeRoot: true });
  compareFileSets(bundle.inventory.files, sourceInventory.files, "Bundle/source inventory");
  for (const relativePath of sourceInventory.files) {
    const sourceBytes = await readFile(resolve(absoluteSource, ...relativePath.split("/")));
    const bundleBytes = await readFile(resolve(absoluteBundle, ...relativePath.split("/")));
    assert(sourceBytes.equals(bundleBytes), `Bundle file differs from source bytes: ${relativePath}`);
  }
  return {
    valid: true,
    mode: "bundle",
    root: absoluteBundle,
    sourceRoot: absoluteSource,
    files: sourceInventory.files.length,
    references: bundle.inventory.lifecycle.references.length,
    ...bundle.contracts,
    ...bundle.markdown,
    ...bundle.text,
    sourceFilesValidated: source.files,
  };
}

function usage() {
  console.error("Usage: node scripts/validate-repository.mjs [--bundle <bundle-directory>]");
}

async function main() {
  const args = process.argv.slice(2);
  let result;
  if (args.length === 0) result = await validateRepository();
  else if (args.length === 2 && args[0] === "--bundle") result = await validateBundle(args[1]);
  else {
    usage();
    process.exitCode = 2;
    return;
  }
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
