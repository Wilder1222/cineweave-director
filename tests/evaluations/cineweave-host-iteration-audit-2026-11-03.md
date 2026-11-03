# 真实宿主问题级迭代核对（2026-11-03）

## 统计口径

只列满足以下证据链的具体问题：真实宿主前稿与独立评语 → 总记录记载作者源修订 → 完整相同输入的真实宿主复测 → 独立评语确认该具体问题改善。逐条重算归档输入 SHA-256 相等，并比对所列作者源在两次宿主哈希清单中的变化；每次终态均有 exit 0、完成事件或完成标志。所有评语、输出、原题、哈希和终态均已保存在工作区，以下链接指向实际文件。

**可证实 17 条不同问题的文字级宿主问题链，超过 10 条；但不能把它们等同 17 轮严格串行的全项目审阅迭代。** 多条属于同一题或同一轮共享源码修订，R06 与 R09、face 与 Seedance／联合回归存在时间重叠；某条具体问题解决不意味着同一输出其他问题亦解决。部分用户原题没有要求极宽画布，相关独立分格是项目主动选择后的扩展交接验收。

记录中的源码哈希为对应两次**各自冻结技能快照**的作者源 SHA-256 前 12 位；不等同所有源码没有变化，也不保证中间历史版本有逐轮独立 Git 补丁。变更的具体内容由总记录与评审共同佐证。总记录：[三模型适配研究与审阅](model-adaptation-review-2026-10-31.md)。宿主读取过全局记忆的情况由各终态与评语保留；所有结论都只涉及可观察文字行为，并非供应商账号、媒体质量或用户验收。

## 闭环（按证据依赖排序，非宣称全局串行）

