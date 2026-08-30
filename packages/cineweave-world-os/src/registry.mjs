import { findArtifact, findArtifactByVersion, listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { sha256Canonical } from "../../cineweave-runtime/src/canonical-json.mjs";
import { ARTIFACT_KINDS, WORLD_ID_PATTERN, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, isExactRef, isPlainObject, sameRef } from "./json.mjs";
import { assertActionCatalogContract, actionCatalogRef } from "./actions.mjs";
import { assertEventTemplateCatalogContract, eventTemplateCatalogRef } from "./branches.mjs";

const REGISTRATION_STATUSES = new Set(["candidate", "runnable", "paused", "rejected", "retired"]);
const REGISTRATION_STAGES = new Set(["candidate_card", "world_bible_draft", "prototype", "active_production", "paused", "retired"]);
const PORTFOLIO_ROLES = new Set(["primary", "incubator", "lab"]);
const DECISIONS = new Set(["approve", "reject", "revise"]);
const IDENTIFIER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,159}$/;

function assertDate(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be a valid ISO date-time`);
  return value;
}

function assertWriter(value, label) {
  if (!isPlainObject(value) || Object.keys(value).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || value.kind !== "codex" || value.id !== "codex.root") throw new TypeError(`${label} must be codex.root`);
}

function assertRefOrNull(value, kind, label) {
  if (value === null) return;
  if (!isExactRef(value) || value.kind !== kind) throw new TypeError(`${label} must be an exact ${kind} reference or null`);
}

function registrationId(worldId) {
  return `registration.${worldId.toLowerCase()}`;
}

function decisionId({ registrationRef, decision, actor, decidedAt }) {
  return `inception-decision.${sha256Canonical({ registrationRef, decision, actor, decidedAt }).slice("sha256:".length, "sha256:".length + 32)}`;
}

function assertCandidateCard(card) {
  if (!isPlainObject(card) || card.kind !== ARTIFACT_KINDS.candidateCard || card.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported world candidate card");
  if (!WORLD_ID_PATTERN.test(card.worldId || "") || !Number.isSafeInteger(card.version) || card.version < 1 || typeof card.displayName !== "string" || !card.displayName.trim()) {
    throw new TypeError("World candidate card identity is invalid");
  }
  if (card.canonDisposition !== "proposal") throw new Error("Candidate cards must remain proposal-only");
  if (!Array.isArray(card.candidateRules) || card.candidateRules.length < 3 || card.candidateRules.some((rule) => typeof rule !== "string" || !rule.trim())) throw new TypeError("Candidate cards require at least three non-empty candidate rules");
  if (new Set(card.candidateRules).size !== card.candidateRules.length) throw new TypeError("Candidate card rules must be unique");
  for (const field of ["audiencePromise", "productionValue"]) if (typeof card[field] !== "string" || !card[field].trim()) throw new TypeError(`Candidate card ${field} is required`);
  for (const field of ["openQuestions", "risks"]) if (!Array.isArray(card[field]) || !card[field].length || card[field].some((item) => typeof item !== "string" || !item.trim())) throw new TypeError(`Candidate card ${field} must contain non-empty questions`);
  return card;
}

function assertWorldDesign(worldCard, worldId) {
  if (!isPlainObject(worldCard) || worldCard.kind !== ARTIFACT_KINDS.worldCard || worldCard.contractVersion !== WORLD_OS_VERSION
    || worldCard.worldId !== worldId || !Number.isSafeInteger(worldCard.version) || worldCard.version < 1
    || typeof worldCard.displayName !== "string" || !worldCard.displayName.trim() || worldCard.canonDisposition !== "proposal") {
    throw new TypeError("World activation requires a proposal-only WorldCard for the registered world");
  }
  for (const field of ["layers", "rules", "factions", "characters", "heroLocations", "locks", "humanGates"]) {
    if (!Array.isArray(worldCard[field]) || !worldCard[field].length) throw new TypeError(`WorldCard.${field} must be a non-empty array`);
  }
  return worldCard;
}

function assertInitialState(state, worldId) {
  if (!isPlainObject(state) || state.kind !== ARTIFACT_KINDS.state || state.contractVersion !== WORLD_OS_VERSION
    || state.worldId !== worldId || state.stream !== "simulation.main" || state.version !== 1 || state.sequence !== 0
    || state.canonDisposition !== "proposal" || state.writer?.kind !== "codex" || state.writer?.id !== "codex.root"
    || !isPlainObject(state.clock) || typeof state.clock.at !== "string" || Number.isNaN(Date.parse(state.clock.at))) {
    throw new TypeError("World activation requires a codex-authored sequence-zero simulation state");
  }
  return state;
}

function assertTriggerCatalog(catalog, worldId, worldRef, stateRef) {
  if (!isPlainObject(catalog) || catalog.kind !== ARTIFACT_KINDS.triggerCatalog || catalog.contractVersion !== WORLD_OS_VERSION
    || catalog.worldId !== worldId || !Number.isSafeInteger(catalog.version) || catalog.version < 1
    || !isExactRef(catalog.worldCardRef) || !sameRef(catalog.worldCardRef, worldRef)
    || !isExactRef(catalog.initialStateRef) || !sameRef(catalog.initialStateRef, stateRef)
    || !Array.isArray(catalog.triggers) || !catalog.triggers.length) throw new TypeError("Trigger catalog is not bound to the exact WorldCard and initial State");
  return catalog;
}

function assertPlatformProfile(platform) {
  if (!isPlainObject(platform) || platform.kind !== ARTIFACT_KINDS.platformProfile || platform.contractVersion !== WORLD_OS_VERSION
    || platform.transport !== "mcp" || platform.authority !== "non_authoritative_view" || platform.allowCanonMutation !== false || platform.canWriteCanon !== false) {
    throw new TypeError("World activation requires a projection-only MCP platform profile");
  }
  return platform;
}

export function assertWorldRegistrationContract(registration) {
  if (!isPlainObject(registration) || registration.kind !== ARTIFACT_KINDS.worldRegistration || registration.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported WorldRegistration contract");
  const keys = ["kind", "contractVersion", "registrationId", "version", "workspaceRef", "worldId", "displayName", "portfolioRole", "allocationShare", "stage", "canonDisposition", "candidateCardRef", "worldCardRef", "initialStateRef", "triggerCatalogRef", "actionCatalogRef", "eventTemplateCatalogRef", "platformProfileRef", "status", "createdAt", "updatedAt", "createdBy"];
  if (Object.keys(registration).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("WorldRegistration fields must be exact");
  if (!IDENTIFIER_PATTERN.test(registration.registrationId) || registration.registrationId !== registrationId(registration.worldId)
    || !Number.isSafeInteger(registration.version) || registration.version < 1
    || !WORLD_ID_PATTERN.test(registration.worldId || "") || typeof registration.displayName !== "string" || !registration.displayName.trim()
    || !PORTFOLIO_ROLES.has(registration.portfolioRole) || !Number.isSafeInteger(registration.allocationShare) || registration.allocationShare < 1 || registration.allocationShare > 100
    || !REGISTRATION_STAGES.has(registration.stage) || registration.canonDisposition !== "proposal" || !REGISTRATION_STATUSES.has(registration.status)) {
    throw new TypeError("WorldRegistration identity, allocation or lifecycle is invalid");
  }
  if (!isExactRef(registration.workspaceRef) || registration.workspaceRef.kind !== ARTIFACT_KINDS.workspace) throw new TypeError("WorldRegistration.workspaceRef must be exact");
  assertRefOrNull(registration.candidateCardRef, ARTIFACT_KINDS.candidateCard, "WorldRegistration.candidateCardRef");
  if (registration.candidateCardRef === null) throw new TypeError("WorldRegistration must retain its candidate card reference");
  assertRefOrNull(registration.worldCardRef, ARTIFACT_KINDS.worldCard, "WorldRegistration.worldCardRef");
  assertRefOrNull(registration.initialStateRef, ARTIFACT_KINDS.state, "WorldRegistration.initialStateRef");
  assertRefOrNull(registration.triggerCatalogRef, ARTIFACT_KINDS.triggerCatalog, "WorldRegistration.triggerCatalogRef");
  assertRefOrNull(registration.actionCatalogRef, ARTIFACT_KINDS.actionCatalog, "WorldRegistration.actionCatalogRef");
  assertRefOrNull(registration.eventTemplateCatalogRef, ARTIFACT_KINDS.eventTemplateCatalog, "WorldRegistration.eventTemplateCatalogRef");
  assertRefOrNull(registration.platformProfileRef, ARTIFACT_KINDS.platformProfile, "WorldRegistration.platformProfileRef");
  const runtimeRefs = [registration.worldCardRef, registration.initialStateRef, registration.triggerCatalogRef, registration.actionCatalogRef, registration.eventTemplateCatalogRef, registration.platformProfileRef];
  if (registration.status === "candidate") {
    if (registration.stage !== "candidate_card" || registration.portfolioRole !== "lab" || runtimeRefs.some((ref) => ref !== null)) throw new Error("Candidate WorldRegistration must remain a lab card without runtime refs");
  }
  if (registration.status === "runnable") {
    if (registration.stage === "candidate_card" || runtimeRefs.some((ref) => ref === null)) throw new Error("Runnable WorldRegistration requires a complete exact runtime bundle");
  }
  assertDate(registration.createdAt, "WorldRegistration.createdAt");
  if (Date.parse(assertDate(registration.updatedAt, "WorldRegistration.updatedAt")) < Date.parse(registration.createdAt)) throw new TypeError("WorldRegistration.updatedAt cannot precede createdAt");
  assertWriter(registration.createdBy, "WorldRegistration.createdBy");
  return registration;
}

export function assertWorldInceptionDecisionContract(decision) {
  if (!isPlainObject(decision) || decision.kind !== ARTIFACT_KINDS.worldInceptionDecision || decision.contractVersion !== WORLD_OS_VERSION) throw new TypeError("Unsupported WorldInceptionDecision contract");
  const keys = ["kind", "contractVersion", "decisionId", "version", "registrationRef", "worldId", "decision", "actor", "decidedAt", "rationale", "authority", "recordedBy"];
  if (Object.keys(decision).sort().join("\u0000") !== keys.slice().sort().join("\u0000")) throw new TypeError("WorldInceptionDecision fields must be exact");
  if (!IDENTIFIER_PATTERN.test(decision.decisionId) || decision.decisionId !== decisionId(decision)
    || decision.version !== 1 || !isExactRef(decision.registrationRef) || decision.registrationRef.kind !== ARTIFACT_KINDS.worldRegistration
    || !WORLD_ID_PATTERN.test(decision.worldId || "") || !DECISIONS.has(decision.decision)
    || !isPlainObject(decision.actor) || Object.keys(decision.actor).sort().join("\u0000") !== ["kind", "id"].sort().join("\u0000")
    || decision.actor.kind !== "human" || typeof decision.actor.id !== "string" || !decision.actor.id.trim() || decision.actor.id.length > 160
    || typeof decision.rationale !== "string" || !decision.rationale.trim() || decision.rationale.length > 2000
    || decision.authority !== "human_gate") throw new TypeError("WorldInceptionDecision identity or authority is invalid");
  assertDate(decision.decidedAt, "WorldInceptionDecision.decidedAt");
  assertWriter(decision.recordedBy, "WorldInceptionDecision.recordedBy");
  return decision;
}

async function loadExact(root, ref, kind, label) {
  if (!isExactRef(ref) || ref.kind !== kind) throw new Error(`${label} must be an exact ${kind} reference`);
  const item = await findArtifact(root, ref);
  if (!sameRef(item.envelope.artifactRef, ref)) throw new Error(`${label} is not the exact stored artifact`);
  return item;
}

async function latestWorkspace(root) {
  const items = (await listArtifacts(root)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.workspace).sort((left, right) => right.envelope.payload.version - left.envelope.payload.version);
  if (!items.length) throw new Error("No workspace artifact is available");
  return items[0];
}

export function worldRegistrationRef(registration) {
  assertWorldRegistrationContract(registration);
  return exactRef(ARTIFACT_KINDS.worldRegistration, registration.registrationId, registration.version, registration);
}

export function worldInceptionDecisionRef(decision) {
  assertWorldInceptionDecisionContract(decision);
  return exactRef(ARTIFACT_KINDS.worldInceptionDecision, decision.decisionId, decision.version, decision);
}

async function verifyRegistrationReferences(root, registration) {
  const workspace = await loadExact(root, registration.workspaceRef, ARTIFACT_KINDS.workspace, "WorldRegistration workspace");
  const candidate = await loadExact(root, registration.candidateCardRef, ARTIFACT_KINDS.candidateCard, "WorldRegistration candidate card");
  assertCandidateCard(candidate.envelope.payload);
  if (candidate.envelope.payload.worldId !== registration.worldId || candidate.envelope.payload.displayName !== registration.displayName) throw new Error("WorldRegistration does not match its exact candidate card");
  if (registration.status === "runnable") {
    const worldItem = await loadExact(root, registration.worldCardRef, ARTIFACT_KINDS.worldCard, "WorldRegistration world design");
    const stateItem = await loadExact(root, registration.initialStateRef, ARTIFACT_KINDS.state, "WorldRegistration initial state");
    const triggerItem = await loadExact(root, registration.triggerCatalogRef, ARTIFACT_KINDS.triggerCatalog, "WorldRegistration trigger catalog");
    const actionItem = await loadExact(root, registration.actionCatalogRef, ARTIFACT_KINDS.actionCatalog, "WorldRegistration action catalog");
    const templateItem = await loadExact(root, registration.eventTemplateCatalogRef, ARTIFACT_KINDS.eventTemplateCatalog, "WorldRegistration event template catalog");
    const platformItem = await loadExact(root, registration.platformProfileRef, ARTIFACT_KINDS.platformProfile, "WorldRegistration platform profile");
    const world = assertWorldDesign(worldItem.envelope.payload, registration.worldId);
    const worldRef = exactRef(ARTIFACT_KINDS.worldCard, `world.${registration.worldId.toLowerCase()}`, world.version, world);
    if (!sameRef(worldItem.envelope.artifactRef, worldRef) || !sameRef(registration.worldCardRef, worldRef)) throw new Error("WorldRegistration world design reference is not exact");
    const state = assertInitialState(stateItem.envelope.payload, registration.worldId);
    const stateRef = exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state);
    if (!sameRef(registration.initialStateRef, stateRef)) throw new Error("WorldRegistration initial state reference is not exact");
    const trigger = assertTriggerCatalog(triggerItem.envelope.payload, registration.worldId, worldRef, stateRef);
    const triggerRef = exactRef(ARTIFACT_KINDS.triggerCatalog, trigger.catalogId, trigger.version, trigger);
    const action = assertActionCatalogContract(actionItem.envelope.payload);
    if (action.worldId !== registration.worldId || !sameRef(action.worldCardRef, worldRef)) throw new Error("WorldRegistration action catalog binding is invalid");
    const actionRef = actionCatalogRef(action);
    const template = assertEventTemplateCatalogContract(templateItem.envelope.payload);
    const platform = assertPlatformProfile(platformItem.envelope.payload);
    const platformRef = exactRef(ARTIFACT_KINDS.platformProfile, platform.profileId, platform.version, platform);
    if (template.worldId !== registration.worldId || !sameRef(template.worldCardRef, worldRef) || !sameRef(template.triggerCatalogRef, triggerRef)
      || !sameRef(template.actionCatalogRef, actionRef) || !sameRef(template.platformProfileRef, platformRef)) throw new Error("WorldRegistration template catalog binding is invalid");
  } else {
    for (const [ref, kind, label] of [
      [registration.worldCardRef, ARTIFACT_KINDS.worldCard, "world design"],
      [registration.initialStateRef, ARTIFACT_KINDS.state, "initial state"],
      [registration.triggerCatalogRef, ARTIFACT_KINDS.triggerCatalog, "trigger catalog"],
      [registration.actionCatalogRef, ARTIFACT_KINDS.actionCatalog, "action catalog"],
      [registration.eventTemplateCatalogRef, ARTIFACT_KINDS.eventTemplateCatalog, "event template catalog"],
      [registration.platformProfileRef, ARTIFACT_KINDS.platformProfile, "platform profile"]
    ]) {
      if (ref !== null) {
        const item = await loadExact(root, ref, kind, `WorldRegistration ${label}`);
        if (item.envelope.payload.worldId && item.envelope.payload.worldId !== registration.worldId && kind !== ARTIFACT_KINDS.platformProfile) throw new Error(`WorldRegistration ${label} crosses world boundary`);
      }
    }
  }
  return { workspace, candidate };
}

export async function verifyWorldRegistration(projectRoot, registrationRef) {
  const root = projectRoot;
  const item = await loadExact(root, registrationRef, ARTIFACT_KINDS.worldRegistration, "WorldRegistration");
  const registration = assertWorldRegistrationContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, worldRegistrationRef(registration))) throw new Error("WorldRegistration is not content-addressed exactly");
  await verifyRegistrationReferences(root, registration);
  return registration;
}

export async function listWorldRegistrations(projectRoot, options = {}) {
  const items = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldRegistration)
    .filter((item) => !options.worldId || item.envelope.payload.worldId === options.worldId)
    .sort((left, right) => left.envelope.payload.worldId.localeCompare(right.envelope.payload.worldId) || right.envelope.payload.version - left.envelope.payload.version);
  for (const item of items) await verifyWorldRegistration(projectRoot, item.envelope.artifactRef);
  return items.map((item) => ({ registration: item.envelope.payload, registrationRef: item.envelope.artifactRef }));
}

export async function createWorld(projectRoot, candidateDocument, options = {}) {
  const root = projectRoot;
  const workspaceItem = options.workspaceRef ? await loadExact(root, options.workspaceRef, ARTIFACT_KINDS.workspace, "WorldRegistration workspace") : await latestWorkspace(root);
  const workspace = workspaceItem.envelope.payload;
  const candidateRefInput = candidateDocument?.artifactRef || (isExactRef(candidateDocument) ? candidateDocument : null);
  let candidateItem;
  let candidate;
  if (candidateRefInput) {
    candidateItem = await loadExact(root, candidateRefInput, ARTIFACT_KINDS.candidateCard, "world candidate card");
    candidate = assertCandidateCard(candidateItem.envelope.payload);
  } else {
    candidate = assertCandidateCard(candidateDocument);
    candidateItem = await putArtifact(root, candidate, {
      kind: ARTIFACT_KINDS.candidateCard,
      id: `world.${candidate.worldId.toLowerCase()}`,
      version: candidate.version,
      status: "draft",
      createdAt: options.createdAt || new Date().toISOString(),
      createdBy: "codex.root"
    });
  }
  const declared = (workspace.worlds || []).find((world) => world.id === candidate.worldId);
  if (declared && declared.stage !== "candidate_card") throw new Error(`World ${candidate.worldId} is already an active workspace world`);
  const existing = (await listArtifacts(root)).filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldRegistration && item.envelope.payload.worldId === candidate.worldId).sort((left, right) => right.envelope.payload.version - left.envelope.payload.version)[0];
  const registration = {
    kind: ARTIFACT_KINDS.worldRegistration,
    contractVersion: WORLD_OS_VERSION,
    registrationId: registrationId(candidate.worldId),
    version: 1,
    workspaceRef: workspaceItem.envelope.artifactRef,
    worldId: candidate.worldId,
    displayName: candidate.displayName,
    portfolioRole: declared?.portfolioRole || "lab",
    allocationShare: Number(options.allocationShare ?? 1),
    stage: "candidate_card",
    canonDisposition: "proposal",
    candidateCardRef: candidateItem.envelope.artifactRef,
    worldCardRef: null,
    initialStateRef: null,
    triggerCatalogRef: null,
    actionCatalogRef: null,
    eventTemplateCatalogRef: null,
    platformProfileRef: null,
    status: "candidate",
    createdAt: options.createdAt || new Date().toISOString(),
    updatedAt: options.createdAt || new Date().toISOString(),
    createdBy: { kind: "codex", id: "codex.root" }
  };
  assertWorldRegistrationContract(registration);
  const expectedRef = worldRegistrationRef(registration);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("WorldRegistration already exists with different content");
    await verifyWorldRegistration(root, existing.envelope.artifactRef);
    return { registration, registrationRef: existing.envelope.artifactRef, candidateRef: candidateItem.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, registration, {
    kind: ARTIFACT_KINDS.worldRegistration,
    id: registration.registrationId,
    version: registration.version,
    status: "candidate",
    createdAt: registration.createdAt,
    createdBy: "codex.root"
  });
  return { registration, registrationRef: stored.envelope.artifactRef, candidateRef: candidateItem.envelope.artifactRef, idempotent: false };
}

async function resolvePayload(root, document, kind, label) {
  const ref = document?.artifactRef || (isExactRef(document) ? document : null);
  if (ref) {
    const item = await loadExact(root, ref, kind, label);
    return { payload: item.envelope.payload, ref: item.envelope.artifactRef };
  }
  if (!isPlainObject(document) || document.kind !== kind) throw new TypeError(`${label} must be a ${kind} payload or exact reference`);
  return { payload: document, ref: null };
}

async function storePayload(root, resolved, kind, id, version, status, createdAt) {
  if (resolved.ref) return resolved.ref;
  const stored = await putArtifact(root, resolved.payload, { kind, id, version, status, createdAt, createdBy: "codex.root" });
  return stored.envelope.artifactRef;
}

/**
 * Attach a complete, sequence-zero runtime package to an approved candidate
 * registration. This is deliberately separate from createWorld: a card never
 * becomes runnable merely because Codex generated a WorldCard.
 */
export async function activateWorld(projectRoot, registrationRef, decisionRef, packageDocuments = {}, options = {}) {
  const root = projectRoot;
  const registration = await verifyWorldRegistration(root, registrationRef);
  if (registration.status !== "candidate" || registration.stage !== "candidate_card") throw new Error("Only a candidate WorldRegistration can be activated");
  await requireLatestApprovedWorldDecision(root, registrationRef, decisionRef);
  const worldResolved = await resolvePayload(root, packageDocuments.worldCard, ARTIFACT_KINDS.worldCard, "world design");
  const stateResolved = await resolvePayload(root, packageDocuments.initialState, ARTIFACT_KINDS.state, "initial state");
  const actionResolved = await resolvePayload(root, packageDocuments.actionCatalog, ARTIFACT_KINDS.actionCatalog, "action catalog");
  const triggerResolved = await resolvePayload(root, packageDocuments.triggerCatalog, ARTIFACT_KINDS.triggerCatalog, "trigger catalog");
  const templateResolved = await resolvePayload(root, packageDocuments.eventTemplateCatalog, ARTIFACT_KINDS.eventTemplateCatalog, "event template catalog");
  const workspaceItem = await loadExact(root, registration.workspaceRef, ARTIFACT_KINDS.workspace, "WorldRegistration workspace");
  const workspace = workspaceItem.envelope.payload;
  const platformResolved = packageDocuments.platformProfile
    ? await resolvePayload(root, packageDocuments.platformProfile, ARTIFACT_KINDS.platformProfile, "platform profile")
    : await resolvePayload(root, workspace.integrations?.mcp?.profileRef, ARTIFACT_KINDS.platformProfile, "workspace platform profile");
  const world = assertWorldDesign(worldResolved.payload, registration.worldId);
  if (world.displayName !== registration.displayName) throw new Error("WorldCard displayName must match the registered candidate");
  const worldRef = exactRef(ARTIFACT_KINDS.worldCard, `world.${registration.worldId.toLowerCase()}`, world.version, world);
  if (worldResolved.ref && !sameRef(worldResolved.ref, worldRef)) throw new Error("WorldCard exact reference must use the registered world identity");
  const state = assertInitialState(stateResolved.payload, registration.worldId);
  const stateRef = exactRef(ARTIFACT_KINDS.state, state.stateId, state.version, state);
  const trigger = assertTriggerCatalog(triggerResolved.payload, registration.worldId, worldRef, stateRef);
  const triggerRef = exactRef(ARTIFACT_KINDS.triggerCatalog, trigger.catalogId, trigger.version, trigger);
  const action = assertActionCatalogContract(actionResolved.payload);
  if (action.worldId !== registration.worldId || !sameRef(action.worldCardRef, worldRef)) throw new Error("ActionCatalog must bind the exact activated WorldCard");
  const actionRef = actionCatalogRef(action);
  const template = assertEventTemplateCatalogContract(templateResolved.payload);
  const platform = assertPlatformProfile(platformResolved.payload);
  const platformRef = exactRef(ARTIFACT_KINDS.platformProfile, platform.profileId, platform.version, platform);
  if (template.worldId !== registration.worldId || !sameRef(template.worldCardRef, worldRef) || !sameRef(template.triggerCatalogRef, triggerRef)
    || !sameRef(template.actionCatalogRef, actionRef) || !sameRef(template.platformProfileRef, platformRef)) throw new Error("EventTemplateCatalog must bind the exact activated runtime package");
  const now = assertDate(options.updatedAt || new Date().toISOString(), "WorldRegistration.updatedAt");
  if (Date.parse(now) < Date.parse(registration.createdAt)) throw new Error("Activation time cannot precede registration creation");
  const refs = {
    worldCardRef: await storePayload(root, worldResolved, ARTIFACT_KINDS.worldCard, `world.${registration.worldId.toLowerCase()}`, world.version, "draft", now),
    initialStateRef: await storePayload(root, stateResolved, ARTIFACT_KINDS.state, state.stateId, state.version, "draft", now),
    triggerCatalogRef: await storePayload(root, triggerResolved, ARTIFACT_KINDS.triggerCatalog, trigger.catalogId, trigger.version, "draft", now),
    actionCatalogRef: await storePayload(root, actionResolved, ARTIFACT_KINDS.actionCatalog, action.catalogId, action.version, "draft", now),
    eventTemplateCatalogRef: await storePayload(root, templateResolved, ARTIFACT_KINDS.eventTemplateCatalog, template.catalogId, template.version, "draft", now),
    platformProfileRef: await storePayload(root, platformResolved, ARTIFACT_KINDS.platformProfile, platform.profileId, platform.version, "candidate", now)
  };
  const stage = options.stage || "prototype";
  if (!["world_bible_draft", "prototype"].includes(stage)) throw new TypeError("Initial world activation stage must be world_bible_draft or prototype");
  const activated = {
    ...registration,
    version: registration.version + 1,
    stage,
    candidateCardRef: registration.candidateCardRef,
    worldCardRef: refs.worldCardRef,
    initialStateRef: refs.initialStateRef,
    triggerCatalogRef: refs.triggerCatalogRef,
    actionCatalogRef: refs.actionCatalogRef,
    eventTemplateCatalogRef: refs.eventTemplateCatalogRef,
    platformProfileRef: refs.platformProfileRef,
    status: "runnable",
    updatedAt: now
  };
  assertWorldRegistrationContract(activated);
  const expectedRef = worldRegistrationRef(activated);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.worldRegistration, activated.registrationId, activated.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("Activated WorldRegistration identity is bound to different content");
    await verifyWorldRegistration(root, existing.envelope.artifactRef);
    return { registration: activated, registrationRef: existing.envelope.artifactRef, runtimeRefs: refs, idempotent: true };
  }
  const stored = await putArtifact(root, activated, {
    kind: ARTIFACT_KINDS.worldRegistration,
    id: activated.registrationId,
    version: activated.version,
    status: "candidate",
    createdAt: activated.updatedAt,
    createdBy: "codex.root"
  });
  await verifyWorldRegistration(root, stored.envelope.artifactRef);
  return { registration: activated, registrationRef: stored.envelope.artifactRef, runtimeRefs: refs, idempotent: false };
}

export async function verifyWorldInceptionDecision(projectRoot, decisionRef) {
  const item = await loadExact(projectRoot, decisionRef, ARTIFACT_KINDS.worldInceptionDecision, "WorldInceptionDecision");
  const decision = assertWorldInceptionDecisionContract(item.envelope.payload);
  if (!sameRef(item.envelope.artifactRef, worldInceptionDecisionRef(decision))) throw new Error("WorldInceptionDecision is not content-addressed exactly");
  const registration = await verifyWorldRegistration(projectRoot, decision.registrationRef);
  if (registration.worldId !== decision.worldId) throw new Error("WorldInceptionDecision crosses world boundary");
  return decision;
}

export async function listWorldInceptionDecisions(projectRoot, registrationRef) {
  const items = (await listArtifacts(projectRoot))
    .filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.worldInceptionDecision)
    .filter((item) => !registrationRef || sameRef(item.envelope.payload.registrationRef, registrationRef))
    .sort((left, right) => Date.parse(left.envelope.payload.decidedAt) - Date.parse(right.envelope.payload.decidedAt) || left.envelope.payload.decisionId.localeCompare(right.envelope.payload.decisionId));
  for (const item of items) await verifyWorldInceptionDecision(projectRoot, item.envelope.artifactRef);
  return items.map((item) => ({ decision: item.envelope.payload, decisionRef: item.envelope.artifactRef }));
}

export async function recordWorldInceptionDecision(projectRoot, registrationRef, input = {}) {
  const root = projectRoot;
  const registration = await verifyWorldRegistration(root, registrationRef);
  const decidedAt = assertDate(input.decidedAt || new Date().toISOString(), "WorldInceptionDecision.decidedAt");
  const actor = { kind: "human", id: input.actorId };
  const decision = {
    kind: ARTIFACT_KINDS.worldInceptionDecision,
    contractVersion: WORLD_OS_VERSION,
    decisionId: decisionId({ registrationRef, decision: input.decision, actor, decidedAt }),
    version: 1,
    registrationRef,
    worldId: registration.worldId,
    decision: input.decision,
    actor,
    decidedAt,
    rationale: input.rationale,
    authority: "human_gate",
    recordedBy: { kind: "codex", id: "codex.root" }
  };
  assertWorldInceptionDecisionContract(decision);
  const expectedRef = worldInceptionDecisionRef(decision);
  const existing = await findArtifactByVersion(root, ARTIFACT_KINDS.worldInceptionDecision, decision.decisionId, decision.version);
  if (existing) {
    if (!sameRef(existing.envelope.artifactRef, expectedRef)) throw new Error("WorldInceptionDecision identity is bound to different content");
    return { decision, decisionRef: existing.envelope.artifactRef, idempotent: true };
  }
  const stored = await putArtifact(root, decision, {
    kind: ARTIFACT_KINDS.worldInceptionDecision,
    id: decision.decisionId,
    version: decision.version,
    status: decision.decision === "approve" ? "approved" : decision.decision === "reject" ? "rejected" : "candidate",
    createdAt: decision.decidedAt,
    createdBy: "codex.root"
  });
  return { decision, decisionRef: stored.envelope.artifactRef, idempotent: false };
}

export async function requireLatestApprovedWorldDecision(projectRoot, registrationRef, decisionRef) {
  const latest = (await listWorldInceptionDecisions(projectRoot, registrationRef)).at(-1);
  if (!latest || !decisionRef || !sameRef(latest.decisionRef, decisionRef) || latest.decision.decision !== "approve") throw new Error("World activation requires the latest exact approved inception decision");
  return latest.decision;
}
