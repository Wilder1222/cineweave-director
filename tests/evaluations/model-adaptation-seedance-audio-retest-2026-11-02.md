# Seedance 2.5：深夜走廊两镜与声音交接

**方案状态：文字设计与接口交接；尚未提交或生成，画面和声音均未实测。** 两镜分别以纯文本发起独立任务，不上传图片、视频或音频参考。以下的走廊外观、机位和 16:9 画幅是为衔接作出的设计选择；独立文生不能保证两个结果的场景几何和纹理完全一致。

## 共同视觉基线

深夜，写实的窄走廊，灰白墙面和深灰地砖延伸到远端；画面右侧中段有一扇深棕色木门，铰链在门框右侧，门向走廊内打开约三分之一；画面左侧靠远端有一扇窄窗，窗外雨线清晰。天花板一盏暖黄色壁罩灯照亮门框与近处地砖，窗外冷蓝夜色映入墙面。走廊空无一人，物件及光色不随镜头变化。机位均在走廊入口、平视，沿走廊纵深望向远端，固定广角构图：前景是地砖，中景右侧为门和门框，背景为窄窗及走廊尽头，门和铰链始终可见，焦点保持在门与周围空间。

A 用固定全景让观众辨认空间与微开的门；B 保持相同构图，以门的变化形成注意力转移。两镜均不强制摄影机移动。A 出点门仍微开，B 入点为相同门位，再缓慢关至门扇轻触门框并停住。

## A 镜：六秒空走廊，完全无声

复制以下全文作为 `content` 中唯一 `text` 项：

```text
写实电影画面，深夜空走廊。狭窄走廊灰白墙面、深灰地砖延伸至远端；画面右侧中段是一扇深棕色木门，铰链在门框右侧，门朝走廊内打开约三分之一；左侧远处窄窗外可见夜雨。天花板一盏暖黄色壁罩灯照亮门框和近处地砖，窗外冷蓝夜色映入墙面。摄影机位于走廊入口平视，固定广角全景，前景地砖、中景右侧门、背景窗户和走廊尽头清晰可辨，焦点保持在门及周围空间。六秒持续观察：走廊始终空无一人，门和摄影机始终不动，只有窗外雨线可见；结束时门仍打开约三分之一。全段完全无声：无雨声、无环境底噪、无门声、无对白、无旁白、无音乐及任何其他声音。
```

## B 镜：六秒关门，只保留门轴声和雨声

复制以下全文作为第二个独立任务 `content` 中唯一 `text` 项：

```text
写实电影画面，深夜空走廊。狭窄走廊灰白墙面、深灰地砖延伸至远端；画面右侧中段是一扇深棕色木门，铰链在门框右侧，门朝走廊内打开约三分之一；左侧远处窄窗外可见夜雨。天花板一盏暖黄色壁罩灯照亮门框和近处地砖，窗外冷蓝夜色映入墙面。摄影机位于走廊入口平视，固定广角全景，前景地砖、中景右侧门、背景窗户和走廊尽头清晰可辨，焦点保持在门及周围空间。开始时门微开，走廊空无一人；门沿右侧铰链缓缓、连续地向门框合拢，临近结束时轻触门框并安静停住，不反弹；摄影机不动。声音只包含窗外持续雨声，以及与门扇转动同步的轻微门轴吱呀声，门停止转动后门轴声停止。无对白、旁白、音乐、脚步、关门撞击声、门锁声或其他声音。
```

## 火山方舟 API 设置与调用交接

范围：火山方舟标准视频生成 API，Seedance 2.5，纯文生视频；资料核查日期 2026-11-02。官方文档示例模型 ID 为 `doubao-seedance-2-5-260628`，实际提交前确认当前账号可用模型或推理接入点。两次独立 `POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks`，请求头 `Content-Type: application/json` 和 `Authorization: Bearer <安全环境中的 API Key>`。不要将密钥写入提示词、交接文件或日志。

每次请求的 JSON 结构如下；把对应镜头的完整复制稿填入 `text`，不用添加素材项：

```json
{
  "model": "doubao-seedance-2-5-260628",
  "content": [{"type": "text", "text": "粘贴对应镜头的完整提示词"}],
  "duration": 6,
  "ratio": "16:9",
  "resolution": "720p",
  "generate_audio": false
}
```

