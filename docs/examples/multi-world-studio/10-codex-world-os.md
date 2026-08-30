# Codex World OS：可执行控制平面

状态：`implementation v0.4.0 / persisted contract v0.1.0 / real MCP and external LLM not connected`

这里的 `v0.4.0` 是运行时功能里程碑；JSON 中的 `contractVersion: 0.1.0` 是仍在使用的持久化线协议。两者有意独立演进，在提供迁移器前不会仅因新增兼容对象而改写已有 Artifact 合约版本。

## 1. 核心约束

整个系统只有一个大脑：`codex.root`。

- 目标职责是由 Codex 解析创作请求、提出角色行为、推演剧情并编排提交；确定性运行时负责检查触发、规则、版本和状态差量。
- 确定性 World OS 是 Codex 的护栏，不是第二个创作大脑。
- 人类 Canon Owner 批准不可逆事实、Hard Lock、身份、地理、风格、生产和公开发布。
- MCP 只把已提交事件的派生投影更新到平台；平台不是事实源。
- 未来 LLM API 只生成结构化提案；它不能批准、提交或直接写 StateSnapshot。

## 2. 已实现边界与规划接口

```text
目标输入：自然语言创作请求 / [v0.4 ExternalSignal]
                ↓
 Codex Brain（当前为目录编写 + CLI 编排）
                ↓
 Trigger Scan + ActionCatalog + EventTemplateCatalog
                ↓
 EventProposal 候选（只引用 actionId，不自报 effects）
                ↓
 BranchSet（1–3 个 proposal_only 候选）
                ↓
 硬约束裁决 + 目录评分选择
                ↓
 ┌──────────────┴──────────────┐
 │ 普通模拟发展                │ Canon / Hard Lock / 不可逆变化
 ↓                             ↓
Successor State          Human Gate（停止，不偷写答案）
 ↓
TransitionDecision
 ↓
EventCommit（终结标记）
 ↓
PlatformProjection → MCP Outbox → [真实 MCP／平台：尚未接入]
        ↓
PublishReceipt（当前仅本地夹具）

Human Gate approve → exact resume → EventCommit(approvalRefs)
                              ↓
                    CanonFact + ContinuityLedger + CanonPromotion

ExternalSignal（已实现 observation-only 摄取） ─ ─ → 下一轮 Codex 提案证据
```

`brain-run` 是上述控制面的单一有界入口：

```text
preflight verify
   ↓
optional LLM shadow（只生成 Proposal，不写 State）
   ↓
Portfolio weighted-fair simulation（每个世界独立 CAS head）
   ↓
MCP dry-run / trusted network opt-in（只投影 Commit）
   ↓
postflight verify → CodexBrainRunReceipt
```

它不会在进程内保存“下一步剧情”，也不会把模型输出直接喂回提交器。每个
子步骤都有自己的不可变 Artifact；总收据只保存精确 refs、计数和健康摘要，因此
进程在 Portfolio、LLM 或 MCP 阶段中断后，Codex 可以从已有子收据审阅并重新规划，
而不是依靠隐藏内存恢复。需要同一计划的幂等重试时，为 `brain-run` 提供稳定
`--run-key`；若 Portfolio 已写入但总收据尚未落盘，可把精确 `PortfolioRunReceipt`
传给 `--resume-portfolio`。默认 MCP 是 dry-run；真实 connector、账号和网络仍需显式
提供并通过 `--allow-network` 开启。

写入顺序有意采用“候选后继状态先写、EventCommit 最后做序列 CAS”。候选 State 与 Decision 的 ID 绑定 Proposal 哈希，不再让两个候选争用同一个 State ID/version；因此中断产生的 staging 不会毒死下次尝试。只有 `commit.<world>.<stream>@sequence` 出现后，这次模拟分支变化才算完成。`audit` 只分类孤立 staging，绝不静默删除；相同提案可确定性重试，投影可从 Commit 重建。

