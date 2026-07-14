# LingoSnake Open-Source Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current mixed Web and WeChat workspace into a safe, dependency-free, public LingoSnake repository with one canonical Mini Program codebase, generated sample data, bilingual documentation, and CI.

**Architecture:** `src/` becomes the WeChat `miniprogramRoot`; pure CommonJS modules in `src/core/` are loaded by both pages and Node tests. A Node-only preparation script validates public or private JSON materials and writes the ignored runtime module consumed by `src/utils/material.js`.

**Tech Stack:** Native WeChat Mini Program JavaScript/WXML/WXSS, Node.js 22 built-ins, Node ESM assertion tests, GitHub Actions.

## Global Constraints

- Product names are `LingoSnake` and `小蛇欢乐屋`; repository name is `lingosnake`.
- Keep the repository dependency-free; `package.json` contains scripts but no dependencies.
- Publish only original sample vocabulary; curriculum-derived vocabulary stays ignored under `private/vocabulary/`.
- Commit `touristappid`; ignore the owner's AppID and `project.private.config.json`.
- Do not place secrets in Mini Program client files.
- Remove the standalone Web UI and defer all Taro work.
- Preserve answer sounds, learning progress, settings, exports, learned records, and wrong-answer behavior.
- Use MIT with `Copyright (c) 2026 LingoSnake contributors`.
- Use `main` as the only default branch; rename the current local `master` branch before publication.

---

### Task 1: Protect private files and define generated vocabulary

**Files:**
- Create: `.gitignore`
- Create: `config/local.example.json`
- Create: `data/sample/materials.json`
- Create: `scripts/prepare-data.mjs`
- Create: `tests/prepare-data.test.mjs`
- Move: `vocab-data.js` to `private/vocabulary/vocab-data.js`
- Move: `vocab-materials-extra.js` to `private/vocabulary/vocab-materials-extra.js`

**Interfaces:**
- Consumes: optional `config/local.json` with `{ "vocabularySources": ["relative/or/absolute/path.json"] }`.
- Produces: `prepareData({ rootDir, configPath? }) -> { outputPath, materialCount, wordCount, source }` and `src/data/generated/materials.js` exporting `{ materials }`.

- [ ] **Step 1: Write the failing data preparation test**

Create `tests/prepare-data.test.mjs` with temporary directories. Import `prepareData` from `scripts/prepare-data.mjs`, write a two-word sample JSON material, call `prepareData({ rootDir })`, require the generated CommonJS module, and assert its material ID, word count, and generated source. Add a second case with duplicate word IDs and assert rejection matching `/duplicate word id/i`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/prepare-data.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/prepare-data.mjs`.

- [ ] **Step 3: Rename the local default branch**

Run `git branch -m main`, then verify `git branch --show-current` prints `main`.

- [ ] **Step 4: Add ignore rules before moving private data**

Create `.gitignore` containing:

```gitignore
config/local.json
private/
src/data/generated/
project.private.config.json
.agents/
.claude/
.codex/
.superpowers/
node_modules/
*.log
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Add public sample and local configuration example**

Create `data/sample/materials.json` as an array containing one material with ID `lingosnake-starter`, name `LingoSnake Starter Words`, and 12 original example entries. The entries must exercise `unit`, `page`, multiple meanings, phonetic text, and `wordForms` without copying the private datasets.

Create `config/local.example.json`:

```json
{
  "vocabularySources": [
    "private/vocabulary/materials.json"
  ]
}
```

- [ ] **Step 6: Implement the zero-dependency generator**

In `scripts/prepare-data.mjs`, export `prepareData`. Resolve the repository root, load `config/local.json` when it exists, otherwise load `data/sample/materials.json`; validate non-empty material IDs/names, arrays of words, unique IDs, non-empty `word`, and at least one non-empty Chinese meaning. Write a CommonJS module using `module.exports = { materials: ... };` to `src/data/generated/materials.js`. When executed directly, print only the selected source, material count, word count, and output path.

- [ ] **Step 7: Verify GREEN and protect the existing private datasets**

Run: `node tests/prepare-data.test.mjs`

Expected: PASS.

Resolve both source and destination paths, verify destinations remain under `private/vocabulary/`, then move the two root private datasets there. Do not stage files under `private/`.

- [ ] **Step 8: Commit the data boundary**

Inspect `git diff --cached`, then commit only public files:

```bash
git add .gitignore config/local.example.json data/sample/materials.json scripts/prepare-data.mjs tests/prepare-data.test.mjs
git commit -m "🔒 security: 隔离私有词库配置"
```

