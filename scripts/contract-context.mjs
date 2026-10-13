import { canonicalize, sha256Canonical } from "./canonical-json.mjs";

// Only kinds used as source documents by the supported context checks belong
// here. ImagePrompt's wire schema deliberately has no canonical ID or version.
export const ARTIFACT_ID_FIELDS = Object.freeze({
  cineweave_codex_prompt_record: "promptId",
  cineweave_codex_image_prompt: null,
  cineweave_codex_capability_profile: "profileId",
  cineweave_codex_license_profile: "profileId",
  cineweave_codex_reference_observation: "observationId",
  cineweave_codex_cinematic_skill_manifest: "cinematicSkillManifestId",
  cineweave_codex_asset_alias_registry: "assetAliasRegistryId",
  cineweave_codex_storyboard_sequence: "storyboardId",
  cineweave_codex_creative_review: "reviewId",
});

// Shared exact matching keeps legacy callers' resolution policy separate from
// the stricter full-body resolver below. It does not upgrade their guarantees.
export function findExactRegistryMatches(ref, artifacts) {
  const key = canonicalize(ref);
  return artifacts.filter((entry) => entry !== null && typeof entry === "object" && !Array.isArray(entry)
    && entry.ref !== null && typeof entry.ref === "object" && !Array.isArray(entry.ref)
    && canonicalize(entry.ref) === key);
}

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasData(value, key) {
  if (!isRecord(value)) return false;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return Boolean(descriptor && Object.hasOwn(descriptor, "value") && descriptor.enumerable);
}

// Validate descriptors before JCS reads them, so this read-only resolver never
// calls accessors or custom serialization hooks on supplied objects.
function assertJsonData(value, ancestors = new Set()) {
  if (value === null || typeof value !== "object") return;
  if (ancestors.has(value)) throw new TypeError("cyclic values are not JSON documents");
  if (!Array.isArray(value) && !isRecord(value)) throw new TypeError("plain JSON objects are required");
  ancestors.add(value);
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length") continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== "string" || !Object.hasOwn(descriptor, "value") || !descriptor.enumerable) {
      throw new TypeError("only enumerable own JSON data properties are accepted");
    }
    assertJsonData(descriptor.value, ancestors);
  }
  ancestors.delete(value);
}

function jsonKey(value) {
  assertJsonData(value);
  return canonicalize(value);
}

function referenceKey(ref) {
  if (!isRecord(ref) || !["kind", "id", "version", "contentHash"].every((key) => hasData(ref, key))) {
    throw new TypeError("exact reference requires own kind, id, version and contentHash fields");
  }
  if (typeof ref.kind !== "string" || ref.kind.length === 0 || typeof ref.id !== "string" || ref.id.length === 0
      || !Number.isSafeInteger(ref.version) || ref.version < 1
      || typeof ref.contentHash !== "string" || !/^sha256:[0-9a-f]{64}$/iu.test(ref.contentHash)) {
    throw new TypeError("exact reference kind, id, version or contentHash is malformed");
  }
  return jsonKey(ref);
}

/**
 * Resolve an exact, JCS-bound source body without reading files or following
 * links. validateStructure(ref, document) is injected by the schema owner and
 * returns { valid, errors }; it must validate the complete source schema.
 *
 * Missing bindings are unavailable, not errors. Supplied contradictory or
 * malformed evidence is invalid. No result establishes rights or media quality.
 */
