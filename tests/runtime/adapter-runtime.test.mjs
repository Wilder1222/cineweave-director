import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  AdapterExecutionError,
  createAdapterRegistry,
  executeRequest
} from "../../packages/cineweave-runtime/src/adapter-runtime.mjs";
import {
  findArtifact,
  initProject,
  putArtifact,
  recordApproval,
  verifyProject
} from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { sha256Bytes } from "../../packages/cineweave-runtime/src/canonical-json.mjs";
import {
  createFixtureAdapterDescriptor,
  fixtureSvgAdapter
} from "../../packages/cineweave-runtime/src/fixture-svg-adapter.mjs";
import { validateDocument } from "../../scripts/validate-output.mjs";

const fixedHash = (character) => `sha256:${character.repeat(64)}`;

function skillReceipt(timestamp) {
  return {
    repository: "https://github.com/Wilder1222/cineweave-studio",
    ref: "v2.5.0",
    commit: "0123456789abcdef0123456789abcdef01234567",
    contentHash: fixedHash("a"),
    installedBy: "codex-environment",
    usedAt: timestamp
  };
}

function provenance(timestamp, message) {
  return { source: "codex_authored", createdAt: timestamp, updatedAt: timestamp, changeLog: [message] };
}

function advancingClock(start = "2026-08-21T11:00:00.000Z") {
  let value = Date.parse(start);
  return () => {
    const current = new Date(value);
    value += 10;
    return current;
  };
}

async function storeCommonArtifacts(root, options = {}) {
  const timestamp = "2026-08-21T10:00:00.000Z";
  const adapterId = options.adapterId || "adapter.fixture-svg";
  const license = await putArtifact(root, { kind: "cineweave_codex_license_profile", status: "verified" }, { kind: "cineweave_codex_license_profile", id: `license.${adapterId}`, version: 1, createdAt: timestamp });
  const capability = await putArtifact(root, { kind: "cineweave_codex_capability_profile", adapterId }, { kind: "cineweave_codex_capability_profile", id: `capability.${adapterId}`, version: 1, createdAt: timestamp });
  const render = await putArtifact(root, { kind: "cineweave_codex_render_plan", mode: "generate" }, { kind: "cineweave_codex_render_plan", id: `render.${adapterId}`, version: 1, createdAt: timestamp });
  const prompt = await putArtifact(root, { kind: "cineweave_codex_prompt_record", text: "observable fixture" }, { kind: "cineweave_codex_prompt_record", id: `prompt.${adapterId}`, version: 1, createdAt: timestamp });
  return { timestamp, adapterId, license, capability, render, prompt };
}

function makeRequest(common, descriptorRef, options = {}) {
  const executionMode = options.executionMode || "fixture";
  const requestId = options.requestId || "execution.fixture-test";
  return {
    kind: "cineweave_execution_request",
    contractVersion: "2.3.0",
    requestId,
    version: 1,
    status: "ready",
    createdAt: common.timestamp,
    skillReceipt: skillReceipt(common.timestamp),
    adapterDescriptorRef: descriptorRef,
    capabilityProfileRef: common.capability.envelope.artifactRef,
    renderPlanRef: common.render.envelope.artifactRef,
    promptRef: common.prompt.envelope.artifactRef,
    operationId: options.operationId || "image.generate.fixture",
    executionMode,
    idempotencyKey: options.idempotencyKey || `fixture:${requestId}:0001`,
    inputArtifactRefs: [],
    observationIds: [],
    parameters: [{ name: "label", value: options.label || "Runtime fixture", sensitive: false }],
    outputRequest: { mediaKind: "image", acceptedMimeTypes: ["image/svg+xml"], variantCount: options.variantCount || 1, destinationPolicy: "project_execution_store" },
    budget: { currency: "USD", maxAmount: options.maxAmount ?? 0, maxAttempts: options.maxAttempts || 1, maxWallSeconds: 30, unknownCostAction: "block" },
    authorization: executionMode === "external"
      ? { externalEffects: "exact_request_approval_required", approvalScope: "exact_execution_request" }
      : { externalEffects: "denied", approvalScope: "none" },
    preflight: { status: "ready", exactRefsResolved: true, operationSupported: true, hardCapabilitiesSatisfied: true, rightsResolved: true, budgetResolved: true, secretsAbsent: true },
    provenance: provenance(common.timestamp, "v1: runtime test request")
  };
}

