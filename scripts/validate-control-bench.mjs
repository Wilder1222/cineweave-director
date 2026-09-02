#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Canonical } from "../packages/cineweave-runtime/src/canonical-json.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = async (path) => JSON.parse(await readFile(resolve(repoRoot, "packages/cineweave-contracts", path), "utf8"));

function validateCrossContracts({ benchmark, review, recipe, controls, evidence, capability, license, catalog, cameraPrevis, directorArtifacts }) {
  const errors = [];
  const recipeIds = new Set([recipe.recipeId, ...(catalog.recipes || []).map((item) => item.recipeId)]);
  const metricIds = new Set((benchmark.metrics || []).map((item) => item.metricId));
  for (const dimension of benchmark.dimensions || []) for (const id of dimension.metricIds || []) if (!metricIds.has(id)) errors.push(`${dimension.dimensionId} references unknown metric ${id}`);
  for (const testCase of benchmark.cases || []) {
    if (!recipeIds.has(testCase.recipeRef.id)) errors.push(testCase.caseId + " references unknown recipe " + testCase.recipeRef.id);
    if (testCase.controlSetRef.id !== controls.controlSetId) errors.push(testCase.caseId + " references unknown control set");
    if (testCase.evidenceBundleRef.id !== evidence.bundleId) errors.push(testCase.caseId + " references unknown evidence bundle");
    if (testCase.category === "cinematography") {
      const ref = testCase.cameraPrevisRef;
      const exact = ref?.kind === cameraPrevis.kind
        && ref?.id === cameraPrevis.cameraPrevisSpecId
        && ref?.version === cameraPrevis.version
        && ref?.contentHash === sha256Canonical(cameraPrevis);
      if (!exact) errors.push(testCase.caseId + " does not bind the canonical CameraPrevisSpec");
    }
  }
  const capabilities = new Map((capability.capabilities || []).map((item) => [item.capabilityId, item.support]));
  for (const channel of controls.channels || []) for (const requirement of channel.adapterRequirements || []) {
    if (!capabilities.has(requirement) || capabilities.get(requirement) === "unsupported") errors.push(`${channel.channelId} has unsupported capability ${requirement}`);
  }
  const roles = new Set((evidence.evidence || []).map((item) => item.role));
  for (const role of evidence.requirements.requiredRoles || []) if (!roles.has(role)) errors.push(`missing required evidence role ${role}`);
  for (const item of evidence.evidence || []) if (item.licenseProfileRef.id !== license.profileId) errors.push(`${item.evidenceId} does not resolve to supplied license profile`);
  if (license.commercialUse === "allowed" && license.status !== "verified") errors.push("commercial use allowed requires verified license status");
  const categories = new Set((benchmark.cases || []).map((item) => item.category));
  const requiredCategoryByScope = new Map([
    ["MorphologyBench", "morphology"],
    ["HumanRealismBench", "surface_realism"],
    ["AnimeBench", "anime_representation"],
    ["MangaBench", "manga_representation"],
    ["CrossRepresentationBench", "cross_representation"],
    ["CinematographyBench", "cinematography"],
    ["DirectorQualityBench", "director_quality"]
  ]);
  for (const scope of benchmark.scopes || []) {
    const requiredCategory = requiredCategoryByScope.get(scope);
    if (requiredCategory && !categories.has(requiredCategory)) errors.push(scope + " requires a " + requiredCategory + " case");
  }
  if ((benchmark.scopes || []).includes("CinematographyBench")) {
    const calibration = benchmark.humanReview?.calibration;
    const anchors = calibration?.anchors || [];
    const dimensionIds = new Set((benchmark.dimensions || []).map((item) => item.dimensionId));
    if (calibration?.blindComparison !== true || calibration?.trainingRequired !== true) errors.push("CinematographyBench requires blind trained reviewer calibration");
    if (!Number.isSafeInteger(calibration?.minimumIndependentReviewers) || calibration.minimumIndependentReviewers < 2) errors.push("CinematographyBench requires at least two independent reviewers");
    if (benchmark.humanReview?.reviewerCount < calibration?.minimumIndependentReviewers) errors.push("CinematographyBench reviewer count is below its calibration minimum");
    if (!anchors.some((item) => item.dimensionId === "dimension.cinematography") || anchors.some((item) => !dimensionIds.has(item.dimensionId))) errors.push("CinematographyBench calibration anchors do not resolve to the benchmark dimensions");
    const reviewCalibration = review.humanReview?.calibration;
    if (reviewCalibration?.protocolId !== calibration?.protocolId) errors.push("ControlBenchmarkReview does not bind the CinematographyBench calibration protocol");
    if (review.status === "planned") {
      const noClaimedResults = ["not_started", "planned"].includes(reviewCalibration?.status)
        && reviewCalibration?.independentReviewerCount === 0
        && reviewCalibration?.agreementScore === null
        && reviewCalibration?.adjudicationStatus === "not_started";
      if (!noClaimedResults) errors.push("planned ControlBenchmarkReview cannot claim calibration results");
    }
  }
  if ((benchmark.scopes || []).includes("DirectorQualityBench")) {
    const calibration = benchmark.humanReview?.calibration;
    const pairing = calibration?.observedMediaCalibration;
    const anchors = calibration?.anchors || [];
    const dimensionIds = new Set((benchmark.dimensions || []).map((item) => item.dimensionId));
    if (calibration?.blindComparison !== true || calibration?.trainingRequired !== true) errors.push("DirectorQualityBench requires blind trained reviewer calibration");
    if (!Number.isSafeInteger(calibration?.minimumIndependentReviewers) || calibration.minimumIndependentReviewers < 2) errors.push("DirectorQualityBench requires at least two independent reviewers");
    if (!pairing || pairing.mode !== "paired_observed_media" || pairing.requiresObservedMedia !== true || pairing.balancedPresentationOrder !== true || pairing.decisionScale !== "left_right_tie" || !Number.isSafeInteger(pairing.minimumPairs) || pairing.minimumPairs < 2) errors.push("DirectorQualityBench requires paired observed-media calibration");
    if (!anchors.some((item) => item.dimensionId === "dimension.direction") || anchors.some((item) => !dimensionIds.has(item.dimensionId))) errors.push("DirectorQualityBench calibration anchors do not resolve to the direction dimension");
    const expectedByKind = new Map((directorArtifacts || []).map((item) => [item.kind, item]));
    const requiredKinds = [
      "cineweave_codex_action_sequence_spec",
      "cineweave_codex_shot_spec",
      "cineweave_codex_shot_lighting_plan",
      "cineweave_codex_temporal_spec",
      "cineweave_codex_camera_previs_spec",
      "cineweave_codex_storyboard_sequence"
    ];
    for (const testCase of benchmark.cases || []) {
      if (testCase.category !== "director_quality") continue;
      const refsByKind = new Map((testCase.directorArtifactRefs || []).map((item) => [item.kind, item]));
      for (const kind of requiredKinds) {
        const expected = expectedByKind.get(kind);
        const ref = refsByKind.get(kind);
        const expectedId = expected?.actionSequenceId || expected?.shotSpecId || expected?.lightingPlanId || expected?.temporalSpecId || expected?.cameraPrevisSpecId || expected?.storyboardId;
        const exact = Boolean(expected && ref)
          && ref.id === expectedId
          && ref.version === expected.version
          && ref.contentHash === sha256Canonical(expected);
        if (!exact || ref.kind !== kind || ref.id !== expectedId) errors.push(testCase.caseId + " does not bind the canonical " + kind);
      }
    }
    const reviewCalibration = review.humanReview?.calibration;
    if (review.status === "planned" && (reviewCalibration?.pairResults || []).length > 0) errors.push("planned ControlBenchmarkReview cannot contain DirectorQualityBench calibration pairs");
  }
  if (!(benchmark.cases || []).some((item) => item.category === "rights")) errors.push("ControlBench requires a rights case");
  const expectedCaseIds = (benchmark.cases || []).map((item) => item.caseId).sort();
  const reviewCaseIds = (review.caseResults || []).map((item) => item.caseId).sort();
  if (review.benchmarkRef?.id !== benchmark.suiteId || review.benchmarkRef?.version !== benchmark.version) errors.push("ControlBenchmarkReview does not bind the supplied ControlBench version");
  if (JSON.stringify(reviewCaseIds) !== JSON.stringify(expectedCaseIds)) errors.push("ControlBenchmarkReview does not cover every ControlBench case exactly once");
  if (review.status === "planned") {
    if ((review.mediaEvidence || []).length !== 0) errors.push("planned ControlBenchmarkReview cannot contain media evidence");
    if (!(review.caseResults || []).every((item) => item.status === "planned")) errors.push("planned ControlBenchmarkReview must leave all cases planned");
    if (review.decision?.mayAdvanceToApproval !== false) errors.push("planned ControlBenchmarkReview cannot advance a candidate");
  }
  return errors;
}

