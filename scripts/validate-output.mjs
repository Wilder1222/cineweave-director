#!/usr/bin/env node

import { lstat, readFile, realpath } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalize,
  parseJsonStrict,
  sha256Bytes,
} from "./canonical-json.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const SUPPORTED_DIALECT = "https://json-schema.org/draft/2020-12/schema";
const SUPPORTED_FORMATS = new Set(["date", "date-time", "uri"]);
const JSON_SCHEMA_TYPES = new Set(["array", "boolean", "integer", "null", "number", "object", "string"]);
const SUPPORTED_SCHEMA_KEYWORDS = new Set([
  "$schema", "$id", "$ref", "$defs", "$comment",
  "title", "description", "default", "examples", "deprecated", "readOnly", "writeOnly",
  "type", "enum", "const",
  "allOf", "anyOf", "oneOf", "not", "if", "then", "else",
  "multipleOf", "maximum", "exclusiveMaximum", "minimum", "exclusiveMinimum",
  "maxLength", "minLength", "pattern", "format",
  "maxItems", "minItems", "uniqueItems", "maxContains", "minContains", "items", "prefixItems", "contains",
  "maxProperties", "minProperties", "required", "properties", "additionalProperties", "patternProperties", "dependentRequired",
]);
const SINGLE_SUBSCHEMA_KEYWORDS = ["not", "if", "then", "else", "items", "contains", "additionalProperties"];
const ARRAY_SUBSCHEMA_KEYWORDS = ["allOf", "anyOf", "oneOf", "prefixItems"];
const MAP_SUBSCHEMA_KEYWORDS = ["$defs", "properties", "patternProperties"];

const contractsCache = new Map();

function usage() {
  console.error("Usage: node scripts/validate-output.mjs <schema.json> <payload.json> [--artifacts registry.json]");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function unicodeLength(value) {
  return Array.from(value).length;
}

function deepEqual(a, b) {
  return canonicalize(a) === canonicalize(b);
}

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || actual.some((value) => typeof value !== "string")) return false;
  const left = [...actual].sort();
  const right = [...expected].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function typeMatches(value, expected) {
  if (Array.isArray(expected)) return expected.some((item) => typeMatches(value, item));
  switch (expected) {
    case "object": return isObject(value);
    case "array": return Array.isArray(value);
    case "string": return typeof value === "string";
    case "number": return typeof value === "number" && Number.isFinite(value);
    case "integer": return Number.isInteger(value);
    case "boolean": return typeof value === "boolean";
    case "null": return value === null;
    default: return false;
  }
}

function pointerGet(document, pointer) {
  if (!pointer || pointer === "#") return document;
  if (!pointer.startsWith("#/")) throw new Error(`Unsupported JSON pointer: ${pointer}`);
  return pointer.slice(2).split("/").reduce((current, token) => {
    if (/~(?:[^01]|$)/u.test(token)) throw new Error(`Invalid JSON pointer escape: ${pointer}`);
    const key = token.replace(/~1/gu, "/").replace(/~0/gu, "~");
    if (current === undefined || current === null || !Object.hasOwn(Object(current), key)) {
      throw new Error(`Unresolved JSON pointer: ${pointer}`);
    }
    return current[key];
  }, document);
}

function validateRefSyntax(refValue, path) {
  if (typeof refValue !== "string" || refValue.length === 0) throw new TypeError(`${path} must be a non-empty string`);
  if (refValue.startsWith("#")) {
    if (refValue !== "#" && (!refValue.startsWith("#/") || refValue.includes("%"))) {
      throw new Error(`${path} uses an unsupported local JSON pointer: ${refValue}`);
    }
    return;
  }

  const hashIndex = refValue.indexOf("#");
  if (hashIndex >= 0 && refValue.indexOf("#", hashIndex + 1) >= 0) throw new Error(`${path} contains more than one fragment delimiter`);
  const filePart = hashIndex >= 0 ? refValue.slice(0, hashIndex) : refValue;
  const fragment = hashIndex >= 0 ? refValue.slice(hashIndex + 1) : "";
  if (!filePart || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(filePart) || filePart.startsWith("//") || isAbsolute(filePart)) {
    throw new Error(`${path} must use a confined relative file reference: ${refValue}`);
  }
  if (filePart.includes("\\") || filePart.includes("?") || filePart.includes("\0") || filePart.split("/").includes("..")) {
    throw new Error(`${path} must use a confined relative file reference: ${refValue}`);
  }
  if (fragment && (!fragment.startsWith("/") || fragment.includes("%"))) {
    throw new Error(`${path} uses an unsupported JSON pointer fragment: ${refValue}`);
  }
}

