# CineWeave 阶段成果交接模板 v1（可复制填写）

> **这是一份空白交接模板，不是已经完成的影视作品，也不是已通过的验收结果。** 正式作品必须填上真实存在的成果路径、准确版本／来源和审阅记录。任何尚未生成的图片、视频、声轨，均不得凭模板填「完成」。

## 制作包基本信息

- 项目 / 世界：`<project-id>`
- 场次编号：`<scene-id>`
- 影片时长 / 画幅 / 媒介：`<actual values>`
- 设计源版本 / 已锁硬要求：`<exact source/versions>`
- 实际媒体来源与授权：`<none or exact licensed source>`
- 阶段设计状态：`missing | draft | design_ready`
- 实际媒体状态：`pending_media | production_ready`（必须有已审片的真实媒体才能写 production_ready）

## G0 戏剧与导演

- [ ] `<project>_<scene>_G0_DIRECTOR_CARD_v1.svg`：导演意图卡，写观众视点、信息变化、表演尺度和允许的镜头语法
- [ ] `<project>_<scene>_G0_SCRIPT_v1.md`：完整可表演剧本，准确对白归属与场次动作全文
- [ ] `<project>_<scene>_G0_BEATS_v1.md`：每个节拍的前态、触发、人物行动、后态及镜头覆盖
- 退出检查：剧本、节拍与导演决定不自相矛盾；不为无冲突日常强加敌对事件

## G1 视觉开发（六卡必须真实保存）

- [ ] `<project>_<scene>_G1_STYLE_CARD_v1.svg`：视觉风格卡，媒介、造型、表面、电影语言、不变量、禁忌与参考迁移范围
- [ ] `<project>_<scene>_G1_PALETTE_CARD_v1.svg`：配色卡，主辅／强调色和角色颜色；设计色值／故事用途；不同场景的调色变化
- [ ] `<project>_<scene>_G1_MATERIAL_CARD_v1.svg`：材质卡，关键衣料／皮肤／木金石玻璃液体的结构、粗糙度、反射与冷热光响应
- [ ] `<project>_<scene>_G1_LIGHTING_CARD_v1.svg`：灯光卡，主辅光、反射、阴影、衰减、白平衡／光比意向与使用镜头
- [ ] `<project>_<scene>_G1_LIGHT_PLOT_v1.svg`：世界光位与拍摄机位图；门窗灯具不随机位反转
- [ ] `<project>_<scene>_G1_LOOKTEST_BOARD_v1.svg`：真实排好版的对照图板，列测试角度、输入、验收条件和未生成的测试格
- [ ] `<project>_<scene>_G1_ASSET_CARDS_v1.md`：人物、服化道、场景与道具母稿及各自可复制的独立图像提示词
- 退出检查：六个卡片文件实际存在并可打开；空壳、仅 JSON 字段或文件名不足；真实光材测试未返回前，**媒体验收不可标通过**

## G2 场景与世界空间

- [ ] `<project>_<scene>_G2_SCENE_MAP_v1.svg`：空间平面图与可行走／机位区域
- [ ] `<project>_<scene>_G2_GEOGRAPHY_v1.md`：世界方向、门窗柱网、距离及遮挡锚点
- [ ] `<project>_<scene>_G2_LIGHT_SOURCES_v1.md`：源光位置、光质及与 G1 的精确引用
- 退出检查：同一场景反打和实际接触位置自洽

## G3 走位与角色表演

- [ ] `<project>_<scene>_G3_BLOCKING_BOARD_v1.svg`：角色进入、离开、转身、接触及视线关系
- [ ] `<project>_<scene>_G3_PERFORMANCE_v1.md`：每位角色的目标、障碍／活动对象、策略、潜台词与可见反应
- [ ] `<project>_<scene>_G3_HARDLOCKS_v1.md`：台词、持物手、关键动作及声音触发硬锁
- 退出检查：先收到刺激再反应，且不能通过不真实的人体伸长实现交接

## G4 摄影与分镜

- [ ] `<project>_<scene>_G4_STORYBOARD_v1.svg`：完整镜号与节拍覆盖的可查看分镜板
- [ ] `<project>_<scene>_G4_SHOT_CARDS_v1.md`：每镜景别、机位、Camera Language、焦点、构图、入出态、图像／视频提示词全文
- 退出检查：没有漏镜号；线框分镜不能冒充已经生成的真实电影帧

## G5 声画剪辑与调色

- [ ] `<project>_<scene>_G5_EDIT_TIMELINE_v1.svg`：帧窗、声桥与真实剪点的视觉时间线
- [ ] `<project>_<scene>_G5_DIALOGUE_CUES_v1.md`：准确台词／声线／语气／预定时间及字幕映射
- [ ] `<project>_<scene>_G5_GRADE_PLAN_v1.md`：镜间光色连续性和 G1 色彩卡的继承
- 退出检查：整数帧闭合、各切点持物和声音来源可解释

## G6 生成与样片

- [ ] `<project>_<scene>_G6_TEST_PLAN_v1.svg`：真实可看的测试卡，测试组、否定条件、候选上限、停止规则
- [ ] `<project>_<scene>_G6_HANDOFF_v1.md`：参考素材绑定、平台参数证据、素材回流及采用范围
- [ ] *若目标是生成阶段已完成*：还须提供实际候选媒体和生成回执，否则保持 `pending_media`

## G7 审片与修复

- [ ] `<project>_<scene>_G7_REVIEW_CARD_v1.svg`：逐镜六视角设计审核与媒体复审结果
- [ ] `<project>_<scene>_G7_ACCEPTANCE_v1.md`：阻断项、可复现证据、版本、修复后复测和通过边界
- [ ] *若目标是整片通过*：必须用可访问真实视频／音轨完成证据审查，不能只靠设计卡或文字检查

## 结果清单与退出报告

每张卡／每份正文登记 `artifactId`、`stage`、`kind`、`path`、`sourceRef`、`reviewStatus`、`designStatus` 与 `mediaStatus`，采用统一编号 `<project>_<scene>_G<stage>_<KIND>_v<revision>`。旧资产允许精确引用并解释已通过范围，不要求为备案重新生成。

**设计验收是阶段成果真实性的检查；生成／成片验收是另一项媒体检查。** 先完整交实物，再从局部测试和真实样片验证，避免将计划冒充成果。
