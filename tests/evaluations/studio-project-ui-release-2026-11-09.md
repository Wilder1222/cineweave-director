# Studio 项目页更新 · 2026-11-09

## 请求与结果

用户在真实项目故事页观察到多条“项目关系查阅”、导航内滑块/滚动条与过度下拉，要求优化项目切换和特效，并将更多能力作为平级产品功能。

实现：项目标题与十二个平级入口；搜索、形式筛选、分页项目选片面板；故事文稿目录与正文同屏；独立项目关系/规划；制作与交付功能直接可见。取消项目页滑动高亮块；卡片局部金色光效与项目曝光转场，减少动态时静态回退。沿用现有演员展示、素材功能及 React Bits 动效。

重复栏原因已通过线上 DOM 与源码交叉确认：故事页四个关系节点中三个为旧读取状态；ProjectRelations 与 DocumentEditor 的同层 key 都等于项目 ID，异步更新发生重复 key 冲突。现在关系仅挂在独立关系页。新增回归验证真实 JSX 同层 key 唯一性。

## 源码与发布身份

- 现有 Site：`appgprj_6acc43424a1c8191ba99b0630deac146`。
- 基线 v104：`77887cc95e1152e1f1f1a2f0e52c22390bd8b481`。
- 已推送源提交：`d022030ed03151323202ab4fcea6da351241fa95`。
- 保存版本：`appgprj_6acc43424a1c8191ba99b0630deac146~appgver_dc0b3a8df7d881919e860cf99a1ccda8`。
- 部署：`appgdep_6af13a7f89108191896256be5c4be535`。
- 版本与终态：Site **v105**，官方部署 `succeeded`，`has_mcp=true`，环境 revision 4。
- URL：<https://aigc-image-library.wangwilder1222.chatgpt.site/workspace>。
- 现有插件身份：`plugin_asdk_app_sites_f8abf2a106708191bdcffa36f6995476`；Director 3.3.0 协议包不变。

随附 [精确增量补丁](studio-project-ui-2026-11-09.patch)，SHA256 `902a341b16fa5061d01063ab72b5f61bbe87128d42681cf02c0bf7fc483f4978`，可从 v104 重放。对最终源提交 reverse-check 通过。Site checkout 干净。没有生产数据、截图或媒体快照写入 Git。

## 验证证据

- 全套站点测试 861/861；最终焦点微调后的相关回归 26/26。
- Core review 161/161；TypeScript、完整 Worker build、编译 Worker smoke 全部通过。Worker smoke 包含真实路由、健康接口、项目读取、lookbook、迁移备份恢复与匿名/跨所有者隔离。
- Source-only readiness：complete=true；仅作为源码完整性检查，不代替发布凭证。
- Impeccable 项目导航/内容布局检测：[]；独立审查发现并修正 Portal 根选择器与链接 href/点击目标不一致。
- 本地隔离浏览器：桌面项目导航/文稿/关系页；连续三次刷新，故事页始终一个文稿编辑器、零重复关系栏；关系刷新一份面板。
- 本地未保存切换：确认框默认焦点在返回编辑，取消保留标题，焦点回到项目切换按钮。独立单测覆盖保存中阻断、保持当前功能与 Back 路由。
- 390px 手机：无正文横向溢出；导航及切换卡片按钮无内部滚动。选片面板在视口内，切换项目保留当前关系功能。
- 全目录测试覆盖超首屏项目搜索/分页与 121 份文稿搜索分页、未知写入恢复锁定。

本次 UI 浏览器验证只操作已标记本地隔离数据；线上仅做读取。不改变私有受众、授权策略、数据库、原媒体或内容采纳规则。通用详情/预览与少数动态归集下拉仍存在，主产品功能不再隐藏于“更多工具”。

Director 主仓库有其他任务修改的 baby-animation-production 文件，本次仅提交 README、本记录及增量补丁，未纳入那些内容。此次无 Director schema/skill/runtime 改动；验证围绕 Site 实际改动执行。


## 最终线上回读

真实已登录会话打开原项目“宝宝的日常奇遇”：十二个平级入口、一份文稿编辑器、零旧“项目关系查阅”栏、零有内部滚动的导航按钮。项目切换显示 103 个真实项目，搜索“宝宝”准确返回当前项目。仅做读取与导航，未提交生产内容。

发布后的 Sites 回读为 owner/custom，1 个允许账号、0 外部访客、0 群组；URL 和插件身份未变。现有插件 get_creation_capabilities 返回 same_owner_connection / all_owned_projects / default_enabled=true / 103 项，素材搜索成功。Director Skill 版本仍为 3.3.0。

线上截图存放于忽略目录 `.build/project-ui-review/live-project-page.png` 与 `live-project-switcher.png`；手机隔离预览截图同目录，未分发或提交私人项目截图。
