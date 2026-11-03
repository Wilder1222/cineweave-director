# 万相 3.0 新品广告：12 秒条件制作稿与接口交接

## 结论与原始目标

原目标完整保留：12 秒成片；现成产品图严格锁定首帧；模型读取不公开的内部 PDF；PDF 内精确广告语在画面末尾逐字出现。当前未取得产品图、PDF、广告语、产品类别、账号、地域、业务空间或素材上传许可；也没有生成或提交任务。

按 2026-11-02 查阅的[百炼 Wan 3.0 API 文档](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)，同一个请求内 `first_frame`/`last_frame` 与 `file`/`link` 互斥，传入不支持的组合会报错；因此原始目标**不能在该 API 的同一次生成请求中全部满足**。本地 PDF 路径不能直接当作服务端可读材料；`link` 的公开网页条件不符合“不允许公开”。模型理解 PDF 不等于返回可逐字核校的提取文本，也不保证准确排字。以下是待用户选择的条件方案，不代表已同意变更。

| 选择 | 可以保留 | 明确损失与前提 |
| --- | --- | --- |
| A：首帧优先，内部提字、后期排版 | 产品图走原生 `first_frame`；成片 12 秒；经核对广告语可原样放末尾；PDF 不需公开或上传 | **模型不读取 PDF**。由有权限人员本地提取并校对确切文案，按批准范围提供给剪辑者；如无文案或提取授权，片尾文字仍待补。确定性排字为后期处理，非模型保证。 |
| B：模型读 PDF，图片作参考 | `file` + `reference_image` 可以同次请求；12 秒；广告语经核实后后期排版 | **失去原生严格首帧控制**，参考图只能约束参考，不保证首帧就是产品图。内部 PDF 只能在公司明确允许向该服务传输和处理且目标地域、上传方式符合政策时使用；不公开不等于自动允许上传。当前账号、文件通路未核实。 |
| C：两次请求探索 | 首次使用 `first_frame`；另一次使用 `file` 读取 PDF 并将合格视频作为 `reference_video` 参考 | **第二次生成不是首帧锁定**，可改变首帧、画面和连续性，也不保证准确排字；两次请求有成本和等待，最终若要严格首帧，须经用户接受后期拼接/替换及对应质量风险，且逐帧验收。两次不等于同次满足原要求。文件仍需合法授权传输。 |

推荐 A 作为优先审阅稿，原因是保住首帧和广告语精确性，内部 PDF 可留在本地；但它明确牺牲“模型读取 PDF”，请用户选择，并非已获批准。若模型必须读 PDF，请选择 B 或 C 并先核实数据传输权限。

## 12 秒导演分镜：一个连续产品镜头

以下是可随实图修订的设计草案，不假定产品类别、外形、摆放、画幅或广告语。以实图已有构图、背景、光线、产品位置及标识为初态；若实图无可用于尾版的空区，片尾在不遮挡产品与原有文字前提下依实图调整排版。无人物、无对白，不编造产品功能、物理效果和品牌事实。

| 时间（成片规划） | 画面、机位与新信息 | 声音及出入点 |
| --- | --- | --- |
| 0–3 秒 | **S1 同一连续镜头**：第 0 帧是实际产品图。以原图实际景别、视点和前中后景为准，固定机位与焦点，不重设初态；观众先识别真实包装和品牌。产品保持原位置、轮廓、图案与颜色，原有自然光影延续。 | 从零帧开始，无前剪余量；无对白。声音计划为轻柔、克制的音乐或无声，最终由用户决定。 |
| 3–8 秒 | 延续同机位和焦点，产品仍静止；仅在不改变包装和背景几何的前提下，让已有光线轻微自然变化，吸引注意到产品。固定机位是为了保护识别信息与后期排字空间。 | 声音平稳延续；不暗示任何产品使用效果。 |
| 8–12 秒 | 同一画面平稳落到清晰尾版。8–9 秒留出可读区域，9–12 秒由后期叠加已核对的原广告语；产品和已有品牌标识清晰。广告语长度未知，三秒阅读是否充分待拿到原文后检查；不足时须返工时序或请用户选择，不截字、不缩到不可读。 | 音乐自然收束或保持无声；第 12 秒结束。时间点是剪辑目标，不是模型逐帧执行保证。 |

共享空间就是产品源图中的可见空间；未见源图，不臆测材质、方向、照明或可用空白。三个时间段是一个生成片段的节拍，不等于三个请求或可靠的模型内精确剪点。无入点余量是为了保护严格首帧；目标 12 秒生成、12 秒采用，实际若需裁头会丢首帧，需另作选择。叠字层从 9 秒进入，不覆盖第 0 帧。成片时长、生成请求时长、实际返回时长分开核查。

### A 首帧优先：独立复制稿（待图实际绑定）

