# Intake and routing

Build the smallest structured brief that preserves the user's intent. Extract
only fields that change a downstream decision:

| Need | Route | Why |
|---|---|---|
| premise, causal beats, script scene or story continuity | `cineweave-story` | story purpose and state change must precede shot decisions |
| reusable face, body, appearance or performance | `cineweave-character` | identity remains stable across shots and media |
| “I do not know how to describe the face; show me directions” | `cineweave-character` `character_explore` | candidate comparison turns a feeling into controlled identity hypotheses |
| reusable location, physical interaction or physical light state | `cineweave-scene` | geography, contact and source placement need explicit constraints |
| medium, visual system, reference policy or style transfer | `cineweave-style` | representation must not overwrite identity or geography |
| ingest, verify, score, region-scope or bind supplied image/video references | `cineweave-reference` | exact bytes, evidence roles, privacy and rights gates must precede domain interpretation |
| 拆解人像参考图、反推提示词或创建可复用 Face Recipe | `cineweave-reference` → requested Character/Style/Director/Prompt owners | face identity, skin state, representation and capture hypotheses require separate evidence paths |
| fight, pursuit, escape, rescue or other multi-beat physical sequence | `cineweave-director` `action_sequence` | action beats, spatial changes, coverage and sequence continuity must precede individual shots |
| blocking, camera, shot lighting, temporal direction or storyboard | `cineweave-director` | direction decides how an already-defined moment is revealed |
| reusable or one-off text-to-image prompt in any domain | `cineweave-prompt` | prompt compilation must remain usable beyond cinematic shots |
| recipe, evidence, capability, rights or repeatable QA | `cineweave-production` | production validation is separate from creative facts |

| idea → Midjourney exploration → selected master references → full AIGC pipeline | `cineweave` `aigc_studio` | the router exposes a resumable DAG; Prompt projects the first pack, Reference establishes evidence, and downstream specialists retain ownership |

Use a direct specialist route if one row answers the request. Use a composed
workflow only when a final output explicitly needs more than one owner.

## High-impact gaps

Ask only when a safe default would materially change the result:

- desired output medium or image versus video;
 - whether the request needs story development, a shot decision or only prompt compilation;
- whether identity must persist across images or shots;
- whether a physical action is one shot beat or a multi-beat sequence requiring ActionSequenceSpec;
- the role of a supplied reference image or video when it cannot be safely split into draft atomic observations;
- historical reconstruction versus stylized reinterpretation;
- the item that must remain locked.

Do not ask for lens focal length, minor accessories or low-impact background
details before an exploration request can start.

If the request says only “拆解参考图提示词”, default to a reference-led image workflow: verify that the image is actually available, review its intended use, create atomic observations, then compile a prompt only after identity/appearance/style/capture ownership is clear. Do not infer full-body or hidden character facts from a face crop.

For zero-prompt character exploration, ask no more than the six simple cards:
visual world, temperament, representation, adornment, adult age impression and
first visual priority. Send blank answers as `undefined`; `$cineweave-character`
owns candidate semantics, preference feedback and eventual identity drafting.

If the user explicitly says “先给我 MJ 提示词，我自己探索并带回母版图，再做
资产/剧本/分镜”, select `studio` mode. Do not ask them to provide final
character terminology before the first exploration pack. Make the first gate
collect exact selected image files, original prompts, model/version/parameters,
selection notes and rights/usage status; then route to `reference_ingest`.
