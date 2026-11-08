# Wan 3.0 内部 PDF 广告盲测独立评审

日期：2026-11-02。审阅对象 `D:/Temp/cineweave-wan-document-baseline-20261102.md`，SHA-256 `19cd3aabe61f7ff19c743c13b2244faf43c155369245ee543680f74d6158e85f`；原题 `D:/Temp/cineweave-wan-document-case-20261102.txt`。以下为未调用供应商模型的文字和官方文档复核。

## 结果：部分通过，不能作为跨区域完整接口方案

1. **原题及互斥判断：通过，限定所引 Wan 3.0 API。** 原题要求产品图严格首帧、模型读取仅本地且不得公开的 PDF、末尾原样显示精确广告语、12 秒；账号及区域不明。盲测正确说明当前没有文件、上传或实际任务，保留用户目标；[中国站视频生成指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-guide)及[国际站视频生成指南](https://docs.modelstudio.console.alibabacloud.com/en/model-studio/wan3-video-generation-guide)均说明 `first_frame`/`last_frame` 与 `reference_xx`/`file`/`link` 互斥。`file` 和 `reference_image` 的组合可见于各自 API 的素材组合示例；但后一种参考图不是首帧锁。不得把该接口约束扩大为其他产品一切模式的能力断言。
2. **重要问题：将中国站临时 OSS 文件输入泛化到区域未知情况。** [中国站 API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)对 `file.url` 列公网 HTTP(S) 和按上传流程获取的临时 `oss://` URL；对图片还列 Base64。[国际站 API 参考](https://www.alibabacloud.com/help/en/model-studio/wan3-video-generation-api-reference)目前对 `file.url` 只列公网 HTTP(S)，图片列公网 HTTP(S) 和 Base64，未列同一临时 OSS 路径。盲测引用中国站后未给临时 OSS 标明文档范围，B、C 和图片交接易使读者误以为不同账号区域均已支持。应明确列出两站证据差异；中国站临时 URL 也必须核实实际账号、入口、许可和访问权限；国际站是否存在其他满足保密要求的私有文件输入路径仍未证实。题设禁止公开，不能通过公网 URL 绕过限制。未列出不等于证明国际站技术上绝无其他私有路径。
3. **重要问题：C 路径没有证明广告语可由视频 API 提取为可核文字。** 盲测写“先以文件模式理解 PDF”及“模型提取需要人工核对”，但所引 Wan `file` 模式是参考文件生成视频，文档响应为视频及任务信息；它没有建立可供后期精确排字的独立文本提取响应。不能把模型“理解文件”当作已取得精确广告语。建议将广告语提取与逐字校对交给授权的本地人员或工具；如需其他模型/文档服务，必须另行核实接口与处理授权，注明额外调用和数据传输。若 C 仅用于依据文件生成参考视频，也须表述该用途及其不构成文案提取。
4. **保密条件：基本通过，区域细节待修。** 盲测未要求公开 PDF，说明临时 URL 并非“留在本机”，外传须确认公司规定、供应商处理及授权；产品图 Base64 也会传给供应商。原题“不允许公开”本身并不等于禁止所有授权外传，也不等于已批准外传；A 本地提取、B/C 外传均应依各自许可条件决定。不存在真实文件、平台或许可时不能称其已可提交。
5. **首帧、文案与创作：条件稿通过，成片未验证。** A 明确牺牲“模型读取 PDF”，单独后期排版并逐字核对；B 牺牲严格首帧；保留原目标且未声称备选批准。`first_frame` 的官方角色成立，但缩放、色彩及编码后交付文件逐像素相等须实际测量。原广告语和产品图未知，稿件未编造内容；9–12 秒为暂定阅读窗口，原文过长需调整。素材未给时，固定机位、光影与后期音乐是条件性的设计提案，其艺术适配与成片可执行性尚未证明。
6. **API 和音频：有界通过。** 在已核实的 `wan3.0-video` 文档范围内，12 秒处于无视频输入 2–30 秒整数范围，`audio=false` 关闭原生音轨，文件/网页输入需 `prompt_extend=true`，异步请求需读取任务 ID 并查询。画面后期配乐与原生无声并不冲突。真实账号开通、地域、素材输入及成功返回均未知；参数不可在未经核对的其他宿主照搬。
7. **实际读取来源与测试归属：需明确限定。** 输出列示当前工作树中的 director、路由和模型实践文件；它读取的 `cineweave-platform/SKILL.md` 却位于 `C:/Users/ww/.codex/plugins/cache/cineweave-director/cineweave-director/3.2.0/skills/cineweave-platform/SKILL.md`，SHA-256 `b329da3dc70f144be1f2c0742adc854b865bcd968413a82bf35bc8d1dace9ff0`。审阅时当前项目 `skill-sources/cineweave-platform/SKILL.md` 与其同步派生 `skills/cineweave-platform/SKILL.md` 均为 `97dfad8a79a11ca8ca919548461d3e40f5f23a245422380af713e95b794e755b`，不是同一文件字节。故这是当前 director 结合已安装旧 platform 入口的离线混合执行，不能作为当前项目 platform 已被实际读取或宿主自动激活的证明。哈希只标识读取文件字节，不单独证明每条规则有效执行。

建议先修订地区限定和 C 的文本提取路径，再以相同原题、明确当前项目作者源/同步派生的固定哈希进行独立复测。真实媒体、图像内容、PDF 文案、版权及最终视觉验收仍需实际证据。
