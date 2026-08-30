# 方案完成与交付检查表

这份清单验证“多世界 AIGC 内容工作室方案设计”是否完整。它不宣称角色图、影片、账号或商业结果已经产生。

## A. 母品牌与世界矩阵

- [ ] Meta Bible 有一句话定位、母题、共同基因和明确禁区。
- [ ] 软连接、信号连接和正式跨世界事件有分阶段规则。
- [ ] W01/W02 已有完整 World Bible 草案。
- [ ] W03/W04 明确标为候选孵化世界，而非已批准生产世界。
- [ ] 世界立项评分不能用总分抵消阻断项。
- [ ] 各世界历史、规则、人物、地理和风格正史相互独立。

## B. 世界设计覆盖

- [ ] 每个已立项世界有观众承诺和一个可回答的戏剧问题。
- [ ] 至少三条规则分别说明能力、限制、代价和例外。
- [ ] 有稀缺资源、历史伤口、派系和普通人的日常系统。
- [ ] 有四个核心角色功能和至少五个英雄地点。
- [ ] 首季节拍使用目标、阻碍、选择、变化与因果下一步。
- [ ] 视觉包包含媒介、色彩、材质、光感、运动和禁用项。
- [ ] 历史/文化事实与架空解释有清晰区分。

## C. Canon 与推演

- [ ] Canon、State、Narrative、Representation、Production 五层分开。
- [ ] 状态向量覆盖时间、资源、权力、信任、知识、生态、威胁和债务。
- [ ] ActorState 只允许角色依据已知信息行动。
- [ ] EventCard 记录前提、行动、对手回应、代价、状态差量和延迟后果。
- [ ] AI 分支不会自动写入 Canon。
- [ ] ContinuityLedger 能表示有效期、来源、冲突和未决状态。
- [ ] 社媒反馈只进入信号、偏好、创意或 Canon 请求队列。

## D. 角色、场景与风格

- [ ] 角色身份与发型、服装、妆容、伤势等外观状态分开。
- [ ] 每个主要角色有至少三个结构锚点和一个中远景可读锚点。
- [ ] 性格已转译成目标、策略、姿态、视线、动作和禁用反应。
- [ ] 场景地理与昼夜、天气、人群、损坏等状态分开。
- [ ] 每个英雄地点有经过研究和人审的方向、入口、路径、尺度和固定锚点。当前 W01/W02 只有功能与部分锚点，仍是 SceneSeed，不是 SceneSpec。
- [ ] 风格不会改写人物身份、场景地理或物理光源位置。
- [ ] 跨媒介版本分别绑定和审核，不通过词语替换冒充转换。

## E. 生产、权利与 QA

- [ ] 资产图谱使用精确 `kind/id/version/hash` 引用。
- [ ] 多格资产独立生成、确定性拼装、只重试失败格。
- [ ] hard/soft/advisory 控制优先级明确。
- [ ] Character、Scene、Interaction、Storyboard、Style、Rights QA 均有责任人。
- [ ] 审核按维度报告 PASS/WARN/FAIL，不输出综合美貌分。
- [ ] 每项参考有唯一角色、范围、排除项和权利状态。
- [ ] 权利未知的必需输入会阻断最终生产。
- [ ] 发布资产区分 canonical depiction、approved variation、non-canon 与 experiment。

## F. 工作室运营

- [ ] 人类 Canon Owner、视觉技术负责人和制片运营责任清晰。
- [ ] `gate.portfolio-fit` 至 `gate.release` 的语义 Gate 与精确版本绑定。
- [ ] 70/20/10 资源策略已采用或有明确替代方案。
- [ ] 母账号与世界栏目有命名和封面区分策略。
- [ ] 每周 Canon、Production、Release 三类记录有唯一权威来源。
- [ ] 商业化阶段不早于世界辨识度、资产稳定性和权利解决。

## G. 90 天执行就绪

- [ ] 1–14、15–30、31–60、61–90 天均有交付物和 Gate。
- [ ] W01 是唯一主生产世界，W02 是受控孵化世界。
- [ ] W03/W04 不消耗主世界的重资产产能。
- [ ] KPI 同时覆盖创意、连续性、生产、受众和组合决策。
- [ ] 第 90 天只允许 scale、promote、repair 或 pause 四类证据化决定。

