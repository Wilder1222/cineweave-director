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
  <img alt="Version 3.1.0" src="https://img.shields.io/badge/version-3.1.0-14B8A6?style=flat-square">
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

The Skill loads only the routes needed by the request. Original design may advance through labeled exploration and draft choices within delegated scope. Existing-asset facts, rights and hard capabilities stay unresolved until supported; proposals never silently become approved Canon.

## Creator intents

Creators do not need to know the 12 route IDs or 52 contract kinds. The Skill maps natural requests such as “build a complete character asset family”, “analyze only this costume reference”, “design this shot”, “create a storyboard”, “compile a Midjourney prompt”, or “review this candidate” to the smallest route set. These creator intents are thin routing shortcuts inside the same Skill—not commands, additional Skills, or execution endpoints.

The default uses the existing `professional` interaction depth with a **professional-lite presentation profile**: retain exact authority, evidence, locks, and human gates, but present a concise human-readable artifact and one next action. `professional-lite` is not a fifth `inputMode`, route, or contract value. Canonical JSON is emitted only when requested or when an existing contract workflow requires it.

## Directing and cinematography craft

The [film-craft learning map](skills/cineweave-director/references/optional/film-craft-study.md), researched on 2026-09-08, connects public AFI, NFTS, La Fémis, FTII, Weston, ARRI, and practitioner material to three optional decision guides:

- [Directing](skills/cineweave-director/references/optional/directing-craft.md): audience knowledge, playable performance, relational blocking, held shots versus coverage, and purposeful omission.
- [Cinematography](skills/cineweave-director/references/optional/cinematography-craft.md): viewpoint versus focal length, source geometry, contrast/material response, motivated motion, and shot matching.
- [Editing and sound](skills/cineweave-director/references/optional/editing-sound-craft.md): cut motivation, perceptual rhythm, listening perspective, sound bridges, and selective layers.

Each craft guide supplies conditions, tradeoffs, failure signals, and review checks. The learning map distinguishes consulted text from course previews and unavailable media, and includes eight behavioral evaluation cases. They have not been independently benchmarked; release validation proves packaging and contract consistency, not artistic mastery. No new contract kind, provider execution, or paid-course content is introduced.

### Automatic technique adaptation, one consistent look

The [master-inspired method library](skills/cineweave-director/references/optional/master-style-presets.md) covers Hitchcock, Kurosawa, Wong Kar-wai, Anderson/Yeoman, Cuarón/Lubezki, Deakins, Martel, and Varda. During creative shot/sequence design, the Skill automatically matches methods to dramatic purpose, audience knowledge, relationships, space, medium, and constraints. No creator name, preset switch, or strength setting is required. It selects compatible techniques by dimension, resolves competing inferred choices, and returns the actual direction with a brief rationale. No suitable match is valid; explicit user choices and exclusions take precedence.

Techniques may mix; the visual treatment remains coherent. Every shot inherits [one shared look baseline](skills/cineweave-director/references/core/visual-bible-and-continuity.md): palette, grading intent, color-temperature relationships, contrast/rolloff, skin/material rendering, grain/optical texture, and aspect ratio. A new master influence never silently changes the grade. If no baseline is supplied, the Skill proposes one shared provisional draft rather than styling each shot independently. Exact translation/compilation, browsing, review, and single-variable repair retain their original scope. Twelve manual evaluation cases cover automatic matching, abstention, overrides, continuity, and visual consistency; they are not independently verified model benchmarks.

```text
用 $cineweave-director。三人告别，一人想挽留却只谈归还雨伞。
按场景自动选择适合的调度、构图和节奏，手法可以混用，
但全段沿用已有的统一调色、材质表现和画幅，不改变人物、服装或场景设定。
```

```text
用 $cineweave-director。三人在桌旁谈事，最安静的人最后取得主导。
不使用特写或低角度，也不改变房间布局。给出一个调度方案和一个有意义的备选，
说明观众如何看出关系变化、各自代价，以及看样片时应检查什么。
```

