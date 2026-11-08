from season import load_episodes, episode_for_shot, shot_aliases
from pathlib import Path
import json, csv, html
from visual_direction import STYLE, LOOKS, time_rule

ROOT=Path(__file__).resolve().parent
H=html.escape
REFS=[
 ('风骚律师','Better Call Saul','98%','96%','10,000+','https://www.rottentomatoes.com/tv/better_call_saul','律师如何现场换一种问法；让纸页、座位和对手反应推动谈判。'),
 ('东城梦魇','Mare of Easttown','95%','94%','1,000+','https://www.rottentomatoes.com/tv/mare_of_easttown','家庭成员先处理自己当天的事；窗光和现有灯具保留生活质感。'),
 ('罪夜之奔','The Night Of','94%','93%','1,000+','https://www.rottentomatoes.com/tv/the_night_of','有限视线和机构空间施加压力；暗部保留人物与关键持物。'),
 ('继承之战','Succession','95%','88%','5,000+','https://www.rottentomatoes.com/tv/succession','仅用于公司与媒体的权力话术、回避与观察性构图。')]

def save(name,s):
    p=ROOT/name
    if not p.exists() or p.read_text(encoding='utf-8')!=s:p.write_text(s,encoding='utf-8')

def build():
    eps=load_episodes()
    cues={q['id']:(q,s['id']) for e in eps for s in e['shots'] for q in s['dialogue']}
    docs=['# 《拒赔》视觉与调色执行手册\n\n2026-11-08；16:9横屏，英语发声、中文对照。此为原创设计参数，不是原剧LUT或已完成的媒体匹配。\n',
          '## 统一方向\n\n'+STYLE+'\n\n摄影机与演员调度保持逐镜决定，风格不能覆盖场景时段或物件状态。参考职责与证据边界见reference-visual-research.md，口语方案见dialogue-style-guide.md。\n',
          '## 调色顺序与判断\n\n先确认输入素材真实色彩空间/传递函数，再做正确转换和曝光/白平衡匹配；素材尚无，当前不指定虚假的Log、LUT或摄影机。以同场人物、白纸及中性色物件校准反打，再调环境饱和度与局部冷暖，保留不同肤色。最后用实际播放检查颗粒、锐化、暗部噪声和服装颜色连续。\n\n不将某个HEX作为固定肤色目标，不设未经素材验证的IRE或曝光补偿。橙衣应与面部区分、红毛衣保针织、黑包不融进黑裤、纸白有折边；暗景能暗但动作可辨。\n',
          '## 地点执行\n\n|地点|本剧光色与材质规则|\n|---|---|']
    docs += [f'|{k}|{v}|' for k,v in LOOKS.items()]
    docs += ['\n## 时段与复用\n\n白天/夜间共用一个地点的世界方向，不共用不成立的光源。夜间场景以正文实际灯具为准，不能照抄空间母稿里的白天窗光。傍晚保留暮光过渡，E12签署为上午11:20，不再沿用旧下午低光。E01/E06是同次押送，同天气、服装、光比和声源；反打不得改变物理方向。\n',
             '## 可查看的设计成果\n\n六张SVG/PNG设计卡位于visual/；reference-and-style.html集中展示参考职责与卡片；editorial/visual-direction.csv逐镜列出当前全部镜头的共同规则与地点/时段变体；每镜视频和静帧备稿都带完整必要光色说明。\n',
             '## 实际试片验收\n\n选择押送、红毛衣法庭、玛拉家、诊所深肤色医生、夜间编辑部和夜间咖啡馆做样片；检查身份、混光肤色、关键物材质、暗部、白纸、相邻反打及运动连续。先解决源素材曝光/白平衡，再统一调色。眼睛被反光遮住、橙衣溢出、纸件不可读、黑包消失、同场色温跳变或夜景出现白昼窗光均须返修。\n\n本轮只有剧本、提示词与矢量设计；没有真人资产、声音、视频或实际LUT。六视角文字检查不等于摄影/表演/调色验收。\n']
    save('visual-style-guide.md','\n'.join(docs))
    css='''*{box-sizing:border-box}body{margin:0;background:#f3f0e8;color:#263039;font:16px/1.8 "Segoe UI","Microsoft YaHei",sans-serif}header,main,footer{max-width:1180px;margin:auto;padding:32px}header{border-bottom:1px solid #c5bdad}.eyebrow{font-size:12px;letter-spacing:.14em;color:#8b563e}h1{font:44px Georgia,serif;margin:12px 0}h2{font-size:25px;margin:40px 0 16px}p{max-width:960px}a{color:#6b2933}nav{display:flex;flex-wrap:wrap;gap:12px 24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{padding:24px;background:#fffdf8;border:1px solid #d6cdbd}.card h3{margin:0}.small{font-size:13px;color:#626e74}.scores{font-variant-numeric:tabular-nums}.en{font:22px/1.5 Georgia,serif}.zh{color:#61686b}.art{margin:24px 0;padding:12px;background:#fffdf8;border:1px solid #d6cdbd}img{width:100%;height:auto;display:block}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #cfc7b9;text-align:left;padding:14px;vertical-align:top}td:first-child{width:180px}summary{cursor:pointer;font-weight:600;padding:16px 0}.callout{border-left:4px solid #6b2933;padding:8px 20px;background:#eee7dc}@media(max-width:700px){.grid{grid-template-columns:1fr}header,main,footer{padding:20px}h1{font-size:34px}td:first-child{width:110px}}'''
    body=f'<header><div class="eyebrow">DENIED / 创作参考与执行 · 2026.11.08</div><h1>让人说人话，让光有来处。</h1><p>{len(eps)}集短剧保持同一现实悬疑基调。对白根据人物此刻要办成的事调整，摄影与光色根据空间、时间和信息变化确定。</p><nav><a href="storyboard.html">剧情与分镜总览</a><a href="index.html">完整制作包</a><a href="scripts/all-episodes-bilingual.md">全剧双语剧本</a><a href="asset-inventory.html">资产清单</a></nav></header><main>'
    body+='<h2>四部参考，各有职责</h2><p class="small">Rotten Tomatoes总页在2026-11-07显示的平均好评率；百分比不是十分制分数，评价数不是收视人数，也不表示当日热播排名。</p><div class="grid">'
    for zh,en,critic,aud,n,url,use in REFS:
        body+=f'<article class="card"><h3>{zh} <span class="small">{en}</span></h3><p class="scores">评论家 {critic} · 观众 {aud} · 观众评价 {n}</p><p>{use}</p><a href="{url}">查看评分来源 ↗</a></article>'
    body+='</div><p>方法依据主创、摄影师及调色师访谈；本次仅实际观察《罪夜之奔》一张访谈配图，其余没有逐镜看片。全部颜色和图形是《拒赔》的原创设计。</p><nav><a href="dialogue-style-guide.md">对白原则与来源</a><a href="reference-visual-research.md">摄影研究与证据范围</a><a href="visual-style-guide.md">完整光色手册</a></nav>'
    body+='<h2>人物在眼前的事里说话</h2><p>保留法庭上的准确正式语言；会见、厨房和编辑部允许回避、追问与当场改口。下面摘自本轮当前源稿，完整动作与前后回应可点镜号查看。</p><div class="grid">'
    for qid in ['E03-D008','E05-D111','E11-D009','E18-D002','E20-D006','E24-D013']:
        if qid not in cues:continue
        q,sid=cues[qid]
        body+=f'<div class="card"><span class="small">{H(q["speaker"])} → {H(q["listener"])} · <a href="storyboard.html#{sid}">{sid}</a></span><p class="en">{H(q["text"])}</p><p class="zh">{H(q["translationZh"])}</p><p class="small">{H(q["tone"])}</p></div>'
    body+=f'</div><h2>{len(eps)}集短剧中的场景节奏</h2><p>冷开提出后果，完整场景让人物尝试、受阻、改办法；集尾落在选择的代价。成片镜头与生成候选分开管理，技术段边界不充当剪点。</p><p><a href="us-series-rhythm-research.md">七篇主创与剪辑师访谈及迁移边界</a> · <a href="short-drama-rhythm-plan.md">短剧场景与分镜节奏执行稿</a> · <a href="editorial/episode-movements.csv">各集段落节奏</a> · <a href="editorial/generation-segments.csv">生成段与采用窗口</a></p><h2>一套基准，随空间变化</h2><p class="callout">'+H(STYLE)+'</p><p>六张卡片是可审阅的设计示意。真实演员、材质、曝光、声音及调色效果需要实际样片验证。</p>'
    for stem,title in [('style-card','空间与构图'),('palette-card','环境色、叙事色与肤色'),('material-card','各自不同的材质'),('lighting-card','有来源的光'),('light-plot','不变的世界方向'),('lookdev-test-board','实际试片需要回答的问题')]:
        body+=f'<figure class="art"><img src="visual/{stem}.svg" alt="{title}的矢量设计示意"><figcaption class="small">{title} · <a href="visual/{stem}.png">查看PNG</a></figcaption></figure>'
    body+='<details><summary>展开21个场景的光色执行规则</summary><table><tr><th>场景编码</th><th>本剧执行</th></tr>'+''.join(f'<tr><td>{k}</td><td>{H(v)}</td></tr>' for k,v in LOOKS.items())+'</table></details><nav><a href="editorial/visual-direction.csv">当前全部镜头光色映射表</a><a href="test-plan.md">试片计划</a><a href="review/short-drama-rhythm-review.md">短剧节奏审读结果</a></nav></main><footer>当前交付为完整文本与设计，不代表媒体生成、演员表演或调色匹配已经完成。</footer>'
    save('reference-and-style.html',f'<!doctype html><html lang="zh"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>拒赔 · 美剧参考、对白与光色</title><style>{css}</style>{body}</html>')
    print(json.dumps({'referenceShows':4,'locations':len(LOOKS),'cards':6,'mediaVerified':False}))

if __name__=='__main__':build()
