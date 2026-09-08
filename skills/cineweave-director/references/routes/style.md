# Route: style

Use for visual-system design, controlled representation exploration, StylePackage, Character-to-Style translation, compile rules, and representational light grammar.

## Style system

- **Category:** discovery label only.
- **Atom:** one observable rule with scope, invariants, allowed variation, and forbidden behavior.
- **Recipe:** compatible atoms in precedence order.
- **StylePackage:** reusable semantic system.
- **StyleCompile:** target-specific projection for image, video, character, scene, or page.

Do not use a named creator or work as an executable instruction. Resolve references into observable mechanisms: geometry, silhouette, line, surface, shading, color, depth, composition, motion, and temporal behavior. For cinematic style creation or creative revision, read [the adaptive technique catalog](../optional/master-style-presets.md); infer useful techniques without requiring names or switches. Preserve one shared visual baseline across mixed techniques. Existing palette, grading, contrast, texture, representation, and frame shape are not per-master choices. If no baseline exists, propose one shared draft; automatic matching is not approval of a StylePackage. User-named influences remain optional overrides subject to locks.

## Representation

Define family, geometry model, surface model, light model, depth model, visual grammar, temporal grammar, abstraction budget, and detail budget by scale. Compile each representation family independently. Do not average photoreal, anime, manga, illustration, and stylized 3D into one ambiguous payload.

`RepresentationBinding` maps an exact CharacterSpec into a StylePackage. It states protected anchors, allowed simplification or exaggeration, scale rules, and forbidden transformations. It never mutates Character canon.

A provider Style Reference, moodboard, profile, or style code is a projection mechanism, not a `StylePackage`, style atom, or Canon authority. Keep provider handles, codes, weights, and compatibility rules in `PromptProjectionPlan`; bind any source image through exact reference observations and preserve its exclusions.

## Controlled exploration

Compare 2–6 options under one neutral fixture. For controlled comparison change one style axis per option while holding identity, appearance, scene, action, camera, and physical light constant. Early concept exploration may compare multiple axes if each hypothesis is declared and no single-cause conclusion is claimed. Technical qualification and user preference remain separate. Selection creates a new draft; it does not activate a package automatically.

## Light ownership

Scene owns physical sources. Direction owns shot use and exposure relationship. `StyleLightGrammar` owns only representational response such as tonal rolloff, contrast, bloom, ink mass, cel bands, or paint edge behavior.

Image and video need separate temporal grammar. A still style cannot imply motion consistency.

Outputs: `StylePackage`, `RepresentationBinding`, `StyleCompile`, `StyleLightGrammar`.
