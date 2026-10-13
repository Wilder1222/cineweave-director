# CineWeave P3 独立阶段 review · 2026-10-12

结论：`passed_with_evidence_limits`。P3 工程与本轮六案首版未发现新增阻断，可进入 P4。这个结论限于实际读取的三入口、分发工程与本轮文字交接；不是全项 passed，也不代表全 32 案、自动触发、逐案独立上下文或媒体质量通过。保留一项审计完整性提醒及全部未知项。

审阅范围：只读产品与工程证据，完整读取 A/B 六案回答，按 rubric-v2 的 P3 子集判断；仅写本报告，不修改产品或首版回答，不重跑整套回归、安装矩阵，不构建 bundle。历史记忆只提醒证据层级，当前结论均来自本次文件和实际只读检查。

## 工程与职责

独立执行 Node API，原生 exit_code=0：`createDistributionInventory()`、`validateRepository()`、`validateBundle(.build/cineweave-director)`、`validateBundle(.build/cineweave-reference-skill, sourceRoot, {target:{type:'skill',name:'cineweave-reference'}})`、`syncSkillExports({check:true})`。结果：

| 核对项 | 实际结果与含义 |
| --- | --- |
| 启用与实际归属 | director/platform/reference 已启用，review 未启用；实际 root owner 为 47/1/4。导演 target 为43，但继续承担尚未启用 review 的4根契约。reference 仅拥有 ReferenceAsset、ReferenceObservation、ReferenceBindingSet、AssetAliasRegistry；platform 仅拥有 PromptProjectionPlan。 |
| namespace 与领域 | contracts/lifecycle/index 的 skill 均为 `cineweave-director`；12 routes、52 root kinds、54 schemas、52 examples、42 references。专业入口没有另建协议或改变 domain route owner。 |
| 唯一作者源 | reference 作者目录只有 `SKILL.md` 与 `agents/openai.yaml` 两文件；子包159文件，其中157共享文件仍从 canonical director 取源。入口及 agent 与真实派生副本逐字节相同；全插件479 exports 来自165唯一 sourceFiles。 |
| 源码与完整包 | source、完整 plugin 各479 files/exports，`valid=true`、`byteIdentical=true`。 |
| reference 独立包 | 160 files/exports/sourceFiles，四类实际 owner，完整共享闭包，`valid=true`、`byteIdentical=true`。 |
| 同步检查 | 两子包318项，check模式 `filesUpdated=0`；无漂移或未登记文件。 |

代码依据：`scripts/skill-catalog.mjs:87-143,231-278` 从 canonical domain 与启用集合派生 actual owner；`validate-repository.mjs:832-960` 逐项核对精确目录、作者表面、物化包与源字节；`sync-skill-exports.mjs:49-99` 先核对来源与未知条目，再处理登记的派生文件。完整共享闭包不增加专业入口所有权，也不是全部必读。

入口边界已核：reference `SKILL.md:14-26` 禁止把缺图声明写成 visible，排除服装模特脸与身体、风格图服装，只有准确目标存在后才正式绑定，alias只按指定精确 registry 解析。`SKILL.md:38-46` 限定参考交付、按实际宿主入口回流，禁止猜兄弟路径或伪称调用。导演 `SKILL.md:56` 明确组合请求继续完成最终人物或镜头稿。

P2 的共同 W-C06 提醒已实施：platform 作者源及派生副本 `SKILL.md:23` 增加能力清单的证据来源与查阅日期，缺失标未知。其 hash 在下文登记。P3 六案不包含 C06，因此这里只确认文字补强和工程同步，不能写成该行为 warning 已复测关闭；应保留原首版并在 P4 三次冷启动 C06 核对。

已读取负责人真实日志，未冒称独立重跑：`D:/Temp/cineweave-split-p3-targeted-20261012.log` 为135/135 pass、0 fail/cancelled/skipped/todo；source/build 为479文件通过；reference leaf构建及validation为160文件通过；`D:/Temp/cineweave-split-p3-install-matrix-20261012.log` 为三入口 full-plugin/standalone 六布局加parent共7/7通过。安装测试源码实际从已构建包复制、在包外 cwd、清空 NODE_PATH/NODE_OPTIONS，核对四个CLI成功/unknown/重复键退出码及输入和包快照只读。这些工程结果不证明宿主自动选入口或媒体效果。

## 六案 A/B 首版

实际输入：`D:/Temp/cineweave-split-p3-raw-inputs-20261012.json`，3665字节，SHA256 `054a9b5664a03cae4bfe3eef0cffca9584662aeada8af2e2be28a930376ca34e`。独立核对六条 request 与 C05 rawData，均与冻结输入逐字相同。rubric-v2 revision=2，SHA256 `065280014d477f7e116acd95d6ed0c8cb0e69fe372fabd6caaf38b497997091b`；只判断其P3五个trigger加一个content，未改整库 `not_run` 定义。

A是实际冻结单入口；显式 reference 不存在时坦诚恢复导演内联参考路由。B是P3三入口同一代理读取路径，表中B只是本次对照标签，不代表已完成P4四入口配置。主负责人分别如下：

