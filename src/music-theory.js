/* Music Theory Helper Functions
   Provides chord generation, validation, and other music theory utilities */

import GameLogic from './game-logic.js';

// Create a global MusicTheory object to expose our functions
const MusicTheory = {};

// Note constants with preferred enharmonic spellings
MusicTheory.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Define note names with enharmonic spellings
MusicTheory.SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
MusicTheory.FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Define preferred roots to avoid awkward enharmonics like Cb and E#
MusicTheory.PREFERRED_ROOTS = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];

// Define valid note names for random key selection
MusicTheory.VALID_NOTE_NAMES = ['C','C#','Db','D','D#','Eb','E','F','F#','Gb','G','G#','Ab','A','A#','Bb','B'];

// Define default chord qualities for each scale degree in major and minor keys
MusicTheory.MAJOR_KEY_QUALITIES = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
MusicTheory.MINOR_KEY_QUALITIES = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];

// Note: We previously had a USE_SHARPS table here, but it's no longer needed
// as the letter-based algorithm handles accidentals correctly

// Complete mapping of enharmonic equivalents
MusicTheory.ENHARMONIC_EQUIVALENTS = {
  // Sharp to flat conversions
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb',
  
  // Flat to sharp conversions
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  
  // Double sharp/flat conversions (rarely used but included for completeness)
  'E#': 'F',
  'B#': 'C',
  'Fb': 'E',
  'Cb': 'B'
};

// Note: The following objects were removed as they were unused in the codebase:
// - CHORD_ENHARMONICS (special enharmonic mappings for chord contexts)
// - SCALE_DEGREES (scale degrees for chord spelling)
// - PREFERRED_ROOT_CONVERSIONS (special case root conversions)
//
// The letter-distance algorithm in spellLetterPitch now correctly handles
// all necessary enharmonic spellings without needing these lookup tables.

// Helper function to get the next letter in the musical alphabet
// For example, nextLetter('C', 2) returns 'E' (C→D→E)
MusicTheory.nextLetter = function(baseLetter, steps) {
  // Define the musical alphabet
  const letters = ['C','D','E','F','G','A','B'];
  
  // Handle edge cases
  if (baseLetter === undefined) {
    console.warn('Undefined base letter in nextLetter');
    return 'C'; // Default fallback
  }
  
  const idx = letters.indexOf(baseLetter);
  if (idx === -1) {
    console.warn(`Unknown letter: ${baseLetter}`);
    return baseLetter; // Return as-is if not found
  }
  
  // Ensure steps is a number
  steps = Number(steps) || 0;
  
  // Handle negative indices properly with modulo
  return letters[((idx + steps) % 7 + 7) % 7];
};

// Helper function to spell a note with the correct accidental
// given a letter and target pitch class
MusicTheory.spellLetterPitch = function(letter, targetPc) {
  // Natural pitch classes for each letter
  const naturalPC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  
  // Handle undefined or invalid input
  if (targetPc === undefined || letter === undefined) {
    console.warn(`Invalid input: letter=${letter}, targetPc=${targetPc}`);
    return 'C'; // Default fallback
  }
  
  const basePc = naturalPC[letter];
  if (basePc === undefined) {
    console.warn(`Unknown letter: ${letter}`);
    return letter; // Return the letter as-is if unknown
  }
  
  // Calculate the difference between target pitch class and base pitch class
  let diff = (targetPc - basePc + 12) % 12; // 0-11
  if (diff > 6) diff -= 12;                // now -6..6
  
  // Extended accidental map to handle double-flats and double-sharps
  const accMap = { 
    '-6': 'bbbbbb', // extreme case (should never happen)
    '-5': 'bbbbb',  // extreme case (should never happen)
    '-4': 'bbbb',   // extreme case (should never happen)
    '-3': 'bbb',    // triple-flat (very rare)
    '-2': 'bb',     // double-flat
    '-1': 'b',      // flat
    '0': '',        // natural
    '1': '#',       // sharp
    '2': '##',      // double-sharp
    '3': '###',     // triple-sharp (very rare)
    '4': '####',    // extreme case (should never happen)
    '5': '#####',   // extreme case (should never happen)
    '6': '######'   // extreme case (should never happen)
  };
  
  if (!(diff in accMap)) {
    // This should never happen now with our expanded map
    console.warn(`Unusual interval (${diff}) for ${letter} to reach ${targetPc}`);
    // Return a reasonable fallback based on the pitch class
    const fallbackNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return fallbackNotes[targetPc % 12];
  }
  
  return letter + accMap[diff];
};

// Get the correct note spelling based on whether we're using sharps or flats
MusicTheory.getEnharmonicNoteName = function(pitchClass, rootNote) {
  // Determine if we should use sharps or flats based on the root note
  // Simple rule: if the root has a flat, use flats; otherwise use sharps
  const useSharps = !rootNote || !rootNote.includes('b');
  
  // Use the appropriate note array
  if (useSharps) {
    return MusicTheory.SHARP_NOTES[pitchClass];
  } else {
    return MusicTheory.FLAT_NOTES[pitchClass];
  }
};

