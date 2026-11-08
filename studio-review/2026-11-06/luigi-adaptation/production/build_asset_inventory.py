from season import load_episodes, episode_for_shot, shot_aliases
from pathlib import Path
from collections import defaultdict
import csv,html,json,re

ROOT=Path(__file__).resolve().parent
brief=(ROOT/'authoring-brief.md').read_text(encoding='utf-8')
cast=dict(re.findall(r'^- ([A-Z][A-Z0-9/-]+)：(.+)$',brief.split('## 空间世界锚点')[0],re.M))
scene_defs=dict(re.findall(r'^- ([A-Z][A-Z0-9/-]+)：(.+)$',brief.split('## 空间世界锚点')[1].split('## 官方适配')[0],re.M))
extra=json.loads((ROOT/'extra-roles.json').read_text(encoding='utf-8'))
eps=load_episodes()
aliases=shot_aliases(eps);broadcast=episode_for_shot(eps)
shot_count=sum(len(e['shots']) for e in eps)
dialogue_count=sum(len(s['dialogue']) for e in eps for s in e['shots'])
overlay_count=sum(len(s.get('overlay',[])) for e in eps for s in e['shots'])
usage=defaultdict(set);places=defaultdict(set);scene_times=defaultdict(set);scene_opening={}
all_shots={}
for e in eps:
    sm={s['id']:s for s in e['scenes']}
    for sc in e['scenes']:
        scene_times[sc['location']].add(sc['time']);scene_opening.setdefault(sc['location'],sc['script'].split('\n\n')[0])
    for sh in e['shots']:
        all_shots[sh['id']]=sh;places[sm[sh['sceneId']]['location']].add(sh['id'])
        for cid in sh['characters']:usage[cid].add(sh['id'])
        for cid in sh.get('extraRoleIds',[]):usage[cid].add(sh['id'])
for b in extra['bindings']:
    for spec in b['shots']:
        if ':' in spec:
            a,z=spec.split(':');ids=[a.split('SH')[0]+'SH'+f'{n:03}' for n in range(int(a.split('SH')[1]),int(z)+1)]
        else:ids=[spec]
        usage[b['role']].update(aliases[x] for x in ids if x in aliases)

rows=[]
def dep(*ids):return set().union(*(usage[x] for x in ids)) if ids else set()
def add(aid,cat,name,priority,required,continuity='',shots=None,source='',status='待制作/选定媒体'):
    refs=sorted({aliases[x] for x in (shots or []) if x in aliases})
    rows.append({'assetId':aid,'category':cat,'name':name,'priority':priority,'status':status,'required':required,'continuity':continuity,
      'episodes':','.join(sorted({broadcast[x] for x in refs})),'dependencyShots':len(refs),'shotRefs':','.join(refs),'source':source,'selectedMedia':''})

cards=[('style-card','风格卡'),('palette-card','配色卡'),('material-card','材质卡'),('lighting-card','灯光卡'),('light-plot','光位图'),('lookdev-test-board','LookDev矢量测试板')]
for cid,name in cards:add('DESIGN-'+cid,'视觉规则',name,'P0','沿用现有SVG/PNG设计；供人物、场景、色光沟通','不代表真实演员或材质样片',source='visual/'+cid+'.svg',status='已有矢量设计')
for aid,name in [('SKIN','混合光肤色样片'),('RED','深红针织样片'),('ORANGE','橙棉布及前铐样片'),('PAPER-METAL','纸件与金属高光样片')]:
    add('LOOKDEV-'+aid,'视觉实测',name,'P0','用实际人物/衣料/道具制作短测试；保存相邻镜对照','实际质感待观看，不能由设计卡代替')

core={
 'LUIGI':('路易吉',['LUIGI-STREET','LUIGI-ESCORT','LUIGI-DETENTION','LUIGI-RED','LUIGI-FORMAL']),
 'MARA':('玛拉',['MARA-WORK','MARA-HOME']),
 'HELEN':('海伦',['HELEN']),'NORA':('诺拉',['NORA']),'RACHEL':('瑞秋',['RACHEL']),
 'LENA':('莉娜',['LENA']),'VICTOR':('维克多',['VICTOR']),'ELLIE':('艾莉',['ELLIE'])}
