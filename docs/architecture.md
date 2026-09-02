# CineWeave Studio v2.5 architecture

## Design contract

Every specialist is **standalone first, composable second**. Standalone means it
can accept a direct brief and return its smallest owned artifact. Composable
means it can consume exact upstream kind/ID/version/hash refs without hidden
chat state, implicit “latest” resolution or circular artifact dependencies.

`$cineweave` is the all-in-one, stage-aware AIGC entry point. It orchestrates
the specialist Skills and human gates, but it is not a creative super-Skill:
domain facts remain owned by the specialist that produces them.

## Layers

```text
Intent and optional untrusted reference media
              ↓
CreativeBrief / WorkflowPlan (`studio` mode can start with MJ projection)
              ↓
optional existing MidjourneyExplorationCase (prior prompt + already-ingested result assets + scoped reuse)
              ↓
MidjourneyPromptPack → human exploration → selected master files + metadata
              ↓
ReferenceAsset → atomic Observation / Review / BindingSet / scoped AssetAliasRegistry
              ↓
Story ─ Character ─ Scene ─ Style
              ↓
Director ActionSequenceSpec → ShotSpec → HeroFrameAnchor / ShotLightingPlan / TemporalSpec / optional CameraPrevisSpec
              CinematicSkillManifest + exact inputs → ShotCompilerPlan → ShotSpec / PerformanceTimeline / TemporalSpec / SequenceRhythmSpec handoffs
              Storyboard → SequenceRhythmSpec
              ↓
PromptRecord / ImagePrompt
              ↓
Production recipes, editorial/color plans, evidence, capabilities and rights
              ↓
AdapterDescriptor + exact ExecutionRequest artifact
              ↓
Exact-request approval when external effects are requested
              ↓
Trusted registered adapter + verified ExecutionReceipt
              ↓
Candidate observation → review → one-variable repair
```

The dependency direction is selective. A bounded task bypasses unrelated
layers. A workflow is a DAG of route invocations, so a Skill may appear in two
phases without an artifact referencing its own downstream output.

For cross-domain AIGC work, the DAG should also preserve this control-stack
order inside each handoff:

```text
intent → asset state → shot/time state → adapter controls → review receipt
```

Reference authority and rights are cross-cutting inputs. Makeup, hair,
wardrobe, accessories and skin response remain Character `AppearanceState`
variables; camera behavior is resolved from sequence coverage through shot
purpose, movement curve, pose/keyframes and frame; storyboard panels are
independent tasks assembled deterministically. See the Director references
[`aigc-control-stack.md`](../skills/cineweave-director/references/aigc-control-stack.md),
[`appearance-styling-direction.md`](../skills/cineweave-director/references/appearance-styling-direction.md),
[`camera-previsualization.md`](../skills/cineweave-director/references/camera-previsualization.md),
[`hero-frame.md`](../skills/cineweave-director/references/hero-frame.md),
[`storyboard-coverage.md`](../skills/cineweave-director/references/storyboard-coverage.md),
[`sequence-rhythm.md`](../skills/cineweave-director/references/sequence-rhythm.md),
[`cinematic-skill-manifest.md`](../skills/cineweave-director/references/cinematic-skill-manifest.md),
[`shot-compiler.md`](../skills/cineweave-director/references/shot-compiler.md),
[`director-repair.md`](../skills/cineweave-director/references/director-repair.md)
and [`opensource-adapter-patterns.md`](../skills/cineweave-director/references/opensource-adapter-patterns.md).

Storyboard 2.5.0 makes the sequence layer auditable: each shot binds one exact
`ShotSpec`, `coverageLedger` rows link beats and shots in both directions, and
an ActionSequence scope is bound by identity/version/hash. A Director can omit
production bindings before Production creates a board plan; once it exists,
the storyboard maps each panel to the exact BoardAssemblyPlan task, region and
tile without claiming that media was generated or accepted.

