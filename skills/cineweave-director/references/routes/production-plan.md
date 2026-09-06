# 路由：production_plan

用于非执行式资产拆分、看板组装、剪辑节奏、调色意图、控制设计、证据、权利、能力可行性和与提供商无关的渲染规划。

若涉及视频、声音、交付配置或迭代限制，请加载[视频、声音与交付](../optional/video-sound-and-delivery.md)。这些是由既有路由负责的创意规划工作表，而不是新契约或执行界面。

## 资产拆分

说明交付物并锁定共享不变量。每项任务只有一个主要增量和明确的验收标准。复杂表单和故事板使用独立图块/面板；标签、精确文本、边框和网格后续再组装。计划时只重试失败任务，并保留通过的输出。

`AssetRecipe` 描述任务和不变量。`BoardAssemblyPlan` 描述确定性区域和布局。二者均不能证明任务已经运行或看板已经存在。

## 控制与证据

将每项硬要求或对连续性至关重要的要求映射到 `ControlChannelSet`：来源、范围、语义控制类别、保留规则、容差和审查维度。遮罩只能限定变化范围；它不能证明成功。

`EvidenceBundle` 说明审查每项声明所需的证据。`LicenseProfile` 分别保留版权、肖像、转移、发布、再分发、训练和隐私决策。

## 能力规划

`CapabilityProfile` 记录已提供或研究得到的能力声明及其证据状态。`CapabilityResolutionPlan` 将精确配置文件与 hard / soft / advisory 要求进行比较。未知或部分的硬支持不能静默通过。该计划可以为人工审查保留候选项，但不选择提供商、不调用外部工具、不安装任何内容，也不保证输出。

人工选择目标提示词方言后，特定提供商的 `PromptProjectionPlan` 可以绑定一个精确能力配置文件。它记录兼容性证据和人工交接；它不是提供商选择、请求、适配器或回执。

## 渲染、剪辑与调色计划

`RenderPlan` 绑定精确提示词和创意输入、变体、控制、证据、权利以及前置/后置检查标准。它仅表达实现意图。

`EditorialTimelinePlan` 使用有理数帧率、明确范围、间隙和转场。占位符绝不冒充媒体。`ColorPipelineProfile` 将创意调色意图与技术转换以及预览/交付假设分开。

## 边界

这里不应包含 CLI 命令、适配器描述符、请求/回执协议、凭据、网络策略、实际支出核算、输出哈希或生成状态。下一步行动始终是明确的外部人工/工具步骤。

输出：`AssetRecipe`、`BoardAssemblyPlan`、`EditorialTimelinePlan`、`ColorPipelineProfile`、`RenderPlan`、`ControlChannelSet`、`EvidenceBundle`、`CapabilityProfile`、`CapabilityResolutionPlan`、`LicenseProfile`。
