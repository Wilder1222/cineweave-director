# AIGC 生产流程与开源项目复核：2026-08-30

**受众：** CineWeave Studio 的产品、工作流与适配器设计者。
**范围：** 从创意发散、参考收敛、资产/镜头生产到可复现执行；重点复核
Midjourney、ComfyUI、InvokeAI、StoryDiffusion、Wan2.1 和面向短剧生产的
开源项目。本文不比较模型“最好”，也不把仓库 README 当作本地能力证明。

## 结论先行

1. AIGC 生产应把“创意状态”“视觉事实”“可执行模板”“执行结果”分开保存。
   提示词、参考图、节点图和输出文件不是同一类资产。
2. Midjourney 适合作为人工主导的发散面；它的模型版本、参考角色和审美 profile
   有明确、会变化的兼容边界。当前默认 V8.2，但 Omni Reference 仍是 V7 能力，
   不能在同一可比较包中混写为 V8.2 的 Omni 变体。创作者 Personalization、项目
   Moodboard、镜头级参考与当前 prompt 应是四个不同层次。
3. 可复现的本地/云端工作流必须锁定模板或图的身份、版本、内容哈希、依赖、
   输入槽位和运行结果。Adapter 与 Capability 只能说明“能做什么”，不能说明
   “这次实际运行了哪张图”。
4. 长序列一致性、图生视频、首尾帧、蒙版编辑、角色锚点和剪辑时间线都是不同
   的控制问题；不能压缩成一个万能 prompt 或一个“母版图”。

## 证据与可复用模式

