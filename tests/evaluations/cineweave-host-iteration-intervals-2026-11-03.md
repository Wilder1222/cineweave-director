# 真实宿主问题链：冻结快照变更区间去重（2026-11-03）

本记录按 `tests/evaluations` 目录归档，以下证据链接均为相对于该目录的路径。17 条问题链的完整前稿、独立发现、同题输入与哈希见[真实宿主问题级迭代审计](cineweave-host-iteration-audit-2026-11-03.md)。下列哈希为 SHA-256 前 12 位，完整哈希见各次宿主归档清单。

按作者源前后哈希与 692 项冻结快照聚合，17 条问题链对应 **13 组可区分的冻结快照变更区间**。该数量不证明恰好进行了 13 次独立写入：一个区间可能跨越多个文件和多次编辑。也不能据此宣称 13 轮全项目严格串行。

## 区间与复测

1. **链 1｜R02 画外视线与伞尖继承**：入口 `b1c68b8861d4` → `640cc66124e9`。[复测](model-adaptation-host-r02-final-output-2026-11-02.md) / [评语](model-adaptation-host-r02-final-review-2026-11-02.md)。特定文字衔接通过；媒体未验。
2. **链 2｜R06 音频能力入口归属**：模型实践页 `9374e649b8f8` → `8496b8b326c5`。[复测](model-adaptation-host-r06-retest-output-2026-11-03.md) / [评语](model-adaptation-host-r06-retest-review-2026-11-03.md)。模式范围交接通过；账号和音轨待验。
3. **链 3｜R09 模型限制缺模式范围**：平台适配页 `d2c255bde02e` → `82c73042c3b0`。[复测](model-adaptation-host-r09-retest-output-2026-11-03.md) / [评语](model-adaptation-host-r09-retest-review-2026-11-03.md)。模式范围已补；素材分配当时仍不足。
4. **链 4｜R09 逐段素材分配**：平台适配页 `82c73042c3b0` → `1b3fd69e18fe`。[复测](model-adaptation-host-r09-final-output-2026-11-03.md) / [评语](model-adaptation-host-r09-final-review-2026-11-03.md)。素材分配条件通过；实际使用和上传权限随素材待核。
5. **链 6｜Seedance 首帧持布条件**：入口 `640cc66124e9` → `729c89428f5d`。[复测](cineweave-host-seedance-modes-retest-output-2026-11-03.md) / [评语](cineweave-host-seedance-modes-retest-review-2026-11-03.md)。持布补齐；接触与编辑时长当时仍有缺口。
6. **链 5、7、8、11｜Face 自包含；Seedance 接触与编辑时长；Kling 输入规格**：入口 `729c89428f5d` → `c214e1a54205`；模型实践页 `13394a733b61` → `ef18ee5cc1b0`。[Face 复测](cineweave-host-face-final-output-2026-11-03.md) / [Face 评语](cineweave-host-face-final-review-2026-11-03.md) / [Seedance 复测](cineweave-host-seedance-modes-final-output-2026-11-03.md) / [Seedance 评语](cineweave-host-seedance-modes-final-review-2026-11-03.md) / [Kling 规格复测](cineweave-host-edit-firstframe-spec-output-2026-11-03.md) / [Kling 规格评语](cineweave-host-edit-firstframe-spec-review-2026-11-03.md)。四条链共用同一对 692 项快照；Seedance 当时仍有空间初态缺口。
7. **链 9｜Seedance 人物、灯与视线初态**：入口 `c214e1a54205` → `93c15740698f`。[复测](cineweave-host-seedance-modes-r3-output-2026-11-03.md) / [评语](cineweave-host-seedance-modes-r3-review-2026-11-03.md)。空间和视线补齐；光色条件仍待补。
8. **链 10、12｜Seedance 光色；Wan 实际首帧绑定**：入口 `93c15740698f` → `cf3d581fbd39`。[Seedance 复测](cineweave-host-seedance-modes-r4-output-2026-11-03.md) / [Seedance 评语](cineweave-host-seedance-modes-r4-review-2026-11-03.md) / [Wan 复测](cineweave-host-edit-firstframe-light-output-2026-11-03.md) / [Wan 评语](cineweave-host-edit-firstframe-light-review-2026-11-03.md)。两条链共用同一对 692 项快照；Wan 当时仍误断距离冲突。
9. **链 13｜Wan 身侧与靠近的距离误断**：入口 `cf3d581fbd39` → `d572b8b5d835`。[复测](cineweave-host-edit-firstframe-retest2-output-2026-11-03.md) / [评语](cineweave-host-edit-firstframe-retest2-review-2026-11-03.md)。按实图条件分支；完整旧稿与真实素材未提供。
10. **链 14｜R07 上传整板与理解格序**：入口 `d572b8b5d835` → `fda107a3fbbd`。[复测](cineweave-host-r07-final-output-2026-11-03.md) / [评语](cineweave-host-r07-final-review-2026-11-03.md)。区分上传与理解；逐阶段清单当时仍待补。
11. **链 15｜R07 逐格逐阶段试片验收**：入口 `fda107a3fbbd` → `99a4858b7712`。[复测](cineweave-host-r07-r2-output-2026-11-03.md) / [评语](cineweave-host-r07-r2-review-2026-11-03.md)。逐阶段清单补齐；制板工具不支持画幅时的制作路径仍缺。
12. **链 16｜R07 制板工具不支持 16:3**：入口 `99a4858b7712` → `e8db6ce7d4c7`。[复测](cineweave-host-r07-r3-output-2026-11-03.md) / [评语](cineweave-host-r07-r3-review-2026-11-03.md)。提出分格生成和装配，但各格正文当时仍不自包含。
13. **链 17｜R07 分格静态稿自包含**：入口 `e8db6ce7d4c7` → `91a9b6e417d5`。[复测](cineweave-host-r07-r4-output-2026-11-03.md) / [评语](cineweave-host-r07-r4-review-2026-11-03.md)。三格独立稿通过文字检查；实际跨图一致性与 Wan 格序理解未验。

## 共享快照与可证顺序

- 第 6 组的 Face、Seedance 与 Kling 规格复测使用同一对前后 692 项冻结快照：入口及模型实践页同时发生差异；不能将四项问题自动算成四次独立串行源码修订。
- 第 8 组的 Seedance 光色与 Wan 首帧绑定使用另一对相同的前后 692 项快照；两个问题共享该观察区间。
- R06 与 R09 的初始 692 项快照一致；R06 复测相对初始变化的是模型实践页及其派生，R09 复测相对 R06 复测另外变化平台适配页及其派生，故保留两个可观察区间。宿主运行时间曾重叠，不应将其推断为无并发的完整工作时间线。
- R07 四项属于同一原题连续发现的不同交接问题；16:3、分格制作等是主动提出的方案及其扩展验收，并非用户原题硬锁。Seedance 的具体人物位置和光色是所选条件稿的初态核对，不是所有任务的固定要求。
- 表中只认定对应问题在后测文字中的处理；各次快照有其他未决项时已在行末标出。用户账号、授权、素材、真实生成视频／音频及艺术验收都没有由这些宿主文本证明。

## 判定

去重后存在不少于 10 组可区分的真实宿主文字复测相关源码变更区间；它们不等于已证明 13 轮严格顺序、每轮全项目统一冻结并完成所有受影响回归。共享快照、并行运行和缺少完整逐轮不可变补丁，均限制对严格串行轮数的推断。