## 完成定义

方案设计可标为完成，必须同时满足：

1. 本目录所有文档存在、内部链接有效且相互不矛盾；
2. A–G 的设计项已有可定位证据，或明确标为需要未来人审/生产的未决项；
3. 没有把候选视觉、未授权参考、社媒反馈或 AI 推演误写成正史；
4. 方案明确区分“设计已完成”与“媒体生产尚未执行”。

实际世界、角色和媒体的 `active/locked` 状态只能由后续人审、证据与审批记录证明。

## 本次设计审计（2026-08-22）

| 目标要求 | 权威证据 | 结果 |
| --- | --- | --- |
| 母品牌、母题、共同基因与连接边界 | `00-meta-bible.md` | PASS |
| 多世界组合、W01/W02 优先级、W03/W04 候选边界 | `01-world-portfolio.md` | PASS |
| W01 世界观、规则、角色、地点、首季、风格与 Day 0 状态 | `02-w01-linan-chunxin.md` | PASS（设计草案） |
| W02 世界观、生态机制、角色、地点、首季、风格与 Day 0 状态 | `03-w02-shanhai-tianmen.md` | PASS（设计草案） |
| 可复制的新世界设计模板 | `04-world-template.md` | PASS |
| Canon、状态、连续性、分支和人工推演门 | `05-canon-and-simulation.md` | PASS |
| 资产图谱、版本、配方、控制、QA 与权利 | `06-asset-production-system.md` | PASS |
| 人类/Agent 分工、审批、发布、反馈、商业化与风险 | `07-studio-operations.md` | PASS |
| 90 天交付、Gate、KPI、预算桶与第 90 天决策 | `08-roadmap-and-kpis.md` | PASS |
| 文档导航与本地链接 | Markdown link audit + repository validation | PASS |
| 现有 CineWeave 运行与发布检查 | `npm test`、`npm run validate` | PASS |
| Codex 单写者、动作目录、分支选择、延迟后果、W01/W02 推演、恢复、MCP Outbox、ExternalSignal/UseReceipt 与 LLM 提案边界 | `examples/multi-world-studio/`、`packages/cineweave-world-os/`、`tests/world-os/` | PASS（Decision Cycle v0.4；ExternalSignal 与 UseReceipt 为本地 observation-only slice） |

### 结论

“多世界 AIGC 内容工作室方案设计”已形成文档包，并已实现 `v0.4` 的 Decision Cycle：机器工作区、精确 ActionCatalog、EventTemplateCatalog、1–3 候选 BranchSet、硬约束优先选择、延迟后果队列、候选隔离、终结 Commit、RunReceipt、W01 三步目录驱动推进、W02 安全基线、GateRequest/GateDecision、精确 resume、CanonFact/ContinuityLedger promotion、缺模板 work item、WorldRegistration/Inception Gate/运行包挂载与动态 Portfolio、MCP Outbox 与本地 claim/attempt/retry/dead-letter 控制面、无 shell 的 stdio connector、发布收据、去重且不含原文的 ExternalSignal/ExternalSignalUseReceipt、LLM shadow proposal/usage receipt、OpenAI-compatible provider 和未来模型边界。

这仍不是完整产品。真实 MCP server/账号调用、真实平台反馈回流、真实 LLM shadow mode/billing、供应商媒体执行、多人 QA 和公开 Release receipt 仍为 `NOT EXECUTED`，不得由本次测试通过推断；本地已经把 `ProductionSlice` 编译为通用 `ExecutionRequest`，用确定性 fixture adapter 生成本地 `ExecutionReceipt`/blocked receipt，并把成功 PNG receipt 绑定为 Draft `MediaImport` → human QA Review → private `ApprovedAsset` → private `ReleaseReceipt`，但这不等于真实媒体供应商、多人审批或公开发布。ExternalSignal 目前只在本地验证了成功 PublishReceipt 绑定、去重、隐私和 proposal-only 路由；Portfolio、动态 WorldRegistration 与 Codex Brain 目前是本地 weighted-fair 调度和不可变收据闭环。

