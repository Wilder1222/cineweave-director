# E17–E24 口语对白修订与读回

日期：2026-11-07。依据：`dialogue-style-guide.md`、现行八集完整场景与全部镜头字段。范围为E17至E24全部27场、96镜、161个英语cue；其中96个cue修改英语/中文/语气，65个保留。没有以改动比例为目标。镜号、场次、人物、镜数、镜头时长、发声时间窗和故事结果保持，合计1582秒（26分22秒）。

本报告为文字与导演计划评审，不是演员朗读、口型、音频或生成视频验收。主编译器仍需把最新JSON回流到剧本、提示词、字幕和浏览页。

## 逐集、逐场覆盖

| 集 | 场次全覆盖 | 修改/总cue | 此轮处理与保留 |
| --- | --- | --- | --- |
| E17 | SC01、SC02、SC03 | 10 / 19 | 证人用实际动作回答，律师私下用日期与仍在的证据说后果；保留法官排除现场物证、保留警局清点所得枪与笔记的正式语言。A控制青年、搭档开包的分工不变。 |
| E18 | SC01、SC02、SC03 | 18 / 20 | 更正直接重读“Nobody opened the files.”并承认无法证实；记者留言只交代来意，来源用面试和搜索结果说损失；文件原文与自己的判断分开，附件去向仍未知。按主编复查把法务索取物改成source files，避免暗示诺拉持有莉娜原件。 |
| E19 | SC01、SC02、SC03 | 8 / 20 | 公司说批准和版本，家属拒签说“我们家的视频”；母亲回应孩子等修模型的愤怒，不发表回忆金句。点餐时客气、断翼、周六承诺和让出接电话位置保留。 |
| E20 | SC01、SC02、SC03 | 15 / 18 | 律师电话逐项问条件；私下追问“申请”究竟能不能强制，认罪后果落在判多久、纽约撤案与能否出去；把公告句改为对媒体的具体叮嘱，把母亲安排改为本人申请通话。 |
| E21 | SC01、SC02、SC03、SC04 | 18 / 21 | 用摆出的两份清单打断记者的抢结论；医生确实打开签认、附件没进医学复核队列、公司提前收悉报告三层分开；撤下请求限于本人可联系账号，莉娜保留继续签表的责任句。孩子与鲸的自然短句保留。 |
| E22 | SC01、SC02、SC03 | 10 / 23 | 门外给再谈机会，交回准备纸后自行回答；庭外问“是不是自己的决定”，用递交回执回应进度。正式罪名、风险确认、故意杀人意图及亲口承认开枪致死完整保留，未改成意外、被迫或只表达愤怒。 |
| E23 | SC01、SC02、SC03 | 8 / 19 | 庭上事实对应略收紧，法官法律范围保持正式；会见把纽约结案、宾州自己的书面命令、联邦量刑通知分别说清；结尾说姐姐先别买票、只是探视，减少“回家”主题句。 |
| E24 | SC01、SC02、SC03、SC04、SC05 | 9 / 21 | 家属说未说清的家庭问题；判后问母亲的接送；两期账单与再下一次申请分清；莉娜直说失业、罚款及继续签表。孩子画画段保留。私信改成“write back”，只签Luigi，不索取回应。 |

## 五组前后例

| cue | 修订前 | 修订后 | 原因 |
| --- | --- | --- | --- |
| E17-D014 | They'll put your message beside the travel dates. The decision is earlier, in your own words. | Look at these dates. You'd already decided before Lena sent that message. They'll use that. | 律师在眼前纸件上指出时间关系，不说抽象的“决定节点更早”。 |
| E18-D007 | Lena. The correction is live. I need to ask about your report, not defend my headline. Call when you can. | Lena, it's Nora. The correction's up. I've still got questions about your report. Call me when you can. | 留言能像真实留言，只留下来电者、进度和来意；她的悔意由后续核对与道歉承担。 |
| E19-D019 | You can be angry. You don't have to choose one thing to remember. | I know. You were waiting for him to fix it. I'd be mad too. | 母亲回应孩子眼前那架没修好的飞机，允许他生气，不替观众总结哀悼。 |
| E20-D006 | Ask, not stop? | Ask? You can't make them? | 当事人当场追问律师究竟能做到什么，自然引出可能输掉例外争议。 |
| E23-D018 | Tell her to wait. If she's coming, it's to see me. Not to take me home. | Tell her to wait on the tickets. And make sure she knows it's a visit. I'm not getting out. | 姐姐的票钱和探视安排成为话的目的，法律结果仍清楚。 |

