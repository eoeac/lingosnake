import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";

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

function collectJavaScriptFiles(directoryPath) {
  return readdirSync(directoryPath, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) {
      return collectJavaScriptFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

const sourceFiles = [
  resolve(rootDir, "src/app.js"),
  ...collectJavaScriptFiles(resolve(rootDir, "src/pages")),
  ...collectJavaScriptFiles(resolve(rootDir, "src/utils")),
];

for (const sourceFile of sourceFiles) {
  const source = readFileSync(sourceFile, "utf8");
  for (const match of source.matchAll(/require\(\s*["'](\.{1,2}\/[^"']+)["']\s*\)/g)) {
    const request = match[1];
    const targetPath = resolve(dirname(sourceFile), request.endsWith(".js") ? request : `${request}.js`);
    assert.equal(existsSync(targetPath), true, `${sourceFile} requires missing local target ${request}`);
    assert.equal(statSync(targetPath).isFile(), true, `${sourceFile} requires a local file target ${request}`);
  }
}

console.log("repository structure tests passed");
