# 当前四Skill配置独立执行报告 · run2

batch: `newfork_none`。五案在同一独立子代理上下文中执行；没有逐案重置上下文。模型、token、推理档位、生成延迟均为 `null`。无自评分。

输入仅为指定raw文件；先读四入口frontmatter，再按需读取导演与平台正文及相邻资源。没有媒体、供应商调用、外部服务访问、安装、批准或产品源码改动。

## 实际读取来源

| key | path | SHA-256 | 读取章节 |
| --- | --- | --- | --- |
| input | D:/Temp/cineweave-split-p4-correction-raw-inputs-20261012.json | FC7AE52E6ABC32563D06A36335176054142B56E5A3364FB9492AB21DDA1CDA0C | cases: 原请求与本次rawData |
| director-entry | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md | EC0BE9BA64C300B486068EAC5C8AC4474406F2D2BAEA0BD6117A25DCFFD70372 | frontmatter；正文全部：从交付物开始、创作顺序、创作约定、提示词与视频交接、专业能力交接、按需深入、可选结构化交付 |
| platform-entry | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-platform/SKILL.md | 15ADBF7AF710BE30173AF4A6BAF5E5CA5B7CD30C404D6F553E0432E243077E2A | frontmatter；正文全部：从实际输入开始、忠实适配与交付、创作约定、按需读取、可选规范交接 |
| reference-frontmatter | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-reference/SKILL.md | 931B1F173FCD94B5E409E8CB44983662F6BA8885D216D9D5E819360AECE3159D | 仅frontmatter；无实际参考素材，未加载正文 |
| review-frontmatter | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/SKILL.md | 2F67E7CE86F8FDCB7B38CECDC9AE00E37F5CBDA5F15B36CFA24DB0EE3FE3965D | 仅frontmatter；本次为创作与授权局修，未启动独立评审流程，未加载正文 |
| image-route | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/routes/image-prompt.md | 8875D78177EDCE7AB4AAEA763BF0F6D3BDC6216EE1ACF3C215AAB661B96E5C08 | 全文：编译顺序、提示词精简关卡、参考与变换、关键帧准备度、平台适配、准确文字与排版、导入既有提示词、变体与负向约束 |
| shot-route | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/routes/shot-direction.md | C04957137F3F99CB3BBA46F0C9046A653DF490686867D8C0CAD57EDE90087388 | 全文：明确戏剧单元、摄影机与构图、镜头光照与时间、电影模式与编译、下游产物 |
| storyboard-route | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/routes/storyboard-rhythm.md | 10CE342B7E5BEB342F16942D653C3316C9FBE3758E6942C687C37E2560A2C601 | 全文；第一次合批回传有截断，随后定向补读31至69行及相邻剪辑接口 |
| repair-route | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/routes/review-repair.md | 9BEFE4FE6ECC4711E9AEB33121DE3AA3912D5A5122CCEA047793829B06481834 | 全文：基准、评审、修复归属、返回结果与新证据；仅用于局修边界，未作自评分 |
| prompt-detail | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/prompt-detail-standard.md | 17ADAF6034D97879F14FCDEFF40850FC7A0C890099254241F1CAE96A0C217914 | 标题索引；1至96行：表达原则、人物、人物情绪与表情生成、场景、镜头与分镜；100至162行：空间关系与调度、构图与摄影实现、灯光与曝光连续性、收音与声音空间、场记、场次与逐镜交付模板、图生视频；216至223行：交付前检查 |
| video-sound | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/video-sound-and-delivery.md | CFD0A201805AB58F05EBE5EDA1025359776EB78534CFB849472F728594DA6A16 | 标题索引；1至78行：视频意图、续写与生成段落边界、声音职责与提示表、精确文案与时间检查、交付与资源工作表 |
| motion-handoff | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/generation-diagnostics.md | 2AD6FD129D28D5B97853DB37B36A3E81582605DDF37AE6139376D671EBF40B9B | 标题索引；9至40行：证据阶段、风险工作表、运动交接 |
| change-impact-guide | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/drafts-and-change-impact.md | 84670321B3CB5A42B34120FB0EAD60B790E9DB05C923E87F04265392C9B4D94B | 标题索引；1至111行：工作草稿、修订工作表与恢复检查点、变更影响示例、只读变更影响查询及输入规则；第一次合批回传有截断，随后定向补读 |
| platform-adaptation | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-platform/references/optional/video-platform-adaptation.md | 9B5A4E163A6482704B43333547D16FFC0ED3542D9526599E49455460971BD7F9 | 标题索引；1至29行：使用正确的权威来源、能力证据层次与日期；49至110行：先定参考职责、模式选择、导演方案到复制稿、同一决定的文字与图像路径；154至173行：分平台交接、适配不是盲目拼接、外部人工交接与返回 |
| delivery-checker | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/scripts/check-delivery.mjs | 3147C6F5FAD4D4D32682A05F34ECA15337C6CA2B8C73C69EA96331A209F2E4A5 | 实际CLI执行；哈希及import行定位，未全量预读源码 |
| impact-checker | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/scripts/check-change-impact.mjs | 9E4192AC7B4722834F38293291601621305F90B414AB52E02D4D944C6096AE85 | 实际CLI执行；哈希及export/CLI/import行定位，未全量预读源码 |
| strict-json-runtime | D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/scripts/parse-json.mjs | 9C15621D8304BF6114CC4CB322409C8E59433409AC17950311725CDCBEBECF11 | 上述两个检查器实际导入执行；只读取哈希与import定位，无其他本地导入 |

