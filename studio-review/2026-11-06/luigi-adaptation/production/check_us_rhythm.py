"""Cross-artifact checks for the user-selected 24 short episodes."""
from pathlib import Path
from collections import Counter
import csv,hashlib,json,re
from season import load_episodes, shot_aliases
from generation_plan import segments_for,camera_overrides
R=Path(__file__).resolve().parent

def main():
    eps=load_episodes();errors=[];stats=[];ids=[];cues=[];scs={};longs=[];candidates={}
    if [e['number'] for e in eps]!=list(range(1,25)):errors.append('User-locked 24 episode inventory')
    baseline=json.loads((R/'review/24-episode-baseline.json').read_text(encoding='utf-8'))
    raw=[json.loads(p.read_text(encoding='utf-8')) for p in sorted((R/'episodes').glob('E??.json'))]
    hashfn=lambda x:hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True).encode('utf-8')).hexdigest()
    script_hash=hashfn({s['id']:s['script'] for e in raw for s in e['scenes']})
    shot_content={s['id']:{k:v for k,v in s.items() if k!='next'} for e in raw for s in e['shots']}
    shot_hash=hashfn(shot_content)
    adjustments=json.loads((R/'review/24-episode-boundary-adjustments.json').read_text(encoding='utf-8'))['changes']
    for change in adjustments:
        target=shot_content[change['shotId']]
        for key in change['path'][:-1]:target=target[key]
        key=change['path'][-1]
        if target[key]!=change['after']:errors.append('Boundary correction missing: '+change['shotId']+' '+str(change['path']))
        target[key]=change['before']
    normalized_shot_hash=hashfn(shot_content)
    if script_hash!=baseline['scriptSha256']:errors.append('Scene prose changed during format-only revision')
    if normalized_shot_hash!=baseline['shotContentSha256']:errors.append('Shot/dialogue content changed beyond declared orientation metadata corrections')
    for ep in eps:
        total=sum(s['duration'] for s in ep['shots']);scene_lengths=[]
        if not 150<=total<=360:errors.append(f'EP{ep["number"]}: short episode duration {total}')
        for sc in ep['scenes']:
            scs[sc['id']]=sc
            shotlist=[s for s in ep['shots'] if s['sceneId']==sc['id']]
            scene_lengths.append(sum(s['duration'] for s in shotlist))
            for key in ['dramaticFunction','turn','exitCost','sceneRhythm']:
                if not sc.get(key):errors.append(f'{sc["id"]}: missing {key}')
            en=re.findall(r'（[^）\n]*英语[^）\n]*）：\s*([^\n]+)',sc['script'])
            zh=re.findall(r'中文对照：\s*([^\n]+)',sc['script'])
            if [x.strip() for x in en]!=[q['text'].strip() for s in shotlist for q in s['dialogue']]:errors.append(f'{sc["id"]}: EN sequence')
            if [x.strip() for x in zh]!=[q['translationZh'].strip() for s in shotlist for q in s['dialogue']]:errors.append(f'{sc["id"]}: ZH sequence')
        for sh in ep['shots']:
            ids.append(sh['id']);cues.extend(q['id'] for q in sh['dialogue'])
            try:parts=segments_for(sh)
            except AssertionError as ex:errors.append(str(ex));continue
            for part in parts:candidates[part['candidateId']]=part
            if sh['duration']>26:longs.append({'episode':ep['number'],'shot':sh['id'],'seconds':sh['duration'],'segments':len(parts),'purpose':sh['purpose'],'cutTrigger':sh['cutTrigger']})
        stats.append({'episode':ep['number'],'title':ep['title'],'seconds':total,'scenes':len(ep['scenes']),'shots':len(ep['shots']),'longShots':sum(s['duration']>26 for s in ep['shots']),'scenesAtLeast120s':sum(n>=120 for n in scene_lengths),'dialogueLines':sum(len(s['dialogue']) for s in ep['shots'])})
    for label,seq in [('shots',ids),('cues',cues)]:
        if len(seq)!=len(set(seq)):errors.append(f'duplicate {label}: '+str([x for x,n in Counter(seq).items() if n>1]))
    if any(len(ep['movements'])<2 for ep in eps):errors.append('Episode movement coverage missing')
    sequence=[s['id'] for ep in eps for s in ep['scenes']]
    if sequence.index('E18-SC01')!=sequence.index('E15-SC04')+1:errors.append('Correction delayed after source confrontation')
    if sequence.index('E21-SC01')>=sequence.index('E22-SC02'):errors.append('Queue proof must precede plea')
    if next(ep['number'] for ep in eps if any(s['id']=='E21-SC01' for s in ep['scenes']))!=21:errors.append('Queue proof disclosed outside planned late phase')
    alltext='\n'.join(s['script'] for ep in eps for s in ep['scenes'])
    for exact in ['I intended to kill him.','He died because I shot him.','Leave it on my desk. Not the kitchen table. We can fix it Saturday.']:
        if alltext.count(exact)!=1:errors.append('Required exact once: '+exact)
    if 'Tomorrow' in scs['E12-SC02']['script']:errors.append('Settlement noon deadline inconsistent')
    aliases=shot_aliases(eps)
    if (R/'asset-inventory.json').exists():
        inv=json.loads((R/'asset-inventory.json').read_text(encoding='utf-8'))
        if inv['sourceShots']!=len(ids) or inv['sourceEpisodes']!=len(eps):errors.append('Stale asset inventory')
        for row in inv['rows']:
            if any(x and x not in ids for x in row['shotRefs'].split(',')):errors.append('Retired asset ref: '+row['assetId'])
    actual={p.stem for p in (R/'requests').glob('E??-SH*.json')}
    if actual!=set(candidates):errors.append({'candidateInventory':{'missing':sorted(set(candidates)-actual),'orphaned':sorted(actual-set(candidates))}})
    for cid,part in candidates.items():
        rp=R/'requests'/f'{cid}.json';pp=R/'prompts'/f'{cid}.txt'
        if not rp.exists() or not pp.exists():continue
        req=json.loads(rp.read_text(encoding='utf-8'))
        if req['duration']!=part['duration']+2 or req['duration']>30:errors.append(cid+': request duration')
        if req.get('ratio')!='16:9' or req.get('generate_audio') is not True:errors.append(cid+': media parameters')
        if req['content'][0]['text']!=pp.read_text(encoding='utf-8'):errors.append(cid+': request/prompt differ')
    if set(camera_overrides())-set(candidates):errors.append('Orphaned segment camera override')
    for filename,forbidden in {
        'E04-SH101.txt':['不戴口罩','手机右手、蓝色资料夹左臂','手拿收据'],
        'E04-SH101-start-image.txt':['不戴口罩'],
        'E09-SH001.txt':['玛拉与瑞秋在候证位置相遇','两位家属共享'],
        'E24-SH009-G02.txt':['右袋振动一次','玛拉站桌南'],
    }.items():
        p=R/'prompts'/filename
        if not p.exists():errors.append(filename+': regression sample missing');continue
        for text in forbidden:
            if text in p.read_text(encoding='utf-8'):errors.append(filename+': stale state '+text)
    sources=[R/'season-plan.json',*sorted((R/'episodes').glob('E??.json')),R/'generation_plan.py',R/'build_package.py',R/'visual_direction.py',R/'authoring-brief.md',R/'extra-roles.json',R/'review/segment-camera-overrides.json',R/'review/24-episode-boundary-adjustments.json']
    hashes={str(p.relative_to(R)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sources if p.exists()}
    report={'date':'2026-11-08','scope':'24_short_episode_text_design_and_generation_mapping','userLockedEpisodes':24,'episodes':stats,'scenes':len(scs),'shots':len(ids),'dialogueLines':len(cues),'generationCandidates':len(candidates),'longShots':longs,'sourceSha256':hashes,'errors':errors,'mediaVerified':False,'actualRhythmVerified':False}
    report['contentPreservation']={'sceneProseUnchanged':script_hash==baseline['scriptSha256'],'shotContentUnchangedExceptDeclaredMetadata':normalized_shot_hash==baseline['shotContentSha256'],'declaredMetadataCorrections':len(adjustments),'actualShotContentSha256':shot_hash,'normalizedShotContentSha256':normalized_shot_hash,'baseline':'review/24-episode-baseline.json','exceptions':'review/24-episode-boundary-adjustments.json'}
    (R/'review/us-rhythm-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'episodes':stats,'longShots':len(longs),'errors':errors},ensure_ascii=False))
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
