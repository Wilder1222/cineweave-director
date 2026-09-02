# Sequence Rhythm Direction

Use `SequenceRhythmSpec` when a connected storyboard needs an explicit pacing
plan before Production conforms media. It makes sequence rhythm inspectable
without hiding decisions inside a genre, emotion or provider preset.

## Contract order

```text
exact Storyboard
  → SequenceRhythmSpec
  → shot-level TemporalSpec / prompt / Production plan
  → optional EditorialTimelinePlan
```

The rhythm contract is sequence-level. It does not rewrite the Storyboard's
causal coverage, individual ShotSpecs or Character performance. It also does
not replace Production's `EditorialTimelinePlan`, which owns media ranges,
placeholders, conform status and OTIO exchange.

## Use integer frames

Declare a positive reduced rational timebase and zero-based frame indices. Shot
windows are inclusive: `duration = endFrame - startFrame + 1`. The first window
starts at frame zero, later windows start at the previous end plus one, and
every Storyboard shot appears exactly once. This prevents hidden gaps and makes
the plan reproducible across adapters and editorial tools.

## Rhythm controls

- `rhythmIntent`: the causal pacing change, such as stable orientation →
  controlled pressure → still aftermath;
- `shotDurationPolicy`: minimum, preferred and maximum frame budgets;
- `tempoPhases`: ordered phases with tempo, cut density and the shots they own;
- `breathingPoints`: deliberate holds inside a shot window, with a reason;
- `transitions`: exactly one declared grammar for each adjacent pair;
- `continuity`: screen direction, axis policy, stable end states and locked shot
  order.

`calm`, `controlled`, `dynamic` and `chaotic` describe a pacing intention, not
an instruction to a particular model. If a phase needs a camera curve,
performance beat or edit decision, express that in the owning Director or
Character contract and reference it exactly.

## Review gate

Check that phase coverage closes over all windows, breathing points fall inside
their named shot, transitions are adjacent, and the plan does not claim media
generation, editing, adapter execution or final conform. A sequence with one
long shot is valid when its single phase and breathing points explain why a cut
would reduce readability; rhythm is not synonymous with high cut density.
