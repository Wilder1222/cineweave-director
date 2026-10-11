# 专业制作调研与落地 · 2026-10-10

本轮目标：将专业电影、摄影、画风、画质、游戏引擎与真人表演的方法补入当前 CineWeave Skill，并用官方 AIGC 文档与原作者公开实践限定控制能力。开始时工作区已有未提交修改；保留其内容与删除状态，没有回滚、发布或移动旧标签。版本仍为 3.1.0。

## 调研方法与取舍

优先读取设备／引擎／模型官方文档，再比较专业从业者和社区原作者材料。记录来源访问日期、版本或源码提交、采用的决策及排除范围。资料均于 2026-10-10 读取相关正文；原发布日期和版本仍保留。官方文档能支持功能与方法范围，不能证明目标账号开通、任意素材可靠或本项目已生成成片。

采用的是可改变选择的关系：摄影机位置与透视、取景和焦点的信息职责、采集曝光与显示变换、刺激与反应、结构与图像参考分工、引擎与生成交接、采样与时间稳定、局部编辑的保留验收。未采用固定镜数／秒数、通用器材词串、统一身体模板、万能 CFG／采样数、所有任务的参考板流程、作者自评分或宣传成功率。

社区材料的用途是提出能被试片否定的假设。公开源码保存固定提交；作者教程保留署名与日期，不将星数、设备规模、课程资历或一张精选结果当作实测排名。没有复制外部整套代码、提示词库、模板、角色或媒体，没有安装生成执行器。

## 新增职责与落点

| 专业问题 | 实现位置 | 对交付的改变 |
| --- | --- | --- |
| 透视、焦点、曝光、运动模糊与覆盖 | [摄影](../../skills/cineweave-director/references/optional/cinematography-craft.md)、[导演](../../skills/cineweave-director/references/optional/directing-craft.md)、[学习与评测](../../skills/cineweave-director/references/optional/film-craft-study.md) | 分开机位、镜头、信息层级和运动表现；纯生成写结果，实拍／三维再写可控参数 |
| 真人可信肖像与表演 | [自然人物](../../skills/cineweave-director/references/optional/portrait-natural-human.md)、[视频表演](../../skills/cineweave-director/references/optional/video-performance-direction.md) | 区分身份、皮肤、妆造和光；演员任务与触发、采集用光与成片用光、输入迁移与目标校准分开 |
| 风格、画质、引擎和色管 | [画质与引擎流程](../../skills/cineweave-director/references/optional/rendering-quality-workflows.md)、[预演](../../skills/cineweave-director/references/optional/camera-previsualization.md)、[风格路由](../../skills/cineweave-director/references/routes/style.md) | 明确表现规则、四层质量与纯生成／预演／最终渲染的选择和交接 |
| 结构／身份／风格参考与局部编辑 | [AIGC 控制与评审](../../skills/cineweave-director/references/optional/aigc-control-and-evaluation.md) | 用实际兼容控制处理失败，检查预处理与裁切；变体比较保留输入、输出和失败反例 |
| 入口、加载和开发验收 | [Skill](../../skills/cineweave-director/SKILL.md)、[生命周期](../../skills/cineweave-director/reference-lifecycle.json)、[行为案例](cinematic-cases.json) | 新指南按需可达、完整分发；新增 CD-E39 至 CD-E50，案例库总计 50 条，仍是未运行的测试定义 |

入口、人物、镜头、分镜、风格、图像、制作和评审路由接入相关指南；不扩展 12 条机器路由、52 种根契约或规范字段。开发记录与试跑不随 Skill 分发。摄影／表演的具体知识继续由已有指南维护，两份新指南只持有此前缺少的引擎质量和控制选择职责。

## AIGC 官方与开源来源

