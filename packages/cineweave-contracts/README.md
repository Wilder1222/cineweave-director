# CineWeave Contracts 2.5.1

`cineweave-contracts` is the canonical exchange layer for CineWeave Studio. Its
manifest records 89 contract kinds, one owner per contract and one owner per
Skill route.

## Domains

- Router: CreativeBrief and WorkflowPlan.
- Story: StoryBrief, BeatSheet, ScriptScene and ContinuityLedger.
- Character: exploration, semantic face/body morphology, identity and stable surface baseline, controlled
  appearance including visible skin material, binding, PerformanceTimeline,
  review and repair.
- Scene: geography, state, physical SceneLightState, interaction and repair.
- Style: one-axis exploration, StylePackage, RepresentationBinding, reference
  policy, semantic-emphasis/representation-variant StyleCompile with optional
  calibrated realism treatment, and StyleLightGrammar.
- Reference: byte-bound assets, planned or externally recorded
  content-credential inspections, atomic observations, suitability reviews and
  exact role-scoped binding sets, plus scoped `AssetAliasRegistry` maps.
- Director: proposals, ActionSequenceSpec, the parameterized
  `CinematicSkillManifest` catalog, `ShotCompilerPlan`, ShotSpec,
  HeroFrameAnchor, ShotLightingPlan, TemporalSpec, optional CameraPrevisSpec,
  storyboard, SequenceRhythmSpec, reference consumption and render planning.
- Prompt: PromptRecord, ImagePrompt, explicit reference transforms,
  PromptHypothesis, DraftBrief and PromptRepair.
- Production: recipes, deterministic BoardAssemblyPlan, rational-frame
  EditorialTimelinePlan, local MediaTechnicalProbe records, planned
  OCIO-model-aligned ColorPipelineProfile and content-credential handoffs,
  contract-aware one-variable repair runs, controls, ControlBenchmark/ControlBenchmarkReview,
  evidence, capability, rights, adapter descriptors, exact execution requests,
  receipts and benchmarks.
- Runtime: project, artifact, exact dependency graph, approval, safe project
  bundle, board-provenance and Skill-evaluation records.

## Layout

- `contracts/manifest.json` — suite version, ownership and route index.
- `schemas/` — provider-neutral JSON Schema contracts.
- `examples/` — a valid example for every manifest contract, plus validated
  Anime and Manga StylePackage examples.
- `recipes/` — 15 deterministic production recipes, including morphology,
  three-view plus identity-detail dossiers, style exploration, Natural Human,
  Anime, Manga and cross-representation fixtures.
- `references/` — shared semantics.

Each Skill declares its portable subset in `skills/<skill>/contracts.json`.
`scripts/build-skill-bundles.mjs` copies only that subset and rewrites local
links. A specialist therefore remains usable without `$cineweave` or the source
repository layout.

## Evolution policy

Artifacts are immutable. Additive 2.2, 2.3.0, 2.3.1, 2.4.0 and 2.5.0 schemas do not
rewrite valid earlier payloads.
A dependent artifact references exact kind, ID, version and content hash; it
never means “latest.” Breaking data-shape changes require a new contract version
and a non-destructive migration report.

Schema validity is necessary but not sufficient. Semantic tests also enforce
causal beats, non-overlapping performance phases, physical/style light
separation, source-bound shot lighting, ordered temporal events, exact
camera-previs dependencies, exact hero-frame inheritance, rational sequence
timing, contiguous shot windows, exact scoped asset aliases, ordered separate pose/intrinsic
tracks and no false zoom claims, closed editorial tracks with explicit
transitions and honest conform states, exact MediaImport-bound media probes
with explicit missing fields and sanitized ffprobe boundaries, exact planned
color-config/media bindings, honest source metadata, separate scene/display
reference spaces and non-executing preview/delivery paths, one-variable repair, deterministic
grids, execution authorization/cost integrity, artifact-graph summaries, safe
bundle manifests, contract-aware repair receipts and evaluation-summary consistency.
ControlBenchmark semantics additionally require exact CameraPrevisSpec or
Director artifact bindings for the applicable suite, dimension-specific
pass/warn/fail anchors and, for DirectorQualityBench completion, paired distinct
observed media, balanced left/right presentation and observations attached to
both media items.
Action semantics additionally enforce ordered beats, resolved participants and
zones, symmetric coverage/risk links, closed continuity and visible qualified
review for high-risk depiction.
Reference semantics additionally enforce exact asset paths and hashes, bounded
selectors, disjoint extract/ignore scopes, role authority, rights gates,
binding conflict resolution and reference-media bundle policy. Portraits use
distinct `face_identity`, `skin_surface`, `skin_material`, `makeup`/`hair`, `capture`, lighting,
composition and style/palette observations instead of one mixed prompt record.
Representation semantics additionally enforce complete foundation fields,
unique abstraction dimensions, exact Character-to-Style bindings, one-axis
style exploration, family-specific benchmark coverage and complete deterministic
cross-representation fixture sets.
