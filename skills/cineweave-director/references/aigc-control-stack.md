# AIGC control stack

Use this guide when a request spans characters, styling, camera, motion, storyboard panels and generation. It is an orchestration rule, not a provider prompt recipe.

## Core model

Keep five layers separate and pass exact artifacts between them:

`intent → asset state → shot/time state → adapter controls → review receipt`

Reference authority and rights are cross-cutting inputs to every layer. A downstream layer may narrow or select an upstream state, but it must not silently redefine it.

| Layer | Answers | Typical owner | Required handoff |
| --- | --- | --- | --- |
| Intent | Why does this image, beat or sequence exist? | Story + Director | purpose, audience attention, dramatic change |
| Asset state | Who/what is present and what is its current look and condition? | Character + Scene + Style | exact bindings, versions, hashes, state transitions |
| Shot/time state | Where are subjects, what is the camera doing, and when does the readable change happen? | Director | ShotSpec, ShotLightingPlan, TemporalSpec, Storyboard |
| Adapter controls | Which spatial, identity, appearance, mask, motion or style controls can enforce the brief? | Prompt + Production | PromptAsset, ControlChannelSet, CapabilityProfile, rights |
| Review receipt | What observed Draft media passed, what failed and what remains unknown? | Production + human reviewer | exact execution/import/observation evidence, `ControlBenchmarkReview`, failure dimensions, next action |

## Control Card

Create one Control Card for every requirement that could be lost during handoff. Keep it concise; do not turn it into a second prompt.

```text
requirement: the observable result
source: exact upstream artifact and field
scope: subject | region | shot | sequence | board tile
target: what the adapter or prompt must affect
enforcement: hard | soft | advisory
priority: canonical/rights | character/scene | director | lighting/material | style
preserve: facts that must survive the change
allowedDeviation: declared tolerance, or unknown
adapterRequirements: required control class and subject/input limits
reviewDimension: identity | appearance | geography | action | camera | light | continuity | rights
```

The same semantic requirement may have different enforcement at different scopes. “Keep the red scarf” is a hard appearance anchor for a character sheet, a continuity requirement for a shot, and possibly only a soft preference for a concept exploration.

## Domain matrix

| Domain | Owner | Source of truth | Control channel | Typical failure | Repair route |
| --- | --- | --- | --- | --- | --- |
| face/body identity | Character | CharacterSpec + exact identity refs | identity/reference | face drift, wrong silhouette, anchor loss | Character |
| makeup | Character | AppearanceState + makeup observations/masks | appearance/region edit | makeup becomes skin rewrite or generic beauty | Character, then Prompt |
| hair/grooming | Character | AppearanceState + hair refs | appearance/structure | parting, length or movement drift | Character |
| costume/accessories | Character | AppearanceState + costume refs | garment/appearance | wrong construction, missing layer, prop leakage | Character/Scene |
| skin material | Character | baseline-relative AppearanceState | material/surface | retouch, plastic gloss or changed complexion | Character/Prompt |
| geography/contact | Scene | SceneBinding + InteractionConstraintSet | spatial/depth/contact | floating, broken support, wrong axis | Scene/Director |
| action/performance | Character + Director | PerformanceTimeline + ActionSequenceSpec | pose/motion/action | unreadable causal beat, impossible contact | Character/Director |
| framing/composition | Director | ShotSpec/Storyboard | camera/composition | attention split, wrong scale or depth | Director |
| camera movement | Director | TemporalSpec | temporal/camera | multiple competing moves, no stable end | Director |
| physical light | Scene + Director | SceneLightState + ShotLightingPlan | source/shadow/exposure | style adjective replaces source logic | Scene/Director |
| representation | Style | StyleCompile + RepresentationBinding | style/medium | style rewrites identity or light | Style |
| execution | Production | CapabilityProfile + recipe/evidence | adapter/workflow | unknown dependency or unrepeatable output | Production |

## Operating rules

1. Start with the decisive observable change. If no information, attention, pressure or relation changes, it is a look or asset task rather than a shot task.
2. Bind exact identity, appearance, scene, light and reference versions before using high-specificity language.
3. Allocate one dominant control idea per shot. Supporting detail is allowed only when it does not compete with the primary target.
4. Keep camera behavior, actor performance and edit timing as separate tracks. They may be synchronized, but one track must not rewrite another.
5. Describe controls semantically at the creative boundary. Resolve node names, model weights, syntax and scheduler settings only in the adapter layer.
6. Treat masks and regional edits as scoped evidence. A mask says where a change may occur; it does not prove the desired change occurred.
7. Keep a detail budget. Only request details visible at the target scale or necessary for a continuity anchor.
8. Review passing dimensions before repair. A repair changes one owning variable and preserves all other passing constraints.
9. Unknown hard capability, unknown rights or missing exact references block an execution-ready plan. They do not get filled with a plausible default.

## Handoff order

```text
Story / brief
  → Character identity + AppearanceState
  → Scene geography + SceneLightState
  → Style representation binding
  → Director blocking + camera + time + coverage
  → Prompt observation/layer compilation
  → Production controls + capability + rights
  → independent generation / edit tasks
  → verified Draft import + provenance + human review
  → ControlBenchmarkReview + explicit next gate
```

For a one-off portrait, the Story and Scene layers may be minimal. For a multi-shot action sequence, the CharacterBinding, PerformanceTimeline, SceneBinding, InteractionConstraintSet and ActionSequenceSpec are not optional shortcuts.

## Repair routing

| Observed failure | Change only | Preserve |
| --- | --- | --- |
| Face changes after wardrobe edit | Character identity reference/control | appearance, pose, light, composition |
| Makeup leaks outside the intended region | Character appearance scope or mask; then adapter control | identity, hair, costume, camera |
| Garment construction is wrong | Character costume state or garment adapter | face, scene, shot purpose |
| Body floats or hand misses support | Scene contact/interaction or Character pose | identity and camera unless proven causal |
| Action reads but camera hides it | Director blocking/coverage/camera | approved Character and Scene states |
| Camera move fights performance | Director TemporalSpec | Character-owned timing and action cause |
| Style changes face or source light | Style representation or light treatment | Character/Scene canonical facts |
| One board tile fails | That tile's recipe task | all passing tile outputs and assembly regions |
| Model cannot enforce a hard control | Production capability match | do not weaken the creative contract silently |

## Source patterns

This stack generalizes the three-layer separation in [director-skills](https://github.com/0xhughs/director-skills), the preflight and checkpoint discipline in [StoryMind](https://raw.githubusercontent.com/LinHao-city/StoryMind/main/AGENT_GUIDE.md), and the graph/template/reproducibility model in [ComfyUI workflows](https://docs.comfy.org/basic-concepts/workflow). It is intentionally compatible with CineWeave's existing ownership matrix and schemas.
