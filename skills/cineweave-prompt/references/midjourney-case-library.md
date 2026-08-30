# Midjourney Exploration Case Library

Use this guide when a creator wants previously explored styles, original
Midjourney prompts and actual result images to remain available as examples for
future work.

## Intake checklist

Collect one bounded case at a time:

| Required input | Why it is retained |
| --- | --- |
| Case title and intended reuse | keeps an old experiment from becoming a default project style |
| Original prompt text | preserves the actual hypothesis rather than a rewritten memory |
| Model/version and parameter tokens | makes the result auditable and warns that provider behavior may change |
| Actual original result files | lets Reference create exact `ReferenceAsset` records; a gallery URL alone is not enough |
| Selected / candidate / rejected note for each image | retains the human decision and negative examples |
| What worked, what failed | makes the case useful for the next exploration axis |
| Allowed reuse and do-not-transfer list | protects subject identity, rights and project-specific facts |
| Rights / usage status | keeps unknowns visible rather than silently granting permission |

## Import procedure

1. Send each result image to `$cineweave-reference` and retain the exact
   `ReferenceAsset` ref. Add observations only if a later owner needs visible
   evidence.
2. Call `$cineweave-prompt` `midjourney_case_import` with the original prompt,
   model/version, parameters, result refs and the creator's selection notes.
3. Make a compact `styleProfile`: visual atoms, lighting, composition,
   color/material behavior and representation. It is a description of the
   experiment, not a claim that the result is canonical.
4. State a `reusePolicy`. Allow only the dimensions that should influence new
   work; explicitly forbid transfer of old subjects, logos, artist claims,
   distinct locations, source artwork or unapproved identity facts.
5. During a new `midjourney_compile`, cite the case in `explorationCaseRefs`
   and copy only the authorized visual mechanism into the new hypothesis. When
   the old result itself should be sent to Midjourney, bind the case ref,
   `resultId` and exact `ReferenceAsset` ref in that reference slot's
   `caseImage` field.

## Result-image roles

| Case role | Appropriate use | Boundary |
| --- | --- | --- |
| `style_reference` | palette, material response, visual treatment | does not carry source subject or layout |
| `image_prompt` | broad content or composition inspiration | does not promise exact objects or pose |
| `omni_reference` | declared subject/object anchor on a compatible surface | never implies full character or costume continuity |
| `moodboard` | broad curated direction | no single image becomes a Canon source |
| `negative_example` | documents a failure to avoid | does not become a positive visual target |
| `validation` | checks that a later result preserves a declared dimension | does not replace human approval |

## Example request

```text
Use $cineweave-prompt to import my existing Midjourney exploration case.
The original prompt and --v/--ar/--s parameters are below. These three images
have already been ingested as exact ReferenceAssets. The misty cyan palette,
wet stone material and long corridor depth may transfer; the prior actor,
signage and location must not transfer. Keep rights as unknown and do not
create a CharacterSpec or Canon lock.
```

After import, the case can be used as a referenceable example in the next
prompt pack. Attach actual image files in the current task if they have not yet
been ingested; the package intentionally ships no user result media.
