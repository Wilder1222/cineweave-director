import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const inputPath = 'D:/Temp/cineweave-split-p4-contents-raw-inputs-20261012.json';
const out = 'D:/Temp/cineweave-split-p4-baseline-a3-20261012';
const root = 'D:/Temp/cineweave-split-baseline-20261012-23e5cb0865/restored/skills/cineweave-director';
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const case08 = input.cases.find(item => item.id === 'CW-SPLIT-C08');
const docs = case08.rawData.sourceDocuments.map(doc => {
  const oldCamera = '桌南侧偏西略俯';
  const newCamera = '桌南侧偏东略俯';
  const occurrenceCount = doc.text.split(oldCamera).length - 1;
  if (occurrenceCount !== 1) throw new Error(`${doc.documentId}: expected exactly one camera phrase`);
  let text = doc.text.replace(oldCamera, newCamera);
  if (doc.documentId === 'REV-G') text = text.replace('设计文本版本1', '设计文本版本2');
  if (doc.documentId === 'REV-P') text = text.replace('现有适配工作稿REV-P，版本1', '现有适配工作稿REV-P，版本2');
  return { ...doc, revision: 2, text, changedVariable: 'REV-S02摄影机位置', cameraBefore: oldCamera, cameraAfter: newCamera };
});
for (const doc of docs) await writeFile(`${out}/C08-${doc.documentId}-r2.txt`, doc.text, 'utf8');
const original = Object.fromEntries(case08.rawData.sourceDocuments.map(doc => [doc.documentId, doc.text]));
const revised = Object.fromEntries(docs.map(doc => [doc.documentId, doc.text]));
const lockedS01Ranges = {
  'REV-G': text => text.slice(text.indexOf('REV-S01：'), text.indexOf('\nREV-S02：')),
  'REV-M': text => text.slice(text.indexOf('0至4秒REV-S01'), text.indexOf('\n4至8秒REV-S02')),
  'REV-P': text => text.slice(text.indexOf('REV-S01复制正文：'), text.indexOf('\nREV-S02复制正文：')),
};
const verification = docs.map(doc => {
  const s01Unchanged = lockedS01Ranges[doc.documentId](original[doc.documentId]) === lockedS01Ranges[doc.documentId](doc.text);
  const metadataOnlyReversed = doc.text.replace('设计文本版本2', '设计文本版本1').replace('现有适配工作稿REV-P，版本2', '现有适配工作稿REV-P，版本1');
  const onlyAuthorizedCameraChange = metadataOnlyReversed === original[doc.documentId].replace('桌南侧偏西略俯', '桌南侧偏东略俯');
  if (!s01Unchanged || !onlyAuthorizedCameraChange) throw new Error(`${doc.documentId}: unauthorized change`);
  return { id: doc.documentId, fromRevision: 1, toRevision: 2, s01Unchanged, onlyAuthorizedCameraChange, sha256Utf8: createHash('sha256').update(doc.text, 'utf8').digest('hex') };
});
await writeFile(`${out}/C08-change-check.json`, JSON.stringify({ scope: 'text_only', cameraBefore: '桌南侧偏西略俯', cameraAfter: '桌南侧偏东略俯', verification, mediaVerified: false, approved: false }, null, 2) + '\n', 'utf8');
const c08 = `# CW-SPLIT-C08 — 首版全文

来源：REV-G、REV-M、REV-P均为用户修订1；本次输出各自工作修订2，保持为非规范、未生成媒体的文本稿。唯一内容变量是REV-S02机位由“桌南侧偏西略俯”变为“桌南侧偏东略俯”；其余仅更新修订号元数据。REV-S01在三份文件中逐字不变。没有借用旧评审或其他案例事实。

完整镜头组正文REV-G修订2（包括锁定未改的REV-S01）：

\`\`\`text
${revised['REV-G']}
\`\`\`

完整平台中立视频母稿REV-M修订2：

\`\`\`text
${revised['REV-M']}
\`\`\`

完整测试界面适配稿REV-P修订2：

\`\`\`text
${revised['REV-P']}
\`\`\`

离线设置依据是fixture-frameforge-motion-1-web-t2v修订1、2026-10-12合成测试夹具：虚构FrameForge／Motion 1.0网页T2V。两镜分别使用各自复制正文，画幅下拉均选16:9，时长下拉均选4秒；全文母稿不是一次提交8秒的双镜正文。摄影机位置与固定状态只用文字表达，界面无原生摄影机轨道、参考槽、原生声音设置、负向框、seed、参数尾或分镜导入，不创建这些控制。室内底声与木铰链摩擦继续独立保留为后续声音制作意图。未访问服务或提交生成。

需复查的相邻连续性：在4秒直接连续硬切前后，仍是同一盒盖闭合、右手握南侧前沿、左手按稳盒身、男子桌北侧；第二镜不得提前打开、重新移手或重演第一镜。机位仍处桌南侧，只从偏西变为偏东，世界中的西窗和北侧铰链不能随画面左右翻转。新视点可能改变手、盖和木鸟的遮挡关系，须确认南侧前沿握持、北侧铰链转轴和最终扶盖都可读，开盖路径不裁出特写边界。复核衣袖、同一木纹、盒子南北朝向、接触状态、4秒内的完整打开结果，以及室内底声接点；两镜分别T2V不能凭文字保证身份与材质一致。

本次已经用真实保存文本比较三份文件：REV-S01区段均未变，除机位替换和修订号元数据外没有其他改字；详见[C08-change-check.json](./C08-change-check.json)。修订全文也分别保存为[C08-REV-G-r2.txt](./C08-REV-G-r2.txt)、[C08-REV-M-r2.txt](./C08-REV-M-r2.txt)、[C08-REV-P-r2.txt](./C08-REV-P-r2.txt)。这个文本比较只核对修改范围，不证明新机位遮挡、实际身份、连续性或音画质量通过；受影响第二镜和相邻切点仍待新的实际媒体复查。
`;
await writeFile(`${out}/C08.md`, c08, 'utf8');
console.log(JSON.stringify({ casesWritten: ['C08'], verification }));
