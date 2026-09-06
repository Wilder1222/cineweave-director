<p align="center">
  <img src="assets/cineweave-director-logo.png" alt="CineWeave Director 标志" width="160">
</p>

<h1 align="center">CineWeave Director（中文版）</h1>

<p align="center">
  一个自包含、全流程且具备证据感知能力的 AIGC 创意导演 Codex Skill。
</p>

<p align="center">
  <a href="https://github.com/Wilder1222/cineweave-director/actions/workflows/validate.yml"><img alt="验证" src="https://img.shields.io/github/actions/workflow/status/Wilder1222/cineweave-director/validate.yml?branch=main&style=flat-square&label=validation"></a>
  <img alt="Codex 插件" src="https://img.shields.io/badge/Codex-Plugin-1D6FFF?style=flat-square">
  <img alt="版本 3.0.0" src="https://img.shields.io/badge/version-3.0.0-14B8A6?style=flat-square">
  <img alt="MIT 许可证" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square">
</p>

CineWeave Director 会将一个粗略想法、已有创意产物或精确视觉参考，转化为最小但足够实用的一组可编辑世界观、故事、角色、场景、风格、动作、镜头、分镜、提示词、投影、计划、审查和修复产物。它是一个带有内部路由的 Skill，而不是隐藏代理链、并列 Skill、产品 CLI 或运行时。

它有意保持为**非执行式**。它不会调用图像/视频提供商、安装模型、运行适配器、摄取私有媒体、发布、批准或声称已生成媒体。提供商专属输出止于有证据支撑的投影与明确的人工交接；制作输出止于计划、控制项、权利关卡和审查要求。

## 能力

| 内部路由 | 用途 | 规范输出 |
| --- | --- | --- |
| `brief_world` | 需求采集、工作流范围、世界规律和 Canon | `CreativeBrief`, `WorkflowPlan`, `WorldBible` |
| `story` | 前提、因果节拍、剧本场景和连续性 | `StoryBrief`, `BeatSheet`, `ScriptScene`, `ContinuityLedger` |
| `character` | 身份、形态、外观、行为和表演 | 角色规范、绑定和时间线 |
| `scene` | 地理、建筑、材料、状态和物理光线 | 场景规范、约束和绑定 |
| `style` | 视觉表征和跨媒介转换 | `StylePackage`、表征与光线语法 |
| `reference_evidence` | 可见证据、权利、精确参考角色和别名 | 参考资产、观察结果、绑定和别名注册表 |
| `action` | 打斗、追逐、逃脱和多节拍交互 | `ActionSequenceSpec` |
| `shot_direction` | 调度、注意力、摄影机、镜头光线、时间和主视觉帧 | 镜头、时序、光线和预演合同 |
| `storyboard_rhythm` | 覆盖、分格、序列时机和转场 | `Storyboard`, `SequenceRhythmSpec` |
| `image_prompt` | Prompt Canon、参考转换和可选提供商投影 | `PromptRecord`, `ImagePrompt`, `PromptProjectionPlan` |
| `production_plan` | 资产、组装、剪辑/调色意图、控制项和可行性 | 非执行式制作计划合同 |
| `review_repair` | 基于证据的基准/审查与受限的单变量修复 | `ControlBenchmark`, `ControlBenchmarkReview`, `CreativeReview`, `RepairPlan` |

此 Skill 只加载请求所需的路由。原创设计可在授权范围内通过已标注的探索和草稿选择推进。有关现有资产、权利和硬能力的事实在获得支撑前保持未解决；提案绝不能静默变为已批准的 Canon。

## 创作者意图

创作者无需了解 12 个路由 ID 或 52 个合同 kind。此 Skill 会将“构建一套完整角色资产”“只分析这张服装参考”“设计这个镜头”“创建分镜”“编译 Midjourney 提示词”或“审查这个候选结果”等自然语言请求映射到最小路由集合。这些创作者意图只是同一 Skill 内轻量的路由快捷方式，而不是命令、额外 Skill 或执行端点。

默认使用既有的 `professional` 交互深度与 **professional-lite 呈现配置**：保留精确授权、证据、锁定项和人工关卡，但给出一份简洁、可读的产物和一个下一步操作。`professional-lite` 不是第五种 `inputMode`、路由或合同值。只有在用户请求或现有合同工作流需要时，才输出规范 JSON。

## 在 Codex 中安装

