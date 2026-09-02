# Portrait reference decomposition

Use this workflow when a user asks to 拆解参考图, 反推提示词, analyze a beauty portrait, create a face recipe or reuse selected portrait qualities. The result is evidence first and prompt text last.

## Preconditions

- Inspect the actual image bytes. A filename, prior prose analysis or conversation link without media is not visual evidence.
- Declare the intended use: identity creation, appearance state, style study, shot reconstruction, prompt compilation or a combination.
- Ingest or otherwise bind the exact asset before creating reusable observations.
- Keep likeness, copyright, provider transfer and redistribution unresolved until exact rights evidence says otherwise.

## Atomic observation map

Create only roles supported by visible evidence. One source may yield several ReferenceObservation artifacts, but every artifact has one role, one selector and disjoint extract/ignore lists.

| Visible evidence | Reference role / scope | Primary consumer | Must exclude |
|---|---|---|---|
| stable face geometry and signature marks | `face_identity` / `face` | CharacterSpec | makeup, lighting, crop and generic beauty idealization |
| semantic face relations for editable morphing | `face_morphology` / `face_morphology` | optional CharacterMorphologySpec | biometric measurements, auto-lock and provider weights |
| stable makeup-free complexion and surface baseline | `skin_surface` / `skin` | CharacterSpec | temporary condition, medical/ethnicity claims and style treatment |
| current visible skin response after makeup/condition | `skin_material` / `skin` | CharacterAppearanceState | stable identity claims, hidden physiology and retouch style |
| cosmetic placement and finish | `makeup` / `face` | CharacterAppearanceState | natural anatomy and source identity |
| hairline, grouping, cut and flyaways | `hair` / `face` or `full_character` | CharacterAppearanceState | face identity unless separately observed |
| frozen gaze or expression | `expression` / `face` | Character | timing or performance arc not visible in a still |
| body proportions | `body_identity` / `body` | CharacterSpec | any hidden or cropped anatomy |
| viewpoint, crop, perspective and focus cues | `capture` / `capture` | Director | asserted focal length, aperture, sensor or motion |
| frame hierarchy and negative space | `composition` / `full_asset` | Director | source identity and scene facts |
| visible direction, softness and ratio | `lighting` / `full_asset` | Director or Scene | an unproven physical fixture or exposure setup |
| transferable color/value relationships | `palette` / `style` | StyleCompile | skin baseline and source subject identity |
| representation grammar and retouch treatment | `style` or `surface_style` / `style` | StyleCompile | character anatomy and physical skin state |

Neither `skin_surface` nor `skin_material` is a beauty score. Stable, makeup-free evidence may establish a protected CharacterSpec surface profile. Temporary hydration, cosmetic coverage, sebum, redness or condition becomes CharacterAppearanceState skin material relative to that baseline. When the source does not let a reviewer separate the two, keep a broad `skin_material` observation draft and lower confidence rather than inventing baseline facts. Style controls representation and retouch treatment, never the underlying character surface.

## Evidence discipline

- Use `visible` for pixels that can be directly pointed to, `declared` for supplied metadata and `inferred` for plausible capture or lighting hypotheses.
- A close portrait cannot establish back-of-head design, full-body proportions, gait or hidden facial regions.
- Perspective distortion can imitate facial morphology. Keep capture evidence separate before accepting face ratios as identity facts.
- Retouching, makeup, colored light, white balance, sharpening and compression can imitate skin properties. Lower confidence and state contamination.
- A still can show blur or a frozen gesture; it cannot prove camera motion, edit rhythm or performance timing.
- Use normalized creative-intent values only after semantic review. They are not biometric measurements, physical material measurements, provider controls or promises of output quality.

## Handoff sequence

```text
ReferenceAsset
  → ReferenceReview
  → atomic ReferenceObservation artifacts
  → CharacterSpec + optional CharacterMorphologySpec + CharacterAppearanceState
  → StyleCompile + optional RepresentationBinding + ShotSpec
  → exact ReferenceBindingSet for those target artifacts
  → ImagePrompt or VideoPrompt
```

Do not bind to a target artifact before that exact `{kind,id,version,contentHash}` exists. Observations may inform target creation; the binding set is the reviewed, ordered record of how those observations apply to the resulting targets.

`CharacterMorphologySpec` is optional and remains draft until neutral front, three-quarter and profile evidence passes MorphologyReview. `RepresentationBinding` is optional unless the target changes representation family or the selected StylePackage requires an explicit identity translation policy. Neither is needed merely to write a bounded one-off prompt.

For a multi-role explanatory response, use a named `observations` collection whose members each validate against `../../../packages/cineweave-contracts/schemas/reference-observation.schema.json`. Follow it with a short uncertainty ledger and handoff recommendations. Do not replace the collection with one prose mega-prompt.

## Prompt reconstruction

Prompt compilation is downstream synthesis, not evidence capture. Compile only visible requirements at the intended shot scale:

- preserve CharacterSpec identity invariants;
- apply CharacterAppearanceState makeup, hair and skin state;
- apply StyleCompile representation and realism treatment without changing anatomy or material facts;
- apply ShotSpec viewpoint, framing and light intent;
- carry exact ReferenceBindingSet exclusions and rights gates;
- omit microscopic details that will not be visible at the requested framing.

If the actual reference is missing, return the missing-input boundary and a reusable analysis template, not invented observations or a reconstructed prompt presented as image-derived fact.
