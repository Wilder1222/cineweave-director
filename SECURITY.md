# Security Policy

## Supported versions

Security fixes are applied to the latest released CineWeave Director version. Older development snapshots and the retired CineWeave Studio/runtime line are not supported after a replacement release is available.

## Reporting

Report suspected credential exposure, path traversal, unsafe plugin packaging, rights-gate bypasses, prompt-projection boundary violations, or artifact-integrity failures privately to wangwilder1222@gmail.com. Do not include private media, API keys, signed URLs, personal data, provider job data, or proprietary prompts in a public issue.

Include the affected version, reproduction steps, expected boundary, and the smallest non-sensitive fixture that demonstrates the problem. The maintainer will confirm receipt, assess severity, and coordinate disclosure before a public fix note is published.

## Execution boundary

CineWeave Director produces text and JSON creative artifacts. It does not call providers, install or load models, run adapters, ingest media bytes, execute production plans, publish, approve, or grant credentials. Any external implementation is a separate, explicitly authorized human/tool workflow and must not be inferred from a projection, plan, capability profile, or submission screen.

Never place secrets, private locators, expiring URLs, or credential values in a contract, prompt, reference note, issue, or projection. `PromptProjectionPlan` uses human-resolved locator placeholders and requests exact returned metadata only after external execution. Unknown provider capability, compatibility, license scope, likeness consent, or publication rights remains blocking rather than defaulting to allowed.

## Reference and rights boundary

A `ReferenceAsset` or content hash records declared identity and provenance state; it is not a malware scan, authorship proof, license grant, likeness consent, or content-safety decision. Visible observations, user declarations, inference, and unknowns must remain distinguishable. Review untrusted media and metadata with separately maintained security tools before external transfer or decoding.

SHA-256 establishes byte identity only. Content Credentials/C2PA validation, signer trust, copyright, license scope, training permission, publication, and redistribution are separate decisions requiring their own evidence and approval.

## Distribution integrity

The release inventory is derived from the plugin metadata, `reference-lifecycle.json`, and `resources/contracts/index.json`. The current v3 closure contains 136 regular files: plugin metadata, `LICENSE`, and the self-contained Skill inventory. Validation rejects symbolic links, junctions, traversal, case collisions, unresolved/local-escape schema refs, stale hashes, missing files, unexpected files, and source/bundle byte differences.

The bundle intentionally excludes development scripts, tests, repository documentation, marketplace metadata, branding assets, local state, credentials, and generated media. The builder may replace only one guarded direct child directory of the real `.build` directory; it refuses linked output paths and nested output paths.

A valid bundle hash proves only that its bytes match this source checkout. It does not authenticate the repository owner or release signer; use an immutable release tag and a separate trusted signature channel when sender authenticity is required.