function validateSchemaDefinition(schema, path = "$schema", allowDocumentId = false) {
  if (schema === true || schema === false) return;
  if (!isObject(schema)) throw new TypeError(`${path} must be an object or boolean schema`);

  for (const keyword of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYWORDS.has(keyword)) {
      throw new Error(`${path} contains unsupported schema keyword ${JSON.stringify(keyword)}`);
    }
  }

  for (const keyword of ["$comment", "title", "description"]) {
    if (schema[keyword] !== undefined && (typeof schema[keyword] !== "string" || schema[keyword].length === 0)) {
      throw new TypeError(`${path}.${keyword} must be a non-empty string`);
    }
  }
  if (schema.$id !== undefined) {
    if (!allowDocumentId) throw new Error(`${path} contains unsupported nested $id scope`);
    if (typeof schema.$id !== "string" || schema.$id.length === 0 || /\s|\\/u.test(schema.$id)) throw new TypeError(`${path}.$id must be an absolute URI without whitespace`);
    try { new URL(schema.$id); } catch { throw new Error(`${path}.$id must be an absolute URI: ${schema.$id}`); }
    if (schema.$id.includes("#")) throw new Error(`${path}.$id cannot contain a fragment`);
  }
  if (schema.$schema !== undefined && schema.$schema !== SUPPORTED_DIALECT) {
    throw new Error(`${path} declares unsupported schema dialect ${JSON.stringify(schema.$schema)}`);
  }
  if (schema.$ref !== undefined) validateRefSyntax(schema.$ref, `${path}.$ref`);

  if (schema.type !== undefined) {
    const declaredTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (declaredTypes.length === 0 || declaredTypes.some((value) => typeof value !== "string" || !JSON_SCHEMA_TYPES.has(value))) {
      throw new TypeError(`${path}.type must contain only supported JSON Schema types`);
    }
    if (new Set(declaredTypes).size !== declaredTypes.length) throw new Error(`${path}.type contains duplicate types`);
  }
  if (schema.enum !== undefined) {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) throw new TypeError(`${path}.enum must be a non-empty array`);
    const values = schema.enum.map((value) => canonicalize(value));
    if (new Set(values).size !== values.length) throw new Error(`${path}.enum contains duplicate values`);
  }
  if (schema.examples !== undefined && !Array.isArray(schema.examples)) throw new TypeError(`${path}.examples must be an array`);
  for (const keyword of ["deprecated", "readOnly", "writeOnly", "uniqueItems"]) {
    if (schema[keyword] !== undefined && typeof schema[keyword] !== "boolean") throw new TypeError(`${path}.${keyword} must be boolean`);
  }

  for (const keyword of ["multipleOf", "maximum", "exclusiveMaximum", "minimum", "exclusiveMinimum"]) {
    if (schema[keyword] !== undefined && (typeof schema[keyword] !== "number" || !Number.isFinite(schema[keyword]))) {
      throw new TypeError(`${path}.${keyword} must be a finite number`);
    }
  }
  if (schema.multipleOf !== undefined && schema.multipleOf <= 0) throw new Error(`${path}.multipleOf must be greater than zero`);
  for (const keyword of ["maxLength", "minLength", "maxItems", "minItems", "maxContains", "minContains", "maxProperties", "minProperties"]) {
    if (schema[keyword] !== undefined && (!Number.isSafeInteger(schema[keyword]) || schema[keyword] < 0)) {
      throw new TypeError(`${path}.${keyword} must be a non-negative integer`);
    }
  }
  if ((schema.minContains !== undefined || schema.maxContains !== undefined) && schema.contains === undefined) {
    throw new Error(`${path} cannot declare minContains or maxContains without contains`);
  }

  if (schema.format !== undefined && (typeof schema.format !== "string" || !SUPPORTED_FORMATS.has(schema.format))) {
    throw new Error(`${path} declares unsupported format ${JSON.stringify(schema.format)}`);
  }
  if (schema.pattern !== undefined) {
    if (typeof schema.pattern !== "string") throw new TypeError(`${path}.pattern must be a string`);
    try { new RegExp(schema.pattern); } catch { throw new Error(`${path} contains invalid pattern ${JSON.stringify(schema.pattern)}`); }
  }
  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required) || schema.required.some((value) => typeof value !== "string")) throw new TypeError(`${path}.required must be an array of strings`);
    if (new Set(schema.required).size !== schema.required.length) throw new Error(`${path}.required contains duplicates`);
  }
  if (schema.dependentRequired !== undefined) {
    if (!isObject(schema.dependentRequired)) throw new TypeError(`${path}.dependentRequired must be an object`);
    for (const [name, dependencies] of Object.entries(schema.dependentRequired)) {
      if (!Array.isArray(dependencies) || dependencies.some((value) => typeof value !== "string")) {
        throw new TypeError(`${path}.dependentRequired[${JSON.stringify(name)}] must be an array of strings`);
      }
      if (new Set(dependencies).size !== dependencies.length) throw new Error(`${path}.dependentRequired[${JSON.stringify(name)}] contains duplicates`);
    }
  }
  if (isObject(schema.patternProperties)) {
    for (const pattern of Object.keys(schema.patternProperties)) {
      try { new RegExp(pattern); } catch { throw new Error(`${path}.patternProperties contains invalid pattern ${JSON.stringify(pattern)}`); }
    }
  }

  for (const keyword of SINGLE_SUBSCHEMA_KEYWORDS) {
    if (schema[keyword] !== undefined) validateSchemaDefinition(schema[keyword], `${path}.${keyword}`);
  }
  for (const keyword of ARRAY_SUBSCHEMA_KEYWORDS) {
    if (schema[keyword] === undefined) continue;
    if (!Array.isArray(schema[keyword]) || schema[keyword].length === 0) throw new TypeError(`${path}.${keyword} must be a non-empty array`);
    schema[keyword].forEach((child, index) => validateSchemaDefinition(child, `${path}.${keyword}[${index}]`));
  }
  for (const keyword of MAP_SUBSCHEMA_KEYWORDS) {
    if (schema[keyword] === undefined) continue;
    if (!isObject(schema[keyword])) throw new TypeError(`${path}.${keyword} must be an object`);
    for (const [name, child] of Object.entries(schema[keyword])) {
      validateSchemaDefinition(child, `${path}.${keyword}[${JSON.stringify(name)}]`);
    }
  }
}

function formatValid(value, format) {
  if (typeof value !== "string") return true;
  if (format === "date-time") return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value));
  if (format === "date") {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
  }
  if (format === "uri") {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol);
    } catch {
      return false;
    }
  }
  return false;
}

class SchemaLoader {
  constructor(rootSchemaPath) {
    this.rootSchemaPath = resolve(rootSchemaPath);
    this.schemaRoot = dirname(this.rootSchemaPath);
    this.cache = new Map();
  }

