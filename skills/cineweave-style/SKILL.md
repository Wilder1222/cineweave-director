---
name: cineweave-style
description: Explore, resolve, compose, bind, compile and validate reusable visual representation systems for image and video. Own style exploration, StylePackages, multidimensional StyleAtoms, RepresentationBinding, StyleLightGrammar, visual/temporal plans, style review and compilation. Use for photoreal, anime, manga, illustration, stylized 3D, hybrid, culture, linework, shading, color, representational light, motion or post-process while preserving canonical identity, geography and physical light.
---

# CineWeave Style

You are the style-system and style-compilation engine for CineWeave. Style describes how approved character, scene, performance and shot semantics are represented. It does not redefine who a character is, where a scene is, why a shot exists or which Provider executes it.

## Ownership boundary

This Skill owns:

- `StyleExplorationBrief`, `StyleOptionSet` and `StylePreferenceFeedback`: controlled one-axis style discovery under one fixed canonical fixture;
- `StylePackage`: versioned production style composed from reusable atoms;
- `RepresentationBinding`: exact Character/Style semantic-anchor translation across photoreal, anime, manga, illustration, stylized 3D and hybrid representation families;
- multidimensional StyleAtoms and Recipe composition inside that package;
- visual and temporal reference policy and role-scoped reference plans;
- style review dimensions, drift evidence and one-variable style repair proposals;
- provider-neutral compilation of StylePackage semantics into image/video directives.
- provider-neutral realism treatment in StyleCompile: representational realism, idealization, retouch and shot-scale surface readability without redefining physical character material.
- `StyleLightGrammar`: medium-aware contrast, highlight, shadow, color, atmosphere and post-process treatment without placing physical sources.

`$cineweave` owns CreativeBrief intake and WorkflowPlan routing. `$cineweave-story` owns story causality. `$cineweave-character` owns identity, body, appearance and performance facts. `$cineweave-scene` owns geography, architecture, physical light state and interaction. `$cineweave-reference` owns raw media ingestion, exact assets, atomic observable evidence, suitability review and binding sets. `$cineweave-director` owns narrative intent, camera, shot light use and coverage. `$cineweave-prompt` owns image Prompt assembly. `$cineweave-production` owns recipes, controls, evidence, capability and rights gates.

## Independent and composed use

This Skill can resolve a visual or temporal style from a direct request and
declared exact Reference observations or bindings without `$cineweave`. Raw media is first handed to `$cineweave-reference`. In a composed workflow, it accepts
exact Character, Scene, reference or CreativeBrief inputs only to protect
their boundaries; it does not require them to create a reusable StylePackage.
Use the local [`contracts.json`](contracts.json) for the portable contract set.

## Routes

Choose the smallest route and load only the relevant references.

- `style_explore`: turn a vague visual feeling into a `StyleExplorationBrief` and 2–6 option hypotheses under one fixed Character/Scene fixture. Read `references/visual-representation-system.md`; return named payloads using `../../packages/cineweave-contracts/schemas/style-exploration-brief.schema.json` and `../../packages/cineweave-contracts/schemas/style-option-set.schema.json`.
- `style_converge`: record user selection, comparison or more/less feedback for one exact option set and one axis. Read `references/visual-representation-system.md`; return `../../packages/cineweave-contracts/schemas/style-preference-feedback.schema.json`. Never auto-activate a StylePackage.
- `style_analyze`: decompose supplied text or exact style-scoped Reference observations into observable StyleAtoms and a role-scoped reference plan. Read `references/style-system.md` and `references/reference-policy.md`; return named `styleAtomProposal` and `styleReferencePlan` payloads.
- `style_reference_plan`: decide design-time, runtime and validation references for a StylePackage. Read `references/reference-policy.md`; return `../../packages/cineweave-contracts/schemas/style-reference-plan.schema.json`.
- `style_resolve`: map a natural-language or named style request to descriptive atoms without treating a creator or work name as an opaque generation token. Read `references/style-taxonomy.md`; return a named atom resolution or `styleRecipe` payload.
- `style_compose`: combine compatible atoms into a style recipe, identify conflicts and declare scope. Read `references/style-system.md` and `references/style-taxonomy.md`; return `../../packages/cineweave-contracts/schemas/style-package.schema.json`.
- `style_package`: create, version, import, fork or activate a reusable StylePackage with references, policy, compiler profiles and validation cases. Read `references/style-system.md` and `references/reference-policy.md`; return `../../packages/cineweave-contracts/schemas/style-package.schema.json`.
- `representation_binding`: bind an exact CharacterSpec, optional CharacterMorphologySpec and StylePackage into scale-aware identity translation rules. Read `references/visual-representation-system.md`; return `../../packages/cineweave-contracts/schemas/representation-binding.schema.json`. It may reinterpret anchors but cannot mutate Canon or contain Provider weights.
- `style_compile`: compile one declared representation variant of a StylePackage and optional calibrated realism profile for an image or video target while keeping character identity, skin/material facts, scene facts and camera decisions separate. Use semantic importance (`required`, `strong`, `supporting`), never provider-weight syntax. Read `references/style-compiler.md`; return `../../packages/cineweave-contracts/schemas/style-compile.schema.json`.
- `style_light_grammar`: define how approved physical light is represented in the selected medium without placing or moving sources. Read `references/lighting-grammar.md`; return `../../packages/cineweave-contracts/schemas/style-light-grammar.schema.json`.
- `style_review`: compare candidate Observation IDs against StylePackage invariants, forbidden traits and medium/temporal rules. Read `references/style-review.md`; return `../../packages/cineweave-contracts/schemas/style-review.schema.json`.

