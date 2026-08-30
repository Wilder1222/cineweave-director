import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findArtifact, listArtifacts, putArtifact } from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { createFixtureProposalProvider } from "../../packages/cineweave-world-os/src/providers.mjs";
import { exactRef, readJson } from "../../packages/cineweave-world-os/src/json.mjs";
import { rebuildSeedStore, runEventProposal } from "../../packages/cineweave-world-os/src/store.mjs";
import { createLocalFixtureResponse, listOutbox, recordPublishReceipt } from "../../packages/cineweave-world-os/src/outbox.mjs";
import { CODEX_BRAIN_HTTP_ROUTES, createCodexBrainHttpServer } from "../../packages/cineweave-world-os/src/http-api.mjs";
import createHttpShadowProfiles from "../../examples/multi-world-studio/providers/http-shadow-profiles.example.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const seedManifestPath = join(repoRoot, "examples", "multi-world-studio", "seed-manifest.json");
const proposalPath = join(repoRoot, "examples", "multi-world-studio", "events", "event.w01.rain-night-incense.json");
const platformPath = join(repoRoot, "examples", "multi-world-studio", "platforms", "studio-platform.json");

function baseUrl(address) {
  const host = address.address.includes(":") ? `[${address.address}]` : address.address;
  return `http://${host}:${address.port}`;
}

async function jsonResponse(response) {
  return { status: response.status, body: await response.json() };
}

