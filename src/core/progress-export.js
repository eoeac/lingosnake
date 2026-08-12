// 进度导出导入 — 微信小程序版
function buildProgressExportJson(appState) {
  return JSON.stringify(appState, null, 2);
}

function parseProgressImportJson(text) {
  var parsed = JSON.parse(cleanJsonText(text));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SyntaxError("Progress import must be a JSON object");
  }
  return parsed;
}

function cleanJsonText(text) {
  var cleaned = String(text || "").replace(/^﻿/, "").trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return cleaned;
}

function getImportedMaterialIds(appState) {
  if (!appState || typeof appState !== "object") return [];
  if (appState.materialStates && typeof appState.materialStates === "object" && !Array.isArray(appState.materialStates)) {
    return Object.keys(appState.materialStates);
  }
  return appState.activeMaterialId ? [String(appState.activeMaterialId)] : [];
}

function getCompatibleMaterialIds(appState, materials) {
  var importedIds = getImportedMaterialIds(appState);
  var availableIds = (Array.isArray(materials) ? materials : [])
    .map(function (material) { return material && material.id ? String(material.id) : ""; });
  return importedIds.filter(function (id) { return availableIds.indexOf(id) !== -1; });
}

module.exports = {
  buildProgressExportJson: buildProgressExportJson,
  parseProgressImportJson: parseProgressImportJson,
  getImportedMaterialIds: getImportedMaterialIds,
  getCompatibleMaterialIds: getCompatibleMaterialIds,
};
