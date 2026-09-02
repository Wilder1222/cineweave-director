# Storyboard layer

For production-facing boards, pair this guide with [storyboard-coverage.md](storyboard-coverage.md). The storyboard owns readable sequence coverage; Production owns independent panel tasks, deterministic assembly, provenance and retry.

Use this reference when the creator needs a sequence of shots, a visual beat sheet, camera coverage, continuity planning or storyboard frames for later image generation.

## Sequence construction

Build the smallest useful sequence. A common progression is:

1. establish geography and the subject's relation to it;
2. prepare or delay the action;
3. show the action at its clearest point;
4. give the audience a reaction or reinterpretation;
5. transition or hold on the new end state.

Do not add coverage only to make the shot list longer. Each shot must change information, attention, spatial relation or emotional pressure.

## Required shot thinking

Every storyboard shot should specify:

- shot purpose and dramatic beat;
- shot scale, angle, height and lens;
- blocking and human-readable performance;
- CharacterBindings when reusable characters are present;
- SceneBinding when reusable geography, materials or scene state matter;
- composition and depth layers;
- dominant camera movement and its start/peak/end states;
- lighting and material continuity;
- sound or editorial bridge;
- transition into the next shot;
- continuity invariants;
- a provider-neutral frame prompt for the single frozen image.

When an ActionSequenceSpec exists, every action shot also binds its exact
`actionSequenceRef` and selected `actionBeatIds`. Preserve the linked coverage
requirements and show every state-changing beat at least once unless the
approved editorial design deliberately carries it through sound or off-screen
action.

## Contract closure

Return a versioned Storyboard, not an unversioned shot list. The root artifact
has a stable `storyboardId`, `version`, `coverageLedger`, execution boundary,
validation record and provenance. Each shot carries an exact `shotSpecRef`,
its sequence order and the IDs of the coverage rows it satisfies. A coverage
row points back to the beats and shots it covers, so an importer can prove the
links in both directions.

When the board scopes an ActionSequenceSpec, its root
`actionSequenceRef` and `actionBeatIds` define the selected slice. Every
selected beat must be selected by at least one shot and represented by a
coverage row. Carry a source coverage requirement unchanged when all of its
beats are inside the selected slice; do not silently relabel or broaden it.
If no ActionSequenceSpec is available, omit all action-beat fields and mark
action coverage as not applicable instead of inventing beats.

Production bindings are optional because a Director may plan before Production
has created a board plan. When an exact `BoardAssemblyPlan` exists, bind its
contract ref and map exactly one storyboard panel per shot to its recipe run,
task, region and tile. A planned panel is not rendered evidence; rendered or
accepted panels require the corresponding execution receipt, and accepted
panels also require evidence. Do not manufacture those refs or statuses.

## Character continuity

For each bound character, preserve or explicitly change:

- CharacterSpec ID, version and content hash;
- active identity anchors visible at that shot scale;
- dominant side, body ratio and signature motion baseline;
- wardrobe, hair, makeup and injury state;
- emotion intensity and concealment trend;
- gaze target, body orientation and action-arc handoff.

Keep `performance` as a concise director-readable summary. Store machine-checkable identity and behavior decisions in `characterBindings`. Do not force every shot to repeat the whole CharacterSpec.

## Scene continuity

For each bound scene, preserve or explicitly change:

- SceneSpec and optional SceneState version/hash;
- active geography, architecture and scale anchors;
- active zones, entrances, exits and occlusion placement;
- camera axis, side and supportable camera anchor;
- fixed/movable prop state;
- material state, weather, atmosphere and light direction.

Keep human-readable scene continuity in `continuity.sceneState`, `geographyAnchors` and `materialState`; keep machine-checkable decisions in `sceneBinding`.

## Storyboard versus image prompt

The Director storyboard owns sequence logic and continuity. `$cineweave-prompt`
owns the exact frozen-frame image prompt, visual hierarchy rendering and
text-to-image construction. Link them through the exact `shotId` / `ShotSpec`
reference and keep the frame prompt subordinate to the storyboard beat.

## Continuity checks

Before returning a sequence, check that screen direction, eyelines, axis, subject identity, character state, appearance state, SceneState, active zones, prop placement, light direction, geography and scale anchors remain coherent. If a deliberate break is required, label it as a transition decision rather than allowing an accidental discontinuity.

For action, also check participant zone/facing, occupied hands, weapon or tool
state, displaced props, damage, support, pursuit direction and the final state
of each ActionSequenceSpec continuity track.
