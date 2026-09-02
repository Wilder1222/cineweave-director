#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initProject, listArtifacts, putArtifact, readStrictJson, recordApproval, verifyProject } from "../src/artifact-store.mjs";
import { createAdapterRegistry, executeRequest } from "../src/adapter-runtime.mjs";
import { buildArtifactGraph, evaluateApprovalGate, loadEnvelopeArtifactRef } from "../src/artifact-graph.mjs";
import { sha256Canonical } from "../src/canonical-json.mjs";
import { fixtureSvgAdapter } from "../src/fixture-svg-adapter.mjs";
import { exportProjectBundle, importProjectBundle, verifyProjectBundle } from "../src/project-bundle.mjs";
import { ingestReferenceAsset, verifyReferenceAsset } from "../src/reference-assets.mjs";
import { compileShotPlan, listAtomicCinematicSkills } from "../src/cinematic-skill-runtime.mjs";
import { resolveCapabilityPlan } from "../src/capability-resolution-runtime.mjs";
import { createExecutionPreview } from "../src/execution-preview-runtime.mjs";

function parseArgs(values) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) positional.push(value);
    else {
      const key = value.slice(2);
      const next = values[index + 1];
      if (!next || next.startsWith("--")) flags[key] = true;
      else { flags[key] = next; index += 1; }
    }
  }
  return { positional, flags };
}

