# Multi-world studio executable example

This directory is the committed, machine-readable source for the creator-facing plan in `docs/examples/multi-world-studio/`.

```text
workspace.json          portfolio, authority, locks, integrations and milestones
seed-manifest.json      deterministic immutable-store rebuild manifest
worlds/                 W01/W02 design proposals and W03/W04 candidate cards
motifs/                 schema-checked L1 BrandEcho examples (non-causal shared motifs)
production/             proposal-only production slice and Gate examples
brain/                  schema example for the aggregate CodexBrainRunReceipt
states/                 proposal-only Day 0 simulation snapshots
triggers/               state-driven trigger catalogs for W01 and W02
actions/                exact, actor-policy-bound actions and their state effects
templates/              causal event templates and bounded branch scores
events/                 reproducible exact-version proposal fixtures authored by Codex
platforms/              projection-only MCP profile
providers/              disabled future LLM policy and bounded request fixture
schemas/                structural contracts
reviews/                portable baseline review evidence
```

v0.4 adds observation-only `ExternalSignal` ingestion and explicit
`ExternalSignalUseReceipt` evidence on top of local
`GateRequest/GateDecision`, `CanonFact/ContinuityLedger`, `TemplateWorkItem` and
versioned template-resume contracts. Signals are created in the immutable store
during a run; the seed source remains proposal-only and does not pretend that a
human has approved W01 or W02 in advance.

Run from the repository root:

