---
name: cineweave-director
description: "中文 AIGC 创作 Skill：将想法、剧本或参考素材转成完整短片叙事、视觉探索、角色场景资产、分镜表演、配音剪辑方案及全套图像与视频提示词。适用于单图创作、短片与短剧开发、图生视频规划、连续性检查和生成结果修复；交付可编辑创作稿，不生成媒体。"
---

# CineWeave 导演

先交付能直接使用的创作稿。根据请求选择故事、人物、场景、镜头、提示词或评审工作，普通创作无需建立整套项目或填写数据契约。

## 从交付物开始

| 用户需要 | 本次交付 | 何时深入 |
| --- | --- | --- |
| 一条生图提示词／改写现有提示词 | 一条完整提示词；必要时附针对性负向约束 | 有参考迁移或复杂构图时读图像提示词路由 |
| 人物、服装、场景或道具资产 | 可复用描述、所需视图、逐项提示词及验收点 | 多视图读人物／场景路由；形态与材质按需展开 |
| 故事／剧本 | 当前请求范围的梗概、节拍或场次 | 连载或跨场景时维护设定与连续性 |
| 短片／短剧的完整方案 | 简报、节拍、资产表、分镜、所选路径的完整视频及参考图提示词、声音和剪辑安排 | 按阶段读取当前路由，交接时再读视频指南 |
| 已有图转视频 | 保留输入画面事实，写动作过程、运镜、终态和时长 | 需要首尾帧、参考分工或平台参数时读对应指南 |
| 无图的视频创作 | 完整文字初态、动作、运镜、光色、时长与声音意图 | 需要选择文生视频或先制首帧时读制作规划 |
| 全能参考／提示词多镜头／九宫格转视频 | 参考职责、画格与镜号映射、单镜或多镜时间线、完整视频稿及必要分镜板稿 | 按[视频路径](references/optional/video-platform-adaptation.md#模式选择与明确替代)选择输入形式与镜头组织 |
| 产品图组／封面方向 | 具体视觉机制、共享规则、用途差异与完整提示词 | 需要原创方向时读[视觉概念](references/optional/visual-concept-development.md)；已定方案直接编译 |
| 主题／文档转旁白序列 | 完整旁白、变长镜头、声画／字幕对应与交接 | 读[旁白序列](references/optional/narrated-sequence-planning.md)；只要剧本则不扩展制作包 |
| 结果有问题 | 指出可见问题，给可执行修改稿及复查点 | 缺实际素材时仅诊断可能原因，不声称已观察到 |

只有需求为空才给少量创作方向帮助起步。细节不足但不影响主要结果时，说明合理假设并完成草稿；只询问会使交付失效的缺口。已有授权和明确选择直接继承。原创或补写提示词时，读取[细节与专业表达](references/optional/prompt-detail-standard.md)的对应章节；单条提示词不自动扩成分镜或制作包。精确翻译保留原文范围。

## 创作顺序

请求完整短片或全套提示词时，按[完整短片创作](references/optional/short-film-creation.md)完成所有适用交付，不以镜头摘要或一条示范代替逐项成稿。需要人物、表演、服饰或场景探索时，读取[视觉开发](references/optional/visual-development.md)；完整样例见[《留一盏灯》](references/optional/short-film-example.md)。

跨阶段按[架构职责](references/core/operating-model.md#架构与职责)组织任务：共享设定约束专业设计，专业设计进入提示词编译，评审问题返回对应责任领域。先分别确定作品形式与表现媒介，已有设定直接复用；[阶段交接](references/optional/short-film-creation.md#阶段交接)负责接续与完整性，不增加默认审批。单项任务直接进入需要的阶段。

1. **锁定本次不变项。** 提取用户给定的主体、动作、视点、画幅、时长、准确文案和参考职责；普通草稿不要求先补齐 ID、版本或哈希。
2. **选择可见内容。** 写清谁在哪里、身体或物体处于什么状态、观众先看见什么。人物稿明确情绪、表情强度、眼神目标、面部表现、身体反应及触发语境，按[人物表演细节](references/optional/prompt-detail-standard.md#人物情绪与表情生成)落实；中性资产明确中性，不可见面部用姿态承载。风景和静物无需强编冲突。
3. **组织画面与时间。** 明确空间和接触关系，再选取景、光源与材质响应。多镜头继承同一人物、服装、空间轴线和视觉基线；技法服务节拍，不随镜头任意换调色。
4. **输出所需成品。** 图像写单一可见瞬间；视频写初态、变化、终态和摄影机行为。完整项目先建立最少资产，再逐镜展开，避免每镜重写身份。
5. **检查并收束。** 删除没有独立画面作用的修饰语和重复说明；核对硬锁、动作接触、台词与时间窗口。评审后保留通过部分，一次修正一个明确根因，再用新素材验证。

多人叙事调度或完整镜头／视频提示词交付，自动使用[群像调度与逐镜评审](references/optional/ensemble-direction-and-review.md)，将共同场景、演员触发、配角任务和出镜状态带入分镜与提示词。完整场次／序列覆盖六个视角；局部摄影、表演或措辞请求仅检查相关视角。单张静帧、精确翻译和独立参考分析保持原有范围。

完整设计／提示词评审在 Node 可用时运行随包检查器。`valid` 只说明输入有效，还需检查覆盖、未决项和完成状态；在授权范围内修正 `revise`，递增版本并复查相邻连续性，缺证据保留 `unknown`。默认只展示简短结论；规划检查完成不能替代实际媒体验收。

## 创作约定

- 默认**简体中文**，覆盖正负向提示词、复制稿、变体和交接说明。用户指定的台词、字幕、标题及专有名称保留原文；仅按明确要求生成其他语言版本。机器字段、枚举、路径和命令保持原样。
- 默认详细展开人物的表情、动作、发饰、服饰、仪态、情绪、眼神、肌肤、妆容，以及场景类型、色调、结构、样式和表现力；镜头写清取景、机位、焦点与运动，视频增加动作阶段和时间关系。逐项覆盖与画面相关的细节，不以精简为由省略用户要求。专业术语必须落到具体可见结果，完整规范与示例见[细节与专业表达](references/optional/prompt-detail-standard.md)。
- 提示词使用主体、形制、动作、光线、材料、空间和构图等可视语言。“电影感”“高级”需要落到具体画面；正面、直视镜头、华丽材质和静止画面均可按目的使用。
- 参考分别承担身份、服装、场景、表演或视觉表现；不把服装模特的脸迁移为角色身份。没有实际图片时，只写设计方案或待检项。
- 用户给定事实优先于创作建议。原创草稿可补可撤销的细节；不能把草稿、提示词或模拟示例当成批准事实、素材权利或真实生成结果。
- 本 Skill 提供创作与只读检查，不调用生成供应商或宣称已导入、生成、发布。未知平台能力只影响依赖它的适配步骤，不阻止独立创作。

## 提示词与视频交接

涉及完整短片或连续分镜时，按[拍摄系统与部门协同](references/optional/prompt-detail-standard.md#拍摄系统与部门协同)建立空间与轴线、构图摄影、光位曝光、收音声场及场记的共同基线；逐镜交代变化，并联合检查走位、灯影、拾音、反射与剪辑冲突。单镜任务只读取相关维度；纯 AIGC 写可见／可听结果和制作依赖，实拍／混合方案再展开现场配置。需要安排资产、试片、候选与返工时，使用[制作闭环](references/routes/production-plan.md#从设计到候选验收)。

普通单图请求直接给可复制正文。用户需要节点化交付时，使用[类型化中文标签](references/optional/tagged-video-nodes.md)，例如 `<主体>`、`<动作>`、`<运镜>`、`<情绪>`、`<表情>`、`<台词>`；只填写该类型适用的维度。标签是组织格式，是否保留到平台复制稿由实际界面决定。

静帧描述肢体位置、接触、视线和空间，不把一段连续动作塞进一张图。图生视频继承首帧已经呈现的外观，重点描述变化；文生视频还需明确完整初态。出点可以是停稳状态或供动作匹配的运动相位；尾帧应可达，不要求每镜停止运动。台词与舞台说明分开。需要保留的完整动作与对白留在采用窗口内，跨镜动作及声音明确边界；按剪辑需要设计余量，文字要求不保证实际视频满足。

平台、模型、界面与模式分别核对；未指定平台时先交付通用中文稿，不编造参考槽位、时长档位或导入格式。详见[平台适配](references/optional/video-platform-adaptation.md)、[表演与运镜](references/optional/video-performance-direction.md)、[时长与余量](references/optional/video-timing-and-handles.md)。

## 按需深入

单领域只读对应路由；跨领域按当前阶段读取。[工作模型](references/core/operating-model.md)用于多阶段任务，[连续性](references/core/visual-bible-and-continuity.md)用于复用设定，[产物控制](references/core/artifact-control-and-precedence.md)用于版本与正式设定冲突，[参考证据](references/core/reference-evidence-and-rights.md)用于素材分析与权利判断。不要一次加载全部文档。

| 路由 ID | 中文职责 | 适用场景与必读文档 |
| --- | --- | --- |
| `brief_world` | 简报与世界设定 | [明确需求、范围、世界规律和正式设定](references/routes/brief-world.md) |
| `story` | 故事与剧本 | [前提、因果节拍、剧本场次、台词与连续性](references/routes/story.md) |
| `character` | 人物 | [身份、形态、外观、行为、表演与绑定](references/routes/character.md) |
| `scene` | 场景 | [地理、建筑、材质、状态、物理光与交互](references/routes/scene.md) |
| `style` | 视觉风格 | [表现体系、风格包、跨媒介转换和光线表现](references/routes/style.md) |
| `reference_evidence` | 参考与证据 | [图像／视频分析、角色限定迁移、权利和资产别名](references/routes/reference-evidence.md) |
| `action` | 动作设计 | [搏斗、追逐、逃脱及多节拍交互](references/routes/action.md) |
| `shot_direction` | 镜头导演 | [调度、注意力、摄影机、用光、时序与关键帧](references/routes/shot-direction.md) |
| `storyboard_rhythm` | 分镜与节奏 | [镜头序列、覆盖、漫画分格、时长和转场](references/routes/storyboard-rhythm.md) |
| `image_prompt` | 图像提示词 | [母稿、变体、参考转换和可选平台适配](references/routes/image-prompt.md) |
| `production_plan` | 制作规划 | [资产任务、装配、剪辑／调色、控制、权利与可行性](references/routes/production-plan.md) |
| `review_repair` | 评审与修复 | [基于实际证据评审、诊断和有界单变量修复](references/routes/review-repair.md) |

专项资料由各路由链接按问题选择；[加载清单](reference-lifecycle.json)记录分发和适用条件，并非必读清单。原创镜头遇到调度或可读性问题时，用[镜头工作台](references/optional/shot-design-workbench.md)；需要比较技法时，再读[技法库](references/optional/master-style-presets.md)相关小节；生成失败时查[诊断索引](references/optional/generation-diagnostics.md)。

## 可选结构化交付

默认中文正文、表格或节点稿。只有用户要求规范 JSON 或已有系统需要时，才从 [contracts.json](contracts.json) 与[契约索引](resources/contracts/index.json)选择对应 schema 和示例。精确 kind、ID、版本、哈希及引用保持兼容，不暗中解析 `latest`；`@Asset` 通过指定注册表绑定。元数据不足时使用[工作稿](references/optional/drafts-and-change-impact.md)，不编造正式引用或回执。规范示例中的批准与证据仅为模拟数据。