core_ids={x for _,ids in core.values() for x in ids}
for cid,(name,ids) in core.items():
    refs=dep(*ids)
    add('IDENTITY-'+cid,'核心人物身份',name,'P0','中性正面近景、四分之三近景、全身比例；再按镜补侧背与持物','身份与服装分开；全身参考可与首套定妆复用',refs,'authoring-brief.md')
    add('VOICE-'+cid,'核心声线',name+'英语声线','P0','自然美式英语试读：平静、压力、低声；形成可复用干声基线','电话或屏幕版从同人声线衍生，中文译文不发声',refs,'audio/dialogue-cues.csv')
    for look in ids:
        detail=cast[look]
        if look=='MARA-HOME':detail='玛拉既定身份；米灰针织衫、深色长裤。家居服中不混入黑polo或灰围裙；灰风衣依场景单独叠穿。'
        add('LOOK-'+look,'核心服装',look,'P0','全身定妆、必要侧背面、关键手部；'+detail,
            '路易吉街装另分口罩戴/摘状态；押送前铐连腰链；红毛衣入席前解铐' if look.startswith('LUIGI') else '人物身份不随造型更换',dep(look),'authoring-brief.md')

character_aliases={'EDITOR-VOICE':'THOMAS','DOCTOR-PHONE-VOICE':'DOCTOR','STATE-JUDGE-OFFSCREEN-VOICE':'JUDGE-STATE','WARD-CHILD-VOICE':'CHILD-VOICE'}
defs={**cast,**extra['roles']}
for alias,target in character_aliases.items():usage[target].update(usage[alias])
skip=core_ids|set(character_aliases)|{'OFFICER-A/B','OFFICER-A','MARSHAL-DOOR'}
for cid,definition in defs.items():
    if cid in skip:continue
    onlyvoice=cid.endswith('-VOICE')
    if cid.endswith('-HAND'):
        add('SUPPORT-'+cid,'局部表演',cid,'P1',definition,'只准备所列手部与袖口，不补全身或人脸',dep(cid),'extra-roles.json')
        continue
    add(('VOICE-' if onlyvoice else 'SUPPORT-')+cid,'电话/画外声' if onlyvoice else '配角身份及声线',cid,
        'P0' if cid in ['WARD','COUNSEL','DOCTOR','HOST','JUDGE-STATE','JUDGE-FEDERAL','PROSECUTOR-STATE','PROSECUTOR-FEDERAL'] else 'P1',
        definition+('只准备声音母版和来源处理，不需要人物入场图。' if onlyvoice else '先主视图/全身工作造型，近景按需补；有对白者另留英语声线。'),
        'Thomas与EDITOR-VOICE同人；Doctor电话与画内同人；Ward/Rachel的儿子同一家庭角色' if cid in ['THOMAS','DOCTOR','CHILD-VOICE'] else '单集支持角色不必扩成核心人物同等视图库',dep(cid),'authoring-brief.md / extra-roles.json')
for aid,name,nums,need in [
 ('ARREST','抓捕警员A/B',[4,17],'两张独立身份；E04制服与E17证人面貌连续。'),
 ('ESCORT','押送警员组',[1,6],'左右两位主押送警员与必要背景；E01/E06同次行动复用。'),
 ('MARSHAL','候庭与押返法警',[9,23],'解铐手部/钥匙/皮套；与抓捕警员按职能区分，若非同角色不混脸。')]:
    refs={sid for sid in all_shots if int(sid[1:3]) in nums and any(x.startswith('OFFICER') for x in all_shots[sid]['characters'])}
    if aid=='MARSHAL':refs|=dep('MARSHAL-DOOR')
    add('SUPPORT-POLICE-'+aid,'执法配角',name,'P0',need,'源ID有合写/复用，制作时按镜号确定身份，不能自动认作同一个人',refs,'episodes/E04.json / E09.json / E17.json')

