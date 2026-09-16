# Optional: ensemble direction and shot review

Load automatically for multi-person narrative staging or a complete narrative shot/video-prompt handoff; also load for explicit background-activity or directing-review requests. These are perspectives used by this one Skill, not additional routes, agents, or authorities. A complete scene/sequence handoff or comprehensive review uses all six perspectives. A bounded request uses focused perspectives. Do not expand a simple portrait, exact translation or camera question into a six-part ceremony.

## Apply within the existing workflow

1. Identify the actual source revision, shot inventory, authority and look once. Do not create six competing scene packages.
2. Develop missing actor cues and supporting tasks in their owning routes. Keep each readable outgoing state available to the next shot.
3. Carry selected decisions into the storyboard and requested visual/temporal prompt. Compare the compiled text with its source; missing behavior is a prompt correction, while an impossible source action goes back to its owner.
4. Review the selected perspectives against every actual shot. For a requested complete review, run the worksheet checker when available. `valid` alone is not completion: inspect `coverageComplete`, `reviewComplete` and `openItems`.
5. Correct findings inside delegated scope, increment the source revision, and re-review changed content and adjacent transitions. Preserve other decisions. If the needed fact is unavailable, deliver the useful draft with the precise unresolved item rather than inventing a pass or repeating an unchanged check.

Keep the displayed result proportionate: for a complete creative package, a short review conclusion is sufficient unless the user wants the matrix. Do not write project records unless file output is requested or already part of the workflow. This Skill remains a document-driven creative workflow, not an autonomous generation loop.

## One shared scene, several checks

Start from the same scene purpose, shot inventory, exact supplied artifact revisions, shared look, spatial anchors, incoming state, and user locks. Mark original design choices as proposals. If the source changes, identify affected rows and review them against the new revision; never carry a pass across changed content silently. Preserve already delegated decisions and authorization: asking for a prompt authorizes drafting it. Only a consequential decision outside that scope needs a question.

| Perspective | Check | Existing owner of a correction |
| --- | --- | --- |
| `direction` | audience access, scene turn, readable relationships and coverage | Story for causality; Direction for staging/viewpoint |
| `performance` | partner-directed task, stimulus, listening and changed action | Character / `PerformanceTimeline` |
| `staging` | supporting tasks, paths, attention, occlusion and reaction offsets | Direction for placement; Character for behavior; Scene for topology |
| `cinematography` | camera access, motivated movement, focus and source use | Direction; Scene for physical sources; Style for representation |
| `prompt` | faithful compilation, missing visible facts and contradictory instructions | Prompt wording; upstream owner when the design itself is wrong |
| `continuity` | outgoing/incoming state, axis, prop possession and revision trace | The domain that owns the mismatched fact |

The perspective discovering a problem is not automatically its repair owner. Resolve conflicts by user locks, upstream authority and scene purpose. A camera choice cannot move a wall or change a character's objective. Do not average conflicting choices or let a majority vote override a hard lock.

## Performance and background activity

For a consequential acting beat, connect the character's task to an observable cue, reception of that cue, a changed action, and an outgoing state. Give the listener time to receive the cue; avoid a reaction that presupposes an unheard line. Select only changes legible at this shot scale. Stable face, breath or posture can remain stable even when the schema requires those fields.

For identifiable supporting figures, record their ongoing task, attention target, available cue, path/zone, reaction order and final state. An indistinct crowd may be organized into readable groups; do not invent individual biographies for every distant silhouette. Stillness, indifference and an empty space can be intentional. Do not add a crowd merely to demonstrate this guide.

Keep background action physically compatible with the scene and subordinate to the focal beat. Test whether its crossing obscures the important handoff, whether its sound masks a line, and whether everyone inexplicably turns together. Change timing or density before adding more activity.

### Worked draft: closing-time repair shop

User premise: an apprentice asks the owner to keep the shop open; the owner keeps sorting keys. A courier is already waiting by the door. No timing, lens or aspect ratio is supplied. The following is a proposed staging treatment, not approved Canon or generated footage.

