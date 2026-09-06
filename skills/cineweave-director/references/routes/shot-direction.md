# 路由：shot_direction

用于视觉提案、可复用电影化模式、镜头编译、调度、摄影机、构图、物理镜头光照、时序方向设计、数值预演或主帧锚点。

## 解析戏剧单元

对于叙事镜头，说明一个用途、一次受众注意力变化、一个可读动作和一次稳定终态变化。对于静帧或非叙事研究，使用一个可见的传播目标和稳定的视觉状态。若包含多次空间或因果变化，先使用 `action` 路由。

决策顺序：

`purpose → objective/obstacle/change → attention order → blocking and zones → observable performance → one dominant camera idea → physical shot light → temporal curve → stable end`

先进行调度，再选择镜头。命名位置、视线、支撑、重量、遮挡、路径、前景/中景/背景，以及受众最先、其次、最后注意到的内容。

## 摄影机与构图

指定镜头尺度、摄影机位置和高度、角度、轴线侧、透视意图、适用时的焦距、焦点目标、景深、运动动机、起始/峰值/稳定，以及稳定终态。“电影感”不是摄影机决策。复合运动仅在每个组成部分均有独立且可读的用途时允许使用。

## 镜头光照与时间

最终工作仅使用精确 `SceneLightState` 中的光源；草案工作可以在 Scene 所属范围内提出光源假设。标记直射、反射或透射的使用，并命名反射/透射表面。风格处理不能替代光源逻辑。

将演员表演、摄影机、焦点、场景运动、动态光照和剪辑事件置于独立轨道上。同步它们，但不得改写 Character 所属时序。

## 电影化模式与编译

可复用的 `CinematicSkillManifest` 条目包含故事功能、带类型且范围受限的参数、必需绑定、所有者路由、目标制品和质量检查。它不是提供商预设。

`ShotCompilerPlan` 将一个选定模式、精确绑定和参数值解析为仅投射用途的控制与计划中的路由交接。只能通过精确注册表解析 `@Asset`。绝不生成虚假的输出哈希，也绝不执行该计划。

## 下游制品

先创建 `ShotSpec`，再创建 `ShotLightingPlan`、`TemporalSpec`、可选的 `CameraPrevisSpec` 和 `HeroFrameAnchor`。HeroFrame 记录选定的视觉 DNA 和继承策略；它不创建身份、地理或权利事实。

仅当请求需要时，加载可选的摄影机、肖像或电影化模式参考。

输出：`CinematicSkillManifest`、`ShotCompilerPlan`、`ShotSpec`、`ShotLightingPlan`、`TemporalSpec`、可选的 `CameraPrevisSpec`、`HeroFrameAnchor`。
