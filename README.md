<p align="center"><img src="assets/cineweave-director-logo.png" alt="CineWeave 导演标志" width="160"></p>
<h1 align="center">CineWeave 导演</h1>
<p align="center">从想法到故事、角色资产、分镜与提示词的中文 AIGC 创作 Skill。</p>

输入一句创意、一段剧本或参考素材，得到当前需要的可编辑创作稿。可以只写一条生图提示词，也可以开发完整短片；复杂资料随任务读取，创作者无需理解数据契约。

## 开始创作

要完整交付，可直接提出“开发一部短片并生成全套提示词”。[短片创作流程](skills/cineweave-director/references/optional/short-film-creation.md)统一叙事、视觉开发、导演摄影、配音和剪辑；[完整样例《留一盏灯》](skills/cineweave-director/references/optional/short-film-example.md)展示每项可复制稿，不用自行补齐被省略的镜头。

支持文字驱动单镜／多镜视频、单首帧、首尾帧、全能参考，以及九宫格或其他分镜参考板的视频规划。先按任务选择输入条件和镜头组织，再交付对应稿件；不要求每条路径先生成首尾帧。实际模型和界面支持分别核验。多镜头任务按依赖安排试片、候选筛选、局部修复和剪辑验收；普通创作直接交付中文稿，JSON 契约与节点标签按需要启用。

完整影像方案按真实拍摄逻辑统一空间与轴线、构图、摄影、灯光、收音、场记和剪辑；输出场次基线、逐镜卡、图像／视频／声音稿及验收点。详细方法见[拍摄系统与部门协同](skills/cineweave-director/references/optional/prompt-detail-standard.md#拍摄系统与部门协同)。

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

默认充分展开人物表情、动作、妆发服饰、肌肤与仪态，场景类型、结构、材质和色调，以及镜头与视频动作时序。采用专业术语并说明具体可见结果；完整清单和连贯示例见[提示词细节规范](skills/cineweave-director/references/optional/prompt-detail-standard.md)。精简的是重复内容，创作稿不以短为目标。

默认简体中文。准确台词、字幕、标题和专有名称按用户原文保留；只有明确要求时提供其他语言稿。普通提示词直接给可复制正文，需要节点化交付时才添加适用的中文标签。

## 能做什么

| 创作任务 | 交付内容 |
| --- | --- |
| 故事与短剧 | 世界背景、梗概、因果节拍、场次、台词及连续性 |
| 人物／场景／道具资产 | 稳定身份、当前外观、空间与材质、视图计划、提示词 |
| 单图与视觉开发 | 主体、动作瞬间、取景、光线、质感及针对性负向约束 |
| 分镜与图生视频 | 逐镜初态、动作、终态、运镜、表演、声音及剪辑余量 |
| 参考与修复 | 参考职责分工、可见问题、保留项、最小修改及复查点 |

创作时保留同一人物、服装、空间和视觉基线。每句提示词应有可见作用，避免堆叠空泛修饰；首帧画面与视频过程分开，不用一张静帧证明整段动作完成。完整演示见[三镜头创作示例](skills/cineweave-director/references/optional/creative-workflow-evaluation.md#worked-three-shot-draft)。

这是创作与规划 Skill，不调用生成平台，也不把计划当作媒体结果。模型参数、参考槽位和时长档位按实际界面核验；没有素材时可以提供方案，不能虚构观察。

## 按需使用的指南

- [Skill 入口](skills/cineweave-director/SKILL.md)：交付规模、创作顺序与领域路由。
- [镜头工作台](skills/cineweave-director/references/optional/shot-design-workbench.md)：注意力、动作瞬间与关键帧准备度。
- [节点标签](skills/cineweave-director/references/optional/tagged-video-nodes.md)：各类型只填写适用内容。
- [表演与运镜](skills/cineweave-director/references/optional/video-performance-direction.md)：台词、情绪、表情、动作与特效。
- [群像调度与逐镜评审](skills/cineweave-director/references/optional/ensemble-direction-and-review.md)：演员触发、配角任务、六视角检查与单变量修订。
- [平台适配](skills/cineweave-director/references/optional/video-platform-adaptation.md)与[剪辑余量](skills/cineweave-director/references/optional/video-timing-and-handles.md)：参考、时长与人工交接。
- [连续性](skills/cineweave-director/references/core/visual-bible-and-continuity.md)与[诊断](skills/cineweave-director/references/optional/generation-diagnostics.md)：保留已通过部分，修复明确问题。

## 使用当前源码

当前中文与创作增强尚未发布，版本号仍为 `3.1.0`；旧 `v3.1.0` 标签不包含本工作树改动。将当前仓库的 `skills/cineweave-director/` 完整目录放入宿主的技能目录，或按宿主支持方式加载当前源码。不要只复制 `SKILL.md`，它需要相邻参考与脚本。

仓库维护者可先构建 `.build/cineweave-director`，该目录包含完整插件分发内容。旧版安装说明与版本发布约定见[贡献指南](CONTRIBUTING.md)。

## 可选检查与结构化交付

只读检查器需要 Node.js 22+，普通创作不需要运行脚本：

```powershell
node skills/cineweave-director/scripts/check-delivery.mjs --text "值得专程回来"
node skills/cineweave-director/scripts/check-delivery.mjs worksheet.json
node skills/cineweave-director/scripts/check-video-plan.mjs workbook.json
node skills/cineweave-director/scripts/check-shot-review.mjs review.json
```

交付检查器检查字数、成片时间线与字幕；视频检查器检查节点、参考声明和生成余量；逐镜检查器检查所选视角的覆盖、结论与未决项。它们不验证真实媒体效果或平台能力。

系统集成需要规范 JSON 时，按[契约索引](skills/cineweave-director/resources/contracts/index.json)读取对应 schema 与示例；工作稿不必填写整套协议。机器字段、枚举、参数及哈希保持兼容，说明与创作文本使用中文。示例中的许可、引用和回执是模拟数据。

## 维护与验证

```powershell
npm test
npm run contracts:index:check
npm run validate
npm run build
npm run validate:bundle
```

修改 schema 或规范示例后先执行 `npm run contracts:index` 重建字节索引。Skill 知识按[加载清单](skills/cineweave-director/reference-lifecycle.json)分发，开发评测留在 `tests/evaluations/`。结构校验、中文审阅和真实创作效果分别验收。

实现取舍与来源见[贡献指南](CONTRIBUTING.md#创作-skill-设计依据)；外部导演 Skill 的拆解与独立融入记录见[六部门评审报告](tests/evaluations/2026-09-16-leos-review.md)。安全说明见[SECURITY.md](SECURITY.md)，许可证为 [MIT](LICENSE)，保留原始法律文本。
