# Color pipeline planning

Use this route only for technical color-management plans. Director owns the
desired color relationship within a shot; Style owns visual grammar and
representation treatment. Production records the reproducible handoff without
silently grading, loading a configuration, modifying pixels or exporting a LUT.

## Required inputs

- One or more exact `MediaImport` references plus the selected `mediaId`.
- An OCIO configuration identity: stable ID, version and lowercase SHA-256
  content hash. A plan may name the configuration but must set `loadStatus` to
  `not_loaded`.
- Input colorspace assignment and source signal metadata. Use:
  - `unknown` only when every signal field and the colorspace name are
    `unknown`;
  - `declared` for a complete user/project/manual declaration without a probe
    claim;
  - `verified` only with a dated tool/manual-verification record.
- A scene-referred working colorspace under the OCIO `scene_linear` role.
- Exactly one preview and one delivery target, each with a display, view,
  output colorspace and one valid OCIO view path.

## OCIO model and boundaries

OpenColorIO configurations may have a scene-referred and a display-referred
reference space. A view can either use a direct colorspace, or a paired view
transform and display colorspace. Preserve that distinction in the profile:

- `colorspace` path: declare one direct colorspace and no paired fields.
- `view_transform_and_display_colorspace` path: declare both
  `viewTransform` and `displayColorSpace`; the output colorspace must equal
  the display colorspace.

Do not treat a preview display as a delivery master. Do not convert “cinematic
color” into a technical look here: this initial profile explicitly carries no
creative look transforms, so a Style-owned aesthetic decision remains a
separate input to a later approved transform adapter.

The output is a planned handoff only. It must remain provider-neutral, set
`loadsOcioConfig`, `appliesColorTransforms`, `writesMedia` and `exportsLut` to
`false`, and require human approval before any adapter action.

## Sources

- [OpenColorIO configuration syntax](https://opencolorio.readthedocs.io/en/latest/guides/authoring/overview.html)
- [OpenColorIO Displays & Views](https://opencolorio.readthedocs.io/en/latest/guides/authoring/displays_views.html)
- [OpenColorIO File Rules](https://opencolorio.readthedocs.io/en/latest/api/rules.html)
