# Optional: cinematic patterns

Load when a user asks for a reusable gesture such as reveal, slow-push reaction, pursuit escalation, match cut, threshold entrance, withheld reverse, or parallel action.

A cinematic pattern is a parameterized creative program, not a prompt preset. Define:

- stable pattern ID and version;
- story function and appropriate/forbidden contexts;
- required binding slots;
- typed parameters with bounds and defaults;
- ordered steps, each owned by one route and one target artifact;
- quality checks and unresolved decisions;
- no provider, model, adapter, or execution fields.

Example parameters may include attention target, reveal delay, camera distance change, reaction hold, axis policy, tempo phase, or match dimension. A parameter changes an authored control, not Canon.

`CinematicSkillManifest` catalogs patterns. `ShotCompilerPlan` selects one version, resolves exact bindings and values, exposes a creator-facing camera/performance/pacing control surface, and emits planned handoffs. The compiler does not create final ShotSpec hashes, fill missing story facts, choose tools, or claim generated media.

One pattern step has one owner. Story function belongs to Story/Direction; actor timing to Character; geography to Scene; representation to Style; model-facing wording to Prompt. Cross-domain convenience cannot become a hidden override.

When creatively selecting or adapting a pattern, use [automatic master-inspired technique matching](master-style-presets.md). No creator name or switch is required. The catalog is a brief-led decision aid, not an already-instantiated `CinematicSkillManifest`; preserve the shared look and only formalize compatible mechanisms when canonical output is actually requested.

When selecting or improving a pattern, use [directing craft](directing-craft.md) for its purpose and tradeoffs, [cinematography craft](cinematography-craft.md) for camera/light feasibility, or [editing/sound craft](editing-sound-craft.md) for transitions. Load only the relevant guide. Expand a named influence into observable choices; the creator's name is not a control value or quality guarantee.

## From creator language to a reviewable shot

For “she hears footsteps, keeps walking, and hides her alarm while the camera moves closer”, resolve the character and scene bindings first. Offer the smallest motivated pattern: a slow-push reaction, with camera movement, restrained performance, and reaction duration exposed as separate controls. Describe the duration as a proposed value until the user or an approved artifact fixes it. Character translates restraint into observable behavior; Direction aligns the camera and timing with that behavior.

Show a compact direction card: dramatic change, exact bound assets, camera intent, observable performance, timing, preserved facts, and the next unresolved decision. A value such as 80% restraint is a creative input, not a psychological measurement or a provider weight. Adjust one requested control and preserve the other accepted values. If a camera change requires new blocking or timing, state that dependency before treating the affected choice as settled.

## Compiler consistency

Within `ShotCompilerPlan`, each parameter and binding slot has a unique ID. Each control projects the resolved parameter value and names a matching planned field assignment. Every handoff and trace target retains the same contract kind, owner, and operation label; output ownership comes from the release's `contracts.json`. Compatible wire labels such as `temporal_direction` and `performance_timeline` describe operations within their owner route, not additional v3 routes.

Handoff dependencies must come from the declared exact binding or upstream refs and retain every ref actually consumed by a binding/upstream assignment. Alias-derived bindings name both the alias and exact registry. Keep groups, handoffs, and trace steps in strictly increasing order, and avoid duplicate target assignments inside a handoff. Every non-validation trace step points to a matching handoff assignment.

These local consistency checks do not verify the contents of an unavailable manifest or registry. Inspect the supplied exact artifacts to check pattern version, parameter types/bounds, slot requirements, and alias mappings. If those inputs are missing, return the direction card with unresolved decisions rather than inventing a canonical compiled plan.
