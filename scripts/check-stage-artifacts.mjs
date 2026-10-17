#!/usr/bin/env node
// CineWeave G0–G7 deliverable gate. Read-only by design.
// Passing means authored design artifacts exist and match their source;
// it never verifies AI image/video generation, optical lighting, or sound.
import { readFile, lstat, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseJsonStrict } from "./canonical-json.mjs";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const FORMAT = "cineweave-stage-artifacts/v1";

const REQUIRED = Object.freeze({
  G0: ["director_card", "scene_script", "beat_sheet"],
  G1: ["style_card", "palette_card", "material_card", "lighting_card", "light_plot", "lookdev_test_board", "asset_cards"],
  G2: ["scene_map", "geography_sheet", "light_source_sheet"],
  G3: ["blocking_board", "performance_cards", "hard_lock_sheet"],
  G4: ["storyboard_board", "shot_cards"],
  G5: ["edit_timeline", "dialogue_cues", "color_grade_plan"],
  G6: ["test_plan", "generation_handoff"],
  G7: ["design_review", "acceptance_plan"]
});
const POINTERS = Object.freeze({
  director_card:"/stages/G0/directorStatement",
  scene_script:"/stages/G0/sceneScript", beat_sheet:"/stages/G0/beats",
  style_card:"/stages/G1/styleBible",
  palette_card:"/stages/G1/lookDevelopment/palette",
  material_card:"/stages/G1/lookDevelopment/materials",
  lighting_card:"/stages/G1/lookDevelopment/lightingSetups",
  light_plot:"/stages/G2/sources",
  lookdev_test_board:"/stages/G1/lookDevelopment/comparisonBoards",
  asset_cards:"/stages/G1/assets",
  scene_map:"/stages/G2/anchors",
  geography_sheet:"/stages/G2/worldGeometry",
  light_source_sheet:"/stages/G2/sources",
  blocking_board:"/stages/G3/actorTracks",
  performance_cards:"/stages/G3/actorTracks",
  hard_lock_sheet:"/stages/G3/hardLocks",
  storyboard_board:"/stages/G4/shots",
  shot_cards:"/stages/G4/shots",
  edit_timeline:"/stages/G5/shotWindows",
  dialogue_cues:"/stages/G5/dialogueCues",
  color_grade_plan:"/stages/G5/colorPlan",
  test_plan:"/stages/G6/testGroups",
  generation_handoff:"/stages/G6/requiredBeforeExecution",
  design_review:"/stages/G7/paperReviews",
  acceptance_plan:"/stages/G7/formalAcceptance"
});
const VISUAL = new Set(["director_card","style_card","palette_card","material_card","lighting_card",
  "light_plot","lookdev_test_board","scene_map","blocking_board","storyboard_board",
  "edit_timeline","test_plan","design_review"]);
export const requiredKinds = REQUIRED;