## 同步与连续性复查

- 每个修订cue的英语、中文对照及语气已逐项回写`scene.script`，没有只改台词表。对场景正文提取出的英语、中文序列与按镜头排列的cue逐字比较，全部一致。
- 修订了依赖旧句尾的切点与`next`，包括E18“mixed them up”、E19“at home / I'd be mad too”、E20“The judge could agree with them”、E22“talk in private”、E23“one course of conduct / 还出不去”、E24“I kept signing”。没有把新句接在旧句的声画触发上。
- E20办公室剧本把留言后重复“拆开筷子”改成把已拆好的筷子掰开，与镜头中边留言边拆包装的动作相容；没有改变吃两口后收案卷的结果。
- E18保留公开错误原句“Nobody opened the files.”，附件照片的既有权限、当前只能发现清单差异、E21才核实队列断层的顺序不变。`source files`指诺拉的原始采访资料，不等于她占有莉娜原报告。
- E19客气只限定点餐行为，瑞秋让出安静通话位置未改成谅解；模型翅膀仍未修，周六承诺仍未兑现。
- E20没有补出刑期上限或纽约撤案保证；签的是给律师的程序指示，正式认罪仍在E22。
- E21没有将完整收件误写成医生看过全部附件，也没有将莉娜举报写成免除其持续签表责任；患者资料不作为青年或主播新的公开资产。
- E22保留“I intended to kill him.”及“Yes. I shot him. He died because I shot him.”，两项联邦认罪、无保证和另期量刑明确。
- E23纽约本庭处置、宾州独立书面命令和联邦量刑分别保留；不把纽约法官写成替宾州结案，也不把time served误作青年整体获释。
- E24总刑期仍为两项各三十年并行、总三十年；和解款付冬季、保单批准下一疗程、再下一疗程仍需申请。私信只代表本人，未出现回信、接受或宽恕。

## 运行的文字检查

本组Python只读检查实际通过：8份JSON可解析；27场正文英语和中文序列分别与161个cue完全一致；语气标注能在正文对应；所有发声窗在各镜时长内且没有无说明的重叠；英文词数按`[A-Za-z]+(?:['’][A-Za-z]+)?`统计，最大窗口平均语速约**2.47词/秒**（E23-D015），未超过2.7。未改变任何发声窗。

语速是文字计划的容量检查，不证明演员在相同秒数内已有自然演绎；呼吸、吞字、重音、听对方的时间仍须实际朗读校核。

## 源文件快照

此处哈希对应本组提交主编编译前的源JSON；如主编后续调整任何源字段，须以新的主编检查记录为准。

| 源文件 | SHA-256 |
| --- | --- |
| episodes/E17.json | `a6da5e1f942c3689638742b7393cd53a009242087bf515ab357b4cb90ae16b47` |
| episodes/E18.json | `12e2d4df418e995e2cb8e8b7785a12dc6c0095cecfada7a4367fc54ccd99d74b` |
| episodes/E19.json | `406870ce8a505aeea78da1aad52c594e5c7a4aadd18da64d5f35dbb65fb92241` |
| episodes/E20.json | `82240a83dcc9c9340113f5ce0a1d3cf1b7771a1b1f7cf26244bc9c8d9266c747` |
| episodes/E21.json | `153006e0094020002e8481b295a22b4bdb7d400b540210da20faf4abe48f6e91` |
| episodes/E22.json | `917d95711ed863f031d08f2f2c22f63d685ddf46dae6df4768b5906bc24c44f7` |
| episodes/E23.json | `cae61b0a818a06d13776573f12d885ee172de18bc99df0ce4abd779989f530ee` |
| episodes/E24.json | `6501a79b29fb01a0b50c5f2595d6a84d07facb5bd6f27313eb5567f83b06fa78` |

未决项：无本组已知的文本阻断项；全包再编译、总表交叉校验由主编执行。演员朗读、音频、口型、视觉色彩及真实剪辑均未制作/验证，不作通过声明。