当前 v0.4 的“Codex 大脑”边界必须读准确：Codex 在本仓库会话中编写/维护 ActionCatalog 与 EventTemplateCatalog，并调用 `step/run`；运行时只执行已验证模板，按模板内显式 `selectionScore` 确定性择一。Trigger 还会在同一 State clock 上检查 `dueAt`、`cooldownMinutes` 与 `maxOccurrences`，Proposal adjudication 会重复检查这些门。`portfolio-run` 只按 workspace allocation 给每个独立世界分配一次单世界 turn，不共享 State/Actor/Canon。现在缺模板会产生精确 `TemplateWorkItem`，Codex 可提交更高版本目录并从同一 State/Commit head 恢复；Canon 候选会生成 `GateRequest`，只有最新的人工 `GateDecision=approve` 才能恢复同一 Proposal。平台反馈可通过 `signal-ingest` 绑定成功 PublishReceipt，保存去重且不含原文的 `ExternalSignal`；Codex 再用 `signal-use` 把 used/deferred/dismissed 判断绑定到精确 Proposal 或留下明确的暂缓/忽略证据，但它仍只能作为提案输入。自然语言仍不能直接变成 effect，不能把该闭环称为无人值守的长期自主创作。

## 3. 权威与分支

| 对象 | 权威性 | 谁可创建 | 是否可改 Canon |
| --- | --- | --- | --- |
| EventProposal | 不可信候选，绑定精确 EventTemplateCatalog/Template 与 ActionCatalog | Codex；未来可由 LLM API 提交给 Codex | 否 |
| ActionCatalog | 世界内允许动作、成本、时长与 effects 的精确目录 | Codex 提案、人类可审阅 | 否 |
| EventTemplateCatalog | 目标—阻力—选择—变化—下一因的可执行模板 | Codex | 否 |
| BranchSet | 1–3 个候选、硬约束结果与唯一选择 | Codex | 否 |
| TransitionDecision | 规则裁决证据 | Codex 确定性护栏 | 否 |
| simulation StateSnapshot | 模拟分支状态 | 仅 Codex | 否 |
| EventCommit | 指定 simulation 分支的一次终结记录 | 仅 Codex | 仍是非正史；Canon promotion 另行发生 |
| PlatformProjection | Commit 的可重建视图 | 仅 Codex | 否 |
| MCP Dispatch | 平台发布请求 | Codex 从 Outbox 取出 | 否 |
| PublishReceipt | 平台返回证据 | MCP 返回、Codex记录 | 否 |
| SimulationRunReceipt | 每轮起止状态、尝试、Commit 与停止原因 | Codex | 否 |
| GateRequest / GateDecision | 精确 Proposal、BranchSet、simulation head 与 Canon head 的人工决策链 | Codex 创建请求；人类作决定 | GateDecision 本身不直接写 State/Canon |
| CanonFact | 由已批准 Simulation Commit 提升的标量正史断言 | Codex 在 promotion 中写入 | 仅通过精确 Gate promotion |
| ContinuityLedger | Canon 的版本化连续性账本与未解决冲突 | Codex 在 promotion 中写入 | 不自动覆盖或选边 |
| TemplateWorkItem | 缺失模板时的暂停证据与恢复边界 | Codex | 否 |
| ExternalSignal（v0.4 observation-only） | 点赞、评论、投票、平台编辑等隐私受限观察 | Codex 绑定成功 PublishReceipt 后记录为候选输入 | 否 |
| ExternalSignalUseReceipt（v0.4） | Codex 对某条信号“用于提案/暂缓/忽略”的不可变声明 | Codex 绑定精确 ExternalSignal，可选绑定精确 Proposal | 否 |
| PortfolioRunReceipt | 一次多世界公平预算运行、各世界单步收据与独立 heads | Codex 仅作为编排层创建 | 否 |
| CodexBrainRunReceipt | 一次有界 Brain 控制循环的 preflight、Portfolio、shadow、MCP 与 postflight 精确 refs | 仅 Codex | 否 |

当前示例只运行 `simulation.main`，所有平台内容都带“模拟分支／非正史”标签。W01/W02 的 World Bible、角色、地点、风格和 Day 0 都仍是 `proposal`；没有伪造人审、Rights、CharacterSpec、SceneSpec 或媒体执行结果。

## 4. 角色行为如何产生

人物不是随机聊天 Agent。每名角色由 `ActorPolicy + ActorState` 约束：

- `goals`：公开与私下目标及优先级；
- `capabilities`：当前可采取的动作能力；
- `limits`：全知、武力、知识与权限边界；
- `preferences`：压力下偏好的策略顺序；
- `knowledge/unknown`：角色知道和不知道的事实；
- `location/status/exposure`：当前可行动条件。

