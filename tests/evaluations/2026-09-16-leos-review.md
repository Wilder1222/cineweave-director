# 2026-09-16 Leos 六部门导演组：源码审阅与融合记录

## 来源和范围

审阅来源：[MasterLeos/leos-six-department-directing-team-skill-v1](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/tree/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4)，本轮克隆得到提交 `2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4`。分析对象是该提交的入口、11 份参考、5 份模板、2 个 Python 校验器及显示配置，不代表未来版本。

这个快照没有 LICENSE；README 也说明未附许可证。本项目仅吸收设计思想并独立实现，不复制其代码、模板、媒体、提示词库或内部会议材料。上游引用的匿名会议不可公开复核；本轮没有复测视频模型、付费课程或私人案例，不把这些材料当作效果证明。

本地基线是当前单技能 v3 架构：12 条内部路由、52 种根契约、54 个 schema、自包含发行包。早期多技能/运行时方案不适用于本次工作。已有 v3.1.0 标签不变，改动归入 Unreleased。

## 设计拆解

| 层 | 上游实现 | 价值与边界 |
| --- | --- | --- |
| 激活与组织 | [SKILL.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/SKILL.md) 用一个技能承载六种职责 | 是角色化思考协议；没有六个独立 agent 的调度、隔离、消息协议或运行时 |
| 创作依赖 | 共享场次输入，导演定目标，其他职责分别完善表演、群戏和摄影，再编译提示词 | 避免不同角色各自改戏；和 CineWeave 的单向领域权威相容 |
| 知识加载 | 任务表映射 references，但综合导演方案要求读取全部参考 | 对小任务友好；综合任务成本高，且多个文件重复生成门与字数约束 |
| 表演与场面 | [performance-direction.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/performance-direction.md) 与 [directing-grammar.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/directing-grammar.md) 强调具体任务、接收刺激和环境活动 | 最有价值的是可观察行为与主次关系；不应变成每个身体部位都必须变化、每个远景人物都要填表 |
| 摄影与参考 | 独立摄影参考、共享空间、参考职责和连续性入口 | 当前项目已覆盖大部分内容，继续用既有 ShotSpec、SceneLightState 和 ReferenceBindingSet，不再建立一套权威 |
| 提示词 | [prompt-director.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/prompt-director.md) 指定中文文本模板、5000 非空白字符、逐版登记及审稿 | 适合作者特定交付习惯；不是跨模型限制，也不应排斥用户要求的 JSON 或重复询问已授权的提示词写作 |
| 审稿 | 六种职责与每一镜构成完整检查矩阵 | 可以防止只挑问题镜头，但覆盖完整不等于内容、证据或艺术效果合格 |
| 连续性与反馈 | [continuity-and-learning.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/continuity-and-learning.md) 分开连续性、Prompt 版本和 Take 记录，比较可用片段边界 | 值得保留的是追溯和局部保留；CSV 是人工模板，没有关系校验、持久化实现或自动证据采集 |
| 方法沉淀 | [knowledge-and-provenance.md](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/knowledge-and-provenance.md) 区分一般方法、当期参数、项目配置 | 有助于避免项目偏好污染通用技能；少数成功案例或导演偏好不能证明跨项目因果，维护技能仍需明确任务授权 |

整体判断：上游的强项是将创作判断变成逐镜可操作的工作单；实现主体仍是提示协议和模板。当前项目更适合吸收它的检查视角与细节表达，沿用自身的结构契约、证据边界和分发验证。

## 实测的校验边界

在临时目录构造两个无有效创作内容的输入，对上述提交运行原脚本；不修改上游，不把这些测试文件加入发行包。

1. `validate_review_coverage.py <review.md> --shots 1`：输入仅含六行“角色、镜头号”，没有结论、观察、建议或验收。实际返回 `VALID`、6 个配对、退出码 0。原因是正则只提取前两列；脚本正确证明配对存在，但不能证明审稿发生。
2. `validate_prompt_text.py <prompt.txt>`：输入包含一个镜头和全部必需字段标签，但字段值全部为空。实际返回 `VALID`、63 个非空白字符、1 镜、退出码 0，并给出比例警告。原因是字段校验使用子串存在性；没有检查字段内容或导演语义。

这是对其 README 所述“结构校验”的具体边界验证，不是声称脚本承诺了艺术质量。模板与执行规则还存在可维护性问题：正文建议的 20%/65% 预算与脚本的 25%/55% 警告阈值不同；固定画幅/时长的旧文本黑名单也无法区别“用户明确要求”与“模型擅自补入”。这些规则不移植。

