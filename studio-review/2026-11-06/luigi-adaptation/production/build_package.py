from pathlib import Path
import csv, hashlib, html, json, math, re, textwrap, zipfile
from visual_direction import STYLE, LOOKS, AMBIENCE, look_for, scene_environment, build_visual_cards
from season import write_assembled, shot_aliases
from generation_plan import segments_for

ROOT = Path(__file__).resolve().parent
FPS = 24
for folder in ['scripts','prompts','boards','visual','maps','audio','editorial','requests','review']:
    (ROOT/folder).mkdir(exist_ok=True)
BRIEF = (ROOT/'authoring-brief.md').read_text(encoding='utf-8-sig')
CAST = dict(re.findall(r'^- ([A-Z][A-Z0-9/-]+)：(.+)$', BRIEF.split('## 空间世界锚点')[0], re.M))
SCENES = dict(re.findall(r'^- ([A-Z][A-Z0-9/-]+)：(.+)$', BRIEF.split('## 空间世界锚点')[1].split('## 官方适配')[0], re.M))
EXTRA=json.loads((ROOT/'extra-roles.json').read_text(encoding='utf-8'))
EXTRA_BINDINGS={}
for binding in EXTRA['bindings']:
    for spec in binding['shots']:
        if ':' in spec:
            start,end=spec.split(':');prefix=start.split('SH')[0]+'SH'
            ids=[prefix+f'{n:03}' for n in range(int(start.split('SH')[1]),int(end)+1)]
        else:ids=[spec]
        for sid in ids:EXTRA_BINDINGS.setdefault(sid,[]).append(binding['role'])
COLORS = ['#556774','#c8c9c4','#a5795b','#262b31','#e8e4dc','#6b2933','#d57238','#698376']
H = html.escape
def save(path, text):
    (ROOT/path).parent.mkdir(parents=True,exist_ok=True)
    if (ROOT/path).exists() and (ROOT/path).read_text(encoding='utf-8')==text:return
    (ROOT/path).write_text(text,encoding='utf-8')
def jwrite(path,obj): save(path,json.dumps(obj,ensure_ascii=False,indent=2))
def short(s,n=110): return s if len(s)<=n else s[:n]+'…'
def char_desc(cid,shot_id=''):
    if cid in EXTRA['roles']:return EXTRA['roles'][cid]
    ep=int(shot_id[1:3]) if re.match(r'E\d\d-',shot_id) else 0
    sn=int(shot_id.split('SH')[-1]) if 'SH' in shot_id else 0
    if cid.startswith('LUIGI'):
        base=CAST['LUIGI-STREET'].split('；')[0]
        looks={
          'LUIGI-STREET':'深炭灰连帽夹克、黑直筒裤、灰运动鞋。黑布背包为独立道具，按本镜起态与动作确定在脚边、肩上或由警方持有，不能因服装描述自动背回身上。',
          'LUIGI-ESCORT':'橙色连体囚服、灰运动鞋、双腕在身前铐住并连腰链，背包不在身上；前铐不得移至背后。',
          'LUIGI-DETENTION':'浅灰长袖囚服、炭灰裤；会见时腕部自由，固定桌两人同坐，无隔断玻璃。',
          'LUIGI-RED':'深红圆领针织毛衣、露出白色衬衫领、深灰裤；腕铐依本镜明确起态和解铐动作执行。',
          'LUIGI-FORMAL':'深蓝西装、白衬衫、无领带，面容略显疲惫但年龄外观不突变。'}
        mask=''
        if cid=='LUIGI-STREET':
            mask='戴浅蓝医用口罩。' if ep==3 or (ep==4 and sn<=5) else '不戴口罩。'
            if ep==4 and sn==5:mask='起始戴浅蓝医用口罩，本镜按动作亲手摘下，之后不再戴上。'
        return base+'；'+looks.get(cid,looks['LUIGI-DETENTION'])+mask+'声音中低、清楚克制。'
    if cid=='MARA-HOME':return CAST['MARA-WORK'].split('，黑色polo')[0]+'；米灰针织衫、深色长裤。声音中音，快而实在，对孩子放缓。'
    if cid in CAST:return CAST[cid]
    if cid.startswith('OFFICER'):return '成年警员'+cid[-1]+'，深蓝制服、防护背心；人物位置和职务按本镜起态执行，不自行增加同伴。'
    return cid+'；形象仍需在角色母稿补齐。'
def secstamp(s,sep=','):
    ms=round(s*1000); return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'
def svgtext(x,y,text,size=18,fill='#263039',width=42,leading=None):
    lines=[]
    for para in str(text).split('\n'):
        lines.extend(textwrap.wrap(para,width=width,break_long_words=True,break_on_hyphens=False) or [''])
    return '<text x="%s" y="%s" fill="%s" font-size="%s" font-family="Microsoft YaHei,Segoe UI,sans-serif">%s</text>'%(x,y,fill,size,''.join('<tspan x="%s" dy="%s">%s</tspan>'%(x,0 if i==0 else (leading or size*1.65),H(line)) for i,line in enumerate(lines)))
