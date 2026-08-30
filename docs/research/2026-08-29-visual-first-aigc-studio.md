# 视觉先行的 AIGC 全流程研究与设计决策

日期：2026-08-29
目标：把“我先说想法 → 生成 Midjourney 提示词 → 用户在 MJ 中探索并选择母版参考图 → 基于统一视觉继续做资产、剧本、分镜和生产”的路径，落成可暂停、可恢复、可审计的 CineWeave Studio 工作流。

## 研究方法

本轮优先检查官方文档、论文和项目源码/README，再用社区项目验证工作流模式。项目型资料用于提炼架构，不把任何模型、节点或供应商行为当作质量保证。研究范围覆盖 Midjourney 的提示词与参考图语义、ComfyUI/InvokeAI 的可复用工作流、身份/空间/风格控制、分镜和脚本流水线，以及当前仓库已有的九个 specialist Skill 边界。

## 关键结论

### 1. MJ 适合做“发散入口”，不适合成为全流程状态库

Midjourney 官方将 Image Prompt、Style Reference、Omni Reference 和 Moodboard 描述成不同的输入语义：前者偏内容/构图灵感，Style Reference 偏视觉氛围，Omni Reference 是 V7 表面的主体参考，Moodboard 是更宽泛的策展式风格方向。它们可以组合，但不应被扁平化成“万能参考图”。官方 [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics)、[Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts)、[Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)、[Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) 和 [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards) 都支持这个分层判断。

因此首轮输出应该是 3–8 个变体，每个变体只有一个探索假设；用户在 MJ 中运行、比较和选择，CineWeave 只保存 `MidjourneyPromptPack` 投影与人工选择门，不宣称已执行或已选中母版。

