归档说明：绝对证据链接改为路径文字；原报告字节在 `cineweave-split-p4-content-review-14-2026-10-12.md.original.txt`，审阅结论未改。

# P4 独立内容评审：C01–C04，A/B 各三次首版

评审日期：2026-10-12。只读原始输入、rubric、首版全文、相应报告与侧文件，以及定位修订责任所需的现行产品源；没有改源、原始输入或任何首版。未审触发题及 C05–C08，没有把执行者摘要、自评分或文件检查当作内容质量证据。

结论：24 篇首版均交付了中文完整稿件；未发现身份／持手／画幅／时长／动作连续性的新增 B 硬锁回归。C01 的 A1 与 B1 各有一次把“无火焰”缩为“无外溢火焰／火焰效果”的偏差。C03 的 A2 与 B1–B3 交付完整 10 秒序列母稿，但不满足本次 rubric 的逐镜独立复制稿要求；这是 A 已出现、B 三次复现的交付组织差异，不能据此断言拆分导致退化。C02 的台词外置及 C04 的模式表项有低优先级可读性注意项，不判硬锁失败。没有 P0/P1 问题。

## 范围、证据与判定口径

- 唯一内容输入：八案 raw（实际路径：`D:/Temp/cineweave-split-p4-contents-raw-inputs-20261012.json`），SHA-256 `AAF18A7B9C32FF397CC990535D284C98147D58FEE589BF1393976CA3AC066F09`；本评审只用 C01–C04。
- 标准：rubric v2 的 contentCases（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/tests/evaluations/cineweave-split-case-rubric-v2-2026-10-12.json:901`）。C03 依据原始钥匙换手入皮袋场景；任务分派中“北铰链开盒”是误归类，属于范围外 C06/C08，不加入 C03 约束。
- A1 的 C01–C03 来自 A1 剩余案报告（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/report.md:395`），C04 来自 P2 A 报告（实际路径：`D:/Temp/cineweave-split-p2-baseline-a-20261012/report.md:357`）；A2/A3/B1/B2/B3 均用对应 run 的首版。
- 每篇完整正文均已人工阅读。另用只读 Python 做保存完整性核对，原生退出码 0：24 份侧稿均逐字内嵌所属 report；A1 C01–C03 的 request/rawData 与本次 raw 相同；B2 四份 `.json.response` 与 `.md` 一致。这仅支持“确实评的是保存首版”，不证明创作、工具执行或媒体成功。
- 代码块计数仅帮助定位交付边界，最终结论依据语义；不把多段交付、不同服装设计、灯光方位、节拍分配、伞尖原地支点或持续贴地轻滑当成艺术上的唯一答案。
- P2：需要修正的内容硬锁偏差，或本次明文验收要求的交付缺口；P3：合理可用稿中的复制／说明边界可改进项。合理未决项另列，不计错误。

## 24 篇逐案结果

“通过”只表示本次文本内容及对应交付要求通过，不表示实际图像、视频、声音或平台已通过。“序列完整／独立稿欠齐”只针对 C03 的 rubric 要求。

| 内容 | A1 | A2 | A3 | B1 | B2 | B3 |
| --- | --- | --- | --- | --- | --- | --- |
| C01：海报完整稿、4:5、题字一次、人物衣装持手、冷热光与留白 | P2：灯内可见火芯 | 通过 | 通过 | P2：灯内火芯 | 通过 | 通过 |
| C02：待制首图、明确初态、完整 6 秒动作、准确对白、只触不接重量、停顿 | 通过；P3 运动块台词外置 | 通过 | 通过 | 通过 | 通过；P3 运动块台词外置 | 通过 |
| C03：两镜各 5 秒、总 10 秒、16:9、唯一钥匙、合法换手、侧别与西窗光、连续出入态 | 通过；两条独立稿齐 | 序列完整；P2 独立稿欠齐 | 通过；两条独立稿齐 | 序列完整；P2 独立稿欠齐 | 序列完整；P2 独立稿欠齐 | 序列完整；P2 独立稿欠齐 |
| C04：锁定母稿忠实投射、中文正文／4:5 下拉、合成能力边界 | 通过；正文等于母稿 | 通过；同义展开 | 通过；正文等于母稿 | 通过；正文等于母稿 | 通过；正文等于母稿 | 通过；正文等于母稿；P3 模式表项 |

补充核对：C01/C04 共 12 条实际复制正文中的“归潮”字面出现次数均为 1，未把说明区重复片名误计成画面重排。C01 六稿均有成年女子、短黑发、深蓝无图案棉外套、右手点亮黄铜灯、海边灯塔、上方题字与下方署名空间、来自天空的冷光和来自灯体的局部暖光。C02 六稿均明确无实际首图、待核对后绑定，保持左女右男、女子右手、收拢黑伞与触地伞尖、男子空左手再触柄、女子不松手、男子不承重、结束停顿；起点没有预先完成交接。C03 六稿均保留店主北侧、学徒南侧、深灰／浅灰衣装、西窗世界光源、一枚钥匙及南缘袋；S01 的接掌后释放、S02 的右手建立握持后左手释放、完整入袋后右手抽开，均有文字因果。

