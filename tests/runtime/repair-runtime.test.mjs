import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  createRepairAdapterRegistry,
  runRepair
} from "../../packages/cineweave-runtime/src/repair-runtime.mjs";
import {
  findArtifactByVersion,
  initProject,
  putArtifact,
  recordApproval,
  verifyProject
} from "../../packages/cineweave-runtime/src/artifact-store.mjs";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";

const contractRoot = resolve(process.cwd(), "packages", "cineweave-contracts");
const fixedHash = (character) => "sha256:" + character.repeat(64);
const timestamp = "2026-09-02T15:00:00.000Z";

async function readExample(name) {
  return JSON.parse(await readFile(join(contractRoot, "examples", name), "utf8"));
}

async function prepareRepairProject(root) {
  await initProject(root, { projectId: "project.repair-runtime", name: "Repair Runtime", createdAt: timestamp });
  const targetPayload = await readExample("shot-spec.json");
  const repairPayload = await readExample("director-repair.json");
  repairPayload.executionGate = {
    requiresHumanApproval: true,
    status: "approved",
    approvedBy: "reviewer.repair",
    approvedAt: timestamp
  };
  const target = await putArtifact(root, targetPayload, {
    kind: targetPayload.kind,
    id: targetPayload.shotSpecId,
    version: targetPayload.version,
    status: "approved",
    createdAt: timestamp,
    createdBy: "fixture"
  });
  assert.equal(repairPayload.targetRef.kind, target.envelope.artifactRef.kind);
  assert.equal(repairPayload.targetRef.id, target.envelope.artifactRef.id);
  assert.equal(repairPayload.targetRef.version, target.envelope.artifactRef.version);
  assert.equal(repairPayload.targetRef.contentHash, target.envelope.artifactRef.contentHash);
  const repair = await putArtifact(root, repairPayload, {
    kind: repairPayload.kind,
    id: repairPayload.repairId,
    version: repairPayload.version,
    status: "approved",
    createdAt: timestamp,
    createdBy: "fixture"
  });
  const approval = await recordApproval(root, repair.envelope.artifactRef, {
    decision: "approved",
    actor: "reviewer.repair",
    decidedAt: timestamp,
    rationale: "Approved exact one-variable local repair run."
  });
  return { target, repair, approval };
}

function safeAdapter(adapterId, implementationContentHash, execute) {
  return {
    adapterId,
    implementationContentHash,
    supportedRepairKinds: ["cineweave_codex_director_repair"],
    networkAccess: false,
    writesMedia: false,
    mutatesParent: false,
    providerNeutral: true,
    execute
  };
}

