# 可选：Midjourney 提示词投影

`verifiedAt: 2026-09-02`

仅当用户明确要求为 Midjourney 准备提示词时加载。本文件定义的是有时间边界的方言投影，不是规范创作事实，也不是执行适配器。

## 边界与权限

使用以下单向链：

`PromptRecord or ImagePrompt Canon → PromptProjectionPlan → human external execution → exact returned metadata/files → Reference/Evidence/Review`

- Canon 负责已批准的可见意图、身份、外观、地理关系、动作、摄影机、物理光照、表征、保持规则和审查标准。
- `PromptProjectionPlan` 负责模型/界面专用的措辞、参考槽位、参数、兼容性检查和手动交接。
- 投影绝不修改 Canon、代表用户选择提供方、调用 Midjourney、上传参考、生成媒体，或声称某项任务存在。
- 只有在用户返回可访问文件以及实际提交/解析后的元数据后，提供方结果才成为证据。计划中的提示词不是已观察媒体。
- 对于语法、模型支持、范围和兼容性，Midjourney 官方文档优先于社区材料。社区项目仅可为信息架构和实验设计提供参考。

当 Midjourney 更改其默认模型、请求的界面不同于已记录的界面、请求的参数未被明确涵盖，或自 `verifiedAt` 起已过 30 天时，请重新验证本参考。未知的兼容性会阻断制作交接；不得将其变成猜测的默认值。

## 稳定的投影方法

### 1. 解析精确来源

按类型、ID、版本和内容哈希绑定一项精确的 `PromptRecord` 或 `ImagePrompt`。绑定用于可行性主张的精确 `CapabilityProfile`。不得投影未版本化的散文提示词，也不得静默推断当前能力。

### 2. 先编写可见结果

Midjourney 的 [Prompt Basics](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics) 建议使用描述期望图像的简短、清晰短语，而不是冗长的指令列表。围绕最显著的可见事实编写简洁的首稿：

1. 主体及决定性状态/动作；
2. 环境和空间关系；
3. 读出节拍所需的构图/视点；
4. 动机光与材质响应；
5. 表征/风格机制；
6. 仅保留防止可能失败所需的约束。

先应用路由级提示词经济性门槛，再进行投影专用的工作轮；这不会添加契约字段：

1. 编写前盘点精确来源中已批准的视觉命题，绝不通过删去硬性 Canon 来缩短；
2. 为每个候选子句分配一项语义职责，且仅当它改变可见结果、保持不变量、消除关系歧义，或防止已命名失败时才纳入；
3. 将同义命题收束为最具体的措辞——`restrained cinematic realism, cinematic lighting, highly detailed` 不会仅因常见而通过；`eye-level 50mm medium full shot`、`low warm rim light` 或 `wet white-jade contact reflection` 等已批准事实则会通过；
4. 将正文与每个参考绑定进行比较：当限定角色的风格参考已经携带柔和调色板、媒介、纹理或处理方式时，删除同义的正文词汇，同时保留硬性内容、身份、动作、摄影机以及精确的光照/材质关系；
5. 只描述期望的最终结果，绝不描述“复制此内容”“使用相同风格”或“修改参考”等操作；这遵循官方 [Image Prompts](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts) 和 [Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) 指引；
6. 对每个子句执行最终删除测试：若删除它不会改变任何已批准的可见命题或失败覆盖范围，就删除它。

不得使用全局形容词黑名单或硬性 token 上限。简短性是命题准入、语义去重、参考重叠移除和删除测试的结果；不得因此抹去 Canon。

### 3. 分离正文、参考与参数尾部

官方 [Parameter List](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List) 要求将参数置于提示词文本之后，在 `--` 前留一个空格，并且参数部分内部不使用标点。

将投影表示为三个可独立审查的部分：

- `promptBody`：仅包含正向的可见结果语言；
- `referenceBindings`：类型化、限定角色的参考放置或占位符；
- `parameterTokens`：有序结构化 token，仅在末尾渲染一次。

绝不隐藏账户/UI 默认值。将所选模型、界面、Raw 状态、Personalization 状态、默认宽高比、默认 stylize/variety 设置以及任何固定图像记录为明确的已核对状态。若无法检查该状态，将其标记为 `unknown`，并要求人工执行者在提交前确认。

### 4. 按角色绑定参考

使用所选模型和界面支持的最窄参考机制：

- `image_prompt`：内容、构图或色彩指导；不是身份凭证；
- `style_reference`：色彩、媒介、纹理、光照处理或视觉语法——不是所描绘的身份/内容；
- `edit_reference`：用于修改或参考引导创作的 V8 Edit Model 源/参考；
- `omni_reference`：仅限 V7 的人物/物体形态指导；
- `personalization_profile`：账户特定的审美偏好；
- `moodboard`：广泛的项目级审美范围。

每项绑定必须保留其来源观察角色和排除项。不得将私有路径、签名 URL、凭据或未经批准的相貌放入投影。当实际上传/URL 位于工件外部时，使用由人工解析的定位符占位符。