### Task 2: Establish `src/` as the runnable Mini Program root

**Files:**
- Move: `miniprogram/app.js` to `src/app.js`
- Move: `miniprogram/app.json` to `src/app.json`
- Move: `miniprogram/app.wxss` to `src/app.wxss`
- Move: `miniprogram/sitemap.json` to `src/sitemap.json`
- Move: `miniprogram/pages/` to `src/pages/`
- Move: `miniprogram/assets/` to `src/assets/`
- Move: `miniprogram/utils/storage.js` to `src/utils/storage.js`
- Move and modify: `miniprogram/utils/material.js` to `src/utils/material.js`
- Create: `tests/repository-structure.test.mjs`

**Interfaces:**
- Consumes: `src/data/generated/materials.js` with `{ materials: Material[] }`.
- Produces: a native Mini Program rooted at `src/` and `material.normalizeMaterials()` backed only by generated materials.

- [ ] **Step 1: Write the failing repository structure test**

Create `tests/repository-structure.test.mjs` using `existsSync`, `readFileSync`, and `statSync`. Assert that `src/app.json`, `src/pages/home/home.js`, `src/assets/app-avatar.png`, `src/utils/material.js`, and `src/data/generated/materials.js` exist. Assert that `src/utils/material.js` references `../data/generated/materials` and does not contain `上海初中英语` or `vocab-data`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/repository-structure.test.mjs`

Expected: FAIL because `src/app.json` does not exist.

- [ ] **Step 3: Move platform files into `src/`**

Move the app shell, pages, assets, sitemap, storage utility, and material utility to the exact paths listed above. Preserve bytes for images and WAV files. Remove `tabbar-preview.jpg` rather than moving it because it is not used at runtime.

- [ ] **Step 4: Point material loading at generated data**

Replace the two hard-coded vocabulary imports in `src/utils/material.js` with:

```js
var generatedData = require("../data/generated/materials");
```

Make `buildConfiguredMaterials()` return `generatedData.materials || []`, and set `DEFAULT_MATERIAL_ID` from the first generated material or `lingosnake-starter`. Remove private curriculum names and fallback construction.

- [ ] **Step 5: Verify GREEN**

Run: `node scripts/prepare-data.mjs && node tests/repository-structure.test.mjs`

Expected: PASS and one generated sample material.

- [ ] **Step 6: Commit the source root migration**

Inspect `git diff --cached`, then commit:

```bash
git add src tests/repository-structure.test.mjs
git commit -m "♻️ refactor: 统一小程序源码目录"
```

### Task 3: Make `src/core/` the single business-logic source

**Files:**
- Move: `miniprogram/utils/scheduler.js` to `src/core/scheduler.js`
- Move: `miniprogram/utils/quiz.js` to `src/core/quiz.js`
- Move: `miniprogram/utils/word-order.js` to `src/core/word-order.js`
- Move: `miniprogram/utils/word-forms.js` to `src/core/word-forms.js`
- Move: `miniprogram/utils/progress-export.js` to `src/core/progress-export.js`
- Move: `miniprogram/utils/wrong-export.js` to `src/core/wrong-export.js`
- Move: `miniprogram/utils/session-lock.js` to `src/core/session-lock.js`
- Modify: `src/utils/material.js`
- Modify: `src/pages/home/home.js`
- Modify: `src/pages/quiz/quiz.js`
- Modify: `src/pages/complete/complete.js`
- Modify: `src/pages/learned/learned.js`
- Modify: `src/pages/wrong/wrong.js`
- Modify: all seven core tests under `tests/`

**Interfaces:**
- Consumes: existing CommonJS `module.exports` APIs from Mini Program utilities.
- Produces: canonical CommonJS modules under `src/core/`, loaded by both Mini Program code and Node ESM tests.

- [ ] **Step 1: Point one core test at the desired canonical path**

In `tests/scheduler.test.mjs`, replace the root ESM import with:

```js
import scheduler from "../src/core/scheduler.js";
const {
  buildTodayPlan,
  completeWordTask,
  createInitialState,
  normalizeState,
  recordWrong,
} = scheduler;
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/scheduler.test.mjs`

Expected: FAIL because `src/core/scheduler.js` does not exist.

- [ ] **Step 3: Move all seven canonical CommonJS modules**

Move the Mini Program business utilities to `src/core/` without changing their public APIs. Update `src/utils/material.js` imports from `./scheduler`, `./word-order`, and `./word-forms` to `../core/scheduler`, `../core/word-order`, and `../core/word-forms`.

- [ ] **Step 4: Update Mini Program page imports**

Change page imports from `../../utils/<module>` to `../../core/<module>` for scheduler, quiz, word-order, word-forms, progress-export, wrong-export, and session-lock. Keep `material` and `storage` under `src/utils/`.

- [ ] **Step 5: Update the remaining core tests**

Use default CommonJS imports from `../src/core/<module>.js`, then destructure the exact existing APIs in `quiz.test.mjs`, `order.test.mjs`, `word-forms.test.mjs`, `progress-export.test.mjs`, `wrong-export.test.mjs`, and `session-lock.test.mjs`.

- [ ] **Step 6: Verify GREEN**

Run all seven core tests. Expected: every existing `... tests passed` line and exit code 0.

- [ ] **Step 7: Commit the single-source core**

Inspect `git diff --cached`, then commit:

```bash
git add src/core src/pages src/utils tests
git commit -m "♻️ refactor: 合并核心业务模块"
```

### Task 4: Add public project configuration, commands, license, and CI

**Files:**
- Create: `project.config.json`
- Create: `package.json`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`
- Modify: `tests/repository-structure.test.mjs`

