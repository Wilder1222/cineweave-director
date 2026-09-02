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