def svgwrap(body,w=1200,h=760):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><linearGradient id="cold"><stop stop-color="#7791a3"/><stop offset="1" stop-color="#d6d7d0"/></linearGradient><linearGradient id="warm"><stop stop-color="#b0805a"/><stop offset="1" stop-color="#e8d9c4"/></linearGradient><pattern id="knit" width="8" height="10" patternUnits="userSpaceOnUse"><path d="M0 0L4 5L0 10M8 0L4 5L8 10" fill="none" stroke="#a67278" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="#f4f1e9"/>{body}</svg>'
def head(title,sub):return svgtext(42,55,title,29,width=60)+svgtext(42,91,sub,14,'#68727a',width=92)
def figure(x,y,scale=1,color='#556774'):
    return f'<g transform="translate({x},{y}) scale({scale})"><circle cy="-25" r="12" fill="{color}"/><path d="M-20 0Q0-15 20 0L15 42H-15Z" fill="{color}"/><path d="M-8 42L-12 75M8 42L12 75M-20 0L-28 30M20 0L28 30" stroke="{color}" stroke-width="8" fill="none" stroke-linecap="round"/></g>'
def visual_cards():
    build_visual_cards(save, svgtext, svgwrap, head, figure)


def scene_maps():
    asset=['# 资产与场景母稿\n\n所有图像为待生成的独立母稿，不声称已选脸/已上传。人物用原创演员造型，严格真人参考另核目标入口。\n']
    for cid,desc in {**CAST,**EXTRA['roles']}.items():
        if cid.endswith('-VOICE'):
            asset += [f'## {cid} · 声音选角\n\n{desc}\n\n自然美式英语；按逐镜准确原句、受话者和语气试读。无指定真人声纹，不代表已录音或已绑定声音资产。\n']
        else:asset += [f'## {cid}\n\n```text\n16:9写实人物造型设计，灰白无缝背景，正面和三分之二侧面分开生成，不拼入陌生人。{char_desc(cid)} 展示头部至膝、自然站立、双手可读、柔和中性光、衣料原始纹理；无可读姓名牌、无字幕、水印。作为原创演员外观设计，不生成新闻摄影拼贴。\n```\n']
    for sid,desc in SCENES.items():
        asset += [f'## 场景 {sid}\n\n```text\n16:9写实影视场景设计，无主角遮挡关键出入口。{desc} 按世界北向建立门窗、道路或桌椅关系，真实材质、可通行摄影机位置、保留高光与暗部信息；空白屏幕与纸张留作后期排字，无额外标语。\n```\n']
        b=head('G2 · '+sid,'俯视关系示意 · N↑ · 非实测三维 · 完整锚点在下方')
        b+='<rect x="160" y="145" width="810" height="350" fill="#e2ded3" stroke="#52616d" stroke-width="3"/><path d="M520 495h120" stroke="#f4f1e9" stroke-width="7"/>'
        b+=svgtext(480,130,'N ↑ / 北',21)+svgtext(510,530,'南侧入口',18)+svgtext(92,325,'西侧',17)+svgtext(985,325,'东侧',17)
        if sid=='DOCK':b+='<rect x="165" y="150" width="800" height="80" fill="#8da7b1"/><path d="M560 235V450" stroke="#d57238" stroke-width="12"/>'+svgtext(580,350,'北 → 南押送',18)+svgtext(190,400,'西媒体栏杆',16)+svgtext(750,400,'东警员区',16)
        elif sid=='DINER':b+='<rect x="760" y="220" width="150" height="180" fill="#a5795b"/><rect x="250" y="190" width="140" height="60" fill="#556774"/><path d="M565 470V285" stroke="#698376" stroke-width="12"/>'+svgtext(240,180,'路易吉座/背包',16)+svgtext(755,440,'东柜台',17)
        elif sid.startswith('COURT') and sid!='COURT-CORRIDOR':b+='<rect x="420" y="175" width="290" height="65" fill="#a5795b"/><rect x="290" y="310" width="180" height="50" fill="#556774"/><rect x="670" y="310" width="180" height="50" fill="#698376"/>'+svgtext(500,215,'法官',18)+svgtext(310,345,'辩方西',18)+svgtext(700,345,'控方东',18)+svgtext(500,450,'旁听南',18)
        elif sid=='CLINIC':
            b+='<rect x="205" y="235" width="115" height="180" fill="#9dadaf"/><rect x="775" y="250" width="140" height="70" fill="#a5795b"/><path d="M565 465V235" stroke="#698376" stroke-width="8"/>'+svgtext(215,280,'西长椅',16)+svgtext(785,290,'东接待台',16)+svgtext(490,195,'北治疗门',18)+svgtext(735,450,'东南受控侧廊',16)
        elif sid=='COURT-CORRIDOR':
            b+='<rect x="220" y="250" width="110" height="160" fill="#9dadaf"/><rect x="810" y="300" width="65" height="80" fill="#8da7b1"/>'+svgtext(220,230,'西候证椅',17)+svgtext(760,280,'东饮水机',17)+svgtext(490,200,'北法庭门',18)+svgtext(510,455,'南安检',18)
        elif sid=='MARA-HOME':
            b+='<rect x="400" y="155" width="300" height="80" fill="#c8c9c4"/><rect x="775" y="265" width="145" height="150" fill="#a5795b"/><ellipse cx="565" cy="335" rx="110" ry="50" fill="#ae977e"/>'+svgtext(470,200,'北孩子卧室',18)+svgtext(795,310,'东厨房',17)+svgtext(505,340,'中央餐桌',17)+svgtext(185,220,'西窗',17)
        elif sid=='VISIT':
            b+='<rect x="430" y="290" width="270" height="65" fill="#9dadaf"/>'+svgtext(500,255,'路易吉朝南',17)+svgtext(500,405,'海伦朝北',17)+svgtext(815,230,'东窄窗',17)+svgtext(190,450,'无玻璃隔断',17)
        elif sid in ['CAFE','HELEN-OFFICE','NEWSROOM','INSURER','POLICE']:
            labels={'CAFE':('西北二人桌 / 莉娜北、诺拉南','东吧台','西窗'), 'HELEN-OFFICE':('中央长桌 / 蓝夹桌西','东文件柜','北证据板 / 西窗'), 'NEWSROOM':('诺拉桌在西','编辑桌在东','北墙屏幕 / 西窗'), 'INSURER':('中央会议桌','东侧走廊 / 质检工位','北屏幕 / 西窗'), 'POLICE':('中央问询桌','东财物台','北墙钟')}[sid]
            if sid=='CAFE':b+='<ellipse cx="370" cy="265" rx="100" ry="45" fill="#a5795b"/>'
            elif sid=='NEWSROOM':b+='<rect x="250" y="290" width="160" height="70" fill="#a5795b"/><rect x="735" y="290" width="160" height="70" fill="#a5795b"/>'
            else:b+='<rect x="440" y="285" width="260" height="75" fill="#a5795b"/>'
            b+=svgtext(240,245,labels[0],17,width=28)+svgtext(750,400,labels[1],16,width=14)+svgtext(370,195,labels[2],17,width=30)
        elif sid=='HOTEL':
            b+='<rect x="460" y="150" width="210" height="75" fill="#9dadaf"/><path d="M220 320H560V430" stroke="#698376" stroke-width="8"/><path d="M180 465H950" stroke="#556774" stroke-width="10"/>'+svgtext(470,200,'北旋转门',18)+svgtext(190,290,'西侧接近',17)+svgtext(750,320,'东上客位',17)+svgtext(480,450,'南路缘/车道',17)
        elif sid=='HOTEL-BREAKFAST':
            b+='<rect x="330" y="165" width="430" height="55" fill="#a5795b"/><rect x="735" y="295" width="160" height="80" fill="#a5795b"/><path d="M565 475V250" stroke="#698376" stroke-width="8"/>'+svgtext(460,203,'北自助台',18)+svgtext(750,340,'东双人桌',17)+svgtext(185,280,'西窗',17)+svgtext(575,420,'服务通道',17)
        elif sid=='DINER-EXTERIOR':
            b+='<rect x="250" y="160" width="570" height="155" fill="#c8c9c4"/><path d="M475 315H570M820 220V280" stroke="#f4f1e9" stroke-width="12"/><path d="M190 340V470" stroke="#556774" stroke-width="12"/>'+svgtext(385,220,'快餐店 / 北侧建筑',18)+svgtext(460,350,'南正门',17)+svgtext(805,200,'东员工门',17)+svgtext(185,325,'西街窗',17)+svgtext(415,450,'南停车区 / 采访位置',18)
        elif sid in ['HOTEL-ROOM','PRISON']:
            b+='<rect x="760" y="240" width="160" height="190" fill="#c8c9c4"/>'+svgtext(790,320,'东床',18)
            if sid=='PRISON':b+='<rect x="220" y="280" width="150" height="80" fill="#a5795b"/><circle cx="555" cy="330" r="20" fill="#ddd5a8" stroke="#777a73"/>'+svgtext(230,320,'西固定桌',17)+svgtext(490,190,'北窄窗',18)+svgtext(465,390,'中央防护顶灯',17)
            else:b+='<rect x="430" y="170" width="250" height="60" fill="#a5795b"/>'+svgtext(490,210,'北桌',18)+svgtext(190,230,'西窗',17)
        elif sid=='SERVER-OFFICE':
            b+='<rect x="430" y="155" width="280" height="90" fill="#556774"/><rect x="760" y="300" width="160" height="70" fill="#a5795b"/>'+svgtext(475,205,'北设备柜',18,'#ffffff')+svgtext(765,340,'东授权工位',16)+svgtext(190,245,'西玻璃隔断',17)
        elif sid=='STATION':
            b+='<rect x="240" y="270" width="160" height="130" fill="#9dadaf"/><rect x="770" y="270" width="150" height="100" fill="#a5795b"/>'+svgtext(250,320,'西候车座',17)+svgtext(780,320,'东售票台',17)+svgtext(490,190,'北发车门',18)
        else:b+=svgtext(270,290,'通用外景仅示方向；实际台阶、道路与栏杆依本集场景正文。',20,width=30)
        b+=svgtext(45,590,desc,18,width=55)
        save(f'maps/{sid}.svg',svgwrap(b,1200,850))
    asset+=['## 关键道具\n\n红/黑笔记本、蓝色案卷夹、病历回执、手机、绿蜡笔与画本、身前腕铐和腰链分别生成孤立道具图；保留磨损与接触位置。公文长字、手机界面、案件照片及证据回放统一后期合成，底图只保留空白/不可识别占位面。道具短枪只作剧情外观连续性，不制作型号拆解或操作教程。\n']
    save('asset-cards.md','\n'.join(asset))

