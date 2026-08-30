# 多世界资产与生产系统

状态：`draft v0.1`
适用范围：万象织境母品牌及其下属世界
目标：让创意事实、动态状态、视觉表现和生成执行彼此可追踪、可复用、可审计。

## 1. 五层真相模型

生产系统不得把一条提示词当作唯一事实源。每项内容按以下层级流动：

```text
World Canon        世界不轻易改变的事实与规则
      ↓
Entity + State     角色、场景、派系、物件及其当前状态
      ↓
Narrative          目标、阻碍、选择、后果与连续性
      ↓
Representation     媒介、线条、色彩、光感、运动与后期语法
      ↓
Production         配方、控制、证据、能力、权利、执行与验收
```

上层事实优先于下层表现。风格不得改写身份与地理；生成适配器不得改写镜头、故事或 Canon。

## 2. 资产图谱

```text
Universe
 └─ World
     ├─ CanonFact
     ├─ StoryBrief → BeatSheet → ScriptScene
     ├─ CharacterSpec → AppearanceState → CharacterBinding
     ├─ SceneSpec → SceneState → SceneBinding
     ├─ StylePackage → RepresentationBinding → StyleCompile
     ├─ ShotSpec / Storyboard
     ├─ AssetRecipe → ProductionTask
     └─ Candidate → Review → ApprovedAsset → Release
```

依赖必须引用精确的 `kind + id + version + contentHash`。禁止用“最新版角色”“当前风格”之类的隐式引用。

可直接映射到现有 CineWeave 合约：

- [CharacterSpec](../../../packages/cineweave-contracts/schemas/character-spec.schema.json)
- [SceneSpec](../../../packages/cineweave-contracts/schemas/scene-spec.schema.json)
- [StylePackage](../../../packages/cineweave-contracts/schemas/style-package.schema.json)
- [ContinuityLedger](../../../packages/cineweave-contracts/schemas/continuity-ledger.schema.json)
- [AssetRecipe](../../../packages/cineweave-contracts/schemas/asset-recipe.schema.json)
- [ApprovalRecord](../../../packages/cineweave-contracts/schemas/approval-record.schema.json)

## 3. 最小数据对象

项目初期至少维护以下对象：

| 对象 | 关键字段 | 事实所有者 |
| --- | --- | --- |
| `World` | worldId、版本、承诺、状态、负责人 | 母品牌/世界主创 |
| `CanonFact` | entity、factPath、value、有效期、来源、锁级 | Canon Keeper |
| `Character` | 身份锚点、心理发动机、动作指纹、禁止变化 | Character Owner |
| `CharacterState` | 发型、服装、伤势、知识、关系、当前位置 | Character + Story |
| `Scene` | 朝向、区域、路径、尺度、材料、固定道具 | Scene Owner |
| `SceneState` | 时段、天气、人群、损坏、物理光源 | Scene Owner |
| `Style` | 表现媒介、抽象预算、色彩、光感、运动、禁用项 | Style Owner |
| `Event` | 前提、行动者、选择、代价、状态差量、延迟后果 | Story Owner |
| `Asset` | 精确上游引用、状态、用途、文件哈希、权利 | Production Owner |
| `Review` | 期望、观察、PASS/WARN/FAIL、证据、修复责任人 | QA Owner |
| `Release` | 版本、渠道、发布日期、素材、文案、回收数据 | Producer |

## 4. 统一 ID 与版本约定

机器标识采用稳定 ASCII，展示名允许中文。

```text
world.w01.linan
character.w01.shen-heng
scene.w01.hemingxiang-incense-shop
style.w01.neo-song-live-action
event.w01.s01.e01.rain-night-visitor
asset.w01.character.shen-heng.neutral-front
```

版本规则：

- `draft`：可修改的探索方向，不可作为已锁正史宣传。
- `active`：已获批，可用于生产，但后续修改必须新建版本。
- `locked`：关键正史或身份版本，只能通过派生新版本演化。
- 同一个 `id + version` 只允许对应一个内容哈希。
- 任何上游事实变化都要使依赖资产重新检查，审批不自动继承。

## 5. 生产 DAG

