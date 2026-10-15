# CineWeave 摄影语言强制关卡：实施与回归矩阵

日期：2026-10-15。适用分支：`feat/camera-language-grammar-20261015`。先有镜头语言词库 PR #1；本次追加镜头导演的必经决策、兼容结构字段、只读逐镜关卡以及回归测试。

## 已实施的职责

- `cineweave-director/SKILL.md`：所有**新创作的影视叙事镜头**必须先执行 Camera Language Selection；白底资产、静态服装、纯剧本、翻译与忠实平台投射不自动扩权。
- `shot-direction`：把镜头选择分为目的、Blocking、机位构图、固定／运动、焦点、出点。允许 `neutral_static`，不会强制每镜运动或使用全部 35 招。
- `action` 和 `storyboard_rhythm`：保留动作物理与分镜剪辑各自所有权。明确焦点转换 `rack-focus` 是焦点轨，而不是摄影机本体的位移。
- `ShotSpec.cameraLanguageDecision`：兼容增加可选嵌套信息（主导技法、辅助技法、叙事理由、观众看到的变化、触发、静止／移动状态、焦点模式和相邻出点）。旧 2.2 产物可以继续读取；**新规范出品**必须按新指南填写和经过镜头语言关卡。
- `check-shot-review.mjs`：增设 `checkCameraLanguageDecisions(plan)`，新评审表 `source.cameraLanguageScope` 指明 `narrative_video` 或 `narrative_keyframe` 时，逐真实镜号验证选镜记录、空间构图、运动／焦点分类和时序；也可独立运行 `--camera-language`。
- 继承外部视频能力必须保留导演母稿。未知能力／媒体效果不升级为“已通过”。

## 回归矩阵

| ID | 测试或生产场景 | 规划期的可判定结果 | 实际媒体（需外部候选） |
| --- | --- | --- | --- |
| CL-01 | 固定双人倾听（静止是主动选镜） | static ＋ hold，焦点和空间完整，通过 | 未提供 |
| CL-02 | 过肩对话（K03） | 有镜头关系和眼线，不机械每句反打 | 未提供 |
| CL-03 | 过胯拔剑前（K02） | 腰间道具与对手均可读，不把 hip-level 冒充 OTH | 未提供 |
| CL-04 | 背后绕至正面（K04） | arc 与故事触发匹配、背景地标和轴线可续 | 未提供 |
| CL-05 | 低机位环绕（K06） | 被围困必须由空间出口和敌阵证实 | 未提供 |
| CL-06 | 顶拍队形（K05） | 主角、追兵、出入口、地理可辨 | 未提供 |
| CL-07 | 固定机位切焦（K07） | static + rack，两个对象先已存在，focusTimeline 至少两事件；不把 rack-focus 填为机位移动 | 未提供 |
| CL-08 | 追逐／多人战斗 | 攻防、持物、接触、轴线、运动相位跨镜一致 | 未提供 |
| CL-09 | 无动机堆砌 35 种技法 | 需导演人工判不通过，机器只能检结构和部分冲突 | 不适用 |
| CL-10 | 缺镜号／重复镜号／新工作表不含 cameraDecisions | 机器阻断完成 | 不适用 |
| CL-11 | 旧版存档与资产图 | 依旧有效，不被新必经关卡误判 | 不适用 |
| CL-12 | 首帧／尾帧仅有静态图片 | 校验构图、机位、人物状态；不宣称焦点运动已实现 | 未提供 |

## 使用只读检查器

```bash
node skills/cineweave-director/scripts/check-shot-review.mjs --camera-language camera-workbook.json
node skills/cineweave-director/scripts/check-shot-review.mjs review.json
```

独立 `camera-workbook.json` 使用 `{ "scope": "narrative_video", "shotIds": ["S01"], "decisions": [ ... ] }`。每条包含 `shotId`、与 `ShotSpec.cameraLanguageDecision` 同结构的 `decision`、来自 `ShotSpec.camera/composition` 的原字段、来自 `TemporalSpec` 的 `temporal`（视频必需；叙事关键静帧可不提供）。不凭空创建故事、器材参数、远端生成任务或成功声明。

## 正式验收边界

结构和人工文本评审与实际媒体审核要分开。合格 CI 只能证明文件分发一致、schema 可用、测试通过、机器可发现缺字段与若干类型冲突。**实际镜头移动是否平稳、焦点是否真的转换、遮挡／视差及观众能否读到信息，必须对具体模型、实际视频、分辨率和采用时间窗口进行检查。** 未获得模型、界面、回传视频和原声时媒体状态恒为待验证。工具不上传、不生成媒体、不断言平台已经支持某种动作。
