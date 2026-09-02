import test from "node:test";
import assert from "node:assert/strict";
import { readOriginalCaseAtlas, validateOriginalCaseAtlasSnapshot } from "../../scripts/validate-original-case-atlas.mjs";
import { ORIGINAL_CASE_INDEX_LOAD, planOriginalCaseLoads } from "../../skills/cineweave-prompt/scripts/route-original-case-atlas.mjs";

async function expectMutationFailure(mutate, pattern) {
  const snapshot = await readOriginalCaseAtlas();
  mutate(snapshot);
  const result = await validateOriginalCaseAtlasSnapshot(snapshot);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), pattern);
}

test("Original Case Atlas validates seven isolated, rights-cleared, reproducible categories", async () => {
  const result = await validateOriginalCaseAtlasSnapshot(await readOriginalCaseAtlas());
  assert.deepEqual(result.errors, []);
  assert.equal(result.valid, true);
  assert.equal(result.caseCount, 7);
});

test("Original Case Atlas executes every eval request to one observable category load", async () => {
  const snapshot = await readOriginalCaseAtlas();
  for (const item of snapshot.evalFixture.cases) {
    const plan = planOriginalCaseLoads(snapshot.index, item.prompt);
    assert.equal(plan.status, "matched", item.id);
    assert.equal(plan.category, item.category, item.id);
    assert.deepEqual(plan.loads, item.loads, item.id);
  }
});

test("Original Case Atlas loads no category for ambiguous or unmatched requests", async () => {
  const snapshot = await readOriginalCaseAtlas();
  const ambiguous = planOriginalCaseLoads(snapshot.index, "portrait and product worked examples");
  assert.equal(ambiguous.status, "ambiguous");
  assert.deepEqual(ambiguous.categories, ["portrait", "product"]);
  assert.deepEqual(ambiguous.loads, [ORIGINAL_CASE_INDEX_LOAD]);

  const unmatched = planOriginalCaseLoads(snapshot.index, "show an unrelated worked example");
  assert.equal(unmatched.status, "unmatched");
  assert.deepEqual(unmatched.loads, [ORIGINAL_CASE_INDEX_LOAD]);
});

test("Original Case Atlas rejects a stale PromptRecord hash", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.portrait.payload.prompt.contentHash = `sha256:${"f".repeat(64)}`;
  }, /portrait prompt contentHash is stale/);
});

test("Original Case Atlas rejects a duplicate routed category", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.index.categories[1].category = "portrait";
  }, /routing index categories must be unique/);
});

test("Original Case Atlas rejects rights that are no longer verified", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.rights.status = "restricted";
  }, /atlas rights profile must remain verified/);
});

test("Original Case Atlas rejects active SVG script content", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.food.candidateBytes = Buffer.concat([
      Buffer.from(snapshot.cases.food.candidateBytes),
      Buffer.from("<script>alert(1)</script>", "utf8")
    ]);
  }, /forbidden active or external SVG content: script/);
});

test("Original Case Atlas rejects SVG animation elements", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.product.candidateBytes = Buffer.concat([
      Buffer.from(snapshot.cases.product.candidateBytes),
      Buffer.from('<animate attributeName="opacity" values="0;1" dur="1s"/>', "utf8")
    ]);
  }, /forbidden active or external SVG content: animation element/);
});

test("Original Case Atlas rejects escaped CSS imports", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.editorial.candidateBytes = Buffer.concat([
      Buffer.from(snapshot.cases.editorial.candidateBytes),
      Buffer.from('<style>@im\\70 ort "https://example.invalid/a.css";</style>', "utf8")
    ]);
  }, /forbidden active or external SVG content: style content/);
});

test("Original Case Atlas rejects contradictory completed-human-review prose", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.portrait.payload.summary += " Human review was completed successfully and confirmed the aesthetic quality.";
  }, /contradictory human, provider or pixel-equivalence claim/);
});

test("Original Case Atlas rejects contradictory positive provider-quality prose", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases.product.payload.summary += " The provider output is excellent and production-ready.";
  }, /contradictory human, provider or pixel-equivalence claim/);
});

test("Original Case Atlas rejects contradictory cross-platform pixel prose", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.cases["exact-text"].payload.summary += " Cross-platform font rendering is identical on every platform.";
  }, /contradictory human, provider or pixel-equivalence claim/);
});

test("Original Case Atlas rejects cross-category routing", async () => {
  await expectMutationFailure((snapshot) => {
    snapshot.index.categories.find((item) => item.category === "portrait").referencePath = "categories/product.md";
  }, /portrait index referencePath must route only to categories\/portrait\.md/);
});
