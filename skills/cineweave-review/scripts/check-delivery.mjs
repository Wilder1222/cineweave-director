#!/usr/bin/env node

// Pure planning checks; no provider calls, media probing, or file writes.
import { parseJsonStrict } from "./parse-json.mjs";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const segmenter = new Intl.Segmenter("und", { granularity: "grapheme" });

export function countText(text) {
  if (typeof text !== "string") throw new TypeError("text must be a string");
  return {
    codePoints: [...text].length,
    graphemes: [...segmenter.segment(text)].length,
    hanCharacters: (text.match(/\p{Script=Han}/gu) ?? []).length,
  };
}

function integer(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new TypeError(`${label} must be a safe integer >= ${minimum}`);
}

function rate(frameRate) {
  integer(frameRate?.numerator, "frameRate.numerator", 1);
  integer(frameRate?.denominator, "frameRate.denominator", 1);
}

export function frameToSrt(frame, frameRate) {
  integer(frame, "frame");
  rate(frameRate);
  // Round each absolute boundary once. Never accumulate rounded clip durations.
  const divisor = BigInt(frameRate.numerator);
  const scaled = BigInt(frame) * BigInt(frameRate.denominator) * 1000n;
  const milliseconds = (scaled * 2n + divisor) / (divisor * 2n);
  const pad = (value, size = 2) => String(value).padStart(size, "0");
  return `${pad(milliseconds / 3600000n)}:${pad(milliseconds / 60000n % 60n)}:${pad(milliseconds / 1000n % 60n)},${pad(milliseconds % 1000n, 3)}`;
}

function object(value, label, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new TypeError(`${label}.${key} is not supported`);
}

export function checkDelivery(plan) {
  object(plan, "worksheet", ["frameRate", "totalFrames", "shots", "subtitles"]);
  object(plan.frameRate, "frameRate", ["numerator", "denominator"]);
  rate(plan.frameRate);
  integer(plan.totalFrames, "totalFrames", 1);
  if (!Array.isArray(plan.shots) || !plan.shots.length) throw new TypeError("shots must be a non-empty array");
  if (plan.subtitles !== undefined && !Array.isArray(plan.subtitles)) throw new TypeError("subtitles must be an array");
  const errors = [];
  const ids = new Set();
  const validateRange = (entry, label) => {
    if (typeof entry.id !== "string" || !entry.id.trim()) throw new TypeError(`${label}.id must be non-empty`);
    if (ids.has(entry.id)) errors.push(`${label}: duplicate id ${entry.id}`);
    ids.add(entry.id);
    integer(entry.startFrame, `${label}.startFrame`);
    integer(entry.endFrame, `${label}.endFrame`);
    if (entry.startFrame >= entry.endFrame) errors.push(`${label}: range must have positive duration`);
    if (entry.endFrame > plan.totalFrames) errors.push(`${label}: range exceeds totalFrames`);
  };
  let nextFrame = 0;
  for (const [i, shot] of plan.shots.entries()) {
    object(shot, `shots[${i}]`, ["id", "startFrame", "endFrame"]);
    validateRange(shot, `shots[${i}]`);
    if (shot.startFrame !== nextFrame) errors.push(`shots[${i}]: gap, overlap or out-of-order cut; expected startFrame ${nextFrame}`);
    nextFrame = shot.endFrame;
  }
  if (nextFrame !== plan.totalFrames) errors.push("shots must cover [0, totalFrames) exactly");
  const subtitles = [];
  let previousEnd = 0;
  for (const [i, cue] of (plan.subtitles ?? []).entries()) {
    object(cue, `subtitles[${i}]`, ["id", "startFrame", "endFrame", "text", "expectedHanCharacters"]);
    validateRange(cue, `subtitles[${i}]`);
    if (typeof cue.text !== "string" || !cue.text.trim() || /\r?\n[ \t]*\r?\n/u.test(cue.text)) throw new TypeError(`subtitles[${i}].text must be non-empty without blank cue separators`);
    if (cue.startFrame < previousEnd) errors.push(`subtitles[${i}]: overlapping or out-of-order cues in this single subtitle track`);
    previousEnd = cue.endFrame;
    const counts = countText(cue.text);
    if (cue.expectedHanCharacters !== undefined) {
      integer(cue.expectedHanCharacters, `subtitles[${i}].expectedHanCharacters`);
      if (cue.expectedHanCharacters !== counts.hanCharacters) errors.push(`subtitles[${i}]: expected ${cue.expectedHanCharacters} Han characters, found ${counts.hanCharacters}`);
    }
    const start = frameToSrt(cue.startFrame, plan.frameRate);
    const end = frameToSrt(cue.endFrame, plan.frameRate);
    if (start === end) errors.push(`subtitles[${i}]: duration collapses at SRT millisecond precision`);
    subtitles.push({ id: cue.id, text: cue.text, start, end, counts });
  }
  return {
    valid: errors.length === 0,
    errors,
    duration: { numerator: (BigInt(plan.totalFrames) * BigInt(plan.frameRate.denominator)).toString(), denominator: String(plan.frameRate.numerator) },
    endTimecode: frameToSrt(plan.totalFrames, plan.frameRate),
    subtitles,
    srt: errors.length ? null : subtitles.map((cue, i) => `${i + 1}\n${cue.start} --> ${cue.end}\n${cue.text}\n`).join("\n"),
    scope: "Planning arithmetic only: cut-only shot coverage and one subtitle track. Text counts do not establish speech duration, readability, synchronization, rights, or media quality.",
  };
}

