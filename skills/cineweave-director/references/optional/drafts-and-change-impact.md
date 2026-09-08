# Optional: drafts and change impact

Load for unresolved working JSON, multi-turn revisions, or project recovery. These worksheets are editable creative documents, not root contracts, an automatic project store, or a runtime.

## Working drafts

An original proposal is not an unsupported claim about an existing asset. Create missing original design when requested; preserve unknown evidence, rights, and capabilities as unknown. Carry provisional assumptions into downstream drafts without calling them approved.

When canonical metadata is unavailable, return human-readable work or explicitly non-canonical JSON:

```json
{
  "format": "cineweave-working-draft",
  "canonical": false,
  "maturity": "draft",
  "workingId": "character.courier",
  "intendedContract": "CharacterSpec",
  "revision": 1,
  "assumptions": ["Original fictional adult courier proposed for this story"],
  "delegatedDecisions": ["Develop character and three-shot draft"],
  "reservedDecisions": ["Final identity selection"],
  "workingRefs": [{"workingId": "world.station", "revision": 1, "resolution": "provisional"}],
  "unresolved": ["No installation receipt supplied"],
  "content": {"silhouette": "compact build, upright posture", "wardrobe": "red coat"}
}
```

Working IDs are authored local labels, not exact registry aliases. Never put placeholder hashes, nulls, or synthetic receipts into strict canonical fields. This format is a worksheet convention; it is not accepted by the root contract validator and cannot authorize final handoff.

Promote only after required upstream choices resolve: select the existing root schema, map content into its actual fields, obtain real provenance/installation metadata, validate the document, and calculate hashes with available local tooling. A missing receipt blocks canonical promotion, not useful creative drafting. Preserve supplied hash algorithms; if unspecified, resolve the convention before exchange. The development validator's optional repair registry uses SHA-256 of JCS UTF-8; the distribution index uses raw file bytes. Do not substitute one for the other.

## Revision worksheet and checkpoint

For each relevant artifact record working ID or exact ref, maturity, owner route, consumed input fields, revision, location if actually saved, and validity (`valid`, `stale`, `needs_review`, `unresolved`). These labels belong to the worksheet, not existing contract status enums.

Record each change with:

- source revision and changed field/value;
- reason and user authorization or provisional assumption;
- directly affected artifacts and why the field is consumed;
- transitive dependents, required recompilation/review, and unaffected artifacts;
- unresolved impact when field-level dependencies are unavailable.

Propagate conservatively: direct consumers become stale; inspect descendants before marking them valid. Unknown dependency coverage becomes needs_review. A new upstream version never rewrites an already hashed parent. Final outputs must not consume stale authority. Recompile only affected slices, then record new exact refs and perform the relevant checks before restoring validity.

At a pause, include current requested outcome, artifact index, locked decisions and their sources, provisional assumptions, outstanding changes, blocked uses, and next actionable step. On resume, read the supplied checkpoint and resolve conflicting sources before proceeding; never infer a newest version or claim unsaved files exist.

## Example impact

Changing the courier's coat from red to blue changes AppearanceState, not identity. A face-only close-up with no visible coat need not be regenerated. Shots showing the coat, their prompt projections, and dependent review comparisons become stale or need review. Story causality, scene topology, and unrelated sound cues remain valid if they do not consume coat color. If a story clue depends on red, surface that conflict before treating this as an appearance-only change.

## Validation scope

Root schema validity proves wire structure. Repair-plan semantic checks also reject inconsistent gates and malformed target pointers. With a supplied exact ref/document registry the development validator checks content hashes, source finding ownership, and target-path existence. Missing bindings and media-level guarantees remain explicitly unverified. Registry bindings are caller-supplied authority; matching bytes do not establish rights, observed success, or preservation of passing dimensions.
