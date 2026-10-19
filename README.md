<p align="center"><img src="assets/cineweave-director-logo.png" alt="CineWeave 导演标志" width="160"></p>
<h1 align="center">CineWeave 导演</h1>
<p align="center">从想法到故事、角色资产、分镜与提示词的中文 AIGC 创作 Skill。</p>

输入一句创意、一段剧本或参考素材，得到当前需要的可编辑创作稿。可以只写一条生图提示词，也可以开发完整短片；复杂资料随任务读取，创作者无需理解数据契约。

这是统一入口的 Skill 工作流：从 `$cineweave-director` 进入，入口判断本次要的结果，按需执行内部能力，再统一交付。用户只需描述需求，单图、参考整理、平台适配和评审都使用同一入口。

| 工作流能力 | 何时执行 | 返回入口的结果 |
| --- | --- | --- |
| 导演创作 | 需要需求分析、新母稿、人物场景、动作或分镜 | 当前所需的完整创作稿 |
| 参考分析 | 需要分析实际素材或整理已声明的参考用途 | 观察、迁移／排除范围、绑定与未决项 |
| 平台适配 | 已有母稿且需要指定平台的投射 | 忠实复制稿、实际控件及待核对项 |
| 评审修复 | 请求检查、正式评审或处理明确问题 | 有依据的问题、最小修订责任与复查 |

只执行当前请求需要的步骤。内部结果返回导演入口后检查原请求、硬锁和完整性，再合并成一个最终结果；有上游问题则回到负责能力修订。默认同一代理执行，不需要后台调度服务。

## 阶段结果产物验收（完整短片）

对于完整制作，CineWeave 现在要求**每阶段都有真实可查看的结果**：导演卡与完整剧本、视觉六卡（风格／配色／材质／灯光／光位／LookDev）、空间图、走位表、分镜板、剪辑时间线、试片单和审阅报告。设计卡已经出图 ≠ 真实生成视频和材质样片已经通过。[查看 G0–G7 两条完整案例的 26 份图板](tests/evaluations/2026-10-16/stage-results-v1.md)。仓库开发检查：`npm run stage:check`（只读，不执行生成，也不认证实际媒体质量）。

## 开始创作

要完整交付，可直接提出“开发一部短片并生成全套提示词”。[短片创作流程](skills/cineweave-director/references/optional/short-film-creation.md)统一叙事、视觉开发、导演摄影、配音和剪辑；[完整样例《留一盏灯》](skills/cineweave-director/references/optional/short-film-example.md)展示每项可复制稿，不用自行补齐被省略的镜头。

支持文字单镜／多镜、单首帧、首尾帧、全能参考及分镜板视频规划；按任务选择路径，不要求所有任务先制首尾帧。完整方案统一空间、摄影、灯光、声音与剪辑，模型和界面支持另行核验。

```text
使用 $cineweave-director。为原创纸灯节写一条海报提示词，
竖版，画面中央留出标题区域，细节由你设计。
```

```text
使用 $cineweave-director。把“信使归还一把钥匙”写成 12 秒无声短片。
给出角色资产、三个镜头、每镜首帧与视频运动提示词，保持空间连续。
```

```text
使用 $cineweave-director。先设计一张九宫格分镜参考图，再写整板参考的视频提示词。
明确每格对应镜头或动作阶段、阅读顺序和时长；整板参考，不必逐镜制作首尾帧。
```

```text
使用 $cineweave-director。保留这张角色图的脸与服装，
设计她把灯笼递向镜头的图生视频提示词，包含表情、运镜和剪辑余量。
```

默认简体中文，指定台词、字幕、标题和专有名称保留原文。提示词充分展开与画面有关的人物、场景、摄影及动作细节，使用专业术语并落实到可见结果；完整规范见[提示词细节规范](skills/cineweave-director/references/optional/prompt-detail-standard.md)。普通草稿直接交付并检查相关维度；综合评审、完整场次定稿及镜头组正式交接执行六视角逐镜评审。JSON 契约与节点标签按需使用。

## 能做什么

