# Studio 素材批量选择删除 · 2026-11-09

用户要求“素材支持批量选择删除”。正式源码从原私有 Site v106（4748b4a4e94f6ead1235436cc021edb9a3319f96）读取，继续使用原站点和受众。

## 变更

- React 素材页明确“批量选择”入口，卡片常显勾选；选择模式支持整卡点击。
- 本页全选、数量、清空、删除所选、退出集中在粘性操作栏；筛选/分页重置选择，防止隐藏范围。
- 保留删除预览、受保护素材排除、版本校验、原操作幂等重试与精确回执；删除进入可恢复回收站。最后一页删除后自动回到有效页。
- 现有原生素材管理已支持批量选择删除，保留其功能。没有修改数据库、源媒体、权限或永久删除策略。

## 验证与发布

- 新增组件行为测试9/9，全站测试888/888，Core review161/161，TypeScript与diff检查通过。最终同步/延迟事件guard修改后，9项与TypeScript再次通过。
- 完整Worker构建通过；编译版smoke核对workspace/materials/sound/studio模块、D1迁移与备份恢复、匿名/跨账号隔离。首次smoke使用本机旧Node22.15缺少sqlite backup而停止，改用已安装Node24.22.1后通过，未改应用源码规避检查。
- 浏览器390px验证常显勾选、整卡多选、准确计数、精确两项确认、取消零提交、批量删除后空列表，以及回收站批量恢复。原始素材/aliases/分类历史/故事哈希保持一致，测试数据恢复原来的1项active、1项trashed。
- 线上不执行删除或恢复，只核对真实页面的选择、取消及滚动操作栏。

## 源码与部署回执

- Site：`appgprj_6acc43424a1c8191ba99b0630deac146`；原私有站点URL与访问范围保持不变。
- 已推送源码：`bf9a3e88275ecd1f7ceadf7a236caf1e36ae43a6`；源码工作区干净。
- 保存版本：`appgprj_6acc43424a1c8191ba99b0630deac146~appgver_19fa840bdb4c819191b56b3851d6b5bd`。
- 部署：`appgdep_6af151103f548191b9bfd5f8c2e61848`，v107 succeeded；平台完成时间2026-11-09 12:50:39（Asia/Shanghai），has_mcp=true、env_set_revision=4。
- [精确源码补丁](studio-material-bulk-2026-11-09.patch)，SHA256：`96724b1d02585d6d1720e09e51b2f8003024c71b0f1579e7e716401006785c5d`，基于v106；reverse-check通过。

本次不包含其它baby-animation-production并行工作，也未向Git提交媒体、数据库、截图或凭证。

## 线上回读

- 原地址：<https://aigc-image-library.wangwilder1222.chatgpt.site/workspace?view=materials>。owner/custom，1个允许账号、0外部访客、0群组；原Site App `plugin_asdk_app_sites_f8abf2a106708191bdcffa36f6995476` 保持不变，MCP连接正常，all_owned_projects读取103个项目。
- 实际页面显示“批量选择”和每张卡片勾选框；直接勾选两项显示“已选2项”，滚动到长列表底部时操作栏仍在视口内（top44px、高66px）。
- 线上只操作选择、滚动和退出，没有打开删除预览或提交删除。退出后选中数0、操作栏收起、批量选择入口恢复。
- 真实线上截图：工作区`.build/material-bulk-review/live-bulk-selection.png`与`live-bulk-sticky.png`；本地窄屏截图`local-mobile-selection.png`。截图不进入Git。