## 融合决策与实际落点

| 决策 | 当前项目实现 | 可验证行为 |
| --- | --- | --- |
| 六职责作为视角，领域权威不变 | [ensemble-direction-and-review.md](../../skills/cineweave-director/references/optional/ensemble-direction-and-review.md)，按需从入口、Character、Direction、Review 路由加载 | full 为六视角；focused 只检查明确选择的视角，不自动创建 agent |
| 更具体的表演与群戏 | 可演任务、接收刺激、错峰反应、环境注意力、退出状态及修理铺示例 | 对应既有 PerformanceTimeline、ShotSpec.blocking、composition、promptHandoff 和 TemporalSpec；不发明 schema 字段 |
| 逐镜审稿可检查 | [check-shot-review.mjs](../../skills/cineweave-director/scripts/check-shot-review.mjs) 与专门回归 | 检查缺行、重复、越界、空状态/观察、来源定位、修订责任域；未知项不能完成；全不适用不能声称完成 |
| 提示词长度由任务决定 | worksheet 可选 Unicode 非空白码点预算 | 无默认 5000 上限；超限报告，不改写原文；不以 UTF-16 长度或汉字数代替码点数 |
| 视频交付可发现 | `prepare_video_handoff` 意图及 video guide 接口 | 输出时间化草稿工作单；不把视频序列塞入图像 PromptRecord，不新增 provider 执行 |
| 方案与成片审查分开 | 检查器只接收 design/prompt，返回 `scope: plan_only` | 不接受 media 类型；不能将方案通过登记为实际媒体通过 |
| 时间线断言落成实现 | [validate-output.mjs](../../scripts/validate-output.mjs) 的 PerformanceTimeline 语义校验及 schema 说明 | 唯一 phaseId、正时长、有序、不重叠、不越总时长；允许保留状态的间隙，契约版本不变 |
| 保护可用表演与追溯 | Review 与可选指南中的选用片段边界、Prompt/Take 分账、单变量修复 | 保存区间和观察依据；不以好表演抵消阻断错误、不自动执行修复或写学习记忆 |
| 安装可用 | lifecycle、分发 allowlist、CI 测试入口同步 | 引用和 helper 随包发布；schema 哈希重建；不修改已发布标签 |

没有新增根契约或重复权威；扩展的 JSON 是明示的非 canonical 检查工作单。脚本只验证其内部一致性，不能确认用户提供的 shotIds 已穷尽源文档、定位字符串真实可访问，或观察内容与原文相符。这些仍须实际审阅。

## references 内容逐份融入

前两轮重点是协作流程、路由和校验；本轮继续把具体创作知识独立改写到各自领域文档。采用同一固定源码快照，不复制其文档或再建立一套同名参考库。现有内容充分覆盖的条目复用原入口，不为对应文件数量制造重复文档。

