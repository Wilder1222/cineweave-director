import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = 'D:/Temp/cineweave-unified-workflow-forward-20261012';
const input = JSON.parse(fs.readFileSync('D:/Temp/cineweave-unified-workflow-raw-inputs-20261012.json', 'utf8').replace(/^\uFEFF/, ''));
const testCase = input.cases.find(item => item.id === 'CW-SPLIT-C08');
const hash = text => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const beforeCamera = '桌南侧偏西略俯';
const afterCamera = '桌南侧偏东略俯';
const records = [];
const copies = [];
function createOnce(file, text) {
  fs.writeFileSync(file, text, {encoding: 'utf8', flag: 'wx'});
}
for (const doc of testCase.rawData.sourceDocuments) {
  const cameraMatches = doc.text.split(beforeCamera).length - 1;
  if (cameraMatches !== 1) throw new Error(`Unexpected camera count ${doc.documentId}: ${cameraMatches}`);
  let revised = doc.text.replace(beforeCamera, afterCamera);
  let versionChanges = 0;
  if (doc.documentId === 'REV-G') { revised = revised.replace('设计文本版本1', '设计文本版本2'); versionChanges = 1; }
  if (doc.documentId === 'REV-P') { revised = revised.replace('现有适配工作稿REV-P，版本1', '现有适配工作稿REV-P，版本2'); versionChanges = 1; }
  let restored = revised.replace(afterCamera, beforeCamera);
  if (doc.documentId === 'REV-G') restored = restored.replace('设计文本版本2', '设计文本版本1');
  if (doc.documentId === 'REV-P') restored = restored.replace('现有适配工作稿REV-P，版本2', '现有适配工作稿REV-P，版本1');
  const starts = {'REV-G':'\nREV-S01：','REV-M':'\n0至4秒REV-S01','REV-P':'\nREV-S01复制正文：'};
  const ends = {'REV-G':'\nREV-S02：','REV-M':'\n4至8秒REV-S02','REV-P':'\nREV-S02复制正文：'};
  const s01Before = doc.text.split(starts[doc.documentId])[1].split(ends[doc.documentId])[0];
  const s01After = revised.split(starts[doc.documentId])[1].split(ends[doc.documentId])[0];
  if (restored !== doc.text || s01Before !== s01After) throw new Error(`Unauthorized difference: ${doc.documentId}`);
  createOnce(path.join(root, 'evidence', `${doc.documentId}-original-v1.txt`), doc.text);
  createOnce(path.join(root, `${doc.documentId}-revised-v2.txt`), revised);
  records.push({documentId:doc.documentId, fromRevision:1, toRevision:2, originalSha256:hash(doc.text), revisedSha256:hash(revised), cameraReplacementCount:cameraMatches, versionTextReplacementCount:versionChanges, s01Unchanged:s01Before === s01After, exactAuthorizedDifferenceOnly:restored === doc.text});
  copies.push({id:doc.documentId, text:revised});
}

let answer = '# CW-SPLIT-C08 首版实际回答\n\n修订候选版本2已完成，原版本1保留。修改范围只有REV-S02摄影机位置“桌南侧偏西略俯”→“桌南侧偏东略俯”，以及REV-G/REV-P正文已有的必要版本标识；REV-M以外部版本标签记为2。REV-S01整镜逐字符保持不变，其他字句不扩写。没有沿用此前评审结论，没有实际媒体或定稿批准。\n\n';
for (const doc of copies) answer += `${doc.id}，修订版本2全文：\n\n\`\`\`text\n${doc.text}\n\`\`\`\n\n`;
answer += '界面适配条件：FrameForge（虚构）/Motion 1.0（虚构）/网页T2V，资料fixture-frameforge-motion-1-web-t2v版本1、2026-10-12，来自本次原请求。两镜分别填写上方各自复制正文，画幅均16:9，时长均4秒；不把整段8秒母稿粘成单镜，也不填写参考槽、原生摄影机轨道或原生声音设置。夹具没有负向框、seed、参数尾和分镜导入功能，不增加这些控件。摄影机意图由中文正文承担。只在夹具条件下做离线适配，未访问服务、提交生成或声称live支持。\n\n';
answer += '相邻连续性复查：REV-S01出点与REV-S02入点仍应严格相同——同一闭合盒盖、右手已握南侧前沿、左手按稳盒身、男子在桌北侧、北侧铰链、西窗中性柔光。新东侧视点要确认这两个接触点及开盖后的鸟仍可见、没有越到桌北侧；西窗仍在世界西侧，不为了维持画面中的亮边方向而移动光源。切点不回放右手移握，也不省略闭合到开盖；木盒木纹、衣袖、盖角和末态右手扶盖/左手按盒仍需实际候选复查。没有旧的通过项可继承。\n\n';
answer += '源稿既有缺口另列：REV-P的S02复制正文使用“承接上一镜”“相同男子、衣袖”等依赖上镜的描述，但夹具两镜分别提交且无参考槽。它没有独立写出短黑发、浅灰衬衫、深蓝围裙，T2V跨独立提交的身份/衣袖/木纹连续性也没有已有素材控制。因此此稿仍有复制上下文与连续性未决，不能称为已就绪或已保证一致。本次仅获摄影机位置修改授权，保留这些原文，不顺带扩写；若以后授权另修，再由提示词/平台领域补齐独立上下文，母稿硬锁不变。原有独立声音说明仍保留，尚无实际音轨。\n\n';
answer += '实际Node文本范围核对（本地临时辅助脚本，不是随包规范检查器）：\n\n```json\n' + JSON.stringify({scope:'text_diff_only', records}, null, 2) + '\n```\n\n核对只证明保存文本的授权差异范围与REV-S01逐字符保留，不证明视频、声音、光照或新构图通过。\n\n';
answer += '## 实际执行记录\n\n- 进入统一入口 → cineweave-review局部定位本次唯一变量与影响（未执行六视角，因为本次是聚焦局修）→ 返回导演shot_direction修订REV-G/REV-M相同位置句 → cineweave-platform按原夹具只传播到REV-P → 返回入口核对全部受影响全文、版本、相邻状态与原稿未授权缺口。\n- 同代理手工读取此前已获得的准确内部入口路径，不是宿主自动发现/自动选择；未调用reference、provider、媒体或安装。\n- 内部产物owner：cineweave-review（局部影响/复查与未决记录）；cineweave-director（镜头设计与视频母稿）；cineweave-platform（适配稿）。工作流最终owner：cineweave-director。\n- 实际来源：导演入口；drafts-and-change-impact.md“修订工作表与恢复检查点”；operating-model.md“任务范围与上下文”“能力交接与迁移”；cineweave-review/SKILL.md“按范围检查与修订”及review-repair.md“修复归属”；cineweave-platform/SKILL.md“忠实适配与交付”（尤其局修保留原文）及video-platform-adaptation.md“使用正确的权威来源”“导演方案到复制稿”“适配不是盲目拼接”；原请求REV-G/M/P r1全文及FrameForge夹具r1。路径/hash见report.md。\n';
createOnce(path.join(root, 'CW-SPLIT-C08-v1.md'), answer);
process.stdout.write(JSON.stringify({scope:'text_diff_only', records}, null, 2) + '\n');
