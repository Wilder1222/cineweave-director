import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { checkShotReview, countPrompt, REVIEW_ROLES } from "../skills/cineweave-director/scripts/check-shot-review.mjs";

function worksheet() {
  const shotIds = ["shot.arrival", "shot.response"];
  return {
    source: { type: "prompt", id: "prompt.shop", version: 1 }, mode: "full", shotIds,
    reviews: REVIEW_ROLES.flatMap((role) => shotIds.map((shotId) => ({
      role, shotId, status: "pass", criterion: `Check ${role} against the selected design.`,
      observation: `Synthetic ${role} finding for ${shotId}; fixture, not an artistic evaluation.`,
      sourceLocator: `prompt.shop v1 / ${shotId} / ${role}`,
    }))),
  };
}

test("full review closes every role-shot pair without claiming media verification or mutating input", () => {
  const input = worksheet();
  const before = structuredClone(input);
  const result = checkShotReview(input);
  assert.equal(result.valid, true);
  assert.equal(result.expectedRows, 12);
  assert.equal(result.coverageComplete, true);
  assert.equal(result.reviewComplete, true);
  assert.equal(result.scope, "plan_only");
  assert.deepEqual(input, before);
});

test("coverage rejects missing, duplicate, extra pairs and duplicate inventory IDs", () => {
  for (const mutate of [
    (w) => { w.reviews.pop(); },
    (w) => { w.reviews.push(w.reviews[0]); },
    (w) => { w.reviews[0].shotId = "shot.absent"; },
    (w) => { w.shotIds[1] = w.shotIds[0]; },
    (w) => { w.reviews = []; },
  ]) {
    const input = worksheet(); mutate(input);
    const result = checkShotReview(input);
    assert.equal(result.valid, false);
    assert.equal(result.coverageComplete, false);
    assert.equal(result.reviewComplete, false);
  }
});

test("focused review covers only explicitly selected perspectives and all shots", () => {
  const input = worksheet(); input.mode = "focused"; input.roles = ["cinematography"];
  input.reviews = input.reviews.filter((row) => row.role === "cinematography");
  assert.equal(checkShotReview(input).reviewComplete, true);
  input.roles.push("cinematography");
  assert.equal(checkShotReview(input).valid, false);
});

test("unknowns and revisions remain open even with complete coverage", () => {
  const input = worksheet();
  input.reviews[0].status = "unknown";
  input.reviews[0].observation = "The incoming prop state is unavailable.";
  const unknown = checkShotReview(input);
  assert.equal(unknown.valid, true);
  assert.equal(unknown.coverageComplete, true);
  assert.equal(unknown.reviewComplete, false);
  assert.equal(unknown.openItems.length, 1);
  input.reviews[0].status = "revise";
  assert.equal(checkShotReview(input).valid, false);
  input.reviews[0].repair = { domain: "character", variable: "response onset", acceptance: "Response follows the cue." };
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).reviewComplete, false);
  input.reviews[0].status = "pass";
  assert.equal(checkShotReview(input).valid, false);
});

test("not-applicable rows need an explanation and cannot yield an all-exempt pass", () => {
  const input = worksheet();
  for (const row of input.reviews) { row.status = "not_applicable"; row.observation = "Synthetic exemption for this fixture."; }
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).reviewComplete, false);
  input.reviews[0].observation = " ";
  assert.throws(() => checkShotReview(input), /observation/);
});

test("blank verdicts, unsupported fields and media claims fail instead of passing a marker check", () => {
  for (const mutate of [
    (w) => { delete w.reviews[0].status; },
    (w) => { w.reviews[0].criterion = "\t"; },
    (w) => { w.reviews[0].observation = ""; },
    (w) => { delete w.reviews[0].sourceLocator; },
    (w) => { w.source.type = "media"; },
    (w) => { w.source.version = 0; },
    (w) => { w.roles = ["direction"]; },
    (w) => { w.mode = "focused"; w.roles = []; },
    (w) => { w.reviews[0].role = "unknown-role"; },
    (w) => { w.reviews[0].approved = true; },
    (w) => { w.prompt = { text: "copy", maxNonWhitespaceCodePoints: -1 }; },
  ]) {
    const input = worksheet(); mutate(input);
    assert.throws(() => checkShotReview(input));
  }
});