/** Cross-episode worksheet checks only; IDs and revisions remain caller declarations. */
export function checkProjectWorkflow(workbook) {
  const errors = [], needsReview = [], assetConsumers = [];
  const issue = (list, code, path, message) => list.push({ code, path, message });
  const fail = (code, path, message) => issue(errors, code, path, message);
  const pending = (code, path, message) => issue(needsReview, code, path, message);
  const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const shape = (value, path, required, optional = []) => {
    if (!record(value)) { fail("OBJECT", path, "应为对象。"); return false; }
    for (const key of required) if (!Object.hasOwn(value, key)) fail("REQUIRED", `${path}.${key}`, "缺少必需字段。");
    for (const key of Object.keys(value)) if (![...required, ...optional].includes(key)) fail("UNKNOWN_FIELD", `${path}.${key}`, "不支持的字段，不能忽略后继续检查。");
    return true;
  };
  const text = (value, path) => {
    if (typeof value !== "string" || !value.trim()) { fail("TEXT", path, "应为非空字符串。"); return false; }
    return true;
  };
  const id = (value, path) => {
    if (typeof value !== "string" || !/^[A-Za-z][A-Za-z0-9._-]{0,159}$/u.test(value)) {
      fail("ID", path, "ID 应为 1–160 个字母、数字、点、下划线或连字符，且以字母开头。"); return false;
    }
    return true;
  };
  const number = (value, path, minimum = 1) => {
    if (!Number.isSafeInteger(value) || value < minimum) { fail("INTEGER", path, `应为不小于 ${minimum} 的安全整数。`); return false; }
    return true;
  };
  const array = (value, path, nonempty = false) => {
    if (!Array.isArray(value) || (nonempty && value.length === 0)) { fail("ARRAY", path, nonempty ? "应为非空数组。" : "应为数组。"); return []; }
    return value;
  };
  const ids = (value, path, nonempty = true) => {
    const values = array(value, path, nonempty), seen = new Set(), accepted = [];
    values.forEach((value, index) => {
      if (!id(value, `${path}[${index}]`)) return;
      if (seen.has(value)) fail("DUPLICATE_ID", `${path}[${index}]`, "ID 重复。");
      seen.add(value); accepted.push(value);
    });
    return accepted;
  };
  const index = (values, path, required, optional = []) => {
    const map = new Map();
    array(values, path).forEach((value, position) => {
      const at = `${path}[${position}]`;
      if (!shape(value, at, ["id", ...required], optional)) return;
      if (!id(value.id, `${at}.id`)) return;
      if (map.has(value.id)) fail("DUPLICATE_ID", `${at}.id`, "同类条目的 ID 必须唯一。");
      else map.set(value.id, { value, path: at });
    });
    return map;
  };
  const rootKeys = ["format", "canonical", "projectId", "frameRate", "declaredEpisodeIds", "episodes", "characters", "appearances", "assets", "shots", "previsGroups", "candidates", "claims"];
  const result = (remaining = []) => ({ valid: errors.length === 0, errors, needsReview, remaining, assetConsumers,
    scope: "plan_only", mediaVerified: false, sourceAuthorityVerified: false, providerExecution: false });
  // The exported function also rejects values that cannot occur in strict JSON.
  const ancestors = new Set();
  const scalars = (value, path) => {
    if (typeof value === "string" && /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(value)) fail("JSON_SCALAR", path, "字符串含无效 Unicode 标量。");
    else if (typeof value === "number" && !Number.isFinite(value)) fail("JSON_SCALAR", path, "数值必须有限。");
    else if (value !== null && typeof value === "object") {
      if ((!Array.isArray(value) && !record(value)) || ancestors.has(value)) { fail("JSON_SCALAR", path, "应为无循环的 JSON 值。"); return; }
      ancestors.add(value);
      const keys = Reflect.ownKeys(value);
      if (Array.isArray(value) && keys.length !== value.length + 1) fail("JSON_SCALAR", path, "数组不能包含空位或额外属性。");
      for (const key of keys) {
        if (typeof key !== "string") { fail("JSON_SCALAR", path, "JSON 对象不能包含 Symbol 属性。"); continue; }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (Array.isArray(value) && key === "length") continue;
        if (!descriptor.enumerable || !Object.hasOwn(descriptor, "value")) {
          fail("JSON_SCALAR", `${path}.${key}`, "JSON 值不能包含访问器或不可枚举属性。"); continue;
        }
        if (Array.isArray(value) && (!/^(0|[1-9][0-9]*)$/u.test(key) || Number(key) >= value.length)) {
          fail("JSON_SCALAR", `${path}.${key}`, "数组只能包含连续索引。"); continue;
        }
        scalars(key, `${path}.[key]`);
        scalars(descriptor.value, `${path}.${key}`);
      }
      ancestors.delete(value);
    } else if (!["string", "number", "boolean"].includes(typeof value) && value !== null) fail("JSON_SCALAR", path, "不支持非 JSON 值。");
  };
  scalars(workbook, "$");
  if (errors.length || !shape(workbook, "$", rootKeys)) return result();
  if (workbook.format !== "cineweave-project-workflow/v1") fail("FORMAT", "$.format", "工作表格式必须为 cineweave-project-workflow/v1。");
  if (workbook.canonical !== false) fail("NONCANONICAL", "$.canonical", "工作表不是正式设定或根契约，canonical 必须为 false。");
  id(workbook.projectId, "$.projectId");
  if (shape(workbook.frameRate, "$.frameRate", ["numerator", "denominator"])) {
    number(workbook.frameRate.numerator, "$.frameRate.numerator"); number(workbook.frameRate.denominator, "$.frameRate.denominator");
  }
  const declared = ids(workbook.declaredEpisodeIds, "$.declaredEpisodeIds"), declaredSet = new Set(declared);
  const episodes = index(workbook.episodes, "$.episodes", ["purpose", "entryState", "exitState", "source", "scenes"]);
  const characters = index(workbook.characters, "$.characters", ["identityAssetId", "periods"]);
  const appearances = index(workbook.appearances, "$.appearances", ["characterId", "periodId", "episodeIds"], ["sceneIds", "shotIds"]);
  const assets = index(workbook.assets, "$.assets", ["revision", "role"]);
  const shots = index(workbook.shots, "$.shots", ["revision", "episodeId", "sceneId", "characters", "assets"]);
  const groups = index(workbook.previsGroups, "$.previsGroups", ["shotIds", "frames", "status", "media"]);
  const candidates = index(workbook.candidates, "$.candidates", ["shotId", "inputRevision", "assetInputs", "media", "adopted", "adoptedWindow"]);
  const scenes = new Map(), order = [], assignedShots = new Set(), periods = new Map();
  for (const [episodeId, { value: episode, path }] of episodes) {
    if (!declaredSet.has(episodeId)) fail("UNDECLARED_EPISODE", `${path}.id`, "已展开集必须属于全剧声明清单。");
    for (const field of ["purpose", "entryState", "exitState"]) text(episode[field], `${path}.${field}`);
    if (shape(episode.source, `${path}.source`, ["path", "revision"])) { text(episode.source.path, `${path}.source.path`); number(episode.source.revision, `${path}.source.revision`); }
    array(episode.scenes, `${path}.scenes`, true).forEach((scene, position) => {
      const at = `${path}.scenes[${position}]`;
      if (!shape(scene, at, ["id", "shotIds"]) || !id(scene.id, `${at}.id`)) return;
      if (scenes.has(scene.id)) fail("DUPLICATE_ID", `${at}.id`, "场次 ID 在项目中必须唯一。");
      else scenes.set(scene.id, { episodeId, value: scene, path: at });
      for (const shotId of ids(scene.shotIds, `${at}.shotIds`)) {
        if (assignedShots.has(shotId)) fail("SHOT_OWNERSHIP", `${at}.shotIds`, "一个镜号只能归属一个集场位置。");
        assignedShots.add(shotId); order.push(shotId);
        const shot = shots.get(shotId)?.value;
        if (!shot) fail("MISSING_SHOT", `${at}.shotIds`, `缺少镜头 ${shotId}。`);
        else if (shot.episodeId !== episodeId || shot.sceneId !== scene.id) fail("SHOT_OWNERSHIP", `${at}.shotIds`, `镜头 ${shotId} 的集场归属不一致。`);
      }
    });
  }
  // Episode array order cannot silently override the declared narrative order.
  let previousEpisode = -1;
  for (const episodeId of episodes.keys()) {
    const position = declared.indexOf(episodeId);
    if (position <= previousEpisode) fail("EPISODE_ORDER", "$.episodes", "展开集顺序必须继承全剧声明清单。");
    previousEpisode = position;
  }
  const remaining = declared.filter((episodeId) => !episodes.has(episodeId));
  for (const episodeId of remaining) pending("EPISODE_UNEXPANDED", "$.episodes", `尚未展开 ${episodeId}，不得宣称全剧已展开。`);
  for (const [assetId, { value: asset, path }] of assets) {
    number(asset.revision, `${path}.revision`);
    if (!["identity", "appearance", "scene", "prop", "style", "reference"].includes(asset.role)) fail("ASSET_ROLE", `${path}.role`, "资产职责不受支持。");
    assetConsumers.push({ assetId, revision: asset.revision, consumers: [] });
  }
  const consumers = new Map(assetConsumers.map((asset) => [asset.assetId, asset.consumers]));
  const checkEpisodeScope = (values, path) => {
    const scope = ids(values, path);
    for (const episodeId of scope) if (!declaredSet.has(episodeId)) fail("UNDECLARED_EPISODE", path, `适用集 ${episodeId} 不在全剧清单中。`);
    return scope;
  };
  for (const [characterId, { value: character, path }] of characters) {
    id(character.identityAssetId, `${path}.identityAssetId`);
    if (assets.get(character.identityAssetId)?.value.role !== "identity") fail("IDENTITY_ASSET", `${path}.identityAssetId`, "稳定身份必须引用已声明的 identity 资产。");
    array(character.periods, `${path}.periods`, true).forEach((period, position) => {
      const at = `${path}.periods[${position}]`;
      if (!shape(period, at, ["id", "episodeIds"]) || !id(period.id, `${at}.id`)) return;
      const key = `${characterId}/${period.id}`;
      if (periods.has(key)) fail("DUPLICATE_ID", `${at}.id`, "同一角色的时期 ID 不得重复。");
      const episodeIds = checkEpisodeScope(period.episodeIds, `${at}.episodeIds`);
      periods.set(key, episodeIds);
    });
  }
  for (const [appearanceId, { value: appearance, path }] of appearances) {
    const characterIdValid = id(appearance.characterId, `${path}.characterId`), periodIdValid = id(appearance.periodId, `${path}.periodId`);
    if (assets.get(appearanceId)?.value.role !== "appearance") fail("APPEARANCE_ASSET", `${path}.id`, "外观 ID 必须对应已声明的 appearance 资产。");
    const period = characterIdValid && periodIdValid ? periods.get(`${appearance.characterId}/${appearance.periodId}`) : null;
    if (!period) fail("CHARACTER_PERIOD", path, "外观必须属于已声明角色及其时期。");
    const episodeIds = checkEpisodeScope(appearance.episodeIds, `${path}.episodeIds`);
    for (const episodeId of episodeIds) if (period && !period.includes(episodeId)) fail("APPEARANCE_SCOPE", `${path}.episodeIds`, "外观适用集超出角色时期。");
    if (appearance.sceneIds !== undefined) for (const sceneId of ids(appearance.sceneIds, `${path}.sceneIds`)) {
      const scene = scenes.get(sceneId);
      if (!scene || !episodeIds.includes(scene.episodeId)) fail("APPEARANCE_SCOPE", `${path}.sceneIds`, "外观场次必须存在且属于其适用集。");
    }
    if (appearance.shotIds !== undefined) for (const shotId of ids(appearance.shotIds, `${path}.shotIds`)) {
      const shot = shots.get(shotId)?.value;
      if (!shot || !episodeIds.includes(shot.episodeId) || (appearance.sceneIds !== undefined && (!Array.isArray(appearance.sceneIds) || !appearance.sceneIds.includes(shot.sceneId)))) fail("APPEARANCE_SCOPE", `${path}.shotIds`, "外观镜号必须存在且符合其集场范围。");
    }
  }
  const assetRefs = (values, path) => {
    const refs = new Map();
    array(values, path).forEach((ref, position) => {
      const at = `${path}[${position}]`;
      if (!shape(ref, at, ["assetId", "revision"])) return;
      const assetIdValid = id(ref.assetId, `${at}.assetId`), revisionValid = number(ref.revision, `${at}.revision`);
      if (!assetIdValid || !revisionValid) return;
      if (refs.has(ref.assetId)) fail("DUPLICATE_ASSET", at, "同一资产消费不能重复或同时指定多个修订。");
      refs.set(ref.assetId, ref.revision);
      const asset = assets.get(ref.assetId)?.value;
      if (!asset) fail("MISSING_ASSET", at, "消费的资产不存在。");
      else if (Number.isSafeInteger(asset.revision) && asset.revision > 0) {
        if (ref.revision > asset.revision) fail("FUTURE_REVISION", at, "消费修订超过当前声明的资产修订。");
        else if (ref.revision < asset.revision) pending("STALE_ASSET_INPUT", at, "消费旧资产修订，须复核影响后重新绑定。");
      }
    });
    return refs;
  };
  const shotAssetRefs = new Map();
  for (const [shotId, { value: shot, path }] of shots) {
    number(shot.revision, `${path}.revision`); id(shot.episodeId, `${path}.episodeId`); id(shot.sceneId, `${path}.sceneId`);
    if (!assignedShots.has(shotId)) fail("SHOT_OWNERSHIP", path, "镜头未列入展开集的场次镜号清单。");
    const refs = assetRefs(shot.assets, `${path}.assets`); shotAssetRefs.set(shotId, refs);
    for (const [assetId, revision] of refs) consumers.get(assetId)?.push({ shotId, episodeId: shot.episodeId, sceneId: shot.sceneId, revision });
    const boundCharacters = new Set(), boundAssets = new Set();
    array(shot.characters, `${path}.characters`).forEach((binding, position) => {
      const at = `${path}.characters[${position}]`;
      if (!shape(binding, at, ["characterId", "periodId", "appearanceId"], ["appearanceChanges"])) return;
      let bindingIdsValid = true;
      for (const key of ["characterId", "periodId", "appearanceId"]) if (!id(binding[key], `${at}.${key}`)) bindingIdsValid = false;
      if (!bindingIdsValid) return;
      if (boundCharacters.has(binding.characterId)) fail("DUPLICATE_CHARACTER", at, "同一镜头不能为同一角色指定冲突绑定。");
      boundCharacters.add(binding.characterId);
      const character = characters.get(binding.characterId)?.value;
      if (character) boundAssets.add(character.identityAssetId);
      const period = periods.get(`${binding.characterId}/${binding.periodId}`);
      if (!character || !period || !period.includes(shot.episodeId)) fail("CHARACTER_PERIOD", at, "角色时期不存在或不适用于本集。");
      if (character && !refs.has(character.identityAssetId)) fail("IDENTITY_INPUT", at, "镜头资产消费缺少本角色的稳定身份输入。");
      const checkAppearance = (appearanceId, appearancePath) => {
        const appearance = appearances.get(appearanceId)?.value;
        if (appearance) boundAssets.add(appearanceId);
        if (!appearance || appearance.characterId !== binding.characterId || appearance.periodId !== binding.periodId ||
          !Array.isArray(appearance.episodeIds) || !appearance.episodeIds.includes(shot.episodeId) ||
          (appearance.sceneIds && (!Array.isArray(appearance.sceneIds) || !appearance.sceneIds.includes(shot.sceneId))) ||
          (appearance.shotIds && (!Array.isArray(appearance.shotIds) || !appearance.shotIds.includes(shotId)))) fail("APPEARANCE_SCOPE", appearancePath, "外观与角色、时期或集场镜适用范围不符。");
        if (appearance && !refs.has(appearanceId)) fail("APPEARANCE_INPUT", appearancePath, "镜头资产消费缺少所绑定的起态或变化外观输入。");
      };
      checkAppearance(binding.appearanceId, `${at}.appearanceId`);
      if (binding.appearanceChanges !== undefined) {
        let previousAppearance = binding.appearanceId;
        array(binding.appearanceChanges, `${at}.appearanceChanges`, true).forEach((change, changeIndex) => {
          const changePath = `${at}.appearanceChanges[${changeIndex}]`;
          if (!shape(change, changePath, ["appearanceId", "trigger"])) return;
          const appearanceIdValid = id(change.appearanceId, `${changePath}.appearanceId`); text(change.trigger, `${changePath}.trigger`);
          if (!appearanceIdValid) return;
          if (change.appearanceId === previousAppearance) fail("APPEARANCE_CHANGE", changePath, "变化目标与前一外观相同；请声明实际状态变化或移除此项。");
          checkAppearance(change.appearanceId, `${changePath}.appearanceId`);
          previousAppearance = change.appearanceId;
        });
      }
    });
    for (const assetId of refs.keys()) if (["identity", "appearance"].includes(assets.get(assetId)?.value.role) && !boundAssets.has(assetId)) fail("UNBOUND_CHARACTER_ASSET", `${path}.assets`, "身份／外观资产必须属于本镜已声明的角色绑定。");
  }
  const media = (value, path, timed) => {
    if (!shape(value, path, timed ? ["locator", "totalFrames"] : ["locator"])) return false;
    const locatorValid = text(value.locator, `${path}.locator`);
    return (timed ? number(value.totalFrames, `${path}.totalFrames`) : true) && locatorValid;
  };
  for (const [, { value: group, path }] of groups) {
    const groupShots = ids(group.shotIds, `${path}.shotIds`);
    let previous = -1;
    for (const shotId of groupShots) {
      const position = order.indexOf(shotId);
      if (position < 0) fail("PREVIS_SHOT", `${path}.shotIds`, "预演只能引用本次已展开的原镜号。");
      else if (position <= previous) fail("PREVIS_ORDER", `${path}.shotIds`, "预演镜号必须保留原叙事顺序。");
      previous = position;
    }
    const frameIds = new Set(), mappedShots = [];
    array(group.frames, `${path}.frames`, true).forEach((frame, position) => {
      const at = `${path}.frames[${position}]`;
      if (!shape(frame, at, ["frameId", "shotId"])) return;
      id(frame.frameId, `${at}.frameId`); id(frame.shotId, `${at}.shotId`);
      if (frameIds.has(frame.frameId)) fail("DUPLICATE_FRAME", at, "预演画格 ID 不得重复。");
      frameIds.add(frame.frameId);
      if (mappedShots.at(-1) !== frame.shotId) mappedShots.push(frame.shotId);
    });
    if (JSON.stringify(mappedShots) !== JSON.stringify(groupShots)) fail("PREVIS_MAPPING", `${path}.frames`, "逐格映射须按原镜号顺序覆盖整组；同镜多格须连续排列。");
    if (!["planned", "returned"].includes(group.status)) fail("PREVIS_STATUS", `${path}.status`, "预演状态仅为 planned 或 returned。");
    if (group.status === "planned") {
      if (group.media !== null) fail("PREVIS_STATUS", `${path}.media`, "计划预演不能同时声明已有返回媒体。");
      pending("PREVIS_PENDING_MEDIA", path, "目前只有整组预演计划，空间与眼线仍待画面检查。");
    } else if (group.status === "returned") {
      media(group.media, `${path}.media`, false);
      pending("PREVIS_MEDIA_UNVERIFIED", path, "返回媒体定位是声明，工具没有读取或观看预演。");
    }
  }
  const adoptedShots = new Set(), candidateShots = new Set();
  for (const [, { value: candidate, path }] of candidates) {
    const shotIdValid = id(candidate.shotId, `${path}.shotId`), inputRevisionValid = number(candidate.inputRevision, `${path}.inputRevision`);
    const shot = shots.get(candidate.shotId)?.value;
    candidateShots.add(candidate.shotId);
    if (!shot) fail("CANDIDATE_SHOT", `${path}.shotId`, "候选必须归属已展开的准确镜号。");
    else if (inputRevisionValid && Number.isSafeInteger(shot.revision) && shot.revision > 0) {
      if (candidate.inputRevision > shot.revision) fail("FUTURE_REVISION", `${path}.inputRevision`, "候选输入修订超过当前镜头修订。");
      else if (candidate.inputRevision < shot.revision) pending("STALE_SHOT_INPUT", `${path}.inputRevision`, "候选来自旧镜头输入，须复核后才能重新采用。");
    }
    const inputs = assetRefs(candidate.assetInputs, `${path}.assetInputs`), expected = shotAssetRefs.get(candidate.shotId);
    if (expected) {
      if ([...inputs.keys()].some((assetId) => !expected.has(assetId)) || [...expected.keys()].some((assetId) => !inputs.has(assetId))) {
        if (shotIdValid && inputRevisionValid && Number.isSafeInteger(shot.revision) && candidate.inputRevision < shot.revision) pending("STALE_CANDIDATE_INPUTS", `${path}.assetInputs`, "旧镜头修订的候选保留原输入集合；当前表未提供旧版正文，须复核后重新采用。");
        else fail("CANDIDATE_INPUTS", `${path}.assetInputs`, "同一镜头修订的候选资产输入集合必须与镜头一致；改变集合须先更新镜头方案。");
      }
      for (const [assetId, revision] of inputs) if (expected.has(assetId) && revision !== expected.get(assetId)) pending("CANDIDATE_INPUT_REVISION", `${path}.assetInputs`, "候选与当前镜头消费的资产修订不一致，须复核准确输入。");
    }
    if (typeof candidate.adopted !== "boolean") fail("ADOPTION", `${path}.adopted`, "adopted 必须为布尔值，仅记录调用方的采用声明。");
    const hasMedia = candidate.media !== null && media(candidate.media, `${path}.media`, true);
    pending(candidate.media === null ? "CANDIDATE_PENDING_MEDIA" : "CANDIDATE_MEDIA_UNVERIFIED", path,
      candidate.media === null ? "候选尚无媒体，不能宣称生成或媒体评审完成。" : "媒体定位和帧长是声明，工具未读取或观看媒体。");
    if (candidate.adopted === true) {
      if (adoptedShots.has(candidate.shotId)) fail("ADOPTION", `${path}.adopted`, "同一镜头只能有一个当前采用声明；备选保持未采用。");
      adoptedShots.add(candidate.shotId);
      if (!hasMedia) fail("ADOPTION", `${path}.media`, "没有媒体不能声明已采用。");
      if (shape(candidate.adoptedWindow, `${path}.adoptedWindow`, ["startFrame", "endFrame"])) {
        const window = candidate.adoptedWindow;
        const startValid = number(window.startFrame, `${path}.adoptedWindow.startFrame`, 0), endValid = number(window.endFrame, `${path}.adoptedWindow.endFrame`);
        if (startValid && endValid && (window.startFrame >= window.endFrame || (hasMedia && window.endFrame > candidate.media.totalFrames))) fail("ADOPTED_WINDOW", `${path}.adoptedWindow`, "采用窗口须为媒体总帧内的正时长半开区间。");
      }
    } else if (candidate.adoptedWindow !== null) fail("ADOPTION", `${path}.adoptedWindow`, "未采用的候选不能带当前采用窗口。");
  }
  for (const shotId of shots.keys()) if (!candidateShots.has(shotId)) pending("SHOT_WITHOUT_CANDIDATE", shots.get(shotId).path, "本镜尚无候选回流记录，媒体状态仍待提供。");
  if (shape(workbook.claims, "$.claims", ["allEpisodesExpanded", "mediaComplete"])) {
    if (typeof workbook.claims.allEpisodesExpanded !== "boolean") fail("CLAIM", "$.claims.allEpisodesExpanded", "必须明确是否声称全剧均已展开。");
    if (workbook.claims.allEpisodesExpanded === true && remaining.length) fail("INCOMPLETE_CLAIM", "$.claims.allEpisodesExpanded", "仍有未展开集，不能声称全剧已展开。");
    if (workbook.claims.mediaComplete !== false) fail("MEDIA_CLAIM", "$.claims.mediaComplete", "只读计划检查不能确认媒体完成，mediaComplete 必须为 false。");
  }
  return result(remaining);
}

