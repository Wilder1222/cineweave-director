# P6 独立阶段审查：3.2.0 本地候选

日期：2026-10-12。工作目录：`D:/study/projects/cineweave-codex-skills/cineweave-director`。本审查只读产品源码、原生门禁日志和隔离安装证据；仅写Temp审查记录，不构建、不重跑全套测试、不修改产品、用户缓存或标签。

## 阶段状态

**P6本地候选阶段审查完成，无未解决的产品阻断项。** 源码、索引、同步检查、638插件构建、全套502测试、四个160文件leaf及其正确target显式校验、9项安装矩阵smoke、4项creator检查、真实宿主4/4目录发现、真实1→4→1升级／回滚均已见原生通过证据。首轮发现与调用错误保留。结论只覆盖本地发布准备，不授予发布、定稿、媒体或宿主自动选择批准。

## 首轮发现（保留原始结论）

1. **重要文档准确性问题**：`CHANGELOG.md:7` 与 `CONTRIBUTING.md:75` 把正式产物版本概括为“2.x”。真实52份例的`contractVersion`分布是：3.0.0×7、2.2.0×9、2.5.0×14、2.0.0×19、2.4.0×3。七项3.0.0分别为CreativeBrief、WorkflowPlan、WorldBible、PromptProjectionPlan、CapabilityResolutionPlan、CreativeReview、RepairPlan。这些schema／例本次都没变；建议只把说明改为“正式产物各自既有版本（2.x与3.0.0）保持”，不改规范字节。
2. **升级／回滚证据未完成**：`D:/Temp/cineweave-p6-cache-cycle-20261012.log`首轮记录`status=failed`、`phaseCount=0`，错误`ValueError: absolute path required: .build\\cineweave-director`，结果文件为`D:/Temp/cineweave-cache-upgrade-20261012/run-dqew_mqn/result.json`。这是隔离测试调用路径错误，不是已经证明插件升级失败；需要保留失败并改用真实绝对bundle路径重跑。当前不能称cache循环通过。

上述两项已具体反馈root。首轮findings在本报告保留，后续修正／成功证据另列，不用新结果抹掉失败。

## 已核实版本与兼容边界

- 独立只读Node对`D:/Temp/cineweave-p6-contract-bytes-before-20261012.json`逐项计算当前字节SHA256：106/106一致，包括54 schema和52示例，无mismatch。`git diff --numstat`对应两个目录没有变更。
- package、plugin、contracts.version/schemaVersion、lifecycle.catalogVersion、index.skillVersion/schemaVersion均3.2.0；此处版本是包与目录元数据，不把根产物自身contractVersion批量升级成3.2.0。
- 实际marketplace源是`.agents/plugins/marketplace.json`，候选ref=`v3.2.0`，插件源仍固定仓库URL；不是`.codex-plugin/marketplace.json`。52根kind、12领域路由、manifest/index/lifecycle的namespace仍为cineweave-director。
- `scripts/validate-repository.mjs:19-21`区分当前EXPECTED_VERSION=3.2.0与固定EXPECTED_FIXTURE_RELEASE_REF=v3.1.0。后者只用于`validateContracts`内52个canonical示例的模拟receipt循环（933–937）；不是给真实payload新增无条件接受路径。示例仍通过原`validateDocument`（939），schema/hash/role/domain及引用闭包检查继续存在。
- 当前发布metadata检查仍严格：plugin/package/contracts/index/lifecycle一致，marketplace.ref必须等于当前版本不可变标签；只冻结示例receipt来源，不把所有运行时来源重写为新tag。相关payload精确来源／内容hash／权利阻断检查未因该常量分离取消。
- 统一入口策略保留：D的YAML`allow_implicit_invocation=true`，P/R/Q为false；严格boolean与按Skill身份强制校验仍在validator。两条拒绝策略测试及false fixture仍在`tests/skill-bundles.test.mjs:178-184`。本审查不重跑其包含构建的fixture。
- 本地`git tag --list v3.2.0`为空；HEAD仍`0e476a7e96e43980bbfe8388c446c3f78fd06019`。没有本审查创建的提交或标签。README当前源码章节明确候选未提交、未创建新标签、未发布，远程v3.2.0不能作为当前安装来源；旧v3.1.0安装命令单独标作旧版，用户现有缓存不随构建自动更新。

