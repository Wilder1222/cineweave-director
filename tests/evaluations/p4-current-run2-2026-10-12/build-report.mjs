import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const root = 'D:/study/projects/cineweave-codex-skills/cineweave-director';
const out = 'D:/Temp/cineweave-split-p4-current-run2-20261012';
const rawPath = 'D:/Temp/cineweave-split-p4-correction-raw-inputs-20261012.json';
const readUtf8 = p => readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const hash = p => createHash('sha256').update(readFileSync(p)).digest('hex').toUpperCase();
const raw = JSON.parse(readUtf8(rawPath));
const ids = ['CW-SPLIT-C01','CW-SPLIT-C02','CW-SPLIT-C03','CW-SPLIT-C06','CW-SPLIT-C08'];
const records = [
  {key:'input',path:rawPath,chapters:['cases: 原请求与本次rawData'],kind:'raw_input'},
  {key:'director-entry',path:'skills/cineweave-director/SKILL.md',chapters:['frontmatter','正文全部：从交付物开始、创作顺序、创作约定、提示词与视频交接、专业能力交接、按需深入、可选结构化交付'],kind:'skill'},
  {key:'platform-entry',path:'skills/cineweave-platform/SKILL.md',chapters:['frontmatter','正文全部：从实际输入开始、忠实适配与交付、创作约定、按需读取、可选规范交接'],kind:'skill'},
  {key:'reference-frontmatter',path:'skills/cineweave-reference/SKILL.md',chapters:['仅frontmatter；无实际参考素材，未加载正文'],kind:'routing_only'},
  {key:'review-frontmatter',path:'skills/cineweave-review/SKILL.md',chapters:['仅frontmatter；本次为创作与授权局修，未启动独立评审流程，未加载正文'],kind:'routing_only'},
  {key:'image-route',path:'skills/cineweave-director/references/routes/image-prompt.md',chapters:['全文：编译顺序、提示词精简关卡、参考与变换、关键帧准备度、平台适配、准确文字与排版、导入既有提示词、变体与负向约束'],kind:'reference'},
  {key:'shot-route',path:'skills/cineweave-director/references/routes/shot-direction.md',chapters:['全文：明确戏剧单元、摄影机与构图、镜头光照与时间、电影模式与编译、下游产物'],kind:'reference'},
  {key:'storyboard-route',path:'skills/cineweave-director/references/routes/storyboard-rhythm.md',chapters:['全文；第一次合批回传有截断，随后定向补读31至69行及相邻剪辑接口'],kind:'reference'},
  {key:'repair-route',path:'skills/cineweave-director/references/routes/review-repair.md',chapters:['全文：基准、评审、修复归属、返回结果与新证据；仅用于局修边界，未作自评分'],kind:'reference'},
  {key:'prompt-detail',path:'skills/cineweave-director/references/optional/prompt-detail-standard.md',chapters:['标题索引','1至96行：表达原则、人物、人物情绪与表情生成、场景、镜头与分镜','100至162行：空间关系与调度、构图与摄影实现、灯光与曝光连续性、收音与声音空间、场记、场次与逐镜交付模板、图生视频','216至223行：交付前检查'],kind:'reference'},
  {key:'video-sound',path:'skills/cineweave-director/references/optional/video-sound-and-delivery.md',chapters:['标题索引','1至78行：视频意图、续写与生成段落边界、声音职责与提示表、精确文案与时间检查、交付与资源工作表'],kind:'reference'},
  {key:'motion-handoff',path:'skills/cineweave-director/references/optional/generation-diagnostics.md',chapters:['标题索引','9至40行：证据阶段、风险工作表、运动交接'],kind:'reference'},
  {key:'change-impact-guide',path:'skills/cineweave-director/references/optional/drafts-and-change-impact.md',chapters:['标题索引','1至111行：工作草稿、修订工作表与恢复检查点、变更影响示例、只读变更影响查询及输入规则；第一次合批回传有截断，随后定向补读'],kind:'reference'},
  {key:'platform-adaptation',path:'skills/cineweave-platform/references/optional/video-platform-adaptation.md',chapters:['标题索引','1至29行：使用正确的权威来源、能力证据层次与日期','49至110行：先定参考职责、模式选择、导演方案到复制稿、同一决定的文字与图像路径','154至173行：分平台交接、适配不是盲目拼接、外部人工交接与返回'],kind:'reference'},
  {key:'delivery-checker',path:'skills/cineweave-director/scripts/check-delivery.mjs',chapters:['实际CLI执行；哈希及import行定位，未全量预读源码'],kind:'runtime'},
  {key:'impact-checker',path:'skills/cineweave-director/scripts/check-change-impact.mjs',chapters:['实际CLI执行；哈希及export/CLI/import行定位，未全量预读源码'],kind:'runtime'},
  {key:'strict-json-runtime',path:'skills/cineweave-director/scripts/parse-json.mjs',chapters:['上述两个检查器实际导入执行；只读取哈希与import定位，无其他本地导入'],kind:'runtime'}
].map(x => ({...x,path:x.path.startsWith('D:/')?x.path:join(root,x.path).replaceAll('\\','/')}));
const sources = records.map(x=>({...x,sha256:hash(x.path)}));
writeFileSync(join(out,'source-read-manifest.json'),JSON.stringify(sources,null,2)+'\n',{flag:'wx'});