  async assertReadableSchemaPath(path) {
    const absolute = resolve(path);
    if (!isWithin(this.schemaRoot, absolute)) throw new Error(`Schema path escapes root: ${absolute}`);
    const stat = await lstat(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Schema must be a regular non-link file: ${absolute}`);
    const [realRoot, realFile] = await Promise.all([realpath(this.schemaRoot), realpath(absolute)]);
    if (!isWithin(realRoot, realFile)) throw new Error(`Resolved schema path escapes root: ${absolute}`);
    return absolute;
  }

  async load(path) {
    const absolute = await this.assertReadableSchemaPath(path);
    if (!this.cache.has(absolute)) {
      const document = parseJsonStrict(await readFile(absolute, "utf8"));
      validateSchemaDefinition(document, `schema(${absolute})`, true);
      this.cache.set(absolute, document);
    }
    return this.cache.get(absolute);
  }

  async assertRefClosure(schema, document, schemaPath, visited = new WeakSet()) {
    if (schema === true || schema === false) return;
    if (!isObject(schema) || visited.has(schema)) return;
    visited.add(schema);

    if (schema.$ref !== undefined) {
      const target = await this.resolveRef(schema.$ref, document, schemaPath);
      await this.assertRefClosure(target.schema, target.document, target.path, visited);
    }
    for (const keyword of SINGLE_SUBSCHEMA_KEYWORDS) {
      if (schema[keyword] !== undefined) await this.assertRefClosure(schema[keyword], document, schemaPath, visited);
    }
    for (const keyword of ARRAY_SUBSCHEMA_KEYWORDS) {
      for (const child of schema[keyword] ?? []) await this.assertRefClosure(child, document, schemaPath, visited);
    }
    for (const keyword of MAP_SUBSCHEMA_KEYWORDS) {
      for (const child of Object.values(schema[keyword] ?? {})) await this.assertRefClosure(child, document, schemaPath, visited);
    }
  }

  async resolveRef(refValue, currentSchema, currentPath) {
    validateRefSyntax(refValue, "$ref");
    if (refValue.startsWith("#")) {
      const schema = pointerGet(currentSchema, refValue);
      validateSchemaDefinition(schema, `resolved $ref ${JSON.stringify(refValue)}`, schema === currentSchema);
      return { schema, document: currentSchema, path: currentPath };
    }

    const hashIndex = refValue.indexOf("#");
    const filePart = hashIndex >= 0 ? refValue.slice(0, hashIndex) : refValue;
    const fragment = hashIndex >= 0 ? refValue.slice(hashIndex + 1) : "";
    const targetPath = resolve(dirname(currentPath), filePart);
    const document = await this.load(targetPath);
    if (currentSchema.$id !== undefined) {
      const expectedId = new URL(filePart, currentSchema.$id).href;
      if (document.$id === undefined || new URL(document.$id).href !== expectedId) {
        throw new Error(`Local $ref target $id does not match ${expectedId}: ${refValue}`);
      }
    }
    const schema = fragment ? pointerGet(document, `#${fragment}`) : document;
    validateSchemaDefinition(schema, `resolved $ref ${JSON.stringify(refValue)}`, schema === document);
    return { schema, document, path: targetPath };
  }
}

async function validateNode(value, schema, context, path = "$", errors = []) {
  if (schema === true) return errors;
  if (schema === false) { errors.push(`${path} is forbidden by a false schema`); return errors; }
  if (!isObject(schema)) return errors;

  if (schema.$ref !== undefined) {
    const activeReferences = context.activeReferences;
    const referenceKey = `${context.schemaPath}\0${schema.$ref}\0${path}`;
    if (!activeReferences.has(referenceKey)) {
      activeReferences.add(referenceKey);
      try {
        const target = await context.loader.resolveRef(schema.$ref, context.document, context.schemaPath);
        await validateNode(value, target.schema, { ...context, document: target.document, schemaPath: target.path }, path, errors);
      } finally {
        activeReferences.delete(referenceKey);
      }
    }
  }

  if (schema.allOf) {
    for (const sub of schema.allOf) await validateNode(value, sub, context, path, errors);
  }
  if (schema.anyOf) {
    const results = [];
    for (const sub of schema.anyOf) {
      const branch = [];
      await validateNode(value, sub, context, path, branch);
      results.push(branch);
    }
    if (!results.some((branch) => branch.length === 0)) errors.push(`${path} must match at least one anyOf branch`);
  }
  if (schema.oneOf) {
    let matches = 0;
    for (const sub of schema.oneOf) {
      const branch = [];
      await validateNode(value, sub, context, path, branch);
      if (branch.length === 0) matches += 1;
    }
    if (matches !== 1) errors.push(`${path} must match exactly one oneOf branch (matched ${matches})`);
  }
  if (schema.not) {
    const branch = [];
    await validateNode(value, schema.not, context, path, branch);
    if (branch.length === 0) errors.push(`${path} must not match the forbidden schema`);
  }
  if (schema.if) {
    const conditionErrors = [];
    await validateNode(value, schema.if, context, path, conditionErrors);
    if (conditionErrors.length === 0 && schema.then) await validateNode(value, schema.then, context, path, errors);
    if (conditionErrors.length > 0 && schema.else) await validateNode(value, schema.else, context, path, errors);
  }

  if (schema.const !== undefined && !deepEqual(value, schema.const)) {
    errors.push(`${path} must equal ${JSON.stringify(schema.const)}`);
    return errors;
  }
  if (schema.enum && !schema.enum.some((item) => deepEqual(item, value))) {
    errors.push(`${path} must be one of ${schema.enum.map((item) => JSON.stringify(item)).join(", ")}`);
    return errors;
  }
  if (schema.type !== undefined && !typeMatches(value, schema.type)) {
    errors.push(`${path} must be of type ${JSON.stringify(schema.type)}`);
    return errors;
  }

  if (typeof value === "string") {
    const length = unicodeLength(value);
    if (schema.minLength !== undefined && length < schema.minLength) errors.push(`${path} must contain at least ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && length > schema.maxLength) errors.push(`${path} must contain at most ${schema.maxLength} characters`);
    if (schema.pattern !== undefined) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) errors.push(`${path} must match ${schema.pattern}`);
    }
    if (schema.format && !formatValid(value, schema.format)) errors.push(`${path} must satisfy format ${schema.format}`);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} must be >= ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} must be <= ${schema.maximum}`);
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) errors.push(`${path} must be > ${schema.exclusiveMinimum}`);
    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) errors.push(`${path} must be < ${schema.exclusiveMaximum}`);
    if (schema.multipleOf !== undefined && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-12) errors.push(`${path} must be a multiple of ${schema.multipleOf}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} must contain at least ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} must contain at most ${schema.maxItems} items`);
    if (schema.uniqueItems) {
      const seen = new Set();
      value.forEach((item, index) => {
        const key = canonicalize(item);
        if (seen.has(key)) errors.push(`${path}[${index}] duplicates an earlier item`);
        seen.add(key);
      });
    }
    if (schema.prefixItems) {
      for (let index = 0; index < Math.min(value.length, schema.prefixItems.length); index += 1) {
        await validateNode(value[index], schema.prefixItems[index], context, `${path}[${index}]`, errors);
      }
    }
    if (schema.items !== undefined) {
      const start = Array.isArray(schema.prefixItems) ? schema.prefixItems.length : 0;
      for (let index = start; index < value.length; index += 1) {
        await validateNode(value[index], schema.items, context, `${path}[${index}]`, errors);
      }
    }
    if (schema.contains !== undefined) {
      let matches = 0;
      for (let index = 0; index < value.length; index += 1) {
        const branch = [];
        await validateNode(value[index], schema.contains, context, `${path}[${index}]`, branch);
        if (branch.length === 0) matches += 1;
      }
      const minContains = schema.minContains ?? 1;
      if (matches < minContains) errors.push(`${path} must contain at least ${minContains} item(s) matching contains schema`);
      if (schema.maxContains !== undefined && matches > schema.maxContains) {
        errors.push(`${path} must contain at most ${schema.maxContains} item(s) matching contains schema`);
      }
    }
  }

  if (isObject(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) errors.push(`${path} must contain at least ${schema.minProperties} properties`);
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) errors.push(`${path} must contain at most ${schema.maxProperties} properties`);
    for (const required of schema.required || []) {
      if (!Object.hasOwn(value, required)) errors.push(`${path}.${required} is required`);
    }
    const properties = schema.properties || {};
    for (const [key, child] of Object.entries(value)) {
      const propertyMatched = Object.hasOwn(properties, key);
      if (propertyMatched) await validateNode(child, properties[key], context, `${path}.${key}`, errors);

      const patternMatches = schema.patternProperties
        ? Object.entries(schema.patternProperties).filter(([pattern]) => new RegExp(pattern).test(key))
        : [];
      for (const [, sub] of patternMatches) await validateNode(child, sub, context, `${path}.${key}`, errors);

      if (!propertyMatched && patternMatches.length === 0) {
        if (schema.additionalProperties === false) errors.push(`${path}.${key} is not allowed`);
        else if (isObject(schema.additionalProperties) || typeof schema.additionalProperties === "boolean") {
          await validateNode(child, schema.additionalProperties, context, `${path}.${key}`, errors);
        }
      }
    }
    if (schema.dependentRequired) {
      for (const [key, dependencies] of Object.entries(schema.dependentRequired)) {
        if (Object.hasOwn(value, key)) {
          for (const dependency of dependencies) if (!Object.hasOwn(value, dependency)) errors.push(`${path}.${dependency} is required when ${key} is present`);
        }
      }
    }
  }

  return errors;
}