`HeroFrameAnchor` is the Director-owned visual continuity handoff. It binds an
exact whole `ReferenceAsset` or one explicitly selected frame from a
`MediaImport` to an exact `ShotSpec`, then records camera, composition,
appearance and scene DNA in separate fields. Its inheritance policy must
hard-lock character identity and scene geography; motion or focus changes are
allowed only on declared paths, and a protected-path change requires a new
anchor. `TemporalSpec.heroFrameAnchorRef` is an optional exact continuation
link, so downstream time direction can inherit the selected visual state
without making the ShotSpec back-reference a downstream artifact. The anchor
never generates media, calls an adapter or mutates Canon.

`SequenceRhythmSpec` is the sequence-level companion to shot-local
`TemporalSpec`. It binds one exact `Storyboard` to a reduced rational frame
timebase, contiguous inclusive shot windows, ordered tempo phases, breathing
points and one transition per adjacent shot pair. It makes “calm → pressure →
release” reviewable without hiding rhythm in a provider prompt. It remains a
Director plan: Production-owned `EditorialTimelinePlan` still owns external
media segments, conform state and export boundaries.

`CinematicSkillManifest` and `ShotCompilerPlan` form a separate creator
control layer above canonical shot contracts. The manifest owns reusable
parameterized programs, binding slots, typed bounds, target owners and quality
checks. The compiler resolves one exact manifest version and exact inputs into
one control per parameter, an ordered trace and planned handoffs. Its controls
are projection state only: they do not override Character identity, Scene
geography, Style representation or Production capability/rights decisions.
The compiler cannot infer missing facts, fabricate downstream hashes, choose a
provider, execute an adapter or mutate Canon.

DirectorRepair closes the review-to-direction handoff without creating a
cross-domain mutation path: a direct repair binds one immutable Director
artifact and one allowed variable, while a Character, Scene, Style, Prompt,
Production or Rights failure becomes a target-free delegation to that owner.
Every repair keeps acceptance checks pending and remains provider-neutral until
a separate human-approved workflow creates a later artifact version.

### Director quality evaluation

`ControlBenchmark` and `ControlBenchmarkReview` are Production-owned evaluation
evidence, not Director creative artifacts. `CinematographyBench` binds an exact
`CameraPrevisSpec`; `DirectorQualityBench` binds exact ActionSequence, ShotSpec,
ShotLightingPlan, TemporalSpec, CameraPrevisSpec and Storyboard artifacts. Its
direction rubric evaluates shot-purpose readability, action coverage, spatial
continuity, temporal causality and human direction separately, with observable
pass/warn/fail anchors.

The Director quality calibration plan uses paired observed media with a
left/right/tie decision scale and balanced presentation order. A completed
review must cite two distinct media items, observations attached to both sides,
and at least one pair for the Director quality case and direction dimension.
The committed example remains planned; a structural synthetic test does not
count as real candidate media, a human judgment or a quality approval.

## Ownership matrix

| Domain | Owner | Does not own |
| --- | --- | --- |
| intake, visual-first studio orchestration and workflow | `cineweave` | specialist facts, provider execution and master-reference approval |
| story causality and continuity | `cineweave-story` | shots or image prompts |
| semantic morphology, identity, stable surface baseline, appearance state and actor behavior | `cineweave-character` | medium, camera or scene geography |
| geography, materials, interaction and physical light | `cineweave-scene` | post-process look or shot source selection |
| style exploration, RepresentationBinding, visual/temporal grammar and realism treatment | `cineweave-style` | canonical identity, physical skin/material state, geography or source placement |
| reference bytes, content-credential inspection, observations, suitability, role bindings and scoped AssetAliasRegistry maps | `cineweave-reference` | character/scene/style design, rights grants or provider execution |
| action beats, sequence coverage and continuity, blocking, camera, shot light use, time, HeroFrameAnchor, SequenceRhythmSpec, parameterized CinematicSkillManifest programs, ShotCompilerPlan projections, optional numerical camera previs and one-variable Director repair intent | `cineweave-director` | story causality, persistent identity, scene geography, cross-domain repair mutation, stunt-safety approval or general prompt library |
| text-to-image prompt assets and Midjourney exploration cases | `cineweave-prompt` | story causality or shot invention when a ShotSpec is required |
| recipes, editorial/color/content-credential planning, contract-aware repair runs, evidence, capability, rights, execution intent, ControlBenchmark/Review and QA | `cineweave-production` | creative facts, credentials, endpoints or claims that execution succeeded |

