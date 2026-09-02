# Behavior evaluations

`cases.json` tests Skill activation and contract ownership, not just file validity. It includes direct, indirect, incomplete, negative and edge requests.

Validate definitions:

```powershell
node scripts/run-behavior-evals.mjs --validate
```

Grade captured results:

```powershell
node scripts/run-behavior-evals.mjs --grade path\to\results
```

Each result is `<case-id>.json` with:

```json
{
  "caseId": "prompt.direct.general-image",
  "activatedSkills": ["cineweave-prompt"],
  "route": "prompt_design",
  "contractKinds": ["cineweave_codex_prompt_record"],
  "behaviorAssertionsPassed": [
    "works outside cinematic content",
    "uses observable light and material relations"
  ],
  "claims": []
}
```

The grader checks declared activation, route, output ownership, forbidden output and assertion coverage. Human or model-based evaluation remains responsible for semantic quality of the actual prose or JSON payload.

## Live Codex smoke evaluations

`live-cases.json` adds synthetic, representative requests for all nine Skills
plus a should-not-activate case. Unlike `cases.json`, the live harness captures
the model's complete schema-constrained final response, hashes it and evaluates
activation, route, contract choice, observable output requirements and safety
rules with deterministic checks. Every declared contract also needs an inline
payload: the runner derives unique evidence kinds from `payloads`, requires
them to match `contractKinds` in first-seen order, then validates manifest ownership, JSON
Schema and the available contract semantics. Prose alone never proves that a
contract was emitted.

Validate definitions and committed replay fixtures without a model call:

```powershell
npm run evals:live -- --validate
npm run evals:live -- --grade tests/fixtures/live-responses
```

Inspect the exact case plan, Codex CLI and installed candidate version without a
model call:

```powershell
npm run evals:live -- --plan --case live.prompt.observable-product --model <model>
```

Live runs are never part of the default release gate and require explicit cost
acknowledgement, an explicit model and an output directory. They use an
ephemeral Codex task, a read-only sandbox and synthetic text only:

```powershell
npm run evals:live -- --run --acknowledge-model-costs --model <model> --out-dir .cineweave-evals/run
```

Live mode refuses to start unless the installed, enabled plugin version matches
the source plugin and a Git installation is pinned to the corresponding
immutable `v<version>` tag. This prevents a V2.3 run record from silently
measuring an older cached plugin.

Raw events and responses stay in the ignored local output directory. The
portable `cineweave_skill_evaluation_run` keeps response hashes, deterministic
check results and reproducibility metadata; it never includes user uploads.
