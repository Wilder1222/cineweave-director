"""Project-local text projection; this is neither an API payload nor a media runner."""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parent
ROOT = OUT.parent
sys.path.insert(0, str(ROOT))
import research_adaptation
GROUPS = {'B': '婴儿趣味行为', 'F': '家庭亲子时刻', 'G': '成长变化'}
BABY_NAME = '澈澈'
STAGES = {'R0': '仰卧、伸手与翻身探索', 'R1': '坐姿与手部互动', 'R2': '爬行与扶物站立', 'R3': '短暂松开支撑并迈一小步', 'R4': '稳步行走与初语', 'R5': '幼儿拼图与短句'}
CUTS = {
    'B01':[6], 'B02':[4,7], 'B03':[4,6], 'B04':[5], 'B05':[2,6],
    'B06':[5], 'B07':[3,6], 'B08':[5], 'B09':[2,6], 'B10':[5,7], 'B11':[6],
    'B12':[3,6], 'B13':[3,6], 'B14':[3,7],
    'F01':[3,6], 'F02':[3,6], 'F03':[3,5,7], 'F04':[3,6], 'F05':[4,6],
    'F06':[3,5,7], 'F07':[3,6], 'F08':[3,6], 'F09':[5], 'F10':[3,6], 'F11':[6],
    'G01':[4,6], 'G02':[4,6], 'G03':[3,5,7], 'G04':[3,6], 'G05':[3,6],
    'G06':[3,5,7], 'G07':[3,6], 'G08':[2,6], 'G09':[3,5,7], 'G10':[3,5,7],
}
PROPS = {
    'P01': '珊瑚色大软布环', 'P02': '芥末色软布球',
    'P03': '鼠尾草绿圆角大软积木', 'P04': '奶油色方形棉布巾',
    'P05': '蓝绿封面的婴儿布书', 'P06': '雾蓝色棉短袜',
    'P07': '浅木色开放浅玩具盒',
    'T01': '固定在低支撑座前的浅灰圆边托盘',
    'F02-X01': '暖灰棉布出门包', 'F03-X01': '芥末色沙发靠垫',
    'F03-X02': '灰色软布拉链包', 'F04-X01': '深灰手机',
    'F05-X01': '小型家庭音箱', 'F07-X01': '折叠报纸',
}
STYLE = '9:16竖幅，原创圆润三维家庭生活动画；形体有自然重量，皮肤和棉布质感柔和，小表情清楚，动作保留婴儿的专注与不熟练。'
SCENE_NAMES = {'L':'客厅', 'N':'休息角'}


def clean(text: str) -> str:
    # Natural names replace production IDs; no hold/position is inferred here.
    text = text.replace('团团', BABY_NAME)
    for key in sorted(PROPS, key=len, reverse=True):
        text = re.sub(r'(?<![A-Za-z0-9-])'+re.escape(key)+r'(?![A-Za-z0-9-])', PROPS[key], text)
    for code, description in STAGES.items():
        text = re.sub(r'(?<![A-Za-z0-9])'+code+r'(?![A-Za-z0-9])', description, text)
    for old,new in {
        'L客厅':'客厅', 'N休息角':'休息角',
        '雾蓝衣料':'参考图中妈妈的上衣布料', '雾蓝上衣':'参考图中妈妈的上衣',
        '奶油色棉连体衣':f'参考图中{BABY_NAME}的连体衣',
        '奶油色连体衣':f'参考图中{BABY_NAME}的连体衣',
        '奶油衣料':f'参考图中{BABY_NAME}的衣料',
        '砖陶衬衫':'参考图中爸爸的衬衫',
        '鼠尾草绿圆角大软积木为鼠尾草绿大软积木':'鼠尾草绿圆角大软积木',
        '浅木盒浅木色开放浅玩具盒':'浅木色开放浅玩具盒',
        '奶油色方形棉布巾奶油布巾':'奶油色方形棉布巾',
        '蓝绿封面的婴儿布书蓝绿布书':'蓝绿封面的婴儿布书',
        '珊瑚色大软布环珊瑚软布环':'珊瑚色大软布环',
        '珊瑚色大软布环为珊瑚色大软布环':'珊瑚色大软布环',
        '雾蓝色棉短袜为一对雾蓝短袜':'雾蓝色棉短袜为一对',
        '固定在低支撑座前的浅灰圆边托盘浅灰圆边托盘固定在身前':'浅灰圆边托盘固定在低支撑座身前',
        '鼠尾草绿圆角大软积木鼠尾草绿软积木':'鼠尾草绿圆角大软积木',
        '浅木浅木色开放浅玩具盒玩具盒':'浅木色开放浅玩具盒',
        '。。':'。', '。；':'；',
    }.items():
        text = text.replace(old,new)
    return text.strip()


