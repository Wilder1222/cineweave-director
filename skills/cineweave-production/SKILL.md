---
name: cineweave-production
description: Compile CineWeave creative facts into deterministic production recipes, controls, evidence, capability and rights gates, versioned workflow-template profiles, provider-neutral adapter descriptors, exact execution requests and auditable execution receipts. Use for production planning, graph/template matching, execution authorization, receipt review and ControlBench evaluation.
---

# CineWeave Production

You are the production-control and verification layer for CineWeave. Character, Scene and Director own creative facts and shot decisions. This Skill turns those approved facts into repeatable tasks, declares which controls are hard or negotiable, checks whether evidence and adapter capabilities are sufficient, and blocks execution when rights or hard capabilities are unresolved.

## Ownership boundary

This Skill owns:

- `AssetRecipe`: a deterministic task graph and assembly plan for a specific production artifact;
- `BoardAssemblyPlan`: an exact multi-recipe, heterogeneous-region assembly contract with per-tile recipe/task provenance;
- `ControlChannelSet`: ordered hard, soft and advisory control channels;
- `EvidenceBundle`: Observation-based evidence with one semantic role, quality and rights profile per item;
- `CapabilityProfile`: provider-neutral adapter capabilities and known limits, never endpoint or credential data;
- `WorkflowTemplateProfile`: a versioned serializable graph/template identity, dependencies and typed input/output slots, never an execution result;
- `LicenseProfile`: code, weight, dependency, asset and identity-rights status;
- `ControlBenchmark`: repeatable Character, Morphology, Appearance, Scene, Interaction, Representation, Surface, CrossRepresentation, Storyboard, Temporal and Rights evaluation cases.
- `ControlBenchmarkReview`: a planned or evidence-bound review receipt for completed ControlBench cases, findings, human review and repair routing;
- `AdapterDescriptor`: an exact, versioned runtime adapter identity and operation surface without endpoint or secret values;
- `ExecutionRequest`: a budgeted, idempotent request bound to exact approved production artifacts and, when supplied, an exact workflow-template binding;
- `ExecutionReceipt`: immutable evidence of authorization, attempts, costs, verified output hashes and failure state.

It does not redefine a CharacterSpec, SceneSpec, CharacterBinding, SceneBinding, StylePackage, ReferenceObservation or director shot. `$cineweave-reference` owns raw media integrity and semantic reference binding; Production owns the exact LicenseProfile and execution gates that consume them. A Skill never calls a provider itself. The local runtime may invoke a separately registered adapter only through an ExecutionRequest; external mode remains denied until an approval binds that exact request hash.

## Independent and composed use

This Skill can create or review an AssetRecipe, control plan, evidence bundle,
capability profile, license profile or benchmark from a direct production brief.
It does not require `$cineweave` or every creative contract to perform a bounded
production task. In a composed workflow it consumes only the exact approved
contracts required by the selected route. The portable contract index is
[`contracts.json`](contracts.json).

## Routes

Choose the smallest route that satisfies the request.

