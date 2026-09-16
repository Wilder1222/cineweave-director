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

For multiple references, keep a compact source/role/transfer/exclusion map before combining observations. User-assigned identity, clothing, and style roles authorize those transfers only: clothing-source face/body and style-source costume are excluded unless separately requested. Multiple roles from one image need separate scoped observations. Resolve a conflict using the user-assigned role and existing target locks; surface only consequential ambiguity that those authorities cannot resolve. If only descriptions are available, label them as declarations and deliver a provisional transfer plan without claiming to have seen the images. Test the final prompt for leaked excluded traits; the plan alone does not prove generated identity consistency.

Choose reference detail according to the decisions it must constrain. Exploratory atmosphere may remain loose; a critical handoff needs explicit pose, possession and spatial anchors. Do not lock unrelated details merely because a reference contains them. If only layout is wanted, a clean layout proxy within the authorized scope may help exclude unwanted identity or texture; a planned proxy is not an existing asset.

When successive candidates show degradation, compare them with the original before blaming iteration itself. Preserve the source chain, identify the observed change, and propose a return to the cleanest relevant authority rather than promoting a flawed descendant to canon. This condition-based use of [Leos's reference-control discussion](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/spatial-and-assets.md) does not guarantee that stronger controls or a converted reference will improve a model's output.

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