function makeFixtureWorkflowTemplateProfile(common) {
  return {
    kind: "cineweave_codex_workflow_template_profile",
    contractVersion: "1.0.0",
    templateProfileId: "template.fixture-svg.v1",
    title: "Deterministic SVG fixture workflow template",
    version: 1,
    status: "active",
    adapterId: common.adapterId,
    operationId: "image.generate.fixture",
    executionSurface: "generic_graph",
    templateIdentity: {
      format: "generic_json",
      templateId: "template.fixture-svg.v1",
      templateRevision: "1",
      contentHash: fixedHash("f"),
      nativeSchemaVersion: "fixture-graph-v1",
      serializable: true,
      reverifyBeforeExecution: false
    },
    inputSlots: [],
    outputSlots: [{
      slotId: "image",
      mediaKind: "image",
      acceptedMimeTypes: ["image/svg+xml"],
      purpose: "Deterministic local fixture output."
    }],
    dependencyLocks: [{
      dependencyId: "runtime.fixture-svg",
      dependencyKind: "runtime",
      version: "1.0.0",
      contentHash: fixtureSvgAdapter.implementationContentHash,
      status: "pinned",
      purpose: "Trusted deterministic fixture adapter implementation."
    }],
    licenseProfileRefs: [common.license.envelope.artifactRef],
    knownLimits: ["Fixture profile produces only deterministic local SVG output."],
    validation: {
      templateIdentityPinned: true,
      inputSlotIdsUnique: true,
      outputSlotIdsUnique: true,
      dependenciesDeclared: true,
      licensesLinked: true,
      noEndpointOrCredentials: true
    },
    provenance: provenance(common.timestamp, "v1: bind fixture execution to an exact serialized template"),
    skillReceipt: skillReceipt(common.timestamp)
  };
}

async function storeFixtureExecution(root, options = {}) {
  await initProject(root, { projectId: options.projectId || "project.adapter-runtime", name: "Adapter Runtime", createdAt: "2026-08-21T10:00:00.000Z" });
  const common = await storeCommonArtifacts(root, options);
  const descriptorPayload = options.descriptor || createFixtureAdapterDescriptor({
    capabilityProfileRef: common.capability.envelope.artifactRef,
    licenseProfileRefs: [common.license.envelope.artifactRef],
    skillReceipt: skillReceipt(common.timestamp),
    timestamp: common.timestamp
  });
  const descriptor = await putArtifact(root, descriptorPayload, { kind: "cineweave_adapter_descriptor", id: descriptorPayload.adapterId, version: 1, createdAt: common.timestamp });
  const requestPayload = makeRequest(common, descriptor.envelope.artifactRef, options);
  const request = await putArtifact(root, requestPayload, { kind: "cineweave_execution_request", id: requestPayload.requestId, version: 1, createdAt: common.timestamp });
  return { common, descriptor, request, requestPayload };
}

