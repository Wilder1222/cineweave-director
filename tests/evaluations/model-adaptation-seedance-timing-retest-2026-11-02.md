# Seedance 2.5：两个独立 6 秒镜头与交接

核对日期：2026-11-02。目标为火山方舟视频生成 API、模型 `doubao-seedance-2-5-260628`；两次独立文生视频请求，仅传文本，没有参考素材。以下为可审阅的制作方案，尚未实际提交或生成。

## 共同设计与镜头卡

**工作假设：**16:9 横画幅、写实悬疑氛围。深夜，一条狭长空走廊从近处延伸到远端；暗灰墙面，左侧连续窗户，右侧中段一扇暗色木门，门轴在门框右侧，门板向走廊内开着一条窄缝。天花板一盏暖白灯稳定照亮门口，窗外微弱冷色雨夜光落在地面。地板、门框、窗格和灯的位置两镜一致；无人物。雨在室外，A 画面可以呈现雨，但不得有任何声音。

- **A：建立空走廊。** 平视固定广角全景，沿走廊轴线看向远端，前景地面、中景右侧虚掩的门、后景尽头都可见；保持门和走廊可读的焦点。6 秒持续观察，门不动，摄影机不动。出点是原位虚掩的门；静止让观众先建立空间与等待感。
- **B：门缓缓关闭。** 同轴、同高度固定中广景，右侧门及门框完整可见，左侧窗格与尽头保留识别锚点；焦点稳定在门及门框。入点门与 A 出点同位置、同开度；短暂保持后，门缓慢向门框转动，接近关合后轻轻合拢，末段保持合拢。摄影机不动，便于看清关门过程和承接。门轴声由门开始转动时触发并随动作减弱；画外雨声自 B 入点开始，整个 B 延续。无需人物或可见关门原因。

## A 镜：复制到 `content[0].text`

```text
写实悬疑电影画面，深夜，一条空无一人的狭长走廊从近处延伸至远端。暗灰墙面，画面左侧是连续窗户，画面右侧中段是一扇暗色木门，门轴在门框右侧，门板向走廊内虚掩着一条窄缝；天花板一盏暖白灯稳定照亮门口，窗外微弱冷色雨夜光落在地面。平视固定广角全景，前景地面、中景木门与后景走廊尽头都清楚可辨，焦点稳定在门和走廊，摄影机全程静止。整个镜头持续观察空走廊，门保持同一开度不动，灯光稳定，没有人进入，末尾仍是门虚掩的状态。整个视频完全无声：没有雨声、门轴声、对白、音乐、环境声或任何其他声音。无字幕、无画面文字。
```

## B 镜：复制到 `content[0].text`

```text
写实悬疑电影画面，深夜，同一条空无一人的狭长走廊从近处延伸至远端。暗灰墙面，画面左侧是连续窗户，画面右侧中段是一扇暗色木门，门轴在门框右侧，门板向走廊内虚掩着一条窄缝；天花板一盏暖白灯稳定照亮门口，窗外微弱冷色雨夜光落在地面。平视、沿走廊轴线的固定中广景，右侧门和门框完整可见，同时保留左侧窗格和走廊尽头，焦点稳定在门和门框，摄影机全程静止。开头先保持门虚掩的状态片刻，随后门板缓缓朝门框转动，轻轻合拢，末尾保持关合；走廊中始终没有人。声音仅有两种：画外持续的雨声，以及门开始转动时出现并随门的转动结束而消退的轻微门轴声。无对白、无音乐、无人声、无脚步、无关门撞击声和其他声音。无字幕、无画面文字。
```

## 接口设置

向官方创建任务端点 `POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks` 分别提交两个 JSON 请求，使用 `Content-Type: application/json` 和 `Authorization: Bearer <调用者安全环境中的 API Key>`；不要将密钥写进提示词、交接文档或日志。每次的 `content` 仅有一个 `type: text` 项，其 `text` 分别填上面的完整 A 或 B 正文。两个请求的关键顶层字段为：

| 字段 | A | B | 说明 |
|---|---|---|---|
| `model` | `doubao-seedance-2-5-260628` | `doubao-seedance-2-5-260628` | 账号须已开通且可用 |
| `content` | `[{"type":"text","text":"A 镜完整正文"}]` | `[{"type":"text","text":"B 镜完整正文"}]` | 表格中的文字为填入位置说明，实际请求替换为上方全文；不传任何图片、视频或音频 |
| `duration` | `6` | `6` | 秒，显式请求；不设置 `frames` |
| `ratio` | `"16:9"` | `"16:9"` | 本方案选定，两次相同 |
| `resolution` | `"720p"` | `"720p"` | 本方案选定，两次相同 |
| `generate_audio` | `false` | `true` | A 关闭整个音频生成；B 开启，再靠提示词约束声源 |

`generate_audio` 为整段声音开关，不是按类别筛选器：`true` 不保证只产生指定声源，`false` 也不会单独保留雨声。账号开通状态与实际可用性未知；不要假定已经提交。提交后保留真实任务 ID，查询任务至终态并及时取回产物；若提交结果不明，先查询已知任务状态，避免盲目重复提交。

