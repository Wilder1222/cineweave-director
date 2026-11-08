"""Render the current, source-linked research collection. No story source is changed."""
from pathlib import Path
from collections import Counter
from html import escape
from urllib.parse import urlsplit
import hashlib
import json

ROOT = Path(__file__).resolve().parent
FILES = ['source-infant.json', 'source-zh.json', 'source-toddler.json', 'source-supplement.json']
CLEAR = set('ZH01 ZH02 ZH03 ZH06 IN01 IN02 IN03 IN04 IN05 IN06 IN07 TD02 TD03 TD04 TD05 TD07 RT01 RT03 RT05'.split())
INFANT = set('ZH01 ZH02 ZH03 IN01 IN02 IN04 IN05 IN06 IN07 IN08 RT01 RT05 RT07'.split())
TIME = {
 'ZH01':'单次片段','ZH02':'醒后习惯','ZH03':'反复观察','ZH04':'跨时段改玩法','ZH05':'跨月成长','ZH06':'跨几日变化',
 'IN01':'单次事件与事后补充','IN02':'反复游戏','IN03':'反复游戏','IN04':'单次洗澡事件','IN05':'反复习惯与当天例子','IN06':'反复游戏','IN07':'跨两日跟帖','IN08':'反复经验回顾',
 'TD01':'失物发现；未目击藏入','TD02':'同日下午至睡前','TD03':'单次睡前互动','TD04':'家庭角色游戏习惯','TD05':'反复亲子暗号','TD06':'跨月误会与习惯','TD07':'家务协作习惯','TD08':'家务习惯回顾',
 'RT01':'当天事件与原因发现','RT02':'当天观察与事后发现','RT03':'单次包裹互动','RT04':'习惯中的一次发现','RT05':'两次连续提问','RT06':'当天反复邀请','RT07':'反复习惯与当天后续',
}
LABEL = {'infant':'作者自报0—12个月','toddler':'作者自报13—36个月／1—3岁','unknown':'该篇月龄未确认'}
STEPS = [('setup','前情'),('babyAction','孩子行动'),('adultResponse','成人回应／行动'),('outcome','后续／结果')]
NOTE = '已核读公开家长自述的目标正文或评论；事件、年龄和日期以作者叙述为限，未作独立事实核验。未观看原始视频，不把图片、检索摘要或科普举例当现场证据。'

def lines(value):
    if isinstance(value, list): return [str(x) for x in value]
    return [str(value)] if value else []

def para(value):
    return ''.join('<p>'+escape(x)+'</p>' for x in lines(value))