function validatePromptProjectionPlanSemantics(payload, errors) {
  if (!isObject(payload)) return;
  const checks = Array.isArray(payload.compatibilityChecks) ? payload.compatibilityChecks.filter(isObject) : [];
  const rightsChecks = checks.filter((check) => check.checkId === "check.rights-licensing");
  const blockers = checks.filter((check) => check.status === "block" || check.status === "unknown");

  if (rightsChecks.length !== 1) {
    errors.push("$.compatibilityChecks must contain exactly one check.rights-licensing check");
  }

  const expectedNoBlockers = blockers.length === 0;
  if (isObject(payload.validation) && payload.validation.noBlockingCompatibilityIssue !== expectedNoBlockers) {
    errors.push(`$.validation.noBlockingCompatibilityIssue must equal ${expectedNoBlockers} for the recorded compatibility checks`);
  }

  const handoff = isObject(payload.manualHandoff) ? payload.manualHandoff : {};
  const rootReady = payload.status === "ready_for_human";
  const handoffReady = handoff.status === "ready";
  if (rootReady !== handoffReady) {
    errors.push("$.status and $.manualHandoff.status must enter readiness together");
  }

  if (rootReady || handoffReady) {
    if (blockers.length > 0) errors.push("$.compatibilityChecks contains a blocking or unknown check for a ready handoff");
    if (rightsChecks[0]?.status !== "pass") errors.push("$.compatibilityChecks check.rights-licensing must pass before handoff readiness");
    const hiddenDefaults = Array.isArray(handoff.hiddenDefaultChecks) ? handoff.hiddenDefaultChecks : [];
    if (hiddenDefaults.some((check) => isObject(check) && check.status === "blocked")) {
      errors.push("$.manualHandoff.hiddenDefaultChecks contains a blocked setting for a ready handoff");
    }
  }
}

