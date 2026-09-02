# Shot lighting

Build a `ShotLightingPlan` from an exact physical `SceneLightState` and optional representational `StyleLightGrammar`.

1. Select the scene source serving as key for this composition.
2. Select physically plausible fill or bounce; do not invent a shadowless beauty light. For an intentional no-fill decision, set `fill` to `null` rather than inventing a source.
3. Use practicals only where Scene placed them.
4. State subject/background exposure relation and highlight/shadow policy.
5. State how visible materials respond.
6. Bind direction, source position and exposure continuity across adjacent shots.
7. Apply StyleLightGrammar only to rendering treatment.

A light source, visual treatment and narrative function are three different fields. “Warm, cinematic, divine” is not a lighting plan. Prefer: “the north window is the soft key; an oil lamp one meter behind the subject creates only a small warm reflection on hair and collar; the key-shadow direction remains unchanged.”

For a 2.5 plan, each non-null light use declares `transport`. Use `direct` for
an unmediated SceneLightState source. Use `bounce` or `transmitted` only with
the exact physical source plus a concrete `viaSurfaceAnchor` such as a wet
courtyard stone, pale wall or frosted window. The anchor describes transport;
it does not grant permission to move, add or repaint a Scene-owned surface.

`ShotLightingPlan` is derived after its exact `ShotSpec` exists and owns the
one-way `shotSpecRef`. Never write a lighting-plan ref back into ShotSpec; a
consumer that needs both binds both exact artifacts.
