# Shot Compiler Plan

`ShotCompilerPlan` is the auditable result of compiling one selected Atomic
Cinematic Skill. It is a deterministic handoff plan, not a generated ShotSpec
and not a provider request.

## Compilation output

The plan must preserve:

- the exact `CinematicSkillManifest` reference and selected skill version;
- the normalized intent, including story function and target level;
- every typed parameter value and its source;
- exact resolved binding refs for each supplied slot;
- exact upstream refs needed by the handoffs;
- one projection-only control for each parameter, grouped by domain;
- planned handoffs to canonical owner routes;
- an ordered trace that is structurally identical to the selected program;
- unresolved decisions and conflicts when the owner still needs to decide.

Controls are mirrors of canonical targets. A hard, soft or advisory control
must retain its enforcement level and owner route; changing a surface value
does not silently edit another domain. The compiler should expose useful
creator language, but the handoff field path remains the source of truth for
the owning Skill.

## Exact binding behavior

Direct bindings carry only exact `kind`, `id`, `version` and SHA-256 content
hash values. Alias bindings additionally carry the exact registry reference
and the alias used. The registry target must equal the resolved binding. An
unknown alias, latest alias, malformed hash, wrong slot kind or over-capacity
binding blocks compilation instead of being guessed.

## Handoff boundary

The compiler may plan `ShotSpec`, `TemporalSpec`, `PerformanceTimeline`,
`SequenceRhythmSpec` and other declared owner outputs. It must not fabricate
their content hashes, claim that a canonical contract already exists, or
collapse several owners into one hidden prompt. The owner route receives the
exact dependencies and field assignments, then authors and validates its own
contract.

`ShotCompilerPlan` is provider-neutral and non-executing: it does not select a
model, encode vendor syntax, call an adapter, generate media, write files,
change Canon or grant approval. Capability resolution, rights, cost and human
approval remain Production concerns after the plan is accepted.