loc_names={'VISIT':'羁押会见室','CLINIC':'治疗中心','INSURER':'保险公司会议/质检工区','NEWSROOM':'新闻编辑部','COURT-STATE':'州法庭','MARA-HOME':'玛拉公寓','CAFE':'咖啡馆','COURT-FEDERAL':'联邦法庭','EXTERIOR':'法院外/城市街道','COURT-CORRIDOR':'候庭走廊','DINER':'快餐店内','HELEN-OFFICE':'海伦办公室','DOCK':'押送码头','HOTEL':'酒店街口','HOTEL-ROOM':'旅馆客房','PRISON':'监室','HOTEL-BREAKFAST':'酒店早餐厅','SERVER-OFFICE':'公司技术工区','STATION':'车站','POLICE':'警局','DINER-EXTERIOR':'快餐店外'}
high={'VISIT','CLINIC','INSURER','NEWSROOM','COURT-STATE','MARA-HOME','CAFE','COURT-FEDERAL','DINER','DOCK'}
for loc,refs in sorted(places.items(),key=lambda x:-len(x[1])):
    has_map=(ROOT/'maps'/f'{loc}.svg').exists()
    add('SCENE-'+loc,'场景母版',loc_names.get(loc,loc),'P0' if loc in high else 'P1',
        '主要方向建立图、实际反打/动作覆盖、需要的日夜光态；'+scene_defs.get(loc,scene_opening[loc]),
        '固定门窗/入口/轴线；不同子区域分别出图；'+('已有空间矢量图，真实场景母图待制作。' if has_map else '原清单漏项，需补母版与关系图。'),refs,
        'maps/'+loc+'.svg' if has_map else 'episodes/'+sorted(refs)[0][:3]+'.json')

def refs_for(*specs):
    refs=set()
    for spec in specs:
        if ':' in spec:
            a,z=spec.split(':');refs.update(a.split('SH')[0]+'SH'+f'{n:03}' for n in range(int(a.split('SH')[1]),int(z)+1))
        else:refs.add(spec)
    return refs
props=[
 ('CUFF','前铐/腰链/钥匙/皮套','前铐连接、开铐、收皮套、自由双手','E01-SH001:003','E06-SH001:005','E09-SH001:004'),
 ('BACKPACK','路易吉黑背包','背/置右脚旁/移走/打开/警局财物台','E03-SH005','E03-SH012','E04-SH006:010','E17-SH001:007'),
 ('MASK-ID','浅蓝口罩/假身份卡','戴→右手摘下留桌；卡交警员；不能恢复旧状态','E04-SH005:010'),
 ('NOTEBOOK','原笔记/复印件/旧样本','患者资料与本人书写、旧版与后续记录分开','E11-SH011:015','E16-SH007:014','E18-SH005:008'),
 ('MARA-FOLDER','玛拉蓝患者资料夹','拒赔/回执/授权/和解/支付/续批纸页依剧情入夹','E01-SH004:009','E08-SH001:006','E12-SH001:014'),
 ('HELEN-FOLDER','海伦蓝律师案卷夹','与玛拉蓝夹不同ID；州/联邦/宾州材料分堆','E05-SH001:009','E23-SH009:012'),
 ('NORA-BOOK','诺拉红本/黑手机/笔','采访、记录、划去猜测和核实版本连续','E08-SH008:012','E15-SH010:015','E21-SH001:003'),
 ('NORA-COPIES','诺拉蓝色工作副本夹','E08经授权取得的副本；不同于玛拉患者原件夹、海伦律师案卷夹，不互换文件','E08-SH005:009'),
 ('LENA-SET','莉娜灰信封/眼镜/工牌/双手机','工作与私人手机不同壳；暂停权限后不再成功登录','E10-SH001:008','E14-SH001:003','E14-SH012:014'),
 ('ELLIE-ART','艾莉画本/绿蜡笔/拼图/小袋','鸟、公交、鲸/改翅膀页，遮名、转面、改画逐版绘制','E07-SH007','E12-SH012:014','E13-SH001:008','E24-SH010'),
 ('RACHEL-FOLDER','瑞秋棕文件袋/家庭陈述纸','原稿、折回、展开，不换成公司宣传模板','E19-SH001:004','E22-SH008','E24-SH001'),
 ('COUNSEL-BAG','凯文黑文件包/夹板','不是路易吉背包；文件交接有持有人','E14-SH004:011','E21-SH001:003'),
 ('HOST-KIT','直播手机/稳定器/记者采访设备','自拍、拍母女、商品图、手机内播放分状态','E09-SH010:013','E13-SH004:007','E21-SH004'),
 ('VICTOR-KIT','平板/安保报价/招聘单','不同工作页及叠放顺序','E06-SH009:011','E15-SH007:009'),
 ('CASE-EVIDENCE','财物登记/不透明证物袋/证物外观','包、手机、笔记分登记；只需剧情外观与证据状态','E04-SH008:010','E17-SH001:007'),
 ('LIFE-KIT','杯碟/杯盖/托盘/房卡/车票/日历/信纸','按场景成套，关键落地/折信/签字动作另出局部','E02-SH005:011','E03-SH001:006','E24-SH011:012'),
 ('VEHICLES','直升机/押送车/必要警车','型号外观和开门态按场景冻结；押送车踏板/滑轨局部','E01-SH001:003','E06-SH001:005')]
