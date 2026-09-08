# Route: storyboard_rhythm

Use for shot/panel sequence design, coverage, comic pages, animatics, sequence pacing, transitions, or continuation planning.

## Storyboard

Build the minimum sequence in which every shot or panel changes information, attention, spatial relation, pressure, or choice. Coverage roles—establish, prepare, action, reaction, consequence, transition—are a checklist, not a mandatory five-shot template. One shot may satisfy several roles when causality remains readable.

Each entry binds one exact `ShotSpec` and states:

- story/action beat and purpose;
- new information or changed relation;
- dependency on earlier entries;
- screen direction, eyeline, and geography;
- visible action phase and stable end;
- coverage-ledger rows it satisfies.

The top-level ledger must close every selected beat. Decorative inserts and duplicate reactions are removed.

For creative sequence design, use [automatic technique adaptation](../optional/master-style-presets.md) to vary shot methods by beat while inheriting [one shared visual baseline](../core/visual-bible-and-continuity.md). Do not assign a different grade, grain, contrast treatment, or aspect ratio when the useful master influence changes. Track motivated physical-light transitions separately from look changes.

For comics, preserve reading order, page turn, panel hierarchy, black/white or color mass, balloons/captions as planned regions, and exact text as a later deterministic layer. Generate/review panels independently; do not ask one image model to invent the full grid and exact text.

## Sequence rhythm

For creative coverage/cut decisions, perceptual pacing, or sound bridges read [editing and sound craft](../optional/editing-sound-craft.md). Distinguish shot length from information density and performance tempo; a sustained observation may be the intended event, not a missing plot beat.

Create `SequenceRhythmSpec` downstream of the exact Storyboard. Use a reduced rational timebase and integer frame boundaries. Define ordered, non-overlapping shot windows, tempo phases, breathing points, adjacent transition grammar, and screen-direction policy.

Pacing follows dramatic pressure and information release, not an arbitrary music-video cadence. A breathing point must have a narrative or perceptual function. Finish each shot and the sequence on stable states that support continuation.

A HeroFrame may anchor visual inheritance, but it cannot override exact identity or scene geography. Continuation/extend planning states inherited facts, allowed evolution, new action, and the frame/time boundary.

## Quality gate

- exact ShotSpec refs;
- closed beat-to-shot coverage;
- causal panel dependencies;
- coherent axis and eyelines;
- integer-frame contiguous rhythm;
- transitions only between adjacent windows;
- independent panel tasks and deterministic assembly planned when needed;
- no claim that storyboard images, edit media, or assembled boards already exist.

Outputs: `Storyboard`, `SequenceRhythmSpec`.