async function main(args) {
  if (args.length === 1 && args[0] === "--help") {
    console.log("用法：node check-delivery.mjs worksheet.json | --text <准确文本> | --project-workflow <json文件>\n只读交付算术：references/optional/video-sound-and-delivery.md；项目工作表：references/optional/project-workflow.md。");
    return;
  }
  if (args.length === 2 && args[0] === "--text") {
    const counts = countText(args[1]);
    console.log(JSON.stringify({ ...counts, localization: { locale: "zh-CN", hanCharacters: "汉字", codePoints: "Unicode 码点", graphemes: "可见字素簇", summary: "文字计数不是实际语音时长。" } }, null, 2));
    return;
  }
  if (args.length === 2 && args[0] === "--project-workflow") {
    const result = checkProjectWorkflow(parseJsonStrict(await readFile(args[1], "utf8")));
    console.log(JSON.stringify({ ...result, localization: { locale: "zh-CN", summary: !result.valid ? "项目工作表存在矛盾，请修正 errors。" : result.needsReview.length ? "项目引用结构检查通过，剩余范围及媒体仍待复核。" : "项目引用结构检查通过；不证明来源权威或媒体质量。" } }, null, 2));
    process.exitCode = !result.valid ? 1 : result.needsReview.length ? 2 : 0;
    return;
  }
  if (args.length !== 1 || args[0].startsWith("--")) throw new Error("Usage: node check-delivery.mjs worksheet.json | --text <exact text>");
  const result = checkDelivery(parseJsonStrict(await readFile(args[0], "utf8")));
  console.log(JSON.stringify(withChineseDeliverySummary(result), null, 2));
  if (!result.valid) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error("无法完成交付检查，请核对参数、文件和 JSON 内容。原始原因：" + error.message);
    process.exitCode = 1;
  });
}