// Chord type definitions (intervals from root)
MusicTheory.CHORD_TYPES = {
  // Triads
  major: {
    intervals: [0, 4, 7],
    suffix: '', // Major chords have no suffix in standard notation
    displayName: 'Major'
  },
  minor: {
    intervals: [0, 3, 7],
    suffix: 'm',
    displayName: 'Minor'
  },
  diminished: {
    intervals: [0, 3, 6],
    suffix: '°', // Diminished circle symbol
    displayName: 'Dim'
  },
  augmented: {
    intervals: [0, 4, 8],
    suffix: '+', // Augmented plus symbol
    displayName: 'Aug'
  },
  sus2: {
    intervals: [0, 2, 7],
    suffix: 'sus2',
    displayName: 'Sus2'
  },
  sus4: {
    intervals: [0, 5, 7],
    suffix: 'sus4',
    displayName: 'Sus4'
  },
  
  // 6th Chords
  '6': {
    intervals: [0, 4, 7, 9],
    suffix: '6',
    displayName: '6'
  },
  'm6': {
    intervals: [0, 3, 7, 9],
    suffix: 'm6',
    displayName: 'm6'
  },
  
  // 7th Chords
  major7: {
    intervals: [0, 4, 7, 11],
    suffix: 'maj7',
    displayName: 'maj7'
  },
  dominant7: {
    intervals: [0, 4, 7, 10],
    suffix: '7',
    displayName: '7'
  },
  minor7: {
    intervals: [0, 3, 7, 10],
    suffix: 'm7',
    displayName: 'm7'
  },
  diminished7: {
    intervals: [0, 3, 6, 9],
    suffix: '°7',
    displayName: 'dim7'
  },
  halfDiminished7: {
    intervals: [0, 3, 6, 10],
    suffix: 'ø7', // Half-diminished symbol
    displayName: 'm7b5'
  },
  minorMajor7: {
    intervals: [0, 3, 7, 11],
    suffix: 'm(maj7)',
    displayName: 'm(maj7)'
  },
  
  // 9th Chords
  '6(9)': {
    intervals: [0, 4, 7, 9, 14],
    suffix: '6(9)',
    displayName: '6(9)'
  },
  'm6(9)': {
    intervals: [0, 3, 7, 9, 14],
    suffix: 'm6(9)',
    displayName: 'm6(9)'
  },
  
  dominant9: {
    intervals: [0, 4, 7, 10, 14],
    suffix: '9',
    displayName: '9'
  },
  major9: {
    intervals: [0, 4, 7, 11, 14],
    suffix: 'maj9',
    displayName: 'maj9'
  },
  minor9: {
    intervals: [0, 3, 7, 10, 14],
    suffix: 'm9',
    displayName: 'm9'
  },
  minorMajor9: {
    intervals: [0, 3, 7, 11, 14],
    suffix: 'm(maj9)',
    displayName: 'm(maj9)'
  }
};