ActionCatalog 中的每个动作必须引用角色目标、能力、偏好、限制和至少一条世界规则，并固定选择、代价、时长、直接差量与规则检查证据。EventProposal 只允许提交 `actionId + parameters`；当前版本参数必须为空，运行时从精确 `actionCatalogRef` 重建动作。角色没有某项知识、能力或所在位置不满足前提时，裁决器拒绝动作；提案添加自定义 effect 字段也会在合约层直接失败。

每个 EventProposal 还必须记录 `objective / opposition / choiceUnderPressure / stateChange / causesNext / irreversibility`。`delayedConsequences` 进入 State 的待实现队列，后续事件必须精确声明并实现当时所有到期后果，不能跳过不利因果。

## 5. 触发事件

触发条件使用受限 Condition DSL，不执行任意代码或把自然语言当布尔值。当前支持：

```text
eq / ne / gt / gte / lt / lte / in / contains / exists
all / any / not
```

未知路径默认阻断。扫描结果区分 `conditionMet` 与 `transitionEligible`：W02 可以条件成立但仍显示 `needs_human_gate`，不会再被误报成可执行。提案还必须绑定精确 `baseStateRef`、ActionCatalog 和 `expectedSequence`；动作目录给出精确 duration，`occurredAt` 不能任意跳钟。

W01 三条连续示例事件位于：

```text
examples/multi-world-studio/events/event.w01.rain-night-incense.json
examples/multi-world-studio/events/event.w01.official-search-pressure.json
examples/multi-world-studio/events/event.w01.inspect-old-tag-order.json
```

第一条实体化旧签并安排“搜查入巷”的延迟后果。第二条生成两个候选：基准分支分开载体，恶化分支让两个载体共享发现路径；硬约束均通过后，运行时按 Codex 预写在模板中的显式评分选择基准分支，只提交这一条。第三条实现上一后果，只在店内比较旧签与既有记录，得到可证伪的货路假设；它不识别伤者、幕后人或旧案真相，并在父亲账册尚未实体化时以 `no_due_trigger` 停止。

W02 已有独立可执行路径：先提交一次可逆的基线测量，把 `assessmentStatus` 改为 `collecting_baseline`，不授予工程许可、不传输资源、不计算生态债。随后阈值复核的条件成立，但 Trigger、Action 与 `candidate_fact` 三层 Gate 共同使运行返回 `needs_human_gate`，State 仍停在 sequence 1。

## 6. MCP 平台更新

平台配置位于：

```text
examples/multi-world-studio/platforms/studio-platform.json
```

当前 `serverAlias=world-platform` 和 `toolName=upsert_world_projection` 是待映射的通用接口，不代表真实 MCP 已安装或调用。`world-os dispatch` 已实现本地 claim/attempt/retry/dead-letter 控制面，但默认 dry-run；真实网络调用仍必须显式提供 connector、server、tool、账号和权限。真实流程是：

1. Codex 运行 Outbox，取得待发布 Dispatch。
2. `dispatch` 先写入带 lease 的 `MCPDispatchClaim`；没有 `--allow-network` 时只做 dry-run。
3. Codex 确认实际连接器、工具名、账号、受众和发布 Gate；可信 connector 只接收 Dispatch 与取消信号，不接收本地 State/Canon 写权限。
4. Codex 调用对应 MCP 工具，只发送投影副本、来源 Commit refs 和幂等键。
5. MCP 返回 `status/platformRecordId/idempotencyKey/receivedAt`；Codex 写 `MCPAttemptReceipt`，成功/拒绝再写 `PublishReceipt`。
6. 连接失败不伪造平台成功，按固定 backoff 重试，超过预算进入 `dead_letter`，等待人工恢复。

仓库提供 `packages/cineweave-world-os/src/mcp-stdio.mjs` 的受控进程适配器，以及 `mcp-http.mjs` 的 HTTP/Streamable-HTTP 适配器。stdio 只在 `call` 时启动用户明确指定的可执行文件，禁用 shell；HTTP 使用 POST JSON-RPC、会话头和有界 JSON/SSE 响应。两者都只接受 bounded structured platform response，并在超时/取消时终止请求。适配器构造必须显式 `trusted: true`；`world-os dispatch` 仍必须显式 `--allow-network`。示例工厂位于 `examples/multi-world-studio/connectors/mcp-stdio.connector.mjs` 与 `mcp-http.connector.mjs`，真实 server、账号、endpoint 和环境变量由部署者提供。

