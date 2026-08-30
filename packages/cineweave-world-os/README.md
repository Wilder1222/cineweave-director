# CineWeave World OS

World OS is the executable control plane for the multi-world studio example. It keeps Codex as the only authoritative writer while separating action catalogs, event templates, branch proposals, deterministic review, append-only branch commits, platform projections and receipts.

Implementation release: `0.4.0` (ExternalSignal observation intake/use receipts, explicit trigger timing and weighted-fair Portfolio scheduling, Gate, Canon promotion and template resume). Persisted wire contract: `0.1.0`. These versions are intentionally separate until a contract migration is provided.

New `SimulationRunReceipt` records use `implementationVersion: "0.4.0"`; the schema still accepts immutable `0.3.0` receipts so upgrading the runtime does not rewrite historical runs.

The first implementation is deliberately proposal-only:

- W01 and W02 are machine-readable design proposals, not approved Canon.
- W03 and W04 are candidate cards.
- ordinary story evolution may advance `simulation.main`, which is always labelled non-Canon;
- a hard lock, candidate fact or Canon mutation stops at a human Gate;
- an approved Gate resumes the exact proposal and can promote its exact Commit into an independent Canon head;
- missing Codex templates create a resumable work item rather than inventing effects;
- `create-world` first creates an immutable candidate `WorldRegistration`; only the latest named human inception approval can attach a complete runtime package and make a world schedulable;
- `brand-echo-create` registers a cross-world L1 motif, while `brand-echo-decide`/`brand-echo-activate` require a separate human Gate and forbid Canon impact, shared Actor/Item refs and cross-world causality;
- `production-slice-create` binds an exact simulation Commit/State to external Story/Character/Scene/Style/Shot/Prompt/Production/Rights snapshots; ordered production Gates can advance only to a private workspace release, never to a public platform by implication;
- `production-execution-plan` compiles an exact ProductionSlice plus its approved Rights stage into a provider-neutral RenderPlan and generic `ExecutionRequest`; `production-execution-run` re-verifies the latest slice version before delegating to the generic adapter runtime, which writes a dry-run/fixture/external `ExecutionReceipt` or a blocked receipt;
- `production-media-import` converts only a successful image-bearing `ExecutionReceipt` (PNG/JPEG/WebP, immutable bytes/hash/dimensions) into a draft `MediaImport` and a deterministic World OS binding; `production-media-imports` verifies and lists those bindings. This callback never marks QA, `ApprovedAsset`, or Release complete; attach its binding ref as human QA evidence and advance the existing Gates explicitly;
- `production-qa-review` records the human checklist and exact MediaImport bindings for a `qa_pending` slice; after the QA Gate is activated, `production-approved-asset` materializes an immutable private `ApprovedAsset` binding. After the Release Gate is activated, `production-private-release` writes a `private_workspace` ReleaseReceipt that can optionally reference successful non-authoritative PublishReceipts. None of these commands creates a public release by implication;
- platform feedback is accepted only as a deduplicated, privacy-bounded `ExternalSignal` proposal input;
- a Portfolio run may schedule multiple runnable worlds with weighted fairness, while each world keeps its own CAS stream head and stop reason;
- `brain-run` is the bounded Codex control surface: it records preflight health, optional proposal-only LLM shadows, one Portfolio run, MCP dry-run/opt-in dispatch and postflight health in a single auditable receipt;
- MCP receives a derived projection and can never mutate Canon;
- a future LLM provider can generate proposals but cannot approve, commit or write state.

The current Decision Cycle is:

```text
scan conditions → materialize exact catalog actions → compile 1–3 candidates
→ hard-constraint evaluation → template-score selection → terminal simulation commit
→ projection → run receipt with an explicit stop reason

Gated path:

needs_human_gate → GateRequest → human GateDecision
→ exact simulation resume → CanonFact/ContinuityLedger → Canon promotion
```

Proposals carry only `actionId + parameters`; costs and effects are materialized from an exact `actionCatalogRef`. The current contract deliberately permits only empty parameters. This prevents Codex or a future model from self-authoring arbitrary state effects while leaving a versioned path for bounded parameters later.

