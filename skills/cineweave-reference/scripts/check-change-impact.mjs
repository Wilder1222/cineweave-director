#!/usr/bin/env node
/** 只读查询声明的字段依赖，不修改版本、批准产物、联网或执行重生成。 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertUnicodeScalar, parseJsonStrict } from "./parse-json.mjs";

export const FORMAT = "cineweave-change-impact";
const own = (value, key) => Object.hasOwn(value, key);
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const revision = (value) => Number.isSafeInteger(value) && value > 0;
const label = (value) => typeof value === "string" && value.length > 0 && value === value.trim()
  && !/[\u0000-\u001f\u007f]/u.test(value);
const issue = (code, message, location = null) => ({ code, message, location });

function resultBase(errors = []) {
  return { valid: false, affected: [], unaffected: [], needsReview: [], errors, scope: "plan_only",
    changedSources: [], noOpChanges: [], changeEvidence: [], sourceAuthorityVerified: false,
    measurementVerified: false };
}

function fields(value, allowed, location, errors) {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.includes(key)) {
      errors.push(issue("UNKNOWN_FIELD", `Unsupported field ${String(key)}`, location));
    }
  }
}

function pointerTokens(pointer) {
  if (typeof pointer !== "string") throw new TypeError("A JSON Pointer must be a string");
  assertUnicodeScalar(pointer, "JSON Pointer");
  if (pointer === "") return [];
  if (!pointer.startsWith("/") || /~(?:[^01]|$)/u.test(pointer)) {
    throw new TypeError("Use RFC 6901 JSON Pointer syntax, with only ~0 and ~1 escapes");
  }
  return pointer.slice(1).split("/").map((token) => token.replace(/~1/gu, "/").replace(/~0/gu, "~"));
}

function paths(value, location, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(issue("PATHS", "Declare a nonempty pointer array; use [\"\"] explicitly for the entire document", location));
    return [];
  }
  const tokens = [], seen = new Set();
  for (const pointer of value) {
    try {
      const decoded = pointerTokens(pointer), key = JSON.stringify(decoded);
      if (seen.has(key)) errors.push(issue("DUPLICATE_PATH", "Repeated JSON Pointer", location));
      seen.add(key);
      tokens.push(decoded);
    } catch (error) { errors.push(issue("POINTER", error.message, location)); }
  }
  return tokens;
}

// Compare token ancestry: /face never intersects /faceColor, and "" intersects every path.
function intersect(first, second) {
  const length = Math.min(first.length, second.length);
  for (let index = 0; index < length; index += 1) if (first[index] !== second[index]) return false;
  return true;
}

// Inspect descriptors without executing accessors, then work on a plain JSON-data snapshot.
// Frozen enumerable data is accepted; hidden fields cannot disappear during no-op comparison.
function jsonData(value, location = "worksheet", ancestors = new Set()) {
  const fail = (message, at = location) => ({ error: issue(
    /^worksheet\.changes\[\d+\]\.(?:before|after)(?:\.|\[|$)/u.test(at) ? "EVIDENCE_JSON" : "WORKSHEET_JSON", message, at) });
  if (value === null || typeof value === "boolean") return { value };
  if (typeof value === "number") return Number.isFinite(value) ? { value } : fail("JSON data must use finite numbers");
  if (typeof value === "string") {
    try { assertUnicodeScalar(value); return { value }; } catch (error) { return fail(error.message); }
  }
  const array = Array.isArray(value);
  if (!(array ? Object.getPrototypeOf(value) === Array.prototype : object(value))) return fail("Use only plain JSON objects, arrays and scalar values");
  if (ancestors.has(value)) return fail("JSON data must not contain cycles");
  const descriptors = Object.getOwnPropertyDescriptors(value), keys = Reflect.ownKeys(descriptors);
  if (keys.some((key) => typeof key !== "string")) return fail("JSON data must not contain symbol fields");
  if (array) {
    const length = descriptors.length.value;
    if (keys.length !== length + 1 || keys.some((key) => key !== "length"
        && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length))) return fail("JSON arrays must be dense and have no extra fields");
  }
  for (const key of keys) {
    if (array && key === "length") continue;
    const at = array ? `${location}[${key}]` : `${location}.${key}`, descriptor = descriptors[key];
    if (!descriptor.enumerable || !own(descriptor, "value")) return fail("JSON fields must be enumerable own data properties, without accessors or hidden fields", at);
    try { assertUnicodeScalar(key); } catch (error) { return fail(error.message, at); }
  }
  const snapshot = array ? [] : Object.create(null);
  ancestors.add(value);
  for (const key of keys) {
    if (array && key === "length") continue;
    const at = array ? `${location}[${key}]` : `${location}.${key}`;
    const child = jsonData(descriptors[key].value, at, ancestors);
    if (child.error) { ancestors.delete(value); return child; }
    snapshot[key] = child.value;
  }
  ancestors.delete(value);
  return { value: snapshot };
}

// JSON value equality ignores object member order. It is neither canonical hashing nor source verification.
function equalJson(first, second) {
  if (first === second) return true;
  if (first === null || second === null || typeof first !== "object" || typeof second !== "object") return false;
  if (Array.isArray(first) !== Array.isArray(second)) return false;
  if (Array.isArray(first)) return first.length === second.length && first.every((value, index) => equalJson(value, second[index]));
  const firstKeys = Object.keys(first).sort(), secondKeys = Object.keys(second).sort();
  return firstKeys.length === secondKeys.length && firstKeys.every((key, index) => key === secondKeys[index] && equalJson(first[key], second[key]));
}

function propagate(seeds, downstream) {
  const reached = new Set(seeds), queue = [...seeds];
  for (let index = 0; index < queue.length; index += 1) {
    for (const consumer of downstream.get(queue[index]) ?? []) {
      if (!reached.has(consumer)) { reached.add(consumer); queue.push(consumer); }
    }
  }
  return reached;
}

/** Returns an impact plan inside this worksheet's declared artifact scope only. */
export function checkChangeImpact(worksheet) {
  const errors = [], base = resultBase(errors);
  if (!object(worksheet)) {
    errors.push(issue("WORKSHEET", "A noncanonical change-impact worksheet object is required"));
    return base;
  }
  const input = jsonData(worksheet);
  if (input.error) { errors.push(input.error); return base; }
  worksheet = input.value;
  fields(worksheet, ["format", "canonical", "artifacts", "dependencies", "changes"], "worksheet", errors);
  if (!own(worksheet, "format") || worksheet.format !== FORMAT || !own(worksheet, "canonical") || worksheet.canonical !== false) {
    errors.push(issue("FORMAT", `Use format ${FORMAT} and canonical: false`));
  }
  for (const key of ["artifacts", "dependencies", "changes"]) {
    if (!own(worksheet, key) || !Array.isArray(worksheet[key])) errors.push(issue("ARRAY", `${key} must be an array`, key));
  }
  if (errors.length) return base;

  const artifacts = new Map(), downstream = new Map();
  for (const [index, artifact] of worksheet.artifacts.entries()) {
    const location = `artifacts[${index}]`;
    if (!object(artifact)) { errors.push(issue("ARTIFACT", "An artifact object is required", location)); continue; }
    fields(artifact, ["id", "revision", "dependencyCoverage", "validity"], location, errors);
    if (!own(artifact, "id") || !label(artifact.id)) { errors.push(issue("ARTIFACT_ID", "Use an exact nonempty artifact ID with no outer whitespace", location)); continue; }
    try { assertUnicodeScalar(artifact.id, "Artifact ID"); } catch (error) { errors.push(issue("ARTIFACT_ID", error.message, location)); }
    if (!own(artifact, "revision") || !revision(artifact.revision)) errors.push(issue("REVISION", "Artifact revision must be a positive safe integer", location));
    if (!own(artifact, "dependencyCoverage") || !["complete", "partial", "unknown"].includes(artifact.dependencyCoverage)) errors.push(issue("COVERAGE", "Declare complete, partial or unknown dependency coverage", location));
    if (own(artifact, "validity") && !["valid", "stale", "needs_review", "unresolved"].includes(artifact.validity)) errors.push(issue("VALIDITY", "Unsupported worksheet validity", location));
    if (artifacts.has(artifact.id)) errors.push(issue("DUPLICATE_ARTIFACT", "Every artifact ID must be unique in this query", location));
    else { artifacts.set(artifact.id, artifact); downstream.set(artifact.id, new Set()); }
  }

  const dependencies = [], edgeKeys = new Set();
  for (const [index, dependency] of worksheet.dependencies.entries()) {
    const location = `dependencies[${index}]`;
    if (!object(dependency)) { errors.push(issue("DEPENDENCY", "A dependency object is required", location)); continue; }
    fields(dependency, ["consumer", "source", "sourceRevision", "paths"], location, errors);
    const source = artifacts.get(dependency.source), consumer = artifacts.get(dependency.consumer);
    if (!own(dependency, "source") || !source) errors.push(issue("SOURCE_ID", "Dependency source must exactly name an artifact in this query", location));
    if (!own(dependency, "consumer") || !consumer) errors.push(issue("CONSUMER_ID", "Dependency consumer must exactly name an artifact in this query", location));
    if (!own(dependency, "sourceRevision") || !revision(dependency.sourceRevision)) errors.push(issue("REVISION", "sourceRevision must be a positive safe integer", location));
    else if (source && dependency.sourceRevision !== source.revision) errors.push(issue("SOURCE_REVISION", "Dependency must consume the artifact's declared exact revision", location));
    const decodedPaths = paths(dependency.paths, location, errors);
    if (source && consumer) {
      const key = JSON.stringify([dependency.source, dependency.consumer]);
      if (edgeKeys.has(key)) errors.push(issue("DUPLICATE_DEPENDENCY", "Combine the paths for each source/consumer edge in one dependency record", location));
      edgeKeys.add(key);
      downstream.get(dependency.source).add(dependency.consumer);
      dependencies.push({ source: dependency.source, consumer: dependency.consumer, paths: decodedPaths });
    }
  }

  const indegree = new Map([...artifacts.keys()].map((id) => [id, 0]));
  for (const consumers of downstream.values()) for (const id of consumers) indegree.set(id, indegree.get(id) + 1);
  const ready = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  for (let index = 0; index < ready.length; index += 1) {
    for (const id of downstream.get(ready[index])) {
      indegree.set(id, indegree.get(id) - 1);
      if (indegree.get(id) === 0) ready.push(id);
    }
  }
  if (ready.length !== artifacts.size) errors.push(issue("DEPENDENCY_CYCLE", "Declared dependencies must form a single-version DAG"));

  const changes = [], sourceVersions = new Map(), previousChanges = new Map();
  for (const [index, change] of worksheet.changes.entries()) {
    const location = `changes[${index}]`;
    if (!object(change)) { errors.push(issue("CHANGE", "A change object is required", location)); continue; }
    fields(change, ["source", "fromRevision", "toRevision", "paths", "reason", "before", "after"], location, errors);
    const source = artifacts.get(change.source);
    if (!own(change, "source") || !source) errors.push(issue("SOURCE_ID", "Change source must exactly name an artifact in this query", location));
    for (const key of ["fromRevision", "toRevision"]) {
      if (!own(change, key) || !revision(change[key])) errors.push(issue("REVISION", `${key} must be a positive safe integer`, location));
    }
    if (source && revision(change.fromRevision) && change.fromRevision !== source.revision) errors.push(issue("SOURCE_REVISION", "Change fromRevision must equal the declared source revision", location));
    if (!own(change, "reason") || typeof change.reason !== "string" || !change.reason.trim()) errors.push(issue("REASON", "State the change reason; it remains a declaration of authorization or intent", location));
    const decodedPaths = paths(change.paths, location, errors);
    const supplied = own(change, "before") && own(change, "after");
    const noOp = supplied && equalJson(change.before, change.after);
    if (revision(change.fromRevision) && revision(change.toRevision)
        && (change.toRevision < change.fromRevision || (change.toRevision === change.fromRevision && !noOp))) {
      errors.push(issue("REVISION_ORDER", "A declared change must advance its immutable revision; only an explicit equal-value no-op may retain it", location));
    }
    if (source) {
      const versionPair = JSON.stringify([change.fromRevision, change.toRevision]);
      if (sourceVersions.has(change.source) && sourceVersions.get(change.source) !== versionPair) errors.push(issue("INCOMPATIBLE_CHANGE", "All field changes for one source must use the same from/to revisions", location));
      sourceVersions.set(change.source, versionPair);
      const key = JSON.stringify([change.source, ...decodedPaths.map((tokens) => JSON.stringify(tokens)).sort()]);
      const previous = previousChanges.get(key);
      if (previous) {
        const conflicting = supplied && previous.supplied
          && (!equalJson(change.before, previous.change.before) || !equalJson(change.after, previous.change.after));
        errors.push(issue(conflicting ? "CONFLICTING_EVIDENCE" : "DUPLICATE_CHANGE", conflicting
          ? "The same changed fields carry contradictory before/after evidence"
          : "Repeated change record; combine distinct fields at the same revision", location));
      }
      previousChanges.set(key, { change, supplied });
    }
    changes.push({ change, paths: decodedPaths, noOp, status: noOp ? "no_op" : supplied ? "supplied_difference" : "declared_change" });
  }
  if (errors.length) return base;

  const changedSources = new Set(), directlyAffected = new Set(), reviewSeeds = new Set();
  for (const artifact of artifacts.values()) {
    if (artifact.validity === "stale") directlyAffected.add(artifact.id);
    if (artifact.dependencyCoverage !== "complete" || ["needs_review", "unresolved"].includes(artifact.validity)) reviewSeeds.add(artifact.id);
  }
  for (const entry of changes) {
    if (entry.noOp) continue;
    changedSources.add(entry.change.source);
    for (const dependency of dependencies) {
      if (dependency.source === entry.change.source
          && dependency.paths.some((used) => entry.paths.some((changed) => intersect(used, changed)))) directlyAffected.add(dependency.consumer);
    }
  }
  const affected = propagate(directlyAffected, downstream), needsReview = propagate(reviewSeeds, downstream);
  const ids = [...artifacts.keys()];
  const changeEvidence = changes.map(({ change, status }) => ({ source: change.source,
    fromRevision: change.fromRevision, toRevision: change.toRevision, paths: [...change.paths], status }));
  return { ...base, valid: true, affected: ids.filter((id) => affected.has(id)),
    unaffected: ids.filter((id) => !affected.has(id) && !needsReview.has(id) && !changedSources.has(id)),
    needsReview: ids.filter((id) => needsReview.has(id)), changedSources: ids.filter((id) => changedSources.has(id)),
    noOpChanges: changeEvidence.filter((entry) => entry.status === "no_op"), changeEvidence };
}

function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    console.log(JSON.stringify({ usage: "node check-change-impact.mjs worksheet.json", format: FORMAT,
      scope: "plan_only", messageZh: "只读查询声明的依赖图；不写文件、不批准、不联网、不生成。退出 0：有效且无待审；1：输入非法；2：有效但依赖待审。" }, null, 2));
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Provide one worksheet path or --help");
  const result = checkChangeImpact(parseJsonStrict(readFileSync(args[0], "utf8")));
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = !result.valid ? 1 : result.needsReview.length ? 2 : 0;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.log(JSON.stringify(resultBase([issue("INPUT", error.message)]), null, 2)); process.exitCode = 1; }
}