def main():
    cases, rejected, errors = [], [], []
    for name in FILES:
        data = json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
        for c in data['cases']:
            c['inventorySourceFile'] = name
            c['ageBucket'] = 'unknown' if c['id']=='IN03' else ('infant' if c['id'] in INFANT else 'toddler')
            c['interactionClarity'] = 'A' if c['id'] in CLEAR else 'B'
            c['clarityLabel'] = '互动链较清楚' if c['id'] in CLEAR else '需补现场细节'
            c['timeForm'] = TIME[c['id']]
            c['truthStatus'] = '已读第一人称公开自述；事件未独立证实'
            if not c.get('processCompleteness'):
                c['processCompleteness'] = c['clarityLabel']+'；缺项详见记录，不等于事件已获证实。'
            cases.append(c)
        rejected.extend({'inventorySourceFile':name, **x} for x in data.get('excluded',[]))
    ids = [x['id'] for x in cases]
    if len(ids)!=len(set(ids)): errors.append('duplicate IDs')
    if len(cases)!=29: errors.append('expected current batch of 29')
    for c in cases:
        for key in ['title','ageReported','source','process','evidenceNote','missingDetails','creativeInference','limitations']:
            if not c.get(key): errors.append(c['id']+': missing '+key)
        s=c['source']
        if urlsplit(s['url']).scheme not in ('http','https'): errors.append(c['id']+': invalid source URL')
        if s.get('firstPerson') is not True: errors.append(c['id']+': not self-report')
        for key in ['title','platform','author','published','readLevel']:
            if not s.get(key): errors.append(c['id']+': missing source '+key)
        for key,_ in STEPS:
            if not c['process'].get(key): errors.append(c['id']+': missing process '+key)
    counts=Counter(c['source']['url'] for c in cases)
    if max(counts.values())>2: errors.append('more than two entries from one page')
    if errors: raise ValueError(errors)
    priority=['RT07','RT01','IN03','IN05','ZH01','IN02','RT03','TD07']
    cases.sort(key=lambda c:(0,priority.index(c['id'])) if c['id'] in priority else (1,c['ageBucket'],c['id']))
    report={'collectedAt':'2026-11-08','cases':len(cases),'uniqueSourcePages':len(counts),'ageBuckets':dict(Counter(c['ageBucket'] for c in cases)),
            'interactionClarity':dict(Counter(c['interactionClarity'] for c in cases)),'excludedOrUnselectedRecords':len(rejected),
            'note':NOTE,'videoObserved':False,'existingStoriesModified':False,'errors':[]}
    report['sourceFileHashes']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in FILES}
    payload={'metadata':report,'cases':cases,'excluded':rejected}
    (ROOT/'experiences.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    md=['# 婴幼儿亲述趣事：首批研究素材','', '采集日期：2026-11-08。'+NOTE,'',
        f"共{len(cases)}条素材、{len(counts)}个原文页面。A={sum(c['interactionClarity']=='A' for c in cases)}条互动链较清楚；B={sum(c['interactionClarity']=='B' for c in cases)}条需补现场细节。A/B只表示文字过程的清楚程度，不是真实性评分。",'',
        '原文未交代的手位、语气、动机和结尾不补成事实；习惯和跨日变化不拼成一次现场。相对日期按本次返回的页面或缓存记录，不倒算精确发表日。创作推论单列，尚未采用为正式选题；本次没有改写现有32条剧情。','',
        '[筛选浏览页](index.html) · [完整数据](experiences.json) · [检查结果](validation.json)','']
    cards=[]
    for c in cases:
        s=c['source']; sid=c['id']
        md += [f"## {sid} {c['title']}",'',f"年龄：{c['ageReported']} ｜ {c['clarityLabel']} ｜ {c['timeForm']}",'',
               f"来源：[{s['title']}]({s['url']})；{s['platform']}；作者：{s['author']}；日期：{s['published']}。",'']
        md += [f"{i}. **{label}：**{c['process'][key]}" for i,(key,label) in enumerate(STEPS,1)]
        md += ['',f"核读依据：{c['evidenceNote']}",'',f"读取范围：{s['readLevel']}",'','原文缺项：']
        md += ['- '+x for x in lines(c['missingDetails'])]
        md += ['',f"创作推论（与原文事实分开）：{c['creativeInference']}",'','边界：']+['- '+x for x in lines(c['limitations'])]+['']
        if s.get('ageSourceUrl'): md += [f"年龄旁证：[同系列自报月龄]({s['ageSourceUrl']})。",'']
        if s.get('licenseNote'): md += [f"来源许可标注：{s['licenseNote']}。",'']
        process=''.join(f'<li><b>{label}</b><p>{escape(c["process"][key])}</p></li>' for key,label in STEPS)
        missing=''.join('<li>'+escape(x)+'</li>' for x in lines(c['missingDetails']))
        supplementary=''
        if s.get('ageSourceUrl'): supplementary+='<p>年龄旁证：<a href="'+escape(s['ageSourceUrl'],quote=True)+'" target="_blank" rel="noopener noreferrer">同系列月龄记录</a></p>'
        if s.get('licenseNote'): supplementary+=para('来源许可标注：'+s['licenseNote'])
        cards.append(f'''<article id="{sid}" data-age="{c['ageBucket']}" data-clarity="{c['interactionClarity']}">
<div class="overline">{sid} · {escape(c['clarityLabel'])} · {escape(c['timeForm'])}</div><h2>{escape(c['title'])}</h2>
<p class="age">{escape(c['ageReported'])}</p><ol class="process">{process}</ol>
<div class="source">原文：<a href="{escape(s['url'],quote=True)}" target="_blank" rel="noopener noreferrer">{escape(s['title'])}</a><p>{escape(s['platform'])} · {escape(s['author'])} · {escape(s['published'])}</p></div>
<details><summary>核读依据、缺项与创作推论</summary><h3>原文核读</h3>{para(c['evidenceNote'])}{para(s['readLevel'])}{supplementary}<h3>原文缺项</h3><ul>{missing}</ul><h3>创作推论 · 尚未采用</h3>{para(c['creativeInference'])}<h3>真实性与适用边界</h3>{para(c['limitations'])}</details></article>''')
    md+=['## 未进入已读案例的线索及排除记录','','以下不计入29条：打不开的原文、只读到摘要、只有嵌入视频而未播放、过程不足及本批未选内容。','']
    for e in rejected:
        u=e.get('url') or e.get('sourceUrl') or e.get('source_url')
        reason=e.get('reason') or e.get('reasonExcluded') or e.get('note') or json.dumps(e,ensure_ascii=False)
        md.append(f"- [{e.get('title') or '线索'}]({u})：{reason}" if u else '- '+str(reason))
    (ROOT/'research.md').write_text('\n'.join(md)+'\n',encoding='utf-8')
    css='''*{box-sizing:border-box}body{margin:0;background:#faf7f1;color:#30383b;font:16px/1.8 "Microsoft YaHei","PingFang SC",sans-serif}main{max-width:1040px;margin:auto;padding:36px 24px 80px}h1{font-size:30px;line-height:1.4;margin:10px 0 15px}h2{font-size:23px;line-height:1.5;margin:6px 0}h3{font-size:15px;margin:20px 0 4px;color:#7e4c3c}a{color:#8e503e}p{margin:6px 0}.intro{max-width:850px}.stats{color:#7e4c3c;font-weight:bold}.muted{font-size:13px;color:#66747a}.toolbar{position:sticky;top:0;z-index:2;background:#faf7f1;padding:15px 0;display:flex;gap:9px;flex-wrap:wrap;border-bottom:1px solid #d9d1c5}input,select{font:inherit;padding:8px;border:1px solid #cfc5b7;border-radius:5px;background:#fffdf9;color:#30383b}input{flex:1;min-width:200px}article{margin-top:22px;padding:24px 27px;background:#fffdf9;border:1px solid #ded4c4;border-radius:7px;scroll-margin-top:110px}.overline{font-size:12px;color:#8e503e}.age{font-size:13px;color:#68757a}.process{padding-left:23px}.process li{padding-left:5px;margin:13px 0}.process b{font-size:13px;color:#766257}.process p{margin:1px 0}.source{border-top:1px solid #e3dbcf;padding-top:13px;font-size:13px}.source p{color:#68757a}details{margin-top:16px;padding-top:12px;border-top:1px solid #e3dbcf;font-size:14px}summary{cursor:pointer;color:#8e503e}details p,details li{line-height:1.85}.notice{border-left:3px solid #c58e73;padding:10px 16px;background:#eee8dc;margin:20px 0}.downloads{display:flex;gap:15px;flex-wrap:wrap;margin:20px 0}[hidden]{display:none!important}@media(max-width:600px){main{padding:22px 14px 60px}h1{font-size:25px}article{padding:20px 17px}input{min-width:100%;width:100%}.toolbar select{max-width:100%;font-size:14px}}'''
    js='''const cards=[...document.querySelectorAll('article[data-age]')];const search=document.querySelector('#search'),age=document.querySelector('#age'),clarity=document.querySelector('#clarity');function filter(){const q=search.value.trim().toLowerCase();let n=0;cards.forEach(c=>{const ok=(age.value==='all'||age.value===c.dataset.age)&&(clarity.value==='all'||clarity.value===c.dataset.clarity)&&c.textContent.toLowerCase().includes(q);c.hidden=!ok;if(ok)n++});document.querySelector('#found').textContent=n+' / '+cards.length+' 条';document.querySelector('#empty').hidden=n!==0}search.addEventListener('input',filter);age.addEventListener('change',filter);clarity.addEventListener('change',filter);filter();'''
    html=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>澈澈素材研究 · 婴幼儿亲述趣事</title><style>{css}</style></head><body><main><div class="overline">澈澈短片 · 原始生活素材研究 · 2026-11-08</div><h1>先留下事情本来的过程</h1><p class="intro">从家长本人日记、论坛主帖与具体评论中采集。先看发生了什么、孩子怎样行动、大人怎样回应、后来如何，再决定是否创作成澈澈的故事。</p><p class="stats">29 条素材 · {len(counts)} 个原文页面 · {sum(c['ageBucket']=='infant' for c in cases)} 条自报0—12个月 · {sum(c['ageBucket']=='toddler' for c in cases)} 条幼儿阶段 · 1 条月龄未确认</p><div class="notice"><p>{NOTE}</p><p class="muted">A/B仅表示文字互动链的清楚程度。跨日、跨月和习惯性记录已标明；没有把原文缺少的对白、动作或结尾补成事实。本次素材尚未采用为正式选题。</p></div><div class="downloads"><a href="research.md">全部文字稿与排除记录</a><a href="experiences.json">结构化数据</a><a href="validation.json">采集检查</a><a href="../../seedance25/index.html">已有剧情与提示词</a></div><div class="toolbar"><input id="search" aria-label="搜索趣事、动作或来源" placeholder="搜索：抓眼镜、奶瓶、躲猫猫、拼图…"><select id="age" aria-label="年龄筛选"><option value="all">全部年龄</option><option value="infant">自报0—12个月</option><option value="toddler">幼儿阶段</option><option value="unknown">月龄未确认</option></select><select id="clarity" aria-label="过程筛选"><option value="all">全部过程</option><option value="A">A · 互动链较清楚</option><option value="B">B · 需补现场细节</option></select><span id="found" class="muted"></span></div><p id="empty" hidden>没有匹配的素材，试着缩短关键词或切换筛选。</p>{''.join(cards)}<p class="muted">公开可阅读不等于取得原图片、视频、录音或商业改编许可。这里只保存必要转述和出处；来源页面上的育儿评价不作为一般规律。</p></main><script>{js}</script></body></html>'''
    (ROOT/'index.html').write_text(html,encoding='utf-8')
    (ROOT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'README.md').write_text('# 婴幼儿亲述素材库\n\n'+NOTE+'\n\n- [筛选浏览页](index.html)\n- [全部29条过程及排除记录](research.md)\n- [合并数据](experiences.json)\n- [检查结果](validation.json)\n\n四份source-*.json是当前采集记录；build_research.py仅从这些记录派生阅读页，不改动已有32条故事。相对日期保留检索页/缓存所显示的表述，不推算精确发表日。年龄不详、现场缺项、跨日/跨月及创作推论分别标注。\n',encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__':
    main()
