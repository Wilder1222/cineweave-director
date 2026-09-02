# CineWeave Director Skill 深度审阅与增量路线

**日期：** 2026-08-31
**受众：** CineWeave Studio 的 Skill、契约、运行时与评测维护者
**审阅对象：** 当前 2.5.1 工作区中的 cineweave-director、共享契约、语义校验、行为评测、运行时架构与既有研究记录
**目标：** 判断 Director Skill 还应补什么，并把“可继续丰富的内容”与“必须先修复的结构性问题”分开。

## 结论先行

当前 Director 已经不是“缺少导演知识”的早期 Skill。它的动作拆解、镜头目的、物理灯光、时序、故事板覆盖、参考边界和 Production 交接都相当完整。下一阶段最有价值的工作不是继续堆叠摄影术语或案例，而是把已经写进文档的规则变成可表达、可验证、可迁移的契约与评测闭环。

建议优先顺序如下：

1. **P0（核心修复已落实）：消除精确引用环。** 审阅基线中的 ShotSpec 同时反向引用 ShotLightingPlan 和 TemporalSpec，而后二者又必须引用 ShotSpec；由于引用包含 contentHash，这不是普通图循环，而是无法稳定求值的内容哈希循环。
2. **P0（核心修复已落实）：让 live eval 验证真实契约。** 审阅基线中的 Director live replay 只在 contractKinds 中声称产出了 ShotSpec，response 实际是自然语言；评测没有对一个 ShotSpec payload 做 schema 与语义校验。
3. **P0：让 Storyboard schema 表达文档承诺。** 文档要求精确 ActionSequence/beat 绑定、覆盖账本、独立面板任务和来源链，但现有 schema 只能保存 prose actionBeat，且 additionalProperties 为 false，关键数据无法补写。
4. **P0（核心修复已落实）：关闭 repair 路由的输出空洞。** Manifest 与 SKILL 都声明 repair，但 Director 的输出清单和契约清单没有对应产物。现已增加 DirectorRepair，并把直接 Director 修复与跨域 delegation 分开验证。
5. **P1（Proposal/RenderPlan/MediaImport 已落实）：现代化 Proposal、RenderPlan、MediaImport 与 Storyboard 的身份和精确引用。** DirectorProposals 已删除 2.5 形状中的强制 provider 枚举，RenderPlan 与 MediaImport 已在 2.5 payload 中持久化 ID/version 和 exact refs；保留兼容读取，并继续评估将 media_import 迁回 Production。
6. **P1（已落实）：增加可选 CameraPrevisSpec，而不是膨胀基础 ShotSpec。** 对高精度预演提供坐标、单位、filmback、投影、焦点、快门、内外参轨迹和 timebase；普通镜头仍使用语义化 ShotSpec。
7. **P1（路由、近邻边界与首个质量 rubric 已落实）：建立 Director 全路由契约评测矩阵。** 10 条路由均已有静态 case 和 schema-valid live replay；suite 显式把 manifest 的十条 Director route 列为必需覆盖。六条由 Director 接收的静态负例会转交 Character、Scene、Style、Reference、Prompt 或 Production，六条对应 live replay 也显式排除 Director。结构正确性由 schema/语义校验负责；现有 ControlBenchmark 已增加 `DirectorQualityBench`，绑定精确 Director 工件、维度化 pass/warn/fail rubric 与成对观测媒体校准计划；真实 imported candidate media 与完成态评审仍需后续采集。
8. **P2（剪辑、色彩、媒体技术与内容凭据计划已落实）：把剪辑时间线、媒体技术观察、色彩管线和内容凭据放在正确所有者下。** Production 现拥有 OTIO-core 对齐、但不导出的 EditorialTimelinePlan，绑定精确 MediaImport 且由本地 ffprobe 产生的 MediaTechnicalProbe，OCIO-model 对齐、但不加载配置的 ColorPipelineProfile，以及只计划 provenance 的 ContentCredentialHandoff；Reference 拥有按精确字节绑定、可记录外部不可变报告的 ContentCredentialInspection。Director 只拥有剪辑、声音和视觉意图。实际 OTIO/EDL/XML 导出、OCIO 变换和本地 C2PA validator/adapter 仍归 Production/Reference；MediaTechnicalProbe 只记录受限技术字段，不替代色彩解释或质量批准。

一句话判断：**内容层已经成熟，当前瓶颈是“文字指导强、机器闭环弱”。**

### 本轮落实状态

- ShotSpec 仍声明两个旧字段作为显式迁移标记，但已标注 deprecated，并由 JSON Schema 与语义校验共同禁止新产物填充。
- ShotLightingPlan 与 TemporalSpec 只保留指向上游 ShotSpec 的 `shotSpecRef`；示例已绑定 ShotSpec 的真实规范化 SHA-256。
- V2 架构检查锁定单向关系；制品图回归证明 ShotSpec 向灯光与时间规格形成无环 fan-out；负例覆盖旧式回指、陈旧 hash 和错误 ShotSpec 身份。
- 主 Skill、camera/lighting/temporal references 与架构文档已统一说明“先 hash ShotSpec，再派生下游合同”。
- 完整 `npm run validate` 已通过。旧项目文档的批量迁移工具仍是后续兼容工作，不影响新产物的无环约束。
- Live response 现要求每个声明的合同附带内联 payload；runner 从 payload kinds 按首次出现顺序去重后与声明比对，并验证 manifest owner、JSON Schema 和可用的语义不变量。28 个 committed replay fixture 已迁移并通过分级，其中十个覆盖 Director 的全部 manifest route，另有一个覆盖 Production 的 contract-aware repair handoff。
- Director 的 repair 路由现发布 `cineweave_codex_director_repair`。直接修复必须绑定一个精确 Director target、一个变量和 pending 验收；Character、Scene、Style、Prompt、Production、Rights 等跨域失败只能生成不带 target/change 的正确 owner delegation。RenderPlan 的 legacy payload 无 ID 时，验证器只接受项目运行时提供的不可变 artifact ref，未伪造 payload ID。
- 发布检查现在同时验证 Markdown links 与内联 code-span 相对文件路径。启用后发现并修复了 Character、Style、Reference 与 Router 中 10 个此前未覆盖的失效路径；97 个 Markdown 文件通过路径检查。Director 的 26 个 reference 现由 `reference-lifecycle.json` 全量分类：18 个为直接路由资源，8 个保留为已归档历史材料并绑定实际 owner/successor；新增 release audit 会拒绝未分类文件、被直接暴露的归档文件和失效 successor。
- MediaImport 2.5 已闭环：新 payload 要求 `mediaImportId`/version、exact `renderPlanRef` 与 provenance；若存在执行证据，`executionRequestRef` 与 `executionReceiptRef` 必须成对且精确。公共 CLI 保留原有 `--render-plan-ref` 参数，规范 exact-ref 字符串会自动升级为 2.5，非规范旧字符串仍输出 2.0；World OS 新建制品持久化完整 2.5 形状并继续校验历史 2.0 字符串引用。
- MediaTechnicalProbe 2.5 已闭环：Production 路由使用固定的本地 ffprobe format/stream 查询，绑定精确 MediaImport/media 字节 hash，省略字段显式写成 `not_reported`，只保留脱敏的 container/video/audio 事实和报告 hash，不保存路径、raw tags、packet 或 extradata。schema、semantic、runtime、architecture、static behavior 与 live replay 已覆盖 planned/recorded 状态及 ColorPipeline verified metadata 的 exact probe 门槛；真正的媒体写入、转码和质量批准仍不在该合同内。
- ControlBenchmark 现增加了 `DirectorQualityBench`：质量维度拆为镜头目的可读性、动作覆盖、空间连续性、时序因果和人工导演判断；每个质量 case 精确绑定 ActionSequence、ShotSpec、ShotLightingPlan、TemporalSpec、CameraPrevisSpec 与 Storyboard 工件，并保留逐维度观察锚点。其 calibration plan 要求至少两对 observed media、左右顺序平衡和 `left/right/tie` 决策；完成态还必须提供不同媒体、两侧均有观察证据且至少一对覆盖 Director 质量维度。示例 review 仍保持 planned，运行时的 completed fixture 只验证结构门槛，不伪造真实媒体质量结果。

