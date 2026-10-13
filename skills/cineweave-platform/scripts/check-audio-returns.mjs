/** Pure checks of declared returned-audio metadata; no file/media access or execution. */
const own = (value, key) => Object.hasOwn(value, key);
const plain = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const record = (value) => plain(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const text = (value) => typeof value === "string" && value.trim().length > 0;
const integer = (value, positive = false) => Number.isSafeInteger(value) && (positive ? value > 0 : value >= 0);
const issue = (code, message, nodeId = null) => ({ code, message, nodeId });
const VIDEO_TYPES = new Set(["video_t2v", "video_i2v", "video_flf", "video_reference", "video_extend", "video_edit"]);
const MEASUREMENT_BASES = new Set(["provider_metadata", "local_probe", "user_supplied"]);
const ceilDiv = (a, b) => (a + b - 1n) / b;
function safeNumber(value) {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("Frame guidance exceeds the safe integer range");
  return Number(value);
}

function validatePairing(pairing, nodes, bindings, errors) {
  const add = (code, message, id = null) => errors.push(issue(code, message, id));
  if (!plain(pairing) || pairing.mode !== "one_audio_per_video_block") {
    add("AUDIO_PAIRING", "Declare one_audio_per_video_block explicitly with ordered nodeIds and bindingIds"); return;
  }
  const scope = pairing.nodeIds, ordered = pairing.bindingIds;
  if (!Array.isArray(scope) || !scope.length || !scope.every(text) || new Set(scope).size !== scope.length
      || scope.some((id) => nodes.filter((node) => plain(node) && node.id === id && VIDEO_TYPES.has(node.type)).length !== 1)) {
    add("AUDIO_PAIRING_SCOPE", "Pairing scope must name unique existing video nodes in its intended order"); return;
  }
  if (!Array.isArray(ordered) || ordered.length !== scope.length || !ordered.every(text)) {
    add("AUDIO_PAIRING_COMPLETENESS", "Each scoped video block needs exactly one ordered adopted narration binding"); return;
  }
  if (new Set(ordered).size !== ordered.length) add("AUDIO_PAIRING_DUPLICATE", "A pairing cannot repeat an adopted binding ID");
  const listed = new Set(ordered), scoped = new Set(scope);
  for (const [index, id] of ordered.entries()) {
    const binding = bindings.get(id);
    if (!binding) { add("AUDIO_PAIRING_BINDING", `Unknown adopted binding ${id}`); continue; }
    if (binding.nodeId !== scope[index]) add("AUDIO_PAIRING_ORDER", `${id} does not belong to ordered block ${scope[index]}`, scope[index]);
    if (binding.track !== "dialogue") add("AUDIO_PAIRING_TRACK", `${id} must refer to narration/dialogue, not an ambient layer`, binding.nodeId);
  }
  for (const binding of bindings.values()) {
    if (scoped.has(binding.nodeId) && binding.track === "dialogue" && !listed.has(binding.id))
      add("AUDIO_PAIRING_COMPLETENESS", `Unlisted adopted spoken binding ${binding.id} in the declared block scope`, binding.nodeId);
  }
}

/** Ranges are half-open. Measurement provenance and authorization remain caller declarations. */
export function validateAudioReturns(book, nodeResults = []) {
  const errors = [], warnings = [], checks = [], bindings = new Map(), returnIds = new Set(), bindingIds = new Set(), mappings = new Set(), sourceDurations = new Map();
  const add = (code, message, id = null) => errors.push(issue(code, message, id));
  const result = () => ({ valid: errors.length === 0, errors, warnings, checks, capabilityVerified: false,
    measurementVerified: false, mediaVerified: false, providerExecution: false });
  if (!record(book) || !Array.isArray(book.nodes)) { add("WORKBOOK", "Returned audio needs a workbook record with a nodes array"); return result(); }
  if (!Array.isArray(nodeResults) || nodeResults.some((item) => !record(item) || !text(item.id))) {
    add("AUDIO_NODE_RESULTS", "Node results must be an array of node records with IDs"); return result();
  }
  const nodes = book.nodes;
  const returns = own(book, "audioReturns") ? book.audioReturns : [];
  if (!Array.isArray(returns)) {
    add("AUDIO_RETURNS", "audioReturns must be an array when supplied");
  } else if (returns.length) {
    warnings.push(issue("AUDIO_MEASUREMENT_UNVERIFIED", "Returned durations, source provenance and authorization are declarations; no waveform, consent or synchronization was verified"));
    const frameRate = book.frameRate;
    const validRate = plain(frameRate) && integer(frameRate.numerator, true) && integer(frameRate.denominator, true);
    if (!validRate) add("AUDIO_FRAME_RATE", "Returned audio needs a positive safe-integer rational frame rate");
    for (const returned of returns) {
      if (!plain(returned) || !text(returned.id)) { add("AUDIO_RETURN_ID", "Each returned source needs an ID"); continue; }
      if (returnIds.has(returned.id)) add("AUDIO_RETURN_ID", `Duplicate returned source ID ${returned.id}`);
      returnIds.add(returned.id);
      const mediaValid = returned.mediaType === "audio" && !own(returned, "useAudioTrack")
        || returned.mediaType === "video" && returned.useAudioTrack === true;
      if (!mediaValid) add("AUDIO_RETURN_MEDIA", `${returned.id} needs audio media or a video with useAudioTrack:true`);
      const sourceValid = ["source", "version", "candidateId"].every((field) => text(returned[field]));
      if (!sourceValid) add("AUDIO_RETURN_SOURCE", `${returned.id} needs exact source, version and candidateId declarations`);
      const durationValid = integer(returned.durationMs, true);
      if (!durationValid) add("AUDIO_RETURN_DURATION", `${returned.id}.durationMs must be positive safe-integer milliseconds`);
      if (sourceValid && mediaValid && durationValid) {
        const identity = JSON.stringify([returned.source, returned.version, returned.candidateId, returned.mediaType, returned.useAudioTrack === true]);
        if (sourceDurations.has(identity) && sourceDurations.get(identity) !== returned.durationMs)
          add("AUDIO_RETURN_CONFLICT", `${returned.id} claims a different total duration for the same exact returned-source identity`);
        else sourceDurations.set(identity, returned.durationMs);
      }
      if (!plain(returned.measurement) || !MEASUREMENT_BASES.has(returned.measurement.basis) || !text(returned.measurement.source))
        add("AUDIO_MEASUREMENT", `${returned.id} needs provider_metadata, local_probe or user_supplied measurement provenance; a planned cue is not a measurement`);
      if (!Array.isArray(returned.bindings) || !returned.bindings.length) {
        add("AUDIO_BINDINGS", `${returned.id} needs explicit adopted source-to-cue bindings`); continue;
      }
      for (const binding of returned.bindings) {
        if (!plain(binding) || !text(binding.id)) { add("AUDIO_BINDING_ID", `${returned.id} contains a binding without an ID`); continue; }
        const nodeId = text(binding.nodeId) ? binding.nodeId : null;
        if (bindingIds.has(binding.id)) add("AUDIO_BINDING_ID", `Duplicate adopted binding ID ${binding.id}`, nodeId);
        bindingIds.add(binding.id);
        const matchingNodes = nodes.filter((node) => plain(node) && node.id === binding.nodeId);
        if (matchingNodes.length !== 1) { add("AUDIO_NODE_BINDING", `${binding.id} must resolve one exact node`, nodeId); continue; }
        const node = matchingNodes[0], matchingCues = Array.isArray(node.cues) ? node.cues.filter((cue) => plain(cue) && cue.id === binding.cueId) : [];
        if (matchingCues.length !== 1) { add("AUDIO_CUE_BINDING", `${binding.id} must resolve one cue inside ${nodeId}`, nodeId); continue; }
        const cue = matchingCues[0];
        if (!["dialogue", "sound"].includes(cue.track)) { add("AUDIO_CUE_TRACK", `${binding.id} needs a dialogue or sound cue`, nodeId); continue; }
        if (!integer(cue.startFrame) || !integer(cue.endFrame, true) || cue.endFrame <= cue.startFrame) {
          add("AUDIO_CUE_BINDING", `${binding.id} needs a valid half-open adopted cue window`, nodeId); continue;
        }
        if (!bindings.has(binding.id)) bindings.set(binding.id, { id: binding.id, nodeId, cueId: cue.id, track: cue.track });
        const range = binding.sourceRangeMs;
        const rangeValid = durationValid && plain(range) && integer(range.start) && integer(range.end, true)
          && range.end > range.start && range.end <= returned.durationMs;
        if (!rangeValid) { add("AUDIO_SOURCE_RANGE", `${binding.id} needs a positive half-open range inside the declared returned duration`, nodeId); continue; }
        if (!["full", "excerpt", "loop"].includes(binding.usage)) { add("AUDIO_USAGE", `${binding.id} needs full, excerpt or loop use`, nodeId); continue; }
        if (binding.usage === "full" && (range.start !== 0 || range.end !== returned.durationMs))
          add("AUDIO_FULL_RANGE", `${binding.id} full use must retain [0,durationMs); declare any excerpt explicitly`, nodeId);
        if (cue.track === "dialogue" && binding.usage === "loop") add("AUDIO_DIALOGUE_LOOP", `${binding.id} cannot loop spoken dialogue`, nodeId);
        if (cue.track === "dialogue" && binding.usage === "excerpt") {
          const authorization = binding.dialogueExcerptAuthorization;
          if (!plain(authorization) || !text(authorization.approvedBy) || !text(authorization.reason))
            add("AUDIO_DIALOGUE_EXCERPT", `${binding.id} needs explicit scoped dialogue excerpt authorization`, nodeId);
        }
        const sync = binding.sync;
        if (!plain(sync) || !integer(sync.sourceMs) || !integer(sync.targetFrame)
            || sync.sourceMs < range.start || sync.sourceMs >= range.end || sync.targetFrame < cue.startFrame || sync.targetFrame >= cue.endFrame) {
          add("AUDIO_SYNC", `${binding.id} sync anchors must be inside the half-open selected source and cue windows`, nodeId); continue;
        }
        if (sourceValid) {
          const mapping = JSON.stringify([returned.source, returned.version, returned.candidateId, returned.mediaType, returned.useAudioTrack === true,
            nodeId, cue.id, range.start, range.end, binding.usage, sync.sourceMs, sync.targetFrame]);
          if (mappings.has(mapping)) add("AUDIO_DUPLICATE_BINDING", `${binding.id} repeats an identical adopted source mapping`, nodeId);
          mappings.add(mapping);
        }
        if (!validRate) continue;
        try {
          const n = BigInt(frameRate.numerator), frameUnits = BigInt(frameRate.denominator) * 1000n;
          const requiredFrames = safeNumber(ceilDiv(BigInt(range.end - range.start) * n, frameUnits));
          const availableFrames = cue.endFrame - cue.startFrame;
          // One unit is 1/(numerator*1000) seconds. No intermediate ms/frame rounding.
          const mappedStart = BigInt(sync.targetFrame) * frameUnits + BigInt(range.start - sync.sourceMs) * n;
          const mappedEnd = BigInt(sync.targetFrame) * frameUnits + BigInt(range.end - sync.sourceMs) * n;
          const durationFits = BigInt(range.end - range.start) * n <= BigInt(availableFrames) * frameUnits;
          let fits = true;
          if (binding.usage !== "loop") {
            if (!durationFits) { add("AUDIO_DURATION_FIT", `${binding.id} returned selection exceeds its adopted cue; revise the window instead of accelerating or cutting speech`, nodeId); fits = false; }
            if (mappedStart < BigInt(cue.startFrame) * frameUnits || mappedEnd > BigInt(cue.endFrame) * frameUnits) {
              add("AUDIO_SYNC_WINDOW", `${binding.id} declared sync placement crosses its adopted cue boundary`, nodeId); fits = false;
            }
          }
          const timing = nodeResults.find((item) => item.id === nodeId)?.timing;
          if (timing?.valid && Array.isArray(timing.editWindow) && cue.allowHandle !== true) {
            const [start, end] = binding.usage === "loop" ? [BigInt(cue.startFrame) * frameUnits, BigInt(cue.endFrame) * frameUnits] : [mappedStart, mappedEnd];
            if (start < BigInt(timing.editWindow[0]) * frameUnits || end > BigInt(timing.editWindow[1]) * frameUnits) {
              add("AUDIO_SYNC_WINDOW", `${binding.id} crosses the adopted edit window without a declared sound bridge/handle`, nodeId); fits = false;
            }
          }
          checks.push({ returnId: returned.id, bindingId: binding.id, nodeId, cueId: cue.id, usage: binding.usage,
            requiredFrames, availableFrames, fitsDeclaredWindow: fits, measurementVerified: false });
        } catch (error) { add("AUDIO_ARITHMETIC", error.message, nodeId); }
      }
    }
  }
  if (own(book, "audioPairing")) validatePairing(book.audioPairing, nodes, bindings, errors);
  return result();
}
