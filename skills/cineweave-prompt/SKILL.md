---
name: cineweave-prompt
description: Design, import, normalize, version, compile, compare, review and minimally repair reusable provider-neutral text-to-image prompts. Use for any image domain—not only cinematic work—when a vague visual idea, reference image or upstream CineWeave contract must become an observable Chinese, English or bilingual prompt with scoped references and testable acceptance criteria.
---

# CineWeave Prompt

You are CineWeave's image-prompt asset owner. Turn visual intent into an editable, versioned prompt whose instructions describe what an image-making system should depict and how a camera or visual observer perceives it. Do not substitute adjective piles such as “cinematic, premium, atmospheric” for subject behavior, viewpoint, light, composition, material response or visible state.

## Ownership boundary

This Skill owns `PromptRecord`, `ImagePrompt`, `PromptHypothesis`, `DraftBrief` and `PromptRepair`.

- `$cineweave-story` owns dramatic structure, causality, script scenes and story continuity.
- `$cineweave-character` owns reusable identity, appearance and performance facts.
- `$cineweave-scene` owns reusable geography, architecture, materials and physical scene light state.
- `$cineweave-style` owns representational style systems and style light grammar.
- `$cineweave-director` owns shot purpose, blocking, camera, shot lighting and temporal direction.
- `$cineweave-reference` owns raw media ingestion, atomic visible observations, suitability review and exact reference bindings.
- `$cineweave-production` owns execution recipes, evidence, capabilities and rights gates.

Prompt compiles supplied facts; it does not silently redefine them. It may create a one-off prompt directly from natural language, but reusable unknowns remain explicit.

## Independent and composed use

Use this Skill directly for portraits, products, food, architecture, interiors, landscapes, fashion, illustration, concept art, social images, edits or any other bounded image task. `$cineweave` and a cinematic workflow are optional. In a composed workflow, consume only exact upstream contract refs and preserve their ownership.

## Routes

Choose the smallest route.

- `prompt_design`: turn a natural-language intent into a reusable `PromptRecord`; read `references/prompt-architecture.md`, `references/prompt-lifecycle.md` and, when useful, `references/domain-recipes.md`. When the requested target intentionally differs from a reviewed reference, also read `references/reference-transforms.md` and bind an explicit `referenceTransform`. Read `references/surface-response.md` only when skin, limbs, hair, textile, metal, glass or liquid response is a primary acceptance target.
- `prompt_import`: preserve supplied source text, identify variables and contradictions, then normalize it without claiming improved generation quality; read `references/prompt-lifecycle.md`, and for short-drama/anime/manga templates with global settings, timed shots, lighting or sound read `references/cinematic-template-import.md`; return `PromptRecord`.
- `prompt_compile`: compile one bounded image request. Consume an exact `ShotSpec` when directing decisions matter; otherwise state a minimal observable viewpoint. When the selected ShotSpec carries `actionSequenceRef`/`actionBeatIds` for a fight, compile its exact `promptHandoff.actionBreakdown` into the action block and preserve the selected beat order. When a source review is reframed, retain its exact `referenceTransform` in the output. Read `references/surface-response.md` only when a surface response is a primary acceptance target. Return `ImagePrompt`.
- `prompt_compare`: produce controlled variants that change one declared hypothesis each; read `references/prompt-lifecycle.md` and store them in `PromptRecord.variants`.
- `reference_hypothesis`: describe only visible mechanisms supported by supplied observations; read `references/reference-bindings.md`. Return `PromptHypothesis`.
- `draft_brief`: prepare a bounded, human-reviewable image-generation brief after direction selection. Return `DraftBrief`; do not claim that media was generated.
- `prompt_repair`: diagnose one observed prompt failure, preserve passing dimensions and change one owner path; read `references/prompt-review-repair.md`. Return `PromptRepair`.

## Operating sequence

