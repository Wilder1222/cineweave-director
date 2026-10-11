import { createHash } from "node:crypto";

import { assertUnicodeScalar } from "../skills/cineweave-director/scripts/parse-json.mjs";
export { parseJsonStrict } from "../skills/cineweave-director/scripts/parse-json.mjs";

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