## 已读取原生门禁

| 门禁 | 当前证据 | 本阶段结论 |
| --- | --- | --- |
| source | `D:/Temp/cineweave-p6-source-20261012.log`，valid=true、638文件／exports、四enabledSkills、byteIdentical=true | 已通过 |
| index check | `D:/Temp/cineweave-p6-index-check-20261012.log`，valid=true、52 roots、2 supportSchemas | 已通过；真实重建另有index-regenerate原生日志 |
| sync check | `D:/Temp/cineweave-p6-sync-check-20261012.log`，valid=true、3 children、477 checked、0 updated | 已通过 |
| 全插件build | `D:/Temp/cineweave-p6-build-20261012.log`，valid=true、638文件／exports、byteIdentical=true | 已通过，本审查未执行构建 |
| 全套npm | `D:/Temp/cineweave-p6-full-tests-20261012.log`，footer tests502/pass502/fail0；两项新增策略否定测试均实际ok | 已通过，本审查未重复运行 |
| 四leaf build | `cineweave-p6-leaf-{director,platform,reference,review}-20261012.log`均valid=true、160文件／exports、byteIdentical=true | 四个实际target均通过 |
| 四leaf显式CLI校验 | `cineweave-p6-validate-{director,platform,reference,review}-20261012.log`正确target=skill/name，valid=true、160、byteIdentical=true | 首轮漏--skill错误另存r1，修正后四项通过 |
| 安装矩阵smoke | `D:/Temp/cineweave-p6-bundle-smoke-20261012.log`，9 tests/pass9/fail0/skip0，包含4能力×2布局的8子项 | 实际本地运行通过，未执行remote CI |
| creator | `D:/Temp/cineweave-p6-creator-validation-20261012.log` | 四项Skill is valid；只支持对应入口结构检查 |
| native standalone发现 | `D:/Temp/cineweave-host-discovery-20261012/run-k_qatbf6/filtered-result.json` | 四个自包含目录159文件完整复制，实际skills/list返回4/4，parse0 |
| native cache cycle | r3日志passed、phaseCount3；`run-ptheg2t0/result.json` | 真实3.1→3.2→3.1、1→4→1与回退字节复原通过；前两次失败保留 |

## 中间复核（历史状态，首轮发现仍保留）

- root已修正版本说明。实际读取当前CHANGELOG:7及CONTRIBUTING:75均为“各自既有版本（2.x与3.0.0）”，不再把52个产物概括为全是2.x；本轮修正只涉及文档，无需修改任何schema／示例。首轮文档发现已解决。
- full npm原生footer为502 tests/pass502/fail0/cancelled0/skipped0/todo0。两个新增策略反例分别出现`ok 9 - internal capability cannot silently become an implicit user entry`及`ok 10 - the unified workflow entry must remain implicitly available`。
- 第二轮native结果为`D:/Temp/cineweave-cache-upgrade-20261012/run-0w47zuek/result.json`，status=failed、phaseCount2。old实际安装3.1.0并从该cache路径返回一个qualified director；upgrade实际安装3.2.0并从该cache路径返回四个qualified skills。两阶段parseErrors/discoveryValidationErrors均为空，RPC限定initialize/initialized/skills/list，非mock返回名称。
- r2升级后旧隔离3.1.0 cache路径不在，辅助脚本检查旧路径时抛出`public entry is not a file/directory`，将upgrade phase记为failed；rollback尚未运行。不能据1／4发现片段写成完整1→4→1成功，也不能因CLI正常替换旧cache而伪造“旧cache始终不变”。已建议root保留旧public source字节，允许并记录CLI替换隔离cache，在真实rollback重装后验证旧cache字节复原。
- 15个已审源／baseline的本次快照hash保存于`D:/Temp/cineweave-split-p6-review-source-snapshot-20261012.json`。快照包含修正后文档；首轮不准确说明的具体原文与位置在上述first findings保留。

