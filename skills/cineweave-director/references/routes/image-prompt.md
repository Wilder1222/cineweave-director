# Route: image_prompt

Use for reusable text-to-image prompt design, importing an existing prompt, compiling approved artifacts, variants, reference transforms, and prompt-owned repair.

Final Prompt is a projection of approved facts—not Canon, evidence, or proof of generation. A draft prompt may project explicitly provisional design choices without promoting them to Canon.

## Compilation order

Write observable language in this order when relevant:

1. purpose and primary visible target;
2. identity and structure;
3. current appearance or object state;
4. action and performance;
5. environment and spatial relation;
6. viewpoint, framing, composition, and depth;
7. physical light and visible shadow;
8. material/surface response;
9. representation and style treatment;
10. canvas, aspect, and delivery intent;
11. targeted failure prevention.

Facts outrank style adjectives. Include only detail visible at the target scale or needed for continuity.

## Prompt economy gate

Before drafting, reduce approved inputs to a visual-proposition inventory. One proposition is one observable fact or reviewable relationship at the requested scale—for example, who shields whom, where a weapon enters frame, or which light produces a contact shadow. Keep provenance in the artifact; do not narrate it inside the prompt.

Admit a clause only when it does at least one of these jobs:

- establishes the primary visible read;
- preserves an approved identity, appearance, geography, action, or continuity invariant that can affect this frame;
- disambiguates viewpoint, composition, depth, spatial relation, contact, or weight;
- specifies a visible light/material relationship;
- prevents an observed or named high-risk failure not already prevented by a positive clause.

Reject or rewrite a clause when it only praises quality, repeats another clause's semantic proposition, describes workflow or reference manipulation instead of the final image, states metadata invisible at the requested scale, or echoes soft treatment already delegated to a role-scoped reference. Words such as “premium,” “cinematic,” “masterpiece,” and “8K” are warning signs rather than a global blacklist: retain one only when the project defines a distinct observable effect that the word contributes.

Deduplicate by meaning, not exact wording. When two clauses encode the same proposition, keep the more observable, source-grounded, and compact one; do not concatenate synonyms. A reference binding never erases hard Canon: retain identity, content, action, camera, and exact light/material facts, but remove synonymous palette, medium, texture, or treatment adjectives already supplied by that reference role.

Finally, delete each remaining clause in turn. If its removal changes neither the primary read, a required invariant, spatial/physical interpretation, a reviewable style distinction, nor known-failure coverage, leave it out. Do not impose a fixed word or token ceiling; concise output is the result of this gate, not permission to drop visible Canon.

## References and transforms

Compile only approved observation roles and bindings. A source-to-target transform declares preserve, replace, exclude, and unresolved fields. Never transfer a source person's identity, logo, text, place, or rights by implication.

For portraits, keep stable identity, current skin/material state, makeup/hair/costume, capture, light, and representation separate. For action, include only the selected beat's weapon/tool, mechanics, start-to-end trajectory, response, contact, and result.

## Provider projection

Keep `PromptRecord` and `ImagePrompt` provider-neutral. When the user names a provider, create a separate `PromptProjectionPlan` bound to the exact source prompt and exact `CapabilityProfile`. Put model version, surface, provider flags, typed reference slots, profile/style codes, compatibility evidence, and hidden-default checks only in that projection.

For Midjourney, load [`../optional/midjourney-projection.md`](../optional/midjourney-projection.md). Use concise-first visible-result language, a single parameter tail, explicit compatibility checks, and baseline plus one-variable variants. Stop at a copy-ready human handoff. Require exact returned job metadata, resolved codes/parameters, and original files before execution-verification review; allow separately scoped visible-image review with metadata unknown; never infer execution from the plan.

## Exact text and typography

When the requested image contains a title, label, logo, or subtitle, preserve the supplied copy exactly and distinguish visual placement from spelling/layout acceptance. For a prompt-only request, deliver the prompt directly; include the desired text when requested without promising exact rendering or adding a mandatory production workflow.

For final posters, packaging, or other deliverables requiring exact copy, include a separate text/layout handoff: authoritative strings, language, line-break policy, placement/safe area, hierarchy, and supplied font/brand constraints. Plan a text-free or reserved-area visual plate plus deterministic typesetting/compositing when needed. If in-image lettering is part of the chosen design, require visual proof of every character, punctuation mark, line break, clipping and legibility at delivery size; re-typeset failed text while preserving the approved image. OCR may assist checking but is not proof of typography quality. Keep this handoff in a labeled worksheet or Production plan, not invented ImagePrompt fields. A planned overlay is not an exported poster.

## Existing prompt import

Preserve source text unchanged, then create a normalized, reviewable interpretation. Separate global baseline, per-shot facts, style, light, timing, delivery claims, and unknown capabilities. Do not treat imported prose as an already approved ShotSpec or production fact.

## Variants and negatives

Each variant changes one named hypothesis. Negative constraints target observed or high-risk failures; they do not replace a positive specification. Keep vendor syntax, model flags, checkpoints, numeric weights, and hidden account defaults outside canonical PromptRecord and ImagePrompt.

Outputs: `PromptRecord`, `ImagePrompt`, optional `PromptProjectionPlan`.
