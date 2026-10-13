# CineWeave 拆分 P1 独立阶段 review · 2026-10-12

## 结论

P1 当前实现通过独立代码审查，未发现阻止开始 P2 的未修复缺陷。真实生产仍只启用 `cineweave-director`；本结论不把临时 P2/P4 fixture 计为生产启用、专业入口行为验收或安装发现成功。

首次发现两项非阻断提醒，实施方在本阶段修正，本review已独立复核关闭：安装 smoke 现按真实 enabled Skills 自动展开全插件/standalone两布局；CI改为20分钟，精确模板同步且权限不变。原提醒及关闭证据均保留在下文。本评审开始时完整测试仍运行，报告完成前已读取结束日志：`npm test` 500/500 通过，0 失败、取消、跳过，571,419.7441 ms。未将运行中的结果提前记为通过。随后只对矩阵/预算修改做短检查，未重复长全套。

## 范围、来源及独立性

审查依据为 `D:/Temp/cineweave-split-p1-design-20261012.md` 和 `tests/evaluations/cineweave-skill-split-orchestration-plan-2026-10-12.md` 的 P1 范围。审查文件为 `skill-catalog.json`、`scripts/skill-catalog.mjs`、`scripts/sync-skill-exports.mjs`、`scripts/validate-repository.mjs`、`scripts/build-plugin-bundle.mjs`、`tests/skill-catalog.test.mjs`、`tests/skill-bundles.test.mjs`、`tests/bundle-smoke.test.mjs`、`package.json`，以及 `skills/cineweave-director/references/core/operating-model.md` 新增交接。

归因采用 P0 的完整恢复源码 `D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored`，不使用较早 Git HEAD 替代实施前源码。当前工作树存在早于 P1 的重构、精简和评测变更；它们没有被归为本阶段新增。独立 reviewer 未修改产品或真实 catalog，仅写此临时报告；没有读取 case rubric、执行创作案例、安装、提交、推送、供应商执行或媒体生成。另一个只读子 reviewer 专门复核新增 handoff 正文，结论与本 review 一致。

历史记忆只提醒非执行与证据层级，当前边界均重新对照源码、P0 和实际日志验证。

## 核对结果

