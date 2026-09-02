#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(scriptDirectory);
const skillRoot = join(repositoryRoot, "skills", "cineweave-director");
const contractsPath = join(skillRoot, "contracts.json");
const resourceRoot = join(skillRoot, "resources", "contracts");
const indexPath = join(resourceRoot, "index.json");

const filenameOverrides = new Map([
  ["cineweave_codex_image_prompt", ["image-prompt-output.schema.json", "image-prompt.json"]],
  ["cineweave_codex_storyboard_sequence", ["storyboard-output.schema.json", "storyboard.json"]],
]);

const supportSchemas = [
  {
    schema: "schemas/common.schema.json",
    purpose: "Shared identifiers, references, provenance, and receipt definitions.",
  },
  {
    schema: "schemas/reference-transform.schema.json",
    purpose: "Shared provider-neutral reference-observation transform definitions.",
  },
];

function sha256Bytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function rootFilenames(kind) {
  const override = filenameOverrides.get(kind);
  if (override) return override;
  const stem = kind.replace(/^cineweave_codex_/, "").replaceAll("_", "-");
  return [`${stem}.schema.json`, `${stem}.json`];
}

async function readJson(path) {
  const bytes = await readFile(path);
  return { bytes, value: JSON.parse(bytes.toString("utf8")) };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createIndex() {
  const { value: manifest } = await readJson(contractsPath);
  const declaredKinds = manifest.contractKinds;
  assert(Array.isArray(declaredKinds) && declaredKinds.length > 0, "contracts.json must declare contractKinds");

  const kindToDomain = new Map();
  for (const [domain, route] of Object.entries(manifest.routes ?? {})) {
    for (const kind of route.produces ?? []) {
      assert(!kindToDomain.has(kind), `Contract kind is produced by more than one route: ${kind}`);
      kindToDomain.set(kind, domain);
    }
  }

  assert(kindToDomain.size === declaredKinds.length, `Route inventory has ${kindToDomain.size} roots; contractKinds has ${declaredKinds.length}`);
  assert(new Set(declaredKinds).size === declaredKinds.length, "contractKinds contains duplicates");
  for (const kind of declaredKinds) assert(kindToDomain.has(kind), `contractKinds entry has no producing route: ${kind}`);
  for (const kind of kindToDomain.keys()) assert(declaredKinds.includes(kind), `Route produces undeclared contract kind: ${kind}`);

  const seenSchemas = new Set();
  const seenExamples = new Set();
  const contracts = [];

  for (const kind of declaredKinds) {
    const [schemaFilename, exampleFilename] = rootFilenames(kind);
    const schema = `schemas/${schemaFilename}`;
    const example = `examples/${exampleFilename}`;
    assert(!seenSchemas.has(schema), `Root schema is assigned more than once: ${schema}`);
    assert(!seenExamples.has(example), `Canonical example is assigned more than once: ${example}`);
    seenSchemas.add(schema);
    seenExamples.add(example);

    const schemaDocument = await readJson(join(resourceRoot, schema));
    const exampleDocument = await readJson(join(resourceRoot, example));
    const schemaKind = schemaDocument.value?.properties?.kind?.const;
    assert(schemaKind === kind, `${schema} declares kind ${JSON.stringify(schemaKind)} instead of ${kind}`);
    assert(exampleDocument.value?.kind === kind, `${example} declares kind ${JSON.stringify(exampleDocument.value?.kind)} instead of ${kind}`);

    contracts.push({
      kind,
      role: "root",
      domain: kindToDomain.get(kind),
      schema,
      schemaSha256: sha256Bytes(schemaDocument.bytes),
      example,
      exampleSha256: sha256Bytes(exampleDocument.bytes),
    });
  }

  const indexedSupportSchemas = [];
  for (const support of supportSchemas) {
    assert(!seenSchemas.has(support.schema), `Support schema is also registered as a root schema: ${support.schema}`);
    const document = await readJson(join(resourceRoot, support.schema));
    indexedSupportSchemas.push({
      ...support,
      schemaSha256: sha256Bytes(document.bytes),
    });
  }

  return {
    schemaVersion: "3.0.0",
    skill: manifest.skill,
    skillVersion: manifest.version,
    contracts,
    supportSchemas: indexedSupportSchemas,
  };
}

async function main() {
  const check = process.argv.includes("--check");
  const index = await createIndex();
  const serialized = `${JSON.stringify(index, null, 2)}\n`;

  if (check) {
    const existing = await readFile(indexPath, "utf8");
    assert(existing === serialized, `Contract index is stale: ${relative(repositoryRoot, indexPath)}`);
  } else {
    await writeFile(indexPath, serialized, "utf8");
  }

  console.log(JSON.stringify({
    valid: true,
    mode: check ? "check" : "write",
    roots: index.contracts.length,
    supportSchemas: index.supportSchemas.length,
    index: relative(repositoryRoot, indexPath).replaceAll("\\", "/"),
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
