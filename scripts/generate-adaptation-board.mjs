#!/usr/bin/env node
// Draw authored design cards; no image generation or media acceptance.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const EXAMPLE = "skills/cineweave-director/references/optional/adaptation-example.md";
export const BOARD = "skills/cineweave-director/assets/adaptation-example.html";
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const label = (x, y, value, extra = "") => `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
const rect = (x, y, w, h, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const svg = (body, title) => `<svg viewBox="0 0 720 300" role="img" aria-label="${escape(title)}" xmlns="http://www.w3.org/2000/svg"><style>text{font:18px 'Microsoft YaHei',sans-serif;fill:#ded7c6}.small{font-size:14px}.large{font-size:25px}</style>${body}</svg>`;

function planFrom(source) {
  const section = source.split("<!-- short-film-plan:start -->")[1]?.split("<!-- short-film-plan:end -->")[0];
  const match = section?.match(/```json\s*\n([\s\S]*?)\n```/u);
  if (!match) throw new Error("Adaptation example has no complete plan");
  return JSON.parse(match[1]);
}

function map() {
  return svg(`${rect(210, 85, 290, 125, "#554438", 'rx="8"')}${rect(268, 113, 170, 65, "#cec2a0")}${rect(595, 65, 16, 160, "#adbec5")}
    <path d="M590 140H510M590 165H510" stroke="#c0cdd2" stroke-width="4"/>
    <circle cx="355" cy="47" r="22" fill="#292a28" stroke="#aea18b"/>
    <circle cx="355" cy="250" r="22" fill="#8a8271"/>
    <path d="M530 250L500 205M550 150L500 150M530 45L500 85" stroke="#d5a065" stroke-width="3"/>
    ${label(295, 20, "北 · 秦王")}${label(290, 291, "南 · 荆轲")}${label(620, 150, "东窗")}
    ${label(230, 105, "图边 / 北")}${label(235, 199, "卷筒与展开区 / 南")}
    ${label(540, 265, "C2 东南", 'class="small"')}${label(510, 125, "C1/C4", 'class="small"')}${label(540, 40, "C3 东北", 'class="small"')}
    ${label(30, 145, "西柱")}${label(30, 170, "固定锚点", 'class="small"')}`, "同一世界空间与东侧机位示意");
}

function sequence() {
  const states = ["请求观看", "落案再松手", "秦王展开", "显露后对视"];
  return svg(states.map((state, i) => {
    const x = 15 + i * 178;
    return `${rect(x, 45, 160, 160, "#242723", 'rx="8" stroke="#74634f"')}${rect(x + 28, 125, 104, 37, "#554438")}
      <circle cx="${x + 40}" cy="100" r="16" fill="#8a8271"/><circle cx="${x + 120}" cy="100" r="16" fill="#161c1a" stroke="#b5a98f"/>
      ${rect(x + 55, 132, i < 2 ? 45 : 65, 15, "#cec2a0")}${i > 1 ? rect(x + 90, 137, 24, 4, "#929999") : ""}
      ${label(x + 14, 72, `S0${i + 1}`)}${label(x + 8, 240, state, 'class="small"')}${label(x + 15, 270, "设计构图 / 非实帧", 'class="small"')}`;
  }).join(""), "四镜信息与道具状态变化");
}

function timeline(plan) {
  const rate = plan.frameRate.numerator / plan.frameRate.denominator;
  const total = plan.totalFrames;
  return svg(plan.shots.map((shot, i) => {
    const x = 30 + 660 * shot.startFrame / total;
    const width = 660 * (shot.endFrame - shot.startFrame) / total;
    return `${rect(x, 70, width - 3, 80, ["#554438", "#70624c", "#8a8271", "#444f50"][i])}${label(x + 10, 102, shot.id)}${label(x + 10, 135, `${shot.startFrame / rate}–${shot.endFrame / rate}s`, 'class="small"')}`;
  }).join("") + plan.subtitles.map(cue => `${rect(30 + 660 * cue.startFrame / total, 185, 660 * (cue.endFrame - cue.startFrame) / total, 18, "#d5a065")}${label(30, 235, cue.text)}`).join("") + label(30, 275, "底声连续；纸摩擦停止后不重演；声长与口型仍待验证", 'class="small"'), "四镜整数帧时间线与对白窗口");
}

export function renderAdaptationBoard(source) {
  const plan = planFrom(source);
  const hash = createHash("sha256").update(source, "utf8").digest("hex");
  const chapter = (heading) => {
    const start = source.indexOf(heading);
    if (start < 0) throw new Error(`Missing design chapter: ${heading}`);
    const next = source.indexOf("\n##", start + heading.length);
    return source.slice(start + heading.length, next < 0 ? source.length : next).trim();
  };
  const cards = [
    ["G0", "导演意图与信息压力", "## G0 导演意图、完整场次与节拍", sequence()],
    ["G1-style", "风格卡", "### G1-STYLE", sequence()],
    ["G1-palette", "配色卡 · sRGB 设计预览", "### G1-PALETTE", svg(["#554438", "#292a28", "#8a8271", "#cec2a0", "#929999"].map((c, i) => `${rect(20 + i * 138, 45, 130, 140, c)}${label(20 + i * 138, 220, c, 'class="small"')}`).join("") + label(20, 265, "颜色有对象与职责；不是影片取样、LUT 或肤色目标", 'class="small"'), "五种设计色块与色值")],
    ["G1-material", "材质卡 · 结构与反光分离", "### G1-MATERIAL", svg(["麻灰织料", "旧木案", "纤维地图", "钝银金属"].map((c, i) => `${rect(20 + i * 174, 55, 158, 125, ["#8a8271", "#554438", "#cec2a0", "#606b6c"][i])}<path d="M${30 + i * 174} 90h130m-130 20h130m-130 20h130" stroke="#e3dccb" opacity=".25"/>${label(20 + i * 174, 215, c)}`).join("") + label(20, 265, "示意纹理不等于真实材质小样；每项仍需媒体测试", 'class="small"'), "四种材质类别示意")],
    ["G1-light", "灯光卡 · 唯一世界光源", "### G1-LIGHT", map()],
    ["G1-plot", "光位图 · 方位与可达机位", "### G1-PLOT 与 G2 空间图", map()],
    ["G1-test", "LookDev 测试设计板 · 无真实样片", "### G1-TEST", svg(["T1 近景 / 身份", "T2 空间 / 锚点", "T3 材质 / 分离", "T4 展图 / 揭示", "T5 配对 / 连续"].map((t, i) => {
      const x = 20 + (i % 3) * 232, y = 25 + Math.floor(i / 3) * 140;
      return `${rect(x, y, 216, 120, "#252d2b", 'rx="8" stroke="#60706a"')}${label(x + 10, y + 33, t, 'class="small"')}${label(x + 10, y + 64, "固定：人物 / 道具 / 光位", 'class="small"')}${label(x + 10, y + 94, "实际样片：未提供", 'class="small"')}`;
    }).join(""), "五项完整待执行测试的设计布局")],
    ["G2", "世界地理与遮挡验证", "### G1-PLOT 与 G2 空间图", map()],
    ["G3", "人物任务与持物交接", "## G3 表演、持物与揭示硬锁", sequence()],
    ["G4", "分镜与摄影 · 固定也有叙事任务", "## G4 镜头卡、完整复制稿与时间表", sequence()],
    ["G5", "剪辑声音时间线", "## G5 声音、准确台词与剪辑", timeline(plan)],
    ["G6", "候选上限与停止条件", "## G6 试片、候选上限与回流", svg(label(30, 75, "先一个候选 → 实际观察 → 定位一个变量", 'class="large"') + label(30, 140, "没有新证据：停止重复生成，返回责任领域") + label(30, 200, "图／声／视频返回后登记准确版本与采用窗口") + label(30, 260, "本卡仅为任务设计；实际 Task、Take 与费用均不存在", 'class="small"'), "有停止条件的试片与回流设计")],
    ["G7", "评审 · 保留未决项", "## G7 逐镜设计评审与验收", svg(label(30, 70, "文字覆盖：四镜、准确台词、同一图与刀") + label(30, 130, "未决：触达 / 展开结构 / 遮挡与首次显露") + label(30, 190, "媒体：未提供     声音：未听审     试剪：未提供") + label(30, 250, "设计图卡存在，不等于 production_ready", 'class="large"'), "设计检查和媒体未验证状态")],
  ];
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>图尽 · 阶段设计卡板</title>
  <style>*{box-sizing:border-box}body{margin:0;background:#171c1a;color:#ded7c6;font:16px/1.8 'Microsoft YaHei',sans-serif}main{max-width:1240px;margin:auto;padding:40px 24px}h1{font-size:52px;letter-spacing:.12em;margin:8px 0}h2{font-size:22px}a{color:#d5bc87}nav{display:flex;flex-wrap:wrap;gap:8px 18px;margin:24px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}article{border-top:2px solid #897351;background:#202622;padding:20px;min-width:0}svg{width:100%;height:auto;background:#1c211f}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.9 'Microsoft YaHei',sans-serif}details{margin-top:16px}summary{cursor:pointer;color:#d5bc87}.meta{color:#a2aaa3;font-size:14px}.badge{display:inline-block;border:1px solid #7a705b;padding:3px 12px;font-size:13px}@media(max-width:820px){.grid{grid-template-columns:1fr}h1{font-size:40px}}</style>
  <main data-source-sha256="${hash}"><p class="meta">TUJIN24@r1 · 历史记载改编 · 24秒／四镜</p><h1>图尽</h1><p>礼仪未散，危险已在卷尾。每阶段有设计成果，每项未验证内容保留状态。</p><span class="badge">设计示意已绘制 · AI样片／声音／试剪均未提供</span>
  <nav>${cards.map(([id, title]) => `<a href="#${id}">${escape(title)}</a>`).join("")}</nav><div class="grid">
  ${cards.map(([id, title, heading, drawing]) => `<article id="${id}"><p class="meta">${id} · 原创设计图示</p><h2>${escape(title)}</h2>${drawing}<details><summary>展开本卡完整规则与待验项</summary><pre>${escape(chapter(heading))}</pre></details></article>`).join("\n")}
  </div><details><summary>完整 G0–G7 正文、全部资产与逐镜复制稿</summary><pre>${escape(source)}</pre></details><p class="meta">原文依据、节选取舍与原创补写见完整正文。图卡不是历史照片、生成样片、真实布光或媒体质量证明。</p></main></html>\n`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length && args[0] !== "--check")) throw new Error("用法：node scripts/generate-adaptation-board.mjs [--check]");
  const source = await readFile(resolve(ROOT, EXAMPLE), "utf8");
  const body = renderAdaptationBoard(source);
  const destination = resolve(ROOT, BOARD);
  if (args[0] === "--check") {
    if (await readFile(destination, "utf8") !== body) throw new Error("改编示例图卡与当前正文或绘制脚本不同步");
  } else {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, body, "utf8");
  }
  console.log(JSON.stringify({ valid: true, board: BOARD, designCards: 13, mediaVerified: false, mode: args[0] === "--check" ? "check" : "write" }));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
