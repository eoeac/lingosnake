// 题目生成和干扰项评分 — 微信小程序版
var QUESTION_MODES = {
  MIXED: "mixed",
  ZH_TO_EN: "zh-to-en",
  EN_TO_ZH: "en-to-zh",
  PHONETIC_TO_EN: "phonetic-to-en",
};

var QUESTION_LABELS = {};
QUESTION_LABELS[QUESTION_MODES.MIXED] = "混合题型";
QUESTION_LABELS[QUESTION_MODES.ZH_TO_EN] = "看中文选英语";
QUESTION_LABELS[QUESTION_MODES.EN_TO_ZH] = "看英语选中文";
QUESTION_LABELS[QUESTION_MODES.PHONETIC_TO_EN] = "看音标选单词";

function buildQuestionsForTask(word, taskKind, questionMode) {
  var modes = questionMode === QUESTION_MODES.MIXED
    ? [QUESTION_MODES.ZH_TO_EN, QUESTION_MODES.EN_TO_ZH, QUESTION_MODES.PHONETIC_TO_EN]
    : [questionMode || QUESTION_MODES.MIXED];

  return modes.map(function (type) {
    return {
      word: word,
      taskKind: taskKind,
      type: type,
      label: QUESTION_LABELS[type],
    };
  });
}