### 2026-09-01 剩余优先级（证据收敛后）

| 顺序 | 增量 | 本地证据 | 建议边界 |
| --- | --- | --- | --- |
| P1-1（已落实） | MediaImport 的 identity/ref migration | MediaImport 2.5 现有 payload ID/version、exact RenderPlan、可选成对 execution refs、provenance、schema/semantic/architecture/runtime guards；CLI 与 World OS 都双读兼容 | 不提前移除 legacy string；在版本化迁移窗口后再决定收紧策略，且不在 repair 中伪造 ID |
| P1-2（路由、近邻边界与质量 rubric 已闭环） | 全路由评测矩阵 | 所有 10 条 Director route 均有静态 case、schema-valid replay payload，且 suite 用 manifest-owned route 列表强制覆盖；六条 Director-targeted static negative 与六条 specialist live replay 锁定 Character、Scene、Style、Reference、Prompt、Production 的相邻所有权；ControlBenchmark 已加入精确 Director 工件、维度化 rubric 和成对 observed-media calibration schema/semantic gates | 保持 target/route/owner 与 `mustNotActivate` 三重守卫；下一步只补真实 imported candidate media、平衡顺序记录和完成态 review evidence，live model run 继续需要显式成本确认 |
| P1-3（已落实） | reference 生命周期审计 | 26 个 Director references 中 18 个直接 route-loaded，8 个由 catalog 标记 archived 并绑定 owner/successor；runtime/release audit 会拒绝 unclassified、错误直接暴露或缺失 successor | 保持 SKILL → active reference 一跳关系；新增内容必须先进入 catalog，后续可逐项物理迁移已归档历史材料 |
| P1-4（已落实） | 可选 CameraPrevisSpec | 新 2.5.0 CameraPrevisSpec 绑定 exact ShotSpec/SceneBinding 和可选 TemporalSpec，声明 scene-local meter 坐标、reduced rational timebase、filmback、projection、clipping、shutter 与分离 pose/intrinsic tracks；schema、语义、repair、architecture、static case 和 committed replay 均已覆盖 | 只为 3D/previs/adapter 明确需要的任务生成，不把工程相机字段塞进常规 ShotSpec；下一步只补质量 rubric/观察证据 |
| P2（计划/观察层已落实） | Editorial timeline、media technical probe、color、content credentials | Production 已有 exact Storyboard/ShotSpec/MediaImport-bound EditorialTimelinePlan、exact MediaImport/media-bound MediaTechnicalProbe、exact MediaImport/media-bound ColorPipelineProfile，以及 exact ReferenceAsset/ContentCredentialInspection-bound ContentCredentialHandoff；Reference 的 ContentCredentialInspection 可保持 planned/not_checked 或记录不可变外部报告，逐项保留 assertions、signature、binding、ingredients、timestamp、revocation 与 asset-content 状态。MediaTechnicalProbe 只做本地、只读、脱敏技术观察；本地 C2PA validator/adapter 尚未安装 | 保持 Production/Reference 所有权；实际 OTIO 导出、OCIO transform、媒体写入和 C2PA 不扩大 Director 的创作所有权 |

### 2026-09-02 实施追踪：MediaTechnicalProbe

本轮已把报告中“完整媒体技术探测仍待补齐”的建议收敛为一个更窄的
Production 合同，而不是扩张 MediaImport 或 Director。当前发布门禁已经覆盖
84 个 contract kinds、81 条 uniquely owned routes、71 个静态行为用例和
28 个 live replay。新增契约、示例、固定 ffprobe CLI、脱敏规则、ColorPipeline
verified 门槛、近邻路由回归和文档均已接入。

同一轮还把审阅报告中“导演质量不能只停留在 prose rubric”的缺口收敛到
现有 `ControlBenchmark`。`DirectorQualityBench` 现在以 `dimension.direction`
拆开镜头目的、动作 coverage、空间连续性、时序因果和人工导演判断，质量 case
精确绑定六类 Director 工件，并要求每个质量观察锚点以 exact contract 与
observed media 为证据。`ControlBenchmarkReview` 的 calibration schema/semantic
层支持成对媒体、左右顺序、`left/right/tie` 决策和两侧观察证据；若 benchmark
包含 DirectorQualityBench，完成态必须至少有一对覆盖该 case/dimension。仓库只
提交 planned review 与结构性 synthetic test，不把 synthetic fixture 当成真实
候选媒体或质量结论。

同一轮补上了审阅报告中尚未闭合的 contract-aware repair runner。Production
现在拥有 `repair_run` 路由和 `RepairRunReceipt`；runtime 以双重精确审批为
前提，只把 frozen plan/parent 交给显式登记的本地 adapter，验证 immutable
parent、exact dependency set、next version、single target path 以及
schema/semantic validity。成功的运行只生成 `candidate` 并把 receipt 留在
`awaiting_review`；delegate、缺审批、缺父工件、不安全 adapter、越界或坏候选
均记录为 `blocked`/`failed`，且不会写媒体、修改父版本或声称批准。新增
runtime tests、static case 和 live replay 已覆盖这条边界。

剩余工作有意保持在 adapter/evidence 层：真实媒体的 codec/color/timebase
校准样本、经批准的 OCIO transform、OTIO/EDL/XML export，以及真正的 C2PA
validator/manifest 写入。它们都不能反向扩大 Director 的创作所有权，也不能
把工具报告自动升级成质量、权利或真实性结论。

## 调研方法与停止条件

本次使用两轮有界调研：

- 第一轮完整盘点本地 SKILL、26 个 references、contracts manifest、相关 schema、examples、语义校验器、静态行为用例、live replay、架构和路线图，并对照 Agent Skills、OpenAI Skill 与 eval 官方指导。
- 第二轮只验证会改变设计优先级的问题：精确引用是否真形成内容哈希环、StoryBoard 是否真无法表达覆盖关系、live replay 是否真验证契约 payload、Camera/Timeline/Color/Provenance 是否已有成熟外部交换模型。

当新增来源不再改变 P0/P1/P2 归类、所有权或契约形状时停止扩展。没有继续做“模型排行榜”或供应商功能盘点，因为那不会改变本报告的核心决策。

## 当前实现的成熟度

### 已经做得好的部分

- 主 SKILL 仅 141 个物理行、约 1,611 词，低于 Agent Skills 建议的 500 行与 5,000 token 量级；主文档足够紧凑，详细知识已经拆到 references。
- description 明确列出镜头、动作、灯光、时间、故事板和 provider-neutral render planning，也明确 Prompt、Character、Scene、Style、Reference、Production 的边界。
- ActionSequenceSpec 是当前最成熟的 Director 合同：动作顺序、参与者、武器、轨迹、攻防交换、覆盖、连续性和风险都有较强语义校验。
- ShotSpec、ShotLightingPlan、TemporalSpec 已形成“镜头语义—物理光源—时间行为”的分层，而不是把所有内容压成一条 prompt。
- Storyboard 文档已经采用覆盖账本、独立面板任务、确定性装配和局部重试的正确生产观念。
- Production 侧已有 CapabilityProfile、ControlChannelSet、ControlBenchmark、ExecutionRequest、ExecutionReceipt、BoardAssemblyPlan 等基础，不需要 Director 重造执行系统。
- Skill 明确拒绝凭空生成 hash、receipt、权限或 provider 结果，也不把仓库存在当成可执行能力证明。

