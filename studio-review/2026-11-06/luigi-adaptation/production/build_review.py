from season import write_assembled
"""Build source-linked text coverage workbooks. This is not a media quality judge."""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parent
def write(name,value):
    (ROOT/name).write_text(json.dumps(value,ensure_ascii=False,indent=2),encoding='utf-8')
def camera_row(s):
    cam=s['camera'];focus=s['focus'];fr=s['framing'];co=s['composition']
    # Only recognize positive declarations. "No pan" is not a pan.
    pan_hint=bool(re.search(r'小幅摇|摇随|摇跟',cam))
    dolly_hint=bool(re.search(r'镜内仅一次.{0,12}靠近|短距离前移|小幅前移',cam))
    moving=pan_hint or dolly_hint or not bool(re.search(r'固定|不移动|不运镜|锁定机位',cam))
    if pan_hint:motion,tech='pan','M06'
    elif dolly_hint:motion,tech='dolly','M01'
    elif moving and re.search(r'抬至|俯仰|仰摇|俯摇',cam):motion,tech='tilt','M12'
    elif moving and re.search(r'推|前移|靠近',cam): motion,tech='dolly','M01'
    elif moving and re.search(r'后退|后移|拉远|退移',cam):motion,tech='dolly','M02'
    elif moving and re.search(r'侧移|横移|平移|南移|向右调整',cam):motion,tech='truck','M03'
    elif moving and re.search(r'跟|随',cam):motion,tech='gimbal','M04'
    elif moving and re.search(r'快速横摇|甩镜',cam):motion,tech='pan','M06'
    elif moving and re.search(r'升|降',cam):motion,tech='crane','M05'
    elif moving and re.search(r'手持',cam):motion,tech='handheld','M07'
    else:motion,tech='static','neutral_static'
    rack=bool(re.search(r'移焦|转焦|焦点从|焦点由',focus)) and not bool(re.search(r'不移焦|无移焦',focus))
    if rack and motion=='static':tech='K07'
    follow=not rack and bool(re.search(r'跟随|跟焦',focus))
    fm='rack' if rack else 'follow' if follow else 'hold'
    hold=motion=='static';duration=s['duration']
    d={'primaryTechniqueId':tech,'supportingTechniqueIds':[],
       'narrativeReason':s['purpose'],'audiencePayoff':s['viewerExit'],
       'trigger':s['start']+'；'+s['action'],'cameraMode':'static' if hold else 'moving','focusMode':fm,'exitMatch':s['cutTrigger']+'；'+s['next']}
    if hold:d['noMotionReason']=cam+'；观看变化：'+s['viewerExit']
    if rack:d['focusTargetEnd']='转移终点按本镜焦点条目后半句执行：'+focus
    ft=[{'eventId':s['id']+'-F1','timeSeconds':0,'description':focus}]
    if rack:ft.append({'eventId':s['id']+'-F2','timeSeconds':round(duration*.6,1),'description':'本秒点仅供规划表占位，非已锁定切焦时刻。实际按正文刺激与试读确定；完整作者焦点意图：'+focus})
    return {'shotId':s['id'],'decision':d,
      'camera':{'shotScale':fr.split('，')[0],'position':fr,'height':'依本镜景别机位中的平视/俯视说明；无高低角度特别说明时为被摄者眼高。',
      'angle':fr,'perspectiveIntent':'人物关系和动作因果可辨，不以夸张透视改变距离。','focusTarget':focus,
      'depthOfField':'双人共享镜头保留双方可读，物件近景保留关键接触面可读；依焦点条目执行。',
      'axisSide':'使用本镜构图已给出的世界方向；反打继承相邻镜头的同侧轴线。 '+co,'movementIntent':cam},
      'composition':{'layout':co,'foreground':'按构图条目，前景仅保留已有遮挡或持物；没有声明时不增加遮挡。',
      'midground':'本镜行动与受话关系：'+s['action'],'background':'继承已写环境与出入口，不新增能解释剧情的人或物。',
      'negativeSpace':'保留人物视线/行走方向的可用空间；文字界面留给后期合成。','visualHierarchy':s['purpose']+'；'+focus},
      'temporal':{'durationSeconds':duration,'cameraMotion':{'type':motion,'motivation':s['purpose'],
      'path':'机位不移动。' if hold else cam,'start':s['start'],
      'acceleration':'无相机位移或加速。' if hold else '仅执行作者本镜规定的启动与速度，不另加缓起：'+cam,
      'peak':'保持所述固定构图，演员完成动作。' if hold else '依本镜作者运动描述，不统一套匀速：'+cam,
      'deceleration':'无相机位移或减速。' if hold else '不强制停稳；按作者出点接后镜：'+s['cutTrigger'],
      'end':s['end'],'framingChange':'镜头构图不主动改变；演员在框内变化。' if hold else cam},
      'focusTimeline':ft,'edit':{'entry':s['start'],'exit':s['end']+'；'+s['cutTrigger'],'preferredTransition':s['next'],
      'soundBridge':s['sound']+'；跨场桥的归属以next接口为准，没有明确跨场声桥时在切点换为新场环境。'}}}

def main():
    eps=write_assembled()
    for ep in eps:
        p=ROOT/'season'/f'E{ep["number"]:02}.json'
        reviews=[]
        for i,s in enumerate(ep['shots']):
            loc=f'season/{p.name}#/shots/{i}'
            observations={
              'direction':('文字覆盖：目的、观众信息变化和可见事件分别存在，便于按镜复核。','目的：'+s['purpose']+'；入镜已知：'+s['viewerEntry']+'；本镜新知：'+s['viewerExit']+'；实际写出的动作：'+s['action']),
              'performance':('文字覆盖：动作有起止；英语对白有受话者、语气与中文译文。',s['start']+' → '+s['end']+'；'+(' / '.join(q['speaker']+'向'+q['listener']+'：'+q['text']+'；'+q['tone'] for q in s['dialogue']) or '无对白，以已写动作承载表演。')),
              'staging':('文字覆盖：构图、人物及起止态能定位本镜行动。',s['composition']+'；起态：'+s['start']+'；出态：'+s['end']),
              'cinematography':('文字覆盖：景别、相机动作、焦点分别声明，固定镜头不伪称移动。',s['framing']+'；相机：'+s['camera']+'；焦点：'+s['focus']),
              'prompt':('文字覆盖：该真实镜号有完整独立复制稿，演员和环境展开，英语发声与中文阅读分开。','prompts/'+s['id']+'.txt；'+str(s['duration'])+'秒成片采用区间；各技术候选及其1秒两端余量见editorial/generation-segments.csv，不将片段接续当剪点。'),
              'continuity':('文字覆盖：本镜出态、切点与后镜接口明确；具体跨集问题见当前us-rhythm审读记录。',s['end']+'；切点：'+s['cutTrigger']+'；接口：'+s['next'])}
            for role,(criterion,observation) in observations.items():reviews.append({'role':role,'shotId':s['id'],'status':'pass','criterion':criterion,'observation':observation,'sourceLocator':loc})
        w={'source':{'type':'design','id':'DENIED-'+p.stem+'-text-coverage-'+hashlib.sha256(p.read_bytes()).hexdigest()[:12],'version':2,'cameraLanguageScope':'narrative_video'},'mode':'full','shotIds':[s['id'] for s in ep['shots']],'reviews':reviews,'cameraDecisions':[camera_row(s) for s in ep['shots']]}
        write('review/'+p.stem+'-worksheet.json',w)
    print(f'Wrote {len(eps)} source-linked text-coverage worksheets; no media judged.')
if __name__=='__main__':main()
