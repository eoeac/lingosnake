// 错题本页
var app = getApp();
var wordForms = require("../../utils/word-forms");
var wrongExport = require("../../utils/wrong-export");

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
    var wrongBook = state.wrongBook || {};
    var dates = Object.keys(wrongBook).sort().reverse();
    var total = 0;
    var groups = [];

    for (var i = 0; i < dates.length; i++) {
      var items = wrongBook[dates[i]] || [];
      total += items.length;
      var studyDay = this.getStudyDay(state, dates[i]);
      groups.push({
        dateKey: dates[i],
        title: "第 " + studyDay + " 次 · " + dates[i] + " · " + items.length + " 条",
        items: items.map(function (item) {
          return {
            word: item.word,
            wordId: item.wordId,
            chosen: item.chosen || "",
            correct: item.correct || "",
            questionType: item.questionType || "",
          };
        }),
      });
    }

    this.setData({
      summary: "共 " + total + " 条错题记录",
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
    if (word.phonetic) content.push({ label: "音标", value: word.phonetic });
    if (word.unit) content.push({ label: "单元", value: word.unit });
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
      if (formItems.length > 0) content.push({ label: "词型转换", value: formItems.join("；") });
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

  /* ========== CSV 导出 ========== */

  onExportWrong: function () {
    var g = app.globalData;
    var csv = wrongExport.buildWrongExportCsv(g.state, g.baseWords);
    if (!csv || csv.split("\n").length <= 1) {
      wx.showToast({ title: "没有错题可导出", icon: "none" });
      return;
    }
    // BOM 头确保 Excel 打开不乱码
    wx.setClipboardData({
      data: "﻿" + csv,
      success: function () {
        wx.showToast({ title: "错题 CSV 已复制到剪贴板", icon: "none", duration: 2000 });
      },
    });
  },
});