- A 镜使用上面的 `generate_audio: false`。这是全片无声的接口控制，连雨声也关闭；提示词的无声要求是补充。
- B 镜其余设置相同，**改为 `generate_audio: true`**，并使用 B 镜完整提示词；该开关只控制有声／无声，并不能保证只生成两种指定声音。
- `duration: 6` 是每次请求值，非对实际媒体时长或剪辑有效时长的实测保证；两个各六秒的片段硬切时目标总长为十二秒。`ratio` 和 `resolution` 是本方案统一建议。返回后分别记录实际结果；模型访问权限、实际返回设置和时长目前未知。
- 创建成功后记录真实任务 ID，并按[查询视频生成任务 API](https://docs.volcengine.com/docs/ark/get-video-generation-task-api?lang=zh)查询至终态。提交结果不明确时先查询已知任务，避免盲目重复创建。

官方[创建视频生成任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh)列出纯文本输入、`generate_audio` 及模型范围；[视频生成教程](https://docs.volcengine.com/docs/ark/video-generation-tutorial?lang=zh)列出 Seedance 2.5 的 4–30 秒时长范围。接口参数、版本和账号权限以提交时官方文档及实际账号为准。

## 剪辑交接与验收

1. 两段均独立生成；逐镜核查返回时长、画幅、门的位置、打开角度、铰链侧、景别、灯光和相机方向。文本重复只能提高设计一致性，不构成画面匹配保证。选择 A 尾部与 B 首部相近状态做硬切；若没有合适区间，重新生成不匹配镜头或调整采用点，不能宣称已锁定一致。
2. A 的声音要求覆盖从首帧至最后一帧：检查容器音轨状态；若有音轨，检测样本是否全部为零并完整试听。无音轨与静音音轨均可满足听觉静默，但不能从 `generate_audio: false` 或波形外观推定文件已经合格。若需严格静默，剪辑时间线上 A 区段移除或静音所有轨道，并检查最终导出该段全区间。
3. B 完整试听：雨声持续、门轴声随门扇转动出现并在运动停止时结束；不得出现对白、旁白、音乐、脚步、撞击或额外杂音。联合画面检查轴声与门的运动同步、音尾自然。若混入多余声音，重新生成或在后期制作／替换为仅含这两种声源的音轨并复听；单独静音整个 B 镜会丢掉所需声音。
4. 硬切处 A 的绝对静默持续至 B 入点；雨声从 B 入点开始，不做跨入 A 的声音前置或交叉淡化。若为防止音频接点爆音，需要淡入时仅在 B 区段内处理。最终导出后从 A 尾到 B 头连续试听并检查音画同步。

未提供或生成任何实际媒体；以上是验收方法，不是验收结论。请求值、服务实际返回值、听审和最终导出结果分别记录。

## 所读本地文件 SHA-256

以下路径除首行外均相对项目根 `LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director`；记忆索引使用绝对路径。仅记录本次读取的文件，哈希不代表内容质量或媒体验收。

- `LOCAL_TEMP/cineweave-seedance-audio-case-20261102.txt`: `2F8EC74D9EB611DE254984EDAC937B87D2E735803CEE1C44A13D96277DD2975D`
- `skills/cineweave-director/SKILL.md`: `B1C68B8861D474A36F4EDF7DADB45EE7E7228F9DC0E0F501C5121E3AB50BBF8C`
- `skill-sources/cineweave-platform/SKILL.md`: `97DFAD8A79A11CA8CA919548461D3E40F5F23A245422380AF713E95B794E755B`
- `skills/cineweave-director/references/routes/shot-direction.md`: `489709101DA4DDE48D01FBD4181382EF48E578183D5C6B735DC36227CDBF9667`
- `skills/cineweave-director/references/optional/video-sound-and-delivery.md`: `CA77595C37042BD7B21974736B50A485D983E8EA5B9BC90F74359E6A2C76D941`
- `skills/cineweave-platform/references/optional/video-model-practices-2026-10.md`: `05CDBF1FC353F8D3D9CFCA20833F6B0EED7A7B456480E6AD9E5EE4ACE52E3748`
- `skills/cineweave-platform/references/optional/video-platform-adaptation.md`: `912A7E79457D4865211BA765B9E086CB1A2876F87E946EF5AFE084DCF42E808E`
- `skills/cineweave-platform/references/optional/video-timing-and-handles.md`: `0856CC9F67C10259A54755A470AE338E93A25DF3D031B0D1730E5429AEB55FA8`
> [REDACTED: local memory reference]