test("contract-aware repair runner creates an immutable candidate and is idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-runner-"));
  try {
    const stored = await prepareRepairProject(root);
    let calls = 0;
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.fixture", fixedHash("a"), ({ target, expectedVersion }) => {
        calls += 1;
        const candidate = structuredClone(target);
        candidate.version = expectedVersion;
        candidate.camera.focalLengthMm = 45;
        return { payload: candidate };
      })
    ]);
    const options = { adapterId: "repair.fixture", now: () => timestamp };
    const first = await runRepair(root, stored.repair.envelope.artifactRef, registry, options);
    assert.equal(first.envelope.payload.status, "awaiting_review");
    assert.equal(first.envelope.payload.failure, null);
    assert.equal(first.envelope.payload.candidateRef.version, 2);
    assert.equal(first.envelope.payload.candidateRef.kind, stored.target.envelope.artifactRef.kind);
    assert.equal(first.envelope.payload.before.artifactRef.contentHash, stored.target.envelope.artifactRef.contentHash);
    assert.equal(first.envelope.payload.after.artifactRef.version, 2);
    assert.equal(first.envelope.payload.executionBoundary.providerNeutral, true);
    assert.equal(first.envelope.payload.executionBoundary.callsNetwork, false);
    assert.equal(first.envelope.payload.executionBoundary.writesSourceMedia, false);
    assert.equal(first.envelope.payload.executionBoundary.writesDerivedMedia, false);
    assert.equal(first.envelope.payload.executionBoundary.mutatesParentArtifact, false);
    assert.equal(first.envelope.payload.executionBoundary.claimsApproval, false);
    assert.equal(first.envelope.payload.executionBoundary.humanReviewRequired, true);
    assert.equal(first.envelope.payload.acceptance.status, "pending");
    assert.equal(first.envelope.payload.validation.repairPlanValid, true);
    assert.equal(first.envelope.payload.validation.targetExact, true);
    assert.equal(first.envelope.payload.validation.preservedInputRefsExact, true);
    assert.equal(first.envelope.payload.validation.changedPathBounded, true);
    assert.equal(first.envelope.payload.validation.candidateSchemaValid, true);
    assert.equal(first.envelope.payload.validation.candidateSemanticValid, true);
    assert.equal(first.envelope.payload.validation.parentImmutable, true);
    assert.equal(first.envelope.payload.validation.noSuccessClaim, true);
    assert.deepEqual(first.envelope.payload.changeEvidence.observedChangedPaths, ["/camera/focalLengthMm", "/version"]);
    assert.equal(first.envelope.payload.approvalEvidence.approvalRecordHash, stored.approval.record.approvalHash);
    assert.equal(first.envelope.payload.approvalEvidence.exactRepairHashMatched, true);
    assert.equal(calls, 1);

    const parent = await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 1);
    const candidate = await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 2);
    assert.equal(parent.envelope.payload.camera.focalLengthMm, 50);
    assert.equal(candidate.envelope.payload.camera.focalLengthMm, 45);
    assert.equal(candidate.envelope.status, "candidate");

    const second = await runRepair(root, stored.repair.envelope.artifactRef, registry, options);
    assert.equal(second.path, first.path);
    assert.equal(second.envelope.artifactRef.contentHash, first.envelope.artifactRef.contentHash);
    assert.equal(calls, 1);

    const schema = join(contractRoot, "schemas", "repair-run-receipt.schema.json");
    assert.equal((await validatePayload(schema, first.envelope.payload)).valid, true);
    assert.deepEqual(validateByKind(first.envelope.payload), []);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner records missing approval without invoking an adapter", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-blocked-"));
  try {
    await initProject(root, { projectId: "project.repair-blocked", name: "Repair Blocked", createdAt: timestamp });
    const targetPayload = await readExample("shot-spec.json");
    const repairPayload = await readExample("director-repair.json");
    repairPayload.executionGate = {
      requiresHumanApproval: true,
      status: "approved",
      approvedBy: "reviewer.repair",
      approvedAt: timestamp
    };
    const target = await putArtifact(root, targetPayload, { kind: targetPayload.kind, id: targetPayload.shotSpecId, version: 1, createdAt: timestamp });
    const repair = await putArtifact(root, repairPayload, { kind: repairPayload.kind, id: repairPayload.repairId, version: 1, createdAt: timestamp });
    let calls = 0;
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.fixture", fixedHash("b"), () => { calls += 1; throw new Error("must not run"); })
    ]);
    const result = await runRepair(root, repair.envelope.artifactRef, registry, { adapterId: "repair.fixture", now: () => timestamp });
    assert.equal(result.envelope.payload.status, "blocked");
    assert.equal(result.envelope.payload.failure.code, "repair.approval_missing");
    assert.equal(result.envelope.payload.candidateRef, null);
    assert.equal(result.envelope.payload.approvalEvidence.decision, "missing");
    assert.equal(result.envelope.payload.before.status, "not_captured");
    assert.equal(calls, 0);
    assert.equal(await findArtifactByVersion(root, target.envelope.artifactRef.kind, target.envelope.artifactRef.id, 2), null);
    const receiptText = JSON.stringify(result.envelope.payload);
    assert.equal(receiptText.includes("must not run"), false);
    assert.equal(receiptText.includes("D:\\study"), false);
    assert.equal(receiptText.includes("http://"), false);
    assert.equal(receiptText.includes("https://"), false);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner rejects an unbounded candidate and unsafe adapter declarations", async () => {
  assert.throws(() => createRepairAdapterRegistry([
    safeAdapter("repair.unsafe", fixedHash("c"), () => {})
  ].map((adapter) => ({ ...adapter, networkAccess: true }))), /local, non-writing/);

  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-invalid-"));
  try {
    const stored = await prepareRepairProject(root);
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.invalid", fixedHash("d"), ({ target, expectedVersion }) => {
        const candidate = structuredClone(target);
        candidate.version = expectedVersion;
        candidate.camera.focalLengthMm = 45;
        candidate.purpose += " and an unrelated purpose rewrite";
        return { payload: candidate };
      })
    ]);
    const result = await runRepair(root, stored.repair.envelope.artifactRef, registry, { adapterId: "repair.invalid", now: () => timestamp });
    assert.equal(result.envelope.payload.status, "failed");
    assert.equal(result.envelope.payload.failure.code, "repair.candidate_invalid");
    assert.equal(result.envelope.payload.candidateRef, null);
    assert.equal(result.envelope.payload.validation.changedPathBounded, false);
    assert.equal(await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 2), null);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

