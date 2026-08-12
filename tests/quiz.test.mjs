import assert from "node:assert/strict";
import quiz from "../src/core/quiz.js";

const {
  QUESTION_MODES,
  buildOptionsForWord,
  buildQuestionsForTask,
  canChangeQuestionMode,
  extractWordFormOptions,
  lockQuestionModeForSession,
  unlockQuestionModeAfterSession,
} = quiz;

const word = {
  id: "0001-ability",
  word: "ability",
  phonetic: "/ə'bɪləti/",
  meanings: [{ pos: "n.", zh: "能力，才能，本领" }],
};

{
  const questions = buildQuestionsForTask(word, "new", QUESTION_MODES.ZH_TO_EN);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].type, QUESTION_MODES.ZH_TO_EN);
}

{
  const questions = buildQuestionsForTask(word, "review", QUESTION_MODES.MIXED);
  assert.equal(questions.length, 1);
  assert.equal(questions[0].type, QUESTION_MODES.ZH_TO_EN);
}

{
  const state = { settings: { questionMode: QUESTION_MODES.MIXED } };
  lockQuestionModeForSession(state, "2026-06-22");
  assert.equal(state.activeSession.questionMode, QUESTION_MODES.MIXED);
  assert.equal(canChangeQuestionMode(state, "2026-06-22"), false);
  assert.equal(canChangeQuestionMode(state, "2026-06-23"), false);
  unlockQuestionModeAfterSession(state);
  assert.equal(canChangeQuestionMode(state, "2026-06-22"), true);
}

{
  const allWords = [
    word,
    { id: "0002-able", word: "able", meanings: [{ pos: "adj.", zh: "能够" }] },
    { id: "0003-about", word: "about", meanings: [{ pos: "prep.", zh: "关于" }] },
    { id: "0004-above", word: "above", meanings: [{ pos: "prep.", zh: "在上面" }] },
    { id: "0005-accept", word: "accept", meanings: [{ pos: "v.", zh: "接受" }] },
    { id: "0006-accident", word: "accident", meanings: [{ pos: "n.", zh: "事故" }] },
    { id: "0007-ache", word: "ache", meanings: [{ pos: "n.", zh: "疼痛" }] },
  ];
  const first = buildOptionsForWord(allWords, word, (item) => item.word, () => 0);
  const second = buildOptionsForWord(allWords, word, (item) => item.word, () => 0.99);
  const firstDistractors = first.filter((option) => option !== word.word).sort();
  const secondDistractors = second.filter((option) => option !== word.word).sort();

  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4);
  assert.ok(first.includes(word.word));
  assert.notDeepEqual(firstDistractors, secondDistractors);
}

{
  const target = {
    id: "0001-succeed",
    index: 1,
    word: "succeed",
    wordForms: "success n. 成功 successful adj. 成功的",
    meanings: [{ pos: "v.", zh: "成功；达到目的" }],
  };
  const allWords = [
    target,
    { id: "0002-success", index: 2, word: "success", meanings: [{ pos: "n.", zh: "成功" }] },
    { id: "0003-successful", index: 3, word: "successful", meanings: [{ pos: "adj.", zh: "成功的" }] },
    { id: "0004-fail", index: 4, word: "fail", meanings: [{ pos: "v.", zh: "失败" }] },
    { id: "0005-table", index: 800, word: "table", meanings: [{ pos: "n.", zh: "桌子" }] },
    { id: "0006-rain", index: 900, word: "rain", meanings: [{ pos: "n.", zh: "雨" }] },
  ];
  const meaning = (item) => item.meanings.map((entry) => `${entry.pos} ${entry.zh}`).join("；");
  const options = buildOptionsForWord(allWords, target, meaning, () => 0, { preferDifferentPos: true });
  const closeOptions = ["n. 成功", "adj. 成功的"];

  assert.equal(options.filter((option) => closeOptions.includes(option)).length, 1);
}

{
  const values = extractWordFormOptions("success n. 成功 successful adj. 成功的 successfully adv. 成功地");
  assert.deepEqual(values, ["n. 成功", "adj. 成功的", "adv. 成功地"]);

  const compactValues = extractWordFormOptions("chemical n.化学品 chemical adj.化学的 chemistry n.化学");
  assert.deepEqual(compactValues, ["n. 化学品", "adj. 化学的", "n. 化学"]);

  const target = {
    id: "0001-succeed",
    index: 1,
    word: "succeed",
    wordForms: "success n. 成功 successful adj. 成功的 successfully adv. 成功地",
    meanings: [{ pos: "v.", zh: "成功；达到目的" }],
  };
  const meaning = (item) => item.meanings.map((entry) => `${entry.pos} ${entry.zh}`).join("；");
  const options = buildOptionsForWord([target], target, meaning, () => 0, {
    preferDifferentPos: true,
    extraValues: values,
  });

  assert.equal(options.filter((option) => values.includes(option)).length, 1);
}

{
  const target = {
    id: "0001-succeed",
    index: 1,
    word: "succeed",
    wordForms: "success n. 成功 successful adj. 成功的 successfully adv. 成功地",
    meanings: [{ pos: "v.", zh: "成功；达到目的" }],
  };
  const allWords = [
    target,
    { id: "0002-full", index: 2, word: "full", meanings: [{ pos: "adj.", zh: "满的，充满的" }] },
    { id: "0003-table", index: 3, word: "table", meanings: [{ pos: "n.", zh: "桌子" }] },
    { id: "0004-rain", index: 4, word: "rain", meanings: [{ pos: "n.", zh: "雨" }] },
    { id: "0005-blue", index: 5, word: "blue", meanings: [{ pos: "adj.", zh: "蓝色的" }] },
  ];
  const meaning = (item) => item.meanings.map((entry) => `${entry.pos} ${entry.zh}`).join("；");
  const options = buildOptionsForWord(allWords, target, meaning, () => 0, {
    preferDifferentPos: true,
    extraValues: extractWordFormOptions(target.wordForms),
  });
  const closeOptions = extractWordFormOptions(target.wordForms);

  assert.equal(options.filter((option) => closeOptions.includes(option)).length, 1);
}

console.log("quiz tests passed");
