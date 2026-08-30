# Capability matching

CapabilityProfile describes an adapter class rather than a secret endpoint. It distinguishes unsupported, experimental, partial and strong support, plus input and subject limits, evidence requirements and known failure modes.

Match every hard ControlChannel adapter requirement. Strong support may proceed to normal review. Partial or experimental support requires explicit review and must be reported in RenderPlan `capabilityMatch`. Unsupported or unknown hard requirements block. Never silently fall back from full-body identity to face-only identity, from precise garment construction to generic style, or from grounded interaction to unconstrained generation.

For open-source or graph-based adapters, also record the source revision, workflow/subgraph identity, checkpoint and custom-node dependencies, input/subject limits, supported control channels, known failure modes, license/weight status and benchmark receipt. A repository README, a workflow JSON or a model name is not execution evidence by itself. Keep these adapter facts at the Production boundary; universal creative contracts remain provider-neutral.
