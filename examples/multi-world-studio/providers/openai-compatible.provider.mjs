import { createOpenAiCompatibleProvider } from "../../../packages/cineweave-world-os/src/llm-http.mjs";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`${name} must be set for the explicit LLM provider example`);
  return value;
}

export default function createProvider() {
  return createOpenAiCompatibleProvider({
    id: process.env.WORLD_OS_LLM_PROVIDER_ID || "llm.openai-compatible.private",
    trusted: process.env.WORLD_OS_LLM_TRUSTED === "true",
    endpoint: required("WORLD_OS_LLM_ENDPOINT"),
    modelAlias: required("WORLD_OS_LLM_MODEL"),
    apiKeyEnv: process.env.WORLD_OS_LLM_API_KEY_ENV || "OPENAI_API_KEY",
    costPer1kOutputTokens: process.env.WORLD_OS_LLM_COST_PER_1K_OUTPUT_TOKENS === undefined
      ? undefined
      : Number(process.env.WORLD_OS_LLM_COST_PER_1K_OUTPUT_TOKENS)
  });
}
