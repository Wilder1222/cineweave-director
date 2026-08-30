# Storyboard coverage and deterministic assembly

Use this guide when a request asks for a storyboard, contact sheet, character board, comic panel sequence, pitch board or shot-planning grid. The board is a planning and review artifact; it is not evidence that a single image model can draw a coherent grid.

## Coverage ledger

Maintain a derived ledger before generation. It may live in a planning note or production manifest; do not invent a new contract field when the current schema does not expose one.

```text
sequenceId / sceneId
beatId and causal change
shotId / panelId
purpose and audience attention
required coverage: establish | orientation | action | reaction | consequence | transition
character/scene/appearance/light refs
camera scale, axis, focal intent and movement
continuity dependencies and end state
recipe task, output region and evidence status
```

Each beat should be covered by the smallest number of shots that make its change readable. A useful minimum for a multi-beat sequence is establish/orient, prepare, action, reaction or consequence, and transition. Collapse a row only when the same shot genuinely carries the required information without losing the action or spatial relation.

## Shot row contract

Every row or panel task should answer:

1. What changes here?
2. What must the audience notice first?
3. Which exact Character, AppearanceState, Scene, Light and Reference bindings are needed?
4. What scale, angle, height, focal intent and axis make the change readable?
5. What is the one dominant action and the one dominant camera behavior?
6. What must be continuous from the previous and into the next row?
7. What is the stable terminal state or edit bridge?

If a row needs two unrelated actions, split it or mark the interaction explicitly. If a panel is only decorative and does not alter information, attention, relation or pressure, it may be a look/asset reference rather than coverage.

## Duration and complexity

For video boards, estimate time from readable phases rather than a generic “cinematic clip” label:

`settle/orient + preparation + decisive action + reaction/consequence + stable end`

Add time when the camera must reveal geography, when two subjects exchange a prop, when contact has to be readable or when a focus change is causal. Short clips should usually carry one dominant action and one dominant camera behavior; a longer sequence can distribute complexity across shots rather than stacking multiple peaks into one tile.

## Independent panel tasks

Generate or edit each panel as an independent task with:

- fixed `panelId`, `shotId` and output region;
- exact upstream refs and a panel-scoped prompt handoff;
- explicit preserve/replace/exclude decisions;
- model/adapter capability and rights checks;
- provenance including recipe/task ID, source refs, seed or execution receipt when available;
- a review status separate from the board assembly status.

Assemble only after the tiles pass their own checks. Use a deterministic external board assembly with fixed non-overlapping regions, labels and metadata. Retry only failed tasks; retain immutable passing tiles. For heterogeneous boards, use separate recipes for turnarounds, identity/detail panels, environment plates and shot thumbnails.

This pattern is reinforced by [ai-video-pipeline](https://github.com/0xadvait/ai-video-pipeline), which keeps panel prompts and manifests reproducible and bridges keyframes, and by [ComfyUI workflows](https://docs.comfy.org/basic-concepts/workflow), where a graph can be serialized and rerun as a recipe.

## Continuity review

Review across adjacent rows, not just each image in isolation:

- identity and appearance version;
- hair parting, garment layers, accessories and condition;
- screen direction, axis, eyelines and spatial support;
- light source, shadow direction and exposure relation;
- prop possession, contact and occlusion;
- action phase and camera phase;
- image-to-video start/end compatibility;
- labels, provenance and rights visibility.

Separate “panel is attractive” from “panel covers the beat”. A beautiful panel that does not satisfy its coverage row is a failed planning artifact.

## Routing

- Story owns causal order and dialogue intent.
- Character owns identity, AppearanceState and PerformanceTimeline.
- Scene owns geography, material and physical light state.
- Director owns shot purpose, blocking, camera, temporal direction and coverage ledger.
- Prompt owns the frozen panel prompt.
- Production owns independent tasks, assembly, capability, evidence and retry policy.

For comics or manga, read [comic-panel-direction.md](comic-panel-direction.md) as well; panel rhythm and page composition add constraints but do not remove the coverage ledger.