async function assertRepairFailedWithoutCandidate(root, stored, artifact, code, retryable) {
  const receipt = artifact.envelope.payload;
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.failure.code, code);
  assert.equal(receipt.failure.stage, "adapter");
  assert.equal(receipt.failure.retryable, retryable);
  assert.equal(receipt.candidateRef, null);
  assert.equal(receipt.before.status, "captured");
  assert.equal(receipt.before.artifactRef.contentHash, stored.target.envelope.artifactRef.contentHash);
  assert.equal(receipt.after.status, "not_captured");
  assert.equal(receipt.acceptance.status, "pending");
  assert.equal(receipt.acceptance.humanReviewRequired, true);
  assert.equal(receipt.executionBoundary.callsNetwork, false);
  assert.equal(receipt.executionBoundary.writesSourceMedia, false);
  assert.equal(receipt.executionBoundary.writesDerivedMedia, false);
  assert.equal(receipt.executionBoundary.mutatesParentArtifact, false);
  assert.equal(receipt.executionBoundary.claimsApproval, false);
  assert.equal(receipt.validation.parentImmutable, true);
  assert.equal(receipt.validation.noSuccessClaim, true);
  assert.equal(await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 2), null);
}

test("repair runner bounds adapter time and keeps the first receipt idempotent", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-timeout-"));
  try {
    const stored = await prepareRepairProject(root);
    let calls = 0;
    let abortObserved = false;
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.timeout", fixedHash("1"), (_input, { signal }) => {
        calls += 1;
        return new Promise((resolve) => {
          signal.addEventListener("abort", () => {
            abortObserved = true;
            resolve({ payload: {} });
          }, { once: true });
        });
      })
    ]);

    await assert.rejects(
      runRepair(root, stored.repair.envelope.artifactRef, registry, { adapterId: "repair.timeout", timeoutMs: 0 }),
      /timeoutMs must be an integer/
    );
    await assert.rejects(
      runRepair(root, stored.repair.envelope.artifactRef, registry, { adapterId: "repair.timeout", timeoutMs: 300_001 }),
      /timeoutMs must be an integer/
    );
    await assert.rejects(
      runRepair(root, stored.repair.envelope.artifactRef, registry, { adapterId: "repair.timeout", signal: {} }),
      /signal must be an AbortSignal/
    );

    const first = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
      adapterId: "repair.timeout",
      timeoutMs: 20,
      now: () => timestamp
    });
    await assertRepairFailedWithoutCandidate(root, stored, first, "repair.adapter_timeout", true);
    assert.equal(calls, 1);
    assert.equal(abortObserved, true);

    const second = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
      adapterId: "repair.timeout",
      timeoutMs: 300_000,
      now: () => timestamp
    });
    assert.equal(second.path, first.path);
    assert.equal(second.envelope.artifactRef.contentHash, first.envelope.artifactRef.contentHash);
    assert.equal(calls, 1);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner records preflight and in-flight caller cancellation", async () => {
  const preflightRoot = await mkdtemp(join(tmpdir(), "cineweave-repair-cancelled-before-"));
  try {
    const stored = await prepareRepairProject(preflightRoot);
    let calls = 0;
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.cancel-before", fixedHash("2"), () => {
        calls += 1;
        throw new Error("pre-cancelled adapter must not run");
      })
    ]);
    const controller = new AbortController();
    controller.abort(new Error("private cancellation reason https://private.example"));
    const result = await runRepair(preflightRoot, stored.repair.envelope.artifactRef, registry, {
      adapterId: "repair.cancel-before",
      signal: controller.signal,
      now: () => timestamp
    });
    await assertRepairFailedWithoutCandidate(preflightRoot, stored, result, "repair.adapter_cancelled", false);
    assert.equal(calls, 0);
    assert.equal(JSON.stringify(result.envelope.payload).includes("private.example"), false);
    assert.equal((await verifyProject(preflightRoot)).valid, true);
  } finally {
    await rm(preflightRoot, { recursive: true, force: true });
  }

  const inFlightRoot = await mkdtemp(join(tmpdir(), "cineweave-repair-cancelled-running-"));
  try {
    const stored = await prepareRepairProject(inFlightRoot);
    let markStarted;
    const started = new Promise((resolveStarted) => { markStarted = resolveStarted; });
    let abortObserved = false;
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.cancel-running", fixedHash("3"), (_input, { signal }) => {
        markStarted();
        return new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            abortObserved = true;
            reject(new Error("D:\\private\\adapter.log https://private.example/token"));
          }, { once: true });
        });
      })
    ]);
    const controller = new AbortController();
    const running = runRepair(inFlightRoot, stored.repair.envelope.artifactRef, registry, {
      adapterId: "repair.cancel-running",
      signal: controller.signal,
      timeoutMs: 1_000,
      now: () => timestamp
    });
    await started;
    controller.abort(new Error("caller secret"));
    const result = await running;
    await assertRepairFailedWithoutCandidate(inFlightRoot, stored, result, "repair.adapter_cancelled", false);
    assert.equal(abortObserved, true);
    const receiptText = JSON.stringify(result.envelope.payload);
    assert.equal(receiptText.includes("private\\adapter.log"), false);
    assert.equal(receiptText.includes("private.example"), false);
    assert.equal(receiptText.includes("caller secret"), false);
    assert.equal((await verifyProject(inFlightRoot)).valid, true);
  } finally {
    await rm(inFlightRoot, { recursive: true, force: true });
  }
});

