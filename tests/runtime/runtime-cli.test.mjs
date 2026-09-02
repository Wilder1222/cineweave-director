import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { initProject, putArtifact, recordApproval } from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";

const cli = resolve("packages/cineweave-runtime/bin/cineweave.mjs");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
}

test("runtime CLI exposes graph, stale, gate and verified bundle transfer", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "cineweave-runtime-cli-"));
  try {
    const source = join(sandbox, "source");
    const bundle = join(sandbox, "bundle");
    const target = join(sandbox, "target");
    await initProject(source, { projectId: "project.runtime-cli", createdAt: "2026-08-21T10:00:00.000Z" });
    const artifact = await putArtifact(source, { kind: "example_contract", value: 1 }, { id: "artifact.runtime-cli", version: 1, createdAt: "2026-08-21T10:00:00.000Z" });

    const graph = run(["graph", source]);
    assert.equal(graph.status, 0, graph.stderr);
    assert.equal(JSON.parse(graph.stdout).summary.artifactCount, 1);
    const stale = run(["stale", source]);
    assert.equal(stale.status, 0, stale.stderr);
    assert.equal(JSON.parse(stale.stdout).staleReferenceCount, 0);

    const blocked = run(["gate", source, artifact.path]);
    assert.equal(blocked.status, 3, blocked.stderr);
    assert.equal(JSON.parse(blocked.stdout).gate.allowed, false);
    await recordApproval(source, artifact.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: "2026-08-21T10:01:00.000Z" });
    const allowed = run(["gate", source, artifact.path]);
    assert.equal(allowed.status, 0, allowed.stderr);
    assert.equal(JSON.parse(allowed.stdout).gate.allowed, true);

    const referencePath = join(sandbox, "reference.png");
    await writeFile(referencePath, png);
    const ingested = run(["reference-ingest", source, referencePath]);
    assert.equal(ingested.status, 0, ingested.stderr);
    const ingestedBody = JSON.parse(ingested.stdout);
    assert.equal(ingestedBody.envelope.payload.kind, "cineweave_codex_reference_asset");
    assert.equal(ingestedBody.envelope.payload.rights.status, "unknown");
    const listed = run(["list", source]);
    assert.equal(listed.status, 0, listed.stderr);
    const referenceEnvelope = JSON.parse(listed.stdout).find((item) => item.artifactRef.kind === "cineweave_codex_reference_asset");
    assert(referenceEnvelope?.path);
    const referenceVerified = run(["reference-verify", source, referenceEnvelope.path]);
    assert.equal(referenceVerified.status, 0, referenceVerified.stderr);
    assert.equal(JSON.parse(referenceVerified.stdout).verification.valid, true);

    const exported = run(["export", source, bundle]);
    assert.equal(exported.status, 0, exported.stderr);
    const verified = run(["bundle-verify", bundle]);
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(JSON.parse(verified.stdout).valid, true);
    const imported = run(["import", bundle, target]);
    assert.equal(imported.status, 0, imported.stderr);
    assert.equal(JSON.parse(imported.stdout).verification.valid, true);
  } finally { await rm(sandbox, { recursive: true, force: true }); }
});

test("runtime CLI exposes Atomic Cinematic Skill discovery and read-only Shot Compiler", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "cineweave-runtime-compiler-cli-"));
  try {
    const manifest = JSON.parse(await readFile(resolve("packages/cineweave-contracts/examples/cinematic-skill-manifest.json"), "utf8"));
    const examplePlan = JSON.parse(await readFile(resolve("packages/cineweave-contracts/examples/shot-compiler-plan.json"), "utf8"));
    const manifestPath = join(sandbox, "manifest.json");
    const invocationPath = join(sandbox, "invocation.json");
    await writeFile(manifestPath, JSON.stringify(manifest));
    await writeFile(invocationPath, JSON.stringify({
      cinematicSkillManifestRef: examplePlan.cinematicSkillManifestRef,
      skillId: examplePlan.skillSelection.skillId,
      skillVersion: examplePlan.skillSelection.version,
      intent: examplePlan.intent,
      parameterValues: examplePlan.parameterValues,
      bindings: examplePlan.resolvedBindings,
      upstreamRefs: examplePlan.upstreamRefs,
      createdAt: "2026-09-02T04:05:00.000Z"
    }));

    const listed = run(["cinematic-skills", manifestPath]);
    assert.equal(listed.status, 0, listed.stderr);
    const skills = JSON.parse(listed.stdout);
    assert.equal(skills.length, 12);
    assert.equal(skills.find((skill) => skill.skillId === "slow-push-reaction")?.version, 1);

    const compiled = run(["shot-compile", manifestPath, invocationPath]);
    assert.equal(compiled.status, 0, compiled.stderr);
    const plan = JSON.parse(compiled.stdout);
    assert.equal(plan.kind, "cineweave_codex_shot_compiler_plan");
    assert.equal(plan.skillSelection.skillId, "slow-push-reaction");
    assert.equal(plan.controlSurface.projectionOnly, true);
    assert.equal(plan.executionBoundary.executesAdapter, false);
    assert.equal(plan.handoffs.every((handoff) => handoff.status === "planned"), true);
  } finally { await rm(sandbox, { recursive: true, force: true }); }
});

