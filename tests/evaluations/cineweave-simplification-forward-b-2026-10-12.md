# CineWeave 新版 Skill 实际文字前向试跑 B

日期：2026-10-12。产品源码根目录：`D:\study\projects\cineweave-codex-skills\cineweave-director`。临时证据目录：`D:\Temp\cineweave-simplify-forward-b-20261012`。

本报告完整嵌入两条独立请求、所有实际回答版本、人工评审、工作表全文和检查器输出；只读产品源码，不查看既有 tests/evaluations 输出，不安装或调用生成供应商。报告与临时证据是本次新写出的记录。

两条请求隔离原创内容：请求 1 是阿夏、深绿色夹克、浅灰房间与左后窗的普通草稿；请求 2 仅继承其本次用户事实，另建林岚、白衬衣、米色工作间、右后高窗、桌左短边抽屉与左前通道的空间基线。两案可复用 Skill 方法，未带入彼此的人物、场景、光源、素材或批准状态。

普通两镜草稿按相关维度人工检查，不建立六视角工作表，也没有假称运行检查器。正式综合设计／提示词评审执行六视角 × 两镜：原稿工作表原生退出码 2；修正版首候选仍因领口措辞有 3 个未决行而退出 2；只修这一外观措辞后，最终工作表原生退出码 0。三个工作表始终为 `plan_only`，覆盖完整不等于观察到媒体。

## 请求 1

### 用户请求全文

```text
先给我两个连续镜头的草稿，每镜 4 秒，完整中文视频复制稿即可。阿夏穿深绿色夹克，右手拿钥匙，从画面左侧走到中间木桌前放下钥匙；第二镜沿同一侧机位看他打开桌上抽屉。台词不要加，镜号用 S01 和 S02，其他细节由你定。
```

### 实际首版回答全文：response-1-v1.md

补充设计采用写实室内日景；木桌抽屉朝向摄影机这一侧。下列两镜共 8 秒，直接硬切衔接。

```text
S01｜4 秒
16:9 横向写实视频。阿夏是一名约三十岁的成年男性，短黑发，面部无胡须，神情平静专注；穿无纹样的深绿色哑光棉质夹克，拉链敞开，内搭浅灰圆领衫，下穿深色长裤。浅灰墙面的安静小房间里，一张浅棕色长方形木桌固定在画面中间，桌面保留细木纹，桌上没有其他物品；靠摄影机的长边中央有一个关闭的木抽屉，配横向木拉手。桌左后方的窗户提供柔和日光，右侧浅墙形成弱反光，皮肤、绿夹克和桌面木纹保持可读，金属钥匙只有小范围反亮。
摄影机位于木桌前方偏右，低于阿夏眼睛高度、略向下看桌面，固定三分之四侧面中全景；从头顶到小腿上部入画，桌面、抽屉正面和画面左侧的行走空间同时保留，头顶留少量空隙。视角自然，桌子不出现夸张近大远小，阿夏的脸、右手和桌面接触区域均清楚，背景稍柔化；全段不移动、不摇摄、不变焦、不改变焦点目标。
0 至 1.8 秒，阿夏从画面左侧自然走向中间木桌，约两步靠近桌子前侧偏左的位置；右手拇指与食指夹着一枚银色钥匙的匙柄，匙齿朝下，左手空着随步伐轻摆。他先看桌面的中央空位，脚掌交替承重，夹克下摆随步伐轻微摆动。1.8 至 2.4 秒，他在抽屉拉手左侧站定，身体朝木桌，右肩稍向桌面转开；右手从身侧抬起，手腕保持自然，伸向桌面中央。2.4 至 3.2 秒，右手降低钥匙，让金属匙身先接触木面，再松开拇指与食指；钥匙完全离手后平放在桌面中央，匙齿指向画面右侧，静止不滑动。3.2 至 4 秒，右手空着，从钥匙上方收回到桌沿外侧，停在抽屉拉手上方约一掌的位置；左手空着垂在身体左侧，双脚仍在桌前偏左的位置，视线从钥匙移向抽屉拉手，嘴唇自然闭合，不说话。出点时抽屉仍关闭，钥匙留在桌面中央，桌子位置不变。
声音意图：安静、连续的室内底声；前段两步轻脚步和少量夹克摩擦；钥匙实际触到木面时出现一次短而轻的金属落木声，随后自然衰减。无台词、旁白、字幕和音乐，无新增人物。

S02｜4 秒
16:9 横向写实视频。阿夏是一名约三十岁的成年男性，短黑发，面部无胡须，神情平静专注；穿无纹样的深绿色哑光棉质夹克，拉链敞开，内搭浅灰圆领衫，下穿深色长裤。他已站在浅棕色长方形木桌前侧偏左的位置，双脚不移动，身体朝木桌。桌面中央静放着一枚银色钥匙，匙齿指向画面右侧；靠摄影机的长边中央有一个关闭的木抽屉，配横向木拉手。右手空着，停在桌沿外侧、抽屉拉手上方约一掌的位置；左手空着垂在身体左侧。浅灰墙面与桌左后方的窗户保持原位置，柔和日光从窗侧照来，右侧浅墙提供弱反光，夹克颜色、桌面木纹及金属钥匙的反亮连续不变。
摄影机沿用木桌前方偏右的同侧视点、机位高度和轻微向下的观察角度，在切镜时采用更紧的中景构图：从阿夏胸口下缘到大腿上部入画，完整保留双手、桌面中央钥匙、抽屉拉手和抽屉的打开空间。人物身体处于画面左侧，抽屉正面处于中间偏右，右手的接触点不被躯干遮住；焦点保护右手、拉手、钥匙与木纹，不做焦点转移，全段固定机位，无推拉摇移与环绕。
这一切镜继续同一时间顺序，不重演放钥匙，也不省略走位。0 至 0.8 秒，阿夏空着的右手从拉手上方继续向下，四指扣入横向拉手后方，拇指扶在拉手上缘；左手始终空着，钥匙仍静放在桌面中央。0.8 至 2.8 秒，右手握住拉手，肘部向身体方向收回，将抽屉沿导轨朝自己缓慢拉出约十五厘米；抽屉与木桌保持正确连接，桌腿与桌身不移动，身体只做轻微重心调整，双脚仍留在原地。2.8 至 4 秒，抽屉停在已拉出的状态，右手仍握拉手，左手垂在身体左侧；钥匙位置与朝向保持不变。画面读得出打开的抽屉口与空的内腔，不添加抽屉中的新物品，不安排拿起钥匙或合上抽屉。
声音意图：延续前一镜的同一室内底声；右手握拉手时有轻微衣料摩擦，抽屉实际滑动时出现低而短的木导轨摩擦声，停下后自然衰减。无台词、旁白、字幕和音乐，无新增人物。全段保护右手握持连续、钥匙静止、抽屉单次打开和木桌固定，避免钥匙换手、复制钥匙、手指穿过拉手或摄影机越轴。
```

### 首版人工检查全文

# 请求 1 首版人工检查

- 路由：shot_direction + storyboard_rhythm；普通局部草稿，不触发正式六视角工作表。
- 硬锁核对：S01/S02 镜号保留；各 4 秒；阿夏深绿色夹克；S01 从画面左侧走向中间木桌，钥匙由右手持有并放下；S02 同侧机位打开抽屉；不添加台词。
- 接触与可达性：人物在桌前偏左的位置，以右手放桌面中央钥匙；S01 明示匙身触木再松指；S02 空右手先扣住拉手再向身体方向拉出抽屉；桌子固定。
- 连续性：S01 出态与 S02 入态一致，钥匙桌面中央、匙齿画面右、右手空、抽屉关闭、人物桌前偏左、左手空。接口为顺序继续，不重复放钥匙，不隐藏换位。
- 画面与声音：两镜同窗光、同声场；S02 更紧构图仍从同侧看接触；拟音只随实际接触发生。
- 时长：两镜的动作设计均覆盖完整 4 秒；硬切采用无需额外生成余量。未规定供应商档位、采集帧率或返回时长。
- 限制：这是文字设计人工检查，未生成、查看或听审图像、视频、音频；手部、身份、物理运动与切点效果未获媒体验证。
- 首版没有因检查发现问题而另存修订版。

没有请求 1 的工作表或修订版。用户未要求 JSON／正式系统交接，因此未加载 contracts.json、未编造契约元数据。

## 请求 2

### 用户请求全文

```text
独立新项目，请对下列两镜做完整的综合设计和提示词评审，修正后作为完整场次定稿给我可复制稿。锁定：人物林岚白衬衣，钥匙始终由右手操控，木桌不能移动；不加台词。现稿 scene-lock-v1：S01，4 秒，人物在桌左侧，右手放下钥匙，钥匙停在桌面中央；S02，4 秒，同一侧机位，人物在桌右侧，左手拿着钥匙拉开抽屉，摄影机穿过桌子到正面。保留镜号，空间细节可自行补齐。
```

### 用户原稿保留全文：scene-lock-v1-source.txt

```text
scene-lock-v1
锁定：人物林岚白衬衣，钥匙始终由右手操控，木桌不能移动；不加台词。
S01，4 秒，人物在桌左侧，右手放下钥匙，钥匙停在桌面中央。
S02，4 秒，同一侧机位，人物在桌右侧，左手拿着钥匙拉开抽屉，摄影机穿过桌子到正面。
```

### 实际首版回答全文：response-2-v1.md

原稿 `scene-lock-v1` 有三处需要修正：S02 未交代人物从桌左侧到右侧的移动；左手持钥匙违反右手操控硬锁，且缺少从桌面取回钥匙的过程；摄影机穿过实体木桌，无法保持合理的同侧空间。修正版采用工作版本 `scene-lock-v2`，保留 S01、S02 和各 4 秒，不添加台词。

补充空间与造型均为本项目的新设计：林岚为成年人物，短黑发、自然素颜，穿白色棉质长袖衬衣与深灰长裤。场景是米色墙面的整洁工作间，下午柔和天光来自桌右后方的高窗。固定木桌约长 0.8 米、宽 0.5 米、高 0.72 米；尺寸是设计值。以桌面中央为锚点，左右沿桌长边，前方朝摄影机所在的通道。林岚站在桌左端偏后、靠近左后角的位置，身体朝桌中央，轻微前倾即可让右手够到中心；左短边的抽屉向左打开，林岚的双脚及躯干处于抽屉轨迹后侧，留出拉开空间。摄影机在桌左前方通道，能够同时看见桌面、左短边抽屉与右手，不穿过任何实体。

六视角逐镜复查覆盖导演、表演、调度、摄影、提示词和连续性。以下定稿在文字设计层面承接了位置、右手、钥匙和抽屉状态；尚无实际视频或声音，手部、动作完成时间、光色和切点效果仍需生成后检查。视频采用通用文字交接，声音单独作为制作意图，不假定任何模型已支持同步声音。

