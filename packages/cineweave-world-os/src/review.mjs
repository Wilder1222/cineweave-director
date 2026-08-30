import { lstat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  CANON_DISPOSITIONS,
  LOCK_LEVELS,
  LOCK_STATUSES,
  PORTFOLIO_ROLES,
  SEVERITY_ORDER,
  WORLD_ID_PATTERN,
  WORLD_OS_VERSION,
  WORLD_STAGES
} from "./constants.mjs";
import { exactRef, isPlainObject, readJson, resolveWorkspacePath, sameRef } from "./json.mjs";

function issue(severity, code, path, message, extra = {}) {
  return { severity, code, path, message, ...extra };
}

function sortIssues(items) {
  return [...items].sort((left, right) => {
    return SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]
      || left.code.localeCompare(right.code)
      || left.path.localeCompare(right.path)
      || left.message.localeCompare(right.message);
  });
}

function uniqueValues(items, selector) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    const value = selector(item);
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return duplicates;
}

function nonEmpty(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function hasKeys(value, keys) {
  return isPlainObject(value) && keys.every((key) => key in value);
}

function addMissingFields(issues, value, required, basePath, code = "MWS_WORLD_REQUIRED_FIELD_MISSING") {
  for (const field of required) {
    const current = value?.[field];
    if (current === undefined || current === null || current === "" || Array.isArray(current) && current.length === 0) {
      issues.push(issue("error", code, `${basePath}/${field}`, `Required field ${field} is missing`));
    }
  }
}

function reviewAuthority(workspace, issues) {
  const authority = workspace.authority;
  if (!isPlainObject(authority) || authority.singleWriter !== true) {
    issues.push(issue("error", "MWS_SINGLE_WRITER_REQUIRED", "/authority/singleWriter", "The workspace must enforce one authoritative writer"));
  }
  if (authority?.writer?.kind !== "codex" || authority?.writer?.id !== "codex.root") {
    issues.push(issue("error", "MWS_CANON_WRITER_NOT_CODEX", "/authority/writer", "The authoritative writer must be codex.root"));
  }
  if (!Array.isArray(authority?.writerIds) || authority.writerIds.length !== 1 || authority.writerIds[0] !== "codex.root") {
    issues.push(issue("error", "MWS_SINGLE_WRITER_REQUIRED", "/authority/writerIds", "Exactly one writer ID, codex.root, is allowed"));
  }
  const sourcing = workspace.eventSourcing;
  if (sourcing?.appendOnly !== true) {
    issues.push(issue("error", "MWS_EVENT_STORE_NOT_APPEND_ONLY", "/eventSourcing/appendOnly", "Event streams must be append-only"));
  }
  if (sourcing?.requireExpectedVersion !== true) {
    issues.push(issue("error", "MWS_EVENT_EXPECTED_VERSION_REQUIRED", "/eventSourcing/requireExpectedVersion", "Every commit must name its expected version"));
  }
  if (sourcing?.proposalsNeverMutateCanon !== true) {
    issues.push(issue("error", "MWS_SIMULATION_CANON_WRITE_FORBIDDEN", "/eventSourcing/proposalsNeverMutateCanon", "Simulation proposals must never mutate Canon"));
  }
}

function reviewIntegrations(workspace, issues) {
  const mcp = workspace.integrations?.mcp;
  if (!isPlainObject(mcp) || mcp.mode !== "outbox_projection_only" || !nonEmpty(mcp.profilePath) || !isPlainObject(mcp.profileRef) || mcp.canWriteCanon !== false || mcp.canCommitProposals !== false) {
    issues.push(issue("error", "MWS_MCP_CANON_WRITE_FORBIDDEN", "/integrations/mcp", "MCP must be a projection-only outbox publisher"));
  }
  if (mcp?.requiresIdempotencyKey !== true || mcp?.requiresExactSourceRefs !== true) {
    issues.push(issue("error", "MWS_OUTBOX_IDEMPOTENCY_REQUIRED", "/integrations/mcp", "MCP dispatches require idempotency keys and exact source references"));
  }
  const adapters = workspace.integrations?.llmAdapters || [];
  if (!Array.isArray(adapters) || !adapters.length) {
    issues.push(issue("error", "MWS_LLM_SCOPE_MUST_BE_PROPOSAL_ONLY", "/integrations/llmAdapters", "At least one disabled proposal-only provider policy must define the future API boundary"));
  }
  for (const [index, adapter] of adapters.entries()) {
    if (!nonEmpty(adapter.policyPath) || !isPlainObject(adapter.policyRef) || adapter.outputScope !== "proposal_only" || adapter.canApprove !== false || adapter.canCommit !== false || adapter.canWriteState !== false) {
      issues.push(issue("error", "MWS_LLM_SCOPE_MUST_BE_PROPOSAL_ONLY", `/integrations/llmAdapters/${index}`, "LLM adapters may only return proposals"));
    }
  }
}

function reviewLoadedIntegrations(bundle, issues) {
  const mcp = bundle.integrations.mcp;
  if (mcp?.value) {
    const profile = mcp.value;
    const expected = exactRef("world_os_platform_profile", profile.profileId, profile.version, profile);
    if (!sameRef(bundle.workspace.integrations.mcp.profileRef, expected)) issues.push(issue("error", "MWS_CANON_REF_NOT_EXACT", "/integrations/mcp/profileRef", "MCP profile reference is not exact"));
    if (profile.authority !== "non_authoritative_view" || profile.allowCanonMutation !== false || profile.canWriteCanon !== false || profile.audience !== "private_workspace") {
      issues.push(issue("error", "MWS_MCP_CANON_WRITE_FORBIDDEN", "/integrations/mcp/profilePath", "Loaded MCP profile exceeds private projection-only authority"));
    }
  }
  for (const item of bundle.integrations.llm) {
    if (!item.loaded?.value) continue;
    const policy = item.loaded.value;
    const expected = exactRef("world_os_llm_provider_policy", policy.policyId, policy.version, policy);
    if (!sameRef(item.adapter.policyRef, expected)) issues.push(issue("error", "MWS_CANON_REF_NOT_EXACT", `/integrations/llmAdapters/${item.index}/policyRef`, "LLM policy reference is not exact"));
    if (policy.enabled !== item.adapter.enabled || policy.outputScope !== "proposal_only" || policy.canCommit !== false || policy.canWriteState !== false) {
      issues.push(issue("error", "MWS_LLM_SCOPE_MUST_BE_PROPOSAL_ONLY", `/integrations/llmAdapters/${item.index}/policyPath`, "Loaded LLM policy conflicts with the workspace boundary"));
    }
  }
}

function reviewAllocation(workspace, issues) {
  const buckets = workspace.allocation?.buckets || [];
  const sum = buckets.reduce((total, bucket) => total + Number(bucket.share || 0), 0);
  if (sum !== 100) issues.push(issue("error", "MWS_ALLOCATION_SUM_INVALID", "/allocation/buckets", `Allocation totals ${sum}, expected 100`));
  const expected = { primary: 70, incubator: 20, lab: 10 };
  for (const [role, share] of Object.entries(expected)) {
    const bucket = buckets.find((item) => item.id === role);
    if (!bucket || bucket.share !== share) {
      issues.push(issue("error", "MWS_STARTUP_ALLOCATION_MISMATCH", `/allocation/buckets/${role}`, `Startup ${role} allocation must be ${share}%`));
    }
  }
  const assigned = new Map();
  for (const bucket of buckets) {
    for (const worldId of bucket.worldIds || []) {
      if (assigned.has(worldId)) issues.push(issue("error", "MWS_ALLOCATION_WORLD_DUPLICATE", "/allocation/buckets", `${worldId} appears in multiple allocation buckets`));
      assigned.set(worldId, bucket.id);
    }
  }
  const known = new Set((workspace.worlds || []).map((world) => world.id));
  for (const [worldId] of assigned) if (!known.has(worldId)) {
    issues.push(issue("error", "MWS_ALLOCATION_TARGET_UNKNOWN", "/allocation/buckets", `Allocation references unknown world ${worldId}`));
  }
}

function reviewWorldIndex(workspace, issues) {
  const worlds = workspace.worlds || [];
  for (const duplicate of uniqueValues(worlds, (world) => world.id)) {
    issues.push(issue("error", "MWS_WORLD_ID_DUPLICATE", "/worlds", `Duplicate world ID ${duplicate}`));
  }
  for (const required of ["W01", "W02"]) if (!worlds.some((world) => world.id === required)) {
    issues.push(issue("error", "MWS_REQUIRED_WORLD_MISSING", "/worlds", `Required world ${required} is missing`));
  }
  if (worlds.filter((world) => world.portfolioRole === "primary").length !== 1) {
    issues.push(issue("error", "MWS_PRIMARY_WORLD_COUNT_INVALID", "/worlds", "Exactly one primary world is required"));
  }
  for (const [index, world] of worlds.entries()) {
    const path = `/worlds/${index}`;
    if (!WORLD_ID_PATTERN.test(world.id || "")) issues.push(issue("error", "MWS_WORLD_ID_INVALID", `${path}/id`, `Invalid world ID ${String(world.id)}`));
    if (!PORTFOLIO_ROLES.has(world.portfolioRole)) issues.push(issue("error", "MWS_WORLD_ROLE_STAGE_CONFLICT", `${path}/portfolioRole`, "Unknown portfolio role"));
    if (!WORLD_STAGES.has(world.stage)) issues.push(issue("error", "MWS_WORLD_STAGE_INVALID", `${path}/stage`, "Unknown world stage"));
    if (!CANON_DISPOSITIONS.has(world.canonDisposition)) issues.push(issue("error", "MWS_WORLD_STAGE_INVALID", `${path}/canonDisposition`, "Unknown Canon disposition"));
    if (world.portfolioRole === "lab" && world.stage === "active_production") issues.push(issue("error", "MWS_LAB_DIRECT_HEAVY_ALLOCATION", path, "Lab worlds cannot enter active production directly"));
    if (world.stage === "candidate_card" && world.canonDisposition === "committed") issues.push(issue("error", "MWS_CANDIDATE_CLAIMED_AS_CANON", path, "A candidate card cannot be committed Canon"));
    if (world.canonDisposition !== "proposal") issues.push(issue("warning", "MWS_NON_PROPOSAL_WORLD_REQUIRES_APPROVAL_AUDIT", path, "This seed implementation expects proposal-only worlds"));
  }
}

function reviewConnectionPolicy(workspace, issues) {
  const policy = workspace.connectionPolicy;
  const levels = policy?.levels || [];
  if (["L1", "L2", "L3"].some((id) => levels.filter((level) => level.id === id).length !== 1)) {
    issues.push(issue("error", "MWS_CONNECTION_LEVEL_SET_INVALID", "/connectionPolicy/levels", "L1, L2 and L3 must each appear exactly once"));
  }
  if (policy?.phase !== "phase_1" || policy?.maxAllowedLevel !== "L1") {
    issues.push(issue("error", "MWS_L3_FORBIDDEN_IN_PHASE_1", "/connectionPolicy", "Phase 1 may allow at most L1"));
  }
  const l1 = levels.find((level) => level.id === "L1");
  if (l1?.canonEffect !== "none") issues.push(issue("error", "MWS_L1_SHARED_CANON_FORBIDDEN", "/connectionPolicy/levels/L1", "L1 cannot create shared Canon"));
  const l2 = levels.find((level) => level.id === "L2");
  if (l2?.canonEffect !== "unresolved_only") issues.push(issue("error", "MWS_L2_MUST_REMAIN_UNRESOLVED", "/connectionPolicy/levels/L2", "L2 signals must remain unresolved"));
  const l3 = levels.find((level) => level.id === "L3");
  if (l3?.status !== "prohibited") issues.push(issue("error", "MWS_L3_FORBIDDEN_IN_PHASE_1", "/connectionPolicy/levels/L3", "L3 is prohibited during phase 1"));
}

function reviewLocks(workspace, issues) {
  for (const [index, lock] of (workspace.locks || []).entries()) {
    const path = `/locks/${index}`;
    if (!LOCK_LEVELS.has(lock.level)) issues.push(issue("error", "MWS_LOCK_LEVEL_INVALID", `${path}/level`, "Unknown lock level"));
    if (!LOCK_STATUSES.has(lock.status)) issues.push(issue("error", "MWS_LOCK_STATUS_INVALID", `${path}/status`, "Unknown lock status"));
    if (lock.level === "undefined") {
      if (lock.status !== "unresolved" || Object.hasOwn(lock, "value")) issues.push(issue("error", "MWS_UNDEFINED_HAS_VALUE", path, "Undefined locks must be unresolved and carry no value"));
    }
    if (lock.status === "active" && lock.sourceType !== "user_intent" && (!lock.committedEventRef || !lock.approvalRef)) {
      issues.push(issue("error", "MWS_ACTIVE_LOCK_MISSING_COMMIT", path, "Active creative locks require a committed event and approval"));
    }
    if (["codex", "mcp", "llm"].includes(lock.approvedBy?.kind)) {
      issues.push(issue("error", "MWS_EVENT_APPROVAL_MISSING", `${path}/approvedBy`, "AI and platform transports cannot approve creative locks"));
    }
  }
}

function reviewMilestones(workspace, issues) {
  const milestones = workspace.milestones || [];
  const expected = [[1, 14], [15, 30], [31, 60], [61, 90]];
  if (milestones.length !== expected.length) issues.push(issue("error", "MWS_MILESTONE_SET_INVALID", "/milestones", "Exactly four 90-day milestones are required"));
  for (const [index, range] of expected.entries()) {
    const current = milestones[index];
    if (!current || current.dayStart !== range[0] || current.dayEnd !== range[1]) {
      issues.push(issue("error", "MWS_MILESTONE_RANGE_INVALID", `/milestones/${index}`, `Milestone must cover day ${range[0]} through ${range[1]}`));
    }
    if (current?.state === "completed" && (current.review?.status !== "pass" || current.gate?.decision !== "approved")) {
      issues.push(issue("error", "MWS_MILESTONE_COMPLETION_UNPROVEN", `/milestones/${index}`, "Completed milestones require a passing review and approved Gate"));
    }
  }
}

function reviewWorldDesign(design, world, index, issues) {
  const base = `/loadedWorlds/${index}/design`;
  addMissingFields(issues, design, ["kind", "contractVersion", "worldId", "canonDisposition", "audiencePromise", "themeTension", "seasonQuestion", "layers", "rules", "scarceResources", "factions", "dailySystems", "characters", "heroLocations", "season", "style", "day0State", "locks", "humanGates"], base);
  if (design.worldId !== world.id) issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", `${base}/worldId`, `Design worldId must be ${world.id}`));
  if (design.canonDisposition !== "proposal") issues.push(issue("error", "MWS_CANDIDATE_CLAIMED_AS_CANON", `${base}/canonDisposition`, "World design seeds must remain proposals"));
  if ((design.layers || []).length < 3) issues.push(issue("error", "MWS_WORLD_REQUIRED_FIELD_MISSING", `${base}/layers`, "A world design requires at least three layers"));
  if ((design.rules || []).length < 3) issues.push(issue("error", "MWS_WORLD_RULE_COVERAGE_INVALID", `${base}/rules`, "A world design requires at least three rules"));
  for (const [ruleIndex, rule] of (design.rules || []).entries()) {
    addMissingFields(issues, rule, ["id", "capability", "limit", "costs", "exception", "governance"], `${base}/rules/${ruleIndex}`, "MWS_WORLD_RULE_COVERAGE_INVALID");
  }
  for (const duplicate of uniqueValues(design.rules || [], (rule) => rule.id)) issues.push(issue("error", "MWS_WORLD_RULE_COVERAGE_INVALID", `${base}/rules`, `Duplicate rule ID ${duplicate}`));
  if ((design.scarceResources || []).length < 1) issues.push(issue("error", "MWS_WORLD_REQUIRED_FIELD_MISSING", `${base}/scarceResources`, "At least one scarce resource is required"));
  if ((design.factions || []).length < 3) issues.push(issue("error", "MWS_WORLD_REQUIRED_FIELD_MISSING", `${base}/factions`, "At least three factions are required"));
  if ((design.dailySystems || []).length < 1) issues.push(issue("error", "MWS_WORLD_REQUIRED_FIELD_MISSING", `${base}/dailySystems`, "At least one daily system is required"));
  if ((design.characters || []).length < 4) issues.push(issue("error", "MWS_WORLD_CHARACTER_COUNT_INVALID", `${base}/characters`, "A developed world requires at least four character seeds"));
  for (const [characterIndex, character] of (design.characters || []).entries()) {
    addMissingFields(issues, character, ["id", "displayName", "nameStatus", "narrativeFunction", "outerGoal", "innerNeed", "fear", "behavioralFingerprint", "forbiddenReaction", "actorPolicy", "identity"], `${base}/characters/${characterIndex}`);
    if (character.identity?.status !== "unreviewed" || character.identity?.rightsStatus !== "unresolved" || character.identity?.productionEligible !== false) {
      issues.push(issue("error", "MWS_CANDIDATE_IDENTITY_CLAIMED_AS_APPROVED", `${base}/characters/${characterIndex}/identity`, "Seed identities must remain unreviewed, rights-unresolved and ineligible for production"));
    }
  }
  for (const duplicate of uniqueValues(design.characters || [], (character) => character.id)) issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", `${base}/characters`, `Duplicate character ID ${duplicate}`));
  if ((design.heroLocations || []).length < 5) issues.push(issue("error", "MWS_WORLD_LOCATION_COUNT_INVALID", `${base}/heroLocations`, "A developed world requires at least five scene seeds"));
  for (const [locationIndex, location] of (design.heroLocations || []).entries()) {
    addMissingFields(issues, location, ["id", "function", "anchors", "undefinedGeometry"], `${base}/heroLocations/${locationIndex}`);
    if (location.sceneSpecEligible !== false) issues.push(issue("error", "MWS_SCENE_SEED_CLAIMED_AS_SPEC", `${base}/heroLocations/${locationIndex}/sceneSpecEligible`, "Incomplete locations cannot claim SceneSpec eligibility"));
  }
  for (const duplicate of uniqueValues(design.heroLocations || [], (location) => location.id)) issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", `${base}/heroLocations`, `Duplicate location ID ${duplicate}`));
  const beats = design.season?.beats || [];
  if (beats.length !== 8) issues.push(issue("error", "MWS_WORLD_BEAT_COUNT_INVALID", `${base}/season/beats`, "The first season seed must contain eight candidate beats"));
  for (const [beatIndex, beat] of beats.entries()) {
    addMissingFields(issues, beat, ["id", "order", "goal", "obstacle", "choice", "stateChange", "nextCause", "simulationReadiness"], `${base}/season/beats/${beatIndex}`);
    if (beat.order !== beatIndex + 1) issues.push(issue("error", "MWS_WORLD_BEAT_COUNT_INVALID", `${base}/season/beats/${beatIndex}/order`, "Season beat order must be contiguous"));
  }
  for (const duplicate of uniqueValues(beats, (beat) => beat.id)) issues.push(issue("error", "MWS_WORLD_BEAT_COUNT_INVALID", `${base}/season/beats`, `Duplicate beat ID ${duplicate}`));
  addMissingFields(issues, design.style, ["mediumDirection", "palette", "materials", "lighting", "motion", "exclusions", "activationStatus"], `${base}/style`, "MWS_WORLD_STYLE_INCOMPLETE");
  if (design.style?.activationStatus !== "unapproved") issues.push(issue("error", "MWS_CANDIDATE_STYLE_CLAIMED_AS_ACTIVE", `${base}/style/activationStatus`, "Seed styles must remain unapproved"));
  addMissingFields(issues, design.day0State, ["time", "resources", "power", "trust", "knowledge", "ecology", "threat", "debts"], `${base}/day0State`, "MWS_WORLD_DAY0_INCOMPLETE");
  reviewLocks({ locks: design.locks }, issues);
}

function reviewCandidateCard(card, world, index, issues) {
  const base = `/loadedWorlds/${index}/candidateCard`;
  addMissingFields(issues, card, ["kind", "contractVersion", "worldId", "canonDisposition", "audiencePromise", "candidateRules", "productionValue", "openQuestions", "risks"], base);
  if (card.worldId !== world.id) issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", `${base}/worldId`, `Candidate card worldId must be ${world.id}`));
  if (card.canonDisposition !== "proposal") issues.push(issue("error", "MWS_CANDIDATE_CLAIMED_AS_CANON", `${base}/canonDisposition`, "Candidate cards cannot be committed"));
  if ((card.candidateRules || []).length < 3) issues.push(issue("error", "MWS_WORLD_RULE_COVERAGE_INVALID", `${base}/candidateRules`, "Candidate cards require at least three proposed rules"));
}

function reviewState(state, world, design, index, issues) {
  const base = `/loadedWorlds/${index}/state`;
  addMissingFields(issues, state, ["kind", "contractVersion", "stateId", "worldId", "stream", "version", "sequence", "canonDisposition", "writer", "clock", "variables", "actors", "relationships", "threads"], base);
  if (!Array.isArray(state.timeline)) issues.push(issue("error", "MWS_WORLD_REQUIRED_FIELD_MISSING", `${base}/timeline`, "State timeline must be an array"));
  if (state.worldId !== world.id || design.worldId !== world.id) issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", base, "World index, design and initial state IDs must agree"));
  if (state.sequence !== 0 || state.version !== 1 || state.stream !== "simulation.main" || state.canonDisposition !== "proposal") {
    issues.push(issue("error", "MWS_PROPOSAL_IN_CURRENT_PROJECTION", base, "Initial seed state must be simulation.main sequence 0 proposal version 1"));
  }
  if (state.writer?.kind !== "codex" || state.writer?.id !== "codex.root") issues.push(issue("error", "MWS_EVENT_WRITER_UNAUTHORIZED", `${base}/writer`, "State snapshots must be authored by codex.root"));
  const characterIds = new Set((design.characters || []).map((character) => character.id));
  for (const actorId of Object.keys(state.actors || {})) if (!characterIds.has(actorId)) {
    issues.push(issue("error", "MWS_WORLD_REF_UNRESOLVED", `${base}/actors/${actorId}`, `State references unknown actor ${actorId}`));
  }
}

async function loadReferencedFile(workspacePath, repositoryRoot, relativePath, issues, issuePath) {
  let path;
  try { path = resolveWorkspacePath(workspacePath, relativePath, repositoryRoot); }
  catch (error) {
    issues.push(issue("error", "MWS_DOCUMENT_PATH_UNSAFE", issuePath, error.message));
    return null;
  }
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error("Path is not a regular non-link file");
    return { path, value: path.endsWith(".json") ? await readJson(path) : null };
  } catch (error) {
    issues.push(issue("error", "MWS_DOCUMENT_MISSING", issuePath, `${relativePath}: ${error.message}`));
    return null;
  }
}

