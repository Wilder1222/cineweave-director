#!/usr/bin/env node

import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { canonicalize, parseJsonStrict, sha256Bytes } from "./canonical-json.mjs";
import { validateDocument } from "./validate-output.mjs";
import { validateMarkdownFiles } from "./markdown-links.mjs";
import { loadSkillCatalog, validateSkillCatalog, createSkillExportPlan } from "./skill-catalog.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = dirname(scriptDirectory);

const SKILL_NAME = "cineweave-director";
const SKILL_PREFIX = `skills/${SKILL_NAME}`;
const PLUGIN_PATH = ".codex-plugin/plugin.json";
const MARKETPLACE_PATH = ".agents/plugins/marketplace.json";
const LICENSE_PATH = "LICENSE";
const EXPECTED_VERSION = "3.2.0";
// Canonical examples retain their immutable simulated receipt provenance.
const EXPECTED_FIXTURE_RELEASE_REF = "v3.1.0";
const EXPECTED_ROUTES = [
  "brief_world",
  "story",
  "character",
  "scene",
  "style",
  "reference_evidence",
  "action",
  "shot_direction",
  "storyboard_rhythm",
  "image_prompt",
  "production_plan",
  "review_repair",
];
const EXPECTED_PACKAGE_SCRIPTS = Object.freeze({
  "stage:check": "node scripts/check-stage-artifacts.mjs tests/evaluations/2026-10-16/stage-artifacts-v1.json",
  "test:bundle": "node --test tests/bundle-smoke.test.mjs",
  build: "node scripts/build-plugin-bundle.mjs",
  "contracts:index": "node scripts/generate-contract-index.mjs",
  "contracts:index:check": "node scripts/generate-contract-index.mjs --check",
  validate: "node scripts/validate-repository.mjs",
  "validate:bundle": "node scripts/validate-repository.mjs --bundle .build/cineweave-director",
  "validate:output": "node scripts/validate-output.mjs",
  "skills:sync": "node scripts/sync-skill-exports.mjs",
  "skills:sync:check": "node scripts/sync-skill-exports.mjs --check",
});
const EXPECTED_CHECKOUT_ACTION = "actions/checkout@11d5960a326750d5838078e36cf38b85af677262";
const EXPECTED_SETUP_NODE_ACTION = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020";
const EXPECTED_RELEASE_TAG_COMMAND = `node --input-type=module -e "import { readFileSync } from 'node:fs'; const version = JSON.parse(readFileSync('package.json', 'utf8')).version; const expected = 'v' + version; if (process.env.GITHUB_REF_NAME !== expected) throw new Error('Release tag ' + process.env.GITHUB_REF_NAME + ' must equal ' + expected);"`;
const EXPECTED_LIFECYCLE_AUTHORITY = Object.freeze({
  routeOwnership: "contracts.json#/routes",
  referenceDistribution: "reference-lifecycle.json#/references",
  contractInventory: "resources/contracts/index.json",
});
const EXPECTED_WORKFLOW_CONTEXTS = ["multi_route", "contract_output", "continuity"];
const EXPECTED_CONDITION_CONTEXTS = [
  "rights",
  "real_person",
  "semantic_morphology",
  "camera_previsualization",
  "portrait",
  "natural_human",
  "surface_response",
  "comic",
  "manga",
  "cinematic_pattern",
  "shot_compile",
  "master_style_preset",
  "directing_craft",
  "ensemble_review",
  "cinematography_craft",
  "editing_sound_craft",
  "craft_study",
  "editorial",
  "color",
  "midjourney",
  "video_sound_delivery",
  "draft_revision",
  "skill_evaluation",
];
const EXPECTED_SUPPORT_SCHEMAS = new Set([
  "schemas/common.schema.json",
  "schemas/reference-transform.schema.json",
]);
const DISTRIBUTION_BASE_FILES = [
  PLUGIN_PATH,
  LICENSE_PATH,
  `${SKILL_PREFIX}/SKILL.md`,
  `${SKILL_PREFIX}/agents/openai.yaml`,
  `${SKILL_PREFIX}/contracts.json`,
  `${SKILL_PREFIX}/reference-lifecycle.json`,
  `${SKILL_PREFIX}/resources/contracts/index.json`,
  `${SKILL_PREFIX}/scripts/check-delivery.mjs`,
  `${SKILL_PREFIX}/scripts/check-video-plan.mjs`,
  `${SKILL_PREFIX}/scripts/check-audio-returns.mjs`,
  `${SKILL_PREFIX}/scripts/check-shot-review.mjs`,
  `${SKILL_PREFIX}/scripts/check-change-impact.mjs`,
  `${SKILL_PREFIX}/scripts/parse-json.mjs`,
];
const SOURCE_TOP_LEVEL = new Set([
  ".agents",
  ".build",
  ".codex-plugin",
  ".editorconfig",
  ".git",
  ".gitattributes",
  ".github",
  ".gitignore",
  "assets",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "node_modules",
  "package.json",
  "README.md",
  "scripts",
  "SECURITY.md",
  "skills",
  "skill-sources",
  "skill-catalog.json",
  "tests",
]);
const EXPECTED_SOURCE_DIRECTORIES = new Map([
  [".agents", ["plugins/marketplace.json"]],
  [".codex-plugin", ["plugin.json"]],
  [".github", ["workflows/validate.yml"]],
  ["assets", ["cineweave-director-logo.png"]],
  ["scripts", [
    "check-stage-artifacts.mjs",
    "build-plugin-bundle.mjs",
    "canonical-json.mjs",
    "contract-context.mjs",
    "markdown-links.mjs",
    "generate-contract-index.mjs",
    "validate-output.mjs",
    "validate-prompt-projection.mjs",
    "validate-shot-compiler.mjs",
    "validate-repository.mjs",
    "skill-catalog.mjs",
    "sync-skill-exports.mjs",
  ]],
  ["tests", [
    "build-plugin-bundle.test.mjs",
    "bundle-smoke.test.mjs",
    "canonical-json.test.mjs",
    "contract-context.test.mjs",
    "check-delivery.test.mjs",
    "change-impact.test.mjs",
    "check-shot-review.test.mjs",
    "reliability.test.mjs",
    "projection-integrity.test.mjs",
    "shot-compiler-context.test.mjs",
    "video-return.test.mjs",
    "validate-output.test.mjs",
    "skill-catalog.test.mjs",
    "skill-bundles.test.mjs",
    "fixtures/ensemble-handoff.json",
    "evaluations/aigc-creation-research-2026-09-14.md",
    "evaluations/cinematic-cases.json",
    "evaluations/2026-10-16/ancient-full-flow.json",
    "evaluations/2026-10-16/everyday-full-flow.json",
    "evaluations/2026-10-16/scene-pipeline-audit-report.md",
    "evaluations/2026-10-16/stage-artifacts-v1.json",
    "evaluations/2026-10-16/artifacts/ancient/g0-director-beat-card.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-style-card.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-palette-card.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-material-card.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-lighting-card.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-light-plot.svg",
    "evaluations/2026-10-16/artifacts/ancient/g1-looktest-board.svg",
    "evaluations/2026-10-16/artifacts/ancient/g2-scene-map.svg",
    "evaluations/2026-10-16/artifacts/ancient/g3-blocking-board.svg",
    "evaluations/2026-10-16/artifacts/ancient/g4-storyboard-board.svg",
    "evaluations/2026-10-16/artifacts/ancient/g5-edit-timeline.svg",
    "evaluations/2026-10-16/artifacts/ancient/g6-test-plan.svg",
    "evaluations/2026-10-16/artifacts/ancient/g7-review-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g0-director-beat-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-style-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-palette-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-material-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-lighting-card.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-light-plot.svg",
    "evaluations/2026-10-16/artifacts/modern/g1-looktest-board.svg",
    "evaluations/2026-10-16/artifacts/modern/g2-scene-map.svg",
    "evaluations/2026-10-16/artifacts/modern/g3-blocking-board.svg",
    "evaluations/2026-10-16/artifacts/modern/g4-storyboard-board.svg",
    "evaluations/2026-10-16/artifacts/modern/g5-edit-timeline.svg",
    "evaluations/2026-10-16/artifacts/modern/g6-test-plan.svg",
    "evaluations/2026-10-16/artifacts/modern/g7-review-card.svg",
    "evaluations/project-review-2026-09-23.md",
    "evaluations/professional-craft-research-2026-10-10.md",
    "evaluations/director-methods-optimization-plan-2026-10-10.md",
    "evaluations/director-optimization-2026-10-11.md",
    "evaluations/higgsfield-skills-refactor-plan-2026-10-11.md",
    "evaluations/higgsfield-refactor-execution-2026-10-12.md",
    "evaluations/higgsfield-behavior-a-2026-10-12.md",
    "evaluations/higgsfield-behavior-b-2026-10-12.md",
    "evaluations/higgsfield-behavior-c-2026-10-12.md",
    "evaluations/higgsfield-behavior-review-2026-10-12.md",
    "evaluations/higgsfield-refactor-evidence-2026-10-12.json",
    "evaluations/higgsfield-isolation-rerun-2026-10-12.md",
    "evaluations/higgsfield-counterexamples-2026-10-11.mjs",
    "evaluations/higgsfield-counterexamples-2026-10-11.json",
    "evaluations/cineweave-simplification-2026-10-12.md",
    "evaluations/cineweave-simplification-evidence-2026-10-12.json",
    "evaluations/cineweave-simplification-forward-a-2026-10-12.md",
    "evaluations/cineweave-simplification-forward-b-2026-10-12.md",
    "evaluations/cineweave-simplification-review-2026-10-12.md",
    "evaluations/cineweave-simplification-behavior-review-2026-10-12.md",
    "evaluations/cineweave-skill-split-orchestration-plan-2026-10-12.md",
    "evaluations/cineweave-skill-split-evidence-2026-10-12.json",
    "evaluations/cineweave-split-dependency-audit-2026-10-12.md",
    "evaluations/cineweave-split-dependency-map-2026-10-12.json",
    "evaluations/cineweave-split-standards-research-2026-10-12.md",
    "evaluations/cineweave-split-higgsfield-research-2026-10-12.md",
    "evaluations/cineweave-split-plan-review-2026-10-12.md",
    "evaluations/cineweave-split-execution-2026-10-12.md",
    "evaluations/cineweave-split-execution-evidence-2026-10-12.json",
    "evaluations/cineweave-split-p0-baseline-manifest-2026-10-12.json",
    "evaluations/cineweave-split-case-inputs-2026-10-12.json",
    "evaluations/cineweave-split-case-rubric-2026-10-12.json",
    "evaluations/cineweave-split-case-rubric-v2-2026-10-12.json",
    "evaluations/cineweave-split-p0-review-2026-10-12.md",
    "evaluations/cineweave-split-p1-review-2026-10-12.md",
    "evaluations/p2-multiskill-b-2026-10-12/report.audit-first.md",
    "evaluations/p2-multiskill-b-2026-10-12/report.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T20.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T17.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T12.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T11.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T04.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-T03.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-C08.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-C06.v1.md",
    "evaluations/p2-multiskill-b-2026-10-12/CW-SPLIT-C04.v1.md",
    "evaluations/cineweave-split-p2-baseline-a-2026-10-12.md",
    "evaluations/cineweave-split-p2-stage-review-2026-10-12.md",
    "evaluations/cineweave-split-p3-multiskill-b-2026-10-12.md",
    "evaluations/cineweave-split-p3-baseline-a-2026-10-12.md",
    "evaluations/cineweave-split-p4-entry-pre-review-2026-10-12.md",
    "evaluations/cineweave-split-p6-engineering-evidence-2026-10-12.json",
    "evaluations/p6-engineering-2026-10-12/frozen-input-comparison.json",
    "evaluations/p6-engineering-2026-10-12/git-state.json",
    "evaluations/p6-engineering-2026-10-12/review-source-snapshot.json",
    "evaluations/cineweave-split-p6-review-2026-10-12.md.original.txt",
    "evaluations/p6-engineering-2026-10-12/contracts/after.json",
    "evaluations/p6-engineering-2026-10-12/contracts/before.json",
    "evaluations/p6-engineering-2026-10-12/contracts/comparison.json",
    "evaluations/p6-engineering-2026-10-12/harness/cache-cycle-before-fix.py.txt",
    "evaluations/p6-engineering-2026-10-12/harness/cache-cycle.py.txt",
    "evaluations/p6-engineering-2026-10-12/harness/standalone-discovery.py.txt",
    "evaluations/p6-engineering-2026-10-12/manifest.json",
    "evaluations/p6-engineering-2026-10-12/native/cache-cycle-final.json",
    "evaluations/p6-engineering-2026-10-12/native/cache-cycle-first-failure.json",
    "evaluations/p6-engineering-2026-10-12/native/cache-cycle-second-failure.json",
    "evaluations/p6-engineering-2026-10-12/native/standalone-four-skills.json",
    "evaluations/p6-engineering-2026-10-12/raw/build.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/bundle-smoke.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/cache-cycle-r2.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/cache-cycle-r3.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/cache-cycle.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/creator-validation.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/full-tests.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/index-check.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/index-regenerate.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/leaf-director.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/leaf-platform.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/leaf-reference.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/leaf-review.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/native-standalone.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/source.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/sync-check.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-director.first-failure.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-director.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-platform.first-failure.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-platform.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-reference.first-failure.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-reference.stdout.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-review.first-failure.txt",
    "evaluations/p6-engineering-2026-10-12/raw/validate-review.stdout.txt",
    "evaluations/cineweave-split-p6-review-2026-10-12.md",
    "evaluations/unified-workflow-review-artifact-audit-2026-10-12.json",
    "evaluations/unified-workflow-review-source-hashes-2026-10-12.json",
    "evaluations/cineweave-unified-workflow-review-2026-10-12.md",
    "evaluations/unified-workflow-forward-2026-10-12/run-metadata.json",
    "evaluations/unified-workflow-forward-2026-10-12/REV-P-revised-v2.txt",
    "evaluations/unified-workflow-forward-2026-10-12/REV-M-revised-v2.txt",
    "evaluations/unified-workflow-forward-2026-10-12/REV-G-revised-v2.txt",
    "evaluations/unified-workflow-forward-2026-10-12/report.md",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-visual-bible-and-continuity.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-video-timing-and-handles.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-video-sound-and-delivery.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-video-performance-direction.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-storyboard-rhythm.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-SKILL.md-SKILL.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-shot-direction.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-scene.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-references-operating-model.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-references-image-prompt.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-references-character.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-prompt-detail-standard.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-log.jsonl",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-image-prompt.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-drafts-and-change-impact.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-video-sound-and-delivery.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-storyboard-rhythm.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-SKILL.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-shot-direction.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-scene.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-review-repair.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-review-ensemble-direction-and-review.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-reference-reference-evidence.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-reference-reference-evidence-and-rights.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-platform-video-platform-adaptation.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-cineweave-platform-SKILL.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/source-action.md.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/REV-P-original-v1.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/REV-M-original-v1.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/REV-G-original-v1.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/prepare-c08.mjs",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/FG-01-original-v1.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C08-native.stdout.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C08-native.stderr.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C08-native.exit-code.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-shot-review-v1.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-shot-review-native.stdout.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-shot-review-native.stderr.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-shot-review-native.exit-code.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-delivery-v1.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-delivery-native.stdout.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-delivery-native.stderr.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/CW-SPLIT-C07-delivery-native.exit-code.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/build-report.mjs",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/build-report-native.stdout.json",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/build-report-native.stderr.txt",
    "evaluations/unified-workflow-forward-2026-10-12/evidence/build-report-native.exit-code.txt",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-T24-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-T23-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C08-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C07-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C06-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C05-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C04-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C03-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C02-v1.md",
    "evaluations/unified-workflow-forward-2026-10-12/CW-SPLIT-C01-v1.md",
    "evaluations/cineweave-split-p4-current-review-2026-10-12.md.original.txt",
    "evaluations/cineweave-split-p4-current-review-2026-10-12.md",
    "evaluations/p4-current-run3-2026-10-12/source-audit.json",
    "evaluations/p4-current-run3-2026-10-12/run-metadata.json",
    "evaluations/p4-current-run3-2026-10-12/report.md",
    "evaluations/p4-current-run3-2026-10-12/output-manifest.json",
    "evaluations/p4-current-run3-2026-10-12/CW-SPLIT-C08-v1.md",
    "evaluations/p4-current-run3-2026-10-12/CW-SPLIT-C06-v1.md",
    "evaluations/p4-current-run3-2026-10-12/CW-SPLIT-C03-v1.md",
    "evaluations/p4-current-run3-2026-10-12/CW-SPLIT-C02-v1.md",
    "evaluations/p4-current-run3-2026-10-12/CW-SPLIT-C01-v1.md",
    "evaluations/p4-current-run3-2026-10-12/C08-text-scope-check.stdout.json",
    "evaluations/p4-current-run3-2026-10-12/C03-delivery-worksheet.json",
    "evaluations/p4-current-run3-2026-10-12/C03-check-delivery.stdout.json",
    "evaluations/p4-current-run3-2026-10-12/C03-check-delivery.stderr.txt",
    "evaluations/p4-current-run3-2026-10-12/C03-check-delivery.execution.json",
    "evaluations/p4-current-run1-2026-10-12/tool-results/node-version.stdout.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/node-version.exit.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C08-scope-check.json",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C08-delivery.stdout.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C08-delivery.exit.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C08-delivery-worksheet.json",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C03-delivery.stdout.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C03-delivery.exit.txt",
    "evaluations/p4-current-run1-2026-10-12/tool-results/C03-delivery-worksheet.json",
    "evaluations/p4-current-run1-2026-10-12/source-manifest.json",
    "evaluations/p4-current-run1-2026-10-12/report.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C08.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C08-source-note-correction.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C06.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C03.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C02.md",
    "evaluations/p4-current-run1-2026-10-12/CW-SPLIT-C01.md",
    "evaluations/p4-current-run2-2026-10-12/tool-executions.json",
    "evaluations/p4-current-run2-2026-10-12/source-read-manifest.json",
    "evaluations/p4-current-run2-2026-10-12/run-metadata.json",
    "evaluations/p4-current-run2-2026-10-12/report.md",
    "evaluations/p4-current-run2-2026-10-12/report.json",
    "evaluations/p4-current-run2-2026-10-12/report-builder-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-scope-preservation.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-impact-workbook.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-impact-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-first-v1.md",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-delivery-workbook.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C08-delivery-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C06-first-v1.md",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C06-delivery-workbook.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C06-delivery-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C03-first-v1.md",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C03-delivery-workbook.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C03-delivery-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C02-first-v1.md",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C02-delivery-workbook.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C02-delivery-result.native.json",
    "evaluations/p4-current-run2-2026-10-12/CW-SPLIT-C01-first-v1.md",
    "evaluations/p4-current-run2-2026-10-12/build-report.mjs",
    "evaluations/p4-current-run2-2026-10-12/artifact-manifest.json",
    "evaluations/cineweave-split-p4-content-review-58-2026-10-12.md.original.txt",
    "evaluations/cineweave-split-p4-content-review-14-2026-10-12.md.original.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/verification-summary.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B3-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B3-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B3-C07-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C08-impact-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C08-impact-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C08-impact-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B2-C07-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B1-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B1-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/B1-C07-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A3-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A3-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A3-C07-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A2-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A2-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A2-C07-input.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A1-C07-stdout.json",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A1-C07-stderr.txt",
    "evaluations/p4-content-review-58-evidence-2026-10-12/A1-C07-input.json",
    "evaluations/cineweave-split-p4-content-review-58-2026-10-12.md",
    "evaluations/cineweave-split-p4-content-review-14-2026-10-12.md",
    "evaluations/cineweave-split-p4-stage-trigger-review-2026-10-12.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/report.md.original.txt.before-integrity.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/report.md.before-integrity.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/run-metadata.json",
    "evaluations/p4-multiskill-b3-2026-10-12/report.md.original.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/report.md",
    "evaluations/p4-multiskill-b3-2026-10-12/report-integrity-stdout.json",
    "evaluations/p4-multiskill-b3-2026-10-12/report-integrity-exit.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-scope-stdout.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-scope-exit.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-scope-check.mjs",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-revision-input.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-revised-documents.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-native-stdout.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-native-stderr.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-native-exit.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-native-check.mjs",
    "evaluations/p4-multiskill-b3-2026-10-12/C08-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-source.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-review-stdout.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-review-stderr.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-review-input.json",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-review-exit.txt",
    "evaluations/p4-multiskill-b3-2026-10-12/C07-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C06-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C05-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C04-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C03-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C02-first.md",
    "evaluations/p4-multiskill-b3-2026-10-12/C01-first.md",
    "evaluations/p4-multiskill-b2-2026-10-12/SHA256SUMS.json",
    "evaluations/p4-multiskill-b2-2026-10-12/report.md.original.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/report.md",
    "evaluations/p4-multiskill-b2-2026-10-12/node-version.stdout.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/node-version.exit.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-P-v2.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-P-v2-standalone.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-P-v1.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-M-v2.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-M-v1.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-G-v2.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-REV-G-v1.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-impact-workbook.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-exact-diff.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-check.stdout.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-check.stderr.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C08-check.exit.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07.md.original.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07-source-v1.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07-review-workbook.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07-check.stdout.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07-check.stderr.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C07-check.exit.txt",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C06.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C06.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C05.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C05.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C04.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C04.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C03.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C03.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C02.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C02.json",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C01.md",
    "evaluations/p4-multiskill-b2-2026-10-12/CW-SPLIT-C01.json",
    "evaluations/p4-multiskill-b2-2026-10-12/batch-record.json",
    "evaluations/p4-multiskill-b2-2026-10-12/artifact-verification.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/tool-results.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/run-index.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/report.md.original.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/report.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/read-sources.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/node-version.stdout.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/node-version.stderr.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/node-version.exit-code.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/materialize-first-edition.py",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T24.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T24.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T23.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T23.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T22.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T22.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T21.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T21.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T19.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T19.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T16.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T16.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T15.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T15.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T10.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T10.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T09.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T09.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T08.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T08.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T07.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T07.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T02.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T02.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T01.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-T01.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07-shot-review.stdout.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07-shot-review.stderr.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07-shot-review.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C07-shot-review.exit-code.txt",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C03.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C03.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C02.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C02.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C01.source.json",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/CW-SPLIT-C01.first-response.md",
    "evaluations/p4-baseline-a1-remaining-2026-10-12/artifact-integrity-check.json",
    "evaluations/p4-multiskill-b1-2026-10-12/report.md.original.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-v1.md.original.txt",
    "evaluations/p4-baseline-a2-2026-10-12/report.md.original.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/tool-results.json",
    "evaluations/p4-multiskill-b1-2026-10-12/source-reads.json",
    "evaluations/p4-multiskill-b1-2026-10-12/report.md",
    "evaluations/p4-multiskill-b1-2026-10-12/node-version.stdout.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/node-version.stderr.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/metadata.json",
    "evaluations/p4-multiskill-b1-2026-10-12/io.py",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T24-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T23-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T22-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T21-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T20-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T19-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T18-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T17-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T16-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T15-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T14-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T13-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T12-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T11-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T10-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T09-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T08-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T07-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T06-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T05-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T04-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T03-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T02-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-T01-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-source-REV-P-v1.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-source-REV-M-v1.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-source-REV-G-v1.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-REV-P-v2.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-REV-M-v2.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C08-REV-G-v2.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-source-FG-01-v1.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-shot-review-v1.stdout.json",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-shot-review-v1.stderr.txt",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C07-shot-review-v1.json",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C06-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C05-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C04-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C03-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C02-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/CW-SPLIT-C01-v1.md",
    "evaluations/p4-multiskill-b1-2026-10-12/cases.json",
    "evaluations/p4-multiskill-b1-2026-10-12/__pycache__/io.cpython-313.pyc",
    "evaluations/p4-baseline-a3-2026-10-12/sources.json",
    "evaluations/p4-baseline-a3-2026-10-12/save-and-check-c07.mjs",
    "evaluations/p4-baseline-a3-2026-10-12/run-metadata.json",
    "evaluations/p4-baseline-a3-2026-10-12/report.md",
    "evaluations/p4-baseline-a3-2026-10-12/C08.md",
    "evaluations/p4-baseline-a3-2026-10-12/C08-REV-P-r2.txt",
    "evaluations/p4-baseline-a3-2026-10-12/C08-REV-M-r2.txt",
    "evaluations/p4-baseline-a3-2026-10-12/C08-REV-G-r2.txt",
    "evaluations/p4-baseline-a3-2026-10-12/C08-change-check.json",
    "evaluations/p4-baseline-a3-2026-10-12/C07.md",
    "evaluations/p4-baseline-a3-2026-10-12/C07-source-FG-01-r1.txt",
    "evaluations/p4-baseline-a3-2026-10-12/C07-review.json",
    "evaluations/p4-baseline-a3-2026-10-12/C07-check.stdout.json",
    "evaluations/p4-baseline-a3-2026-10-12/C07-check.stderr.txt",
    "evaluations/p4-baseline-a3-2026-10-12/C07-check.execution.json",
    "evaluations/p4-baseline-a3-2026-10-12/C06.md",
    "evaluations/p4-baseline-a3-2026-10-12/C05.md",
    "evaluations/p4-baseline-a3-2026-10-12/C04.md",
    "evaluations/p4-baseline-a3-2026-10-12/C03.md",
    "evaluations/p4-baseline-a3-2026-10-12/C02.md",
    "evaluations/p4-baseline-a3-2026-10-12/C01.md",
    "evaluations/p4-baseline-a3-2026-10-12/build-c08-and-report.mjs",
    "evaluations/p4-baseline-a3-2026-10-12/assemble-report.mjs",
    "evaluations/p4-baseline-a3-2026-10-12/artifact-manifest.json",
    "evaluations/p4-baseline-a2-2026-10-12/report.md",
    "evaluations/p4-baseline-a2-2026-10-12/manifest.json",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C08.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C07.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C06.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C05.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C04.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C03.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C02.md",
    "evaluations/p4-baseline-a2-2026-10-12/CW-SPLIT-C01.md",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-P-v2.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-P-v1-source.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-M-v2.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-M-v1-source.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-G-v2.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-REV-G-v1-source.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C08-local-replacement-check.json",
    "evaluations/p4-baseline-a2-2026-10-12/C07-source-FG-01-v1.txt",
    "evaluations/p4-baseline-a2-2026-10-12/C07-shot-review.json",
    "evaluations/p4-baseline-a2-2026-10-12/C07-check-shot-review.native.json",
    "evaluations/p4-baseline-a2-2026-10-12/C07-check-shot-review.exit-code.txt",
    "evaluations/p4-baseline-a2-2026-10-12/artifact-hashes.json",
    "evaluations/cineweave-split-p3-review-2026-10-12.md",
    "evaluations/cineweave-split-p2-behavior-review-2026-10-12.md",
    "evaluations/2026-10-11/director-run-a.md",
    "evaluations/2026-10-11/director-run-b.md",
    "evaluations/2026-10-11/director-run-c.md",
    "evaluations/2026-10-11/director-targeted-rerun.md",
    "evaluations/2026-10-11/director-review.md",
    "evaluations/2026-10-11/evidence.json",
    "evaluations/2026-10-10/forward-control.md",
    "evaluations/2026-10-10/forward-production.md",
    "evaluations/2026-10-10/independent-review.md",
    "evaluations/2026-10-10/evidence.json",
    "evaluations/2026-09-23/short-film-v1.md",
    "evaluations/2026-09-23/short-film-v2.md",
    "evaluations/2026-09-23/short-film-change-review.md",
    "evaluations/2026-09-23/revision.md",
    "evaluations/2026-09-23/spatial.md",
    "evaluations/2026-09-23/evidence.json",
  ]],
]);
const EXPECTED_REPOSITORY = "https://github.com/Wilder1222/cineweave-director";
const TEXT_EXTENSIONS = new Set([".json", ".md", ".yaml", ".yml", ".mjs"]);
const FORBIDDEN_DISTRIBUTION_PATTERNS = [
  [/packages\/cineweave-runtime/iu, "legacy runtime package reference"],
  [/packages\/cineweave-world-os/iu, "legacy World OS package reference"],
  [/\bcineweave-studio\b/iu, "retired multi-Skill product identity"],
  [/\bbin\/cineweave(?:\.mjs)?\b/iu, "retired CLI entry point"],
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function toPosix(value) {
  return value.split(sep).join("/");
}

function isWithin(root, candidate) {
  const rel = relative(root, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function normalizeManifestPath(value, label) {
  assert(typeof value === "string" && value.length > 0, `${label} must be a non-empty string`);
  assert(!value.includes("\\"), `${label} must use forward slashes: ${value}`);
  assert(!value.includes("\0"), `${label} contains a NUL byte`);
  assert(!isAbsolute(value) && !/^[A-Za-z]:/u.test(value), `${label} must be relative: ${value}`);
  const normalized = posix.normalize(value);
  assert(normalized === value && normalized !== "." && !normalized.startsWith("../"), `${label} is not normalized or escapes its root: ${value}`);
  return value;
}

function sortedUnique(values, label) {
  const result = [...values].sort((left, right) => left.localeCompare(right, "en"));
  assert(new Set(result).size === result.length, `${label} contains duplicate paths`);
  const caseFolded = new Map();
  for (const value of result) {
    const key = value.toLocaleLowerCase("en-US");
    const prior = caseFolded.get(key);
    assert(!prior || prior === value, `${label} contains a case-colliding path: ${prior} / ${value}`);
    caseFolded.set(key, value);
  }
  return result;
}

function compareFileSets(actualValues, expectedValues, label) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = [...expected].filter((value) => !actual.has(value)).sort();
  const extra = [...actual].filter((value) => !expected.has(value)).sort();
  assert(missing.length === 0 && extra.length === 0, `${label} mismatch${missing.length ? `; missing: ${missing.join(", ")}` : ""}${extra.length ? `; extra: ${extra.join(", ")}` : ""}`);
}

async function readStrictJson(root, relativePath) {
  normalizeManifestPath(relativePath, "JSON path");
  await assertRegularPath(root, relativePath);
  const path = resolve(root, ...relativePath.split("/"));
  assert(isWithin(root, path), `JSON path escapes root: ${relativePath}`);
  return parseJsonStrict(await readFile(path, "utf8"));
}

async function walkRegularFiles(root, relativeDirectory = "") {
  const directory = resolve(root, ...relativeDirectory.split("/").filter(Boolean));
  assert(isWithin(root, directory), `Directory escapes root: ${relativeDirectory}`);
  const directoryStat = await lstat(directory);
  assert(directoryStat.isDirectory() && !directoryStat.isSymbolicLink(), `Expected a real directory: ${relativeDirectory || "."}`);
  assert(isWithin(await realpath(root), await realpath(directory)), `Resolved directory escapes root: ${relativeDirectory || "."}`);
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
  for (const entry of entries) {
    const childRelative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
    const childPath = resolve(root, ...childRelative.split("/"));
    const stat = await lstat(childPath);
    assert(!stat.isSymbolicLink(), `Symbolic links and junctions are not allowed: ${childRelative}`);
    if (stat.isDirectory()) files.push(...await walkRegularFiles(root, childRelative));
    else {
      assert(stat.isFile(), `Only regular files are allowed: ${childRelative}`);
      files.push(childRelative);
    }
  }
  return files;
}

async function assertRegularPath(root, relativePath) {
  normalizeManifestPath(relativePath, "Regular file path");
  const rootStat = await lstat(root);
  assert(rootStat.isDirectory() && !rootStat.isSymbolicLink(), "Root must be a real directory");
  let current = root;
  const segments = relativePath.split("/");
  for (let index = 0; index < segments.length; index += 1) {
    current = join(current, segments[index]);
    const stat = await lstat(current);
    assert(!stat.isSymbolicLink(), `Symbolic links and junctions are not allowed: ${relativePath}`);
    if (index < segments.length - 1) assert(stat.isDirectory(), `Expected directory segment in ${relativePath}: ${segments[index]}`);
    else assert(stat.isFile(), `Expected regular file: ${relativePath}`);
  }
  const realRoot = await realpath(root);
  const realFile = await realpath(current);
  assert(isWithin(realRoot, realFile), `Resolved file escapes distribution root: ${relativePath}`);
}

function flattenRouteKinds(routes) {
  const kinds = [];
  const ownership = new Map();
  for (const [routeId, route] of Object.entries(routes)) {
    assert(Array.isArray(route.produces) && route.produces.length > 0, `Route ${routeId} must produce at least one root kind`);
    for (const kind of route.produces) {
      assert(typeof kind === "string" && kind.length > 0, `Route ${routeId} contains an invalid kind`);
      assert(!ownership.has(kind), `Root kind is owned by multiple routes: ${kind}`);
      ownership.set(kind, routeId);
      kinds.push(kind);
    }
  }
  return { kinds, ownership };
}

async function createCanonicalInventory(root = repositoryRoot) {
  const absoluteRoot = resolve(root);
  const plugin = await readStrictJson(absoluteRoot, PLUGIN_PATH);
  const contracts = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/contracts.json`);
  const lifecycle = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/reference-lifecycle.json`);
  const index = await readStrictJson(absoluteRoot, `${SKILL_PREFIX}/resources/contracts/index.json`);

  assert(Array.isArray(lifecycle.references), "reference-lifecycle.json must contain references[]");
  assert(Array.isArray(index.contracts), "contract index must contain contracts[]");
  assert(Array.isArray(index.supportSchemas), "contract index must contain supportSchemas[]");

  const files = [...DISTRIBUTION_BASE_FILES];
  for (const [position, entry] of lifecycle.references.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Lifecycle entry ${position} must be an object`);
    const referencePath = normalizeManifestPath(entry.path, `Lifecycle entry ${position}`);
    assert(referencePath.startsWith("references/") && extname(referencePath) === ".md", `Lifecycle entry must name a Markdown file under references/: ${referencePath}`);
    files.push(`${SKILL_PREFIX}/${referencePath}`);
  }

  for (const [position, entry] of index.contracts.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Contract index entry ${position} must be an object`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.schema, `Contract schema ${position}`)}`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.example, `Contract example ${position}`)}`);
  }
  for (const [position, entry] of index.supportSchemas.entries()) {
    assert(entry && typeof entry === "object" && !Array.isArray(entry), `Support schema entry ${position} must be an object`);
    files.push(`${SKILL_PREFIX}/resources/contracts/${normalizeManifestPath(entry.schema, `Support schema ${position}`)}`);
  }

  return {
    root: absoluteRoot,
    files: sortedUnique(files.map((value) => normalizeManifestPath(value, "Distribution path")), "Distribution inventory"),
    plugin,
    contracts,
    lifecycle,
    index,
  };
}

