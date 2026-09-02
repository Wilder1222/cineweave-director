# Research source record: open-source AIGC skill design

Date: 2026-08-24
Scope: open-source image/video generation, cinematic previs, character identity, appearance transfer, camera control, storyboard production and agent skill design.
Decision target: improve the CineWeave skill system without moving ownership into provider-specific prompts or claiming that a graph can prove visual quality.

## Executive decision

The strongest reusable pattern is a layered control stack:

`intent → asset state → shot/time state → adapter controls → review receipt`

The stack should be exact at the handoff boundaries and flexible inside each owner. Character owns identity and appearance; Scene owns geography and physical sources; Director owns dramatic purpose, blocking, camera, temporal direction and coverage; Prompt translates approved facts; Production maps them to capabilities, rights, evidence and reproducible execution. A provider workflow is an adapter at the edge, not the creative contract.

This research therefore recommends:

1. Make makeup, hair, wardrobe, accessories and skin response explicit, scoped AppearanceState variables with role-specific references and masks.
2. Make camera behavior a hierarchy from sequence coverage to shot purpose to movement curve to pose/keyframe to rendered frame.
3. Make storyboard work a coverage ledger plus independent panel tasks and deterministic assembly.
4. Treat ComfyUI-style graphs, ControlNet, IP-Adapter/ID adapters, segmentation, motion modules and appearance-transfer models as capability patterns with evidence, limits and license metadata.
5. Keep unknown capability, unknown rights and unverified continuity visible; never resolve them with confident prose.

## Reusable design primitives

| Primitive | Required state | Owning CineWeave skill | Review question |
| --- | --- | --- | --- |
| Identity anchor | exact CharacterSpec, stable anchor IDs, rights status | Character | Does identity survive crop, angle, hair occlusion and expression change? |
| Look state | versioned AppearanceState for hair, makeup, costume, skin material and accessories | Character | Did the look change only where requested, and does it remain compatible with action? |
| Spatial state | SceneBinding, geography, axis, contact and physical sources | Scene | Can a viewer reconstruct where the subject and support surfaces are? |
| Dramatic state | purpose, objective, obstacle, action beat and end-state change | Story/Director | Does the shot change information, attention, pressure or relation? |
| Camera state | scale, position, height, angle, focal intent, focus and axis | Director | Does the camera make the beat readable? |
| Temporal state | motivated movement curve, action/focus events, secondary motion and stable end | Director | Is there one dominant camera behavior with an intelligible start, peak and stop? |
| Coverage state | beat-to-shot ledger, continuity tracks and panel dependencies | Director/Production | Can a failed tile be regenerated without invalidating passing tiles? |
| Adapter state | control channels, capability profile, workflow snapshot, dependencies and limits | Production | Is every hard requirement supported, evidenced and rights-safe? |
| Evidence state | source hash, recipe/seed/log, output provenance and human review | Production | What was actually executed, and what remains only designed? |

## Open-source patterns reviewed

### Agent skill and production architecture

