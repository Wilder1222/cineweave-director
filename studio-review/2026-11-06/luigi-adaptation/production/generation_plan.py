"""Compile authored continuous edit shots to bounded generation candidates.
Segment seams remain unverified. A segment boundary is never an editorial cut.
"""
from copy import deepcopy
from pathlib import Path
import json,re

_OVERRIDE_PATH=Path(__file__).resolve().parent/'review/segment-camera-overrides.json'

def camera_overrides():
    if not _OVERRIDE_PATH.exists():return {}
    data=json.loads(_OVERRIDE_PATH.read_text(encoding='utf-8'))
    return data.get('overrides',data)

def segments_for(shot):
    raw=shot.get('generationSegments')
    if not raw:
        assert shot['duration']<=26, f'{shot["id"]}: long shot needs authored generationSegments'
        raw=[{k:shot[k] for k in ['duration','start','action','end']}]
    assert sum(s['duration'] for s in raw)==shot['duration'], f'{shot["id"]}: segment sum mismatch'
    result=[];offset=0;covered=[];overrides=camera_overrides()
    for i,part in enumerate(raw):
        assert isinstance(part['duration'],int),(shot['id'],'candidate duration must use integer seconds')
        assert 4<=part['duration']<=26,(shot['id'],'segment duration',part['duration'])
        assert all(part.get(k) for k in ['start','action','end']),(shot['id'],'segment state missing')
        seg=deepcopy(shot);seg.update(part)
        seg['candidateId']=shot['id']+(f'-G{i+1:02}' if len(raw)>1 else '')
        seg['isTechnicalSegment']=len(raw)>1
        seg['authoredSegmentFields']=list(part)
        if len(raw)>1:
            # A complete-shot composition/sound often names an event that happens
            # only once. Segment state is authoritative, not the original pose.
            if 'framing' not in part:
                seg['framing']=re.split('[，；。]',shot['framing'],maxsplit=1)[0]
            if 'composition' not in part:
                seg['composition']='沿用该成片镜既定机位和场景方向；当前站位、朝向与持物：'+part['start']
            if 'focus' not in part:seg['focus']='仅响应本段当前动作与受话关系；不预先转向尚未发生的后段事件。'
            if 'sound' not in part:seg['sound']='当前空间连续环境底声；拟音只随本段真实动作与物件接触发生，已完成事件不重演；可辨英语仅为下列本段对白。'
            seg['viewerEntry']=part['start'];seg['viewerExit']=part['end']
        override=overrides.get(seg['candidateId'],{})
        assert not set(override)-{'camera','framing','focus'},(seg['candidateId'],'unsupported segment override')
        seg.update(override)
        seg['shotOffset']=offset;seg['dialogue']=[];seg['overlay']=[]
        for cue in shot['dialogue']:
            if offset<=cue['start'] and cue['end']<=offset+part['duration']:
                q=deepcopy(cue);q['start']=round(q['start']-offset,3);q['end']=round(q['end']-offset,3)
                seg['dialogue'].append(q);covered.append(q['id'])
            elif cue['start']<offset+part['duration'] and cue['end']>offset:
                raise AssertionError((shot['id'],cue['id'],'cue crosses technical seam'))
        result.append(seg);offset+=part['duration']
    assert covered==[q['id'] for q in shot['dialogue']],(shot['id'],'dialogue coverage')
    return result