for aid,name,need,*specs in props:add('PROP-'+aid,'道具及状态',name,'P0' if aid in ['CUFF','BACKPACK','MASK-ID','MARA-FOLDER','HELEN-FOLDER','ELLIE-ART'] else 'P1',need,'完整物件、必要正背/开合、关键手持局部，状态按镜号继承',refs_for(*specs),'review/asset-props-audio-audit.md')

graphics=[
 ('MEDICAL','拒赔/上传回执/附件/签名/复核工作页','统一日期、文件名、Q-17、签名及可见附件；E21前控制揭示'),
 ('DEFECT','缺陷报告/收悉回复/真实登录反证','旧报告、真实签名、医生可见清单和最终比对分版'),
 ('SETTLEMENT','和解初稿/修订/已签副本/监管作证例外','未签与已签、不同版本分别编号'),
 ('PAYMENT','银行到账/诊所付款/续批预约','过渡款与下一疗程不同日期；无永久批准界面'),
 ('HOLD','保留政策/暂停权限/保全裁定/执行确认','保全成功不等于已调取内容'),
 ('LEGAL','州/联邦/宾州法律文件','三类抬头、指控表、认罪权利、裁定、通知和量刑陈述分开'),
 ('MESSAGES','完整通信/私人信/授权书','保留本人不利句；私人信不是公开宣言'),
 ('SOCIAL','举报/定位/骚扰/声明/直播UI','原图、泄露、去身份、撤下或更正版'),
 ('SWEATER','红毛衣商品卡/销售直播画面','服装商品图独立，不误作法院证据'),
 ('NEWS','报道草稿/发布/反证/更正/最终稿','内容与署名/限定语连续；按发布时间分状态'),
 ('COMPANY','复核/个案结案/认证记录回应/纪念片草稿','复核不等于批准；家庭未签授权不改成已授权'),
 ('IDENTITY','虚构公司标识/工牌/纸件抬头/门牌','英语字形统一；州/联邦地点标识区别'),
 ('TITLES','片名/跨月字卡/结局说明/片尾','16:9安全区；按editorial/overlays.csv的实际时间窗')]
for aid,name,need in graphics:add('GRAPHIC-'+aid,'证据/后期平面',name,'P0' if aid in ['MEDICAL','DEFECT','SOCIAL'] else 'P1',need,'准确文字独立排版、贴屏/纸件合成；留空白跟踪底图',source='editorial/overlays.csv / episodes/')

for aid,name,need in [
 ('AMBIENCE','分场景环境床','河风旋翼、酒店车流、旅馆暖气、车站、餐厅设备、家居、诊所、办公室、编辑部、公司、咖啡馆、法院/走廊、会见室/监室'),
 ('FOLEY','关键动作拟音','铐链、开铐皮套、踏板车门、包拉链、纸笔夹扣、蜡笔、手机、门禁、钥匙、杯碟、折信'),
 ('EVENT','同次事件声底','E01/E06同次押送；E01/E02同次枪声/落杯，前后复用声底'),
 ('SOURCE-FX','电话/留言/直播/广播/电视处理','保留同人声线，按实际声源做带宽、压缩与空间处理'),
 ('EN-DIALOGUE',f'{dialogue_count}条英语对白录制/生成','保留准确原句；逐句实际时长、句尾和倾听余量校对'),
 ('INWORLD-MUSIC','少量场内音乐','E04-SH002店内声；当前不准备整季背景配乐')]:
    add('AUDIO-'+aid,'声音制作',name,'P0' if aid in ['AMBIENCE','SOURCE-FX','EN-DIALOGUE'] else 'P1',need,'文字声音设计已存在，实际音频尚待制作',source='audio/dialogue-cues.csv / episodes/')
