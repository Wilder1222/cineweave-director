# 可选参考：摄影机预演

仅在数值三维交换、精确轨迹、可复现虚拟摄影机状态，或下游实施交接需要超出语义运镜说明时加载。

层级：

`序列覆盖 → 镜头目的与调度 → 摄影机行为 → 位姿／内参轨 → 实施`

`CameraPrevisSpec` 绑定精确 `ShotSpec`、`SceneBinding`，以及可选 `TemporalSpec`。明确：

- 场景局部坐标系、左右手系、原点、坐标轴和米制单位；
- 约分后的有理数帧率与整数帧边界；
- 画幅／传感器、投影、裁剪面、快门约定；
- 摄影机位置和单位四元数姿态轨；
- 焦距／视场角、对焦距离、光圈轨；
- 插值与停留行为；
- 分离的平移、旋转、变焦、对焦和光圈分量；
- 碰撞、水平线、目标和地理约束。

平移不是变焦。移动摄影机改变透视关系；改变焦距改变视场范围，不能混称。位姿和内参即使同步也必须分开。

关键帧包括起点、可读峰值、需要时的停稳和按剪辑设计的出点。出点可以是稳定终态，也可以是明确的运动相位；不得为了预演模板强迫每镜停住。边界帧精确，轨道连接处相互一致。数值预演不授权平台执行、不证明可行性，也不能覆盖调度、表演、场景几何或镜头意图。

## 引擎交换与职责

三维预演回答摄影机能否经过、演员与物件能否接触、遮挡何时发生及焦点如何交接。白模、视口预览和最终渲染承担不同职责，预演通过不能证明材质、发丝、表演或 AIGC 结果通过。需要选择 UE、Blender 或纯 AIGC 路径，以及渲染／色管交接时，读取[渲染与画质方案](rendering-quality-workflows.md)。

Epic 的 Cine Camera 将 Filmback、Lens、Focus 分开；同样的焦距只有结合传感器尺寸、画幅裁切、摄影机位置与对焦距离才构成可比较镜头。交接保留水平／垂直视场约定和 Sensor Fit／裁切行为，不只抄一个毫米数。[Cine Camera 官方说明](https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematic-cameras-in-unreal-engine)（访问：2026-10-10）。

交换前声明源软件与目标软件的实际版本、单位比例、坐标手性、世界轴、摄影机局部前向／上向、旋转和四元数分量顺序、帧率与时间原点。UE 使用左手系、Z 向上，X 向前、Y 向右，默认长度单位为厘米；本项目的米制交接需明确换算。不能只交换轴标签或将位置换算套用到角度和焦距。[坐标空间](https://dev.epicgames.com/documentation/unreal-engine/coordinate-system-and-spaces-in-unreal-engine)、[官方导入单位说明](https://dev.epicgames.com/documentation/unreal-engine/importing-content-into-unreal-engine-from-maya)（访问：2026-10-10）。

外部实施先用三个有区别的空间标记、一个已知尺度物件和一个指定观看方向验证换算，再比对起始、遮挡峰值与出点的构图。检查左右翻转、物件尺度、滚转、视场裁切、对焦目标及帧边界；空间单位与镜头毫米各自保留单位。验证任务属于实施交接，没有返回预演画面时标为待检。

动画／物理以帧采样保存时，还需说明子帧求值与缓存范围。外部渲染的快门窗口、时间采样和预热可能访问采用范围以外的时刻，需为相关角色、摄影机、效果与模拟保留足够数据；不能将采用区间以外的缺失动画交给插值自动补齐。空间与时间采样的区别见 [MRQ 图像设置](https://dev.epicgames.com/documentation/unreal-engine/cinematic-rendering-image-quality-settings-in-unreal-engine?lang=en-US)（访问：2026-10-10）；具体窗口依目标版本和配置确认。
