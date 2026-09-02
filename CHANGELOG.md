# Changelog

All notable changes to CineWeave Director are documented here.

## 3.0.0 — 2026-09-02

### Breaking changes

- collapsed the former multi-Skill CineWeave Studio into one independently distributable `cineweave-director` Skill with 12 internal routes;
- removed the product CLI, local runtime, adapter/execution layer, World OS, project store, marketplace shell, recipes, live evaluation harness, and sibling Skill packages;
- changed installation and plugin identity from `cineweave-studio` to `cineweave-director`;
- made the Skill source itself the distribution authority instead of injecting schemas, examples, or rewritten paths during a build.

### Added

- full-cycle coverage for worldbuilding, story and screenplay, character, scene, visual style, reference evidence and rights, action, shot direction, storyboard rhythm, image prompting, non-executing production plans, review, and repair;
- versioned `WorldBible`, unified `CreativeReview`, bounded `RepairPlan`, and generic non-executing `PromptProjectionPlan` root contracts;
- time-bounded Midjourney projection guidance verified on 2026-09-02 against official documentation, including model/surface compatibility, reference roles, structured parameter tails, hidden-default checks, one-variable experiments, manual execution, and exact result-return requirements;
- a self-contained contract inventory with 52 root kinds, 54 local schemas, 52 canonical examples, and raw-byte SHA-256 hashes;
- a 23-file knowledge tree split into core invariants, 12 route guides, and 7 optional specialist references;
- exact `ReferenceAsset`/`ReferenceObservation` bindings, `ReferenceTransform`, `AssetAliasRegistry`, `HeroFrameAnchor`, `SequenceRhythmSpec`, provider-neutral capability resolution, and production-planning contracts;
- dependency-free repository validation and a lifecycle/index-derived 136-file bundle with byte-for-byte source equivalence.

### Corrected

- made `PromptRecord` reference inputs bind exact `ReferenceObservation` versions and hashes;
- expanded reference transforms to identity, appearance, composition, palette, and typography without collapsing source evidence into target Canon;
- allowed targeted negative constraints to be empty and removed the forced photoreal/physical-light bias from general `ImagePrompt` validation;
- opened formatted capability IDs so exact researched capabilities and resolution requirements share one vocabulary;
- hardened schema validation so `$ref` siblings and `patternProperties` cannot be skipped and direct JavaScript payloads must be plain JSON values.

### Boundaries

- provider syntax and account state live only in a projection child of exact provider-neutral Prompt Canon;
- production artifacts stop at plans, controls, compatibility evidence, rights gates, human handoffs, and feasibility assessments;
- adapter descriptors, execution requests/previews/receipts, media import/probe, credential handoff, repair-run receipts, and workflow-template platform contracts are explicitly excluded;
- plugin version `3.0.0` remains independent from compatible 2.x artifact wire versions carried by unchanged contracts.

## Legacy CineWeave Studio history

Versions 0.5.0 through 2.5.1 described the former multi-Skill Studio, runtime, and World OS architecture. Their full release history remains available in corresponding immutable Git tags; those components are not part of the 3.0.0 distribution.
