# CineWeave 拆分依赖审计（2026-10-12）

本报告基于当前工作目录的实际文件，供拆分与编排计划使用。审计范围只读，未改动仓库、未构建或运行创作／供应商，也没有重新声称当前工程测试或媒体质量通过。临时扫描脚本与映射写在 `D:/Temp`。现有 dirty worktree 包含已完成的重构与简化变更，不能以 HEAD 的旧版本代替这份工作树审计。

工作区：`D:/study/projects/cineweave-codex-skills/cineweave-director`。下文的相对路径都以此为根；`resources/...`、`references/...`、`contracts.json` 等短路径以 `skills/cineweave-director/` 为根。

## 1. 结论与实读计数

第一阶段可采用四个公开职责：导演核心、参考分析、平台适配、评审与修复。导演核心仍包含简报／世界、故事、人物、场景、风格、动作、镜头、分镜、供应商中立提示词和非执行制作规划。平台适配只接收 `image_prompt` 内 `PromptProjectionPlan` 的所有权；不能据“平台”一词把整个 `image_prompt` 或 `production_plan` 路由搬走。

| 当前实读项目 | 数量 | 依据 |
| --- | ---: | --- |
| 路由 | 12 | `contracts.json:6–55` 的 routes keys |
| contractKinds／唯一 kinds／routes.produces 合计／index root entries | 均为52 | `contracts.json:56–109`；`resources/contracts/index.json:5` |
| schema 总数 | 54 | 52 root schemas ＋ 2 support schemas；物理 schema 文件数也为54 |
| 参考资料 | 42 | `reference-lifecycle.json:56` 开始的 references：4 core＋12 routed＋26 optional |
| 当前分发文件 | 161 | 调用只读 `createDistributionInventory()`，由 `scripts/validate-repository.mjs:301–337` 生成 |
| 本次遍历的 `$ref` | 1357 | 399跨schema本地引用＋958文档内引用 |
| 唯一跨schema边／未解析的本地文件或fragment | 46／0 | 临时依赖扫描；不是完整正式校验 |

不存在第53个根契约。`WorkflowPlan` 已是52个中的一个，增加 Skill 入口或编排说明不能把它再次计为新root。54是schema文件数，包含2个支持定义，不是54个root。四候选的所有权划分为 **43＋4＋1＋4＝52**。完整机器映射位于 `D:/Temp/cineweave-split-dependency-map-20261012.json`，包含全部root、schema、refs、闭包和源行号。

## 2. 12条路由与52个root的归属映射

以下kind逐字取自当前 `contracts.json`；同一kind仅列一次。保留12条领域route ID，另建kind级owner Skill，才能表达局部路由拆分。route不是Skill调用名称；若只为routes增加单一ownerSkill，`image_prompt` 的2＋1所有权无法表达。