def resolve_local_aliases(text, story):
    # S01 sometimes denotes a stroller, sometimes the first shot. Resolve by
    # meaning before expanding the actual stroller asset; never a global alias.
    for old,new in {
        '与S01同轴同方向':'东南侧朝西北，保持人物连线同侧',
        '与S03同机位':'南侧朝北略西，保持人物连线同侧',
        '与S01同轴':'客厅东侧朝西北，保持人物轴线同侧',
        '同S03方向':'南侧朝北',
        '同S01方向与坐序':f'南侧朝北，妈妈画左、{BABY_NAME}居中、爸爸画右',
        '跨镜到S03第2秒才收':'跨过本镜出点继续，下一镜开始约2秒、听到宝宝元音后才收',
        '跨切延续到S03':'跨过本镜出点继续，下一镜听到宝宝元音后停止',
    }.items():
        text=text.replace(old,new)
    if story['id'] in ['B01','F03']:
        text=re.sub(r'(?<![A-Za-z0-9-])S01(?![A-Za-z0-9-])','停放的雾蓝软座婴儿车',text)
    return text


def refs(story):
    characters = {clean(role) for role in story['characters']}
    roles = [r for r in [BABY_NAME,'爸爸','妈妈','爷爷'] if r in characters]
    items = [{'slot':f'@图片{i+1}', 'role':role, 'use':'身份、可见服装与三维角色造型'} for i,role in enumerate(roles)]
    items.append({'slot':f'@图片{len(items)+1}', 'role':SCENE_NAMES[story['scene']], 'use':'家具和场景造型、材质、色彩及基础光线'})
    return items


def binding(story):
    rows = []
    for item in refs(story):
        if item['role'] in SCENE_NAMES.values():
            rows.append(f"{item['slot']}对应{item['role']}场景，参考家具与环境造型、材质和色彩；本镜人物摆位及观看方向按下文安排。")
        else:
            rows.append(f"{item['slot']}中的人物对应{item['role']}，参考该角色的身份、可见服装与三维造型。")
    return '素材映射：' + ''.join(rows) + '只呈现本镜裁切范围内的人物部分。'


def scene_body(story, shot):
    raw = shot['videoPrompt']
    group = story['id'][0]
    if group == 'B':
        return raw.split('固定空间和材质：',1)[1].split('摄影构图：',1)[0].strip()
    if group == 'F':
        return raw.split('空间光位：',1)[1].split('起态：',1)[0].strip()
    return '白天客厅' + raw.split('白天客厅',1)[1].split('本镜',1)[0].strip()


def static_body(story, shot):
    raw = shot['openingPrompt']
    group = story['id'][0]
    if group == 'B':
        return raw[raw.index('固定空间和材质：'):]
    if group == 'F':
        return '单一开始瞬间：'+shot['start']+'\n'+raw[raw.index('场次方位与光位：'):]
    return raw[raw.index('白天客厅'):]


def sound_policy(story, selected):
    if story['id'] == 'F05':
        numbers = [int(sh['id'].split('-S')[1]) for sh in selected]
        return '声音总则：音乐只来自场景中的小音箱，按各镜指定位置停止；停止后保留动作声与呼吸，人物不唱歌词。' if min(numbers)<=4 else '声音总则：音箱已经停止，没有背景配乐；保留动作声与呼吸。'
    if story['id'] == 'F08':
        return '声音总则：父母的哼声来自人物口部，按各镜触发进入或停止；没有背景伴奏，婴儿只按指定时刻发出自然元音。'
    return '声音总则：保留本镜指定的人声、呼吸、动作声和环境底声；没有背景配乐，没有额外旁白。'


def capability(story):
    return f"{BABY_NAME}本条能力范围为{STAGES[story['stage']]}，以镜内写明的实际支撑和动作起态为准；人物外观按参考图，不据此设定统一月龄。"


def shot_events(shot):
    return '\n'.join(f"约{p['seconds']}秒：{clean(p['action'])}" for p in shot['phases'])


def video_section(shot, number=None, elapsed=0):
    title = f"镜头{number}（{elapsed}—{elapsed+shot['seconds']}秒，{shot['id']}）" if number else f"本镜有效时长{shot['seconds']}秒，单个连续镜头"
    return clean(f"{title}\n景别与构图：{shot['framing']}\n起始状态：{shot['start']}\n动作与表演（以下秒数均为本镜内各阶段的设计时长）：\n{shot_events(shot)}\n摄影机：{shot['camera']}\n焦点：{shot['focus']}\n声音：{shot['sound']}\n出点状态：{shot['end']}\n接触与画外继承：{shot['continuity']}")


