import { link, lstat, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { parseJsonStrict, sha256Bytes, sha256Canonical } from "./canonical-json.mjs";
import { assertReferenceBlobRelativePath, listReferenceBlobFiles, verifyReferenceBlob } from "./reference-media.mjs";

export const RUNTIME_VERSION = "2.5.0";
const identifierPattern = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const contentHashPattern = /^sha256:[0-9a-f]{64}$/;
const supportedStoreVersions = new Set(["2.2.0", "2.3.0", "2.3.1", "2.4.0", "2.5.0"]);

function assertIdentifier(value, label) {
  if (!identifierPattern.test(value || "")) throw new TypeError(`${label} must match ${identifierPattern}`);
  return value;
}

function storeRoot(projectRoot) {
  return join(resolve(projectRoot), ".cineweave");
}

function assertArtifactRef(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("artifactRef must be an object");
  const version = value.version;
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError("artifactRef.version must be a positive safe integer");
  if (!contentHashPattern.test(value.contentHash || "")) throw new TypeError("artifactRef.contentHash must be a lowercase SHA-256 hash");
  return {
    kind: assertIdentifier(value.kind, "artifactRef.kind"),
    id: assertIdentifier(value.id, "artifactRef.id"),
    version,
    contentHash: value.contentHash
  };
}

function sameArtifactRef(left, right) {
  return left.kind === right.kind && left.id === right.id && left.version === right.version && left.contentHash === right.contentHash;
}

function projectManifestErrors(project) {
  const errors = [];
  if (project?.kind !== "cineweave_project_manifest") errors.push("project kind must be cineweave_project_manifest");
  if (!supportedStoreVersions.has(project?.contractVersion) || project?.runtimeVersion !== project?.contractVersion) errors.push("project contract/runtime version pair is unsupported");
  if (!identifierPattern.test(project?.projectId || "")) errors.push("projectId is invalid");
  if (typeof project?.name !== "string" || !project.name.trim() || project.name.length > 240) errors.push("project name is invalid");
  if (Number.isNaN(Date.parse(project?.createdAt))) errors.push("project createdAt is invalid");
  if (project?.storage?.mode !== "local_immutable" || project.storage.artifactDirectory !== "artifacts" || project.storage.approvalDirectory !== "approvals") errors.push("project storage directories are invalid");
  if (["2.3.0", "2.3.1", "2.4.0", "2.5.0"].includes(project?.contractVersion) && (project.storage.executionDirectory !== "executions" || project.storage.idempotencyDirectory !== "idempotency")) errors.push("V2.3+ project execution/idempotency directories are invalid");
  if (["2.4.0", "2.5.0"].includes(project?.contractVersion) && project.storage.referenceBlobDirectory !== "reference-blobs") errors.push("V2.4+ project reference blob directory is invalid");
  return errors;
}

async function writeImmutable(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  try {
    await link(temporary, path);
  } catch (error) {
    if (error?.code === "EEXIST" || existsSync(path)) throw new Error(`Immutable record already exists: ${path}`, { cause: error });
    throw error;
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function readStrictJson(path) {
  await assertRegularFile(path);
  return parseJsonStrict(await readFile(path, "utf8"));
}

export async function initProject(projectRoot, options = {}) {
  const root = storeRoot(projectRoot);
  const projectPath = join(root, "project.json");
  await mkdir(join(root, "artifacts"), { recursive: true });
  await mkdir(join(root, "approvals"), { recursive: true });
  await mkdir(join(root, "executions"), { recursive: true });
  await mkdir(join(root, "idempotency"), { recursive: true });
  await mkdir(join(root, "reference-blobs"), { recursive: true });
  await assertRealDirectory(root);
  for (const directory of ["artifacts", "approvals", "executions", "idempotency", "reference-blobs"]) {
    await assertRealDirectory(join(root, directory));
  }
  if (existsSync(projectPath)) return readStrictJson(projectPath);
  const createdAt = options.createdAt === undefined ? new Date().toISOString() : options.createdAt;
  const name = options.name === undefined ? "Untitled CineWeave Project" : options.name;
  if (Number.isNaN(Date.parse(createdAt))) throw new TypeError("createdAt must be an ISO date-time");
  if (typeof name !== "string" || !name.trim() || name.length > 240) throw new TypeError("name must contain 1 to 240 characters");
  const project = {
    kind: "cineweave_project_manifest",
    contractVersion: RUNTIME_VERSION,
    projectId: assertIdentifier(options.projectId === undefined ? `project.${randomUUID().toLowerCase()}` : options.projectId, "projectId"),
    name,
    createdAt,
    runtimeVersion: RUNTIME_VERSION,
    storage: {
      mode: "local_immutable",
      artifactDirectory: "artifacts",
      approvalDirectory: "approvals",
      executionDirectory: "executions",
      idempotencyDirectory: "idempotency",
      referenceBlobDirectory: "reference-blobs"
    }
  };
  try { await writeImmutable(projectPath, project); }
  catch (error) { if (!existsSync(projectPath)) throw error; }
  return readStrictJson(projectPath);
}

function artifactDirectory(projectRoot, kind, id) {
  return join(storeRoot(projectRoot), "artifacts", assertIdentifier(kind, "kind"), assertIdentifier(id, "id"));
}

export async function putArtifact(projectRoot, payload, options = {}) {
  if (!existsSync(join(storeRoot(projectRoot), "project.json"))) throw new Error("Project is not initialized; run init first");
  await assertRealDirectory(storeRoot(projectRoot));
  await assertRealDirectory(join(storeRoot(projectRoot), "artifacts"));
  const kind = assertIdentifier(options.kind === undefined ? payload?.kind : options.kind, "kind");
  const id = assertIdentifier(options.id, "id");
  const version = Number(options.version === undefined ? 1 : options.version);
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError("version must be a positive safe integer");
  const status = options.status === undefined ? "draft" : options.status;
  const createdAt = options.createdAt === undefined ? new Date().toISOString() : options.createdAt;
  const createdBy = options.createdBy === undefined ? "cineweave-runtime" : options.createdBy;
  if (!["draft", "candidate", "approved", "rejected", "archived", "dry_run", "succeeded", "failed", "blocked"].includes(status)) throw new TypeError("status is invalid");
  if (Number.isNaN(Date.parse(createdAt))) throw new TypeError("createdAt must be an ISO date-time");
  if (typeof createdBy !== "string" || !createdBy.trim() || createdBy.length > 240) throw new TypeError("createdBy must contain 1 to 240 characters");
  const contentHash = sha256Canonical(payload);
  const shortHash = contentHash.slice("sha256:".length, "sha256:".length + 16);
  const directory = artifactDirectory(projectRoot, kind, id);
  const kindDirectory = join(storeRoot(projectRoot), "artifacts", kind);
  if (existsSync(kindDirectory)) await assertRealDirectory(kindDirectory);
  if (existsSync(directory)) await assertRealDirectory(directory);
  await mkdir(directory, { recursive: true });
  const expectedName = `v${version}-${shortHash}.json`;
  const artifactRef = { kind, id, version, contentHash };
  const versionPointerPath = join(directory, `v${version}.ref`);
  if (!existsSync(versionPointerPath)) {
    try { await writeImmutable(versionPointerPath, artifactRef); }
    catch (error) { if (!existsSync(versionPointerPath)) throw error; }
  }
  const versionPointer = await readStrictJson(versionPointerPath);
  if (sha256Canonical(versionPointer) !== sha256Canonical(artifactRef)) throw new Error(`Version conflict for ${kind}/${id}@${version}; immutable versions cannot be overwritten`);
  const envelope = {
    kind: "cineweave_artifact_envelope",
    contractVersion: RUNTIME_VERSION,
    artifactRef,
    status,
    createdAt,
    createdBy,
    payload
  };
  const path = join(directory, expectedName);
  if (!existsSync(path)) {
    try { await writeImmutable(path, envelope); }
    catch (error) { if (!existsSync(path)) throw error; }
  }
  return findArtifact(projectRoot, artifactRef);
}

export async function findArtifact(projectRoot, artifactRef) {
  const exactRef = assertArtifactRef(artifactRef);
  const { kind, id, version, contentHash } = exactRef;
  const directory = artifactDirectory(projectRoot, kind, id);
  if (!existsSync(directory)) throw new Error(`Artifact does not exist: ${kind}/${id}@${version}`);
  await assertRealDirectory(directory);
  const pointerPath = join(directory, `v${version}.ref`);
  if (!existsSync(pointerPath)) throw new Error(`Immutable version pointer does not exist: ${kind}/${id}@${version}`);
  const pointer = assertArtifactRef(await readStrictJson(pointerPath));
  if (!sameArtifactRef(pointer, exactRef)) throw new Error(`Immutable version pointer mismatch: ${kind}/${id}@${version}`);
  const shortHash = contentHash.slice("sha256:".length, "sha256:".length + 16);
  const path = join(directory, `v${version}-${shortHash}.json`);
  if (!existsSync(path)) throw new Error(`Exact artifact hash does not exist: ${kind}/${id}@${version} ${contentHash}`);
  const envelope = await readStrictJson(path);
  const persistedRef = assertArtifactRef(envelope.artifactRef);
  if (envelope.kind !== "cineweave_artifact_envelope" || !sameArtifactRef(persistedRef, exactRef)) throw new Error(`Artifact envelope reference mismatch: ${path}`);
  if (sha256Canonical(envelope.payload) !== contentHash) throw new Error(`Artifact payload hash mismatch: ${path}`);
  return { path, envelope };
}

export async function findArtifactByVersion(projectRoot, kind, id, version = 1) {
  if (!Number.isSafeInteger(version) || version < 1) throw new TypeError("version must be a positive safe integer");
  const pointerPath = join(artifactDirectory(projectRoot, kind, id), `v${version}.ref`);
  if (!existsSync(pointerPath)) return null;
  return findArtifact(projectRoot, await readStrictJson(pointerPath));
}

export async function recordApproval(projectRoot, artifactRef, options = {}) {
  const exactRef = assertArtifactRef(artifactRef);
  await findArtifact(projectRoot, exactRef);
  await assertRealDirectory(join(storeRoot(projectRoot), "approvals"));
  if (!['approved', 'rejected'].includes(options.decision)) throw new TypeError("decision must be approved or rejected");
  if (typeof options.actor !== "string" || !options.actor.trim() || options.actor.length > 240) throw new TypeError("actor must contain 1 to 240 characters");
  const approvalId = assertIdentifier(options.approvalId === undefined ? `approval.${randomUUID().toLowerCase()}` : options.approvalId, "approvalId");
  const decidedAt = options.decidedAt === undefined ? new Date().toISOString() : options.decidedAt;
  const rationale = options.rationale === undefined ? "No rationale supplied." : options.rationale;
  if (Number.isNaN(Date.parse(decidedAt))) throw new TypeError("decidedAt must be an ISO date-time");
  if (typeof rationale !== "string" || !rationale.trim() || rationale.length > 2000) throw new TypeError("rationale must contain 1 to 2000 characters");
  const body = {
    kind: "cineweave_approval_record",
    contractVersion: RUNTIME_VERSION,
    approvalId,
    artifactRef: exactRef,
    decision: options.decision,
    actor: options.actor,
    decidedAt,
    rationale
  };
  const approvalHash = sha256Canonical(body);
  const record = { ...body, approvalHash };
  const path = join(storeRoot(projectRoot), "approvals", `${approvalHash.slice(7)}.json`);
  if (!existsSync(path)) {
    try { await writeImmutable(path, record); }
    catch (error) { if (!existsSync(path)) throw error; }
  }
  const persisted = await readStrictJson(path);
  const { approvalHash: persistedApprovalHash, ...persistedBody } = persisted;
  if (persistedApprovalHash !== approvalHash || sha256Canonical(persistedBody) !== approvalHash) throw new Error(`Persisted approval hash mismatch: ${path}`);
  return { path, record: persisted };
}

export async function findApprovalDecision(projectRoot, artifactRef) {
  const exactRef = assertArtifactRef(artifactRef);
  const matches = [];
  for (const path of await walkJson(join(storeRoot(projectRoot), "approvals"))) {
    const record = await readStrictJson(path);
    const { approvalHash, ...body } = record;
    if (sha256Canonical(body) !== approvalHash) throw new Error(`Approval hash mismatch: ${path}`);
    if (sameArtifactRef(assertArtifactRef(record.artifactRef), exactRef)) matches.push({ path, record });
  }
  matches.sort((left, right) => {
    const time = Date.parse(left.record.decidedAt) - Date.parse(right.record.decidedAt);
    return time || left.record.approvalHash.localeCompare(right.record.approvalHash);
  });
  return matches.at(-1) || null;
}

export async function claimIdempotency(projectRoot, idempotencyKey, requestArtifactRef, options = {}) {
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 8 || idempotencyKey.length > 240) throw new TypeError("idempotencyKey must contain 8 to 240 characters");
  const requestRef = assertArtifactRef(requestArtifactRef);
  await findArtifact(projectRoot, requestRef);
  await assertRealDirectory(join(storeRoot(projectRoot), "idempotency"));
  const keyHash = sha256Bytes(Buffer.from(idempotencyKey, "utf8"));
  const claim = {
    kind: "cineweave_idempotency_claim",
    contractVersion: RUNTIME_VERSION,
    keyHash,
    requestArtifactRef: requestRef,
    claimedAt: options.claimedAt === undefined ? new Date().toISOString() : options.claimedAt
  };
  const path = join(storeRoot(projectRoot), "idempotency", `${keyHash.slice(7)}.json`);
  if (!existsSync(path)) {
    try { await writeImmutable(path, claim); }
    catch (error) { if (!existsSync(path)) throw error; }
  }
  const persisted = await readStrictJson(path);
  if (persisted.keyHash !== keyHash || !sameArtifactRef(assertArtifactRef(persisted.requestArtifactRef), requestRef)) {
    throw new Error("Idempotency key is already bound to a different exact ExecutionRequest");
  }
  return { path, claim: persisted };
}

async function walkJson(path) {
  if (!existsSync(path)) return [];
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const current = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await walkJson(current));
    else if (entry.isFile() && entry.name.endsWith(".json")) result.push(current);
  }
  return result;
}

