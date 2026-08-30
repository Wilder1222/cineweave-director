import { readFile, stat } from "node:fs/promises";
import { basename, resolve, sep } from "node:path";
import {
  findArtifact,
  findArtifactByVersion,
  listArtifacts,
  putArtifact
} from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Bytes, sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, HASH_PATTERN, IDENTIFIER_PATTERN, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";
import { verifyProductionExecutionRequest } from "./production-execution.mjs";

/**
 * MediaImport is an intentionally small callback boundary. It turns a
 * successful, exact ExecutionReceipt output into a draft CineWeave
 * MediaImport and binds that draft back to the World OS ProductionSlice.
 *
 * It does not mark an asset approved, pass QA, or publish anything. Those are
 * still represented by the existing human QA/release Gates and their exact
 * evidence refs.
 */

export const PRODUCTION_MEDIA_IMPORT_KIND = "cineweave_codex_media_import";
const MEDIA_BINDING_KEYS = [
  "kind", "contractVersion", "importId", "version", "worldId", "sliceRef",
  "executionRequestRef", "executionReceiptRef", "renderPlanRef", "mediaImportRef",
  "status", "createdAt", "createdBy"
];
const MEDIA_BINDING_STATUSES = new Set(["candidate", "blocked"]);
const MEDIA_TYPES = new Set(["still", "storyboard_frame", "keyframe_candidate"]);
const MEDIA_SOURCES = new Set(["codex_interactive", "user_upload", "external_adapter"]);
const IDENTIFIER = IDENTIFIER_PATTERN;
const MEDIA_KEYS = ["mediaId", "mediaType", "fileName", "format", "byteSize", "contentHash", "width", "height", "source"];
const VERIFICATION_KEYS = ["fileExists", "contentHashPresent", "dimensionsDetected", "privateUrlAbsent", "status"];
const IMPORT_CONTRACT_KEYS = ["source", "statusOnCreation", "nextAction"];

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return new Date(value).toISOString();
}

function assertExactRef(value, label) {
  if (!isExactRef(value)) throw new TypeError(`${label} must be an exact artifact reference`);
  return value;
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function refString(ref) {
  return `${ref.kind}/${ref.id}@${ref.version}/${ref.contentHash}`;
}

function mediaFormat(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpeg";
  if (mimeType === "image/webp") return "webp";
  return null;
}

function dimensionsFromBytes(bytes, format) {
  if (format === "png" && bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (format === "webp" && bytes.length >= 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8X") {
      return {
        width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16),
        height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)
      };
    }
  }
  if (format === "jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2 || offset + length + 2 > bytes.length) break;
      const frame = (marker >= 0xc0 && marker <= 0xc3)
        || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb)
        || (marker >= 0xcd && marker <= 0xcf);
      if (frame) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      offset += length + 2;
    }
  }
  return null;
}

function safeOutputPath(projectRoot, storageRef) {
  if (typeof storageRef !== "string" || !storageRef || storageRef.includes("\0") || storageRef.includes("\\") || storageRef.startsWith("/")) {
    throw new Error("Execution output storageRef is not a safe project-relative path");
  }
  const storeRoot = resolve(projectRoot, ".cineweave");
  const outputPath = resolve(storeRoot, storageRef);
  if (!outputPath.startsWith(`${storeRoot}${sep}`)) throw new Error("Execution output escapes the project store");
  return outputPath;
}

