# Director repair

Use this route only after an observed, bounded failure is available. A
DirectorRepair is a provider-neutral plan for the smallest next change; it is
not a generation request, a replacement artifact, a benchmark pass, or proof
that a candidate now works.

## Required evidence

Bind the observed failure to one or more supplied observation IDs and, when
available, an exact ControlBenchmarkReview. Name the failing owner before
choosing a repair:

| Failure owner | Director action |
| --- | --- |
| `director` | Plan one exact Director-owned change. |
| `story`, `character`, `scene`, `style`, `reference`, `prompt`, `production`, `rights` | Return a delegation to that same owner; do not carry a target or change. |

Do not convert a weak hunch into an observed failure. If the target artifact or
evidence is unavailable, request the smallest missing exact input rather than
inventing an ID, hash, observation, receipt or approval.

## Direct repair

A direct repair has `disposition: repair`, one immutable `targetRef`, one
`change`, an explicit preserve list, pending acceptance checks and a stop
condition. The failure owner and change variable must both be `director`.

| Change variable | Allowed target | Change only |
| --- | --- | --- |
| `dramatic_purpose` | ShotSpec or Storyboard | purpose / audience-attention decision |
| `action_blocking` | ActionSequenceSpec, ShotSpec or Storyboard | selected action path, contact, spatial staging or beat handoff |
| `camera` | ShotSpec, Storyboard or CameraPrevisSpec | semantic camera purpose/position/angle/lens/movement, or one exact numeric pose/intrinsic/motion path |
| `composition` | ShotSpec or Storyboard | framing, depth, hierarchy, occlusion or negative space |
| `shot_light_use` | ShotLightingPlan | use, exposure relation or subject/background relation of an existing physical source |
| `temporal_curve` | TemporalSpec | motivated camera, focus, action or light timeline |
| `coverage` | ActionSequenceSpec or Storyboard | required beat coverage or the closed coverage ledger |
| `render_intent` | RenderPlan | provider-neutral mode, canvas, quality budget, variant count or required capabilities |

Never use this route to change a Character identity, Scene fact, physical light
source, Style treatment, Reference scope, Prompt wording, production control,
rights result or approval. Those are delegations, even if a Director artifact
also needs to be regenerated afterwards.

For a camera repair, the target path must name a camera field; a
CameraPrevisSpec target may use only its `camera.`, `motion.` or
`tracks.pose`/`tracks.intrinsics` paths. For a RenderPlan repair, it must name
a render-intent field, never the prompt binding, recipe, license, evidence or
approval gate. A legacy RenderPlan without a payload ID can still be targeted
only through the immutable artifact reference supplied by the project runtime;
do not fabricate a payload ID.

## Delegation and acceptance

A delegation has `disposition: delegate`, names the observed non-Director
owner, includes the reason and required input kinds, and contains neither a
direct target nor a change. It does not grant the recipient permission to
mutate anything.

For either disposition:

1. Preserve every passing cross-domain constraint explicitly.
2. Keep acceptance checks pending until separately observed evidence exists.
3. Require human approval before any execution or promotion.
4. Keep parent artifacts immutable and create a later version only in the
   owning workflow.
5. Stop after one variable; a new failure becomes a new repair or delegation.

Do not report repair success, media generation, asset approval or provider
execution in this contract.
