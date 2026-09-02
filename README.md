<p align="center">
  <img src="assets/cineweave-studio-logo.png" alt="CineWeave Studio logo" width="160">
</p>

<h1 align="center">CineWeave Studio</h1>

<p align="center">
  Composable Codex Skills for story, character, scene, style, references, direction, image prompting and production control.
</p>

<p align="center">
  <a href="https://github.com/Wilder1222/cineweave-studio/actions/workflows/validate.yml"><img alt="Validation" src="https://img.shields.io/github/actions/workflow/status/Wilder1222/cineweave-studio/validate.yml?branch=main&style=flat-square&label=validation"></a>
  <img alt="Codex plugin" src="https://img.shields.io/badge/Codex-Plugin-1D6FFF?style=flat-square">
  <img alt="Version 2.5.1" src="https://img.shields.io/badge/version-2.5.1-14B8A6?style=flat-square">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

<p align="center">
  <a href="#install-in-codex">Install</a> ·
  <a href="#nine-specialist-skills-and-one-studio-entry">Skills</a> ·
  <a href="#how-composition-works">Architecture</a> ·
  <a href="#deterministic-local-runtime">Runtime</a> ·
  <a href="docs/roadmap.md">Roadmap</a> ·
  <a href="docs/examples/multi-world-studio/README.md">Multi-world studio blueprint</a>
</p>

---

## What it does

CineWeave turns an imprecise creative wish into small, editable artifacts. It
does not treat one giant prompt as story, character bible, set design, camera
plan and production record at the same time.

The key idea is simple:

> First state how the image is observed—subject, action, spatial relation,
> viewpoint, light and material response—then compile only the detail that can
> influence the requested frame.

That rule works for portraits, products, food, architecture, illustration and
cinematic frames. The prompt system is not limited to “cinematic content,” and
the director system no longer owns general prompt management.

| Start with | CineWeave returns |
| --- | --- |
| “I only know how the character should feel.” | Comparable identity directions under one neutral fixture—no automatic beauty score or identity lock. |
| “I like this face direction, but I cannot describe the features.” | A provider-neutral semantic morphology spec with structural relations, locks, bounded variation and neutral three-view review. |
| “Keep this person recognizable as live action, Anime and Manga.” | Exact Character-to-Style `RepresentationBinding` artifacts and a six-family comparison fixture without mutating Canon. |
| “Turn this premise into a real scene.” | Dramatic question, causal beats, playable action, subtext and continuity facts. |
| “Use this courtyard in several shots.” | Versioned geography, material, weather, physical light and interaction constraints. |
| “I like this look but not the depicted person.” | A byte-bound reference asset, atomic style observation and explicit identity ignore rules. |
| “拆解这张人像并反推可复用提示词。” | Separate face-identity, skin-material, appearance, style and capture observations, then compile only the requested reusable contracts. |
| “Make this tea-house escape shootable.” | An `ActionSequenceSpec` with ordered beats, bound geography, physical-design checks, coverage, closed continuity and visible qualified-review risks. |
| “Make the shot feel intimate.” | Blocking, attention order, lens, depth, motivated shot lighting and a stable temporal end state. |
| “Write the actual image prompt.” | A reusable Chinese, English or bilingual PromptRecord with a visibility budget and testable constraints. |
| “Build a 3×3 sheet reliably.” | Independent tile tasks and deterministic external assembly with per-tile hashes. |

The current AIGC design review extends this same boundary-first approach to
makeup and styling states, camera previsualization, storyboard coverage,
open-source adapter capability and a post-import ControlBench review receipt.
See [the 2026-08-24 design note](docs/research/2026-08-24-aigc-skill-design.md),
[the 2026-08-26 production realism review](docs/research/2026-08-26-production-cinematic-realism.md)
and [the visual-first AIGC studio path](skills/cineweave/references/aigc-studio.md).

### Visual-first AIGC studio loop

