# Optional: Midjourney prompt projection

`verifiedAt: 2026-09-02`

Load only when the user explicitly asks to prepare a prompt for Midjourney. This file defines a time-bounded dialect projection, not canonical creative truth and not an execution adapter.

## Boundary and authority

Use this one-way chain:

`PromptRecord or ImagePrompt Canon → PromptProjectionPlan → human external execution → exact returned metadata/files → Reference/Evidence/Review`

- Canon owns approved visible intent, identity, appearance, geography, action, camera, physical light, representation, preservation rules, and review criteria.
- `PromptProjectionPlan` owns model/surface-specific wording, reference slots, parameters, compatibility checks, and the manual handoff.
- A projection never mutates Canon, chooses a provider on the user's behalf, invokes Midjourney, uploads a reference, generates media, or claims that a job exists.
- Provider results become evidence only after the user returns accessible files plus the actual submitted/resolved metadata. A planned prompt is not observed media.
- Official Midjourney documentation outranks community material for syntax, model support, ranges, and compatibility. Community projects may inform information architecture and experiment design only.

Reverify this reference when Midjourney changes its default model, the requested surface differs from the documented surface, a requested parameter is not explicitly covered, or 30 days have passed since `verifiedAt`. Unknown compatibility blocks a production handoff; it does not become a guessed default.

## Stable projection method

### 1. Resolve the exact source

Bind one exact `PromptRecord` or `ImagePrompt` by kind, ID, version, and content hash. Bind the exact `CapabilityProfile` used for feasibility claims. Do not project an unversioned prose prompt or silently infer a current capability.

### 2. Write the visible result first

Midjourney's [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics) recommends short, clear phrases that describe the desired image rather than long instruction lists. Compile a concise first pass around the most salient visible facts:

1. primary subject and decisive state/action;
2. environment and spatial relation;
3. composition/viewpoint needed to read the beat;
4. motivated light and material response;
5. representation/style mechanisms;
6. only the constraints needed to prevent likely failure.

Apply the route-level prompt economy gate, then make a projection-specific working pass; this does not add a contract field:

1. inventory the exact source's approved visual propositions before composing, and never shorten by dropping hard Canon;
2. give each candidate clause one semantic job and admit it only when it changes the visible result, preserves an invariant, disambiguates a relationship, or prevents a named failure;
3. collapse synonymous propositions to the most concrete wording—`restrained cinematic realism, cinematic lighting, highly detailed` does not pass merely because it is common; approved facts such as `eye-level 50mm medium full shot`, `low warm rim light`, or `wet white-jade contact reflection` do;
4. compare the body with every reference binding: when a role-scoped style reference already carries soft palette, medium, texture, or treatment, remove synonymous body words, while retaining hard content, identity, action, camera, and exact light/material relationships;
5. describe only the desired final result, never operations such as “copy this,” “use the same style,” or “change the reference”; this follows the official [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts) and [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) guidance;
6. run a final deletion test on every clause: if removing it changes no approved visible proposition or failure coverage, remove it.

Do not use a global adjective blacklist or hard token ceiling. Shortness is a consequence of proposition admission, semantic deduplication, reference-overlap removal, and the deletion test; it must not erase Canon.

### 3. Separate body, references, and parameter tail

The official [Parameter List](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List) requires parameters after prompt text, with a space before `--`, and without punctuation inside the parameter section.

Represent the projection as three separately reviewable parts:

- `promptBody`: positive visible-result language only;
- `referenceBindings`: typed, role-scoped reference placements or placeholders;
- `parameterTokens`: ordered structured tokens rendered once at the end.

Never hide account/UI defaults. Record the selected model, surface, Raw state, Personalization state, default aspect ratio, default stylize/variety setting, and any pinned images as explicit checked state. If the state cannot be inspected, mark it `unknown` and require the human executor to confirm it before submission.

### 4. Bind references by role

Use the narrowest reference mechanism supported by the selected model and surface:

- `image_prompt`: content, composition, or color guidance; not identity proof;
- `style_reference`: color, medium, texture, lighting treatment, or visual grammar—not depicted identity/content;
- `edit_reference`: V8 Edit Model source/reference for modification or reference-led creation;
- `omni_reference`: V7-only person/object form guidance;
- `personalization_profile`: account-specific aesthetic preference;
- `moodboard`: broad project-level aesthetic range.

Every binding must preserve its source observation role and exclusions. Do not place private paths, signed URLs, credentials, or unapproved likeness into the projection. Use a human-resolved locator placeholder when the actual upload/URL is external to the artifact.