def make_shot(story, shot):
    image = '\n'.join([binding(story), STYLE, capability(story), clean(static_body(story,shot)), '只画一个开始瞬间，不绘制动作轨迹、分格或文字标记。'])
    video = '\n'.join([binding(story), STYLE, capability(story), '场次空间与光线：'+clean(scene_body(story,shot)), sound_policy(story,[shot]), video_section(shot), '在上述出点结束，本镜内部保持连续；没有字幕或片头片尾。'])
    return {'id':shot['id'], 'seconds':shot['seconds'], 'purpose':shot['purpose'], 'imagePrompt':resolve_local_aliases(image,story), 'videoPrompt':resolve_local_aliases(video,story), 'start':resolve_local_aliases(clean(shot['start']),story), 'end':resolve_local_aliases(clean(shot['end']),story), 'cut':clean(shot['cut']), 'phases':[{'seconds':p['seconds'],'action':resolve_local_aliases(clean(p['action']),story)} for p in shot['phases']], 'sound':resolve_local_aliases(clean(shot['sound']),story)}


def segment_stops(story):
    stops = story.get('segmentStops', CUTS.get(story['id']))
    count = len(story['shots'])
    if (not isinstance(stops, list) or not stops
            or any(type(stop) is not int or not 0 < stop <= count for stop in stops)
            or stops != sorted(set(stops)) or stops[-1] != count):
        raise ValueError(f"{story['id']}: segment plan must cover all source shots in order")
    begin = 0
    for stop in stops:
        seconds = sum(shot['seconds'] for shot in story['shots'][begin:stop])
        if not 4 <= seconds <= 30:
            raise ValueError(f"{story['id']}: planned segment duration {seconds} outside 4—30 seconds")
        begin = stop
    return stops


def planned_segment_count(stories):
    return sum(len(segment_stops(story)) for story in stories)


def make_segments(story):
    result, begin = [], 0
    for n, stop in enumerate(segment_stops(story),1):
        shots=story['shots'][begin:stop]
        seconds=sum(sh['seconds'] for sh in shots)
        parts=[binding(story),STYLE,capability(story),f'生成{seconds}秒、{len(shots)}个镜头的连续剧情片段，只在下列镜头边界剪接。','场次空间与光线：'+clean(scene_body(story,shots[0])), sound_policy(story,shots)]
        elapsed=0
        for i,shot in enumerate(shots,1):
            parts.append(video_section(shot,i,elapsed))
            if i<len(shots):
                parts.append('到下一镜的接口：'+clean(shot['cut']))
            elapsed+=shot['seconds']
        parts.append('人物身份、道具数量与世界光向贯穿本段；不把镜号或提示词生成为字幕。')
        if begin:
            incoming=clean(story['shots'][begin-1]['end'])
            incoming_cut=clean(story['shots'][begin-1]['cut'])
        else:
            incoming='本条故事的开场，不依赖前一条选题。'
            incoming_cut='按本段第一个镜头的起态布置。'
        result.append({'id':f"{story['id']}-P{n:02d}",'seconds':seconds,'shots':[sh['id'] for sh in shots],'prompt':resolve_local_aliases('\n\n'.join(parts),story),'incoming':resolve_local_aliases(incoming,story),'incomingCut':resolve_local_aliases(incoming_cut,story),'outgoing':resolve_local_aliases(clean(shots[-1]['end']),story),'outgoingCut':resolve_local_aliases(clean(shots[-1]['cut']),story)})
        begin=stop
    assert begin==len(story['shots'])
    return result


def story_markdown(story, root_prefix='../'):
    lines=[f"# {story['id']}《{story['title']}》",f"原片 {story['duration']} 秒 / {len(story['shots'])} 镜 / {len(story['segments'])} 个分段。",'人物与场景参考尚未提供。下列编号是拟定上传顺序，实际上传后须按文件顺序核对。','## 原剧情',story['story'],'## 参考映射','| 拟定编号 | 对应对象 | 职责 |','| --- | --- | --- |']
    lines.insert(5, research_adaptation.markdown(story, root_prefix))
    lines.extend(f"| {r['slot']} | {r['role']} | {r['use']} |" for r in story['references'])
    lines.extend(['','场景布局、支撑结构与角色能力须在实际参考中可成立。原稿的门窗方位和动作摆位是当前导演设计；实图结构冲突时先改机位与布局。','## 分段多镜提示词'])
    for seg in story['segments']:
        lines.extend([f"### {seg['id']} / {seg['seconds']} 秒",'镜头：'+' → '.join(seg['shots']),f"跨段入态：{seg['incoming']}\n\n接口：{seg['incomingCut']}",'```text',seg['prompt'],'```',f"跨段出态：{seg['outgoing']}\n\n下一接口：{seg['outgoingCut']}"])
    lines.append('## 逐镜独立提示词')
    for sh in story['shots']:
        lines.extend([f"### {sh['id']} / {sh['seconds']} 秒",'镜头目的：'+sh['purpose'],'首帧画面稿（可选）：','```text',sh['imagePrompt'],'```','人物与场景参考生视频稿：','```text',sh['videoPrompt'],'```','剪辑接口：'+sh['cut']])
    result = '\n\n'.join(lines)+'\n'
    return re.sub(r'```text\n\n(.*?)\n\n```', r'```text\n\1\n```', result, flags=re.S)


