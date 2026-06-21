# MIDI Input Channel Regression

## Summary

Fix a likely MIDI input regression where valid Web MIDI note messages can be ignored when they arrive on channels other than the two hard-coded status bytes currently handled by the app.

## Approved Requirements

- Restore MIDI note handling for all valid Web MIDI note-on and note-off channel messages.
- Treat note-on messages with velocity `0` as note-off messages.
- Keep the current trainer UI, settings, scoring, and chord validation behavior unchanged.
- Keep the change small and focused on MIDI input parsing and listener handling.
- Add regression coverage for the MIDI message parsing behavior.

## Decisions

- MIDI message interpretation should live in `src/midi-utils.js` so it can be tested without a browser or React render harness.
- `src/App.jsx` should delegate raw MIDI message parsing to the shared MIDI utility instead of checking only selected status bytes inline.
- Browser device access itself still requires manual verification with a real MIDI device in Chrome or a Chromium-based browser.

## Relevant Files

- `src/App.jsx`: owns Web MIDI access, selected input listener registration, and active-note state updates.
- `src/midi-utils.js`: shared MIDI helpers.
- `tests/run-tests.js`: Node-based regression test suite.

## Acceptance Criteria

- MIDI note-on status bytes from `0x90` through `0x9f` add active notes when velocity is greater than `0`.
- MIDI note-off status bytes from `0x80` through `0x8f` remove active notes.
- MIDI note-on status bytes from `0x90` through `0x9f` with velocity `0` remove active notes.
- Non-note MIDI messages are ignored.
- `npm.cmd test` passes.
- `npm.cmd run build` passes.

## Orchestrator Report

Implemented the MIDI input fix:

- Added `MidiUtils.parseNoteMessage(data)` in `src/midi-utils.js`.
- Updated `src/App.jsx` to route raw Web MIDI message data through the shared parser.
- Replaced the previous hard-coded `144`, `153`, and `128` status checks with command-nibble parsing, so note-on and note-off work across all MIDI channels.
- Preserved note-on velocity `0` as note-off behavior.
- Added regression coverage in `tests/run-tests.js` for channel 1, channel 2, channel 15/16 examples, note-off messages, zero-velocity note-on, and ignored non-note messages.

Validation performed:

- Confirmed the new test failed before implementation because `MidiUtils.parseNoteMessage` did not exist.
- `npm.cmd test` passed with 40 tests.
- `npm.cmd run build` passed.
- Searched active source/tests for the old hard-coded MIDI status checks and found only the new parser/test coverage.

Caveats:

- Manual browser verification with a real MIDI keyboard in Chrome or a Chromium-based browser is still recommended because local automated checks cannot request Web MIDI hardware access.
- The existing Node `MODULE_TYPELESS_PACKAGE_JSON` test warning and Vite CJS API build warning remain unchanged and outside this fix.
