// 错题 CSV 导出 — 微信小程序版
function buildWrongExportRows(state, words) {
  var wordById = new Map((words || []).map(function (word) { return [word.id, word]; }));
  var rows = [];
  var dates = Object.keys(state && state.wrongBook ? state.wrongBook : {}).sort();

  for (var _i = 0, dates_1 = dates; _i < dates_1.length; _i++) {
    var date = dates_1[_i];
    var items = state.wrongBook[date] || [];
    for (var _a = 0, items_1 = items; _a < items_1.length; _a++) {
      var item = items_1[_a];
      var word = wordById.get(item.wordId) || item;
      rows.push({
        date: date,
        word: word.word || item.word || "",
        phonetic: word.phonetic || "",
        unit: word.unit || "",
        meaning: meaningText(word),
        wordForms: word.wordForms || "",
        questionType: item.questionType || "",
        chosen: item.chosen || "",
        correct: item.correct || "",
      });
    }
  }

  return rows;
}

function buildWrongExportCsv(state, words) {
  var headers = ["日期", "单词", "音标", "单元", "词性中文", "词型转换", "题型", "我的选择", "正确答案"];
  var rows = buildWrongExportRows(state, words).map(function (row) {
    return [
      row.date,
      row.word,
      row.phonetic,
      row.unit,
      row.meaning,
      row.wordForms,
      row.questionType,
      row.chosen,
      row.correct,
    ];
  });
  return [headers].concat(rows).map(function (row) { return row.map(escapeCsvCell).join(","); }).join("\n");
}

function meaningText(word) {
  return (word.meanings || [])
    .map(function (meaning) { return (meaning.pos || "") + " " + (meaning.zh || ""); })
    .filter(function (s) { return s.trim(); })
    .join("；");
}

function escapeCsvCell(value) {
  var text = String(value != null ? value : "");
  if (!/[",\n\r]/.test(text)) return text;
  return "\"" + text.replace(/"/g, "\"\"") + "\"";
}

module.exports = {
  buildWrongExportRows: buildWrongExportRows,
  buildWrongExportCsv: buildWrongExportCsv,
};