## 最终追加：完整本地门禁与真实循环

### 校验调用错误及修正

root额外执行四个leaf的显式CLI校验时，首轮未传`--skill`，把leaf目录按plugin布局检查，四份原生诊断都是`Unexpected directory in Bundle distribution file set: agents`。这是调用方target不匹配，不是已证明leaf源码有缺陷。首轮分别保存于四个`cineweave-p6-validate-*-20261012.log.r1.txt`，本审查读取D原始诊断并独立核对四个首轮诊断字符串。

修正调用显式选择对应Skill后，四个真实输出均`mode=bundle`、`target.type=skill`、name准确、`valid=true`、files/exports160、`byteIdentical=true`；sourceFilesValidated638。修正没有放宽validator或篡改首轮输出。四个通过日志SHA256如下：

| leaf | 日志SHA256 |
| --- | --- |
| director | `7dc2d2f72a2678c3ba92f33fb8a1fd19f6f8c2e5fae56cbffd6d1e42770d6191` |
| platform | `c2984c08f2fe72885aff69ba26077df15bbf088a464f4e70cde075e592ba9fbb` |
| reference | `0a25245c904974e90a1806a86055a89b885f5ef215324763c089d41b3631d3c6` |
| review | `4f9bb121095eb5066ae5f8939f515d68068f9a5f90a2cf8bc09bb035bf94e311` |

### 升级／回滚脚本与实际结果

已实际读取当前辅助脚本与`D:/Temp/cineweave-cache-upgrade-check-20261012.r2.py`备份的diff。修正只让非活动版本缓存缺失成为允许且明确记录的状态：记录present/active/bytesEqualFirstInstall；活动路径缺失仍抛错，存在却字节改变仍抛错；真实rollback的旧缓存须重装存在、活动且字节等于首次安装。源旧／新及两份public副本的不可变核对仍保留。脚本继续以真实`subprocess.run`执行CLI，真实`subprocess.Popen([codex,'app-server'])`发initialize/initialized/skills/list，不创建thread或调用model。

最终结果：`D:/Temp/cineweave-cache-upgrade-20261012/run-ptheg2t0/result.json`，CLI `codex-cli 0.147.0`，status=passed，三个阶段全部passed：

| 阶段 | 实际manifest／cache版本 | 实际qualified Skill数量 | 活动缓存与结果 |
| --- | --- | --- | --- |
| old | 3.1.0 | 1 | 准确3.1.0路径，仅director，活动缓存存在且首次字节相等 |
| upgrade | 3.2.0 | 4 | 准确3.2.0路径，D/P/R/Q；旧3.1.0路径非活动且不存在，记录该事实 |
| rollback | 3.1.0 | 1 | 准确3.1.0路径，仅director；旧缓存重新存在、active=true、bytesEqualFirstInstall=true；3.2.0非活动且不存在 |

三个阶段所有qualified路径均fromExpectedVersion=true，parseErrors与discoveryValidationErrors为空；原生CLI的version／local marketplace add／三次plugin add均退出0。隔离CODEX_HOME和profile均在本次Temp目录。实际global旧源来自用户原3.1.0插件的公开entry，139文件；新bundle为638公开文件，两者前后digest分别相同，两份public副本也不变。该旧安装是本次实际旧缓存，不冒称P0未提交源码快照或旧HEAD。

