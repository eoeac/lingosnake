import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "src/app.json",
  "src/pages/home/home.js",
  "src/assets/app-avatar.png",
  "src/utils/material.js",
  "src/data/generated/materials.js",
];

for (const relativePath of requiredFiles) {
  const filePath = resolve(rootDir, relativePath);
  assert.equal(existsSync(filePath), true, `${relativePath} must exist`);
  assert.equal(statSync(filePath).isFile(), true, `${relativePath} must be a file`);
}

const materialSource = readFileSync(resolve(rootDir, "src/utils/material.js"), "utf8");
assert.match(materialSource, /\.\.\/data\/generated\/materials/);
assert.doesNotMatch(materialSource, /上海初中英语/);
assert.doesNotMatch(materialSource, /vocab-data/);

console.log("repository structure tests passed");
