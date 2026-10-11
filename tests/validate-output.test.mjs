import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { validateDocument, validatePayload } from "../scripts/validate-output.mjs";
import { canonicalize, parseJsonStrict, sha256Bytes, sha256Canonical } from "../scripts/canonical-json.mjs";

const contractRoot = fileURLToPath(new URL("../skills/cineweave-director/resources/contracts/", import.meta.url));

async function withDocuments(schema, payload, callback) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-validate-output-"));
  const schemaPath = join(root, "schema.json");
  const payloadPath = join(root, "payload.json");
  try {
    await writeFile(schemaPath, schema, "utf8");
    await writeFile(payloadPath, payload, "utf8");
    return await callback(schemaPath, payloadPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function loadContractFixture(stem) {
  return {
    schemaPath: join(contractRoot, "schemas", `${stem}.schema.json`),
    payload: JSON.parse(await readFile(join(contractRoot, "examples", `${stem}.json`), "utf8")),
  };
}

function rhythmWithShots(payload, count = 3) {
  const candidate = structuredClone(payload);
  const first = candidate.shotWindows[0];
  const length = first.endFrame - first.startFrame + 1;
  candidate.shotWindows = Array.from({ length: count }, (_, index) => ({
    ...first,
    shotId: index === 0 ? first.shotId : `shot.rhythm-test-${index + 1}`,
    order: index + 1,
    startFrame: index * length,
    endFrame: (index + 1) * length - 1,
  }));
  candidate.tempoPhases[0].shotIds = candidate.shotWindows.map((window) => window.shotId);
  candidate.transitions = [];
  return candidate;
}

async function rhythmContextFixture(count = 3) {
  const fixture = await loadContractFixture("sequence-rhythm-spec");
  const payload = rhythmWithShots(fixture.payload, count);
  const { payload: storyboard } = await loadContractFixture("storyboard");
  const firstShot = storyboard.shots[0];
  storyboard.shots = payload.shotWindows.map((window) => ({
    ...structuredClone(firstShot),
    shotId: window.shotId,
    order: window.order,
    shotSpecRef: { ...firstShot.shotSpecRef, id: window.shotId },
  }));
  storyboard.coverageLedger[0].shotIds = payload.shotWindows.map((window) => window.shotId);
  const firstPanel = storyboard.productionBindings.panels[0];
  storyboard.productionBindings.panels = payload.shotWindows.map((window) => ({ ...firstPanel, shotId: window.shotId }));
  payload.storyboardRef = {
    kind: storyboard.kind, id: storyboard.storyboardId, version: storyboard.version,
    contentHash: sha256Canonical(storyboard),
  };
  return { schemaPath: fixture.schemaPath, payload, artifacts: [{ ref: structuredClone(payload.storyboardRef), document: storyboard }] };
}

test("TemporalSpec rejects out-of-duration, reversed and duplicate events on each independent track", async () => {
  const { schemaPath, payload } = await loadContractFixture("temporal-spec");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);
  for (const field of ["focusTimeline", "actionTimeline", "dynamicLighting"]) {
    const twoEvents = structuredClone(payload);
    twoEvents[field] = [
      { ...payload[field][0], timeSeconds: 0 },
      { ...payload[field][0], eventId: `${field.toLowerCase()}.second`, timeSeconds: payload.durationSeconds },
    ];
    assert.equal((await validatePayload(schemaPath, twoEvents)).valid, true, field);
    for (const [mutate, pattern] of [
      [(p) => { p[field][1].timeSeconds += 1; }, /within 0\.\.durationSeconds inclusive/],
      [(p) => { p[field][0].timeSeconds = -0.1; }, /timeSeconds/],
      [(p) => { p[field].reverse(); }, /non-decreasing/],
      [(p) => { p[field][1].eventId = p[field][0].eventId; }, /unique within/],
    ]) {
      const candidate = structuredClone(twoEvents); mutate(candidate);
      const result = await validatePayload(schemaPath, candidate);
      assert.equal(result.valid, false, field);
      assert.match(result.errors.join("\n"), pattern, field);
      assert.ok(result.errors.some((error) => error.includes(`$.${field}[`)), field);
    }
  }
});

test("TemporalSpec preserves inclusive endpoints, simultaneous events and cross-track associations", async () => {
  const { schemaPath, payload } = await loadContractFixture("temporal-spec");
  for (const field of ["focusTimeline", "actionTimeline", "dynamicLighting"]) {
    payload[field] = [
      { ...payload[field][0], eventId: "event.shared-start", timeSeconds: 0 },
      { ...payload[field][0], eventId: "event.shared-end", timeSeconds: payload.durationSeconds },
      { ...payload[field][0], eventId: `${field.toLowerCase()}.simultaneous`, timeSeconds: payload.durationSeconds },
    ];
  }
  const snapshot = canonicalize(payload);
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(canonicalize(payload), snapshot, "Validation must leave input events unchanged.");
  payload.dynamicLighting = [];
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);
});