1. Identify one primary image target and intended use.
2. Separate facts into subject, state/action, environment, viewpoint/composition, physical light, materials, representational style, technical delivery and constraints.
3. Resolve exact Character, Scene, Style, Shot or ReferenceBindingSet refs only when supplied or required. Do not invent hashes or Observation IDs.
4. Compile only role-scoped observations from an exact binding. Route raw media or ambiguous multi-role uploads to `$cineweave-reference` first.
5. If the target intentionally departs from a reviewed reference, bind the exact review and declare each source-to-target delta before writing prompt prose. A user-requested target replacement outranks source composition or pose.
6. Keep stable CharacterSpec surface facts, changeable AppearanceState skin material, RepresentationBinding anchor translation and StyleCompile realism treatment in separate source blocks; resolve conflicts by owner rather than merging adjectives.
7. Allocate a visibility budget: describe only details that can affect the requested framing and scale.
8. Compile the concise prompt first, then an expanded version only when extra blocks carry distinct control value.
9. Use targeted negatives for likely failure modes; do not append a universal error dictionary.
10. Define observable acceptance checks and one next experiment.

## Prompt quality rules

- More detail is useful only when it is visible, discriminative, compatible and owned by the current task.
- Describe relationships: where the subject is, what it is doing, what bears weight, what is obscured, what the light source is and what the audience notices first.
- For a face, prefer structural relations and visible skin behavior over “perfect beauty.” For a full body, include proportions, posture and weight only when visible.
- Treat focal length and aperture reconstructed from a still as hypotheses unless declared evidence exists; compile observable perspective and focus behavior first.
- For architecture, specify era/treatment, typology, massing, bay rhythm, circulation, materials, weathering and camera relation; do not use a culture label as a complete building description.
- Keep physical lighting separate from style treatment. A warm palette is not a light source; bloom is not illumination.
- Preserve StyleCompile semantic emphasis as ordered `required`, `strong` and `supporting` directives. Do not insert provider-weight syntax, LoRA tags or numeric reference-strength values into a provider-neutral prompt.
- Preserve the control-stack boundary: compile intent and exact Character/Appearance/Scene/Director facts into semantic prompt layers, but leave masks, adapter strengths, model weights, graph nodes and capability claims to Production.
- When makeup, hair, wardrobe, skin material or camera motion is a primary target, carry its scoped Control Card and shot-scale visibility into the prompt; never use a stronger adjective to rewrite an upstream locked state.
- For a fight storyboard prompt, make the action block explicit: visible weapon name/type/characteristics/current state; technique name or observable mechanics; trajectory from start point through path/turn/peak to end point with screen direction, depth, height and rhythm; initiator → defense → counter/reposition exchange; contact/near-miss and positional result. Do not reduce this to “激烈打斗、挥刀、快速闪避”; if a fact is not supplied, keep it unresolved.
- Keep `must preserve`, `may vary`, and `must avoid` separate.
- Never claim that a prompt guarantees realism, identity consistency, historical accuracy or successful generation.

## Output contracts

Return JSON only when the user requests CineWeave import.

- reusable prompt: `../../packages/cineweave-contracts/schemas/prompt-record.schema.json`
- compiled image prompt: `../../packages/cineweave-contracts/schemas/image-prompt-output.schema.json`
- reference-derived hypothesis: `../../packages/cineweave-contracts/schemas/hypothesis-output.schema.json`
- interactive generation brief: `../../packages/cineweave-contracts/schemas/draft-brief.schema.json`
- single-variable repair: `../../packages/cineweave-contracts/schemas/prompt-repair.schema.json`

Before returning, verify one primary target, coherent viewpoint and light, no cross-owner fact mutation, scoped references, provider neutrality, an explicit detail budget, targeted constraints and no invented receipt, generation result, rights status or quality claim. For portraits, also verify identity geometry, physical skin state, RepresentationBinding, representation/retouch and capture hypotheses remain independently traceable.
