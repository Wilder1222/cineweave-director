# Reference lifecycle

## Contents

1. Asset ingestion
2. Selectors and observations
3. Role separation
4. Rights and privacy
5. Binding and conflict resolution
6. Promotion gates

## Asset ingestion

Create one immutable ReferenceAsset for one exact byte sequence. The local runtime:

- rejects symbolic links and non-regular files;
- accepts only allow-listed extensions whose content signature agrees;
- caps images at 64 MiB and videos at 512 MiB;
- probes only bounded headers for image dimensions or a video container signature;
- writes a SHA-256-addressed non-executable blob outside any web root;
- omits the source path and original filename;
- deduplicates equal bytes without merging distinct source assertions;
- leaves C2PA, copyright, likeness and training-use status unresolved.

The original bytes may retain EXIF, XMP, IPTC or other embedded metadata. Treat `preserved_uninspected` as a privacy warning, not as proof that metadata exists. Create a sanitized derivative separately when location or identity metadata must be removed; never rewrite the immutable original.

## Selectors and observations

Use one selector per observation:

- `full_asset`: the complete image or clip;
- `spatial_rect`: normalized `x`, `y`, `width`, `height`, each within 0–1 and with the rectangle contained in the canvas;
- `temporal_range`: `startMs < endMs`, contained in known clip duration;
- `spatiotemporal_rect`: both constraints;
- `mask_asset`: an exact mask ReferenceAsset.

Selectors identify evidence; they do not crop, edit or generate media. For an image, reject temporal selectors. For a video whose duration has not been probed, keep temporal observations draft until a trusted probe supplies the bound.

## Role separation

Use one primary role per observation. Common splits:

| Source content | Observation A | Observation B | Explicitly ignore |
|---|---|---|---|
| portrait | `face_identity` on face | `skin_material`, `makeup`, `hair`, `capture`, `lighting` or `composition` as separate observations | surface/style for identity; identity for every transferable look role |
| costume photo | `costume` on garment | `material` on fabric region | source person's face and pose |
| architecture board | `architecture` | `palette` | embedded text, layout and unrelated landmarks |
| performance clip | `performance` on actor/time | `camera_motion` on frame/time | actor identity for motion; camera path for acting |

Static images can support a `capture` observation for visible viewpoint, crop, perspective and focus cues. They cannot prove focal length, aperture, camera body, camera acceleration, editing rhythm or secondary motion; keep those claims inferred unless trusted metadata or declarations establish them.

## Rights and privacy

Keep these decisions independent:

- byte integrity;
- content-credential validity and signer trust;
- copyright ownership and derivative permission;
- likeness/model release;
- generation-service transfer;
- publication and redistribution;
- training/data-mining permission;
- private metadata exposure.

An import operation never changes any unknown decision to allowed. Link an exact LicenseProfile for production. Unknown rights may permit local exploration under project policy but block production promotion and redistribution.

## Binding and conflict resolution

Bind exact Observation refs to exact target refs. Default precedence:

```text
identity → stable skin baseline → appearance/skin state → geography → prop layout
         → performance/pose → capture/composition → lighting
         → material/palette/style → atmosphere
```

This is precedence for conflict resolution, not a universal prompt order. Reject same-role conflicts unless an explicit priority and rationale resolve them. Reject overlapping selectors that give incompatible instructions.

## Promotion gates

Before an active or locked binding is used for production, require:

1. every asset byte verifies;
2. every selector is valid for the exact asset;
3. every observation has one role and disjoint extract/ignore lists;
4. identity and geography conflicts are absent;
5. required LicenseProfiles are exact and resolved;
6. private metadata and provider transfer are reviewed;
7. a human approves the exact binding set.

Hash verification cannot substitute for these gates.

## Scoped `@Asset` aliases

An `AssetAliasRegistry` is a presentation-layer map for creator shorthand such
as `@沈蘅`, `@临安.御街.雨夜` or `@青玉剑`. Each entry resolves to one exact
existing contract reference; the alias does not create a new asset, merge
roles, or change Canon. Keep the registry scoped to a project, sequence or
shot, normalize aliases to Unicode NFC, reject collisions and reserve
`@latest`. Unknown aliases remain blocked until the creator supplies an exact
target. The registry never infers a target from surrounding prompt text,
searches another scope, calls a provider or writes a file.
