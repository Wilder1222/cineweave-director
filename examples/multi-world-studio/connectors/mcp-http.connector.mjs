import { createMcpHttpConnector } from "../../../packages/cineweave-world-os/src/mcp-http.mjs";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`${name} must be set for the explicit MCP HTTP connector example`);
  return value;
}

export default function createConnector() {
  return createMcpHttpConnector({
    id: process.env.WORLD_OS_MCP_HTTP_CONNECTOR_ID || "mcp.http.private",
    trusted: process.env.WORLD_OS_MCP_HTTP_TRUSTED === "true",
    endpoint: required("WORLD_OS_MCP_HTTP_ENDPOINT"),
    apiKeyEnv: process.env.WORLD_OS_MCP_HTTP_API_KEY_ENV || null,
    protocolVersion: process.env.WORLD_OS_MCP_PROTOCOL_VERSION,
    clientName: "cineweave-world-os"
  });
}
