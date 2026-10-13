# P4 工程与 24 触发独立审阅 · 2026-10-12

最终限定结论：P4 工程与 A/B 首轮全部 24 触发审阅通过，未发现 B 新增阻断或重要触发偏差。本文不承担 8 内容请求的三次独立重复评审，不代替其审阅结论；完整 P4 阶段还须合并内容审阅后决定。

本次只读当前源码、分发目录、日志和真实回答，用 rubric-v2 的触发判据逐案核对；未修改源 case、产品、派生目录或构建包，未重跑全量 500 测试。唯一新增文件是本报告。

## 工程与实际宿主证据

实际作者源为 `skills/cineweave-director/`，另外三入口的 `SKILL.md`、`agents/openai.yaml` 在 `skill-sources/cineweave-{platform,reference,review}/`。`scripts/skill-catalog.mjs:248–278` 的映射仅对专业入口两文件使用这些作者源，其余资源始终取导演共享源；`skills/` 下的专业目录是登记派生副本。同步先检查全部来源、目的路径及未知条目，再写登记文件；构建消费同一 inventory。未发现第二份共享作者权威。

只读调用 `createDistributionInventory` 并逐文件比较当前派生目录及 `.build/cineweave-director/`：全插件 638 导出文件、167 不重复作者源文件；四入口各 159 文件，均无 byte mismatch。四个 actual/target owner 分别为 director 43、platform 1、reference 4、review 4。共享契约 `skill` 仍为 `cineweave-director`，12 路由、52 根 kind、54 schema、52 example、42 references；专业分发完整共享资料不扩大 ownership。

复核既有原生日志：`cineweave-split-p4-{source,targeted,build,leaf,leaf-validation,install-matrix}-20261012.log`。源码验证与资源／Markdown 锚点闭包通过，相关回归 228 pass / 0 fail；全插件 638 文件、review 单叶 160 文件（含根 LICENSE）构建及源码字节一致，单叶验证通过；四入口 × 全插件／单叶共 8 安装布局，smoke 共 9 pass / 0 fail。单叶不依赖 repo 作者目录或兄弟入口；日志里的四份完整共享协议是分发副本，不是四套 namespace。审阅者未重复构建或把这些工程结果提升为创作质量证据。

真实隔离宿主记录分别证明两种安装方式：

- `D:/Temp/cineweave-host-discovery-20261012/run-8t3r6rzb/filtered-result.json`：在隔离 CODEX_HOME 与 repo `.agents/skills` 中，四个完整 159 文件树均 byteComplete；原生 `initialize`／`skills/list` 返回四个准确 repo 入口，enabled=true、parseErrors=[]。
- `D:/Temp/cineweave-plugin-host-20261012/run-7k99cpct/result.json`：隔离本地 marketplace 与 plugin 安装命令均 exit 0，638 文件包；原生列表返回 `cineweave-director:cineweave-{director,platform,reference,review}` 四前缀入口，enabled=true、parseErrors=[]。无 thread/model 调用、无用户 profile 改动，源与安装树未变化。

四个 `agents/openai.yaml` 均允许隐式调用，default_prompt 与本地能力名称吻合。上述宿主实验只证明发现、安装和解析；没有逐请求调用模型，不能宣称已经测得宿主自动选择或触发准确率。

## 24 触发首版核对

输入为 `D:/Temp/cineweave-split-p4-triggers-raw-inputs-20261012.json` 中 24 原请求及对应 rawData；24 记录逐项与源码输入完全相同，当前源输入与冻结 `case-inputs.json` 的 SHA256 均为 `e92cd1a5a5815891426b715159675b070d5bdedccb7a691441ab09f65d61f892`，没有改输入。B1 的完整报告和 24 独立 `*-v1.md` 均读取，按正文实交核对，不仅看 owner 表。B1 原报告说明四入口由同一代理按 frontmatter 选择、按需读取，共用一个批次上下文；它不是 24 次宿主冷启动。复核 `source-reads.json` 的 53 记录，真实路径全部存在，当前原字节 hash 全部吻合。

