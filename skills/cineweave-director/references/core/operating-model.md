# Operating model

CineWeave Director is one self-contained creative Skill. Story, Character, Scene, Style, Reference, Direction, Prompt, and Production are internal knowledge domains—not callable sibling Skills and not a hidden agent chain.

## Route graph

Use only the smallest routes needed by the request:

`brief_world → story → character / scene / style / reference_evidence → action / shot_direction → storyboard_rhythm → image_prompt → production_plan → review_repair`

Dependencies may be skipped when they do not matter. A product still may move from `brief_world` directly to `scene`, `style`, `shot_direction`, and `image_prompt`. A script rewrite may stop after `story`. Never invent skipped reusable facts.

Two starting paths are valid:

- **story-led:** establish world authority and causal beats before visual development;
- **look-led:** explore a bounded visual hypothesis before story convergence.

Both paths converge on an explicit dramatic or perceptual unit and a visual bible at matching maturity. Draft shots may use declared hypotheses; final compilation uses approved facts. A look cannot replace causality in causal drama; observational or associative work need not acquire an invented conflict. Non-narrative stills need a communication goal and visible action or state, without invented story prerequisites. A script cannot silently define identity, geography, or representation.

## Interaction depth

- `zero_prompt`: offer six concise cards—world/genre, protagonist, conflict, visual direction, intended deliverable, and non-negotiables.
- `quick`: apply low-impact reversible defaults and expose them.
- `guided`: ask at most three questions that change route, identity, rights, historical treatment, time structure, or deliverable.
- `professional`: keep the complete artifact graph, locks, evidence, and review gates visible.

Interaction depth and presentation are separate. Unless the user requests the full graph or canonical JSON, apply the existing `professional` depth with the **professional-lite** presentation profile: preserve all authority and gates while showing a concise human-readable artifact and one next action. `professional-lite` is not an `inputMode`, route, execution mode, or contract value.

Ask one question at a time only when the answer changes a high-impact decision. Otherwise proceed with explicit assumptions.

## Stage discipline

For every stage state:

1. exact inputs or bounded natural-language input;
2. route and purpose;
3. artifact to create or revise;
4. unresolved decisions;
5. human gate, if any;
6. one next action.

A gate that lacks required input blocks the dependent final commitment. Continue independent work and explicitly hypothetical drafts within the user’s scope. Do not compress the workflow into a mega-prompt.

## Creative maturity and delegated decisions

Maturity is workflow guidance, not a new inputMode or a replacement for existing contract status enums.

- Exploration: propose original hypotheses and compare directions. Multi-axis concepts are allowed when labeled; use one-axis variants for causal comparison.
- Draft: carry declared assumptions into a complete reviewable deliverable. Do not describe provisional choices as approved Canon.
- Final: compile only resolved authority and obtain any still-missing consequential selection.

Record delegated scope, hard locks, decisions already supplied, and decisions still reserved to the user. A request to develop a complete concept authorizes reversible creative drafting; it does not approve rights or external execution. Do not ask again for an unchanged decision already authorized. Batch unresolved final choices after preparing the requested draft.

Use [draft and change guidance](../optional/drafts-and-change-impact.md) for working JSON, version promotion, or resuming a project.

## Planning boundary

This Skill authors and reviews creative artifacts. It does not call providers, run adapters, install models, write generated media, approve rights, or claim that a planned result exists. `PromptProjectionPlan`, `RenderPlan`, capability resolution, board assembly, editorial, and color artifacts are plans for an external workflow.

A provider projection must bind exact prompt Canon and capability evidence, expose model/surface defaults and compatibility unknowns, and stop at a human handoff. Require exact returned metadata/files for execution-verification claims. Accessible media may enter a separately scoped visual or audible review with missing metadata explicitly unknown.
