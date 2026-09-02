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
- prompt-owned `MidjourneyAestheticProfile` that separates creator
  Personalization, curated project Moodboards, shot-level references and current
  prompt responsibility, with explicit `--p` code snapshots and parameter
  compatibility checks;
- Production-owned `WorkflowTemplateProfile` plus an exact optional
  `ExecutionRequest` binding for serialized graph identity, dependencies and
  typed artifact slots;
- Director-owned `ActionSequenceSpec` for exact multi-beat choreography,
  physical-design checks, coverage requirements, closed sequence continuity and
  visible qualified-review risks before ShotSpec selection;
- Director creator controls now include exact `HeroFrameAnchor` visual
  continuity and `SequenceRhythmSpec` sequence rhythm, with explicit
  inheritance, rational-frame and non-execution semantics;
- Reference creator controls now include a scoped `AssetAliasRegistry` and a
  read-only exact-ref resolver for `@Asset` shorthand, with NFC normalization,
  collision rejection and explicit unknown/latest blocking;
- Director now includes the parameterized `CinematicSkillManifest` catalog and
  deterministic `ShotCompilerPlan` runtime: typed controls remain projection
  state while exact bindings and planned owner handoffs remain auditable;
- the Production-owned repair runner now has a local conformance kit covering
  bounded timeout, caller cancellation, malformed/accessor/Proxy output,
  synchronous and asynchronous faults, non-cooperative late settlement and
  same-host serialization without media writes, provider coupling or a false
  cross-process transaction claim;
- current source coverage of 89 contracts, 86 uniquely owned routes and 76
  static behavior cases; the deterministic live replay corpus contains 33
  synthetic cases.

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
- 21-case live Skill evaluation corpus covering every Skill, every Director
  route and a negative should-not-activate request, with inline
  contract-payload evidence;
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

## Shipped in V2.5.1

- a versioned Director Storyboard contract with exact ActionSequence and
  ShotSpec references, bidirectional coverage closure and a provider-neutral
  execution boundary;
- optional exact BoardAssemblyPlan panel handoff for deterministic assembly,
  with semantic rejection of mismatched task/region/tile mappings and false
  execution claims;
- canonical-hash checks for action-scoped ShotSpec and Storyboard references,
  plus schema, semantic, architecture and runtime regression tests.
- a DirectorRepair contract for one exact Director-owned change or a
  target-free cross-domain delegation, with pending acceptance checks,
  immutable parent binding and no execution/success claim.
- Skill resource validation that covers both Markdown links and inline relative
  code paths, with a repository regression that prevents silent broken
  progressive-disclosure references.
- MediaImport 2.5 with a stable import identity/version, exact RenderPlan and
  optional paired execution request/receipt refs, auditable provenance, CLI
  compatibility for legacy RenderPlan strings, and World OS persistence of the
  exact modern shape.
- ShotLightingPlan 2.5 with explicit direct/bounce/transmitted transport,
  intentional nullable fill and a named physical surface for indirect paths,
  while preserving 2.2 reads.
- optional CameraPrevisSpec 2.5 for exact ShotSpec/SceneBinding and optional
  TemporalSpec handoff, with scene-local meter coordinates, reduced rational
  frame timing, separate pose/intrinsic tracks, no false zoom claim and a
  provider-neutral non-execution boundary.
- Production-owned ControlBenchmark DirectorQualityBench with exact
  ActionSequence/Shot/Lighting/Temporal/CameraPrevis/Storyboard refs,
  dimension-specific pass/warn/fail direction rubric and paired
  observed-media calibration gates; the committed review remains planned until
  real candidate media and human evidence exist.
- Production-owned EditorialTimelinePlan 2.5 with an exact Storyboard,
  rational-frame picture tracks, explicit gaps/transitions, exact external
  MediaImport bindings and honest planned/partial/conformed states; actual
  OTIO/EDL/XML export remains an approved adapter responsibility.
- Production-owned MediaTechnicalProbe 2.5 with exact MediaImport/media byte
  binding, fixed local ffprobe format/stream selection, explicit
  not_reported omissions, sanitized report hashing and no path/tag/extradata
  retention; it remains a technical observation, not color interpretation,
  quality approval or media mutation.
- Production-owned ColorPipelineProfile 2.5 with exact MediaImport/media
  bindings, an immutable but not-loaded OCIO config identity, honest
  unknown/declared/verified source color metadata, scene/display separation and
  explicit preview/delivery paths; transforms, media writes and LUT export
  remain approved adapter responsibilities.
- Reference-owned ContentCredentialInspection 2.5 plus Production-owned
  ContentCredentialHandoff 2.5: both bind exact reference bytes and keep C2PA
  checks, rights and truth conclusions separate. The current chain is planned
  or records immutable external evidence only; validator execution, media
  writes and manifest writes remain approved adapter responsibilities.
- Production-owned contract-aware repair runner with `RepairRunReceipt`: exact
  dual approval, frozen local adapter input, immutable parent/dependency checks,
  one requested target-path diff, next-version candidate persistence and
  pending human acceptance; blocked and failed runs never write media or claim
  approval.
- a Director reference lifecycle catalog and release audit: all 30 reference
  files are declared as either route-loaded (22) or archived with an exact
  owner/successor (8), preventing silent deep-reference drift;
- a creator-facing Director control slice: exact `HeroFrameAnchor` visual DNA
  inheritance from `ShotSpec`, plus `SequenceRhythmSpec` rational-frame
  windows, closed tempo phases and adjacent transition grammar. Both remain
  provider-neutral plans and do not generate or edit media.
- a creator-facing Atomic Cinematic Skill layer: twelve reusable parameterized
  programs, exact `@Asset`/contract binding support, projection-only controls,
  ordered compile traces and planned handoffs to Director, Character and other
  owning routes. The compiler is deterministic and non-executing.
- a Prompt-owned Original Case Atlas with seven rights-cleared portrait,
  product, food, architecture, editorial, diagram and exact-text fixtures; its
  small index and executable planner route to one category only, while canonical
  prompt, adapter, rights, candidate and machine-review evidence remains
  byte-reproducible behind structured non-claim boundaries.

## Next incremental priorities (V2.5.x)

Priority remains based on user value and architectural risk.

1. **Evaluation baselines (P1).** Retain versioned aggregate scores, compare
   regressions by route and require human review for grader-definition changes.
2. **Adapter conformance kit (P1).** Publish fixtures for timeout, partial output,
   retryable billing, malformed metadata and cancellation without shipping any
   provider credential or paid adapter in core.
3. **Reference derivation pipeline (P1).** Add explicitly derived,
   metadata-stripped thumbnails/proxies without mutating or confusing the
   original byte-bound asset, and add pluggable malware/content-credential
   inspection reports whose absence remains visible.

## V2.6 — production workspace

- Released: DirectorProposals 2.5 is a provider-neutral, versioned comparison
  set with capability requirements, cost/risk classes and a pending human
  selection gate; legacy 2.0 provider-shaped inputs remain readable during
  migration.
- Released: RenderPlan 2.5 persists its plan identity/version and exact
  Prompt/Production source refs, while the legacy 2.0 prompt-string shape
  remains readable during migration.
- Released: MediaImport 2.5 persists its import identity/version, exact
  RenderPlan provenance and optional paired execution evidence. The public
  local verifier upgrades canonical exact RenderPlan strings automatically and
  retains non-canonical legacy strings as readable 2.0 payloads.

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
