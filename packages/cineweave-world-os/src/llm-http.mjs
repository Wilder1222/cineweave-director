import { canonicalize, parseJsonStrict } from "../../cineweave-runtime/src/canonical-json.mjs";
import { assertEventProposalContract } from "./engine.mjs";
import { isPlainObject } from "./json.mjs";

const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_CONTEXT_BYTES = 512 * 1024;

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value)) throw new TypeError(`${label} must be a bounded identifier`);
  return value;
}

function assertEndpoint(value) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError("LLM endpoint must be a non-empty URL");
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new TypeError("LLM endpoint must be an http(s) URL without embedded credentials");
  return parsed.toString();
}

function boundedError(code, message) {
  const error = new Error(typeof message === "string" && message.length <= 512 ? message : String(message).slice(0, 512));
  error.code = code;
  return error;
}

function extractTextContent(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const text = value
      .filter((part) => isPlainObject(part) && (part.type === "text" || part.type === "output_text") && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
    if (text) return text;
  }
  return null;
}

function extractModelPayload(body) {
  if (!isPlainObject(body)) throw boundedError("provider_invalid_response", "LLM response body must be an object");
  if (isPlainObject(body.proposal)) return { proposal: body.proposal, usage: body.usage || null };
  const choice = Array.isArray(body.choices) ? body.choices[0] : null;
  const message = isPlainObject(choice?.message) ? choice.message : null;
  const parsed = message && isPlainObject(message.parsed) ? message.parsed : null;
  if (parsed) return { proposal: parsed.proposal || parsed, usage: body.usage || parsed.usage || null };
  const text = extractTextContent(message?.content) || extractTextContent(body.output_text);
  if (!text) throw boundedError("provider_proposal_missing", "LLM response did not contain a JSON proposal");
  let payload;
  try {
    payload = parseJsonStrict(text);
  } catch {
    throw boundedError("provider_invalid_json", "LLM response content was not strict JSON");
  }
  if (!isPlainObject(payload)) throw boundedError("provider_invalid_json", "LLM response JSON must be an object");
  return { proposal: payload.proposal || payload, usage: body.usage || payload.usage || null };
}

function sanitizeCondition(candidate) {
  if (!isPlainObject(candidate)) return candidate;
  if (Array.isArray(candidate.all)) return { all: candidate.all.map(sanitizeCondition) };
  if (Array.isArray(candidate.any)) return { any: candidate.any.map(sanitizeCondition) };
  if (Object.hasOwn(candidate, "not")) return { not: sanitizeCondition(candidate.not) };
  return Object.fromEntries(["path", "op", "value"].filter((field) => Object.hasOwn(candidate, field)).map((field) => [field, structuredClone(candidate[field])]));
}

function sanitizeProposal(candidate) {
  if (!isPlainObject(candidate)) throw boundedError("provider_invalid_proposal", "LLM proposal must be an object");
  const fields = [
    "kind", "contractVersion", "proposalId", "eventId", "proposalVersion", "worldId", "stream", "workspaceRef", "worldCardRef",
    "baseStateRef", "platformProfileRef", "triggerCatalogRef", "actionCatalogRef", "eventTemplateCatalogRef", "eventTemplateId",
    "parentCommitRef", "expectedSequence", "proposedAt", "source", "branchRole", "title", "publicSummary", "objective", "opposition",
    "choiceUnderPressure", "stateChange", "causesNext", "irreversibility", "delayedConsequences", "realizesConsequenceRefs",
    "trigger", "participants", "actions", "canonImpact", "publicationIntent"
  ];
  const proposal = Object.fromEntries(fields.filter((field) => Object.hasOwn(candidate, field)).map((field) => [field, structuredClone(candidate[field])]));
  if (isPlainObject(proposal.source)) {
    proposal.source = Object.fromEntries(["origin", "authority", "providerId", "requestRef"].filter((field) => Object.hasOwn(proposal.source, field)).map((field) => [field, structuredClone(proposal.source[field])]));
  }
  if (isPlainObject(proposal.trigger)) {
    proposal.trigger = Object.fromEntries(["triggerId", "type", "occurredAt", "locationId", "preconditions", "unknownPolicy"].filter((field) => Object.hasOwn(proposal.trigger, field)).map((field) => [field, structuredClone(proposal.trigger[field])]));
    if (Object.hasOwn(proposal.trigger, "preconditions")) proposal.trigger.preconditions = sanitizeCondition(proposal.trigger.preconditions);
  }
  if (Array.isArray(proposal.actions)) proposal.actions = proposal.actions.map((action) => isPlainObject(action)
    ? Object.fromEntries(["actionId", "parameters"].filter((field) => Object.hasOwn(action, field)).map((field) => [field, structuredClone(action[field])]))
    : action);
  if (Array.isArray(proposal.delayedConsequences)) proposal.delayedConsequences = proposal.delayedConsequences.map((consequence) => isPlainObject(consequence)
    ? Object.fromEntries(["id", "targetEventId", "description", "when"].filter((field) => Object.hasOwn(consequence, field)).map((field) => [field, field === "when" ? sanitizeCondition(consequence[field]) : structuredClone(consequence[field])]))
    : consequence);
  if (isPlainObject(proposal.publicationIntent)) {
    proposal.publicationIntent = Object.fromEntries(["platformId", "lane", "audience"].filter((field) => Object.hasOwn(proposal.publicationIntent, field)).map((field) => [field, structuredClone(proposal.publicationIntent[field])]));
  }
  return proposal;
}

