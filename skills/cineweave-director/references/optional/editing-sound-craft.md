# Optional: editing and sound craft — attention through time

Load for coverage choices, pacing, suspense, transitions, sound bridges, or a sequence that feels ineffective despite attractive shots. Use [editorial-color.md](editorial-color.md) for technical handoff. This guide designs an edit; it does not claim to assemble, listen to, or screen unavailable media.

## Decide why the image changes

For each proposed cut, name its work: redirect attention, expose or withhold information, change alignment, omit time, contrast two ideas, or deliberately disrupt orientation. A cut on every spoken line often misses the listener's decisive action. A cut on every musical beat can erase dramatic differences. Either pattern may still be an intentional choice.

Compare the outgoing and incoming shot at the boundary:

- Where is attention just before the cut, and what receives it afterward?
- What action phase, gaze, direction, sound, or graphic feature carries the connection?
- What is new, and what remains continuous? Is the intended discontinuity intelligible?
- Would cutting earlier remove anticipation? Would cutting later preserve a useful reaction or merely repeat it?

Do not turn conventional axis matching into an absolute aesthetic law. If crossing is intentional, preserve the minimum orientation the scene still needs and identify the expressive cost/benefit. A match cut needs a semantic relationship as well as a similar shape; otherwise it is just decoration.

## Choose coverage from the cut backward

Before asking for more shots, identify missing editorial functions: orientation, setup, decision, reaction, consequence, or a needed temporal bridge. One shared shot can cover multiple functions. Do not require a master plus two singles for every dialogue scene.

For each indispensable transition, plan the outgoing state, incoming state, and sufficient action/hold to permit the intended cut. Unavailable source handles remain unknown; a written continuation does not create them. Sequence windows stay contiguous at their declared integer-frame boundaries; source handles are separate from timeline occupancy.

For ellipsis, retain enough cause and consequence to make the omitted time understandable. For parallel editing, establish the relation between spaces and clarify whether simultaneity is known, suggested, or intentionally ambiguous. Do not invent a deadline or causal link absent from Story.

## Rhythm is not average shot length

Distinguish shot duration, rate of new information, performance tempo, camera speed, visual complexity, and sound density. A long shot may be frantic; short still images may feel contemplative. Plan breathing points around perception, aftermath, listening, or association—not a fixed number of seconds per genre.

Martel discusses rhythm through time and sonic space rather than treating cinema as a sequence of metronomic beats. Use that as a reason to test sustained attention, not a preset for “Latin American slowness.” [BFI: Lucrecia Martel and Zama](https://www.bfi.org.uk/interviews/lucrecia-martel-time-zama)

Choose a rational frame rate before locking `SequenceRhythmSpec`; use the actual schema for windows, phases, and transitions. Make timing provisional until an animatic or returned takes support it. A stable end is a defined, continuable state, not a mandatory freeze that overrides the approved rhythm.

## Listening perspective and offscreen space

Treat sound as information and point of view, not automatic atmosphere:

- Name the source or explicitly mark subjective/associative sound. Specify who can hear it, whether the viewer knows its location, and when the source becomes visible if ever.
- An incoming sound before a picture change can prepare a new space; a carried sound can sustain the prior scene over a new image. State the intended time/space relation so the bridge does not imply accidental simultaneity.
- For tension, test a changed familiar sound or an absent expected sound before adding a score cue. Silence may mean reduced ambience, lost source, subjective withdrawal, or near-total silence; say which.
- Choose foreground, secondary, and background priorities for the current beat. If dialogue, rain, footsteps, music, and object cues all compete, decide what may recede.

Murch's own essay explores image/sound reassociation and the loss of intelligibility when justified layers compete. CineWeave uses this to motivate selective listening and subtraction; it does not adopt a fixed maximum number of sound tracks or universal psychological law. [Walter Murch: Womb Tone / Dense Clarity – Clear Density](https://transom.org/2005/walter-murch/)

Sound notes are human-readable planning notes until mapped to supported fields in `TemporalSpec` and editorial planning contracts. Do not invent a new sound contract or encode unheard audio as visible evidence.

## Review and minimal repair

When accessible media exists, compare: image with sound; image without sound; sound without image. These passes diagnose different contributions, not a demand that each isolated pass communicate the whole film. Record the exact file/version and time range; the proposed split does not mean it was performed.

Classify the failure before repairing:

- Missing setup or consequence → Story/coverage, not a faster cut.
- Wrong audience knowledge at the boundary → selected shot/reveal order.
- Listener's turn lost → coverage or cut timing, not louder music.
- Clear image but drowned cue → sound priority in planning; actual mix repair remains external.
- Temporal jitter/contact failure → owning motion/action dimension, not concealment by a stylish transition.

Keep passing dimensions fixed. A prose sequence can be reviewed for planning logic; emotional effect, audio intelligibility, and actual continuity remain unverified until viewed/heard. Never infer audience response solely from a numerical rhythm plan.
