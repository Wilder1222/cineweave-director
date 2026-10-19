import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseJsonStrict } from "../scripts/canonical-json.mjs";
import {
  createSkillExportPlan, loadSkillCatalog, resolveImplementationOwner, validateSkillCatalog,
} from "../scripts/skill-catalog.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NAMES = ["cineweave-director", "cineweave-platform", "cineweave-reference", "cineweave-review"];
const [DIRECTOR, PLATFORM, REFERENCE, REVIEW] = NAMES;
const CORE = `skills/${DIRECTOR}`;
const PROJECTION = "cineweave_codex_prompt_projection_plan";
const HELPERS = [
  "check-delivery.mjs", "check-video-plan.mjs", "check-audio-returns.mjs",
  "check-shot-review.mjs", "check-change-impact.mjs", "parse-json.mjs",
];
const sort = (values) => [...values].sort((left, right) => left.localeCompare(right, "en"));
const clone = (value) => structuredClone(value);

const [sourceCatalog, contracts, lifecycle, index] = await Promise.all([
  loadSkillCatalog(ROOT),
  readFile(join(ROOT, CORE, "contracts.json"), "utf8").then(parseJsonStrict),
  readFile(join(ROOT, CORE, "reference-lifecycle.json"), "utf8").then(parseJsonStrict),
  readFile(join(ROOT, CORE, "resources/contracts/index.json"), "utf8").then(parseJsonStrict),
]);
const authority = { contracts, lifecycle, index };