| 上游 references 文件 | 值得吸收的内容 | 现有落点与处理 |
| --- | --- | --- |
| `role-council.md` | 共享场次、职责接口、分歧裁决 | [ensemble-direction-and-review](../../skills/cineweave-director/references/optional/ensemble-direction-and-review.md) 已融入；角色是视角，修复仍由事实所属领域负责 |
| `directing-grammar.md` | 可见动作、空间变化、道具状态、背景活动 | 群戏内容已有；本轮补入 [action](../../skills/cineweave-director/references/routes/action.md) 的中间状态、分支选择和叙事危险距离；不迁移可执行危险操作 |
| `performance-direction.md` | 台词目标、听者、重音、停顿中的行为 | [directing-craft](../../skills/cineweave-director/references/optional/directing-craft.md) 新增对白行动方法和原创柜台示例；刺激链及节制微动作复用既有内容 |
| `cinematography-direction.md` | 机位／运动动机，光学效果的来源、时点和落点 | [cinematography-craft](../../skills/cineweave-director/references/optional/cinematography-craft.md) 新增光学效果与光区变化检查；保留现有正确的机位／焦距区别，不把设备名变成质量保证 |
| `spatial-and-assets.md` | 唯一空间锚点、尺度核对、参考职责和控制强度 | [scene](../../skills/cineweave-director/references/routes/scene.md) 补关系图与尺度证据；[reference-evidence](../../skills/cineweave-director/references/routes/reference-evidence.md) 补按需求约束与原图对照；不以裁切掩盖硬空间矛盾，不断言所有图改图必然退化 |
| `generation-control.md` | 分段生成的连续性、共享状态和接缝 | [video-sound-and-delivery](../../skills/cineweave-director/references/optional/video-sound-and-delivery.md) 新增 clip 边界与落袋交接示例；保持提案属性，实际素材才能证明重叠区间可用 |
| `prompt-director.md` | 将定案转译成简洁、可观察的文本，保留版本差异 | 已融入 image_prompt、video 与 ensemble 指南；不增加统一 5000 字、纯文本唯一格式或重复授权要求 |
| `review-and-repair.md` | 整体判断后定位问题、保住可用区间、局部修复 | [review-repair](../../skills/cineweave-director/references/routes/review-repair.md) 补按叙事影响分级、可区分根因的证据检查，以及从现有剪辑到上游重设计的选择依据 |
| `continuity-and-learning.md` | 实际选用边界、版本／Take 分账、反例和经验追溯 | 前两轮已吸收连续性部分；本轮在 [drafts-and-change-impact](../../skills/cineweave-director/references/optional/drafts-and-change-impact.md) 补观察到经验的证据边界 |
| `knowledge-and-provenance.md` | 项目决定、模型行为和通用方法分层 | 同上，增加条件、原始来源、变量、反例、日期和置信说明；不把固定案例数或导演偏好当成普遍因果证据 |
| `output-contracts.md` | 按任务选择交付结构、带依据的逐镜表 | 复用现有 canonical 契约及非 canonical 审稿 worksheet；不引入与现有 schema 并行竞争的输出协议 |

内容采用方式是“触发条件、具体决策、失败信号、可观察验收”，不把经验句式升格成所有项目的硬规则。时变模型参数、实际操作能力和价格仍需独立的当期官方证据；本轮没有核验或迁移这些主张。匿名会议内容也没有被包装为可公开验证的依据。

这次补充仅修改文档，没有新增契约、helper 或发行文件；源码链接与分发检查、契约索引检查和 bundle 构建重新执行通过。下面的 36 项代码测试与 CLI 流程结果来自前一实施阶段，本轮未重复运行代码测试，也没有新增艺术效果验证声明。

## 验证记录

本轮实际执行结果：

| 检查 | 结果 |
| --- | --- |
| 上游两个反例探针 | 复现空审稿、空字段提示词仍返回 VALID 的结构校验边界 |
| `npm test` | 36 项通过，0 失败；其中 9 项审稿 helper/流程测试、1 项 PerformanceTimeline 语义回归为新增 |
| `npm run contracts:index` / `contracts:index:check` | schema 说明修改后的哈希已重建并一致；52 根契约、2 支持 schema |
| `npm run validate` | 源码通过：147 分发文件、32 参考、54 schema、52 示例 |
| `npm run build` / `validate:bundle` | 147 文件逐字节一致；路径、链接、契约及包闭包通过 |
| bundle 安装独立性 | 从仓库外临时工作目录调用已构建 helper；指南 JSON 示例得到完整审稿，21 个非空白码点；改为 unknown 返回退出码 2；原 delivery helper 仍正确计算六字旁白 |
| skill-creator `quick_validate.py` | Windows 默认 GBK 首次读取 UTF-8 文件失败；使用 `python -X utf8` 运行通过，无需修改项目编码或安装依赖 |
| `git diff --check` | 通过 |

这些是静态一致性、真实 CLI 和结构回归证据；审稿测试中的观察文本为虚构 fixture。行为任务未作为独立模型测评运行，不能把单元测试数当成艺术效果通过数。

## 融入默认流程与执行闭环

后续“执行融入逻辑”落实到默认调用路径：入口的交付检查明确按任务自动启用，storyboard_rhythm 与 image_prompt 补上继承接口。完整叙事镜头组／视频提示词交接使用六视角，单项摄影或表演请求保留 focused 范围，单张静物、精确翻译和参考分析不附加无关流程。

执行路径为：共享场次与选定版本 → 人物刺激和背景任务 → 镜头及分镜出口状态 → 提示词编译 → 逐镜复核 → 责任域内修订 → 新版本与相邻连续性复核。检查器消费复核结果，不自动理解表演语义；实际问题由创作审阅识别。

可重跑输入为 [三镜融合 fixture](../fixtures/ensemble-handoff.json)，由本轮独立编写，未取自上游提示词库。它包含三镜完整文本、18 条有具体依据的审稿，以及一项 Prompt 域修正。通过测试中的真实 CLI 保存／读回，再使用构建包的 helper 实际执行：