Use `$cineweave` when you want one guided entry across the whole creative
process:

```text
  idea
  → CreativeBrief + WorkflowPlan
  → optional MidjourneyExplorationCase import (prior prompt + ReferenceAsset-backed result images)
  → optional MidjourneyAestheticProfile (creator Personalization or project Moodboard)
  → MidjourneyPromptPack (3–8 hypotheses)
  → you explore and select master references in Midjourney
  → ReferenceAsset / observations / review / binding
  → approved visual bible
  → story + character + scene + style + director
  → prompts + storyboard + asset recipes + workflow-template provenance + production gates
```

The first response stops at a human gate. Bring back the selected original
files, exact prompts, model/version/parameters, selection notes and usage
status; the workflow then resumes from `cineweave-reference`. A master image is
never silently treated as identity, costume, style, scene and composition at
once. See the [Midjourney projection contract](skills/cineweave-prompt/references/midjourney-projection.md),
[aesthetic profile guide](skills/cineweave-prompt/references/midjourney-aesthetic-profiles.md)
and the [executable workflow example](packages/cineweave-contracts/examples/workflow-plan-aigc-studio.json).

### Reuse previous Midjourney explorations

Use `$cineweave-prompt` `midjourney_case_import` to turn an explored style into
a reusable case: the original prompt, model/parameters, selected or rejected
notes and actual result images are retained together. Result images first pass
through `$cineweave-reference` as exact `ReferenceAsset` records; a new prompt
pack can then reuse only declared dimensions such as visual grammar, palette,
lighting, material response or composition. It never silently transfers the
old subject, logo, location or rights claim. See the
[case-library guide](skills/cineweave-prompt/references/midjourney-case-library.md)
and the [contract example](packages/cineweave-contracts/examples/midjourney-exploration-case.json).

```text
Use $cineweave. I have an idea for a short film. First give me three
Midjourney visual-exploration directions with one hypothesis per variant. I
will run them myself and return selected master references. After that, keep
the approved visual bible consistent while developing the story, characters,
scenes, shots, storyboard, image prompts and production plan. Pause at every
human gate; never claim a provider was called.
```

## Install in Codex

Install the immutable release tag:

```bash
codex plugin marketplace add Wilder1222/cineweave-studio --ref v2.5.1
codex plugin add cineweave-studio@cineweave-studio
```

Start a new Codex task after installation so the all-in-one entry and nine
specialist Skills are discovered. Release tags are immutable; development on
`main` is not the installation pin.

## Nine specialist Skills and one studio entry

Every specialist works directly from a bounded brief and may also consume exact
upstream contract refs. `$cineweave` is the all-in-one visual-first studio
entry; specialist Skills remain independently invocable.

