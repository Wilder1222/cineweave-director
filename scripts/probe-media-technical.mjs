#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";
import { validateByKind } from "./validate-contract-semantics.mjs";

const execFile = promisify(execFileCallback);
const MAX_MEDIA_BYTES = 512 * 1024 * 1024;
const EXACT_MEDIA_IMPORT_REF = /^([a-z0-9][a-z0-9._-]{1,159})\/([a-z0-9][a-z0-9._-]{1,159})@([1-9][0-9]*)\/(sha256:[0-9a-f]{64})$/;
const FFPROBE_ENTRIES = "format=format_name,start_time,duration,size,bit_rate:stream=index,codec_type,codec_name,profile,codec_tag_string,width,height,pix_fmt,bits_per_raw_sample,field_order,sample_aspect_ratio,display_aspect_ratio,avg_frame_rate,r_frame_rate,time_base,duration,bit_rate,color_range,color_space,color_transfer,color_primaries,sample_rate,channels,channel_layout";

function usage() {
  console.error("Usage: node scripts/probe-media-technical.mjs <local-media-file> --media-import-ref <exact-ref> --media-id <id> --receipt <skill-receipt.json>");
}

function argValue(args, name) {
  const index = args.indexOf(name);
  if (index === -1) throw new Error("missing " + name);
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(name + " requires a value");
  return value;
}

function rejectUnknownArguments(args) {
  const expected = new Set(["--media-import-ref", "--media-id", "--receipt"]);
  for (let index = 1; index < args.length; index += 1) {
    const argument = args[index];
    if (!expected.has(argument)) throw new Error("unsupported argument");
    if (!args[index + 1] || args[index + 1].startsWith("--")) throw new Error(argument + " requires a value");
    index += 1;
  }
}

function parseExactMediaImportRef(value) {
  const match = EXACT_MEDIA_IMPORT_REF.exec(value);
  if (!match || match[1] !== "cineweave_codex_media_import") throw new Error("--media-import-ref must be an exact MediaImport reference");
  return {
    kind: match[1],
    id: match[2],
    version: Number(match[3]),
    contentHash: match[4]
  };
}

function isLocalPath(value) {
  const normalized = String(value || "");
  if (/^[a-z]:/i.test(normalized) && (normalized[2] === "\\" || normalized[2] === "/")) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(normalized);
}

function usableString(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized && !/^(?:N\/A|unknown)$/i.test(normalized) ? normalized : null;
}

function stringMeasurement(value) {
  const normalized = usableString(value);
  return normalized ? { status: "reported", value: normalized } : { status: "not_reported" };
}

function integerMeasurement(value) {
  const normalized = Number(value);
  return Number.isSafeInteger(normalized) && normalized >= 0
    ? { status: "reported", value: normalized }
    : { status: "not_reported" };
}

function numberMeasurement(value) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized >= 0
    ? { status: "reported", value: normalized }
    : { status: "not_reported" };
}

function rationalMeasurement(value, source) {
  const text = usableString(value);
  const match = text && /^(\d+)[/:](\d+)$/.exec(text);
  const numerator = Number(match?.[1]);
  const denominator = Number(match?.[2]);
  if (Number.isSafeInteger(numerator) && numerator > 0 && Number.isSafeInteger(denominator) && denominator > 0) {
    return { status: "reported", numerator, denominator, source };
  }
  return { status: "not_reported", source: "not_reported" };
}

function chooseFrameRate(stream) {
  const average = rationalMeasurement(stream?.avg_frame_rate, "avg_frame_rate");
  return average.status === "reported" ? average : rationalMeasurement(stream?.r_frame_rate, "r_frame_rate");
}

function collectFormatNames(value) {
  return [...new Set(String(value || "").split(",").map((name) => name.trim()).filter((name) => /^[A-Za-z0-9._+-]+$/.test(name)))];
}

