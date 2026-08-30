# Appearance and styling direction

Use this guide when a request involves makeup, hair, grooming, wardrobe, accessories, skin surface, weathering or a look transition. Character owns the state; Director may select and stage it but must not invent a new canonical identity inside a shot.

## Look state before look language

Resolve a versioned `CharacterAppearanceState` before compiling a prompt. The state must bind an exact `CharacterSpec` and record the current visible look, its purpose and its transition cue.

Use the existing structured fields:

- `styling.makeup`: base, brows, eyes, cheeks, lips, finish, intensity and identity preservation;
- `styling.hair`: length, structure, parting, texture, volume, finish, accessories and movement response;
- `styling.costume`: style, silhouette, components, construction, layering, fit, palette, materials, pairing logic, condition and movement response;
- `styling.skinMaterial`: baseline relation, coverage, hydration, micro-roughness, specular response, translucency, pore/microtexture visibility, regional variation and temporary condition;
- accessories, injury/recovery, weather, sweat, dust, rain, snow and continuity constraints already supported by the AppearanceState contract.

Do not flatten these fields into “beautiful makeup”, “fashionable clothes” or “cinematic skin”. Each field should answer what is visible, what is locked, what may move and how it behaves under the intended light and action.

## Hero and video-safe looks

Hero stills and moving-image continuity have different detail budgets. Maintain separate, independently versioned AppearanceState artifacts when their requirements differ:

| Look version | Optimize for | Typical detail | Continuity check |
| --- | --- | --- | --- |
| identity/hero | recognition, design approval, close inspection | facial anchors, makeup boundaries, garment construction, surface response | identity survives angle, expression and styling removal |
| video-safe | stable silhouette, readable color blocks, motion response and repeatability | simplified fine detail, secure accessories, controlled hair/garment movement | look survives frame changes, motion blur, occlusion and lighting changes |

Do not mutate one approved state between these uses. Create a new version that binds the same CharacterSpec and explicitly lists preserved anchors, intentional simplifications and allowed deviations. A hero portrait is not proof that a video-safe state has been tested.

## Region-scoped styling

Every edit or reference should declare `role`, `scope`, `preserve`, `borrow`, `replace` and `exclude`. Useful scopes include:

- face base, brow, eye, cheek, lip and hairline regions;
- hair mass, parting, accessory and loose-strand regions;
- garment layer, neckline, sleeve, hem, fastener, footwear and accessory regions;
- exposed skin zones where condition or material response is intentionally visible;
- background or lighting regions only when the reference role explicitly permits them.

A mask defines the permitted edit area, not a promise of correct semantics. Preserve masks should be treated as opaque/locked; regenerate masks as transparent/eligible. Overlapping masks must be reviewed for conflicts before adapter selection.

## Styling direction card

For each look, write a short card before any model-facing prompt:

```text
lookId/version: exact AppearanceState
purpose: why this look exists in the story or shot
identityLocks: CharacterSpec anchor IDs and stable surface facts
makeup: region → product/finish/coverage/intensity → preserve
hair: silhouette/parting/texture/accessory → movement response
costume: silhouette/layers/construction/materials → action constraints
skinMaterial: baseline relation → source/reflection/contact readability
accessories: identity or continuity role → attachment/support
transitionCue: time, action, weather or emotional cause
forbiddenChanges: identity, body rhythm, dominant side, garment construction, etc.
review: identity | styling | action compatibility | continuity | rights
```

Use observable relationships: a broad soft source creates a controlled sheen over the cheek plane; a damp wool coat darkens and gains weight at the hem; a pinned braid lags less than loose hair during a turn. Avoid medical, biometric or ethnicity claims from surface appearance.

## Reference and adapter selection

| Desired change | First-class input | Do not confuse with |
| --- | --- | --- |
| facial identity | identity-scoped face reference or approved identity adapter | generic portrait style |
| hair shape/parting | hair/appearance reference and region mask | face identity adapter |
| garment construction | costume reference, layer scope, pose and body evidence | text-only fashion adjective |
| garment transfer | garment image + person/pose/parsing controls | canonical costume design |
| local makeup | face parsing/region mask + makeup reference | global beauty retouch |
| skin condition | baseline-relative skin material state + physical light | changed complexion or diagnosis |
| moving hair/cloth | PerformanceTimeline + TemporalSpec + material movement response | a single still reference |

Open-source projects such as [DreamO](https://github.com/bytedance/DreamO), [CatVTON](https://github.com/fish-tech-ai/VTON), [BeautyBank](https://github.com/CyberAgentAILab/BeautyBank) and [MagicMakeup](https://github.com/vivoCameraResearch/Magic-Makeup) are useful capability patterns. Their input limits, licenses, weights and multi-condition behavior must be captured in `CapabilityProfile`; their repository names never become a hard CineWeave assumption.

## Continuity review

Review the smallest meaningful set:

1. identity with hair and makeup removed conceptually;
2. silhouette and dominant side under the look;
3. makeup boundary and hair parting across angle and expression;
4. garment layers, fasteners, hem, footwear and accessory attachment;
5. skin response under the shot's physical source and exposure;
6. movement response during the relevant action;
7. transition logic between the previous and next AppearanceState.

If the failure is identity, route to Character identity. If it is cosmetic or garment state, repair AppearanceState. If it is only visibility in the chosen shot, repair Director framing/light or Prompt detail budget. If a provider cannot preserve a hard region, Production must report partial/unknown capability and block rather than silently simplify.

## Handoff to Director and Prompt

Director receives an exact `appearanceStateRef` and may choose the look's purpose, staging, scale and light. Prompt receives the same exact state plus the ShotSpec; it compiles only the visible, shot-scale consequences. Never let a prompt rewrite a locked appearance state with a stronger adjective.
