# 统一入口工作流：独立前向首版交付报告

本报告内嵌10条原请求的全部实际首版回答、必要内部步骤与跳过说明、产物owner及工作流最终owner、实际来源路径/字节SHA256/使用章节，以及所有实际检查命令的原生结果。没有自评分。每案首版文件使用v1保留；C08的用户稿修订是独立的版本2候选，原版本1另外保存。

执行方法与限制：本run按任务要求为newfork_none；10案在同一代理、同一新分支上下文中依次执行。初始输入包含全部10案，因此这不是10次互相独立的新上下文试跑，无法由此证明对历史上下文污染的完全隔离。各案只使用该案原请求/rawData和当前Skill规则；前案原创人物、服装、场景、光源、素材、声音或批准状态不带入后案。没有读取rubric、测试计划、旧输出、研究资料、其他run、dev tests或skill-sources。只从任务给定的统一入口进入，专业能力入口也使用任务给定允许范围内的准确路径手工读取；没有宿主自动发现/选择的证据，不如此宣称。没有子代理、安装、provider访问、生成媒体或外部批准。模型、token、推理档与时延没有可靠观测，均为null；Native Node版本是实际命令返回，单独记录。

```json
{
  "format": "cineweave-forward-run-report/v1",
  "runMode": "newfork_none",
  "date": "2026-10-12",
  "caseCount": 10,
  "sharedContextBatch": true,
  "perCaseFreshContext": false,
  "entrySelection": "Task-provided exact path, manually read by the same agent",
  "internalCapabilitySelection": "Task-provided allowed exact paths, manually read and executed as needed",
  "automaticHostSelectionObserved": false,
  "subagentsUsed": false,
  "model": null,
  "tokenUsage": null,
  "reasoningEffort": null,
  "latencyMs": null,
  "scoringPerformed": false,
  "mediaCreated": false,
  "providerAccessed": false,
  "approvalGranted": false
}
```

## 输入与入口

- 原请求文件：`D:/Temp/cineweave-unified-workflow-raw-inputs-20261012.json`，SHA256 `76b204ce9a21ed4f6832d4b82d2afc0a8c5313a35673aa436b8adb7ba419b36d`。
- 唯一用户入口：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md`，SHA256 `ed028f57348cf23187165e227bc17ff03841b39cf7357e7c2b45bdbc44828a89`。
- C04/C05/C06/C07/C08的内部入口均同代理手工按需读取；专业产物owner与导演最终owner分别写在各案记录。T23/T24为无关任务，直接翻译/算术。

## 全部实际首版回答与逐案过程

交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C01-v1.md`；SHA256 `a08f79e0e43b8b5c0418341f171ec954fd6429d209887856f1566efa835923af`。

# CW-SPLIT-C01 首版实际回答

```text
4:5竖版摄影写实电影海报。蓝调暮色中的海边旧灯塔入口，一名约三十岁的成年女子独自站在干燥的石阶上，全身从头顶到鞋底完整入画。短黑发贴近颈侧，侧分，少量发梢随轻微海风向画面右侧偏；方圆脸，平直眉、深棕眼睛，鼻梁自然，双唇轻合，面部保留自然肤质，无装饰性彩妆。她带着克制的疲惫与坚定，眉间略收，目光望向画面右侧的海面，下颌平稳，肩膀稍沉。身穿深蓝色无图案棉外套，翻领、长袖、哑光棉织纹，前襟闭合，袖肘有自然受力褶皱；内搭灰色圆领衣，深灰直筒裤与黑色平底鞋，无标志、刺绣或饰品。两脚稳立石阶，重心均衡；右手在大腿外侧环握一盏点亮的黄铜提灯提柄，拇指压住柄侧，灯体垂直悬在右腿旁，与腿保留间隙；左手空着自然垂落。

旧灯塔的石砌门框位于人物左后方，深色木门紧闭，盐蚀石材和门板纹理可辨；入口石阶向画面下缘延伸，海面在远景右侧，海平线水平。人物置于画面中部略偏左，灯塔墙面形成安静的纵向背景，右侧海面留出视线空间；摄影机位于石阶前方，约胸口高度，水平取景，透视自然，中等景深使面部、右手握柄、提灯和门框均可辨。

冷蓝环境光来自日落后尚有亮度的广阔天空，柔和照亮脸部朝向天空的一侧与外套上部，门框凹处保持自然暗部。黄铜提灯内采用暖色电灯芯，光穿过透明玻璃灯罩，主要照亮右手、右袖近处与右腿旁一小片衣料和石阶，离灯越远越弱；暖光不把整座灯塔或海面照亮。黄铜棱边呈克制暖色反光，棉衣以柔和漫反射表现，石阶干燥，无无由湿亮和强烈轮廓光。整体低饱和冷蓝，局部克制暖黄，暗部仍保有材质细节。

画面上方约五分之一留干净暮色天空，中文片名“归潮”准确且仅出现一次，以清楚、端正的浅米白中文字居中排列，两个字同一行，字形完整不裁切。下方保留窄幅干净署名空间，此处暂不生成文字。画面没有其他正文、旁白文字、额外人物、闪电、火焰或可见明火；不增加标志与重复标题，不让提柄穿过手指，不让提灯变成第二盏。
```

现阶段唯一需要后续确认的是实际生成结果中片名的字形、单次出现和位置；尚未生成图片。其余未锁定的面貌、鞋裤、闭门和电灯芯为本稿设计选择。

## 实际执行记录

- 进入统一入口 → `image_prompt`；按单图需要读取场景共享空间、物理光照及提示词人物/表情/场景/构图章节 → 返回统一入口检查硬锁并交付。
- 未调用 reference：没有参考分析需求；未调用 platform：没有指定模型；未调用 review：没有已有稿件评审需求。单图不需要短片流程、节点稿、工作表或 Node。
- 内部产物 owner：cineweave-director（原创图像提示词）；工作流最终 owner：cineweave-director。未生成媒体。
- 实际来源：入口 SKILL.md；image-prompt.md「编译顺序」「提示词精简关卡」「准确文字与排版」；scene.md「共享空间检查」「物理光照」；prompt-detail-standard.md「表达原则」「人物」「人物情绪与表情生成」「场景」「构图与摄影实现」。精确路径与 SHA256 见 report.md 来源索引。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C02-v1.md`；SHA256 `c810c853e5c225d374d9e8907be5a7b039858ffc90c135740de15f16d9865db9`。

# CW-SPLIT-C02 首版实际回答

以下是待绑定的首图设计和基于该设计的运动稿。人物外貌、服装与门厅日光为暂定设计；实际首图尚不存在。六秒是本次有效采用段，不代表任何平台已支持的档位。

首图画面稿：

```text
16:9横向摄影写实画面，干燥、安静的住宅门厅，浅灰墙面、闭合木门与哑光石砖地面，无积水。画面左侧一名约三十岁的成年女子，短棕发，椭圆脸，无装饰性彩妆，穿深褐色无图案棉开衫、灰色长裤和平底鞋；画面右侧一名约三十五岁的成年男子，短黑发，穿浅蓝无图案长袖衬衫、深灰裤与平底鞋。只有这两个人。两人站在同一进深，面对彼此，身体略向摄影机打开，使胸前手势不被躯干遮住；相邻肩线之间约六十厘米，为本图的暂定构图距离。女子看男子的脸，眉间有轻微犹豫，双唇自然合拢，下颌稳定、肩部放松；男子闭唇，目光落在女子右手握着的伞柄上。

女子右手在腰前握一把收拢黑伞的握柄下部，四指环握，拇指压在柄侧，柄的上部留出可触碰区域。收拢的伞身向下垂直，伞尖实际接触干燥地面，伞尖下有接触阴影；左手空着落在身体左侧。男子左手空着，松弛停在左腰旁，与伞柄尚有明显间隙，手指没有碰到伞；右手自然垂落。两脚分别承重站稳，画面中没有已经发生的递交、接触或松手。

摄影机固定在两人关系轴线的门厅前方同一侧，约胸口高度，水平拍摄，中全景完整看见两人头部、双手、伞柄、伞身和落地伞尖。透视自然，人物占据画面主要面积，中等景深同时保护面部与中央手部接触区，门厅结构可辨。画面左侧窗的柔和白昼光照入，浅灰墙和干燥地面提供弱漫反射，肤色、棉布与黑伞轮廓清晰，无无来源强背光。没有字幕、标志、额外人物或第二把伞。
```

完整运动稿：

```text
6秒有效采用段，16:9横向，单镜摄影写实，摄影机全程固定在门厅前方同一轴线侧，保持上述中全景、水平视角、自然透视与同时可读的面部和手部范围，不推拉、摇移、变焦或切镜。此稿的首图仍待制作与核对，不声称已绑定实际图片。

初态为干燥门厅中成年女子站画面左侧、成年男子站右侧，面对彼此且略向摄影机打开。女子短棕发、深褐无图案棉开衫、灰裤与平底鞋；男子短黑发、浅蓝无图案衬衫、深灰裤与平底鞋。女子右手环握收拢黑伞握柄下部，柄上部露出，伞尖触地；女子左手空着垂落。男子左手空着停在左腰旁，尚未接触，右手垂落。女子看着男子的脸，男子先看伞柄。窗的日光方向、背景结构和衣物保持不变。

0至0.8秒，保留这一起态和视线关系。0.8至3.2秒，女子保持站位，右肩和肘缓慢前送，将伞柄向两人之间的空隙、男子左手可及处送近；伞尖作为地面支点保留接触，收拢伞身随柄前送缓慢倾斜，伞尖不滑行、不弹起，柄始终归女子右手持有。约1.2至2.8秒，她对男子说准确台词“你拿走吧”，声音平实、轻而清楚；唇和下颌自然随发音变化，不要求说话时闭唇，不补充其他字句。男子在伸手前继续注视送近的伞柄。