| 当前route | 当前基线参考定位 | root kinds与候选归属 |
| --- | --- | --- |
| `brief_world`（contracts.json:7） | `references/routes/brief-world.md` | `cineweave_codex_creative_brief` → 导演核心<br>`cineweave_codex_workflow_plan` → 导演核心<br>`cineweave_codex_world_bible` → 导演核心 |
| `story`（contracts.json:11） | `references/routes/story.md` | `cineweave_codex_story_brief` → 导演核心<br>`cineweave_codex_beat_sheet` → 导演核心<br>`cineweave_codex_script_scene` → 导演核心<br>`cineweave_codex_continuity_ledger` → 导演核心 |
| `character`（contracts.json:15） | `references/routes/character.md` | `cineweave_codex_character_morphology_spec` → 导演核心<br>`cineweave_codex_character_spec` → 导演核心<br>`cineweave_codex_character_appearance_state` → 导演核心<br>`character_binding` → 导演核心<br>`cineweave_codex_performance_timeline` → 导演核心 |
| `scene`（contracts.json:19） | `references/routes/scene.md` | `cineweave_codex_scene_spec` → 导演核心<br>`cineweave_codex_scene_state` → 导演核心<br>`cineweave_codex_scene_light_state` → 导演核心<br>`cineweave_codex_interaction_constraint_set` → 导演核心<br>`scene_binding` → 导演核心 |
| `style`（contracts.json:23） | `references/routes/style.md` | `cineweave_codex_style_package` → 导演核心<br>`cineweave_codex_representation_binding` → 导演核心<br>`cineweave_codex_style_compile` → 导演核心<br>`cineweave_codex_style_light_grammar` → 导演核心 |
| `reference_evidence`（contracts.json:27） | `references/core/reference-evidence-and-rights.md`<br>`references/routes/reference-evidence.md` | `cineweave_codex_reference_asset` → 参考分析<br>`cineweave_codex_reference_observation` → 参考分析<br>`cineweave_codex_reference_binding_set` → 参考分析<br>`cineweave_codex_asset_alias_registry` → 参考分析 |
| `action`（contracts.json:31） | `references/routes/action.md` | `cineweave_codex_action_sequence_spec` → 导演核心 |
| `shot_direction`（contracts.json:35） | `references/routes/shot-direction.md` | `cineweave_codex_cinematic_skill_manifest` → 导演核心<br>`cineweave_codex_shot_compiler_plan` → 导演核心<br>`cineweave_codex_shot_spec` → 导演核心<br>`cineweave_codex_shot_lighting_plan` → 导演核心<br>`cineweave_codex_temporal_spec` → 导演核心<br>`cineweave_codex_camera_previs_spec` → 导演核心<br>`cineweave_codex_hero_frame_anchor` → 导演核心 |
| `storyboard_rhythm`（contracts.json:39） | `references/routes/storyboard-rhythm.md` | `cineweave_codex_storyboard_sequence` → 导演核心<br>`cineweave_codex_sequence_rhythm_spec` → 导演核心 |
| `image_prompt`（contracts.json:43） | `references/routes/image-prompt.md` | `cineweave_codex_prompt_record` → 导演核心<br>`cineweave_codex_image_prompt` → 导演核心<br>`cineweave_codex_prompt_projection_plan` → 平台适配 |
| `production_plan`（contracts.json:47） | `references/routes/production-plan.md` | `cineweave_codex_render_plan` → 导演核心<br>`cineweave_codex_asset_recipe` → 导演核心<br>`cineweave_codex_board_assembly_plan` → 导演核心<br>`cineweave_codex_editorial_timeline_plan` → 导演核心<br>`cineweave_codex_color_pipeline_profile` → 导演核心<br>`cineweave_codex_control_channel_set` → 导演核心<br>`cineweave_codex_evidence_bundle` → 导演核心<br>`cineweave_codex_capability_profile` → 导演核心<br>`cineweave_codex_capability_resolution_plan` → 导演核心<br>`cineweave_codex_license_profile` → 导演核心 |
| `review_repair`（contracts.json:51） | `references/routes/review-repair.md` | `cineweave_codex_control_benchmark` → 评审与修复<br>`cineweave_codex_control_benchmark_review` → 评审与修复<br>`cineweave_codex_creative_review` → 评审与修复<br>`cineweave_codex_repair_plan` → 评审与修复 |

`image_prompt` 当前包括 `PromptRecord`、`ImagePrompt`、`PromptProjectionPlan`，见 `contracts.json:44–46`。前两者保持导演核心；后者只允许消费精确母稿、参考观察、能力／许可档案，产出适配正文、参数、兼容性状态与人工交接。现有约束见 `references/routes/image-prompt.md:45–49`、`references/core/artifact-control-and-precedence.md:22–28`。

`production_plan` 的10个root全部仍属导演核心；`CapabilityProfile`、`CapabilityResolutionPlan`、`LicenseProfile` 与 `EvidenceBundle` 是非执行制作决策／证据规划，适配消费它们，不自动取得它们的写入权威。具体职责见 `references/routes/production-plan.md:39–59`。尤其第49行明确 `PromptProjectionPlan` 不是供应商选择器、请求、适配器或回执。

## 3. 正式参考分发与shared指南

当前有三个机器权威：`contracts.json#/routes` 管基线路由与产物归属，`reference-lifecycle.json#/references` 管正式分发及加载条件，生成的 `resources/contracts/index.json` 管schema／示例清单；见 `reference-lifecycle.json:4–8,55` 和 `references/core/operating-model.md:31`。目录名core只表示分类，不代表每次必读。routed参考必须由一条route持有，而且loadContext与该route相等，见 `scripts/validate-repository.mjs:443–467`；跨Skill共享与分章节加载须由新的聚合加载规则表达，不能把同一路由基线登记成多个竞争权威。

