import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { validateMarkdownFiles } from "../scripts/markdown-links.mjs";
import { repositoryRoot, validateRepository } from "../scripts/validate-repository.mjs";
import { FORMAT, NODE_TAGS, validateVideoWorkbook } from "../skills/cineweave-director/scripts/check-video-plan.mjs";
import { checkCameraLanguageDecisions, checkShotReview } from "../skills/cineweave-director/scripts/check-shot-review.mjs";

function videoBook() {
  const scope = { platform: "fixture", model: "fixture", surface: "fixture", mode: "t2v" };
  return { format: FORMAT, frameRate: { numerator: 24, denominator: 1 }, nodes: [{
    id: "S1", type: "video_t2v",
    prompt: [...new Set(["节点", "目标", "约束", ...NODE_TAGS.video_t2v])].map((tag) => `<${tag}>${tag === "节点" ? "S1" : "静止铜杯"}</${tag}>`).join("\n"),
    timing: { headFrames: 0, editFrames: 96, tailFrames: 0 },
    capability: { ...scope, status: "documented", evidence: "fixture:not-real-evidence", checkedAt: "2026-09-23" },
    durationPolicy: { scope, status: "fixture", source: "fixture:arithmetic", checkedAt: "2026-09-23", allowedMs: [4000] },
    referenceLimits: { scope, status: "fixture", source: "fixture:no-references", checkedAt: "2026-09-23", caps: { total: 0 } },
  }] };
}

