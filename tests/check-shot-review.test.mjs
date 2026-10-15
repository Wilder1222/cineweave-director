import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkShotReview, checkCameraLanguageDecisions, countPrompt, REVIEW_ROLES } from "../skills/cineweave-director/scripts/check-shot-review.mjs";

function worksheet() {
  const shotIds = ["shot.arrival", "shot.response"];
  return {
    source: { type: "prompt", id: "prompt.shop", version: 1 }, mode: "full", shotIds,
    reviews: REVIEW_ROLES.flatMap((role) => shotIds.map((shotId) => ({
      role, shotId, status: "pass", criterion: `Check ${role} against the selected design.`,
      observation: `Synthetic ${role} finding for ${shotId}; fixture, not an artistic evaluation.`,
      sourceLocator: `prompt.shop v1 / ${shotId} / ${role}`,
    }))),
  };
}

test("full review closes every role-shot pair without claiming media verification or mutating input", () => {
  const input = worksheet();
  const before = structuredClone(input);
  const result = checkShotReview(input);
  assert.equal(result.valid, true);
  assert.equal(result.expectedRows, 12);
  assert.equal(result.coverageComplete, true);
  assert.equal(result.reviewComplete, true);
  assert.equal(result.scope, "plan_only");
  assert.deepEqual(input, before);
});

test("coverage rejects missing, duplicate, extra pairs and duplicate inventory IDs", () => {
  for (const mutate of [
    (w) => { w.reviews.pop(); },
    (w) => { w.reviews.push(w.reviews[0]); },
    (w) => { w.reviews[0].shotId = "shot.absent"; },
    (w) => { w.shotIds[1] = w.shotIds[0]; },
    (w) => { w.reviews = []; },
  ]) {
    const input = worksheet(); mutate(input);
    const result = checkShotReview(input);
    assert.equal(result.valid, false);
    assert.equal(result.coverageComplete, false);
    assert.equal(result.reviewComplete, false);
  }
});

test("focused review covers only explicitly selected perspectives and all shots", () => {
  const input = worksheet(); input.mode = "focused"; input.roles = ["cinematography"];
  input.reviews = input.reviews.filter((row) => row.role === "cinematography");
  assert.equal(checkShotReview(input).reviewComplete, true);
  input.roles.push("cinematography");
  assert.equal(checkShotReview(input).valid, false);
});

test("unknowns and revisions remain open even with complete coverage", () => {
  const input = worksheet();
  input.reviews[0].status = "unknown";
  input.reviews[0].observation = "The incoming prop state is unavailable.";
  const unknown = checkShotReview(input);
  assert.equal(unknown.valid, true);
  assert.equal(unknown.coverageComplete, true);
  assert.equal(unknown.reviewComplete, false);
  assert.equal(unknown.openItems.length, 1);
  input.reviews[0].status = "revise";
  assert.equal(checkShotReview(input).valid, false);
  input.reviews[0].repair = { domain: "character", variable: "response onset", acceptance: "Response follows the cue." };
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).reviewComplete, false);
  input.reviews[0].status = "pass";
  assert.equal(checkShotReview(input).valid, false);
});

test("not-applicable rows need an explanation and cannot yield an all-exempt pass", () => {
  const input = worksheet();
  for (const row of input.reviews) { row.status = "not_applicable"; row.observation = "Synthetic exemption for this fixture."; }
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).reviewComplete, false);
  input.reviews[0].observation = " ";
  assert.throws(() => checkShotReview(input), /observation/);
});

test("blank verdicts, unsupported fields and media claims fail instead of passing a marker check", () => {
  for (const mutate of [
    (w) => { delete w.reviews[0].status; },
    (w) => { w.reviews[0].criterion = "\t"; },
    (w) => { w.reviews[0].observation = ""; },
    (w) => { delete w.reviews[0].sourceLocator; },
    (w) => { w.source.type = "media"; },
    (w) => { w.source.version = 0; },
    (w) => { w.roles = ["direction"]; },
    (w) => { w.mode = "focused"; w.roles = []; },
    (w) => { w.reviews[0].role = "unknown-role"; },
    (w) => { w.reviews[0].approved = true; },
    (w) => { w.prompt = { text: "copy", maxNonWhitespaceCodePoints: -1 }; },
  ]) {
    const input = worksheet(); mutate(input);
    assert.throws(() => checkShotReview(input));
  }
});

