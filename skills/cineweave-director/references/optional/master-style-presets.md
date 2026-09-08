# Optional: adaptive master-inspired treatments / 大师风格自动适配

Load when creating or creatively revising shots, scene direction, cinematic style, or sequence rhythm, even when no creator is named. **Automatically match useful mechanisms to the brief; no preset switch, name, or strength setting is required.** Also load for explicit requests to browse, name, combine, adjust, or remove an influence. Adaptation creates an editable draft treatment, not a new identity, location, story, approval, provider setting, or guarantee of fidelity to a creator.

Catalog revision: 2; source research snapshot 2026-09-08. These are original CineWeave interpretations of selected craft ideas, not official artist presets, endorsements, exhaustive career summaries, or copies of film scenes. Credits include collaborators where relevant. Source notes distinguish testimony from our proposed implementation.

## Recognize and adapt

Start from the scene, not a request for configuration. The names and IDs below organize a method library; they are optional user overrides, not required inputs, executable commands, or canonical artifact refs.

| ID | 可选名称 | 适合的创作目标 |
| --- | --- | --- |
| `hitchcock-suspense` | 希区柯克 / Alfred Hitchcock：受控悬念 | 知情差、危险预告、延迟揭示 |
| `kurosawa-ensemble` | 黑泽明 / Akira Kurosawa：群像与行动选择 | 多人关系变化、行动因果、去除装饰镜头 |
| `wong-withheld-intimacy` | 王家卫 / Wong Kar-wai：含蓄亲密与错过 | 未说出口的关系、遮挡、重复中的变化 |
| `anderson-tableau` | 韦斯·安德森 / Wes Anderson，Robert Yeoman：精密画面 | 正面构图、群体秩序、空间喜剧 |
| `cuaron-lubezki-immersion` | 阿方索·卡隆 / Alfonso Cuarón，Emmanuel Lubezki：沉浸长镜头 | 连续空间中的发现、同行视角、现场感 |
| `deakins-source-led` | 罗杰·狄金斯 / Roger Deakins：光源驱动的克制摄影 | 用已有光源组织人物、环境和注意力 |
| `martel-sonic-space` | 卢奎西亚·马特尔 / Lucrecia Martel：声音空间 | 画外事件、主观聆听、悬而未决的时间 |
| `varda-essay-observation` | 阿涅斯·瓦尔达 / Agnès Varda：散文式观察 | 日常物件、个人视角、观察与联想 |

1. **Extract the creative problem:** intended audience experience; who knows what and when; relationship/pressure and observable behavior; usable space/light; medium/duration; existing sequence grammar; and protected facts. Use supplied evidence, not nationality, genre, or the word “cinematic” alone. Do not infer real people's emotions or user tastes from identity.
2. **Find a mechanism, not a personality match:** use the menu to shortlist relevant cards, then inspect their treatment and avoidance checks. For example, privileged audience knowledge may justify controlled disclosure; an unfinished exchange may justify withheld framing; a change of group alignment may justify ensemble blocking. A cue suggests a candidate, not an automatic whole-card assignment.
3. **Filter before adopting:** reject mechanisms that conflict with the approved story, topology, source light, representation, performance locks, medium, or known capability. Missing capability is not support. A still image cannot realize sound or temporal effects. Never invent a reference or source to improve the apparent match.
4. **Compose the smallest coherent treatment:** choose the most useful mechanism for each relevant dimension. Compare contribution to the brief, compatibility with the ongoing sequence, readability, and feasibility. Resolve competing inferred candidates yourself using those criteria; prefer the simpler, less intrusive option when equally suitable. Do not ask the user to choose among inferred presets as a routine step.
5. **Draft and explain briefly:** deliver the requested shot/sequence directly, with a short rationale for consequential choices, e.g. “让观众先发现跟随者，保留人物不回头的动作，因此采用延迟确认与克制的镜头变化。” Mention creator names only if requested or useful; never substitute a list of names for actual direction.

Use only relevant craft dimensions: staging, performance, composition, camera, shot lighting, rhythm, sound. Inherit palette/representation and grading from the shared visual baseline; they are not automatically mixed from the cards. The cards' default dimensions are candidate areas, not an indivisible bundle. Adapt intensity to the scene: small cues for restrained intent; more pronounced geometry, duration, or sonic contrast only when the brief supports it. Natural instructions such as “更克制” or “再夸张一点” suffice; do not present required toggles, numeric weights, or a light/medium/strong questionnaire.

If useful for revision, keep compact human-readable notes: brief cue → chosen mechanism and dimension → card ID/revision if used → preserved facts → rejected conflict or unknown → next check. These are **not additional JSON fields**, computed confidence scores, or provider weights. No synthetic affinity percentage is needed.

## Boundaries and continuity