```text
从输入的产品图首帧开始，完整保留图中产品的外观、轮廓、比例、颜色、包装、现有标识、摆放位置和原有背景。单个连续镜头，保持首帧原有景别、视点和构图，摄影机固定，焦点始终稳定在产品上。产品静止不转动、不变形、不改变文字和图案。沿用原图已有光线，光影只做轻微自然变化，背景与产品位置保持连续，最后画面保持清晰稳定，为片尾文字保留适合阅读的空白区域。无人物、无对白、无新文字、无新标识、无声。
```

此稿只定义视频画面；最终广告语不是模型任务，放在后期文本层。首图尚未提供，不声称已看图或已确认空白。原图若含文字必须检查生成期间是否发生变形。若以无声画面交剪，示例请求设 `audio=false`；后期可另加有授权音乐。源图严格绑定是官方 API 对 `first_frame` 的语义，最终编码像素与源图是否逐像素一致仍需实际解码核对，不能事先保证。

## API 条件交接

以下为百炼中国站官方 API 的**工作模板**，不是已就绪请求。精确模型暂用文档列出的 `wan3.0-video`；账号、地域、业务空间、模式实际开放、素材大小格式、画幅、清晰度及权限均待核。按[生成指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-guide)模型、Endpoint 和 API Key 必须同地域；示例北京 URL 只在确认为北京后采用，不能用作账号所在地的推断。官方文档描述 `duration` 2–30 秒、30 fps；12 秒是本次请求值，账号可用及实际返回仍未知。`ratio=adaptive` 是首帧模式建议，沿实际图；不默认为 16:9。以下占位符是交接说明，不是可直接提交的真实 URL 或素材。

**A 请求体结构：**请求 `POST https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis` 仅适用于实际选定北京时；异步请求需官方文档规定的 `X-DashScope-Async: enable` 和认证头；密钥由授权操作者在其安全环境配置，不放入本文或提示词。

```json
{
  "model": "wan3.0-video",
  "input": {
    "prompt": "填入上方 A 首帧优先独立复制稿全文",
    "media": [{"type": "first_frame", "url": "待提供并授权的产品图可用输入"}]
  },
  "parameters": {
    "duration": 12,
    "ratio": "adaptive",
    "audio": false,
    "prompt_extend": false
  }
}
```

`prompt_extend=false` 是本方案减少自动改写的请求选择，不保证画面或文字忠实；分辨率暂不指定，提交前据实际入口明确设置，记录请求值与实际返回。图片可用输入格式和上传路径遵循目标地域文档；不要将本机路径、私有签名链接或凭据放进公开日志。产品图的服务传输许可仍须确认；此方案无需传输 PDF。

