# Stage 1 Correctness Baseline

## Summary

Begin implementing the first stage of the Composer Piano Trainer modernization plan. This stage should make current game behavior safer and better tested before larger architecture changes such as a Vite migration.

The authoritative decision-map spec is:

- `specs/2026-06-19/160159-modernization-refactor-decision-map.md`

The implementation should continue from the current working tree, including the previous audit fixes and the lightweight test runner already added.

## Approved Scope

Focus on app architecture and game correctness. Do not migrate to Vite yet. Do not prioritize UI polish or performance tuning.

In scope:

- Expand tests around reducer transitions, scoring, timeout, wrong-answer game-over, MIDI input normalization, and chord validation.
- Extract small pure helpers where they reduce coupling and make behavior easier to test.
- Reduce correctness coupling between `docs/chord-trainer.js` and `docs/hooks/useGameState.js` where practical.
- Keep the current static app shape and browser-global runtime working.
- Preserve current user-facing trainer behavior unless a tested correctness bug is being fixed.

Out of scope:

- Vite migration.
- GitHub Pages deployment workflow.
- Broad UI redesign or polish.
- Large component decomposition.
- New chord content or preset expansion.
- Backend services.

## Relevant Files

- `docs/chord-trainer.js`: current main trainer component and many pure-ish helper functions.
- `docs/hooks/useGameState.js`: reducer and game state hook.
- `docs/hooks/useTimer.js`: timer hook.
- `docs/music-theory.js`: chord generation and validation helpers.
- `docs/midi-utils.js`: small MIDI normalization helper introduced during audit.
- `docs/index.html`: browser-global script loading.
- `tests/run-tests.js`: lightweight Node test runner.
- `package.json`: currently exposes `test` and `start` scripts.

## Required Behavior To Protect

- Correct answers increase score using response-time base points and current streak multiplier.
- Wrong answers decrement lives at most once per distinct full-chord attempt and transition to game-over at zero lives.
- Timeouts decrement lives once and transition to game-over at zero lives.
- Practice mode should not behave like a scored timed session.
- Root-position validation requires the bass note to be the root.
- Free inversion validation accepts any inversion with exactly the required pitch classes.
- Specific inversion validation requires the expected bass note.
- Optional fifth remains valid for supported seventh-or-larger chords and should not apply to plain sixth chords.
- MIDI "All inputs" maps to the app's internal all-inputs state.
- Existing static app script loading remains intact.

## Implementation Guidance

- Prefer pure helpers for behavior that can be tested outside React.
- Keep browser globals working for now. Any new helper that must be used by current browser scripts should be exposed in the same style as existing helpers.
- Keep changes small and targeted. This stage should strengthen the current app before deeper migration work.
- Do not add comments that point to this plan or future migration work.
- Avoid making `tests/run-tests.js` depend on a browser or network.

## Acceptance Criteria

- The test suite covers the required behavior areas listed above at a meaningful unit level.
- `npm.cmd test` passes.
- A temporary local static server can serve `/`, core JS files, and referenced audio files with correct MIME types.
- No Vite migration or deployment workflow is introduced.
- No unrelated visual redesign is introduced.
- Any extracted helpers remain usable by the current static browser app.

## Expected Local Checks

- `npm.cmd test`
- Local server smoke for:
  - `/`
  - `/midi-utils.js`
  - any newly extracted helper script
  - `/hooks/useTimer.js`
  - `/hooks/useGameState.js`
  - `/music-theory.js`
  - `/sounds/correct.wav`
  - `/sounds/life-Loss.wav`
  - `/sounds/game-Over.wav`

## Orchestrator Report

Completed: 2026-06-19

Plan file:

- `specs/2026-06-19/171834-stage-1-correctness-baseline.md`

Subagents:

- Implementer: `019ee265-28cc-7a71-99d5-1d0873daea15` (`McClintock`)
- Acceptance checker: `019ee267-9a89-70d2-bb12-42d3367e39ef` (`Euler`)
- Code reviewer: `019ee267-c658-7a21-8c96-716286e51350` (`Peirce`)

Loop count:

- Two implementation passes.
- First verifier pass found blocking issues.
- Second verifier pass accepted the result.

Implementation outcome:

- Added `docs/game-logic.js` for pure game helpers.
- Expanded `tests/run-tests.js` to cover Stage 1 correctness behavior.
- Updated `docs/hooks/useGameState.js` so reducer transitions handle response-time scoring and zero-lives game-over paths.
- Updated `docs/chord-trainer.js` to use shared helpers and fix progression advancement.
- Updated `docs/music-theory.js` to use the shared optional-fifth eligibility rule.
- Updated `docs/index.html` to load `game-logic.js` while preserving the current static browser-global runtime.

Verifier outcomes:

- Initial acceptance check failed because `docs/chord-trainer.js` had a temporal-dead-zone risk around `generateNewQuestion` callback ordering and a progression-mode `nextChord` shadowing crash.
- Initial code review confirmed the progression-mode crash and noted the missing regression coverage.
- Second implementation pass fixed both issues and added a regression test around progression chord preparation.
- Final acceptance check: pass for Stage 1 acceptance.
- Final code review: no meaningful in-scope findings remain.

Final local verification:

- `npm.cmd test` passed with 13 tests.
- Temporary static server smoke passed for `/`, `/midi-utils.js`, `/game-logic.js`, `/chord-trainer.js`, `/hooks/useTimer.js`, `/hooks/useGameState.js`, `/music-theory.js`, `/sounds/correct.wav`, `/sounds/life-Loss.wav`, and `/sounds/game-Over.wav`.

Documentation updates:

- No feature documentation under `docs/<name>/README.md` was needed.
- This orchestrator report was appended to the plan file.

Remaining caveats:

- No browser-render test harness exists yet, so React render behavior is still verified through source-level ordering, unit tests, and static server smoke rather than a mounted component/browser test.
- The worktree remains intentionally dirty with the Stage 1 changes and previous planning/audit artifacts.