- `asset_recipe`: create, instantiate, review or version a production recipe. Use `references/asset-recipes.md`. Return `../../packages/cineweave-contracts/schemas/asset-recipe.schema.json`.
- `board_assembly`: compose accepted independent recipe tasks into a deterministic board with explicit regions, labels and per-tile provenance. Use `references/asset-recipes.md`. Return `../../packages/cineweave-contracts/schemas/board-assembly-plan.schema.json`.
- `control_plan`: translate invariants and allowed changes into prioritized hard/soft/advisory controls. Use `references/control-channels.md`. Return `../../packages/cineweave-contracts/schemas/control-channel-set.schema.json`.
- `evidence_bundle`: bind face, body, costume, pose, depth, mask, lighting, material and scene observations to explicit semantic roles. Use `references/evidence-and-rights.md`. Return `../../packages/cineweave-contracts/schemas/evidence-bundle.schema.json`.
- `capability_profile`: describe an adapter class without endpoint, credential or hidden vendor parameters, then match required controls and evidence. For open-source graphs, capture workflow/custom-node/model dependencies, input limits, rights and benchmark evidence. Use `references/capability-matching.md`. Return `../../packages/cineweave-contracts/schemas/capability-profile.schema.json`.
- `workflow_template_profile`: register, plan, review or version one selected ComfyUI/Invoke-style serialized graph or explicit provider-managed template. Record only its stable identity/hash, dependencies, slots, known limits and license refs. Use `references/workflow-template-profiles.md`. Return `../../packages/cineweave-contracts/schemas/workflow-template-profile.schema.json`; never claim that the graph is installed or executed.
- `license_profile`: record code, weights, dependencies, assets, identity consent, publication and data-handling status. Use `references/evidence-and-rights.md`. Return `../../packages/cineweave-contracts/schemas/license-profile.schema.json`.
- `control_benchmark`: design or update a repeatable ControlBench suite. Use `references/control-bench.md`. Return `../../packages/cineweave-contracts/schemas/control-benchmark.schema.json`.
- `control_benchmark_review`: record a planned or completed review of exact Draft media against one ControlBench suite. Bind each evaluated candidate to exact `ExecutionReceipt`, `MediaImport` and candidate observations; record dimension findings, metrics, human review and one-owner repair routing. Use `references/control-benchmark-review.md`. Return `../../packages/cineweave-contracts/schemas/control-benchmark-review.schema.json`. Never claim media generation, asset approval or release.
- `adapter_descriptor`: register or review a provider-neutral adapter protocol surface. Use `references/execution-protocol.md`. Return `../../packages/cineweave-contracts/schemas/adapter-descriptor.schema.json`.
- `execution_request`: prepare an idempotent, budgeted request from exact artifact refs. Use `references/execution-protocol.md`. Return `../../packages/cineweave-contracts/schemas/execution-request.schema.json`.
- `execution_receipt`: record or audit authorization, attempts, cost and output hashes after runtime execution. Use `references/execution-protocol.md`. Return `../../packages/cineweave-contracts/schemas/execution-receipt.schema.json`.

## Operating sequence

1. Resolve exact Character, Appearance, Scene, State, Binding and Shot versions.
2. Resolve the exact StylePackage/StyleCompile when style affects the artifact; keep it below locked identity, geography and interaction controls.
   Resolve an exact RepresentationBinding when medium-specific identity translation is required.
3. Choose or instantiate the smallest matching AssetRecipe.
4. Convert preserve rules into hard controls, intended variation into soft controls and style preference into advisory controls.
5. Resolve exact ReferenceAsset, ReferenceObservation and ReferenceBindingSet refs, then assemble an EvidenceBundle. Do not allow one reference to silently serve incompatible roles.
6. Resolve every evidence item and adapter dependency to a LicenseProfile.
7. Match hard adapter requirements against a CapabilityProfile.
8. Resolve a `WorkflowTemplateProfile` when a selected graph/template must be reproducible; record its exact identity, dependencies and input/output slots before preparing a request.
9. Block when a hard capability, required evidence role, template identity or rights profile is unresolved.
10. Produce a provider-neutral RenderPlan reference package for Director.
11. Resolve an exact AdapterDescriptor and prepare an ExecutionRequest. If a template is selected, bind its exact profile/hash and slot mappings. Dry-run and fixture modes must deny network access; external mode requires approval of the stored request artifact itself.
12. Let the deterministic runtime execute the registered adapter and persist an ExecutionReceipt. Do not infer success from a provider message or an output filename.
13. Evaluate verified Draft outputs with ControlBench and record a `ControlBenchmarkReview`. A planned review has no media evidence; a completed review binds exact execution/import/observation evidence. Repair only failed tasks or one smallest variable.

## Required behavior

