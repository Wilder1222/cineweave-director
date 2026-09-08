# Route: review_repair

Use to define evidence-based benchmarks, review an actual creative artifact or candidate, classify failure, or plan the smallest correction. Load the relevant domain route as well.

## Benchmarks

`ControlBenchmark` defines cases, dimensions, severity, required evidence, and pass criteria before observation. `ControlBenchmarkReview` records the results only when the required evidence is actually accessible. A planned benchmark with no observed evidence remains planned; unknown is never pass.

Prefer the unified `CreativeReview` when one actual candidate must be reviewed across multiple creative domains. Benchmarks and reviews do not execute production work or manufacture evidence.

## Review

A completed review requires actual accessible evidence. A prompt, projection plan, copy-ready handoff, submission screen, description, or intended result is not observed media. For execution reproducibility or provider compliance claims, require exact returned job metadata, resolved prompt/parameters/codes, variant mapping, and original files. Missing metadata does not prevent bounded review of accessible pixels: complete only the declared visual scope and leave provenance, parameters, rights, and unobservable dimensions unknown. For each dimension record:

- exact target;
- expected observable result;
- observed result;
- evidence basis and confidence;
- status: pass, warn, fail, unknown, or not applicable;
- severity: advisory, important, or blocking;
- owning domain;
- smallest repair variable for warn/fail.

`unknown` is not pass. A blocking failure cannot be averaged away by overall aesthetics. Separate policy/technical qualification from user preference. Do not score beauty, attractiveness, or biometric identity.

Use one `CreativeReview` across domains. Relevant dimensions include world/canon, story causality, identity, appearance, performance, geography, contact, physical light, representation, action, camera, coverage, prompt contradiction, rights, and production feasibility.

## Repair routing

For evaluating directing choices or designing practice exercises read [film-craft study and evaluation](../optional/film-craft-study.md). Separate planning coherence from realized media quality. Its behavioral rubric is not a beauty score, automatic pass, or proof of mastery; apply only relevant dimensions and keep blocking failures separate.

Choose the domain that owns the failed fact:

- world laws/history/geography baseline → world;
- causality/dialogue/knowledge → story;
- identity/appearance/performance → character;
- topology/material/source light/contact → scene;
- representation grammar → style;
- evidence scope/transfer/rights claim → reference or rights;
- action mechanics/coverage → action;
- blocking/camera/shot light/time → direction;
- panel sequence/rhythm → storyboard;
- omission/contradiction/reference leakage → prompt;
- task/control/evidence/feasibility → production.

A `RepairPlan` changes one root-cause variable in one domain, preserves every passing dimension, binds the exact target and source review, defines observable acceptance checks, and stops after one revised candidate. Multiple-domain failures become ordered separate plans according to dependency direction. A root-cause change may require several downstream recompilations; record these as consequences, not unrelated repair variables. Preservation is an acceptance requirement pending new evidence, never a guarantee from a true-valued field.

The plan never mutates the target, invokes a tool, or claims success. New evidence and a new review are required before any check can pass.

Outputs: `ControlBenchmark`, `ControlBenchmarkReview`, `CreativeReview`, `RepairPlan`.
