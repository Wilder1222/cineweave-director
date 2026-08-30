# Cinematic template import

Use this guide for an imported Chinese or bilingual template that groups a
short-form live-action, anime or manga brief into global settings, timed shot
beats, lighting and sound. The template is an authoring surface, not a second
creative contract and not a provider-specific execution recipe.

## Import boundary

`prompt_import` preserves the supplied `sourceText`, then normalizes the
semantic parts into a versioned `PromptRecord`. It does not claim that the
source prompt generated media, that a camera or film stock was actually used,
or that a model can honor every technical or audio value.

Keep the following distinction visible:

| Imported concern | Canonical owner | Import treatment |
| --- | --- | --- |
| Why the shot exists, audience attention and changed state | Story + Director | Preserve as purpose and shot intent; do not invent story causality. |
| Live action, anime or manga representation, palette, grain and grade | Style | Convert to semantic style atoms or an exact `StylePackage`/`StyleCompile`; keep representations as separate variants. |
| Character identity, skin, makeup, hair, wardrobe and accessories | Character | Keep as scoped upstream facts or unresolved variables; do not replace them with global negatives. |
| Scene, geography and physical light sources | Scene | Bind exact `SceneLightState` facts; a color temperature is not a light source by itself. |
| Shot scale, lens, blocking, focus and composition | Director | Compile into `ShotSpec` fields after purpose and blocking are resolved. |
| Timed action, camera curve, focus, secondary motion and edit bridge | Director | Hand off to `TemporalSpec` or `Storyboard`; preserve start, peak, stop and stable end state. |
| Canvas, resolution, frame rate, duration, codec and adapter limits | Production | Keep as technical intent until a `CapabilityProfile` and `RenderPlan` verify it. |
| Ambient sound, effects, dialogue and music intent | Storyboard/TemporalSpec today | Keep as `soundEdit`/`soundBridge` semantics. dB, mixing, lip-sync and audio delivery are not generic prompt guarantees. |

## Normalization rules

1. Preserve the original source text before rewriting it. Mark an adapted or
   transcribed source as adapted and keep any transcription uncertainty visible.
2. Split “global settings” into representation, delivery, character, scene,
   physical-light and constraint scopes. Do not repeat one flattened block in
   every shot.
3. Treat camera-body names, film-stock names, grain and halation as optional
   capture/look hypotheses unless supplied as exact production facts. Compile
   the observable perspective, depth and tonal response first.
4. Turn `[start–end seconds] + camera + scene + subject + action + constraint`
   into shot variables. The prompt record may retain these variables, but the
   approved values belong in `ShotSpec`, `TemporalSpec` and `Storyboard`.
5. Keep one dominant camera idea per shot. A menu of static, dolly, truck, pan,
   tilt or arc is an authoring aid, not permission to stack unrelated moves.
6. Express light as source, direction, exposure relation, shadow behavior and
   material response. Keep style color treatment below physical light.
7. Convert universal negatives into scoped `must preserve`, `may vary` and
   targeted `must avoid` rules. A full-body constraint is only relevant when
   the requested framing makes the body visible.
8. Route exact audio levels or timing to Production only after the selected
   adapter declares and evidences those capabilities. Unknown hard capability
   remains blocked; it is never silently downgraded to a prompt adjective.

## PromptRecord shape

The normalized record should contain:

- `sourceText`: the supplied template text, unchanged where possible;
- `prompt.blocks`: concise semantic blocks for subject, action, composition,
  camera, lighting, style, technical delivery and scoped constraints;
- `variables`: shot and representation inputs, with defaults clearly marked as
  suggestions rather than hard locks;
- `styleBinding`: one inline semantic style or one exact style contract, never a
  live-action/anime/manga mixture;
- `variants`: one declared change per representation or look variant;
- `evaluation`: acceptance checks and known risks, including unresolved
  capability or audio delivery requirements.

The accompanying `PromptRecord` example demonstrates this shape. It is an
import/compilation asset; it is not a `ShotSpec`, `TemporalSpec`, `RenderPlan`
or evidence that media was generated.