test("SequenceRhythmSpec rejects the research counterexamples and single-shot self-transitions", async () => {
  const { schemaPath, payload } = await loadContractFixture("sequence-rhythm-spec");
  const baseline = await validatePayload(schemaPath, payload);
  assert.equal(baseline.valid, true, baseline.errors.join("\n"));
  assert.ok(baseline.unverified.some((item) => item.startsWith("$.validation.storyboardShotsCovered:")));
  for (const [mutate, pattern] of [
    [(p) => { p.shotWindows[0].startFrame = p.shotWindows[0].endFrame + 1; }, /startFrame must not exceed endFrame/],
    [(p) => { p.breathingPoints[0].frame = p.shotWindows[0].endFrame + 1; }, /breathingPoints\[0\]\.frame/],
    [(p) => { p.tempoPhases[0].shotIds[0] = "shot.missing"; }, /tempoPhases\[0\]\.shotIds\[0\]/],
    [(p) => { p.timebase.numerator = 48; p.timebase.denominator = 2; }, /timebase.*reduced/],
    [(p) => { p.shotDurationPolicy.minimumFrames = p.shotDurationPolicy.maximumFrames + 1; }, /minimumFrames <= preferredFrames <= maximumFrames/],
    [(p) => { p.transitions = [{ fromShotId: p.shotWindows[0].shotId, toShotId: p.shotWindows[0].shotId, grammar: "hold", rationale: "Synthetic invalid self-transition" }]; }, /distinct, forward-adjacent/],
  ]) {
    const candidate = structuredClone(payload); mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
});

test("SequenceRhythmSpec enforces continuous inclusive windows and declared duration bounds", async () => {
  const { schemaPath, payload } = await loadContractFixture("sequence-rhythm-spec");
  const threeShots = rhythmWithShots(payload);
  for (const [mutate, pattern] of [
    [(p) => { p.shotWindows[0].startFrame = 1; }, /startFrame must begin at zero/],
    [(p) => { p.shotWindows[1].startFrame = p.shotWindows[0].endFrame; }, /ordered, non-overlapping/],
    [(p) => { p.shotWindows[1].startFrame += 1; }, /preceding endFrame \+ 1/],
    [(p) => { p.shotWindows.reverse(); }, /ordered, non-overlapping/],
    [(p) => { p.shotWindows[1].order = p.shotWindows[0].order; }, /order must be strictly increasing/],
    [(p) => { p.shotWindows[1].shotId = p.shotWindows[0].shotId; }, /shotId must be unique/],
    [(p) => { p.shotDurationPolicy.minimumFrames = 102; p.shotDurationPolicy.preferredFrames = 102; }, /inclusive duration must be within/],
    [(p) => { p.shotDurationPolicy.maximumFrames = 100; }, /inclusive duration must be within/],
    [(p) => { p.shotDurationPolicy.preferredFrames = p.shotDurationPolicy.minimumFrames - 1; }, /minimumFrames <= preferredFrames <= maximumFrames/],
    [(p) => { p.shotDurationPolicy.preferredFrames = p.shotDurationPolicy.maximumFrames + 1; }, /minimumFrames <= preferredFrames <= maximumFrames/],
  ]) {
    const candidate = structuredClone(threeShots); mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
  threeShots.shotDurationPolicy = { minimumFrames: 101, preferredFrames: 101, maximumFrames: 101 };
  assert.equal((await validatePayload(schemaPath, threeShots)).valid, true, "0..100 is exactly 101 frames.");
});

test("SequenceRhythmSpec closes phases and requires real forward-adjacent transitions", async () => {
  const { schemaPath, payload } = await loadContractFixture("sequence-rhythm-spec");
  const threeShots = rhythmWithShots(payload);
  threeShots.tempoPhases.push({ ...threeShots.tempoPhases[0], phaseId: "phase.second", order: 2 });
  const [first, second, third] = threeShots.shotWindows;
  threeShots.transitions = [{ fromShotId: first.shotId, toShotId: second.shotId, grammar: "action_match", rationale: "Continue the selected movement phase." }];
  assert.equal((await validatePayload(schemaPath, threeShots)).valid, true, "A shot may contribute to more than one phase; adjacency does not require every cut to be listed.");
  for (const [mutate, pattern] of [
    [(p) => { p.tempoPhases[1].phaseId = p.tempoPhases[0].phaseId; }, /phaseId must be unique/],
    [(p) => { p.tempoPhases[1].order = p.tempoPhases[0].order; }, /tempoPhases\[1\]\.order/],
    [(p) => { p.tempoPhases.reverse(); }, /order must be strictly increasing/],
    [(p) => { for (const phase of p.tempoPhases) phase.shotIds.pop(); }, /must be covered by a tempoPhase/],
    [(p) => { p.breathingPoints[0].shotId = "shot.missing"; }, /breathingPoints\[0\]\.shotId/],
    [(p) => { p.breathingPoints.push({ shotId: second.shotId, frame: second.startFrame - 1, rationale: "Before its window" }); }, /breathingPoints\[1\]\.frame/],
    [(p) => { p.transitions[0].fromShotId = "shot.missing"; }, /transitions\[0\]\.fromShotId/],
    [(p) => { p.transitions[0].toShotId = "shot.missing"; }, /transitions\[0\]\.toShotId/],
    [(p) => { p.transitions[0].toShotId = third.shotId; }, /distinct, forward-adjacent/],
    [(p) => { p.transitions[0].fromShotId = second.shotId; p.transitions[0].toShotId = first.shotId; }, /distinct, forward-adjacent/],
  ]) {
    const candidate = structuredClone(threeShots); mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
});

test("SequenceRhythmSpec allows one frame, rational broadcast rates and boundary breathing points", async () => {
  const { schemaPath, payload } = await loadContractFixture("sequence-rhythm-spec");
  payload.shotWindows[0].endFrame = 0;
  payload.shotDurationPolicy = { minimumFrames: 1, preferredFrames: 1, maximumFrames: 1 };
  payload.breathingPoints[0].frame = 0;
  payload.timebase = { ...payload.timebase, numerator: 24000, denominator: 1001 };
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);
  const threeShots = rhythmWithShots(payload);
  threeShots.breathingPoints = threeShots.shotWindows.map((window) => ({ shotId: window.shotId, frame: window.startFrame, rationale: "Inclusive single-frame boundary" }));
  threeShots.transitions = [{ fromShotId: threeShots.shotWindows[0].shotId, toShotId: threeShots.shotWindows[1].shotId, grammar: "hard_cut", rationale: "Valid adjacent single-frame windows" }];
  assert.equal((await validatePayload(schemaPath, threeShots)).valid, true);
  threeShots.shotWindows[2].endFrame = 4;
  threeShots.shotDurationPolicy.maximumFrames = 3;
  threeShots.breathingPoints[2].frame = 4;
  assert.equal((await validatePayload(schemaPath, threeShots)).valid, true, "A breathing point can equal a multi-frame window's final inclusive frame.");
});

test("SequenceRhythmSpec verifies upstream coverage only with the exact full storyboard body", async () => {
  const { schemaPath, payload, artifacts } = await rhythmContextFixture();
  const snapshot = canonicalize({ payload, artifacts });
  const result = await validatePayload(schemaPath, payload, { artifacts });
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.deepEqual(result.unverified, []);
  assert.equal(canonicalize({ payload, artifacts }), snapshot, "Registry and payload remain read-only.");
  for (const candidateArtifacts of [undefined, [], [{ ref: { ...artifacts[0].ref, version: 2 }, document: artifacts[0].document }]]) {
    const missing = await validatePayload(schemaPath, payload, { artifacts: candidateArtifacts });
    assert.equal(missing.valid, true);
    assert.ok(missing.unverified.some((item) => item.includes("exact storyboard registry binding unavailable")));
  }
  assert.equal((await validatePayload(schemaPath, payload, { artifacts: {} })).valid, false);
  assert.equal((await validatePayload(schemaPath, payload, { artifacts: [...artifacts, artifacts[0]] })).valid, false);

  for (const [mutate, pattern] of [
    [(a) => { a.document.sequenceTitle += "changed without hash update"; }, /JCS content hash/],
    [(a) => { a.document.kind = "cineweave_codex_shot_spec"; a.ref.contentHash = sha256Canonical(a.document); }, /document kind/],
    [(a) => { a.document.storyboardId = "storyboard.wrong"; a.ref.contentHash = sha256Canonical(a.document); }, /storyboardId or version/],
    [(a) => { a.document.version += 1; a.ref.contentHash = sha256Canonical(a.document); }, /storyboardId or version/],
    [(a) => { delete a.document.version; a.ref.contentHash = sha256Canonical(a.document); }, /storyboardId or version/],
    [(a) => { a.document = { kind: a.document.kind, storyboardId: a.document.storyboardId, version: a.document.version, shots: a.document.shots }; a.ref.contentHash = sha256Canonical(a.document); }, /upstream document.*is required/],
    [(a) => { a.document.shots[1].shotId = a.document.shots[0].shotId; a.ref.contentHash = sha256Canonical(a.document); }, /upstream shots.*unique shotId/],
    [(a) => { a.document.shots.reverse(); a.ref.contentHash = sha256Canonical(a.document); }, /upstream shots.*contiguous ordered/],
  ]) {
    const candidateArtifacts = structuredClone(artifacts); mutate(candidateArtifacts[0]);
    const candidate = { ...payload, storyboardRef: candidateArtifacts[0].ref };
    const invalid = await validatePayload(schemaPath, candidate, { artifacts: candidateArtifacts });
    assert.equal(invalid.valid, false);
    assert.match(invalid.errors.join("\n"), pattern);
    assert.ok(invalid.unverified.some((item) => item.startsWith("$.validation.storyboardShotsCovered:")));
  }
});

test("SequenceRhythmSpec rejects missing, extra or reordered shots against exact upstream context", async () => {
  const { schemaPath, payload, artifacts } = await rhythmContextFixture();
  for (const [mutate, pattern] of [
    [(p) => { p.shotWindows.pop(); p.tempoPhases[0].shotIds.pop(); }, /every exact storyboard shot once/],
    [(p) => { p.shotWindows[2].shotId = "shot.unlisted"; p.tempoPhases[0].shotIds[2] = "shot.unlisted"; }, /no missing or extra shots/],
    [(p) => { [p.shotWindows[0].shotId, p.shotWindows[1].shotId] = [p.shotWindows[1].shotId, p.shotWindows[0].shotId]; p.breathingPoints = []; }, /order must match the exact storyboard/],
  ]) {
    const candidate = structuredClone(payload); mutate(candidate);
    const result = await validatePayload(schemaPath, candidate, { artifacts });
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
});

test("PerformanceTimeline enforces its declared phase timing invariants", async () => {
  const { schemaPath, payload } = await loadContractFixture("performance-timeline");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);
  for (const [mutate, pattern] of [
    [(p) => { p.phases[1].phaseId = p.phases[0].phaseId; }, /unique/],
    [(p) => { p.phases[1].startSeconds = p.phases[1].endSeconds; }, /positive duration/],
    [(p) => { p.phases[1].startSeconds = 0; }, /non-overlapping/],
    [(p) => { p.phases.reverse(); }, /ordered/],
    [(p) => { p.phases.at(-1).endSeconds += 1; }, /exceeds durationSeconds/],
  ]) {
    const candidate = structuredClone(payload); mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
  payload.phases[1].startSeconds += 0.2;
  assert.equal((await validatePayload(schemaPath, payload)).valid, true, "A gap may hold the preceding state; full coverage is not required.");
});

test("RepairPlan rejects contradictory approval, malformed paths and duplicate checks", async () => {
  const { schemaPath, payload } = await loadContractFixture("repair-plan");
  for (const mutate of [
    (p) => { p.status = "approved"; p.humanGate.status = "rejected"; },
    (p) => { p.status = "rejected"; p.humanGate.status = "approved"; },
    (p) => { p.change.targetPath = "/bad~2escape"; },
    (p) => { p.change.targetPath = "not-a-pointer"; },
    (p) => { p.acceptanceChecks.push(p.acceptanceChecks[0]); },
    (p) => { p.acceptanceChecks = {}; },
  ]) {
    const candidate = structuredClone(payload);
    mutate(candidate);
    assert.equal((await validatePayload(schemaPath, candidate)).valid, false);
  }
  const result = await validatePayload(schemaPath, payload);
  assert.equal(result.valid, true);
  assert.ok(result.unverified.some((value) => value.startsWith("sourceReviewRef:")));
});

test("RepairPlan checks exact registry hashes, findings, ownership and target pointers", async () => {
  const { schemaPath, payload } = await loadContractFixture("repair-plan");
  const { payload: review } = await loadContractFixture("creative-review");
  const target = { kind: payload.targetRef.kind, constraints: { "left/hand": { "support~anchor": "threshold" } } };
  payload.change.targetPath = "/constraints/left~1hand/support~0anchor";
  payload.targetRef.contentHash = sha256Bytes(canonicalize(target));
  review.targetRefs = [structuredClone(payload.targetRef)];
  payload.sourceReviewRef.contentHash = sha256Bytes(canonicalize(review));
  const artifacts = [
    { ref: structuredClone(payload.sourceReviewRef), document: review },
    { ref: structuredClone(payload.targetRef), document: target },
  ];
  assert.equal((await validatePayload(schemaPath, payload, { artifacts })).valid, true);
  for (const [field, value, pattern] of [
    ["findingId", "missing-finding", /findingId/],
    ["domain", "character", /owner/],
  ]) {
    const result = await validatePayload(schemaPath, { ...payload, [field]: value }, { artifacts });
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), pattern);
  }
  const badPath = structuredClone(payload);
  badPath.change.targetPath = "/constraints/missing";
  assert.equal((await validatePayload(schemaPath, badPath, { artifacts })).valid, false);
  const changed = structuredClone(artifacts);
  changed[1].document.constraints["left/hand"]["support~anchor"] = "changed";
  assert.match((await validatePayload(schemaPath, payload, { artifacts: changed })).errors.join("\n"), /hash/);
  assert.equal((await validatePayload(schemaPath, payload, { artifacts: [...artifacts, artifacts[0]] })).valid, false);
  const passed = structuredClone(artifacts);
  passed[0].document.findings[1].status = "pass";
  passed[0].ref.contentHash = sha256Bytes(canonicalize(passed[0].document));
  const passedPlan = { ...payload, sourceReviewRef: passed[0].ref };
  assert.match((await validatePayload(schemaPath, passedPlan, { artifacts: passed })).errors.join("\n"), /warn or fail/);
});

test("schema-valid target, review and repair survive file/CLI roundtrip and immutable revision", async () => {
  // Synthetic fixtures verify exchange mechanics, never real media or receipt authenticity.
  const targetFixture = await loadContractFixture("interaction-constraint-set");
  const reviewFixture = await loadContractFixture("creative-review");
  const repairFixture = await loadContractFixture("repair-plan");
  const target = targetFixture.payload;
  const review = reviewFixture.payload;
  const repair = repairFixture.payload;
  const bind = (document, id, version) => ({ kind: document.kind, id, version, contentHash: sha256Canonical(document) });
  repair.targetRef = bind(target, target.interactionSetId, 1);
  repair.change.targetPath = "/constraints/contacts/0/targetRef";
  review.targetRefs = [structuredClone(repair.targetRef)];
  repair.sourceReviewRef = bind(review, review.reviewId, review.version);
  const sourceHash = sha256Canonical({ target, review, repair });

  await withDocuments("{}", JSON.stringify({ target, review, repair }, null, 2), async (_, payloadPath) => {
    const loaded = parseJsonStrict(await readFile(payloadPath, "utf8"));
    assert.equal(sha256Canonical(loaded), sourceHash);
    for (const [key, schemaPath] of [
      ["target", targetFixture.schemaPath], ["review", reviewFixture.schemaPath], ["repair", repairFixture.schemaPath],
    ]) {
      const result = await validatePayload(schemaPath, loaded[key]);
      assert.equal(result.valid, true, result.errors.join("\n"));
    }
    const registry = [
      { ref: loaded.repair.targetRef, document: loaded.target },
      { ref: loaded.repair.sourceReviewRef, document: loaded.review },
    ];
    const planPath = join(dirname(payloadPath), "repair.json");
    const registryPath = join(dirname(payloadPath), "registry.json");
    await writeFile(planPath, canonicalize(loaded.repair));
    await writeFile(registryPath, JSON.stringify(registry, null, 2));
    const cli = fileURLToPath(new URL("../scripts/validate-output.mjs", import.meta.url));
    const output = execFileSync(process.execPath, [cli, repairFixture.schemaPath, planPath, "--artifacts", registryPath], { encoding: "utf8" });
    const result = parseJsonStrict(output);
    assert.equal(result.valid, true);
    assert.ok(result.unverified.some((item) => item.includes("Observed media")));
    assert.ok(!result.unverified.some((item) => item.includes("binding unavailable") || item.includes("upstream repair")));

    const missing = await validatePayload(repairFixture.schemaPath, loaded.repair, { artifacts: registry.slice(1) });
    assert.equal(missing.valid, true);
    assert.ok(missing.unverified.some((item) => item.startsWith("targetRef:")));

    const tampered = structuredClone(registry);
    tampered[0].document.constraints.contacts[0].targetRef = "anchor.revised-floor";
    await writeFile(registryPath, JSON.stringify(tampered));
    assert.throws(() => execFileSync(process.execPath, [cli, repairFixture.schemaPath, planPath, "--artifacts", registryPath], { encoding: "utf8", stdio: "pipe" }), (error) => {
      assert.equal(error.status, 2);
      assert.match(parseJsonStrict(error.stderr).errors.join("\n"), /hash/);
      return true;
    });

    // Promote a new external target revision and a new review without modifying old hashes.
    const next = structuredClone(loaded);
    next.target.constraints.contacts[0].targetRef = "anchor.revised-floor";
    next.repair.version += 1;
    next.repair.targetRef = bind(next.target, next.target.interactionSetId, 2);
    next.review.version += 1;
    next.review.targetRefs = [structuredClone(next.repair.targetRef)];
    next.repair.sourceReviewRef = bind(next.review, next.review.reviewId, next.review.version);
    const revisedRegistry = [
      { ref: next.repair.targetRef, document: next.target },
      { ref: next.repair.sourceReviewRef, document: next.review },
    ];
    for (const [key, fixture] of [["target", targetFixture], ["review", reviewFixture], ["repair", repairFixture]]) {
      const revised = await validatePayload(fixture.schemaPath, next[key], { artifacts: revisedRegistry });
      assert.equal(revised.valid, true, revised.errors.join("\n"));
    }
    assert.notEqual(next.repair.targetRef.contentHash, loaded.repair.targetRef.contentHash);
    assert.notEqual(next.repair.sourceReviewRef.contentHash, loaded.repair.sourceReviewRef.contentHash);
    assert.equal(sha256Canonical(loaded), sourceHash);
    const old = await validatePayload(repairFixture.schemaPath, loaded.repair, { artifacts: registry });
    assert.equal(old.valid, true);
    const stale = await validatePayload(repairFixture.schemaPath, loaded.repair, { artifacts: revisedRegistry });
    assert.ok(stale.unverified.some((item) => item.startsWith("sourceReviewRef:")));
    const wrongReviewVersion = structuredClone(next.repair);
    wrongReviewVersion.sourceReviewRef.version = 1;
    const mismatched = await validatePayload(repairFixture.schemaPath, wrongReviewVersion, { artifacts: [
      revisedRegistry[0], { ref: wrongReviewVersion.sourceReviewRef, document: next.review },
    ] });
    assert.match(mismatched.errors.join("\n"), /version mismatch/);
  });
});

test("contract equality is independent of object key order", async () => {
  const result = await withDocuments(
    JSON.stringify({
      type: "object",
      properties: { value: { const: { first: 1, second: 2 } } },
      required: ["value"],
    }),
    JSON.stringify({ value: { second: 2, first: 1 } }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("uniqueItems treats structurally equal objects as duplicates", async () => {
  const result = await withDocuments(
    JSON.stringify({ type: "array", uniqueItems: true }),
    JSON.stringify([{ first: 1, second: 2 }, { second: 2, first: 1 }]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );

  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /duplicates an earlier item/);
});

test("required and additionalProperties use own JSON properties", async () => {
  const requiredResult = await withDocuments(
    JSON.stringify({ type: "object", required: ["toString"] }),
    "{}",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(requiredResult.valid, false);
  assert.match(requiredResult.errors.join("\n"), /toString.*required/);

  const additionalResult = await withDocuments(
    JSON.stringify({ type: "object", additionalProperties: false }),
    JSON.stringify({ toString: "owned" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(additionalResult.valid, false);
  assert.match(additionalResult.errors.join("\n"), /toString.*not allowed/);
});

test("contract documents reject duplicate JSON object keys", async () => {
  await assert.rejects(
    () => withDocuments(
      '{"type":"object"}',
      '{"value":1,"value":2}',
      (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
    ),
    /Duplicate object key/,
  );
});

test("contract formats count Unicode code points and require RFC3339 date-times", async () => {
  const unicodeResult = await withDocuments(
    JSON.stringify({ type: "string", minLength: 1, maxLength: 1 }),
    JSON.stringify("😀"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(unicodeResult.valid, true);

  const dateResult = await withDocuments(
    JSON.stringify({ type: "string", format: "date-time" }),
    JSON.stringify("2026-08-21"),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(dateResult.valid, false);
  assert.match(dateResult.errors.join("\n"), /date-time/);
});

test("contract array items support false schemas and tuple tails", async () => {
  const forbiddenResult = await withDocuments(
    JSON.stringify({ type: "array", items: false }),
    "[1]",
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbiddenResult.valid, false);

  const tupleResult = await withDocuments(
    JSON.stringify({ type: "array", prefixItems: [{ type: "string" }], items: { type: "number" } }),
    JSON.stringify(["label", 1]),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(tupleResult.valid, true);
});

test("not rejects forbidden required-property branches", async () => {
  const schema = JSON.stringify({
    type: "object",
    properties: {
      stable: { type: "string" },
      legacyRef: { type: "object" },
      otherLegacyRef: { type: "object" },
    },
    not: {
      anyOf: [
        { required: ["legacyRef"] },
        { required: ["otherLegacyRef"] },
      ],
    },
  });

  const allowed = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only" }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(allowed.valid, true);

  const forbidden = await withDocuments(
    schema,
    JSON.stringify({ stable: "upstream-only", legacyRef: {} }),
    (schemaPath, payloadPath) => validateDocument(schemaPath, payloadPath),
  );
  assert.equal(forbidden.valid, false);
  assert.match(forbidden.errors.join("\n"), /must not match the forbidden schema/);
});

test("PromptProjectionPlan readiness requires truthful compatibility and rights gates", async () => {
  const { schemaPath, payload } = await loadContractFixture("prompt-projection-plan");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);

  const blocking = structuredClone(payload);
  blocking.compatibilityChecks[1].status = "unknown";
  assert.equal((await validatePayload(schemaPath, blocking)).valid, false);

  const missingRights = structuredClone(payload);
  missingRights.compatibilityChecks = missingRights.compatibilityChecks.filter((check) => check.checkId !== "check.rights-licensing");
  assert.equal((await validatePayload(schemaPath, missingRights)).valid, false);

  const blockedDefault = structuredClone(payload);
  blockedDefault.manualHandoff.hiddenDefaultChecks[0].status = "blocked";
  assert.equal((await validatePayload(schemaPath, blockedDefault)).valid, false);

  const splitReadiness = structuredClone(payload);
  splitReadiness.status = "needs_review";
  assert.equal((await validatePayload(schemaPath, splitReadiness)).valid, false);
});

test("CapabilityResolutionPlan joins requirements, results, and selection truthfully", async () => {
  const { schemaPath, payload } = await loadContractFixture("capability-resolution-plan");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);

  const leakedSelection = structuredClone(payload);
  leakedSelection.selection.selectedCandidateId = leakedSelection.candidates[0].candidateId;
  assert.equal((await validatePayload(schemaPath, leakedSelection)).valid, false);

  const unknownPass = structuredClone(payload);
  unknownPass.candidates[0].capabilityResults[0].support = "unknown";
  unknownPass.candidates[0].capabilityResults[0].status = "pass";
  assert.equal((await validatePayload(schemaPath, unknownPass)).valid, false);

  const missingHardResult = structuredClone(payload);
  missingHardResult.candidates[0].capabilityResults.shift();
  assert.equal((await validatePayload(schemaPath, missingHardResult)).valid, false);

  const selectedWithPartialHardSupport = structuredClone(payload);
  selectedWithPartialHardSupport.status = "selected";
  selectedWithPartialHardSupport.selection.status = "selected";
  selectedWithPartialHardSupport.selection.selectedCandidateId = selectedWithPartialHardSupport.candidates[0].candidateId;
  selectedWithPartialHardSupport.selection.selectedCapabilityProfileRef = structuredClone(selectedWithPartialHardSupport.candidates[0].capabilityProfileRef);
  selectedWithPartialHardSupport.candidates[0].status = "selected";
  assert.equal((await validatePayload(schemaPath, selectedWithPartialHardSupport)).valid, false);

  const selected = structuredClone(selectedWithPartialHardSupport);
  selected.candidates[0].capabilityResults[0] = {
    ...selected.candidates[0].capabilityResults[0],
    support: "strong",
    status: "pass",
    score: 1,
    reason: "The exact profile records strong support for the hard identity requirement.",
  };
  selected.candidates[0].warnings = [];
  selected.candidates[0].rationale = "Every hard requirement is strongly supported and passing.";
  selected.selection.rationale = "Select the exact capability profile for the approved planning path.";
  selected.explanation.primaryDecision = "The exact capability profile satisfies every hard requirement.";
  assert.equal((await validatePayload(schemaPath, selected)).valid, true);
});

test("CapabilityResolutionPlan cannot advance failed candidates or invent fallbacks", async () => {
  const { schemaPath, payload } = await loadContractFixture("capability-resolution-plan");
  const mutations = [
    ["partial hard support marked eligible", (p) => { p.candidates[0].status = "eligible"; }, /cannot be eligible/],
    ["failed hard support marked review", (p) => { p.candidates[0].capabilityResults[0].status = "fail"; }, /must be blocked/],
    ["explicit hard failure marked review", (p) => { p.candidates[0].hardFailures = ["Missing required input support"]; }, /must be blocked/],
    ["nonexistent fallback", (p) => { p.explanation.fallbackCandidateIds = ["candidate.missing"]; }, /unknown candidate/],
    ["blocked fallback", (p) => { p.candidates[0].status = "blocked"; p.explanation.fallbackCandidateIds = [p.candidates[0].candidateId]; }, /cannot include blocked/],
  ];
  for (const [label, mutate, expected] of mutations) {
    const candidate = structuredClone(payload);
    mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false, label);
    assert.match(result.errors.join("\n"), expected, label);
  }
  const reviewFallback = structuredClone(payload);
  reviewFallback.explanation.fallbackCandidateIds = [payload.candidates[0].candidateId];
  assert.equal((await validatePayload(schemaPath, reviewFallback)).valid, true);
});

test("ShotCompilerPlan keeps displayed controls and planned handoffs on the same exact inputs", async () => {
  const { schemaPath, payload } = await loadContractFixture("shot-compiler-plan");
  assert.equal((await validatePayload(schemaPath, payload)).valid, true);
  const mutations = [
    ["duplicate parameter", (p) => { p.parameterValues.push(structuredClone(p.parameterValues[0])); }, /parameterId duplicates/],
    ["duplicate binding", (p) => { p.resolvedBindings.push(structuredClone(p.resolvedBindings[0])); }, /slotId duplicates/],
    ["changed display value", (p) => { p.controlSurface.groups[0].controls[0].value = 0.99; }, /value must equal/],
    ["unknown control parameter", (p) => { p.controlSurface.groups[0].controls[0].parameterId = "missing"; }, /unknown parameter/],
    ["forged owner", (p) => { p.handoffs[1].ownerRoute = "scene"; }, /not owned by scene/],
    ["control owner differs from target", (p) => { p.controlSurface.groups[0].controls[0].ownerRoute = "scene"; }, /ownerRoute must match/],
    ["stale dependency", (p) => { p.handoffs[0].dependencyRefs[0].version += 1; }, /stale input ref/],
    ["omitted binding dependency", (p) => { p.handoffs[0].dependencyRefs.shift(); }, /must retain exact source ref/],
    ["alias without registry", (p) => { p.resolvedBindings[0].source = "asset_alias"; p.resolvedBindings[0].alias = "@hero"; }, /exact registry ref/],
    ["duplicate target assignment", (p) => { p.handoffs[0].fieldAssignments.push(structuredClone(p.handoffs[0].fieldAssignments[0])); }, /duplicates target/],
    ["trace order reversed", (p) => { p.compileTrace.steps.reverse(); }, /strictly increasing/],
    ["unknown trace input", (p) => { p.compileTrace.steps[0].source.id = "missing"; }, /unknown binding slot/],
    ["missing handoff", (p) => { p.handoffs.pop(); }, /matching planned field assignment/],
    ["conflicting trace assignment", (p) => { p.compileTrace.steps[1].target.fieldPath = "camera.focalLengthMm"; }, /matching planned field assignment/],
  ];
  for (const [label, mutate, expected] of mutations) {
    const candidate = structuredClone(payload);
    mutate(candidate);
    const result = await validatePayload(schemaPath, candidate);
    assert.equal(result.valid, false, label);
    assert.match(result.errors.join("\n"), expected, label);
  }
  const aliasPlan = structuredClone(payload);
  aliasPlan.resolvedBindings[0].source = "asset_alias";
  aliasPlan.resolvedBindings[0].alias = "@hero";
  aliasPlan.assetAliasRegistryRef = {
    kind: "cineweave_codex_asset_alias_registry", id: "registry.test", version: 1,
    contentHash: `sha256:${"a".repeat(64)}`,
  };
  assert.equal((await validatePayload(schemaPath, aliasPlan)).valid, true);
});