这些优势意味着后续工作应以“契约补强和验证闭环”为主，不应重写整个 Skill。

### 量化盘点

| 维度 | 当前状态 | 判断 |
| --- | --- | --- |
| Director 路由 | 10：proposal、action_sequence、shot_direction、shot_lighting、temporal_direction、camera_previs、storyboard、render_plan、media_import、repair | 路由面完整，全部有可导入合同 |
| Director 契约 | 10 | 与路由数量闭合 |
| references | 26 | 18 个为直接路由资源，8 个为带 owner/successor 的显式 archived 材料 |
| 静态 Director 行为用例 | 13 | 覆盖 proposal、action_sequence、shot_direction、shot_lighting、temporal_direction、camera_previs、storyboard、render_plan、media_import、repair |
| Director live replay | 10 | 每条 manifest route 一份 schema-valid、semantic-valid committed replay |
| 核心语义校验 | ActionSequence、Shot、Lighting、Temporal、CameraPrevis、Storyboard、DirectorProposals、RenderPlan、MediaImport、DirectorRepair | Proposal 现校验 identity、distinct delta、capability、human gate 与非执行边界；RenderPlan 现校验 identity、exact prompt/production refs、human gate 与 Draft import；MediaImport 校验 identity、exact RenderPlan、paired execution refs、唯一媒体与 Draft/provenance；CameraPrevis 校验精确依赖、rational timebase、轨道、内外参语义与非执行边界；Storyboard 现校验 coverage 双向闭合、动作 scope、exact hash 和 BoardAssemblyPlan 面板映射，DirectorRepair 校验 owner、变量/target、精确 target、delegation 和非执行边界 |
| Storyboard schema | 2.5.0 versioned storyboard + scoped action + coverage ledger | 已有 `storyboardId`/version、exact ActionSequence/ShotSpec refs、coverage rows、可选 Production bindings 和 provider-neutral boundary |
| Camera schema | 语义位置 + focalLengthMm + prose | 适合普通导演意图，不足以做可交换的高精度 previs |

## 优先级差距矩阵

| 优先级 | 缺口 | 本地证据 | 外部对照 | 置信度 | 建议 |
| --- | --- | --- | --- | --- | --- |
| P0（核心已修） | ShotSpec 与 Lighting/Temporal 的精确引用环 | 审阅基线允许两个 ShotSpec 下游 ref，同时要求 Lighting/Temporal 的 shotSpecRef；当前 schema、示例、语义与架构测试已改为单向 | 当前架构将工作流定义为 DAG；精确 contractRef 必含 kind、id、version、contentHash | 高 | 保持 ShotSpec 只做上游；补旧文档迁移工具；需要单一入口时再增加可选 DirectedShotBundle |
| P0（核心已修） | live eval 可凭声明通过 | 审阅基线只有 contractKinds 与 prose response；当前每个 response 都需要内联 payload，runner 检查 kind/owner/schema/语义并拒绝声明不一致 | OpenAI 建议 task-specific、持续评测，并优先使用明确标准、成对比较和人工标定 | 高 | 保持 payload evidence；后续补跨 payload 精确引用上下文与 Director 全路由案例 |
| P0（核心已修） | Storyboard 文档与 schema 不一致 | 审阅基线缺 ActionSequence ref、beat ID、coverage ledger 与 panel binding；当前 2.5.0 schema、action-scoped 示例、semantic negatives、architecture guard 与 live replay 已闭环 | 生产型时间线与媒体系统通常显式保存结构、引用与时间范围 | 高 | 保持 exact refs、coverage closure 和 BoardAssemblyPlan handoff；后续补近邻负例与质量 rubric |
| P0（核心已修） | repair 路由无契约 | 当前 manifest、contracts index、SKILL、schema/example、语义负例、架构检查、行为用例与 live replay 均已发布 DirectorRepair | Character、Scene、Prompt 已有各自 Repair 合同 | 高 | 保持只修 Director 变量；跨域失败只 delegation，后续补 repair 的近邻负例与人工标定 |
| P0（本轮已闭环） | repair 只有计划没有执行证据 | Production `repair_run` 现在要求 exact repair-plan ApprovalRecord 与适用的 embedded gate，通过显式本地 non-writing adapter 生成 next-version candidate，并以 `RepairRunReceipt` 绑定 before/after、exact dependencies、changed paths、validation 与 pending acceptance；blocked/failed 不修改父工件 | 不可变 artifact store、精确审批和人审仍是执行边界；adapter 不能替代人审或 provider 执行 | 高 | 保持 runner 只做 contract candidate；下一步补 timeout/cancellation/malformed-output conformance fixtures，不接入网络或媒体写入 |
| P1（已修） | DirectorProposals 含强制 provider 枚举 | 2.5.0 形状要求 proposalSetId/version、primaryDelta、capabilityRequirements、cost/risk 与 pending humanSelection，并禁止 recommendedProvider；2.0.0 仅为读取兼容保留 | Skill 自身承诺 provider-neutral；Production 已有 capability/adapter 层 | 高 | 发布兼容迁移和语义/架构/行为守卫；adapter 选择仍归 Production |
| P1（已修） | legacy contracts 缺 identity/exact refs | RenderPlan 2.5 现要求 payload identity/version、exact prompt 和精确 production refs；MediaImport 2.5 现要求 import identity/version、exact RenderPlan、provenance 和可选 paired execution refs | 项目自身 immutable store 依赖 kind/ID/version/hash 精确引用 | 高 | 保持 2.0 string 双读兼容；在迁移窗口后统一 contractRef |
| P1（已修） | camera motion 语义与几何未分层 | CameraPrevisSpec 2.5.0 现保留 exact ShotSpec/SceneBinding、可选 TemporalSpec、坐标系、meter、rational frameRate/frameRange、optics 与分离轨道；语义校验拒绝未归一四元数、轨道乱序、伪 zoom 和陈旧依赖 | OpenUSD Camera 有 transform、filmback、projection、focus、f-stop、clipping、shutter；CameraBench 区分 zoom 内参与前移外参 | 高 | 保持基础 ShotSpec 轻量；只有精确预演需求进入新的 camera_previs 路由 |
| P1（已修） | lighting 不能表达无 fill 或间接光路 | ShotLightingPlan 2.5 允许 `fill: null`，并要求 direct/bounce/transmitted transport；反射或透射必须给出 `viaSurfaceAnchor` | 真实布光常区分直接、反射、透射和 bounce 路径 | 中高 | 保留 2.2 读取兼容；仅在物理模拟确有需要时再增加 modifier/falloff 的结构化字段 |
| P1（已修） | reference 图拓扑未受验证 | `reference-lifecycle.json` 覆盖全部 26 个文件：18 个 routed、8 个 archived；专用 runtime/release audit 拒绝未分类、归档误暴露和缺失 successor，link validator 同时覆盖 inline/Markdown 路径 | Agent Skills 推荐按需、一跳引用和小而聚焦的 reference 文件 | 高 | 保持 catalog 为新文件的发布门禁；已归档材料只可逐项迁移或保留，不得重新形成深层链 |
| P1（首个维度化基线、校准协议与近邻守卫已落地） | Director 质量评测缺少维度化基线 | 静态用例已覆盖 10/10 路由（13 个 Director 正向 case），live 已覆盖 10/10 并由 requiredRouteCoverage 防回退；ControlBenchmark 同时拥有 CameraPrevisSpec-bound CinematographyBench 与 exact Director-artifact-bound DirectorQualityBench，后者拆出镜头目的、动作覆盖、空间连续性、时序因果和人工导演判断，并锁定盲评、受训评审、观察锚点、agreement threshold、裁决路径及 paired observed-media calibration gates。仍缺真实 imported candidate media、左右顺序采样和完成态评审结果 | VBench 2.0 分开评估空间关系、动作顺序、人物交互、相机运动、身份、服装、物理和多视角一致性 | 高 | 在现有 ControlBenchmark 中继续加入真实带证据的 Director 维度与人工标定样本，不新建平行基准体系 |
| P2（已补计划层） | 无精确 editorial timeline | Production 现有 EditorialTimelinePlan：精确 Storyboard/ShotSpec/MediaImport refs、reduced rational frame rate、闭合 tracks、显式 gaps/transitions、planned/partial/conformed honesty 与 OTIO-core exchange boundary | OTIO 使用 RationalTime、TimeRange、Timeline、Track、Clip、Transition、MediaReference | 高 | 保持 Production-owned plan；实际 OTIO/EDL/XML export 仍是经审批 adapter，Director 只输出意图与切点约束 |
| P2（色彩计划与技术探测已落实） | 无可验证的色彩管线身份 | ColorPipelineProfile 以 exact MediaImport/media 绑定、immutable OCIO ID/version/hash、unknown/declared/verified metadata、scene/display policy 与 preview/delivery path 填补计划层；verified metadata 现在必须再绑定同一媒体的 MediaTechnicalProbe | OCIO 区分 scene-referred、display-referred、view transform 与 display colorspace | 高 | 保持 Production-owned plan；下一步是经审批 OCIO transform adapter，以及按真实媒体补充校准证据 |
| P2（计划/证据链已落实） | 内容凭据只有声明、缺实际检查链 | 新 ContentCredentialInspection 精确绑定 ReferenceAsset/byte hash，允许 planned/not_checked 或记录 immutable external validator report；新 ContentCredentialHandoff 要求外部传递前有 recorded inspection 与派生输出重新验证，但不运行 validator、嵌入或写 manifest | C2PA 定义 manifest、claim、内容绑定、签名与验证，且不等同于真实性价值判断 | 中高 | 保持在 Reference/Production；下一步只引入可审计 adapter，不放进 Director 创作合同 |