## Commands

Prepare one fresh store:

```powershell
npm run worlds:review
npm run worlds:rebuild
npm run worlds:triggers
npm run worlds:actions
npm run worlds:run
npm run worlds:head
npm run worlds:audit
npm run worlds:reconcile
npm run worlds:outbox
npm run worlds:signals
```

`npm run worlds:step` advances one cycle instead of the bounded run. The three `worlds:simulate*` fixture commands are a separate manual path and require their own fresh store; do not replay them after `worlds:run` on the same branch head.

`worlds:run` advances W01 through three catalog-backed events and stops at `no_due_trigger`. To exercise the independent W02 stream, run `npm run worlds -- run .build/multi-world-studio W02 --max-steps 10`; exit code `3` is the intentional `needs_human_gate` result after one safe baseline-measurement commit.

`worlds:portfolio` runs a bounded weighted-fair scheduler over W01/W02. It invokes one existing single-world cycle at a time, records a `PortfolioRunReceipt`, and removes a world from the current budget only when it reaches an explicit stop reason such as `no_due_trigger` or `needs_human_gate`. If any world is blocked, the portfolio receipt is `blocked` even when other worlds made progress; `committedSteps` still records that progress, and the CLI returns exit code `3` so an operator can resume the required human or Codex input.

`worlds:brain` / `world-os brain-run` is the single bounded Codex Brain entry point. It never grants a model or platform write authority: simulation still goes through the deterministic Portfolio scheduler, LLM inputs are optional `proposal_only` shadows, and MCP is dry-run unless both `--allow-network` and a trusted connector are supplied. The resulting `CodexBrainRunReceipt` binds the exact Portfolio, shadow receipts, MCP attempts/PublishReceipts and health summaries. For an idempotent retry, provide a stable `--run-key`; if a process stopped after a Portfolio child receipt but before the final Brain receipt, pass that exact receipt with `--resume-portfolio`. No hidden in-memory state is required.

The rebuild target is `.build/multi-world-studio`; it is generated from committed source JSON and is ignored by Git. `publish-local` is a deterministic fixture for tests. It does not contact an external platform.

`world-os audit` classifies uncommitted staging artifacts without deleting them and now lists Production ExecutionRequests/Receipts alongside the slice and Gate chain. `world-os recover` rebuilds missing projections and repeats that classification; a deterministic retry can reuse staging after a pre-commit crash because successor state IDs are proposal-hash-scoped and only the commit sequence is authoritative.

The v0.4 Gate/Canon and observation commands are:

