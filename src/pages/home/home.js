// 小蛇欢乐屋 — 首页
var app = getApp();
var scheduler = require("../../utils/scheduler");
var quiz = require("../../utils/quiz");
var wordOrder = require("../../utils/word-order");
var sessionLock = require("../../utils/session-lock");
var materialUtil = require("../../utils/material");
var progressExport = require("../../utils/progress-export");

Page({
  data: {
    todayLabel: "",
    // 统计
    daysStudied: 0,
    learnedCount: 0,
    remainingCount: 0,
    daysLeft: 0,
    // 设置
    dailyNew: 20,
    dailyReview: 40,
    questionMode: "mixed",
    questionModeIndex: 0,
    orderMode: "a-to-z",
    orderModeIndex: 0,
    settingsLocked: false,
    // 今日任务
    newCount: 0,
    reviewCount: 0,
    backlogCount: 0,
    questionCount: 0,
    canStart: false,
    taskDone: false,
    // 材料
    materials: [],
    activeMaterialIndex: 0,
    activeMaterialName: "",
    materialCards: [],
    // 预览
    learnedSummary: "",
    recentLearnedGroups: [],
    wrongSummary: "",
    recentWrongGroups: [],
    showSettings: false,
  },

  questionModes: [
    { value: "mixed", label: "混合题型" },
    { value: "zh-to-en", label: "看中文选英语" },
    { value: "en-to-zh", label: "看英语选中文" },
    { value: "phonetic-to-en", label: "看音标选单词" },
  ],

  orderModes: [
    { value: "a-to-z", label: "A 到 Z" },
    { value: "z-to-a", label: "Z 到 A" },
    { value: "unit", label: "按单元排序" },
    { value: "unit-u1-u6", label: "U1–U6" },
    { value: "unit-u1-u3", label: "U1–U3" },
    { value: "unit-u4-u6", label: "U4–U6" },
    { value: "unit-u1", label: "仅 U1" },
    { value: "unit-u2", label: "仅 U2" },
    { value: "unit-u3", label: "仅 U3" },
    { value: "unit-u4", label: "仅 U4" },
    { value: "unit-u5", label: "仅 U5" },
    { value: "unit-u6", label: "仅 U6" },
    { value: "random", label: "乱序" },
  ],

  onLoad: function () {
    this.refreshAll();
  },

  onShow: function () {
    this.refreshAll();
  },

  /* ========== 主体刷新 ========== */

  refreshAll: function () {
    if (!getApp().ensureReady()) {
      // 数据未就绪，稍后重试
      var that = this;
      setTimeout(function () { that.refreshAll(); }, 200);
      return;
    }
    var g = app.globalData;
    if (!g.state || !g.activeMaterial) return;

    var state = g.state;
    var settings = state.settings || scheduler.createInitialState().settings;

    // 单词排序
    var words = wordOrder.buildOrderedWords(g.baseWords, state);
    g.words = words;
    wordOrder.syncNextNewIndexForOrder(words, state);

    // 今日计划
    var plan = scheduler.buildTodayPlan(words, state);
    g.plan = plan;

    var settingsLocked = !sessionLock.canEditSessionSettings(state, g.appState);

    // picker 索引
    var qmIndex = this.findIndex(this.questionModes, "value", settings.questionMode);
    var omIndex = this.findIndex(this.orderModes, "value", settings.orderMode);
    var matIndex = this.findMatIndex(g.activeMaterial.id);

    // 预览数据
    var learnedData = this.buildLearnedPreview(words, state);
    var wrongData = this.buildWrongPreview(state);
    var cards = this.buildMaterialCards();

    var canStart = (plan.newWords.length + plan.reviewWords.length) > 0;
    var taskDone = canStart ? false : (plan.completedNewWords.length + plan.completedReviewWords.length) > 0;

    this.setData({
      todayLabel: plan.date + " · 第 " + plan.studyDay + " 天 · " + g.activeMaterial.name,
      daysStudied: plan.studyDay,
      learnedCount: plan.learnedCount,
      remainingCount: plan.remainingNew,
      daysLeft: plan.estimatedDaysLeft,
      dailyNew: settings.dailyNewLimit,
      dailyReview: settings.dailyReviewLimit,
      questionMode: settings.questionMode || "mixed",
      questionModeIndex: qmIndex,
      orderMode: settings.orderMode || "a-to-z",
      orderModeIndex: omIndex,
      settingsLocked: settingsLocked,
      newCount: plan.newWords.length,
      reviewCount: plan.reviewWords.length,
      backlogCount: plan.backlogCount,
      questionCount: plan.newWords.length + plan.reviewWords.length,
      canStart: canStart,
      taskDone: taskDone,
      materials: g.materials,
      activeMaterialIndex: matIndex,
      activeMaterialName: g.activeMaterial.name,
      materialCards: cards,
      questionModes: this.questionModes,
      orderModes: this.orderModes,
      learnedSummary: learnedData.summary,
      recentLearnedGroups: learnedData.groups,
      wrongSummary: wrongData.summary,
      recentWrongGroups: wrongData.groups,
    });
  },

  /* ========== 材料切换 ========== */

  onMaterialChange: function (e) {
    var idx = e.detail.value;
    var materialId = this.data.materials[idx].id;
    if (materialId === app.globalData.activeMaterial.id) return;
    this.switchMaterial(materialId);
  },

  switchMaterial: function (materialId) {
    var g = app.globalData;

    if (g.quizQueue.length > 0 && g.currentQuizIndex < g.quizQueue.length) {
      var that = this;
      wx.showModal({
        title: "切换材料",
        content: "当前有进行中的答题，切换材料会丢失进度，确定吗？",
        success: function (res) {
          if (!res.confirm) { that.refreshAll(); return; }
          that.doSwitch(materialId);
        },
      });
      // 重置picker回当前值
      this.setData({ activeMaterialIndex: this.findMatIndex(g.activeMaterial.id) });
      return;
    }
    this.doSwitch(materialId);
  },

  doSwitch: function (materialId) {
    var g = app.globalData;
    app.saveState();

    var material = g.materials.find(function (m) { return m.id === materialId; }) || g.materials[0];
    var result = materialUtil.applyActiveMaterial(material, g.appState);

    g.activeMaterial = material;
    g.baseWords = result.baseWords;
    g.wordFormRelationMap = result.wordFormRelationMap;
    g.wordFormWordSet = result.wordFormWordSet;
    g.state = result.state;
    g.plan = null;
    g.quizQueue = [];
    g.currentQuizIndex = 0;
    g.currentWordResult = {};

    app.saveState();
    wx.vibrateShort({ type: "light" });
    this.refreshAll();
  },

  onMaterialCardTap: function (e) {
    var materialId = e.currentTarget.dataset.id;
    if (materialId === app.globalData.activeMaterial.id) return;
    this.switchMaterial(materialId);
  },

  toggleSettings: function () {
    this.setData({ showSettings: !this.data.showSettings });
  },

  /* ========== 设置 ========== */

  onDailyNewInput: function (e) {
    this.setData({ dailyNew: e.detail.value });
  },

  onDailyReviewInput: function (e) {
    this.setData({ dailyReview: e.detail.value });
  },

  onQuestionModeChange: function (e) {
    var idx = e.detail.value;
    this.setData({ questionModeIndex: idx, questionMode: this.questionModes[idx].value });
  },

  onOrderModeChange: function (e) {
    var idx = e.detail.value;
    this.setData({ orderModeIndex: idx, orderMode: this.orderModes[idx].value });
  },

  onSaveSettings: function () {
    var g = app.globalData;
    var state = g.state;

    var dailyNew = this.normalizeSettingNumber(this.data.dailyNew, 1, 200, 20);
    var dailyReview = this.normalizeSettingNumber(this.data.dailyReview, 0, 500, 40);

    state.settings.dailyNewLimit = dailyNew;
    state.settings.dailyReviewLimit = dailyReview;
    if (!this.data.settingsLocked) {
      state.settings.questionMode = this.data.questionMode;
      state.settings.orderMode = this.data.orderMode;
      if (this.data.orderMode === "random") {
        wordOrder.ensureOrderState(g.baseWords, state);
      }
    }

    app.saveState();
    wx.vibrateShort({ type: "light" });
    this.setData({ dailyNew: dailyNew, dailyReview: dailyReview });
    wx.showToast({ title: "设置已保存", icon: "success", duration: 1200 });
    this.refreshAll();
  },

  onReset: function () {
    var that = this;
    wx.showModal({
      title: "重置进度",
      content: "确定要重置当前材料的所有学习进度吗？此操作不可撤销！",
      confirmColor: "#DC2626",
      success: function (res) {
        if (res.confirm) {
          var g = app.globalData;
          var newState = scheduler.createInitialState();
          g.appState.materialStates[g.activeMaterial.id] = newState;
          g.state = newState;
          g.plan = null;
          g.quizQueue = [];
          g.currentQuizIndex = 0;
          g.currentWordResult = {};
          app.saveState();
          wx.vibrateShort({ type: "heavy" });
          that.refreshAll();
          wx.showToast({ title: "进度已重置", icon: "success" });
        }
      },
    });
  },

  /* ========== 开始学习 ========== */

  onStart: function () {
    var g = app.globalData;
    var state = g.state;
    var plan = g.plan;

    if (!plan || (plan.newWords.length === 0 && plan.reviewWords.length === 0)) {
      wx.showToast({ title: "今日没有待学习的单词", icon: "none" });
      return;
    }

    var sessionMode = state.settings.questionMode || "mixed";

    // 构建任务列表
    var tasks = [];
    var i;
    for (i = 0; i < plan.newWords.length; i++) {
      tasks.push({ word: plan.newWords[i], taskKind: "new" });
    }
    for (i = 0; i < plan.reviewWords.length; i++) {
      tasks.push({ word: plan.reviewWords[i], taskKind: "review" });
    }

    // 生成题目
    var quizQueue = [];
    for (i = 0; i < tasks.length; i++) {
      var qs = quiz.buildQuestionsForTask(tasks[i].word, tasks[i].taskKind, sessionMode);
      for (var j = 0; j < qs.length; j++) {
        quizQueue.push(qs[j]);
      }
    }

    if (quizQueue.length === 0) {
      wx.showToast({ title: "没有可生成的题目", icon: "none" });
      return;
    }

    // 锁定会话
    quiz.lockQuestionModeForSession(state, plan.date);
    app.saveState();

    // 存全局数据
    g.quizQueue = quizQueue;
    g.currentQuizIndex = 0;
    g.currentWordResult = {};

    wx.vibrateShort({ type: "medium" });
    wx.navigateTo({ url: "/pages/quiz/quiz" });
  },

  /* ========== 导出 / 导入 ========== */

  onExport: function () {
    app.saveState();
    var json = progressExport.buildProgressExportJson(app.globalData.appState);
    wx.setClipboardData({
      data: json,
      success: function () {
        wx.showToast({ title: "进度 JSON 已复制到剪贴板", icon: "none", duration: 2000 });
      },
    });
  },

  onImport: function () {
    var that = this;
    wx.showModal({
      title: "导入进度",
      content: "请先将进度 JSON 复制到剪贴板，然后点击确定",
      success: function (res) {
        if (!res.confirm) return;
        wx.getClipboardData({
          success: function (clip) {
            try {
              var parsed = progressExport.parseProgressImportJson(clip.data);
              var normalized = materialUtil.normalizeAppState(parsed, app.globalData.materials);

              app.globalData.appState = normalized;
              var activeId = normalized.activeMaterialId || app.globalData.materials[0].id;
              var material = app.globalData.materials.find(function (m) { return m.id === activeId; }) || app.globalData.materials[0];
              var result = materialUtil.applyActiveMaterial(material, normalized);

              app.globalData.activeMaterial = material;
              app.globalData.baseWords = result.baseWords;
              app.globalData.wordFormRelationMap = result.wordFormRelationMap;
              app.globalData.wordFormWordSet = result.wordFormWordSet;
              app.globalData.state = result.state;
              app.globalData.plan = null;
              app.globalData.quizQueue = [];
              app.globalData.currentQuizIndex = 0;
              app.globalData.currentWordResult = {};

              app.saveState();
              that.refreshAll();
              wx.showToast({ title: "进度已导入", icon: "success" });
            } catch (e) {
              wx.showToast({ title: "数据格式错误，无法导入", icon: "none" });
            }
          },
          fail: function () {
            wx.showToast({ title: "无法读取剪贴板", icon: "none" });
          },
        });
      },
    });
  },

  /* ========== 导航 ========== */

  goLearned: function () { wx.switchTab({ url: "/pages/learned/learned" }); },
  goWrong: function () { wx.switchTab({ url: "/pages/wrong/wrong" }); },

  /* ========== 辅助函数 ========== */

  findIndex: function (arr, key, value) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i][key] === value) return i;
    }
    return 0;
  },

  findMatIndex: function (materialId) {
    var mats = app.globalData.materials || [];
    for (var i = 0; i < mats.length; i++) {
      if (mats[i].id === materialId) return i;
    }
    return 0;
  },

  normalizeSettingNumber: function (value, min, max, fallback) {
    var text = String(value == null ? "" : value).trim();
    if (text === "") return fallback;
    var number = Number(text);
    if (!isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(number)));
  },

  clamp: function (v, min, max, fallback) {
    if (typeof v !== "number" || isNaN(v)) return fallback;
    return Math.max(min, Math.min(max, v));
  },

  buildMaterialCards: function () {
    var g = app.globalData;
    return g.materials.map(function (m) {
      var ms = g.appState.materialStates[m.id] || scheduler.createInitialState();
      var mw = wordOrder.buildOrderedWords(wordOrder.normalizeWordList(m.words), ms);
      var mp = scheduler.buildTodayPlan(mw, ms);
      return {
        id: m.id,
        name: m.name,
        active: m.id === g.activeMaterial.id,
        studyDay: mp.studyDay,
        learned: mp.learnedCount,
        total: mp.totalWords,
        todayNew: mp.newWords.length,
        todayReview: mp.reviewWords.length,
      };
    });
  },

  buildLearnedPreview: function (words, state) {
    var wordById = new Map(words.map(function (w) { return [w.id, w]; }));
    var groups = [];
    var dates = Object.keys(state.completedDates || {}).sort().reverse().slice(0, 3);

    for (var d = 0; d < dates.length; d++) {
      var dateKey = dates[d];
      var studyDay = this.getStudyDay(state, dateKey);
      var newWords = [];
      var wsEntries = Object.entries(state.wordStates || {});
      for (var i = 0; i < wsEntries.length; i++) {
        var entry = wsEntries[i];
        if (entry[1].introducedDate === dateKey && wordById.has(entry[0])) {
          newWords.push(wordById.get(entry[0]));
        }
      }
      var reviewIds = (state.reviewHistory && state.reviewHistory[dateKey]) || [];
      var reviewWords = [];
      for (var r = 0; r < reviewIds.length; r++) {
        var w = wordById.get(reviewIds[r]);
        if (w) reviewWords.push(w);
      }
      if (newWords.length || reviewWords.length) {
        groups.push({
          date: dateKey,
          title: "第 " + studyDay + " 天 · " + dateKey + " · 新学 " + newWords.length + " · 复习 " + reviewWords.length,
          newWords: newWords.slice(0, 8),
        });
      }
    }

    var totalDays = Object.keys(state.completedDates || {}).length;
    return { summary: "共学习 " + totalDays + " 天", groups: groups };
  },

  buildWrongPreview: function (state) {
    var dates = Object.keys(state.wrongBook || {}).sort().reverse().slice(0, 3);
    var total = 0;
    var allDates = Object.keys(state.wrongBook || {});
    for (var i = 0; i < allDates.length; i++) {
      total += (state.wrongBook[allDates[i]] || []).length;
    }
    var groups = [];
    for (var d = 0; d < dates.length; d++) {
      var items = state.wrongBook[dates[d]] || [];
      var studyDay = this.getStudyDay(state, dates[d]);
      groups.push({
        date: dates[d],
        title: "第 " + studyDay + " 次 · " + dates[d] + " · " + items.length + " 条",
        items: items.slice(0, 5),
      });
    }
    return { summary: "共 " + total + " 条错题", groups: groups };
  },

  getStudyDay: function (state, dateKey) {
    var s = state.studySessions && state.studySessions[dateKey];
    if (s && s.studyDay) return s.studyDay;
    var dates = Object.keys(state.completedDates || {}).sort();
    var idx = dates.indexOf(dateKey);
    return idx !== -1 ? idx + 1 : 0;
  },
});





