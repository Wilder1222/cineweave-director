# Optional: directing craft — intention, performance, staging

Load for scene direction, actor notes, competing coverage choices, suspense, ensemble blocking, or a request for stronger directing. For optical/light decisions load [cinematography-craft.md](cinematography-craft.md); for cuts and listening perspective load [editing-sound-craft.md](editing-sound-craft.md). Sources and exercises are in [film-craft-study.md](film-craft-study.md).

These are CineWeave decision aids, not universal laws. A filmmaker's stated method is evidence of that practice, not proof that it suits this scene. During creative drafting, use [automatic technique adaptation](master-style-presets.md) to infer useful mechanisms without a preset questionnaire; analysis/review alone does not authorize restyling. Preserve the approved story, representation, identity, and shared visual baseline. Use the user's language; technical terms should clarify an observable choice.

## Decide what the audience experiences

Before specifying equipment, identify the scene's organizing mode: dramatic causality, observation, subjective experience, essay/association, or an explicit mixture. In dramatic work, track objective, resistance, tactic, and turn. In observational or essay work, track a change in attention, duration, relation, or association; do not invent a confrontation merely to fill the template.

For a consequential decision, retain a compact rationale in human-readable notes:

`intended experience → visible/audible mechanism → chosen treatment → cost or risk → alternative → evidence that would favor the alternative`

One meaningful alternative is usually enough. Do not force a long analysis on a simple shot request. A valid alternative changes viewpoint, staging, reveal timing, or duration—not just lens-brand adjectives. If the user already locked the choice, diagnose and improve inside it.

## Information and point of view

Use when the scene depends on discovery, concealment, uncertainty, or a shifting alliance.

- Separate what each character knows from what the audience sees/hears. Identify the precise cue that changes each knowledge state.
- Decide whether the viewer learns before, with, or after the focal character. Earlier disclosure can create anticipation; withheld disclosure can create surprise. Neither is intrinsically better.
- Choose access deliberately: shared space, aligned view, literal optical POV, or detached observation. An eyeline shot is not automatically literal POV; do not grant the camera knowledge the chosen treatment withholds.
- Describe the reveal mechanism: an actor clears an occluder, a new sound is localized, a focus change resolves an existing object, or a cut changes access. Include what remains withheld.
- **Failure signal:** an insert or camera move reveals the answer before the intended turn, or uncertainty becomes unreadable geography.
- **Check:** write the audience's plausible interpretation immediately before and after the cue. If they are identical, the proposed reveal needs a different purpose or should be removed.

## Playable performance, not prescribed emotion

Judith Weston's public teaching description emphasizes script analysis, subtext, playable discoveries, rehearsal, and critique. The following conversion is CineWeave's application, not a reproduction of her course. [Judith Weston: teaching background](https://judithweston.com/web/bio/longform-bio)

- Translate “more anxious” into a partner-directed task: get the visitor to leave without revealing that the letter has been read. Identify what the partner does that forces a change of tactic.
- Distinguish intention, playable action, and visible consequence. “Convince her to stay” is an actor task; moving the untouched cup toward her is one possible manifestation, not the only correct performance.
- Give a physical task and a listening opportunity. Let a reply, silence, or interrupted action affect the next beat. Do not stack jaw tension, swallowing, trembling, and tears as mandatory emotion tokens.
- For human actors, prefer rehearsal alternatives over micro-managing involuntary physiology. For AIGC, choose a few legible actions at the requested shot scale, with causal timing and a stable end.
- **Failure signal:** the performance illustrates the adjective but ignores the partner, or the cue is too small for a wide shot.
- **Check:** remove the emotion label. Can another reader describe the tactic and the moment it changes? Do not infer a real person's inner state from a gesture.

Performance timing belongs to `PerformanceTimeline`; camera/focus synchronization belongs to `TemporalSpec`. A proposal is not a completed rehearsal or actor approval.

## Blocking as relationship

Use staging to change access, authority, intimacy, exclusion, or alignment within the approved space.

- Name the anchors, travel path, facing, eyelines, and the third point of attention (door, object, absent person) where relevant.
- A status shift need not be a low angle: one person can retain the doorway, make the other cross the room, stop a shared task, or become the person everyone looks toward.
- For ensembles, determine who initiates, who witnesses, and whose response changes the group. Use depth, gaps, and occlusion to establish readable relationships before adding singles.
- Motivate crossings by action or relationship. If the axis changes, plan a visible crossing, neutral orientation, or re-establishing view; if disorientation is intentional, state what the viewer must still understand.
- **Failure signal:** actors move only to justify the camera, or an elegant composition hides the handoff/response carrying the beat.
- **Check:** sketch a top-down arrangement and describe it without camera vocabulary. Then verify that the intended frame makes the relationship readable. No invented scene topology.

## Holding versus cutting

An uninterrupted view can preserve simultaneous relationships and the uncertainty of waiting. Cutting can control access, omit time, or let a listener displace the speaker as the scene's center. Choose based on the experience, not a ranking of “advanced” techniques.

Lubezki's account of *Children of Men* describes an immersive approach while acknowledging that long takes were also shortened for the film's rhythm. Naturalistic appearance and an unbroken-shot plan are not purity tests. [ASC: Children of Men](https://theasc.com/article/children-of-men-humanitys-last-hope/)

Compare the held shot with minimum coverage at the same story outcome:

- What relation survives only if both actions remain visible together?
- What information needs selective access or a temporal omission?
- Can performance, focus, geography, and the intended end survive the whole shot? Unsupported generation capability stays unknown.
- What is the cost of losing the reaction, ambiguity, or duration if a cut is added?

Do not insist every held moment introduces plot. Martel's discussion of *Zama* makes time and sound central to how experience is constructed; a sustained listening interval may be the event. It still needs an articulated perceptual function. [BFI: Lucrecia Martel on time](https://www.bfi.org.uk/interviews/lucrecia-martel-time-zama)

## Selection and restraint

Donald Richie's firsthand account of Kurosawa describes attractive footage being discarded when it delayed action or weakened the dramatic effect. Use this as a counterexample to equating beautiful frames with good direction, not as an instruction that all films must move quickly. [Criterion: Throne of Blood](https://www.criterion.com/current/posts/938-throne-of-blood)

For a proposed flourish, ask what disappears if it is removed. If only the opportunity to display the technique disappears, simplify it. Preserve an expressive image when atmosphere, ambiguity, association, or sustained attention is its approved function.

## Contract handoff

These notes are not new schema fields. Read the selected schema before canonical output.

- Story knowledge/tactics/turns → `ScriptScene` or `BeatSheet`, without camera instructions.
- Actor actions and timing → `PerformanceTimeline` through `character`.
- Chosen purpose, dramatic beat, attention, zones, camera, composition, end → existing `ShotSpec` fields.
- Shot timing and synchronization → `TemporalSpec`; shot-use of approved sources → `ShotLightingPlan`.
- Coverage and sequence durations → `Storyboard`, then `SequenceRhythmSpec`.
- Reject/repair criteria → a planned `ControlBenchmark`; observed findings only after accessible evidence.

Keep alternatives outside the selected canonical artifact. Do not silently change an approved story event to make a preferred technique work.
