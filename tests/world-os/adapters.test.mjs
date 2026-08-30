import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

import { createMcpStdioConnector } from "../../packages/cineweave-world-os/src/mcp-stdio.mjs";
import { createMcpHttpConnector } from "../../packages/cineweave-world-os/src/mcp-http.mjs";
import { createOpenAiCompatibleProvider } from "../../packages/cineweave-world-os/src/llm-http.mjs";
import { exactRef, readJson } from "../../packages/cineweave-world-os/src/json.mjs";
import { advanceWorld } from "../../packages/cineweave-world-os/src/scheduler.mjs";
import { dispatchOutbox } from "../../packages/cineweave-world-os/src/mcp.mjs";
import { rebuildSeedStore, verifyWorldOsProject } from "../../packages/cineweave-world-os/src/store.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const exampleRoot = join(repoRoot, "examples", "multi-world-studio");
const seedManifestPath = join(exampleRoot, "seed-manifest.json");
const platformPath = join(exampleRoot, "platforms", "studio-platform.json");

async function fixtureProposalAndRequest() {
  const proposal = await readJson(join(exampleRoot, "events", "event.w01.rain-night-incense.json"));
  const request = await readJson(join(exampleRoot, "providers", "simulation-request.w01.next-event.json"));
  proposal.source = {
    origin: "llm_api",
    authority: "proposal_only",
    providerId: "fixture.http-provider",
    requestRef: exactRef("world_os_simulation_request", request.requestId, request.version, request)
  };
  return { proposal, request };
}

test("MCP stdio adapter performs an explicit initialize/tools-call exchange without receiving a project writer", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-mcp-stdio-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const serverPath = join(root, "fixture-server.mjs");
  await writeFile(serverPath, `
    import readline from "node:readline";
    const rl = readline.createInterface({ input: process.stdin });
    rl.on("line", (line) => {
      const message = JSON.parse(line);
      if (message.method === "initialize") {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "fixture", version: "1" } } }) + "\\n");
      } else if (message.method === "tools/call") {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { structuredContent: { status: "accepted", platformRecordId: "remote.fixture.1", idempotencyKey: message.params.arguments.idempotencyKey, receivedAt: "2026-08-24T08:00:00.000Z", responseHash: null } } }) + "\\n");
      }
    });
  `, "utf8");
  const connector = createMcpStdioConnector({ id: "fixture.stdio", trusted: true, command: process.execPath, args: [serverPath] });
  const dispatch = {
    kind: "world_os_mcp_dispatch",
    transport: "mcp",
    toolName: "upsert_world_projection",
    idempotencyKey: "platform.studio-private:W01:simulation.main:1:sha256:fixture",
    arguments: { idempotencyKey: "platform.studio-private:W01:simulation.main:1:sha256:fixture", projection: { worldId: "W01" }, metadata: { authority: "non_authoritative_view" } }
  };
  const response = await connector.call(dispatch);
  assert.deepEqual(response, {
    status: "accepted",
    platformRecordId: "remote.fixture.1",
    idempotencyKey: dispatch.idempotencyKey,
    receivedAt: "2026-08-24T08:00:00.000Z",
    responseHash: null
  });
});

test("MCP HTTP adapter performs initialize/session/tools-call over JSON and SSE without receiving a project writer", async (t) => {
  const seen = [];
  const server = createServer((incoming, outgoing) => {
    const chunks = [];
    incoming.on("data", (chunk) => chunks.push(chunk));
    incoming.on("end", () => {
      const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      seen.push({ message, sessionId: incoming.headers["mcp-session-id"] || null });
      if (message.method === "initialize") {
        outgoing.statusCode = 200;
        outgoing.setHeader("content-type", "application/json");
        outgoing.setHeader("mcp-session-id", "fixture-http-session");
        outgoing.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "fixture-http", version: "1" } } }));
      } else if (message.method === "notifications/initialized") {
        outgoing.statusCode = 202;
        outgoing.end();
      } else if (message.method === "tools/call") {
        outgoing.statusCode = 200;
        outgoing.setHeader("content-type", "text/event-stream");
        outgoing.end(`data: ${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { structuredContent: { status: "accepted", platformRecordId: "remote.http.1", idempotencyKey: message.params.arguments.idempotencyKey, receivedAt: "2026-08-24T08:01:00.000Z", responseHash: null } } })}\n\n`);
      }
    });
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  t.after(() => server.close());
  const address = server.address();
  const connector = createMcpHttpConnector({
    id: "fixture.http",
    trusted: true,
    endpoint: `http://127.0.0.1:${address.port}/mcp`,
    apiKeyEnv: null
  });
  const dispatch = {
    kind: "world_os_mcp_dispatch",
    transport: "mcp",
    toolName: "upsert_world_projection",
    idempotencyKey: "platform.studio-private:W01:simulation.main:1:sha256:http-fixture",
    arguments: { idempotencyKey: "platform.studio-private:W01:simulation.main:1:sha256:http-fixture", projection: { worldId: "W01" }, metadata: { authority: "non_authoritative_view" } }
  };
  const response = await connector.call(dispatch);
  assert.deepEqual(response, {
    status: "accepted",
    platformRecordId: "remote.http.1",
    idempotencyKey: dispatch.idempotencyKey,
    receivedAt: "2026-08-24T08:01:00.000Z",
    responseHash: null
  });
  assert.equal(seen.length, 3);
  assert.equal(seen[0].message.method, "initialize");
  assert.equal(seen[1].message.method, "notifications/initialized");
  assert.equal(seen[2].message.method, "tools/call");
  assert.equal(seen[2].sessionId, "fixture-http-session");
  assert.throws(() => createMcpHttpConnector({ id: "fixture.invalid", trusted: true, endpoint: "file:///secret", apiKeyEnv: null }), /http\(s\)/);
});

