import { validateByKind } from "../../../scripts/validate-contract-semantics.mjs";

const aliasPattern = /^@[^\s@]{1,120}$/u;

export class AssetAliasResolutionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AssetAliasResolutionError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function assertRegistry(registry) {
  const errors = validateByKind(registry);
  if (errors.length) throw new AssetAliasResolutionError("ASSET_ALIAS_INVALID_REGISTRY", errors.join("; "));
  return registry;
}

function normalizeAlias(alias) {
  if (typeof alias !== "string" || !aliasPattern.test(alias)) {
    throw new AssetAliasResolutionError("ASSET_ALIAS_INVALID", "Asset alias must use a bounded @alias form");
  }
  if (alias === "@latest") {
    throw new AssetAliasResolutionError("ASSET_ALIAS_LATEST_FORBIDDEN", "@latest is not an exact AssetAliasRegistry lookup");
  }
  const normalized = alias.normalize("NFC");
  if (normalized !== alias) {
    throw new AssetAliasResolutionError("ASSET_ALIAS_NOT_NFC", "Asset alias must already be normalized to Unicode NFC");
  }
  return normalized;
}

function buildIndex(registry) {
  const index = new Map();
  for (const entry of registry.aliases) index.set(entry.alias, entry.targetRef);
  return index;
}

/**
 * Create a read-only resolver for one exact, already-scoped alias registry.
 * The resolver never searches, infers, upgrades, calls a provider or writes.
 */
export function createAssetAliasResolver(registry) {
  const checked = assertRegistry(registry);
  const index = buildIndex(checked);
  const scope = deepFreeze(structuredClone(checked.scope));

  const resolver = {
    scope,
    resolve(alias) {
      const key = normalizeAlias(alias);
      const targetRef = index.get(key);
      if (!targetRef) throw new AssetAliasResolutionError("ASSET_ALIAS_UNKNOWN", `No exact target is declared for ${key}`);
      return deepFreeze(structuredClone(targetRef));
    },
    resolveMany(aliases) {
      if (!Array.isArray(aliases) || aliases.length === 0) {
        throw new AssetAliasResolutionError("ASSET_ALIAS_LIST_INVALID", "resolveMany requires a non-empty alias array");
      }
      const keys = aliases.map(normalizeAlias);
      if (new Set(keys).size !== keys.length) {
        throw new AssetAliasResolutionError("ASSET_ALIAS_DUPLICATE", "resolveMany does not accept duplicate aliases");
      }
      return deepFreeze(keys.map((key) => {
        const targetRef = index.get(key);
        if (!targetRef) throw new AssetAliasResolutionError("ASSET_ALIAS_UNKNOWN", `No exact target is declared for ${key}`);
        return structuredClone(targetRef);
      }));
    }
  };
  return Object.freeze(resolver);
}

export function resolveAssetAlias(registry, alias) {
  return createAssetAliasResolver(registry).resolve(alias);
}