| 来源 | 可验证事实 | 对 CineWeave 的设计含义 | 证据强度 |
| --- | --- | --- | --- |
| [Midjourney Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version) | 2026-08-30 检索时，V8.2 是默认版本；不同版本会改变提示词解释和兼容性。 | `--v` 是审计字段，执行前必须重新核对，不能当成永久默认值。 | 一手官方文档 |
| [Midjourney Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) | Omni Reference 仅可用于 V7，且只能用一张参考图；文字提示仍承担场景和额外细节。 | `omni_reference` 必须和 V7 版本策略一起校验；身份锚点不自动迁移场景、服装或动作。 | 一手官方文档 |
| [Midjourney Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards)、[Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization) 与 [Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize) | 两类 profile 均通过 `--p` 使用，ID 会解析为可回溯 code；`--s` 为 0–1000、默认 100。Moodboard 是 curated images，Personalization 反映选择历史。 | 将 creator baseline 与 project Moodboard 记录为独立 Aesthetic Profile，并在 pack 中保存显式 `--p` code，不依赖账户默认值。 | 一手官方文档 |
| [Midjourney Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) | Moodboard 不能和 `--sw` 或 `--sv` 同用；Style Reference 仍是更局部的视觉 vibe 控制。 | 当 pack 绑定 Moodboard 时结构校验拒绝 `--sw`/`--sv`，但仍把 style/image/Omni 的语义边界单独保留。 | 一手官方文档 |
| [ComfyUI Workflow JSON](https://docs.comfy.org/specs/workflow_json) 与 [Cloud API](https://docs.comfy.org/api-reference/cloud/overview) | 工作流有明确 JSON schema/版本；API 把 workflow、job、asset、node、model 分为不同资源。 | 把工作流模板从创作 Canon 中隔离，但在 Production 中显式锁定模板身份、哈希、输入绑定和输出类型。 | 一手官方文档 |
| [ComfyUI workflow templates](https://docs.comfy.org/custom-nodes/workflow_templates) | 模板是可发现的 JSON 资产，支持可复用工作流和子图蓝图。 | 对可配置图，复用“模板/蓝图 + 绑定”，而非把节点细节复制进每一条创意提示词。 | 一手官方文档 |
| [InvokeAI](https://github.com/invoke-ai/InvokeAI) | 节点工作流、画布、Board/Gallery 和图像元数据共同服务创作、回溯和 remix。 | 把候选输出与其 prompt/设置/选择状态作为可回溯资产，保持人审 gate。 | 一手项目 README |
| [StoryDiffusion](https://github.com/HVision-NKU/StoryDiffusion) | 其官方实现把长序列角色一致性和条件图驱动的视频阶段拆开；文档要求多条提示词作为一致性输入。 | 跨镜头一致性应由 Character/Reference/Shot 状态和条件图链路承担，不应承诺单条 prompt 解决。 | 官方实现与论文链接 |
| [Wan2.1](https://github.com/Wan-Video/Wan2.1) | T2V、I2V、首尾帧与 VACE 是不同任务表面，输入可能包含文本、图像、视频和蒙版。 | Capability/Profile 必须按操作、输入角色、尺寸、时长、模型/依赖分别声明，不能以“支持视频”概括。 | 官方实现 |
| [Comic-drama](https://github.com/tccnnd/Comic-drama) | 早期 local-first 原型把脚本、角色资产、对白音频、分镜 review、provider routing 和 OTIO-inspired 时间线拆开。 | 借鉴“稳定生产中间层”，但不采纳其作为生产可靠性或供应商能力证明；音频/剪辑时间线是后续独立增量。 | 社区原型，限架构启发 |

## 当前包的缺口矩阵

| 流程维度 | 当前证据 | 缺口 / 风险 | 本次决定 |
| --- | --- | --- | --- |
| 创意→MJ 发散 | `MidjourneyPromptPack`、人工选择、`MidjourneyExplorationCase` | 现有示例把 V8.2 和 V7-only Omni Reference 混用。 | 新增模型—参考角色兼容性声明和结构校验；示例改为明确 V7 Omni 包。 |
| 创作者审美→项目视觉系统 | 仅有 `moodboard` reference role，容易和局部 Style Reference 或账户默认混为一层。 | 不能精确回放 `--p` code，也容易让 Moodboard 越权定义人物/场景事实。 | 新增 Prompt-owned `MidjourneyAestheticProfile`；分离 creator Personalization、project Moodboard、shot reference 与 current prompt，并校验 `--p`、`--sw`/`--sv` 边界。 |
| 结果图→视觉圣经 | `ReferenceAsset`、Observation、Review、Binding、Character/Scene/Style locks | 已有清晰边界。 | 保持现状；历史案例只能通过 scoped reuse policy 复用。 |
| 生产模板→执行 | `CapabilityProfile`、`AdapterDescriptor`、`ExecutionRequest`、`ExecutionReceipt` | 不能表达“此请求绑定哪一个可序列化模板/图、哪个版本及槽位映射”。 | 新增 Production-owned `WorkflowTemplateProfile` 与可选的 `ExecutionRequest.workflowTemplateBinding`。 |
| 长序列 / 视频控制 | `ActionSequenceSpec`、Shot/Temporal、ControlBench、CapabilityProfile | 不同 T2V/I2V/FLF2V/mask 能力容易被笼统声称。 | 在模板 profile 中声明操作、输入槽位、依赖与已知限制；不宣称安装或性能。 |
| 音频、剪辑和导出 | Script/Storyboard 有 dialogue/sound intent，Production 尚无 editorial timeline。 | 若贸然把 TTS/混音/时间线并入当前合同，会跨越尚未验证的能力边界。 | 明确列为后续增量；当前只保留语义 intent，不生成技术音频承诺。 |

## 落地原则

### 1. 模板是 Production 资产，不是创意事实

`WorkflowTemplateProfile` 只记录可序列化模板的标识、格式、内容哈希、原生
schema 版本、依赖锁、输入/输出槽位、能力要求、已知限制和许可证引用。它不保存
端点、密钥、用户本地路径或供应商上传 URL。具体 `ExecutionRequest` 可以带一个
精确 profile ref 与槽位→artifact 映射；`ExecutionReceipt` 已经绑定该不可变请求。

对于 provider-managed、无法导出图的表面，应显式标为不可序列化并要求执行前重核
版本/能力，而不能伪造哈希或图定义。

### 2. 参考角色与版本必须一起验证

把“模型版本”单独保存在参数栏不够。只要使用 `omni_reference`，同一 pack 必须
锁定 V7；若优先使用 V8.2，则把身份探索改为不依赖 Omni 的独立假设，或另开 V7
比较包。任何来自旧包的版本/参数都要在实际执行前按官方文档重新核对。

### 3. 审美 profile 是上下文，不是 Canon

`MidjourneyAestheticProfile` 区分两个跨 prompt 层：由选择历史形成的 creator
Personalization，和由精确摄取的图片策展形成的 project Moodboard。二者都通过显式
`--p` ID/code 注入；每次执行后记录系统解析出的 code。它们只定义允许保留的视觉
语法，不能自动定义人物身份、场景地理、单镜构图或最终 Visual Bible。

Moodboard 的影响通过 `--s` 比较，且由于官方声明的兼容限制，任何 Moodboard pack
都不使用 `--sw` 或 `--sv`。V7 Omni 与 Moodboard 可以共同存在，但仍必须服从 V7
版本锁；profile 的模型兼容性也必须逐次重核。

### 4. 保持可暂停、可恢复、可审计

推荐的生产路径仍是：

```text
创意意图 → MJ 或其他探索 → 用户选择 → 精确媒体摄取
→ 角色 / 场景 / 风格 / 表现绑定 → 剧本与镜头 → 分镜
→ 模板 profile + 执行请求 → 执行回执 → Draft 媒体摄取与评审 → 一变量修复
```

每个箭头都应能回答：输入是什么、谁拥有事实、哪个版本、是否经过人审、以及失败
时哪些已经通过的资产不能被重写。

## 限制与维护

- GitHub 项目用于观察架构和实现边界，而非排名、性能比较或安全/版权保证。
- Midjourney、ComfyUI API、模型权重、节点和许可证会变动；所有版本兼容结论均需
  在外部执行前重新核对。
- 本次不接入任何外部 provider，也不创建实际 ComfyUI/InvokeAI 图；新增合同只让
  未来接入能够被明确记录和审计。

**停止条件：** 官方资料和项目源码已经同时支持“版本兼容性”“审美 profile 分层”
和“模板溯源”三个决定；继续增加同类项目不会改变这些设计结论。
