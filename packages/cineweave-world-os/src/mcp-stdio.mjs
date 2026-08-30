import { spawn } from "node:child_process";
import { parseJsonStrict } from "../../cineweave-runtime/src/canonical-json.mjs";
import { validatePlatformResponse } from "./outbox.mjs";
import { isPlainObject } from "./json.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const DEFAULT_PROTOCOL_VERSION = "2025-03-26";
const MAX_STDOUT_LINE_BYTES = 256 * 1024;
const MAX_STDERR_BYTES = 64 * 1024;

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`${label} must be a bounded identifier`);
  return value;
}

function assertCommand(value) {
  if (typeof value !== "string" || !value.trim() || value.includes("\0")) throw new TypeError("MCP stdio command must be a non-empty executable path");
  return value;
}

function assertArgs(value) {
  if (!Array.isArray(value) || value.length > 128 || value.some((item) => typeof item !== "string" || item.includes("\0"))) {
    throw new TypeError("MCP stdio args must be an array of at most 128 NUL-free strings");
  }
  return value;
}

function boundedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function safeMessage(value) {
  if (typeof value !== "string") return "MCP server returned an error";
  return value.length > 512 ? `${value.slice(0, 512)}…` : value;
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
    if (content.type === "text" && typeof content.text === "string" && Buffer.byteLength(content.text, "utf8") <= MAX_STDOUT_LINE_BYTES) {
      try {
        const parsed = parseJsonStrict(content.text);
        if (isPlainObject(parsed)) candidates.push(parsed);
      } catch {
        // Text content is intentionally ignored unless it is strict JSON. Raw text never enters a receipt.
      }
    }
  }
  const response = candidates.find((candidate) => candidate.status === "accepted" || candidate.status === "rejected");
  if (!response) throw boundedError("mcp_response_missing", "MCP tool did not return a platform response object");
  validatePlatformResponse(response);
  return structuredClone(response);
}

function makeEnvironment(extraEnvironment) {
  if (extraEnvironment === undefined) return process.env;
  if (!isPlainObject(extraEnvironment)) throw new TypeError("MCP stdio env must be an object");
  for (const [key, value] of Object.entries(extraEnvironment)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || typeof value !== "string" || value.includes("\0")) {
      throw new TypeError("MCP stdio env keys/values are invalid");
    }
  }
  return { ...process.env, ...extraEnvironment };
}