export async function resolveExactArtifact(ref, {
  artifacts = [], idField, validateStructure, label = "$ref",
} = {}) {
  const errors = [];
  const unverified = [];
  const invalid = (message) => {
    errors.push(`${label}: ${message}`);
    unverified.push(`${label}: supplied source evidence could not be verified`);
    return { status: "invalid", document: null, errors, unverified };
  };

  try { referenceKey(ref); }
  catch (error) { return invalid(`malformed exact reference: ${error.message}`); }
  if (!Array.isArray(artifacts)) return invalid("artifacts must be an array of exact ref/document bindings");

  let matches;
  const registryKeys = new Set();
  try {
    // A malformed registry is not silently downgraded to missing context.
    jsonKey(artifacts);
    for (const [index, entry] of artifacts.entries()) {
      if (!isRecord(entry) || !hasData(entry, "ref") || !hasData(entry, "document")
          || !isRecord(entry.document) || Object.keys(entry).some((key) => !["ref", "document"].includes(key))) {
        return invalid(`artifacts[${index}] is a malformed exact registry binding`);
      }
      const key = referenceKey(entry.ref);
      if (registryKeys.has(key)) return invalid(`artifacts[${index}] duplicates an exact reference; ambiguous registry binding`);
      registryKeys.add(key);
    }
    matches = findExactRegistryMatches(ref, artifacts).map((entry) => entry.document);
  } catch (error) { return invalid(`malformed artifact registry: ${error.message}`); }

  if (matches.length === 0) {
    unverified.push(`${label}: exact registry binding unavailable`);
    return { status: "unavailable", document: null, errors, unverified };
  }
  const document = matches[0];
  if (!hasData(document, "kind") || document.kind !== ref.kind) return invalid("document kind does not match the exact reference");
  if (sha256Canonical(document) !== ref.contentHash) return invalid("document JCS content hash does not match the exact reference");

  const identityField = idField === undefined && Object.hasOwn(ARTIFACT_ID_FIELDS, ref.kind) ? ARTIFACT_ID_FIELDS[ref.kind] : idField;
  if (identityField === undefined || (identityField !== null && (typeof identityField !== "string" || !identityField))) {
    return invalid("source kind requires an explicit supported canonical identity field");
  }
  if (identityField !== null) {
    if (!hasData(document, identityField) || document[identityField] !== ref.id) return invalid(`document ${identityField} identity does not match the exact reference`);
    if (!hasData(document, "version") || document.version !== ref.version) return invalid("document version does not match the exact reference");
  } else {
    unverified.push(`${label}: source schema has no canonical ID/version fields; registry identity and version authority remain unverified`);
  }

  if (typeof validateStructure !== "function") return invalid("complete source schema validation requires validateStructure");
  let structure;
  try { structure = await validateStructure(ref, document); }
  catch (error) { return invalid(`complete source schema validator failed: ${error.message}`); }
  const structureErrors = Array.isArray(structure) ? structure : structure?.errors;
  if (!Array.isArray(structureErrors) || structureErrors.some((error) => typeof error !== "string")
      || (!Array.isArray(structure) && typeof structure?.valid !== "boolean")) {
    return invalid("complete source schema validator returned a malformed result");
  }
  if (structureErrors.length > 0 || (!Array.isArray(structure) && !structure.valid)) {
    if (structureErrors.length) errors.push(...structureErrors.map((error) => `${label}: upstream document ${error}`));
    else errors.push(`${label}: complete source contract body is invalid`);
    unverified.push(`${label}: supplied source contract body is invalid`);
    return { status: "invalid", document: null, errors, unverified };
  }
  return { status: "resolved", document, errors, unverified };
}

function operationInputCountApplies(request, capabilityId) {
  if (request.operation === "multi_reference") return capabilityId === "multi_reference";
  if (!["image", "video"].includes(request.mediaKind)) return false;
  if (request.operation === "generate") return capabilityId === `${request.mediaKind}_generation`;
  if (request.operation === "edit") return capabilityId === `${request.mediaKind}_editing`;
  // No shared contract identifies which inputs belong to inpainting, layout,
  // sequence or an arbitrary capability. Do not infer their quantities.
  return false;
}

