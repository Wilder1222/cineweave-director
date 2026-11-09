# Studio 项目精简与演员展台 · 2026-11-09

## 请求与实现

用户要求项目覆盖创作管理、声音和创作规划，不保留独立候选审阅、协作任务、制作、交付产品入口；演员展台使用可辨认的同图模糊背景，档案方括号改流光色彩标签。

- 左侧菜单只保留看板、项目、演员、素材及连接。项目内九项创作功能平级；声音完整嵌入同页，沿用账号声音库和现有上传、播放、音色、情绪、逐句录音管理，没有伪造项目绑定。
- 看板仅呈现最近故事与文稿，去掉旧任务/候选入口。旧书签回到对应创作页，未确认交接写入仍保留恢复路径，切换项目重新归一化目的地。
- 演员原图保持 contain/filter:none；同一原图放大错位柔焦，保留人物轮廓和环境色。完整性格/档案/经历继续在图像下方。演员切换改人物图标。
- 档案短方括号注释仅在阅读层显示为金、青、紫、玫瑰色流光标签；源文本、编辑器、素材标记保持完整。跳过链接/代码/HTML/嵌套括号；支持暂停、减少动态与窄屏换行。
- 移除独立审阅/任务入口不改变后端采纳策略、版本、CAS/幂等和私有身份边界。声音未知结果保留恢复并阻止导航，已确认拒绝解除锁定。

## 真实源码

- 现有 Site：`appgprj_6acc43424a1c8191ba99b0630deac146`。
- 基线 v105：`d022030ed03151323202ab4fcea6da351241fa95`。
- 已推送源提交：`4748b4a4e94f6ead1235436cc021edb9a3319f96`。
- 保存版本：`appgprj_6acc43424a1c8191ba99b0630deac146~appgver_d6d9a71177b8819181dccdc194cf0207`。
- 部署：`appgdep_6af14151885c819185aa629dc6ae02fe`。
- 现有 URL：<https://aigc-image-library.wangwilder1222.chatgpt.site/workspace>。
- Site App 身份：`plugin_asdk_app_sites_f8abf2a106708191bdcffa36f6995476`；Director Skill 3.3.0 协议不变。

[精确源码增量补丁](studio-project-actors-2026-11-09.patch) SHA256：`abab65c250168109d20eca2c1bedb610b449e7aa5926c7eeb462e7deda7aeb49`。补丁基于 v105；不含生产数据、图片、音频、凭证或截图。

## 验证

- 全部 Site 测试879/879通过；Core review161/161、TypeScript、完整 Worker build、source readiness complete=true通过。
- 最终源码打包流程再次构建并运行编译 Worker smoke，包括声音模块/原生路由/React工作区、健康接口/项目读取、D1迁移备份恢复、匿名及跨所有者隔离。
- 独立审查修正两项残留：看板任务/候选链接、从交接恢复页切换项目仍进入旧功能。
- 浏览器桌面与390px：原图及背景src相同，主图filter:none；流光标签完整、无横向溢出，暂停后animationPlayState=paused；编辑器原文仍带原方括号。
- 同页声音无iframe：未保存上传描述触发离开保护，取消后保留原输入，清除隔离草稿后正常切换。原生加载失败退出loading并提供刷新；显示范围使用平级按钮。
- 看板fixture浏览器只呈现最近三条创作内容，旧功能区和入口不再出现；过滤后仍可继续分页。

浏览器写入仅发生在明确标记FIXTURE的本地数据库；线上只读验证。未改变受众、数据库、原媒体或采纳规则。主仓库其它baby-animation-production工作不纳入本次提交。

## 发布回读

- v106 部署 succeeded（2026-11-09 03:43:28 UTC），has_mcp=true、env_set_revision=4。原 URL、Site App 身份及 custom 私有受众保持不变：1 个允许账号、0 外部访客、0 群组。
- 发布后连接器回读成功：same_owner_connection / all_owned_projects / default_enabled=true，共103个项目；素材查询正常（2914项）。
- 线上陆茜茜档案：清晰主图与背景使用相同图片地址；背景 blur(18px) brightness(0.64) saturate(0.88)，主图 filter:none。9个彩色标签均可见，阅读正文无【】；〔素材引用〕标记保留。
- 线上声音页在项目内直接挂载（iframe=0），音频文件与音色身份均读取完成，当前各0项，正常显示真实空状态。未上传或修改线上声音，不将读取验收表述为播放或媒体质量验收。
- 线上导航仅呈现保留的左侧入口和9项项目功能，声音与创作规划均在项目内。
- 线上截图保存于工作区 .build/project-actors-review/live-actor-stage.png、live-actor-labels.png、live-project-sound.png。截图仅作本地验收，未纳入Git补丁。
- 源码提交已推送并保持干净；补丁 reverse-check 通过。本记录及补丁单独提交，不包含其它并行工作。