async function readBoundedText(response, maxBytes) {
  if (!response.body?.getReader) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maxBytes) throw boundedError("provider_response_limit", "LLM response exceeds the bounded limit");
    return text;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw boundedError("provider_response_limit", "LLM response exceeds the bounded limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
}

function readUsage(rawUsage, modelAlias, costPer1kOutputTokens) {
  if (!isPlainObject(rawUsage)) throw boundedError("provider_usage_missing", "LLM response did not include usage metadata");
  const outputTokens = rawUsage.output_tokens ?? rawUsage.completion_tokens ?? rawUsage.outputTokens;
  const reportedCost = rawUsage.cost_usd ?? rawUsage.costUsd;
  const costUsd = reportedCost ?? (Number.isFinite(costPer1kOutputTokens) && Number(costPer1kOutputTokens) >= 0
    ? Number(outputTokens) * Number(costPer1kOutputTokens) / 1000
    : null);
  if (!Number.isSafeInteger(outputTokens) || outputTokens < 0 || !Number.isFinite(costUsd) || costUsd < 0) {
    throw boundedError("provider_usage_invalid", "LLM usage metadata is missing bounded output token or cost values");
  }
  return { modelAlias, outputTokens, costUsd };
}

/**
 * Create a provider for chat-completions-compatible JSON endpoints.
 * Creating this object performs no network request. `runLlmShadow` still
 * requires allowNetwork=true for non-local providers and persists only the
 * validated proposal plus usage evidence.
 */
export function createOpenAiCompatibleProvider(options = {}) {
  if (options.trusted !== true) throw new TypeError("OpenAI-compatible provider requires explicit trusted=true after endpoint/policy review");
  const id = assertIdentifier(options.id || "llm.openai-compatible", "LLM provider id");
  const modelAlias = typeof options.modelAlias === "string" && options.modelAlias.trim() ? options.modelAlias.trim() : null;
  if (!modelAlias) throw new TypeError("LLM modelAlias must be a non-empty string");
  const endpoint = assertEndpoint(options.endpoint);
  const apiKeyEnv = options.apiKeyEnv === undefined ? "OPENAI_API_KEY" : options.apiKeyEnv;
  if (apiKeyEnv !== null && (typeof apiKeyEnv !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(apiKeyEnv))) throw new TypeError("LLM apiKeyEnv is invalid");
  const maxResponseBytes = Number(options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES);
  if (!Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 1024 || maxResponseBytes > 16 * 1024 * 1024) throw new TypeError("LLM maxResponseBytes is outside the bounded range");
  const costPer1kOutputTokens = options.costPer1kOutputTokens === undefined ? null : Number(options.costPer1kOutputTokens);
  if (costPer1kOutputTokens !== null && (!Number.isFinite(costPer1kOutputTokens) || costPer1kOutputTokens < 0)) throw new TypeError("LLM costPer1kOutputTokens must be finite and non-negative");
  const extraHeaders = options.headers === undefined ? {} : options.headers;
  if (!isPlainObject(extraHeaders) || Object.entries(extraHeaders).some(([key, value]) => !/^[A-Za-z0-9-]+$/.test(key) || typeof value !== "string" || value.includes("\0") || key.toLowerCase() === "authorization")) {
    throw new TypeError("LLM headers must be plain, NUL-free strings and cannot override Authorization");
  }
  const responseFormat = options.responseFormat === undefined ? { type: "json_object" } : structuredClone(options.responseFormat);

  return {
    kind: "world_os_llm_provider",
    trusted: true,
    id,
    modelAlias,
    async propose(request, { signal } = {}) {
      let context = null;
      if (options.context !== undefined) context = typeof options.context === "function" ? await options.context(structuredClone(request)) : structuredClone(options.context);
      if (context !== null && !isPlainObject(context)) throw boundedError("provider_context_invalid", "LLM context must be a plain object");
      const input = { request: structuredClone(request), context };
      const inputBytes = Buffer.byteLength(canonicalize(input), "utf8");
      if (inputBytes > MAX_CONTEXT_BYTES) throw boundedError("provider_context_limit", "LLM request context exceeds the bounded limit");
      const apiKey = apiKeyEnv ? process.env[apiKeyEnv] : undefined;
      const headers = { "content-type": "application/json", ...extraHeaders };
      if (apiKey !== undefined) {
        if (typeof apiKey !== "string" || !apiKey.trim() || apiKey.includes("\0")) throw boundedError("provider_credentials_invalid", "LLM API key environment value is invalid");
        headers.authorization = `Bearer ${apiKey}`;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        signal,
        body: JSON.stringify({
          model: modelAlias,
          temperature: 0,
          messages: [
            {
              role: "system",
              content: "You are a proposal-only world simulation provider. Return exactly one JSON EventProposal candidate. You cannot approve, commit, mutate state, write Canon, invent effects, or reveal hidden reasoning. Use only the exact request references, allowed actors/actions/triggers, and provided context."
            },
            { role: "user", content: JSON.stringify(input) }
          ],
          response_format: responseFormat
        })
      });
      const text = await readBoundedText(response, maxResponseBytes);
      let body;
      try {
        body = parseJsonStrict(text);
      } catch {
        throw boundedError("provider_invalid_json", "LLM HTTP response was not strict JSON");
      }
      if (!response.ok) throw boundedError("provider_http_error", `LLM HTTP request failed with status ${response.status}`);
      const extracted = extractModelPayload(body);
      const proposal = sanitizeProposal(extracted.proposal);
      assertEventProposalContract(proposal);
      return { proposal, usage: readUsage(extracted.usage, modelAlias, costPer1kOutputTokens) };
    }
  };
}
