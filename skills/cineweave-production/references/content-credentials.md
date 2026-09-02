# Content Credentials handoff

Production consumes a Reference-owned `ContentCredentialInspection` only as a
planning input. Use `ContentCredentialHandoff` to bind it to the same exact
`ReferenceAsset` before a later external transfer, derivative or release
adapter.

The handoff must:

- remain `planned` and require an externally recorded inspection before
  transfer;
- require revalidation of any derived output;
- declare only an `ingredient_planned` source relationship;
- set manifest action to `not_performed`;
- avoid raw manifest bytes, remote manifest locations and any media write;
- keep C2PA presence separate from LicenseProfile, copyright, consent and truth
  decisions.

It is not an execution request and cannot invoke a validator, attach a
manifest, publish an asset or report a provenance result. Those operations need
their own approved adapter, exact request and immutable receipt.

## Sources

- [C2PA validation](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)
- [C2PA trust and truth boundary](https://spec.c2pa.org/specifications/specifications/2.4/security/Harms_Modelling.html)