function validateCapabilityResolutionPlanSemantics(payload, errors) {
  if (!isObject(payload)) return;
  const requirements = Array.isArray(payload.request?.requirements) ? payload.request.requirements.filter(isObject) : [];
  const candidates = Array.isArray(payload.candidates) ? payload.candidates.filter(isObject) : [];
  const requirementById = new Map();

  for (const [index, requirement] of requirements.entries()) {
    if (typeof requirement.requirementId !== "string") continue;
    if (requirementById.has(requirement.requirementId)) {
      errors.push(`$.request.requirements[${index}].requirementId duplicates ${requirement.requirementId}`);
    } else {
      requirementById.set(requirement.requirementId, requirement);
    }
  }

  const candidateById = new Map();
  for (const [candidateIndex, candidate] of candidates.entries()) {
    if (typeof candidate.candidateId === "string") {
      if (candidateById.has(candidate.candidateId)) errors.push(`$.candidates[${candidateIndex}].candidateId duplicates ${candidate.candidateId}`);
      else candidateById.set(candidate.candidateId, candidate);
    }

    const results = Array.isArray(candidate.capabilityResults) ? candidate.capabilityResults.filter(isObject) : [];
    const resultByRequirement = new Map();
    for (const [resultIndex, result] of results.entries()) {
      const resultPath = `$.candidates[${candidateIndex}].capabilityResults[${resultIndex}]`;
      if (typeof result.requirementId === "string") {
        if (resultByRequirement.has(result.requirementId)) errors.push(`${resultPath}.requirementId duplicates ${result.requirementId}`);
        else resultByRequirement.set(result.requirementId, result);
      }
      const requirement = requirementById.get(result.requirementId);
      if (!requirement) errors.push(`${resultPath}.requirementId does not match a requested requirement`);
      else if (result.capabilityId !== requirement.capabilityId) errors.push(`${resultPath}.capabilityId does not match the requested capability`);
      if (result.support === "unknown" && result.status === "pass") errors.push(`${resultPath} cannot pass unknown support`);
      if (result.support === "unsupported" && result.status !== "fail") errors.push(`${resultPath} must fail unsupported support`);
    }

    for (const [requirementId, requirement] of requirementById) {
      const result = resultByRequirement.get(requirementId);
      if (!result) {
        errors.push(`$.candidates[${candidateIndex}].capabilityResults is missing ${requirementId}`);
        continue;
      }
      if (candidate.status === "selected" && requirement.level === "hard" && (result.support !== "strong" || result.status !== "pass")) {
        errors.push(`$.candidates[${candidateIndex}] cannot be selected because hard requirement ${requirementId} is not strongly supported and passing`);
      }
    }

    if (candidate.status === "selected" && Array.isArray(candidate.hardFailures) && candidate.hardFailures.length > 0) {
      errors.push(`$.candidates[${candidateIndex}].hardFailures must be empty for a selected candidate`);
    }
  }

  const selection = isObject(payload.selection) ? payload.selection : {};
  if (typeof payload.status === "string" && typeof selection.status === "string" && payload.status !== selection.status) {
    errors.push("$.status must match $.selection.status");
  }

  const selectedCandidates = candidates.filter((candidate) => candidate.status === "selected");
  if (payload.status === "selected") {
    if (selectedCandidates.length !== 1) errors.push("$.candidates must contain exactly one selected candidate");
    const selectedCandidate = selectedCandidates[0];
    if (selectedCandidate) {
      if (selection.selectedCandidateId !== selectedCandidate.candidateId) errors.push("$.selection.selectedCandidateId must identify the selected candidate");
      if (!isObject(selection.selectedCapabilityProfileRef) || !isObject(selectedCandidate.capabilityProfileRef) || !deepEqual(selection.selectedCapabilityProfileRef, selectedCandidate.capabilityProfileRef)) {
        errors.push("$.selection.selectedCapabilityProfileRef must equal the selected candidate profile reference");
      }
    }
  } else {
    if (selectedCandidates.length > 0) errors.push("$.candidates cannot mark a candidate selected unless the plan is selected");
    if (selection.selectedCandidateId !== null) errors.push("$.selection.selectedCandidateId must be null unless the plan is selected");
    if (selection.selectedCapabilityProfileRef !== null) errors.push("$.selection.selectedCapabilityProfileRef must be null unless the plan is selected");
  }
}

