/* Music Theory Helper Functions
   Provides chord generation, validation, and other music theory utilities */

// Create a global MusicTheory object to expose our functions
window.MusicTheory = {};

// Note constants with preferred enharmonic spellings
MusicTheory.NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Define note names with enharmonic spellings
MusicTheory.SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
MusicTheory.FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Define preferred roots to avoid awkward enharmonics like Cb and E#
MusicTheory.PREFERRED_ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map to determine if a root note should use sharp or flat spelling
MusicTheory.USE_SHARPS = {
  'C': true,   // C major uses sharps
  'G': true,   // G major uses sharps
  'D': true,   // D major uses sharps
  'A': true,   // A major uses sharps
  'E': true,   // E major uses sharps
  'B': true,   // B major uses sharps
  'F#': true,  // F# major uses sharps
  'C#': true,  // C# major uses sharps
  'G#': true,  // G# minor uses sharps
  'D#': true,  // D# minor uses sharps
  'A#': true,  // A# minor uses sharps
  
  'F': false,  // F major uses flats
  'Bb': false, // Bb major uses flats
  'Eb': false, // Eb major uses flats
  'Ab': false, // Ab major uses flats
  'Db': false, // Db major uses flats
  'Gb': false, // Gb major uses flats
  'Cb': false, // Cb major uses flats
  'Gm': false, // G minor uses flats
  'Cm': false, // C minor uses flats
  'Fm': false, // F minor uses flats
  'Bbm': false // Bb minor uses flats
};

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

// Special enharmonic mappings for chord contexts
MusicTheory.CHORD_ENHARMONICS = {
  // For diminished chords in flat keys (using flats and double-flats)
  'diminished': {
    'G': 'Abb',  // G as double-flat A in flat keys
    'A': 'Bbb',  // A as double-flat B in flat keys
    'B': 'Cb',   // B as C-flat in flat keys
    'C': 'Dbb',  // C as double-flat D in flat keys
    'D': 'Ebb',  // D as double-flat E in flat keys
    'E': 'Fb',   // E as F-flat in flat keys
    'F': 'Gbb',  // F as double-flat G in flat keys
    
    // Sharp to flat conversions for diminished chords
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb'
  },
  
  // For augmented chords in sharp keys (using sharps)
  'augmented': {
    'Db': 'C#',  // Db as C-sharp in sharp keys
    'Eb': 'D#',  // Eb as D-sharp in sharp keys
    'Gb': 'F#',  // Gb as F-sharp in sharp keys
    'Ab': 'G#',  // Ab as G-sharp in sharp keys
    'Bb': 'A#'   // Bb as A-sharp in sharp keys
  }
};

// Define scale degrees for proper chord spelling
MusicTheory.SCALE_DEGREES = {
  'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  'Db': ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  'Eb': ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  'E': ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'Gb': ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  'Ab': ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  'G#': ['G#', 'A#', 'B#', 'C#', 'D#', 'E#', 'F##'],
  'A': ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  'B': ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#']
};

// Special case root conversions - avoid these roots entirely
MusicTheory.PREFERRED_ROOT_CONVERSIONS = {
  'Cb': 'B',   // Convert Cb to B
  'E#': 'F',   // Convert E# to F
  'B#': 'C',   // Convert B# to C
  'Fb': 'E'    // Convert Fb to E
};

// Get the correct note spelling based on whether we're using sharps or flats
MusicTheory.getEnharmonicNoteName = function(pitchClass, rootNote) {
  // Determine if we should use sharps or flats based on the root note
  let useSharps = true;
  
  // If the root is in our map, use that preference
  if (rootNote && MusicTheory.USE_SHARPS.hasOwnProperty(rootNote)) {
    useSharps = MusicTheory.USE_SHARPS[rootNote];
  } else {
    // For roots not in our map, check if it's a flat note
    useSharps = !rootNote.includes('b');
  }
  
  // Use the appropriate note array
  if (useSharps) {
    return MusicTheory.SHARP_NOTES[pitchClass];
  } else {
    return MusicTheory.FLAT_NOTES[pitchClass];
  }
};

