# Dark Blue Hardware-Inspired UI Pass

## Feature Summary

Refine the current Chord Boss UI with a compact visual pass inspired by the provided dark hardware/audio-control reference image. This is a style evolution of the recently refreshed UI, not a layout or feature expansion. The palette should keep warm orange as the main accent, but shift the dark neutral base toward dark blue-charcoal rather than pure gray.

## Approved Requirements

- Preserve the current app layout, sidebar width, collapsible groups, Advanced section, preset pop-out behavior, game behavior, MIDI behavior, settings persistence, and keyboard behavior.
- Keep the existing charcoal/pumpkin/teal direction, but make the dark surfaces lean more dark blue.
- Add a subtle tactile hardware/audio-control feel inspired by the reference:
  - Dark blue-charcoal surfaces.
  - Warm orange highlights.
  - Subtle inset/raised shadows where helpful.
  - Rounded, compact controls.
  - Sliders, buttons, tabs, chips, and toggles that feel more polished and dimensional.
- Do not add unrelated widgets from the reference image such as ratings, equalizer controls, pagination, rotary knobs, or media transport controls.
- Keep the result minimalist and app-focused, not skeuomorphic-heavy.

## In-Scope Code Paths

- `src/styles/style.css`
  - Palette tokens, global background, base control language.

- `src/styles/sidebar.css`
  - Sidebar surface, sections, collapsible headers, chips, tabs, preset visuals, Advanced styling, and form controls.

- `src/styles/trainer.css`
  - Center trainer panels, question display, timer, score, feedback, progression display, and session buttons.

- `src/Sidebar.jsx`
  - Only if class names or markup hooks are needed for styling the existing controls. Avoid behavior changes.

- `src/components/trainer/SessionControls.jsx`
  - Only if class names need minor adjustment. Avoid behavior changes.

- `tests/run-tests.js`
  - Update or add focused regression coverage if existing class/style contracts change.

## Constraints

- Do not introduce new dependencies.
- Do not change game logic, MIDI logic, preset data, chord/progression selection semantics, localStorage keys, or route/build configuration.
- Do not rework the layout or add new panels.
- Do not make the UI read as purple again.
- Avoid large decorative effects; dimensional styling should be subtle and functional.
- Keep text readable and controls crisp at the existing sidebar width.

## Acceptance Criteria

1. The main dark theme visibly leans dark blue-charcoal rather than neutral gray.
2. Warm orange remains the dominant accent for primary actions and active states.
3. Teal remains restrained and is only used for secondary/focus/highlight details.
4. Buttons, selects, tabs, chips, collapsible headers, and the delay range control feel more tactile and polished through subtle shadow/inset/border treatment.
5. The center trainer panels, timer, feedback, score, and controls visually align with the hardware-inspired style.
6. The sidebar layout, `450px` width, collapsible group behavior, selection summaries, Advanced section, and preset pop-out behavior remain unchanged.
7. No unrelated reference-image widgets are added.
8. Existing tests pass.
9. Production build succeeds.

## Expected Local Checks

- `npm.cmd test`
- `npm.cmd run build`

If a visual check is practical, inspect the running app at desktop width and report whether the UI reads closer to the supplied dark blue hardware-control reference.

## Orchestrator Report

Implementation plan: `specs/2026-06-20/222300-dark-blue-hardware-ui-pass.md`

Subagents:

- Implementer: `019ee8a2-2224-7c13-a300-fb101fa65f25` (`Boole`)
- Acceptance checker: `019ee8a4-c897-7c10-9fff-0d53a944986c` (`Huygens`)
- Code reviewer: `019ee8a4-f2c8-7062-8c86-9128ce08535c` (`Faraday`)

Loop count: 1 implementation pass, 1 verification pass.

Implementation outcome:

- The visual theme was shifted toward dark blue-charcoal surfaces in `src/styles/style.css`.
- Sidebar controls, collapsible groups, chips, tabs, preset controls, and range styling were refined in `src/styles/sidebar.css`.
- Center trainer panels, timer, feedback, score, progression display, and session controls were aligned with the tactile hardware-inspired treatment in `src/styles/trainer.css`.
- Regression coverage was updated in `tests/run-tests.js`.
- No JSX/app behavior files were changed in this pass.

Verifier outcomes:

- Acceptance checker found no meaningful in-scope findings.
- Code reviewer found no meaningful in-scope findings.
- Both verifiers confirmed layout and behavior preservation, including the `450px` sidebar, preset pop-out behavior, collapsible sections, and absence of unrelated reference-image widgets.

Final local checks run by orchestrator:

- `npm.cmd test`: passed, 39 tests.
- `npm.cmd run build`: passed.

Visual/manual check status:

- The implementer attempted in-app browser inspection, but the browser runtime failed with a Windows sandbox `CreateProcessAsUserW failed: 5` error.
- The implementer and acceptance checker verified the Vite dev server responded over HTTP.

Documentation:

- No feature documentation under `docs/<name>/README.md` was created or updated; this was a scoped visual refinement.

Remaining caveats:

- Existing Node/Vite warnings remain: typeless package ES module warning during tests and Vite CJS Node API deprecation during build.