## P0 设计详解

### 1. 打破内容哈希引用环

审阅基线示例构成如下关系：

ShotSpec → ShotLightingPlan
ShotSpec → TemporalSpec
ShotLightingPlan → ShotSpec
TemporalSpec → ShotSpec

普通对象图中的双向引用有时可以接受，但 CineWeave 的 contractRef 要求 contentHash。要计算 ShotSpec 的 hash，必须先知道 Lighting/Temporal 的 hash；要计算后二者，又必须先知道 ShotSpec 的 hash。因此真实内容无法按当前示例稳定落库，只能使用占位 hash 或绕过验证，这直接破坏 immutable artifact graph 的核心保证。

推荐最小修复：

- ShotSpec 保留导演语义、blocking、camera intent、composition、action/end state。
- ShotLightingPlan 与 TemporalSpec 分别单向引用精确 ShotSpec。
- 从 ShotSpec 中弃用 lightingPlanRef 和 temporalSpecRef；新产物不得填充。
- Prompt、Storyboard 或 RenderPlan 若需要三者，直接持有三个并列 contractRef。
- 只有当调用方确实需要“一个引用代表完整已定向镜头”时，再增加轻量 Director-owned DirectedShotBundle，内部并列引用 ShotSpec、ShotLightingPlan、TemporalSpec 和可选 CameraPrevisSpec。Bundle 是下游聚合节点，不反向写回任何组成合同。
- 增加迁移器：读取旧 ShotSpec，去掉两个反向 ref，重新计算内容哈希，并生成旧→新 ref 映射。
- 增加架构测试：任何示例和 fixture 构成的 artifact graph 必须 cycleCount 为 0。

本轮已经完成新产物侧的 schema 禁止、语义拒绝、真实 hash 示例、文档约束与无环回归；尚未增加面向旧落库文档的批量迁移器，也没有因为当前调用方并不需要单一入口而提前增加 DirectedShotBundle。

不建议以“让 contentHash 可选”解决，因为这会削弱整个项目最有价值的精确引用约束。

### 2. 把 live eval 从声明测试升级为产物测试

审阅基线中的 live-response.schema.json 只要求 contractKinds 和 response。唯一 Director fixture 在 contractKinds 中列出 cineweave_codex_shot_spec，但 response 只描述眼神、头、肩、摄影机和焦点的自然语言顺序。旧 runner 只校验 response 外壳并检查 contractKinds 是否命中，未取得或验证一个 ShotSpec JSON。

建议的新 response 外壳：

- selectedSkill、route、outcome 保留。
- 新增 payloads 数组，每项至少包含 kind 和 payload；也可直接存 payload object。
- contractKinds 不再由模型自由声明，而由 runner 从 payloads 的 kind 去重派生；保留该字段时必须与派生结果完全一致。
- 对每个 payload：
  1. 确认 kind 在 contracts manifest 中存在；
  2. 确认 owner 与选中 Skill/route 相符；
  3. 运行对应 JSON Schema；
  4. 运行 validateByKind 语义校验及所需上下文；
  5. 验证精确 refs 可解析，或明确标为 synthetic fixture refs；
  6. 记录 payload hash，而不是只记录整段 prose hash。
- response 可保留为人读摘要，但不能作为“已产生合同”的唯一证据。

本轮已将该外壳落地为必填 `payloads`，并把所有 committed replay fixture 迁移为内联合同快照。runner 以 payload kinds 作为评分证据、拒绝 contractKinds 不匹配、验证 manifest owner、运行对应 schema 和语义校验；单元负例覆盖空 payload 声明、schema 无效、owner 错配、语义失败与 wrapper kind 错配。运行记录的 runnerVersion 已升级至 1.1.0。

质量评分应拆成两层：

- **确定性层：** route、owner、schema、exact ref、semantic invariant、禁止越权、无 secret。
- **判断层：** 镜头是否有单一目的、动作是否可读、移动是否有动机、覆盖是否最小而充分、repair 是否只改一个变量。使用明确 rubric、pairwise 或 pass/fail，并用人工样本校准。

OpenAI 的评测指导强调 eval-driven development、具体任务、持续评测、典型/边界/对抗/多语言输入，以及模型 judge 与人工标签的一致性校准。这里应吸收方法，而不是绑定正在变化的旧 Evals 产品 API。

### 3. 让 Storyboard 真正承载覆盖关系

当前文档已经定义了正确思想，但 schema 无法保存它。建议最小新增：

- sequenceId、version、contractVersion 必填。
- sourceRefs：精确绑定 direct brief、ScriptScene、ActionSequenceSpec 或其他来源。
- coverageLedger：
  - coverageRequirementId
  - actionBeatIds
  - shotIds 或 panelIds
  - status：covered、partial、blocked
  - rationale
- 每个 shot/panel：
  - shotSpecRef；若从 ActionSequence 拆解，再有 actionSequenceRef 与 actionBeatIds
  - onePurpose、dominantAction、startState、endState
  - continuityDependencies
  - optional temporalSpecRef / lightingPlanRef，但均为下游并列引用，不反向写入 ShotSpec
  - optional productionBindings，只引用 Production-owned recipe task、assembly region、MediaImport 或 receipt，不复制其定义
- validation：
  - order contiguous
  - IDs unique
  - every required beat covered
  - no unknown beat
  - each panel has one purpose and stable end state
  - unresolved coverage blocks productionReady

语义校验器还应检查覆盖关系的双向闭合，而不只是 scene/interaction continuity。

### 4. 关闭 repair 路由空洞

优先方案是新增 DirectorRepair，沿用 CharacterRepair 与 SceneRepair 的设计骨架：

