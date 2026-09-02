# Camera previsualization

Use this guide when camera, lens, framing, movement or temporal composition is a major acceptance target. A camera word is not a camera plan. Resolve the hierarchy before compiling a prompt or adapter workflow.

## The camera hierarchy

```text
sequence coverage
  → shot purpose and blocking
  → camera behavior
  → camera pose/keyframes
  → rendered frame or video adapter
```

### 1. Sequence coverage

State which beat, relation or spatial fact the sequence must reveal. Mark required establish, action, reaction, consequence and transition coverage. Do not solve a coverage gap by adding random inserts after generation.

### 2. Shot purpose and blocking

Place subjects in named zones, define eyelines, contact, occlusion, path and end state. The shot must say what the audience notices first, second and last. Blocking is upstream of lens choice.

### 3. Camera behavior

Choose one dominant motivated behavior: static observation, dolly, truck, pan, tilt, arc, crane, handheld, gimbal or a declared compound. State its motivation, direction, start, acceleration, peak, deceleration, stop and any framing change. A compound move is valid only when the tracks have separate purposes and remain readable.

### 4. Camera pose and keyframes

Specify the camera state at meaningful points:

```text
time → position → height → angle → orientation → focal intent → focus target → depth/occlusion
```

Use exact `ShotSpec.camera` fields for the shot and `TemporalSpec.cameraMotion` plus keyframe-like events for time. Curve language such as “slow push, brief acceleration, settle” is incomplete until the start, peak and stable end are visible. When a 3D previs, trajectory interchange or capable adapter needs numerical state, emit the optional `CameraPrevisSpec` rather than adding engineering fields to ShotSpec or TemporalSpec.

### 5. Render frame or video adapter

Only now choose a provider-neutral image, edit, depth/pose/mask, image-to-video or 3D-previs route. The adapter may approximate the camera plan, but it cannot redefine the dramatic purpose or hide an unsupported hard requirement.

## Artifact dependency direction

Hash the `ShotSpec` before deriving time or lighting. `TemporalSpec` and
`ShotLightingPlan` each reference that exact upstream shot; the ShotSpec never
references either downstream artifact. CameraPrevisSpec is another downstream
node: it references the exact ShotSpec and SceneBinding, and can additionally
reference the exact TemporalSpec. Consumers bind the sibling refs they need.
This keeps the immutable artifact graph acyclic and makes every content hash
independently computable.

## CameraPrevisSpec boundary

Create CameraPrevisSpec only for numerical camera work. It is not a replacement
for dramatic blocking or a vendor workflow.

- Use a scene-binding-local coordinate system with explicit meter units, up
  axis, handedness, forward axis and origin.
- Use a reduced rational frame rate and an explicit inclusive start/end frame
  range. If a TemporalSpec is supplied, the range must describe the same
  duration.
- Declare projection, filmback, clipping range, shutter interval and focus
  target separately from animated intrinsics.
- Keep pose/extrinsic keyframes (position plus normalized orientation
  quaternion) separate from intrinsic keyframes (focal length, focus distance
  and f-stop). Both tracks start and end at the declared frame range.
- Declare every real motion component. Camera translation is not zoom; a zoom
  changes focal length, while a dolly changes pose. A focus pull changes focus
  distance, and an iris change changes f-stop; neither by itself makes the
  camera move.
- Keep the contract provider-neutral and non-executing. Production decides
  whether an adapter can actually honor it.

## Motivated movement matrix

| Behavior | Useful motivation | Check before handoff |
| --- | --- | --- |
| static/locked | let performance or spatial relation carry the change | subject action remains readable without camera help |
| dolly/push | discovery, pressure, intimacy or commitment | scale change does not cross an axis or lose contact |
| pull back | reveal consequence, isolation or geography | new space contains a declared story fact |
| truck/track | accompany travel or preserve a relation | speed and subject path are compatible |
| pan/tilt | redirect attention or reveal off-screen cause | start and end targets are ordered, not simultaneous |
| arc/orbit | expose changing relation or face/space | axis and background parallax remain coherent |
| crane/elevate | change power, geography or escape route | vertical reveal has a reason and a stable end |
| handheld/gimbal | controlled instability or embodied following | shake amplitude is declared and does not erase action |

## Lens and composition checks

Use [cinematography.md](cinematography.md) for the existing scale/angle/height/lens grammar. In every camera review, verify:

- shot scale is justified by audience attention and action coverage;
- focal intent agrees with distance, perspective and depth;
- axis side, eyelines and screen direction remain stable unless the crossing is motivated;
- focus target and depth of field support the primary action;
- foreground, midground, background and negative space have a readable hierarchy;
- the camera does not compete with a high-priority performance event.

Do not treat 24/28/35/50/85/100–135 mm heuristics as universal laws. They are starting points; physical distance, sensor/crop, movement and desired perspective remain the controlling facts.

## Motion tracks must stay separate

Director coordinates, but does not overwrite, these tracks:

| Track | Owner | Example |
| --- | --- | --- |
| performance | Character | weight transfer, gaze, reach, turn, reaction phase |
| camera | Director | dolly path, pan, handheld envelope, focus pull |
| environment | Scene | rain, dust, curtain, practical flicker, vehicle motion |
| lighting | Scene/Director | source movement, shadow travel, exposure transition |
| edit | Director/Production | cut, bridge, hold, transition condition |

If the camera move is used to hide an impossible hand contact, repair the contact or blocking first. If a camera curve contradicts a locked Character `PerformanceTimeline`, revise the camera or request an explicit upstream timing change; do not silently rewrite performance.

## Adapter translation

- Still image: preserve the final camera pose, attention order and depth relations; do not describe an unsupported temporal move as if it were evidence.
- Image-to-video: preserve source composition and describe only the approved movement, performance phase and environmental response; use the stable end state as the terminal condition.
- Depth/pose/mask workflow: treat each condition as a separate ControlChannel with scope and enforcement. A depth map constrains spatial layout; it does not guarantee identity or acting.
- 3D or previs workflow: use explicit camera tracks, Bezier/keyframe curves and render checkpoints when the runtime supports them. A previs camera is evidence of camera intent, not proof of final material or identity quality.

The hierarchy follows the camera-control logic described by [CinePreGen](https://arxiv.org/abs/2408.17424). In CineWeave, narrative camera intent remains in Director `ShotSpec`/`TemporalSpec`/`Storyboard`; CameraPrevisSpec is the optional numerical sibling handoff, evaluated against exact Scene and Shot bindings.

## Review and repair

Review in this order: purpose → blocking/contact → axis/geography → movement curve → pose/keyframes → focus/composition → light → adapter capability. Repair one level at a time. If a frame fails because the camera hides the action, change blocking or coverage before changing lens adjectives. If the movement is right but the result is temporally unstable, route to Production capability or the relevant motion adapter rather than rewriting the dramatic beat.