test("repair runner rejects malformed adapter output envelopes and non-JSON payloads", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-malformed-output-"));
  try {
    const stored = await prepareRepairProject(root);
    const malformedCases = [
      ["null-envelope", () => null],
      ["primitive-envelope", () => "candidate"],
      ["missing-payload", () => ({})],
      ["extra-envelope-key", () => ({ payload: {}, metadata: "unexpected" })],
      ["array-payload", () => ({ payload: [] })],
      ["non-finite-payload", ({ target }) => {
        const candidate = structuredClone(target);
        candidate.camera.focalLengthMm = Number.NaN;
        return { payload: candidate };
      }],
      ["bigint-payload", ({ target }) => {
        const candidate = structuredClone(target);
        candidate.camera.focalLengthMm = 45n;
        return { payload: candidate };
      }],
      ["cyclic-payload", ({ target }) => {
        const candidate = structuredClone(target);
        candidate.cycle = candidate;
        return { payload: candidate };
      }]
    ];
    const hashCharacters = ["4", "5", "6", "7", "8", "9", "a", "b"];

    for (let index = 0; index < malformedCases.length; index += 1) {
      const [label, execute] = malformedCases[index];
      const adapterId = "repair.malformed-" + label;
      const registry = createRepairAdapterRegistry([
        safeAdapter(adapterId, fixedHash(hashCharacters[index]), execute)
      ]);
      const result = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
        adapterId,
        now: () => timestamp
      });
      await assertRepairFailedWithoutCandidate(root, stored, result, "repair.adapter_output", false);
    }

    const parent = await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 1);
    assert.equal(parent.envelope.artifactRef.contentHash, stored.target.envelope.artifactRef.contentHash);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner normalizes synchronous and asynchronous adapter faults", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-adapter-fault-"));
  try {
    const stored = await prepareRepairProject(root);
    const faultCases = [
      ["sync", fixedHash("c"), () => { throw new Error("D:\\private\\sync.log https://private.example/sync"); }],
      ["async", fixedHash("d"), async () => {
        await Promise.resolve();
        throw new Error("D:\\private\\async.log https://private.example/async");
      }]
    ];

    for (const [label, implementationContentHash, execute] of faultCases) {
      const adapterId = "repair.fault-" + label;
      const registry = createRepairAdapterRegistry([
        safeAdapter(adapterId, implementationContentHash, execute)
      ]);
      const result = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
        adapterId,
        now: () => timestamp
      });
      await assertRepairFailedWithoutCandidate(root, stored, result, "repair.adapter_failed", false);
      const receiptText = JSON.stringify(result.envelope.payload);
      assert.equal(receiptText.includes("private\\" + label + ".log"), false);
      assert.equal(receiptText.includes("private.example"), false);
    }

    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});