const executions = JSON.parse(readUtf8(join(out,'tool-executions.json'))).map(x=>({
  ...x,nativeResult:x.nativeResult.replaceAll('\\','/'),nativeResultSha256:hash(x.nativeResult),
  stdoutNative:readUtf8(x.nativeResult),result:JSON.parse(readUtf8(x.nativeResult))
}));
const shared = ['input','director-entry','platform-entry','reference-frontmatter','review-frontmatter'];
const perCaseSources = {
  'CW-SPLIT-C01':['image-route','prompt-detail'],
  'CW-SPLIT-C02':['image-route','shot-route','prompt-detail','video-sound','motion-handoff','platform-adaptation','delivery-checker','strict-json-runtime'],
  'CW-SPLIT-C03':['shot-route','storyboard-route','prompt-detail','video-sound','delivery-checker','strict-json-runtime'],
  'CW-SPLIT-C06':['shot-route','prompt-detail','video-sound','motion-handoff','platform-adaptation','delivery-checker','strict-json-runtime'],
  'CW-SPLIT-C08':['repair-route','shot-route','storyboard-route','change-impact-guide','platform-adaptation','video-sound','delivery-checker','impact-checker','strict-json-runtime']
};
const cases=ids.map(id=>{
  const file=join(out,id+'-first-v1.md').replaceAll('\\','/');
  return {id,inputSource:{path:rawPath,caseId:id},firstVersion:1,firstVersionPath:file,sha256:hash(file),
    finalOwner:'cineweave-director',auxiliarySkills:(id==='CW-SPLIT-C06'||id==='CW-SPLIT-C08')?['cineweave-platform']:[],
    routingNote:(id==='CW-SPLIT-C06'||id==='CW-SPLIT-C08')?'导演收口，平台按需完成离线适配；无参考观察和正式媒体验收':'导演完成本次创作；未启动其他专业入口的正文流程',
    sourceKeys:[...shared,...perCaseSources[id]],response:readUtf8(file),actualToolExecutions:executions.filter(x=>x.case===id)};
});

const rev=cases.find(c=>c.id==='CW-SPLIT-C08');
const docs=raw.cases.find(c=>c.id==='CW-SPLIT-C08').rawData.sourceDocuments;
const blocks=[...rev.response.matchAll(/```text\n([\s\S]*?)\n```/g)].map(m=>m[1]);
const preservation=docs.map((doc,i)=>{
  let expected=doc.text.replaceAll('桌南侧偏西略俯','桌南侧偏东略俯');
  if(doc.documentId==='REV-G')expected=expected.replace('设计文本版本1','设计文本版本2');
  if(doc.documentId==='REV-P')expected=expected.replace('REV-P，版本1','REV-P，版本2');
  const actual=blocks[i];
  return {documentId:doc.documentId,sourceRevision:1,targetRevision:2,
    allowedContentReplacement:{before:'桌南侧偏西略俯',after:'桌南侧偏东略俯'},
    necessaryVersionReplacement:doc.documentId==='REV-G'?'设计文本版本1 -> 设计文本版本2':doc.documentId==='REV-P'?'REV-P，版本1 -> REV-P，版本2':'文外版本标识',
    actualMatchesOnlyAuthorizedTransformation:actual===expected,
    sourceCameraPhraseOccurrences:doc.text.split('桌南侧偏西略俯').length-1,
    targetOldCameraPhraseOccurrences:actual.split('桌南侧偏西略俯').length-1,
    note:'仅比较本次给定原文与正文字符，不使用rubric或评分；不证明媒体连续性'};
});
writeFileSync(join(out,'CW-SPLIT-C08-scope-preservation.native.json'),JSON.stringify(preservation,null,2)+'\n',{flag:'wx'});

