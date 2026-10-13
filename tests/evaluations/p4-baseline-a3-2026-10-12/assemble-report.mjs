import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const out = 'D:/Temp/cineweave-split-p4-baseline-a3-20261012';
const root = 'D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored/skills/cineweave-director';
const inputPath = 'D:/Temp/cineweave-split-p4-contents-raw-inputs-20261012.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sections = {
  'SKILL.md': ['全文'],
  'references/routes/image-prompt.md': ['全文'],
  'references/routes/shot-direction.md': ['全文'],
  'references/routes/storyboard-rhythm.md': ['分镜', '分镜参考图到视频', '序列节奏', '相邻剪辑接口', '质量关卡'],
  'references/routes/production-plan.md': ['资产拆解', '从设计到候选验收', '控制与证据', '能力规划', '边界'],
  'references/routes/reference-evidence.md': ['全文'],
  'references/routes/character.md': ['全文'],
  'references/routes/review-repair.md': ['全文'],
  'references/core/operating-model.md': ['全文'],
  'references/optional/prompt-detail-standard.md': ['表达原则', '人物', '人物情绪与表情生成', '场景', '镜头与分镜', '拍摄系统与部门协同及其六个子节', '图生视频', '交付前检查'],
  'references/optional/video-sound-and-delivery.md': ['视频意图', '声音职责与提示表', '精确文案与时间检查', '剪辑'],
  'references/optional/video-platform-adaptation.md': ['使用正确的权威来源', '能力证据的层次与评估日期', '先定参考职责，再写提示词', '模式选择与明确替代', '导演方案到复制稿', '适配不是盲目拼接', '复制稿的内部闭合'],
  'references/optional/ensemble-direction-and-review.md': ['全文'],
  'references/core/reference-evidence-and-rights.md': ['全文'],
  'references/optional/drafts-and-change-impact.md': ['全文'],
  'references/optional/video-performance-direction.md': ['编写顺序', '把角色处境转成可表演任务', '情绪不等于面部几何', '台词与声音表达', '摄影机与焦点', '时间工作表与验收'],
  'references/optional/video-timing-and-handles.md': ['三种时长，不混为一种', '按实际时长政策选择', '尾帧陷阱'],
  'references/optional/shot-design-workbench.md': ['交付范围', '注意力', '受限视点下的可见性', '瞬间选择', '关键帧关卡', '提示词迁移'],
  'references/core/visual-bible-and-continuity.md': ['全文'],
  'references/routes/scene.md': ['全文'],
  'scripts/check-shot-review.mjs': ['全文；C07实际运行'],
  'scripts/parse-json.mjs': ['全文；检查器运行依赖'],
  'references/optional/directing-craft.md': ['目录', '可表演任务，而非规定情绪', '台词是面向倾听者的行动', '用调度表达关系', '倾听、反应与剪辑视点', '选择与克制'],
};
const sources = [];
for (const [relativePath, readSections] of Object.entries(sections)) {
  const sourcePath = `${root}/${relativePath}`;
  const bytes = await readFile(sourcePath);
  sources.push({ sourcePath, relativePath, sha256RawBytes: hash(bytes), readSections });
}
const rawBytes = await readFile(inputPath);
const sourceRecord = {
  entry: `${root}/SKILL.md`,
  rawInput: { sourcePath: inputPath, sha256RawBytes: hash(rawBytes), readSections: ['cases[0..7].request', 'cases[0..7].rawData'] },
  sources,
  caseReadingScope: {
    'CW-SPLIT-C01': ['image_prompt', 'scene', 'prompt-detail-standard：静帧人物、光照与排版'],
    'CW-SPLIT-C02': ['image_prompt', 'shot_direction', 'production_plan', 'video-sound-and-delivery', 'video-performance-direction', 'shot-design-workbench：关键帧关卡'],
    'CW-SPLIT-C03': ['storyboard_rhythm', 'shot_direction', 'scene', 'visual-bible-and-continuity', 'video-sound-and-delivery', 'prompt-detail-standard：逐镜交付'],
    'CW-SPLIT-C04': ['image_prompt：平台适配', 'video-platform-adaptation：权威来源与离线复制稿'],
    'CW-SPLIT-C05': ['reference_evidence', 'character', 'reference-evidence-and-rights', 'prompt-detail-standard：人物资产'],
    'CW-SPLIT-C06': ['production_plan', 'shot_direction', 'scene', 'video-platform-adaptation：能力证据与模式', 'video-sound-and-delivery'],
    'CW-SPLIT-C07': ['review_repair', 'storyboard_rhythm', 'ensemble-direction-and-review：全六视角与检查器', 'scripts/check-shot-review.mjs', 'scripts/parse-json.mjs'],
    'CW-SPLIT-C08': ['review_repair', 'drafts-and-change-impact：版本与影响', 'storyboard_rhythm：相邻接口', 'video-platform-adaptation：离线单镜适配'],
  },
  note: '章节记录列明本次使用内容；目录或整文件读取可能显示相邻段落。没有读取当前产品、研究、评分材料、计划或先前回答。',
};
await writeFile(`${out}/sources.json`, JSON.stringify(sourceRecord, null, 2) + '\n', 'utf8');
const metadata = {
  runId: 'cineweave-split-p4-baseline-a3-20261012',
  configuration: 'A',
  repetition: 3,
  caseIds: Array.from({ length: 8 }, (_, index) => `CW-SPLIT-C${String(index + 1).padStart(2, '0')}`),
  context: '本batch在一个新的fork_none上下文完成；各案事实独立，但不是每案分别fork_none。',
  model: null,
  tokens: { input: null, output: null, total: null },
  latencyMs: null,
  generatedMedia: false,
  providerAccess: false,
  installedAnything: false,
  selfScore: null,
};
await writeFile(`${out}/run-metadata.json`, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
const cases = [];
for (let number = 1; number <= 8; number++) {
  const name = `C${String(number).padStart(2, '0')}.md`;
  cases.push(await readFile(`${out}/${name}`, 'utf8'));
}
const header = `# 基线配置A · 内容重复3 · 8案首版全文

唯一Skill入口：\`${root}/SKILL.md\`。唯一原请求与rawData来源：\`${inputPath}\`。只使用这个基线包的相邻资料，未读取当前产品、研究、rubric、计划或任何先前答案；没有自评分。专业入口均可在包内找到，未安装或调用额外专业Skill。

本batch在一个新的fork_none上下文完成。8案事实分别隔离，但共享这个batch上下文；没有把前案原创设计、参考、批准或检查结论带入后案。模型、token与延迟不可见，记录为null。没有安装、供应商访问、生成任务或媒体生成。

逐案完整稿件已先分别落盘，下方逐字合并。来源文件绝对路径、原字节SHA-256与所用章节见[sources.json](./sources.json)；运行声明见[run-metadata.json](./run-metadata.json)。C07的原稿、工作表和原生Node结果，以及C08修订全文与修改范围检查全部保留于本目录，其链接在对应案例中。

`;
const report = header + cases.join('\n\n---\n\n');
await writeFile(`${out}/report.md`, report, 'utf8');
const localLinks = [...report.matchAll(/\]\((\.\/[^)]+)\)/g)].map(match => match[1]);
for (const target of new Set(localLinks)) await stat(path.resolve(out, target));
const headings = [...report.matchAll(/^# CW-SPLIT-C\d\d — 首版全文$/gm)].length;
if (headings !== 8) throw new Error(`Expected 8 full case headings, got ${headings}`);
if ((report.match(/^```/gm)?.length ?? 0) % 2) throw new Error('Unbalanced code fences');
const savedSource = await readFile(`${out}/C07-source-FG-01-r1.txt`, 'utf8');
const input = JSON.parse(rawBytes.toString('utf8'));
if (savedSource !== input.cases.find(item => item.id === 'CW-SPLIT-C07').rawData.sourceDocument.text) throw new Error('C07 original text changed');
const artifactFiles = await readdir(out);
const artifacts = [];
for (const file of artifactFiles.filter(name => !name.endsWith('.mjs')).sort()) {
  const bytes = await readFile(`${out}/${file}`);
  artifacts.push({ file, bytes: bytes.length, sha256RawBytes: hash(bytes) });
}
await writeFile(`${out}/artifact-manifest.json`, JSON.stringify({ files: artifacts, sourceReadRecords: sources.length + 1, caseCount: headings, localLinkedSidecarsPresent: true, c07OriginalPreserved: true, scope: 'text_and_plan_only' }, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ report: `${out}/report.md`, caseCount: headings, bytes: Buffer.byteLength(report, 'utf8'), sourceReadRecords: sources.length + 1, localLinksVerified: new Set(localLinks).size, c07OriginalPreserved: true }));