### 5. Build one-variable experiments

Create a baseline plus only the variants needed to answer a named question. Each variant declares:

- one changed variable;
- the exact held constants;
- expected observable effect;
- acceptance check;
- whether a seed is held for short-session comparison.

Do not change wording, references, model, aspect ratio, stylize, chaos, and seed together. A seed is an experiment control, not a style or identity bookmark. The official [Seeds](https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds) page allows integers from 0 through 4294967295, warns against cross-session reproducibility, and says seed locking is unreliable in Turbo mode.

### 6. Validate compatibility before handoff

Run explicit `pass`, `warn`, `block`, or `unknown` checks. A parameter being syntactically valid does not prove that it is compatible with the selected model, reference mode, surface, account state, or another parameter.

## Verified Midjourney matrix

The official [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version) page identifies V8.2 as the default since 2026-07-24. Treat the exact selected model as mandatory metadata rather than relying on this default.

| Feature | Verified support or range | Projection rule |
| --- | --- | --- |
| V8.2 | Current default; V8.2 uses the Edit Model in place of Omni/Character Reference and Retexture | Prefer an explicit V8.2 model declaration; use an Edit Model handoff for V8 reference editing |
| V8.1/V8.2 Edit Model | Written instructions with up to four references are described by the current parameter/version docs | Keep each reference typed and role-scoped; do not render V7 `--oref` into V8 |
| V7 Omni Reference | V7 only; one image; `--ow` 1–1000, default 100, generally keep below 400; incompatible with Fast, Draft, Conversational mode, and `--q 4` | Block Omni on V8; require clear text plus the exact V7 model and one Omni binding; see [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) |
| Image Prompt | Officially documented `--iw` range: V8.1/V7 0–3, Niji 7 0–2, default 1; pure-image prompts cannot use stylize or weird | Do not extrapolate a range to another model without fresh evidence; crop references toward the target aspect ratio |
| Style Reference | V6+; `--sw` 0–1000, default 100; V7 `--sv 6` default and `--sv 4` legacy | Keep prompt style words sparse; save the resolved style code; old codes may change across model versions |
| Moodboard | V6+; incompatible with `--sw` and `--sv`; stylize 0–1000, default 100 | Use for broad project aesthetics, not a single narrow style role; block `--sw`/`--sv`; see [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards) |
| Personalization | V6+; Global V7 profile works with V8.2; V8 profiles do not work with V7; stylize 0–1000, default 100 | Record the submitted profile ID and returned resolved code; never depend on an unstated account default; see [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization) |
| Aspect ratio | Default 1:1; integer ratio syntax; current version chart lists maximum 14:1 and 4:1 for HD; extreme ratios remain experimental | Use delivery intent from Canon; do not confuse aspect ratio with pixel dimensions; see [Aspect Ratio](https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio) |
| Chaos/Variety | `--c`/`--chaos` 0–100, default 0 | Use only for a named diversity experiment; higher values may reduce adherence; see [Chaos / Variety](https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety) |
| Stylize | `--s`/`--stylize` 0–1000, default 100 on current versions | Treat as interpretation strength, not semantic importance; vary independently; see [Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize) |
| Weird | `--w`/`--weird` 0–3000, default 0; V5+; not fully compatible with seeds | Use only for explicit exploration and do not claim a controlled seed comparison; see [Weird](https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird) |
| Raw | V5.1+; removes/reduces automatic styling so explicit prompt treatment has more control | Use for a named fidelity/control hypothesis, not as a generic quality flag; see [Raw](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw) |
| No | `--no` accepts comma-separated targets; each word is moderated/interpreted independently | Prefer positive specification; add only concrete targeted exclusions and avoid ambiguous phrases; see [No](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No) |
| Quality | V7 supports 1, 2, and 4; 1 is default; `--q 3` resolves to 4; `--q 4` conflicts with Omni | Do not infer V8 quality values from V7 documentation; require model-specific confirmation; see [Quality](https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality) |
| Multi-Prompt `::` | Official support ends at V6.1/Niji 6; it is not listed for V7/V8 | Block layer-separated `::` templates on V7/V8; use concise semantic clauses instead; see [Multi-Prompts & Weights](https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights) |
| Seed | 0–4294967295; V8.X seeds are described as 99% identical, but cross-session behavior is not guaranteed | Record actual returned seed; never use it as identity/style continuity evidence |
| `--hd`/`--sd` | Current docs associate native 2048px HD with V8.1, while the V8.1/V8.2 comparison groups HD support | Treat V8.2 HD compatibility as requiring current-surface confirmation when the docs are ambiguous |

