// 完成页
var app = getApp();
var scheduler = require("../../core/scheduler");

Page({
  data: {
    summaryText: "",
    wrongItems: [],
    correctCount: 0,
    wrongCount: 0,
    hasWrong: false,
  },

  onLoad: function () {
    if (!getApp().ensureReady()) {
      var that = this;
      setTimeout(function () { that.onLoad(); }, 200);
      return;
    }
    var g = app.globalData;
    var state = g.state;
    var todayKey = scheduler.todayDateKey();
    var wrongs = (state.wrongBook && state.wrongBook[todayKey]) || [];

    // 统计今天的正确数
    var plan = g.plan;
    var totalTasks = 0;
    if (plan) {
      totalTasks = plan.newWords.length + plan.reviewWords.length;
    }

    var wrongWordIds = {};
    for (var i = 0; i < wrongs.length; i++) {
      wrongWordIds[wrongs[i].wordId] = true;
    }
    var wrongWordCount = Object.keys(wrongWordIds).length;
    var correctCount = Math.max(0, totalTasks - wrongWordCount);

    this.setData({
      summaryText: "今日完成！共 " + totalTasks + " 词，正确 " + correctCount + "，错题 " + wrongs.length + " 条",
      wrongItems: wrongs.map(function (item) {
        return {
          word: item.word,
          chosen: item.chosen || "",
          correct: item.correct || "",
          questionType: item.questionType || "",
        };
      }),
      correctCount: correctCount,
      wrongCount: wrongs.length,
      hasWrong: wrongs.length > 0,
    });
  },

  onBackHome: function () {
    wx.vibrateShort({ type: "light" });
    wx.switchTab({ url: "/pages/home/home" });
  },
});
