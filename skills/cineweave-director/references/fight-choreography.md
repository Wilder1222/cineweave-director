# Fight choreography and storyboard prompt handoff

Use this guide whenever two or more participants exchange attacks, defenses,
feints, counters, grapples or weapon threats. It supplements
[action-direction.md](action-direction.md). The goal is not to write a stunt
manual; it is to make the depicted action unambiguous in a storyboard frame or
prompt while preserving character, scene and safety ownership.

## Detail contract

An armed or unarmed fight must expose four linked layers:

1. **Weapon profile** — for every visible weapon, state the exact name or
   declared label, weapon type, visible construction or distinguishing
   characteristics, combat function in this beat, current hand/guard/state and
   continuity after the beat. “Sword” or “weapon” alone is not enough when a
   more specific supplied fact exists.
2. **Technique card** — name a technique only when the name is supplied or
   reliably established. Always add its observable mechanics: guard or setup,
   initiating body part, footwork and weight transfer, line of attack or
   defensive line, target/intent, contact or near miss, and recovery.
3. **Trajectory card** — write the path as
   `起点 → 预备/转向 → 峰值或接触点 → 终点/回收`. Include path shape (straight,
   arc, diagonal, vertical, circular or other), screen direction, depth
   relation, height band, speed/rhythm and what the camera must keep visible.
   “挥刀”“快速闪避” without a start point, end point and path is incomplete.
4. **Exchange card** — enumerate the causal response chain with participant and
   event IDs: `initiator → attack/feint → defender response → counter or
   reposition → separation/reset`. State whether contact is real, weapon-on-
   weapon, body contact, a controlled near miss or unresolved; then state who
   owns initiative, how distance/position changed and what becomes possible next.

For an unarmed exchange, use the same grammar with the relevant body part and
technique type: fist, palm, elbow, knee, kick, clinch, takedown or evade. Do
not turn a named move into a magical capability that the CharacterBinding does
not support.

## Weapon profile rules

- Bind the weapon to its owner participant and existing `propRef` or
  interaction constraint. If the brief does not establish a name, type or
  characteristic, write `unknown`/`unresolved` and surface the gap; do not
  invent historical provenance, dimensions, weight or material certainty.
- Distinguish visual identity from action function. For example, a narrow
  single-edged short blade may have a visible dark scabbard and restrained
  metal highlight, while its beat function is to hold a lateral distance line;
  the two statements should not be collapsed into “cool sword.”
- Track hand, grip, guard orientation, sheathed/drawn state, possession and
  separation from people and set anchors. A later panel cannot silently change
  hand, blade direction or weapon state.
- Keep weapon contact creative and observational. Do not supply construction,
  rigging, impact, disarm or fall execution instructions. Any weapon contact,
  fall, height, vehicle, water, fire or crowd risk remains visibly routed to
  qualified review.

## Exchange and trajectory rules

Every attack needs a readable answer, even if the answer is a miss:

| Layer | Required question | Prompt-visible wording |
| --- | --- | --- |
| Initiation | Who starts, from where, with what intention? | “追兵由正门右侧先发起斜向劈击，目标是逼退而非命中。” |
| Defense | How does the other participant answer? | “顾行舟左脚向外移开，肩线让开刀路，刀锋擦过前景。” |
| Counter / turn | What changes the pressure? | “他不追击，借桌沿的横向位移切断第二人的直线路径。” |
| Contact / result | What actually touches, misses or changes state? | “无人体接触；追兵被迫改单列，顾行舟仍守在沈蘅前方。” |

When several weapons or participants overlap, specify pairings and order. Do
not write “双方激烈交手” unless the sentence also states who attacks whom,
which defense answers it, where the paths cross, and what the exchange leaves
behind. Simultaneous action needs a shared trigger and a readable priority,
not an unordered list.

## Storyboard and prompt handoff

`ActionSequenceSpec` owns the full exchange. A `ShotSpec` selects exact
`actionBeatIds` and carries only the visible subset in `promptHandoff.actionBreakdown`.
The Prompt layer compiles that handoff into `prompt.blocks.action` and the
concise/expanded prompt; it must not re-order selected beats or add a new
weapon.

Use this order when writing an action storyboard prompt:

`dramatic purpose → spatial relation/axis → weapon profile → technique →
trajectory → exchange response → contact/result → camera-readable moment →
continuity and targeted negatives`.

For a still panel, freeze the clearest instant of one selected exchange rather
than describing an impossible before-and-after collage. Preserve the preceding
setup and following result as continuity context, and state which portions may
be occluded. For a multi-panel board, give each panel one dominant action and
carry the prior panel's weapon state, body facing, distance and initiative into
the next panel.

## Minimum review gate

Before handoff, confirm:

- the weapon can be identified by name, type and visible characteristics, or
  its missing fact is explicitly unresolved;
- the technique has an observable setup, mechanism, intent and recovery;
- the trajectory has start, path, direction, depth, height and end;
- attack, defense, counter/reposition, contact and result are paired in order;
- the selected camera can see the decisive weapon/body relationship without
  sacrificing the action axis;
- hand, possession, injury, wardrobe damage and environment state close on the
  final beat; and
- creative depiction is separated from qualified safety review.
