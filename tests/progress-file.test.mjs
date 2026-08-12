import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const calls = [];
const fileManager = {
  writeFile(options) {
    calls.push({ type: "write", options });
    options.success();
  },
  readFile(options) {
    calls.push({ type: "read", options });
    options.success({ data: '{"version":2}' });
  },
};

globalThis.wx = {
  env: { USER_DATA_PATH: "wxfile://usr" },
  getFileSystemManager() { return fileManager; },
  shareFileMessage(options) {
    calls.push({ type: "share", options });
    options.success();
  },
  chooseMessageFile(options) {
    calls.push({ type: "choose", options });
    options.success({ tempFiles: [{ path: "wxfile://tmp/progress.json", name: "progress.json" }] });
  },
};

const progressFile = require("../src/utils/progress-file.js");

await new Promise((resolve, reject) => {
  progressFile.shareProgressJson("{}", { success: resolve, fail: reject });
});
assert.equal(calls[0].type, "write");
assert.equal(calls[0].options.filePath, "wxfile://usr/lingosnake-progress.json");
assert.equal(calls[1].type, "share");
assert.equal(calls[1].options.fileName, "lingosnake-progress.json");

const selectedFile = await new Promise((resolve, reject) => {
  progressFile.chooseProgressJson({ success: resolve, fail: reject });
});
const chooseCall = calls.find((call) => call.type === "choose");
assert.deepEqual(chooseCall.options.extension, ["json"]);
assert.equal(selectedFile.path, "wxfile://tmp/progress.json");

const importedText = await new Promise((resolve, reject) => {
  progressFile.readProgressJson(selectedFile.path, { success: resolve, fail: reject });
});
assert.equal(importedText, "{\"version\":2}");

console.log("progress file tests passed");
