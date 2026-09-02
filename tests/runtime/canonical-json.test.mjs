import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, parseJsonStrict, sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";

test("canonicalization ignores object insertion order", () => {
  const left = { z: 1, a: { y: true, x: "宋韵" } };
  const right = { a: { x: "宋韵", y: true }, z: 1 };
  assert.equal(canonicalize(left), canonicalize(right));
  assert.equal(sha256Canonical(left), sha256Canonical(right));
});

test("strict parser rejects duplicate object keys", () => {
  assert.throws(() => parseJsonStrict('{"a":1,"a":2}'), /Duplicate object key/);
});

test("strict parser accepts only JSON whitespace", () => {
  assert.throws(() => parseJsonStrict('{\u00a0"a":1}'), /Expected JSON string|Invalid JSON number/);
});

test("strict parser preserves prototype-named keys without prototype mutation", () => {
  const value = parseJsonStrict('{"__proto__":{"polluted":true}}');
  assert.equal(Object.getPrototypeOf(value), null);
  assert.equal(value.__proto__.polluted, true);
  assert.match(canonicalize(value), /"__proto__"/);
});

test("canonicalization rejects non-I-JSON Unicode", () => {
  assert.throws(() => canonicalize({ value: "\ud800" }), /unpaired high surrogate/);
});

test("canonicalization rejects sparse and extended arrays without scanning their declared length", () => {
  const sparse = [];
  sparse.length = 2;
  assert.throws(() => canonicalize(sparse), /sparse arrays/);

  const extended = [1];
  Object.defineProperty(extended, "metadata", { value: "ignored", enumerable: false });
  assert.throws(() => canonicalize(extended), /non-index array property/);

  const hugeSparse = [];
  hugeSparse.length = 0xffffffff;
  assert.throws(() => canonicalize(hugeSparse), /sparse arrays/);
});