下表的加载条件是现状，候选所有权是审计建议。shared表示单一维护来源、多消费者，不是新增可激活Skill，也不是在每个Skill手工复制一份指南。

| 正式分发path（reference-lifecycle源行） | 当前lifecycle／loadContexts | 候选维护与消费 |
| --- | --- | --- |

| `references/optional/short-film-creation.md`（:58） | optional／`multi_route`, `story`, `storyboard_rhythm`, `production_plan` | 导演核心 |
| `references/optional/visual-development.md`（:68） | optional／`character`, `scene`, `style` | 导演核心 |
| `references/optional/short-film-example.md`（:77） | optional／`skill_evaluation` | 导演完整示例；开发评估夹具 |
| `references/optional/prompt-detail-standard.md`（:84） | optional／`character`, `scene`, `image_prompt`, `shot_direction`, `storyboard_rhythm`, `production_plan`, `video_sound_delivery` | 导演正文权威；shared 评审完整性标准 |
| `references/core/operating-model.md`（:97） | core／`multi_route`, `brief_world` | 导演编排；shared 任务边界 |
| `references/core/artifact-control-and-precedence.md`（:105） | core／`multi_route`, `contract_output`, `review_repair` | shared 权威／版本／精确引用 |
| `references/core/reference-evidence-and-rights.md`（:114） | core／`reference_evidence`, `rights`, `real_person`, `production_plan` | 参考分析；shared 权利与证据底线 |
| `references/core/visual-bible-and-continuity.md`（:124） | core／`multi_route`, `continuity`, `storyboard_rhythm` | 导演核心；shared 权威与连续性 |
| `references/routes/brief-world.md`（:133） | routed／`brief_world` | 导演核心 |
| `references/routes/story.md`（:140） | routed／`story` | 导演核心 |
| `references/routes/character.md`（:147） | routed／`character` | 导演核心 |
| `references/routes/scene.md`（:154） | routed／`scene` | 导演核心 |
| `references/routes/style.md`（:161） | routed／`style` | 导演核心 |
| `references/routes/reference-evidence.md`（:168） | routed／`reference_evidence` | 参考分析 |
| `references/routes/action.md`（:175） | routed／`action` | 导演核心 |
| `references/routes/shot-direction.md`（:182） | routed／`shot_direction` | 导演核心 |
| `references/routes/storyboard-rhythm.md`（:189） | routed／`storyboard_rhythm` | 导演核心 |
| `references/routes/image-prompt.md`（:196） | routed／`image_prompt` | 导演核心；平台适配仅第45–49、67行的适配部分 |
| `references/routes/production-plan.md`（:203） | routed／`production_plan` | 导演核心 |
| `references/routes/review-repair.md`（:210） | routed／`review_repair` | 评审与修复 |
| `references/optional/semantic-morphology.md`（:217） | optional／`semantic_morphology` | 导演核心 |
| `references/optional/camera-previsualization.md`（:224） | optional／`camera_previsualization` | 导演核心 |
| `references/optional/portrait-natural-human.md`（:231） | optional／`portrait`, `natural_human`, `surface_response` | 导演核心 |
| `references/optional/comic-manga.md`（:240） | optional／`comic`, `manga` | 导演核心 |
| `references/optional/cinematic-patterns.md`（:248） | optional／`cinematic_pattern`, `shot_compile` | 导演核心 |
| `references/optional/shot-design-workbench.md`（:256） | optional／`directing_craft`, `cinematic_pattern`, `shot_compile` | 导演核心 |
| `references/optional/generation-diagnostics.md`（:265） | optional／`review_repair` | 评审与修复；能力问题回流平台适配 |
| `references/optional/video-platform-adaptation.md`（:272） | optional／`video_sound_delivery` | 导演＋平台适配分章节；返回清单供评审消费 |
| `references/optional/tagged-video-nodes.md`（:279） | optional／`video_sound_delivery`, `shot_compile` | 导演核心 |
| `references/optional/video-performance-direction.md`（:287） | optional／`video_sound_delivery` | 导演核心 |
| `references/optional/video-timing-and-handles.md`（:294） | optional／`video_sound_delivery`, `editorial` | 导演核心 |
| `references/optional/master-style-presets.md`（:302） | optional／`master_style_preset` | 导演核心 |
| `references/optional/directing-craft.md`（:309） | optional／`directing_craft` | 导演核心 |
| `references/optional/cinematography-craft.md`（:316） | optional／`cinematography_craft` | 导演核心 |
| `references/optional/editing-sound-craft.md`（:323） | optional／`editing_sound_craft` | 导演核心 |
| `references/optional/film-craft-study.md`（:330） | optional／`craft_study` | 导演核心 |
| `references/optional/midjourney-projection.md`（:337） | optional／`midjourney` | 平台适配 |
| `references/optional/video-sound-and-delivery.md`（:344） | optional／`video_sound_delivery`, `editorial`, `color` | 导演核心 |
| `references/optional/drafts-and-change-impact.md`（:353） | optional／`draft_revision` | shared 编排／修订／恢复；评审提出影响 |
| `references/optional/ensemble-direction-and-review.md`（:360） | optional／`ensemble_review` | 导演调度＋评审工作表分章节 |
| `references/optional/rendering-quality-workflows.md`（:367） | optional／`style`, `shot_direction`, `production_plan`, `review_repair`, `camera_previsualization`, `color`, `surface_response` | 导演制作规划；评审共享实际验证标准 |
| `references/optional/aigc-control-and-evaluation.md`（:380） | optional／`image_prompt`, `production_plan`, `review_repair` | 导演控制设计＋平台方言＋评审对照分章节 |