function usage() {
  return [
    "cineweave-studio init <project> --id <project-id> --name <name>",
    "cineweave-studio hash <json-file>",
    "cineweave-studio put <project> <json-file> --id <id> [--kind <kind>] [--version <n>]",
    "cineweave-studio approve <project> <artifact-envelope> --decision approved|rejected --actor <name> [--rationale <text>]",
    "cineweave-studio adapters",
    "cineweave-studio execute <project> <execution-request-envelope>",
    "cineweave-studio list <project>",
    "cineweave-studio verify <project>",
    "cineweave-studio graph <project> [artifact-envelope] [--direction dependencies|dependents|both]",
    "cineweave-studio stale <project>",
    "cineweave-studio gate <project> <artifact-envelope> [--require-current] [--require-dependency-approvals]",
    "cineweave-studio reference-ingest <project> <media-file> [--source-class user_upload|local_file|generated_output|external_download] [--max-bytes <n>]",
    "cineweave-studio reference-verify <project> <reference-asset-envelope>",
    "cineweave-studio cinematic-skills <manifest-json>",
    "cineweave-studio shot-compile <manifest-json> <invocation-json> [--alias-registry <registry-json>]",
    "cineweave-studio capability-resolve <request-json> <candidates-json>",
    "cineweave-studio execution-preview <execution-request-json> <capability-resolution-plan-json> <adapter-descriptor-json> <capability-profile-json> --estimated-amount <n>",
    "cineweave-studio export <project> <bundle-directory>",
    "cineweave-studio import <bundle-directory> <project>",
    "cineweave-studio bundle-verify <bundle-directory>"
  ].join("\n");
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  if (command === "init") {
    if (!positional[0]) throw new Error(usage());
    console.log(JSON.stringify(await initProject(resolve(positional[0]), { projectId: flags.id, name: flags.name }), null, 2));
    return;
  }
  if (command === "hash") {
    if (!positional[0]) throw new Error(usage());
    console.log(sha256Canonical(await readStrictJson(resolve(positional[0]))));
    return;
  }
  if (command === "put") {
    if (!positional[0] || !positional[1] || !flags.id) throw new Error(usage());
    const payload = await readStrictJson(resolve(positional[1]));
    const result = await putArtifact(resolve(positional[0]), payload, {
      id: flags.id,
      kind: flags.kind || payload.kind,
      version: flags.version ? Number(flags.version) : 1,
      status: flags.status,
      createdBy: flags["created-by"]
    });
    console.log(JSON.stringify(result.envelope, null, 2));
    return;
  }
  if (command === "approve") {
    if (!positional[0] || !positional[1] || !flags.decision || !flags.actor) throw new Error(usage());
    const envelope = await readStrictJson(resolve(positional[1]));
    const result = await recordApproval(resolve(positional[0]), envelope.artifactRef, {
      decision: flags.decision,
      actor: flags.actor,
      rationale: flags.rationale
    });
    console.log(JSON.stringify(result.record, null, 2));
    return;
  }
  if (command === "adapters") {
    const registry = createAdapterRegistry([fixtureSvgAdapter]);
    console.log(JSON.stringify(registry.list(), null, 2));
    return;
  }
  if (command === "execute") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const envelope = await readStrictJson(resolve(positional[1]));
    if (envelope.kind !== "cineweave_artifact_envelope" || !envelope.artifactRef) throw new Error("Expected an immutable ExecutionRequest artifact envelope");
    const registry = createAdapterRegistry([fixtureSvgAdapter]);
    const result = await executeRequest(resolve(positional[0]), envelope.artifactRef, registry, { allowExternal: false });
    console.log(JSON.stringify(result.envelope, null, 2));
    if (["blocked", "failed"].includes(result.envelope.payload.status)) process.exitCode = 3;
    return;
  }
  if (command === "list") {
    if (!positional[0]) throw new Error(usage());
    const artifacts = await listArtifacts(resolve(positional[0]));
    console.log(JSON.stringify(artifacts.map(({ path, envelope }) => ({ path, artifactRef: envelope.artifactRef, status: envelope.status })), null, 2));
    return;
  }
  if (command === "verify") {
    if (!positional[0]) throw new Error(usage());
    const report = await verifyProject(resolve(positional[0]));
    console.log(JSON.stringify(report, null, 2));
    if (!report.valid) process.exitCode = 1;
    return;
  }
  if (command === "graph") {
    if (!positional[0]) throw new Error(usage());
    const rootArtifactRef = positional[1] ? await loadEnvelopeArtifactRef(positional[1]) : null;
    const graph = await buildArtifactGraph(resolve(positional[0]), {
      rootArtifactRef,
      direction: flags.direction || (rootArtifactRef ? "dependencies" : "both")
    });
    console.log(JSON.stringify(graph, null, 2));
    return;
  }
  if (command === "stale") {
    if (!positional[0]) throw new Error(usage());
    const graph = await buildArtifactGraph(resolve(positional[0]));
    const staleReferences = graph.edges.filter((edge) => edge.status === "resolved" && edge.targetVersionState === "superseded");
    console.log(JSON.stringify({
      projectId: graph.project.projectId,
      generatedAt: graph.generatedAt,
      staleReferenceCount: staleReferences.length,
      staleReferences
    }, null, 2));
    return;
  }
  if (command === "gate") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const artifactRef = await loadEnvelopeArtifactRef(positional[1]);
    const graph = await evaluateApprovalGate(resolve(positional[0]), artifactRef, {
      requireCurrent: flags["require-current"] === true,
      requireDependencyApprovals: flags["require-dependency-approvals"] === true
    });
    console.log(JSON.stringify(graph, null, 2));
    if (!graph.gate.allowed) process.exitCode = 3;
    return;
  }
  if (command === "reference-ingest") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const result = await ingestReferenceAsset(resolve(positional[0]), resolve(positional[1]), {
      sourceClass: flags["source-class"],
      maxBytes: flags["max-bytes"],
      createdBy: flags["created-by"]
    });
    console.log(JSON.stringify({ duplicate: result.duplicate, envelope: result.envelope, verification: result.verification }, null, 2));
    return;
  }
  if (command === "reference-verify") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const artifactRef = await loadEnvelopeArtifactRef(positional[1]);
    console.log(JSON.stringify(await verifyReferenceAsset(resolve(positional[0]), artifactRef), null, 2));
    return;
  }
  if (command === "cinematic-skills") {
    if (!positional[0]) throw new Error(usage());
    const manifest = await readStrictJson(resolve(positional[0]));
    console.log(JSON.stringify(listAtomicCinematicSkills(manifest), null, 2));
    return;
  }
  if (command === "shot-compile") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const manifest = await readStrictJson(resolve(positional[0]));
    const invocation = await readStrictJson(resolve(positional[1]));
    const options = {};
    if (flags["alias-registry"]) options.assetAliasRegistry = await readStrictJson(resolve(flags["alias-registry"]));
    console.log(JSON.stringify(compileShotPlan(manifest, invocation, options), null, 2));
    return;
  }
  if (command === "capability-resolve") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const request = await readStrictJson(resolve(positional[0]));
    const candidateDocument = await readStrictJson(resolve(positional[1]));
    const candidates = Array.isArray(candidateDocument) ? candidateDocument : candidateDocument.candidates;
    console.log(JSON.stringify(resolveCapabilityPlan(request, candidates, {
      ...(flags["created-at"] ? { createdAt: flags["created-at"] } : {})
    }), null, 2));
    return;
  }
  if (command === "execution-preview") {
    if (!positional[0] || !positional[1] || !positional[2] || !positional[3] || flags["estimated-amount"] === true) throw new Error(usage());
    const request = await readStrictJson(resolve(positional[0]));
    const resolutionPlan = await readStrictJson(resolve(positional[1]));
    const adapterDescriptor = await readStrictJson(resolve(positional[2]));
    const capabilityProfile = await readStrictJson(resolve(positional[3]));
    const estimatedAmount = Number(flags["estimated-amount"]);
    if (!Number.isFinite(estimatedAmount)) throw new Error("--estimated-amount must be a finite number");
    const requestRef = {
      kind: request.kind,
      id: request.requestId,
      version: request.version,
      contentHash: sha256Canonical(request)
    };
    const resolutionRef = {
      kind: resolutionPlan.kind,
      id: resolutionPlan.resolutionPlanId,
      version: resolutionPlan.version,
      contentHash: sha256Canonical(resolutionPlan)
    };
    console.log(JSON.stringify(createExecutionPreview(request, resolutionPlan, {
      executionRequestRef: requestRef,
      capabilityResolutionPlanRef: resolutionRef,
      adapterDescriptor,
      capabilityProfile,
      estimatedAmount,
      ...(flags["created-at"] ? { createdAt: flags["created-at"] } : {})
    }), null, 2));
    return;
  }
  if (command === "export") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const result = await exportProjectBundle(resolve(positional[0]), resolve(positional[1]));
    console.log(JSON.stringify({ path: result.path, manifest: result.manifest }, null, 2));
    return;
  }
  if (command === "import") {
    if (!positional[0] || !positional[1]) throw new Error(usage());
    const result = await importProjectBundle(resolve(positional[0]), resolve(positional[1]));
    console.log(JSON.stringify({ path: result.path, manifest: result.manifest, verification: result.verification }, null, 2));
    return;
  }
  if (command === "bundle-verify") {
    if (!positional[0]) throw new Error(usage());
    console.log(JSON.stringify(await verifyProjectBundle(resolve(positional[0])), null, 2));
    return;
  }
  throw new Error(usage());
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; });
}
