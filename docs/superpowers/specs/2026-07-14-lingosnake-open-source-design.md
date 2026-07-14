# LingoSnake Open-Source Repository Design

## Product Identity

- English name: **LingoSnake**
- Chinese name: **小蛇欢乐屋**
- GitHub repository: **lingosnake**
- Positioning: a playful spaced-repetition vocabulary trainer for WeChat Mini Program.
- License: MIT, attributed to `LingoSnake contributors`.

LingoSnake will be maintained as a native WeChat Mini Program. The existing standalone Web UI will be removed. A future Web version may be rebuilt with Taro, reusing the pure core modules defined below.

## Repository Structure

```text
lingosnake/
├─ .github/workflows/ci.yml
├─ config/
│  └─ local.example.json
├─ data/
│  └─ sample/
├─ docs/
│  └─ images/
├─ private/
│  └─ vocabulary/            # ignored by Git
├─ scripts/
│  └─ prepare-data.mjs
├─ src/
│  ├─ assets/
│  ├─ core/
│  ├─ data/generated/        # ignored by Git
│  ├─ pages/
│  ├─ utils/
│  ├─ app.js
│  ├─ app.json
│  ├─ app.wxss
│  └─ sitemap.json
├─ tests/
├─ .gitignore
├─ AGENTS.md
├─ LICENSE
├─ package.json
├─ project.config.json
├─ README.md
└─ README.zh-CN.md
```

`project.config.json` lives at the repository root and declares `src/` as `miniprogramRoot`. It uses `touristappid` so a public clone does not expose or depend on the owner's AppID.

## Source Boundaries

`src/core/` is the only source of truth for platform-independent behavior:

- spaced-repetition scheduling;
- quiz generation and distractor selection;
- word ordering and word-form relationships;
- progress and wrong-answer export/import;
- learning-session locking.

Core modules use CommonJS exports so both native WeChat code and Node ESM tests can load the same files. The root IIFE modules, root ESM mirrors, and duplicated `miniprogram/utils` business modules will be removed.

`src/pages/` contains WeChat page lifecycle and presentation logic. `src/utils/` is limited to WeChat-specific storage, material loading, and platform adapters. Pages may depend on `src/core/`; core modules must not depend on `wx`, page state, or UI files.

## Vocabulary Data

The public repository does not redistribute the existing Shanghai curriculum or textbook-derived vocabulary datasets. It includes only a small original sample dataset sufficient to demonstrate all supported fields and run the application.

The current full datasets move to `private/vocabulary/`, which is ignored by Git. Generated runtime data lives in `src/data/generated/` and is also ignored.

`node scripts/prepare-data.mjs` reads `config/local.json` when present. If no local configuration exists, it generates runtime data from `data/sample/`. If local configuration points to private vocabulary files, it generates runtime data from those files instead. The script uses only Node built-ins and validates material IDs, names, word IDs, spellings, meanings, and duplicate IDs before writing output.

`config/local.example.json` documents the private source path. `config/local.json` is ignored. No runtime secret is embedded in the Mini Program; future API secrets must live on a server.

## Public Documentation

`README.md` is the canonical English document. `README.zh-CN.md` provides a complete Simplified Chinese version. Each document links to the other at the top.

Both documents include:

- product avatar, product summary, and two screenshots made with sample data;
- feature overview and learning model;
- repository structure;
- prerequisites and quick-start commands;
- sample and private vocabulary workflows;
- vocabulary schema;
- test commands and contribution guidance;
- privacy, client-side secret, and dataset copyright notes;
- a future Taro migration note;
- MIT license attribution.

Screenshots show the home and quiz pages with sample vocabulary only. They must not contain private material names, progress, AppID values, or personal account information.

## Developer Experience

The repository remains dependency-free. `package.json` provides command aliases only:

- `npm run prepare` generates runtime vocabulary data;
- `npm test` runs all Node assertion tests;
- `npm run check` prepares data, checks JavaScript syntax, and runs tests.

`AGENTS.md` is rewritten to describe the new single-source architecture and commands. Tool-specific directories `.agents/`, `.claude/`, `.codex/`, and `.superpowers/` are ignored. The duplicate `CLAUDE.md` and obsolete UI preview files are removed from the product repository.

## Continuous Integration

GitHub Actions runs on pushes and pull requests. It uses Node.js 22 and executes `npm run check`. The workflow has read-only repository permissions, uses no secrets, performs no deployment, and never accesses private vocabulary.

## Migration Sequence

1. Add ignore rules before staging any source files.
2. Move private vocabulary into ignored storage and create the public sample dataset.
3. Establish `src/` as the Mini Program root and move pages, assets, and platform utilities.
4. Select the Mini Program CommonJS modules as canonical core implementations.
5. Point pages and tests at `src/core/`, then remove duplicate Web and ESM implementations.
6. Add data preparation, command aliases, license, CI, and bilingual documentation.
7. Generate sample data and sample screenshots.
8. Run syntax checks and the full regression suite.
9. Inspect staged and unstaged diffs, then create a compliant Chinese Git Emoji commit.
10. After final user review, create the public `lingosnake` GitHub repository and push.

## Validation And Safety

The migration is complete only when all of the following are true:

- a clean checkout can run `npm run prepare` followed by `npm run check`;
- WeChat Developer Tools can open the repository root and compile `src/` using `touristappid`;
- answer sounds, settings, learning progress, exports, learned records, and wrong answers retain existing behavior;
- tests load the canonical `src/core/` modules rather than duplicate test-only implementations;
- repository scans find no personal AppID, private vocabulary, local paths, API keys, or generated private data;
- both README files contain matching setup, data, testing, and licensing information;
- GitHub Actions passes without secrets.

## Explicit Non-Goals

- Rebuilding the deleted Web UI.
- Migrating to Taro in this change.
- Adding cloud sync, accounts, analytics, or a backend.
- Publishing curriculum-derived vocabulary data.
- Storing secrets in Mini Program code or client-side environment files.
