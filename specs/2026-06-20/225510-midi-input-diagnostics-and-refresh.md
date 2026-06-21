# MIDI Input Diagnostics and Refresh

## Summary

The MIDI parser fix alone did not restore visible keyboard response for the user. Expand the repair so the app can refresh connected MIDI inputs, expose useful diagnostics in the sidebar, and show incoming notes on the on-screen keyboard even when a controller sends notes outside the old fixed display range.

## Approved Requirements

- Keep the existing all-channel MIDI note parser fix.
- Refresh MIDI input lists when Web MIDI reports device state changes.
- Reattach MIDI message listeners when the input list changes.
- Surface useful MIDI status in the sidebar: access state, device count, selected input, active note count, and last received note/message.
- Make the visible piano keyboard respond to active MIDI notes outside the previous C3-C5 range.
- Keep trainer scoring, chord validation, settings, and visual redesign behavior unchanged except for MIDI diagnostics and keyboard visibility.
- Validate with automated tests and a production build.
- Commit and deploy the completed MIDI repair so the live GitHub Pages app can be tested.

## Decisions

- Shared MIDI message parsing remains in `src/midi-utils.js`.
- Browser-only Web MIDI access remains in `src/App.jsx`.
- Sidebar diagnostics should be lightweight and always visible when MIDI status is available.
- The keyboard should expand its rendered octave range only when active or failed notes require it, rather than permanently rendering a very large keyboard.

## Relevant Files

- `src/App.jsx`: Web MIDI access, input refresh, listener attachment, active note state, and keyboard rendering.
- `src/Sidebar.jsx`: visible MIDI status and selection UI.
- `src/midi-utils.js`: testable MIDI parsing helpers.
- `src/styles/sidebar.css`: MIDI diagnostics styling.
- `tests/run-tests.js`: regression coverage.

## Acceptance Criteria

- Valid MIDI note messages across all channels parse correctly.
- App source handles `midiAccess.onstatechange`.
- App source refreshes input snapshots through a shared refresh function.
- Listener setup depends on the current input list, not only the stable `midiAccess` object.
- Sidebar source displays MIDI access/device/active/last-note diagnostics.
- Keyboard source expands the displayed octave range to include active or failed MIDI notes.
- `npm.cmd test` passes.
- `npm.cmd run build` passes.

## Orchestrator Report

Implemented the expanded MIDI repair:

- Kept and extended the all-channel MIDI parser in `src/midi-utils.js`.
- Added `MidiUtils.getMidiNoteName()` for sidebar diagnostics.
- Added `MidiUtils.getKeyboardOctaveRange()` so the on-screen keyboard expands when active or failed notes fall outside the old C3-C5 range.
- Updated `src/App.jsx` to refresh MIDI inputs from `midiAccess.inputs`.
- Added `midiAccess.onstatechange` handling so connect/disconnect events refresh the input list.
- Updated listener setup to attach to the current `midiInputs` snapshot and rerun when that snapshot changes.
- Added last MIDI message tracking, active note count, access state, selected input name, and last note metadata to `midiStatus`.
- Added sidebar MIDI diagnostics for status, devices, listening target, active note count, last note, and errors.
- Added compact diagnostics styling in `src/styles/sidebar.css`.
- Added regression coverage for MIDI parsing, note naming, keyboard range expansion, listener refresh contracts, and sidebar diagnostics.

Validation performed:

- Confirmed the expanded tests failed before implementation for the missing helper/diagnostic/refresh behavior.
- `npm.cmd test` passed with 43 tests.
- `npm.cmd run build` passed.

Caveats:

- Automated local checks cannot request real Web MIDI hardware access. The live page still needs manual Chrome/Chromium testing with the user's MIDI keyboard.
- Existing Node `MODULE_TYPELESS_PACKAGE_JSON` and Vite CJS API warnings remain unchanged and outside this fix.