test("runtime CLI exposes explainable capability resolution and execution preview", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "cineweave-runtime-preview-cli-"));
  try {
    const capability = JSON.parse(await readFile(resolve("packages/cineweave-contracts/examples/capability-profile.json"), "utf8"));
    capability.profileId = "capability.cli-fixture";
    capability.adapterId = "adapter.cli-fixture";
    const adapter = JSON.parse(await readFile(resolve("packages/cineweave-contracts/examples/adapter-descriptor.json"), "utf8"));
    adapter.adapterId = capability.adapterId;
    const capabilityRef = { kind: capability.kind, id: capability.profileId, version: capability.version, contentHash: sha256Canonical(capability) };
    adapter.capabilityProfileRef = capabilityRef;
    const adapterRef = { kind: adapter.kind, id: adapter.adapterId, version: 1, contentHash: sha256Canonical(adapter) };
    const request = JSON.parse(await readFile(resolve("packages/cineweave-contracts/examples/execution-request.json"), "utf8"));
    request.requestId = "execution.cli-preview";
    request.executionMode = "fixture";
    request.adapterDescriptorRef = adapterRef;
    request.capabilityProfileRef = capabilityRef;
    request.authorization = { externalEffects: "denied", approvalScope: "none" };
    request.preflight = { status: "ready", exactRefsResolved: true, operationSupported: true, hardCapabilitiesSatisfied: true, rightsResolved: true, budgetResolved: true, secretsAbsent: true };
    const requestRef = { kind: request.kind, id: request.requestId, version: request.version, contentHash: sha256Canonical(request) };
    const requestInput = join(sandbox, "request.json");
    const resolutionRequestInput = join(sandbox, "resolution-request.json");
    const candidatesInput = join(sandbox, "candidates.json");
    const capabilityInput = join(sandbox, "capability.json");
    const adapterInput = join(sandbox, "adapter.json");
    await writeFile(requestInput, JSON.stringify(request));
    await writeFile(resolutionRequestInput, JSON.stringify({
      operationId: request.operationId,
      renderMode: "generate",
      executionMode: request.executionMode,
      mediaKind: request.outputRequest.mediaKind,
      inputCount: request.inputArtifactRefs.length,
      outputCount: request.outputRequest.variantCount,
      acceptedMimeTypes: request.outputRequest.acceptedMimeTypes,
      requirements: [{ requirementId: "requirement.image", capabilityId: "image_generation", level: "hard", reason: "The fixture must generate an image." }]
    }));
    await writeFile(capabilityInput, JSON.stringify(capability));
    await writeFile(adapterInput, JSON.stringify(adapter));
    await writeFile(candidatesInput, JSON.stringify([{
      candidateId: "candidate.cli-fixture",
      capabilityProfileRef: capabilityRef,
      capabilityProfile: capability,
      adapterDescriptorRef: adapterRef,
      adapterDescriptor: adapter
    }]));

    const resolved = run(["capability-resolve", resolutionRequestInput, candidatesInput, "--created-at", "2026-09-02T06:20:00.000Z"]);
    assert.equal(resolved.status, 0, resolved.stderr);
    const resolution = JSON.parse(resolved.stdout);
    assert.equal(resolution.status, "selected");
    assert.equal(resolution.selection.selectedCandidateId, "candidate.cli-fixture");
    const resolutionInput = join(sandbox, "resolution.json");
    await writeFile(resolutionInput, JSON.stringify(resolution));

    const preview = run(["execution-preview", requestInput, resolutionInput, adapterInput, capabilityInput, "--estimated-amount", "0"]);
    assert.equal(preview.status, 0, preview.stderr);
    const previewBody = JSON.parse(preview.stdout);
    assert.equal(previewBody.executionRequestRef.contentHash, requestRef.contentHash);
    assert.equal(previewBody.status, "ready");
    assert.equal(previewBody.approval.status, "pending");
  } finally { await rm(sandbox, { recursive: true, force: true }); }
});
