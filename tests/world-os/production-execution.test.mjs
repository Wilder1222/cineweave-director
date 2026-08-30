import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateDocument } from "../../scripts/validate-output.mjs";
import { createAdapterRegistry } from "../../packages/cineweave-runtime/src/adapter-runtime.mjs";
import { findArtifact, putArtifact, verifyProject } from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { sha256Bytes } from "../../packages/cineweave-runtime/src/canonical-json.mjs";
import { createFixtureAdapterDescriptor, fixtureSvgAdapter } from "../../packages/cineweave-runtime/src/fixture-svg-adapter.mjs";
import { deriveStreamHead, rebuildSeedStore } from "../../packages/cineweave-world-os/src/store.mjs";
import { advanceWorld } from "../../packages/cineweave-world-os/src/scheduler.mjs";
import { auditWorldOsProject } from "../../packages/cineweave-world-os/src/audit.mjs";
import { activateProductionStage, createProductionSlice, PRODUCTION_GATES, recordProductionGateDecision } from "../../packages/cineweave-world-os/src/production.mjs";
import {
  compileProductionExecutionRequest,
  executeProductionRequest,
  verifyProductionExecutionRequest
} from "../../packages/cineweave-world-os/src/production-execution.mjs";
import { createProductionMediaImport, verifyProductionMediaImport } from "../../packages/cineweave-world-os/src/production-media.mjs";
import {
  createProductionQaReview,
  createApprovedAsset,
  createPrivateReleaseReceipt,
  verifyPrivateReleaseReceipt
} from "../../packages/cineweave-world-os/src/production-release.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const seedManifestPath = join(repoRoot, "examples", "multi-world-studio", "seed-manifest.json");

function fixedHash(character) {
  return `sha256:${character.repeat(64)}`;
}

function skillReceipt(timestamp) {
  return {
    repository: "https://github.com/Wilder1222/cineweave-studio",
    ref: "v2.5.1",
    commit: "0123456789abcdef0123456789abcdef01234567",
    contentHash: fixedHash("a"),
    installedBy: "codex-environment",
    usedAt: timestamp
  };
}

function contract(kind, id, extra = {}) {
  const idKey = kind.includes("story_brief") ? "storyId"
    : kind.includes("beat_sheet") ? "beatSheetId"
      : kind.includes("script_scene") ? "scriptSceneId"
        : kind.includes("character_spec") ? "characterId"
          : kind.includes("scene_spec") ? "sceneId"
            : kind.includes("style_package") ? "stylePackageId"
              : kind.includes("shot_spec") ? "shotSpecId"
                : kind.includes("prompt") ? "promptId"
                  : kind.includes("asset_recipe") ? "recipeId"
                    : kind.includes("license_profile") ? "profileId" : "reviewId";
  return { kind, version: 1, ...extra, [idKey]: id };
}

function fixtureContracts() {
  return {
    storyBrief: contract("cineweave_codex_story_brief", "story.w01.execution"),
    beatSheet: contract("cineweave_codex_beat_sheet", "beats.w01.execution"),
    scriptScene: contract("cineweave_codex_script_scene", "script.w01.execution"),
    characterSpecs: [contract("cineweave_codex_character_spec", "char.w01.execution", { worldId: "W01" })],
    sceneSpecs: [contract("cineweave_codex_scene_spec", "scene.w01.execution", { worldId: "W01" })],
    stylePackages: [contract("cineweave_codex_style_package", "style.w01.execution", { worldId: "W01" })],
    shotSpecs: [contract("cineweave_codex_shot_spec", "shot.w01.execution")],
    promptRecords: [contract("cineweave_codex_prompt_record", "prompt.w01.execution")],
    recipe: contract("cineweave_codex_asset_recipe", "recipe.w01.execution", { worldId: "W01" }),
    rightsProfile: contract("cineweave_codex_license_profile", "rights.w01.execution"),
    qaReviews: [contract("cineweave_codex_character_review", "review.w01.execution")]
  };
}

