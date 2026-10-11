<p align="center"><img src="assets/cineweave-director-logo.png" alt="CineWeave 导演标志" width="160"></p>
<h1 align="center">CineWeave 导演</h1>
<p align="center">从想法到故事、角色资产、分镜与提示词的中文 AIGC 创作 Skill。</p>

输入一句创意、一段剧本或参考素材，得到当前需要的可编辑创作稿。可以只写一条生图提示词，也可以开发完整短片；复杂资料随任务读取，创作者无需理解数据契约。

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

默认简体中文，指定台词、字幕、标题和专有名称保留原文。提示词充分展开与画面有关的人物、场景、摄影及动作细节，使用专业术语并落实到可见结果；完整规范见[提示词细节规范](skills/cineweave-director/references/optional/prompt-detail-standard.md)。JSON 契约与节点标签按需使用。

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

- [Skill 入口](skills/cineweave-director/SKILL.md)：交付规模、创作顺序与领域路由。
- [镜头工作台](skills/cineweave-director/references/optional/shot-design-workbench.md)：注意力、动作瞬间与关键帧准备度。
- [群像调度与逐镜评审](skills/cineweave-director/references/optional/ensemble-direction-and-review.md)：演员触发、配角任务、六视角检查与单变量修订。
- [平台适配](skills/cineweave-director/references/optional/video-platform-adaptation.md)与[剪辑余量](skills/cineweave-director/references/optional/video-timing-and-handles.md)：参考、时长与人工交接。
- [画质与引擎流程](skills/cineweave-director/references/optional/rendering-quality-workflows.md)：画风规则、Unreal／Blender 预演与渲染、采样、色管和交付验收。
- [AIGC 控制与评审](skills/cineweave-director/references/optional/aigc-control-and-evaluation.md)：结构／身份／风格参考分工、局部编辑保留及对照试片。
- [连续性](skills/cineweave-director/references/core/visual-bible-and-continuity.md)与[诊断](skills/cineweave-director/references/optional/generation-diagnostics.md)：保留已通过部分，修复明确问题。

## 使用当前源码

当前中文与创作增强尚未发布，版本号仍为 `3.1.0`；旧 `v3.1.0` 标签不包含本工作树改动。将当前仓库的 `skills/cineweave-director/` 完整目录放入宿主的技能目录，或按宿主支持方式加载当前源码。不要只复制 `SKILL.md`，它需要相邻参考与脚本。

仓库维护者可先构建 `.build/cineweave-director`，该目录包含完整插件分发内容。旧版安装说明与版本发布约定见[贡献指南](CONTRIBUTING.md)。

## 可选检查与结构化交付

只读检查器需要 Node.js 22+；完整叙事镜头组按 Skill 要求执行逐镜检查，其他任务按需使用：

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
npm run test:bundle
```

修改 schema 或规范示例后先执行 `npm run contracts:index`。校验同时覆盖本地章节链接和隔离包内工具。开发评测留在 `tests/evaluations/`，不随 Skill 分发。

本轮项目审阅、最佳实践取舍、实施计划和实际验证见[2026-09-23 改进记录](tests/evaluations/project-review-2026-09-23.md)。

电影摄影、画风画质、引擎与真人表演的新增来源、实施落点和文字试跑见[2026-10-10 专业制作调研](tests/evaluations/professional-craft-research-2026-10-10.md)。实际媒体质量须依据生成或拍摄结果另行验收。

[专业导演优化计划](tests/evaluations/director-methods-optimization-plan-2026-10-10.md)的分阶段实施见[2026-10-11 执行记录](tests/evaluations/director-optimization-2026-10-11.md)。时间契约检查区分本地有效与精确上游覆盖；完整覆盖缺证据时查看 `unverified`。导演方法与复制稿的关系可参照[同场覆盖对照](skills/cineweave-director/references/optional/shot-design-workbench.md#同一场次的覆盖对照)。

维护约定与来源见[贡献指南](CONTRIBUTING.md)，安全说明见 [SECURITY.md](SECURITY.md)，许可证为 [MIT](LICENSE)。