每个投影绑定生成它的精确 `platformProfileRef`；Outbox 只选择与调用 Profile 哈希完全相同的投影，并再次核对 platform、operation、audience、server 与 tool 所属配置，防止多平台串台。同一个投影重复发送使用同一个幂等键。v0.4 已可把平台修改、评论和投票作为成功 PublishReceipt 之后的 `ExternalSignal → ExternalSignalUseReceipt → 下一轮 Proposal` 观察输入；UseReceipt 记录 Codex 的 used/deferred/dismissed 判断，不包含原始用户身份或文本，也不能反向覆盖世界状态。

如果使用 `world-os serve`，部署侧回调不需要直接接触本地 Store：

```text
POST /v1/signals
  { worldId, sourceProjectionRef, sourceReceiptRef, platformProfileRef,
    signalType, sourceEventId, observedAt, observation, privacy }
        ↓ Codex 校验成功 PublishReceipt、隐私字段与 dedupe key
ExternalSignal
        ↓ Codex 明确判断
POST /v1/signal-uses
  { signalRef, proposalRef|null, outcome, recordedAt }
        ↓ 下一次 brain-run 读取为 proposal-only 证据
```

HTTP 入口严格拒绝额外字段、原始评论、用户身份和未绑定的投影/回执；列表接口也有
数量上限。真实平台仍需由部署者负责 webhook 验签、账号隔离、限流和重放保护，不能把
本地 HTTP 路由测试当成真实平台回流证据。

示例平台受众为 `private_workspace`。没有 `gate.release`、Rights 与完整 QA 时，不得把该配置改成公开发布。

## 7. 未来 LLM API

`packages/cineweave-world-os/src/providers.mjs` 已定义 provider 边界。任何模型适配器都必须满足：

```json
{
  "outputScope": "proposal_only",
  "canApprove": false,
  "canCommit": false,
  "canWriteState": false
}
```

未来调用应只传入精确 Workspace/World/State/Actor/Trigger/Action refs、允许的分支策略、预算和输出 Schema。运行边界会核对精确 Provider Policy、角色与动作白名单，强制 usage receipt，并实施单次请求超时。响应保存模型标识、模板版本、输入 refs、输出哈希、成本与简短决策理由；不把隐藏思维链当作运行依赖。响应仍要经过内置 EventProposal 合约、Codex 与确定性裁决器，不能直接产生 EventCommit。

仓库提供 `packages/cineweave-world-os/src/llm-http.mjs` 的 OpenAI-compatible HTTP 适配器。它只在 `propose` 时发出请求，限制请求上下文和响应大小，要求 usage token/cost，剥离模型返回的未声明字段，再交给现有 `requestSimulationProposal`、Codex 裁决和 LLM shadow receipt。它不会保存原始 HTTP body、API key 或隐藏推理；构造必须显式 `trusted: true`，运行还需要 `llm-shadow --allow-network`。示例工厂位于 `examples/multi-world-studio/providers/openai-compatible.provider.mjs`；`http-shadow-profiles.example.mjs` 可直接作为 `world-os serve --shadow-profiles` 的服务端 profile 工厂，但只有唯一（或由 `WORLD_OS_LLM_POLICY_ID` / `WORLD_OS_LLM_REQUEST_ID` 明确选择的）启用 ProviderPolicy 与精确 SimulationRequest 才能启动；CLI 也支持直接传 `--http-endpoint --model --llm-trusted --api-key-env`，但默认不配置 endpoint，也不会自动联网。

## 8. 命令

共同准备步骤：

```powershell
npm run worlds:review
npm run worlds:rebuild
npm run worlds:triggers
npm run worlds:actions
```

随后选择一种推进路径。自动路径可先 `step` 再从当前头继续 `run`，或直接 `run`：

```powershell
npm run worlds:run
npm run worlds:head
npm run worlds:audit
npm run worlds:reconcile
npm run worlds:outbox
npm run worlds -- verify .build/multi-world-studio
```

单步命令为 `npm run worlds:step`。固定三夹具路径是另一种演示方式；它必须从独立 fresh store 开始，不能在 `worlds:run` 已推进的同一 store 上重放：