- repairId、version、contractVersion
- sourceReviewRef 或 ControlBenchmarkReview ref
- targetRefs：ShotSpec、ShotLightingPlan、TemporalSpec、Storyboard 或 RenderPlan
- observedFailure：维度、证据、严重度
- owningVariable：blocking、camera、composition、shot_light_use、temporal_curve、coverage、render_intent
- preserve
- change：必须是一个最小变量
- forbiddenChanges
- acceptanceChecks
- stopCondition
- executionGate：不声称已执行、不声称已修复成功

如果 observedFailure 的所有者是 Character、Scene、Style 或 Prompt，DirectorRepair 不应生成跨域修改；它只输出 delegation，随后由对应 owner 产生自己的 Repair 合同。Production 的 ControlBenchmarkReview 继续拥有对已生成媒体的技术与综合观察，DirectorRepair 只拥有导演变量的修复意图。

备选方案是删除 Director repair 路由，完全依赖 Production review 加各领域 Repair。两种方案都比当前无输出状态可靠；鉴于 SKILL 已经有清楚的最小修复规则，保留并补齐 DirectorRepair 更连贯。

本轮已采用前者。`director-repair.schema.json` 要求 repairId/version、观察证据、preserve、pending 验收、stop condition、人审 gate、非执行边界和 provenance。`repair` disposition 只能指向 ActionSequenceSpec、ShotSpec、ShotLightingPlan、TemporalSpec、CameraPrevisSpec、Storyboard 或 RenderPlan，并校验变量与 target kind 的组合；camera 只能改语义 camera 路径，或 CameraPrevisSpec 的 `camera.`/`motion.`/`tracks.pose`/`tracks.intrinsics` 数值路径，render intent 不能改 Prompt binding。`delegate` disposition 必须命名 observed failure 的非 Director owner，且 schema 与语义校验都拒绝混入 targetRef 或 change。新增的 runtime、semantic self-test、架构检查和行为 case 覆盖了错误 owner、错误 target kind、陈旧 hash、越界路径与 legacy RenderPlan immutable artifact ref。

## P1 设计详解

### 5. 清理 legacy 契约和所有权漂移

#### DirectorProposals

审阅基线中的 proposal 没有 proposal set ID/version，也没有精确 source refs；每条 proposal 强制 recommendedProvider 为 codex 或 libtv。这与 Director 的 provider-neutral 边界矛盾。

本轮已发布兼容的 `2.5.0` 形状：它要求 `proposalSetId`、`version`、可选精确 `sourceRefs`（无版本化上游输入时使用受限 `sourceInput`）、`explorationAxes`、每条 proposal 的 `proposalId` / `primaryDelta` / `capabilityRequirements` / cost-risk class、pending `humanSelection`、非执行边界、validation 和 provenance。2.5 payload 明确禁止 `recommendedProvider`；保留只读 `2.0.0` 分支，使已有 provider-shaped payload 仍可验证。语义、架构、示例和静态行为 case 一起锁定该边界。

2.5 的持久形状为：

- proposalSetId、version、sourceRefs
- proposals[].proposalId
- diversityAxes：blocking、attention、camera、tempo、coverage
- capabilityRequirements：只描述所需能力，不选 provider
- costClass、riskClass、unknowns
- humanSelection：selectedProposalId、decisionRef、status

Production 根据 CapabilityProfile 和 AdapterDescriptor 选择 adapter。

#### RenderPlan

本轮已实现兼容的 RenderPlan 2.5：新 payload 必须提供 renderPlanId/version、exact PromptRecord 或 ImagePrompt promptRef、provenance，并禁止 legacy promptPayloadRef。可选 AssetRecipe、ControlChannelSet、EvidenceBundle、CapabilityProfile 与 LicenseProfile 输入在 2.5 形状中都必须保留 kind/id/version/contentHash；2.0 或无 contractVersion 的历史 payload 仍可使用 prompt string 与旧的无 kind 引用形状。

World OS 生成器现在将已有的确定性 renderPlanId 也写入 payload，并使用原有精确 Prompt/Recipe/Capability/License refs。首次迁移测试发现 Recipe 快照过去没有在将其公开为 ref 前持久化，artifact graph 随即报告 missing refs；生成器现先持久化该源契约，因此将精确引用变成可解析依赖而不是仅改 schema。

新增语义校验：

- operation 与输入角色一致；
- 所需能力可被 capability profile 表达；
- rights 未知时不进入 executionReady；
- 不含 provider secret、URL 或本地绝对路径；
- variantCount、mask 与 operation 相容；
- 不声称已经执行。

DirectorRepair 仍以 envelope artifactRef 核验任何 RenderPlan target；payload 内 ID 现在让独立 JSON 目标也可与 exact ref 对齐。2.5 World OS identity 中包含 contract revision，因此新产物不会与既有同输入的 2.0 envelope version 发生内容冲突。

#### MediaImport

这里存在明显所有权张力：

- raw upload 已由 Reference 拥有；
- ExecutionReceipt、文件验证、Draft 入库和 QA 已由 Production runtime 实现；
- Director 应消费候选媒体并判断镜头、表演、摄影机、灯光和时序，而不是拥有字节摄取。

建议将 media_import 路由和 MediaImport 合同迁给 Production。若为兼容性暂时保留 Director façade，必须明确它只委托 Production verifier，不能成为第二套 ingest 实现。

无论最终所有权如何，本轮的兼容迁移已经补齐：

- `mediaImportId`、version、provenance
- exact `renderPlanRef`，以及可选但必须成对的 exact
  `executionRequestRef` / `executionReceiptRef`
- schema、语义、架构、CLI 与 World OS 的双读兼容守卫

仍应由 Production 继续补齐媒体技术探测与凭据链：

- codec、profile、pixel format、bit depth
- color primaries、transfer、matrix、range
- frame count、rational frame rate、duration timebase
- sample/display aspect ratio、rotation/orientation、alpha
- audio streams、sample rate、channels
- probe tool/version 与完整性状态

### 6. 新增可选 CameraPrevisSpec（已落实）

OpenUSD 的 Camera 模型说明了高精度交换真正需要的字段：transform、projection、horizontal/vertical aperture、focal length、focus distance、f-stop、clipping、shutter 与曝光相关参数。CameraBench 进一步说明 zoom-in 是内参变化，而 camera forward translation 是外参变化；即使人类新手也常混淆二者。

这不意味着基础 ShotSpec 应立刻加入所有摄影机工程字段。推荐分层：

- **ShotSpec：** 镜头目的、语义位置、焦段意图、透视、焦点目标、景深意图、轴线和移动动机。
- **TemporalSpec：** 动作、焦点、次级运动、动态光和剪辑桥的时间关系。
- **CameraPrevisSpec：** 仅在 3D/previs/精确轨迹或 adapter 要求时生成。

已发布的 2.5.0 形状为：

- `cameraPrevisSpecId`、version、exact `shotSpecRef`、exact `sceneBindingRef` 与可选 exact `temporalSpecRef`；
- `coordinateSystem`（固定 scene-binding-local、meter、up axis、handedness、forward axis、origin）；
- reduced rational `frameRate` 与明确 `frameRange`；
- `camera`（projection、filmback、clipping、shutter、focus target）；
- 彼此分离的 `tracks.pose`（position + normalized quaternion）和 `tracks.intrinsics`（focalLength、focusDistance、fStop）；
- `motion` 的 primary behavior 与显式 components；translation、rotation、zoom、focus_pull、iris 不可互相冒充；
- provider-neutral、non-executing boundary 与可审计 provenance。

语义校验强制轨道严格有序、首尾落在 frame range、近远裁切有效、快门顺序正确；若绑定 TemporalSpec，rational frame duration 必须与其 seconds duration 相同。CameraPrevisSpec 能作为 DirectorRepair 的精确 camera target，但不能反向写入 ShotSpec。

