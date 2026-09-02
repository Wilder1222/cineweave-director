# Capability Resolution

`capability_resolve` is the explainable planning step between declared production requirements and an exact execution request. It compares one or more exact `CapabilityProfile`/`AdapterDescriptor` pairs; it does not call a provider, select a hidden default, spend credits, write media or mutate Canon.

## Required inputs

- an operation ID, render mode, execution mode and media kind;
- exact input/output counts and accepted MIME types;
- typed requirements with `hard`, `soft` or `advisory` levels and a reason;
- an exact, active CapabilityProfile and an exact, active AdapterDescriptor for every candidate;
- an AdapterDescriptor whose `capabilityProfileRef` matches the candidate profile exactly.

The resolver also checks the descriptor operation surface: operation ID, execution mode, render mode, media kind, input/output limits and output MIME types. Missing or unknown facts stay visible; they are not inferred from a provider name, prompt, endpoint or the latest registered version.

## Decision rules

Hard requirements and operation mismatches block a candidate. Strong support passes; partial or experimental support is reviewable; unsupported or unknown hard support fails. Soft and advisory gaps lower the score or produce a warning, but never override a hard failure. Ranking is deterministic: weighted support score first, then stable adapter and candidate identifiers. The plan must explain the primary decision, hard constraints, tradeoffs and exact fallback candidate IDs.

`selected` means an eligible candidate is ranked first, not that a provider has been approved. If no candidate is eligible, return `needs_review` or `blocked` with no selected refs. Every selected or fallback ref must retain its exact version and content hash.

## Handoff boundary

The output is a `CapabilityResolutionPlan` for the later `execution_preview` route. Keep provider-neutral capability language in the contract. Do not include endpoints, credentials, vendor prompt syntax or executable commands. Human approval is still required by the later exact `ExecutionRequest` gate.
