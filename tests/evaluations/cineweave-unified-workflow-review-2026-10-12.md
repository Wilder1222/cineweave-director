# CineWeave 统一入口工作流独立审查

日期：2026-10-12。审查者为本次独立子代理；只读审产品源码与正向输出，不修改产品、案例首版、不运行供应商、不安装、不另行委派。旧 C07 配置 B 生成／比较已取消；取消前仅读取原请求和四个旧入口，没有写出结果或运行 C07 工作表。

## 当前结论

源码／策略、10案首版全文与执行报告审计完成，未发现需要阻断本次统一入口实现的缺陷。所有相关CineWeave请求按D→必要内部能力→D交付，两个负例不激活。工具调用总数不可独立复原，保持unknown/null；这一审计限制不构成功能阻断，也没有据此宣称效率收益。此结论不代替真实媒体结果或用户批准。

本次采用用户最新约束：所有任务由导演入口接收，按需执行内部能力，结果返回导演入口统一收口。`workflowOwner = cineweave-director` 与领域／产物的实现所有权分别判断；不使用旧“专业单项最终 primary”标准。

## 已核实实现

| 检查项 | 本次证据 | 结论与范围 |
| --- | --- | --- |
| 单项与组合任务统一入口 | `skills/cineweave-director/SKILL.md:12-14`：所有请求从本入口开始，单项同样入口交付；内部步骤返回本入口，并最终核对原请求 | 满足 D→必要内部步骤→D，非固定四阶段流水线 |
| 各内部能力返回入口 | `skill-sources/cineweave-{platform,reference,review}/SKILL.md:8` 明确内部步骤、完整稿件／完成范围／未决项返回入口 | 内部 leaf 保留领域责任，不是工作流最终负责人 |
| 领域／工作流 owner 分离 | 导演入口 `59` 与 `references/core/operating-model.md:79-85`；本次实际调用 `validateSkillCatalog` 派生 actualKindOwners | 实际实现 owner 为 D43/P1/R4/Q4，共52；最终工作流负责人 D 不把52种产物的实现 owner 重写成 D |
| 默认同一代理 | 导演入口 `14,69`；operating-model `85` | 按需读取与执行指引；不依赖 SDK、后台调度或真实多代理，不能用入口数量伪称多代理 |
| 缺 leaf 恢复 | 导演入口 `63,65,67`，operating-model `85` | 入口沿内联资料继续，注明真实路径与限定范围；无需换用户入口或安装，不伪称调用 |
| 隐式调用开关 | 四个 `agents/openai.yaml:6`；本次 Node 读取 D=true、P/R/Q=false | 只有 D 可隐式选用；false 保留内部显式交接能力 |
| 校验器严格 bool／身份 | `scripts/validate-repository.mjs:1047-1048,1085` | YAML 只接受原生 `true`/`false`；字段缺失、额外字段与重复字段另由 `1044-1045,1056-1058` 拒绝；最终策略必须与 D 身份对应 |
| 测试反例 | `tests/skill-bundles.test.mjs:178-184` | 源码已有内部改 true、D 改 false 两个拒绝断言；本次未单独运行其 fixture，因为它包含构建，而本审查禁止重建 |
| author／materialized一致 | 本次 Node 对三个内部能力的 SKILL.md 与 YAML 各一对真实字节比较 | 六对相同；shared operating-model 四份也相同；分发清单 exports638 |
| 用户说明一致 | README `7-16`、CONTRIBUTING `3` | 用户只描述需求；按需执行内部能力并由 D 统一交付；可独立打包不等于推荐用户独立入口 |

## 运行与证据边界

本次先独立完成三项只读 Node 验证（均退出码0）：第一项读取当前 catalog/三份 canonical manifest，调用真实 `loadSkillCatalog`、`validateSkillCatalog` 和 `createDistributionInventory`，比较策略与作者／分发入口文件字节；第二项逐值核实10案原输入与冻结输入一致，并核对C04复制正文逐字符等于原母稿；第三项核实C07保留原文逐字节一致，以及C08三个修订文件只有授权替换与必要版本标识。最终报告到齐后，另外通过Node读取metadata及核对32个来源／10个首版文件和报告内嵌全文。派生 counts 为 D43/P1/R4/Q4，exports638，全部政策与字节核对一致。`workflowOwner` 是按当前工作流文字解释的 D 值，不是 catalog 已存在的机器字段。