export async function createDistributionInventory(root = repositoryRoot, { target = { type: "plugin" } } = {}) {
  const canonical = await createCanonicalInventory(root);
  await assertRegularPath(canonical.root, "skill-catalog.json");
  const catalog = await loadSkillCatalog(canonical.root);
  const catalogModel = validateSkillCatalog(catalog, canonical);
  const plan = await createSkillExportPlan(canonical.root, catalogModel, canonical, target);
  // Keep the canonical authority fields for existing consumers. Files always
  // describe destinations; sources may intentionally occur more than once.
  const exports = plan.exports.map(({ source, destination }) => ({
    source: normalizeManifestPath(source, "Export source"),
    destination: normalizeManifestPath(destination, "Export destination"),
  }));
  const files = sortedUnique(exports.map((entry) => entry.destination), "Export destinations");
  compareFileSets(plan.files, files, "Export plan file set");
  const sourceFiles = sortedUnique([...new Set(exports.map((entry) => entry.source))], "Export sources");
  return { ...canonical, ...plan, exports, files, sourceFiles, catalog, catalogModel, canonical };
}

function pointerGet(document, pointer, label) {
  if (!pointer) return document;
  assert(pointer.startsWith("/"), `Unsupported JSON pointer in ${label}: #${pointer}`);
  let current = document;
  for (const rawToken of pointer.slice(1).split("/")) {
    const token = decodeURIComponent(rawToken).replace(/~1/gu, "/").replace(/~0/gu, "~");
    assert(current !== null && typeof current === "object" && Object.hasOwn(current, token), `Unresolved JSON pointer in ${label}: #${pointer}`);
    current = current[token];
  }
  return current;
}

