import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { FORMAT, NODE_TAGS, validateVideoWorkbook }
  from "../skills/cineweave-director/scripts/check-video-plan.mjs";
import { validateAudioReturns } from "../skills/cineweave-director/scripts/check-audio-returns.mjs";

const evaluationDate = "2026-10-12";
const dialogue = "这盏灯，你拿着。";
function videoNode(id = "V1", cueId = "D1", track = "dialogue") {
  const scope = { platform: "fixture", model: "fixture", surface: "fixture", mode: "t2v" };
  const tags = [...new Set(["节点", "目标", "约束", ...NODE_TAGS.video_t2v])];
  const prompt = tags.map((tag) => `<${tag}>${tag === "节点" ? id : "固定机位，准确台词"}</${tag}>`).join("\n")
    + (track === "dialogue" ? `\n<台词>${dialogue}</台词>` : "");
  const cue = { id: cueId, track, startFrame: 0, endFrame: 96 };
  if (track === "dialogue") Object.assign(cue, {
    speaker: "A", text: dialogue, authoritativeText: dialogue, delivery: "voiceover",
  });
  return { id, type: "video_t2v", prompt, dependsOn: [], references: [],
    timing: { headFrames: 0, editFrames: 120, tailFrames: 0 },
    capability: { ...scope, status: "documented", evidence: "fixture:not-external-evidence", checkedAt: "2026-10-11" },
    durationPolicy: { scope, status: "fixture", source: "fixture:duration-policy", checkedAt: "2026-10-11", allowedMs: [5000] },
    referenceLimits: { scope, status: "fixture", source: "fixture:reference-policy", checkedAt: "2026-10-11", caps: { total: 0 } },
    cues: [cue],
  };
}
function workbook() { return { format: FORMAT, frameRate: { numerator: 24, denominator: 1 }, nodes: [videoNode()] }; }
function audioReturn(overrides = {}) {
  return { id: "AR1", mediaType: "audio", source: "fixture:return.wav", version: "v1", candidateId: "take-A",
    durationMs: 4000, measurement: { basis: "user_supplied", source: "fixture:declared duration; waveform unverified" },
    bindings: [{ id: "AB1", nodeId: "V1", cueId: "D1", sourceRangeMs: { start: 0, end: 4000 },
      usage: "full", sync: { sourceMs: 0, targetFrame: 0 } }], ...overrides };
}
function withReturn() { const book = workbook(); book.audioReturns = [audioReturn()]; return book; }
function check(book, options = { evaluationDate }) { return validateVideoWorkbook(book, options); }
const codes = (result) => result.errors.map((entry) => entry.code);
function reject(name, mutate, code) {
  test(name, () => { const book = withReturn(); mutate(book); const result = check(book);
    assert.equal(result.valid, false); assert.ok(codes(result).includes(code), JSON.stringify(result.errors)); });
}

test("invalid optional evaluation contexts produce diagnostics instead of throwing", () => {
  for (const options of [null, [], "2026-10-12", 12, true, new Date(0)]) {
    let result; assert.doesNotThrow(() => { result = validateVideoWorkbook(workbook(), options); });
    assert.equal(result.valid, false); assert.ok(codes(result).includes("EVALUATION_OPTIONS"));
    assert.equal(result.measurementVerified, false); assert.equal(result.mediaVerified, false);
  }
  let result; assert.doesNotThrow(() => { result = validateVideoWorkbook(null, null); });
  assert.ok(codes(result).includes("WORKBOOK")); assert.ok(codes(result).includes("EVALUATION_OPTIONS"));
});
test("the pure returned-audio helper rejects invalid workbook inputs without throwing", () => {
  for (const book of [null, undefined, [], "book", { nodes: null }]) {
    let result; assert.doesNotThrow(() => { result = validateAudioReturns(book); });
    assert.ok(codes(result).includes("WORKBOOK")); assert.equal(result.measurementVerified, false); assert.equal(result.mediaVerified, false);
  }
});
test("the pure returned-audio helper rejects malformed node results without throwing", () => {
  for (const nodeResults of [null, {}, [null], ["node"]]) {
    let result; assert.doesNotThrow(() => { result = validateAudioReturns(withReturn(), nodeResults); });
    assert.ok(codes(result).includes("AUDIO_NODE_RESULTS")); assert.equal(result.measurementVerified, false); assert.equal(result.mediaVerified, false);
  }
});

