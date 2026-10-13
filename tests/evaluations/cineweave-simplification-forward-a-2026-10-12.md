# CineWeave Skill 实际文字前向试跑报告 A

日期：2026-10-12。执行代理：simplify_forward_a。

本报告记录两次实际创作响应，两个请求作为互不相关的独立案例处理。原始请求、首版完整回答、实际读取的源文件与完整 SHA256、章节范围及工具命令全部保留。仓库仅作只读来源；所有产物写入 `D:\Temp\cineweave-simplify-forward-a-20261012`。本报告不依赖其他临时文件才能阅读。

本轮没有调用或安装供应商，没有生成或检查实际图像、视频或音频，没有运行项目测试或规划检查器，也没有查看任何既有 `tests/evaluations` 输出。结论仅限文字覆盖与约束核对。

# 前向试跑 1：竖幅写实陶艺师人物海报

## 原始用户请求

> 使用 CineWeave。为一位穿浅灰亚麻裙的成年陶艺师写一条竖幅写实人物海报生图提示词，她站在工作室窗边，手里捧着刚完成的陶碗。只要一份完整中文复制稿，不要先做项目规划。其他可见细节由你设计。

## 实际完整回答

```text
竖幅2:3写实人物海报，原创设计，无文字。主角是一位约三十五岁的成年女性陶艺师，身形自然匀称，长椭圆脸，平直而略有疏密变化的眉毛、深棕杏眼、鼻尖圆润，浅暖棕肌肤保留鼻翼与面颊的细毛孔、眼下轻微细纹和鼻梁几颗浅雀斑。素颜，无装饰性彩妆；深棕发在后颈松松束成低髻，耳前各有少量碎发，无发饰与首饰。她穿浅灰色亚麻连衣裙，圆领、自然肩线、七分宽袖，腰间以同料窄带轻束，裙摆垂至小腿下段；织纹清楚，面料哑光，腰侧与肘部有柔软褶皱，裙身靠近工作台一侧留有少量干燥陶泥痕迹，脚穿朴素米灰布鞋。

她站在陶艺工作室的大窗旁，身体与镜头形成轻微三分之四角度，双脚稳落在地面，重心落在人物右脚，左脚略向前，肩颈放松。双手在腹部上方捧着一只刚完成的小陶碗：人物左手掌托住碗底，右手从侧面扶住碗壁，拇指与其余手指分列碗壁两侧，手指、掌心与陶碗的实际接触清楚，手腕自然，碗口朝上且保持水平，不遮挡面部。陶碗呈温润的灰米色，圆口与浅腹完整可辨，薄釉在靠窗侧形成一段柔和高光，碗沿保留细微的手作起伏。她的目光落在碗口内侧，头部轻轻低垂；眉间舒展，下眼睑略放松，双唇自然合拢、不露齿，嘴角小幅上扬，呈现完成作品后安静而克制的满足。

画面左侧是高大的木框窗，柔和阴天日光从人物左前方斜照进来，照亮近窗侧面颊、前臂、陶碗与裙料；远窗侧由浅色墙面的反射光轻轻补起，面部仍有自然明暗，鼻下和下颌有柔软阴影。窗玻璃上的光线不过曝，窗外仅见虚化的灰绿色树影。人物脚下是浅灰水泥地，鞋底与地面有明确接触阴影。画面右后方是一张有使用痕迹的浅木工作台，台面放一块揉泥布、一把木质修坯刀和两只未上釉的素坯，彼此分开，不与双手或陶碗轮廓重叠；后墙的开放木架上疏落摆放少量陶器。

平视全身构图，从头顶到双脚完整入画，人物占画面主要高度，头顶与裙摆外缘留出呼吸空间；窗框的竖线与工作台水平边缘组织安静的几何关系，观众先读到她的脸与捧碗的双手，再看到工作室环境。采用自然人像透视，焦点落在近侧眼睛，双手、碗沿与亚麻织纹保持可读，背景适度柔化但空间结构可辨。整体色彩以浅灰、灰米和浅木色为主，肤色温和，阴影中保留细节，皮肤、亚麻与陶釉分别呈现自然纹理、柔和漫反射和局部釉面高光。避免多余手指、手掌穿透碗壁、悬浮陶碗、重复道具、塑料皮肤、浓重磨皮、夸张笑容、无来源的光束、画面文字和水印。
```

## 本次实际读取来源

仓库根目录：`D:\study\projects\cineweave-codex-skills\cineweave-director`。下表 SHA256 为完整源文件的字节哈希；读取范围指本次实际进入上下文的正文，不表示全文加载。

