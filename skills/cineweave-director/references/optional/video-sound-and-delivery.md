# Optional: video, sound and delivery planning

Load for moving-image creation, sound, delivery versions, or resource constraints. Use existing routes and contracts where their fields fit; keep additional detail in labeled non-canonical worksheets. Never add invented fields to strict schemas or claim an external system ran.

## Video intent

Shot Direction owns movement and temporal structure; Production owns feasibility and handoff. Choose text-to-video, image-to-video, first/last-frame conditioning, continuation, or bounded edit as a planning intent, without assuming any provider supports it.

For each clip record source shot/temporal references (or provisional draft refs), duration/timebase, initial state, readable change, final state, subject/camera/environment tracks, identity and geography invariants, allowed evolution, and visible failure checks. Separate actor motion from camera motion. State image anchors and their roles; a planned frame is not an actual conditioning asset.

For continuation record exact source clip/frame if available, boundary time, inherited state, permitted evolution, new action, and settle/handle requirements. Unknown source media leaves continuation feasibility unresolved. Do not force a single still-image prompt to encode an entire sequence; provide time-anchored natural-language instructions alongside the visual prompt. Provider dialect remains a separate evidence-backed projection, and unsupported video fields remain a worksheet until an appropriate contract exists.

## Sound ownership and cue sheet

- Story owns dialogue and narration content and dramatic function.
- Character owns fictional voice/performance intent; real-person voice references need separate consent and use decisions.
- Direction owns cue timing and relation to visible action.
- Production owns sound deliverables, synchronization checks, and external handoff.

For each cue record ID, dialogue/voiceover/ambience/Foley/music role, text or audible intent, speaker/source, timeline range, sync anchor, perspective, priority relative to speech, rights status, and acceptance criterion. Mark whether a voice is on-screen and whether lip synchronization is required. Do not infer actual speech timing from a still or claim audio exists from a cue sheet.

Review intelligibility, audible transitions, intended silence, sync at declared anchors, and continuity separately. Technical mix targets are supplied delivery requirements or unresolved assumptions; never invent measured loudness or provider guarantees.

## Exact copy and timing checks

Preserve supplied narration/subtitle text verbatim. If a count matters, distinguish Han characters, Unicode code points, and visible grapheme clusters; punctuation is not a Han character. Avoid adding an unverified count to prose. Character count alone does not establish spoken duration: estimate timing explicitly, then verify against returned audio before final synchronization.

Use the bundled read-only [delivery checker](../../scripts/check-delivery.mjs) with Node.js 22+ when exact counts, cut coverage, or SRT timestamps are required. Resolve its path from this Skill's directory, including in an installed plugin; no repository checkout or dependencies are needed. Run `node <skill-root>/scripts/check-delivery.mjs --text "值得专程回来"` to get six Han characters. Without Node, use equivalent available arithmetic tools and disclose checks that were not run; do not block a useful draft.

For a simple cut-only timeline, save the following worksheet with the actual shot boundaries and exact copy, then run `node <skill-root>/scripts/check-delivery.mjs <worksheet.json>`. This is an optional calculation input, not a canonical root contract:

```json
{
  "frameRate": { "numerator": 24, "denominator": 1 },
  "totalFrames": 288,
  "shots": [
    { "id": "S1", "startFrame": 0, "endFrame": 96 },
    { "id": "S2", "startFrame": 96, "endFrame": 192 },
    { "id": "S3", "startFrame": 192, "endFrame": 288 }
  ],
  "subtitles": [
    { "id": "VO1", "startFrame": 192, "endFrame": 264, "text": "值得专程回来", "expectedHanCharacters": 6 }
  ]
}
```

Ranges are half-open `[startFrame, endFrame)`. Shots must cover `[0, totalFrames)` without gaps or overlap; intentional blank time needs its own shot entry. Subtitles may have gaps but belong to one non-overlapping track. `subtitles` and `expectedHanCharacters` are optional. Correct invalid input before using the returned SRT; failed checks return `srt: null` and a nonzero exit code. The helper writes nothing and never changes copy.

Use rational rates (for example `30000/1001`, not rounded `29.97`). Convert each absolute frame boundary to seconds using the exact ratio and round once to SRT milliseconds; do not accumulate rounded per-shot durations. SRT timestamps are elapsed time, not SMPTE drop-frame labels. Crossfades, speed ramps, multiple overlapping tracks, or drop-frame conform need the [editorial guide](editorial-color.md) and appropriate external timeline checks. Arithmetic passing does not verify speech speed, subtitle readability, delivered media, or synchronization.

## Delivery and resource worksheet

Record duration, rational frame rate, aspect ratio, intended resolution, audience/platform, subtitle language and exact text authority, safe areas, alternate versions, required originals, and acceptance evidence. Distinguish requested specifications from measured output properties. A vertical adaptation requires framing and text review; it is not automatically a crop.

Record user-supplied deadline, budget ceiling if any, maximum candidates per shot, revision rounds, and stop condition. Estimates remain estimates with stated basis; unknown prices remain unknown. No actual-spend accounting or automatic retries occur in this Skill.

When constraints cannot be met, offer a creative fallback tied to the same purpose: split a complex move, shorten a clip, use a still with editorial motion, or simplify background activity. Explain which creative quality changes and obtain a decision only when it falls outside delegated scope. Never downgrade a hard identity, rights, or narrative requirement silently.

## External return checklist

Request actual accessible media, clip/candidate mapping, returned timing and dimensions, available prompt/settings metadata, and relevant rights declarations. Review visible/audible quality from available media even when execution metadata is absent, explicitly limiting scope. Reproducibility and provider-compliance checks remain unknown until their own evidence is returned.