| 原请求范围 | B1 实际单一主责／必要辅助 | A 首轮当前状态 | 具体依据 |
| --- | --- | --- | --- |
| T01、T02、T09、T10 | director；无辅助 | 已审通过，A 为 director | A/B 新海报均交完整中文稿；A 的收音机内旧录音播放器、B 的旧磁带均形成现实因果；两镜钥匙交接后由弟弟左手入左口袋再转身，母稿完整。没有扩成固定四阶段流程。 |
| T03、T04 | platform；无辅助 | 已审通过，A 为 director 内联恢复 | T03 全文与 4:5 设置按虚构夹具；T04 保留 Seedance I2V 意向，实交运动稿与待绑定首图／界面项，不编档位或声称可提交。A 明确独立 platform 不存在，并给实际冻结导演路径。 |
| T05、T06 | reference；无辅助 | 已审通过，A 为 director 内联恢复 | 分工标 declared、缺真实图片；两个别名保持原样未解析，不按名字猜脸或衣服，不创建真实绑定。A 来源段明确恢复冻结单入口参考路由。 |
| T07、T08、T15、T16 | review；无辅助 | 已审通过，A 为 director 内联评审 | A/B 三类文字矛盾均定位到原句；递杯只确认文本承重缺口，穿模保持症状声明。T16 明确持手失配，仅修 S2 入态；画面右出／左入不被直接判为反向或越轴，具体空间仍待核对。 |
| T11、T12 | platform；无辅助 | 已审通过，A 为 director 内联适配／修正 | T11 完整母稿分文本框与下拉框；T12 去不支持的参数尾并改回 4:5，实交全文，没有改故事或虚构 seed 控件。 |
| T13、T14 | reference；无辅助 | 已审通过，A 为 director 内联参考路径 | 身份／衣服／油画分别迁移与排除；OldStation 未解析，无站台观察或 latest。 |
| T17 | director；无辅助 | 已审通过 | Midjourney 意向没有接管无母稿的新创作。A/B 均有完整唱片封面母稿，设计取值标暂定，参数与实际字形验收未核验。 |
| T18 | director；reference 辅助 | 已审通过，A 为 director | 先取材角色／排除表，后交完整方圆脸、短黑发、红棉外套、水彩人物稿；原创五官等为设计，未冒充实际看图。单一导演收口，没有两个入口重造身份。 |
| T19 | director；review 辅助 | 已审通过，A 为 director | A/B 先定位连续性，再只把 S2 入镜右手改左手；完整两镜实交，S1 和剧情原样保留，无换手或新动作。 |
| T20 | platform；无辅助 | 已审通过，A 为 director 内联 | 完整母稿保持 16:9、空手、西窗与无文字，按夹具只交文本框与画幅；没有新故事／人物／全套评审。 |
| T21 | review；无辅助 | 已审通过，A 为 director 内联评审 | A/B 缺海报及身份图时都不判变脸，给可实际执行的尺度、视角、稳定结构与当前状态对照办法，视觉结论未知。 |
| T22 | director；无辅助 | 已审通过，A 为 director | A/B 如实说当前入口无 cineweave-story，沿真实导演故事路由完成现实修表匠／旧闹钟提纲，未安装或伪称调用不存在入口。 |
| T23、T24 | null；无辅助 | 已审通过，A 为 null | A/B 分别仅“商店六点关门。”和“882”，没有 CineWeave 创作流程；A activated=false，B 无本案 CineWeave 正文读取。 |

B1 24 案主责分布为 director 8、platform 5、reference 4、review 5、null 2，均只有一个最终负责人；T18／T19 的辅助职责符合原请求，没有将辅助数量当失败。A 全部 24 案来自 P2 六 trigger、P3 五 trigger、A1 remaining 十三 trigger；归一到实际 Skill 后为 director 22、null 2，专业能力由冻结单入口内联完成，没有将命名缺失入口算成功调用。A1 的 `run-index.owner` 使用 `image_prompt`、`story`、`review_repair` 等**内部路由名称**，不能解读为另一个 Skill；本表依据唯一冻结源根与 activated 字段映射为 director／null，原索引未被修改。

A1 remaining 的 13 份 `.first-response.md` 全文已补读，逐案 `.source.json` 与原始输入完全相同，首版非空且完整进入报告，source／response hash 全匹配；`read-sources.json` 的 22 真实路径和 hash 全部匹配冻结文件。T07／T08／T22 的内联恢复记录与真实源根相符，T23／T24 未激活。此批 17 案（含另审的四内容）共享单一子代理上下文的限制已明确披露，不是逐案 fresh-session。读取章节是执行者保存的记录；文件存在与字节核验不额外证明自动宿主选择。

A/B 全部首轮触发核对未见 B 新增阻断或重要触发偏差：显式、隐式、组合、新母稿、单项适配、有限评审、无关负例及不存在入口均实交。原稿、能力资料和图片缺失只限制依赖它们的确认，没有停在泛泛流程或伪造媒体、返回回执／身份验收。A/B 之间的可撤销创意差异不属于路由失败；没有依据篇幅宣称质量、token 或速度改善。

## 首次发现保留与边界

P4 入口预审原报告保留在 `D:/Temp/cineweave-split-p4-entry-pre-review-20261012.md`。其首次 **P2** 发现是“没有媒体时只交条件诊断”会错降已有真实文稿的评审；两项 **advisory** 强化为完整六视角在 Node 可用时实际跑表、修订不覆盖已批准原稿。当前 review 作者源及派生入口全部包含修正；共享 ensemble 也明确实际 Node 检查要求，三项复查关闭。这些已关闭发现没有被本轮“无新增阻断”抹去。

宿主安装实验首轮 `run-lzzp6dgq/result.json` 的 failed 空列表也保留：安装命令 exit 0、parseErrors=[]，首次 harness 用未加前缀 exact name 过滤，而 plugin 宿主实际返回前缀名称，造成证据脚本误判。当前脚本用 `rsplit(':',1)` 取 localName，并在新隔离 `run-7k99cpct` 获四准确入口。此为已关闭的 **important 验证误判**，不能计成产品安装失败，也不能删除首次记录。

最初草稿确曾因 A1 剩余 13 触发未落盘而只给工程／B1 与 A11 的暂定结论；本次已完成该依赖后才给上方工程＋24 触发最终限定结论。8 内容请求的三重复、历史 P2 内容 warning、真实媒体、在线服务能力及性能由各自证据承担，本文不提前放行 P4 全阶段，不声称自动宿主编排已验证。