function buildOptionsForWord(allWords, word, getValue, random, config) {
  if (!random) random = Math.random;
  if (!config) config = {};
  var correct = getValue(word);
  var seen = new Set([correct]);
  var extraCandidates = [];
  var candidates = [];

  var extraValues = config.extraValues || [];
  for (var _i = 0, extraValues_1 = extraValues; _i < extraValues_1.length; _i++) {
    var value = extraValues_1[_i];
    if (!value || seen.has(value)) continue;
    seen.add(value);
    extraCandidates.push({ value: value, score: 10 + random() * 1.5 });
  }

  for (var _a = 0, allWords_1 = allWords; _a < allWords_1.length; _a++) {
    var item = allWords_1[_a];
    if (item.id === word.id) continue;
    var value = getValue(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    candidates.push({
      value: value,
      score: scoreCandidate(word, item, correct, value, config) + random() * 1.5,
    });
  }

  extraCandidates.sort(function (a, b) { return b.score - a.score || a.value.localeCompare(b.value, "zh-Hans-CN"); });
  candidates.sort(function (a, b) { return b.score - a.score || a.value.localeCompare(b.value, "zh-Hans-CN"); });
  var poolSize = Math.min(candidates.length, Math.max(8, config.poolSize || 12));
  var selected = [];
  var closeCandidate = extraCandidates[0] || candidates[0];
  if (closeCandidate) selected.push(closeCandidate.value);
  var seedCount = extraCandidates.length
    ? 0
    : Math.min(config.preferDifferentPos ? 3 : 1, candidates.length);
  var pool = candidates.slice(seedCount, poolSize);

  while (selected.length < 3 && pool.length) {
    var span = Math.min(pool.length, Math.max(3, 6 - selected.length));
    var index = Math.floor(random() * span);
    selected.push(pool.splice(index, 1)[0].value);
  }

  return shuffleWithRandom([correct].concat(selected), random);
}

function extractWordFormOptions(wordForms) {
  var text = String(wordForms || "").trim();
  if (!text) return [];
  var pattern = /(?:^|\s)[A-Za-z][A-Za-z-]*\s+((?:n|v|adj|adv|prep|pron|det|conj|num|interj)\.)\s*(.+?)(?=\s+[A-Za-z][A-Za-z-]*\s+(?:n|v|adj|adv|prep|pron|det|conj|num|interj)\.\s*|$)/g;
  var options = [];
  var match;
  while ((match = pattern.exec(text))) {
    options.push(match[1] + " " + match[2].trim());
  }
  return options;
}

function lockQuestionModeForSession(state, dateKey) {
  state.activeSession = {
    date: dateKey,
    questionMode: state.settings.questionMode || QUESTION_MODES.MIXED,
    locked: true,
  };
  return state;
}

function unlockQuestionModeAfterSession(state) {
  state.activeSession = null;
  return state;
}

function canChangeQuestionMode(state) {
  return !(state && state.activeSession && state.activeSession.locked);
}

// ---------- 内部函数 ----------

function scoreCandidate(target, candidate, targetValue, candidateValue, config) {
  var targetWord = normalizeWord(target.word);
  var candidateWord = normalizeWord(candidate.word);
  var targetForms = String(target.wordForms || "");
  var candidateForms = String(candidate.wordForms || "");
  var targetPositions = collectPositions(target);
  var candidatePositions = collectPositions(candidate);
  var score = 0;

  if (hasFormToken(targetForms, candidateWord) || hasFormToken(candidateForms, targetWord)) score += 7;
  if (targetWord.indexOf(candidateWord) === 0 || candidateWord.indexOf(targetWord) === 0) score += 4;
  score += commonPrefixRatio(targetWord, candidateWord) * 5;
  score += Math.max(0, 2 - Math.abs(targetWord.length - candidateWord.length) / 3);
  score += chineseOverlapRatio(targetValue, candidateValue) * 3;

  if (typeof target.index === "number" && typeof candidate.index === "number") {
    score += Math.max(0, 2 - Math.abs(target.index - candidate.index) / 30);
  }

  if (config.preferDifferentPos) {
    if (hasDifferentPosition(targetPositions, candidatePositions)) score += 2.5;
    if (hasSamePosition(targetPositions, candidatePositions)) score += 0.5;
  } else if (hasSamePosition(targetPositions, candidatePositions)) {
    score += 1;
  }

  return score;
}

function normalizeWord(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function hasFormToken(forms, word) {
  if (!word) return false;
  var escaped = String(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var pattern = new RegExp("(^|[^a-z])" + escaped + "([^a-z]|$)", "i");
  return pattern.test(forms);
}

function collectPositions(word) {
  return new Set((word.meanings || []).map(function (meaning) { return normalizePosition(meaning.pos); }).filter(Boolean));
}

function normalizePosition(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function hasSamePosition(a, b) {
  var found = false;
  a.forEach(function (item) { if (b.has(item)) found = true; });
  return found;
}

function hasDifferentPosition(a, b) {
  if (!a.size || !b.size) return false;
  var found = false;
  b.forEach(function (item) { if (!a.has(item)) found = true; });
  return found;
}

function commonPrefixRatio(a, b) {
  var limit = Math.min(a.length, b.length);
  if (!limit) return 0;
  var count = 0;
  while (count < limit && a[count] === b[count]) count += 1;
  return count / limit;
}

function chineseOverlapRatio(a, b) {
  var left = new Set(String(a || "").match(/[一-鿿]/g) || []);
  var right = new Set(String(b || "").match(/[一-鿿]/g) || []);
  if (!left.size || !right.size) return 0;
  var shared = 0;
  left.forEach(function (char) { if (right.has(char)) shared += 1; });
  return shared / Math.min(left.size, right.size);
}

function shuffleWithRandom(items, random) {
  var arr = items.slice();
  for (var i = arr.length - 1; i > 0; i -= 1) {
    var j = Math.floor(random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

module.exports = {
  QUESTION_MODES: QUESTION_MODES,
  QUESTION_LABELS: QUESTION_LABELS,
  buildQuestionsForTask: buildQuestionsForTask,
  buildOptionsForWord: buildOptionsForWord,
  extractWordFormOptions: extractWordFormOptions,
  lockQuestionModeForSession: lockQuestionModeForSession,
  unlockQuestionModeAfterSession: unlockQuestionModeAfterSession,
  canChangeQuestionMode: canChangeQuestionMode,
};
