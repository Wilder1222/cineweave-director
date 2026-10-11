# 2026-10-10 专业方法增强独立审查

审查者：独立子代理 `independent_review`。日期：2026-10-10（Asia/Shanghai）。本报告只记录文字、来源与路由审查，不执行供应商生成、引擎渲染、采集、剪辑或媒体验收。源文件未由本审查者修改；唯一新增文件为本报告。

当前读取范围内没有未解决的 P1／P2 问题。发现一处 P2 示例初态矛盾，根代理已修正，本审查者已复读确认。没有将风格偏好、未取得媒体或来源访问失败记成已证实缺陷。

## 范围与方法

全文阅读本地 `SKILL.md`、`aigc-control-and-evaluation.md`、`rendering-quality-workflows.md`、`cinematography-craft.md`、`portrait-natural-human.md`、`video-performance-direction.md`、`style.md`、`camera-previsualization.md`。对新增指南检查真实能力、版本适用范围、方法可执行性、过度硬规则、摄影参数、色管、表演与路由衔接。

对 character／image-prompt／production-plan／review-repair／shot-direction／scene 路由阅读本轮专业方法链接与相关语句；对 `reference-lifecycle.json` 阅读新增条目及对应旧条目。打开并使用仓库现有 `scripts/markdown-links.mjs` 检查上述 14 个 Markdown 文件的本地目标与锚点。实际 Node 进程退出码为 0，输出为：

```json
{"markdownFiles":14,"links":170,"fragments":33}
```

这只确认本地链接与片段可达，不证明外部 URL 永久可访问、平台兼容或媒体质量。两份新增资料均由技能入口可达，控制指南由图像、制作与修复路由可达，渲染指南由风格、图像、制作、修复及预演资料可达；加载清单有对应 optional 条目。未发现只能通过直接知道文件名才能到达的新增指南。

已全文阅读 `forward-control.md` 的三项完整回答、观察与工作表，随后复读其实际检查结果和哈希段。已全文阅读 `forward-production.md` 的三项完整回答及初版检查段，随后复读其新增版本差异说明与实际执行段至第 274 行。没有替这些作者重复运行工作表检查，也没有把其检查器的 `plan_only` 状态转换为媒体通过。

## 实际发现及处理

### IR-01 — P2：表演示例初态已经停手，却再次停止同一动作（已修正）

- **原证据：**`video-performance-direction.md` 第 131 行把初态写为双手放在桌边；第 137 行先写“开头他双手停在桌边”，随后因同伴转身“停止左手整理纸边的动作”。原稿 SHA256 为 `CF02B214CA2FB2AA499FA9750CD3385D418BF05BCA2EB8BA2A2CB09CA25B7E1D`。
- **影响：**录制者或生成流程无法由这个初态判断左手是否正整理纸边；停止动作的刺激缺少可见前态，削弱本示例要展示的刺激→回应因果。
- **建议：**初态明确左手正沿桌面整理纸边、右手静放桌边，再由画外转身触发左手停下；演员任务与复制正文一致。
- **处理与复查：**根代理接受并修改第 131／137 行。本审查者复读新稿，左手整理→停手、右手静放→说完后示意、左手继续接触桌面的顺序一致。当前 SHA256 为 `0CE7992E07734DAB928F461FA0C022932ADFF8BB33AD5E3BB471B75C7C3C523F`。文字矛盾已消除；未检验真人排练或生成结果。

## 重要检查结论与证据

### 能力与版本边界

`SKILL.md` 第 3／47／80 行及两份新增指南开头继续将职责限定为创作、外部交接和只读检查。引擎输出、控制图、供应商参考输入和最终媒体分开；没有添加隐含执行器、收费生成或伪回执。新增指南的日期是来源查阅日期，未把它当成项目实测日期。

独立复核的官方或原作者正文支持以下高风险边界；没有据功能页推导当前账号可用或某个输出已通过：