3.2至4.6秒，女子减速，使柄停在两人之间，右手仍稳定环握下部，承担伞的控制与重量。男子保持目光在柄上，才抬起左前臂，手腕放松，左手食指和中指指尖缓慢伸向柄的露出上部，轻轻触到；两只指尖只触碰表面，左掌不包住柄、不托伞，女子不松开手指，也不换手。接触点位于两人躯干之间，女子的握持和男子的指尖同时清楚可见，不能被衣袖、伞身或对方手掌遮住。

4.6至6秒，男子指尖保持轻触，未接过重量；女子继续握住并控制同一把伞，伞尖仍触地。两人停顿，女子说完后双唇自然合拢，视线仍在男子脸上；男子仍看柄，嘴唇合拢，不开口。最终保持这一未完成交接，不增加收回、接伞、迈步或额外动作。

声音意图：保留女子画内准确台词“你拿走吧”，句尾完整，口型需与实际发音同步；只辅以低声级门厅底声和前送时轻微干燥衣料摩擦，不夸张伞柄触碰声，不加旁白、额外对白或音乐。没有任何已制作音轨。人物相貌、服装、持手、黑伞数量、地面干燥状态、窗光与固定摄影机保持连续；不让伞穿过手指、男子提前握紧或女子突然松手。
```

现阶段缺少实际首图、选定平台/准确模型与界面模式、其图生视频与时长能力资料，以及可听审的准确对白声音。首图制作后先核对起态、两人距离、伞尖触地和手部无遮挡，再绑定它；声音路径与口型同步方式需按平台能力确定。实际六秒能否容纳完整台词和末段停顿，须用声音及视频结果复查；本次不增加额外生成余量，提交时长尚未决定。

## 实际执行记录

- 进入统一入口 → shot_direction 与 image_prompt，按需使用 scene/动作接触规则 → 静态起点与运动分开完成 → 返回入口核对完整台词与重量未交接。
- 未调用 reference（无素材/分析任务）、platform（尚未选平台）、review（新创作稿；只人工检查当前硬锁）；未建立正式契约/工作表，未运行 Node。
- 内部产物 owner：cineweave-director（首图画面稿、视频母稿、声音意图）；工作流最终 owner：cineweave-director。
- 实际来源：入口；image-prompt.md「关键帧准备度」；shot-direction.md「明确戏剧单元」「摄影机与构图」「镜头光照与时间」；scene.md「共享空间检查」「互动」；action.md「节拍结构」；prompt-detail-standard.md「人物情绪与表情生成」「镜头与分镜」「图生视频」「收音与声音空间」；video-performance-direction.md「把角色处境转成可表演任务」「台词与声音表达」「摄影机与焦点」；video-timing-and-handles.md「三种时长，不混为一种」；video-sound-and-delivery.md「视频意图」「声音职责与提示表」。路径/hash 见 report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C03-v1.md`；SHA256 `cbebb9b1fd254056a8918f385960ae76e7577d8fb27a407f00d3718a8a2a413e`。

# CW-SPLIT-C03 首版实际回答

本稿沿用用户版本1动作，完成两镜构图和时间分配。两镜均为5秒，直接连续硬切，总长10秒，16:9；以下秒数是文字调度设计，尚无实际媒体。暂定柜台南北深度约四十厘米，两人沿东西方向对齐在同一交接位置，使跨柜台接触可达；不改变店主北侧、学徒南侧、西窗或东门。

共享基线：单间修理铺，柜台沿东西方向，东墙门向外开，西窗中性柔光照入，地面干燥。成年店主深灰衬衫，始终在柜台北侧面向南；成年学徒浅灰无图案外套，始终在南侧面向北。同一枚黄铜钥匙，同一只皮质钥匙袋留在柜台南缘；没有其他角色、对白、旁白或音乐。摄影机两镜均在柜台南侧，视点从朝北略移为朝西北，光源始终在世界西侧，不能为了近景改成新光向。

| 镜头 | 完整中文分镜卡 |
| --- | --- |
| S01，0至5秒 | 柜台南侧眼平固定双人中景。店主上半身在后景，学徒在近侧呈背面偏侧轮廓；稍错开构图使两人的关键手指及柜台交接点同时露出，不能让学徒躯干挡住左掌。自然透视，中等景深，视线与接触都可读。起态钥匙在店主右手，学徒左掌摊在台面。0至0.7秒店主先看空掌；0.7至2.7秒缓慢把钥匙放入左掌；2.7至3.3秒钥匙先接触掌心，店主才放开；3.3至4.3秒学徒左指轻合握住；4.3至5秒店主空右手退回身前。出点钥匙归学徒左手，学徒仍在南侧。环境底声连续，仅在实际接触时轻微金属碰掌声。 |
| S02，5至10秒 | 连续硬切到柜台南侧偏东固定手部近景，略向下看，台面、学徒左右袖口、两手、同一钥匙及南缘皮袋完整进入接触范围；北侧店主空右手可位于画框上缘，无新动作。焦点和景深保护右手接钥匙、左手释放及袋口。入点严格承接钥匙已在学徒左手、店主右手已空并退回，无重新放钥匙。镜内0至1.5秒学徒右手从左手握住钥匙后，左手松开，右手取出；1.5至3.9秒右手把钥匙插入柜台南缘袋口，直至钥匙全部进入；3.9至5秒才抽开右手。终态钥匙在袋内，双手空着，袋留原处。西窗柔光与室内底声延续，只有轻微皮革摩擦。 |

S01独立视频母稿：

```text
5秒，16:9摄影写实修理铺单镜。柜台沿东西方向，成年店主穿深灰衬衫站北侧面向南，成年学徒穿浅灰无图案外套站南侧面向北，两人在同一交接位置相对。东墙门向外开，西窗中性柔光照入，地面干燥。摄影机固定在柜台南侧眼平，双人中景，学徒近侧背面偏侧轮廓与店主上半身构成纵深，构图留出两手交接的台面区域，不用身体遮挡掌心；保持自然透视和足够景深，店主的视线与关键接触清楚。只有一枚黄铜钥匙，皮质钥匙袋在柜台南缘，没有额外人物。

初态钥匙由店主右手持有；学徒左手空着，掌心朝上摊在柜台上。0至0.7秒店主先看学徒空掌，0.7至2.7秒店主右手缓慢伸向左掌，把同一钥匙放入掌心。钥匙实际接触掌心以后，2.7至3.3秒店主才放开右手；3.3至4.3秒学徒左指轻轻合拢握住钥匙。4.3至5秒店主空右手退回自己身前。终态钥匙在学徒左手，店主右手空着，学徒仍在柜台南侧，不换手、不掉落、不生成第二枚钥匙。摄影机、衣服、柜台与西窗光始终稳定。声音仅连续室内底声和钥匙接触掌心时的轻微金属碰掌声，无对白、旁白或音乐。5秒出点保留以上状态，下一镜直接接续这一时刻，不重演交接。
```

S02独立视频母稿：

```text
5秒，16:9摄影写实修理铺手部近景，承接前镜出点的同一连续时间。柜台沿东西方向，成年店主穿深灰衬衫始终位于北侧面向南，成年学徒穿浅灰无图案外套始终位于南侧面向北；东墙门向外开，西窗提供中性柔光，地面干燥。摄影机固定在柜台南侧偏东，朝西北略向下看台面，与前镜同处南侧，不越轴、不移动、不变焦。画框完整保留学徒两手及袖口、钥匙、柜台南缘的皮质钥匙袋和袋口，焦点及景深保护每次接触，世界西侧光源位置和材质状态不变。

开始时同一枚黄铜钥匙已被学徒左手握住，店主右手空着、已退回自己身前，学徒仍在柜台南侧。镜内0至1.5秒，学徒右手从左手中握住这枚钥匙，左手随后松开，右手取出；完整看见先接触、后释放，钥匙不悬空、不增殖、不重新回到店主手里。1.5至3.9秒，右手把钥匙插入留在柜台南缘的皮质钥匙袋，钥匙逐步进入，袋仍在原处；待钥匙完全进入袋内后，3.9至5秒才抽开右手。结束时钥匙在袋内，学徒左右手均空着，皮袋留在柜台南缘。没有其他动作、人物、对白、旁白或音乐。室内底声从前镜连续跨过切点，装袋时只有轻微皮革摩擦，不增加另一次金属碰掌声。
```

整段母稿时间接口：S01采用0至5秒，S02采用5至10秒，切点不占额外时间。S01出点和S02入点均是“学徒左手已握唯一钥匙、店主空右手已退回身前、学徒南侧、袋在南缘”。这次切镜只改变观察尺度与南侧机位，不省略过程、不回看交接；装袋动作只在S02出现。无首尾图绑定或平台参数，实际接触、连续性、声音及剪辑流畅度待媒体复查。

## 实际执行记录

