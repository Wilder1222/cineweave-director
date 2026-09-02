import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { buildMediaTechnicalProbe } from "../../scripts/probe-media-technical.mjs";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const schemaPath = join(contractRoot, "schemas", "media-technical-probe.schema.json");
const colorSchemaPath = join(contractRoot, "schemas", "color-pipeline-profile.schema.json");
const mediaImport = JSON.parse(await readFile(join(contractRoot, "examples", "media-import-video.json"), "utf8"));
const colorPipelineProfile = JSON.parse(await readFile(join(contractRoot, "examples", "color-pipeline-profile.json"), "utf8"));
const execFile = promisify(execFileCallback);
const fixturePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLdpAAAAABJRU5ErkJggg==", "base64");

const mediaImportRef = {
  kind: "cineweave_codex_media_import",
  id: mediaImport.mediaImportId,
  version: mediaImport.version,
  contentHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
};

const sampleFfprobeReport = {
  format: {
    format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    start_time: "0.000000",
    duration: "5.040000",
    size: "2457600",
    bit_rate: "3900952",
    tags: { private_filename: "must-not-be-copied.mov" }
  },
  streams: [
    {
      index: 0,
      codec_type: "video",
      codec_name: "h264",
      profile: "High",
      codec_tag_string: "avc1",
      width: 1280,
      height: 720,
      pix_fmt: "yuv420p",
      bits_per_raw_sample: "8",
      field_order: "progressive",
      sample_aspect_ratio: "1:1",
      display_aspect_ratio: "16:9",
      avg_frame_rate: "24/1",
      r_frame_rate: "24/1",
      time_base: "1/12288",
      duration: "5.040000",
      bit_rate: "3850000",
      color_range: "tv",
      color_space: "bt709",
      color_transfer: "bt709",
      color_primaries: "bt709",
      tags: { encoder: "must-not-be-copied" }
    },
    {
      index: 1,
      codec_type: "audio",
      codec_name: "aac",
      profile: "LC",
      codec_tag_string: "mp4a",
      sample_rate: "48000",
      channels: 2,
      channel_layout: "stereo",
      time_base: "1/48000",
      duration: "5.040000",
      bit_rate: "128000",
      tags: { language: "must-not-be-copied" }
    }
  ]
};

function buildRecordedProbe() {
  return buildMediaTechnicalProbe({
    mediaImportRef,
    mediaId: mediaImport.media[0].mediaId,
    mediaContentHash: mediaImport.media[0].contentHash,
    mediaByteSize: mediaImport.media[0].byteSize,
    skillReceipt: {
      repository: "https://github.com/cineweave/studio",
      ref: "v2.5.1",
      commit: "0123456789abcdef0123456789abcdef01234567",
      installedBy: "codex-environment",
      usedAt: "2026-09-02T13:30:00.000Z"
    },
    ffprobeVersion: "8.1.1",
    ffprobeReport: sampleFfprobeReport,
    observedAt: "2026-09-02T13:30:00.000Z"
  });
}

test("MediaTechnicalProbe captures selected ffprobe container and stream fields without raw paths or tags", async () => {
  const probe = buildRecordedProbe();
  assert.equal(probe.probeStatus, "recorded");
  assert.equal(probe.probeTool.toolId, "ffprobe");
  assert.deepEqual(probe.container.formatNames, ["mov", "mp4", "m4a", "3gp", "3g2", "mj2"]);
  assert.equal(probe.streams.video[0].frameRate.numerator, 24);
  assert.equal(probe.streams.audio[0].sampleRate.value, 48000);
  assert.equal(JSON.stringify(probe).includes("must-not-be-copied"), false);
  assert.equal((await validatePayload(schemaPath, probe)).valid, true);
  assert.deepEqual(validateByKind(probe, { mediaImport }), []);
});

test("MediaTechnicalProbe distinguishes an uninvoked plan from a recorded probe and rejects stale media bindings", async () => {
  const planned = buildRecordedProbe();
  planned.probeStatus = "planned";
  planned.probeTool = { executionState: "not_invoked" };
  planned.container = { status: "not_probed", formatNames: [], metadataExcluded: true };
  planned.streams = { status: "not_probed", video: [], audio: [], otherStreamCount: 0 };
  assert.equal((await validatePayload(schemaPath, planned)).valid, true);
  assert.deepEqual(validateByKind(planned, { mediaImport }), []);

  const stale = buildRecordedProbe();
  stale.mediaContentHash = "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  assert.match(validateByKind(stale, { mediaImport }).join("\\n"), /mediaContentHash must match/);
});