| 检查面 | 当前证据与结论 |
| --- | --- |
| 当前身份和归属 | `skill-catalog.json` 明确四个身份，只有 director 为 true。catalog 使用严格 JSON，恰好字段/身份检查、boolean、导演必启用、reference/review 前置启用约束均保留。`validateSkillCatalog` 对 52 kinds、12 routes、index domain、canonical namespace 及唯一领域 owner 交叉核对。target owners 为 43/1/4/4；actual owners 当前为 director 52，未维护第二份当前 owner 表。 |
| 目录及白名单 | `validateSourceStructure` 继续采用显式 `SOURCE_TOP_LEVEL` 与逐目录精确 inventory；P1 只增加 catalog、reviewed 开发脚本/测试和阶段证据登记。`skills/` 必须准确对应实际 enabled 集合；authoring preflight 仅允许该集合的可缺派生目录，以支持先 sync。`skill-sources/` 仅允许已启用非 director 作者源且每源精确两文件。未知、inactive、符号链接/junction、额外空目录均被拒绝。实际磁盘只有 director，`skill-sources/` 不存在。 |
| 派生映射 | `createSkillExportPlan` 的固定完整 profile 保留 159 文件/Skill：入口与 agent、三份 manifests、42 references、54 schemas、52 examples、6 helpers。子入口/agent 来源为 `skill-sources/<name>`，所有共享资源始终来源 canonical director；不会从派生 child 二次传播。`files` 表示 destination，`sourceFiles` 单独去重，`exports` 保留一源多目的地。目标明确且 disabled/unknown leaf 被拒绝；路径规范、Windows 保留名、大小写/file-directory 碰撞与重复 destination 有拒绝路径。 |
| 布局和计数 | P1 全插件仍为 161 files/exports/sourceFiles；director leaf 为 160 文件、实际 Agent Skill 根，额外 LICENSE，不含插件 manifest/catalog/开发脚本。synthetic P2/P4 的 320/638 文件只是临时 fixture 能力测试。52/54/52/42 的 canonical 指标与逐包 totals 分开，不把副本计为新 root kinds。 |
| 逐包闭包和元数据 | `validateMaterializedSkill` 使用真实独立 Skill 根检查精确 tree、自己的 frontmatter/agent 调用名、完整 manifests、schema/example hash、namespace/lifecycle/领域 owner、54 schema 本地 `$ref`/fragment，以及现有 `validateDocument` 语义。Markdown root 为各自 Skill 根，跨 sibling 链接不会借全插件 sibling 存在而通过。child agent 不强迫冒用 director 展示信息，导出仍逐字节对照独有作者源。 |
| 语义上下文 | `validate-output.mjs` 的匹配 contracts/index 查找仍从被验证 schema 的 release 根出发；leaf 测试覆盖 Projection/CapabilityResolution/ShotCompiler/Workflow/SequenceRhythm/Repair 语义反例和准确上游 body/ID/version/hash、摘要冒充 body 反例。未知/缺 source 仍 unverified，未提升为媒体观察或批准。P1 没有改动这些语义实现。 |
| build 安全 | `buildPluginBundle` 保留真实 `.build` 直系输出、拒绝链接/junction和越界、sourceRoot override、明确 target。完整 source 校验、plan、全部 regular source 缓冲读入后，才再次检查明确 output 并替换；源失败保留旧 output。最终 bundle 由 source catalog 决定 whitelist，不能靠 bundle 自报 catalog 扩张分发。 |
| sync 安全与只读 | `syncSkillExports` 消费同一 exports plan，限定真实 enabled child；canonical director 不写。preflight 后先检查未知 entry、全部 source/destination/bytes，才写已登记且 changed 文件，不删除未知文件或目录；`--check` 不写文件。真实 P1 返回 childCount=0、filesChecked=0、filesUpdated=0，不创建占位目录。 |
| CLI和兼容 | 默认 build、原单参 API及 `--output` 保留；显式 `--skill` leaf 支持独立 sourceRoot，validate leaf 需显式 target。重复、未知、不完整 flag 拒绝；旧插件、市场、agent身份仍一致。 |
| 交接 | P0 对照显示 operating-model 只有新增 10 行。第79–85行保留原请求、子目标、准确正文/素材、硬锁、授权设计、假设/未知、规范身份、修改边界、限定返回与单点整合；依赖链串行，冻结输入可并行；缺专业入口走内联恢复，未启用不冒称已调用；同代理默认、独立review须实际执行；不扩大外部执行或媒体结论。 |
| 权限与既有权威 | 与 P0 SHA256 相同：`scripts/validate-output.mjs`、`scripts/contract-context.mjs`、`scripts/validate-prompt-projection.mjs`、`scripts/validate-shot-compiler.mjs`、canonical `contracts.json`、`reference-lifecycle.json`、`resources/contracts/index.json` 和 `SKILL.md`。最初审查时workflow也与P0相同；R2修正后对照P0的唯一workflow变化为timeout10→20分钟。CI仍 `contents: read`、固定 Actions SHA、源码校验先于测试、相同发布guard，权限没有放松。 |

## 实际验证与结果状态

本 reviewer 独立运行一次只读 API组合：`createDistributionInventory()`、`validateRepository()`、`syncSkillExports({check:true})`，退出0。结果 only director、actual owners director52、161 files/exports/sourceFiles、52/54/52/42；sync 三项计数为0。实际目录核对无 placeholder 作者目录。

读取 `D:/Temp/cineweave-split-p1-tests-20261012.log` 的结束结果：500 tests、500 pass、0 fail/cancelled/skipped/todo、571,419.7441 ms。读取 `D:/Temp/cineweave-split-p1-build-20261012.log`：161 文件、52/54/52/42、byteIdentical=true。实施方另已报告 catalog90/90、build/reliability目标135/135，扩展目标153/153及真实 director leaf CLI160文件/52/54/52/42通过；本review未重复整套长集成，也不把这些报告写成独立重跑。

R1/R2修正后，本review独立运行 `node --test tests/bundle-smoke.test.mjs`：真实D的full plugin和standalone两个子用例连同parent共3/3通过，退出0，0失败/跳过，9,999.5927ms。独立source validator返回valid=true、161文件及52/54/52/42，与受审20分钟CI模板吻合。读取实施方 `D:/Temp/cineweave-split-p1-reliability-final-20261012.log`：22/22通过，0失败/跳过，19,297.6984ms；`D:/Temp/cineweave-split-p1-source-final-20261012.log`也有效通过。500项全回归属于此次短修正前的完整实现，当前最终delta由适当的3项smoke、22项reliability和source验证复核。

真实宿主专业入口发现、P2–P4 专业行为、A/B/C 创作对照和实际媒体仍未执行；本阶段工程通过不替代这些验收。

## 首次发现、修正及关闭记录

