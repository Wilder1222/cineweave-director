# 三模型官方资料最终只读复核

核验时间：2026-11-03 约 04:26–04:31（Asia/Shanghai）。核验方法为直接 HTTPS 只读请求官方文档和型号目录；仅就所访问来源确认，未登录账号、未上传素材、未创建任务或生成视频。常规联网检索服务本次两种入口均报连接错误，不能声称已完成全网最新版本搜索。没有绕过 TLS 校验。

本次审阅的作者源 SHA-256：
- `skills/cineweave-director/references/optional/video-model-practices-2026-10.md`：`ef18ee5cc1b028daebfaae3c31258046ea12cbd46d0d2daa0c1eb4068778202f`。
- `skills/cineweave-director/references/optional/video-platform-adaptation.md`：`1793214cebdf82dd1f71b712c70f688feed09309e98a634bed5e96880208cd3a`。

## 本次直接核验

### Seedance 2.5 / 火山方舟

- [官方模型列表](https://docs.volcengine.com/docs/ark/model-list?lang=zh) HTTP 200；当前页面的 `doubao-seedance-*` 视频模型 ID 最高代际为 `doubao-seedance-2-5-260628`，同时列 2.0 系列及 1.0。项目指南使用的 2.5 型号没有发现拼写错误。此结论限定该方舟目录与本次取得页面，不推出全球全部接入方或未来目录没有更新。
- [Seedance 2.5 模型教程](https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh)与[创建视频任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh)均 HTTP 200，页面正文含 `first_frame`、`last_frame`、`reference_video`、`omni_reference_task_type`；API 正文列 `generate_audio`、`InvalidParameter.TaskTypeMismatch`。教程的编辑场景仍列 `ratio=adaptive`、`duration=-1`；与当前指南的关键模式边界没有发现明显矛盾。
- [提示词指南](https://docs.volcengine.com/docs/ark/seedance-2-5-prompt-guide?lang=zh)、[真人形象素材录入](https://docs.volcengine.com/docs/ark/upload-real-person-portrait-assets?lang=zh) HTTP 200。当前检查不代表目标账号已开通、素材获准或实际生成通过，也未对全部技术字段逐字穷尽验证。

### Wan / 阿里云百炼

- [百炼视频模型目录](https://help.aliyun.com/zh/model-studio/use-video-generation/) HTTP 200，列有 `wan3.0-video` 与 `wan3.0-video-prime`；所得目录中还列 2.7、2.6 等型号，未发现高于 3.0 的型号编号。项目选用 Wan 3.0 和两个型号名称没有发现明显版本误称。该结果仅针对所访问的百炼目录，不代表全部 Wan 部署与第三方服务均已更新或可用。
- [Wan 3.0 视频生成 API](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference) HTTP 200，正文仍列上述两个型号及 `first_frame` / `last_frame` / `reference_image` / `reference_video` / `reference_audio` / `file` / `link`，且文件或网页输入的 `prompt_extend=true` 规则仍在。原有首尾帧和参考类型互斥、分输入类型编号、视频输入时长限制及续写示例歧义应继续按具体模式核验；本次没有模拟或提交请求。
- [国际站 Wan 3.0 生成指南](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/wan3-video-generation-guide)及[提示词指南](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/wan3-video-generation-prompt-guide) HTTP 200；HTTP 200 不证明账号、地域、端点或模型调用可用。

### Kling / 快手

- 本次直接访问 [Kling 4.0 用户指南](https://kling.ai/quickstart/kling-4-model-user-guide)和[官方开发者模型页](https://kling.ai/dev/apiReference/model)发生 TLS 握手或证书连接失败；[关键帧专题](https://kling.ai/blog/kling-4-multiple-keyframes-guide)读取超时，[快手 IR 发布公告](https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-officially-launches-next-generation-kling-40-raising)返回 HTTP 403。两次搜索服务入口均连接失败，因此本次不能实时确认 4.0 仍为最新、其规格未变或开发者 API 的具体可调用性。
- 本会话在 2026-11-03 较早一次复核中曾直接读到 [Kling 4.0 用户指南](https://kling.ai/quickstart/kling-4-model-user-guide)正文，并记录 Omni Reference 和独立 Keyframes 的模式说明；该次与这次是不同时间的证据，不能把先前读取写成当前页面实时可达。此前该指南关于独立 Keyframes 的限制与其示例、[官方关键帧专题](https://kling.ai/blog/kling-4-multiple-keyframes-guide)对组合的表述存在未消除的歧义。项目 `video-model-practices-2026-10.md:56–57` 保留了“模式区别”及同任务组合需核验的边界；本次无法进一步消解。
- 项目指南开头明确称可灵新增资料的基准为 2026-11-02 的官方搜索索引，并注明账号未实测；这是历史核验口径。今次无法刷新搜索，交付时必须继续说“截至上次可得资料／本次最新未核实”，不得把 4.0 写成 2026-11-03 当前已确认的全球最新版本，也不得把 UI 参数泛化为所有 API 和第三方服务。

## 审阅结论与限制

本次对已直接访问到的方舟与百炼官方型号目录及关键接口字段，没有找到足以证明项目当前型号名称或所查关键模式规定明显过期的证据；该表述不等于逐项验证了所有官方规格。可灵的当下最新状态、完整指南现状、API 字段、用户账号和地区可用性因本次连接失败保持未知。历史材料可以按其核验日期使用，真实媒体、画面质量、声音和作者验收未验证。本次是官方资料复核，不计作真实宿主的审阅轮次。

后续可灵官方来源访问与修订记录见[2026-11-03 可灵官方复核](model-adaptation-kling-official-recheck-2026-11-03.md)；以上保留本报告原核查时点的结果。
