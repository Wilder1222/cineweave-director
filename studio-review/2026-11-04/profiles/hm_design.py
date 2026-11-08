"""Profile serialization conveniences; all subject decisions are supplied by author."""
from hm_authoring import *
def N(*views,**kw):return {'views':views,**kw}
def D(w,t,a,p,s,e):return {'speaker':w,'text':t,'addressee':a,'performance':p,'startSeconds':s,'endSeconds':e}
def F(actors,props,layers=None,bg='#292D31'):
 return {'background':bg,'actors':[{'label':a[0],'x':a[1],'y':a[2],'scale':a[3],'pose':a[4]} for a in actors], 'props':[{'label':r[0],'x':r[1],'y':r[2],'width':r[3],'height':r[4],'shape':r[5] if len(r)>5 else 'rect'} for r in props], 'layers':layers or []}
def finish(topic,c,notes,frames,material_swatches):
 q=make(topic,c,notes)
 assert len(q['shots'])==len(frames)
 for s,f in zip(q['shots'],frames):s['frame']=f
 for m,(color,texture) in zip(q['visual']['materials'],material_swatches):m.update(baseColor=color,texture=texture)
 (ROOT/'profiles'/f'{topic}.json').write_text(json.dumps(q,ensure_ascii=False,indent=2),encoding='utf-8')
 return q
def patch_sources(topic,before,after,reason):
 for f in (ROOT/'studio-current').glob('*/index.json'):
  d=json.loads(f.read_text(encoding='utf-8'))
  if d.get('topicId')==topic:
   return [{'documentId':x['documentId'],'before':before,'after':after,'reason':reason} for x in d['documents'] if '20261031' in x['title'] and ('｜剧本｜' in x['title'] or '｜分镜与视频提示｜' in x['title'])]
 raise ValueError(topic)
def S(coordinate,anchor_rows,light_rows,zones,geography):
 return {'coordinate':coordinate,'anchors':[dict(id=r[0],label=r[1],x=r[2],y=r[3],description=r[4]) for r in anchor_rows], 'lights':[dict(id=r[0],label=r[1],x=r[2],y=r[3],targetX=r[4],targetY=r[5],description=r[6]) for r in light_rows], 'cameraZones':zones,'geography':geography}
def B(name,task,path,gaze,props,residual):return dict(character=name,task=task,path=path,gaze=gaze,props=props,residual=residual)
def T(id,shots,objective,fixed,input,yes,no,stop):return dict(id=id,shots=shots,objective=objective,fixed=fixed,input=input,pass_=yes,fail=no,stop=stop)
def test(id,shots,objective,fixed,input,yes,no,stop):
 return {'id':id,'shots':shots,'objective':objective,'fixed':fixed,'input':input,'pass':yes,'fail':no,'stop':stop}