```powershell
world-os gate-request <project> <decision-ref.json>
world-os gate-decide <project> <gate-request-ref.json> --decision approve --actor <human-id>
world-os resume <project> <gate-decision-ref.json>
world-os promote <project> <gate-decision-ref.json>
world-os canon-head <project> <world-id>
world-os template-submit <project> <event-template-catalog.json>
world-os template-resume <project> <work-item-ref.json> <event-template-catalog.json>
world-os signal-ingest <project> <external-signal.json>
world-os signals <project> [--world-id <W##>]
world-os signal-use <project> <signal-ref.json> --outcome <used_as_evidence|deferred_for_context|dismissed_as_noise> [--proposal <proposal-ref.json>]
world-os signal-uses <project> [--world-id <W##>] [--outcome <outcome>]
world-os create-world <project> <candidate-card.json> [--allocation-share <1..100>]
world-os world-registrations <project> [--world-id <W##>]
world-os world-inception-decide <project> <registration-ref.json> --decision <approve|reject|revise> --actor <id> [--rationale <text>]
world-os world-inception-decisions <project> [--registration-ref <registration-ref.json>]
world-os world-activate <project> <registration-ref.json> <decision-ref.json> <world-design.json> <state.json> <trigger-catalog.json> <action-catalog.json> <event-template-catalog.json> [--platform <platform-profile.json>] [--stage <world_bible_draft|prototype>]
world-os brand-echo-create <project> --worlds <W01,W02,...> --symbol-id <id> --surface <text> --intent <text>
world-os brand-echoes <project> [--status <proposed|approved|retired>]
world-os brand-echo-decide <project> <echo-ref.json> --decision <approve|reject|revise> --actor <id> [--rationale <text>]
world-os brand-echo-decisions <project> [--echo-ref <echo-ref.json>]
world-os brand-echo-activate <project> <echo-ref.json> <decision-ref.json>
world-os production-slice-create <project> <production-manifest.json>
world-os production-slices <project> [--world-id <W##>] [--status <proposed|approved|released|blocked>]
world-os production-gate-decide <project> <slice-ref.json> --gate <story_ready|character_identity|scene_geography|style_activation|rights|qa|release> --decision <approve|reject|revise> --actor <id>
world-os production-gates <project> <slice-ref.json>
world-os production-stage-activate <project> <slice-ref.json> <decision-ref.json>
world-os production-execution-plan <project> <slice-ref.json> <execution-manifest.json>
world-os production-execution-requests <project> [--world-id <W##>] [--status <ready|blocked>]
world-os production-execution-run <project> <request-ref.json> [--adapter <adapter.mjs>] [--allow-external]
world-os production-media-import <project> <request-ref.json> <execution-receipt-ref.json> [--media-type <still|storyboard_frame|keyframe_candidate>] [--source <codex_interactive|user_upload|external_adapter>]
world-os production-media-imports <project> [--world-id <W##>] [--status <candidate|blocked>]
world-os production-qa-review <project> <qa-pending-slice-ref.json> --decision approve --actor <id> --checklist <checklist.json> --media <binding-ref.json,...>
world-os production-qa-reviews <project> [--world-id <W##>] [--status <approved|rejected|needs_revision>]
world-os production-approved-asset <project> <approved-asset-slice-ref.json> <qa-review-ref.json>
world-os production-approved-assets <project> [--world-id <W##>]
world-os production-private-release <project> <released-slice-ref.json> <approved-asset-ref.json,...> --actor <id> [--publish-receipts <ref.json,...>]
world-os production-private-releases <project> [--world-id <W##>]
world-os dispatch <project> <platform-profile.json> [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--allow-network] [--dry-run] [--max-attempts <1..10>]
world-os mcp-claims <project>
world-os mcp-attempts <project>
world-os llm-shadow <project> <simulation-request.json> <provider-policy.json> [<provider.mjs> | --http-endpoint <url> --model <alias> --llm-trusted --api-key-env <ENV>] [--allow-network] [--force-retry]
world-os llm-shadow-runs <project> [--world-id <W##>] [--provider-id <id>]
world-os portfolio-run <project> [--worlds <W01,W02>] [--max-cycles <1..100>]
world-os brain-run <project> [--worlds <W01,W02>] [--max-cycles <1..100>] [--run-key <idempotency-key>] [--resume-portfolio <portfolio-receipt.json>] [--platform <platform-profile.json>] [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--allow-network] [--dry-run] [--shadow-request <file> --shadow-policy <file> [--shadow-provider <module> | --shadow-endpoint <url> --shadow-model <alias> --shadow-llm-trusted --shadow-api-key-env <ENV>]]
world-os brain-status <project> [--worlds <W01,W02>]
world-os brain-runs <project>
world-os serve <project> [--host <127.0.0.1>] [--port <0..65535>] [--token-env <ENV>] [--allow-network] [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--shadow-profiles <profiles.mjs>] [--allow-llm-network]
```

`resume` never replays a different proposal or regenerates effects from free text. `promote` requires the approved Commit to remain the current simulation head and binds it to the Gate-requested Canon head. Conflicting facts remain visible as unresolved; no latest-version heuristic selects a winner.

`signal-ingest` accepts only an observation linked to a successful PublishReceipt and exact platform profile. The stored signal contains no raw text or user identity, uses a deterministic source-event hash for deduplication, and is routed as `proposal_input_only`; it never mutates State or Canon.

