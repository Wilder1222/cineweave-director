import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { parseJsonStrict } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { isExactRef, isPlainObject } from "./json.mjs";
import { inspectCodexBrain, listCodexBrainRuns, runCodexBrainCycle } from "./brain.mjs";
import { forecastWorld } from "./scheduler.mjs";
import { ingestExternalSignal, listExternalSignals, listExternalSignalUses, recordExternalSignalUse } from "./signals.mjs";
import { listProductionSlices } from "./production.mjs";
import { listProductionMediaImports } from "./production-media.mjs";
import { listProductionQaReviews, listApprovedAssets, listPrivateReleaseReceipts } from "./production-release.mjs";

const MAX_BODY_BYTES = 256 * 1024;
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const MAX_SHADOW_PROFILES = 32;
const MAX_SIGNAL_LIST_ITEMS = 500;
const MAX_PRODUCTION_STATUS_ITEMS = 200;
const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);
const SIGNAL_USE_OUTCOMES = new Set(["used_as_evidence", "deferred_for_context", "dismissed_as_noise"]);

// Keep the deployment-side capability advertisement in one place so the
// standalone CLI and the HTTP implementation cannot silently diverge.
export const CODEX_BRAIN_HTTP_ROUTES = Object.freeze([
  "GET /health",
  "GET /healthz",
  "GET /v1/production/status",
  "GET /v1/brain/forecast",
  "GET /v1/signals",
  "POST /v1/signals",
  "GET /v1/signal-uses",
  "POST /v1/signal-uses",
  "GET /v1/brain/status",
  "GET /v1/brain/runs",
  "GET /v1/brain/runs/:brainRunId",
  "POST /v1/brain/runs"
]);

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "CodexBrainApiError";
    this.status = status;
    this.code = code;
  }
}

function fail(status, code, message) {
  throw new ApiError(status, code, message);
}

function assertEnvName(value, label) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || !ENV_NAME_PATTERN.test(value)) fail(500, "server_configuration_invalid", `${label} must be a valid environment variable name`);
  return value;
}

function isLoopbackHost(host) {
  return LOOPBACK_HOSTS.has(String(host).toLowerCase().replace(/^\[|\]$/g, ""));
}

function normalizeShadowProfiles(value, allowLlmNetwork) {
  if (value === undefined) return new Map();
  if (!Array.isArray(value) || value.length > MAX_SHADOW_PROFILES) {
    fail(500, "server_configuration_invalid", `shadowProfiles must contain at most ${MAX_SHADOW_PROFILES} profiles`);
  }
  const profiles = new Map();
  for (const profile of value) {
    if (!isPlainObject(profile)) fail(500, "server_configuration_invalid", "shadowProfiles entries must be objects");
    assertExactKeys(profile, ["id", "requestDocument", "policyDocument", "provider", "allowNetwork", "forceRetry"], "shadowProfiles entry");
    if (typeof profile.id !== "string" || !IDENTIFIER_PATTERN.test(profile.id) || profiles.has(profile.id)) {
      fail(500, "server_configuration_invalid", "shadowProfiles ids must be unique bounded identifiers");
    }
    const requestDocument = profile.requestDocument;
    const policyDocument = profile.policyDocument;
    const requestOk = isExactRef(requestDocument)
      || (isPlainObject(requestDocument) && requestDocument.kind === ARTIFACT_KINDS.simulationRequest);
    const policyOk = isExactRef(policyDocument)
      || (isPlainObject(policyDocument) && policyDocument.kind === ARTIFACT_KINDS.providerPolicy);
    if (!requestOk || !policyOk) fail(500, "server_configuration_invalid", `shadow profile ${profile.id} must bind an exact simulation request and provider policy`);
    const provider = profile.provider;
    if (!isPlainObject(provider) || typeof provider.id !== "string" || !IDENTIFIER_PATTERN.test(provider.id) || typeof provider.propose !== "function") {
      fail(500, "server_configuration_invalid", `shadow profile ${profile.id} provider is invalid`);
    }
    const localFixture = provider.localFixture === true;
    if (!localFixture && (provider.kind !== "world_os_llm_provider" || provider.trusted !== true)) {
      fail(500, "server_configuration_invalid", `shadow profile ${profile.id} provider must be trusted and proposal-only`);
    }
    const allowNetwork = profile.allowNetwork === true;
    if (profile.allowNetwork !== undefined && typeof profile.allowNetwork !== "boolean") {
      fail(500, "server_configuration_invalid", `shadow profile ${profile.id} allowNetwork must be boolean`);
    }
    if (allowNetwork && !allowLlmNetwork) {
      fail(500, "server_configuration_invalid", `shadow profile ${profile.id} requires allowLlmNetwork=true at server startup`);
    }
    const forceRetry = profile.forceRetry === true;
    if (profile.forceRetry !== undefined && typeof profile.forceRetry !== "boolean") {
      fail(500, "server_configuration_invalid", `shadow profile ${profile.id} forceRetry must be boolean`);
    }
    profiles.set(profile.id, { id: profile.id, requestDocument, policyDocument, provider, allowNetwork, forceRetry });
  }
  return profiles;
}

