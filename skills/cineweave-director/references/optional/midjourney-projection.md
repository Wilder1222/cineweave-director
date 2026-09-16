# 可选参考：Midjourney 提示词适配

`verifiedAt: 2026-09-02`

仅在用户明确要求为 Midjourney 准备提示词时加载。本文件是有时效的方言适配，不是规范创作事实，也不是执行适配器。中文化不代表重新核验以下平台能力；保留原核验日期，使用前按下列触发条件复核。

## 边界与权威

单向链：

`PromptRecord 或 ImagePrompt 母稿 → PromptProjectionPlan → 人工外部执行 → 准确返回元数据／文件 → 参考／证据／评审`

正式设定负责可见意图、身份、外观、地理、动作、摄影机、物理光照、表现方式、保留规则和评审标准；`PromptProjectionPlan` 负责模型／界面措辞、参考槽位、参数、兼容检查和人工交接。

适配不修改正式设定，不替用户选供应商，不调用 Midjourney、不上传参考、不生成媒体，也不宣称任务存在。结果成为执行核验证据需返回可访问文件和实际提交／解析元数据；计划提示词不是已观察媒体。官方文档在语法、模型支持、范围和兼容性上优先于社区材料；社区只启发信息结构和实验设计。

默认模型变化、请求界面不同、参数未明确覆盖，或距 `verifiedAt` 超过 30 天时重新核验。未知兼容性阻断依赖它的制作交接，不能用猜测默认补齐。

## 稳定适配方法

### 1. 解析精确源

普通请求以完整中文母稿为输入，输出可复制适配稿及当前核验的必要参数，不要求先建 JSON。仅在规范交接时按类型、ID、版本、内容哈希绑定一个精确 `PromptRecord` 或 `ImagePrompt`，并绑定用于可行性声明的精确 `CapabilityProfile`。不把无版本散文提示词当成规范母稿，也不暗推当前能力。

### 2. 先写可见结果

