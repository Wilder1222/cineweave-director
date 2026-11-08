# 跨集项目与镜头回流：公开工程记录

2026-11-06。本次在已发布的统一工作流之上迁移通用 P0–P3 增量，不包含私人项目、正文、候选、站点标识或部署补丁。

## 研究与范围

方法来自此前阅读的官方[剧本助手](https://xyq.jianying.com/tutorials/short-drama-agent-script-assistant)、[资产画布](https://xyq.jianying.com/tutorials/short-drama-agent-canvas)、[整组预演](https://xyq.jianying.com/tutorials/short-drama-agent-smart-preview)和[3D 导演台](https://xyq.jianying.com/tutorials/short-drama-agent-3d-director)文字说明（查阅日期 2026-11-05）。这些资料支持流程设计，不证明任何账号、项目、生成工具或媒体结果已实测。本次迁移没有再次调用外部服务。

- 增加按需[项目指南](../../skills/cineweave-director/references/optional/project-workflow.md)，组织集／场／镜、身份／时期／造型、准确资产消费、预演映射和候选输入。
- 在既有交付检查器增加 `checkProjectWorkflow` 与 `--project-workflow`，保留普通字幕与时间线算术接口。
- 复用既有相机、场景和镜头契约补充外部三维工具交接，不新增根契约、供应商执行器或项目存储。
- 只迁移本轮相关指南段落；保留原有 Studio 输入适配、平台指南、规范示例与既有参考。

## 合成案例与验收

[两集五镜夹具](jimeng-workflow-workbook-2026-11-05.json)完全为合成数据，`fixture:` 路径与媒体都是模拟声明，不含真实作品、任务或媒体。案例包含跨时期人物、镜内脱雨披到室内造型、一镜多格预演、旧输入候选和未返回媒体。

检查应拒绝重复／孤儿引用、集场镜错配、角色时期或外观范围错误、预演错序／漏格、候选错镜、未来修订、缺少采用媒体以及无效采用窗口。未展开集、旧输入、尚无候选与未核验媒体保留待审；不得自动选用、修改输入或提升验收状态。严格 JSON 与公开函数还应拒绝对象型 ID、无效数值、访问器、循环、Symbol、隐藏属性和稀疏数组，并返回结构化诊断而非执行 getter 或隐式转换。

## 本次迁移验证

在公开仓库基线 `17be87e1152b99dcc614285e53f194d8c5f71a86` 的隔离工作区执行：

- `node --test tests/check-delivery.test.mjs`：143 项通过，0 失败、0 跳过。
- 对合成夹具逐字段替换的 3688 例探针：0 次抛异常；严格解析的对象型 ID 返回 `valid:false` 与结构化 `ID` 错误。
- 本轮 9 份入口／指南／工程记录的本地 Markdown 校验：131 个链接、42 个片段全部有效；不访问远程网址。
- 本轮源代码 `git diff --check` 通过；新增指南、合成夹具和本记录未含私人站点标识、地址或作者源文件路径。

## 3.3.0 发布准备

包清单、市场固定标签、目录／索引及四个 Skill 的软件版本统一为 `3.3.0`／`v3.3.0`。规范示例与其历史模拟回执保持原字节。

- `skills:sync:check`：507 个派生文件一致，无待更新。
- `contracts:index:check`：52 根契约、4 个辅助 schema 与索引一致。
- `validate`：678 个分发文件与源码边界通过，49 份参考登记有效。
- `build` 与 `validate:bundle`：678 文件逐字节一致。
- `npm test`：624 项通过，0 失败、0 跳过（修复 leaf 文件数断言后完整重跑）。
- `test:bundle`：9 项通过，0 失败、0 跳过；仅证明仓库外安装布局及工具行为。
- 独立差异复核：59 个文件变更未发现私人内容；20 份既有 Studio／平台适配文件保持；52 份规范示例与根契约内容不变。

Git 发布与真实宿主加载分别检查；宿主另用原生 `skills/list` 检查，不以包内测试替代。浏览器、三维工程及真实图像／视频／声音验收各自独立，本记录不证明这些结果。
