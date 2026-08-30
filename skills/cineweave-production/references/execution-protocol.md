# Adapter execution protocol

Load this reference only for `adapter_descriptor`, `execution_request` or
`execution_receipt`.

## Boundary

Creative Skills describe facts, representation, direction and prompts. The
Production Skill authors execution intent. Only the deterministic runtime may
invoke a registered adapter. An adapter implementation is selected from a
trusted in-process registry; a contract can never supply a command, module path,
endpoint, signed URL or credential value.

```text
CapabilityProfile
      +
AdapterDescriptor
      +
optional WorkflowTemplateProfile
      +
exact RenderPlan and Prompt refs
      ↓
ExecutionRequest artifact
      ↓
exact-request approval when mode = external
      ↓
registered adapter runtime
      ↓
verified output hashes + ExecutionReceipt artifact
```

## Descriptor rules

- `AdapterDescriptor` says which operations, modes, MIME types and limits are
  supported and binds one exact CapabilityProfile.
- `WorkflowTemplateProfile` says which exact serialized graph/template,
  dependencies and typed slots are selected when a graph-level handoff matters;
  it never embeds a provider endpoint or node JSON in the request.
- `implementation.entrypointId` is a registry identifier, never a file path.
- `implementation.contentHash` is verified against the registered adapter.
- `semanticEmphasis` records only which canonical levels (`required`, `strong`, `supporting`) the adapter accepts and whether it can preserve ordering or translate them natively. It never stores provider-specific prompt syntax, numeric weights or a hidden conversion table.
- Environment-variable names may identify required credentials; values never
  enter contracts, logs or receipts.
- Network is `forbidden` or `external_mode_only`. The core fixture adapter is
  network-free and zero-cost.

## Request rules

- Store the request immutably before execution.
- Bind exact AdapterDescriptor, CapabilityProfile, RenderPlan and Prompt refs.
- When a graph/template is selected, bind the exact WorkflowTemplateProfile,
  serialized graph hash and slot-to-artifact mappings. The runtime checks them
  before it invokes a registered adapter.
- Use one stable idempotency key for one intended side effect.
- `dry_run` validates and predicts no output; `fixture` produces only local,
  deterministic test media; `external` may reach a provider.
- `external` declares `exact_request_approval_required`. Runtime approval must
  match all four ref fields and content hash of that stored request.
- Budget includes every attempt. Unknown price, unresolved rights, failed hard
  capability matching, sensitive parameters or unresolved refs block.

## Receipt rules

- The runtime, not the language model, authors the receipt.
- Preserve every attempt in order, including failed or billable retries.
- Provider request IDs are optional sanitized identifiers, not URLs.
- Hash output bytes after they are written under the constrained execution
  root. Store only project-relative refs in the receipt.
- A successful status requires verified output hashes, a matched adapter and
  request, satisfied authorization policy and total cost within budget.
- A blocked or failed receipt carries a normalized failure stage and code. It
  must not claim generated media.

## Review checklist

1. Descriptor and implementation hashes match the trusted registry.
2. Operation, execution mode, input count and MIME type are supported.
3. Exact input artifacts resolve and hard capabilities and rights pass.
4. Request contains no endpoint, credential value or sensitive parameter name.
5. External execution has an approval for the exact request artifact and the
   caller explicitly enables external effects.
6. Attempt count, elapsed time and accumulated cost remain within the request.
7. Every output exists under the execution root and its bytes match the receipt.