版本必须显式保存并在执行前重新核对。研究当天官方 [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version) 页面列出 V8.2 为当前默认版本；这是时间敏感信息，不能写成永久常量。官方 [Video](https://docs.midjourney.com/hc/en-us/articles/37460773864589-Video) 还明确了视频生成与 Image/Style/Omni Reference 的兼容边界，所以静态母版进入视频阶段时，应变成经 Reference 摄取的 starting frame 或其他明确输入，而不是继续依赖原始 MJ prompt。

### 2. “母版参考图”必须先变成证据，再变成视觉圣经

选中图像只是用户偏好结果，不是 Canon。回传时至少需要原始文件、原始 prompt、模型/版本/参数、选择理由、用途范围和权利/肖像许可状态。`$cineweave-reference` 先绑定精确字节，再按 identity、appearance、style、scene、composition、lighting、capture 等角色生成原子观察、适用性 Review 和 `ReferenceBindingSet`。

这一步解决最常见的污染问题：同一张图可以同时看起来“像人物、像服装、像色彩和像构图”，但下游必须知道每一项是否真的被批准迁移。若用户只带回截图或一句“按这张来”，状态应保持未绑定，而不是补写虚假的视觉事实。

### 3. 开源项目共同指向“脚本/资产/镜头/生产”的显式中间层

- [`ai-video-pipeline`](https://github.com/0xadvait/ai-video-pipeline) 把故事想法拆成 panel prompt、character bible、scene panel、clip，并把 prompt 放进源码、把 API 调用写入 manifest，再用 character reference 和 keyframe bridge 贯穿流程。可复用结论是“先出可检查的静帧和清单，再进入视频”。
- [`Comic-drama`](https://github.com/tccnnd/Comic-drama) 把脚本解析成 scenes、characters、dialogue、beats、props 和 visual cues，再接 keyframe、TTS 和 timeline；它说明故事结构不能藏在图像 prompt 中。
- [`Storyboarder`](https://github.com/wonderunit/storyboarder) 强调快速画、排列、回放、修改，并保存 shot type、timing 和参考层；分镜应服务于验证故事和镜头覆盖，而不是只做一张漂亮网格。
- [`ComfyUI`](https://github.com/Comfy-Org/ComfyUI) 把节点图、子图、模板、局部重算和 API 任务显式化；官方文档的 [workflow settings](https://docs.comfy.org/interface/settings/comfy) 和 [App Mode](https://docs.comfy.org/interface/app-mode) 进一步强调可验证、可保存和简化输入输出。CineWeave 借鉴的是“可序列化的 adapter capability”，不是把节点名写进创作 Canon。
- [`InvokeAI`](https://github.com/invoke-ai/InvokeAI) 的 Unified Canvas/Workflow 体验把输出放入 staging area，由用户 review/accept；这与本项目的人工 gate 和“候选不等于批准”一致。
- [`ControlNet`](https://github.com/lllyasviel/ControlNet) 与 [`IP-Adapter`](https://github.com/tencent-ailab/IP-Adapter) 说明空间控制和图像条件应是独立 control channels；[`InstantID`](https://github.com/instantX-research/InstantID) 的 face-only 边界、[`InstantStyle`](https://github.com/InstantStyle) 的内容/风格分离，以及 [`StoryDiffusion`](https://github.com/HVision-NKU/StoryDiffusion) 的跨序列一致性研究，都支持“身份、风格、空间和时间不能由一个 prompt 变量承担”的原则。

## 落成的工作流

```text
创意想法
  ↓
CreativeBrief + lock matrix + WorkflowPlan(studio)
  ↓
Prompt.midjourney_compile → MidjourneyPromptPack
  ↓ 人工在 MJ 探索
selected files + prompts + version/parameters + notes + usage status
  ↓
Reference ingest → observations → review → ReferenceBindingSet
  ↓ 人工批准视觉圣经
CharacterSpec + AppearanceState
SceneSpec + SceneLightState
StylePackage/StyleCompile + RepresentationBinding
  ↓
StoryBrief → BeatSheet → ScriptScene → ContinuityLedger
  ↓
ActionSequenceSpec → ShotSpec/Lighting/Temporal → Storyboard
  ↓
PromptRecord/ImagePrompt → AssetRecipe/BoardAssemblyPlan
  ↓
Capability/Rights/Evidence → human execution → MediaImport → ControlBench
```

其中 `studio` 是根 `$cineweave` 的编排入口，不会抢走 specialist 的 ownership：

| 阶段 | 固定什么 | 允许变化什么 | 通过条件 |
| --- | --- | --- | --- |
| MJ 发散 | 主体目标、画幅、叙事 cue | 一个探索轴/变体 | 用户选出候选并返回元数据 |
| 参考收敛 | 每个 reference 的角色和范围 | 新的观察、排除项和版本 | 精确字节、Review、权限状态存在 |
| 视觉圣经 | 身份、当前造型、场景、物理光、表现媒介 | 由 owner 声明的外观/镜头变化 | 各自的 exact ref 被批准 |
| 资产生产 | 视觉圣经引用、任务区域、验收维度 | 独立 recipe 的种子/参数/失败重试 | 通过能力、权利和控制检查 |
| 分镜/成片 | Story/Character/Scene/Style/Director 事实 | shot 级构图和时间决策 | coverage、MediaImport 和人工 review 完成 |

## 最佳实践清单

1. 首轮只问会改变路线的选择：输出媒介、第一探索轴、是否要跨镜头身份一致、母版用途和权利边界。
2. 先给 3 个可比较方向，再问偏好；不要先要求用户掌握脸部、镜头或模型参数术语。
3. 一轮只改一个高影响变量；不同画幅、不同模型版本或不同参考角色不要混在同一比较结论里。
4. 参考图回传后，先做 exact ingest 和 role-scoped observation，再写 Character/Scene/Style 的事实。
5. 把 identity、appearance、style、scene/light、shot/time 做成可复用锁；“保持一致”指后续任务引用这些锁，而不是重复一段长 prompt。
6. 分镜按 beat-to-panel coverage ledger 拆成独立任务；失败格单独重做，并用确定性外部组装保存 provenance。
7. ComfyUI、ControlNet、IP-Adapter、服装/妆容迁移、运动模块等只进入 Production 的 capability/evidence 层；未知能力保持 blocked/unknown。
8. 每次修复只改一个 owner 的一个变量，保留已经通过的维度和原始 receipt。
9. 对生成图、视频、分镜、工作流和 prompt 分别标注“设计资产”“用户选择”“已执行输出”和“已复核输出”，不混用状态。

## 本次代码落点

- 根 `$cineweave` 增加 `aigc_studio` 路由和 `studio` mode，成为视觉先行的 all-in-one 编排入口。
- `$cineweave-prompt` 增加 `midjourney_compile` 路由、`MidjourneyPromptPack` schema/example 和参考角色投影规范。
- 新增 [AIGC Studio Path](../../skills/cineweave/references/aigc-studio.md) 与 [Midjourney Projection](../../skills/cineweave-prompt/references/midjourney-projection.md)。
- 新增 [端到端 workflow example](../../packages/cineweave-contracts/examples/workflow-plan-aigc-studio.json)、激活/行为/组合测试覆盖，并扩展 `CreativeBrief`/`WorkflowPlan` 的 `studio` 模式。

## 限制

本设计不会替用户调用 Midjourney，也不会在本地自动判断审美“最好”、版权已确认或跨镜头一致性已达标。MJ、ComfyUI、InvokeAI 和各开源控制项目的版本、模型权重、许可证、节点依赖、输入限制和实际效果会变化；升级前必须重新查官方文档和本地 capability receipt。当前仓库实现的是可复核的编排、合同和验证边界，不是已经安装的全套模型运行时。