async function createSliceAtStage(project, t, gateCount) {
  await rebuildSeedStore(seedManifestPath, project);
  await advanceWorld(project, "W01", { maxSteps: 1 });
  const head = await deriveStreamHead(project, "W01", "simulation.main");
  const createdAt = "2026-08-24T13:00:00.000Z";
  const created = await createProductionSlice(project, {
    worldId: "W01",
    sourceCommitRef: head.commitRef,
    sourceStateRef: head.stateRef,
    episodeId: "episode.w01.execution",
    title: "生产执行桥测试切片",
    contracts: fixtureContracts(),
    createdAt
  });
  let currentRef = created.sliceRef;
  for (let index = 0; index < gateCount; index += 1) {
    const gate = PRODUCTION_GATES[index];
    const decision = await recordProductionGateDecision(project, currentRef, {
      gate,
      decision: "approve",
      actorId: "human.producer",
      rationale: `Execution bridge test Gate ${gate}`,
      decidedAt: `2026-08-24T13:${String(index + 2).padStart(2, "0")}:00.000Z`
    });
    const activated = await activateProductionStage(project, currentRef, decision.decisionRef, {
      updatedAt: `2026-08-24T13:${String(index + 2).padStart(2, "0")}:30.000Z`
    });
    currentRef = activated.sliceRef;
  }
  if (t) t.after(() => rm(project, { recursive: true, force: true }));
  return { sliceRef: currentRef, skill: skillReceipt("2026-08-24T13:10:00.000Z") };
}

async function storeFixtureAdapter(project, skill) {
  const timestamp = "2026-08-24T13:10:00.000Z";
  const license = await putArtifact(project, {
    kind: "cineweave_codex_license_profile",
    profileId: "license.production-fixture",
    version: 1,
    status: "verified",
    commercialUse: "allowed",
    validation: { noAssumedCommercialUse: true },
    evidence: [{ status: "verified" }]
  }, { kind: "cineweave_codex_license_profile", id: "license.production-fixture", version: 1, createdAt: timestamp });
  const capability = await putArtifact(project, {
    kind: "cineweave_codex_capability_profile",
    profileId: "capability.production-fixture",
    version: 1,
    status: "active",
    adapterId: "adapter.fixture-svg",
    capabilities: [{ capabilityId: "image_generation", support: "strong" }],
    licenseProfileRefs: [license.envelope.artifactRef],
    matchingPolicy: { hardRequirementPolicy: "block" }
  }, { kind: "cineweave_codex_capability_profile", id: "capability.production-fixture", version: 1, createdAt: timestamp });
  const descriptorPayload = createFixtureAdapterDescriptor({
    capabilityProfileRef: capability.envelope.artifactRef,
    licenseProfileRefs: [license.envelope.artifactRef],
    skillReceipt: skill,
    timestamp
  });
  descriptorPayload.operations = descriptorPayload.operations.map((operation) => ({ ...operation, maxInputs: 64 }));
  const descriptor = await putArtifact(project, descriptorPayload, {
    kind: "cineweave_adapter_descriptor",
    id: descriptorPayload.adapterId,
    version: 1,
    createdAt: timestamp
  });
  return { license, capability, descriptor };
}

async function storeFixturePngAdapter(project, skill) {
  const timestamp = "2026-08-24T13:10:00.000Z";
  const license = await putArtifact(project, {
    kind: "cineweave_codex_license_profile",
    profileId: "license.production-png-fixture",
    version: 1,
    status: "verified",
    commercialUse: "allowed",
    validation: { noAssumedCommercialUse: true },
    evidence: [{ status: "verified" }]
  }, { kind: "cineweave_codex_license_profile", id: "license.production-png-fixture", version: 1, createdAt: timestamp });
  const capability = await putArtifact(project, {
    kind: "cineweave_codex_capability_profile",
    profileId: "capability.production-png-fixture",
    version: 1,
    status: "active",
    adapterId: "adapter.fixture-png",
    capabilities: [{ capabilityId: "image_generation", support: "strong" }],
    licenseProfileRefs: [license.envelope.artifactRef],
    matchingPolicy: { hardRequirementPolicy: "block" }
  }, { kind: "cineweave_codex_capability_profile", id: "capability.production-png-fixture", version: 1, createdAt: timestamp });
  const entrypointId = "fixture.png.v1";
  const implementationContentHash = sha256Bytes(Buffer.from(entrypointId, "utf8"));
  const descriptorPayload = createFixtureAdapterDescriptor({
    capabilityProfileRef: capability.envelope.artifactRef,
    licenseProfileRefs: [license.envelope.artifactRef],
    skillReceipt: skill,
    timestamp
  });
  descriptorPayload.adapterId = "adapter.fixture-png";
  descriptorPayload.displayName = "Deterministic PNG fixture adapter";
  descriptorPayload.implementation = { distribution: "suite_test", entrypointId, contentHash: implementationContentHash };
  descriptorPayload.operations = descriptorPayload.operations.map((operation) => ({
    ...operation,
    operationId: "image.generate.png-fixture",
    outputMimeTypes: ["image/png"],
    maxInputs: 64
  }));
  const descriptor = await putArtifact(project, descriptorPayload, {
    kind: "cineweave_adapter_descriptor",
    id: descriptorPayload.adapterId,
    version: 1,
    createdAt: timestamp
  });
  const pngBytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const adapter = {
    entrypointId,
    implementationContentHash,
    async estimate() { return { amount: 0, currency: "USD" }; },
    async execute({ request }) {
      if (request.executionMode !== "fixture") throw new Error("The core PNG adapter accepts fixture mode only");
      return {
        providerRequestId: null,
        costAmount: 0,
        currency: "USD",
        outputs: [{
          filename: "output-01.png",
          mediaKind: "image",
          mimeType: "image/png",
          bytes: pngBytes,
          width: 1,
          height: 1,
          durationMs: null
        }]
      };
    }
  };
  return { license, capability, descriptor, adapter };
}

