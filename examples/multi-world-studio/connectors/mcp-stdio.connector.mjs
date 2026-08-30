import { createMcpStdioConnector } from "../../../packages/cineweave-world-os/src/mcp-stdio.mjs";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`${name} must be set for the explicit MCP connector example`);
  return value;
}

export default function createConnector() {
  const args = process.env.WORLD_OS_MCP_ARGS_JSON ? JSON.parse(process.env.WORLD_OS_MCP_ARGS_JSON) : [];
  return createMcpStdioConnector({
    id: process.env.WORLD_OS_MCP_CONNECTOR_ID || "mcp.stdio.private",
    trusted: process.env.WORLD_OS_MCP_TRUSTED === "true",
    command: required("WORLD_OS_MCP_COMMAND"),
    args,
    protocolVersion: process.env.WORLD_OS_MCP_PROTOCOL_VERSION,
    clientName: "cineweave-world-os"
  });
}
