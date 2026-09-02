# Route: reference_evidence

Use when the user supplies images/video, asks for reference analysis, needs scoped transfer rules, or uses an `@Asset` alias. Always load `../core/reference-evidence-and-rights.md`.

## Procedure

1. Confirm that the media is actually accessible and state the intended use.
2. Create or accept an exact `ReferenceAsset` identity without exposing private locators.
3. Decompose only visible evidence into atomic observations.
4. Mark each claim `visible`, `declared`, `inferred`, or `unknown` with confidence.
5. Identify contamination: depicted identity, costume, logos, text, location, composition, style, crop, retouching, or uncertain metadata.
6. Review suitability for the requested target and rights scope.
7. Create `ReferenceBindingSet` only after the exact target artifact exists.

For portraits, separate face identity, body identity, morphology, current skin/material state, makeup, hair, costume, expression, pose, capture, lighting, composition, and representation. Stable identity may feed Character; current styling feeds AppearanceState; representation feeds Style; viewpoint feeds Direction.

For source-to-target work record preserve, replace, exclude, allowed transforms, unresolved decisions, and acceptance evidence. “Use this image” is not a transfer policy.

## Alias rules

An alias must resolve through the exact supplied `AssetAliasRegistry`, including its scope, version, and content hash. Never infer a global alias, normalize to a different asset, or choose a newest candidate.

## Provider projection bindings

A provider projection may use a reference only through an exact `ReferenceObservation` ref with one typed role, preserve list, exclusion list, and human-resolved external locator placeholder. Account profiles, moodboards, and provider style codes are projection state rather than visual evidence. A submitted provider locator or code does not prove the output preserved the intended role.

## Quality gate

- one primary role per observation;
- source and selector exact;
- visible facts separated from inference;
- transfer and exclusions disjoint;
- identity/geography contamination blocked;
- rights remain purpose-specific;
- no inaccessible media is described as observed.

Outputs: `ReferenceAsset`, `ReferenceObservation`, `ReferenceBindingSet`, `AssetAliasRegistry`.
