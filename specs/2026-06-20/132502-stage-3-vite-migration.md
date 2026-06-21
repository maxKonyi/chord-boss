# Stage 3 Vite Migration

## Summary

Migrate Composer Piano Trainer from CDN React plus in-browser Babel to a modern Vite + React build while preserving current app behavior. This stage creates a real build pipeline and source structure, but does not add the GitHub Pages deployment workflow yet.

The authoritative decision-map spec is:

- `specs/2026-06-19/160159-modernization-refactor-decision-map.md`

Completed prior stages:

- `specs/2026-06-19/171834-stage-1-correctness-baseline.md`
- `specs/2026-06-20/115232-stage-2-static-module-boundaries.md`

## Approved Scope

In scope:

- Introduce Vite + React as the app build/runtime standard.
- Replace CDN React, ReactDOM, and Babel Standalone runtime usage with package-based React and compiled JSX.
- Move application source toward a modern `src/` structure where practical.
- Preserve current CSS, sounds, SVG, and visible app behavior.
- Preserve current Stage 1 and Stage 2 correctness tests.
- Add and verify a production build command.
- Configure build paths so the app remains suitable for static hosting and later GitHub Pages deployment.

Out of scope:

- GitHub Pages deployment workflow.
- GitHub Actions setup.
- Major UI redesign or polish.
- New gameplay features.
- Large state-model redesign beyond what is necessary for migration.
- Backend services.

## Relevant Current Files

- `docs/index.html`: current static app entry and script loading.
- `docs/app.js`: root React app and MIDI wiring.
- `docs/chord-trainer.js`: main trainer component.
- `docs/sidebar.js`: sidebar UI.
- `docs/hooks/useTimer.js`: timer hook.
- `docs/hooks/useGameState.js`: game state hook.
- `docs/music-theory.js`: music theory helpers.
- `docs/presets.js`: presets and progression data.
- `docs/midi-utils.js`: MIDI helper.
- `docs/game-logic.js`: game/domain helper.
- `docs/trainer-settings.js`: trainer settings helper.
- `docs/*.css`: existing styles.
- `docs/sounds/*.wav`: audio assets.
- `docs/gem-icon.svg`: SVG asset.
- `tests/run-tests.js`: current Node-run test suite.
- `package.json`: current scripts.
- `server.js`: current static server for `docs/`.

## Desired Project Shape

The implementation should move toward a conventional Vite app shape:

- `index.html` at repo root for Vite.
- `src/main.jsx` or equivalent React entry.
- `src/` modules/components/helpers for app code.
- Static assets either imported from source or placed in `public/` when path-stable access is needed.
- `package.json` scripts for at least:
  - `test`
  - `build`
  - optionally `dev` / `preview`

Use judgment to keep the migration staged. It is acceptable to preserve some browser-global compatibility files temporarily if that sharply reduces risk, but the Vite app itself should not depend on CDN React or in-browser Babel.

## Behavior To Preserve

- App opens directly into the chord trainer.
- MIDI device handling and "All inputs" behavior continue to work in Chrome/Chromium.
- Chord trainer settings persist correctly.
- Presets still apply correctly.
- Practice mode, timed modes, scoring, wrong-answer handling, timeout handling, and progression behavior remain as protected by tests.
- Piano keyboard display and audio asset paths still work in the built app.
- Existing CSS appearance remains materially unchanged.

## Dependency And Environment Notes

This stage may require installing npm packages such as:

- `vite`
- `react`
- `react-dom`
- `@vitejs/plugin-react`

If dependencies are not already installed and package installation fails due to restricted network access, report the blocker rather than broadening scope.

## Implementation Constraints

- Do not add the GitHub Pages deployment workflow in this stage.
- Do not rewrite UI styling.
- Keep the migration as behavior-preserving as possible.
- Keep tests runnable through `npm.cmd test`.
- Add or update tests only where needed to preserve behavior or support migrated module imports.
- Avoid relying on real MIDI devices in automated tests.
- Preserve current source files only when useful; remove obsolete CDN/Babel entry paths if the Vite app no longer uses them and the removal is safe.
- Do not add plan/spec references or future-work notes in production comments, test names, or identifiers.
- Do not revert unrelated dirty worktree changes.

## Acceptance Criteria

- The app no longer requires CDN React, ReactDOM, or Babel Standalone to run in the normal development/build path.
- `npm.cmd test` passes.
- `npm.cmd run build` passes and produces static build output.
- The build output includes required CSS, SVG, and WAV assets.
- The app remains suitable for static hosting.
- No GitHub Pages workflow is introduced.
- No unrelated visual redesign is introduced.
- Stage 1 and Stage 2 correctness behavior remains covered.

## Expected Local Checks

- `npm.cmd test`
- `npm.cmd run build`
- If practical after build:
  - serve the production build output with a local static server
  - smoke request `/`, core built JS/CSS assets, and audio assets

## Orchestrator Report

Completed: 2026-06-20

Plan file:

- `specs/2026-06-20/132502-stage-3-vite-migration.md`

Subagents:

- Implementer: `019ee6b5-bfdf-7b01-8282-6d14338b1590` (`Feynman`)
- Acceptance checker: `019ee74c-6152-70c0-8f2a-45ed2de22541` (`Einstein`)
- Code reviewer: `019ee74c-8e15-74c3-94ed-e195b3e1993e` (`Archimedes`)

Loop count:

- Two implementation passes.
- Initial implementation was blocked until npm dependencies were installed with approved escalation.
- First verifier pass found three concrete issues.
- Second verifier pass accepted the result.

Dependency notes:

- `npm.cmd install --no-audit --no-fund` was approved and completed successfully, adding the Vite/React dependency tree.

Implementation outcome:

- Added Vite + React dependencies and `package-lock.json`.
- Added root `index.html`, `vite.config.js`, and `src/` Vite/React application source.
- Added `public/` static assets for the SVG and WAV files.
- Preserved existing CSS by moving/copying it into the Vite source path.
- Updated `server.js` to serve `dist/` instead of the legacy `docs/` runtime.
- Moved the Node test suite to exercise production `src/` modules directly instead of VM-loading `docs/`.
- Added settings persistence wiring through `TrainerSettings.createPersistentUpdater()` in the Vite path.
- Added tests guarding the Vite entry, package scripts, static-hosting config, and `server.js` build-output behavior.

Verifier outcomes:

- Initial acceptance check passed the core Vite criteria but had an incomplete preview smoke.
- Initial code review found:
  - the legacy CDN/Babel `docs/` runtime was still the obvious `server.js` path,
  - tests still exercised `docs/` instead of production `src/` modules,
  - settings persistence was incomplete in the Vite path.
- Second implementation pass fixed these issues.
- Final acceptance check: no meaningful in-scope findings remain.
- Final code review: no meaningful in-scope findings remain based on completed checks.

Final local verification:

- `npm.cmd test` passed with 26 tests.
- `npm.cmd run build` passed.
- Production smoke through `server.js` passed on port `18731` for `/`, built JS, built CSS, `gem-icon.svg`, and all WAV assets.

Documentation updates:

- No feature documentation under `docs/<name>/README.md` was needed.
- This orchestrator report was appended to the plan file.

Remaining caveats:

- Automated tests do not interact with real MIDI hardware.
- No browser-render/component harness exists yet.
- `npm.cmd test` prints Node's typeless ESM warning because tests import ESM `src/*.js` modules from a CommonJS runner.
- `npm.cmd run build` prints Vite's CJS Node API deprecation warning, but the build succeeds.
- The worktree remains intentionally dirty with Stage 1, Stage 2, Stage 3, audit, test, package, and spec artifacts.
