> **公开版证据范围：** 宿主事件已进行结构化脱敏，不能独立验证实际读取；本机路径已脱敏。文中哈希及逐字节表述指原始本地运行或当时的 Skill 快照，并非公开脱敏文件的字节。详见[公开证据说明](model-adaptation-public-evidence-scope-2026-11-03.md)。

# 三模型适配：研究与前向审阅记录

日期：2026-10-31。计划、输入和验收负例见 [十轮方案](model-adaptation-plan-2026-10-31.md)。本记录是进行中的证据，不把十个并行首稿冒充十轮已完成的审阅与迭代。

## 基线与来源

- 独立只读审阅确认既有分镜覆盖叙事目的、动作和镜间接口；缺三模型的版本化实践。现有 76 项 `cinematic-cases.json` 为 `not_run`，不作为本次通过证据。
- 工作区开始时已有大量未提交和未跟踪改动。首次 `npm run validate` 和 `npm run skills:sync:check` 均因已有 F06 评测目录未列入严格源码清单而失败；已按现有真实文件逐项登记，未删除该目录。四类聚焦契约测试基线 204/204 通过。
- 官方来源、查阅日期和界面范围见 [三模型实践](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md)。可灵 4.0 的产品公告和 3.0 历史 API 分别处理；Wan 两份官方指南的建议镜长不同。所有实例是条件工作稿，不是供应商实测。
- 旧 `PromptProjectionPlan` 的源引用、参考数量和参数尾无法覆盖一般多模态视频交接。现阶段由完整正文及旁路工作表表达，并明确未受该契约完整验证；未变更旧契约或假造视频契约。

## 本次继续审阅的方案

先冻结实际读取快照，再分别检查：生产规划是否保留用户选择的整板路径，镜头示例能否按表演时序复原持物动作，Seedance 素材建议是否区分主体数和文件数，分段方案能否在有限槽位下维持跨段身份锚。验收负例包括一张图含两名人物、一个人物对应多张图，以及跨段重用素材后超过单段上限；不得把经验建议写成文件数量硬上限，也不得通过省略锚点掩盖无法满足的约束。每个修复需独立复核受影响的调用路径和示例引用，并在稳定快照上回归；真实宿主试跑、文字可执行性与生成媒体分开记录。

## 2026-11-02 的研究与修订方案

