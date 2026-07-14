# Task 3 Report: src/core single business-logic source

## Status

Completed the canonical business-module move from `src/utils/` to `src/core/`.

## Changes

- Moved `scheduler`, `quiz`, `word-order`, `word-forms`, `progress-export`, `wrong-export`, and `session-lock` to `src/core/` without API changes.
- Redirected owned Mini Program page imports and `src/utils/material.js` to `src/core/`.
- Redirected all seven core Node tests to CommonJS default imports from `src/core/`.

## Verification

- RED: `node tests/scheduler.test.mjs` failed with `ERR_MODULE_NOT_FOUND` for `src/core/scheduler.js` before the move.
- GREEN: all seven core Node tests passed after the move.
- `node tests/repository-structure.test.mjs` passed.

## Scope Notes

- Root duplicate modules remain unchanged.
- `home-ui` paths and `tests/home-ui.test.mjs` were not modified or staged.