test("ProductionSlice compiles to a validated ExecutionRequest and fixture receipt", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-production-execution-"));
  const project = join(root, "project");
  t.after(() => rm(root, { recursive: true, force: true }));
  let { sliceRef, skill } = await createSliceAtStage(project, t, 4);
  const adapter = await storeFixtureAdapter(project, skill);
  const executionOptions = {
    adapterDescriptorRef: adapter.descriptor.envelope.artifactRef,
    capabilityProfileRef: adapter.capability.envelope.artifactRef,
    skillReceipt: skill,
    executionMode: "fixture",
    operationId: "image.generate.fixture",
    outputRequest: { mediaKind: "image", acceptedMimeTypes: ["image/svg+xml"], variantCount: 1 },
    budget: { currency: "USD", maxAmount: 0, maxAttempts: 1, maxWallSeconds: 30 },
    createdAt: "2026-08-24T13:10:00.000Z"
  };
  const blocked = await compileProductionExecutionRequest(project, sliceRef, executionOptions);
  assert.equal(blocked.ready, false);
  assert.equal(blocked.preflight.rightsResolved, false);
  const blockedReceipt = await executeProductionRequest(project, blocked.requestRef, createAdapterRegistry([fixtureSvgAdapter]));
  assert.equal(blockedReceipt.receipt.envelope.payload.status, "blocked");
  assert.equal(blockedReceipt.receipt.envelope.payload.failure.code, "request.not_ready");

  const rightsDecision = await recordProductionGateDecision(project, sliceRef, {
    gate: "rights",
    decision: "approve",
    actorId: "human.producer",
    rationale: "Rights are ready for the local execution bridge.",
    decidedAt: "2026-08-24T13:50:00.000Z"
  });
  const rightsActivated = await activateProductionStage(project, sliceRef, rightsDecision.decisionRef, { updatedAt: "2026-08-24T13:50:30.000Z" });
  sliceRef = rightsActivated.sliceRef;
  const compiled = await compileProductionExecutionRequest(project, sliceRef, executionOptions);
  assert.equal(compiled.ready, true);
  assert.equal(compiled.request.status, "ready");
  assert.equal(compiled.request.inputArtifactRefs.some((ref) => ref.kind === "world_os_production_slice"), true);
  const requestPath = join(project, "execution-request.json");
  await writeFile(requestPath, `${JSON.stringify(compiled.request)}\n`, "utf8");
  const requestSchema = join(repoRoot, "packages", "cineweave-contracts", "schemas", "execution-request.schema.json");
  assert.equal((await validateDocument(requestSchema, requestPath)).valid, true);
  const renderPlan = (await findArtifact(project, compiled.renderPlanRef)).envelope.payload;
  const renderPlanPath = join(project, "render-plan.json");
  await writeFile(renderPlanPath, `${JSON.stringify(renderPlan)}\n`, "utf8");
  const renderPlanSchema = join(repoRoot, "packages", "cineweave-contracts", "schemas", "render-plan.schema.json");
  assert.equal((await validateDocument(renderPlanSchema, renderPlanPath)).valid, true);

  const registry = createAdapterRegistry([fixtureSvgAdapter]);
  const executed = await executeProductionRequest(project, compiled.requestRef, registry);
  assert.equal(executed.receipt.envelope.payload.status, "succeeded");
  assert.equal(executed.receipt.envelope.payload.outputs.length, 1);
  assert.equal(executed.receipt.envelope.payload.executionMode, "fixture");
  await assert.rejects(
    () => createProductionMediaImport(project, compiled.requestRef, executed.receipt.envelope.artifactRef),
    /not an importable PNG\/JPEG\/WebP image/
  );
  const verified = await verifyProductionExecutionRequest(project, compiled.requestRef);
  assert.equal(verified.executionEligible, true);

  const repeated = await compileProductionExecutionRequest(project, sliceRef, {
    adapterDescriptorRef: adapter.descriptor.envelope.artifactRef,
    capabilityProfileRef: adapter.capability.envelope.artifactRef,
    skillReceipt: skill,
    executionMode: "fixture",
    operationId: "image.generate.fixture",
    outputRequest: { mediaKind: "image", acceptedMimeTypes: ["image/svg+xml"], variantCount: 1 },
    budget: { currency: "USD", maxAmount: 0, maxAttempts: 1, maxWallSeconds: 30 },
    createdAt: "2026-08-24T13:10:00.000Z"
  });
  assert.equal(repeated.idempotent, true);
  assert.deepEqual(repeated.requestRef, compiled.requestRef);

  const qaDecision = await recordProductionGateDecision(project, sliceRef, {
    gate: "qa",
    decision: "approve",
    actorId: "human.qa",
    rationale: "Advance the slice after the execution request was compiled.",
    decidedAt: "2026-08-24T14:00:00.000Z"
  });
  await activateProductionStage(project, sliceRef, qaDecision.decisionRef, { updatedAt: "2026-08-24T14:00:30.000Z" });
  await assert.rejects(() => verifyProductionExecutionRequest(project, compiled.requestRef), /stale ProductionSlice/);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.productionExecutionRequests, 2);
  assert.equal(audit.summary.productionExecutionReceipts, 2);
  assert.equal((await verifyProject(project)).valid, true);
});