def shot_identity(shot,cid):
    desc=visible_desc(cid,shot['id'])
    if cid in shot.get('appearanceOverride',{}):
        if cid=='LUIGI-STREET':desc=re.sub(r'不戴口罩。|戴浅蓝医用口罩。|起始戴浅蓝医用口罩，本镜按动作亲手摘下，之后不再戴上。','',desc)
        desc+='本镜明确外观：'+shot['appearanceOverride'][cid]+'。'
    return desc

def prompt_for(shot,scene):
    if shot.get('isTechnicalSegment') and 'sound' not in shot.get('authoredSegmentFields',[]):
        shot={**shot,'sound':AMBIENCE[scene['location']]+'；'+shot['sound']}
    offscreen=EXTRA.get('offscreen',{}).get(shot['id'],[])
    chars='\n'.join(('本镜画外继承，声源/人物不入画：' if x in offscreen else '')+shot_identity(shot,x) for x in dict.fromkeys([*shot['characters'],*EXTRA_BINDINGS.get(shot['id'],[])]))
    if shot.get('isTechnicalSegment'):chars='以下为连续镜的身份库；人物是否已入画、离场及持物只依本段起态与动作，不能把整镜所有角色同时塞入本段。\n'+chars
    if shot.get('appearanceOverride'):chars+='\n本镜外观优先覆盖（其余身份/服装不变）：'+json.dumps(shot['appearanceOverride'],ensure_ascii=False)
    if shot['id'] in EXTRA.get('shotNotes',{}):chars+='\n声源与背景限定：'+EXTRA['shotNotes'][shot['id']]
    env=scene_environment(scene,shot,SCENES)
    d=shot['duration']; ds=shot['dialogue']
    action=shot['action'].replace('本镜对白仅使用英语；逐句按dialogue的说话人与受话者完成，留出真实倾听与动作时间。','')
    spoken='\n'.join(f'{x["speaker"]}向{x["listener"]}，{x["tone"]}，只使用英语说一次：{{{x["text"]}}}' for x in ds) if ds else '无对白。'
    voices=[q['speaker'] for q in ds if re.search('声音|电话|直播声|客服',q['speaker'])]
    voice_note='画外声音归属：'+('、'.join(dict.fromkeys(voices)))+'仅由本镜明确的电话/屏幕/画外位置传出，声源本人不凭空出现在房间内。' if voices else ''
    return f'{STYLE}\n场次风格：{look_for(scene,shot)}\n总生成长度{d+2}秒，为中间{d}秒采用区间保留开头和结尾各1秒自然余量，不增添剧情。\n人物：\n{chars}\n环境与光源：{env}\n景别/机位：{shot["framing"]}\n构图：{shot["composition"]}\n起始画面：{shot["start"]}\n事件与表演：{action}\n注意力变化：{shot.get("viewerEntry",shot["purpose"])} → {shot.get("viewerExit",shot["end"])}\n摄影机：{shot["camera"]}\n焦点：{shot["focus"]}\n结束状态：{shot["end"]}\n声音：<{shot["sound"]}>\n({shot["music"]})\n准确对白按顺序：\n{spoken}\n{voice_note}\n只说列出的英语原句；导演说明不发声，不说中文译文，不额外加旁白或对白。手机/公文/字幕均由后期叠加，生成画面不排字。单镜连续，不加入内部切镜；前后保持身份、服装、门窗、物件与接触状态一致。'

