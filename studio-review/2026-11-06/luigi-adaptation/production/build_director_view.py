from season import load_episodes, episode_for_shot, shot_aliases
from visual_direction import STYLE, look_for
"""Publish the current authored story and cut decisions, without inventing media."""
from pathlib import Path
import csv, html, json

ROOT=Path(__file__).resolve().parent
H=html.escape
LABELS={'openingQuestion':'开场问题','pursuit':'人物争取','reversal':'反转','cost':'代价','cliffhanger':'集尾结果','nextEpisodeBridge':'下集承接'}

def write(name,text):
    p=ROOT/name
    if not p.exists() or p.read_text(encoding='utf-8')!=text:p.write_text(text,encoding='utf-8')

def table(name,rows):
    if not rows:return
    with (ROOT/name).open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(dict.fromkeys(k for row in rows for k in row)))
        w.writeheader();w.writerows(rows)

def clock(n):return f'{int(n)//60:02}:{int(n)%60:02}'

CSS='''
:root{--ink:#262e32;--paper:#f4f1e9;--line:#d5cfc2;--red:#6b2933;--blue:#556774}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}
header,main{max-width:1320px;margin:auto;padding:32px 36px}h1{font:42px Georgia,serif;margin:8px 0 14px}h2{font-size:28px;margin:0}h3{font-size:20px;margin:0 0 10px}p{margin:8px 0 16px}a{color:var(--red);text-underline-offset:4px}
.eyebrow{font-size:12px;letter-spacing:.13em;color:#79553e}.intro{max-width:850px;color:#586169}nav{display:flex;flex-wrap:wrap;gap:8px 22px}nav a{white-space:nowrap}
.controls{position:sticky;top:0;z-index:2;background:#f4f1e9f5;border-block:1px solid var(--line);padding:12px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
select,input,button{font:inherit;padding:8px 12px;border:1px solid #bcb7ab;border-radius:3px;background:#fffdf7;color:var(--ink)}input{flex:1;min-width:220px}button{cursor:pointer;background:#35444e;color:#fff;border-color:#35444e}
.count{font-size:13px;color:#59636b}.episode{padding:34px 0;border-bottom:2px solid #bbb3a3;scroll-margin-top:100px}.episode-head{display:flex;gap:22px;align-items:baseline;justify-content:space-between}.episode-head a{white-space:nowrap}.beats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}.beat{padding:16px;background:#fffdf8;border-top:3px solid var(--red)}.label{display:block;color:#7a675b;font-size:12px;margin-bottom:4px}.beat p{margin:0;font-size:15px}.timeline{display:flex;height:32px;gap:2px;margin:18px 0 6px}.segment{min-width:3px;background:var(--blue);display:block;position:relative;border-radius:2px}.segment:nth-child(3n+2){background:#a5795b}.segment:nth-child(3n){background:#698376}.segment:hover{outline:2px solid var(--red);outline-offset:2px}.timescale{display:flex;justify-content:space-between;font-size:12px;color:#687078}.scene{margin:28px 0;padding-top:18px;border-top:1px solid var(--line)}.scene-state{font-size:14px;color:#586169;max-width:1020px}.shot{background:#fffdf8;border:1px solid var(--line);margin:12px 0;scroll-margin-top:100px}.shot summary{cursor:pointer;display:grid;grid-template-columns:125px 82px 1fr;gap:12px;padding:16px;list-style:none}.shot summary::-webkit-details-marker{display:none}.shot summary::before{content:none}.sid{font-weight:700;color:var(--red)}.time{font-variant-numeric:tabular-nums;color:#687078;font-size:13px}.purpose{font-weight:600}.shot[open] summary{border-bottom:1px solid var(--line)}.shot-body{padding:20px}.info{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:15px;background:#edf0ef}.info p{margin:0}.cut{border-left:4px solid #9b5b36;padding:10px 16px;margin:16px 0;background:#f4eee3}.fields{display:grid;grid-template-columns:1fr 1fr;gap:4px 22px}.fields p{margin:8px 0}.dialogue{border-top:1px solid var(--line);padding-top:12px}.cue{margin:12px 0}.cue strong{font-size:13px;color:#6d5853}.en{font-family:Georgia,serif;font-size:19px;line-height:1.5}.zh{font-size:14px;color:#62686a}.links{display:flex;gap:20px;font-size:14px;margin-top:16px}.no-dialogue{font-size:14px;color:#687078}footer{padding:25px 0;font-size:13px;color:#687078}
@media(max-width:850px){header,main{padding:24px 18px}.beats{grid-template-columns:1fr 1fr}.episode-head{display:block}.shot summary{grid-template-columns:112px 1fr}.purpose{grid-column:1/-1}.fields,.info{grid-template-columns:1fr}}
@media(max-width:500px){.beats{grid-template-columns:1fr}h1{font-size:34px}}
@media print{.controls,nav,.links{display:none}.episode{break-before:page}.shot{break-inside:avoid}header,main{padding:12px}.beats{grid-template-columns:repeat(3,1fr)}}
'''
JS='''
function filter(){const ep=document.getElementById('episode').value,q=document.getElementById('query').value.trim().toLowerCase();let visible=0;document.querySelectorAll('.episode').forEach(section=>{let count=0;section.querySelectorAll('.shot').forEach(s=>{const hit=(!ep||section.id===ep)&&(!q||s.textContent.toLowerCase().includes(q));s.hidden=!hit;if(hit){count++;visible++}});section.hidden=!count;section.querySelectorAll('.scene').forEach(sc=>sc.hidden=![...sc.querySelectorAll('.shot')].some(s=>!s.hidden))});document.getElementById('count').textContent='显示 '+visible+' 镜'}
function expandAll(open){document.querySelectorAll('.shot:not([hidden])').forEach(s=>s.open=open)}
function visitHash(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const el=document.getElementById(id);if(el){document.getElementById('episode').value='';document.getElementById('query').value='';filter();if(el.matches('.shot'))el.open=true;requestAnimationFrame(()=>el.scrollIntoView({block:'start'}))}}
const initialEpisode=new URLSearchParams(location.search).get('episode');if(initialEpisode&&[...document.getElementById('episode').options].some(o=>o.value===initialEpisode))document.getElementById('episode').value=initialEpisode;
window.addEventListener('hashchange',visitHash);filter();visitHash();
'''

