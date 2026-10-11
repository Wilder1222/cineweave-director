# CineWeave 专业导演方法审阅与优化计划

当前项目已经具备故事、人物、调度、摄影、剪辑、声音、提示词和证据评审的职责分层。下一轮应先补齐时间契约的确定性校验，再把大师方法的作品范围、证据、取舍和实际稿件连接到可复核的创作练习。增加导演姓名或摄影术语不能解决这两个问题。

计划日期为 2026年10月10日；以下实现判断、行号和反例保留该日审阅基线。审阅对象是当时工作树，版本号为 3.1.0，HEAD 为 `c9d3817467a7adf05d1aeb95e41c39b70e95f744`，包括上一轮尚未提交的专业制作增强。

2026年10月11日已按用户授权实施 T1至T7；T8 按用户选择完成试片方案，实际媒体未运行。当前实现、文字试跑、修订和验证以[执行记录](director-optimization-2026-10-11.md)及其原始证据为准。下文曾被接受的时间反例是历史缺口，不能读作优化后仍被接受。

## 当前实现的判断

应保留现有单入口、12 条路由、52 种根契约和按需加载方式。大师资料已经采用机制选择、硬要求过滤、按维度组合、零匹配和显式排除；导演方法已区分观众与人物所知，支持可表演任务、倾听、关系调度和必要覆盖。优化应补充这些机制的证据与实例，继续由既有专业领域维护知识。

