# Composer Piano Trainer Refactor Audit

Date: 2026-06-19

## Current Shape

- Static React app served from `docs/` by `server.js`.
- React and ReactDOM load from UMD CDNs.
- JSX is transformed in the browser by Babel Standalone.
- Cross-file dependencies are browser globals: `MusicTheory`, `Presets`, `window.hooks`, `Sidebar`, and `ChordTrainer`.
- Core game logic is split between `docs/chord-trainer.js`, `docs/music-theory.js`, and `docs/hooks/useGameState.js`.

## Fixed In First Pass

- MIDI "All inputs" selection now normalizes to `null` consistently across the app and sidebar.
- Timer timeout is now single-shot instead of firing every interval after expiry.
- Response-time scoring now reaches the reducer instead of always awarding the fixed base score.
- Lives now clamp at zero.
- Wrong answers can now end the game when lives are exhausted.
- Case-sensitive audio paths now match the files in `docs/sounds/`.
- Added a lightweight Node test runner for pure browser-global logic.
- Added `package.json` scripts for `npm test` and `npm start`.

## Highest Priority Risks

1. Browser-global architecture makes script order fragile.
   A missing or reordered script can break the app at runtime without a build-time signal.

2. `docs/chord-trainer.js`, `docs/music-theory.js`, and `docs/sidebar.js` are each over 1,000 lines.
   This makes behavioral changes difficult to isolate and test.

3. In-browser Babel and development React are convenient but slow and dated for regular work.
   A small Vite migration would provide fast local dev, production builds, and test-friendly modules.

4. React state flow has overlapping sources of truth.
   `ChordTrainer` keeps local game state while `useGameState` also owns state transitions, which causes stale-value bugs around lives, score, and question count.

5. Music theory helpers contain duplicate/debug code.
   `MusicTheory.testEnharmonicSpellings` is defined twice, with the later version replacing the first and logging heavily.

6. Many UI controls are inline-styled and repeated.
   The sidebar is especially hard to maintain because it mixes layout, control definitions, local storage writes, and data mapping.

## Recommended Refactor Roadmap

1. Stabilize behavior.
   Keep expanding `tests/run-tests.js` around scoring, validation, progressions, and settings normalization before changing structure.

2. Extract pure domain modules.
   Move MIDI parsing, scoring, chord validation, progression generation, and settings defaults into plain JS modules with tests.

3. Consolidate game state.
   Make `useGameState` the only owner of lives, score, attempts, summary state, and processing locks. Keep local React state for display-only concerns.

4. Split components.
   Break `ChordTrainer` into `TrainerShell`, `QuestionPanel`, `ProgressionPanel`, `SessionControls`, `GameSummary`, and `KeyboardPanel`.

5. Split sidebar data from rendering.
   Represent chord groups and progression groups as arrays, then render reusable toggle groups instead of hand-written repeated buttons.

6. Move to a small build tool.
   Vite is the lowest-friction step: keep React, convert files to modules, remove Babel Standalone, and add a production build output.

7. Add browser smoke tests after the build migration.
   Use a real page test to cover app boot, preset selection, start/end game, and no-console-error guarantees.

## Verification Added

- `npm test` runs the current lightweight test suite.
- Temporary local server smoke verified:
  - `/`
  - `/midi-utils.js`
  - `/hooks/useTimer.js`
  - `/hooks/useGameState.js`
  - `/music-theory.js`
  - `/sounds/correct.wav`
  - `/sounds/life-Loss.wav`
  - `/sounds/game-Over.wav`