- 进入统一入口 → storyboard_rhythm 与 shot_direction → 按action/scene检查交接可达、持手与接触相位，按连续性及视频指南写齐两镜 → 返回入口合并为选定版本。
- 未调用 reference（无素材）、platform（无平台）、review（用户要求完成草稿，未要求完整定稿评审或正式规范交接）；手工核对局部连续性。未要求 canonical JSON，未使用工作表或 Node。
- 内部产物 owner：cineweave-director（分镜及视频母稿）；工作流最终 owner：cineweave-director。
- 实际来源：入口；storyboard-rhythm.md「分镜」「相邻剪辑接口」；shot-direction.md「摄影机与构图」；scene.md「共享空间检查」「互动」；action.md「节拍结构」；visual-bible-and-continuity.md「表现媒介与共享设定」「连续性台账」；prompt-detail-standard.md「镜头与分镜」「空间关系与调度」「场次与逐镜交付模板」；video-performance-direction.md「把角色处境转成可表演任务」「时间工作表与验收」；video-timing-and-handles.md「三种时长，不混为一种」；video-sound-and-delivery.md「视频意图」「声音职责与提示表」。路径/hash 见 report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C04-v1.md`；SHA256 `dc648b0cff203eae649f64ad999c204a2d8396a2e60283e9301ef40edd03343a`。

# CW-SPLIT-C04 首版实际回答

这是按所给虚构界面的离线适配工作稿，只在夹具条件下成立；母稿来源为POSTER-MASTER-01版本1，未连接服务或提交生成。

完整中文复制正文：

```text
4:5竖版摄影写实海报。成年女子，短黑发，穿无图案的深蓝棉外套，独自站在海边旧灯塔入口前，右手提一盏点亮的黄铜提灯，左手空着。人物全身可见，灯塔门在她左后方，干燥石阶向画面下缘延伸。蓝调暮色，海面在背景右侧，海平线水平；提灯暖光照亮右手和外套近处，暮色环境光保持脸部可读。风很轻，衣摆略向画面右侧偏。上方保留约五分之一干净天空排中文片名“归潮”，下方留窄幅署名区；标题只出现一次，不增加其他正文、角色、闪电或火焰。低饱和冷蓝与克制暖黄，真实材料纹理。
```

| 项目 | 本次离线填写方案 |
| --- | --- |
| 平台/模型/界面/模式 | MosaicLabs（虚构）/Canvas-Image 1.0（虚构）/网页界面（虚构）/T2I；这些是夹具范围说明，不新增控件 |
| 文本提示词框 | 粘贴上方正文全文 |
| 画幅下拉框 | 4:5 |
| 参数尾与其他控件 | 不加参数尾；资料没有负向框、seed、风格码、参考权重或个性化设置，因此不填写或虚构这些字段 |
| 参考素材 | 没有素材，夹具也没有上传入口；不作参考绑定 |
| 能力资料 | fixture-mosaiclabs-canvas-image-1-web-t2i，版本1，夹具日期2026-10-12；本次读取的是原请求内合成资料，无live核验 |

待核对：真实使用前确认目标确为所需准确模型、界面和T2I模式，并重新核对中文支持、4:5与控件。未来得到图片后，再逐项检查成年女子、短黑发、深蓝无图案棉外套、右手提灯、左手空着、光照来由与局部范围，以及片名逐字准确且只出现一次、上下留白和海平线。真实供应商能力、素材权利/传输许可及实际渲染效果均未知；本稿不能据此称为live服务可直接提交或已验收。

## 实际执行记录

- 进入统一入口 → 按已提供确切本地路径手工读取 cineweave-platform/SKILL.md → 交给内部能力完整母稿、硬锁、合成界面全文和未知状态 → 收回完整条件复制稿、设置与核查项 → 返回统一入口确认原请求范围。
- 这是同代理读取并执行内部步骤；没有宿主自动选择、独立代理、安装或provider调用。未调用reference/review；未补创作、未建立规范JSON/Node工作表。
- 内部产物 owner：cineweave-platform（适配工作稿，规范归属对应PromptProjectionPlan）；原母稿owner：用户/导演创作领域，正文未改；工作流最终 owner：cineweave-director。
- 实际来源：导演入口；cineweave-platform/SKILL.md「从实际输入开始」「忠实适配与交付」「创作约定」；其references/routes/image-prompt.md「平台适配」「准确文字与排版」。原请求POSTER-MASTER-01 r1和能力夹具r1位于输入JSON，精确路径/hash见report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C05-v1.md`；SHA256 `1363f93fb97619e39b1c628edb03ef00e5a769ae5f60f2d4258a098e10702b9f`。

# CW-SPLIT-C05 首版实际回答

四份材料均为用户文字声明，证据基础为`declared`；对实际图像内容的置信度未知。现在可确定的是用户指定的用途范围，不能据此宣称观察过图片或已建立身份绑定。

| 来源与职责 | 保留/借鉴 | 替换与排除 | 未决及后续验收 |
| --- | --- | --- | --- |
| A：原请求referenceMaterials[label=A].text；脸部身份依据 | 成年女子、短黑发、方圆脸，仅按文字暂定 | 排除A未被指定的服装、背景、姿势与媒介；不编造图片内五官 | 实际脸图缺失；具体眉眼鼻唇先原创暂定，获得A后逐项核对是否需修订 |
| B：referenceMaterials[label=B].text；服装 | 红色无标志棉外套、翻领、长袖、黑色直筒裤 | B假定长发模特的脸、身体身份和长发均不迁移，替换为目标女子；不迁移模特姿势与背景 | 实际服装图缺失；闭合结构、长度、鞋履为暂定设计，获得B后核对 |
| C：referenceMaterials[label=C].text；场景布局 | 空旷修理铺、北墙工具架、西窗、中央木桌 | 排除其他人物、源图服装身份及未经要求的质感；人物站姿由本稿设计 | 实际布局图、尺度与遮挡未知；复查全身能否露出、桌窗工具架方位是否相符 |
| D：referenceMaterials[label=D].text；媒介质感 | 水彩纸颗粒、克制冷灰与暗红、松动边缘 | 不取身份、衣服或姿势；不用D内容覆盖A/B/C | 实际质感图缺失；当前以文字解释水彩效果，实际颗粒尺度、边缘和色彩适配待图像比较 |

冲突已按职责解决：B的长发与A的短黑发不混用；D的暗红可用于压低B红外套的饱和度，但外套仍明确为红色，不替换成D里的服装。C仅控制房间布局，D仅控制表现质感。用户未给身体比例、具体五官、鞋履、站位和光照细节，以下采用可撤销设计；它们不是从四张图观察到的事实。

完整中文全身站姿人物稿：

```text
一张水彩人物资产画，4:5竖版，单一成年女子，完整看见头顶、双手、双腿与鞋底，周围留适量边界，不裁掉头发或鞋。约三十岁，中等身材，肩宽自然，方圆脸：颧部轮廓圆缓，下颌角仍可辨，下巴宽度适中；平直眉略有自然高低差，深棕杏眼，鼻梁中等宽度、鼻尖圆缓，上唇略薄、下唇稍丰满。肤色暖中性，用水彩的透明浅色层表现面颊与鼻侧转折，不作塑料般平滑表面。无装饰性彩妆，不加浓眼线、腮红块或亮面唇色。短黑发侧分，发尾在耳下颈上，轮廓清楚，无长发、发饰或夸张蓬松卷发。

人物处于中性、专注的资产站姿，没有虚构剧情情绪。眉间放松，眼睑自然，双唇轻合、不露齿，视线平稳看向摄影机位置。身体正对画面，头部平直，下颌自然微收，肩线平稳、颈部放松；双脚相距约半肩宽，膝部不锁死，重心均衡，左右手空着自然落在身体两侧，手指轻松微屈，不插袋、不持物、不作手势。

外穿红色无标志棉外套，翻领、长袖、正中前襟闭合，衣长到髋下，袖口平直，肩部不过度垫高。红色保持低饱和暗红倾向，仍能清楚识别为红外套；棉布低光泽、略挺，肘部和腰侧有少量自然褶皱。内层仅在领口露出一小片冷灰无图案圆领衣；黑色直筒长裤从髋部自然垂落，裤管不贴腿，深灰平底鞋轮廓简洁。没有标志、刺绣、配饰和从质感参考带入的其他服装。

人物站在空旷修理铺中央木桌南侧的通行空地，木桌在身后、不会遮住腿部；摄影机位于房间南侧，水平朝北，胸口高度、自然透视。北墙工具架在后景，西墙窗口在画面左侧，中央木桌的位置明确，桌两端从人物两侧露出，房内没有其他人。地面以简洁冷灰色块交代脚下支撑和柔和接触阴影，陈设稀疏，不用零碎工具遮住人物轮廓。

柔和日光从世界西侧窗口进入，人物靠窗的一侧面颊、红外套与手臂略亮，远窗侧有较柔暗部，房间浅灰墙提供弱漫反射。以冷灰环境和暗红外套建立克制色彩关系，黑裤保有轮廓，不用无来源发光描边。表现为水彩纸面：细微不均匀纸颗粒，薄层透明罩染，颜色在纸纹凹处略积聚；人物脸部、双手和服装结构边缘保持可辨，衣摆与背景次要边缘适度松动，不能以松动边缘改变脸型或缺失手指。全画面只保留这个女子和上述布局，不借服装模特的脸、长发、身体比例或姿势，不迁移质感参考里的人物与衣服。
```

这是一份暂定人物设计稿，未绑定实际参考，也未验证身份一致。后续需要A/B/C/D实际文件与准确取材范围，以及各素材版权/许可、涉及真人的肖像与同意、传输和商业使用范围；当前这些均未知，没有商用放行。上述新设计细节可在看到实际素材后按职责最小修订。

## 实际执行记录

- 进入统一入口 → 手工读取给定准确cineweave-reference入口 → 传入四段完整文字声明、各自作用范围及排除项 → 内部返回职责/冲突/迁移和权利未知项 → 返回导演入口 → character/scene/image_prompt完成最终人物稿。
- 未把参考阶段的文字声明转成visible观察；无真实目标绑定、注册表或假哈希。未调用platform（无指定模型）、review（新稿，无评审请求）、规范JSON或Node。
- 内部产物 owner：cineweave-reference（声明基础的参考分析/迁移计划）；最终人物稿owner：cineweave-director的character/image_prompt领域；工作流最终 owner：cineweave-director。
- 实际来源：导演入口；cineweave-reference/SKILL.md「从实际素材开始」「按职责迁移与绑定」「交付与责任回流」；其reference-evidence.md「流程」及reference-evidence-and-rights.md「原子化观察」「迁移策略」「权利与隐私」；导演character.md「分开四层」「身份锚点」；scene.md「设计顺序」「物理光照」；image-prompt.md「编译顺序」「参考与变换」；prompt-detail-standard.md「人物」「人物情绪与表情生成」「场景」；operating-model.md「任务范围与上下文」「能力交接与迁移」。路径/hash见report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C06-v1.md`；SHA256 `2e9607a70baab80c6b7f8c3a19a628517f3104332972e6b8484727c7e09effb8`。

# CW-SPLIT-C06 首版实际回答

保留Seedance的平台意向。“8张参考、原生发声、6秒”目前只有用户转述，均未核验；准确服务、模型版本、网页入口和生成模式未知。以下先完成创作母稿，再给同一内容的离线适配工作稿，不连接服务。修理工外貌、服装、工房与摄影机为本案暂定原创设计。

完整中文创作母稿：

```text
6秒有效采用段，16:9横向摄影写实，单镜。成年男性修理工，约四十岁，短发夹少量灰发，宽额头、自然眉眼，无装饰性彩妆，穿赭灰色无图案棉工作衫，袖口收整、不遮手。站在小型修理工作室中央工作桌北侧，身体面向南，桌面干燥整洁，背景只有浅灰实体墙和少量静止工具，没有其他人物。西侧窗的柔和中性日光照亮桌面、脸部及木纹，浅灰墙提供弱漫反射，不添加变化光源。

