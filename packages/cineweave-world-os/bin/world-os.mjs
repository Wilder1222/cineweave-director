#!/usr/bin/env node

import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { findArtifact, listArtifacts } from "../../cineweave-runtime/src/artifact-store.mjs";
import { readJson } from "../src/json.mjs";
import {
  createLocalFixtureResponse,
  listOutbox,
  recordPublishReceipt
} from "../src/outbox.mjs";
import { reviewWorkspace } from "../src/review.mjs";
import { deriveStreamHead, rebuildSeedStore, reconcilePlatformProjections, runEventProposal, verifyWorldOsProject } from "../src/store.mjs";
import { scanTriggerCatalog } from "../src/triggers.mjs";
import { advanceWorld, forecastWorld } from "../src/scheduler.mjs";
import { auditWorldOsProject } from "../src/audit.mjs";
import { createGateRequest, promoteCanon, recordGateDecision, resumeSimulation, deriveCanonHead } from "../src/canon.mjs";
import { resumeTemplateWorkItem, submitEventTemplateCatalog } from "../src/dynamic.mjs";
import { ingestExternalSignal, listExternalSignals, listExternalSignalUses, recordExternalSignalUse } from "../src/signals.mjs";
import { advancePortfolio } from "../src/portfolio.mjs";
import { dispatchOutbox, listMcpAttempts, listMcpClaims } from "../src/mcp.mjs";
import { createMcpHttpConnector } from "../src/mcp-http.mjs";
import { listLlmShadowReceipts, runLlmShadow } from "../src/shadow.mjs";
import { createOpenAiCompatibleProvider } from "../src/llm-http.mjs";
import { inspectCodexBrain, listCodexBrainRuns, runCodexBrainCycle } from "../src/brain.mjs";
import { CODEX_BRAIN_HTTP_ROUTES, createCodexBrainHttpServer } from "../src/http-api.mjs";
import { activateWorld, createWorld, listWorldInceptionDecisions, listWorldRegistrations, recordWorldInceptionDecision } from "../src/registry.mjs";
import { activateBrandEcho, createBrandEcho, listBrandEchoDecisions, listBrandEchoes, recordBrandEchoDecision } from "../src/brand.mjs";
import { activateProductionStage, createProductionSlice, listProductionGateDecisions, listProductionSlices, recordProductionGateDecision } from "../src/production.mjs";
import {
  compileProductionExecutionRequest,
  executeProductionRequest,
  listProductionExecutionRequests
} from "../src/production-execution.mjs";
import {
  createProductionMediaImport,
  listProductionMediaImports
} from "../src/production-media.mjs";
import {
  createProductionQaReview,
  createApprovedAsset,
  createPrivateReleaseReceipt,
  listProductionQaReviews,
  listApprovedAssets,
  listPrivateReleaseReceipts
} from "../src/production-release.mjs";
import { createAdapterRegistry } from "../../cineweave-runtime/src/adapter-runtime.mjs";
import { fixtureSvgAdapter } from "../../cineweave-runtime/src/fixture-svg-adapter.mjs";
import { WORLD_OS_VERSION } from "../src/constants.mjs";

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

async function readRefList(value) {
  if (!value || value === true) return [];
  const paths = String(value).split(",").map((item) => item.trim()).filter(Boolean);
  const refs = [];
  for (const path of paths) {
    const document = await readJson(resolve(path));
    refs.push(document.artifactRef || document);
  }
  return refs;
}