function validateWorkflowPlanSemantics(payload, errors, contracts) {
  if (!isObject(payload)) return;
  if (!isObject(contracts?.routes) || !Array.isArray(contracts?.contractKinds)) {
    errors.push("$ semantic validation requires the matching contracts.json route authority");
    return;
  }
  if (contracts.skill !== "cineweave-director") {
    errors.push("$ semantic validation requires CineWeave contracts.json route authority");
  }

  const steps = Array.isArray(payload.steps) ? payload.steps.filter(isObject) : [];
  const stepById = new Map();
  for (const [index, step] of steps.entries()) {
    if (typeof step.stepId !== "string") continue;
    if (stepById.has(step.stepId)) errors.push(`$.steps[${index}].stepId duplicates ${step.stepId}`);
    else stepById.set(step.stepId, step);
    if (step.status === "blocked" && (typeof step.blockReason !== "string" || step.blockReason.length === 0)) {
      errors.push(`$.steps[${index}].blockReason is required for a blocked step`);
    }
    if (step.status !== "blocked" && step.blockReason !== undefined) {
      errors.push(`$.steps[${index}].blockReason is only valid for a blocked step`);
    }
  }

  for (const [index, step] of steps.entries()) {
    const dependencies = Array.isArray(step.dependsOn) ? step.dependsOn : [];
    for (const dependency of dependencies) {
      if (!stepById.has(dependency)) errors.push(`$.steps[${index}].dependsOn references missing step ${dependency}`);
      if (dependency === step.stepId) errors.push(`$.steps[${index}].dependsOn cannot reference itself`);
      const dependencyStatus = stepById.get(dependency)?.status;
      if (["in_progress", "ready", "complete"].includes(step.status) && dependencyStatus !== undefined && !["complete", "skipped"].includes(dependencyStatus)) {
        errors.push(`$.steps[${index}] cannot be ${step.status} while dependency ${dependency} is ${dependencyStatus}`);
      }
    }
  }

  const currentGate = isObject(payload.currentGate) ? payload.currentGate : {};
  const blockedSteps = steps.filter((step) => step.status === "blocked");
  const hasBlockedState = blockedSteps.length > 0 || currentGate.status === "blocked";
  if (currentGate.type === "none" && currentGate.status !== "satisfied") {
    errors.push("$.currentGate with type none must be satisfied");
  }
  if (hasBlockedState && payload.status !== "blocked") {
    errors.push("$.status must be blocked while a step or the current gate is blocked");
  }
  if (payload.status === "blocked" && !hasBlockedState) {
    errors.push("$.status cannot be blocked without a blocked step or current gate");
  }
  if (["complete", "archived"].includes(payload.status)) {
    const nonTerminalSteps = steps.filter((step) => !["complete", "skipped"].includes(step.status));
    if (nonTerminalSteps.length > 0) errors.push(`$.status ${payload.status} requires every step to be complete or skipped`);
    if (currentGate.type !== "none" || currentGate.status !== "satisfied") {
      errors.push(`$.status ${payload.status} requires a satisfied currentGate of type none`);
    }
  }

  let hasCycle = false;
  const visitState = new Map();
  const visit = (stepId, stack = []) => {
    const state = visitState.get(stepId) ?? 0;
    if (state === 1) {
      hasCycle = true;
      errors.push(`$.steps dependencies contain a cycle: ${[...stack, stepId].join(" -> ")}`);
      return;
    }
    if (state === 2) return;
    visitState.set(stepId, 1);
    const step = stepById.get(stepId);
    for (const dependency of step?.dependsOn ?? []) if (stepById.has(dependency)) visit(dependency, [...stack, stepId]);
    visitState.set(stepId, 2);
  };
  for (const stepId of stepById.keys()) visit(stepId);

  const knownKinds = new Set(contracts.contractKinds);
  const producersByKind = new Map();
  for (const [index, step] of steps.entries()) {
    const ownedKinds = new Set(contracts.routes[step.route]?.produces ?? []);
    if (!Object.hasOwn(contracts.routes, step.route)) errors.push(`$.steps[${index}].route is not declared by contracts.json`);
    for (const kind of step.inputKinds ?? []) {
      if (!knownKinds.has(kind)) errors.push(`$.steps[${index}].inputKinds contains undeclared contract kind ${kind}`);
    }
    for (const kind of step.outputKinds ?? []) {
      if (!knownKinds.has(kind)) errors.push(`$.steps[${index}].outputKinds contains undeclared contract kind ${kind}`);
      if (!ownedKinds.has(kind)) errors.push(`$.steps[${index}].outputKinds assigns ${kind} to non-owning route ${step.route}`);
      if (step.status !== "skipped") {
        if (!producersByKind.has(kind)) producersByKind.set(kind, []);
        producersByKind.get(kind).push(step.stepId);
      }
    }
  }

  if (!hasCycle) {
    const ancestorMemo = new Map();
    const ancestorsOf = (stepId) => {
      if (ancestorMemo.has(stepId)) return ancestorMemo.get(stepId);
      const ancestors = new Set();
      ancestorMemo.set(stepId, ancestors);
      for (const dependency of stepById.get(stepId)?.dependsOn ?? []) {
        if (!stepById.has(dependency)) continue;
        ancestors.add(dependency);
        if (stepById.get(dependency)?.status === "skipped") continue;
        for (const ancestor of ancestorsOf(dependency)) ancestors.add(ancestor);
      }
      return ancestors;
    };

    for (const [index, step] of steps.entries()) {
      const ancestors = ancestorsOf(step.stepId);
      for (const kind of step.inputKinds ?? []) {
        if (kind === "cineweave_codex_creative_brief" && payload.creativeBriefRef?.kind === kind) continue;
        const producers = producersByKind.get(kind) ?? [];
        if (producers.length === 0) {
          errors.push(`$.steps[${index}].inputKinds consumes ${kind} without an exact root binding or non-skipped in-plan producer`);
        } else if (!producers.some((producerId) => ancestors.has(producerId))) {
          errors.push(`$.steps[${index}].inputKinds consumes ${kind} without depending on an in-plan producer`);
        }
      }
    }
  }

  for (const [index, deliverable] of (payload.deliverables ?? []).entries()) {
    if (!isObject(deliverable)) continue;
    const ownedKinds = new Set(contracts.routes[deliverable.route]?.produces ?? []);
    if (!knownKinds.has(deliverable.kind)) errors.push(`$.deliverables[${index}].kind is not declared by contracts.json`);
    if (!ownedKinds.has(deliverable.kind)) errors.push(`$.deliverables[${index}] assigns ${deliverable.kind} to non-owning route ${deliverable.route}`);
    if (isObject(deliverable.artifactRef) && deliverable.artifactRef.kind !== deliverable.kind) {
      errors.push(`$.deliverables[${index}].artifactRef.kind must match the deliverable kind`);
    }
    if (!isObject(deliverable.artifactRef)) {
      const producerIds = producersByKind.get(deliverable.kind) ?? [];
      if (!producerIds.some((stepId) => stepById.get(stepId)?.route === deliverable.route)) {
        errors.push(`$.deliverables[${index}] has no in-plan producer and no exact artifactRef`);
      }
    }
  }
}

