// 答题页
var app = getApp();
var scheduler = require("../../core/scheduler");
var quizUtil = require("../../core/quiz");

Page({
  data: {
    quizProgress: "",
    quizStageClass: "",
    quizType: "",
    promptText: "",
    options: [],
    feedbackText: "",
    feedbackClass: "",
    showFeedback: false,
    showNext: false,
    allAnswered: false,
    currentNum: 0,
    totalNum: 0,
    progressPct: 0,
  },

  onLoad: function () {
    this.initAnswerSounds();
    if (!getApp().ensureReady()) {
      var that = this;
      setTimeout(function () { that.onLoad(); }, 200);
      return;
    }
    var g = app.globalData;
    var queue = g.quizQueue;
    if (!queue || queue.length === 0) {
      wx.showToast({ title: "没有题目", icon: "none" });
      setTimeout(function () { wx.navigateBack(); }, 800);
      return;
    }
    this.showCurrentQuestion();
  },

  onUnload: function () {
    this.disposeAnswerSounds();
  },

  initAnswerSounds: function () {
    if (this.correctAnswerAudio || typeof wx.createInnerAudioContext !== "function") return;

    this.correctAnswerAudio = wx.createInnerAudioContext();
    this.correctAnswerAudio.src = "/assets/sfx/answer-correct.wav";
    this.correctAnswerAudio.volume = 0.9;

    this.wrongAnswerAudio = wx.createInnerAudioContext();
    this.wrongAnswerAudio.src = "/assets/sfx/answer-wrong.wav";
    this.wrongAnswerAudio.volume = 0.9;
  },

  playAnswerSound: function (isCorrect) {
    var audio = isCorrect ? this.correctAnswerAudio : this.wrongAnswerAudio;
    if (!audio) return;

    try {
      audio.stop();
      audio.play();
    } catch (err) {
      // 音效失败不能打断答题流程。
    }
  },

  disposeAnswerSounds: function () {
    var audioList = [this.correctAnswerAudio, this.wrongAnswerAudio];
    audioList.forEach(function (audio) {
      if (audio) audio.destroy();
    });
    this.correctAnswerAudio = null;
    this.wrongAnswerAudio = null;
  },

  /* ========== 显示当前题目 ========== */

  showCurrentQuestion: function () {
    var g = app.globalData;
    var idx = g.currentQuizIndex;
    var queue = g.quizQueue;

    if (idx >= queue.length) {
      this.finishSession();
      return;
    }

    var question = queue[idx];
    var promptResult = this.makeQuestion(question, g.words || g.baseWords);

    var stageClass = question.taskKind === "new" ? "stage-new" : "stage-review";
    var stageLabel = question.taskKind === "new" ? "新学阶段" : "复习阶段";

    var options = promptResult.options.map(function (text, i) {
      return {
        text: text,
        index: i,
        correct: text === promptResult.correct,
        disabled: false,
        className: "",
      };
    });

    this.setData({
      quizProgress: stageLabel + " · " + (idx + 1) + " / " + queue.length,
      quizStageClass: "quiz-stage " + stageClass,
      quizType: question.label,
      promptText: promptResult.prompt,
      options: options,
      feedbackText: "",
      feedbackClass: "",
      showFeedback: false,
      showNext: false,
      allAnswered: false,
      currentNum: idx + 1,
      totalNum: queue.length,
      progressPct: ((idx) / queue.length * 100).toFixed(1),
    });
  },

  makeQuestion: function (question, words) {
    var word = question.word;

    if (question.type === "zh-to-en") {
      var meaningText = (word.meanings || []).map(function (m) { return m.zh; }).join("；");
      var opts = quizUtil.buildOptionsForWord(words, word, function (w) { return w.word; });
      return { prompt: meaningText, correct: word.word, options: opts };
    } else if (question.type === "en-to-zh") {
      var extraValues = quizUtil.extractWordFormOptions(word.wordForms);
      var opts = quizUtil.buildOptionsForWord(words, word, function (w) {
        return (w.meanings || []).map(function (m) { return (m.pos || "") + " " + (m.zh || ""); }).join("；");
      }, Math.random, { preferDifferentPos: true, extraValues: extraValues });
      var c = (word.meanings || []).map(function (m) { return (m.pos || "") + " " + (m.zh || ""); }).join("；");
      return { prompt: word.word, correct: c, options: opts };
    } else {
      var p = word.phonetic || word.word;
      var opts = quizUtil.buildOptionsForWord(words, word, function (w) { return w.word; });
      return { prompt: p, correct: word.word, options: opts };
    }
  },

  /* ========== 答题 ========== */

  onOptionTap: function (e) {
    if (this.data.allAnswered) return;

    var idx = e.currentTarget.dataset.index;
    var correctText = "";
    var options = this.data.options.map(function (opt, i) {
      var cls = "";
      if (opt.correct) {
        cls = "correct";
        correctText = opt.text;
      }
      if (i === idx && !opt.correct) cls = "wrong";
      return {
        text: opt.text,
        index: opt.index,
        correct: opt.correct,
        disabled: true,
        className: cls,
      };
    });

    var isCorrect = options[idx].correct;

    this.playAnswerSound(isCorrect);

    // 快速触感
    wx.vibrateShort({ type: isCorrect ? "light" : "heavy" });

    if (!isCorrect) {
      var g = app.globalData;
      var question = g.quizQueue[g.currentQuizIndex];
      var todayKey = scheduler.todayDateKey();
      g.state = scheduler.recordWrong(g.state, todayKey, question.word, question.label, options[idx].text, correctText);
      g.currentWordResult[question.word.id] = true;
    }

    this.setData({
      options: options,
      feedbackText: isCorrect ? "✓ 回答正确" : ("✗ 回答错误，正确答案：" + correctText),
      feedbackClass: "feedback " + (isCorrect ? "good" : "bad"),
      showFeedback: true,
      showNext: true,
      allAnswered: true,
    });
  },

  /* ========== 下一题 ========== */

  onNext: function () {
    var g = app.globalData;
    var queue = g.quizQueue;
    var idx = g.currentQuizIndex;

    var curQ = queue[idx];
    var nextQ = idx + 1 < queue.length ? queue[idx + 1] : null;
    var wordChanged = !nextQ || nextQ.word.id !== curQ.word.id;

    if (wordChanged) {
      var hadWrong = g.currentWordResult[curQ.word.id] || false;
      var todayKey = scheduler.todayDateKey();
      g.state = scheduler.completeWordTask(g.state, curQ.word, todayKey, hadWrong);
    }

    g.currentQuizIndex = idx + 1;

    if (g.currentQuizIndex >= queue.length) {
      this.finishSession();
    } else {
      this.showCurrentQuestion();
    }
  },

  /* ========== 完成 ========== */

  finishSession: function () {
    var g = app.globalData;
    quizUtil.unlockQuestionModeAfterSession(g.state);
    app.saveState();
    wx.vibrateShort({ type: "medium" });
    wx.redirectTo({ url: "/pages/complete/complete" });
  },
});