/** 中文命令行摘要只作展示，原始字段与错误字符串保持兼容。 */
export function withChineseDeliverySummary(result) {
  const explain = (message) => {
    if (message.includes("Han characters")) return "台词汉字数量与预期不一致；原始数量见 detail。";
    if (/gap|overlap|out-of-order/.test(message)) return "存在时间缺口、重叠或顺序错误；检查镜头／字幕边界。";
    if (/duplicate id/.test(message)) return "条目标识符重复。";
    if (/positive duration/.test(message)) return "时间区间必须有正时长。";
    if (/exceeds totalFrames/.test(message)) return "区间超出成片总帧数。";
    if (/cover/.test(message)) return "镜头必须完整且连续覆盖成片区间。";
    if (/millisecond precision/.test(message)) return "字幕时间在毫秒舍入后塌缩为零。";
    return "交付工作表检查失败，请核对原始细节。";
  };
  return { ...result, localization: {
    locale: "zh-CN",
    summary: result.valid ? "剪辑覆盖与字幕算术检查通过，实际声音及画面同步仍未核验。" : "检查未通过，不应使用当前 SRT。",
    errors: result.errors.map((detail) => ({ message: explain(detail), detail })),
    scope: "仅检查硬切镜头覆盖、单字幕轨和文字计数；字数不等于口播时长，不证明可读性、同步、权利或媒体质量。",
  } };
}
