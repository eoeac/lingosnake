// 艾宾浩斯间隔重复调度器 — 微信小程序版
const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

function createInitialState() {
  return {
    version: 1,
    settings: {
      dailyNewLimit: 20,
      dailyReviewLimit: 40,
      questionMode: "mixed",
      orderMode: "a-to-z",
      intervals: REVIEW_INTERVALS,
    },
    nextNewIndex: 0,
    wordStates: {},
    wrongBook: {},
    completedDates: {},
    studySessions: {},
    reviewHistory: {},
    order: {},
  };
}

function normalizeState(state) {
  const base = createInitialState();
  const normalized = {
    ...base,
    ...state,
    settings: { ...base.settings, ...(state && state.settings ? state.settings : {}) },
    wordStates: state && state.wordStates ? state.wordStates : {},
    wrongBook: state && state.wrongBook ? state.wrongBook : {},
    completedDates: state && state.completedDates ? state.completedDates : {},
    studySessions: state && state.studySessions ? state.studySessions : {},
    reviewHistory: state && state.reviewHistory ? state.reviewHistory : {},
    order: state && state.order ? state.order : {},
  };
  migrateWordStudyDays(normalized);
  return normalized;
}

function buildTodayPlan(words, rawState, todayKey) {
  if (!todayKey) todayKey = todayDateKey();
  const state = normalizeState(rawState);
  const studyDay = getStudyDayForDate(state, todayKey);
  const wordById = new Map(words.map(function (word) { return [word.id, word]; }));
  const due = [];

  for (var _i = 0, _a = Object.entries(state.wordStates); _i < _a.length; _i++) {
    var _b = _a[_i], wordId = _b[0], wordState = _b[1];
    if (wordState.done || !wordById.has(wordId)) continue;
    var nextDueStudyDay = getNextDueStudyDay(state, wordState);
    var dueByStudyDay = Number.isFinite(nextDueStudyDay)
      && nextDueStudyDay > 0
      && nextDueStudyDay <= studyDay;
    var dueByLegacyDate = !Number.isFinite(wordState.nextDueStudyDay)
      && wordState.nextDueDate
      && wordState.nextDueDate <= todayKey;
    if (dueByStudyDay || dueByLegacyDate) {
      due.push({
        word: wordById.get(wordId),
        dueDate: wordState.nextDueDate || "",
        dueStudyDay: nextDueStudyDay || 0,
        introducedDate: wordState.introducedDate || "",
      });
    }
  }

  due.sort(function (a, b) {
    if (a.dueStudyDay !== b.dueStudyDay) return a.dueStudyDay - b.dueStudyDay;
    if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    return a.word.index - b.word.index;
  });

  var reviewWords = due.slice(0, state.settings.dailyReviewLimit).map(function (item) { return item.word; });
  var completedNewWords = [];
  var completedReviewWords = [];
  for (var _c = 0, words_1 = words; _c < words_1.length; _c++) {
    var word = words_1[_c];
    var wordState = state.wordStates[word.id];
    if (!wordState || getLastSeenStudyDay(state, wordState) !== studyDay) continue;
    if (getIntroducedStudyDay(state, wordState) === studyDay) {
      completedNewWords.push(word);
    } else {
      completedReviewWords.push(word);
    }
  }
  var introducedToday = words
    .filter(function (word) {
      var wordState = state.wordStates[word.id];
      return wordState && getIntroducedStudyDay(state, wordState) === studyDay;
    })
    .length;
  var remainingNewToday = Math.max(0, state.settings.dailyNewLimit - introducedToday);
  var newWords = [];
  var cursor = state.nextNewIndex || 0;
  while (newWords.length < remainingNewToday && cursor < words.length) {
    var word = words[cursor];
    var wordState = state.wordStates[word.id];
    if (!wordState) newWords.push(word);
    cursor += 1;
  }

  var learnedCount = words.filter(function (word) { return state.wordStates[word.id]; }).length;
  var remainingNew = words.filter(function (word) { return !state.wordStates[word.id]; }).length;
  var estimatedDaysLeft = state.settings.dailyNewLimit > 0
    ? Math.ceil(remainingNew / state.settings.dailyNewLimit)
    : 0;

  return {
    date: todayKey,
    studyDay: studyDay,
    newWords: newWords,
    reviewWords: reviewWords,
    completedNewWords: completedNewWords,
    completedReviewWords: completedReviewWords,
    backlogCount: Math.max(0, due.length - reviewWords.length),
    learnedCount: learnedCount,
    remainingNew: remainingNew,
    estimatedDaysLeft: estimatedDaysLeft,
    totalWords: words.length,
  };
}

