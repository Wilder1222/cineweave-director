import { createHash } from "node:crypto";

function assertUnicodeScalar(value, label = "string") {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) throw new TypeError(`${label} contains an unpaired high surrogate`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError(`${label} contains an unpaired low surrogate`);
    }
  }
}

function compareUtf16(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("JCS only accepts finite JSON numbers");
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertUnicodeScalar(value);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError("JCS does not accept symbol keys");
    const keys = Object.getOwnPropertyNames(value).filter((key) => key !== "length");
    for (const key of keys) {
      const index = Number(key);
      if (!Number.isSafeInteger(index) || index < 0 || index >= value.length || String(index) !== key) {
        throw new TypeError("JCS does not accept non-index array property: " + key);
      }
    }
    if (keys.length !== value.length) throw new TypeError("JCS does not accept sparse arrays");
    return `[${value.map((item) => canonicalize(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError("JCS accepts plain JSON objects only");
    if (Object.getOwnPropertySymbols(value).length) throw new TypeError("JCS does not accept symbol keys");
    const keys = Object.keys(value).sort(compareUtf16);
    return `{${keys.map((key) => {
      assertUnicodeScalar(key, "object key");
      const child = value[key];
      if (child === undefined || typeof child === "function" || typeof child === "symbol" || typeof child === "bigint") {
        throw new TypeError(`Object key ${JSON.stringify(key)} contains a non-JSON value`);
      }
      return `${JSON.stringify(key)}:${canonicalize(child)}`;
    }).join(",")}}`;
  }
  throw new TypeError(`Unsupported JSON value type: ${typeof value}`);
}

export function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalize(value), "utf8").digest("hex")}`;
}

export function sha256Bytes(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function parseJsonStrict(text) {
  let cursor = 0;
  const source = String(text);
  const fail = (message) => { throw new SyntaxError(`${message} at offset ${cursor}`); };
  const whitespace = () => { while (/[\u0009\u000a\u000d\u0020]/u.test(source[cursor] || "")) cursor += 1; };

  const parseString = () => {
    if (source[cursor] !== '"') fail("Expected JSON string");
    const start = cursor;
    cursor += 1;
    let escaped = false;
    while (cursor < source.length) {
      const character = source[cursor];
      if (!escaped && character === '"') {
        cursor += 1;
        const value = JSON.parse(source.slice(start, cursor));
        assertUnicodeScalar(value);
        return value;
      }
      if (!escaped && character.charCodeAt(0) < 0x20) fail("Unescaped control character in JSON string");
      if (!escaped && character === "\\") escaped = true;
      else escaped = false;
      cursor += 1;
    }
    fail("Unterminated JSON string");
  };

  const parseNumber = () => {
    const match = source.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!match) fail("Invalid JSON number");
    cursor += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) fail("JSON number is outside the finite IEEE-754 range");
    return value;
  };

  const parseValue = () => {
    whitespace();
    const character = source[cursor];
    if (character === '"') return parseString();
    if (character === "{") {
      cursor += 1;
      whitespace();
      const result = Object.create(null);
      const keys = new Set();
      if (source[cursor] === "}") { cursor += 1; return result; }
      while (cursor < source.length) {
        whitespace();
        const key = parseString();
        if (keys.has(key)) fail(`Duplicate object key ${JSON.stringify(key)}`);
        keys.add(key);
        whitespace();
        if (source[cursor] !== ":") fail("Expected colon after object key");
        cursor += 1;
        result[key] = parseValue();
        whitespace();
        if (source[cursor] === "}") { cursor += 1; return result; }
        if (source[cursor] !== ",") fail("Expected comma between object members");
        cursor += 1;
      }
      fail("Unterminated JSON object");
    }
    if (character === "[") {
      cursor += 1;
      whitespace();
      const result = [];
      if (source[cursor] === "]") { cursor += 1; return result; }
      while (cursor < source.length) {
        result.push(parseValue());
        whitespace();
        if (source[cursor] === "]") { cursor += 1; return result; }
        if (source[cursor] !== ",") fail("Expected comma between array items");
        cursor += 1;
      }
      fail("Unterminated JSON array");
    }
    if (source.startsWith("true", cursor)) { cursor += 4; return true; }
    if (source.startsWith("false", cursor)) { cursor += 5; return false; }
    if (source.startsWith("null", cursor)) { cursor += 4; return null; }
    return parseNumber();
  };

  const value = parseValue();
  whitespace();
  if (cursor !== source.length) fail("Unexpected trailing JSON content");
  return value;
}
