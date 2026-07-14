// 单词排序 — 微信小程序版
var ORDER_MODES = {
  A_TO_Z: "a-to-z",
  Z_TO_A: "z-to-a",
  UNIT: "unit",
  UNIT_U1_U6: "unit-u1-u6",
  UNIT_U1_U3: "unit-u1-u3",
  UNIT_U4_U6: "unit-u4-u6",
  UNIT_U1: "unit-u1",
  UNIT_U2: "unit-u2",
  UNIT_U3: "unit-u3",
  UNIT_U4: "unit-u4",
  UNIT_U5: "unit-u5",
  UNIT_U6: "unit-u6",
  RANDOM: "random",
};

function normalizeWordList(words) {
  return words.map(function (word) {
    return Object.assign({}, word, { word: cleanWord(word.word) });
  });
}

function ensureOrderState(words, state) {
  if (!state.order) state.order = {};
  var ids = words.map(function (word) { return word.id; });
  var sameIds = Array.isArray(state.order.randomIds)
    && state.order.randomIds.length === ids.length
    && new Set(state.order.randomIds).size === ids.length
    && state.order.randomIds.every(function (id) { return ids.indexOf(id) !== -1; });

  if (!sameIds) {
    state.order.randomIds = shuffle(ids);
  }
  return state.order;
}

function buildOrderedWords(words, state) {
  var mode = (state && state.settings && state.settings.orderMode) || ORDER_MODES.A_TO_Z;
  var scopedWords = filterWordsByMode(words, mode);
  var ordered;
  if (mode === ORDER_MODES.Z_TO_A) {
    ordered = scopedWords.slice().sort(compareWords).reverse();
  } else if (mode === ORDER_MODES.UNIT || isUnitScopeMode(mode)) {
    ordered = scopedWords.slice().sort(compareUnitOrder);
  } else if (mode === ORDER_MODES.RANDOM) {
    ensureOrderState(scopedWords, state);
    var byId = new Map(scopedWords.map(function (word) { return [word.id, word]; }));
    ordered = state.order.randomIds.map(function (id) { return byId.get(id); }).filter(Boolean);
  } else {
    ordered = scopedWords.slice().sort(compareWords);
  }
  return ordered.map(function (word, position) { return Object.assign({}, word, { __position: position }); });
}

function syncNextNewIndexForOrder(orderedWords, state) {
  var wordStates = state.wordStates || {};
  var nextIndex = orderedWords.findIndex(function (word) { return !wordStates[word.id]; });
  state.nextNewIndex = nextIndex === -1 ? orderedWords.length : nextIndex;
  return state.nextNewIndex;
}

// ---------- 内部函数 ----------

function compareWords(a, b) {
  var wordCompare = cleanWord(a.word).localeCompare(cleanWord(b.word), "en", { sensitivity: "base" });
  if (wordCompare !== 0) return wordCompare;
  return a.index - b.index;
}

function compareUnitOrder(a, b) {
  var unitCompare = unitNumber(a.unit) - unitNumber(b.unit);
  if (unitCompare !== 0) return unitCompare;
  return (a.index || 0) - (b.index || 0);
}

function filterWordsByMode(words, mode) {
  var allowedUnits = unitsForMode(mode);
  if (!allowedUnits) return words;
  return words.filter(function (word) { return allowedUnits.has(normalizeUnit(word.unit)); });
}

function isUnitScopeMode(mode) {
  return Boolean(unitsForMode(mode));
}

function unitsForMode(mode) {
  if (mode === ORDER_MODES.UNIT_U1_U3) return new Set(["U1", "U2", "U3"]);
  if (mode === ORDER_MODES.UNIT_U1_U6) return new Set(["U1", "U2", "U3", "U4", "U5", "U6"]);
  if (mode === ORDER_MODES.UNIT_U4_U6) return new Set(["U4", "U5", "U6"]);
  var match = String(mode || "").match(/^unit-u([1-6])$/i);
  return match ? new Set(["U" + match[1]]) : null;
}

function normalizeUnit(value) {
  var match = String(value || "").match(/\d+/);
  return match ? "U" + Number(match[0]) : "";
}

function unitNumber(value) {
  var match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function cleanWord(value) {
  return String(value || "").replace(/^[*★\s]+/, "").trim();
}

function shuffle(items) {
  var arr = items.slice();
  for (var i = arr.length - 1; i > 0; i -= 1) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

module.exports = {
  ORDER_MODES: ORDER_MODES,
  normalizeWordList: normalizeWordList,
  ensureOrderState: ensureOrderState,
  buildOrderedWords: buildOrderedWords,
  syncNextNewIndexForOrder: syncNextNewIndexForOrder,
};
