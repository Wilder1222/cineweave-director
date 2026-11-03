# 百炼 Wan 3.0 新品广告：12 秒条件制作稿

## 先保留原要求，再说明冲突

原要求是：现成产品图严格作为首帧，Wan 3.0 读取仅在本地、不得公开的内部 PDF，将 PDF 中的精确广告语原样显示在画面末尾，成片 12 秒。产品图、PDF、广告语、账号及区域均未提供；目前没有上传、读取、生成或发布任何素材。

截至 2026-11-02 查阅[百炼 Wan 3.0 API 文档](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)：`first_frame` 严格指定生成视频的第一帧；`first_frame`／`last_frame` 与 `file`／`link` 及参考素材互斥，因此**同一次 Wan 请求不能同时把产品图设为严格首帧并让模型读取 PDF**。文档支持 PDF，但模型理解文件不等于精确排字保证。最终导出经过缩放、色彩转换和有损编码后，输出首帧是否与原图逐像素一致也须实测，不能仅凭“严格首帧”参数保证最终交付文件逐像素一致。

本地 PDF 路径不能直接作为该 HTTP API 的 `file.url`。官方支持公网 URL 或按其上传流程取得的临时 OSS URL；临时 URL 不等于公开网页，但仍将内部文件传给供应商，权限、处理、保存期限和公司政策都须先确认。不得将文件公开，也不将临时链接视为已获准上传。PDF 最大 100 MB、最多 50 页；文档输入要求 `prompt_extend=true`。资料和限制见[官方 API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)。

## 选择路径与损失

**A：优先严格首帧和精确成片文字（推荐）**。在公司允许的本地环境由授权人员从 PDF 原样提取、核对广告语；Wan 仅接产品图，走 `first_frame`；后期在 9–12 秒以独立文字层排入核准原文。损失：**Wan 本次不会读取 PDF**；精准文字由后期而非模型产生；产品图仍要发送给百炼，需确认允许。首帧逐像素要求若包含交付编码，须先约定验收口径并做实测，必要时交付无损母版。

**B：优先模型读取 PDF**。在公司明确许可将 PDF 发送到百炼且官方临时上传、地域与账号条件满足后，使用 `file` 加 `reference_image`。模型可读取 PDF 并参考产品图，但产品图不再是严格首帧；模型对产品、广告语的拼写、标点、位置与可读性不能保证。若文字必须逐字正确，仍需本地后期核字排版。临时上传不应被描述为文件留在本机。若公司政策禁止任何外部处理，此方案不可执行。

**C：跨请求组合**。经允许，先以文件模式理解 PDF，再单独以首帧模式生成视频、后期加入人工核验原文。损失：不是同一次请求；PDF 在第一步仍传给供应商；模型提取需要人工核对，内容传播和保密政策需获授权。第二次请求的首帧才有严格首帧角色，不能声称首个请求也满足。若不允许外传，则用 A 本地提取。

尚未选择路线。以下按 A 制作可审阅条件稿，不视为已改变原要求或最终批准。请决定 A／B／C、成片首帧的验收口径，以及是否允许产品图／PDF 分别传送至百炼；广告语原文需在允许范围内由授权人员提供或本地提取。

## 创意与 12 秒分镜

**适用前提**：产品图能作为完整画面使用；实际产品类别、外形、图中文字、画幅、背景和许可未知。先检查真实图像，再确定是否适合光影变化；图上既有文字或标识保持原样，不假设它们已经准确。以下为同一片段内的三个叙事阶段，不承诺模型按时间码精确切镜。统一基线：延续首帧可见空间、材质与光向，产品不位移、不旋转、不变形；背景无新物件，克制清晰。若首帧无可用负空间，末尾广告语改为独立后期尾卡，不能遮挡原图关键标识；如首帧图形本身不容安全变化，先锁图并调整方案。