Compatibility checks must include at least: model/surface known, parameter order valid, parameter supported by model, reference mode supported, reference count allowed, reference/parameter conflicts absent, account-default state checked, rights gate resolved, and unresolved official-document ambiguity surfaced.

## `PromptProjectionPlan` design

The root contract should carry:

- exact artifact identity, status, version, `skillReceipt`, and provenance;
- exact `sourcePromptRef` restricted to `PromptRecord` or `ImagePrompt`;
- exact `capabilityProfileRef`, required exact `licenseProfileRef`, plus an optional exact `capabilityResolutionPlanRef`;
- `dialectId`, explicit `modelVersion`, `surface`, and `verifiedAt`;
- official evidence entries containing title, URL, checked date, and bounded claim;
- `promptBody`, ordered `parameterTokens`, typed `referenceBindings`, and the final `renderedPrompt`;
- baseline plus one-variable variants and explicit held constants;
- compatibility checks with blocking semantics, including exactly one `check.rights-licensing` check bound to the exact `licenseProfileRef`;
- a manual handoff with hidden-default checks and human approval;
- an exact return checklist;
- constants proving `projectionOnly: true`, `mutatesCanon: false`, `generatesMedia: false`, and `invokesExternalTool: false`.

Provider codes and locators belong only in the projection. They do not flow backward into Prompt Canon. Returned codes may be captured in evidence/review records or a child projection version after the human reports the actual submission.

## Manual handoff

Return a copy-ready prompt only when all blocking checks pass. Alongside it, return these instructions:

1. select the recorded model and surface;
2. inspect and disable or record hidden defaults;
3. attach each approved reference to its typed slot;
4. paste the prompt body and one parameter tail without punctuation errors;
5. submit manually only after rights and human approval gates pass;
6. do not report success from a submission screen alone;
7. return the exact metadata and files below.

### Exact return checklist

Ask the human executor to return, without reconstruction:

- external job/task ID and creation timestamp;
- surface and actual model/version shown by Midjourney;
- exact submitted prompt and final resolved prompt;
- ordered submitted parameters and returned/resolved parameters;
- actual aspect ratio, dimensions, mode, quality, stylize, chaos, weird, Raw state, and seed when present;
- submitted Personalization/moodboard/style IDs and the resolved codes Midjourney returned;
- reference slot type, count, and stable user-side asset identifier for each input (not credentials or expiring private URLs);
- original downloaded output files, filenames, and hashes computed only after the files are locally available;
- any warning, moderation block, incompatibility, automatic parameter rewrite, or failed variant;
- which baseline/one-variable variant produced each output.

If any item is unavailable, mark it unknown. Do not fabricate a job ID, code, seed, hash, output path, or success claim.

## Community patterns adopted—and rejected

Community sources are secondary and do not establish current Midjourney behavior:

- [MidJourney Styles and Keywords Reference](https://github.com/willwulfken/MidJourney-Styles-and-Keywords-Reference) demonstrates visual comparison pages, controlled parameter experiments, and research-note navigation. Adopt the experiment-matrix pattern only. The repository exposes no clear license metadata, so do not copy its keyword corpus or images.
- [OpenPromptStudio](https://github.com/Moonvy/OpenPromptStudio) demonstrates editable prompt blocks, classification, ordering, hiding, translation, and user-managed dictionaries. Adopt structured/reversible projection blocks only. Its repository exposes no clear license metadata, so do not copy its dictionaries or UI content.
- [Midgard Theory of Layer-Separated Midjourney Prompting](https://github.com/Midgard-Public/Midgard-Theory-Of-Layer-Separated-Midjourney-Prompting) uses a CC0 license and separates prompt hypotheses into layers. Adopt the one-variable/held-constant experiment discipline, but reject its old-version `::` guidance for V7/V8.
- [midjourney-cc-skill](https://github.com/JustinPerea/midjourney-cc-skill) uses evidence-linked patterns, dimensional analysis, iteration logs, and failure-mode extraction. Adopt explicit evidence and learning records; reject browser automation, execution claims, and V7-frozen parameter knowledge.
- [midjourney-prompt-generator](https://github.com/Amery2010/midjourney-prompt-generator) uses structured form inputs, editable previews, preset controls, and copyable output. Adopt reviewable structured inputs and copy-ready handoff; reject embedded provider/API execution.

Content was rephrased for compliance with licensing restrictions.
