# 多世界 AIGC 内容工作室方案

这是一套面向长期 IP 运营的多世界工作室设计，而不是单一世界设定或提示词合集。方案以“一个主世界稳定生产、一个世界受控孵化、多个候选世界低成本探索”为启动策略。

当前状态：`design package v0.1 / draft for human approval`

## 设计目标

- 建立可反复孵化独立世界的母品牌与 World OS。
- 让世界观、故事因果、角色身份、场景地理、视觉表现和生成执行分层管理。
- 让每项媒体资产绑定精确正史、状态、版本、权利和审核记录。
- 让 AI 提供候选、推演和检查，但不自动写入 Canon。
- 在 90 天内验证 W01 的连续生产与 W02 的受控孵化。

## 文档导航

1. [母品牌圣经](00-meta-bible.md)
2. [世界组合与立项矩阵](01-world-portfolio.md)
3. [W01《临安春信》World Bible](02-w01-linan-chunxin.md)
4. [W02《山海／天门》World Bible](03-w02-shanhai-tianmen.md)
5. [可复制世界设计模板](04-world-template.md)
6. [Canon、连续性与世界推演](05-canon-and-simulation.md)
7. [资产与生产系统](06-asset-production-system.md)
8. [工作室运营模型](07-studio-operations.md)
9. [90 天路线与 KPI](08-roadmap-and-kpis.md)
10. [方案完成与交付检查表](09-completion-checklist.md)
11. [Codex World OS 可执行控制平面](10-codex-world-os.md)

## 权威层级

```text
00 Meta Bible
    ↓
01 World Portfolio
    ↓
02/03 World Bible
    ↓
04 Template + 05 Canon/Simulation
    ↓
06 Production + 07 Operations + 10 Codex World OS
    ↓
08 Roadmap + 09 Completion Audit
```

若文档发生冲突，优先级为：明确的人类批准记录 > 精确世界正史版本 > 本目录通用规范 > 创意候选和社媒反馈。

## 当前决策

- 母品牌工作名：`万象织境 / World Matrix`，名称为 `soft`，可更换。
- 母题：人在巨大秩序与具体生活之间，决定什么值得留下。
- 连接方式：第一阶段采用软连接，不设角色穿越或共享因果历史。
- W01《临安春信》：唯一主生产世界。
- W02《山海／天门》：受控孵化世界。
- W03《雾城失物局》、W04《潮生星港》：候选卡，不进入重资产生产。
- 历史、文化、角色身份、视觉方向和权利均需后续人审；本包不声称媒体已生成或世界已锁定。

## 使用方式

1. 由 Canon Owner 审阅 `00` 与 `01`，决定母品牌名、母题和连接上限。
2. 审阅 `02` 与 `03`，把未决项保留为 `undefined`，不要为了完整感自动补写。
3. 使用 `04` 创建新世界，不复制 W01/W02 的表面审美。
4. 用 `05` 运行推演；只有人工批准分支才能成为正史事件。
5. 按 `06`–`08` 进入生产；每个外部媒体输出仍需独立权利、能力和质量门。
6. 使用 `09` 做设计完成审计，不把“方案完整”误报为“制作完成”。
7. 使用 `npm run worlds:review` 审阅机器工作区；由 Codex 运行提案、状态提交与 MCP Outbox，不允许平台或外部模型直写世界状态。

## 本包不包含

- 已批准的人物定妆或真人肖像权利。
- 已锁定的 CharacterSpec、SceneSpec 或 StylePackage。
- 已执行的媒体模型任务或真实外部 MCP/LLM 调用；本仓库只包含本地推演与发布收据夹具。
- 已发布账号、媒体效果或商业收入承诺。
- 真实历史研究结论；W01 当前是历史启发的架空解释方向。

这些内容属于下一阶段的人审、研究、生产和运营证据。
