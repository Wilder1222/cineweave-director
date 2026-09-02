# Execution Preview

`execution_preview` is the approval-before-spend gate. It binds one exact `ExecutionRequest` to one exact `CapabilityResolutionPlan`, `AdapterDescriptor` and `CapabilityProfile`, then makes the request's operation, controls, budget, cost, retries and risks readable before any adapter invocation.

## Preview rules

- Resolve exact request and resolution-plan refs against their payload hashes; the selected adapter/profile must match the request and descriptor binding.
- Show exact or bounded cost when the adapter can provide it. If cost is unknown, show `unknown` and keep the declared `unknownCostAction: block`; never turn an unknown estimate into zero.
- Compare the estimate with `budget.maxAmount`; include every allowed attempt in the cost view and surface retry accounting.
- Keep hard capability status, unresolved evidence/rights, operation support and fallback information visible.
- External mode always retains `approval.status: pending` and `action: approve_exact_request`; the preview cannot approve the request.

The status is `ready` only when hard preflight, capability selection and budget checks pass. Any unknown or over-budget cost, unresolved hard capability, blocked resolution or exact-ref mismatch is `blocked`; a pending external approval is `needs_review` when all other gates pass.

## Safety boundary

The preview is provider-neutral and projection-only. It does not call an adapter, contact a network, spend credits, write files or media, mutate Canon, or claim that an output exists. Only a subsequent runtime execution path may produce an `ExecutionReceipt`, and that path must re-check the exact approved request.