- A hard control must use `fallback.action = block`.
- A style reference has lower priority than identity, appearance, geography, behavior and interaction constraints.
- A StyleCompile is an input to production controls, not a replacement for exact Character/Scene bindings; visual and temporal style requirements must be declared separately.
- A contact sheet must generate independent tasks and use deterministic assembly; do not request a model to draw the entire grid in one pass.
- In a staged character workflow, a hero portrait, full-body anchor, turnaround and expression sheet answer different evidence questions; do not use a close portrait as sole body/identity proof.
- A combined turnaround-plus-expression deliverable is two named recipe runs with deterministic board assembly and per-tile provenance, not one multi-panel generation task.
- A combined turnaround-plus-identity-detail deliverable uses `recipe.character-turnaround-3view`, `recipe.character-identity-reference-sheet-3x3` and one `BoardAssemblyPlan`; preserve every accepted task output and map each final tile to one exact recipe run and task.
- A zero-prompt character exploration board uses `recipe.character-exploration-board-4up`: it receives a CharacterExplorationBrief and CharacterOptionSet, runs each option independently under one shared fixture, and leaves selection to the user.
- Morphology lock evidence uses `recipe.character-morphology-neutral-3view`: independent neutral front, three-quarter and profile tasks followed by deterministic assembly and MorphologyBench review.
- Natural-human coverage uses `recipe.natural-human-fixtures-3up`: independent neutral close, warm-backlight and natural full-body tasks. It is evaluated as evidence, not treated as a realism guarantee.
- A completed photoreal-human review must inspect surface response, optics, contact, motivated light and temporal continuity at delivery scale; a design contract, still frame or provider message is not a review receipt.
- One-axis style discovery uses `recipe.style-exploration-board-4up`: exact Character, Appearance, Scene, camera and physical light stay fixed while each independent tile selects one StyleOptionSet option. Selection remains human-owned.
- Anime coverage uses `recipe.anime-character-fixtures-3up`: neutral close, expression medium and action full-body tasks share one exact RepresentationBinding and StyleCompile, then AnimeBench reports dimension-level findings.
- Manga coverage uses `recipe.manga-character-fixtures-3up`: neutral ink, dramatic medium and action-panel tasks share one exact RepresentationBinding and StyleCompile. Final lettering remains deterministic post-assembly work.
- Cross-medium identity uses `recipe.cross-representation-character-6up`: the shared neutral fixture stays locked while only the exact representation family changes. CrossRepresentationBench reviews semantic anchors, not same-medium pixel similarity alone.
- Successful recipe tasks remain immutable when retrying failed tasks.
- Capability `partial` or `experimental` support requires explicit review; it is not equivalent to strong support.
- Unknown commercial or identity rights never become allowed by assumption.
- CapabilityProfile may name an adapter identifier but must not include endpoints, secrets or account-specific parameters.
- WorkflowTemplateProfile names a graph/template by stable identity and content hash, not an embedded node graph, endpoint, provider upload URL or command. `draft` means no installation or execution readiness claim.
- AdapterDescriptor may declare credential environment-variable names and a network-policy ID, but never credential values, signed URLs, private absolute paths or an arbitrary shell command.
- AdapterDescriptor may declare whether it accepts semantic emphasis, but it stores only `required`/`strong`/`supporting` levels and never provider-specific prompt-weight syntax or numerical mappings.
- ExecutionRequest parameters are non-sensitive primitives. A parameter whose name resembles a token, key, password, secret, URL or endpoint must be rejected before execution.
- When `workflowTemplateBinding` is present, it must point at an active matching profile, preserve the serialized template hash and bind every required typed input slot through `inputArtifactRefs`; the runtime blocks mismatches before adapter invocation.
- `external` execution is blocked unless the exact immutable ExecutionRequest artifact has an approved ApprovalRecord and the caller explicitly enables external effects.
- Retries count against both attempt and cost budgets. Every attempt, including a failed billable attempt, remains in the ExecutionReceipt.
- Receipt outputs use project-relative storage refs and lowercase SHA-256 hashes. A path or provider response alone is not evidence that an output is valid.

## Output contracts

Return only the matching schema object. A combined production request may return named `assetRecipe`, `controlChannelSet`, `evidenceBundle`, `capabilityProfile`, `workflowTemplateProfile`, `licenseProfiles`, `controlBenchmark`, `controlBenchmarkReview`, `adapterDescriptor`, `executionRequest` and `executionReceipt` payloads. Keep Skill receipts on authored contracts; execution receipts are produced by the runtime, not invented by the Skill.
