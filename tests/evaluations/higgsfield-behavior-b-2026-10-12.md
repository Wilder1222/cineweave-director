# 当前本地 CineWeave 独立行为记录 B

日期：2026-10-12。工作目录：`D:/study/projects/cineweave-codex-skills/cineweave-director`。

本记录仅按当前本地SKILL及相关路由／指南处理三个互相独立的请求。没有读取cinematic-cases.json、计划、预期量表或父代理报告；没有供应商调用、图像生成、安装、部署、提交、媒体观察或数值自评。唯一仓库写入是本记录；工作表保存于仓库外临时目录。

## 读取来源与原始字节SHA256

哈希由每次对应读取命令的Get-FileHash实际取得，表示所读取文件的原始字节；部分读取仍列出整份文件哈希。以下是实际读取的文件，不把链接但未读文档列为依据。

| 文件 | 本次读取范围 | SHA256 |
| --- | --- | --- |
| skills/cineweave-director/SKILL.md | 全文 | `3FEE202FC872876AC998C1CAEE010730DF8F409DB0A6FA39B5CD3CF7EF7B3FD4` |
| skills/cineweave-director/references/optional/drafts-and-change-impact.md | 全文 | `84670321B3CB5A42B34120FB0EAD60B790E9DB05C923E87F04265392C9B4D94B` |
| skills/cineweave-director/references/routes/review-repair.md | 全文 | `50BCEA9FE3D1B371572A3B5F18E1142D0666734F72C584E28EB71EA5B2ECFB3E` |
| skills/cineweave-director/references/routes/production-plan.md | 全文 | `2DAF3977BB9ED78859899C9B0FC6B1DDBBB0D81F32A2897920E76DF045A962A5` |
| skills/cineweave-director/references/optional/video-timing-and-handles.md | 全文 | `E61680F79223554F3AEF05C21D18510B9C80E044BFFC594DD264721FE6CC737A` |
| skills/cineweave-director/references/optional/video-sound-and-delivery.md | 全文 | `454F689EB1C229552C520647A0EC9829295F748D5CF5D866F80CA5FBCF7EC15F` |
| skills/cineweave-director/references/optional/generation-diagnostics.md | 全文 | `9F8B6BE9C021D97A9CECAF79A4F93F75810ED3C299670300E4C48C29E0A8460B` |
| skills/cineweave-director/references/optional/ensemble-direction-and-review.md | 全文 | `A3F41E181A4382ED4A23835C696797837FAC9CFC939FC3F86203443CAB680BAE` |
| skills/cineweave-director/references/optional/video-platform-adaptation.md | 标题定位与第168–174行外部人工交接章节 | `9B5A4E163A6482704B43333547D16FFC0ED3542D9526599E49455460971BD7F9` |
| skills/cineweave-director/references/optional/prompt-detail-standard.md | 标题定位、第1–95行与第216–224行；人物、镜头与交付前检查 | `0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59` |
| skills/cineweave-director/references/optional/tagged-video-nodes.md | 全文 | `08E5C326A9E073791E16C6C7C939C5F6FC8D6DD13EC6061D34C635A3411E5D35` |
| skills/cineweave-director/scripts/check-video-plan.mjs | --help、关键词定位、前59行和第150–321行；随后实际执行 | `C8D3DAE44543E85A494238A4953904E513094A16091B0385F69E9938B6E7000B` |

另外记录实际执行工具及执行依赖的原始字节哈希，区分“使用工具”与“读过源码”。

| 文件 | 使用范围 | SHA256 |
| --- | --- | --- |
| skills/cineweave-director/scripts/check-change-impact.mjs | 实际CLI执行；未检视源码 | `9E4192AC7B4722834F38293291601621305F90B414AB52E02D4D944C6096AE85` |
| skills/cineweave-director/scripts/check-shot-review.mjs | 实际CLI执行；未检视源码 | `BB69F60D8794F3329BC4B7AF772D05AD01A28C001C7345F1DE63BFA1E3D7D1C2` |
| skills/cineweave-director/scripts/check-audio-returns.mjs | check-video-plan执行依赖；未检视源码 | `523722EF0E3200E02CB47174C1B26BED39E14E296C7E508796FF19501BBA80B1` |
| skills/cineweave-director/scripts/parse-json.mjs | 只读检查器执行依赖；未检视源码 | `9C15621D8304BF6114CC4CB322409C8E59433409AC17950311725CDCBEBECF11` |

## CD-E63

### 原始请求（逐字）

```text
成年信使外套由红改蓝；红色不是故事线索。S1只有脸且衣领完全不入画，S2完整显示外套，S2提示词和S2评审消费该外观。场景拓扑、身份和环境声不消费衣色。给变更影响、保留项和S2完整修订稿，不重做整片。
```

### 完整原始答复

本次只改成年信使外套的颜色。红色不承担故事线索，因此故事因果无需调整。下表依据你给定的消费关系；修订号只是本次工作标签，未提供的正式版本、哈希与素材位置保持未知。

| 项目 | 本次影响与处理 |
| --- | --- |
| 信使外观中的外套颜色 | 红改蓝；建立新的外观修订，不覆盖旧来源。身份描述不随衣色改变。 |
| S1 | 仅有脸且衣领完全不入画，不消费外套颜色；保留原镜头及其采用结果，不重做。 |
| S2 | 完整显示外套，直接消费衣色；原外观相关验收结论过期，保留原素材作为修订来源，只处理S2。 |
| S2提示词 | 受影响；将全部外套衣料的红色改为蓝色，删除与此冲突的红衣说明，下面给完整局部修订稿。 |
| S2评审 | 受影响；旧评审归档保留，新评审绑定蓝衣修订和新候选，不能沿用旧的衣色通过项。 |
| 场景拓扑、角色身份、环境声 | 明确不消费衣色，保留现有稿件、素材、采用关系和相关评审。 |
| 其他未列产物 | 不作全片失效推断；若存在未声明的衣色消费者，再单独补查。 |

保留的范围包括原S2外套版型与材质、成年身份与原相貌、既定表演、空间关系、构图、摄影、视觉基线和声音。衣色修改可能使外套局部明暗与色彩呈现需要复核，但不授权更改光源、曝光或整片调色。

原S2正文和实际素材没有提供，无法逐字还原其中的地点、动作与摄影细节。以下交付完整的S2有界编辑稿，以原S2为输入保持这些已有内容；它是可交给外部工具的修订说明，未假定目标工具已经支持或已经完成编辑。若所用路径只接受重生成，须在原S2完整稿中同步替换衣色字段，保留原有完整叙事内容，不能把未知部分重新编造成另一镜。

