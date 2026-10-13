# CineWeave 拆分与编排：开放标准及 Anthropic 官方证据

读取日期：2026-10-12。研究范围：Agent Skills 开放规范、官方客户端集成与作者指南，以及 Anthropic 官方技能/代理工程实践。所有下列来源已搜索并实际打开；只写本临时研究文件，未修改 CineWeave 仓库，未执行供应商。这里提供拆分依据；最终包边界需与父任务当前仓库审计对齐。

标记：**规范事实**表示开放格式要求；**官方建议**表示作者或客户端工程建议；**Claude 专属**表示 Anthropic 产品运行时机制；**CineWeave 推断**表示本研究建议，不能当成来源已验证的本项目效果。

## 10 条可用于计划的证据

### E1. 技能是知识/程序目录包，代理是执行控制角色

**规范事实**：最小技能目录包含 YAML frontmatter 加 Markdown 的 `SKILL.md`；必需项为 `name`、`description`，可捆绑脚本、参考文档和资产。资源以技能根目录为基准使用相对路径；建议避免深层引用链。规范没有必需的跨技能依赖声明。

**官方建议**：Anthropic 将 skills 作为可组合的专业知识资源；其 agent 定义强调模型自主控制流程和工具使用。由此不能把“拆一个技能”直接等同于“启动一个子代理”。[Agent Skills specification](https://agentskills.io/specification)、[Equipping agents with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)。

**CineWeave 推断**：分别设计安装包和编排角色。独立包应单独复制到临时技能目录后仍能完成核心任务；通过构建生成包内资源副本或发布版本化公共资源，避免默认依赖兄弟包、仓库工作目录和绝对 Windows 路径。“单包可用”是拟增加的验收，不是规范自带保证。

### E2. 渐进加载减少正文开销，拆包仍有目录成本

**官方建议**：客户端集成采用三层：目录元数据、激活后的正文、按需资源；元数据约 50–100 tokens/技能，正文建议少于 5,000 tokens。发现位置由客户端决定，`.agents/skills/` 是共享惯例而非格式强制安装位置；相对资源路径从技能根目录解析。[Client integration](https://agentskills.io/client-implementation/adding-skills-support)。

**CineWeave 推断**：管理入口只保留路由、全局硬约束和交接规则。写清“何时读取某参考”，不要激活时全读。新增 10 个包约增加 500–1,000 tokens 元数据量，这仅是按文档估算，不能当实际 Codex 消耗；用当前宿主实测全文和元数据 token 成本。行数与 token 预算是加载优化建议，不能单独证明需要多少独立技能。

### E3. description 需要测触发，也要测相邻任务误触发

**官方建议**：描述应围绕用户意图；不足会漏触发、过宽会误触发。指南建议约 20 个查询，正负各 8–10 个，负例优先有相近关键词的 near-miss；每项可先跑 3 次，固定训练/验证划分约 60/40。[Optimizing descriptions](https://agentskills.io/skill-creation/optimizing-descriptions)。

**官方建议差异**：该指南偏向 imperative “Use this skill when…”；Anthropic 作者指南偏向第三人称。这是不同作者建议，不是开放规范冲突。[Anthropic skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)。

**CineWeave 推断**：每个候选技能用“产物 + 触发意图 + 边界”描述。负例必须覆盖相邻工种，例如只修改镜头动作、只换媒介、只投影模型提示词、只审查现有媒体；不要用天气等无关查询充数。以实际 Codex 日志中是否读入 `SKILL.md` 检测激活，不能照搬 Claude 的 `Skill` 工具调用检测脚本。

### E4. 拆分单位应是一项连贯工作，不是每个概念/文档

**官方建议**：技能应封装可与其他技能组合的 coherent unit of work；过细会使一项任务加载多个技能、增加开销和指令冲突，过宽会难以精确激活。优先保留项目专属程序、真实失败和输入输出形式，删减模型已掌握的基础知识。[Creator best practices](https://agentskills.io/skill-creation/best-practices)。

**CineWeave 推断**：候选边界应同时通过三问：用户会单独请求吗？有明确且完整的输入输出吗？在缺少其他包时能完成吗？契约、角色专业知识、模型投影和质检规则未必各成一个技能；可先做一个任务包内按需参考。技术字段归属不是用户触发边界的替代物。

### E5. 创作自由与机械验证的控制程度应不同

**官方建议**：Anthropic 作者指南按任务脆弱性选择控制程度；可接受多种方法时用启发式，高一致性/固定顺序任务用具体脚本。建议在所有计划支持的模型上测试。[Anthropic skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)。

**CineWeave 推断**：人物、叙事和镜头选择保留创作判断；契约语义、时序、上游身份/hash、来源和路径闭包用确定性脚本检查。细化动作的因果链与已有权威语义不能为了缩短入口删掉；它们可移到明确条件加载的专业参考。模型能给出的“看起来通过”不替代脚本结果，也不替代实际媒体验收。

### E6. 脚本接口是编排契约的一部分

**官方建议**：脚本应清楚声明依赖/版本和使用方式，提供简洁 `--help`、有用错误、结构化输出；数据写 stdout，诊断写 stderr。考虑幂等、意义明确的退出码、可控输出规模与适合风险的 dry-run。[Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)。

**CineWeave 推断**：复用既有 validator/checker，统一文档中的可读/可执行意图。包内执行要明确技能路径与工件路径，不能假定宿主已切换 cwd。脚本返回应足以让管理者判定状态和下一步，避免输出整份工件。引用 npm/npx 例子并不要求迁移现有 Node 工具链；优先保持现有可复现运行方式。

### E7. 路由、串行、并行和评审是可组合模式

**官方建议**：Anthropic 区分预设代码路径的 workflow 与动态控制的 agent。固定依赖步骤适合 chaining 并设检查门；独立任务适合 sectioning 并行；动态任务拆解适合 orchestrator-workers；标准清楚且反馈有收益时适合 evaluator-optimizer。先选最简单有效方案，增加复杂度应有测量支持。[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)。

**CineWeave 推断**：管理者负责选择路线、建立权威输入快照、确定依赖、验收和汇总。依赖链串行交接，例如已锁定创作意图 → 权威状态 → 镜头/时间 → 模型投影 → 生产计划；独立来源研究、同一已冻结工件的不同评审维度可并行。生成者与评审者分角色；最多按预算修订若干次，不让“专家讨论”无限循环。一个技能允许主代理内联完成，无需强制子代理。

### E8. 多代理收益有场景和成本前提

**Anthropic 实测，非通用倍率**：其 Research 系统采用 lead/worker；高并行、超单上下文的信息任务适用，共享大量上下文或强依赖任务适配较差。文章报告其数据中 agent 约为 chat 的 4× tokens，multi-agent 约 15×，这些不是 CineWeave 预测。委派需要目标、输出形式、来源/工具指导和明确边界。[Multi-agent research engineering](https://www.anthropic.com/engineering/multi-agent-research-system)。

**CineWeave 推断**：单镜头修改、已有契约局部修订、必须共享连续状态的连续创作，优先单代理或串行调用。并行子任务读取冻结输入，返回局部建议和证据；只有管理者写回权威状态。委派记录可包含目标、输入版本、允许变动范围、输出位置、停止条件及预算，这是项目交接模板建议，不是标准 frontmatter。

### E9. 触发、内容质量、工程通过和媒体效果应分开验收

**官方建议**：Agent Skills 的内容评估从 2–3 个真实案例起步，在干净上下文比较 with-skill 与 baseline/旧版，保存实际产物、具体断言、时间/token、执行轨迹，并人工查看结果。[Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills)。

**Anthropic 官方建议**：同时看 transcript 与最终环境 outcome；代码、模型和人工 grader 各有职责。pass@k 表示 k 次至少一次成功，pass^k 表示 k 次都成功；后者更能暴露一致性问题。[Demystifying agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)。

**CineWeave 推断**：先冻结当前单入口作为 baseline，比较“内联调用专业包”与“管理者 + 子代理”两种编排。至少评单任务、跨任务交接、近似负例、缺失/过期输入、独立场景污染及修改影响传播。分别记录路由准确性、约束保持、契约闭合、产物可用性、质量盲评、时延和总 token。真实 image/video/audio 另设人工验收；本次研究不会产生那一层证据。

### E10. 开放规范不能替宿主兑现运行时能力

**规范事实**：`allowed-tools` 在开放规范中是 experimental，支持随实现变化。[Agent Skills specification](https://agentskills.io/specification)。

**官方客户端建议**：subagent delegation 明确属于 optional advanced pattern，只有部分客户端支持。[Client integration](https://agentskills.io/client-implementation/adding-skills-support)。

**Claude 专属**：Claude Code 的 `context: fork`、`agent`、hooks、调用控制、动态 shell 注入是扩展；自定义 subagent 的 `tools`、`model`、`skills` 等字段属于 Claude Code agent 配置。[Claude Code skills](https://code.claude.com/docs/en/skills#using-skill-frontmatter-outside-claude-code)、[Claude Code subagents](https://code.claude.com/docs/en/sub-agents)。

**CineWeave 推断**：可移植包优先用规范字段和普通 Markdown 路由/交接说明；Codex 的代理启动与能力限制通过实际可用宿主接口实现。不要宣称写入 Claude 字段即可获得 Codex 编排、权限或 hooks。若将来做 Claude 适配，放在可选择的宿主适配层，分开验证。

## 建议交给父任务的决策门

1. 先选 2–3 个可独立请求、权威输入明确的完整工作单元做试点；候选数量由本地职责与触发审计决定。
2. 每个试点先通过独立安装、相对资源闭包、脚本可运行和契约输出检查，再评触发与内容质量。
3. 保留当前版本作 baseline；先测主代理内联专业包，再测管理者委派，避免把拆包收益和多代理收益混为一个变量。
4. 仅把无互相依赖、可冻结输入的任务并行；管理者持有唯一权威写回点，评审只返回问题与修订建议。
5. 升级为默认架构前必须有实际比较证据：更准确路由/更少违规/更高可用性，以及可接受的时延和 token 成本。建议至少重复 3 次；这只是试点起点，不能支持统计显著性或真实媒体质量结论。

本备忘录未浏览第三方博客，不采用任何供应商执行接口；来源发布日期和当前文档行为应与读取日期区分。历史项目记忆只用于提醒父任务保留来源、权威流向与证据等级，当前仓库实现由父任务实地核验。