function validPath(path) {
  return typeof path === "string" && path.length > 0 && !isAbsolute(path) &&
    !path.includes("\\") && !path.includes("\0") && !/^[A-Za-z]:/u.test(path) &&
    path.split("/").every(part => part && part !== "." && part !== "..");
}
async function readSafe(root, path) {
  if (!validPath(path)) throw new Error("unsafe path");
  const full = resolve(root, ...path.split("/")), rel = relative(root, full);
  if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error("escaped root");
  const rootReal = await realpath(root), pathReal = await realpath(full);
  const realRel = relative(rootReal, pathReal);
  if (realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) throw new Error("symlink escapes root");
  const stat = await lstat(full);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("not a regular file");
  return await readFile(full, "utf8");
}
function deref(data, pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/")) return undefined;
  let cur = data;
  for (const part of pointer.slice(1).split("/")) {
    if (!part || !cur || typeof cur !== "object" || !Object.hasOwn(cur, part)) return undefined;
    cur = cur[part];
  }
  return cur;
}
function meaningful(kind, value, scene) {
  if (typeof value === "string") {
    const least = ["scene_script"].includes(kind) ? 250 :
      ["director_card","geography_sheet","color_grade_plan"].includes(kind) ? 30 : 5;
    return value.trim().length >= least;
  }
  if (Array.isArray(value)) {
    if (value.length < 1) return false;
    if (["shot_cards","storyboard_board"].includes(kind))
      return value.length >= 3 && value.every(x => x.id && x.keyframePrompt?.length >= 100 && x.videoPrompt?.length >= 300);
    if (kind === "design_review")
      return value.length === scene.stages.G4.shots.length * 6 &&
        value.every(row => row.role && row.shotId && row.criterion && row.observation);
    if (kind === "dialogue_cues")
      return value.length === scene.stages.G0.script.length &&
        value.every(row => row.exactText && row.speaker && row.shotId);
    if (kind === "asset_cards") return value.length >= 3 && value.every(x => x.id && x.prompt?.length >= 50);
    return value.every(x => x !== null && x !== undefined && (typeof x !== "string" || x.trim()));
  }
  if (value && typeof value === "object") return Object.keys(value).length >= 2;
  return false;
}
function tokenExpectations(kind, scene) {
  const a = scene.stages, look = a.G1.lookDevelopment;
  switch (kind) {
    case "director_card": return a.G0.beats.map(x => x.id);
    case "style_card": return ["风格卡", scene.scope.title];
    case "palette_card": return look.palette.swatches.flatMap(x => [x.id, x.hex]);
    case "material_card": return look.materials.map(x => x.id);
    case "lighting_card": return look.lightingSetups.flatMap(x => [x.id, ...x.sourceIds]);
    case "light_plot": return a.G2.sources.map(x => x.id);
    case "lookdev_test_board": return look.comparisonBoards.map(x => x.id).concat(["未生成"]);
    case "scene_map": return a.G2.anchors.map(x => x.id);
    case "blocking_board": return a.G3.actorTracks.map(x => x.characterId);
    case "storyboard_board": return a.G4.shots.map(x => x.id);
    case "edit_timeline": return [...a.G4.shots.map(x => x.id),...a.G5.dialogueCues.map(x => x.lineId)];
    case "test_plan": return [...a.G6.lookdevTestIds,...a.G6.testGroups.flatMap(x => x.shots)];
    case "design_review": return ["direction","performance","staging","cinematography","prompt","continuity"];
    default: return [];
  }
}
function verifySVG(text, artifact, scene) {
  const problems = [];
  if (!/^<svg\s[^>]+>/u.test(text.trim()) || !text.includes("</svg>") ||
      !text.includes("viewBox=") || (text.match(/<text\s/gu) ?? []).length < 3 ||
      (text.match(/<rect\s/gu) ?? []).length < 2) problems.push("VISUAL_NOT_RENDERABLE");
  if (!text.includes(`data-artifact-id="${artifact.artifactId}"`) ||
      !text.includes('data-provenance="design_vector_not_generated_media"'))
    problems.push("VISUAL_PROVENANCE");
  if (/<script\b|<foreignObject\b|<image\b|\bonload=|javascript:|url\(http|xlink:href/iu.test(text))
    problems.push("VISUAL_UNSAFE_CONTENT");
  for (const token of tokenExpectations(artifact.kind, scene)) {
    const escaped = String(token).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
    if (!text.includes(escaped)) { problems.push("VISUAL_SOURCE_MISMATCH"); break; }
  }
  return problems;
}
export async function checkStageArtifacts(manifest, { root = ROOT } = {}) {
  const errors = [], byCase = [], filePaths = new Set(), artifactIds = new Set();
  if (!manifest || manifest.format !== FORMAT || !Array.isArray(manifest.cases) || !manifest.cases.length) {
    return { valid:false,designComplete:false,productionReady:false,errors:["MANIFEST_FORMAT"],cases:[],limitation:"仅验收已存在的设计文件和精确文本，不验证媒体效果" };
  }
  for (const entry of manifest.cases) {
    const cid = entry?.caseId ?? "unknown", caseErrors = [], stages = {};
    const push = message => { errors.push(cid+": "+message); caseErrors.push(message); };
    let scene;
    try {
      const raw = await readSafe(root,entry.sourcePath);
      scene = parseJsonStrict(raw);
      if (scene.id !== cid || scene.format !== "cineweave-scene-forward/v1") push("CASE_SOURCE_ID");
    } catch { push("CASE_SOURCE_UNREADABLE"); byCase.push({caseId:cid,designComplete:false,stages,errors:caseErrors}); continue; }
    if (entry.mediaStatus !== "not_generated" || entry.overallProductionStatus !== "pending_media" ||
      scene.scope.externalMediaStatus !== "not_generated" || scene.stages.G6.mediaAvailable !== false ||
      scene.stages.G7.mediaVerified !== false) push("MEDIA_STATUS_OVERCLAIM");
    if (!entry.stages || Object.keys(entry.stages).sort().join(",") !== Object.keys(REQUIRED).sort().join(","))
      push("STAGE_INVENTORY");
    for (const [stage,required] of Object.entries(REQUIRED)) {
      const block = entry.stages?.[stage], missing = [], stageErrors = [];
      if (!block) { push("MISSING_STAGE:"+stage); continue; }
      if (block.designStatus !== "design_ready" || block.evidenceScope !== "authored_design_only" ||
          block.productionStatus !== (stage==="G0"?"not_applicable":"pending_media")) {
        push(stage+":STAGE_STATUS_OVERCLAIM"); stageErrors.push("STATUS");
      }
      const arts = Array.isArray(block.artifacts) ? block.artifacts : [];
      const kinds = arts.map(x => x.kind), expected = new Set(required);
      for (const kind of required) if (!kinds.includes(kind)) missing.push(kind);
      if (new Set(kinds).size !== kinds.length || arts.some(x => !expected.has(x.kind)))
        stageErrors.push("EXTRA_OR_DUPLICATE_KIND");
      if (missing.length) stageErrors.push("MISSING_KINDS:"+missing.join(","));
      for (const a of arts) {
        const key = cid+":"+stage+":"+a.kind;
        if (!a.artifactId || artifactIds.has(a.artifactId)) stageErrors.push("DUPLICATE_ARTIFACT_ID:"+key);
        artifactIds.add(a.artifactId);
        if (a.reviewStatus !== "authored_plan_checked" ||
          a.sourcePointer !== POINTERS[a.kind] ||
          a.evidence !== (VISUAL.has(a.kind)?"rendered_vector_design_not_generated_media":"full_authored_source_text") ||
          a.type !== (VISUAL.has(a.kind)?"svg":"json_section"))
          stageErrors.push("ARTIFACT_METADATA:"+key);
        if (VISUAL.has(a.kind) && filePaths.has(a.path))
          stageErrors.push("DUPLICATE_VISUAL_PATH:"+key);
        if (VISUAL.has(a.kind)) filePaths.add(a.path);
        if (!validPath(a.path) || (a.type==="svg" ? extname(a.path)!==".svg" : a.path !== entry.sourcePath))
          { stageErrors.push("ARTIFACT_PATH:"+key); continue; }
        const section = deref(scene, a.sourcePointer);
        if (!meaningful(a.kind, section, scene)) stageErrors.push("ARTIFACT_SOURCE_CONTENT:"+key);
        try {
          const content = await readSafe(root,a.path);
          if (a.type==="svg") for (const problem of verifySVG(content,a,scene)) stageErrors.push(problem+":"+key);
        } catch { stageErrors.push("FILE_NOT_FOUND:"+key); }
      }
      if (stageErrors.length) stageErrors.forEach(x => push(stage+":"+x));
      stages[stage] = {designComplete:stageErrors.length===0,artifactsChecked:arts.length,missingKinds:missing,errors:stageErrors};
    }
    byCase.push({caseId:cid,designComplete:caseErrors.length===0,stages,errors:caseErrors});
  }
  return {valid:errors.length===0,designComplete:errors.length===0,productionReady:false,
    totalArtifacts:byCase.reduce((n,c)=>n+Object.values(c.stages).reduce((m,s)=>m+s.artifactsChecked,0),0),
    cases:byCase,errors,limitation:"只读验证真实存在的矢量设计卡与全量文字交接；G1 材质样片、视频、声音和最终审片仍需独立媒体证据，无法在此检验。" };
}
async function main() {
  const args = process.argv.slice(2);
  if (args.length===1 && args[0]==="--help") {
    console.log("用法：node scripts/check-stage-artifacts.mjs <manifest.json>；只读阶段结果验收，退出码0=全部设计结果在位但不代表媒体通过，1=缺失或不一致。");
    return;
  }
  if (args.length!==1 || args[0].startsWith("-")) throw new Error("用法：node scripts/check-stage-artifacts.mjs <manifest.json>");
  const manifest = parseJsonStrict(await readFile(args[0],"utf8"));
  const result = await checkStageArtifacts(manifest);
  console.log(JSON.stringify(result,null,2));
  if (!result.designComplete) process.exitCode=1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(e=>{console.error(JSON.stringify({error:e.message}));process.exitCode=1;});