test("prompt budget counts Unicode code points, has no universal cap and never changes copy", () => {
  assert.equal(countPrompt("甲\t乙\n😀\u0085\u3000e\u0301"), 5);
  assert.equal(countPrompt("👩‍👩‍👧‍👦"), 7);
  const input = worksheet(); input.prompt = { text: "甲 乙😀", maxNonWhitespaceCodePoints: 3 };
  assert.equal(checkShotReview(input).valid, true);
  input.prompt.maxNonWhitespaceCodePoints = 2;
  assert.equal(checkShotReview(input).valid, false);
  assert.equal(checkShotReview(input).reviewComplete, false);
  assert.equal(input.prompt.text, "甲 乙😀");
  input.prompt = { text: "字".repeat(5001) };
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).prompt.limit, null);
  input.source.type = "design";
  assert.equal(checkShotReview(input).valid, false);
});

test("CLI distinguishes completed, unresolved and invalid worksheets without writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-shot-review-"));
  const file = join(root, "review.json");
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  try {
    for (const [status, expected] of [["pass", 0], ["unknown", 2], ["invalid", 1]]) {
      const input = worksheet(); input.reviews[0].status = status;
      const bytes = JSON.stringify(input);
      await writeFile(file, bytes);
      const result = spawnSync(process.execPath, [cli, file], { encoding: "utf8" });
      assert.equal(result.status, expected, result.stderr);
      assert.equal(await readFile(file, "utf8"), bytes);
      const output = JSON.parse(result.stdout || result.stderr);
      assert.equal(output.scope, "plan_only");
      if (expected === 1) {
        assert.match(output.error, /必须/);
        assert.match(output.messageZh, /无法完成逐镜评审/);
      } else {
        assert.equal(output.localization.locale, "zh-CN");
        assert.match(output.localization.summary, expected === 0 ? /评审已完成/ : /未决项/);
        assert.match(output.limitation, /不核验/);
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("逐镜检查器提供中文帮助，并拒绝错误参数而不读取文件", () => {
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  const help = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /用法/);
  assert.match(help.stdout, /只读/);
  for (const args of [[], ["--unsupported"]]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });
    assert.equal(result.status, 1);
    const output = JSON.parse(result.stderr);
    assert.equal(output.scope, "plan_only");
    assert.match(output.error, /用法/);
  }
});