function collectRefs(value, refs = []) {
  if (Array.isArray(value)) {
    for (const child of value) collectRefs(child, refs);
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref") refs.push(child);
      else collectRefs(child, refs);
    }
  }
  return refs;
}

async function validateSchemaRefClosure(root, inventory, schemaDocuments) {
  const resourceRoot = resolve(root, "resources", "contracts");
  const schemaRoot = resolve(resourceRoot, "schemas");
  const allowedFiles = new Set([
    ...inventory.index.contracts.map((entry) => entry.schema),
    ...inventory.index.supportSchemas.map((entry) => entry.schema),
  ]);
  let refCount = 0;

  for (const [schemaRelative, document] of schemaDocuments) {
    const currentPath = resolve(resourceRoot, ...schemaRelative.split("/"));
    assert(isWithin(schemaRoot, currentPath), `Indexed schema escapes the schema directory: ${schemaRelative}`);
    for (const refValue of collectRefs(document)) {
      refCount += 1;
      assert(typeof refValue === "string" && refValue.length > 0, `${schemaRelative} contains an invalid $ref`);
      if (refValue.startsWith("#")) {
        pointerGet(document, refValue.slice(1), schemaRelative);
        continue;
      }
      assert(!/^[A-Za-z][A-Za-z0-9+.-]*:/u.test(refValue) && !refValue.startsWith("//"), `${schemaRelative} contains a remote or absolute $ref: ${refValue}`);
      assert(!refValue.includes("\\") && !refValue.includes("?") && !refValue.includes("\0"), `${schemaRelative} contains a non-local $ref: ${refValue}`);
      const [filePart, fragment = ""] = refValue.split("#", 2);
      assert(filePart.length > 0 && posix.normalize(filePart) === filePart && filePart !== "." && !filePart.startsWith("../"), `${schemaRelative} contains a non-normalized $ref: ${refValue}`);
      const targetPath = resolve(dirname(currentPath), filePart);
      assert(isWithin(schemaRoot, targetPath), `${schemaRelative} $ref escapes the schema directory: ${refValue}`);
      const targetRelative = toPosix(relative(resourceRoot, targetPath));
      assert(allowedFiles.has(targetRelative), `${schemaRelative} references an unindexed schema: ${refValue}`);
      const targetDocument = schemaDocuments.get(targetRelative);
      assert(targetDocument, `${schemaRelative} references a missing schema: ${refValue}`);
      if (fragment) pointerGet(targetDocument, fragment, `${schemaRelative} -> ${refValue}`);
    }
  }
  return refCount;
}