function createSession(options, signal) {
  const child = spawn(options.command, options.args, {
    cwd: options.cwd,
    env: options.env,
    shell: false,
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"]
  });
  let nextId = 0;
  let stdoutBuffer = "";
  let stderrBytes = 0;
  let closed = false;
  const pending = new Map();
  let rejectClosed;
  const closedPromise = new Promise((_, reject) => { rejectClosed = reject; });

  function closeWith(error) {
    if (closed) return;
    closed = true;
    const safeError = error instanceof Error ? error : boundedError("mcp_process_error", String(error));
    for (const waiter of pending.values()) waiter.reject(safeError);
    pending.clear();
    rejectClosed(safeError);
  }

  function send(method, params = {}) {
    if (closed || child.stdin.destroyed) return Promise.reject(boundedError("mcp_process_closed", "MCP stdio process is closed"));
    const id = ++nextId;
    const request = { jsonrpc: "2.0", id, method, params };
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      try {
        child.stdin.write(`${JSON.stringify(request)}\n`);
      } catch (error) {
        pending.delete(id);
        reject(error);
      }
    });
  }

  function notify(method, params) {
    if (closed || child.stdin.destroyed) throw boundedError("mcp_process_closed", "MCP stdio process is closed");
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  }

  function consumeLine(line) {
    if (!line.trim()) return;
    if (Buffer.byteLength(line, "utf8") > MAX_STDOUT_LINE_BYTES) {
      closeWith(boundedError("mcp_stdout_limit", "MCP stdio response line exceeds the bounded limit"));
      return;
    }
    let message;
    try {
      message = parseJsonStrict(line);
    } catch {
      closeWith(boundedError("mcp_invalid_json", "MCP stdio emitted invalid JSON"));
      return;
    }
    if (!isPlainObject(message) || message.jsonrpc !== "2.0" || !Number.isSafeInteger(message.id)) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (isPlainObject(message.error)) {
      const error = boundedError("mcp_rpc_error", safeMessage(message.error.message));
      waiter.reject(error);
    } else {
      waiter.resolve(message.result);
    }
  }

  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdoutBuffer += chunk;
    let newline;
    while ((newline = stdoutBuffer.indexOf("\n")) >= 0) {
      const line = stdoutBuffer.slice(0, newline).replace(/\r$/, "");
      stdoutBuffer = stdoutBuffer.slice(newline + 1);
      consumeLine(line);
      if (closed) return;
    }
    if (Buffer.byteLength(stdoutBuffer, "utf8") > MAX_STDOUT_LINE_BYTES) {
      closeWith(boundedError("mcp_stdout_limit", "MCP stdio response line exceeds the bounded limit"));
    }
  });
  child.stderr.on("data", (chunk) => {
    stderrBytes += Buffer.byteLength(chunk);
    if (stderrBytes > MAX_STDERR_BYTES) closeWith(boundedError("mcp_stderr_limit", "MCP stdio stderr exceeds the bounded limit"));
  });
  child.on("error", (error) => closeWith(Object.assign(error, { code: error.code || "mcp_process_error" })));
  child.on("exit", (code, signalName) => {
    if (!closed) closeWith(boundedError("mcp_process_exit", `MCP stdio exited before completing the call (${code ?? "signal"}${signalName ? `/${signalName}` : ""})`));
  });

  const abort = () => {
    if (!closed) {
      closeWith(boundedError("connector_aborted", "MCP stdio call was aborted"));
      child.kill();
    }
  };
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }

  return {
    child,
    send,
    notify,
    closedPromise,
    close: () => {
      if (!closed) {
        closed = true;
        for (const waiter of pending.values()) waiter.reject(boundedError("mcp_process_closed", "MCP stdio process closed"));
        pending.clear();
        child.kill();
      }
      if (signal) signal.removeEventListener("abort", abort);
    }
  };
}

/**
 * Build a trusted connector for a user-supplied MCP server process.
 * The connector is inert until its `call` method is invoked by dispatchOutbox
 * with allowNetwork=true. It receives only the derived Dispatch, never the
 * project root or a State/Canon writer.
 */
export function createMcpStdioConnector(options = {}) {
  if (options.trusted !== true) throw new TypeError("MCP stdio connector requires explicit trusted=true after server review");
  const id = assertIdentifier(options.id || "mcp.stdio", "MCP connector id");
  const command = assertCommand(options.command);
  const args = assertArgs(options.args || []);
  const protocolVersion = typeof options.protocolVersion === "string" && options.protocolVersion.trim()
    ? options.protocolVersion.trim()
    : DEFAULT_PROTOCOL_VERSION;
  const clientName = typeof options.clientName === "string" && options.clientName.trim() ? options.clientName.trim() : "cineweave-world-os";
  const clientVersion = typeof options.clientVersion === "string" && options.clientVersion.trim() ? options.clientVersion.trim() : "0.4.0";
  if (options.cwd !== undefined && (typeof options.cwd !== "string" || !options.cwd.trim())) throw new TypeError("MCP stdio cwd must be a non-empty path when provided");
  const env = makeEnvironment(options.env);

  return {
    kind: "world_os_mcp_connector",
    trusted: true,
    id,
    async call(dispatch, { signal } = {}) {
      if (!isPlainObject(dispatch) || dispatch.transport !== "mcp" || typeof dispatch.toolName !== "string" || !isPlainObject(dispatch.arguments)) {
        throw new TypeError("MCP stdio connector accepts only an exact MCP Dispatch");
      }
      const session = createSession({ command, args, cwd: options.cwd, env }, signal);
      try {
        await session.send("initialize", {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: clientName, version: clientVersion }
        });
        session.notify("notifications/initialized", {});
        const result = await Promise.race([session.send("tools/call", {
          name: dispatch.toolName,
          arguments: structuredClone(dispatch.arguments)
        }), session.closedPromise]);
        const response = extractPlatformResponse(result);
        if (response.idempotencyKey !== dispatch.idempotencyKey) throw boundedError("mcp_idempotency_mismatch", "MCP platform response idempotency key does not match the Dispatch");
        return response;
      } finally {
        session.close();
      }
    }
  };
}
