import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findArtifact, initProject, putArtifact, recordApproval, verifyProject } from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { validateDocument } from "../../scripts/validate-output.mjs";

test("artifact store is immutable, hash-verifiable and approval-bound", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-test-"));
  try {
    await initProject(root, { projectId: "project.runtime-test", name: "Runtime Test", createdAt: "2026-08-21T00:00:00.000Z" });
    const first = await putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.example", kind: "example_contract", version: 1, createdAt: "2026-08-21T00:00:00.000Z" });
    const repeated = await putArtifact(root, { value: 1, kind: "example_contract" }, { id: "artifact.example", kind: "example_contract", version: 1, createdAt: "2026-08-21T00:09:00.000Z" });
    assert.equal(first.envelope.artifactRef.contentHash, repeated.envelope.artifactRef.contentHash);
    assert.equal(repeated.envelope.createdAt, "2026-08-21T00:00:00.000Z");
    await assert.rejects(() => putArtifact(root, { kind: "example_contract", value: 2 }, { id: "artifact.example", kind: "example_contract", version: 1 }), /Version conflict/);
    await recordApproval(root, first.envelope.artifactRef, { decision: "approved", actor: "tester", decidedAt: "2026-08-21T00:01:00.000Z", rationale: "Fixture accepted." });
    assert.deepEqual(await verifyProject(root), { valid: true, artifacts: 1, approvals: 1, referenceBlobs: 0, errors: [] });
    const tampered = JSON.parse(await readFile(first.path, "utf8"));
    tampered.payload.value = 3;
    await writeFile(first.path, JSON.stringify(tampered, null, 2), "utf8");
    const report = await verifyProject(root);
    assert.equal(report.valid, false);
    assert.match(report.errors.join("\n"), /hash mismatch/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("concurrent writers cannot occupy one version with different hashes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-race-"));
  try {
    await initProject(root, { projectId: "project.runtime-race", name: "Runtime Race", createdAt: "2026-08-21T00:00:00.000Z" });
    const results = await Promise.allSettled([
      putArtifact(root, { kind: "example_contract", value: "left" }, { id: "artifact.race", version: 1 }),
      putArtifact(root, { kind: "example_contract", value: "right" }, { id: "artifact.race", version: 1 })
    ]);
    assert.equal(results.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal(results.filter((item) => item.status === "rejected").length, 1);
    assert.match(results.find((item) => item.status === "rejected").reason.message, /Version conflict/);
    const report = await verifyProject(root);
    assert.equal(report.valid, true);
    assert.equal(report.artifacts, 1);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("exact reads reject malformed refs and tampered envelope or version pointers", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-ref-"));
  try {
    await initProject(root, { projectId: "project.runtime-ref", createdAt: "2026-08-21T00:00:00.000Z" });
    const stored = await putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.ref", version: 1, createdAt: "2026-08-21T00:00:00.000Z" });
    await assert.rejects(() => findArtifact(root, { ...stored.envelope.artifactRef, version: "../../escape" }), /positive safe integer/);

    const originalEnvelope = await readFile(stored.path, "utf8");
    const changedEnvelope = JSON.parse(originalEnvelope);
    changedEnvelope.artifactRef.id = "artifact.other";
    await writeFile(stored.path, JSON.stringify(changedEnvelope, null, 2), "utf8");
    await assert.rejects(() => findArtifact(root, stored.envelope.artifactRef), /envelope reference mismatch/);
    await writeFile(stored.path, originalEnvelope, "utf8");

    const pointerPath = join(root, ".cineweave", "artifacts", "example_contract", "artifact.ref", "v1.ref");
    const changedPointer = JSON.parse(await readFile(pointerPath, "utf8"));
    changedPointer.id = "artifact.other";
    await writeFile(pointerPath, JSON.stringify(changedPointer, null, 2), "utf8");
    await assert.rejects(() => findArtifact(root, stored.envelope.artifactRef), /pointer mismatch/);
    const report = await verifyProject(root);
    assert.equal(report.valid, false);
    assert.match(report.errors.join("\n"), /version pointer/i);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("concurrent project initialization returns one immutable manifest", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-init-"));
  try {
    const results = await Promise.all([
      initProject(root, { projectId: "project.runtime-init", name: "First", createdAt: "2026-08-21T00:00:00.000Z" }),
      initProject(root, { projectId: "project.runtime-init", name: "Second", createdAt: "2026-08-21T00:00:01.000Z" })
    ]);
    assert.deepEqual(results[0], results[1]);
    assert.match(results[0].name, /First|Second/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("V2.5 opens a V2.2 project non-destructively and preserves schema validity", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-v22-"));
  try {
    const store = join(root, ".cineweave");
    await mkdir(store, { recursive: true });
    const projectPath = join(store, "project.json");
    await writeFile(projectPath, JSON.stringify({
      kind: "cineweave_project_manifest",
      contractVersion: "2.2.0",
      projectId: "project.v22-compatible",
      name: "V2.2 compatible project",
      createdAt: "2026-08-21T00:00:00.000Z",
      runtimeVersion: "2.2.0",
      storage: { mode: "local_immutable", artifactDirectory: "artifacts", approvalDirectory: "approvals" }
    }, null, 2), "utf8");
    const schemaPath = join(process.cwd(), "packages", "cineweave-contracts", "schemas", "project-manifest.schema.json");
    assert.equal((await validateDocument(schemaPath, projectPath)).valid, true);

    const opened = await initProject(root, { projectId: "project.must-not-replace" });
    assert.equal(opened.contractVersion, "2.2.0");
    assert.equal(opened.projectId, "project.v22-compatible");
    const artifact = await putArtifact(root, { kind: "example_contract", value: "created-by-v24" }, { id: "artifact.v24-on-v22", version: 1 });
    assert.equal(artifact.envelope.contractVersion, "2.5.0");
    assert.equal((await verifyProject(root)).valid, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("explicit empty metadata is rejected instead of silently defaulted", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-explicit-values-"));
  try {
    await assert.rejects(
      () => initProject(root, { projectId: "project.explicit-values", name: "" }),
      /name must contain/,
    );

    await initProject(root, { projectId: "project.explicit-values", name: "Explicit Values" });
    await assert.rejects(
      () => putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.explicit", version: 0 }),
      /version must be a positive safe integer/,
    );
    await assert.rejects(
      () => putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.explicit", status: "" }),
      /status is invalid/,
    );

    const artifact = await putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.explicit" });
    await assert.rejects(
      () => recordApproval(root, artifact.envelope.artifactRef, { decision: "approved", actor: "tester", rationale: "" }),
      /rationale must contain/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("exact artifact reads reject symlinked records", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-runtime-symlink-"));
  try {
    await initProject(root, { projectId: "project.symlink-read" });
    const stored = await putArtifact(root, { kind: "example_contract", value: 1 }, { id: "artifact.symlink-read" });
    const outside = join(root, "outside.json");
    await writeFile(outside, await readFile(stored.path), "utf8");
    await rm(stored.path);
    try {
      await symlink(outside, stored.path, "file");
    } catch (error) {
      if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) {
        t.skip("platform does not permit an unprivileged symlink fixture");
        return;
      }
      throw error;
    }
    await assert.rejects(() => findArtifact(root, stored.envelope.artifactRef), /regular non-link file/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