```powershell
npm run worlds -- rebuild examples/multi-world-studio/seed-manifest.json .build/multi-world-manual
npm run worlds -- simulate .build/multi-world-manual examples/multi-world-studio/events/event.w01.rain-night-incense.json
npm run worlds -- simulate .build/multi-world-manual examples/multi-world-studio/events/event.w01.official-search-pressure.json
npm run worlds -- simulate .build/multi-world-manual examples/multi-world-studio/events/event.w01.inspect-old-tag-order.json
```

- `worlds:review`：只读审阅工作区、世界组合、Locks、连接层、里程碑与权限边界。
- `worlds:rebuild`：从已提交源 JSON 确定性重建 `.build/multi-world-studio/.cineweave`。为保护不可变账本，它拒绝覆盖已有 store。
- `worlds:triggers`：针对当前精确分支状态扫描 W01 Trigger Catalog，列出 eligible 与被阻断事件。
- `worlds:actions`：列出精确 ActionCatalog 中的 actor、Trigger、Gate 与 Canon ceiling。
- `worlds:step`：执行一个完整的扫描—分支—选择—裁决—Commit 周期。
- `worlds:run`：有界循环执行 Decision Cycle，并以 `no_due_trigger / awaiting_codex_template / needs_human_gate / all_candidates_rejected / stale_after_race / committed_projection_pending` 等明确原因停止。
- `worlds:gate-request` / `gate-decide`：为精确 gated Decision 建立人工 Gate 请求并记录不可变 approve/reject/revise 链。
- `worlds:resume`：只接受最新、精确、已批准 GateDecision，从原 Proposal 的 State/BranchSet head 恢复；不接受自然语言 effect。
- `worlds:promote` / `canon-head`：把已批准且仍为 simulation 当前 head 的 Commit 提升为 CanonFact、ContinuityLedger 与 promotion；Canon head 与 simulation head 分开推导。
- `worlds:template-submit` / `template-resume`：提交新版本 EventTemplateCatalog，关闭精确缺模板工作项并恢复一个 Decision Cycle。
- `world-os signal-ingest` / `worlds:signals`：把成功 PublishReceipt 后的隐私受限平台观察写成 ExternalSignal，并为下一轮 Codex 提案列出精确输入；不写 State/Canon。
- `world-os signal-use` / `world-os signal-uses`：把某条 ExternalSignal 与 exact Proposal 的使用、暂缓或忽略决定写成不可变证据；不写 State/Canon。
- `worlds:portfolio` / `world-os portfolio-run`：按 workspace allocation 运行 weighted-fair Portfolio，写入 `PortfolioRunReceipt`，不合并世界 State/Canon。
- `worlds:brain` / `world-os brain-run`：把审计、可选 LLM shadow、Portfolio 推演、MCP dry-run/可信 dispatch 和最终审计收束为一个有界 `CodexBrainRunReceipt`；不会自动批准 Gate、提升 Canon、执行媒体或公开发布。
- `world-os brain-status`：只读扫描当前 Workspace 与各世界的精确 head、Trigger 条件/时间/Gate 状态、按平台聚合的待发布投影和最近一次 Brain 收据；不推进 State、不创建 Claim、不调用 LLM/MCP。
- `world-os forecast` / `GET /v1/brain/forecast`：只读编译下一触发器的 1–3 个候选、确定性裁决和未持久化后继 State；结果固定标记为 `proposal_only`、`persisted:false`，不会写 Proposal、BranchSet、Decision、State、Commit 或 Outbox。CLI 可返回完整预览 State；HTTP 为有界响应只返回后继 State 摘要。
- `world-os brain-runs`：列出 Brain 总收据，用于按精确 Portfolio/Attempt/Publish refs 做恢复审阅。
- `world-os serve`：为本地 UI、调度器或部署侧 MCP 编排器暴露受保护的 Brain HTTP 控制面；默认 loopback，启用 connector、LLM shadow profile、网络 dispatch 或非 loopback 时必须使用环境变量 Bearer token，网络 dispatch 还要显式加 `--allow-network`。用 `--shadow-profiles` 在服务端登记精确 request/policy/provider，HTTP 请求只能选择 `shadowProfileIds`，不能携带 connector/provider、凭据或 State/Canon 写入。`GET/POST /v1/signals` 与 `GET/POST /v1/signal-uses` 只处理成功 PublishReceipt 链上的隐私受限 observation 和 Codex 消费收据，不能把平台反馈直接写成剧情事实。
- `GET /v1/production/status`：只读返回经 exact-ref 验证的 ProductionSlice、MediaImport、QA Review、ApprovedAsset 与 private ReleaseReceipt；支持 `?worlds=W01,W02&limit=...`，不接受任何写入字段或远程审批。`/health` 与 `/healthz` 会返回与 CLI 相同的精确路由能力清单。
- `world-os create-world`：把候选卡登记为独立的 `WorldRegistration`，保留精确 workspace/candidate 引用；不会自动生成 WorldState、角色或剧情，也不会直接进入 Portfolio。
- `world-os world-inception-decide`：记录具名 human Gate 的 approve/reject/revise 决策；只有最新 exact approve 才能进入后续运行包挂载阶段。
- `world-os world-registrations` / `world-inception-decisions`：审阅动态世界注册与人审链。
- `world-os brand-echo-create` / `brand-echoes`：登记跨至少两个已知世界的 L1 共享母题；合约强制 `shared_motif_only`、无 Canon 影响、禁止跨世界因果与共享 Actor/Item。
- `world-os brand-echo-decide` / `brand-echo-decisions` / `brand-echo-activate`：记录具名 human Gate，并把批准绑定到上一版本的精确提案；未批准的 BrandEcho 不进入激活态。
- `world-os production-slice-create`：把一个精确 simulation Commit/State 与 StoryBrief、BeatSheet、ScriptScene、Character/Scene/Style、Shot/Prompt、AssetRecipe、Rights 和 QA 合约快照绑定成 proposal-only 生产纵切片。
- `world-os production-gate-decide` / `production-stage-activate`：按 story → character → geography → style → rights → QA → release 顺序推进；release 可被记录为 `private_workspace`，不等于真实媒体生成或公开发布。
- `world-os production-execution-plan` / `production-execution-run`：在 `qa_pending`（Rights 已批准、QA 尚未批准）阶段，把精确 ProductionSlice 编译成通用 `ExecutionRequest` 与 provider-neutral `RenderPlan`，再交给通用 adapter runtime 做 capability、预算、幂等、输出 hash 和 receipt 校验。非最新 slice 版本不能回放；Gate 不足的请求会持久化为 blocked receipt。fixture 是本地确定性媒体夹具，external 仍需 exact request ApprovalRecord、可信 adapter 和显式 operator opt-in。
- `world-os production-media-import` / `production-media-imports`：对成功且有图像输出的 exact `ExecutionReceipt` 做二次字节、哈希、尺寸和路径校验，只接受 PNG/JPEG/WebP，生成 Draft `MediaImport` 与 `world_os_production_media_import` binding。binding 可作为 QA Gate 的 exact evidence，但不会自动变成 `ApprovedAsset`、`released` 或任何公开/私有 Release receipt；SVG、视频和供应商 URL 不能被伪装成该合约。
- `world-os production-qa-review` / `production-approved-asset` / `production-private-release`：先在 `qa_pending` 记录 human checklist 与 MediaImport refs，再把 QA review 作为 Gate evidence；QA stage 激活后生成 exact private `ApprovedAsset`，Release stage 激活后生成 `private_workspace` `ReleaseReceipt`。ReleaseReceipt 的 `public` 固定为 false；如果要关联平台，只能附加已经成功且 non-authoritative 的 exact `PublishReceipt`。