function assertServerOptions(options) {
  if (typeof options.projectRoot !== "string" || !options.projectRoot.trim() || options.projectRoot.includes("\0")) {
    fail(500, "server_configuration_invalid", "projectRoot must be a non-empty path");
  }
  const projectRoot = resolve(options.projectRoot);
  const host = options.host === undefined ? "127.0.0.1" : String(options.host);
  if (!host || host.length > 255 || host.includes("\0")) fail(500, "server_configuration_invalid", "HTTP host is invalid");
  const port = options.port === undefined ? 0 : Number(options.port);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) fail(500, "server_configuration_invalid", "HTTP port must be an integer from 0 to 65535");
  const tokenEnv = assertEnvName(options.tokenEnv, "HTTP tokenEnv");
  if (options.requireAuth !== undefined && typeof options.requireAuth !== "boolean") {
    fail(500, "server_configuration_invalid", "requireAuth must be boolean when provided");
  }
  if (!isLoopbackHost(host) && options.requireAuth === false) {
    fail(500, "server_configuration_invalid", "Non-loopback HTTP binding cannot disable authentication");
  }
  const requireAuth = options.requireAuth === undefined ? !isLoopbackHost(host) : options.requireAuth === true;
  if (options.allowNetwork !== undefined && typeof options.allowNetwork !== "boolean") {
    fail(500, "server_configuration_invalid", "allowNetwork must be boolean when provided");
  }
  const allowNetwork = options.allowNetwork === true;
  if (options.allowLlmNetwork !== undefined && typeof options.allowLlmNetwork !== "boolean") {
    fail(500, "server_configuration_invalid", "allowLlmNetwork must be boolean when provided");
  }
  const allowLlmNetwork = options.allowLlmNetwork === true;
  if (options.token !== undefined) fail(500, "server_configuration_invalid", "Pass tokenEnv, never a raw HTTP token");
  if (requireAuth && !tokenEnv) fail(500, "server_configuration_invalid", "Protected HTTP binding requires tokenEnv authentication");
  if (tokenEnv && (typeof process.env[tokenEnv] !== "string" || !process.env[tokenEnv].trim())) {
    fail(500, "server_configuration_invalid", `HTTP token environment variable ${tokenEnv} is not set`);
  }
  const connector = options.dispatchConnector || null;
  if (connector !== null && (!isPlainObject(connector)
    || connector.kind !== "world_os_mcp_connector"
    || connector.trusted !== true
    || typeof connector.id !== "string"
    || !IDENTIFIER_PATTERN.test(connector.id)
    || typeof connector.call !== "function")) {
    fail(500, "server_configuration_invalid", "dispatchConnector must be a trusted World OS MCP connector");
  }
  if (allowNetwork && !connector) fail(500, "server_configuration_invalid", "allowNetwork requires a trusted server-side connector");
  const shadowProfiles = normalizeShadowProfiles(options.shadowProfiles, allowLlmNetwork);
  const requestTimeoutMs = options.requestTimeoutMs === undefined ? DEFAULT_REQUEST_TIMEOUT_MS : Number(options.requestTimeoutMs);
  if (!Number.isSafeInteger(requestTimeoutMs) || requestTimeoutMs < 1_000 || requestTimeoutMs > 300_000) {
    fail(500, "server_configuration_invalid", "requestTimeoutMs must be an integer from 1000 to 300000");
  }
  const protectedBinding = requireAuth || connector !== null || allowNetwork || shadowProfiles.size > 0;
  if (protectedBinding && !tokenEnv) fail(500, "server_configuration_invalid", "HTTP Brain with a connector, LLM profile or network dispatch requires tokenEnv authentication");
  return { projectRoot, host, port, tokenEnv, requireAuth: protectedBinding, allowNetwork, allowLlmNetwork, connector, shadowProfiles, requestTimeoutMs };
}

