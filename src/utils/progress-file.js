// 学习进度文件 — 微信小程序文件适配
var PROGRESS_FILE_NAME = "lingosnake-progress.json";

function getFilePath() {
  var basePath = wx.env && wx.env.USER_DATA_PATH ? wx.env.USER_DATA_PATH : "";
  return basePath + "/" + PROGRESS_FILE_NAME;
}

function writeProgressJson(json, callbacks) {
  var fs = wx.getFileSystemManager();
  var filePath = getFilePath();
  fs.writeFile({
    filePath: filePath,
    data: json,
    encoding: "utf8",
    success: function () {
      if (callbacks && callbacks.success) callbacks.success({ filePath: filePath, fileName: PROGRESS_FILE_NAME });
    },
    fail: function (error) {
      if (callbacks && callbacks.fail) callbacks.fail(error);
    },
  });
}

function shareProgressJson(json, callbacks) {
  writeProgressJson(json, {
    success: function (file) {
      if (typeof wx.shareFileMessage !== "function") {
        if (callbacks && callbacks.fail) callbacks.fail({ stage: "share", errMsg: "shareFileMessage is not supported" });
        return;
      }
      wx.shareFileMessage({
        filePath: file.filePath,
        fileName: file.fileName,
        success: function () {
          if (callbacks && callbacks.success) callbacks.success(file);
        },
        fail: function (error) {
          if (callbacks && callbacks.fail) callbacks.fail(Object.assign({}, error, { stage: "share" }));
        },
      });
    },
    fail: function (error) {
      if (callbacks && callbacks.fail) callbacks.fail(Object.assign({}, error, { stage: "write" }));
    },
  });
}

function chooseProgressJson(callbacks) {
  wx.chooseMessageFile({
    count: 1,
    type: "file",
    extension: ["json"],
    success: function (result) {
      var file = result && result.tempFiles && result.tempFiles[0];
      if (!file || !file.path) {
        if (callbacks && callbacks.fail) callbacks.fail({ stage: "choose", errMsg: "No JSON file selected" });
        return;
      }
      if (callbacks && callbacks.success) callbacks.success(file);
    },
    fail: function (error) {
      if (callbacks && callbacks.fail) callbacks.fail(Object.assign({}, error, { stage: "choose" }));
    },
  });
}

function readProgressJson(filePath, callbacks) {
  wx.getFileSystemManager().readFile({
    filePath: filePath,
    encoding: "utf8",
    success: function (result) {
      if (callbacks && callbacks.success) callbacks.success(result.data);
    },
    fail: function (error) {
      if (callbacks && callbacks.fail) callbacks.fail(Object.assign({}, error, { stage: "read" }));
    },
  });
}

module.exports = {
  PROGRESS_FILE_NAME: PROGRESS_FILE_NAME,
  writeProgressJson: writeProgressJson,
  shareProgressJson: shareProgressJson,
  chooseProgressJson: chooseProgressJson,
  readProgressJson: readProgressJson,
};
