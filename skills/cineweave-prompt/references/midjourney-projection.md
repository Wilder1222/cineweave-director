# Midjourney Projection

`midjourney_compile` is a provider projection for visual exploration. It is
not the reusable prompt core, an execution tool or a master-reference selector.
Compile the provider-neutral target first, then emit a `MidjourneyPromptPack`
with 3–8 comparable variants and a human return gate.

## Compile sequence

1. State one primary target and its intended use: subject, scene, medium,
   viewpoint, light, mood and composition.
2. Choose one exploration axis for the pack. Give every variant one hypothesis
   and one declared change. Keep identity, appearance, style, scene and
   composition as separate dimensions.
3. Write a concise semantic prompt. Midjourney's own guidance recommends
   describing the subject, medium, environment, lighting, color, mood and
   composition; extra adjectives are not a substitute for visible relations.
4. Add only the reference roles and Aesthetic Profiles needed by the
   hypothesis. Store reference placeholders and explicit `--p` tokens in the
   contract; never rely on account defaults.
5. Pin a model version compatible with every selected reference role, then set
   the aspect ratio and relevant parameters. Record the verification note
   because parameter behavior can change between versions.
6. Add acceptance checks, known failure modes and the next experiment.
7. State exactly what the user should run, save and bring back. Never state
   that Midjourney was called or that a result exists.

## Reference-role separation

Use the following semantic boundary when choosing slots:

| Midjourney input | Use it to explore | Do not assume it transfers |
| --- | --- | --- |
| Image Prompt | content, broad composition, color or spatial inspiration | exact objects, exact pose or faithful copying |
| Style Reference (`--sref`) | visual vibe, palette, medium, texture and lighting treatment | the source person, objects or layout |
| Omni Reference (`--oref`, V7 surface) | a declared subject/identity or object anchor | full-body identity, costume, scene and action unless separately evidenced |
| Moodboard (`--p`) | a curated, broad project/style direction | a single exact subject, shot or canonical design |
| Starting/ending frame | a video transition or frame relationship | a general image/style-reference control for every video mode |

The official documentation describes Image Prompts as inspiration for content,
composition and colors, Style Reference as visual vibe rather than content,
and Omni Reference as a V7 subject reference. Keep those roles separate even
when one image is used in more than one controlled experiment. A reference is
evidence for a declared purpose, not an exact-copy promise.

## Aesthetic-layer separation

When a visual system should persist across many prompts, record it as a
`MidjourneyAestheticProfile`, not as an unbounded prose suffix:

1. a creator Personalization Profile supplies a broad creator baseline;
2. a project Moodboard supplies curated world or domain visual grammar;
3. image/style/Omni references control one declared shot-level role; and
4. `promptText` describes the subject, action, scene, camera and physical light
   needed now.

Read `midjourney-aesthetic-profiles.md` before compiling any pack with `--p`.
Bind profile refs and an explicit profile ID or resolved code in
`aestheticProfileBindings`; include the same `--p` token in every comparable
variant. A profile ID follows its latest state, while a resolved code is a
snapshot—ask the user to return the code Midjourney actually resolves after
submission.

## Version and parameter policy

At the time of this research pass (2026-08-30), Midjourney's version page lists
V8.2 as the current default. This is time-sensitive: before execution, check the
official [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)
page and pin the selected version in `parameterPolicy`.

### Reference-role compatibility gate

At this verification point, Midjourney documents Omni Reference as V7-only even
though the current default is V8.2. If a pack contains `omni_reference`, pin
`modelVersion: "V7"` and use `--v 7` for all comparable variants. A V8.2 pack
must omit Omni Reference or become a separate V7 identity experiment. Do not use
a default-version statement to override a feature-specific compatibility rule;
re-check the official Version and Omni Reference pages immediately before
execution.

Keep provider syntax in the projection only:

```text
{{style_reference}} {{identity_reference}} subject, visible action, scene,
viewpoint and composition, physical light, material response, restrained mood
--v 7 --ar 3:2 --s 150
```

