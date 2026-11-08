# Production profile v1（手工语义配置）

共享执行器：`studio-review/2026-11-04/build-production-package.mjs`。运行：`node studio-review/2026-11-04/build-production-package.mjs <profile.json>`。默认写入 `studio-review/2026-11-04/production/<topicId>/`；只维护该题当前包，不改 Studio 源、旧稿或 Skill。

执行器只做来源核验、精确补丁、已有镜头区段提取、渲染和既有检查，不创作逐镜观察，不自动填 pass。所有字段为普通工作材料，不冒称 CineWeave 根 schema。完整原文从已通过 UI 导出的 `studio-current/<projectId>/<documentId>.md` 读取，必须匹配该项目 index.json 的 hash。

```json
{
  "schemaVersion":"cineweave-production-profile/v1",
  "topicId":"U001", "title":"我家住进一位剑仙", "revision":1,
  "source":{"projectId":"实际ID","scriptDocumentId":"实际ID","storyboardDocumentId":"实际ID","reviewDocumentId":"可省略"},
  "patches":[{"documentId":"实际ID","before":"必须唯一匹配的完整原字串","after":"完整替换字串","reason":"该题真实问题"}],
  "creative":{"logline":"完整梗概","intent":"导演意图","hardLocks":["既有硬锁"],"assumptions":["可撤销视觉候选"],"review":"本轮完整现稿阅读结论/旧问题已修与仍存"},
  "visual":{
    "style":{"medium":"媒介","rules":["形体/边缘/表面/色光/时间的可见规则"],"exclusions":["禁用"]},
    "palette":[{"id":"P1","name":"主色","hex":"#123456","use":"实际对象和面积关系"}],
    "materials":[{"id":"M1","asset":"衣料/物件","description":"基色、粗糙度/织纹尺度、反光与冷暖响应","preserve":"保留项"}],
    "lighting":[{"id":"L1","sourceId":"实际世界光源ID","position":"位置方向","quality":"软硬/衰减/主辅关系","intent":"曝光与面部体积"}],
    "characters":[{"id":"C1","name":"角色","identity":"稳定身份与外貌候选","costume":"当前服化道","voice":"常态声线","prompt":"完整独立角色图像稿"}],
    "assets":[{"id":"A1","name":"场景或道具","prompt":"完整独立静态图像稿"}],
    "lookdev":[{"id":"LD1","target":"人物近景/场景/材质/内外转换/反打","prompt":"完整可提交测试稿","fixed":["固定项"],"compare":"对照变量","pass":["可观察标准"],"fail":["可否定失败信号"]}]
  },
  "space":{"coordinate":"北向/屏幕左右与世界方向约定、设计非实测","anchors":[{"id":"DOOR","label":"门","x":10,"y":70,"description":"可达/尺度"}],"lights":[{"id":"L1","label":"窗主光","x":90,"y":10,"description":"位置/朝向"}],"cameraZones":"可达机位与轴线区域","geography":"门窗/通道/遮挡/接触范围全文"},
  "blocking":[{"character":"C1","task":"人物任务","path":"可达起点→终点","gaze":"视线/刺激","props":"持物手与接触相位","residual":"下一镜承接"}],
  "shots":[{
    "id":"01","title":"该镜职责","durationSeconds":20,
    "source":{"documentId":"分镜文档ID，可省略继承上层","startLine":1,"endLine":20},
    "prompt":"可省略；仅授权改写时给完整独立视频稿，否则精确抽取上述区段，不自动摘要",
    "imagePrompt":"该镜所选首帧路径的完整静态稿；文生路径可省略并说明",
    "path":"t2v/i2v/reference/board 与所选输入依据",
    "beat":"实际节拍映射","purpose":"观众信息变化","entry":"人物/道具/朝向入态","exit":"出态及下一镜接口",
    "camera":{"scale":"景别","position":"可达世界机位","height":"高度","angle":"俯仰","axis":"轴线侧","perspective":"视点收益","type":"static/dolly/truck/pan/tilt/arc/crane/handheld/gimbal/compound","movement":"完整路径或固定理由","trigger":"触发","depth":"景深","focus":[{"time":0,"target":"焦点起点"},{"time":10,"target":"转焦对象"}],"techniqueId":"可省略；静止默认neutral_static、有转焦默认K07、移动必须显式填注册技法"},
    "composition":{"layout":"构图","foreground":"前景","midground":"中景","background":"后景","negativeSpace":"留白用途","visualHierarchy":"注意力顺序"},
    "frame":{"background":"#d7d8cf","actors":[{"label":"C1 角色","x":35,"y":58,"scale":1,"pose":"面向画右/手扶桌沿"}],"props":[{"label":"桌与杯","x":15,"y":70,"width":65,"height":10,"shape":"rect"}],"layers":[{"label":"后景门","x":75,"y":15,"width":18,"height":65,"color":"#b4b8aa","opacity":0.7}]},
    "sound":"实际声源/环境/拟音/触发与承接","transition":"继续/重看/省略及切点理由",
    "dialogue":[{"speaker":"准确说话人","text":"原台词逐字","addressee":"受话人","performance":"情境语气/重音/停顿","startSeconds":0,"endSeconds":5}],
    "reviews":{
      "direction":{"status":"pass/revise/unknown/not_applicable","criterion":"本镜具体判据","observation":"实际源文与方案观察","sourceLocator":"可省略，默认本镜实际区段"},
      "performance":{"status":"pass","criterion":"真实判据","observation":"实际观察"},
      "staging":{"status":"pass","criterion":"真实判据","observation":"实际观察"},
      "cinematography":{"status":"pass","criterion":"真实判据","observation":"实际观察"},
      "prompt":{"status":"pass","criterion":"真实判据","observation":"实际观察"},
      "continuity":{"status":"pass","criterion":"真实判据","observation":"实际观察"}
    }
  }],
  "audio":{"fps":24,"music":"是否使用/进入退出/对白让位","subtitles":"准确字幕与逐句映射规则","colorGrade":"沿实际色卡、肤色/材料/反打保护","delivery":"交付意图，实际平台输出规格待核"},
  "tests":[{"id":"T1","shots":["01"],"objective":"本片风险","fixed":["固定项"],"input":"实际测试输入绑定","pass":["可验证判据"],"fail":["失败信号"],"stop":"候选上限/停止与回查条件"}],
  "handoff":{"xiaoyunque":"当前选定输入路径及节点交接全文","libtv":"同母稿节点组织与采用窗；不猜字段","unknowns":["实际账号/模型/入口能力未核"]}
}
```

