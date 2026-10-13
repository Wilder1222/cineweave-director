// 只读审计复现；输出结果，不修改夹具、不调用供应商。
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validatePayload } from "../../scripts/validate-output.mjs";
import { canonicalize, sha256Canonical } from "../../scripts/canonical-json.mjs";

const root = new URL("../../skills/cineweave-director/resources/contracts/", import.meta.url);
const load = async (stem) => JSON.parse(await readFile(new URL(`examples/${stem}.json`, root), "utf8"));
const schema = (stem) => fileURLToPath(new URL(`schemas/${stem}.schema.json`, root));
const results = [];

async function probe(stem, label, change, expectedAfterRefactor, mutate, options = {}) {
  const fixture = await load(stem);
  const payload = structuredClone(fixture);
  mutate(payload);
  const snapshot = canonicalize({ payload, options });
  const result = await validatePayload(schema(stem), payload, options);
  results.push({ stem, label, change, fixtureHash: sha256Canonical(fixture),
    valid: result.valid, errors: result.errors, unverified: result.unverified,
    inputUnchanged: snapshot === canonicalize({ payload, options }), expectedAfterRefactor });
}

for (const stem of ["temporal-spec", "sequence-rhythm-spec", "prompt-projection-plan", "capability-profile", "capability-resolution-plan"]) {
  await probe(stem, "baseline", "规范模拟夹具未修改", "valid", () => {});
}
await probe("temporal-spec", "old_out_of_duration", "动作事件超出镜头时长", "invalid", (p) => { p.actionTimeline[0].timeSeconds = p.durationSeconds + 1; });
await probe("sequence-rhythm-spec", "old_reversed_window", "窗口起帧大于止帧", "invalid", (p) => { p.shotWindows[0].startFrame = p.shotWindows[0].endFrame + 1; });
await probe("prompt-projection-plan", "copy_text_diverges", "仅把 copyText 改成另一人物和场景", "invalid", (p) => { p.renderedPrompt.copyText = "一个完全不同的人站在沙漠中。"; });
await probe("prompt-projection-plan", "token_value_diverges", "--ar 的 value 保持 16:9，rendered 改成 --ar 1:1", "invalid", (p) => { p.parameterTokens[1].rendered = "--ar 1:1"; });
await probe("prompt-projection-plan", "duplicate_parameter", "追加相同参数对象，重复 ID、order 和 name", "invalid", (p) => { p.parameterTokens.push({ ...p.parameterTokens[1] }); });
await probe("prompt-projection-plan", "undeclared_placeholder", "renderedPrompt 声明未绑定的占位符", "invalid", (p) => { p.renderedPrompt.referencePlaceholders = ["REF_UNDECLARED_ASSET"]; });
await probe("prompt-projection-plan", "unbound_source_hash", "sourcePromptRef 使用未绑定的全零哈希", "valid_with_unverified_context", (p) => { p.sourcePromptRef.contentHash = "sha256:" + "0".repeat(64); });
await probe("prompt-projection-plan", "malformed_context", "artifacts 传入字符串", "invalid", () => {}, { artifacts: "not-an-array" });

const profile = await load("capability-profile");
profile.profileId = "capability.profile-a";
const ref = { kind: profile.kind, id: profile.profileId, version: profile.version, contentHash: sha256Canonical(profile) };
await probe("capability-resolution-plan", "exact_profile_partial_but_selected_strong", "精确档案 identity_consistency=partial，选择结果改成 strong/pass/selected", "invalid", (p) => {
  p.candidates[0].capabilityProfileRef = ref;
  p.candidates[0].capabilityResults[0].support = "strong";
  p.candidates[0].capabilityResults[0].status = "pass";
  p.candidates[0].status = "selected";
  p.status = "selected";
  p.selection = { ...p.selection, status: "selected", selectedCandidateId: p.candidates[0].candidateId, selectedCapabilityProfileRef: ref };
}, { artifacts: [{ ref, document: profile }] });
results.at(-1).profileSupport = profile.capabilities.find((entry) => entry.capabilityId === "identity_consistency").support;

for (const stem of ["cinematic-skill-manifest", "shot-compiler-plan"]) {
  await probe(stem, "baseline", "规范模拟夹具未修改", "valid", () => {});
}
const manifest = await load("cinematic-skill-manifest");
const manifestRef = { kind: manifest.kind, id: manifest.cinematicSkillManifestId, version: manifest.version, contentHash: sha256Canonical(manifest) };
await probe("shot-compiler-plan", "unknown_manifest_skill", "精确 manifest 上下文中不存在所选 skillId", "invalid", (p) => {
  p.cinematicSkillManifestRef = manifestRef;
  p.skillSelection.skillId = "does-not-exist";
}, { artifacts: [{ ref: manifestRef, document: manifest }] });
await probe("shot-compiler-plan", "manifest_parameter_out_of_range", "参数和控制面同改为 900；manifest 范围仍为 0..1", "invalid", (p) => {
  p.cinematicSkillManifestRef = manifestRef;
  p.parameterValues[0].value = 900;
  p.controlSurface.groups[0].controls[0].value = 900;
}, { artifacts: [{ ref: manifestRef, document: manifest }] });

console.log(JSON.stringify({ format: "cineweave-higgsfield-source-audit", researchDate: "2026-10-11",
  baselineCommit: "0e476a7e96e43980bbfe8388c446c3f78fd06019",
  externalSkillsCommit: "f83af0bc1d937c8119099a11f8ebbf5e6fb99819",
  externalCliCommit: "dc7e2d2eac0b1fdad255de24d87552d1ba479037",
  scope: "结构与声明一致性的内存反例；夹具中的模型、批准、回执和能力不是当前真实平台证据。",
  providerInvoked: false, mediaGenerated: false, externalCodeExecuted: false,
  results }, null, 2));
