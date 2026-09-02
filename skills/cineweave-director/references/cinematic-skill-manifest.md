# Atomic Cinematic Skill Manifest

`CinematicSkillManifest` is the Director-owned catalog for small,
parameterized cinematic programs. It is the creator-facing layer that turns a
gesture such as a reveal, restrained reaction or match cut into a bounded
program with explicit inputs and department targets.

## What the manifest owns

Each `atomicSkill` declares:

- one stable `skillId` and version;
- a story function and target level (`shot` or `sequence`);
- named binding slots with accepted exact contract kinds and capacity;
- typed parameters with defaults, options or numeric bounds;
- canonical target paths and their owning Skill routes;
- an ordered program of `bind`, `set`, `derive`, `preserve`, `handoff` and
  `validate` steps;
- output contracts and route-specific quality checks;
- control groups used only to project a creator-facing surface.

The manifest is a reusable compiler input. It does not become Story,
Character, Scene, Style or Production Canon, and it never replaces the
canonical contract owned by a downstream route.

## Preset is not truth

An emotion, genre or camera gesture may be a useful entry point, but it must
expand into independent parameters and observable owner-specific targets. Do
not hide a multi-domain override behind a label. For example, a restrained
reaction may expose a camera movement parameter, a performance restraint
parameter and a duration parameter; Character still owns the resulting
performance timeline, while Director owns the shot and temporal contracts.

## Resolution rules

1. Select an exact manifest version and record its canonical content hash.
2. Select one declared skill and resolve every parameter, either from its
   declared default, an explicit user override or a deterministic derivation.
3. Bind every required slot to an exact contract reference. Optional slots may
   remain absent and must not be filled by prompt inference.
4. If an `@Asset` alias is used, resolve it only through an exact,
   scope-compatible `AssetAliasRegistry`; `@latest` and cross-scope lookup are
   not valid fallbacks.
5. Preserve each program step, target owner and route in the compiler trace.
6. Leave unresolved creative or upstream decisions visible for the owning
   Skill to complete.

The manifest may describe a control surface, but it cannot choose a provider,
write a file, generate media, execute an adapter or mutate Canon. Production
capability, rights, budget and approval checks happen after the owner Skills
have authored their canonical contracts.