最小调用顺序如下（`execution-manifest.example.json` 只提供字段形状，所有 refs 必须换成目标 Store 中的 exact refs）：

```powershell
world-os production-execution-plan <project> <qa-pending-slice-ref.json> production/execution-manifest.example.json
world-os production-execution-requests <project> --world-id W01
world-os production-execution-run <project> <execution-request-ref.json>
world-os production-media-import <project> <execution-request-ref.json> <execution-receipt-ref.json>
world-os production-media-imports <project> --world-id W01
world-os production-qa-review <project> <qa-pending-slice-ref.json> --decision approve --actor human.qa --checklist qa-checklist.json --media <media-binding-ref.json>
world-os production-approved-asset <project> <approved-asset-slice-ref.json> <qa-review-ref.json>
world-os production-private-release <project> <released-slice-ref.json> <approved-asset-ref.json> --actor human.release
```

第三条命令默认使用本地 fixture adapter；若请求是 `external`，还必须先对同一 `ExecutionRequest` 写入 `ApprovalRecord`，并显式传入受信任 adapter 与 `--allow-external`。后续命令严格按 QA review → QA stage → ApprovedAsset → Release stage → private ReleaseReceipt 顺序执行；任何 `ExecutionReceipt` 或 Draft MediaImport 都只表示执行/导入边界已验证，不自动代表 QA、ApprovedAsset 或 Release。
- `world-os world-activate`：在最新 exact human approve 后挂载 WorldCard、sequence-zero State、Trigger/Action/EventTemplate Catalog 与 projection-only PlatformProfile；成功后该世界才可被 Portfolio 调度。
- `worlds:simulate`：运行 W01 示例提案并追加精确 Artifact。
- `worlds:simulate:next`：在第一条 Commit 的精确分支头上运行第二条事件，验证“触发器 → 人物反应 → 剧情后续”保持单一线性历史。
- `worlds:simulate:third`：继续运行旧签次序检查夹具，验证延迟后果实现与知识边界。
- `worlds:head`：从终结 Commit 链推导当前分支头和精确 State ref，不读取可覆盖的 `current.json`。
- `worlds:reconcile`：从终结 Commit、Decision、Proposal 与 State 确定性补建缺失投影，用于恢复 Commit 成功而投影写入中断的情况。
- `worlds:outbox`：输出待由 Codex 调用的 MCP Dispatch，不自行伪装成外部调用。
- `world-os dispatch`：默认 dry-run；显式 connector/network opt-in 后执行 claim → attempt → PublishReceipt，并记录 backoff/dead-letter。
- `world-os dispatch` 的 connector 可以是异步工厂；`mcp-stdio.connector.mjs` 是无 shell、可取消的 MCP stdio 示例，真实 server 需由部署环境注入。
- `world-os mcp-claims` / `mcp-attempts`：查看精确 MCP lease 与尝试收据。
- `world-os llm-shadow` / `llm-shadow-runs`：运行或审阅 proposal-only 模型 shadow，记录精确输入、usage、输出哈希与失败证据；不提交 State/Canon。
- `openai-compatible.provider.mjs` 是可选 HTTP provider 工厂；必须同时满足可信标记、环境 endpoint/API key、ProviderPolicy 预算和 `--allow-network`。服务端 profile 若要联网还需启动时显式加 `--allow-llm-network`。
- `worlds:audit`：从 Commit 链推导 head，区分 staging、Gate 决策与未提交 BranchSet，不删除证据。
- `recover`：补建可重建投影并执行同一只读分类。
- `verify`：验证不可变 Store 与 Artifact 依赖图。

