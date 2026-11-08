"""Render source/adaptation notes outside the media generation prompts."""
from __future__ import annotations

import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CASES = {case['id']: case for case in json.loads(
    (ROOT / 'research' / 'real-experiences' / 'experiences.json').read_text(encoding='utf-8'))['cases']}
LABELS = {'retained': '采用的生活过程', 'fictionalized': '本片原创改编', 'notClaimed': '不作出的事实推断'}
RESERVED = {
    'IN01': '包含喂食与家长受伤害的完整后续，不能只摘抓食物的可爱瞬间；本轮保留原记录。',
    'IN04': '原帖未交代浴中支撑与器具，本轮先完成已有客厅与休息角的故事。',
    'IN06': '太阳镜反复摘戴与本轮亲吻时取眼镜题材接近，保留另一独立家庭的记录。',
    'IN07': '进食吹口水与既有B08的纯发声探索不同，未合并成同一事件。',
    'ZH03': '镜前由哭转笑的过程缺少现场细节，保留为后续补充方向。',
    'ZH05': '接尾音到完整歌相隔一个月，未压缩成一次睡前就学会的故事。',
    'RT02': '作者未亲眼看到谁按下空调遥控器，不据此补写确定的开空调过程。',
    'RT04': '电视反光里的自我观看可独立开发，本轮优先动作过程更完整的九条。',
    'TD01': '藏衣服的动作未被作者看见，不能从事后发现直接补成现场事实。',
    'TD02': '土豆经历跨多个环节且是另一幼儿的经历，本轮未迁移到澈澈。',
    'TD03': '依赖接近三岁幼儿的语言反差，保留给后续语言阶段。',
    'TD04': '侦探仪式是一段持续习惯，不虚构单次找回物品的结局。',
    'TD05': '依赖另一家庭的固定内部笑话，未直接替换称呼复制。',
    'TD06': '跨18个月到2岁半的习惯形成，不改写成一次用餐当场的误会。',
    'TD08': '原帖没有成功改分工的单次结尾，未与TD07混为一户。',
}


def markdown(story, prefix=''):
    adaptation = story.get('researchAdaptation')
    if not adaptation:
        return ''
    lines = ['### 亲述来源与改编', '原帖是家长自述，未独立核实。本片将生活机制改编为澈澈的原创故事。']
    for cid in adaptation['caseIds']:
        case = CASES[cid]
        lines.append(f"- [{cid} · {case['title']}]({case['source']['url']})；作者自报年龄：{case['ageReported']}。")
    for key, label in LABELS.items():
        for text in adaptation[key]:
            lines.append(f'- **{label}：**{text}')
    lines.append(f'[查看原始过程与缺项]({prefix}research/real-experiences/index.html#{adaptation["caseIds"][0]})')
    return '\n\n'.join(lines)


def html_note(story, prefix=''):
    adaptation = story.get('researchAdaptation')
    if not adaptation:
        return ''
    esc = lambda value: html.escape(str(value), quote=True)
    parts = ['<details class="adaptation"><summary>亲述来源与本片改编</summary>',
             '<p>原帖是家长自述，未独立核实。澈澈的角色、调度、台词和补写结尾属于原创改编。</p><ul>']
    for cid in adaptation['caseIds']:
        case = CASES[cid]
        parts.append(f'<li><a href="{esc(case["source"]["url"])}">{cid} · {esc(case["title"])}</a>；{esc(case["ageReported"])}</li>')
    parts.append('</ul>')
    for key, label in LABELS.items():
        parts.append(f'<p><b>{label}</b></p><ul>')
        parts.extend(f'<li>{esc(text)}</li>' for text in adaptation[key])
        parts.append('</ul>')
    parts.append(f'<p><a href="{prefix}research/real-experiences/index.html#{adaptation["caseIds"][0]}">查看原始过程与缺项</a></p></details>')
    return ''.join(parts)


def build_report(stories):
    mapping = {cid: [] for cid in CASES}
    for story in stories:
        for cid in story.get('researchAdaptation', {}).get('caseIds', []):
            mapping[cid].append(story['id'])
    lines = ['# 亲述来源与澈澈故事改编对照',
             '当前稿将家长公开自述作为生活过程的素材，未独立核实事件。原作者家庭、月龄与经历不会转为澈澈的真实履历。角色、空间、镜头、中文对白及补写的结果属于原创改编。',
             '已把本轮采用的机制写进故事、分镜、母稿及Seedance 2.5独立/分段提示词；没有使用的素材仍在原素材库，未冒称已经全部改编。',
             '## 29条素材的处理', '| 素材 | 当前去向 | 处理说明 |', '| --- | --- | --- |']
    for cid, case in CASES.items():
        targets = '、'.join(mapping[cid])
        explanation = '逐条采用与改动范围见下文。' if targets else RESERVED.get(cid, '保留在素材库，本轮未迁移。')
        lines.append(f'| [{cid} {case["title"]}]({case["source"]["url"]}) | {targets or "素材保留"} | {explanation} |')
    table_start = next(i for i, line in enumerate(lines) if line.startswith('| 素材'))
    lines = lines[:table_start] + ['\n'.join(lines[table_start:])]
    lines.extend(['', '## 已采用素材的逐片边界'])
    for story in stories:
        if story.get('researchAdaptation'):
            lines.extend([f'## {story["id"]}《{story["title"]}》', markdown(story)])
    (ROOT / 'research-adaptation.md').write_text('\n\n'.join(lines)+'\n', encoding='utf-8')
