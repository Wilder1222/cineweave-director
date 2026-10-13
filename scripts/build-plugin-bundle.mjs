#!/usr/bin/env node

import { lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
  if (outputStat) assert(isWithin(await realpath(buildRoot), await realpath(outputRoot)), "Resolved bundle output escapes .build");
}

function parseArguments(args) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index], value = args[index + 1];
    assert(["--output", "--skill"].includes(flag) && !Object.hasOwn(values, flag) && value && !value.startsWith("--"),
      "用法：node scripts/build-plugin-bundle.mjs [--skill <已启用 Skill 名称>] [--output <.build 下的直接子目录>]");
    values[flag] = value;
  }
  return { output: values["--output"], target: values["--skill"] ? { type: "skill", name: values["--skill"] } : { type: "plugin" } };
}

async function readRegularSource(root, relativePath) {
  const rootStat = await lstat(root);
  assert(rootStat.isDirectory() && !rootStat.isSymbolicLink(), "Source root must be a real directory");
  let path = root;
  const segments = relativePath.split("/");
  for (const [index, segment] of segments.entries()) {
    path = join(path, segment);
    const stat = await lstat(path);
    assert(!stat.isSymbolicLink(), `Source path contains a symbolic link or junction: ${relativePath}`);
    assert(index === segments.length - 1 ? stat.isFile() : stat.isDirectory(), `Source is not a regular file path: ${relativePath}`);
  }
  assert(isWithin(await realpath(root), await realpath(path)), `Resolved source escapes repository: ${relativePath}`);
  return readFile(path);
}

export async function buildPluginBundle(outputArgument, { sourceRoot: sourceArgument = repositoryRoot, target = { type: "plugin" } } = {}) {
  const sourceRoot = resolve(sourceArgument);
  const buildRoot = resolve(sourceRoot, ".build");
  const outputRoot = resolve(sourceRoot, outputArgument ?? join(".build", target.type === "skill" ? `${target.name}-skill` : "cineweave-director"));
  const sourceStat = await lstat(sourceRoot);
  assert(sourceStat.isDirectory() && !sourceStat.isSymbolicLink(), "Source root must be a real directory");
  await assertSafeBuildRoot(buildRoot, outputRoot);

  await validateRepository(sourceRoot);
  const inventory = await createDistributionInventory(sourceRoot, { target });
  const copies = [];
  for (const entry of inventory.exports) {
    const sourcePath = resolve(sourceRoot, ...entry.source.split("/"));
    const destinationPath = resolve(outputRoot, ...entry.destination.split("/"));
    assert(isWithin(sourceRoot, sourcePath), `Source path escapes repository: ${entry.source}`);
    assert(isWithin(outputRoot, destinationPath), `Destination path escapes bundle: ${entry.destination}`);
    copies.push({ destinationPath, bytes: await readRegularSource(sourceRoot, entry.source) });
  }

  // Verify every source before replacing the existing, explicitly checked output.
  await assertSafeBuildRoot(buildRoot, outputRoot);
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  for (const { destinationPath, bytes } of copies) {
    await mkdir(dirname(destinationPath), { recursive: true });
    await writeFile(destinationPath, bytes);
  }

  const validation = await validateBundle(outputRoot, sourceRoot, { target });
  return {
    valid: true,
    source: sourceRoot,
    bundle: outputRoot,
    target: inventory.target,
    files: inventory.files.length,
    exports: inventory.exports.length,
    sourceFiles: inventory.sourceFiles.length,
    skills: validation.skills,
    totals: validation.totals,
    roots: validation.roots,
    schemas: validation.schemas,
    examples: validation.examples,
    references: validation.references,
    byteIdentical: true,
  };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const result = await buildPluginBundle(args.output, { target: args.target });
  console.log(JSON.stringify({ ...result, messageZh: "插件构建完成，与已校验源码逐字节一致。" }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("插件构建失败，原始诊断：\n" + (error instanceof Error ? error.stack || error.message : String(error)));
    process.exitCode = 1;
  });
}
