# 百炼 Wan 3.0：12 秒新品广告条件方案

核验日：2026-11-02。状态：创作与 API 条件交接，未获得真实产品图、PDF、广告语、账号或地域信息；没有上传、生成、剪辑或验收。下面的产品拍法和节奏是可审阅提案，不是已知产品事实。原需求继续保留：成片 12 秒、现有产品图严格锁定首帧、模型读取内部 PDF、末尾逐字显示 PDF 中的精确广告语、文件不公开。

## 结论与待选路径

根据[百炼 Wan 3.0 视频 API](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)，同次请求的 `first_frame` 和 `file` 互斥；`reference_image` + `file` 允许同次使用，但参考图不是严格首帧。故无法声称单次请求同时完成这两个输入约束。文件输入还要求 `prompt_extend=true`，会改写提示词，接口的文件理解亦不保证输出可核对原文；无法保证模型画出精确字句。

优先建议供选择的 **A：两个请求加本地拼接**：前 6 秒使用产品图作为 `first_frame`，后 6 秒用同一产品图作 `reference_image`、内部 PDF 作 `file`，由模型读取；本地核对原文并在 10–12 秒确定性叠字。它保留整片范围内的原始功能目标，但不是同次生成：后段不受严格首帧锁定，也不是首段的原生续写；两段外观、光线和运动可能不连续，PDF 的理解内容也需人工核查。分段、后期排字均需用户选择；这不是已获批准的替代。

**B：单次文件参考 12 秒**，用 `file` + `reference_image`，模型可读取文件并参考产品，末尾人工排字；损失是首帧不再受到 `first_frame` 原生严格约束，文字仍依赖后期。**C：单次严格首帧 12 秒**，`first_frame` 驱动、文案由授权人员本地读取核对并后期排字；损失是生成模型没有读取 PDF。若禁止把 PDF 传至供应商，A 和 B 的文件读取均不可执行；若必须同时在同次调用满足严格首帧与读文件，则当前已核验接口不满足，不应伪装成功。后期替代也需选择。公开链接不适用于内部 PDF 的不公开要求。

## A：导演分镜与剪辑

按产品实际照片确定画幅和色彩基线；不凭空指定品类、品牌或功能。假设产品居于稳定可识别位置、可在画面留出文字区域；实际图不满足时，先调整方案，不能修改用户首帧。两段以同侧视角、主体在相近画面区域为衔接目标，色彩与光线参考实图；没有可用实图之前不能判断构图及具体机位。无人物、无旁白，声音后期统一制作。

| 成片区间 | 镜头与观众信息 | 摄影与焦点 | 切点与承接 |
| --- | --- | --- | --- |
| 0–6 秒，A1 | 现有产品原图就是第 1 帧；观众先识别真实产品，再观察质感。保留原图已有包装、字样和背景，渐进的细微光影只发生在首帧之后。 | 原图决定原始景别、视点和前中后景；摄影机固定以维持原构图，焦点保持产品。避免臆造开盖、液体、零件或功效。 | 结尾取产品姿态清楚且变化平缓的帧，保留在画面的位置与朝向；导出必须从该片原首帧开始，不加片头或淡入。 |
| 6–10 秒，B1 | 直接切到独立生成的产品近景／完整轮廓（以真实图可见范围为准），以 PDF 真实内容作为创意理解依据，不凭空添加功效或事实。 | 构图继承产品图可见的朝向与主要色调，固定机位；视线落在产品可见特征，光影缓慢变化，突出材料。 | 由静态产品视觉匹配切，不假设是连续运动；逐帧检查标签与外观，选择实际平稳窗口。 |
| 10–12 秒，B2 | 同一 B 片保留产品，旁侧保留清晰空域；本地叠加授权核对的广告语，持续显示至最终一帧。 | 固定机位与焦点，避免文字区复杂细节；对比度及行数按实际文案排版。 | 广告语不得由模型画面承担准确性；视觉重叠、遮挡与最后一帧必须验收。 |

