import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { compileShotPlan, createShotCompiler, CinematicSkillCompileError } from "../../packages/cineweave-runtime/src/cinematic-skill-runtime.mjs";
import { sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const contractRoot = resolve(process.cwd(), "packages", "cineweave-contracts");
const readExample = (name) => readFile(join(contractRoot, "examples", name), "utf8").then(JSON.parse);
const [manifest, planExample, aliasRegistry] = await Promise.all([
  readExample("cinematic-skill-manifest.json"),
  readExample("shot-compiler-plan.json"),
  readExample("asset-alias-registry.json")
]);

const registryRef = {
  kind: aliasRegistry.kind,
  id: aliasRegistry.assetAliasRegistryId,
  version: aliasRegistry.version,
  contentHash: sha256Canonical(aliasRegistry)
};

function directInvocation(overrides = {}) {
  return {
    cinematicSkillManifestRef: planExample.cinematicSkillManifestRef,
    skillId: "slow-push-reaction",
    skillVersion: 1,
    intent: planExample.intent,
    parameterValues: planExample.parameterValues,
    bindingRequests: planExample.resolvedBindings
      .filter((binding) => binding.slotId !== "performance")
      .map(({ slotId, refs }) => ({ slotId, refs })),
    upstreamRefs: planExample.upstreamRefs,
    createdAt: "2026-09-02T04:05:00.000Z",
    ...overrides
  };
}

test("Shot Compiler lists Atomic Skills and emits deterministic exact handoffs", async () => {
  const compiler = createShotCompiler(manifest);
  assert.equal(compiler.listSkills().length, 12);
  assert.equal(compiler.listSkills().some((skill) => skill.skillId === "slow-push-reaction"), true);

  const first = compiler.compile(directInvocation());
  const second = compiler.compile(directInvocation());
  assert.deepEqual(first, second);
  assert.equal(first.kind, "cineweave_codex_shot_compiler_plan");
  assert.equal(first.cinematicSkillManifestRef.contentHash, sha256Canonical(manifest));
  assert.equal(first.controlSurface.projectionOnly, true);
  assert.equal(first.controlSurface.groups.flatMap((group) => group.controls).length, 3);
  assert.equal(first.handoffs.length, 3);
  assert.equal(first.compileTrace.steps.length, 4);
  assert.equal(first.compileTrace.unresolved.some((note) => note.includes("Optional binding slot performance")), true);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.controlSurface.groups[0].controls[0]), true);
  assert.throws(() => { first.intent.summary = "mutation"; }, TypeError);

  const schemaResult = await validatePayload(join(contractRoot, "schemas", "shot-compiler-plan.schema.json"), first);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(first, { cinematicSkillManifest: manifest }), []);
});

test("Shot Compiler resolves @Asset aliases only through the exact registry", () => {
  const invocation = directInvocation({
    bindingRequests: [
      { slotId: "character", alias: "@沈蘅" },
      { slotId: "scene", alias: "@临安.御街.雨夜" }
    ],
    assetAliasRegistryRef: registryRef,
    upstreamRefs: []
  });
  const compiled = compileShotPlan(manifest, invocation, { assetAliasRegistry: aliasRegistry });
  assert.equal(compiled.assetAliasRegistryRef.contentHash, registryRef.contentHash);
  assert.deepEqual(compiled.resolvedBindings.map((binding) => binding.refs[0].id), [
    "binding.gu-yin-courtyard-01",
    "binding.scene-rain-courtyard-01"
  ]);
  assert.deepEqual(validateByKind(compiled, { cinematicSkillManifest: manifest, assetAliasRegistry: aliasRegistry }), []);

  assert.throws(
    () => compileShotPlan(manifest, { ...invocation, bindingRequests: [{ slotId: "character", alias: "@不存在" }, { slotId: "scene", alias: "@临安.御街.雨夜" }] }, { assetAliasRegistry: aliasRegistry }),
    (error) => error instanceof CinematicSkillCompileError && error.code === "ASSET_ALIAS_UNKNOWN"
  );
  assert.throws(
    () => compileShotPlan(manifest, { ...invocation, assetAliasRegistryRef: { ...registryRef, contentHash: "sha256:" + "f".repeat(64) } }, { assetAliasRegistry: aliasRegistry }),
    (error) => error instanceof CinematicSkillCompileError && error.code === "ALIAS_REGISTRY_STALE"
  );
});

test("Shot Compiler blocks stale manifests, missing required slots and out-of-range values", () => {
  assert.throws(
    () => compileShotPlan(manifest, { ...directInvocation(), cinematicSkillManifestRef: { ...planExample.cinematicSkillManifestRef, contentHash: "sha256:" + "f".repeat(64) } }),
    (error) => error instanceof CinematicSkillCompileError && error.code === "MANIFEST_REF_STALE"
  );
  assert.throws(
    () => compileShotPlan(manifest, directInvocation({ bindingRequests: [{ slotId: "character", refs: directInvocation().bindingRequests[0].refs }] })),
    (error) => error instanceof CinematicSkillCompileError && error.code === "BINDING_REQUIRED"
  );
  assert.throws(
    () => compileShotPlan(manifest, directInvocation({ parameterValues: [{ parameterId: "push_intensity", value: 1.2, source: "user_override" }] })),
    (error) => error instanceof CinematicSkillCompileError && error.code === "PARAMETER_RANGE_EXCEEDED"
  );
  assert.throws(
    () => compileShotPlan(manifest, directInvocation({ version: 0 })),
    (error) => error instanceof CinematicSkillCompileError && error.code === "PLAN_VERSION_INVALID"
  );
  assert.throws(
    () => compileShotPlan(manifest, directInvocation({ planId: 42 })),
    (error) => error instanceof CinematicSkillCompileError && error.code === "PLAN_ID_INVALID"
  );
});