**Interfaces:**
- Consumes: Node.js 22 and the test files from Tasks 1-3.
- Produces: `npm run prepare`, `npm test`, and `npm run check`; a root WeChat project using `src/`.

- [ ] **Step 1: Extend the repository test and verify RED**

Assert that `project.config.json` has `miniprogramRoot === "src/"`, `appid === "touristappid"`, and `projectname === "lingosnake"`. Assert that `package.json` has no dependency fields and contains `prepare`, `test`, and `check` scripts. Assert the CI file contains `permissions: contents: read`, Node 22, and `npm run check`.

Run: `node tests/repository-structure.test.mjs`

Expected: FAIL because the root project configuration is absent.

- [ ] **Step 2: Add the root WeChat configuration**

Move relevant compiler settings from the old Mini Program project configuration into root `project.config.json`, add `"miniprogramRoot": "src/"`, replace AppID with `touristappid`, and set project name and description to LingoSnake. Do not copy private configuration.

- [ ] **Step 3: Add command aliases**

Create `package.json` with `private: false`, no dependencies, and scripts that run the preparation test, seven core tests, home UI test, repository structure test, and `node --check` over app, core, utils, and page JavaScript files.

- [ ] **Step 4: Add license and CI**

Create the standard MIT license with the approved copyright line. Create `.github/workflows/ci.yml` for push and pull request, Ubuntu, `actions/checkout`, `actions/setup-node` with Node 22, `npm run prepare`, and `npm run check`; use read-only contents permission and no secrets.

- [ ] **Step 5: Verify GREEN**

Run: `npm run check`

Expected: exit code 0 with all test success lines.

- [ ] **Step 6: Commit project tooling**

Inspect `git diff --cached`, then commit:

```bash
git add project.config.json package.json LICENSE .github tests/repository-structure.test.mjs
git commit -m "📦 build: 完善开源工程配置"
```

### Task 5: Remove obsolete Web and duplicate development artifacts

**Files:**
- Delete: `index.html`, `app.js`, `styles.css`
- Delete: root `scheduler.js/.mjs`, `quiz.js/.mjs`, `word-order.js/.mjs`, `word-forms.js/.mjs`, `progress-export.js/.mjs`, `wrong-export.js/.mjs`, `session-lock.js/.mjs`
- Delete: `miniprogram/`, `preview/`, `CLAUDE.md`
- Delete: `scripts/gen-icons.mjs` if it only serves removed previews
- Modify: `AGENTS.md`
- Modify: `tests/home-ui.test.mjs`
- Modify: `tests/repository-structure.test.mjs`

**Interfaces:**
- Consumes: canonical files from Tasks 2-4.
- Produces: a repository containing only the native Mini Program, canonical tests, public tooling, and documentation.

- [ ] **Step 1: Extend cleanup assertions and verify RED**

Update repository tests to assert the old Web entry points, root duplicate modules, `miniprogram/`, and `preview/` do not exist. Update `home-ui.test.mjs` paths from `miniprogram/...` to `src/...` and remove assertions about the deleted Web home.

Run: `node tests/repository-structure.test.mjs`

Expected: FAIL because obsolete files still exist.

- [ ] **Step 2: Remove obsolete product files**

