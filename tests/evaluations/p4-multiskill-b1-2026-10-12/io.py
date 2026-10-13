from pathlib import Path
import json, hashlib, sys
OUT=Path('D:/Temp/cineweave-split-p4-multiskill-b1-20261012')
ROOT=Path('D:/study/projects/cineweave-codex-skills/cineweave-director')
def read(rel, start=None, end=None, cases=(), sections=('all',)):
 p=ROOT/rel; b=p.read_bytes(); s=b.decode('utf-8'); lines=s.splitlines()
 if start is not None: s='\n'.join(lines[start-1:end])
 log=json.loads((OUT/'source-reads.json').read_text(encoding='utf-8'))
 log.append({'path':str(p),'sha256':hashlib.sha256(b).hexdigest(),'sections':list(sections),'lineRange': [start,end] if start else None,'cases':list(cases)})
 (OUT/'source-reads.json').write_text(json.dumps(log,ensure_ascii=False,indent=2),encoding='utf-8')
 print(s)
def save(cid, lead, assists, answer, sources=()):
 p=OUT/(cid+'-v1.md')
 if p.exists(): raise RuntimeError('First version already exists '+cid)
 p.write_text(answer.strip()+'\n',encoding='utf-8')
 idxp=OUT/'cases.json'; idx=json.loads(idxp.read_text(encoding='utf-8')) if idxp.exists() else []
 idx.append({'id':cid,'lead':lead,'assists':list(assists),'version':1,'answerFile':str(p),'sources':list(sources),'model':None,'tokens':None,'reasoning':None,'latency':None})
 idxp.write_text(json.dumps(idx,ensure_ascii=False,indent=2),encoding='utf-8')
if __name__=='__main__':
 args=sys.argv[1:]
 read(args[0],int(args[1]) if len(args)>1 else None,int(args[2]) if len(args)>2 else None,args[3].split(',') if len(args)>3 else (),[args[4]] if len(args)>4 else ['all'])
