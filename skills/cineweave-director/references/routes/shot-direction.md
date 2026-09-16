<a id="route-shot_direction"></a>
# 路由：镜头导演（shot_direction）

提示词的适用维度与完整性标准见[细节与专业表达](../optional/prompt-detail-standard.md#镜头与分镜)对应章节。

用于视觉提案、可复用电影模式、镜头编译、人物调度、摄影机、构图、镜头物理光照、时间设计、数值预演或主视觉关键帧锚点。

<a id="resolve-the-dramatic-unit"></a>
## 明确戏剧单元

叙事镜头应有一个目的、一次观众注意力变化、一项可读动作，以及一个明确的出点状态。观察式／随笔式作品可以通过持续观察和感知变化构成单元，不必产生新剧情事件。静帧或非叙事研究采用可见传播目标及稳定视觉状态。存在多次空间或因果变化时，先进入 `action` 路由。

决策顺序：

`目的 → 目标／阻碍／变化 → 注意力顺序 → 走位与区域 → 可观察表演 → 一个主导摄影机想法 → 镜头物理光照 → 时间曲线 → 出点状态与衔接`

先调度，再选焦距。明确位置、视线、支撑、重量、遮挡、路径、前中后景，以及观众先后注意什么。

注意力冲突、动作阶段选择或关键帧检查，阅读[镜头设计工作台](../optional/shot-design-workbench.md)对应小节。分开人物注意力、观众注意力和摄影机的信息披露。正面资产或明确 POV 请求可以看镜头。按目的选择预备、动作展开、结果或持续观察，不强加统一摄影处理。

视频交接使用[视频表演与镜头设计](../optional/video-performance-direction.md)，分别编写表演／摄影机／焦点／环境／特效／声音轨，再用[时长与剪辑余量](../optional/video-timing-and-handles.md)保留有效动作和余量。用户要求节点化交付时，提示词使用[类型化标签](../optional/tagged-video-nodes.md)。平台控制以有日期的证据为边界，不能仅凭摄影术语推断接口能力。

配角活动与联合导演评审使用[群像调度与逐镜评审](../optional/ensemble-direction-and-review.md)。可辨认背景人物有自己的任务和注意目标，依据实际可接收线索协调反应，并通过 `blocking`、构图及 `promptHandoff` 保留到交接。刻意空场不添加人群。

<a id="camera-and-composition"></a>
## 摄影机与构图

明确景别、机位与高度、角度、轴线侧、透视意图、必要焦距、焦点目标、纵深、运动动机、起点／峰值／停稳和稳定终态。“电影感”不是摄影机决定。组合运镜只有在每个组成部分都有独立可读目的时才成立。

<a id="shot-light-and-time"></a>
## 镜头光照与时间

定稿沿用已确定的场景光源；规范交接时绑定精确 `SceneLightState` 中的光源；草稿可以在场景职责下提出光源假设。区分直射、反射和透射，命名反射／透射表面。风格处理不能替代光源逻辑。

演员表演、摄影机、焦点、场景运动、动态光和剪辑事件分别放在独立轨道上。同步轨道时，不能改写人物领域持有的时序。

<a id="cinematic-patterns-and-compilation"></a>
## 电影模式与编译

需要比较或细化镜头手法时，按问题阅读[自适应导演手法](../optional/master-style-presets.md)相关小节；普通镜头可直接按当前节拍设计。从简报推断合适方法，组合兼容维度，不先追问预设。保留视觉规范中的共享基线；手法变化不能授权逐镜改变调色和纹理。单纯浏览、精确编译或评审不授权创意适配。

可复用的 `CinematicSkillManifest` 条目包含故事功能、有类型且有范围的参数、必要绑定、归属路由、目标产物和质量检查，不是平台预设。

`ShotCompilerPlan` 将选定模式、精确绑定和参数值解析为只用于投射的控制项及计划交接。`@Asset` 只能通过精确注册表解析。不编造输出哈希，也不执行计划。

<a id="downstream-artifacts"></a>
## 下游产物

普通创作直接输出镜头卡及复制稿。仅在需要规范产物时，先创建 `ShotSpec`，再创建 `ShotLightingPlan`、`TemporalSpec`、可选 `CameraPrevisSpec` 和 `HeroFrameAnchor`。主视觉锚点记录选定视觉特征和继承策略，不创造身份、地理或权利事实。

调度、表演或竞争镜头方案参见[导演方法](../optional/directing-craft.md)；焦距、光照、运动参见[摄影方法](../optional/cinematography-craft.md)。有条件地使用检查，不将所有方法装入每个镜头。只有请求需要时才加载数值摄影机、肖像或电影模式参考。

可选规范输出（仅在请求结构化交接时）：`CinematicSkillManifest`、`ShotCompilerPlan`、`ShotSpec`、`ShotLightingPlan`、`TemporalSpec`、可选 `CameraPrevisSpec`、`HeroFrameAnchor`。

涉及场次与连续镜头时，使用[拍摄系统与部门协同](../optional/prompt-detail-standard.md#拍摄系统与部门协同)的共享基线和逐镜交付模板，核对空间、构图、光位、收音与场记连续性。