已读取 root 的原生日志，不重新执行全套测试或构建：

- `D:/Temp/cineweave-unified-workflow-source-20261012.log`：source `valid=true`、files/exports638、enabledSkills四项、byteIdentical=true。
- `D:/Temp/cineweave-unified-workflow-targeted-20261012.log`：112 tests / pass112 / fail0（reliability 与 catalog 定向集）。这份日志未提供上述 bundle 新反例的运行结果，不扩展其覆盖声明。
- `D:/Temp/cineweave-unified-workflow-build-20261012.log`：构建 `valid=true`、files/exports638、byteIdentical=true；这是 root 已有运行，本审查只读引用。

没有媒体，所有工程与行为检查都不能证明图像身份、视频连续性、接触、声音、同步或审美质量。

## 正向 10 案阶段

第一阶段读取源码时，forward 目录仅有 C01–C05，曾记录 pending；随后逐份读取了全部10案首版全文、C07工作表与原生结果、C08三个修订正文与原文。最终完整总报告和metadata已保存并完成下面的来源索引／可知设置／原生结果审计。本审查不改写首版输出。

已获得准确本次原输入 `D:/Temp/cineweave-unified-workflow-raw-inputs-20261012.json`，SHA256 `76b204ce9a21ed4f6832d4b82d2afc0a8c5313a35673aa436b8adb7ba419b36d`。10案为C01–C08与T23/T24，没有C09/C10；第二项Node核对确认十项请求/rawData与冻结 `case-inputs` 逐值相同，不根据文件名猜范围。

| 案例 | 真实全文核对与流程责任 | 未决／完成范围 |
| --- | --- | --- |
| C01 | D→image_prompt/场景细则→D。完整4:5中文海报稿，成年单女、短黑发、深蓝无图案棉外套、右手提灯、单次准确片名及上下空间；电灯芯提供无明火暖光来由，天空提供暮色环境光。无无关leaf。 | 原创未锁细节标为设计；片名字形与实际画面仍待生成验证。 |
| C02 | D→shot_direction/image_prompt及接触细则→D。首图独立描述接触前起态；运动稿保留6秒、16:9、固定机位、准确“你拿走吧”、女子右手不松、男子左指先注视后触柄而不接重量，终态停顿。 | 无图片绑定、平台支持或声音同步成功声明；实际首图/准确平台/声音路径仍缺失。 |
| C03 | D→storyboard_rhythm/shot_direction→D。两份完整5秒母稿与两镜分镜，直接延续、总10秒；唯一钥匙店主右→学徒左→学徒右→袋中，接触先于释放，柜台南北侧、西窗与声音意图保留。 | 新柜台尺度为构图可达的暂定值，不冒充原批准设定；无媒体、平台或正式验收。 |
| C04 | D→P→D。忠实夹具适配，正文逐字符等于POSTER-MASTER-01 r1；正文无能力名字或项目私有元信息。实际控件只有中文文本与4:5下拉。P拥有适配稿，D最终收口。 | 夹具不成为live能力；没有虚构控件、参考绑定或外部提交。 |
| C05 | D→R→D character/scene/image_prompt→D。声明基础职责表先行，A/B/C/D范围及排除明确；完整全身站姿人物稿由D完成，未移入B脸/长发/身体或D服装。 | 观察仍declared，图与权利未知，五官等新细节为暂定设计；无身份绑定或商用批准。 |
| C06 | D新母稿→P条件适配→D。保留Seedance意向与全部动作，北侧铰链、左按盒身、右扶盖、唯一木鸟、6秒/16:9单镜和仅木铰链声均在对应稿中；条件适配不重新创造事实。 | 8张/原生声/6秒仍仅传闻，服务/准确模型/界面/模式未知；0参考，不编造槽位/开关，不改平台，不访问服务。 |
| C07 | D→Q→D。FG-01 r1六视角×2镜12行均有具体标准与依据；两个脚本原生结果与退出码真实保存，未把valid提升为已解决。原文侧文件逐字节等于输入，SHA256 `73f403fcf70c65612ab10ac96553997a5d1ef6d72b8f784f967b645fa9586245`。 | coverageComplete=true，reviewComplete=false，2项空间unknown、2项摄影revise。无编译目标的prompt豁免有范围理由，非缺媒体豁免。无原稿修改/批准；4+4秒算术为计划层。 |
| C08 | D→Q局部定位→D上游修订→P传播→D。三份受影响全文齐备；独立核对REV-G/M/P只替换机位与必要版本标识，REV-S01不改。Q不改上游，P只传播投射。 | 原REV-P跨镜上下文缺口单列，不因局修扩大授权；新东侧视点的遮挡/切点/光向/衣袖/盒纹待实际媒体复查。无沿用旧通过结论。 |
| T23 | 非CineWeave任务，未激活入口/leaf。正文“商店六点关门。”符合单句翻译，无前案人物/场景。 | 无创作或规范流程扩大。 |
| T24 | 非CineWeave任务，未激活入口/leaf。正文882，36×24+18=882正确。 | 无额外工程、创作或媒体。 |

