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
ReferenceAsset → atomic Observation / Review / BindingSet
              ↓
Story ─ Character ─ Scene ─ Style
              ↓
Director ActionSequenceSpec → ShotSpec / ShotLightingPlan / TemporalSpec
              ↓
PromptRecord / ImagePrompt
              ↓
Production recipes, evidence, capabilities and rights
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
[`storyboard-coverage.md`](../skills/cineweave-director/references/storyboard-coverage.md)
and [`opensource-adapter-patterns.md`](../skills/cineweave-director/references/opensource-adapter-patterns.md).

## Ownership matrix

| Domain | Owner | Does not own |
| --- | --- | --- |
| intake, visual-first studio orchestration and workflow | `cineweave` | specialist facts, provider execution and master-reference approval |
| story causality and continuity | `cineweave-story` | shots or image prompts |
| semantic morphology, identity, stable surface baseline, appearance state and actor behavior | `cineweave-character` | medium, camera or scene geography |
| geography, materials, interaction and physical light | `cineweave-scene` | post-process look or shot source selection |
| style exploration, RepresentationBinding, visual/temporal grammar and realism treatment | `cineweave-style` | canonical identity, physical skin/material state, geography or source placement |
| reference bytes, observations, suitability and role bindings | `cineweave-reference` | character/scene/style design, rights grants or provider execution |
| action beats, sequence coverage and continuity, blocking, camera, shot light use and time | `cineweave-director` | story causality, persistent identity, scene geography, stunt-safety approval or general prompt library |
| text-to-image prompt assets and Midjourney exploration cases | `cineweave-prompt` | story causality or shot invention when a ShotSpec is required |
| recipes, evidence, capability, rights, execution intent and QA | `cineweave-production` | creative facts, credentials, endpoints or claims that execution succeeded |

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
ShotLightingPlan       which approved source serves what function in this shot
```

This prevents a color grade from moving a window and prevents a SceneSpec from
owning bloom.

### Performance and time

`CharacterBinding` establishes the shot objective and observable performance.
`PerformanceTimeline` owns timed gaze, face, breath, posture and residual state.
`TemporalSpec` owns camera path, focus, edit and environmental timing while
referencing—not rewriting—the actor timeline.

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
- External execution is denied unless the exact request is approved and the
  caller explicitly enables external effects.
- Every adapter attempt, retry cost and output byte hash is retained in an
  immutable `ExecutionReceipt`.
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
MediaImport callback (PNG/JPEG/WebP bytes + hash + dimensions)
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
receipt, verify the immutable execution-store bytes and persist a Draft
`MediaImport` plus an exact `world_os_production_media_import` binding to the
slice, request, receipt and RenderPlan. This binding is admissible QA evidence
but cannot advance a Gate. `production-release.mjs` then requires a human QA
checklist, creates an exact private `ApprovedAsset` only after the QA stage is
activated, and creates a `private_workspace` `ReleaseReceipt` only after the
Release stage is activated. `public` is fixed to false; a platform receipt is
optional and must itself be successful and non-authoritative. An
`ExecutionReceipt` or Draft `MediaImport` is intentionally not an
`ApprovedAsset` or a Release receipt.

## Contracts and portable bundles

The canonical manifest owns 74 contract kinds. Each Skill declares its portable
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
  Skill and a should-not-activate case;
- standalone bundles, links, security and distributable media rights.

See [V2.5 identity and representation decisions](research/2026-08-22-v2.5-identity-and-representation-foundation.md),
[V2.4 reference decisions](research/2026-08-22-v2.4-reference-assets-and-bindings.md),
[V2.3.1 graph and bundle decisions](research/2026-08-21-v2.3.1-artifact-graph-and-project-bundles.md),
[V2.3 execution decisions](research/2026-08-21-v2.3-execution-and-live-evals.md)
and [roadmap](roadmap.md).