## Separations with high leverage

### Reference evidence

`ReferenceAsset` binds one exact local byte sequence. `ReferenceObservation`
binds one role and one full, spatial, temporal, spatiotemporal or mask selector.
`ReferenceReview` judges suitability for a declared purpose.
`ReferenceBindingSet` orders exact observations, resolves role conflicts and
applies rights gates for exact target contracts. Character, Scene, Style,
Director and Prompt consume these records without taking ownership of ingest or
silently treating one upload as identity, costume, pose and style at once.

When a target intentionally departs from a reviewed source, Prompt carries an
explicit `ReferenceTransform`: exact reviewed sources, per-dimension preserve /
replace / exclude decisions, unresolved evidence and acceptance criteria. A
target replacement is user- or contract-declared; it never masquerades as a
visible source fact.

For portrait decomposition, the common evidence split is:

```text
face_identity  → CharacterSpec identity
skin_surface   → CharacterSpec stable baseline
skin_material  → CharacterAppearanceState current state
makeup / hair  → CharacterAppearanceState
capture        → ShotSpec viewpoint and focus hypothesis
palette/style/surface_style → StyleCompile representation and realism treatment
all accepted observations → exact post-target ReferenceBindingSet → ImagePrompt
```

Static capture evidence describes visible perspective and focus cues. Focal
length, aperture, hardware and motion remain inferred unless trusted metadata
or declarations establish them. Normalized skin/realism values are creative
intent, not biometric or physical measurements, provider controls or quality
guarantees.

SHA-256 answers “are these the same bytes?” only. Content-credential trust,
copyright, license scope, likeness consent, training, publication and
redistribution remain separate evidence and policy decisions.

### Creator aliases

`AssetAliasRegistry` is the creator-facing bridge between shorthand and the
contract graph. A scoped alias such as `@沈蘅` or `@临安.御街.雨夜` resolves only
through a declared exact `{kind,id,version,contentHash}` target. The read-only
runtime resolver normalizes Unicode NFC, returns immutable copies, rejects
unknown and `@latest` lookups, and never infers from prompt text, searches
another scope, calls a provider or writes a file. The registry is owned by
Reference because it points at reference/domain bindings; it does not own or
mutate those bindings. Director and Prompt may consume the resolved exact refs.

### Identity, appearance and representation

V2.5 treats character design as three orthogonal spaces:

```text
CharacterMorphologySpec → CharacterSpec identity
                                  ×
                    CharacterAppearanceState
                                  ×
                         StylePackage
                                  ↓
                    RepresentationBinding
                                  ↓
          photoreal / anime / manga / illustration / 3D / hybrid
```

Morphology axes and structural relations are provider-neutral design intent,
not biometric measurements, landmarks, embeddings, blendshapes or model
weights. A neutral front/three-quarter/profile MorphologyReview plus an exact
human approval is required before identity lock.

StylePackage defines a representation model, abstraction budget and
scale-dependent detail budget. RepresentationBinding then states which exact
Character anchors survive, how each scope may transform and what is forbidden.
It can reinterpret Canon but cannot mutate it. Natural Human, Anime and Manga
therefore share Character and Scene facts while using different surface,
linework, shading, depth, performance and evaluation grammar.

Family fixtures generate each candidate independently. Natural Human uses
neutral-close, warm-backlight and full-body tests; Anime uses neutral,
expression and action tests; Manga uses ink, dramatic and action-panel tests.
Cross-representation review holds the fixture constant and changes only the
representation family. Findings remain dimension-level PASS/WARN/FAIL records,
never one beauty, realism or universal style score.

### Light