重新演示时应选择新的构建目录，或由使用者明确清理 `.build/multi-world-studio` 后再重建；实现本身不提供覆盖或静默修复命令。

## 9. 源码与验证

```text
examples/multi-world-studio/          可提交的机器源、Schema、事件与平台配置
packages/cineweave-world-os/          审阅、裁决、Store、Outbox、Provider 与 CLI
tests/world-os/                        正向、越权、过期版本与确定性测试
.build/multi-world-studio/.cineweave  可重建本地 Store，不提交
```

专项测试覆盖：结构与语义审阅、Codex 单写者、MCP/LLM 越权、Undefined 边界、Condition DSL、Trigger Catalog、due/cooldown/maxOccurrences、目录外动作与自报 effect 拒绝、EventTemplate 因果/延迟后果绑定、BranchSet 选中候选绑定、双候选只提交一条、W01 三步运行、W02 Gate 停止、Portfolio 公平调度与独立 head、Gate approve/revise/reject、过期审批、resume 幂等、Canon 与 simulation 双 head、Continuity schema、缺模板 work item/resume、候选隔离与中断重试、提交后投影异常的 RunReceipt、过期引用、分支头、双 Store 字节级重建、Outbox、PublishReceipt、ExternalSignal 去重/Receipt 绑定/隐私边界、ExternalSignalUseReceipt 的 Proposal 绑定与幂等、MCP claim/retry/dead-letter 与 LLM shadow usage/authority。

## 10. 当前尚未执行

