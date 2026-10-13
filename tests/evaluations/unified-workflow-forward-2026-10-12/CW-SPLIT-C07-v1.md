# CW-SPLIT-C07 首版实际回答

FG-01版本1两镜的六视角文本评审已完成，原稿保留，未修改正文或批准定稿。工作表覆盖12/12项；检查输入有效，但两镜的空间可达条件和焦点说明仍有未决项。没有图像、视频或声音，下面的`pass`只针对注明的设计文本事实。

原稿逐字符存于`evidence/FG-01-original-v1.txt`，UTF-8无BOM，SHA256为`73f403fcf70c65612ab10ac96553997a5d1ef6d72b8f784f967b645fa9586245`。以下定位均指FG-01 r1，镜号沿用原文。

| 视角 / 镜头 | 标准、具体文本依据与状态 |
| --- | --- |
| direction / FG-S01 | **pass（文本）**。应看见唯一合拢信纸从右手移到桌中央，接触先于释放。来源「FG-S01 / 动作与出点」明确先注视、缓慢放下、接触桌面后才放右手，终态仍合拢在中央、陶杯未动；没有新增认知事件。 |
| direction / FG-S02 | **pass（文本）**。应直接继续同一张纸的展开。来源「FG-S02 / 入点、动作与结束」承接纸已在中央和双手空，才左按右展，终态一张无字纸平放；没有重新放纸或额外故事事件。 |
| performance / FG-S01 | **pass（文本）**。应有可执行视线和手部顺序。来源「FG-S01 / 她看着信纸至目光仍落在信纸」明确看纸、放纸、接触后释放、退回两手，目光保留；无说话或配角反应任务。 |
| performance / FG-S02 | **pass（文本）**。应继承前态并保存必要手部接触。来源「FG-S02 / 女子左手按住至结束」左按下半部、右握上半部边、沿原折痕展开，结束左仍按、右松开停右侧；动作任务完整，不需要给手部近景增加面部表演。 |
| staging / FG-S01 | **unknown / important**。应确认女子在桌北侧能够接触桌中央且不被躯干遮住。来源「共同房间基线及FG-S01 / 桌面中央」没有桌南北深度、人物与桌缘距离或接触区遮挡关系；不能确认可达，也没有证据断言不可达。待补最小空间关系，不移动硬锁站位。 |
| staging / FG-S02 | **unknown / important**。应在相同站位完整展开且陶杯在接触区外。来源「FG-S02 / 左按下半部、右握上半部及陶杯范围」已明示杯不进入主要接触区，但未给纸尺寸、折痕朝向、展开占位及桌深，双手工作范围待核。 |
| cinematography / FG-S01 | **revise / important（说明缺口）**。来源「FG-S01 / 镜头起句」给出南侧眼平中景、固定机位和西窗光，未给焦点对象及景深意图。最小修复归导演：只补“接触区焦点与景深意图”，让信纸触桌、右手释放均可读，不改变动作、机位或光源。本次仅列建议，未补写正文。 |
| cinematography / FG-S02 | **revise / important（说明缺口）**。来源「FG-S02 / 镜头起句与展开动作」给出南侧偏西略俯近景，却未说明展开过程中纸边和双手接触的焦点保护。仍归导演，最小变量为“接触区焦点与景深意图”；验收是两手/纸面在整个展开过程可读，其他锁定不动。没有断言实际媒体失焦。 |
| prompt / FG-S01 | **not_applicable**。标准为实际编译稿对设计的忠实度；来源「documentType及FG-S01全文」只有设计文本，没有独立图像/视频复制提示词，也未要求本次编写，不能凭空创建六套方案或补稿以填表。 |
| prompt / FG-S02 | **not_applicable**。同样没有编译目标或待审复制稿，用户未授权新增正文。此豁免只针对编译忠实度；媒体缺失并未作为豁免理由。 |
| continuity / FG-S01 | **pass（文本）**。来源「FG-S01出点 → FG-S02入点及共同基线」逐项相同：唯一合拢信纸在中央，双手空在桌缘，杯仍在东端；女子北侧、摄影机南侧、西窗光和底声连续。 |
| continuity / FG-S02 | **pass（文本）**。来源「FG-S02全镜及FG-S01声音意图」明确连续硬切，只换南侧机位和景别，纸从合拢到展开仍为一张无字纸、杯不动，左手最终按纸、右手空，底声连续，无对白/音乐。无后续镜头，不编造S03接口。 |