## Install in Codex

Install an immutable release rather than a moving branch. This repository includes a single-entry [marketplace manifest](.agents/plugins/marketplace.json) following the [Codex plugin packaging guidance](https://developers.openai.com/codex/plugins/build/):

```bash
codex plugin marketplace add Wilder1222/cineweave-director --ref v3.1.0
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

The time-bounded [Midjourney projection guide](skills/cineweave-director/references/optional/midjourney-projection.md) was verified on 2026-09-02 against official Midjourney documentation and selected GitHub implementations. It does not automate a browser or provider API. A copy-ready prompt is still only a plan; execution verification requires accessible original files and exact job metadata. Bounded visual review can proceed from accessible images with missing metadata explicitly unknown.

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

ShotCompilerPlan validation also resolves that local ownership authority and checks parameter/control agreement, declared exact dependencies, and trace-to-handoff consistency. Capability planning rejects unresolved hard requirements marked eligible and invalid fallback IDs. These checks validate the supplied document's consistency; verifying external manifest, registry, or capability evidence still requires the exact source artifacts.

`SKILL.md` is the human activation and routing entry point; it does not redefine those machine inventories. The plugin/Skill distribution version is `3.1.0`. Individual artifact `contractVersion` values remain at compatible 2.x wire versions where no breaking wire change was required; plugin version and artifact wire version are intentionally independent.

## Drafts, revisions, and evaluation

The working tree adds explicit exploration, draft, and final maturity without changing contract status enums. A request to develop a concept authorizes reversible creative drafting; final authority and external actions keep their own boundaries. Non-canonical working JSON can preserve unresolved metadata without fabricated hashes or receipts.

- [Draft and change impact](skills/cineweave-director/references/optional/drafts-and-change-impact.md): promotion, selective invalidation, and restart checkpoints.
- [Video, sound and delivery](skills/cineweave-director/references/optional/video-sound-and-delivery.md): temporal handoff, cues, delivery variants and iteration limits.
- [Worked workflow and evaluation](skills/cineweave-director/references/optional/creative-workflow-evaluation.md): three shots from character to repair, plus eight fresh-task cases and scoring. These are evaluation materials, not claims of completed model/media tests.

These additions are included in the `v3.1.0` release.

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
- The build creates `.build/cineweave-director/` by copying only the lifecycle/index-derived allowlist. The current source inventory is 144 regular files; the builder does not hardcode that count.
- Bundle validation rejects missing, changed, linked, case-colliding, traversing, or extra files and proves source/bundle byte equality.

RepairPlan validation rejects contradictory approval, malformed target pointers and duplicate check IDs. For optional cross-artifact checks:

```powershell
node scripts/validate-output.mjs path/to/repair-plan.schema.json path/to/repair.json --artifacts path/to/registry.json
```

The supplied registry is an array of `{ "ref": { "kind", "id", "version", "contentHash" }, "document": { ... } }` bindings (notation only; fill real values). The validator checks exact binding equality, JCS UTF-8 SHA-256, source review ID/version and finding/domain, and target JSON-pointer existence. It never fetches media. Registry identity authority, upstream target relationships, and visual preservation may remain `unverified`. `valid: true` means the implemented checks passed, not that production or all evidence passed. Source/target documents should also be validated against their own schemas. Missing bindings remain unverified rather than being fabricated; the CLI returns these limitations explicitly. Distribution hashes continue to use raw bytes.

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
  reference-lifecycle.json          typed 31-file knowledge allowlist
  references/                       core, routed and optional knowledge
  resources/contracts/              54 schemas, 52 examples and hash index
scripts/                             dependency-free validation/build tooling
tests/                               validation primitive tests
assets/                              repository branding; not bundled
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before changing routes, contracts, references, or provider dialects, and [SECURITY.md](SECURITY.md) for reporting and trust boundaries.

## License

[MIT](LICENSE) © Wilder1222.
