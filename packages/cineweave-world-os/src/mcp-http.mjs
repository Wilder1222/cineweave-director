import { parseJsonStrict } from "../../cineweave-runtime/src/canonical-json.mjs";
import { validatePlatformResponse } from "./outbox.mjs";
import { isPlainObject } from "./json.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const DEFAULT_PROTOCOL_VERSION = "2025-03-26";
const MAX_RESPONSE_BYTES = 256 * 1024;
const MAX_ERROR_MESSAGE = 512;

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`${label} must be a bounded identifier`);
  return value;
}

function boundedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeMessage(value, fallback) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.length > MAX_ERROR_MESSAGE ? `${value.slice(0, MAX_ERROR_MESSAGE)}…` : value;
}

function assertEndpoint(value) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("MCP HTTP endpoint must be a non-empty URL");
  let parsed;
  try { parsed = new URL(value); } catch { throw new TypeError("MCP HTTP endpoint must be a valid URL"); }
  if (!new Set(["http:", "https:"]).has(parsed.protocol)) throw new TypeError("MCP HTTP endpoint must use http(s)");
  return parsed.href;
}

function assertEnvName(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new TypeError("MCP HTTP apiKeyEnv is invalid");
  return value;
}

function assertHeaders(value) {
  if (value === undefined) return {};
  if (!isPlainObject(value)) throw new TypeError("MCP HTTP headers must be an object");
  const headers = {};
  for (const [key, headerValue] of Object.entries(value)) {
    if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(key) || typeof headerValue !== "string" || headerValue.includes("\0") || headerValue.length > 4096) {
      throw new TypeError("MCP HTTP headers contain an invalid key or value");
    }
    const lower = key.toLowerCase();
    if (["authorization", "cookie", "set-cookie", "proxy-authorization", "content-type", "accept", "mcp-protocol-version", "mcp-session-id"].includes(lower)) throw new TypeError("MCP HTTP protected headers must be supplied by the connector, not static headers");
    headers[key] = headerValue;
  }
  return headers;
}

async function readBoundedBody(response) {
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const chunk = Buffer.from(next.value);
      total += chunk.byteLength;
      if (total > MAX_RESPONSE_BYTES) throw boundedError("mcp_http_response_limit", "MCP HTTP response exceeds the bounded limit");
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

function parseJsonRpcMessages(bytes, contentType) {
  const text = bytes.toString("utf8");
  if (text.length === 0) return [];
  const messages = [];
  if (contentType.includes("text/event-stream") || text.includes("\ndata:")) {
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try { messages.push(parseJsonStrict(data)); } catch { /* Ignore non-JSON SSE data frames. */ }
    }
    return messages;
  }
  try { return [parseJsonStrict(text)]; } catch { throw boundedError("mcp_http_invalid_json", "MCP HTTP response was not valid JSON"); }
}

function rpcResult(messages, id, label) {
  const message = messages.find((item) => isPlainObject(item) && item.jsonrpc === "2.0" && item.id === id);
  if (!message) throw boundedError("mcp_http_missing_rpc_response", `${label} did not return its JSON-RPC response`);
  if (isPlainObject(message.error)) throw boundedError("mcp_rpc_error", safeMessage(message.error.message, "MCP server returned a JSON-RPC error"));
  return message.result;
}

function extractPlatformResponse(result) {
  if (!isPlainObject(result)) throw boundedError("mcp_invalid_result", "MCP tools/call returned a non-object result");
  if (result.isError === true) throw boundedError("mcp_tool_error", "MCP tool reported an error");
  const candidates = [];
  if (isPlainObject(result.structuredContent)) candidates.push(result.structuredContent);
  if (isPlainObject(result.platformResponse)) candidates.push(result.platformResponse);
  if (Object.hasOwn(result, "status")) candidates.push(result);
  for (const content of Array.isArray(result.content) ? result.content : []) {
    if (!isPlainObject(content)) continue;
    if (content.type === "json" && isPlainObject(content.json)) candidates.push(content.json);
    if (content.type === "text" && typeof content.text === "string" && Buffer.byteLength(content.text, "utf8") <= MAX_RESPONSE_BYTES) {
      try {
        const parsed = parseJsonStrict(content.text);
        if (isPlainObject(parsed)) candidates.push(parsed);
      } catch {
        // Raw text is never retained as platform evidence.
      }
    }
  }
  const response = candidates.find((candidate) => candidate.status === "accepted" || candidate.status === "rejected");
  if (!response) throw boundedError("mcp_response_missing", "MCP tool did not return a platform response object");
  validatePlatformResponse(response);
  return structuredClone(response);
}