function usage() {
  return [
    "world-os review <workspace.json> [--json] [--strict]",
    "world-os rebuild <seed-manifest.json> <project-directory>",
    "world-os simulate <project-directory> <event-proposal.json>",
    "world-os outbox <project-directory> <platform-profile.json>",
    "world-os reconcile <project-directory> <platform-profile.json>",
    "world-os ack <project-directory> <projection-ref.json> <platform-response.json>",
    "world-os publish-local <project-directory> <platform-profile.json> [--received-at <ISO>]",
    "world-os head <project-directory> <world-id> [--stream <stream-id>]",
    "world-os triggers <project-directory> <trigger-catalog.json>",
    "world-os actions <project-directory> <world-id>",
    "world-os step <project-directory> <world-id>",
    "world-os run <project-directory> <world-id> [--max-steps <1..100>]",
    "world-os gate-request <project-directory> <decision-ref.json>",
    "world-os gate-decide <project-directory> <gate-request-ref.json> --decision <approve|reject|revise> --actor <id> [--role <role>] [--rationale <text>]",
    "world-os resume <project-directory> <gate-decision-ref.json>",
    "world-os promote <project-directory> <gate-decision-ref.json>",
    "world-os canon-head <project-directory> <world-id>",
    "world-os template-submit <project-directory> <event-template-catalog.json>",
    "world-os template-resume <project-directory> <work-item-ref.json> <event-template-catalog.json>",
    "world-os signal-ingest <project-directory> <external-signal.json>",
    "world-os signals <project-directory> [--world-id <W##>]",
    "world-os signal-use <project-directory> <signal-ref.json> --outcome <used_as_evidence|deferred_for_context|dismissed_as_noise> [--proposal <proposal-ref.json>]",
    "world-os signal-uses <project-directory> [--world-id <W##>] [--outcome <outcome>]",
    "world-os create-world <project-directory> <candidate-card.json> [--allocation-share <1..100>]",
    "world-os world-registrations <project-directory> [--world-id <W##>]",
    "world-os world-inception-decide <project-directory> <registration-ref.json> --decision <approve|reject|revise> --actor <id> [--rationale <text>] [--decided-at <ISO>]",
    "world-os world-inception-decisions <project-directory> [--registration-ref <registration-ref.json>]",
    "world-os world-activate <project-directory> <registration-ref.json> <decision-ref.json> <world-design.json> <state.json> <trigger-catalog.json> <action-catalog.json> <event-template-catalog.json> [--platform <platform-profile.json>] [--stage <world_bible_draft|prototype>]",
    "world-os brand-echo-create <project-directory> --worlds <W01,W02,...> --symbol-id <id> --surface <text> --intent <text> [--created-at <ISO>]",
    "world-os brand-echoes <project-directory> [--status <proposed|approved|retired>]",
    "world-os brand-echo-decide <project-directory> <echo-ref.json> --decision <approve|reject|revise> --actor <id> [--rationale <text>] [--decided-at <ISO>]",
    "world-os brand-echo-decisions <project-directory> [--echo-ref <echo-ref.json>]",
    "world-os brand-echo-activate <project-directory> <echo-ref.json> <decision-ref.json>",
    "world-os production-slice-create <project-directory> <production-manifest.json>",
    "world-os production-slices <project-directory> [--world-id <W##>] [--status <proposed|approved|released|blocked>]",
    "world-os production-gate-decide <project-directory> <slice-ref.json> --gate <story_ready|character_identity|scene_geography|style_activation|rights|qa|release> --decision <approve|reject|revise> --actor <id> [--rationale <text>] [--evidence <ref.json,...>]",
    "world-os production-gates <project-directory> <slice-ref.json>",
    "world-os production-stage-activate <project-directory> <slice-ref.json> <decision-ref.json>",
    "world-os production-execution-plan <project-directory> <slice-ref.json> <execution-manifest.json>",
    "world-os production-execution-requests <project-directory> [--world-id <W##>] [--status <ready|blocked>]",
    "world-os production-execution-run <project-directory> <request-ref.json> [--adapter <adapter.mjs>] [--allow-external]",
    "world-os production-media-import <project-directory> <request-ref.json> <execution-receipt-ref.json> [--media-type <still|storyboard_frame|keyframe_candidate>] [--source <codex_interactive|user_upload|external_adapter>]",
    "world-os production-media-imports <project-directory> [--world-id <W##>] [--status <candidate|blocked>]",
    "world-os production-qa-review <project-directory> <qa-pending-slice-ref.json> --decision <approve|reject|revise> --actor <id> --checklist <checklist.json> --media <binding-ref.json,...> [--qa-snapshots <ref.json,...>] [--rationale <text>]",
    "world-os production-qa-reviews <project-directory> [--world-id <W##>] [--status <approved|rejected|needs_revision>]",
    "world-os production-approved-asset <project-directory> <approved-asset-slice-ref.json> <qa-review-ref.json>",
    "world-os production-approved-assets <project-directory> [--world-id <W##>]",
    "world-os production-private-release <project-directory> <released-slice-ref.json> <approved-asset-ref.json,...> --actor <id> [--destination <id>] [--publish-receipts <ref.json,...>]",
    "world-os production-private-releases <project-directory> [--world-id <W##>]",
    "world-os dispatch <project-directory> <platform-profile.json> [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--allow-network] [--dry-run] [--max-attempts <1..10>] [--timeout <ms>]",
    "world-os mcp-claims <project-directory>",
    "world-os mcp-attempts <project-directory>",
    "world-os llm-shadow <project-directory> <simulation-request.json> <provider-policy.json> [<provider.mjs> | --http-endpoint <url> --model <alias> --llm-trusted --api-key-env <ENV>] [--allow-network] [--force-retry]",
    "world-os llm-shadow-runs <project-directory> [--world-id <W##>] [--provider-id <id>]",
    "world-os portfolio-run <project-directory> [--worlds <W01,W02>] [--max-cycles <1..100>]",
    "world-os brain-run <project-directory> [--worlds <W01,W02>] [--max-cycles <1..100>] [--run-key <idempotency-key>] [--resume-portfolio <portfolio-receipt.json>] [--platform <platform-profile.json>] [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--allow-network] [--dry-run] [--no-dispatch] [--shadow-request <simulation-request.json> --shadow-policy <provider-policy.json> [--shadow-provider <provider.mjs> | --shadow-endpoint <url> --shadow-model <alias> --shadow-llm-trusted --shadow-api-key-env <ENV>]]",
    "world-os brain-status <project-directory> [--worlds <W01,W02>]",
    "world-os forecast <project-directory> --worlds <W01,W02>",
    "world-os brain-runs <project-directory>",
    "world-os serve <project-directory> [--host <127.0.0.1>] [--port <0..65535>] [--token-env <ENV>] [--allow-network] [--connector <connector.mjs> | --http-endpoint <url> --http-trusted --api-key-env <ENV>] [--shadow-profiles <profiles.mjs>] [--allow-llm-network]",
    "world-os audit <project-directory>",
    "world-os recover <project-directory> <platform-profile.json>",
    "world-os verify <project-directory>"
  ].join("\n");
}

