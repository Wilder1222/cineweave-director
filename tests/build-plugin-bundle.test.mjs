import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSafeBuildRoot } from "../scripts/build-plugin-bundle.mjs";

test("bundle output cannot traverse an intermediate symlink or junction", async () => {
  const root = await mkdtemp(join(tmpdir(), "cineweave-build-safety-"));
  const buildRoot = join(root, ".build");
  const outsideRoot = join(root, "outside");
  const victimRoot = join(outsideRoot, "victim");
  const sentinelPath = join(victimRoot, "sentinel.txt");

  try {
    await mkdir(buildRoot, { recursive: true });
    await mkdir(victimRoot, { recursive: true });
    await writeFile(sentinelPath, "keep", "utf8");

    await assert.doesNotReject(() =>
      assertSafeBuildRoot(buildRoot, join(buildRoot, "cineweave-director")),
    );

    await symlink(
      outsideRoot,
      join(buildRoot, "redirect"),
      process.platform === "win32" ? "junction" : "dir",
    );

    await assert.rejects(
      () => assertSafeBuildRoot(buildRoot, join(buildRoot, "redirect", "victim")),
      /direct child directory of \.build/,
    );
    assert.equal(await readFile(sentinelPath, "utf8"), "keep");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