test("OpenAI-compatible adapter is inert until propose, sends bounded request context and returns sanitized proposal plus usage", async (t) => {
  const { proposal, request } = await fixtureProposalAndRequest();
  const seen = [];
  const server = createServer((incoming, outgoing) => {
    const chunks = [];
    incoming.on("data", (chunk) => chunks.push(chunk));
    incoming.on("end", () => {
      seen.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      outgoing.setHeader("content-type", "application/json");
      outgoing.end(JSON.stringify({
        choices: [{ message: { content: JSON.stringify({ proposal: { ...proposal, source: { ...proposal.source, hiddenReasoning: "must not persist" } } }) } }],
        usage: { output_tokens: 17, cost_usd: 0.021 }
      }));
    });
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  t.after(() => server.close());
  const address = server.address();
  const provider = createOpenAiCompatibleProvider({
    id: "fixture.http-provider",
    trusted: true,
    modelAlias: "fixture",
    endpoint: `http://127.0.0.1:${address.port}/v1/chat/completions`,
    apiKeyEnv: null,
    context: { selectedState: "exact-ref-only" }
  });
  const result = await provider.propose(request);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].model, "fixture");
  assert.equal(seen[0].temperature, 0);
  assert.equal(result.proposal.source.hiddenReasoning, undefined);
  assert.equal(result.proposal.source.providerId, "fixture.http-provider");
  assert.deepEqual(result.usage, { modelAlias: "fixture", outputTokens: 17, costUsd: 0.021 });
  assert.throws(() => createOpenAiCompatibleProvider({ id: "fixture.invalid", trusted: true, modelAlias: "fixture", endpoint: "file:///secret", apiKeyEnv: null }), /http\(s\) URL/);
});

test("trusted stdio connector closes the dispatcher loop into a PublishReceipt", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-mcp-dispatch-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await advanceWorld(project, "W01", { maxSteps: 1 });
  const serverPath = join(root, "fixture-dispatch-server.mjs");
  await writeFile(serverPath, `
    import readline from "node:readline";
    const rl = readline.createInterface({ input: process.stdin });
    rl.on("line", (line) => {
      const message = JSON.parse(line);
      if (message.method === "initialize") {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "fixture-dispatch", version: "1" } } }) + "\\n");
      } else if (message.method === "tools/call") {
        const args = message.params.arguments;
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { structuredContent: { status: "accepted", platformRecordId: "remote.dispatch.1", idempotencyKey: args.idempotencyKey, receivedAt: "2026-08-24T14:00:00.000Z", responseHash: null } } }) + "\\n");
      }
    });
  `, "utf8");
  const connector = createMcpStdioConnector({ id: "fixture.dispatch.stdio", trusted: true, command: process.execPath, args: [serverPath] });
  const platform = await readJson(platformPath);
  const result = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-24T14:00:00.000Z",
    timeoutMs: 10_000
  });
  assert.equal(result.mode, "network_opt_in");
  assert.equal(result.attemptResults.length, 1);
  assert.equal(result.attemptResults[0].status, "succeeded");
  assert.equal(result.receipts.length, 1);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
});

test("trusted HTTP connector closes the dispatcher loop into a PublishReceipt", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-mcp-http-dispatch-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await rebuildSeedStore(seedManifestPath, project);
  await advanceWorld(project, "W01", { maxSteps: 1 });
  const seen = [];
  const server = createServer((incoming, outgoing) => {
    const chunks = [];
    incoming.on("data", (chunk) => chunks.push(chunk));
    incoming.on("end", () => {
      const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      seen.push(message.method);
      if (message.method === "initialize") {
        outgoing.setHeader("content-type", "application/json");
        outgoing.setHeader("mcp-session-id", "fixture-http-dispatch-session");
        outgoing.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2025-03-26", capabilities: {}, serverInfo: { name: "fixture-http-dispatch", version: "1" } } }));
      } else if (message.method === "notifications/initialized") {
        outgoing.statusCode = 202;
        outgoing.end();
      } else if (message.method === "tools/call") {
        const args = message.params.arguments;
        outgoing.setHeader("content-type", "text/event-stream");
        outgoing.end(`data: ${JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { structuredContent: { status: "accepted", platformRecordId: "remote.http.dispatch.1", idempotencyKey: args.idempotencyKey, receivedAt: "2026-08-24T14:01:00.000Z", responseHash: null } } })}\n\n`);
      }
    });
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  t.after(() => server.close());
  const address = server.address();
  const connector = createMcpHttpConnector({
    id: "fixture.http.dispatch",
    trusted: true,
    endpoint: `http://127.0.0.1:${address.port}/mcp`,
    apiKeyEnv: null
  });
  const platform = await readJson(platformPath);
  const result = await dispatchOutbox(project, platform, connector, {
    allowNetwork: true,
    now: "2026-08-24T14:01:00.000Z",
    timeoutMs: 10_000
  });
  assert.equal(result.mode, "network_opt_in");
  assert.equal(result.attemptResults.length, 1);
  assert.equal(result.attemptResults[0].status, "succeeded");
  assert.equal(result.receipts.length, 1);
  assert.deepEqual(seen, ["initialize", "notifications/initialized", "tools/call"]);
  const health = await verifyWorldOsProject(project);
  assert.equal(health.verification.valid, true);
});