```text
<节点>S2</节点>
<目标>把成年信使外套的红色改为蓝色，保留原S2的叙事、表演和摄影。</目标>
<参考>以待交接的原S2图像或视频为唯一编辑基底；沿用该镜头既定人物身份、场景与构图，原素材当前未提供供观察。</参考>
<修改范围>只调整外套衣料原本红色区域的固有色为蓝色。领片、前襟、肩部、两袖、袖口和下摆中属于该衣料且实际可见的部分统一呈蓝色；保持原有明暗层次、织纹、褶皱、磨损、缝线、遮挡、接触与阴影。已有不同材质的纽扣、饰件、内搭及人物皮肤不随外套一并染蓝。</修改范围>
<保留>成年信使的面部结构、发型、肤色、体态与身份；原外套版型、长度、领型、闭合方式、口袋和饰件；原S2主体位置、完整外套的可见范围、肢体姿态、视线与表情。若输入为视频，沿用原动作顺序、运动相位、方向、速度、持物与接触、时长及采用边界。场景拓扑、建筑与道具位置、构图、机位、焦点、景深、运镜、实际光源、曝光与既定视觉基线均沿用原S2；保持原环境声与已有声音关系。</保留>
<验收>整件实际可见外套的衣料均为蓝色，没有漏改红色衣片，也没有将皮肤、内搭、饰件、道具或背景误染蓝。蓝色衣料仍随原光照形成连续的明暗与材质响应，不改变全画面调色。外套仍完整显示，人物身份、场景位置及原表演保持可读；若是视频，逐帧检查衣色不在蓝红间跳变，并在真实采用入出点复查与S1的脸部、视线、动作状态和声音衔接。</验收>
<约束>单一变更变量为外套衣料的颜色。红色不承担故事线索，不新增与颜色相关的剧情、对白或音效。不得为展示蓝色而重设计人物、移动场景、改变景别、裁切外套、替换动作或重调全片颜色。此稿是有界修订计划，具体编辑能力与新结果效果待外部证据核验。</约束>
```

S2复查只针对实际受影响内容及相邻采用边界：检查整件外套是否一致呈蓝色、有没有红衣残留或误染，以及身份、版型、褶皱、遮挡、动作和场景是否保留；若是视频，再看衣色的时间稳定性与真实出入点。S1脸部与S2脸部、视线／动作状态和声场的衔接仍需实际素材对照，不因S1无需重做就自动认定剪辑连续性已经通过。

已实际运行随包变更影响检查器：声明范围内受影响的是S2、S2提示词和S2评审；S1、场景拓扑、身份和环境声未发现衣色依赖。该结果为`plan_only`，不核验真实来源或媒体。另运行S2提示词的聚焦评审工作表：输入有效、所选视角覆盖完整，连续性因缺素材仍为`unknown`，`reviewComplete: false`。这里完成了修订稿和规划检查，S2新候选的实际验收尚未完成。

## CD-E65

### 原始请求（逐字）

```text
外部生成任务已返回真实任务ID，用户报告等待超时但状态仍running；S1与S2已有采用结果，只有S3未返回。写人工恢复步骤，不调用服务、不重提整批，不宣称任务已经完成。
```

### 完整原始答复

当前应按“等待超时，原任务仍在运行”处理。超时描述的是这次等待结束；你报告的外部状态仍是`running`，不能把它写成终态失败或媒体质量失败。S1和S2已有采用结果，恢复范围只围绕尚未返回的S3。

1. **留下恢复检查点。** 在现有记录旁保留原任务的真实ID、准确创作稿版本、原请求值和已有外部解析值；缺失项标为待补。保留S1、S2已采用候选的真实来源、采用区间及原评审记录，不替换、不解除采用，也不把本次记录当成重新验收。记录等待超时原文、外部最后报告的`running`状态及其实际报告时间；没有时间就不编造时间。
2. **从原任务恢复查看。** 在用户原先提交所用的账号／工作空间和任务历史中，以已经返回的原任务ID打开或重接任务，使用已有的查看状态、刷新或恢复等待入口。这里是人工操作建议；本次不调用服务。不要点击“重新生成”“复制提交”或重提整批。若该ID对应整批任务，先在它已有的输出映射中定位S3；只有实际返回了子任务ID时才记录它，不猜测子任务编号。
3. **核对请求、解析与返回。** 对照原任务的创作来源、镜号和候选映射，确认缺的是S3返回，而非S3被漏列、返回位置未加载或关联错镜。保留原始错误／状态报告；任务参数未知不妨碍重接原任务，也不授权改稿。
4. **按后续真实状态继续。** 若仍是`running`或排队状态，沿外部界面给出的等待或查询条件继续重接原任务，保留当前检查点；不自行捏造查询间隔、完成时间或重试次数。若界面无法重接，记录“状态无法再次取得”，继续保留原ID与最后已知状态，利用该服务现有的任务历史／人工支持入口查原任务；不能据此认定任务已经失败。
5. **S3真正返回后再验收。** 关联S3实际返回的候选／Take、可访问媒体、返回时长与尺寸、可得的解析设置和原S3创作稿。先评审S3用户硬要求和实际可用区间，再在S2真实采用出点与S3拟采用入点比较身份、动作相位、方向、道具、空间和声音。通过这些检查后才提出S3采用；单次返回或下载成功都不等于整片完成。
6. **只有明确终态失败才进入有界修复。** 若外部来源明确报告任务结束且失败，保存原ID、终态和错误原文，先区分输入、参数、认证、限流等原因。之后只为S3提出受证据支持的修正或单镜替代；任何新的提交仍是另一个外部步骤，不以恢复为名重复生成S1和S2。若S3返回了媒体但质量有问题，再基于实际失败区间选择一个根因变量。

可直接保存在原项目记录旁的恢复摘要：

| 字段 | 当前可记录内容 |
| --- | --- |
| 当前目标 | 重接原任务，取回并评审S3；保留S1、S2采用 |
| 原任务ID | 使用已返回的真实ID；本条消息没有给出具体字符串，不另造ID |
| 最新已报告状态 | 用户报告`running`；本次未查询，不标为重新核实 |
| 等待问题 | 用户报告等待超时；错误原文与发生时间待补 |
| 已采用结果 | S1、S2，沿用既有真实来源、采用区间与评审 |
| 未返回结果 | S3，暂无可评审媒体 |
| 下一步 | 用户在原外部任务页重接／查看原ID，保存真实更新，再将S3返回材料带回评审 |
| 完成条件 | S3实际返回并完成相关验收与采用边界检查，之后才判断序列是否完成 |