请安装不可变的发布版本，而不是会持续变动的分支。本仓库包含一个单条目的 [marketplace manifest](.agents/plugins/marketplace.json)，遵循 [Codex 插件打包指南](https://developers.openai.com/codex/plugins/build/)：

```bash
codex plugin marketplace add Wilder1222/cineweave-director --ref v3.0.0
codex plugin add cineweave-director@cineweave-director
```

清单中的 `policy.authentication: ON_INSTALL` 是 Codex marketplace 所需的时序策略；它并不表示此 Skill 需要凭据。该插件没有声明 MCP server、应用集成、提供商适配器或外部执行界面。

安装后请启动一个新任务，让 Codex 发现 `$cineweave-director`。

## 使用

多路由请求可以从宽泛目标开始，同时仍只生成必要产物：

```text
使用 $cineweave-director。将这个短片想法发展为最小且完整的一组世界观、故事、
角色、场景、风格、动作、镜头、分镜和图像提示词产物。保留我给出的精确参考
与未知权利，在人工批准关卡停止，不要声称已经调用提供商。
```

受限请求可以直接进入一个路由：

```text
仅将 $cineweave-director 用于 shot_direction。用调度、注意力顺序、镜头透视、
动机化物理光线、稳定终态和连续性锁定项来设计这个已批准的识别节拍。返回
ShotSpec，而不是图像提示词。
```

对于规范 JSON，请指定所需产物，或要求此 Skill 选择最小根 kind。该分发包包含 52 个根合同、54 个本地 schema 和 52 个规范 fixtures。fixtures 只用于展示结构：其中的 hashes、收据、IDs、权利和批准都不是真实世界证据。

## Midjourney 投影

Prompt Canon 保持提供商中立。当用户明确请求 Midjourney 时，`image_prompt` 路由可创建一份独立的 `PromptProjectionPlan`，其中锁定精确源提示词、能力配置、模型、界面、官方兼容性证据、结构化参数尾部、类型化参考槽位、单变量实验、隐藏默认值检查、人工交接和精确的回传清单。

有时效范围的 [Midjourney 投影指南](skills/cineweave-director/references/optional/midjourney-projection.md) 已于 2026-09-02 依据 Midjourney 官方文档和选定的 GitHub 实现完成核验。它不会自动操作浏览器或提供商 API。可直接复制的提示词仍只是一份计划；执行核验需要可访问的原始文件和精确任务元数据。受限视觉审查可以基于可访问图片进行，同时将缺失元数据明确标为未知。

## 创意控制模型

默认依赖方向为：

```text
World → Story → Character / Scene / Style / Reference
      → Action / Shot → Storyboard / Rhythm → Prompt Canon
      → optional Provider Projection → Production Plan → Review / Repair
```

路由可以跳过，但依赖不能逆向运行。世界规律不是风格；故事因果不是摄影机导演；身份不是外观或表征；物理光线不是调色；提示词措辞不是 Canon；提供商参数不能改写 Prompt Canon；制作计划不是执行；审查需要实际证据；修复只改变一个拥有该事实的变量，同时保留已通过的维度。

## 合同与兼容性

存在三个彼此不竞争的机器可读权威来源：

- [`contracts.json`](skills/cineweave-director/contracts.json) 定义路由 IDs、路由参考基线、根 kinds 和输出归属。
- [`reference-lifecycle.json`](skills/cineweave-director/reference-lifecycle.json) 定义可分发知识白名单和类型化加载上下文。
- [`resources/contracts/index.json`](skills/cineweave-director/resources/contracts/index.json) 定义 schema/example 清单、领域和原始字节 SHA-256 值。

JSON Schema 定义结构化 wire shape，包括每个产物的 `contractVersion`。`validate-output.mjs` 还会在当前发布版本内强制校验路由归属、依赖和交付物闭合、以证据为边界的审查决策以及非执行声明的语义真实性；`WorkflowPlan` 校验会从同一 Skill 目录解析 `contracts.json`，而不会从另一个 checkout 借用权威，也不会将 Skill 发布版本等同于产物 wire 版本。

`SKILL.md` 是供人使用的激活与路由入口；它不会重新定义这些机器清单。plugin/Skill 分发版本为 `3.0.0`。当未发生破坏性 wire 变更时，各个产物的 `contractVersion` 会维持在兼容的 2.x wire 版本；plugin 版本和产物 wire 版本有意彼此独立。

## 草稿、修订与评估

工作树在不改变合同状态 enums 的前提下，加入了明确的探索、草稿和最终成熟度。发展一个概念的请求授权进行可逆的创意起草；最终授权与外部操作保有各自边界。非规范工作 JSON 可以保留未解决元数据，无需伪造 hashes 或收据。

- [草稿与变更影响](skills/cineweave-director/references/optional/drafts-and-change-impact.md)：提升、选择性失效和重启检查点。
- [视频、声音与交付](skills/cineweave-director/references/optional/video-sound-and-delivery.md)：时序交接、提示、交付变体和迭代限制。
- [已完成的工作流与评估](skills/cineweave-director/references/optional/creative-workflow-evaluation.md)：从角色到修复的三个镜头，以及八个全新任务案例与评分。这些是评估材料，而不是已完成模型/媒体测试的声明。

这些新增内容尚未发布；上方不可变的安装标签仍对应已发布版本。

## 开发

需要 Node.js 22 或更高版本。本仓库是私有、无依赖的开发验证框架，无需安装步骤。CI 调用下列具体入口，而非可变的 package aliases：

```powershell
node --test tests/canonical-json.test.mjs tests/validate-output.test.mjs tests/build-plugin-bundle.test.mjs
node scripts/generate-contract-index.mjs --check
node scripts/validate-repository.mjs
node scripts/build-plugin-bundle.mjs
node scripts/validate-repository.mjs --bundle .build/cineweave-director
```

等价的 `npm` scripts 仍是便捷别名，仓库校验要求它们的命令与这些入口完全一致。

- 测试检查严格 JSON/JCS 和 schema-validation 基元。
- 源代码校验检查 plugin 身份、frontmatter/agent metadata、精确 scripts 和 CI 入口、路由/lifecycle 权威、类型化加载上下文、失败关闭的 schema keywords 与 formats、受限的本地 `$ref` 闭合、语义工作流/审查不变量、原始字节 hashes、收据身份、全部 52 个规范 examples、干净的源代码边界，以及动态推导的分发清单。
- 构建只复制由 lifecycle/index 推导出的白名单，以此创建 `.build/cineweave-director/`。当前工作树清单包含 139 个常规文件；构建器不会硬编码该数量。
- bundle 校验拒绝缺失、变更、链接、大小写冲突、穿越或额外文件，并证明 source/bundle 字节相等。

`RepairPlan` 校验会拒绝矛盾的批准、格式错误的目标指针和重复的检查 IDs。若要进行可选的跨产物检查：

```powershell
node scripts/validate-output.mjs path/to/repair-plan.schema.json path/to/repair.json --artifacts path/to/registry.json
```

所提供的 registry 是一组 `{ "ref": { "kind", "id", "version", "contentHash" }, "document": { ... } }` bindings（仅为记法；应填入真实值）。校验器会检查精确 binding 一致性、JCS UTF-8 SHA-256、源审查 ID/version 和 finding/domain，以及目标 JSON-pointer 是否存在。它绝不获取媒体。registry 身份权威、上游目标关系和视觉保留可能仍为 `unverified`。`valid: true` 表示已实现的检查通过，并不表示制作或所有证据均通过。还应依据各自 schemas 校验源/目标文档。缺失 bindings 保持未验证而非被编造；CLI 会明确返回这些限制。分发 hashes 继续使用原始字节。

只有在有意修改合同后才重新生成合同索引：

```powershell
node scripts/generate-contract-index.mjs
node scripts/generate-contract-index.mjs --check
```

## 仓库结构

```text
.codex-plugin/plugin.json           Codex plugin 元数据
skills/cineweave-director/          完整可分发的 Skill
  SKILL.md                          创作者意图路由与硬边界
  contracts.json                    12 个路由与 52 个根 kinds
  reference-lifecycle.json          类型化的 26 文件知识白名单
  references/                       核心、路由和可选知识
  resources/contracts/              54 个 schemas、52 个 examples 和 hash 索引
scripts/                            无依赖的校验/构建工具
tests/                              校验基元测试
assets/                             仓库品牌资源；不随包分发
```

修改路由、合同、参考资料或提供商方言前，请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)；有关报告方式和信任边界，请参阅 [SECURITY.md](SECURITY.md)。

## 许可证

[MIT](LICENSE) © Wilder1222.