def main():
    eps=load_episodes()
    total=sum(s['duration'] for e in eps for s in e['shots']);count=sum(len(e['shots']) for e in eps)
    prose=[f'# 《拒赔》当前{len(eps)}集剧情与选择\n\n16:9横屏；英语对白配中文。取材公开事件的虚构改编，配角、公司、拒赔支线、证据、对话与结局均为剧情设计。完整正文和镜头以season-plan.json编排及season内{len(eps)}份播出稿为准。场号和生产镜号保留制作定位；当前播出顺序见本页分集目录。\n']
    design=['# 《拒赔》逐镜导演设计\n\n16:9横屏；英语发声、中文对照。以下为当前逐镜文字设计，不是已拍摄影像。时长与声画同步须用实际素材复核。\n']
    html_parts=[];cuts=[];beat_rows=[];coverage=[];look_rows=[];movement_rows=[];source_rows=[]
    for episode_index,ep in enumerate(eps):
        eid=f'E{ep["number"]:02}';d=ep['dramaturgy'];seconds=sum(s['duration'] for s in ep['shots'])
        assert all(d.get(k) for k in LABELS),eid
        beat_rows.append({'episode':eid,'title':ep['title'],'plannedSeconds':seconds,**d})
        prose.extend([f'## {eid}《{ep["title"]}》 · {clock(seconds)}\n\n{ep["logline"]}\n','\n'.join(f'- **{label}**：{d[k]}' for k,label in LABELS.items())+'\n'])
        duration_note=ep.get('durationNote') or ep.get('durationException','')
        if duration_note:prose.append(f'时长说明：{duration_note}\n')
        design.append(f'## {eid}《{ep["title"]}》\n\n{ep["logline"]}\n')
        part=f'<section class="episode" id="{eid}"><div class="episode-head"><h2>{eid} · {H(ep["title"])}</h2><a href="{eid}.html">阅读完整双语剧本 ↗</a></div><p>{H(ep["logline"])}</p><div class="beats">'
        part+=''.join(f'<div class="beat"><span class="label">{label}</span><p>{H(d[k])}</p></div>' for k,label in LABELS.items())+'</div>'
        if duration_note:part+=f'<p class="scene-state">时长说明：{H(duration_note)}</p>'
        part+='<div class="timeline" aria-label="按时长比例显示本集镜头">'+''.join(f'<a class="segment" style="flex:{s["duration"]}" href="#{s["id"]}" title="{H(s["id"]+" · "+str(s["duration"])+"秒 · "+s["purpose"],quote=True)}" aria-label="{s["id"]}"></a>' for s in ep['shots'])+f'</div><div class="timescale"><span>00:00</span><span>{len(ep["shots"])}镜 · 设计时长 {clock(seconds)}</span></div>'
        cursor=0;starts={}
        for s in ep['shots']:starts[s['id']]=cursor;cursor+=s['duration']
        scmap={s['id']:s for s in ep['scenes']}
        scene_starts={sc['id']:min(starts[s['id']] for s in ep['shots'] if s['sceneId']==sc['id']) for sc in ep['scenes']}
        part+='<h3>单集推进</h3><p class="scene-state">段落标记用于审读，不要求插黑场或广告断点。时间是设计值，待读演与粗剪调整。</p><div class="beats">'
        for mi,m in enumerate(ep['movements']):
            start=scene_starts[m['startScene']];end=scene_starts[ep['movements'][mi+1]['startScene']] if mi+1<len(ep['movements']) else seconds
            movement_rows.append({'episode':eid,'movement':m['title'],'startSeconds':start,'endSeconds':end,**m})
            part+=f'<div class="beat"><span class="label">{clock(start)}–{clock(end)}</span><strong>{H(m["title"])}</strong><p>{H(m["question"])}</p><p>{H(m["turn"])}</p></div>'
            prose.append(f'### {clock(start)}–{clock(end)} · {m["title"]}\n\n问题：{m["question"]}\n\n变化：{m["turn"]}\n')
        part+='</div>'
        for sc in ep['scenes']:
            shots=[s for s in ep['shots'] if s['sceneId']==sc['id']]
            coverage.append({'episode':eid,'scene':sc['id'],'location':sc['location'],'time':sc['time'],'entry':sc['entry'],'exit':sc['exit'],'shots':','.join(s['id'] for s in shots)})
            part+=f'<section class="scene"><h3>{sc["id"]} · {H(sc["location"])} / {H(sc["time"])}</h3><p class="scene-state">入场：{H(sc["entry"])}<br>离场：{H(sc["exit"])}</p>'
            for label,key in [('本场争取','dramaticFunction'),('转折','turn'),('离场代价','exitCost'),('为什么停留/切走','sceneRhythm')]:
                if sc.get(key):part+=f'<p class="scene-state"><strong>{label}：</strong>{H(sc[key])}</p>'
            for s in shots:
                sid=s['id'];t=starts[sid];look=look_for(sc,s)
                for old in dict.fromkeys([sid,*s.get('sourceShotIds',[])]):source_rows.append({'sourceShot':old,'currentShot':sid,'broadcastEpisode':eid,'displayId':s['displayId'],'episodeSeconds':t})
                look_rows.append({'episode':eid,'scene':sc['id'],'shot':sid,'location':sc['location'],'time':sc['time'],'common':STYLE,'localLook':look,'mediaStatus':'pending_media'})
                assert all(s.get(k) for k in ['viewerEntry','viewerExit','cutTrigger']),sid
                fields=[('景别与机位','framing'),('前中后景','composition'),('摄影机与理由','camera'),('焦点与触发','focus'),('入镜状态','start'),('动作与表演','action'),('出镜状态','end'),('声音与声源','sound')]
                design.extend([f'### {sid} · {clock(t)}—{clock(t+s["duration"])} · {s["duration"]}秒\n\n场次：{sc["id"]} / {sc["location"]}\n\n目的：{s["purpose"]}\n\n观众原知：{s["viewerEntry"]}\n\n观众新知：{s["viewerExit"]}\n', '\n\n'.join(f'**{label}**：{s[key]}' for label,key in fields),f'\n\n**切点**：{s["cutTrigger"]}\n\n**接镜**：{s["next"]}\n'])
                design.append('\n\n**光色与材质**：'+look+'\n')
                for q in s['dialogue']:design.append(f'\n{q["speaker"]} → {q["listener"]}（{q["tone"]}；{q["start"]}—{q["end"]}秒）\n\n> {q["text"]}\n\n中文：{q["translationZh"]}\n')
                part+=f'<details class="shot" id="{sid}"><summary><span class="sid">{s["displayId"]}</span><span class="time">{clock(t)} · {s["duration"]}s</span><span class="purpose">{H(s["purpose"])}</span></summary><div class="shot-body"><p class="scene-state">制作定位：{sid} · 当前第{ep["number"]}集第{s["displayId"].split("-")[-1]}镜</p><div class="info"><p><span class="label">观众入镜前知道</span>{H(s["viewerEntry"])}</p><p><span class="label">这一镜改变了什么</span>{H(s["viewerExit"])}</p></div><div class="cut"><span class="label">在这里切走</span>{H(s["cutTrigger"])}</div><div class="fields">'
                part+=''.join(f'<p><span class="label">{label}</span>{H(s[key])}</p>' for label,key in fields)+'<p><span class="label">光色与材质</span>'+H(look)+'</p></div><div class="dialogue">'
                if not s['dialogue']:part+='<p class="no-dialogue">无对白；保留本镜指定环境与动作声音。</p>'
                for q in s['dialogue']:
                    part+=f'<div class="cue"><strong>{H(q["speaker"])} → {H(q["listener"])} · {q["start"]}–{q["end"]}s · {H(q["tone"])}</strong><div class="en">{H(q["text"])}</div><div class="zh">{H(q["translationZh"])}</div></div>'
                part+='</div>'
                if s.get('generationSegments'):
                    part+='<details><summary>技术生成段 · 不改变成片剪点</summary><p class="scene-state">下列各段共享本镜机位与表演方向。实际接续未验证；不得将独立文生候选直接当作无缝长镜成品。</p>'
                    offset=0
                    for gi,g in enumerate(s['generationSegments']):
                        part+=f'<p><strong>G{gi+1:02} · {offset}–{offset+g["duration"]}s</strong> · 生成 {g["duration"]+2}s<br>起态：{H(g["start"])}<br>动作：{H(g["action"])}<br>末态：{H(g["end"])}</p>'
                        offset+=g['duration']
                    part+='</details>'
                part+=f'<p><span class="label">接下一镜</span>{H(s["next"])}</p><div class="links"><a href="prompts/{sid}.txt">生成候选提示词</a><a href="prompts/{sid}-start-image.txt">静态起态备稿</a><a href="{eid}.html#{sid}">中英对照及复制按钮</a></div></div></details>'
            part+='</section>'
        part+='</section>';html_parts.append(part)
        for i,s in enumerate(ep['shots']):
            if i+1<len(ep['shots']):next_s=ep['shots'][i+1];next_sc=scmap[next_s['sceneId']];next_e=eid
            elif episode_index+1<len(eps):ne=eps[episode_index+1];next_s=ne['shots'][0];next_sc=next(x for x in ne['scenes'] if x['id']==next_s['sceneId']);next_e=f'E{ne["number"]:02}'
            else:next_s=None;next_sc=None;next_e=''
            cuts.append({'episode':eid,'shotA':s['id'],'locationA':scmap[s['sceneId']]['location'],'outStateA':s['end'],'cutTrigger':s['cutTrigger'],'authoredInterface':s['next'],'nextEpisode':next_e,'shotB':next_s['id'] if next_s else '', 'locationB':next_sc['location'] if next_sc else '', 'inStateB':next_s['start'] if next_s else '全剧结束','soundA':s['sound'],'soundB':next_s['sound'] if next_s else '', 'mediaStatus':'pending_media'})
    options=''.join(f'<option value="E{e["number"]:02}">E{e["number"]:02} · {H(e["title"])}</option>' for e in eps)
    doc=f'''<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>拒赔 · 剧情与剪辑总览</title><style>{CSS}</style><header><div class="eyebrow">DENIED / 拒赔 · 16:9 · ENGLISH + 中文对照</div><h1>剧情与剪辑总览</h1><p class="intro">{len(eps)}集短剧，{count}镜，计划{clock(total)}。从人物想得到什么，到观众知道什么，再到为什么在这里切镜。每集可查看完整剧本，每镜可展开表演、空间、摄影和英文对白。EP开头编号表示当前播出顺序；旧E开头镜号作为资产制作定位保留。</p><nav><a href="index.html">完整制作包</a><a href="scripts/all-episodes-bilingual.md">双语剧本合订本</a><a href="storyboard-design.md">逐镜设计全文</a><a href="editorial/cut-interface.csv">相邻剪点对照表</a><a href="asset-inventory.html">资产清单</a><a href="reference-and-style.html">美剧参考、对白与调色</a><a href="short-drama-rhythm-plan.md">短剧节奏调整依据</a><a href="us-series-rhythm-research.md">美剧节奏研究</a><a href="editorial/episode-movements.csv">段落节奏表</a><a href="editorial/generation-segments.csv">生成段与采用窗</a></nav></header><main><div class="controls"><label for="episode">分集</label><select id="episode" onchange="filter()"><option value="">全部{len(eps)}集</option>{options}</select><input id="query" aria-label="搜索镜头" placeholder="搜索镜号、人物、道具或台词" oninput="filter()"><button onclick="expandAll(true)">展开镜头</button><button onclick="expandAll(false)">收起</button><span class="count" id="count"></span></div>{''.join(html_parts)}<footer>当前为剧本与导演设计。摄影图板为规划示意；演员、录音、视频、实测节奏和试剪均待实际媒体。英文逐句发声，中文只用于阅读与字幕。</footer></main><script>{JS}</script></html>'''
    table('editorial/visual-direction.csv',look_rows)
    table('editorial/episode-movements.csv',movement_rows)
    table('editorial/source-shot-map.csv',source_rows)
    write('storyboard.html',doc);write('storyboard-design.md','\n'.join(design));write('story-outline.md','\n'.join(prose))
    table('editorial/episode-beats.csv',beat_rows);table('editorial/cut-interface.csv',cuts);table('editorial/scene-coverage.csv',coverage)
    print(json.dumps({'episodes':len(eps),'shots':count,'cutRows':len(cuts),'scenes':len(coverage),'seconds':total,'scope':'authored_design_only'}))

if __name__=='__main__':main()