| Skill | Owns | Typical outputs |
| --- | --- | --- |
| `$cineweave` | visual-first AIGC intake, resumable stage orchestration and acyclic workflow planning | `CreativeBrief`, `WorkflowPlan` (first step can be `MidjourneyPromptPack`) |
| `$cineweave-story` | dramatic causality, script scenes and story continuity | `StoryBrief`, `BeatSheet`, `ScriptScene`, `ContinuityLedger` |
| `$cineweave-character` | identity exploration, semantic morphology, appearance, behavior and actor timing | exploration contracts, `CharacterMorphologySpec`, `MorphologyReview`, `CharacterSpec`, bindings and timelines |
| `$cineweave-scene` | geography, architecture, materials, physical light and interaction | `SceneSpec`, `SceneState`, `SceneLightState`, bindings and reviews |
| `$cineweave-style` | one-axis style exploration and visual/temporal representation grammar | style exploration contracts, `StylePackage`, `RepresentationBinding`, `StyleCompile`, `StyleLightGrammar` |
| `$cineweave-reference` | content-addressed media, content-credential inspection, atomic observations, suitability, exact role bindings and scoped creator aliases | `ReferenceAsset`, `ContentCredentialInspection`, `ReferenceObservation`, `ReferenceReview`, `ReferenceBindingSet`, `AssetAliasRegistry` |
| `$cineweave-director` | action choreography, shot purpose, blocking, camera, shot light use, time, visual anchoring, sequence rhythm and parameterized cinematic compilation | `ActionSequenceSpec`, `CinematicSkillManifest`, `ShotCompilerPlan`, `ShotSpec`, `HeroFrameAnchor`, `ShotLightingPlan`, `TemporalSpec`, `CameraPrevisSpec`, `Storyboard`, `SequenceRhythmSpec`, `RenderPlan` |
| `$cineweave-prompt` | general text-to-image prompts plus Midjourney profiles, exploration packs/cases | `PromptRecord`, `ImagePrompt`, `MidjourneyAestheticProfile`, `MidjourneyPromptPack`, `MidjourneyExplorationCase`, explicit reference transforms, hypotheses and one-variable repairs |
| `$cineweave-production` | recipes, deterministic board assembly, rational-frame editorial, local media-technical probing, technical color and content-credential handoffs, guarded contract-aware repairs, workflow-template provenance, controls, evidence, capabilities, rights, execution intent and QA | `AssetRecipe`, `BoardAssemblyPlan`, `EditorialTimelinePlan`, `MediaTechnicalProbe`, `ColorPipelineProfile`, `ContentCredentialHandoff`, `RepairRunReceipt`, `WorkflowTemplateProfile`, capability/license profiles, `ControlBenchmarkReview`, `AdapterDescriptor`, `ExecutionRequest`, `ExecutionReceipt` |

The Director creator layer keeps the authoring surface legible while preserving
exact downstream contracts: `AssetAliasRegistry` expands scoped `@Asset` names
to exact existing refs; `HeroFrameAnchor` locks a selected still to an
exact `ShotSpec` and separates visual DNA from inheritance policy;
`SequenceRhythmSpec` maps a storyboard to rational, contiguous shot windows and
tempo phases. `CinematicSkillManifest` and `ShotCompilerPlan` add a
parameterized creator layer: the manifest describes reusable programs and the
compiler resolves exact inputs into projection-only controls and planned owner
handoffs. These artifacts are provider-neutral plans and cannot generate, edit
or approve media.

### Start without prompt terminology

```text
Use $cineweave-character. I want an adult historical woman who feels restrained
but quietly warm. I do not know facial terminology. Give me four comparable
identity directions with the same neutral light, pose, hair and simple clothing.
Do not rank beauty or lock an identity.
```

### Semantically sculpt and verify a character

```text
Use $cineweave-character. Keep the current adult identity direction, make the
eye opening moderately longer and slightly less vertically open, preserve the
jaw and nose, and explore only nearby eye-shape variants. Express the edit as
semantic axes and structural relations—not provider weights or biometric
measurements. Then plan a neutral front, three-quarter and profile review; do
not lock identity until I approve the review.
```

### Explore style without changing Canon

```text
Use $cineweave-style. Keep the exact character, appearance, scene, action,
camera and physical light. Compare four representation directions along one
axis only: natural-human, naturalistic Anime, cinematic Manga and painterly
illustration. Return a StyleOptionSet for human preference; do not activate a
StylePackage automatically.
```

### Bind one character across representations

```text
Use $cineweave-style. Map this exact CharacterSpec into the approved Anime
StylePackage. The eyes may be simplified and the iris modestly enlarged, but
preserve their long shape, spacing, upward outer-corner direction and subtle
asymmetry. Return a RepresentationBinding; do not rewrite CharacterSpec.
```

The contract package includes complete provider-neutral examples for
[`Natural Human`](packages/cineweave-contracts/examples/style-package.json),
[`Anime`](packages/cineweave-contracts/examples/style-package-anime.json) and
[`Manga`](packages/cineweave-contracts/examples/style-package-manga.json), plus
deterministic family fixtures in the
[`recipe catalog`](packages/cineweave-contracts/recipes/catalog.json).

