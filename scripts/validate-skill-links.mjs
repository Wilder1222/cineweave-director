#!/usr/bin/env node

import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";

async function listMarkdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listMarkdownFiles(file));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(file);
  }
  return files.sort();
}

function localTargets(markdown) {
  const targets = [];
  const addLocalTarget = (value) => {
    const target = value.replace(/^<|>$/g, "");
    if (!target || target.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return;
    targets.push(decodeURIComponent(target.split("#", 1)[0]));
  };
  const linkPattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(linkPattern)) addLocalTarget(match[1]);
  const inlinePathPattern = /`((?:(?:\.\.?\/)+)?(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+\.(?:md|mdx|json|ya?ml|[cm]?js|py|sh))`/g;
  for (const match of markdown.matchAll(inlinePathPattern)) addLocalTarget(match[1]);
  return [...new Set(targets)];
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const skillRoot = resolve(process.argv[2] ?? "skills");
  const markdownFiles = await listMarkdownFiles(skillRoot);
  const errors = [];
  for (const file of markdownFiles) {
    const markdown = await readFile(file, "utf8");
    for (const target of localTargets(markdown)) {
      const resolved = resolve(dirname(file), target);
      if (!await exists(resolved)) errors.push(`${file}: missing local link ${target}`);
    }
  }
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 2;
    return;
  }
  console.log(`Validated ${markdownFiles.length} Markdown files and their local links.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
