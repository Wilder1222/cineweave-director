# 三模型适配：问题级迭代证据时间梳理（2026-11-03）

## 口径

以下是依据既有记录重建的**问题级闭环**：独立审阅发现具体问题 → 日志记录修改作者源 → 同题再生成 → 独立评审确认该具体问题的文字结果。它们至少构成 16 条可辨识的不同问题链，但同一原题可能经历多次不同缺陷修订，多个代理任务也可能并行；**不能据此声称已经证明 16 轮严格串行的真实宿主迭代，更不能把十个案例直接计为十轮。** 日期和同题先后由证据支持；同日互不依赖的条目排列是阅读顺序，不声称墙钟先后。

早期案例为独立代理读取文件后的文字试跑，不是 Codex 宿主自动加载证据；后期标注真实宿主的案例有脱敏事件、终态与冻结哈希，但部分宿主读取过全局记忆。下列源码链接指向当前作者源，历史修改与依赖关系主要由 [总记录](model-adaptation-review-2026-10-31.md) 和各复测哈希支持；不能将当前文件字节回填为所有历史版本。每条结论均限文字；不存在真实供应商任务或音视频验收。

## 闭环（按日期与证据依赖排序）

1. **2026-10-31｜分镜板备选无独立运动稿**（独立代理文字）。[发现的独立评审](model-adaptation-retest-path-review-2026-10-31.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md) → [同题复测](model-adaptation-retest-board-2026-10-31.md)／[复测独立评审](model-adaptation-retest-board-review-2026-10-31.md)。整板与首帧备选可复制；真实整板解析未验。
2. **2026-10-31｜方舟编辑时长、真人输入及 Wan 配音声轨**（独立代理文字）。[发现的独立评审](model-adaptation-boundary-review-2026-10-31.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-boundary-final-2026-10-31.md)／[复测独立评审](model-adaptation-boundary-final-review-2026-10-31.md)。两次修订后核对时长、真人输入与默认音轨；后续渠道链接调整，真实账号未验。
3. **2026-11-02｜Wan 中国站临时文件误推广及视频接口假定可提取文字**（独立代理文字）。[发现的独立评审](model-adaptation-wan-file-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-wan-file-retest-2026-11-02.md)／[复测独立评审](model-adaptation-wan-file-retest-review-2026-11-02.md)。地区范围和提取边界改善；同次复测暴露下条编辑模式新问题，不能判整题通过。
4. **2026-11-02｜Wan 把文件参考加视频误当作原视频编辑能力**（独立代理文字）。[发现的独立评审](model-adaptation-wan-file-retest-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-wan-file-final-2026-11-02.md)／[复测独立评审](model-adaptation-wan-file-final-review-2026-11-02.md)。不再断言未证实的编辑模式；复测另发现下条缺少分次方案。
5. **2026-11-02｜Seedance 声音方案缺认证与任务查询**（独立代理文字）。[发现的独立评审](model-adaptation-seedance-audio-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-seedance-audio-retest-2026-11-02.md)／[复测独立评审](model-adaptation-seedance-audio-retest-review-2026-11-02.md)。认证与异步查询通过；同次复测另发现下条精确时长问题。
6. **2026-11-02｜两个恰好六秒镜头调整剪点可能悄然短于六秒**（独立代理文字）。[发现的独立评审](model-adaptation-seedance-audio-retest-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-timing-and-handles.md) → [同题复测](model-adaptation-seedance-timing-retest-2026-11-02.md)／[复测独立评审](model-adaptation-seedance-timing-review-2026-11-02.md)。各完整采用六秒、无余量先重做或选择变更；实际帧和接点待验。
7. **2026-11-02｜Wan 原题未锁单次却遗漏分次首帧＋文件条件路径**（独立代理文字）。[发现的独立评审](model-adaptation-wan-file-final-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-wan-splice-retest-2026-11-02.md)／[复测独立评审](model-adaptation-wan-splice-review-2026-11-02.md)。条件分次及损失通过，另发现未知文案阅读窗口问题。
8. **2026-11-02｜未知广告文案不能预断两秒足够阅读**（独立代理文字）。[发现的独立评审](model-adaptation-wan-splice-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/routes/storyboard-rhythm.md) → [同题复测](model-adaptation-wan-readability-retest-2026-11-02.md)／[复测独立评审](model-adaptation-wan-readability-review-2026-11-02.md)。试排试读与固定总长取舍通过；实际文案、设备、可读性待验。
9. **2026-11-02｜Kling 关键帧备选残留无效引用且把未知素材当不存在**（独立代理文字）。[发现的独立评审](model-adaptation-kling-keyframe-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md) → [同题复测](model-adaptation-kling-keyframe-retest-2026-11-02.md)／[复测独立评审](model-adaptation-kling-keyframe-retest-review-2026-11-02.md)。备选各自完整且输入状态待核；官方组合冲突、账号和媒体待验。
10. **2026-11-02｜Kling 声线档案可用不等于可绑定画外旁白**（独立代理文字）。[发现的独立评审](model-adaptation-kling-audio-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-kling-audio-retest-2026-11-02.md)／[复测独立评审](model-adaptation-kling-audio-retest-review-2026-11-02.md)。旁白绑定改成入口待核；同次复测另暴露下条回退稿不完整。
11. **2026-11-02｜Kling 声线不可用时没有产品图专用完整回退正文**（独立代理文字）。[发现的独立评审](model-adaptation-kling-audio-retest-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-kling-audio-final-retest-2026-11-02.md)／[复测独立评审](model-adaptation-kling-audio-final-review-2026-11-02.md)。产品画面稿、准确旁白与音乐后期交接通过；真实素材和音色待验。
12. **2026-11-02｜真实宿主 R07 将上传图片与解析整板格序混同**（真实宿主＋独立评审）。[发现的独立评审](model-adaptation-host-r07-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md) → [同题复测](model-adaptation-host-r07-final-output-2026-11-02.md)／[复测独立评审](model-adaptation-host-r07-final-review-2026-11-02.md)。整板解析标待核且有首帧备选；超宽分格装配和媒体待验。
13. **2026-11-02｜真实宿主 R02 特写遗漏画外视线与伞尖继承**（真实宿主＋独立评审）。[发现的独立评审](model-adaptation-host-r02-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/SKILL.md) → [同题复测](model-adaptation-host-r02-final-output-2026-11-02.md)／[复测独立评审](model-adaptation-host-r02-final-review-2026-11-02.md)。首次修订后复测仍失败，再提入口后同题通过；实际视觉衔接待验。
14. **2026-11-02/03｜真实宿主 R06 未在交接中限定音频能力所属入口**（真实宿主＋独立评审）。[发现的独立评审](model-adaptation-host-r06-review-2026-11-02.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md) → [同题复测](model-adaptation-host-r06-retest-output-2026-11-03.md)／[复测独立评审](model-adaptation-host-r06-retest-review-2026-11-03.md)。官方工作区与 Omni 范围明确；后续代码有漂移，真实声音待验。
15. **2026-11-03｜真实宿主 R09 泛化模式限制及缺具体素材分段交接**（真实宿主＋独立评审）。[发现的独立评审](model-adaptation-host-r09-review-2026-11-03.md) → [修订的作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md) → [同题复测](model-adaptation-host-r09-final-output-2026-11-03.md)／[复测独立评审](model-adaptation-host-r09-final-review-2026-11-03.md)。首复测仍缺各段分配，第二次补齐；素材使用／上传权限待核。
16. **2026-11-03｜真实宿主 face 将未提供参考作为独立视频正文依赖**（真实宿主＋独立评审）。[发现的独立评审](cineweave-host-fullchain-review-2026-11-03.md) → [修订的作者源](../../skills/cineweave-director/SKILL.md) → [同题复测](cineweave-host-face-final-output-2026-11-03.md)／[复测独立评审](cineweave-host-face-final-review-2026-11-03.md)。首复测仍缺具体人物／服装；第二次补齐并保持表演，暂存证据待归档。