## 剪辑交接与验收

1. **时长：**计划两段各请求 6 秒、各完整采用 6 秒，顺序 A → B，成片目标 12 秒。这个方案没有可裁掉的入出点余量；如源片恰好各 6 秒，任何裁切都会缩短该镜。以实际文件帧数和帧率测量视频时长，不用 API 返回的整数 `duration` 代替精测；若输出时长或边界不合要求，重新生成或另行确认调整方案，不擅自变速、补帧或截短。
2. **画面：**检查 A 全程空场且门不动；A 末帧与 B 首帧核对门的开度、铰链侧、门框位置、窗格、灯位、走廊透视与冷暖光。B 检查门转动方向、连续关闭及末态，不能穿模或自行反向。独立文生仅提供文字一致性，不能保证两段像素或空间精确一致；若不匹配，优先重生成不合格的一镜并复查；引入新参考或改变路径须另行确定。
3. **声音与切点：**A 的 0–6 秒全部完全无声，检查文件的音轨及实际解码样本；没有音轨或音轨全为零均可满足听觉无声目标，若交付另要求无音轨则另查封装。B 从画面切入时才出现雨声，门轴声仅在门转动期间，听查有无音乐、人声、脚步、撞击及其他杂音，检查声画同步。A 绝不可叠入 B 的雨声或门轴声，不做跨入 A 的 J-cut；B 入点的雨声采用从零起的短淡入或在 B 内处理点击，不得提前进入 A，且以不影响两镜各 6 秒为前提。
4. **不合格处理：**B 若混入无法接受的对白、音乐或多余声响，先重生成并重新听查；如需可控的分离音效，可另行制作符合要求的雨声及门轴声并在后期替换 B 音频，仍需实际素材和验收，当前并无音效素材。A 如有任何声音，检查全流程和导出，并可移除 A 的全部音轨后复验。听审和波形检查都不能由提示词或参数声明代替。

## 官方证据

- [火山方舟：创建视频生成任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh)：文生视频、请求端点、模型能力、`duration`、`ratio`、`resolution` 与 `generate_audio`；页面所述返回 `duration` 是按帧数计算的整数近似。查阅于 2026-11-02。
- [Seedance 2.5 模型教程](https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh)：模型 ID、文本输入任务与时长范围。查阅于 2026-11-02；账号、实际请求和媒体均未验证。
- [查询视频生成任务 API](https://docs.volcengine.com/docs/ark/get-video-generation-task-api?lang=zh)：任务状态和生成结果回取。查阅于 2026-11-02。

## 本次读取文件的 SHA-256

以下为读取时本地文件哈希；网络页面以链接和查阅日期标识，没有伪造本地文件哈希。项目参考来自导演 skill 内的共享资源，平台 skill 目录下同名相对路径不存在。

```text
2f8ec74d9eb611de254984edac937b87d2e735803cee1c44a13d96277dd2975d  LOCAL_TEMP/cineweave-seedance-audio-case-20261102.txt
b1c68b8861d474a36f4edf7dadb45ee7e7228f9dc0e0f501c5121e3ab50bbf8c  skills/cineweave-director/SKILL.md
97dfad8a79a11ca8ca919548461d3e40f5f23a245422380af713e95b794e755b  skill-sources/cineweave-platform/SKILL.md
489709101da4dde48d01fbd4181382ef48e578183d5c6b735dc36227cdbf9667  skills/cineweave-director/references/routes/shot-direction.md
61bc1f72114f6980c23fe4077e9f0f4a5885a2f76f055a9361e537710b3d5b62  skills/cineweave-director/references/routes/storyboard-rhythm.md
8e58b107759a809803e3606086cd91e5ae2894fff0b7c3920308abaf3a0f59d0  skills/cineweave-director/references/routes/production-plan.md
d78ae24f884c453249435417e8703213a6fa7e5efbcb5973c6b78a95ac54db1c  skills/cineweave-director/references/optional/video-platform-adaptation.md
a90f61a0254a3375e9efc1f8a1d5791b6896832ae363826bd2699918ddb138a6  skills/cineweave-director/references/optional/video-model-practices-2026-10.md
da85f2ab44907d975ec86a3102f0626062ca2e5786b8ab29bc994d8d6920c660  skills/cineweave-director/references/optional/video-timing-and-handles.md
ca77595c37042bd7b21974736b50a485d983e8ea5b9bc90f74359e6a2c76d941  skills/cineweave-director/references/optional/video-sound-and-delivery.md
58923acd0d4b4ecac693e3e0467990e3c64a8a31a477fc540570157ec971df70  skills/cineweave-director/references/optional/cinematic-patterns.md
> [REDACTED: local memory reference]
```

相对路径均相对于 `LOCAL_PROJECTS/cineweave-codex-skills/cineweave-director`。未读取评测或安装缓存，未修改项目文件。
