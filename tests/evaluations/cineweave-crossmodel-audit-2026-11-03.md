# 三模型官方资料与分镜交接独立审阅

日期：2026-11-03（北京时间）。只读审阅；未提交生成任务、上传素材或观察成片。审阅对象为导演入口与其 `video-model-practices-2026-10.md`、`video-platform-adaptation.md`。审阅时 SHA-256 依次为 `640cc66124e9002df686334bcbad220ad626724ae669f632a3e32f5474566e1b`、`8496b8b326c542af2a6cbac57440353912061480207f391a70fc858525a3b233`、`1b3fd69e18fed97941903f3bde0c433f561a150cbcfac6d108a79c877f1cfc17`；行号对应此快照。官方说明会变化，界面账号与实际任务均未核验。

## 需要修订

1. **Wan 严格首帧的初态检查不完整，可能与复制稿冲突。** `video-model-practices-2026-10.md:103–106` 将“右手可擦到雾玻璃、右手及脸侧可读”作为首图条件，但正文写明从首帧开始右手已靠近玻璃。反例：首帧右手位于身体旁边、位于画内且伸手可及玻璃；它满足现有检查，却不满足正文的首帧手位。百炼 API 明确 `first_frame` 严格作为第一帧（[API 参考](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)、[生成指南](https://help.aliyun.com/zh/model-studio/wan3-video-generation-guide)）。建议在确要保持现有正文时检查手已靠近玻璃，或根据实图重写初态并安排从现有手位伸手，未观察时保持待核。正例：右手已靠近玻璃且可见；反例：手在身体旁且可见、可到达玻璃。不可声明已看到不存在的素材。

2. **方舟 Seedance 2.5 API 严格首帧与多模态参考的互斥未落入本模型指南。** `video-model-practices-2026-10.md:13–14` 分列首帧和图／视频／音频参考，却仅在 Wan 栏明确互斥；通用页 `video-platform-adaptation.md:38` 只要求核对组合。方舟[创建视频任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh)明确首帧、首尾帧、全模态参考是互斥场景。反例：要求一次请求同时严格锁定 `first_frame` 及 `reference_video` 运镜／`reference_audio` 声音；不能只按各自上限给出组合。建议在方舟范围写明冲突，给保留首帧而失去原生额外参考或保留参考而失去严格首帧等条件备选及损失，不假称授权或上传；不能推广到全部第三方入口。正例：严格首帧独立使用；反例：同请求混传严格首帧和参考视频。

3. **带参考视频的方舟任务未说明自动路由与时长约束的风险。** `video-model-practices-2026-10.md:15,44–47` 的多参考条件稿以运镜视频参考并设计 12 秒，但作者源未介绍 `omni_reference_task_type`。方舟[模型教程](https://docs.volcengine.com/docs/ark/seedance-2-5?lang=zh)及[创建任务 API](https://docs.volcengine.com/docs/ark/create-video-generation-task-api?lang=zh)说明默认 `auto` 依据提示与素材判断参考、编辑、延长；编辑需 `ratio=adaptive`、`duration=-1`；显式 `reference` 等值可前置校验，但实际意图不一致仍可能异步 `InvalidParameter.TaskTypeMismatch`。风险复现条件：参考视频加固定 12 秒、自动路由却被实际判为编辑；此时参数与编辑约束不符。这里不是断言条件稿必然被误分类。建议 API 交接明确本次是按参考生成新片的意图；在方舟接口支持时说明 `reference` 可用于提前校验，并保留意图重判／异步失败风险与真实任务查询；不得把该字段推广到其他平台或当成功保证。正例：参考生成意图 + 条件性 `reference`；反例：将编辑意图与 `reference` 强绑或称设置该字段后必然成功。

4. **Kling 4.0 原片编辑与视频参考生成缺少必要的模式写法区分。** `video-model-practices-2026-10.md:15,58,79–82` 提到编辑能力，并提供 `@Video1` 仅参考运镜的新生成稿，但没有针对原视频局部编辑提供官方工作区的明确编辑用法。[Kling 4.0 用户指南](https://kling.ai/quickstart/kling-4-model-user-guide) 的 Omni Reference 视频编辑章节要求明确编辑对应视频、写出改动和保留范围，并警告单写参考视频可能走参考生成。反例：用户要求仅删原片杯子，交接只写“参考 @Video1，画面不要杯子”，不能可靠表达原片编辑。建议仅在该工作区写清实际绑定后以 `Edit @Video1` 表达编辑意图、逐项写要改与保留；不要把“其他保持不变”写成画面已被证明无损。正例为原片已提供且编辑意图明确；负例为把生成参考、未上传素材或未授权修改冒充已完成编辑。

## 已核对且边界仍适当

- 方舟 `doubao-seedance-2-5-260628` 可在[官方模型列表](https://docs.volcengine.com/docs/ark/model-list?lang=en)搜索索引中找到；模型教程与提示词指南的检索正文支持首帧角色、视频编辑时长限制、关键帧顺序写法。搜索索引不是账号实测；部分火山直开页面仅有壳或超时。
- [Kling 用户指南](https://kling.ai/quickstart/kling-4-model-user-guide)本次可直接打开。其列 Omni Reference 与独立 Keyframes 为不同入口且称不可合并，但同页首帧示例又含视频参考，且[官方关键帧文章](https://kling.ai/blog/kling-4-multiple-keyframes-guide)称关键帧可与 Omni 参考协同。现有 `video-model-practices-2026-10.md:56–57` 同时保留入口限制与同任务能力待核，不能把这处文档矛盾裁成确定可行或不可行。
- [Wan 百炼 API](https://help.aliyun.com/zh/model-studio/wan3-video-generation-api-reference)支持独立编号的图／视频／音频参考、首尾帧与参考互斥、file/link 互斥、文件／网页时 `prompt_extend=true`；项目 `video-model-practices-2026-10.md:85–95` 的对应范围和不确定性表述基本一致。API 指定有视频输入的总时长限制；延长示例与总时长文字含义有待接口实测，现有文档已保留该歧义。
- 三模型示例明确不把文字稿等同真实生成或艺术验收；按源文件阅读，未发现有证据可对成片、声音、账号可用性下通过结论。本审阅是文字和官方依据，不代替真实宿主原题回归或独立成片审片。