| 核对项 | 本次正文依据与判断 |
| --- | --- |
| Act-Two 两类角色输入 | [Runway 官方说明](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two)区分图像的身体／手势迁移与自动环境／摄影机运动、角色视频保留原有身体／摄影机运动并关闭手势控制，还说明短角色视频的往返循环。指南第 52–67 行保留了这些适用条件。 |
| MetaHuman 采集 | [单目视频采集指南](https://dev.epicgames.com/documentation/metahuman/metahuman-animator-video-capture-guidelines-in-unreal-engine)分别覆盖面部、身体及组合采集；[演员指南](https://dev.epicgames.com/documentation/metahuman/metahuman-animator-performer-guidelines-in-unreal-engine)列出遮挡、浓妆与成年面部限制。第 69 行未将采集光或输入规格强加给成片。 |
| Midjourney 参考职责 | [Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)当前正文限定 V7，并指向 V8.X Edit Model。控制指南第 27 行明确未刷新全部历史能力表，不将 V7 `--oref` 直接套入 V8。 |
| 控制图与外观条件 | [IP-Adapter 固定源码](https://github.com/tencent-ailab/IP-Adapter/blob/62e4af9d0c1ac7d5f8dd386a0ccf2211346af1a2/README.md)支持文字／结构条件组合并提醒非方形输入的中心裁切；[ComfyUI 官方节点说明](https://docs.comfy.org/tutorials/controlnet/controlnet)分别列出 strength、start_percent、end_percent。指南没有给万能权重或跨基础模型兼容承诺。 |
| 蒙版与编辑保留 | [OpenAI Image generation](https://developers.openai.com/api/docs/guides/image-generation#edit-images)说明蒙版是引导，可能不精确遵循形状，且仍有文字、跨次一致性与精确构图限制。控制指南第 31–41 行保留这些限制并检查区域外。 |
| Sora 2 时效 | [OpenAI 停用章节](https://developers.openai.com/api/docs/deprecations#2026-03-24-sora-2-video-generation-models-and-videos-api)列明 Sora 2 系列与 Videos API 的关闭日为 2026-09-24。第 51 行没有把旧教程列成今天可执行候选。 |
| Veo 方言冲突 | [Google 当前最佳实践](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice)明确建议对白使用冒号、避免引号，页尾更新日为 2026-10-07。指南将它记录为有范围的语法适配，不改写用户准确台词或推广给所有系统。 |

OpenAI 内容使用系统 OpenAI Docs 技能与官方正文核对。专用 fetch 对 edits 方法页返回 Markdown 404；随后读取同一 URL 的官方 HTML 参数正文。不能将这个文档提取失败当成编辑 API 不存在。

### 摄影、色管与渲染

未发现快门角公式、f／T 值分工、机位与透视、焦距与取景之间的明显错误。第 85 行的 24 fps／180°／约 1/48 秒计算自洽；纯生成稿明确这些数值只能是意图，除非实际接口有已核实控制。焦点与光照规则围绕可读信息、接触及实际光源，没有把浅景深、180°或固定停稳设为所有镜头的硬要求。

[UE 坐标空间](https://dev.epicgames.com/documentation/unreal-engine/coordinate-system-and-spaces-in-unreal-engine)支持左手系、Z 向上、X 向前、Y 向右的说明；预演指南同时要求单位、相机局部轴、四元数顺序、视场裁切与帧边界，未把交换轴标签当成完整变换。

[MRQ 图像设置](https://dev.epicgames.com/documentation/unreal-engine/cinematic-rendering-image-quality-settings-in-unreal-engine?lang=en-US)区分引擎预热、GPU 提交及渲染历史，快门时刻也可能访问当前帧前后；[Path Tracer](https://dev.epicgames.com/documentation/en-us/unreal-engine/path-tracer-in-unreal-engine)说明 Reference Motion Blur 会改变累积与去噪关系。新指南第 66／68 行保留这些差异，没有把一种模式的采样数推广成默认。

[UE 渲染设置](https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematic-render-settings-and-formats-in-unreal-engine)支持 OCIO／Tone Curve 分工与 EXR 受设置影响的说明；[ACES Output Transform](https://docs.acescentral.com/system-components/output-transforms/)说明场景参照数据面向具体显示条件转换。指南将输入解释、工作空间、创意处理、观察／输出变换和烘焙状态分开，没有把 EXR、AgX、LUT 或位深直接等同于 ACES／HDR。

Blender 4.4 采样页与 `sr/4.5` 色管页在本审查环境的 web 提取分别返回 402／Internal Error，没有取得独立可读正文。因此本报告不声称重新验证了这两页的全部版本文字。指南已标出各页版本、语言及实际工程需另核对；所写 AgX 与 ACES 的边界没有发现逻辑矛盾。这个访问限制保留为未验证项。

### 方法强度与完整回答

没有发现本轮将固定器材、采样数、风格、肤质瑕疵、单人出镜或固定停稳推成全局强规则。单变量要求用于诊断对照；整体创意探索明确允许多维变化但不作单因果结论。多处“文字不等于媒体”的重复承担各路由独立加载时的证据边界，不构成需要删去的重要缺陷。

`forward-control.md` 三项回答完整且保留用户范围：Gen-4 只给一条运动稿，不额外制首尾帧；围巾只改颜色，未继承源示例中的羊毛／右肩／侧窗光事实；旧 Sora 路径阻断时仍给完整 20 秒创作稿。

严格像素保留方案明确区分生成蒙版与确定性选区改色／区域外原像素复制，并把保护区及区域外零差、无损交付、边缘归属列为待执行验收。没有声明已经达到零差。新图像参数也未偷换为供应商保证：[图像主指南](https://developers.openai.com/api/docs/guides/image-generation)对 `gpt-image-2` 明确要求省略 `input_fidelity`；[edits HTML 参数正文](https://developers.openai.com/api/reference/resources/images/methods/edit)已经枚举 2.5 型号，但 input_fidelity 段仍只明确旧模型 high／low 与 2 省略。试跑对 2.5 使用“尚未取得 high 字段支持证据”，不是声称已实测报错。没有需要修正的能力结论。

`forward-production.md` 三项回答同样完整：半身肖像分别给可独立复制稿，解释保持人物大小时机位与焦距共同改变，未填假数值；UE 闪烁按环节、对象和切入历史定位，不默认 64，色管只规划 SDR；八秒钥匙稿从擦拭初态开始，门响先于停擦，确认来人后才开口，钥匙落掌并承重后松手，对手随后合指，未额外要求生成媒体。未发现动作自洽或明显参数／色管错误。该稿自然节奏是否在八秒内成立仍待真人排练或媒体判断。

两份试跑的检查结论均保留 `plan_only` 和素材缺失边界。control 记录两个 unknown，production 的六视角 pass 只是文字关系审查。独立阅读完整回答没有发现它们把脚本结果当成像素、口型或真实表演通过。

## SHA256 与并行变化

下表为实际读取并登记的文件字节哈希；路由只读了上述相关段落，哈希仍对应整份文件。主要源文件在 12:46:53 +08:00 复核。哈希绑定此次检查版本，不覆盖报告完成后其他代理的修改。

| 仓库相对路径 | 本次复核 SHA256 |
| --- | --- |
| skills/cineweave-director/SKILL.md | 50583CC150F3784A8FCFC9BAA93388AD9F87349A12FEE33307DE8C33591B4809 |
| skills/cineweave-director/references/optional/aigc-control-and-evaluation.md | BBA32448D4D9B24A5F42A82CC0D3997E0307FD917273CEE7E28B3443649A91D1 |
| skills/cineweave-director/references/optional/rendering-quality-workflows.md | 5495AB7203ADBD38BE111C3E4B59172AC60E616B19A3418A071AACFE96C12588 |
| skills/cineweave-director/references/optional/cinematography-craft.md | 915545176B1A1719956FD72D7D757159ACA947578D2FB01DBD00AAB6036597E9 |
| skills/cineweave-director/references/optional/portrait-natural-human.md | A370C4CA4E05A31576D99E262DD52924667F199D205C9087A6104D709B8D1D43 |
| skills/cineweave-director/references/optional/video-performance-direction.md | 0CE7992E07734DAB928F461FA0C022932ADFF8BB33AD5E3BB471B75C7C3C523F |
| skills/cineweave-director/references/routes/style.md | F325D045A23A416B3EBF8C19FEA942C79580A4BE053ED78A3368A7FA3B801231 |
| skills/cineweave-director/references/optional/camera-previsualization.md | DDE1E7E5DB24BA047FF2BDD1B8AAC4FCF414AA29CF45B3327DF6BF4226ED0669 |
| skills/cineweave-director/reference-lifecycle.json | D9537B7F0AFAB013243899048AFE282181CC253E4D2983607818A1898617D233 |
| skills/cineweave-director/references/routes/character.md | 511F7B9BB512821F57F7676EAB9989161B8F6542FC1F54713138846A60A41E23 |
| skills/cineweave-director/references/routes/image-prompt.md | 8875D78177EDCE7AB4AAEA763BF0F6D3BDC6216EE1ACF3C215AAB661B96E5C08 |
| skills/cineweave-director/references/routes/production-plan.md | F0FD1A1AD40A235EA9817A699D6A0D3CFAA78EC88291BC3F7B5991963858D3E5 |
| skills/cineweave-director/references/routes/review-repair.md | 5C12254507BAE0E4CB084B2B62EB87374FD775043C6BE8071B3C21E758D258E0 |
| skills/cineweave-director/references/routes/shot-direction.md | 25B64A10E69E198F0951B97AC2942B1B399998EAD7D6868428E8D2E181CA1207 |
| skills/cineweave-director/references/routes/scene.md | EF10535A31D8AEACF7465957AD995C47B1389F5B3B5FE9096E77682F151EA6E4 |
| scripts/markdown-links.mjs | D78003CAFF44CCBD1D974AD95F8C77E662A18C1D5D3051B5E88D271850F19442 |
| tests/evaluations/2026-10-10/forward-control.md | A53F9403EA07B943A086C8FDDFE50C778ABE2B3C67E4E766B5CD215E58C7D0EB |
| tests/evaluations/2026-10-10/forward-production.md | D2828B6228F2D650E32CC7B73873950F14BED7CF44AFB6206FAFE7914B8D7ADD |

实际观察的版本变化：

- rendering-quality-workflows 初次全文版为 `B2120C89E7CBDC382DFB4A048C5ED4C0DCEE5AC6F614E28FD82D572E200D253D`（117 行）；根代理固定 Unity 源码链接并增加两种钥匙交接路径例后，本审查者重新全文阅读 128 行当前版。
- video-performance-direction 初次全文版为 `CF02B214CA2FB2AA499FA9750CD3385D418BF05BCA2EB8BA2A2CB09CA25B7E1D`；IR-01 修正后复读第 127–142 行，哈希如表。
- forward-control 初读 187 行版为 `357D9FA7E9C9C853EC76D99BBBAA161603D58FB10CA08F2508FB17C70DA4FED2`；追加检查与哈希记录后复读至 207 行，哈希如表。
- forward-production 初读 248 行版为 `10FD810C1ADB337F3E469358CF26F242A2C66F77BC59B0A41309E4A0C7981DD8`；12:48:04 +08:00 登记完成版并复读第 140–274 行的变化说明及执行结果，哈希如表。其作者如实保留成稿时的旧指南哈希，没有假装回答已使用后来新增例子。

另实际读取的辅助文件：系统 `C:/Users/ww/.codex/skills/.system/openai-docs/SKILL.md` 为 `8CE8021101BCEA594FF92EE6CFD8CA7641A49EE66D7BC6070555F1A33FC239D9`；记忆注册表 `C:/Users/ww/.codex/memories/MEMORY.md` 为 `9FED38ECABE7B5CDF1ED85CABC54E8DB192D36448B419EEC781848E3EF329C86`。记忆只用于先定位历史合同职责；本次能力与路由结论来自当前文件和当前官方正文。

## 未验证项

- 没有任何本项目实际图像、视频、音频、真人录制、UE／Blender 工程或供应商账号界面；不作身份稳定、手部接触、口型、时序、肤质、抗闪烁、SDR 或审美通过结论。
- 没有验证收费执行、具体账号权限、插件／硬件兼容、复现或参数接受。官方功能正文不是当前项目的执行证据。
- 本审查未逐一独立复核全部摄影课程、ARRI PDF 页码、Sony 受限全文、ARKit 文档、作者动画演示和 Unity 样例许可。Blender 两页提取失败已单独记录；未用来源名字替代检验。
- 未运行全仓测试、打包、安装或发布。本次本地路由检查与两份文字试跑审查不能推导发行工程或媒体质量结论。
