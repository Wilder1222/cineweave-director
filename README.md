<p align="center">
  <img src="assets/cineweave-director-logo.png" alt="CineWeave Director logo" width="160">
</p>

<h1 align="center">CineWeave Director</h1>

<p align="center">
  One self-contained Codex Skill for full-cycle, evidence-aware AIGC creative direction.
</p>

<p align="center">
  <a href="https://github.com/Wilder1222/cineweave-director/actions/workflows/validate.yml"><img alt="Validation" src="https://img.shields.io/github/actions/workflow/status/Wilder1222/cineweave-director/validate.yml?branch=main&style=flat-square&label=validation"></a>
  <img alt="Codex plugin" src="https://img.shields.io/badge/Codex-Plugin-1D6FFF?style=flat-square">
  <img alt="Version 3.0.0" src="https://img.shields.io/badge/version-3.0.0-14B8A6?style=flat-square">
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

CineWeave Director turns a rough idea, existing creative artifacts, or exact visual references into the smallest useful set of editable world, story, character, scene, style, action, shot, storyboard, prompt, projection, planning, review, and repair artifacts. It is one Skill with internal routes—not a chain of hidden agents, sibling Skills, a product CLI, or a runtime.

It is deliberately **non-executing**. It does not call image/video providers, install models, run adapters, ingest private media, publish, approve, or claim that media was generated. Provider-specific output stops at an evidence-backed projection and explicit human handoff; production output stops at plans, controls, rights gates, and review requirements.

## Capabilities

| Internal route | Use it for | Canonical outputs |
| --- | --- | --- |
| `brief_world` | intake, workflow scope, world laws and canon | `CreativeBrief`, `WorkflowPlan`, `WorldBible` |
| `story` | premise, causal beats, screenplay scenes and continuity | `StoryBrief`, `BeatSheet`, `ScriptScene`, `ContinuityLedger` |
| `character` | identity, morphology, appearance, behavior and performance | character specs, bindings and timelines |
| `scene` | geography, architecture, materials, state and physical light | scene specs, constraints and bindings |
| `style` | visual representation and cross-medium translation | `StylePackage`, representation and light grammar |
| `reference_evidence` | visible evidence, rights, exact reference roles and aliases | reference assets, observations, bindings and alias registry |
| `action` | fights, pursuits, escapes and multi-beat interaction | `ActionSequenceSpec` |
| `shot_direction` | blocking, attention, camera, shot light, time and hero frames | shot, temporal, lighting and previs contracts |
| `storyboard_rhythm` | coverage, panels, sequence timing and transitions | `Storyboard`, `SequenceRhythmSpec` |
| `image_prompt` | Prompt Canon, reference transforms and optional provider projection | `PromptRecord`, `ImagePrompt`, `PromptProjectionPlan` |
| `production_plan` | assets, assembly, editorial/color intent, controls and feasibility | non-executing production-plan contracts |
| `review_repair` | evidence-based benchmark/review and bounded single-variable repair | `ControlBenchmark`, `ControlBenchmarkReview`, `CreativeReview`, `RepairPlan` |

The Skill loads only the routes needed by the request. Reusable identity, geography, rights, hard capability, and canon remain unresolved until supplied or approved; plausible prose never silently becomes authority.

## Creator intents

Creators do not need to know the 12 route IDs or 52 contract kinds. The Skill maps natural requests such as “build a complete character asset family”, “analyze only this costume reference”, “design this shot”, “create a storyboard”, “compile a Midjourney prompt”, or “review this candidate” to the smallest route set. These creator intents are thin routing shortcuts inside the same Skill—not commands, additional Skills, or execution endpoints.

The default uses the existing `professional` interaction depth with a **professional-lite presentation profile**: retain exact authority, evidence, locks, and human gates, but present a concise human-readable artifact and one next action. `professional-lite` is not a fifth `inputMode`, route, or contract value. Canonical JSON is emitted only when requested or when an existing contract workflow requires it.

## Install in Codex

