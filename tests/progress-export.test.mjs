import assert from "node:assert/strict";
import progressExport from "../src/core/progress-export.js";

const { buildProgressExportJson, parseProgressImportJson } = progressExport;

const appState = {
  version: 2,
  activeMaterialId: "grade8",
  materialStates: {
    grade8: {
      version: 1,
      wrongBook: {
        "2026-06-24": [{ word: "chemical", correct: "化学品" }],
      },
      wordStates: {
        chemical: { introducedDate: "2026-06-24" },
      },
    },
  },
};

const json = buildProgressExportJson(appState);
assert.deepEqual(JSON.parse(json), appState);
assert.equal(json.charCodeAt(0), "{".charCodeAt(0));
assert.deepEqual(parseProgressImportJson(`\uFEFF  ${json}\n`), appState);

console.log("progress export tests passed");
