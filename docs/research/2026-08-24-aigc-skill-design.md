# Open-source AIGC skill design review — 2026-08-24

这次研究的落点不是再堆一套“电影感”提示词，而是把人物、妆容、造型、导演、摄影、运镜、分镜和画面生成放进同一条可复核的生产链：

`创作意图 → 资产状态 → 镜头/时间状态 → 控制通道 → 复核凭证`

## 结论

当前 CineWeave 的契约边界已经比多数开源 AIGC 工具更完整：身份、场景、物理光、导演、提示词、生产和权限各自有明确 owner。最值得补的不是新的大 schema，而是四个跨技能的“桥”：

1. 把妆容、发型、服装、配饰和皮肤质感变成有版本、有区域、有 preserve/replace/exclude 语义的 AppearanceState 交接。
2. 把摄影和运镜写成 `sequence → shot → camera behavior → pose/keyframe → frame`，避免把“推、摇、手持”当成单个形容词。
3. 把分镜写成 coverage ledger、独立 panel task 和确定性组装，支持只重做失败格。
4. 把 ComfyUI 图、ControlNet、IP-Adapter/ID、SAM2、AnimateDiff、StoryDiffusion、服装/妆容迁移工具视为 adapter capability，而不是创作事实。

## 对技能设计的直接改进

- 统一使用 Control Card：每条要求都记录 source、scope、target、enforcement、priority、preserve、allowed deviation、adapter requirement 和 review dimension。
- 任何多条件适配都要拆开声明：face identity ≠ full-body identity；garment transfer ≠ costume design；mask propagation ≠ continuity proof；motion module ≠ action direction。
- 任何 repair 只改一个 owner 的一个变量，并保留已经通过的维度。
- 所有“看起来已经生成”的内容都要和 execution receipt 区分；workflow JSON、prompt、board design 都只是设计资产。

## 研究源与落地文件

完整的来源、判断边界和维护策略见 [report-source.md](report-source.md)。本次新增/补强的 Director 参考文件：

- [aigc-control-stack.md](../../skills/cineweave-director/references/aigc-control-stack.md)
- [appearance-styling-direction.md](../../skills/cineweave-director/references/appearance-styling-direction.md)
- [camera-previsualization.md](../../skills/cineweave-director/references/camera-previsualization.md)
- [storyboard-coverage.md](../../skills/cineweave-director/references/storyboard-coverage.md)
- [opensource-adapter-patterns.md](../../skills/cineweave-director/references/opensource-adapter-patterns.md)
