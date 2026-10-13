# CineWeave 拆分迁移 P0 独立评审

评审日期：2026-10-12；本次记录时间：2026-10-12 05:56 UTC。

首次结论（rubric v1）：源码恢复与工程基线合格；冻结案例标准有 3 处需要修正的事实错配／歧义。当前不宜将 P0 标为无问题通过；修正并重新冻结 rubric 后可进入 P1。P1 的只读设计准备不受影响。没有把 P2—P6 尚未实施的事项当成 P0 缺陷。

评审对象：`D:\Temp\cineweave-split-baseline-20261012-23e5cb0865`。评审期间未修改原仓库、ZIP、manifest、restored 或案例文件；唯一写入为本报告。包外 smoke 仅在测试自行创建的系统临时目录工作并清理。

## 需要闭合的发现

| ID | 现存问题与证据 | 影响 | 最小修正 |
| --- | --- | --- | --- |
| P0-R01 | `case-inputs.json:44`：男子右手握伞，女子仅用指尖触柄、不接过重量；`case-rubric.json:304` 却要求“女子不松手”。 | 标准将持伞责任归给错误角色，正确适配结果可能被误判违反硬锁。 | 改为“男子保持右手持伞，女子只触柄、不承重”；输入无需改变。 |
| P0-R02 | `case-inputs.json:141`：S1 向画面右侧走、S2 从画面左侧走来；`case-rubric.json:647` 固定要求定位“运动方向不连续”。 | 从画面左侧进入并继续向右移动可以正常连续；输入未锁定机位或明确反向运动，标准提前认定了不存在充分证据的错误。持包手在同一时刻无中间动作却由右变左才是确定矛盾。 | 强制检查持手矛盾；运动方向按已有信息标为需机位／方向确认，不强制认定不连续。 |
| P0-R03 | `case-inputs.json:229` 与 `case-rubric.json:983` 明确 S02 学徒右手从左手取出钥匙；`case-rubric.json:988` 又要求 S02“不换手”。 | acceptance 与输入及自身 hardLocks 冲突，合法的有接触换手可能被误判。 | 限定“S02 入点不无故换手；保留后续左手到右手的明确交接”，不得笼统禁止整镜换手。 |

这 3 项属于已冻结标准的现存问题，不能以未来阶段再运行为理由保留。修订应保留原冻结版，记录新 revision、内容哈希和替代关系；不必重新制作源码 ZIP，也不必重复 392 项测试。

## 已核验且无发现

- 完整恢复覆盖：manifest、ZIP 均为 239 个唯一文件；逐项检查字节数和 SHA-256，ZIP、`restored` 与首次读取时的当前工作树全相同。ZIP CRC 无错误、无重复文件、无额外文件、无绝对／越界路径。首次读取的 `git ls-files --cached --others --exclude-standard` 集合也恰为相同 239 项，没有遗漏必要未跟踪源码。
- 当前源码而非旧 HEAD：ZIP 包含 `scripts/contract-context.mjs`、`scripts/validate-prompt-projection.mjs`、`scripts/validate-shot-compiler.mjs`、音频与变更辅助检查器及配套测试／研究等实际工作树材料。manifest 中有 33 项不在 HEAD，已逐项确认；冻结归档不是只保存较早 HEAD。Git HEAD 为 `0e476a7e96e43980bbfe8388c446c3f78fd06019` 只作为 provenance。
- 归档 SHA-256：`f4211f1c893e1ae606366f7708d44acddccf7e9f1de480f14e8065893daed8e4`，与 manifest 和 `p0-checks.json` 一致。
- 239 份源码正文可从 ZIP 逐项完整读取且与实际恢复目录对应；必要构建、验证、契约索引、测试、评测正文均在包内。Git 元数据、`.build`、凭据及无关本地输出不属于恢复源码范围。
- 52 kind 权威表可复核：依赖图 owners 恰好覆盖 52 个 index root kind，目标归属为 director 43／projection 1／reference 4／review 4，无遗漏或重复；这是候选目标映射，不冒称 P1 已实施。实际当前 12 路由、54 schema、52 example、42 reference 与工程检查一致。
- 记录的 `tests.log` SHA-256 为 `9520dc6f9f3cb41a9b3be85f223192ec4005b3ab1503141afa813f083f0cd6f2`，与 `p0-checks.json:49` 一致。日志命令对应冻结 package.json 的 npm test 脚本，`tests.log:2367-2374` 实际记录 392 tests、392 pass、0 fail、0 skipped、37632.0595 ms；没有将顶层 345 条 TAP 计为总测试数。
- 案例结构：24 触发请求由 8 明确单项、8 隐含意图、8 相邻／组合／负例组成，另有 8 完整内容案。32 个输入 ID 唯一，与 rubric 一一对应；请求非空，状态全部 `not_run`。内容案具备可用原稿／版本正文；缺图、能力资料或正式 JSON 均明示，仍能执行文字任务。
- 输入隔离：逐案输入仅有 `id/status/request/rawData`；评分规则仅在独立 rubric。`case-rubric.json:6,155` 明确执行者不看预期路由、must/mustNot、旧答案或研究结论。用户原请求的硬锁与已有母稿不是答案泄漏。
- 诚实状态：`p0-checks.json:4-5` 区分实施 complete 与 review not_started，`:51-52,67` 保留 providerExecuted=false、mediaGenerated=false、complete_not_executed。rubric `:8` 明确冻结／校验不等于行为执行，没有新架构触发或媒体效果的冒称。
- 后续对照边界：rubric `:17-50,153-181` 与源码计划 `tests/evaluations/cineweave-skill-split-orchestration-plan-2026-10-12.md:231-235` 区分 A 当前单入口、B 同代理四入口、C 同四入口的可选委派；保持同请求与原材料，环境差异记录，先 A/B 再 B/C，缺专业入口由 director 恢复且不得伪称激活。实际读取路径、哈希、完整回答／交接和原生工具退出码必须保存。
- 实际媒体边界：rubric `:180-181` 明确所有输入无实际媒体，只证明文本／规划行为，不证明身份、动作接触、跨镜连续、时序或声音同步；合成平台资料明确为虚构测试夹具，不作为 live 能力证据。

