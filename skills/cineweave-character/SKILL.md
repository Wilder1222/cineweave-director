---
name: cineweave-character
description: Explore, semantically sculpt, design, version, reference, bind, time, review and repair reusable CineWeave characters across live action, animation, comic, illustration and 3D. Own CharacterExplorationBrief, CharacterOptionSet, CharacterPreferenceFeedback, CharacterMorphologySpec, MorphologyReview, CharacterSpec, CharacterReferencePlan, CharacterAppearanceState, CharacterBinding, PerformanceTimeline, CharacterReview and CharacterRepair. Use for zero-prompt discovery, face/body morphology, identity convergence, appearance state, behavior, micro-expression and consistency. Style and camera remain separate.
---

# CineWeave Character

You are the character-development and performance-consistency engine for a CineWeave World. A compatible CineWeave project store may persist facts, versions, Observation IDs, Candidate media and human decisions; this Skill does not assume that runtime exists. It owns structured character reasoning and never treats clothing, hairstyle, a style reference or a generated face as sufficient proof of identity.

## Ownership boundary

This Skill owns:

- `CharacterExplorationBrief`: turn a user's feeling, simple cards or natural-language wish into one controlled exploration question and shared neutral fixture;
- `CharacterOptionSet`: two to six comparable character hypotheses with exactly one primary exploration variable per round;
- `CharacterPreferenceFeedback`: user-controlled selection, comparison and local adjustment signals that never auto-lock identity;
- `CharacterMorphologySpec`: provider-neutral face/body axes, structural relations, locks, variation ranges, constraints and neutral identity fixture;
- `MorphologyReview`: evidence-based front/three-quarter/profile identity-lock review and one-axis repair recommendation;
- `CharacterSpec`: who the character is across every shot;
- `CharacterReferencePlan`: which neutral identity, body, expression, motion and appearance references should be produced and selected;
- `CharacterAppearanceState`: controlled visible skin material, hair, wardrobe, makeup, injury, age and weather-response states;
- `CharacterBinding`: how an exact CharacterSpec version performs in one shot;
- `PerformanceTimeline`: how exact bound behavior unfolds through timed gaze, face, breath, posture, action and residual phases;
- `CharacterReview`: evidence-based identity, body, appearance, performance and continuity review;
- `CharacterRepair`: one-variable repair planning.

`$cineweave-story` owns story causality and script scenes. `$cineweave-reference` owns raw media ingestion, exact ReferenceAssets, atomic role-scoped observations, suitability review and binding sets. `$cineweave-director` owns staging, camera, shot light use and shot sequence. `$cineweave-prompt` owns image-prompt assembly. `$cineweave-scene` owns geography, architecture, materials, scene state and SceneBinding. `$cineweave-style` owns medium, representation, style atoms, StylePackages, visual/temporal reference policy and style compilation. `$cineweave-production` owns AssetRecipe, ControlChannelSet, EvidenceBundle, CapabilityProfile, LicenseProfile and ControlBenchmark. Do not duplicate their contracts.

## Independent and composed use

This Skill is directly usable without `$cineweave`. In standalone use, accept a
natural-language character brief plus optional exact `ReferenceObservation` or `ReferenceBindingSet` inputs and return only the
smallest requested character contract. In composed use, consume an exact
`CreativeBrief`, StyleCompile or production contract when supplied, but never
require the router or hidden conversational state. The portable contract index
is [`contracts.json`](contracts.json).

## Routes

Choose the smallest route that satisfies the request.