const metadata=JSON.parse(readUtf8(join(out,'run-metadata.json')));
const report={
  reportVersion:1,batch:'newfork_none',run:'current-run2',date:'2026-10-12',metadata,
  contextLimitations:['五案在同一个独立子代理上下文中按顺序执行，未为每案另起全新上下文；因此只主张本run与其他run隔离，不主张五案间完全上下文隔离。','输入只来自指定raw文件；产品知识只来自四个指定Skill根及其相邻资源。','未读取旧答案、其他run、rubric、研究、计划、skill-sources或devtests；没有自评分、排名或比较前轮结论。','四入口先读取frontmatter；只继续读取导演与平台正文，参考和评审入口正文未加载。','两次合批内容回传出现工具显示截断，对影响本次交付的章节定向补读；记录所请求的章节范围。','时间检查使用24/1的设计计算时基，不声称媒体采集帧率或平台帧率已知。','未调用供应商、访问服务、安装、生成媒体、批准、提交或改动产品源码；所有输出在独立D:/Temp目录。','模型、token用量、推理档位、总生成延迟没有可核验元数据，均为null。'],
  sourceReadManifest:sources,actualToolExecutions:executions,
  scopePreservationComparison:{nativePath:join(out,'CW-SPLIT-C08-scope-preservation.native.json').replaceAll('\\','/'),result:preservation},
  cases
};
writeFileSync(join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});

let md='# 当前四Skill配置独立执行报告 · run2\n\n';
md+='batch: `newfork_none`。五案在同一独立子代理上下文中执行；没有逐案重置上下文。模型、token、推理档位、生成延迟均为 `null`。无自评分。\n\n';
md+='输入仅为指定raw文件；先读四入口frontmatter，再按需读取导演与平台正文及相邻资源。没有媒体、供应商调用、外部服务访问、安装、批准或产品源码改动。\n\n';
md+='## 实际读取来源\n\n| key | path | SHA-256 | 读取章节 |\n| --- | --- | --- | --- |\n';
for(const s of sources)md+=`| ${s.key} | ${s.path} | ${s.sha256} | ${s.chapters.join('；')} |\n`;
md+='\n## 实际Node工具结果\n\n';
for(const e of executions){md+=`### ${e.case} · ${e.command}\n\n退出码：${e.exitCode}。原生结果：${e.nativeResult}\n\n\`\`\`json\n${e.stdoutNative.trim()}\n\`\`\`\n\n`;}
md+='退出码2为有效变更影响工作表仍有待审依赖，保留REV-adjacent-continuity复查；不改为全面通过。所有工具只支持其原生scope，不支持媒体质量声明。\n\n';
md+='## C08原文保留的字符比较\n\n```json\n'+JSON.stringify(preservation,null,2)+'\n```\n\n';
for(const c of cases){md+=`## ${c.id} 首版全文\n\n最终主责：${c.finalOwner}。必要辅助：${c.auxiliarySkills.length?c.auxiliarySkills.join('、'):'无'}。首版路径：${c.firstVersionPath}。SHA-256：${c.sha256}。\n\n${c.response}\n`;}
md+='\n## 执行限制\n\n';
md+=report.contextLimitations.map(x=>'- '+x).join('\n')+'\n';
writeFileSync(join(out,'report.md'),md,{flag:'wx'});

const artifacts=[...ids.map(id=>id+'-first-v1.md'),'source-read-manifest.json','tool-executions.json',
  ...ids.filter(id=>id!=='CW-SPLIT-C01').flatMap(id=>[id+'-delivery-workbook.json',id+'-delivery-result.native.json']),
  'CW-SPLIT-C08-impact-workbook.json','CW-SPLIT-C08-impact-result.native.json','CW-SPLIT-C08-scope-preservation.native.json','report.json','report.md','run-metadata.json','build-report.mjs'
].map(name=>({path:join(out,name).replaceAll('\\','/'),sha256:hash(join(out,name))}));
writeFileSync(join(out,'artifact-manifest.json'),JSON.stringify(artifacts,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({reportPath:join(out,'report.md'),jsonReportPath:join(out,'report.json'),caseCount:cases.length,
  firstVersionsSaved:cases.map(c=>c.firstVersionPath),nodeResults:executions.map(e=>({case:e.case,exitCode:e.exitCode,nativeResult:e.nativeResult})),scopePreservation:preservation.map(p=>({documentId:p.documentId,actualMatchesOnlyAuthorizedTransformation:p.actualMatchesOnlyAuthorizedTransformation})),sourceCount:sources.length,model:null,tokenUsage:null,reasoningEffort:null,latency:null},null,2));