Delete only the listed Web files, duplicate logic files, unused preview artifacts, old Mini Program container after all runtime files have moved, and duplicate `CLAUDE.md`. Keep `.agents/`, `.claude/`, `.codex/`, and `.superpowers/` locally but ignored.

- [ ] **Step 3: Rewrite contributor guidance**

Rewrite `AGENTS.md` around the new `src/core/` single-source rule, generated data workflow, private-data boundary, project commands, Mini Program page structure, and Git Emoji Chinese commit convention.

- [ ] **Step 4: Verify GREEN**

Run: `npm run check`

Expected: exit code 0 and no test references to removed root modules or `miniprogram/` paths.

- [ ] **Step 5: Commit cleanup**

Inspect `git diff --cached`, then commit:

```bash
git add -A
git commit -m "🔥 remove: 清理旧版网页与重复代码"
```

### Task 6: Write bilingual public documentation and sample screenshots

**Files:**
- Create: `README.md`
- Create: `README.zh-CN.md`
- Create: `docs/images/home.png`
- Create: `docs/images/quiz.png`
- Modify: `tests/repository-structure.test.mjs`

**Interfaces:**
- Consumes: sample-generated Mini Program and product avatar.
- Produces: matching English and Simplified Chinese onboarding documentation with sample-only visuals.

- [ ] **Step 1: Add documentation contract assertions and verify RED**

Assert both README files exist, cross-link to each other, mention `npm run prepare`, `npm run check`, `touristappid`, private vocabulary, MIT, and Taro. Assert neither contains `wxe0ec80f15422470d` nor `上海初中英语`. Assert both screenshot files are valid non-trivial PNGs.

Run: `node tests/repository-structure.test.mjs`

Expected: FAIL because the bilingual documentation does not exist.

- [ ] **Step 2: Write the English README**

Write `README.md` with the avatar, language switch, product summary, screenshots, feature list, architecture, quick start, sample/private data setup, complete vocabulary JSON schema, test commands, privacy and dataset copyright guidance, contribution steps, Taro roadmap note, and MIT license.

- [ ] **Step 3: Write the Chinese README**

Write `README.zh-CN.md` as a complete Chinese equivalent with matching commands, paths, schema, privacy boundaries, and links. Do not reduce it to a summary translation.

- [ ] **Step 4: Capture sample-only screenshots**

Run `npm run prepare`, open the repository root in WeChat Developer Tools, clear local Mini Program storage, compile with the sample material, and capture the home and quiz pages. Crop only the application viewport and save as `docs/images/home.png` and `docs/images/quiz.png`. Verify visible material name is `LingoSnake Starter Words` and no personal data appears.

- [ ] **Step 5: Verify GREEN and documentation parity**

Run: `npm run check`

Expected: exit code 0. Manually compare the two README section lists and commands; they must match.

- [ ] **Step 6: Commit documentation**

Inspect `git diff --cached`, then commit:

```bash
git add README.md README.zh-CN.md docs/images tests/repository-structure.test.mjs
git commit -m "📝 docs: 完善中英文项目说明"
```

### Task 7: Final security audit and publication handoff

**Files:**
- Modify only files required to fix audit findings.

**Interfaces:**
- Consumes: completed local repository.
- Produces: a reviewed commit ready for the public GitHub repository `lingosnake`.

- [ ] **Step 1: Run full verification**

Run: `npm run check`

Expected: exit code 0 with all tests passing.

- [ ] **Step 2: Audit tracked files and staged content**

Run `git status --short`, `git ls-files`, `git diff --cached`, and scans for AppID, Windows user paths, secret-like keys, private material names, and generated vocabulary. Confirm `private/`, `config/local.json`, `src/data/generated/`, and `project.private.config.json` are untracked and ignored.

- [ ] **Step 3: Verify clean-checkout behavior**

Create a temporary Git worktree or archive from `HEAD`, run `npm run prepare` and `npm run check` there, and confirm no ignored local files are required.

- [ ] **Step 4: Obtain final user review**

Present the final directory tree, README links, screenshots, test evidence, security scan result, and commit list. Do not create the public GitHub repository until the user approves this final review.

- [ ] **Step 5: Publish after approval**

Use the installed GitHub integration or authenticated `gh` CLI to create the public repository `lingosnake` with default branch `main`, set the description to `A playful spaced-repetition vocabulary trainer for WeChat Mini Program.`, add the remote, push `main`, and verify the public README and Actions run. Do not configure secrets or deployment.