def compile_candidates(shot,scene,episode,cursor):
    parts=segments_for(shot);text=[];rows=[]
    if len(parts)>1:
        text.append(f'成片镜 {shot["id"]} 共{shot["duration"]}秒；下面{len(parts)}个独立生成候选共同服务本镜。技术接续不等于成片剪点，不能将本文件整段提交为一次任务。先制作并核验连续表演、机位和声线，再决定延长或覆盖方案；当前无实际媒体。')
    for p in parts:
        cid=p['candidateId'];prompt=prompt_for(p,scene)
        text.append(f'【{cid} · 本镜采用 {p["shotOffset"]}—{p["shotOffset"]+p["duration"]} 秒】\n{prompt}' if len(parts)>1 else prompt)
        if cid!=shot['id']:save(f'prompts/{cid}.txt',prompt)
        request={'model':'doubao-seedance-2-5-260628','content':[{'type':'text','text':prompt}],'ratio':'16:9','duration':p['duration']+2,'resolution':'1080p','generate_audio':True,'output_format':'mp4'}
        jwrite(f'requests/{cid}.json',request)
        rows.append({'episode':episode,'shot':shot['id'],'candidate':cid,'shotInSeconds':p['shotOffset'],'shotOutSeconds':p['shotOffset']+p['duration'],'episodeInSeconds':cursor+p['shotOffset'],'episodeOutSeconds':cursor+p['shotOffset']+p['duration'],'requestSeconds':p['duration']+2,'candidateInSeconds':1,'candidateOutSeconds':p['duration']+1,'isEditorialCut':False,'startState':p['start'],'endState':p['end'],'mediaStatus':'pending_media','seamStatus':'pending_continuity_review' if len(parts)>1 else 'single_candidate'})
    return '\n\n'.join(text),rows

def visible_desc(cid,sid):
    partial=EXTRA.get('partialVisible',{}).get(sid,{}).get(cid)
    return ('本镜局部可见限定：'+partial+'。身份连续依据：' if partial else '')+char_desc(cid,sid)