test("fixture execution is deterministic, idempotent and byte-verifiable", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-fixture-"));
  try {
    const stored = await storeFixtureExecution(root);
    const registry = createAdapterRegistry([fixtureSvgAdapter]);
    const first = await executeRequest(root, stored.request.envelope.artifactRef, registry, { now: advancingClock() });
    assert.equal(first.envelope.payload.status, "succeeded");
    assert.equal(first.envelope.payload.outputs.length, 1);
    assert.equal(first.envelope.payload.outputs[0].mimeType, "image/svg+xml");
    const outputPath = resolve(root, ".cineweave", first.envelope.payload.outputs[0].storageRef);
    const bytes = await readFile(outputPath);
    assert.equal(sha256Bytes(bytes), first.envelope.payload.outputs[0].contentHash);

    const second = await executeRequest(root, stored.request.envelope.artifactRef, registry, { now: advancingClock("2026-08-21T12:00:00.000Z") });
    assert.equal(second.path, first.path);
    assert.equal(second.envelope.artifactRef.contentHash, first.envelope.artifactRef.contentHash);

    const receiptPath = join(root, "receipt.json");
    await writeFile(receiptPath, JSON.stringify(first.envelope.payload, null, 2), "utf8");
    const schema = join(process.cwd(), "packages", "cineweave-contracts", "schemas", "execution-receipt.schema.json");
    assert.equal((await validateDocument(schema, receiptPath)).valid, true);
    assert.equal((await verifyProject(root)).valid, true);

    await writeFile(outputPath, Buffer.from("tampered", "utf8"));
    const tampered = await verifyProject(root);
    assert.equal(tampered.valid, false);
    assert.match(tampered.errors.join("\n"), /Execution output (hash|byte length) mismatch/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("workflow template bindings lock an execution to the active graph profile and content hash", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-template-"));
  try {
    await initProject(root, { projectId: "project.adapter-template", name: "Adapter Template", createdAt: "2026-08-21T10:00:00.000Z" });
    const common = await storeCommonArtifacts(root);
    const descriptorPayload = createFixtureAdapterDescriptor({
      capabilityProfileRef: common.capability.envelope.artifactRef,
      licenseProfileRefs: [common.license.envelope.artifactRef],
      skillReceipt: skillReceipt(common.timestamp),
      timestamp: common.timestamp
    });
    const descriptor = await putArtifact(root, descriptorPayload, { kind: "cineweave_adapter_descriptor", id: descriptorPayload.adapterId, version: 1, createdAt: common.timestamp });
    const templatePayload = makeFixtureWorkflowTemplateProfile(common);
    const templatePath = join(root, "workflow-template-profile.json");
    await writeFile(templatePath, JSON.stringify(templatePayload, null, 2), "utf8");
    const templateSchema = join(process.cwd(), "packages", "cineweave-contracts", "schemas", "workflow-template-profile.schema.json");
    assert.equal((await validateDocument(templateSchema, templatePath)).valid, true);
    const template = await putArtifact(root, templatePayload, { kind: templatePayload.kind, id: templatePayload.templateProfileId, version: 1, createdAt: common.timestamp });

    const requestPayload = makeRequest(common, descriptor.envelope.artifactRef, { requestId: "execution.fixture-template", idempotencyKey: "fixture:template:0001" });
    requestPayload.workflowTemplateBinding = {
      templateProfileRef: template.envelope.artifactRef,
      mode: "serialized",
      templateContentHash: templatePayload.templateIdentity.contentHash,
      inputBindings: [],
      outputSlotId: "image"
    };
    requestPayload.preflight.workflowTemplateResolved = true;
    const request = await putArtifact(root, requestPayload, { kind: requestPayload.kind, id: requestPayload.requestId, version: 1, createdAt: common.timestamp });
    const registry = createAdapterRegistry([fixtureSvgAdapter]);
    const success = await executeRequest(root, request.envelope.artifactRef, registry, { now: advancingClock() });
    assert.equal(success.envelope.payload.status, "succeeded");

    const mismatch = {
      ...requestPayload,
      requestId: "execution.fixture-template-mismatch",
      idempotencyKey: "fixture:template:0002",
      workflowTemplateBinding: { ...requestPayload.workflowTemplateBinding, templateContentHash: fixedHash("e") }
    };
    const mismatchedRequest = await putArtifact(root, mismatch, { kind: mismatch.kind, id: mismatch.requestId, version: 1, createdAt: common.timestamp });
    const blocked = await executeRequest(root, mismatchedRequest.envelope.artifactRef, registry, { now: advancingClock() });
    assert.equal(blocked.envelope.payload.status, "blocked");
    assert.equal(blocked.envelope.payload.failure.code, "template.content_hash");
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("one idempotency key cannot bind two exact requests", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-idempotency-"));
  try {
    const stored = await storeFixtureExecution(root, { idempotencyKey: "fixture:shared-key:0001" });
    const registry = createAdapterRegistry([fixtureSvgAdapter]);
    await executeRequest(root, stored.request.envelope.artifactRef, registry, { now: advancingClock() });
    const otherPayload = { ...stored.requestPayload, requestId: "execution.fixture-other" };
    const other = await putArtifact(root, otherPayload, { kind: "cineweave_execution_request", id: otherPayload.requestId, version: 1, createdAt: stored.common.timestamp });
    await assert.rejects(() => executeRequest(root, other.envelope.artifactRef, registry, { now: advancingClock() }), /already bound to a different exact ExecutionRequest/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("external execution requires exact request approval and explicit caller enablement", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-external-"));
  try {
    await initProject(root, { projectId: "project.adapter-external", createdAt: "2026-08-21T10:00:00.000Z" });
    const common = await storeCommonArtifacts(root, { adapterId: "adapter.test-external" });
    const implementationContentHash = sha256Bytes(Buffer.from("test.external.v1", "utf8"));
    const descriptorPayload = createFixtureAdapterDescriptor({ capabilityProfileRef: common.capability.envelope.artifactRef, licenseProfileRefs: [common.license.envelope.artifactRef], skillReceipt: skillReceipt(common.timestamp), timestamp: common.timestamp });
    Object.assign(descriptorPayload, {
      adapterId: common.adapterId,
      adapterClass: "image_generation",
      implementation: { distribution: "plugin_extension", entrypointId: "test.external.v1", contentHash: implementationContentHash },
      executionModes: ["external"],
      operations: [{ ...descriptorPayload.operations[0], operationId: "image.generate.external" }],
      security: { ...descriptorPayload.security, networkAccess: "external_mode_only", networkPolicyId: "network.test-provider", credentialEnvVars: ["TEST_PROVIDER_API_KEY"] }
    });
    const descriptor = await putArtifact(root, descriptorPayload, { kind: "cineweave_adapter_descriptor", id: descriptorPayload.adapterId, version: 1, createdAt: common.timestamp });
    const requestPayload = makeRequest(common, descriptor.envelope.artifactRef, { requestId: "execution.external-test", executionMode: "external", operationId: "image.generate.external", idempotencyKey: "external:test:0001" });
    const request = await putArtifact(root, requestPayload, { kind: "cineweave_execution_request", id: requestPayload.requestId, version: 1, createdAt: common.timestamp });
    let calls = 0;
    const adapter = {
      entrypointId: "test.external.v1",
      implementationContentHash,
      async estimate() { return { amount: 0, currency: "USD" }; },
      async execute() {
        calls += 1;
        return { providerRequestId: "provider_job_001", costAmount: 0, currency: "USD", outputs: [{ filename: "external.svg", mediaKind: "image", mimeType: "image/svg+xml", bytes: Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"), width: 1, height: 1, durationMs: null }] };
      }
    };
    const registry = createAdapterRegistry([adapter]);

    const missing = await executeRequest(root, request.envelope.artifactRef, registry, { allowExternal: true, now: advancingClock() });
    assert.equal(missing.envelope.payload.status, "blocked");
    assert.equal(missing.envelope.payload.failure.code, "approval.missing");
    assert.equal(calls, 0);

    await recordApproval(root, common.render.envelope.artifactRef, { decision: "approved", actor: "tester", decidedAt: "2026-08-21T10:10:00.000Z", rationale: "Wrong artifact on purpose." });
    const wrongApproval = await executeRequest(root, request.envelope.artifactRef, registry, { allowExternal: true, now: advancingClock() });
    assert.equal(wrongApproval.envelope.payload.failure.code, "approval.missing");
    assert.equal(calls, 0);

    await recordApproval(root, request.envelope.artifactRef, { decision: "approved", actor: "tester", decidedAt: "2026-08-21T10:11:00.000Z", rationale: "Exact execution request approved." });
    const callerDenied = await executeRequest(root, request.envelope.artifactRef, registry, { allowExternal: false, now: advancingClock() });
    assert.equal(callerDenied.envelope.payload.failure.code, "external.disabled");
    assert.equal(calls, 0);

    const success = await executeRequest(root, request.envelope.artifactRef, registry, { allowExternal: true, now: advancingClock() });
    assert.equal(success.envelope.payload.status, "succeeded");
    assert.equal(success.envelope.payload.authorizationEvidence.decision, "approved");
    assert.equal(calls, 1);
    const replay = await executeRequest(root, request.envelope.artifactRef, registry, { allowExternal: true, now: advancingClock() });
    assert.equal(replay.path, success.path);
    assert.equal(calls, 1);
    assert.equal((await verifyProject(root)).valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("retry receipt accounts for every failed and successful attempt", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-retry-"));
  try {
    await initProject(root, { projectId: "project.adapter-retry", createdAt: "2026-08-21T10:00:00.000Z" });
    const common = await storeCommonArtifacts(root, { adapterId: "adapter.test-retry" });
    const implementationContentHash = sha256Bytes(Buffer.from("test.retry.v1", "utf8"));
    const descriptorPayload = createFixtureAdapterDescriptor({ capabilityProfileRef: common.capability.envelope.artifactRef, licenseProfileRefs: [common.license.envelope.artifactRef], skillReceipt: skillReceipt(common.timestamp), timestamp: common.timestamp });
    Object.assign(descriptorPayload, {
      adapterId: common.adapterId,
      implementation: { distribution: "plugin_extension", entrypointId: "test.retry.v1", contentHash: implementationContentHash },
      operations: [{ ...descriptorPayload.operations[0], operationId: "image.generate.retry-test" }]
    });
    const descriptor = await putArtifact(root, descriptorPayload, { kind: "cineweave_adapter_descriptor", id: descriptorPayload.adapterId, version: 1, createdAt: common.timestamp });
    const requestPayload = makeRequest(common, descriptor.envelope.artifactRef, { requestId: "execution.retry-test", operationId: "image.generate.retry-test", idempotencyKey: "fixture:retry:0001", maxAmount: 1, maxAttempts: 2 });
    const request = await putArtifact(root, requestPayload, { kind: "cineweave_execution_request", id: requestPayload.requestId, version: 1, createdAt: common.timestamp });
    let calls = 0;
    const adapter = {
      entrypointId: "test.retry.v1",
      implementationContentHash,
      async estimate() { return { amount: 0.3, currency: "USD" }; },
      async execute() {
        calls += 1;
        if (calls === 1) throw new AdapterExecutionError("Transient test failure", { code: "provider.transient", retryable: true, costAmount: 0.1, currency: "USD", providerRequestId: "job_retry_01" });
        return { providerRequestId: "job_retry_02", costAmount: 0.2, currency: "USD", outputs: [{ filename: "retry.svg", mediaKind: "image", mimeType: "image/svg+xml", bytes: "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>", width: 1, height: 1, durationMs: null }] };
      }
    };
    const result = await executeRequest(root, request.envelope.artifactRef, createAdapterRegistry([adapter]), { now: advancingClock() });
    assert.equal(result.envelope.payload.status, "succeeded");
    assert.deepEqual(result.envelope.payload.attempts.map((item) => item.status), ["failed", "succeeded"]);
    assert.equal(result.envelope.payload.attempts[0].retryReason, "provider.transient");
    assert.equal(result.envelope.payload.costSummary.actualAmount, 0.30000000000000004);
    assert.equal(result.envelope.payload.costSummary.includesAllAttempts, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("malformed requests fail before an incomplete receipt can be persisted", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-adapter-malformed-"));
  try {
    await initProject(root, { projectId: "project.adapter-malformed", createdAt: "2026-08-21T10:00:00.000Z" });
    const request = await putArtifact(root, { kind: "cineweave_execution_request" }, { kind: "cineweave_execution_request", id: "execution.malformed", version: 1 });
    await assert.rejects(
      () => executeRequest(root, request.envelope.artifactRef, createAdapterRegistry([fixtureSvgAdapter])),
      /cannot produce an auditable receipt/
    );
    assert.equal((await verifyProject(root)).artifacts, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});
