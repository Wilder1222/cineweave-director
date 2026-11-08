// UV-only authored decisions. Parsing below extracts exact source fields; it is not a semantic reviewer.
import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildProductionPackage} from './build-production-package.mjs';
const base=dirname(fileURLToPath(import.meta.url));
const roles=['direction','performance','staging','cinematography','prompt','continuity'];
const criteria=['该镜必须传递本题指定的观众信息而不预支后果','行动由角色收到的刺激和当前任务触发','走位与持物接触在该镜真实空间中可达','机位/焦点服务本镜信息且继承既定轴线','独立视频稿保留准确台词和该镜必要初终态','本镜出态能按所述转场接入后镜'];
const configs={};
function role(id,name,identity,costume,voice){return{id,name,identity,costume,voice};}
function shot(id,purpose,notes,dialogue=[],options={}){return{id,purpose,notes,dialogue,...options};}
function pairFrame(names,props=[],wide=false){return{background:'#d7d9d0',actors:names.map((n,i)=>({label:n,x:30+i*42,y:wide?55:59,scale:wide?.8:1,pose:i?'面向对手，接收后行动':'面向对手，动作依本镜正文'})),props:props.map((n,i)=>({label:n,x:12+i*25,y:75,width:22,height:9})),layers:[{label:'本镜实际背景/通路',x:78,y:15,width:16,height:55,color:'#b1b8ab',opacity:.45}]};}
function propFrame(labels){return{background:'#d7d9d0',props:labels.map((label,i)=>({label,x:10+i*27,y:40+(i%2)*15,width:23,height:20,shape:i%2?'circle':'rect'})),layers:[{label:'真实支撑面',x:0,y:70,width:100,height:30,color:'#a99c80',opacity:.6}]};}
function parseShots(text,topic){
 const lines=text.split(/\r?\n/),starts=[];for(let i=0;i<lines.length;i++)if(lines[i].startsWith('## '+topic+'-'))starts.push(i);
 return starts.map((start,i)=>{let end=i+1<starts.length?starts[i+1]:lines.findIndex((x,j)=>j>start&&x.startsWith('## 逐镜时间表'));if(end<0)end=lines.length;const block=lines.slice(start,end),line=prefix=>block.find(x=>x.startsWith(prefix))?.slice(prefix.length).trim()??'';const header=block[0].slice(3),id=header.split('｜')[0].replace(topic+'-','');
  const budget=line('预算').match(/^(\d+(?:\.\d+)?)秒/u),headingRange=header.match(/｜(\d+(?:\.\d+)?)–(\d+(?:\.\d+)?)秒/u);const duration=budget?Number(budget[1]):headingRange?Number(headingRange[2])-Number(headingRange[1]):NaN;
  const init=block.find(x=>x.startsWith('镜'+id+'：')||x.startsWith('镜'+topic+'-'+id+'，入态：')||x.startsWith('镜'+id+'，入态：'))??'';const entry=init.includes('入态：')?init.split('入态：').slice(1).join('入态：'):'';
  const action=line('行动与完整对白：')||line('行动与原对白：');const camera=line('摄影：');const sound=line('声音：');const title=init.includes('。入态：')?init.slice(init.indexOf('：')+1,init.indexOf('。入态：')):'';
  return{id,title,entry,exit:line('出态：'),action,camera,sound,duration,source:{startLine:start+1,endLine:end},raw:block.join('\n')};
 });
}
function quotedPatches(docs,patches){return patches.flatMap(p=>{const result=[];for(const d of docs){if(!p.kinds.includes(d.kind))continue;if(d.text.includes(p.before))result.push({documentId:d.id,before:p.before,after:p.after,reason:p.reason});}return result;});}

