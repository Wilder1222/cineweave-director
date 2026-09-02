import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const validateReferenceLifecycle = join(repoRoot, "scripts", "validate-reference-lifecycle.mjs");
const directorRoot = join(repoRoot, "skills", "cineweave-director");
const execFileAsync = promisify(execFile);

async function temporarySkill(t, { skillMarkdown, references, catalog }) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-reference-lifecycle-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "references"), { recursive: true });
  await writeFile(join(root, "SKILL.md"), skillMarkdown, "utf8");
  await Promise.all(Object.entries(references).map(([name, content]) => writeFile(join(root, "references", name), content, "utf8")));
  await writeFile(join(root, "reference-lifecycle.json"), JSON.stringify(catalog, null, 2) + "\n", "utf8");
  return root;
}

test("Director reference lifecycle catalog classifies every reference", async () => {
  const result = await execFileAsync(process.execPath, [validateReferenceLifecycle, directorRoot], { cwd: repoRoot });
  assert.match(result.stdout, /Director reference lifecycle passes: 22 routed, 8 archived, 30 total/);
});

test("reference lifecycle rejects an unclassified reference file", async (t) => {
  const root = await temporarySkill(t, {
    skillMarkdown: "Read `references/routed.md` before returning.\n",
    references: { "routed.md": "# Routed\n", "orphan.md": "# Orphan\n" },
    catalog: {
      catalogVersion: "1.0.0",
      skill: "temporary-skill",
      references: [
        { path: "references/routed.md", lifecycle: "routed", loadContexts: ["test"] }
      ]
    }
  });
  await assert.rejects(
    () => execFileAsync(process.execPath, [validateReferenceLifecycle, root], { cwd: repoRoot }),
    (error) => {
      assert.equal(error.code, 2);
      assert.match(error.stderr, /unclassified reference references\/orphan\.md/);
      return true;
    }
  );
});

test("reference lifecycle rejects an archived reference exposed by SKILL.md", async (t) => {
  const root = await temporarySkill(t, {
    skillMarkdown: "Read `references/archived.md` before returning.\n",
    references: { "archived.md": "# Archived\n", "successor.md": "# Successor\n" },
    catalog: {
      catalogVersion: "1.0.0",
      skill: "temporary-skill",
      references: [
        {
          path: "references/archived.md",
          lifecycle: "archived",
          owner: "cineweave-character",
          successorPaths: ["references/successor.md"],
          rationale: "Superseded by the canonical owner guide."
        },
        { path: "references/successor.md", lifecycle: "routed", loadContexts: ["test"] }
      ]
    }
  });
  await assert.rejects(
    () => execFileAsync(process.execPath, [validateReferenceLifecycle, root], { cwd: repoRoot }),
    (error) => {
      assert.equal(error.code, 2);
      assert.match(error.stderr, /archived reference references\/archived\.md is still directly exposed by SKILL.md/);
      return true;
    }
  );
});
