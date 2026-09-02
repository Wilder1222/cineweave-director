# Temporal direction

`TemporalSpec` describes how a shot changes through time. It complements a static `ShotSpec` and Character-owned `PerformanceTimeline`.

If the ShotSpec selects ActionSequenceSpec beats, keep their order and resulting
states. Align camera and focus events to the referenced Character-owned
performance phases; do not retime or rewrite the actor merely to fit a camera
move.

## Camera curve

Declare motivation, path, start hold, acceleration, peak, deceleration, stop and framing change. Camera movement should reveal information, follow behavior, alter spatial relation or increase pressure. If none applies, keep the camera static.

## Timelines

- focus: target and exact change time;
- action: trigger, owner, action and resulting state;
- secondary motion: delayed hair, fabric, props and atmosphere;
- dynamic light: only changes possible under SceneLightState;
- edit: entry, exit, transition and sound bridge.

Finish on a stable state suitable for the next shot or a video model's final frames. Reduce high-frequency accessories, intersecting layers and uncontrolled particles in video-safe constraints. Never describe a still-image style as if it proved temporal stability.

`TemporalSpec` is derived after its exact `ShotSpec` exists and owns the
one-way `shotSpecRef`. Never write a temporal-spec ref back into ShotSpec; doing
so would create an unresolvable content-hash cycle.