function visitSkillReceipts(value, callback, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((child, index) => visitSkillReceipts(child, callback, `${path}[${index}]`));
  } else if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (key === "skillReceipt") callback(child, childPath);
      visitSkillReceipts(child, callback, childPath);
    }
  }
}

async function validateContracts(root, inventory) {
  const { contracts, lifecycle, index } = inventory;
  assert(contracts.schemaVersion === EXPECTED_VERSION && contracts.version === EXPECTED_VERSION, `contracts.json must use Skill version ${EXPECTED_VERSION}`);
  assert(contracts.skill === SKILL_NAME && index.skill === SKILL_NAME && lifecycle.skill === SKILL_NAME, "Skill identity is inconsistent across manifests");
  assert(index.schemaVersion === EXPECTED_VERSION && index.skillVersion === EXPECTED_VERSION, `Contract index must use Skill version ${EXPECTED_VERSION}`);
  assert(lifecycle.catalogVersion === EXPECTED_VERSION, `Reference lifecycle must use catalogVersion ${EXPECTED_VERSION}`);

  const routeIds = Object.keys(contracts.routes ?? {});
  assert(JSON.stringify(routeIds) === JSON.stringify(EXPECTED_ROUTES), `Route inventory must be exactly: ${EXPECTED_ROUTES.join(", ")}`);
  const { kinds: routeKinds, ownership } = flattenRouteKinds(contracts.routes);
  assert(Array.isArray(contracts.contractKinds), "contracts.json must contain contractKinds[]");
  compareFileSets(routeKinds, contracts.contractKinds, "Route-produced root inventory");
  assert(new Set(contracts.contractKinds).size === contracts.contractKinds.length, "contractKinds[] contains duplicates");

  assert(canonicalize(lifecycle.authority) === canonicalize(EXPECTED_LIFECYCLE_AUTHORITY), "reference-lifecycle.json authority map is invalid");
  assert(lifecycle.contextCatalog && typeof lifecycle.contextCatalog === "object" && !Array.isArray(lifecycle.contextCatalog), "reference-lifecycle.json must contain contextCatalog");
  compareFileSets(lifecycle.contextCatalog.route ?? [], EXPECTED_ROUTES, "Lifecycle route contexts");
  compareFileSets(lifecycle.contextCatalog.workflow ?? [], EXPECTED_WORKFLOW_CONTEXTS, "Lifecycle workflow contexts");
  compareFileSets(lifecycle.contextCatalog.condition ?? [], EXPECTED_CONDITION_CONTEXTS, "Lifecycle condition contexts");
  const allLoadContexts = [
    ...(lifecycle.contextCatalog.route ?? []),
    ...(lifecycle.contextCatalog.workflow ?? []),
    ...(lifecycle.contextCatalog.condition ?? []),
  ];
  assert(new Set(allLoadContexts).size === allLoadContexts.length, "Lifecycle context categories overlap");
  const knownLoadContexts = new Set(allLoadContexts);

  const lifecyclePaths = lifecycle.references.map((entry) => entry.path);
  assert(new Set(lifecyclePaths).size === lifecyclePaths.length, "reference-lifecycle.json contains duplicate paths");
  const lifecycleByPath = new Map(lifecycle.references.map((entry) => [entry.path, entry]));
  for (const [position, entry] of lifecycle.references.entries()) {
    assert(typeof entry.path === "string", `Lifecycle entry ${position} must declare a path`);
    const expectedLifecycle = entry.path.startsWith("references/core/")
      ? "core"
      : entry.path.startsWith("references/routes/")
        ? "routed"
        : entry.path.startsWith("references/optional/")
          ? "optional"
          : null;
    assert(expectedLifecycle !== null && entry.lifecycle === expectedLifecycle, `Lifecycle entry ${entry.path} must be classified as ${expectedLifecycle}`);
    assert(Array.isArray(entry.loadContexts) && entry.loadContexts.length > 0, `Lifecycle entry ${position} must declare loadContexts`);
    assert(new Set(entry.loadContexts).size === entry.loadContexts.length, `Lifecycle entry ${position} contains duplicate loadContexts`);
    for (const context of entry.loadContexts) assert(knownLoadContexts.has(context), `Lifecycle entry ${position} uses undeclared load context ${context}`);
    if (entry.lifecycle === "routed") {
      const owners = Object.entries(contracts.routes).filter(([, route]) => route.references?.includes(entry.path)).map(([routeId]) => routeId);
      assert(owners.length === 1, `Routed reference must have exactly one route owner: ${entry.path}`);
      assert(entry.loadContexts.length === 1 && entry.loadContexts[0] === owners[0], `Routed reference load context must equal its route owner: ${entry.path}`);
    }
  }
  for (const [routeId, route] of Object.entries(contracts.routes)) {
    assert(Array.isArray(route.references) && route.references.length > 0, `Route ${routeId} must list at least one reference`);
    for (const referencePath of route.references) {
      const lifecycleEntry = lifecycleByPath.get(referencePath);
      assert(lifecycleEntry, `Route ${routeId} references knowledge outside lifecycle: ${referencePath}`);
      assert(lifecycleEntry.lifecycle !== "optional", `Route ${routeId} cannot make optional knowledge a baseline: ${referencePath}`);
      assert(lifecycleEntry.loadContexts.includes(routeId), `Route ${routeId} reference must declare its route load context: ${referencePath}`);
    }
  }

  assert(index.contracts.length === contracts.contractKinds.length, "Contract index root count does not match contracts.json");
  assert(JSON.stringify(index.contracts.map((entry) => entry.kind)) === JSON.stringify(contracts.contractKinds), "Contract index kind order does not match contracts.json");
  assert(new Set(index.contracts.map((entry) => entry.schema)).size === index.contracts.length, "Contract index reuses a root schema");
  assert(new Set(index.contracts.map((entry) => entry.example)).size === index.contracts.length, "Contract index reuses a canonical example");
  compareFileSets(index.supportSchemas.map((entry) => entry.schema), EXPECTED_SUPPORT_SCHEMAS, "Support schema inventory");

  const excluded = new Set(contracts.excludedPlatformKinds ?? []);
  for (const kind of contracts.contractKinds) assert(!excluded.has(kind), `Excluded platform kind is registered as a root: ${kind}`);

  const schemaDocuments = new Map();
  const failures = [];
  let receiptCount = 0;
  for (const entry of index.contracts) {
    assert(entry.role === "root", `Contract index entry must have role=root: ${entry.kind}`);
    assert(ownership.get(entry.kind) === entry.domain, `Contract domain mismatch for ${entry.kind}`);
    const schemaRelative = `resources/contracts/${entry.schema}`;
    const exampleRelative = `resources/contracts/${entry.example}`;
    const schemaBytes = await readFile(resolve(root, ...schemaRelative.split("/")));
    const exampleBytes = await readFile(resolve(root, ...exampleRelative.split("/")));
    assert(sha256Bytes(schemaBytes) === entry.schemaSha256, `Schema hash mismatch: ${entry.schema}`);
    assert(sha256Bytes(exampleBytes) === entry.exampleSha256, `Example hash mismatch: ${entry.example}`);
    const schema = parseJsonStrict(schemaBytes.toString("utf8"));
    const example = parseJsonStrict(exampleBytes.toString("utf8"));
    schemaDocuments.set(entry.schema, schema);
    assert(schema?.properties?.kind?.const === entry.kind, `Root schema kind mismatch: ${entry.schema}`);
    assert(example?.kind === entry.kind, `Canonical example kind mismatch: ${entry.example}`);
    visitSkillReceipts(example, (receipt, receiptPath) => {
      receiptCount += 1;
      assert(receipt && typeof receipt === "object" && !Array.isArray(receipt), `${entry.example} ${receiptPath} must be an object`);
      assert(receipt.repository === EXPECTED_REPOSITORY, `${entry.example} ${receiptPath}.repository must use the release repository`);
      assert(receipt.ref === EXPECTED_FIXTURE_RELEASE_REF, `${entry.example} ${receiptPath}.ref must preserve the frozen fixture release ${EXPECTED_FIXTURE_RELEASE_REF}`);
    });
    const result = await validateDocument(resolve(root, ...schemaRelative.split("/")), resolve(root, ...exampleRelative.split("/")), { contracts });
    if (!result.valid) failures.push({ kind: entry.kind, errors: result.errors });
  }

  for (const entry of index.supportSchemas) {
    const relativePath = `resources/contracts/${entry.schema}`;
    const bytes = await readFile(resolve(root, ...relativePath.split("/")));
    assert(sha256Bytes(bytes) === entry.schemaSha256, `Support schema hash mismatch: ${entry.schema}`);
    schemaDocuments.set(entry.schema, parseJsonStrict(bytes.toString("utf8")));
  }
  assert(failures.length === 0, `Canonical example validation failed:\n${JSON.stringify(failures, null, 2)}`);
  const schemaRefs = await validateSchemaRefClosure(root, inventory, schemaDocuments);
  return { roots: index.contracts.length, schemas: schemaDocuments.size, examples: index.contracts.length, receipts: receiptCount, schemaRefs };
}