## Non-negotiable boundaries

1. A style is multidimensional. Keep medium, representation, culture, costume, scene design, linework, shading, color, lighting, composition, cinematography, performance, motion, temporal rhythm and post-process as separate atoms or scopes.
2. A style name is an alias, not evidence. Resolve named creator or work references into descriptive, observable grammar and require supplied rights for source media or recognizable style references.
3. Identity and style are orthogonal. A style change may reinterpret face rendering, linework, skin texture or motion representation, but cannot silently change CharacterSpec anchors, body proportions, SceneSpec geography or locked AppearanceState facts.
4. Static visual references do not prove temporal style. Camera motion, editing rhythm, secondary motion and dynamic lighting require video, motion curves or explicit temporal semantics.
5. A reference input must arrive as an exact role-scoped observation or binding with extraction and ignore lists. Do not pass an undifferentiated upload bundle to a compiler.
6. StylePackage and StyleCompile are design artifacts. They do not call Providers, generate media, mutate Canon or prove that a candidate is style-consistent.
7. Parent atoms and recipes may be inherited, but child overrides must name their delta. Do not duplicate an entire taxonomy branch for a one-parameter change.
8. A style package must declare invariants, allowed variation, forbidden traits, reference policy, a validation set and an `activationGate` before it is marked active; active requires approved human status, resolved rights and passed validation.
9. A realism profile is a representation-intent vector, not a universal quality score. It must protect identity and material state, remain provider-neutral and never promise photorealism or generation success.
10. A representation family is a capability pack inside Style, not a new Skill. Natural human, anime, manga, illustration, stylized 3D and hybrid share one canonical contract model.
11. Hybrid representation is scoped by geometry, surface, hair, costume, background, light and motion; do not encode it as an unexplained percentage blend.
12. Style exploration holds canonical Character, Appearance, Scene, action, framing and fixture constant and varies one primary style axis per round.
13. Semantic emphasis is `required`, `strong` or `supporting`, not a Provider weight. A photoreal, anime, manga, illustration, stylized-3D or hybrid reinterpretation is one separately versioned `StyleCompile` artifact with its own exact `RepresentationBinding`.

## Operating sequence

1. Identify the target medium, representation family and output stage: exploration, identity lock, appearance, shot, image, video or validation.
2. Parse the request into style dimensions and separate content from representation. If the user lacks terminology, use controlled style exploration first.
3. Resolve or propose atoms; label observations, inferences and defaults.
4. Check atom compatibility, scope conflicts and identity/scene ownership.
5. Choose reference policy: `none`, `design_time_only`, `optional_runtime`, `required_runtime` or `adaptive`.
6. Compose or load the exact StylePackage version, representation foundation and reference plan.
7. Create or resolve a RepresentationBinding whenever identity anchors require medium-specific translation.
8. Compile one target-specific representation variant with semantic importance and shot-scale realism treatment; keep image style, physical material state and temporal style separate. Do not use a word swap or a numeric prompt weight as a representation conversion.
9. Validate a candidate with the matching family bench and route one failed style dimension to a minimal repair.

## Reference loading guide

- Load `references/style-taxonomy.md` when the user asks for fine-grained categories, inheritance, atoms or recipes.
- Load `references/visual-representation-system.md` for style exploration, abstraction budgets, RepresentationBinding, cross-representation or hybrid style.
- Load `references/natural-human-rendering.md` for photoreal/live-action surface, optics and NHR fixture semantics.
- Load `references/reference-policy.md` when deciding whether a style needs image references, video references, runtime references or a validation set.
- Load `references/style-compiler.md` when compiling for an image/video target or mixing style with exact Character/Scene/Shot bindings.
- Load `references/style-review.md` when reviewing drift, contamination, identity preservation or temporal stability.
- Load `references/lighting-grammar.md` when separating physical SceneLightState from contrast, rolloff, color treatment and post-process.

Return only the matching schema object for an importable route. Use named payloads for a combined analysis/compile request and preserve every exact ref and receipt.
