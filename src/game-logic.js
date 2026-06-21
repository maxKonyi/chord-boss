// Shared game logic helpers. Keep these free of React so they can be tested in Node.
const GameLogic = {};

GameLogic.getDifficultyTime = function(difficulty) {
  switch (difficulty) {
    case 'practice': return Infinity;
    case 'easy': return 12;
    case 'hard': return 3;
    case 'medium':
    default: return 6;
  }
};

GameLogic.isPracticeMode = function(difficulty) {
  return difficulty === 'practice';
};

GameLogic.calculateScore = function(responseTime, difficulty) {
  if (GameLogic.isPracticeMode(difficulty)) {
    return 0;
  }

  const maxTime = GameLogic.getDifficultyTime(difficulty) * 1000;

  if (responseTime <= maxTime * 0.2) return 10;
  if (responseTime <= maxTime * 0.4) return 8;
  if (responseTime <= maxTime * 0.6) return 6;
  if (responseTime <= maxTime * 0.8) return 4;
  if (responseTime <= maxTime) return 2;
  return 1;
};

GameLogic.canOmitFifth = function(chord) {
  if (!chord || chord.optionalFifth !== true || !Array.isArray(chord.midiNotes)) {
    return false;
  }
  return chord.midiNotes.length >= 4 && !(chord.type && chord.type.includes('6') && chord.midiNotes.length === 4);
};

GameLogic.getRequiredNoteCount = function(chord) {
  if (!chord || !Array.isArray(chord.midiNotes)) {
    return 0;
  }

  return chord.midiNotes.length - (GameLogic.canOmitFifth(chord) ? 1 : 0);
};

GameLogic.getAttemptSignature = function(playedNotes) {
  return Array.from(playedNotes || []).sort((a, b) => a - b).join('-');
};

GameLogic.getWrongAttemptUpdate = function(playedNotes, lastSignature) {
  const signature = GameLogic.getAttemptSignature(playedNotes);
  return {
    signature,
    shouldPenalize: signature !== lastSignature
  };
};

GameLogic.prepareProgressionChord = function(progression, chordIndex, settings) {
  const chord = progression && Array.isArray(progression.chords)
    ? progression.chords[chordIndex]
    : null;

  if (!chord) {
    return {
      chord: null,
      actionChordId: `chord-${chordIndex}`
    };
  }

  chord.checkInversion = false;
  chord.inversionMode = settings.inversionMode;
  chord.optionalFifth = settings.optionalFifth;
  chord.progressionIndex = chordIndex;
  chord.progressionLength = progression.chords.length;
  chord.progressionName = progression.name;

  return {
    chord,
    actionChordId: chord.id || `chord-${chordIndex}`
  };
};

GameLogic.selectProgressionId = function(settings, randomFn) {
  const selectedProgressions = settings && Array.isArray(settings.selectedProgressions)
    ? settings.selectedProgressions
    : [];

  if (selectedProgressions.length > 0) {
    const random = typeof randomFn === 'function' ? randomFn : Math.random;
    const index = Math.floor(random() * selectedProgressions.length);
    return selectedProgressions[index];
  }

  return 'triads-major-key';
};

GameLogic.selectProgressionKey = function(settings, musicTheory, randomFn) {
  if (settings && settings.keyMode === 'fixed') {
    return settings.fixedKey || 'C';
  }

  const keys = musicTheory && Array.isArray(musicTheory.VALID_NOTE_NAMES)
    ? musicTheory.VALID_NOTE_NAMES
    : ['C'];
  const random = typeof randomFn === 'function' ? randomFn : Math.random;
  return keys[Math.floor(random() * keys.length)] || 'C';
};

GameLogic.createProgressionQuestion = function(settings, presets, musicTheory, randomFn) {
  const progressionId = GameLogic.selectProgressionId(settings, randomFn);
  const progressionData = presets.getProgressionById(progressionId);

  if (!progressionData || !Array.isArray(progressionData.romanNumerals) || progressionData.romanNumerals.length === 0) {
    throw new Error(`Invalid progression data for id: ${progressionId}`);
  }

  const key = GameLogic.selectProgressionKey(settings, musicTheory, randomFn);
  const chords = musicTheory.generateChordProgression(progressionData.romanNumerals, key);

  if (!chords || chords.length === 0) {
    throw new Error('Failed to generate chords for progression');
  }

  return {
    id: progressionId,
    name: progressionData.name || 'Unnamed Progression',
    key,
    chords
  };
};

GameLogic.prepareSingleChordSettings = function(settings) {
  const safeSettings = { ...(settings || {}) };

  if (!safeSettings.useProgressions && (!Array.isArray(safeSettings.chordTypes) || safeSettings.chordTypes.length === 0)) {
    safeSettings.chordTypes = ['major', 'minor'];
  }

  if (!Array.isArray(safeSettings.rootNotes)) {
    safeSettings.rootNotes = [];
  }

  switch (safeSettings.inversionMode) {
    case 'inversions':
      safeSettings.allowInversions = true;
      break;
    case 'free':
      safeSettings.allowInversions = false;
      break;
    case 'root':
    default:
      break;
  }

  return safeSettings;
};

GameLogic.prepareSingleChord = function(chord, settings, fallbackChord) {
  const safeSettings = GameLogic.prepareSingleChordSettings(settings);
  const preparedChord = chord || fallbackChord || null;

  if (!preparedChord) {
    return {
      chord: null,
      settings: safeSettings
    };
  }

  preparedChord.checkInversion = safeSettings.inversionMode === 'inversions';
  preparedChord.inversionMode = safeSettings.inversionMode || 'root';
  preparedChord.optionalFifth = safeSettings.optionalFifth;

  return {
    chord: preparedChord,
    settings: safeSettings
  };
};

if (typeof window !== 'undefined') {
  window.GameLogic = GameLogic;
}

export default GameLogic;
