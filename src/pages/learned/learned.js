// 学习记录页
var app = getApp();
var wordForms = require("../../utils/word-forms");

Page({
  data: {
    summary: "",
    groups: [],
    // 弹窗
    dialogVisible: false,
    dialogWord: "",
    dialogContent: [],
  },

  onLoad: function () { this.renderBook(); },
  onShow: function () { this.renderBook(); },

  renderBook: function () {
    if (!getApp().ensureReady()) return;
    var g = app.globalData;
    var state = g.state;
    var words = g.words || g.baseWords;
    var wordById = new Map(words.map(function (w) { return [w.id, w]; }));
    var groups = [];

    // 新词
    var newByDate = {};
    var wsEntries = Object.entries(state.wordStates || {});
    for (var i = 0; i < wsEntries.length; i++) {
      var entry = wsEntries[i];
      var wordId = entry[0], wordState = entry[1];
      if (!wordById.has(wordId)) continue;
      var date = wordState.introducedDate;
      if (!date) continue;
      if (!newByDate[date]) newByDate[date] = [];
      newByDate[date].push(wordById.get(wordId));
    }

    // 复习
    var reviewByDate = {};
    var rhEntries = Object.entries(state.reviewHistory || {});
    for (var r = 0; r < rhEntries.length; r++) {
      var date = rhEntries[r][0], ids = rhEntries[r][1];
      if (!reviewByDate[date]) reviewByDate[date] = [];
      for (var j = 0; j < ids.length; j++) {
        var w = wordById.get(ids[j]);
        if (w) reviewByDate[date].push(w);
      }
    }

    // 合并并排序
    var allDates = new Set();
    var dates;
    for (dates in newByDate) allDates.add(dates);
    for (dates in reviewByDate) allDates.add(dates);
    // 转换 Set 为数组（避免 Array.from 兼容问题）
    var sortedDates = [];
    allDates.forEach(function (d) { sortedDates.push(d); });
    sortedDates.sort().reverse();

    for (var d = 0; d < sortedDates.length; d++) {
      var dateKey = sortedDates[d];
      var studyDay = this.getStudyDay(state, dateKey);
      var nw = (newByDate[dateKey] || []).map(function (w) {
        return { id: w.id, word: w.word, isFormWord: isFW(w, g) };
      });
      var rw = (reviewByDate[dateKey] || []).map(function (w) {
        return { id: w.id, word: w.word, isFormWord: isFW(w, g) };
      });

      groups.push({
        title: "第 " + studyDay + " 天 · " + dateKey + " · 新学 " + nw.length + " · 复习 " + rw.length,
        dateKey: dateKey,
        hasNew: nw.length > 0,
        hasReview: rw.length > 0,
        newWords: nw,
        reviewWords: rw,
      });
    }

    var totalDays = Object.keys(state.completedDates || {}).length;
    var totalLearned = Object.keys(state.wordStates || {}).length;

    this.setData({
      summary: "共学习 " + totalDays + " 天 · 已学 " + totalLearned + " 词",
      groups: groups,
    });
  },

  getStudyDay: function (state, dateKey) {
    var s = state.studySessions && state.studySessions[dateKey];
    if (s && s.studyDay) return s.studyDay;
    var dates = Object.keys(state.completedDates || {}).sort();
    var idx = dates.indexOf(dateKey);
    return idx !== -1 ? idx + 1 : 0;
  },

  /* ========== 单词详情弹窗 ========== */

  onWordTap: function (e) {
    var wordId = e.currentTarget.dataset.id;
    var g = app.globalData;
    var word = (g.words || g.baseWords).find(function (w) { return w.id === wordId; });
    if (!word) return;

    var groups = wordForms.collectWordFormGroups(word, g.baseWords, g.wordFormRelationMap);
    var content = [];

    if (word.phonetic) {
      content.push({ label: "音标", value: word.phonetic });
    }
    if (word.unit) {
      content.push({ label: "单元", value: word.unit });
    }
    var mt = (word.meanings || []).map(function (m) { return m.pos + " " + m.zh; }).join("；");
    content.push({ label: "释义", value: mt });

    if (groups.length > 0) {
      var formItems = [];
      for (var gi = 0; gi < groups.length; gi++) {
        var entries = groups[gi].entries;
        for (var ei = 0; ei < entries.length; ei++) {
          formItems.push(entries[ei].word + " " + entries[ei].pos + " " + entries[ei].zh);
        }
      }
      if (formItems.length > 0) {
        content.push({ label: "词型转换", value: formItems.join("；") });
      }
    }

    wx.vibrateShort({ type: "light" });
    this.setData({
      dialogVisible: true,
      dialogWord: word.word,
      dialogContent: content,
    });
  },

  closeDialog: function () {
    this.setData({ dialogVisible: false });
  },

  noop: function () {},
});

function isFW(word, g) {
  var token = wordForms.cleanWordToken(word.word);
  return g.wordFormWordSet.has(token);
}
