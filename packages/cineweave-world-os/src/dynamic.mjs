import { resolve } from "node:path";
import { findArtifact, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { assertEventTemplateCatalogContract, compileEventCandidates } from "./branches.mjs";
import { exactRef, isExactRef, sameRef } from "./json.mjs";
import { deriveStreamHead } from "./store.mjs";
import { advanceWorld } from "./scheduler.mjs";

function stored(ref, item, label) {
  if (!item || !sameRef(ref, item.envelope.artifactRef)) throw new Error(`${label} is not the exact stored artifact`);
  return item.envelope.payload;
}

function sameNullable(left, right) {
  return left === null && right === null || sameRef(left, right);
}

async function load(root, ref, label) {
  if (!isExactRef(ref)) throw new TypeError(`${label} must be exact`);
  return stored(ref, await findArtifact(root, ref), label);
}

async function latestCatalog(root, catalogId) {
  const items = (await listArtifacts(root)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.eventTemplateCatalog && item.envelope.payload.catalogId === catalogId);
  return items.sort((left, right) => right.envelope.payload.version - left.envelope.payload.version)[0] || null;
}

export async function submitEventTemplateCatalog(projectRoot, catalogDocument, options = {}) {
  const root = resolve(projectRoot);
  const catalog = assertEventTemplateCatalogContract(catalogDocument);
  const [world, trigger, action, platform] = await Promise.all([
    load(root, catalog.worldCardRef, "Template world reference"),
    load(root, catalog.triggerCatalogRef, "Template trigger catalog reference"),
    load(root, catalog.actionCatalogRef, "Template action catalog reference"),
    load(root, catalog.platformProfileRef, "Template platform reference")
  ]);
  if (catalog.worldId !== world.worldId || trigger.worldId !== catalog.worldId || action.worldId !== catalog.worldId) throw new Error("Dynamic template catalog crosses a world boundary");
  if (!sameRef(trigger.worldCardRef, catalog.worldCardRef) || !sameRef(action.worldCardRef, catalog.worldCardRef)) throw new Error("Dynamic template catalog does not bind the exact world design in every source catalog");
  if (catalog.platformProfileRef.id !== platform.profileId || catalog.platformProfileRef.version !== platform.version) throw new Error("Dynamic template catalog platform binding is not exact");
  const current = await latestCatalog(root, catalog.catalogId);
  if (current && catalog.version < current.envelope.payload.version) throw new Error("Dynamic template catalog version is older than the current catalog");
  if (current && catalog.version > current.envelope.payload.version + 1) throw new Error("Dynamic template catalog versions must be appended without gaps");
  if (current && catalog.version === current.envelope.payload.version) {
    if (!sameRef(exactRef(ARTIFACT_KINDS.eventTemplateCatalog, catalog.catalogId, catalog.version, catalog), current.envelope.artifactRef)) throw new Error("Dynamic template catalog version is already bound to a different content hash");
    return { catalog, catalogRef: current.envelope.artifactRef, idempotent: true };
  }
  if (options.triggerId && !catalog.templates.some((template) => template.triggerId === options.triggerId)) throw new Error("Submitted catalog does not contain the requested trigger template");
  const put = await putArtifact(root, catalog, {
    kind: ARTIFACT_KINDS.eventTemplateCatalog,
    id: catalog.catalogId,
    version: catalog.version,
    status: "candidate",
    createdAt: options.createdAt || new Date().toISOString(),
    createdBy: "codex.root"
  });
  return { catalog, catalogRef: put.envelope.artifactRef, idempotent: false };
}

export async function resumeTemplateWorkItem(projectRoot, workItemRef, catalogDocument, options = {}) {
  const root = resolve(projectRoot);
  const workItem = await load(root, workItemRef, "Template work item");
  if (workItem.kind !== ARTIFACT_KINDS.templateWorkItem || workItem.status !== "open") throw new Error("Template work item is not open");
  if (catalogDocument.worldId !== workItem.worldId || !sameRef(catalogDocument.triggerCatalogRef, workItem.triggerCatalogRef)) throw new Error("Submitted template catalog does not match the exact work item world or trigger catalog");
  const head = await deriveStreamHead(root, workItem.worldId, workItem.stream);
  const stateRef = head?.stateRef || workItem.stateRef;
  if (!sameRef(stateRef, workItem.stateRef) || !sameNullable(head?.commitRef || null, workItem.simulationHeadRef)) throw new Error("Template work item is stale against the current simulation head");
  const submitted = await submitEventTemplateCatalog(root, catalogDocument, { ...options, triggerId: workItem.triggerId });
  const artifacts = await listArtifacts(root);
  const latest = (kind, predicate, label) => {
    const matches = artifacts.filter((item) => item.envelope.payload?.kind === kind && predicate(item.envelope.payload)).sort((left, right) => right.envelope.artifactRef.version - left.envelope.artifactRef.version);
    if (!matches.length) throw new Error(`No ${label} is available for template resume`);
    return matches[0].envelope.payload;
  };
  const workspace = latest(ARTIFACT_KINDS.workspace, () => true, "workspace");
  const world = await load(root, submitted.catalog.worldCardRef, "Template world reference");
  const trigger = await load(root, submitted.catalog.triggerCatalogRef, "Template trigger catalog reference");
  const action = await load(root, submitted.catalog.actionCatalogRef, "Template action catalog reference");
  const platform = await load(root, submitted.catalog.platformProfileRef, "Template platform reference");
  const state = await load(root, workItem.stateRef, "Template work item state reference");
  const candidates = compileEventCandidates({
    workspace,
    worldCard: world,
    state,
    parentCommitRef: workItem.simulationHeadRef,
    platform,
    triggerCatalog: trigger,
    actionCatalog: action,
    templateCatalog: submitted.catalog,
    triggerId: workItem.triggerId
  });
  if (!candidates.length) throw new Error("Submitted template catalog still has no executable candidate for the work item trigger");
  const resolved = {
    ...workItem,
    version: workItem.version + 1,
    status: "resolved",
    resolvedByCatalogRef: submitted.catalogRef
  };
  const storedResolved = await putArtifact(root, resolved, {
    kind: ARTIFACT_KINDS.templateWorkItem,
    id: resolved.workItemId,
    version: resolved.version,
    status: "candidate",
    createdAt: options.resolvedAt || workItem.createdAt,
    createdBy: "codex.root"
  });
  const run = await advanceWorld(root, workItem.worldId, { maxSteps: 1 });
  return { submitted, workItem: resolved, workItemRef: storedResolved.envelope.artifactRef, run };
}
