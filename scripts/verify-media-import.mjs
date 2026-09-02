#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";
import { promisify } from "node:util";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";

const execFile = promisify(execFileCallback);
const MAX_IMAGE_BYTES = 64 * 1024 * 1024;
const MAX_VIDEO_BYTES = 512 * 1024 * 1024;
const EXACT_ARTIFACT_REF = /^([a-z0-9][a-z0-9._-]{1,159})\/([a-z0-9][a-z0-9._-]{1,159})@([1-9][0-9]*)\/(sha256:[0-9a-f]{64})$/;

function usage() {
  console.error("Usage: node scripts/verify-media-import.mjs <media-file> --world-id <id> --render-plan-ref <ref> --receipt <receipt.json> [--shot-id <id>] [--media-type still|storyboard_frame|keyframe_candidate|video_candidate] [--source codex_interactive|user_upload|external_adapter]");
}

function argValue(args, name, required = true) {
  const index = args.indexOf(name);
  if (index === -1) {
    if (required) throw new Error(`missing ${name}`);
    return undefined;
  }
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function detectFormat(bytes, fileName) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  const extension = extname(fileName).slice(1).toLowerCase();
  return extension === "jpg" ? "jpeg" : extension;
}

function extensionFormat(fileName) {
  const extension = extname(fileName).slice(1).toLowerCase();
  if (extension === "jpg") return "jpeg";
  if (extension === "m4v") return "mp4";
  return extension;
}

function parseExactRenderPlanRef(value) {
  const match = EXACT_ARTIFACT_REF.exec(value);
  if (!match || match[1] !== "cineweave_codex_render_plan") return null;
  return {
    kind: match[1],
    id: match[2],
    version: Number(match[3]),
    contentHash: match[4]
  };
}

function parseFrameRate(value) {
  const [numeratorText, denominatorText] = String(value || "").split("/", 2);
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator <= 0 || denominator <= 0) return null;
  return numerator / denominator;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return `sha256:${hash.digest("hex")}`;
}

async function probeVideo(filePath, expectedFormat) {
  let output;
  try {
    output = await execFile("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_type,width,height,avg_frame_rate,r_frame_rate:format=format_name,duration", "-of", "json", filePath], { windowsHide: true, timeout: 10000, maxBuffer: 1024 * 1024 });
  } catch (error) {
    throw new Error(`video import requires local ffprobe metadata verification: ${error instanceof Error ? error.message : String(error)}`);
  }
  let probe;
  try { probe = JSON.parse(output.stdout); } catch { throw new Error("ffprobe did not return valid JSON"); }
  const stream = probe?.streams?.find((item) => item?.codec_type === "video");
  const width = Number(stream?.width);
  const height = Number(stream?.height);
  const durationSeconds = Number(probe?.format?.duration);
  const frameRate = parseFrameRate(stream?.avg_frame_rate) ?? parseFrameRate(stream?.r_frame_rate);
  const formatNames = String(probe?.format?.format_name || "").split(",");
  const containerMatches = expectedFormat === "webm" ? formatNames.includes("webm") : formatNames.some((name) => ["mov", "mp4", "m4a", "3gp", "3g2", "mj2"].includes(name));
  if (!containerMatches) throw new Error(`ffprobe container does not match ${expectedFormat}`);
  if (!Number.isInteger(width) || width < 1 || !Number.isInteger(height) || height < 1) throw new Error("ffprobe could not detect video dimensions");
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error("ffprobe could not detect video duration");
  if (!Number.isFinite(frameRate) || frameRate <= 0) throw new Error("ffprobe could not detect video frame rate");
  return { width, height, durationSeconds, frameRate };
}