`signal-use` records the Codex decision that a signal was used as evidence for an exact simulation Proposal, deferred for more context, or dismissed as noise. It is an immutable, content-addressed receipt; it never grants the signal authority to write State or Canon.

The production execution bridge is intentionally provider-neutral. It copies the selected PromptRecord into the immutable runtime store, derives a RenderPlan, binds the exact ProductionSlice and all contract snapshots as `inputArtifactRefs`, and computes a strict preflight. Non-dry execution is eligible only at the `qa_pending` stage (all Gates through Rights approved); a request compiled earlier is persisted as `blocked`. Before an adapter call, `production-execution-run` rejects stale slice versions and delegates to the generic adapter runtime for capability, budget, idempotency, output-hash and receipt checks. Fixture mode is local and deterministic; external mode additionally needs an exact `ApprovalRecord`, a trusted adapter and explicit `--allow-external`. An ExecutionReceipt is not QA, ApprovedAsset or public Release evidence.

The MediaImport callback is the next auditable boundary: it re-reads the exact successful receipt output from the project execution store, rejects unsafe paths and non-image MIME types, verifies byte length/content hash/dimensions, then persists a draft MediaImport plus an immutable `world_os_production_media_import` binding to the exact slice, request, receipt and RenderPlan. The binding is valid evidence for a human QA Gate, but the callback cannot mutate a slice to `approved_asset` or `released` and cannot create a public/private Release receipt.

The post-media lifecycle is explicit and version-bound: record a human `ProductionQaReview` while the slice is `qa_pending`, cite that review in the QA Gate, activate the slice to `approved_asset`, then create an `ApprovedAsset` binding. Only after the Release Gate has been human-approved and activated may `production-private-release` create a `ReleaseReceipt`; its visibility is fixed to `private_workspace`, `public` is always false, and any platform `PublishReceipt` must already be a successful exact non-authoritative receipt. This prevents a Gate status or a Draft MediaImport from being mistaken for an approved or published asset.

For a real platform flow, Codex reads `world-os outbox`, invokes the configured MCP tool, then records the returned idempotency key and platform record ID with `world-os ack`. The platform never receives local store paths or write authority.

`world-os dispatch` is the bounded private-loop entry point. It is dry-run only unless `--allow-network` and an explicit connector module are supplied. Each call first writes an immutable lease claim, then writes a classified attempt receipt; failures use deterministic exponential backoff and end in `dead_letter` after the configured attempt budget. The repository still ships no real server/auth connector.

`world-os brain-run` composes the same controls instead of bypassing them. It is deliberately bounded by `maxCycles`; it does not loop forever, promote Canon, approve production Gates, or turn a shadow proposal into a commit. `brain-status` is the matching read-only scan: it verifies health, resolves the exact Portfolio heads, lists per-world trigger eligibility and gate reasons, groups pending projections by platform profile, and shows the latest Brain receipt without writing an artifact or making a network call. `brain-runs` lists immutable orchestration receipts for recovery and review.

`world-os serve` exposes the same Brain boundary for a local studio UI, scheduler or
deployment-side MCP coordinator. It defaults to loopback, serializes Brain runs, limits
JSON bodies, rejects remote connector/provider objects, and requires an environment-only
Bearer token whenever a connector, LLM shadow profile, network dispatch or non-loopback binding is enabled.
Network dispatch additionally requires the explicit server `--allow-network` flag. The HTTP surface is
`GET /health`, `GET /v1/production/status`, `GET/POST /v1/signals`, `GET/POST /v1/signal-uses`,
`GET /v1/brain/forecast`, `GET /v1/brain/status`, `GET /v1/brain/runs`, `GET /v1/brain/runs/:brainRunId` and
`POST /v1/brain/runs`; `/health` and `/healthz` also return the exact route list used by
the CLI capability advertisement. Brain POSTs remain bounded and dry-run by default. The server may
receive a trusted connector only at process startup; callers never receive State/Canon
write authority. LLM shadow profiles are also server-side startup configuration:
`--shadow-profiles` loads an array (or factory) of exact request/policy/provider bindings,
and HTTP callers can only select profile ids with `shadowProfileIds`. A profile that uses a
network model additionally requires `--allow-llm-network`; the provider still needs explicit
trust and environment-only credentials. The repository example
`examples/multi-world-studio/providers/http-shadow-profiles.example.mjs` resolves the
latest enabled policy and its exact request from the immutable Store before constructing
the provider; it refuses to start when that binding is missing or ambiguous. Set
`WORLD_OS_LLM_POLICY_ID` and `WORLD_OS_LLM_REQUEST_ID` when a Store contains more than
one enabled policy/request pair.