- 真实平台 MCP 的 server/tool/账号映射与调用；本地受控 stdio connector 已完成 dispatcher → PublishReceipt/AttemptReceipt 闭环测试，但没有部署目标或凭据；
- 真实外部 LLM API、预算计费、速率限制与模型评估；本地已有 OpenAI-compatible provider 边界与 `llm-shadow` proposal/usage receipt，但没有配置目标或凭据；
- W02 阈值、工程逻辑与多维生态债数值模型（仅基线测量已可执行）；
- 真实平台外部审批 UI 与多人签名策略（本地 `GateRequest/GateDecision`、resume、Canon promotion 已执行）；
- 真实平台 MCP 的反馈回流、认证、速率限制与运维；本地 ExternalSignal 合约、去重和隐私边界已执行；
- 跨世界品牌的设计系统、人工审批 UI、素材一致性扫描与真实长期运行编排；本地 L1 BrandEcho 合约、审批链和非因果边界已执行；
- 真实 CharacterSpec、SceneSpec、StylePackage 的供应商执行、外部媒体生成、真实媒体回调、多人 QA 与公开 Release；本地已验证 ProductionSlice → ExecutionRequest → fixture ExecutionReceipt/blocked receipt → PNG MediaImport → human QA Review → ApprovedAsset → private ReleaseReceipt，但这不等于真实供应商执行或公开 Release；
- 对外 Release Gate 与商业运营数据。

这些不是隐藏缺口：它们分别需要平台接口、模型选择、人类决策、研究、Rights 或生产证据，不能由当前原型自动宣称完成。

## 11. 下一阶段实现顺序与验收线

1. `v0.3 Continuity + Canon promotion`（已实现本地闭环）
   - version-bound ContinuityLedger、CanonFact、冲突记录、GateRequest/GateDecision 和 approve/reject/revise/promote 已有持久化合约。
   - 缺模板工作项、版本化 EventTemplateCatalog 输入与精确 resume 已实现；自然语言仍不得直接当 effect。
   - Promotion 绑定精确 simulation Commit 与当前 Canon head，不重演或重新生成 effects。
   - 验收：冲突不自动选边；过期审批失效；同一批准可幂等提升；Canon 与 simulation head 可分别推导；缺模板可从同一精确 head 恢复。
2. `v0.4 Inputs + portfolio scheduler`（本地 slice 已实现）
   - observation-only ExternalSignal、去重、来源、时间、隐私与 PublishReceipt 绑定已实现。
   - dueAt/cooldown/maxOccurrences 已在 Trigger scan 与 Proposal adjudication 双重执行；Portfolio weighted-fair scheduler 写入独立 heads 的 `PortfolioRunReceipt`。
   - ExternalSignal 到 Proposal 的 `ExternalSignalUseReceipt` 消费标记、通用 `create-world` 的候选注册/Inception Gate/运行包挂载、动态 Portfolio 调度与 L1 BrandEcho（human activation、跨世界非因果边界）已实现；Phase 1 继续禁止 L2/L3 故事因果。
   - 验收：重复信号不重复触发；W01/W02 独立 CAS；无 runnable world 被无限饿死；任何跨世界 Actor/State/Item 引用被拒。
3. `v0.5 Real MCP private loop`
   - 本地 trusted dispatcher、claim、retry/backoff、dead-letter、attempt receipt 与无 shell stdio connector 已实现；仍需接入用户提供的真实 MCP server/tool/schema/auth。
   - 验收：至少一次真实私有 upsert + reconcile + 平台反馈入站；重复发送保持远端幂等；平台不能写 Canon/State。
4. `v0.6 LLM shadow proposals`
   - 本地 `llm-shadow`、结构化输出、OpenAI-compatible HTTP provider、环境密钥边界、预算与 usage receipt 已实现；仍需接入真实模型、限流、熔断、billing receipt 与固定评测集。
   - 验收：模型只产候选；目录外动作、越权知识和预算超限均被拒；与 Codex 候选 shadow 对比达标后才可作为常规候选源。
5. `v0.7 W01 production vertical slice`
   - `ProductionSlice` 已把 Event Commit → Story/Character/Scene/Style/Shot/Prompt/Production/Rights 快照 → 有序 Gate → provider-neutral `ExecutionRequest` → fixture/local `ExecutionReceipt` → Draft PNG/JPEG/WebP `MediaImport` → human QA Review → private `ApprovedAsset` → private `ReleaseReceipt` 串成可审计本地桥；仍需真实媒体执行、多人 QA 与真实平台 Release receipt。
   - 验收：身份、地理、Representation、Rights、QA 与 Release receipt 齐全；随后连续运行至少 3 个发布学习周期，再决定 W02 是否提升。