```text
SceneLightState        physical source, position, direction, falloff, shadow
StyleLightGrammar      contrast, rolloff, color treatment, grain, halation
ShotLightingPlan       which approved source and transport serve each shot function
```

This prevents a color grade from moving a window and prevents a SceneSpec from
owning bloom.

### Performance and time

`CharacterBinding` establishes the shot objective and observable performance.
`PerformanceTimeline` owns timed gaze, face, breath, posture and residual state.
`TemporalSpec` owns camera path, focus, edit and environmental timing while
referencing—not rewriting—the actor timeline. When a 3D previs or capable
adapter needs numerical state, optional `CameraPrevisSpec` adds scene-local
coordinates, rational timebase, separate pose/intrinsic tracks and optics
without expanding the semantic ShotSpec. An optional exact
`heroFrameAnchorRef` lets the temporal plan continue from a selected visual
state; it does not permit identity, geography or camera DNA drift.

### Editorial interchange

`EditorialTimelinePlan` is a Production-owned, OTIO-core-aligned picture edit
plan. It consumes one exact `Storyboard` and preserves Director-owned shot and
cut intent through exact `ShotSpec`/optional `TemporalSpec` bindings. It uses a
reduced rational frame rate, explicit frame ranges, ordered tracks, gaps and
transitions. A media segment is only a reference to exact Draft
`MediaImport`/media ID evidence; an unavailable shot remains a placeholder,
not a claim that media exists. The contract is deliberately external-media-only
and `not_exported`: an actual OTIO, EDL, XML or NLE export remains a later
approved adapter action. This follows OTIO's model of tracks, clips, gaps,
transitions and externally referenced media, while keeping editable exchange
representation out of Director Canon. [OpenTimelineIO overview](https://opentimelineio.readthedocs.io/en/latest/)

### Media technical interchange

MediaTechnicalProbe is a Production-owned, local-only technical handoff for
one exact MediaImport and media byte hash. It runs a fixed ffprobe format and
stream query, records selected container/video/audio facts, preserves omitted
values as not_reported, and hashes the sanitized report. It never retains the
source path, raw container tags, packet data or extradata; it also never writes
source/derived media, calls the network, interprets a creative look or approves
quality. A probe can therefore provide reproducible evidence for downstream
technical planning without turning an observation into a generation or release
claim. [ffprobe documentation](https://ffmpeg.org/ffprobe.html)

### Color interchange

`ColorPipelineProfile` is a Production-owned technical handoff, deliberately
separate from Director color intent and Style grammar. It binds each selected
source through an exact `MediaImport`/media ID; records whether its primaries,
transfer, matrix and range are unknown, declared or verified; and identifies an
OCIO configuration by immutable ID, version and hash. The profile explicitly
sets scene-referred `scene_linear` working policy apart from display-referred
preview and delivery targets. A target is either a direct colorspace path or a
paired view transform plus display colorspace path, mirroring OCIO's two valid
view forms. The current contract is a plan only: the configuration remains
`not_loaded`; verified source metadata additionally requires an exact
MediaTechnicalProbe for the same MediaImport/media ID. It cannot apply a
transform, write media or export a LUT.
This keeps technical reproducibility verifiable without pretending a local
OCIO adapter exists. [OpenColorIO configuration syntax](https://opencolorio.readthedocs.io/en/latest/guides/authoring/overview.html) and [Displays & Views](https://opencolorio.readthedocs.io/en/latest/guides/authoring/displays_views.html)

### Content credentials

`ContentCredentialInspection` is Reference-owned and binds one exact
`ReferenceAsset` plus its byte hash. It is either an honest `planned`
`not_checked` inspection or a record of an immutable external validator report;
the latter keeps manifest state and assertions, claim signature, hard binding,
ingredients, timestamp, credential revocation and asset-content checks
separate. In both cases, its `rightsConclusion` and `truthConclusion` are
permanently `not_determined`. C2PA validation establishes signed provenance and
asset binding, not a legal-rights grant or a judgment that the depicted claim is
true. [C2PA Technical Specification](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) and [C2PA harms modelling](https://spec.c2pa.org/specifications/specifications/2.4/security/Harms_Modelling.html)

`ContentCredentialHandoff` is Production-owned. It binds the exact reference
and inspection contracts, requires a recorded inspection before any external
transfer and requires every derived output to be revalidated. Its current
relationship is only `ingredient_planned`: it never invokes an adapter, writes
media, embeds a raw manifest or writes one. This keeps provenance planning
auditable while the workspace has no local C2PA validator.

### Contract-aware repair runner

Production owns the runtime handoff for a repair plan, not the creative repair
decision itself. `runRepair` accepts one exact stored `DirectorRepair`,
`CharacterRepair`, `SceneRepair` or `PromptRepair` only when the plan's embedded
gate (where present) and the latest ArtifactStore ApprovalRecord both approve
that exact hash. A registered adapter receives frozen plan/parent JSON, the
expected next version and a private `AbortSignal`, never a project path,
endpoint or credential. The adapter call has a bounded 30000 ms default timeout
(up to 300000 ms) and accepts caller cancellation. Pre-aborted calls never
invoke the adapter; timeout and in-flight cancellation abort its signal and
produce sanitized failed receipts. Calls for the same project, exact repair and
adapter ID are serialized across the whole repair sequence within one runtime
host; the first owner controls timeout/cancellation and followers return its
immutable receipt. Because adapters run as trusted in-process JavaScript, they
must cooperate with the signal and must not block the event loop. A single host
must own each writable project; no cross-process repair lease or multi-file
crash transaction is claimed.

The runner validates the parent and candidate against the canonical schema and
semantic rules, preserves the exact dependency-reference set, bounds
substantive changes to the requested target path, and writes only a new
`candidate` version. The envelope must be exactly one enumerable `payload`
data property, and the payload must be canonical plain JSON before candidate
validation; accessor/Proxy reflection failures are sanitized as malformed
output. The parent is immutable; `RepairRunReceipt` remains `awaiting_review`
with human acceptance pending. Missing approval, delegation, missing targets,
unsafe adapter declarations, timeout, cancellation, adapter faults, malformed
output and unbounded candidates produce blocked/failed receipts without leaking
adapter errors, writing media, calling a network or claiming approval. Timeout and
caller signals do not alter the exact plan/approval/adapter run identity; the
first immutable receipt remains idempotent. See
[`repair-runner.md`](../skills/cineweave-production/references/repair-runner.md)
and [`repair-runtime.mjs`](../packages/cineweave-runtime/src/repair-runtime.mjs).

### Action choreography

`ActionSequenceSpec` sits between exact Story/Character/Scene facts and shot
breakdown. It owns ordered physical beats, participant movement through bound
zones, coverage requirements and entry/change/exit continuity. It references
Character motion fingerprints and PerformanceTimelines without rewriting actor
behavior, and it references Scene zones and InteractionConstraintSets without
inventing geography or contact rules.

ShotSpec may bind an exact ActionSequenceSpec plus selected action beat IDs.
Lens, exact camera position and temporal curves remain shot-level decisions.
Action risk flags make qualified-review needs visible; the design artifact is
never a stunt plan or safety approval.

Shot-level derivation is also directional. A `ShotSpec` is hashed before
`HeroFrameAnchor`, `ShotLightingPlan`, `TemporalSpec` and optional
`CameraPrevisSpec`; each downstream artifact references the exact shot, and the
shot never back-references a downstream content hash. `Storyboard` is hashed
before `SequenceRhythmSpec`; the rhythm plan likewise never back-references
editorial media. CameraPrevisSpec additionally binds
the exact SceneBinding and, if supplied, TemporalSpec. Consumers bind those
artifacts as siblings. This preserves the immutable DAG and avoids a
content-hash fixed-point that cannot be computed.

### Direction and prompts

The studio entry has a deliberate provider boundary. `$cineweave-prompt`
can first retain a prior prompt, parameter record and exact selected result
assets as a scoped `MidjourneyExplorationCase`, then creates a
`MidjourneyPromptPack` projection for the user's visual exploration;
the user runs Midjourney and returns selected original files plus metadata;
`$cineweave-reference` then establishes exact evidence and role-scoped
bindings. The same workflow can continue through Story, Character, Scene,
Style, Director, Prompt and Production, but no stage treats a prompt or a
single image as a universal source of truth.

`ShotSpec` decides purpose, blocking, attention, camera and composition.
`PromptRecord` manages reusable image language in any domain. `ImagePrompt`
compiles an exact shot when one exists. Prompt detail is limited by framing,
visibility, compatibility and control value.

## Runtime

`packages/cineweave-runtime` stores artifacts under `.cineweave/`.

- JSON is parsed strictly: duplicate keys, invalid Unicode, non-finite numbers
  and non-JSON whitespace are rejected.
- Canonical hashes are object-order independent.
- One kind/ID/version has one immutable content hash, including concurrent writes.
- Approval records bind exact artifact hashes and are independently hashed.
- ArtifactGraph discovers contract refs structurally inside payloads, supports
  dependency/dependent closures and distinguishes missing refs, same-version
  hash mismatches and valid-but-superseded refs.
- Approval gates evaluate the latest decision for one exact artifact; approval
  never transfers to a newer version. Current-version and dependency-approval
  policies are explicit opt-ins.
- Project bundles list every allowed store file with a byte hash and reject
  links, traversal, unknown or unexpected files and existing target stores.
  V2.5 continues bundle format 1.1 with exact reference blobs; import verifies a staged
  project before atomically installing its store.
- Reference ingestion allow-lists PNG, JPEG, WebP, MP4/M4V, MOV and WebM,
  compares extension with a bounded signature/container probe, limits bytes and
  image dimensions and stores generated non-executable content-addressed names.
  It does not decode content, scan malware, inspect embedded metadata or infer
  rights.
- Idempotency claims bind one key to one exact `ExecutionRequest`.
- Adapter implementations come from a trusted in-process registry and must
  match the hash declared by their `AdapterDescriptor`.
- Adapter outputs stay inside the project execution store, validate returned
  media metadata before receipt persistence, and adapter calls receive an
  `AbortSignal` for the bounded attempt and wall-time budgets.
- External execution is denied unless the exact request is approved and the
  caller explicitly enables external effects.
- Every adapter attempt, retry cost and output byte hash is retained in an
  immutable `ExecutionReceipt`.
- Contract-aware repair runs use a separate local registry and require exact
  repair-plan approval. The runtime freezes adapter inputs, verifies the
  immutable parent, exact dependency set, next version and one target-path
  diff, then records a pending `RepairRunReceipt`; it never writes media or
  converts adapter output into human approval.
- Project verification detects tampering, orphan approval refs and version/hash
  conflicts, idempotency drift and execution-output mutation.
- Board assembly embeds independently produced tiles and emits provenance with
  per-tile hashes and explicit partial failures.

The core runtime is local and dependency-free. It ships no paid provider,
credential or network adapter. A plugin extension may register one, but cannot
bypass the exact-request approval, explicit caller enablement, budget or receipt
boundaries.

### World OS production execution boundary

World OS does not turn a simulation event directly into a provider call. The
vertical slice is deliberately split into two immutable layers:

```text
EventCommit + StateSnapshot
        ↓
ProductionSlice + ordered human Gates
        ↓  (Rights approved: qa_pending)
RenderPlan + generic ExecutionRequest
        ↓
trusted adapter runtime → ExecutionReceipt / blocked receipt
       ↓
MediaImport callback (verified bytes + exact RenderPlan/execution evidence)
        ↓
human QA Review → ApprovedAsset → private ReleaseReceipt
        ↓ (optional successful non-authoritative PublishReceipt)
platform projection / public release (separate, explicit contract)
```

`packages/cineweave-world-os/src/production-execution.mjs` is the only bridge
between the World OS slice and the generic runtime. It copies the selected
provider-neutral PromptRecord into the immutable Store, binds the slice and all
contract snapshots as exact input refs, and refuses stale slice versions before
execution. It never accepts a provider URL, credential, raw prompt text or
arbitrary effect. The bridge can create a blocked request for missing Rights or
unsupported capability; only the generic runtime can produce media bytes and an
auditable receipt. `production-media.mjs` may then re-read a successful image
receipt, verify the immutable execution-store bytes and persist a versioned
Draft `MediaImport` with its own identity, an exact RenderPlan ref and paired
exact execution request/receipt refs, plus an exact
`world_os_production_media_import` binding to the slice. Legacy 2.0
string-reference artifacts remain readable for compatibility. This binding is
admissible QA evidence but cannot advance a Gate. `production-release.mjs` then requires a human QA
checklist, creates an exact private `ApprovedAsset` only after the QA stage is
activated, and creates a `private_workspace` `ReleaseReceipt` only after the
Release stage is activated. `public` is fixed to false; a platform receipt is
optional and must itself be successful and non-authoritative. An
`ExecutionReceipt` or Draft `MediaImport` is intentionally not an
`ApprovedAsset` or a Release receipt.

## Contracts and portable bundles

The canonical manifest owns 89 contract kinds. Each Skill declares its portable
subset in `skills/<skill>/contracts.json`. Bundle construction copies only the
needed schemas and recipes and rewrites local references, so a specialist bundle
does not depend on the repository layout.

Old 2.0, 2.2, 2.3.0, 2.3.1 and 2.4.0 contract schemas remain valid where their
data shape did not break. V2.5 adds new semantic contracts without rewriting
older artifacts; suite/runtime envelopes use `contractVersion: 2.5.0` while
domain contracts retain the earliest compatible version. ProjectBundle format
1.1 carries reference blobs and remains compatible with V2.4 bundles; the
runtime also verifies and imports legacy V2.3.1 format 1.0 bundles.

## Verification model

Release validation covers:

- official Skill and plugin structure;
- unique route and contract ownership;
- every schema/example pair;
- cross-contract semantic positive and negative cases;
- action-beat ordering, participant/zone resolution, coverage and risk links,
  continuity closure and no implied stunt-safety approval;
- activation, indirect, incomplete, negative and edge behavior definitions;
- workflow DAG and output-owner consistency;
- canonicalization, immutable writes, concurrent conflicts and approvals;
- graph closures, stale refs, exact gate decisions, cycles and missing/hash-
  mismatched dependencies;
- project-bundle round trips, V2.2 compatibility, tamper detection, duplicate
  entries, unexpected files and traversal/backslash rejection;
- reference-media extension/signature mismatch, malformed ISO-BMFF/WebM,
  bounded dimensions, deduplication, blob tamper/orphan detection, selectors,
  role authority, rights gates and exact bundle transfer;
- deterministic partial board assembly;
- trusted-adapter matching, idempotent execution, exact-request authorization,
  retry-cost accounting and output-byte verification;
- live-evaluation definitions plus a deterministic replay corpus covering every
  Skill, every Director route and a should-not-activate case; emitted contract
  kinds must be backed by inline payloads that pass manifest ownership, schema
  and semantic checks;
- Atomic Cinematic Skill manifests and ShotCompilerPlan traces, including typed
  parameter bounds, exact alias/ref resolution, projection-only control
  surfaces, owner-route handoffs and non-executing boundaries;
- standalone bundles, links, the Director reference lifecycle catalog, security
  and distributable media rights.

See [V2.5 identity and representation decisions](research/2026-08-22-v2.5-identity-and-representation-foundation.md),
[V2.4 reference decisions](research/2026-08-22-v2.4-reference-assets-and-bindings.md),
[V2.3.1 graph and bundle decisions](research/2026-08-21-v2.3.1-artifact-graph-and-project-bundles.md),
[V2.3 execution decisions](research/2026-08-21-v2.3-execution-and-live-evals.md)
and [roadmap](roadmap.md).
