// Shared MIDI helpers. Keep these free of React so they can be tested in Node.
window.MidiUtils = window.MidiUtils || {};

MidiUtils.ALL_INPUTS_VALUE = 'all';

MidiUtils.normalizeInputSelection = function(inputId) {
  return inputId === MidiUtils.ALL_INPUTS_VALUE || inputId === '' ? null : inputId;
};
