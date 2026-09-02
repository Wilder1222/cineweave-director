# Contract-aware repair runner

Use the repair runner only after a review has produced one exact `DirectorRepair`, `CharacterRepair`, `SceneRepair` or `PromptRepair` artifact. The runner is a narrow Production-owned bridge from an approved repair plan to a reviewable next-version contract candidate; it is not a provider executor, media editor or automatic acceptance service.

## Required preflight

1. Store the repair plan in the immutable ArtifactStore and pass its exact `kind`/`id`/`version`/`contentHash` reference to `runRepair`.
2. Require the plan's own execution gate to be `approved` when that plan defines an embedded gate, and require the latest ArtifactStore ApprovalRecord to approve the same exact repair-plan reference. A missing or rejected decision remains blocked.
3. Register a local adapter with `createRepairAdapterRegistry`. It must declare a stable implementation hash, `networkAccess: false`, `writesMedia: false`, `mutatesParent: false` and `providerNeutral: true`. It receives only frozen plan/parent JSON, the exact parent reference and the expected next version; it does not receive project paths, credentials, endpoints or a provider client. Its second argument is `{ signal }`, and it must stop cooperatively when that signal aborts.
4. Do not execute a Director delegation. Delegation is a routing result for the owning Skill and produces a blocked receipt if passed to this runner.

## Execution budget and cancellation

Call `runRepair(projectRoot, repairRef, registry, options)` with an optional `timeoutMs` integer from 1 through 300000 and an optional caller `AbortSignal` in `options.signal`. The default adapter budget is 30000 milliseconds. This budget covers the adapter call after authorization and target preflight; canonical validation and receipt persistence remain deterministic runtime work outside the adapter budget.

The runner creates a private `AbortSignal` for the adapter. A pre-aborted caller signal prevents invocation; an in-flight caller abort or timeout aborts the private signal, stops awaiting the adapter and writes a schema-valid `failed` receipt. Timeouts use `repair.adapter_timeout` and remain retryable; caller cancellation uses `repair.adapter_cancelled` and is not retryable. Adapter exceptions use `repair.adapter_failed`, while an invalid envelope or non-JSON payload uses `repair.adapter_output`. Error messages, stacks, paths, URLs, payload fragments and caller abort reasons are never copied into the receipt.

Cancellation is cooperative because adapters are trusted in-process JavaScript. An adapter that ignores its signal cannot be forcibly interrupted if it blocks the event loop, although the runner stops awaiting an asynchronous non-cooperative adapter once the timer can fire. Core adapters must observe the signal and release their own resources.

`timeoutMs` and `signal` are execution controls, not repair identity. The stable run fingerprint remains the exact plan, approval and adapter implementation; the first immutable receipt for that fingerprint wins even if a later call supplies a different timeout. Within one runtime host, calls for the same project, exact repair reference and requested adapter ID are queued through the complete preflight/adapter/candidate/receipt sequence, so the adapter runs once for one fingerprint and followers return the same receipt. The first queue owner controls timeout and cancellation; an already-aborted follower cannot cancel that owner. Retry a timed-out or cancelled run only with a new exact repair-plan version/approval or a new adapter implementation hash.

The in-process registry defines a single-host execution boundary. One supervisor must own repair execution for a writable project store; separate Node processes must not concurrently run repairs against the same project. The immutable store still detects version conflicts, but this conformance kit does not claim a cross-process lease or multi-file crash transaction.

## Candidate boundary

The adapter may return only `{ "payload": candidate }`. The envelope must have exactly that one enumerable data property, and the payload must be a canonicalizable plain JSON object: null, primitives, arrays, extra/hidden/symbol keys, accessor properties, Proxy reflection traps, cycles, `BigInt` and non-finite numbers fail before candidate validation. Reflection, accessor and cloning failures are normalized to the fixed `repair.adapter_output` receipt without copying adapter error details. A well-formed candidate must retain the target kind and identity, use the next immutable version, retain the target contract version, preserve the exact dependency-reference set and change at least one substantive path under the plan's requested target path. `version` and `provenance` metadata are ignored for the one-path comparison; every other changed path is bounded by the requested path.

The runner validates the plan and candidate against the canonical schema and semantic validators before persisting anything. It writes the candidate as a new `candidate` artifact and never overwrites the parent. It then writes a `RepairRunReceipt` that binds the exact plan approval, before/after refs, preserved dependencies, changed paths, adapter identity, validation flags and a pending acceptance checklist.

## Boundary and handoff

`RepairRunReceipt.status` is `awaiting_review` only after a candidate is persisted. It is `blocked` for missing authorization, delegation, missing targets or unavailable adapters, and `failed` for timeout, cancellation, adapter fault, malformed output, candidate-validation or version-conflict failures. All statuses set `acceptance.status` to `pending` and `humanReviewRequired` to `true`. The runner does not call a network, write source or derived media, mutate a parent artifact, approve assets or claim that the repair passed.

The runtime entry point is the host's `runRepair` API from the `cineweave-runtime` package. The output contract is [RepairRunReceipt schema](../../../packages/cineweave-contracts/schemas/repair-run-receipt.schema.json).
