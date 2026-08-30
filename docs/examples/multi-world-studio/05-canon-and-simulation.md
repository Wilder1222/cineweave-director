# Canon、连续性与世界推演

状态：`draft v0.1`
目的：让世界能够因角色选择而发展，同时防止 AI、社媒反馈或偶然生成画面静默改写正史。

## 1. 五层分离

| 层 | 回答的问题 | 可否直接修改上层 |
| --- | --- | --- |
| Canon | 世界中什么是真的、何时有效、由谁批准？ | 仅人工 Canon Gate |
| State | 角色、场景、派系和资源此刻是什么状态？ | 仅由批准事件或新版本改变 |
| Narrative | 谁基于哪些信息做选择，产生什么后果？ | 不可重写身份、规则或地理 |
| Representation | 这些事实以真人、动画、漫画或其他媒介如何表现？ | 不可改写 Canon/State |
| Production | 用什么配方、控制、证据、能力与权利来生产？ | 不可发明创意事实 |

一张图表现了“天空有两个月亮”并不使其成为 Canon；只有明确事实、来源、版本和批准记录才有该权力。

## 2. CanonFact

每条正史事实采用标量断言，而不是整段模糊摘要：

```yaml
canonFactId: canon.w01.shen-heng.knows-ledger
worldId: world.w01.linan
entityId: character.w01.shen-heng
factPath: knowledge.fathers_ledger
value: partial
validFrom: event.w01.s01.e02
validUntil: null
status: proposed        # proposed | active | superseded | conflicted | rejected
lock: soft             # hard | soft | free | undefined
sourceRefs:
  - story.event.w01.s01.e02.v1
approvalRef: null
notes: 她知道账册与父亲有关，但不知道完整用途
```

规则：

- 一个事实变化时新建有时间边界的记录，不覆盖历史。
- `undefined` 表示尚未决定，不等于否定。
- `conflicted` 表示存在有效矛盾，不能自动选择较新或更好看的版本。
- 没有批准记录的 `proposed` 事实不能被宣传为已锁正史。

## 3. WorldState

每个世界在时间 `t` 的状态：

```text
W(t) = {
  clock,
  resources,
  factionPower,
  publicTrust,
  informationExposure,
  ecologyOrInfrastructure,
  threatLevel,
  outstandingDebts,
  activePromises,
  unresolvedSetups
}
```

字段含义：

- `clock`：世界日历、季节、倒计时和事件顺序。
- `resources`：影响选择的稀缺物，而不是装饰性统计。
- `factionPower`：合法权、资金、信息、暴力、声望等分别记录。
- `publicTrust`：对不同派系或角色的信任，不用一个全城平均值概括。
- `informationExposure`：某项秘密被谁知道、证据强度和传播范围。
- `ecologyOrInfrastructure`：自然与城市系统的可用状态。
- `threatLevel`：已观察到的风险，不包含角色未知的全知判断。
- `outstandingDebts`：金钱、人情、道德、生态与承诺债务。
- `activePromises`：角色已经公开或私下作出的承诺。
- `unresolvedSetups`：已设置但尚未兑现/否定的伏笔。

## 4. ActorState

每个角色或派系只依据自己掌握的信息行动：

```yaml
actorId: faction.w02.gate-engineering-union
atTime: t-014
publicGoal: 在枯水期前稳定天门供给
privateGoal: 避免核心模型缺陷被公开
resources:
  - engineering_control
  - city_contracts
capabilities:
  - stabilize_gate_temporarily
limits:
  - cannot_measure_all_ecological_relations
knows:
  - short_term_transfer_success
  - partial_remote_damage
doesNotKnow:
  - full_migration_dependency
beliefs:
  - future_technology_can_repay_current_debt
redLines:
  - public_loss_of_gate_control
nextIntendedAction: expand_trial_window
```

禁止：

- 角色为了配合剧情知道未获得的信息；
- 派系在受损后不作符合利益的回应；
- 主角拥有作者视角的正确道德答案；
- 反派为了制造冲突做无收益、无信念的愚蠢行为。

## 5. EventCard

```yaml
eventId: event.w01.s01.e05.open-hidden-stock
worldId: world.w01.linan
preconditions:
  - incense_supply == scarce
  - shen_heng_knows_hidden_stock == true
actors:
  - character.w01.shen-heng
  - faction.w01.incense-trade
objective: 维持巷中基本药材供应
opposition: 开库存会暴露父亲旧路线
choice: 沈蘅公开使用隐秘库存
ruleRefs:
  - world.w01.rule.secret-needs-carrier
costs:
  - route_exposure_increases
  - shop_becomes_target
directChanges:
  resources.incense: scarce_to_temporary_relief
  informationExposure.old_route: low_to_medium
delayedConsequences:
  - incense_trade_investigates_shop
  - authorities_request_inventory
irreversibility: difficult_to_reverse
causesNext: 公开的产地与旧案账册形成可验证关联
canonStatus: candidate
```

每张 EventCard 必须有：前提、目标、对立、选择、规则、代价、直接变化、延迟后果、可逆性和 `causesNext`。

如果删除该事件不影响下一事件，它更可能是内容切片，而不是主线因果节拍。

