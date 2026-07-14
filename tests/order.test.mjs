import assert from "node:assert/strict";
import wordOrder from "../src/core/word-order.js";

const {
  ORDER_MODES,
  buildOrderedWords,
  ensureOrderState,
  normalizeWordList,
  syncNextNewIndexForOrder,
} = wordOrder;

const words = [
  { id: "b", word: "banana", index: 2 },
  { id: "a", word: "apple", index: 1 },
  { id: "c", word: "cat", index: 3 },
];

{
  const state = { settings: { orderMode: ORDER_MODES.A_TO_Z } };
  const ordered = buildOrderedWords(words, state);
  assert.deepEqual(ordered.map((word) => word.word), ["apple", "banana", "cat"]);
  assert.deepEqual(ordered.map((word) => word.__position), [0, 1, 2]);
}

{
  const state = { settings: { orderMode: ORDER_MODES.Z_TO_A } };
  const ordered = buildOrderedWords(words, state);
  assert.deepEqual(ordered.map((word) => word.word), ["cat", "banana", "apple"]);
}

{
  const state = { settings: { orderMode: ORDER_MODES.RANDOM } };
  ensureOrderState(words, state);
  const firstIds = [...state.order.randomIds];
  const first = buildOrderedWords(words, state).map((word) => word.id);
  const second = buildOrderedWords(words, state).map((word) => word.id);
  assert.deepEqual(first, second);
  assert.deepEqual(first.toSorted(), ["a", "b", "c"]);
  assert.deepEqual(state.order.randomIds, firstIds);
}

{
  const unitWords = [
    { id: "u2b", word: "banana", index: 4, unit: "U2" },
    { id: "u1b", word: "zebra", index: 2, unit: "U1" },
    { id: "u1a", word: "apple", index: 1, unit: "U1" },
    { id: "u2a", word: "cat", index: 3, unit: "U2" },
  ];
  const ordered = buildOrderedWords(unitWords, { settings: { orderMode: ORDER_MODES.UNIT } });
  assert.deepEqual(ordered.map((word) => word.id), ["u1a", "u1b", "u2a", "u2b"]);
}

{
  const unitWords = [
    { id: "u1", word: "one", index: 1, unit: "U1" },
    { id: "u2", word: "two", index: 2, unit: "U2" },
    { id: "u3", word: "three", index: 3, unit: "U3" },
    { id: "u4", word: "four", index: 4, unit: "U4" },
    { id: "other", word: "other", index: 5 },
  ];
  const u1ToU6 = buildOrderedWords(unitWords, { settings: { orderMode: ORDER_MODES.UNIT_U1_U6 } });
  const u1ToU3 = buildOrderedWords(unitWords, { settings: { orderMode: ORDER_MODES.UNIT_U1_U3 } });
  const u4 = buildOrderedWords(unitWords, { settings: { orderMode: ORDER_MODES.UNIT_U4 } });
  assert.deepEqual(u1ToU6.map((word) => word.id), ["u1", "u2", "u3", "u4"]);
  assert.deepEqual(u1ToU3.map((word) => word.id), ["u1", "u2", "u3"]);
  assert.deepEqual(u4.map((word) => word.id), ["u4"]);
}

{
  const state = {
    settings: { orderMode: ORDER_MODES.Z_TO_A },
    wordStates: { c: { introducedDate: "2026-06-22" } },
    nextNewIndex: 99,
  };
  const ordered = buildOrderedWords(words, state);
  syncNextNewIndexForOrder(ordered, state);
  assert.equal(state.nextNewIndex, 1);
}

{
  const dirty = [
    { id: "succeed", word: "***succeed", index: 2 },
    { id: "successful", word: "***successful", index: 3 },
    { id: "ability", word: "ability", index: 1 },
  ];
  const cleaned = normalizeWordList(dirty);
  assert.deepEqual(cleaned.map((word) => word.word), ["succeed", "successful", "ability"]);
  const ordered = buildOrderedWords(cleaned, { settings: { orderMode: ORDER_MODES.A_TO_Z } });
  assert.deepEqual(ordered.map((word) => word.word), ["ability", "succeed", "successful"]);
}

console.log("order tests passed");
