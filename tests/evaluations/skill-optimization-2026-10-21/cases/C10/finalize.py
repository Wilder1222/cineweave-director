from pathlib import Path
import json, hashlib, re, subprocess, xml.etree.ElementTree as ET

r=Path(__file__).resolve().parent
base=r.parents[1]/'behavior-snapshot'/'skills'
p=r/'output.md';s=p.read_text(encoding='utf8').replace('画面左保留北向视线空间','画面右保留北向视线空间');p.write_text(s,encoding='utf8',newline='\n')
checks={}
for name,script,arg in [('shotReview','check-shot-review.mjs','review.json'),('delivery','check-delivery.mjs','delivery.json')]:
    cmd=['node',str(base/'cineweave-director'/'scripts'/script),str(r/arg)]
    cp=subprocess.run(cmd,capture_output=True,encoding='utf8');checks[name]={'command':cmd,'exit_code':cp.returncode,'result':json.loads(cp.stdout)}
    if cp.returncode: raise RuntimeError(cp.stdout+cp.stderr)
(r/'dialogue.srt').write_text(checks['delivery']['result']['srt'],encoding='utf8',newline='\n')
svgs=list((r/'cards').glob('*.svg'))
for svg in svgs:
    tree=ET.parse(svg);assert tree.getroot().tag.endswith('svg');assert len(list(tree.getroot()))>20
checks['svgXml']={'files':len(svgs),'parsed':True,'nonemptyDrawingElements':True}
links=re.findall(r'\]\(([^)]+)\)',s)
missing=[x for x in links if not (r/x).exists()]
assert not missing,missing
checks['localLinks']={'checked':len(links),'missing':missing}
checks['contentInventory']={'G0_G7_headings':all('## G'+str(i)+'｜' in s for i in range(8)), 'independent_image_prompts':len(re.findall(r'\*\*S[1-4]独立图像稿',s)),'independent_video_prompts':len(re.findall(r'\*\*S[1-4]完整视频稿',s)), 'has_exact_dialogue':'原来如此。' in s, 'svg_cards':len(svgs)}
assert checks['contentInventory']['independent_image_prompts']==4
assert checks['contentInventory']['independent_video_prompts']==4
checks['encoding']={'output_utf8':True,'output_lf_only':b'\r' not in p.read_bytes()}
checks['visualInspection']={'method':'Viewed Pillow-rendered contact-sheet.png with view_image','scope':'10 drawn card previews; checked layout, nonempty drawings, palette, directions and labels','limitation':'PNG previews are drawn by the same layout code; browser SVG rendering and narrative media were not inspected.'}
checks['buildHistory']=[{'command':'python -X utf8 build_design.py','result':'initial build succeeded'},{'command':'python -X utf8 build_design.py','result':'rerun failed because a removed correction heading was assumed to exist; no frozen source affected'},{'command':'python -X utf8 build_design.py','result':'made heading cleanup conditional; rerun succeeded'}]
(r/'check-results.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')

read=[r/'request.txt',base/'cineweave-director'/'SKILL.md']
read += [base/'cineweave-director'/'references'/f for f in ['optional/short-film-creation.md','optional/stage-deliverables.md','optional/scene-directing-pipeline.md','routes/shot-direction.md','optional/video-sound-and-delivery.md','optional/video-performance-direction.md','optional/ensemble-direction-and-review.md','optional/visual-development.md','optional/prompt-detail-standard.md']]
read += [base/'cineweave-reference'/f for f in ['SKILL.md','references/routes/reference-evidence.md','references/core/reference-evidence-and-rights.md']]
read += [base/'cineweave-review'/f for f in ['SKILL.md','references/routes/review-repair.md']]
read += [base/'cineweave-director'/'scripts'/f for f in ['check-shot-review.mjs','check-delivery.mjs','parse-json.mjs']]
def entry(p):return {'path':str(p.resolve()),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size}
artifacts=[entry(p) for p in sorted(r.rglob('*')) if p.is_file() and p.name not in ['request.txt','execution.json']]
manifest={'case':'C10','model':None,'tokens':None,'timing':None,'source_files_read':[entry(p) for p in read], 'generated_inputs_read':[entry(r/f) for f in ['output.md','build_design.py','finalize.py','review.json','delivery.json']], 'checks_performed':checks,'artifacts':artifacts,'limitations':['No actual image/video/audio candidates exist; no generation vendor was invoked.','No live app, repository source, installation or frozen skill was mutated; only C10 deliverables were written.','Original literary edition and film adaptations were not consulted; user-supplied mechanism is declared source.','No media playback, listening review, speech measurement, trial edit, LUT, illuminance or provider capability verification.','Design checker results are plan_only and do not grade artistic or media quality.'],'status':'design package saved; pending_media'}
(r/'execution.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({'source_files':len(read),'artifact_files':len(artifacts),'checks':{k:v.get('exit_code') for k,v in checks.items() if 'exit_code' in v},'output':str(r/'output.md'),'execution':str(r/'execution.json')},ensure_ascii=False))
