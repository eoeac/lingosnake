import assert from "node:assert/strict";
import scheduler from "../src/core/scheduler.js";

const {
  buildTodayPlan,
  createInitialState,
  completeWordTask,
  dateKeyFromOffset,
} = scheduler;

const words = Array.from({ length: 20 }, (_, i) => ({
  id: `w${i + 1}`,
  index: i + 1,
  word: `word${i + 1}`,
  meanings: [{ pos: "n.", zh: `意思${i + 1}` }],
}));

{
  const state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.settings.dailyReviewLimit = 3;
  const plan = buildTodayPlan(words, state, "2026-06-22");
  assert.equal(plan.newWords.length, 5);
  assert.equal(plan.reviewWords.length, 0);
  assert.deepEqual(plan.newWords.map((w) => w.id), ["w1", "w2", "w3", "w4", "w5"]);
}

{
  const state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.nextNewIndex = 2;
  state.wordStates.w1 = { introducedDate: "2026-06-22", introducedStudyDay: 1 };
  state.wordStates.w10 = { introducedDate: "2026-06-22", introducedStudyDay: 1 };
  const plan = buildTodayPlan(words, state, "2026-06-22");

  assert.equal(plan.learnedCount, 2);
  assert.equal(plan.remainingNew, 18);
  assert.equal(plan.estimatedDaysLeft, 4);
}

{
  let state = createInitialState();
  state.settings.dailyNewLimit = 5;
  const day1 = "2026-06-22";
  for (const word of buildTodayPlan(words, state, day1).newWords) {
    state = completeWordTask(state, word, day1, false);
  }
  const plan = buildTodayPlan(words, state, day1);
  assert.equal(plan.newWords.length, 0);
  assert.equal(plan.completedNewWords.length, 5);
  assert.equal(plan.completedReviewWords.length, 0);
}

{
  const state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.settings.dailyReviewLimit = 2;
  const day1 = "2026-06-22";
  for (const word of buildTodayPlan(words, state, day1).newWords) {
    completeWordTask(state, word, day1, false);
  }
  const day2 = dateKeyFromOffset(day1, 1);
  const plan = buildTodayPlan(words, state, day2);
  assert.equal(plan.studyDay, 2);
  assert.equal(plan.newWords.length, 5);
  assert.equal(plan.reviewWords.length, 2);
  assert.equal(plan.backlogCount, 3);
  assert.deepEqual(plan.reviewWords.map((w) => w.id), ["w1", "w2"]);
}

{
  let state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.settings.dailyReviewLimit = 5;
  const day1 = "2026-06-22";
  for (const word of buildTodayPlan(words, state, day1).newWords) {
    state = completeWordTask(state, word, day1, false);
  }
  const skippedCalendarDay = "2026-06-27";
  const plan = buildTodayPlan(words, state, skippedCalendarDay);
  assert.equal(plan.studyDay, 2);
  assert.equal(plan.newWords.length, 5);
  assert.equal(plan.reviewWords.length, 5);
  assert.deepEqual(plan.reviewWords.map((w) => w.id), ["w1", "w2", "w3", "w4", "w5"]);
}

{
  const day1 = "2026-06-22";
  const day2 = "2026-06-23";
  const state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.settings.dailyReviewLimit = 5;
  state.completedDates[day1] = true;
  state.nextNewIndex = 5;
  for (const word of words.slice(0, 5)) {
    state.wordStates[word.id] = {
      introducedDate: day1,
      lastSeenDate: day1,
      intervalIndex: 0,
      nextDueDate: day2,
      wrongCount: 0,
      done: false,
    };
  }

  const plan = buildTodayPlan(words, state, day2);
  assert.equal(plan.studyDay, 2);
  assert.equal(plan.reviewWords.length, 5);
  assert.deepEqual(plan.reviewWords.map((w) => w.id), ["w1", "w2", "w3", "w4", "w5"]);
}

{
  const day1 = "2026-06-22";
  const actualSecondStudyDay = "2026-06-27";
  const state = createInitialState();
  state.settings.dailyNewLimit = 5;
  state.settings.dailyReviewLimit = 5;
  state.completedDates[day1] = true;
  state.nextNewIndex = 5;
  for (const word of words.slice(0, 5)) {
    state.wordStates[word.id] = {
      introducedDate: day1,
      lastSeenDate: day1,
      intervalIndex: 0,
      nextDueDate: "2026-06-30",
      wrongCount: 0,
      done: false,
    };
  }

  const plan = buildTodayPlan(words, state, actualSecondStudyDay);
  assert.equal(plan.studyDay, 2);
  assert.equal(plan.reviewWords.length, 5);
}

{
  const state = createInitialState();
  state.settings.dailyNewLimit = 3;
  state.settings.dailyReviewLimit = 1;
  const day1 = "2026-06-22";
  for (const word of buildTodayPlan(words, state, day1).newWords) {
    completeWordTask(state, word, day1, false);
  }
  const day2 = dateKeyFromOffset(day1, 1);
  let plan = buildTodayPlan(words, state, day2);
  assert.deepEqual(plan.reviewWords.map((w) => w.id), ["w1"]);
  completeWordTask(state, plan.reviewWords[0], day2, false);
  assert.deepEqual(state.reviewHistory[day2], ["w1"]);
  plan = buildTodayPlan(words, state, day2);
  assert.equal(plan.completedReviewWords.length, 1);
  const day3 = dateKeyFromOffset(day1, 2);
  plan = buildTodayPlan(words, state, day3);
  assert.deepEqual(plan.reviewWords.map((w) => w.id), ["w2"]);
}

console.log("scheduler tests passed");
