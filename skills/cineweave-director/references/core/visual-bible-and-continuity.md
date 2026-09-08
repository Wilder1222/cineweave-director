# Visual bible and continuity

The visual bible is a set of independently versioned authorities, not one prose mood board.

## Authority dimensions

- **World:** laws, history, geography, societies, technology, and physical design baseline.
- **Story:** causality, knowledge, setup/payoff, stakes, and changed states.
- **Character:** stable identity, current appearance, performance causality, and timing.
- **Scene:** topology, scale, materials, props, state, physical light, and interaction.
- **Style:** medium, representation, abstraction, visual grammar, and temporal grammar.
- **Direction:** shot purpose, attention, blocking, camera, shot-light use, time, and coverage.
- **Reference:** evidence authority, transfer scope, and rights.

Identity, appearance, and representation are separate spaces. Makeup, hair, costume, temporary skin condition, and weathering belong to appearance. Anime, manga, photoreal, illustration, and stylized 3D belong to representation. Neither rewrites stable identity.

Light has four layers:

1. Scene defines physical source, position, direction, size, falloff, and occlusion.
2. Direction chooses shot function and exposure relationship.
3. Style defines representational rolloff, contrast, bloom, line, cel, ink, or paint behavior.
4. Prompt compiles only the visible consequences.

## Shared look, variable techniques

Use one work-level visual baseline and any explicitly approved scene variants. Preserve its representation family, palette/saturation relationships, white-balance/source-color relationships, contrast and tonal rolloff, skin/material rendering, grain/sharpness/bloom or other optical texture, and aspect ratio. These are coordinated facts across existing Style, Scene, Direction, and editorial/color authorities, not a new contract or a single LUT that overwrites them all.

Automatically chosen craft methods may vary blocking, composition, camera movement, focus attention, coverage, edit rhythm, or listening perspective within the approved grammar. They may not import a different master's palette, contrast, lens rendering, film texture, or frame shape for each shot. Shot lighting may adapt to the action and real source geometry, but must remain inside the common exposure/contrast and color intent. Same look does not require identical camera positions, light screen-sides, or pixel values.

When a baseline exists, inherit its exact available references; do not infer a new one from a master name or one attractive frame. When none exists, propose a concise shared look draft from the brief and carry that same draft across the sequence. Mark unresolved facts and approval status; do not manufacture StylePackage IDs/hashes or require the user to operate preset controls. High-impact look approval remains a human gate, separate from routine automatic technique choice.

A day/night transition, new physical source, or subjective scene may change visible illumination for a stated cause while retaining the shared rendering/grade intent. Flashback does not automatically mean sepia, intimacy does not mean neon, and suspense does not mean a new teal/orange grade. Changing the baseline itself requires an explicit look revision with scope and approval, not automatic master matching.

For handoff, pass the same baseline reference or clearly labeled provisional baseline to every shot/style/prompt/color plan, with only permitted shot-specific variations. Compare a representative wide, close-up, and relevant lighting state before extending the plan when the task warrants it. With returned media, check adjacent shots and the common reference under consistent viewing assumptions; with plans only, report instruction consistency, not verified visual matching.

## Continuity ledger

Use one ledger with namespaces rather than duplicated checklists:

- `world.*`: laws, geography, institutions, chronology;
- `story.*`: knowledge, objectives, setup/payoff, possession, relationship;
- `character.*`: identity, appearance, performance, injury, emotion trajectory;
- `scene.*`: topology, prop location, material, weather, physical light;
- `direction.*`: axis, eyeline, action phase, framing, time, coverage.

A motivated transition is `changed`; an unmotivated contradiction is `broken`. Record cause, before state, after state, and affected artifacts. Do not classify every difference as drift.

## Down-projection

Project only facts visible at the requested scale or necessary for continuity. A wide shot does not need every facial micro-detail; a close-up cannot omit the identity anchors and current appearance that are visible. Each shot and prompt should carry the smallest complete slice of the bible, not duplicate the whole project.

When evidence or canon conflicts, surface the competing exact sources and stop at the smallest human decision. Never let style preference, prompt fluency, or a provider limitation silently win.
