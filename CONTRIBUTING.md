# Contributing to CineWeave Director

Contributions must preserve the central invariant: this repository distributes one self-contained, non-executing AIGC creative-director Skill. Story, character, scene, style, reference, direction, prompt, production, and review are internal routes, not sibling Skills or hidden agents.

## Before changing behavior

1. Identify the user goal and the smallest owning internal route.
2. Preserve one-way dependencies and domain authority; do not move facts into a downstream prompt or shot merely for convenience.
3. Keep `SKILL.md` focused on routing, boundaries, and the essential operating sequence.
4. Put durable detail in the matching `references/core`, `references/routes`, or `references/optional` document, then update `reference-lifecycle.json`.
5. When an exchange format changes, update its local schema, canonical example, `contracts.json` when applicable, and regenerate the contract index.
6. Keep Prompt Canon provider-neutral. Provider model/surface syntax is allowed only in a separate `PromptProjectionPlan` with dated official evidence, explicit compatibility checks, and a human handoff.
7. Do not add provider calls, browser automation, adapters, runtime state, product CLI commands, executable production methods, credentials, or claims of generated media.

## Contracts

- Every root kind is owned by exactly one of the 12 routes in `skills/cineweave-director/contracts.json`.
- A root schema and canonical example must agree on `kind` and `contractVersion`.
- `$ref` values must resolve within `resources/contracts/schemas`; network, absolute, and escaping refs are not allowed.
- Examples are structural fixtures. Every `skillReceipt` uses the release repository and Skill ref, but fixture IDs, hashes, rights, jobs, outputs, and approvals are never observed facts.
- Skill/plugin version and artifact wire version are independent. Do not mass-change compatible 2.x `contractVersion` values merely to match a 3.x release.
- Run `npm run contracts:index` only after contract and example bytes are final, then commit the resulting hash index with those files.

## Provider projection

A provider dialect is a replaceable projection of exact Prompt Canon—not a source of Canon. Keep model version, surface, flags, parameter ranges, reference slots, provider handles/codes, hidden defaults, and compatibility evidence in `PromptProjectionPlan`.

Time-sensitive provider guidance belongs in `references/optional` with a visible `verifiedAt`, inline links to primary sources, a revalidation condition, and clear unsupported/unknown cases. Community projects may inform structure and experiment design only; respect their licenses and do not copy unlicensed prompt corpora or media.

Projection output must stop at a copy-ready manual handoff and request exact returned metadata/files. A submission screen, prompt, seed, provider code, or capability claim is not evidence that an image exists or passed review.

## References and media

Only files listed in `reference-lifecycle.json` are distributable knowledge. Add a reference only when it has a clear load condition and does not duplicate an existing invariant.

Do not add user uploads, production stills, private documents, signed URLs, or media with unknown redistribution rights. Public binary assets require documented provenance and rights. Reference analysis must separate visible evidence, inference, user declarations, and unknowns; likeness and license decisions remain explicit human gates.

## Validation

Use Node.js 22 or newer. No dependency installation is required.

```powershell
npm test
npm run validate
npm run build
npm run validate:bundle
```

The build allowlist is derived from `reference-lifecycle.json` and `resources/contracts/index.json`; never hardcode a file count. The build must remain a byte-identical copy with no transforms, schema flattening, path rewriting, generated prompts, or hidden dependencies. A passing schema check does not replace representative fresh-task review in Codex.

The fixed base-resource allowlist also includes the optional read-only `skills/cineweave-director/scripts/check-delivery.mjs` planning helper. Keep it self-contained and free of provider calls, media generation, configuration changes, or writes. Changes to its calculation input must update the video/sound guide and regression tests together. Run it from the built bundle to verify installation independence. Evaluation records under `tests/evaluations/` are development evidence and are not distributed with the Skill.

## Changes and releases

- Keep commits focused and use an explanatory subject.
- Do not rewrite another contributor's work or public history without explicit coordination.
- Update `CHANGELOG.md` for user-visible behavior, contract, knowledge, or distribution changes.
- Treat release tags as immutable; installation documentation must pin a tag or exact commit, never a moving branch.