## 首次发现与重复分布

### F14-01｜P2：无火焰硬锁被局部放宽；既有 A 偏差在 B1 复现

原请求 raw:6（实际路径：`D:/Temp/cineweave-split-p4-contents-raw-inputs-20261012.json:6`） 与 rubric:915（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/tests/evaluations/cineweave-split-case-rubric-v2-2026-10-12.json:915`） 未授权灯内例外。首次定位 A1 C01:5（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C01.first-response.md:5`）：“提灯内可见小型暖黄灯芯火光”“火光只在封闭灯体内部，不出现外溢火焰”。B1 C01:5（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C01-v1.md:5`）：“提灯内部火芯隔着玻璃发出……”“不增加……火焰效果”。两稿以内部火芯建立物理光源，悄悄把无火焰缩为无外部／效果火焰。

A2/A3/B3 选暖色电光，B2 只写灯罩内暖黄光源，均可同时满足点亮提灯与无火焰。不要求全部稿用相同灯具设计；在这一用户明确禁火焰的情境中，不能自行增加可见灯芯火光。最小修复是换成灯体内无明火暖黄光源并保持其他句不动。来源规则已写用户硬锁优先，现有证据不足以把这项直接归因于拆分或专门平台入口。

### F14-02｜P2：C03 逐镜独立复制稿欠齐；完整序列内容仍成立

原请求说“连续两镜的完整中文分镜与视频母稿”，没有指定实际平台或逐镜提交方式；只按这段自然语言，完整 10 秒序列稿是合理组织。rubric:989（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/tests/evaluations/cineweave-split-case-rubric-v2-2026-10-12.json:989`） 另明确“独立可提交镜头稿展开必要共同事实”，现行 逐镜模板:140（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/prompt-detail-standard.md:140`） 也要求每镜详细卡及独立复制稿。因此分开记录两项：序列稿完整通过；rubric 的每镜独立复制交付未齐。

首次出现在 A2 C03:25（实际路径：`D:/Temp/cineweave-split-p4-baseline-a2-20261012/CW-SPLIT-C03.md:25`），随后 B1 C03:9（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C03-v1.md:9`）、B2 C03:23（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C03.md:23`）、B3 C03:23（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C03-first.md:23`） 都只提供一个带共用开头的 10 秒母稿块。S01/S02 两段在块内都完整；但若单独取出 S02，不含完整人物衣装、修理铺共同事实等，独立用稿者须自行补共用开头。A1/A3 已提供两条独立 5 秒稿，能直接作为正向对照。

最小修复是从已有母稿提取 S01/S02，各自补入必要共同事实与本镜入态，不重写动作或故事，不因近景不可见而硬塞完整脸部细节；可保留完整 10 秒母稿用于序列审阅。B 三次均出现、A 三次中一次出现，说明当前交付边界有持续不稳定；样本有限、输出组织未被严格控制，不能证明拆分造成质量下降，也不能据此禁止整段序列母稿。若 root 最终采用“只需一条序列母稿”的口径，必须显式将这项改记为 rubric/请求范围差异，不能改成动作失败。

### F14-03｜P3：准确台词已交付，但运动复制块外置；合理声音分稿需明示复制边界

A1 C02:16（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C02.first-response.md:16`） 在运动块内只写“唯一一句准确台词”，22–26 行（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C02.first-response.md:22`） 另有可复制的准确口播“你拿走吧”；B2 C02:22（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C02.md:22`） 在运动块内写“说出指定台词”，29 行（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C02.md:29`） 在块外加粗给出准确台词。两篇全文都逐字交付了台词，并有画内女声、口型和同步意图，不判漏台词、错台词或不完整 6 秒动作。

注意点仅是：用户若只复制标作“完整运动稿”的 text 块，准确台词不在块中，A1/B2 的交付边界不如另四稿直接。平台／声音能力未知时，单独声音稿是合法选择，源 SKILL:46（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md:46`） 及 声音规范:128（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/prompt-detail-standard.md:128`） 还要求台词、说明和音轨职责分开。最小改进是在运动稿对应说话节拍逐字保留台词，或明确标注运动稿需和独立声音稿共同交接；不要求平台原生发声，不把分开声音误判为失败。首次 A1、B2 复现，属于共用交付说明的清晰度，未证实新增 B 回归。

### F14-04｜P3：C04 B3 表项可区分夹具上下文与实际控件

