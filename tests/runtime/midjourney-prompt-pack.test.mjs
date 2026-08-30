import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateDocument } from "../../scripts/validate-output.mjs";

test("Midjourney prompt packs enforce Omni, profile-token and Moodboard parameter compatibility", async () => {
  const root = process.cwd();
  const schemaPath = join(root, "packages", "cineweave-contracts", "schemas", "midjourney-prompt-pack.schema.json");
  const examplePath = join(root, "packages", "cineweave-contracts", "examples", "midjourney-prompt-pack.json");
  const profileSchemaPath = join(root, "packages", "cineweave-contracts", "schemas", "midjourney-aesthetic-profile.schema.json");
  const profileExamplePath = join(root, "packages", "cineweave-contracts", "examples", "midjourney-aesthetic-profile.json");
  const temporary = await mkdtemp(join(tmpdir(), "cineweave-midjourney-pack-"));
  try {
    const valid = await validateDocument(schemaPath, examplePath);
    assert.equal(valid.valid, true, valid.errors.join("\n"));
    const profile = await validateDocument(profileSchemaPath, profileExamplePath);
    assert.equal(profile.valid, true, profile.errors.join("\n"));

    const pack = JSON.parse(await readFile(examplePath, "utf8"));
    pack.parameterPolicy.modelVersion = "V8.2";
    const incompatiblePath = join(temporary, "omni-with-v8.json");
    await writeFile(incompatiblePath, JSON.stringify(pack, null, 2), "utf8");
    const incompatible = await validateDocument(schemaPath, incompatiblePath);
    assert.equal(incompatible.valid, false);
    assert.match(incompatible.errors.join("\n"), /modelVersion.*V7/);

    pack.referenceSlots = pack.referenceSlots.filter((slot) => slot.role !== "omni_reference");
    const v8WithoutOmniPath = join(temporary, "v8-without-omni.json");
    await writeFile(v8WithoutOmniPath, JSON.stringify(pack, null, 2), "utf8");
    const v8WithoutOmni = await validateDocument(schemaPath, v8WithoutOmniPath);
    assert.equal(v8WithoutOmni.valid, true, v8WithoutOmni.errors.join("\n"));

    const moodboardWithStyleWeight = JSON.parse(JSON.stringify(pack));
    moodboardWithStyleWeight.variants[0].parameterTokens.push("--sw 100");
    const moodboardWithStyleWeightPath = join(temporary, "moodboard-with-style-weight.json");
    await writeFile(moodboardWithStyleWeightPath, JSON.stringify(moodboardWithStyleWeight, null, 2), "utf8");
    const moodboardWithStyleWeightResult = await validateDocument(schemaPath, moodboardWithStyleWeightPath);
    assert.equal(moodboardWithStyleWeightResult.valid, false);

    const moodboardWithoutProfileToken = JSON.parse(JSON.stringify(pack));
    moodboardWithoutProfileToken.variants = moodboardWithoutProfileToken.variants.map((variant) => ({
      ...variant,
      parameterTokens: variant.parameterTokens.filter((token) => !token.startsWith("--p "))
    }));
    const moodboardWithoutProfileTokenPath = join(temporary, "moodboard-without-profile-token.json");
    await writeFile(moodboardWithoutProfileTokenPath, JSON.stringify(moodboardWithoutProfileToken, null, 2), "utf8");
    const moodboardWithoutProfileTokenResult = await validateDocument(schemaPath, moodboardWithoutProfileTokenPath);
    assert.equal(moodboardWithoutProfileTokenResult.valid, false);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
