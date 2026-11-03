# Seedance 2.5：静默走廊与关门声，两镜工作稿

## 创作与交接

火山方舟 API，Seedance 2.5，两个**独立的文生视频任务**，每镜请求 6 秒；无输入素材、无参考绑定。以下走廊布局、镜头、光照和 16:9 是为本次任务作的可调整设计假设。

共享场景：深夜室内走廊，摄影机在走廊一端、眼平固定，朝走廊深处；右墙中段一扇深灰木门，合页在门框右侧，门向走廊内开启约 45 度，门框与把手可见。尽头窗外有雨，冷色微光透入；天花板的暖白壁灯照亮门框和浅灰墙面，地面有微弱反光。两镜都无人，门的位置、开合方向、构图和光色一致。A 中画面可见雨，但全程无声；B 在相同起始开度上慢慢关门。没有物理素材锚定，两个独立生成只能请求一致，不保证场景精确一致。

镜头语言：A 是眼平固定走廊全景，前景为地面、中景为右侧门、背景为尽头雨窗，焦点覆盖门与窗；停留观察并建立空间与等待感。B 沿同一机位与构图，焦点保持门和门框，固定机位让观众看清门的运动。A 出点为门仍半开，B 入点为同样半开的门；B 出点为门轻轻闭合。固定和焦点均是文字意图，并非已验证的独立 API 锁定。

### A 镜：6 秒，完全无声

以下全文作为 A 的 `content[0].text`：

```text
六秒连续单镜，16:9，写实悬疑。深夜的空走廊，摄影机位于走廊一端、眼平固定，朝走廊深处拍摄全景：前景是微微反光的地面，中景右墙有一扇深灰木门，合页在门框右侧，门向走廊内开启约45度，门框与把手清楚可见；背景是尽头的窗，窗外雨线清晰。尽头窗外冷色微光照入，暖白壁灯照亮浅灰墙和门框，亮暗层次保持可辨。整个镜头没有人，门始终保持半开，走廊与灯光稳定，只有窗外雨线轻微移动。摄影机与焦点全程保持不变，门和窗都可辨认；出点时门仍在相同的半开位置。全程绝对无声：没有雨声、门声、环境声、对白、音乐或其他任何声音。
```

### B 镜：6 秒，只保留门轴声和雨声

以下全文作为 B 的 `content[0].text`：

```text
六秒连续单镜，16:9，写实悬疑。深夜的空走廊，摄影机位于走廊一端、眼平固定，朝走廊深处拍摄全景：前景是微微反光的地面，中景右墙有一扇深灰木门，合页在门框右侧，门向走廊内开启约45度，门框与把手清楚可见；背景是尽头的窗，窗外雨线清晰。尽头窗外冷色微光照入，暖白壁灯照亮浅灰墙和门框，亮暗层次保持可辨。整个镜头没有人。起初门保持半开，随后门围绕右侧合页缓慢、连续地向门框转动，轻轻合拢，不反弹；临近出点门已闭合。摄影机与焦点全程保持不变，门的运动和门框清楚可见，空间与灯光稳定。声音仅有窗外连续雨声和与门转动同步的轻微门轴声；门静止后门轴声停止。无对白、无旁白、无音乐，也无脚步、风声、门锁声、关门撞击或其他声音。
```

## 火山方舟 API 设置

使用方舟普通 API 创建任务 `POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`，分别提交两次；对应 `model` 为 `doubao-seedance-2-5-260628`。只在 `content` 内放一个 `{"type":"text","text":"对应镜头的完整正文"}`，不要加图像、视频或音频。各字段如下；`text` 替换为上面的对应全文：

```json
{
  "model": "doubao-seedance-2-5-260628",
  "content": [{"type": "text", "text": "粘贴 A 镜完整提示词"}],
  "duration": 6,
  "ratio": "16:9",
  "resolution": "720p",
  "generate_audio": false
}
```

