"""Render the current authored stories into readable documents and diagram boards.

This is a local layout/check helper. It does not author stories, call media models,
or certify visual quality. JSON files under source/ are the authored current text.
"""
from __future__ import annotations

import argparse
import base64
import html
import json
import re
import runpy
import textwrap
import xml.etree.ElementTree as ET
from pathlib import Path

import research_adaptation

ROOT = Path(__file__).resolve().parent
GROUPS = {"B": "婴儿有趣行为", "F": "家庭亲子时刻", "G": "成长小变化"}
STAGES = {"R0": "仰卧与翻身探索", "R1": "坐姿与手部互动", "R2": "爬行与扶站", "R3": "初步迈步", "R4": "稳步行走与初语", "R5": "幼儿拼图与短句"}
INK, MUTED, PAPER, CORAL, BLUE, SAGE = "#30383b", "#67757a", "#faf7f1", "#c77c67", "#88a4b0", "#a2b29b"


def esc(value):
    return html.escape(str(value), quote=True)


def svg_text(x, y, value, size=18, fill=INK, width=36, weight=400, anchor="start"):
    lines = []
    for paragraph in str(value).splitlines():
        lines.extend(textwrap.wrap(paragraph, width=width, break_long_words=True) or [""])
    spans = "".join(f'<tspan x="{x}" dy="{0 if i == 0 else size * 1.48}">{esc(line)}</tspan>' for i, line in enumerate(lines))
    return f'<text x="{x}" y="{y}" fill="{fill}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}">{spans}</text>'


