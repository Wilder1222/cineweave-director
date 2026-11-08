# Jimeng 工作流吸收 · P6 分集与镜头计划

2026-11-06，接续 [总计划](jimeng-workflow-plan-2026-11-05.md)。本阶段只实现既有私有 Studio 中的结构化创作记录；P7 历史深链与范围操作、P8 执行桥、P9 3D 工具仍在后续阶段。

## 源码与设计

- 官方 Sites 当前读取确认 v96、源码 `1520c78adb0a7b5971045b0b77a8d75a256dfc9e`，owner/custom、1 用户、0 组、0 外部访客。官方 helper 刷新准确源码后才修改。
- 复用既有 workflow artifact 存储、不可变故事版本、候选/人工审阅、幂等和 CAS。未新增数据库迁移，未修改生产数据、FRAME、环境变量或权限。
- 分集保存编号、目标、入集/离集状态、可选前集与有序场次；镜头保存所属分集/场次、编号、计划时长、出场状态、景别、摄影机、动作、对白和正文段落。
- 镜头严格使用分集固定的场次版本/SHA；前集链拒绝 ID 环。仅作者可见，不进入选角自动采纳。旧正式 pin 可保存待复核候选；新采纳/恢复须通过当前依赖检查。
- 新建入口、集场镜清单、候选切换、结构概览、准确来源读取、场次上移/下移、数字段落定位和显式重新固定来源均复用既有工作台。旧章/场不强制补分集。旧页面只读新对象并跳转完整工作台，避免不完整表单写入。

## 研究与独立复核

后端与 UI 分别先做只读审计，合同和验收写入 Site 源码 `studio-core/docs/phase-p6-episode-shot-20261106.md` 后实施。独立计划复核发现并修复：前集改号成环、从未采纳 pin、镜头偏离分集场次版本、恢复绕过依赖复核、中文可读投影隐藏结构引用、候选 head 冒充已采纳依赖等边界。动作字段为自由文本，保留旧改编处理方式的枚举检查。

## 本地验证

- 后端新增16项与既有35项合计51/51通过，覆盖文件SQLite关闭重开、旧schema/版本保持、原HTTP端点、跨owner/project/branch/timeline、历史pin、协作原子采纳、CAS/幂等、canon race回滚和归档恢复。
- 6项UX投影测试通过，关系/中文审阅29项通过，旧页面兼容1项通过。
- 完整 `npm run review`：156/156检查类别；核心486项、475通过、11既有跳过、0失败。
- TypeScript通过；源码完整性检查 `SOURCE_BUILD_PREFLIGHT_ONLY complete:true`。它不是线上授权会话证明。
- 本地SQLite+Vite隔离预览已成功启动，仅使用 `.build` 下合成夹具。CUA IAB返回 `Browser is not available: iab`；Chrome返回 `Cannot read properties of undefined (reading 'timeoutMs')`。未使用其他浏览器自动化绕过，浏览器操作/截图仍待验收。

## 最终审阅、构建与发布

最终独立复核 PASS：独立重跑52/52通过，无需阻挡发布的P1/P2发现。完整Sites/Vinext构建通过。候选显示切换已确认经既有 `onAttempt` / dirty guard，不会直接绕过未保存提示。

官方 helper 已将23份本轮源/测试/审阅文件提交并推送为 `6dedf1c8dd714d51af723f7d13c6f505eb9c5095`。准确补丁见[Site P6补丁](jimeng-workflow-p6-studio-2026-11-06.patch)。本地源工作区干净；临时SQLite、预览和日志通过checkout-local排除保留，不进入源码提交或部署归档。

原生 Sites 已保存并发布 **v97**：

- Site：`appgprj_6acc43424a1c8191ba99b0630deac146`
- 保存版本：`appgprj_6acc43424a1c8191ba99b0630deac146~appgver_e21ab83990e081919ae0751ebad22152`
- 部署：`appgdep_6aecb2c541d88191aa41fd5a689e0e0a`
- 终态：`succeeded`；`has_mcp:true`；环境修订4；无失败信息。
- [CineWeave Studio 工作台](https://aigc-image-library.wangwilder1222.chatgpt.site/workspace)

部署归档169份文件（含目录的tar条目190），未含本地 `.build`、SQLite或预览文件。保存版本的源码SHA与官方helper返回提交一致。未使用另一个站点或改变受众。私有权限发布前后核对维持owner/custom、1用户、0组、0外部访客。

本阶段代码、独立审阅、构建和私有发布已完成；真实授权会话的编辑/查阅/视觉验收受当前CUA工具故障影响，保持待完成。没有真实媒体生成、外部执行器连接、作者创作采纳或整站浏览器验收证据。父插件仓库的并行工作全部保留，未提交/推送父仓库或安装插件缓存。
