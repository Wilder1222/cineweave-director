import { listArtifacts, putArtifact } from "../../cineweave-runtime/src/artifact-store.mjs";
import { ARTIFACT_KINDS, WORLD_OS_VERSION } from "./constants.mjs";
import { exactRef, pointerGet, sameRef } from "./json.mjs";

function selectedPublicState(state, paths) {
  return paths.map((path) => ({ path, value: pointerGet(state, path) })).filter((entry) => entry.value !== undefined);
}

export function platformProfileRef(platform) {
  return exactRef(ARTIFACT_KINDS.platformProfile, platform.profileId, platform.version, platform);
}

export function buildPlatformProjection({ workspace, worldCard, proposal, transition, platform }) {
  if (transition.status !== "accepted_simulation" || !transition.commitRef || !transition.nextStateRef) {
    throw new Error("Only a terminal accepted simulation commit can produce a platform projection");
  }
  if (platform.authority !== "non_authoritative_view" || platform.allowCanonMutation !== false) {
    throw new Error("Platform profile must be a non-authoritative view");
  }
  const profileRef = platformProfileRef(platform);
  if (!sameRef(proposal.platformProfileRef, profileRef)) throw new Error("Proposal is not bound to this exact platform profile");
  if (proposal.publicationIntent?.platformId !== platform.platformId || proposal.publicationIntent?.audience !== platform.audience || proposal.publicationIntent?.lane !== "simulation_preview") {
    throw new Error("Proposal publication intent conflicts with the platform profile");
  }
  const projectionId = `projection.${proposal.eventId}.${platform.platformId}`;
  const idempotencyKey = [
    platform.platformId,
    proposal.worldId,
    proposal.stream,
    transition.commit.nextSequence,
    transition.commitRef.contentHash
  ].join(":");
  return {
    kind: ARTIFACT_KINDS.projection,
    contractVersion: WORLD_OS_VERSION,
    projectionId,
    version: transition.commit.nextSequence,
    platformProfileRef: profileRef,
    platformId: platform.platformId,
    operation: platform.operation,
    audience: platform.audience,
    lane: "simulation_preview",
    authority: "non_authoritative_view",
    allowMutation: false,
    sourceCommitRefs: [transition.commitRef],
    stateRef: transition.nextStateRef,
    worldRef: proposal.worldCardRef,
    generatedBy: { kind: "codex", id: "codex.root" },
    generatedAt: proposal.proposedAt,
    idempotencyKey,
    redactions: platform.redactions,
    payload: {
      locale: platform.locale,
      worldId: proposal.worldId,
      worldName: worldCard.displayName,
      stream: proposal.stream,
      sequence: transition.commit.nextSequence,
      canonLabel: "模拟分支／非正史",
      event: {
        id: proposal.eventId,
        title: proposal.title,
        summary: proposal.publicSummary,
        occurredAt: proposal.trigger.occurredAt
      },
      state: selectedPublicState(transition.nextState, platform.publicStatePaths)
    }
  };
}

export function projectionRef(projection) {
  return exactRef(ARTIFACT_KINDS.projection, projection.projectionId, projection.version, projection);
}

export function createMcpDispatch(projectionEnvelope, platform) {
  const projection = projectionEnvelope.payload;
  const ref = projectionEnvelope.artifactRef;
  if (projection.kind !== ARTIFACT_KINDS.projection || !sameRef(ref, projectionRef(projection))) {
    throw new Error("Projection envelope is not exact");
  }
  const profileRef = platformProfileRef(platform);
  if (platform.transport !== "mcp" || platform.authority !== "non_authoritative_view" || platform.allowCanonMutation !== false || platform.canWriteCanon !== false) throw new Error("Only projection-only MCP profiles are supported");
  if (!sameRef(projection.platformProfileRef, profileRef)
    || projection.platformId !== platform.platformId
    || projection.operation !== platform.operation
    || projection.audience !== platform.audience) {
    throw new Error("Projection is not bound to this exact MCP platform profile");
  }
  return {
    kind: "world_os_mcp_dispatch",
    contractVersion: WORLD_OS_VERSION,
    dispatchId: `dispatch.${projection.projectionId}`,
    transport: "mcp",
    serverAlias: platform.serverAlias,
    toolName: platform.toolName,
    platformProfileRef: profileRef,
    idempotencyKey: projection.idempotencyKey,
    sourceProjectionRef: ref,
    arguments: {
      idempotencyKey: projection.idempotencyKey,
      projection: projection.payload,
      metadata: {
        authority: projection.authority,
        lane: projection.lane,
        sourceCommitRefs: projection.sourceCommitRefs
      }
    }
  };
}