for aid,name,need in [('SUBTITLE','英语/中文分离字幕',f'现有{len(eps)*2}份SRT是整句设计时窗；实际录音后分行分屏并重对齐'),('CONFORM','镜头接入与剪辑工程',f'视频、干声、电话屏幕声、环境、拟音分轨；{shot_count}镜按实际素材回填'),('GRADE','调色与贴屏模板','保持世界光位；红针织、橙棉布、肤色与纸白基准'),('DELIVERY','片头片尾/16:9交付模板','英语对白主轨、中文字幕、无字幕与分轨交付按最终用途导出')]:
    add('POST-'+aid,'后期模板',name,'P1',need,'依实际媒体进行，当前只有文字时间线/工作稿',source='editorial/timeline.csv / audio/')

assert len({r['assetId'] for r in rows})==len(rows)
with (ROOT/'asset-inventory.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
high_frequency=sum(len(places[x]) for x in ['VISIT','CLINIC','INSURER','NEWSROOM','COURT-STATE','MARA-HOME','CAFE','COURT-FEDERAL'])
registry={'scope':'asset_requirements_not_selected_media','sourceEpisodes':len(eps),'sourceShots':shot_count,'dialogueLines':dialogue_count,'overlayEvents':overlay_count,'coreIdentities':8,'coreBaseCostumes':13,'sceneCodes':len(places),'highFrequencySceneShots':high_frequency,
 'rows':rows,'note':'dependencyShots是依赖关系，含电话/画外及延续状态，不是人物画内计数；库存条目不等于图片或演员数量。'}
(ROOT/'asset-inventory.json').write_text(json.dumps(registry,ensure_ascii=False,indent=2),encoding='utf-8')
inventory_md=ROOT/'asset-inventory.md'
if inventory_md.exists():
    prose=inventory_md.read_text(encoding='utf-8')
    prose=re.sub(r'适用版本：\d+集、\d+镜',f'适用版本：{len(eps)}集、{shot_count}镜',prose)
    prose=re.sub(r'\d+镜不需要\d+套',f'{shot_count}镜不需要{shot_count}套',prose)
    prose=re.sub(r'现稿\d+镜',f'现稿{shot_count}镜',prose)
    prose=re.sub(r'分批制作\d+镜',f'分批制作{shot_count}镜',prose)
    prose=re.sub(r'前8个高频场景共\d+镜，约占\d+%',f'前8个高频场景共{high_frequency}镜，约占{high_frequency/shot_count:.0%}',prose)
    speakers=len({q['speaker'] for e in eps for s in e['shots'] for q in s['dialogue']})
    prose=re.sub(r'已有\d+条英语对白cue；\d+种speaker标签含同人的电话/留言/直播别名，不能据此准备\d+个互不相关的新声线',f'已有{dialogue_count}条英语对白cue；{speakers}种speaker标签含同人的电话/留言/直播别名，不能据此准备{speakers}个互不相关的新声线',prose)
    prose=re.sub(r'\d+份起态提示词',f'{shot_count}份起态提示词',prose)
    prose=re.sub(r'一次生成\d+张首图',f'一次生成{shot_count}张首图',prose)
    prose=re.sub(r'现有\d+条overlay',f'现有{overlay_count}条overlay',prose)
    prose=re.sub(r'\d+个叠加实例',f'{overlay_count}个叠加实例',prose)
    inventory_md.write_text(prose,encoding='utf-8')

H=html.escape
body=''.join(f'<tr data-category="{H(r["category"])}" data-priority="{r["priority"]}"><td><b>{H(r["assetId"])}</b><br>{H(r["name"])}</td><td>{H(r["category"])}<br>{r["priority"]}<br>{H(r["status"])}</td><td>{H(r["required"])}<p>{H(r["continuity"])}</p></td><td>{H(r["episodes"])}<details><summary>{r["dependencyShots"]}个依赖镜</summary>{H(r["shotRefs"])}</details></td></tr>' for r in rows)
cats=''.join(f'<option>{H(c)}</option>' for c in dict.fromkeys(r['category'] for r in rows))
page=f'''<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>拒赔 · 资产准备清单</title><style>
body{{margin:0;background:#f4f1e9;color:#263039;font:16px/1.75 'Segoe UI','Microsoft YaHei',sans-serif}}main{{max-width:1250px;margin:auto;padding:36px}}h1{{font-size:36px}}a{{color:#6b2933}}.metrics{{display:flex;gap:14px;flex-wrap:wrap}}.metric{{background:#fffdf8;padding:16px 24px;border:1px solid #d4cec0}}input,select{{font:inherit;padding:8px;margin:5px}}input{{min-width:320px}}table{{width:100%;border-collapse:collapse;background:#fffdf8}}th,td{{text-align:left;padding:14px;vertical-align:top;border-bottom:1px solid #ddd7ca}}th{{position:sticky;top:0;background:#35444e;color:white}}td:first-child{{width:19%;overflow-wrap:anywhere}}td:nth-child(2){{width:14%}}td:nth-child(3){{width:47%}}td:nth-child(4){{width:20%;overflow-wrap:anywhere}}p{{margin:6px 0;color:#56636b}}summary{{cursor:pointer}}nav a{{display:inline-block;margin-right:18px}}.note{{padding:16px;border-left:4px solid #6b2933;background:#e8e4dc}}@media(max-width:700px){{main{{padding:15px}}table{{font-size:13px}}th,td{{padding:7px}}input{{min-width:200px}}}}</style>
<main><h1>《拒赔》资产准备清单</h1><nav><a href="asset-inventory.md">完整梳理</a><a href="asset-inventory.csv">执行表CSV</a><a href="storyboard.html">优化剧本与分镜总览</a><a href="reference-and-style.html">美剧参考、口语与调色</a><a href="index.html">完整制作包</a><a href="asset-cards.md">现有资产提示词</a></nav>
<p>16:9横屏 · 英语对白/中文对照 · 依据{len(eps)}集{shot_count}镜。条目是制作需求，不代表图片、声线或演员的数量。</p>
<div class="metrics"><div class="metric"><b>8</b> 核心身份</div><div class="metric"><b>13</b> 核心基础服装</div><div class="metric"><b>{len(places)}</b> 场景编码</div><div class="metric"><b>{dialogue_count}</b> 英语对白cue</div><div class="metric"><b>{overlay_count}</b> 已排叠加事件</div></div>
<p class="note">已有文字/矢量设计；实际人物场景母图、声音、视频待制作。先做核心身份和服装，再做8个高频场景（{high_frequency}镜、约{high_frequency/shot_count:.0%}），用押送/抓捕/红毛衣出庭小样核对连续性。P0=先准备，P1=按场次跟进。</p>
<input id="q" placeholder="搜人物、物件、场景或镜号" oninput="filterRows()"><select id="category" onchange="filterRows()"><option value="">全部类别</option>{cats}</select><select id="priority" onchange="filterRows()"><option value="">全部优先级</option><option>P0</option><option>P1</option></select><span id="count"></span>
<table><thead><tr><th>资产</th><th>类别/顺序/状态</th><th>准备内容与连续性</th><th>适用集/镜</th></tr></thead><tbody>{body}</tbody></table><p>依赖镜号含电话、画外与连续性状态，不能拿来当画内演员人数。原制作号的证据与道具链来源见<a href="review/asset-props-audio-audit.md">前轮资产审计</a>；当前镜数和映射以本页及当前{len(eps)}集总览为准。</p></main>
<script>function filterRows(){{let q=document.querySelector('#q').value.toLowerCase(),c=document.querySelector('#category').value,p=document.querySelector('#priority').value,n=0;document.querySelectorAll('tbody tr').forEach(r=>{{let show=(!q||r.innerText.toLowerCase().includes(q))&&(!c||r.dataset.category===c)&&(!p||r.dataset.priority===p);r.hidden=!show;if(show)n++}});document.querySelector('#count').textContent=n+' 条'}}filterRows();</script></html>'''
(ROOT/'asset-inventory.html').write_text(page,encoding='utf-8')
print(json.dumps({'inventoryRows':len(rows),'coreIdentities':8,'coreBaseCostumes':13,'sceneCodes':len(places),'highFrequencySceneShots':registry['highFrequencySceneShots'],'selectedMedia':0}))
