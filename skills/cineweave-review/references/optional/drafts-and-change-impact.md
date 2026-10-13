# 可选参考：草稿与变更影响

在需要保留未决事项的工作稿 JSON、多轮修订或项目恢复时加载。这些工作表是可编辑创作文档，不是根契约、自动项目存储或运行时。

## 工作草稿

原创提案不等于对现有资产作出无证据断言。用户要求原创设计时，可以补充设计；证据、权利和能力的未知项仍保持未知。允许将暂定假设传递到下游草稿，但不能称其已经批准。

规范元数据尚不齐全时，返回人类可读内容，或明确标记为非规范的 JSON：

```json
{
  "format": "cineweave-working-draft",
  "canonical": false,
  "maturity": "draft",
  "workingId": "character.courier",
  "intendedContract": "CharacterSpec",
  "revision": 1,
  "assumptions": ["为本故事提出一名原创虚构成年信使"],
  "delegatedDecisions": ["开发人物与三个镜头的草稿"],
  "reservedDecisions": ["人物身份的最终选择"],
  "workingRefs": [{"workingId": "world.station", "revision": 1, "resolution": "provisional"}],
  "unresolved": ["尚未提供安装回执"],
  "content": {"silhouette": "身形紧凑，站姿挺拔", "wardrobe": "红色外套"}
}
```

工作 ID 是自行编写的局部标签，不是精确资产注册表别名。严格规范字段中不能填占位哈希、`null` 或虚构回执。本格式只是工作表约定，不会被根契约验证器接受，也不能授权最终交接。

只有上游必要选择已解决，才进行规范化提升：选择已有根 schema，把内容映射到真实字段，取得真实来源和安装元数据，校验文档，再使用可用本地工具计算哈希。缺少回执阻止规范化提升，不阻止有用的草拟。沿用输入中指定的哈希算法；未指定时，先明确交换约定。开发验证器的可选修复注册表使用 JCS UTF-8 的 SHA-256，分发索引使用原始文件字节；二者不能混用。

## 修订工作表与恢复检查点

为相关产物记录工作 ID 或精确引用、成熟度、所属路由、实际消费的输入字段、修订号、真实保存位置，以及有效性（`valid`、`stale`、`needs_review`、`unresolved`）。这些标签属于工作表，不是新增契约状态。

每次变更记录来源修订及变化字段／值、原因与用户授权或暂定假设、直接受影响产物及其消费关系、传递影响与所需重编译／复核、未受影响产物，以及字段依赖不完整造成的未知影响。

保守传播影响：直接消费者标为过期，检查后代后才能恢复有效；依赖覆盖未知则标为待审。新上游版本不回写已经哈希化的父版本，最终产物不能消费过期权威来源。只重编译受影响部分，记录新精确引用，并完成相关检查后再恢复有效状态。

暂停时留下当前目标、产物索引、锁定决定及来源、暂定假设、未完成变更、被阻断用途和下一步。恢复时先读取用户提供的检查点并解决来源冲突，不自行选择“最新版本”，也不声称未保存文件已经存在。

## 变更影响示例

信使外套由红变蓝，修改的是外观状态，而不是身份。不显示外套的纯面部特写不一定需要重新生成；显示外套的镜头、提示词适配稿及依赖它们的评审应标为过期或待审。未消费衣色的故事因果、场景拓扑及声音提示保持有效。如果红色本身是故事线索，先提出冲突，不能把它当作纯外观修改。

## 只读变更影响查询

随包工具 [`check-change-impact.mjs`](../../scripts/check-change-impact.mjs) 接受下面的非规范工作表。不新增根契约、不替代精确来源校验，也不写入项目存储。普通单条提示词无需建立依赖图。

```json
{
  "format": "cineweave-change-impact",
  "canonical": false,
  "artifacts": [
    { "id": "appearance.courier", "revision": 1, "dependencyCoverage": "complete" },
    { "id": "shot.coat", "revision": 1, "dependencyCoverage": "complete" },
    { "id": "shot.face", "revision": 1, "dependencyCoverage": "complete" },
    { "id": "prompt.coat", "revision": 1, "dependencyCoverage": "complete" },
    { "id": "audio.ambience", "revision": 1, "dependencyCoverage": "complete" }
  ],
  "dependencies": [
    { "consumer": "shot.coat", "source": "appearance.courier", "sourceRevision": 1, "paths": ["/wardrobe/color"] },
    { "consumer": "shot.face", "source": "appearance.courier", "sourceRevision": 1, "paths": ["/face"] },
    { "consumer": "prompt.coat", "source": "shot.coat", "sourceRevision": 1, "paths": ["/promptHandoff"] }
  ],
  "changes": [
    { "source": "appearance.courier", "fromRevision": 1, "toRevision": 2, "paths": ["/wardrobe/color"], "reason": "用户将外套改为蓝色" }
  ]
}
```

将输入保存为 `impact.json` 后运行：

```powershell
node skills/cineweave-director/scripts/check-change-impact.mjs impact.json
node --test tests/change-impact.test.mjs
```

安装后的工具也可独立运行：`node <skill目录>/scripts/check-change-impact.mjs impact.json`。CLI 的结果和读取／语法错误均以 JSON 写到 stdout；不写文件、不联网、不批准产物、不发起重生成。退出码 `0` 表示输入有效且没有待审依赖，`1` 表示输入非法，`2` 表示输入有效但依赖范围仍需复核。`--help` 也返回 JSON。

