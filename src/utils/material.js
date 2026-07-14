// 材料管理 — 微信小程序版
var scheduler = require("./scheduler");
var wordOrder = require("./word-order");
var wordForms = require("./word-forms");
var generatedData = require("../data/generated/materials");

var DEFAULT_MATERIAL_ID = (generatedData.materials && generatedData.materials[0] && generatedData.materials[0].id)
  || "lingosnake-starter";

function normalizeMaterials() {
  var configuredMaterials = buildConfiguredMaterials();
  var seen = new Set();
  return configuredMaterials
    .map(function (material, index) {
      var id = cleanMaterialId(material.id || "material-" + (index + 1));
      var uniqueId = seen.has(id) ? id + "-" + (index + 1) : id;
      seen.add(uniqueId);
      return {
        id: uniqueId,
        name: material.name || ("材料 " + (index + 1)),
        words: Array.isArray(material.words) ? material.words : [],
        defaultOrderMode: material.defaultOrderMode || null,
      };
    })
    .filter(function (material) { return material.words.length; });
}

function buildConfiguredMaterials() {
  return generatedData.materials || [];
}

function normalizeAppState(raw, materials) {
  var defaultMaterialId = materials.length ? materials[0].id : DEFAULT_MATERIAL_ID;
  var hasMaterialState = raw && typeof raw === "object" && raw.materialStates;
  var activeMaterialId = materials.some(function (m) { return m.id === (raw && raw.activeMaterialId); })
    ? raw.activeMaterialId
    : defaultMaterialId;
  var materialStates = {};

  if (hasMaterialState) {
    for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
      var material = materials_1[_i];
      materialStates[material.id] = scheduler.normalizeState(
        (raw.materialStates && raw.materialStates[material.id]) || scheduler.createInitialState()
      );
    }
  } else {
    materialStates[defaultMaterialId] = scheduler.normalizeState(raw || scheduler.createInitialState());
    for (var _a = 0, materials_2 = materials; _a < materials_2.length; _a++) {
      var material = materials_2[_a];
      if (!materialStates[material.id]) {
        materialStates[material.id] = scheduler.createInitialState();
      }
    }
  }

  return {
    version: 2,
    activeMaterialId: activeMaterialId,
    materialStates: materialStates,
  };
}

function applyActiveMaterial(material, appState) {
  var baseWords = wordOrder.normalizeWordList(material.words);
  var wordFormRelationMap = wordForms.buildWordFormRelationMap(baseWords);
  var wordFormWordSet = wordForms.buildWordFormWordSet(baseWords, wordFormRelationMap);
  var state = scheduler.normalizeState(
    (appState.materialStates && appState.materialStates[material.id]) || scheduler.createInitialState()
  );

  if (material.defaultOrderMode && !(state.activeSession && state.activeSession.locked) && state.settings.orderMode === wordOrder.ORDER_MODES.A_TO_Z) {
    state.settings.orderMode = material.defaultOrderMode;
  }

  appState.materialStates[material.id] = state;

  return {
    baseWords: baseWords,
    wordFormRelationMap: wordFormRelationMap,
    wordFormWordSet: wordFormWordSet,
    state: state,
  };
}

function cleanMaterialId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || DEFAULT_MATERIAL_ID;
}

module.exports = {
  normalizeMaterials: normalizeMaterials,
  normalizeAppState: normalizeAppState,
  applyActiveMaterial: applyActiveMaterial,
  DEFAULT_MATERIAL_ID: DEFAULT_MATERIAL_ID,
};