function sendJson(response, status, payload) {
  if (response.headersSent) return;
  const bytes = Buffer.from(JSON.stringify(payload));
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Length", String(bytes.byteLength));
  response.end(bytes);
}

function sendError(response, error) {
  const status = error instanceof ApiError && Number.isSafeInteger(error.status) ? error.status : 500;
  const code = error instanceof ApiError && typeof error.code === "string" ? error.code : "internal_error";
  const message = status >= 500 ? "Codex Brain HTTP request failed" : error.message;
  sendJson(response, status, { kind: "world_os_codex_brain_http_error", contractVersion: WORLD_OS_VERSION, error: { code, message } });
}

function assertExactKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unknown.length) fail(400, "request_fields_invalid", `${label} contains unsupported fields: ${unknown.join(", ")}`);
}

function integer(value, label, minimum, maximum, fallback) {
  const candidate = value === undefined ? fallback : value;
  if (typeof candidate !== "number" || !Number.isSafeInteger(candidate) || candidate < minimum || candidate > maximum) fail(400, "request_value_invalid", `${label} must be an integer from ${minimum} to ${maximum}`);
  return candidate;
}

function boundedBoolean(value, label, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") fail(400, "request_value_invalid", `${label} must be boolean`);
  return value;
}

function parseWorldIds(value, label = "worldIds") {
  if (value === undefined) return undefined;
  const values = typeof value === "string" ? value.split(",").map((item) => item.trim()).filter(Boolean) : value;
  if (!Array.isArray(values) || !values.length || values.length > 64 || new Set(values).size !== values.length || values.some((item) => typeof item !== "string" || !WORLD_ID_PATTERN.test(item))) {
    fail(400, "world_ids_invalid", `${label} must contain unique W## identifiers`);
  }
  return values;
}

function validIso(value, label) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) fail(400, "request_value_invalid", `${label} must be an ISO date-time`);
  return new Date(value).toISOString();
}

