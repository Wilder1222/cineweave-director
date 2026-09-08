# Artifact control and precedence

## Keep layers separate

`intent → world/canon → character and scene state → representation → shot/time → prompt projection → production plan → observed evidence`

A downstream layer may select or narrow an upstream fact, but it cannot silently redefine it. Prompt wording is never Canon. Style cannot rewrite identity or geography. Camera cannot rewrite actor performance. A review cannot turn inferred evidence into visible evidence.

## Exact references and versions

When a caller supplies kind, ID, version, and content hash, preserve them exactly. Never resolve `latest`, fabricate a hash, or reconstruct a repository receipt from memory. If an exact reference is unavailable, use a clearly labeled working reference or leave the dependency unresolved.

Create a child version for a bounded correction to the same target. Fork when purpose, audience, rights basis, world authority, or a hard upstream constraint changes materially. Never overwrite an approved version in place.

Artifacts follow one-way dependencies within a version. Review may request a new upstream version, followed by selective downstream recompilation; this is a revision loop, not a back-reference into an immutable parent. For impact records and restart checkpoints load [drafts and change impact](../optional/drafts-and-change-impact.md). Typical order:

- `WorldBible → StoryBrief → BeatSheet → ScriptScene`;
- `CharacterSpec → CharacterAppearanceState / CharacterBinding / PerformanceTimeline`;
- `SceneSpec → SceneState / SceneLightState / SceneBinding`;
- `ShotSpec → ShotLightingPlan / TemporalSpec / CameraPrevisSpec / HeroFrameAnchor`;
- `Storyboard → SequenceRhythmSpec`;
- approved facts → `PromptRecord` / `ImagePrompt`;
- exact prompt Canon + exact capability evidence → optional `PromptProjectionPlan` → human external handoff;
- prompt and projection artifacts → non-executing production plans.

A provider projection is a versioned child of exact prompt Canon. Provider flags, reference slots, profile/style codes, surface defaults, and compatibility claims stay in `PromptProjectionPlan`; they never flow backward into world, character, scene, style, shot, `PromptRecord`, or `ImagePrompt`.

Do not insert downstream references back into an already hashed parent.

## Three vocabularies that must not collapse

- creative mutability: `hard / soft / free / undefined`;
- acceptance enforcement: `hard / soft / advisory`;
- style emphasis: `required / strong / supporting`.

They answer different questions: whether a fact may change, whether failure blocks advancement, and how strongly a representational rule should appear. None is a numeric provider weight.

## Control Card

Write a compact Control Card for any requirement likely to be lost:

```text
requirement: observable result
source: exact artifact and field, or bounded user statement
scope: subject | region | shot | sequence | panel
lock: hard | soft | free | undefined
enforcement: hard | soft | advisory
preserve: passing facts that must survive
allowedDeviation: explicit tolerance or unknown
reviewDimension: world | story | identity | appearance | geography | action | camera | light | style | prompt | rights
```

## Conflict precedence

Rights and evidence validity are gates. Within valid evidence, use:

1. explicit hard locks and approved canon/causality;
2. identity, geography, interaction, and physical-light facts;
3. current appearance, scene state, and exact bindings;
4. blocking, time, coverage, and continuity;
5. representation and style treatment;
6. prompt wording and tool preference.

Same-level conflicts require an explicit decision; “newest” and “prettiest” are not resolution policies.