function detectDimensions(bytes, format) {
  if (format === "png" && bytes.length >= 24) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  if (format === "webp" && bytes.length >= 30 && bytes.toString("ascii", 12, 16) === "VP8X") {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }
  if (format === "jpeg") {
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
      const isFrame = marker >= 0xc0 && marker <= 0xc3 || marker >= 0xc5 && marker <= 0xc7 || marker >= 0xc9 && marker <= 0xcb || marker >= 0xcd && marker <= 0xcf;
      if (isFrame) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      offset += length + 2;
    }
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const mediaPath = args[0];
  if (!mediaPath) {
    usage();
    process.exitCode = 2;
    return;
  }

  try {
    const worldId = argValue(args, "--world-id");
    const renderPlanRef = argValue(args, "--render-plan-ref");
    const receiptPath = argValue(args, "--receipt");
    const shotId = argValue(args, "--shot-id", false);
    const mediaType = argValue(args, "--media-type", false) ?? "keyframe_candidate";
    const source = argValue(args, "--source", false) ?? "user_upload";
    if (!["still", "storyboard_frame", "keyframe_candidate", "video_candidate"].includes(mediaType)) throw new Error("--media-type is unsupported");
    if (!["codex_interactive", "user_upload", "external_adapter"].includes(source)) throw new Error("--source is unsupported");

    const resolvedPath = resolve(mediaPath);
    const fileInfo = await stat(resolvedPath);
    if (!fileInfo.isFile()) throw new Error("media path is not a file");
    const fileName = basename(resolvedPath);
    const isVideo = mediaType === "video_candidate";
    const byteLimit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (fileInfo.size > byteLimit) throw new Error(`media exceeds the ${isVideo ? "video" : "image"} byte limit`);
    const bytes = isVideo ? null : await readFile(resolvedPath);
    const format = isVideo ? extensionFormat(fileName) : detectFormat(bytes, fileName);
    const allowedFormats = isVideo ? ["mp4", "mov", "webm"] : ["png", "jpeg", "webp"];
    if (!allowedFormats.includes(format)) throw new Error(isVideo ? "video candidates must be mp4, mov or webm" : "still media must be png, jpeg or webp");
    const dimensions = isVideo ? await probeVideo(resolvedPath, format) : detectDimensions(bytes, format);
    if (!dimensions || dimensions.width < 1 || dimensions.height < 1) throw new Error(`could not detect ${isVideo ? "video" : "image"} dimensions`);
    const contentHash = isVideo ? await hashFile(resolvedPath) : "sha256:" + createHash("sha256").update(bytes).digest("hex");
    const receipt = JSON.parse(await readFile(resolve(receiptPath), "utf8"));
    if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) throw new Error("receipt file must contain a JSON object");
    const receiptText = JSON.stringify(receipt);
    if (!receipt.repository || !receipt.ref || !/^[0-9a-f]{7,64}$/i.test(receipt.commit ?? "") || receipt.installedBy !== "codex-environment"
      || typeof receipt.usedAt !== "string" || Number.isNaN(Date.parse(receipt.usedAt))
      || /owner\/repository|placeholder|40-character-git-sha|sha256:<[^>]+>/i.test(receiptText)) {
      throw new Error("receipt must contain a real repository, ref, Git commit, codex-environment installer and valid usedAt date");
    }

    const mediaId = "media-" + contentHash.slice(-16);
    const media = [{
      mediaId,
      mediaType,
      fileName,
      format,
      byteSize: fileInfo.size,
      contentHash,
      width: dimensions.width,
      height: dimensions.height,
      ...(isVideo ? { durationSeconds: dimensions.durationSeconds, frameRate: dimensions.frameRate } : {}),
      source
    }];
    const verification = {
      fileExists: true,
      contentHashPresent: true,
      dimensionsDetected: true,
      privateUrlAbsent: true,
      status: "verified"
    };
    const importContract = {
      source,
      statusOnCreation: "draft",
      nextAction: isVideo ? "Bind the verified Draft video to candidate observations, review temporal continuity, then send it to the explicit QA gate." : "Bind the verified Draft media to the Candidate, review continuity, then explicitly lock it as a Keyframe."
    };
    const exactRenderPlanRef = parseExactRenderPlanRef(renderPlanRef);
    const result = {
      kind: "cineweave_codex_media_import",
      worldId,
      ...(shotId ? { shotId } : {}),
      skillReceipt: receipt,
      status: "draft",
      media,
      verification,
      importContract
    };
    if (exactRenderPlanRef) {
      const provenance = {
        source: "imported",
        createdAt: new Date(receipt.usedAt).toISOString(),
        updatedAt: new Date(receipt.usedAt).toISOString(),
        changeLog: ["Verified local media bytes and normalized an exact RenderPlan reference."]
      };
      const mediaImportIdentity = {
        contractVersion: "2.5.0",
        worldId,
        ...(shotId ? { shotId } : {}),
        renderPlanRef: exactRenderPlanRef,
        skillReceipt: receipt,
        status: result.status,
        media,
        verification,
        importContract,
        provenance
      };
      result.contractVersion = "2.5.0";
      result.mediaImportId = "media-import." + sha256Canonical(mediaImportIdentity).slice(7, 39);
      result.version = 1;
      result.renderPlanRef = exactRenderPlanRef;
      result.provenance = provenance;
    } else {
      result.contractVersion = "2.0.0";
      result.renderPlanRef = renderPlanRef;
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ valid: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 2;
  }
}

main();