桌中央一只浅木色长方木盒，单片木盒盖通过世界北侧的木铰链连接盒身。开头盒盖闭合，修理工左手掌根和手指按稳盒身靠人物左侧的一边，即世界东侧；右手已轻握盒盖南侧前沿，拇指与其余手指分别接触边缘的上下侧。手指和接触边界可见，盒身落在木桌上、有稳定接触阴影。盒内只有一只浅木色雕刻小鸟，开头被盖遮住，不穿过闭盖显现。

摄影机固定在工作桌南侧，腰部以上中景并保留完整盒子、双手和开盖空间，视角略俯，使盒内木鸟在开盖后可见。透视自然，焦点及中等景深保护面部、手指、盒沿和木鸟，盖抬起后不遮脸、不挡鸟，摄影机不移动、不变焦、不切镜。

0至0.8秒修理工看着闭合盒盖，双唇自然合拢，神情专注，左手持续按稳盒身、右手握南侧前沿。0.8至4.2秒，右前臂缓慢抬起，右手始终握住前沿，盒盖仅绕北侧铰链向上旋转，从闭合经过微开、半开到接近竖直；左手保持原接触与向下稳定的力度，盒身不滑移、不转向。盒盖离开南侧盒沿后，盒内逐步显露，最后完整看见浅木色雕刻小鸟；木鸟固定躺放在盒底，不飞动、不变成活鸟，盒子与铰链不形变。修理工目光随显露落到木鸟上，眉间略放松，但不增加说话、取鸟或更换持手。

4.2至6秒，盖保持接近竖直，右手仍扶盖前沿、承担盖的稳定，左手仍按稳同一盒身。修理工静看木鸟，双唇轻合，停顿到结束。声音只要0.8至4.2秒随木盖旋转出现的细小、干燥木铰链摩擦，近处可辨，随开盖减速自然衰减；没有金属撞击、衣料声、另加环境音、对白、旁白或音乐。这是声音制作意图，没有实际音轨或原生发声保证。
```

Seedance离线适配工作稿——待准确网页/模型确认，拟采用文字驱动单镜；模式尚未确认，也未绑定图片：

```text
6秒，16:9横向摄影写实单镜。约四十岁的成年男性修理工，短发夹少量灰发，穿赭灰色无图案棉工作衫、收整袖口，站干燥中央工作桌北侧面向南。浅灰实体墙和少量静止工具构成背景，没有其他人物；西窗柔和中性日光，光线与木纹全段稳定。桌中央只有一只浅木色长方木盒，单片盖通过北侧木铰链连接盒身；盒内一只浅木色雕刻小鸟，初始不显露。

摄影机固定在桌南侧略俯的腰部以上中景，完整保留两只手、整个木盒、开盖路径及开后盒内空间，自然透视，景深同时保护脸、手指、盒沿和木鸟；不推拉、不变焦、不切镜。开头盖闭合，左手按稳盒身世界东侧，即人物左侧；右手已经握住盖南侧前沿，接触边界清楚。

0至0.8秒保持起态，修理工闭唇看着盒盖。0.8至4.2秒，右手不换握、不脱离前沿，右前臂缓慢抬起，让盖绕北侧铰链从闭合经微开、半开向上旋到接近竖直；左手全程按稳盒身，盒身不移位。木鸟随盒盖抬起逐步显露，固定在盒底，不飞动；盖不遮脸或木鸟，手指不穿木板，铰链始终在北侧。修理工看到木鸟后目光落在鸟上，眉间略松，保持克制神情。4.2至6秒，右手仍扶接近竖直的盖，左手仍按盒身，木鸟留在盒内，停顿到结束，不取鸟、不加人物或新动作。无对白、旁白、音乐。
```

独立声音工作稿：

```text
对应同一6秒单镜，只制作木铰链声：0至0.8秒静默；0.8至4.2秒随着木盖绕北侧铰链缓慢旋转，出现细小、干燥、近处的木质摩擦声，速度与画面开盖一致，盖减速时摩擦逐渐减弱；4.2至6秒盖保持不动，摩擦结束。没有额外环境音、金属声、衣料声、鸟叫、对白、旁白或音乐。
```

| 需要核对的项目 | 当前可准备与状态 |
| --- | --- |
| 平台、模型、界面、模式 | 意向为Seedance；准确服务URL、模型技术ID/版本、网页入口、T2V/I2V等模式均未知；未改换平台 |
| 6秒与16:9 | 本稿请求值为6秒有效采用段、16:9；实际控件选项、时长步长及返回规格未知，不能把6秒写成已可选档位。没有额外头尾余量需求 |
| 8张参考 | 传闻未核验；当前0张素材，无槽位映射，不为凑数准备8张。若后续选参考路径，再按身份/造型、工房布局、盒与鸟分别明确职责、实际文件和许可 |
| 原生声音 | 传闻未核验；正文不填写虚构声音开关。先保留上方独立木铰链声稿；只有准确模式证明支持后才组织原生音画输入，否则声音留后续制作 |
| 其他界面控制 | 中文支持、负向框、参数格式、摄影机控制、seed、参考权重与默认值未知；本次不发明字段或参数尾 |
| 证据和许可 | 没有平台文档、能力档案、实际图像/声音、权利和传输资料或生成返回。需要准确范围的当前证据后才确认提交准备度 |

当前完成范围是可审阅的中文母稿、条件适配正文与独立声音意图。将来必须检查手与盖持续接触、盒身不动、北侧铰链、唯一木鸟逐步显露、固定机位及木铰链声同步；文字和时长设计不能证明这些媒体维度已通过。

## 实际执行记录

- 进入统一入口 → 导演shot_direction/scene/action原创完整母稿 → 将新母稿全文、用户Seedance意向、传闻性质及未知项交给已手工读取的cineweave-platform → 收回条件复制稿与待核对表 → 返回导演入口连同原母稿统一交付。
- 内部平台能力不补造当前服务证据；其历史平台登记未用作本案支持8张/发声/6秒的证据。未调用reference（没有实际素材或需分析文字参考）、review（未要求综合评审）；没有规范JSON/工作表或Node。
- 内部产物 owner：cineweave-director（新母稿与声音意图）；cineweave-platform（条件适配工作稿）；工作流最终 owner：cineweave-director。
- 实际来源：导演入口及operating-model.md「任务范围与上下文」「能力交接与迁移」；scene/action/shot-direction及prompt-detail-standard.md的相关空间/接触/镜头/声音章节；video-performance-direction.md「摄影机与焦点」「时间工作表与验收」；video-timing-and-handles.md「三种时长，不混为一种」「按实际时长政策选择」；cineweave-platform/SKILL.md「忠实适配与交付」；其video-platform-adaptation.md「使用正确的权威来源」「能力证据的层次与评估日期」「模式选择与明确替代」「导演方案到复制稿」「适配不是盲目拼接」。路径/hash见report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C07-v1.md`；SHA256 `26fd1f6e0b07a81a8c576e823b067edc01058ea166f9c34d8a41a7cfdfae534f`。

# CW-SPLIT-C07 首版实际回答

FG-01版本1两镜的六视角文本评审已完成，原稿保留，未修改正文或批准定稿。工作表覆盖12/12项；检查输入有效，但两镜的空间可达条件和焦点说明仍有未决项。没有图像、视频或声音，下面的`pass`只针对注明的设计文本事实。

原稿逐字符存于`evidence/FG-01-original-v1.txt`，UTF-8无BOM，SHA256为`73f403fcf70c65612ab10ac96553997a5d1ef6d72b8f784f967b645fa9586245`。以下定位均指FG-01 r1，镜号沿用原文。

| 视角 / 镜头 | 标准、具体文本依据与状态 |
| --- | --- |
| direction / FG-S01 | **pass（文本）**。应看见唯一合拢信纸从右手移到桌中央，接触先于释放。来源「FG-S01 / 动作与出点」明确先注视、缓慢放下、接触桌面后才放右手，终态仍合拢在中央、陶杯未动；没有新增认知事件。 |
| direction / FG-S02 | **pass（文本）**。应直接继续同一张纸的展开。来源「FG-S02 / 入点、动作与结束」承接纸已在中央和双手空，才左按右展，终态一张无字纸平放；没有重新放纸或额外故事事件。 |
| performance / FG-S01 | **pass（文本）**。应有可执行视线和手部顺序。来源「FG-S01 / 她看着信纸至目光仍落在信纸」明确看纸、放纸、接触后释放、退回两手，目光保留；无说话或配角反应任务。 |
| performance / FG-S02 | **pass（文本）**。应继承前态并保存必要手部接触。来源「FG-S02 / 女子左手按住至结束」左按下半部、右握上半部边、沿原折痕展开，结束左仍按、右松开停右侧；动作任务完整，不需要给手部近景增加面部表演。 |
| staging / FG-S01 | **unknown / important**。应确认女子在桌北侧能够接触桌中央且不被躯干遮住。来源「共同房间基线及FG-S01 / 桌面中央」没有桌南北深度、人物与桌缘距离或接触区遮挡关系；不能确认可达，也没有证据断言不可达。待补最小空间关系，不移动硬锁站位。 |
| staging / FG-S02 | **unknown / important**。应在相同站位完整展开且陶杯在接触区外。来源「FG-S02 / 左按下半部、右握上半部及陶杯范围」已明示杯不进入主要接触区，但未给纸尺寸、折痕朝向、展开占位及桌深，双手工作范围待核。 |
| cinematography / FG-S01 | **revise / important（说明缺口）**。来源「FG-S01 / 镜头起句」给出南侧眼平中景、固定机位和西窗光，未给焦点对象及景深意图。最小修复归导演：只补“接触区焦点与景深意图”，让信纸触桌、右手释放均可读，不改变动作、机位或光源。本次仅列建议，未补写正文。 |
| cinematography / FG-S02 | **revise / important（说明缺口）**。来源「FG-S02 / 镜头起句与展开动作」给出南侧偏西略俯近景，却未说明展开过程中纸边和双手接触的焦点保护。仍归导演，最小变量为“接触区焦点与景深意图”；验收是两手/纸面在整个展开过程可读，其他锁定不动。没有断言实际媒体失焦。 |
| prompt / FG-S01 | **not_applicable**。标准为实际编译稿对设计的忠实度；来源「documentType及FG-S01全文」只有设计文本，没有独立图像/视频复制提示词，也未要求本次编写，不能凭空创建六套方案或补稿以填表。 |
| prompt / FG-S02 | **not_applicable**。同样没有编译目标或待审复制稿，用户未授权新增正文。此豁免只针对编译忠实度；媒体缺失并未作为豁免理由。 |
| continuity / FG-S01 | **pass（文本）**。来源「FG-S01出点 → FG-S02入点及共同基线」逐项相同：唯一合拢信纸在中央，双手空在桌缘，杯仍在东端；女子北侧、摄影机南侧、西窗光和底声连续。 |
| continuity / FG-S02 | **pass（文本）**。来源「FG-S02全镜及FG-S01声音意图」明确连续硬切，只换南侧机位和景别，纸从合拢到展开仍为一张无字纸、杯不动，左手最终按纸、右手空，底声连续，无对白/音乐。无后续镜头，不编造S03接口。 |

