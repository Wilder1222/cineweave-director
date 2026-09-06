# 可选：草稿与变更影响

用于未解决的工作 JSON、多轮修订或项目恢复时加载。这些工作表是可编辑的创作文件，而非根契约、自动项目存储或运行时。

## 工作草稿

原创提案不是关于现有资产的无支持主张。按请求创建缺失的原创设计；将未知的证据、权利和能力保持为未知。将暂定假设带入下游草稿，但不得称其已获批准。

当规范元数据不可用时，返回人类可读的工作成果或明确标为非规范的 JSON：

```json
{
  "format": "cineweave-working-draft",
  "canonical": false,
  "maturity": "draft",
  "workingId": "character.courier",
  "intendedContract": "CharacterSpec",
  "revision": 1,
  "assumptions": ["Original fictional adult courier proposed for this story"],
  "delegatedDecisions": ["Develop character and three-shot draft"],
  "reservedDecisions": ["Final identity selection"],
  "workingRefs": [{"workingId": "world.station", "revision": 1, "resolution": "provisional"}],
  "unresolved": ["No installation receipt supplied"],
  "content": {"silhouette": "compact build, upright posture", "wardrobe": "red coat"}
}
```

工作 ID 是作者定义的本地标签，而不是精确注册表别名。绝不将占位哈希、null 或合成回执放入严格规范字段。该格式是工作表约定；根契约验证器不接受它，且它不能授权最终交接。

仅在所需上游选择已解决后再提升：选择现有根 schema，将内容映射到其实际字段，取得真实的来源/安装元数据，验证文件，并使用可用的本地工具计算哈希。缺少回执会阻止规范提升，而非有用的创作草拟。保留已提供的哈希算法；若未指定，请在交换前确定约定。开发验证器的可选修复注册表使用 JCS UTF-8 的 SHA-256；分发索引使用原始文件字节。不得以一个替代另一个。

## 修订工作表与检查点

对每个相关工件，记录工作 ID 或精确引用、成熟度、所有者路由、已消费的输入字段、修订版本、实际保存的位置以及有效性（`valid`、`stale`、`needs_review`、`unresolved`）。这些标签属于工作表，而非现有契约状态枚举。

将每项变更记录为：

- 源修订版本和变更的字段/值；
- 原因以及用户授权或暂定假设；
- 直接受影响的工件以及该字段被消费的原因；
- 传递依赖项、所需重新编译/审查和未受影响的工件；
- 当字段级依赖关系不可用时的未解决影响。

保守地传播：直接消费者变为 stale；在将后代标为 valid 前先检查它们。未知的依赖覆盖范围变为 needs_review。新的上游版本绝不重写已有哈希的父项。最终输出不得消费 stale 权限。只重新编译受影响的切片，然后记录新的精确引用，并在恢复有效性前执行相关检查。

暂停时，应包含当前请求的结果、工件索引、锁定决策及其来源、暂定假设、未完成变更、被阻止的用途和下一项可执行步骤。恢复时，阅读已提供的检查点，并在继续前解决冲突来源；绝不推断最新版本或声称未保存文件存在。

## 影响示例

将快递员的外套从红色改为蓝色，会改变 AppearanceState，而不是身份。未显示外套的仅面部特写无需重新生成。显示外套的镜头、其提示词投影和依赖的审查对比会变为 stale 或需要审查。如果不消费外套颜色，故事因果、场景拓扑和无关的声音提示仍然有效。若某个故事线索依赖红色，请在将其视作仅外观变更前指出该冲突。

## 验证范围

根 schema 有效性证明线缆结构。修复计划的语义检查还会拒绝不一致的门控和格式错误的目标指针。若提供精确引用/文件注册表，开发验证器会检查内容哈希、来源发现的所有权和目标路径存在性。缺失的绑定和媒体级保证仍明确未经验证。注册表绑定是调用方提供的权限；字节匹配并不能证明权利、已观察到的成功或已通过维度的保持。