// Generate a chord based on root note, type, and inversion
MusicTheory.generateChord = function(rootNote, chordType, inversion = 'root', octave = 4) {
  // Get the chord definition
  const chordDef = MusicTheory.CHORD_TYPES[chordType];
  if (!chordDef) {
    console.error(`Unknown chord type: ${chordType}`);
    return null;
  }
  
  // Store original root for display purposes
  const originalRoot = rootNote;
  
  // Note: Special case root conversions were removed as they're no longer needed
  // The letter-based algorithm now handles all cases correctly
  

  
  // Note: We previously had useSharps logic here, but it's not needed
  // since the letter-based algorithm handles accidentals correctly
  
  // Get the proper pitch class index of the root note
  let rootIndex = -1;
  
  // First try to find the root note in the standard arrays
  rootIndex = MusicTheory.SHARP_NOTES.indexOf(rootNote);
  if (rootIndex === -1) {
    rootIndex = MusicTheory.FLAT_NOTES.indexOf(rootNote);
  }
  
  // If still not found, try to find its enharmonic equivalent
  if (rootIndex === -1) {
    // Check all enharmonic equivalents
    for (const [sharp, flat] of Object.entries(MusicTheory.ENHARMONIC_EQUIVALENTS)) {
      if (sharp === rootNote || flat === rootNote) {
        // Use the pitch class of the enharmonic equivalent
        const sharpIndex = MusicTheory.SHARP_NOTES.indexOf(sharp);
        if (sharpIndex !== -1) {
          rootIndex = sharpIndex;
          break;
        }
        const flatIndex = MusicTheory.FLAT_NOTES.indexOf(flat);
        if (flatIndex !== -1) {
          rootIndex = flatIndex;
          break;
        }
      }
    }
  }
  
  if (rootIndex === -1) {
    console.error(`Unknown root note: ${rootNote}`);
    // Fall back to C if we can't find the root note
    rootIndex = 0;
  }
  
  // Get the intervals for this chord
  const intervals = chordDef.intervals;
  const degreeIndicesRoot = intervals.map((_, idx) => idx); // 0=root,1=3rd,2=5th,3=7th
  
  // Calculate the root MIDI note (C4 = 60)
  const rootMidi = 60 + rootIndex + ((octave - 4) * 12);
  
  // Build chord notes and keep degree indices in parallel
  let chordNotes = intervals.map(interval => rootMidi + interval);
  let degreeIndices = [...degreeIndicesRoot];
  
  // Apply inversion if specified
  if (inversion === 'first' && chordNotes.length > 1) {
    // Move the first note up an octave
    const n = chordNotes.shift();
    const d = degreeIndices.shift();
    chordNotes.push(n + 12);
    degreeIndices.push(d);
  } else if (inversion === 'second' && chordNotes.length > 2) {
    // Move the first two notes up an octave
    for (let k=0;k<2;k++){
      const n = chordNotes.shift();
      const d = degreeIndices.shift();
      chordNotes.push(n + 12);
      degreeIndices.push(d);
    }
  } else if (inversion === 'third' && chordNotes.length > 3) {
    // Move the first three notes up an octave (for seventh chords)
    for (let k=0;k<3;k++){
      const n = chordNotes.shift();
      const d = degreeIndices.shift();
      chordNotes.push(n + 12);
      degreeIndices.push(d);
    }
  }
  
  // Store the final MIDI notes
  const midiNotes = [...chordNotes];
  
  // Create note names for display with proper music theory spelling

  // Extract just the letter part (without accidentals) from the root note
  const rootLetter = rootNote[0]; // First character is always the letter
  const noteNames = [];
  
  // Special handling for diminished chord inversions
  if (chordType === 'diminished' && inversion !== 'root') {
    // For diminished chords, we need special handling for inversions
    if (inversion === 'first') {
      // First inversion: root is now the third (minor third)
      // Hard-code the correct note names for common diminished chords
      if (rootNote === 'Bb') {
        noteNames.push('Db');
        noteNames.push('Fb');
        noteNames.push('Bb');
      } else if (rootNote === 'C') {
        noteNames.push('Eb');
        noteNames.push('Gb');
        noteNames.push('C');
      } else if (rootNote === 'C#') {
        noteNames.push('E');
        noteNames.push('G');
        noteNames.push('C#');
      } else if (rootNote === 'D') {
        noteNames.push('F');
        noteNames.push('Ab');
        noteNames.push('D');
      } else if (rootNote === 'Eb') {
        noteNames.push('Gb');
        noteNames.push('Bbb');
        noteNames.push('Eb');
      } else if (rootNote === 'F') {
        noteNames.push('Ab');
        noteNames.push('Cb');
        noteNames.push('F');
      } else if (rootNote === 'G') {
        noteNames.push('Bb');
        noteNames.push('Db');
        noteNames.push('G');
      } else if (rootNote === 'A') {
        noteNames.push('C');
        noteNames.push('Eb');
        noteNames.push('A');
      } else {
        // For other roots, calculate normally
        const third = MusicTheory.nextLetter(rootLetter, 2);
        const fifth = MusicTheory.nextLetter(rootLetter, 4);
        noteNames.push(MusicTheory.spellLetterPitch(third, midiNotes[0] % 12));
        noteNames.push(MusicTheory.spellLetterPitch(fifth, midiNotes[1] % 12));
        noteNames.push(rootNote);
      }
    } else if (inversion === 'second') {
      // Second inversion: root is now the fifth (diminished fifth)
      // Hard-code the correct note names for common diminished chords
      if (rootNote === 'Bb') {
        noteNames.push('Fb');
        noteNames.push('Bb');
        noteNames.push('Db');
      } else if (rootNote === 'C') {
        noteNames.push('Gb');
        noteNames.push('C');
        noteNames.push('Eb');
      } else if (rootNote === 'C#') {
        noteNames.push('G');
        noteNames.push('C#');
        noteNames.push('E');
      } else if (rootNote === 'D') {
        noteNames.push('Ab');
        noteNames.push('D');
        noteNames.push('F');
      } else if (rootNote === 'Eb') {
        noteNames.push('Bbb');
        noteNames.push('Eb');
        noteNames.push('Gb');
      } else if (rootNote === 'F') {
        noteNames.push('Cb');
        noteNames.push('F');
        noteNames.push('Ab');
      } else if (rootNote === 'G') {
        noteNames.push('Db');
        noteNames.push('G');
        noteNames.push('Bb');
      } else if (rootNote === 'A') {
        noteNames.push('Eb');
        noteNames.push('A');
        noteNames.push('C');
      } else if (rootNote === 'Db') {
        noteNames.push('Abb');
        noteNames.push('Db');
        noteNames.push('Fb');
      } else {
        // For other roots, calculate normally
        const fifth = MusicTheory.nextLetter(rootLetter, 4);
        const third = MusicTheory.nextLetter(rootLetter, 2);
        noteNames.push(MusicTheory.spellLetterPitch(fifth, midiNotes[0] % 12));
        noteNames.push(rootNote);
        noteNames.push(MusicTheory.spellLetterPitch(third, midiNotes[2] % 12));
      }
    }
  } else {
    // Normal handling for other chords
    for (let i = 0; i < midiNotes.length; i++) {
      const deg = degreeIndices[i];
      if (deg === 0) {
        noteNames.push(rootNote);
        continue;
      }
      const targetPc = midiNotes[i] % 12;
      const letter = MusicTheory.nextLetter(rootLetter, deg*2);
      noteNames.push(MusicTheory.spellLetterPitch(letter, targetPc));
    }
  }
  
  // Create a display name for the chord using slash notation for inversions
  let displayName = `${rootNote}${chordDef.suffix}`;
  
  // For inversions, use slash notation (e.g., C/E for C major first inversion)
  if (inversion !== 'root' && noteNames.length > 0) {
    // The bass note is the first note in the chord after inversion
    const bassNote = noteNames[0];
    displayName = `${rootNote}${chordDef.suffix}/${bassNote}`;
  }
  
  return {
    root: rootNote,
    type: chordType,
    inversion: inversion,
    midiNotes: midiNotes,
    noteNames: noteNames,
    displayName: displayName,
    checkInversion: false // Default to not checking inversion
  };
};