| Subject | Ongoing task and attention | Cue and changed action | Outgoing state |
| --- | --- | --- | --- |
| Apprentice | hold the repair ticket beside the counter; watch the owner's hand | after the owner says the shop is closing, lay the ticket beside the unsorted keys and wait | empty hand on the counter; ticket remains on the owner's side |
| Owner | sort keys into their existing hooks, looking at labels | finish the key already in hand; then stop before taking the next one and look at the ticket | next key untouched; gaze on the ticket |
| Courier | check the delivery slip at the door | respond only when the owner looks toward the doorway; fold the slip and leave the counter sightline clear | remain by the door; no crossing during the pause |

The focal change is the owner's interrupted routine. A shared view must show ticket, hand and both faces clearly enough to read the pause. If that is impossible in the approved space, propose a detail/reaction pair with the same cue order; do not invent a wider counter. Carry the ticket's location and the unfinished key task into the next shot. Camera movement is optional; matching the look remains mandatory.

### Existing contract handoff

| Decision | Field that carries it |
| --- | --- |
| Stimulus, task and response | `PerformanceTimeline.phases[].trigger/objective/action/gaze/residualState`; use face/breath/posture to describe change or deliberate stability |
| Supporting placement and tasks | `ShotSpec.blocking[]` with a source-bound subject, zones, action, eyeline and contact |
| Background hierarchy | `ShotSpec.composition.background/visualHierarchy` and `audienceAttention` |
| Synchronization | `TemporalSpec` actor/camera/environment tracks referencing the upstream shot; do not add a reverse reference to `ShotSpec` |
| Important behavior surviving compilation | `ShotSpec.promptHandoff.mustPreserve`, then the relevant visual/temporal handoff |
| Story-state transition | `ContinuityLedger.entries` for the owning story facts; shot continuity/end state for the staged transition |

Read each actual schema before emitting JSON. Extra cue tables and the worksheet below are non-canonical working material. A missing exact ref or duration does not justify fabricating canonical metadata; keep a draft. `PerformanceTimeline` interval checks prove only numeric ordering, not the causal meaning of its text or the timing of a real performance.

## Review every shot in the selected scope

Declare the actual shot IDs and source revision before reviewing. Full review has exactly one row for each of the six perspectives and each shot. Focused review names only the requested perspectives and still covers every declared shot. IDs need not be consecutive numbers. Obtain the inventory from the supplied source; a checker cannot detect a shot omitted from both the source declaration and the rows.

Each row needs a criterion, a concrete observation, and one status:

- `pass`: name the design fact and where it is written; a bare approval is insufficient.
- `revise`: locate the mismatch and name one owning domain, smallest variable and acceptance check.
- `unknown`: state the missing information; coverage is recorded but the review remains unresolved.
- `not_applicable`: explain why this perspective has no applicable requirement for this shot. Missing evidence is `unknown`, not an exemption.

Keep different failures as separate notes inside the observation or separate domain repair plans; one worksheet row summarizes that perspective/shot. Apply dependency order when fixes interact. After a revision, invalidate changed rows and adjacent continuity rows; preserve unaffected findings with explicit carry-forward rationale.

### Read-only worksheet checker

Use [check-shot-review.mjs](../../scripts/check-shot-review.mjs) with Node.js 22+:

```text
node <skill-root>/scripts/check-shot-review.mjs <worksheet.json>
```

It is bundled with the Skill and needs no checkout or dependencies. This optional worksheet is not a canonical root contract. Example of a **focused prompt review** using fictional draft data:

```json
{
  "source": { "type": "prompt", "id": "repair-shop-prompt", "version": 1 },
  "mode": "focused",
  "roles": ["performance"],
  "shotIds": ["S1"],
  "reviews": [
    {
      "role": "performance",
      "shotId": "S1",
      "status": "pass",
      "criterion": "The owner completes the current task before responding to the ticket.",
      "observation": "The text places hanging the key before looking at the ticket.",
      "sourceLocator": "prompt v1 / S1 / action"
    }
  ],
  "prompt": { "text": "店主挂好手中的钥匙，再看向柜台上的维修单。" }
}
```

