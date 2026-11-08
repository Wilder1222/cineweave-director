"""HM hand-authored profile assembly. This extracts source fields, never scores prose.

Each topic must provide authored visual decisions and six distinct observations per
shot. It neither renders delivery files nor replaces the shared package renderer.
"""
import json, pathlib, re

ROOT=pathlib.Path(__file__).resolve().parents[1]
DOMAINS=('direction','performance','staging','cinematography','prompt','continuity')
def make(topic, c, notes):
    hits=[]
    for f in (ROOT/'studio-current').glob('*/index.json'):
        d=json.loads(f.read_text(encoding='utf-8'))
        if d.get('topicId')==topic:hits.append((f.parent,d))
    assert len(hits)==1,topic
    folder,index=hits[0]
    chosen={}
    for d in index['documents']:
        if '20261031' in d['title']:
            if '｜剧本｜' in d['title']:chosen['script']=d
            elif '｜分镜与视频提示｜' in d['title']:chosen['board']=d
            elif '｜审阅与来源｜' in d['title']:chosen['review']=d
    lines=(folder/(chosen['board']['documentId']+'.md')).read_text(encoding='utf-8').splitlines()
    heads=[]
    for i,line in enumerate(lines):
        m=re.match(r'## ('+topic+r'-[^｜]+)｜([\d.]+)[—–-]([\d.]+)秒｜(.+)',line)
        if m:heads.append((i,m))
    assert len(heads)==len(notes),(topic,len(heads),len(notes))
    def field(block,label):
        found=[s[len(label):] for s in block if s.startswith(label)]
        return found[0] if found else ''
    shots=[]
    for k,(start,m) in enumerate(heads):
        end=heads[k+1][0] if k+1<len(heads) else next((i for i in range(start+1,len(lines)) if lines[i].startswith('## 逐镜时间表')),len(lines))
        block=lines[start:end]; author=notes[k]
        assert len(author['views'])==6,(topic,m[1])
        technical=field(block,'机位：'); camera=field(block,'摄影机：'); focus=field(block,'焦点：')
        frame=technical.split('高度：')[0]
        height=technical.split('高度：')[-1].split('。')[0] if '高度：' in technical else '按现稿机位，不额外改变高度'
        first_focus=focus.split('；')[0]
        cam={'scale':frame.split('；')[0], 'position':frame.split('；')[-1], 'height':height,'angle':'按源中俯仰；未注明时平视候选',
             'axis':c['axis'],'perspective':author.get('perspective',author['views'][0]),'type':'static','movement':author.get('camera',camera),
             'trigger':author.get('trigger',author['views'][1]),'depth':'关键接触人物及物件同在可读景深；真实镜头光圈待LookDev',
             'focus':[{'time':0,'target':first_focus}], 'techniqueId':'neutral_static'}
        cam.update(author.get('cameraOverride',{}))
        reviews={key:{'status':author.get('statuses',{}).get(key,'pass'),'criterion':author['criteria'][n] if 'criteria' in author else author['views'][n].split('；')[0],
                       'observation':author['views'][n], 'sourceLocator':f"{chosen['board']['documentId']}.md:L{start+1}–L{end}"} for n,key in enumerate(DOMAINS)}
        for key,r in reviews.items():
            if r['status']=='revise':r['repair']=author['repairs'][key]
        shot={'id':m[1], 'title':m[4],'durationSeconds':float(m[3])-float(m[2]),'source':{'documentId':chosen['board']['documentId'],'startLine':start+1,'endLine':end},
              'path':'board：当前完整独立视频稿为母稿；首轮文生视频试镜，参考资产待制作，不宣称已生成',
              'beat':author.get('beat',field(block,'目的/观众新信息：')),'purpose':field(block,'目的/观众新信息：'),'entry':field(block,'入态：'),'exit':field(block,'出点/承接：'),
              'camera':cam,'composition':{'layout':technical,'foreground':author.get('foreground',technical),'midground':author['views'][2],
              'background':c['background'],'negativeSpace':author.get('negativeSpace','沿该镜既定动作出口留位，其他区域不增加人物或未见结果'),'visualHierarchy':author['views'][0]},
              'sound':author.get('sound',c['sound']),'transition':author.get('transition','切于本镜出态落实后；下一镜按其入态继续或按正文明确省略，不用转场遮盖缺动作'),
              'dialogue':author.get('dialogue',[]),'reviews':reviews}
        shots.append(shot)
    result={'schemaVersion':'cineweave-production-profile/v1','topicId':topic,'title':index.get('title',c['title']),'revision':1,
            'source':{'projectId':index['projectId'],'scriptDocumentId':chosen['script']['documentId'],'storyboardDocumentId':chosen['board']['documentId'],'reviewDocumentId':chosen['review']['documentId']},
            'patches':c.get('patches',[]),'creative':c['creative'],'visual':c['visual'],'space':c['space'],'blocking':c['blocking'],'shots':shots,
            'audio':c['audio'],'tests':c['tests'],'handoff':c['handoff']}
    (ROOT/'profiles'/f'{topic}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return result

def visual_plan(medium, rules, colors, materials, lights, characters, assets, tests):
    """Only serialize explicitly authored design values supplied by each topic."""
    return {'style':{'medium':medium,'rules':rules,'exclusions':['不增加已锁角色/结果；不把设计矢量卡标为生成媒体','不以景深、炫光、快切掩盖关键因果接触']},
            'palette':[{'id':f'P{i+1}','name':x[0],'hex':x[1],'use':x[2]} for i,x in enumerate(colors)],
            'materials':[{'id':f'M{i+1}','asset':x[0],'description':x[1],'preserve':x[2]} for i,x in enumerate(materials)],
            'lighting':[{'id':f'L{i+1}','sourceId':x[0],'position':x[1],'quality':x[2],'intent':x[3]} for i,x in enumerate(lights)],
            'characters':[{'id':f'C{i+1}','name':x[0],'identity':x[1],'costume':x[2],'voice':x[3],'prompt':x[4]} for i,x in enumerate(characters)],
            'assets':[{'id':f'A{i+1}','name':x[0],'prompt':x[1]} for i,x in enumerate(assets)],
            'lookdev':[{'id':f'LD{i+1}',**x} for i,x in enumerate(tests)]}

def ld(target,prompt,fixed,compare,yes,no):return {'target':target,'prompt':prompt,'fixed':fixed,'compare':compare,'pass':yes,'fail':no}

HANDOFF={
 'xiaoyunque':'同一母稿先做G6指定高风险短段；以当前账号真实可用入口/模型核验后才确定文生或参考节点。每个母镜独立节点，源镜号、完整稿、入/出态、对白音轨与设计帧窗一起交接。超出真实单次时长上限时仅提出同镜连续延展/首尾状态匹配实验，保持原母镜及总预算；不可静默切成新镜。失败先查询任务ID，禁止重复消费。本包不提交生成、不声称账号/模型或参数已验证。',
 'libtv':'按同一母稿建立角色候选、场景候选、分镜文本、音轨与结果占位节点；母镜号保持一致并保留来源hash。采用窗由真实输出校准，不把文字节点当已生成视频。现有画布/节点ID、端口连接、入口参数与真实时长能力均未核验；不能猜写API字段。G6通过后再由真实素材接入剪辑。',
 'unknowns':['当前平台真实账号/模型/额度与单次时长、分辨率、输入参数未核验','所有角色图/首帧/镜头视频/声音仍未生成或未实测','设计帧窗不等于真人读演、口型或rough cut验收']}
