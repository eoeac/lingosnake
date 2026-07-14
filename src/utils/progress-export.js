// 进度导出导入 — 微信小程序版
function buildProgressExportJson(appState) {
  return JSON.stringify(appState, null, 2);
}

function parseProgressImportJson(text) {
  return JSON.parse(cleanJsonText(text));
}

function cleanJsonText(text) {
  return String(text || "").replace(/^﻿/, "").trim();
}

module.exports = {
  buildProgressExportJson: buildProgressExportJson,
  parseProgressImportJson: parseProgressImportJson,
};