def escape(value):
    return html.escape(str(value),quote=True)


def prompt_box(label,text):
    return f'<div class="copybox"><div class="boxhead"><b>{escape(label)}</b><button class="copy">复制提示词</button></div><pre>{escape(text)}</pre></div>'


def reference_audit(group, stories, source_hash):
    rows = [s for s in stories if s['id'].startswith(group)]
    lines = [f'# {group}组：当前参考交接清单',
             f"当前覆盖{len(rows)}条、{sum(len(s['shots']) for s in rows)}镜、{sum(len(s['segments']) for s in rows)}段。源SHA-256：`{source_hash}`。",
             '这份清单从当前稿派生，供逐项接收参考时核对；不构成已看过、上传或绑定实际图片的证明。实际文件、平台入口、模式和上传标签均待核。当前文字审阅范围见[设计审阅](../review/design-review.md)。',
             '人物图负责身份、可见服装和相应成长阶段的三维比例；场景图负责环境造型、材质与光线。动作起态、手脚、支撑、持物、遮挡和视线须逐镜与实图核对。各条编号是拟定上传顺序；一张合适的图可以承担经核实的多个职责。',
             '婴儿/幼儿不同阶段分别准备参考，不能把头像一致当作身体比例、活动能力和服装已经定义。严格首帧输入与多人物/场景参考是不同路径；人物图上传不表示已经绑定首帧，组合能力须按实际入口核对。',
             '本轮新道具需要看清结构及接触部位：拖鞋为干净轻软单只；眼镜镜架在取下前后是同一副；饮奶吸管杯要能看到内部组件是否连接；包裹轻且可由幼儿双臂托住；钓具磁头封闭、鱼完整；拼图始终同一底板和唯一七片。它们是本片设计条件，并非已具备的素材。',
             '中文对白、咿呀、笑声、呼吸和动作声以各镜为准，不从人物图推断声线或口型。没有对白的镜头仍可有自然声。所有动态和声音尚待媒体检查。']
    for story in rows:
        lines.extend([f"## {story['id']}《{story['title']}》", f"能力：{STAGES[story['stage']]}。{story['duration']}秒；{len(story['shots'])}镜。", '| 预留编号 | 对象 | 职责 |', '| --- | --- | --- |'])
        lines.extend(f"| {r['slot']} | {r['role']} | {r['use']}；实际文件未绑定。 |" for r in story['references'])
        lines.append('')
        for shot in story['shots']:
            lines.extend([f"### {shot['id']}", '开始画面待核：'+shot['start'], '出点与接续待核：'+shot['end'], '剪辑接口：'+shot['cut']])
    return '\n\n'.join(lines).replace('|\n\n|', '|\n|')+'\n'


