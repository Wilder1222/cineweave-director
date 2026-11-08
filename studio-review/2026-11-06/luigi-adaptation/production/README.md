# 《拒赔》24集短剧详细剧本与Seedance 2.5分镜

按用户明确选择保留24集短剧，调整完整场景与分镜节奏；六集合并候选未采用。当前片长约3–5分钟，实际范围以分集表为准。

从 [剧情与剪辑总览](storyboard.html) 开始，按集浏览开场问题、反转、选择代价与每镜信息变化；[分集阅读页](index.html)提供完整剧本和每镜可复制提示词。全剧按16:9横屏制作，演员只说英语，逐句中文用于阅读与后期字幕。

本剧取材公开事件作虚构再创作。拒赔与加班店员支线、配角、公司、私人对话、证据安排、法律进展及结局均为剧情设计；实际案件状态不能由本剧推知。保留橙衣押送和深红毛衣出庭，主题通过人物选择、程序与传播后果展开。

- 24集短剧详细剧本，223个成片镜、359个生成候选，712句中英对白；计划总长99分13秒。
- [全剧双语剧本](scripts/all-episodes-bilingual.md)；scripts内另有24份分集文件。
- [全部镜头设计](storyboard-design.md)、[单集段落节奏](editorial/episode-movements.csv)、[分集节拍表](editorial/episode-beats.csv)、[场次覆盖表](editorial/scene-coverage.csv)、[相邻剪点对照](editorial/cut-interface.csv)从当前源稿生成，逐项显示选择、代价和切点。
- [美剧参考、口语对白与调色设计](reference-and-style.html)展示四部参考的限定用途、当前对白与六张设计卡；[对白规则](dialogue-style-guide.md)、[光色手册](visual-style-guide.md)和[逐镜光色映射](editorial/visual-direction.csv)对应所有分镜复制稿。参考来源和观察范围可追溯，未冒充原剧LUT或全剧看片。
- [资产清单与准备顺序](asset-inventory.html)，含完整梳理Markdown及可筛选CSV；依实际剧本补齐21个场景编码和人物/服装/道具/声音需求。
- prompts内每集总稿、每个成片镜的候选组、各技术段独立提示词与成片镜起态备稿。视频复制稿已展开外观、服装、空间、动作、摄影、焦点与原句，不依赖“同上”。
- visual为六张视觉设计卡；maps为21个空间编码的世界方向示意；boards为真实镜号的景别索引图。SVG可缩放，PNG可直接查看。简化人物符号不是精确走位图或已生成关键帧，具体摄影和调度以逐镜设计为准。
- audio为中英SRT与对白表；editorial为24fps设计时间线、调度、叠加文字清单。时码须在实际声音和视频返回后重新对齐；SRT为整句时窗工作稿，长句在上线前再按录音分行分屏。
- requests为未来方舟API的逐候选参数交接稿；生成段与成片镜头/采用窗口的映射见editorial/generation-segments.csv，无密钥、无上传槽位、无已提交任务；用户实际入口/账号尚未核验。
- [24集节奏方案](short-drama-rhythm-plan.md)、[当前重排审读](review/short-drama-rhythm-review.md)、[官方依据](official-sources.md)、[导演通案](director-card.md)、[试片计划](test-plan.md)、[六视角文字覆盖检查](review/worksheet-check.json)和review中的独立审读记录可追溯。

## 设计与媒体的边界

目前已完成剧本与导演设计。视频、演员身份资产、录音、实测光材和试剪均为pending_media。六视角工作表中的pass只表示所列文字覆盖条件满足；这些行由源字段汇编，不能证明艺术效果。独立审读记录另列实际发现与修正。未宣称作者采纳、生成成功或production_ready。

采用Seedance 2.5官方指南规划生成候选。成片长镜可由多个技术候选服务；各段采用长度另加前后各1秒余量，请求不超过30秒。长镜接续需要真实表演、身份、摄影与声音连续性核验，当前未实现或验证无缝接续。当前为文生视频稿；静态起态备稿没有被冒充为已上传首帧。转严格首帧或多参考任务时须按真实素材与入口重新设置。

## 文件复查

manifest.json记录本包真实文件的SHA-256，仅供完整性核对。构建脚本从episodes制作单元、season-plan.json当前24集短剧编排、extra-roles及visual_direction重建文本与图示；generation_plan读取review/segment-camera-overrides.json确定跨技术段的连续机位；season为派生播出源稿。原E01–E24镜号只用于稳定资产定位，阅读顺序以24集目录为准；对应关系见editorial/source-shot-map.csv；tools中PNG渲染依赖公开的@resvg/resvg-js，node_modules不随包交付。复跑CineWeave检查器需使用当前安装的check-shot-review.mjs路径。