这些视角共同审一份稿件，没有形成竞争方案。未发现来源文本中的确定硬锁矛盾；未决空间条件不能当作已发生的物理失败。最小修复责任与顺序：场景领域先提供桌深、人物到桌缘和纸展开范围，以验证可达；导演领域再仅补焦点/景深意图。若这些事实揭示源动作不可达，需回相应上游责任与用户锁定解决，不能靠紧裁切掩盖。本次没有任何修改授权，因此修复停在责任和验收要求。

实际检查使用随cineweave-review包分发的`check-shot-review.mjs`与`check-delivery.mjs`，Node原生版本为`v22.15.0`。六视角表是非规范工作表；没有提供canonical JSON，不能宣称canonical schema通过。时间覆盖表仅用24/1作算术换算基准，把原稿每镜4秒映射成96帧，不宣称已锁定实际拍摄/媒体帧率。

实际命令：

```text
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-shot-review.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-shot-review-v1.json
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-delivery.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-delivery-v1.json
```

`check-shot-review`原生stdout，退出码2（有效但未解决）：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": false,
  "expectedRows": 12,
  "missing": [],
  "openItems": [
    {"role": "staging", "shotId": "FG-S01", "status": "unknown"},
    {"role": "staging", "shotId": "FG-S02", "status": "unknown"},
    {"role": "cinematography", "shotId": "FG-S01", "status": "revise"},
    {"role": "cinematography", "shotId": "FG-S02", "status": "revise"}
  ],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "输入有效，评审仍有未决项或没有适用的通过项。"
  }
}
```

`check-delivery`原生stdout，退出码0：

```json
{
  "valid": true,
  "errors": [],
  "duration": {"numerator": "192", "denominator": "24"},
  "endTimecode": "00:00:08,000",
  "subtitles": [],
  "srt": "",
  "scope": "Planning arithmetic only: cut-only shot coverage and one subtitle track. Text counts do not establish speech duration, readability, synchronization, rights, or media quality.",
  "localization": {
    "locale": "zh-CN",
    "summary": "剪辑覆盖与字幕算术检查通过，实际声音及画面同步仍未核验。",
    "errors": [],
    "scope": "仅检查硬切镜头覆盖、单字幕轨和文字计数；字数不等于口播时长，不证明可读性、同步、权利或媒体质量。"
  }
}
```

两条命令stderr为空，完整原生输出、退出码和输入工作表均保存于evidence目录。`valid:true`与时间覆盖通过仅证明工作表一致性及4+4秒的无缺口硬切算术；`reviewComplete:false`必须保留。没有媒体，身份、表情、接触、纸张形变、焦点、连续播放及底声/摩擦同步仍未知；没有定稿批准。

## 实际执行记录

- 进入统一入口 → 手工读取给定准确cineweave-review入口 → 交接FG-01完整原稿r1、两镜全部硬锁、无媒体证据及“不改稿/不批准”授权边界 → 六视角逐镜评审 → 实际运行本包检查器并保留未决项 → 返回导演入口统一交付。
- 未调用platform/reference；评审不接管故事或上游修订。不建立虚构canonical对象或生成记录。
- 内部产物 owner：cineweave-review（评审工作表、问题与最小修复责任，对应CreativeReview/RepairPlan职责）；原稿owner：用户/导演上游领域；工作流最终 owner：cineweave-director。
- 实际来源：导演入口；cineweave-review/SKILL.md「先确定可观察范围」「按范围检查与修订」「交付与责任回流」；其review-repair.md「评审」「修复归属」；ensemble-direction-and-review.md「同一场景，多个检查视角」「覆盖范围内的每一镜」「只读评审表检查器」；其scene.md「共享空间检查」；shot-direction.md「摄影机与构图」；storyboard-rhythm.md「相邻剪辑接口」；video-sound-and-delivery.md「视频意图」「声音职责与提示表」；实际两个检查脚本。路径/hash见report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C08-v1.md`；SHA256 `afc71b5bde4c28ad5ff8f30b02fb71e5ca9a0fd8b03891ab529b0a6b535d419f`。

# CW-SPLIT-C08 首版实际回答

修订候选版本2已完成，原版本1保留。修改范围只有REV-S02摄影机位置“桌南侧偏西略俯”→“桌南侧偏东略俯”，以及REV-G/REV-P正文已有的必要版本标识；REV-M以外部版本标签记为2。REV-S01整镜逐字符保持不变，其他字句不扩写。没有沿用此前评审结论，没有实际媒体或定稿批准。

REV-G，修订版本2全文：

```text
项目：雨停以后；镜头组REV-G，设计文本版本2，未生成媒体。锁定：成年男子一人，短黑发，浅灰衬衫、深蓝围裙；同一只浅木色长方盒，盖通过北侧铰链连接盒身。北墙工具架、西侧窗、中央工作桌；男子在桌北侧；西窗中性柔光始终不变；无对白、旁白或音乐。
REV-S01：16:9，4秒，桌南侧眼平中景，摄影机固定。男子左手扶盒身左侧，右手扶盒身右侧。盒盖闭合。他右手沿盒身移到盖的南侧前沿并轻握，左手持续按稳盒身；出点时盒盖仍闭合，右手已握前沿，左手未变。
REV-S02：16:9，4秒，桌南侧偏东略俯手部特写，摄影机固定，直接连续硬切。入点承接同一盒盖闭合、右手握前沿、左手按稳盒身。右手沿北侧铰链把盖向上掀到接近竖直，左手保持盒身不动；结束时盒内露出一只浅木色雕刻小鸟，右手仍扶盖，左手仍按盒身。室内底声、细小木铰链摩擦属于声音意图。
```

REV-M，修订版本2全文：

```text
连续两镜，共8秒，16:9摄影写实。单间木工房中，短黑发成年男子穿浅灰衬衫和深蓝围裙，站中央工作桌北侧；北墙工具架和西窗位置固定，只有西窗中性柔光。桌中央一只浅木色长方盒，北侧铰链连接盒盖与盒身。
0至4秒REV-S01，桌南侧眼平中景，摄影机固定。左手扶盒身左侧，右手从盒身右侧移到盖南侧前沿，轻握；盖保持闭合。到切点，右手握前沿，左手按稳盒身。
4至8秒REV-S02，连续硬切到桌南侧偏东略俯的手部特写，摄影机固定，盖仍闭合。右手沿北侧铰链向上掀盖到接近竖直，左手持续按稳盒身。露出盒内一只浅木色雕刻小鸟，结束时右手仍扶盖、左手仍按盒身。保持同一男子、衣袖、盒子、木纹、光向与接触状态；无对白、旁白、音乐或额外人物。室内底声和细小木铰链摩擦为后续声音意图。
```

REV-P，修订版本2全文：

```text
现有适配工作稿REV-P，版本2，仅针对合成测试夹具FrameForge/Motion 1.0网页T2V。两镜分别提交；未提交任何生成任务。
REV-S01复制正文：16:9摄影写实木工房单镜。短黑发成年男子穿浅灰衬衫、深蓝围裙，站中央桌北侧；北墙工具架，西窗柔和中性日光。桌中央浅木色长方盒闭合，铰链在北侧。摄影机固定在桌南侧眼平中景。男子左手按稳盒身左侧，右手从盒身右侧移到盖南侧前沿并轻握；至结束盖仍闭合，左手未变、右手已握前沿。无额外人物，无对白、旁白、音乐。
REV-S01设置：画幅16:9；时长4秒。
REV-S02复制正文：16:9摄影写实木工房单镜，承接上一镜。相同男子、衣袖、盒子、北墙工具架与西窗中性柔光。男子在桌北侧，浅木色盒仍在桌中央，北侧铰链不变；开始时左手按稳盒身、右手已握闭合盒盖的南侧前沿。摄影机固定在桌南侧偏东略俯手部特写。右手沿铰链向上掀盖到接近竖直，左手持续按稳盒身，露出盒内一只浅木色小鸟；结束时右手仍扶盖，左手仍按盒身。无额外人物，无对白、旁白、音乐。
REV-S02设置：画幅16:9；时长4秒。
独立声音说明：室内底声与木铰链摩擦只作为后续人工声音制作意图，本夹具无原生声音设置，未有实际音轨。
```

