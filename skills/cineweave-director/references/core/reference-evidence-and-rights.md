# Reference evidence and rights

Only accessible image or video content is visual evidence. A filename, inaccessible URL, prose description, prompt, metadata claim, or model guess is not visible evidence.

## Atomic observations

One observation has one primary role and one scope. If one image informs identity and lighting, create two observations. Record:

- exact source asset and selector;
- role and scope;
- evidence basis: `visible`, `declared`, `inferred`, or `unknown`;
- confidence and contamination risks;
- what to preserve, borrow, replace, and exclude;
- allowed and forbidden uses;
- rights gate.

Use roles according to the evidence being transferred, not the source subject: identity, morphology, appearance, performance, capture, composition, lighting, material, style, geography, motion, control, or validation.

A still cannot prove true focal length, aperture, camera movement, edit rhythm, or performance timing. Mark those as inferred or unknown.

## Analysis before binding

An observation may influence target design before a target exists. A formal `ReferenceBindingSet` must wait until the target artifact exists, then bind the exact target version and scope. This prevents a circular authority claim.

`@Asset` aliases are convenience labels only. Resolve them through the supplied exact `AssetAliasRegistry`; never search another scope, guess a spelling, or infer a newest version.

## Transfer policy

For each role declare:

- **preserve:** source property must survive;
- **borrow:** mechanism may influence the target;
- **replace:** source content must become target-specific content;
- **exclude:** source property must not transfer;
- **unresolved:** a decision or evidence item is still missing.

Reference authority order is not prompt sentence order. Authority determines conflict resolution; prompt order determines readable projection.

## Rights and privacy

Track copyright/license, real-person likeness and consent, provider transfer, publication, redistribution, training use, and private metadata separately. `unknown` never means allowed. Exploration permission does not imply production or redistribution permission.

A byte hash proves byte identity only. Provenance metadata or a content credential does not prove truth, authorship, copyright ownership, consent, or fitness for a specific use. Keep private paths, signed URLs, credentials, and personal metadata out of semantic artifacts.

Suitability is purpose-specific. Never average a blocking identity, geography, or rights failure into an overall pass, and never use attractiveness or beauty scores.