```text
scene-lock-v2｜连续场次｜总采用时长 8 秒｜S01、S02 各 4 秒
写实室内日景，16:9 横向画面，不添加台词、旁白、字幕或音乐。两镜按同一时间顺序硬切，第二镜继续第一镜结束后的动作，不重演放钥匙，不省略人物换位或取钥匙。全部空间尺寸为暂定设计值。当前只有文字稿，无已生成媒体或已存在的参考图。

S01｜4 秒｜右手放下钥匙
林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，面部保留正常肌肤纹理；白色无纹样棉质长袖衬衣扣至领口下方一颗纽扣，袖口闭合在腕部，布料有轻微自然褶皱，下穿深灰直筒长裤。神情平静专注，双唇自然闭合，肩颈放松，视线明确落在桌面中央的放置点，不看摄影机。米色墙面的整洁工作间内，一张浅色长方形木桌固定在原位，约长 0.8 米、宽 0.5 米、高 0.72 米，哑光桌面有连续细木纹，桌腿稳定着地，桌面无其他物品。木桌左短边中央是关闭的浅木抽屉，横向木拉手朝左；抽屉打开方向是朝桌左端外侧。林岚站在桌左端偏后、接近左后角的位置，双脚留在抽屉向左滑出的轨迹后侧，身体朝桌中央；右手拇指和食指夹住一枚银色钥匙的圆形匙柄，钥匙在左端桌沿上方，左手空着垂在身体左侧。钥匙、人物和抽屉的位置从这一初态开始保持明确。
摄影机位于木桌左前方的空通道，约胸口以下的高度，略向下观察；固定三分之四侧面中景，从林岚头顶到大腿上部入画，桌面中央、右手、左端拉手和抽屉外侧的空通道均保留，人物与桌面之间不加遮挡物。头顶留少量空隙，手臂向中心伸出的路径在画面内，视角自然，不用夸张广角拉伸木桌。林岚位于画面左侧，桌面延向画面右侧；焦点使面部、右手、匙身与桌面接触区域都可辨认，背景适度柔化。摄影机全段固定，不推轨、不穿桌、不摇摄、不变焦、不换轴线侧，不做焦点转移。
0 至 0.8 秒，林岚看准桌面中央，右手持钥匙从左端桌沿上方伸向中央；肘部自然展开，躯干只做小幅前倾，双脚承担重量并留在原位，左手不参与。0.8 至 2.4 秒，右手缓慢降低钥匙，腕部转到便于匙身平放的角度；金属匙身实际碰到桌面后，拇指与食指才松开匙柄。钥匙在桌面中央完全平放，匙齿沿桌长边指向桌右端，不跳动、不滑走。2.4 至 3.2 秒，右手空着向桌左端收回，避开钥匙，停在关闭抽屉的拉手上方；躯干回到直立，左手仍空着。3.2 至 4 秒，视线从静置钥匙移向左端抽屉拉手，保持克制、无额外表情变化。出点时人物仍在桌左端偏后，右手空且在拉手上方，左手空，钥匙静置于桌面中央、匙齿朝桌右端，抽屉关闭，木桌完全不动。这段短停留用于读清放置结果与下一动作目标。
光照：桌右后方高窗的柔和下午天光固定不变，右后侧白色衬衣有柔和明暗层次，左前侧米色墙提供弱反光；皮肤不过度磨平，衬衣不变为透明材质，桌面木纹清楚，匙身只有小范围金属反亮。手臂在同一光源下移动，手与木面接触时出现合理的小范围接触阴影，不增加闪光或动态光源。
声音制作意图：全镜持续低声级工作间底声，安静、短混响；右臂动作伴随少量干燥棉布摩擦；金属钥匙真正接触木面时出现一次轻而短的金属落木声，放稳后声响自然衰减。没有脚步、台词、旁白或音乐。拟音必须跟实际接触同步，不提前替代动作。

S02｜4 秒｜空右手打开抽屉
林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，正常肌肤纹理；穿白色无纹样棉质长袖衬衣，领口下方一颗纽扣解开、袖口闭合在腕部，布料保留自然褶皱，下穿深灰直筒长裤。米色墙面的整洁工作间内，浅色长方形木桌约长 0.8 米、宽 0.5 米、高 0.72 米，固定在原位，桌腿稳定着地。左短边中央的浅木抽屉仍关闭，横向木拉手朝左；桌面中央静置一枚银色钥匙，匙齿沿桌长边指向桌右端，桌面无其他物品。林岚仍站在桌左端偏后、靠近左后角的位置，身体朝木桌，双脚及躯干在抽屉打开轨迹的后侧。右手空着，位于拉手上方；左手空着垂在身体左侧，始终不接触钥匙。神情平静专注，嘴唇自然闭合，注意力在抽屉拉手和即将露出的内腔，不看摄影机。
摄影机保持木桌左前方的同一侧视点、胸口以下的高度与略向下的角度。切镜采用更紧的中景，从林岚肩膀上方到大腿上部入画，同时保留右手、桌面中央钥匙、抽屉正面、打开轨迹及人物与抽屉之间的空隙；关键接触不被身体、袖口或桌沿遮住。固定机位，视角自然，焦点同时保护手指、拉手、桌面钥匙和抽屉开口；全段不推拉摇移、不穿桌、不越轴、不改变物理光源。桌右后方高窗的柔和天光与左前侧米色墙的弱反光持续，白衬衣、肤质、木纹和金属反亮与前镜一致。
切镜是继续同一时间顺序：钥匙已经由右手放好并松开，人物没有走到桌右侧，也没有重新拿钥匙。0 至 0.9 秒，林岚空右手从拉手上方降低，四指扣到横向木拉手后方，拇指扶在上缘；先形成清楚的握持，左手仍空着。0.9 至 2.9 秒，右手肘部收回，将抽屉沿原有导轨朝桌左端外侧拉出约十二厘米；手与拉手持续接触，抽屉只沿导轨直线移动，不脱轨、不穿过人物、不带动木桌。林岚在脚下支撑稳定的前提下轻微调整上身，双脚不换位，钥匙全段留在桌面中央。2.9 至 4 秒，抽屉在已打开的位置停下，右手仍握拉手，左手垂在身体左侧；抽屉口和空内腔清楚显露，林岚低头看向内腔，视线转移由抽屉显露触发。出点保留打开结果：人物桌左端偏后，右手握拉手，左手空，钥匙桌面中央且匙齿朝桌右端，抽屉拉出约十二厘米，木桌原位不动。不增加抽屉中的物件，不拿起钥匙，不合上抽屉。
声音制作意图：延续同一工作间底声与短混响，不在切点突然静音；握拉手时少量白衬衣袖口摩擦，抽屉真正开始移动后出现轻而低的木导轨滑动声，停下时轻微木质顿止声随后自然衰减。没有脚步、台词、旁白或音乐。所有近处声响以实际手部接触、抽屉起动和停止为同步锚点。
两镜约束：人物身份和白衬衣稳定；钥匙仅由右手放置，放置后始终静留桌面中央，左手不持钥匙；右手先握拉手再施力开抽屉；木桌不移动；不新增或复制钥匙；手指不穿拉手；不添加换位、对白、字幕、器材、人员、特效或新的光源。每镜 4 秒为成片采用设计，采用完整动作与结果，硬切不另加剪辑余量；供应商提交档位和实际返回长度尚未确定。
```

### 首版之后发现的真实问题与单变量修订

人工复查发现：S01 写“扣至领口下方一颗纽扣”，没有明确这一颗扣上还是解开；S02 写“领口下方一颗纽扣解开”。这个措辞不能给场记唯一的闭合状态。该问题不是检查器自动理解原文的结果，而是人工评审录入工作表的真实未决项。检查器据这些行返回 2。

修订仅将这一个人物外观变量在两镜统一为“领口下方一颗纽扣解开，其余纽扣闭合”；源工作版本由 scene-lock-v2 递增为 scene-lock-v3。所有旧文件保留，没有覆盖首版。

### 实际修订回答全文：response-2-v2.md

补充复查仅统一了两镜白衬衣领口的闭合措辞：领口下方一颗纽扣解开，其余纽扣闭合。首版及其评审仍保留。

原稿 `scene-lock-v1` 有三处需要修正：S02 未交代人物从桌左侧到右侧的移动；左手持钥匙违反右手操控硬锁，且缺少从桌面取回钥匙的过程；摄影机穿过实体木桌，无法保持合理的同侧空间。修正版采用工作版本 `scene-lock-v3`，保留 S01、S02 和各 4 秒，不添加台词。

补充空间与造型均为本项目的新设计：林岚为成年人物，短黑发、自然素颜，穿白色棉质长袖衬衣与深灰长裤。场景是米色墙面的整洁工作间，下午柔和天光来自桌右后方的高窗。固定木桌约长 0.8 米、宽 0.5 米、高 0.72 米；尺寸是设计值。以桌面中央为锚点，左右沿桌长边，前方朝摄影机所在的通道。林岚站在桌左端偏后、靠近左后角的位置，身体朝桌中央，轻微前倾即可让右手够到中心；左短边的抽屉向左打开，林岚的双脚及躯干处于抽屉轨迹后侧，留出拉开空间。摄影机在桌左前方通道，能够同时看见桌面、左短边抽屉与右手，不穿过任何实体。

六视角逐镜复查覆盖导演、表演、调度、摄影、提示词和连续性。以下定稿在文字设计层面承接了位置、右手、钥匙和抽屉状态；尚无实际视频或声音，手部、动作完成时间、光色和切点效果仍需生成后检查。视频采用通用文字交接，声音单独作为制作意图，不假定任何模型已支持同步声音。

