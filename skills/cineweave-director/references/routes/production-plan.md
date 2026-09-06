# Route: production_plan

Use for non-executing asset breakdown, board assembly, editorial rhythm, color intent, control design, evidence, rights, capability feasibility, and provider-neutral render planning.

For video, sound, delivery profiles, or iteration limits load [video, sound and delivery](../optional/video-sound-and-delivery.md). These are creative planning worksheets owned by existing routes, not new contracts or execution surfaces.

## Asset decomposition

State the deliverable and lock shared invariants. Each task has one primary delta and explicit acceptance criteria. Complex sheets and storyboards use independent tiles/panels; labels, exact text, borders, and grids are assembled later. Plan to retry only failed tasks and preserve passing outputs.

`AssetRecipe` describes tasks and invariants. `BoardAssemblyPlan` describes deterministic regions and layout. Neither proves that a task ran or a board exists.

## Control and evidence

Map each hard or continuity-critical requirement to `ControlChannelSet`: source, scope, semantic control class, preservation rule, tolerance, and review dimension. A mask only scopes a change; it does not prove success.

`EvidenceBundle` states what evidence would be needed to review each claim. `LicenseProfile` keeps copyright, likeness, transfer, publication, redistribution, training, and privacy decisions separate.

## Capability planning

`CapabilityProfile` records supplied or researched capability claims and their evidence status. `CapabilityResolutionPlan` compares exact profiles against hard/soft/advisory requirements. Unknown or partial hard support cannot pass silently. The plan may retain a candidate for human review, but it does not select a provider, invoke an external tool, install anything, or guarantee output.

A provider-specific `PromptProjectionPlan` may bind one exact capability profile after a human has chosen the target dialect. It records compatibility evidence and a manual handoff; it is not a provider selection, request, adapter, or receipt.

## Render, editorial, and color plans

`RenderPlan` binds exact prompt and creative inputs, variants, controls, evidence, rights, and pre/postflight criteria. It is implementation intent only.

`EditorialTimelinePlan` uses rational frame rates, explicit ranges, gaps, and transitions. Placeholders never impersonate media. `ColorPipelineProfile` separates creative grade intent from technical transforms and preview/delivery assumptions.

## Boundary

No CLI commands, adapter descriptors, request/receipt protocols, credentials, network policy, actual spend accounting, output hashes, or generated status belong here. The next action is always an explicit external human/tool step.

Outputs: `AssetRecipe`, `BoardAssemblyPlan`, `EditorialTimelinePlan`, `ColorPipelineProfile`, `RenderPlan`, `ControlChannelSet`, `EvidenceBundle`, `CapabilityProfile`, `CapabilityResolutionPlan`, `LicenseProfile`.
