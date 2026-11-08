#!/usr/bin/env node
// Read-only projection of the authored cards; no second formula or alias registry.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const STYLE_DOCUMENTS = Object.freeze([
  "references/optional/color-grading-presets.md",
  "references/optional/makeup-style-presets.md",
]);
const normalize = value => value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
const hash = value => createHash("sha256").update(value).digest("hex");

export function parseStyleDocument(text, path) {
  const lines = text.split("\n");
  const sourceSha256 = hash(text);
  const headings = [...text.matchAll(/^## (.+)$/gmu)];
  const cards = [];
  for (let i = 0; i < headings.length; i++) {
    const match = /^(CG\d{2}|MU\d{2}) (.+)$/u.exec(headings[i][1].trim());
    if (!match) continue;
    const start = headings[i].index, end = headings[i + 1]?.index ?? text.length;
    const body = text.slice(start, end);
    const revisions = [...body.matchAll(/(?:\*\*卡片修订：\*\*|卡片修订|原创卡@r)(\d+)/gu)];
    if (revisions.length !== 1 || Number(revisions[0][1]) < 1) throw new Error(`${match[1]} must declare exactly one positive card revision`);
    const startLine = text.slice(0, start).split("\n").length;
    const endLine = startLine + body.split("\n").length - (body.endsWith("\n") ? 2 : 1);
    cards.push({ id: match[1], name: match[2], revision: Number(revisions[0][1]), path,
      startLine, endLine, sourceSha256, aliases: [], text: body });
  }
  for (const line of lines) {
    const row = /^\| ((?:CG|MU)\d{2})(?:@r\d+)? \| ([^|]+) \|([^|]*)\|/u.exec(line);
    if (!row) continue;
    const card = cards.find(value => value.id === row[1]);
    if (!card) throw new Error(`Directory points to missing ${row[1]}`);
    card.aliases.push(row[2].trim().replace(/（[^）]*动画[^）]*）/gu, ""));
    if (card.id.startsWith("CG")) {
      const alias = row[3].trim().replace(/（r\d+）/gu, "");
      if (!["无", "同主名称"].includes(alias)) card.aliases.push(alias, row[3].trim());
    }
  }
  // A retired makeup name resolves to its current card, never its retired formula.
  for (const migration of text.matchAll(/(MU\d{2}) 旧版「([^」]+)」/gu)) {
    const card = cards.find(value => value.id === migration[1]);
    if (!card) throw new Error(`Migration points to missing ${migration[1]}`);
    card.aliases.push(migration[2]);
  }
  return cards;
}

export async function readStyleCards(queries, { skillRoot = ROOT } = {}) {
  if (!Array.isArray(queries) || queries.length === 0) throw new Error("Specify a card ID or exact name/alias");
  const documents = await Promise.all(STYLE_DOCUMENTS.map(async path => ({ path, text: await readFile(resolve(skillRoot, path), "utf8") })));
  const cards = documents.flatMap(doc => parseStyleDocument(doc.text, doc.path));
  if (new Set(cards.map(card => card.id)).size !== cards.length) throw new Error("Duplicate card ID");
  const selected = [];
  for (const query of queries) {
    const versioned = /^(CG\d{2}|MU\d{2})@r(\d+)$/iu.exec(query);
    const key = normalize(versioned?.[1] ?? query);
    const matches = cards.filter(card => [card.id, card.name, ...card.aliases].some(name => normalize(name) === key));
    if (matches.length !== 1) throw new Error(matches.length ? `Ambiguous card: ${query}; use ${matches.map(c => c.id).join(", ")}` : `Unknown card: ${query}; inspect the authored directory, do not invent a formula`);
    const card = matches[0];
    if (versioned && Number(versioned[2]) !== card.revision) throw new Error(`${card.id} current revision is r${card.revision}, not r${versioned[2]}`);
    if (!selected.some(value => value.id === card.id)) selected.push(card);
  }
  return selected;
}

export function formatStyleCards(cards) {
  return cards.map(card => `<!-- ${card.id}@r${card.revision}; source: ${card.path}:${card.startLine}-${card.endLine}; sha256: ${card.sourceSha256} -->\n${card.text}`).join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    const json = args[0] === "--json";
    if (json) args.shift();
    if (args.some(arg => arg.startsWith("--"))) throw new Error("Usage: node scripts/read-style-card.mjs [--json] <ID/name/alias> [...]");
    const cards = await readStyleCards(args);
    process.stdout.write(json ? `${JSON.stringify(cards, null, 2)}\n` : formatStyleCards(cards));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