| 文件 | 实际读取范围 | SHA256 |
| --- | --- | --- |
| `skills/cineweave-director/SKILL.md` | 全文 | `18D40408575640D65220B0D4527D356EC4509DC7856E8F0C35DC15142C2AF426` |
| `skills/cineweave-director/references/routes/image-prompt.md` | 全文 | `8875D78177EDCE7AB4AAEA763BF0F6D3BDC6216EE1ACF3C215AAB661B96E5C08` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | 先读取标题目录；再读取第5–76、108–119、216–224行，覆盖表达原则、人物与表情、场景、构图、灯光和交付前检查 | `0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59` |
| `skills/cineweave-director/references/core/operating-model.md` | 先读取标题目录；再读取第9–16行「任务范围与上下文」 | `932BDFA72EB114B93673CB0E2A4490A293C1302FC3822F4D832A749164DA101E` |

另做了一次开发者要求的记忆轻量检索：`C:\Users\ww\.codex\memories\MEMORY.md`，命中 CineWeave 历史条目；SHA256 为 `8C1B8811611153E08C437ED27F10FE7DA9CBA6271086D75210C27BCFAF7B2380`。未打开其指向的历史 rollout，未将历史设定或既有测试结果用于本次创作。仓库祖先路径的 `AGENTS.md` 检查未发现文件。工具明细与退出码见本报告末尾的实际工具日志。

## 人工核对与证据边界

- 用户硬锁均进入复制稿：成年陶艺师、浅灰亚麻裙、工作室窗边、双手捧刚完成的陶碗、竖幅、写实。
- 一份完整中文稿，没有先做项目规划；新增年龄、长相、服装结构、陈设、光线和构图均为本次授权原创设计。
- 静帧采用唯一视线、闭唇浅笑和同一握持状态，没有塞入动作序列。
- 未调用供应商，未生成或查看实际图像；手部、材质、构图与视觉质量均未做媒体验收。
- 本请求和 request-2 是独立创作；本次人物、服装、工作室、道具与灯光不带入下一条。

# 前向试跑 2：温室折纸鸟 6 秒图生视频与声音意图

## 原始用户请求

> 这是另一个独立小项目。首帧设计是空旷温室里一只红色折纸鸟停在白色金属栏杆上，镜头正对它。没有上传实际图片。写一条 6 秒图生视频运动提示词：鸟展开翅膀，向前飞出，镜头缓慢跟进。同时给声音意图，其他由你设计，不需要正式制作交接。

## 实际完整回答

以下是基于文字首帧的待绑定稿，尚未核对实际图片。本次将鸟的朝向设计为温室中央通道，把“向前”定义为飞向温室纵深；时间段是6秒内的调度意图。

**运动提示词：**

```text
6秒连续单镜头。起始镜头从白色金属栏杆近侧正对红色折纸鸟所在位置，机位略高于栏杆顶面，鸟位于画面中央，鸟喙朝向栏杆另一侧的温室中央通道。红纸的哑光表面、锐利折边与两片对称纸翼清楚可辨，鸟腹下缘的折边稳贴栏杆顶面。空旷温室的白色金属骨架与玻璃墙向后延伸，中央通道畅通，柔和晨光从画面右侧玻璃窗进入，红色纸鸟是画面唯一鲜明的色彩焦点。

0—1.5秒，鸟身保持在栏杆上，两片纸翼沿原有折痕缓缓向两侧展开，翼根转动，翼尖略晚于翼根到位；展开后短暂停留，折纸轮廓与纸面厚度保持一致。1.5—2.5秒，纸翼同时向下拍动，鸟身随之抬升，腹部折边与栏杆清楚分离，再朝温室纵深轻快地飞出，栏杆逐渐落到画面下缘。2.5—6秒，鸟沿中央通道平稳向前飞行，以小幅而有节奏的纸翼拍动维持高度，经过一段短滑翔，飞行路线逐渐抬高至通道中部上方，始终与玻璃和骨架保持距离。

镜头在鸟离开栏杆时开始沿通道轴线缓慢向前跟进，移动速度低于鸟的飞行速度，保持平顺，鸟仍处于画面中部并逐渐稍微变小，栏杆从下方退出画面，温室骨架产生自然的前后视差。焦点持续跟随纸鸟，景深让玻璃骨架仍可辨；光源方向与纸面明暗关系保持稳定。第6秒时鸟已飞入温室纵深，双翼处于一次拍动后的展开相位，继续向前，镜头仍在缓慢跟进。保持同一只红色折纸鸟、同一温室和同一栏杆，不增生翅膀，不变成真实羽毛鸟，不发生纸面融化、折痕漂移、撞栏杆或突然切镜。
```

