# Route: scene

Use for reusable locations, production design, geography, state, physical light, props, interaction, and shot-specific scene binding. A scene is spatial fact, not a background adjective list.

## Design order

1. narrative function and audience experience;
2. orientation, scale, and named anchors;
3. zones and traversable connections;
4. architecture and material logic;
5. prop locations and affordances;
6. camera topology—valid access, axis, occlusion, and depth opportunities;
7. state model—time, weather, occupancy, damage, and transitions;
8. physical light sources;
9. interaction constraints.

`SceneSpec` defines reusable space. `SceneState` records a versioned current condition. `SceneBinding` selects only facts visible or continuity-critical for a shot.

## Physical light

Record source type, physical origin/anchor, direction, size, intensity relation, falloff, color basis, occlusion, shadow behavior, and bounce surface. A bounce without a named surface is not a physical source. Style treatment cannot move or create a Scene source.

## Interaction

For contact and action specify support anchor, contact area, weight transfer, grip, collision limits, occlusion, shadow contact, prop ownership, and environmental response. “Leans on wall” is incomplete without the named wall anchor and body mechanics.

Lens and crop cannot repair inconsistent geography. If a hand, foot, vehicle, or prop cannot reach its target under the bound topology, fix Scene or blocking before Prompt.

## Continuity and review

Track topology, prop position, door/window state, material condition, weather, source light, crowd, damage, and contamination. Intentional changes need a cause and transition.

Outputs: `SceneSpec`, `SceneState`, `SceneLightState`, `InteractionConstraintSet`, `SceneBinding`.