导出函数 `checkChangeImpact(worksheet)` 返回 `{valid, affected, unaffected, needsReview, errors, scope:"plan_only"}`，前三个影响数组使用工作表中的产物 ID，顺序沿用 `artifacts`。上例的核心结果为：

```json
{
  "valid": true,
  "changedSources": ["appearance.courier"],
  "affected": ["shot.coat", "prompt.coat"],
  "unaffected": ["shot.face", "audio.ambience"],
  "needsReview": [],
  "errors": [],
  "scope": "plan_only",
  "sourceAuthorityVerified": false,
  "measurementVerified": false
}
```

`changedSources` 单独报告发生声明变更的来源，避免把来源误列为未受影响。`affected` 表示已声明过期或发现直接／传递影响的产物；`needsReview` 表示依赖覆盖或有效性仍未解决，同一产物可以同时出现在两个数组中。`unaffected` 仅表示本工作表声明的关系中没有发现影响；范围外产物、漏报边和领域因果均不在保证范围内。

输入规则：

- `artifacts` 明确本次查询范围，ID 唯一且逐字匹配；`revision` 是正安全整数。ID 只是工作标签，不能当作根契约的精确引用、内容哈希或已注册别名。可选 `validity` 仅接受 `valid / stale / needs_review / unresolved`。
- 每条依赖的来源与消费者都须存在；`sourceRevision` 必须等于声明来源的旧修订。每个来源／消费者只写一条边，把消费字段合并到 `paths`，全图须无循环。
- 变更的 `fromRevision` 必须等于来源旧修订，`toRevision` 通常必须更大。同一来源的不同字段可以拆成多条变更，但必须使用相同的修订对；拒绝重复记录、矛盾证据和不兼容修订。未知字段会报错，不能靠被忽略的额外字段收窄影响。
- `paths` 是非空 RFC 6901 JSON Pointer 数组；`[""]` 明确表示整份文档，不能以空数组代替。工具先解码 `~0` 与 `~1`，再比较 token 的祖先／后代关系，因而 `/face` 不匹配 `/faceColor`，`/a~1b` 也不等同于 `/a/b`。指针语法检查不证明实际正文存在该字段。
- 直接消费者的字段与变化路径相交时标为受影响，之后保守传播到全部声明后代。此版本没有输出字段映射，不能因后代的消费路径不同而跳过传递影响。显式 `stale` 的祖先即使没有新变更也必须传播。
- 查询范围内所有 `dependencyCoverage: partial / unknown` 的产物均进入 `needsReview`，包括图中没有可达边的孤立产物；其声明后代也需复核。`needs_review / unresolved` 同样保留并传播待审，不能被 `complete` 或一次查询自动清除。`complete` 本身仍是调用方声明。

可选 `before` 和 `after` 是调用方为同一变化范围提供的 JSON 值。只有两者都显式存在且内容相等，工具才报告 `noOpChanges` 和 `changeEvidence.status: "no_op"`；对象成员顺序不影响相等判断，数组顺序影响判断。这是声明值比较，复用 JSON 语义而不复制规范哈希实现。缺一项、只写路径或只写 `null` 不能证明无变化：它们仍按声明变更传播，`changeEvidence.status` 为 `declared_change`。两项均提供且不相等时是 `supplied_difference`，仍未核验真实来源或测量。

显式 no-op 可以保持 `toRevision === fromRevision`。即使输入提出更大修订，工具也只报告 no-op，不虚增版本、不修改上游状态。需要真正修订时，由调用方确认真实 diff 和授权，创建新不可变版本，选择性重编译受影响产物并完成相关复核。`reason` 应记录用户授权、已委托决定或暂定假设的准确范围；填写它不会自动取得批准，也不会把观察或推断提升为用户事实。

## 从返回结果提炼经验

用户要求复盘或维护时，记录结论、适用任务条件、实际可得的来源／候选版本、观察区间、变更变量、反例、置信度和复核日期。观察与原因解释分开；没有原始输出的结果只能标为声明，不能标为已观察。

按含义归档：用户选择的审美成为有范围的项目决定；模型／版本行为成为带日期的能力说明；可复用创作方法保留为包含失败信号和例外的条件性经验。用户偏好不能证明模型效果，同一镜头的重复随机候选也不构成普遍规律的独立证据。组合修改不能将效果归因于某个词或参数。

本节独立参考 [Leos 知识来源](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/knowledge-and-provenance.md)与[连续性及学习](https://github.com/MasterLeos/leos-six-department-directing-team-skill-v1/blob/2ed50edb3c7838fc9ffb68e50824e0ebff59c7d4/references/continuity-and-learning.md)，不引入自动存储、固定样本数证明门槛或新契约。保留被否定解释的追溯；仅在明确维护请求范围内修改 Skill 或持久记忆。

## 校验范围

根 schema 校验通过只说明交换结构正确。修复计划语义检查还会拒绝矛盾关卡和非法目标指针。提供精确引用／文档注册表后，开发验证器可以检查内容哈希、来源发现的归属和目标路径存在性。缺失绑定和媒体层面的保证仍为未核验。调用方提供的注册表是声明的身份依据；字节匹配不能证明权利、实际成功或其他维度得到保留。
