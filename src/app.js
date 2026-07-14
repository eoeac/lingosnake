// 艾宾浩斯单词学习 — 微信小程序入口
var storage = require("./utils/storage");
var material = require("./utils/material");

App({
  globalData: {
    ready: false,
    appState: null,
    activeMaterial: null,
    materials: [],
    baseWords: [],
    words: [],
    wordFormRelationMap: {},
    wordFormWordSet: {},
    state: null,
    plan: null,
    quizQueue: [],
    currentQuizIndex: 0,
    currentWordResult: {},
  },

  onLaunch: function () {
    this._initData();
  },

  _initData: function () {
    try {
      var matList = material.normalizeMaterials();
      if (!matList || !matList.length) {
        console.error("[App] 没有可用的词汇材料");
        this.globalData.ready = true;
        return;
      }

      var rawState = storage.loadState();
      var appState = material.normalizeAppState(rawState, matList);

      var activeMaterialId = appState.activeMaterialId || matList[0].id;
      var activeMaterial = matList[0];
      for (var i = 0; i < matList.length; i++) {
        if (matList[i].id === activeMaterialId) { activeMaterial = matList[i]; break; }
      }

      var result = material.applyActiveMaterial(activeMaterial, appState);

      this.globalData.materials = matList;
      this.globalData.appState = appState;
      this.globalData.activeMaterial = activeMaterial;
      this.globalData.baseWords = result.baseWords;
      this.globalData.words = result.baseWords;
      this.globalData.wordFormRelationMap = result.wordFormRelationMap;
      this.globalData.wordFormWordSet = result.wordFormWordSet;
      this.globalData.state = result.state;
      this.globalData.ready = true;

      console.log("[App] 初始化完成 — " + matList.length + " 份材料, " + result.baseWords.length + " 个单词");
    } catch (err) {
      console.error("[App] 初始化失败:", err);
      this.globalData.ready = true; // 标记完成，避免无限等待
    }
  },

  /** 供页面调用，确保数据已加载 */
  ensureReady: function () {
    var g = this.globalData;
    if (g.ready && g.state) return true;
    // 如果未初始化，重试
    if (!g.ready) {
      this._initData();
    }
    return !!(g.ready && g.state);
  },

  saveState: function () {
    var g = this.globalData;
    if (!g.activeMaterial || !g.state) return;
    g.appState.activeMaterialId = g.activeMaterial.id;
    g.appState.materialStates[g.activeMaterial.id] = g.state;
    storage.saveState(g.appState);
  },
});