function validateCreativeReviewSemantics(payload, errors) {
  if (!isObject(payload)) return;
  const evidence = Array.isArray(payload.evidence) ? payload.evidence.filter(isObject) : [];
  const findings = Array.isArray(payload.findings) ? payload.findings.filter(isObject) : [];
  const evidenceById = new Map();
  const findingById = new Map();
  const isAccessibleEvidence = (item) => isObject(item?.observationRef) && ["visible", "declared"].includes(item.basis);
  const isVisibleEvidence = (item) => isObject(item?.observationRef) && item.basis === "visible";

  for (const [index, item] of evidence.entries()) {
    if (typeof item.evidenceId !== "string") continue;
    if (evidenceById.has(item.evidenceId)) errors.push(`$.evidence[${index}].evidenceId duplicates ${item.evidenceId}`);
    else evidenceById.set(item.evidenceId, item);
  }
  for (const [index, finding] of findings.entries()) {
    if (typeof finding.findingId === "string") {
      if (findingById.has(finding.findingId)) errors.push(`$.findings[${index}].findingId duplicates ${finding.findingId}`);
      else findingById.set(finding.findingId, finding);
    }
    const evidenceIds = Array.isArray(finding.evidenceIds) ? finding.evidenceIds : [];
    for (const evidenceId of evidenceIds) {
      if (!evidenceById.has(evidenceId)) errors.push(`$.findings[${index}].evidenceIds references missing evidence ${evidenceId}`);
    }
    if (payload.status === "planned" && finding.status !== "unknown") {
      errors.push(`$.findings[${index}].status must remain unknown while the review is planned`);
    }
    if (payload.status === "completed" && finding.status !== "not_applicable" && evidenceIds.length === 0) {
      errors.push(`$.findings[${index}].evidenceIds must bind completed findings to actual evidence`);
    }
    const citedEvidence = evidenceIds.map((id) => evidenceById.get(id)).filter(Boolean);
    const hasGroundedEvidence = citedEvidence.some(isAccessibleEvidence);
    if (["pass", "warn", "fail"].includes(finding.status) && !hasGroundedEvidence) {
      errors.push(`$.findings[${index}].status cannot be ${finding.status} without an accessible visible or declared observation`);
    }
  }

  const blockingFindingIds = findings
    .filter((finding) => finding.severity === "blocking" && !["pass", "not_applicable"].includes(finding.status))
    .map((finding) => finding.findingId)
    .filter((id) => typeof id === "string");
  const decision = isObject(payload.decision) ? payload.decision : {};
  if (!sameStringSet(decision.blockingFindingIds, blockingFindingIds)) {
    errors.push("$.decision.blockingFindingIds must exactly identify every non-passing blocking finding");
  }

  const applicableFindings = findings.filter((finding) => finding.status !== "not_applicable");
  const hasVisibleApplicableFinding = applicableFindings.some((finding) => {
    const evidenceIds = Array.isArray(finding.evidenceIds) ? finding.evidenceIds : [];
    return evidenceIds.some((id) => isVisibleEvidence(evidenceById.get(id)));
  });
  const hasUnknown = applicableFindings.some((finding) => finding.status === "unknown");
  const hasFailure = applicableFindings.some((finding) => finding.status === "fail");
  const hasWarning = applicableFindings.some((finding) => finding.status === "warn");
  const humanReviewStatus = payload.humanReview?.status;
  const humanReviewComplete = humanReviewStatus === "completed";
  if (payload.status === "completed" && !hasVisibleApplicableFinding) {
    errors.push("$.status cannot be completed without visible evidence bound to an applicable finding");
  }
  if (payload.status === "in_review" && !["planned", "in_progress"].includes(humanReviewStatus)) {
    errors.push("$.humanReview.status must be planned or in_progress while the review is in_review");
  }

  const expectedMayAdvance = payload.status === "completed"
    && humanReviewComplete
    && hasVisibleApplicableFinding
    && !hasUnknown
    && !hasFailure
    && blockingFindingIds.length === 0;
  if (decision.mayAdvance !== expectedMayAdvance) {
    errors.push(`$.decision.mayAdvance must equal ${expectedMayAdvance} for the recorded review state`);
  }

  if (payload.status === "planned") {
    if (decision.overallStatus !== "planned") errors.push("$.decision.overallStatus must be planned while the review is planned");
    if (decision.nextAction !== "collect_evidence") errors.push("$.decision.nextAction must collect_evidence while the review is planned");
  } else if (["in_review", "completed"].includes(payload.status)) {
    const expectedOverallStatus = !hasVisibleApplicableFinding || hasUnknown
      ? "blocked"
      : hasFailure || blockingFindingIds.length > 0
        ? "fail"
        : hasWarning
          ? "warn"
          : "pass";
    if (decision.overallStatus !== expectedOverallStatus) {
      errors.push(`$.decision.overallStatus must equal ${expectedOverallStatus} for the recorded findings and evidence`);
    }

    const expectedNextAction = !hasVisibleApplicableFinding || hasUnknown
      ? "collect_evidence"
      : payload.status === "in_review"
        ? "conduct_human_review"
        : hasFailure || blockingFindingIds.length > 0
          ? "repair"
          : "retain_candidate";
    if (decision.nextAction !== expectedNextAction) {
      errors.push(`$.decision.nextAction must equal ${expectedNextAction} for the recorded review state`);
    }
  }
}

function validateRepairPlanSemantics(payload, errors) {
  const gate = payload.humanGate?.status;
  if (payload.status === "approved" && gate !== "approved") errors.push("$.humanGate.status must be approved for an approved repair");
  if (payload.status === "rejected" && gate !== "rejected") errors.push("$.humanGate.status must be rejected for a rejected repair");
  if (gate === "rejected" && !["rejected", "superseded"].includes(payload.status)) errors.push("$.status must be rejected or superseded when the human gate is rejected");
  const path = payload.change?.targetPath;
  if (typeof path === "string" && (!path.startsWith("/") || /~(?:[^01]|$)/u.test(path))) errors.push("$.change.targetPath must be a non-root RFC6901 JSON pointer");
  const ids = (Array.isArray(payload.acceptanceChecks) ? payload.acceptanceChecks : []).map((check) => check?.checkId);
  if (new Set(ids).size !== ids.length) errors.push("$.acceptanceChecks must have unique checkId values");
}

