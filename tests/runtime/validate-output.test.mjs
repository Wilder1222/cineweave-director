import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateDocument } from "../../scripts/validate-output.mjs";

async function withDocuments(schema, payload, callback) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-validate-output-"));
  const schemaPath = join(root, "schema.json");
  const payloadPath = join(root, "payload.json");
  try {
    await writeFile(schemaPath, schema, "utf8");
    await writeFile(payloadPath, payload, "utf8");
    return await callback(schemaPath, payloadPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("contract equality is independent of object key order", async () => {
  const result = await withDocuments(
    JSON.stringify({
      type: "object",
      properties: { value: { const: { first: 1, second: 2 } } },
      required: ["value"],
    }),
    JSON.stringify({ value: { second: 2, first: 1 } }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("uniqueItems treats structurally equal objects as duplicates", async () => {
  const result = await withDocuments(
    JSON.stringify({ type: "array", uniqueItems: true }),
    JSON.stringify([{ first: 1, second: 2 }, { second: 2, first: 1 }]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicates an earlier item/);
});

test("required and additionalProperties use own JSON properties", async () => {
  const requiredResult = await withDocuments(
    JSON.stringify({ type: "object", required: ["toString"] }),
    "{}",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(requiredResult.valid, false);
  assert.match(requiredResult.errors.join("\n"), /toString.*required/);

  const additionalResult = await withDocuments(
    JSON.stringify({ type: "object", additionalProperties: false }),
    JSON.stringify({ toString: "owned" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(additionalResult.valid, false);
  assert.match(additionalResult.errors.join("\n"), /toString.*not allowed/);
});

test("contract documents reject duplicate JSON object keys", async () => {
  await assert.rejects(
    () => withDocuments(
      '{"type":"object"}',
      '{"value":1,"value":2}',
      (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
    ),
    /Duplicate object key/,
  );
});

test("contract formats count Unicode code points and require RFC3339 date-times", async () => {
  const unicodeResult = await withDocuments(
    JSON.stringify({ type: "string", minLength: 1, maxLength: 1 }),
    JSON.stringify("😀"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(unicodeResult.valid, true);

  const dateResult = await withDocuments(
    JSON.stringify({ type: "string", format: "date-time" }),
    JSON.stringify("2026-08-21"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(dateResult.valid, false);
  assert.match(dateResult.errors.join("\n"), /date-time/);
});

test("contract array items support false schemas and tuple tails", async () => {
  const forbiddenResult = await withDocuments(
    JSON.stringify({ type: "array", items: false }),
    "[1]",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbiddenResult.valid, false);

  const tupleResult = await withDocuments(
    JSON.stringify({ type: "array", prefixItems: [{ type: "string" }], items: { type: "number" } }),
    JSON.stringify(["label", 1]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(tupleResult.valid, true);
});

test("not rejects forbidden required-property branches", async () => {
  const schema = JSON.stringify({
    type: "object",
    properties: {
      stable: { type: "string" },
      legacyRef: { type: "object" },
      otherLegacyRef: { type: "object" },
    },
    not: {
      anyOf: [
        { required: ["legacyRef"] },
        { required: ["otherLegacyRef"] },
      ],
    },
  });

  const allowed = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(allowed.valid, true);

  const forbidden = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only", legacyRef: {} }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbidden.valid, false);
  assert.match(forbidden.errors.join("\n"), /must not match the forbidden schema/);
});
