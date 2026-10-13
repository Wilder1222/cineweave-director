import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = 'D:/Temp/cineweave-unified-workflow-forward-20261012';
const hashFile = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
const sourceEntries = read(path.join(root,'evidence','source-log.jsonl')).split(/\r?\n/).filter(Boolean).map(JSON.parse);
const unique = new Map(sourceEntries.map(item => [item.path,item]));
for (const name of ['prepare-c08.mjs','build-report.mjs']) {
  const file = path.join(root,'evidence',name);
  unique.set(file,{path:file,sha256:hashFile(file),headings:['本次Temp辅助脚本，不是产品Skill或随包检查器']});
}
const sources = [...unique.values()].map(item => ({...item,currentSha256:hashFile(item.path),unchanged:item.sha256===hashFile(item.path)}));
if (sources.some(item => !item.unchanged)) throw new Error('Source changed during run');
const cases = ['CW-SPLIT-C01','CW-SPLIT-C02','CW-SPLIT-C03','CW-SPLIT-C04','CW-SPLIT-C05','CW-SPLIT-C06','CW-SPLIT-C07','CW-SPLIT-C08','CW-SPLIT-T23','CW-SPLIT-T24'];
const metadata = {
  format:'cineweave-forward-run-report/v1',
  runMode:'newfork_none',
  date:'2026-10-12',
  caseCount:cases.length,
  sharedContextBatch:true,
  perCaseFreshContext:false,
  entrySelection:'Task-provided exact path, manually read by the same agent',
  internalCapabilitySelection:'Task-provided allowed exact paths, manually read and executed as needed',
  automaticHostSelectionObserved:false,
  subagentsUsed:false,
  model:null,
  tokenUsage:null,
  reasoningEffort:null,
  latencyMs:null,
  scoringPerformed:false,
  mediaCreated:false,
  providerAccessed:false,
  approvalGranted:false
};
let report = '# 统一入口工作流：独立前向首版交付报告\n\n';
report += '本报告内嵌10条原请求的全部实际首版回答、必要内部步骤与跳过说明、产物owner及工作流最终owner、实际来源路径/字节SHA256/使用章节，以及所有实际检查命令的原生结果。没有自评分。每案首版文件使用v1保留；C08的用户稿修订是独立的版本2候选，原版本1另外保存。\n\n';
report += '执行方法与限制：本run按任务要求为newfork_none；10案在同一代理、同一新分支上下文中依次执行。初始输入包含全部10案，因此这不是10次互相独立的新上下文试跑，无法由此证明对历史上下文污染的完全隔离。各案只使用该案原请求/rawData和当前Skill规则；前案原创人物、服装、场景、光源、素材、声音或批准状态不带入后案。没有读取rubric、测试计划、旧输出、研究资料、其他run、dev tests或skill-sources。只从任务给定的统一入口进入，专业能力入口也使用任务给定允许范围内的准确路径手工读取；没有宿主自动发现/选择的证据，不如此宣称。没有子代理、安装、provider访问、生成媒体或外部批准。模型、token、推理档与时延没有可靠观测，均为null；Native Node版本是实际命令返回，单独记录。\n\n';
report += '```json\n' + JSON.stringify(metadata,null,2) + '\n```\n\n';
report += '## 输入与入口\n\n';
report += '- 原请求文件：`D:/Temp/cineweave-unified-workflow-raw-inputs-20261012.json`，SHA256 `76b204ce9a21ed4f6832d4b82d2afc0a8c5313a35673aa436b8adb7ba419b36d`。\n';
report += '- 唯一用户入口：`D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-director/SKILL.md`，SHA256 `ed028f57348cf23187165e227bc17ff03841b39cf7357e7c2b45bdbc44828a89`。\n';
report += '- C04/C05/C06/C07/C08的内部入口均同代理手工按需读取；专业产物owner与导演最终owner分别写在各案记录。T23/T24为无关任务，直接翻译/算术。\n\n';
report += '## 全部实际首版回答与逐案过程\n\n';
for (const id of cases) {
  const file=path.join(root,`${id}-v1.md`);
  report += `交付文件：\`${file}\`；SHA256 \`${hashFile(file)}\`。\n\n`;
  report += read(file) + '\n\n';
}
report += '## 全部实际来源索引\n\n';
report += '以下为真实文件字节SHA256。章节栏是来源文件的标题索引；本次实际适用的具体章节已在逐案过程记录，标题索引不表示每案加载或应用整份资料。首次读取时记录的hash与报告汇总时重读字节的hash一致。产品源码未修改。原请求里的文字材料只依据相应case/documentId/revision定位；它们没有规范canonical引用或真实媒体哈希。\n\n';
for (const source of sources) {
  report += `- 路径：\`${source.path}\`\n  - SHA256：\`${source.sha256}\`；汇总时字节一致：\`${source.unchanged}\`。\n  - 章节/使用性质：${source.headings.length?source.headings.map(item=>item.replace(/^#+\s*/, '')).join('；'):'用户原请求JSON；逐案使用request/rawData，无Markdown章节'}。\n`;
}
report += '\n## 实际原生工具结果（完整stdout与退出码）\n\n';
report += 'Node版本命令`node --version`实际返回：\n\n```text\nv22.15.0\n```\n\n';
const commands = [
 {name:'CW-SPLIT-C07-shot-review-native',cmd:'node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-shot-review.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-shot-review-v1.json'},
 {name:'CW-SPLIT-C07-delivery-native',cmd:'node D:/study/projects/cineweave-codex-skills/cineweave-director/skills/cineweave-review/scripts/check-delivery.mjs D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/CW-SPLIT-C07-delivery-v1.json'},
 {name:'CW-SPLIT-C08-native',cmd:'node D:/Temp/cineweave-unified-workflow-forward-20261012/evidence/prepare-c08.mjs'}
];
for (const result of commands) {
  const stdout=read(path.join(root,'evidence',`${result.name}.stdout.json`));
  const stderr=read(path.join(root,'evidence',`${result.name}.stderr.txt`));
  const exitCode=read(path.join(root,'evidence',`${result.name}.exit-code.txt`)).trim();
  report += `命令：\n\n\`\`\`text\n${result.cmd}\n\`\`\`\n\n原生exit code：\`${exitCode}\`；原生stdout：\n\n\`\`\`json\n${stdout.trimEnd()}\n\`\`\`\n\n原生stderr：${stderr.length?'\n\n```text\n'+stderr+'\n```':'空（0字节）'}。\n\n`;
}
report += 'C07随包工作表检查仅证明输入一致性与声明覆盖：valid=true、coverageComplete=true、reviewComplete=false，4项openItems，退出码2。交付覆盖算术检查为4秒+4秒=8秒，退出码0；没有canonical JSON，没有媒体。C08辅助脚本仅核对授权文本差异：三个REV-S01片段均逐字符不变、三个文件每份仅有一次摄影机位置替换，另外仅G/P修改各自版本标识；退出码0。未在无变化条件下反复运行。\n\n';
report += '## 持久文件与证据清单\n\n';
const outputs = fs.readdirSync(root,{withFileTypes:true}).filter(item=>item.isFile()).map(item=>path.join(root,item.name));
const evidenceFiles=fs.readdirSync(path.join(root,'evidence'),{withFileTypes:true}).filter(item=>item.isFile()).map(item=>path.join(root,'evidence',item.name));
for (const file of [...outputs,...evidenceFiles]) report += `- \`${file}\`；${fs.statSync(file).size} bytes；SHA256 \`${hashFile(file)}\`。\n`;
report += '\n保存文件的hash仅证明字节，不证明权利、批准、能力或媒体效果；本报告没有给Skill通过率/分数，也未宣称当前设计已经过实际媒体验收。\n';
fs.writeFileSync(path.join(root,'report.md'),report,{encoding:'utf8',flag:'wx'});
fs.writeFileSync(path.join(root,'run-metadata.json'),JSON.stringify({...metadata,sources,caseFiles:cases.map(id=>({id,file:path.join(root,`${id}-v1.md`),sha256:hashFile(path.join(root,`${id}-v1.md`))}))},null,2)+'\n',{encoding:'utf8',flag:'wx'});
process.stdout.write(JSON.stringify({reportPath:path.join(root,'report.md'),caseCount:cases.length,sourceCount:sources.length,allRecordedSourcesUnchanged:sources.every(item=>item.unchanged),reportBytes:fs.statSync(path.join(root,'report.md')).size,reportSha256:hashFile(path.join(root,'report.md')),scoringPerformed:false},null,2)+'\n');