### Bind a reference without contamination

```text
Use $cineweave-reference. Ingest this image once, then create one observation
for palette and light only. Ignore the depicted person's identity, costume,
pose, background content and composition. Keep rights unresolved and block
production promotion until an exact LicenseProfile is approved.
```

### Decompose a portrait before compiling its prompt

```text
Use $cineweave-reference to ingest and review this portrait, then create separate
face_identity, skin_surface, skin_material, makeup, hair, capture, lighting, composition and
style/palette observations only where visible. Keep lens metadata inferred and
rights unresolved. Hand stable identity to CharacterSpec, the visible skin and
styling state to CharacterAppearanceState, representation to StyleCompile and
viewpoint to ShotSpec; bind the exact targets before Prompt compiles the image.
```

The complete dependency example is
[`workflow-plan-portrait-reference.json`](packages/cineweave-contracts/examples/workflow-plan-portrait-reference.json).

### Develop story before shots

```text
Use $cineweave-story. A physician meets the person she once pushed away in a
rain-washed courtyard. Build one dramatic question and a causal short-film beat
sheet. Every beat needs an objective, conflict, choice, changed state and reason
for the next beat. Do not add camera directions.
```

### Direct the observed moment

```text
Use $cineweave-director. Stage the recognition beat at the courtyard threshold.
Define what the audience notices first, blocking and weight, relationship axis,
50mm perspective, focus, physical light use, the motivated camera curve and a
stable end state. Return a ShotSpec, not an image prompt.
```

### Choreograph action before shots

```text
Use $cineweave-director with these exact ScriptScene, CharacterBindings,
PerformanceTimelines, SceneBinding and InteractionConstraintSets. Break the
tea-house protection and window escape into ordered action beats, physical
checks, coverage requirements and closed continuity. Flag weapons, height and
water for qualified review. Return ActionSequenceSpec before choosing lenses.
```

The complete dependency example is
[`workflow-plan-action-sequence.json`](packages/cineweave-contracts/examples/workflow-plan-action-sequence.json).

### Compile any image domain

```text
Use $cineweave-prompt to create a reusable Chinese product-photography prompt
for a celadon teapot. Describe viewpoint, silhouette, support surface, contact
shadow, reflection cards and glaze roughness. Remove empty “premium/8K” wording,
keep one primary target and make variants change one hypothesis each.
```

### Import a cinematic director template

```text
Use $cineweave-prompt with the cinematic-template-import route. Preserve this
Chinese short-drama/anime/manga template exactly, then split its global visual
baseline, per-shot camera and timing, physical light, delivery intent and sound
intent. Hand shot decisions to ShotSpec/TemporalSpec, style to StyleCompile and
delivery/audio capabilities to Production. Keep 8K, 24fps, dB, lip-sync and
camera-brand claims unresolved until an exact CapabilityProfile verifies them.
```

## How composition works

```text
natural language + optional untrusted media
                       │
             all-in-one $cineweave
                       │
            CreativeBrief + WorkflowPlan
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
       Story       Prompt/MJ      Reference
                       │              │
                 human selection     │
                       └──────┬───────┘
                              ▼
                    Character / Scene / Style
                              │             │
                              └──────┬───────┘
                                     ▼
                    Action / Shot Director
                              ▼
                    Prompt / Storyboard
                              ▼
                          Production
                              ▼
             immutable artifacts + reference blobs
                              ▼
           exact-request human approval when needed
                              ▼
              trusted registered adapter runtime
                              ▼
             verified Draft output + execution receipt
                              │
                  ControlBench review receipt
```

This is a default dependency direction, not a requirement to invoke every
Skill. A product prompt can go directly to Prompt; a script rewrite can go
directly to Story; a reference suitability review can go directly to Reference;
a rights audit can go directly to Production.

