import assert from "node:assert/strict";
import wordForms from "../src/core/word-forms.js";

const {
  buildWordFormRelationMap,
  collectWordFormGroups,
  parseWordFormEntries,
} = wordForms;

const words = [
  {
    id: "chemical",
    word: "chemical",
    meanings: [{ pos: "n.", zh: "化学品" }],
    wordForms: "chemical n.化学品 chemical adj.化学的 chemistry n.化学 chemist n.化学家；药剂师",
  },
  {
    id: "chemistry",
    word: "chemistry",
    meanings: [{ pos: "n.", zh: "化学" }],
    wordForms: "",
  },
];

{
  const entries = parseWordFormEntries(words[0].wordForms);
  assert.deepEqual(entries.map((entry) => `${entry.word} ${entry.pos} ${entry.zh}`), [
    "chemical n. 化学品",
    "chemical adj. 化学的",
    "chemistry n. 化学",
    "chemist n. 化学家；药剂师",
  ]);
}

{
  const relationMap = buildWordFormRelationMap(words);
  const groups = collectWordFormGroups(words[0], words, relationMap);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].source.word, "chemical");
  assert.deepEqual(groups[0].entries.map((entry) => `${entry.word} ${entry.pos} ${entry.zh}`), [
    "chemical adj. 化学的",
    "chemistry n. 化学",
    "chemist n. 化学家；药剂师",
  ]);
}

{
  const relationMap = buildWordFormRelationMap(words);
  const groups = collectWordFormGroups(words[1], words, relationMap);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].source.word, "chemical");
  assert.deepEqual(groups[0].entries.map((entry) => entry.word), [
    "chemical",
    "chemistry",
    "chemist",
  ]);
}

console.log("word form tests passed");