function parseDispatch(value, connector, allowNetworkEnabled, now) {
  if (value === false) return false;
  if (value === undefined) value = {};
  if (!isPlainObject(value)) fail(400, "dispatch_invalid", "dispatch must be false or an object");
  assertExactKeys(value, ["allowNetwork", "dryRun", "maxAttempts", "leaseSeconds", "baseBackoffSeconds", "timeoutMs"], "dispatch");
  const allowNetwork = boundedBoolean(value.allowNetwork, "dispatch.allowNetwork", false);
  const dryRun = boundedBoolean(value.dryRun, "dispatch.dryRun", true);
  if (allowNetwork && !connector) fail(400, "network_connector_not_configured", "Network dispatch requires a trusted server-side connector");
  if (allowNetwork && !allowNetworkEnabled) fail(403, "network_dispatch_not_enabled", "Network dispatch is disabled for this HTTP server");
  const dispatch = {
    allowNetwork,
    dryRun,
    maxAttempts: integer(value.maxAttempts, "dispatch.maxAttempts", 1, 10, 3),
    leaseSeconds: integer(value.leaseSeconds, "dispatch.leaseSeconds", 1, 86_400, 300),
    baseBackoffSeconds: integer(value.baseBackoffSeconds, "dispatch.baseBackoffSeconds", 1, 86_400, 30),
    timeoutMs: integer(value.timeoutMs, "dispatch.timeoutMs", 1_000, 300_000, 60_000)
  };
  if (now !== undefined) dispatch.now = now;
  if (connector) dispatch.connector = connector;
  return dispatch;
}

function parseShadowProfileIds(value, profiles, now) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.length || value.length > MAX_SHADOW_PROFILES
    || value.some((item) => typeof item !== "string" || !IDENTIFIER_PATTERN.test(item))
    || new Set(value).size !== value.length) {
    fail(400, "shadow_profiles_invalid", "shadowProfileIds must contain unique bounded profile ids");
  }
  return value.map((id) => {
    const profile = profiles.get(id);
    if (!profile) fail(404, "shadow_profile_not_found", `LLM shadow profile ${id} is not configured`);
    return {
      requestDocument: profile.requestDocument,
      policyDocument: profile.policyDocument,
      provider: profile.provider,
      allowNetwork: profile.allowNetwork,
      forceRetry: profile.forceRetry,
      now
    };
  });
}

function parseSignalIngestRequest(body) {
  if (!isPlainObject(body)) fail(400, "request_body_invalid", "ExternalSignal body must be a JSON object");
  assertExactKeys(body, [
    "worldId", "sourceProjectionRef", "sourceReceiptRef", "platformProfileRef", "signalType",
    "sourceEventId", "observedAt", "observation", "privacy", "receivedAt"
  ], "ExternalSignal body");
  const required = [
    "worldId", "sourceProjectionRef", "sourceReceiptRef", "platformProfileRef", "signalType",
    "sourceEventId", "observedAt", "observation", "privacy"
  ];
  if (required.some((field) => body[field] === undefined)) fail(400, "request_value_invalid", "ExternalSignal body is missing a required field");
  if (typeof body.worldId !== "string" || !WORLD_ID_PATTERN.test(body.worldId)) fail(400, "request_value_invalid", "worldId must be a W## identifier");
  if (typeof body.signalType !== "string" || !IDENTIFIER_PATTERN.test(body.signalType)) fail(400, "request_value_invalid", "signalType must be a bounded identifier");
  if (typeof body.sourceEventId !== "string" || !body.sourceEventId.trim() || body.sourceEventId.length > 240 || body.sourceEventId.includes("\0")) fail(400, "request_value_invalid", "sourceEventId must contain 1 to 240 NUL-free characters");
  const observedAt = validIso(body.observedAt, "observedAt");
  const receivedAt = body.receivedAt === undefined ? undefined : validIso(body.receivedAt, "receivedAt");
  if (!isExactRef(body.sourceProjectionRef) || body.sourceProjectionRef.kind !== ARTIFACT_KINDS.projection) fail(400, "request_value_invalid", "sourceProjectionRef must be an exact PlatformProjection reference");
  if (!isExactRef(body.sourceReceiptRef) || body.sourceReceiptRef.kind !== ARTIFACT_KINDS.receipt) fail(400, "request_value_invalid", "sourceReceiptRef must be an exact PublishReceipt reference");
  if (!isExactRef(body.platformProfileRef) || body.platformProfileRef.kind !== ARTIFACT_KINDS.platformProfile) fail(400, "request_value_invalid", "platformProfileRef must be an exact PlatformProfile reference");
  return {
    worldId: body.worldId,
    sourceProjectionRef: body.sourceProjectionRef,
    sourceReceiptRef: body.sourceReceiptRef,
    platformProfileRef: body.platformProfileRef,
    signalType: body.signalType,
    sourceEventId: body.sourceEventId,
    observedAt,
    observation: body.observation,
    privacy: body.privacy,
    receivedAt
  };
}

