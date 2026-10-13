# CineWeave 拆分 P2 独立阶段 review · 2026-10-12

## 结论与严重性

**P2 工程与入口边界通过本轮独立只读审查，未发现新增阻断或待修复缺陷。** 当前启用为 `cineweave-director` 与 `cineweave-platform`；实际实现 owner 为导演 51＋平台 1，平台仅拥有 `cineweave_codex_prompt_projection_plan`。canonical 协议命名空间、12 路由、52 唯一根 kind 不变。

首次发现统计：P0/P1/P2 级缺陷 0，P3 级提醒 0。本 reviewer 未发现未修复事项；不为形成发现列表而把历史措辞、完整共享闭包或未执行的媒体任务记为缺陷。

**本结论只通过 P2 的工程、分发和指令边界部分。** 同一母稿的 A/B 忠实适配及宿主真实入口发现属于后续独立行为 review，本轮按约定未读取 A/B 输出或 rubric，不能提前标记整体 P2 行为验收通过或据此进入 P3。

## 范围与独立性

阅读拆分计划 P2（`tests/evaluations/cineweave-skill-split-orchestration-plan-2026-10-12.md:204`）、P1 独立 review、当前 platform 作者源与派生目录、导演入口和共享 handoff、catalog、sync、source/bundle validator、build 与安装矩阵代码。归因使用 P0 完整恢复源码 `D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored`，没有用较早 Git HEAD 替代实施前源码。

读取实施方已结束的 P2 日志，并独立运行一次只读 source/full-plugin/leaf/sync API 组合及 P0 字节对照。未修改仓库，未构建写入，未重跑 500 项长回归，未安装宿主 Skill、提交、推送、调用供应商或生成媒体。唯一写入为本临时报告。

历史记忆只用于提醒检查非执行与证据层级；当前计数、边界和字节结论均重新验证。README 在 review 期间由总负责人修正开发导航，reviewer 只检查修正后的正文，没有伪称自己首次发现或修正了旧文档。

## 具体核对

| 检查面 | 证据与结论 |
| --- | --- |
| 主交付物与 scope | platform 作者 `SKILL.md:3,8-16,45` 将触发限定为已有中文图像／视频母稿的指定平台转换，仅拥有 Projection；能力／许可档案、母稿、动作和镜头留原领域。缺母稿返回责任领域或围绕当前内容的限定待补稿，不能重新创作整个故事。不会替用户选择供应商。共享资源的完整分发明确不增加 owner。 |
| 导演收口与内联恢复 | director `SKILL.md:48,50-54` 把既有母稿适配交给准确发现的 `$cineweave-platform`，要求完整母稿、硬锁、已给能力／许可和未决项；不猜 sibling 路径或缓存版本。入口缺失时读取本包仍保留的适配／MJ 指南完成限定稿，并说明实际路径。完整新创作继续由导演收口。 |
| 精确交接与回流 | `operating-model.md:79-85` 保留原请求、子目标、准确正文／实际素材、硬锁、授权、假设／未知、修改边界、限定返回和准确 kind/ID/version/hash。共享状态串行整合；冻结稿可并行检查；专业结果不能反写上游，不能因入口拆分扩大执行权限。 |
| 母稿忠实性指令 | platform `SKILL.md:20-23,29-30` 要求保留身份、妆造、空间、表演、动作触发／接触或落空／结果／恢复、出入态、摄影与准确声音。图片未提供不得假设已经承担事实；长度或复杂度限制须明确取舍和回流，不无声删台词、改画幅、加速或改动作。给定文案逐字保留，单条提示词任务返回完整正文。实际模型遵循效果仍待行为审查。 |
| 能力 unknown | platform `SKILL.md:14-16,25,49,53` 区分请求值、界面解析值、返回值，未知不编原生槽位、时长档位或隐藏默认。能力／许可未知保留 unknown 与未就绪，结构通过不提升为 ready_for_human。指南保留原证据日期，夹具不能证明当前账号支持。 |
| 参数、正文、参考闭合 | platform `SKILL.md:51-53` 对应现有 Projection 语义：body逐字符相等、有序参数唯一、ASCII空格装配、copyText准确闭合、REF与绑定闭合、附件旁路表允许。未知方言不猜同名参数重复或渲染规则，不把所有同类槽位推成单素材。现有检查器与 P0 字节一致，未放松任何来源／参数规则。 |
| 非执行和证据层级 | platform `SKILL.md:32-33,53` 止于人工外部交接，不上传、不调用供应商、不造任务ID/回执/seed/hash/成功声明。结构、参数、哈希不能证明真实媒体；实际媒体可支持对应限定评审，未知不能提升为权利或批准。 |
| 当前 catalog 和 namespace | `skill-catalog.mjs:88-143` 交叉核对 canonical `contracts/lifecycle/index.skill` 均为 cineweave-director、52 roots、12 routes、唯一领域 route owner；只将 Projection 的 implementation owner 派给已启用 platform。reference/review 仍 disabled，实际 root 全集被导演51＋平台1准确覆盖。 |
| 唯一作者源 | `skill-catalog.mjs:231-278` 的 platform 入口和 agent 只来自 `skill-sources/cineweave-platform` 两文件；157个共享文件来自 canonical director，未从 child 再传播。全插件320个 destinations来自163个唯一 sourceFiles；实际检查无未登记来源。作者目录恰好两文件，子包159文件，sync检查159项全部一致。 |
| 全插件及独立包 | 默认插件身份与市场条目不变；platform独立包为真实 Skill 根160文件（159包内＋LICENSE），无 catalog、插件manifest或开发验证器泄漏。每包保留完整54 schema/52示例/42参考的验证与文本闭包，不把副本计作新 owner。 |
| 路径、元数据与安全 | `validate-repository.mjs:818-877,891-958` 检查实际enabled精确目录、两文件作者源、每包frontmatter/agent调用名、独立Skill根Markdown链接、本地schema引用、精确inventory与export bytes。sync先校验所有source/destination/未知entry；check模式只读且0更新。build保留明确.build直系输出、拒绝link/junction/越界、源校验及完整读取后替换旧包。 |
| 独立验证上下文 | 开发语义内核仍共用；schema所属release根中的contracts/index保持准确，未借sibling包补独立闭包。P0对照4份开发语义文件完全未变；当前leaf validate实际通过。没有把开发侧validator误称为leaf内嵌工具。 |
| 安装矩阵 | `tests/bundle-smoke.test.mjs:23-40,108-134` 从当前enabled集合展开导演/platform各full-plugin和standalone，包外cwd，仅复制已构建分发，清空NODE_PATH/NODE_OPTIONS，核验4个CLI原生成功/unknown/duplicate-key退出码及输入、包snapshot只读。audio-return和parser是library helpers，不能误算成遗漏CLI。实际结束日志4子用例＋parent共5/5通过；本review未声称独立重跑该矩阵。 |
| 开发导航 | 当前README第95行明确已启用导演和平台，参考/评审仍由导演承担，指向实际catalog与执行记录。冻结研究计划内“尚未实施”是当时状态，不当作当前产品状态。 |