The pack should retain the parameter tokens as data, not bury them in a
provider-neutral `PromptRecord`. Do not invent private CDN paths, credentials,
seed guarantees or unsupported parameter combinations. Use the surface named
by the user (`web`, `discord` or `both`) and tell them to replace each
placeholder with the correct reference input.

For any Moodboard, `--s` controls the influence; it ranges from 0 to 1000 and
defaults to 100 at this verification point. Do not use `--sw` or `--sv` in a
Moodboard pack. A scoped `--sref` or Omni reference may still be available when
the selected model supports it, but all model-specific conditions still apply.

Useful official references for the projection are:

- [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics)
  for concise prompt construction;
- [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts)
  for image-role behavior and aspect-ratio preparation;
- [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)
  for `--sref`/`--sw` semantics;
- [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)
  for the V7 subject-reference boundary;
- [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards)
  for broad curated style exploration;
- [Modifying Creations](https://docs.midjourney.com/hc/en-us/articles/33329329805581-Modifying-Your-Creations)
  and [Vary Region](https://docs.midjourney.com/hc/en-us/articles/32794723105549-Vary-Region)
  for small, reversible follow-up experiments.

Do not carry image/style/omni reference assumptions into video automatically.
The official [Video](https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video)
documentation states that Image Prompt, Style Reference and Omni Reference are
not compatible with video generations; a selected still must instead be
ingested and handed to the Director/Production video path as a starting frame
or other explicit input.

## Variant and selection rules

For the usual first pack, use three variants:

- a neutral content/composition baseline with no optional reference;
- a style-led variant that changes only representation or visual treatment;
- an identity-led variant that adds a declared identity/subject reference.

Hold the aspect ratio, target, scene cue and primary action constant while
comparing. Ask the user to select a master for each role, record why it passed,
and return the original image plus metadata to `$cineweave-reference`. A chosen
image remains `candidate` or `selected` in the pack; it is not a
`CharacterSpec`, `StylePackage` or `SceneSpec` until its owning Skill reviews
the evidence.

## Reusing explored cases

Use `midjourney_case_import` before `midjourney_compile` when the user has
already explored a direction and wants it to act as an example or reference.
The case must cite exact `ReferenceAsset` records for every actual result image;
do not store local paths, transient gallery URLs or an implied image in the
prompt contract. Record the original prompt text, model/version, parameter
tokens, human selected/rejected status, observed strengths and risks, rights
uncertainty and the user's permitted reuse boundary.

When compiling a new pack, an `explorationCaseRef` can transfer only its
declared policy—such as palette, material response, corridor depth, lighting or
an explicit negative example. If an actual old result should occupy an Image,
Style or Omni reference slot, bind its exact case/result/`ReferenceAsset` trio
in that slot's `caseImage` field. It does not transfer a person, logo, artist
attribution, distinctive location, exact composition or identity unless the
case specifically permits it and the current project has the required evidence
and approval. Keep each reuse decision visible in the pack rather than turning
an old result into an implicit Canon.

The bundled `midjourney-exploration-case` example is metadata-only: it
demonstrates the contract shape but does not include a real Midjourney result
image. Users should supply their actual original files for ingestion before
creating a production case. See `midjourney-case-library.md` for the intake
checklist.

## Minimum pack checks

Before returning, verify:

- one primary target and one hypothesis per variant;
- one exploration axis per pack/variant;
- image, style, omni and moodboard roles have explicit preserve/do-not-transfer
  scopes;
- creator personalization, project Moodboard, shot-level references and current
  prompt responsibilities are separated;
- every profile token is explicit and a Moodboard pack has no `--sw` or `--sv`;
- model version and parameters are explicit, marked for re-verification and
  compatible with every selected reference role;
- no private locator, invented receipt or generated-media claim is present;
- manual selection, exact-file return and next stage are specified.
