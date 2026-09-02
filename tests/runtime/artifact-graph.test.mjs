import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildArtifactGraph, detectDependencyCycles, evaluateApprovalGate } from "../../packages/cineweave-runtime/src/artifact-graph.mjs";
import { initProject, putArtifact, recordApproval } from "../../packages/cineweave-runtime/src/artifact-store.mjs";

const generatedAt = "2026-08-21T08:00:00.000Z";

test("artifact graph preserves exact old dependencies and reports superseded references", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-graph-stale-"));
  try {
    await initProject(root, { projectId: "project.graph-stale", createdAt: generatedAt });
    const sourceV1 = await putArtifact(root, { kind: "source_contract", value: "v1" }, { id: "source.example", version: 1, createdAt: generatedAt });
    const output = await putArtifact(root, { kind: "output_contract", sourceRef: sourceV1.envelope.artifactRef }, { id: "output.example", version: 1, createdAt: generatedAt });
    await putArtifact(root, { kind: "source_contract", value: "v2" }, { id: "source.example", version: 2, createdAt: generatedAt });
    await recordApproval(root, output.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: generatedAt, rationale: "Exact output accepted." });

    const graph = await buildArtifactGraph(root, { generatedAt });
    assert.equal(graph.summary.artifactCount, 3);
    assert.equal(graph.summary.supersededArtifactCount, 1);
    assert.equal(graph.summary.supersededReferenceCount, 1);
    assert.equal(graph.edges[0].status, "resolved");
    assert.equal(graph.edges[0].targetVersionState, "superseded");

    const permissive = await evaluateApprovalGate(root, output.envelope.artifactRef, { generatedAt });
    assert.equal(permissive.gate.allowed, true);
    assert.deepEqual(permissive.gate.warnings, ["superseded_dependency_refs"]);
    const currentOnly = await evaluateApprovalGate(root, output.envelope.artifactRef, { generatedAt, requireCurrent: true });
    assert.equal(currentOnly.gate.allowed, false);
    assert.ok(currentOnly.gate.blockingReasons.includes("superseded_dependency_refs"));
    const approvedDependenciesOnly = await evaluateApprovalGate(root, output.envelope.artifactRef, { generatedAt, requireDependencyApprovals: true });
    assert.equal(approvedDependenciesOnly.gate.allowed, false);
    assert.ok(approvedDependenciesOnly.gate.blockingReasons.includes("unapproved_dependencies"));
    await recordApproval(root, sourceV1.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: "2026-08-21T08:01:00.000Z" });
    const dependencyApproved = await evaluateApprovalGate(root, output.envelope.artifactRef, { generatedAt, requireDependencyApprovals: true });
    assert.equal(dependencyApproved.gate.allowed, true);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("approval gates bind to one exact version and the latest exact decision wins", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-graph-gate-"));
  try {
    await initProject(root, { projectId: "project.graph-gate", createdAt: generatedAt });
    const first = await putArtifact(root, { kind: "review_contract", value: 1 }, { id: "review.example", version: 1, createdAt: generatedAt });
    await recordApproval(root, first.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: "2026-08-21T08:01:00.000Z" });
    const second = await putArtifact(root, { kind: "review_contract", value: 2 }, { id: "review.example", version: 2, createdAt: generatedAt });

    const unreviewed = await evaluateApprovalGate(root, second.envelope.artifactRef, { generatedAt });
    assert.equal(unreviewed.gate.approvalState, "unreviewed");
    assert.equal(unreviewed.gate.allowed, false);
    assert.deepEqual(unreviewed.gate.blockingReasons, ["artifact_unapproved"]);

    await recordApproval(root, second.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: "2026-08-21T08:02:00.000Z" });
    await recordApproval(root, second.envelope.artifactRef, { decision: "rejected", actor: "reviewer", decidedAt: "2026-08-21T08:03:00.000Z" });
    const rejected = await evaluateApprovalGate(root, second.envelope.artifactRef, { generatedAt });
    assert.equal(rejected.gate.approvalState, "rejected");
    assert.equal(rejected.gate.allowed, false);
    assert.deepEqual(rejected.gate.blockingReasons, ["artifact_rejected"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("graph distinguishes missing refs from same-version hash mismatches and scopes closures", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-graph-missing-"));
  try {
    await initProject(root, { projectId: "project.graph-missing", createdAt: generatedAt });
    const source = await putArtifact(root, { kind: "source_contract", value: 1 }, { id: "source.missing-test", version: 1, createdAt: generatedAt });
    const missingRef = { kind: "source_contract", id: "source.absent", version: 1, contentHash: `sha256:${"0".repeat(64)}` };
    const wrongHashRef = { ...source.envelope.artifactRef, contentHash: `sha256:${"f".repeat(64)}` };
    const output = await putArtifact(root, { kind: "output_contract", missingRef, wrongHashRef }, { id: "output.missing-test", version: 1, createdAt: generatedAt });
    await recordApproval(root, output.envelope.artifactRef, { decision: "approved", actor: "reviewer", decidedAt: generatedAt });

    const graph = await buildArtifactGraph(root, { rootArtifactRef: output.envelope.artifactRef, direction: "dependencies", generatedAt });
    assert.equal(graph.nodes.length, 1);
    assert.equal(graph.summary.missingReferenceCount, 1);
    assert.equal(graph.summary.hashMismatchReferenceCount, 1);
    const gate = await evaluateApprovalGate(root, output.envelope.artifactRef, { generatedAt });
    assert.equal(gate.gate.allowed, false);
    assert.ok(gate.gate.blockingReasons.includes("missing_dependencies"));
    assert.ok(gate.gate.blockingReasons.includes("hash_mismatched_dependencies"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("shot lighting and temporal plans form an acyclic downstream fan-out", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-graph-shot-fanout-"));
  try {
    await initProject(root, { projectId: "project.graph-shot-fanout", createdAt: generatedAt });
    const shot = await putArtifact(root, {
      kind: "cineweave_codex_shot_spec",
      shotSpecId: "shot.example",
      purpose: "Stable upstream camera and blocking intent"
    }, { id: "shot.example", version: 1, createdAt: generatedAt });
    await putArtifact(root, {
      kind: "cineweave_codex_shot_lighting_plan",
      shotSpecRef: shot.envelope.artifactRef
    }, { id: "shot-light.example", version: 1, createdAt: generatedAt });
    await putArtifact(root, {
      kind: "cineweave_codex_temporal_spec",
      shotSpecRef: shot.envelope.artifactRef
    }, { id: "temporal.example", version: 1, createdAt: generatedAt });

    const graph = await buildArtifactGraph(root, { generatedAt });
    assert.equal(graph.summary.artifactCount, 3);
    assert.equal(graph.summary.resolvedReferenceCount, 2);
    assert.equal(graph.summary.cycleCount, 0);
    assert.deepEqual(new Set(graph.edges.map((edge) => edge.sourceArtifactRef.kind)), new Set([
      "cineweave_codex_shot_lighting_plan",
      "cineweave_codex_temporal_spec"
    ]));
    assert.ok(graph.edges.every((edge) => edge.targetArtifactRef.kind === "cineweave_codex_shot_spec"));
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("cycle detector returns deterministic strongly connected components", () => {
  const edges = [
    { sourceKey: "artifact.a", targetKey: "artifact.b", status: "resolved" },
    { sourceKey: "artifact.b", targetKey: "artifact.a", status: "resolved" },
    { sourceKey: "artifact.c", targetKey: "artifact.c", status: "resolved" }
  ];
  assert.deepEqual(detectDependencyCycles(["artifact.c", "artifact.b", "artifact.a", "artifact.d"], edges), [
    ["artifact.a", "artifact.b"],
    ["artifact.c"]
  ]);
});
