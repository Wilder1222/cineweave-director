// Runtime feature releases and persisted wire contracts evolve independently.
// v0.4.0 adds observation-only ExternalSignal ingestion/use receipts, explicit
// trigger timing and a weighted-fair multi-world Portfolio run. The additive
// persisted artifacts remain on the pre-1.0 0.1.0 wire contract until a migration exists.
export const WORLD_OS_IMPLEMENTATION_VERSION = "0.4.0";
export const WORLD_OS_CONTRACT_VERSION = "0.1.0";
export const WORLD_OS_VERSION = WORLD_OS_CONTRACT_VERSION;

export const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;
export const WORLD_ID_PATTERN = /^W[0-9]{2}$/;
export const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;

export const LOCK_LEVELS = new Set(["hard", "soft", "free", "undefined"]);
export const LOCK_STATUSES = new Set(["proposed", "active", "unresolved", "rejected", "superseded"]);
export const PORTFOLIO_ROLES = new Set(["primary", "incubator", "lab"]);
export const WORLD_STAGES = new Set([
  "candidate_card",
  "world_bible_draft",
  "prototype",
  "active_production",
  "paused",
  "retired"
]);
export const CANON_DISPOSITIONS = new Set(["proposal", "committed", "superseded", "rejected"]);

export const ARTIFACT_KINDS = Object.freeze({
  workspace: "world_os_workspace",
  worldCard: "world_os_world_design_proposal",
  candidateCard: "world_os_world_candidate_card",
  platformProfile: "world_os_platform_profile",
  providerPolicy: "world_os_llm_provider_policy",
  simulationRequest: "world_os_simulation_request",
  triggerCatalog: "world_os_trigger_catalog",
  actionCatalog: "world_os_action_catalog",
  eventTemplateCatalog: "world_os_event_template_catalog",
  branchSet: "world_os_branch_set",
  runReceipt: "world_os_simulation_run_receipt",
  state: "world_os_state_snapshot",
  proposal: "world_os_event_proposal",
  decision: "world_os_transition_decision",
  commit: "world_os_event_commit",
  projection: "world_os_platform_projection",
  receipt: "world_os_publish_receipt",
  gateRequest: "world_os_gate_request",
  gateDecision: "world_os_gate_decision",
  canonFact: "world_os_canon_fact",
  continuityLedger: "world_os_continuity_ledger",
  canonPromotion: "world_os_canon_promotion",
  templateWorkItem: "world_os_template_work_item",
  externalSignal: "world_os_external_signal",
  externalSignalUse: "world_os_external_signal_use",
  portfolioRunReceipt: "world_os_portfolio_run_receipt",
  worldRegistration: "world_os_world_registration",
  worldInceptionDecision: "world_os_world_inception_decision",
  brandEcho: "world_os_brand_echo",
  brandEchoDecision: "world_os_brand_echo_decision",
  productionContractSnapshot: "world_os_production_contract_snapshot",
  productionSlice: "world_os_production_slice",
  productionGateDecision: "world_os_production_gate_decision",
  productionMediaImport: "world_os_production_media_import",
  productionQaReview: "world_os_production_qa_review",
  approvedAsset: "world_os_approved_asset",
  releaseReceipt: "world_os_release_receipt",
  mcpDispatchClaim: "world_os_mcp_dispatch_claim",
  mcpAttemptReceipt: "world_os_mcp_attempt_receipt",
  llmShadowReceipt: "world_os_llm_shadow_receipt",
  codexBrainRunReceipt: "world_os_codex_brain_run_receipt"
});

export const GATE_DECISIONS = new Set(["approve", "reject", "revise"]);
export const CANON_FACT_STATUSES = new Set(["active", "conflicted", "superseded", "rejected"]);
export const CANON_LOCK_LEVELS = new Set(["hard", "soft", "free"]);

export const SEVERITY_ORDER = Object.freeze({ error: 0, warning: 1, info: 2 });

export function assertIdentifier(value, label = "identifier") {
  if (!IDENTIFIER_PATTERN.test(value || "")) throw new TypeError(`${label} is invalid`);
  return value;
}