Key boundaries prevent common drift:

- Reference binds exact bytes and one role per observation; downstream Skills
  decide how accepted evidence affects their own domain.
- Portrait surface semantics stay split: CharacterSpec protects stable baseline
  facts, CharacterAppearanceState records the current visible skin state, and
  StyleCompile controls realism/retouch representation at the requested scale.
- Identity, appearance and representation remain three independent spaces:
  semantic morphology defines the person, AppearanceState defines the current
  construction and condition, and RepresentationBinding translates protected
  anchors into one visual medium without mutating Canon.
- Scene places physical light sources; Style defines how light is represented;
  Director chooses how existing sources function in one shot.
- Character defines actor behavior timing; Director aligns camera timing without
  rewriting the performance.
- ActionSequenceSpec arranges exact Story, Character and Scene facts into beats,
  coverage and sequence continuity; it does not rewrite those facts or imply
  stunt-safety approval.
- Director defines the shot; Prompt compiles the shot and other exact facts into
  model-facing language.

Composition uses exact kind, ID, version and content hash. No Skill silently
resolves “latest” or relies on hidden conversation state.

## Deterministic local runtime

V2.5.1 packages the V2.5.0 dependency-free Node.js runtime for immutable local
artifacts, bounded content-addressed reference ingestion, exact dependency
graphs, hash-bound approval gates, safe project transfer, deterministic board
assembly and trusted adapter execution with byte-verifiable receipts.

```bash
npm test
node packages/cineweave-runtime/bin/cineweave.mjs init ./demo --id project.demo --name "Demo"
node packages/cineweave-runtime/bin/cineweave.mjs put ./demo ./story-brief.json --id story.demo --version 1
node packages/cineweave-runtime/bin/cineweave.mjs verify ./demo
node packages/cineweave-runtime/bin/cineweave.mjs graph ./demo
node packages/cineweave-runtime/bin/cineweave.mjs gate ./demo ./story-envelope.json --require-current
node packages/cineweave-runtime/bin/cineweave.mjs reference-ingest ./demo ./reference.png --source-class user_upload
node packages/cineweave-runtime/bin/cineweave.mjs reference-verify ./demo ./reference-asset-envelope.json
node packages/cineweave-runtime/bin/cineweave.mjs export ./demo ./demo-transfer
node packages/cineweave-runtime/bin/cineweave.mjs bundle-verify ./demo-transfer
node packages/cineweave-runtime/bin/cineweave.mjs import ./demo-transfer ./demo-copy
node packages/cineweave-runtime/bin/cineweave.mjs adapters
```

Artifacts are canonicalized with RFC-8785-compatible JSON rules and stored
under `.cineweave/`. One kind/ID/version can bind to only one content hash.
Approvals reference that exact hash.

Reference ingestion allow-lists PNG, JPEG, WebP, MP4/M4V, MOV and WebM,
requires extension/signature agreement, limits bytes and image dimensions and
stores generated non-executable blob names without retaining source paths or
original filenames. This is a bounded byte probe—not media decoding, malware
scanning, provenance authentication or a license grant. Embedded metadata is
preserved but uninspected until a separate privacy review.

`graph` reports resolved, missing and same-version hash-mismatched refs. An old
exact ref remains valid but is labeled superseded when a newer version exists.
`gate` never transfers approval from one version to another; optional policies
can also require current dependencies and dependency approvals. Export creates
a directory bundle with a manifest and byte hash for every file. Import rejects
links, unsupported paths, unexpected files, digest changes and existing target
stores before atomically installing the verified `.cineweave` directory. A
bundle is local transfer evidence—not permission to redistribute its content.

The core ships one zero-cost, network-free SVG fixture adapter for deterministic
tests. Contracts cannot provide commands, module paths, endpoints or credential
values. External adapters must be registered as trusted code, match their
declared implementation hash, receive approval for the exact stored request and
be explicitly enabled by the caller. Every attempt and its cost is retained in
an immutable `ExecutionReceipt`.