根代理在首次逐项比对之后追加 P0 执行／清单／案例记录，并登记开发报告白名单。上述“当前工作树全相同”只针对首次读取时点；冻结后记录变更不被误报成 ZIP 漂移，也不要求原工作树永远与快照相同。

## 本次独立执行的检查

在实际恢复目录 `D:\Temp\cineweave-split-baseline-20261012-23e5cb0865\restored` 执行：

| 命令 | 原生退出码 | 实际结果 |
| --- | --- | --- |
| `node scripts/validate-repository.mjs` | 0 | 源码、契约、引用与分发边界通过：161 分发文件、52 roots、54 schemas、52 examples、42 references、1357 schemaRefs、849 links。 |
| `node scripts/generate-contract-index.mjs --check` | 0 | 52 roots 与 2 supportSchemas 的索引和当前文件一致。 |
| `node scripts/validate-repository.mjs --bundle .build/cineweave-director` | 0 | 161 个分发文件与已验证恢复源码字节一致。 |
| `node --test tests/bundle-smoke.test.mjs` | 0 | 1 test、1 pass、0 fail、0 skipped；复制已生成分发包到包外临时目录，确认辅助器运行、退出状态和输入／包不被修改。 |

未重复整套 npm test。没有重新执行 build；其生成目录存在且独立 validate:bundle 已确认其分发集合及正文与恢复源码相同。`p0-checks.json` 的 build 成功是实施记录，本评审确认结果包与源码匹配，不冒称另一次构建执行。

## 未核验与阶段边界

没有运行 32 个案例，没有测试实际宿主自动发现／激活，没有创建或检查图片、视频、音频，没有运行供应商、安装新 Skill、提交或推送。真实宿主触发和内容重复属于 P2—P4；C 的委派可用性与收益属于可选 P5；媒体证据需另建真实素材测试。它们未完成不构成 P0 缺陷。

P0 放行条件仅剩 P0-R01—R03 的 rubric 消歧、保留旧版并重新冻结哈希。完成后可进入 P1 目录、共享打包及登记规则实施；这不代表新架构行为或媒体质量已通过。
## rubric v2 复核与最终放行

根代理已保留只读 `case-rubric.json` 原版，新增同目录的只读 `case-rubric-v2.json`。本评审独立逐字段比较两个版本，只发现 5 个预期差异：3 条发现对应的标准文本，以及新增 `revision:2`、`supersedesSha256`；没有其他标准、案例 ID、输入材料或运行约束的修改。

| 发现 | v2 的实际修正 | 复核状态 |
| --- | --- | --- |
| P0-R01 | `/triggerCases/3/constraints/1` 明确男子右手持伞、女子左指只触柄不接重量、男子保持持有。 | 关闭；与原输入持手及承重条件一致。 |
| P0-R02 | `/triggerCases/15/acceptance/0` 强制定位同一时刻持手改变，明确画面出入位置不能单独证明运动反向，缺方向信息保留未知。 | 关闭；消除无充分依据的固定失败判定。 |
| P0-R03 | `/contentCases/2/acceptance/1` 明确 S02 从左手持钥匙开始，按源稿右手取出、左手再松开的顺序换手并入袋，禁止其他换手及增钥匙。 | 关闭；保留授权交接，消除标准自身冲突。 |

版本与哈希核对：

- 输入 SHA-256 仍为 `e92cd1a5a5815891426b715159675b070d5bdedccb7a691441ab09f65d61f892`。
- 原 rubric v1 SHA-256 仍为 `b598804eabfd56d16b049fd70be89a26ab631df169da4599196667cdee0fe41e`，正文与首次审阅版本一致。
- rubric v2 SHA-256 为 `065280014d477f7e116acd95d6ed0c8cb0e69fe372fabd6caaf38b497997091b`，`supersedesSha256` 精确指向原 v1。
- `p0-checks.json` 的选定 rubric 指向 v2，同时保存 originalRubricPreserved 和 reviewCorrections；所引用输入、v1、v2 的实际字节数与哈希全部匹配。
- ZIP 哈希未变；复核后再次核对恢复目录 239 项源码哈希，差异为 0。本评审没有改变冻结源码和构建证据。

最终结论：P0-R01—R03 全部关闭，开放阻断项为 0。P0 完整源码恢复、工程验证记录、输入／标准冻结和证据边界合格，**可进入 P1**。后续案例执行必须使用已选定 rubric v2 进行执行后的独立审阅；32 个案例仍然未运行，不据此声称触发效果、创作效果或媒体质量已通过。