async function walkRefs(path) {
  if (!existsSync(path)) return [];
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const current = join(path, entry.name);
    if (entry.isDirectory()) result.push(...await walkRefs(current));
    else if (entry.isFile() && entry.name.endsWith(".ref")) result.push(current);
  }
  return result;
}

export async function listArtifacts(projectRoot) {
  const paths = (await walkJson(join(storeRoot(projectRoot), "artifacts"))).filter((path) => /^v\d+-[0-9a-f]{16}\.json$/.test(basename(path)));
  const artifacts = [];
  for (const path of paths) artifacts.push({ path, envelope: await readStrictJson(path) });
  return artifacts.sort((left, right) => left.path.localeCompare(right.path));
}

export async function verifyProject(projectRoot) {
  const root = storeRoot(projectRoot);
  const projectPath = join(root, "project.json");
  const errors = [];
  if (!existsSync(projectPath)) return { valid: false, artifacts: 0, approvals: 0, referenceBlobs: 0, errors: ["Missing .cineweave/project.json"] };
  try {
    const project = await readStrictJson(projectPath);
    for (const error of projectManifestErrors(project)) errors.push(`Invalid project manifest: ${error}`);
  } catch (error) { errors.push(`Invalid project manifest: ${error.message}`); }
  const artifactPaths = (await walkJson(join(root, "artifacts"))).filter((path) => /^v\d+-[0-9a-f]{16}\.json$/.test(basename(path)));
  const known = new Set();
  const versions = new Map();
  const referencedBlobs = new Set();
  for (const path of artifactPaths) {
    try {
      const envelope = await readStrictJson(path);
      const expected = sha256Canonical(envelope.payload);
      const ref = assertArtifactRef(envelope.artifactRef);
      if (!supportedStoreVersions.has(envelope.contractVersion)) errors.push(`Artifact envelope version is unsupported: ${path}`);
      if (!["draft", "candidate", "approved", "rejected", "archived", "dry_run", "succeeded", "failed", "blocked"].includes(envelope.status)) errors.push(`Artifact envelope status is invalid: ${path}`);
      if (Number.isNaN(Date.parse(envelope.createdAt)) || typeof envelope.createdBy !== "string" || !envelope.createdBy.trim()) errors.push(`Artifact envelope provenance is invalid: ${path}`);
      if (envelope.kind !== "cineweave_artifact_envelope" || expected !== ref.contentHash) errors.push(`Artifact hash mismatch: ${path}`);
      const expectedDirectory = artifactDirectory(projectRoot, ref.kind, ref.id);
      if (dirname(path) !== expectedDirectory) errors.push(`Artifact directory does not match its reference: ${path}`);
      const key = `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
      known.add(key);
      const versionKey = `${ref.kind}/${ref.id}@${ref.version}`;
      if (versions.has(versionKey) && versions.get(versionKey) !== ref.contentHash) errors.push(`Multiple hashes occupy immutable version ${versionKey}`);
      versions.set(versionKey, ref.contentHash);
      const shortHash = ref.contentHash.slice("sha256:".length, "sha256:".length + 16);
      if (basename(path) !== `v${ref.version}-${shortHash}.json`) errors.push(`Artifact path does not match its reference: ${path}`);
      if (envelope.payload?.kind === "cineweave_execution_receipt") {
        for (const output of envelope.payload.outputs || []) {
          const outputPath = resolve(root, output.storageRef || "");
          if (!outputPath.startsWith(`${resolve(root)}${sep}`)) {
            errors.push(`Execution output escapes project store: ${path}`);
            continue;
          }
          if (!existsSync(outputPath)) {
            errors.push(`Execution output is missing: ${output.storageRef}`);
            continue;
          }
          await assertRegularFile(outputPath);
          const bytes = await readFile(outputPath);
          if (sha256Bytes(bytes) !== output.contentHash) errors.push(`Execution output hash mismatch: ${output.storageRef}`);
          if (bytes.byteLength !== output.byteLength) errors.push(`Execution output byte length mismatch: ${output.storageRef}`);
        }
      }
      if (envelope.payload?.kind === "cineweave_codex_reference_asset") {
        const verification = await verifyReferenceBlob(projectRoot, envelope.payload);
        referencedBlobs.add(verification.relativePath);
      }
    } catch (error) { errors.push(`Invalid artifact ${path}: ${error.message}`); }
  }
  const pointerPaths = await walkRefs(join(root, "artifacts"));
  for (const path of pointerPaths) {
    try {
      const ref = assertArtifactRef(await readStrictJson(path));
      if (basename(path) !== `v${ref.version}.ref`) errors.push(`Version pointer path does not match its reference: ${path}`);
      if (dirname(path) !== artifactDirectory(projectRoot, ref.kind, ref.id)) errors.push(`Version pointer directory does not match its reference: ${path}`);
      const key = `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
      if (!known.has(key)) errors.push(`Version pointer references a missing exact artifact: ${path}`);
    } catch (error) { errors.push(`Invalid version pointer ${path}: ${error.message}`); }
  }
  for (const [versionKey, contentHash] of versions) {
    const separator = versionKey.lastIndexOf("@");
    const pathPrefix = versionKey.slice(0, separator);
    const slash = pathPrefix.indexOf("/");
    const kind = pathPrefix.slice(0, slash);
    const id = pathPrefix.slice(slash + 1);
    const version = Number(versionKey.slice(separator + 1));
    const pointerPath = join(artifactDirectory(projectRoot, kind, id), `v${version}.ref`);
    if (!existsSync(pointerPath)) errors.push(`Missing immutable version pointer for ${versionKey}:${contentHash}`);
  }
  const approvalPaths = await walkJson(join(root, "approvals"));
  for (const path of approvalPaths) {
    try {
      const record = await readStrictJson(path);
      const { approvalHash, ...body } = record;
      if (record.kind !== "cineweave_approval_record" || !supportedStoreVersions.has(record.contractVersion)) errors.push(`Approval record kind/version is invalid: ${path}`);
      if (!identifierPattern.test(record.approvalId || "") || !["approved", "rejected"].includes(record.decision)) errors.push(`Approval identity/decision is invalid: ${path}`);
      if (typeof record.actor !== "string" || !record.actor.trim() || Number.isNaN(Date.parse(record.decidedAt))) errors.push(`Approval actor/time is invalid: ${path}`);
      if (!contentHashPattern.test(approvalHash || "")) errors.push(`Approval hash format is invalid: ${path}`);
      if (sha256Canonical(body) !== approvalHash) errors.push(`Approval hash mismatch: ${path}`);
      if (basename(path) !== `${String(approvalHash || "").replace(/^sha256:/, "")}.json`) errors.push(`Approval path does not match its hash: ${path}`);
      const ref = assertArtifactRef(record.artifactRef);
      const key = `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
      if (!known.has(key)) errors.push(`Approval references a missing exact artifact: ${path}`);
    } catch (error) { errors.push(`Invalid approval ${path}: ${error.message}`); }
  }
  const idempotencyPaths = await walkJson(join(root, "idempotency"));
  for (const path of idempotencyPaths) {
    try {
      const claim = await readStrictJson(path);
      if (claim.kind !== "cineweave_idempotency_claim") errors.push(`Invalid idempotency claim kind: ${path}`);
      if (!["2.3.0", "2.3.1", "2.4.0", "2.5.0"].includes(claim.contractVersion) || !contentHashPattern.test(claim.keyHash || "") || Number.isNaN(Date.parse(claim.claimedAt))) errors.push(`Invalid idempotency claim metadata: ${path}`);
      if (basename(path) !== `${String(claim.keyHash || "").replace(/^sha256:/, "")}.json`) errors.push(`Idempotency path does not match its key hash: ${path}`);
      const ref = assertArtifactRef(claim.requestArtifactRef);
      const key = `${ref.kind}/${ref.id}@${ref.version}:${ref.contentHash}`;
      if (!known.has(key)) errors.push(`Idempotency claim references a missing exact request: ${path}`);
    } catch (error) { errors.push(`Invalid idempotency claim ${path}: ${error.message}`); }
  }
  let referenceBlobPaths = [];
  try {
    referenceBlobPaths = await listReferenceBlobFiles(projectRoot);
    for (const path of referenceBlobPaths) {
      assertReferenceBlobRelativePath(path);
      if (!referencedBlobs.has(path)) errors.push(`Orphaned reference blob is not bound to an exact ReferenceAsset: ${path}`);
    }
    for (const path of referencedBlobs) if (!referenceBlobPaths.includes(path)) errors.push(`ReferenceAsset blob is missing from project storage: ${path}`);
  } catch (error) { errors.push(`Invalid reference blob storage: ${error.message}`); }
  return { valid: errors.length === 0, artifacts: artifactPaths.length, approvals: approvalPaths.length, referenceBlobs: referenceBlobPaths.length, errors };
}

export async function assertRealDirectory(path) {
  const info = await lstat(path);
  if (info.isSymbolicLink() || !info.isDirectory()) throw new Error("Expected a real non-link directory: " + path);
}

export async function assertRegularFile(path) {
  const info = await lstat(path);
  if (info.isSymbolicLink() || !info.isFile()) throw new Error(`Expected a regular non-link file: ${path}`);
}