test("ColorPipelineProfile can only call source metadata verified when it carries exact technical-probe evidence", async () => {
  const profile = structuredClone(colorPipelineProfile);
  const source = profile.sourceMedia[0];
  const probe = buildRecordedProbe();
  probe.mediaImportRef = structuredClone(source.mediaImportRef);
  probe.mediaId = source.mediaId;
  const artifactRef = {
    kind: "cineweave_codex_media_technical_probe",
    id: probe.mediaTechnicalProbeId,
    version: probe.version,
    contentHash: "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
  };
  source.technicalProbeRef = artifactRef;
  source.inputColorSpace = {
    name: "Rec.709",
    assignmentStatus: "verified",
    basis: "embedded_metadata"
  };
  source.metadata = {
    status: "verified",
    primaries: "bt709",
    transfer: "bt709",
    matrix: "bt709",
    range: "tv",
    evidence: {
      method: "container_metadata",
      tool: "ffprobe",
      toolVersion: "8.1.1",
      observedAt: "2026-09-02T13:30:00.000Z"
    }
  };
  assert.equal((await validatePayload(colorSchemaPath, profile)).valid, true);
  assert.deepEqual(validateByKind(profile, {
    mediaTechnicalProbes: [{ artifactRef, payload: probe }]
  }), []);

  const missingProbe = structuredClone(profile);
  delete missingProbe.sourceMedia[0].technicalProbeRef;
  assert.equal((await validatePayload(colorSchemaPath, missingProbe)).valid, false);
  assert.match(validateByKind(missingProbe).join("\\n"), /requires an exact MediaTechnicalProbe/);
});

test("MediaTechnicalProbe CLI records a real local ffprobe report without leaking the source path", async (t) => {
  try {
    await execFile("ffprobe", ["-version"], { windowsHide: true, timeout: 5000 });
  } catch {
    t.skip("ffprobe is not installed on this platform");
    return;
  }
  const root = await mkdtemp(join(tmpdir(), "cineweave-media-technical-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const mediaPath = join(root, "candidate.png");
  const receiptPath = join(root, "receipt.json");
  await writeFile(mediaPath, fixturePng);
  await writeFile(receiptPath, JSON.stringify({
    repository: "https://github.com/cineweave/studio",
    ref: "v2.5.1",
    commit: "0123456789abcdef0123456789abcdef01234567",
    installedBy: "codex-environment",
    usedAt: "2026-09-02T00:00:00.000Z"
  }), "utf8");
  const result = await execFile(process.execPath, [
    join(repoRoot, "scripts", "probe-media-technical.mjs"),
    mediaPath,
    "--media-import-ref", "cineweave_codex_media_import/media-import.cli-fixture@1/sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "--media-id", "media.cli-fixture",
    "--receipt", receiptPath
  ], { windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  const probe = JSON.parse(result.stdout);
  assert.equal(probe.probeStatus, "recorded");
  assert.equal(probe.probeTool.executionState, "ffprobe_recorded");
  assert.equal(probe.mediaByteSize, fixturePng.length);
  assert.equal(probe.streams.video.length, 1);
  assert.equal(JSON.stringify(probe).includes(root), false);
  assert.equal(JSON.stringify(probe).includes("candidate.png"), false);
  assert.deepEqual(validateByKind(probe), []);
  assert.equal((await validatePayload(schemaPath, probe)).valid, true);
});

test("MediaTechnicalProbe CLI reports bounded errors without exposing ffprobe stderr or paths", async (t) => {
  try {
    await execFile("ffprobe", ["-version"], { windowsHide: true, timeout: 5000 });
  } catch {
    t.skip("ffprobe is not installed on this platform");
    return;
  }
  const root = await mkdtemp(join(tmpdir(), "cineweave-media-technical-invalid-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const mediaPath = join(root, "not-media.bin");
  const receiptPath = join(root, "receipt.json");
  await writeFile(mediaPath, "not a media file", "utf8");
  await writeFile(receiptPath, JSON.stringify({
    repository: "https://github.com/cineweave/studio",
    ref: "v2.5.1",
    commit: "0123456789abcdef01234567",
    installedBy: "codex-environment",
    usedAt: "2026-09-02T00:00:00.000Z"
  }), "utf8");
  await assert.rejects(
    execFile(process.execPath, [
      join(repoRoot, "scripts", "probe-media-technical.mjs"),
      mediaPath,
      "--media-import-ref", "cineweave_codex_media_import/media-import.cli-invalid@1/sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "--media-id", "media.cli-invalid",
      "--receipt", receiptPath
    ], { windowsHide: true, maxBuffer: 2 * 1024 * 1024 }),
    (error) => {
      assert.equal(String(error.code), "2");
      assert.equal(error.stdout, "");
      assert.match(error.stderr, /local ffprobe could not complete the technical probe/);
      assert.equal(error.stderr.includes(root), false);
      assert.equal(error.stderr.includes("Invalid data found"), false);
      return true;
    }
  );
});
