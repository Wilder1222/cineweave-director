# AIGC Studio Path

Use this reference for the `studio` mode. The goal is a resumable creative
production loop, not a single mega-prompt:

```text
idea
  → creative brief and lock matrix
  → optional import of prior Midjourney exploration cases (after result-file ingestion)
  → optional creator Personalization / project Moodboard profile import
  → Midjourney exploration pack
  → user visual exploration and selection
  → exact reference ingest and role-scoped observations
  → approved visual bible
  → story / character / scene / style / director assets
  → prompts, storyboard and production recipes
  → user execution, media import, review and one-variable repair
```

## Stage gates

| Stage | Main owner | Deliverable | Pause until the user supplies or approves |
| --- | --- | --- | --- |
| 0. Intent | `cineweave` | `CreativeBrief` + `WorkflowPlan` | target, intended use, output medium and hard locks |
| 0.5. Existing exploration reuse (optional) | Prompt + Reference | `MidjourneyExplorationCase` | original prompt/parameters, exact result files already ingested as `ReferenceAsset`, selected/rejected notes, allowed reuse and rights/usage boundary |
| 0.75. Aesthetic system (optional) | Prompt + Reference | `MidjourneyAestheticProfile` | curated Moodboard source assets or Personalization selection-history method, explicit `--p` ID/code, visual scope and model compatibility |
| 1. Visual exploration | `cineweave-prompt` | `MidjourneyPromptPack` | one or more visual hypotheses, a version-pinned prompt pack and explicit Aesthetic Profile tokens |
| Gate A. Human selection | user | selected master candidates | original image bytes, prompt metadata, parameter/version record, resolved `--p` code and selection notes |
| 2. Evidence | `cineweave-reference` | `ReferenceAsset`, atomic `ReferenceObservation`, `ReferenceReview`, `ReferenceBindingSet` | role, scope, preserve/ignore list and rights/usage status |
| Gate B. Visual bible | Character / Scene / Style | exact `CharacterSpec`, `AppearanceState`, `SceneSpec`/`SceneLightState`, `StylePackage`/`StyleCompile`, `RepresentationBinding` | identity, current look, geography, physical light and representation are approved separately |
| 3. Narrative | `cineweave-story` | `StoryBrief`, `BeatSheet`, `ScriptScene`, `ContinuityLedger` | dramatic question, causal beats and changed states |
| 4. Direction | `cineweave-director` | `ActionSequenceSpec`, `ShotSpec`, `ShotLightingPlan`, `TemporalSpec`, optional `CameraPrevisSpec`, `Storyboard` | action coverage, blocking, camera purpose, time, numerical previs when needed and panel acceptance |
| 5. Asset and prompt production | Prompt / Production | `PromptRecord`, `ImagePrompt`, `AssetRecipe`, `BoardAssemblyPlan`, `WorkflowTemplateProfile`, controls and evidence plan | exact refs, graph/template identity, capabilities, rights and deterministic retry boundaries |
| Gate C. Execution review | user + Production | `MediaImport`, review receipt and repair route | actual output bytes, execution metadata and human review |

The router may return the next stage immediately and leave later stages
pending. A `WorkflowPlan` should make each pause visible through `humanGate`,
`dependsOn`, `requires` and `produces`; it must not imply that a provider was
called.

## The two loops

Keep exploration and production separate:

1. **Divergence loop:** produce 3–8 alternatives under one neutral fixture.
   Change one high-impact axis—identity direction, representation, palette,
   composition or lighting—per variant. Let the user select by observable
   criteria, not an automatic beauty or quality score.
2. **Convergence loop:** ingest selected images as exact references, split their
   evidence by role, approve the visual bible, then create repeatable assets and
   shots. A failed asset produces a new recipe or owner-scoped repair; it does
   not erase successful tiles or silently loosen a hard lock.

The first loop is allowed to be rough and comparative. The second loop must be
versioned, reference-bound and reviewable.

## Personalization, Moodboard and prompt responsibilities