def readme(stories, report):
    shot_count, segment_count = report['shots'], report['segments']
    return f'''# Seedance 2.5：{len(stories)}条剧情的分镜提示词

当前完整覆盖{len(stories)}条、{shot_count}镜、{segment_count}段、{report['seconds']}秒。宝宝叫“澈澈”。人物与场景参考由用户后续提供，当前没有实际文件绑定，没有执行媒体生成。

本轮已将家长亲述中的生活过程迁移到现有片目和九条新片。原帖事实、原创中文台词、导演调度与补写结尾分开记录，见[来源与改编对照](../research-adaptation.md)。新增R4稳步行走与初语、R5幼儿拼图与短句；各片按自身能力阶段制作，不能把两岁多的表现放进仰卧婴儿的身体。

- [可点击总览](index.html)：按片名/编号和内容线查找，逐镜或按段复制。
- [全部逐镜稿](all-shot-prompts.md) / [全部分段稿](multi-shot-segments.md)。
- [原剧情与导演分镜](../index.html) / [29条家长亲述素材](../research/real-experiences/index.html)。
- [检查结果](validation.json)；[B参考交接](B-reference-audit.md)、[F参考交接](F-reference-audit.md)、[G参考交接](G-reference-audit.md)。

## 参考与复制方式

1. 按每片表格的拟定顺序准备澈澈、实际出场家人和场景参考。编号仅为上传计划，实际标签必须与文件对应。身份/服装/三维造型交给人物图，家具/环境造型/材质和色彩交给场景图。
2. 原稿的门窗方位、承托和动作通道是当前导演设计。实图若不相容，先据实图调整空间和机位；人物图不自动提供手位、支撑、道具结构或动作轨迹。
3. 逐镜稿与多镜稿是同一套{shot_count}镜的两种组织方式，选择一种用于试制。每段保持原镜顺序与完整接触过程，设计长度不超过30秒。秒数是导演节奏预算，不保证模型精确复现。
4. 每个独立块保留素材职责、起态、动作阶段、机位/焦点、准确声音、出点与画外继承。原帖网址和改编说明留在稿外，不作为视频提示词提交。
5. 可选首帧稿只描述单一开始瞬间。采用严格首帧路径时，须将实际符合条件的图片绑定首帧输入，并核对入口对首帧与额外参考组合的支持。人物/场景参考不等于已经绑定首帧。

## 本轮采用的官方写法

2026-11-08核读火山方舟Seedance 2.5官方提示词指南的搜索索引正文；直接打开只返回文档壳，未取得完整正文文件，也未安装其推荐的sd25-pe。采用的范围为：明确上传顺序和素材职责，先交代主体/地点/事件，再按镜头写动作、摄影与声音，并明确无字幕、无额外配乐。[官方提示词指南](https://docs.volcengine.com/docs/ark/seedance-2-5-prompt-guide?lang=zh)

同日读取字节Seed发布说明正文，模型层公开单次最长30秒及多模态参考能力。本包据此规划≤30秒分段；用户实际平台、账号和模式的可选长度、素材准入及槽位仍待核，未假定与模型公告完全一致。[Seedance 2.5发布说明](https://seed.bytedance.com/en/blog/one-take-creation-flexible-referencing-introducing-seedance-2-5)

自然普通话对白逐字写入对应镜头，只有需要该能力的幼儿段落才给澈澈单词或短句；婴儿主要以笑声、呼吸与咿呀回应。文字中的台词、发声窗口和口部可见条件不构成声音或口型已经完成的证明。

`prompt-pack.json`是项目文字交接数据，不是任何供应商API请求。结构/时长/引用/全文一致性检查仅验证文字包；身份一致、接触、步态、音画同步与连贯播放须由实际媒体验收。
'''