Multi-panel outputs are assembled after independent tile generation:

```bash
node packages/cineweave-runtime/bin/assemble-board.mjs --manifest board.json --out board.svg --allow-partial
```

The assembler records every tile hash and failed tile ID. It never asks an
image model to invent the grid, labels and all panels in a single pass.

### Codex-first multi-world control plane

The [multi-world studio example](docs/examples/multi-world-studio/README.md) now
includes an executable Decision Cycle World OS. Codex is the sole orchestrator
and authoritative writer; exact action catalogs, one-to-three-candidate branch
sets, delayed consequences and deterministic rule/version checks advance a clearly
labelled non-Canon simulation branch. Terminal event commits derive rebuildable platform
projections and an idempotent MCP outbox. MCP remains projection-only, while a
future LLM API is constrained to proposal generation with no approval, commit or
state-write capability.

In the `0.4.0` milestone, Codex still authors the catalogs and invokes the
control plane, but the safe human loop is executable: a gated decision becomes
an exact `GateRequest`, a human `GateDecision` can resume that same proposal,
and a separate Canon promotion writes `CanonFact` plus `ContinuityLedger`.
Missing templates create an immutable `awaiting_codex_template` work item that
Codex can fill with a versioned catalog before resuming from the same head.
Platform feedback can now be recorded as a deduplicated, privacy-bounded
`ExternalSignal`; Codex can attach an immutable `ExternalSignalUseReceipt` to an
exact Proposal or explicitly defer/dismiss the signal, while it remains
observation-only input. Natural-language
intake and autonomous long-horizon creation remain outside the runtime boundary.
The same release also provides a weighted-fair Portfolio scheduler that calls
the existing single-world cycle without merging world state or Canon.
It also provides an L1 BrandEcho registry with a separate human activation Gate:
shared motifs may be recognized across worlds, but cannot share actors/items,
mutate Canon, or create cross-world causality.
The production bridge now binds an exact simulation Commit to provider-neutral
Story/Character/Scene/Style/Shot/Prompt/Rights snapshots and ordered human Gates;
its release state is private-workspace-only until a separate media and platform
receipt exists. After the Rights Gate, `production-execution-plan` compiles the
slice into a provider-neutral RenderPlan and generic `ExecutionRequest`;
`production-execution-run` re-verifies the latest slice version and delegates to
the generic adapter runtime for fixture/dry-run/external receipts. The local
`production-media-import` callback can verify successful PNG/JPEG/WebP output
bytes and bind a versioned Draft MediaImport to its exact RenderPlan and paired
execution evidence; it still cannot mark an ApprovedAsset or create a Release.
The local post-media lifecycle now also
records a human QA checklist, a private ApprovedAsset binding and a private
ReleaseReceipt after their respective Gates; `public` remains false until a
separate successful non-authoritative platform receipt exists. A local fixture
receipt proves only the bridge and output hashing, not a real provider, QA,
ApprovedAsset or public Release.
The `brain-run` command now composes these boundaries into one bounded Codex
control cycle: preflight verification → optional proposal-only LLM shadows →
weighted-fair Portfolio simulation → MCP dry-run or explicit trusted dispatch →
postflight verification. A content-addressed `CodexBrainRunReceipt` links every
child receipt, so recovery and review do not depend on hidden process memory.

The runtime implementation milestone is `0.4.0`; persisted World OS artifacts
remain on the separately versioned `0.1.0` wire contract until a migration is
available.

```bash
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
npm run worlds:portfolio
npm run worlds:brain
npm run worlds:brain-status
npm run worlds -- dispatch .build/multi-world-studio examples/multi-world-studio/platforms/studio-platform.json --dry-run
npm run worlds -- brain-status .build/multi-world-studio --worlds W01,W02
npm run worlds -- brain-runs .build/multi-world-studio
# Long-running local control surface (loopback by default):
npm run worlds:serve
```