// The supplied registry binds exact refs to documents; hashes use JCS UTF-8,
// independently of the raw-byte distribution index. This does not prove media.
function validateRepairContext(payload, artifacts, errors, unverified) {
  const resolveRef = (ref, label) => {
    const matches = artifacts.filter((entry) => isObject(entry) && isObject(entry.ref) && deepEqual(entry.ref, ref));
    if (matches.length !== 1) {
      unverified.push(`${label}: exact registry binding unavailable or ambiguous`);
      if (matches.length > 1) errors.push(`${label}: ambiguous registry binding`);
      return null;
    }
    const document = matches[0].document;
    if (!isObject(document) || document.kind !== ref.kind || sha256Bytes(canonicalize(document)) !== ref.contentHash) {
      errors.push(`${label}: document kind or JCS content hash does not match the exact reference`);
      return null;
    }
    if (document.version !== undefined && document.version !== ref.version) errors.push(`${label}: document version mismatch`);
    return document;
  };
  const review = resolveRef(payload.sourceReviewRef, "sourceReviewRef");
  const target = resolveRef(payload.targetRef, "targetRef");
  if (review) {
    if (review.reviewId !== payload.sourceReviewRef.id) errors.push("sourceReviewRef: review ID mismatch");
    if (review.status !== "completed") errors.push("sourceReviewRef: repair requires a completed source review");
    const findings = (Array.isArray(review.findings) ? review.findings : []).filter((item) => item?.findingId === payload.findingId);
    if (findings.length !== 1) errors.push("$.findingId must resolve to exactly one source review finding");
    else {
      const finding = findings[0];
      if (!["warn", "fail"].includes(finding.status)) errors.push("$.findingId must identify a warn or fail finding");
      if (finding.domain !== payload.domain) errors.push("$.domain must match the source finding owner");
    }
    if (!(Array.isArray(review.targetRefs) ? review.targetRefs : []).some((ref) => deepEqual(ref, payload.targetRef))) unverified.push("targetRef: upstream repair target relationship to reviewed targets needs domain review");
  }
  if (target) {
    try { pointerGet(target, `#${payload.change.targetPath}`); }
    catch { errors.push("$.change.targetPath does not resolve in the supplied target document"); }
  }
  unverified.push("Observed media, preservation of passing dimensions, registry identity authority, and repair success require evidence review");
}

function validateContractSemantics(payload, schema, errors, contracts) {
  const schemaKind = schema?.properties?.kind?.const;
  if (!isObject(payload) || payload.kind !== schemaKind) return;
  if (schemaKind === "cineweave_codex_prompt_projection_plan") validatePromptProjectionPlanSemantics(payload, errors);
  if (schemaKind === "cineweave_codex_capability_resolution_plan") validateCapabilityResolutionPlanSemantics(payload, errors);
  if (schemaKind === "cineweave_codex_workflow_plan") validateWorkflowPlanSemantics(payload, errors, contracts);
  if (schemaKind === "cineweave_codex_creative_review") validateCreativeReviewSemantics(payload, errors);
  if (schemaKind === "cineweave_codex_repair_plan") validateRepairPlanSemantics(payload, errors);
}

async function loadMatchingContracts(schemaPath) {
  const absoluteSchema = resolve(schemaPath);
  const skillRoot = resolve(dirname(absoluteSchema), "..", "..", "..");
  const resourcesDirectory = resolve(skillRoot, "resources");
  const contractsDirectory = resolve(resourcesDirectory, "contracts");
  const schemaDirectory = resolve(contractsDirectory, "schemas");
  const contractsPath = resolve(skillRoot, "contracts.json");
  for (const directory of [skillRoot, resourcesDirectory, contractsDirectory, schemaDirectory]) {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error(`WorkflowPlan release path must use regular non-link directories: ${directory}`);
    }
  }
  const [realSchema, realSchemaDirectory, realSkillRoot] = await Promise.all([
    realpath(absoluteSchema),
    realpath(schemaDirectory),
    realpath(skillRoot),
  ]);
  const expectedRealSchemaDirectory = resolve(realSkillRoot, "resources", "contracts", "schemas");
  if (realSchemaDirectory !== expectedRealSchemaDirectory || dirname(realSchema) !== realSchemaDirectory) {
    throw new Error(`WorkflowPlan schema is not physically inside its CineWeave release schema directory: ${absoluteSchema}`);
  }
  const stat = await lstat(contractsPath);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Matching contracts.json must be a regular non-link file: ${contractsPath}`);
  const realContracts = await realpath(contractsPath);
  if (dirname(realContracts) !== realSkillRoot) throw new Error(`Matching contracts.json escapes the CineWeave release root: ${contractsPath}`);
  if (!contractsCache.has(realContracts)) contractsCache.set(realContracts, parseJsonStrict(await readFile(realContracts, "utf8")));
  return contractsCache.get(realContracts);
}

export async function validatePayload(schemaPath, payload, options = {}) {
  canonicalize(payload);
  const absoluteSchema = resolve(schemaPath);
  const loader = new SchemaLoader(absoluteSchema);
  const document = await loader.load(absoluteSchema);
  await loader.assertRefClosure(document, document, absoluteSchema);
  const errors = [];
  await validateNode(payload, document, {
    loader,
    document,
    schemaPath: absoluteSchema,
    activeReferences: new Set(),
  }, "$", errors);
  const schemaKind = document?.properties?.kind?.const;
  const contracts = options.contracts ?? (schemaKind === "cineweave_codex_workflow_plan" ? await loadMatchingContracts(absoluteSchema) : null);
  validateContractSemantics(payload, document, errors, contracts);
  const unverified = [];
  if (schemaKind === "cineweave_codex_repair_plan" && errors.length === 0) {
    if (options.artifacts !== undefined && !Array.isArray(options.artifacts)) errors.push("artifacts must be an array of exact ref/document bindings");
    else validateRepairContext(payload, options.artifacts ?? [], errors, unverified);
  }
  return { valid: errors.length === 0, errors, unverified, schema: document.$id || absoluteSchema, payload };
}

export async function validateDocument(schemaPath, payloadPath, options = {}) {
  const payload = parseJsonStrict(await readFile(resolve(payloadPath), "utf8"));
  return validatePayload(schemaPath, payload, options);
}

async function main() {
  const [, , schemaPath, payloadPath, flag, registryPath, ...extra] = process.argv;
  if (!schemaPath || !payloadPath || extra.length || (flag !== undefined && (flag !== "--artifacts" || !registryPath))) {
    usage();
    process.exitCode = 2;
    return;
  }
  const options = registryPath ? { artifacts: parseJsonStrict(await readFile(resolve(registryPath), "utf8")) } : {};
  const result = await validateDocument(schemaPath, payloadPath, options);
  if (!result.valid) {
    console.error(JSON.stringify({ valid: false, errors: result.errors, unverified: result.unverified }, null, 2));
    process.exitCode = 2;
    return;
  }
  console.log(JSON.stringify({ valid: true, schema: result.schema, payload: resolve(payloadPath), unverified: result.unverified }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 2;
  });
}
