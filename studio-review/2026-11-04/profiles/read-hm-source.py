"""Lossless source reading view: replaces exact repeated strings with locators.
No score or prose judgement. Every non-empty line is represented, including full
independent prompts; only bytes already printed earlier in this view are elided.
"""
import json,pathlib,sys
base=pathlib.Path(__file__).resolve().parents[1]/'studio-current'
for topic in sys.argv[1:]:
 seen={};fragments={};counter=0
 for f in base.glob('*/index.json'):
  d=json.loads(f.read_text(encoding='utf-8'))
  if d.get('topicId')!=topic:continue
  for kind in ['｜剧本｜','｜审阅与来源｜','｜分镜与视频提示｜']:
   for x in d['documents']:
    if kind not in x['title'] or '20261031' not in x['title']:continue
    print('\nFILE',topic,x['documentId'],x['title'])
    for n,line in enumerate((f.parent/(x['documentId']+'.md')).read_text(encoding='utf-8').splitlines(),1):
     if not line:continue
     loc=x['documentId'][:6]+':'+str(n)
     if line in seen:print(f'{n}: [= {seen[line]}]');continue
     raw=line
     # Existing exact substrings are referenced without changing/reordering text.
     for fragment,ref in sorted(fragments.items(),key=lambda z:-len(z[0])):
      if len(fragment)>=24 and fragment in line:line=line.replace(fragment,'[= '+ref+']')
     print(f'{n}: {line}')
     seen[raw]=loc
     for fragment in raw.split('。'):
      if len(fragment)>=24 and fragment not in fragments:fragments[fragment]=loc+'片段'
