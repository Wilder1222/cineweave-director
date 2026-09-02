#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseJsonStrict } from "../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function toRelative(root, path) {
  return relative(root, path).split(sep).join("/");
}

function inside(root, path) {
  const value = relative(root, path);
  return value !== "" && value !== ".." && !value.startsWith(".." + sep) && !isAbsolute(value);
}

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(path));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(path);
  }
  return files.sort();
}

function localTargets(markdown) {
  const targets = [];
  const add = (value) => {
    const target = value.replace(/^<|>$/g, "");
    if (!target || target.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return;
    targets.push(decodeURIComponent(target.split("#", 1)[0]));
  };
  const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(linkPattern)) add(match[1]);
  const inlinePathPattern = /`((?:(?:\.\.?\/)+)?(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:md|mdx|json|ya?ml|[cm]?js|py|sh))`/g;
  for (const match of markdown.matchAll(inlinePathPattern)) add(match[1]);
  return [...new Set(targets)];
}

async function isFile(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function validReferencePath(root, value) {
  if (typeof value !== "string" || !value.startsWith("references/") || !value.endsWith(".md")) return false;
  const resolved = resolve(root, value);
  return inside(root, resolved) && toRelative(root, resolved) === value;
}

function positiveStrings(value) {
  return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
}

export async function validateReferenceLifecycle(skillRoot) {
  const root = resolve(skillRoot);
  const catalogPath = resolve(root, "reference-lifecycle.json");
  const skillPath = resolve(root, "SKILL.md");
  const referencesRoot = resolve(root, "references");
  const errors = [];

  let catalog;
  try {
    catalog = parseJsonStrict(await readFile(catalogPath, "utf8"));
  } catch (error) {
    return { valid: false, errors: ["cannot read reference lifecycle catalog: " + (error instanceof Error ? error.message : String(error))], routed: 0, archived: 0, total: 0, skill: null };
  }
  if (!isObject(catalog)) errors.push("reference lifecycle catalog must be an object");
  if (!isObject(catalog) || catalog.catalogVersion !== "1.0.0") errors.push("reference lifecycle catalog must declare catalogVersion 1.0.0");
  if (!isObject(catalog) || typeof catalog.skill !== "string" || !catalog.skill.trim()) errors.push("reference lifecycle catalog must declare its Skill name");
  if (!isObject(catalog) || !Array.isArray(catalog.references)) errors.push("reference lifecycle catalog must contain a references array");
  if (errors.length) return { valid: false, errors, routed: 0, archived: 0, total: 0, skill: catalog?.skill || null };

  const referenceFiles = await listMarkdownFiles(referencesRoot);
  const actualPaths = new Set(referenceFiles.map((path) => toRelative(root, path)));
  const skillMarkdown = await readFile(skillPath, "utf8");
  const directlyLoaded = new Set();
  for (const target of localTargets(skillMarkdown)) {
    const resolved = resolve(dirname(skillPath), target);
    if (inside(root, resolved)) directlyLoaded.add(toRelative(root, resolved));
  }

  const entries = new Map();
  const archivedEntries = [];
  let routed = 0;
  let archived = 0;
  for (const item of catalog.references) {
    if (!isObject(item)) {
      errors.push("reference lifecycle entry must be an object");
      continue;
    }
    if (!validReferencePath(root, item.path)) {
      errors.push("invalid reference lifecycle path " + String(item.path));
      continue;
    }
    if (entries.has(item.path)) {
      errors.push("duplicate reference lifecycle entry " + item.path);
      continue;
    }
    entries.set(item.path, item);
    if (!actualPaths.has(item.path)) errors.push("catalog references missing file " + item.path);

    if (item.lifecycle === "routed") {
      routed += 1;
      if (!positiveStrings(item.loadContexts)) errors.push("routed reference " + item.path + " must declare loadContexts");
      if (!directlyLoaded.has(item.path)) errors.push("routed reference " + item.path + " is not directly exposed by SKILL.md");
    } else if (item.lifecycle === "archived") {
      archived += 1;
      archivedEntries.push(item);
      if (directlyLoaded.has(item.path)) errors.push("archived reference " + item.path + " is still directly exposed by SKILL.md");
      if (typeof item.owner !== "string" || !item.owner.trim()) errors.push("archived reference " + item.path + " must declare an owner");
      if (!positiveStrings(item.successorPaths)) errors.push("archived reference " + item.path + " must declare successorPaths");
      if (typeof item.rationale !== "string" || !item.rationale.trim()) errors.push("archived reference " + item.path + " must declare rationale");
      for (const successorPath of item.successorPaths || []) {
        if (typeof successorPath !== "string" || !successorPath.trim()) continue;
        const successor = resolve(root, successorPath);
        if (!await isFile(successor)) errors.push("archived reference " + item.path + " has missing successor " + successorPath);
      }
    } else {
      errors.push("reference " + item.path + " has unsupported lifecycle " + String(item.lifecycle));
    }
  }

  for (const path of actualPaths) if (!entries.has(path)) errors.push("unclassified reference " + path);
  for (const path of entries.keys()) if (!actualPaths.has(path)) errors.push("catalog entry is not a reference file " + path);
  for (const item of archivedEntries) {
    for (const successorPath of item.successorPaths || []) {
      const successor = resolve(root, successorPath);
      if (!inside(root, successor)) continue;
      const successorEntry = entries.get(toRelative(root, successor));
      if (successorEntry?.lifecycle === "archived") errors.push("archived reference " + item.path + " cannot point only to archived successor " + successorPath);
    }
  }

  return { valid: errors.length === 0, errors, routed, archived, total: actualPaths.size, skill: catalog.skill };
}

async function main() {
  const skillRoot = resolve(process.argv[2] || resolve(repoRoot, "skills", "cineweave-director"));
  const result = await validateReferenceLifecycle(skillRoot);
  if (!result.valid) {
    console.error(result.errors.join("\n"));
    process.exitCode = 2;
    return;
  }
  const label = result.skill === "cineweave-director" ? "Director" : result.skill;
  console.log(label + " reference lifecycle passes: " + result.routed + " routed, " + result.archived + " archived, " + result.total + " total.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 2;
  });
}