## 不应并入已证明闭环的事项

- **Seedance 严格首帧与参考／编辑专项仍未闭合。** 首测发现缺少持布初态；同题复测补了持布，但首图条件只写可触及，正文要求已经接触；编辑时长表格亦存在绝对表述。见 [首次评审](cineweave-host-seedance-modes-review-2026-11-03.md)、[复测评审](cineweave-host-seedance-modes-retest-review-2026-11-03.md)。需要按新快照再次同题复测并独立审阅，另回归 Wan 空手起点，避免把持物误当通用首帧要求。
- **Kling 编辑／仅运镜及 Wan 空手首帧受影响回归**已证明定向文字分路，但独立评审指出 Omni 视频输入规格交接未充分列示；当前源码已修改，不应据旧输出推断新快照行为，见 [回归评语](cineweave-host-edit-firstframe-regression-review-2026-11-03.md)。
- **R01 回归**的铰链与声音主要文字验收通过，但视线句序存在轻微歧义；**R09** 的素材授权需结合未来实际来源核对。**face** 的最终复测与独立评审目前仍位于 D:/Temp，应以实际归档及快照清单为准。
- 工程测试、派生一致性、构建和 9/9 打包冒烟只能证明其所测代码快照；后续源或清单变化需要重新执行。账户、素材授权、模型控制、实际视频／音频和用户艺术接受均没有被上述文字复测证明。

## 对“十轮”的判断

已找到不少于 10 条有不同问题的“发现—修订—同题复测—独立文字评审”证据链，足以说明发生了多次实质改进；但其历史记录包含并行、同题多问题分解、代理与宿主混合，且早期修改的每个中间版本没有完整不可变补丁，**不能诚实计算出已完成多少轮严格串行、每轮独立宿主验证的十轮**。若验收要求必须是严格串行十轮，现有证据不足以证明达标；应从现行冻结快照逐轮记录原题、独立发现、修订 diff 和哈希、同题宿主终态与独立评语，并回归受影响正反例，直至可确证十个连续闭环。未以欠缺严格轮数为由推断必须重复已完成的同一问题。