function parseSignalUseRequest(body) {
  if (!isPlainObject(body)) fail(400, "request_body_invalid", "ExternalSignalUseReceipt body must be a JSON object");
  assertExactKeys(body, ["signalRef", "proposalRef", "outcome", "recordedAt"], "ExternalSignalUseReceipt body");
  if (!isExactRef(body.signalRef) || body.signalRef.kind !== ARTIFACT_KINDS.externalSignal) fail(400, "request_value_invalid", "signalRef must be an exact ExternalSignal reference");
  if (body.proposalRef !== undefined && body.proposalRef !== null
    && (!isExactRef(body.proposalRef) || body.proposalRef.kind !== ARTIFACT_KINDS.proposal)) {
    fail(400, "request_value_invalid", "proposalRef must be an exact EventProposal reference or null");
  }
  if (typeof body.outcome !== "string" || !SIGNAL_USE_OUTCOMES.has(body.outcome)) fail(400, "request_value_invalid", "outcome is not supported");
  return {
    signalRef: body.signalRef,
    proposalRef: body.proposalRef === undefined ? null : body.proposalRef,
    outcome: body.outcome,
    recordedAt: body.recordedAt === undefined ? undefined : validIso(body.recordedAt, "recordedAt")
  };
}

function parseSignalListQuery(url, { includeOutcome = false } = {}) {
  const worldIds = filterWorldsFromQuery(url);
  const outcome = url.searchParams.get("outcome");
  if (!includeOutcome && outcome !== null) fail(400, "query_value_invalid", "outcome is only supported on /v1/signal-uses");
  if (includeOutcome && outcome !== null && !SIGNAL_USE_OUTCOMES.has(outcome)) fail(400, "query_value_invalid", "outcome is not supported");
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 100 : Number(rawLimit);
  if (!/^\d+$/.test(String(rawLimit === null ? 100 : rawLimit)) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_SIGNAL_LIST_ITEMS) {
    fail(400, "query_value_invalid", `limit must be an integer from 1 to ${MAX_SIGNAL_LIST_ITEMS}`);
  }
  return { worldIds, outcome, limit };
}

function filterSignalWorlds(items, worldIds, limit) {
  const filtered = worldIds === undefined ? items : items.filter((item) => worldIds.includes(item.signal?.worldId || item.use?.worldId));
  return filtered.slice(0, limit);
}

function parseProductionStatusQuery(url) {
  const worldIds = filterWorldsFromQuery(url);
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 100 : Number(rawLimit);
  if (!/^\d+$/.test(String(rawLimit === null ? 100 : rawLimit)) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PRODUCTION_STATUS_ITEMS) {
    fail(400, "query_value_invalid", `limit must be an integer from 1 to ${MAX_PRODUCTION_STATUS_ITEMS}`);
  }
  return { worldIds, limit };
}

function filterProductionWorlds(items, worldIds, limit) {
  const filtered = worldIds === undefined ? items : items.filter((item) => {
    const worldId = item.slice?.worldId || item.binding?.worldId || item.review?.worldId || item.asset?.worldId || item.receipt?.worldId;
    return worldId && worldIds.includes(worldId);
  });
  return filtered.slice(0, limit);
}