| 版本 | 输入状态 | 执行结果 |
| --- | --- | --- |
| v1 | S2 文本写成单据落下前就看向柜台单据，表演视角标为 revise，修复归 Prompt | 18 条覆盖完整，1 项未解决；`reviewComplete: false`，退出码 2 |
| v2 | 仅改成单据落下后才转移视线；其他提示词文本不变，复核修改和相邻出口／入口，定位更新到 v2 | 18 条覆盖完整，0 项未解决；`reviewComplete: true`，退出码 0 |

两版输入、检查输出和可阅读的完整提示词／审稿表保存在本地 `.build/ensemble-integration/`。该目录为开发证据，不进入发行包；持续回归依赖已登记的 fixture 和测试。该阶段没有调用视频生成服务，没有把脚本闭环当成独立模型测评或成片通过，当时也未提交、推送或发布；后续中文分支合并见本文末尾。

需要真实输入才能进一步验证的内容：多人生成表演是否自然、提示词在具体视频模型中的遵循度、实际视听素材的连续性、局部剪辑能否保住表演。当前没有这些成片证据，不声明效果通过。

## 后续行为评估任务

以下是可复现的人工评估任务，未作为独立模型测评运行：

1. 直接请求三镜视频提示词，允许创作草案，但不提供时长/画幅：应完成草稿，显式保留未知，不重复要生成授权。
2. 三人场景，要求一个人不参与争执：应给独立任务及注意对象，不让所有人同步看主角。
3. 只审摄影，shotIds 为 A、C、E：应 focused 覆盖这三镜，不能扩展成六份报告或要求连续数字。
4. 六视角审稿中一镜缺上游道具入口：该行 unknown；其余能检查的继续，不以全覆盖冒充完成。
5. 只提供分镜文字，要求“确认视频反应自然”：可以审查计划，不能声称看过视频。
6. 提供真正可访问的素材及所选用区间：应比较相邻剪辑边界，并分别记录保留区间、症状、根因假设和单变量修法。

## 中文分支合并验收（2026-09-16）

依据用户要求，将 `codex/zh-cn-audit-cleanup-20260914` 的 `f811a4156e4f3115b64fc547799058dd4d17bce4` 合入本地 `main`。远端同名分支与该提交一致；合并前远端 `main` 为 `77790d668e682031f5821fee64c70dc700de654c`。本轮六部门融合已先保存为 `2ee3ab8`，再逐项解决与中文分支的重叠修改。

保留中文分支的完整短片流程、视觉开发、多路径视频、节点标签、时长与余量、拍摄协同和生成诊断；将本轮新增群像评审及八处深度参考融入译为中文，接回现有路由。普通创作使用中文，台词原文、机器 ID、枚举、路径和命令保持兼容。MIT 原始法律文本保留。开发工具提供中文提示与摘要，既有原始机器诊断仍可供排错；新增逐镜检查器的帮助、范围说明和诊断均为中文。

| 检查 | 实际结果 |
| --- | --- |
| 回归测试 | 126/126 通过，包含中文分支视频回归、六视角闭环、时间线语义校验和中文 CLI |
| schema 兼容性 | 与合并前快照逐项比较，54 份 schema 去除 `title`／`description`／`$comment` 后无结构约束差异 |
| 示例兼容性 | 52 份规范示例的键、数组结构、值类型及非字符串值均与合并前一致；自然语言值翻译后通过原 schema 校验 |
| 分发与索引 | 157 个分发文件、41 篇参考、52 根契约、54 份 schema、52 份示例；源码与构建包逐字节一致 |
| 通用 Skill 校验 | 使用 `python -X utf8` 运行 `quick_validate.py` 通过 |
| 安装独立性 | 从仓库外工作目录运行构建包三种只读工具，5 次实际调用通过；六字旁白、12 秒 SRT、视频未核验标志保持正确 |
| 逐镜闭环 | 旧 v1 保持 18 行覆盖、1 项未决、退出码 2；修订 v2 为 18 行覆盖、0 项未决、退出码 0；输入文件未改变 |

可复查的本地结果为 `.build/chinese-merge-tests.log` 与 `.build/chinese-merge-smoke.json`，不加入分发包。此次完成本地主分支合并，不推送远端、不移动 `v3.1.0` 标签、不发布插件，也没有运行新的模型生成或艺术效果评测。