async function validateTree(root, expectedFiles, label) {
  const files = sortedUnique(expectedFiles.map((path) => normalizeManifestPath(path, label)), label);
  const directories = new Set([""]);
  for (const path of files) {
    let directory = posix.dirname(path);
    while (directory !== ".") {
      directories.add(directory);
      directory = posix.dirname(directory);
    }
  }
  const actualDirectories = [];
  const visit = async (directory = "") => {
    const path = resolve(root, ...directory.split("/").filter(Boolean));
    const stat = await lstat(path);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), `Expected a real directory: ${label}/${directory || "."}`);
    assert(isWithin(await realpath(root), await realpath(path)), `Resolved directory escapes root: ${label}/${directory}`);
    actualDirectories.push(directory);
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = directory ? `${directory}/${entry.name}` : entry.name;
      const childStat = await lstat(resolve(root, ...child.split("/")));
      assert(!childStat.isSymbolicLink(), `Symbolic links and junctions are not allowed: ${label}/${child}`);
      if (childStat.isDirectory()) {
        assert(directories.has(child), `Unexpected directory in ${label}: ${child}`);
        await visit(child);
      } else assert(childStat.isFile(), `Only regular files are allowed: ${label}/${child}`);
    }
  };
  await visit();
  compareFileSets(await walkRegularFiles(root), files, label);
  compareFileSets(actualDirectories, directories, `${label} directories`);
  for (const path of files) await assertRegularPath(root, path);
}

