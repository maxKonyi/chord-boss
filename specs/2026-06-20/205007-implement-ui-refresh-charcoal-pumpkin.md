# Implement UI Refresh: Charcoal, Pumpkin, and Teal

## Feature Summary

Implement the UI refresh described in `specs/2026-06-20/204657-ui-refresh-charcoal-pumpkin.md`. The app should keep its existing training behavior while making the interface clearer, flatter, more modern, and less visually busy. The sidebar is the main focus, with a light center-trainer restyle for cohesion.

## Approved Requirements

- Keep the sidebar at its current `450px` desktop width.
- Keep the preset selector interaction as-is, including its pop-out behavior and preset selection flow.
- Replace the current purple/glossy gradient-heavy theme with a flat charcoal, pumpkin, and restrained teal visual direction.
- Make chord and progression groups collapsible.
- Closed chord/progression group headers must show useful selection summaries such as selected count, `All`, or `None`.
- Move `Make 5th Optional for 7th+ chords` and `Mute audio` into an `Advanced` section.
- Lightly restyle the center trainer area so question display, timer, feedback, score, and controls match the new theme.
- Reduce inline and duplicate styling where practical, especially in `src/Sidebar.jsx`.
- Preserve all existing training, MIDI, preset, setting persistence, chord selection, progression selection, scoring, timer, and keyboard behavior.

## In-Scope Code Paths

- `src/Sidebar.jsx`
  - Main markup cleanup target.
  - Add collapsible chord/progression sections.
  - Add selection summary helpers.
  - Move low-frequency settings into `Advanced`.
  - Replace inline styles with class names where practical.
  - Keep `PresetSelector` behavior intact.

- `src/styles/style.css`
  - Theme tokens, base app background, base typography, and shared control defaults.

- `src/styles/sidebar.css`
  - Sidebar layout, settings sections, tabs, chord/progression collapsibles, chips, MIDI/session controls, Advanced section, Help modal, and preset visual refresh.

- `src/styles/trainer.css`
  - Center trainer layout, question display, timer, feedback, score, progressions, and buttons.

- `src/components/trainer/SessionControls.jsx`
  - Add semantic button classes if needed.

- `src/components/trainer/*`
  - Small class-name/style alignment only if needed for the center restyle.

- `src/App.jsx`
  - Only light cleanup of inline layout or keyboard-adjacent styling if it directly supports the refresh.

## Constraints

- Do not introduce new runtime dependencies.
- Do not redesign the preset selector interaction.
- Do not change game logic or data structures.
- Do not change localStorage keys or persistence semantics.
- Do not use purple as a primary theme color.
- Do not create a landing-page style layout; keep the trainer as the first screen.
- Avoid broad global styling that accidentally makes specialized controls hard to reason about.

## Acceptance Criteria

1. The app uses a charcoal/pumpkin theme with restrained teal highlights and no dominant purple-gradient styling in the refreshed sidebar or center trainer UI.
2. The sidebar remains `450px` wide on desktop and remains scrollable.
3. Sidebar sections are clearer and less cluttered, with reusable classes replacing the most prominent inline styles in `src/Sidebar.jsx`.
4. Chord quality groups are collapsible and each collapsed/expanded header shows a selection summary.
5. Progression groups are collapsible and each collapsed/expanded header shows a selection summary.
6. Toggling chord and progression chips continues to update the same settings arrays as before.
7. The `Qualities` / `Progressions` tab behavior remains unchanged.
8. The preset selector still opens as a pop-out, closes on outside click, and calls `handleSelectPreset` on preset selection.
9. `Make 5th Optional for 7th+ chords` and `Mute audio` appear under an `Advanced` section.
10. The center trainer question panel, timer, score/lives area, feedback panel, and session buttons visually align with the new flat theme.
11. Existing automated tests pass.
12. The production build succeeds.

## Expected Local Checks

- `npm test`
- `npm run build`

If a visual check is practical, run the app locally and inspect the updated UI at desktop width. If not practical in the implementation context, report that limitation.

## Orchestrator Report

Implementation plan: `specs/2026-06-20/205007-implement-ui-refresh-charcoal-pumpkin.md`

Source decision map: `specs/2026-06-20/204657-ui-refresh-charcoal-pumpkin.md`

Subagents:

- Implementer: `019ee84d-65f5-7131-9460-479858b231c4` (`Pasteur`)
- Acceptance checker: `019ee852-d835-7682-a333-c2bd08fab8b2` (`Hooke`)
- Code reviewer: `019ee853-1db5-78c2-acb2-578c5aa189ff` (`Locke`)

Loop count: 2 implementation passes, 2 verification passes.

Implementation outcome:

- The sidebar refresh was implemented in `src/Sidebar.jsx`, `src/styles/sidebar.css`, and shared/base styling.
- Chord quality groups and progression groups are collapsible and include selection summaries.
- Optional fifth and mute audio are now in an Advanced section.
- Preset selector behavior was preserved.
- The center trainer UI was lightly refreshed in `src/styles/trainer.css` and `src/components/trainer/SessionControls.jsx`.
- Regression coverage was added in `tests/run-tests.js`.

Verifier outcomes:

- First acceptance check found no meaningful in-scope findings.
- First code review found that `.chord-trainer-score` still inherited old purple styling and that Help modal content had been reduced.
- The implementer fixed both issues by adding refreshed `.chord-trainer-score` styling, restoring Help modal Chord Types and Tips sections, and strengthening the static regression contract.
- Final acceptance check found no meaningful in-scope findings.
- Final code review confirmed the functional/style findings were resolved. One low-severity residual caveat remains: the UI regression test is still primarily source-string based rather than a full DOM/cascade test.

Final local checks run by orchestrator:

- `npm.cmd test`: passed, 38 tests.
- `npm.cmd run build`: passed.

Visual/manual check status:

- The implementer attempted in-app browser inspection, but the browser runtime failed with a Windows sandbox `CreateProcessAsUserW failed: 5` error.
- The orchestrator started the Vite dev server and verified `http://127.0.0.1:5173/` returned HTTP 200 so the UI can be manually inspected.

Documentation:

- No feature documentation under `docs/<name>/README.md` was created or updated; this UI refresh did not require repository feature-doc updates.

Remaining caveats:

- `src/styles/keyboard.css` still contains some older purple keyboard-specific styling. This was accepted as out of scope because the plan only allowed optional keyboard color alignment and prioritized preserving keyboard behavior.
- Existing Node/Vite warnings remain: typeless package ES module warning during tests and Vite CJS Node API deprecation during build.