Treat a creator Personalization Profile as a broad creator baseline and a
Moodboard as an intentionally curated project/world visual system. They are not
identity locks, scene geometry or replacements for the approved visual bible.
Use exact image/style/Omni references only for their declared shot-level roles;
let the prompt describe the current shot.

For a reproducible pack, use an explicit `--p` ID/code on every variant rather
than relying on the user's default selections. After the user runs the prompt,
store the resolved code Midjourney returns. Moodboard influence is tested with
`--s` while holding the fixture fixed; do not put `--sw` or `--sv` into a
Moodboard pack. See Prompt's `../../cineweave-prompt/references/midjourney-aesthetic-profiles.md` for the current
provider rules and version caveats.

## Reusing an existing Midjourney exploration

An existing exploration can shorten divergence without treating a previous
image as a default master. First import the actual result bytes through
`$cineweave-reference`; then `$cineweave-prompt` records the original prompt,
model/version, parameters, selected/rejected images, observed strengths and
risks, plus an explicit reuse policy in `MidjourneyExplorationCase`.

The policy may permit visual grammar, palette, lighting, material response,
composition or a negative example. It must state what does **not** transfer:
for example identity, a distinctive subject, logo, location, copyrighted source
art or any fact not approved for the current project. A new pack cites the case
through `explorationCaseRefs`, so later work can see exactly why a visual
decision was reused.

## What to request when the user returns from Midjourney

Ask for the smallest complete handoff:

- selected original image files, not only a screenshot or a transient gallery
  URL;
- the exact prompt text used for each selected result;
- model/version, aspect ratio, stylize and other parameters;
- the explicit Personalization/Moodboard ID used and the resolved `--p` code
  returned after submission;
- which image is intended for identity, appearance, style, scene, composition
  or validation, with separate preserve and ignore notes;
- rights, likeness-consent and permitted-use status, including unknowns;
- one sentence on why each image was selected and which failure it avoids.

For a reusable historical case, also ask which visual dimensions may transfer
to a new project and which must remain unique to the old result. If the source
prompt or rights state is unknown, retain that uncertainty rather than
reconstructing it.

Do not turn one selected image into an all-purpose reference. If it supplies
both identity and lighting, create two role-scoped observations and bind them
separately. If the user only sends a prose description, keep it as intent and
do not manufacture visual evidence.

## Visual-bible consistency contract

Before downstream asset creation, make the following dimensions addressable by
exact refs:

```text
identity        CharacterSpec / CharacterBinding
current look    AppearanceState
place + sources SceneSpec / SceneLightState / SceneBinding
representation  StylePackage / StyleCompile / RepresentationBinding
shot + time     ShotSpec / ShotLightingPlan / TemporalSpec / optional CameraPrevisSpec
```

“保持一致” means that downstream tasks reuse these dimensions and record
deliberate deviations. It does not mean that prompt wording or a provider
reference guarantees identity, garment, geography or temporal continuity.

## Resume and repair rules

- Resume from the latest exact artifact refs; never resolve “latest” from chat
  memory or an unpinned provider gallery.
- If a gate is pending, return the pending inputs and one next action. Do not
  generate downstream facts to fill the gap.
- If a user changes a hard lock, create a new version and mark dependent
  artifacts stale or superseded; do not mutate the old master.
- For a failed output, identify the failing dimension, route it to its owner,
  change one variable, preserve passing dimensions and retain the old receipt.
- Keep provider-specific graph nodes, adapters, masks, model weights, seeds,
  endpoints and capability claims inside Production artifacts. The studio
  plan may request a capability, but cannot assume it exists.

## Required boundary

The all-in-one experience is orchestration. Story still owns causality,
Character owns identity and appearance, Scene owns geography and physical
light, Style owns representation, Reference owns evidence, Director owns
shots and time, Prompt owns prompt projections and Production owns execution
readiness. A studio plan is successful when these boundaries are easy to
inspect and resume—not when it hides them.
