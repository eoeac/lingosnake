import assert from "node:assert/strict";
import wrongExport from "../src/core/wrong-export.js";

const { buildWrongExportCsv } = wrongExport;

const words = [
  {
    id: "w1",
    word: "ability",
    phonetic: "/əˈbɪləti/",
    unit: "U1",
    meanings: [{ pos: "n.", zh: "能力；才能" }],
    wordForms: "able adj. 能够的 unable adj. 不能的",
  },
  {
    id: "w2",
    word: "add",
    phonetic: "/æd/",
    unit: "U1",
    meanings: [{ pos: "v.", zh: "增加" }],
    wordForms: "addition n. 增加；加法",
  },
];

const state = {
  wrongBook: {
    "2026-06-22": [
      {
        wordId: "w1",
        word: "ability",
        questionType: "看中文选英语",
        chosen: "able",
        correct: "ability",
      },
    ],
    "2026-06-24": [
      {
        wordId: "w2",
        word: "add",
        questionType: "看英语选中文",
        chosen: "减少",
        correct: "增加",
      },
    ],
  },
};

const csv = buildWrongExportCsv(state, words);
const lines = csv.trim().split("\n");

assert.equal(lines[0], "日期,单词,音标,单元,词性中文,词型转换,题型,我的选择,正确答案");
assert.match(lines[1], /^2026-06-22,ability,\/əˈbɪləti\/,U1,/);
assert.match(lines[1], /n\. 能力；才能/);
assert.match(lines[1], /able adj\. 能够的 unable adj\. 不能的/);
assert.match(lines[2], /^2026-06-24,add,\/æd\/,U1,/);
assert.match(lines[2], /addition n\. 增加；加法/);
assert.equal(lines.length, 3);

console.log("wrong export tests passed");