test("prompt budget counts Unicode code points, has no universal cap and never changes copy", () => {
  assert.equal(countPrompt("甲\t乙\n😀\u0085\u3000e\u0301"), 5);
  assert.equal(countPrompt("👩‍👩‍👧‍👦"), 7);
  const input = worksheet(); input.prompt = { text: "甲 乙😀", maxNonWhitespaceCodePoints: 3 };
  assert.equal(checkShotReview(input).valid, true);
  input.prompt.maxNonWhitespaceCodePoints = 2;
  assert.equal(checkShotReview(input).valid, false);
  assert.equal(checkShotReview(input).reviewComplete, false);
  assert.equal(input.prompt.text, "甲 乙😀");
  input.prompt = { text: "字".repeat(5001) };
  assert.equal(checkShotReview(input).valid, true);
  assert.equal(checkShotReview(input).prompt.limit, null);
  input.source.type = "design";
  assert.equal(checkShotReview(input).valid, false);
});

test("CLI distinguishes completed, unresolved and invalid worksheets without writes", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-shot-review-"));
  const file = join(root, "review.json");
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  try {
    for (const [status, expected] of [["pass", 0], ["unknown", 2], ["invalid", 1]]) {
      const input = worksheet(); input.reviews[0].status = status;
      const bytes = JSON.stringify(input);
      await writeFile(file, bytes);
      const result = spawnSync(process.execPath, [cli, file], { encoding: "utf8" });
      assert.equal(result.status, expected, result.stderr);
      assert.equal(await readFile(file, "utf8"), bytes);
      assert.equal(JSON.parse(result.stdout || result.stderr).scope, "plan_only");
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("three-shot narrative handoff survives draft review, one-variable revision and CLI readback", async () => {
  // Authored planning fixture, not an independent model or media-quality evaluation.
  const fixturePath = new URL("./fixtures/ensemble-handoff.json", import.meta.url);
  const { worksheet: initial, correction } = JSON.parse(await readFile(fixturePath, "utf8"));
  const before = JSON.stringify(initial);
  const firstReview = checkShotReview(initial);
  assert.equal(firstReview.valid, true);
  assert.equal(firstReview.coverageComplete, true);
  assert.equal(firstReview.expectedRows, 18);
  assert.equal(firstReview.reviewComplete, false);
  assert.deepEqual(firstReview.openItems, [{ role: "performance", shotId: "S2", status: "revise" }]);

  const revised = structuredClone(initial);
  revised.source.version += 1;
  assert.equal(revised.prompt.text.split(correction.before).length, 2, "The correction must target one actual sentence.");
  revised.prompt.text = revised.prompt.text.replace(correction.before, correction.after);
  for (const row of revised.reviews) {
    row.sourceLocator = row.sourceLocator.replace(" v1 /", " v2 /");
    if (row.role === correction.role && row.shotId === correction.shotId) {
      assert.equal(row.repair.domain, "prompt", "The discovering perspective does not change ownership.");
      row.status = "pass";
      row.observation = correction.observation;
      delete row.repair;
    }
  }
  assert.equal(revised.prompt.text.replace(correction.after, correction.before), initial.prompt.text);
  assert.equal(JSON.stringify(initial), before, "Keep the prior prompt and findings intact.");
  assert.equal(checkShotReview(revised).reviewComplete, true);

  const root = await mkdtemp(join(tmpdir(), "cineweave-handoff-roundtrip-"));
  const cli = fileURLToPath(new URL("../skills/cineweave-director/scripts/check-shot-review.mjs", import.meta.url));
  try {
    for (const [document, expectedExit] of [[initial, 2], [revised, 0]]) {
      const path = join(root, `review-v${document.source.version}.json`);
      await writeFile(path, JSON.stringify(document));
      const result = spawnSync(process.execPath, [cli, path], { cwd: root, encoding: "utf8" });
      assert.equal(result.status, expectedExit, result.stderr);
      const readback = JSON.parse(result.stdout);
      assert.equal(readback.expectedRows, 18);
      assert.equal(readback.scope, "plan_only");
      assert.equal(readback.reviewComplete, expectedExit === 0);
      assert.deepEqual(JSON.parse(await readFile(path, "utf8")), document);
    }
  } finally { await rm(root, { recursive: true, force: true }); }
});
