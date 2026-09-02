#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const ORIGINAL_CASE_INDEX_LOAD = "references/original-case-atlas/index.json";

function normalized(value) {
  return String(value).normalize("NFKC").toLocaleLowerCase("en-US");
}

export function planOriginalCaseLoads(index, request) {
  if (index?.routingPolicy?.loadIndexFirst !== true
      || index?.routingPolicy?.maximumCategoryLoads !== 1
      || index?.routingPolicy?.loadUnmatchedCategories !== false
      || !Array.isArray(index?.categories)) {
    throw new TypeError("A one-category Original Case Atlas routing index is required");
  }
  const intent = normalized(request);
  if (!intent.trim()) throw new TypeError("A non-empty worked-example request is required");

  const matches = index.categories.filter((route) => (route?.triggers || [])
    .some((trigger) => intent.includes(normalized(trigger))));
  if (matches.length !== 1) {
    return {
      status: matches.length === 0 ? "unmatched" : "ambiguous",
      categories: matches.map((route) => route.category).sort(),
      loads: [ORIGINAL_CASE_INDEX_LOAD]
    };
  }

  const route = matches[0];
  return {
    status: "matched",
    category: route.category,
    caseIds: [...route.caseIds],
    loads: [ORIGINAL_CASE_INDEX_LOAD, `references/original-case-atlas/${route.referencePath}`]
  };
}

async function main(args) {
  if (args.length !== 4 || args[0] !== "--index" || args[2] !== "--request") {
    throw new Error("Usage: node route-original-case-atlas.mjs --index <index.json> --request <text>");
  }
  const index = JSON.parse(await readFile(args[1], "utf8"));
  process.stdout.write(`${JSON.stringify(planOriginalCaseLoads(index, args[3]), null, 2)}\n`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