// Chord type definitions (intervals from root)
MusicTheory.CHORD_TYPES = {
  major: {
    intervals: [0, 4, 7],
    suffix: '' // Major chords have no suffix in standard notation
  },
  minor: {
    intervals: [0, 3, 7],
    suffix: 'm'
  },
  diminished: {
    intervals: [0, 3, 6],
    suffix: '°' // Diminished circle symbol
  },
  augmented: {
    intervals: [0, 4, 8],
    suffix: '+' // Augmented plus symbol
  },
  major7: {
    intervals: [0, 4, 7, 11],
    suffix: 'maj7'
  },
  dominant7: {
    intervals: [0, 4, 7, 10],
    suffix: '7'
  },
  minor7: {
    intervals: [0, 3, 7, 10],
    suffix: 'm7'
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
  
  // Check for special case root conversions to avoid awkward roots
  if (MusicTheory.PREFERRED_ROOT_CONVERSIONS[rootNote]) {
    rootNote = MusicTheory.PREFERRED_ROOT_CONVERSIONS[rootNote];
  }
  

  
  // Determine if we should use sharps or flats for this chord
  let useSharps = true;
  
  if (chordType === 'diminished') {
    // Diminished chords typically use flat notation
    useSharps = false;
    // But if the root has a sharp, keep using sharps
    if (rootNote.includes('#')) {
      useSharps = true;
    }
  } else if (chordType === 'augmented') {
    // Augmented chords typically use sharp notation
    useSharps = true;
    // But if the root has a flat, keep using flats
    if (rootNote.includes('b')) {
      useSharps = false;
    }
  } else {
    // For other chord types, check our map
    if (MusicTheory.USE_SHARPS.hasOwnProperty(rootNote)) {
      useSharps = MusicTheory.USE_SHARPS[rootNote];
    } else {
      // For roots not in our map, check if it's a flat note
      useSharps = !rootNote.includes('b');
    }
  }
  
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
    const firstNote = chordNotes.shift();
    const firstDeg  = degreeIndices.shift();
    chordNotes.push(firstNote + 12);
    degreeIndices.push(firstDeg);
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
  /********************
   * New letter-based spelling
   *******************/
  const naturalPC = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const letters = ['C','D','E','F','G','A','B'];
  function nextLetter(baseLetter, steps){
    const idx = letters.indexOf(baseLetter);
    return letters[(idx + steps) % 7];
  }
  function spellLetterPitch(letter, targetPc){
    const basePc = naturalPC[letter];
    let diff = (targetPc - basePc + 12) % 12; // 0-11
    if (diff > 6) diff -= 12;                // now -5..6
    const accMap = { '-2':'bb', '-1':'b', '0':'', '1':'#', '2':'##' };
    if (!(diff in accMap)) {
      // Fallback – shouldn’t occur for triads/sevenths
      return letters[targetPc];
    }
    return letter + accMap[diff];
  }

  const rootLetter = rootNote[0]; // first char always the letter
  const noteNames = [];
  for (let i = 0; i < midiNotes.length; i++) {
    const deg = degreeIndices[i];
    if (deg === 0) {
      noteNames.push(rootNote);
      continue;
    }
    const targetPc = midiNotes[i] % 12;
    const letter = nextLetter(rootLetter, deg*2);
    noteNames.push(spellLetterPitch(letter, targetPc));
  }
  
  // Create a display name for the chord using slash notation for inversions
  let displayName = `${rootNote}${chordDef.suffix}`;
  
  // For inversions, use slash notation (e.g., C/E for C major first inversion)
  if (inversion !== 'root' && noteNames.length > 0) {
    // The bass note is the first note in the chord after inversion
    const bassNote = noteNames[0];
    
    // Special case for Bbdim/E - should be Bbdim/Fb
    if (chordType === 'diminished' && rootNote.includes('b') && bassNote === 'E') {
      displayName = `${rootNote}${chordDef.suffix}/Fb`;
    } 
    // Special case for Dbdim/G - should be Dbdim/Abb
    else if (chordType === 'diminished' && rootNote === 'Db' && bassNote === 'G') {
      displayName = `${rootNote}${chordDef.suffix}/Abb`;
    }
    // Special case for Ebdim/A - should be Ebdim/Bbb
    else if (chordType === 'diminished' && rootNote === 'Eb' && bassNote === 'A') {
      displayName = `${rootNote}${chordDef.suffix}/Bbb`;
    }
    else {
      displayName = `${rootNote}${chordDef.suffix}/${bassNote}`;
    }
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
  let rootNote;
  function pickRandomRoot(){
    const pc = Math.floor(Math.random()*12); // uniform pitch-class
    const names = pcNames[pc];
    // If caller supplied a root list, restrict to those names
    const allowed = config.rootNotes.length ? names.filter(n=>config.rootNotes.includes(n)) : names;
    if (allowed.length===0) return null; // try again
    return allowed[Math.floor(Math.random()*allowed.length)];
  }
  do {
    rootNote = pickRandomRoot();
  } while(rootNote===null);
  
  // Choose a random chord type
  const chordType = config.chordTypes[Math.floor(Math.random() * config.chordTypes.length)];
  
  // Choose inversion
  let inversion = 'root';
  if (config.allowInversions) {
    // Prevent inversions for augmented triads (simple 3-note aug chords)
    const isAugTriad = chordType === 'augmented' && MusicTheory.CHORD_TYPES['augmented'].intervals.length === 3;
    if (!isAugTriad) {
      const possibleInversions = ['root', 'first', 'second'];
      // Add third inversion only for seventh chords
      if (chordType.includes('7')) {
        possibleInversions.push('third');
      }
      inversion = possibleInversions[Math.floor(Math.random() * possibleInversions.length)];
    }
  }
  
  return MusicTheory.generateChord(rootNote, chordType, inversion, config.octave);
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
  
  console.table(results);
  return results;
};

// Validate if played notes match the expected chord and inversion
MusicTheory.validateChord = function(expectedChord, playedMidiNotes) {
  // If inversions are not being checked, use simple pitch class validation
  if (!expectedChord.checkInversion) {
    // Convert played notes to a Set of pitch classes (0-11)
    const playedPitchClasses = new Set();
    playedMidiNotes.forEach(midi => {
      playedPitchClasses.add(midi % 12);
    });
    
    // Convert expected notes to a Set of pitch classes
    const expectedPitchClasses = new Set();
    expectedChord.midiNotes.forEach(midi => {
      expectedPitchClasses.add(midi % 12);
    });
    
    // Check if all expected pitch classes are played
    if (expectedPitchClasses.size !== playedPitchClasses.size) {
      return false;
    }
    
    for (const pitchClass of expectedPitchClasses) {
      if (!playedPitchClasses.has(pitchClass)) {
        return false;
      }
    }
    
    return true;
  } else {
    // For inversion checking, we need to determine the bass note (lowest played note)
    // and check if it matches the expected bass note for this inversion
    
    // Find the lowest played note
    const lowestPlayedNote = Math.min(...Array.from(playedMidiNotes));
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
    playedMidiNotes.forEach(midi => {
      playedPitchClasses.add(midi % 12);
    });
    
    const expectedPitchClasses = new Set();
    expectedChord.midiNotes.forEach(midi => {
      expectedPitchClasses.add(midi % 12);
    });
    
    if (expectedPitchClasses.size !== playedPitchClasses.size) {
      return false;
    }
    
    for (const pitchClass of expectedPitchClasses) {
      if (!playedPitchClasses.has(pitchClass)) {
        return false;
      }
    }
    
    return true;
  }
};