`shots[].source` 是精确行区段，不是正则审稿。作者必须先读完整当前剧本/分镜，手写每镜六视角的实际观察；渲染器不会根据关键词宣称质量通过。`reviews` 为 revise 时需另给 `repair:{domain,variable,acceptance}`；未知信息写 unknown，不用 not_applicable 豁免。

时长为设计预算；执行器以24fps或明确fps生成连续整数帧窗口，不能证明实演/声音时长。每句未给秒窗时使用本镜计划窗口并标“待实测”，不得写口型通过。动画分镜示意、色卡、光图均标 `design_vector_not_generated_media`。最终强制 `production_ready:false,media_verified:false,rough_cut_verified:false`。

共享 helper 首版会尽量宽容字段说明的字符串/数组，但缺独立资产稿、六类LookDev范围、完整六视角或摄影语义时必须报告缺项而非假通过。文件存在/检查通过只表示对应设计结构，不等于生产成果就绪或作者采纳。

## 构图画格和光向补充

`shots[].frame` 必须由作者按本镜可见构图填写，画格为16:9，x/y/width/height均为画幅百分比0–100；演员x/y为身体中心锚点，scale控制图示大小。只画本镜可见的人物/道具/环境层，不为特写硬加全身人。纯物件特写可只给props/layers。没有frame时输出“未绘制”并留下设计缺项，不能把前中后景文字当已绘分镜。图是简化轮廓，身份/表演效果仍待媒体。

`space.lights[]` 可给 `targetX,targetY` 或 `dx,dy` 明确光的设计方向（与图上坐标同一0–100体系）；未给时只画源光符号并注明方向见灯光卡，不推测箭头。`anchors` 的x/y同为设计平面百分比，作者需给明确位置；自动排版位置只用于暂缺位置的标签，不证明空间成立。

来源index同时兼容 `{projectId,exportComplete,documents:[{documentId,file}]}` 与主任务导出的 `{project:{id,title,topic_id},complete,documents:[{id,path}]}`。完整性仍须explicit true；root早期项目请补完整目录标记，不能用文档个数猜导出完成。