test("an omitted evaluation date warns without changing the legacy completed declaration", () => {
  const result = validateVideoWorkbook(workbook());
  assert.equal(result.valid, true); assert.equal(result.declarationComplete, true);
  assert.ok(result.warnings.some((item) => item.code === "DATE_COMPARISON_UNVERIFIED"));
  assert.equal(result.pending.length, 0); assert.equal(result.capabilityVerified, false);
});
test("explicit invalid evaluation calendar dates are rejected", () => {
  for (const value of ["2026-02-29", "1900-02-29", "2026-04-31", "0000-01-01", "2026-1-01", "tomorrow", 20261012, null]) {
    const result = check(workbook(), { evaluationDate: value });
    assert.equal(result.valid, false, String(value)); assert.ok(codes(result).includes("EVALUATION_DATE"));
  }
});
test("each checkedAt declaration is compared against the caller's evaluation date", () => {
  for (const field of ["capability", "durationPolicy", "referenceLimits"]) {
    const book = workbook(); book.nodes[0][field].checkedAt = "2026-10-13";
    const result = check(book); assert.equal(result.valid, false, field);
    assert.ok(codes(result).includes("FUTURE_CHECK_DATE"), field);
  }
});
test("old declarations never autoexpire and explicit equality is allowed", () => {
  for (const value of ["2000-02-29", evaluationDate]) {
    const book = workbook();
    for (const field of ["capability", "durationPolicy", "referenceLimits"]) book.nodes[0][field].checkedAt = value;
    const result = check(book); assert.equal(result.valid, true); assert.equal(result.declarationComplete, true);
    assert.equal(result.capabilityVerified, false);
  }
});
test("explicit model-version mismatches cannot reuse a policy from another version", () => {
  for (const [field, expected] of [["durationPolicy", "DURATION_VERSION_MISMATCH"], ["referenceLimits", "REFERENCE_VERSION_MISMATCH"]]) {
    const book = workbook(); book.nodes[0].capability.modelVersion = "v1"; book.nodes[0][field].scope.modelVersion = "v2";
    const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes(expected));
  }
});
test("matching explicit model versions remain declarations and preserve completed fixtures", () => {
  const book = workbook(), node = book.nodes[0]; node.capability.modelVersion = "v1";
  for (const field of ["durationPolicy", "referenceLimits"]) node[field].scope.modelVersion = "v1";
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.declarationComplete, true);
  assert.equal(result.capabilityVerified, false);
});
test("one-sided model versions warn without inferring the missing version or adding pending", () => {
  for (const side of ["capability", "durationPolicy", "referenceLimits"]) {
    const book = workbook(), node = book.nodes[0];
    if (side === "capability") node.capability.modelVersion = "v1";
    else node[side].scope.modelVersion = "v1";
    const result = check(book); assert.equal(result.valid, true); assert.equal(result.declarationComplete, true);
    assert.ok(result.warnings.some((item) => item.code === "VERSION_COMPARISON_UNVERIFIED")); assert.equal(result.pending.length, 0);
  }
});
test("malformed supplied model versions produce structured diagnostics", () => {
  for (const field of ["capability", "durationPolicy", "referenceLimits"]) for (const value of [null, "", "   ", 1]) {
    const book = workbook(), node = book.nodes[0];
    if (field === "capability") node.capability.modelVersion = value; else node[field].scope.modelVersion = value;
    const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("MODEL_VERSION_INVALID"));
  }
});
test("a missing evaluation date never compares against a hidden system clock", () => {
  const book = workbook();
  for (const field of ["capability", "durationPolicy", "referenceLimits"]) book.nodes[0][field].checkedAt = "3000-01-01";
  const result = validateVideoWorkbook(book);
  assert.equal(result.valid, true); assert.equal(result.declarationComplete, true);
  assert.ok(result.warnings.some((item) => item.code === "DATE_COMPARISON_UNVERIFIED"));
});
test("the video CLI accepts an explicit evaluation date while preserving its input", () => {
  const directory = mkdtempSync(join(tmpdir(), "cw-video-return-"));
  try {
    const input = join(directory, "book.json"), before = JSON.stringify(workbook());
    writeFileSync(input, before);
    const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-video-plan.mjs", import.meta.url));
    const run = spawnSync(process.execPath, [cli, input, "--evaluation-date", evaluationDate], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr); assert.equal(JSON.parse(run.stdout).valid, true);
    assert.equal(readFileSync(input, "utf8"), before);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("declared returned duration yields frame guidance without verifying the measurement or media", () => {
  const book = withReturn(), before = structuredClone(book), result = check(book);
  assert.equal(result.valid, true); assert.equal(result.measurementVerified, false);
  assert.equal(result.mediaVerified, false); assert.equal(result.capabilityVerified, false);
  assert.ok(result.warnings.some((item) => item.code === "SPEECH_TIMING_UNVERIFIED"));
  assert.equal(result.audioReturnChecks?.[0]?.requiredFrames, 96);
  assert.equal(result.audioReturnChecks?.[0]?.availableFrames, 96);
  assert.equal(result.audioReturnChecks?.[0]?.fitsDeclaredWindow, true);
  assert.deepEqual(book, before);
});
reject("a spoken take longer than its adopted cue is rejected instead of sped up", (book) => {
  book.audioReturns[0].durationMs = 4001; book.audioReturns[0].bindings[0].sourceRangeMs.end = 4001;
}, "AUDIO_DURATION_FIT");
test("an overlong declared take proposes the minimum frame count without changing the cue or text", () => {
  const book = withReturn(); book.audioReturns[0].durationMs = 4001;
  book.audioReturns[0].bindings[0].sourceRangeMs.end = 4001;
  const before = structuredClone(book), result = check(book);
  assert.equal(result.audioReturnChecks?.[0]?.requiredFrames, 97); assert.equal(result.valid, false);
  assert.deepEqual(book, before);
});
test("returned duration fit uses exact rational fps at the one-millisecond boundary", () => {
  const book = withReturn(); book.frameRate = { numerator: 30000, denominator: 1001 };
  book.nodes[0].cues[0].endFrame = 120; book.nodes[0].timing.editFrames = 150;
  book.nodes[0].durationPolicy.allowedMs = [6000];
  book.audioReturns[0].durationMs = 4004; book.audioReturns[0].bindings[0].sourceRangeMs.end = 4004;
  const exact = check(book); assert.equal(exact.valid, true); assert.equal(exact.audioReturnChecks?.[0]?.requiredFrames, 120);
  book.audioReturns[0].durationMs = 4005; book.audioReturns[0].bindings[0].sourceRangeMs.end = 4005;
  const over = check(book); assert.equal(over.valid, false); assert.ok(codes(over).includes("AUDIO_DURATION_FIT"));
  assert.equal(over.audioReturnChecks?.[0]?.requiredFrames, 121);
});
reject("a planned cue window cannot masquerade as a measured returned duration", (book) => {
  book.audioReturns[0].measurement.basis = "planned_cue";
}, "AUDIO_MEASUREMENT");
reject("a returned duration needs declared measurement provenance", (book) => {
  delete book.audioReturns[0].measurement;
}, "AUDIO_MEASUREMENT");
test("provider, local probe and user duration declarations all remain measurement-unverified", () => {
  for (const basis of ["provider_metadata", "local_probe", "user_supplied"]) {
    const book = withReturn(); book.audioReturns[0].measurement.basis = basis;
    const result = check(book); assert.equal(result.valid, true); assert.equal(result.measurementVerified, false);
  }
});
reject("an output video needs an explicit usable audio-track declaration", (book) => {
  book.audioReturns[0].mediaType = "video";
}, "AUDIO_RETURN_MEDIA");
test("an explicitly scoped returned video audio track is a permitted declaration", () => {
  const book = withReturn(); book.audioReturns[0].mediaType = "video"; book.audioReturns[0].useAudioTrack = true;
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.measurementVerified, false);
});
reject("returned sources need source, version and candidate identity", (book) => {
  delete book.audioReturns[0].candidateId;
}, "AUDIO_RETURN_SOURCE");
test("returned duration declarations require positive safe integer milliseconds", () => {
  for (const value of [0, -1, 4000.5, "4000", Number.MAX_SAFE_INTEGER + 1]) {
    const book = withReturn(); book.audioReturns[0].durationMs = value;
    const result = check(book); assert.equal(result.valid, false, String(value));
    assert.ok(codes(result).includes("AUDIO_RETURN_DURATION"));
  }
});
reject("full use cannot silently narrow the selected source interval", (book) => {
  const binding = book.audioReturns[0].bindings[0]; binding.sourceRangeMs.start = 1000; binding.sync.sourceMs = 1000;
}, "AUDIO_FULL_RANGE");
reject("a returned source interval cannot exceed its declared duration", (book) => {
  book.audioReturns[0].bindings[0].sourceRangeMs.end = 4001;
}, "AUDIO_SOURCE_RANGE");
reject("a returned source interval is half-open and must have positive length", (book) => {
  book.audioReturns[0].bindings[0].sourceRangeMs.end = 0;
}, "AUDIO_SOURCE_RANGE");
reject("returned bindings must resolve an existing node", (book) => {
  book.audioReturns[0].bindings[0].nodeId = "ghost";
}, "AUDIO_NODE_BINDING");
reject("returned bindings must resolve the cue within that exact node", (book) => {
  book.audioReturns[0].bindings[0].cueId = "ghost";
}, "AUDIO_CUE_BINDING");
reject("returned audio cannot bind to a picture action cue", (book) => {
  book.nodes[0].cues[0].track = "subject";
}, "AUDIO_CUE_TRACK");
reject("sync source anchors cannot lie at the excluded source end", (book) => {
  book.audioReturns[0].bindings[0].sync.sourceMs = 4000;
}, "AUDIO_SYNC");
reject("sync target anchors cannot lie at the excluded cue end", (book) => {
  book.audioReturns[0].bindings[0].sync.targetFrame = 96;
}, "AUDIO_SYNC");
reject("sync anchor placement cannot move the returned selection outside the cue", (book) => {
  book.audioReturns[0].bindings[0].sync.sourceMs = 1000;
}, "AUDIO_SYNC_WINDOW");
test("matching interior sync anchors retain the exact full source placement", () => {
  const book = withReturn(); book.audioReturns[0].bindings[0].sync = { sourceMs: 1000, targetFrame: 24 };
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.[0]?.fitsDeclaredWindow, true);
});
test("an explicitly scoped sound bridge can use declared generation handles", () => {
  const book = withReturn(), node = book.nodes[0]; node.cues[0].allowHandle = true;
  node.timing = { headFrames: 24, editFrames: 96, tailFrames: 0 };
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.[0]?.fitsDeclaredWindow, true);
});
reject("return IDs are unique across declared returned sources", (book) => {
  book.audioReturns.push(structuredClone(book.audioReturns[0]));
}, "AUDIO_RETURN_ID");
reject("binding IDs are unique across adopted source mappings", (book) => {
  book.audioReturns[0].bindings.push(structuredClone(book.audioReturns[0].bindings[0]));
}, "AUDIO_BINDING_ID");
reject("an identical adopted mapping cannot be repeated under a different binding ID", (book) => {
  book.audioReturns[0].bindings.push({ ...structuredClone(book.audioReturns[0].bindings[0]), id: "AB2" });
}, "AUDIO_DUPLICATE_BINDING");
reject("new return and binding IDs cannot disguise an identical adopted source mapping", (book) => {
  const duplicate = structuredClone(book.audioReturns[0]); duplicate.id = "AR2"; duplicate.bindings[0].id = "AB2";
  book.audioReturns.push(duplicate);
}, "AUDIO_DUPLICATE_BINDING");
reject("spoken excerpts require explicit scoped authorization", (book) => {
  const binding = book.audioReturns[0].bindings[0]; binding.usage = "excerpt";
  binding.sourceRangeMs = { start: 1000, end: 3000 }; binding.sync.sourceMs = 1000;
}, "AUDIO_DIALOGUE_EXCERPT");
test("a declared authorized spoken excerpt stays metadata-only and preserves exact dialogue", () => {
  const book = withReturn(), binding = book.audioReturns[0].bindings[0]; binding.usage = "excerpt";
  binding.sourceRangeMs = { start: 1000, end: 3000 }; binding.sync.sourceMs = 1000;
  binding.dialogueExcerptAuthorization = { approvedBy: "user-declared", reason: "Explicitly adopted source excerpt for this cue" };
  const before = structuredClone(book), result = check(book);
  assert.equal(result.valid, true); assert.equal(result.measurementVerified, false); assert.deepEqual(book, before);
  assert.ok(result.warnings.some((item) => item.code === "SPEECH_TIMING_UNVERIFIED"));
});
reject("spoken dialogue cannot be looped to fill its cue", (book) => {
  book.audioReturns[0].bindings[0].usage = "loop";
}, "AUDIO_DIALOGUE_LOOP");
test("ambient excerpts and explicit loops are allowed without speech-cropping authority", () => {
  for (const usage of ["excerpt", "loop"]) {
    const book = withReturn(); book.nodes[0] = videoNode("V1", "D1", "sound");
    const binding = book.audioReturns[0].bindings[0]; binding.usage = usage;
    binding.sourceRangeMs = { start: 0, end: 500 };
    assert.equal(check(book).valid, true, usage);
  }
});
test("an explicit ambient loop may begin at an interior declared source phase", () => {
  const book = withReturn(); book.nodes[0] = videoNode("V1", "D1", "sound");
  const binding = book.audioReturns[0].bindings[0]; binding.usage = "loop";
  binding.sourceRangeMs = { start: 0, end: 500 }; binding.sync.sourceMs = 250;
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.[0]?.fitsDeclaredWindow, true);
});
reject("optional returned-audio data must be an array when supplied", (book) => {
  book.audioReturns = null;
}, "AUDIO_RETURNS");
test("a shared returned clip can explicitly map to multiple cues without a universal asset ban", () => {
  const book = withReturn(); book.nodes.push(videoNode("V2", "D2"));
  book.audioReturns[0].bindings.push({ ...structuredClone(book.audioReturns[0].bindings[0]), id: "AB2", nodeId: "V2", cueId: "D2" });
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.length, 2);
});
test("the same immutable returned source cannot claim conflicting total durations", () => {
  const book = withReturn(); book.nodes.push(videoNode("V2", "D2"));
  const other = structuredClone(book.audioReturns[0]); other.id = "AR2"; other.durationMs = 3000;
  Object.assign(other.bindings[0], { id: "AB2", nodeId: "V2", cueId: "D2", sourceRangeMs: { start: 0, end: 3000 } });
  book.audioReturns.push(other); const result = check(book);
  assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_RETURN_CONFLICT"));
});
test("consistent metadata may repeat an immutable source identity for explicit distinct cues", () => {
  const book = withReturn(); book.nodes.push(videoNode("V2", "D2"));
  const other = structuredClone(book.audioReturns[0]); other.id = "AR2";
  Object.assign(other.bindings[0], { id: "AB2", nodeId: "V2", cueId: "D2" }); book.audioReturns.push(other);
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.length, 2);
  assert.equal(result.measurementVerified, false); assert.equal(result.mediaVerified, false);
});
test("ordinary workbooks do not require an audio return for every video node", () => {
  const book = withReturn(); book.nodes.push(videoNode("V2", "D2"));
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.length, 1);
});
test("input audio reference declarations never imply that output audio was returned", () => {
  const book = workbook(), node = book.nodes[0]; node.type = "video_reference";
  node.prompt = [...new Set(["节点", "目标", "约束", ...NODE_TAGS.video_reference])]
    .map((tag) => `<${tag}>${tag === "节点" ? node.id : "参考只提供声线"}</${tag}>`).join("\n") + `\n<台词>${dialogue}</台词>`;
  for (const field of ["capability", "durationPolicy", "referenceLimits"]) {
    if (field === "capability") node[field].mode = "multimodal";
    else node[field].scope.mode = "multimodal";
  }
  node.referenceLimits.caps = { audio: 1, total: 1 };
  node.references = [{ alias: "VOICE", mediaType: "audio", roles: ["voice"], source: "fixture:reference.wav", version: "v1",
    status: "bound", transfer: "voice only", exclude: "spoken content and timing" }];
  const result = check(book); assert.equal(result.valid, true); assert.deepEqual(result.audioReturnChecks, []);
  assert.equal(result.measurementVerified, false); assert.equal(result.mediaVerified, false);
});