```text
scene-lock-v3｜连续场次｜总采用时长 8 秒｜S01、S02 各 4 秒
写实室内日景，16:9 横向画面，不添加台词、旁白、字幕或音乐。两镜按同一时间顺序硬切，第二镜继续第一镜结束后的动作，不重演放钥匙，不省略人物换位或取钥匙。全部空间尺寸为暂定设计值。当前只有文字稿，无已生成媒体或已存在的参考图。

S01｜4 秒｜右手放下钥匙
林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，面部保留正常肌肤纹理；白色无纹样棉质长袖衬衣领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部，布料有轻微自然褶皱，下穿深灰直筒长裤。神情平静专注，双唇自然闭合，肩颈放松，视线明确落在桌面中央的放置点，不看摄影机。米色墙面的整洁工作间内，一张浅色长方形木桌固定在原位，约长 0.8 米、宽 0.5 米、高 0.72 米，哑光桌面有连续细木纹，桌腿稳定着地，桌面无其他物品。木桌左短边中央是关闭的浅木抽屉，横向木拉手朝左；抽屉打开方向是朝桌左端外侧。林岚站在桌左端偏后、接近左后角的位置，双脚留在抽屉向左滑出的轨迹后侧，身体朝桌中央；右手拇指和食指夹住一枚银色钥匙的圆形匙柄，钥匙在左端桌沿上方，左手空着垂在身体左侧。钥匙、人物和抽屉的位置从这一初态开始保持明确。
摄影机位于木桌左前方的空通道，约胸口以下的高度，略向下观察；固定三分之四侧面中景，从林岚头顶到大腿上部入画，桌面中央、右手、左端拉手和抽屉外侧的空通道均保留，人物与桌面之间不加遮挡物。头顶留少量空隙，手臂向中心伸出的路径在画面内，视角自然，不用夸张广角拉伸木桌。林岚位于画面左侧，桌面延向画面右侧；焦点使面部、右手、匙身与桌面接触区域都可辨认，背景适度柔化。摄影机全段固定，不推轨、不穿桌、不摇摄、不变焦、不换轴线侧，不做焦点转移。
0 至 0.8 秒，林岚看准桌面中央，右手持钥匙从左端桌沿上方伸向中央；肘部自然展开，躯干只做小幅前倾，双脚承担重量并留在原位，左手不参与。0.8 至 2.4 秒，右手缓慢降低钥匙，腕部转到便于匙身平放的角度；金属匙身实际碰到桌面后，拇指与食指才松开匙柄。钥匙在桌面中央完全平放，匙齿沿桌长边指向桌右端，不跳动、不滑走。2.4 至 3.2 秒，右手空着向桌左端收回，避开钥匙，停在关闭抽屉的拉手上方；躯干回到直立，左手仍空着。3.2 至 4 秒，视线从静置钥匙移向左端抽屉拉手，保持克制、无额外表情变化。出点时人物仍在桌左端偏后，右手空且在拉手上方，左手空，钥匙静置于桌面中央、匙齿朝桌右端，抽屉关闭，木桌完全不动。这段短停留用于读清放置结果与下一动作目标。
光照：桌右后方高窗的柔和下午天光固定不变，右后侧白色衬衣有柔和明暗层次，左前侧米色墙提供弱反光；皮肤不过度磨平，衬衣不变为透明材质，桌面木纹清楚，匙身只有小范围金属反亮。手臂在同一光源下移动，手与木面接触时出现合理的小范围接触阴影，不增加闪光或动态光源。
声音制作意图：全镜持续低声级工作间底声，安静、短混响；右臂动作伴随少量干燥棉布摩擦；金属钥匙真正接触木面时出现一次轻而短的金属落木声，放稳后声响自然衰减。没有脚步、台词、旁白或音乐。拟音必须跟实际接触同步，不提前替代动作。

S02｜4 秒｜空右手打开抽屉
林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，正常肌肤纹理；穿白色无纹样棉质长袖衬衣，领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部，布料保留自然褶皱，下穿深灰直筒长裤。米色墙面的整洁工作间内，浅色长方形木桌约长 0.8 米、宽 0.5 米、高 0.72 米，固定在原位，桌腿稳定着地。左短边中央的浅木抽屉仍关闭，横向木拉手朝左；桌面中央静置一枚银色钥匙，匙齿沿桌长边指向桌右端，桌面无其他物品。林岚仍站在桌左端偏后、靠近左后角的位置，身体朝木桌，双脚及躯干在抽屉打开轨迹的后侧。右手空着，位于拉手上方；左手空着垂在身体左侧，始终不接触钥匙。神情平静专注，嘴唇自然闭合，注意力在抽屉拉手和即将露出的内腔，不看摄影机。
摄影机保持木桌左前方的同一侧视点、胸口以下的高度与略向下的角度。切镜采用更紧的中景，从林岚肩膀上方到大腿上部入画，同时保留右手、桌面中央钥匙、抽屉正面、打开轨迹及人物与抽屉之间的空隙；关键接触不被身体、袖口或桌沿遮住。固定机位，视角自然，焦点同时保护手指、拉手、桌面钥匙和抽屉开口；全段不推拉摇移、不穿桌、不越轴、不改变物理光源。桌右后方高窗的柔和天光与左前侧米色墙的弱反光持续，白衬衣、肤质、木纹和金属反亮与前镜一致。
切镜是继续同一时间顺序：钥匙已经由右手放好并松开，人物没有走到桌右侧，也没有重新拿钥匙。0 至 0.9 秒，林岚空右手从拉手上方降低，四指扣到横向木拉手后方，拇指扶在上缘；先形成清楚的握持，左手仍空着。0.9 至 2.9 秒，右手肘部收回，将抽屉沿原有导轨朝桌左端外侧拉出约十二厘米；手与拉手持续接触，抽屉只沿导轨直线移动，不脱轨、不穿过人物、不带动木桌。林岚在脚下支撑稳定的前提下轻微调整上身，双脚不换位，钥匙全段留在桌面中央。2.9 至 4 秒，抽屉在已打开的位置停下，右手仍握拉手，左手垂在身体左侧；抽屉口和空内腔清楚显露，林岚低头看向内腔，视线转移由抽屉显露触发。出点保留打开结果：人物桌左端偏后，右手握拉手，左手空，钥匙桌面中央且匙齿朝桌右端，抽屉拉出约十二厘米，木桌原位不动。不增加抽屉中的物件，不拿起钥匙，不合上抽屉。
声音制作意图：延续同一工作间底声与短混响，不在切点突然静音；握拉手时少量白衬衣袖口摩擦，抽屉真正开始移动后出现轻而低的木导轨滑动声，停下时轻微木质顿止声随后自然衰减。没有脚步、台词、旁白或音乐。所有近处声响以实际手部接触、抽屉起动和停止为同步锚点。
两镜约束：人物身份和白衬衣稳定；钥匙仅由右手放置，放置后始终静留桌面中央，左手不持钥匙；右手先握拉手再施力开抽屉；木桌不移动；不新增或复制钥匙；手指不穿拉手；不添加换位、对白、字幕、器材、人员、特效或新的光源。每镜 4 秒为成片采用设计，采用完整动作与结果，硬切不另加剪辑余量；供应商提交档位和实际返回长度尚未确定。
```

### 有序源修订记录全文

# 请求 2 有序修订记录

用户源 `scene-lock-v1` 原文保留在 `scene-lock-v1-source.txt`。用户已授权综合设计、空间补齐及修正后完整场次定稿。`scene-lock-v2` 为本次工作版本，不伪造 kind、批准者、正式哈希或回执。

1. 场景补全：原稿没有可判断可达性与机位的空间关系。增加暂定小木桌尺寸、左端抽屉、人物桌左端偏后起位、高窗与通道基线；目的是让右手能够够到桌面中心并给抽屉留通道。尺寸及造型为本项目新假设，均不来自请求 1。
2. 人物根因变量：S02 钥匙操控状态。S01 放置结果成为 S02 入态；钥匙继续静置中心，左手空，右手空后抓拉手。复查两镜的手、钥匙位置、释放及接触相位。
3. 导演根因变量：S02 人物起位。修正为继承 S01 桌左端偏后，不添加无来源的桌右侧起位；不移动木桌。复查抽屉轨迹与人物脚下支撑。
4. 导演根因变量：S02 摄影机路径。取消穿桌，到同侧固定视点更紧取景；复查桌面钥匙、右手、抽屉与人物遮挡。
5. 下游重编译：将以上来源决定写成 S01/S02 完整中文正文、初态、时序、可达出态与声音意图；不是新的独立设计变量。原稿 S01 的右手放置、钥匙桌面中央，源镜号、两镜 4 秒及全部硬锁保留。
6. 重新评审：根据实际定稿全文逐行复审六个视角，source 递增为工作版本 2，保留 v1 的未知与修订行，不将旧通过机械提升到新来源。

首版输出为 `response-2-v1.md`，包含修正后的 `scene-lock-v2`。未覆盖首版、未创建媒体 Take、未调用生成供应商。

后续局部修订：服装领口闭合状态，归属 character；复查两镜的 prompt 行和相邻 continuity 行，其他维度按新来源重新核对，未改变动作、光源、钥匙或机位。

## 所有工作表与实际检查输出

### review-scene-lock-v1.json：完整输入

