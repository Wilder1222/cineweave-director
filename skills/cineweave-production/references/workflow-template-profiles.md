# Workflow Template Profiles

Use this reference for `workflow_template_profile` and for an
`ExecutionRequest.workflowTemplateBinding`.

## Why this is separate

| Artifact | Answers | Does not answer |
| --- | --- | --- |
| `CapabilityProfile` | what an adapter class can plausibly support | which exact graph/recipe was selected |
| `AdapterDescriptor` | which trusted runtime adapter and operation surface may execute | which template revision and input slots a run uses |
| `WorkflowTemplateProfile` | the selected serialized template identity, dependencies, typed inputs and outputs | an execution authorization or a generated result |
| `ExecutionRequest` | one budgeted, idempotent attempt with exact artifacts | a provider endpoint, credential, node JSON or hidden default |

This distinction is required for reusable graph systems such as ComfyUI or
Invoke-style workflows: a claim that an adapter supports image-to-video does
not identify the graph, model/node set or input mapping used by a particular
run.

## Profile procedure

1. Choose the exact adapter ID and operation ID already matched by a
   `CapabilityProfile`.
2. If the workflow is serializable, normalize the graph outside the contract,
   calculate its lowercase SHA-256 hash and record its format, template ID,
   revision and native schema version. The graph content stays in the trusted
   adapter workspace, not in a chat contract.
3. Declare every input slot: semantic purpose, media kind, whether it is
   required and accepted CineWeave artifact kinds. Declare the expected output
   slots and MIME types as well.
4. Record runtime, model, custom-node and package dependencies. `pinned` means
   a version and content hash are known; `declared` or `unknown` remains visible
   and prevents an honest claim that the graph is ready.
5. Bind all code/weight/source assets to exact `LicenseProfile` refs, record
   limits and set status `draft` until the profile is genuinely reviewed.
6. Never put an endpoint, credential value, signed URL, private absolute path,
   arbitrary command, model download URL or unreviewed node JSON into this
   contract.

## Binding an execution request

An execution-ready request may carry `workflowTemplateBinding` only after an
active profile is available. The binding contains the exact profile ref, mode,
serialized template content hash (or explicit `null` for provider-managed
workflows), each slot-to-artifact mapping and the chosen output slot.

The runtime verifies that the adapter and operation match the profile, the
serialized graph hash is unchanged, every required slot is bound through
`inputArtifactRefs`, each bound artifact kind is accepted, requested output
MIME types match, and profile license refs resolve. A mismatch blocks before
adapter invocation.

Provider-managed workflows are allowed only as an explicit weaker mode: no
serialized graph hash is claimed, re-verification remains required and the
profile must not be described as reproducible graph execution.

## Review checklist

- Template profile status is appropriate: `draft` for illustrative/unverified
  graphs; `active` only after review.
- Serialized identity has a format, ID, revision, native schema version and
  content hash.
- Slots model actual artifact handoffs rather than local paths or provider
  upload URLs.
- Dependency and license uncertainty is visible.
- The request binds the matching profile/hash and has
  `preflight.workflowTemplateResolved = true`.
- The profile does not claim a provider run, a verified output or a capability
  that the adapter has not evidenced.