- **No suitable match is valid.** If evidence is weak or all mechanisms conflict, use neutral craft reasoning and a conservative draft within scope. State the assumption when it matters; do not force a famous name onto every scene or ask a preference question merely to classify it. Ask only when an unresolved hard fact or contradictory explicit requirements prevent a useful safe draft.
- **Explicit instructions still win.** Precedence is approved facts/hard locks → explicit user choices or exclusions → compatible established sequence grammar → automatic per-dimension choices → generic defaults. A named influence may guide the draft, but cannot overrule a locked fact. Conflicting explicit requirements need a focused clarification or separate labeled alternatives; do not silently pick one.
- **Blend by dimension, not by averaging.** Automatically combine different cards when they solve different aspects of the same brief, with one coherent choice per dimension. Resolve inferred camera/tempo conflicts before drafting. Do not stack references to demonstrate breadth.
- **Preserve sequence coherence.** Reassess when a beat, constraint, or medium changes, but do not restyle each shot independently. Keep accepted palette, source logic, camera grammar, and performance continuity unless the story motivates a change. Draft adaptation does not approve a new project-wide StylePackage or silently revise Canon.
- **Mix techniques; keep one look.** Follow [the shared visual baseline](../core/visual-bible-and-continuity.md). Across masters and shots, preserve grading, color-temperature relationships, saturation, contrast/rolloff, material rendering, optical texture, and aspect ratio. A lighting technique must fit that baseline and the actual source geometry. If no look is supplied, establish one provisional shared draft; do not invent a new look per shot. A story-motivated physical change is not permission to silently replace the common grade.
- **Respect request type.** Browsing, explanations, reviews, exact prompt compilation/translation, and validation are not authorization to restyle an existing artifact. Recommend only when that is what was requested. In a single-variable repair, preserve all other passing dimensions.
- **Respect exclusions without a switch UI.** “不要大师风格” means use neutral craft for that scope; “只改构图” limits automatic selection to composition. Removing an earlier treatment preserves subsequent explicit edits. Restore only a known baseline; if none exists, offer a neutral draft without claiming to restore history. Never delete approved artifacts.

## 1. Hitchcock — controlled suspense

- **Default dimensions:** staging, composition, rhythm; camera only when a reveal needs changed access.
- **Draft treatment:** distinguish audience knowledge from character knowledge; establish the consequential object or offscreen cue, then retain access to the unaware person's action. Move or cut on a change of knowledge, not simply to add energy. Use a reaction only when it changes interpretation.
- **Adjust:** before/with/after-character disclosure; how much of the decisive object is initially visible; duration of anticipation; static observation versus motivated reveal.
- **Avoid / check:** not useful when the brief prohibits threat or privileged audience knowledge. Verify that no insert reveals the answer too early and that waiting has a readable object. Do not add a crime, weapon, or surprise ending to fit the preset.
- **Basis:** Hitchcock's [ASC interview](https://theasc.com/article/flashback-hitchcock-talks-about-lights-camera-action/) supports integrated dramatic/technical planning and motivated source light. This suspense configuration is CineWeave synthesis, not a transcription of that interview or a claim about every Hitchcock film.

## 2. Kurosawa — ensemble relations and decisive action

- **Default dimensions:** staging, composition, rhythm.
- **Draft treatment:** separate initiator, witness, and responder across readable planes; let the decisive movement change their alignment. Preserve the cause and consequence of an action, then remove redundant views. Use group gaze, spacing, and a clear pause before a change rather than automatic close-ups.
- **Adjust:** simultaneous versus selective access to reactions; degree of depth layering; pause before commitment; minimum coverage needed for the consequence.
- **Avoid / check:** do not add rain, wind, battle, or new geography as compulsory signatures. If depth hides the key response, simplify the arrangement. The viewer should identify whose action reorganizes the group.
- **Basis:** Donald Richie's firsthand [Throne of Blood account](https://www.criterion.com/current/posts/938-throne-of-blood) describes discarding attractive material that weakened the dramatic effect. The ensemble layout above is an original proposed treatment, not a universal Kurosawa formula.

## 3. Wong Kar-wai — withheld intimacy

- **Default dimensions:** composition, performance, rhythm. Camera effects require their own justification within the common optical/temporal grammar; inherit the palette rather than importing it from the name.
- **Draft treatment:** let an approved doorway, frame edge, or foreground object partially separate two people; make an ordinary shared task carry an unfinished exchange. Repeat an allowed gesture or framing with one changed response. Hold after an interrupted action rather than explain the feeling in dialogue.
- **Adjust:** unobstructed versus partially withheld view; physical separation within the fixed scene; repetition versus progression; length of the unsaid response. Preserve the shared palette, source and costume colors.
- **Avoid / check:** no compulsory neon, rain, slow motion, blur, voiceover, romance, or infidelity. Do not obscure required hand contact or identifying anchors. A change in relationship must remain legible even without color effects.
- **Basis:** the indexed excerpt of Wong's [Cannes 2001 interview](https://kinimatografiko.gr/wp-content/uploads/2010/10/in-the-mood-interview-cannes-2001.pdf) discusses suspense and rhythm in *In the Mood for Love*. The full PDF text was not extractable in this research; this card is a creative interpretation, not an audited reproduction of his method. Do not infer lens, exposure, or effect settings from it.