def svg_doc(title, content, width=1200, height=780):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-label="{esc(title)}">
<defs><linearGradient id="skin"><stop stop-color="#f2d3bf"/><stop offset="1" stop-color="#dcae96"/></linearGradient>
<linearGradient id="soft"><stop stop-color="#e5dcd0"/><stop offset="1" stop-color="#c0b4a7"/></linearGradient>
<pattern id="cloth" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#eee5d6"/><path d="M0 2H9M2 0V9" stroke="#d8cdbd" stroke-width=".6"/></pattern>
<pattern id="wood" width="40" height="22" patternUnits="userSpaceOnUse"><rect width="40" height="22" fill="#c8ac89"/><path d="M0 6Q20 0 40 8M0 15Q20 21 40 13" fill="none" stroke="#a48767" stroke-width="1"/></pattern>
<marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="{CORAL}" stroke-width="1.3"/></marker></defs>
<rect width="100%" height="100%" fill="{PAPER}"/>
<g font-family="Microsoft YaHei, PingFang SC, sans-serif">{svg_text(42, 54, title, 30, weight=700)}
{svg_text(42, 88, '原创视觉设计提案 / 矢量示意；非生成电影帧、非实测光材', 15, MUTED)}{content}</g></svg>'''


def avatar(x, y, baby=False, color=BLUE, scale=1):
    s = scale
    r = 34 * s if baby else 27 * s
    tail = f'<path d="M{20*s} {-14*s}Q{52*s} {-5*s} {35*s} {32*s}Q{17*s} {16*s} {20*s} {-14*s}" fill="#463831"/>' if not baby and color == BLUE else ""
    return f'''<g transform="translate({x} {y})"><ellipse cx="0" cy="{79*s}" rx="{47*s}" ry="{10*s}" fill="#ddddda"/>
{tail}
<rect x="{-31*s}" y="{18*s}" width="{62*s}" height="{63*s}" rx="{24*s}" fill="{color}"/>
<circle cy="{-14*s}" r="{r}" fill="url(#skin)" stroke="#af8878" stroke-width="{1*s}"/>
<path d="M{-18*s} {-40*s}Q{0*s} {-57*s} {19*s} {-38*s}" fill="#3d3430"/>
<path d="M{-5*s} {-43*s}Q{1*s} {-59*s} {12*s} {-47*s}" fill="none" stroke="#3d3430" stroke-width="{5*s}"/>
<circle cx="{-11*s}" cy="{-15*s}" r="{2.6*s}" fill="#40352f"/><circle cx="{11*s}" cy="{-15*s}" r="{2.6*s}" fill="#40352f"/>
<path d="M{-7*s} {-1*s}Q0 {7*s} {7*s} {-1*s}" fill="none" stroke="#a25f58" stroke-width="{2*s}"/>
<path d="M{-25*s} {35*s}L{-47*s} {59*s}M{25*s} {35*s}L{47*s} {59*s}" stroke="{color}" stroke-width="{16*s}" stroke-linecap="round"/>
<path d="M{-15*s} {77*s}L{-30*s} {94*s}M{15*s} {77*s}L{30*s} {94*s}" stroke="#c5b7a3" stroke-width="{15*s}" stroke-linecap="round"/></g>'''


def make_visuals():
    out = ROOT / "visual"
    out.mkdir(exist_ok=True)
    cards = {}
    body = avatar(180, 300, True, "#eee5d6", 1.5) + avatar(490, 265, False, CORAL, 1.8) + avatar(820, 265, False, BLUE, 1.8)
    body += svg_text(115, 490, "澈澈 · 身份锚点", 23, weight=700) + svg_text(80, 530, "圆脸 / 短黑绒发 / 额前右弯发撮\n奶油棉连体衣 / 身体随能力阶段变化", 18, width=23)
    body += svg_text(415, 490, "爸爸 · 砖陶棉衬衫", 23, weight=700) + svg_text(385, 530, "肩背与手部动作克制\n先忙自己的事，再接收宝宝的反应", 18, width=23)
    body += svg_text(745, 490, "妈妈 · 雾蓝棉上衣", 23, weight=700) + svg_text(715, 530, "低马尾 / 放松的重心\n允许安静、等待与被逗笑", 18, width=23)
    body += svg_text(60, 665, "表现语法：圆润而可分辨的轮廓；先看见再行动；表情随刺激变化；接触与重量真实可读。", 20, width=54)
    cards["01-style.svg"] = svg_doc("G1 · 角色与风格卡", body)

    palette = [("C01 奶油", "#eee5d6", "连体衣、地垫；留住织物细节"), ("C02 砖陶", CORAL, "爸爸；家庭的暖色锚点"), ("C03 雾蓝", BLUE, "妈妈、车座；与皮肤分离"), ("C04 鼠尾草", SAGE, "积木与布书的辅助色"), ("C05 珊瑚", "#d98c7c", "软布环；关键道具强调"), ("C06 肤色参考", "#e8bca6", "预览设计值；随光自然变化")]
    body = ""
    for i, (name, color, note) in enumerate(palette):
        x, y = 55 + (i % 3) * 380, 140 + (i // 3) * 245
        body += f'<rect x="{x}" y="{y}" width="340" height="125" rx="12" fill="{color}"/>'
        body += svg_text(x, y + 158, name + "  " + color.upper(), 20, weight=700) + svg_text(x, y + 191, note, 17, width=23)
    body += svg_text(55, 690, "色彩进程：好奇—轻暖中性；互动—道具点色清楚；休息—降低环境亮度而不丢脸部可读性。\nHEX 为 sRGB 设计预览；不作为实测材质色、LUT 或精确模型控制。", 17, width=62)
    cards["02-palette.svg"] = svg_doc("G1 · 配色卡", body)

    mats = [("M01 澈澈皮肤", "url(#skin)", "宽柔亮部，保留面颊体积；避免塑料反光"), ("M02 棉连体衣", "url(#cloth)", "细织纹、软折痕；不逐镜换针织结构"), ("M03 软布环 P01", "#d98c7c", "可轻压变形，松手恢复；接触处有压痕"), ("M04 木盒 P07", "url(#wood)", "钝边、低对比木纹；不反光抢脸"), ("M05 车架 S01", "#5e6a6d", "稳定刚性结构，柔和窄高光"), ("M06 布书 P05", "#a2b29b", "可翻布页，响纸页位置固定")]
    body = ""
    for i, (name, fill, note) in enumerate(mats):
        x, y = 60 + (i % 3) * 380, 140 + (i // 3) * 255
        body += f'<rect x="{x}" y="{y}" width="332" height="143" rx="16" fill="{fill}" stroke="#b7b0a8"/>'
        body += svg_text(x, y + 178, name, 22, weight=700) + svg_text(x, y + 210, note, 16, width=22)
    body += svg_text(60, 713, "图中是矢量响应示意。真实皮肤、织物与接触小样仍待生成；保持同一造型比较光照。", 17, width=61)
    cards["03-material.svg"] = svg_doc("G1 · 材质卡", body)

    body = avatar(270, 320, True, "#eee5d6", 1.8) + avatar(780, 320, True, "#eee5d6", 1.8)
    body += '<rect x="70" y="160" width="70" height="170" rx="5" fill="#e2edf0" stroke="#88a4b0"/><rect x="580" y="160" width="70" height="170" rx="5" fill="#c5d6dd" stroke="#88a4b0"/>'
    body += '<path d="M145 210L225 280M655 210L735 280" stroke="#c77c67" stroke-width="4" marker-end="url(#arrow)"/>'
    body += svg_text(80, 520, "L-DAY / 客厅日光", 24, weight=700) + svg_text(80, 563, "西窗漫射 → 面颊和手部有体积\n浅墙与地垫反射补暗侧，接触阴影仍存在\n反打保持世界西侧光源，不镜像窗户", 19, width=29)
    body += svg_text(590, 520, "N-NAP / 休息角午后", 24, weight=700) + svg_text(590, 563, "同为西窗较弱漫射，背景更安静\n维持眼部、手与床栏可读，不额外发光\n醒来后仍沿用同一光向", 19, width=29)
    body += svg_text(70, 708, "曝光意向：皮肤与奶油衣不溢白；暗侧留形体。示意不等于照度测量或受光样片。", 18, width=61)
    cards["04-lighting.svg"] = svg_doc("G1 · 灯光卡", body)

    body = ""
    for ox, label, nap in [(50, "L 客厅", False), (645, "N 休息角", True)]:
        body += f'<rect x="{ox}" y="150" width="505" height="415" rx="8" fill="#f0ece3" stroke="#535f64" stroke-width="3"/>'
        body += f'<rect x="{ox-5}" y="245" width="12" height="150" fill="#88a4b0"/><path d="M{ox+15} 285L{ox+225} 320" stroke="#c77c67" stroke-width="4" marker-end="url(#arrow)"/>'
        if not nap:
            body += f'<rect x="{ox+95}" y="166" width="270" height="67" rx="12" fill="#c8c7b8"/><ellipse cx="{ox+255}" cy="390" rx="160" ry="95" fill="#eee5d6"/>'
            body += svg_text(ox + 170, 210, "北墙固定沙发", 18) + svg_text(ox + 190, 395, "中央地垫", 20)
            body += f'<circle cx="{ox+200}" cy="370" r="25" fill="#e8bca6"/><circle cx="{ox+320}" cy="440" r="23" fill="#c77c67"/>'
        else:
            body += f'<rect x="{ox+110}" y="180" width="250" height="190" rx="12" fill="#d8c9b0" stroke="#a18b6b"/><rect x="{ox+126}" y="195" width="218" height="158" fill="#eee5d6"/><circle cx="{ox+235}" cy="280" r="24" fill="#e8bca6"/><circle cx="{ox+235}" cy="440" r="25" fill="#88a4b0"/>'
            body += svg_text(ox + 165, 330, "婴儿床", 20) + svg_text(ox + 160, 493, "照顾者在床南侧", 18)
        body += svg_text(ox + 30, 610, label, 25, weight=700) + svg_text(ox + 30, 650, "西窗 / 东侧门 / 北墙固定\n主机位位于南侧；具体调度见各条空间卡", 17, width=29)
        body += f'<path d="M{ox+450} 225V180" stroke="#535f64" stroke-width="3" marker-end="url(#arrow)"/>' + svg_text(ox + 438, 168, "北", 18)
        body += f'<rect x="{ox+499}" y="440" width="12" height="80" fill="#faf7f1"/>' + svg_text(ox + 430, 550, "东门", 16)
    cards["05-light-plot.svg"] = svg_doc("G1 / G2 · 共享光位与空间图", body)

    cases = [("T01 客厅共享双人", "脸、手、道具同时可读；暗侧保留体积"), ("T02 面颊与棉衣近景", "肤色和衣料分离；不油亮、不纹理闪动"), ("T03 手—软布环接触", "抓稳后才释放；布环形状、数量连续"), ("T04 反向机位", "窗仍在世界西侧；反打光向有依据"), ("T05 休息角醒来", "较弱日光下眼神与伸手仍可见"), ("T06 脚—车沿接触", "脚有支撑、腿不穿框、车架保持刚性")]
    body = ""
    for i, (name, note) in enumerate(cases):
        x, y = 45 + (i % 3) * 390, 135 + (i // 3) * 280
        body += f'<rect x="{x}" y="{y}" width="355" height="155" rx="12" fill="#eee9e1" stroke="#c0b7aa"/>'
        if i == 0:
            body += avatar(x + 115, y + 61, False, CORAL, .55) + avatar(x + 235, y + 75, True, "#eee5d6", .50)
        elif i == 1:
            body += avatar(x + 178, y + 62, True, "url(#cloth)", .75)
        elif i == 2:
            body += diagram_icon("hand", "右手", x + 120, y + 76) + diagram_icon("prop", "布环", x + 175, y + 82)
            body += f'<path d="M{x+137} {y+80}L{x+160} {y+82}" stroke="#c77c67" stroke-width="3"/>'
        elif i == 3:
            body += f'<rect x="{x+25}" y="{y+28}" width="35" height="80" fill="#88a4b0"/><path d="M{x+65} {y+62}L{x+210} {y+83}" stroke="#c77c67" stroke-width="3" marker-end="url(#arrow)"/>'
            body += avatar(x + 235, y + 67, True, "#eee5d6", .52)
        elif i == 4:
            body += f'<rect x="{x+18}" y="{y+17}" width="319" height="103" rx="10" fill="#b8c2c2"/>' + avatar(x + 180, y + 65, True, "#eee5d6", .52)
        else:
            body += diagram_icon("stroller", "车沿", x + 175, y + 84) + diagram_icon("foot", "左脚", x + 172, y + 45)
        body += svg_text(x + 12, y + 184, name, 20, weight=700) + svg_text(x + 12, y + 214, note, 16, width=22)
        body += svg_text(x + 12, y + 141, "已绘制测试构想 · 实际样片待制作", 12, MUTED)
    body += svg_text(50, 742, "比较时固定身份、造型与观察视图，分别测试中性光及场景光；当前未通过任何真实光材/动态审片。", 16, width=68)
    cards["06-lookdev-test-board.svg"] = svg_doc("G1 / G6 · 光材联合测试设计板", body, height=790)
    for name, content in cards.items():
        ET.fromstring(content)
        (out / name).write_text(content, encoding="utf-8")
    return cards


def diagram_icon(kind, label, x, y):
    color = CORAL if kind == "adult" else BLUE
    if kind in {"baby", "adult", "face"}:
        r = 20 if kind == "baby" else 17
        shape = f'<circle cx="{x}" cy="{y-10}" r="{r}" fill="#e8bca6" stroke="#786252"/><path d="M{x-16} {y+12}Q{x} {y+5} {x+16} {y+12}L{x+23} {y+38}H{x-23}Z" fill="{color if kind != "baby" else "#eee5d6"}" stroke="#8d8b83"/>'
    elif kind in {"hand", "foot"}:
        shape = f'<ellipse cx="{x}" cy="{y}" rx="{18 if kind == "hand" else 26}" ry="13" fill="#e8bca6" stroke="#a57d67"/>'
        for i in range(4):
            shape += f'<circle cx="{x-13+i*8}" cy="{y-11}" r="4" fill="#e8bca6" stroke="#a57d67" stroke-width=".6"/>'
    elif kind in {"stroller", "crib", "sofa"}:
        shape = f'<rect x="{x-42}" y="{y-23}" width="84" height="48" rx="8" fill="#d4dedf" stroke="#66797e" stroke-width="2"/>'
        if kind == "stroller":
            shape += f'<circle cx="{x-30}" cy="{y+34}" r="10" fill="#67757a"/><circle cx="{x+30}" cy="{y+34}" r="10" fill="#67757a"/>'
    elif kind == "book":
        shape = f'<path d="M{x} {y-20}Q{x-25} {y-30} {x-35} {y-15}V{y+22}Q{x-20} {y+12} {x} {y+22}Q{x+20} {y+12} {x+35} {y+22}V{y-15}Q{x+25} {y-30} {x} {y-20}" fill="#a2b29b" stroke="#59715d"/>'
    else:
        if "环" in label:
            shape = f'<ellipse cx="{x}" cy="{y}" rx="19" ry="15" fill="none" stroke="#d98c7c" stroke-width="10"/>'
        elif "球" in label:
            shape = f'<circle cx="{x}" cy="{y}" r="18" fill="#d4b369" stroke="#a48748"/>'
        else:
            shape = f'<rect x="{x-28}" y="{y-15}" width="56" height="30" rx="7" fill="#cad4bc" stroke="#879b7e"/>'
    return shape


def make_board(story):
    n = len(story["shots"])
    cols, cw, ch, margin = 3, 310, 780, 28
    width, height = cols * cw + margin * 2, ((n + cols - 1) // cols) * ch + 140
    body = ""
    for i, shot in enumerate(story["shots"]):
        x, y = margin + (i % cols) * cw, 130 + (i // cols) * ch
        fw, fh = 266, 472
        body += f'<rect x="{x}" y="{y}" width="{fw}" height="{fh}" rx="8" fill="#f0ede6" stroke="#b8b2a8" stroke-width="2"/>'
        body += f'<path d="M{x+12} {y+fh*.78}H{x+fw-12}" stroke="#d0c9bc"/>'
        for obj in shot["diagram"]:
            xx = x + fw * obj["x"] / 100
            yy = y + fh * obj["y"] / 100
            body += diagram_icon(obj["kind"], obj["label"], xx, yy)
        for j, obj in enumerate(shot["diagram"]):
            xx = x + fw * obj["x"] / 100
            yy = y + fh * obj["y"] / 100
            badge_x = min(x + fw - 13, max(x + 13, xx + 22))
            badge_y = min(y + fh - 13, max(y + 13, yy - 30))
            body += f'<circle cx="{badge_x}" cy="{badge_y}" r="11" fill="#faf7f1" stroke="#7e898b"/>'
            body += svg_text(badge_x, badge_y + 5, str(j + 1), 13, anchor="middle")
            body += svg_text(x, y + fh + 145 + j * 22, f'{j+1}. {obj["label"]}', 13, width=19)
        body += svg_text(x, y + fh + 28, f'{shot["id"]} · {shot["seconds"]} 秒', 19, weight=700)
        body += svg_text(x, y + fh + 55, shot["purpose"], 14, width=18)
    content = svg_doc(f'{story["id"]}《{story["title"]}》分镜构图板', body, width, height)
    content = content.replace('原创视觉设计提案 / 矢量示意；非生成电影帧、非实测光材', '9:16 构图与位置示意；动作、接触和画外继承以逐镜卡为准；非生成关键帧')
    ET.fromstring(content)
    return content


def make_timeline(story):
    x, y, w, h = 45, 140, 1110, 85
    body = ""
    elapsed = 0
    colors = [CORAL, BLUE, SAGE, "#b5a28a"]
    for i, shot in enumerate(story["shots"]):
        sw = w * shot["seconds"] / story["duration"]
        sx = x + w * elapsed / story["duration"]
        body += f'<rect x="{sx}" y="{y}" width="{sw}" height="{h}" fill="{colors[i%4]}" stroke="#faf7f1" stroke-width="3"/>'
        body += svg_text(sx + sw / 2, y + 35, shot["id"].split("-")[-1], 16, "#fff", anchor="middle")
        body += svg_text(sx + sw / 2, y + 63, str(shot["seconds"]) + "s", 16, "#fff", anchor="middle")
        body += svg_text(sx, y + h + 30, str(elapsed) + "s", 14)
        elapsed += shot["seconds"]
    body += svg_text(x + w, y + h + 30, str(elapsed) + "s", 14, anchor="end")
    body += svg_text(45, 315, "24 fps 设计时间基准；镜头相接不重叠。声音事件见逐镜正文，真实发声长度与剪辑效果待素材返回后复核。", 18, width=65)
    return svg_doc(story["id"] + " · 声画时间线", body, height=400)


def validate(stories):
    errors = []
    catalogue = (ROOT.parent / "baby-family-short-video-topics.md").read_text(encoding="utf-8-sig")
    entries = re.findall(r"(?m)^\|\s*([BFG]\d{2})\s*\|\s*([^|]+?)\s*\|", catalogue)
    expected = [sid for sid, _ in entries]
    titles = dict(entries)
    if not expected or len(expected) != len(set(expected)):
        errors.append("当前选题库为空或有重复 ID")
    if [s.get("id") for s in stories] != expected:
        errors.append("选题 ID 缺失、重复或顺序错误")
    shot_ids = set()
    total_seconds, total_shots = 0, 0
    report_rows = []
    required_shot = ["purpose", "framing", "camera", "focus", "start", "sound", "end", "cut", "continuity", "openingPrompt", "videoPrompt"]
    for s in stories:
        sid = s["id"]
        if s.get("title") != titles.get(sid): errors.append(f"{sid} 片名未继承当前选题库")
        for f in ["title", "intent", "space", "performance", "story", "soundDesign", "mediaPending"]:
            if not isinstance(s.get(f), str) or not s[f].strip(): errors.append(f"{sid} 缺少 {f}")
        if not 30 <= s.get("duration", 0) <= 60: errors.append(f"{sid} 时长超范围")
        if s.get("stage") not in STAGES: errors.append(f"{sid} 能力阶段无效")
        if len(s.get("story", "")) < 130: errors.append(f"{sid} 剧情可能未完整展开")
        if not 4 <= len(s.get("shots", [])) <= 12: errors.append(f"{sid} 镜头数异常")
        beats = {b["id"]: b for b in s.get("beats", [])}
        owned = {p["id"] for p in s.get("shots", [])}
        for b in beats.values():
            if not b.get("text") or not b.get("shots"): errors.append(f"{sid} 节拍缺正文或覆盖")
            if not set(b.get("shots", [])) <= owned: errors.append(f"{sid} 节拍引用外来镜号")
        elapsed = 0
        for p in s["shots"]:
            pid = p["id"]
            if pid in shot_ids: errors.append(f"重复镜号 {pid}")
            shot_ids.add(pid)
            if not re.fullmatch(re.escape(sid) + r"-S\d{2}", pid): errors.append(f"{pid} 镜号格式错误")
            for f in required_shot:
                if not isinstance(p.get(f), str) or not p[f].strip(): errors.append(f"{pid} 缺少 {f}")
            if len(p.get("openingPrompt", "")) < 55 or len(p.get("videoPrompt", "")) < 90: errors.append(f"{pid} 制作母稿可能未完整展开")
            if any(token in p.get("openingPrompt", "") + p.get("videoPrompt", "") for token in ["同上", "其余略", "后续补", "TODO", "TBD"]): errors.append(f"{pid} 制作母稿含未展开占位")
            if p.get("beat") not in beats: errors.append(f"{pid} 缺少节拍引用")
            elif pid not in beats[p["beat"]]["shots"]: errors.append(f"{pid} 节拍双向覆盖不一致")
            sec = p.get("seconds", 0)
            if not isinstance(sec, int) or sec <= 0: errors.append(f"{pid} 镜长须为正整数秒")
            phases = p.get("phases", [])
            if not phases or sum(x.get("seconds", 0) for x in phases) != sec: errors.append(f"{pid} 动作阶段时长不闭合")
            if any(not x.get("action") or x.get("seconds", 0) <= 0 for x in phases): errors.append(f"{pid} 动作阶段缺失")
            diagram = p.get("diagram", [])
            if len(diagram) < 2: errors.append(f"{pid} 构图对象不足")
            for obj in diagram:
                if not obj.get("label") or not 0 <= obj.get("x", -1) <= 100 or not 0 <= obj.get("y", -1) <= 100: errors.append(f"{pid} 构图对象无效")
            elapsed += sec
        if elapsed != s["duration"]: errors.append(f"{sid} 总时长 {elapsed} 不等于 {s['duration']}")
        for d in s.get("dialogue", []):
            if d.get("shot") not in owned: errors.append(f"{sid} 台词指向无效镜号")
            else:
                p = next(p for p in s["shots"] if p["id"] == d["shot"])
                if d.get("text", "") not in p["sound"] or d.get("text", "") not in p["videoPrompt"]: errors.append(f"{d['shot']} 台词未逐字进入声音及视频稿")
        if len(s.get("locks", [])) < 2 or len(s.get("tests", [])) < 2: errors.append(f"{sid} 连续性或试片标准不足")
        adaptation = s.get('researchAdaptation')
        if adaptation:
            for field in ['caseIds', 'retained', 'fictionalized', 'notClaimed']:
                if not isinstance(adaptation.get(field), list) or not adaptation[field]:
                    errors.append(f'{sid} 来源改编缺少 {field}')
            for cid in adaptation.get('caseIds', []):
                if cid not in research_adaptation.CASES: errors.append(f'{sid} 引用未知素材 {cid}')
        total_seconds += elapsed
        total_shots += len(s["shots"])
        report_rows.append({"id": sid, "shots": len(s["shots"]), "durationSeconds": elapsed, "storyCharacters": len(s["story"]), "promptPairs": len(s["shots"]), "stage": s["stage"]})
    return {"scope": "authored_text_and_files_only", "completeInventory": expected, "storyCount": len(stories), "shotCount": total_shots, "totalSeconds": total_seconds, "totalFrames24fps": total_seconds * 24, "errors": errors, "stories": report_rows, "mediaVerified": False, "audienceVerified": False, "authorApproved": False, "note": "机器检查只核对文本、编号、引用和算术，不替代剧情、表演、空间或真实媒体审阅。"}


def story_md(s):
    out = [f'## {s["id"]}《{s["title"]}》', f'**{s["duration"]} 秒｜{STAGES[s["stage"]]}｜角色：{"、".join(s["characters"])}｜场景 {s["scene"]}**', "### 剧情正文", s["story"], "### 导演与空间", "**观察任务：**" + s["intent"], "**空间与光位：**" + s["space"], "**人物表演：**" + s["performance"], "### 节拍覆盖"]
    out.insert(4, research_adaptation.markdown(s))
    out += [f'- **{b["id"]}**：{b["text"]} → {"、".join(b["shots"])}' for b in s["beats"]]
    out += ["### 分镜构图板", f'![{s["id"]} 构图示意](boards/{s["id"]}.svg)', "图示为构图位置示意；姿态、接触和画外继承以逐镜正文为准。", "### 逐镜设计"]
    elapsed = 0
    for p in s["shots"]:
        end = elapsed + p["seconds"]
        out += [f'#### {p["id"]}｜{elapsed:02d}—{end:02d} 秒｜{p["seconds"]} 秒｜帧 [{elapsed*24}, {end*24})', "**镜头任务：**" + p["purpose"], "**景别、机位与构图：**" + p["framing"], "**摄影机与理由：**" + p["camera"], "**焦点：**" + p["focus"], "**入态：**" + p["start"], "**动作与表演：**"]
        out += [f'- {a["seconds"]} 秒：{a["action"]}' for a in p["phases"]]
        out += ["**声音：**" + p["sound"], "**出态：**" + p["end"], "**切点与承接：**" + p["cut"], "**连续性：**" + p["continuity"], "**开始画面母稿：**", p["openingPrompt"], "**视频变化母稿：**", p["videoPrompt"]]
        elapsed = end
    out += ["### 声音与剪辑", s["soundDesign"], f'![{s["id"]} 时间线](timelines/{s["id"]}.svg)']
    if s["dialogue"]:
        out += [f'- {d["speaker"]}：{d["text"]}（{d["shot"]}；{d["delivery"]}）' for d in s["dialogue"]]
    else: out += ["正式台词：无；保留镜头声音中已写明的自然发声。"]
    out += ["### 连续性与试片", *["- 连续性：" + x for x in s["locks"]], *["- 试片：" + x for x in s["tests"]], "**媒体待验证：**" + s["mediaPending"]]
    return "\n\n".join(out)


def para(text):
    return "".join("<p>" + esc(p) + "</p>" for p in str(text).splitlines() if p.strip())


def data_svg(path):
    return "data:image/svg+xml;base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def html_story(s):
    beats = "".join(f'<li><b>{esc(b["id"])}</b> {esc(b["text"])} <small>{esc(" / ".join(b["shots"]))}</small></li>' for b in s["beats"])
    script = f'<div class="pane" data-pane="story"><div class="prose">{para(s["story"])}</div>{research_adaptation.html_note(s)}<details><summary>导演通案、空间与表演</summary>{para(s["intent"])}{para(s["space"])}{para(s["performance"])}</details><details><summary>节拍与镜头覆盖</summary><ol>{beats}</ol></details></div>'
    shots, prompts, elapsed = "", "", 0
    for p in s["shots"]:
        end = elapsed + p["seconds"]
        fields = [("目的", p["purpose"]), ("景别与构图", p["framing"]), ("相机", p["camera"]), ("焦点", p["focus"]), ("入态", p["start"]), ("声音", p["sound"]), ("出态", p["end"]), ("剪辑接口", p["cut"]), ("连续性", p["continuity"])]
        phase_html = "".join(f'<li><b>{a["seconds"]} 秒</b> {esc(a["action"])}</li>' for a in p["phases"])
        field_html = "".join(f'<dt>{esc(k)}</dt><dd>{esc(v)}</dd>' for k, v in fields)
        shots += f'<section class="shot" id="{p["id"]}"><header><b>{p["id"]}</b><span>{elapsed:02d}—{end:02d}s · {p["seconds"]} 秒</span></header><ol class="phases">{phase_html}</ol><dl>{field_html}</dl><small>24 fps 帧区间 [{elapsed*24}, {end*24})</small></section>'
        prompts += f'<section class="shot"><header><b>{p["id"]}</b><span>{p["seconds"]} 秒</span></header><h4>开始画面 · 单一瞬间</h4>{para(p["openingPrompt"])}<h4>视频变化 · 完整母稿</h4>{para(p["videoPrompt"])}</section>'
        elapsed = end
    board = data_svg(ROOT / "boards" / f'{s["id"]}.svg')
    time = data_svg(ROOT / "timelines" / f'{s["id"]}.svg')
    dialogue = "".join(f'<li><b>{esc(d["speaker"])}</b>：{esc(d["text"])} <small>{esc(d["shot"])} · {esc(d["delivery"])}</small></li>' for d in s["dialogue"]) or "<li>无正式台词；自然发声按逐镜声音执行。</li>"
    tests = "".join("<li>" + esc(x) + "</li>" for x in s["tests"])
    locks = "".join("<li>" + esc(x) + "</li>" for x in s["locks"])
    return f'''<article class="story" id="story-{s["id"]}" data-group="{s["id"][0]}" data-stage="{s["stage"]}" hidden>