test("HTTP Brain control surface serializes runs, exposes exact receipts and rejects remote connectors", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-brain-http-"));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const service = createCodexBrainHttpServer({ projectRoot: project, host: "127.0.0.1", port: 0 });
  t.after(async () => service.close());
  const address = await service.start();
  const base = baseUrl(address);

  const health = await jsonResponse(await fetch(`${base}/health`));
  assert.equal(health.status, 200);
  assert.equal(health.body.kind, "world_os_codex_brain_http_health");
  assert.equal(health.body.authRequired, false);
  assert.equal(health.body.capabilities.productionStatus, true);
  assert.equal(CODEX_BRAIN_HTTP_ROUTES.includes("GET /v1/production/status"), true);
  assert.deepEqual(health.body.routes, [...CODEX_BRAIN_HTTP_ROUTES]);

  const before = (await listArtifacts(project)).length;
  const status = await jsonResponse(await fetch(`${base}/v1/brain/status?worlds=W01,W02`));
  assert.equal(status.status, 200);
  assert.equal(status.body.kind, "world_os_codex_brain_status");
  assert.deepEqual(status.body.worldIds, ["W01", "W02"]);
  assert.equal((await listArtifacts(project)).length, before);

  const productionStatus = await jsonResponse(await fetch(`${base}/v1/production/status?worlds=W01&limit=5`));
  assert.equal(productionStatus.status, 200);
  assert.equal(productionStatus.body.kind, "world_os_production_status");
  assert.deepEqual(productionStatus.body.worldIds, ["W01"]);
  assert.deepEqual(productionStatus.body.slices, []);
  assert.deepEqual(productionStatus.body.releaseReceipts, []);
  assert.equal((await listArtifacts(project)).length, before);

  const forecast = await jsonResponse(await fetch(`${base}/v1/brain/forecast?worlds=W01,W02`));
  assert.equal(forecast.status, 200);
  assert.equal(forecast.body.kind, "world_os_codex_brain_forecast");
  assert.equal(forecast.body.persisted, false);
  assert.deepEqual(forecast.body.worldIds, ["W01", "W02"]);
  assert.equal(forecast.body.forecasts.length, 2);
  assert.equal(forecast.body.forecasts.every((item) => item.persisted === false && item.authority === "proposal_only"), true);
  assert.equal(forecast.body.forecasts.every((item) => item.candidates.every((candidate) => candidate.projectedState === null && candidate.projectedStateSummary)), true);
  assert.equal((await listArtifacts(project)).length, before);
  const missingWorlds = await jsonResponse(await fetch(`${base}/v1/brain/forecast`));
  assert.equal(missingWorlds.status, 400);
  assert.equal(missingWorlds.body.error.code, "world_ids_required");

  const invalid = await jsonResponse(await fetch(`${base}/v1/brain/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ dispatch: { connector: { kind: "evil" } } })
  }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error.code, "request_fields_invalid");
  const wrongType = await jsonResponse(await fetch(`${base}/v1/brain/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ maxCycles: "1", dispatch: false })
  }));
  assert.equal(wrongType.status, 400);
  assert.equal(wrongType.body.error.code, "request_value_invalid");

  const run = await jsonResponse(await fetch(`${base}/v1/brain/runs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      worldIds: ["W01"],
      maxCycles: 1,
      runKey: "http-brain-test",
      now: "2026-08-24T16:00:00.000Z",
      dispatch: false
    })
  }));
  assert.equal(run.status, 200);
  assert.equal(run.body.brainRunId.startsWith("brain-run."), true);
  assert.equal(run.body.dispatch.status, "disabled");
  assert.equal(run.body.worldIds[0], "W01");

  const runs = await jsonResponse(await fetch(`${base}/v1/brain/runs?worlds=W01`));
  assert.equal(runs.status, 200);
  assert.equal(runs.body.length, 1);
  assert.equal(runs.body[0].receipt.brainRunId, run.body.brainRunId);

  const exact = await jsonResponse(await fetch(`${base}/v1/brain/runs/${encodeURIComponent(run.body.brainRunId)}`));
  assert.equal(exact.status, 200);
  assert.equal(exact.body.receiptRef.contentHash, run.body.receiptRef.contentHash);
});

test("HTTP Brain authentication is environment-only and protects mutations", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-brain-http-auth-"));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const tokenEnv = "CINEWEAVE_BRAIN_HTTP_TEST_TOKEN";
  const previous = process.env[tokenEnv];
  process.env[tokenEnv] = "test-token-value";
  const connector = {
    kind: "world_os_mcp_connector",
    trusted: true,
    id: "fixture.http-connector",
    async call() { throw new Error("should not be called while network is disabled"); }
  };
  assert.throws(() => createCodexBrainHttpServer({ projectRoot: project, host: "127.0.0.1", port: 0, dispatchConnector: connector }), /tokenEnv authentication/);
  const service = createCodexBrainHttpServer({ projectRoot: project, host: "127.0.0.1", port: 0, tokenEnv });
  t.after(async () => {
    await service.close();
    if (previous === undefined) delete process.env[tokenEnv];
    else process.env[tokenEnv] = previous;
  });
  const address = await service.start();
  const base = baseUrl(address);

  const missing = await jsonResponse(await fetch(`${base}/health`));
  assert.equal(missing.status, 401);
  const wrong = await jsonResponse(await fetch(`${base}/health`, { headers: { authorization: "Bearer wrong" } }));
  assert.equal(wrong.status, 401);
  const accepted = await jsonResponse(await fetch(`${base}/health`, { headers: { authorization: "Bearer test-token-value" } }));
  assert.equal(accepted.status, 200);
});

test("HTTP feedback routes accept only receipt-bound privacy-bounded signals and Codex use receipts", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-brain-http-signals-"));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const event = await runEventProposal(project, proposalPath);
  const platform = await readJson(platformPath);
  const pending = await listOutbox(project, platform);
  const entry = pending.entries[0];
  const projection = await findArtifact(project, entry.projectionRef);
  const receipt = await recordPublishReceipt(project, projection, createLocalFixtureResponse(entry.dispatch));
  const service = createCodexBrainHttpServer({ projectRoot: project, host: "127.0.0.1", port: 0 });
  t.after(async () => service.close());
  const address = await service.start();
  const base = baseUrl(address);
  const headers = { "content-type": "application/json" };
  const signalBody = {
    worldId: "W01",
    sourceProjectionRef: entry.projectionRef,
    sourceReceiptRef: receipt.envelope.artifactRef,
    platformProfileRef: receipt.envelope.payload.platformProfileRef,
    signalType: "comment",
    sourceEventId: "http-comment-001",
    observedAt: "2026-08-24T17:00:00.000Z",
    observation: {
      metric: "comment",
      value: 1,
      choiceId: null,
      commentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      commentClass: "question"
    },
    privacy: {
      identity: "redacted",
      content: "hashed",
      retention: "standard",
      containsRawText: false
    },
    receivedAt: "2026-08-24T17:00:01.000Z"
  };
  const unknownField = await jsonResponse(await fetch(`${base}/v1/signals`, {
    method: "POST", headers, body: JSON.stringify({ ...signalBody, rawText: "must never cross the boundary" })
  }));
  assert.equal(unknownField.status, 400);
  assert.equal(unknownField.body.error.code, "request_fields_invalid");
  const ingested = await jsonResponse(await fetch(`${base}/v1/signals`, {
    method: "POST", headers, body: JSON.stringify(signalBody)
  }));
  assert.equal(ingested.status, 200);
  assert.equal(ingested.body.idempotent, false);
  assert.equal(ingested.body.signal.worldId, "W01");
  const duplicate = await jsonResponse(await fetch(`${base}/v1/signals`, {
    method: "POST", headers, body: JSON.stringify(signalBody)
  }));
  assert.equal(duplicate.status, 200);
  assert.equal(duplicate.body.idempotent, true);
  const listed = await jsonResponse(await fetch(`${base}/v1/signals?worlds=W01&limit=1`));
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 1);
  const invalidPrivacy = await jsonResponse(await fetch(`${base}/v1/signals`, {
    method: "POST", headers,
    body: JSON.stringify({ ...signalBody, sourceEventId: "http-comment-002", observation: { ...signalBody.observation, commentHash: null } })
  }));
  assert.equal(invalidPrivacy.status, 422);
  assert.equal(invalidPrivacy.body.error.code, "external_signal_rejected");
  const useBody = {
    signalRef: ingested.body.signalRef,
    proposalRef: event.stored.proposalRef,
    outcome: "used_as_evidence",
    recordedAt: "2026-08-24T17:01:00.000Z"
  };
  const use = await jsonResponse(await fetch(`${base}/v1/signal-uses`, {
    method: "POST", headers, body: JSON.stringify(useBody)
  }));
  assert.equal(use.status, 200);
  assert.equal(use.body.idempotent, false);
  const useAgain = await jsonResponse(await fetch(`${base}/v1/signal-uses`, {
    method: "POST", headers, body: JSON.stringify(useBody)
  }));
  assert.equal(useAgain.status, 200);
  assert.equal(useAgain.body.idempotent, true);
  const uses = await jsonResponse(await fetch(`${base}/v1/signal-uses?worlds=W01&outcome=used_as_evidence`));
  assert.equal(uses.status, 200);
  assert.equal(uses.body.length, 1);
});

test("HTTP Brain selects only server-side LLM shadow profiles and preserves proposal-only receipts", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-brain-http-shadow-"));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  const policy = await readJson(join(repoRoot, "examples", "multi-world-studio", "providers", "future-llm-policy.json"));
  policy.version = 2;
  policy.enabled = true;
  policy.modelAlias = "fixture";
  const policyRef = exactRef("world_os_llm_provider_policy", policy.policyId, policy.version, policy);
  await putArtifact(project, policy, { kind: policy.kind, id: policy.policyId, version: policy.version, status: "candidate", createdAt: "2026-08-24T16:00:00.000Z", createdBy: "codex.root" });
  const request = await readJson(join(repoRoot, "examples", "multi-world-studio", "providers", "simulation-request.w01.next-event.json"));
  request.requestId = "simulation-request.http-shadow";
  request.providerPolicyRef = policyRef;
  const requestRef = exactRef("world_os_simulation_request", request.requestId, request.version, request);
  await putArtifact(project, request, { kind: request.kind, id: request.requestId, version: request.version, status: "candidate", createdAt: request.requestedAt, createdBy: "codex.root" });
  const providerEnv = {
    WORLD_OS_LLM_TRUSTED: process.env.WORLD_OS_LLM_TRUSTED,
    WORLD_OS_LLM_ENDPOINT: process.env.WORLD_OS_LLM_ENDPOINT,
    WORLD_OS_LLM_MODEL: process.env.WORLD_OS_LLM_MODEL
  };
  process.env.WORLD_OS_LLM_TRUSTED = "true";
  process.env.WORLD_OS_LLM_ENDPOINT = "http://127.0.0.1:1/v1/chat/completions";
  process.env.WORLD_OS_LLM_MODEL = "fixture";
  t.after(() => {
    for (const [key, value] of Object.entries(providerEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  const loadedProfiles = await createHttpShadowProfiles({ projectRoot: project });
  assert.equal(loadedProfiles[0].id, "server-openai-shadow");
  assert.equal(loadedProfiles[0].provider.kind, "world_os_llm_provider");
  assert.equal(loadedProfiles[0].provider.trusted, true);
  const proposal = await readJson(join(repoRoot, "examples", "multi-world-studio", "events", "event.w01.rain-night-incense.json"));
  // Deliberately reuse the deterministic Codex candidate id. Shadow evidence
  // must be namespaced so a provider cannot occupy the scheduler's proposal slot.
  proposal.proposalId = "proposal.w01.s000001.rain-night-incense.baseline";
  proposal.source = { origin: "llm_api", authority: "proposal_only", providerId: "fixture.http-shadow", requestRef };
  const fixture = createFixtureProposalProvider(proposal, { modelAlias: "fixture", outputTokens: 17, costUsd: 0 });
  const provider = { ...fixture, kind: "world_os_llm_provider", trusted: true, localFixture: true, id: "fixture.http-shadow" };
  const tokenEnv = "CINEWEAVE_BRAIN_HTTP_SHADOW_TOKEN";
  const previous = process.env[tokenEnv];
  process.env[tokenEnv] = "shadow-token-value";
  const service = createCodexBrainHttpServer({
    projectRoot: project,
    host: "127.0.0.1",
    port: 0,
    tokenEnv,
    shadowProfiles: [{ id: "fixture-shadow", requestDocument: request, policyDocument: policy, provider }]
  });
  t.after(async () => {
    await service.close();
    if (previous === undefined) delete process.env[tokenEnv];
    else process.env[tokenEnv] = previous;
  });
  const address = await service.start();
  const base = baseUrl(address);
  const headers = { authorization: "Bearer shadow-token-value", "content-type": "application/json" };
  const health = await jsonResponse(await fetch(`${base}/health`, { headers }));
  assert.deepEqual(health.body.capabilities.llmShadowProfileIds, ["fixture-shadow"]);
  const unknown = await jsonResponse(await fetch(`${base}/v1/brain/runs`, {
    method: "POST", headers, body: JSON.stringify({ shadowProfileIds: ["missing"], dispatch: false })
  }));
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error.code, "shadow_profile_not_found");
  const run = await jsonResponse(await fetch(`${base}/v1/brain/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ worldIds: ["W01"], maxCycles: 1, runKey: "http-shadow-test", now: "2026-08-24T16:01:00.000Z", dispatch: false, shadowProfileIds: ["fixture-shadow"] })
  }));
  assert.equal(run.status, 200);
  assert.equal(run.body.llmMode, "proposal_only");
  assert.equal(run.body.shadowRunRefs.length, 1);
  assert.equal(run.body.shadowFailureCount, 0);
  const shadow = await findArtifact(project, run.body.shadowRunRefs[0]);
  assert.equal(shadow.envelope.payload.authority, "proposal_only");
  assert.equal(shadow.envelope.payload.rawResponseStored, false);
  const shadowProposal = await findArtifact(project, shadow.envelope.payload.proposalRef);
  assert.equal(shadowProposal.envelope.payload.proposalId.startsWith("shadow-proposal."), true);
});