1. **R02 画外视线与伞尖继承**。[前稿](model-adaptation-host-r02-retest-output-2026-11-02.md)／[独立发现](model-adaptation-host-r02-retest-review-2026-11-02.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `b1c68b8861d4` → `640cc66124e9`；[修订记录](model-adaptation-review-2026-10-31.md) 第 129 行附近）→ [同题宿主复测](model-adaptation-host-r02-final-output-2026-11-02.md)／[独立评语](model-adaptation-host-r02-final-review-2026-11-02.md)。
   原题两次 SHA-256 `a8e31b290d9803ec…`；后测 [输入](model-adaptation-host-r02-final-input-2026-11-02.txt)、[冻结哈希](model-adaptation-host-r02-final-hashes-2026-11-02.json)、[终态](model-adaptation-host-r02-final-terminal-2026-11-02.json)、[快照比较](model-adaptation-host-r02-final-comparison-2026-11-02.json)。首次修订后仍漏 S02 视线与 S02/S03 伞尖；后测明确画外继承，实际媒体待验。

2. **R06 声音能力的官方入口归属**。[前稿](model-adaptation-host-r06-output-2026-11-02.md)／[独立发现](model-adaptation-host-r06-review-2026-11-02.md) → [作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md)（SHA-256 `9374e649b8f8` → `8496b8b326c5`；[修订记录](model-adaptation-review-2026-10-31.md) 第 129 行附近）→ [同题宿主复测](model-adaptation-host-r06-retest-output-2026-11-03.md)／[独立评语](model-adaptation-host-r06-retest-review-2026-11-03.md)。
   原题两次 SHA-256 `a8b7e7411e8ad251…`；后测 [输入](model-adaptation-host-r06-retest-input-2026-11-03.txt)、[冻结哈希](model-adaptation-host-r06-retest-hashes-2026-11-03.json)、[终态](model-adaptation-host-r06-retest-terminal-2026-11-03.json)、[快照比较](model-adaptation-host-r06-retest-comparison-2026-11-03.json)。后测逐项标明官方工作区及 Omni；账号和实际音轨未知。

3. **R09 官方时长与参考上限缺模式限定**。[前稿](model-adaptation-host-r09-output-2026-11-03.md)／[独立发现](model-adaptation-host-r09-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md)（SHA-256 `d2c255bde02e` → `82c73042c3b0`；[修订记录](model-adaptation-review-2026-10-31.md) 第 135 行附近）→ [同题宿主复测](model-adaptation-host-r09-retest-output-2026-11-03.md)／[独立评语](model-adaptation-host-r09-retest-review-2026-11-03.md)。
   原题两次 SHA-256 `181116efff514a41…`；后测 [输入](model-adaptation-host-r09-retest-input-2026-11-03.txt)、[冻结哈希](model-adaptation-host-r09-retest-hashes-2026-11-03.json)、[终态](model-adaptation-host-r09-retest-terminal-2026-11-03.json)、[快照比较](model-adaptation-host-r09-retest-comparison-2026-11-03.json)。后测限定工作区与模式；分段素材分配仍不足，见下一条。

4. **R09 分段缺逐段参考分配与素材准备**。[前稿](model-adaptation-host-r09-retest-output-2026-11-03.md)／[独立发现](model-adaptation-host-r09-retest-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/references/optional/video-platform-adaptation.md)（SHA-256 `82c73042c3b0` → `1b3fd69e18fe`；[修订记录](model-adaptation-review-2026-10-31.md) 第 137 行附近）→ [同题宿主复测](model-adaptation-host-r09-final-output-2026-11-03.md)／[独立评语](model-adaptation-host-r09-final-review-2026-11-03.md)。
   原题两次 SHA-256 `181116efff514a41…`；后测 [输入](model-adaptation-host-r09-final-input-2026-11-03.txt)、[冻结哈希](model-adaptation-host-r09-final-hashes-2026-11-03.json)、[终态](model-adaptation-host-r09-final-terminal-2026-11-03.json)、[快照比较](model-adaptation-host-r09-final-comparison-2026-11-03.json)。后测两段 10+10、4 张重复、16 张覆盖；权限随实际素材待核。

5. **Face 无参考稿缺独立人物与服装**。[前稿](cineweave-host-face-retest-output-2026-11-03.md)／[独立发现](cineweave-host-face-retest-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `729c89428f5d` → `c214e1a54205`；[修订记录](model-adaptation-review-2026-10-31.md) 第 153 行附近）→ [同题宿主复测](cineweave-host-face-final-output-2026-11-03.md)／[独立评语](cineweave-host-face-final-review-2026-11-03.md)。
   原题两次 SHA-256 `45f90aa6d205347d…`；后测 [输入](cineweave-host-face-final-input-2026-11-03.txt)、[冻结哈希](cineweave-host-face-final-hashes-2026-11-03.json)、[终态](cineweave-host-face-final-terminal-2026-11-03.json)、[快照比较](cineweave-host-face-final-comparison-2026-11-03.json)。首轮入口修订后仍缺，第二次同题正文补可撤销人物服装和空间；音画未验。

6. **Seedance 严格首帧缺右手持布初态**。[前稿](cineweave-host-seedance-modes-output-2026-11-03.md)／[独立发现](cineweave-host-seedance-modes-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `640cc66124e9` → `729c89428f5d`；[修订记录](model-adaptation-review-2026-10-31.md) 第 151 行附近）→ [同题宿主复测](cineweave-host-seedance-modes-retest-output-2026-11-03.md)／[独立评语](cineweave-host-seedance-modes-retest-review-2026-11-03.md)。
   原题两次 SHA-256 `32e0db2eef7dcf2c…`；后测 [输入](cineweave-host-seedance-modes-retest-input-2026-11-03.txt)、[冻结哈希](cineweave-host-seedance-modes-retest-hashes-2026-11-03.json)、[终态](cineweave-host-seedance-modes-retest-terminal-2026-11-03.json)、[快照比较](cineweave-host-seedance-modes-retest-comparison-2026-11-03.json)。后测增加右手持布，但布是否接触玻璃仍未闭合，见下一条。

7. **Seedance 持布可及不等于首帧已接触玻璃**。[前稿](cineweave-host-seedance-modes-retest-output-2026-11-03.md)／[独立发现](cineweave-host-seedance-modes-retest-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `729c89428f5d` → `c214e1a54205`；[修订记录](model-adaptation-review-2026-10-31.md) 第 153 行附近）→ [同题宿主复测](cineweave-host-seedance-modes-final-output-2026-11-03.md)／[独立评语](cineweave-host-seedance-modes-final-review-2026-11-03.md)。
   原题两次 SHA-256 `32e0db2eef7dcf2c…`；后测 [输入](cineweave-host-seedance-modes-final-input-2026-11-03.txt)、[冻结哈希](cineweave-host-seedance-modes-final-hashes-2026-11-03.json)、[终态](cineweave-host-seedance-modes-final-terminal-2026-11-03.json)、[快照比较](cineweave-host-seedance-modes-final-comparison-2026-11-03.json)。后测条件补已接触；其他人物/灯构图与视线仍未闭合。

8. **Seedance 编辑输出时长表格与正文矛盾**。[前稿](cineweave-host-seedance-modes-retest-output-2026-11-03.md)／[独立发现](cineweave-host-seedance-modes-retest-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md)（SHA-256 `13394a733b61` → `ef18ee5cc1b0`；[修订记录](model-adaptation-review-2026-10-31.md) 第 153 行附近）→ [同题宿主复测](cineweave-host-seedance-modes-final-output-2026-11-03.md)／[独立评语](cineweave-host-seedance-modes-final-review-2026-11-03.md)。
   原题两次 SHA-256 `32e0db2eef7dcf2c…`；后测 [输入](cineweave-host-seedance-modes-final-input-2026-11-03.txt)、[冻结哈希](cineweave-host-seedance-modes-final-hashes-2026-11-03.json)、[终态](cineweave-host-seedance-modes-final-terminal-2026-11-03.json)、[快照比较](cineweave-host-seedance-modes-final-comparison-2026-11-03.json)。同一后测表格改为基本对齐并可能略短；与上一条共享修订周期。

9. **Seedance 严格首帧漏核人物/灯空间及初始视线**。[前稿](cineweave-host-seedance-modes-final-output-2026-11-03.md)／[独立发现](cineweave-host-seedance-modes-final-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `c214e1a54205` → `93c15740698f`；[修订记录](model-adaptation-review-2026-10-31.md) 第 159 行附近）→ [同题宿主复测](cineweave-host-seedance-modes-r3-output-2026-11-03.md)／[独立评语](cineweave-host-seedance-modes-r3-review-2026-11-03.md)。
   原题两次 SHA-256 `32e0db2eef7dcf2c…`；后测 [输入](cineweave-host-seedance-modes-r3-input-2026-11-03.txt)、[冻结哈希](cineweave-host-seedance-modes-r3-hashes-2026-11-03.json)、[终态](cineweave-host-seedance-modes-r3-terminal-2026-11-03.json)、[快照比较](cineweave-host-seedance-modes-r3-comparison-2026-11-03.json)。后测空间与视线条件补齐，但又发现室内外光色未核。

10. **Seedance 严格首帧漏核正文初始光色**。[前稿](cineweave-host-seedance-modes-r3-output-2026-11-03.md)／[独立发现](cineweave-host-seedance-modes-r3-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `93c15740698f` → `cf3d581fbd39`；[修订记录](model-adaptation-review-2026-10-31.md) 第 163 行附近）→ [同题宿主复测](cineweave-host-seedance-modes-r4-output-2026-11-03.md)／[独立评语](cineweave-host-seedance-modes-r4-review-2026-11-03.md)。
   原题两次 SHA-256 `32e0db2eef7dcf2c…`；后测 [输入](cineweave-host-seedance-modes-r4-input-2026-11-03.txt)、[冻结哈希](cineweave-host-seedance-modes-r4-hashes-2026-11-03.json)、[终态](cineweave-host-seedance-modes-r4-terminal-2026-11-03.json)、[快照比较](cineweave-host-seedance-modes-r4-comparison-2026-11-03.json)。后测待核条件与正文光色一致，三模式文字专项通过；后续入口变化不等于重测。

11. **Kling 原片编辑与参考生成漏列已知视频输入规格**。[前稿](cineweave-host-edit-firstframe-regression-output-2026-11-03.md)／[独立发现](cineweave-host-edit-firstframe-regression-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/references/optional/video-model-practices-2026-10.md)（SHA-256 `13394a733b61` → `ef18ee5cc1b0`；[修订记录](model-adaptation-review-2026-10-31.md) 第 155 行附近）→ [同题宿主复测](cineweave-host-edit-firstframe-spec-output-2026-11-03.md)／[独立评语](cineweave-host-edit-firstframe-spec-review-2026-11-03.md)。
   原题两次 SHA-256 `8f3d601a958af266…`；后测 [输入](cineweave-host-edit-firstframe-spec-input-2026-11-03.txt)、[冻结哈希](cineweave-host-edit-firstframe-spec-hashes-2026-11-03.json)、[终态](cineweave-host-edit-firstframe-spec-terminal-2026-11-03.json)、[快照比较](cineweave-host-edit-firstframe-spec-comparison-2026-11-03.json)。后测列单段时长、大小、比例及共享额度；真实账户文件待核。

12. **Wan 首帧交接未明确实际图片绑定**。[前稿](cineweave-host-edit-firstframe-global-output-2026-11-03.md)／[独立发现](cineweave-host-edit-firstframe-global-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `93c15740698f` → `cf3d581fbd39`；[修订记录](model-adaptation-review-2026-10-31.md) 第 163 行附近）→ [同题宿主复测](cineweave-host-edit-firstframe-light-output-2026-11-03.md)／[独立评语](cineweave-host-edit-firstframe-light-review-2026-11-03.md)。
   原题两次 SHA-256 `8f3d601a958af266…`；后测 [输入](cineweave-host-edit-firstframe-light-input-2026-11-03.txt)、[冻结哈希](cineweave-host-edit-firstframe-light-hashes-2026-11-03.json)、[终态](cineweave-host-edit-firstframe-light-terminal-2026-11-03.json)、[快照比较](cineweave-host-edit-firstframe-light-comparison-2026-11-03.json)。后测明确目标入口首帧输入；同时发现距离冲突被过度断言。

13. **Wan 身侧且可达误判为必然未靠近**。[前稿](cineweave-host-edit-firstframe-light-output-2026-11-03.md)／[独立发现](cineweave-host-edit-firstframe-light-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `cf3d581fbd39` → `d572b8b5d835`；[修订记录](model-adaptation-review-2026-10-31.md) 第 165 行附近）→ [同题宿主复测](cineweave-host-edit-firstframe-retest2-output-2026-11-03.md)／[独立评语](cineweave-host-edit-firstframe-retest2-review-2026-11-03.md)。
   原题两次 SHA-256 `8f3d601a958af266…`；后测 [输入](cineweave-host-edit-firstframe-retest2-input-2026-11-03.txt)、[冻结哈希](cineweave-host-edit-firstframe-retest2-hashes-2026-11-03.json)、[终态](cineweave-host-edit-firstframe-retest2-terminal-2026-11-03.json)、[快照比较](cineweave-host-edit-firstframe-retest2-comparison-2026-11-03.json)。后测承认身侧可已靠近，按实图手部状态分支；其他分支仍为局部指导。

14. **R07 整板可上传与模型理解格序未直接区分**。[前稿](cineweave-host-r07-latest-output-2026-11-03.md)／[独立发现](cineweave-host-r07-latest-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `d572b8b5d835` → `fda107a3fbbd`；[修订记录](model-adaptation-review-2026-10-31.md) 第 171 行附近）→ [同题宿主复测](cineweave-host-r07-final-output-2026-11-03.md)／[独立评语](cineweave-host-r07-final-review-2026-11-03.md)。
   原题两次 SHA-256 `ac1f49e44decd7ee…`；后测 [输入](cineweave-host-r07-final-input-2026-11-03.txt)、[冻结哈希](cineweave-host-r07-final-hashes-2026-11-03.json)、[终态](cineweave-host-r07-final-terminal-2026-11-03.json)、[快照比较](cineweave-host-r07-final-comparison-2026-11-03.json)。后测写接收不代表理解；逐阶段试片清单仍不完整，见下一条。

15. **R07 整板缺逐格逐阶段试片清单**。[前稿](cineweave-host-r07-final-output-2026-11-03.md)／[独立发现](cineweave-host-r07-final-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `fda107a3fbbd` → `99a4858b7712`；[修订记录](model-adaptation-review-2026-10-31.md) 第 173 行附近）→ [同题宿主复测](cineweave-host-r07-r2-output-2026-11-03.md)／[独立评语](cineweave-host-r07-r2-review-2026-11-03.md)。
   原题两次 SHA-256 `ac1f49e44decd7ee…`；后测 [输入](cineweave-host-r07-r2-input-2026-11-03.txt)、[冻结哈希](cineweave-host-r07-r2-hashes-2026-11-03.json)、[终态](cineweave-host-r07-r2-terminal-2026-11-03.json)、[快照比较](cineweave-host-r07-r2-comparison-2026-11-03.json)。后测列闭盖/半开/露鸟及顺序检查；超宽工具不支持时方案仍缺。

16. **R07 制板工具不支持 16:3 缺回退**。[前稿](cineweave-host-r07-r2-output-2026-11-03.md)／[独立发现](cineweave-host-r07-r2-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `99a4858b7712` → `e8db6ce7d4c7`；[修订记录](model-adaptation-review-2026-10-31.md) 第 175 行附近）→ [同题宿主复测](cineweave-host-r07-r3-output-2026-11-03.md)／[独立评语](cineweave-host-r07-r3-review-2026-11-03.md)。
   原题两次 SHA-256 `ac1f49e44decd7ee…`；后测 [输入](cineweave-host-r07-r3-input-2026-11-03.txt)、[冻结哈希](cineweave-host-r07-r3-hashes-2026-11-03.json)、[终态](cineweave-host-r07-r3-terminal-2026-11-03.json)、[快照比较](cineweave-host-r07-r3-comparison-2026-11-03.json)。后测提出分格生成及装配，但声称独立段落仍有上下文依赖。

17. **R07 分格静态备选正文不是各自自包含**。[前稿](cineweave-host-r07-r3-output-2026-11-03.md)／[独立发现](cineweave-host-r07-r3-review-2026-11-03.md) → [作者源](../../skills/cineweave-director/SKILL.md)（SHA-256 `e8db6ce7d4c7` → `91a9b6e417d5`；[修订记录](model-adaptation-review-2026-10-31.md) 第 177 行附近）→ [同题宿主复测](cineweave-host-r07-r4-output-2026-11-03.md)／[独立评语](cineweave-host-r07-r4-review-2026-11-03.md)。
   原题两次 SHA-256 `ac1f49e44decd7ee…`；后测 [输入](cineweave-host-r07-r4-input-2026-11-03.txt)、[冻结哈希](cineweave-host-r07-r4-hashes-2026-11-03.json)、[终态](cineweave-host-r07-r4-terminal-2026-11-03.json)、[快照比较](cineweave-host-r07-r4-comparison-2026-11-03.json)。后测三份各自写完整画幅、风格、人物、场景与握点；跨图真实一致性待验。

## 共享修订、并发与限制

- 第 7、8 条由同一组 Seedance 前稿／复测触发，分别是首帧接触与编辑时长两项问题，源码分别改入口和模型实践页；不能把它们当成两次独立串行宿主运行。R09 的两条、R07 的四条及 Seedance 多条分别来自同题持续发现和修复；这些是问题级而不是案例级计数。
- R06 与 R09 的宿主运行时间交叠；face、Seedance 和 Wan／Kling 也存在并行快照与共享入口修改。两次输出结束时间先后、同题输入一致与哈希变化，不足以独立证明所有 17 条在全项目层面构成无并发、无重叠的顺序轮次。
- R07 的制板画幅、分格装配和各自独立稿是主动提出备选后应满足的交接条件，不是用户原题硬性锁定 16:3；Seedance 的特定画面左右、持布、接触与光色是该候选正文的首图适配条件，不得推广成所有任务默认。
- 每条解决的只是独立评审对应的特定文字问题，其他条件以该条评语为准。没有实际调用 Seedance、Kling、Wan、上传素材、确认目标账号或对音视频进行艺术验收；参考服从、逐帧接触、时长和声音均不能由本审计证明。

## 数量判断

如果“10 次迭代”指有证据的**不同问题级真实宿主文字闭环**，以上可确认不少于 10 条（列出 17 条），不存在按此口径仍缺的条数。若要求十轮严格顺序、每轮全项目统一冻结、完整独立 diff 与全部受影响用例重新复核，则该要求与上述计数不同；现有并行与共享变更记录不足以准确推算还差几轮，不能把 17 条或十个原题冒充十轮严格串行，也不能凭空指定缺口数量。继续按未完成专项、最终快照工程验证和实际媒体证据推进。