应集中维护的最小shared内容：默认中文与准确文案保留；用户事实／可撤销草稿／canon／观察／批准的不同来源；独立任务隔离；精确kind-ID-version-hash和单向版本依赖；非执行／证据等级；连续性与修订影响；参考角色／权利底线。当前定位分别为 `SKILL.md:37–42,59`、`references/core/operating-model.md:9–15,29–31,79–81`、`references/core/artifact-control-and-precedence.md:5–38`、`references/core/visual-bible-and-continuity.md:20–32,46–62`、`references/core/reference-evidence-and-rights.md:3–39`。

不能按文件名直接归属的平台／评审混合资料：

| 现有文件 | 应按章节分开的权威 |
| --- | --- |
| `references/routes/image-prompt.md` | 7–43行的事实编译与复制稿留导演；45–49行适配及67行对应产物交接由平台适配持有 |
| `references/optional/video-platform-adaptation.md` | 49–153行参考职责、模式选择、导演方案和分镜板主要由导演维护；5–47行能力来源／日期及154–180行平台方言／兼容／复制闭合主要由适配维护；168–172行实际返回清单供评审消费。具体段落仍需精读切片，不是按行截断直接搬迁 |
| `references/optional/aigc-control-and-evaluation.md` | 5–27行控制与参考职责由导演维护；43–51行平台方言／归档能力由适配维护；29–41行编辑结果保留与53–71行实际对照评审由评审维护 |
| `references/optional/ensemble-direction-and-review.md` | 15–62行调度、表演和现有契约交接留导演；63–112行六视角覆盖与只读评审工作表归评审；114–128行视频编译连续性仍由导演承担 |

第一阶段可先保留完整文件的单一物理来源，索引限定哪些Skill在哪些条件读取哪些章节；在行为回归确认后再物理提取。不要把能力研究、视频模式选择、表演、剪辑余量全部合并成“平台适配”。

## 4. `$ref`闭包与结构／语义依赖

当前所有跨schema `$ref` 都在同一 `resources/contracts/schemas/` 目录内。校验拒绝远程、绝对、反斜杠、查询串、`../` 越界路径及未登记schema，见 `scripts/validate-repository.mjs:365–393`。简单搬文件后用 `../sibling-skill/...` 修补引用会违反现有约束。

| 候选Skill | 拥有root | 仅按schema `$ref` 计算的闭包 | 跨所有权root依赖 |
| --- | ---: | ---: | --- |
| 导演核心 | 43 | 46个schema | `reference-observation.schema.json`；加 `common.schema.json`、`reference-transform.schema.json` 两个support |
| 参考分析 | 4 | 5个schema | 无；另需common support |
| 平台适配 | 1 | 4个schema | `reference-observation.schema.json`；另需common、reference-transform support |
| 评审与修复 | 4 | 5个schema | 无直接跨root `$ref`；另需common support |