```json
{
  "source": { "type": "prompt", "id": "scene-lock", "version": 1 },
  "mode": "full",
  "shotIds": ["S01", "S02"],
  "reviews": [
    { "role": "direction", "shotId": "S01", "status": "pass", "criterion": "本镜包含明确的信息变化。", "observation": "右手放下钥匙，出态钥匙在桌面中央；放置是唯一主要事件。", "sourceLocator": "scene-lock-v1 / S01 / 右手放下钥匙" },
    { "role": "direction", "shotId": "S02", "status": "revise", "criterion": "打开抽屉承接前一镜的可读空间和道具状态。", "observation": "原稿人物由桌左侧变为桌右侧，没有走位或省略说明，打开抽屉无法自然承接。", "sourceLocator": "scene-lock-v1 / S01-S02 / 人物位置", "repair": { "domain": "direction", "variable": "S02 人物起位", "acceptance": "S02 留在 S01 的桌左侧位置，不隐去换位。" } },
    { "role": "performance", "shotId": "S01", "status": "pass", "criterion": "人物任务和动作结果不冲突。", "observation": "任务是右手放钥匙，结果是钥匙停在桌面中央；没有相反手部要求或新增台词。具体表演待授权补全。", "sourceLocator": "scene-lock-v1 / S01 / 放钥匙" },
    { "role": "performance", "shotId": "S02", "status": "revise", "criterion": "钥匙操控遵守右手硬锁。", "observation": "S02 明写左手拿钥匙，与钥匙始终由右手操控的硬锁直接冲突。", "sourceLocator": "scene-lock-v1 / S02 / 左手拿着钥匙", "repair": { "domain": "character", "variable": "S02 钥匙操控状态", "acceptance": "不让左手碰钥匙；S02 延续钥匙留桌、右手空的状态，用右手开抽屉。" } },
    { "role": "staging", "shotId": "S01", "status": "unknown", "criterion": "人物在桌左侧能实际够到桌面中央。", "observation": "输入未给桌面尺寸、人物到桌沿的关系或遮挡；无法仅从现稿验证可达性，需要在授权范围补齐布局。" },
    { "role": "staging", "shotId": "S02", "status": "revise", "criterion": "人物路径、起位和抽屉方向连贯。", "observation": "人物在桌右侧的起位没有可见来源；桌与抽屉朝向未定义，镜头不能掩盖换位。", "sourceLocator": "scene-lock-v1 / S02 / 人物在桌右侧", "repair": { "domain": "direction", "variable": "S02 人物起位", "acceptance": "从 S01 桌左侧起位续接，并将抽屉开向人物所在的左短边。" } },
    { "role": "cinematography", "shotId": "S01", "status": "unknown", "criterion": "构图能看清右手与钥匙接触。", "observation": "S01 未声明机位、裁切、景深或光源；S02 的同一侧没有可追溯的初始机位。" },
    { "role": "cinematography", "shotId": "S02", "status": "revise", "criterion": "摄影机运动不穿越实体且保留同侧空间关系。", "observation": "摄影机穿过木桌到正面要求穿越实体，也与同一侧机位关系冲突。", "sourceLocator": "scene-lock-v1 / S02 / 摄影机穿过桌子到正面", "repair": { "domain": "direction", "variable": "S02 摄影机路径", "acceptance": "摄影机在桌左前方的同侧通行区域固定，不穿桌、不跨侧。" } },
    { "role": "prompt", "shotId": "S01", "status": "revise", "criterion": "独立复制稿包含所需初态、动作、摄影和出态。", "observation": "现稿只有动作摘要，缺林岚白衬衣、可见空间、光色和声音等独立交接所需信息。", "sourceLocator": "scene-lock-v1 / S01 / 全文", "repair": { "domain": "prompt", "variable": "S01 复制稿完整性", "acceptance": "将用户硬锁与新场景基线完整写入 S01 复制稿。" } },
    { "role": "prompt", "shotId": "S02", "status": "revise", "criterion": "提示词忠实编译硬锁和上游决定。", "observation": "左手拿钥匙使硬锁丢失；同侧与穿桌到正面互相冲突。应先修正手部状态和机位决定，再重编译正文。", "sourceLocator": "scene-lock-v1 / S02 / 全文", "repair": { "domain": "character", "variable": "S02 钥匙操控状态", "acceptance": "重编译正文时明确钥匙留在桌面中央、左手空，不出现左手持钥匙。" } },
    { "role": "continuity", "shotId": "S01", "status": "pass", "criterion": "出态可以明确传递。", "observation": "S01 已给人物桌左侧、右手完成放置、钥匙在桌面中央；这些状态可以作为修正版 S02 的初态。", "sourceLocator": "scene-lock-v1 / S01 / 钥匙停在桌面中央" },
    { "role": "continuity", "shotId": "S02", "status": "revise", "criterion": "钥匙归属承接 S01，且没有未写出的取物或换手。", "observation": "S01 钥匙已经在桌面中央，S02 却由左手持有，缺取物与交接且违反右手锁定。", "sourceLocator": "scene-lock-v1 / S01-S02 / 钥匙归属", "repair": { "domain": "character", "variable": "S02 钥匙操控状态", "acceptance": "S02 初态继承钥匙在桌面中央，并全镜静置。" } }
  ],
  "prompt": { "text": "scene-lock-v1\n锁定：人物林岚白衬衣，钥匙始终由右手操控，木桌不能移动；不加台词。\nS01，4 秒，人物在桌左侧，右手放下钥匙，钥匙停在桌面中央。\nS02，4 秒，同一侧机位，人物在桌右侧，左手拿着钥匙拉开抽屉，摄影机穿过桌子到正面。" }
}
```

### review-scene-lock-v1-output.txt：真实完整输出

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
      "role": "direction",
      "shotId": "S02",
      "status": "revise"
    },
    {
      "role": "performance",
      "shotId": "S02",
      "status": "revise"
    },
    {
      "role": "staging",
      "shotId": "S01",
      "status": "unknown"
    },
    {
      "role": "staging",
      "shotId": "S02",
      "status": "revise"
    },
    {
      "role": "cinematography",
      "shotId": "S01",
      "status": "unknown"
    },
    {
      "role": "cinematography",
      "shotId": "S02",
      "status": "revise"
    },
    {
      "role": "prompt",
      "shotId": "S01",
      "status": "revise"
    },
    {
      "role": "prompt",
      "shotId": "S02",
      "status": "revise"
    },
    {
      "role": "continuity",
      "shotId": "S02",
      "status": "revise"
    }
  ],
  "prompt": {
    "nonWhitespaceCodePoints": 118,
    "limit": null
  },
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "输入有效，评审仍有未决项或没有适用的通过项。"
  }
}
```

### review-scene-lock-v2.json：完整输入

```json
{
  "source": {
    "type": "prompt",
    "id": "scene-lock",
    "version": 2
  },
  "mode": "full",
  "shotIds": [
    "S01",
    "S02"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S01",
      "status": "pass",
      "criterion": "放置事件与观众注意力明确。",
      "observation": "S01 将右手持有变为桌面中心静置，最后看向抽屉，为下一镜提供目标。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿"
    },
    {
      "role": "direction",
      "shotId": "S02",
      "status": "pass",
      "criterion": "开抽屉有前态和明确结果。",
      "observation": "S02 继续已放好钥匙的时刻，右手抓拉手打开十二厘米并读清空内腔。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿"
    },
    {
      "role": "performance",
      "shotId": "S01",
      "status": "pass",
      "criterion": "右手先接触后释放，任务与时序可读。",
      "observation": "0.8 至 2.4 秒匙身先触木，再松拇指食指；2.4 秒后空右手收回，左手不参与。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿"
    },
    {
      "role": "performance",
      "shotId": "S02",
      "status": "pass",
      "criterion": "右手握持先于施力，视线变化有刺激。",
      "observation": "0 至 0.9 秒先扣拉手，0.9 秒后沿导轨拉；内腔显露后低头看内腔，嘴唇闭合无对白。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿"
    },
    {
      "role": "staging",
      "shotId": "S01",
      "status": "pass",
      "criterion": "桌左端起位与中心放置点有共同布局依据。",
      "observation": "补充设计桌面 0.8 米乘 0.5 米，人物左端偏后靠左后角，小幅前倾伸右手到中心；没有用近景隐藏跨长桌动作。此为可读设计，非人体实测。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿"
    },
    {
      "role": "staging",
      "shotId": "S02",
      "status": "pass",
      "criterion": "演员与抽屉轨迹分别可达。",
      "observation": "人物双脚及躯干处于向左打开轨迹后侧，抽屉沿左短边向左十二厘米；桌腿固定，右手接触可见。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿"
    },
    {
      "role": "cinematography",
      "shotId": "S01",
      "status": "pass",
      "criterion": "同侧机位能看见钥匙接触而不穿实体。",
      "observation": "左前通道固定机位，略下看桌面，头顶至大腿构图保留中心、右手、抽屉；高窗和墙面反光有明确来源。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿"
    },
    {
      "role": "cinematography",
      "shotId": "S02",
      "status": "pass",
      "criterion": "机位承接同侧且保留必要物体。",
      "observation": "左前方同一视点仅切到更紧中景，仍保留右手、钥匙、抽屉口与通道；没有穿桌或越轴。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿"
    },
    {
      "role": "prompt",
      "shotId": "S01",
      "status": "revise",
      "criterion": "独立正文保留硬锁，服装状态表述唯一。",
      "observation": "S01 的“扣至领口下方一颗纽扣”未明确该纽扣是扣上还是解开，与 S02 的明确解开不能形成唯一复位状态。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿",
      "repair": {
        "domain": "character",
        "variable": "白衬衣领口闭合状态措辞",
        "acceptance": "两镜均明确领口下方一颗纽扣解开，其余纽扣闭合。"
      }
    },
    {
      "role": "prompt",
      "shotId": "S02",
      "status": "pass",
      "criterion": "独立正文编译空间、动作、硬锁与声音。",
      "observation": "S02 自足重复白衬衣、人物左端偏后、桌面钥匙、空右手、固定机位及声音锚点，排除左手持钥匙与穿桌。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿"
    },
    {
      "role": "continuity",
      "shotId": "S01",
      "status": "revise",
      "criterion": "出态和下一镜入态能唯一复位。",
      "observation": "位置、空右手、空左手、桌面中央钥匙和关闭抽屉已匹配；领口闭合说法仍有歧义，应先统一该外观变量。",
      "sourceLocator": "scene-lock-v2 / S01 / 完整复制稿",
      "repair": {
        "domain": "character",
        "variable": "白衬衣领口闭合状态措辞",
        "acceptance": "S01 出态与 S02 入态采用同一明确的领口解开状态。"
      }
    },
    {
      "role": "continuity",
      "shotId": "S02",
      "status": "revise",
      "criterion": "继承人物、道具、光声与外观状态。",
      "observation": "人物和钥匙没有瞬移，同侧固定机位、高窗和底声延续；S02 的明确解开需让 S01 同样明写。",
      "sourceLocator": "scene-lock-v2 / S02 / 完整复制稿",
      "repair": {
        "domain": "character",
        "variable": "白衬衣领口闭合状态措辞",
        "acceptance": "S01/S02 都明写同一颗纽扣解开，避免依据歧义复位。"
      }
    }
  ],
  "prompt": {
    "text": "scene-lock-v2｜连续场次｜总采用时长 8 秒｜S01、S02 各 4 秒\n写实室内日景，16:9 横向画面，不添加台词、旁白、字幕或音乐。两镜按同一时间顺序硬切，第二镜继续第一镜结束后的动作，不重演放钥匙，不省略人物换位或取钥匙。全部空间尺寸为暂定设计值。当前只有文字稿，无已生成媒体或已存在的参考图。\n\nS01｜4 秒｜右手放下钥匙\n林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，面部保留正常肌肤纹理；白色无纹样棉质长袖衬衣扣至领口下方一颗纽扣，袖口闭合在腕部，布料有轻微自然褶皱，下穿深灰直筒长裤。神情平静专注，双唇自然闭合，肩颈放松，视线明确落在桌面中央的放置点，不看摄影机。米色墙面的整洁工作间内，一张浅色长方形木桌固定在原位，约长 0.8 米、宽 0.5 米、高 0.72 米，哑光桌面有连续细木纹，桌腿稳定着地，桌面无其他物品。木桌左短边中央是关闭的浅木抽屉，横向木拉手朝左；抽屉打开方向是朝桌左端外侧。林岚站在桌左端偏后、接近左后角的位置，双脚留在抽屉向左滑出的轨迹后侧，身体朝桌中央；右手拇指和食指夹住一枚银色钥匙的圆形匙柄，钥匙在左端桌沿上方，左手空着垂在身体左侧。钥匙、人物和抽屉的位置从这一初态开始保持明确。\n摄影机位于木桌左前方的空通道，约胸口以下的高度，略向下观察；固定三分之四侧面中景，从林岚头顶到大腿上部入画，桌面中央、右手、左端拉手和抽屉外侧的空通道均保留，人物与桌面之间不加遮挡物。头顶留少量空隙，手臂向中心伸出的路径在画面内，视角自然，不用夸张广角拉伸木桌。林岚位于画面左侧，桌面延向画面右侧；焦点使面部、右手、匙身与桌面接触区域都可辨认，背景适度柔化。摄影机全段固定，不推轨、不穿桌、不摇摄、不变焦、不换轴线侧，不做焦点转移。\n0 至 0.8 秒，林岚看准桌面中央，右手持钥匙从左端桌沿上方伸向中央；肘部自然展开，躯干只做小幅前倾，双脚承担重量并留在原位，左手不参与。0.8 至 2.4 秒，右手缓慢降低钥匙，腕部转到便于匙身平放的角度；金属匙身实际碰到桌面后，拇指与食指才松开匙柄。钥匙在桌面中央完全平放，匙齿沿桌长边指向桌右端，不跳动、不滑走。2.4 至 3.2 秒，右手空着向桌左端收回，避开钥匙，停在关闭抽屉的拉手上方；躯干回到直立，左手仍空着。3.2 至 4 秒，视线从静置钥匙移向左端抽屉拉手，保持克制、无额外表情变化。出点时人物仍在桌左端偏后，右手空且在拉手上方，左手空，钥匙静置于桌面中央、匙齿朝桌右端，抽屉关闭，木桌完全不动。这段短停留用于读清放置结果与下一动作目标。\n光照：桌右后方高窗的柔和下午天光固定不变，右后侧白色衬衣有柔和明暗层次，左前侧米色墙提供弱反光；皮肤不过度磨平，衬衣不变为透明材质，桌面木纹清楚，匙身只有小范围金属反亮。手臂在同一光源下移动，手与木面接触时出现合理的小范围接触阴影，不增加闪光或动态光源。\n声音制作意图：全镜持续低声级工作间底声，安静、短混响；右臂动作伴随少量干燥棉布摩擦；金属钥匙真正接触木面时出现一次轻而短的金属落木声，放稳后声响自然衰减。没有脚步、台词、旁白或音乐。拟音必须跟实际接触同步，不提前替代动作。\n\nS02｜4 秒｜空右手打开抽屉\n林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，正常肌肤纹理；穿白色无纹样棉质长袖衬衣，领口下方一颗纽扣解开、袖口闭合在腕部，布料保留自然褶皱，下穿深灰直筒长裤。米色墙面的整洁工作间内，浅色长方形木桌约长 0.8 米、宽 0.5 米、高 0.72 米，固定在原位，桌腿稳定着地。左短边中央的浅木抽屉仍关闭，横向木拉手朝左；桌面中央静置一枚银色钥匙，匙齿沿桌长边指向桌右端，桌面无其他物品。林岚仍站在桌左端偏后、靠近左后角的位置，身体朝木桌，双脚及躯干在抽屉打开轨迹的后侧。右手空着，位于拉手上方；左手空着垂在身体左侧，始终不接触钥匙。神情平静专注，嘴唇自然闭合，注意力在抽屉拉手和即将露出的内腔，不看摄影机。\n摄影机保持木桌左前方的同一侧视点、胸口以下的高度与略向下的角度。切镜采用更紧的中景，从林岚肩膀上方到大腿上部入画，同时保留右手、桌面中央钥匙、抽屉正面、打开轨迹及人物与抽屉之间的空隙；关键接触不被身体、袖口或桌沿遮住。固定机位，视角自然，焦点同时保护手指、拉手、桌面钥匙和抽屉开口；全段不推拉摇移、不穿桌、不越轴、不改变物理光源。桌右后方高窗的柔和天光与左前侧米色墙的弱反光持续，白衬衣、肤质、木纹和金属反亮与前镜一致。\n切镜是继续同一时间顺序：钥匙已经由右手放好并松开，人物没有走到桌右侧，也没有重新拿钥匙。0 至 0.9 秒，林岚空右手从拉手上方降低，四指扣到横向木拉手后方，拇指扶在上缘；先形成清楚的握持，左手仍空着。0.9 至 2.9 秒，右手肘部收回，将抽屉沿原有导轨朝桌左端外侧拉出约十二厘米；手与拉手持续接触，抽屉只沿导轨直线移动，不脱轨、不穿过人物、不带动木桌。林岚在脚下支撑稳定的前提下轻微调整上身，双脚不换位，钥匙全段留在桌面中央。2.9 至 4 秒，抽屉在已打开的位置停下，右手仍握拉手，左手垂在身体左侧；抽屉口和空内腔清楚显露，林岚低头看向内腔，视线转移由抽屉显露触发。出点保留打开结果：人物桌左端偏后，右手握拉手，左手空，钥匙桌面中央且匙齿朝桌右端，抽屉拉出约十二厘米，木桌原位不动。不增加抽屉中的物件，不拿起钥匙，不合上抽屉。\n声音制作意图：延续同一工作间底声与短混响，不在切点突然静音；握拉手时少量白衬衣袖口摩擦，抽屉真正开始移动后出现轻而低的木导轨滑动声，停下时轻微木质顿止声随后自然衰减。没有脚步、台词、旁白或音乐。所有近处声响以实际手部接触、抽屉起动和停止为同步锚点。\n两镜约束：人物身份和白衬衣稳定；钥匙仅由右手放置，放置后始终静留桌面中央，左手不持钥匙；右手先握拉手再施力开抽屉；木桌不移动；不新增或复制钥匙；手指不穿拉手；不添加换位、对白、字幕、器材、人员、特效或新的光源。每镜 4 秒为成片采用设计，采用完整动作与结果，硬切不另加剪辑余量；供应商提交档位和实际返回长度尚未确定。"
  }
}
```

### review-scene-lock-v2-output.txt：真实完整输出

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
      "role": "prompt",
      "shotId": "S01",
      "status": "revise"
    },
    {
      "role": "continuity",
      "shotId": "S01",
      "status": "revise"
    },
    {
      "role": "continuity",
      "shotId": "S02",
      "status": "revise"
    }
  ],
  "prompt": {
    "nonWhitespaceCodePoints": 2439,
    "limit": null
  },
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "输入有效，评审仍有未决项或没有适用的通过项。"
  }
}
```