export async function authorUv(topic){
 const c=configs[topic];if(!c)throw Error('No manually reviewed UV configuration: '+topic);
 const dirs=await readdir(resolve(base,'studio-current'));let index,dir;for(const id of dirs){try{const x=JSON.parse(await readFile(resolve(base,'studio-current',id,'index.json'),'utf8'));if(x.topicId===topic){index=x;dir=resolve(base,'studio-current',id);break;}}catch{}}
 if(!index)throw Error('Missing UI source');const current=index.documents.filter(d=>d.title.includes('20261031'));
 const pick=kind=>current.find(d=>kind==='script'?d.title.includes('｜剧本｜'):kind==='board'?d.title.includes('｜分镜与视频提示｜'):d.title.includes('｜审阅与来源｜'));
 const sd=pick('script'),bd=pick('board'),rd=pick('review');if(!sd||!bd)throw Error('Current authored source selection missing: '+topic);
 const st=await readFile(resolve(dir,sd.file),'utf8'),bt=await readFile(resolve(dir,bd.file),'utf8');const parsed=parseShots(bt,topic);if(parsed.length!==c.shots.length)throw Error(topic+' actual source shot count differs from authored decisions');
 const patches=quotedPatches([{kind:'script',id:sd.documentId,text:st},{kind:'board',id:bd.documentId,text:bt}],c.patches??[]);
 for(const p of c.patches??[])if(!patches.some(x=>x.before===p.before))throw Error(topic+' authored patch not found');
 const characters=c.characters.map(ch=>({...ch,prompt:`16:9横幅、写实电影角色设计资产、原创外貌候选未获采纳。${ch.name}：${ch.identity}。当前服化道：${ch.costume}。中性站姿，正面与三分之四侧面各占独立画面区域，面部比例与衣料结构清楚，背景为低细节中性灰，不出现其他人、文字或商标；身份不借用未提供的演员/参考脸。自然皮肤微差异，衣料纹理符合实际尺度，眼睛与手部结构清楚，不把角色处境情绪固定成永久外貌。` }));
 const assets=c.assets.map(a=>({...a,prompt:`16:9横幅，写实电影美术资产，${c.title}的${a.name}。${a.description}。${c.space.geography}。光源遵循${c.lights.map(l=>l.id+' '+l.description).join('；')}；显示实际物件结构、表面和支撑关系，不加入人物、额外门窗/道具或文字，需精确字迹者保留干净载体供后期排版。此图为待生成原创设计候选，不冒称实物照片或已绑定媒体。`}));
 const baseline=`16:9横幅，写实电影感来自可见空间/表演/物理光而非名人风格。场景：${c.space.geography}。人物外貌与服装：${characters.map(x=>x.name+'，'+x.identity+'，'+x.costume).join('；')}。光源：${c.lights.map(l=>l.id+' '+l.description).join('；')}。主配色：${c.palette.map(x=>x.name+x.hex+'用于'+x.use).join('；')}。人物列表只定义身份，不要求所有人都入画；实际画内人物和物件以本镜取景为准，画外继承不称为已经看见。不增加第三出镜角色或未锁定景物。`;
 const lookdev=[
  {id:topic+'-LD1',target:'人物近景',prompt:baseline+`选择${characters[0].name}正面和3/4侧面同尺寸近景对照；保留眼线和皮肤细节，服饰及光向不变，另一角色不入画。`,fixed:['同一人物身份与当前服化道','同一相机高度与曝光意图','无新增饰物'],compare:'正面/3/4侧面受光与肤色',pass:['五官比例和服装接缝可追踪','高光未吞皮肤纹理，暗部不抹平眼睛'],fail:['身份改变/额外饰物','皮肤漂白或同一光下色偏跳动']},
  {id:topic+'-LD2',target:'场景空镜',prompt:baseline+'空场无人，完整呈现命名门窗/通道/支撑面与世界光源。不要改变位置或镜像房间。保留本片关键动作发生区可读。',fixed:['唯一世界坐标与命名锚点','场景与关键道具数量','无人物'],compare:'近景/广角覆盖同一空间',pass:['出入口与可达路径同图闭合','灯位与阴影一致'],fail:['反打时门窗交换','新增通道或道具挡住本片动作']},
  {id:topic+'-LD3',target:'材质',prompt:baseline+`无人物材质设计板，分别独立特写${c.materials.map(m=>m.asset+'：'+m.description).join('；')}，每格沿本片同一实际光源照明，不把设计标签烧进画面。`,fixed:['资产ID与基色','同一主光','纹理比例与物件尺寸'],compare:'同光下近看表面与相邻材质分离',pass:['粗糙/光滑表面反光有区分','织纹/裂缝没有超出物件真实尺度'],fail:['所有材质同样塑料高光','纹理游动/金属透光/玻璃变实心']},
  {id:topic+'-LD4',target:'内外/明暗转换',prompt:baseline+c.transitionTest,fixed:['人物身份与服装','世界光源位置','曝光起点及物件状态'],compare:'本片既有明暗区之间的受光响应',pass:['肤色与衣料仍属于同一对象','转换由实际路径/光源造成而非场景替换'],fail:['身份随亮度变化','阴影翻向或无动机变昼夜']},
  {id:topic+'-LD5',target:'同轴不同机位/反打一致性',prompt:baseline+`分别从本片已选轴线同侧的两处机位看${characters.map(x=>x.name).join('与')}和关键道具；保持世界门窗/灯源不动、演员位置不动，画面左右变化服从真实机位。不要额外创造新叙事镜头。`,fixed:['世界门窗/道具/灯位','人物位置和持物手','相邻出入状态'],compare:'本片现有机位之间的空间/身份/光色',pass:['同一光源在人物世界侧一致','道具持有和视线相接'],fail:['换脸/换衣/房间镜像','切换后物件瞬移或光源换边']}
 ];
 const shots=parsed.map((s,i)=>{const m=c.shots[i];if(m.id!==s.id)throw Error(topic+' source shot order mismatch '+s.id);if(!Array.isArray(m.notes)||m.notes.length!==6||m.notes.some(x=>!x))throw Error('Six actual semantic observations required: '+topic+s.id);let focus=m.focus??[{time:0,target:m.focusTarget}];const duration=s.duration;
  const camera={scale:m.scale??c.defaultScale??'中景',position:m.position??s.camera,height:m.height??'人物眼线或本镜已写明的接触面高度',angle:m.angle??'按源稿所述俯仰和地标观看，不改变世界关系',axis:c.axis,perspective:m.perspective??m.purpose,type:m.type??'static',movement:m.movement??'摄影机固定在源稿本镜机位；人物和道具按正文行动，焦点策略不以假运镜替代',trigger:m.trigger??m.purpose,depth:m.depth??'按源稿保留本镜关键人物/道具的真实不同深度关系；实际景深待样片',focus,...(m.type&&m.type!=='static'?{techniqueId:m.techniqueId,motionStart:m.entry??s.entry,motionEnd:m.exit??s.exit,acceleration:m.acceleration,peak:m.peak,deceleration:m.deceleration,framingChange:m.framingChange}:{}),...(m.focusMode?{focusMode:m.focusMode}:{})};
  const composition={layout:m.layout??'服从本镜源稿机位，保留对手关系与关键物接触，不跨轴',foreground:m.foreground??m.props?.join('、')??'本镜已写明的关键物/支撑面',midground:m.midground??characters.map(x=>x.name).join('与'),background:m.background??c.background,negativeSpace:m.negativeSpace??'为本镜视线/动作方向保留空间，不加入新叙事对象',visualHierarchy:m.hierarchy??m.purpose};
  const total=m.dialogue.reduce((n,x)=>n+x[1].length,0);let t=duration*.12;const max=duration*.76;const cues=m.dialogue.map(x=>{const len=total?max*x[1].length/total:0;const q={speaker:x[0],text:x[1],addressee:x[2]??characters.find(y=>y.name!==x[0])?.name??'对手/画外单侧电话',performance:x[3]??'依本镜具体任务自然说出，收到对手刺激后再回应，不改变字句',startSeconds:Number(t.toFixed(2)),endSeconds:Number((t+len).toFixed(2))};t+=len;return q;});
  let fragment=s.raw;for(const patch of patches.filter(x=>x.documentId===bd.documentId))if(fragment.includes(patch.before))fragment=fragment.replace(patch.before,patch.after);
  // Audit source remains in storyboard-master; copying starts at this shot's explicit current state.
  const fragmentLines=fragment.split('\n');const shotStart=fragmentLines.findIndex(x=>x.startsWith('镜'+s.id+'：')||x.startsWith('镜'+topic+'-'+s.id+'，')||x.startsWith('镜'+s.id+'，'));
  if(shotStart<0)throw Error('Explicit shot-state line missing: '+topic+s.id);
  fragment=fragmentLines.slice(shotStart).filter(x=>!x.startsWith('预算')&&!x.startsWith('机位高度：')).join('\n');
  const local=c.shotBaselines?.[s.id];
  let currentBaseline=baseline;
  if(local?.light)currentBaseline=currentBaseline.replace('光源：'+c.lights.map(l=>l.id+' '+l.description).join('；')+'。','本镜当前光源：'+local.light+'。');
  if(local?.scene)currentBaseline=currentBaseline.replace('场景：'+c.space.geography+'。','本镜当前空间：'+local.scene+'。');

  return{id:topic+'-'+s.id,title:m.purpose,durationSeconds:duration,source:{documentId:bd.documentId,...s.source},prompt:currentBaseline+'\n\n本镜设计总时长'+duration+'秒，动作与对白连续发生，不使用未声明的时间省略。\n'+fragment,path:'t2v中文完整母稿；身份/场景图仅作待生成资产，实际选定参考输入前不声称已绑定',beat:m.purpose,purpose:m.purpose,entry:m.entry??s.entry,exit:m.exit??s.exit,camera,composition,frame:m.frame??(m.propsOnly?propFrame(m.props):pairFrame(characters.map(x=>x.name),m.props,Boolean(m.wide))),sound:m.sound??s.sound+'；'+c.sound,transition:m.transition??(i?'连续承接前镜；以本镜已写明的行动/出态硬切；未声明省略时不重演前镜':'从本片真实初态开始，建立空间后继续'),dialogue:cues,reviews:Object.fromEntries(roles.map((r,j)=>[r,{status:'pass',criterion:criteria[j]+'：'+m.purpose,observation:m.notes[j],sourceLocator:bd.documentId+':L'+s.source.startLine+'–L'+s.source.endLine}]))};
 });
 const profile={schemaVersion:'cineweave-production-profile/v1',topicId:topic,title:c.title,revision:1,source:{projectId:index.projectId,scriptDocumentId:sd.documentId,storyboardDocumentId:bd.documentId,...(rd?{reviewDocumentId:rd.documentId}:{})},patches,creative:{logline:c.logline,intent:c.intent,hardLocks:c.hardLocks,assumptions:['以下角色外貌/服化道、色卡、物件材质和可达平面坐标是本轮原创可撤销视觉候选，未自动获作者批准。','所有镜头沿当前实际镜号和时长，不把平台时长限制暗中改成切镜；真实生成入口仍待核。'],review:c.review},visual:{style:{medium:'写实真人电影短片；超自然效果只在本题明确层发生',rules:c.styleRules,exclusions:c.exclusions},palette:c.palette,materials:c.materials,lighting:c.lights.map(l=>({id:l.id,sourceId:l.id,position:l.description,quality:l.quality,intent:l.intent})),characters,assets,lookdev},space:{...c.space,lights:c.lights},blocking:c.blocking,shots,audio:{fps:24,music:c.music??'不铺满音乐；以实际环境、对手反应和关键动作声组织。若加音乐，只在对白留白低动态进入，关键接触/准确对白前让位，未经听审不宣称混音通过。',subtitles:'按dialogue-cues.json逐句准确台词后期确定性排版；设计窗仅按作者预排顺序分配，未实测配音；回流后重测再锁字幕/口型，不强行加速或改字。',colorGrade:c.colorGrade,delivery:'16:9与24fps是本轮设计意图。原始输出像素/编码/时长档位与模型能力按实际入口核验；保留源素材及采用前后余量，不称已达到某输出规格。'},tests:c.tests.map(t=>({...t,shots:t.shots.map(id=>topic+'-'+id)})),handoff:{xiaoyunque:'统一角色/资产ID和实际镜号，每镜建立独立待生成任务节点；先按高风险测试组核验文本路径与当前账号模型支持、单次时长/画幅/参考槽位。每条复制下列完整母稿，不把节点标题当提示词，不实际提交或消费。长镜若不支持，停在能力待核，先提导演备选而非自动切镜。',libtv:'同一镜号建立脚本/资产/分镜说明节点，连接节拍和同一空间/角色基线；完整视频母稿及G5采用窗口一并交接。示意板只作人工构图说明，不宣称模型能解析整板。未确认项目/节点字段与入口前不猜API参数或已导入状态。',unknowns:['账号实际模型/额度与权限','每镜长时段是否被当前入口支持','图像/参考/声音输入槽与格式','真实媒体、口型/声音/接点与试剪']}};
 await mkdir(resolve(base,'profiles','UV'),{recursive:true});const path=resolve(base,'profiles','UV',topic+'.json');await writeFile(path,JSON.stringify(profile,null,2));return await buildProductionPackage(path);
}

export {configs,role,shot,pairFrame,propFrame};
