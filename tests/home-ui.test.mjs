import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";

const miniHome = readFileSync(new URL("../src/pages/home/home.wxml", import.meta.url), "utf8");
const miniHomeCss = readFileSync(new URL("../src/pages/home/home.wxss", import.meta.url), "utf8");
const quizWxml = readFileSync(new URL("../src/pages/quiz/quiz.wxml", import.meta.url), "utf8");
const quizCss = readFileSync(new URL("../src/pages/quiz/quiz.wxss", import.meta.url), "utf8");
const quizJs = readFileSync(new URL("../src/pages/quiz/quiz.js", import.meta.url), "utf8");
const webHome = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const webApp = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const appJson = JSON.parse(readFileSync(new URL("../src/app.json", import.meta.url), "utf8"));
const miniHomeJs = readFileSync(new URL("../src/pages/home/home.js", import.meta.url), "utf8");
const appCss = readFileSync(new URL("../src/app.wxss", import.meta.url), "utf8");
const wrongWxml = readFileSync(new URL("../src/pages/wrong/wrong.wxml", import.meta.url), "utf8");
const completeWxml = readFileSync(new URL("../src/pages/complete/complete.wxml", import.meta.url), "utf8");

{
  const heroIndex = miniHome.indexOf('hero-card');
  const settingsIndex = miniHome.indexOf('settings-drawer');
  assert.ok(heroIndex !== -1, "miniprogram home should render a first-screen learning hero");
  assert.ok(settingsIndex !== -1, "miniprogram settings should be moved into a drawer");
  assert.ok(heroIndex < settingsIndex, "learning hero should appear before settings drawer");
}