The list above is the autonomous bounded-run path. `npm run worlds:step` is the
single-cycle alternative, and a later `worlds:run` can resume from that exact
head. The three `worlds:simulate*` scripts are a
separate fixed-fixture path that must start from an independent fresh store;
they cannot be replayed after `worlds:run` on the same branch.

See the [Codex World OS operating model](docs/examples/multi-world-studio/10-codex-world-os.md).
The configured MCP server/tool names are integration placeholders; the local
dispatcher and LLM shadow commands record claims, attempts, proposals and usage,
but the example does not claim a real platform or external model call. Candidate
worlds can now pass through immutable `WorldRegistration` + named inception
approval before a complete runtime package is attached and dynamically scheduled.
Optional
`mcp-stdio` and OpenAI-compatible adapters now provide bounded, explicit-trust
process/HTTP boundaries; they remain inert until a deployment supplies a server,
endpoint, credentials and the corresponding `--allow-network` flag.
The World OS package also includes a bounded HTTP/Streamable-HTTP MCP connector
with environment-only API-key injection, session-header handling and JSON/SSE
response validation; it still does not claim a deployed platform.
The Brain and `llm-shadow` CLIs can construct the OpenAI-compatible proposal
provider directly from an endpoint/model and an environment-key name, while
keeping proposal-only authority and usage receipts.
`world-os serve` exposes the same bounded Brain through a loopback-first HTTP
surface for a studio UI or scheduler; it serializes runs, requires environment-only
Bearer auth for a connector, network dispatch or non-loopback binding, and never
accepts remote connector/provider objects or State/Canon mutations. Network dispatch
also requires the explicit server `--allow-network` flag. Server-side LLM shadow
profiles can be loaded at startup with `--shadow-profiles`; HTTP callers may only select
their ids with `shadowProfileIds`, and network-backed profiles additionally require
`--allow-llm-network`. The same control surface now exposes receipt-bound
`POST /v1/signals` and `POST /v1/signal-uses` routes for privacy-bounded platform
feedback; they remain observation-only and never write State or Canon directly.

## Verification

The current source gate validates 89 contracts, 86 uniquely owned routes and 15 built-in
deterministic recipes. It also validates every schema/example pair, semantic
positive and negative cases, 76 static behavior cases, validated modern and legacy
evaluation fixtures, a 33-case deterministic live-evaluation replay set with
inline contract-payload evidence, runtime and World OS test suites, together
with standalone Skill bundles, reference links and lifecycle audit, rights boundaries,
media-ingestion threats and distributable assets.

```bash
npm test
npm run validate
node scripts/run-live-skill-evals.mjs --plan --model <model>
```

CI runs on Windows and Linux. See [release policy](docs/release.md),
[architecture](docs/architecture.md), [language policy](docs/language-policy.md)
and the [V2.5 identity and representation research note](docs/research/2026-08-22-v2.5-identity-and-representation-foundation.md).

## Repository map

```text
skills/                         all-in-one entry plus nine independently invocable Codex Skills
packages/cineweave-contracts/   schemas, examples, ownership and recipes
packages/cineweave-runtime/     immutable store, reference blobs and deterministic tools
packages/cineweave-world-os/    Codex single-writer simulation and MCP outbox control plane
tests/                          runtime, behavior, activation and workflow tests
scripts/                        release, bundle, semantic and security checks
docs/                           architecture, research, roadmap and migration
docs/examples/multi-world-studio/ creator-facing multi-world AIGC studio blueprint
examples/multi-world-studio/    machine-readable worlds, states, schemas and event fixtures
```

## Scope and license

The core remains provider-neutral and human-gated. It does not include paid
model adapters, credentials or bundled user/third-party reference media. MIT
licensed; see [LICENSE](LICENSE).

Built by [Wilder1222](https://github.com/Wilder1222).
