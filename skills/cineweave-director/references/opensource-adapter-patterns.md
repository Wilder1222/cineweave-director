# Open-source adapter patterns

Use this guide at the Prompt → Production boundary. These are capability patterns discovered in open-source projects, not guaranteed runtime features. A project name is never sufficient evidence for a strong `CapabilityProfile`.

## Pattern map

| Creative requirement | Open-source pattern | Control boundary | Common limit |
| --- | --- | --- | --- |
| reproducible node workflow | [ComfyUI nodes/workflows/templates](https://docs.comfy.org/basic-concepts/workflow) | graph recipe, typed links, dependencies, serialized snapshot | missing custom node/model, version drift, non-portable paths |
| pose/depth/edge/spatial layout | [ControlNet](https://github.com/lllyasviel/ControlNet) | scoped spatial condition | condition can constrain layout without guaranteeing identity or materials |
| image reference plus text | [IP-Adapter](https://github.com/tencent-ailab/IP-Adapter) | typed image-prompt channel separate from text | reference scope and subject limits must be declared |
| face identity | [InstantID](https://github.com/instantX-research/InstantID), [PuLID](https://github.com/ToTheBeginning/PuLID) | face identity channel | face-only or model-specific behavior is not full-body continuity |
| region masks and video propagation | [SAM](https://github.com/facebookresearch/segment-anything), [SAM 2](https://github.com/facebookresearch/sam2) | mask/track channel | mask accuracy and semantic correctness still require review |
| motion module | [AnimateDiff](https://github.com/guoyww/AnimateDiff) | temporal motion channel | motion priors do not replace action direction or camera plan |
| multi-frame character/style consistency | [StoryDiffusion](https://github.com/HVision-NKU/StoryDiffusion) | sequence consistency channel | consistency is not proof of correct beat, geography or identity |
| identity/try-on/style routing | [DreamO](https://github.com/bytedance/DreamO) | task-specific multi-condition channel | conditions may be mutually limited; current support must be tested |
| garment transfer | [CatVTON](https://github.com/fish-tech-ai/VTON), [IDM-VTON](https://github.com/yisol/IDM-VTON) | apparel image, pose, parsing and identity channels | construction, body fit and rights are separate concerns |
| makeup transfer | [BeautyBank](https://github.com/CyberAgentAILab/BeautyBank), [MagicMakeup](https://github.com/vivoCameraResearch/Magic-Makeup) | cosmetic region/mask channel | makeup success does not validate identity, hair or lighting continuity |
| camera previsualization | [CinePreGen](https://arxiv.org/abs/2408.17424) | camera behavior, pose, depth/pose/mask and keyframe channels | previs camera intent is not final render evidence |

## Capability evidence record

When a provider or open-source adapter is proposed, Production should be able to record an adapter-specific manifest outside the creative contract:

```text
adapterId and source URL
source revision / release date
workflow or subgraph hash
runtime, checkpoint and custom-node/model dependencies
input types, subject limits and supported control channels
hard/soft/advisory claims with evidence level
known failure modes and fallback behavior
license, model-weight and reference-rights status
benchmark seed/input hashes and output receipt
```

Keep this record separate from the universal `ShotSpec`, `AppearanceState` and `PromptRecord`. A workflow snapshot can be evidence for reproducibility, but it is not a replacement for creative intent or exact upstream bindings.

## Capability levels

- `strong`: the hard control is supported for the declared subject/input class and has a passing local or supplied benchmark receipt;
- `partial`: some regions, subjects, frames or conditions are supported; the gap is visible in the RenderPlan;
- `experimental`: the route is plausible but evidence is weak, unstable or community-only; human review is required;
- `unknown`: no trustworthy capability or rights evidence; a hard requirement blocks execution-ready planning.

Do not downgrade a creative hard requirement silently because an adapter is convenient. Instead propose a different adapter, change the brief through an explicit user decision, or keep the plan blocked.

## Control-channel translation

Translate semantic requirements at the boundary:

| CineWeave channel | Adapter examples | Evidence to inspect |
| --- | --- | --- |
| identity/reference | face or image adapter | anchor similarity across angle/expression/occlusion |
| appearance/region | makeup, garment or masked edit | region containment, construction, preserved identity |
| spatial/depth/pose | ControlNet, depth, pose, segmentation | support/contact, axis, silhouette, occlusion |
| temporal/camera | motion module, keyframes, previs | start/peak/end, stable terminal frame, action readability |
| style/representation | StyleCompile-specific route | identity/light/geography remain unchanged |
| assembly/evidence | independent tasks and deterministic compositor | tile provenance, fixed regions, retry scope |

Semantic emphasis is not adapter enforcement. Prompt wording may express the intent, but Production must declare how the adapter attempts to enforce it and how the result will be reviewed.

## ComfyUI graph rules

For a graph-based route:

1. keep the graph modular by control dimension or stage;
2. expose inputs for exact references, masks, pose/depth, prompt asset and output metadata;
3. record custom-node and model dependencies before execution;
4. prefer subgraphs/templates for repeatable operations;
5. allow partial execution and preserve successful intermediate artifacts;
6. hash or otherwise identify the workflow snapshot used for the receipt;
7. never place secrets or private file paths in a shareable creative artifact.

This follows the explicit-node and serializable-workflow model in [ComfyUI's documentation](https://docs.comfy.org/basic-concepts/workflow) while keeping CineWeave's rights and approval boundaries intact.

## Failure routing

- Wrong face: Character identity or identity adapter capability.
- Wrong makeup region: AppearanceState scope/mask or cosmetic adapter capability.
- Wrong garment construction: Character costume state or apparel adapter; do not repair with style.
- Wrong pose/depth/contact: Scene/Character interaction or spatial adapter.
- Good first frame, unstable video: temporal adapter capability or motion control, not story rewrite.
- Correct tiles, broken board: Production assembly/provenance, not panel prompt rewrite.
- Unknown license or weights: Production LicenseProfile; no execution-ready approval.
