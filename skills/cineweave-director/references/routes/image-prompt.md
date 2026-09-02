# Route: image_prompt

Use for reusable text-to-image prompt design, importing an existing prompt, compiling approved artifacts, variants, reference transforms, and prompt-owned repair.

Prompt is a projection of approved facts—not Canon, evidence, or proof of generation.

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

Facts outrank style adjectives. Include only detail visible at the target scale or needed for continuity. Replace empty quality words—“premium,” “cinematic,” “8K”—with observable structure, light, material, or composition.

## References and transforms

Compile only approved observation roles and bindings. A source-to-target transform declares preserve, replace, exclude, and unresolved fields. Never transfer a source person's identity, logo, text, place, or rights by implication.

For portraits, keep stable identity, current skin/material state, makeup/hair/costume, capture, light, and representation separate. For action, include only the selected beat's weapon/tool, mechanics, start-to-end trajectory, response, contact, and result.

## Provider projection

Keep `PromptRecord` and `ImagePrompt` provider-neutral. When the user names a provider, create a separate `PromptProjectionPlan` bound to the exact source prompt and exact `CapabilityProfile`. Put model version, surface, provider flags, typed reference slots, profile/style codes, compatibility evidence, and hidden-default checks only in that projection.

For Midjourney, load [`../optional/midjourney-projection.md`](../optional/midjourney-projection.md). Use concise-first visible-result language, a single parameter tail, explicit compatibility checks, and baseline plus one-variable variants. Stop at a copy-ready human handoff. Require exact returned job metadata, resolved codes/parameters, and original files before review; never infer execution from the plan.

## Existing prompt import

Preserve source text unchanged, then create a normalized, reviewable interpretation. Separate global baseline, per-shot facts, style, light, timing, delivery claims, and unknown capabilities. Do not treat imported prose as an already approved ShotSpec or production fact.

## Variants and negatives

Each variant changes one named hypothesis. Negative constraints target observed or high-risk failures; they do not replace a positive specification. Keep vendor syntax, model flags, checkpoints, numeric weights, and hidden account defaults outside canonical PromptRecord and ImagePrompt.

Outputs: `PromptRecord`, `ImagePrompt`, optional `PromptProjectionPlan`.