CSS='''body{margin:0;background:#f3f0e8;color:#263039;font:16px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}header,main{max-width:1120px;margin:auto;padding:36px}header{border-bottom:1px solid #c9c5ba}h1{font:40px Georgia,serif;margin:4px 0}h2{margin-top:34px}a{color:#63323d}nav a{display:inline-block;padding:5px 10px;margin:3px;border:1px solid #d4cfc3;border-radius:5px;text-decoration:none}pre{white-space:pre-wrap;word-break:break-word;font:14px/1.9 "Segoe UI","Microsoft YaHei",sans-serif;background:white;padding:24px;border-left:4px solid #6b2933}details{border-top:1px solid #d4cfc3;padding:14px 0}summary{cursor:pointer;font-weight:600}.tag{color:#7b4a35;font-size:13px}.card{background:#fffdf8;padding:22px;margin:16px 0;border:1px solid #ded9cc}img{max-width:100%;height:auto}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #d4cfc3;text-align:left;padding:9px;vertical-align:top}button{background:#35444e;color:white;border:0;padding:9px 15px;cursor:pointer}input{padding:10px;width:80%;font-size:16px}.muted{color:#6c7278} @media print{nav,button,input{display:none}details{display:block}header,main{padding:10px}}'''
JS='''function copy(id){const s=document.getElementById(id).innerText;if(navigator.clipboard){navigator.clipboard.writeText(s).catch(()=>select(id))}else select(id)}function select(id){const r=document.createRange();r.selectNodeContents(document.getElementById(id));const s=window.getSelection();s.removeAllRanges();s.addRange(r)}function filterShots(t){document.querySelectorAll('details.shot').forEach(e=>e.style.display=e.textContent.toLowerCase().includes(t.toLowerCase())?'':'none')}function visitShot(){const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(!el)return;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;requestAnimationFrame(()=>el.scrollIntoView({block:'start'}))}window.addEventListener('hashchange',visitShot);visitShot();'''
def page(title,body):return f'<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{H(title)}</title><style>{CSS}</style><header><div class="tag">拒赔 / DENIED · 16:9 · EN + 中文对照 · DESIGN / PENDING MEDIA</div><h1>{H(title)}</h1><nav><a href="index.html">全剧目录</a><a href="storyboard.html">剧情与剪辑总览</a><a href="official-sources.md">官方依据</a><a href="asset-inventory.html">资产清单</a><a href="review/validation-report.json">文字覆盖检查</a></nav></header><main>{body}</main><script>{JS}</script></html>'
def storyboard(ep):
    files=[]
    for pg in range(math.ceil(len(ep['shots'])/6)):
        b=head(f'G4 · E{ep["number"]:02} {ep["title"]} · {pg+1}', '景别索引示意，人物符号不是精确走位或关键帧；具体构图、注意力和剪点以镜头卡为准。')
        for k,sh in enumerate(ep['shots'][pg*6:pg*6+6]):
            x=35+(k%3)*390;y=135+(k//3)*340
            clip='clip-'+sh['id'];frame=sh['framing'];lead=re.split('[，；。]',frame,maxsplit=1)[0]
            count=min(3,max(1,len([c for c in sh['characters'] if not c.endswith('-VOICE') and c not in sh.get('offscreenRoleIds',[])])))
            if not re.search('双人|三人|全景|共享|多人|母女|姐妹',lead):count=1
            # Props mentioned at the edge of an actor shot do not turn that shot
            # into a full-frame insert. Classify the authored primary framing.
            prop_view=bool(re.search('双手|手部|腕部|物件|道具|桌面|纸页|文件|回执|屏幕|手机',lead)) and not bool(re.search('半身|人物|双人|三人|共享|母女|姐妹',lead))
            b+=f'<defs><clipPath id="{clip}"><rect x="{x}" y="{y}" width="360" height="202"/></clipPath></defs><rect x="{x}" y="{y}" width="360" height="202" fill="#d5dcdd" stroke="#556774"/><g clip-path="url(#{clip})"><path d="M{x} {y+155}H{x+360}" stroke="#b5bab8" stroke-width="2"/>'
            c=COLORS[5] if 'RED' in str(sh['characters']) else COLORS[6] if 'ESCORT' in str(sh['characters']) else COLORS[0]
            if re.search('海伦|玛拉|诺拉|维克多|瑞秋|莉娜',frame) and not re.search('路易吉|双人',frame):c=COLORS[0]
            if prop_view:
                b+=f'<rect x="{x+110}" y="{y+55}" width="140" height="105" rx="8" fill="#e8e4dc" stroke="#556774" stroke-width="3"/><path d="M{x+30} {y+180}L{x+120} {y+115}Q{x+138} {y+100} {x+153} {y+120}L{x+128} {y+155}M{x+330} {y+180}L{x+240} {y+115}" fill="none" stroke="{c}" stroke-width="22" stroke-linecap="round"/>'
                if '铐' in sh['focus']:b+=f'<ellipse cx="{x+125}" cy="{y+143}" rx="22" ry="15" fill="none" stroke="#788086" stroke-width="6"/><path d="M{x+148} {y+143}H{x+220}" stroke="#788086" stroke-width="5"/>'
            elif re.search('特写|近景|半身',lead):
                for z in range(count):b+=figure(x+360*(z+1)/(count+1),y+160,1.65 if count==1 else 1.1,c if z==0 else COLORS[3])
            else:
                for z in range(count):b+=figure(x+360*(z+1)/(count+1),y+100,.65,c if z==0 else COLORS[3])
            if not prop_view and re.search('过肩|肩旁|肩后',lead):b+=f'<ellipse cx="{x+18}" cy="{y+190}" rx="65" ry="100" fill="#262b31" opacity=".65"/>'
            if re.search('推|跟|移|摇|升|退',sh['camera']) and not re.search('固定|不移动|不运镜|锁定机位',sh['camera']):b+=svgtext(x+282,y+180,'运动镜',13,'#a44333',width=6)
            b+='</g>'
            b+=svgtext(x+8,y+23,sh.get('displayId',sh['id'])+f'  {sh["duration"]}s',14,width=35)
            b+=svgtext(x,y+232,short(sh['framing'],42),15,width=22)+svgtext(x,y+285,short(sh['purpose'],50),13,width=26)
        name=f'boards/E{ep["number"]:02}-board-{pg+1:02}.svg';save(name,svgwrap(b,1210,850));files.append(name)
    return files

def build():
    visual_cards();scene_maps()
    eps=write_assembled()
    aliases=shot_aliases(eps)
    for old,current in aliases.items():
        if old!=current:EXTRA_BINDINGS.setdefault(current,[]).extend(EXTRA_BINDINGS.get(old,[]))
    for ep in eps:
        for sh in ep['shots']:
            EXTRA_BINDINGS.setdefault(sh['id'],[]).extend(sh.get('extraRoleIds',[]))
            if len(sh.get('sourceShotIds',[]))>1:
                EXTRA.get('partialVisible',{}).pop(sh['id'],None)
            if 'offscreenRoleIds' in sh:EXTRA.setdefault('offscreen',{})[sh['id']]=sh['offscreenRoleIds']
    errors=[];warnings=[];timelines=[];dialogs=[];overlays=[];blocking=[];summary=[];shot_registry=[];dialog_ids=set()
    candidate_rows=[]
    episode_count=len(eps)
    complete_inventory=bool(eps) and [e['number'] for e in eps]==list(range(1,episode_count+1))
    if not complete_inventory:errors.append(['series','inventory','当前播出集必须按season-plan.json从E01连续编号，且至少包含一集'])
    all_scripts=[f'# 《拒赔》{episode_count}集详细剧本\n\n16:9横屏；英语发声，逐句中文对照。全剧为虚构改编；时码为设计，媒体pending。场号和生产镜号沿用制作定位，播出顺序以当前{episode_count}集目录为准。短剧以每集约3–5分钟为主要节奏，完整场景允许自然收尾。\n']
    for ep in eps:
        en=ep['number'];eid=f'E{en:02}';scmap={x['id']:x for x in ep['scenes']}
        script=f'# {eid}《{ep["title"]}》\n\n{ep["logline"]}\n\n'
        duration_note=ep.get('durationNote') or ep.get('durationException','')
        if duration_note:script+=f'时长说明：{duration_note}\n\n'
        for sc in ep['scenes']:script+=f'## {sc["id"]} · {sc["time"]} · {sc["location"]}\n\n{sc["script"]}\n\n'
        script_lines=[line.strip() for sc in ep['scenes'] for line in re.findall(r'（[^）\n]*英语[^）\n]*）：\s*([^\n]+)',sc['script'])]
        shot_lines=[q['text'].strip() for sh in ep['shots'] for q in sh['dialogue']]
        if script_lines!=shot_lines:errors.append([eid,'dialogue','剧本与分镜英语对白的逐句顺序不一致'])
        zh_lines=[line.strip() for sc in ep['scenes'] for line in re.findall(r'中文对照：\s*([^\n]+)',sc['script'])]
        if zh_lines!=[q['translationZh'].strip() for sh in ep['shots'] for q in sh['dialogue']]:errors.append([eid,'dialogue','剧本与分镜中文对照的逐句顺序不一致'])
        script+=f'\n跨集连续性：{ep["continuityNote"]}\n'
        save(f'scripts/{eid}-script.md',script);all_scripts.append(script)
        pm=[f'# {eid} 全镜头Seedance 2.5复制稿\n\n成片镜头与生成候选分列；按候选分别提交；所有对白只发声英文。中文对照用于阅读与后期字幕。\n'];srt_en=[];srt_zh=[];body=f'<p>{H(ep["logline"])}</p><p><a href="scripts/{eid}-script.md">剧本Markdown</a> · <a href="prompts/{eid}-seedance25.md">全部独立复制稿</a> · <a href="audio/{eid}-en.srt">英语字幕</a> · <a href="audio/{eid}-zh.srt">中文字幕</a></p><h2>详细剧本</h2>'
        if duration_note:body+=f'<p class="muted">时长说明：{H(duration_note)}</p>'
        for sc in ep['scenes']:body+=f'<div class="card"><h3>{H(sc["id"])} · {H(sc["time"])} · {H(sc["location"])}</h3><pre>{H(sc["script"])}</pre></div>'
        board_files=storyboard(ep);body+='<h2>景别索引板</h2><p>简化人物符号仅用于检索景别。<a href="storyboard.html#'+eid+'">完整镜头卡、信息变化及相邻剪点</a>另页阅读。</p>'+''.join(f'<img loading="lazy" src="{p}" alt="景别索引示意板">' for p in board_files)
        body+='<h2>逐镜复制稿</h2><input placeholder="按镜号、人物或关键词过滤" oninput="filterShots(this.value)">'
        cursor=0;dialog_counter=0;all_ids=set();script_all='\n'.join(s['script'] for s in ep['scenes'])
        for sh in ep['shots']:
            sid=sh['id'];duration=sh['duration'];sc=scmap[sh['sceneId']]
            if 'd' in sh:errors.append([eid,sid,'存在临时对白字段d；须合并到dialogue并同步场景正文'])
            if sid in all_ids:errors.append([eid,sid,'重复镜号'])
            all_ids.add(sid)
            for f in ['purpose','viewerEntry','viewerExit','cutTrigger','framing','composition','camera','focus','start','action','end','sound','music','next']:
                if not sh.get(f):errors.append([eid,sid,'缺字段:'+f])
            if not 4<=duration<=120:errors.append([eid,sid,'成片镜头长度不在当前设计范围'])
            unknown=[x for x in sh['characters'] if x not in CAST and x not in EXTRA['roles'] and not x.startswith('OFFICER')]
            if unknown:warnings.append([eid,sid,'需核对本集新配角:'+','.join(unknown)])
            prompt,candidates=compile_candidates(sh,sc,eid,cursor);candidate_rows.extend(candidates)
            visible_ids=[x for x in dict.fromkeys([*sh['characters'],*EXTRA_BINDINGS.get(sid,[])]) if not x.endswith('-VOICE') and x not in EXTRA.get('offscreen',{}).get(sid,[])]
            first_env=scene_environment(sc,sh,SCENES)
            first=f'{STYLE}\n场次风格：{look_for(sc,sh)}\n{chr(10).join(shot_identity(sh,x) for x in visible_ids)}\n{first_env}\n{sh["framing"]}；起态构图：{sh["start"]}。空间方位按上列环境，人物只处于起态；本镜后续调度不出现在静帧。此图不描画尚未发生的动作，不生成字幕和公文长字。'
            if sh.get('appearanceOverride'):first+='\n本镜外观优先覆盖：'+json.dumps(sh['appearanceOverride'],ensure_ascii=False)
            save(f'prompts/{sid}.txt',prompt)
            save(f'prompts/{sid}-start-image.txt',first)
            title=f'{sh["displayId"]} · 制作号{sid} · {duration}s · {sh["framing"]}'
            pm += [f'## {title}\n\n目的：{sh["purpose"]}\n\n观众信息：{sh["viewerEntry"]} → {sh["viewerExit"]}\n\n切点：{sh["cutTrigger"]}\n\n采用帧窗：[{cursor*FPS},{(cursor+duration)*FPS})；各候选采用帧窗详见 editorial/generation-segments.csv；技术边界不算剪点。\n\n```text\n{prompt}\n```\n\n静帧起态稿（独立备稿，非已绑定首帧）：\n\n```text\n{first}\n```\n\n中文对白对照：\n'+'\n'.join(f'- {q["speaker"]}：{q["text"]}\n  中文：{q.get("translationZh","")}' for q in sh['dialogue'])+f'\n\n剪辑接口：{sh["next"]}\n']
            body+=f'<details class="shot"><summary>{H(title)}</summary><p>{H(sh["purpose"])}</p><p class="muted">成片采用 [{cursor},{cursor+duration}) 秒；{len(candidates)}个生成候选，技术边界不是剪点。候选未生成。</p><button onclick="copy(\'{sid}\')">复制本镜候选提示词组</button><pre id="{sid}">{H(prompt)}</pre><details><summary>静帧起态备稿</summary><pre>{H(first)}</pre></details>'
            body+='<table><tr><th>英语原句</th><th>中文对照</th><th>预定窗口</th></tr>'
            last_d=-1
            for q in sh['dialogue']:
                if q['id'] in dialog_ids:errors.append([eid,sid,'重复对白ID:'+q['id']])
                dialog_ids.add(q['id'])
                if not 0<=q['start']<q['end']<=duration:errors.append([eid,sid,'对白越界:'+q['id']])
                if q['start']<last_d:warnings.append([eid,sid,'对白重叠需意图核对:'+q['id']])
                last_d=q['end'];words=len(re.findall(r"[A-Za-z]+(?:['’-][A-Za-z]+)*",q['text']))
                wps=words/(q['end']-q['start'])
                if wps>2.7:errors.append([eid,sid,f'英语窗口过密 {q["id"]}: {wps:.2f}词/秒'])
                if q['text'] not in script_all:errors.append([eid,sid,'原句未入剧本:'+q['id']])
                if not q.get('translationZh'):errors.append([eid,sid,'缺中文译文:'+q['id']])
                if re.search('[\u4e00-\u9fff]',q['text']):errors.append([eid,sid,'英语声轨混入汉字:'+q['id']])
                dialog_counter+=1;start=cursor+q['start'];end=cursor+q['end'];c=f'{secstamp(start)} --> {secstamp(end)}'
                srt_en.append(f'{dialog_counter}\n{c}\n{q["text"]}\n');srt_zh.append(f'{dialog_counter}\n{c}\n{q.get("translationZh","")}\n')
                dialogs.append({'episode':eid,'shot':sid,**q,'episodeStart':start,'episodeEnd':end,'plannedWordsPerSecond':round(wps,2)})
                body+=f'<tr><td>{H(q["speaker"])}：{H(q["text"])}</td><td>{H(q.get("translationZh",""))}</td><td>{q["start"]}–{q["end"]}s</td></tr>'
            body+='</table><p>观众信息：'+H(sh['viewerEntry'])+' → '+H(sh['viewerExit'])+'</p><p>切点：'+H(sh['cutTrigger'])+'</p><p>接口：'+H(sh['next'])+'</p></details>'
            for q in sh.get('overlay',[]):
                if not 0<=q['start']<q['end']<=duration:errors.append([eid,sid,'后期文字窗口越界'])
                overlays.append({'episode':eid,'shot':sid,**q,'episodeStart':cursor+q['start'],'episodeEnd':cursor+q['end']})
            timelines.append({'episode':eid,'shot':sid,'displayId':sh['displayId'],'scene':sh['sceneId'],'location':sc['location'],'durationSeconds':duration,'startFrame':cursor*FPS,'endFrame':(cursor+duration)*FPS,'candidateCount':len(candidates),'candidateWindows':'详见 generation-segments.csv','cutTrigger':sh['cutTrigger'],'viewerEntry':sh['viewerEntry'],'viewerExit':sh['viewerExit'],'transition':sh['next'],'environment':sh['sound'],'music':sh['music']})
            blocking.append({'episode':eid,'shot':sid,'location':sc['location'],'characters':','.join(sh['characters']),'start':sh['start'],'action':sh['action'],'end':sh['end'],'next':sh['next']})
            shot_registry.append({'episode':eid,'scene':sc,'shot':sh,'visualDirection':look_for(sc,sh),'promptPath':f'prompts/{sid}.txt','startFrame':cursor*FPS,'endFrame':(cursor+duration)*FPS})
            cursor+=duration
        if not 150<=cursor<=360:
            reason=str(ep.get('durationException','')).strip()
            message=f'整集时长{cursor}秒超出当前150–360秒设计范围'
            if reason:warnings.append([eid,'all',message+'；例外说明：'+reason])
            else:errors.append([eid,'all',message+'；须提供durationException说明或调整节奏'])
        save(f'prompts/{eid}-seedance25.md','\n'.join(pm));save(f'audio/{eid}-en.srt','\n'.join(srt_en));save(f'audio/{eid}-zh.srt','\n'.join(srt_zh))
        save(f'{eid}.html',page(f'{eid} · {ep["title"]}',body))
        summary.append({'episode':eid,'title':ep['title'],'scenes':len(ep['scenes']),'shots':len(ep['shots']),'seconds':cursor,'dialogueLines':dialog_counter,'englishWords':sum(len(re.findall(r"[A-Za-z]+(?:['’-][A-Za-z]+)*",q['text'])) for s in ep['shots'] for q in s['dialogue'])})
    save('scripts/all-episodes-bilingual.md','\n\n'.join(all_scripts))
    for name,rows in [('editorial/timeline.csv',timelines),('editorial/generation-segments.csv',candidate_rows),('editorial/blocking.csv',blocking),('audio/dialogue-cues.csv',dialogs),('editorial/overlays.csv',overlays)]:
        if rows:
            fields=list(dict.fromkeys(k for row in rows for k in row))
            with (ROOT/name).open('w',encoding='utf-8-sig',newline='') as f:
                w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
    jwrite('editorial/shot-registry.json',shot_registry);jwrite('editorial/episode-summary.json',summary)
    jwrite('review/validation-report.json',{'date':'2026-11-08','scope':'text_and_plan_only','episodes':episode_count,'shots':len(shot_registry),'dialogueLines':len(dialogs),'seconds':sum(x['seconds'] for x in summary),'expectedEpisodes':episode_count,'completeInventory':complete_inventory,'episodeDurationRangeSeconds':[150,360],'generationCandidates':len(candidate_rows),'longShots':sum(s['duration']>26 for e in eps for s in e['shots']),'errors':errors,'warnings':warnings,'mediaVerified':False,'productionReady':False})
    intro=f'<p>{episode_count}集短剧，按人物冲突优化场景与分镜节奏；英语原句/中文对照、逐镜Seedance 2.5复制稿与起态备稿。共{len(shot_registry)}个成片镜、{len(candidate_rows)}个生成候选、{len(dialogs)}句对白，计划{sum(x["seconds"] for x in summary)//60}分{sum(x["seconds"] for x in summary)%60:02}秒。演员资产、视频、录音和试剪尚待实际媒体。</p><p><a href="storyboard.html">剧情与剪辑总览</a> · <a href="asset-inventory.html">资产清单与准备顺序</a> · <a href="README.md">交付说明</a> · <a href="story-outline.md">全剧大纲</a> · <a href="scripts/all-episodes-bilingual.md">全剧双语剧本</a> · <a href="editorial/timeline.csv">剪辑时间表</a> · <a href="audio/dialogue-cues.csv">完整对白表</a> · <a href="test-plan.md">试片计划</a> · <a href="director-card.md">导演通案</a> · <a href="reference-and-style.html">美剧参考、对白与调色</a></p>'
    intro+='<table><tr><th>集</th><th>名称</th><th>场/镜</th><th>计划时长</th><th>英文词数</th></tr>'+''.join(f'<tr><td><a href="{x["episode"]}.html">{x["episode"]}</a></td><td>{H(x["title"])}</td><td>{x["scenes"]}/{x["shots"]}</td><td>{x["seconds"]//60}:{x["seconds"]%60:02}</td><td>{x["englishWords"]}</td></tr>' for x in summary)+'</table>'
    intro+='<h2>六件可视设计卡</h2>'+''.join(f'<details><summary>{n}</summary><img src="visual/{p}.svg" alt="{n}"></details>' for p,n in [('style-card','风格卡'),('palette-card','配色卡'),('material-card','材质卡'),('lighting-card','灯光卡'),('light-plot','光位图'),('lookdev-test-board','LookDev测试板')])
    intro+='<h2>空间与调度</h2><p>'+ ' · '.join(f'<a href="maps/{s}.svg">{s}</a>' for s in SCENES)+'</p><p>图板为矢量规划，实际光材、演员身份、接触、口型和剪辑效果均pending_media。图板文字不是模型原生参考绑定。</p>'
    save('index.html',page('《拒赔》全剧制作设计包',intro))
    print(json.dumps({'episodes':len(eps),'shots':len(shot_registry),'dialogue':len(dialogs),'errors':len(errors),'warnings':len(warnings)},ensure_ascii=False))
if __name__=='__main__':build()
