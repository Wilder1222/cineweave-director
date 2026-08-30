import { listArtifacts } from "../../../packages/cineweave-runtime/src/artifact-store.mjs";
import { createOpenAiCompatibleProvider } from "../../../packages/cineweave-world-os/src/llm-http.mjs";
import { ARTIFACT_KINDS } from "../../../packages/cineweave-world-os/src/constants.mjs";
import { sameRef } from "../../../packages/cineweave-world-os/src/json.mjs";

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) throw new Error(`${name} must be set for the explicit HTTP shadow profile example`);
  return value.trim();
}

function latestEnabledPolicy(artifacts) {
  const requestedId = process.env.WORLD_OS_LLM_POLICY_ID;
  const candidates = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.providerPolicy)
    .filter((item) => item.envelope.payload.enabled === true)
    .filter((item) => requestedId === undefined || item.envelope.payload.policyId === requestedId)
    .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version
      || right.envelope.artifactRef.contentHash.localeCompare(left.envelope.artifactRef.contentHash));
  if (!candidates.length) return null;
  if (requestedId === undefined && new Set(candidates.map((item) => item.envelope.payload.policyId)).size > 1) {
    throw new Error("WORLD_OS_LLM_POLICY_ID must select one enabled ProviderPolicy");
  }
  return candidates[0];
}

function requestForPolicy(artifacts, policyRef) {
  const requestedId = process.env.WORLD_OS_LLM_REQUEST_ID;
  const candidates = artifacts
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.simulationRequest)
    .filter((item) => sameRef(item.envelope.payload.providerPolicyRef, policyRef))
    .filter((item) => requestedId === undefined || item.envelope.payload.requestId === requestedId)
    .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version
      || right.envelope.artifactRef.contentHash.localeCompare(left.envelope.artifactRef.contentHash));
  if (!candidates.length) return null;
  if (requestedId === undefined && new Set(candidates.map((item) => item.envelope.payload.requestId)).size > 1) {
    throw new Error("WORLD_OS_LLM_REQUEST_ID must select one SimulationRequest");
  }
  return candidates[0];
}

/**
 * Server-side profile factory for `world-os serve --shadow-profiles`.
 *
 * It performs no network request while loading. A deployment must first store an
 * enabled ProviderPolicy and an exact SimulationRequest bound to that policy,
 * then opt in with `--allow-llm-network`; the API caller can only select the
 * returned profile id.
 */
export default async function createHttpShadowProfiles({ projectRoot }) {
  const artifacts = await listArtifacts(projectRoot);
  const policyItem = latestEnabledPolicy(artifacts);
  if (!policyItem) throw new Error("No enabled ProviderPolicy is available for the HTTP shadow profile");
  const requestItem = requestForPolicy(artifacts, policyItem.envelope.artifactRef);
  if (!requestItem) throw new Error("No exact SimulationRequest is bound to the enabled ProviderPolicy");
  const provider = createOpenAiCompatibleProvider({
    id: process.env.WORLD_OS_LLM_PROVIDER_ID || "llm.openai-compatible.server",
    trusted: process.env.WORLD_OS_LLM_TRUSTED === "true",
    endpoint: required("WORLD_OS_LLM_ENDPOINT"),
    modelAlias: required("WORLD_OS_LLM_MODEL"),
    apiKeyEnv: process.env.WORLD_OS_LLM_API_KEY_ENV || "OPENAI_API_KEY",
    costPer1kOutputTokens: process.env.WORLD_OS_LLM_COST_PER_1K_OUTPUT_TOKENS === undefined
      ? undefined
      : Number(process.env.WORLD_OS_LLM_COST_PER_1K_OUTPUT_TOKENS)
  });
  return [{
    id: process.env.WORLD_OS_LLM_PROFILE_ID || "server-openai-shadow",
    requestDocument: requestItem.envelope.payload,
    policyDocument: policyItem.envelope.payload,
    provider,
    allowNetwork: true,
    forceRetry: false
  }];
}