test("successful image ExecutionReceipt binds to a verified draft MediaImport and QA evidence", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-production-media-"));
  const project = join(root, "project");
  t.after(() => rm(root, { recursive: true, force: true }));
  let { sliceRef, skill } = await createSliceAtStage(project, t, 4);
  const adapter = await storeFixturePngAdapter(project, skill);
  const options = {
    adapterDescriptorRef: adapter.descriptor.envelope.artifactRef,
    capabilityProfileRef: adapter.capability.envelope.artifactRef,
    skillReceipt: skill,
    executionMode: "fixture",
    operationId: "image.generate.png-fixture",
    outputRequest: { mediaKind: "image", acceptedMimeTypes: ["image/png"], variantCount: 1 },
    budget: { currency: "USD", maxAmount: 0, maxAttempts: 1, maxWallSeconds: 30 },
    createdAt: "2026-08-24T13:10:00.000Z"
  };
  const rights = await recordProductionGateDecision(project, sliceRef, {
    gate: "rights",
    decision: "approve",
    actorId: "human.producer",
    rationale: "Rights are ready for the PNG callback test.",
    decidedAt: "2026-08-24T13:50:00.000Z"
  });
  sliceRef = (await activateProductionStage(project, sliceRef, rights.decisionRef, { updatedAt: "2026-08-24T13:50:30.000Z" })).sliceRef;
  const compiled = await compileProductionExecutionRequest(project, sliceRef, options);
  assert.equal(compiled.ready, true);
  const executed = await executeProductionRequest(project, compiled.requestRef, createAdapterRegistry([adapter.adapter]));
  assert.equal(executed.receipt.envelope.payload.status, "succeeded");
  const callback = await createProductionMediaImport(project, compiled.requestRef, executed.receipt.envelope.artifactRef);
  assert.equal(callback.mediaImport.status, "draft");
  assert.equal(callback.mediaImport.media[0].format, "png");
  const verified = await verifyProductionMediaImport(project, callback.bindingRef);
  assert.deepEqual(verified.bindingRef, callback.bindingRef);
  assert.equal(verified.mediaImport.media[0].contentHash, executed.receipt.envelope.payload.outputs[0].contentHash);

  const mediaPath = join(project, "media-import.json");
  await writeFile(mediaPath, `${JSON.stringify(callback.mediaImport)}\n`, "utf8");
  const mediaSchema = join(repoRoot, "packages", "cineweave-contracts", "schemas", "media-import.schema.json");
  assert.equal((await validateDocument(mediaSchema, mediaPath)).valid, true);

  const qaReview = await createProductionQaReview(project, sliceRef, {
    decision: "approve",
    actorId: "human.qa",
    mediaBindingRefs: [callback.bindingRef],
    checklist: {
      identityConsistent: true,
      geographyConsistent: true,
      styleConsistent: true,
      rightsConsistent: true,
      technicalValid: true,
      continuityValid: true
    },
    rationale: "Verified draft MediaImport is technically and narratively consistent.",
    decidedAt: "2026-08-24T14:00:00.000Z"
  });
  await assert.rejects(() => createApprovedAsset(project, sliceRef, qaReview.reviewRef), /approved_asset/);
  const qa = await recordProductionGateDecision(project, sliceRef, {
    gate: "qa",
    decision: "approve",
    actorId: "human.qa",
    rationale: "The exact human QA review is attached as evidence.",
    evidenceRefs: [qaReview.reviewRef],
    decidedAt: "2026-08-24T14:00:00.000Z"
  });
  const approvedSlice = await activateProductionStage(project, sliceRef, qa.decisionRef, { updatedAt: "2026-08-24T14:00:30.000Z" });
  const approvedAsset = await createApprovedAsset(project, approvedSlice.sliceRef, qaReview.reviewRef);
  await assert.rejects(() => createPrivateReleaseReceipt(project, approvedSlice.sliceRef, [approvedAsset.approvedAssetRef], { actorId: "human.release" }), /released/);
  const release = await recordProductionGateDecision(project, approvedSlice.sliceRef, {
    gate: "release",
    decision: "approve",
    actorId: "human.release",
    rationale: "Release the approved asset package into the private workspace.",
    evidenceRefs: [approvedAsset.approvedAssetRef],
    decidedAt: "2026-08-24T14:10:00.000Z"
  });
  const releasedSlice = await activateProductionStage(project, approvedSlice.sliceRef, release.decisionRef, { updatedAt: "2026-08-24T14:10:30.000Z" });
  const privateRelease = await createPrivateReleaseReceipt(project, releasedSlice.sliceRef, [approvedAsset.approvedAssetRef], {
    actorId: "human.release",
    releasedAt: "2026-08-24T14:10:30.000Z"
  });
  const verifiedRelease = await verifyPrivateReleaseReceipt(project, privateRelease.releaseReceiptRef);
  assert.equal(verifiedRelease.receipt.public, false);
  assert.equal(verifiedRelease.receipt.visibility, "private_workspace");
  const qaReviewPath = join(project, "qa-review.json");
  const approvedAssetPath = join(project, "approved-asset.json");
  const releaseReceiptPath = join(project, "private-release.json");
  await writeFile(qaReviewPath, `${JSON.stringify(qaReview.review)}\n`, "utf8");
  await writeFile(approvedAssetPath, `${JSON.stringify(approvedAsset.asset)}\n`, "utf8");
  await writeFile(releaseReceiptPath, `${JSON.stringify(privateRelease.receipt)}\n`, "utf8");
  assert.equal((await validateDocument(join(repoRoot, "examples", "multi-world-studio", "schemas", "world-production-qa-review.schema.json"), qaReviewPath)).valid, true);
  assert.equal((await validateDocument(join(repoRoot, "examples", "multi-world-studio", "schemas", "world-approved-asset.schema.json"), approvedAssetPath)).valid, true);
  assert.equal((await validateDocument(join(repoRoot, "examples", "multi-world-studio", "schemas", "world-release-receipt.schema.json"), releaseReceiptPath)).valid, true);
  const audit = await auditWorldOsProject(project);
  assert.equal(audit.summary.productionMediaImports, 1);
  assert.equal(audit.summary.productionQaReviews, 1);
  assert.equal(audit.summary.approvedAssets, 1);
  assert.equal(audit.summary.releaseReceipts, 1);
  assert.equal((await verifyProject(project)).valid, true);
});