## 6. 推演流程

```text
1. Codex 载入精确 Workspace、WorldCard、WorldState 与 ActorPolicy
2. 用受限 Condition DSL 验证触发器、时间、位置、知识、资源和预期版本
3. Codex 编写/维护 EventTemplateCatalog，由 World OS 从精确模板编译 EventProposal；未来 LLM API 也只能返回 proposal_only 候选
4. Codex 运行 World/Actor/Story/Continuity/Rights 领域审阅 pass
5. 确定性裁决器检查规则引用、能力边界、代价、Locks 和状态字段域
6. 普通可逆发展写入 simulation 分支的后继 StateSnapshot
7. 最后追加 EventCommit 作为该次分支事务的终结标记
8. 由 Commit 构建可重建 PlatformProjection 与 MCP Outbox
9. MCP 发布后，Codex 把返回值记录为不可变 PublishReceipt
10. 涉及候选事实、Hard Lock 或不可逆 Canon 的提案停止在人类 Gate
11. 人类批准精确版本后，Codex 才能用同一 GateDecision 恢复精确 simulation Proposal
12. 只有仍为 simulation 当前 head 的已批准 Commit，才能另行提升 CanonFact、Continuity 与正式发布投影
```

Codex 是唯一编排大脑和权威写入者。领域名称只是同一 Codex 内部的审阅 pass；MCP、平台和外部 LLM 没有状态写权限。`simulation.main` 可以由 Codex 继续推进，但始终是非正史分支；步骤 10–12 的 Canon 提升仍须人类批准。

在可执行 World OS 中，步骤 10–12 对应一条不可跳过的链：

```text
TransitionDecision(needs_human_gate)
  → GateRequest(proposal + BranchSet + simulation head + Canon head)
  → GateDecision(approve | reject | revise，最新版本有效)
  → resume(同一 Proposal、同一 State、同一 BranchSet)
  → EventCommit(approvalRefs 精确指向 GateDecision)
  → CanonFact + ContinuityLedger + CanonPromotion
```

`resume` 不接受新的自然语言 effect，也不把 GateDecision 直接当作 State 写入。`promote` 会再次检查 simulation head 与 GateRequest 中的 Canon head；任一 head 变化，旧批准即失效。重复 resume/promotion 只返回同一精确结果，不生成第二次效果。

运行期不可维护一个可被覆盖的 `current.json`。当前分支头由有效 `EventCommit` 链推导；后继状态在被终结 Commit 精确引用前只是孤立候选。这样即使中途失败，也不会把半次推演误当作完成事件。

每个 PlatformProjection 必须绑定生成时的精确 PlatformProfile；Outbox 只能为同一 Profile 哈希创建 Dispatch，避免跨平台、账号或工具串台。如果 Commit 已成为分支头而投影写入中断，Codex 通过 `reconcile` 从 Commit、Decision、Proposal 与 State 确定性补建投影，不重放事件行为。

## 7. 三分支协议

每轮推演最多保留三个有意义的分支：

- `baseline`：行动者按当前目标和资源作出最可能选择。
- `deterioration`：一项失败、误判或对手成功使状态恶化。
- `unexpected-opportunity`：新信息或关系提供机会，但仍有成本。

分支不得仅用“大获全胜/突然失败/神秘人出现”区分。每个分支都要说明：

- 哪个前提不同；
- 谁作出不同选择；
- 触发哪条既有规则；
- 哪些状态改变；
- 哪些事实保持不变；
- 未来必须偿还什么代价。

## 8. 人工 Canon Gate

候选事件进入正史前必须回答：

1. 是否符合已批准世界规则和能力边界？
2. 行动者是否只依据自己知道的信息？
3. 是否由人物选择而非作者便利推动？
4. 是否产生人物、关系、权力、信息、地理或承诺的真实变化？
5. 代价是否被记录，且没有被后续一句话抹除？
6. 是否与 CharacterSpec、SceneSpec 或现有事实冲突？
7. 是否涉及死亡、身份、文化、法律、权利或跨世界不可逆升级？
8. 需要哪些人工负责人批准？

Gate 输出：`approve exact version`、`revise`、`reject` 或 `hold undefined`；v0.3 本地合约把可持久化决定收敛为 `approve | revise | reject`，`hold undefined` 继续停留在未创建决定的队列中。

## 9. ContinuityLedger

连续性账本追踪的不是“所有东西保持一样”，而是所有改变都有原因和时间：

| 域 | 示例 |
| --- | --- |
| 知识 | 谁知道《百香谱》与旧案有关，知道到什么程度 |
| 关系 | 沈蘅与顾行舟从隐瞒到合作的有效区间 |
| 身体 | 伤势、疲劳、惯用侧和恢复时间 |
| 物件 | 名单、香谱页、工具和武器的所有者与位置 |
| 地理 | 角色所在区域、旅行时间、门窗期和可达路径 |
| 承诺 | 谁答应保护谁、何时失效或被违背 |
| 伏笔 | setup、已知解释、payoff 状态与剩余冲突 |
| 世界状态 | 货价、供给、门稳定度、生态债和公众信任 |

