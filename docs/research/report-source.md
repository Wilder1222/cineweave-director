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