### 5. 构建单变量实验

创建一个基线，加上仅为回答已命名问题所需的变体。每个变体声明：

- 一个变更变量；
- 精确保持不变的常量；
- 预期可观察效果；
- 验收检查；
- 是否为短会话比较保持 seed。

不得同时更改措辞、参考、模型、宽高比、stylize、chaos 和 seed。seed 是实验控制项，不是风格或身份书签。官方 [Seeds](https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds) 页面允许从 0 到 4294967295 的整数，警告跨会话可复现性，并说明在 Turbo 模式中 seed 锁定不可靠。

### 6. 交接前验证兼容性

运行明确的 `pass`、`warn`、`block` 或 `unknown` 检查。参数在语法上有效，并不能证明它与所选模型、参考模式、界面、账户状态或另一参数兼容。

## 已验证的 Midjourney 矩阵

官方 [Version](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version) 页面指出，自 2026-07-24 起 V8.2 为默认版本。应将精确选定的模型视为必需元数据，而不是依赖此默认值。

| 功能 | 已验证的支持或范围 | 投影规则 |
| --- | --- | --- |
| V8.2 | 当前默认版本；V8.2 使用 Edit Model 替代 Omni/Character Reference 和 Retexture | 优先明确声明 V8.2 模型；对 V8 参考编辑使用 Edit Model 交接 |
| V8.1/V8.2 Edit Model | 当前参数/版本文档说明可使用书面指令和最多四个参考 | 保持每个参考都具有类型和角色范围；不得将 V7 `--oref` 渲染到 V8 |
| V7 Omni Reference | 仅限 V7；一张图像；`--ow` 为 1–1000，默认 100，通常保持低于 400；与 Fast、Draft、Conversational mode 和 `--q 4` 不兼容 | 在 V8 上阻断 Omni；要求清晰文本、精确 V7 模型和一个 Omni 绑定；参见 [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) |
| Image Prompt | 官方记录的 `--iw` 范围：V8.1/V7 为 0–3，Niji 7 为 0–2，默认 1；纯图像提示词不能使用 stylize 或 weird | 没有新证据时，不得将范围外推到另一模型；将参考裁剪至接近目标宽高比 |
| Style Reference | V6+；`--sw` 为 0–1000，默认 100；V7 的 `--sv 6` 为默认，`--sv 4` 为旧版 | 保持提示词风格词稀少；保存解析后的风格代码；旧代码可能跨模型版本变化 |
| Moodboard | V6+；与 `--sw` 和 `--sv` 不兼容；stylize 为 0–1000，默认 100 | 用于广泛的项目审美，而非单一狭窄风格角色；阻断 `--sw`/`--sv`；参见 [Moodboards](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards) |
| Personalization | V6+；Global V7 profile 可与 V8.2 配合使用；V8 profiles 不适用于 V7；stylize 为 0–1000，默认 100 | 记录提交的 profile ID 和返回的解析代码；绝不依赖未声明的账户默认值；参见 [Personalization](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization) |
| Aspect ratio | 默认 1:1；整数比例语法；当前版本图表列出最大 14:1，HD 为 4:1；极端比例仍属实验性 | 使用 Canon 的交付意图；不得混淆宽高比与像素尺寸；参见 [Aspect Ratio](https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio) |
| Chaos/Variety | `--c`/`--chaos` 为 0–100，默认 0 | 仅用于已命名的多样性实验；较高值可能降低遵循度；参见 [Chaos / Variety](https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety) |
| Stylize | `--s`/`--stylize` 为 0–1000，当前版本默认 100 | 将其视为解释强度，而非语义重要性；独立变化；参见 [Stylize](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize) |
| Weird | `--w`/`--weird` 为 0–3000，默认 0；V5+；与 seed 不完全兼容 | 仅用于明确的探索，且不得声称受控的 seed 比较；参见 [Weird](https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird) |
| Raw | V5.1+；移除/减少自动风格化，使显式提示词处理拥有更多控制 | 用于已命名的保真度/控制假设，而非通用品质标记；参见 [Raw](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw) |
| No | `--no` 接受以逗号分隔的目标；每个词会被独立审核/解释 | 优先采用正向说明；只添加具体、有针对性的排除项，并避免含糊短语；参见 [No](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No) |
| Quality | V7 支持 1、2 和 4；1 为默认；`--q 3` 解析为 4；`--q 4` 与 Omni 冲突 | 不得从 V7 文档推断 V8 品质值；要求模型专属确认；参见 [Quality](https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality) |
| Multi-Prompt `::` | 官方支持止于 V6.1/Niji 6；未列于 V7/V8 | 在 V7/V8 上阻断层分离的 `::` 模板；改用简洁的语义子句；参见 [Multi-Prompts & Weights](https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights) |
| Seed | 0–4294967295；V8.X seed 被描述为 99% 相同，但不保证跨会话行为 | 记录实际返回的 seed；绝不将其作为身份/风格连续性的证据 |
| `--hd`/`--sd` | 当前文档将原生 2048px HD 与 V8.1 关联，而 V8.1/V8.2 对比将 HD 支持归为一组 | 文档存在歧义时，将 V8.2 HD 兼容性视为需要当前界面确认 |