export async function listOutbox(projectRoot, platform) {
  const artifacts = await listArtifacts(projectRoot);
  const profileRef = platformProfileRef(platform);
  const projections = artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.projection
    && sameRef(item.envelope.payload.platformProfileRef, profileRef));
  const receipts = artifacts.filter((item) => item.envelope.payload?.kind === ARTIFACT_KINDS.receipt);
  const entries = projections.map((item) => {
    const receipt = receipts.find((candidate) => sameRef(candidate.envelope.payload.projectionRef, item.envelope.artifactRef));
    return {
      status: receipt ? receipt.envelope.payload.status : "pending",
      projectionRef: item.envelope.artifactRef,
      dispatch: receipt ? null : createMcpDispatch(item.envelope, platform),
      receiptRef: receipt?.envelope.artifactRef || null
    };
  });
  return {
    kind: "world_os_outbox_view",
    contractVersion: WORLD_OS_VERSION,
    projectRoot,
    platformProfileRef: profileRef,
    pending: entries.filter((entry) => entry.status === "pending").length,
    entries
  };
}

export function validatePlatformResponse(response) {
  if (!response || typeof response !== "object" || Array.isArray(response)) throw new TypeError("Platform response must be an object");
  if (!['accepted', 'rejected'].includes(response.status)) throw new TypeError("Platform response status must be accepted or rejected");
  if (typeof response.platformRecordId !== "string" || !response.platformRecordId.trim()) throw new TypeError("Platform response requires platformRecordId");
  if (Number.isNaN(Date.parse(response.receivedAt))) throw new TypeError("Platform response requires a valid receivedAt");
  return response;
}

export async function recordPublishReceipt(projectRoot, projectionEnvelope, response, options = {}) {
  validatePlatformResponse(response);
  const envelope = projectionEnvelope.envelope || projectionEnvelope;
  const projection = envelope.payload;
  const ref = envelope.artifactRef;
  if (!sameRef(ref, projectionRef(projection))) throw new Error("Cannot acknowledge a non-exact projection");
  if (response.idempotencyKey !== projection.idempotencyKey) throw new Error("Platform response idempotency key does not match the projection");
  const payload = {
    kind: ARTIFACT_KINDS.receipt,
    contractVersion: WORLD_OS_VERSION,
    receiptId: `receipt.${projection.projectionId}`,
    version: projection.version,
    projectionRef: ref,
    platformProfileRef: projection.platformProfileRef,
    sourceCommitRefs: projection.sourceCommitRefs,
    platformId: projection.platformId,
    idempotencyKey: projection.idempotencyKey,
    status: response.status === "accepted" ? "succeeded" : "failed",
    platformRecordId: response.platformRecordId,
    receivedAt: response.receivedAt,
    responseHash: response.responseHash || null,
    recordedBy: { kind: "codex", id: "codex.root" },
    canonMutation: false
  };
  return putArtifact(projectRoot, payload, {
    kind: ARTIFACT_KINDS.receipt,
    id: payload.receiptId,
    version: payload.version,
    status: payload.status,
    createdAt: options.createdAt || response.receivedAt,
    createdBy: "codex.root"
  });
}

export function createLocalFixtureResponse(dispatch, receivedAt = "2026-08-22T08:05:00.000Z") {
  return {
    status: "accepted",
    platformRecordId: `fixture:${dispatch.sourceProjectionRef.contentHash.slice(7, 23)}`,
    idempotencyKey: dispatch.idempotencyKey,
    receivedAt,
    responseHash: null
  };
}