## 实际Node工具结果

### CW-SPLIT-C02 · node skills/cineweave-director/scripts/check-delivery.mjs D:\Temp\cineweave-split-p4-current-run2-20261012\CW-SPLIT-C02-delivery-workbook.json

退出码：0。原生结果：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C02-delivery-result.native.json

```json
{
  "valid": true,
  "errors": [],
  "duration": {
    "numerator": "144",
    "denominator": "24"
  },
  "endTimecode": "00:00:06,000",
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

### CW-SPLIT-C03 · node skills/cineweave-director/scripts/check-delivery.mjs D:\Temp\cineweave-split-p4-current-run2-20261012\CW-SPLIT-C03-delivery-workbook.json

退出码：0。原生结果：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C03-delivery-result.native.json

```json
{
  "valid": true,
  "errors": [],
  "duration": {
    "numerator": "240",
    "denominator": "24"
  },
  "endTimecode": "00:00:10,000",
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

### CW-SPLIT-C06 · node skills/cineweave-director/scripts/check-delivery.mjs D:\Temp\cineweave-split-p4-current-run2-20261012\CW-SPLIT-C06-delivery-workbook.json

退出码：0。原生结果：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C06-delivery-result.native.json

```json
{
  "valid": true,
  "errors": [],
  "duration": {
    "numerator": "144",
    "denominator": "24"
  },
  "endTimecode": "00:00:06,000",
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

### CW-SPLIT-C08 · node skills/cineweave-director/scripts/check-delivery.mjs D:\Temp\cineweave-split-p4-current-run2-20261012\CW-SPLIT-C08-delivery-workbook.json

退出码：0。原生结果：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C08-delivery-result.native.json

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

### CW-SPLIT-C08 · node skills/cineweave-director/scripts/check-change-impact.mjs D:\Temp\cineweave-split-p4-current-run2-20261012\CW-SPLIT-C08-impact-workbook.json

退出码：2。原生结果：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C08-impact-result.native.json

```json
{
  "valid": true,
  "affected": [
    "REV-M",
    "REV-P",
    "REV-adjacent-continuity"
  ],
  "unaffected": [
    "REV-S01-locked",
    "REV-sound-intent"
  ],
  "needsReview": [
    "REV-adjacent-continuity"
  ],
  "errors": [],
  "scope": "plan_only",
  "changedSources": [
    "REV-G"
  ],
  "noOpChanges": [],
  "changeEvidence": [
    {
      "source": "REV-G",
      "fromRevision": 1,
      "toRevision": 2,
      "paths": [
        "/shots/REV-S02/camera"
      ],
      "status": "supplied_difference"
    }
  ],
  "sourceAuthorityVerified": false,
  "measurementVerified": false
}
```

退出码2为有效变更影响工作表仍有待审依赖，保留REV-adjacent-continuity复查；不改为全面通过。所有工具只支持其原生scope，不支持媒体质量声明。

## C08原文保留的字符比较

```json
[
  {
    "documentId": "REV-G",
    "sourceRevision": 1,
    "targetRevision": 2,
    "allowedContentReplacement": {
      "before": "桌南侧偏西略俯",
      "after": "桌南侧偏东略俯"
    },
    "necessaryVersionReplacement": "设计文本版本1 -> 设计文本版本2",
    "actualMatchesOnlyAuthorizedTransformation": true,
    "sourceCameraPhraseOccurrences": 1,
    "targetOldCameraPhraseOccurrences": 0,
    "note": "仅比较本次给定原文与正文字符，不使用rubric或评分；不证明媒体连续性"
  },
  {
    "documentId": "REV-M",
    "sourceRevision": 1,
    "targetRevision": 2,
    "allowedContentReplacement": {
      "before": "桌南侧偏西略俯",
      "after": "桌南侧偏东略俯"
    },
    "necessaryVersionReplacement": "文外版本标识",
    "actualMatchesOnlyAuthorizedTransformation": true,
    "sourceCameraPhraseOccurrences": 1,
    "targetOldCameraPhraseOccurrences": 0,
    "note": "仅比较本次给定原文与正文字符，不使用rubric或评分；不证明媒体连续性"
  },
  {
    "documentId": "REV-P",
    "sourceRevision": 1,
    "targetRevision": 2,
    "allowedContentReplacement": {
      "before": "桌南侧偏西略俯",
      "after": "桌南侧偏东略俯"
    },
    "necessaryVersionReplacement": "REV-P，版本1 -> REV-P，版本2",
    "actualMatchesOnlyAuthorizedTransformation": true,
    "sourceCameraPhraseOccurrences": 1,
    "targetOldCameraPhraseOccurrences": 0,
    "note": "仅比较本次给定原文与正文字符，不使用rubric或评分；不证明媒体连续性"
  }
]
```

## CW-SPLIT-C01 首版全文

最终主责：cineweave-director。必要辅助：无。首版路径：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C01-first-v1.md。SHA-256：23CDBE76F57ACE4DB3A78A827E254AEAE34FAED432183EAE2C16716009E3C6EC。

```text
《归潮》电影海报，4:5竖版，摄影写实，固定一个静止瞬间。蓝调暮色的海岸，一座旧灯塔位于画面左后方，圆柱外墙有褪色灰白涂层、细小剥落和盐蚀，底部深色木门关闭；右后方露出低平的海面与清楚的海平线，远岸不出现建筑灯火。石质门槛与门前粗糙石板干燥，人物脚下有真实接触阴影。

只有一位约三十五岁的成年女主，独自站在灯塔门口。她身形匀称，略长的方圆脸，平直眉、深棕眼睛、自然鼻梁和厚薄适中的嘴唇；肤色为暖中性，面颊保留细微肌肤纹理，无装饰性彩妆。黑色短发到耳下，侧分，发尾贴近颈侧。身穿深蓝色无图案棉外套，翻领、自然肩线、长袖，前襟闭合，袖口和下摆有克制的日常磨损；哑光棉布保留真实厚度和细密织纹，不出现徽标、印花或刺绣。下身为深灰长裤、黑色平底鞋。

女主身体略朝画面右侧的海面，双脚稳定落在石板上，肩颈微收而不耸起。右手垂于髋旁，手指牢靠握住唯一一盏黄铜提灯的上方提环，提灯低于腰部，完整可见；左手自然垂在身侧。她闭唇、不露齿，眉间轻收，视线落向画面右侧远处海平线，呈现重返此地时克制的迟疑，不看镜头，不做夸张悲泣。

提灯已点亮：磨旧黄铜框架与透明玻璃内是一枚暖黄色电灯，隐藏电池供电，不出现蜡烛、灯芯、火焰或燃烧。灯光从玻璃内向外发出，近距离照亮她的右手、外套右侧下部、附近门框与脚边少量石板，在黄铜边缘形成窄暖色高光；光照随距离减弱，不把整座灯塔或整片海岸照成金黄。暮色天空为大面积冷蓝漫射光源，从开放的海岸一侧照到她的脸、短发和外套上部，石墙与地面只作微弱反射补光。暖灯与冷环境光的位置、阴影和反射一致，脸部暗侧仍有可辨细节，黄铜高光和玻璃亮部保留层次。

眼平、轻微正侧面的全身取景，人物位于画面中下部略偏左，头顶与脚底均不裁切；灯塔门框把人物围入一个窄竖向空间，海面向右提供视线余地。焦点同时保护面部、右手、提灯和门框，远海略柔化但海平线清楚。以冷蓝、石灰白和深蓝为主色，暖黄只集中在提灯与其真实照明范围，细腻低对比的暗部，不添加光束、闪光特效或虚构轮廓灯。

画面上方约五分之一为干净、低纹理的暮色天空，片名“归潮”准确书写且只出现一次，位于上方中央，使用清晰、克制的浅灰白中文宋体，两字同一行、笔画完整，无副标题。下方约八分之一保留较暗、平整的署名安全区，本次保持空白，不生成任何署名或占位文字。全画面除这一次片名外不出现其他文字。不要闪电、火焰、额外人物、旁白文字、重复片名、乱码、水印或标志。
```

未决项：没有指定模型，以上是通用中文提示词；片名的实际拼写与出现次数仍需在出图后逐字检查。本次未生成图片。

## CW-SPLIT-C02 首版全文

最终主责：cineweave-director。必要辅助：无。首版路径：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C02-first-v1.md。SHA-256：DA6C70F222D1BD088E0ECB47A43BABA6467C0ECC0FF82D6C4F5E3B7904E783BB。

这是未绑定实际首图的 I2V 准备稿。服装、门厅细部和自然光是本次可撤销的原创设计；6秒是用户要求的作品时长，尚未核验为任何平台档位。

首图画面稿：

```text
16:9横版，摄影写实，安静、干燥的室内门厅，单一动作开始前的瞬间。关闭的素色门在画面右后方，浅灰墙面、低矮踢脚线与哑光石质地面清楚可辨；地面没有雨水或水迹。左侧画外窗透入柔和中性日光，在人物面部、衣料与地面形成方向一致的柔阴影，墙面微弱反射抬起暗部；不添加独立光束或装饰灯光。

一名成年女子站画面左侧，深棕发低束，穿米灰色无图案棉质长袖外套、深色长裤和平底鞋。她身体朝向右侧男子，双脚稳定，重心留在自己脚下；右手握着唯一一把收拢黑伞的弯柄，手指环抱柄的近侧，伞身垂下，伞尖真实触及干燥地面。黑色伞布紧收，不展开。她尚未送出伞柄；左手自然留在身侧。她双唇自然轻合，眉间略收，视线落在男子的脸上，神情克制而认真。

一名成年男子站画面右侧，短棕发，穿深灰无图案针织上衣、黑色长裤和深色鞋。身体略转向女子，双脚不移动；左手空着，放在身前偏低处，尚未伸向伞柄，右手自然留在身侧。他先看女子，嘴唇放松闭合，不预先触柄，不握伞，不承担伞的重量。两人之间是一步以内、伸手可达的递物距离，不需要跨步或弯腰。

摄影机固定在两人前方眼平位置，双人全景完整保留头、脚、伞柄与伞尖；两人的面部与将发生接触的伞柄位于同一清楚可读的纵深范围。伞柄靠近画面中部，不被身体、衣袖或门框遮挡，两只相关手有分开的可见轮廓。人物间距、黑伞及地面接触点都清楚，不使用会使指尖接触模糊的极浅景深。只有这两名成年人，没有第三人、字幕、文字、水印、雨或额外雨伞。
```

基于上述待制首图的完整运动稿：

```text
6秒，16:9横向摄影写实，单镜，摄影机全程固定在眼平双人全景；不切镜、不推拉、不摇移，焦点保持两张脸、右手持柄、左手指尖和伞尖均可辨。起点为干燥门厅中左侧成年女子右手握着收拢黑伞的弯柄、伞尖触地；右侧成年男子左手空着，尚未触柄。继承首图设计中的人物外观、衣料、关闭的门、干燥地面与左侧窗的中性柔光，不改变站位。

0至约0.6秒，女子看向男子，男子注意她。约0.6至2.8秒，女子用右手把弯柄朝男子缓慢送出一小段，肘部温和伸展，手指始终握住柄；伞尖顺着地面轻滑，继续触地，伞身不开合、不凭空悬起。她在送柄过程中平静、低声地对男子说唯一一句准确台词：“你拿走吧”。嘴唇与下颌按这句话自然运动，说完闭唇等待，不增添其他发音或旁白。

约2.8至4.4秒，男子先把目光从女子转到伞柄，随后才伸出空闲的左手；左手指尖从柄的另一侧靠近并清楚触到柄的表面，接触点不被女子的右手或衣袖盖住。他只轻触，不环握、不拉走，不接过伞的重量。女子保持右手原有握持，不松手，不继续把柄推过接触点。

约4.4至6秒，两人的手停留在当前可见接触关系中。女子右手持伞，男子左手指尖仍轻触柄，伞尖仍触地；女子继续看男子的脸，男子目光留在伞柄，双方不挪步、不加笑、泪或新的动作，停顿持续到结束。黑伞只有一把，保持收拢。

声音意图：女子说“你拿走吧”时声音清楚、克制，需与她的口型同步；轻微伞尖擦地声只随实际滑动出现，连续安静室内底声贯穿全镜。男子无台词，没有音乐、旁白或字幕。以上声音是待制作意图，尚未有真实音轨。时间分段是表演调度目标，需以实际候选核查。
```

现阶段缺实际首图及其逐项核对、目标平台／精确模型版本／界面／I2V模式资料、6秒和16:9控件证据、准确对白与口型的支持方式，以及真实声音。首图取得后须核对左女右男、女子右手持伞且尖触地、男子左手空闲、可达距离和无遮挡接触；若不一致，应先修该起点。本次没有绑定图片、生成媒体或提交任务。

## CW-SPLIT-C03 首版全文

最终主责：cineweave-director。必要辅助：无。首版路径：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C03-first-v1.md。SHA-256：E879EB056092B9DC9108FB25332C4361CDC2880F222718DC8FBCAFEA21576822。

工作稿版本1，来源为用户《钥匙归还》文本草稿版本1；没有实际媒体或平台绑定。以下构图与节奏细化保留原动作及接触顺序。时间范围左闭右开，S01为0至5秒，S02为5至10秒；在5秒直接连续硬切，省略时间为零、重演时间为零。

场次基线：单间修理铺，柜台沿东西方向；北侧只有穿深灰衬衫的成年店主，面向南；南侧只有穿浅灰无图案外套的成年学徒，面向北。东墙门向外开，地面干燥，西窗透入中性柔光，光源世界方位不因切镜改变。只有一枚黄铜钥匙，皮质钥匙袋位于柜台南缘。无对白、旁白、音乐及其他人物；室内环境底声在切点连续。

S01分镜，5秒，16:9：目的为完整展示钥匙从店主右手到学徒左手的交接。摄影机固定在柜台南侧眼平，双人中景包含两人上半身、柜台交接区域及完整双手；学徒侧后轮廓留在前景一侧，店主在中景，两人的手在中央桌面区域显露，不能被学徒躯干遮住。焦点和可读景深同时保护店主视线、钥匙与学徒左掌。首态为钥匙在店主右手，学徒左掌空着并摊在柜台上。0至约0.7秒店主先看空掌；约0.7至2.8秒右手缓慢将钥匙放入掌心；约2.8至3.5秒钥匙先接触掌心，然后店主才放开右手；约3.5至4.3秒学徒左指轻合握住钥匙；约4.3至5秒店主空着的右手退回自己身前，学徒保持已持有状态。只在钥匙接触掌心时有轻微金属碰掌声。出态钥匙由学徒左手持有，店主右手空着且已退回身前，双方仍在原柜台一侧。

S01独立视频稿：

```text
5秒，16:9横向摄影写实，单间修理铺。柜台沿东西方向，东墙门向外开，地面干燥；西窗中性柔光从西侧照入，人物、黄铜和柜台的明暗关系有同一光源来由。成年店主穿深灰衬衫，只站柜台北侧、面向南；成年学徒穿浅灰无图案外套，只站柜台南侧、面向北。没有其他人，没有对白、旁白或音乐。
摄影机固定在柜台南侧眼平，双人中景包含上半身、交接区域和完整双手。学徒在前景一侧，身体轮廓避开中央手部交接；店主在中景。保持视线、钥匙和掌心同时可读，不移动摄影机，不让衣袖遮住接触。
开始时唯一一枚黄铜钥匙在店主右手，学徒左掌空着，摊在柜台上。店主先看学徒空掌，再用右手缓慢把钥匙放入左掌；钥匙明确接触掌心后，店主才放开右手。学徒左指随后轻合，握住这同一枚钥匙。店主空着的右手退回自己身前，学徒不换手、不离开柜台南侧。结束时钥匙由学徒左手持有，店主右手空着，双方位置不变；在这一状态直接硬切到下一镜，不重复交接动作。
连续室内环境底声；钥匙接触掌心时只有轻微金属碰掌声，不添加钥匙落桌声、对白、音乐或多余动作。
```

S02分镜，5秒，16:9：目的为不间断展示同一枚钥匙换到学徒右手并收入袋内。摄影机固定在柜台南侧偏东，手部近景，与S01均在柜台南侧；画面包含学徒双手、钥匙与南缘皮质钥匙袋，店主空右手如入画只作为不动作的边缘信息。略调整构图以使右指取钥匙、左指放开和袋口都显露，不改变人物位置。入态严格接S01：学徒左手已握钥匙，店主右手空着，不能重置为空掌交接。镜内约0至1.6秒学徒右手从左手取出钥匙，右指先建立握持、左指再松开；约1.6至3.8秒右手将钥匙插入南缘袋口；约3.8至4.4秒钥匙完全进入袋后，右手才抽开；约4.4至5秒显示袋留在南缘、学徒双手空着。无新动作。西窗方向与光色不变，底声无断点；入袋时轻微皮革摩擦，无对白、旁白或音乐。

S02独立视频稿：

```text
5秒，16:9横向摄影写实，单间修理铺。柜台沿东西方向，北侧只有穿深灰衬衫的成年店主、面向南，南侧只有穿浅灰无图案外套的成年学徒、面向北；东墙门向外开，地面干燥。西窗中性柔光持续从世界西侧照入，沿用上一镜的光色与材质。唯一一枚黄铜钥匙和一只皮质钥匙袋，袋放在柜台南缘；没有其他人。
由上一镜直接连续硬切进入本镜，没有时间省略，没有交接重演。摄影机固定在柜台南侧偏东的手部近景，与上一镜在同一柜台轴线侧。画面完整保留学徒双手、钥匙、袋口和放袋位置；焦点保护取物接触和袋口，不被衣袖或手背遮挡，摄影机全程不动。
开始时同一枚钥匙已由学徒左手握住，店主右手空着，店主不参与本镜动作；学徒仍在柜台南侧。学徒右手先从左手中握住钥匙，建立稳定接触后，左指才松开，让右手取出钥匙；钥匙只有一枚，不复制、不落桌。随后学徒用右手把钥匙插入位于柜台南缘的皮质钥匙袋。钥匙完全进入袋内后，他才抽开右手。结束时钥匙留在袋内，学徒双手空着，袋仍在柜台南缘，店主右手仍空着；不再取出、移动或递还钥匙。
室内环境底声从上一镜无间断延续，入袋时只有轻微皮革摩擦；无对白、旁白、音乐、字幕或额外动作。
```

完整10秒视频母稿：

```text
连续两镜，共10秒，16:9横向摄影写实。单间修理铺：柜台沿东西方向，北侧只有穿深灰衬衫的成年店主、面向南，南侧只有穿浅灰无图案外套的成年学徒、面向北；东墙门向外开，地面干燥，西窗中性柔光从世界西侧照入。只有一枚黄铜钥匙，皮质钥匙袋放在柜台南缘。人物、服装、柜台一侧、物体数量、窗光与干燥状态贯穿两镜一致，没有其他角色、对白、旁白、音乐或字幕。
0至5秒S01，摄影机固定在柜台南侧眼平双人中景，包含上半身与完整手部交接，学徒的前景身体不遮挡钥匙和掌心。起点钥匙在店主右手，学徒左掌空着并摊在柜台上。店主先看空掌，再缓慢把钥匙放入左掌；钥匙先接触掌心，店主才放开右手；学徒左指随后轻合握住钥匙。到5秒，钥匙由学徒左手持有，店主空右手退回自己身前，双方仍在原侧。
5秒直接动作连续硬切，时间不省略，动作不重演。5至10秒S02，摄影机固定在柜台南侧偏东的手部近景，仍在同侧，双手、钥匙与柜台南缘的袋口清楚可见。开始时学徒左手已经握钥匙、店主右手空着。学徒右手从左手建立钥匙握持，左指再松开，右手取出同一枚钥匙；随后把钥匙插入柜台南缘的皮质钥匙袋。钥匙完全进入袋内后才抽开右手。10秒结束时钥匙在袋内，学徒双手空着，袋留南缘，店主右手仍空着，不加后续动作。
西窗光在两镜中保持同一世界方向，手部与道具不因切镜变色或改变木桌受光。室内环境底声连续；第一镜接触掌心时只有轻微金属碰掌声，第二镜入袋时轻微皮革摩擦；不增加其他声音事件。
```

连续性复查点：5秒边界的同一枚钥匙、学徒左手持有和店主右手空着逐项对应；两台机位都在南侧，近景里的身体左右不可被镜像替换；西窗方向按世界方位核对，底声持续。现在只能检查文字与时间规划；动作速度、真实接触、镜间接缝和声音同步等待实际媒体。

## CW-SPLIT-C06 首版全文

最终主责：cineweave-director。必要辅助：cineweave-platform。首版路径：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C06-first-v1.md。SHA-256：ED644618A50E5B3F6728F5054226E9C5C3B8AFE8253DB95B88E5DFA84761870E。

创作工作稿版本1。保留 Seedance 平台意向；目前不知道精确模型版本、网页界面和模式。“8张参考、原生声音、支持6秒”均是未核验传闻。下面先按文字定义完整起点，适配稿仅供离线准备。

完整中文创作母稿：

```text
6秒，16:9横向摄影写实，单镜。安静修理工作间，一名约四十岁的成年修理工男子站在木质工作桌北侧，短灰黑发，穿无图案的橄榄灰工作衬衫，袖口在手腕处收拢。桌面干燥整洁，中央只有一只浅棕色长方木盒；盒盖通过北侧木铰链与盒身连接，盖初始闭合，盒中放着唯一一只浅木色雕刻木鸟。东侧画外窗提供柔和中性日光，木纹与双手保持清楚，桌面及盒下有方向一致的柔接触阴影，没有会遮挡手部的烟、光束或反光。

摄影机固定在桌南侧偏东、略高于盒盖的位置，轻微俯拍中近景，画面包含修理工胸口以上、双手、完整木盒与盒口。构图同时保留他看盒内的视线和左右手接触点，盒盖抬起时不遮住木鸟；焦点保护双手、北侧铰链及盒内，不切镜，不推拉、摇移或改变焦点。

开始时男子左手按稳盒身左侧，手掌贴住盒身、手指不压在盒盖的运动路径内；右手握住闭合盒盖南侧前沿，目光在木盒上。0至约0.8秒保持这一清楚的准备状态。约0.8至4.5秒，右手持续抓稳盖前沿，缓慢把盖绕固定的北侧铰链向上掀起；盒盖只沿铰链允许的圆弧转动，不脱离、不横移，左手持续按稳盒身，不换手、不松开，盒身不滑动。盖逐步打开，木鸟从盒口遮挡下显露；男子的视线随显露移到盒内木鸟，眉眼略集中，闭唇，不增加惊呼或夸张反应。

约4.5至6秒，盒盖打开至接近竖直，盒内一只浅木色雕刻木鸟完整可辨，保持静止。男子右手仍扶住盖的前沿，制止盖继续转动或回落；左手仍按稳盒身，双手不变位，不取出木鸟，不合盖。静止查看状态持续到结束，只有一人、一盒、一鸟。

声音意图仅为细小、干燥的木铰链摩擦声，声源在盒北侧铰链，随盖开始转动而出现，随转动减速而减弱，停住后消失；不加对白、旁白、音乐、室内底声或其他拟音。不生成字幕、画面文字或水印。6秒分段是创作节奏要求，尚未有实际画面、声音或生成返回。
```

可准备的 Seedance 适配工作稿（精确版本／界面／模式未核验，不是可直接提交稿）：

```text
6秒，16:9横向摄影写实，单镜固定机位。干燥修理工作间，成年男子短灰黑发，穿橄榄灰无图案工作衬衫，站木桌北侧。桌中央一只浅棕长方木盒，盖初始闭合，北侧木铰链固定连接盒盖与盒身；盒内只有一只浅木色雕刻木鸟。东侧窗的中性柔光照明，保持人物、木纹、光向和接触阴影一致。
摄影机位于桌南侧偏东，略俯中近景，同时看清男子目光、双手、盒口和北侧铰链；全程固定，焦点保护接触点与盒内，不切镜、不推拉或摇移。
开始时左手按稳盒身左侧，右手握闭合盒盖南侧前沿。短暂停留后，右手缓慢把盖绕北侧铰链向上掀起，左手始终按稳盒身。盖沿铰链圆弧转动，盒身不动，右手不离盖。随着盒口显露，男子看见盒内静止的木鸟，目光落向木鸟，闭唇、神情略集中。盖到接近竖直时停下，最后右手仍扶盖、左手仍按盒身，木鸟完整显露，不取鸟、不合盖、不加新动作，停顿至6秒结束。
声音仅为盒北侧木铰链随转动发出的轻微干涩摩擦声，停盖即停止；无对白、旁白、音乐、环境底声或其他拟音，无字幕和额外人物。
```

准备设置与核对项目：

| 项目 | 本次要求或证据 | 当前状态 |
| --- | --- | --- |
| 平台意向 | Seedance | 保留；未改换 |
| 精确模型技术ID／版本、网页名称／地址 | 用户未提供 | 未知 |
| 模式 | 当前只能准备文字驱动起点；是否有T2V文本入口未核验 | 未知，不冒称已选择或已配置 |
| 画幅 | 请求16:9 | 控件与实际返回未知 |
| 时长 | 请求6秒 | 传闻不能证明6秒档位；不预写伪参数 |
| 8张参考 | 用户听闻，没有实际图片 | 数量、模态、总数／分类限制及槽位语义均未知；本案不需要填满参考 |
| 原生声音 | 只需要木铰链摩擦声 | 支持方式、开关、音轨语义及实际效果未知 |
| 摄影机／负向／seed等控件 | 未提供资料 | 不虚构控件或语法 |
| 能力资料与查阅日期 | 只有本次用户传闻；未提供任何来源 | 没有外部核验日期与live证据 |
| 素材与返回 | 图片、音频、任务和媒体均没有 | 没有绑定或生成 |

核对时需要准确网页及精确版本／模式的资料，分别确认6秒、16:9、参考上限和职责、原生声音能否表达仅铰链声，以及账号实际开放的控件。若声音不支持，应保留这份声音意图作独立人工声音制作交接；这会改变声音实现路径，不能宣称已完成。若时长或模式不支持，回到原6秒设计说明冲突，不暗改时长、拆镜或更换平台。本次未安装、访问服务或提交生成。

## CW-SPLIT-C08 首版全文

最终主责：cineweave-director。必要辅助：cineweave-platform。首版路径：D:/Temp/cineweave-split-p4-current-run2-20261012/CW-SPLIT-C08-first-v1.md。SHA-256：927FF2EB7C11E7A3B2D749B4050CF435B408137A9E79DEB49DD9FA5AB2F1BBDE。

本次修订：REV-G、REV-M、REV-P均由版本1形成工作稿版本2。唯一内容变量为REV-S02摄影机位置，“桌南侧偏西略俯”改为“桌南侧偏东略俯”；仍为固定手部特写。REV-S01及其他字句保留，版本标识作必要同步。没有沿用旧评审、生成媒体或改写故事。

REV-G版本2，完整镜头组设计文本：

```text
项目：雨停以后；镜头组REV-G，设计文本版本2，未生成媒体。锁定：成年男子一人，短黑发，浅灰衬衫、深蓝围裙；同一只浅木色长方盒，盖通过北侧铰链连接盒身。北墙工具架、西侧窗、中央工作桌；男子在桌北侧；西窗中性柔光始终不变；无对白、旁白或音乐。
REV-S01：16:9，4秒，桌南侧眼平中景，摄影机固定。男子左手扶盒身左侧，右手扶盒身右侧。盒盖闭合。他右手沿盒身移到盖的南侧前沿并轻握，左手持续按稳盒身；出点时盒盖仍闭合，右手已握前沿，左手未变。
REV-S02：16:9，4秒，桌南侧偏东略俯手部特写，摄影机固定，直接连续硬切。入点承接同一盒盖闭合、右手握前沿、左手按稳盒身。右手沿北侧铰链把盖向上掀到接近竖直，左手保持盒身不动；结束时盒内露出一只浅木色雕刻小鸟，右手仍扶盖，左手仍按盒身。室内底声、细小木铰链摩擦属于声音意图。
```

REV-M版本2，完整平台中立视频母稿：

```text
连续两镜，共8秒，16:9摄影写实。单间木工房中，短黑发成年男子穿浅灰衬衫和深蓝围裙，站中央工作桌北侧；北墙工具架和西窗位置固定，只有西窗中性柔光。桌中央一只浅木色长方盒，北侧铰链连接盒盖与盒身。
0至4秒REV-S01，桌南侧眼平中景，摄影机固定。左手扶盒身左侧，右手从盒身右侧移到盖南侧前沿，轻握；盖保持闭合。到切点，右手握前沿，左手按稳盒身。
4至8秒REV-S02，连续硬切到桌南侧偏东略俯的手部特写，摄影机固定，盖仍闭合。右手沿北侧铰链向上掀盖到接近竖直，左手持续按稳盒身。露出盒内一只浅木色雕刻小鸟，结束时右手仍扶盖、左手仍按盒身。保持同一男子、衣袖、盒子、木纹、光向与接触状态；无对白、旁白、音乐或额外人物。室内底声和细小木铰链摩擦为后续声音意图。
```

REV-P版本2，完整测试界面适配工作稿：

```text
现有适配工作稿REV-P，版本2，仅针对合成测试夹具FrameForge/Motion 1.0网页T2V。两镜分别提交；未提交任何生成任务。
REV-S01复制正文：16:9摄影写实木工房单镜。短黑发成年男子穿浅灰衬衫、深蓝围裙，站中央桌北侧；北墙工具架，西窗柔和中性日光。桌中央浅木色长方盒闭合，铰链在北侧。摄影机固定在桌南侧眼平中景。男子左手按稳盒身左侧，右手从盒身右侧移到盖南侧前沿并轻握；至结束盖仍闭合，左手未变、右手已握前沿。无额外人物，无对白、旁白、音乐。
REV-S01设置：画幅16:9；时长4秒。
REV-S02复制正文：16:9摄影写实木工房单镜，承接上一镜。相同男子、衣袖、盒子、北墙工具架与西窗中性柔光。男子在桌北侧，浅木色盒仍在桌中央，北侧铰链不变；开始时左手按稳盒身、右手已握闭合盒盖的南侧前沿。摄影机固定在桌南侧偏东略俯手部特写。右手沿铰链向上掀盖到接近竖直，左手持续按稳盒身，露出盒内一只浅木色小鸟；结束时右手仍扶盖，左手仍按盒身。无额外人物，无对白、旁白、音乐。
REV-S02设置：画幅16:9；时长4秒。
独立声音说明：室内底声与木铰链摩擦只作为后续人工声音制作意图，本夹具无原生声音设置，未有实际音轨。
```

上述适配仅使用用户提供的虚构夹具资料fixture-frameforge-motion-1-web-t2v版本1，夹具日期2026-10-12：FrameForge（虚构）／Motion 1.0（虚构）／网页界面（虚构）／T2V。离线映射为每镜一个中文文本框，画幅下拉选16:9，时长下拉选4秒；这是夹具内声明的设置映射，实际解析值和返回值不存在。模式是资料限定，不额外编一个模式控件。无原生摄影机轨道、参考槽、声音设置、负向框、seed、参数尾或分镜导入功能，不添加这些控件或语法。

REV-P中REV-S02原有的“相同男子、衣袖、盒子”依赖上一镜上下文；两个独立文本提交不能证明供应商能看到前次文本。源稿也未在这一单镜复制正文中独立展开短黑发、浅灰衬衫、深蓝围裙。该缺口原已存在，本次只列为待补／另修范围，不擅自扩写授权之外的字句，也不称它已满足独立提交的全部条件。

相邻连续性需复查：REV-S01出点与REV-S02入点的同一盒盖闭合、右手握南侧前沿、左手按稳盒身；新东侧视角下左右手不能镜像，北侧铰链仍在世界北侧；仍从桌南侧切到南侧偏东，不重置动作或省略时间。改变观察角度后，须核对右手、左手、铰链和露出的木鸟是否互相遮挡；西窗仍在世界西侧，画面上的明暗位置可随观察角度改变，不能换光源。木纹、衣袖、盒体位置及室内底声应在切点一致。这些是等待新视图或实际片段的复查项；现在没有媒体验收证据。

附带的变更影响工作表与8秒时间线将使用随包Node检查器实际运行。工具仅核对声明依赖和算术，不能证明真实构图、接触、光线或接缝已经通过。


## 执行限制

- 五案在同一个独立子代理上下文中按顺序执行，未为每案另起全新上下文；因此只主张本run与其他run隔离，不主张五案间完全上下文隔离。
- 输入只来自指定raw文件；产品知识只来自四个指定Skill根及其相邻资源。
- 未读取旧答案、其他run、rubric、研究、计划、skill-sources或devtests；没有自评分、排名或比较前轮结论。
- 四入口先读取frontmatter；只继续读取导演与平台正文，参考和评审入口正文未加载。
- 两次合批内容回传出现工具显示截断，对影响本次交付的章节定向补读；记录所请求的章节范围。
- 时间检查使用24/1的设计计算时基，不声称媒体采集帧率或平台帧率已知。
- 未调用供应商、访问服务、安装、生成媒体、批准、提交或改动产品源码；所有输出在独立D:/Temp目录。
- 模型、token用量、推理档位、总生成延迟没有可核验元数据，均为null。
