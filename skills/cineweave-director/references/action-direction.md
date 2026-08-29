# Action direction

Use this reference for a multi-beat physical sequence: combat, pursuit, escape,
rescue, fall, crowd movement or another action whose spatial state must survive
shot breakdown. A single gesture remains a `ShotSpec` or Character-owned
performance beat.

## Ownership

- Story supplies why the action happens, its stakes and causal outcome.
- Character supplies exact CharacterBindings, motion fingerprints and optional
  PerformanceTimelines.
- Scene supplies exact zones, paths, anchors, surfaces, props and interaction
  constraints.
- Director turns those facts into ordered action beats, spatial changes,
  coverage requirements and sequence continuity.
- ShotSpec selects exact action beats and decides the lens, camera position and
  composition. TemporalSpec aligns camera and focus time to Character-owned
  performance time.
- Production and qualified on-set specialists decide executable methods,
  equipment and safety approval.

Do not use an `ActionSequenceSpec` to invent a missing story turn, change a
character's capabilities, move a fixed scene anchor or certify a stunt as safe.

## Sequence method

1. Bind one dramatic function, audience shift, readable action and changed end
   state to an exact ScriptScene or declared direct brief.
2. Bind every participant to one exact CharacterBinding. Preserve its motion
   fingerprint; reference a PerformanceTimeline when actor timing already
   exists.
3. Bind one exact SceneBinding. List only active zone and path IDs already
   established by Scene.
4. Establish entry positions, facings, exits, the action axis and forbidden
   spatial changes before designing moves.
5. Divide the sequence into the fewest beats that change pressure, information,
   position, possession, access or character choice.
6. For each observable action, state participant, from/to zone, support and
   weight, relevant constraint IDs and resulting state. Reference performance
   phases; do not rewrite gaze, breath or emotional timing.
7. Add physical checks as design constraints. Mark assumptions and specialist
   review honestly; a plausible description is not measured evidence.
8. Define coverage requirements by what must remain readable, what may be
   occluded, axis intent, movement motivation, cut motivation and stable
   handoff. Defer focal length and exact camera path to ShotSpec/TemporalSpec.
9. Close continuity tracks for position, facing, occupied hands, props,
   injuries, wardrobe/environment damage and other changing states.
10. Flag visible production risks and hand the sequence to shot breakdown.

For armed or unarmed fights, also read [fight-choreography.md](fight-choreography.md)
and complete the weapon, technique, trajectory and exchange layers before
calling the sequence shot-breakdown ready.

## Beat discipline

An action beat needs a trigger, dramatic function, attention target, rhythm,
observable actions and one resulting state. Prefer state-changing beats such as:

- a protection line is established;
- an exit is blocked;
- a prop changes the available path;
- a character chooses to reveal a capability;
- possession changes hands;
- support is gained or lost;
- the sequence settles into an aftermath state.

Do not split a sequence into one beat per limb motion. Conversely, do not hide
several spatial changes inside “they fight.” Every beat must be playable from
its entry state and hand a stable result to the next beat.

For a fight beat, do not hide the exchange inside one `observableAction` string.
Use the structured `weaponRef`, `techniqueType`/`techniqueName`, `trajectory`,
`contact`, `exchangeRole` and `responseToEventId` fields when those facts are
known. Add the beat-level `exchange` so the causal order of initiation,
defense, counter or reposition, and reset is explicit. A named technique never
replaces its visible mechanics.

## Physical readability

Check only what the supplied contracts support:

- base of support and visible weight transfer;
- reach and clearance relative to people, props and architecture;
- contact and separation at the readable moment;
- momentum, recovery and changed direction;
- hand occupancy and prop state;
- landing or transfer support;
- crowd spacing and non-intersection.

Do not infer anatomical, martial or stunt certainty from prose. Use
`design_resolved` only when an exact supplied Character/Scene constraint
supports the design. Use `assumption`, `unresolved` or
`qualified_review_required` otherwise.

## Camera choreography

Action coverage must preserve causality, not merely energy. Establish geography
before compressing it. Show the action that creates a new state and the result
that makes the next beat possible. Cut on information, choice, contact,
possession, support or direction change—not because an arbitrary duration has
elapsed.

For fight coverage, keep the weapon path and the defender's response in the
same readable causal window whenever possible. If a cut separates them, the
handoff must repeat the initiating weapon state, facing, distance and
`responseToEventId` context; never use a montage cut to conceal an unresolved
exchange.

`ActionSequenceSpec` expresses coverage needs without lenses or exact camera
curves. A downstream `ShotSpec` binds `actionSequenceRef` plus one or more
`actionBeatIds`; its camera choice must satisfy the selected coverage
requirements. A TemporalSpec then aligns camera/focus events without changing
the Character-owned performance.

## Continuity

Track state changes in beat order. The final change in each continuity track
must equal its declared exit state. A later shot cannot silently:

- move a participant across the axis or into another zone;
- swap a held prop or occupied hand;
- restore a displaced or damaged object;
- erase an injury, wetness or wardrobe change;
- reverse pursuit direction;
- bypass an obstacle that still exists.

Canon-level consequences route to Story's ContinuityLedger. The action contract
owns only sequence entry/change/exit state and the handoff rule.

## Risk boundary

The risk register communicates production risk; it is not a stunt plan. High or
critical risks, weapons, falls, vehicles, water, fire, breakaways, animals and
crowds require qualified review. Keep the creative intent and depiction
strategy, but do not supply operational rigging, weapon, impact or fall
instructions. `shotBreakdownReady` means the creative sequence can be divided
into shots. It never means execution is safe or approved.

## Grounded historical action profile

For restrained historical action, preserve grounded physics, low-superhuman
ability, environment-led choreography, sparse efficient movement, readable
geography, minimal effects, motivated pauses and visible aftermath. Use rooms,
stairs, boats, bridges, furniture, fabric and weather as constraints rather
than replacing them with generic open-space combat. Character choices remain
more important than move count.

## Review questions

- Does every beat change a meaningful state?
- Can every participant and path be found in exact bindings?
- Does each move preserve Character-owned motion identity and timing?
- When the sequence is a fight, can every visible weapon be named, typed and
  distinguished, and does every technique expose its mechanics?
- Does every weapon/body path state an explicit start, shape, direction, depth,
  height, speed/rhythm and end point?
- Can the audience follow initiator → defense → counter/reposition → contact or
  miss → resulting position without guessing?
- Are contact, support, reach and prop states readable rather than assumed?
- Does every beat have at least one linked coverage requirement?
- Do continuity tracks close on their final state?
- Are lens and exact camera curves deferred to shot-level contracts?
- Are hazardous methods unresolved and visibly routed to qualified review?
