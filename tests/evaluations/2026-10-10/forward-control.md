# 前向文字试跑：平台运动稿、局部改色、旧教程时效

试跑日期：2026-10-10（Asia/Shanghai）。执行者：独立子代理 forward_control。

本文件保存三个给定请求的实际完整回答，以及回答后观察到的问题与局限。没有输入图片，没有执行媒体生成或供应商 API，没有编写供应商执行器，没有修改源指南。没有读取调研报告或 cinematic-cases.json。文字稿和只读检查不构成媒体验证；最终稿件由根代理另行审查。

## 测试一：Runway Gen-4 单条运动提示词

### 原请求

> 给我一条 Runway Gen-4 图生视频中文运动提示词：图中左侧女人把桌上的信封递给右侧男人，摄影机不动。不要另制首尾帧。这里我没有上传图，你只能把这段当文字设定。

### 实际完整回答

下面是基于你的文字设定写的待绑定运动稿；目前没有图片，尚未检查真实画面的姿态、距离或接触条件。

```text
画面左侧的女人看向桌上的信封，用靠近信封的一只手捏住边缘，将信封抬离桌面，平稳向画面右侧的男人递出。右侧男人的视线跟随信封，伸手握住另一端；等他握稳后，女人松手，收回手臂。交接结束时，信封完整留在男人手中，两人保持各自所在位置。固定机位，摄影机全程保持静止，连续呈现这一次递信与接信。
```

Gen-4 实际图生视频仍需一张输入图。这条稿没有新增首尾帧制作步骤，之后绑定你已有的真实图片即可；若图片里的信封位置或手部状态不同，需要按实际初态调整动作起点。采用正向的“固定机位”，符合 [Runway Gen-4 提示词指南](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)；输入图依赖见 [Gen-4 使用说明](https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4-Video)。

### 回答后观察与局限

- 复制稿只描述运动，没有补写服装、脸、机位高度、光源或画幅，没有把文字设定声称为已观察画面。
- 将用户“摄影机不动”改写为正向静止摄影机表达；没有粘贴负向词库，没有更换成 Gen-4.5，也没有强制新增首尾图。
- 动作明确区分女人取信、信封向右、男人握稳、女人松手与收手，避免把道具转移压成含糊的“递给”。具体手别保持开放，因为没有源图，无法确认哪只手可达。
- “两人保持各自所在位置”是这条运动稿的设计约束，不能证明真实初态可达。若距离太远、手被遮挡或信封已在手中，需要在取得源图后修订；当前不能判定关键帧准备度。
- 这段中文稿是人工适配方案。本次没有验证中文提示在目标账号中的实际遵循度、摄影机是否完全静止或手指与信封是否连续。

## 测试二：围巾单变量改色与严格保留

### 原请求

> 角色图很好，只把深蓝围巾改成暗红，脸和手绝不能变。请给编辑稿和验收方案，并说明蒙版能不能保证区域外像素完全不变；当前没有给你原图。

### 实际完整回答

可以先交付编辑稿和验收方案。当前没有原图，围巾的边界、材质和与脸、手的遮挡关系都待检查，不能声称已编辑或已保留成功。

```text
以实际提供的原图为唯一编辑来源，仅将深蓝围巾的颜色改为低饱和暗红。保持围巾原有材质、宽度、绕颈方式、垂落位置、褶皱、边缘、明暗层次和光泽；这次修改只改变颜色。人物的脸、手、五官、表情、肤色、皮肤纹理、手指形态与手势全部保持原图状态，其余服装、背景、构图、裁切、光照和画面尺寸也保持原图状态。脸与手及全部围巾区域外像素必须与原图逐值相同。
```