30 fps 时间线采用半开区间：A 的源帧 [0,180) 用于成片 [0,180)，B 的源帧 [0,180) 用于成片 [180,360)，末尾文字覆盖成片 [300,360)，即总计 360 帧、12 秒。两段各请求 6 秒属于官方 API 无视频输入 2–30 秒整数范围的条件设置；返回长度、帧率及采用窗口仍需实测。若返回结果无法完整采用，重新生成或重新设计，不能默默删首帧、改时长、改变文案。无交叉淡化占帧；成片声音统一后期配乐或留白，音频授权和混音待定。

## 两次 API 的独立复制稿及输入

以下是导演母稿的忠实平台投射，不是已提交请求。任何括号内占位都先人工补全，不得当作真实 URL 或原文提交。API 的地域、模型可用性及私有传输政策须先在实际账号确认。

**A1 正文，首帧模式，建议请求 6 秒：**

```text
从已绑定的产品图第一帧开始，完整保留图中现有产品、包装、标识、主体位置、背景与构图。摄影机保持固定，产品始终位于原位置，焦点落在产品上。首帧之后让原有光影自然地缓慢变化，轻柔地显现产品现有材质与轮廓；动作克制，最后保持产品轮廓清楚、朝向稳定，便于剪接。不要添加未见过的零件、人物、夸张功效演示、额外文字或虚构品牌。无对白，无音乐。
```

绑定：一张实际产品图到 `input.media` 的 `first_frame`，不是普通参考图；由原图决定比例。`duration: 6`，`ratio: adaptive`，`audio: false`，`resolution` 请求值待依据素材与成片规格选择；`prompt_extend: false` 为控制改写的建议值，需验证真实输出。请勿假设首帧像素经视频编码、尺寸调整和色彩转换后仍逐像素不变。

**B1/B2 正文，文件参考模式，建议请求 6 秒：**

```text
参考已绑定的产品图，保持图中真实产品的外形、包装、标识、朝向与主要色调；读取所附内部文件，将文件中经支持的产品信息用于广告视觉判断，不臆造未被文件证实的功效或参数。单一固定镜头展示完整可辨认的产品，以柔和、缓慢的光影变化呈现现有材质和轮廓；产品保持清晰且稳定。构图的一侧留出干净区域供后期加入广告语，末尾保持产品和空域稳定。不要生成任何额外文字、字幕或虚构标识。无对白，无音乐。
```

绑定：`file` 为实际内部 PDF 的经批准服务可读取的输入；`reference_image` 为同一实际产品图，职责限于外形、包装与视觉参考，不是锁定首帧。`duration: 6`，`audio: false`，`prompt_extend: true` 必须开启，`ratio` 和分辨率应与 A 的实际输出及交付目标协调。禁止把 `first_frame` 加入该请求；不能将 B 当作 A 的视频编辑或续写。

**请求结构交接，示意而非可直接提交：** 两次使用同一已确认地域的 `wan3.0-video`，API 为异步创建任务，HTTP 请求需 `X-DashScope-Async: enable`；使用官方临时 OSS URL 时再按文档设置 `X-DashScope-OssResourceResolve: enable`；请求体分别是 `model`、`input.prompt`、`input.media`、`parameters`。A 的 `media` 只有 `{type: first_frame, url: 实际图像输入}`；B 包含 `{type: file, url: 已授权的实际文件输入}` 与 `{type: reference_image, url: 实际图像输入}`。不要把本地路径或说明性占位符粘贴进 API，不暴露密钥。每个真实请求保存返回 task_id 并轮询结果；有任务 ID 时先查询，避免重复提交。成功的返回 URL 和 task_id 文档列出的有效期均为 24 小时，按公司规则及时保存。请求值、平台解析值、实际返回规格分开登记，费用和两次调用额度在提交前核对。

