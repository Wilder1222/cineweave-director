# 制品控制与优先级

## 保持层次分离

`intent → world/canon → character and scene state → representation → shot/time → prompt projection → production plan → observed evidence`

下游层可以选择或收窄上游事实，但不得静默重定义它。提示词措辞绝不是正典（Canon）。风格不能改写身份或地理事实。摄影机不能改写演员表演。审查不能把推断证据变成可见证据。

## 精确引用与版本

当调用方提供 kind、ID、版本和内容哈希时，必须原样保留。绝不解析 `latest`、伪造哈希，或凭记忆重建仓库回执。精确引用不可用时，使用明确标注的工作引用，或让依赖保持未解析状态。

针对同一目标的有限修正，应创建子版本。当用途、受众、权利依据、世界权威，或上游硬约束发生实质变化时，创建分支。绝不原地覆盖已批准版本。

制品在同一版本内遵循单向依赖。审查可以请求新的上游版本，随后选择性地重新编译下游；这是一条修订循环，而非指回不可变父版本的反向引用。有关影响记录和重启检查点，请加载[草案与变更影响](../optional/drafts-and-change-impact.md)。典型顺序如下：

- `WorldBible → StoryBrief → BeatSheet → ScriptScene`；
- `CharacterSpec → CharacterAppearanceState / CharacterBinding / PerformanceTimeline`；
- `SceneSpec → SceneState / SceneLightState / SceneBinding`；
- `ShotSpec → ShotLightingPlan / TemporalSpec / CameraPrevisSpec / HeroFrameAnchor`；
- `Storyboard → SequenceRhythmSpec`；
- 已批准事实 → `PromptRecord` / `ImagePrompt`；
- 精确的提示词正典（Prompt Canon）+ 精确能力证据 → 可选的 `PromptProjectionPlan` → 人工外部交接；
- 提示词和投射制品 → 非执行式制作计划。

提供商投射是精确提示词正典的版本化子项。提供商标志、参考槽位、配置文件/风格代码、调用界面（surface）默认值和兼容性声明都留在 `PromptProjectionPlan` 中；它们绝不能反向流入世界、角色、场景、风格、镜头、`PromptRecord` 或 `ImagePrompt`。

不得把下游引用插回已哈希的父项。

## 不得混为一谈的三套词汇

- 创作可变性：`hard / soft / free / undefined`；
- 验收执行力度：`hard / soft / advisory`；
- 风格强调程度：`required / strong / supporting`。

它们回答的是不同问题：事实是否可变、更改失败是否阻止推进，以及表征规则应多强烈地呈现。它们都不是提供商的数值权重。

## 控制卡（Control Card）

为任何可能丢失的要求编写简洁的控制卡（Control Card）：

```text
requirement: observable result
source: exact artifact and field, or bounded user statement
scope: subject | region | shot | sequence | panel
lock: hard | soft | free | undefined
enforcement: hard | soft | advisory
preserve: passing facts that must survive
allowedDeviation: explicit tolerance or unknown
reviewDimension: world | story | identity | appearance | geography | action | camera | light | style | prompt | rights
```

## 冲突优先级

权利和证据有效性是准入门槛。在有效证据范围内，依次采用：

1. 明确的硬锁定以及已批准的正典/因果关系；
2. 身份、地理、交互和物理光照事实；
3. 当前外观、场景状态和精确绑定；
4. 调度、时间、覆盖与连续性；
5. 表征与风格处理；
6. 提示词措辞和工具偏好。

同一层级的冲突需要明确决策；“最新”和“最漂亮”不是解决策略。
