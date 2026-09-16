<a id="artifact-control-and-precedence"></a>
# 创作产物控制与优先级

<a id="keep-layers-separate"></a>
## 保持分层

`创作意图 → 世界／正式设定 → 人物与场景状态 → 表现方式 → 镜头／时间 → 提示词适配 → 制作计划 → 实际观察证据`

下游可以选择或收窄上游事实，但不能悄悄重新定义它。提示词措辞不是正式设定。风格不能改写身份或地理；摄影机不能改写演员表演；评审不能把推断当成实际可见证据。

<a id="exact-references-and-versions"></a>
## 精确引用与版本

调用者给出 `kind`、ID、版本、内容哈希时，必须逐字保留。不要自行解析 `latest`、编造哈希，或凭记忆重建仓库回执。拿不到精确引用时，应明确标注工作引用，或将依赖保留为待解决。

对同一目标进行限定范围修正时，创建子版本；目的、受众、权利基础、世界权威来源或上游硬约束发生重大变化时，应分叉。禁止原地覆盖已经批准的版本。

同一版本内只允许单向依赖。评审可以要求创建新的上游版本，再选择性重编译下游；这是修订循环，不是向不可变父版本插入反向引用。记录影响和恢复检查点时，阅读[草稿与变更影响](../optional/drafts-and-change-impact.md)。典型顺序：

- `WorldBible → StoryBrief → BeatSheet → ScriptScene`；
- `CharacterSpec → CharacterAppearanceState / CharacterBinding / PerformanceTimeline`；
- `SceneSpec → SceneState / SceneLightState / SceneBinding`；
- `ShotSpec → ShotLightingPlan / TemporalSpec / CameraPrevisSpec / HeroFrameAnchor`；
- `Storyboard → SequenceRhythmSpec`；
- 已批准事实 → `PromptRecord` / `ImagePrompt`；
- 精确提示词母稿与能力证据 → 可选 `PromptProjectionPlan` → 人工外部交接；
- 提示词和适配产物 → 非执行型制作计划。

平台适配方案是精确提示词母稿的版本化子产物。供应商参数、参考槽位、个性化／风格代码、界面默认值及兼容性声明只属于 `PromptProjectionPlan`，不能反向写入世界、人物、场景、风格、镜头、`PromptRecord` 或 `ImagePrompt`。

不得把下游引用重新插入已经计算哈希的父产物。

<a id="three-vocabularies-that-must-not-collapse"></a>
## 三套不可混用的词汇

- 创作可变性：`hard / soft / free / undefined`。
- 验收约束：`hard / soft / advisory`。
- 风格强调：`required / strong / supporting`。

它们分别回答“事实能否改变”“失败是否阻止推进”“表现规则应有多明显”。这些值都不是平台数值权重。中文说明不能改写这些机器枚举。

<a id="control-card"></a>
## 控制卡

对容易丢失的要求，编写简短控制卡：

```text
requirement: 可观察的结果
source: 精确产物及字段，或限定范围的用户原话
scope: subject | region | shot | sequence | panel
lock: hard | soft | free | undefined
enforcement: hard | soft | advisory
preserve: 必须保留的已通过事实
allowedDeviation: 明确容差，或未知
reviewDimension: world | story | identity | appearance | geography | action | camera | light | style | prompt | rights
```

<a id="conflict-precedence"></a>
## 冲突优先级

权利与证据有效性首先构成关卡。在证据有效的前提下，依次采用：

1. 明确的硬锁，以及已批准的正式设定／因果；
2. 身份、地理、互动、物理光照事实；
3. 当前外观、场景状态和精确绑定；
4. 走位调度、时间、覆盖与连续性；
5. 表现方式和风格处理；
6. 提示词措辞与工具偏好。

同级冲突必须明确决策。“最新”或“最好看”都不是冲突解决规则。