| 创作任务 | 交付内容 |
| --- | --- |
| 故事与短剧 | 世界背景、梗概、因果节拍、场次、台词及连续性 |
| 人物／场景／道具资产 | 稳定身份、当前外观、空间与材质、视图计划、提示词 |
| 单图与视觉开发 | 主体、动作瞬间、取景、光线、质感及针对性负向约束 |
| 分镜与图生视频 | 逐镜初态、动作、终态、运镜、表演、声音及剪辑余量 |
| 参考与修复 | 参考职责分工、可见问题、保留项、最小修改及复查点 |

这是创作与规划 Skill，不调用生成平台，也不把计划当作媒体结果。模型参数、参考槽位和时长档位按实际界面核验；没有素材时可以提供方案，不能虚构观察。

## 按需使用的指南

- [场次级导演生产关卡](skills/cineweave-director/references/optional/scene-directing-pipeline.md)：八阶段从戏剧任务、场景地理、Blocking、覆盖、声音剪辑到小样和修复；完整短片／正式连续镜头才加载，不影响普通单图。
- [《玄奘》双段重要实践案例](skills/cineweave-director/references/optional/xuanzang-director-case-study.md)：约 11:47＋10:59 两段课程的可采纳导演方法、反例与 CineWeave 迁移，明确作者口播与案例推论边界。

