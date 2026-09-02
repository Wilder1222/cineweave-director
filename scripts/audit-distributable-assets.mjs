#!/usr/bin/env node

import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectStaticSvg } from "./svg-safety.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".mov", ".wav", ".mp3", ".ttf", ".otf"]);
const mediaExtensions = new Set([...binaryExtensions, ".svg"]);
const errors = [];

async function walk(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if ([".git", ".build", "node_modules"].includes(entry.name)) continue;
    const current = join(path, entry.name);
    result.push(current);
    if (entry.isDirectory()) result.push(...await walk(current));
  }
  return result;
}

function insideRoot(path) {
  const value = resolve(path);
  return value === repoRoot || value.startsWith(`${repoRoot}${process.platform === "win32" ? "\\" : "/"}`);
}

function inspectRights(value, pathLabel) {
  if (Array.isArray(value)) return value.forEach((item, index) => inspectRights(item, `${pathLabel}[${index}]`));
  if (!value || typeof value !== "object") return;
  if (["unverified", "unknown"].includes(value.rightsStatus)) {
    for (const key of ["file", "path", "asset", "sourceFile"]) {
      if (typeof value[key] === "string" && mediaExtensions.has(extname(value[key]).toLowerCase())) errors.push(`${pathLabel} binds ${value.rightsStatus} rights to distributable media ${value[key]}`);
    }
  }
  for (const [key, child] of Object.entries(value)) inspectRights(child, `${pathLabel}.${key}`);
}

const paths = await walk(repoRoot);
for (const path of paths) {
  const info = await lstat(path);
  if (info.isSymbolicLink()) {
    const target = await realpath(path);
    if (!insideRoot(target)) errors.push(`Symlink escapes plugin root: ${relative(repoRoot, path)}`);
  }
  if (!info.isFile()) continue;
  const extension = extname(path).toLowerCase();
  const local = relative(repoRoot, path).replaceAll("\\", "/");
  if (mediaExtensions.has(extension)) {
    const allowed = local.startsWith("assets/") || /^skills\/[^/]+\/assets\//.test(local);
    if (!allowed) errors.push(`Distributable media asset must live under assets/: ${local}`);
    if (/\/references\//.test(`/${local}`)) errors.push(`Media may not be bundled as a Skill reference: ${local}`);
  }
  if (extension === ".svg") {
    const content = await readFile(path, "utf8");
    for (const kind of inspectStaticSvg(content)) errors.push(`SVG contains forbidden active or external content (${kind}): ${local}`);
  }
  if (extension === ".json") {
    try { inspectRights(JSON.parse(await readFile(path, "utf8")), local); }
    catch { /* JSON syntax is checked by the release gate. */ }
  }
}

const plugin = JSON.parse(await readFile(join(repoRoot, ".codex-plugin", "plugin.json"), "utf8"));
for (const field of ["composerIcon", "logo", "logoDark"]) {
  const value = plugin.interface?.[field];
  if (!value) continue;
  if (isAbsolute(value)) errors.push(`Plugin ${field} must be relative`);
  const target = resolve(repoRoot, value);
  if (!insideRoot(target) || !existsSync(target)) errors.push(`Plugin ${field} does not resolve inside the archive: ${value}`);
}
for (const screenshot of plugin.interface?.screenshots || []) {
  const target = resolve(repoRoot, screenshot);
  if (!insideRoot(target) || !existsSync(target) || extname(target).toLowerCase() !== ".png") errors.push(`Invalid plugin screenshot: ${screenshot}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Distributable asset audit passed: no unverified media or escaping asset paths.");
}