function completeWordTask(rawState, word, dateKey, hadWrong) {
  var state = normalizeState(rawState);
  var studyDay = getStudyDayForDate(state, dateKey);
  var existing = state.wordStates[word.id];
  var isNew = !existing;
  var intervalIndex = isNew ? 0 : Math.min((existing.intervalIndex || 0) + 1, state.settings.intervals.length);
  var done = intervalIndex >= state.settings.intervals.length;
  var nextDueStudyDay = done ? 0 : studyDay + state.settings.intervals[intervalIndex];
  var nextDueDate = done ? "" : dateKeyFromOffset(dateKey, state.settings.intervals[intervalIndex]);

  state.wordStates[word.id] = {
    introducedDate: existing && existing.introducedDate ? existing.introducedDate : dateKey,
    introducedStudyDay: existing && existing.introducedStudyDay ? existing.introducedStudyDay : studyDay,
    lastSeenDate: dateKey,
    lastSeenStudyDay: studyDay,
    intervalIndex: intervalIndex,
    nextDueDate: nextDueDate,
    nextDueStudyDay: nextDueStudyDay,
    wrongCount: (existing && existing.wrongCount ? existing.wrongCount : 0) + (hadWrong ? 1 : 0),
    done: done,
  };

  if (isNew) {
    var wordPosition = Number.isFinite(word.__position) ? word.__position + 1 : word.index;
    state.nextNewIndex = Math.max(state.nextNewIndex || 0, wordPosition);
  } else {
    if (!state.reviewHistory[dateKey]) state.reviewHistory[dateKey] = [];
    if (state.reviewHistory[dateKey].indexOf(word.id) === -1) state.reviewHistory[dateKey].push(word.id);
  }

  state.completedDates[dateKey] = true;
  state.studySessions[dateKey] = {
    studyDay: studyDay,
    completed: true,
  };
  return state;
}

function recordWrong(rawState, dateKey, word, questionType, chosen, correct) {
  var state = normalizeState(rawState);
  if (!state.wrongBook[dateKey]) state.wrongBook[dateKey] = [];
  state.wrongBook[dateKey].push({
    wordId: word.id,
    word: word.word,
    phonetic: word.phonetic,
    meanings: word.meanings,
    wordForms: word.wordForms,
    questionType: questionType,
    chosen: chosen,
    correct: correct,
    time: new Date().toISOString(),
  });
  return state;
}

function todayDateKey() {
  var date = new Date();
  return localDateKey(date);
}

function dateKeyFromOffset(dateKey, offset) {
  var parts = dateKey.split("-").map(Number);
  var date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function localDateKey(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function getStudyDayForDate(state, dateKey) {
  var session = state.studySessions && state.studySessions[dateKey];
  if (session && session.studyDay) return session.studyDay;

  var completedDates = Object.keys(state.completedDates || {}).sort();
  var existingDateIndex = completedDates.indexOf(dateKey);
  if (existingDateIndex !== -1) return existingDateIndex + 1;

  var sessionDays = Object.values(state.studySessions || {})
    .map(function (item) { return item.studyDay; })
    .filter(Number.isFinite);
  var sessionCount = sessionDays.length ? Math.max.apply(Math, sessionDays) : completedDates.length;
  return sessionCount + 1;
}

function getIntroducedStudyDay(state, wordState) {
  if (Number.isFinite(wordState.introducedStudyDay)) return wordState.introducedStudyDay;
  return getRecordedStudyDayForDate(state, wordState.introducedDate);
}

function getLastSeenStudyDay(state, wordState) {
  if (Number.isFinite(wordState.lastSeenStudyDay)) return wordState.lastSeenStudyDay;
  return getRecordedStudyDayForDate(state, wordState.lastSeenDate) || getIntroducedStudyDay(state, wordState);
}

function getNextDueStudyDay(state, wordState) {
  if (Number.isFinite(wordState.nextDueStudyDay)) return wordState.nextDueStudyDay;
  var lastSeenStudyDay = getLastSeenStudyDay(state, wordState);
  var interval = state.settings.intervals[wordState.intervalIndex || 0] || 0;
  return lastSeenStudyDay ? lastSeenStudyDay + interval : 0;
}

function getRecordedStudyDayForDate(state, dateKey) {
  if (!dateKey) return 0;
  var session = state.studySessions && state.studySessions[dateKey];
  if (session && session.studyDay) return session.studyDay;
  var completedDates = Object.keys(state.completedDates || {}).sort();
  var index = completedDates.indexOf(dateKey);
  return index === -1 ? 0 : index + 1;
}

function migrateWordStudyDays(state) {
  var wordStates = state.wordStates || {};
  for (var _i = 0, _a = Object.values(wordStates); _i < _a.length; _i++) {
    var wordState = _a[_i];
    if (!Number.isFinite(wordState.introducedStudyDay)) {
      wordState.introducedStudyDay = getRecordedStudyDayForDate(state, wordState.introducedDate);
    }
    if (!Number.isFinite(wordState.lastSeenStudyDay)) {
      wordState.lastSeenStudyDay = getRecordedStudyDayForDate(state, wordState.lastSeenDate) || wordState.introducedStudyDay;
    }
    if (!wordState.done && !Number.isFinite(wordState.nextDueStudyDay)) {
      var interval = state.settings.intervals[wordState.intervalIndex || 0] || 0;
      wordState.nextDueStudyDay = wordState.lastSeenStudyDay ? wordState.lastSeenStudyDay + interval : 0;
    }
  }
}

module.exports = {
  REVIEW_INTERVALS: REVIEW_INTERVALS,
  createInitialState: createInitialState,
  normalizeState: normalizeState,
  buildTodayPlan: buildTodayPlan,
  completeWordTask: completeWordTask,
  recordWrong: recordWrong,
  todayDateKey: todayDateKey,
  dateKeyFromOffset: dateKeyFromOffset,
};