此表是闭包，不是root所有权表；依赖schema可供结构校验，但不因此获得该kind的创作权限。shared schema的语义权威仍只有一个，分发复制若必要必须由构建派生、校验字节与版本，不能手工独立演化。

全部非common的直接跨schema关系：

| 消费schema与源行 | 被引用schema |
| --- | --- |
| `scene-binding.schema.json:107` | `interaction-constraint-set.schema.json#/$defs/interactionConstraints` |
| `reference-binding-set.schema.json:74,236` | `reference-observation.schema.json#/$defs/role` |
| `storyboard-output.schema.json:667,715,718` | CharacterBinding、SceneBinding、InteractionConstraintSet |
| `prompt-record.schema.json:124,349,352` | ReferenceTransform、ReferenceObservation.role |
| `image-prompt-output.schema.json:50,56,168` | ReferenceTransform、CharacterBinding、SceneBinding（进而InteractionConstraintSet） |
| `prompt-projection-plan.schema.json:228–229` | ReferenceTransform.referenceObservationRef、ReferenceObservation.role |

**语义闭包大于schema闭包。** `scripts/validate-output.mjs:1177–1190` 依据同一索引查找上游kind并校验实际契约结构，`1197–1224` 解析精确母稿、能力、许可、可选能力决策及参考观察，`1249–1255` 也让镜头编译和能力决策使用这一解析器。独立适配包只包含4个schema会丢失上游结构校验。适配的源引用类型见 `prompt-projection-plan.schema.json:168–189`。若涵盖两种可声明母稿kind，其可用结构校验需要的扩展本地schema闭包达12个：Projection、PromptRecord、ImagePrompt、CapabilityProfile、LicenseProfile、CapabilityResolutionPlan、ReferenceObservation、CharacterBinding、SceneBinding、InteractionConstraintSet、common、ReferenceTransform。这里仅指出分发依赖；`ImagePrompt` 现有wire schema缺规范ID／版本，`scripts/contract-context.mjs:3–9` 显式保留这个限制，拆分不得暗中扩展它的规范身份语义。

因此优先保留插件级聚合契约清单／注册表与共用验证内核，Skills只声明拥有的outputs、接受的inputs和可读取的知识。确需每Skill独立分发时，先设计可闭合的派生schema包和聚合上下文校验策略；不能只按owns过滤index.contracts。

## 5. 不宜拆开的紧耦合证据与story/assets后续判断

| 紧耦合 | 当前源码证据 | 拆分风险／边界 |
| --- | --- | --- |
| 故事因果与共享状态 | `references/routes/story.md:15–17,21–29,39`；`references/core/visual-bible-and-continuity.md:23–27,48–56` | 节拍改变认知、持有、位置、关系，必须与人物、场景、动作同一连续性台账对齐；story可独立结束任务，但独立Skill尚需窄输入输出和回流测试 |
| 人物资产包含表演，镜头消费其因果阶段 | `references/routes/character.md:9–14,32–38`；`shot-spec.schema.json:278` | 把人物当静态资产移走会把PerformanceTimeline与镜头／声音配时分离；摄影机不能反写表演 |
| 场景绑定包含实际互动约束 | `scene-binding.schema.json:107`；`storyboard-output.schema.json:715–718`；`references/routes/scene.md:17–19,33` | 触及空间、伸手接触、遮挡和尺度时，需要先改场景／走位；提示词或裁切无法修复地理矛盾 |
| 身份、场景直接进入分镜与提示词结构 | `storyboard-output.schema.json:667,715`；`image-prompt-output.schema.json:56,168`；`references/routes/style.md:37–39` | assets不是独立图库：消费精确版本的bindings，表现映射不得改变canon。拆出去会扩大跨Skillschema与版本协调 |
| 动作多节拍与镜头选中节拍不可分离 | `references/routes/action.md:11,27–31`；`shot-spec.schema.json:50–53,334–335,476–480` | ShotSpec只能选择既有beat ID，promptHandoff完整保留选中动作；不能由新“提示词Skill”重新发明动作 |
| 镜头、分镜和节奏的精确上下文 | `references/core/artifact-control-and-precedence.md:20–21`；`scripts/validate-output.mjs:932–977` | 节奏校验会直接读同目录storyboard-output schema、核对真实上游hash/ID/version和完整顺序；暂不拆shot/storyboard/rhythm验证 |
| 四层光照与共同视觉基线 | `references/core/visual-bible-and-continuity.md:30–44` | 场景定义物理光源，导演选择用途，风格规定表现，提示词编译可见后果；“资产Skill”若包揽灯光会形成竞争写权威 |
| 全局制作工作流与root唯一归属 | `workflow-plan.schema.json:26–49`；`scripts/validate-output.mjs:733–791` | WorkflowPlan检查route输出所有权、已完成依赖和上游producer；局部route registry会丢全局链，不应各Skill维护独立工作流账本 |