function assertMediaImportPayload(payload) {
  if (!isPlainObject(payload) || payload.kind !== PRODUCTION_MEDIA_IMPORT_KIND || payload.contractVersion !== "2.0.0") throw new TypeError("Unsupported MediaImport contract");
  if (typeof payload.worldId !== "string" || !payload.worldId.trim() || payload.worldId.length > 160
    || typeof payload.renderPlanRef !== "string" || !payload.renderPlanRef.trim()
    || payload.status !== "draft" || !Array.isArray(payload.media) || !payload.media.length || payload.media.length > 12) {
    throw new TypeError("MediaImport identity or status is invalid");
  }
  if (!isPlainObject(payload.skillReceipt)
    || typeof payload.skillReceipt.repository !== "string" || !/^https:\/\/(www\.)?github\.com\/[^/]+\/[^/]+(?:\.git)?\/?$/.test(payload.skillReceipt.repository)
    || typeof payload.skillReceipt.ref !== "string" || !payload.skillReceipt.ref.trim()
    || typeof payload.skillReceipt.commit !== "string" || !/^[0-9a-fA-F]{7,64}$/.test(payload.skillReceipt.commit)
    || payload.skillReceipt.installedBy !== "codex-environment" || typeof payload.skillReceipt.usedAt !== "string" || Number.isNaN(Date.parse(payload.skillReceipt.usedAt))) {
    throw new TypeError("MediaImport.skillReceipt is invalid");
  }
  if (!isPlainObject(payload.verification)
    || Object.keys(payload.verification).sort().join("\u0000") !== VERIFICATION_KEYS.slice().sort().join("\u0000")
    || payload.verification.fileExists !== true || payload.verification.contentHashPresent !== true
    || payload.verification.dimensionsDetected !== true || payload.verification.privateUrlAbsent !== true
    || payload.verification.status !== "verified") throw new TypeError("MediaImport.verification must be verified");
  if (!isPlainObject(payload.importContract)
    || Object.keys(payload.importContract).sort().join("\u0000") !== IMPORT_CONTRACT_KEYS.slice().sort().join("\u0000")
    || !MEDIA_SOURCES.has(payload.importContract.source) || payload.importContract.statusOnCreation !== "draft"
    || typeof payload.importContract.nextAction !== "string" || !payload.importContract.nextAction.trim() || payload.importContract.nextAction.length > 1200) {
    throw new TypeError("MediaImport.importContract is invalid");
  }
  for (const [index, media] of payload.media.entries()) {
    if (!isPlainObject(media) || Object.keys(media).sort().join("\u0000") !== MEDIA_KEYS.slice().sort().join("\u0000")
      || typeof media.mediaId !== "string" || !media.mediaId.trim() || media.mediaId.length > 160
      || !MEDIA_TYPES.has(media.mediaType) || typeof media.fileName !== "string" || !media.fileName.trim()
      || !/^[^/\\?%*:|"<>]+$/.test(media.fileName) || !new Set(["png", "jpeg", "webp"]).has(media.format)
      || !Number.isSafeInteger(media.byteSize) || media.byteSize < 1 || !HASH_PATTERN.test(media.contentHash || "")
      || !Number.isSafeInteger(media.width) || media.width < 1 || !Number.isSafeInteger(media.height) || media.height < 1
      || !MEDIA_SOURCES.has(media.source)) throw new TypeError(`MediaImport.media[${index}] is invalid`);
  }
  return payload;
}

export function productionMediaImportRef(payload) {
  assertMediaImportPayload(payload);
  const id = `media-import.${sha256Canonical(payload).slice(7, 39)}`;
  return exactRef(PRODUCTION_MEDIA_IMPORT_KIND, id, 1, payload);
}

export function assertProductionMediaBindingContract(binding) {
  if (!isPlainObject(binding) || binding.kind !== ARTIFACT_KINDS.productionMediaImport || binding.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported ProductionMediaImport binding");
  if (Object.keys(binding).sort().join("\u0000") !== MEDIA_BINDING_KEYS.slice().sort().join("\u0000")) throw new TypeError("ProductionMediaImport binding fields must be exact");
  if (!IDENTIFIER.test(binding.importId || "") || binding.version !== 1 || !WORLD_ID_PATTERN.test(binding.worldId || "")
    || !isExactRef(binding.sliceRef) || binding.sliceRef.kind !== ARTIFACT_KINDS.productionSlice
    || !isExactRef(binding.executionRequestRef) || binding.executionRequestRef.kind !== "cineweave_execution_request"
    || !isExactRef(binding.executionReceiptRef) || binding.executionReceiptRef.kind !== "cineweave_execution_receipt"
    || !isExactRef(binding.renderPlanRef) || binding.renderPlanRef.kind !== "cineweave_codex_render_plan"
    || !isExactRef(binding.mediaImportRef) || binding.mediaImportRef.kind !== PRODUCTION_MEDIA_IMPORT_KIND
    || !MEDIA_BINDING_STATUSES.has(binding.status)) throw new TypeError("ProductionMediaImport binding identity or status is invalid");
  assertDate(binding.createdAt, "ProductionMediaImport.createdAt");
  assertWriter(binding.createdBy, "ProductionMediaImport.createdBy");
  return binding;
}

async function outputMedia(output, index, projectRoot) {
  const format = mediaFormat(output?.mimeType);
  if (!format || output?.mediaKind !== "image") throw new Error(`Execution output ${index + 1} is not an importable PNG/JPEG/WebP image`);
  const outputPath = safeOutputPath(projectRoot, output.storageRef);
  const fileName = basename(output.filename || output.fileName || output.storageRef || "");
  if (!fileName || !/^[^/\\?%*:|"<>]+$/.test(fileName)) throw new Error(`Execution output ${index + 1} filename is unsafe`);
  const bytes = await readFile(outputPath);
  const info = await stat(outputPath);
  if (!info.isFile() || bytes.byteLength !== output.byteLength || sha256Bytes(bytes) !== output.contentHash) throw new Error(`Execution output ${index + 1} failed immutable byte verification`);
  const detectedDimensions = dimensionsFromBytes(bytes, format);
  if (!detectedDimensions || !Number.isSafeInteger(detectedDimensions.width) || detectedDimensions.width < 1 || !Number.isSafeInteger(detectedDimensions.height) || detectedDimensions.height < 1) throw new Error(`Execution output ${index + 1} has no bounded image dimensions or valid image signature`);
  if ((output.width !== null && output.width !== undefined && output.width !== detectedDimensions.width)
    || (output.height !== null && output.height !== undefined && output.height !== detectedDimensions.height)) {
    throw new Error(`Execution output ${index + 1} dimensions do not match the image bytes`);
  }
  const dimensions = detectedDimensions;
  return {
    mediaId: `media-${output.contentHash.slice(7, 23)}`,
    mediaType: null,
    fileName,
    format,
    byteSize: bytes.byteLength,
    contentHash: output.contentHash,
    width: dimensions.width,
    height: dimensions.height,
    source: null
  };
}

/**
 * Convert a successful exact ExecutionReceipt into a draft MediaImport and a
 * World OS binding. Only PNG/JPEG/WebP image outputs are accepted by the
 * existing MediaImport contract; SVG/video receipts remain valid execution
 * receipts but must use a different import contract.
 */
export async function createProductionMediaImport(projectRoot, executionRequestRef, executionReceiptRef, options = {}) {
  const binding = await verifyProductionExecutionRequest(projectRoot, assertExactRef(executionRequestRef, "executionRequestRef"));
  const requestItem = await findArtifact(projectRoot, binding.requestRef);
  const receiptItem = await findArtifact(projectRoot, assertExactRef(executionReceiptRef, "executionReceiptRef"));
  const receipt = receiptItem.envelope.payload;
  if (receipt?.kind !== "cineweave_execution_receipt" || !sameRef(receiptItem.envelope.artifactRef, executionReceiptRef)) throw new Error("executionReceiptRef is not an exact ExecutionReceipt");
  if (!sameRef(receipt.requestArtifactRef, binding.requestRef) || receipt.status !== "succeeded" || !Array.isArray(receipt.outputs) || !receipt.outputs.length) throw new Error("Only a successful output-bearing ExecutionReceipt can create MediaImport");
  const mediaType = options.mediaType || "keyframe_candidate";
  const source = options.source || (requestItem.envelope.payload.executionMode === "external" ? "external_adapter" : "codex_interactive");
  if (!MEDIA_TYPES.has(mediaType)) throw new TypeError("mediaType is invalid");
  if (!MEDIA_SOURCES.has(source)) throw new TypeError("source is invalid");
  if (receipt.outputs.length > 12) throw new Error("ExecutionReceipt contains more than 12 importable outputs");
  const media = [];
  for (let index = 0; index < receipt.outputs.length; index += 1) {
    const item = await outputMedia(receipt.outputs[index], index, projectRoot);
    item.mediaType = mediaType;
    item.source = source;
    media.push(item);
  }
  const renderPlanRef = assertExactRef(requestItem.envelope.payload.renderPlanRef, "request.renderPlanRef");
  const renderPlan = (await findArtifact(projectRoot, renderPlanRef)).envelope.payload;
  const createdAt = assertDate(options.createdAt || receipt.timing.finishedAt, "createdAt");
  const mediaImport = {
    kind: PRODUCTION_MEDIA_IMPORT_KIND,
    contractVersion: "2.0.0",
    worldId: binding.slice.worldId,
    ...(renderPlan.shotId ? { shotId: renderPlan.shotId } : {}),
    renderPlanRef: refString(renderPlanRef),
    skillReceipt: structuredClone(requestItem.envelope.payload.skillReceipt),
    status: "draft",
    media,
    verification: {
      fileExists: true,
      contentHashPresent: true,
      dimensionsDetected: true,
      privateUrlAbsent: true,
      status: "verified"
    },
    importContract: {
      source,
      statusOnCreation: "draft",
      nextAction: "Bind this Draft MediaImport to exact QA evidence, then activate the ProductionSlice QA Gate."
    }
  };
  assertMediaImportPayload(mediaImport);
  const mediaRef = productionMediaImportRef(mediaImport);
  const existingMedia = await findArtifactByVersion(projectRoot, PRODUCTION_MEDIA_IMPORT_KIND, mediaRef.id, 1);
  if (existingMedia && !sameRef(existingMedia.envelope.artifactRef, mediaRef)) throw new Error("MediaImport identity is bound to different content");
  const mediaArtifact = existingMedia || await putArtifact(projectRoot, mediaImport, {
    kind: PRODUCTION_MEDIA_IMPORT_KIND,
    id: mediaRef.id,
    version: 1,
    status: "candidate",
    createdAt,
    createdBy: "codex.root"
  });
  const bindingPayload = {
    kind: ARTIFACT_KINDS.productionMediaImport,
    contractVersion: WORLD_OS_VERSION,
    importId: `production-media-import.${sha256Canonical({ sliceRef: binding.sliceRef, executionRequestRef: binding.requestRef, executionReceiptRef, mediaImportRef: mediaArtifact.envelope.artifactRef }).slice(7, 39)}`,
    version: 1,
    worldId: binding.slice.worldId,
    sliceRef: binding.sliceRef,
    executionRequestRef: binding.requestRef,
    executionReceiptRef,
    renderPlanRef,
    mediaImportRef: mediaArtifact.envelope.artifactRef,
    status: "candidate",
    createdAt,
    createdBy: { kind: "codex", id: "codex.root" }
  };
  assertProductionMediaBindingContract(bindingPayload);
  const bindingRef = exactRef(ARTIFACT_KINDS.productionMediaImport, bindingPayload.importId, bindingPayload.version, bindingPayload);
  const existingBinding = await findArtifactByVersion(projectRoot, ARTIFACT_KINDS.productionMediaImport, bindingPayload.importId, bindingPayload.version);
  if (existingBinding && !sameRef(existingBinding.envelope.artifactRef, bindingRef)) throw new Error("ProductionMediaImport binding is immutable and already contains different content");
  const storedBinding = existingBinding || await putArtifact(projectRoot, bindingPayload, {
    kind: ARTIFACT_KINDS.productionMediaImport,
    id: bindingPayload.importId,
    version: bindingPayload.version,
    status: "candidate",
    createdAt,
    createdBy: "codex.root"
  });
  return {
    binding: bindingPayload,
    bindingRef: storedBinding.envelope.artifactRef,
    mediaImport,
    mediaImportRef: mediaArtifact.envelope.artifactRef,
    executionRequestRef: binding.requestRef,
    executionReceiptRef,
    idempotent: Boolean(existingBinding)
  };
}

export async function verifyProductionMediaImport(projectRoot, bindingRef, options = {}) {
  const exactBindingRef = assertExactRef(bindingRef, "bindingRef");
  if (exactBindingRef.kind !== ARTIFACT_KINDS.productionMediaImport) throw new TypeError("bindingRef must target ProductionMediaImport");
  const cache = options.cache?.media;
  const cacheKey = JSON.stringify(exactBindingRef);
  if (cache?.has(cacheKey)) return cache.get(cacheKey);
  const bindingItem = await findArtifact(projectRoot, exactBindingRef);
  const binding = assertProductionMediaBindingContract(bindingItem.envelope.payload);
  if (!sameRef(bindingItem.envelope.artifactRef, exactBindingRef)) throw new Error("ProductionMediaImport binding is not content-addressed exactly");
  const execution = await verifyProductionExecutionRequest(projectRoot, binding.executionRequestRef, { allowHistorical: true });
  if (!sameRef(execution.sliceRef, binding.sliceRef) || !sameRef(execution.request.renderPlanRef, binding.renderPlanRef)) throw new Error("ProductionMediaImport is not bound to the exact slice/render plan");
  const receiptItem = await findArtifact(projectRoot, binding.executionReceiptRef);
  const receipt = receiptItem.envelope.payload;
  if (receipt.status !== "succeeded" || !sameRef(receipt.requestArtifactRef, binding.executionRequestRef)) throw new Error("ProductionMediaImport receipt is not a successful exact execution");
  const mediaItem = await findArtifact(projectRoot, binding.mediaImportRef);
  const mediaImport = assertMediaImportPayload(mediaItem.envelope.payload);
  if (!sameRef(mediaItem.envelope.artifactRef, binding.mediaImportRef)
    || !sameRef(productionMediaImportRef(mediaImport), binding.mediaImportRef)
    || mediaImport.worldId !== binding.worldId) throw new Error("ProductionMediaImport media payload is not exact");
  if (mediaImport.renderPlanRef !== refString(binding.renderPlanRef)) throw new Error("MediaImport renderPlanRef does not match the exact RenderPlan");
  if (mediaImport.media.length !== receipt.outputs.length) throw new Error("MediaImport media count does not match the exact ExecutionReceipt");
  const verifiedOutputs = [];
  for (let index = 0; index < receipt.outputs.length; index += 1) {
    verifiedOutputs.push(await outputMedia(receipt.outputs[index], index, projectRoot));
  }
  for (const media of mediaImport.media) {
    const output = verifiedOutputs.find((candidate) => candidate.contentHash === media.contentHash && candidate.fileName === media.fileName);
    if (!output || output.format !== media.format || output.byteSize !== media.byteSize || output.width !== media.width || output.height !== media.height) {
      throw new Error(`MediaImport media ${media.mediaId} is not present in the exact ExecutionReceipt`);
    }
  }
  const result = { binding, bindingRef: exactBindingRef, mediaImport, mediaImportRef: binding.mediaImportRef, receipt, execution };
  cache?.set(cacheKey, result);
  return result;
}

export async function listProductionMediaImports(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.productionMediaImport)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .filter((item) => !options.status || item.envelope.payload.status === options.status)
    .sort((left, right) => left.envelope.payload.importId.localeCompare(right.envelope.payload.importId));
  const result = [];
  for (const item of items) {
    const verified = await verifyProductionMediaImport(projectRoot, item.envelope.artifactRef);
    result.push(verified);
  }
  return result;
}