async function loadAll() {
  return {
    benchmark: await read("examples/control-benchmark.json"), review: await read("examples/control-benchmark-review.json"), recipe: await read("examples/asset-recipe.json"), controls: await read("examples/control-channel-set.json"), evidence: await read("examples/evidence-bundle.json"), capability: await read("examples/capability-profile.json"), license: await read("examples/license-profile.json"), catalog: await read("recipes/catalog.json"), cameraPrevis: await read("examples/camera-previs-spec.json"), directorArtifacts: [
      await read("examples/action-sequence-spec.json"),
      await read("examples/shot-spec-action.json"),
      await read("examples/shot-lighting-plan.json"),
      await read("examples/temporal-spec.json"),
      await read("examples/camera-previs-spec.json"),
      await read("examples/storyboard-action-sequence.json")
    ],
  };
}

async function selfTest() {
  const data = await loadAll();
  const errors = validateCrossContracts(data);
  if (errors.length) { for (const error of errors) console.error(`- ${error}`); return false; }
  console.log("ControlBench cross-contract pass");

  const badCapability = structuredClone(data);
  badCapability.capability.capabilities = badCapability.capability.capabilities.filter((item) => item.capabilityId !== "face_identity");
  if (!validateCrossContracts(badCapability).length) { console.error("Negative test failed: missing hard capability was accepted"); return false; }
  console.log("Rejected as expected: missing hard capability");

  const badRights = structuredClone(data);
  badRights.license.status = "draft";
  if (!validateCrossContracts(badRights).length) { console.error("Negative test failed: unresolved commercial rights were accepted"); return false; }
  console.log("Rejected as expected: unresolved commercial rights");

  const badFamilyCoverage = structuredClone(data);
  badFamilyCoverage.benchmark.cases = badFamilyCoverage.benchmark.cases.filter((item) => item.category !== "anime_representation");
  if (!validateCrossContracts(badFamilyCoverage).length) { console.error("Negative test failed: AnimeBench without an anime case was accepted"); return false; }
  console.log("Rejected as expected: missing AnimeBench family case");

  const badCameraPrevis = structuredClone(data);
  delete badCameraPrevis.benchmark.cases.find((item) => item.category === "cinematography").cameraPrevisRef;
  if (!validateCrossContracts(badCameraPrevis).length) { console.error("Negative test failed: CinematographyBench without CameraPrevisSpec was accepted"); return false; }
  console.log("Rejected as expected: missing canonical CameraPrevisSpec");

  const badDirectorQuality = structuredClone(data);
  delete badDirectorQuality.benchmark.cases.find((item) => item.category === "director_quality").directorArtifactRefs;
  if (!validateCrossContracts(badDirectorQuality).length) { console.error("Negative test failed: DirectorQualityBench without exact Director artifacts was accepted"); return false; }
  console.log("Rejected as expected: missing canonical Director artifacts");

  const badCalibration = structuredClone(data);
  delete badCalibration.benchmark.humanReview.calibration;
  if (!validateCrossContracts(badCalibration).length) { console.error("Negative test failed: CinematographyBench without reviewer calibration was accepted"); return false; }
  console.log("Rejected as expected: missing blinded reviewer calibration");

  const badPlannedCalibration = structuredClone(data);
  badPlannedCalibration.review.humanReview.calibration.agreementScore = 0.95;
  if (!validateCrossContracts(badPlannedCalibration).length) { console.error("Negative test failed: planned ControlBenchmarkReview claimed calibration results"); return false; }
  console.log("Rejected as expected: planned calibration result");

  const badPlannedDirectorPairs = structuredClone(data);
  badPlannedDirectorPairs.review.humanReview.calibration.pairResults = [{ pairId: "pair.planned", caseId: "case.director-quality-rain-teahouse", dimensionId: "dimension.direction", leftMediaId: "media.left", rightMediaId: "media.right", decision: "tie", evidenceObservationIds: ["obs.left", "obs.right"] }];
  if (!validateCrossContracts(badPlannedDirectorPairs).length) { console.error("Negative test failed: planned DirectorQualityBench calibration pairs were accepted"); return false; }
  console.log("Rejected as expected: planned DirectorQualityBench pairs");

  const badReviewCoverage = structuredClone(data);
  badReviewCoverage.review.caseResults.pop();
  if (!validateCrossContracts(badReviewCoverage).length) { console.error("Negative test failed: incomplete ControlBenchmarkReview was accepted"); return false; }
  console.log("Rejected as expected: incomplete ControlBenchmarkReview coverage");

  const badReviewAdvance = structuredClone(data);
  badReviewAdvance.review.decision.mayAdvanceToApproval = true;
  if (!validateCrossContracts(badReviewAdvance).length) { console.error("Negative test failed: planned ControlBenchmarkReview advanced"); return false; }
  console.log("Rejected as expected: planned ControlBenchmarkReview advance");
  return true;
}

async function main() {
  if (process.argv[2] === "--self-test") { process.exitCode = (await selfTest()) ? 0 : 1; return; }
  const data = await loadAll();
  const errors = validateCrossContracts(data);
  if (errors.length) { console.error(JSON.stringify({ valid: false, errors }, null, 2)); process.exitCode = 2; return; }
  console.log(JSON.stringify({ valid: true }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.stack || error.message : String(error)); process.exitCode = 2; });
