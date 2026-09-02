import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateByKind } from "../../scripts/validate-contract-semantics.mjs";
import { validatePayload } from "../../scripts/validate-output.mjs";
import { sha256Canonical } from "../../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contractRoot = join(repoRoot, "packages", "cineweave-contracts");
const benchmarkSchemaPath = join(contractRoot, "schemas", "control-benchmark.schema.json");
const reviewSchemaPath = join(contractRoot, "schemas", "control-benchmark-review.schema.json");
const benchmark = JSON.parse(await readFile(join(contractRoot, "examples", "control-benchmark.json"), "utf8"));
const review = JSON.parse(await readFile(join(contractRoot, "examples", "control-benchmark-review.json"), "utf8"));
const cameraPrevis = JSON.parse(await readFile(join(contractRoot, "examples", "camera-previs-spec.json"), "utf8"));

test("ControlBench has a CameraPrevis-bound cinematography suite without claiming media evidence", async () => {
  assert.ok(benchmark.scopes.includes("CinematographyBench"));
  const dimension = benchmark.dimensions.find((item) => item.dimensionId === "dimension.cinematography");
  assert.equal(dimension?.scope, "cinematography");
  assert.deepEqual(dimension?.metricIds, [
    "metric.camera-previs-rule",
    "metric.camera-path-layout",
    "metric.camera-motion-temporal",
    "metric.human-cinematography"
  ]);
  const cameraCase = benchmark.cases.find((item) => item.category === "cinematography");
  assert.equal(cameraCase?.cameraPrevisRef?.kind, "cineweave_codex_camera_previs_spec");
  assert.equal(cameraCase?.cameraPrevisRef?.id, "camera-previs.rain-courtyard-recognition-v1");
  assert.equal(cameraCase?.cameraPrevisRef?.contentHash, sha256Canonical(cameraPrevis));
  assert.equal(cameraCase?.humanReviewRequired, true);
  const schemaResult = await validatePayload(benchmarkSchemaPath, benchmark);
  assert.equal(schemaResult.valid, true);
  assert.deepEqual(validateByKind(benchmark), []);

  const reviewCase = review.caseResults.find((item) => item.caseId === cameraCase.caseId);
  assert.equal(reviewCase?.status, "planned");
  assert.deepEqual(reviewCase?.reviewedMediaIds, []);
  assert.deepEqual(validateByKind(review, { benchmark }), []);
});

test("DirectorQualityBench binds exact Director artifacts and a paired observed-media calibration design", async () => {
  assert.ok(benchmark.scopes.includes("DirectorQualityBench"));
  const dimension = benchmark.dimensions.find((item) => item.dimensionId === "dimension.direction");
  assert.equal(dimension?.scope, "direction");
  assert.deepEqual(dimension?.metricIds, [
    "metric.shot-purpose-readability",
    "metric.action-coverage-rule",
    "metric.spatial-continuity-rule",
    "metric.temporal-causality-rule",
    "metric.human-direction"
  ]);
  const qualityCase = benchmark.cases.find((item) => item.category === "director_quality");
  assert.ok(qualityCase);
  assert.equal(qualityCase.directorArtifactRefs.length, 6);
  assert.deepEqual(new Set(qualityCase.directorArtifactRefs.map((item) => item.kind)), new Set([
    "cineweave_codex_action_sequence_spec",
    "cineweave_codex_shot_spec",
    "cineweave_codex_shot_lighting_plan",
    "cineweave_codex_temporal_spec",
    "cineweave_codex_camera_previs_spec",
    "cineweave_codex_storyboard_sequence"
  ]));
  assert.equal(qualityCase.directorArtifactRefs.find((item) => item.kind === "cineweave_codex_shot_spec")?.contentHash, sha256Canonical(JSON.parse(await readFile(join(contractRoot, "examples", "shot-spec-action.json"), "utf8"))));
  assert.equal(qualityCase.directorArtifactRefs.find((item) => item.kind === "cineweave_codex_storyboard_sequence")?.contentHash, sha256Canonical(JSON.parse(await readFile(join(contractRoot, "examples", "storyboard-action-sequence.json"), "utf8"))));
  const pairing = benchmark.humanReview.calibration.observedMediaCalibration;
  assert.equal(pairing.mode, "paired_observed_media");
  assert.equal(pairing.minimumPairs, 2);
  assert.equal(pairing.requiresObservedMedia, true);
  assert.equal(pairing.balancedPresentationOrder, true);
  assert.equal(pairing.decisionScale, "left_right_tie");
  assert.ok(benchmark.humanReview.calibration.anchors.some((item) => item.dimensionId === "dimension.direction"));
  assert.deepEqual(validateByKind(benchmark), []);
  assert.deepEqual(validateByKind(review, { benchmark }), []);
});

