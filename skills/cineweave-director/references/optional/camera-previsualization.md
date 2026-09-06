# Optional: camera previsualization

Load only when numerical 3D exchange, an exact trajectory, repeatable virtual-camera state, or a downstream implementation handoff requires more than semantic camera direction.

Use the hierarchy:

`sequence coverage → shot purpose and blocking → camera behavior → pose/intrinsic tracks → implementation`

A `CameraPrevisSpec` binds exact `ShotSpec` and `SceneBinding`, plus optional `TemporalSpec`. Declare:

- scene-local coordinate system, handedness, origin, axes, and meter units;
- reduced rational frame rate and integer frame bounds;
- filmback/sensor, projection, clipping, shutter convention;
- camera position and unit-quaternion orientation tracks;
- focal length/field-of-view, focus distance, aperture/iris tracks;
- interpolation and hold behavior;
- translation, rotation, zoom, focus, and iris as separate components;
- collision, horizon, target, and geography constraints.

Translation is not zoom. A dolly changes perspective; changing focal length changes field of view. Do not label one as the other. Pose and intrinsics must remain separate even when synchronized.

Keyframes include start, readable peak, settle, and stable end. Boundary frames are exact and adjacent tracks agree at joins. Numerical previs does not authorize a provider, prove feasibility, or override blocking, performance, Scene geometry, or lens intent.
