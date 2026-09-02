# Editorial timeline plan

Use the `editorial_timeline` route only to turn an exact Director-owned
Storyboard into a Production-owned, editable picture timeline plan. It is an
interchange-oriented planning contract, not a video editor, render request or
delivery claim.

OpenTimelineIO models editorial information as a Timeline containing Tracks
whose clips, gaps and transitions are placed in a one-dimensional time
coordinate system. It carries references to external media rather than
embedding video or audio. CineWeave follows that bounded model with an exact
Storyboard input, rational frame rate, explicit ranges, tracks, segments,
gaps, transitions and markers. See the [OTIO overview](https://opentimelineio.readthedocs.io/en/latest/)
and its [time-range guide](https://opentimelineio.readthedocs.io/en/v0.18.1/tutorials/time-ranges.html).

## Required inputs and ranges

- Bind one exact Storyboard ref at the plan root.
- Use a reduced rational frame rate such as `24/1` or `24000/1001`; never use
  a rounded decimal such as `23.976`.
- Give the root timeline and every segment an integer `startFrame` and
  `durationFrames`. Each track must cover the whole root range: leave silence
  or absence as an explicit `gap`, never an implicit hole.
- A `media` segment requires exact ShotSpec, MediaImport, mediaId and
  source-frame range references. No path, URL, endpoint, embedded binary or
  provider response belongs in this contract.
- A `placeholder` requires an exact ShotSpec and may carry an exact
  TemporalSpec, but must not contain a MediaImport binding or claim imported
  media. Use it for an approved shot whose candidate has not yet been verified.
- A `conformed` plan contains no placeholders. A `planned` plan contains no
  imported-media segments. A `partial` plan truthfully contains both.

## Editorial joins and ownership

For every two adjacent non-gap picture segments, declare one transition bound
to their shared frame boundary. A `cut` has zero transition duration; a
dissolve, wipe or fade has an explicit positive duration that fits both
adjacent segments. Preserve Director-owned shot purpose, continuity and
sound/edit intent by consuming the exact Storyboard/ShotSpec/TemporalSpec;
Production owns only the editable range, conform and exchange representation.

Set `otioExchange.serializationStatus` to `not_exported` and keep
`executionBoundary.embedsMedia` and `executionBoundary.exportsTimeline` false.
An actual `.otio`, NLE project, media conform or delivery happens later through
an approved specialized adapter and has its own evidence trail.