[官方提示词基础](https://docs.midjourney.com/hc/en-us/articles/32023408776205-Prompt-Basics)建议简洁清楚地描述目标图，而非长指令清单。第一稿围绕主要主体及关键状态／动作、环境与空间关系、读懂节拍所需构图／视点、有动机光照与材质响应、表现／风格机制，以及必要失败预防。

先使用路由的精简关卡，再做适配工作稿，不增加契约字段：

1. 起草前列出源中的已批准可见命题，不能靠丢硬设定缩短。
2. 每句只有一个语义任务：改变可见结果、保留不变量、澄清关系或预防已命名失败。
3. 同义命题收敛为具体表达。“克制电影写实、电影灯光、高细节”不因常见就合格；“眼平50mm中远景”“低位暖轮廓光”“湿白玉接触反射”等已批准事实可以保留。
4. 与每个参考绑定比较，删除已由角色限定风格参考提供的软色板／媒介／纹理同义词，保留硬内容、身份、动作、摄影机和精确光／材质关系。
5. 描述最终结果，不描述“复制这张”“用相同风格”“修改参考”等操作，参见[图像提示](https://docs.midjourney.com/hc/en-us/articles/32040250122381-Image-Prompts)和[风格参考](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)。
6. 逐句删除测试；不改变已批准可见命题或失败覆盖的句子就删。

不设全局形容词黑名单或硬 token 上限。简短来自准入、语义去重、参考去重和删除测试，不能抹除正式设定。母稿默认中文，用户需要英文时单独提供英文适配，不修改内容决定。

### 3. 分开正文、参考和参数尾

[官方参数列表](https://docs.midjourney.com/hc/en-us/articles/32859204029709-Parameter-List)要求参数位于正文后，`--` 前有空格，参数区域不插入无关标点。

三个可独立评审部分：`promptBody` 为正向可见结果；`referenceBindings` 为有类型、角色限定的参考位置／占位；`parameterTokens` 为有序结构化参数，末尾只渲染一次。

不能隐藏账号／界面默认。记录模型、界面、Raw、个性化状态、默认画幅、默认 stylize／variety 和固定参考图。不能检查则标 `unknown`，要求执行者提交前确认。

### 4. 按角色绑定参考

使用模型和界面支持的最窄机制：`image_prompt` 提供内容／构图／色彩参考，不证明身份；`style_reference` 提供色彩／媒介／纹理／灯光处理／视觉语法，不迁移身份内容；`edit_reference` 是 V8 Edit Model 修改或参考创作来源；`omni_reference` 是 V7 人／物形态参考；`personalization_profile` 是账号审美偏好；`moodboard` 是宽泛项目审美范围。以上是原核验快照，不能跨版本外推。

每个绑定保留源观察角色和排除项。私有路径、签名链接、凭据或未批准肖像不进入适配。真实上传／URL 在产物外时使用人工解析定位占位。

### 5. 单变量实验

创建基线及回答命名问题所需的变体。每个变体声明一个变化变量、精确固定项、预期可见效果、验收检查，以及是否在短会话内固定 seed。

不同时改文字、参考、模型、画幅、stylize、chaos、seed。seed 是实验控制，不是风格／身份书签。[Seeds 文档](https://docs.midjourney.com/hc/en-us/articles/32604356340877-Seeds)在原快照中给出 0–4294967295，提醒跨会话复现不保证，Turbo 中锁种子不可靠。

### 6. 交接前检查兼容

明确记录 `pass`、`warn`、`block` 或 `unknown`。语法有效不证明与模型、参考模式、界面、账号状态或其他参数兼容。

## 原核验快照中的 Midjourney 能力表

2026-09-14 仅复查了下方版本页：V8.2 默认版本及 V8.1／V8.2 不支持 Quality 参数、Omni Reference 和多提示词的比较表已核对。其他专页仍保留原日期，不能据此宣称整张表重新核验。

[版本页](https://docs.midjourney.com/hc/en-us/articles/32199405667853-Version)在原研究中将 V8.2 标为自 2026-07-24 起的默认。仍必须显式记录实际模型，不能依赖默认。

| 功能 | 原快照记录的支持／范围 | 适配规则 |
| --- | --- | --- |
| V8.2 | 默认模型；Edit Model 替代 Omni／Character Reference 和 Retexture | 显式写模型；V8 参考编辑走 Edit Model 交接 |
| V8.1／V8.2 Edit Model | 文字指令与最多四参考 | 每份参考分类型和角色，不能把 V7 `--oref` 写进 V8 |
| V7 全能参考 | 仅 V7、单图；`--ow` 1–1000，默认100，通常低于400；与快速、草稿、对话模式及`--q 4` 不兼容 | V8 阻断全能参考；V7 明确模型与单绑定；[官方说明](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) |
| Image Prompt | `--iw`：V8.1／V7为0–3，Niji7为0–2，默认1；纯图提示不能 stylize／weird | 不外推其他模型范围；参考裁切接近目标画幅 |
| Style Reference | V6+；`--sw` 0–1000，默认100；V7 `--sv 6` 默认、`--sv 4` 旧版 | 风格词精简，保存解析后风格码；旧码跨版本可能变化 |
| Moodboard | V6+；不兼容 `--sw`、`--sv`；风格化参数 0–1000，默认100 | 用于宽泛审美，不当成单一窄角色；[官方说明](https://docs.midjourney.com/hc/en-us/articles/39193335040013-Moodboards) |
| 个性化 | V6+；全局 V7可用于V8.2，V8档案不能用于V7；风格化参数 0–1000，默认100 | 记录提交ID与返回码，不依赖隐含账号默认；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32433330574221-Personalization) |
| 画幅 | 默认1:1，整数比例；原表最大14:1，HD最大4:1；极端比例实验性 | 来自母稿交付意图，不混同像素；[官方说明](https://docs.midjourney.com/hc/en-us/articles/31894244298125-Aspect-Ratio) |
| Chaos／Variety | `--c`／`--chaos` 0–100，默认0 | 只用于命名多样性实验，高值可能降低遵循度；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32099348346765-Chaos-Variety) |
| Stylize | `--s`／`--stylize` 0–1000，默认100 | 解释强度不是语义重要性；独立变化；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32196176868109-Stylize) |
| Weird | `--w`／`--weird` 0–3000，默认0；V5+；与seed不完全兼容 | 只用于明确探索，不宣称受控种子比较；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32390120435085-Weird) |
| Raw | V5.1+；减少自动风格化 | 用于保真／控制假设，不作万能质量开关；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32634113811853-Raw) |
| No | `--no` 可用逗号分项；各词独立审核／解释 | 正向描述优先，仅添加具体排除；用户不用负向时不擅加；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32173351982093-No) |
| Quality | V7为1、2、4，默认1；`--q 3`解析为4；4与Omni冲突 | 2026-09-14 版本比较表明确 V8.1／V8.2 不支持 Quality 参数；V7 数值沿用原记录，使用前按目标版本复查；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32176522101773-Quality) |
| `::` 多提示词 | 原官方表止于V6.1／Niji6，未列V7／V8 | V7／V8阻断分层 `::` 模板，改用简洁语义；[官方说明](https://docs.midjourney.com/hc/en-us/articles/32658968492557-Multi-Prompts-Weights) |
| Seed | 0–4294967295；V8.X描述为99%一致，但跨会话不保证 | 记录真实返回seed，不用它证明身份／风格连续 |
| `--hd`／`--sd` | 原生2048px HD描述关联V8.1，而比较表合并V8.1／V8.2 | 文档含混时，V8.2 HD需当前界面确认 |

至少检查：模型／界面已知、参数顺序、模型支持、参考模式、参考数量、参考／参数冲突、账号默认、权利，以及官方文档歧义。

## PromptProjectionPlan 设计

根契约包含：精确产物身份／状态／版本／`skillReceipt`／来源；限定到 `PromptRecord` 或 `ImagePrompt` 的 `sourcePromptRef`；精确 `capabilityProfileRef`、必需 `licenseProfileRef`、可选 `capabilityResolutionPlanRef`；`dialectId`、显式 `modelVersion`、`surface`、`verifiedAt`；含标题／URL／检查日期／限定声明的官方证据；`promptBody`、有序 `parameterTokens`、类型化 `referenceBindings`、最终 `renderedPrompt`；基线与单变量变体／固定项；有阻断语义的兼容检查，其中恰有一个绑定精确许可档案的 `check.rights-licensing`；包含默认检查与人工批准的手动交接；准确返回清单；常量 `projectionOnly` 为 `true`，`mutatesCanon`、`generatesMedia`、`invokesExternalTool` 均为 `false`。

平台代码与定位地址仅属于适配，不反向流入母稿。人工报告真实提交后，返回码可以进入证据／评审或适配子版本。

## 人工交接

所有阻断检查通过才给可直接提交提示词。交接说明：选择所记录模型／界面；检查并关闭或记录隐藏默认；将获批参考放入对应槽位；粘贴正文和唯一参数尾；权利和人工关卡通过后手动提交；不从提交界面报告成功；返回下列准确文件和元数据。

### 准确返回清单

不经重建地返回：外部任务ID／创建时间；界面和实际模型版本；准确提交与最终解析提示词；有序提交参数及返回参数；实际画幅、尺寸、模式、质量、风格化、变化程度、怪异程度、原始模式及可用的随机种子；提交的个性化／情绪板／风格ID及解析码；输入参考槽位类型、数量、稳定用户侧资产ID，不含凭据或短期私链；原始下载文件、文件名，文件本地可用后才算哈希；警告、审核阻断、不兼容、自动改参、失败变体；每份输出对应哪个基线／单变量变体。

缺项标未知，不造任务ID、代码、seed、哈希、路径或成功声明。

## 社区方法的采纳与拒绝

社区是次级来源，不能证明当前平台行为：

- [MidJourney Styles and Keywords Reference](https://github.com/willwulfken/MidJourney-Styles-and-Keywords-Reference)：借鉴视觉比较、受控参数实验和研究导航，不复制缺少明确许可元数据的词库或图片。
- [OpenPromptStudio](https://github.com/Moonvy/OpenPromptStudio)：借鉴可编辑、可逆提示词块、分类、排序、隐藏、翻译和词典管理结构，不复制缺少明确许可的词典／界面。
- [Midgard 分层理论](https://github.com/Midgard-Public/Midgard-Theory-Of-Layer-Separated-Midjourney-Prompting)：原研究记录CC0；借鉴单变量／固定项纪律，拒绝把旧版 `::` 用于V7／V8。
- [midjourney-cc-skill](https://github.com/JustinPerea/midjourney-cc-skill)：借鉴证据关联、维度分析、迭代与失败记录，拒绝浏览器执行、已执行声明和冻结在V7的参数知识。
- [midjourney-prompt-generator](https://github.com/Amery2010/midjourney-prompt-generator)：借鉴结构输入、可编辑预览、可复制输出，拒绝嵌入供应商／API执行。

内容采用重新表述，遵守原项目对许可和再分发的边界。