<div class="eyebrow">{esc(GROUPS[s["id"][0]])} / {s["id"]}</div><h2>{esc(s["title"])}</h2><div class="meta">{s["duration"]} 秒 · {len(s["shots"])} 镜 · {esc(STAGES[s["stage"]])} · {esc("、".join(s["characters"]))}</div>
{script}<div class="pane" data-pane="board" hidden><p class="notice">图示用于构图与位置说明；身体姿态、物件接触与画外继承见逐镜卡。没有生成媒体。</p><img class="board" src="{board}" alt="{s["id"]} 分镜构图板"/>{shots}</div>
<div class="pane" data-pane="prompts" hidden>{prompts}</div><div class="pane" data-pane="sound" hidden><img class="timeline" src="{time}" alt="声画时间线"/>{para(s["soundDesign"])}<h3>准确台词</h3><ul>{dialogue}</ul><h3>连续性硬锁</h3><ul>{locks}</ul><h3>试片与试剪</h3><ul>{tests}</ul><p class="notice">待媒体：{esc(s["mediaPending"])}</p></div></article>'''


def build_html(stories, report, cards):
    story_count = len(stories)
    nav = "".join(f'<button class="story-link" data-story="{s["id"]}" data-group="{s["id"][0]}" data-stage="{s["stage"]}"><span>{s["id"]}</span>{esc(s["title"])}<small>{s["duration"]}s · {len(s["shots"])} 镜</small></button>' for s in stories)
    shared = '<p><a href="assets-and-space.md">人物、道具与场景完整母稿</a> · <a href="media-handoff.md">小样与剪辑交接</a></p>' + "".join(f'<figure><img src="{data_svg(ROOT/"visual"/name)}" alt="{esc(name)}"/><figcaption>{esc(name)}</figcaption></figure>' for name in cards)
    article = "".join(html_story(s) for s in stories)
    styles = '''*{box-sizing:border-box}body{margin:0;background:#faf7f1;color:#30383b;font:16px/1.8 "Microsoft YaHei","PingFang SC",sans-serif}button,input,select{font:inherit}button,a{touch-action:manipulation}a{color:#8e503e}button{cursor:pointer}aside{position:fixed;inset:0 auto 0 0;width:286px;background:#f1ede4;border-right:1px solid #ded8cb;padding:24px 18px;overflow:auto}aside h1{font-size:24px;margin:0 0 4px}.sub{font-size:12px;color:#67757a}aside input,aside select{width:100%;padding:8px;border:1px solid #d4cbbb;background:#faf7f1;border-radius:5px;margin-top:12px}.groups{display:flex;gap:5px;flex-wrap:wrap;margin:12px 0}.groups button{border:0;padding:6px 10px;background:#ded8cb;border-radius:4px}.groups button.active{background:#30383b;color:white}.story-link{display:block;width:100%;text-align:left;padding:10px 8px;border:0;border-bottom:1px solid #ded8cb;background:none;font-size:14px}.story-link span{display:inline-block;width:37px;color:#8e503e;font-size:12px}.story-link small{display:block;padding-left:37px;color:#67757a;font-size:11px}.story-link.active{background:#faf7f1;border-left:3px solid #c77c67}.links{padding:18px 5px}.links a{display:block;font-size:13px;margin:8px 0}main{margin-left:286px;max-width:1330px;padding:28px 50px 80px}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ded8cb;padding-bottom:18px}.top .stats{color:#67757a;font-size:13px}.top button,.tabs button{border:1px solid #d7cdbd;background:none;border-radius:5px;padding:7px 13px}.tabs{position:sticky;top:0;z-index:5;background:#faf7f1;display:flex;gap:7px;padding:15px 0;border-bottom:1px solid #ded8cb}.tabs button.active{background:#30383b;color:#fff;border-color:#30383b}.eyebrow{font-size:12px;letter-spacing:.12em;color:#8e503e;margin-top:30px}h2{font-size:36px;line-height:1.35;margin:12px 0}h3{font-size:19px;margin-top:28px}.meta{font-size:14px;color:#67757a;border-bottom:1px solid #ded8cb;padding-bottom:20px}.prose{max-width:760px;font-size:18px;line-height:2.05;padding:18px 0}.prose p{white-space:pre-line}details{border-top:1px solid #ddd4c6;padding:16px 0}summary{cursor:pointer;font-weight:600}small{color:#67757a}.notice{background:#eee8dc;padding:12px 16px;border-left:3px solid #c77c67;font-size:14px}.board,.timeline{display:block;width:100%;height:auto;margin:20px 0}.shot{background:#fffdf9;border:1px solid #ddd4c6;border-radius:7px;padding:20px 24px;margin:18px 0}.shot header{display:flex;justify-content:space-between;color:#8e503e;border-bottom:1px solid #eee6da;padding-bottom:10px}.shot header span{font-size:13px;color:#67757a}.phases{padding-left:23px}.phases li{padding:4px 0}.shot dl{display:grid;grid-template-columns:110px 1fr;gap:9px 16px;font-size:14px}.shot dt{color:#67757a}.shot dd{margin:0}.shot h4{font-size:15px;color:#8e503e}.shot p{font-size:15px;line-height:1.95;user-select:text}#shared figure{margin:26px 0}#shared img{width:100%}figcaption{font-size:12px;color:#67757a}[hidden]{display:none!important}@media(max-width:900px){aside{position:relative;width:100%;max-height:330px;border-right:0}aside h1{font-size:21px}.story-link{display:inline-block;width:48%;vertical-align:top}main{margin-left:0;padding:16px}.top{align-items:flex-start;gap:12px}h2{font-size:29px}.tabs{flex-wrap:wrap}.shot{padding:16px}.shot dl{grid-template-columns:1fr;gap:3px}.shot dd{margin-bottom:10px}.prose{font-size:17px}}@media print{aside,.top,.tabs{display:none}main{margin:0;padding:0;max-width:none}.story[hidden],#shared[hidden]{display:none!important}.pane[hidden]{display:block!important}.shot{break-inside:avoid}body{background:white}.board{max-height:90vh;object-fit:contain}}'''
    js = '''let current=location.hash.slice(1)||'B01',pane='story',group='all';const all=[...document.querySelectorAll('.story')],links=[...document.querySelectorAll('.story-link')];function show(id){if(!document.getElementById('story-'+id))id='B01';current=id;document.getElementById('shared').hidden=true;all.forEach(a=>a.hidden=a.id!=='story-'+id);links.forEach(b=>b.classList.toggle('active',b.dataset.story===id));document.querySelector('.tabs').hidden=false;history.replaceState(null,'','#'+id);switchPane(pane);window.scrollTo({top:0,behavior:'instant'})}function switchPane(p){pane=p;document.querySelectorAll('.pane').forEach(v=>v.hidden=v.dataset.pane!==p);document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===p))}function filter(){let q=document.getElementById('search').value.trim().toLowerCase(),s=document.getElementById('stage').value;links.forEach(b=>b.hidden=!((group==='all'||b.dataset.group===group)&&(s==='all'||b.dataset.stage===s)&&b.textContent.toLowerCase().includes(q)))}links.forEach(b=>b.addEventListener('click',()=>show(b.dataset.story)));document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchPane(b.dataset.tab)));document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));filter()}));document.getElementById('search').addEventListener('input',filter);document.getElementById('stage').addEventListener('change',filter);document.getElementById('show-shared').addEventListener('click',()=>{all.forEach(a=>a.hidden=true);document.getElementById('shared').hidden=false;document.querySelector('.tabs').hidden=true;links.forEach(b=>b.classList.remove('active'));window.scrollTo({top:0,behavior:'instant'})});document.getElementById('print').addEventListener('click',()=>window.print());show(current);'''
    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小小日常 · {story_count} 条剧情与分镜</title><style>{styles}</style></head><body>
<aside><h1>小小日常</h1><div class="sub">{story_count} 条婴儿生活短片 · 当前创作稿</div><input id="search" aria-label="搜索片名或编号" placeholder="搜索片名或编号"><div class="groups"><button data-filter="all" class="active">全部</button><button data-filter="B">有趣行为</button><button data-filter="F">亲子时刻</button><button data-filter="G">成长</button></div><select id="stage" aria-label="筛选能力阶段"><option value="all">所有能力阶段</option>{''.join(f'<option value="{k}">{v}</option>' for k,v in STAGES.items())}</select><nav aria-label="{story_count} 条短片">{nav}</nav><div class="links"><button id="show-shared">共享视觉设计</button><a href="all-stories.md">完整文字稿</a><a href="review/design-review.md">设计审阅说明</a><a href="README.md">交付说明</a></div></aside>
<main><div class="top"><div><b>剧情 / 分镜 / 声画设计</b><div class="stats">{report['storyCount']} 条 · {report['shotCount']} 镜 · 总计 {report['totalSeconds']} 秒 · 图板为构图示意，媒体待制作</div></div><button id="print">打印当前片</button></div><div class="tabs"><button data-tab="story" class="active">剧情</button><button data-tab="board">分镜</button><button data-tab="prompts">制作母稿</button><button data-tab="sound">声音与验收</button></div>{article}<section id="shared" hidden><h2>共享视觉设计</h2><p>角色、色材与光位为原创设计提案。以下是已绘制矢量卡，不是生成角色图、真实材质样片或已验证电影帧。</p>{shared}</section></main><script>{js}</script></body></html>'''


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--visual-only", action="store_true")
    args = parser.parse_args()
    cards = make_visuals()
    if args.visual_only:
        print(json.dumps({"visualCards": len(cards), "mediaVerified": False}, ensure_ascii=False))
        return
    stories = []
    for group in GROUPS:
        data = json.loads((ROOT / "source" / f"{group}.json").read_text(encoding="utf-8-sig"))
        if data.get("group") != group: raise ValueError("分组不匹配")
        stories.extend(data["stories"])
    report = validate(stories)
    (ROOT / "review").mkdir(exist_ok=True)
    (ROOT / "review" / "validation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    if report["errors"]:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        raise SystemExit(1)
    # Read the current segment plan, never a possibly stale exported snapshot.
    prompt_builder = runpy.run_path(str(ROOT / "seedance25" / "build_prompt_pack.py"))
    segment_count = prompt_builder["planned_segment_count"](stories)
    for directory in ["boards", "timelines"]: (ROOT / directory).mkdir(exist_ok=True)
    for s in stories:
        (ROOT / "boards" / f'{s["id"]}.svg').write_text(make_board(s), encoding="utf-8")
        (ROOT / "timelines" / f'{s["id"]}.svg').write_text(make_timeline(s), encoding="utf-8")
    research_adaptation.build_report(stories)
    intro = f"# 小小日常：{len(stories)} 条完整剧情与分镜\n\n当前原创创作稿。30—60 秒/条，9:16，24 fps 设计时间基准。矢量分镜是构图位置示意；没有生成图像、视频或音频，不代表作者采纳或生产验收。共享身份、服装、道具与世界地理见 authoring-brief.md；各片具体状态见正文。\n\n"
    (ROOT / "all-stories.md").write_text(intro + "\n\n---\n\n".join(story_md(s) for s in stories), encoding="utf-8")
    for group, name in GROUPS.items():
        group_stories = [s for s in stories if s["id"].startswith(group)]
        (ROOT / f"{group}-stories.md").write_text(f"# {name}：{len(group_stories)} 条剧情与分镜\n\n" + "\n\n---\n\n".join(story_md(s) for s in group_stories), encoding="utf-8")
    page = build_html(stories, report, cards)
    if (ROOT / "seedance25" / "index.html").exists():
        page = page.replace('<a href="all-stories.md">完整文字稿</a>', '<a href="seedance25/index.html">Seedance 2.5 分镜提示词</a><a href="all-stories.md">完整文字稿</a>')
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    (ROOT / "README.md").write_text(f'''# 小小日常：{len(stories)} 条短片创作交付

- [可点击阅读页](index.html)：按片名、内容线或能力阶段检索；分别查看剧情、分镜、制作母稿和声音验收。
- [Seedance 2.5 分镜提示词](seedance25/index.html)：{report['shotCount']} 镜独立稿、{segment_count} 段多镜稿及待提供参考的映射表。
- [完整文字稿](all-stories.md)：{report['storyCount']} 条完整剧情，{report['shotCount']} 镜，总计 {report['totalSeconds']} 秒。
- [有趣行为](B-stories.md) / [家庭亲子](F-stories.md) / [成长变化](G-stories.md)：分组阅读。
- [共享原创设定与创作工作单](authoring-brief.md)。
- [亲述来源与改编对照](research-adaptation.md) / [家长亲述素材库](research/real-experiences/index.html)。
- [人物、道具与空间母稿](assets-and-space.md) / [小样与剪辑交接](media-handoff.md)。
- visual/：六件已绘制视觉设计卡；boards/：每片一张构图分镜板；timelines/：每片时间线。
- [设计审阅](review/design-review.md) / [结构与时间检查](review/validation.json)。

source/B.json、F.json、G.json 是当前文字创作源；Markdown、HTML、SVG 为由同一源派生的阅读视图，不是历史版本。仅维护当前稿。

已交付范围：全部剧情正文、节拍、逐镜导演设计、开始画面及视频变化母稿、构图图板、声音与剪辑时间计划、连续性和可否定的试片标准。人物与视觉为提案；六张矢量卡是设计参考，并非真实三维角色、材质样片或影片。实际图像、视频、音轨、口型、动作质量、观众效果与作者选定尚未验证。
''', encoding="utf-8")
    print(json.dumps({"stories": report["storyCount"], "shots": report["shotCount"], "seconds": report["totalSeconds"], "promptPairs": report["shotCount"], "visualCards": len(cards), "storyBoards": len(stories), "errors": []}, ensure_ascii=False))


if __name__ == "__main__":
    main()