B 同样的请求结构，替换为 B 镜完整提示词并设置 `"generate_audio": true`。两个请求的 `duration` 都为整数 6；16:9 与 720p 为本方案的可改设计选择。A 显式 `false` 是静音关键；B 显式 `true` 以请求生成同步声音，文字控制只要雨声和门轴声，但不是对音轨内容的保证。不要在 A 的提示词里仅写“无对白/音乐”就视为完全静音，也不要关闭 B 的声音。此处不设置 `camera_fixed`：当前文档将该参数列为 1.0 系列支持项，2.5 的固定摄影机由提示词表达并检验。

依据 [方舟创建视频任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh) 和 [视频生成教程](https://docs.volcengine.com/docs/ark/video-generation-tutorial?lang=en)，本次查阅 2026-11-02：2.5 的文生视频支持 4–30 秒及指定 16:9；`generate_audio=false` 文档定义为无声视频，`true` 生成同步音频且可能依据画面与文字生成多种声音。文档中的任务查询 `duration` 是取整后的近似值，不能单靠它认定精确 6 秒。模型版本与普通 API 路径据官方文档示例；账号访问、解析结果与实际媒体尚未验证。

## 剪辑与验收

- 建议硬切 A 到 B：A 在半开静止门的末尾出，B 从同角度半开门入，雨声从 B 的第一帧开始，不提前进入 A；门轴声只在 B 的门开始转动后出现，关门停止时结束，不加撞击声。独立镜头各自为 6 秒；实际如需精确最终时长，按返回的帧率、帧数核对，再剪辑，不能假定有额外余量。
- 收到真实文件后核对实际模型、设置、分辨率、帧率、总帧数与时长。分别逐帧检查空场、门的位置与合页、开合方向、门运动、灯光和相邻接点；文字一致不等于画面一致。
- A 检查是否没有音轨，或音轨全段所有声道均为数字零；对交付文件全段听审并测量样本，避免编码或导出引入声音。若存在任何声音，剪辑交付时直接移除 A 的全部音轨或替换为全零音轨，并复核导出文件；两者均满足可听静音，若交付规范要求无音轨则选择移除。
- B 对完整立体声音轨听审，仅允许雨声及对应运动的门轴声：检查是否混入对白、音乐、风、脚步、锁扣或关门撞击，并把门转动与门轴声联合对照。出现额外声音则拒收或后期替换为合格的门轴声与雨声，再完整听审；当前未提供此类音频素材，也未完成后期制作。
- 检查 A/B 接缝的声画同步：A 的最后一帧仍无声，B 的雨声从接点开始，不能以淡入或声音桥污染 A；检查 B 是否突兀并按该硬锁处理。静态参数或波形本身不能证明音色与同步合格。

本稿为未生成的创作及 API 交接；没有提交任务、返回媒体或实际听审，连续性、声画效果及账户可用性均待验证。

## 实际读取的本地文件 SHA-256

以下按原始文件字节计算；在线文档的读取和日期见上方链接，不冒充本地文件哈希。不存在的 `skill-sources/cineweave-platform/references/optional/` 对应路径读取失败，未计入。

| 文件绝对路径 | SHA-256 |
| --- | --- |
| LOCAL_TEMP/cineweave-seedance-audio-case-20261102.txt | 2F8EC74D9EB611DE254984EDAC937B87D2E735803CEE1C44A13D96277DD2975D |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md | B1C68B8861D474A36F4EDF7DADB45EE7E7228F9DC0E0F501C5121E3AB50BBF8C |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skill-sources/cineweave-platform/SKILL.md | 97DFAD8A79A11CA8CA919548461D3E40F5F23A245422380AF713E95B794E755B |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/routes/shot-direction.md | 489709101DA4DDE48D01FBD4181382EF48E578183D5C6B735DC36227CDBF9667 |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/video-sound-and-delivery.md | CA77595C37042BD7B21974736B50A485D983E8EA5B9BC90F74359E6A2C76D941 |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/video-platform-adaptation.md | 912A7E79457D4865211BA765B9E086CB1A2876F87E946EF5AFE084DCF42E808E |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/video-model-practices-2026-10.md | F295D79F5F885EC9B61AD20AE84C417C3529363F4906E9B718DEF1392F3ECBF0 |
| LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director/skills/cineweave-director/references/optional/video-timing-and-handles.md | 0856CC9F67C10259A54755A470AE338E93A25DF3D031B0D1730E5429AEB55FA8 |