function printReview(report, asJson) {
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  console.log(`${report.status.toUpperCase()} ${report.workspaceId || "unknown workspace"}: ${report.summary.error} error, ${report.summary.warning} warning`);
  for (const item of report.issues) console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path} ${item.message}`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  if (command === "review") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const report = await reviewWorkspace(resolve(positional[0]), { strict: flags.strict === true });
    printReview(report, flags.json === true);
    if (report.status === "fail") process.exitCode = 2;
    return;
  }
  if (command === "rebuild") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await rebuildSeedStore(resolve(positional[0]), resolve(positional[1]));
    console.log(JSON.stringify({
      projectRoot: result.projectRoot,
      projectId: result.manifest.project.id,
      artifactCount: result.verification.artifacts,
      graph: result.graph.summary,
      review: result.review.summary
    }, null, 2));
    return;
  }
  if (command === "simulate") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await runEventProposal(resolve(positional[0]), resolve(positional[1]));
    console.log(JSON.stringify({ status: result.status, stored: result.stored, checks: result.decision.checks }, null, 2));
    if (result.status === "rejected") process.exitCode = 2;
    if (result.status === "needs_human_gate") process.exitCode = 3;
    return;
  }
  if (command === "outbox") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const platform = await readJson(resolve(positional[1]));
    console.log(JSON.stringify(await listOutbox(resolve(positional[0]), platform), null, 2));
    return;
  }
  if (command === "reconcile") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const platform = await readJson(resolve(positional[1]));
    const result = await reconcilePlatformProjections(resolve(positional[0]), platform);
    console.log(JSON.stringify({
      platformProfileRef: result.platformProfileRef,
      created: result.created,
      existing: result.existing.length,
      ignored: result.ignored
    }, null, 2));
    return;
  }
  if (command === "ack") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const referenceDocument = await readJson(resolve(positional[1]));
    const ref = referenceDocument.artifactRef || referenceDocument;
    const projection = await findArtifact(resolve(positional[0]), ref);
    const response = await readJson(resolve(positional[2]));
    const stored = await recordPublishReceipt(resolve(positional[0]), projection, response);
    console.log(JSON.stringify(stored.envelope, null, 2));
    return;
  }
  if (command === "publish-local") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const platform = await readJson(resolve(positional[1]));
    const outbox = await listOutbox(project, platform);
    const receipts = [];
    for (const entry of outbox.entries.filter((item) => item.status === "pending")) {
      const projection = await findArtifact(project, entry.projectionRef);
      const response = createLocalFixtureResponse(entry.dispatch, flags["received-at"] || "2026-08-22T08:05:00.000Z");
      const stored = await recordPublishReceipt(project, projection, response);
      receipts.push(stored.envelope.artifactRef);
    }
    console.log(JSON.stringify({ transport: "local_fixture_only", published: receipts.length, receipts }, null, 2));
    return;
  }
  if (command === "verify") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await verifyWorldOsProject(resolve(positional[0]));
    console.log(JSON.stringify({ verification: result.verification, graph: result.graph.summary }, null, 2));
    return;
  }
  if (command === "head") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const head = await deriveStreamHead(resolve(positional[0]), positional[1], flags.stream || "simulation.main");
    console.log(JSON.stringify(head ? { commitRef: head.commitRef, stateRef: head.stateRef } : { commitRef: null, stateRef: null }, null, 2));
    return;
  }
  if (command === "triggers") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const catalog = await readJson(resolve(positional[1]));
    const head = await deriveStreamHead(project, catalog.worldId, "simulation.main");
    const stateItem = await findArtifact(project, head?.stateRef || catalog.initialStateRef);
    console.log(JSON.stringify(scanTriggerCatalog(catalog, stateItem.envelope.payload), null, 2));
    return;
  }
  if (command === "actions") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const artifacts = await listArtifacts(resolve(positional[0]));
    const catalogs = artifacts
      .filter((item) => item.envelope.payload?.kind === "world_os_action_catalog" && item.envelope.payload.worldId === positional[1])
      .sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version);
    if (!catalogs.length) throw new Error(`No action catalog for ${positional[1]}`);
    console.log(JSON.stringify({
      actionCatalogRef: catalogs[0].envelope.artifactRef,
      actions: catalogs[0].envelope.payload.actions.map((action) => ({
        id: action.id,
        actorId: action.actorId,
        triggerIds: action.applicableTriggerIds,
        gatePolicy: action.gatePolicy,
        canonImpactCeiling: action.canonImpactCeiling
      }))
    }, null, 2));
    return;
  }
  if (command === "step" || command === "run") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await advanceWorld(resolve(positional[0]), positional[1], {
      maxSteps: command === "step" ? 1 : Number(flags["max-steps"] || 20)
    });
    console.log(JSON.stringify({
      status: result.status,
      stopReason: result.stopReason,
      committedSteps: result.committedSteps,
      attemptedSteps: result.attemptedSteps,
      startSequence: result.startSequence,
      endSequence: result.endSequence,
      receiptRef: result.receiptRef,
      steps: result.steps
    }, null, 2));
    if (["needs_human_gate", "awaiting_codex_template", "committed_projection_pending"].includes(result.stopReason)) process.exitCode = 3;
    if (["all_candidates_rejected", "stale_after_race"].includes(result.stopReason)) process.exitCode = 2;
    return;
  }
  if (command === "audit") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await auditWorldOsProject(resolve(positional[0]));
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "gate-request") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    const ref = document.artifactRef || document;
    console.log(JSON.stringify(await createGateRequest(resolve(positional[0]), ref), null, 2));
    return;
  }
  if (command === "gate-decide") {
    if (!positional[0] || !positional[1] || !flags.decision || !flags.actor) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    const ref = document.artifactRef || document;
    console.log(JSON.stringify(await recordGateDecision(resolve(positional[0]), ref, {
      decision: flags.decision,
      actorId: flags.actor,
      actorRole: flags.role,
      rationale: flags.rationale || "Human Gate decision recorded by the Canon owner.",
      decidedAt: flags["decided-at"]
    }), null, 2));
    return;
  }
  if (command === "resume") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    const ref = document.artifactRef || document;
    console.log(JSON.stringify(await resumeSimulation(resolve(positional[0]), ref), null, 2));
    return;
  }
  if (command === "promote") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    const ref = document.artifactRef || document;
    console.log(JSON.stringify(await promoteCanon(resolve(positional[0]), ref), null, 2));
    return;
  }
  if (command === "canon-head") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const head = await deriveCanonHead(resolve(positional[0]), positional[1]);
    console.log(JSON.stringify(head ? { ledgerRef: head.ledgerRef, ledger: head.ledger } : { ledgerRef: null, ledger: null }, null, 2));
    return;
  }
  if (command === "template-submit") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await submitEventTemplateCatalog(resolve(positional[0]), await readJson(resolve(positional[1]))), null, 2));
    return;
  }
  if (command === "template-resume") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const work = await readJson(resolve(positional[1]));
    const ref = work.artifactRef || work;
    console.log(JSON.stringify(await resumeTemplateWorkItem(resolve(positional[0]), ref, await readJson(resolve(positional[2]))), null, 2));
    return;
  }
  if (command === "signal-ingest") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    console.log(JSON.stringify(await ingestExternalSignal(resolve(positional[0]), document), null, 2));
    return;
  }
  if (command === "signals") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listExternalSignals(resolve(positional[0]), { worldId: flags["world-id"] }), null, 2));
    return;
  }
  if (command === "signal-use") {
    if (!positional[0] || !positional[1] || !flags.outcome) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const signalDocument = await readJson(resolve(positional[1]));
    const signalRef = signalDocument.artifactRef || signalDocument;
    let proposalRef = null;
    if (flags.proposal) {
      const proposalDocument = await readJson(resolve(String(flags.proposal)));
      proposalRef = proposalDocument.artifactRef || proposalDocument;
    }
    console.log(JSON.stringify(await recordExternalSignalUse(resolve(positional[0]), {
      signalRef,
      proposalRef,
      outcome: String(flags.outcome),
      recordedAt: flags["recorded-at"]
    }), null, 2));
    return;
  }
  if (command === "signal-uses") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listExternalSignalUses(resolve(positional[0]), {
      worldId: flags["world-id"],
      outcome: flags.outcome
    }), null, 2));
    return;
  }
  if (command === "create-world") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const candidate = await readJson(resolve(positional[1]));
    const result = await createWorld(resolve(positional[0]), candidate, {
      allocationShare: flags["allocation-share"] === undefined ? undefined : Number(flags["allocation-share"]),
      createdAt: flags["created-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "world-registrations") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listWorldRegistrations(resolve(positional[0]), { worldId: flags["world-id"] }), null, 2));
    return;
  }
  if (command === "world-inception-decide") {
    if (!positional[0] || !positional[1] || !flags.decision || !flags.actor) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const registrationDocument = await readJson(resolve(positional[1]));
    const registrationRef = registrationDocument.artifactRef || registrationDocument;
    const result = await recordWorldInceptionDecision(resolve(positional[0]), registrationRef, {
      decision: String(flags.decision),
      actorId: String(flags.actor),
      rationale: flags.rationale,
      decidedAt: flags["decided-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.decision.decision !== "approve") process.exitCode = 3;
    return;
  }
  if (command === "world-inception-decisions") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    let registrationRef;
    if (flags["registration-ref"] && flags["registration-ref"] !== true) {
      const document = await readJson(resolve(String(flags["registration-ref"])));
      registrationRef = document.artifactRef || document;
    }
    console.log(JSON.stringify(await listWorldInceptionDecisions(resolve(positional[0]), registrationRef), null, 2));
    return;
  }
  if (command === "world-activate") {
    if (positional.length < 8) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const registrationDocument = await readJson(resolve(positional[1]));
    const decisionDocument = await readJson(resolve(positional[2]));
    const packageDocuments = {
      worldCard: await readJson(resolve(positional[3])),
      initialState: await readJson(resolve(positional[4])),
      triggerCatalog: await readJson(resolve(positional[5])),
      actionCatalog: await readJson(resolve(positional[6])),
      eventTemplateCatalog: await readJson(resolve(positional[7])),
      platformProfile: flags.platform && flags.platform !== true ? await readJson(resolve(String(flags.platform))) : undefined
    };
    const result = await activateWorld(resolve(positional[0]), registrationDocument.artifactRef || registrationDocument, decisionDocument.artifactRef || decisionDocument, packageDocuments, {
      stage: flags.stage,
      updatedAt: flags["updated-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "brand-echo-create") {
    if (!positional[0] || !flags.worlds || !flags["symbol-id"] || !flags.surface || !flags.intent) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const worldIds = String(flags.worlds).split(",").map((value) => value.trim()).filter(Boolean);
    const result = await createBrandEcho(resolve(positional[0]), {
      worldIds,
      symbolId: String(flags["symbol-id"]),
      surfaceForm: String(flags.surface),
      semanticIntent: String(flags.intent),
      createdAt: flags["created-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "brand-echoes") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listBrandEchoes(resolve(positional[0]), { status: flags.status }), null, 2));
    return;
  }
  if (command === "brand-echo-decide") {
    if (!positional[0] || !positional[1] || !flags.decision || !flags.actor) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    const echoRef = document.artifactRef || document;
    const result = await recordBrandEchoDecision(resolve(positional[0]), echoRef, {
      decision: String(flags.decision),
      actorId: String(flags.actor),
      rationale: flags.rationale,
      decidedAt: flags["decided-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.decision.decision !== "approve") process.exitCode = 3;
    return;
  }
  if (command === "brand-echo-decisions") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    let echoRef;
    if (flags["echo-ref"] && flags["echo-ref"] !== true) {
      const document = await readJson(resolve(String(flags["echo-ref"])));
      echoRef = document.artifactRef || document;
    }
    console.log(JSON.stringify(await listBrandEchoDecisions(resolve(positional[0]), echoRef), null, 2));
    return;
  }
  if (command === "brand-echo-activate") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const echoDocument = await readJson(resolve(positional[1]));
    const decisionDocument = await readJson(resolve(positional[2]));
    const result = await activateBrandEcho(resolve(positional[0]), echoDocument.artifactRef || echoDocument, decisionDocument.artifactRef || decisionDocument);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-slice-create") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const manifestPath = resolve(positional[1]);
    const manifest = await readJson(manifestPath);
    const readContractValue = async (value) => {
      if (Array.isArray(value)) return Promise.all(value.map((item) => readContractValue(item)));
      if (typeof value === "string") return readJson(resolve(dirname(manifestPath), value));
      return value;
    };
    const contracts = {};
    if (manifest.contractFiles) {
      for (const [role, value] of Object.entries(manifest.contractFiles)) contracts[role] = await readContractValue(value);
    } else if (manifest.contracts) {
      for (const [role, value] of Object.entries(manifest.contracts)) contracts[role] = await readContractValue(value);
    }
    const result = await createProductionSlice(resolve(positional[0]), { ...manifest, contracts });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-slices") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listProductionSlices(resolve(positional[0]), { worldId: flags["world-id"], status: flags.status }), null, 2));
    return;
  }
  if (command === "production-gate-decide") {
    if (!positional[0] || !positional[1] || !flags.gate || !flags.decision || !flags.actor) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const sliceDocument = await readJson(resolve(positional[1]));
    const sliceRef = sliceDocument.artifactRef || sliceDocument;
    let evidenceRefs;
    if (flags.evidence && flags.evidence !== true) {
      const paths = String(flags.evidence).split(",").map((value) => value.trim()).filter(Boolean);
      evidenceRefs = [];
      for (const path of paths) {
        const document = await readJson(resolve(path));
        evidenceRefs.push(document.artifactRef || document);
      }
    }
    const result = await recordProductionGateDecision(resolve(positional[0]), sliceRef, {
      gate: String(flags.gate),
      decision: String(flags.decision),
      actorId: String(flags.actor),
      rationale: flags.rationale,
      evidenceRefs,
      decidedAt: flags["decided-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.decision.decision !== "approve") process.exitCode = 3;
    return;
  }
  if (command === "production-gates") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const document = await readJson(resolve(positional[1]));
    console.log(JSON.stringify(await listProductionGateDecisions(resolve(positional[0]), document.artifactRef || document), null, 2));
    return;
  }
  if (command === "production-stage-activate") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const sliceDocument = await readJson(resolve(positional[1]));
    const decisionDocument = await readJson(resolve(positional[2]));
    const result = await activateProductionStage(resolve(positional[0]), sliceDocument.artifactRef || sliceDocument, decisionDocument.artifactRef || decisionDocument, { updatedAt: flags["updated-at"] });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-execution-plan") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const sliceDocument = await readJson(resolve(positional[1]));
    const manifestPath = resolve(positional[2]);
    const manifest = await readJson(manifestPath);
    const readRefValue = async (value) => {
      if (typeof value === "string") {
        const document = await readJson(resolve(dirname(manifestPath), value));
        return document.artifactRef || document;
      }
      return value?.artifactRef || value;
    };
    const options = { ...manifest };
    for (const key of ["adapterDescriptorRef", "capabilityProfileRef", "promptRef", "shotRef"]) {
      if (options[key] !== undefined) options[key] = await readRefValue(options[key]);
    }
    if (Array.isArray(options.licenseProfileRefs)) options.licenseProfileRefs = await Promise.all(options.licenseProfileRefs.map(readRefValue));
    const result = await compileProductionExecutionRequest(project, sliceDocument.artifactRef || sliceDocument, options);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ready) process.exitCode = 3;
    return;
  }
  if (command === "production-execution-requests") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listProductionExecutionRequests(resolve(positional[0]), {
      worldId: flags["world-id"],
      status: flags.status
    }), null, 2));
    return;
  }
  if (command === "production-execution-run") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const requestDocument = await readJson(resolve(positional[1]));
    const requestRef = requestDocument.artifactRef || requestDocument;
    let adapter = fixtureSvgAdapter;
    if (flags.adapter && flags.adapter !== true) {
      const loaded = await import(pathToFileURL(resolve(String(flags.adapter))).href);
      const exported = loaded.default || loaded.adapter || loaded;
      adapter = typeof exported === "function" ? await exported({ projectRoot: project, requestRef }) : exported;
    }
    const result = await executeProductionRequest(project, requestRef, createAdapterRegistry([adapter]), {
      allowExternal: flags["allow-external"] === true,
      now: flags.now
    });
    console.log(JSON.stringify(result.receipt, null, 2));
    if (["blocked", "failed"].includes(result.receipt.envelope.payload?.status)) process.exitCode = 3;
    return;
  }
  if (command === "production-media-import") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const requestDocument = await readJson(resolve(positional[1]));
    const receiptDocument = await readJson(resolve(positional[2]));
    const result = await createProductionMediaImport(project, requestDocument.artifactRef || requestDocument, receiptDocument.artifactRef || receiptDocument, {
      mediaType: flags["media-type"] && flags["media-type"] !== true ? String(flags["media-type"]) : undefined,
      source: flags.source && flags.source !== true ? String(flags.source) : undefined,
      createdAt: flags["created-at"] && flags["created-at"] !== true ? String(flags["created-at"]) : undefined
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-media-imports") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const result = await listProductionMediaImports(resolve(positional[0]), {
      worldId: flags["world-id"],
      status: flags.status
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-qa-review") {
    if (!positional[0] || !positional[1] || !flags.decision || !flags.actor || !flags.checklist || !flags.media) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const sliceDocument = await readJson(resolve(positional[1]));
    const checklistDocument = await readJson(resolve(String(flags.checklist)));
    const result = await createProductionQaReview(project, sliceDocument.artifactRef || sliceDocument, {
      decision: String(flags.decision),
      actorId: String(flags.actor),
      checklist: checklistDocument.checklist || checklistDocument,
      mediaBindingRefs: await readRefList(flags.media),
      qaSnapshotRefs: flags["qa-snapshots"] ? await readRefList(flags["qa-snapshots"]) : undefined,
      rationale: flags.rationale,
      decidedAt: flags["decided-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.review.status !== "approved") process.exitCode = 3;
    return;
  }
  if (command === "production-qa-reviews") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listProductionQaReviews(resolve(positional[0]), {
      worldId: flags["world-id"],
      status: flags.status
    }), null, 2));
    return;
  }
  if (command === "production-approved-asset") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const sliceDocument = await readJson(resolve(positional[1]));
    const reviewDocument = await readJson(resolve(positional[2]));
    console.log(JSON.stringify(await createApprovedAsset(resolve(positional[0]), sliceDocument.artifactRef || sliceDocument, reviewDocument.artifactRef || reviewDocument), null, 2));
    return;
  }
  if (command === "production-approved-assets") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listApprovedAssets(resolve(positional[0]), { worldId: flags["world-id"] }), null, 2));
    return;
  }
  if (command === "production-private-release") {
    if (!positional[0] || !positional[1] || !positional[2] || !flags.actor) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const sliceDocument = await readJson(resolve(positional[1]));
    const approvedAssetRefs = await readRefList(positional[2]);
    const publishReceiptRefs = flags["publish-receipts"] ? await readRefList(flags["publish-receipts"]) : [];
    const result = await createPrivateReleaseReceipt(resolve(positional[0]), sliceDocument.artifactRef || sliceDocument, approvedAssetRefs, {
      actorId: String(flags.actor),
      destinationId: flags.destination && flags.destination !== true ? String(flags.destination) : undefined,
      publishReceiptRefs,
      releasedAt: flags["released-at"]
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  if (command === "production-private-releases") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listPrivateReleaseReceipts(resolve(positional[0]), { worldId: flags["world-id"] }), null, 2));
    return;
  }
  if (command === "dispatch") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const platform = await readJson(resolve(positional[1]));
    let connector = null;
    if (flags.connector && flags["http-endpoint"]) throw Object.assign(new Error("Choose either --connector or --http-endpoint.\n\n" + usage()), { exitCode: 64 });
    if (flags.connector && flags.connector !== true) {
      const moduleUrl = pathToFileURL(resolve(String(flags.connector))).href;
      const loaded = await import(moduleUrl);
      const exported = loaded.default || loaded.connector || loaded;
      connector = typeof exported === "function" ? await exported({ platform }) : exported;
    }
    if (flags["http-endpoint"] && flags["http-endpoint"] !== true) {
      connector = createMcpHttpConnector({
        id: flags["http-connector-id"] && flags["http-connector-id"] !== true ? String(flags["http-connector-id"]) : "mcp.http.cli",
        trusted: flags["http-trusted"] === true,
        endpoint: String(flags["http-endpoint"]),
        apiKeyEnv: flags["api-key-env"] && flags["api-key-env"] !== true ? String(flags["api-key-env"]) : null,
        protocolVersion: flags["protocol-version"] && flags["protocol-version"] !== true ? String(flags["protocol-version"]) : undefined
      });
    }
    const result = await dispatchOutbox(resolve(positional[0]), platform, connector, {
      allowNetwork: flags["allow-network"] === true,
      dryRun: flags["dry-run"] === true,
      maxAttempts: Number(flags["max-attempts"] || 3),
      now: flags.now,
      timeoutMs: Number(flags.timeout || 60_000)
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.attemptResults?.some((item) => item.status === "dead_letter")) process.exitCode = 3;
    return;
  }
  if (command === "mcp-claims") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listMcpClaims(resolve(positional[0])), null, 2));
    return;
  }
  if (command === "mcp-attempts") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listMcpAttempts(resolve(positional[0])), null, 2));
    return;
  }
  if (command === "llm-shadow") {
    if (!positional[0] || !positional[1] || !positional[2]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const requestDocument = await readJson(resolve(positional[1]));
    const policyDocument = await readJson(resolve(positional[2]));
    if (positional[3] && flags["http-endpoint"]) throw Object.assign(new Error("Choose either a provider module or --http-endpoint.\n\n" + usage()), { exitCode: 64 });
    let provider;
    if (positional[3]) {
      const loaded = await import(pathToFileURL(resolve(positional[3])).href);
      const exported = loaded.default || loaded.provider || loaded;
      provider = typeof exported === "function" ? await exported({ request: requestDocument, policy: policyDocument }) : exported;
    } else if (flags["http-endpoint"] && flags["http-endpoint"] !== true) {
      if (!flags.model || flags.model === true || flags["llm-trusted"] !== true) throw Object.assign(new Error(usage()), { exitCode: 64 });
      provider = createOpenAiCompatibleProvider({
        id: flags["provider-id"] && flags["provider-id"] !== true ? String(flags["provider-id"]) : "llm.openai-compatible.cli",
        trusted: true,
        endpoint: String(flags["http-endpoint"]),
        modelAlias: String(flags.model),
        apiKeyEnv: flags["api-key-env"] && flags["api-key-env"] !== true ? String(flags["api-key-env"]) : "OPENAI_API_KEY",
        costPer1kOutputTokens: flags["cost-per-1k"] && flags["cost-per-1k"] !== true ? Number(flags["cost-per-1k"]) : undefined
      });
    } else {
      throw Object.assign(new Error(usage()), { exitCode: 64 });
    }
    const result = await runLlmShadow(resolve(positional[0]), requestDocument, policyDocument, provider, {
      allowNetwork: flags["allow-network"] === true,
      forceRetry: flags["force-retry"] === true,
      now: flags.now
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "failed") process.exitCode = 3;
    return;
  }
  if (command === "llm-shadow-runs") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listLlmShadowReceipts(resolve(positional[0]), {
      worldId: flags["world-id"],
      providerId: flags["provider-id"]
    }), null, 2));
    return;
  }
  if (command === "portfolio-run") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const worldIds = flags.worlds ? String(flags.worlds).split(",").map((value) => value.trim()).filter(Boolean) : undefined;
    const result = await advancePortfolio(resolve(positional[0]), {
      worldIds,
      maxCycles: Number(flags["max-cycles"] || 10)
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "blocked" || result.status === "stale") process.exitCode = 3;
    return;
  }
  if (command === "brain-run") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const worldIds = flags.worlds ? String(flags.worlds).split(",").map((value) => value.trim()).filter(Boolean) : undefined;
    let dispatch = false;
    if (flags["no-dispatch"] !== true) {
      dispatch = {
        allowNetwork: flags["allow-network"] === true,
        dryRun: flags["dry-run"] === true,
        maxAttempts: Number(flags["max-attempts"] || 3),
        timeoutMs: Number(flags.timeout || 60_000),
        now: flags.now
      };
      if (flags.platform && flags.platform !== true) dispatch.platform = await readJson(resolve(String(flags.platform)));
      if (flags.connector && flags["http-endpoint"]) throw Object.assign(new Error("Choose either --connector or --http-endpoint.\n\n" + usage()), { exitCode: 64 });
      if (flags.connector && flags.connector !== true) {
        const moduleUrl = pathToFileURL(resolve(String(flags.connector))).href;
        const loaded = await import(moduleUrl);
        const exported = loaded.default || loaded.connector || loaded;
        dispatch.connector = typeof exported === "function"
          ? await exported({ platform: dispatch.platform || null })
          : exported;
      }
      if (flags["http-endpoint"] && flags["http-endpoint"] !== true) {
        dispatch.connector = createMcpHttpConnector({
          id: flags["http-connector-id"] && flags["http-connector-id"] !== true ? String(flags["http-connector-id"]) : "mcp.http.cli",
          trusted: flags["http-trusted"] === true,
          endpoint: String(flags["http-endpoint"]),
          apiKeyEnv: flags["api-key-env"] && flags["api-key-env"] !== true ? String(flags["api-key-env"]) : null,
          protocolVersion: flags["protocol-version"] && flags["protocol-version"] !== true ? String(flags["protocol-version"]) : undefined
        });
      }
    }
    const shadowFlags = [flags["shadow-request"], flags["shadow-policy"], flags["shadow-provider"], flags["shadow-endpoint"]];
    const shadowRuns = [];
    if (shadowFlags.some((value) => value !== undefined)) {
      if (!flags["shadow-request"] || flags["shadow-request"] === true || !flags["shadow-policy"] || flags["shadow-policy"] === true) throw Object.assign(new Error(usage()), { exitCode: 64 });
      if (flags["shadow-provider"] && flags["shadow-endpoint"]) throw Object.assign(new Error("Choose either --shadow-provider or --shadow-endpoint.\n\n" + usage()), { exitCode: 64 });
      const requestDocument = await readJson(resolve(String(flags["shadow-request"])));
      const policyDocument = await readJson(resolve(String(flags["shadow-policy"])));
      let provider;
      if (flags["shadow-provider"] && flags["shadow-provider"] !== true) {
        const loaded = await import(pathToFileURL(resolve(String(flags["shadow-provider"]))).href);
        const exported = loaded.default || loaded.provider || loaded;
        provider = typeof exported === "function"
          ? await exported({ request: requestDocument, policy: policyDocument })
          : exported;
      } else if (flags["shadow-endpoint"] && flags["shadow-endpoint"] !== true) {
        if (!flags["shadow-model"] || flags["shadow-model"] === true || flags["shadow-llm-trusted"] !== true) throw Object.assign(new Error(usage()), { exitCode: 64 });
        provider = createOpenAiCompatibleProvider({
          id: flags["shadow-provider-id"] && flags["shadow-provider-id"] !== true ? String(flags["shadow-provider-id"]) : "llm.openai-compatible.brain",
          trusted: true,
          endpoint: String(flags["shadow-endpoint"]),
          modelAlias: String(flags["shadow-model"]),
          apiKeyEnv: flags["shadow-api-key-env"] && flags["shadow-api-key-env"] !== true ? String(flags["shadow-api-key-env"]) : "OPENAI_API_KEY",
          costPer1kOutputTokens: flags["shadow-cost-per-1k"] && flags["shadow-cost-per-1k"] !== true ? Number(flags["shadow-cost-per-1k"]) : undefined
        });
      } else {
        throw Object.assign(new Error(usage()), { exitCode: 64 });
      }
      shadowRuns.push({
        requestDocument,
        policyDocument,
        provider,
        allowNetwork: flags["allow-network"] === true,
        forceRetry: flags["force-shadow-retry"] === true,
        now: flags.now
      });
    }
    const result = await runCodexBrainCycle(project, {
      worldIds,
      maxCycles: Number(flags["max-cycles"] || 10),
      runKey: flags["run-key"] === true ? undefined : flags["run-key"],
      resumePortfolioRef: flags["resume-portfolio"] && flags["resume-portfolio"] !== true
        ? (await readJson(resolve(String(flags["resume-portfolio"]))))
        : undefined,
      dispatch,
      shadowRuns,
      now: flags.now
    });
    console.log(JSON.stringify(result, null, 2));
    if (["blocked", "stale", "failed"].includes(result.status)) process.exitCode = 3;
    return;
  }
  if (command === "brain-runs") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    console.log(JSON.stringify(await listCodexBrainRuns(resolve(positional[0])), null, 2));
    return;
  }
  if (command === "brain-status") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const worldIds = flags.worlds ? String(flags.worlds).split(",").map((value) => value.trim()).filter(Boolean) : undefined;
    console.log(JSON.stringify(await inspectCodexBrain(resolve(positional[0]), { worldIds }), null, 2));
    return;
  }
  if (command === "forecast") {
    if (!positional[0] || !flags.worlds || flags.worlds === true) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const worldIds = String(flags.worlds).split(",").map((value) => value.trim()).filter(Boolean);
    if (!worldIds.length || worldIds.some((worldId) => !/^W[0-9]{2}$/.test(worldId)) || new Set(worldIds).size !== worldIds.length) {
      throw Object.assign(new Error("--worlds must contain unique W## identifiers"), { exitCode: 64 });
    }
    console.log(JSON.stringify({
      kind: "world_os_codex_brain_forecast",
      contractVersion: WORLD_OS_VERSION,
      authority: "proposal_only",
      persisted: false,
      writePolicy: "read_only",
      worldIds,
      forecasts: await Promise.all(worldIds.map((worldId) => forecastWorld(resolve(positional[0]), worldId)))
    }, null, 2));
    return;
  }
  if (command === "serve") {
    if (!positional[0]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    for (const flagName of ["host", "port", "token-env", "connector", "http-endpoint", "http-connector-id", "api-key-env", "protocol-version", "request-timeout", "shadow-profiles"]) {
      if (flags[flagName] === true) throw Object.assign(new Error(`--${flagName} requires a value.\n\n${usage()}`), { exitCode: 64 });
    }
    if (flags.connector && flags["http-endpoint"]) throw Object.assign(new Error("Choose either --connector or --http-endpoint.\n\n" + usage()), { exitCode: 64 });
    let connector = null;
    if (flags.connector && flags.connector !== true) {
      const moduleUrl = pathToFileURL(resolve(String(flags.connector))).href;
      const loaded = await import(moduleUrl);
      const exported = loaded.default || loaded.connector || loaded;
      connector = typeof exported === "function" ? await exported({ platform: null }) : exported;
    }
    if (flags["http-endpoint"] && flags["http-endpoint"] !== true) {
      connector = createMcpHttpConnector({
        id: flags["http-connector-id"] && flags["http-connector-id"] !== true ? String(flags["http-connector-id"]) : "mcp.http.server",
        trusted: flags["http-trusted"] === true,
        endpoint: String(flags["http-endpoint"]),
        apiKeyEnv: flags["api-key-env"] && flags["api-key-env"] !== true ? String(flags["api-key-env"]) : null,
        protocolVersion: flags["protocol-version"] && flags["protocol-version"] !== true ? String(flags["protocol-version"]) : undefined
      });
    }
    let shadowProfiles = [];
    if (flags["shadow-profiles"] && flags["shadow-profiles"] !== true) {
      const moduleUrl = pathToFileURL(resolve(String(flags["shadow-profiles"]))).href;
      const loaded = await import(moduleUrl);
      const exported = loaded.default || loaded.profiles || loaded;
      shadowProfiles = typeof exported === "function"
        ? await exported({ projectRoot: resolve(positional[0]) })
        : exported;
      if (!Array.isArray(shadowProfiles)) throw Object.assign(new Error("--shadow-profiles module must export an array, { profiles }, or a factory returning an array"), { exitCode: 64 });
    }
    const service = createCodexBrainHttpServer({
      projectRoot: resolve(positional[0]),
      host: flags.host && flags.host !== true ? String(flags.host) : "127.0.0.1",
      port: Number(flags.port === undefined || flags.port === true ? 0 : flags.port),
      tokenEnv: flags["token-env"] && flags["token-env"] !== true ? String(flags["token-env"]) : undefined,
      allowNetwork: flags["allow-network"] === true,
      allowLlmNetwork: flags["allow-llm-network"] === true,
      shadowProfiles,
      requestTimeoutMs: Number(flags["request-timeout"] === undefined || flags["request-timeout"] === true ? 30_000 : flags["request-timeout"]),
      dispatchConnector: connector
    });
    const address = await service.start();
    console.log(JSON.stringify({
      kind: "world_os_codex_brain_http_server",
      contractVersion: WORLD_OS_VERSION,
      host: address.address,
      port: address.port,
      authRequired: Boolean(flags["token-env"] || connector || flags["allow-network"] === true || shadowProfiles.length || !["127.0.0.1", "::1", "localhost"].includes(String(flags.host || "127.0.0.1").toLowerCase())),
      llmShadowProfileIds: shadowProfiles.map((profile) => profile?.id).filter(Boolean),
      routes: [...CODEX_BRAIN_HTTP_ROUTES]
    }, null, 2));
    await new Promise((resolveServer) => {
      let stopping = false;
      const stop = async () => {
        if (stopping) return;
        stopping = true;
        await service.close();
        resolveServer();
      };
      process.once("SIGINT", stop);
      process.once("SIGTERM", stop);
    });
    return;
  }
  if (command === "recover") {
    if (!positional[0] || !positional[1]) throw Object.assign(new Error(usage()), { exitCode: 64 });
    const project = resolve(positional[0]);
    const platform = await readJson(resolve(positional[1]));
    const projections = await reconcilePlatformProjections(project, platform);
    const audit = await auditWorldOsProject(project);
    console.log(JSON.stringify({
      policy: "rebuild_projections_and_classify_orphans_without_deletion",
      projections: { created: projections.created, existing: projections.existing.length, ignored: projections.ignored },
      audit: audit.summary
    }, null, 2));
    return;
  }
  throw Object.assign(new Error(usage()), { exitCode: 64 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = error?.exitCode || 2;
  });
}
