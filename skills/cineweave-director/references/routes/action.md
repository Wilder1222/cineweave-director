# Route: action

Use for fights, pursuits, escapes, rescues, complex prop interaction, or any sequence with several causal spatial changes. Resolve `ActionSequenceSpec` before lenses and individual shots.

## Beat structure

Each beat closes:

`trigger → objective → attack/action → defense/response → counter/choice → contact or miss → result → changed spatial state`

Record entry, change, and exit state; participating exact Character/Scene bindings; named zones and trajectories; performance intent; coverage requirement; continuity effects; and visible risk.

A trajectory states start anchor, path, target, contact logic, and end anchor. Avoid “dynamic fight” or “moves quickly” without mechanics.

For a consequential prop or mechanism, track what the viewer must see change: initial configuration, trigger, necessary intermediate state, resulting possession/configuration, and residual motion. A closed case cannot become empty without a supported opening or deliberate intelligible ellipsis. Divergent story choices need separate action branches when they change positions, resistance or outcomes; do not combine incompatible alternatives into one ambiguous sequence.

When perceived danger depends on distance or scale, include a legible spatial reference and the consequence the character anticipates. Preserve the selected story stakes; these are visual storytelling requirements, not instructions for performing a dangerous act. Adapted as conditional guidance from [Leos directing grammar](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/directing-grammar.md).

## Weapons and techniques

For every visible weapon or tool state name/type, dimensions or handling characteristics relevant to readability, current holder, start/end state, and interaction constraints. Describe techniques by observable mechanics and cause, not decorative labels. Keep attack–defense–counter order explicit.

Do not provide executable harm instructions, rigging, impact, fall, vehicle, fire, water, crowd, or weapon methods. Flag them for qualified external review. A creative action plan is not stunt or safety approval.

## Coverage

Coverage requirements protect causal readability, not a fixed shot count. State which beats require geography, setup, contact, reaction, consequence, or transition evidence. A later `ShotSpec` selects exact beat IDs and cannot rewrite them.

## Quality gate

- playable geography and contact;
- no teleporting props or body states;
- force, weight, and reaction are causally legible;
- entry/change/exit states close;
- selected risks remain visible;
- all hard bindings exact or explicitly blocked;
- prompt handoff contains only the selected beat's observable details.

Output: `ActionSequenceSpec`.