function toVideoStream(stream) {
  const width = Number(stream?.width);
  const height = Number(stream?.height);
  if (!Number.isSafeInteger(width) || width < 1 || !Number.isSafeInteger(height) || height < 1) {
    throw new Error("ffprobe did not provide valid dimensions for a video stream");
  }
  const codecName = usableString(stream?.codec_name);
  if (!codecName) throw new Error("ffprobe did not provide a video codec name");
  return {
    streamIndex: Number(stream.index),
    codecName,
    codecProfile: stringMeasurement(stream.profile),
    codecTag: stringMeasurement(stream.codec_tag_string),
    width,
    height,
    pixelFormat: stringMeasurement(stream.pix_fmt),
    bitDepth: integerMeasurement(stream.bits_per_raw_sample),
    fieldOrder: stringMeasurement(stream.field_order),
    sampleAspectRatio: rationalMeasurement(stream.sample_aspect_ratio, "aspect_ratio"),
    displayAspectRatio: rationalMeasurement(stream.display_aspect_ratio, "aspect_ratio"),
    frameRate: chooseFrameRate(stream),
    timeBase: rationalMeasurement(stream.time_base, "time_base"),
    durationSeconds: numberMeasurement(stream.duration),
    bitRate: integerMeasurement(stream.bit_rate),
    colorSignals: {
      primaries: stringMeasurement(stream.color_primaries),
      transfer: stringMeasurement(stream.color_transfer),
      matrix: stringMeasurement(stream.color_space),
      range: stringMeasurement(stream.color_range)
    }
  };
}

function toAudioStream(stream) {
  const codecName = usableString(stream?.codec_name);
  if (!codecName) throw new Error("ffprobe did not provide an audio codec name");
  return {
    streamIndex: Number(stream.index),
    codecName,
    codecProfile: stringMeasurement(stream.profile),
    codecTag: stringMeasurement(stream.codec_tag_string),
    sampleRate: integerMeasurement(stream.sample_rate),
    channels: integerMeasurement(stream.channels),
    channelLayout: stringMeasurement(stream.channel_layout),
    timeBase: rationalMeasurement(stream.time_base, "time_base"),
    durationSeconds: numberMeasurement(stream.duration),
    bitRate: integerMeasurement(stream.bit_rate)
  };
}

function normalizeReport(ffprobeReport) {
  const format = ffprobeReport?.format || {};
  const rawStreams = Array.isArray(ffprobeReport?.streams) ? ffprobeReport.streams : [];
  const video = rawStreams.filter((stream) => stream?.codec_type === "video").map(toVideoStream);
  const audio = rawStreams.filter((stream) => stream?.codec_type === "audio").map(toAudioStream);
  const otherStreamCount = rawStreams.filter((stream) => !["video", "audio"].includes(stream?.codec_type)).length;
  if (video.length + audio.length + otherStreamCount < 1) throw new Error("ffprobe did not report any media streams");
  const container = {
    status: "probed",
    formatNames: collectFormatNames(format.format_name),
    startTimeSeconds: numberMeasurement(format.start_time),
    durationSeconds: numberMeasurement(format.duration),
    bitRate: integerMeasurement(format.bit_rate),
    reportedByteSize: integerMeasurement(format.size),
    metadataExcluded: true
  };
  if (!container.formatNames.length) throw new Error("ffprobe did not provide a container format");
  return {
    container,
    streams: {
      status: "probed",
      video,
      audio,
      otherStreamCount
    }
  };
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return "sha256:" + hash.digest("hex");
}

async function readSkillReceipt(receiptPath) {
  let receipt;
  try {
    receipt = JSON.parse(await readFile(resolve(receiptPath), "utf8"));
  } catch {
    throw new Error("--receipt must be readable JSON");
  }
  const text = JSON.stringify(receipt);
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)
    || !receipt.repository || !receipt.ref || !/^[0-9a-f]{7,64}$/i.test(receipt.commit || "")
    || receipt.installedBy !== "codex-environment" || typeof receipt.usedAt !== "string"
    || Number.isNaN(Date.parse(receipt.usedAt))
    || /owner\/repository|placeholder|40-character-git-sha|sha256:<[^>]+>/i.test(text)) {
    throw new Error("--receipt must contain an auditable skill receipt");
  }
  return receipt;
}

async function runFfprobe(filePath) {
  let output;
  try {
    output = await execFile("ffprobe", ["-v", "error", "-show_error", "-show_format", "-show_streams", "-show_entries", FFPROBE_ENTRIES, "-of", "json", filePath], {
      windowsHide: true,
      timeout: 15000,
      maxBuffer: 2 * 1024 * 1024
    });
  } catch {
    throw new Error("local ffprobe could not complete the technical probe");
  }
  try {
    return JSON.parse(output.stdout);
  } catch {
    throw new Error("ffprobe did not return parseable JSON");
  }
}