The signal routes close the private feedback loop without making the platform a fact
source. `POST /v1/signals` accepts only a successful-receipt-bound, privacy-bounded
observation; it derives the signal ID/dedupe key and rejects raw text or identity.
`POST /v1/signal-uses` records Codex's exact used/deferred/dismissed decision. Both
routes are serialized with Brain runs and remain proposal-input-only.

For example, after `world-os serve <project> --port 8787`, a local controller can
inspect and advance W01 without receiving a filesystem path:

```text
GET  http://127.0.0.1:8787/v1/brain/status?worlds=W01
GET  http://127.0.0.1:8787/v1/production/status?worlds=W01&limit=50
GET  http://127.0.0.1:8787/v1/brain/forecast?worlds=W01,W02
POST http://127.0.0.1:8787/v1/brain/runs
     {"worldIds":["W01"],"maxCycles":1,"runKey":"ui-turn-001","dispatch":false}
```

A connector must explicitly export `{ kind: "world_os_mcp_connector", trusted: true, id, async call(dispatch, { signal }) { ... } }`; it receives only the exact MCP Dispatch and an abort signal, never a project path or State/Canon writer. The bundled tests exercise the process stdio adapter through the full dispatcher → PublishReceipt/AttemptReceipt loop with a local fixture server; this is not evidence of a real platform deployment.

For a process-based server, `src/mcp-stdio.mjs` exports `createMcpStdioConnector({ trusted: true, command, args, ... })`. It starts no process at construction time, uses `shell:false`, performs `initialize → notifications/initialized → tools/call`, accepts only a bounded structured platform response, and kills the process on the dispatch abort signal. For a deployment-provided HTTP/Streamable-HTTP endpoint, `src/mcp-http.mjs` exports `createMcpHttpConnector({ trusted: true, endpoint, apiKeyEnv, ... })`; it uses POST JSON-RPC, preserves only the bounded session header, accepts JSON or SSE responses, rejects static credential headers, and validates the same platform idempotency key. A connector module may export either the object or an async factory; the CLI passes the platform profile to a factory. The example modules are `examples/multi-world-studio/connectors/mcp-stdio.connector.mjs` and `mcp-http.connector.mjs`; both require explicit trust and deployment-provided endpoint/process settings.

`llm-shadow` is the matching model boundary: it stores an exact `LLMShadowReceipt` plus a validated `EventProposal` and usage counters, never raw model output or hidden reasoning. It is local-fixture safe by default; a network provider must explicitly declare `kind: "world_os_llm_provider"`, `trusted: true`, and use `--allow-network`. The CLI can load a provider module or construct the bounded OpenAI-compatible provider directly with `--http-endpoint`, `--model`, `--llm-trusted` and an environment-only `--api-key-env` name.

`src/llm-http.mjs` exports `createOpenAiCompatibleProvider({ trusted: true, endpoint, modelAlias, apiKeyEnv })`. The adapter sends a bounded request to a chat-completions-compatible endpoint, accepts JSON proposal output plus usage metadata, strips undeclared model fields before the normal proposal contract, and never persists the HTTP body or credentials. The example module is `examples/multi-world-studio/providers/openai-compatible.provider.mjs`; it is inert until `llm-shadow --allow-network` is explicitly invoked and the policy/request budget passes.