这是一份人工恢复步骤和检查点；原任务当前是否更新、S3是否完成及实际质量仍未知。

## CD-E66

### 原始请求（逐字）

```text
两条旁白只给返回元数据：中文3900ms、英文5200ms，两个片段原本各采用4秒。准确文案为“灯先借给你。”与“Keep the light until morning.”。时长档位未知，背景音乐可跨镜共用。给声画采用与修订方案，不加速、不裁台词、不声称已经听过。
```

### 完整原始答复

3900ms的中文返回声明在长度上可以容纳于4秒；5200ms的英文返回声明超过4秒1200ms，必须调整声画窗口。两条准确文案保持原样：

- 中文：“灯先借给你。”
- 英文：“Keep the light until morning.”

这些是你提供的返回元数据，我没有访问或听过音频。元数据可以用于时间算术，不能证明台词实际逐字正确、头尾有多少静音、语气、清晰度、响度或真实同步。

先按两个独立旁白片段安排。下表的英文6秒与入点0.5秒是本次可撤销的剪辑提案；实际画面、帧率、既有剪辑节拍及可用余量未提供，不把它们当作已获采用的结果。

| 片段 | 原采用 | 声音完整采用与修订提案 | 画面处理 |
| --- | --- | --- | --- |
| 中文 | 4秒 | 暂保留4秒。完整来源区间`[0,3900)ms`一次正常播放，暂从片段0秒开始，预计到3.9秒结束；剩余0.1秒只是算术空隙，不能保证足够呼吸或反应。 | 保留原片段。听审后若必要停顿或画面反应不够，只扩展该片段或调整明确的声画锚点，不截话。 |
| 英文 | 4秒 | 将采用窗口暂改为6秒。完整来源区间`[0,5200)ms`一次正常播放；源0ms对到片段0.5秒，预计5.7秒结束，随后保留0.3秒画面。 | 先检查原素材是否有足够自然延续可采用；有则扩展出点。没有可用延续时，只规划英文片段的自然动作延续或有动机补镜，不冻结画面、不把未知尾段当成现成素材。 |

英文的理论最小窗口是5.2秒，尚未包含必要前摇、呼吸、反应或剪辑余量；6秒只是当前草稿安排。中文与英文的返回时长不能当成请求生成时长。若需要新视频，分别记录“有效采用长度、入出点余量、最低生成需求、实际请求选择、实际返回长度”。具体生成档位现在未知，先用`最低需求 = 入点余量 + 有效采用长度 + 出点余量`记录需求，待取得准确模型／界面的有依据时长政策，再向上选能容纳完整计划的最小可用档位，不直接宣布6秒或其他数值是受支持档位。

若未来提供的政策没有长度可以容纳英文完整旁白，就在保持全文与正常播放的条件下设计有动机的跨镜声音桥、受支持续写或补镜。声音桥要写清旁白源区间、同步锚点、前后镜头采用边界和目标窗口，并复核整段相邻时间线；不能只是让英语音频越出4秒后停止记录。

背景音乐可以使用跨镜共享的一条连续轨，不要求每镜重启或每镜生成一份。若这两个片段按中文后接英文顺次剪辑，草稿总采用时间由8秒变为10秒，音乐轨据此覆盖10秒，英文旁白在总时间`[4.5,9.7)秒`播放；音乐的实际可用长度、接点和对白遮蔽需要另行听审。若二者是同一作品的中文／英文语言版本，则分别维护4秒与6秒版本，复用同一音乐来源并分别安排边界，不把两条旁白叠播。复用音乐不等于已经完成循环、混音或声画同步，也不循环旁白。

如采用字幕，文字依旧分别是“灯先借给你。”与“Keep the light until morning.”；字幕时间先对齐各自全文的计划窗口，拿到音频后按真实语音起止套底。旁白本身不自动要求画内口型同步，画面若另有可见说话人物再核对该要求。

本次额外以**明确标为数值夹具的24fps假设**运行本地视频工作表检查器，未建立真实音频来源／版本／候选绑定。3900ms完整播放需至少94帧；5200ms需至少125帧。原4秒是96帧，英文原窗口被报告为超窗；修订英文6秒为144帧，将源起点对到第12帧，完整音频映射在5.7秒结束，声明窗口可容纳全文。修订工作表`valid: true`且两条`fitsDeclaredWindow: true`，仍有`DURATION_SELECTION`未决、`declarationComplete: false`，`measurementVerified/mediaVerified/capabilityVerified`均为`false`。这是按给定数字的算术复核，不能提升为声音已采用或已经听审。

下一步需要真实可访问的两条音频及其准确来源／候选关系、真实帧率、原片段的可用区间和目标时长政策。取得后先逐字听审并核对实长，再套底检查完整句尾、反应时间、相邻切点及音乐接点；本稿已给出可执行的声画修订方向，实际采用保持待验。

## 实际本地检查记录

Node实际版本：`v22.15.0`。临时目录：`C:\Users\ww\AppData\Local\Temp\cineweave-behavior-b-20261012`。所有工具只读工作表；下面的输入与输出完整保存，不把工具有效性当作媒体或批准结果。

CD-E65只交付人工恢复步骤，没有运行任何外部任务查询／重提工具。本记录也没有真实任务ID字符串，未造ID。

CD-E66实际音频来源、版本及候选ID均未提供，故工具输入用显式fixture标签作数值试算，measurement.basis为user_supplied并注明来自请求元数据。fixture不是返回媒体、真实候选或正式采用回流。24fps、零生成余量及英文6秒窗口均属于本次数值模型，非实际素材／平台参数。未填写audioPairing，不推定普通项目每镜一条音频。

### impact

实际命令：

```powershell
node 'skills/cineweave-director/scripts/check-change-impact.mjs' 'C:\Users\ww\AppData\Local\Temp\cineweave-behavior-b-20261012\impact.json'
```

进程实际退出码：`0`。

输入工作表：