function packageInventory(inventory, descriptor) {
  const prefix = descriptor.destinationRoot && descriptor.destinationRoot !== "." ? `${descriptor.destinationRoot}/` : "";
  const files = descriptor.files.map((path) => {
    assert(path.startsWith(prefix), `Skill file is outside its declared root: ${path}`);
    return normalizeManifestPath(path.slice(prefix.length), "Skill file");
  });
  return { ...descriptor, files: sortedUnique(files, `${descriptor.name} file set`), contracts: inventory.contracts, lifecycle: inventory.lifecycle, index: inventory.index };
}

async function validateDevelopmentMarkdown(root) {
  const files = ["README.md", "CHANGELOG.md", "CONTRIBUTING.md", "SECURITY.md",
    ...(await walkRegularFiles(root, "tests")).filter((value) => extname(value) === ".md")];
  return validateMarkdownFiles(root, sortedUnique(files, "Development Markdown paths"));
}

async function validateTextBoundaries(root, inventory) {
  let textFiles = 0;
  for (const relativePath of inventory.files) {
    if (!TEXT_EXTENSIONS.has(extname(relativePath))) continue;
    textFiles += 1;
    const bytes = await readFile(resolve(root, ...relativePath.split("/")));
    assert(!(bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf), `UTF-8 BOM is not allowed: ${relativePath}`);
    const text = bytes.toString("utf8");
    assert(!text.includes("\u0000"), `NUL byte is not allowed: ${relativePath}`);
    assert(!text.includes("\ufffd"), `Replacement character indicates invalid encoding: ${relativePath}`);
    assert(!text.includes("\r"), `Distribution text must use LF line endings: ${relativePath}`);
    for (const [pattern, label] of FORBIDDEN_DISTRIBUTION_PATTERNS) {
      assert(!pattern.test(text), `${relativePath} contains ${label}`);
    }
  }
  return { textFiles };
}

function validatePluginAndPackage(plugin, contracts, packageJson = null) {
  assert(plugin.name === SKILL_NAME && plugin.version === EXPECTED_VERSION, "Plugin identity/version mismatch");
  assert(plugin.skills === "./skills/", "Plugin must expose only ./skills/");
  assert(plugin.repository === EXPECTED_REPOSITORY && plugin.homepage === EXPECTED_REPOSITORY, "Plugin repository metadata mismatch");
  assert(plugin.license === "MIT", "Plugin license must be MIT");
  for (const forbidden of ["bin", "commands", "dependencies", "mcpServers", "runtime"]) {
    assert(!Object.hasOwn(plugin, forbidden), `Plugin manifest must not contain ${forbidden}`);
  }
  assert(contracts.version === plugin.version, "Plugin and Skill manifest versions must match");

  if (packageJson) {
    assert(packageJson.name === SKILL_NAME && packageJson.version === EXPECTED_VERSION, "package.json identity/version mismatch");
    assert(packageJson.private === true && packageJson.type === "module", "package.json must be a private ESM development harness");
    assert(packageJson.engines?.node === ">=22", "package.json must require Node.js >=22");
    assert(packageJson.license === "MIT", "package.json license must be MIT");
    for (const forbidden of ["bin", "main", "exports", "workspaces", "dependencies", "devDependencies", "optionalDependencies", "peerDependencies", "bundledDependencies"]) {
      assert(!Object.hasOwn(packageJson, forbidden), `package.json must not contain ${forbidden}`);
    }
    assert(packageJson.scripts && typeof packageJson.scripts === "object" && !Array.isArray(packageJson.scripts), "package.json must contain scripts");
    compareFileSets(Object.keys(packageJson.scripts), ["test", ...Object.keys(EXPECTED_PACKAGE_SCRIPTS)], "package.json script inventory");
    const testCommand = packageJson.scripts.test;
    assert(typeof testCommand === "string" && /^node --test(?: [^\s]+)+$/u.test(testCommand), "package.json test command must use node --test and single-space-separated test paths");
    // Derive coverage from the reviewed source inventory, never filesystem discovery.
    const expectedTests = EXPECTED_SOURCE_DIRECTORIES.get("tests")
      .filter((path) => !path.includes("/") && path.endsWith(".test.mjs") && path !== "bundle-smoke.test.mjs")
      .map((path) => `tests/${path}`);
    const testPaths = sortedUnique(testCommand.slice("node --test ".length).split(" "), "package.json regression test paths");
    compareFileSets(testPaths, expectedTests, "package.json regression test inventory");
    for (const [scriptName, command] of Object.entries(EXPECTED_PACKAGE_SCRIPTS)) {
      assert(packageJson.scripts[scriptName] === command, `package.json script ${scriptName} must equal ${JSON.stringify(command)}`);
    }
  }
}

