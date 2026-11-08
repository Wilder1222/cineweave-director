#!/usr/bin/env node
// Evaluation instrumentation: persist exactly the resource text emitted on stdout.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";

const hash = value => createHash("sha256").update(value).digest("hex");
export function selectSection(text, heading) {
  const headings = [...text.matchAll(/^(#{1,6}) (.+)$/gmu)];
  const found = headings.filter(value => value[2].trim() === heading);
  if (found.length !== 1) throw new Error(`Heading must resolve once: ${heading}`);
  const start = found[0];
  const next = headings.find(value => value.index > start.index && value[1].length <= start[1].length);
  return { start: start.index, end: next?.index ?? text.length };
}

async function main() {
  const [outArg, rootArg, mode, ...args] = process.argv.slice(2);
  if (!outArg || !rootArg || !["file", "card"].includes(mode)) throw new Error("Usage: measure-resource-load.mjs <case-dir> <skill-root> file <relative-path> [heading] | card <ID/name> [...]");
  const out = resolve(outArg), root = resolve(rootArg);
  const started = performance.now();
  let sources, payload;
  if (mode === "file") {
    if (args.length < 1 || args.length > 2) throw new Error("file accepts a relative path and optional exact heading");
    const path = resolve(root, args[0]);
    if (relative(root, path).startsWith(`..${sep}`) || relative(root, path) === "..") throw new Error("Resource must be inside the selected Skill");
    const raw = await readFile(path), text = raw.toString("utf8");
    const range = args[1] ? selectSection(text, args[1]) : { start: 0, end: text.length };
    payload = text.slice(range.start, range.end);
    const startLine = text.slice(0, range.start).split("\n").length;
    sources = [{ path: args[0], sha256: hash(raw), fileBytesRead: raw.length, startLine,
      endLine: startLine + payload.split("\n").length - (payload.endsWith("\n") ? 2 : 1) }];
  } else {
    const helper = await import(pathToFileURL(resolve(root, "scripts/read-style-card.mjs")).href);
    const cards = await helper.readStyleCards(args, { skillRoot: root });
    payload = helper.formatStyleCards(cards);
    sources = cards.map(card => ({ path: card.path, sha256: card.sourceSha256,
      startLine: card.startLine, endLine: card.endLine, id: card.id, revision: card.revision }));
    // The helper scans both local documents; less stdout is not less disk I/O.
    for (const path of helper.STYLE_DOCUMENTS) {
      const raw = await readFile(resolve(root, path));
      sources.push({ path, sha256: hash(raw), fileBytesRead: raw.length, role: "lookup scan; not emitted in full" });
    }
  }
  const elapsedMs = performance.now() - started;
  await mkdir(out, { recursive: true });
  let trace;
  try { trace = JSON.parse(await readFile(resolve(out, "read-trace.json"), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; trace = []; }
  const index = trace.length + 1, filename = `read-${String(index).padStart(2, "0")}.txt`;
  await writeFile(resolve(out, filename), payload, "utf8");
  trace.push({ index, mode, args, sources, payloadFile: filename, payloadSha256: hash(payload),
    emittedUtf8Bytes: Buffer.byteLength(payload), emittedCodePoints: [...payload].length,
    localReadAndRenderMs: elapsedMs, tokenUsage: null, toolEnvelopeIncluded: false });
  await writeFile(resolve(out, "read-trace.json"), `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  process.stdout.write(payload);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 2; });
}
