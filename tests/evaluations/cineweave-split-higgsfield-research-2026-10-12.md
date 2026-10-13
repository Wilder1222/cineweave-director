# Higgsfield 固定版本源码：Skill 拆分与编排研究

研究日期：2026-10-12。只读分析以下两个本地 Git 快照，已用 `git rev-parse HEAD` 和 `git remote -v` 核对；另通过网页打开对应固定 SHA 的 CLAUDE、COOKBOOK、CI 和 CLI README。本文不把架构说明、示例命令或截图视为运行成功证明，没有登录 Higgsfield、提交生成任务或观察生成媒体。

- Skills：`D:\Temp\cineweave-higgsfield-analysis-a19bba159be7468dad920793bff927ae`，`f83af0bc1d937c8119099a11f8ebbf5e6fb99819`，根版本 `0.13.0`。
- CLI：`D:\Temp\cineweave-higgsfield-cli-6502579437a944788e9fd7a1e40e915c`，`dc7e2d2eac0b1fdad255de24d87552d1ba479037`。
- 固定来源入口：[Skills 快照](https://github.com/higgsfield-ai/skills/tree/f83af0bc1d937c8119099a11f8ebbf5e6fb99819)、[CLI 快照](https://github.com/higgsfield-ai/cli/tree/dc7e2d2eac0b1fdad255de24d87552d1ba479037)。下文行号均为文件自身行号，不是网页渲染行号。

## 1. 可核实的体系与实际八个 Skill

Higgsfield 按用户要拿到的交付物和服务入口拆分；并不是八个大小相同的技术模块，也不是一个中央 Skill 动态调度八个子代理。每个 Skill 提供名称、触发说明、排除边界、自己的步骤和本地参考。统一工具入口是 `higgsfield` CLI。八个目录在 Claude marketplace 中逐一列出，Codex manifest 则把 `skills` 指向仓库根目录。[marketplace.json L13-L22](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/.claude-plugin/marketplace.json#L13-L22)、[Codex manifest L26-L30](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/.codex-plugin/plugin.json#L26-L30)。

以下规模是固定本地文件实测，不是推荐配额。八个入口共 1,627 行，顶层 references 共 78 个、脚本共 14 个。仓库的“尽量小于 300 行”是贡献指导；generate 实际有 322 行，CI 未设置入口长度门槛。

| Skill / 入口行数 / references / scripts | 实际职责与触发 | 输入输出与依赖 | 主要排除边界 |
|---|---|---|---|
| `higgsfield-generate` / 322 / 12 / 0 | 泛用图片、视频、3D、音频；Marketing Studio 广告与成品视频的 Virality Predictor 分析；触发包含生成、编辑、动画、产品 URL 导入、广告、声音 | 用户意图、路径或已有 UUID；CLI 返回任务、媒体 URL 或分析报告；可消费 Soul ID；动态发现 model/workflow | 身份训练、完整品牌系统、产品摄影、卡片、缩略图、完整 explainer、可玩游戏及游戏资产、TTS |
| `higgsfield-soul-id` / 85 / 2 / 0 | 从真人照片训练 Soul Character；数字分身、学习外观、为生成建立身份 | 名称与照片 → `reference_id`；下游 generate 使用 `--soul-id`；训练需登录与付费资格 | 一次性换脸、非照片原创角色；后者回 generate |
| `higgsfield-product-photoshoot` / 215 / 0 / 0 | 产品摄影和品牌产品画面；棚拍、生活场景、hero、轮播、试穿、概念产品、restyle 等十个模式 | 产品图/明确产品信息与短意图 → backend prompt enhancer → 固定 `gpt_image_2` → URL；自行完成流程 | 无产品的泛用生图、avatar 广告视频、marketplace listing、Soul 训练 |
| `higgsfield-brandkit` / 202 / 24 / 3 | 完整品牌系统及延展；调色板、SVG logo、字体、包装、社交图、标识、物料、可编辑 Brandbook | supplied official assets 或 brief；持久 approval state、独立 slot revisions、局部下游失效；CLI + 本地 Python/渲染工具 | 无品牌泛用图、产品目录摄影、网站实现、原生 Figma/Canva/PSD/AI 交付 |
| `higgsfield-marketplace-cards` / 88 / 0 / 0 | listing 主图、secondary、A+ 模块；商城上下文和常用套装是触发关键 | 产品/品牌/listing 信息、图、scope 或 asset → 私有 backend enhancer → `nano_banana_2` URLs；可消费已有 completed main job | 普通品牌摄影、视频/UGC、身份训练 |
| `higgsfield-websites` / 254 / 37 / 11 | 网站、app、game 创建/编辑/部署；同一入口再按 `--type` 路由三个完整流程；还拥有游戏 spritesheet、texture、3D animation、游戏音效音乐 | CLI provision/deploy；本地 git+bun 改代码；Cloudflare Worker；游戏设计、asset manifest、资产加工脚本 | 单次图片/视频/音频、产品摄影、marketplace cards；产品类型各有品牌及集成边界 |
| `higgsfield-video-explainer` / 281 / 1 / 0 | 完整非写实旁白解释/故事片；风格、文档或主题、旁白、视频、最终 assembly 都在本 Skill | one style key + one voice + 有序 10 秒 blocks；每 block 一段 Seed Audio 和一段 Gemini Omni；typed job pairs 交给 `explainer_video` | 写实电影、广告/UGC、talking head、podcast、motion typography、无旁白的一次性 clip、成片编辑 |
| `higgsfield-youtube-thumbnail` / 180 / 2 / 0 | 真实内容对应的 YouTube thumbnail 和竖版 cover；信息缺口 concept、最多三个人身份参考、logo、独立受控变体、局部 tweak | 已知视频主题/视觉方向 + 可选身份/logo；Nano Banana Pro main render、Seedream 局部编辑；可接任何视频工作流 | 视频本身、产品目录摄影、marketplace cards |

入口依据：

- [generate SKILL L4-L24、L67-L124](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-generate/SKILL.md#L4-L24)
- [soul-id SKILL L4-L16、L41-L67](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-soul-id/SKILL.md#L4-L16)
- [photoshoot SKILL L4-L22、L136-L208](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-product-photoshoot/SKILL.md#L4-L22)
- [brandkit SKILL L4-L7、L66-L100](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-brandkit/SKILL.md#L66-L100)
- [marketplace SKILL L4-L16、L64-L75](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-marketplace-cards/SKILL.md#L4-L16)
- [websites SKILL L4-L9、L111-L154](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-websites/SKILL.md#L4-L9)
- [explainer SKILL L4-L23、L106-L119、L191-L272](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-video-explainer/SKILL.md#L4-L23)
- [thumbnail SKILL L4-L12、L138-L167](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-youtube-thumbnail/SKILL.md#L4-L12)

关键拆分经验：完整 narrated explainer 并未被切成 narration Skill、clip Skill、assembly Skill；website 的三种产品也没有再拆成三个 Skill。相互依赖密集、必须形成一个完整交付物的步骤，被留在一个 owner 内，用按需 references 承载细节。八 Skill 只是外层交付物边界，内部仍有领域路由。

## 2. 跨 Skill 编排：声明流程、数据交接与可见运行代码

根 CLAUDE 将 chaining 定义为返回值通信：Soul 的 `reference_id` 被 generate 消费；photoshoot 自有 pipeline；cards 可复用 `--main-job`；explainer 拥有完整音画 assembly；websites 拥有整个 game 生命周期。identity + output 组合请求要求先完成 Soul 再进入 generate。[CLAUDE L149-L160](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/CLAUDE.md#L149-L160)。

COOKBOOK 是“用户说什么、agent 运行什么”的五个 Markdown recipe；其中确实包含可由 shell 执行的命令片段，但未提供统一 scheduler、状态机 runner、Skill invoke API、跨 Skill retry/resume 或依赖安装解析器。检索两个快照的完整 `git ls-files`，可见 setup/update checker、局部 deterministic 脚本和 GitHub CI，未发现多 Skill 调度程序。这个结论只限公开固定快照，不代表运行宿主或私有 backend 不存在其他调度能力。

| Recipe | 文档中的衔接 | 真实可核实程度 / 问题 |
|---|---|---|
| #1 founder campaign | Soul training → photoshoot 5 图 → generate animate 2 图 | 声明跨 3 Skill。训练返回的 `reference_id` 在展示的 photoshoot 命令中没有被消费；该命令只有 bottle 图。后面 tips 又建议改用 Soul still model 来保身份，但 photoshoot 自身规定始终固定 `gpt_image_2`。因此范例未闭合 founder identity 的消费链，不能作为端到端身份一致的运行证据。 |
| #2 UGC URL batch | product fetch → avatar discovery → 4 modes 并行 → URLs | 大部分在 generate/Marketing Studio 内；shell `&` + `wait` 是命令级并行，不是多 Skill scheduler。Soul founder custom avatar 是可选支线。 |
| #3 founder update | 一次训练 → 保存 reference_id → Marketing Studio custom avatar 或 Soul model | manifest/ID 保存属于声明。Option B 使用 `soul_cinematic --duration 60` 做 video；同版 skills model-catalog 将它定义为 cinematic stills，CLI README 放在 Image 表，MODELS 的参数没有 duration。可以确认固定文档相互不一致，不能据此断言今日 live API 一定失败。 |
| #4 document explainer | source reading → live preset resolve → voice takes 全部完成 → 对应 clips → typed ordered assembly | 一个 Skill 内的 stage barrier；配对数据和先后次序写得较具体，无本地脚本自动执行整套阶段。 |
| #5 browser game | game profile/style/asset manifest → provision → code/assets → local verification → deploy | 一个 websites Skill 内完整流程；publish 单独由用户请求。 |

证据：[COOKBOOK L7-L64](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/COOKBOOK.md#L7-L64)、[L84-L130](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/COOKBOOK.md#L84-L130)、[L158-L208](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/COOKBOOK.md#L158-L208)、[L220-L272](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/COOKBOOK.md#L220-L272)、[Soul still catalog L24-L25](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-generate/references/model-catalog.md#L24-L25)、[CLI MODELS L295-L307](https://github.com/higgsfield-ai/cli/blob/dc7e2d2eac0b1fdad255de24d87552d1ba479037/MODELS.md#L295-L307)。

可见的真正领域代码最值得区分：brandkit 的 `brandkit.py` 实现了持久 state、revision 和依赖失效。`save_slot` 阻止 generated approval 替换用户 supplied official slot；slot 变化移除带相关依赖的 Brandbook elements；palette 变化还移除 palette-dependent generated logo；下游元素保存时验证所需 slots 并记录精确 revision。[brandkit.py L325-L376](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-brandkit/scripts/brandkit.py#L325-L376)、[L519-L562](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-brandkit/scripts/brandkit.py#L519-L562)。这是局部资产状态维护，不能扩大表述成整套 Skill DAG 调度。

websites 的 `scripts/pipeline.py` 名称容易误导：L2-L13 明确是纹理后处理，从 GPT 图输出到无缝贴图和 PBR maps；它不是网站构建或多 Skill orchestration engine。[pipeline.py L1-L19](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-websites/scripts/pipeline.py#L1-L19)。

## 3. 统一 CLI 与 schema/live discovery：可吸收的是边界，执行效果尚未验证

Skills 根文档要求所有服务调用走同一个 CLI，不直接 curl API；声称 CLI 封装 auth、retry、polling、schema validation 和 local-file auto-upload。返回以 `--json` 供 agent 继续衔接，`--wait` 到终态再给结果。models、workflows、CMS presets、animation actions 分别通过 live commands 发现，references 只做“意图 → 命令”映射。[CLAUDE L71-L82](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/CLAUDE.md#L71-L82)。

generate 还防止只靠语义搜索或 help 判定不存在：先读完整 model list，再查候选技术名；workflow 是独立目录，先 list 再 get schema；参数不确定时查询首选模型 schema，不为参数简单而降级。[generate L51-L55](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-generate/SKILL.md#L51-L55)、[L118-L124](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-generate/SKILL.md#L118-L124)。

CLI 公开快照仅包含 README、MODELS、install.sh、license/notices 和 demo.png；没有 CLI 运行实现、package manifest、测试或 schema validator 源码。README 可以支持命令界面说明；install.sh 的 release binary 下载与安装行为可直接审计；不能从该快照确认私有 backend enhancer、retry 算法、校验真实强度、assembler 声音速度/字幕效果。MODELS L3 本身注明来自 model list/get 的生成快照，live schema 仍需查询。[CLI MODELS L1-L7](https://github.com/higgsfield-ai/cli/blob/dc7e2d2eac0b1fdad255de24d87552d1ba479037/MODELS.md#L1-L7)、[CLI README L584-L615](https://github.com/higgsfield-ai/cli/blob/dc7e2d2eac0b1fdad255de24d87552d1ba479037/README.md#L584-L615)、[installer L48-L88](https://github.com/higgsfield-ai/cli/blob/dc7e2d2eac0b1fdad255de24d87552d1ba479037/install.sh#L48-L88)。

还存在跨快照同步缺口：Skills 固定版本同样出现了 CLI README commands 表没有列出的 marketplace-cards，而 website commands 表还写 website/app，Skill 已写 website/app/game；Skills 默认 Seedance 2.5，但固定 CLI MODELS 尚未列它的专节。这些是静态资料之间的覆盖差异；既不能因此证明功能不存在，也不能声称版本兼容已被测试。Skill repo-wide `0.13.0` 同步不包含 CLI 最低版本、服务 schema digest 或执行器兼容矩阵。

对 CineWeave 的迁移应是“统一契约检查与有 scope 的平台能力记录”，不是安装供应商 CLI。外部执行适配器只能消费平台投影/生产计划；它的参数和 ID 不应反写世界设定、人物 canon 或已批准动作。CineWeave 仍是非执行型创作 Skill，实际提交/付费/部署属于外部生产工具边界。

## 4. 自包含与版本同步：实际 CI 比口号窄

设计声明：每个 Skill 独立，无 parent-directory 引用；references 从自己的入口可达；同名 troubleshooting 允许各自保存，甚至接受跨 Skill 文档 drift，只要求内部一致。所有 Skill 与 plugin manifests 共用根 VERSION。[CLAUDE L123-L147](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/CLAUDE.md#L123-L147)。

唯一可见 workflow 为 `validate-skills.yml`，实际覆盖如下：

| CI 检查 | 源码行为 | 不证明什么 |
|---|---|---|
| frontmatter L37-L80 | YAML 可解析、name 等于目录、存在 version/description、description ≤1024 字符、包含 Use when 与 NOT for 文本 | 触发是否互斥、Chain 是否闭合、allowed-tools 合法性、metadata 行为或质量 |
| version sync L82-L112 | 八 Skill frontmatter version、3 plugin manifest、marketplace plugins[0].version 与 VERSION 一致 | CLI/API/schema兼容、单独叶 Skill ABI、自动 release 工作流已接通 |
| marketplace completeness L114-L126 | 每个 higgsfield-* 目录名都在 skills 数组中 | 列表中多余/不存在目录的反向检查、安装后宿主发现成功 |
| references L128-L153 | 当 references 目录存在时，入口 regex 命中的 `references/*.md` 路径存在；顶层 references/*.md 的 basename 出现在入口 | 解析 Markdown 图、递归 references、脚本/JSON/图片资源闭包、传递依赖、文件内容一致 |
| parent paths L155-L172 | SKILL.md 禁 ../；references 递归检查 ../../ | 不是全文件系统依赖审计；references 中 ../scripts 是允许的，scripts 本身的外部导入/运行依赖未检查 |

CI 触发 path filter 包含 Skill、plugin、VERSION 和 workflow 自身，未包含根 CLAUDE、COOKBOOK、INSTALL、setup、evals 的文档变更。没有 300 行长度约束、重复共享规则哈希、cross-Skill dependency DAG、最小安装组合试验、自动行为 runner 或媒体试片验证。[完整 CI L3-L20、L37-L172](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/.github/workflows/validate-skills.yml#L3-L20)。

这里的“standalone”首先是文件打包闭合，不等于 chain 中其他 Skill 一定可用，也不等于跨 Skill 根文档规则一定随叶 Skill 一起安装。若核心先后次序只在根 CLAUDE/COOKBOOK 描述，单独安装叶目录后不能默认宿主还能读到它。

## 5. 安装、缺 Skill 与 metadata 碰撞

INSTALL 声明 npx skills、gh skill install、Claude marketplace 三条路径安装全部八 Skill；setup 则使用固定八项数组，检测 host 后逐目录软链接。setup 会保留非目标 symlink 的现有普通目录；验证只确认各目标存在 SKILL.md。它在 CLI 已存在时打印版本，没有最低兼容版本校验；CLI 安装缺省拉最新 release。CLI installer 有 `--tag` 可固定 release，但 Skill bootstrap 命令都使用 main 上 installer、默认最新。[INSTALL L29-L70](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/INSTALL.md#L29-L70)、[setup L70-L98、L104-L175](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/setup#L70-L98)、[CLI install L21-L29、L48-L59](https://github.com/higgsfield-ai/cli/blob/dc7e2d2eac0b1fdad255de24d87552d1ba479037/install.sh#L21-L29)。

安装层还有文档路径差异：setup 对 Cursor/Codex 将每个 Skill 链入 `~/.cursor/plugins/<skill>`、`~/.codex/plugins/<skill>`；INSTALL_FOR_AGENTS 则写整仓库 clone 到 `~/.cursor/plugins/higgsfield` 或 `~/.codex/plugins/higgsfield`。这不是安装成功实测，不能直接选其一照搬 Windows 发布。[INSTALL_FOR_AGENTS L40-L54](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/INSTALL_FOR_AGENTS.md#L40-L54)。

缺失处理可见两类：CLI/auth 缺失有 bootstrap；setup 能检查固定 Skill 目录存在。未找到运行时发现“目标 sibling Skill 未安装”的公共策略、依赖 metadata、自动安装 sibling、恢复仍待完成原请求或明确 standalone degradation 的统一规则。Skill 的文字 `use higgsfield-...` 是交接建议，不是依赖解析实现。

触发交叉确实需要人工判定：

- 泛用 generate 的 make video 包含 narrated video 的语言表面，但 NOT for 把 explainer 排除。
- generate 广告/产品流程、photoshoot 的 paid-social/ad creative/brand visuals、cards 的 sales-ready/lifestyle listing 都共享产品广告词；最终要靠“视频 vs 单图/套装、listing 是否存在、品牌系统是否为目标”确定 owner。
- generate 有 music/SFX/3D，websites 把游戏 music/SFX/3D animation 和 spritesheet 归自己，必须看游戏项目上下文。
- brandkit 与 photoshoot 均涉及 brand outputs，brandkit 的 packaging/完整系统、photoshoot 的单项摄影是有用的目标边界。

所有 SKILL 的 allowed-tools 都是 Bash。只有 brandkit、thumbnail 有 agents/openai.yaml，内容仅 interface/display/default prompt；没有依赖声明、router priority 或触发冲突 policy。CI 只检查 trigger/boundary 字串，缺少“同一请求只有一个 owner”和“补充步骤不篡夺主交付”的行为用例。

## 6. 评测与媒体证据边界

evals/README L17 明确没有 automated runner，要求固定 commit、fresh agent sessions、逐场景评分、记录 time-to-result、至少多轮数据后再固化经验。固定 scenarios 实际包含 14 个编号，README 仍写 10；scenarios 有 Soul + Generate chaining、game、explainer、brandkit 等，未找到已完成多轮结果表。[evals README L17-L22、L39-L49](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/evals/README.md#L17-L22)、[scenarios L77-L97](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/evals/scenarios.md#L77-L97)。CONTRIBUTING L56 的“例子要实际运行”属于贡献要求，CI 没有自动实现它。

Higgsfield 并非全体禁止视觉评审。brandkit 明确将视觉语义复查与确定性尺寸/颜色/字体/SVG/PPTX 检查分开，并只修失败资产；thumbnail 要求观察每张结果，无法观察时不得声称通过。[brandkit QA L44-L65、L116-L138](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-brandkit/references/qa-and-iteration.md#L44-L65)、[thumbnail L138-L148](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-youtube-thumbnail/SKILL.md#L138-L148)。

冲突发生在 websites：其 turn-economy 文本禁止下载或 vision-inspect 自己的 generation，并称重看没有新信息，资产 kit coherence 只允许一次 batched check。[websites L192-L209](https://github.com/higgsfield-ai/skills/blob/f83af0bc1d937c8119099a11f8ebbf5e6fb99819/higgsfield-websites/SKILL.md#L192-L209)。这一规则不能进入 CineWeave；提示词是意图，输出是观测，实际图像身份、视频动作因果/连续性、音频时长/同步仍需媒体复查。批量或预算化评审可吸收，取消评审不适用。

## 7. 对 CineWeave 拆分与编排计划的可用结论

这些是从固定源码作出的设计推论，不是 Higgsfield 已经证明的生产效果。

### 建议吸收

1. **按目标交付物与语义 owner 分边界。** 一个独立创作任务由一个叶 Skill 负责收口；细密耦合的步骤留在该 Skill 的 references 和流程中。不能因为已有 schema 数多，就把每个 schema 或每个路由独立成 Skill。
2. **metadata 同时写正触发、排除边界、输入/返回值和交接。** 明确泛词到具体 owner 的消歧，例如故事正文、人物 canon、action sequence、shot/storyboard、平台 prompt projection、非执行生产计划、真实证据 review。每项只有一个权威 owner；编排层只选择、交接、验收，不另创一套 canon。
3. **交接采用持久且带版本的 artifact refs。** 借鉴 Soul ID 和 block pairing 的显式消费，提升为 source ID/type/revision/digest/scope、目标 ID、缺失上游和假设标记；每个例子必须展示生产者输出在消费者输入中确实出现。禁止用 conversation 中的隐含批准状态冒充正式数据。
4. **先声明 barrier，再并行独立分支。** 音频 blocks 全部就绪后才进入对应视频/assembly 的纪律值得借鉴；CineWeave 应把它转为计划检查和证据返回条件。并行要以依赖闭合为前提，不等同于把所有文档同时交给不同 agent。
5. **统一检查器与能力登记入口。** 学习 model/workflow/live-schema 分离：创作 canon 与平台能力、model/mode/schema、已观察生成结果分别记录。只读取带日期与 scope 的资料，不把供应商参数混入创作正文。
6. **源层权威一份，发布包自包含。** 可以在 monorepo 中共用核心 contract/规则，但 build 时物化到每个 standalone bundle。用 generated provenance、hash/byte checks 防止重复副本手写漂移。Higgsfield 允许跨 Skill drift 的做法不适合 CineWeave 的 canon、时间、连续性和证据规则。
7. **局部失效保留精确依赖。** brandkit 的 revision/dependency 代码是实证更强的借鉴点；CineWeave 应复用已有变更影响机制，叶 Skill 只拥有其输出和精确 upstream dependencies，不能删除或重写不受影响成果。
8. **至少三层验收分别记录。** 结构/打包检查，独立上下文行为用例，真实媒体证据。组合案例必须再测 producer-consumer、缺 Skill、旧版本、缺输入、重复触发、修复不漂移、同项目延续与独立场景隔离。

### 不应照搬

- 供应商执行、认证、自动上传、提交付费任务、私有 prompt enhancer、部署/发布 pipeline：超出 CineWeave 非执行型创作边界。
- 固定 provider/model、固定 10 秒或固定分钟数、默认英文 generation prompts：只能作为有 scope 的平台工作流例子，不能变成普遍导演规则。
- 把 Markdown COOKBOOK、shell snippet、README claims 或架构图当跨 Skill orchestration 已执行、媒体质量已验收的证据。
- 取消生成结果复查以省 tool turns；只交 URL 就认定完成媒体验收；隐藏 prompts 作为全局规则。CineWeave 经常交付可复制提示词，需按用户目标展示正文。
- 共享 canonical 规则允许不同副本漂移；凭存在 SKILL.md 判定安装正确；默认最新版 CLI 代表 compatibility 已得到保证。
- roots CLAUDE-only 的核心交接规则：standalone 安装叶 Skill 也必须带足够的输入输出和恢复说明。

### 拆分计划中应明确补齐的机制

推荐以一份 machine-readable skill ownership/dependency catalog 驱动文档、metadata、plugin manifest 和 bundle generation。编排入口提供一个轻量 registry selector，决定此次交付 owner、所需 artifacts、先后 barrier、并行分支、完成条件和待交接内容；它不需要假装是供应商执行 scheduler。必须定义：依赖 Skill 缺失如何继续产出可审阅工作稿、何时标记未核实、如何保持原始请求未完成项、如何在上游补齐后 resume。该缺失策略是 CineWeave 需要新增的设计，不是从 Higgsfield 源码中已经找到的实现。

最小新增自动检查应包含：每个入口描述/排除/返回 contract 合法；目录与 manifest 双向一致；transitive 文件/脚本/schema闭包；源/生成副本版本哈希；叶 Skill canonical owner 唯一；示例跨阶段数据消费闭合；standalone/full-plugin 两种安装矩阵；NOT-for/主次交付触发冲突行为集；不执行供应商工具与不声称未观测媒体通过的证据约束。

没有 source 或运行记录可以证明该固定 Higgsfield 拆分减少了多少 token、改善了多少成功率或生成质量。因此拆分是否改善 CineWeave 必须通过同一任务集的前后 measured comparison 决定，不能把目录变多当成收益本身。
