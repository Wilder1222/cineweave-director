# CineWeave Runtime

This package provides the deterministic local control plane used by CineWeave
Studio contracts. Core ships no image/video provider or credential; execution
is possible only through a trusted registered adapter.

The runtime owns mechanical operations that Skills must not improvise:

- RFC 8785-compatible JSON canonicalization and `sha256:` content hashes;
- immutable artifact envelopes keyed by exact `kind`, `id`, `version` and hash;
- human approval records bound to one exact artifact reference;
- dependency and dependent closure queries with missing, hash-mismatched and
  superseded-reference detection;
- exact approval gates with optional current-version and dependency-approval
  policies;
- byte-verified, path-scoped project bundle export, verification and import;
- bounded content-addressed reference-media ingestion and exact blob
  verification;
- deterministic SVG board assembly with per-tile provenance;
- trusted in-process adapter registration with implementation-hash matching;
- idempotent execution, exact-request authorization, constrained output writes
  and immutable execution receipts.
- contract-aware one-variable repair runs with exact dual approval, frozen
  local adapter inputs, immutable parent/dependency checks, bounded candidate
  diffs and review-pending `RepairRunReceipt` records.
- provider-neutral Atomic Cinematic Skill discovery and deterministic Shot
  Compiler plans that resolve exact bindings, project creator controls and
  prepare owner Skill handoffs without generating media, writing files or
  selecting a provider.

Project data lives under `<project>/.cineweave/`. Generated project stores are
local working data and should not be committed unless the user explicitly wants
to publish a sanitized fixture.

```powershell
node packages/cineweave-runtime/bin/cineweave.mjs init . --id demo --name "Demo"
node packages/cineweave-runtime/bin/cineweave.mjs put . brief.json --id brief.demo --version 1
node packages/cineweave-runtime/bin/cineweave.mjs verify .
node packages/cineweave-runtime/bin/cineweave.mjs graph .
node packages/cineweave-runtime/bin/cineweave.mjs stale .
node packages/cineweave-runtime/bin/cineweave.mjs gate . artifact-envelope.json --require-current
node packages/cineweave-runtime/bin/cineweave.mjs reference-ingest . portrait.png --source-class user_upload
node packages/cineweave-runtime/bin/cineweave.mjs reference-verify . reference-asset-envelope.json
node packages/cineweave-runtime/bin/cineweave.mjs cinematic-skills packages/cineweave-contracts/examples/cinematic-skill-manifest.json
node packages/cineweave-runtime/bin/cineweave.mjs shot-compile packages/cineweave-contracts/examples/cinematic-skill-manifest.json invocation.json --alias-registry packages/cineweave-contracts/examples/asset-alias-registry.json
node packages/cineweave-runtime/bin/cineweave.mjs capability-resolve capability-request.json candidates.json
node packages/cineweave-runtime/bin/cineweave.mjs execution-preview execution-request.json capability-resolution-plan.json adapter-descriptor.json capability-profile.json --estimated-amount 0
```

`graph` returns the strict `cineweave_artifact_graph` contract. By default an
approved old artifact remains usable and emits a warning; `--require-current`
turns a superseded root or dependency into a blocking reason.

Reference ingestion accepts only allow-listed PNG, JPEG, WebP, MP4/M4V, MOV
and WebM files whose extension matches a bounded signature/container probe.
Images are dimension-bounded; all media is size-bounded and stored under a
SHA-256-derived, non-executable blob path. The semantic asset does not retain
the source path or original filename. This is not decoding, malware scanning,
Content Credentials validation or a grant of copyright/likeness rights;
embedded metadata remains uninspected until a separate privacy review.

Project transfer uses a directory instead of arbitrary archive extraction:

```powershell
node packages/cineweave-runtime/bin/cineweave.mjs export . ../project-transfer
node packages/cineweave-runtime/bin/cineweave.mjs bundle-verify ../project-transfer
node packages/cineweave-runtime/bin/cineweave.mjs import ../project-transfer ../restored-project
```

Every regular store file—including V2.4 reference blobs—is listed by safe
relative path, category, byte length and SHA-256 digest in
`cineweave-bundle.json`. Symbolic links, unknown store
paths, unlisted files, duplicate paths, traversal syntax, changed bytes and an
existing target `.cineweave` store are rejected. Successful import stages and
verifies the complete store before one rename. The manifest explicitly does not
grant redistribution or rights approval.

The core package registers only a deterministic, zero-cost, no-network SVG
fixture adapter. `adapters` prints its entrypoint ID and implementation hash.
`execute` accepts a stored ExecutionRequest envelope and never enables external
effects. Provider adapters must be supplied by a separate trusted extension and
must still pass an exact request approval to use external mode.

`cinematic-skills` lists the exact versioned Atomic Cinematic Skills in a
manifest. `shot-compile` accepts an invocation JSON and prints a
`ShotCompilerPlan`; it is deliberately read-only. The invocation must include
the manifest's exact content reference, exact upstream/binding references and
typed parameter values. If an alias is used, pass the exact immutable
`AssetAliasRegistry` payload with `--alias-registry`. The command never resolves
`latest`, generates media, selects a provider or writes a project artifact.

`capability-resolve` accepts one request and a JSON array (or
`{ "candidates": [...] }`) of exact CapabilityProfile/AdapterDescriptor pairs.
It produces a deterministic `CapabilityResolutionPlan` with hard/soft/advisory
results, candidate scores, fallbacks and an explanation. Partial, experimental
or unknown support remains visible and never silently becomes strong support.

`execution-preview` binds exact request, resolution, adapter and capability
payloads, then prints an `ExecutionPreview`. `--estimated-amount` is required
so an unknown cost cannot pass the preview; an exact approval remains pending.
The command never calls an adapter or writes a project artifact.

Repair adapters are a separate local-only surface. Register one with
`createRepairAdapterRegistry` from `src/repair-runtime.mjs` and call
`runRepair` with the exact stored repair-plan reference. The adapter receives
frozen JSON plus an expected next version and, as its second argument, a private
`AbortSignal`; it receives no project path, endpoint or credential and cannot
write source/derived media or mutate the parent. `timeoutMs` defaults to 30000
and accepts integers through 300000, while `signal` lets the caller cancel an
in-flight call. Timeout, cancellation, malformed envelopes/non-JSON payloads,
accessor/Proxy reflection traps and synchronous or asynchronous adapter faults
produce immutable failed receipts without a candidate. These execution
controls do not change the stable plan/approval/adapter run identity. Calls for
the same project, exact repair and adapter ID are serialized within one runtime
host; the first owner controls timeout/cancellation and all followers return the
same immutable receipt. A single host must own repair execution for each
writable project because core does not claim a cross-process lease or
multi-file crash transaction.

```powershell
node packages/cineweave-runtime/bin/cineweave.mjs adapters
node packages/cineweave-runtime/bin/cineweave.mjs execute . execution-request-envelope.json
```

Board assembly accepts a manifest whose tiles point to independently generated
PNG, JPEG, WebP or SVG files. It embeds those files into one SVG and emits a
sidecar provenance record.

```powershell
node packages/cineweave-runtime/bin/assemble-board.mjs --manifest board.json --out board.svg
```