### review-scene-lock-v3.json：完整输入

```json
{
  "source": {
    "type": "prompt",
    "id": "scene-lock",
    "version": 3
  },
  "mode": "full",
  "shotIds": [
    "S01",
    "S02"
  ],
  "reviews": [
    {
      "role": "direction",
      "shotId": "S01",
      "status": "pass",
      "criterion": "放置事件与观众注意力明确。",
      "observation": "S01 将右手持有变为桌面中心静置，最后看向抽屉，为下一镜提供目标。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "direction",
      "shotId": "S02",
      "status": "pass",
      "criterion": "开抽屉有前态和明确结果。",
      "observation": "S02 继续已放好钥匙的时刻，右手抓拉手打开十二厘米并读清空内腔。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    },
    {
      "role": "performance",
      "shotId": "S01",
      "status": "pass",
      "criterion": "右手先接触后释放，任务与时序可读。",
      "observation": "0.8 至 2.4 秒匙身先触木，再松拇指食指；2.4 秒后空右手收回，左手不参与。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "performance",
      "shotId": "S02",
      "status": "pass",
      "criterion": "右手握持先于施力，视线变化有刺激。",
      "observation": "0 至 0.9 秒先扣拉手，0.9 秒后沿导轨拉；内腔显露后低头看内腔，嘴唇闭合无对白。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    },
    {
      "role": "staging",
      "shotId": "S01",
      "status": "pass",
      "criterion": "桌左端起位与中心放置点有共同布局依据。",
      "observation": "补充设计桌面 0.8 米乘 0.5 米，人物左端偏后靠左后角，小幅前倾伸右手到中心；没有用近景隐藏跨长桌动作。此为可读设计，非人体实测。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "staging",
      "shotId": "S02",
      "status": "pass",
      "criterion": "演员与抽屉轨迹分别可达。",
      "observation": "人物双脚及躯干处于向左打开轨迹后侧，抽屉沿左短边向左十二厘米；桌腿固定，右手接触可见。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    },
    {
      "role": "cinematography",
      "shotId": "S01",
      "status": "pass",
      "criterion": "同侧机位能看见钥匙接触而不穿实体。",
      "observation": "左前通道固定机位，略下看桌面，头顶至大腿构图保留中心、右手、抽屉；高窗和墙面反光有明确来源。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "cinematography",
      "shotId": "S02",
      "status": "pass",
      "criterion": "机位承接同侧且保留必要物体。",
      "observation": "左前方同一视点仅切到更紧中景，仍保留右手、钥匙、抽屉口与通道；没有穿桌或越轴。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    },
    {
      "role": "prompt",
      "shotId": "S01",
      "status": "pass",
      "criterion": "独立正文保留硬锁，服装状态表述唯一。",
      "observation": "S01 已明写领口下方一颗纽扣解开、其余纽扣闭合，人物服装、右手动作、空间、光声与出态完整，措辞唯一。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "prompt",
      "shotId": "S02",
      "status": "pass",
      "criterion": "独立正文编译空间、动作、硬锁与声音。",
      "observation": "S02 自足重复白衬衣、人物左端偏后、桌面钥匙、空右手、固定机位及声音锚点，排除左手持钥匙与穿桌。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    },
    {
      "role": "continuity",
      "shotId": "S01",
      "status": "pass",
      "criterion": "出态和下一镜入态能唯一复位。",
      "observation": "S01 出态为人物左端偏后、右手空、左手空、钥匙中心匙齿朝桌右、抽屉关；白衬衣领口下方一颗纽扣解开且其余纽扣闭合，与 S02 匹配。",
      "sourceLocator": "scene-lock-v3 / S01 / 完整复制稿"
    },
    {
      "role": "continuity",
      "shotId": "S02",
      "status": "pass",
      "criterion": "继承人物、道具、光声与外观状态。",
      "observation": "S02 继承同一位置和空手状态、钥匙中心、关闭抽屉、同一领口闭合、窗光和底声；右手开抽屉后钥匙仍静置中心。",
      "sourceLocator": "scene-lock-v3 / S02 / 完整复制稿"
    }
  ],
  "prompt": {
    "text": "scene-lock-v3｜连续场次｜总采用时长 8 秒｜S01、S02 各 4 秒\n写实室内日景，16:9 横向画面，不添加台词、旁白、字幕或音乐。两镜按同一时间顺序硬切，第二镜继续第一镜结束后的动作，不重演放钥匙，不省略人物换位或取钥匙。全部空间尺寸为暂定设计值。当前只有文字稿，无已生成媒体或已存在的参考图。\n\nS01｜4 秒｜右手放下钥匙\n林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，面部保留正常肌肤纹理；白色无纹样棉质长袖衬衣领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部，布料有轻微自然褶皱，下穿深灰直筒长裤。神情平静专注，双唇自然闭合，肩颈放松，视线明确落在桌面中央的放置点，不看摄影机。米色墙面的整洁工作间内，一张浅色长方形木桌固定在原位，约长 0.8 米、宽 0.5 米、高 0.72 米，哑光桌面有连续细木纹，桌腿稳定着地，桌面无其他物品。木桌左短边中央是关闭的浅木抽屉，横向木拉手朝左；抽屉打开方向是朝桌左端外侧。林岚站在桌左端偏后、接近左后角的位置，双脚留在抽屉向左滑出的轨迹后侧，身体朝桌中央；右手拇指和食指夹住一枚银色钥匙的圆形匙柄，钥匙在左端桌沿上方，左手空着垂在身体左侧。钥匙、人物和抽屉的位置从这一初态开始保持明确。\n摄影机位于木桌左前方的空通道，约胸口以下的高度，略向下观察；固定三分之四侧面中景，从林岚头顶到大腿上部入画，桌面中央、右手、左端拉手和抽屉外侧的空通道均保留，人物与桌面之间不加遮挡物。头顶留少量空隙，手臂向中心伸出的路径在画面内，视角自然，不用夸张广角拉伸木桌。林岚位于画面左侧，桌面延向画面右侧；焦点使面部、右手、匙身与桌面接触区域都可辨认，背景适度柔化。摄影机全段固定，不推轨、不穿桌、不摇摄、不变焦、不换轴线侧，不做焦点转移。\n0 至 0.8 秒，林岚看准桌面中央，右手持钥匙从左端桌沿上方伸向中央；肘部自然展开，躯干只做小幅前倾，双脚承担重量并留在原位，左手不参与。0.8 至 2.4 秒，右手缓慢降低钥匙，腕部转到便于匙身平放的角度；金属匙身实际碰到桌面后，拇指与食指才松开匙柄。钥匙在桌面中央完全平放，匙齿沿桌长边指向桌右端，不跳动、不滑走。2.4 至 3.2 秒，右手空着向桌左端收回，避开钥匙，停在关闭抽屉的拉手上方；躯干回到直立，左手仍空着。3.2 至 4 秒，视线从静置钥匙移向左端抽屉拉手，保持克制、无额外表情变化。出点时人物仍在桌左端偏后，右手空且在拉手上方，左手空，钥匙静置于桌面中央、匙齿朝桌右端，抽屉关闭，木桌完全不动。这段短停留用于读清放置结果与下一动作目标。\n光照：桌右后方高窗的柔和下午天光固定不变，右后侧白色衬衣有柔和明暗层次，左前侧米色墙提供弱反光；皮肤不过度磨平，衬衣不变为透明材质，桌面木纹清楚，匙身只有小范围金属反亮。手臂在同一光源下移动，手与木面接触时出现合理的小范围接触阴影，不增加闪光或动态光源。\n声音制作意图：全镜持续低声级工作间底声，安静、短混响；右臂动作伴随少量干燥棉布摩擦；金属钥匙真正接触木面时出现一次轻而短的金属落木声，放稳后声响自然衰减。没有脚步、台词、旁白或音乐。拟音必须跟实际接触同步，不提前替代动作。\n\nS02｜4 秒｜空右手打开抽屉\n林岚为成年人物，短黑发贴合头部、耳侧清楚，自然素颜，正常肌肤纹理；穿白色无纹样棉质长袖衬衣，领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部，布料保留自然褶皱，下穿深灰直筒长裤。米色墙面的整洁工作间内，浅色长方形木桌约长 0.8 米、宽 0.5 米、高 0.72 米，固定在原位，桌腿稳定着地。左短边中央的浅木抽屉仍关闭，横向木拉手朝左；桌面中央静置一枚银色钥匙，匙齿沿桌长边指向桌右端，桌面无其他物品。林岚仍站在桌左端偏后、靠近左后角的位置，身体朝木桌，双脚及躯干在抽屉打开轨迹的后侧。右手空着，位于拉手上方；左手空着垂在身体左侧，始终不接触钥匙。神情平静专注，嘴唇自然闭合，注意力在抽屉拉手和即将露出的内腔，不看摄影机。\n摄影机保持木桌左前方的同一侧视点、胸口以下的高度与略向下的角度。切镜采用更紧的中景，从林岚肩膀上方到大腿上部入画，同时保留右手、桌面中央钥匙、抽屉正面、打开轨迹及人物与抽屉之间的空隙；关键接触不被身体、袖口或桌沿遮住。固定机位，视角自然，焦点同时保护手指、拉手、桌面钥匙和抽屉开口；全段不推拉摇移、不穿桌、不越轴、不改变物理光源。桌右后方高窗的柔和天光与左前侧米色墙的弱反光持续，白衬衣、肤质、木纹和金属反亮与前镜一致。\n切镜是继续同一时间顺序：钥匙已经由右手放好并松开，人物没有走到桌右侧，也没有重新拿钥匙。0 至 0.9 秒，林岚空右手从拉手上方降低，四指扣到横向木拉手后方，拇指扶在上缘；先形成清楚的握持，左手仍空着。0.9 至 2.9 秒，右手肘部收回，将抽屉沿原有导轨朝桌左端外侧拉出约十二厘米；手与拉手持续接触，抽屉只沿导轨直线移动，不脱轨、不穿过人物、不带动木桌。林岚在脚下支撑稳定的前提下轻微调整上身，双脚不换位，钥匙全段留在桌面中央。2.9 至 4 秒，抽屉在已打开的位置停下，右手仍握拉手，左手垂在身体左侧；抽屉口和空内腔清楚显露，林岚低头看向内腔，视线转移由抽屉显露触发。出点保留打开结果：人物桌左端偏后，右手握拉手，左手空，钥匙桌面中央且匙齿朝桌右端，抽屉拉出约十二厘米，木桌原位不动。不增加抽屉中的物件，不拿起钥匙，不合上抽屉。\n声音制作意图：延续同一工作间底声与短混响，不在切点突然静音；握拉手时少量白衬衣袖口摩擦，抽屉真正开始移动后出现轻而低的木导轨滑动声，停下时轻微木质顿止声随后自然衰减。没有脚步、台词、旁白或音乐。所有近处声响以实际手部接触、抽屉起动和停止为同步锚点。\n两镜约束：人物身份和白衬衣稳定；钥匙仅由右手放置，放置后始终静留桌面中央，左手不持钥匙；右手先握拉手再施力开抽屉；木桌不移动；不新增或复制钥匙；手指不穿拉手；不添加换位、对白、字幕、器材、人员、特效或新的光源。每镜 4 秒为成片采用设计，采用完整动作与结果，硬切不另加剪辑余量；供应商提交档位和实际返回长度尚未确定。"
  }
}
```