## 4. Anderson / Yeoman — precise tableau

- **Default dimensions:** composition, staging, camera. Rhythm requires its own narrative justification; palette remains inherited from the shared look.
- **Draft treatment:** build a legible frontal arrangement around an existing axis; give each actor a distinct place or entrance. Prefer a hold, a clear lateral move, or a deliberate redirection to an unmotivated orbit. Use a disruption of the arrangement to carry humor or a change of status.
- **Adjust:** strict versus relaxed symmetry; frontal versus slightly oblique view; static versus lateral movement; regular versus interrupted entrances. Keep the shared palette and material colors even in a highly graphic arrangement.
- **Avoid / check:** do not move fixed walls/doors to manufacture symmetry, force a pastel grade, or change the aspect ratio. If expressive asymmetry or free actor movement is locked, relax or disable the relevant dimension. Check that the arrangement clarifies relationships rather than merely looking tidy.
- **Basis:** Yeoman's [first-person interview with The Credits](https://www.motionpictures.org/2014/12/2014-in-review-dp-robert-yeoman-on-the-grand-budapest-hotel/) describes camera/prop collaboration, color tests, location preparation, and animatics. The card's adjustable defaults are CineWeave's proposed interpretation.

## 5. Cuarón / Lubezki — immersive continuity

- **Default dimensions:** staging, camera, rhythm.
- **Draft treatment:** follow one situated viewpoint through a traversable space, letting foreground events and background consequences coexist. Allow a move to discover a new relation and settle at a defined end state. Keep actor timing and camera/focus tracks separate but synchronized.
- **Adjust:** camera-subject distance; how much environmental action stays visible; duration of uninterrupted access; number of motivated attention transfers. A longer take is not automatically a stronger application.
- **Avoid / check:** a locked cut or unsupported path/duration takes precedence. Offer a cut-based equivalent when a continuous plan is infeasible; never assert model support. Check travel, occlusion, focus, and the critical reaction through the entire plan, not just its hero frame.
- **Basis:** the practitioners' [Children of Men account](https://theasc.com/article/children-of-men-humanitys-last-hope/) discusses immersion, designed lighting, and shortening long takes for rhythm. The preset does not require unlit scenes or unbroken takes at any cost.

## 6. Deakins — source-led restraint

