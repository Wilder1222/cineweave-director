#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

function usage() {
  console.error("Usage: node scripts/validate-output.mjs <schema.json> <payload.json>");
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
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
    default: return true;
  }
}

function pointerGet(document, pointer) {
  if (!pointer || pointer === "#") return document;
  if (!pointer.startsWith("#/")) throw new Error(`Unsupported JSON pointer: ${pointer}`);
  return pointer.slice(2).split("/").reduce((current, token) => {
    const key = token.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === undefined || current === null || !(key in current)) {
      throw new Error(`Unresolved JSON pointer: ${pointer}`);
    }
    return current[key];
  }, document);
}

function formatValid(value, format) {
  if (typeof value !== "string") return true;
  if (format === "date-time") return !Number.isNaN(Date.parse(value));
  if (format === "uri") {
    try {
      const parsed = new URL(value);
      return Boolean(parsed.protocol);
    } catch {
      return false;
    }
  }
  return true;
}

class SchemaLoader {
  constructor(rootSchemaPath) {
    this.rootSchemaPath = resolve(rootSchemaPath);
    this.cache = new Map();
  }

  async load(path) {
    const absolute = resolve(path);
    if (!this.cache.has(absolute)) {
      this.cache.set(absolute, JSON.parse(await readFile(absolute, "utf8")));
    }
    return this.cache.get(absolute);
  }

  async resolveRef(refValue, currentSchema, currentPath) {
    if (refValue.startsWith("#")) {
      return { schema: pointerGet(currentSchema, refValue), document: currentSchema, path: currentPath };
    }

    const [filePart, fragment = ""] = refValue.split("#", 2);
    let targetPath;
    if (/^https?:\/\//.test(filePart)) {
      targetPath = resolve(dirname(this.rootSchemaPath), basename(new URL(filePart).pathname));
    } else {
      targetPath = resolve(dirname(currentPath), filePart);
    }
    const document = await this.load(targetPath);
    const schema = fragment ? pointerGet(document, `#${fragment}`) : document;
    return { schema, document, path: targetPath };
  }
}

async function validateNode(value, schema, context, path = "$", errors = []) {
  if (schema === true) return errors;
  if (schema === false) { errors.push(`${path} is forbidden by a false schema`); return errors; }
  if (!isObject(schema)) return errors;

  if (schema.$ref) {
    const target = await context.loader.resolveRef(schema.$ref, context.document, context.schemaPath);
    return validateNode(value, target.schema, { ...context, document: target.document, schemaPath: target.path }, path, errors);
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
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} must contain at least ${schema.minLength} characters`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} must contain at most ${schema.maxLength} characters`);
    if (schema.pattern !== undefined) {
      let regex;
      try { regex = new RegExp(schema.pattern); } catch { errors.push(`${path}: schema contains invalid pattern ${schema.pattern}`); }
      if (regex && !regex.test(value)) errors.push(`${path} must match ${schema.pattern}`);
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
        const key = JSON.stringify(item);
        if (seen.has(key)) errors.push(`${path}[${index}] duplicates an earlier item`);
        seen.add(key);
      });
    }
    if (schema.prefixItems) {
      for (let index = 0; index < Math.min(value.length, schema.prefixItems.length); index += 1) {
        await validateNode(value[index], schema.prefixItems[index], context, `${path}[${index}]`, errors);
      }
    }
    if (schema.items && isObject(schema.items)) {
      for (let index = 0; index < value.length; index += 1) {
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
      if (!(required in value)) errors.push(`${path}.${required} is required`);
    }
    const properties = schema.properties || {};
    for (const [key, child] of Object.entries(value)) {
      if (key in properties) {
        await validateNode(child, properties[key], context, `${path}.${key}`, errors);
      } else if (schema.patternProperties) {
        const matches = Object.entries(schema.patternProperties).filter(([pattern]) => new RegExp(pattern).test(key));
        if (matches.length) {
          for (const [, sub] of matches) await validateNode(child, sub, context, `${path}.${key}`, errors);
        } else if (schema.additionalProperties === false) {
          errors.push(`${path}.${key} is not allowed`);
        } else if (isObject(schema.additionalProperties)) {
          await validateNode(child, schema.additionalProperties, context, `${path}.${key}`, errors);
        }
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key} is not allowed`);
      } else if (isObject(schema.additionalProperties)) {
        await validateNode(child, schema.additionalProperties, context, `${path}.${key}`, errors);
      }
    }
    if (schema.dependentRequired) {
      for (const [key, dependencies] of Object.entries(schema.dependentRequired)) {
        if (key in value) {
          for (const dependency of dependencies) if (!(dependency in value)) errors.push(`${path}.${dependency} is required when ${key} is present`);
        }
      }
    }
  }

  return errors;
}

export async function validateDocument(schemaPath, payloadPath) {
  const absoluteSchema = resolve(schemaPath);
  const loader = new SchemaLoader(absoluteSchema);
  const document = await loader.load(absoluteSchema);
  const payload = JSON.parse(await readFile(resolve(payloadPath), "utf8"));
  const errors = [];
  await validateNode(payload, document, { loader, document, schemaPath: absoluteSchema }, "$", errors);
  return { valid: errors.length === 0, errors, schema: document.$id || absoluteSchema, payload };
}

async function main() {
  const [, , schemaPath, payloadPath] = process.argv;
  if (!schemaPath || !payloadPath) {
    usage();
    process.exitCode = 2;
    return;
  }
  const result = await validateDocument(schemaPath, payloadPath);
  if (!result.valid) {
    console.error(JSON.stringify({ valid: false, errors: result.errors }, null, 2));
    process.exitCode = 2;
    return;
  }
  console.log(JSON.stringify({ valid: true, schema: result.schema, payload: resolve(payloadPath) }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exitCode = 2;
  });
}
