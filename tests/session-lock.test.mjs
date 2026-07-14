import assert from "node:assert/strict";
import sessionLock from "../src/core/session-lock.js";

const { canEditSessionSettings, hasLockedSession } = sessionLock;

const unlockedState = { activeSession: null };
const lockedState = { activeSession: { locked: true, questionMode: "mixed" } };

{
  assert.equal(hasLockedSession(unlockedState, { materialStates: {} }), false);
  assert.equal(canEditSessionSettings(unlockedState, { materialStates: {} }), true);
}

{
  assert.equal(hasLockedSession(lockedState, { materialStates: {} }), true);
  assert.equal(canEditSessionSettings(lockedState, { materialStates: {} }), false);
}

{
  const appState = {
    materialStates: {
      grade8: lockedState,
      exam: unlockedState,
    },
  };
  assert.equal(hasLockedSession(unlockedState, appState), true);
  assert.equal(canEditSessionSettings(unlockedState, appState), false);
}

console.log("session lock tests passed");