```text
1. 立项 Brief 与锁级
2. Story / Character / Scene / Style 独立建模
3. 人工批准精确版本
4. Director 绑定一个可拍时刻或镜头
5. Prompt 只编译当前画面可见且有控制价值的信息
6. Production 选择配方、控制、证据和能力配置
7. 独立生成 Candidate
8. Character / Scene / Style / Rights / Continuity 审核
9. 失败项单变量修复；通过项保持不变
10. 人工批准 ApprovedAsset
11. 发布并写入 Release 记录
12. 反馈进入候选池，不自动改 Canon
```

一个流程可以再次调用同一专业域做审查或修复，但依赖图不得形成环。

## 6. 资产配方目录

首期建议固化下列可复用配方：

| 配方 | 独立任务 | 验证目标 |
| --- | --- | --- |
| 角色方向四选一 | 4 个固定夹具下的候选 | 只比较一个身份轴，不做美貌排名 |
| 中性身份三视图 | 正面、四分之三、侧面 | 结构锚点与自然不对称 |
| 身体转面 | 正、侧、背 | 比例、轮廓、重心、惯用侧 |
| 九宫格表情 | 9 个独立强度/情绪任务 | 跨表情身份稳定性 |
| 动作指纹 | 静立、行走、停步、转身、职业动作 | 姿态、节奏与支配侧 |
| 场景空间组 | 建立、反向、俯视、尺度、材料 | 地理与建筑连续性 |
| 场景状态组 | 日/夜、晴/雨、季节、人群 | 状态变化不改地理 |
| 风格四选一 | 固定角色、场景、动作、镜头和物理光 | 每轮只比较一个风格轴 |
| 跨媒介六联 | 真人、动画、漫画、插画、3D、混合 | 语义身份而非像素相似 |
| 分镜板 | 每格独立镜头任务后确定性拼板 | 故事因果、轴线、道具与状态连续 |

多格资产必须独立生成、确定性拼装，并保存每格来源。只重做失败格，不让模型一次性绘制整张带字网格。

## 7. 控制优先级

冲突时使用以下优先级：

1. 权利、World Canon 与明确禁令。
2. CharacterSpec 与 SceneSpec。
3. AppearanceState 与 SceneState。
4. 角色行为、场景互动与连续性。
5. 镜头目的、构图和物理光使用。
6. 风格与后期偏好。
7. 适配器内部选择。

控制分级：

- `hard`：身份、地理、权利、关键接触和精确连续性；失败即阻断。
- `soft`：表情、姿势、光比、材质响应；允许有限偏差并复核。
- `advisory`：非关键风格偏好；不得覆盖上层事实。

## 8. QA 套件

| QA | 核查内容 | 阻断示例 |
| --- | --- | --- |
| CharacterBench | 跨角度、表情、服装、动作的身份与身体节律 | 换衣后像另一个人 |
| SceneBench | 朝向、路径、入口、尺度、材料、天气和光 | 同一门在反打中换了墙 |
| InteractionBench | 接触、支撑、遮挡、抓握、投影、风雨响应 | 手未接触却托住道具 |
| StoryboardBench | 目标、因果、轴线、视线、道具和状态衔接 | 下一镜无原因改变知识状态 |
| StyleBench | 风格不变量、禁用项、时间语法 | W01 出现通用仙侠磨皮与漂浮建筑 |
| RightsBench | 参考、肖像、模型、依赖、发布与再分发范围 | 必需输入权利未知 |

审核输出必须是分维度的 `PASS / WARN / FAIL`，并指向最小修复责任域；禁止只给一个“好看分”。

## 9. 参考素材与权利

每项参考只承担一个明确角色，例如身份、服装、材料、构图、光线、动作或风格。记录：

- 来源与字节身份；
- 使用范围和排除范围；
- 是否仅用于设计、运行时或验证；
- 肖像同意、版权、训练、商业发布和再分发状态；
- 未知或冲突状态。

公开可见不等于可商用。必需参考、真人肖像或关键依赖的权利未知时，最终生产必须阻断。

## 10. 发布后的资产状态

发布不会自动使画面成为新的世界事实。发布项分为：

- `canonical depiction`：精确表现已批准正史，可作为后续连续性证据。
- `approved variation`：可接受表现变体，但不新增事实。
- `promotional non-canon`：宣传或概念画，不进入故事连续性。
- `experiment`：技术或风格测试，不对外声明为世界事实。

这一分类能防止一张偶然生成的漂亮图改变角色身份、空间布局或世界历史。
