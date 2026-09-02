#!/usr/bin/env node

import { lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  createDistributionInventory,
  repositoryRoot,
  validateBundle,
  validateRepository,
} from "./validate-repository.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

export async function assertSafeBuildRoot(buildRoot, outputRoot) {
  await mkdir(buildRoot, { recursive: true });
  const buildStat = await lstat(buildRoot);
  assert(buildStat.isDirectory() && !buildStat.isSymbolicLink(), ".build must be a real directory");
  const outputRelative = relative(buildRoot, outputRoot);
  assert(
    isWithin(buildRoot, outputRoot) && outputRelative.length > 0 && !outputRelative.includes(sep),
    "Bundle output must be a direct child directory of .build",
  );
  const outputStat = await lstat(outputRoot).catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  assert(!outputStat?.isSymbolicLink(), "Refusing to replace a symbolic-link bundle output");
  if (outputStat) assert(outputStat.isDirectory(), "Bundle output must be a directory when it already exists");
}

function parseOutputArgument(args) {
  if (args.length === 0) return resolve(repositoryRoot, ".build", "cineweave-director");
  if (args.length === 2 && args[0] === "--output") return resolve(repositoryRoot, args[1]);
  throw new Error("Usage: node scripts/build-plugin-bundle.mjs [--output <direct-child-path-under-.build>]");
}

export async function buildPluginBundle(outputArgument) {
  const sourceRoot = resolve(repositoryRoot);
  const buildRoot = resolve(sourceRoot, ".build");
  const outputRoot = resolve(outputArgument ?? resolve(buildRoot, "cineweave-director"));
  await assertSafeBuildRoot(buildRoot, outputRoot);

  const sourceValidation = await validateRepository(sourceRoot);
  const inventory = await createDistributionInventory(sourceRoot);
  assert(sourceValidation.files === inventory.files.length, "Source validation and inventory file counts disagree");

  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  for (const relativePath of inventory.files) {
    const sourcePath = resolve(sourceRoot, ...relativePath.split("/"));
    const destinationPath = resolve(outputRoot, ...relativePath.split("/"));
    assert(isWithin(sourceRoot, sourcePath), `Source path escapes repository: ${relativePath}`);
    assert(isWithin(outputRoot, destinationPath), `Destination path escapes bundle: ${relativePath}`);
    const sourceStat = await lstat(sourcePath);
    assert(sourceStat.isFile() && !sourceStat.isSymbolicLink(), `Source is not a regular file: ${relativePath}`);
    await mkdir(dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, await readFile(sourcePath));
  }

  const validation = await validateBundle(outputRoot, sourceRoot);
  return {
    valid: true,
    source: sourceRoot,
    bundle: outputRoot,
    files: inventory.files.length,
    roots: validation.roots,
    schemas: validation.schemas,
    examples: validation.examples,
    references: validation.references,
    byteIdentical: true,
  };
}

async function main() {
  const outputRoot = parseOutputArgument(process.argv.slice(2));
  console.log(JSON.stringify(await buildPluginBundle(outputRoot), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 1;
  });
}