### review-scene-lock-v3-output.txt：真实完整输出

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": true,
  "expectedRows": 12,
  "missing": [],
  "openItems": [],
  "prompt": {
    "nonWhitespaceCodePoints": 2453,
    "limit": null
  },
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "规划评审已完成；实际媒体仍未核验。"
  }
}
```

## 实际源文件读取范围、哈希与当前复核

首次读取 SKILL.md 后按任务沿链接加载。请求 1 读取 shot_direction、storyboard_rhythm，以及视频／声音、表演、时长资料；请求 2 增加 review_repair、群像逐镜评审、产物优先级、scene 共享空间和 operating-model 上下文隔离。未读取全量加载清单、schema、供应商适配或既有测试输出。

实际读取记录不隐藏过读：请求 1 首轮批量工具读了 prompt-detail-standard.md 和 video-performance-direction.md 全文，工具总体输出截断；随后分别按已记录的相关章节窄读，得到足够完整的可见规则。存档的 source-read 文本由 PowerShell 文本读取转存，可能追加换行；以下 SHA256 是当时实际产品源文件的字节哈希。

| 实际产品源路径 | 读取序号／范围 | 当时 SHA256 | 当前字节哈希复核 |
| --- | --- | --- | --- |

| `skills/cineweave-director/SKILL.md` | 1: 全文；10: 全文 | `18d40408575640d65220b0d4527d356ec4509dc7856e8f0c35dc15142c2af426` | 一致 |

| `skills/cineweave-director/references/routes/shot-direction.md` | 2: 全文 | `c04957137f3f99cb3bba46f0c9046a653df490686867d8c0cad57ede90087388` | 一致 |

| `skills/cineweave-director/references/routes/storyboard-rhythm.md` | 3: 全文 | `10ce342b7e5beb342f16942d653c3316c9fbe3758e6942c687c37e2560a2c601` | 一致 |

| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | 4: 全文；6: 镜头与分镜、拍摄系统与部门协同 | `0de944dffd30d69bc05a52ef4bceaf0a90dce40564e2f1a288c68e7dd1e88e59` | 一致 |

| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | 5: 全文 | `cfd0a201805ab58f05ebe5eda1025359776eb78534cfb849472f728594da6a16` | 一致 |

| `skills/cineweave-director/references/optional/video-performance-direction.md` | 7: 全文；9: 编写顺序、把角色处境转成可表演任务、情绪不等于面部几何、摄影机与焦点、时间工作表与验收 | `8a156479c8ae94c55a1c6b433fef9193733fc64867eaae2a17e17e404614a11d` | 一致 |

| `skills/cineweave-director/references/optional/video-timing-and-handles.md` | 8: 全文 | `0856cc9f67c10259a54755a470ae338e93a25df3d031b0d1730e5429aeb55fa8` | 一致 |

| `skills/cineweave-director/references/routes/review-repair.md` | 11: 全文 | `9befe4fe6ecc4711e9aeb33121de3aa3912d5a5122ccea047793829b06481834` | 一致 |

| `skills/cineweave-director/references/optional/ensemble-direction-and-review.md` | 12: 全文 | `54d9406901ae0b42cd8bb2b2cb4bda5e89aaff625dd4e255dc7377452d735e75` | 一致 |

| `skills/cineweave-director/references/core/artifact-control-and-precedence.md` | 13: 全文 | `378b9f8d7ab60d8ab19b2f2ab3ccb7eccbbd609aac42ced477c4139e6765e786` | 一致 |

| `skills/cineweave-director/references/routes/scene.md` | 14: 全文 | `ef10535a31d8aeacf7465957ad995c47b1389f5b3b5fe9096e77682f151ea6e4` | 一致 |

| `skills/cineweave-director/references/core/operating-model.md` | 15: 任务范围与上下文 | `932bdfa72eb114b93673cb0e2a4490a293c1302fc3822f4d832a749164da101e` | 一致 |

| `skills/cineweave-director/scripts/check-shot-review.mjs` | 17: 全文 | `bb69f60d8794f3329bc4b7af772d05ad01a28c001c7345f1de63bfa1e3d7d1c2` | 一致 |

| `skills/cineweave-director/scripts/parse-json.mjs` | 23: 全文 | `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11` | 一致 |


上述当前复核只计算产品源文件哈希，不读取其他项目文件。重复读取 SKILL.md 的哈希一致。共享方法不等于共享原创事实。

## 实际命令、退出码与辅助输出

下列 JSON 是每次实际读文件／执行工具时写出的记录。对于 PowerShell Get-Content／Get-FileHash 读取，`native_exit_code: 0` 记录的是 exec_command 的 PowerShell 进程退出码；cmdlet 没有独立原生子进程。对 node/python 则捕获真实 `$LASTEXITCODE` 并以 `exit $nativeExit` 原样返回，未把 2 包装成 0。实际 exec_command 包装同时把 stdout/stderr、命令及退出码写入对应文件。章节读取的 command 字段是操作说明，实际读取表达式如下。

```powershell
$sourceText = Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/prompt-detail-standard.md'
$sections = [regex]::Matches($sourceText, '(?ms)^## (镜头与分镜|拍摄系统与部门协同)\r?\n.*?(?=^## |\z)') | ForEach-Object { $_.Value }
$sourceText = Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/video-performance-direction.md'
$sections = [regex]::Matches($sourceText, '(?ms)^## (编写顺序|把角色处境转成可表演任务|情绪不等于面部几何|摄影机与焦点|时间工作表与验收)\r?\n.*?(?=^## |\z)') | ForEach-Object { $_.Value }
$sourceText = Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/core/operating-model.md'
$readText = ([regex]::Match($sourceText, '(?ms)^## 任务范围与上下文\r?\n.*?(?=^## |\z)')).Value
```

```json
[
  {
    "sequence": 1,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/SKILL.md'",
    "native_exit_code": 0,
    "output_file": "entry-source-read.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\SKILL.md",
    "sha256": "18D40408575640D65220B0D4527D356EC4509DC7856E8F0C35DC15142C2AF426",
    "purpose": "Initial entry read"
  },
  {
    "sequence": 2,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/routes/shot-direction.md'",
    "native_exit_code": 0,
    "output_file": "source-read-002.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\routes\\shot-direction.md",
    "sha256": "C04957137F3F99CB3BBA46F0C9046A653DF490686867D8C0CAD57EDE90087388",
    "purpose": "Task route or linked standard read"
  },
  {
    "sequence": 3,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/routes/storyboard-rhythm.md'",
    "native_exit_code": 0,
    "output_file": "source-read-003.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\routes\\storyboard-rhythm.md",
    "sha256": "10CE342B7E5BEB342F16942D653C3316C9FBE3758E6942C687C37E2560A2C601",
    "purpose": "Task route or linked standard read"
  },
  {
    "sequence": 4,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/prompt-detail-standard.md'",
    "native_exit_code": 0,
    "output_file": "source-read-004.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\prompt-detail-standard.md",
    "sha256": "0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59",
    "purpose": "Task route or linked standard read"
  },
  {
    "sequence": 5,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/video-sound-and-delivery.md'",
    "native_exit_code": 0,
    "output_file": "source-read-005.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\video-sound-and-delivery.md",
    "sha256": "CFD0A201805AB58F05EBE5EDA1025359776EB78534CFB849472F728594DA6A16",
    "purpose": "Task route or linked standard read"
  },
  {
    "sequence": 6,
    "session": "request-1",
    "command": "Read prompt-detail-standard.md sections 镜头与分镜 and 拍摄系统与部门协同",
    "native_exit_code": 0,
    "output_file": "source-read-006.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\prompt-detail-standard.md",
    "sha256": "0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59",
    "sections": [
      "镜头与分镜",
      "拍摄系统与部门协同"
    ]
  },
  {
    "sequence": 7,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/video-performance-direction.md'",
    "native_exit_code": 0,
    "output_file": "source-read-007.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\video-performance-direction.md",
    "sha256": "8A156479C8AE94C55A1C6B433FEF9193733FC64867EAAE2A17E17E404614A11D"
  },
  {
    "sequence": 8,
    "session": "request-1",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/video-timing-and-handles.md'",
    "native_exit_code": 0,
    "output_file": "source-read-008.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\video-timing-and-handles.md",
    "sha256": "0856CC9F67C10259A54755A470AE338E93A25DF3D031B0D1730E5429AEB55FA8"
  },
  {
    "sequence": 9,
    "session": "request-1",
    "command": "Read selected video-performance-direction.md sections",
    "native_exit_code": 0,
    "output_file": "source-read-009.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\video-performance-direction.md",
    "sha256": "8A156479C8AE94C55A1C6B433FEF9193733FC64867EAAE2A17E17E404614A11D",
    "sections": [
      "编写顺序",
      "把角色处境转成可表演任务",
      "情绪不等于面部几何",
      "摄影机与焦点",
      "时间工作表与验收"
    ]
  },
  {
    "sequence": 10,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/SKILL.md'",
    "native_exit_code": 0,
    "output_file": "source-read-010.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\SKILL.md",
    "sha256": "18D40408575640D65220B0D4527D356EC4509DC7856E8F0C35DC15142C2AF426"
  },
  {
    "sequence": 11,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/routes/review-repair.md'",
    "native_exit_code": 0,
    "output_file": "source-read-011.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\routes\\review-repair.md",
    "sha256": "9BEFE4FE6ECC4711E9AEB33121DE3AA3912D5A5122CCEA047793829B06481834"
  },
  {
    "sequence": 12,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/optional/ensemble-direction-and-review.md'",
    "native_exit_code": 0,
    "output_file": "source-read-012.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\optional\\ensemble-direction-and-review.md",
    "sha256": "54D9406901AE0B42CD8BB2B2CB4BDA5E89AAFF625DD4E255DC7377452D735E75"
  },
  {
    "sequence": 13,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/core/artifact-control-and-precedence.md'",
    "native_exit_code": 0,
    "output_file": "source-read-013.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\core\\artifact-control-and-precedence.md",
    "sha256": "378B9F8D7AB60D8AB19B2F2AB3CCB7ECCBBD609AAC42CED477C4139E6765E786"
  },
  {
    "sequence": 14,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/references/routes/scene.md'",
    "native_exit_code": 0,
    "output_file": "source-read-014.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\routes\\scene.md",
    "sha256": "EF10535A31D8AEACF7465957AD995C47B1389F5B3B5FE9096E77682F151EA6E4"
  },
  {
    "sequence": 15,
    "session": "request-2",
    "command": "Read operating-model.md section 任务范围与上下文",
    "native_exit_code": 0,
    "output_file": "source-read-015.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\references\\core\\operating-model.md",
    "sha256": "932BDFA72EB114B93673CB0E2A4490A293C1302FC3822F4D832A749164DA101E",
    "sections": [
      "任务范围与上下文"
    ]
  },
  {
    "sequence": 16,
    "session": "request-2",
    "command": "node --version",
    "native_exit_code": 0,
    "output_file": "node-version-output.txt",
    "output": "v22.15.0\r\n"
  },
  {
    "sequence": 17,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/scripts/check-shot-review.mjs'",
    "native_exit_code": 0,
    "output_file": "source-read-017.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\scripts\\check-shot-review.mjs",
    "sha256": "BB69F60D8794F3329BC4B7AF772D05AD01A28C001C7345F1DE63BFA1E3D7D1C2"
  },
  {
    "sequence": 18,
    "session": "request-2",
    "command": "node skills/cineweave-director/scripts/check-shot-review.mjs D:\\Temp\\cineweave-simplify-forward-b-20261012\\review-scene-lock-v1.json",
    "native_exit_code": 2,
    "output_file": "review-scene-lock-v1-output.txt",
    "output": "{\r\n  \"valid\": true,\r\n  \"scope\": \"plan_only\",\r\n  \"coverageComplete\": true,\r\n  \"reviewComplete\": false,\r\n  \"expectedRows\": 12,\r\n  \"missing\": [],\r\n  \"openItems\": [\r\n    {\r\n      \"role\": \"direction\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"performance\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"staging\",\r\n      \"shotId\": \"S01\",\r\n      \"status\": \"unknown\"\r\n    },\r\n    {\r\n      \"role\": \"staging\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"cinematography\",\r\n      \"shotId\": \"S01\",\r\n      \"status\": \"unknown\"\r\n    },\r\n    {\r\n      \"role\": \"cinematography\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"prompt\",\r\n      \"shotId\": \"S01\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"prompt\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"continuity\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    }\r\n  ],\r\n  \"prompt\": {\r\n    \"nonWhitespaceCodePoints\": 118,\r\n    \"limit\": null\r\n  },\r\n  \"errors\": [],\r\n  \"limitation\": \"仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。\",\r\n  \"localization\": {\r\n    \"locale\": \"zh-CN\",\r\n    \"summary\": \"输入有效，评审仍有未决项或没有适用的通过项。\"\r\n  }\r\n}\r\n"
  },
  {
    "sequence": 19,
    "session": "request-2",
    "command": "python -X utf8 D:\\Temp\\cineweave-simplify-forward-b-20261012\\build-review-worksheets.py candidate",
    "native_exit_code": 0,
    "output_file": "candidate-worksheet-build-output.txt",
    "output": "Created review-scene-lock-v2.json: 12 rows; source scene-lock version 2; no prompt limit.\r\n"
  },
  {
    "sequence": 20,
    "session": "request-2",
    "command": "node skills/cineweave-director/scripts/check-shot-review.mjs D:\\Temp\\cineweave-simplify-forward-b-20261012\\review-scene-lock-v2.json",
    "native_exit_code": 2,
    "output_file": "review-scene-lock-v2-output.txt",
    "output": "{\r\n  \"valid\": true,\r\n  \"scope\": \"plan_only\",\r\n  \"coverageComplete\": true,\r\n  \"reviewComplete\": false,\r\n  \"expectedRows\": 12,\r\n  \"missing\": [],\r\n  \"openItems\": [\r\n    {\r\n      \"role\": \"prompt\",\r\n      \"shotId\": \"S01\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"continuity\",\r\n      \"shotId\": \"S01\",\r\n      \"status\": \"revise\"\r\n    },\r\n    {\r\n      \"role\": \"continuity\",\r\n      \"shotId\": \"S02\",\r\n      \"status\": \"revise\"\r\n    }\r\n  ],\r\n  \"prompt\": {\r\n    \"nonWhitespaceCodePoints\": 2439,\r\n    \"limit\": null\r\n  },\r\n  \"errors\": [],\r\n  \"limitation\": \"仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。\",\r\n  \"localization\": {\r\n    \"locale\": \"zh-CN\",\r\n    \"summary\": \"输入有效，评审仍有未决项或没有适用的通过项。\"\r\n  }\r\n}\r\n"
  },
  {
    "sequence": 21,
    "session": "request-2",
    "command": "python -X utf8 D:\\Temp\\cineweave-simplify-forward-b-20261012\\build-review-worksheets.py repair",
    "native_exit_code": 0,
    "output_file": "repair-build-output.txt",
    "output": "Saved response-2-v2.md without overwriting response-2-v1.md; source scene-lock version 3; created 12 reviewed rows.\r\n"
  },
  {
    "sequence": 22,
    "session": "request-2",
    "command": "node skills/cineweave-director/scripts/check-shot-review.mjs D:\\Temp\\cineweave-simplify-forward-b-20261012\\review-scene-lock-v3.json",
    "native_exit_code": 0,
    "output_file": "review-scene-lock-v3-output.txt",
    "output": "{\r\n  \"valid\": true,\r\n  \"scope\": \"plan_only\",\r\n  \"coverageComplete\": true,\r\n  \"reviewComplete\": true,\r\n  \"expectedRows\": 12,\r\n  \"missing\": [],\r\n  \"openItems\": [],\r\n  \"prompt\": {\r\n    \"nonWhitespaceCodePoints\": 2453,\r\n    \"limit\": null\r\n  },\r\n  \"errors\": [],\r\n  \"limitation\": \"仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。\",\r\n  \"localization\": {\r\n    \"locale\": \"zh-CN\",\r\n    \"summary\": \"规划评审已完成；实际媒体仍未核验。\"\r\n  }\r\n}\r\n"
  },
  {
    "sequence": 23,
    "session": "request-2",
    "command": "Get-Content -Raw -LiteralPath 'skills/cineweave-director/scripts/parse-json.mjs'",
    "native_exit_code": 0,
    "output_file": "source-read-023.txt",
    "source_path": "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\scripts\\parse-json.mjs",
    "sha256": "9C15621D8304BF6114CC4CB322409C8E59433409AC17950311725CDCBEBECF11",
    "purpose": "Read exact product dependency imported during checker execution"
  }
]
```

首次读 SKILL.md 的原生 PowerShell 进程返回 0。随后创建证据目录并归档该读取记录的实际 PowerShell 命令也返回 0，Get-FileHash 输出 SHA256 为 `18D40408575640D65220B0D4527D356EC4509DC7856E8F0C35DC15142C2AF426`。

文件写入使用 apply_patch 与下方 Python 辅助程序，作用域全部在临时证据目录；apply_patch 为工具调用，没有原生进程退出码。实际执行 Python 原生退出码均为 0。

### 真实编排错误（未启动原生检查器）

```text
执行时间段：请求 2，创建首轮评审工作表后。
functions.exec 已成功完成 apply_patch 写入 request-2.txt、scene-lock-v1-source.txt 和 review-scene-lock-v1.json。
随后准备调用 exec_command 时，JavaScript 变量 repo 未在新的 isolate 中定义。
真实错误：ReferenceError: repo is not defined
位置：exec_main.mjs:3:872
检查器未启动，原生进程退出码不适用。
修复：在下一次 functions.exec 调用中使用明确的 workdir 字面值，保留所有已写文件；未覆盖任何首版答案或首版评审表。
```

### 构建工作表所用辅助程序全文

```python
from pathlib import Path
import json
import sys