这些视角共同审一份稿件，没有形成竞争方案。未发现来源文本中的确定硬锁矛盾；未决空间条件不能当作已发生的物理失败。最小修复责任与顺序：场景领域先提供桌深、人物到桌缘和纸展开范围，以验证可达；导演领域再仅补焦点/景深意图。若这些事实揭示源动作不可达，需回相应上游责任与用户锁定解决，不能靠紧裁切掩盖。本次没有任何修改授权，因此修复停在责任和验收要求。

实际检查使用随cineweave-review包分发的`check-shot-review.mjs`与`check-delivery.mjs`，Node原生版本为`v22.15.0`。六视角表是非规范工作表；没有提供canonical JSON，不能宣称canonical schema通过。时间覆盖表仅用24/1作算术换算基准，把原稿每镜4秒映射成96帧，不宣称已锁定实际拍摄/媒体帧率。

实际命令：

```text
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-shot-review.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-shot-review-v1.json
node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-delivery.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-delivery-v1.json
```

`check-shot-review`原生stdout，退出码2（有效但未解决）：

```json
{
  "valid": true,
  "scope": "plan_only",
  "coverageComplete": true,
  "reviewComplete": false,
  "expectedRows": 12,
  "missing": [],
  "openItems": [
    {"role": "staging", "shotId": "FG-S01", "status": "unknown"},
    {"role": "staging", "shotId": "FG-S02", "status": "unknown"},
    {"role": "cinematography", "shotId": "FG-S01", "status": "revise"},
    {"role": "cinematography", "shotId": "FG-S02", "status": "revise"}
  ],
  "prompt": null,
  "errors": [],
  "limitation": "仅检查工作表一致性，不核验引用内容、艺术质量、媒体、权利、批准或实际执行。",
  "localization": {
    "locale": "zh-CN",
    "summary": "输入有效，评审仍有未决项或没有适用的通过项。"
  }
}
```

`check-delivery`原生stdout，退出码0：

```json
{
  "valid": true,
  "errors": [],
  "duration": {"numerator": "192", "denominator": "24"},
  "endTimecode": "00:00:08,000",
  "subtitles": [],
  "srt": "",
  "scope": "Planning arithmetic only: cut-only shot coverage and one subtitle track. Text counts do not establish speech duration, readability, synchronization, rights, or media quality.",
  "localization": {
    "locale": "zh-CN",
    "summary": "剪辑覆盖与字幕算术检查通过，实际声音及画面同步仍未核验。",
    "errors": [],
    "scope": "仅检查硬切镜头覆盖、单字幕轨和文字计数；字数不等于口播时长，不证明可读性、同步、权利或媒体质量。"
  }
}
```

两条命令stderr为空，完整原生输出、退出码和输入工作表均保存于evidence目录。`valid:true`与时间覆盖通过仅证明工作表一致性及4+4秒的无缺口硬切算术；`reviewComplete:false`必须保留。没有媒体，身份、表情、接触、纸张形变、焦点、连续播放及底声/摩擦同步仍未知；没有定稿批准。

## 实际执行记录

- 进入统一入口 → 手工读取给定准确cineweave-review入口 → 交接FG-01完整原稿r1、两镜全部硬锁、无媒体证据及“不改稿/不批准”授权边界 → 六视角逐镜评审 → 实际运行本包检查器并保留未决项 → 返回导演入口统一交付。
- 未调用platform/reference；评审不接管故事或上游修订。不建立虚构canonical对象或生成记录。
- 内部产物 owner：cineweave-review（评审工作表、问题与最小修复责任，对应CreativeReview/RepairPlan职责）；原稿owner：用户/导演上游领域；工作流最终 owner：cineweave-director。
- 实际来源：导演入口；cineweave-review/SKILL.md「先确定可观察范围」「按范围检查与修订」「交付与责任回流」；其review-repair.md「评审」「修复归属」；ensemble-direction-and-review.md「同一场景，多个检查视角」「覆盖范围内的每一镜」「只读评审表检查器」；其scene.md「共享空间检查」；shot-direction.md「摄影机与构图」；storyboard-rhythm.md「相邻剪辑接口」；video-sound-and-delivery.md「视频意图」「声音职责与提示表」；实际两个检查脚本。路径/hash见report.md。