TemporalSpec 的 seconds 可继续作为创意层便利字段，但 production-ready 输出应能绑定 rational timebase 或帧位置。

CameraPrevisSpec 现在也具有 Production-owned 的可评测入口：ControlBenchmark 的 CinematographyBench case 必须携带 canonical exact CameraPrevisSpec ref，按 camera path/framing、motion timing、rule 和人工摄影判断拆开评估。该 Bench 还强制盲评、受训评审、至少两份独立判断、observable pass/warn/fail anchors、agreement threshold 和第三评审/lead adjudication 路径。配套 ControlBenchmarkReview 仍是 planned，既没有媒体证据，也没有评审结果、agreement score 或 adjudication；只有导入候选媒体与精确 observations 后才可产出完成态评分。这避免把详细预演合同误称为镜头已经生成或质量已经通过。CameraBench 的相机运动研究发现领域训练能显著提高标注准确性，VBench 2.0 将 camera motion 作为独立 controllability 维度，GDPval 则以盲评专家和细化 rubric 校准人工判断；这里吸收的是这些评测设计原则，而不是声称本地已经运行它们的模型或媒体基准。

#### 6.1. DirectorQualityBench 质量 rubric 与成对观测校准（结构已落实）

本轮把“导演质量”收敛为现有 Production-owned `ControlBenchmark` 中的一个
独立 scope，而不是新增平行 benchmark 或给 Director 合同增加 universal
quality score。`DirectorQualityBench` 的质量 case 精确绑定
ActionSequence、ShotSpec、ShotLightingPlan、TemporalSpec、CameraPrevisSpec
和 Storyboard 六类工件；`dimension.direction` 再拆出镜头目的可读性、动作
coverage、空间连续性、时序因果和人工导演判断。每个维度保留
pass/warn/fail anchor 与 evidence requirement，要求观察媒体能够说明判断
依据，而不是用一张漂亮单帧或 prose 补齐缺失动作。

其 calibration plan 固定为至少两对 observed media、`left/right/tie` 决策
尺度和左右展示顺序平衡。完成态 `ControlBenchmarkReview` 必须把 pair 绑定
到已知 benchmark case/dimension，引用两份不同媒体，并让 evidence observations
分别落在左右媒体上；包含 DirectorQualityBench 时，至少一对必须覆盖
Director quality case 与 direction dimension。当前 canonical review 仍是
planned，仓库中的 completed pair 仅是 schema/semantic 的 synthetic structural
test，不代表真实媒体、人工评分或质量批准。

### 7. 加强 ShotLightingPlan 的光路语义

审阅基线强制 key 和 fill 都是 shotLightUse。真实镜头可以没有 fill，也可以把墙面/地面反射作为间接 fill；仅复用一个 SceneLightState sourceId 无法说明光如何到达主体。

本轮兼容迁移已完成：

- 2.5 payload 允许 `fill: null`，并以 `validation.fillIntentional` 强制表达这是刻意的无补光决定。
- 每个非空 light use 必须声明 `transport`：`direct`、`bounce` 或 `transmitted`。
- `bounce`/`transmitted` 必须保留现有 SceneLightState `sourceId` 并给出具体 `viaSurfaceAnchor`；`direct` 不能伪造反射表面。
- 2.2 payload 仍可读取；StyleLightGrammar 仍只拥有表现处理，不获得源位置或物理表面所有权。

只有当物理模拟或 adapter 明确需要时，才继续增加 modifier、方向或 falloff 的结构化字段。
- 不强制 lux、CRI、灯具型号等现场工程数据，除非上游确有证据或 adapter 明确需要。

### 8. 修复 reference 路由图与知识所有权

从 SKILL 出发不可达的 8 个文件为：

- character-consistency.md
- character-design.md
- character-performance.md
- character-visual-development.md
- cinematic-atlas.md
- gallery-portrait-character-design.md
- prompt-gallery.md
- reference-editing.md

其中多份内容主要属于 Character、Prompt 或 Reference。它们不会因为存在于目录中而被 progressive disclosure 自动加载，也增加维护漂移风险。

建议：

