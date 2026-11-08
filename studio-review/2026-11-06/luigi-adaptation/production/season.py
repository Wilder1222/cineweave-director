"""Assemble the current broadcast episodes from stable production-unit IDs."""
from pathlib import Path
import copy, json

ROOT = Path(__file__).resolve().parent

def load_episodes():
    plan = json.loads((ROOT / 'season-plan.json').read_text(encoding='utf-8-sig'))
    units = [json.loads(p.read_text(encoding='utf-8-sig')) for p in sorted((ROOT/'episodes').glob('E??.json'))]
    scenes = {s['id']:s for e in units for s in e['scenes']}
    shots = {s['id']:[q for e in units for q in e['shots'] if q['sceneId']==s['id']] for s in scenes.values()}
    result=[];used=[]
    for item in plan['episodes']:
        ep=copy.deepcopy(item);order=ep.pop('sceneOrder');used.extend(order)
        ep['scenes']=[copy.deepcopy(scenes[s]) for s in order]
        ep['shots']=[copy.deepcopy(q) for s in order for q in shots[s]]
        for i,s in enumerate(ep['shots']):
            s['broadcastEpisode']=ep['number'];s['displayId']=f'EP{ep["number"]:02}-{i+1:03}'
        result.append(ep)
    assert len(used)==len(set(used)), 'Scene used twice in current assembly'
    excluded=set(plan.get('excludedScenes',{}))
    assert set(scenes)-excluded==set(used), ('Missing scene',set(scenes)-set(used)-excluded)
    assert not set(used)&excluded
    for e,ne in zip(result,result[1:]+[None]):
        sm={s['id']:s for s in e['scenes']}
        for i,s in enumerate(e['shots']):
            nxt=e['shots'][i+1] if i+1<len(e['shots']) else None
            if nxt and nxt['sceneId']!=s['sceneId']:
                target=sm[nxt['sceneId']]
                authored=plan.get('transitionOverrides',{}).get(s['sceneId'])
                s['next']=authored or (f'本场结果成立后切入 {target["id"]}（{target["location"]}，{target["time"]}）；以新场开头建立空间和人物持物，环境声按新场接入。')
            elif not nxt:
                s['next']=f'本集结束。{e["dramaturgy"]["cliffhanger"]} '+(f'下集从{ne["scenes"][0]["location"]}展开：{e["dramaturgy"]["nextEpisodeBridge"]}' if ne else '保留最后环境声后结束全剧。')
    return result

def write_assembled():
    folder=ROOT/'season';folder.mkdir(exist_ok=True)
    eps=load_episodes()
    for e in eps:
        (folder/f'E{e["number"]:02}.json').write_text(json.dumps(e,ensure_ascii=False,indent=2),encoding='utf-8')
    return eps

def shot_aliases(eps=None):
    return {old:s['id'] for e in (eps or load_episodes()) for s in e['shots'] for old in [s['id'],*s.get('sourceShotIds',[])]}

def episode_for_shot(eps=None):
    return {old:f'E{e["number"]:02}' for e in (eps or load_episodes()) for s in e['shots'] for old in [s['id'],*s.get('sourceShotIds',[])]}

if __name__=='__main__':
    eps=write_assembled()
    print(json.dumps([{'episode':e['number'],'scenes':len(e['scenes']),'seconds':sum(s['duration'] for s in e['shots'])} for e in eps]))
