# Route: shot_direction

Use for visual proposals, reusable cinematic patterns, shot compilation, blocking, camera, composition, physical shot lighting, temporal direction, numerical previs, or a hero-frame anchor.

## Resolve the dramatic unit

State one purpose, one audience-attention change, one readable action, and one stable end-state change. If several spatial or causal changes occur, use the `action` route first.

Order decisions:

`purpose → objective/obstacle/change → attention order → blocking and zones → observable performance → one dominant camera idea → physical shot light → temporal curve → stable end`

Stage before choosing a lens. Name positions, eyelines, support, weight, occlusion, path, foreground/midground/background, and what the audience notices first, second, and last.

## Camera and composition

Specify shot scale, camera position and height, angle, axis side, perspective intent, focal length when useful, focus target, depth, movement motivation, start/peak/settle, and stable end. “Cinematic” is not a camera decision. A composite move is allowed only when each component has an independent readable purpose.

## Shot light and time

Use only sources in exact `SceneLightState`. Mark direct, bounce, or transmitted use; name the bounce/transmission surface. Style treatment cannot replace source logic.

Keep actor performance, camera, focus, scene motion, dynamic light, and edit events on separate tracks. Synchronize them without rewriting Character-owned timing.

## Cinematic patterns and compilation

A reusable `CinematicSkillManifest` entry contains story function, typed bounded parameters, required bindings, owner routes, target artifacts, and quality checks. It is not a provider preset.

`ShotCompilerPlan` resolves one selected pattern, exact bindings, and parameter values into projection-only controls and planned route handoffs. Resolve `@Asset` only through an exact registry. Never emit fake output hashes or execute the plan.

## Downstream artifacts

Create `ShotSpec` before `ShotLightingPlan`, `TemporalSpec`, optional `CameraPrevisSpec`, and `HeroFrameAnchor`. A HeroFrame records selected visual DNA and inheritance policy; it does not create identity, geography, or rights facts.

Load optional camera, portrait, or cinematic-pattern references only when the request needs them.

Outputs: `CinematicSkillManifest`, `ShotCompilerPlan`, `ShotSpec`, `ShotLightingPlan`, `TemporalSpec`, optional `CameraPrevisSpec`, `HeroFrameAnchor`.