```json
{
  "format": "cineweave-change-impact",
  "canonical": false,
  "artifacts": [
    {
      "id": "appearance.courier",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "shot.S1",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "shot.S2",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "prompt.S2",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "review.S2",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "scene.topology",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "identity.courier",
      "revision": 1,
      "dependencyCoverage": "complete"
    },
    {
      "id": "audio.ambience",
      "revision": 1,
      "dependencyCoverage": "complete"
    }
  ],
  "dependencies": [
    {
      "consumer": "shot.S1",
      "source": "appearance.courier",
      "sourceRevision": 1,
      "paths": [
        "/face"
      ]
    },
    {
      "consumer": "shot.S2",
      "source": "appearance.courier",
      "sourceRevision": 1,
      "paths": [
        "/wardrobe/color"
      ]
    },
    {
      "consumer": "prompt.S2",
      "source": "shot.S2",
      "sourceRevision": 1,
      "paths": [
        "/promptHandoff"
      ]
    },
    {
      "consumer": "review.S2",
      "source": "prompt.S2",
      "sourceRevision": 1,
      "paths": [
        ""
      ]
    },
    {
      "consumer": "review.S2",
      "source": "shot.S2",
      "sourceRevision": 1,
      "paths": [
        ""
      ]
    }
  ],
  "changes": [
    {
      "source": "appearance.courier",
      "fromRevision": 1,
      "toRevision": 2,
      "paths": [
        "/wardrobe/color"
      ],
      "before": "red",
      "after": "blue",
      "reason": "用户明确成年信使外套由红改蓝；红色不是故事线索，仅修订消费衣色的S2及其提示词、评审。"
    }
  ]
}
```

实际stdout全文：

```json
{
  "valid": true,
  "affected": [
    "shot.S2",
    "prompt.S2",
    "review.S2"
  ],
  "unaffected": [
    "shot.S1",
    "scene.topology",
    "identity.courier",
    "audio.ambience"
  ],
  "needsReview": [],
  "errors": [],
  "scope": "plan_only",
  "changedSources": [
    "appearance.courier"
  ],
  "noOpChanges": [],
  "changeEvidence": [
    {
      "source": "appearance.courier",
      "fromRevision": 1,
      "toRevision": 2,
      "paths": [
        "/wardrobe/color"
      ],
      "status": "supplied_difference"
    }
  ],
  "sourceAuthorityVerified": false,
  "measurementVerified": false
}
```

### review

实际命令：

```powershell
node 'skills/cineweave-director/scripts/check-shot-review.mjs' 'C:\Users\ww\AppData\Local\Temp\cineweave-behavior-b-20261012\s2-review.json'
```

进程实际退出码：`1`。

输入工作表：

```json
{
  "source": {
    "type": "prompt",
    "id": "CD-E63-S2-local-edit-draft",
    "version": 2
  },
  "mode": "focused",
  "roles": [
    "prompt",
    "continuity"
  ],
  "shotIds": [
    "S2"
  ],
  "reviews": [
    {
      "role": "prompt",
      "shotId": "S2",
      "status": "pass",
      "criterion": "只改变外套衣料红改蓝，保留完整外套及未消费衣色的内容。",
      "observation": "修订稿的修改范围只调整衣料固有色；保留与约束段锁定人物、原S2空间与动作、完整外套及原环境声。",
      "sourceLocator": "S2 修订稿 v2 / 修改范围、保留、约束"
    },
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "unknown",
      "criterion": "新S2在真实采用边界衔接S1，衣色更改不连带改变脸部、动作、视线与声音。",
      "observation": "只提供S1裁切与S2外套可见范围的文字事实；没有原S2全文、原素材、新候选及实际采用边界，无法核验上述连续性。"
    }
  ],
  "prompt": {
    "text": "<节点>S2</节点>\n<目标>把成年信使外套的红色改为蓝色，保留原S2的叙事、表演和摄影。</目标>\n<参考>以待交接的原S2图像或视频为唯一编辑基底；沿用该镜头既定人物身份、场景与构图，原素材当前未提供供观察。</参考>\n<修改范围>只调整外套衣料原本红色区域的固有色为蓝色。领片、前襟、肩部、两袖、袖口和下摆中属于该衣料且实际可见的部分统一呈蓝色；保持原有明暗层次、织纹、褶皱、磨损、缝线、遮挡、接触与阴影。已有不同材质的纽扣、饰件、内搭及人物皮肤不随外套一并染蓝。</修改范围>\n<保留>成年信使的面部结构、发型、肤色、体态与身份；原外套版型、长度、领型、闭合方式、口袋和饰件；原S2主体位置、完整外套的可见范围、肢体姿态、视线与表情。若输入为视频，沿用原动作顺序、运动相位、方向、速度、持物与接触、时长及采用边界。场景拓扑、建筑与道具位置、构图、机位、焦点、景深、运镜、实际光源、曝光与既定视觉基线均沿用原S2；保持原环境声与已有声音关系。</保留>\n<验收>整件实际可见外套的衣料均为蓝色，没有漏改红色衣片，也没有将皮肤、内搭、饰件、道具或背景误染蓝。蓝色衣料仍随原光照形成连续的明暗与材质响应，不改变全画面调色。外套仍完整显示，人物身份、场景位置及原表演保持可读；若是视频，逐帧检查衣色不在蓝红间跳变，并在真实采用入出点复查与S1的脸部、视线、动作状态和声音衔接。</验收>\n<约束>单一变更变量为外套衣料的颜色。红色不承担故事线索，不新增与颜色相关的剧情、对白或音效。不得为展示蓝色而重设计人物、移动场景、改变景别、裁切外套、替换动作或重调全片颜色。此稿是有界修订计划，具体编辑能力与新结果效果待外部证据核验。</约束>"
  }
}
```

