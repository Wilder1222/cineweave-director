# ControlBench review receipts

Use this guide after an approved local or external adapter has generated media,
the bytes have been verified and the output has been imported as Draft media.
The review is a quality receipt, not a generation request, approval or release.

## Required evidence chain

Each completed review binds every evaluated candidate to:

```text
exact ExecutionReceipt → exact Draft MediaImport → candidate Observation IDs
  → ControlBench findings and metrics → human review → next action
```

For a video candidate, the `MediaImport` must include locally verified duration
and frame rate as well as dimensions and content hash. A container reference or
a visual claim without that import receipt cannot satisfy the evidence gate.

Do not review a provider message, filename, chat screenshot or unverified URL.
Those are not candidate evidence. A planned review may list all cases, but has
no `mediaEvidence` and cannot advance an asset.

## Final photoreal-human gate

For photoreal/natural-human delivery, review at delivery scale and across the
relevant temporal sample:

1. identity and approved appearance anchors survive angle, expression, motion
   blur and occlusion;
2. anatomy, weight, floor/prop contact, occlusion order and cast/contact shadow
   agree with the staged action;
3. regional skin/material variation, eyes, lips, hair edges and garments react
   to physical source light without plastic smoothing, uniform color, false
   wetness, haloing or over-sharpening;
4. perspective, focus falloff, depth and camera movement preserve the ShotSpec
   attention order rather than masking a failed interaction;
5. identity, contact, wardrobe, light direction and motion remain continuous
   across frames;
6. rights, consent, adapter capability and supplied evidence are resolved.

These are plausibility and continuity checks, never an attractiveness score,
biometric judgement or inferred sensitive attribute.

## Findings and repair

One finding names one benchmark dimension, severity, observations, owner and,
for warning/failure, one smallest repair variable. A failed blocking finding
must be in `decision.blockingFindingIds`, set the decision to `fail`, select
`repair`, and keep `mayAdvanceToApproval` false. Preserve passing dimensions.

Route plastic cheek response to Character surface state or Prompt detail budget;
light mismatch to Scene/Director; broken hand contact to Scene/Character or
Director blocking. Do not answer with “make it more cinematic” or rerun every
control at once.

`mayAdvanceToApproval` means only that this review has no blocking finding. It
does not approve the asset, grant rights, publish media or prove repeatability.
The next approval remains an explicit hash-bound human gate outside this Skill.