| 时间 | 观众看到的信息、机位与出入点 | 摄影、声音和衔接 |
| --- | --- | --- |
| 0–3 秒 | 第 0 帧严格绑定原产品图。沿用实图的景别、视点、构图：其前景、中景主体、背景分别继承实图，不臆造布局。让观众先辨认完整产品。 | 固定机位、焦点保持在原图主体，不动是为了保护产品轮廓。0–1 秒保持画面，1 秒后仅在实图允许的表面出现轻柔亮度变化；3 秒带着同一主体位置进入下一阶段。后期声音用一声轻微柔和起音，避免强冲击。 |
| 3–8 秒 | 同机位持续展示产品细节，沿用实图空间及已有受光，观众注意力由整体转向表面。 | 光的亮度缓慢变化后回落，不添加图中不存在的产品结构、可见零件或新背景；相机仍固定、焦点不切换。3 秒接前段光变化，8 秒恢复近似稳定的展示状态。声音为低音量持续氛围音，不虚构产品功能音。 |
| 8–12 秒 | 产品保持易辨，9–12 秒由后期在与主体、品牌信息不冲突的区域叠加经核准广告语，留足阅读时间；文案内容、字号、行数和安全区待原文与画幅确认。 | 固定机位，9 秒文字层清晰出现并保持至终点，音乐缓慢收束；无旁白。8 秒为光变化出点，9 秒文字入点，12 秒切出。实际长文若无法三秒读清，需缩短前段或重新协商成片时长，不删改原文。 |

后期字幕规范：由授权人员复制 PDF 的完整准确字符，逐字核对字形、空格、标点、大小写与换行；校对 PDF 是否为扫描件、提取是否有 OCR 错字。广告语未知，不能虚构占位文字作为最终交付。按画幅留安全区，保证与背景对比和可读性。文字层从 9 秒出现而非首帧出现，避免影响首帧。授权人员校对源文与最终逐帧画面；不要将本稿当广告语审定。

## A 路径的 Wan 中文复制稿

下面为单次生成片段的完整提示词；使用前必须先检查实际产品图，确保“保持原图可见空间、产品静止、表面亮度变化”与素材相容。时点是意图，返回视频必须复检。

```text
从所绑定的产品图首帧开始制作约12秒新品展示视频。完整继承首帧中可见的产品外形、颜色、包装、已有标识、构图、背景空间和光线方向；产品保持原位、原朝向、原尺寸，不变形，不增加零件、人物或其他物件。前1秒保持初始画面，随后至第8秒，只让已有光照在产品可见表面产生缓慢、轻微的亮度变化，再逐渐回到稳定状态。摄影机全程固定，不推拉、不旋转；焦点保持在原图产品上。第8至12秒维持清晰稳定的产品展示画面。无对白、无旁白、无生成字幕或新增文字；声音由后期单独制作。
```

此稿不指示模型读取 PDF，也不包含未知广告语。它把文本留给后期；图中原有字样随首帧继承，但生成期间是否变形须检查。若严格要求逐帧完整保留原图文字或商标，需要另做固定图层／合成，不可仅靠文字提示保证。

## 接口交接

- 账号、模型开通、所在区域、Workspace ID、界面类型、素材上传许可、产品图规格及广告语均待确认；当前没有可提交请求。按官方 API 选择同一地域的模型、Endpoint 和 API Key；不要在对话或稿件中粘贴密钥。
- A 的 API 结构：`model=wan3.0-video`；`input.prompt` 使用上述完整提示词，`input.media` 仅包含一项 `{"type":"first_frame","url":"<经许可的图片输入>"}`；`parameters.duration=12`、`ratio="adaptive"`、`audio=false`；分辨率按素材及交付需要确认。官方范围是无视频输入时 2–30 秒整数、输出 30 fps，`audio=false` 关闭原生音轨。图片可通过官方支持的 Base64 或临时上传方式传入；Base64 依然把图片内容发送给服务，不等于留在本地。不得加入 PDF 或其他参考项。
- 图片限制以[API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)为准：JPEG/JPG、PNG（无透明通道）、BMP 或 WEBP，单边 240–8000 像素、长宽比不超过 8:1、文件不超过 20 MB。画幅与分辨率转换、编码对首帧的影响要测试；界面和 API 参数以当前实际入口为准。
- B 的接口结构改为 `input.media=[{"type":"file","url":"<经许可的临时文件 URL>"},{"type":"reference_image","url":"<经许可的产品图输入>"}]`，`prompt_extend=true`，`duration=12`。该图只是参考，不是首帧锁；没有经批准的临时文件时不得提交。模型对文档的理解和广告语排字均需人工核验。
- HTTP 请求按文档使用异步请求头，提交成功后记录任务 ID 并查询已有任务，避免重复创建；成功结果及时在授权位置保存，核对供应商提供的有效期限。区域、计费、配额、隐私处理和水印规则在实际入口核对。该交接仅是条件规格，没有调用或成本发生。

