import { readFile } from "node:fs/promises";
import { isAbsolute, posix, resolve } from "node:path";
import { canonicalize, parseJsonStrict } from "./canonical-json.mjs";

const FORMAT = "cineweave-skill-catalog/v1";
const DIRECTOR = "cineweave-director";
const PLATFORM = "cineweave-platform";
const REFERENCE = "cineweave-reference";
const REVIEW = "cineweave-review";
const SKILL_NAMES = Object.freeze([DIRECTOR, PLATFORM, REFERENCE, REVIEW]);
const CANONICAL_ROOT = `skills/${DIRECTOR}`;
const PROJECTION_KIND = "cineweave_codex_prompt_projection_plan";
const ROUTE_NAMES = Object.freeze([
  "brief_world", "story", "character", "scene", "style", "reference_evidence",
  "action", "shot_direction", "storyboard_rhythm", "image_prompt", "production_plan", "review_repair",
]);
const HELPERS = Object.freeze([
  "check-delivery.mjs", "check-video-plan.mjs", "check-audio-returns.mjs",
  "check-shot-review.mjs", "check-change-impact.mjs", "parse-json.mjs",
]);
const ENTRY_FILES = new Set(["SKILL.md", "agents/openai.yaml"]);
const PLUGIN_FILE = ".codex-plugin/plugin.json";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertObject(value, label) {
  assert(value !== null && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  const prototype = Object.getPrototypeOf(value);
  assert(prototype === null || prototype === Object.prototype, `${label} must be a plain JSON object`);
  assert(Object.getOwnPropertySymbols(value).length === 0, `${label} must not contain symbol fields`);
  for (const [name, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    assert(descriptor.enumerable && Object.hasOwn(descriptor, "value"), `${label}.${name} must be an enumerable JSON value`);
  }
}

function exactKeys(value, expected, label) {
  assertObject(value, label);
  sameSet(Object.keys(value), expected, `${label} fields`);
}

function stringSet(values, label) {
  assert(Array.isArray(values), `${label} must be an array`);
  for (const value of values) assert(typeof value === "string" && value.length > 0, `${label} must contain non-empty strings`);
  assert(new Set(values).size === values.length, `${label} contains duplicates`);
  return values;
}

function sameSet(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = [...expectedSet].filter((value) => !actualSet.has(value));
  const extra = [...actualSet].filter((value) => !expectedSet.has(value));
  assert(missing.length === 0 && extra.length === 0,
    `${label} mismatch${missing.length ? `; missing: ${missing.join(", ")}` : ""}${extra.length ? `; extra: ${extra.join(", ")}` : ""}`);
}

function validateCatalogShape(catalog) {
  exactKeys(catalog, ["format", "skills", "targetKindOwners"], "Skill catalog");
  assert(catalog.format === FORMAT, `Skill catalog format must be ${FORMAT}`);
  exactKeys(catalog.skills, SKILL_NAMES, "Skill catalog skills");
  for (const name of SKILL_NAMES) {
    exactKeys(catalog.skills[name], ["enabled"], `Skill catalog skills.${name}`);
    assert(typeof catalog.skills[name].enabled === "boolean", `${name}.enabled must be boolean`);
  }
  assert(catalog.skills[DIRECTOR].enabled, `${DIRECTOR} must always be enabled`);
  assert(!catalog.skills[REFERENCE].enabled || catalog.skills[PLATFORM].enabled,
    `${REFERENCE} requires ${PLATFORM} to be enabled`);
  assert(!catalog.skills[REVIEW].enabled || (catalog.skills[PLATFORM].enabled && catalog.skills[REFERENCE].enabled),
    `${REVIEW} requires ${PLATFORM} and ${REFERENCE} to be enabled`);
  assertObject(catalog.targetKindOwners, "Skill catalog targetKindOwners");
  for (const [kind, owner] of Object.entries(catalog.targetKindOwners)) {
    assert(kind.length > 0, "Skill catalog targetKindOwners contains an empty kind");
    assert(SKILL_NAMES.includes(owner), `Unknown target Skill owner for ${kind}: ${String(owner)}`);
  }
}

/** Read the sole source catalog; disabled authoring roots are not inspected. */
export async function loadSkillCatalog(sourceRoot) {
  assert(typeof sourceRoot === "string" && sourceRoot.length > 0, "sourceRoot must be a non-empty path");
  const catalog = parseJsonStrict(await readFile(resolve(sourceRoot, "skill-catalog.json"), "utf8"));
  validateCatalogShape(catalog);
  return catalog;
}

/** Keep domain route ownership separate from the derived Skill implementation owner. */
export function validateSkillCatalog(catalog, { contracts, lifecycle, index } = {}) {
  validateCatalogShape(catalog);
  for (const [label, document] of Object.entries({ contracts, lifecycle, index })) {
    assertObject(document, label);
    assert(document.skill === DIRECTOR, `${label}.skill must preserve the ${DIRECTOR} protocol namespace`);
  }
  const kinds = stringSet(contracts.contractKinds, "contracts.contractKinds");
  assert(kinds.length === 52, "contracts.contractKinds must contain exactly 52 root kinds");
  exactKeys(contracts.routes, ROUTE_NAMES, "contracts.routes");
  const routeOwners = new Map();
  for (const [routeName, route] of Object.entries(contracts.routes)) {
    assertObject(route, `contracts.routes.${routeName}`);
    const produces = stringSet(route.produces, `contracts.routes.${routeName}.produces`);
    assert(produces.length > 0, `Route ${routeName} must produce at least one root kind`);
    for (const kind of produces) {
      assert(!routeOwners.has(kind), `Root kind is owned by multiple routes: ${kind}`);
      routeOwners.set(kind, routeName);
    }
  }
  sameSet([...routeOwners.keys()], kinds, "Route-produced root kinds");
  assertObject(lifecycle.contextCatalog, "lifecycle.contextCatalog");
  sameSet(stringSet(lifecycle.contextCatalog.route, "lifecycle.contextCatalog.route"), ROUTE_NAMES, "Lifecycle routes");
  assert(Array.isArray(index.contracts), "index.contracts must be an array");
  const indexKinds = [];
  for (const [position, entry] of index.contracts.entries()) {
    assertObject(entry, `index.contracts[${position}]`);
    assert(typeof entry.kind === "string" && entry.kind.length > 0, `index.contracts[${position}].kind must be a non-empty string`);
    assert(entry.role === "root", `Index entry ${entry.kind} must have role root`);
    assert(entry.domain === routeOwners.get(entry.kind), `Index domain does not match route owner for ${entry.kind}`);
    indexKinds.push(entry.kind);
  }
  stringSet(indexKinds, "Index root kinds");
  sameSet(indexKinds, kinds, "Index root kinds");
  sameSet(Object.keys(catalog.targetKindOwners), kinds, "Catalog target root kinds");
  assert(routeOwners.get(PROJECTION_KIND) === "image_prompt", `${PROJECTION_KIND} must remain an image_prompt root`);
  const targetKindOwners = {};
  const actualKindOwners = {};
  for (const kind of kinds) {
    const domain = routeOwners.get(kind);
    const expected = kind === PROJECTION_KIND ? PLATFORM
      : domain === "reference_evidence" ? REFERENCE
        : domain === "review_repair" ? REVIEW : DIRECTOR;
    assert(catalog.targetKindOwners[kind] === expected,
      `Target Skill owner for ${kind} must be ${expected}; received ${catalog.targetKindOwners[kind]}`);
    targetKindOwners[kind] = expected;
    actualKindOwners[kind] = catalog.skills[expected].enabled ? expected : DIRECTOR;
  }
  const skills = Object.fromEntries(SKILL_NAMES.map((name) => [name, Object.freeze({ enabled: catalog.skills[name].enabled })]));
  const catalogSnapshot = Object.freeze({ format: FORMAT, skills: Object.freeze(skills), targetKindOwners: Object.freeze({ ...targetKindOwners }) });
  return Object.freeze({
    catalog: catalogSnapshot,
    enabledSkills: Object.freeze(SKILL_NAMES.filter((name) => catalog.skills[name].enabled)),
    targetKindOwners: Object.freeze(targetKindOwners),
    actualKindOwners: Object.freeze(actualKindOwners),
    contracts, lifecycle, index,
  });
}

function checkedModel(model) {
  assertObject(model, "Catalog model");
  const verified = validateSkillCatalog(model.catalog, model);
  for (const key of ["enabledSkills", "targetKindOwners", "actualKindOwners"]) {
    assert(canonicalize(model[key]) === canonicalize(verified[key]), `Catalog model ${key} does not match its catalog`);
  }
  return verified;
}

export function resolveImplementationOwner(model, kind) {
  const verified = checkedModel(model);
  assert(typeof kind === "string" && Object.hasOwn(verified.targetKindOwners, kind), `Unknown root kind: ${String(kind)}`);
  return { targetSkill: verified.targetKindOwners[kind], implementationSkill: verified.actualKindOwners[kind] };
}

function normalizePath(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty path`);
  assert(!/[\\\u0000-\u001f<>:"|?*]/u.test(value), `${label} must use safe forward-slash paths: ${value}`);
  assert(!isAbsolute(value) && !/^[A-Za-z]:/u.test(value), `${label} must be relative: ${value}`);
  assert(posix.normalize(value) === value && value !== "." && value !== ".." && !value.startsWith("../") && !value.endsWith("/"),
    `${label} is not normalized or escapes its root: ${value}`);
  assert(value.split("/").every((segment) => !/[. ]$/u.test(segment) && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(segment)),
    `${label} contains an unsafe Windows path segment: ${value}`);
  return value;
}

function sortedPaths(values, label, { deduplicate = false } = {}) {
  const paths = values.map((value) => normalizePath(value, label));
  if (!deduplicate) assert(new Set(paths).size === paths.length, `${label} contains duplicate paths`);
  const folded = new Map();
  for (const value of paths) {
    const segments = value.split("/");
    for (let length = 1; length <= segments.length; length += 1) {
      const prefix = segments.slice(0, length).join("/");
      const key = prefix.toLocaleLowerCase("en-US");
      assert(!folded.has(key) || folded.get(key) === prefix,
        `${label} contains a case-colliding path: ${folded.get(key)} / ${prefix}`);
      folded.set(key, prefix);
    }
  }
  const filePaths = new Set(paths.map((value) => value.toLocaleLowerCase("en-US")));
  for (const value of paths) {
    const segments = value.split("/");
    for (let length = 1; length < segments.length; length += 1) {
      const prefix = segments.slice(0, length).join("/");
      assert(!filePaths.has(prefix.toLocaleLowerCase("en-US")), `${label} contains a file/directory collision: ${prefix}`);
    }
  }
  return [...new Set(paths)].sort((left, right) => left.localeCompare(right, "en"));
}

function canonicalProfileFiles({ lifecycle, index }) {
  const files = [
    PLUGIN_FILE, "LICENSE", `${CANONICAL_ROOT}/SKILL.md`, `${CANONICAL_ROOT}/agents/openai.yaml`,
    `${CANONICAL_ROOT}/contracts.json`, `${CANONICAL_ROOT}/reference-lifecycle.json`,
    `${CANONICAL_ROOT}/resources/contracts/index.json`,
    ...HELPERS.map((name) => `${CANONICAL_ROOT}/scripts/${name}`),
  ];
  assert(Array.isArray(lifecycle.references), "lifecycle.references must be an array");
  assert(lifecycle.references.length === 47, "Canonical profile must contain exactly 47 references");
  for (const [position, entry] of lifecycle.references.entries()) {
    assertObject(entry, `lifecycle.references[${position}]`);
    const path = normalizePath(entry.path, `Lifecycle reference ${position}`);
    assert(path.startsWith("references/") && posix.extname(path) === ".md", `Lifecycle reference must be Markdown under references/: ${path}`);
    files.push(`${CANONICAL_ROOT}/${path}`);
  }
  for (const [position, entry] of index.contracts.entries()) {
    const schema = normalizePath(entry.schema, `Contract schema ${position}`);
    const example = normalizePath(entry.example, `Contract example ${position}`);
    assert(schema.startsWith("schemas/") && posix.extname(schema) === ".json", `Contract schema must be under schemas/: ${schema}`);
    assert(example.startsWith("examples/") && posix.extname(example) === ".json", `Contract example must be under examples/: ${example}`);
    files.push(`${CANONICAL_ROOT}/resources/contracts/${schema}`, `${CANONICAL_ROOT}/resources/contracts/${example}`);
  }
  assert(Array.isArray(index.supportSchemas), "index.supportSchemas must be an array");
  assert(index.supportSchemas.length === 2, "Canonical profile must contain exactly 2 support schemas");
  for (const [position, entry] of index.supportSchemas.entries()) {
    assertObject(entry, `index.supportSchemas[${position}]`);
    const schema = normalizePath(entry.schema, `Support schema ${position}`);
    assert(schema.startsWith("schemas/") && posix.extname(schema) === ".json", `Support schema must be under schemas/: ${schema}`);
    files.push(`${CANONICAL_ROOT}/resources/contracts/${schema}`);
  }
  return sortedPaths(files, "Canonical profile");
}

/** Derive a read-only mapping; physical source checks and copying belong to callers. */
export function createSkillExportPlan(sourceRoot, model, canonicalInventory, target = { type: "plugin" }) {
  assert(typeof sourceRoot === "string" && sourceRoot.length > 0, "sourceRoot must be a non-empty path");
  const verified = checkedModel(model);
  assertObject(canonicalInventory, "Canonical inventory");
  for (const key of ["contracts", "lifecycle", "index"]) {
    assert(canonicalize(canonicalInventory[key]) === canonicalize(verified[key]), `Canonical inventory ${key} does not match catalog authority`);
  }
  assert(Array.isArray(canonicalInventory.files), "Canonical inventory files must be an array");
  const canonicalFiles = sortedPaths(canonicalInventory.files, "Canonical inventory");
  sameSet(canonicalFiles, canonicalProfileFiles(verified), "Canonical profile files");
  assertObject(target, "Export target");
  assert(target.type === "plugin" || target.type === "skill", `Unknown export target type: ${String(target.type)}`);
  exactKeys(target, target.type === "plugin" ? ["type"] : ["type", "name"], "Export target");
  if (target.type === "skill") {
    assert(SKILL_NAMES.includes(target.name), `Unknown leaf Skill: ${String(target.name)}`);
    assert(verified.enabledSkills.includes(target.name), `Leaf Skill is disabled: ${target.name}`);
  }
  const names = target.type === "plugin" ? verified.enabledSkills : [target.name];
  const coreFiles = canonicalFiles.filter((path) => path.startsWith(`${CANONICAL_ROOT}/`));
  const skills = names.map((name) => {
    const destinationRoot = target.type === "plugin" ? `skills/${name}` : ".";
    const authoringRoot = name === DIRECTOR ? CANONICAL_ROOT : `skill-sources/${name}`;
    const exports = coreFiles.map((path) => {
      const localPath = path.slice(CANONICAL_ROOT.length + 1);
      return {
        source: name !== DIRECTOR && ENTRY_FILES.has(localPath) ? `${authoringRoot}/${localPath}` : path,
        destination: destinationRoot === "." ? localPath : `${destinationRoot}/${localPath}`,
      };
    });
    return {
      name, root: destinationRoot, sourceRoot: authoringRoot, destinationRoot,
      actualKinds: verified.contracts.contractKinds.filter((kind) => verified.actualKindOwners[kind] === name),
      targetKinds: verified.contracts.contractKinds.filter((kind) => verified.targetKindOwners[kind] === name),
      exports, files: sortedPaths(exports.map((entry) => entry.destination), `Skill ${name} files`),
      contracts: verified.contracts, lifecycle: verified.lifecycle, index: verified.index,
    };
  });
  const exports = [
    ...skills.flatMap((skill) => skill.exports),
    { source: "LICENSE", destination: "LICENSE" },
    ...(target.type === "plugin" ? [{ source: PLUGIN_FILE, destination: PLUGIN_FILE }] : []),
  ].sort((left, right) => left.destination.localeCompare(right.destination, "en"));
  for (const entry of exports) normalizePath(entry.source, "Export source");
  return {
    root: resolve(sourceRoot), exports,
    files: sortedPaths(exports.map((entry) => entry.destination), "Export destinations"),
    sourceFiles: sortedPaths(exports.map((entry) => entry.source), "Export sources", { deduplicate: true }),
    skills, target: { ...target },
  };
}