function validateMarketplace(marketplace, plugin) {
  assert(marketplace.name === SKILL_NAME, "Marketplace name must match the single Skill identity");
  assert(marketplace.interface?.displayName === plugin.interface?.displayName, "Marketplace display name must match plugin metadata");
  assert(Array.isArray(marketplace.plugins) && marketplace.plugins.length === 1, "Marketplace must contain exactly one plugin");
  const [entry] = marketplace.plugins;
  assert(entry.name === SKILL_NAME, "Marketplace plugin name mismatch");
  assert(entry.source?.source === "url", "Marketplace plugin source must use an immutable URL entry");
  assert(entry.source?.url === `${EXPECTED_REPOSITORY}.git`, "Marketplace repository URL mismatch");
  assert(entry.source?.ref === `v${EXPECTED_VERSION}`, "Marketplace ref must match the immutable release tag");
  assert(entry.policy?.installation === "AVAILABLE" && entry.policy?.authentication === "ON_INSTALL", "Marketplace policy mismatch");
  assert(entry.category === plugin.interface?.category, "Marketplace category must match plugin metadata");
}

function parseSkillFrontmatter(markdown) {
  assert(markdown.startsWith("---\n"), "SKILL.md must start with YAML frontmatter");
  const end = markdown.indexOf("\n---\n", 4);
  assert(end >= 0, "SKILL.md frontmatter is not terminated");
  const fields = Object.create(null);
  for (const line of markdown.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    assert(separator > 0, `SKILL.md contains unsupported frontmatter line: ${line}`);
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    assert(/^[a-z][a-z0-9_-]*$/u.test(key) && rawValue.length > 0, `SKILL.md contains invalid frontmatter field: ${line}`);
    assert(!Object.hasOwn(fields, key), `SKILL.md repeats frontmatter field ${key}`);
    if (rawValue.startsWith('"')) {
      const value = parseJsonStrict(rawValue);
      assert(typeof value === "string" && value.length > 0, `SKILL.md frontmatter field ${key} must be a string scalar`);
      fields[key] = value;
    } else {
      assert(/^[a-z0-9][a-z0-9-]*$/u.test(rawValue), `SKILL.md frontmatter field ${key} must be a quoted string or safe slug`);
      fields[key] = rawValue;
    }
  }
  return fields;
}

function parseAgentYaml(yaml) {
  assert(!yaml.includes("\r") && !yaml.includes("\t"), "agents/openai.yaml must use LF line endings and spaces");
  const allowedFields = {
    interface: new Set(["display_name", "short_description", "default_prompt"]),
    policy: new Set(["allow_implicit_invocation"]),
  };
  const document = Object.create(null);
  let section = null;

  for (const [index, line] of yaml.trimEnd().split("\n").entries()) {
    const sectionMatch = line.match(/^([a-z][a-z0-9_]*):$/u);
    if (sectionMatch) {
      section = sectionMatch[1];
      assert(Object.hasOwn(allowedFields, section), `agents/openai.yaml contains unknown section ${section}`);
      assert(!Object.hasOwn(document, section), `agents/openai.yaml repeats section ${section}`);
      document[section] = Object.create(null);
      continue;
    }

    const fieldMatch = line.match(/^  ([a-z][a-z0-9_]*):\s*(.+)$/u);
    assert(fieldMatch && section, `agents/openai.yaml contains unsupported line ${index + 1}: ${line}`);
    const [, key, rawValue] = fieldMatch;
    assert(allowedFields[section].has(key), `agents/openai.yaml contains unknown ${section} field ${key}`);
    assert(!Object.hasOwn(document[section], key), `agents/openai.yaml repeats ${section}.${key}`);
    if (section === "policy") {
      assert(key === "allow_implicit_invocation" && ["true", "false"].includes(rawValue), "agents/openai.yaml invocation policy must be a boolean");
      document[section][key] = rawValue === "true";
    } else {
      const value = parseJsonStrict(rawValue);
      assert(typeof value === "string" && value.length > 0, `agents/openai.yaml ${section}.${key} must be a non-empty quoted string`);
      document[section][key] = value;
    }
  }

  compareFileSets(Object.keys(document), Object.keys(allowedFields), "agents/openai.yaml sections");
  for (const [name, fields] of Object.entries(allowedFields)) {
    compareFileSets(Object.keys(document[name]), [...fields], `agents/openai.yaml ${name} fields`);
  }
  return document;
}

async function validateSkillSurfaces(root, skillName, { plugin, primary = false, authorRoot = null } = {}) {
  const skillMarkdown = await readFile(resolve(root, "SKILL.md"), "utf8");
  const frontmatter = parseSkillFrontmatter(skillMarkdown);
  compareFileSets(Object.keys(frontmatter), ["name", "description"], "SKILL.md frontmatter fields");
  assert(frontmatter.name === skillName, `SKILL.md name must match the Skill identity: ${skillName}`);
  assert(typeof frontmatter.description === "string" && frontmatter.description.length <= 1024, "SKILL.md description must be a non-empty Agent Skills description of at most 1024 characters");
  assert(/(?:\bUse (?:for|when)\b|适用于|在.+时使用)/u.test(frontmatter.description), "SKILL.md description must state when the Skill applies");
  assert(skillMarkdown.split("\n").length <= 500, "SKILL.md must remain below the 500-line progressive-disclosure limit");

  const agentYaml = await readFile(resolve(root, "agents", "openai.yaml"), "utf8");
  const agent = parseAgentYaml(agentYaml);
  const calls = [...agent.interface.default_prompt.matchAll(/\$([a-z][a-z0-9-]*)/gu)].map((match) => match[1]);
  assert(calls.includes(skillName) && calls.every((name) => name === skillName), `agents/openai.yaml default_prompt must invoke only $${skillName}`);
  if (primary) {
    assert(Array.isArray(plugin.interface?.defaultPrompt) && plugin.interface.defaultPrompt.length === 1, "Plugin interface must expose exactly one default prompt");
    assert(agent.interface.display_name === plugin.interface.displayName, "agents/openai.yaml display_name must match plugin.json");
    assert(agent.interface.short_description === plugin.interface.shortDescription, "agents/openai.yaml short_description must match plugin.json");
    assert(agent.interface.default_prompt === plugin.interface.defaultPrompt[0], "agents/openai.yaml default_prompt must match plugin.json");
  } else if (authorRoot) {
    const author = parseAgentYaml(await readFile(resolve(authorRoot, "agents", "openai.yaml"), "utf8"));
    assert(canonicalize(agent) === canonicalize(author), `agents/openai.yaml metadata must match its author source: ${skillName}`);
  }
  assert(agent.policy.allow_implicit_invocation === (skillName === SKILL_NAME), "Only the director workflow entry may allow implicit invocation; internal Skills require explicit handoff");
}

async function validateWorkflowEntrypoints(root) {
  const workflow = await readFile(resolve(root, ".github", "workflows", "validate.yml"), "utf8");
  const expectedWorkflow = [
    "name: 项目校验",
    "",
    "on:",
    "  push:",
    "    branches: [main]",
    "    tags: [\"v*\"]",
    "  pull_request:",
    "",
    "permissions:",
    "  contents: read",
    "",
    "jobs:",
    "  validate:",
    "    strategy:",
    "      fail-fast: false",
    "      matrix:",
    "        os: [ubuntu-latest, windows-latest]",
    '        node: ["22", "24"]',
    "    runs-on: ${{ matrix.os }}",
    "    timeout-minutes: 20",
    "    steps:",
    "      - name: 检出源码",
    `        uses: ${EXPECTED_CHECKOUT_ACTION} # v4`,
    "      - name: 配置 Node.js ${{ matrix.node }}",
    `        uses: ${EXPECTED_SETUP_NODE_ACTION} # v4`,
    "        with:",
    "          node-version: ${{ matrix.node }}",
    "      - name: 校验源分发",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS.validate}`,
    "      - name: 运行校验回归测试",
    "        run: npm test",
    "      - name: 检查契约索引",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS["contracts:index:check"]}`,
    "      - name: 核对发布标签与版本",
    "        if: startsWith(github.ref, 'refs/tags/')",
    `        run: ${EXPECTED_RELEASE_TAG_COMMAND}`,
    "      - name: 构建字节一致的插件包",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS.build}`,
    "      - name: 校验构建包",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS["validate:bundle"]}`,
    "      - name: 验证安装后的只读工具",
    `        run: ${EXPECTED_PACKAGE_SCRIPTS["test:bundle"]}`,
    "",
  ].join("\n");
  assert(workflow === expectedWorkflow, "CI workflow must match the reviewed, read-only release-gate template exactly");
}