/** Compare local capability results with complete, exact source declarations. */
export async function validateCapabilityResolutionContext(payload, { artifacts = [], validateStructure } = {}) {
  const errors = [];
  const unverified = [];
  const request = hasData(payload, "request") && isRecord(payload.request) ? payload.request : {};
  const requirements = hasData(request, "requirements") && Array.isArray(request.requirements) ? request.requirements : [];
  const candidates = hasData(payload, "candidates") && Array.isArray(payload.candidates) ? payload.candidates : [];

  for (const [candidateIndex, candidate] of candidates.entries()) {
    if (!isRecord(candidate)) continue;
    const candidatePath = `$.candidates[${candidateIndex}]`;
    const resolved = await resolveExactArtifact(hasData(candidate, "capabilityProfileRef") ? candidate.capabilityProfileRef : undefined, {
      artifacts, validateStructure, idField: "profileId", label: `${candidatePath}.capabilityProfileRef`,
    });
    errors.push(...resolved.errors);
    unverified.push(...resolved.unverified);
    if (resolved.status !== "resolved") continue;
    const capabilities = resolved.document.capabilities;
    if (!Array.isArray(capabilities)) {
      errors.push(`${candidatePath}.capabilityProfileRef: complete source capabilities must be an array`);
      continue;
    }
    const byCapability = new Map();
    let duplicate = false;
    for (const [index, capability] of capabilities.entries()) {
      if (!isRecord(capability) || !hasData(capability, "capabilityId")) continue;
      if (byCapability.has(capability.capabilityId)) {
        errors.push(`${candidatePath}.capabilityProfileRef: upstream capabilities[${index}].capabilityId duplicates ${capability.capabilityId}`);
        duplicate = true;
      } else byCapability.set(capability.capabilityId, capability);
    }
    if (duplicate) continue;
    const results = hasData(candidate, "capabilityResults") && Array.isArray(candidate.capabilityResults) ? candidate.capabilityResults : [];
    for (const [resultIndex, result] of results.entries()) {
      if (!isRecord(result)) continue;
      const path = `${candidatePath}.capabilityResults[${resultIndex}]`;
      const requirement = requirements.find((item) => hasData(item, "requirementId") && item.requirementId === result.requirementId);
      if (!requirement) continue; // The local semantic validator reports joins.
      const source = byCapability.get(requirement.capabilityId);
      let support = source?.support ?? "unknown";
      if (!source) {
        unverified.push(`${path}: capability ${requirement.capabilityId} is not declared by the exact profile; support is unknown`);
      } else if (hasData(requirement, "scope") && requirement.scope.length > 0
          && !(Array.isArray(source.supportedScopes) && source.supportedScopes.includes(requirement.scope))) {
        support = source.support === "unsupported" ? "unsupported" : "unknown";
        unverified.push(`${path}: requested scope ${requirement.scope} is not declared by the exact profile; support for that scope is unknown`);
      } else if (!hasData(requirement, "scope") || requirement.scope.length === 0) {
        unverified.push(`${path}: no explicit requested scope was supplied; scope compatibility remains unverified`);
      }
      if (result.support !== support) errors.push(`${path}.support must match exact profile support ${support} for the requested capability and scope`);
      if (support === "unknown" && result.status === "pass") errors.push(`${path} cannot pass unknown source profile support`);
      if (support === "unsupported" && result.status !== "fail") errors.push(`${path} must fail unsupported source profile support`);
      if (requirement.level === "hard" && ["eligible", "selected"].includes(candidate.status)
          && (support !== "strong" || result.status !== "pass")) {
        errors.push(`${candidatePath} cannot be ${candidate.status} because hard requirement ${requirement.requirementId} is not strongly supported and passing in the exact profile`);
      }
      if (!source) continue;
      if (operationInputCountApplies(request, requirement.capabilityId)) {
        if (Number.isSafeInteger(source.maxInputs)) {
          if (Number.isSafeInteger(request.inputCount) && request.inputCount > source.maxInputs && result.status !== "fail") {
            errors.push(`${path} must fail because request.inputCount ${request.inputCount} exceeds exact profile maxInputs ${source.maxInputs}`);
          }
        } else unverified.push(`${path}: exact profile maxInputs is absent; operation input capacity is unknown`);
      } else if (hasData(source, "maxInputs")) {
        unverified.push(`${path}: per-capability input attribution is unavailable; total request.inputCount cannot verify this maxInputs limit`);
      }
      if (hasData(source, "maxSubjects")) unverified.push(`${path}: subject count is not declared by the request; maxSubjects remains unverified and outputCount is not subjectCount`);
    }
  }
  unverified.push("Exact source declarations and hashes do not verify actual provider support, current account capabilities, rights or generated media; those require external evidence review");
  return { errors: [...new Set(errors)], unverified: [...new Set(unverified)] };
}