def build_html(stories):
    story_count = len(stories)
    shot_count = sum(len(story['shots']) for story in stories)
    segment_count = sum(len(story['segments']) for story in stories)
    nav=''.join(f'<button class="storylink" data-story="{s["id"]}" data-group="{s["id"][0]}"><small>{s["id"]}</small>{escape(s["title"])}<span>{s["duration"]}秒 · {len(s["shots"])}镜 · {len(s["segments"])}段</span></button>' for s in stories)
    articles=[]
    for s in stories:
        refrows=''.join(f'<tr><td>{escape(r["slot"])}</td><td>{escape(r["role"])}</td><td>{escape(r["use"])}</td></tr>' for r in s['references'])
        common=f'<p class="notice">参考图尚未提供。表内编号为拟定上传顺序，实际上传后逐一核对角色与文件；人物外观以参考为准，空间布局须与实图相容。</p><table><thead><tr><th>拟定编号</th><th>对象</th><th>参考职责</th></tr></thead><tbody>{refrows}</tbody></table>'
        segments=''.join(f'<section><h3>{seg["id"]} <small>{seg["seconds"]}秒 · {" → ".join(seg["shots"])}</small></h3><details><summary>跨段承接状态</summary><p>入态：{escape(seg["incoming"])}</p><p>{escape(seg["incomingCut"])}</p><p>出态：{escape(seg["outgoing"])}</p><p>{escape(seg["outgoingCut"])}</p></details>{prompt_box("多镜参考生视频",seg["prompt"])}</section>' for seg in s['segments'])
        individual=''.join(f'<section><h3>{sh["id"]} <small>{sh["seconds"]}秒</small></h3><p class="muted">{escape(sh["purpose"])}</p>{prompt_box("逐镜参考生视频",sh["videoPrompt"])}<details><summary>首帧画面稿（可选）</summary>{prompt_box("单一开始瞬间",sh["imagePrompt"])}</details><p class="muted">剪辑接口：{escape(sh["cut"])}</p></section>' for sh in s['shots'])
        articles.append(f'<article id="{s["id"]}" hidden><div class="eyebrow">{GROUPS[s["id"][0]]} / {s["id"]}</div><h2>{escape(s["title"])}</h2><p class="muted">{s["duration"]}秒 · {len(s["shots"])}镜 · {len(s["segments"])}段 · {escape(STAGES[s["stage"]])} · {escape("、".join(s["characters"]))}</p>{research_adaptation.html_note(s, "../")}<div data-pane="segments">{common}{segments}</div><div data-pane="shots" hidden>{common}{individual}</div><div data-pane="story" hidden><p class="prose">{escape(s["story"])}</p><p><a href="stories/{s["id"]}.md">本条全部提示词 Markdown</a></p></div></article>')
    css='''*{box-sizing:border-box}body{margin:0;background:#faf7f1;color:#30383b;font:15px/1.8 "Microsoft YaHei","PingFang SC",sans-serif}a{color:#8e503e}button,input{font:inherit}button{cursor:pointer}aside{position:fixed;inset:0 auto 0 0;width:285px;background:#f1ede4;padding:24px 18px;overflow:auto;border-right:1px solid #ded8cb}aside h1{font-size:23px;margin:0}aside p{font-size:12px;color:#67757a}input{width:100%;padding:9px;border:1px solid #d4cbbb;border-radius:5px;background:#fffdf9}.groups{display:flex;flex-wrap:wrap;gap:5px;margin:12px 0}.groups button,.tabs button{border:1px solid #d8cebe;background:transparent;border-radius:5px;padding:6px 10px}.groups button.active,.tabs button.active{background:#30383b;color:white}.storylink{display:block;border:0;border-bottom:1px solid #ded8cb;background:none;width:100%;padding:11px 7px;text-align:left}.storylink small{display:inline-block;width:36px;color:#8e503e}.storylink span{display:block;padding-left:36px;font-size:11px;color:#67757a}.storylink.active{background:#faf7f1;border-left:3px solid #c77c67}.links{margin-top:20px}.links a{display:block;font-size:13px;margin:7px 0}main{margin-left:285px;padding:26px 45px 70px;max-width:1350px}.top{border-bottom:1px solid #ded8cb;padding-bottom:18px}.top p{margin:2px 0;font-size:13px;color:#67757a}.tabs{display:flex;gap:7px;position:sticky;top:0;background:#faf7f1;padding:14px 0;z-index:3;border-bottom:1px solid #ded8cb}.eyebrow{margin-top:26px;color:#8e503e;font-size:12px}h2{font-size:32px;line-height:1.4;margin:10px 0}h3{font-size:20px;margin-top:30px}h3 small{display:block;font-size:12px;font-weight:400;color:#67757a}.muted{color:#67757a;font-size:13px}.notice{padding:12px 15px;background:#eee8dc;border-left:3px solid #c77c67;font-size:13px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #ddd4c6;padding:10px;text-align:left}details{margin:15px 0}summary{cursor:pointer;color:#8e503e}.copybox{margin:14px 0;background:#fffdf9;border:1px solid #ded4c4;border-radius:6px;overflow:hidden}.boxhead{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e8dfd0;padding:10px 16px;font-size:13px}.copy{background:#eee7dc;border:1px solid #d3c8b8;border-radius:4px;padding:5px 10px}pre{font:14px/1.95 "Microsoft YaHei","PingFang SC",sans-serif;white-space:pre-wrap;overflow-wrap:anywhere;margin:0;padding:18px 20px;user-select:text}.prose{font-size:18px;line-height:2.1;max-width:780px}[hidden]{display:none!important}@media(max-width:850px){aside{position:relative;width:100%;max-height:300px}main{margin:0;padding:18px}.storylink{display:inline-block;width:48%;vertical-align:top}.tabs{flex-wrap:wrap}h2{font-size:28px}pre{font-size:14px;padding:14px}}'''
    js='''let active=location.hash.slice(1)||'B01',pane='segments',group='all';const links=[...document.querySelectorAll('.storylink')];function show(id){if(!document.getElementById(id))id='B01';active=id;document.querySelectorAll('article').forEach(a=>a.hidden=a.id!==id);links.forEach(b=>b.classList.toggle('active',b.dataset.story===id));history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'instant'})}function filter(){const q=document.getElementById('search').value.trim().toLowerCase();links.forEach(b=>b.hidden=!((group==='all'||b.dataset.group===group)&&b.textContent.toLowerCase().includes(q)))}links.forEach(b=>b.addEventListener('click',()=>show(b.dataset.story)));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{pane=b.dataset.tab;document.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==pane);document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x===b));window.scrollTo({top:0,behavior:'instant'})}));document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));filter()}));document.getElementById('search').addEventListener('input',filter);document.querySelectorAll('.copy').forEach(b=>b.addEventListener('click',async()=>{const text=b.closest('.copybox').querySelector('pre').textContent;try{await navigator.clipboard.writeText(text);b.textContent='已复制'}catch(e){const range=document.createRange();range.selectNodeContents(b.closest('.copybox').querySelector('pre'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);b.textContent='正文已选中，请复制'}}));window.addEventListener('hashchange',()=>show(location.hash.slice(1)));show(active);'''
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小小日常 · Seedance 2.5 分镜提示词</title><style>{css}</style></head><body><aside><h1>小小日常</h1><p>Seedance 2.5 · {story_count}条 / {shot_count}镜 / {segment_count}段</p><input id="search" aria-label="搜索片名或编号" placeholder="搜索片名或编号"><div class="groups"><button data-filter="all" class="active">全部</button><button data-filter="B">有趣行为</button><button data-filter="F">亲子时刻</button><button data-filter="G">成长</button></div><nav aria-label="全部{story_count}条">{nav}</nav><div class="links"><a href="README.md">使用说明与官方依据</a><a href="all-shot-prompts.md">完整逐镜提示词</a><a href="multi-shot-segments.md">全部{segment_count}段多镜稿</a><a href="../index.html">原剧情与导演分镜</a><a href="../research-adaptation.md">亲述来源与改编对照</a><a href="../research/real-experiences/index.html">29条家长亲述素材</a></div></aside><main><div class="top"><b>Seedance 2.5 分镜提示词</b><p>人物＋场景参考生视频 · 逐镜稿与≤30秒多镜稿 · 参考待提供</p></div><div class="tabs"><button data-tab="segments" class="active">分段多镜稿</button><button data-tab="shots">逐镜提示词</button><button data-tab="story">原剧情</button></div>{''.join(articles)}</main><script>{js}</script></body></html>'''


def validate_source_inventory(originals, catalogue):
    entries = re.findall(r'(?m)^\|\s*([BFG]\d{2})\s*\|\s*([^|]+?)\s*\|', catalogue)
    expected_ids = [sid for sid, _ in entries]
    titles = dict(entries)
    errors = []
    if not expected_ids or len(expected_ids) != len(set(expected_ids)):
        errors.append('catalogue: empty or duplicate story IDs')
    if [story.get('id') for story in originals] != expected_ids:
        errors.append('source: missing, duplicate or out-of-order catalogue IDs')
    planned_ids = set(CUTS) | {s['id'] for s in originals if 'segmentStops' in s}
    if planned_ids != set(expected_ids):
        errors.append('segment plans: missing or extra catalogue IDs')
    for story in originals:
        sid = story['id']
        if story.get('title') != titles.get(sid):
            errors.append(sid+': title differs from current catalogue')
        if not isinstance(story.get('duration'), int) or not 30 <= story['duration'] <= 60:
            errors.append(sid+': story duration outside 30—60 seconds')
        shots = story['shots']
        if [shot.get('id') for shot in shots] != [f'{sid}-S{i:02d}' for i in range(1, len(shots)+1)]:
            errors.append(sid+': shot IDs missing, duplicate or out of order')
        if any(type(shot.get('seconds')) is not int or shot['seconds'] <= 0 for shot in shots):
            errors.append(sid+': shot duration must be positive integer seconds')
            continue
        if sum(shot['seconds'] for shot in shots) != story.get('duration'):
            errors.append(sid+': source shot durations do not equal story duration')
        for shot in shots:
            phases = shot.get('phases', [])
            if (not phases or any(type(phase.get('seconds')) is not int or phase['seconds'] <= 0 or not phase.get('action') for phase in phases)
                    or sum(phase.get('seconds', 0) for phase in phases) != shot['seconds']):
                errors.append(shot['id']+': source phase duration or action invalid')
        try:
            segment_stops(story)
        except ValueError as exc:
            errors.append(str(exc))
    if errors:
        raise ValueError(errors)
    return {'stories':len(expected_ids),
            'shots':sum(len(story['shots']) for story in originals),
            'segments':planned_segment_count(originals),
            'seconds':sum(story['duration'] for story in originals)}


def main():
    stories=[]
    originals=[]
    hashes={}
    for group in GROUPS:
        src=ROOT/'source'/f'{group}.json'
        hashes[group]=hashlib.sha256(src.read_bytes()).hexdigest()
        data=json.loads(src.read_text(encoding='utf-8-sig'))
        if data.get('group') != group or any(not story['id'].startswith(group) for story in data['stories']):
            raise ValueError(f'{group}: source group mismatch')
        originals.extend(data['stories'])
    catalogue=(ROOT.parent/'baby-family-short-video-topics.md').read_text(encoding='utf-8-sig')
    expected_counts=validate_source_inventory(originals,catalogue)
    for original in originals:
        item={key:original[key] for key in ['id','title','duration','characters','stage','scene','story']}
        if 'researchAdaptation' in original:
            item['researchAdaptation'] = original['researchAdaptation']
        item['references']=refs(original)
        item['shots']=[make_shot(original,shot) for shot in original['shots']]
        item['segments']=make_segments(original)
        stories.append(item)
    errors=[]
    for story in stories:
        flat=[sid for seg in story['segments'] for sid in seg['shots']]
        if flat != [sh['id'] for sh in story['shots']]: errors.append(story['id']+': coverage')
        if any(not 4<=seg['seconds']<=30 for seg in story['segments']): errors.append(story['id']+': segment duration')
        if sum(seg['seconds'] for seg in story['segments'])!=story['duration']: errors.append(story['id']+': duration sum')
        for shot in story['shots']:
            for phase in shot['phases']:
                if phase['action'] not in shot['videoPrompt']: errors.append(shot['id']+': phase missing')
            if shot['sound'] not in shot['videoPrompt']: errors.append(shot['id']+': sound missing')
            for key in ['videoPrompt','imagePrompt']:
                for r in story['references']:
                    if r['slot'] not in shot[key]: errors.append(shot['id']+': reference missing')
                if re.search(r'(?<![A-Za-z0-9-])(?:P\d{2}|[BFG]\d{2}-X\d{2}|T01|R[0-5]|S0[1-9])(?![A-Za-z0-9-])',shot[key]): errors.append(shot['id']+': unexplained production id')
                if any(t in shot[key] for t in ['深棕眼','短黑绒发','砖陶色棉衬衫','深棕低马尾']): errors.append(shot['id']+': temporary appearance override')
        for segment in story['segments']:
            for shot in story['shots']:
                if shot['id'] not in segment['shots']: continue
                if shot['start'] not in segment['prompt']: errors.append(segment['id']+': start missing')
                if shot['end'] not in segment['prompt']: errors.append(segment['id']+': end missing')
                if shot['sound'] not in segment['prompt']: errors.append(segment['id']+': sound missing')
                for phase in shot['phases']:
                    if phase['action'] not in segment['prompt']: errors.append(segment['id']+': action missing')
    report={'stories':len(stories),'shots':sum(len(s['shots']) for s in stories),'segments':sum(len(s['segments']) for s in stories),'seconds':sum(s['duration'] for s in stories),'sourceHashes':hashes,'errors':errors,'referenceState':'planned order; no files observed or bound','entryState':'Seedance 2.5 target surface and mode not verified'}
    for key, expected in expected_counts.items():
        if report[key] != expected:
            errors.append(f'{key}: exported {report[key]} differs from current inventory {expected}')
    if errors: raise ValueError(errors)
    (OUT/'stories').mkdir(exist_ok=True)
    for story in stories:
        (OUT/'stories'/f"{story['id']}.md").write_text(story_markdown(story, '../../'),encoding='utf-8')
    intro=f"# Seedance 2.5：{len(stories)}条剧情分镜提示词\n\n人物、场景参考待提供；编号是拟定上传顺序。按[使用说明](README.md)上传并核对后使用。\n\n"
    (OUT/'all-shot-prompts.md').write_text(intro+'\n\n'.join(story_markdown(s) for s in stories),encoding='utf-8')
    segments=[f"# {s['id']}《{s['title']}》\n\n"+'\n\n'.join(f"## {seg['id']} / {seg['seconds']}秒\n\n镜头：{' → '.join(seg['shots'])}\n\n```text\n{seg['prompt']}\n```\n\n下一段承接：{seg['outgoing']}\n\n{seg['outgoingCut']}" for seg in s['segments']) for s in stories]
    (OUT/'multi-shot-segments.md').write_text(intro+'\n\n'.join(segments),encoding='utf-8')
    (OUT/'prompt-pack.json').write_text(json.dumps({'note':'Project text handoff; not a provider API schema','stories':stories},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'index.html').write_text(build_html(stories),encoding='utf-8')
    (OUT/'README.md').write_text(readme(stories, report), encoding='utf-8')
    for group in GROUPS:
        (OUT/f'{group}-reference-audit.md').write_text(reference_audit(group, stories, hashes[group]), encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))


if __name__=='__main__':
    main()
