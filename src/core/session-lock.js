// 会话锁 — 微信小程序版
function hasLockedSession(currentState, appState) {
  if (isLocked(currentState)) return true;
  var states = appState && appState.materialStates ? appState.materialStates : {};
  var keys = Object.keys(states);
  for (var i = 0; i < keys.length; i++) {
    if (isLocked(states[keys[i]])) return true;
  }
  return false;
}

function canEditSessionSettings(currentState, appState) {
  // Each material owns its quiz session; another material must not block this one.
  return !isLocked(currentState);
}

function isLocked(state) {
  return Boolean(state && state.activeSession && state.activeSession.locked);
}

module.exports = {
  hasLockedSession: hasLockedSession,
  canEditSessionSettings: canEditSessionSettings,
};
