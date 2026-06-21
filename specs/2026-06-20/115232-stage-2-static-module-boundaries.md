# Stage 2 Static-Compatible Module Boundaries

## Summary

Implement the second stage of the Composer Piano Trainer modernization plan: improve module/domain boundaries while preserving the current static `docs/` app, browser-global runtime, and user-facing trainer behavior.

The authoritative decision-map spec is:

- `specs/2026-06-19/160159-modernization-refactor-decision-map.md`

The completed Stage 1 baseline is:

- `specs/2026-06-19/171834-stage-1-correctness-baseline.md`

## Approved Scope

Focus on low-risk module boundaries that make later Vite/ES-module migration easier. Keep the app static-compatible for now.

In scope:

- Extract pure domain/helper logic out of oversized browser files where it reduces coupling and can be tested.
- Keep using browser-global exports such as `window.GameLogic`, `window.MidiUtils`, or similar for current static script loading.
- Reduce `docs/chord-trainer.js` responsibility by moving pure rules and data-shaping helpers out of React component code.
- Add or update tests for extracted helpers.
- Preserve all Stage 1 correctness behavior and tests.
- Preserve current UI and current game design.

Out of scope:

- Vite migration.
- ES module conversion requiring a build step.
- GitHub Pages deployment workflow.
- Large React component decomposition.
- Visual redesign or polish.
- New chord content or preset expansion.
- Backend services.

## Relevant Current Files

- `docs/chord-trainer.js`: large React trainer component and remaining pure-ish helper code.
- `docs/game-logic.js`: Stage 1 pure helpers for timing, scoring, required note count, wrong-attempt signatures, and progression chord preparation.
- `docs/midi-utils.js`: MIDI selection normalization helper.
- `docs/hooks/useGameState.js`: reducer and game state hook.
- `docs/music-theory.js`: chord generation and validation helpers.
- `docs/presets.js`: preset and progression data/helpers.
- `docs/index.html`: browser-global script loading order.
- `tests/run-tests.js`: lightweight Node test runner.
- `package.json`: exposes `test` and `start`.

## Desired Boundary Improvements

Prioritize small, testable extractions rather than broad rewrites.

Candidate extraction areas:

- Settings defaults and normalization currently embedded in `ChordTrainer`.
- Preset application side effects or shape normalization if duplicated in UI paths.
- Progression selection/preparation helpers that are currently tied to React callbacks.
- MIDI selection/status helpers that can be tested outside React.
- Any remaining score/timing/game rules still living in `docs/chord-trainer.js`.

Use judgment: extract helpers when they make behavior clearer and reduce coupling; do not create abstractions merely for symmetry.

## Behavior To Preserve

- Stage 1 tests continue to pass.
- Correct answers use response-time base points and multiplier.
- Wrong answers and timeouts transition to game-over at zero lives.
- Practice mode remains non-timed/non-pressure.
- Progression advancement remains fixed and does not shadow reducer actions.
- Root/free/specific inversion chord validation behavior remains unchanged.
- Optional fifth behavior remains unchanged.
- MIDI "All inputs" normalization remains unchanged.
- Existing static script loading remains intact.

## Implementation Constraints

- Keep all new browser-consumed helpers compatible with classic scripts.
- If a new file is added under `docs/`, update `docs/index.html` script order as needed.
- Keep tests runnable through Node without a browser or network.
- Do not make tests dependent on real MIDI devices.
- Do not add plan/spec references or future-work notes in production comments, test names, or identifiers.
- Do not revert or normalize unrelated dirty worktree changes.

## Acceptance Criteria

- `docs/chord-trainer.js` has less pure domain/settings/progression rule code than before, with that behavior moved to testable helper(s).
- Extracted helpers have meaningful tests in `tests/run-tests.js` or another Node-run test file invoked by `npm.cmd test`.
- `npm.cmd test` passes.
- Temporary static server smoke can serve `/`, core JS files, all newly added helper scripts, and referenced audio assets with correct MIME types.
- No Vite/build-tool/deployment workflow is introduced.
- No unrelated visual redesign is introduced.
- Current static browser-global runtime remains valid.

## Expected Local Checks

- `npm.cmd test`
- Temporary static server smoke for:
  - `/`
  - `/midi-utils.js`
  - `/game-logic.js`
  - any newly added helper script
  - `/chord-trainer.js`
  - `/hooks/useTimer.js`
  - `/hooks/useGameState.js`
  - `/music-theory.js`
  - `/presets.js`
  - `/sounds/correct.wav`
  - `/sounds/life-Loss.wav`
  - `/sounds/game-Over.wav`

## Orchestrator Report

Completed: 2026-06-20

Plan file:

- `specs/2026-06-20/115232-stage-2-static-module-boundaries.md`

Subagents:

- Implementer: `019ee661-0fa0-78f0-a613-89a1cff97c3b` (`Mencius`)
- Acceptance checker: `019ee663-7c7f-7d70-974d-5f1fe5a9eea7` (`Gauss`)
- Code reviewer: `019ee663-a720-7c43-8fef-e4e8cfa57e34` (`Nietzsche`)

Loop count:

- Two implementation passes.
- First verifier pass found three concrete regressions.
- Second verifier pass accepted the result.

Implementation outcome:

- Added `docs/trainer-settings.js` for static-compatible settings defaults, normalization, safe loading, and preset application helpers.
- Expanded `docs/game-logic.js` with progression selection/key helpers, progression question creation, single-chord preparation, and progression completion identity helpers.
- Reduced pure settings/progression/single-chord rule code inside `docs/chord-trainer.js`.
- Updated `docs/index.html` to load `trainer-settings.js` before `chord-trainer.js`.
- Expanded `tests/run-tests.js` from 13 to 21 tests.

Verifier outcomes:

- Initial acceptance check found no Stage 2 conformance issue beyond the expected dirty worktree observation.
- Initial code review found:
  - explicit empty chord-type selection was being over-normalized,
  - progression completion tracked the wrong identity,
  - generated progression keys were not applied to the display state.
- Second implementation pass fixed those issues and added regression coverage.
- Final acceptance check: no meaningful in-scope Stage 2 findings remain.
- Final code review: no meaningful in-scope findings remain.

Final local verification:

- `npm.cmd test` passed with 21 tests.
- Temporary static server smoke passed for `/`, `/midi-utils.js`, `/game-logic.js`, `/trainer-settings.js`, `/chord-trainer.js`, `/hooks/useTimer.js`, `/hooks/useGameState.js`, `/music-theory.js`, `/presets.js`, `/sounds/correct.wav`, `/sounds/life-Loss.wav`, and `/sounds/game-Over.wav`.

Documentation updates:

- No feature documentation under `docs/<name>/README.md` was needed.
- This orchestrator report was appended to the plan file.

Remaining caveats:

- No browser-render/component harness exists yet. React wiring is covered by unit/source-level checks and static server smoke rather than mounted browser tests.
- The worktree remains intentionally dirty with Stage 1, Stage 2, audit, test, package, and spec artifacts.