export async function loadWorkspaceBundle(workspacePath) {
  const absolute = resolve(workspacePath);
  const workspace = await readJson(absolute);
  const repositoryRoot = resolve(dirname(absolute), workspace.repositoryRoot || ".");
  const issues = [];
  const documents = new Map();
  for (const [index, document] of (workspace.documents || []).entries()) {
    const loaded = await loadReferencedFile(absolute, repositoryRoot, document.path, issues, `/documents/${index}/path`);
    if (loaded) documents.set(document.id, loaded);
  }
  const integrations = { mcp: null, llm: [] };
  if (workspace.integrations?.mcp?.profilePath) integrations.mcp = await loadReferencedFile(absolute, repositoryRoot, workspace.integrations.mcp.profilePath, issues, "/integrations/mcp/profilePath");
  for (const [index, adapter] of (workspace.integrations?.llmAdapters || []).entries()) {
    const loaded = adapter.policyPath ? await loadReferencedFile(absolute, repositoryRoot, adapter.policyPath, issues, `/integrations/llmAdapters/${index}/policyPath`) : null;
    integrations.llm.push({ index, adapter, loaded });
  }
  const worlds = [];
  for (const [index, world] of (workspace.worlds || []).entries()) {
    const source = await loadReferencedFile(absolute, repositoryRoot, world.sourcePath, issues, `/worlds/${index}/sourcePath`);
    const initialState = world.initialStatePath
      ? await loadReferencedFile(absolute, repositoryRoot, world.initialStatePath, issues, `/worlds/${index}/initialStatePath`)
      : null;
    worlds.push({ index: world, source, initialState });
  }
  return { workspacePath: absolute, repositoryRoot, workspace, documents, worlds, integrations, loadIssues: issues };
}