## 运行能力增量审计（2026-08-24）

| 能力 | 证据 | 状态 |
| --- | --- | --- |
| 提案不能自报任意 effects | `actionCatalogRef` + `actionId/parameters`；目录外动作和附加 effects 负向测试 | IMPLEMENTED |
| 角色目标、能力、知识、位置、偏好与限制 | ActionCatalog + adjudicator checks | IMPLEMENTED（自然语言 forbiddenReaction 仍未形式化） |
| 多候选只提交一个分支 | W01 第二事件 baseline/deterioration BranchSet | IMPLEMENTED |
| 目标—阻力—选择—变化—下一因 | EventProposal、State timeline 与 Commit causality | IMPLEMENTED |
| 延迟后果 | `pendingConsequences` 安排、到期集合核对与 realized 记录 | IMPLEMENTED |
| Codex 目录驱动有界连续运行 | `world-os step/run` + RunReceipt stopReason | IMPLEMENTED（自然语言仍不能直接入站；版本化模板补全与 resume 已实现） |
| 崩溃后恢复 | proposal-hash staging、terminal CAS、audit/retry/reconcile 测试 | IMPLEMENTED |
| 多世界独立边界 | W01 sequence 3；W02 sequence 1 后 `needs_human_gate` | IMPLEMENTED |
| 候选世界注册与 Inception Gate | `registry.mjs`、WorldRegistration/InceptionDecision schema、create-world/activate-world 与 W03 动态 Portfolio 测试 | IMPLEMENTED（人审与运行包均为本地不可变合约） |
| L1 BrandEcho 跨世界共享母题 | `brand.mjs`、BrandEcho/Decision schema、human activation、W01/W02 非因果与幂等测试 | IMPLEMENTED（仅 shared motif；禁止共享 Actor/Item、Canon 与跨世界因果） |
| Event → production → ExecutionRequest → MediaImport → QA → ApprovedAsset → Release 纵切片桥 | `production.mjs`、`production-execution.mjs`、`production-media.mjs`、`production-release.mjs`、ContractSnapshot/ProductionSlice/Gate、QA/ApprovedAsset/Release schemas、fixture receipt、PNG callback、human checklist、stale/blocked 负向测试 | IMPLEMENTED（本地 fixture/dry-run + private evidence chain；真实供应商、多人审批与公开 Release 仍缺） |
| 人类 Canon promotion | `gate-request → gate-decide → resume → promote` + 双 head/幂等测试 | IMPLEMENTED（本地合约；多人审批 UI 未接） |
| Codex 运行中动态补模板与 resume | `TemplateWorkItem` + 版本化 EventTemplateCatalog + 精确 head 检查 | IMPLEMENTED（自然语言直接 effect 仍禁止） |
| 平台反馈 observation-only 合约与跨世界长期调度 | `signals.mjs`、`http-api.mjs`、ExternalSignal schema、去重/隐私测试、`portfolio.mjs` 与 PortfolioRunReceipt | PARTIAL（本地 CLI + HTTP 回流闭环；真实平台 webhook/auth/rate-limit 与长期运行仍缺） |
| MCP 私有循环与模型 shadow 边界 | `mcp.mjs`、`mcp-stdio.mjs`、`mcp-http.mjs`、`shadow.mjs`、`llm-http.mjs`、claim/attempt/dead-letter/usage schema 与测试 | PARTIAL（本地控制面与可插拔 stdio/HTTP 适配器已实现；真实 server/API/auth/billing 仍缺） |
| Codex Brain 有界总编排、只读扫描与 HTTP 控制面 | `brain.mjs`、`http-api.mjs`、`http-shadow-profiles.example.mjs`、`CodexBrainRunReceipt`、`brain-run`/`brain-status`/`serve` CLI 与组合测试 | IMPLEMENTED（本地 preflight → shadow proposal → Portfolio → MCP dry-run/opt-in → postflight；HTTP 默认 loopback，token/connector/服务端 shadow profile/ExternalSignal 回流受控，影子提案使用独立命名空间；真实平台/模型仍需显式部署） |