### 冲突记录

```yaml
conflictId: conflict.w01.fathers-role
activeClaims:
  - canon.w01.father.was-investigator.v1
  - canon.w01.father.was-protector.v2
severity: high
status: unresolved
impact:
  - shen_heng_motivation
  - season_mystery
resolutionOwner: world-canon-owner
allowedInProduction: false
```

不得因某项是“最新版本”就自动获胜。只有明确决定、来源和新版本能解决冲突。

v0.3 的本地实现把冲突保留为 `ContinuityLedger.conflicts`，相应 `CanonFact.status` 为 `conflicted`，并固定 `allowedInProduction=false`；它不会因为时间更新、评分或传播热度自动选边。

## 10. 单世界推演示例：W01 香材扣押

### 初始状态

- 部分香材延迟，鹤鸣巷尚未严重缺货；
- 沈蘅知道父亲有隐秘库存，不知道库存路线涉及旧案；
- 官府正在追查雨夜受伤者；
- 香行担心账册暴露价格与路线问题。

### 压力事件

官府以查验为由扣押沈家香铺的进口香材。

### 行动者候选

- 沈蘅：交出账册换回货物；借人情维持供应；开启隐秘库存。
- 顾行舟：暗中取回货物；保护沈蘅不介入；联系旧路线。
- 香行：与官府合作切割；抬价；收购香铺。
- 官府：扩大搜查；提出交易；查找旧库存来源。

### 分支

`baseline`：沈蘅开启库存帮助居民。短缺暂缓，旧路线暴露度上升，下一事件由香行与官府调查产地引发。

`deterioration`：顾行舟暗取货物造成伤人或证据丢失。供应恢复但官府压力、顾的暴露和居民分裂同时上升。

`unexpected-opportunity`：周满娘组织巷内公开账目与互助，使官府难以单独压迫香铺；代价是更多居民成为公开证人，旧沉默协议破裂。

三者都不是自动正史。Canon Owner 应选择最能检验沈蘅主题选择、且可在现有角色/场景能力内制作的分支。

## 11. 单世界推演示例：W02 稳定试验

### 初始状态

- 边城资源下降；
- 工程团队相信短期稳定安全；
- 生态研究者观察到远端物种异常；
- 主角持有不完整的零号门记录。

### 候选结算

稳定门一小时：城市资源上升、公众信任工程团队上升；远端温度/水系和迁徙受到轻微但可测影响，生态债从未知变成低度证据。

关键不在“门是否成功”，而在谁拥有数据、谁承担远端损害、主角何时选择公开。后续事件必须结算这笔债，不能让新技术把它无痕清除。

## 12. 跨世界与组合推演

第一阶段世界之间没有共享物理因果。组合层只管理资源与品牌信号：

```text
PortfolioState = {
  worldCapacity,
  assetReuse,
  qualityStability,
  audienceUnderstanding,
  rightsReadiness,
  productionCost,
  incubationEvidence
}
```

示例：W01 连续性合格但发布产能不足，W02 风格测试反响强。

正确决策：保持 W02 为孵化状态，优先修复 W01 生产瓶颈；观众反响进入投资信号。

错误决策：为了热度立即让“天门”出现在鹤鸣巷并成为 W01 正史。

只有 Meta Bible 的 L3 Gate 通过后，跨世界 EventCard 才能引用多个 WorldState；在此之前，跨世界内容只能标记为 `promotional non-canon` 或 `unresolved signal`。

## 13. 社媒反馈入口

| 类型 | 可影响 | 不可直接影响 |
| --- | --- | --- |
| signal | 表达是否清楚、观众记住什么 | 正史事实 |
| preference | 合法候选风格、角色方向或栏目权重 | 已锁身份与世界规则 |
| idea | 候选人物、地点、物件与事件 | 自动立项或 Canon |
| canon request | 进入人工审议队列 | 关系、死亡、配对、跨世界因果 |

评论数量不是证据质量。所有反馈保留来源时间和适用范围，避免把短期平台偏好误认为长期世界需求。

## 14. 推演停止条件

出现以下任一情况时停止并转人工审阅：

- 必需世界规则仍为 `undefined`；
- 候选需要未批准的角色能力、地理或跨世界连接；
- 权利、文化或现实安全问题无法由创意推演解决；
- ActorState 的知识或资源无法确定；
- 连续性冲突会改变首季答案；
- 三个分支都只能依靠巧合或新增设定成立；
- 推演结果会自动锁死仍需用户选择的人物身份或风格。

停止不是阻塞整个项目；可以改做低风险世界切片、研究或补充证据。

## 15. 推演输出检查

- [ ] 使用精确世界与实体版本。
- [ ] 没有角色使用全知信息。
- [ ] 规则、成本、例外与责任人明确。
- [ ] 每项状态差量有直接原因。
- [ ] 延迟后果进入队列并有触发条件。
- [ ] 不可逆变化有人工 Gate。
- [ ] 分支没有被误写成已发生事实。
- [ ] 冲突可见而非静默覆盖。
- [ ] Representation 与 Production 没有反向创造 Canon。
- [ ] 社媒反馈保持在候选或信号层。
