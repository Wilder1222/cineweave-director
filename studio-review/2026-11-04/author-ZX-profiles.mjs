// Source extraction and profile assembly. Creative parameters, frames and all six-role observations below are human-authored in ZX-decisions.mjs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {decisions} from './ZX-decisions.mjs';
import {buildProductionPackage} from './build-production-package.mjs';
const base=dirname(fileURLToPath(import.meta.url)),input=JSON.parse(await readFile(resolve(base,'ZX-authoring-input.json'),'utf8'));
const roles=['direction','performance','staging','cinematography','prompt','continuity'];
const criteria=['观众能区分本镜已见、人物转述与未知','台词和身体反应来自本镜刺激，保留各方自主选择','持物、接触、路径与终态在设计上可执行','构图、机位和光学目标服务本镜动作且不越轴','独立母稿的可见变化、角色和限制无相互冲突','时间省略、道具编号与后镜接口不重置'];
function patched(s,patches){for(const p of patches)s=s.replace(p.before,p.after);return s;}
function cardVisual(c,source){
 const [c1,c2,c3,c4,c5]=c.colors; const chars=c.characters.map((r,i)=>({id:'C'+(i+1),name:r[0],identity:r[1],costume:r[2],voice:r[3],prompt:`原创视觉候选，16:9单人物资产设计参考。${source.title}中的${r[0]}，${r[1]}，${r[2]}。${c.medium}。平视中性站姿与侧后转身同板，手指完整，衣料织纹在袖口可辨，人物不持未指定道具。基色限${c1}、${c2}、${c3}，面部皮肤自然，背景中性灰；光从${c.light}方向入射。固定面部比例、发际、衣领与鞋形，表情不神化，禁止美颜磨皮和身份换人；该板不声称已生成。`}));
 const assets=c.assets.map((r,i)=>({id:'A'+(i+1),name:r[0],prompt:`原创静态资产候选，16:9，${c.medium}。${source.title}，${r[0]}：${r[1]}。${c.world}。色彩${c1}为环境、${c2}为衣物/木质、${c3}为强调、${c4}为暗部、${c5}为纸/肤色亮部。${c.light}，保持真实遮挡与接触尺度，无陌生角色、无新增字、无额外机关；必要原文字样后期排版，完整物件不被景深吞没。`}));
 const fixed=[...c.locks,'所有外貌/空间数值均候选，未改现稿硬锁','仅使用本题具名角色与既有物件'];
 const tests=[
 ['人物近景',`${chars[0].prompt} 本测试只取胸像：${c.characters[0][0]}听到本题关键请求后先看受话人再作决定，眼神不向镜头。`,'仅比较同光位下半级主辅比','双眼和衣领身份稳定，受光侧与空间图一致','面孔替换、眼光反向或皮肤失去纹理'],
 ['空场景',`${assets[0].prompt} 清空演员，画出${c.anchors.map(a=>a[1]).join('、')}的互相遮挡和可达通道，机位在${c.cameraZone}。`,'仅比较环境暗部保留量','关键门/路/承托面可同图定位，既有通道不堵','门消失、家具漂移或通道变窄到不能转身'],
 ['材质特写',`16:9材质对照图，${c.material}；${c.medium}，在${c.light}下同时给正向及掠射受光样本。基色${c2}和${c3}分离，保留磨损方向，不加发光镀层。`,'仅比较织纹/划痕尺度','磨损与物件使用方向一致，亮暗都保留表面颗粒','塑料皮肤、金属变橡胶、木纹自流或强调色溢出'],
 ['内外转换',`${assets[0].prompt} 以同一${c.characters[0][0]}服装局部为校色物，比较${c.conversion}两种既有环境，展示并列参考，人物身份、材质、日夜顺序固定。`,'仅比较主光色温衔接幅度','服装相对色与肤色可追踪，日夜变化服从场次省略','外景突然白昼、衣色换材或暖光无源'],
 ['反打一致性',`${assets[0].prompt} 在${c.cameraZone}允许区画正向与反向两格空间草图；${c.world} 人物相对轴、道具在桌/路面的位置、${c.light}方向不镜像，保留${c.anchors.map(a=>a[1]).slice(0,3).join('、')}可识别边缘。`,'仅改变观察角，不移动世界锚点','反向仍能认同一出入口、光源与接触点，左右变化有世界解释','道具复制、光源左右翻转、角色从门外瞬移桌后']
 ];
 return {style:{medium:c.medium,rules:[c.form,c.world,'边缘随真实距离软化，人物和接触道具不做随意景深擦除','节奏按现稿实际镜号；演员先感受刺激再反应'],exclusions:['不添加群众、无台词说话人或新支线','不把矢量示意冒作生成成片','不以自动切镜解决长镜入口限制',...c.locks]},palette:[['P1','环境',c1,'环境主要面积，保留人物轮廓'],['P2','物件与服装',c2,c.material],['P3','强调',c3,c.accent],['P4','阴影',c4,'遮挡内部有层次，不压死接触'],['P5','亮部',c5,'纸/皮肤/反射，避免纯白剪裁']].map(([id,name,hex,use])=>({id,name,hex,use})),materials:[{id:'M1',asset:c.material,baseColor:c2,texture:'weave',description:c.material+'；织纹/粗糙反射按对象分别保留，布非金属、纸非布，冷光保留暖基色，掠射出现磨损而不全身镜面。',preserve:'现稿道具的断口、封口、折痕或使用痕迹必须逐镜对应'},{id:'M2',asset:c.assets.at(-1)[0],baseColor:c3,texture:'grain',description:c.assets.at(-1)[1]+'；局部旧痕颜色低于主体半级，接触边缘清楚，非自行发光。',preserve:c.accent}],lighting:[{id:'L1',sourceId:'WORLD_KEY',position:c.light,quality:'主光有源、柔边；道具接触区保留弱漫反射，光向连续',intent:'使人物看向对方的脸与触物的手先后可辨，不用全白光替代局部效果'},{id:'L2',sourceId:'WORLD_FILL',position:c.fill,quality:'环境低强度漫反射，不另设无源顶光',intent:'维持暗侧肤色和物件材质；保留世界源的明暗等级'}],characters:chars,assets,lookdev:tests.map((r,i)=>({id:'LD'+(i+1),target:r[0],prompt:r[1],fixed,compare:r[2],pass:[r[3]],fail:[r[4]]}))};
}
await mkdir(resolve(base,'profiles'),{recursive:true});
for(const [tid,c] of Object.entries(decisions)){
 if(process.argv[2]&&!tid.startsWith(process.argv[2])&&!process.argv.slice(2).includes(tid))continue;
 const src=input[tid];if(!src)throw Error('No source '+tid);
 const raw=await readFile(resolve(base,'studio-current',src.projectId,src.board+'.md'),'utf8');
 const script=src.scriptText, patches=[];
 for(const change of c.patches??[]){for(const [documentId,text] of [[src.script,script],[src.board,raw]]){
   if(!text.includes(change[0]))continue;
   if(text.split(change[0]).length!==2)throw Error('Nonunique '+tid+' '+change[0]);
   patches.push({documentId,before:change[0],after:change[1],reason:change[2]});
 }}
 const visual=cardVisual(c,src);
 const shots=src.shots.map((s,i)=>{
   const manual=c.shots[i];if(!manual||manual[0]!==s.id)throw Error('Authored shot map '+tid+' '+s.id);
   const [id,visible,prop,back,...obs]=manual;if(obs.length!==6)throw Error('Six hand-authored observations required '+tid+id);
   let block=patched(raw.split(/\r?\n/).slice(s.startLine-1,s.endLine).join('\n'),patches.filter(p=>p.documentId===src.board));
   const action=patched(s.action,patches.filter(p=>p.documentId===src.board));
   const match=s.camera.match(/^([^；，]+)[；，]([^。；]+)[。；]/u),scale=match?.[1]??'中景',position=match?.[2]??c.cameraZone;
   const co=s.camera.match(/前景([^；]+)；中景([^；]+)；后景([^。]+)。/u);
   const close=/细节|手部|桌面斜俯|俯角近景|机关近景/u.test(scale);
   const entry=c.entries?.[id]??(s.entry.startsWith('承接上一镜')?patched(src.shots[i-1].exit,patches):patched(s.entry,patches)),exit=c.exits?.[id]??patched(s.exit,patches);
   block=block.replaceAll(s.entry,entry);
   let focus=[{time:0,target:prop||'人物与道具工作区'}],type='static',techniqueId;
   if(s.focus){const m=s.focus.match(/起焦(.+?)；触发后转至(.+?)[，；]/u);if(m){let seconds=Number(s.constraint.match(/(?:暂定|建议).*?(\d+)秒/u)?.[1]??Math.round(s.duration*.55));seconds=Math.min(s.duration-1,seconds);focus=[{time:0,target:m[1]},{time:seconds,target:m[2]}];}}
   const camOverride=c.cameras?.[id]??{};
   let movement=s.motion||s.camera;
   if(s.motion&&!s.motion.startsWith('固定')){type='dolly';techniqueId='M01';}
   const camera={scale,position,height:s.camera.match(/高度：([^；。]+)/u)?.[1]??(/俯/u.test(position)?'工作面上方斜俯，具体高度由光学测试确定':'人物眼线；手部和道具同时可辨'),angle:/俯/u.test(position)?'斜俯':'平视或源机位明示俯角',axis:c.cameraZone,perspective:s.title, type,movement,trigger:s.trigger||c.triggers?.[id]||'由本镜行动/对白的实际刺激先触发，见完整稿',depth:'按本镜近中远实际层次配置，关键触物区不得被虚化掩盖；待光学样片',focus,...(techniqueId?{techniqueId,acceleration:'明确刺激后缓起，保留初始空间参照',peak:'同侧前移半步的低速段，有真实视差不变焦',deceleration:'出态前柔停，终点不越人物轴',framingChange:`初始${scale}在前移半步后略紧，${prop}与人物的占幅增加，既有${back}产生可辨纵深视差，终点不切掉关键触点`} :{}),...camOverride};
   const quotes=[...action.matchAll(/“([^”]*)”/gu)].map(m=>m[1]);
   const speakers=c.speakers?.[id]??[];if(quotes.length!==speakers.length)throw Error(`Dialogue mapping ${tid}-${id}: ${quotes.length} quotes vs ${speakers.length} names: ${quotes.join('|')}`);
   const dialogue=quotes.flatMap((text,j)=>speakers[j]==='-'?[]:[{speaker:speakers[j],text,addressee:c.addresses?.[speakers[j]]??'本镜在场受话人；具体以原文视线和关系为准',performance:c.performances?.[id]??'先接收对方刺激，再按句义回答；动作持续，沉默不抢原话，精确停顿待读演；不添加语气词'}]);
   const actors=visible?visible.split(',').map((n,j)=>({label:c.characters[Number(n)-1][0],x:visible.split(',').length===1?48:j===0?34:j===1?65:82,y:close?30:56,scale:close?.55:.9,pose:c.poses?.[id]?.[j]??(j===0?'面向画右；具体手序见完整稿':'面向画左；具体接触见完整稿')})):[];
   const frame=c.frames?.[id]??{background:c.colors[0],actors,props:prop?[{label:prop,x:close?23:20,y:close?48:75,width:close?58:60,height:close?28:9,shape:'rect'}]:[],layers:back?[{label:back,x:72,y:12,width:23,height:52,color:c.colors[1],opacity:.5}]:[]};
   const path='t2v：先以全文母稿作设计任务；真实入口能力/单段时长待核，不提交生成。若采用reference需先生成并审核本题资产，不把矢量示意当模型参考照片';
   const fullPrompt=`独立视频母稿｜${tid}《${src.title}》｜实际镜${id}｜${s.duration}秒设计预算，非实演。\n视觉媒介候选：${c.medium}；${c.form}\n角色稳定设定：${visual.characters.map(a=>a.name+'：'+a.identity+'；'+a.costume).join('。')}\n世界/光位候选：${c.world} ${c.light}；${c.fill}。\n硬锁：${c.locks.join('；')}。\n本镜明确入态：${entry}\n${block}\n调度补充（作者候选）：${c.notes?.[id]??'保持本镜完整动作相位与源台词，不增人物、持物和结局；人物/道具位置以本题空间与调度图为准。'}\n构图图示约定：${prop}；后景${back}。本镜明确出态：${exit}\n画面内必要文字按本镜准确内容后期确定性排版；禁止临时生成错误汉字。单镜结构和原焦点策略不静默改切，光学与表演均待测试。`;
   return {id,title:c.titles?.[id]??s.title,durationSeconds:s.duration,source:{documentId:src.board,startLine:s.startLine,endLine:s.endLine},prompt:fullPrompt,path,beat:c.titles?.[id]??s.title,purpose:s.title,entry,exit,camera,composition:{layout:close?'工作面斜线组织，关键物件完整落画':'人物分置画幅两侧、留视线和出入空间',foreground:co?.[1]??prop,midground:co?.[2]??visible.split(',').filter(Boolean).map(n=>c.characters[Number(n)-1][0]).join('与'),background:co?.[3]??back,negativeSpace:'留在本镜动作去向，不在无信息边缘堆装饰',visualHierarchy:prop+' → 在场人物的接收/反应 → '+back},frame,sound:s.sound+'；拟音逐动作对应实际触点，绝不把画外声升级为新角色出现。',transition:c.transitions?.[id]??(s.entry.includes('省略')||s.entry.includes('跳切')?'明确时间省略，先重建入态，保留环境声的时空边界':'按本镜出态停住再接下一镜，不重复取放已完成动作'),dialogue,reviews:Object.fromEntries(roles.map((role,j)=>[role,{status:'pass',criterion:criteria[j]+'；本镜核查点：'+obs[j],observation:obs[j]+'。这是当前文字/候选设计观察；真实媒体未验证。'}]))};
 });
 const p={schemaVersion:'cineweave-production-profile/v1',topicId:tid,title:src.title,revision:1,source:{projectId:src.projectId,scriptDocumentId:src.script,storyboardDocumentId:src.board,reviewDocumentId:src.review},patches,creative:{logline:c.logline,intent:c.intent,hardLocks:c.locks,assumptions:[c.medium,c.form,c.world,'角色年龄、外貌、服色、道具材质和距离均为本轮可撤销视觉候选，未自动获得作者采纳'],review:c.review},visual,space:{coordinate:'设计俯视平面：上北下南，左西右东；x/y为平面百分比，不是实测长度；各独立场景只在说明的跳切处转换。',anchors:c.anchors.map((a,i)=>({id:'A'+i,label:a[1],x:a[2],y:a[3],description:a[0]})),lights:[{id:'WORLD_KEY',label:'主光',x:c.key?.[0]??15,y:c.key?.[1]??12,targetX:50,targetY:50,description:c.light},{id:'WORLD_FILL',label:'环境返光',x:80,y:75,targetX:50,targetY:50,description:c.fill}],cameraZones:c.cameraZone,geography:c.world+' '+c.geography},blocking:c.characters.map((r,i)=>({character:r[0],task:c.blocking[i][0],path:c.blocking[i][1],gaze:c.blocking[i][2],props:c.blocking[i][3],residual:c.blocking[i][4]})),shots,audio:{fps:24,music:c.music??'对白、环境和关键动作声优先；前段不铺情绪弦乐，关键选择后允许极低单音持续质地，原话开始前降至不可遮字；末态保留场景余声，不用胜利收束。',subtitles:'逐句取 dialogue-cues.json准确文字；中文双行以内，称谓和省略标点与原文一致；本镜整窗只是计划容器，不冒充逐句同步。先实录读演，按波形对齐入出，再校口型；道具/UI字样独立确定性合成，未播台词不提前剧透。',colorGrade:c.grade??'以本题五色卡为显示意图，保护肤色、纸面和暗部触点；日夜与反打按世界光位匹配。魔法局部变化只作用既定对象，不整体改环境色。先灰卡/肤色/物件样片再锁LUT，未验证HDR或编码规格。',delivery:'导演母版16:9、24fps设计；实际分辨率、音频采样、编码、平台支持时长均待入口核验。对白/环境/拟音/音乐各独立轨及无字/字幕版本；此处没有实际媒体。'},tests:c.tests.map((r,i)=>({id:'T'+(i+1),shots:r[0].split(','),objective:r[1],fixed:[...c.locks,r[2]],input:tid+'指定镜头完整母稿与本题资产设计；仅测试'+r[1]+'，保留'+r[2]+'；先做最小样片再完整长镜，不提交付费任务。',pass:[r[3]],fail:[r[4]],stop:'每个单变量最多2个候选；出现硬锁破坏立即停止本组，定位责任字段回改，不用增加台词/切镜掩盖；未经用户生成授权不提交。'})),handoff:{xiaoyunque:`同母稿 ${tid}：先核当前账号与真实入口可用模型、参数schema、单段时长、reference能力和计费边界；不猜字段。准备 C/A 资产→五类LookDev→T测试组→按实际${shots.map(s=>s.id).join('/')}镜号建立任务，各任务贴完整独立母稿及源hash；素材通过后再选reference/i2v路径并绑定版本。长单镜预算有${Math.max(...shots.map(s=>s.durationSeconds))}秒，超限制先返导演，不能自动切镜。结果ID只查询不盲重试，下载后按六视角回流。`,libtv:`同母稿 ${tid}，画布先建来源/硬锁说明、角色C资产、场景/道具A、LookDev和测试任务，再按实际镜号各建分镜设计/视频待生成/音轨/字幕节点；节点以source-manifest与帧窗引用同一版本。能力/真实节点字段待UI或官方schema核验后填，不把设计HTML当实际视频节点产物。审核窗：资产→单变量试片→全镜媒体→试剪，未核媒体不连到最终采用轨；完整单镜结构保持。`,unknowns:['小云雀及LibTV当前登录、模型能力、真实入参/单段时长/消耗均未核','真实图像/视频/声音、角色稳定性、接触、光学、长镜节奏和试剪全未知','用户未采纳当前原创候选设计；不自动写入或覆盖Studio']}};
 const path=resolve(base,'profiles',tid+'.json');await writeFile(path,JSON.stringify(p,null,2),'utf8');
 const result=await buildProductionPackage(p);console.log(JSON.stringify(result));
}