export async function reviewWorkspace(workspacePath, options = {}) {
  let bundle;
  try { bundle = await loadWorkspaceBundle(workspacePath); }
  catch (error) {
    const issues = [issue("error", "MWS_MANIFEST_PARSE_ERROR", "/", error.message)];
    return makeReport(resolve(workspacePath), null, issues, options);
  }
  const { workspace, worlds } = bundle;
  const issues = [...bundle.loadIssues];
  if (workspace.kind !== "world_os_workspace" || workspace.contractVersion !== WORLD_OS_VERSION) {
    issues.push(issue("error", "MWS_UNSUPPORTED_VERSION", "/contractVersion", `Expected world_os_workspace ${WORLD_OS_VERSION}`));
  }
  addMissingFields(issues, workspace, ["workspaceId", "phase", "authority", "eventSourcing", "stores", "integrations", "allocation", "worlds", "documents", "locks", "connectionPolicy", "milestones"], "");
  reviewAuthority(workspace, issues);
  reviewIntegrations(workspace, issues);
  reviewLoadedIntegrations(bundle, issues);
  reviewAllocation(workspace, issues);
  reviewWorldIndex(workspace, issues);
  reviewConnectionPolicy(workspace, issues);
  reviewLocks(workspace, issues);
  reviewMilestones(workspace, issues);
  const documentDuplicates = uniqueValues(workspace.documents || [], (document) => document.id);
  for (const duplicate of documentDuplicates) issues.push(issue("error", "MWS_DOCUMENT_REF_UNRESOLVED", "/documents", `Duplicate document ID ${duplicate}`));
  for (const [index, world] of (workspace.worlds || []).entries()) if (!bundle.documents.has(world.documentRef)) {
    issues.push(issue("error", "MWS_DOCUMENT_REF_UNRESOLVED", `/worlds/${index}/documentRef`, `Unknown or unreadable document ${String(world.documentRef)}`));
  }
  for (const [index, loaded] of worlds.entries()) {
    if (!loaded.source?.value) continue;
    if (loaded.index.portfolioRole === "lab") reviewCandidateCard(loaded.source.value, loaded.index, index, issues);
    else {
      reviewWorldDesign(loaded.source.value, loaded.index, index, issues);
      if (!loaded.initialState?.value) issues.push(issue("error", "MWS_WORLD_DAY0_INCOMPLETE", `/worlds/${index}/initialStatePath`, "Developed worlds require an initial state source"));
      else reviewState(loaded.initialState.value, loaded.index, loaded.source.value, index, issues);
    }
  }
  return makeReport(bundle.workspacePath, workspace, sortIssues(issues), options);
}

function makeReport(workspacePath, workspace, issues, options) {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const item of issues) counts[item.severity] += 1;
  const strictFailure = options.strict === true && counts.warning > 0;
  return {
    kind: "world_os_review_report",
    contractVersion: WORLD_OS_VERSION,
    workspaceId: workspace?.workspaceId || null,
    workspacePath,
    reviewedAt: options.reviewedAt || new Date().toISOString(),
    status: counts.error > 0 || strictFailure ? "fail" : counts.warning > 0 ? "warn" : "pass",
    summary: { ...counts, strict: options.strict === true },
    issues
  };
}