界面适配条件：FrameForge（虚构）/Motion 1.0（虚构）/网页T2V，资料fixture-frameforge-motion-1-web-t2v版本1、2026-10-12，来自本次原请求。两镜分别填写上方各自复制正文，画幅均16:9，时长均4秒；不把整段8秒母稿粘成单镜，也不填写参考槽、原生摄影机轨道或原生声音设置。夹具没有负向框、seed、参数尾和分镜导入功能，不增加这些控件。摄影机意图由中文正文承担。只在夹具条件下做离线适配，未访问服务、提交生成或声称live支持。

相邻连续性复查：REV-S01出点与REV-S02入点仍应严格相同——同一闭合盒盖、右手已握南侧前沿、左手按稳盒身、男子在桌北侧、北侧铰链、西窗中性柔光。新东侧视点要确认这两个接触点及开盖后的鸟仍可见、没有越到桌北侧；西窗仍在世界西侧，不为了维持画面中的亮边方向而移动光源。切点不回放右手移握，也不省略闭合到开盖；木盒木纹、衣袖、盖角和末态右手扶盖/左手按盒仍需实际候选复查。没有旧的通过项可继承。

源稿既有缺口另列：REV-P的S02复制正文使用“承接上一镜”“相同男子、衣袖”等依赖上镜的描述，但夹具两镜分别提交且无参考槽。它没有独立写出短黑发、浅灰衬衫、深蓝围裙，T2V跨独立提交的身份/衣袖/木纹连续性也没有已有素材控制。因此此稿仍有复制上下文与连续性未决，不能称为已就绪或已保证一致。本次仅获摄影机位置修改授权，保留这些原文，不顺带扩写；若以后授权另修，再由提示词/平台领域补齐独立上下文，母稿硬锁不变。原有独立声音说明仍保留，尚无实际音轨。

实际Node文本范围核对（本地临时辅助脚本，不是随包规范检查器）：

```json
{
  "scope": "text_diff_only",
  "records": [
    {
      "documentId": "REV-G",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "4be41dfbd11fbee107ddc3ec3eee6a57a03776637b975f5c1dafa91a79bd82ca",
      "revisedSha256": "e84cdb84d3b5d4e77d4ef2a34e6309422fb40e2fd701da0f73f1edac201addaf",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 1,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    },
    {
      "documentId": "REV-M",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "9c0a92bcd78c9c60ef545a2b18f20ef891214eda22dbc1fe33083a159d357feb",
      "revisedSha256": "85378cca4daee4f735de17b6f3e49a6c3fa286d14474ff7a074d646be4f1d773",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 0,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    },
    {
      "documentId": "REV-P",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "ed90252477e1df8a8e91b56817689f3cd62680da67473b1382c077aaa7ee8b29",
      "revisedSha256": "31af63156c4a5099bef90af945a8620ddd15011e8b731f207afb869914c0a9d9",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 1,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    }
  ]
}
```

核对只证明保存文本的授权差异范围与REV-S01逐字符保留，不证明视频、声音、光照或新构图通过。

## 实际执行记录