{
  assert.match(miniHome, /小蛇欢乐屋/, "home should use the new app name as the first-screen brand");
  assert.match(miniHome, /开始学习/, "miniprogram primary CTA should remain start learning");
  assert.match(miniHome, /学习设置与数据/, "miniprogram should group maintenance controls");
  assert.doesNotMatch(miniHome, /hero-settings/, "hero should not include a large settings capsule beside the WeChat menu");
  assert.doesNotMatch(miniHome, /今日任务已装填|先完成今天的单词闯关/, "hero should avoid verbose explanation copy");
  assert.match(miniHome, /compact-start-card/, "home hero should use a compact start card layout");
  assert.doesNotMatch(miniHome, /onSaveSettings" disabled/, "save settings should remain tappable so JS can show lock feedback");
  assert.ok(miniHome.indexOf("hero-stats compact-stats") < miniHome.indexOf("hero-start compact-start"), "start button should sit below the hero stats");
  assert.match(miniHome, /hero-action-band/, "start button should live in a dedicated bottom action band");
  assert.match(miniHomeCss, /\.hero-action-band[\s\S]*justify-content:\s*center/, "start action band should center the CTA like a bottom dock");
  assert.match(miniHomeCss, /\.hero-action-band::after/, "start action band should keep the glass highlight decoration");
  assert.match(miniHomeCss, /\.compact-start[\s\S]*width:\s*100%/, "start button should fill the bottom action band");
  assert.match(miniHomeCss, /\.hero-action-band > \.hero-start\.compact-start[\s\S]*min-width:\s*100%/, "start button should override miniprogram button defaults and truly fill the band");
  assert.doesNotMatch(miniHomeCss, /\.compact-start[\s\S]*width:\s*356rpx/, "start button should not be capped to a narrow fixed width");
  assert.doesNotMatch(miniHome, /goLearned|goWrong/, "home should not duplicate tabbar destinations");
}

{
  assert.match(miniHomeCss, /\.settings-drawer \.field/, "settings drawer should override old horizontal field layout");
  assert.match(miniHomeCss, /\.settings-drawer button/, "settings drawer buttons should be constrained inside the screen");
  assert.match(miniHomeCss, /\.settings-actions/, "settings actions should use a responsive grid layout");
}

{
  for (const iconName of ["home", "learned", "wrong"]) {
    const normal = statSync(new URL(`../src/assets/${iconName}.png`, import.meta.url));
    const active = statSync(new URL(`../src/assets/${iconName}-active.png`, import.meta.url));
    assert.ok(normal.size > 4000, `${iconName} tabbar icon should use the richer generated artwork`);
    assert.ok(active.size > 4000, `${iconName} active tabbar icon should use the richer generated artwork`);
  }
}

{
  const heroIndex = webHome.indexOf('class="panel today-panel home-section hero-card"');
  const settingsIndex = webHome.indexOf('class="panel settings-panel home-section settings-drawer"');
  assert.ok(heroIndex !== -1, "web home should render a first-screen learning hero");
  assert.ok(settingsIndex !== -1, "web settings should be moved into a drawer-like panel");
  assert.ok(heroIndex < settingsIndex, "web learning hero should appear before settings drawer");
  assert.match(webApp, /learnedPanel\.hidden = currentView !== PAGE_VIEWS\.LEARNED/, "web home should not duplicate learned tab content");
  assert.match(webApp, /wrongPanel\.hidden = currentView !== PAGE_VIEWS\.WRONG/, "web home should not duplicate wrong tab content");
}

{
  assert.equal(appJson.window.navigationBarTitleText, "小蛇欢乐屋", "navigation title should use the new app name");
  assert.equal(appJson.tabBar.selectedColor.toLowerCase(), "#12b957", "tabbar selected color should match the lime glass style");
  assert.equal(appJson.tabBar.backgroundColor.toLowerCase(), "#f8fff0", "tabbar background should match the app surface");
  assert.equal(appJson.window.navigationBarBackgroundColor.toLowerCase(), "#f5ffe9", "navigation bar should match the unified lime glass background");
  assert.equal(appJson.window.backgroundColor.toLowerCase(), "#f5ffe9", "window background should match the lime glass page background");
}

{
  assert.match(appCss, /Lime Glass 青柠玻璃/, "global styles should define the lime glass design system");
  assert.match(appCss, /--glass:/, "global styles should expose glass surface tokens");
  assert.match(appCss, /\.page-container/, "page container should be shared across miniprogram pages");
  assert.doesNotMatch(wrongWxml + completeWxml, /🎉/, "UI states should avoid emoji icons and use the themed icon system instead");
}







{
  assert.doesNotMatch(miniHomeJs, /parseInt\(e\.detail\.value\) \|\| 20/, "daily new input handlers should allow empty edits");
  assert.doesNotMatch(miniHomeJs, /parseInt\(e\.detail\.value\) \|\| 40/, "daily review input handlers should allow empty edits");
  assert.match(miniHomeJs, /normalizeSettingNumber/, "settings should normalize numeric fields only when saving");
}

{
  assert.match(quizWxml, /quiz-shell/, "quiz page should use a dedicated full-width shell");
  assert.match(quizCss, /\.options-grid[\s\S]*width:\s*100%/, "quiz options should use full-width cards");
  assert.match(quizCss, /\.option-btn[\s\S]*text-align:\s*left/, "long quiz option text should be left aligned");
  assert.match(quizCss, /\.option-btn[\s\S]*white-space:\s*normal/, "long quiz option text should wrap normally");
}

{
  assert.match(quizWxml, /answer-panel/, "quiz answers should live in a dedicated answer panel");
  assert.doesNotMatch(quizWxml, /quiz-prompt-card/, "quiz prompt should not be a heavy card");
  assert.match(quizCss, /\.answer-panel[\s\S]*width:\s*100%/, "answer panel should span the available width");
  assert.match(quizCss, /\.answer-option[\s\S]*border-radius:\s*999rpx/, "answer options should use long rounded pill rows");
}

{
  assert.doesNotMatch(miniHomeJs, /无法修改设置/, "saving settings should not show a disruptive locked-session toast");
}

{
  const correctSound = statSync(new URL("../src/assets/sfx/answer-correct.wav", import.meta.url));
  const wrongSound = statSync(new URL("../src/assets/sfx/answer-wrong.wav", import.meta.url));
  assert.ok(correctSound.size > 1000, "correct answer sound should be a real local audio asset");
  assert.ok(wrongSound.size > 1000, "wrong answer sound should be a real local audio asset");
  assert.match(quizJs, /wx\.createInnerAudioContext\(\)/, "quiz page should create local answer audio contexts");
  assert.match(quizJs, /\/assets\/sfx\/answer-correct\.wav/, "quiz page should use the normalized correct sound path");
  assert.match(quizJs, /\/assets\/sfx\/answer-wrong\.wav/, "quiz page should use the normalized wrong sound path");
  assert.match(quizJs, /playAnswerSound\(isCorrect\)/, "answer taps should play the sound matching correctness");
  assert.match(quizJs, /onUnload[\s\S]*disposeAnswerSounds\(\)/, "quiz page should release audio contexts when leaving");
  assert.match(quizJs, /\.destroy\(\)/, "audio contexts should be destroyed during cleanup");
}
