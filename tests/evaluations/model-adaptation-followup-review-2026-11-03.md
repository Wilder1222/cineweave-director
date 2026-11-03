> **公开版证据范围：** 宿主事件已进行结构化脱敏，不能独立验证实际读取；本机路径已脱敏。文中哈希及逐字节表述指原始本地运行或当时的 Skill 快照，并非公开脱敏文件的字节。详见[公开证据说明](model-adaptation-public-evidence-scope-2026-11-03.md)。

# 后续复核：关键帧与受影响宿主回归

本记录区分独立内容评审与宿主运行终态。两个不同的冻结清单各覆盖四套 Skill 共 692 项；哈希清单按文件保存，不能据此声称真实素材上传、平台账户可用、视频或声音效果已验收。宿主读取过全局记忆且事件中的记忆输出已脱敏，不称完全隔离盲测。

关键帧原题是可灵 4.0 单次 15 秒、三图 0/7/15 秒关键画面与视频运镜参考；R09 原题要求单次 40 秒、20 图与精确对白；API 原题比较方舟 Seedance 2.5 和百炼中国站 Wan 3.0 的现有参考媒体。

首次关键帧前稿冻结清单文件 SHA-256 为 681c656cc7d3b0fb79ad006308f66e5bc3db8676020d677c04181d9442b6b3d2；最终快照各次冻结清单文件 SHA-256 为 68eb0b1854a61e69bc4fea47981bfe034724c21a163229490981d77a5d5dbd12。这是清单文件本身的摘要；源文件逐项摘要见各自哈希清单。最终快照在本次归档前独立比对当前四套 Skill，692 项无增删或内容差异。

## keyframes-initial

首次有正文：UTC 2026-11-02 21:46:25–21:58:15，终态正常；独立评审 FAIL，因未说明独立 Keyframes 限制与指南示例、官方专题之间的冲突来源。属先前 681c 快照。

[输入](model-adaptation-followup-keyframes-initial-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-keyframes-initial-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-keyframes-initial-hashes-2026-11-03.json)、[终态](model-adaptation-followup-keyframes-initial-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-keyframes-initial-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-keyframes-initial-comparison-2026-11-03.json)、[调用](model-adaptation-followup-keyframes-initial-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-keyframes-initial-stderr-2026-11-03.txt)、[完整输出](model-adaptation-followup-keyframes-initial-output-2026-11-03.txt)、[独立评审](model-adaptation-followup-keyframes-initial-review-2026-11-03.md)。

## keyframes-routing

最终快照第一次复测：UTC 2026-11-02 23:52:58–23:56:01，路由发现失败或超时，turn.failed；没有可审正文，不作内容通过或失败。

[输入](model-adaptation-followup-keyframes-routing-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-keyframes-routing-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-keyframes-routing-hashes-2026-11-03.json)、[终态](model-adaptation-followup-keyframes-routing-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-keyframes-routing-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-keyframes-routing-comparison-2026-11-03.json)、[调用](model-adaptation-followup-keyframes-routing-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-keyframes-routing-stderr-2026-11-03.txt)。

## keyframes-final

最终快照再次复测：UTC 2026-11-03 00:18:47–00:29:11，终态正常；独立评审 PASS，范围为题目文字、来源归属及运行完整性。输出中引用的临时工作区链接并非持久交付地址；实际素材与生成未验证。

[输入](model-adaptation-followup-keyframes-final-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-keyframes-final-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-keyframes-final-hashes-2026-11-03.json)、[终态](model-adaptation-followup-keyframes-final-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-keyframes-final-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-keyframes-final-comparison-2026-11-03.json)、[调用](model-adaptation-followup-keyframes-final-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-keyframes-final-stderr-2026-11-03.txt)、[完整输出](model-adaptation-followup-keyframes-final-output-2026-11-03.txt)、[独立评审](model-adaptation-followup-keyframes-final-review-2026-11-03.md)。

## r09-timeout

最终快照 R09：UTC 2026-11-02 23:52:58 至 2026-11-03 00:12:58，timeout=true、turn_completed=false，只有过程片段；未完成，不作正式答案或通过。

[输入](model-adaptation-followup-r09-timeout-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-r09-timeout-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-r09-timeout-hashes-2026-11-03.json)、[终态](model-adaptation-followup-r09-timeout-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-r09-timeout-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-r09-timeout-comparison-2026-11-03.json)、[调用](model-adaptation-followup-r09-timeout-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-r09-timeout-stderr-2026-11-03.txt)、[未完成片段](model-adaptation-followup-r09-timeout-partial-not-final-2026-11-03.txt)。

## api-routing-01

最终快照 API 原题首次尝试：UTC 2026-11-02 23:52:58–23:55:43，workspace routing discovery failed、turn.failed；未完成。