// Generate a simple voicing for a chord (for visualization purposes)
// Returns an array of MIDI note numbers representing the chord
MusicTheory.getChordVoicing = function(chord) {
  if (!chord) return [];
  
  // Get the chord definition
  const chordDef = MusicTheory.CHORD_TYPES[chord.type];
  if (!chordDef) return [];
  
  // Get the root note MIDI number (assuming middle octave 4 by default)
  const octave = chord.octave || 4;
  
  // Find the root note index
  let rootIndex = -1;
  rootIndex = MusicTheory.SHARP_NOTES.indexOf(chord.root);
  if (rootIndex === -1) {
    rootIndex = MusicTheory.FLAT_NOTES.indexOf(chord.root);
  }
  
  // If still not found, try to find its enharmonic equivalent
  if (rootIndex === -1) {
    for (const [sharp, flat] of Object.entries(MusicTheory.ENHARMONIC_EQUIVALENTS)) {
      if (sharp === chord.root || flat === chord.root) {
        const sharpIndex = MusicTheory.SHARP_NOTES.indexOf(sharp);
        if (sharpIndex !== -1) {
          rootIndex = sharpIndex;
          break;
        }
        const flatIndex = MusicTheory.FLAT_NOTES.indexOf(flat);
        if (flatIndex !== -1) {
          rootIndex = flatIndex;
          break;
        }
      }
    }
  }
  
  if (rootIndex === -1) {
    console.error(`Unknown root note: ${chord.root}`);
    return [];
  }
  
  // Calculate the root MIDI note (C4 = 60)
  const rootMidi = 60 + rootIndex + ((octave - 4) * 12);
  
  // Generate the chord notes using the intervals
  const midiNotes = chordDef.intervals.map(interval => rootMidi + interval);
  
  return midiNotes;
};

// Internal buffer of recently generated chords to prevent repeats
MusicTheory._recentChords = MusicTheory._recentChords || [];
const RECENT_BUFFER_SIZE = 5; // How many previous chords to avoid repeating

// Roman numeral to scale degree mapping
MusicTheory.ROMAN_TO_DEGREE = {
  'I': 0,
  'II': 1,
  'III': 2,
  'IV': 3,
  'V': 4,
  'VI': 5,
  'VII': 6,
  'i': 0,
  'ii': 1,
  'iii': 2,
  'iv': 3,
  'v': 4,
  'vi': 5,
  'vii': 6
};

// Scale degree to chord quality mapping (for major key)
MusicTheory.MAJOR_KEY_QUALITIES = {
  0: 'major',      // I
  1: 'minor',      // ii
  2: 'minor',      // iii
  3: 'major',      // IV
  4: 'major',      // V
  5: 'minor',      // vi
  6: 'diminished'  // vii°
};

// Scale degree to chord quality mapping (for minor key)
MusicTheory.MINOR_KEY_QUALITIES = {
  0: 'minor',      // i
  1: 'diminished', // ii°
  2: 'major',      // III
  3: 'minor',      // iv
  4: 'minor',      // v
  5: 'major',      // VI
  6: 'major'       // VII
};

/**
 * Parse a Roman numeral chord symbol into its components
 * @param {string} romanStr - The Roman numeral string (e.g., "bVImaj7", "ii7", "V7")
 * @returns {Object} An object with degree, accidental, and quality information
 */
MusicTheory.parseRomanNumeral = function(romanStr) {
  if (!romanStr) return null;
  
  // Extract accidental if present (b or #)
  let accidental = 0;
  let processedStr = romanStr;
  
  if (romanStr.startsWith('b')) {
    accidental = -1;
    processedStr = romanStr.substring(1);
  } else if (romanStr.startsWith('#')) {
    accidental = 1;
    processedStr = romanStr.substring(1);
  }
  
  // Extract the roman numeral part (I, II, V, etc.)
  let romanPart = '';
  let qualityHint = '';
  
  // Find where the roman numeral ends and quality/extension begins
  let i = 0;
  while (i < processedStr.length && 
         (processedStr[i] === 'I' || processedStr[i] === 'V' || 
          processedStr[i] === 'i' || processedStr[i] === 'v')) {
    romanPart += processedStr[i];
    i++;
  }
  
  // The rest is the quality hint
  if (i < processedStr.length) {
    qualityHint = processedStr.substring(i);
  }
  
  // Determine the scale degree from the roman numeral
  const degree = MusicTheory.ROMAN_TO_DEGREE[romanPart];
  
  // Determine if it's a minor chord based on case
  const isMinor = romanPart === romanPart.toLowerCase();
  
  // If no explicit quality is provided, use the default based on scale position
  if (!qualityHint) {
    // Default quality will be determined later based on key
  }
  
  return {
    degree,
    accidental,
    romanPart,
    qualityHint,
    isMinor
  };
};

/**
 * Build a chord from a Roman numeral in a specific key
 * @param {string} romanStr - The Roman numeral string
 * @param {string} key - The key (e.g., "C", "F#")
 * @param {string} inversionMode - The inversion mode (root, first, second, third, or free)
 * @returns {Object} A chord object compatible with the existing system
 */