Prepare and run the autonomous path:

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
npm run worlds:portfolio
npm run worlds:brain
npm run worlds:forecast
npm run worlds -- dispatch .build/multi-world-studio examples/multi-world-studio/platforms/studio-platform.json --dry-run
```

`npm run worlds:step` is the single-cycle alternative; a later `worlds:run` continues from that exact head. To demonstrate all three fixed `worlds:simulate*` fixtures instead, rebuild an independent fresh target with the direct `worlds -- rebuild ... <target>` command and run the fixtures there in order. Do not replay them after the autonomous path on the same store.

`worlds:rebuild` requires a fresh target because the CineWeave store is immutable. The generated `.build/multi-world-studio/.cineweave` directory is ignored by Git.

`worlds:portfolio` is the multi-world path: it gives W01 and W02 independent one-cycle turns under the configured 70/20 allocation shares, continues a world only while it has budgetable work, and writes a content-addressed `PortfolioRunReceipt`. It never merges their State, Canon, actors or event streams.

`worlds:brain` is the single bounded Codex Brain path. It runs preflight verification, optional proposal-only LLM shadow inputs, the Portfolio scheduler, MCP dry-run/explicit trusted dispatch and postflight verification, then writes one `CodexBrainRunReceipt` containing exact child refs. Use a stable `--run-key` for an idempotent retry, or `--resume-portfolio` when a child Portfolio receipt exists without its aggregate receipt. It does not approve a Gate, promote Canon, execute media or publish publicly.

The autonomous smoke path is `worlds:run`: W01 commits three events, compares two legal branches at the second event, realizes two delayed consequences, and stops when no trigger remains due. W02 is intentionally different: `npm run worlds -- run .build/multi-world-studio W02 --max-steps 10` commits only the reversible baseline measurement and then exits with the expected human-Gate status, without inventing gate thresholds, engineering permission or ecological-debt values.

To continue W02, use `world-os gate-request`, `gate-decide --decision approve`,
`resume`, and optionally `promote`. If a trigger has no template, `run` leaves
an `awaiting_codex_template` work item; submit a higher catalog version and use
`template-resume` to continue from that exact state/head.

After a local publish receipt, `world-os signal-ingest` can record a bounded
platform observation. `world-os signals` lists those exact inputs, and
`world-os signal-use` records whether Codex used one as evidence for an exact
Proposal, deferred it or dismissed it; neither operation writes WorldState or
Canon.

When `world-os serve` is running, the same loop is available through authenticated
`POST /v1/signals` and `POST /v1/signal-uses` routes. The HTTP adapter accepts only
receipt-bound privacy-bounded fields and derives immutable IDs; it never accepts raw
comments, user identity, connector objects or direct State/Canon mutations.

`world-os create-world` registers a candidate card as an immutable `WorldRegistration` without making it runnable. `world-inception-decide` records the named human approve/reject/revise gate; only the latest exact approval can unlock a later runtime-package activation.

`world-os world-activate` attaches a complete sequence-zero runtime package (WorldCard, State, TriggerCatalog, ActionCatalog, EventTemplateCatalog and projection-only PlatformProfile). After activation, the registered world can be passed explicitly to `world-os portfolio-run`; a candidate card alone is never scheduled.

`world-os brand-echo-create` registers a shared motif across at least two known worlds. `brand-echo-decide` and `brand-echo-activate` form a separate human Gate: L1 allows only `shared_motif_only`, has no Canon impact, and rejects shared Actor/Item refs or cross-world causality.

`world-os production-slice-create` binds one exact simulation Commit/State to snapshots of StoryBrief, BeatSheet, ScriptScene, CharacterSpec, SceneSpec, StylePackage, Shot/Prompt, AssetRecipe and Rights inputs. `production-gate-decide` and `production-stage-activate` enforce the ordered story → character → geography → style → rights → QA → release Gates. The release visibility is deliberately fixed to `private_workspace`; no media provider or public platform is implied. Once the Rights Gate creates `qa_pending`, `production-execution-plan` compiles the exact slice to a provider-neutral RenderPlan plus generic `ExecutionRequest`; `production-execution-run` delegates only to the generic runtime and persists an auditable ExecutionReceipt or blocked receipt. For successful image receipts, `production-media-import` verifies the immutable execution bytes and persists a draft MediaImport plus exact binding for QA evidence; `production-qa-review` records the human checklist, `production-approved-asset` binds the approved private asset, and `production-private-release` writes the private ReleaseReceipt after the Release Gate. No step auto-publishes. The built-in fixture adapter is deterministic and local; an external adapter still needs an exact request approval and explicit operator enablement.

`production/execution-manifest.example.json` documents the CLI input shape. Its refs are illustrative hashes; replace them with exact artifacts from the target project. The compiler stores the selected prompt source and generated RenderPlan immutably, so no provider URL, credential or raw prompt text needs to be sent through a remote API.

The MCP server alias and tool name are generic mappings. `worlds:reconcile` deterministically restores a missing projection from a terminal Commit, while `worlds:outbox` prepares an exact-profile-bound dispatch for Codex. `world-os dispatch` adds the local claim/retry/dead-letter loop, but remains dry-run unless a trusted connector and `--allow-network` are explicitly supplied; no real platform is claimed. `publish-local` exists only as a deterministic test fixture.

`connectors/mcp-stdio.connector.mjs` is an optional process connector factory. It starts no server until `world-os dispatch --allow-network` is explicitly invoked, uses the bounded `initialize → tools/call` exchange with `shell:false`, and requires `WORLD_OS_MCP_TRUSTED=true` plus deployment-provided command/args. `connectors/mcp-http.connector.mjs` is the corresponding HTTP/Streamable-HTTP factory; it requires `WORLD_OS_MCP_HTTP_TRUSTED=true`, an endpoint and optional environment API-key name, and accepts only bounded JSON/SSE platform evidence. `providers/openai-compatible.provider.mjs` is the matching optional LLM HTTP provider factory; it requires explicit trust, endpoint/model environment values and `llm-shadow --allow-network`, and returns only a sanitized proposal plus usage evidence. `providers/http-shadow-profiles.example.mjs` is the server-side `world-os serve --shadow-profiles` factory: it selects only one enabled ProviderPolicy plus one exact bound SimulationRequest from the immutable Store (set `WORLD_OS_LLM_POLICY_ID`/`WORLD_OS_LLM_REQUEST_ID` when there are multiple), and remains inert until `--allow-llm-network` is explicitly supplied. The CLI can also construct a provider directly with `--http-endpoint --model --llm-trusted --api-key-env` without putting the secret itself on the command line.

See `AGENTS.md` for the Codex operating contract and `docs/examples/multi-world-studio/10-codex-world-os.md` for the architecture and current limitations.

Deployment-safe environment and startup guidance is in
`deployment/README.md`; the adjacent `.env.example` contains names only and no
credentials.