建议第一阶段保持story与assets在导演核心中，先拆最清楚的“观察证据／平台方言／独立评审”职责。后续story独立有较清楚的内容边界：`story.md:3,23,35` 明确因果与可表演剧本，不写摄影机或供应商语法；若大量任务只需剧本，可基于完整因果状态交接与行为评估再独立。assets比story更耦合：character／scene／style跨身份、外观、表演、尺度、物理光、表现和镜头绑定，宜先保留导演内部专题模块；若后续独立，应完整保留canon／state／binding／performance层，而不是只拆人物／场景提示词文件。

## 6. 现有单Skill假设的精确迁移清单

| 当前文件／行号 | 现有假设 | 后续计划需处理 |
| --- | --- | --- |
| `skills/cineweave-director/SKILL.md:2–3,12–25,48,59` | 入口覆盖所有route；适配／评审隐含在同一个入口 | 保留导演编排入口，增3个窄入口；明确outputs与转交条件，避免四入口description重复触发 |
| `references/core/operating-model.md:3,19,23–31`；`references/routes/brief-world.md:9` | 内部route不是兄弟Skill；WorkflowPlan不调用另一个Skill | 计划实施时改为显式职责/交接；编排继续由同一任务协调，不能把role表当自动并行代理 |
| `contracts.json:3,6–55,56–109`；`reference-lifecycle.json:3–8,55–56`；`resources/contracts/index.json:2–5` | 单Skill身份、12route、kind→domain、唯一分发catalog | 引入聚合catalog及kind级ownerSkill，保持domain与可激活Skill分离；生成各窄入口视图 |
| `scripts/generate-contract-index.mjs:11–14,16–29,84–95,141–147` | 固定skillRoot；52root对应一索引；两support硬编码 | 参数化受审计catalog，不按目录自由发现；输出一致的全局ownership/index，再派生所需闭包 |
| `scripts/validate-repository.mjs:13–32,45–94` | 单SKILL_PREFIX、固定12route/context、分发basefiles固定在一Skill | 用受审计Skill registry列举入口、资料、脚本与依赖；保留明确白名单与闭包安全 |
| `scripts/validate-repository.mjs:301–337,365–393` | 单catalog生成分发；所有schema同目录且禁../ | 先定聚合资源布局和可封闭分发，保留本地解析安全；不直接放宽为任意兄弟目录 |
| `scripts/validate-repository.mjs:413–474` | 全manifest必须同skill；routed参考唯一route owner；index与kind顺序精确相等 | 保留route/kind唯一所有权，补kind→Skill和reference→consumer/section，不形成第二机器权威 |
| `scripts/validate-repository.mjs:560–604,672–687,740–748` | Plugin/package/marketplace/Skill名字相等；一个agent对应plugin界面；skills/必须恰好一个目录 | 区分插件与Skill身份，逐Skill验证frontmatter/agent；删除length===1约束但保持显式受审计名单 |
| `scripts/build-plugin-bundle.mjs:40,48,51–78`；`scripts/validate-repository.mjs:783–794` | 默认bundle名固定，但从inventory拷贝并做全量字节一致 | 默认bundle目录可沿用插件名；重点扩展inventory，维持安装闭包与byteIdentical |
| `scripts/validate-output.mjs:578–604,660–667,733–791,1145–1189` | route authority必须skill=cineweave-director；按schema深度找同一Skill根目录；index只认原身份 | 绑定受审计聚合catalog，仍核对精确领域route所有权；同时定位分发上下文的索引，不靠暗中latest |
| `scripts/validate-output.mjs:956–958,1197–1224,1249–1264` | rhythm直接加载同目录storyboard schema；适配/能力/镜头上下文用同一完整index | 保留共享上下文验证内核和完整依赖，不把每入口输出白名单当验证依赖白名单 |
| `scripts/canonical-json.mjs:3–4` | 开发共用基础解析器来自唯一Skill脚本目录 | 基础解析器单源维护，构建产生必要分发；避免搬parse-json导致开发内核与安装工具漂移 |
| `tests/build-plugin-bundle.test.mjs:41,66–85,163–186,222–234` | 测试只读一个Skill目录，固定12/52，agent=plugin界面 | 遍历受审计Skill名单；保留聚合12/52，新增kind所有权无丢失／重复与分章节消费测试 |
| `tests/bundle-smoke.test.mjs:28–29` | bundle复制后只测一个helpers目录 | 在隔离安装目录验证各入口所需只读工具和共享依赖闭包 |
| `tests/contract-context.test.mjs:9`；`projection-integrity.test.mjs:8`；`shot-compiler-context.test.mjs:9`；`validate-output.test.mjs:11` | 全契约fixture从单Skillcontracts根加载 | fixture绑定聚合契约authority；新增跨Skill真实body/hashes与缺schema/缺input的反例 |
| `tests/change-impact.test.mjs:9`；`check-shot-review.test.mjs:8,123,147,191`；`check-delivery.test.mjs:3,91,213–215,238,290`；`reliability.test.mjs:10,61`；`video-return.test.mjs:9–10,135` | checks及引用资料位置固定 | 随脚本维护权与分发闭包迁移相应imports，不改变原检查的证据等级 |
| `.codex-plugin/plugin.json:2–6,30–39`；`.agents/plugins/marketplace.json:2,8–14`；`package.json:2,17`；`.github/workflows/validate.yml:40` | 插件与开发包主标识、marketplace immutable ref、固定bundle路径 | 推荐保留一插件发布四Skill；更新入口描述、版本与发布证据。marketplace一个plugin不是“一Skill”的平台限制，不能误改成四插件 |

