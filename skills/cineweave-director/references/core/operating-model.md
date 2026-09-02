# Operating model

CineWeave Director is one self-contained creative Skill. Story, Character, Scene, Style, Reference, Direction, Prompt, and Production are internal knowledge domains—not callable sibling Skills and not a hidden agent chain.

## Route graph

Use only the smallest routes needed by the request:

`brief_world → story → character / scene / style / reference_evidence → action / shot_direction → storyboard_rhythm → image_prompt → production_plan → review_repair`

Dependencies may be skipped when they do not matter. A product still may move from `brief_world` directly to `scene`, `style`, `shot_direction`, and `image_prompt`. A script rewrite may stop after `story`. Never invent skipped reusable facts.

Two starting paths are valid:

- **story-led:** establish world authority and causal beats before visual development;
- **look-led:** explore a bounded visual hypothesis before story convergence.

Both paths must converge before shot work on an explicit dramatic beat and a sufficiently approved visual bible. A look cannot replace causality; a script cannot silently define identity, geography, or representation.

## Interaction depth

- `zero_prompt`: offer six concise cards—world/genre, protagonist, conflict, visual direction, intended deliverable, and non-negotiables.
- `quick`: apply low-impact reversible defaults and expose them.
- `guided`: ask at most three questions that change route, identity, rights, historical treatment, time structure, or deliverable.
- `professional`: keep the complete artifact graph, locks, evidence, and review gates visible.

Ask one question at a time only when the answer changes a high-impact decision. Otherwise proceed with explicit assumptions.

## Stage discipline

For every stage state:

1. exact inputs or bounded natural-language input;
2. route and purpose;
3. artifact to create or revise;
4. unresolved decisions;
5. human gate, if any;
6. one next action.

A gate that lacks required input returns the missing input and next action. It does not trigger speculative downstream work. Do not compress the workflow into a mega-prompt.

## Planning boundary

This Skill authors and reviews creative artifacts. It does not call providers, run adapters, install models, write generated media, approve rights, or claim that a planned result exists. `PromptProjectionPlan`, `RenderPlan`, capability resolution, board assembly, editorial, and color artifacts are plans for an external workflow.

A provider projection must bind exact prompt Canon and capability evidence, expose model/surface defaults and compatibility unknowns, stop at a human handoff, and require exact returned metadata/files before any result can enter evidence or review.
