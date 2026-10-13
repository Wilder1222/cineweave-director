# CineWeave 本轮精简独立审阅

日期：2026-10-12。审阅者：独立只读代理。

## 结论

首次审阅发现 1 项实际问题：CI 改用 `npm test` 后，源码与脚本白名单验证位于 npm 执行之后，被白名单拒绝的 npm 生命周期脚本仍可能先执行。无害临时夹具已经重现。主代理随后修正门禁顺序；独立复查确认当前工作流与精确模板均先验证源码，且拒绝 `pretest`、`posttest` 和晚门禁反例。当前没有待处理的实际发现。

未发现本轮精简造成创作关键约束、六视角正式评审、真实证据边界、用户授权、登记测试白名单或文档可发现性的进一步缺口。此结论仅涵盖文档与工程门禁，不证明任何图像、视频、音频或观众效果。

## 审阅范围与隔离

只读审阅当前 `SKILL.md`、`operating-model.md`、`ensemble-direction-and-review.md`、`short-film-creation.md`、`shot-design-workbench.md`、`storyboard-rhythm.md`、`video-timing-and-handles.md`、`video-sound-and-delivery.md`、`production-plan.md`、`review-repair.md`、`generation-diagnostics.md`，以及 `scripts/validate-repository.mjs`、`.github/workflows/validate.yml`、`tests/reliability.test.mjs`。补充核对 `package.json`、当前 `README.md` 和角色／导演路由中被归一资料的条件入口。

本轮范围按入口按需加载、普通草稿人工聚焦检查／正式定稿六视角、重复规范归一、CI `npm test` 单一入口、登记测试精确校验划定。此前 Higgsfield 合同、平台投影、音频回流、依赖影响与独立案例隔离的改动没有被归为本轮新增。未读取既有 `tests/evaluations` 报告内容。

没有修改仓库文件。只在 `D:\Temp\cw-ci-gate-review-20261012` 建立无害复现夹具，并写入本报告。

## 首次发现与关闭证据

### P2：先执行 npm 生命周期，后验证脚本白名单

首次看到的 `.github/workflows/validate.yml:28-33` 依次为 `npm test`、契约索引检查、源码验证。`scripts/validate-repository.mjs:573` 会精确限制 package 脚本键，`574-583` 限制 `test` 的命令结构与登记测试集合；这些校验在原顺序里不能阻止一个未登记的 `pretest` 在验证前执行。旧工作流的硬编码 `node --test ...` 不会触发 npm 的 `pretest`／`posttest` 生命周期。

无害重现：临时夹具只声明 `pretest: node pretest.mjs` 和 `test: node --test registered.test.mjs`；`pretest.mjs` 只写本临时目录的 `unregistered-ran.txt`。实际运行 `npm.cmd test --silent` 退出码为 0，登记测试通过，同时标记文件内容为 `pretest executed`。因此问题是执行前门禁缺失，不能仅以最终 CI 会拒绝 manifest 来关闭。

主代理修复后的当前事实：

- `.github/workflows/validate.yml:28-31` 先运行 `node scripts/validate-repository.mjs`，通过后才运行 `npm test`。
- `scripts/validate-repository.mjs:714-719` 的精确工作流模板保持相同顺序；`731` 要求工作流全文与模板一致。
- `tests/reliability.test.mjs:142-153` 加入 `pretest`／`posttest` 反例，`181-191` 加入把源码门禁放到 npm 之后的反例。
- 独立隔离执行当前验证器中原有的 `validatePluginAndPackage`、`validateWorkflowEntrypoints` 函数：当前 package／workflow 被接受；添加 `pretest`、添加 `posttest`、调回晚门禁分别被预期的白名单／精确模板错误拒绝。该核查只读取验证器、package、插件／合同 manifest 与 workflow，没有读取评测报告。

状态：已关闭。保留首次发现与无害复现，不以修复后状态覆盖初次证据。

## 约束与入口核对

