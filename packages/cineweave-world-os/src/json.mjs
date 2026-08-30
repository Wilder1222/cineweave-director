import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { parseJsonStrict, sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { HASH_PATTERN } from "./constants.mjs";

export async function readJson(path) {
  return parseJsonStrict(await readFile(resolve(path), "utf8"));
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function assertPlainObject(value, label) {
  if (!isPlainObject(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

export function exactRef(kind, id, version, payload) {
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError("version must be a positive integer");
  return { kind, id, version, contentHash: sha256Canonical(payload) };
}

export function isExactRef(value) {
  return isPlainObject(value)
    && typeof value.kind === "string"
    && typeof value.id === "string"
    && Number.isSafeInteger(value.version)
    && value.version > 0
    && HASH_PATTERN.test(value.contentHash || "")
    && Object.keys(value).length === 4;
}

export function sameRef(left, right) {
  return isExactRef(left)
    && isExactRef(right)
    && left.kind === right.kind
    && left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash;
}

export function resolveWorkspacePath(workspacePath, relativePath, allowedRoot = dirname(resolve(workspacePath))) {
  if (typeof relativePath !== "string" || !relativePath || isAbsolute(relativePath) || relativePath.includes("\0")) {
    throw new TypeError(`Unsafe workspace-relative path: ${String(relativePath)}`);
  }
  const root = resolve(allowedRoot);
  const target = resolve(dirname(resolve(workspacePath)), relativePath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    throw new TypeError(`Workspace path escapes the allowed root: ${relativePath}`);
  }
  return target;
}

export function relativeSlash(from, to) {
  return relative(from, to).split(sep).join("/");
}

function decodePointerToken(token) {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

const FORBIDDEN_POINTER_TOKENS = new Set(["__proto__", "prototype", "constructor"]);

export function pointerTokens(pointer) {
  if (pointer === "") return [];
  if (typeof pointer !== "string" || !pointer.startsWith("/")) throw new TypeError(`Invalid JSON pointer: ${String(pointer)}`);
  const tokens = pointer.slice(1).split("/").map(decodePointerToken);
  if (tokens.some((token) => FORBIDDEN_POINTER_TOKENS.has(token))) {
    throw new TypeError(`Unsafe JSON pointer token: ${pointer}`);
  }
  return tokens;
}

export function pointerGet(document, pointer) {
  return pointerTokens(pointer).reduce((current, token) => {
    if (current === null || current === undefined || !Object.hasOwn(Object(current), token)) return undefined;
    return current[token];
  }, document);
}

export function deepClone(value) {
  return structuredClone(value);
}

export function applyEffect(document, effect) {
  const tokens = pointerTokens(effect.path);
  if (!tokens.length) throw new TypeError("Effects cannot replace the state root");
  const key = tokens.at(-1);
  let parent = document;
  for (const token of tokens.slice(0, -1)) {
    if (parent === null || parent === undefined || !Object.hasOwn(Object(parent), token)) throw new TypeError(`Effect parent does not exist: ${effect.path}`);
    const child = parent[token];
    if (!isPlainObject(child) && !Array.isArray(child)) throw new TypeError(`Effect parent does not exist: ${effect.path}`);
    parent = child;
  }
  if (effect.op === "replace") {
    if (!Object.hasOwn(Object(parent), key)) throw new TypeError(`Replace target does not exist: ${effect.path}`);
    parent[key] = deepClone(effect.value);
  } else if (effect.op === "add") {
    if (Object.hasOwn(Object(parent), key)) throw new TypeError(`Add target already exists: ${effect.path}`);
    parent[key] = deepClone(effect.value);
  } else if (effect.op === "increment") {
    if (typeof parent[key] !== "number" || typeof effect.value !== "number" || !Number.isFinite(effect.value)) {
      throw new TypeError(`Increment requires finite numbers: ${effect.path}`);
    }
    parent[key] += effect.value;
  } else if (effect.op === "append") {
    if (!Array.isArray(parent[key])) throw new TypeError(`Append target must be an array: ${effect.path}`);
    parent[key].push(deepClone(effect.value));
  } else {
    throw new TypeError(`Unsupported effect operation: ${String(effect.op)}`);
  }
  return document;
}