**声音意图：**

```text
以镜头位置作为聆听视点。全程保留很轻的温室通风气流和空旷玻璃空间的短而柔和回响，环境底声平稳。0—1.5秒，随翼根与折痕展开出现细小、干燥的纸张摩擦声，起初贴近画面中央；1.5—2.5秒，第一次下拍和离开栏杆对应一声稍清楚的纸翼扑动与轻柔空气掠动。2.5—6秒，后续拍翼声与可见下拍相扣，短滑翔时仅剩环境底声；纸鸟越飞越远，纸张声音逐渐降低、变薄，保留少量空间回响。采用纸张与空气拟音，无鸟鸣、对白或音乐。实际音画同步留待生成后的媒体核对。
```

## 本次实际读取来源

仓库根目录：`D:\study\projects\cineweave-codex-skills\cineweave-director`。下表 SHA256 为完整源文件的字节哈希；读取范围指本次实际进入上下文的正文，不表示全文加载。

| 文件 | 实际读取范围 | SHA256 |
| --- | --- | --- |
| `skills/cineweave-director/SKILL.md` | 在本独立任务中重新读取全文 | `18D40408575640D65220B0D4527D356EC4509DC7856E8F0C35DC15142C2AF426` |
| `skills/cineweave-director/references/core/operating-model.md` | 在本独立任务中重新读取第9–16行「任务范围与上下文」 | `932BDFA72EB114B93673CB0E2A4490A293C1302FC3822F4D832A749164DA101E` |
| `skills/cineweave-director/references/routes/production-plan.md` | 全文 | `EFBDE14FB9810D392A696A0EE4E6AACA3B2F64998C291F4AB9936F5C6E41273A` |
| `skills/cineweave-director/references/optional/video-sound-and-delivery.md` | 先读取标题目录；再读取第1–70行，覆盖视频意图、段落边界、声音职责和时间检查（包括可选检查器示例，仅阅读、未运行） | `CFD0A201805AB58F05EBE5EDA1025359776EB78534CFB849472F728594DA6A16` |
| `skills/cineweave-director/references/optional/prompt-detail-standard.md` | 本任务新读第151–162行「图生视频」与第120–129行「收音与声音空间」；通用表达原则已在技能阅读阶段读取，不带入前案原创素材 | `0DE944DFFD30D69BC05A52EF4BCEAF0A90DCE40564E2F1A288C68E7DD1E88E59` |

工具明细与退出码见本报告末尾的实际工具日志。未读取其他平台适配、契约、整片流程、群像工作表或既有 tests/evaluations 产物。

## 人工核对与证据边界

- 保留本请求的独立硬锁：空旷温室、红色折纸鸟、白色金属栏杆、镜头正对鸟所在位置、展开翅膀、向前飞出、镜头缓慢跟进、6秒、声音意图。
- 用户未锁定鸟自身朝向；正文外明确了本次设计的鸟朝向和前进方向。起飞写清腹部折边接触、展开、下拍、离栏和位移，鸟与相机的速度分开。
- 单段中文运动稿及独立声音意图已经完整交付，没有正式制作交接、虚构素材绑定、模型槽位、任务ID或供应商回执。
- 尚无实际首帧，没有完成关键帧准备度、像素、运动时序、折纸形变、摄影机路径或声音同步的媒体验收。
- 未调用供应商，未生成或查看图像、视频、音频；未运行视频规划或交付检查器。时间段为文字调度目标，不是实测返回时长。
- 未复用 request-1 的陶艺师、服饰、工作室、陶碗、光线、表情或任何批准声明。

# 实际工具与退出码

所有仓库命令的工作目录均为 `D:\study\projects\cineweave-codex-skills\cineweave-director`。仅进行源文档读取、路径存在性检查与 SHA256 计算；所有写入均位于 `D:\Temp\cineweave-simplify-forward-a-20261012`。没有安装包、访问供应商、运行项目测试或读取既有 tests/evaluations 输出。以下命令按实际执行顺序记录，独立读取曾在同一次工具调度中并行执行。

## 读取与哈希工具

以下全部通过 `exec_command` 使用 PowerShell 执行，退出码均为 `0`。

### 01 — Skill 入口（输出 chunk 7073dc）

```powershell
Get-Content -LiteralPath 'D:\study\projects\cineweave-codex-skills\cineweave-director\skills\cineweave-director\SKILL.md' -Raw
```

### 02 — 记忆轻量检索（输出 chunk 280cde）

```powershell
rg -n 'CineWeave|context-isolation|single-entry|entry|路由' 'C:\Users\ww\.codex\memories\MEMORY.md'
```