| 来源与核验范围 | 采用 | 不外推 |
| --- | --- | --- |
| [OpenAI Image prompting](https://developers.openai.com/api/docs/guides/image-prompting)：多轮编辑、保留和模型参数相关章节 | 以实际输出继续窄范围修改；正文与参数分开 | 高质量标签不是跨模型等效质量；旧保真参数不是新模型通用字段 |
| [OpenAI Image generation](https://developers.openai.com/api/docs/guides/image-generation)：编辑、蒙版与限制章节 | 区域内、边缘、区域外复查；文字／布局／重复身份依旧需验收 | 蒙版不保证完全精确，保留要求不等于像素未变 |
| [OpenAI 停用页](https://developers.openai.com/api/docs/deprecations#2026-03-24-sora-2-video-generation-models-and-videos-api)：2026-03-24 公告、2026-09-24 移除 | 将历史方法与当前执行能力拆开 | 归档 Sora 教程不能成为当前 API 候选 |
| [Runway Gen-4 指南](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)：I2V、运动与正向措辞 | 图像定义初态，文字组织变化；固定摄影机正向表达 | 不向所有视频模式施加相同时长／负向规则 |
| [Google 视频最佳实践](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/video/best-practice)：页面更新 2026-10-07；与[2025-10-15 Veo 3.1 博客](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1/)对照 | 源图与运动分工；保留对白包裹语法冲突并按目标模式核查 | 同 seed 的连续性建议不成为身份／声音保证；不将短片单事件建议变成普遍禁多镜 |
| [Midjourney Style Reference](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference)、[Omni Reference](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference) | 风格、V7 人／物参考与 V8.X Edit Model 区分 | 只更新职责证据，不改写旧整表的核验日期 |
| [ControlNet README，ed85cd1](https://github.com/lllyasviel/ControlNet/blob/ed85cd1e25a5ed592f7d8178495b4483de0331bf/README.md) | 边缘／姿态／深度承担结构条件 | 历史 SD1.5 样例不证明其他模型支持或手指接触正确 |
| [IP-Adapter README，62e4af9](https://github.com/tencent-ailab/IP-Adapter/blob/62e4af9d0c1ac7d5f8dd386a0ccf2211346af1a2/README.md) | 图像与结构条件分工、检查默认中心裁切 | 不继承作者样例固定强度或身份稳定保证 |
| [ComfyUI ControlNet 示例](https://docs.comfy.org/tutorials/controlnet/controlnet) | 强度与作用时窗分开比较，核对预处理输入 | 节点可连线不证明基础模型／权重兼容 |

两个开源提交通过 `git ls-remote` 核对，并读取固定提交的 README；GitHub 匿名 API 被限流后改用只读 Git 查询，没有重复请求凭据。引擎、摄影和表演来源在各指南中靠近对应方法引用，保持版本和访问日期，不把本表作为第二份能力注册表。

## 电影、摄影、引擎与表演来源

| 领域与本轮来源 | 采用与限定 |
| --- | --- |
| [ARRI 动态范围白皮书](https://www.arri.com/resource/blob/295460/e10ff8a5b3abf26c33f8754379b57442/2022-09-28-arri-dynamic-range-whitepaper-data.pdf)，2022，第 14–18 页；[RED 快门](https://www.reddigitalcinema.com/red-101/shutter-angle-tutorial)、[横摇](https://www.reddigitalcinema.com/red-101/camera-panning-speed)；[Kodak 摄影交接](https://www.kodak.com/en/motion/page/for-the-cinematographer/) | 实体机制转为可见取舍；不宣称生成器执行快门／EI 或测得光学性能 |
| ASC Jay Holben 的[机位](https://theasc.com/article/shot-craft-where-do-you-put-the-camera/)、[一般镜头测试](https://theasc.com/article/shot-craft-the-generic-lens-test/)、[专项测试](https://theasc.com/article/shot-craft-specified-lens-tests/)；[Academy 剪辑教材](https://www.oscars.org/sites/oscars/files/complet_film_editing_activities_guide.pdf)，第 3–4 页 | 调度后选择必要覆盖，按问题测试；相邻画面的注意力与时空推断，不强制固定覆盖组合 |
| [Epic Cine Camera](https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematic-cameras-in-unreal-engine)、[Movie Render Pipeline](https://dev.epicgames.com/documentation/unreal-engine/movie-render-pipeline-in-unreal-engine)、[MRQ 图像设置](https://dev.epicgames.com/documentation/unreal-engine/cinematic-rendering-image-quality-settings-in-unreal-engine?lang=en-US)、[Lumen](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)、[Path Tracer](https://dev.epicgames.com/documentation/en-us/unreal-engine/path-tracer-in-unreal-engine)、[颜色输出](https://dev.epicgames.com/documentation/en-us/unreal-engine/cinematic-render-settings-and-formats-in-unreal-engine) | 分开镜头内参、输出系统、渲染路径、空间／时间采样与预热；不采用永久渲染 preset |
| [Blender 4.4 采样](https://docs.blender.org/manual/en/4.4/render/cycles/render_settings/sampling.html)、[4.5 LTS 色管](https://docs.blender.org/manual/sr/4.5/render/color_management.html)；[ACES Output Transforms](https://docs.acescentral.com/system-components/output-transforms/) | 检查去噪细节、Non-Color、观察变换与显示链；AgX、LUT 和 EXR 各自不能证明完整 ACES／HDR。英文 4.5 页读取失败，使用所列官方 sr 路径可读正文 |
| Shaun Comly 的[MRQ 作者教程](https://dev.epicgames.com/community/learning/tutorials/GxdV/unreal-engine-demystifying-movie-render-queue)，初发 2022；Unity Demo Team 的[数字人源码，8d61864](https://github.com/Unity-Technologies/com.unity.demoteam.digital-human/blob/8d61864050277f2c4574df7b31beb70093a8c263/README.md)及[样例说明，15e3fe2](https://github.com/Unity-Technologies/com.unity.demoteam.digital-human.sample/blob/15e3fe2c88fe5c5064ad753ee9d121060eab867a/README.md) | 作者方法支持求值／预热和分系统诊断；版本与依赖仍需实际工程核验。读取公开说明，未运行源码或展示片 |
| [Stella Adler Studio](https://classes.stellaadler.com/workshops/acting-technique-1-foundation-online/)、[Neighborhood Playhouse](https://www.neighborhoodplayhouse.org/)；[Peter Hurley 原作者](https://peterhurley.com/blog/art-behind-headshot)、[Profoto 光质](https://www.profoto.com/pl/en/still-photography/tips-tricks/whats-the-difference-between-profoto-umbrellas/) | 动作任务、给定情境、倾听回应及实际表情比较；不复刻课程、不规定招牌眯眼或性别光型 |
| [Runway Act-Two](https://help.runwayml.com/hc/en-us/articles/42311337895827-Performance-Capture-with-Act-Two)；Epic MetaHuman 的[视频采集](https://dev.epicgames.com/documentation/metahuman/metahuman-animator-video-capture-guidelines-in-unreal-engine)与[演员指南](https://dev.epicgames.com/documentation/metahuman/metahuman-animator-performer-guidelines-in-unreal-engine) | 图／视频身份来源与手势能力分开；录制范围、初姿、稳定清楚输入及目标输出二次校准 |
| [Apple ARKit](https://developer.apple.com/documentation/arkit/arfaceanchor/blendshapes)；[Pooya Deperson 通道指南](https://pooyadeperson.com/the-ultimate-guide-to-creating-arkits-52-facial-blendshapes/)；[Epic Face AR Sample，4.27](https://dev.epicgames.com/documentation/en-us/unreal-engine/face-ar-sample?application_version=4.27) | 中性基线、映射与组合形变逐项检查；通道系数不等于情绪值，不把满幅值当最佳演法 |

受限范围单独保留：[Sony T-stop](https://www.sony.com/electronics/support/e-mount-body-ilce-6000-series/ilce-6000y/articles/00347434)仅读取公开搜索文字，全文访问失败；旧 ARRI 灯光手册未在本轮重新取得。相关基础定义／旧快照的标记见摄影与学习指南，不以访问日期覆盖受限证据。

## 本轮验证

开始时与本轮改动后，既有 130 项回归全部通过。Skill 通用校验与契约索引检查通过；43 份入口／指南的本地链接检查覆盖 377 条链接、83 个章节引用。最终源码、构建与隔离包结果在下方记录；[证据清单](2026-10-10/evidence.json)保存当前源码和试跑输出的 SHA-256，试跑文件另存实际读取时的哈希，用于区分并行修改前后的版本。

两组独立上下文收到技能入口与原始测试请求，未收到根代理历史、预期答案、案例库或调研报告，实际输出六项完整文字回答。精确模型 ID、统计成功率、成本与运行时延未建立，不报告基于这些数据的评分。原始回答见[控制试跑](2026-10-10/forward-control.md)与[制作试跑](2026-10-10/forward-production.md)。

| 实际任务 | 根代理文字审查结论 | 尚缺证据 |
| --- | --- | --- |
| Runway Gen-4 无图递信运动稿 | 完整交付正向固定机位和握稳后松手；保留输入图依赖，没有扩成首尾帧任务 | 实际初态、可达性、手指和摄影机遵循 |
| 无原图围巾改色与硬保留 | 只改颜色，区分生成蒙版与确定性区域保留，定义解码后像素比较 | 原图、选区、结果与色泽协调 |
| 旧 Sora API 与新图像保真参数 | 当前停用页优先于旧教程；仍交付通用二十秒稿；新模型参数无支持证据时不继承旧字段 | 目标执行系统与精确账号，未调用 API |
| 同尺寸广角近拍与远机位长焦 | 两条独立稿保留同一设计，正确区分距离透视、焦距取景与裁切比较 | 两张输出及身份、人物大小和光学外观 |
| UE 闪烁与 SDR 色管 | 分环节／对象／时序试片，不用永久64样本；单一明确 SDR 显示链 | 工程、原始序列、交付与渲染版本 |
| 八秒门响、对白与钥匙交接 | 原创假设清楚，刺激→停手→确认→对白→落掌承重→松手连续，固定机位保护接触 | 实际时长、口型、身份、表演和接触 |

控制试跑实际调用只读逐镜检查，退出码 2：输入有效、所选视角覆盖完整，但源图可达性与连续性仍为 `unknown`。制作试跑对完整单镜实际调用检查器，退出码 0：六视角工作表完成，范围为 `plan_only`。检查器不核验观察真实或媒体效果，根代理另读全文核对结论，不将退出码 0 推广成媒体验收。

[独立审查](2026-10-10/independent-review.md)核对专业指南、控制边界、部分官方正文与六项实际回答，发现一处 P2 示例自洽问题：初态已经停手却又在刺激后停止整理纸边。已同步修正演员任务和视频正文为左手起始轻理纸边、右手静放桌边，刺激后停手；审查者复查通过。制作试跑读到两处并行改动前的来源版本，原稿、读时哈希、最终哈希和差异说明均保留，没有将旧试跑自动视为后来源码的新测试。

最终验证环境为 Windows、Node.js 22.15.0；实际结果如下。一次临时链接检查调用误读了检查函数不存在的 `errors` 字段；移除该额外读取后，文档链接检查正常退出，未修改检查函数。

| 实际检查 | 结果 |
| --- | --- |
| 通用 `quick_validate.py` | 通过 |
| `npm test` | 130 项通过，0 失败、0 跳过 |
| `npm run contracts:index:check` | 通过，52 根契约 |
| `npm run validate` | 通过，源码与开发资料的链接、契约与分发边界有效 |
| `npm run build` | 通过，159 个分发文件、42 篇参考，与源码逐字节一致 |
| `npm run validate:bundle` | 通过，52 根契约、54 份 schema、52 个示例；43 份 Markdown、377 链接、83 章节引用 |
| `npm run test:bundle` | 1 项隔离包测试通过，外部目录调用只读工具保持退出状态与输入不变 |
| `git diff --check` | 通过 |

构建结果位于忽略的 `.build/cineweave-director/`，开发试跑与调研不进入该插件包。原始测试定义依旧保持 `not_run`，本次六项文字输出作为独立小样本保留，不能宣称五十条定义全部执行。原有修改和删除状态保留，未提交、推送、安装或发布；旧 v3.1.0 标签未移动。

本轮没有拍摄、录制、生成、渲染或上传图像／视频／音频。文字稿件可以评审完整性、范围与决策；实际面部／手部、口型、时间稳定、画风与艺术质量仍需真实媒体。没有供应商成功率、实测画质得分、执行回执或收费账目。