[输入](model-adaptation-followup-api-routing-01-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-api-routing-01-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-api-routing-01-hashes-2026-11-03.json)、[终态](model-adaptation-followup-api-routing-01-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-api-routing-01-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-api-routing-01-comparison-2026-11-03.json)、[调用](model-adaptation-followup-api-routing-01-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-api-routing-01-stderr-2026-11-03.txt)。

## api-routing-02

最终快照 API 原题重试：UTC 2026-11-03 00:18:47–00:21:36，同样路由失败、turn.failed；未完成，仍需同题完成及独立评审。

[输入](model-adaptation-followup-api-routing-02-input-2026-11-03.txt)、[脱敏事件](model-adaptation-followup-api-routing-02-events-2026-11-03.jsonl)、[Skill 哈希清单](model-adaptation-followup-api-routing-02-hashes-2026-11-03.json)、[终态](model-adaptation-followup-api-routing-02-terminal-2026-11-03.json)、[开始比较](model-adaptation-followup-api-routing-02-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-api-routing-02-comparison-2026-11-03.json)、[调用](model-adaptation-followup-api-routing-02-invocation-2026-11-03.json)、[脱敏错误](model-adaptation-followup-api-routing-02-stderr-2026-11-03.txt)。

## 待完成与重试材料

[API 原题](model-adaptation-followup-api-original-input-2026-11-03.txt)与[独立验收标准](model-adaptation-followup-api-rubric-2026-11-03.md)已归档；R09 原题见上述超时记录输入。后续运行须使用当时源快照、保留终态并进行独立内容评审，不能把路由失败、超时或工程校验作为内容通过。

## 补充独立代理评审（旧快照）

以下为此前快照的独立代理文字材料，并非 Codex exec 宿主运行或连续宿主轮次。R09 独立代理方案按原题验收为 **PASS（文字范围）**；API 方案按当时预先编制的逐项标准为 **FAIL**：未逐项判断题给视频的已知尺寸和比例。代理未能实时联网时将其列为待核属诚实声明，但不能满足该次已核资料的验收要求。此后已修订作者源；真实宿主在新快照的同题复测已完成，见下文独立评审；不能用旧代理结果代替。

[R09 输出](model-adaptation-followup-r09-independent-output-2026-11-03.md)、[R09 读取清单](model-adaptation-followup-r09-independent-reads-2026-11-03.txt)、[API 输出](model-adaptation-followup-api-independent-output-2026-11-03.md)、[API 读取清单](model-adaptation-followup-api-independent-reads-2026-11-03.txt)、[两题独立评语原文](model-adaptation-followup-independent-review-2026-11-03.txt)；[API 原题](model-adaptation-followup-api-original-input-2026-11-03.txt)及[事先验收标准](model-adaptation-followup-api-rubric-2026-11-03.md)另已归档。评语原文以 txt 保留原始字节，其中 LOCAL_TEMP 路径是当时引用而非持久链接；本段链接为归档对应文件。五个文件均逐字节复制，未改写证据。读取清单仅声明 R09 四项、API 五项作者源及哈希，不能证明 692 项冻结快照、实际逐字节读取或宿主成功，也不证明媒体生成和验收。

## API 新快照宿主复测与 R09 旧缓存失效运行

API 同题宿主运行正常完成并取得[独立评审](model-adaptation-followup-api-host-review-2026-11-03.txt)：文本规格判断及当前冻结 Skill 读取范围通过；真实账号、素材接收及成片未验证。该次也访问全局记忆与官方网页，不能将输出单独归因于 Skill 修订。其[原题](model-adaptation-followup-api-host-input-2026-11-03.txt)、[完整输出](model-adaptation-followup-api-host-output-2026-11-03.txt)、[事件](model-adaptation-followup-api-host-events-2026-11-03.jsonl)、[哈希](model-adaptation-followup-api-host-hashes-2026-11-03.json)、[终态](model-adaptation-followup-api-host-terminal-2026-11-03.json)、[起始比较](model-adaptation-followup-api-host-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-api-host-comparison-2026-11-03.json)、[调用](model-adaptation-followup-api-host-invocation-2026-11-03.json)和[错误分类](model-adaptation-followup-api-host-stderr-2026-11-03.txt)均保留。

R09 另一次宿主虽然正常结束，但[读取审计](model-adaptation-followup-r09-stale-cache-read-audit-2026-11-03.txt)证明冻结入口读取失败，实际回退到旧缓存；其[内容评语](model-adaptation-followup-r09-stale-cache-review-2026-11-03.txt)指出输出缺项，但因读取失效，**不能作为当前 Skill 失败或需修改的证据**，也不是连续第九轮本身。其[原题](model-adaptation-followup-r09-stale-cache-input-2026-11-03.txt)、[完整输出](model-adaptation-followup-r09-stale-cache-output-2026-11-03.txt)、[事件](model-adaptation-followup-r09-stale-cache-events-2026-11-03.jsonl)、[哈希](model-adaptation-followup-r09-stale-cache-hashes-2026-11-03.json)、[终态](model-adaptation-followup-r09-stale-cache-terminal-2026-11-03.json)、[起始比较](model-adaptation-followup-r09-stale-cache-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-r09-stale-cache-comparison-2026-11-03.json)、[调用](model-adaptation-followup-r09-stale-cache-invocation-2026-11-03.json)和[错误分类](model-adaptation-followup-r09-stale-cache-stderr-2026-11-03.txt)保留。两次运行均读取过全局记忆且对应事件输出已脱敏，不是完全盲测。