Install an immutable release rather than a moving branch. This repository includes a single-entry [marketplace manifest](.agents/plugins/marketplace.json) following the [Codex plugin packaging guidance](https://developers.openai.com/codex/plugins/build/):

```bash
codex plugin marketplace add Wilder1222/cineweave-director --ref v3.0.0
codex plugin add cineweave-director@cineweave-director
```

The manifest's `policy.authentication: ON_INSTALL` is the required Codex marketplace timing policy; it is not a claim that this Skill needs credentials. The plugin declares no MCP server, app integration, provider adapter, or external execution surface.

Start a new task after installation so Codex discovers `$cineweave-director`.

## Use

A multi-route request can start broad while still producing only necessary artifacts:

```text
Use $cineweave-director. Develop this short-film idea into the smallest complete
set of world, story, character, scene, style, action, shot, storyboard and image-
prompt artifacts. Preserve my exact references and unknown rights, stop at human
approval gates, and do not claim that a provider was called.
```

A bounded request can enter one route directly:

```text
Use $cineweave-director for shot_direction only. Stage this approved recognition
beat with blocking, attention order, lens perspective, motivated physical light,
a stable end state and continuity locks. Return a ShotSpec, not an image prompt.
```

For canonical JSON, name the desired artifact or ask the Skill to select the smallest root kind. The distribution contains 52 root contracts, 54 local schemas, and 52 canonical fixtures. Fixtures demonstrate structure only: their hashes, receipts, IDs, rights, and approvals are not real-world evidence.

## Midjourney projection

Prompt Canon remains provider-neutral. When Midjourney is explicitly requested, the `image_prompt` route may create a separate `PromptProjectionPlan` that pins an exact source prompt, capability profile, model, surface, official compatibility evidence, structured parameter tail, typed reference slots, one-variable experiments, hidden-default checks, manual handoff, and exact return checklist.

The time-bounded [Midjourney projection guide](skills/cineweave-director/references/optional/midjourney-projection.md) was verified on 2026-09-02 against official Midjourney documentation and selected GitHub implementations. It does not automate a browser or provider API. A copy-ready prompt is still only a plan; review starts after a human returns accessible original files and exact job metadata.

## Creative-control model

The default dependency direction is:

```text
World → Story → Character / Scene / Style / Reference
      → Action / Shot → Storyboard / Rhythm → Prompt Canon
      → optional Provider Projection → Production Plan → Review / Repair
```

Routes may be skipped, but dependencies do not run backward. World laws are not style; story causality is not camera direction; identity is not appearance or representation; physical light is not color grading; prompt wording is not canon; provider flags cannot mutate Prompt Canon; a production plan is not execution; a review requires actual evidence; and a repair changes one owning variable while preserving passing dimensions.

## Contracts and compatibility

There are three non-competing machine authorities:

- [`contracts.json`](skills/cineweave-director/contracts.json) owns route IDs, route reference baselines, root kinds, and output ownership.
- [`reference-lifecycle.json`](skills/cineweave-director/reference-lifecycle.json) owns the distributable knowledge allowlist and typed load contexts.
- [`resources/contracts/index.json`](skills/cineweave-director/resources/contracts/index.json) owns the schema/example inventory, domains, and raw-byte SHA-256 values.

JSON Schema defines the structural wire shape, including each artifact's `contractVersion`. `validate-output.mjs` additionally enforces release-local semantic truth for route ownership, dependency and deliverable closure, evidence-bound review decisions, and non-execution claims; WorkflowPlan validation resolves `contracts.json` from the same Skill directory rather than borrowing authority from another checkout, without equating the Skill release version to the artifact wire version.

`SKILL.md` is the human activation and routing entry point; it does not redefine those machine inventories. The plugin/Skill distribution version is `3.0.0`. Individual artifact `contractVersion` values remain at compatible 2.x wire versions where no breaking wire change was required; plugin version and artifact wire version are intentionally independent.

## Development

Node.js 22 or newer is required. The repository is a private, dependency-free development harness and has no install step. CI invokes the concrete entrypoints below rather than mutable package aliases:

```powershell
node --test tests/canonical-json.test.mjs tests/validate-output.test.mjs tests/build-plugin-bundle.test.mjs
node scripts/generate-contract-index.mjs --check
node scripts/validate-repository.mjs
node scripts/build-plugin-bundle.mjs
node scripts/validate-repository.mjs --bundle .build/cineweave-director
```

The equivalent `npm` scripts remain convenience aliases, and repository validation requires their commands to match these entrypoints exactly.

- The tests check strict JSON/JCS and schema-validation primitives.
- Source validation checks plugin identity, frontmatter/agent metadata, exact scripts and CI entrypoints, route/lifecycle authority, typed load contexts, fail-closed schema keywords and formats, confined local `$ref` closure, semantic workflow/review invariants, raw-byte hashes, receipt identity, all 52 canonical examples, clean source boundaries, and the dynamically derived distribution inventory.
- The build creates `.build/cineweave-director/` by copying only the lifecycle/index-derived allowlist. The current v3 inventory is 136 regular files; the builder does not hardcode that count.
- Bundle validation rejects missing, changed, linked, case-colliding, traversing, or extra files and proves source/bundle byte equality.

Regenerate the contract index only after intentional contract changes:

```powershell
node scripts/generate-contract-index.mjs
node scripts/generate-contract-index.mjs --check
```

## Repository layout

```text
.codex-plugin/plugin.json           Codex plugin metadata
skills/cineweave-director/          complete distributable Skill
  SKILL.md                           creator-intent routing and hard boundaries
  contracts.json                    12 routes and 52 root kinds
  reference-lifecycle.json          typed 23-file knowledge allowlist
  references/                       core, routed and optional knowledge
  resources/contracts/              54 schemas, 52 examples and hash index
scripts/                             dependency-free validation/build tooling
tests/                               validation primitive tests
assets/                              repository branding; not bundled
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before changing routes, contracts, references, or provider dialects, and [SECURITY.md](SECURITY.md) for reporting and trust boundaries.

## License

[MIT](LICENSE) © Wilder1222.
