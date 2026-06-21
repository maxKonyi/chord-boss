# Stage 4 State Model Consolidation

## Summary

Continue the Chord Boss modernization by making the game-session state model clearer and less prone to stale state bugs. The focus is consolidating game-owned state and transitions around the existing reducer/hook model while preserving current gameplay, UI, Vite build, and GitHub Pages deployment.

The authoritative decision-map spec is:

- `specs/2026-06-19/160159-modernization-refactor-decision-map.md`

Completed prior stages:

- `specs/2026-06-19/171834-stage-1-correctness-baseline.md`
- `specs/2026-06-20/115232-stage-2-static-module-boundaries.md`
- `specs/2026-06-20/132502-stage-3-vite-migration.md`
- `specs/2026-06-20/165249-github-pages-deployment.md`

## Approved Scope

In scope:

- Make `src/hooks/useGameState.js` and its reducer the clearer owner of game-session state where practical.
- Reduce duplicated or stale game-session state in `src/ChordTrainer.jsx`.
- Preserve current gameplay and visual behavior.
- Add or update tests around reducer transitions and session flow.
- Keep Vite build and GitHub Pages deployment support working.

State areas to consider:

- lives
- score
- streak
- multiplier
- question count
- total attempts
- summary/game-over state
- processing state
- completed progression steps
- feedback type/message where it is already reducer-owned

Out of scope:

- UI redesign.
- New gameplay features.
- Broad component decomposition.
- MIDI hardware/browser automation.
- GitHub Pages workflow changes unless needed to preserve current checks.
- Full rewrite of the trainer loop.

## Relevant Current Files

- `src/ChordTrainer.jsx`: main trainer component and current owner of several local game/session states.
- `src/hooks/useGameState.js`: reducer/hook for core game state.
- `src/game-logic.js`: pure helper rules for scoring, timing, signatures, progression prep, and chord metadata.
- `src/trainer-settings.js`: settings defaults/persistence helpers.
- `src/music-theory.js`: chord generation/validation.
- `tests/run-tests.js`: Node test suite currently covering reducer/domain/build/deploy behavior.
- `package.json`: test/build scripts.
- `server.js`: serves Vite `dist/` locally.

Legacy `docs/` files may still exist, but production behavior and tests should target `src/`.

## Desired State Ownership

The reducer should be the primary owner for game-session state such as:

- game phase/state
- lives
- score
- streak
- multiplier
- question count
- total attempts
- completed progression steps
- summary visibility
- feedback metadata
- processing guard where feasible

React component-local state should remain appropriate for:

- current chord/progression objects where moving them would require a larger rewrite.
- settings and persisted preferences.
- UI-only toggles and display-only details.
- timer hook state.
- failed chord notes/name if moving them would broaden the stage too much.

Use judgment. This stage should meaningfully reduce duplicated state without forcing a high-risk rewrite.

## Behavior To Preserve

- App opens directly into the chord trainer.
- Settings persistence remains intact.
- Practice mode behavior remains intact.
- Timed modes, scoring, wrong-answer handling, timeout handling, and game-over behavior remain intact.
- Progression mode advancement and completion tracking remain intact.
- Failed chord display on game-over remains intact.
- Current CSS/UI layout remains materially unchanged.
- GitHub Pages deployment workflow remains intact.

## Implementation Guidance

- Prefer reducer actions/selectors/helpers with tests over component-local state where the state is part of the game session.
- Avoid adding parallel sources of truth.
- Avoid large component extraction in this stage unless it is directly needed for state consolidation.
- Keep tests deterministic and browser-free.
- Add tests before behavior changes where practical.
- Keep the production Vite path as source of truth.
- Do not add plan/spec references or future-work notes in production comments, test names, or identifiers.
- Do not revert unrelated worktree changes.

## Acceptance Criteria

- Reducer tests cover any newly consolidated state transitions.
- Existing Stage 1, Stage 2, deployment, and build tests still pass.
- `src/ChordTrainer.jsx` has fewer duplicated game-session state responsibilities than before.
- No gameplay/UI redesign is introduced.
- `npm.cmd test` passes.
- `npm.cmd run build` passes.
- Production smoke through `server.js` against `dist/` passes for `/`, built JS/CSS, SVG, and WAV assets.
- GitHub Pages workflow remains present and compatible.

## Expected Local Checks

- `npm.cmd test`
- `npm.cmd run build`
- Production smoke through `server.js` against built `dist/`:
  - `/`
  - built JS asset
  - built CSS asset
  - `/gem-icon.svg`
  - `/sounds/correct.wav`
  - `/sounds/wrong.wav`
  - `/sounds/life-Loss.wav`
  - `/sounds/game-Over.wav`

## Orchestrator Report

Completed: 2026-06-20

Plan file:

- `specs/2026-06-20/182012-stage-4-state-model-consolidation.md`

Subagents:

- Implementer: `019ee7c4-6a61-78c1-9a1a-bdadb39ba50e` (`Averroes`)
- Acceptance checker: `019ee7d6-e05e-7613-830d-ad752c07b38a` (`Bacon`)
- Code reviewer: `019ee7d7-1035-77d3-804a-d7b69e728537` (`Curie`)

Loop count:

- One implementation pass.
- Verifier pass found no meaningful in-scope findings.

Implementation outcome:

- Moved `highestStreak` ownership into `src/hooks/useGameState.js`.
- Moved transient feedback metadata through reducer actions.
- Removed duplicated local `feedback`, local `highestStreak`, and stored derived `accuracy` state from `src/ChordTrainer.jsx`.
- Kept settings, current chord/progression objects, timer state, failed chord display, and UI structure local.
- Added reducer tests for highest streak, feedback set/clear, explicit correct-answer feedback, and progression feedback preservation.

Verifier outcomes:

- Acceptance checker found Stage 4 criteria satisfied and ran tests, build, and production smoke successfully.
- Code reviewer found no meaningful in-scope findings in reducer ownership, feedback actions, local state removal, or scope.
- Code reviewer suggested a future component-flow/source-level test around feedback sequencing in `src/ChordTrainer.jsx`, but did not identify it as a blocking issue.

Final local verification:

- `npm.cmd test` passed with 32 tests.
- `npm.cmd run build` passed.
- Production smoke through `server.js` passed on port `18733` for `/`, built JS, built CSS, `gem-icon.svg`, and all WAV assets.

Documentation updates:

- No feature documentation under `docs/<name>/README.md` was needed.
- This orchestrator report was appended to the plan file.

Remaining caveats:

- Automated tests still do not interact with real MIDI hardware.
- No browser-render/component harness exists yet.
- `npm.cmd test` still prints Node's typeless ESM warning, and `npm.cmd run build` still prints Vite's CJS Node API deprecation warning; both commands pass.
- Stage 4 changes are local and uncommitted at the time of this report.
