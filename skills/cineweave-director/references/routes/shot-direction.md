# Route: shot_direction

Use for visual proposals, reusable cinematic patterns, shot compilation, blocking, camera, composition, physical shot lighting, temporal direction, numerical previs, or a hero-frame anchor.

## Resolve the dramatic unit

State one purpose, one audience-attention change, one readable action or sustained observation, and one defined end state. For observational/essay work, a perceptual change may carry the unit without a new plot event. If several spatial or causal changes occur, use the `action` route first.

Order decisions:

`purpose → objective/obstacle/change → attention order → blocking and zones → observable performance → one dominant camera idea → physical shot light → temporal curve → stable end`

Stage before choosing a lens. Name positions, eyelines, support, weight, occlusion, path, foreground/midground/background, and what the audience notices first, second, and last.

## Camera and composition

Specify shot scale, camera position and height, angle, axis side, perspective intent, focal length when useful, focus target, depth, movement motivation, start/peak/settle, and stable end. “Cinematic” is not a camera decision. A composite move is allowed only when each component has an independent readable purpose.

## Shot light and time

Use only sources in exact `SceneLightState`. Mark direct, bounce, or transmitted use; name the bounce/transmission surface. Style treatment cannot replace source logic.

Keep actor performance, camera, focus, scene motion, dynamic light, and edit events on separate tracks. Synchronize them without rewriting Character-owned timing.

## Cinematic patterns and compilation

For creative shot design or revision, read [adaptive master-style techniques](../optional/master-style-presets.md) even when no master is named. Infer suitable methods from the brief, combine compatible dimensions, and proceed without a preset-selection question. Preserve the shared look from the visual bible; technique changes never authorize per-shot grading or texture changes. Browsing, exact compilation, and review alone do not authorize adaptation.

A reusable `CinematicSkillManifest` entry contains story function, typed bounded parameters, required bindings, owner routes, target artifacts, and quality checks. It is not a provider preset.

`ShotCompilerPlan` resolves one selected pattern, exact bindings, and parameter values into projection-only controls and planned route handoffs. Resolve `@Asset` only through an exact registry. Never emit fake output hashes or execute the plan.

## Downstream artifacts

Create `ShotSpec` before `ShotLightingPlan`, `TemporalSpec`, optional `CameraPrevisSpec`, and `HeroFrameAnchor`. A HeroFrame records selected visual DNA and inheritance policy; it does not create identity, geography, or rights facts.

For staging, performance, or competing shot treatments read [directing craft](../optional/directing-craft.md). For lens/light/movement decisions read [cinematography craft](../optional/cinematography-craft.md). Use their conditional checks without importing every method into every shot. Load numerical camera, portrait, or cinematic-pattern references only when the request needs them.

Outputs: `CinematicSkillManifest`, `ShotCompilerPlan`, `ShotSpec`, `ShotLightingPlan`, `TemporalSpec`, optional `CameraPrevisSpec`, `HeroFrameAnchor`.
