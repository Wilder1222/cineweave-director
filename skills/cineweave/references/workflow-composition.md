# Workflow composition

`WorkflowPlan` is a visible dependency graph, not a hidden multi-agent chain.
Every step names its specialist Skill, route, required contracts, produced
contracts, optional dependencies and human gate.

## Standalone versus composed

- **Standalone** means a specialist can start from a direct natural-language brief and optional references, then produce its own contract.
- **Composed** means a specialist consumes exact approved outputs from other specialists. It still remains directly invocable and must not rely on the router being present.

## Default patterns

```text
one-off prompt
  → cineweave-prompt

one-off shot direction
  → cineweave-director

multi-beat physical action
  → story + character performance + scene interaction
  → cineweave-director action sequence → shot direction + temporal direction → storyboard

reference suitability or reusable reference binding
  → cineweave-reference

story or script scene
  → cineweave-story

reusable character
  → cineweave-character

zero-prompt reusable character
  → cineweave-character explore → prompt comparable candidates → production candidate board → character converge

character keyframe from supplied media with a defined visual system
  → reference → character + style → director → prompt

portrait reference decomposition and reusable prompt
  → reference ingest/review/atomic observations
  → character identity + appearance state + style compile + director shot
  → exact reference binding to those targets
  → prompt compile

story scene with physical interaction
  → story + character + scene + style → director → prompt → production

visual-first AIGC studio
  → CreativeBrief / WorkflowPlan (`studio`)
  → Prompt `midjourney_profile_import` (optional explicit Personalization/Moodboard)
  → Prompt `midjourney_compile` → human runs/selects → Reference ingest/review/bind
  → Character + AppearanceState / Scene + Light / Style + RepresentationBinding
  → Story / continuity → Director action / shot / storyboard
  → Prompt compile → Production recipes / optional WorkflowTemplateProfile / controls / rights / QA
```

ActionSequenceSpec is upstream of ShotSpec. The action step binds exact
CharacterBindings, optional PerformanceTimelines, SceneBinding and interaction
constraints; the shot step selects exact action beat IDs and adds lens, camera
and composition. Never reverse that dependency or treat action design as
production-safety approval.

Do not include Production for a low-risk exploration unless the user asks for a
repeatable asset pack, rights/capability validation or deterministic assembly.
Never create a cycle such as Director requiring Production while Production
requires an unfinished Director output. Split the work into an approval-gated
next phase instead.

The binding step follows target-contract creation because ReferenceBindingSet requires exact target refs. Atomic observations may inform target creation; the later binding records the reviewed precedence, exclusions and rights gates for those exact results.

Keep two branches optional. Insert `character_morphology → morphology_review` only when the user wants an editable reusable face/body design; one beauty portrait may seed a draft but cannot pass the neutral multi-view identity gate. Insert `style_package → representation_binding` only when identity must survive a declared representation change or the selected StylePackage requires it. A one-off prompt under the current representation does not need either branch.

For `studio`, the Midjourney step is an explicit divergence gate, not a hidden
execution call. The user may return several selected images with different
roles; Reference must ingest them before Character, Scene or Style can promote
their observations into a visual bible. Downstream asset tasks should be
independent and retryable, with exact upstream refs and a deterministic board
assembly where a board is requested.