B3 C04:13（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C04-first.md:13`） 在“夹具界面设置／填写”表中列“模式｜T2I，依据夹具”。原夹具只有中文提示词框与画幅下拉；T2I 是材料说明中的模式，不是已给出的第三个可填控件。正文和前言均准确标为虚构夹具，没有宣称模式下拉、在线能力或真实提交；因此只记表项说明歧义，不判虚构控件的硬失败。

最小改进是把“夹具上下文：网页 T2I”移到表外，设置表只列实际两控件；不存在的入口／参数可以在外部限制说明中列出。这是 B3 首次出现的低风险表达项，B1/B2 未出现。C04 六稿都未把内部母稿 ID、平台名、能力说明或参考占位符塞进画面正文，未补造 seed、参考上传、负向框、风格码或权利放行。A2 的非逐字改写保留同一构图与灯光来由，新增衰减／材质说明是同义可见化，不据此判改题材或母稿硬锁失真。

## 最小 source 建议与责任

建议只作通用交付边界澄清，不加入案例答案、固定字数、固定光向、固定艺术设计或完整工作表义务。当前存在的规则已经能支持正确稿；这些是帮助执行者稳定遵守的最小改进，不是已证明缺少规则的系统根因。

| 问题 | 最小 source 落点与可操作改动 | 验证范围 |
| --- | --- | --- |
| F14-01 负向硬锁被缩窄 | 导演 SKILL:39（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md:39`） 或 细节规范:11（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/prompt-detail-standard.md:11`） 加一句：补物理来由或可见细节时不得缩小用户排除范围；除非用户明确给例外，不能自行改成“局部／外露／效果除外”。 | 后续受控文字复测核对硬锁语义与正文；不需要为海报加全面六视角检查。 |
| F14-02 逐镜复制范围 | 逐镜模板:140（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/prompt-detail-standard.md:140`） 接一句：逐镜复制稿各自展开必要共同事实与入态；整段序列母稿可另存，不用要求复制者自行合并外部共享段。组织方式按本次请求／输入路径确定。 | 只在确实要求独立镜头交付的复测检查独立闭合；整段序列稿另按序列完整性评。 |
| F14-03 台词外置 | 导演 SKILL:46（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md:46`） 的“台词与说明分开”补清：分开口播正文和表演说明，不意味着用“指定台词”代替交付包内准确文本；单块复制或声音分稿的使用边界需明确。 | 核对说话人、准确全文与节拍关联，不用相同代码块数硬判；平台声音能力仍 unknown。 |
| F14-04 模式元数据与控件 | platform authoring SKILL:22（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/skill-sources/cineweave-platform/SKILL.md:22`） 加一句：界面设置表只列材料明确存在的控件；平台／模型／界面／模式等上下文另列，无证据不呈现为可填写控件。 | 对照精确夹具控件清单；不访问真实服务，不把 fixture 变成 live 核验。 |

作者源已从 catalog:11（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/scripts/skill-catalog.mjs:11`） 与 catalog:252（实际路径：`D:/study/projects/cineweave-codex-skills/cineweave-director/scripts/skill-catalog.mjs:252`） 核实：导演及共用 references 以 `skills/cineweave-director/` 为权威；专业入口正文以 `skill-sources/cineweave-platform/SKILL.md` 为作者源，再同步分发。后续若采纳建议应改这些来源并同步，不直接只改导出副本。本评审未实施建议、未覆盖首版、未将修后稿充当首次运行。

## 合理未决与统计边界

全部真实媒体、身份一致性、最终题字与画面留白、手部接触／承重可读性、口型／实际语音长度／同步、真实 5+5 秒切点、声音连续性均 unknown。C02 无首图时正确交付“待制初态＋运动设计”，不能因为有完整文字就标 I2V 已绑定或可提交。C04 仅在虚构 MosaicLabs／Canvas-Image 1.0／网页 T2I 材料条件下成立；真实中文排字、账号、隐藏默认与可用档位仍 unknown。

工具可用能力、自动选择机制、真实模型、tokens／延迟无法从这 24 篇内容稿可靠判断，均 unknown；metadata 的 null 不当零值，专业正文读取不当独立代理实际调用。这里没有测成本、自动触发或服务执行。三次重复只说明这些限定文字任务中哪些事实保留稳定、哪些交付边界有波动；不是普遍艺术成功率、媒体接受率、跨模型能力或因果证明。

## 已审首版索引

每格链接对应已阅读的完整首版侧稿；其全文与报告的保存完整性已核对。

| Run | C01 | C02 | C03 | C04 |
| --- | --- | --- | --- | --- |
| A1 | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C01.first-response.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C02.first-response.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a1-remaining-20261012/CW-SPLIT-C03.first-response.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p2-baseline-a-20261012/case-CW-SPLIT-C04.md`） |
| A2 | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a2-20261012/CW-SPLIT-C01.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a2-20261012/CW-SPLIT-C02.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a2-20261012/CW-SPLIT-C03.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a2-20261012/CW-SPLIT-C04.md`） |
| A3 | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a3-20261012/C01.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a3-20261012/C02.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a3-20261012/C03.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-baseline-a3-20261012/C04.md`） |
| B1 | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C01-v1.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C02-v1.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C03-v1.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b1-20261012/CW-SPLIT-C04-v1.md`） |
| B2 | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C01.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C02.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C03.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b2-20261012/CW-SPLIT-C04.md`） |
| B3 | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C01-first.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C02-first.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C03-first.md`） | 全文（实际路径：`D:/Temp/cineweave-split-p4-multiskill-b3-20261012/C04-first.md`） |