本机本次CLI替换了非活动的隔离版本目录，因此不能把结果解释为两个cache版本始终并存或始终未动；`cacheDeletionOrMovePerformedByHarness=false`表示辅助脚本没有手动删除／移动缓存，native CLI的实际替换状态另由cacheStates记录。networkRequestsIssuedByHarness=false，networkEgressObserved=null，不能写成已证明零网络流量。app-server关于Temp PATH alias的stderr提示保留，未导致parse错误或阶段失败。

### 收口范围

文档准确性发现已修正；相对路径、旧cache保留假设与漏--skill三类验证调用错误均保留原生失败并有真实修正后结果。当前没有未解决的产品阻断项。52kind/12域/namespaceD、106规范字节、各自2.x/3.0.0产物版本与固定v3.1.0模拟回执保持；3.2.0只作为当前本地候选准备。

真实发现与本地安装回滚支持明确CLI0.147.0/本机路径的加载、资源和版本结论，不证明自动隐式选用、整条工作流自动执行、远端CI、远程tag可安装、供应商支持或媒体质量。未提交／打新tag／发布／改用户profile；隐藏模型与性能遥测继续unknown/null。

## 最终归档与文档核对

读取了`tests/evaluations/cineweave-split-p6-engineering-evidence-2026-10-12.json`及`p6-engineering-2026-10-12/manifest.json`。汇总状态为engineering_passed_review_pending，候选3.2.0、published=false，各门禁与上面实际原生日志一致；不把汇总自称passed代替原始结果。

本次独立Node核对归档manifest的34个条目，全部长度和SHA256匹配；加manifest本身共35文件。三个cache结果（首轮失败、二轮失败、最终成功）、standalone结果及修正前／后harness归档均与本次Temp原件逐字节相同；contracts/before.json与after.json逐字节相同，均包含106项。开发archive与结构化汇总已显式注册到validator inventory；root将在归档本审查后执行最终源码检查，本审查不替其伪称该最后检查已经运行。

本次独立执行`git ls-remote --tags origin refs/tags/v3.2.0`，原生退出0、stdout为空，确认此刻远程没有该tag；这是只读远程ref核对，不是remote CI或发布动作。

主拆分计划第6节已把历史“P1–P6均未开始”换成实际进度见执行记录，P5表行明确统一入口工作流、同代理、原可选委派对照未运行／不采用，与本次实际结果一致。限定复核发现两个剩余开发文档句子，已反馈root（不属于产品／测试逻辑阻断）：line104仍说组合请求按最终交付物决定总负责人，易混淆领域owner与D始终最终收口；line210仍说“再测委派”和“本轮没有…安装”，与未采用委派对照及本轮真实隔离安装不一致。建议只改这两句的当前范围说明，不重跑已通过的工程测试。

追加关闭：已实际重读修正后line104–105，明确“导演始终负责最终收口”，交付物只决定必要内部能力及依赖顺序，显式内部调用的结果也返回导演；line210明确默认同代理、可选委派试验未运行／不采用、实际安装仅在临时home且没有用户profile安装／提交／推送／发布。两项开发文档发现已关闭，旧发现及反馈过程仍在上段保留。

**最终状态：P6独立审查完成，本地候选工程门禁与限定native兼容证据通过，没有未解决的产品或文档阻断项。** root归档审查后尚需执行其最终源码检查；远程CI、自动宿主选择／自动执行、媒体与模型性能仍未验证，发布与用户profile更新未发生。不得把这些未运行项算作通过。

## 证据边界

当前是本地候选版本准备。没有执行remote CI、宿主自动选择／自动编排或真实媒体生成验收；这些状态保持未运行／未知。隔离native安装证据到齐后，也只能支持明确宿主／本地cache阶段与读取结果，不能提升为远程发布、账号默认选用、生产语义质量或媒体质量。

隐藏model/token/reasoning/latency均unknown/null；不根据来源文件数、测试数或墙钟日志估算模型成本，不作效率收益比较。用户缓存／profile不属于本审查写入范围，标签不移动。