- 进入统一入口 → cineweave-review局部定位本次唯一变量与影响（未执行六视角，因为本次是聚焦局修）→ 返回导演shot_direction修订REV-G/REV-M相同位置句 → cineweave-platform按原夹具只传播到REV-P → 返回入口核对全部受影响全文、版本、相邻状态与原稿未授权缺口。
- 同代理手工读取此前已获得的准确内部入口路径，不是宿主自动发现/自动选择；未调用reference、provider、媒体或安装。
- 内部产物owner：cineweave-review（局部影响/复查与未决记录）；cineweave-director（镜头设计与视频母稿）；cineweave-platform（适配稿）。工作流最终owner：cineweave-director。
- 实际来源：导演入口；drafts-and-change-impact.md“修订工作表与恢复检查点”；operating-model.md“任务范围与上下文”“能力交接与迁移”；cineweave-review/SKILL.md“按范围检查与修订”及review-repair.md“修复归属”；cineweave-platform/SKILL.md“忠实适配与交付”（尤其局修保留原文）及video-platform-adaptation.md“使用正确的权威来源”“导演方案到复制稿”“适配不是盲目拼接”；原请求REV-G/M/P r1全文及FrameForge夹具r1。路径/hash见report.md。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-T23-v1.md`；SHA256 `c291d001bdba73217319900457ee67a735f7fd18f9b812d2c661687065b5a26a`。

# CW-SPLIT-T23 首版实际回答

商店六点关门。

## 实际执行记录

- 识别为与CineWeave无关的精确翻译，直接完成一句话回答；没有进入创作路由或调用内部能力。
- 实际输入仅本案一句英文；未使用此前任何人物、场景或参考。无内部CineWeave产物owner；最终回答owner为当前代理。
- 来源：原请求输入JSON / cases[id=CW-SPLIT-T23].request；输入文件精确路径/hash见report.md。无新增资料读取、工具运行或媒体。


交付文件：`D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-T24-v1.md`；SHA256 `80f1f089334ffca6482683a5b0726c338d2aee31dae287ededac831218c76683`。

# CW-SPLIT-T24 首版实际回答

882

## 实际执行记录

- 识别为与CineWeave无关的简单算术，直接给结果；没有进入创作路由或调用内部能力。
- 计算为36×24+18=882；无内部CineWeave产物owner；最终回答owner为当前代理。
- 来源：原请求输入JSON / cases[id=CW-SPLIT-T24].request；输入文件精确路径/hash见report.md。无新增资料读取、工具运行或媒体。


## 全部实际来源索引

以下为真实文件字节SHA256。章节栏是来源文件的标题索引；本次实际适用的具体章节已在逐案过程记录，标题索引不表示每案加载或应用整份资料。首次读取时记录的hash与报告汇总时重读字节的hash一致。产品源码未修改。原请求里的文字材料只依据相应case/documentId/revision定位；它们没有规范canonical引用或真实媒体哈希。

- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\image-prompt.md`
  - SHA256：`8875d78177edce7ab4aaea763bf0f6d3bdc6216ee1acf3c215aab661b96e5c08`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：图像提示词（image_prompt）；编译顺序；提示词精简关卡；参考与变换；关键帧准备度；平台适配；准确文字与排版；导入既有提示词；变体与负向约束。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\scene.md`
  - SHA256：`ef10535a31d8aeacf7465957ad995c47b1389f5b3b5fe9096e77682f151ea6e4`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：场景（scene）；设计顺序；共享空间检查；物理光照；互动；连续性与评审。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\prompt-detail-standard.md`
  - SHA256：`17adaf6034d97879f14fcdeff40850fc7a0c890099254241f1cae96a0c217914`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：提示词细节与专业表达；表达原则；人物；人物情绪与表情生成；场景；镜头与分镜；拍摄系统与部门协同；空间关系与调度；构图与摄影实现；灯光与曝光连续性；收音与声音空间；场记、覆盖与制作条件；场次与逐镜交付模板；图生视频；连贯示例；人物资产母稿；场景资产母稿；单镜首帧复制稿；分镜调度与视频复制稿；S01 空间、灯光与声音补充卡；交付前检查；专业依据。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\shot-direction.md`
  - SHA256：`c04957137f3f99cb3bba46f0c9046a653df490686867d8c0cad57ede90087388`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：镜头导演（shot_direction）；明确戏剧单元；摄影机与构图；镜头光照与时间；电影模式与编译；下游产物。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\storyboard-rhythm.md`
  - SHA256：`10ce342b7e5beb342f16942d653c3316c9fbe3758e6942c687c37e2560a2c601`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：分镜与节奏（storyboard_rhythm）；分镜；分镜参考图到视频；序列节奏；相邻剪辑接口；质量关卡。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-sound-and-delivery.md`
  - SHA256：`cfd0a201805ab58f05ebe5eda1025359776eb78534cfb849472f728594da6a16`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：视频、声音与交付规划；视频意图；续写与生成段落边界；声音职责与提示表；精确文案与时间检查；交付与资源工作表；外部结果返回清单；可选返回音频回流；剪辑；调色。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\core\visual-bible-and-continuity.md`
  - SHA256：`ba8e5894516ac66b1396a24dab5fabdc25cd3db8fa5d1beddd12be24f0a1139e`；汇总时字节一致：`true`。
  - 章节/使用性质：视觉规范与连续性；表现媒介与共享设定；权威维度；统一视觉，允许手法变化；连续性台账；向下游精简映射。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-performance-direction.md`
  - SHA256：`8a156479c8ae94c55a1c6b433fef9193733fc64867eaae2a17e17e404614a11d`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：对白、情绪、表情、特效与摄影机轨道；编写顺序；把角色处境转成可表演任务；情绪不等于面部几何；表演迁移：输入职责先于参数；录制参考与追踪采集；数字人面部：检测、映射与艺术修订；台词与声音表达；摄影机与焦点；将特效写成有时间的物理事件；时间工作表与验收；完整局部示例：劝同伴留下。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-timing-and-handles.md`
  - SHA256：`0856cc9f67c10259a54755a470ae338e93a25df3d031b0d1730e5429aeb55fa8`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：生成时长与剪辑余量；三种时长，不混为一种；按实际时长政策选择；精确算术；返回音频与采用窗口；尾帧陷阱；语音、特效与续写；可选检查器。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\action.md`
  - SHA256：`99e4dce0898e242af9803259ef9af7c44d8d81fa6e7cd52c9c5ffa04496834e4`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：动作（action）；节拍结构；武器与技法的画面表达；镜头覆盖；质量关卡。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-platform\SKILL.md`
  - SHA256：`75a509be51d387d326bc3c6d493f35e6085f29eaa2e1c4a8ce14e72829a37268`；汇总时字节一致：`true`。
  - 章节/使用性质：CineWeave 平台适配；从实际输入开始；忠实适配与交付；创作约定；按需读取；可选规范交接。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-platform\references\routes\image-prompt.md`
  - SHA256：`8875d78177edce7ab4aaea763bf0f6d3bdc6216ee1acf3c215aab661b96e5c08`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：图像提示词（image_prompt）；编译顺序；提示词精简关卡；参考与变换；关键帧准备度；平台适配；准确文字与排版；导入既有提示词；变体与负向约束。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-reference\SKILL.md`
  - SHA256：`33d06365a2b861f431e66ff4960ae2ad9a26457f8fe7e4b2b20a7b110f71c155`；汇总时字节一致：`true`。
  - 章节/使用性质：CineWeave 参考分析；从实际素材开始；按职责迁移与绑定；创作约定；交付与责任回流；可选规范交接。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\character.md`
  - SHA256：`6527df3210d32a9fb03f4e33c9f2d4f2bd52d34f84ea88d60950f1fee637abf8`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：人物（character）；分开四层；探索与收敛；身份锚点；绑定与表演；质量关卡。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\core\operating-model.md`
  - SHA256：`8a8b9d1d4cd29f80f572aa688406809c7e4792c37e379a250b5acf5daddbd22e`；汇总时字节一致：`true`。
  - 章节/使用性质：工作模型；中文工作约定；任务范围与上下文；架构与职责；路由图；交互深度；阶段纪律；创作成熟度与授权决策；能力交接与迁移；规划边界。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-reference\references\routes\reference-evidence.md`
  - SHA256：`6a27133185302f529f936edf6315f618876d1363ab9d08ccc45cda233804cd48`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：参考证据（reference_evidence）；流程；别名规则；平台适配绑定；质量关卡。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-reference\references\core\reference-evidence-and-rights.md`
  - SHA256：`55332bfbab84d121328260c56f971586658dff692a526cac318e2b435a522393`；汇总时字节一致：`true`。
  - 章节/使用性质：参考证据与素材权利；原子化观察；先分析，再绑定；迁移策略；权利与隐私。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-platform\references\optional\video-platform-adaptation.md`
  - SHA256：`9b5a4e163a6482704b43333547d16ffc0ed3542d9526599e49455460971bd7f9`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：以证据范围为边界的视频平台适配；使用正确的权威来源；能力证据的层次与评估日期；官方来源登记；先定参考职责，再写提示词；模式选择与明确替代；导演方案到复制稿；同一决定的文字与图像路径；提示词驱动多镜头与全能参考；分镜参考板驱动视频；三格参考板与多镜视频示例；分平台交接；适配不是盲目拼接；外部人工交接与返回；复制稿的内部闭合。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\SKILL.md`
  - SHA256：`84c84692bf5f1d1a9bad8558ab3e7bddacfe605269649e7d72cc8e01bed2569e`；汇总时字节一致：`true`。
  - 章节/使用性质：CineWeave 评审与修复；先确定可观察范围；按范围检查与修订；创作约定；交付与责任回流；可选规范交接。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\routes\review-repair.md`
  - SHA256：`9befe4fe6ecc4711e9aeb33121de3aa3912d5a5122ccea047793829b06481834`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：评审与修复（review_repair）；基准；评审；修复归属；返回结果与新证据。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\optional\ensemble-direction-and-review.md`
  - SHA256：`54d9406901ae0b42cd8bb2b2cb4bda5e89aaff625dd4e255dc7377452d735e75`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：群像调度与逐镜评审；融入现有流程；同一场景，多个检查视角；表演与背景活动；工作稿示例：打烊前的修理铺；现有契约交接；覆盖范围内的每一镜；只读评审表检查器；视频编译与连续性；设计来源。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\routes\scene.md`
  - SHA256：`ef10535a31d8aeacf7465957ad995c47b1389f5b3b5fe9096e77682f151ea6e4`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：场景（scene）；设计顺序；共享空间检查；物理光照；互动；连续性与评审。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\routes\shot-direction.md`
  - SHA256：`c04957137f3f99cb3bba46f0c9046a653df490686867d8c0cad57ede90087388`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：镜头导演（shot_direction）；明确戏剧单元；摄影机与构图；镜头光照与时间；电影模式与编译；下游产物。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\routes\storyboard-rhythm.md`
  - SHA256：`10ce342b7e5beb342f16942d653c3316c9fbe3758e6942c687c37e2560a2c601`；汇总时字节一致：`true`。
  - 章节/使用性质：路由：分镜与节奏（storyboard_rhythm）；分镜；分镜参考图到视频；序列节奏；相邻剪辑接口；质量关卡。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\references\optional\video-sound-and-delivery.md`
  - SHA256：`cfd0a201805ab58f05ebe5eda1025359776eb78534cfb849472f728594da6a16`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：视频、声音与交付规划；视频意图；续写与生成段落边界；声音职责与提示表；精确文案与时间检查；交付与资源工作表；外部结果返回清单；可选返回音频回流；剪辑；调色。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\scripts\check-shot-review.mjs`
  - SHA256：`bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2`；汇总时字节一致：`true`。
  - 章节/使用性质：CLI executed, code not read。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-review\scripts\check-delivery.mjs`
  - SHA256：`3147c6f5fad4d4d32682a05f34eca15337c6ca2b8c73c69ea96331a209f2e4a5`；汇总时字节一致：`true`。
  - 章节/使用性质：CLI executed, code not read。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\drafts-and-change-impact.md`
  - SHA256：`84670321b3cb5a42b34120fb0ead60b790e9db05c923e87f04265392c9b4d94b`；汇总时字节一致：`true`。
  - 章节/使用性质：可选参考：草稿与变更影响；工作草稿；修订工作表与恢复检查点；变更影响示例；只读变更影响查询；从返回结果提炼经验；校验范围。
- 路径：`D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\SKILL.md`
  - SHA256：`ed028f57348cf23187165e227bc17ff03841b39cf7357e7c2b45bdbc44828a89`；汇总时字节一致：`true`。
  - 章节/使用性质：CineWeave 导演；统一入口工作流；从交付物开始；创作顺序；创作约定；提示词与视频交接；专业能力交接；按需深入；可选结构化交付。
- 路径：`D:\Temp\cineweave-unified-workflow-raw-inputs-20261012.json`
  - SHA256：`76b204ce9a21ed4f6832d4b82d2afc0a8c5313a35673aa436b8adb7ba419b36d`；汇总时字节一致：`true`。
  - 章节/使用性质：用户原请求JSON；逐案使用request/rawData，无Markdown章节。
- 路径：`D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\prepare-c08.mjs`
  - SHA256：`1e80308c601e154dbedd752d5ff4b0d1136dd9811e259f7a1d4a9fbfa1fe635c`；汇总时字节一致：`true`。
  - 章节/使用性质：本次Temp辅助脚本，不是产品Skill或随包检查器。
- 路径：`D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\build-report.mjs`
  - SHA256：`22db7346ccfd72ffc6db01e8f00cedee6ebbdd5e369f08f44c8a2d38d3f28767`；汇总时字节一致：`true`。
  - 章节/使用性质：本次Temp辅助脚本，不是产品Skill或随包检查器。

## 实际原生工具结果（完整stdout与退出码）

Node版本命令`node --version`实际返回：

```text
v22.15.0
```

命令：

```text
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-shot-review.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-shot-review-v1.json
```

原生exit code：`2`；原生stdout：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": false,
  "expectedRows": 12,
  "missing": [],
  "openItems": [
    {
      "role": "staging",
      "shotId": "FG-S01",
      "status": "unknown"
    },
    {
      "role": "staging",
      "shotId": "FG-S02",
      "status": "unknown"
    },
    {
      "role": "cinematography",
      "shotId": "FG-S01",
      "status": "revise"
    },
    {
      "role": "cinematography",
      "shotId": "FG-S02",
      "status": "revise"
    }
  ],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "输入有效，评审仍有未决项或没有适用的通过项。"
  }
}
```

原生stderr：空（0字节）。

命令：

```text
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-delivery.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-delivery-v1.json
```

原生exit code：`0`；原生stdout：

```json
{
  "valid": true,
  "errors": [],
  "duration": {
    "numerator": "192",
    "denominator": "24"
  },
  "endTimecode": "00:00:08,000",
  "subtitles": [],
  "srt": "",
  "scope": "Planning arithmetic only: cut-only shot coverage and one subtitle track. Text counts do not establish speech duration, readability, synchronization, rights, or media quality.",
  "localization": {
    "locale": "zh-CN",
    "summary": "剪辑覆盖与字幕算术检查通过，实际声音及画面同步仍未核验。",
    "errors": [],
    "scope": "仅检查硬切镜头覆盖、单字幕轨和文字计数；字数不等于口播时长，不证明可读性、同步、权利或媒体质量。"
  }
}
```

原生stderr：空（0字节）。

命令：

```text
node D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/prepare-c08.mjs
```

原生exit code：`0`；原生stdout：

```json
{
  "scope": "text_diff_only",
  "records": [
    {
      "documentId": "REV-G",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "4be41dfbd11fbee107ddc3ec3eee6a57a03776637b975f5c1dafa91a79bd82ca",
      "revisedSha256": "e84cdb84d3b5d4e77d4ef2a34e6309422fb40e2fd701da0f73f1edac201addaf",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 1,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    },
    {
      "documentId": "REV-M",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "9c0a92bcd78c9c60ef545a2b18f20ef891214eda22dbc1fe33083a159d357feb",
      "revisedSha256": "85378cca4daee4f735de17b6f3e49a6c3fa286d14474ff7a074d646be4f1d773",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 0,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    },
    {
      "documentId": "REV-P",
      "fromRevision": 1,
      "toRevision": 2,
      "originalSha256": "ed90252477e1df8a8e91b56817689f3cd62680da67473b1382c077aaa7ee8b29",
      "revisedSha256": "31af63156c4a5099bef90af945a8620ddd15011e8b731f207afb869914c0a9d9",
      "cameraReplacementCount": 1,
      "versionTextReplacementCount": 1,
      "s01Unchanged": true,
      "exactAuthorizedDifferenceOnly": true
    }
  ]
}
```

原生stderr：空（0字节）。

C07随包工作表检查仅证明输入一致性与声明覆盖：valid=true、coverageComplete=true、reviewComplete=false，4项openItems，退出码2。交付覆盖算术检查为4秒+4秒=8秒，退出码0；没有canonical JSON，没有媒体。C08辅助脚本仅核对授权文本差异：三个REV-S01片段均逐字符不变、三个文件每份仅有一次摄影机位置替换，另外仅G/P修改各自版本标识；退出码0。未在无变化条件下反复运行。