test("ControlBenchmarkReview accepts completed paired calibration only with exact observed media evidence", async () => {
  const completed = structuredClone(review);
  const leftMedia = {
    mediaId: "media.calibration-left",
    executionReceiptRef: {
      kind: "cineweave_execution_receipt",
      id: "receipt.calibration-left",
      version: 1,
      contentHash: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
    },
    mediaImportRef: {
      kind: "cineweave_codex_media_import",
      id: "media-import.calibration-left",
      version: 1,
      contentHash: "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    },
    candidateObservationIds: ["obs.calibration-left"]
  };
  const rightMedia = {
    mediaId: "media.calibration-right",
    executionReceiptRef: {
      kind: "cineweave_execution_receipt",
      id: "receipt.calibration-right",
      version: 1,
      contentHash: "sha256:3333333333333333333333333333333333333333333333333333333333333333"
    },
    mediaImportRef: {
      kind: "cineweave_codex_media_import",
      id: "media-import.calibration-right",
      version: 1,
      contentHash: "sha256:4444444444444444444444444444444444444444444444444444444444444444"
    },
    candidateObservationIds: ["obs.calibration-right"]
  };
  completed.status = "completed";
  completed.mediaEvidence = [leftMedia, rightMedia];
  completed.caseResults = benchmark.cases.map((item, index) => ({
    caseId: item.caseId,
    status: "pass",
    reviewedMediaIds: [leftMedia.mediaId],
    findings: [{
      findingId: "finding.calibration." + index,
      dimensionId: "dimension.direction",
      severity: "advisory",
      status: "pass",
      owner: "director",
      evidenceObservationIds: [leftMedia.candidateObservationIds[0]],
      evidence: "Synthetic structural test evidence only."
    }],
    metricResults: [{
      metricId: "metric.human-direction",
      status: "pass",
      method: "human",
      value: true,
      evidenceObservationIds: [leftMedia.candidateObservationIds[0]]
    }],
    notes: "Synthetic structural test result; not a claim about media quality."
  }));
  completed.humanReview.status = "completed";
  completed.humanReview.reviewerCount = 2;
  completed.humanReview.completedAt = "2026-09-02T00:00:00.000Z";
  completed.humanReview.calibration = {
    protocolId: benchmark.humanReview.calibration.protocolId,
    status: "completed",
    independentReviewerCount: 2,
    agreementScore: 0.9,
    adjudicationStatus: "not_required",
    pairResults: [
      {
        pairId: "pair.calibration.one",
        caseId: "case.director-quality-rain-teahouse",
        dimensionId: "dimension.direction",
        leftMediaId: leftMedia.mediaId,
        rightMediaId: rightMedia.mediaId,
        decision: "tie",
        presentationOrder: "left_first",
        evidenceObservationIds: [leftMedia.candidateObservationIds[0], rightMedia.candidateObservationIds[0]]
      },
      {
        pairId: "pair.calibration.two",
        caseId: "case.cinematography-camera-previs-rain-courtyard",
        dimensionId: "dimension.cinematography",
        leftMediaId: leftMedia.mediaId,
        rightMediaId: rightMedia.mediaId,
        decision: "left",
        presentationOrder: "right_first",
        evidenceObservationIds: [leftMedia.candidateObservationIds[0], rightMedia.candidateObservationIds[0]]
      }
    ]
  };
  completed.decision = {
    overallStatus: "pass",
    nextAction: "retain_candidate",
    mayAdvanceToApproval: true,
    blockingFindingIds: [],
    summary: "Synthetic structural test result; observed media and human review are required in production."
  };
  assert.equal((await validatePayload(reviewSchemaPath, completed)).valid, true);
  assert.deepEqual(validateByKind(completed, { benchmark }), []);

  const sameMedia = structuredClone(completed);
  sameMedia.humanReview.calibration.pairResults[0].rightMediaId = leftMedia.mediaId;
  assert.match(validateByKind(sameMedia, { benchmark }).join("\n"), /calibration pair must compare two distinct media items/);

  const oneSidedEvidence = structuredClone(completed);
  oneSidedEvidence.humanReview.calibration.pairResults[0].evidenceObservationIds = [leftMedia.candidateObservationIds[0]];
  assert.match(validateByKind(oneSidedEvidence, { benchmark }).join("\n"), /calibration pair evidence must include observations bound to both media items/);

  const unbalancedOrder = structuredClone(completed);
  unbalancedOrder.humanReview.calibration.pairResults[1].presentationOrder = "left_first";
  assert.match(validateByKind(unbalancedOrder, { benchmark }).join("\n"), /requires balanced observed-media presentation order/);
});

test("CinematographyBench rejects a camera case without an exact CameraPrevis reference", async () => {
  const invalid = structuredClone(benchmark);
  const cameraCase = invalid.cases.find((item) => item.category === "cinematography");
  delete cameraCase.cameraPrevisRef;
  const schemaResult = await validatePayload(benchmarkSchemaPath, invalid);
  assert.equal(schemaResult.valid, false);
  assert.match(schemaResult.errors.join("\n"), /cameraPrevisRef/);
  assert.match(validateByKind(invalid).join("\n"), /CinematographyBench requires an exact CameraPrevisSpec reference/);
});

test("CinematographyBench defines a blind calibrated human-review protocol without fabricating calibration results", async () => {
  const calibration = benchmark.humanReview.calibration;
  assert.equal(calibration?.protocolId, "calibration.cinematography-camera-previs-v1");
  assert.equal(calibration?.blindComparison, true);
  assert.equal(calibration?.minimumIndependentReviewers, 2);
  assert.equal(calibration?.agreementMeasure, "percent_agreement");
  assert.equal(calibration?.minimumAgreement, 0.8);
  assert.equal(calibration?.disagreementResolution, "third_reviewer");
  assert.ok(calibration?.anchors?.some((item) => item.dimensionId === "dimension.cinematography"));
  assert.equal(benchmark.humanReview.reviewerCount, 2);

  const reviewCalibration = review.humanReview.calibration;
  assert.equal(reviewCalibration?.protocolId, calibration.protocolId);
  assert.equal(reviewCalibration?.status, "planned");
  assert.equal(reviewCalibration?.independentReviewerCount, 0);
  assert.equal(reviewCalibration?.agreementScore, null);
  assert.equal(reviewCalibration?.adjudicationStatus, "not_started");
  assert.equal((await validatePayload(reviewSchemaPath, review)).valid, true);
  assert.deepEqual(validateByKind(review, { benchmark }), []);
});

test("CinematographyBench rejects missing calibration and planned calibration results", async () => {
  const missingProtocol = structuredClone(benchmark);
  delete missingProtocol.humanReview.calibration;
  const benchmarkSchemaResult = await validatePayload(benchmarkSchemaPath, missingProtocol);
  assert.equal(benchmarkSchemaResult.valid, false);
  assert.match(benchmarkSchemaResult.errors.join("\n"), /calibration/);
  assert.match(validateByKind(missingProtocol).join("\n"), /CinematographyBench requires a calibration protocol/);

  const prematureResult = structuredClone(review);
  prematureResult.humanReview.calibration.agreementScore = 0.95;
  const reviewSchemaResult = await validatePayload(reviewSchemaPath, prematureResult);
  assert.equal(reviewSchemaResult.valid, false);
  assert.match(reviewSchemaResult.errors.join("\n"), /agreementScore/);
  assert.match(validateByKind(prematureResult, { benchmark }).join("\n"), /Planned ControlBenchmarkReview must not claim calibration results/);

  const underReviewed = structuredClone(review);
  underReviewed.status = "completed";
  underReviewed.humanReview.status = "completed";
  underReviewed.humanReview.reviewerCount = 1;
  underReviewed.humanReview.completedAt = "2026-09-01T04:20:00.000Z";
  underReviewed.humanReview.calibration.status = "completed";
  underReviewed.humanReview.calibration.independentReviewerCount = 1;
  underReviewed.humanReview.calibration.agreementScore = 0.9;
  underReviewed.humanReview.calibration.adjudicationStatus = "not_required";
  const underReviewedSchemaResult = await validatePayload(reviewSchemaPath, underReviewed);
  assert.equal(underReviewedSchemaResult.valid, false);
  assert.match(underReviewedSchemaResult.errors.join("\n"), /independentReviewerCount/);
  assert.match(validateByKind(underReviewed, { benchmark }).join("\n"), /Completed ControlBenchmarkReview requires calibrated independent review/);

  const unresolvedDisagreement = structuredClone(review);
  unresolvedDisagreement.status = "completed";
  unresolvedDisagreement.humanReview.status = "completed";
  unresolvedDisagreement.humanReview.reviewerCount = 2;
  unresolvedDisagreement.humanReview.completedAt = "2026-09-01T04:20:00.000Z";
  unresolvedDisagreement.humanReview.calibration.status = "completed";
  unresolvedDisagreement.humanReview.calibration.independentReviewerCount = 2;
  unresolvedDisagreement.humanReview.calibration.agreementScore = 0.5;
  unresolvedDisagreement.humanReview.calibration.adjudicationStatus = "not_required";
  assert.match(validateByKind(unresolvedDisagreement, { benchmark }).join("\n"), /Below-threshold calibration agreement requires completed adjudication notes/);
});