实际stdout全文：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": false,
  "expectedRows": 2,
  "missing": [],
  "openItems": [
    {
      "role": "continuity",
      "shotId": "S2",
      "status": "unknown"
    }
  ],
  "prompt": {
    "nonWhitespaceCodePoints": 712,
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

### audioBefore

实际命令：

```powershell
node 'skills/cineweave-director/scripts/check-video-plan.mjs' 'C:\Users\ww\AppData\Local\Temp\cineweave-behavior-b-20261012\audio-before.json' --evaluation-date 2026-10-12
```

进程实际退出码：`1`。

输入工作表：

```json
{
  "format": "cineweave-video-workbook/v1",
  "frameRate": {
    "numerator": 24,
    "denominator": 1
  },
  "nodes": [
    {
      "id": "SEG_ZH",
      "type": "dialogue",
      "prompt": "<节点>SEG_ZH</节点><目标>中文旁白窗口数值试算，非媒体交接。</目标><约束>24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。</约束><台词>灯先借给你。</台词><声线>实际声线未提供，保留未知。</声线><语气>返回音频未听审，保留未知。</语气><情绪>返回音频未听审，保留未知。</情绪><时间线>原采用窗口为96帧；时长档位未知。</时间线>",
      "timing": {
        "editFrames": 96,
        "headFrames": 0,
        "tailFrames": 0
      },
      "durationPolicy": {
        "status": "unknown"
      },
      "cues": [
        {
          "id": "VO_ZH",
          "track": "dialogue",
          "startFrame": 0,
          "endFrame": 94,
          "speaker": "fixture-中文旁白",
          "text": "灯先借给你。",
          "authoritativeText": "灯先借给你。",
          "delivery": "voiceover"
        }
      ]
    },
    {
      "id": "SEG_EN",
      "type": "dialogue",
      "prompt": "<节点>SEG_EN</节点><目标>英文旁白窗口数值试算，非媒体交接。</目标><约束>24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。</约束><台词>Keep the light until morning.</台词><声线>实际声线未提供，保留未知。</声线><语气>返回音频未听审，保留未知。</语气><情绪>返回音频未听审，保留未知。</情绪><时间线>原采用窗口为96帧；时长档位未知。</时间线>",
      "timing": {
        "editFrames": 96,
        "headFrames": 0,
        "tailFrames": 0
      },
      "durationPolicy": {
        "status": "unknown"
      },
      "cues": [
        {
          "id": "VO_EN",
          "track": "dialogue",
          "startFrame": 0,
          "endFrame": 96,
          "speaker": "fixture-英文旁白",
          "text": "Keep the light until morning.",
          "authoritativeText": "Keep the light until morning.",
          "delivery": "voiceover"
        }
      ]
    }
  ],
  "audioReturns": [
    {
      "id": "fixture-AR-SEG_ZH",
      "mediaType": "audio",
      "source": "fixture:CD-E66-numeric-SEG_ZH",
      "version": "fixture-numeric-only",
      "candidateId": "fixture-candidate-SEG_ZH",
      "durationMs": 3900,
      "measurement": {
        "basis": "user_supplied",
        "source": "用户请求给定的返回元数据，仅作数值夹具；没有实际音频来源、版本或候选ID。"
      },
      "bindings": [
        {
          "id": "fixture-AB-SEG_ZH",
          "nodeId": "SEG_ZH",
          "cueId": "VO_ZH",
          "sourceRangeMs": {
            "start": 0,
            "end": 3900
          },
          "usage": "full",
          "sync": {
            "sourceMs": 0,
            "targetFrame": 0
          }
        }
      ]
    },
    {
      "id": "fixture-AR-SEG_EN",
      "mediaType": "audio",
      "source": "fixture:CD-E66-numeric-SEG_EN",
      "version": "fixture-numeric-only",
      "candidateId": "fixture-candidate-SEG_EN",
      "durationMs": 5200,
      "measurement": {
        "basis": "user_supplied",
        "source": "用户请求给定的返回元数据，仅作数值夹具；没有实际音频来源、版本或候选ID。"
      },
      "bindings": [
        {
          "id": "fixture-AB-SEG_EN",
          "nodeId": "SEG_EN",
          "cueId": "VO_EN",
          "sourceRangeMs": {
            "start": 0,
            "end": 5200
          },
          "usage": "full",
          "sync": {
            "sourceMs": 0,
            "targetFrame": 0
          }
        }
      ]
    }
  ]
}
```

实际stdout全文：

```json
{
  "valid": false,
  "errors": [
    {
      "code": "AUDIO_DURATION_FIT",
      "message": "fixture-AB-SEG_EN returned selection exceeds its adopted cue; revise the window instead of accelerating or cutting speech",
      "nodeId": "SEG_EN"
    },
    {
      "code": "AUDIO_SYNC_WINDOW",
      "message": "fixture-AB-SEG_EN declared sync placement crosses its adopted cue boundary",
      "nodeId": "SEG_EN"
    },
    {
      "code": "AUDIO_SYNC_WINDOW",
      "message": "fixture-AB-SEG_EN crosses the adopted edit window without a declared sound bridge/handle",
      "nodeId": "SEG_EN"
    }
  ],
  "warnings": [
    {
      "code": "DURATION_UNKNOWN",
      "message": "Supply the selected model/surface duration policy; no duration was invented",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "SPEECH_TIMING_UNVERIFIED",
      "message": "The frame window for VO_ZH does not measure actual speech duration",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "DURATION_UNKNOWN",
      "message": "Supply the selected model/surface duration policy; no duration was invented",
      "nodeId": "SEG_EN"
    },
    {
      "code": "SPEECH_TIMING_UNVERIFIED",
      "message": "The frame window for VO_EN does not measure actual speech duration",
      "nodeId": "SEG_EN"
    },
    {
      "code": "AUDIO_MEASUREMENT_UNVERIFIED",
      "message": "Returned durations, source provenance and authorization are declarations; no waveform, consent or synchronization was verified",
      "nodeId": null
    }
  ],
  "pending": [
    {
      "code": "DURATION_SELECTION",
      "message": "No generation duration selected",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "DURATION_SELECTION",
      "message": "No generation duration selected",
      "nodeId": "SEG_EN"
    }
  ],
  "nodes": [
    {
      "id": "SEG_ZH",
      "type": "dialogue",
      "timing": {
        "valid": true,
        "errors": [],
        "warnings": [
          {
            "code": "DURATION_UNKNOWN",
            "message": "Supply the selected model/surface duration policy; no duration was invented",
            "nodeId": null
          }
        ],
        "requiredFrames": 96,
        "requiredDurationMs": 4000,
        "editWindow": [
          0,
          96
        ],
        "selectedDurationMs": null,
        "plannedFrameCapacity": null,
        "extraTailFrames": null,
        "durationSelection": "unresolved",
        "capabilityVerified": false
      },
      "plainTextPreview": "节点：SEG_ZH\n目标：中文旁白窗口数值试算，非媒体交接。\n约束：24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。\n台词：灯先借给你。\n声线：实际声线未提供，保留未知。\n语气：返回音频未听审，保留未知。\n情绪：返回音频未听审，保留未知。\n时间线：原采用窗口为96帧；时长档位未知。"
    },
    {
      "id": "SEG_EN",
      "type": "dialogue",
      "timing": {
        "valid": true,
        "errors": [],
        "warnings": [
          {
            "code": "DURATION_UNKNOWN",
            "message": "Supply the selected model/surface duration policy; no duration was invented",
            "nodeId": null
          }
        ],
        "requiredFrames": 96,
        "requiredDurationMs": 4000,
        "editWindow": [
          0,
          96
        ],
        "selectedDurationMs": null,
        "plannedFrameCapacity": null,
        "extraTailFrames": null,
        "durationSelection": "unresolved",
        "capabilityVerified": false
      },
      "plainTextPreview": "节点：SEG_EN\n目标：英文旁白窗口数值试算，非媒体交接。\n约束：24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。\n台词：Keep the light until morning.\n声线：实际声线未提供，保留未知。\n语气：返回音频未听审，保留未知。\n情绪：返回音频未听审，保留未知。\n时间线：原采用窗口为96帧；时长档位未知。"
    }
  ],
  "audioReturnChecks": [
    {
      "returnId": "fixture-AR-SEG_ZH",
      "bindingId": "fixture-AB-SEG_ZH",
      "nodeId": "SEG_ZH",
      "cueId": "VO_ZH",
      "usage": "full",
      "requiredFrames": 94,
      "availableFrames": 94,
      "fitsDeclaredWindow": true,
      "measurementVerified": false
    },
    {
      "returnId": "fixture-AR-SEG_EN",
      "bindingId": "fixture-AB-SEG_EN",
      "nodeId": "SEG_EN",
      "cueId": "VO_EN",
      "usage": "full",
      "requiredFrames": 125,
      "availableFrames": 96,
      "fitsDeclaredWindow": false,
      "measurementVerified": false
    }
  ],
  "declarationComplete": false,
  "capabilityVerified": false,
  "measurementVerified": false,
  "mediaVerified": false,
  "providerExecution": false,
  "scope": "Worksheet syntax, declared bindings, caller-supplied date comparisons and exact timing arithmetic only. Returned duration, provenance and authorization are declarations. No capability, consent, measurement, semantic, media or platform-import verification.",
  "localization": {
    "locale": "zh-CN",
    "summary": "检查未通过，请先修正错误。",
    "errors": [
      {
        "code": "AUDIO_DURATION_FIT",
        "nodeId": "SEG_EN",
        "message": "返回音频采用长度超过提示时窗；应调整方案，不自动加速或截台词。",
        "detail": "fixture-AB-SEG_EN returned selection exceeds its adopted cue; revise the window instead of accelerating or cutting speech"
      },
      {
        "code": "AUDIO_SYNC_WINDOW",
        "nodeId": "SEG_EN",
        "message": "同步锚点映射使声音越过采用区间，请调整或明确声音桥。",
        "detail": "fixture-AB-SEG_EN declared sync placement crosses its adopted cue boundary"
      },
      {
        "code": "AUDIO_SYNC_WINDOW",
        "nodeId": "SEG_EN",
        "message": "同步锚点映射使声音越过采用区间，请调整或明确声音桥。",
        "detail": "fixture-AB-SEG_EN crosses the adopted edit window without a declared sound bridge/handle"
      }
    ],
    "warnings": [
      {
        "code": "DURATION_UNKNOWN",
        "nodeId": "SEG_ZH",
        "message": "尚未提供目标模型／界面的时长政策，不会编造时长。",
        "detail": "Supply the selected model/surface duration policy; no duration was invented"
      },
      {
        "code": "SPEECH_TIMING_UNVERIFIED",
        "nodeId": "SEG_ZH",
        "message": "帧窗口是计划，不是对实际语音时长的测量。",
        "detail": "The frame window for VO_ZH does not measure actual speech duration"
      },
      {
        "code": "DURATION_UNKNOWN",
        "nodeId": "SEG_EN",
        "message": "尚未提供目标模型／界面的时长政策，不会编造时长。",
        "detail": "Supply the selected model/surface duration policy; no duration was invented"
      },
      {
        "code": "SPEECH_TIMING_UNVERIFIED",
        "nodeId": "SEG_EN",
        "message": "帧窗口是计划，不是对实际语音时长的测量。",
        "detail": "The frame window for VO_EN does not measure actual speech duration"
      },
      {
        "code": "AUDIO_MEASUREMENT_UNVERIFIED",
        "nodeId": null,
        "message": "时长、来源及授权只完成声明，不证明音频、同意或同步已验证。",
        "detail": "Returned durations, source provenance and authorization are declarations; no waveform, consent or synchronization was verified"
      }
    ],
    "pending": [
      {
        "code": "DURATION_SELECTION",
        "nodeId": "SEG_ZH",
        "message": "尚未选择可用生成时长。",
        "detail": "No generation duration selected"
      },
      {
        "code": "DURATION_SELECTION",
        "nodeId": "SEG_EN",
        "message": "尚未选择可用生成时长。",
        "detail": "No generation duration selected"
      }
    ],
    "scope": "仅检查工作表语法、声明绑定、显式评估日期和精确时间算术；返回时长及授权仍是声明，不核验平台能力、同意、实测、语义、媒体或导入。"
  }
}
```

### audioAfter

实际命令：

```powershell
node 'skills/cineweave-director/scripts/check-video-plan.mjs' 'C:\Users\ww\AppData\Local\Temp\cineweave-behavior-b-20261012\audio-after.json' --evaluation-date 2026-10-12
```

进程实际退出码：`0`。

输入工作表：

```json
{
  "format": "cineweave-video-workbook/v1",
  "frameRate": {
    "numerator": 24,
    "denominator": 1
  },
  "nodes": [
    {
      "id": "SEG_ZH",
      "type": "dialogue",
      "prompt": "<节点>SEG_ZH</节点><目标>中文旁白窗口数值试算，非媒体交接。</目标><约束>24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。</约束><台词>灯先借给你。</台词><声线>实际声线未提供，保留未知。</声线><语气>返回音频未听审，保留未知。</语气><情绪>返回音频未听审，保留未知。</情绪><时间线>修订采用窗口为96帧；时长档位未知。</时间线>",
      "timing": {
        "editFrames": 96,
        "headFrames": 0,
        "tailFrames": 0
      },
      "durationPolicy": {
        "status": "unknown"
      },
      "cues": [
        {
          "id": "VO_ZH",
          "track": "dialogue",
          "startFrame": 0,
          "endFrame": 94,
          "speaker": "fixture-中文旁白",
          "text": "灯先借给你。",
          "authoritativeText": "灯先借给你。",
          "delivery": "voiceover"
        }
      ]
    },
    {
      "id": "SEG_EN",
      "type": "dialogue",
      "prompt": "<节点>SEG_EN</节点><目标>英文旁白窗口数值试算，非媒体交接。</目标><约束>24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。</约束><台词>Keep the light until morning.</台词><声线>实际声线未提供，保留未知。</声线><语气>返回音频未听审，保留未知。</语气><情绪>返回音频未听审，保留未知。</情绪><时间线>修订采用窗口为144帧；时长档位未知。</时间线>",
      "timing": {
        "editFrames": 144,
        "headFrames": 0,
        "tailFrames": 0
      },
      "durationPolicy": {
        "status": "unknown"
      },
      "cues": [
        {
          "id": "VO_EN",
          "track": "dialogue",
          "startFrame": 12,
          "endFrame": 137,
          "speaker": "fixture-英文旁白",
          "text": "Keep the light until morning.",
          "authoritativeText": "Keep the light until morning.",
          "delivery": "voiceover"
        }
      ]
    }
  ],
  "audioReturns": [
    {
      "id": "fixture-AR-SEG_ZH",
      "mediaType": "audio",
      "source": "fixture:CD-E66-numeric-SEG_ZH",
      "version": "fixture-numeric-only",
      "candidateId": "fixture-candidate-SEG_ZH",
      "durationMs": 3900,
      "measurement": {
        "basis": "user_supplied",
        "source": "用户请求给定的返回元数据，仅作数值夹具；没有实际音频来源、版本或候选ID。"
      },
      "bindings": [
        {
          "id": "fixture-AB-SEG_ZH",
          "nodeId": "SEG_ZH",
          "cueId": "VO_ZH",
          "sourceRangeMs": {
            "start": 0,
            "end": 3900
          },
          "usage": "full",
          "sync": {
            "sourceMs": 0,
            "targetFrame": 0
          }
        }
      ]
    },
    {
      "id": "fixture-AR-SEG_EN",
      "mediaType": "audio",
      "source": "fixture:CD-E66-numeric-SEG_EN",
      "version": "fixture-numeric-only",
      "candidateId": "fixture-candidate-SEG_EN",
      "durationMs": 5200,
      "measurement": {
        "basis": "user_supplied",
        "source": "用户请求给定的返回元数据，仅作数值夹具；没有实际音频来源、版本或候选ID。"
      },
      "bindings": [
        {
          "id": "fixture-AB-SEG_EN",
          "nodeId": "SEG_EN",
          "cueId": "VO_EN",
          "sourceRangeMs": {
            "start": 0,
            "end": 5200
          },
          "usage": "full",
          "sync": {
            "sourceMs": 0,
            "targetFrame": 12
          }
        }
      ]
    }
  ]
}
```

实际stdout全文：

```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "code": "DURATION_UNKNOWN",
      "message": "Supply the selected model/surface duration policy; no duration was invented",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "SPEECH_TIMING_UNVERIFIED",
      "message": "The frame window for VO_ZH does not measure actual speech duration",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "DURATION_UNKNOWN",
      "message": "Supply the selected model/surface duration policy; no duration was invented",
      "nodeId": "SEG_EN"
    },
    {
      "code": "SPEECH_TIMING_UNVERIFIED",
      "message": "The frame window for VO_EN does not measure actual speech duration",
      "nodeId": "SEG_EN"
    },
    {
      "code": "AUDIO_MEASUREMENT_UNVERIFIED",
      "message": "Returned durations, source provenance and authorization are declarations; no waveform, consent or synchronization was verified",
      "nodeId": null
    }
  ],
  "pending": [
    {
      "code": "DURATION_SELECTION",
      "message": "No generation duration selected",
      "nodeId": "SEG_ZH"
    },
    {
      "code": "DURATION_SELECTION",
      "message": "No generation duration selected",
      "nodeId": "SEG_EN"
    }
  ],
  "nodes": [
    {
      "id": "SEG_ZH",
      "type": "dialogue",
      "timing": {
        "valid": true,
        "errors": [],
        "warnings": [
          {
            "code": "DURATION_UNKNOWN",
            "message": "Supply the selected model/surface duration policy; no duration was invented",
            "nodeId": null
          }
        ],
        "requiredFrames": 96,
        "requiredDurationMs": 4000,
        "editWindow": [
          0,
          96
        ],
        "selectedDurationMs": null,
        "plannedFrameCapacity": null,
        "extraTailFrames": null,
        "durationSelection": "unresolved",
        "capabilityVerified": false
      },
      "plainTextPreview": "节点：SEG_ZH\n目标：中文旁白窗口数值试算，非媒体交接。\n约束：24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。\n台词：灯先借给你。\n声线：实际声线未提供，保留未知。\n语气：返回音频未听审，保留未知。\n情绪：返回音频未听审，保留未知。\n时间线：修订采用窗口为96帧；时长档位未知。"
    },
    {
      "id": "SEG_EN",
      "type": "dialogue",
      "timing": {
        "valid": true,
        "errors": [],
        "warnings": [
          {
            "code": "DURATION_UNKNOWN",
            "message": "Supply the selected model/surface duration policy; no duration was invented",
            "nodeId": null
          }
        ],
        "requiredFrames": 144,
        "requiredDurationMs": 6000,
        "editWindow": [
          0,
          144
        ],
        "selectedDurationMs": null,
        "plannedFrameCapacity": null,
        "extraTailFrames": null,
        "durationSelection": "unresolved",
        "capabilityVerified": false
      },
      "plainTextPreview": "节点：SEG_EN\n目标：英文旁白窗口数值试算，非媒体交接。\n约束：24fps为本次试算假设；保持全文一次正常播放，不加速、不裁台词；来源与候选标签均为fixture。\n台词：Keep the light until morning.\n声线：实际声线未提供，保留未知。\n语气：返回音频未听审，保留未知。\n情绪：返回音频未听审，保留未知。\n时间线：修订采用窗口为144帧；时长档位未知。"
    }
  ],
  "audioReturnChecks": [
    {
      "returnId": "fixture-AR-SEG_ZH",
      "bindingId": "fixture-AB-SEG_ZH",
      "nodeId": "SEG_ZH",
      "cueId": "VO_ZH",
      "usage": "full",
      "requiredFrames": 94,
      "availableFrames": 94,
      "fitsDeclaredWindow": true,
      "measurementVerified": false
    },
    {
      "returnId": "fixture-AR-SEG_EN",
      "bindingId": "fixture-AB-SEG_EN",
      "nodeId": "SEG_EN",
      "cueId": "VO_EN",
      "usage": "full",
      "requiredFrames": 125,
      "availableFrames": 125,
      "fitsDeclaredWindow": true,
      "measurementVerified": false
    }
  ],
  "declarationComplete": false,
  "capabilityVerified": false,
  "measurementVerified": false,
  "mediaVerified": false,
  "providerExecution": false,
  "scope": "Worksheet syntax, declared bindings, caller-supplied date comparisons and exact timing arithmetic only. Returned duration, provenance and authorization are declarations. No capability, consent, measurement, semantic, media or platform-import verification.",
  "localization": {
    "locale": "zh-CN",
    "summary": "结构与算术检查通过；仍需核验未决声明和实际媒体。",
    "errors": [],
    "warnings": [
      {
        "code": "DURATION_UNKNOWN",
        "nodeId": "SEG_ZH",
        "message": "尚未提供目标模型／界面的时长政策，不会编造时长。",
        "detail": "Supply the selected model/surface duration policy; no duration was invented"
      },
      {
        "code": "SPEECH_TIMING_UNVERIFIED",
        "nodeId": "SEG_ZH",
        "message": "帧窗口是计划，不是对实际语音时长的测量。",
        "detail": "The frame window for VO_ZH does not measure actual speech duration"
      },
      {
        "code": "DURATION_UNKNOWN",
        "nodeId": "SEG_EN",
        "message": "尚未提供目标模型／界面的时长政策，不会编造时长。",
        "detail": "Supply the selected model/surface duration policy; no duration was invented"
      },
      {
        "code": "SPEECH_TIMING_UNVERIFIED",
        "nodeId": "SEG_EN",
        "message": "帧窗口是计划，不是对实际语音时长的测量。",
        "detail": "The frame window for VO_EN does not measure actual speech duration"
      },
      {
        "code": "AUDIO_MEASUREMENT_UNVERIFIED",
        "nodeId": null,
        "message": "时长、来源及授权只完成声明，不证明音频、同意或同步已验证。",
        "detail": "Returned durations, source provenance and authorization are declarations; no waveform, consent or synchronization was verified"
      }
    ],
    "pending": [
      {
        "code": "DURATION_SELECTION",
        "nodeId": "SEG_ZH",
        "message": "尚未选择可用生成时长。",
        "detail": "No generation duration selected"
      },
      {
        "code": "DURATION_SELECTION",
        "nodeId": "SEG_EN",
        "message": "尚未选择可用生成时长。",
        "detail": "No generation duration selected"
      }
    ],
    "scope": "仅检查工作表语法、声明绑定、显式评估日期和精确时间算术；返回时长及授权仍是声明，不核验平台能力、同意、实测、语义、媒体或导入。"
  }
}
```

### 只读检查结果的实际限制

- 变更影响结果为plan_only，sourceAuthorityVerified与measurementVerified均为false；依赖覆盖complete只依据本请求给定关系的局部工作表声明。
- S2聚焦评审valid与coverageComplete为true，reviewComplete为false，连续性unknown。实际CLI退出码为1；本地指南描述有效未解决时为2，本记录保留真实退出码并未修改工具或指南。
- 英文原4秒窗口出现AUDIO_DURATION_FIT与AUDIO_SYNC_WINDOW，属于给定数值模型的窗口冲突，不是已观察声音质量失败。
- 修订数值工作表实际CLI退出码为0、valid为true，但declarationComplete为false、durationSelection为unresolved；测量、媒体、能力和执行验证均为false。此退出码不得解释为声音已通过验收。
- 仍未知：原S2完整文稿与媒体、新候选、真实采用边界、实际任务状态更新和S3媒体、两条音频实际来源与内容、真实帧率、平台时长政策、可用画面延续和真实音乐接点。

## 追加更正：直接识别Node子进程退出码

本次保留以上原始答复、工作表与原始工具日志。原“review”段把exec_command外层返回的exit_code 1写成了检查器的实际CLI退出码，这一身份判断不准确；该外层值不能用来认定Node子进程本身返回1，也不能据此判断指南或工具存在退出码缺陷。

对同一份已保存的s2-review.json，以Node的spawnSync直接启动check-shot-review.mjs并读取child.status，实际得到childExitCode 2，符合指南对有效但未解决评审的说明。输出仍为valid true、coverageComplete true、reviewComplete false，errors为空，唯一未决项为S2 continuity unknown；stderr为空。输入在本次复核前后字节一致；脚本在本次复核前后字节一致，且SHA256与上文执行工具哈希一致。

本次外层命令的exit_code为0，它是复核包装程序成功输出记录的状态；内层检查器退出码明确来自child.status，二者分别记录。此更正只修正退出码归属，不改变原答复、评审结论或媒体验证边界，也不提出指南／代码缺陷。

直接子进程复核命令全文：

```powershell
@'
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const scriptPath = "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\scripts\\check-shot-review.mjs";
const inputPath = "C:\\Users\\ww\\AppData\\Local\\Temp\\cineweave-behavior-b-20261012\\s2-review.json";
const sha256 = bytes => createHash("sha256").update(bytes).digest("hex").toUpperCase();
const inputBefore = readFileSync(inputPath);
const sourceBefore = readFileSync(scriptPath);
const child = spawnSync(process.execPath, [scriptPath, inputPath], { encoding: "utf8", windowsHide: true });
const inputAfter = readFileSync(inputPath);
const sourceAfter = readFileSync(scriptPath);
console.log(JSON.stringify({
  command: { executable: process.execPath, args: [scriptPath, inputPath] },
  childExitCode: child.status,
  childSignal: child.signal,
  childError: child.error ? String(child.error) : null,
  stdout: child.stdout,
  stderr: child.stderr,
  inputUnchanged: inputBefore.equals(inputAfter),
  inputSHA256: sha256(inputBefore),
  sourceUnchanged: sourceBefore.equals(sourceAfter),
  sourceSHA256: sha256(sourceBefore)
}, null, 2));
'@ | node --input-type=module
```

本次exec_command外层返回exit_code：`0`。

实际stdout全文（保留内层stdout字符串）：

```json
{
  "command": {
    "executable": "C:\\Program Files\\nodejs\\node.exe",
    "args": [
      "D:\\study\\projects\\cineweave-codex-skills\\cineweave-director\\skills\\cineweave-director\\scripts\\check-shot-review.mjs",
      "C:\\Users\\ww\\AppData\\Local\\Temp\\cineweave-behavior-b-20261012\\s2-review.json"
    ]
  },
  "childExitCode": 2,
  "childSignal": null,
  "childError": null,
  "stdout": "{\n  \"valid\": true,\n  \"scope\": \"plan_only\",\n  \"coverageComplete\": true,\n  \"reviewComplete\": false,\n  \"expectedRows\": 2,\n  \"missing\": [],\n  \"openItems\": [\n    {\n      \"role\": \"continuity\",\n      \"shotId\": \"S2\",\n      \"status\": \"unknown\"\n    }\n  ],\n  \"prompt\": {\n    \"nonWhitespaceCodePoints\": 712,\n    \"limit\": null\n  },\n  \"errors\": [],\n  \"limitation\": \"仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。\",\n  \"localization\": {\n    \"locale\": \"zh-CN\",\n    \"summary\": \"输入有效，评审仍有未决项或没有适用的通过项。\"\n  }\n}\n",
  "stderr": "",
  "inputUnchanged": true,
  "inputSHA256": "51C4765244A35C2BAC870CFE772D82BEA5DA9648669744B900FCABC4E4B2144C",
  "sourceUnchanged": true,
  "sourceSHA256": "BB69F60D8794F3329BC4B7AF772D05AD01A28C001C7345F1DE63BFA1E3D7D1C2"
}
```


