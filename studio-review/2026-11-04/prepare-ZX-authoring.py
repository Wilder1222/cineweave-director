"""Mechanical source alignment only. All creative decisions/review observations are authored separately."""
import json,re,hashlib,difflib
from pathlib import Path
B=Path(__file__).parent
inv=json.loads((B/'local-inventory.json').read_text(encoding='utf8'))
out={}; legacy=[]
for topic in inv['topics']:
    tid=topic['topic_id']
    if tid[0] not in 'ZX': continue
    p=B/'studio-current'/topic['original_studio_project_id']; idx=json.loads((p/'index.json').read_text(encoding='utf8'))
    docs=idx['documents']
    for d in docs:
        raw=(p/d['file']).read_bytes()
        assert hashlib.sha256(raw).hexdigest()==d['sha256']
    expected=3 if tid in ['Z009','X007','X009'] else 4
    assert len(docs)==expected
    # UI directory inventory and every edit/readback were already checked in the export task.
    idx['exportComplete']=True; idx['exportDocumentCount']=len(docs)
    idx['exportCompletenessBasis']='UI directory inventory equals every document edit/readback; 22-project export completed before this annotation'
    (p/'index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2),encoding='utf8')
    new=[d for d in docs if '20261031' in d['title']]
    script=next(d for d in new if '｜剧本｜' in d['title'])
    board=next(d for d in new if '｜分镜与视频提示｜' in d['title'])
    review=next(d for d in new if '｜审阅与来源｜' in d['title'])
    lines=(p/board['file']).read_text(encoding='utf8').splitlines()
    starts=[i for i,l in enumerate(lines) if re.match(r'^## '+tid+r'[-－]',l)]
    shots=[]
    for n,start in enumerate(starts):
        end=starts[n+1] if n+1<len(starts) else next((i for i in range(start+1,len(lines)) if lines[i].startswith('## ')),len(lines))
        block=lines[start:end]; text='\n'.join(block)
        sid=re.sub(r'^## '+tid+r'[-－]','',block[0]).split('｜')[0].strip()
        # CSV is the explicit current timing authority, not duration inference.
        row=next(l for l in lines if l.startswith(sid+',') or l.startswith(tid+'-'+sid+','))
        duration=int(row.split(',')[3])
        def field(label): return next((l[len(label):] for l in block if l.startswith(label)), '')
        if tid.startswith('Z'):
            title=field('目的/观众新信息：');ent=field('入态：')
            action_start=next(i for i,l in enumerate(block) if l.startswith('本镜为'))+1
            action='\n'.join(block[action_start:next(i for i in range(action_start,len(block)) if block[i].startswith('摄影：'))])
            shot=dict(id=sid,title=title,startLine=start+1,endLine=end,duration=duration,entry=ent,exit=field('出点/承接：'),camera=field('机位：'),motion=field('摄影机：'),focus=field('焦点：'),trigger=field('刺激：'),action=action,sound=field('声音：'),constraint=field('时间审校：'))
        else:
            entryline=next(l for l in block if l.startswith('镜'))
            ent=entryline.split('入态：',1)[1] if '入态：' in entryline else entryline
            title=entryline.split('：',1)[1].split('。入态')[0]
            shot=dict(id=sid,title=title,startLine=start+1,endLine=end,duration=duration,entry=ent,exit=field('出态：'),camera=field('摄影：'),action=field('行动与原对白：') or field('行动与完整对白：'),sound=field('声音：'),constraint=field('约束与未验项：'))
        shots.append(shot)
    out[tid]={'title':topic['title'],'projectId':idx['projectId'],'script':script['documentId'],'board':board['documentId'],'review':review['documentId'],'shots':shots,'scriptText':(p/script['file']).read_text(encoding='utf8')}
    old=[d for d in docs if '20261031' not in d['title']]
    if old:
        a=Path(topic['indexed_storyboard']['path']).read_text(encoding='utf8').replace('\ufeff','').strip()
        b=(p/old[0]['file']).read_text(encoding='utf8').replace('\ufeff','').strip()
        same=a==b
        legacy.append({'topic':tid,'normalizedEqual':same,'documentId':old[0]['documentId'],'local':topic['indexed_storyboard']['path'],'diff':[] if same else list(difflib.unified_diff(a.splitlines(),b.splitlines(),n=2))})
(B/'ZX-authoring-input.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
(B/'ZX-legacy-alignment.json').write_text(json.dumps(legacy,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'topics':len(out),'shots':sum(len(v['shots']) for v in out.values()),'legacy':len(legacy),'legacyEqual':sum(v['normalizedEqual'] for v in legacy),'legacyDiffs':[v for v in legacy if not v['normalizedEqual']]},ensure_ascii=False))
