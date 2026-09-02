# CineWeave exchange contract v2

## Purpose

CineWeave contracts make creative work portable between independently usable
Skills. A contract represents a declared creative decision, not a generated
image, a provider receipt, a Canon mutation or an automatic right to publish.

## Contract families

```text
CreativeBrief → WorkflowPlan
CharacterSpec → AppearanceState → CharacterBinding
SceneSpec     → SceneState      → SceneBinding → InteractionConstraintSet
StylePackage  → StyleCompile    → StyleReview
Reference outputs: ReferenceAsset → ContentCredentialInspection
                   ReferenceAsset → ReferenceObservation → ReferenceReview
                                    → ReferenceBindingSet → AssetAliasRegistry
Story outputs: StoryBrief, BeatSheet, ScriptScene, ContinuityLedger
Director outputs: ActionSequenceSpec → ShotSpec → HeroFrameAnchor,
                  ShotLightingPlan, TemporalSpec,
                  optional CameraPrevisSpec; Storyboard → SequenceRhythmSpec;
                  RenderPlan
Prompt outputs: PromptRecord, ImagePrompt, PromptHypothesis, DraftBrief,
                PromptRepair
Production outputs: AssetRecipe, BoardAssemblyPlan, EditorialTimelinePlan,
                    MediaTechnicalProbe, ColorPipelineProfile, ContentCredentialHandoff, RepairRunReceipt, ControlChannelSet,
                    EvidenceBundle, CapabilityProfile, LicenseProfile, ControlBenchmark, ControlBenchmarkReview,
                    AdapterDescriptor,
                    ExecutionRequest, ExecutionReceipt
Suite evidence:     ArtifactGraph, ProjectBundleManifest, SkillEvaluationRun
```

`WorkflowPlan` names handoffs but does not execute them. A specialist may run
directly from a natural-language brief, then later be composed with exact
contracts from other Skills.

## Shared invariants

- Every V2 exchange record uses its schema-declared contract version. The
  V2.5 package preserves 2.0, 2.2, 2.3.0, 2.3.1 and 2.4.0 contract versions
  for compatible records while new V2.5 records declare 2.5.0.
- A dependent contract names an exact asset identity, version and content hash
  where that asset is already defined.
- A newer version does not invalidate an exact old ref or inherit its approval.
  Staleness is an explicit graph state and becomes blocking only under a
  declared current-version policy.
- A reference input has one explicit role, scope, preserve list and ignore list.
- A reference asset binds exact bytes; an observation binds one role and
  selector; a binding set resolves ordering, conflicts and rights for exact
  downstream targets. Byte integrity does not establish authorship or rights.
- AssetAliasRegistry is only a scoped presentation map: every `@Asset` entry
  resolves to one exact existing contract ref. It rejects collisions, `@latest`,
  prompt inference and cross-scope lookup; it cannot create, merge or mutate a
  Canon artifact and unknown aliases remain blocked.
- Identity, appearance, geography, style representation and camera treatment
  remain separate ownership domains.
- ActionSequenceSpec binds Story purpose, Character motion/performance and Scene
  constraints into beats, coverage and sequence continuity. It does not invent
  those upstream facts or imply stunt-safety approval.
- HeroFrameAnchor binds one exact still source—either a whole ReferenceAsset or
  one selected MediaImport frame—to one exact ShotSpec. Camera, composition,
  appearance and scene DNA remain separated; identity and geography are hard
  inheritance locks, and an override requires a new anchor. It is a visual
  continuity plan, not a media-generation or Canon-mutation operation.
- SequenceRhythmSpec binds one exact Storyboard to zero-based integer frame
  windows, a reduced rational timebase, closed tempo phases and adjacent
  transition grammar. It describes sequence rhythm and breathing points; it
  does not replace Production-owned EditorialTimelinePlan or claim that media
  exists.
- EditorialTimelinePlan consumes exact Storyboard, ShotSpec and optional
  TemporalSpec intent, then binds only external MediaImport evidence into
  rational-frame tracks, gaps and transitions. It never embeds media, exports a
  timeline or turns a placeholder into a conform claim.
- MediaTechnicalProbe is Production-owned and binds one exact MediaImport/media
  byte hash to a bounded local ffprobe record. It preserves selected container
  and stream facts, makes omitted values explicit as not_reported, excludes
  raw paths/tags/extradata and never implies color interpretation, quality
  approval or media mutation.
- ColorPipelineProfile consumes exact MediaImport/media bindings and identifies
  a planned OCIO config by version/hash. For verified source metadata it also
  requires an exact MediaTechnicalProbe. It separates scene- and
  display-referred spaces plus preview/delivery view paths, but does not load a
  config, apply a transform, write media, export a LUT or silently turn Style
  color intent into a technical look.
- ContentCredentialInspection is Reference-owned and binds one exact
  ReferenceAsset plus byte hash. It either stays `not_checked` or records an
  immutable external validator report with separately visible C2PA checks; it
  never turns provenance evidence into a rights or truth conclusion.
- ContentCredentialHandoff is Production-owned and binds exact reference and
  inspection contracts. It requires a recorded inspection before external
  transfer and revalidation for derived output, while leaving the ingredient
  relationship planned and never embedding or writing a manifest.
- ControlBenchmark is Production-owned evaluation design. Its
  DirectorQualityBench scope binds exact Director artifacts and separates
  shot-purpose, action-coverage, spatial-continuity, temporal-causality and
  human-direction dimensions. When that scope is completed,
  ControlBenchmarkReview must cite distinct observed media, balanced
  left/right presentation and observations bound to both media; a planned
  review remains evidence-free and makes no quality claim.
- External execution requires approval of the exact stored request plus explicit
  caller enablement; generated media remains an observed candidate until review
  cites evidence.
- Rights, consent and capability support are explicit records; public visibility
  does not imply permission.
- A project bundle is a byte-verified local transfer container. Its manifest
  explicitly does not imply redistribution permission or rights approval.
  V2.4 format 1.1 can carry exact reference blobs; legacy V2.3.1 format 1.0
  remains readable without rewriting its project manifest.

## Composition boundary

Composition is allowed only through declared contract fields or a WorkflowPlan
step. Skills must not rely on a previous assistant response as an unstated
source of locked facts. A missing fact remains unresolved or routes back to its
owner.

## Repair boundary

Review identifies expected-versus-observed failures. Repair changes one smallest
variable, preserves passing criteria and produces a new candidate or asset
version. A repair plan is not proof that the repair succeeded. Production's
contract-aware runner accepts only an exact approved plan, invokes a registered
local non-writing adapter, preserves the immutable parent and exact dependencies,
and records a `RepairRunReceipt` with pending human acceptance. Delegations,
missing approval and unbounded candidates remain blocked or failed.

## Execution boundary

Production may author an `ExecutionRequest`, but only the runtime authors an
`ExecutionReceipt`. A contract cannot select arbitrary code, a path, endpoint or
credential value. Runtime execution uses a trusted registered adapter whose
implementation hash matches an exact `AdapterDescriptor`; all attempts, costs
and output hashes remain auditable.
