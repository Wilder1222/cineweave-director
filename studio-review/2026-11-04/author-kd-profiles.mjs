// Source-field extraction and rendering only. Semantic decisions are authored in kd-decisions.mjs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildProductionPackage} from './build-production-package.mjs';
const base=dirname(fileURLToPath(import.meta.url));
const inv=JSON.parse(await readFile(resolve(base,'local-inventory.json'),'utf8'));
export const configurations={};
const roles=['direction','performance','staging','cinematography','prompt','continuity'];
export function decision(id,purpose,notes,dialogue=[],extra={}) { if(notes.length!==6)throw Error('Six authored observations required');return {id,purpose,notes,dialogue,...extra}; }
export function person(id,name,identity,costume,voice){return {id,name,identity,costume,voice};}
export function material(id,asset,baseColor,texture,description,preserve){return{id,asset,baseColor,texture,description,preserve};}
export function test(id,shots,objective,input,pass,fail){return{id,shots,objective,input,fixed:['本轮指定人物/服化道与世界坐标','本组实际镜号/动作顺序/准确对白','非测试变量保持相同'],pass,fail,stop:'至多2个有明确区别的候选；任何阻断失败回责任领域修复。无新辨别证据不重复提交；先完成本组实际听看和试剪再扩大生成。'};}
export function draw(actors,props=[],layers=[],background='#d8d8ce'){return {background,actors:actors.map(a=>({label:a[0],x:a[1],y:a[2],scale:a[3]??1,pose:a[4]??''})),props:props.map(a=>({label:a[0],x:a[1],y:a[2],width:a[3],height:a[4],shape:a[5]??'rect'})),layers:layers.map(a=>({label:a[0],x:a[1],y:a[2],width:a[3],height:a[4],color:a[5]??'#b5b6aa',opacity:.65}))};}
export async function loadSource(topic){
 const t=inv.topics.find(t=>t.topic_id===topic);if(!t)throw Error('No inventory topic');const dir=resolve(base,'studio-current',t.original_studio_project_id),idx=JSON.parse(await readFile(resolve(dir,'index.json'),'utf8'));
 const docs=idx.documents.filter(d=>d.title.includes('20261031'));const pick=k=>docs.find(d=>d.title.includes(k));const script=pick('｜剧本｜'),board=pick('｜分镜与视频提示｜'),review=pick('｜审阅与来源｜');if(!script||!board)throw Error('Current source missing');
 for(const d of [script,board,review].filter(Boolean)){d.id??=d.documentId;d.text=await readFile(d.path??resolve(dir,d.file),'utf8');}
 const lines=board.text.split(/\r?\n/),starts=[];for(let i=0;i<lines.length;i++)if(new RegExp('^### '+topic+'-').test(lines[i]))starts.push(i);
 const shots=starts.map((start,i)=>{const end=i+1<starts.length?starts[i+1]:lines.findIndex((l,j)=>j>start&&l==='## 未验范围');const block=lines.slice(start,end<0?lines.length:end);const field=p=>block.find(x=>x.startsWith(p))?.slice(p.length)??'';const h=block[0].match(/^### (.+?)｜([\d.]+)–([\d.]+)秒｜(.+)$/);if(!h)throw Error('Source syntax changed');const ai=block.findIndex(x=>x.startsWith('准确动作与对白'));return {id:h[1].split('-').at(-1),sourceId:h[1],title:h[4],durationSeconds:Number(h[3])-Number(h[2]),source:{documentId:board.id,startLine:start+1,endLine:end<0?lines.length:end},entry:field('入镜状态：'),exit:field('出点：'),action:block.slice(ai+1,block.findIndex(x=>x.startsWith('表演触发'))).join('\n').trim(),performance:field('表演触发与回应：'),photography:field('摄影：'),time:field('时间轨：'),sound:field('声音：'),continuity:field('相邻状态限制：'),transition:field('转场：'),raw:block.join('\n')};});
 return {topic:t,projectId:t.original_studio_project_id,idx,script,board,review,shots,scene:lines[8],light:lines[9]};
}
function fieldsCamera(s,m,c){
 const p=s.photography;const scale=p.split('；')[0];const pos=p.match(/机位(.+?)，高度/)?.[1]??p;const height=p.match(/高度(.+?)，朝向/)?.[1]??'本镜源稿所列高度';const angle=p.match(/朝向(.+?)(?:。|，从)/)?.[1]??'本镜明确的观看朝向';
 const fg=p.match(/前景(.+?)，中景/)?.[1]??m.foreground;const mg=p.match(/中景(.+?)，后景/)?.[1]??m.midground;const bg=p.match(/后景(.+?)。/)?.[1]??m.background;const focus=p.match(/焦点保持(.+?)(?:，关键|。)/)?.[1]??m.focusTarget;
 return {camera:{scale,position:pos,height,angle,axis:c.axis,perspective:m.purpose,type:'static',movement:'机身固定在本镜已列可达机位，人物和物件按正文行动；不用装饰性运镜掩盖接触或对话。',trigger:s.performance,depth:m.depth??'让本镜已列关键工作范围可读；不同深度对象保留真实层次，不把全清晰或景深效果当已验证。',focus:[{time:0,target:focus}],...m.camera},composition:{layout:m.layout??`沿${c.axis}，${scale}覆盖本镜主要信息；实际物件不为构图换位置`,foreground:fg??'本镜接触面',midground:mg??'源稿指定人物/物件',background:bg??'同一空间既定背景',negativeSpace:m.negativeSpace??'为本镜视线/进出路径留实际空区，不虚构新对象',visualHierarchy:m.hierarchy??m.purpose,...m.composition}};
}
export async function authorKD(topic){
 const c=configurations[topic];if(!c)throw Error('Authored configuration missing '+topic);const src=await loadSource(topic);let ss=src.shots;const patches=[];
 for(const p of c.patches??[]){let n=0;for(const d of [src.script,src.board,src.review].filter(Boolean)){if(p.kinds&&!p.kinds.includes(d===src.script?'script':d===src.board?'board':'review'))continue;if(d.text.includes(p.before)){patches.push({documentId:d.id,before:p.before,after:p.after,reason:p.reason});n++;}}if(!n)throw Error('Exact authored patch missing '+topic+' '+p.before);}
 if(c.transformShots)ss=c.transformShots(ss);
 if(ss.length!==c.shots.length)throw Error(topic+' actual shot order/count mismatch');
 const characters=c.characters.map(x=>({...x,prompt:`16:9，原创写实电影人物资产候选。${x.name}，${x.identity}；当前服装${x.costume}。正面与三分之四侧面中性站姿两格，保持同一五官/年龄/发型/衣料接缝；低细节中灰背景，无第三人、商标或印字。皮肤保留细微冷暖与真实体积，布料纹理尺度小于接缝，不以过度磨皮固定情绪。外貌为可撤销设计，无未提供参考脸绑定。`}));
 const identity=characters.map(x=>`${x.name}：${x.identity}，${x.costume}`).join('；');
 const baseline=`16:9横版，原创写实电影短片设计，${c.medium??'真人表演与明确的虚构机械合成分层'}。世界空间：${c.space.geography}。角色身份候选：${identity}。光源：${c.lights.map(l=>l.id+' '+l.description).join('；')}。色彩：${c.palette.map(p=>p.hex+'用于'+p.use).join('；')}。只让本镜取景规定的人物/物件入画，身份列表不要求全员在画。精确屏幕/纸上字由后期排版，不加第三人、商标或叙事事件。`;
 const assets=c.assets.map(a=>({...a,prompt:`16:9横幅，原创写实电影资产设计。${c.title}的${a.name}：${a.description}。空间约束：${c.space.geography}。光源${c.lights.map(l=>l.description).join('；')}；展示真实支撑、接触与表面尺度。无人，不添加额外门窗、物件或烧录文字；准确字迹留载体供后期。此为待生成设计稿。`}));
 const ld=(id,target,request,compare,pass,fail)=>({id:topic+'-'+id,target,prompt:baseline+'\n'+request,fixed:['同一角色身份、服饰、物件ID','同一世界门窗/通道/光源位置','除对照变量外曝光/物件状态固定'],compare,pass,fail});
 const lookdev=[
  ld('LD1','人物近景',`${characters[0].name}单人正面和3/4近景，眼眶体积、衣领织纹及肤色可读；其他角色不入画。`,'同一人物在两个已有观看方向的面部受光',['五官/发型/衣领连续；眼睛暗部仍可辨','皮肤不过曝，肤色和环境反射有区别'],['换脸换龄/新增首饰','高光抹平皮肤、阴影吞眼']),
  ld('LD2','场景空镜','无人空场，按命名锚点同时交代出入口、动作支撑面与可通行路径，不镜像房间。','同一布局中近/广覆盖',['门与通道在同一世界侧且路径可达','关键物件有实际支撑，不挡应有通路'],['新增门窗、遮住关键通路','反打布局翻转或关键支撑消失']),
  ld('LD3','材质',`无人物材质对照，分格显示${c.materials.map(m=>m.asset+'，'+m.description).join('；')}。同一光照下近距离显示接缝/磨痕与反射，不印图表标签。`,'本片相邻表面的粗糙/光滑差异',['物件基色/纹理尺度固定；表面反射有区别','接触处不穿透，磨损不逐帧游移'],['全物件同样塑料高光','金属透光或纸张变金属']),
  ld('LD4','明暗/内外转换',c.transitionTest,'本片已有明暗区的受光变化',['变化来自既定光源和路径/明示时间省略','同人肤色/衣料仍可追踪，世界门窗不动'],['变昼夜却无省略','亮度变化换脸换材质或阴影无因翻转']),
  ld('LD5','同轴不同机位一致性',`从${c.axis}上两处已列可达机位分别观察同一人物和关键物件，保持人物站位/持物手、门窗和灯位；不新创剧情镜头。`,'当前镜头间身份/光向/地理一致性',['人物身份、服饰接缝、持物手连续','同一世界光源在人物相同侧，路径真实接续'],['物件切换后瞬移/重置','越轴导致动作/视线关系失去依据'])
 ];
 const shots=ss.map((s,i)=>{const m=c.shots[i];if(m.id!==s.id)throw Error('Authored actual shot mismatch '+topic+s.id);if(m.notes.some(x=>!x)||!m.frame)throw Error('Missing authored semantic/frame '+topic+s.id);let raw=s.raw;for(const p of patches.filter(p=>p.documentId===src.board.id))if(raw.includes(p.before))raw=raw.replace(p.before,p.after);
 const sourceSound=s.sound.replace('对白使用下列原句，未见人物不加可辨人声。','仅用本镜明确原句；指定角色可从同一现场画外说话，未列第三人不加声。');
 const camera=fieldsCamera(s,m,c);const extract=(label,fallback)=>raw.split(/\r?\n/).find(x=>x.startsWith(label))?.slice(label.length)??fallback;
 const ai=raw.indexOf('准确动作与对白'),aStart=raw.indexOf('\n',ai)+1,aEnd=raw.indexOf('\n表演触发',aStart);const action=aEnd>aStart?raw.slice(aStart,aEnd).trim():s.action;
 const photo=m.camera?Object.entries(camera.camera).map(([k,v])=>k+'：'+(typeof v==='object'?JSON.stringify(v):v)).join('；'):extract('摄影：',s.photography);
 const prompt=baseline+'\n\n单一镜头 '+topic+'-'+s.id+'，'+s.durationSeconds+'秒设计预算。\n本镜具体入态：'+(m.entry??extract('入镜状态：',s.entry))+'\n完整动作与准确对白：'+action+'\n表演触发与回应：'+extract('表演触发与回应：',s.performance)+'\n摄影：'+photo+'\n本镜动作时间预算：'+s.time+'\n声音：'+sourceSound+'；'+c.sound+'\n出态：'+(m.exit??extract('出点：',s.exit))+'\n状态硬锁：'+extract('相邻状态限制：',s.continuity)+(m.promptAppend?'\n本镜补充硬锁：'+m.promptAppend:'');
 const dialogue=m.dialogue.map(d=>({speaker:d[0],text:d[1],addressee:d[2]??'本镜对手',performance:d[3]??s.performance,...(d.length>5?{startSeconds:d[4],endSeconds:d[5]}:{})}));
 return {id:topic+'-'+s.id,title:s.title,durationSeconds:s.durationSeconds,source:s.source,prompt,path:'t2v完整中文母稿；角色/空间图为待生成引用候选，尚未实际绑定；双入口能力核后再锁输入',beat:m.purpose,purpose:m.purpose,entry:m.entry??s.entry,exit:m.exit??s.exit,...camera,frame:m.frame,sound:sourceSound+'；'+c.sound,transition:m.transition??s.transition,dialogue,reviews:Object.fromEntries(roles.map((r,j)=>[r,{status:m.status?.[r]??'pass',criterion:m.notes[j].split('；')[0],observation:m.notes[j],sourceLocator:src.board.id+':L'+s.source.startLine+'–L'+s.source.endLine}]))};
 });
 const profile={schemaVersion:'cineweave-production-profile/v1',topicId:topic,title:c.title,revision:1,source:{projectId:src.projectId,scriptDocumentId:src.script.id,storyboardDocumentId:src.board.id,...(src.review?{reviewDocumentId:src.review.id}:{})},patches,creative:{logline:src.script.text.match(/## 梗概\r?\n([^#]+)/)?.[1].trim()??c.logline,intent:c.intent,hardLocks:c.hardLocks,assumptions:['外貌、服化道、色卡、材质、平面尺寸和光位是本轮可撤销视觉设计；不冒称原作定稿。','16:9、24fps为设计时间基准；实拍/模型输出与平台能力未核。'],review:c.review},visual:{style:{medium:c.medium??'原创写实真人与虚构机械合成',rules:c.styleRules,exclusions:c.exclusions??['不增加第三出镜人或解释性旁白','不把计划图示当生成结果','不以发光/快速剪辑遮掩接触、机械因果与准确台词']},palette:c.palette,materials:c.materials,lighting:c.lights.map(l=>({id:l.id,sourceId:l.id,position:l.description,quality:l.quality,intent:l.intent})),characters,assets,lookdev},space:{...c.space,lights:c.lights},blocking:c.blocking,shots,audio:{fps:24,music:c.music??'不铺满配乐；先保对白、真实停顿和关键接触声。若用低动态音乐，在对白/提示音/接触前降低；未有音轨不得称混音通过。',subtitles:'仅将dialogue-cues.json指定说话内容逐句排版。屏上记录/短信为独立图形层，不自动念出。对白窗需真实录音/合成后重测，不能凭字符数宣称口型/节奏通过。',colorGrade:c.colorGrade,delivery:'16:9横版、24fps设计母版；实际原生分辨率、编码、音轨格式与生成时长按小云雀/LibTV已验证入口锁定。保存真实素材/采用窗与剪辑余量；未输出不宣称已达交付规格。'},tests:c.tests.map(t=>({...t,shots:t.shots.map(id=>topic+'-'+id)})),handoff:{xiaoyunque:'以本题统一人物/资产ID和实际镜号建立任务清单；先核当前账号、模型、单次时长、画幅和参考槽位，再执行本片高风险测试组。每镜复制完整母稿，不能把上一节点状态当隐含上下文；长镜超限先回导演讨论，不能静默删动作或改切。未提交任务/未消耗积分。',libtv:'同母稿建立角色、场景、脚本和镜头说明节点，沿既定世界轴线连接；提示词、精确台词和整数帧采用窗同时交接。绘制图示为人工分镜说明，不冒称已导入画布、已生成媒体或模型必能读取整板；实际节点字段和revision需UI/工具读回。',unknowns:['账号/模型/额度与生成权限','超过当前平台单次上限的长镜实现方式','真实角色图/机械合成/声轨/动态接触','实际试剪、作者采用、媒体验收']}};
 await mkdir(resolve(base,'profiles','KD'),{recursive:true});const out=resolve(base,'profiles','KD',topic+'.json');await writeFile(out,JSON.stringify(profile,null,2));return buildProductionPackage(out);
}