蒙版本身不能保证区域外像素完全不变。对生成式编辑，它是区域引导，模型仍可能改动边缘或其他位置；OpenAI 的官方图像文档也明确说明，GPT Image 不一定精确遵循蒙版形状。提示词里的“保持不变”是验收要求，不是供应商保证。[OpenAI 图像编辑与蒙版说明](https://developers.openai.com/api/docs/guides/image-generation#edit-images)

你的“脸和手绝不能变”应按严格像素要求交接：取得原图后，精确划出允许改色的围巾区域 S，以及脸与手的保护区域 H，要求 S 与 H 不相交。优先用有选区限制的确定性改色，保持原有纹理和明暗。若外部流程采用生成式编辑，只把获准围巾区域的改色结果合成回来，S 外直接使用原图像素；羽化如有必要，也只能发生在 S 内。围巾贴近脸或手时，先人工确认混合边缘像素的归属，不能扩大编辑区侵入保护区。以上是待执行方案，当前没有真实蒙版或合成结果。

验收分为三项：

1. **颜色与结构：**围巾应读作暗红而不是鲜红，原有材质、褶皱、厚度与位置保持；查看完整画面及围巾局部，检查深蓝残留、溢色、硬边和接缝。暗红的具体色样在看到原图后固定，当前不凭空指定色号。
2. **脸、手与区域外：**在相同尺寸、坐标、通道和位深下，对原图与最终图解码后的像素逐值比较。H 内和 S 外的变化像素数都必须为 0，最大通道差也必须为 0；脸或手哪怕只变一个像素，也不满足此次硬要求。只检查看起来相似不够。
3. **交付：**保留原图、选区／保护区、编辑候选及最终合成图；采用无损输出，并避免缩放、全图调色、色彩空间转换或有损重编码再次改变保护区域。验收对象是解码后的像素，不要求整份文件字节或元数据与原文件相同。

只有拿到原图与最终图并完成比较后，才可以报告通过。当前状态是编辑设计完成，颜色效果和像素保留均待验证。

### 回答后观察与局限

- 没有把“图很好”当成自己的视觉评审结果，也没有断言围巾为羊毛、处于右肩或存在侧窗光；源图缺失的细节保持未决。
- 实际编辑稿只改颜色，没有顺带更换材质、重塑褶皱或新增脸部反光。使用通用蒙版流程时，没有把 OpenAI 的 alpha 规则推广成所有工具的通用格式。
- “脸和手绝不能变”被落实为可否定的零像素差标准，区域外与保护区都检查；没有用肉眼身份近似或高保真参数代替硬验收。
- 确定性选区改色与区域外复制，是为了满足严格像素要求提出的外部制作方案，未运行也未保证未经检查的合成工具能实现该条件。
- 严格保留会限制围巾边缘修补及对邻接皮肤的光色响应。没有原图，无法判定混合边缘是否需要保留深蓝残留，也不能承诺暗红围巾在原光照下已经协调。
- 源指南的示例允许调整必要邻接光影，但本请求只改颜色且硬锁脸手，实际回答优先继承更窄的用户授权范围。

## 测试三：旧 Sora 2 教程与新 GPT Image 参数

### 原请求

> 今天是2026-10-10，请按 OpenAI 旧 Sora 2 教程交接一个20秒API生成方案，另外说明新 GPT Image 能否直接沿用 gpt-image-1 的 input_fidelity=high。

### 实际完整回答

按 2026-10-10 的官方 OpenAI documentation 核对结果，Sora 2、Sora 2 Pro 及 Videos API 已于 2026-09-24 停用。因此这份请求不能交接为今天可运行的 Sora 2 API 生成方案；旧教程中的 20 秒档位属于历史能力，不能证明当前接口仍可提交。官方停用表没有列出这项服务的推荐替代。[OpenAI Sora 2 与 Videos API 停用记录](https://developers.openai.com/api/docs/deprecations#2026-03-24-sora-2-video-generation-models-and-videos-api)

仍可交接一个保留旧教程镜头、节拍和光色拆解方法的 20 秒创作稿。你没有提供影片主题，以下暂用“雨停后的窗边纸风车”作为可替换测试设定：

```text
二十秒单镜头，横向16:9，摄影写实。固定机位以桌面高度略俯拍窗边木桌，一只素色纸风车立在小陶杯里，窗玻璃带着刚停雨后的水滴；画面完整容纳风车叶片，窗外是柔和虚化的庭院。风车纸面、杯口与桌面纹理清楚，窗外保持柔和景深。灰冷天光从窗外照入，木桌呈温和棕色，亮部柔和，整段保持同一光色基线。
0至4秒：纸风车静止，玻璃上的一颗水滴缓慢向下滑；叶片完整可见。
4至12秒：一阵从窗边进入的轻风让纸叶轻颤，风车由慢到稍快连续旋转，轴心与杯子稳定留在原位。
12至17秒：风逐渐减弱，风车转速自然下降，旋转幅度和速度连续变化。
17至20秒：风车缓慢停住，杯子和木桌稳定，保留可读的结束状态。摄影机全程固定，同一连续镜头呈现这一过程。
声音意图：轻微窗边风声和稀疏檐下滴水声，风声随叶片启动增强、随减速降低；安静的环境底声贯穿。声音由后续实际支持的流程单独确认和制作。
```

交接状态如下。时间段是导演设计，不能当作逐帧控制或生成成功证明。

| 项目 | 本次交接 |
| --- | --- |
| 作品目标 | 20 秒成片；16:9 为暂定设计值 |
| 创作输入 | 上述完整文字稿；没有已上传参考资产 |
| 指定供应商路径 | Sora 2 / Videos API；当前执行阻断 |
| API 请求、账号与返回任务 | 没有提交，没有任务 ID，没有返回媒体 |
| 后续可行性核验 | 如要继续实际制作，先确认仍在服务的视频 API 的精确模型、模式、时长、画幅和声音能力；不自动替换供应商 |
| 20 秒验收 | 用真实成片测量长度；完整播放并检查启动、旋转、减速、停稳与声画关系。若外部模型只能分段，需明确改为分段装配并复查接点，不能声称原生单次 20 秒已支持 |

新 GPT Image 也不能直接沿用 `gpt-image-1` 的 `input_fidelity=high`，需要先绑定精确模型：

- **`gpt-image-2`：**官方明确要求省略 `input_fidelity`；它自动按高保真处理图像输入，这个参数不能用来改变其行为。`quality=high` 是输出质量设置，不能替代输入保真或证明编辑区域外完全不变。[GPT Image 2 输入保真说明](https://developers.openai.com/api/docs/guides/image-generation#image-input-fidelity)
- **今天文档中的 `gpt-image-2.5-sunburst` / `gpt-image-2.5-flare`：**当前图像生成主指南已将它们列为新集成模型，编辑 API 也列出了这两款及对应快照。该 API 的 `input_fidelity` 参数段只明确列出 `gpt-image-1`、`gpt-image-1.5` 的 high/low，以及 mini 的 low，没有建立 2.5 可传 high 的支持证据。因此本次交接不复制这个旧参数；2.5 的保真行为和请求支持仍要按精确模型与最终接口说明核对，不能把 2 的全部参数自动继承给 2.5。[当前 Image generation](https://developers.openai.com/api/docs/guides/image-generation)、[Create image edit 参数](https://developers.openai.com/api/reference/resources/images/methods/edit)

以上是创作和参数核验交接，没有执行视频或图像 API，也没有实际媒体效果的验证。

### 回答后观察与局限

- 先读取官方停用正文，阻止把旧 Sora 2 教程交成今天可执行的请求；旧教程仍用于镜头与节拍的方法，不被当成服务可用性的证据。
- 20 秒创作稿仍完整交付；没有主题时采用了可撤销的物件测试设定，没有伪造人物参考、上传槽位、生成回执或新的可用供应商。
- 当前官方 Image generation 主文档已写 2.5，Image prompting / cookbook 仍主要写 2。试跑没有把“新 GPT Image”未经分辨地固定为 2，也没有从“支持高保真”推导出支持同名字段。
- API 的 2.5 model 枚举已更新，但 input_fidelity 的文字只明确列旧模型与 2；本次支持结论是“未取得 2.5 high 参数支持证据”，不是“已实测 API 一定报错”或“2.5 已验证像素不变”。
- 官方 Markdown 获取器访问 edits 方法页返回 404，而同一 URL 的官方 HTML 页可以读取完整参数。证据范围记录为 HTML 参数正文，不把 404 当成 API 不存在。
- 供应商执行可行性为阻断；20 秒、固定摄影机、旋转稳定和声画同步仍未经过媒体试验。

## 实际读取的来源与指南

仓库指南均从当前 checkout 读取，路径以仓库根目录为基准。没有加载整套契约或调查案例库。

| 仓库指南 | 本次使用范围 |
| --- | --- |
| skills/cineweave-director/SKILL.md | 简体中文、先交付成稿、无图证据边界、非执行职责、按需加载 |
| skills/cineweave-director/references/optional/prompt-detail-standard.md | 表达原则、人物表演、图生视频过程和交付前检查；读取对应章节和章节索引 |
| skills/cineweave-director/references/optional/video-platform-adaptation.md | 保留用户图生视频路径、精确平台/模型/界面/模式、历史能力边界 |
| skills/cineweave-director/references/optional/aigc-control-and-evaluation.md | 局部改色、蒙版保留、Runway 正向运动稿、Sora 停用、新模型参数核验 |
| skills/cineweave-director/references/routes/image-prompt.md | 原事实继承、单变量变体、正文与平台控制分开 |
| skills/cineweave-director/references/routes/review-repair.md | 没有真实图像/视频时不建立媒体通过结论、硬失败和未知项不平均掉 |
| skills/cineweave-director/references/routes/production-plan.md | 非执行交接、必要资产、能力阻断、真实返回清单 |
| skills/cineweave-director/references/optional/ensemble-direction-and-review.md | 两人交接的触发与回应、文字评审范围、只读检查边界 |
| skills/cineweave-director/references/optional/video-sound-and-delivery.md | 20 秒视频与声音意图、返回媒体验收、未知参数不虚构 |

额外使用系统 OpenAI Docs skill（C:/Users/ww/.codex/skills/.system/openai-docs/SKILL.md），以官方文档核对产品状态与参数。第一次通用网页搜索后发现已有专用 OpenAI documentation search/fetch 能力，随后使用专用工具搜索并读取正文；edits 方法页 Markdown 404 时改读官方 HTML。这个工具发现顺序是本次工作流局限，没有影响停用和参数结论的直接正文依据。

本次实际访问的官方外部来源（访问日期均为 2026-10-10；访问日期不表示发布或更新日期）：

| 来源 | 读取范围与用途 |
| --- | --- |
| https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide | HTML 正文；正向描述、运动主导、多人位置指代 |
| https://help.runwayml.com/hc/en-us/articles/37327109429011-Creating-with-Gen-4-Video | HTML 正文；Gen-4 输入图依赖，没有用较新 Gen-4.5 替换指定模型 |
| https://developers.openai.com/api/docs/deprecations#2026-03-24-sora-2-video-generation-models-and-videos-api | 专用 fetch 返回停用章节全文；2026-09-24 关闭记录 |
| https://developers.openai.com/cookbook/examples/sora/sora2_prompting_guide | 专用 fetch 正文；归档提醒、历史 20 秒档位、镜头和节拍方法 |
| https://developers.openai.com/api/docs/guides/image-generation | 专用 fetch 正文，另以 HTML 查定位；2.5 主指南、蒙版局限、2 的 input_fidelity 段 |
| https://developers.openai.com/api/reference/resources/images/methods/edit | 专用 fetch 返回 Markdown 404；最终读取官方 HTML 的 model 与 input_fidelity 参数正文 |
| https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst | 专用 fetch 模型全文；精确模型 ID 与 2026-09-08 快照 |
| https://developers.openai.com/api/docs/models/gpt-image-2.5-flare | 专用 fetch 模型全文；精确模型 ID 与 2026-09-08 快照 |

初始搜索结果仅用于定位文档，不作为上述最终结论的唯一依据。未读取当前供应商账号界面，账号访问、实际参数接受与输出质量均未试验。

## 文字评审工作表与只读检查

以下仅检查测试一的已写运动稿。镜号 T1 是本文件的临时工作引用。由于没有源图，实际空间可达性和源初态连续性保留 unknown；不把文字动作完整性推广成真实媒体通过。根代理独立审查仍待进行。

```json
{
  "source": { "type": "prompt", "id": "forward-control-T1", "version": 1 },
  "mode": "focused",
  "roles": ["prompt", "staging", "continuity"],
  "shotIds": ["T1"],
  "reviews": [
    {
      "role": "prompt",
      "shotId": "T1",
      "status": "pass",
      "criterion": "一条中文运动稿保留左女右男、取信、交接和固定摄影机，不引入首尾帧制作。",
      "observation": "测试一复制稿明确女人取信抬离桌面向右递出，男人握稳后女人松手；正文采用固定机位、摄影机保持静止。",
      "sourceLocator": "本文件 / 测试一 / 实际完整回答 / text复制稿"
    },
    {
      "role": "staging",
      "shotId": "T1",
      "status": "unknown",
      "criterion": "真实初态允许两人直接交接，关键握持清晰可见。",
      "observation": "未提供图片，无法确定人物距离、手臂可达范围和前景遮挡。"
    },
    {
      "role": "continuity",
      "shotId": "T1",
      "status": "unknown",
      "criterion": "实际输入图与信封在桌上的动作起点一致。",
      "observation": "仅取得用户文字设定，没有真实首帧，不能核验实际道具归属和动作初态。"
    }
  ],
  "prompt": {
    "text": "画面左侧的女人看向桌上的信封，用靠近信封的一只手捏住边缘，将信封抬离桌面，平稳向画面右侧的男人递出。右侧男人的视线跟随信封，伸手握住另一端；等他握稳后，女人松手，收回手臂。交接结束时，信封完整留在男人手中，两人保持各自所在位置。固定机位，摄影机全程保持静止，连续呈现这一次递信与接信。"
  }
}
```

实际运行方式：使用 Node.js 通过标准输入导入随包 checkShotReview，直接读取本文件的 JSON 工作表并调用检查器；没有新建临时文件。检查进程退出码为 2，表示输入有效但存在未决项。

实际结果：valid=true，scope=plan_only，coverageComplete=true，reviewComplete=false；expectedRows=3，missing=[]，errors=[]。运动稿为 142 个非空白 Unicode 码点；没有设置字数限额。未决项为 T1/staging 与 T1/continuity，状态均为 unknown。该结果不能证明 Runway 接触成功、围巾编辑成功或任何供应商可执行。

## 仓库指南读取阶段与完成阶段 SHA-256

读取阶段在 12:40:09–12:40:42 +08:00 登记并读取/复读；SKILL.md 与 video-platform-adaptation.md 最初先读，随后在 12:40:42 同一读取操作中复读并登记字节哈希。prompt-detail-standard.md 按章节读取，其哈希对应整个文件。完成阶段在 2026-10-10 12:45:06 +08:00 复核。下表每行的读取阶段与完成阶段哈希相同，本次未发现文件版本差异；这只绑定该时段读取的源文件，不覆盖其他代理以后可能进行的修改。

| 仓库相对路径 | 读取阶段 SHA-256 | 完成阶段 SHA-256 |
| --- | --- | --- |
| skills/cineweave-director/SKILL.md | 50583CC150F3784A8FCFC9BAA93388AD9F87349A12FEE33307DE8C33591B4809 | 50583CC150F3784A8FCFC9BAA93388AD9F87349A12FEE33307DE8C33591B4809 |
| skills/cineweave-director/references/optional/video-platform-adaptation.md | D190AB0997B33428F9E21EADF293DCD5B9395017A03C9260A2CB6DB98965FFAE | D190AB0997B33428F9E21EADF293DCD5B9395017A03C9260A2CB6DB98965FFAE |
| skills/cineweave-director/references/optional/aigc-control-and-evaluation.md | BBA32448D4D9B24A5F42A82CC0D3997E0307FD917273CEE7E28B3443649A91D1 | BBA32448D4D9B24A5F42A82CC0D3997E0307FD917273CEE7E28B3443649A91D1 |
| skills/cineweave-director/references/routes/image-prompt.md | 8875D78177EDCE7AB4AAEA763BF0F6D3BDC6216EE1ACF3C215AAB661B96E5C08 | 8875D78177EDCE7AB4AAEA763BF0F6D3BDC6216EE1ACF3C215AAB661B96E5C08 |
| skills/cineweave-director/references/routes/review-repair.md | 5C12254507BAE0E4CB084B2B62EB87374FD775043C6BE8071B3C21E758D258E0 | 5C12254507BAE0E4CB084B2B62EB87374FD775043C6BE8071B3C21E758D258E0 |
| skills/cineweave-director/references/routes/production-plan.md | F0FD1A1AD40A235EA9817A699D6A0D3CFAA78EC88291BC3F7B5991963858D3E5 | F0FD1A1AD40A235EA9817A699D6A0D3CFAA78EC88291BC3F7B5991963858D3E5 |
| skills/cineweave-director/references/optional/prompt-detail-standard.md | 0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59 | 0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59 |
| skills/cineweave-director/references/optional/ensemble-direction-and-review.md | A3F41E181A4382ED4A23835C696797837FAC9CFC939FC3F86203443CAB680BAE | A3F41E181A4382ED4A23835C696797837FAC9CFC939FC3F86203443CAB680BAE |
| skills/cineweave-director/references/optional/video-sound-and-delivery.md | 4A60146D81FC2092FB7BB6E18D9B1CD4E8AC8CDF09B11994F5A98B86FAB2A715 | 4A60146D81FC2092FB7BB6E18D9B1CD4E8AC8CDF09B11994F5A98B86FAB2A715 |

实际读取并调用的检查器为 skills/cineweave-director/scripts/check-shot-review.mjs：读取阶段登记哈希（2026-10-10 12:42:30 +08:00）与完成阶段（12:45:06 +08:00）均为 BB69F60D8794F3329BC4B7AF772D05AD01A28C001C7345F1DE63BFA1E3D7D1C2。