test("film reference library exposes exactly twelve live directions separately from animation and method cards", async () => {
  const optional = join(ROOT, CORE, "references/optional");
  const [entry, live, animation, skill, style, reference] = await Promise.all([
    readFile(join(optional, "film-television-reference-library.md"), "utf8"),
    readFile(join(optional, "live-action-reference-directions.md"), "utf8"),
    readFile(join(optional, "animation-reference-directions.md"), "utf8"),
    readFile(join(ROOT, CORE, "SKILL.md"), "utf8"),
    readFile(join(ROOT, CORE, "references/routes/style.md"), "utf8"),
    readFile(join(ROOT, CORE, "references/routes/reference-evidence.md"), "utf8"),
  ]);
  const liveIds = [
    "live-youth-friends", "live-urban-family", "live-workplace-ensemble", "live-town-rural",
    "live-grounded-suspense", "live-republican-street", "live-war-field", "live-song-everyday",
    "live-song-court", "live-ming-court", "live-ming-jianghu", "live-natural-xianxia",
  ];
  const animationIds = ["anim-2d-everyday", "anim-2d-fantasy", "anim-ink-line", "anim-3d-eastern-fantasy"];
  assert.deepEqual([...live.matchAll(/^## (live-[a-z-]+)$/gm)].map((match) => match[1]), liveIds);
  assert.deepEqual([...animation.matchAll(/^## (anim-[a-z0-9-]+)$/gm)].map((match) => match[1]), animationIds);
  for (const id of liveIds) assert.ok(entry.includes(`live-action-reference-directions.md#${id}`));
  for (const id of animationIds) assert.ok(entry.includes(`animation-reference-directions.md#${id}`));
  for (const card of live.split(/^## live-[a-z-]+$/m).slice(1)) {
    for (const field of ["题材与时代", "参考作品与范围", "美术", "光线与摄影", "服装妆造", "情绪与用途", "禁用与验收"]) {
      assert.ok(card.includes(`**${field}：**`), `live direction needs ${field}`);
    }
  }
  for (const text of [skill, style, reference]) assert.ok(text.includes("film-television-reference-library.md"));
  for (const name of ["film-television-reference-library", "live-action-reference-directions", "animation-reference-directions"]) {
    const registration = lifecycle.references.find((value) => value.path === `references/optional/${name}.md`);
    assert.equal(registration?.lifecycle, "optional");
    assert.ok(registration.loadContexts.includes("style") && registration.loadContexts.includes("reference_evidence"));
  }
  const methods = await readFile(join(optional, "master-style-presets.md"), "utf8");
  const methodIds = [
    "hitchcock-suspense", "kurosawa-ensemble", "wong-withheld-intimacy", "anderson-tableau",
    "cuaron-lubezki-immersion", "deakins-source-led", "martel-sonic-space", "varda-essay-observation",
  ];
  assert.deepEqual([...methods.matchAll(/^\| `([a-z-]+)` \|/gm)].map((match) => match[1]), methodIds);
  for (const id of methodIds) assert.ok(entry.includes(`\`${id}\``), `compatibility record needs ${id}`);
});

function catalogAtStage(source, stage) {
  const selected = clone(source);
  for (const [position, name] of NAMES.entries()) selected.skills[name].enabled = position < stage;
  return selected;
}

// Negative cases and stage fixtures start from explicit P1 flags even after a
// later production stage is enabled. Kind ownership still comes from source.
const catalog = catalogAtStage(sourceCatalog, 1);

// This reviewed profile comes only from the three canonical manifests and the
// fixed entry/helper inventory. No test or implementation scans directories.
function profileFiles(documents = authority) {
  return sort([
    ".codex-plugin/plugin.json", "LICENSE", `${CORE}/SKILL.md`, `${CORE}/agents/openai.yaml`,
    `${CORE}/contracts.json`, `${CORE}/reference-lifecycle.json`, `${CORE}/resources/contracts/index.json`,
    ...HELPERS.map((name) => `${CORE}/scripts/${name}`),
    ...documents.lifecycle.references.map((entry) => `${CORE}/${entry.path}`),
    ...documents.index.contracts.flatMap((entry) => [
      `${CORE}/resources/contracts/${entry.schema}`, `${CORE}/resources/contracts/${entry.example}`,
    ]),
    ...documents.index.supportSchemas.map((entry) => `${CORE}/resources/contracts/${entry.schema}`),
  ]);
}

function fixture(stage = 1, baseline = catalog) {
  const selected = catalogAtStage(baseline, stage);
  const documents = clone(authority);
  return { catalog: selected, ...documents, files: profileFiles(documents) };
}

function plan(value = fixture(), target) {
  const model = validateSkillCatalog(value.catalog, value);
  return createSkillExportPlan(ROOT, model, value, target);
}

async function temporarySource(t, text = JSON.stringify(catalog)) {
  const source = await mkdtemp(join(tmpdir(), "cineweave-catalog-"));
  t.after(async () => {
    const local = relative(resolve(tmpdir()), resolve(source));
    assert.ok(local !== "" && local !== ".." && !local.startsWith(`..${sep}`), "fixture cleanup stays inside tmpdir");
    await rm(source, { recursive: true, force: true });
  });
  await writeFile(join(source, "skill-catalog.json"), text, "utf8");
  return source;
}

test("production catalog preserves canonical authorities and derives its actual enabled owners", () => {
  const before = JSON.stringify({ sourceCatalog, ...authority });
  const model = validateSkillCatalog(sourceCatalog, authority);
  const enabled = NAMES.filter((name) => sourceCatalog.skills[name].enabled);
  assert.deepEqual(model.enabledSkills, enabled);
  assert.equal(Object.keys(model.targetKindOwners).length, 52);
  assert.equal(Object.keys(model.actualKindOwners).length, 52);
  for (const kind of contracts.contractKinds) {
    const target = sourceCatalog.targetKindOwners[kind];
    const implementation = enabled.includes(target) ? target : DIRECTOR;
    assert.equal(model.actualKindOwners[kind], implementation);
    assert.deepEqual(resolveImplementationOwner(model, kind), { targetSkill: target, implementationSkill: implementation });
  }
  assert.deepEqual(Object.values(model.targetKindOwners).reduce((totals, name) => {
    totals[name] = (totals[name] ?? 0) + 1;
    return totals;
  }, {}), { [DIRECTOR]: 43, [REFERENCE]: 4, [PLATFORM]: 1, [REVIEW]: 4 });
  for (const key of ["contracts", "lifecycle", "index"]) assert.equal(model[key], authority[key]);
  assert.deepEqual(resolveImplementationOwner(model, PROJECTION), { targetSkill: PLATFORM, implementationSkill: enabled.includes(PLATFORM) ? PLATFORM : DIRECTOR });
  for (const kind of contracts.routes.production_plan.produces) {
    assert.deepEqual(resolveImplementationOwner(model, kind), { targetSkill: DIRECTOR, implementationSkill: DIRECTOR });
  }
  assert.equal(JSON.stringify({ sourceCatalog, ...authority }), before, "catalog derivation is read-only");
});

test("legal stages derive enabled target owners without registering another current owner table", async (t) => {
  const syntheticP4Catalog = fixture(4).catalog;
  const before = JSON.stringify(syntheticP4Catalog);
  const independentP1 = fixture(1, syntheticP4Catalog);
  assert.deepEqual(validateSkillCatalog(independentP1.catalog, independentP1).enabledSkills, [DIRECTOR]);
  assert.deepEqual(independentP1.catalog.skills, catalog.skills, "P1 baseline resets all specialist flags even from a P4 catalog");
  assert.deepEqual(independentP1.catalog.targetKindOwners, clone(sourceCatalog.targetKindOwners), "stage reset preserves canonical target ownership");
  assert.equal(JSON.stringify(syntheticP4Catalog), before, "fixture construction preserves the supplied P4 catalog");
  const expected = [
    { [DIRECTOR]: 52 },
    { [DIRECTOR]: 51, [PLATFORM]: 1 },
    { [DIRECTOR]: 47, [REFERENCE]: 4, [PLATFORM]: 1 },
    { [DIRECTOR]: 43, [REFERENCE]: 4, [PLATFORM]: 1, [REVIEW]: 4 },
  ];
  for (let stage = 1; stage <= 4; stage += 1) {
    await t.test(`stage ${stage}`, () => {
      const value = fixture(stage, syntheticP4Catalog);
      const model = validateSkillCatalog(value.catalog, value);
      assert.deepEqual(model.enabledSkills, NAMES.slice(0, stage));
      assert.deepEqual(Object.values(model.actualKindOwners).reduce((totals, name) => {
        totals[name] = (totals[name] ?? 0) + 1;
        return totals;
      }, {}), expected[stage - 1]);
      for (const kind of contracts.contractKinds) {
        const resolved = resolveImplementationOwner(model, kind);
        assert.equal(resolved.targetSkill, catalog.targetKindOwners[kind]);
        assert.equal(resolved.implementationSkill, model.enabledSkills.includes(resolved.targetSkill) ? resolved.targetSkill : DIRECTOR);
      }
    });
  }
});

test("catalog rejects unknown fields, identities, owner changes, and skipped stages", async (t) => {
  const cases = [
    ["unknown catalog field", (value) => { value.catalog.actualKindOwners = {}; }, /Skill catalog fields mismatch/],
    ["wrong format", (value) => { value.catalog.format = "cineweave-skill-catalog/v2"; }, /format must be/],
    ["unknown identity", (value) => { value.catalog.skills["cineweave-extra"] = { enabled: false }; }, /skills fields mismatch/],
    ["missing identity", (value) => { delete value.catalog.skills[REVIEW]; }, /skills fields mismatch/],
    ["unknown skill field", (value) => { value.catalog.skills[PLATFORM].sourceRoot = "outside"; }, /fields mismatch/],
    ["non boolean", (value) => { value.catalog.skills[PLATFORM].enabled = "false"; }, /enabled must be boolean/],
    ["disabled director", (value) => { value.catalog.skills[DIRECTOR].enabled = false; }, /must always be enabled/],
    ["reference before platform", (value) => { value.catalog.skills[REFERENCE].enabled = true; }, /requires cineweave-platform/],
    ["review before reference", (value) => { value.catalog.skills[PLATFORM].enabled = true; value.catalog.skills[REVIEW].enabled = true; }, /requires cineweave-platform and cineweave-reference/],
    ["review before platform", (value) => { value.catalog.skills[REVIEW].enabled = true; }, /requires cineweave-platform and cineweave-reference/],
    ["missing kind", (value) => { delete value.catalog.targetKindOwners[PROJECTION]; }, /Catalog target root kinds mismatch.*missing/],
    ["unknown kind", (value) => { value.catalog.targetKindOwners.unknown = DIRECTOR; }, /Catalog target root kinds mismatch.*extra/],
    ["unknown owner", (value) => { value.catalog.targetKindOwners[PROJECTION] = "cineweave-extra"; }, /Unknown target Skill owner/],
    ["wrong projection owner", (value) => { value.catalog.targetKindOwners[PROJECTION] = DIRECTOR; }, /Target Skill owner.*must be cineweave-platform/],
    ["wrong prompt owner", (value) => { value.catalog.targetKindOwners.cineweave_codex_prompt_record = PLATFORM; }, /Target Skill owner.*must be cineweave-director/],
    ["wrong production owner", (value) => { value.catalog.targetKindOwners[contracts.routes.production_plan.produces[0]] = PLATFORM; }, /Target Skill owner.*must be cineweave-director/],
    ["wrong reference owner", (value) => { value.catalog.targetKindOwners[contracts.routes.reference_evidence.produces[0]] = DIRECTOR; }, /Target Skill owner.*must be cineweave-reference/],
    ["wrong review owner", (value) => { value.catalog.targetKindOwners[contracts.routes.review_repair.produces[0]] = DIRECTOR; }, /Target Skill owner.*must be cineweave-review/],
  ];
  for (const [label, mutate, error] of cases) {
    await t.test(label, () => {
      const value = fixture();
      mutate(value);
      assert.throws(() => validateSkillCatalog(value.catalog, value), error);
    });
  }
});

test("catalog requires unique and consistent roots across canonical routes and index", async (t) => {
  const cases = [
    ["wrong namespace", (value) => { value.index.skill = PLATFORM; }, /protocol namespace/],
    ["missing root", (value) => { value.contracts.contractKinds.pop(); }, /exactly 52 root kinds/],
    ["duplicate root", (value) => { value.contracts.contractKinds[0] = value.contracts.contractKinds[1]; }, /contains duplicates/],
    ["unknown route", (value) => { value.contracts.routes.other = value.contracts.routes.story; }, /contracts.routes fields mismatch/],
    ["duplicate route owner", (value) => { value.contracts.routes.story.produces.push(value.contracts.routes.brief_world.produces[0]); }, /owned by multiple routes/],
    ["unrouted kind", (value) => { value.contracts.routes.story.produces.pop(); }, /Route-produced root kinds mismatch/],
    ["unknown produced kind", (value) => { value.contracts.routes.story.produces.push("unknown"); }, /Route-produced root kinds mismatch/],
    ["wrong lifecycle route", (value) => { value.lifecycle.contextCatalog.route.pop(); }, /Lifecycle routes mismatch/],
    ["duplicate index kind", (value) => { value.index.contracts[0] = clone(value.index.contracts[1]); }, /Index root kinds contains duplicates/],
    ["missing index kind", (value) => { value.index.contracts.pop(); }, /Index root kinds mismatch/],
    ["unknown index kind", (value) => { value.index.contracts[0].kind = "unknown"; }, /Index domain does not match route owner/],
    ["wrong index domain", (value) => { value.index.contracts[0].domain = "story"; }, /Index domain does not match route owner/],
    ["support role as root", (value) => { value.index.contracts[0].role = "support"; }, /must have role root/],
  ];
  for (const [label, mutate, error] of cases) {
    await t.test(label, () => {
      const value = fixture();
      mutate(value);
      assert.throws(() => validateSkillCatalog(value.catalog, value), error);
    });
  }
});

test("strict catalog loading rejects duplicate JSON keys at every catalog level", async (t) => {
  const serialized = JSON.stringify(catalog);
  const cases = [
    ["top level", serialized.replace('"format":', '"format":"shadow","format":')],
    ["skill identity", serialized.replace('"skills":{', `"skills":{"${DIRECTOR}":{"enabled":false},`)],
    ["enabled flag", serialized.replace('"enabled":true', '"enabled":false,"enabled":true')],
    ["kind owner", serialized.replace('"targetKindOwners":{', `"targetKindOwners":{"${PROJECTION}":"${DIRECTOR}",`)],
  ];
  for (const [label, text] of cases) {
    await t.test(label, async (child) => {
      const source = await temporarySource(child, text);
      await assert.rejects(() => loadSkillCatalog(source), /Duplicate object key/);
    });
  }
});

test("temporary catalogs load exact identities and reject filesystem-controlled catalog fields", async (t) => {
  const source = await temporarySource(t);
  assert.deepEqual(clone(await loadSkillCatalog(source)), catalog);
  const changed = clone(catalog);
  changed.skills[PLATFORM].root = "../../outside";
  await writeFile(join(source, "skill-catalog.json"), JSON.stringify(changed), "utf8");
  await assert.rejects(() => loadSkillCatalog(source), /fields mismatch/);
});

test("P1 plugin contains 166 reviewed files; director leaf contains 165 files", () => {
  const value = fixture();
  const plugin = plan(value);
  assert.equal(plugin.files.length, 166);
  assert.equal(plugin.sourceFiles.length, 166);
  assert.deepEqual(plugin.files, value.files);
  assert.deepEqual(plugin.exports.map((entry) => entry.source), value.files);
  assert.ok(plugin.exports.every((entry) => entry.source === entry.destination));
  assert.deepEqual(plugin.skills.map((skill) => skill.name), [DIRECTOR]);
  assert.equal(plugin.skills[0].files.length, 164);
  assert.equal(plugin.skills[0].root, CORE);
  assert.equal(plugin.skills[0].sourceRoot, CORE);
  assert.equal(plugin.skills[0].destinationRoot, CORE);
  assert.equal(plugin.skills[0].actualKinds.length, 52);
  assert.equal(plugin.skills[0].targetKinds.length, 43);

  const leaf = plan(value, { type: "skill", name: DIRECTOR });
  assert.equal(leaf.files.length, 165);
  assert.equal(leaf.sourceFiles.length, 165);
  assert.equal(leaf.skills[0].root, ".");
  assert.equal(leaf.skills[0].destinationRoot, ".");
  assert.ok(leaf.files.includes("SKILL.md") && leaf.files.includes("LICENSE"));
  assert.ok(!leaf.files.includes(".codex-plugin/plugin.json"));
  assert.ok(leaf.files.every((path) => !path.startsWith("skills/")));
  assert.deepEqual(leaf.skills[0].files, sort(value.files.filter((path) => path.startsWith(`${CORE}/`)).map((path) => path.slice(CORE.length + 1))));
});

test("enabled specialists reuse all 164 core files and replace only their two authoring surfaces", async (t) => {
  for (let stage = 2; stage <= 4; stage += 1) {
    await t.test(`stage ${stage}`, () => {
      const value = fixture(stage);
      const exported = plan(value);
      assert.equal(exported.files.length, 2 + 164 * stage);
      assert.equal(exported.sourceFiles.length, 166 + 2 * (stage - 1));
      assert.equal(exported.exports.length, exported.files.length, "one source may have several destinations");
      assert.deepEqual(exported.skills.map((skill) => skill.name), NAMES.slice(0, stage));
      for (const skill of exported.skills) {
        assert.equal(skill.files.length, 164);
        assert.equal(skill.exports.length, 164);
        assert.equal(skill.sourceRoot, skill.name === DIRECTOR ? CORE : `skill-sources/${skill.name}`);
        for (const key of ["contracts", "lifecycle", "index"]) assert.equal(skill[key], value[key]);
        assert.deepEqual(skill.actualKinds, contracts.contractKinds.filter((kind) => {
          const target = catalog.targetKindOwners[kind];
          return (NAMES.slice(0, stage).includes(target) ? target : DIRECTOR) === skill.name;
        }));
        assert.deepEqual(skill.targetKinds, contracts.contractKinds.filter((kind) => catalog.targetKindOwners[kind] === skill.name));
        for (const entry of skill.exports) {
          const local = entry.destination.slice(skill.destinationRoot.length + 1);
          const ownEntry = skill.name !== DIRECTOR && ["SKILL.md", "agents/openai.yaml"].includes(local);
          assert.equal(entry.source, `${ownEntry ? skill.sourceRoot : CORE}/${local}`);
        }
        const leaf = plan(value, { type: "skill", name: skill.name });
        assert.equal(leaf.files.length, 165);
        assert.deepEqual(leaf.exports, sort([...skill.exports.map((entry) => entry.destination.slice(skill.destinationRoot.length + 1)), "LICENSE"]).map((destination) => ({
          source: destination === "LICENSE" ? "LICENSE" : skill.exports.find((entry) => entry.destination === `${skill.destinationRoot}/${destination}`).source,
          destination,
        })));
      }
    });
  }
});

test("export plan does not discover or create authoring roots from disk", async (t) => {
  const value = fixture(2);
  const source = await temporarySource(t, JSON.stringify(value.catalog));
  await mkdir(join(source, "skills", "cineweave-extra"), { recursive: true });
  await writeFile(join(source, "skills", "cineweave-extra", "rogue.md"), "must not export", "utf8");
  const model = validateSkillCatalog(await loadSkillCatalog(source), value);
  const exported = createSkillExportPlan(source, model, value);
  assert.equal(exported.files.length, 330);
  assert.ok(exported.sourceFiles.includes(`skill-sources/${PLATFORM}/SKILL.md`));
  assert.ok(!exported.files.some((path) => path.includes("cineweave-extra")));
  assert.deepEqual(sort(await readdir(source)), ["skill-catalog.json", "skills"]);
  await assert.rejects(() => readdir(join(source, "skill-sources")), /ENOENT/);
});

test("export targets are explicit and disabled leaves cannot be built", async (t) => {
  const cases = [
    ["disabled platform", { type: "skill", name: PLATFORM }, /Leaf Skill is disabled/],
    ["disabled reference", { type: "skill", name: REFERENCE }, /Leaf Skill is disabled/],
    ["disabled review", { type: "skill", name: REVIEW }, /Leaf Skill is disabled/],
    ["unknown name", { type: "skill", name: "cineweave-extra" }, /Unknown leaf Skill/],
    ["missing leaf name", { type: "skill" }, /Export target fields mismatch/],
    ["unknown target type", { type: "directory", name: DIRECTOR }, /Unknown export target type/],
    ["extra plugin root", { type: "plugin", root: "outside" }, /Export target fields mismatch/],
    ["extra leaf root", { type: "skill", name: DIRECTOR, root: "outside" }, /Export target fields mismatch/],
  ];
  for (const [label, target, error] of cases) await t.test(label, () => assert.throws(() => plan(fixture(), target), error));
});

test("unreviewed, missing, duplicate, and colliding canonical inventory paths fail before export", async (t) => {
  const cases = [
    ["extra file", (value) => { value.files.push(`${CORE}/references/rogue.md`); }, /Canonical profile files mismatch.*extra/],
    ["missing helper", (value) => { value.files = value.files.filter((path) => path !== `${CORE}/scripts/check-audio-returns.mjs`); }, /Canonical profile files mismatch.*missing/],
    ["duplicate destination", (value) => { value.files.push(value.files[0]); }, /contains duplicate paths/],
    ["file case collision", (value) => { value.files.push(`${CORE}/skill.md`); }, /case-colliding path/],
    ["directory case collision", (value) => { value.files.push(`${CORE}/References/other.md`); }, /case-colliding path/],
    ["file directory collision", (value) => { value.files.push("LICENSE/extra.md"); }, /file\/directory collision/],
    ["absolute path", (value) => { value.files.push("/outside/extra.md"); }, /must be relative/],
    ["parent escape", (value) => { value.files.push("../outside.md"); }, /not normalized or escapes/],
    ["non normalized path", (value) => { value.files.push(`${CORE}/references/../extra.md`); }, /not normalized or escapes/],
    ["Windows separators", (value) => { value.files.push("skills\\outside.md"); }, /safe forward-slash paths/],
    ["Windows drive", (value) => { value.files.push("C:/outside.md"); }, /safe forward-slash paths|must be relative/],
    ["Windows reserved name", (value) => { value.files.push(`${CORE}/references/CON.md`); }, /unsafe Windows path segment/],
    ["trailing dot", (value) => { value.files.push(`${CORE}/references/name./extra.md`); }, /unsafe Windows path segment/],
    ["alternate stream", (value) => { value.files.push(`${CORE}/references/file.md:stream`); }, /safe forward-slash paths/],
  ];
  for (const [label, mutate, error] of cases) {
    await t.test(label, () => {
      const value = fixture();
      mutate(value);
      assert.throws(() => plan(value), error);
    });
  }
});

test("manifest paths and resource counts cannot silently expand or shrink the shared profile", async (t) => {
  const cases = [
    ["missing reference", (value) => { value.lifecycle.references.pop(); }, /exactly 47 references/],
    ["extra reference", (value) => { value.lifecycle.references.push({ path: "references/extra.md" }); }, /exactly 47 references/],
    ["missing support schema", (value) => { value.index.supportSchemas.pop(); }, /exactly 2 support schemas/],
    ["duplicate reference", (value) => { value.lifecycle.references[0].path = value.lifecycle.references[1].path; }, /contains duplicate paths/],
    ["duplicate schema", (value) => { value.index.contracts[0].schema = value.index.contracts[1].schema; }, /contains duplicate paths/],
    ["duplicate example", (value) => { value.index.contracts[0].example = value.index.contracts[1].example; }, /contains duplicate paths/],
    ["reference escape", (value) => { value.lifecycle.references[0].path = "../outside.md"; }, /not normalized or escapes/],
    ["schema escape", (value) => { value.index.contracts[0].schema = "schemas/../../outside.json"; }, /not normalized or escapes/],
    ["example escape", (value) => { value.index.contracts[0].example = "../outside.json"; }, /not normalized or escapes/],
    ["reference extension", (value) => { value.lifecycle.references[0].path = "references/other.json"; }, /must be Markdown/],
    ["schema directory", (value) => { value.index.contracts[0].schema = "examples/wrong.json"; }, /schema must be under schemas/],
    ["example directory", (value) => { value.index.contracts[0].example = "schemas/wrong.json"; }, /example must be under examples/],
    ["reference case collision", (value) => { value.lifecycle.references[0].path = value.lifecycle.references[1].path.toUpperCase().replace(/^REFERENCES/, "references").replace(/\.MD$/, ".md"); }, /case-colliding path/],
  ];
  for (const [label, mutate, error] of cases) {
    await t.test(label, () => {
      const value = fixture();
      mutate(value);
      // Keep the caller inventory fixed so the plan validates manifest paths
      // independently, rather than trusting matching malformed declarations.
      assert.throws(() => plan(value), error);
    });
  }
});

test("owner resolution and plans reject forged derived maps or a second canonical authority", () => {
  const value = fixture();
  const model = validateSkillCatalog(value.catalog, value);
  assert.throws(() => resolveImplementationOwner(model, "unknown"), /Unknown root kind/);
  assert.throws(() => resolveImplementationOwner(model, "toString"), /Unknown root kind/);
  for (const key of ["enabledSkills", "targetKindOwners", "actualKindOwners"]) {
    const forged = clone(model);
    if (key === "enabledSkills") forged[key].push(PLATFORM);
    else forged[key][PROJECTION] = REVIEW;
    assert.throws(() => resolveImplementationOwner(forged, PROJECTION), /does not match its catalog/);
    assert.throws(() => createSkillExportPlan(ROOT, forged, value), /does not match its catalog/);
  }
  for (const key of ["contracts", "lifecycle", "index"]) {
    const conflicting = clone(value);
    conflicting[key].skillVersion = "conflicting-authority";
    assert.throws(() => createSkillExportPlan(ROOT, model, conflicting), /does not match catalog authority/);
  }
});
