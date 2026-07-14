// 词型转换关系 — 微信小程序版
function parseWordFormEntries(wordForms) {
  var text = String(wordForms || "").trim();
  if (!text) return [];
  var pattern = /(?:^|\s)([A-Za-z][A-Za-z-]*)\s+((?:n|v|adj|adv|prep|pron|det|conj|num|interj)\.)\s*(.+?)(?=\s+[A-Za-z][A-Za-z-]*\s+(?:n|v|adj|adv|prep|pron|det|conj|num|interj)\.\s*|$)/g;
  var entries = [];
  var match;
  while ((match = pattern.exec(text))) {
    entries.push({
      word: match[1],
      pos: match[2],
      zh: match[3].trim(),
    });
  }
  return entries;
}

function collectWordFormGroups(word, allWords, relationMap) {
  var groups = [];
  var seenSourceIds = new Set();
  addWordFormGroup(groups, seenSourceIds, word);

  var token = cleanWordToken(word && word.word);
  var related = relationMap.get(token) || [];
  for (var _i = 0, related_1 = related; _i < related_1.length; _i++) {
    addWordFormGroup(groups, seenSourceIds, related_1[_i]);
  }

  return groups;
}

function buildWordFormRelationMap(allWords) {
  var knownWords = new Set();
  var wordsList = allWords || [];
  for (var i = 0; i < wordsList.length; i++) {
    var t = cleanWordToken(wordsList[i].word);
    if (t) knownWords.add(t);
  }
  var map = new Map();
  for (var i = 0; i < wordsList.length; i++) {
    var source = wordsList[i];
    if (!source.wordForms) continue;
    var entries = parseWordFormEntries(source.wordForms);
    var tokens = new Set();
    for (var j = 0; j < entries.length; j++) {
      var ct = cleanWordToken(entries[j].word);
      if (ct) tokens.add(ct);
    }
    // 手动遍历 Set（避免 Array.from 兼容问题）
    tokens.forEach(function (token) {
      if (!knownWords.has(token)) return;
      if (!map.has(token)) map.set(token, []);
      map.get(token).push(source);
    });
  }
  return map;
}

function buildWordFormWordSet(allWords, relationMap) {
  var set = new Set();
  var wordsList = allWords || [];
  for (var i = 0; i < wordsList.length; i++) {
    var word = wordsList[i];
    var wordToken = cleanWordToken(word.word);
    if (word.wordForms && wordToken) set.add(wordToken);
  }
  // 手动遍历 Map keys（避免 Array.from 兼容问题）
  relationMap.forEach(function (_, key) {
    set.add(key);
  });
  return set;
}

function cleanWordToken(value) {
  return String(value || "").toLowerCase().replace(/^[*★\s]+/, "").replace(/[^a-z-]/g, "");
}

// ---------- 内部函数 ----------

function addWordFormGroup(groups, seenSourceIds, source) {
  var key = (source && source.id) || cleanWordToken(source && source.word);
  if (!source || !source.wordForms || seenSourceIds.has(key)) return;
  seenSourceIds.add(key);
  groups.push({
    source: source,
    entries: parseWordFormEntries(source.wordForms).filter(function (entry) { return !isDuplicateSourceEntry(source, entry); }),
  });
}

function isDuplicateSourceEntry(source, entry) {
  if (cleanWordToken(source.word) !== cleanWordToken(entry.word)) return false;
  return (source.meanings || []).some(function (meaning) {
    return (
      normalizeMeaningPart(meaning.pos) === normalizeMeaningPart(entry.pos)
      && normalizeMeaningPart(meaning.zh) === normalizeMeaningPart(entry.zh)
    );
  });
}

function normalizeMeaningPart(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

module.exports = {
  parseWordFormEntries: parseWordFormEntries,
  collectWordFormGroups: collectWordFormGroups,
  buildWordFormRelationMap: buildWordFormRelationMap,
  buildWordFormWordSet: buildWordFormWordSet,
  cleanWordToken: cleanWordToken,
};
