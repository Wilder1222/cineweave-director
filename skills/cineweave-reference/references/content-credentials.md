# Content Credentials inspection

Use this route to record a C2PA Content Credentials inspection for one exact
`ReferenceAsset`. It is an evidence boundary, not a media decoder, trust
verdict, rights grant or fact-check.

## Plan before claiming a result

Bind the exact ReferenceAsset ref and its asset byte hash. When no validator has
run, emit only:

- `inspectionStatus: planned`;
- `validator.executionState: not_invoked`;
- `manifestStore.inspectionState: not_inspected`;
- `result.validationState: not_checked`.

A recorded result must point to an immutable external validator report by
validator ID/version, report hash and timestamp. Do not write a report hash,
active manifest label, validation state or success/failure codes into a planned
inspection.

## C2PA-specific meaning

C2PA validation is multi-step: assertions, claim signature, hard binding,
ingredients, timestamp, credential revocation information and asset content
are distinct checks. Record them separately. A hard binding relates a manifest
to the exact asset bytes; a soft binding has a different purpose and must not
be treated as the hard binding.

Even a valid or trusted Content Credential does not decide whether media is
true, whether a copyright/license/consent claim is valid, or whether the asset
is suitable. Keep `rightsConclusion` and `truthConclusion` at
`not_determined` and hand legal policy to Production's LicenseProfile route.

## Handoff

Production may consume the exact inspection only through a planned
ContentCredentialHandoff. A later approved adapter must record any ingredient
relationship and revalidate derived output. This Reference route never embeds,
writes or removes a manifest.

## Sources

- [C2PA 2.3 validation process](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [C2PA hard and soft bindings](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [C2PA harms modelling: provenance is not truth](https://spec.c2pa.org/specifications/specifications/2.4/security/Harms_Modelling.html)
