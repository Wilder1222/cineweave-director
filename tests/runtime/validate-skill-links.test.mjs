import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const validateSkillLinks = join(repoRoot, "scripts", "validate-skill-links.mjs");
const execFileAsync = promisify(execFile);

async function temporarySkill(t, skillMarkdown, references = {}) {
  const root = await mkdtemp(join(tmpdir(), "cineweave-skill-links-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, "SKILL.md"), skillMarkdown, "utf8");
  if (Object.keys(references).length) {
    await mkdir(join(root, "references"), { recursive: true });
    await Promise.all(Object.entries(references).map(([name, content]) => writeFile(join(root, "references", name), content, "utf8")));
  }
  return root;
}

test("skill link validation rejects a missing local file named in an inline code path", async (t) => {
  const root = await temporarySkill(t, "Read `references/missing.md` before returning.");
  await assert.rejects(
    () => execFileAsync(process.execPath, [validateSkillLinks, root], { cwd: repoRoot }),
    (error) => {
      assert.equal(error.code, 2);
      assert.match(error.stderr, /missing local link references\/missing\.md/);
      return true;
    },
  );
});

test("skill link validation accepts an existing local file named in an inline code path", async (t) => {
  const root = await temporarySkill(t, "Read `references/present.md` before returning.", { "present.md": "# Present\n" });
  const result = await execFileAsync(process.execPath, [validateSkillLinks, root], { cwd: repoRoot });
  assert.match(result.stdout, /Validated 2 Markdown files/);
});

test("all project Skill inline paths resolve", async () => {
  const result = await execFileAsync(process.execPath, [validateSkillLinks, "skills"], { cwd: repoRoot });
  assert.match(result.stdout, /Validated \d+ Markdown files/);
});