function parseRunRequest(body, connector, allowNetworkEnabled, shadowProfiles) {
  if (!isPlainObject(body)) fail(400, "request_body_invalid", "Brain run body must be a JSON object");
  assertExactKeys(body, ["worldIds", "maxCycles", "runKey", "resumePortfolioRef", "now", "dispatch", "shadowProfileIds"], "Brain run body");
  const now = validIso(body.now, "now");
  const runKey = body.runKey === undefined ? undefined : body.runKey;
  if (runKey !== undefined && (typeof runKey !== "string" || !runKey.trim() || runKey.length > 240)) fail(400, "request_value_invalid", "runKey must contain 1 to 240 characters");
  let resumePortfolioRef;
  if (body.resumePortfolioRef !== undefined) {
    if (!isExactRef(body.resumePortfolioRef) || body.resumePortfolioRef.kind !== ARTIFACT_KINDS.portfolioRunReceipt) {
      fail(400, "request_value_invalid", "resumePortfolioRef must be an exact PortfolioRunReceipt reference");
    }
    resumePortfolioRef = body.resumePortfolioRef;
  }
  return {
    worldIds: parseWorldIds(body.worldIds),
    maxCycles: integer(body.maxCycles, "maxCycles", 1, 100, 10),
    runKey,
    resumePortfolioRef,
    now,
    dispatch: parseDispatch(body.dispatch, connector, allowNetworkEnabled, now),
    shadowRuns: parseShadowProfileIds(body.shadowProfileIds, shadowProfiles, now)
  };
}

