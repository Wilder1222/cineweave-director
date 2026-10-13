#!/usr/bin/env node
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { repositoryRoot, validateAuthoringSources } from "./validate-repository.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function within(root, path) {
  const value = relative(root, path);
  return value === "" || (!isAbsolute(value) && value !== ".." && !value.startsWith(`..${sep}`));
}
async function inspectPath(root, path, missingAllowed) {
  assert(within(root, path), `Skill export escapes the source root: ${path}`);
  const realRoot = await realpath(root);
  let current = root;
  const parts = relative(root, path).split(sep).filter(Boolean);
  for (const [position, part] of parts.entries()) {
    current = resolve(current, part);
    const stat = await lstat(current).catch((error) => {
      if (error.code === "ENOENT" && missingAllowed) return null;
      throw error;
    });
    if (!stat) return;
    assert(!stat.isSymbolicLink(), `Refusing a symbolic skill export path: ${current}`);
    assert(position === parts.length - 1 ? stat.isFile() : stat.isDirectory(), `Invalid skill export path type: ${current}`);
    assert(within(realRoot, await realpath(current)), `Resolved skill export escapes source root: ${current}`);
  }
}
async function listFiles(root, allowedDirectories, prefix = "") {
  const result = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = resolve(root, entry.name);
    const key = `${prefix}${entry.name}`;
    assert(!entry.isSymbolicLink(), `Refusing symbolic generated Skill entry: ${path}`);
    if (entry.isDirectory()) {
      assert(allowedDirectories.has(key), `Unregistered derived Skill directory: ${key}`);
      result.push(...await listFiles(path, allowedDirectories, `${key}/`));
    }
    else {
      assert(entry.isFile(), `Generated Skill entry must be regular: ${path}`);
      result.push(key);
    }
  }
  return result;
}

// Synchronization is explicit: it replaces registered derived files only.
// It never deletes a directory, unknown file, or the canonical director source.
export async function syncSkillExports({ sourceRoot = repositoryRoot, check = false } = {}) {
  assert(typeof check === "boolean", "check must be boolean");
  const root = resolve(sourceRoot);
  const preflight = await validateAuthoringSources(root);
  const inventory = preflight.inventory;
  const children = inventory.skills.filter((skill) => skill.name !== "cineweave-director");
  const buffers = [];
  for (const child of children) {
    const childRoot = resolve(root, "skills", child.name);
    const stat = await lstat(childRoot).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (stat) {
      assert(stat.isDirectory() && !stat.isSymbolicLink(), `Derived Skill must be a real directory: ${child.name}`);
      const allowed = new Set(child.exports.map((entry) => relative(childRoot, resolve(root, entry.destination)).split(sep).join("/")));
      const allowedDirectories = new Set();
      for (const file of allowed) {
        const parts = file.split("/");
        for (let depth = 1; depth < parts.length; depth += 1) allowedDirectories.add(parts.slice(0, depth).join("/"));
      }
      for (const path of await listFiles(childRoot, allowedDirectories)) assert(allowed.has(path), `Unregistered derived Skill file: ${child.name}/${path}`);
    }
    for (const entry of child.exports) {
      const source = resolve(root, entry.source);
      const destination = resolve(root, entry.destination);
      assert(within(childRoot, destination) && destination !== childRoot, "Sync may only write registered child Skill files");
      await inspectPath(root, source, false);
      await inspectPath(root, destination, !check);
      const data = await readFile(source);
      const previous = await readFile(destination).catch((error) => {
        if (error.code === "ENOENT" && !check) return null;
        throw error;
      });
      if (check) assert(previous?.equals(data), `Derived Skill is stale: ${entry.destination}; run skills:sync`);
      buffers.push({ destination, data, changed: !previous?.equals(data) });
    }
  }
  // All source files, destination paths, and unknown entries are checked first.
  let filesUpdated = 0;
  if (!check) for (const item of buffers) if (item.changed) {
    await mkdir(dirname(item.destination), { recursive: true });
    await inspectPath(root, item.destination, true);
    await writeFile(item.destination, item.data);
    filesUpdated += 1;
  }
  return { valid: true, mode: check ? "check" : "sync", childCount: children.length,
    filesChecked: buffers.length, filesUpdated,
    messageZh: check ? "专业 Skill 派生副本与作者源一致。" : "已同步登记的专业 Skill 派生文件；未删除任何文件。" };
}
async function main() {
  const args = process.argv.slice(2);
  assert(args.length === 0 || (args.length === 1 && args[0] === "--check"), "用法：node scripts/sync-skill-exports.mjs [--check]");
  console.log(JSON.stringify(await syncSkillExports({ check: args.length === 1 }), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