**B 文档参考条件模板：**仅在企业批准指定地域和向百炼传输 PDF、图像后，确认该账号与模型支持后使用；不得为了调用将内部资料公开。中国站 API 文档对文件列出公网 HTTP(S) 或官方上传所得临时 OSS URL；[临时上传说明](https://help.aliyun.com/zh/model-studio/get-temporary-file-url)说明 48 小时有效、模型和主账号绑定，且不用于生产环境。该通路仍将文件交给服务处理；其他地区的可用输入方法及限制要查对应文档并实际验证，不能推定临时 OSS 必然支持。下例不得与 `first_frame` 混用：

```json
{
  "model": "wan3.0-video",
  "input": {
    "prompt": "使用提供的产品参考图片保持产品外观、颜色、包装和标识，参考提供的文档理解产品信息；制作一个单一连续的产品展示镜头，固定机位和焦点，产品在画面中清晰稳定，沿用参考图的背景和光线，只让光影轻微自然变化。最后保持产品清晰，留出片尾文字区域。无人物、无对白、无新文字、无声。",
    "media": [
      {"type": "reference_image", "url": "待提供并授权的产品图可用输入"},
      {"type": "file", "url": "待批准且适用于目标地域的 PDF 输入"}
    ]
  },
  "parameters": {"duration": 12, "ratio": "adaptive", "audio": false, "prompt_extend": true}
}
```

`file` 必须 `prompt_extend=true`，会启用提示词改写；因此正文只是画面意图，不构成广告语逐字交付保证。不得把参考图称为原生严格首帧。文档读取和图文一致性需通过实际结果确认；模型接口并不返回可供逐字校对的文档提取结果。

**C 条件两步：**第一步用 A 生成并验收素材；第二步在 PDF 传输获批后，将第一步合格片段按实际支持方式作为 `reference_video`，另加 `file`，提示词使用下述完整稿。请求 12 秒并核实输入与输出合计时长限制；源视频 12 秒加输出 12 秒为 24 秒，仍需具体入口验证。第二步不再是 `first_frame` 请求。

```text
编辑输入的视频，保持产品原有包装、颜色、外形、背景及镜头构图，参考输入文档理解产品信息；让产品展示平稳延续，光影变化轻微，画面末尾产品清晰稳定并留出片尾文字空间。无人物、无对白、无新文字、无声。
```

第二步 `media` 为 `reference_video` + `file`，`prompt_extend=true`；其余设置需按实际结果和界面再核，源片为已返回媒体而非凭空占位。若后期替换首帧，将生成片段与源图的画幅、尺寸、色彩和运动接缝对齐，严格首帧只在导出后解码核查；替换不能证明后续连续帧或生成请求仍锁定原图。

## 精确文案与成片验收

1. 有权限人员在本地从 PDF 取得完整广告语，核对每个字、大小写、标点、空格、换行和品牌要求，指定权威来源；扫描 PDF 若需 OCR，应人工对原页复核。未经提供，本稿不虚构广告语，也不声称模型已读取原文。
2. 确定性排版复制已核实原文，选择有权使用、包含全部字形的字体；如需与外部人员共享文案，先核实公司允许范围。以原文与最终渲染逐字核对，检查标点、缺字、遮挡、阅读时长和安全边距；必要时返工而非改写原文。
3. 实际生成后核实 API 请求和返回：模型、地域、模式、素材绑定、请求与返回时长、分辨率、画幅及音轨。先看首帧与源图，分别检查构图、缩放、裁切、色彩、包装和文字；若“严格”指逐像素相同，须统一尺寸和色彩空间后解码逐像素对比并记录方法，编码和色彩转换可能带来差异。只凭官方接口定义不能断言实际完全一致。
4. 逐秒审看产品是否变形、额外文字、光影突变及尾版稳定性；对照确认原文字、首帧、12 秒、可读性与音轨。合格后才交付；无返回文件时这些都保持未验证。
5. 提交成功后记录真实 `task_id`，通过同地域 `GET /api/v1/tasks/{task_id}` 查询并按官方建议间隔轮询；成功结果链接与任务查询有效期为 24 小时，按公司允许的存储策略及时保存。若提交结果未知，先查询已有任务和服务状态，避免盲目重复提交；不记录密钥或私密签名链接。

决策前仍需：选择 A/B/C；提供或在受控环境确认产品图与准确广告语；确认目标画幅、清晰度、声轨及素材传输许可；确认百炼账号、地域、工作空间、实际模型可用性；若选 B/C，确认 PDF 在该地域的合法受支持传输方式。当前仅完成方案与条件适配，没有实际素材、生成、上传、视频验收或账号验证。

## 来源与实际读取文件 SHA-256

官方资料均于 2026-11-02 在线查阅：

- [Wan 3.0 视频生成指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-guide)：模型、地域、输入模式。
- [Wan 3.0 视频生成 API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)：互斥、参数、异步查询和结果有效期。
- [上传本地文件获取临时 URL](https://help.aliyun.com/zh/model-studio/get-temporary-file-url)：地域、模型、账号和有效期限制。

下列 SHA-256 为本次实际读取的本地文件字节摘要；网页不伪造本地哈希。路径均为实际读取路径：

```text
3821096742844FEA65158E7E8749C2B856B77C28B91D36CA9B8F79BE2BB546B3  LOCAL_TEMP\cineweave-wan-document-case-20261102.txt
B1C68B8861D474A36F4EDF7DADB45EE7E7228F9DC0E0F501C5121E3AB50BBF8C  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\SKILL.md
97DFAD8A79A11CA8CA919548461D3E40F5F23A245422380AF713E95B794E755B  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skill-sources\cineweave-platform\SKILL.md
489709101DA4DDE48D01FBD4181382EF48E578183D5C6B735DC36227CDBF9667  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\shot-direction.md
61BC1F72114F6980C23FE4077E9F0F4A5885A2F76F055A9361E537710B3D5B62  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\storyboard-rhythm.md
8E58B107759A809803E3606086CD91E5AE2894FFF0B7C3920308ABAF3A0F59D0  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\routes\production-plan.md
CB52024E10CE0EC9F1A0DFCD1DD27EA7268CEF526E8457E83BE8A166A0BD6019  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\scene-directing-pipeline.md
CA77595C37042BD7B21974736B50A485D983E8EA5B9BC90F74359E6A2C76D941  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-sound-and-delivery.md
912A7E79457D4865211BA765B9E086CB1A2876F87E946EF5AFE084DCF42E808E  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-platform-adaptation.md
F295D79F5F885EC9B61AD20AE84C417C3529363F4906E9B718DEF1392F3ECBF0  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-model-practices-2026-10.md
0856CC9F67C10259A54755A470AE338E93A25DF3D031B0D1730E5429AEB55FA8  LOCAL_PROJECTS\cineweave-codex-skills\cineweave-director\skills\cineweave-director\references\optional\video-timing-and-handles.md
```