test("three-shot narrative handoff survives draft review, one-variable revision and CLI readback", async () => {
  // Authored planning fixture, not an independent model or media-quality evaluation.
  const fixturePath = new URL("./fixtures/ensemble-handoff.json", import.meta.url);
  const { worksheet: initial, correction } = JSON.parse(await readFile(fixturePath, "utf8"));
  const before = JSON.stringify(initial);
  const firstReview = checkShotReview(initial);
  assert.equal(firstReview.valid, true);
  assert.equal(firstReview.coverageComplete, true);
  assert.equal(firstReview.expectedRows, 18);
  assert.equal(firstReview.reviewComplete, false);
  assert.deepEqual(firstReview.openItems, [{ role: "performance", shotId: "S2", status: "revise" }]);

  const revised = structuredClone(initial);
  revised.source.version += 1;
  assert.equal(revised.prompt.text.split(correction.before).length, 2, "The correction must target one actual sentence.");
  revised.prompt.text = revised.prompt.text.replace(correction.before, correction.after);
  for (const row of revised.reviews) {
    row.sourceLocator = row.sourceLocator.replace(" v1 /", " v2 /");
    if (row.role === correction.role && row.shotId === correction.shotId) {
      assert.equal(row.repair.domain, "prompt", "The discovering perspective does not change ownership.");
      row.status = "pass";
      row.observation = correction.observation;
      delete row.repair;
    }
  }
  assert.equal(revised.prompt.text.replace(correction.after, correction.before), initial.prompt.text);
  assert.equal(JSON.stringify(initial), before, "Keep the prior prompt and findings intact.");
  assert.equal(checkShotReview(revised).reviewComplete, true);

  const root = await mkdtemp(join(tmpdir(), "cineweave-handoff-roundtrip-"));
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  try {
    for (const [document, expectedExit] of [[initial, 2], [revised, 0]]) {
      const path = join(root, `review-v${document.source.version}.json`);
      await writeFile(path, JSON.stringify(document));
      const result = spawnSync(process.execPath, [cli, path], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, expectedExit, result.stderr);
      const readback = JSON.parse(result.stdout);
      assert.equal(readback.expectedRows, 18);
      assert.equal(readback.scope, "plan_only");
      assert.equal(readback.reviewComplete, expectedExit === 0);
      assert.deepEqual(JSON.parse(await readFile(path, "utf8")), document);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});


function cameraDecisionRow(shotId) {
  return {
    shotId,
    decision: {
      primaryTechniqueId: "M11", supportingTechniqueIds: [], narrativeReason: "持续倾听比移动机位更能展示人物微妙反应",
      audiencePayoff: "同时读清两人的距离与手中信封", trigger: "听者收到说话人的准确台词后停留观察",
      cameraMode: "static", focusMode: "hold", noMotionReason: "让人物活动承担画面变化", exitMatch: "持物状态和目光留给下镜"
    },
    camera: {
      shotScale: "双人中景", position: "桌南侧靠门，镜头朝北", height: "人物眼平",
      angle: "平视", perspectiveIntent: "保留两人之间真实距离", focusTarget: "交接双方的手部与脸",
      depthOfField: "中等景深，必要接触清楚", axisSide: "位于两人对话轴南侧",
      movementIntent: "摄影机全程固定，观察人物行为"
    },
    composition: {
      layout: "两人分居画面两侧", foreground: "靠镜头的一人肩部", midground: "桌上信封与双手",
      background: "原有门与木架", negativeSpace: "信封上方保留空隙", visualHierarchy: "先看信封，后看倾听者脸"
    },
    temporal: {
      durationSeconds: 5,
      cameraMotion: {
        type: "static", motivation: "保持双人关系", path: "固定在桌南侧不移动",
        start: "0 秒起构图稳定", acceleration: "不加速", peak: "无机位位移", deceleration: "不减速",
        end: "5 秒仍保持同一构图", framingChange: "仅角色变化、机位不变"
      },
      focusTimeline: [{ eventId: "focus.one", timeSeconds: 0, description: "双手与面部共同可读" }],
      edit: { entry: "承接之前的动作", exit: "右手握住信封后切出", preferredTransition: "cut", soundBridge: "保留室内底声" }
    }
  };
}
function cameraPlan() {
  const shotIds = ["shot.arrival", "shot.response"];
  return { scope: "narrative_video", shotIds, decisions: shotIds.map(cameraDecisionRow) };
}

test("camera gate enforces one motivated selection per narrative shot, including legitimate static shots", () => {
  const plan = cameraPlan();
  const before = structuredClone(plan);
  const result = checkCameraLanguageDecisions(plan);
  assert.equal(result.valid, true);
  assert.equal(result.coverageComplete, true);
  assert.deepEqual(plan, before);
  const incomplete = structuredClone(plan);
  incomplete.decisions.pop();
  assert.equal(checkCameraLanguageDecisions(incomplete).valid, false);
  assert.deepEqual(checkCameraLanguageDecisions(incomplete).missing, ["shot.response"]);
  const duplicate = structuredClone(plan);
  duplicate.decisions.push(duplicate.decisions[0]);
  assert.equal(checkCameraLanguageDecisions(duplicate).valid, false);
});

test("new narrative review requires Camera Language while historical worksheets still validate unchanged", () => {
  const w = worksheet();
  assert.equal(checkShotReview(w).reviewComplete, true);
  w.source.cameraLanguageScope = "narrative_video";
  assert.equal(checkShotReview(w).reviewComplete, false);
  assert.match(checkShotReview(w).errors.join(" "), /cameraDecisions/);
  w.cameraDecisions = cameraPlan().decisions;
  assert.equal(checkShotReview(w).reviewComplete, true);
  w.cameraDecisions[0].decision.narrativeReason = "";
  assert.equal(checkShotReview(w).reviewComplete, false);
  assert.match(checkShotReview(w).errors.join(" "), /narrativeReason/);
});

test("camera gate rejects motion/focus misclassification and unmotivated dynamic-technique labels", () => {
  const base = cameraPlan();
  const invalid = [
    (x) => { x.decisions[0].decision.primaryTechniqueId = "K06"; },
    (x) => { x.decisions[0].decision.cameraMode = "moving"; },
    (x) => { x.decisions[0].decision.noMotionReason = ""; },
    (x) => { x.decisions[0].decision.primaryTechniqueId = "unknown"; },
    (x) => { x.decisions[0].storyboardMovementType = "rack-focus"; },
    (x) => { x.decisions[0].temporal.cameraMotion.type = "arc"; },
    (x) => { x.decisions[0].decision.focusMode = "rack"; x.decisions[0].decision.focusTargetEnd = "后景纹章"; },
  ];
  for (const mutate of invalid) {
    const c = structuredClone(base); mutate(c);
    assert.equal(checkCameraLanguageDecisions(c).valid, false);
  }
  const rack = structuredClone(base);
  rack.decisions[0].decision.primaryTechniqueId = "K07";
  rack.decisions[0].decision.focusMode = "rack";
  rack.decisions[0].decision.focusTargetEnd = "后景窗框上的纹章";
  rack.decisions[0].temporal.focusTimeline.push({ eventId: "focus.reveal", timeSeconds: 2, description: "由双手切焦到已经存在的后景纹章" });
  assert.equal(checkCameraLanguageDecisions(rack).valid, true, "Rack focus is valid with a static camera and an independent focus track.");
});

test("narrative keyframes require camera grammar without inventing a video trajectory", () => {
  const plan = cameraPlan();
  plan.scope = "narrative_keyframe";
  for (const row of plan.decisions) delete row.temporal;
  assert.equal(checkCameraLanguageDecisions(plan).valid, true);
  const missingComposition = structuredClone(plan);
  missingComposition.decisions[0].composition.visualHierarchy = "";
  assert.equal(checkCameraLanguageDecisions(missingComposition).valid, false);
});

test("camera-language CLI validates complete narrative plans and reports omissions, without writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-camera-language-"));
  const file = join(root, "camera.json");
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  try {
    for (const fail of [false, true]) {
      const p = cameraPlan();
      if (fail) p.decisions.pop();
      const bytes = JSON.stringify(p);
      await writeFile(file, bytes);
      const run = spawnSync(process.execPath, [cli, "--camera-language", file], { encoding: "utf8" });
      assert.equal(run.status, fail ? 1 : 0, run.stderr);
      const result = JSON.parse(run.stdout);
      assert.equal(result.valid, !fail);
      assert.equal(await readFile(file, "utf8"), bytes);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});


test("camera gate accepts motivated rear-to-front arcs and bounded compound movement without inventing media success", () => {
  const arc = cameraPlan();
  const row = arc.decisions[0];
  row.decision.primaryTechniqueId = "K04";
  row.decision.cameraMode = "moving";
  delete row.decision.noMotionReason;
  row.decision.narrativeReason = "由背影转到正面，以新表情揭示角色选择";
  row.decision.audiencePayoff = "观众在人物正面首次看到坚决神情";
  row.decision.trigger = "追兵在画外呼喝之后才开始绕行";
  row.camera.movementIntent = "从人物背后沿右侧绕至近正面，背景门柱保留真实视差";
  row.temporal.cameraMotion.type = "arc";
  row.temporal.cameraMotion.path = "人物右侧有通行空间的弧线，不穿过山门";
  row.temporal.cameraMotion.framingChange = "由背面到三分之四正面，门柱位置有视差";
  assert.equal(checkCameraLanguageDecisions(arc).valid, true);

  const compound = structuredClone(arc);
  compound.decisions[0].decision.primaryTechniqueId = "M09";
  compound.decisions[0].decision.cameraMode = "compound";
  compound.decisions[0].decision.narrativeReason = "认知骤变，通过位移和反向变焦保持主体大小";
  compound.decisions[0].temporal.cameraMotion.type = "compound";
  compound.decisions[0].temporal.cameraMotion.path = "机身后移，镜头反向变焦，主体近似等大";
  assert.equal(checkCameraLanguageDecisions(compound).valid, true);
  assert.match(checkCameraLanguageDecisions(compound).limitation, /不能核验/);
});

test("camera gate blocks incomplete focus chronology, copied primary ID and camera inconsistency", () => {
  const plan = cameraPlan();
  const variations = [
    (p) => { p.decisions[0].decision.supportingTechniqueIds = ["M11"]; },
    (p) => { p.decisions[0].decision.primaryTechniqueId = "neutral_static"; p.decisions[0].decision.supportingTechniqueIds = ["C04"]; },
    (p) => { p.decisions[0].temporal.focusTimeline[0].timeSeconds = -1; },
    (p) => { p.decisions[0].camera.position = ""; },
    (p) => { p.decisions[0].camera.axisSide = ""; },
    (p) => { p.decisions[0].temporal.edit.exit = ""; },
  ];
  for (const change of variations) {
    const item = structuredClone(plan);
    change(item);
    assert.equal(checkCameraLanguageDecisions(item).valid, false);
  }
});