- [director-skills](https://github.com/0xhughs/director-skills) separates creative intent, cinematic execution and model adaptation, then distributes procedures across focused skills with references, templates, examples, tests and safety notes.
- [StoryMind](https://github.com/LinHao-city/StoryMind) uses a storyboard-first pipeline, structured character anchors, scene consistency tracking, capability preflight, checkpoints and explicit human approval.
- [ai-video-pipeline](https://github.com/0xadvait/ai-video-pipeline) keeps prompts in source, logs API calls in manifests, passes a character bible through panels, bridges keyframes and regenerates only failed panels.
- [AI Video Production Editor](https://github.com/LudwigKienle/ai-video-production-editor) and [ai-cinematic-pipeline](https://github.com/billpar/ai-cinematic-pipeline) reinforce the script-to-shot-to-continuity-review shape and short, controllable shot beats.

### Graph orchestration and reproducibility

- [ComfyUI nodes](https://docs.comfy.org/basic-concepts/nodes) and [workflows](https://docs.comfy.org/basic-concepts/workflow) make each operation explicit, typed and serializable; [templates](https://docs.comfy.org/interface/features/template) expose dependencies and can be reused or validated before execution.
- [ComfyUI skills](https://docs.comfy.org/agent-tools/skills) package model guidance, workflow patterns and commands that can be loaded on demand. The reusable lesson is progressive disclosure plus a capability boundary, not a universal prompt.

### Identity, spatial control and motion

- [ControlNet](https://github.com/lllyasviel/ControlNet) demonstrates external spatial conditions as a separate control channel.
- [IP-Adapter](https://github.com/tencent-ailab/IP-Adapter) demonstrates decoupled image-prompt and text-prompt conditioning; the image reference should remain a typed input rather than being flattened into prose.
- [InstantID](https://github.com/instantX-research/InstantID) is a face identity adapter with important subject limits; [PuLID](https://github.com/ToTheBeginning/PuLID) is another identity-customization pattern.
- [SAM](https://github.com/facebookresearch/segment-anything) and [SAM 2](https://github.com/facebookresearch/sam2) show how promptable masks and video memory can make region-scoped editing and propagation explicit.
- [AnimateDiff](https://github.com/guoyww/AnimateDiff) and [StoryDiffusion](https://github.com/HVision-NKU/StoryDiffusion) show that motion and multi-frame consistency are distinct control problems, not merely longer image prompts.

### Appearance and styling

- [DreamO](https://github.com/bytedance/DreamO) separates identity, image-prompt, try-on and style routes; its task limits are a useful reminder that multi-condition support must be declared, not assumed.
- [CatVTON](https://github.com/fish-tech-ai/VTON) and [IDM-VTON](https://github.com/yisol/IDM-VTON) make garment transfer a distinct apparel task with parsing and pose dependencies.
- [BeautyBank](https://github.com/CyberAgentAILab/BeautyBank) and [MagicMakeup](https://github.com/vivoCameraResearch/Magic-Makeup) demonstrate makeup transfer, region masks and identity-preserving cosmetic edits as separate controls.

### Camera and previs

- [CinePreGen](https://arxiv.org/abs/2408.17424) treats camera behavior as a hierarchy from storyboard to camera behavior to camera pose, with global/local control, depth/pose/mask inputs and keyframe or curve-based motion.
- [CineVision](https://arxiv.org/abs/2507.20355) reinforces the value of script-grounded, interactive visual previsualization with character, lighting and style state.

## Design gaps found in the current package

| Gap | Risk | Resolution in this change |
| --- | --- | --- |
| Styling is structurally available but not yet a Director-ready look handoff | Makeup or wardrobe instructions collapse into adjectives or drift across shots | Add a scoped styling direction guide and a control-stack handoff |
| Camera fields exist but the sequence-to-pose hierarchy is implicit | A movement word can conflict with blocking, focus or edit timing | Add camera previsualization ladder and motivated curve rules |
| Storyboard guidance lacks an explicit coverage/partial-retry worksheet | Panels are regenerated as a monolithic grid and passing work is lost | Add coverage ledger and deterministic panel assembly guidance |
| Open-source adapters are discussed separately from creative contracts | A model limitation is mistaken for a creative failure, or an unknown dependency is hidden | Add adapter-pattern and capability-evidence guide |
| Review routes are strong but not grouped by control dimension | Repairs change too many variables at once | Add a reusable control card and dimension-to-owner matrix |

## Explicit non-decisions

- No provider prompt weights, node names, checkpoint IDs or secret endpoints are added to CineWeave creative contracts.
- No adapter is marked strong merely because its repository exists; runtime capability must be proved by a local or supplied receipt.
- No face-only identity tool is treated as full-body identity control.
- No style, makeup, retouch or segmentation mask is allowed to silently rewrite canonical identity.
- No generated image, workflow JSON or storyboard design is treated as execution evidence without provenance and review.

## Limits and maintenance

The repository and model ecosystem change quickly. Repository READMEs, papers and official documentation were preferred over social posts and prompt galleries. Community projects were used for architecture patterns, not as guarantees of quality or safety. Future updates should re-check repository activity, licenses, model weights, custom-node dependencies, input limits and evaluation evidence before promoting an adapter from unknown or experimental to partial or strong.

The next maintenance pass should add executable ControlBenchmark fixtures for the adapter classes that the runtime actually supports. Until then, the new documents are design guidance and do not imply that every listed open-source project is installed or executable in this workspace.

## 2026-08-29 addendum: visual-first AIGC studio path

The new design starts with a human-run Midjourney divergence loop, then returns
through exact reference evidence before any visual-bible lock or downstream
asset production. The detailed Chinese decision record is
[2026-08-29-visual-first-aigc-studio.md](2026-08-29-visual-first-aigc-studio.md).

### Provider projection findings

- Midjourney's [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics), [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts), [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference), [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) and [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards) support typed reference roles rather than a universal reference-image assumption.
- The official [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version) page makes version selection time-sensitive; the research snapshot recorded V8.2 as the default on 2026-08-29, so the contract pins and re-verifies rather than treating that value as permanent.
- The official [Video](https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video) page documents a separate still-to-video boundary where Image Prompt, Style Reference and Omni Reference are not automatically carried into video generations. The design therefore promotes a selected still through Reference and Director/Production inputs.

### Open-source architecture findings

- [`ai-video-pipeline`](https://github.com/0xadvait/ai-video-pipeline) provides the strongest compact pattern for prompts-in-source, manifest logging, character-bible propagation, static-panel-first generation and keyframe bridging.
- [`Comic-drama`](https://github.com/tccnnd/Comic-drama) and [`Storyboarder`](https://github.com/wonderunit/storyboarder) reinforce script/beat/shot/panel intermediates and fast human review instead of one opaque generation call.
- [`ComfyUI`](https://github.com/Comfy-Org/ComfyUI) and [`InvokeAI`](https://github.com/invoke-ai/InvokeAI) reinforce serializable workflows, staging/review, reusable graph boundaries and explicit execution rather than hidden provider state.
- [`ControlNet`](https://github.com/lllyasviel/ControlNet), [`IP-Adapter`](https://github.com/tencent-ailab/IP-Adapter), [`InstantID`](https://github.com/instantX-research/InstantID), [`InstantStyle`](https://github.com/InstantStyle) and [`StoryDiffusion`](https://github.com/HVision-NKU/StoryDiffusion) support separate spatial, identity, style and sequence-control channels. Their repository presence does not prove local capability or production fitness.

### Implemented decision

`$cineweave` now exposes `aigc_studio` and `studio` mode while preserving the
nine-Skill ownership model. `$cineweave-prompt` owns the new
`midjourney_compile` route and `MidjourneyPromptPack` projection. The pack
requires one primary target, one hypothesis per variant, separated reference
roles, explicit version/parameters, manual selection and exact-file return.
Downstream visual-bible, story, direction, prompt and production stages remain
separate exact-contract handoffs.

## 2026-08-30 addendum: production-template provenance and MJ compatibility

The detailed evidence record is
[2026-08-30-aigc-production-workflow-and-github.md](2026-08-30-aigc-production-workflow-and-github.md).

- Official [Midjourney Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)
  documentation still lists V8.2 as the current default at this research pass,
  while [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)
  is V7-only. A pack therefore cannot honestly combine a V8.2 policy with an
  Omni Reference slot; version/reference-role compatibility becomes an explicit
  validation rule rather than a prose reminder.
- Official [ComfyUI Workflow JSON](https://docs.comfy.org/specs/workflow_json),
  [Cloud API](https://docs.comfy.org/api-reference/cloud/overview) and
  [workflow-template](https://docs.comfy.org/custom-nodes/workflow_templates)
  documentation distinguish serializable graphs, jobs, assets, nodes and
  reusable templates. `CapabilityProfile` and `AdapterDescriptor` explain
  what an adapter can do, but do not identify the exact graph used by one run.
- [InvokeAI](https://github.com/invoke-ai/InvokeAI) reinforces workflow plus
  gallery/metadata recall; [StoryDiffusion](https://github.com/HVision-NKU/StoryDiffusion)
  separates long-range consistency from a later condition-image video stage;
  [Wan2.1](https://github.com/Wan-Video/Wan2.1) exposes materially different
  text-to-video, image-to-video, first/last-frame and edit inputs. These are
  reasons to record an exact template profile and role-scoped bindings rather
  than make a generic “video capable” claim.
- This increment adds a Production-owned `WorkflowTemplateProfile` and an
  optional exact binding from an `ExecutionRequest`. It records serializable
  template identity, content hash, dependency locks and input mappings without
  storing provider URLs, nodes, credentials or claiming that a template has
  executed. Runtime preflight now verifies the active profile, adapter/operation,
  template hash, input slots, output slot and profile license refs before an
  adapter invocation.

## 2026-08-30 addendum: versioned Midjourney aesthetic layers

- Official [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards)
  documentation defines a curated image collection used through `--p`; a board
  ID resolves to a versioned code, and Moodboard influence is controlled through
  `--s` from 0 to 1000 (default 100). It explicitly disallows `--sw` and
  `--sv` with Moodboards.
- Official [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization)
  documentation distinguishes selection-history Personalization Profiles from
  a curated Moodboard. A V7 Global Profile works with V8.2, while V8 profiles
  are not compatible with V7. Both require version re-check before execution.
- The implementation adds Prompt-owned `MidjourneyAestheticProfile`, a
  `midjourney_profile_import` route and explicit profile bindings in
  `MidjourneyPromptPack`. The design treats creator baseline, project
  Moodboard, shot-level references and the current shot prompt as separate
  controls; it records exact `--p` ID/code snapshots and rejects an invalid
  Moodboard + `--sw`/`--sv` parameter mix structurally.

## 2026-08-31 addendum: Director Skill contract and evaluation closure

The detailed Chinese review is
[2026-08-31-cineweave-director-skill-gap-research.md](2026-08-31-cineweave-director-skill-gap-research.md).

### Verified local findings

- The reviewed Director baseline owned nine routes but only eight contract
  kinds. The `repair` route had no Director output contract even though the
  Skill requires JSON-only output for CineWeave import. The current workspace
  closes that gap with `cineweave_codex_director_repair`.
- The reviewed baseline allowed `ShotSpec` to carry exact refs to
  `ShotLightingPlan` and `TemporalSpec`, while both downstream contracts
  required an exact `shotSpecRef`. Because each contract ref includes a content
  hash, the populated examples formed an unsatisfiable content-hash cycle
  rather than a harmless object back-link.
- The reviewed Storyboard baseline lacked the fields required by its guidance:
  exact action-beat selection, a coverage ledger, independent panel work and
  production provenance. The current 2.5.0 Storyboard now persists an exact
  ActionSequence scope, per-shot ShotSpec refs, bidirectional coverage rows and
  optional exact BoardAssemblyPlan panel bindings; schema, semantic and unit
  checks cover the closure.
- Thirteen static behavior definitions now select Director, covering all ten
  Director routes. The 28-case committed live suite now carries one
  schema-valid, semantic-valid replay for every Director route plus a
  Production repair-run replay, and declares Director coverage against the
  manifest so a later route addition cannot silently lose replay evidence.
- All twenty-six Director reference files now have an explicit lifecycle:
  eighteen are directly route-loaded from `SKILL.md` and eight are preserved as
  archived material with a declared owner and existing successor. A release
  audit rejects an unclassified file, an archived file exposed by the Skill, or
  a missing successor.
- Production now owns a bounded MediaTechnicalProbe for exact MediaImport/media
  byte bindings. Its local ffprobe command records selected container and
  stream fields, makes omissions explicit, hashes only a sanitized report and
  excludes paths, tags, packets and extradata. It is technical evidence only:
  it does not write media, interpret color or approve quality.
- Production now also owns the contract-aware repair runner. It requires exact
  plan approval, uses only hashed local non-writing adapters, keeps the parent
  immutable, verifies one target-path diff plus unchanged exact dependencies,
  and records next-version candidates through a review-pending
  `RepairRunReceipt`.

### External design constraints

- The [Agent Skills specification](https://agentskills.io/specification) and
  [OpenAI Build skills guide](https://learn.chatgpt.com/docs/build-skills)
  reinforce focused Skills, progressive disclosure, explicit inputs/outputs
  and tested trigger behavior.
- [OpenAI evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices)
  supports task-specific continuous evals, explicit criteria, pairwise or
  pass/fail judgments and human calibration. The local live harness should
  validate actual payloads rather than self-declared contract names.
- [OpenUSD Camera](https://openusd.org/dev/api/class_usd_geom_camera.html) and
  [CameraBench](https://arxiv.org/abs/2504.15376) support an optional
  CameraPrevisSpec that separates camera intrinsics from extrinsics while
  leaving the base ShotSpec semantic and compact.
- [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/otio-serialized-schema.md),
  [OpenColorIO](https://opencolorio.readthedocs.io/en/latest/guides/authoring/displays_views.html),
  [ffprobe](https://ffmpeg.org/ffprobe.html) and
  [C2PA](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
  provide mature models for editorial time, media metadata, color management
  and provenance.
  These should remain Production or Reference concerns; Director owns intent
  and consumes their exact artifacts.

### Recommended decision

The next increment should prioritize contract closure over more prose:

1. remove/deprecate ShotSpec back-refs and keep Lighting/Temporal downstream;
2. require schema-valid payloads in live evaluation;
3. completed: add Storyboard action/coverage bindings and production-board handoff;
4. completed: add DirectorRepair with exact direct targets and target-free
   cross-domain delegation;
5. completed: modernize DirectorProposals, RenderPlan and MediaImport while retaining legacy 2.0 reads;
6. completed: add the route-reference lifecycle audit, optional
   CameraPrevisSpec, its exact-reference CinematographyBench baseline,
   calibrated route/neighbor guards, and the first exact-artifact-bound
   DirectorQualityBench rubric with paired observed-media calibration gates;
   next add real imported-media calibration pairs and completed review evidence;
7. completed: add the Production-owned, OTIO-core-aligned EditorialTimelinePlan,
   local MediaTechnicalProbe, planned OCIO-model-aligned ColorPipelineProfile,
   Reference-owned ContentCredentialInspection and Production-owned
   ContentCredentialHandoff; defer actual OTIO/EDL/XML export, OCIO transforms
   and C2PA validator/manifest adapters to their owning Production/Reference
   increments.
8. completed: add the Production-owned contract-aware repair runner and
   `RepairRunReceipt`; keep adapter conformance, real-media evidence and
   external/media-writing adapters as later bounded increments.

### 2026-08-31 implementation status

The first recommendation is now enforced for new artifacts. The two legacy
ShotSpec properties remain visible as deprecated migration markers but are
forbidden by schema and semantic validation. Lighting and temporal examples
bind the canonical ShotSpec hash, architecture checks lock the dependency
direction, and an artifact-graph regression proves an acyclic two-branch
fan-out. The full release validation passes. A bulk migrator for already stored
legacy ShotSpecs remains follow-up compatibility work.

The second recommendation is also now enforced. Every live response must carry
inline payloads for its declared contracts; the runner checks exact kind
agreement, manifest ownership, schema validity and available semantic rules.
All committed replay fixtures were migrated and grade successfully. The suite
now contains 28 synthetic cases, including all ten Director routes and one
Production repair-run route; each
fixture carries a complete inline contract snapshot. This closes the former
path where prose could self-declare a contract kind and the separate gap where
only one Director route had replay evidence.

The third recommendation is now enforced as well. Storyboard 2.5.0 requires
identity/version, an exact ShotSpec ref for every shot, a bidirectional
coverage ledger and an explicit provider-neutral boundary. When an
ActionSequenceSpec is in scope, semantic validation checks its canonical hash,
selected beats and fully scoped source coverage. When Production supplies a
BoardAssemblyPlan, panel task, region and tile mappings are checked against
that plan; planned panels remain explicitly non-executed.

The fourth recommendation is now enforced too. DirectorRepair has a
schema-valid direct mode for one Director-owned variable and a delegation mode
for a non-Director observed owner. Direct repairs bind an exact target,
preserve passing dimensions, keep acceptance checks pending and reject media,
approval or success claims. Semantic and runtime negative tests reject a wrong
owner, incompatible target kind, stale target ref, cross-domain direct change
and a RenderPlan repair that rewrites the prompt binding. Legacy RenderPlan
payloads remain resolvable only through immutable artifact references, while
new 2.5 payloads also carry stable identity and exact source refs.

The repair execution gap is now closed at the narrow contract/runtime boundary.
Production's `runRepair` requires the exact immutable repair-plan reference, the
latest matching ApprovalRecord and the embedded approval gate where that plan
defines one. Its adapter registry accepts only explicitly hashed local adapters
that declare no network, media writes or parent mutation; adapters receive
frozen plan/parent JSON rather than project paths or provider credentials. The
runner validates next-version identity, unchanged exact dependency refs and a
single requested target-path diff before writing a new candidate. It then writes
an immutable `RepairRunReceipt` with before/after refs and pending human
acceptance. Missing approval, delegation, unavailable targets, unsafe adapters
and malformed or unbounded candidates remain blocked/failed without a media or
approval claim.

### 2026-09-01 follow-up: ranked residual gaps

The released workspace has 26 Director reference files: 18 are reachable from
route instructions and eight are now explicitly archived rather than silently
unreachable. The new `reference-lifecycle.json` classifies every file, gives
each archived document a responsible Skill plus one or more existing successor
paths, and the release audit rejects unclassified files, direct exposure of an
archived file, or missing successors. This implements the [Agent Skills
specification](https://agentskills.io/specification) guidance to keep loading
shallow and intentional. The existing link checker still parses both Markdown
and inline-code paths; all 97 Skill Markdown files pass.

The DirectorProposals part of the legacy migration is closed for new payloads:
its 2.5.0 shape has a proposal-set identity/version, declared exploration axes,
per-proposal primary delta and capability requirements, cost/risk classes, a
pending human selection, and an explicit provider-neutral, non-execution
boundary. The schema continues to accept only the legacy 2.0 provider-shaped
form for compatibility; runtime consumers were absent, so this did not require
a World OS event migration.

RenderPlan is now also closed for new payloads: 2.5.0 requires payload
identity/version, an exact PromptRecord or ImagePrompt ref and exact optional
AssetRecipe, ControlChannelSet, EvidenceBundle, CapabilityProfile and
LicenseProfile refs. The World OS compiler reuses its deterministic plan ID,
includes the revision in that identity to avoid collision with an old 2.0
artifact, and materializes its source Recipe before publishing the exact ref.
The prior 2.0 and unversioned prompt-string shapes remain readable.

MediaImport is now closed for new payloads: 2.5.0 requires an import
identity/version, an exact RenderPlan ref, auditable provenance and, when
available, a paired exact ExecutionRequest/ExecutionReceipt trace. The public
local verifier keeps its existing flag: canonical exact RenderPlan strings are
normalized into the 2.5 shape, while non-canonical legacy strings remain 2.0
for compatibility. World OS now persists the modern shape and continues to
verify old string-reference artifacts.

ShotLightingPlan is also closed for the documented fill gap: 2.5.0 makes
`fill: null` an intentional decision and requires every non-null use to declare
direct, bounced or transmitted transport. Indirect transport retains the
existing physical source plus a named surface anchor; the 2.2 shape remains
readable.

Evaluation coverage's first P1 phase is now closed: static behavior covers
every Director route, and the live suite declares the exact ten owned routes
as required coverage, with a schema-valid replay payload for each. The
Production-owned ControlBench now also includes a planned
CameraPrevisSpec-bound CinematographyBench case, whose schema and semantic
checks require an exact camera-plan ref, blind trained independent-reviewer
calibration, observable pass/warn/fail anchors, a minimum agreement threshold
and an explicit adjudication path while its review remains media-free.
It also includes a planned DirectorQualityBench case bound to exact
ActionSequence, ShotSpec, ShotLightingPlan, TemporalSpec, CameraPrevisSpec and
Storyboard refs. Its direction rubric separates shot purpose, action coverage,
spatial continuity, temporal causality and human direction. The calibration
contract requires paired observed media with balanced left/right presentation,
decisions on a left/right/tie scale, and observations bound to both media; the
completed review gate requires at least one pair for the Director quality
case/dimension.
This remains
consistent with [OpenAI's evaluation guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices):
use task-specific scoped tests continuously and calibrate automated checks with
human judgment. Six Director-targeted static negatives now route to the six
adjacent specialist owners, while six corresponding specialist live replays
explicitly exclude Director; a runtime guard fixes their case ID, route and
manifest owner. The next evaluation increment is real imported candidate media,
completed pair results and review evidence before optional paid live model
evaluations.

CameraPrevisSpec is now a bounded, optional Director contract rather than a
ShotSpec expansion. It binds exact ShotSpec and SceneBinding inputs, plus an
optional exact TemporalSpec; it declares scene-local meter coordinates, a
reduced rational frame rate, frame range, filmback, projection, clipping,
shutter, separate pose and intrinsic tracks, and provider-neutral
non-execution. Semantic tests reject stale dependencies, unordered tracks,
non-unit quaternions and a claimed zoom without a focal-length change.
[OpenUSD's camera model](https://openusd.org/dev/api/class_usd_geom_camera.html)
supports the same division between optics and transforms. Editorial time and
technical color remain downstream: [OpenTimelineIO](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/otio-serialized-schema.md)
defines rate-aware `RationalTime`/ranges and timelines,
[OpenColorIO](https://opencolorio.readthedocs.io/en/latest/guides/authoring/displays_views.html)
distinguishes scene- and display-referred transforms (now represented as a
non-executing Production plan), and
[C2PA](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
defines content binding and validation. These facts support Production/Reference
ownership rather than enlarging the Director creative contract.

The CameraPrevisSpec now has an explicit Production evaluation entry point:
CinematographyBench requires a canonical exact camera-plan ref, checks camera
path, intrinsics, focus and rational timing as separate dimensions, and keeps
its ControlBenchmarkReview planned until imported candidate media and exact
observations exist. This deliberately prevents a detailed camera plan from
being mistaken for visual evidence or a successful render.

The DirectorQualityBench increment is deliberately a rubric-and-evidence layer,
not a second benchmark family or a universal cinematic-quality score. Its
completed-state checks require distinct observed media, balanced presentation
order, observations from both media items and a Director-specific pair. The
repository's completed pair fixture is synthetic and structural only; the
canonical example remains planned until real imported candidate media and
human judgments are collected.

The calibration protocol deliberately follows the strongest applicable evidence
without claiming a local model benchmark: [CameraBench](https://arxiv.org/abs/2504.15376)
reports that expertise and tutorial training materially improve camera-motion
annotation, including dolly-versus-zoom discrimination; [VBench-2.0](https://github.com/Vchitect/VBench/blob/master/VBench-2.0/README.md)
keeps camera motion as a distinct controllability dimension; and
[GDPval](https://openai.com/index/gdpval/) uses blind expert comparisons with
detailed rubrics rather than treating an automated score as a replacement for
expert judgment. CineWeave therefore stores the review method and anchors,
not invented reviewer outcomes or a universal cinematic-quality number.

### 2026-09-02 follow-up: Higgsfield-inspired creator control layer

The Higgsfield comparison supplied for this review reinforces a useful product
distinction: creators need a small, visual control surface, while the runtime
needs exact immutable contracts. The current implementation therefore adds a
bounded Director slice rather than turning presets or provider controls into
Canon truth.

`HeroFrameAnchor` is the first half of that slice. It binds one exact
`ReferenceAsset` whole asset or one explicitly selected `MediaImport` frame to
one exact `ShotSpec`, carries separated camera/composition/appearance/scene
visual DNA, and makes inheritance explicit. Character identity and scene
geography are hard locks; only listed downstream motion/focus/light paths may
vary, and a protected-path change requires a new anchor. The contract is
provider-neutral, non-generating, non-writing and human-gated. Optional
`TemporalSpec.heroFrameAnchorRef` makes continuation auditable without creating
a hash cycle.

`SequenceRhythmSpec` is the second half. It binds one exact `Storyboard` to a
reduced rational frame timebase, zero-based contiguous inclusive shot windows,
ordered tempo phases, breathing points and adjacent transition grammar. This
captures sequence-level pacing separately from shot-local `TemporalSpec`; it
does not replace Production-owned `EditorialTimelinePlan`, claim that media
exists or export an edit.

The source gate now covers 89 contracts, 86 uniquely owned routes, 76 static
behavior cases and 33 deterministic live replay cases. Schema examples,
semantic context checks, static behavior, live fixtures, route lifecycle,
architecture, runtime tests and standalone bundles all cover the new routes.
This keeps the Higgsfield-inspired “hero frame first” and “tempo as a control”
ideas while preserving CineWeave's exact-ref, provider-neutral, one-owner and
non-execution boundaries. The `@Asset` alias registry and read-only exact-ref
resolver are now used by the Shot Compiler, which implements twelve
parameterized Atomic Cinematic Skills as reusable programs rather than prompt
or provider presets. The compiler emits projection-only controls and planned
owner handoffs; it does not fabricate canonical hashes or execute downstream
work.