`source.type` is `design` or `prompt`, never media. `mode: full` uses all six roles; omit `roles` in full mode. Focused roles must be a non-empty unique subset of the table above. `reviews` can initially be empty to report missing pairs. All rows require nonblank `criterion` and `observation`; pass/revise also require `sourceLocator`. Revise rows require `repair: { "domain": "character", "variable": "response onset", "acceptance": "The response follows the cue." }`; domain values match the existing CreativeReview domain vocabulary. Other statuses omit `repair`.

Optional `prompt` belongs only to a prompt source. It counts the exact supplied text; set `maxNonWhitespaceCodePoints` only to a user/project limit. There is no universal 5000-character cap. Counting uses Unicode code points after excluding Unicode `White_Space`; punctuation and emoji count, combining characters remain separate, and fences are not stripped. Over-budget text is reported, never truncated or rewritten. The checker does not parse prompt fields or compare cited text with observations.

Output separates `valid` (input consistency), `coverageComplete` (selected role × shot coverage), and `reviewComplete` (valid, full coverage, at least one applicable pass, no revise/unknown rows). An all-exempt worksheet does not claim completion. CLI exit codes are 0 complete, 1 invalid, 2 valid but unresolved. Without Node, do the same review manually and disclose the unchecked arithmetic; a useful draft need not stop.

The result always has `scope: plan_only`. A complete worksheet is not artistic approval, rights clearance, proof of accessible sources, or successful media generation. Use `CreativeReview` or `ControlBenchmarkReview` with accessible observations for actual candidate review; do not translate a plan pass into a media pass.

## Video compilation and continuity

For video work also load [video, sound and delivery](video-sound-and-delivery.md). Compile the selected design into concise time-ordered language: incoming state, triggering cue, subject action, camera/environment response and outgoing state. Preserve speakers and exact dialogue when supplied. A still-image reference supplies visible state, not proof of motion or audio. Do not force temporal instructions into the still-image `PromptRecord` or `ImagePrompt` schemas.

Plain text is a useful handoff when requested; it is not the only allowed output format. A provider dialect needs its own verified compatibility evidence. Unknown duration, aspect ratio and capability remain explicit; a creative proposal may suggest them without claiming user approval or provider support. Under a length constraint, remove repeated appearance/style language before removing cue order, spatial anchors or outgoing state; split at a stable state if needed and within scope.

Keep three linked records in the user's project when requested:

1. **Design/prompt revision:** exact upstream versions, full text or durable file reference, actual count if required, changed variable, review notes and unresolved choices.
2. **Returned candidate:** supplied candidate/Take ID, source prompt revision, accessible file, observed usable interval and failed interval, evidence basis and missing metadata. Do not create a Take entry from a prompt alone.
3. **Continuity comparison:** previous selected interval's outgoing state versus next selected interval's incoming state, mismatch owner and intended transition. Compare the selected edit boundaries, not automatically the source clip's first/last frame.

Preserve valuable performance intervals when proposing edits or inserts, but do not conceal a blocking identity, action or geography error as a stylistic choice. Existing footage can support an editorial repair plan; regenerated media still needs new evidence before passing. Separate observed symptoms from root-cause hypotheses and change one owning variable per repair.

Project taste belongs in project authority; dated provider behavior belongs in capability notes. A promising result is a hypothesis with its source and counterexamples, not a universal rule. Revising this Skill or persistent memory requires an explicit maintenance request. No automatic learning writes occur.

## Design provenance

This independent CineWeave implementation was informed by review of [Leos Six-Department Directing Team Skill v1 at 2ed50ed](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/tree/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4) on 2026-09-16. That snapshot has no LICENSE file. No upstream source, templates, prompt corpus or media are vendored. Its role-based critique and revision-trace ideas are adapted to CineWeave's existing ownership, progressive loading and evidence boundaries; its private case claims are not independently verified here.
