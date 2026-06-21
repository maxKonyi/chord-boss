// Shared MIDI helpers. Keep these free of React so they can be tested in Node.
const MidiUtils = {};

MidiUtils.ALL_INPUTS_VALUE = 'all';

MidiUtils.normalizeInputSelection = function(inputId) {
  return inputId === MidiUtils.ALL_INPUTS_VALUE || inputId === '' ? null : inputId;
};

if (typeof window !== 'undefined') {
  window.MidiUtils = MidiUtils;
}

export default MidiUtils;