test("repair runner serializes same-host calls for one exact repair and adapter", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-single-flight-"));
  try {
    const stored = await prepareRepairProject(root);
    let calls = 0;
    let markStarted;
    let releaseAdapter;
    const started = new Promise((resolveStarted) => { markStarted = resolveStarted; });
    const adapterGate = new Promise((resolveAdapter) => { releaseAdapter = resolveAdapter; });
    const registry = createRepairAdapterRegistry([
      safeAdapter("repair.single-flight", fixedHash("e"), async ({ target, expectedVersion }) => {
        calls += 1;
        const callNumber = calls;
        markStarted();
        await adapterGate;
        const candidate = structuredClone(target);
        candidate.version = expectedVersion;
        candidate.camera.focalLengthMm = callNumber === 1 ? 45 : 40;
        return { payload: candidate };
      })
    ]);
    const owner = runRepair(root, stored.repair.envelope.artifactRef, registry, {
      adapterId: "repair.single-flight",
      timeoutMs: 1_000,
      now: () => timestamp
    });
    await started;

    const cancelledFollower = new AbortController();
    cancelledFollower.abort(new Error("a follower must not cancel the owner"));
    const followers = Array.from({ length: 15 }, (_, index) => runRepair(
      root,
      stored.repair.envelope.artifactRef,
      registry,
      {
        adapterId: "repair.single-flight",
        timeoutMs: index === 0 ? 1 : 1_000,
        signal: index === 0 ? cancelledFollower.signal : undefined,
        now: () => timestamp
      }
    ));
    releaseAdapter();
    const results = await Promise.all([owner, ...followers]);

    assert.equal(calls, 1);
    assert.equal(results[0].envelope.payload.status, "awaiting_review");
    assert.equal(results[0].envelope.payload.candidateRef.version, 2);
    for (const result of results.slice(1)) {
      assert.equal(result.path, results[0].path);
      assert.equal(result.envelope.artifactRef.contentHash, results[0].envelope.artifactRef.contentHash);
    }
    const candidate = await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 2);
    assert.equal(candidate.envelope.payload.camera.focalLengthMm, 45);
    assert.equal(candidate.envelope.artifactRef.contentHash, results[0].envelope.payload.candidateRef.contentHash);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner sanitizes accessor and Proxy output traps", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-output-traps-"));
  try {
    const stored = await prepareRepairProject(root);
    let getterCalls = 0;
    const trapCases = [
      ["payload-getter", fixedHash("e"), () => {
        const envelope = {};
        Object.defineProperty(envelope, "payload", {
          enumerable: true,
          get() {
            getterCalls += 1;
            throw new Error("https://private.example/getter");
          }
        });
        return envelope;
      }],
      ["own-keys", fixedHash("f"), () => new Proxy({}, {
        ownKeys() { throw new Error("D:\\private\\own-keys.log"); }
      })],
      ["descriptor", fixedHash("0"), () => new Proxy({ payload: {} }, {
        getOwnPropertyDescriptor() { throw new Error("https://private.example/descriptor"); }
      })],
      ["revoked", fixedHash("1"), () => {
        const pair = Proxy.revocable({ payload: {} }, {});
        pair.revoke();
        return pair.proxy;
      }],
      ["payload-proxy", fixedHash("2"), () => ({
        payload: new Proxy({}, {
          ownKeys() { throw new Error("https://private.example/nested"); }
        })
      })]
    ];

    for (const [label, implementationContentHash, execute] of trapCases) {
      const adapterId = "repair.output-trap-" + label;
      const registry = createRepairAdapterRegistry([
        safeAdapter(adapterId, implementationContentHash, execute)
      ]);
      const result = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
        adapterId,
        now: () => timestamp
      });
      await assertRepairFailedWithoutCandidate(root, stored, result, "repair.adapter_output", false);
      const receiptText = JSON.stringify(result.envelope.payload);
      assert.equal(receiptText.includes("private.example"), false);
      assert.equal(receiptText.includes("own-keys.log"), false);
    }

    assert.equal(getterCalls, 0);
    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repair runner remains bounded when an asynchronous adapter ignores abort", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-repair-noncooperative-"));
  try {
    const stored = await prepareRepairProject(root);
    const lateCases = [
      ["resolve", fixedHash("3")],
      ["reject", fixedHash("4")]
    ];

    for (const [label, implementationContentHash] of lateCases) {
      let calls = 0;
      let settleLate;
      const adapterId = "repair.noncooperative-" + label;
      const registry = createRepairAdapterRegistry([
        safeAdapter(adapterId, implementationContentHash, ({ target, expectedVersion }) => {
          calls += 1;
          const candidate = structuredClone(target);
          candidate.version = expectedVersion;
          candidate.camera.focalLengthMm = 45;
          return new Promise((resolveLate, rejectLate) => {
            settleLate = label === "resolve"
              ? () => resolveLate({ payload: candidate })
              : () => rejectLate(new Error("D:\\private\\late.log https://private.example/late"));
          });
        })
      ]);

      const wallStartedAt = Date.now();
      const result = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
        adapterId,
        timeoutMs: 20,
        now: () => timestamp
      });
      assert.ok(Date.now() - wallStartedAt < 2_000);
      await assertRepairFailedWithoutCandidate(root, stored, result, "repair.adapter_timeout", true);
      assert.equal(calls, 1);

      settleLate();
      await new Promise((resolveLateSettlement) => setTimeout(resolveLateSettlement, 20));
      const repeated = await runRepair(root, stored.repair.envelope.artifactRef, registry, {
        adapterId,
        timeoutMs: 1_000,
        now: () => timestamp
      });
      assert.equal(repeated.path, result.path);
      assert.equal(repeated.envelope.artifactRef.contentHash, result.envelope.artifactRef.contentHash);
      assert.equal(calls, 1);
      assert.equal(await findArtifactByVersion(root, stored.target.envelope.artifactRef.kind, stored.target.envelope.artifactRef.id, 2), null);
    }

    assert.equal((await verifyProject(root)).valid, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});