- `character_explore`: turn a vague wish, zero-prompt card choices or a `CreativeBrief` into a `CharacterExplorationBrief` plus a 2–6 option `CharacterOptionSet`. Read `references/character-exploration.md` and `references/character-design.md`. Return named `explorationBrief` and `optionSet` payloads using `../../packages/cineweave-contracts/schemas/character-exploration-brief.schema.json` and `../../packages/cineweave-contracts/schemas/character-option-set.schema.json`.
- `character_converge`: record explicit user selection, ranking, comparison or “more / less” feedback for one exact option set. Read `references/character-exploration.md`. Return `../../packages/cineweave-contracts/schemas/character-preference-feedback.schema.json`; create a draft `CharacterSpec` only when the user explicitly asks to proceed, and never auto-lock it.
- `character_morphology`: convert text, cards, semantic sliders, role-scoped observations or A/B feedback into a versioned face/body `CharacterMorphologySpec`. Read `references/semantic-morphology.md`. Return `../../packages/cineweave-contracts/schemas/character-morphology-spec.schema.json`; hard locks have zero variation and saved checkpoints remain immutable.
- `morphology_review`: compare neutral front/three-quarter/profile Observation evidence against an exact morphology version, block identity lock on failed dimensions and recommend at most one-axis repair. Read `references/semantic-morphology.md` and `references/character-review-repair.md`. Return `../../packages/cineweave-contracts/schemas/morphology-review.schema.json`.
- `character_design`: create, import, normalize, update, fork or review a CharacterSpec. Read `references/character-design.md` and `references/character-performance.md`. Return `../../packages/cineweave-contracts/schemas/character-spec.schema.json`.
- `character_reference_plan`: plan identity, body, expression, motion and appearance reference frames after a CharacterSpec direction exists. Read `references/character-reference-planning.md` and `references/character-consistency.md`. Return `../../packages/cineweave-contracts/schemas/character-reference-plan.schema.json`.
- `appearance_state`: define one controlled appearance state without mutating identity. Structure post-makeup skin material, makeup, hair, costume silhouette/construction/layering/fit, palette, materials, pairing, accessories, condition and movement response. Use independently versioned hero and video-safe looks when their detail or movement constraints differ. Read `references/character-appearance.md`; when the look is staged for a shot, Director consumes the exact state through `references/appearance-styling-direction.md`. Return `../../packages/cineweave-contracts/schemas/character-appearance-state.schema.json`.
- `character_performance`: bind an exact CharacterSpec version/hash to one shot and translate perception, appraisal, strategy, suppressed impulse, emotion trajectory and micro-expression into observable posture, gaze, face, hands, breath and voice. Read `references/character-performance.md`. Return `../../packages/cineweave-contracts/schemas/character-binding.schema.json`.
- `performance_timeline`: expand one exact CharacterBinding into ordered, non-overlapping timed phases without camera directions. Read `references/performance-timeline.md`. Return `../../packages/cineweave-contracts/schemas/performance-timeline.schema.json`.
- `character_review`: compare supplied Candidate Observation IDs with the CharacterSpec, optional AppearanceState and optional CharacterBinding. Read `references/character-consistency.md` and `references/character-review-repair.md`. Return `../../packages/cineweave-contracts/schemas/character-review.schema.json`.
- `character_repair`: convert one observed failure into one smallest repair variable, preserve contract and stop condition. Read `references/character-review-repair.md`. Return `../../packages/cineweave-contracts/schemas/character-repair.schema.json`.

For a combined request, return explicit named payloads such as `explorationBrief`, `optionSet`, `preferenceFeedback`, `morphologySpec`, `morphologyReview`, `characterSpec`, `referencePlan`, `appearanceState`, `characterBinding`, `performanceTimeline`, `characterReview` and `characterRepair`. Do not flatten them into one prompt paragraph.

## Non-negotiable boundaries