只读取搜索命中行；没有继续打开历史 rollout，搜索结果没有用作这两份创作稿的素材或媒体证据。

### 03 — AGENTS.md 存在性检查（输出 chunk bc3060）

```powershell
$taskPaths = @('D:\AGENTS.md','D:\study\AGENTS.md','D:\study\projects\AGENTS.md','D:\study\projects\cineweave-codex-skills\AGENTS.md','D:\study\projects\cineweave-codex-skills\cineweave-director\AGENTS.md'); foreach ($taskPath in $taskPaths) { if (Test-Path -LiteralPath $taskPath) { Write-Output $taskPath; Get-Content -LiteralPath $taskPath -Raw } }
```

输出为空，以上路径均未发现可读取的 AGENTS.md。

### 04 — 图像路由全文（输出 chunk b42232）

```powershell
Get-Content -LiteralPath 'skills\cineweave-director\references\routes\image-prompt.md' -Raw
```

### 05 — 提示词细节标题定位（输出 chunk 4303fa）

```powershell
rg -n '^#|^##|^###' 'skills\cineweave-director\references\optional\prompt-detail-standard.md'
```

### 06 — 独立上下文标题定位（输出 chunk 78f39e）

```powershell
rg -n '^#|^##|^###|任务范围与上下文' 'skills\cineweave-director\references\core\operating-model.md'
```

### 07 — 案例1对应细节章节（输出 chunk 1ca73d）

```powershell
$taskFile = 'skills\cineweave-director\references\optional\prompt-detail-standard.md'; $taskLines = Get-Content -LiteralPath $taskFile; foreach ($taskRange in @(@(5,76),@(108,119),@(216,224))) { for ($taskLine = $taskRange[0]; $taskLine -le $taskRange[1]; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) } }
```

### 08 — 任务范围与上下文（输出 chunk 5c2397）

```powershell
$taskLines = Get-Content -LiteralPath 'skills\cineweave-director\references\core\operating-model.md'; for ($taskLine = 9; $taskLine -le 16; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) }
```

### 09 — 首次哈希输出（输出 chunk 5e8ded）

```powershell
$taskFiles = @('skills\cineweave-director\SKILL.md','skills\cineweave-director\references\routes\image-prompt.md','skills\cineweave-director\references\optional\prompt-detail-standard.md','skills\cineweave-director\references\core\operating-model.md','C:\Users\ww\.codex\memories\MEMORY.md'); foreach ($taskFile in $taskFiles) { Get-FileHash -LiteralPath $taskFile -Algorithm SHA256 | Select-Object Path,Hash }
```

该命令成功计算，但 PowerShell 表格格式只展示了路径，未完整输出哈希；下一条改用 JSON 再次读取。

### 10 — 建立记录目录及完整哈希输出（输出 chunk a14253）

```powershell
New-Item -ItemType Directory -Path 'D:\Temp\cineweave-simplify-forward-a-20261012' -Force | Select-Object FullName; $taskFiles = @('skills\cineweave-director\SKILL.md','skills\cineweave-director\references\routes\image-prompt.md','skills\cineweave-director\references\optional\prompt-detail-standard.md','skills\cineweave-director\references\core\operating-model.md','C:\Users\ww\.codex\memories\MEMORY.md'); $taskHashes = foreach ($taskFile in $taskFiles) { $taskHash = Get-FileHash -LiteralPath $taskFile -Algorithm SHA256; [pscustomobject]@{Path=$taskHash.Path;SHA256=$taskHash.Hash} }; $taskHashes | ConvertTo-Json -Depth 3
```

### 11 — 案例2制作规划路由（输出 chunk 376c5d）

```powershell
Get-Content -LiteralPath 'skills\cineweave-director\references\routes\production-plan.md' -Raw
```

### 12 — 视频章节定位及图生视频章节（输出 chunk 05bbaa）

```powershell
rg -n '^#|^##|^###' 'skills\cineweave-director\references\optional\video-sound-and-delivery.md'; $taskLines = Get-Content -LiteralPath 'skills\cineweave-director\references\optional\prompt-detail-standard.md'; for ($taskLine = 151; $taskLine -le 162; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) }
```

### 13 — 独立案例2重新读取入口与上下文规则（输出 chunk 3ec922）

```powershell
Get-Content -LiteralPath 'skills\cineweave-director\SKILL.md' -Raw; $taskLines = Get-Content -LiteralPath 'skills\cineweave-director\references\core\operating-model.md'; for ($taskLine = 9; $taskLine -le 16; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) }
```

### 14 — 视频、声音与时间章节（输出 chunk 52180b）

