# Hero Frame Anchoring

Use `HeroFrameAnchor` when a creator has selected one exact still or one exact
frame and wants later motion to inherit its visual state. The anchor is a
provenance-preserving control surface, not a prompt preset and not a claim that
the frame was generated successfully.

## Contract order

```text
exact ReferenceAsset or selected MediaImport frame
  → exact ShotSpec
  → HeroFrameAnchor
  → optional TemporalSpec.heroFrameAnchorRef
  → provider-neutral adapter handoff
```

Create the ShotSpec first. The anchor is downstream so adding it cannot create a
hash cycle or force an existing shot to reference its own descendants. When the
source is a MediaImport, select a frame by an explicit frame index or time; do
not treat a whole video as one hero frame. When the source is a ReferenceAsset,
the whole asset may be the selected still.

## What the anchor records

Keep these controls independent:

- camera: projection, focal length, focus target, aperture and axis side;
- composition: layout, negative space and visual hierarchy;
- appearance: an observable performance and costume moment, backed by the
  exact ShotSpec bindings rather than inferred identity;
- scene: geography and physical-light summary, backed by the exact scene
  binding when one exists;
- inheritance: what is preserved, what may vary later and which paths require a
  new anchor.

The camera values that duplicate `ShotSpec` must agree exactly for the fields
that ShotSpec owns. A later temporal plan may add movement or focus events, but
it must not silently change the hero frame's identity, geography, axis or
selected source.

## Inheritance rules

Hard-lock at least `character_identity` and `scene_geography`. Preserve exact
CharacterBinding and SceneBinding refs. Typical allowed overrides are
`camera.motion`, `focus.timeline`, bounded secondary motion and a declared
lighting intensity response; never use an override to change a canonical face,
wardrobe identity, room layout, prop ownership or source light placement.

If the selected frame, bindings or protected visual DNA changes, create a new
anchor version. Do not overwrite the old anchor or resolve a newer asset by
alias without recording its exact id, version and canonical hash.

## Review gate

Before handing the anchor to temporal direction, verify:

- the frame source is an exact reference and rights remain whatever the source
  contract states;
- CharacterBinding and SceneBinding refs match the ShotSpec exactly;
- camera and composition are separate, provider-neutral fields;
- identity and geography cannot be overridden;
- no adapter, provider, generation result or asset approval is claimed.

The anchor can make a continuation easier to direct, but it cannot prove that a
later video model preserved the frame. Review the resulting media separately.