## 验收与未决项

1. 先核对素材权利、传输及公司保密规定，确认图像合规和 PDF 文案唯一版本；确认选择路径与接收平台区域、计费、参数。
2. 比较源图与生成首帧及最终成片第 0 帧：分别记录尺寸、像素格式、颜色转换和编码；按约定口径判定严格一致与否。检查后续产品形态、标识与实图一致，光照没有改写内容。
3. 实测片长、帧率、时间轴和音轨。目标是 30 fps 的 360 帧／12 秒成片，但实际返回与最终导出均需测量；若时长不足，用经选择的停留或后期方案处理，不声称模型已保证精确剪点。
4. 在最终导出画面逐字对照 PDF 核准文本，检查文字无遮挡、阅读时间和小屏可读性。检查声音授权及与画面节奏的配合。最终以实际媒体验收，不将文字设计检查视为成片通过。

## 来源与执行边界

导演创作依据当前项目 `cineweave-director`；平台忠实交接读取宿主实际发现的 `cineweave-platform`，并以百炼官方 API 及[官方提示词指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-prompt-guide)复核。文档能力不代表当前账号、地域、界面及公司保密许可已确认。以上为设计与人工交接草稿，未读取产品图或 PDF，未提交任务，未完成真实媒体验收。

## 实际读取的本地文件 SHA-256

下列哈希按读取后当前磁盘文件计算；对于通过搜索只读取部分内容的文件也列出完整文件哈希。网络文档以链接及查阅日期记录，不伪造下载文件哈希。

- `LOCAL_TEMP\cineweave-wan-document-case-20261102.txt` — `3821096742844fea65158e7e8749c2b856b77c28b91d36ca9b8f79be2bb546b3`
> [REDACTED: local memory reference]
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\SKILL.md` — `b1c68b8861d474a36f4edf7dadb45ee7e7228f9dc0e0f501c5121e3ab50bbf8c`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\shot-direction.md` — `489709101da4dde48d01fbd4181382ef48e578183d5c6b735dc36227cdbf9667`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\storyboard-rhythm.md` — `9bfd5dd883e9817c39afd552b04a1b350104b8e32050a57deab7eeacb1469f4d`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\production-plan.md` — `8e58b107759a809803e3606086cd91e5ae2894fff0b7c3920308abaf3a0f59d0`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\scene-directing-pipeline.md` — `cb52024e10ce0ec9f1a0dfcd1dd27ea7268cef526e8457e83be8a166a0bd6019`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-sound-and-delivery.md` — `ca77595c37042bd7b21974736b50a485d983e8ea5b9bc90f74359e6a2c76d941`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-platform-adaptation.md` — `912a7e79457d4865211ba765b9e086cb1a2876f87e946ef5afe084dcf42e808e`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\prompt-detail-standard.md` — `0880a163be9679d32807688a0c434c0fa936c0fb00a5c4aae24e381d0dd92c25`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-model-practices-2026-10.md` — `4bb9481500648464bb8f0f75dcbd23780bafbe6d3bf0906093e7b0945d596408`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\ensemble-direction-and-review.md` — `1f24e64c74187b39b5fa78f1cb8f499a167fb3ca6300e35f92c08b9ff087bc8b`
- `LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\cinematic-patterns.md` — `58923acd0d4b4ecac693e3e0467990e3c64a8a31a477fc540570157ec971df70`
- `LOCAL_USER_HOME\.codex\plugins\cache\cineweave-director\cineweave-director\3.2.0\skills\cineweave-platform\SKILL.md` — `b329da3dc70f144be1f2c0742adc854b865bcd968413a82bf35bc8d1dace9ff0`