test("invalid calendar declarations never produce a completed video declaration", () => {
  for (const value of ["2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "0000-01-01", "2026-1-01", "yesterday", 20260923]) {
    for (const field of ["capability", "durationPolicy", "referenceLimits"]) {
      const book = videoBook();
      book.nodes[0][field].checkedAt = value;
      const result = validateVideoWorkbook(book);
      assert.equal(result.declarationComplete, false, `${field}: ${value}`);
      if (field === "capability") assert.ok(result.pending.some((item) => item.code === "CAPABILITY_SCOPE"));
      else assert.equal(result.valid, false);
      assert.equal(result.capabilityVerified, false);
    }
  }
});

test("valid leap dates and ordinary dates preserve declaration-only semantics", () => {
  for (const date of ["2000-02-29", "2024-02-29", "2026-02-28", "2026-09-23"]) {
    const book = videoBook();
    for (const field of ["capability", "durationPolicy", "referenceLimits"]) book.nodes[0][field].checkedAt = date;
    const before = structuredClone(book);
    const result = validateVideoWorkbook(book);
    assert.equal(result.declarationComplete, true, date);
    assert.equal(result.capabilityVerified, false);
    assert.equal(result.mediaVerified, false);
    assert.deepEqual(book, before);
  }
});

test("all worksheet CLIs reject duplicate keys and malformed scalar strings before validation", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cw-strict-json-"));
  try {
    const input = join(directory, "input.json");
    const documents = {
      "check-delivery": '{"frameRate":{"numerator":24,"denominator":1},"totalFrames":0,"totalFrames":24,"shots":[{"id":"S1","startFrame":0,"endFrame":24}]}',
      "check-shot-review": '{"source":{"type":"design","id":"draft","version":1},"mode":"focused","roles":["direction"],"shotIds":["S1"],"reviews":[{"role":"direction","shotId":"S1","status":"revise","status":"pass","criterion":"fixture","observation":"fixture","sourceLocator":"draft S1"}]}',
      "check-video-plan": JSON.stringify(videoBook()).replace('"editFrames":96', '"editFrames":0,"editFrames":96'),
    };
    for (const [name, raw] of Object.entries(documents)) {
      const cli = fileURLToPath(new URL(`../skills/cineweave-director/scripts/${name}.mjs`, import.meta.url));
      for (const [value, error] of [[raw, /Duplicate object key/u], ['{"note":"\\ud800"}', /unpaired high surrogate/u], ['{"number":1e400}', /finite IEEE-754/u]]) {
        await writeFile(input, value);
        const result = spawnSync(process.execPath, [cli, input], { cwd: directory, encoding: "utf8", timeout: 10000 });
        assert.equal(result.status, 1, `${name}: ${result.stderr}`);
        assert.match(result.stderr, error);
        assert.equal(result.stdout, "");
        assert.equal(await readFile(input, "utf8"), value);
      }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("local links resolve Chinese, repeated, encoded and explicit anchors, excluding code and footnote prose", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cw-markdown-"));
  try {
    const source = join(directory, "index.md"), target = join(directory, "guide.md");
    await writeFile(target, '# 人物情绪\n## 人物情绪\n## 人物情绪-1\n## 人物情绪\n\n摄影与声音\n---\n\n<a id="compat"></a>\n');
    await writeFile(source, '# 入口\n[自己](#入口)\n[人物](guide.md#人物情绪)\n[重复](guide.md#人物情绪-1)\n[碰撞](guide.md#人物情绪-1-1)\n[重复二](guide.md#人物情绪-2)\n[编码](guide.md#%E4%BA%BA%E7%89%A9%E6%83%85%E7%BB%AA)\n[旧锚点](guide.md#compat)\n[下划线标题](guide.md#摄影与声音)\n[引用][ref]\n[ref]: guide.md#人物情绪\n[^1]: 来源说明，不是路径。\n`[不是链接](missing.md)`\n```md\n[示例](missing.md)\n# 假标题\n```\n');
    const result = await validateMarkdownFiles(directory, ["index.md", "guide.md"]);
    assert.equal(result.fragments, 9);
    await writeFile(source, '[失效章节](guide.md#不存在)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[同文件失效](#不存在)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[假标题](guide.md#假标题)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
    await writeFile(source, '[逃逸](../outside.md)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /escapes/u);
    await writeFile(source, '[坏编码](guide.md#%zz)');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /invalid encoded/u);
    await writeFile(source, '[重命名前](guide.md#人物情绪)');
    await writeFile(target, '# 新标题\n');
    await assert.rejects(validateMarkdownFiles(directory, ["index.md"]), /broken local fragment/u);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("repository regression command ownership preserves release and source boundaries", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "cw-repository-gates-"));
  const root = join(directory, "repository");
  const ignored = new Set([".git", ".build", "node_modules"]);
  try {
    await cp(repositoryRoot, root, {
      recursive: true,
      filter: (source) => !ignored.has(relative(repositoryRoot, source).split(sep)[0]),
    });
    const packagePath = join(root, "package.json");
    const workflowPath = join(root, ".github", "workflows", "validate.yml");
    const originalPackage = await readFile(packagePath, "utf8");
    const packageJson = JSON.parse(originalPackage);
    const regressionPaths = packageJson.scripts.test.slice("node --test ".length).split(" ");
    const originalWorkflow = await readFile(workflowPath, "utf8");
    const workflow = originalWorkflow.replace(`        run: ${packageJson.scripts.test}\n`, "        run: npm test\n");
    assert.match(workflow, /^        run: npm test$/mu);
    await writeFile(workflowPath, workflow);

    async function snapshot(path, prefix = "") {
      const files = {};
      for (const entry of await readdir(path, { withFileTypes: true })) {
        const key = `${prefix}${entry.name}`;
        const child = join(path, entry.name);
        if (entry.isDirectory()) Object.assign(files, await snapshot(child, `${key}/`));
        else files[key] = await readFile(child);
      }
      return files;
    }
    const before = await snapshot(root);
    await t.test("CI runs the package-owned regression command", async () => {
      await assert.doesNotReject(validateRepository(root));
    });
    await t.test("reviewed regression paths can be reordered without changing coverage", async () => {
      const changed = structuredClone(packageJson);
      changed.scripts.test = `node --test ${[...regressionPaths].reverse().join(" ")}`;
      const candidate = JSON.stringify(changed);
      try {
        await writeFile(packagePath, candidate);
        await assert.doesNotReject(validateRepository(root));
        assert.equal(await readFile(packagePath, "utf8"), candidate);
      } finally { await writeFile(packagePath, originalPackage); }
    });

    for (const lifecycle of ["pretest", "posttest"]) {
      await t.test(`rejects unregistered ${lifecycle} before npm execution`, async () => {
        const changed = structuredClone(packageJson);
        changed.scripts[lifecycle] = "node scripts/build-plugin-bundle.mjs";
        const candidate = JSON.stringify(changed);
        try {
          await writeFile(packagePath, candidate);
          await assert.rejects(validateRepository(root), /package\.json script inventory/u);
          assert.equal(await readFile(packagePath, "utf8"), candidate);
        } finally { await writeFile(packagePath, originalPackage); }
      });
    }

    const invalidCommands = [
      ["omitted regression", `node --test ${regressionPaths.slice(1).join(" ")}`],
      ["unregistered regression", `${packageJson.scripts.test} tests/unregistered.test.mjs`],
      ["duplicate regression", `${packageJson.scripts.test} ${regressionPaths[0]}`],
      ["bundle smoke in ordinary regressions", `${packageJson.scripts.test} tests/bundle-smoke.test.mjs`],
      ["shell suffix", `${packageJson.scripts.test} && node scripts/build-plugin-bundle.mjs`],
      ["extra spacing", packageJson.scripts.test.replace("node --test ", "node --test  ")],
      ["non-test Node command", packageJson.scripts.test.replace("node --test", "node --inspect --test")],
    ];
    for (const [label, command] of invalidCommands) {
      await t.test(`rejects ${label}`, async () => {
        const changed = structuredClone(packageJson);
        changed.scripts.test = command;
        const candidate = JSON.stringify(changed);
        try {
          await writeFile(packagePath, candidate);
          await assert.rejects(validateRepository(root), /package\.json (?:script test|test command|regression)/u);
          assert.equal(await readFile(packagePath, "utf8"), candidate);
        } finally { await writeFile(packagePath, originalPackage); }
      });
    }
    const invalidWorkflows = [
      ["unpinned checkout", /actions\/checkout@[a-f0-9]{40}/u, "actions/checkout@v4"],
      ["unpinned Node setup", /actions\/setup-node@[a-f0-9]{40}/u, "actions/setup-node@v4"],
      ["write permissions", "contents: read", "contents: write"],
      ["release tag bypass", "process.env.GITHUB_REF_NAME !== expected", "false"],
      ["source gate after npm lifecycle execution", "      - name: 校验源分发\n        run: node scripts/validate-repository.mjs\n      - name: 运行校验回归测试\n        run: npm test\n", "      - name: 运行校验回归测试\n        run: npm test\n      - name: 校验源分发\n        run: node scripts/validate-repository.mjs\n"],
    ];
    for (const [label, pattern, replacement] of invalidWorkflows) {
      await t.test(`rejects ${label}`, async () => {
        const candidate = workflow.replace(pattern, replacement);
        assert.notEqual(candidate, workflow);
        try {
          await writeFile(workflowPath, candidate);
          await assert.rejects(validateRepository(root), /read-only release-gate template/u);
          assert.equal(await readFile(workflowPath, "utf8"), candidate);
        } finally { await writeFile(workflowPath, workflow); }
      });
    }
    await t.test("unregistered executable cannot join regressions through filesystem discovery", async () => {
      const extra = join(root, "tests", "unregistered.test.mjs");
      const changed = structuredClone(packageJson);
      changed.scripts.test += " tests/unregistered.test.mjs";
      try {
        await writeFile(extra, "throw new Error('must not execute');\n");
        await writeFile(packagePath, JSON.stringify(changed));
        await assert.rejects(validateRepository(root), /tests source file set mismatch.*unregistered\.test\.mjs/u);
        assert.equal(await readFile(extra, "utf8"), "throw new Error('must not execute');\n");
      } finally {
        await rm(extra, { force: true });
        await writeFile(packagePath, originalPackage);
      }
    });
    assert.deepEqual(await snapshot(root), before, "repository validation must remain read-only");
  } finally { await rm(directory, { recursive: true, force: true }); }
});


/**
 * G0–G7 forward-artifact structural audit. This deliberately checks declared
 * design handoffs, not model generations, cinematic taste or observed media.
 * Full user-readable prompts remain in the paired forward-case fixtures.
 */
function auditSceneForward(caseFile) {
  const errors = [];
  const check = (value, code) => { if (!value) errors.push(code); };
  const nonblank = (value, min = 1) => typeof value === "string" && value.trim().length >= min;
  const unique = (values) => new Set(values).size === values.length;
  const required = ["G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7"];
  check(caseFile?.format === "cineweave-scene-forward/v1", "FORMAT");
  check(caseFile?.runType === "authored_text_dry_run_not_model_or_media_test", "SCOPE_PROVENANCE");
  check(caseFile?.scope?.externalMediaStatus === "not_generated", "SCOPE_MEDIA_UNVERIFIED");
  const stages = caseFile?.stages ?? {};
  for (const stage of required) check(stages[stage] && typeof stages[stage] === "object", `MISSING_STAGE:${stage}`);
  if (required.some((s) => !stages[s])) return errors;
  const { G0, G1, G2, G3, G4, G5, G6, G7 } = stages;
  const fps = caseFile.scope?.fps;
  check(Number.isInteger(fps) && fps > 0 && fps <= 120, "TIMEBASE");
  check(Number.isSafeInteger(caseFile.scope?.durationFrames) && caseFile.scope.durationFrames > 0, "TOTAL_DURATION");
  check(nonblank(caseFile.scope?.title) && nonblank(caseFile.scope?.medium) && nonblank(caseFile.scope?.aspectRatio), "SCOPE_BRIEF");
  check(nonblank(G0.directorStatement, 40) && nonblank(G0.viewerExperience, 20) && nonblank(G0.visualPointOfView, 15), "G0_DIRECTOR_BRIEF");
  const script = Array.isArray(G0.script) ? G0.script : [];
  check(nonblank(G0.sceneScript, 300), "G0_SCENE_SCRIPT");
  for (const line of script) check(nonblank(line.text) && G0.sceneScript?.includes(line.text), `G0_SCRIPT_SCENE_MATCH:${line.id}`);
  const beats = Array.isArray(G0.beats) ? G0.beats : [];
  check(script.length > 0 && script.every((x) => nonblank(x.id) && nonblank(x.speaker) && nonblank(x.text)), "G0_SCRIPT");
  check(beats.length > 0 && beats.every((x) => nonblank(x.id) && nonblank(x.before) && nonblank(x.stimulus) && nonblank(x.action) && nonblank(x.after) && nonblank(x.audienceGain) && Array.isArray(x.coverage) && x.coverage.length > 0), "G0_BEATS");
  check(unique(script.map((x) => x.id)) && unique(beats.map((x) => x.id)), "G0_IDS");
  const assets = Array.isArray(G1.assets) ? G1.assets : [];
  const assetIds = assets.map((x) => x.id);
  const castIds = assets.filter((x) => x.kind === "character").map((x) => x.id);
  check(nonblank(G1.styleBible, 30) && nonblank(G1.referencePlan, 20), "G1_STYLE_AND_SOURCE");
  check(assets.length >= 3 && assets.every((a) => nonblank(a.id) && nonblank(a.kind) && nonblank(a.prompt, 65)), "G1_ASSET_PROMPTS");
  check(unique(assetIds) && castIds.length >= 2, "G1_ASSET_IDS");
  const sceneAssets = assets.filter((a) => a.kind === "scene");
  check(sceneAssets.length === 1 && sceneAssets[0].id === G2.sceneId, "G1_G2_SCENE_OWNER");
  const anchors = Array.isArray(G2.anchors) ? G2.anchors : [];
  const anchorIds = anchors.map((a) => a.id);
  check(nonblank(G2.worldGeometry, 80) && nonblank(G2.axisRule, 20) && nonblank(G2.establishmentStatus), "G2_WORLD_SPACE");
  check(anchors.length >= 3 && anchors.every((a) => nonblank(a.id) && nonblank(a.location)) && unique(anchorIds), "G2_ANCHORS");
  check(Array.isArray(G2.sources) && G2.sources.length > 0 && G2.sources.every((s) => nonblank(s.id) && anchorIds.includes(s.anchorId) && nonblank(s.behavior)), "G2_LIGHT_SOURCES");
  check(Array.isArray(G2.interactionConstraints) && G2.interactionConstraints.length >= 2, "G2_INTERACTION");
  const actors = Array.isArray(G3.actorTracks) ? G3.actorTracks : [];
  check(actors.length === castIds.length && unique(actors.map((a) => a.characterId)), "G3_CAST_TRACKS");
  check(actors.every((a) => castIds.includes(a.characterId) && ["objective","obstacle","tactic","subtext","cue","observableAction","eyeline"].every((key) => nonblank(a[key]))), "G3_ACTING_LOGIC");
  check(Array.isArray(G3.hardLocks) && G3.hardLocks.length >= 3, "G3_HARD_LOCKS");

  const shots = Array.isArray(G4.shots) ? G4.shots : [];
  const shotIds = shots.map((s) => s.id);
  check(shots.length >= 3 && unique(shotIds), "G4_SHOTS_UNIQUE");
  const beatIds = new Set(beats.map((b) => b.id));
  for (const beat of beats) for (const id of beat.coverage ?? []) check(shotIds.includes(id), "G0_G4_BEAT_COVERAGE");
  for (const shot of shots) {
    const prefix = `G4:${shot.id || "unnamed"}`;
    check(shot.sceneId === G2.sceneId && Array.isArray(shot.worldAnchorIds) && shot.worldAnchorIds.length >= 2 && shot.worldAnchorIds.every((id) => anchorIds.includes(id)), `${prefix}_GEO_BINDING`);
    check(Array.isArray(shot.beatIds) && shot.beatIds.length > 0 && shot.beatIds.every((id) => beatIds.has(id) && beats.find((b) => b.id === id)?.coverage.includes(shot.id)), `${prefix}_BEAT_BINDING`);
    check(Array.isArray(shot.castIds) && shot.castIds.length > 0 && shot.castIds.every((id) => castIds.includes(id)), `${prefix}_CAST_BINDING`);
    check(Array.isArray(shot.propIds) && shot.propIds.every((id) => assetIds.includes(id)), `${prefix}_ASSET_BINDING`);
    check(Number.isSafeInteger(shot.durationFrames) && shot.durationFrames > 0, `${prefix}_DURATION`);
    check(nonblank(shot.startStateId) && nonblank(shot.endStateId) && nonblank(shot.startState, 15) && nonblank(shot.endState, 15), `${prefix}_BOUNDARY`);
    const camera = shot.cameraDecision ?? {};
    check(nonblank(camera.shotScale) && nonblank(camera.primaryTechnique) && nonblank(camera.narrativeReason, 12) && nonblank(camera.trigger, 10) && nonblank(camera.focusPlan) && nonblank(camera.cameraPosition), `${prefix}_CAMERA_LANGUAGE`);
    check(["static","moving"].includes(camera.cameraMode), `${prefix}_CAMERA_TYPE`);
    if (camera.cameraMode === "static") check(nonblank(camera.noMotionReason, 10), `${prefix}_STATIC_REASON`);
    if (camera.cameraMode === "moving") check(camera.noMotionReason == null && /(移动|跟随|绕行|轨道|路径)/u.test(shot.videoPrompt ?? ""), `${prefix}_MOTION_PATH`);
    if (caseFile.scope.generationPath.startsWith("i2v_")) check(nonblank(shot.keyframePrompt, 160), `${prefix}_KEYFRAME_PROMPT`);
    check(nonblank(shot.videoPrompt, 320) && shot.videoPrompt.includes(shot.id), `${prefix}_VIDEO_COPY`);
    const cameraRow = shot.cameraReviewRow ?? {};
    check(cameraRow.shotId === shot.id &&
      cameraRow.decision?.primaryTechniqueId === camera.primaryTechnique &&
      cameraRow.decision?.cameraMode === camera.cameraMode &&
      cameraRow.decision?.narrativeReason === camera.narrativeReason &&
      cameraRow.decision?.trigger === camera.trigger &&
      cameraRow.camera?.axisSide === shot.axisSide &&
      cameraRow.temporal?.durationSeconds * fps === shot.durationFrames &&
      cameraRow.decision?.exitMatch?.includes(shot.endStateId),
      `${prefix}_CAMERA_HANDOFF`);
  }
  if (shots.every((shot) => shot.cameraReviewRow && typeof shot.cameraReviewRow === "object")) {
    try {
      const cameraResult = checkCameraLanguageDecisions({
        scope: "narrative_video", shotIds, decisions: shots.map((shot) => shot.cameraReviewRow)
      });
      check(cameraResult.valid && cameraResult.coverageComplete && cameraResult.expectedShots === shots.length, "G4_CAMERA_CANONICAL");
    } catch {
      errors.push("G4_CAMERA_CANONICAL");
    }
  } else errors.push("G4_CAMERA_CANONICAL");
  const windows = Array.isArray(G5.shotWindows) ? G5.shotWindows : [];
  const cuts = Array.isArray(G5.cuts) ? G5.cuts : [];
  check(windows.length === shots.length && cuts.length === shots.length - 1, "G5_WINDOW_AND_CUT_COUNT");
  let frame = 0;
  for (const [i, shot] of shots.entries()) {
    const w = windows[i] ?? {};
    check(w.shotId === shot.id && w.startFrame === frame && w.endFrame === frame + shot.durationFrames, `G5_WINDOW:${shot.id}`);
    frame += Number.isSafeInteger(shot.durationFrames) ? shot.durationFrames : 0;
    if (!i) continue;
    const earlier = shots[i - 1];
    const cut = cuts[i - 1] ?? {};
    check(cut.from === earlier.id && cut.to === shot.id && cut.matchedStateId === earlier.endStateId && cut.matchedStateId === shot.startStateId, `G5_CUT_STATE:${earlier.id}->${shot.id}`);
    check(cut.propContinuity === `${earlier.endState} → ${shot.startState}`, `G5_CUT_PROP_STATE:${earlier.id}->${shot.id}`);
    check(["continue","revisit","ellipsis"].includes(cut.mode) && nonblank(cut.screenDirection, 10) && nonblank(cut.propContinuity, 20) && nonblank(cut.soundBridge, 15) && nonblank(cut.exception), `G5_CUT_DETAIL:${earlier.id}->${shot.id}`);
  }
  check(frame === caseFile.scope.durationFrames, "G5_TOTAL_FRAMES");
  check(nonblank(G5.ambient, 30) && nonblank(G5.foley, 30) && nonblank(G5.music) && nonblank(G5.editPlan, 30) && nonblank(G5.subtitlePlan, 25), "G5_SOUND_EDIT");
  const profiles = Array.isArray(G5.voiceProfiles) ? G5.voiceProfiles : [];
  check(profiles.length === castIds.length && unique(profiles.map((x) => x.characterId)) && profiles.every((x) => castIds.includes(x.characterId) && nonblank(x.perceivedVoice, 20) && nonblank(x.performanceRange, 15)), "G5_VOICE_PROFILES");
  check(nonblank(G5.mixPlan, 30) && nonblank(G5.colorPlan, 30), "G5_MIX_AND_GRADE");
  const cues = Array.isArray(G5.dialogueCues) ? G5.dialogueCues : [];
  check(cues.length === script.length && unique(cues.map((c) => c.lineId)), "G5_DIALOGUE_CUE_INVENTORY");
  for (const line of script) {
    const cue = cues.find((c) => c.lineId === line.id);
    const shot = shots.find((s) => s.id === cue?.shotId);
    check(cue && cue.exactText === line.text && cue.speaker === line.speaker && shot && shot.castIds.includes(line.speaker) && shot.videoPrompt.includes(line.text), `G5_DIALOGUE_IDENTITY:${line.id}`);
    check(cue && cue.subtitleText === line.text && castIds.includes(cue.to) && nonblank(cue.delivery, 20) && cue.voiceDurationEvidence === "planned_unmeasured" && cue.track === "diegetic_dialogue", `G5_VOICE_DIRECTION:${line.id}`);
    check(cue && Number.isInteger(cue.startOffsetFrame) && Number.isInteger(cue.endOffsetFrame) && cue.startOffsetFrame >= 0 && cue.endOffsetFrame > cue.startOffsetFrame && cue.endOffsetFrame <= shot?.durationFrames, `G5_DIALOGUE_DURATION:${line.id}`);
  }
  check(G6.generationPath === caseFile.scope.generationPath && G6.mediaAvailable === false && G6.providerSupport === "unverified" && G6.editingStatus === "not_attempted_without_video", "G6_NO_FALSE_EXECUTION");
  check(Array.isArray(G6.requiredBeforeExecution) && G6.requiredBeforeExecution.length >= 3 && nonblank(G6.candidatePolicy, 20) && nonblank(G6.renderDelivery, 20), "G6_PRODUCTION_TASKS");
  const handles = G6.plannedHandles ?? {};
  check(Number.isSafeInteger(handles.headFrames) && handles.headFrames >= 0 && Number.isSafeInteger(handles.tailFrames) && handles.tailFrames >= 0 && handles.source === "creative_estimate_provider_unverified", "G6_HANDLES_AND_SCOPE");
  check(Array.isArray(G6.testGroups) && G6.testGroups.length >= 2 && G6.testGroups.every((x) => Array.isArray(x.shots) && x.shots.length >= 2 && x.shots.every((id) => shotIds.includes(id)) && nonblank(x.risk) && nonblank(x.rejectIf)), "G6_BENCHMARKS");
  check(G7.evidenceScope === "plan_only" && G7.mediaVerified === false && nonblank(G7.stageSummary, 30), "G7_EVIDENCE_BOUNDARY");
  check(Array.isArray(G7.formalAcceptance) && G7.formalAcceptance.length >= 4 && Array.isArray(G7.openItems) && G7.openItems.length >= 3, "G7_ACCEPTANCE_GAPS");
  check(G7.paperReviewScope === "authored_planning_text_only_not_independent" && Array.isArray(G7.paperReviews) && G7.paperReviews.length === shots.length * 6, "G7_PAPER_INVENTORY");
  if (Array.isArray(G7.paperReviews) && shots.every((shot) => shot.cameraReviewRow)) {
    try {
      const paper = checkShotReview({
        source: { type: "design", id: caseFile.id, version: 1, cameraLanguageScope: "narrative_video" },
        mode: "full", shotIds, reviews: G7.paperReviews,
        cameraDecisions: shots.map((shot) => shot.cameraReviewRow)
      });
      check(paper.valid && paper.coverageComplete && paper.reviewComplete &&
        paper.expectedRows === shots.length * 6 && paper.scope === "plan_only",
        "G7_SIX_PERSPECTIVE_PAPER_REVIEW");
    } catch { errors.push("G7_SIX_PERSPECTIVE_PAPER_REVIEW"); }
  } else errors.push("G7_SIX_PERSPECTIVE_PAPER_REVIEW");
  return errors;
}

test("Xuanzang-derived G0–G7 forward cases fully deliver 12 authored shots and remain plan-only", async () => {
  for (const name of ["ancient-full-flow", "everyday-full-flow"]) {
    const path = new URL(`./evaluations/2026-10-16/${name}.json`, import.meta.url);
    const content = JSON.parse(await readFile(path, "utf8"));
    const before = structuredClone(content);
    assert.deepEqual(auditSceneForward(content), [], name);
    assert.deepEqual(content, before, "stage audit must be read only");
    assert.equal(content.stages.G4.shots.length, 6);
  }
});

test("stage-level delivery audit detects missing owners, orphaned beats, inconsistent cut state, late speech and fake media pass", async () => {
  const fixtureFile = new URL("./evaluations/2026-10-16/ancient-full-flow.json", import.meta.url);
  const fixture = JSON.parse(await readFile(fixtureFile, "utf8"));
  const defects = [
    ["MISSING_STAGE:G2", (x) => { delete x.stages.G2; }],
    ["G0_SCENE_SCRIPT", (x) => { x.stages.G0.sceneScript = "只有对白清单，没有一场可演的剧本"; }],
    ["G0_SCRIPT_SCENE_MATCH:A-L1", (x) => { x.stages.G0.sceneScript = x.stages.G0.sceneScript.replace("上游的水位，比今晨又高了一尺。", "水上涨了"); }],
    ["G1_ASSET_PROMPTS", (x) => { x.stages.G1.assets[0].prompt = ""; }],
    ["G4:A-S04_GEO_BINDING", (x) => { x.stages.G4.shots[3].worldAnchorIds[0] = "fake_window"; }],
    ["G0_G4_BEAT_COVERAGE", (x) => { x.stages.G0.beats[0].coverage[0] = "absent"; }],
    ["G3_ACTING_LOGIC", (x) => { x.stages.G3.actorTracks[0].objective = ""; }],
    ["G4:A-S01_KEYFRAME_PROMPT", (x) => { x.stages.G4.shots[0].keyframePrompt = ""; }],
    ["G4:A-S01_STATIC_REASON", (x) => { x.stages.G4.shots[0].cameraDecision.noMotionReason = ""; }],
    ["G4:A-S05_CAMERA_HANDOFF", (x) => { x.stages.G4.shots[4].cameraReviewRow.decision.primaryTechniqueId = "M11"; }],
    ["G4_CAMERA_CANONICAL", (x) => { x.stages.G4.shots[4].cameraReviewRow.decision.focusMode = "hold"; }],
    ["G5_CUT_STATE:A-S04->A-S05", (x) => { x.stages.G5.cuts[3].matchedStateId = "changed_during_cut"; }],
    ["G5_WINDOW:A-S02", (x) => { x.stages.G5.shotWindows[1].startFrame += 1; }],
    ["G5_DIALOGUE_IDENTITY:A-L1", (x) => { x.stages.G5.dialogueCues[0].exactText = "不是原台词"; }],
    ["G5_VOICE_DIRECTION:A-L1", (x) => { x.stages.G5.dialogueCues[0].subtitleText = "错误字幕"; }],
    ["G5_VOICE_PROFILES", (x) => { x.stages.G5.voiceProfiles.pop(); }],
    ["G5_CUT_PROP_STATE:A-S01->A-S02", (x) => { x.stages.G5.cuts[0].propContinuity = "unverified"; }],
    ["G6_HANDLES_AND_SCOPE", (x) => { x.stages.G6.plannedHandles.source = "verified_platform"; }],
    ["G5_DIALOGUE_DURATION:A-L4", (x) => { x.stages.G5.dialogueCues[3].endOffsetFrame = 2000; }],
    ["G6_NO_FALSE_EXECUTION", (x) => { x.stages.G6.mediaAvailable = true; }],
    ["G7_PAPER_INVENTORY", (x) => { x.stages.G7.paperReviews.pop(); }],
    ["G7_SIX_PERSPECTIVE_PAPER_REVIEW", (x) => { x.stages.G7.paperReviews[0].observation = ""; }],
    ["G7_EVIDENCE_BOUNDARY", (x) => { x.stages.G7.mediaVerified = true; }],
  ];
  for (const [expected, mutate] of defects) {
    const x = structuredClone(fixture);
    mutate(x);
    assert.ok(auditSceneForward(x).includes(expected), `Missing defect ${expected}`);
  }
});
