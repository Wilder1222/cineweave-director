# CineWeave ControlBench

ControlBench validates the whole control system, not selected attractive images.

Required suites:

- CharacterBench: identity across views, expressions, appearance and action;
- MorphologyBench: semantic axes, structural relations, front/three-quarter/profile consistency, asymmetry and lock preservation;
- AppearanceBench: makeup, hair, costume construction, material and pairing;
- SceneBench: geography, time, weather, light and material state;
- InteractionBench: contact, support, occlusion, grip, shadow and environment response;
- StoryboardBench: behavior cause, emotion trajectory, screen direction, axis, eyeline and prop continuity;
- CinematographyBench: exact CameraPrevisSpec-bound camera path, intrinsics, focus, timebase, framing anchors and stable end-frame behavior;
- DirectorQualityBench: exact Director artifact-bound shot-purpose readability, action coverage, spatial continuity, temporal causality and human-direction judgment;
- RightsBench: evidence, adapter and dependency permission gates;
- HumanRealismBench: anatomy, regional skin/surface variation, eyes, lips, hair, optics, motivated light, contact, retouch artifacts and temporal continuity;
- AnimeBench: identity mapping, geometry abstraction, shape grouping, line hierarchy, cel shading, palette and temporal grammar;
- MangaBench: ink hierarchy, black mass, screentone, silhouette, panel readability, effects and exact typography;
- IllustrationBench, Stylized3DBench and HybridBench: representation-family-specific mark, volume, surface and scope coherence;
- CrossRepresentationBench: semantic facial relations, marks, silhouette, motion fingerprint and costume cues across approved bindings;

Combine rule checks, embeddings where appropriate, pose/layout metrics, VLM assistance and human review. Do not use same-medium face similarity as the sole cross-representation test. Blocking dimensions require a perfect pass. Automated metrics filter and diagnose; they do not replace human identity, interaction, style or story judgment. Report pass/warn/fail findings with owner and repair target, never one beauty or style-quality score.

If a suite declares `MorphologyBench`, `HumanRealismBench`, `AnimeBench`,
`MangaBench`, `CrossRepresentationBench`, `CinematographyBench` or
`DirectorQualityBench`, it must include at least one case
for that exact family scope. A family name without a recipe-bound case is not
coverage.

DirectorQualityBench follows the same case-coverage rule and additionally
requires exact Director artifact refs plus a direction-specific rubric.

A CinematographyBench case must carry an exact `CameraPrevisSpec` reference.
That reference is the expected control plan, not proof that an adapter rendered
it. Keep a planned review free of media evidence, findings and metric outcomes;
only a completed review may bind imported candidate observations and grade the
path, intrinsics, focus and stable end frame.

For CinematographyBench, define a calibration protocol before review: use blind
comparison, trained reviewers, at least two independent judgments, observable
pass/warn/fail anchors and a declared agreement threshold. Anchor each decision
to exact tracks and sampled frames or observed media; do not rate attractiveness,
infer biometric traits, trust a Provider claim, or replace evidence with a
single aggregate vibe score. If independent agreement falls below the declared
threshold, obtain the named third-reviewer or lead-adjudication outcome and
record its rationale. A planned review records only that protocol and has zero
reviewers, agreement score and adjudication result.

For DirectorQualityBench, keep direction quality dimension-specific rather than
collapsing it into a cinematic-quality or attractiveness score. Bind the case to
the exact ActionSequence, ShotSpec, ShotLightingPlan, TemporalSpec,
CameraPrevisSpec and Storyboard artifacts, then compare observed media in pairs.
The completed calibration record must declare which side was shown first, use
both left-first and right-first pairs when the plan requires balance, and cite
observations from both media. A planned review must not contain pair results or
claim that the rubric has been calibrated.

Repair from a finding, not a mood. Preserve passing dimensions, identify the
smallest owner and change one variable. Examples: hair-mass drift routes to the
RepresentationBinding or anime StyleCompile; broken black-mass hierarchy routes
to manga shading grammar; a lost canonical mark routes to the binding rather
than “make the whole image more stylized.”