PDF 不允许公开不等于已授权上传服务。[官方 API](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)给出的文件输入为公网 URL 或经官方上传取得的临时 OSS URL；后者会将文件交给服务处理，并非本地读取，也不自动代表符合公司政策。官方临时 URL 有效 48 小时，绑定模型和主账号；地域、账号支持、权限和保留政策必须核对，[官方临时上传说明](https://help.aliyun.com/zh/model-studio/get-temporary-file-url)提示临时存储不用于生产。若不允许服务接触文件，不传文件、不公开、不尝试改成公开网页。中国站文档所列的 PDF 限制为不超过 100 MB、50 页；图像格式、透明通道、像素和大小限制另按同一 API 文件检查，特定区域接口再次核验。

## 广告语及实际验收

广告语目前未知，不能编造。授权人员在本地从 PDF 找到准确页面及目标语句，核对字、标点、空格与换行，并确认允许将该文字用于成片；若 PDF 是扫描件，OCR 必须对照原页面人工核对。将核对结果直接复制到本地排版图层，按成片 10–12 秒显示至末帧。核对导出视频末尾画面逐字、可读性与安全边界；模型已读取 PDF 并不证明文字提取、解释或排字正确。

导出后针对首帧定义验收口径：先比对成片首解码帧与原图的画面内容、裁切、尺寸及颜色；若“严格锁定”要求逐像素一致，须先统一并确认色彩空间、位深、缩放与无损交付条件，再逐像素比较，普通有损编码不应承诺像素恒等。不能因 API 称严格首帧就宣称最终导出满足逐像素要求。依次检查总帧数、画幅及声音，检查接缝前后产品身份、标签、光线与方向，再逐字对照末尾文案；任何失败均保留未通过并按失败变量修复。

必须补齐：真实产品图和其授权；内部 PDF 的位置及是否允许传到该地域服务；准确广告语与提取／对外使用授权；地域、业务空间、模型开通、输入路径；交付画幅、分辨率和首帧严格程度；上述方案选择。当前未做媒体验收，也没有产品内容或文件读取的证据。

## 官方依据

- [百炼 Wan 3.0 视频 API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)：模式互斥、文件和图像输入、请求参数、时长、异步任务、返回结果与地域；查阅 2026-11-02。
- [万相 3.0 视频生成提示指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-prompt-guide)：模式与自然语言提示方式；查阅 2026-11-02。
- [临时文件 URL](https://help.aliyun.com/zh/model-studio/get-temporary-file-url)：临时上传与适用条件；查阅时需再次按目标地域和公司政策确认。

## 读取文件 SHA-256

以下为本次读取的本地文件哈希，不是结果媒体、授权或用户验收凭证。

- `3821096742844fea65158e7e8749c2b856b77c28b91d36ca9b8f79be2bb546b3` LOCAL_TEMP\cineweave-wan-document-case-20261102.txt
- `b1c68b8861d474a36f4edf7dadb45ee7e7228f9dc0e0f501c5121e3ab50bbf8c` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\SKILL.md
- `97dfad8a79a11ca8ca919548461d3e40f5f23a245422380af713e95b794e755b` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skill-sources\cineweave-platform\SKILL.md
- `489709101da4dde48d01fbd4181382ef48e578183d5c6b735dc36227cdbf9667` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\shot-direction.md
- `61bc1f72114f6980c23fe4077e9f0f4a5885a2f76f055a9361e537710b3d5b62` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\storyboard-rhythm.md
- `8e58b107759a809803e3606086cd91e5ae2894fff0b7c3920308abaf3a0f59d0` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\production-plan.md
- `a90f61a0254a3375e9efc1f8a1d5791b6896832ae363826bd2699918ddb138a6` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-model-practices-2026-10.md
- `d78ae24f884c453249435417e8703213a6fa7e5efbcb5973c6b78a95ac54db1c` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-platform-adaptation.md
- `da85f2ab44907d975ec86a3102f0626062ca2e5786b8ab29bc994d8d6920c660` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-timing-and-handles.md
- `cb52024e10ce0ec9f1a0dfcd1dd27ea7268cef526e8457e83be8a166a0bd6019` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\scene-directing-pipeline.md
- `ca77595c37042bd7b21974736b50a485d983e8ea5b9bc90f74359e6a2c76d941` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-sound-and-delivery.md
- `1f24e64c74187b39b5fa78f1cb8f499a167fb3ca6300e35f92c08b9ff087bc8b` LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\ensemble-direction-and-review.md
> [REDACTED: local memory reference]