async function readJsonBody(request) {
  const contentType = String(request.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    request.resume();
    fail(415, "content_type_required", "HTTP Brain mutations require application/json");
  }
  const declaredLength = request.headers["content-length"];
  if (declaredLength !== undefined && (!/^\d+$/.test(String(declaredLength)) || Number(declaredLength) > MAX_BODY_BYTES)) {
    request.resume();
    fail(413, "request_body_too_large", "HTTP Brain JSON body exceeds the bounded limit");
  }
  return await new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    const rejectOnce = (error) => {
      if (settled) return;
      settled = true;
      rejectBody(error);
      request.resume();
    };
    request.on("data", (chunk) => {
      if (settled) return;
      total += Buffer.byteLength(chunk);
      if (total > MAX_BODY_BYTES) {
        rejectOnce(new ApiError(413, "request_body_too_large", "HTTP Brain JSON body exceeds the bounded limit"));
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    request.on("error", (error) => rejectOnce(new ApiError(400, "request_body_unreadable", error.message)));
    request.on("end", () => {
      if (settled) return;
      settled = true;
      if (!chunks.length) {
        rejectBody(new ApiError(400, "request_body_empty", "HTTP Brain JSON body is required"));
        return;
      }
      try { resolveBody(parseJsonStrict(Buffer.concat(chunks).toString("utf8"))); }
      catch { rejectBody(new ApiError(400, "request_json_invalid", "HTTP Brain body is not strict JSON")); }
    });
  });
}

function authorized(request, tokenEnv, requireAuth) {
  if (!tokenEnv && !requireAuth) return true;
  const expected = tokenEnv ? process.env[tokenEnv] : null;
  const header = request.headers.authorization;
  if (typeof expected !== "string" || !expected || typeof header !== "string" || !/^Bearer [^\s]+$/.test(header)) return false;
  const presented = Buffer.from(header.slice("Bearer ".length));
  const actual = Buffer.from(expected);
  return presented.length === actual.length && timingSafeEqual(presented, actual);
}

function filterWorldsFromQuery(url) {
  const value = url.searchParams.get("worlds");
  return value === null ? undefined : parseWorldIds(value, "worlds");
}

function runById(runs, brainRunId) {
  return runs.find((item) => item.receipt.brainRunId === brainRunId) || null;
}

/**
 * Create a local, bounded HTTP control surface for Codex Brain.
 *
 * The default binding is loopback. Non-loopback bindings require a token whose
 * environment variable name is supplied at construction; raw tokens are never
 * accepted in options or request bodies. HTTP callers can inspect status, list
 * receipts, or start a validated dry-run/network-opt-in Brain cycle. Connector
 * objects and LLM shadow profiles are server-side configuration only; a remote
 * caller may select a profile id but can never supply its provider, prompt,
 * policy, credentials or mutation authority. Platform feedback can only enter
 * through bounded ExternalSignal routes, which require an exact successful
 * PublishReceipt chain and never accept raw identity or text.
 */
export function createCodexBrainHttpServer(options = {}) {
  const config = assertServerOptions(options);
  let runQueue = Promise.resolve();
  const enqueue = (task) => {
    const current = runQueue.then(task, task);
    runQueue = current.catch(() => undefined);
    return current;
  };

  async function handle(request, response) {
    if (!authorized(request, config.tokenEnv, config.requireAuth)) {
      response.setHeader("WWW-Authenticate", "Bearer");
      sendJson(response, 401, { kind: "world_os_codex_brain_http_error", contractVersion: WORLD_OS_VERSION, error: { code: "unauthorized", message: "Bearer authentication is required" } });
      return;
    }
    const url = new URL(request.url || "/", "http://codex-brain.local");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "GET" && (path === "/health" || path === "/healthz")) {
      sendJson(response, 200, {
        kind: "world_os_codex_brain_http_health",
        contractVersion: WORLD_OS_VERSION,
        service: "codex-brain-http",
        status: "ok",
        authRequired: Boolean(config.tokenEnv || config.requireAuth),
        capabilities: {
          mcpNetworkDispatch: config.allowNetwork,
          llmShadowProfileIds: [...config.shadowProfiles.keys()],
          externalSignalIngress: true,
          externalSignalUse: true,
          productionStatus: true
        },
        routes: [...CODEX_BRAIN_HTTP_ROUTES]
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/production/status") {
      const query = parseProductionStatusQuery(url);
      const [slices, mediaImports, qaReviews, approvedAssets, releaseReceipts] = await enqueue(() => Promise.all([
        listProductionSlices(config.projectRoot),
        listProductionMediaImports(config.projectRoot),
        listProductionQaReviews(config.projectRoot),
        listApprovedAssets(config.projectRoot),
        listPrivateReleaseReceipts(config.projectRoot)
      ]));
      sendJson(response, 200, {
        kind: "world_os_production_status",
        contractVersion: WORLD_OS_VERSION,
        worldIds: query.worldIds || null,
        slices: filterProductionWorlds(slices, query.worldIds, query.limit),
        mediaImports: filterProductionWorlds(mediaImports, query.worldIds, query.limit),
        qaReviews: filterProductionWorlds(qaReviews, query.worldIds, query.limit),
        approvedAssets: filterProductionWorlds(approvedAssets, query.worldIds, query.limit),
        releaseReceipts: filterProductionWorlds(releaseReceipts, query.worldIds, query.limit)
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/brain/forecast") {
      const worldIds = filterWorldsFromQuery(url);
      if (!worldIds?.length) fail(400, "world_ids_required", "Forecast requires an explicit worlds query such as worlds=W01,W02");
      const forecasts = await enqueue(() => Promise.all(worldIds.map((worldId) => forecastWorld(config.projectRoot, worldId, { includeProjectedState: false }))));
      sendJson(response, 200, {
        kind: "world_os_codex_brain_forecast",
        contractVersion: WORLD_OS_VERSION,
        authority: "proposal_only",
        persisted: false,
        writePolicy: "read_only",
        worldIds,
        forecasts
      });
      return;
    }
    if (request.method === "GET" && path === "/v1/signals") {
      const query = parseSignalListQuery(url);
      const signals = await enqueue(() => listExternalSignals(config.projectRoot));
      sendJson(response, 200, filterSignalWorlds(signals, query.worldIds, query.limit));
      return;
    }
    if (request.method === "POST" && path === "/v1/signals") {
      const body = parseSignalIngestRequest(await readJsonBody(request));
      let result;
      try {
        result = await enqueue(() => ingestExternalSignal(config.projectRoot, body));
      } catch (error) {
        fail(422, "external_signal_rejected", error instanceof Error ? error.message : "ExternalSignal was rejected");
      }
      sendJson(response, 200, result);
      return;
    }
    if (request.method === "GET" && path === "/v1/signal-uses") {
      const query = parseSignalListQuery(url, { includeOutcome: true });
      const uses = await enqueue(() => listExternalSignalUses(config.projectRoot, { outcome: query.outcome || undefined }));
      sendJson(response, 200, filterSignalWorlds(uses, query.worldIds, query.limit));
      return;
    }
    if (request.method === "POST" && path === "/v1/signal-uses") {
      const body = parseSignalUseRequest(await readJsonBody(request));
      let result;
      try {
        result = await enqueue(() => recordExternalSignalUse(config.projectRoot, body));
      } catch (error) {
        fail(422, "external_signal_use_rejected", error instanceof Error ? error.message : "ExternalSignalUseReceipt was rejected");
      }
      sendJson(response, 200, result);
      return;
    }
    if (request.method === "GET" && path === "/v1/brain/status") {
      const status = await enqueue(() => inspectCodexBrain(config.projectRoot, { worldIds: filterWorldsFromQuery(url) }));
      sendJson(response, 200, status);
      return;
    }
    if (request.method === "GET" && path === "/v1/brain/runs") {
      const runs = await enqueue(() => listCodexBrainRuns(config.projectRoot));
      const worldIds = filterWorldsFromQuery(url);
      sendJson(response, 200, worldIds === undefined ? runs : runs.filter((item) => item.receipt.worldIds.some((worldId) => worldIds.includes(worldId))));
      return;
    }
    const runPrefix = "/v1/brain/runs/";
    if (request.method === "GET" && path.startsWith(runPrefix)) {
      let brainRunId;
      try { brainRunId = decodeURIComponent(path.slice(runPrefix.length)); }
      catch { fail(400, "brain_run_id_invalid", "Brain run id is not valid URL encoding"); }
      if (!IDENTIFIER_PATTERN.test(brainRunId)) fail(400, "brain_run_id_invalid", "Brain run id is invalid");
      const runs = await enqueue(() => listCodexBrainRuns(config.projectRoot));
      const found = runById(runs, brainRunId);
      if (!found) fail(404, "brain_run_not_found", "Brain run was not found");
      sendJson(response, 200, found);
      return;
    }
    if (request.method === "POST" && path === "/v1/brain/runs") {
      const body = await readJsonBody(request);
      const runOptions = parseRunRequest(body, config.connector, config.allowNetwork, config.shadowProfiles);
      const result = await enqueue(() => runCodexBrainCycle(config.projectRoot, runOptions));
      sendJson(response, 200, result);
      return;
    }
    if (!["GET", "POST"].includes(request.method)) {
      response.setHeader("Allow", "GET, POST");
      fail(405, "method_not_allowed", "HTTP method is not supported by Codex Brain");
    }
    fail(404, "route_not_found", "Codex Brain route was not found");
  }

  const server = createServer((request, response) => {
    void handle(request, response).catch((error) => sendError(response, error));
  });
  server.requestTimeout = config.requestTimeoutMs;
  server.headersTimeout = Math.min(config.requestTimeoutMs, 30_000);

  async function start() {
    if (server.listening) return server.address();
    await new Promise((resolveStart, rejectStart) => {
      const onError = (error) => { server.off("listening", onListening); rejectStart(error); };
      const onListening = () => { server.off("error", onError); resolveStart(); };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen({ host: config.host, port: config.port });
    });
    return server.address();
  }

  async function close() {
    await runQueue.catch(() => undefined);
    if (!server.listening) return;
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => error && error.code !== "ERR_SERVER_NOT_RUNNING" ? rejectClose(error) : resolveClose());
    });
  }

  return {
    server,
    projectRoot: config.projectRoot,
    start,
    close,
    address: () => server.address()
  };
}