上述独立评语和审计以 txt 原样保存，其中临时绝对路径为当时记录，持久引用请使用本节相对链接。全部文件按原始字节复制；事件逐行解析 JSON 并检查个人记忆输出已脱敏，完成凭据模式扫描。

## R09 可读预检通过、正式运行超时

修正工作目录与冻结 workspace 读取权限后的同题调用，预检独立完成并核对目录、三个文件路径和哈希，UTF-8 输出无替换字符且未读取缓存；[预检事件](model-adaptation-followup-r09-readable-timeout-probe-events-2026-11-03.jsonl)、[预检输出](model-adaptation-followup-r09-readable-timeout-probe-output-2026-11-03.txt)、[预期哈希](model-adaptation-followup-r09-readable-timeout-probe-expected-2026-11-03.json)、[预检核验](model-adaptation-followup-r09-readable-timeout-probe-check-2026-11-03.json)、[预检终态](model-adaptation-followup-r09-readable-timeout-probe-terminal-2026-11-03.json)均保留。

正式运行事件显示成功读入当前冻结导演入口和相关模型参考，但最终超时，`turn_completed=false`，没有 `turn.completed`；[过程片段](model-adaptation-followup-r09-readable-timeout-partial-not-final-2026-11-03.txt)并非完整或最终答复，不能计为内容通过或内容失败。其[原题](model-adaptation-followup-r09-readable-timeout-input-2026-11-03.txt)、[冻结哈希](model-adaptation-followup-r09-readable-timeout-hashes-2026-11-03.json)、[起始比较](model-adaptation-followup-r09-readable-timeout-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-r09-readable-timeout-comparison-2026-11-03.json)、[调用记录](model-adaptation-followup-r09-readable-timeout-invocation-2026-11-03.json)、[正式事件](model-adaptation-followup-r09-readable-timeout-formal-events-2026-11-03.jsonl)、[正式终态](model-adaptation-followup-r09-readable-timeout-formal-terminal-2026-11-03.json)已保留；该目录无单独 stderr 文件。正式运行三次记忆读取输出已脱敏，不能称为完全盲测。归档逐字节复制、事件逐行解析且完成凭据模式扫描。

## API 最终快照宿主复测

最新快照同题预检、正式宿主和[独立文字评审](model-adaptation-followup-api-final-review-2026-11-03.txt)通过：两平台对题述文件的格式、时长、尺寸比例、大小及帧率等判断符合各自已核条件；方舟 1920×1080 按题目给定素材正确判断为通常属于 1080p。最终正文没有枚举方舟其他输入档位，不应称其列出全部档位。百炼 5 秒输出只是待确认的暂拟方案；该正文未展开“输入视频总长＋输出时长≤30秒”的公式，独立评审将其列为可补充的透明度建议，未将之视为本题文件规格失败。续写语义仍须单独核查。

正式事件可见冻结入口和相关实践资料；声音参考与记忆的联合输出被整块脱敏，无法验证该次声音参考具体内容是否读入。宿主亦读取全局记忆，不称完全盲测。未读取或上传实际素材、调用生成接口或验收成片；接口接受、账号权限和媒体效果均未获验证。

[原题](model-adaptation-followup-api-final-input-2026-11-03.txt)、[输出](model-adaptation-followup-api-final-output-2026-11-03.txt)、[正式事件](model-adaptation-followup-api-final-formal-events-2026-11-03.jsonl)、[正式终态](model-adaptation-followup-api-final-formal-terminal-2026-11-03.json)、[调用](model-adaptation-followup-api-final-invocation-2026-11-03.json)、[冻结哈希](model-adaptation-followup-api-final-hashes-2026-11-03.json)、[起始比较](model-adaptation-followup-api-final-start-comparison-2026-11-03.json)、[结束比较](model-adaptation-followup-api-final-comparison-2026-11-03.json)、[预检事件](model-adaptation-followup-api-final-probe-events-2026-11-03.jsonl)、[预检输出](model-adaptation-followup-api-final-probe-output-2026-11-03.txt)、[预期](model-adaptation-followup-api-final-probe-expected-2026-11-03.json)、[预检核验](model-adaptation-followup-api-final-probe-check-2026-11-03.json)及[预检终态](model-adaptation-followup-api-final-probe-terminal-2026-11-03.json)均保留。评语以 txt 原样保存，内部临时路径为运行时记录，上述是持久相对链接。全部文件逐字节复制；JSONL 逐行解析并检查 UTF-8、记忆脱敏与凭据模式。