```powershell
$taskLines = Get-Content -LiteralPath 'skills\cineweave-director\references\optional\video-sound-and-delivery.md'; for ($taskLine = 1; $taskLine -le 70; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) }
```

其中含可选只读检查器说明与 JSON 示例，仅阅读。没有运行文中的 `check-video-plan.mjs` 或 `check-delivery.mjs`。

### 15 — 案例2新增来源 SHA256（输出 chunk 4fcb63）

```powershell
$taskFiles = @('skills\cineweave-director\references\routes\production-plan.md','skills\cineweave-director\references\optional\video-sound-and-delivery.md'); $taskHashes = foreach ($taskFile in $taskFiles) { $taskHash = Get-FileHash -LiteralPath $taskFile -Algorithm SHA256; [pscustomobject]@{Path=$taskHash.Path;SHA256=$taskHash.Hash} }; $taskHashes | ConvertTo-Json -Depth 3
```

### 16 — 声音空间章节（输出 chunk e29c4a）

```powershell
$taskLines = Get-Content -LiteralPath 'skills\cineweave-director\references\optional\prompt-detail-standard.md'; for ($taskLine = 120; $taskLine -le 129; $taskLine++) { Write-Output ('{0}:{1}' -f $taskLine,$taskLines[$taskLine - 1]) }
```

## 临时产物写入工具

- `apply_patch` 创建 `request-1.md`，成功返回 `{}`；该工具不提供 shell 退出码。其完整创作回答及来源已原样保存在文件正文。
- `apply_patch` 创建 `request-2.md`，成功返回 `{}`；该工具不提供 shell 退出码。其完整创作回答及来源已原样保存在文件正文。
- `apply_patch` 创建本 `tool-log.md`；该工具不提供 shell 退出码。

## 实际未运行的项目

未运行任何项目测试、合同检查、发布验证、视频工作表检查、交付检查、关键帧分析、图像生成、视频生成、音频生成、供应商安装、素材上传或发布。未读取 `tests/evaluations` 内的任何既有文件。文字人工核对仅支持稿件覆盖情况，不能证明媒体效果、6秒实际动作可行性或音画同步。

## 报告组合与记录完整性核对

### 17 — 自包含报告组合与最终源文件复核

通过 `exec_command` 使用 PowerShell 读取本轮刚创建的 `request-1.md`、`request-2.md` 和 `tool-log.md`，将两份完整正文及全部工具记录组合到 `report.md`，并再次对6个实际读取的仓库源文件执行 `Get-FileHash -Algorithm SHA256`。输出 chunk 为 `115cbd`，退出码 `0`。全部6个源文件哈希与阅读阶段记录一致；当时报告大小为19142字节，后续补入本核对记录。

### 18 — 回答未省略与链接格式核对

通过 `exec_command` 使用 PowerShell 执行下列只读检查，输出 chunk 为 `683d05`，退出码 `0`：

```powershell
$taskRoot = 'D:\Temp\cineweave-simplify-forward-a-20261012'; $taskReport = Get-Content -LiteralPath (Join-Path $taskRoot 'report.md') -Raw; $taskOriginals = @((Get-Content -LiteralPath (Join-Path $taskRoot 'request-1.md') -Raw),(Get-Content -LiteralPath (Join-Path $taskRoot 'request-2.md') -Raw)); $taskAnswers = foreach ($taskOriginal in $taskOriginals) { [regex]::Match($taskOriginal,'(?s)## 实际完整回答\s*(.*?)\s*## 本次实际读取来源').Groups[1].Value }; $taskFound = foreach ($taskAnswer in $taskAnswers) { $taskReport.Contains($taskAnswer) }; [pscustomobject]@{CaseCount=([regex]::Matches($taskReport,'## 原始用户请求')).Count;CompleteAnswerPresent=$taskFound;AnswerTextBlockCount=([regex]::Matches($taskReport,'```text')).Count;WindowsAbsoluteMarkdownLinks=([regex]::Matches($taskReport,'\]\([A-Za-z]:')).Count;SourceSha256Count=([regex]::Matches($taskReport,'[A-F0-9]{64}')).Count;LineCount=($taskReport -split "`n").Count} | ConvertTo-Json -Depth 3
```

核对结果：2个原始请求，两份回答的完整正文均原样存在（`true, true`），3个中文回答复制块，0个 Windows 绝对路径 Markdown 链接，10处完整 SHA256记录。该检查仅确认记录没有省略正文和链接格式，不是产品测试或媒体验收。

`apply_patch` 将这两项已执行工具及核对结果补入本报告与临时工具日志；该工具不提供 shell 退出码。