首版文件中“实际执行记录”为实验审计附录。正文/复制块与审计记录分别评估；尤其C01和两个负例的用户可用结果在记录前，不能把审计附录粘入提示词或将其当作要求“只一句/只结果”的回答正文。

19个当前审查源的准确绝对路径、字节数与SHA256已保存 `D:/Temp/cineweave-unified-workflow-review-source-hashes-20261012.json`。源hash只证明本次审查快照，不证明行为或媒体质量。

## 最终执行报告审计

已核对 `D:/Temp/cineweave-unified-workflow-forward-20261012/report.md` 与 `run-metadata.json` 的方法／限制、入口、全部来源索引和原生结果部分；10案全文此前逐份独立审阅，未因报告再抄全文而重复运行不变检查。

- 32/32来源条目的实际当前字节SHA256与记录的sha256/currentSha256一致；章节索引都实际存在。这里32是来源条目数，**不是工具调用数**。
- 10/10首版文件字节SHA256与metadata一致；报告包含10份完整正文。内嵌全文只做换行形式转换后核对；首版文件本身保持字节哈希校验，未被重写。
- metadata明确`sharedContextBatch=true`、`perCaseFreshContext=false`：本次是一个新上下文里的10案依次试跑，不是10个独立新上下文，不证明完全上下文隔离。入口及内部能力采用任务给定准确路径手工读取，没有自动宿主选择或自动发现的证据。
- `automaticHostSelectionObserved=false`、`subagentsUsed=false`；没有SDK／调度、安装、供应商访问、媒体创建或批准声明。隐藏model/tokenUsage/reasoningEffort/latencyMs均null，不估算；真实Node版本v22.15.0独立记录。
- C07两个检查器原始输入/stdout/空stderr/exit保留：逐镜检查退出2，valid=true/coverageComplete=true/reviewComplete=false/12行/4个未决；交付算术退出0，192/24=8秒。C08辅助文本diff结果退出0，只承担授权文本差异核对，不冒称随包规范检查器。
- 执行者没有记录工具调用总数；审查者无法从来源索引、文件数或原生检查命令数复原所有读取／写入／工具调用。该值为unknown/null，不能用于效率或调用收益比较。本次没有这类比较声明，因此不要求重建复杂台账或修改首版。

结果明细：`D:/Temp/cineweave-unified-workflow-review-artifact-audit-20261012.json`。本次已审最终报告SHA256为`980af0e95a0becdeb72fae1fed8b703742a54b694348d9cd6c52d6d0bd36ae70`；metadata为`67fe3d28c7a384793b3ed118fbdfe397989e990b7831035b7f47b58f2ef9907d`。

两个C07检查器均实际import `D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/parse-json.mjs`，它是运行时依赖而非执行者加载的指令章节。执行者的32条来源索引没有列它；审查补记其真实字节SHA256 `9c15621d8304bf6114cc4cb322409c8e59433409ac17950311725cdcbebecf11`，不冒称执行者读过它的指令或源码正文。该补记限定来源复现范围，不改变C07原生结果或首版回答。

## 检索限制与独立性

本审查未读取 rubric、旧 run 的正文或历史评审来决定本次通过门槛。首次定位搜索不慎包含广域 tests 路径，返回了旧评估文件的匹配行；这些结果未用于当前结论，之后搜索已限定到当前权威源码与本次 forward 目录。取消前读取的 C07 请求不用于其他案例的补充设定。

本机隐藏模型、token、推理与延迟数据不可知，均为 null；源码日志中的测试计时属于原生日志数据，不解释成模型延迟或比较收益。
