import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createAssetAliasResolver, AssetAliasResolutionError } from "../../packages/cineweave-runtime/src/asset-alias-runtime.mjs";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const registry = JSON.parse(await readFile(join(contractRoot, "examples", "asset-alias-registry.json"), "utf8"));

test("AssetAliasRegistry is schema-valid and resolves exact refs without mutation", async () => {
  const schemaResult = await validatePayload(join(contractRoot, "schemas", "asset-alias-registry.schema.json"), registry);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(registry), []);

  const resolver = createAssetAliasResolver(registry);
  assert.equal(resolver.scope.scopeId, registry.scope.scopeId);
  const target = resolver.resolve("@沈蘅");
  assert.equal(target.kind, "character_binding");
  assert.equal(target.contentHash, registry.aliases[0].targetRef.contentHash);
  assert.throws(() => { target.id = "mutated"; }, TypeError);
  assert.equal(registry.aliases[0].targetRef.id, "binding.gu-yin-courtyard-01");
});

test("AssetAliasResolver blocks unknown, latest and non-NFC lookup", () => {
  const resolver = createAssetAliasResolver(registry);
  assert.throws(() => resolver.resolve("@不存在"), (error) => error instanceof AssetAliasResolutionError && error.code === "ASSET_ALIAS_UNKNOWN");
  assert.throws(() => resolver.resolve("@latest"), (error) => error instanceof AssetAliasResolutionError && error.code === "ASSET_ALIAS_LATEST_FORBIDDEN");
  assert.throws(() => resolver.resolve("@e\u0301"), (error) => error instanceof AssetAliasResolutionError && error.code === "ASSET_ALIAS_NOT_NFC");
});

test("AssetAliasResolver resolves many aliases in declared order and rejects duplicates", () => {
  const resolver = createAssetAliasResolver(registry);
  const targets = resolver.resolveMany(["@青玉剑", "@沈蘅"]);
  assert.deepEqual(targets.map((target) => target.id), ["reference.prop.jade-sword-01", "binding.gu-yin-courtyard-01"]);
  assert.throws(() => resolver.resolveMany(["@沈蘅", "@沈蘅"]), (error) => error instanceof AssetAliasResolutionError && error.code === "ASSET_ALIAS_DUPLICATE");
});