| 核对项 | 当前事实与位置 |
| --- | --- |
| 按需加载与完整交付 | `skills/cineweave-director/SKILL.md:8` 允许普通草稿直接交付；`27` 仍要求完整短片／全套稿件逐项完成；`38` 仍要求按细节规范展开有独立作用的细节；`48` 仍指定视频相关章节及指定平台时的适配入口。 |
| 草稿与正式评审触发 | `SKILL.md:33`、`ensemble-direction-and-review.md:3,10,65`、`short-film-creation.md:94`、`shot-design-workbench.md:212`、`storyboard-rhythm.md:17`、`review-repair.md:11` 现均区分草稿／局部人工检查与综合评审、完整场次定稿、正式制作／规范交接的六视角覆盖。没有残留的完整草稿默认全表触发。 |
| 工具结果不冒充完成 | `ensemble-direction-and-review.md:10,69-74,106-112` 仍区分输入有效、覆盖完整与评审完成；未知不是豁免，全部豁免不是完成；Node 可用时正式全表需实际检查，没有 Node 时手工评审说明算术未检查。 |
| 行为与跨镜状态 | `SKILL.md:31` 保留触发、动作机制、接触／落空、反应与运动相位；`ensemble-direction-and-review.md:32-36` 保留倾听、背景任务和触发顺序；`storyboard-rhythm.md:41-53` 保留继续／重看／省略以及接触、轴线、持有和声音接口。 |
| 精确声音与剪辑窗口 | `video-sound-and-delivery.md:34-48` 将声音母稿与现场规范明确导向唯一正文，并保留准确文案、实际声长和听觉验收；`video-timing-and-handles.md:7-9,20-22,32-40,50,54-58` 保留三种时长、有理数时基、半开／包含末帧的区分、运动切点和尾帧陷阱。 |
| 归一后的修复限制 | `generation-diagnostics.md:159-163` 链到实际 `review-repair.md:39-47`，单根因、责任归属、保留已通过部分、下游重编译、候选上限及停止规则仍完整存在；没有用概括语删除对应规范。 |
| 授权与证据边界 | `SKILL.md:39-42,59`、`operating-model.md:11-15,71-81`、`production-plan.md:21,43-51,63`、`review-repair.md:15-17,47,51-55` 仍禁止把草稿、参数、检查或模拟例子变成批准、权利、实际执行或媒体验收。 |
| 登记测试白名单 | `scripts/validate-repository.mjs:573-583` 从受审查的源文件登记表导出普通回归集合，拒绝遗漏、未登记、重复与非测试 token；`216-234` 仍执行唯一性／集合比较；`734-743` 仍保持源文件精确闭包。安装包 smoke 仍独立在 CI `41-42`。 |
| CI 其他门禁 | `.github/workflows/validate.yml:9-10,17-18,23,25,34-42` 保留只读权限、双系统／双 Node、固定 action SHA、发布标签等于版本、字节一致构建包验证与安装后工具验证。 |

上述文档路径除 `SKILL.md` 外均位于 `skills/cineweave-director/references/core`、`references/routes` 或 `references/optional`；名称与审阅范围相同。

## 独立运行的核查

1. 使用现有 `createDistributionInventory` 与 `validateMarkdownFiles`，仅检查分发 Markdown：43 个文件、431 个链接、115 个片段锚点全部通过。未将源码评测报告加入此检查。
2. 从分发入口 `skills/cineweave-director/SKILL.md` 沿本地 Markdown 链接遍历，43 个分发 Markdown 全部可达，未发现不可发现的孤立资料。已归一的肖像、镜头工作台、画质、漫画、声音、时间和诊断资料均有对应条件入口。
3. 当前分发 manifest 实际计数：161 个文件、42 个参考、52 个根契约、54 个 schema。数量核对来自当前 manifest，未据旧报告推断。
4. npm 生命周期无害夹具实际执行，证实首次问题；修复后采用当前验证器的原函数做隔离核查，确认当前配置接受、三类反例拒绝。

没有独立重跑会读取整个 `tests/evaluations` 的 `validateRepository`／`reliability` 全流程，也没有据主代理的正在运行状态声称其测试结果通过。全仓库测试与构建结果由主代理另行记录。本审阅未创建或检查实际生成媒体。

## 开发评测登记后的源码定位补记

报告正文中的源码行号对应六份本轮开发评测登记前的已审阅源码。本次仅在 `scripts/validate-repository.mjs` 的静态 `evaluations` 文件清单新增六项，没有新的运行逻辑修改；清单后原行号整体增加 6。正文与首次发现保留原样。未重跑整个仓库或读取旧评测报告。

当前源 validator 的 SHA256：`7c448bd603d0c4f4e2f3d52e52511d6cea5a2a115112e07fd072d0bdbafadd3a`。

当前实际定位：`sortedUnique:222`、`compareFileSets:235`、`validatePluginAndPackage:560`（脚本键白名单 `579`，测试命令 `580`，登记集合 `583-587`）、`validateWorkflowEntrypoints:690`（源码门禁模板 `720`，`npm test` 模板 `723`，全文比较 `737`）、`validateSourceStructure:740`、`validateRepository:761`。以上行号与 SHA256 来自同一次文件字节读取。