- **Default dimensions:** lighting and composition. This card alone supplies no reason to change camera or palette.
- **Draft treatment:** organize the image around an approved practical or environmental source; protect the most important face, silhouette, or object cue. Let selected background areas recede instead of adding a separate light to every object. Adjust shot use of the source, subject orientation, and background value only within permitted ownership.
- **Adjust:** source prominence; face versus silhouette emphasis; background separation; amount of readable shadow information. Do not equate restraint with globally dark exposure.
- **Avoid / check:** no mandatory rim, teal/orange look, invented fixture, or body/skin recoloring. If the approved source cannot reveal the required object, flag the conflict. Check that the source explains the illumination and the intended cue remains readable.
- **Basis:** [Team Deakins episode 4](https://www.rogerdeakins.com/episode-4/) has a public description about practical-lamp choices and room context. Audio was not audited here. These defaults are our source-led interpretation, not a claim that Deakins uses one look across his work.

## 7. Martel — sonic space and suspended attention

- **Default dimensions:** sound and rhythm. Composition is optional.
- **Draft treatment:** establish a listening perspective; use an offscreen sound to make an unseen relation felt without immediately showing its source. Distinguish environmental sound from subjective association. Let duration change how the same visible activity is understood.
- **Adjust:** known versus uncertain sound location; foreground/background priority; reveal versus continued withholding; length of the listening interval.
- **Avoid / check:** no invented dialogue, threat, or subjective diagnosis. A silent/still-image deliverable cannot realize the sound dimension; leave it out and mark partial application. Check whether the key sound survives competing layers and whether its intended time/space relation is clear.
- **Basis:** Martel's [BFI interview about Zama](https://www.bfi.org.uk/interviews/lucrecia-martel-time-zama) discusses time and sonic space. The proposed controls are not a national style or a fixed slow-tempo prescription.

## 8. Varda — essay observation

- **Default dimensions:** composition, staging, rhythm; consider sound when the brief and medium support an associative listening perspective.
- **Draft treatment:** attend to a person's ordinary activity and an object or place that gains meaning through association. Make the offered viewpoint explicit. For a sequence, connect two observations through a declared relation rather than inventing a dramatic confrontation.
- **Adjust:** person/object emphasis; observed duration; direct versus associative connection; distance of the observer. New commentary or a narrator requires Story/user approval.
- **Avoid / check:** do not rewrite a locked causal narrative, fabricate documentary encounters, or imply consent from a subject's presence. Distinguish staged illustration from actual observation. Check that the association comes from supplied facts or a clearly labeled proposal.
- **Basis:** Varda's [BFI interview](https://www.bfi.org.uk/sight-and-sound/interviews/home-away-with-agnes-varda) discusses personal, documentary, and constructed representation. Our preset proposes an essay grammar, not a replacement for research or ethical access.

## Handoff and example

Names remain in selection/provenance notes. Compile the **selected mechanisms**, not “shot by [name]”, into the appropriate existing artifacts: representation/palette → Style; actor behavior → Character; source changes → Scene proposal; blocking/composition/camera/shot-light → Direction; sequence timing → Storyboard/Rhythm; sound/edit intent → supported temporal/editorial planning fields. Read each schema before emitting canonical JSON.

Representation/palette handoff inherits the shared Style authority; it does not synthesize a new look from a technique card. Only an explicitly requested look revision may propose that change. Include the same look basis across adjacent shots even when their craft influences differ.

Do not force a sequence-level preset into `CinematicSkillManifest` when its owner/target enums cannot express the chosen handoffs. Use a human-readable draft or a correctly owned `WorkflowPlan`. A card is not an exact manifest binding; never fabricate IDs, hashes, or receipts to pretend it was compiled.

Example request: “门厅里三名接待员整齐站着，中间的人一本正经地把钥匙递错了，气氛有点荒诞。已有正面通道和桌旁台灯，人物走位、服装和房间不改，帮我设计这个镜头。”

Expected adaptation: orderly staging and dry spatial humor can motivate frontal composition from Anderson/Yeoman; an existing practical can motivate source-led lighting from the Deakins card if it can reveal the key. Draft those mechanisms without asking the user to enable either preset. Preserve positions, color facts, and source placement; do not add a light or assume the lamp reaches the key. If that light relationship is unknown, mark it for checking and keep the composition proposal useful. Explain the visible choice: “用正面秩序衬托递错钥匙的动作，光线优先保证钥匙和接手关系可读。” Other coherent choices may also satisfy the brief; the named pairing is illustrative, not a required classifier output.

## Behavioral checks

These are manual evaluation cases, not previously passed automated tests. Assess actual choices rather than matching wording:

- “观众先发现跟随者，人物最后才确认，不回头，设计8秒镜头。” → useful disclosure/staging proposal with no preset-selection or strength question; preserves the knowledge order and action lock.
- “两人都想挽留对方，却只谈归还雨伞，帮我拍得含蓄。” → translate subtext into a playable exchange and restrained access; no automatic rain, neon, or invented affair.
- “三名接待员站得整齐，有人一本正经递错钥匙，已有台灯，固定布局，设计镜头。” → coherent per-dimension treatment with source uncertainty preserved; no required creator pairing or new source.
- “做一张无文字静态海报，表现等待，不用声音。” → use only realizable visual choices; no compulsory rhythm/sound mechanism, no fabricated audible output.
- “这个镜头更电影感，但不要改现有构图和运镜。” → do not classify from the adjective alone or change locked dimensions; a conservative remaining-dimension proposal or no suitable preset is valid.
- “原样把这份锁定镜头提示词翻译成英文。” → preserve semantic content; no automatic creative adaptation in exact transformation work.
- “只改构图，不要大师风格，不改服装、走位、光源。” → neutral composition proposal only; explicit exclusion overrides automatic matching.
- “同一镜头必须固定正面机位，同时必须持续跟拍人物绕到背面。” → identify conflicting explicit camera constraints; no silent auto-resolution of the user's hard conflict.
- “上一镜的冷静固定机位已锁定，下一镜只是继续等车，不增加剧情。” → preserve established grammar; no forced new master, threat, or dramatic camera movement.
- “只列可参考的预设，别改方案；然后说明若撤销此前风格，如何保留我后来修改的机位。” → browsing/explanation only; retain explicit edits and acknowledge missing baseline, no artifact mutation or guessed restoration.
- “同一场戏第一镜悬念、第二镜群像、第三镜含蓄告别，调色与视觉统一。” → vary technique by dramatic function, keep a shared look throughout; no per-master palette, grain, contrast, or aspect-ratio switches.
- “还没有视觉设定，帮我设计三个连贯镜头，技巧可混用。” → propose one shared provisional look and reuse it; no invented approval/refs, no preset questionnaire or three unrelated looks.
