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

## Shared spatial checks

Before refining coverage, establish a compact relation map for the relevant space: uniquely named anchors, connected zones, actor facing, important sightlines and permitted camera access. A written map or supplied plan may suffice; a new establishing shot is not mandatory. Separate world-relative position from screen-left/right, which changes with viewpoint.

Check crucial proportions using declared dimensions or explicit reference relationships: whether a subject fits a doorway, can reach a shelf, or can pass between fixtures. Perspective alone cannot establish real measurements. Keep inferred dimensions provisional. If a locked scene makes the action impossible, revise blocking or propose the smallest Scene change; a tight crop cannot make the physical contradiction valid.

Design input: [Leos spatial guidance, reviewed snapshot](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/spatial-and-assets.md); adapted to CineWeave's Scene authority and evidence rules.

## Physical light

Record source type, physical origin/anchor, direction, size, intensity relation, falloff, color basis, occlusion, shadow behavior, and bounce surface. A bounce without a named surface is not a physical source. Style treatment cannot move or create a Scene source.

For difficult source geometry, material glare, contrast, or shot-to-shot light matching read [cinematography craft](../optional/cinematography-craft.md). New fixtures or bounce surfaces remain Scene proposals, not implicit additions by Direction.

## Interaction

For contact and action specify support anchor, contact area, weight transfer, grip, collision limits, occlusion, shadow contact, prop ownership, and environmental response. “Leans on wall” is incomplete without the named wall anchor and body mechanics.

Lens and crop cannot repair inconsistent geography. If a hand, foot, vehicle, or prop cannot reach its target under the bound topology, fix Scene or blocking before Prompt.

## Continuity and review

Track topology, prop position, door/window state, material condition, weather, source light, crowd, damage, and contamination. Intentional changes need a cause and transition.

Outputs: `SceneSpec`, `SceneState`, `SceneLightState`, `InteractionConstraintSet`, `SceneBinding`.
