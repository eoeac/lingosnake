import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { join } from "node:path";
import { prepareData } from "../scripts/prepare-data.mjs";

const require = createRequire(import.meta.url);

async function withTemporaryRoot(run) {
  const rootDir = await mkdtemp(join(tmpdir(), "lingosnake-prepare-data-"));

  try {
    await run(rootDir);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
}

await withTemporaryRoot(async (rootDir) => {
  const samplePath = join(rootDir, "data", "sample", "materials.json");
  await mkdir(join(rootDir, "data", "sample"), { recursive: true });
  await writeFile(
    samplePath,
    JSON.stringify([
      {
        id: "sample-material",
        name: "Sample Material",
        words: [
          { id: "word-1", word: "bright", meanings: [{ pos: "adj.", zh: "明亮的" }] },
          { id: "word-2", word: "calm", meanings: [{ pos: "adj.", zh: "平静的" }] },
        ],
      },
    ]),
  );

  const result = await prepareData({ rootDir });
  const generated = require(result.outputPath);

  assert.equal(generated.materials[0].id, "sample-material");
  assert.equal(generated.materials[0].words.length, 2);
  assert.equal(result.source, samplePath);
});

await withTemporaryRoot(async (rootDir) => {
  const samplePath = join(rootDir, "data", "sample", "materials.json");
  await mkdir(join(rootDir, "data", "sample"), { recursive: true });
  await writeFile(
    samplePath,
    JSON.stringify([
      {
        id: "duplicate-check",
        name: "Duplicate Check",
        words: [
          { id: "duplicate", word: "first", meanings: [{ pos: "n.", zh: "第一项" }] },
          { id: "duplicate", word: "second", meanings: [{ pos: "n.", zh: "第二项" }] },
        ],
      },
    ]),
  );

  await assert.rejects(
    prepareData({ rootDir }),
    /duplicate word id/i,
  );
});

console.log("prepare data tests passed");
