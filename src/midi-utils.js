// Shared MIDI helpers. Keep these free of React so they can be tested in Node.
const MidiUtils = {};

MidiUtils.ALL_INPUTS_VALUE = 'all';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

MidiUtils.normalizeInputSelection = function(inputId) {
  return inputId === MidiUtils.ALL_INPUTS_VALUE || inputId === '' ? null : inputId;
};

MidiUtils.parseNoteMessage = function(data) {
  if (!data || data.length < 3) return null;

  const status = data[0];
  const command = status & 0xf0;
  const note = data[1];
  const velocity = data[2];

  if (command === 0x90) {
    return {
      type: velocity > 0 ? 'noteon' : 'noteoff',
      note,
      velocity
    };
  }

  if (command === 0x80) {
    return {
      type: 'noteoff',
      note,
      velocity
    };
  }

  return null;
};

MidiUtils.getMidiNoteName = function(note) {
  if (typeof note !== 'number' || !Number.isFinite(note)) return '';

  const normalizedNote = Math.round(note);
  const noteName = NOTE_NAMES[((normalizedNote % 12) + 12) % 12];
  const octave = Math.floor(normalizedNote / 12) - 1;
  return `${noteName}${octave}`;
};

MidiUtils.getKeyboardOctaveRange = function(activeNotes, failedNotes, defaultStartOctave = 3, defaultEndOctave = 5) {
  const notes = [
    ...Array.from(activeNotes || []),
    ...Array.from(failedNotes || [])
  ].filter(note => typeof note === 'number' && Number.isFinite(note));

  if (notes.length === 0) {
    return {
      startOctave: defaultStartOctave,
      endOctave: defaultEndOctave
    };
  }

  const octaves = notes.map(note => Math.floor(note / 12) - 1);

  return {
    startOctave: Math.min(defaultStartOctave, ...octaves),
    endOctave: Math.max(defaultEndOctave, ...octaves)
  };
};

if (typeof window !== 'undefined') {
  window.MidiUtils = MidiUtils;
}

export default MidiUtils;