- Character 设计、一致性、表演和 visual development 迁移到 cineweave-character；Director 只保留“如何消费 CharacterBinding/PerformanceTimeline”的薄指南。
- prompt-gallery 迁移到 cineweave-prompt。
- reference-editing 拆给 cineweave-reference 与 cineweave-prompt；Director 只保留镜头级 preserve/change 约束。
- cinematic-atlas 与 portrait gallery 若确有 Director 独占内容，提炼成一个可路由的 camera/capture reference；否则归档。
- SKILL 中 route 的 code-span 路径改为 Markdown link，或让 validate-skill-links 同时解析明确的 references/*.md code span。
- 新增 route-reference audit：每个 route 至少一条可达 reference；每个 reference 要么可达，要么有 archive/owner 元数据；禁止无意的深层循环引用。

这一项是“减少内容”而不是“增加内容”，但会显著提高 Skill 的实际命中率和维护质量。

2026-09-01 的低风险第一步已完成：`validate-skill-links.mjs` 现在会解析本地 inline code-span 文件路径，新增 runtime regression 覆盖“missing inline path 必须失败”和“全项目路径均可解析”。首次启用检出了 10 条此前无声的路径错误：Character 跨 Skill 的 appearance guide、Reference schema 指向、Style loading guide 的 7 个 bare filename，以及 Router 到 Prompt 的 Midjourney profile guide。它们均已改成真实相对路径，当前 97 份 Markdown 全通过。这个修复不等于 8 个未路由 reference 已得到合理所有权；它只确保任何已经声明的路径不会静默失效。

## P2：相邻生产能力

### 9. EditorialTimelinePlan / OTIO adapter（计划层已落实）

OpenTimelineIO 使用 RationalTime、TimeRange、Timeline、Track、Clip、Transition 和 MediaReference 表达可交换剪辑结构。当前 TemporalSpec 与 Storyboard 的 soundEdit、transition 更像导演意图，不足以进行可靠导出。

本轮已由 Production 新增 `EditorialTimelinePlan`，而不是把导出格式写进
Director 的创作合同。它绑定一个 exact Storyboard，使用 reduced rational
frame rate 和整数 frame ranges，并以 picture track 的 Clip/Gap/Transition
核心结构表达可交换剪辑。每个已导入片段必须带 exact ShotSpec、MediaImport、
mediaId 和 source range；缺失媒体只能是无 MediaImport 的 placeholder。

- `planned` 不得声称 imported media；`partial` 必须同时包含 verified media
  和 placeholder；`conformed` 不能残留 placeholder。
- 每条 track 覆盖完整 root range，缺口必须显式为 gap；每对相邻非-gap
  segment 必须有一条锚定共同 frame boundary 的 transition。
- `otioExchange` 固定为 `otio-core`、external-media-only、`not_exported`；
  execution boundary 禁止嵌入媒体、导出时间线或声称 conform 已完成。
- schema、semantic self-test、runtime unit test、architecture guard、静态
  behavior case 和 schema-valid live replay 一起拒绝伪 conform、隐式 gaps
  与未锚定 transition。

由此保留以下严格边界：

- Director 提供 cut intent、sound bridge、preferred transition、timing constraint。
- Story 提供 dialogue 与叙事顺序。
- Production 将已验证 MediaImport 绑定到 picture tracks、clips、transitions 与 rational ranges。
- 实际导出 OTIO/EDL/XML 仍属于 adapter，不写入 Director 创作 Canon，也不由当前计划合同伪造。

### 10. ColorPipelineProfile / OCIO（计划层已落实）

OpenColorIO 明确区分 scene-referred 与 display-referred reference space，并通过 view transform 与 display colorspace 形成显示链。CineWeave 不应把“电影感色彩”与技术色彩管理混为同一字段。

本轮已由 Production 新增 `ColorPipelineProfile`，而不是把技术色彩管理
写进 Director 或 Style 的创作合同。它现在记录：

- OCIO config ID/version/content hash，但固定 `not_loaded`；
- exact MediaImport/media ID 的 input colorspace；
- unknown、declared、verified 三态的 primaries、transfer、matrix、range；
- scene/display reference policy 与 `scene_linear` working role；
- view transform、display colorspace、display、view、output colorspace；
- 严格分开的 preview 与 delivery targets。

Semantic/runtime/architecture/static/live guards 一起拒绝伪装 metadata、缺失
view path、混合 scene/display space，以及“已加载 config / 已 grade / 已写媒体 /
已导出 LUT”的越界声明。初始 profile 显式没有 creative look transforms：
Director 继续拥有色彩意图和视觉关系，Style 拥有表现语法，Production 拥有
可复现的技术手册。真正载入 OCIO、应用 LUT/transform 或交付像素仍需一个经
批准的 Production adapter；MediaTechnicalProbe 已将 codec、bit depth、
primaries/transfer/matrix/range 等选定字段从 MediaImport 核心导入合同中
分离出来。它只做本地脱敏观察，不把报告直接升级为 verified 色彩判断。

### 10.5. MediaTechnicalProbe / ffprobe（技术观察层已落实）

为了不把 MediaImport 核心合同膨胀成播放器、转码器或质量审批器，本轮
由 Production 新增 MediaTechnicalProbe。它只接受一个本地媒体文件、一个
精确 MediaImport/media 绑定和一个 skill receipt，使用固定的 ffprobe
format/stream JSON 查询，记录受限的 container、video、audio 字段，并对
选定报告计算 hash。工具缺失或未执行时仍可诚实表达 planned/not_invoked；
实际执行时所有省略字段都保留为 not_reported。

边界经过 schema、semantic、runtime、architecture、static behavior 和
live replay 共同锁定：不联网、不写源/派生媒体、不保存原始路径、container
tags、packet 或 extradata，不把技术观察当作色彩解释、质量批准、rights 或
release。ColorPipelineProfile 只有在 source metadata 标为 verified 时才
要求同一 MediaImport/media 的精确 MediaTechnicalProbe；unknown/declared
仍可表达尚未验证的输入状态。这与 [ffprobe 文档](https://ffmpeg.org/ffprobe.html)
的探测职责一致，而真实转码、OCIO 变换和质量 review 仍应由后续经审批
adapter/评测闭环负责。

### 11. C2PA inspection（计划/外部证据链已落实）

C2PA 的 manifest、claim、hard/soft binding 和验证结果可增强来源追踪，但规范本身也强调：验证“断言是否与资产绑定且未被篡改”不等于判断内容真伪或许可状态。

本轮已将这条边界落实为两份精确契约：

- Reference 的 `ContentCredentialInspection` 绑定一个 `ReferenceAsset` 和
  byte hash。没有本地 validator 时，它只能是 `planned/not_checked`；如有外部
  validator，则只记录不可变 report 的 ID/version/hash/time 和 manifest 状态，
  并将 assertions、claim signature、hard binding、ingredients、timestamp、
  credential revocation 与 asset content 分别保留。
- Production 的 `ContentCredentialHandoff` 绑定精确的 reference/inspection
  refs，规定外部 transfer 前必须有 `recorded` inspection、每个 derived output
  必须重新验证；目前只写 `ingredient_planned`，不调用 adapter、不写媒体、也不
  嵌入或写 manifest。
- 两份契约均锁死 `rightsConclusion/truthConclusion = not_determined`。Director
  不解析签名，也不把存在凭据等同于审美、真实性或许可批准。

当前工作树未安装 `c2patool` 或 C2PA package；因此这不是伪装的本地验证闭环，
而是能安全承接后续经审批 adapter 的计划/外部证据链。

## 建议的目标产物图

推荐的单向关系：

Story / Character / Scene / Style / Reference
→ ActionSequenceSpec
→ ShotSpec
→ ShotLightingPlan（并行）
→ TemporalSpec（并行）
→ CameraPrevisSpec（可选，并行）
→ DirectedShotBundle（可选聚合）
→ Storyboard + coverageLedger
→ PromptRecord / ImagePrompt
→ RenderPlan
→ Production ExecutionRequest / ExecutionReceipt
→ Production MediaImport
ReferenceAsset → ContentCredentialInspection → Production ContentCredentialHandoff（并行 provenance 链）
→ ControlBenchmarkReview
→ DirectorRepair 或其他 owner Repair

关键规则是：**下游引用上游，上游不反向写入下游 hash。**

## 路由—契约—评测矩阵

| 路由 | 当前合同 | 静态 Director 用例 | live Director 用例 | 最小新增验收 |
| --- | --- | ---: | ---: | --- |
| proposal | DirectorProposals | 1 | 1 | 2–5 个方案在指定轴上真实不同；无 provider 选择；human gate |
| action_sequence | ActionSequenceSpec | 2 | 1 | beat/coverage 双向闭合、风险可见、无镜头细节越权 |
| shot_direction | ShotSpec | 2 | 1 | payload schema+semantic valid；轴线、action beat、end state |
| shot_lighting | ShotLightingPlan | 1 | 1 | direct/bounce/transmitted + nullable fill；只用 SceneLightState source；style/physical 分离 |
| temporal_direction | TemporalSpec | 3 | 1 | 事件有序、在 duration 内；dolly 与 zoom 区分；稳定结束 |
| camera_previs | CameraPrevisSpec | 1 | 1 | exact ShotSpec/SceneBinding/Temporal refs；scene-local meter 坐标、rational timebase、pose/intrinsic 分离；不执行 |
| storyboard | Storyboard | 1 | 1 | exact action refs、coverage closure、panel production bindings |
| render_plan | RenderPlan | 1 | 1 | exact prompt/control/capability/rights refs；无执行声称 |
| media_import | MediaImport | 1 | 1 | exact RenderPlan 与 paired execution refs；技术细节由 Production MediaTechnicalProbe 承接 |
| repair | DirectorRepair | 1 | 1 | 一个 owning variable、preserve/change/stop、正确 delegate；补 targeted negative |

近邻路由还应成对覆盖：

- Character performance 与 Director blocking/camera
- Scene physical source placement 与 Director shot light use、Style light treatment
- Prompt camera language与 Director ShotSpec/TemporalSpec
- Reference raw upload 与 Production MediaImport
- Production candidate QA 与 Director-owned repair
- Style panel layout、Director coverage 与 Production assembly

现已落实的最小边界集包含六条以 Director 为入口的 static negative：
Character identity/morphology、Scene physical light、Style light treatment、
Reference ingest、Prompt import 与 Production execution。它们必须转向精确
owner/route，并产出该 owner 的合同；对应的六条 committed live specialist
replay 也必须在 `mustNotActivate` 中排除 Director。runtime 测试同时将这些
case ID、manifest owner 与 route 固定，防止将来只改文字而悄然夺回职责。

输入集至少包含典型、边界、对抗、中文/英文混合、长上下文、缺少 exact ref、冲突 owner、格式要求冲突等情况。

## 建议实施节奏

### 2.6：闭环加固

1. 弃用并停止生成 ShotSpec 的两个下游反向 ref；迁移示例和 fixture。
2. 已完成：为 live response 增加 payloads，接入 schema、owner 与语义校验。
3. 已完成：新增 DirectorRepair，并在 schema、语义、架构、runtime 和行为评测中锁定 direct/delegate 边界。
4. 已完成：Storyboard 增加 identity、exact action refs、coverage ledger 与可选 BoardAssemblyPlan panel bindings。
5. 已完成 Storyboard、Proposal、RenderPlan、MediaImport 专属语义 validator；保持每个 modern exact-ref 字段都有负例。
6. 增加 artifact graph 无环、hash 可计算和 live payload 负例。

### 2.7：专业预演与全路由评测

1. 已完成：CameraPrevisSpec、provider-neutral 示例、schema/semantic/architecture/runtime guards，以及第十条 `camera_previs` static/live route coverage。
2. 已完成：Lighting transport / nullable fill；保留 2.2 读取兼容。
3. route-reference audit 与 8 个不可达文档迁移。
4. 已完成：十条 Director route 均有 schema-valid committed replay，且由 `requiredRouteCoverage` 与 manifest route 顺序共同锁定；六条 static owner-boundary negative 与六条 live specialist replay 共同拒绝 Director 越权。
5. 已完成首个 Director 质量评测层：CinematographyBench 绑定精确 CameraPrevisSpec；DirectorQualityBench 绑定六类精确 Director 工件并拆出镜头目的、动作覆盖、空间连续性、时序因果和人工导演判断；两者都锁定盲评、受训评审、可观察锚点、agreement threshold 和裁决路径，DirectorQualityBench 还要求成对 observed media、左右顺序平衡与两侧观察证据。下一步仅补真实 imported-media 校准对与完成态 review evidence。
6. 决定 MediaImport 的最终 Production 所有权。

### 3.x：移除兼容债务

1. 从 ShotSpec schema 正式删除废弃反向 refs。
2. 移除 legacy string refs，统一 contractRef。
3. 要求所有核心合同 ID/version/contractVersion。
4. 按迁移决定把 MediaImport 路由从 Director manifest 移出。
5. Production 在已完成的 EditorialTimelinePlan、MediaTechnicalProbe、ColorPipelineProfile 与计划型 ContentCredentialHandoff 之外，再增加经审批的 OTIO/EDL/XML export adapter、OCIO transform 与真正的 C2PA validator/manifest adapter；MediaTechnicalProbe 的后续只应扩展经过审查的字段和真实媒体校准，不应变成转码或质量审批器。

## 完成定义

本轮完善真正完成时，应满足：

- 任意 Director 示例进入 artifact graph 后 cycleCount 为 0。
- 每条 manifest route 都有明确 output contract，或显式声明为 no-artifact route 并有测试。
- contractKinds 不能在没有对应 schema-valid payload 时出现。
- 10 条 Director 路由都有 replay fixture；下一阶段为每条关键路由增加至少一个 targeted negative。
- Storyboard 能证明每个必需 action beat 被覆盖，且不会引用未知 beat。
- Proposal 不选择 provider；Production 能根据 capability evidence 做选择。
- Production-ready 时间使用明确 timebase，不依赖不可复现的浮点秒猜测。
- SKILL 路由图中的所有 reference 都存在；目录中的每个 reference 都有 owner 和可达/归档状态。
- DirectorRepair 只修改 Director 拥有的一个最小变量，跨域问题委托正确 owner。
- Production contract-aware repair runner 只接受 exact approved repair plan，保留
  immutable parent 与 exact dependencies，最多生成下一版本 candidate，并以
  `RepairRunReceipt` 暴露 pending human acceptance；不安全或越界运行必须阻断。
- ControlBenchmark 的 DirectorQualityBench 绑定精确 Director 工件和维度化
  pass/warn/fail rubric；带该 scope 的完成态 review 必须有不同 observed media、
  左右顺序校准、两侧观察证据及至少一对 Director 质量 calibration pair。示例
  review 在真实媒体导入前保持 planned。
- 现有 release checks、schema examples、semantic negatives 和 docs link audit 全部通过。

## 明确不建议做的事

- 不再新增一个“大而全的电影百科” reference。
- 不把镜头、灯光、剪辑、色彩和 provider 参数塞进单一 ShotSpec。
- 不用可选 contentHash 规避引用环。
- 不以 generic “cinematic quality” 或 vibe score 代替具体评测维度。
- 不让 Director 选择 provider、保存密钥、执行付费调用或声称媒体已生成。
- 不让 Director 接管 Character identity、Scene geography、Style representation、Prompt compilation、Production timeline/color/provenance。
- 不强制所有镜头填写完整摄影测量或 photometric 数据；高精度字段应按需启用。

## 主要证据

### 本地实现

- [Director SKILL](../../skills/cineweave-director/SKILL.md)
- [Contracts manifest](../../packages/cineweave-contracts/contracts/manifest.json)
- [ShotSpec schema](../../packages/cineweave-contracts/schemas/shot-spec.schema.json)
- [ShotLightingPlan schema](../../packages/cineweave-contracts/schemas/shot-lighting-plan.schema.json)
- [TemporalSpec schema](../../packages/cineweave-contracts/schemas/temporal-spec.schema.json)
- [Storyboard schema](../../packages/cineweave-contracts/schemas/storyboard-output.schema.json)
- [Proposal schema](../../packages/cineweave-contracts/schemas/proposal-output.schema.json)
- [RenderPlan schema](../../packages/cineweave-contracts/schemas/render-plan.schema.json)
- [MediaImport schema](../../packages/cineweave-contracts/schemas/media-import.schema.json)
- [Semantic validator](../../scripts/validate-contract-semantics.mjs)
- [Live runner](../../scripts/run-live-skill-evals.mjs)
- [Live response schema](../../tests/behavior/live-response.schema.json)
- [Director live fixture](../../tests/fixtures/live-responses/live.director.motivated-shot.json)
- [Architecture](../architecture.md)
- [Roadmap](../roadmap.md)

### 外部一手资料

- [Agent Skills Specification](https://agentskills.io/specification)：progressive disclosure、references/scripts/assets、文件引用和验证约定。
- [OpenAI Build skills](https://learn.chatgpt.com/docs/build-skills)：Skill 激活、description 命中、focused job、显式输入输出和 trigger prompt 测试。
- [OpenAI Evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices)：eval-driven、持续评测、pairwise/specific criteria、人工校准与边界输入。
- [OpenUSD UsdGeomCamera](https://openusd.org/dev/api/class_usd_geom_camera.html)：相机 transform、filmback、projection、focus、f-stop、clipping、shutter 与单位。
- [CameraBench](https://arxiv.org/abs/2504.15376)：摄影机运动 taxonomy，以及 zoom 内参与向前平移外参的区分。
- [OpenTimelineIO serialized schema](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/main/docs/tutorials/otio-serialized-schema.md)：RationalTime、TimeRange、Clip、Track、Timeline、Transition 与 MediaReference。
- [OpenColorIO Displays & Views](https://opencolorio.readthedocs.io/en/latest/guides/authoring/displays_views.html)：scene/display reference space、view transform 和 display colorspace。
- [VBench 2.0](https://github.com/Vchitect/VBench/tree/master/VBench-2.0)：空间关系、动作顺序、人物交互、camera motion、身份/服装与物理一致性等分解维度。
- [C2PA 2.3 Technical Specification](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)：manifest、claim、内容绑定、签名、验证与 provenance 的边界。

## 限制

- 本报告审阅的是 2026-08-31 当前工作树，包含尚未提交的实现改动；没有回退或覆盖这些改动。
- 外部模型和 provider 能力变化很快，因此没有把任何模型版本、价格、节点或仓库活跃度写成 Director 的永久事实。
- CameraPrevis、OTIO、OCIO 和 C2PA 方案的计划层不代表当前工作区已经安装或验证对应适配器；尤其当前没有 `c2patool` 或 C2PA package。
- 本次输出包含研究、设计建议、Director/P1 迁移，以及 EditorialTimelinePlan、ColorPipelineProfile、ContentCredentialInspection 和 ContentCredentialHandoff 的计划层 schema、示例、语义校验、文档与 fixture 增量；实际 OTIO/OCIO/C2PA adapters 仍应逐项迁移并保持 release checks 可回滚。