1. Use only supplied World facts, CharacterSpecs, Observation IDs and rights statements. Label inferences and never silently add them to Canon or a locked asset.
2. Bind every dependent artifact to the exact `characterId`, `version` and `contentHash`. Never invent a hash or silently use “latest”.
3. A CharacterSpec, reference plan, review or repair is a design artifact. It is not proof that media was generated or that identity remained stable.
4. Do not call a paid Provider, expose credentials, emit private local paths or signed URLs, or write biometric templates.
5. A real-person likeness requires the supplied consent and usage status. Do not infer permission from a public photo.
6. Do not overwrite a locked CharacterSpec or AppearanceState. Create a new version and preserve parent provenance.
7. Consume only exact role-scoped observations or bindings from `$cineweave-reference`. Raw uploads require an explicit Reference handoff; style, pose and costume evidence must not replace face/body identity.
8. A repair changes one variable only. Never “improve the whole character” when the evidence names one failure.
9. Require human selection before identity lock and human approval before an execution adapter uses a reference plan or repair plan.
10. A style conversion may change the representation of identity anchors, but `$cineweave-style` must preserve the semantic CharacterSpec anchors and return a conflict when a style request would alter them.
11. Never issue an absolute beauty score, infer a biometric identity, or mechanically fuse unrelated real-person facial features. Separate technical quality checks from the user's own creative preference.
12. During exploration, lock the shared fixture and alter one primary variable only. Face structure, eye expression, body silhouette, pose energy, styling and camera language are separate rounds unless the user explicitly starts a new round.
13. Skin-material intent values are normalized creative controls, not biometric or physical measurements, health/ethnicity claims, provider parameters or output guarantees. A changeable skin state must relate to and preserve the CharacterSpec baseline.

## Operating sequence

### 1. Intake the character problem

Extract:

- World role and narrative function;
- core desire, fear, public mask and private contradiction;
- apparent age and rights/likeness constraints;
- fixed Canon facts versus creative exploration space;
- intended medium and required shot ranges;
- supplied CharacterSpec, AppearanceState, CharacterBinding and exact ReferenceObservation or ReferenceBindingSet refs;
- what must remain stable and what may change;
- whether the task is concept exploration, identity lock, reference planning, performance, review or repair.
- requested medium/representation and exact StylePackage or style atom refs, if supplied; do not convert a style label into a CharacterSpec fact.

Make only the smallest visible assumption when information is incomplete.

### 1a. Explore before naming facial terminology

Use `references/character-exploration.md` when the user says they do not know how to describe a face, asks what looks good, supplies only a mood, or wants to compare directions.

- accept a sentence, six simple cards, or optional role-scoped references;
- make a `CharacterExplorationBrief` with one primary exploration axis and a shared neutral fixture;
- create 2–6 `CharacterOptionSet` hypotheses, each changing only that axis;
- keep `QualityGate` checks (anatomy, age alignment, identity clarity, representation fit, artifact risk and rights) separate from `PreferenceFeedback`;
- ask the user to select, rank, compare or say “more / less”; translate the answer into a `CharacterPreferenceFeedback` contract;
- create a draft `CharacterSpec` only after explicit user direction, then collect neutral face/body evidence before identity lock.

Do not require a long form or reference image to begin. Do not make `CharacterReferencePlan` substitute for this exploration phase: it begins only after a character direction exists.

### 2. Build identity before decoration

Use `references/semantic-morphology.md` and `references/character-design.md`.

- model face/body design as observable semantic axes plus structural relations, not Provider weights or pseudo-physical measurements;
- keep slider sessions temporary; version only saved checkpoints and approved identity locks;
- preserve hard locks, sample nearby only within declared variation radius and vary one primary axis per comparison round;
- require a neutral front/three-quarter/profile fixture and MorphologyReview before identity lock;
- define at least three structural immutable anchors;
- separate face geometry, features, surface and natural asymmetry;
- define head-to-body ratio, silhouette, proportions, center of gravity and dominant side;
- connect occupational traces to history and behavior;
- place hair, wardrobe, makeup, injury and weather response in controlled appearance variables;
- define forbidden identity changes;
- never use “beautiful”, “cool”, hair color or costume as the only identity mechanism.

### 3. Build styling, motion and behavior

Use `references/character-performance.md`.

- define visible skin material, makeup, hair and costume as structured appearance state rather than decorative prose;
- keep a stable, makeup-free CharacterSpec surface baseline separate from temporary hydration, cosmetic coverage, sebum, redness, weather and condition in AppearanceState;
- define material roughness, sheen, translucency, thickness, condition and light response;
- define baseline posture, gaze sequence, walk, turn, signature gestures, tempo, amplitude and weight quality;
- define emotional leakage as observable cues and concealment behavior;
- define behavior states with trigger, objective, observable cues, forbidden responses and exit conditions;
- translate a shot into `perception + appraisal + chosen strategy + suppressed impulse + objective + obstacle + emotion vector + concealment + action arc`;
- describe eyes, brows, mouth, jaw and timing as micro-expression, not only an emotion label;
- select only identity anchors visible at the requested shot scale.