### R0：阶段 fixture 被未来 production enabled flags 污染——复查关闭

实施期间已修正新测试对真实 P1 flags 的固定假定。当前 `tests/skill-catalog.test.mjs:32` 的 `catalogAtStage` 对每个身份显式赋值；真实 catalog 正例第79行开始按真实 enabled 集合推导，负例/阶段 fixture 从独立 P1开始；第104行起使用 synthetic P4 来源证明阶段重置和 source不变。`tests/skill-bundles.test.mjs:22` 在临时 source 中关闭并删除专业作者/派生副本，且改写仅临时开发 Markdown中的专业目录回链；第246行起证明 materializedP4→P1→P2 重置。生产文件不删除、不改写。当前代码可在未来真实 P2/P3/P4启用后继续构造受控 P1/P2 fixture，500/500结束日志支持关闭。

此项初次发现来自实施自检和修正反馈，本独立review只确认最终关闭，未伪称见到未保存的旧失败代码。

### R1：真实 enabled leaf 安装矩阵未自动展开——首次提醒，复查关闭

**首次观察（修正前）：** `tests/bundle-smoke.test.mjs:29` 只检查默认全插件中的 `skills/cineweave-director/scripts`。新 `tests/skill-bundles.test.mjs` 在隔离 fixture 检查 director leaf、syntheticP2 platform leaf及P4源目录，但没有按 production `enabledSkills` 展开每个真实 enabled leaf 的包外完整 helper smoke；platform fixture leaf 的安装 helper函数也只由P1director用例实际调用。

当前生产只有D，因此没有未测的已启用专业入口，本项不阻止开始P2。但P2激活验收必须扩成实际全插件+每个已启用leaf的矩阵，包外验证所有现有CLI/退出状态/重复key/unknown与输入及包只读，不把未启用leaf或synthetic测试结果写为生产安装通过。P3/P4应自动增加真实leaf；各专业入口还须保留共享知识回链使用的 `创作约定`锚点，由逐包Markdown校验继续强制闭合。

首次发现已发送总负责人；初次记录时未修正，此原始发现保留。

**修正与复核关闭：** `tests/bundle-smoke.test.mjs`现从source inventory的`skills`逐个选择真实enabled descriptor，并为每项执行full plugin/standalone两布局。standalone只复制已构建全插件对应Skill目录及LICENSE，不读取author source或repo helpers充当安装依赖。四个既有CLI保留成功、unknown、重复JSON key的原生退出状态与输入/包snapshot只读断言。当前真实D两布局独立运行通过，3/3、退出0；P2–P4启用后矩阵由同一source登记自动扩展。R1关闭，不再作为P2待修事项。专业入口的`创作约定`锚点仍由逐包Markdown校验强制闭合。

### R2：完整测试接近CI10分钟时限——首次提醒，复查关闭

**首次观察（修正前）：** `npm test`本机实测571.4197441秒，`.github/workflows/validate.yml:20`和受审精确模板`validate-repository.mjs:789`为10分钟整job。其余checkout/setup、源码、索引、build、bundle校验与smoke还需要时间。只有约29秒余量，后续真实多包会进一步增加逐源/逐包重复验证工作。

尚无当前GitHub Actions失败证据，不能断言CI必失败或把本机时间当CI时间。建议减少同一不变source在单测试链内的重复完整验证，或在权限与Actions pin保持原样的条件下明确审查合理job timeout；不删安全反例或语义门禁来凑时间。首次发现已发送总负责人，初次记录时未修正，此原始提醒保留。

**修正与复核关闭：** workflow和`validateWorkflowEntrypoints`精确受审模板都改为20分钟。独立`git diff --no-index`对P0 workflow确认唯一差异为timeout10→20；权限、Actions pin、发布tag guard和source→npm顺序均未变。独立source验证通过，实施方22项reliability结束日志全通过。R2的当前预算提醒关闭；未来真实多包CI耗时仍以实际Actions结果验证，不据本机测试宣称CI已运行。

## 进入P2的边界

允许开始P2平台入口提取，R0/R1/R2均已复查关闭，无遗留P1阻断。真实激活只变platform，actual owners应为director51+platform1；目标owner登记不算入口已启用。P2完成后的独立review应实际运行自动安装矩阵新增的platform两布局，并对同一母稿忠实投射、准确body/参数/参考闭合做行为证据。P1没有提前通过这些后续能力，也没有迁移故事/资产owner或移除director等价内联恢复；未来真实多包及CI结果不能以synthetic fixture代替。