**无需因四Skill机械改动的协议点：** `.codex-plugin/plugin.json:30` 现有 `skills: "./skills/"` 已暴露目录。当前阻断多Skill的是本仓库 `scripts/validate-repository.mjs:748` 的显式单目录要求以及身份／界面绑定，并不是manifest目录入口本身。marketplace的一插件发布方式可以继续使用，仍应固定受审计发布tag。

## 7. 供主计划采用的实施顺序与回归范围

1. 固定当前dirty成果的基线和聚合52kind清单，先提交／保存现有重构的清晰切片；本审计不执行这一步。
2. 先引入受审计的kind所有权／Skill入口／reference章节consumer映射，生成global index与分发；保留当前route ID、root kind与schema语义。
3. 新建参考分析、适配、评审三个窄入口；导演入口协调多阶段，单项任务可以直接命中专业入口。先保持shared源文件，验证按需加载，再考虑物理分离。
4. 保留公共结构/精确上下文/版本/哈希内核。任何独立分发包先证明schema及上下文闭包，之后改构建与隔离安装验证。
5. 跑工程回归：聚合12/52不丢不重、43/4/1/4 ownership、42 references无失配、未知kind与越界refs拒绝、source artifact exact body/hash解析、旧样例语义、复制稿闭合、镜头/节奏与修复回流、source/bundle字节一致。
6. 跑行为回归：单图不加载全套、剧本仅story完成、参考身份/服装角色不串、指定平台仅适配、不指定平台保留通用中文稿、评审引用实际证据、同一项目继承、独立案例隔离、多阶段恢复与局部根因回流。工程测试不证明生成媒体质量；后者仍需实际媒体与限定范围评审。

本报告仅完成当前源依赖审计与迁移规划依据；未实施拆分、未更改任何发布元数据、未跑收费制作、未获得新的媒体证据。正式计划还需与最新官方Skill／插件及编排文档对照，由主任务整合外部调研。