async function readFfprobeVersion() {
  let output;
  try {
    output = await execFile("ffprobe", ["-version"], { windowsHide: true, timeout: 5000, maxBuffer: 64 * 1024 });
  } catch {
    throw new Error("local ffprobe is required for a recorded technical probe");
  }
  const match = /^ffprobe version\s+([^\s]+)/m.exec(output.stdout || "");
  if (!match) throw new Error("ffprobe version could not be determined");
  return match[1];
}

export function buildMediaTechnicalProbe({ mediaImportRef, mediaId, mediaContentHash, mediaByteSize, skillReceipt, ffprobeVersion, ffprobeReport, observedAt = new Date().toISOString() }) {
  const { container, streams } = normalizeReport(ffprobeReport);
  const sanitizedReportHash = sha256Canonical({
    mediaImportRef,
    mediaId,
    mediaContentHash,
    mediaByteSize,
    container,
    streams
  });
  const mediaTechnicalProbeId = "media-technical-probe." + sha256Canonical({
    mediaImportRef,
    mediaId,
    mediaContentHash,
    mediaByteSize,
    toolVersion: ffprobeVersion,
    sanitizedReportHash
  }).slice(7, 39);
  return {
    kind: "cineweave_codex_media_technical_probe",
    contractVersion: "2.5.0",
    mediaTechnicalProbeId,
    version: 1,
    mediaImportRef,
    mediaId,
    mediaContentHash,
    mediaByteSize,
    skillReceipt,
    probeStatus: "recorded",
    probeTool: {
      executionState: "ffprobe_recorded",
      toolId: "ffprobe",
      toolVersion: ffprobeVersion,
      commandProfile: "ffprobe_format_streams_json_v1",
      sanitizedReportHash,
      observedAt
    },
    container,
    streams,
    executionBoundary: {
      usesLocalProbeTool: true,
      callsNetwork: false,
      writesSourceMedia: false,
      writesDerivedMedia: false,
      storesRawFilePath: false,
      storesRawContainerTags: false,
      humanReviewRequired: true,
      notes: "The local ffprobe adapter records selected technical fields only; it does not persist paths, tags, extradata, media writes, color interpretation, rights or approval."
    },
    validation: {
      sourceBindingExact: true,
      mediaHashExact: true,
      probeStateConsistent: true,
      missingFieldsExplicit: true,
      sensitiveFieldsExcluded: true
    },
    provenance: {
      source: "imported",
      createdAt: observedAt,
      updatedAt: observedAt,
      changeLog: [
        "Recorded selected container and stream metadata through local ffprobe.",
        "Excluded raw paths, container tags and extradata from the portable report."
      ]
    }
  };
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
    rejectUnknownArguments(args);
    if (!isLocalPath(mediaPath)) throw new Error("media input must be a local file path");
    const mediaImportRef = parseExactMediaImportRef(argValue(args, "--media-import-ref"));
    const mediaId = argValue(args, "--media-id");
    const receipt = await readSkillReceipt(argValue(args, "--receipt"));
    const resolvedPath = resolve(mediaPath);
    const fileInfo = await stat(resolvedPath);
    if (!fileInfo.isFile()) throw new Error("media input is not a regular file");
    if (fileInfo.size < 1 || fileInfo.size > MAX_MEDIA_BYTES) throw new Error("media input exceeds the local probe byte limit");

    const [mediaContentHash, ffprobeVersion, ffprobeReport] = await Promise.all([
      hashFile(resolvedPath),
      readFfprobeVersion(),
      runFfprobe(resolvedPath)
    ]);
    const result = buildMediaTechnicalProbe({
      mediaImportRef,
      mediaId,
      mediaContentHash,
      mediaByteSize: fileInfo.size,
      skillReceipt: receipt,
      ffprobeVersion,
      ffprobeReport
    });
    const semanticErrors = validateByKind(result);
    if (semanticErrors.length) throw new Error("generated technical probe did not satisfy semantic validation");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ valid: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
}
