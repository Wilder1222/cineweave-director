# CineWeave Studio roadmap

## In development after V2.5.1

- visual-first `studio` orchestration from Midjourney exploration through
  master-reference evidence, visual-bible locks, story, shots, storyboard and
  production gates;
- prompt-owned `MidjourneyPromptPack` with separated reference roles,
  version-pinned parameters and a human return gate;
- prompt-owned `MidjourneyExplorationCase` for reusable prior MJ styles,
  source prompts, parameter records and exact result-image references with
  rights-aware, scoped visual reuse;
- Director-owned `ActionSequenceSpec` for exact multi-beat choreography,
  physical-design checks, coverage requirements, closed sequence continuity and
  visible qualified-review risks before ShotSpec selection;
- current source coverage of 74 contracts, 72 uniquely owned routes and 47
  behavior cases.

## Shipped in V2.2

- eight standalone/composable Skills with unique route and contract ownership;
- dedicated Story and general Prompt domains;
- 54 canonical contracts, including causal story, actor timing, three-layer
  lighting, shot and temporal specifications;
- zero-prompt character exploration and user-led preference convergence;
- strict, immutable local artifact storage and exact-hash approvals;
- deterministic multi-panel board assembly with per-tile provenance;
- 24 behavior cases across direct, indirect, incomplete, negative and edge use;
- Windows/Linux CI, bundle validation and distributable-asset rights audit.

## Shipped in V2.3

- provider-neutral `AdapterDescriptor`, exact `ExecutionRequest` and
  runtime-authored `ExecutionReceipt` contracts;
- trusted in-process adapter registry with implementation-hash matching;
- exact-request approval and explicit caller enablement for external effects;
- immutable idempotency claims, retry-cost accounting and byte-level output
  verification;
- zero-cost, network-free deterministic SVG fixture adapter;
- 10-case live Skill evaluation corpus covering every Skill and a negative
  should-not-activate request;
- explicit-cost live Codex runner, read-only isolated tasks, strict structured
  responses and deterministic committed replay grading;
- semantic validation for execution and evaluation summary integrity.

## Shipped in V2.3.1

- strict `ArtifactGraph` contract with structural exact-ref discovery;
- dependency, dependent and bidirectional closure queries;
- resolved, missing, same-version hash-mismatch and superseded-ref states;
- latest exact-decision approval gates with optional current-version and
  dependency-approval policies;
- deterministic cycle reporting and runtime CLI graph/stale/gate commands;
- directory-based `ProjectBundleManifest` with byte hashes and explicit
  non-redistribution semantics;
- staged, verified, non-overwriting import plus bundle verification CLI;
- tests for round trips, V2.2 preservation, tampering, unexpected files,
  duplicate entries, path traversal, backslashes and CLI behavior.

## Shipped in V2.4

- ninth standalone/composable `$cineweave-reference` Skill with unique route
  and contract ownership;
- exact content-addressed `ReferenceAsset`, one-role `ReferenceObservation`,
  purpose-specific `ReferenceReview` and ordered `ReferenceBindingSet`;
- spatial, temporal, spatiotemporal and mask selectors with extract/ignore and
  authority boundaries;
- local allow-listed reference ingestion with bounded signature probes,
  generated non-executable names and no retained source path or filename;
- explicit separation of byte integrity, content credentials, copyright,
  likeness, training, provider transfer, publication and redistribution;
- ReferenceArtifact dependencies in ArtifactGraph and format 1.1 project bundle
  transfer, while retaining V2.3.1 format 1.0 read/import compatibility;
- 63 contracts, 61 routes, 28 behavior cases, 11 live replay cases and reference
  ingestion, tamper, deduplication, selector, rights and bundle tests.

## Shipped in V2.5

- provider-neutral `CharacterMorphologySpec` with semantic face/body axes,
  structural relations, locks, allowed variation and explicit constraints;
- neutral front/three-quarter/profile identity fixture, `MorphologyReview`,
  human-only identity lock and one-axis repair semantics;
- one-axis style exploration through `StyleExplorationBrief`, `StyleOptionSet`
  and editable `StylePreferenceFeedback`;
- VRS representation model, abstraction/detail budgets and exact
  `RepresentationBinding` between canonical Character and StylePackage;
- natural-human rendering as a cross-Skill fixture/bench path, alongside
  representation scopes for anime, manga, illustration, stylized 3D and hybrid;
- fine-grained morphology, surface, linework, shading, depth, panel, typography
  and motion-style evidence roles;
- 69 contracts, 66 uniquely owned routes, 32 behavior cases and 14 built-in deterministic recipes,
  including neutral morphology, natural-human, Anime, Manga, style-exploration
  and six-family cross-representation fixtures.

## Next incremental priorities (V2.5.x)

Priority remains based on user value and architectural risk.

1. **Contract-aware repair runner (P0).** Execute one-variable repair plans while
   preserving passing immutable inputs and recording before/after evidence.
2. **Original case atlas (P1).** Add rights-cleared, reproducible worked cases
   for portrait, product, food, architecture, editorial, diagrams and exact-text
   layouts. Keep a small routing index, load only the matching category and
   attach prompt version, adapter context, candidate hash and review evidence.
3. **Evaluation baselines (P1).** Retain versioned aggregate scores, compare
   regressions by route and require human review for grader-definition changes.
4. **Adapter conformance kit (P1).** Publish fixtures for timeout, partial output,
   retryable billing, malformed metadata and cancellation without shipping any
   provider credential or paid adapter in core.
5. **Reference derivation pipeline (P1).** Add explicitly derived,
   metadata-stripped thumbnails/proxies without mutating or confusing the
   original byte-bound asset, and add pluggable malware/content-credential
   inspection reports whose absence remains visible.

## V2.6 — production workspace

1. Editable cards for Brief, Story, Character, Scene, Style, Shot and Prompt.
2. Visual artifact graph, exact-version diff and approval history.
3. A/B preference capture without universal beauty or quality scores.
4. Reference-role UI with explicit preserve/ignore regions and rights warnings.
5. Board review with per-tile retry and deterministic reassembly.

The workspace must consume the same contracts; it must not create a parallel,
hidden data model or imply that “CineWeave Web” already exists.

## Research tracks

- finer style-atom taxonomy with inheritance, compatibility and search;
- cultural/historical evidence profiles separated from inspired interpretation;
- camera-trajectory and temporal-reference adapters for video;
- cross-shot identity, geography, light and action continuity benchmarks;
- user-specific taste learning based on reversible comparison feedback;
- accessibility and localization for Chinese-first creative workflows;
- privacy-preserving local media embeddings only after an explicit threat model.

## Invariants for every increment

- specialists remain directly callable;
- composition uses exact immutable refs and a DAG;
- facts, representation, direction, prompting and execution remain separate;
- unknown evidence, rights or capabilities never become approved by assumption;
- generated media and external side effects remain explicitly human-gated;
- every public claim has a corresponding test or is labeled as planned.