官方核对：百炼 Wan 3.0 文档／网页参考与首尾帧模式互斥；`file` 与 `link` 二选一，可与参考图／视频／音频组合，文档／网页输入需要 `prompt_extend=true`。中国站模型文档列出通过官方上传流程获得的临时 OSS 文件地址，国际站模型文档仅列公网文件地址；`link` 是免登录公开网页。文件输入用于生成视频，不等于视频接口提供逐字文本提取。来源：[中国站 API](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)、[国际站 API](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/wan3-video-generation-api-reference)、[临时文件说明](https://help.aliyun.com/zh/model-studio/get-temporary-file-url)。

修订验收：分镜规则允许动作中有明确接触相位地切出、有意越轴并重建方向；未交代的轴线跳变仍标为风险。Wan 交接需正确区分首尾帧与文件互斥、地区 URL 支持差异、需要智能改写及精确文字需要另行校对；未知地区和未授权的内部文件不得被描述成已经可以公开、上传或读取，不能杜撰视频接口返回提取文本。复测发现文件＋视频的参考生视频组合不能直接推出编辑模式支持该组合，应按具体模式交代已知与未核范围。Seedance 方舟 API 同时覆盖完全无声和无对白但保留环境声两案：前者检查 `generate_audio=false`，后者保留有声输出，并交代认证、异步任务查询及真实文件验收。之后按原题独立复测，同时回归不涉及文件的普通分镜；所有输出只作文字评审，不冒充真实宿主或视频生成。

进一步复测验收：仅当用户确实要求单次生成或一镜到底时，才把这项作为跨请求方案的硬锁；若未限制，可评估分别生成首帧片段和文件参考后段再剪接，并说明授权、可用能力、连续性及成片首帧仍待核。镜头有精确采用时长时，调整采用点后要重新核算时长与余量，不能把裁短的素材继续当作原长度。真实宿主 R07 输出暴露“支持上传参考图”与“能正确理解整板分格顺序”未分离：交付应明确整板解析和画幅待核，必要时给分格装配或首帧条件路径；有白缝的整体画布比例不得等同无缝纯画面比例。

片尾文案的验收：未知广告语时，某个两秒窗口只能是暂定时间安排，不证明可读。拿到准确文字后按实际画幅、字号、行数、背景和受众试排试读；固定总长时先在允许范围内提前入点或重排节奏，仍不足则明确未满足，不偷删文字、缩至不可读或擅自改变总长。纯分镜入口也需能找到这条交付规则。

可灵 4.0 新资料研究与计划：2026-11-02 搜索索引可读取[官方用户指南](https://kling.ai/quickstart/kling-4-model-user-guide)和[开发者模型页](https://kling.ai/dev/apiReference/model)的正文摘要；直接打开页面分别超时／仅返回应用壳，以下证据层级限定为官方搜索索引，非目标账号实测。指南区分 Omni Reference 与 Keyframes，给出各自 3–30 秒、1 秒步长、参考职责、素材类别与互斥规则、声音和默认分镜说明；开发者页出现 4.0 Preview，但精确 API 模型 ID 和参数未读取。指南对 4K／HDR 有表格与“coming soon”并存的表述，保持冲突而非断言可用。验收：针对已知可灵创作入口给有来源的差异，其他平台及 API 不沿用 UI 参数；明确 7 个 elements 不等同 7 个人，视频编辑／参考与视频元素共享配额，音效文件不能当作声线参考；互斥原目标保留、可选替代说明控制损失。对 R02 原题复测要区分官方默认智能分镜和实际账号控件，不臆造开关；同时保留单镜与准确文字的实际结果待验。

进一步核对发现[官方关键帧专题](https://kling.ai/blog/kling-4-multiple-keyframes-guide)称多关键帧可以与 Omni 参考协同，而用户指南将独立 Keyframes 与 Omni 作为不能合并的入口，且其首帧例又出现视频引用。资料尚不能闭合同任务的精确 UI 绑定语义；验收应保留待验证的同任务方案和不支持时的有损分任务方案，不将任一结果当作已实现。新增两道独立盲测：一题要求三个时刻的关键图加运镜视频且坚持同次生成；另一题要求产品图、声线样本和现成音乐，检查声线输入与音乐素材的差别、准确广告语及条件回退。

两道盲测的独立审阅发现：未知素材“未提供／未上传”不能推成“不存在／未制作”；缺视频输入的备选不能以局部替换母稿方式残留对未绑定视频的引用，须有与该备选实际输入一致的完整复制稿。声线档案可用不代表已证实可用于无画内人物的旁白，绑定能力本身和操作均须按入口核验。修订后按原题独立复测，正例要求原文和用户硬锁保留，负例不得伪称素材不存在、已上传、旁白音色已绑定或保留无效素材引用。

R02 真实宿主初稿的补充验收：手部特写若裁掉人物眼睛或伞尖，镜头卡仍需交代画外继承的视线与持物状态，但不应将其描述为该镜直接可见；下一镜重新给出可观察的反应证据。默认智能分镜不是一个必须手动开启的开关，文字时间码是导演意图而非逐帧保证。

R02 首次真实宿主复测实际读到了上述具体规则，但仍漏写 S02 双方画外视线和 S02／S03 伞尖状态；源码规则存在不等于行为通过。将逐镜相关状态／是否入画检查提到入口，再原题宿主复测。可灵声音盲测首次复测也仍缺仅含产品图的完整无声线回退稿，需在可灵声音适配中给具体交付规则，再按原题盲测并独立评审。

## 首版文字试跑和已发现问题

- [案例 1–5 输出](model-adaptation-forward-r01-r05-2026-10-31.md)及[实际读取文件哈希](model-adaptation-forward-r01-r05-sources-2026-10-31.txt)：独立代理依据当时的技能文件撰写。案例 1 的实际委托遗漏了方案中“横屏”和“沿远侧铰链”的两项条件，不能将其作为原案例完整通过；须以原输入重跑。案例 2 的第二镜把伞尖裁出画面，输出诚实说明该状态不可在该镜直接验收；据此已在分镜路由补充可见证据与画外继承的区别。案例 3–5 保留首图未知、多模型语义硬锁和参考职责，仍需按计划复核。
- [案例 6–10 输出](model-adaptation-forward-r06-r10-2026-10-31.md)及[实际读取文件哈希](model-adaptation-forward-r06-r10-sources-2026-10-31.txt)：未读本计划的独立代理完成文本试跑。案例 8 将同一画外钟声跨剪点延续直接称为 J-cut，证据不足；已在分镜路由补充分辨 J-cut、L-cut 与一般声音桥的规则，并安排原输入复测。其余案例仍需逐项独立核对。
- 模型参考页初稿把字幕包裹符误写成 `【】`，已按方舟官方页面改为 `〖〗`。独立文档复核指出两个以环境雨声做音频参考的例子缺乏明确官方依据，已改为官方列举的音乐参考，雨声另以文字描述；同时补充 Wan 有视频输入时的时长范围和文档内部续写歧义。Kling 发布公告日期与产品上线日期已分别说明。

[案例 1、8 的第一次复测](model-adaptation-retest-r01-r08-2026-10-31.md)及[读取文件哈希](model-adaptation-retest-r01-r08-sources-2026-10-31.txt)：案例 1 使用原输入，完整保留横屏、远侧铰链、左右手和唯一音效；案例 8 尽管读取了新增的一般规则，仍把两镜均为画外的同一钟声直接标为 J-cut，因此未通过该项。随后补充了针对声源归属不清的具体例子；仍需用新快照再次独立复测，不能把第一次复测写成已修复。

独立逐案复核补充：案例 5 的首轮委托遗漏了“从巷口”，必须用完整原输入重跑；案例 4 的三份稿保留硬锁，但缺来源范围明确的模型差异；案例 10 的最小修订未明确索取原候选片段、问题时间段或截图，故只部分通过。案例 2、3、6、7、9 的文字条件与限制基本吻合，案例 2 的画外伞尖、案例 7 的整板读取、案例 9 的分段损失仍须按各自条件核实。这些判定只针对文字，不代表已生成结果。

- [案例 8 的全新代理复测](model-adaptation-retest-r08-v2-2026-10-31.md)及[读取哈希](model-adaptation-retest-r08-v2-sources-2026-10-31.txt)：保留持钥匙的连续动作，并将两镜画外的单次钟声称为跨剪点画外声桥；这次文字检查通过，不能外推音画生成可靠性。
- [案例 4、5、10 的完整原输入复测](model-adaptation-retest-r04-r05-r10-2026-10-31.md)及[读取哈希](model-adaptation-retest-r04-r05-r10-sources-2026-10-31.txt)：案例 5 保留从巷口出发及四项参考职责；案例 4 仍缺明确的、按官方来源范围限定的差异说明；案例 10 已提出原片、时间点及原稿等证据，但补丁增加了用户未指定的开盖后继续扶盖终态，不能称最小修订。由此补充平台能力中的跨模型交付要求和评审路由中的单变量／未知终态约束，仍需新快照同输入复测。
- [案例 4、10 的第二次独立复测](model-adaptation-retest-r04-r10-v2-2026-10-31.md)及[读取哈希](model-adaptation-retest-r04-r10-v2-sources-2026-10-31.txt)：案例 10 保留未知终态，并明确需要原片、时间、原稿及可得设置，文字检查通过；案例 4 写出了按方舟、可灵公告和百炼限定的能力差别，但没有在交付中直接给出官方链接，仍需核对来源可追溯性。
- [案例 4 的第三次独立复测](model-adaptation-retest-r04-v3-2026-10-31.md)及[读取哈希](model-adaptation-retest-r04-v3-sources-2026-10-31.txt)：三份正文保留相同硬锁，交付列出三个官方来源链接和适用范围，仍明确目标宿主设置未知；本次文字检查通过，未进行外部生成。

完整测试曾在评测文件和源码仍被并行添加时运行，结果为 521/522；唯一失败是临时测试副本读取了旧的文件清单，却复制到了四个新评测文件。该结果不代表最终快照通过，须在文件稳定后重新执行。

九条模型示例的独立创作审阅发现：钥匙缺初态、向玻璃推进的路径含糊、人物走到门口的景别不足，以及首帧未限定动作所需内容。已逐例补充室内外空间、可达机位、持物与镜间状态，并把声音和参考职责写进相应正文；修改后的成片连贯性及声音仍未验证，需再做独立文字复核和回归。

新执行者独立复核修改后的九例，没有发现必然冲突；另指出可灵和 Wan 的两条图片输入例在转头后能否看见眼睛与钥匙不够明确。两条正文已补充声源方向、转头范围和可见要素。这是文本设计修订，不是实际构图或音画表现通过。

固定快照自动验证：`npm test` 522/522，`npm run validate` 通过，`npm run skills:sync:check` 519 文件一致，`npm run build` 通过，`npm run test:bundle` 9/9；之后登记新的回归稿并继续修改，故最终快照仍须重新校验。

以相同原输入回归了案例 2、3、6、7、9，完整文字见 [01](model-adaptation-regression-01-2026-10-31.md)、[02](model-adaptation-regression-02-2026-10-31.md)、[03](model-adaptation-regression-03-2026-10-31.md)、[04](model-adaptation-regression-04-2026-10-31.md)、[05](model-adaptation-regression-05-2026-10-31.md)，[读取文件哈希](model-adaptation-regression-sources-2026-10-31.txt)与[独立逐项审阅](model-adaptation-regression-review-2026-10-31.md)一并保留。审阅发现接续动作的反应相位、远近景与可见目标冲突、复制正文混入条件说明、能力冲突缺具体有损备选等问题；须修改并以原输入复测，不能宣称该批已全部通过。

修订上述问题后的固定快照再次通过 `npm test` 522/522、源码校验、构建及打包冒烟 9/9。[四案复测](model-adaptation-retest-four-2026-10-31.md)、[读取哈希](model-adaptation-retest-four-sources-2026-10-31.txt)及[独立评语](model-adaptation-retest-four-review-2026-10-31.md)表明：相位、景别和板图正文问题改善，但备选单首帧缺自己的运动稿，能力冲突缺可审阅的分段及参考分配，个别对白与持物关系不够清楚。已据此进一步修改作者源；修改后的复测与全量验证仍待完成，以上通过只适用于此前快照。

[三案新快照复测](model-adaptation-retest-path-2026-10-31.md)及[读取哈希](model-adaptation-retest-path-sources-2026-10-31.txt)：对白稿由女子持伞并朝男子递近；分镜板稿仅交付整板路径，没有提出单首帧备选；能力冲突稿保留原目标并给出两个 20 秒段、逐段 10 张的未批准条件方案，同时说明不再单次／同次全量参考及连续性风险。该批仍需独立评审及最终回归。

[独立评语](model-adaptation-retest-path-review-2026-10-31.md)确认对白与分段备选的文字条件通过；分镜板路径未提供计划要求的条件备选。已明确整板能力未知时应给相容备选及独立运动稿，仍需按原输入复测。

[分镜板复测](model-adaptation-retest-board-2026-10-31.md)、[读取哈希](model-adaptation-retest-board-sources-2026-10-31.txt)和[独立评语](model-adaptation-retest-board-review-2026-10-31.md)：整板与单首帧备选均有独立条件稿，中、右格未假称绑定，人物、左右手及动作先后保持，文字条件通过。实际 Wan 模式是否支持首帧仍需核验，文字不能证明生成画面、接触或声音通过。

[方舟编辑与百炼首尾帧负例](model-adaptation-boundary-cases-2026-10-31.md)、[读取哈希](model-adaptation-boundary-sources-2026-10-31.txt)和[独立审阅](model-adaptation-boundary-review-2026-10-31.md)区分了不兼容的原需求与有损备选；但审阅发现方舟编辑返回时长可能短于源片，不应固定按输入长度计算补时，且含真人人脸参考需核验实际准入；百炼后期配音还需处理默认声轨。已在模型指南补充两个官方误差说明之间的差异、实际测量、肖像输入渠道及音轨检查，仍须复测。

[负例复测](model-adaptation-boundary-retest-2026-10-31.md)、[读取哈希](model-adaptation-boundary-retest-sources-2026-10-31.txt)及[独立评语](model-adaptation-boundary-retest-review-2026-10-31.md)：输出已要求实测返回时长、核查肖像渠道，并区分完整配音与声线参考；但未直接写出方舟真人参考的上传限制和百炼 API 默认有声设置。已进一步明确这些有界官方条件，仍需原输入复测和最终工程验证。

[负例再次复测](model-adaptation-boundary-final-2026-10-31.md)、[读取哈希](model-adaptation-boundary-final-sources-2026-10-31.txt)与[独立评语](model-adaptation-boundary-final-review-2026-10-31.md)：交接已准确写出方舟直接上传限制、实测补时和百炼 API 默认有声及配音职责；原素材与真实输出仍未知。审阅时旧肖像指南的英文页面无法读取，现已将技能指引链接调整为中文真人素材录入指南；细分渠道仍须在执行前复核。

隔离 Codex CLI 的真实入口试跑未成功：2026-10-31 的终态事件分别报告 `gpt-6.1-terra`、`gpt-6.1-sol`、`gpt-5.3-codex` 对当前 ChatGPT 账号不支持（`model_not_found`）。三次均未产出可评审结果；这不影响已有离线代理评审，但不证明宿主自动发现、激活或十轮真实入口行为。

桌面版 CLI 的后续诊断：`0.163.0-alpha.10.2` 能以现有认证完成无工具的最小请求，但 R07 完整原题只自动选中了技能名称，读取隔离工作区的技能正文时 `exec_command` 报 `CreateProcess ... rejected: blocked by policy`，宿主也明确说明未读到文件。它保留了动作顺序，但未交付必要条件备选，不能算技能行为通过。无自动审批拒绝记录，策略来源未定位；没有修改规则或权限。原始请求、脱敏事件、快照哈希和答复存于 `LOCAL_TEMP/cineweave-host-r07-0xzl6a63`，适用范围仅限该快照。

继续审阅发现 Seedance 指南的「主体音视频 1–5 个、主体图 1–8 个」容易被误读为文件数。已对照方舟指南改为主体数量，补充一图多主体、多图同主体及多视角条件，明确经验建议不等于限制。独立源码审阅还发现 `production-plan.md` 将复杂分镜一律写成独立画格，和既有整板路径冲突；`ShotSpec` 示例在药盒下降前缺动作交代，且把焦距与透视混同。已按现有表演时序和机位关系修订，示例引用需依赖顺序刷新并重新验证。

参考槽位压力首稿（同一执行者自审，非独立评审）：假设 20 秒单镜须同时用甲、乙、门厅、盒、钥匙五张独立图，而目标测试模式每次仅三张；原要求不能满足。第一段人物和盒，第二段人物和钥匙，虽然每段三槽且明确有损，却漏列第一段需甲／乙／门厅／盒共四张、第二段盒仍出现因此需五张；空间锚两段均缺、第二段也缺盒。题设三槽不是实际可灵能力。已补充按每段实际职责、跨请求复用和入口限制计算预算，列明欠缺及取舍；新快照同题独立复测尚待完成。

2026-11-02 的[槽位原题](model-adaptation-slot-input-2026-11-02.txt)、[独立复测](model-adaptation-slot-forward-2026-11-02.md)和[独立评语](model-adaptation-slot-review-2026-11-02.md)：复测逐段列出四项／五项需求、实际三槽及缺项，给出两种有损分配；文字预算与承接通过，创意补全和实际媒体仍须核验。这是独立代理文字试跑，不是宿主加载通过。

[越轴原题](model-adaptation-axis-input-2026-11-02.txt)、[首稿](model-adaptation-axis-forward-2026-11-02.md)和[独立评语](model-adaptation-axis-review-2026-11-02.md)：首稿保留动作中切点、方向反转及地标，但机位视野、门扇扫掠和接触可见性仅为计划。源码中“稳定终态／轴线一致”与运动中切出及有意越轴冲突，已消除绝对表述；须用新快照复测，同时保留未交代方向跳变的负例。

[Wan 文档原题](model-adaptation-wan-file-input-2026-11-02.txt)、[首稿](model-adaptation-wan-file-forward-2026-11-02.md)和[独立评语](model-adaptation-wan-file-review-2026-11-02.md)：首稿识别首帧与文件互斥及准确文字需要校对，但把中国站临时 OSS 路径泛化至未知地区，且未建立视频 API 能返回提取文本的依据；它还读取了旧安装 platform 而非当前项目源，不能证明当前平台技能行为。已在模型指南补充地区范围、强制改写、文件传输和文本提取边界；须按原题用当前源复测。

[越轴新快照复测](model-adaptation-axis-retest-2026-11-02.md)及[独立评语](model-adaptation-axis-retest-review-2026-11-02.md)：保留运动中的接触相位、有意越轴、地标重建与方向反转，并将未解释方向突变作为风险；文字条件通过，实际机位和接缝仍未验证。

[Wan 原题新快照复测](model-adaptation-wan-file-retest-2026-11-02.md)及[独立评语](model-adaptation-wan-file-retest-review-2026-11-02.md)：A、B 条件方案基本可审，C 把 `file + reference_video` 的文件参考组合推为视频编辑可用，但官方编辑模式未列文件，故该方案未通过模式证据检查；严格原像素验收也不能只比较变换后的图像。已在作者源补充模式边界；需再复测。

[Seedance 声音原题](model-adaptation-seedance-audio-input-2026-11-02.txt)、[首稿](model-adaptation-seedance-audio-forward-2026-11-02.md)和[独立评语](model-adaptation-seedance-audio-review-2026-11-02.md)：前者完全无声对应 `generate_audio=false`，后者保留门轴声与雨声对应有声生成，文字检查通过；API 交接缺认证及异步查询说明。已在作者源补充方舟默认值、声音区别与任务查询，须按原题复测。

[Seedance 原题复测](model-adaptation-seedance-audio-retest-2026-11-02.md)与[独立评语](model-adaptation-seedance-audio-retest-review-2026-11-02.md)：音频开关、正文、认证及异步查询的文字交接通过；对恰好 6 秒的片段仅说“调整采用点”尚未闭合精确采用时长，未实际发生裁剪。已补充裁剪后重新核算、需要余量或另作选择的规则；仍待新快照复测。

[Wan 再次盲测](model-adaptation-wan-file-final-2026-11-02.md)与[独立评语](model-adaptation-wan-file-final-review-2026-11-02.md)：单请求互斥及 A／B 条件稿基本通过，但原题没有锁定一次请求或单镜，遗漏了首段首帧加后段文件参考再剪接的条件方案。已补入可供选择的分次路径及许可、首帧和连续性限制；不得将分次冒充原生同次生成，仍待原题新快照复测。

真实宿主 R07：桌面版 Codex 使用隔离当前技能快照，读取主技能、分镜／镜头／平台及模型实践参考后正常完成。原始[输入](model-adaptation-host-r07-input-2026-11-02.txt)、[输出](model-adaptation-host-r07-output-2026-11-02.md)、[脱敏事件](model-adaptation-host-r07-events-2026-11-02.jsonl)、[文件哈希](model-adaptation-host-r07-hashes-2026-11-02.json)、[终态](model-adaptation-host-r07-terminal-2026-11-02.json)、[快照比较](model-adaptation-host-r07-comparison-2026-11-02.json)与[独立评语](model-adaptation-host-r07-review-2026-11-02.md)均已保留。单镜三阶段、持物和首帧备选的文字条件通过；支持上传图片不证明支持按格理解整板，超宽画布和可读性也未验证。已加强整板解析与白缝比例的交接要求，仍须在新快照同题复测；R07 是一次宿主评测，不等于十轮完成。

R07 真实宿主新快照同题复测：完整[输出](model-adaptation-host-r07-final-output-2026-11-02.md)、[独立评语](model-adaptation-host-r07-final-review-2026-11-02.md)、[输入](model-adaptation-host-r07-final-input-2026-11-02.txt)、[脱敏事件](model-adaptation-host-r07-final-events-2026-11-02.jsonl)、[哈希](model-adaptation-host-r07-final-hashes-2026-11-02.json)、[终态](model-adaptation-host-r07-final-terminal-2026-11-02.json)和[快照比较](model-adaptation-host-r07-final-comparison-2026-11-02.json)显示：技能及相关参考读取成功、宿主正常完成；单镜阶段、动作接续、整板解析待核和首帧备选通过原 R07 的文字验收。超宽画布不支持时的分格装配仍是额外待定制作条件，未生成真实图片或视频。

[Seedance 时长复测](model-adaptation-seedance-timing-retest-2026-11-02.md)及[独立评语](model-adaptation-seedance-timing-review-2026-11-02.md)：两段各完整采用 6 秒、无法裁切而保持长度的条件已明确，静音与环境声设置及接口文字通过；实际媒体待验。[Wan 分次复测](model-adaptation-wan-splice-retest-2026-11-02.md)及[独立评语](model-adaptation-wan-splice-review-2026-11-02.md)：分次路径、素材授权与模式损失的文字条件通过；两段无剪辑余量及未知文案只暂定显示两秒，接缝和可读性待核。已补充文案试排与阅读窗口冲突处理，并从分镜路由连接；修改后复测仍待完成。

上述修订前快照的 `npm test` 为 522/522，源码、派生一致性、构建、构建包校验和打包冒烟 9/9 均通过；加入本批评测证据并修改文案阅读规则后，须重新验证最新快照。

[Wan 阅读窗口复测](model-adaptation-wan-readability-retest-2026-11-02.md)及[独立评语](model-adaptation-wan-readability-review-2026-11-02.md)：未知文案的片尾窗口明确暂定，须按实际设备试排试读；固定 12 秒内先重排且保留首帧，不足时列待选择约束。文字条件通过，实际文案、接缝和媒体仍未验证。

R01 真实宿主输出及证据：[输入](model-adaptation-host-r01-input-2026-11-02.txt)、[输出](model-adaptation-host-r01-output-2026-11-02.md)、[独立评语](model-adaptation-host-r01-review-2026-11-02.md)、[事件](model-adaptation-host-r01-events-2026-11-02.jsonl)、[哈希](model-adaptation-host-r01-hashes-2026-11-02.json)、[终态](model-adaptation-host-r01-terminal-2026-11-02.json)、[比较](model-adaptation-host-r01-comparison-2026-11-02.json)。原题的横屏、左右手、远侧铰链、木鸟、扶盖和唯一声音在冻结快照上通过文字验收；与现有源码的八处差异来自四套声音指南／分镜路由的后续阅读规则，不能称为当前完整快照已在宿主复测。

R03 真实宿主输出及证据：[输入](model-adaptation-host-r03-input-2026-11-02.txt)、[输出](model-adaptation-host-r03-output-2026-11-02.md)、[独立评语](model-adaptation-host-r03-review-2026-11-02.md)、[事件](model-adaptation-host-r03-events-2026-11-02.jsonl)、[哈希](model-adaptation-host-r03-hashes-2026-11-02.json)、[终态](model-adaptation-host-r03-terminal-2026-11-02.json)、[比较](model-adaptation-host-r03-comparison-2026-11-02.json)。冻结快照与当时源码一致；放杯／承重／松手顺序、首图条件和待核版本通过原题文字验收。输出自行补充固定机位及无对白／音乐，属于可调整设计假设，不应冒充用户指定或素材观察，真实媒体未验。

2026-11-02 阅读规则及此前证据登记后的固定快照通过 `npm test` 522/522、源码校验、派生同步检查、构建、构建包校验和打包冒烟 9/9。随后新增本段评测证据登记；Skill 字节未因此改变，项目源码清单已重新校验通过。

2026-11-02 的中间快照通过 `npm test` 522/522、源码校验、索引检查、派生一致性、构建、构建包校验与打包冒烟 9/9；随后根据上述复测继续修改模型指南与证据清单，故此结果不能用于证明最新快照。

2026-11-02 修改前固定快照 `npm test` 522/522；此后模型指南、分镜规则、评测清单和记录已改变，该结果仅证明修改前源码，最终快照需另行回归。

最新作者源验证：在模型实践页 SHA-256 为 `e32794594012f82adfdb720954401dd02a79445dca9514281cb5f1d1ab2510d4` 的快照上，`npm test` 522/522、`npm run validate`、`npm run skills:sync:check`（519 份派生文件）、`npm run build`、`npm run validate:bundle` 和 `npm run test:bundle` 9/9 通过，`git diff --check` 无错误。这是源码、结构和打包验证，不证明供应商或生成媒体；此段为测试后写入的验证记录。

R02 真实宿主[首稿](model-adaptation-host-r02-output-2026-11-02.md)及[独立评语](model-adaptation-host-r02-review-2026-11-02.md)发现近景未明确画外视线与伞尖状态；[同题复测](model-adaptation-host-r02-retest-output-2026-11-02.md)及[独立评语](model-adaptation-host-r02-retest-review-2026-11-02.md)仍未满足逐镜交接，即使事件表明已读取示例。已将相关持物、接触、关键物件与视线的画内／画外状态写入主入口；新快照宿主复测进行中。两次的输入、脱敏事件、文件哈希、终态和比较分别以 `model-adaptation-host-r02-` 与 `model-adaptation-host-r02-retest-` 为前缀归档。

R04 三模型与 R05 多参考的真实宿主输出及独立审阅分别见[输出 R04](model-adaptation-host-r04-output-2026-11-02.md)、[评语 R04](model-adaptation-host-r04-review-2026-11-02.md)、[输出 R05](model-adaptation-host-r05-output-2026-11-02.md)、[评语 R05](model-adaptation-host-r05-review-2026-11-02.md)。两案文字条件在各自冻结快照上通过，输入、脱敏事件、哈希、终态和当时的快照比较以对应前缀归档；之后平台指南继续修改，不能把旧快照当作当前源码的宿主验证。宿主也读取了全局记忆，故不是完全隔离的盲测。

可灵多关键帧与旁白声线两项独立文字测试分别保留[关键帧原题](model-adaptation-kling-keyframe-input-2026-11-02.txt)、[首轮评语](model-adaptation-kling-keyframe-review-2026-11-02.md)、[同题复测](model-adaptation-kling-keyframe-retest-2026-11-02.md)与[复测评语](model-adaptation-kling-keyframe-retest-review-2026-11-02.md)，以及[声音原题](model-adaptation-kling-audio-input-2026-11-02.txt)、[首轮评语](model-adaptation-kling-audio-review-2026-11-02.md)、[首次复测评语](model-adaptation-kling-audio-retest-review-2026-11-02.md)、[最终复测](model-adaptation-kling-audio-final-retest-2026-11-02.md)与[最终评语](model-adaptation-kling-audio-final-review-2026-11-02.md)。前者修正把未提供素材当成不存在及备选稿引用未绑定视频；后者补全可单独复制的产品画面稿，并将旁白与原音乐交由后期条件处理。最终文字验收通过，实际入口组合、素材、声线绑定与生成质量仍待验证。

R02 新快照同题真实宿主[输出](model-adaptation-host-r02-final-output-2026-11-02.md)及[独立评语](model-adaptation-host-r02-final-review-2026-11-02.md)通过计划内文字验收：画外视线与伞尖状态、持续接触和承重均明确，三镜各 4 秒且衔接。该次运行的 692 项技能快照与运行时源码一致；宿主读取过全局记忆。完整输入、脱敏事件、哈希、终态与比较以 `model-adaptation-host-r02-final-` 为前缀归档。

R06 真实宿主[输出](model-adaptation-host-r06-output-2026-11-02.md)及[独立评语](model-adaptation-host-r06-review-2026-11-02.md)：原句、女声归属、男子静默、伞尖轻擦及原生／后期交接在文字层面成立，但输出引用音频能力时未保留官方工作区或 Omni 模式的具体归属，未通过全部模式证据验收。源指南此前已有限定，本次修订进一步要求交接时直接写明入口与范围，并同步派生。输入、脱敏事件、哈希、终态与比较以 `model-adaptation-host-r06-` 为前缀归档。

R06 [同题宿主复测](model-adaptation-host-r06-retest-output-2026-11-03.md)及[独立评语](model-adaptation-host-r06-retest-review-2026-11-03.md)通过冻结快照的文字验收：7 秒、音画同步和声线参考限制均写明官方工作区与适用模式，精确台词、擦地动作及原生／后期完整交接保留。原题与首测逐字节一致，事件、哈希、终态及当时比较以 `model-adaptation-host-r06-retest-` 为前缀归档；之后 R09 修改了四份视频平台适配参考，故不能把当时 692 项一致推广到当前源码。

R08 真实宿主[输出](model-adaptation-host-r08-output-2026-11-02.md)和[独立评语](model-adaptation-host-r08-review-2026-11-02.md)通过原题文字验收：钥匙交接相位跨镜承接，单次钟声跨剪点且先于转头，未误称 J/L cut。输入、脱敏事件、哈希、终态与比较以 `model-adaptation-host-r08-` 为前缀归档。R06 与 R08 快照在运行时各有 692 项一致，但宿主均读取过全局记忆，且上述 R06 后续源码修订发生在这些测试之后。

R09 真实宿主[输出](model-adaptation-host-r09-output-2026-11-03.md)和[独立评语](model-adaptation-host-r09-review-2026-11-03.md)未通过全部文字验收：未在官方 3–30 秒、10 图及 15 项限制旁逐项标注适用模式，且只泛称分段，未列出可审阅的时长、素材职责、承接和待提供对白。输出保留指定模型及原目标，正确辨认 20 图是输入还是输出仍需澄清。宿主冻结快照与当前比较有四处模型实践页差异；本案须在修订后同题复测。

针对 R09 在平台适配参考增加工作区／模式归属和缺剧情时的两段条件母版后，[同题宿主复测](model-adaptation-host-r09-retest-output-2026-11-03.md)及[独立评语](model-adaptation-host-r09-retest-review-2026-11-03.md)确认模式范围、时长、重复素材预算、承接与对白占位已补齐，但各段素材职责的代表性分配及只有文字时的准备步骤仍不足。已再补两个独立任务的条件占位示例、共同素材重复计数、未绑定四张的损失和权限／审核步骤，并启动同原题再次宿主复测；这些均为假设，不代表素材已存在或方案已采用。

R09 [再次同题宿主复测](model-adaptation-host-r09-final-output-2026-11-03.md)和[独立评语](model-adaptation-host-r09-final-review-2026-11-03.md)通过计划内文字验收：两段各列出素材职责，四张重复参考计入两次、合计覆盖 16 张，另四张未绑定；同时保留对白占位、准备步骤与单次生成损失。实际素材的使用及上传权限尚需依来源与用途核实；本次没有素材上传或媒体生成。宿主运行时 692 项一致，随后仍有新的源码修订。

R10 真实宿主[输出](model-adaptation-host-r10-output-2026-11-03.md)及[独立评语](model-adaptation-host-r10-review-2026-11-03.md)通过文字验收：将口头反馈作为线索，未虚构成片观察，给出可撤回的单项手部职责修订，并保留原动作、木鸟和固定机位。输入、脱敏事件、哈希、终态及比较分别以 `model-adaptation-host-r09-`、`model-adaptation-host-r10-` 为前缀归档。两次宿主均读取过全局记忆，未验证真实媒体。

受影响回归：[R01 最新快照输出](model-adaptation-host-r01-current-output-2026-11-03.md)和[独立评语](model-adaptation-host-r01-current-review-2026-11-03.md)主要文字验收通过，木鸟露出后视线句序仍有轻微歧义；[R04 最新快照输出](model-adaptation-host-r04-latest-output-2026-11-03.md)与[独立评语](model-adaptation-host-r04-latest-review-2026-11-03.md)确认三份模型稿保留原题动作、构图与时长约束并限定服务范围。两案在各自运行时 692 项快照一致，R09 随后的适配参考修订造成四份差异；宿主曾读取全局记忆。各自完整输入、脱敏事件、哈希、终态与比较按对应前缀归档。

在 R09 再次补充素材分配示例之前的固定快照，`npm test` 522/522、派生一致性检查、`git diff --check`、构建、构建包校验和打包冒烟 9/9 通过；后来修改四份作者源及派生参考并登记证据，最新快照仍须重新验证。

在 R09 补充后的固定快照再次通过 `npm test` 522/522、派生一致性、构建、构建包校验和打包冒烟 9/9。后续[跨模型独立审阅](cineweave-crossmodel-audit-2026-11-03.md)发现方舟首帧与全模态参考互斥、方舟参考／编辑路由、Wan 首帧初态和可灵原片编辑的交接缺口；[创作全链路独立审阅](cineweave-fullchain-review-2026-11-03.md)发现脸部稳定表述与表演变化、图生视频“稳定终态”与运动中切点的歧义。已修改三份作者源并同步九份派生，专门的真实宿主正反例和新快照工程回归仍在进行。这些发现是文档与交接风险，不能冒充已观察到的模型失败。

上述六项修订快照通过 `npm test` 522/522、派生一致性、构建、构建包校验和打包冒烟 9/9。[可灵编辑与 Wan 首帧宿主专项](cineweave-host-edit-firstframe-output-2026-11-03.md)及[独立评审](cineweave-host-edit-firstframe-review-2026-11-03.md)通过计划内文字检查。三案[创作全链路独立评语](cineweave-host-fullchain-review-2026-11-03.md)确认[运动中切点](cineweave-host-fullchain-door-motion-output-2026-11-03.md)和[明确停稳](cineweave-host-fullchain-door-hold-output-2026-11-03.md)的对照通过；[对白稿](cineweave-host-fullchain-face-output-2026-11-03.md)保留面部表演，但依赖未提供的参考及原场景，未通过独立可复制交接。三案进程退出码及完成事件从包装器文件锁失败中恢复，是否超时未知，不能写成已确认未超时。

[方舟模式宿主专项](cineweave-host-seedance-modes-output-2026-11-03.md)及[独立评语](cineweave-host-seedance-modes-review-2026-11-03.md)确认互斥、参考／编辑分路及参数范围基本成立，但严格首帧备选漏查手中是否已有布，也没有从空手取布的过程，故未通过全部交接检查。已在导演入口补充无参考时自包含设计、严格首帧的手位／持物／接触核对与从实际初态出发的动作要求；对白和方舟同题复测及 Wan 空手首帧受影响回归正在进行。对应输入、脱敏事件、终态、哈希与比较按 `cineweave-host-fullchain-`、`cineweave-host-seedance-modes-` 和 `cineweave-host-edit-firstframe-` 前缀归档。

导演入口首轮修订后的[对白同题复测](cineweave-host-face-retest-output-2026-11-03.md)与[独立评语](cineweave-host-face-retest-review-2026-11-03.md)仍未通过：已有暂定空间，但人物外观、服装仍要求绑定未提供的参考，即使事件显示读过新规则。[方舟同题复测](cineweave-host-seedance-modes-retest-output-2026-11-03.md)与[独立评语](cineweave-host-seedance-modes-retest-review-2026-11-03.md)仍未通过：首帧条件仅要求持布且可触及，正文却从布已接触玻璃开始；编辑设置表又将基本对齐的时长误写为继承。两案运行时快照一致，随后已有源码修订。

针对上述遗漏，入口补充无参考时可撤销的人物／服装／空间完整示例，以及持有、靠近、接触不同初态的逐项对照；模型实践页补充编辑表格“画幅沿用、时长基本对齐并实测”的一致表述。另据[可灵官方指南](https://kling.ai/quickstart/kling-4-model-user-guide)补充 Omni 参考／编辑视频的单段时长、大小、比例与共享额度交接；[联合受影响回归](cineweave-host-edit-firstframe-regression-output-2026-11-03.md)及[独立评语](cineweave-host-edit-firstframe-regression-review-2026-11-03.md)确认空手首帧与编辑／运镜分路通过，但指出先前输出未列完整视频规格。三项新快照同题复测正在进行，未完成前不称修复通过。

[对白再次同题复测](cineweave-host-face-final-output-2026-11-03.md)与[独立评语](cineweave-host-face-final-review-2026-11-03.md)通过冻结快照的文字验收：可撤销人物、服装与场景进入正文，原句、面部表演和雨声保留。[可灵规格联合回归](cineweave-host-edit-firstframe-spec-output-2026-11-03.md)及[独立评语](cineweave-host-edit-firstframe-spec-review-2026-11-03.md)通过视频规格、编辑／运镜分路和 Wan 空手初态的定向文字验收。

[方舟再次同题复测](cineweave-host-seedance-modes-final-output-2026-11-03.md)与[独立评语](cineweave-host-seedance-modes-final-review-2026-11-03.md)确认布已接触玻璃与编辑时长口径已修正，但首图条件仍遗漏正文写定的人物／灯画面左右、空间关系及初始视线，故未全部通过。导演入口已增加按当前正文逐项核对初态的通用要求，明确与实图或用户硬锁冲突时的处理，不把本例构图推广成所有任务的默认；方舟原题及 Wan／可灵联合题的最新快照宿主回归进行中。

[问题级迭代梳理](cineweave-iteration-chronology-2026-11-03.md)列出 16 条有独立发现、源码修订、同题复测及评语的不同文字问题链，区分代理与真实宿主和后续风险；该审计早于本次方舟初态再修订与证据归档。链条有并行和同题多问题拆分，不应简单说成 16 轮串行宿主迭代。

[真实宿主问题链审计](cineweave-host-iteration-audit-2026-11-03.md)另逐条核对了 17 项不同问题的宿主前稿、独立评语、作者源哈希变化、原输入哈希、同题宿主复测和独立评语，已超过十条实质性的文字问题闭环；其中部分问题共享一次修改或并行开展，不能据此称为 17 轮严格串行的全项目迭代。实际供应商能力、媒体质量及用户验收不在这些证据范围内。

[去重后的宿主快照区间](cineweave-host-iteration-intervals-2026-11-03.md)将上述问题链按相同前后冻结快照聚合为 13 组可区分的变更区间，列出对应问题、作者源哈希、同题复测及评语；它不证明恰好有 13 次源码写入或 13 轮严格串行全项目审阅。

[方舟第三次同题复测](cineweave-host-seedance-modes-r3-output-2026-11-03.md)及[独立评语](cineweave-host-seedance-modes-r3-review-2026-11-03.md)确认此前人物／灯构图、手布状态、视线和编辑时长已闭合，但正文要求室内暖光、站台冷雨光连续，首图条件仍未核该光色关系。[Wan／可灵联合回归](cineweave-host-edit-firstframe-global-output-2026-11-03.md)及[独立评语](cineweave-host-edit-firstframe-global-review-2026-11-03.md)确认空手动作与可灵路径成立，但未明确交接将实际图片绑定到目标入口的首帧输入。已在导演入口增加按本镜需要核对光向／明暗／冷暖或从实图光色过渡，并明确实际首帧绑定与入口支持；两案同题最新快照复测进行中。

[方舟第四次同题复测](cineweave-host-seedance-modes-r4-output-2026-11-03.md)及[独立评语](cineweave-host-seedance-modes-r4-review-2026-11-03.md)通过专项文字验收：首图条件与正文初始构图、视线、手布接触和光色一致，三条模式、时长、声音及损失均按原题交接。审阅时曾将 C 稿“不新增字幕”误读为删除源片字幕，复核原文后已撤回该误报。[Wan／可灵新回归](cineweave-host-edit-firstframe-light-output-2026-11-03.md)及[独立评语](cineweave-host-edit-firstframe-light-review-2026-11-03.md)确认真实首帧绑定已交接，但将“手在身侧且可达”误判为必然没有靠近玻璃；无图及距离证据时两种情况均可能。已在导演入口区分未能证明一致与已证明矛盾，并按实际首图条件分支，同题复测正在进行。方舟通过快照先于此项后续入口修订。

[Wan／可灵再次同题复测](cineweave-host-edit-firstframe-retest2-output-2026-11-03.md)及[独立评语](cineweave-host-edit-firstframe-retest2-review-2026-11-03.md)通过定向文字检查：身侧与靠近可同时成立，未假称已接触或空手，分别给出待实图核对的手部状态、动作处理与真实首帧绑定。可复制段适用于未靠近且可抓取的条件；其他状态为局部修改指导，原题没有完整旧稿，不能声称已交付合并后的完整镜头稿。真实图片、素材规格、接触及媒体仍未验证。

在这次评测证据登记之前的最新技能与工程源码快照，`npm test` 522/522、`npm run skills:sync:check`（519 份）、`npm run build`、`npm run validate:bundle`、`npm run test:bundle` 9/9 及 `git diff --check` 通过。随后仅登记本次评测文件与白名单，须再运行源码清单及链接校验；该测试不代表媒体质量或账号可用。

针对统一入口的最终受影响回归，[R02 宿主输出](cineweave-host-r02-final-regression-output-2026-11-03.md)与[独立评语](cineweave-host-r02-final-regression-review-2026-11-03.md)通过三镜持伞、画外视线及伞尖等文字衔接；[R06 宿主输出](cineweave-host-r06-final-regression-output-2026-11-03.md)与[独立评语](cineweave-host-r06-final-regression-review-2026-11-03.md)通过准确对白、声音及官方入口范围的文字检查。[R07 宿主输出](cineweave-host-r07-latest-output-2026-11-03.md)及[独立评语](cineweave-host-r07-latest-review-2026-11-03.md)确认三格同镜和首帧备选，但未明确区分整板图片可上传与模型正确解析三格顺序和动作阶段，专项交接不足。已将该区分、逐格试片验收与画布比例提升到导演入口，R07 正以原题复测。三案各有输入、脱敏事件、哈希、终态和比较；宿主读取过全局记忆，无实际媒体。

[R07 同题复测](cineweave-host-r07-final-output-2026-11-03.md)及[独立评语](cineweave-host-r07-final-review-2026-11-03.md)已明确上传不等于理解格序，三阶段与独立首帧稿也成立；但整板路径的验收清单未逐项写出左格闭盖、中格半开和右格露鸟，16:3 画布支持及加白缝后的比例重算也未交代。已在入口增加逐格验收及无缝比例的条件示例，并保持格数／动作／比例随本题变化；原题正在再次真实宿主复测。

[R07 再次同题复测](cineweave-host-r07-r2-output-2026-11-03.md)及[独立评语](cineweave-host-r07-r2-review-2026-11-03.md)确认原题同镜、手位、逐阶段验收、上传与解析的区别、16:3 支持待核及白缝重算均已交代。剩余扩展制作缺口是：该方案自行选择 16:3 整板，但未说明生图工具不支持该比例时的制板路径；视频端不能解析整板的单首帧备选处理的是不同问题。已补充支持布局或分格生成后装配的条件方案、独立静态稿与一致性风险；同题宿主复测进行中。用户原题并未锁定 16:3。

[R07 分格方案复测](cineweave-host-r07-r3-output-2026-11-03.md)及[独立评语](cineweave-host-r07-r3-review-2026-11-03.md)确认已有分格生成和依序装配，但各格自称可独立复制的段落仍依赖共同前言的画幅／风格和“原来的盖角”等悬空指代。已在导演入口加入逐代码块自包含检查，要求每格重复实际所需的人物、场景、画幅、机位和具体接触等，再按原题复测。三格装配是该方案主动提出的条件备选，不是用户硬性要求。

[R07 分格自包含复测](cineweave-host-r07-r4-output-2026-11-03.md)及[独立评语](cineweave-host-r07-r4-review-2026-11-03.md)通过文字验收：三个静态代码块各自包含 16:9、风格、人物、场景、机位、光线和明确握点；制板装配与视频首帧回退分别交接，逐阶段试片条件完整。各格真实生成后的一致性、Wan 对整板的理解和实际视频仍待验证。

登记本次 R07 证据前的最新技能及工程快照：`npm test` 522/522、`npm run skills:sync:check`（519 份）、`npm run build`、`npm run validate:bundle`、`npm run test:bundle` 9/9、`git diff --check` 均通过。此后仅登记评测证据及白名单，需再验证源码清单和链接；宿主文字结果与真实媒体验收保持区分。

在此轮 R07 入口修订之前的快照，`npm test` 522/522、派生一致性、构建、构建包校验和 9 项安装冒烟均通过；此次新入口及证据登记后的最新快照仍须验证。

前一固定快照的 `npm test` 522/522、派生一致性、构建、构建包校验和打包冒烟 9/9 通过。随后补充首帧光色与绑定规则、登记新证据，最终快照仍须工程验证。迭代审计刚归档时有绝对本机链接导致一次构建及 5 项测试失败，改为仓库相对链接后源码校验、构建、522 项全量测试与 9 项打包冒烟在修正前述新规则的快照上通过；不得把该失败隐去或将旧快照结果推广到之后修改。

[十轮状态审计](cineweave-ten-round-audit-2026-11-03.md)记录了审计时十个原题的宿主、独立评审、修订与快照差异；该文件早于本次 R09 再次复测与上述新修订，故它的 R09 状态与当前源码差异是历史快照，不是最新结论。十个案例均有宿主首版和独立评审，但案例数量不自动等于十轮连续迭代，仍须将每轮修订、复测、受影响正反例及最终快照覆盖闭合。

在本次 R06 入口归属修订和以上新证据登记之前的源码快照，`npm test` 522/522，`npm run validate`、`npm run skills:sync:check`、`npm run build`、`npm run validate:bundle`、`npm run test:bundle` 9/9 与 `git diff --check` 均通过。该工程结果不能直接代替修订后的最终回归。

这些证据包含真实宿主文字运行和独立代理演练；没有实际调用视频生成模型、上传素材或验证成片与声音，因此不能证明账号能力、可剪性、艺术质量或用户接受。十轮的逐轮首版、问题、改动、同输入复测及最终回归尚未全部完成。