function pairedBook() {
  const book = withReturn(); book.nodes.push(videoNode("V2", "D2"));
  book.audioReturns[0].bindings.push({ ...structuredClone(book.audioReturns[0].bindings[0]), id: "AB2", nodeId: "V2", cueId: "D2" });
  book.audioPairing = { mode: "one_audio_per_video_block", nodeIds: ["V1", "V2"], bindingIds: ["AB1", "AB2"] };
  return book;
}
test("explicit block pairing enforces ordered completeness inside its declared scope", () => {
  const book = pairedBook(); book.audioPairing.bindingIds.pop();
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_COMPLETENESS"));
});
test("explicit block pairing rejects a binding assigned to the wrong declared block", () => {
  const book = pairedBook(); book.audioPairing.bindingIds.reverse();
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_ORDER"));
});
test("declared pairing scope order is authoritative and independent of ordinary node array order", () => {
  const book = pairedBook(); book.audioPairing.nodeIds.reverse(); book.audioPairing.bindingIds.reverse();
  const result = check(book); assert.equal(result.valid, true); assert.equal(result.measurementVerified, false);
});
test("explicit block pairing cannot reuse a binding ID twice", () => {
  const book = pairedBook(); book.audioPairing.bindingIds[1] = "AB1";
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_DUPLICATE"));
});
test("explicit block pairing cannot name an absent adopted binding", () => {
  const book = pairedBook(); book.audioPairing.bindingIds[1] = "ghost";
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_BINDING"));
});
test("explicit block pairing cannot repeat or invent a scope node", () => {
  for (const nodeIds of [["V1", "V1"], ["V1", "ghost"]]) {
    const book = pairedBook(); book.audioPairing.nodeIds = nodeIds;
    const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_SCOPE"));
  }
});
test("explicit narration block pairing rejects an ambient binding as its narration", () => {
  const book = pairedBook(); book.nodes[1].cues[0].track = "sound";
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_TRACK"));
});
test("explicit narration block scope cannot hide a second adopted spoken binding", () => {
  const book = pairedBook(), second = structuredClone(book.nodes[0].cues[0]);
  second.id = "D3"; second.startFrame = 96; second.endFrame = 120; book.nodes[0].cues.push(second);
  const extra = audioReturn({ id: "AR2", source: "fixture:second.wav", candidateId: "take-B", durationMs: 1000 });
  extra.bindings = [{ id: "AB3", nodeId: "V1", cueId: "D3", sourceRangeMs: { start: 0, end: 1000 },
    usage: "full", sync: { sourceMs: 0, targetFrame: 96 } }];
  book.audioReturns.push(extra);
  const result = check(book); assert.equal(result.valid, false); assert.ok(codes(result).includes("AUDIO_PAIRING_COMPLETENESS"));
});
test("explicit narration block pairing still allows a shared ambient layer", () => {
  const book = pairedBook();
  for (const node of book.nodes) node.cues.push({ id: "BG", track: "sound", startFrame: 0, endFrame: 120 });
  const bg = audioReturn({ id: "BG", source: "fixture:ambience.wav", candidateId: "bg-A", durationMs: 1000 });
  bg.bindings = book.nodes.map((node, index) => ({ id: `BG${index}`, nodeId: node.id, cueId: "BG",
    sourceRangeMs: { start: 0, end: 1000 }, usage: "loop", sync: { sourceMs: 0, targetFrame: 0 } }));
  book.audioReturns.push(bg); const result = check(book);
  assert.equal(result.valid, true); assert.equal(result.audioReturnChecks?.length, 4); assert.equal(result.measurementVerified, false);
});