## 实际日志与本 reviewer 的独立检查

已读取以下日志的结束状态，不把运行中结果或实施方口述当通过：

- `D:/Temp/cineweave-split-p2-targeted-20261012.log`：169 tests /169 pass /0 fail,cancelled,skipped,todo，3474.6953 ms。正文包含精确body/JCS/ID/version/hash、摘要冒充来源、缺能力unknown、参数装配、参考闭合、私有定位符及catalog owner/namespace/path反例。
- `D:/Temp/cineweave-split-p2-build-20261012.log`：valid=true，plugin320 files/exports、163 sourceFiles，director＋platform，byteIdentical=true。
- `D:/Temp/cineweave-split-p2-leaf-20261012.log` 与 `...-leaf-validation-20261012.log`：platform leaf160 files/exports/sourceFiles，52/54/52/42，byteIdentical=true。
- `D:/Temp/cineweave-split-p2-install-matrix-20261012.log`：导演和平台各full-plugin/standalone实际4路径，连同parent5 tests /5 pass /0 fail,cancelled,skipped,todo，18294.3596 ms。
- `D:/Temp/cineweave-split-p2-source-20261012.log`：source valid=true、320 files、52 unique roots、byteIdentical=true。
- `D:/Temp/cineweave-split-p2-sync-check-20261012.log`：check、childCount=1、filesChecked=159、filesUpdated=0。
- `D:/Temp/cineweave-split-p2-index-check-20261012.log`：check valid=true、52 roots＋2 support schemas。

本 reviewer 独立执行 Node API组合，原生退出码0：`createDistributionInventory()`、`validateRepository()`、`validateBundle(.build/cineweave-director)`、`validateBundle(.build/cineweave-platform-skill,{target:platform leaf})`、`syncSkillExports({check:true})`。结果实际enabled=[director,platform]、ownerCounts={director:51,platform:1}、namespace三项均director、12routes/52kinds、source/plugin320 files、leaf160 files，三种验证均valid且byteIdentical，sync159项无更新。

同时逐字节对照P0：3份canonical manifests＋54份schemas共57文件，changed=[]；`validate-output.mjs`、`contract-context.mjs`、`validate-prompt-projection.mjs`、`validate-shot-compiler.mjs` 四份语义实现均unchanged。故P2没有通过替换命名空间、增kind或放松语义门禁实现拆分。

## 受审产品源身份

| 源文件 | SHA256 |
| --- | --- |
| skill-catalog.json | bd360b781353c0974bd3f3eb4f09b6d4f78c86809c7ac59e7e50f5f8063b4dd5 |
| skill-sources/cineweave-platform/SKILL.md | 85751f898cb7fa68cc16dba4e5ff4cde2301dc81a5675b3b9e3dab763a3f6662 |
| skill-sources/cineweave-platform/agents/openai.yaml | e250be14976aeddff1b4f45c489e87a2aa0b6fee9ceb4bf1b908cedf1a61f366 |
| skills/cineweave-director/SKILL.md | 718d3e5c080a73fc81d54c7accb94726bf07b9ed311b58e3702590aed3668d40 |
| skills/cineweave-director/references/core/operating-model.md | 51c07e850350f2721c8ce89886c455465a0bc8ca29463a3ef2cb1b9ae63af3b9 |

## 进入下一阶段的条件

工程实现可以保留，无需修复。本轮未发现需要回滚catalog或platform入口的证据。只有独立行为review完成同母稿忠实性、实际入口与返回交接后，才能按计划收口整体P2；不能以本轮工程通过替代该结论。

宿主真实安装/缓存选择、全工程最终发布门禁、供应商执行与实际媒体均不在本次验收中，没有宣称完成或通过。