folder = Path(r'D:\Temp\cineweave-simplify-forward-b-20261012')
mode = sys.argv[1]

def prompt_text(path):
    value = path.read_text(encoding='utf-8-sig')
    return value.split('```text\n', 1)[1].split('\n```', 1)[0]

def row(role, shot, criterion, observation, version, status='pass', repair=None):
    value = dict(role=role, shotId=shot, status=status, criterion=criterion,
                 observation=observation, sourceLocator=f'scene-lock-v{version} / {shot} / 完整复制稿')
    if repair is not None:
        value['repair'] = repair
    return value

def reviews(version):
    return [
      row('direction','S01','放置事件与观众注意力明确。','S01 将右手持有变为桌面中心静置，最后看向抽屉，为下一镜提供目标。',version),
      row('direction','S02','开抽屉有前态和明确结果。','S02 继续已放好钥匙的时刻，右手抓拉手打开十二厘米并读清空内腔。',version),
      row('performance','S01','右手先接触后释放，任务与时序可读。','0.8 至 2.4 秒匙身先触木，再松拇指食指；2.4 秒后空右手收回，左手不参与。',version),
      row('performance','S02','右手握持先于施力，视线变化有刺激。','0 至 0.9 秒先扣拉手，0.9 秒后沿导轨拉；内腔显露后低头看内腔，嘴唇闭合无对白。',version),
      row('staging','S01','桌左端起位与中心放置点有共同布局依据。','补充设计桌面 0.8 米乘 0.5 米，人物左端偏后靠左后角，小幅前倾伸右手到中心；没有用近景隐藏跨长桌动作。此为可读设计，非人体实测。',version),
      row('staging','S02','演员与抽屉轨迹分别可达。','人物双脚及躯干处于向左打开轨迹后侧，抽屉沿左短边向左十二厘米；桌腿固定，右手接触可见。',version),
      row('cinematography','S01','同侧机位能看见钥匙接触而不穿实体。','左前通道固定机位，略下看桌面，头顶至大腿构图保留中心、右手、抽屉；高窗和墙面反光有明确来源。',version),
      row('cinematography','S02','机位承接同侧且保留必要物体。','左前方同一视点仅切到更紧中景，仍保留右手、钥匙、抽屉口与通道；没有穿桌或越轴。',version),
      row('prompt','S01','独立正文保留硬锁，服装状态表述唯一。','S01 的“扣至领口下方一颗纽扣”未明确该纽扣是扣上还是解开，与 S02 的明确解开不能形成唯一复位状态。',version,'revise',{'domain':'character','variable':'白衬衣领口闭合状态措辞','acceptance':'两镜均明确领口下方一颗纽扣解开，其余纽扣闭合。'}),
      row('prompt','S02','独立正文编译空间、动作、硬锁与声音。','S02 自足重复白衬衣、人物左端偏后、桌面钥匙、空右手、固定机位及声音锚点，排除左手持钥匙与穿桌。',version),
      row('continuity','S01','出态和下一镜入态能唯一复位。','位置、空右手、空左手、桌面中央钥匙和关闭抽屉已匹配；领口闭合说法仍有歧义，应先统一该外观变量。',version,'revise',{'domain':'character','variable':'白衬衣领口闭合状态措辞','acceptance':'S01 出态与 S02 入态采用同一明确的领口解开状态。'}),
      row('continuity','S02','继承人物、道具、光声与外观状态。','人物和钥匙没有瞬移，同侧固定机位、高窗和底声延续；S02 的明确解开需让 S01 同样明写。',version,'revise',{'domain':'character','variable':'白衬衣领口闭合状态措辞','acceptance':'S01/S02 都明写同一颗纽扣解开，避免依据歧义复位。'})
    ]

