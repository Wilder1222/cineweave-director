# Midjourney Aesthetic Profiles

Use this reference for `midjourney_profile_import` and `midjourney_compile`.
It turns a creator's recurring taste and a project's visual system into
explicit, versioned inputs instead of a hidden default setting or a growing
list of adjectives.

## Four control layers

| Layer | CineWeave artifact | Owns | Must not own |
| --- | --- | --- | --- |
| Creator baseline | `MidjourneyAestheticProfile` with `personalization_profile` | the creator's broad recurring aesthetic tendency | a project's Canon, a character identity or a scene fact |
| Project visual system | `MidjourneyAestheticProfile` with `moodboard` | the curated world/project palette, materials, representation and overall visual grammar | one sample's person, logo, costume, location or composition |
| Shot-level evidence | `ReferenceAsset`, `ReferenceBindingSet`, image/style/Omni slots | a declared subject, composition cue, identity anchor or local visual treatment | a global project visual bible by implication |
| Current shot | `MidjourneyPromptPack.variant.promptText` | what happens now: subject, action, scene, viewpoint, light and acceptance | the long-term visual system or identity proof |

Keep the first two layers stable while a pack varies one declared hypothesis.
The prompt therefore describes the current shot rather than repeating a whole
world's aesthetic adjectives.

## Profile lifecycle

1. Route raw images through `$cineweave-reference` before using them as
   Moodboard curation evidence. Record exact `ReferenceAsset` refs, selection
   criteria and exclusions.
2. Import selected prior Midjourney results as `MidjourneyExplorationCase`.
   A case can contribute an allowed palette, material, light, composition or
   negative example, but never becomes a global style rule automatically.
3. Use `midjourney_profile_import` to create or version a
   `MidjourneyAestheticProfile`. A Moodboard must cite curated exact assets;
   a Personalization Profile records its selection-history method instead.
4. Keep a narrow profile purpose. Typical project decomposition is a world
   core plus only the domains that truly need different rules—for example
   character, costume, city or palace. There is no official “right number” of
   source images: include an image only when its retained visual mechanism can
   be named, and split a conflicted collection rather than averaging it.
5. Test a new profile under one neutral fixture with a small declared `--s`
   sweep, such as 50 / 100 / 150 / 200. Change the profile influence only;
   do not change identity, scene and camera at the same time.
6. In every executed result, save the exact resolved `--p` code alongside the
   prompt, model version and other parameters. A profile ID points at its latest
   state; a resolved code is the reproducible snapshot. Return that metadata
   with the original image bytes.

## Provider projection rules

At the 2026-08-30 verification point, Midjourney documents both Moodboards and
Personalization Profiles as `--p` inputs. A Moodboard ID or Personalization ID
can resolve to a versioned code when submitted, so a CineWeave pack requires an
explicit token rather than relying on the account's selected defaults.

- Moodboards are curated image collections intended for a broader project
  aesthetic; Personalization Profiles reflect image selections and suit a
  creator baseline or another deliberately trained aesthetic.
- Both use `--s` / `--stylize`; its documented range is 0–1000 and default is
  100. Treat the value as an exploration variable, not a quality score.
- Moodboards cannot be combined with Style Reference Weight (`--sw`) or Style
  Reference Version (`--sv`). A Moodboard pack may still use a scoped Style
  Reference or Omni Reference when the active model supports it, but omit those
  incompatible parameters.
- Record model compatibility on each profile. The current V7 Global
  Personalization Profile works with V8.2, while a V8-specific profile is not a
  V7 profile. Omni Reference remains V7-only, even though it can be combined
  with Moodboards; split the experiment if version constraints conflict.

Official sources to re-check immediately before execution:

- [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards)
- [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization)
- [Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize)
- [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)
- [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)
- [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)

## Return checklist

For a `MidjourneyAestheticProfile`, return its type/scope, curation evidence,
allowed visual grammar, exclusions, rights state, explicit provider ID or code,
known model compatibility and a re-verification note. Do not include account
names, gallery URLs, credential values, private absolute paths or claims that
Midjourney has already run.

For a `MidjourneyPromptPack`, bind each profile by exact contract ref and an
explicit `--p` ID/code snapshot. Keep profile influence stable across variants,
include the matching token in each `parameterTokens` list, and record the code
that Midjourney returns after the human executes the pack.
