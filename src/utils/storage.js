// 微信小程序存储封装
var STORAGE_KEY = "ebbinghaus-vocab-progress-v1";

function loadState() {
  try {
    var data = wx.getStorageSync(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn("加载进度失败:", e);
  }
  return null;
}

function saveState(appState) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error("保存进度失败:", e);
    wx.showToast({ title: "保存失败，存储空间可能不足", icon: "none" });
  }
}

module.exports = {
  loadState: loadState,
  saveState: saveState,
  STORAGE_KEY: STORAGE_KEY,
};
