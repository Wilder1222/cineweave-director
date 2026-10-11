import { lstat, readFile, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function within(root, path) {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

// The repository uses ATX/Setext headings, inline/reference links and HTML IDs.
// Ignore code examples and comments; they do not create rendered headings/links.
function renderedLines(markdown) {
  let fence = null;
  return markdown.replace(/<!--[\s\S]*?-->/gu, "").split(/\r?\n/u).map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/u);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return "";
    }
    if (marker) { fence = marker[1]; return ""; }
    return /^(?: {4}|\t)/u.test(line) ? "" : line;
  });
}

function decodeEntities(text) {
  return text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/giu, (entity) => {
    const named = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };
    if (Object.hasOwn(named, entity)) return named[entity];
    const code = entity.toLowerCase().startsWith("&#x") ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

export function markdownAnchors(markdown) {
  const lines = renderedLines(markdown);
  const anchors = new Set();
  const headingIds = new Set();
  const inlineText = (text) => decodeEntities(text.replace(/<[^>]*>/gu, "").replace(/!?\[([^\]]*)\]\([^)]*\)/gu, "$1").replace(/[*`~]/gu, ""));
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const match of line.matchAll(/<[^>]+\b(?:id|name)=["']([^"']+)["'][^>]*>/giu)) anchors.add(decodeEntities(match[1]));
    const atx = line.match(/^ {0,3}#{1,6}(?:\s+(.+?)\s*#*\s*|\s*)$/u);
    const setext = i > 0 && /^ {0,3}(?:=+|-+)\s*$/u.test(line) && lines[i - 1].trim() ? lines[i - 1] : null;
    if (!atx && !setext) continue;
    const base = inlineText(atx ? atx[1] ?? "" : setext).trim().toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, "").replace(/ /gu, "-");
    let slug = base;
    for (let suffix = 1; headingIds.has(slug); suffix += 1) slug = `${base}-${suffix}`;
    headingIds.add(slug);
    anchors.add(slug);
  }
  return anchors;
}

function linkTargets(markdown) {
  const rendered = renderedLines(markdown).join("\n").replace(/(`+)[\s\S]*?\1/gu, "");
  const targets = [];
  for (const match of rendered.matchAll(/!?\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/gu)) targets.push(match[1]);
  for (const match of rendered.matchAll(/^ {0,3}\[(?!\^)[^\]]+\]:\s*(<[^>]+>|\S+)/gmu)) targets.push(match[1]);
  for (const match of rendered.matchAll(/\b(?:href|src)=["']([^"']+)["']/giu)) targets.push(decodeEntities(match[1]));
  return targets;
}

export async function validateMarkdownFiles(root, markdownFiles) {
  root = await realpath(root);
  const documents = new Map();
  const anchors = new Map();
  const read = async (path) => {
    if (!documents.has(path)) documents.set(path, await readFile(path, "utf8"));
    return documents.get(path);
  };
  let links = 0, fragments = 0;
  for (const markdownPath of markdownFiles) {
    const source = resolve(root, markdownPath);
    assert(within(root, source), `Markdown path escapes root: ${markdownPath}`);
    for (let target of linkTargets(await read(source))) {
      links += 1;
      target = target.replace(/^<|>$/gu, "");
      if (/^(?:https?:|mailto:|data:)/iu.test(target)) {
        if (/^https?:/iu.test(target)) new URL(target);
        continue;
      }
      let file, fragment;
      const hash = target.indexOf("#");
      try {
        file = decodeURIComponent((hash < 0 ? target : target.slice(0, hash)).split("?", 1)[0]);
        fragment = hash < 0 ? "" : decodeURIComponent(target.slice(hash + 1));
      } catch { throw new Error(`${markdownPath} contains an invalid encoded link: ${target}`); }
      assert(!file.includes("\\") && !isAbsolute(file) && !/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(file), `${markdownPath} contains an absolute or unsupported link: ${target}`);
      const destination = file ? resolve(dirname(source), file) : source;
      assert(within(root, destination), `${markdownPath} link escapes the validation root: ${target}`);
      const stat = await lstat(destination).catch(() => null);
      assert(stat && !stat.isSymbolicLink() && (stat.isFile() || stat.isDirectory()), `${markdownPath} contains a broken local link: ${target}`);
      assert(within(root, await realpath(destination)), `${markdownPath} resolved link escapes the validation root: ${target}`);
      if (fragment && extname(destination).toLowerCase() === ".md") {
        fragments += 1;
        if (!anchors.has(destination)) anchors.set(destination, markdownAnchors(await read(destination)));
        assert(anchors.get(destination).has(fragment), `${markdownPath} contains a broken local fragment: ${target}`);
      }
    }
  }
  return { markdownFiles: markdownFiles.length, links, fragments };
}