function assertDispatch(dispatch) {
  if (!isPlainObject(dispatch) || dispatch.transport !== "mcp" || typeof dispatch.toolName !== "string" || !isPlainObject(dispatch.arguments)) {
    throw new TypeError("MCP HTTP connector accepts only an exact MCP Dispatch");
  }
}

/**
 * Build a trusted connector for a deployment-provided MCP HTTP endpoint.
 * Construction is inert; the endpoint is contacted only from call(), after
 * dispatchOutbox has required allowNetwork=true and a trusted connector.
 * The connector receives only the derived Dispatch, never project paths or
 * State/Canon mutation authority.
 */
export function createMcpHttpConnector(options = {}) {
  if (options.trusted !== true) throw new TypeError("MCP HTTP connector requires explicit trusted=true after endpoint review");
  const id = assertIdentifier(options.id || "mcp.http", "MCP HTTP connector id");
  const endpoint = assertEndpoint(options.endpoint);
  const apiKeyEnv = assertEnvName(options.apiKeyEnv);
  const staticHeaders = assertHeaders(options.headers);
  const protocolVersion = typeof options.protocolVersion === "string" && options.protocolVersion.trim()
    ? options.protocolVersion.trim()
    : DEFAULT_PROTOCOL_VERSION;
  const clientName = typeof options.clientName === "string" && options.clientName.trim() ? options.clientName.trim() : "cineweave-world-os";
  const clientVersion = typeof options.clientVersion === "string" && options.clientVersion.trim() ? options.clientVersion.trim() : "0.4.0";
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new TypeError("MCP HTTP connector requires a fetch implementation");

  return {
    kind: "world_os_mcp_connector",
    trusted: true,
    id,
    async call(dispatch, { signal } = {}) {
      assertDispatch(dispatch);
      const headers = {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": protocolVersion,
        ...staticHeaders
      };
      const apiKey = apiKeyEnv ? process.env[apiKeyEnv] : undefined;
      if (apiKey !== undefined) {
        if (typeof apiKey !== "string" || !apiKey.trim()) throw boundedError("mcp_http_missing_credentials", `Environment variable ${apiKeyEnv} is empty`);
        headers.Authorization = `Bearer ${apiKey}`;
      }
      let nextId = 1;
      let sessionId = null;
      async function post(method, params, expectResponse = true) {
        const requestId = nextId;
        nextId += 1;
        const body = { jsonrpc: "2.0", id: requestId, method, params };
        if (!expectResponse) delete body.id;
        const requestHeaders = { ...headers };
        if (sessionId) requestHeaders["Mcp-Session-Id"] = sessionId;
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(body),
          signal
        });
        const bytes = await readBoundedBody(response);
        if (!response.ok) throw boundedError("mcp_http_status", `MCP HTTP endpoint returned status ${response.status}`);
        const returnedSession = response.headers.get("mcp-session-id");
        if (returnedSession) sessionId = returnedSession;
        if (!expectResponse) return null;
        const messages = parseJsonRpcMessages(bytes, response.headers.get("content-type") || "application/json");
        return rpcResult(messages, requestId, method);
      }
      await post("initialize", {
        protocolVersion,
        capabilities: {},
        clientInfo: { name: clientName, version: clientVersion }
      });
      await post("notifications/initialized", {}, false);
      const result = await post("tools/call", {
        name: dispatch.toolName,
        arguments: structuredClone(dispatch.arguments)
      });
      const platformResponse = extractPlatformResponse(result);
      if (platformResponse.idempotencyKey !== dispatch.idempotencyKey) throw boundedError("mcp_idempotency_mismatch", "MCP platform response idempotency key does not match the Dispatch");
      return platformResponse;
    }
  };
}