| 实现部分 | 当前依据 | 判断与下一步 |
| --- | --- | --- |
| 导演方法 | [directing-craft.md](../../skills/cineweave-director/references/optional/directing-craft.md) 第 9至97行 | 已有体验、知情、行动、调度与覆盖取舍。补作品限定的反例、视点例外和完整交接实例 |
| 大师方法选择 | [master-style-presets.md](../../skills/cineweave-director/references/optional/master-style-presets.md) 第 22至40行 | 选择和冲突规则较完整。补来源支持范围与方法专属试跑，避免重复建路由 |
| 大师资料依据 | 同文件第 52、64、76、88、100、112、124、136行 | 本人、合作者、评论者和摘要证据有区分，但粒度不统一。王家卫旧卡仍依赖未提取完整的 PDF；狄金斯依据是未审听的节目简介。限制已说明，不属于虚假证据 |
| 方法进入稿件 | [image-prompt.md](../../skills/cineweave-director/references/routes/image-prompt.md) 第 17行；[工作模型](../../skills/cineweave-director/references/core/operating-model.md) 第 17至27行 | 已要求继承设计并将错误返回所属领域。缺少覆盖不同导演机制的完整输入、决定、复制稿与失败修订实例 |
| 时间与节奏校验 | [validate-output.mjs](../../scripts/validate-output.mjs) 第 962至972行；两份时间 schema | `TemporalSpec` 和 `SequenceRhythmSpec` 未进入语义分派，矛盾时间数据可通过，见下节实测 |
| 逐镜评审 | [check-shot-review.mjs](../../skills/cineweave-director/scripts/check-shot-review.mjs) 第 100行；[群像评审](../../skills/cineweave-director/references/optional/ensemble-direction-and-review.md) | 只读检查器的范围声明正确。应与独立全文审阅配合，不扩成关键词艺术评分器 |
| 行为证据 | [方法库行为检查](../../skills/cineweave-director/references/optional/master-style-presets.md#行为检查)、[案例定义](cinematic-cases.json)、[上一轮原稿](2026-10-10/forward-production.md) | 已有交接、表演、空间和保留试跑。隐藏认知、声音空间、观察式停留、排除与混合的方法专属证据仍不足 |
| 运动出点措辞 | [shot-direction.md](../../skills/cineweave-director/references/routes/shot-direction.md) 第 25行；[视频表演](../../skills/cineweave-director/references/optional/video-performance-direction.md) 第 107行；[分镜](../../skills/cineweave-director/references/routes/storyboard-rhythm.md) 第 35行 | 局部“停稳”要求与运动中切出规则存在措辞冲突。需澄清为可续接出点，尚未复现为创作失败 |

当前没有发现需要列为 P0 的发布阻断或破坏性问题。确定性时间校验列 P1；来源、方法交接与行为评测是主要能力优化；局部措辞统一列 P2。没有实际媒体的部分不以工程测试或文字评审替代。

## 可复现的时间校验缺口

2026年10月10日使用仓库规范示例，先确认基线有效，再仅在内存修改一个变量并调用 `validatePayload`。该日根代理复测如下八个反例，均返回 `valid: true`、`errors: []`；10月11日实现后八项及单镜自转场均已拒绝，详见执行记录：

| 契约 | 唯一修改 | 当前接受结果的问题 |
| --- | --- | --- |
| `TemporalSpec` | 5.5 秒镜头的动作写到 6.5 秒 | `withinDuration: true` 与实际事件冲突 |
| `TemporalSpec` | 反转焦点事件数组 | `eventsOrdered: true` 与实际顺序冲突 |
| `TemporalSpec` | 两个动作使用相同 `eventId` | 无法唯一定位动作事件 |
| `SequenceRhythmSpec` | 窗口起帧设为止帧加一 | 接受倒置窗口 |
| `SequenceRhythmSpec` | 呼吸点写到对应窗口之外 | 接受不可用时间位置 |
| `SequenceRhythmSpec` | 阶段引用 `shot.missing` | 阶段不能闭合到声明镜头 |
| `SequenceRhythmSpec` | 帧率改为未约分的 `48/2` | 不符合路由所要求的约分时基 |
| `SequenceRhythmSpec` | 最小时长大于最大时长 | 时长策略自相矛盾 |

独立审阅者还报告单镜自转场被接受。上述结果是检查器的确定性边界，不是对时间节奏的艺术评分。布尔声明不能成为对应条件已经检查的证明。

复测方式如下，只读源文件，不写入修改后的示例：

```powershell
@'
import { readFileSync } from 'node:fs';
import { validatePayload } from './scripts/validate-output.mjs';
const root='skills/cineweave-director/resources/contracts/';
for (const stem of ['temporal-spec','sequence-rhythm-spec']) {
  const input=JSON.parse(readFileSync(root+'examples/'+stem+'.json','utf8'));
  const candidates=[['baseline',input]];
  if(stem==='temporal-spec') {
    const a=structuredClone(input); a.actionTimeline[0].timeSeconds=a.durationSeconds+1;
    candidates.push(['action_outside_duration',a]);
    const b=structuredClone(input); b.focusTimeline.reverse();
    candidates.push(['focus_reverse_order',b]);
    const c=structuredClone(input); c.actionTimeline[1].eventId=c.actionTimeline[0].eventId;
    candidates.push(['duplicate_action_id',c]);
  } else {
    const a=structuredClone(input); a.shotWindows[0].startFrame=a.shotWindows[0].endFrame+1;
    candidates.push(['window_start_after_end',a]);
    const b=structuredClone(input); b.breathingPoints[0].frame=b.shotWindows[0].endFrame+1;
    candidates.push(['breathing_outside_window',b]);
    const c=structuredClone(input); c.tempoPhases[0].shotIds[0]='shot.missing';
    candidates.push(['phase_missing_shot',c]);
    const d=structuredClone(input); d.timebase.numerator=48; d.timebase.denominator=2;
    candidates.push(['unreduced_timebase',d]);
    const e=structuredClone(input); e.shotDurationPolicy.minimumFrames=e.shotDurationPolicy.maximumFrames+1;
    candidates.push(['duration_min_greater_than_max',e]);
  }
  for(const [probe,payload] of candidates) {
    const result=await validatePayload(root+'schemas/'+stem+'.schema.json',payload);
    console.log(JSON.stringify({stem,probe,valid:result.valid,errors:result.errors}));
  }
}
'@ | node --input-type=module
```

实施时按既有零基、端点包含的帧窗口处理，窗口长度应为 `endFrame - startFrame + 1`；起止相同是合法单帧窗口。不能复制其他采用右开区间的工作表算法。事件位于 `timeSeconds === durationSeconds` 时可以是合法边界。各轨可以并行，同一时刻可以发生多个不同事件；检查各轨非递减，不强制轨与轨之间互斥。重复 ID 先限定在各自事件数组，不无依据地禁止跨轨关联。若不提供准确上游分镜正文，只能检查本文件闭合，完整分镜覆盖继续标为未验证。

## 专业导演能力的补充方向

AFI 的导演课程把剧本与潜台词分析、表演、调度、视点、剪辑和协作连接到镜头理由及成片练习；课程大纲支持能力范围，不证明本项目已经达到训练结果。[AFI 导演课程](https://conservatory.afi.com/directing-curriculum/)

Judith Weston 的原作者方法强调关系、行动、倾听与灵活选择，反对把每个动作和读法都微控成唯一正确答案。CineWeave 已有这个方向，下一步应把“真人演员任务”和“已选演法的 AIGC 可见过程”成对展示，保留演员选择与稿件明确性各自的用途。[Top 10 Ideas](https://judithweston.com/web/archive/top-10-ideas-directing-actors)、[12 Tips](https://judithweston.com/web/extras/12-tips-directors)

DGA 的调度与镜头表工作坊让导演在具体场景中进行安排并获得反馈。可迁移的是同场试演、镜头理由、反馈与修订，不能把工作坊报道当成自动最佳机位算法。[DGA 调度与镜头表](https://www.dga.org/events/2019/may2019/ddi_lab_prepny-0319)

| 能力 | 本轮应补的具体决策 | 验收问题 |
| --- | --- | --- |
| 剧本解释与关系变化 | 从台词表面区分行动目的、接收者与改变策略的线索 | 删除情绪标签后，任务与转折是否仍清楚 |
| 观众知情与视点 | 延续现有知情机制，增加物件行为、短插入与视点例外的实例 | 新信息何时进入观众解释；有没有提前揭底 |
| 调度与覆盖 | 对比共享画面、选择性反应、物件细节和必要空间视图 | 是否看见不可替代事实；新增覆盖牺牲了什么 |
| 时间与节奏 | 区分放映时间、叙事经过和观众发现细节所需时间 | 改镜长后改变的是哪一种时间或信息密度 |
| 声音与画外空间 | 分配画面注意对象和听觉主层，允许有意义的不对称 | 声音使观众推断了什么；是否误示来源或同时性 |
| 作品整体与例外 | 维护共同语法，说明某处偏离为什么服务整体 | 例外是否可解释，是否无声改了身份、空间或视觉基线 |
| 取舍与恢复 | 给与原方案同一硬要求的有效备选 | 备选解决了哪项失败，留下何种代价 |

Murch 的声画文章支持选择声音主层及管理密度与可懂度。采用这种问题意识，不沿用固定最大音轨数，也不要求声音与画面始终强调同一对象。[Walter Murch](https://transom.org/2005/walter-murch/)

## 大师方法的作品范围和应用边界

以下适用条件与 AIGC 转化是本项目的计划综合，作品或证言不提供生成成功保证。导演本人、摄影／剪辑协作者、评论者与发行方整理分别标明。新增候选先进入比较练习，只有带来独立用途并通过文字验收才进入常用目录。

| 方法与限定范围 | 可采用的机制与代价 | 来源归属与下一步 |
| --- | --- | --- |
| Hitchcock 在 1937 年解释的《Blackmail》《Sabotage》 | 物件使用、手与视线构成心理行动链；声音可留在倾听者画面。细节覆盖会改变共同表演与信息次序，短插入需检可读性 | [本人文章](https://www.bfi.org.uk/sight-and-sound/features/alfred-hitchcock-my-own-methods)、[ASC 本人访谈](https://theasc.com/article/flashback-hitchcock-talks-about-lights-camera-action/)。补强既有悬念卡，不把暗光或细切当通则 |
| Ozu 的晚期家庭作品与重复关系 | 保留可比较的日常条件，让一次离开、接物或等待显出差异。比较需要时间，低机位可能挡住接触；不能等同禅意或全片长镜 | [Thom Andersen 分析](https://www.bfi.org.uk/sight-and-sound/ozu-yasujiro-master-time)、[Tony Rayns 分析](https://www.bfi.org.uk/sight-and-sound/features/ozu-yasujiro-tofu-maker)、[日记整理](https://www.criterion.com/current/posts/668-an-autumn-afternoon-ozus-diaries)。主要是评论与日记证据，作为候选练习 |
| Kurosawa 的《蜘蛛巢城》《天国与地狱》 | 决定性行动改变群体排列；素材按行动与人物状态取舍。多人纵深提高遮挡和身份持续风险，不必强加风雨或快剪 | [Donald Richie 现场亲历](https://www.criterion.com/current/posts/938-throne-of-blood)、[Geoffrey O’Brien 评论](https://www.criterion.com/current/posts/515-high-and-low-between-heaven-and-hell)。补作品范围与证言归属 |
| Spielberg 的《决斗》《夺宝奇兵》《拯救大兵瑞恩》 | 按问题选择覆盖准备；参与者视点可暂时让位于必要地理解释；行动后的停顿承载关系。震动与有限视点可能遮住动作 | [DGA 2006 本人访谈](https://www.dga.org/craft/dgaq/issues/0604-winter-2006/dga-interview-steven-spielberg)、[DGA 2011 本人解释](https://www.dga.org/craft/dgaq/issues/1103-fall-2011/shot-to-remember-saving-private-ryan)、[ASC 合作者记录](https://theasc.com/article/saving-private-ryan-cinematography-kaminski/)。不写成从不分镜、永久手持或固定快门 |
| 王家卫《花样年华》与《重庆森林》分开 | 前者重复日常背景衬出人物改变；后者旁白与自我言说另有用途。重演、猜测和当下要区分；含混可能使观众误认层次 | [2000 年本人访谈的 BFI 重刊](https://bfidatadigipres.github.io/world%20of%20wong%20kar%20wai/2021/07/14/in-the-name-of-love/)、[1995 年本人访谈](https://www.bfi.org.uk/sight-and-sound/features/poet-time-wong-kar-wai-chungking-express)。替换旧未取得完整 PDF 的依据，保留摄影与美术合作者归属 |
| Tarkovsky 的《镜子》《潜行者》 | 记忆片段在整体关系中成立；集中处境，声音与环境融合。减少解释会降低明确时间定位，水与废墟不能代替片段选择 | [1985 年本人访谈授权翻译档案](https://www.nostalghia.com/TheTopics/interview.html)、[Janus《潜行者》资料](https://s3.amazonaws.com/criterion-production/janus_promo_packages/62-/Stalker_pressnotes_4-25-2017_original.pdf)。档案不是官方；发行资料分开本人、编剧和作曲家证言，不规定无配乐 |
| Bresson 在《死囚越狱》1956年与《扒手》1959年的动作工作与听觉空间 | 以劳动、接触、倾听和结果承载处境；画外声音提供未见关系。削减表情或共同空间可能损失可读性，不要求大量重复拍摄 | [1970 年本人访谈转载](https://www.robert-bresson.com/Words/CTSamuels.html)、[摄影师 Burel 的不同意见](https://www.bfi.org.uk/sight-and-sound/features/notes-from-cinematographer-leonce-henry-burel-on-robert-bresson)、[Pipolo 评论](https://www.criterion.com/current/posts/2628-a-man-escaped-quintessential-bresson)。《圣女贞德的审判》1962年作为协作者分歧反例；保留转载边界，候选练习不模拟演员内心 |
| Martel 的《扎马》与早期家庭作品 | 三种时间、视觉焦点与听觉主层不对称、持续观察中发现细节。降低事件数不等于一律拉长镜头，分层可能暂时削弱关系定位 | [BFI 本人访谈](https://www.bfi.org.uk/interviews/lucrecia-martel-time-zama)、[BOMB 本人访谈](https://bombmagazine.org/articles/2009/01/01/lucrecia-martel/)。扩展现有声音卡和时间练习 |
| Varda 的摄影 影片与晚期装置 | 两个观察以事实、联想、并置或构造关系连接；视点和选择共同写作。联想可能削弱单一剧情推进，构造不能冒充纪录事实 | [Criterion 本人访谈](https://www.criterion.com/current/posts/4488-i-m-still-here-a-conversation-with-agnes-varda)、[Janus 2019 访谈](https://s3.amazonaws.com/criterion-production/janus_promo_packages/347-/Varda-by-Agnes_press-notes_r2%20%282%29_original.pdf)、[BFI 混合访谈与评论](https://www.bfi.org.uk/sight-and-sound/interviews/home-away-with-agnes-varda)。扩展既有观察卡，声画并置按目标媒介支持处理 |
| Satyajit Ray 的关系空间与无言选择 | 先建立房屋或行动地理，再用具体行动承载未完成交流；物件不必都有预设象征。无言高潮不能替代必须讲清的事实 | [本人访谈汇编](https://www.bfi.org.uk/sight-and-sound/interviews/satyajit-ray-moral-attitude)。作为补充练习，避免国别标签或复制作品结尾 |

现有安德森／耶曼、卡隆／卢贝兹基与狄金斯方法继续保留。它们分别涉及导演与摄影协作或摄影专业，不能将合作者技术统称为导演本人的独创。本轮没有重新审听 Team Deakins 音频或完成全部旧卡来源复查；后续只按新增声明所需补证，不用日期覆盖旧限制。

## AIGC 官方文档和公开实践的取舍

| 来源 | 计划采用 | 排除或限定 |
| --- | --- | --- |
| [Runway 提示词入门](https://help.runwayml.com/hc/en-us/articles/47313698911891-Introduction-to-Prompting) | 简短探索和详细定稿分别服务不同目的，失败时缩减并逐项加入 | 不规定万能字数，不为精简丢硬要求；JSON 结构不会自动成为生成控制 |
| [Runway 图生视频](https://help.runwayml.com/hc/en-us/articles/48324313115155-Image-to-Video-Prompting-Guide) | 实际源图定义初态，文字组织运动与变化，检查源图已有运动线索 | 不让 I2V 规则抹掉 T2V 初态；源图未取得时只能判断文字设计 |
| [Runway 摄影术语](https://help.runwayml.com/hc/en-us/articles/47313504791059-Camera-Terms-Prompts-Examples) | 运动每一阶段写入画和揭示内容，固定机位同时说明场内运动 | 示例是模型相关的探索；术语不保证轨迹、焦点或视点忠实，文档中的优秀遵循表述不作实测结论 |
| [OpenAI Image prompting](https://developers.openai.com/api/docs/guides/image-prompting#refine-an-image-across-turns) | 实际输出成为下一次编辑输入，窄范围改动便于比较 | 单次成功不证明身份、保留或多镜稳定；本轮不引入 API 执行 |
| [Google 当前视频最佳实践](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice) | 模式相关的源图／运动分工和具体表达 | 同 seed 的一致性建议不成为保证，短视频单场建议不变成禁止多镜的电影法则 |
| [growgami sd2prompt 固定源码](https://github.com/growgami/sd2prompt/blob/bb80fada7773536892696df6ba52bdc7defccc19/references/directing-engine.md) | 从场景职责推导摄影、表演与声音；整体语法与局部决定连接 | 不继承每场必有价值翻转、低角度必赋权、所有声画同一情绪及单平台短时长假设。允许观察与有意声画对位 |
| [ByteDance AgentKit 样例固定源码](https://github.com/bytedance/agentkit-samples/blob/3b7f992743fc6468375a16d3364bc354c5de4052/python/02-use-cases/comic_drama_gen/skill/comic-drama-master/references/storyboard-director.md) | 共享视觉与角色事实贯穿逐段稿件，动作、对白、声音分别展开 | 不采用英文强制、固定对白密度、最后五秒静止、统一激烈模板或风格锚点百分之百一致承诺；样例不是模型官方能力手册 |

两个公开源码提交通过只读 `git ls-remote` 核对并读取固定文件；这里只比较方法，未复制代码、提示词库、角色或媒体。官方功能说明用于界定控制范围，社区方法用于提出可否定的试验问题，艺术选择由当前简报决定。

## 分批实施计划

### 第一批 修复时间校验和运动出点

**T1 时间语义检查，P1。** 在 [validate-output.mjs](../../scripts/validate-output.mjs) 新增两份契约的语义检查，并接入分派。在 [validate-output.test.mjs](../validate-output.test.mjs) 加入上节负例及正常边界：同刻不同事件、独立并行轨、边界时刻、有效单镜序列和合法相邻转场。需要精确上游引用的完整覆盖依赖实际文档，缺失时列为未验证；不凭声明补齐。

完成标准是上述矛盾数据被拒绝并定位到字段，正常规范示例仍通过。保持既有线版本及字段，先不新增 schema；只有证实旧字段无法表达必要含义才单独提出兼容变更。JSON 纯数据、严格解析、原始哈希与只读输入不变要求沿用现有实现。

**T2 出点语义统一，P2。** 修改镜头路由、视频表演和大师连续性卡中的通用停稳措辞，改为速度阶段、采用出点运动相位和可续接状态；需要停稳的端点或叙事停顿仍保留。静帧尾图与持续运动的剪辑出点分别说明。完成标准是持续跟拍接下一镜的稿件没有自行补减速停止，完整台词和必要接触仍处于采用范围。

### 第二批 补强来源与方法卡

**T3 来源与作品范围，P1。** 优先替换王家卫旧摘要依据，补强 Hitchcock 物件心理行为、Kurosawa 关系空间，以及 Martel 三种时间和 Varda 观察构造的具体证据。更新 [master-style-presets.md](../../skills/cineweave-director/references/optional/master-style-presets.md) 和 [film-craft-study.md](../../skills/cineweave-director/references/optional/film-craft-study.md)，保持一份知识权威。

每项保留作品／时期、本人／合作者／评论者、具体支持机制、项目转化、适用条件、代价与反例、所需控制、可否定的评审问题。Ozu、Spielberg、Tarkovsky、Bresson、Ray 先用于少量差异练习；目录不以人数为验收指标。不复制外部场面或把整个生涯绑定成一套色调。

完成标准是每项来源确实支持关联声明，方法脱离导演姓名仍可解释用途，包含至少一个会使它不适用的条件。新增来源标记本次访问时间，旧未复查项保留原日期。摄影协作者的参数与导演的视点选择分开记录。

### 第三批 贯通决定和实际稿件

**T4 导演决定的交接实例，P1。** 扩展 [shot-design-workbench.md](../../skills/cineweave-director/references/optional/shot-design-workbench.md) 已有决策卡，使用同一简报展示选择、排除、备选、完整稿与修订。必要内容为“当前问题→选中机制与依据→可见／可听过程→保留事实→代价→验收”，简单请求只呈现需要的部分。

联动已有导演、人物、剪辑、图像和全套创作指南，分别持有各自事实。编译稿不包含方法讨论、导演名代称、参考库操作或来源摘要；它必须保留真正影响画面的线索、行为、接触、时序和声音。现有结构化契约无法表示的工作细节继续留在非规范工作表，不强塞进 `CinematicSkillManifest`。

**T5 时间声音和关系层次，P1。** 在 [editing-sound-craft.md](../../skills/cineweave-director/references/optional/editing-sound-craft.md)、导演方法与分镜路由补小型实例：画面看甲而声音突出乙；对白覆盖听者；重复动作中的一次改变；当下／重演／记忆／联想的关系。沿用已存在的知情和注意力检查，不创建第二套强制字段。

完成标准是声音或视点选择能改变观众推断，含混与错误可分辨；移除色调或大师名字后，方法仍有独立作用；无声静帧只采用可实现的部分。实际媒体未提供时不宣称观众已受到预期影响。

### 第四批 对照练习与独立文字试跑

**T6 方法专项评测，P1。** 在 [cinematic-cases.json](cinematic-cases.json) 维护测试定义，运行记录单独绑定案例 ID、源码哈希、原始请求与完整输出。当前 `not_run` 定义与已经保存的其他试跑不相互覆盖；需要调整测试数据状态说明时，同步贡献指南与相应结构回归。

首批使用下表十一项任务，每项只给新上下文原请求、Skill 和必要素材，隐藏参考答案和历史输出。两种方案比较必须固定故事结果、身份、空间、台词、画幅及已锁定视觉，说明允许改变的导演维度；不能把多维差异伪称单变量因果试验。

| 任务 | 必须观察的内容 | 失败判据 |
| --- | --- | --- |
| 观众先知 人物不得回头 | 观众线索、人物可获线索、揭示次序 | 擅自回头、提前知情或增威胁剧情 |
| 同场共同视图与物件细节比较 | 同一事件如何分配同时关系与选择性注意 | 只换景别名字，遗漏必要动作或接触 |
| 参与者视点的必要例外 | 例外新增什么信息、为何下一动作需要 | 任意全知揭底，或误称必须永久主观 |
| 同一日常活动两次重现 | 固定条件与一次关系回应变化 | 仅换服装或色调制造差异 |
| 画面关注甲 画外乙主导声音 | 听觉视点、来源揭示、同时性和主层 | 把乙声音误归甲、凭空添加台词 |
| 无剧情增加的持续观察 | 感知或关系目标，发现窗口与事件密度 | 强编反转、冲突或固定慢镜秒数 |
| 不用声音的静态海报 | 只保留可见机制及当前瞬间 | 将声音／等待时长假装成图内控制 |
| 只改构图且排除大师风格 | 保留衣服、走位、光源、原事件 | 自动贴导演或改变未授权维度 |
| 三段不同功能共用视觉 | 方法随节拍变化，色光／材质／画幅连续 | 每段以导演名重设视觉基线 |
| 持续运动的动作匹配出点 | 相位、方向、持有与下一镜初态 | 自行停止、重新起手或无因果瞬移 |
| 两段观察以联想连接 | 明确形态／记忆联想的依据，区分构造与纪录事实 | 擅加故事因果、把生成或摆拍称为真实相遇 |

每项按硬要求、决定的可读性、交接完整性、证据诚实和修订范围审查，引用原稿定位，不用“有大师感”或关键词命中作通过标准。独立审阅者对硬要求失败有分歧时列为未解决并复查；审美偏好不同保留为取舍，不自动判错。有限样本只报告本次任务结果，不给稳定成功率。

### 第五批 平台适配与实际媒体

**T7 模式相关的复制稿，P2。** 在已有 [video-platform-adaptation.md](../../skills/cineweave-director/references/optional/video-platform-adaptation.md) 与 [AIGC 控制指南](../../skills/cineweave-director/references/optional/aigc-control-and-evaluation.md) 增加导演方案到 T2V／I2V／表演参考／剪辑的最小映射例。保留精确模型、界面、模式与来源，标签工作表不等于原生请求。

完成标准是 I2V 继承真实初态并写变化，T2V 完整定义初态，声音／精确切点等需要独立控制时明确交接；不从完整中文母稿直接推导平台支持。未知能力只限制依赖步骤，独立创作继续交付。

**T8 真实媒体评审，P2，依赖素材与生成安排。** 挑选信息披露、重复差异、画外声音和动作匹配四种代表性方案，依据实际预算和所选工具制作有限试片。当前 Skill 继续只交接，由外部实际生成／拍摄／录制／剪辑后返回素材。

正常播放检查关系和节奏，关键帧检查接触与身份；分别比较声画、无声画面、声音独听。按任务记录观众实际注意到的线索、发现时点和误认，不强求三个孤立版本各自讲完故事。保留失败与单变量修订，未取得素材则该阶段未运行。

## 实施顺序和文件范围

| 顺序 | 任务 | 依赖 | 主要文件 | 完成证据 |
| --- | --- | --- | --- | --- |
| 1 | T1 时间校验 | 当前 schema 和规范示例 | validate-output.mjs、validate-output.test.mjs | 反例拒绝、正常／并行边界通过、完整仓库验证 |
| 2 | T2 出点统一 | 分镜既有边界语义 | shot-direction.md、video-performance-direction.md、master-style-presets.md | 文档一致与持续运动任务原稿 |
| 3 | T3 来源与卡片 | 本计划的正文与归属登记 | master-style-presets.md、film-craft-study.md | 可追溯证据、作品范围、反例 |
| 4 | T4 和 T5 交接实例 | T2 和 T3 | 既有工作台、导演、剪辑、人物、分镜、图像指南 | 同简报对照、完整稿件、修改传播 |
| 5 | T6 文字试跑 | 来源与实例收敛 | cinematic-cases.json、独立 runs、贡献指南 | 完整输出、独立审阅、失败／未知与复查 |
| 6 | T7 模式投影 | 导演母稿和精确平台证据 | 既有适配与控制指南 | 母稿硬锁保持、能力范围与明确依赖 |
| 7 | T8 媒体试片 | 文字方案、工具、素材和实际预算 | 外部实际媒体及现有评审记录 | 画面、声音、时间和采用接点证据 |

T1 与来源补查可并行；目录表达在出点统一之后收敛，完整实例再交给独立上下文试跑。T8 没有素材就保留未运行，不能用前几阶段的通过代替。工期与生成费用依据实际人力、平台和反馈确定，本计划不虚构天数或点数。

维护继续采用单一知识来源、中文交付与按需读取。预计无需新增根 kind、路由、生成运行时或大师权重配置。确需新增独立指南时先证明其职责不能由已有文件合理承担，再登记生命周期和本地链接；不以扩充文件数为目标。

## 实施后的验收

代码修改需要运行相关负例回归、`npm test`、契约索引检查、源码验证、构建、构建包验证和隔离包测试。schema／规范示例改变时先重新生成索引；只有说明性指南改动时不手改派生记录。

行为验收保存实际输入、源码快照、完整输出、所用工具和独立判断；未知模型用量、成功率、媒体验证和来源权限不填成已知。发布仅使用新的准确版本／提交，旧 v3.1.0 标签仍保持不可变；计划通过不等于已实施或已发布。

本轮已完成只读专业资料研究、当前源码审阅与八个反例复测。阅读的是公开正文和指定 PDF 段落，没有把访谈视频目录当成已观看内容，也没有新增生成媒体。上一轮的 130 项回归、159 文件／42 参考构建与六项文字试跑仍按其[原始记录](professional-craft-research-2026-10-10.md)解释，不能当成 T1至T8 的执行结果。

## 来源日期与证据范围

上述新增来源均于 2026年10月10日访问。日期与归属中影响实施选择的区别如下，网页访问日不替代原刊日期。

- Hitchcock 本人文章原刊 1937年夏，BFI 网页更新 2024年8月12日；ASC 网页日期为 2017年6月12日，讨论包含 1966年作品。小津两份 BFI 文章是 Thom Andersen／Tony Rayns 分析；Criterion 2008年9月29日的日记页由 Donald Richie 整理。
- Kurosawa《蜘蛛巢城》页是 Richie 的现场亲历，日期为 1991年12月2日；《天国与地狱》页是 Geoffrey O’Brien 评论，2008年7月21日。Spielberg 的 DGA 资料为 2006年冬季访谈与 2011年秋季场面解释；ASC 摄影合作者文章原刊 1998年8月，网页 2017年6月7日。
- 王家卫《花样年华》访谈原刊 2000年8月，BFI 文献组于 2021年7月14日重刊，标记可有编辑／节录；《重庆森林》访谈原刊 1995年9月，网页更新 2020年5月21日。导演答语、采访者评价与转述的张叔平意见各自保留归属。
- Tarkovsky 访谈录于 1985年3月，1987年波兰刊出，档案说明获采访者授权翻译；Janus《潜行者》PDF 文件名含 2017年4月25日，正文未独立标出发布日期，包含本人、编剧和作曲家材料。
- Bresson 访谈日期为 1970年9月2日，转载自 1972年书籍，未取得原书全文；Burel 访谈原刊 1976至1977年冬季，BFI 网页 2020年9月25日；Pipolo 的 Criterion 分析为 2013年3月25日。协作者分歧不能改成一致意见。
- Martel《扎马》问答为 2018年5月24日；BOMB 为 2009年1月1日，涉及早期三部影片。Varda 的 Criterion 问答为 2017年4月5日；Janus 资料中的访谈录于 2019年1月31日、首次刊于 2019年2月10日；BFI 混合访谈原发 2011年2月11日、更新 2019年3月29日。
- AFI 和 DGA 材料支持训练范围与工作坊方法，不证明课程结果；官方 AIGC 文档支持对应界面／模式的建议，不证明本任务输出。两份社区文件绑定所列提交，作者总结中的单平台和普遍性断言不作为项目硬规则。
