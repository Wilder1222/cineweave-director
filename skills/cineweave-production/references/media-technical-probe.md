# Media technical probe

## Purpose and owner

`cineweave-production` owns `MediaTechnicalProbe`. It records selected
technical facts for one exact `MediaImport`/`mediaId` pair; it does not replace
Director's Draft import, change a media file or decide whether an image/video is
creatively or commercially acceptable.

The initial local adapter is `../../../scripts/probe-media-technical.mjs`. It invokes
only local `ffprobe` with a fixed JSON format/stream query. FFmpeg documents
that ffprobe reports container information through `-show_format` and each media
stream through `-show_streams`, and that JSON fields can be omitted when
unavailable. [ffprobe documentation](https://ffmpeg.org/ffprobe.html)

## Required source binding

Every probe names all of the following exactly:

- `mediaImportRef`: kind, ID, version and content hash for the Draft
  `MediaImport`;
- `mediaId`, `mediaContentHash` and `mediaByteSize` for exactly one member of
  that import;
- a normal CineWeave `skillReceipt`.

When the source MediaImport payload is available, its media ID, byte hash and
byte size must all match the probe. A probe never stores the source file path.

## Two honest states

- `planned` means no tool ran: probe tool is `not_invoked`, container/stream
  state is `not_probed`, and no technical result is claimed.
- `recorded` means local ffprobe actually completed. Record the ffprobe version,
  fixed command profile, timestamp and a SHA-256 hash of the sanitized report.
  Do not store raw ffprobe JSON.

The portable report retains only:

- container format names plus optional start time, duration, bitrate and size;
- selected video fields: codec/profile/tag, dimensions, pixel format/bit depth,
  field order, aspect ratios, frame rate/time base, duration/bitrate and
  primaries/transfer/matrix/range as reported stream signals;
- selected audio fields: codec/profile/tag, sample rate, channel count/layout,
  time base, duration and bitrate;
- a count for non-video/non-audio streams.

Every unavailable measurement is `not_reported`, never guessed. Exclude local
paths, raw container/stream tags, packet data and codec extradata.

## Color and execution boundaries

Reported color signals mean only that ffprobe exposed metadata on the selected
bytes. They do not prove the intended input colorspace, a correct display
transform, a grade, HDR compliance or perceptual quality. A
`ColorPipelineProfile` may call source metadata `verified` only when it carries
an exact `MediaTechnicalProbe` reference plus dated evidence; it still remains a
non-executing OCIO plan.

The probe must be local, network-free and read-only: no source or derived media
write, manifest write, LUT export, provider selection, rights conclusion,
approval or release claim. A later approved adapter owns any transformation,
conform or delivery work.