- [Skill 入口](skills/cineweave-director/SKILL.md)：交付规模、创作顺序与领域路由。
- [镜头工作台](skills/cineweave-director/references/optional/shot-design-workbench.md)：注意力、动作瞬间与关键帧准备度。
- [镜头语言与叙事作用词典](skills/cineweave-director/references/optional/cinematic-patterns.md#镜头语言与叙事作用词典)：7 种核心技法、28 种扩展、中文镜头示例及 AIGC 分镜交接；影视叙事必经逐镜选镜。
- [群像调度与逐镜评审](skills/cineweave-director/references/optional/ensemble-direction-and-review.md)：演员触发、配角任务、六视角检查与单变量修订。
- [平台适配](skills/cineweave-director/references/optional/video-platform-adaptation.md)与[剪辑余量](skills/cineweave-director/references/optional/video-timing-and-handles.md)：参考、时长与人工交接。
- [画质与引擎流程](skills/cineweave-director/references/optional/rendering-quality-workflows.md)：画风规则、Unreal／Blender 预演与渲染、采样、色管和交付验收。
- [AIGC 控制与评审](skills/cineweave-director/references/optional/aigc-control-and-evaluation.md)：结构／身份／风格参考分工、局部编辑保留及对照试片。
- [连续性](skills/cineweave-director/references/core/visual-bible-and-continuity.md)与[诊断](skills/cineweave-director/references/optional/generation-diagnostics.md)：保留已通过部分，修复明确问题。

## 安装与使用

本版为 `3.2.0`，安装使用固定版本标签 `v3.2.0`；旧 `v3.1.0` 不包含本版的统一入口和影视参考库。完整工作流包含四个 `skills/` 目录，从 `$cineweave-director` 开始。内部三个 Skill 由入口明确交接，不自动作为独立用户入口。不要只复制 `SKILL.md`，各目录都需要相邻参考与脚本。

```bash
codex plugin marketplace add Wilder1222/cineweave-director --ref v3.2.0
codex plugin add cineweave-director@cineweave-director
```

已配置该版本来源时，可先运行 `codex plugin marketplace upgrade cineweave-director`，再运行安装命令。安装后核对宿主显示的版本与实际参考文件；宿主尚未重新加载时，在新会话中使用新版。源码合并与本地构建不会自动更新已有安装。

仓库维护者先执行 `npm run skills:sync` 再构建 `.build/cineweave-director`，该目录包含完整工作流。可用 `node scripts/build-plugin-bundle.mjs --skill cineweave-review` 构建自包含单叶包；这用于独立分发和兼容检查。只装导演时，同一入口用本包资料恢复缺失内部能力。宿主可能显示带插件前缀的名字，例如 `cineweave-director:cineweave-review`，入口按实际发现的准确路径交接。用户现有插件缓存不会由构建自动更新。旧版安装说明与版本发布约定见[贡献指南](CONTRIBUTING.md)。

## 可选检查与结构化交付

只读检查器需要 Node.js 22+；完整六视角评审在 Node 可用时整理工作表并实际检查，草稿和局部请求可人工聚焦检查。选择工作表且 Node 可用时也须实际检查：

```powershell
node skills/cineweave-director/scripts/check-delivery.mjs --text "值得专程回来"
node skills/cineweave-director/scripts/check-delivery.mjs worksheet.json
node skills/cineweave-director/scripts/check-video-plan.mjs workbook.json
node skills/cineweave-director/scripts/check-video-plan.mjs workbook.json --evaluation-date 2026-10-12
node skills/cineweave-director/scripts/check-shot-review.mjs review.json
node skills/cineweave-director/scripts/check-shot-review.mjs --camera-language camera-workbook.json
node skills/cineweave-director/scripts/check-change-impact.mjs impact.json
```

交付检查器检查字数、成片时间线与字幕；视频检查器检查节点、参考声明和生成余量；逐镜检查器检查所选视角的覆盖、结论与未决项；[变更影响检查器](skills/cineweave-director/references/optional/drafts-and-change-impact.md#只读变更影响查询)查询声明字段的消费者、传递影响和依赖待审项。它们不验证真实媒体效果或平台能力。

视频工作表可选填[返回音频与采用窗口](skills/cineweave-director/references/optional/video-sound-and-delivery.md)，核对声明的时长、来源区间、同步锚点及指定模板配对。提供评估日期才比较证据查阅日期；填写测量来源或通过时间算术不会提升为实际媒体、测量或权利已验证。

系统集成需要规范 JSON 时，按[契约索引](skills/cineweave-director/resources/contracts/index.json)读取对应 schema 与示例；工作稿不必填写整套协议。机器字段、枚举、参数及哈希保持兼容，说明与创作文本使用中文。示例中的许可、引用和回执是模拟数据。

## 维护与验证

```powershell
npm run skills:sync
npm run skills:sync:check
npm test
npm run contracts:index:check
npm run validate
npm run build
npm run validate:bundle
npm run test:bundle
```

修改 schema 或规范示例后先执行 `npm run contracts:index`。校验同时覆盖本地章节链接和隔离包内工具。开发评测留在 `tests/evaluations/`，不随 Skill 分发。

多 Skill 的目标边界、共享契约与编排验证见[拆分和编排计划](tests/evaluations/cineweave-skill-split-orchestration-plan-2026-10-12.md)，实际启用与逐阶段审阅见[执行记录](tests/evaluations/cineweave-split-execution-2026-10-12.md)。当前目录已启用导演、平台适配、参考分析与评审修复；以 `skill-catalog.json` 的启用集合为准。

本轮项目审阅、最佳实践取舍、实施计划和实际验证见[2026-09-23 改进记录](tests/evaluations/project-review-2026-09-23.md)。

电影摄影、画风画质、引擎与真人表演的新增来源、实施落点和文字试跑见[2026-10-10 专业制作调研](tests/evaluations/professional-craft-research-2026-10-10.md)。实际媒体质量须依据生成或拍摄结果另行验收。

[专业导演优化计划](tests/evaluations/director-methods-optimization-plan-2026-10-10.md)的分阶段实施见[2026-10-11 执行记录](tests/evaluations/director-optimization-2026-10-11.md)。时间契约检查区分本地有效与精确上游覆盖；完整覆盖缺证据时查看 `unverified`。导演方法与复制稿的关系可参照[同场覆盖对照](skills/cineweave-director/references/optional/shot-design-workbench.md#同一场次的覆盖对照)。

[Higgsfield 对标重构计划](tests/evaluations/higgsfield-skills-refactor-plan-2026-10-11.md)与[分阶段执行记录](tests/evaluations/higgsfield-refactor-execution-2026-10-12.md)记录精确上下文、平台复制稿、镜头程序和变更传播的新增检查。调用方注册表和能力档案仍是声明来源，结构与哈希一致不证明实际权利、当前服务支持或媒体质量。

维护约定与来源见[贡献指南](CONTRIBUTING.md)，安全说明见 [SECURITY.md](SECURITY.md)，许可证为 [MIT](LICENSE)。