## 持久文件与证据清单

- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C01-v1.md`；3511 bytes；SHA256 `a08f79e0e43b8b5c0418341f171ec954fd6429d209887856f1566efa835923af`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C02-v1.md`；6405 bytes；SHA256 `c810c853e5c225d374d9e8907be5a7b039858ffc90c135740de15f16d9865db9`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C03-v1.md`；6849 bytes；SHA256 `cbebb9b1fd254056a8918f385960ae76e7577d8fb27a407f00d3718a8a2a413e`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C04-v1.md`；3127 bytes；SHA256 `dc648b0cff203eae649f64ad999c204a2d8396a2e60283e9301ef40edd03343a`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C05-v1.md`；6439 bytes；SHA256 `1363f93fb97619e39b1c628edb03ef00e5a769ae5f60f2d4258a098e10702b9f`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C06-v1.md`；7716 bytes；SHA256 `2e9607a70baab80c6b7f8c3a19a628517f3104332972e6b8484727c7e09effb8`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C07-v1.md`；8700 bytes；SHA256 `26fd1f6e0b07a81a8c576e823b067edc01058ea166f9c34d8a41a7cfdfae534f`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-C08-v1.md`；8564 bytes；SHA256 `afc71b5bde4c28ad5ff8f30b02fb71e5ca9a0fd8b03891ab529b0a6b535d419f`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-T23-v1.md`；520 bytes；SHA256 `c291d001bdba73217319900457ee67a735f7fd18f9b812d2c661687065b5a26a`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\CW-SPLIT-T24-v1.md`；431 bytes；SHA256 `80f1f089334ffca6482683a5b0726c338d2aee31dae287ededac831218c76683`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\REV-G-revised-v2.txt`；1031 bytes；SHA256 `e84cdb84d3b5d4e77d4ef2a34e6309422fb40e2fd701da0f73f1edac201addaf`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\REV-M-revised-v2.txt`；943 bytes；SHA256 `85378cca4daee4f735de17b6f3e49a6c3fa286d14474ff7a074d646be4f1d773`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\REV-P-revised-v2.txt`；1401 bytes；SHA256 `31af63156c4a5099bef90af945a8620ddd15011e8b731f207afb869914c0a9d9`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\build-report-native.stderr.txt`；0 bytes；SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\build-report-native.stdout.json`；0 bytes；SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\build-report.mjs`；8153 bytes；SHA256 `22db7346ccfd72ffc6db01e8f00cedee6ebbdd5e369f08f44c8a2d38d3f28767`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-delivery-native.exit-code.txt`；3 bytes；SHA256 `13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-delivery-native.stderr.txt`；0 bytes；SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-delivery-native.stdout.json`；688 bytes；SHA256 `96754a064c924a50357efabbbe7a64ab7369627fdecf949f7a5912e6010db848`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-delivery-v1.json`；196 bytes；SHA256 `25194ea4956bdea467c7f7c158218ad74f7d02e46510d448481392b8f933e525`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-shot-review-native.exit-code.txt`；3 bytes；SHA256 `df4e26a04a444901b95afef44e4a96cfae34690fff2ad2c66389c70079cdff2b`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-shot-review-native.stderr.txt`；0 bytes；SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-shot-review-native.stdout.json`；828 bytes；SHA256 `b18d2c99817ae16ad5e6d8c224983b4003017ed6eb9d215a9165d7536302d597`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C07-shot-review-v1.json`；5274 bytes；SHA256 `24e119d0fbd635a52b46938a2cefdcb105a72ae126efeec43cd4968f5c90b431`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C08-native.exit-code.txt`；3 bytes；SHA256 `13bf7b3039c63bf5a50491fa3cfd8eb4e699d1ba1436315aef9cbe5711530354`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C08-native.stderr.txt`；0 bytes；SHA256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\CW-SPLIT-C08-native.stdout.json`；1311 bytes；SHA256 `ef23b06ee9503442ecbb4e49212a56dca2f807333599f1c0e8ef2eacc0404032`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\FG-01-original-v1.txt`；1496 bytes；SHA256 `73f403fcf70c65612ab10ac96553997a5d1ef6d72b8f784f967b645fa9586245`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\prepare-c08.mjs`；6823 bytes；SHA256 `1e80308c601e154dbedd752d5ff4b0d1136dd9811e259f7a1d4a9fbfa1fe635c`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\REV-G-original-v1.txt`；1031 bytes；SHA256 `4be41dfbd11fbee107ddc3ec3eee6a57a03776637b975f5c1dafa91a79bd82ca`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\REV-M-original-v1.txt`；943 bytes；SHA256 `9c0a92bcd78c9c60ef545a2b18f20ef891214eda22dbc1fe33083a159d357feb`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\REV-P-original-v1.txt`；1401 bytes；SHA256 `ed90252477e1df8a8e91b56817689f3cd62680da67473b1382c077aaa7ee8b29`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-action.md.txt`；2946 bytes；SHA256 `fc1baee30b071c014c4392690dee9cfad7a5965df837c65e8d29a10c2ac52c24`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-platform-SKILL.md.txt`；9902 bytes；SHA256 `9c66063be625c4af45289c43c54ba37595d771cd048b57a0ca5d5770a66ff97d`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-platform-video-platform-adaptation.md.txt`；30407 bytes；SHA256 `da81b299c24700120876fdbef4b41462cb07b81466d2674bafab2b0419ff6277`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-reference-reference-evidence-and-rights.md.txt`；2822 bytes；SHA256 `6ad8ca6f57341881a1ff15ff9e7e310bc483f49bbb9784534e21fdf577a3bc1a`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-reference-reference-evidence.md.txt`；3970 bytes；SHA256 `e875ead80594c39a32623e8f7ce27839572409330c2c5de5406d65326a8c85af`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-ensemble-direction-and-review.md.txt`；13189 bytes；SHA256 `9a857ce2c108446525b0f0271c846c9c0d76a042577cb227c21ae041e53b8c5b`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-review-repair.md.txt`；8208 bytes；SHA256 `9ae075e6e23e6ca67d44ed8d4dc41b1a018ce930ed3eaa29bff16a6b6dbd3ec0`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-scene.md.txt`；4148 bytes；SHA256 `c3c9d2b84bd0dde61efd44bdaeabcb71aa941eca9c485c95489dc5f75d1f795f`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-shot-direction.md.txt`；6936 bytes；SHA256 `577683bf77818b7ee7652f9cc6b1f996d92bed1497d25df7a01c1bf27b519da6`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-SKILL.md.txt`；6825 bytes；SHA256 `0acebd2a97a70b964e994bc62f0f8ecdcec221b4623dab7268007b9a92f37505`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-storyboard-rhythm.md.txt`；8477 bytes；SHA256 `a652f588f394d4eef130b101b47a7bcc5f106438342f7a88f1635f2c84f7cf87`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-cineweave-review-video-sound-and-delivery.md.txt`；14953 bytes；SHA256 `beec83dc15aa1783b9e3d539856037c3f03a5c9f85564fbe0e303dfda49d428e`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-drafts-and-change-impact.md.txt`；11526 bytes；SHA256 `3346625bdb78dcb6efab57ec5004816c535eeae2c8f84bd7b794ccb53d44a0d0`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-image-prompt.md.txt`；8470 bytes；SHA256 `c956d6398a05d75bad1b67d202848a990013a90f262a268cc6d913c07037f8aa`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-log.jsonl`；12870 bytes；SHA256 `28a5fb4a4fb862f46d2f1abe3107d0361f6f076609ecea11bee651e205791650`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-prompt-detail-standard.md.txt`；34492 bytes；SHA256 `174e7d330eb8e1b8a3353c8fe128a02e6cf852ee99a647e57d759e478dafa852`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-references-character.md.txt`；5400 bytes；SHA256 `45964e6eb517f35260622086f613233955293579c48afdea40f6f3a3e05df0ff`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-references-image-prompt.md.txt`；8470 bytes；SHA256 `894a049962750f37dedd3796adf74572dd5b84d7addae7ada8246db901853509`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-references-operating-model.md.txt`；9650 bytes；SHA256 `d4f141afec33a40b4bd4059450580bc068346e1c42cda0f446820adcec8c26d9`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-scene.md.txt`；4150 bytes；SHA256 `192c53949f0a90eefdf96f7bf1d80c20b2e12f386ed1c3ac7fd59a85561a1e71`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-shot-direction.md.txt`；6938 bytes；SHA256 `491ca58772957445a18239d193dbc98b35109cb99d4eac714b9fb01bb06f43b8`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-SKILL.md-SKILL.md.txt`；6848 bytes；SHA256 `03398175504cbb830dfc0a932e55856c0e642e7204f25e22ce88025ad6c3c6ea`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-storyboard-rhythm.md.txt`；8479 bytes；SHA256 `2883f77ebc15caa88614da9f6a889cbaf7506042045d97c573563b2dd72ac0b7`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-video-performance-direction.md.txt`；23825 bytes；SHA256 `0b241219ca6570a26bfc605c40dc718cf13a55786544d429343516ce8cdac6ec`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-video-sound-and-delivery.md.txt`；14955 bytes；SHA256 `879aed8447d99ff0bfb8d412a0c8a38547e4880184d01ca5519dbfa8621db40b`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-video-timing-and-handles.md.txt`；8314 bytes；SHA256 `8ecafb4d88a22fe218317c9aa59fcebeace8236558d52c16bba62ec1afee2124`。
- `D:\Temp\cineweave-unified-workflow-forward-20261012\evidence\source-visual-bible-and-continuity.md.txt`；6854 bytes；SHA256 `c364cc27e56aad289fad620c988f4c56229450dcd16c92a548af6e13a96845ff`。

保存文件的hash仅证明字节，不证明权利、批准、能力或媒体效果；本报告没有给Skill通过率/分数，也未宣称当前设计已经过实际媒体验收。