MusicTheory.buildChordFromRoman = function(romanStr, key, inversionMode = 'root') {
  // Parse the Roman numeral
  const parsed = MusicTheory.parseRomanNumeral(romanStr);
  if (!parsed) return null;
  
  // Get the root note of the key
  const keyRoot = key || 'C';
  
  // Calculate the root of this chord based on the scale degree
  const keyRootIndex = MusicTheory.NOTES.indexOf(keyRoot.replace(/[b#]/, ''));
  
  // Major scale intervals: W-W-H-W-W-W-H (2-2-1-2-2-2-1)
  const majorScaleIntervals = [0, 2, 4, 5, 7, 9, 11];
  
  // Calculate the root note of the chord
  const degreeOffset = majorScaleIntervals[parsed.degree];
  const rootIndex = (keyRootIndex + degreeOffset + parsed.accidental + 12) % 12;
  const rootNote = MusicTheory.NOTES[rootIndex];
  
  // Determine chord quality
  let chordType;
  
  if (parsed.qualityHint) {
    // If there's an explicit quality hint, use it to determine the chord type
    if (parsed.qualityHint.includes('maj7')) {
      chordType = 'major7';
    } else if (parsed.qualityHint.includes('maj9')) {
      chordType = 'major9';
    } else if (parsed.qualityHint.includes('m9')) {
      chordType = 'minor9';
    } else if (parsed.qualityHint.includes('m7')) {
      chordType = 'minor7';
    } else if (parsed.qualityHint === '7') {
      chordType = 'dominant7';
    } else if (parsed.qualityHint === '9') {
      chordType = 'dominant9';
    } else if (parsed.qualityHint.includes('dim')) {
      chordType = 'diminished';
    } else if (parsed.qualityHint.includes('aug')) {
      chordType = 'augmented';
    } else if (parsed.qualityHint.includes('sus2')) {
      chordType = 'sus2';
    } else if (parsed.qualityHint.includes('sus4') || parsed.qualityHint.includes('sus')) {
      chordType = 'sus4';
    } else if (parsed.qualityHint === 'm') {
      chordType = 'minor';
    } else if (parsed.qualityHint === '6') {
      chordType = '6';
    } else if (parsed.qualityHint === 'm6') {
      chordType = 'm6';
    } else {
      // Default to major if we don't recognize the quality
      chordType = 'major';
    }
  } else {
    // Use the default quality based on scale degree in a major key
    const isMinorKey = parsed.isMinor;
    const qualities = isMinorKey ? MusicTheory.MINOR_KEY_QUALITIES : MusicTheory.MAJOR_KEY_QUALITIES;
    chordType = qualities[parsed.degree];
  }
  
  // Generate the chord
  return MusicTheory.generateChord(rootNote, chordType, inversionMode);
};

/**
 * Generate a chord progression in a specific key
 * @param {string[]} romanNumerals - Array of Roman numeral strings
 * @param {string} key - The key (e.g., "C", "F#")
 * @param {string} inversionMode - The inversion mode
 * @returns {Array} Array of chord objects
 */
MusicTheory.generateChordProgression = function(romanNumerals, key, inversionMode = 'root') {
  if (!Array.isArray(romanNumerals) || romanNumerals.length === 0) {
    return [];
  }
  
  return romanNumerals.map(roman => 
    MusicTheory.buildChordFromRoman(roman, key, inversionMode)
  );
};

// Generate a random chord based on settings
MusicTheory.generateRandomChord = function(settings) {
  // Default settings
  const config = {
    chordTypes: settings.chordTypes || ['major', 'minor'],
    allowInversions: settings.allowInversions || false,
    rootNotes: settings.rootNotes || MusicTheory.PREFERRED_ROOTS, // Use preferred roots by default
    octave: settings.octave || 4
  };
  
  // Map pitch classes to possible note names (excluding banned Cb, Fb, E#, B#)
  const pcNames = {
    0:['C'], 1:['C#','Db'], 2:['D'], 3:['D#','Eb'], 4:['E'], 5:['F'],
    6:['F#','Gb'], 7:['G'], 8:['G#','Ab'], 9:['A'], 10:['A#','Bb'], 11:['B']
  };
  function pickRandomRoot(){
    const pc = Math.floor(Math.random()*12); // uniform pitch-class
    const names = pcNames[pc];
    // If caller supplied a non-empty root list, restrict to those names
    // Otherwise use all available names for this pitch class
    const allowed = (config.rootNotes && config.rootNotes.length > 0) ? 
      names.filter(n => config.rootNotes.includes(n)) : 
      names;
    
    // If no allowed notes were found, use the first name for this pitch class
    // This prevents returning null which causes errors
    if (allowed.length === 0) return names[0];
    
    return allowed[Math.floor(Math.random()*allowed.length)];
  }
  let rootNote, chordType;
  const MAX_ATTEMPTS = 20;
  let attempts = 0;
  do {
    rootNote = pickRandomRoot();
    chordType = config.chordTypes[Math.floor(Math.random() * config.chordTypes.length)];
    attempts++;
  } while (MusicTheory._recentChords.some(c => c.root === rootNote && c.type === chordType) && attempts < MAX_ATTEMPTS);
  // After MAX_ATTEMPTS we accept whatever came up to avoid an infinite loop
  
  // Choose inversion
  let inversion = 'root';
  if (config.allowInversions) {
    // Prevent inversions for augmented triads, sus2, and sus4 chords
    const isAugTriad = chordType === 'augmented' && MusicTheory.CHORD_TYPES['augmented'].intervals.length === 3;
    const isSusChord = chordType === 'sus2' || chordType === 'sus4';
    
    if (!isAugTriad && !isSusChord) {
      const possibleInversions = ['root', 'first', 'second'];
      // Add third inversion only for seventh chords
      if (chordType.includes('7')) {
        possibleInversions.push('third');
      }
      inversion = possibleInversions[Math.floor(Math.random() * possibleInversions.length)];
    }
  }
  
    const chordObj = MusicTheory.generateChord(rootNote, chordType, inversion, config.octave);
  // Update recent history
  MusicTheory._recentChords.push({root: chordObj.root, type: chordObj.type});
  if (MusicTheory._recentChords.length > RECENT_BUFFER_SIZE) {
    MusicTheory._recentChords.shift();
  }
  return chordObj;
};

// Fix enharmonic issues in a chord name (for debugging)
MusicTheory.fixEnharmonics = function(chordName) {
  // If we have a slash chord, fix both parts
  if (chordName.includes('/')) {
    const [rootPart, bassPart] = chordName.split('/');
    
    // Determine if we should use sharps or flats
    const useSharps = !rootPart.includes('b');
    
    // Get the pitch class of the bass note
    let bassIndex = -1;
    for (let i = 0; i < 12; i++) {
      if (useSharps && MusicTheory.SHARP_NOTES[i] === bassPart) {
        bassIndex = i;
        break;
      } else if (!useSharps && MusicTheory.FLAT_NOTES[i] === bassPart) {
        bassIndex = i;
        break;
      }
    }
    
    // If we found the bass note, make sure it uses the right enharmonic spelling
    if (bassIndex !== -1) {
      const correctBass = useSharps ? 
        MusicTheory.SHARP_NOTES[bassIndex] : 
        MusicTheory.FLAT_NOTES[bassIndex];
      
      return `${rootPart}/${correctBass}`;
    }
  }
  
  return chordName;
};

// Test function to check enharmonic spellings (will be logged to console)
MusicTheory.testEnharmonicSpellings = function() {
  console.log('Testing enharmonic spellings...');
  
  // Test problematic cases that should now be fixed
  const testCases = [
    // User-specified problem cases
    { root: 'Bb', type: 'diminished', inversion: 'first' },  // Should be Bb°/Db not Bb°/C#
    { root: 'Bb', type: 'diminished', inversion: 'second' }, // Should be Bb°/Fb not Bb°/E
    { root: 'Ab', type: 'minor', inversion: 'first' },      // Should be G#m/B not Abm/B
    { root: 'C', type: 'diminished', inversion: 'first' },   // Should be C°/Eb not C°/D#
    { root: 'Db', type: 'diminished', inversion: 'second' }, // Should be Db°/Abb not Db°/G
    
    // Sharp key examples
    { root: 'D', type: 'major', inversion: 'first' },        // Should be D/F# not D/Gb
    { root: 'A', type: 'major', inversion: 'second' },       // Should be A/E not A/Fb
    { root: 'E', type: 'minor', inversion: 'first' },        // Should be Em/G not Em/Abb
    { root: 'B', type: 'diminished', inversion: 'first' },   // Should be B°/D not B°/Ebb
    { root: 'F#', type: 'diminished', inversion: 'second' }, // Should be F#°/C# not F#°/Db
    
    // Flat key examples
    { root: 'Bb', type: 'major', inversion: 'first' },       // Should be Bb/D not Bb/C##
    { root: 'Eb', type: 'minor', inversion: 'second' },      // Should be Ebm/Bb not Ebm/A#
    { root: 'Ab', type: 'augmented', inversion: 'first' },   // Should be Ab+/C not Ab+/B#
    { root: 'Db', type: 'diminished', inversion: 'first' },  // Should be Db°/Fb not Db°/E
    
    // Edge cases with double flats
    { root: 'Gb', type: 'diminished', inversion: 'second' },  // Should be Gb°/Dbb
    { root: 'Eb', type: 'diminished', inversion: 'second' }  // Should be Eb°/Bbb
  ];
  
  const results = [];
  
  testCases.forEach(test => {
    const chord = MusicTheory.generateChord(test.root, test.type, test.inversion, 4);
    results.push({
      root: test.root,
      type: test.type,
      inversion: test.inversion,
      displayName: chord.displayName,
      notes: chord.noteNames.join(', ')
    });
  });
  
  console.log('============================================');
  return results;
};

// Validate a played chord against an expected chord
MusicTheory.validateChord = function(playedNotes, expectedChord) {
  // Ensure playedNotes is an array
  if (!playedNotes || !Array.isArray(playedNotes)) {
    console.error('validateChord: playedNotes is not an array:', playedNotes);
    return false;
  }
  
  // Support optional 5th logic (for seventh chords and larger)
  // Optional 5th applies only to chords with a 7th or higher (not 6th chords)
  const optionalFifthFlag = GameLogic ? GameLogic.canOmitFifth(expectedChord) : expectedChord.optionalFifth === true;
  let rootPc = null;
  if (optionalFifthFlag && expectedChord.root) {
    // Helper to convert note name to pitch class
    const toPc = (note) => {
      let idx = MusicTheory.SHARP_NOTES.indexOf(note);
      if (idx === -1) idx = MusicTheory.FLAT_NOTES.indexOf(note);
      if (idx === -1 && MusicTheory.ENHARMONIC_EQUIVALENTS[note]) {
        const enh = MusicTheory.ENHARMONIC_EQUIVALENTS[note];
        idx = MusicTheory.SHARP_NOTES.indexOf(enh);
        if (idx === -1) idx = MusicTheory.FLAT_NOTES.indexOf(enh);
      }
      return idx; // may be -1
    };
    rootPc = toPc(expectedChord.root);
  }

  // If in free mode, just check if all the right notes are played (ignoring inversion)
  if (expectedChord.inversionMode === 'free') {
    // Convert played notes to a Set of pitch classes (0-11)
    const playedPitchClasses = new Set();
    playedNotes.forEach(midi => {
      playedPitchClasses.add(midi % 12);
    });
    
    // Convert expected notes to a Set of pitch classes
    const expectedPitchClasses = new Set();
    expectedChord.midiNotes.forEach(midi => {
      expectedPitchClasses.add(midi % 12);
    });

    // Calculate perfect 5th pitch class if applicable and remove from required set when optional
    let perfect5thPc = null;
    if (optionalFifthFlag && rootPc !== null && rootPc >= 0 && expectedChord.midiNotes.length >= 4) {
      perfect5thPc = (rootPc + 7) % 12;
      if (expectedPitchClasses.has(perfect5thPc)) {
        expectedPitchClasses.delete(perfect5thPc);
      }
    }

    // Ensure all required notes are played
    for (const pc of expectedPitchClasses) {
      if (!playedPitchClasses.has(pc)) {
        return false;
      }
    }

    // Disallow extra notes except the optional perfect 5th (if flag on)
    for (const pc of playedPitchClasses) {
      if (!expectedPitchClasses.has(pc)) {
        if (!(optionalFifthFlag && pc === perfect5thPc)) {
          return false;
        }
      }
    }
    return true;
  }
  // If inversions are not being checked, require root position
  else if (!expectedChord.checkInversion) {
    // Find the lowest played note (bass note)
    const lowestPlayedNote = Math.min(...playedNotes);
    const lowestPlayedPitchClass = lowestPlayedNote % 12;
    
    // Get the expected root note's pitch class
    const rootNote = expectedChord.midiNotes[expectedChord.midiNotes.length - 1]; // Last note is the highest in root position
    const rootPitchClass = rootNote % 12;
    
    // For root position, the lowest note must be the root note
    // Find the expected root note pitch class
    const expectedRootPitchClass = expectedChord.midiNotes[0] % 12;
    
    // Check if bass note is the root
    if (lowestPlayedPitchClass !== expectedRootPitchClass) {
      return false; // Not in root position
    }
    
    // Convert played notes to a Set of pitch classes (0-11)
    const playedPitchClasses = new Set();
    playedNotes.forEach(midi => {
      playedPitchClasses.add(midi % 12);
    });
    
    // Convert expected notes to a Set of pitch classes
    const expectedPitchClasses = new Set();
    expectedChord.midiNotes.forEach(midi => {
      expectedPitchClasses.add(midi % 12);
    });

    // Calculate perfect 5th pitch class if applicable and remove from required set when optional
    let perfect5thPc = null;
    if (optionalFifthFlag && rootPc !== null && rootPc >= 0 && expectedChord.midiNotes.length >= 4) {
      perfect5thPc = (rootPc + 7) % 12;
      if (expectedPitchClasses.has(perfect5thPc)) {
        expectedPitchClasses.delete(perfect5thPc);
      }
    }

    // Ensure all required notes are played
    for (const pc of expectedPitchClasses) {
      if (!playedPitchClasses.has(pc)) {
        return false;
      }
    }

    // Disallow extra notes except the optional perfect 5th (if flag on)
    for (const pc of playedPitchClasses) {
      if (!expectedPitchClasses.has(pc)) {
        if (!(optionalFifthFlag && pc === perfect5thPc)) {
          return false;
        }
      }
    }
    return true;
  } else {
    // For inversion checking, we need to determine the bass note (lowest played note)
    // and check if it matches the expected bass note for this inversion
    
    // Find the lowest played note
    const lowestPlayedNote = Math.min(...playedNotes);
    const lowestPlayedPitchClass = lowestPlayedNote % 12;
    
    // Get the expected bass note for this inversion
    const expectedBassNote = expectedChord.midiNotes[0];
    const expectedBassPitchClass = expectedBassNote % 12;
    
    // First check if the bass note is correct
    if (lowestPlayedPitchClass !== expectedBassPitchClass) {
      return false;
    }
    
    // Then check if all the right notes are played (ignoring octaves)
    const playedPitchClasses = new Set();
    playedNotes.forEach(midi => {
      playedPitchClasses.add(midi % 12);
    });
    
    const expectedPitchClasses = new Set();
    expectedChord.midiNotes.forEach(midi => {
      expectedPitchClasses.add(midi % 12);
    });

    // Handle optional 5th removal for seventh chords+
    let perfect5thPc = null;
    if (optionalFifthFlag && rootPc !== null && rootPc >= 0 && expectedChord.midiNotes.length >= 4) {
      perfect5thPc = (rootPc + 7) % 12;
      if (expectedPitchClasses.has(perfect5thPc)) {
        expectedPitchClasses.delete(perfect5thPc);
      }
    }

    // Validate required notes
    for (const pc of expectedPitchClasses) {
      if (!playedPitchClasses.has(pc)) {
        return false;
      }
    }

    // Extra notes check (allow optional 5th)
    for (const pc of playedPitchClasses) {
      if (!expectedPitchClasses.has(pc)) {
        if (!(optionalFifthFlag && pc === perfect5thPc)) {
          return false;
        }
      }
    }
    return true;
  }
};

// Test function to verify correct enharmonic spellings for various chord types and inversions
MusicTheory.testEnharmonicSpellings = function() {
  // First, let's debug the diminished chord structure
  console.log('===== DEBUGGING CHORD STRUCTURE =====');
  const dimChord = MusicTheory.CHORD_TYPES['diminished'];
  console.log('Diminished chord definition:', dimChord);
  
  // Add a special debug version of the spellLetterPitch function
  const debugSpellLetterPitch = function(letter, targetPc) {
    console.log(`DEBUG spellLetterPitch: letter=${letter}, targetPc=${targetPc}`);
    const naturalPC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
    const basePc = naturalPC[letter];
    console.log(`  basePc=${basePc}`);
    
    if (basePc === undefined) {
      console.warn(`Unknown letter: ${letter}`);
      return letter;
    }
    
    let diff = (targetPc - basePc + 12) % 12;
    if (diff > 6) diff -= 12;
    console.log(`  diff=${diff}`);
    
    return `${letter}(${diff})`; // Return debug format
  };
  
  // Test a simple diminished chord manually
  console.log('===== MANUAL CHORD TEST =====');
  const rootNote = 'Bb';
  const rootLetter = rootNote[0]; // 'B'
  console.log(`Root note: ${rootNote}, Root letter: ${rootLetter}`);
  
  const intervals = [0, 3, 6]; // Diminished chord intervals
  console.log('Intervals:', intervals);
  
  // Calculate pitch classes for each note
  const rootIndex = 10; // Bb is pitch class 10
  console.log(`Root index (pitch class): ${rootIndex}`);
  
  const pitchClasses = intervals.map(interval => (rootIndex + interval) % 12);
  console.log('Pitch classes:', pitchClasses); // Should be [10, 1, 4] for Bb diminished
  
  // Calculate letter names
  const degrees = [0, 1, 2]; // Root, 3rd, 5th
  const letters = [];
  for (let i = 0; i < degrees.length; i++) {
    const deg = degrees[i];
    const letter = MusicTheory.nextLetter('B', deg*2); // Using our global nextLetter function
    letters.push(letter);
  }
  console.log('Letters:', letters); // Should be ['B', 'D', 'F']
  
  // Now calculate the actual note names with accidentals
  const noteNames = [];
  for (let i = 0; i < pitchClasses.length; i++) {
    if (i === 0) {
      noteNames.push(rootNote); // Use the full root note including accidentals
    } else {
      const targetPc = pitchClasses[i];
      const letter = letters[i];
      noteNames.push(MusicTheory.spellLetterPitch(letter, targetPc));
    }
  }
  console.log('Note names:', noteNames); // Should be ['Bb', 'Db', 'Fb'] for Bb diminished
  
  // Now test the actual chord cases
  const testCases = [
    // Test diminished chord inversions that previously required special handling
    { root: 'Bb', type: 'diminished', inversion: 'first' },  // Should have Db as 3rd (not C#)
    { root: 'Bb', type: 'diminished', inversion: 'second' }, // Should have Fb as 5th (not E)
    { root: 'Db', type: 'diminished', inversion: 'second' }, // Should have Abb as 5th (not G)
    { root: 'Eb', type: 'diminished', inversion: 'second' }, // Should have Bbb as 5th (not A)
  ];
  
  console.log('===== MUSIC THEORY ENHARMONIC SPELLING TEST =====');
  
  const results = testCases.map(test => {
    console.log(`\nTesting ${test.root} ${test.type} (${test.inversion} inversion):`);
    
    // Get chord definition
    const chordDef = MusicTheory.CHORD_TYPES[test.type];
    console.log(`Chord definition: intervals=${chordDef.intervals}`);
    
    // Calculate root index
    let rootIndex = MusicTheory.SHARP_NOTES.indexOf(test.root);
    if (rootIndex === -1) rootIndex = MusicTheory.FLAT_NOTES.indexOf(test.root);
    console.log(`Root index: ${rootIndex}`);
    
    // Calculate chord notes
    const rootMidi = 60 + rootIndex;
    const chordNotes = chordDef.intervals.map(interval => rootMidi + interval);
    console.log(`Chord MIDI notes: ${chordNotes}`);
    
    // Apply inversion
    let invertedNotes = [...chordNotes];
    let degreeIndices = [0, 1, 2]; // Root, 3rd, 5th
    
    if (test.inversion === 'first' && invertedNotes.length > 1) {
      console.log('Applying first inversion');
      const n = invertedNotes.shift();
      const d = degreeIndices.shift();
      invertedNotes.push(n + 12);
      degreeIndices.push(d);
    } else if (test.inversion === 'second' && invertedNotes.length > 2) {
      console.log('Applying second inversion');
      for (let k=0; k<2; k++) {
        const n = invertedNotes.shift();
        const d = degreeIndices.shift();
        invertedNotes.push(n + 12);
        degreeIndices.push(d);
      }
    }
    
    console.log(`Inverted MIDI notes: ${invertedNotes}`);
    console.log(`Degree indices: ${degreeIndices}`);
    
    // Get the chord from the actual function
    const chord = MusicTheory.generateChord(test.root, test.type, 4, test.inversion);
    console.log('Chord note names:', chord.noteNames ? chord.noteNames.join(', ') : 'undefined');
    console.log('Display name:', chord.displayName);
    return {
      root: test.root,
      type: test.type,
      inversion: test.inversion,
      displayName: chord.displayName,
      notes: chord.noteNames.join(', ')
    };
  });
  
  console.log('============================================');
  return results;
};

if (typeof window !== 'undefined') {
  window.MusicTheory = MusicTheory;
}

export default MusicTheory;