if mode == 'candidate':
    data = {'source':{'type':'prompt','id':'scene-lock','version':2},'mode':'full',
            'shotIds':['S01','S02'],'reviews':reviews(2),
            'prompt':{'text':prompt_text(folder/'response-2-v1.md')}}
    target = folder/'review-scene-lock-v2.json'
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Created {target.name}: 12 rows; source scene-lock version 2; no prompt limit.')
elif mode == 'repair':
    original = (folder/'response-2-v1.md').read_text(encoding='utf-8-sig')
    updated = original.replace('scene-lock-v2','scene-lock-v3')
    updated = updated.replace('扣至领口下方一颗纽扣，袖口闭合在腕部','领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部')
    updated = updated.replace('领口下方一颗纽扣解开、袖口闭合在腕部','领口下方一颗纽扣解开，其余纽扣闭合，袖口闭合在腕部')
    updated = '补充复查仅统一了两镜白衬衣领口的闭合措辞：领口下方一颗纽扣解开，其余纽扣闭合。首版及其评审仍保留。\n\n'+updated
    (folder/'response-2-v2.md').write_text(updated,encoding='utf-8')
    rows = reviews(3)
    fixed = {
      ('prompt','S01'): 'S01 已明写领口下方一颗纽扣解开、其余纽扣闭合，人物服装、右手动作、空间、光声与出态完整，措辞唯一。',
      ('continuity','S01'): 'S01 出态为人物左端偏后、右手空、左手空、钥匙中心匙齿朝桌右、抽屉关；白衬衣领口下方一颗纽扣解开且其余纽扣闭合，与 S02 匹配。',
      ('continuity','S02'): 'S02 继承同一位置和空手状态、钥匙中心、关闭抽屉、同一领口闭合、窗光和底声；右手开抽屉后钥匙仍静置中心。'
    }
    for item in rows:
        key = (item['role'],item['shotId'])
        if key in fixed:
            item['status']='pass'
            item['observation']=fixed[key]
            item.pop('repair',None)
    data = {'source':{'type':'prompt','id':'scene-lock','version':3},'mode':'full',
            'shotIds':['S01','S02'],'reviews':rows,
            'prompt':{'text':prompt_text(folder/'response-2-v2.md')}}
    target = folder/'review-scene-lock-v3.json'
    target.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Saved response-2-v2.md without overwriting response-2-v1.md; source scene-lock version 3; created 12 reviewed rows.')
else:
    raise ValueError(mode)
```

### Node／Python 辅助命令完整输出

`node-version-output.txt`

```text
v22.15.0
```

`candidate-worksheet-build-output.txt`

```text
Created review-scene-lock-v2.json: 12 rows; source scene-lock version 2; no prompt limit.
```

`repair-build-output.txt`

```text
Saved response-2-v2.md without overwriting response-2-v1.md; source scene-lock version 3; created 12 reviewed rows.
```

## 证据边界与停止状态

两条文字前向请求已完成。请求 1 保留首版；请求 2 保留原稿、首次修正回答及领口措辞修订回答，并完成最终实际六视角检查。未生成媒体、未调用供应商、未创建真实 Take、未观察像素或音轨，未声称艺术批准、权利放行、平台能力或供应商时长已验证。

最终检查的 `valid: true`、`coverageComplete: true`、`reviewComplete: true`、`openItems: []` 只描述已录入文字规划评审表。检查器不解析提示词原文与观察是否相符，具体文字判断仍依赖上述人工观察及完整原文。实际身份、接触、表演、时长、同步与剪辑质量全部保持未核验。

产品源文件当前哈希复核变化数：0。