兼容性检查至少必须包括：模型/界面已知、参数顺序有效、参数受模型支持、参考模式受支持、参考数量允许、不存在参考/参数冲突、账户默认状态已检查、权利门控已解决，以及未解决的官方文档歧义已暴露。

## `PromptProjectionPlan` 设计

根契约应携带：

- 精确的工件身份、状态、版本、`skillReceipt` 和来源；
- 精确的 `sourcePromptRef`，仅限 `PromptRecord` 或 `ImagePrompt`；
- 精确的 `capabilityProfileRef`、必需的精确 `licenseProfileRef`，以及可选的精确 `capabilityResolutionPlanRef`；
- `dialectId`、明确的 `modelVersion`、`surface` 和 `verifiedAt`；
- 包含标题、URL、检查日期和有边界主张的官方证据条目；
- `promptBody`、有序的 `parameterTokens`、类型化的 `referenceBindings` 和最终 `renderedPrompt`；
- 基线以及单变量变体和明确保持不变的常量；
- 具有阻断语义的兼容性检查，包括恰好一个 `check.rights-licensing` 检查，该检查绑定到精确 `licenseProfileRef`；
- 包含隐藏默认值检查和人工批准的手动交接；
- 精确的返回清单；
- 证明 `projectionOnly: true`、`mutatesCanon: false`、`generatesMedia: false` 和 `invokesExternalTool: false` 的常量。

提供方代码和定位符仅属于投影。它们不会反向流入 Prompt Canon。在人工报告实际提交后，返回的代码可被记录在证据/审查记录或子投影版本中。

## 手动交接

仅当所有阻断性检查通过时，才返回可直接复制的提示词。同时返回以下说明：

1. 选择已记录的模型和界面；
2. 检查并禁用或记录隐藏默认值；
3. 将每项已批准参考附加到其类型化槽位；
4. 粘贴提示词正文和一个参数尾部，确保没有标点错误；
5. 仅在权利和人工批准门控通过后手动提交；
6. 不得仅根据提交界面报告成功；
7. 返回下方精确的元数据和文件。

### 精确返回清单

要求人工执行者在不进行重建的情况下返回：

- 外部 job/task ID 和创建时间戳；
- Midjourney 显示的界面以及实际模型/版本；
- 精确提交的提示词和最终解析后的提示词；
- 有序的已提交参数和返回/解析后的参数；
- 实际宽高比、尺寸、模式、quality、stylize、chaos、weird、Raw 状态，以及存在时的 seed；
- 已提交的 Personalization/moodboard/style ID 以及 Midjourney 返回的解析代码；
- 每项输入的参考槽位类型、数量和稳定的用户侧资产标识符（不是凭据或会过期的私有 URL）；
- 原始下载输出文件、文件名，以及仅在文件本地可用后计算的哈希；
- 任何警告、审核阻断、不兼容、自动参数重写或失败变体；
- 每个输出由哪个基线/单变量变体生成。

若任何项目不可用，将其标记为 unknown。不得虚构 job ID、代码、seed、哈希、输出路径或成功主张。

## 已采纳与拒绝的社区模式

社区来源是次要来源，且不能确立当前 Midjourney 行为：

- [MidJourney Styles and Keywords Reference](https://github.com/willwulfken/MidJourney-Styles-and-Keywords-Reference) 展示了视觉对比页面、受控参数实验和研究笔记导航。仅采纳实验矩阵模式。该仓库未提供清晰的许可证元数据，因此不得复制其关键词语料或图像。
- [OpenPromptStudio](https://github.com/Moonvy/OpenPromptStudio) 展示了可编辑提示词块、分类、排序、隐藏、翻译和用户管理字典。仅采纳结构化、可逆的投影块。其仓库未提供清晰的许可证元数据，因此不得复制其字典或 UI 内容。
- [Midgard Theory of Layer-Separated Midjourney Prompting](https://github.com/Midgard-Public/Midgard-Theory-Of-Layer-Separated-Midjourney-Prompting) 使用 CC0 许可证，并将提示词假设分离为多个层。采纳单变量/保持常量的实验纪律，但拒绝其适用于旧版本的 V7/V8 `::` 指引。
- [midjourney-cc-skill](https://github.com/JustinPerea/midjourney-cc-skill) 使用关联证据的模式、维度分析、迭代日志和失败模式提取。采纳明确的证据和学习记录；拒绝浏览器自动化、执行主张和冻结于 V7 的参数知识。
- [midjourney-prompt-generator](https://github.com/Amery2010/midjourney-prompt-generator) 使用结构化表单输入、可编辑预览、预设控制和可复制输出。采纳可审查的结构化输入和可直接复制的交接；拒绝嵌入式提供方/API 执行。

内容已为遵守许可证限制而改写。