async function validateSourceStructure(root, model, { requireChildren = false } = {}) {
  const topLevel = await readdir(root);
  const unexpected = topLevel.filter((entry) => !SOURCE_TOP_LEVEL.has(entry)).sort();
  assert(unexpected.length === 0, `Unexpected top-level repository entries: ${unexpected.join(", ")}`);
  for (const [directory, expected] of EXPECTED_SOURCE_DIRECTORIES) {
    await validateTree(resolve(root, directory), expected, `${directory} source file set`);
  }
  const checkDirectories = async (directory, names, { optional = false, subset = false } = {}) => {
    const path = resolve(root, directory);
    const stat = await lstat(path).catch((error) => {
      if (optional && error.code === "ENOENT") return null;
      throw error;
    });
    if (!stat) {
      assert(names.length === 0, `Missing ${directory}/ author source directories: ${names.join(", ")}`);
      return;
    }
    assert(stat.isDirectory() && !stat.isSymbolicLink(), `${directory}/ must be a real directory`);
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      const child = await lstat(resolve(path, entry.name));
      assert(child.isDirectory() && !child.isSymbolicLink(), `${directory}/ must contain only real Skill directories: ${entry.name}`);
      assert(names.includes(entry.name), `Unexpected ${directory}/ Skill directory: ${entry.name}`);
    }
    if (!subset) compareFileSets(entries.map((entry) => entry.name), names, `${directory}/ Skill directory set`);
    else assert(entries.some((entry) => entry.name === SKILL_NAME), `skills/ must contain ${SKILL_NAME}/`);
  };
  await checkDirectories("skills", model.enabledSkills, { subset: !requireChildren });
  await checkDirectories("skill-sources", model.enabledSkills.filter((name) => name !== SKILL_NAME), { optional: true });
}

async function validateMaterializedSkill(root, inventory, descriptor, sourceRoot) {
  const skillRoot = resolve(root, descriptor.destinationRoot);
  const local = packageInventory(inventory, descriptor);
  await validateTree(skillRoot, descriptor.destinationRoot === "." ? [...local.files, LICENSE_PATH] : local.files,
    `${descriptor.name} distribution file set`);
  const manifests = {
    contracts: await readStrictJson(skillRoot, "contracts.json"),
    lifecycle: await readStrictJson(skillRoot, "reference-lifecycle.json"),
    index: await readStrictJson(skillRoot, "resources/contracts/index.json"),
  };
  await validateSkillSurfaces(skillRoot, descriptor.name, {
    plugin: inventory.plugin, primary: descriptor.name === SKILL_NAME,
    authorRoot: resolve(sourceRoot, descriptor.sourceRoot),
  });
  const contracts = await validateContracts(skillRoot, { ...local, ...manifests });
  const markdown = await validateMarkdownFiles(skillRoot, local.files.filter((path) => extname(path) === ".md"));
  const text = await validateTextBoundaries(skillRoot, local);
  return { name: descriptor.name, root: skillRoot, files: local.files.length,
    actualKinds: descriptor.actualKinds, targetKinds: descriptor.targetKinds,
    references: manifests.lifecycle.references.length, ...contracts, ...markdown, ...text };
}

async function validateExportBytes(outputRoot, sourceRoot, exports, label) {
  for (const entry of exports) {
    await assertRegularPath(sourceRoot, entry.source);
    await assertRegularPath(outputRoot, entry.destination);
    const sourceBytes = await readFile(resolve(sourceRoot, ...entry.source.split("/")));
    const destinationBytes = await readFile(resolve(outputRoot, ...entry.destination.split("/")));
    assert(sourceBytes.equals(destinationBytes), `${label} file differs from source bytes: ${entry.destination} (source: ${entry.source})`);
  }
}

function summarizePackages(skills) {
  const first = skills.find((skill) => skill.name === SKILL_NAME) ?? skills[0];
  const counts = ["roots", "schemas", "examples", "references", "receipts", "schemaRefs", "markdownFiles", "links", "fragments", "textFiles"];
  const summary = Object.fromEntries(counts.map((key) => [key, first[key]]));
  summary.totals = Object.fromEntries(counts.map((key) => [key, skills.reduce((total, skill) => total + skill[key], 0)]));
  return summary;
}

// Read-only synchronization preflight. Child copies may be absent or stale;
// their author sources and the canonical distribution must already be valid.
export async function validateAuthoringSources(root = repositoryRoot) {
  const absoluteRoot = resolve(root);
  const inventory = await createDistributionInventory(absoluteRoot);
  await validateSourceStructure(absoluteRoot, inventory.catalogModel);
  for (const path of inventory.sourceFiles) await assertRegularPath(absoluteRoot, path);
  const packageJson = await readStrictJson(absoluteRoot, "package.json");
  const marketplace = await readStrictJson(absoluteRoot, MARKETPLACE_PATH);
  validatePluginAndPackage(inventory.plugin, inventory.contracts, packageJson);
  validateMarketplace(marketplace, inventory.plugin);
  await validateWorkflowEntrypoints(absoluteRoot);
  const primary = inventory.skills.find((skill) => skill.name === SKILL_NAME);
  const canonical = await validateMaterializedSkill(absoluteRoot, inventory, primary, absoluteRoot);
  for (const child of inventory.skills.filter((skill) => skill.name !== SKILL_NAME)) {
    const authorRoot = resolve(absoluteRoot, child.sourceRoot);
    const files = ["SKILL.md", "agents/openai.yaml"];
    await validateTree(authorRoot, files, `${child.name} author source file set`);
    await validateSkillSurfaces(authorRoot, child.name);
    await validateTextBoundaries(authorRoot, { files });
  }
  const distributionText = await validateTextBoundaries(absoluteRoot, { files: [PLUGIN_PATH] });
  return { catalogModel: inventory.catalogModel, inventory, canonical, distributionText };
}

export async function validateRepository(root = repositoryRoot) {
  const absoluteRoot = resolve(root);
  const preflight = await validateAuthoringSources(absoluteRoot);
  const { inventory } = preflight;
  await validateSourceStructure(absoluteRoot, inventory.catalogModel, { requireChildren: true });
  const skills = [preflight.canonical];
  for (const descriptor of inventory.skills.filter((skill) => skill.name !== SKILL_NAME)) {
    skills.push(await validateMaterializedSkill(absoluteRoot, inventory, descriptor, absoluteRoot));
  }
  await validateExportBytes(absoluteRoot, absoluteRoot, inventory.exports, "Derived Skill");
  const developmentMarkdown = await validateDevelopmentMarkdown(absoluteRoot);
  const summary = summarizePackages(skills);
  for (const key of ["markdownFiles", "links", "fragments"]) summary[key] += developmentMarkdown[key];
  summary.textFiles += preflight.distributionText.textFiles;
  return {
    valid: true, mode: "source", root: absoluteRoot, files: inventory.files.length,
    exports: inventory.exports.length, sourceFiles: inventory.sourceFiles.length,
    enabledSkills: inventory.catalogModel.enabledSkills, skills, ...summary, byteIdentical: true,
  };
}

export async function validateBundle(bundleRoot, sourceRoot = repositoryRoot, { target = { type: "plugin" } } = {}) {
  const absoluteSource = resolve(sourceRoot);
  const absoluteBundle = resolve(bundleRoot);
  assert(absoluteBundle !== absoluteSource, "Bundle root must differ from source root");
  const source = await validateRepository(absoluteSource);
  const inventory = await createDistributionInventory(absoluteSource, { target });
  await validateTree(absoluteBundle, inventory.files, "Bundle distribution file set");
  if (target.type === "plugin") {
    validatePluginAndPackage(await readStrictJson(absoluteBundle, PLUGIN_PATH), inventory.contracts);
  }
  const skills = [];
  for (const descriptor of inventory.skills) skills.push(await validateMaterializedSkill(absoluteBundle, inventory, descriptor, absoluteSource));
  const text = await validateTextBoundaries(absoluteBundle, { files: target.type === "plugin" ? [PLUGIN_PATH] : [] });
  await validateExportBytes(absoluteBundle, absoluteSource, inventory.exports, "Bundle");
  const summary = summarizePackages(skills);
  summary.textFiles += text.textFiles;
  return {
    valid: true, mode: "bundle", target: inventory.target, root: absoluteBundle, sourceRoot: absoluteSource,
    files: inventory.files.length, exports: inventory.exports.length, sourceFiles: inventory.sourceFiles.length,
    skills, ...summary, sourceFilesValidated: source.files, byteIdentical: true,
  };
}

function usage() {
  console.error("用法：node scripts/validate-repository.mjs [--bundle <构建包目录> [--skill <已启用 Skill 名称>]]");
}

async function main() {
  const args = process.argv.slice(2);
  let result;
  if (args.length === 0) result = await validateRepository();
  else {
    const options = {};
    for (let index = 0; index < args.length; index += 2) {
      const flag = args[index], value = args[index + 1];
      if (!["--bundle", "--skill"].includes(flag) || Object.hasOwn(options, flag) || !value || value.startsWith("--")) {
        usage(); process.exitCode = 2; return;
      }
      options[flag] = value;
    }
    if (!options["--bundle"]) { usage(); process.exitCode = 2; return; }
    result = await validateBundle(options["--bundle"], repositoryRoot, { target: options["--skill"] ? { type: "skill", name: options["--skill"] } : { type: "plugin" } });
  }
  console.log(JSON.stringify({ ...result, messageZh: result.mode === "bundle" ? "构建包校验通过，分发内容与源码一致。" : "源码、契约、引用和分发边界校验通过。" }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error("项目校验失败，原始诊断：\n" + (error instanceof Error ? error.stack || error.message : String(error)));
    process.exitCode = 1;
  });
}