| 案例 | A / B 最终主负责人 | 全文判断与直接依据 |
| --- | --- | --- |
| T05 | director / reference | A38起、B33起。均把无图用途标declared，分离脸/衣服/气氛；排除衣服模特身份与气氛图衣服，不抢交最终人物稿。无新增阻断。 |
| T06 | director / reference | A60起、B53起。@MeiFace、@BlueCoat原样未解析，不从名称猜脸或蓝外套；缺registry scope/ID/version/hash及准确目标继续未知，没有latest或全局搜索。无新增阻断。 |
| T13 | director / reference | A88起、B80起。A身份/B服装/C油画分别迁移，明示排除B模特脸与C服装；具体属性待材料，不写可见观察，不追加最终人物稿。无新增阻断。 |
| T14 | director / reference | A110起、B100起。只保留@OldStation与场景用途声明，不猜图、站台结构、年代、地点或最新候选；列缺身份与绑定。无新增阻断。 |
| T18 | director / director（reference辅助） | A142起、B127起。先整理A身份/B红棉外套/C水彩，再交完整中文人物复制稿；成年女子、短黑发、方圆脸、红色无标志棉外套及水彩均保留。额外五官/站姿/下装/光线明确暂定原创，未冒充参考观察或批准。无新增阻断。 |
| C05 | director / director（reference辅助） | A176起、B163起。均完成职责、冲突与完整全身站姿稿，保短黑发方圆脸、红无标志翻领长袖棉外套、黑直筒裤；北墙工具架/西窗/中央木桌关系进入正文，桌子未遮腿脚。B模特长发/脸、D服装不迁入。declared、暂定设计、正式绑定及权利unknown区分明确。无新增阻断。 |

T18 与 C05 的 producer/consumer 证据是同一代理回答中的职责/排除表、冲突决定与随后完整人物正文，可逐项对照，并无第二代理单独重造身份的记录。不能把该文本整合宣称为真实宿主委派。

两方文字创作有允许范围内的差异，例如T18领型、下装及画幅的暂定选择；没有依据把它们记成硬锁回归，也没有真实图像可判断孰优。未发现虚构visible、正式素材绑定、身份一致、在线能力、权利放行、供应商执行或媒体成功；四份材料没有被误写成已观察图片。六案均为完整首版，审阅者没有替作者补答案或修掉文本问题。

## 首轮证据与未解决限制

**W-P3-TRACE（非阻断审计提醒）**：B登记三个入口与输入hash，共享路由/章节只登记路径及范围，没有逐文件hash；A登记了所用共享文件hash。两方均未附可直接复放的原始工具命令与stdout/stderr，A仅叙述命令过程与退出码，B另列tool IDs。因此本审阅能确认报告中的真实入口/输入路径和hash与当前字节相符，不能把报告摘要当作完整原始运行日志或精确逐案加载回放。后续冷启动宜逐次保存读取命令、所读文件hash与原始输出，保留本轮首版。这个提醒不等于产品行为失败，也不构成媒体证明。

A的首次合并读取显示截断原样保留；随后定向读取细节指南1—110行恢复本任务主要表达、人物、情绪和场景章节。报告没有原始stdout，不能独立重建首次完整显示范围；其S6索引中额外列“交付前检查”也不提升为已证明完整阅读该章节。当前没有未恢复的任务必要输入缺口，但不能删除首轮截断记录。

A/B各在一个fork_none上下文处理六案，不是六次独立冷启动；本轮未发现把相邻案原创内容当成用户事实，仍不能证明隔离稳定性。入口按人工给定路径读取，没有实际宿主自动选择、真实安装调用或触发准确率证据。model、reasoning、token、效率均未有可核验测量，不由字节或字符数估算。所有输入无实际媒体，身份一致、观感、动作时序、连续性与声音同步均未验证。P4/P5/P6尚未完成；本轮外26案未在本次重测，P2九案继续保留其单独记录，P2原warning不能被本轮六案覆盖。

审阅的完整首版文件保留原字节：

- A：`D:/Temp/cineweave-split-p3-baseline-a-20261012/report.md`，27009字节，SHA256 `4313a9946012df326a33b216ec4de07e02950ae36715b389f2dcda810eaf1270`。
- B：`D:/Temp/cineweave-split-p3-multiskill-b-20261012/report.md`，27167字节，SHA256 `4af0fba570cd24f015a5396cffa1b8c0c79e8227860567aca5b6db05dc7d1d28`。

实际源入口定位与hash已由本review重新读取核对：

| 路径 | SHA256 |
| --- | --- |
| `D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored/skills/cineweave-director/SKILL.md` | `18d40408575640d65220b0d4527d356ec4509dc7856e8f0c35dc15142c2af426` |
| `D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md` | `f9ae907090ec7d0517cba32a774e72e0d28f9d0b5f686f60e7ea7248fe67e78f` |
| `D:/study/projects/cineweave-codex-skills/cineweave-director/skill-sources/cineweave-reference/SKILL.md` 与 `skills/cineweave-reference/SKILL.md` | `931b1f173fcd94b5e409e8cb44983662f6ba8885d216d9d5e819360aece3159d` |
| `D:/study/projects/cineweave-codex-skills/cineweave-director/skill-sources/cineweave-reference/agents/openai.yaml` 与 `skills/cineweave-reference/agents/openai.yaml` | `f52c9f3d3999da4ee8cac9ff3bc9eb70a41ab75110b75d7973361af0e22cdf93` |
| `D:/study/projects/cineweave-codex-skills/cineweave-director/skill-sources/cineweave-platform/SKILL.md` 与 `skills/cineweave-platform/SKILL.md` | `b4a67bd86ef0ceddf84679afee2b09fca2f73234d815eae654be0534793baa56` |

A来源索引的其余六份冻结共享文件hash也逐项重新读取相符；本轮没有以较早HEAD代替冻结工作树。代码无新增阻断缺陷，有限文字对照无新增global blocking，证据完整性仍有限，以上状态分别报告。