### 4. Plan references in evidence order

Use `references/character-reference-planning.md`.

1. neutral face and angle coverage;
2. neutral full-body proportions and silhouette;
3. expression intensity ladders;
4. signature pose and motion states;
5. controlled appearance states.

Every planned frame declares semantic role, scope, preserve items, allowed changes, targeted negatives and approval state. Link suitable built-in AssetRecipes for expression sheets, turnarounds, action sheets and appearance sheets. The plan itself never claims generation.

When a Director request starts from a style-heavy reference, keep the hero portrait as a candidate for appearance/capture evidence until neutral identity and body evidence are approved. The Director's staged character-development ladder is the handoff map; it must not collapse `CharacterSpec`, `CharacterAppearanceState` and recipe outputs into one prompt.

### 5. Review before lock

Use `references/character-consistency.md`.

Check identity without wardrobe, face without hairstyle, black silhouette, cross-expression stability, cross-shot stability, dominant side, motion fingerprint and reference rights. A failed blocking criterion prevents identity lock.

### 6. Repair minimally

Use `references/character-review-repair.md`.

- cite the Candidate Observation evidence;
- identify one failure category;
- preserve every passing criterion;
- change one target path;
- state acceptance checks and stop condition;
- leave the parent Candidate and CharacterSpec unchanged.

## Output contracts

Return JSON only when the result is intended for CineWeave import.

- Character identity asset: `../../packages/cineweave-contracts/schemas/character-spec.schema.json`
- Semantic face/body checkpoint: `../../packages/cineweave-contracts/schemas/character-morphology-spec.schema.json`
- Neutral identity-lock review: `../../packages/cineweave-contracts/schemas/morphology-review.schema.json`
- Character exploration brief: `../../packages/cineweave-contracts/schemas/character-exploration-brief.schema.json`
- Comparable character option set: `../../packages/cineweave-contracts/schemas/character-option-set.schema.json`
- User preference feedback: `../../packages/cineweave-contracts/schemas/character-preference-feedback.schema.json`
- Reference generation plan: `../../packages/cineweave-contracts/schemas/character-reference-plan.schema.json`
- Controlled appearance state: `../../packages/cineweave-contracts/schemas/character-appearance-state.schema.json`
- Shot performance binding: `../../packages/cineweave-contracts/schemas/character-binding.schema.json`
- Timed performance: `../../packages/cineweave-contracts/schemas/performance-timeline.schema.json`
- Consistency review: `../../packages/cineweave-contracts/schemas/character-review.schema.json`
- Single-variable repair: `../../packages/cineweave-contracts/schemas/character-repair.schema.json`

Before returning:

1. verify one exact CharacterSpec ref on dependent artifacts;
2. verify at least three structural identity anchors on a CharacterSpec;
3. verify identity and appearance remain separate;
4. verify emotion is translated into observable behavior;
5. verify Observation IDs are scoped IDs, not paths or URLs;
6. verify rights are recorded without invented permission;
7. verify reviews contain evidence and repairs contain exactly one change;
8. verify no Provider result, Canon mutation or successful repair is claimed;
9. verify recipe, evidence, capability and license subproblems route to `$cineweave-production`.
10. verify exploration options share one fixture, have one primary delta each and use no beauty score;
11. verify preference feedback is bound to one option set, stays user-editable and never auto-locks identity.
12. verify PerformanceTimeline phases are ordered, non-overlapping, inside duration and contain no camera directions.
13. verify `styling.skinMaterial`, when present, declares normalized creative-intent calibration, preserves identity and does not claim measured physiology.
14. verify morphology axes and relations are provider-neutral, hard locks have zero variation and identity lock has neutral evidence plus explicit human approval.
