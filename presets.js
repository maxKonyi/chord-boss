/* Preset System for Composer Piano Trainer
   Provides a collection of predefined settings at different difficulty levels */

// Create a global Presets object to expose our functions and data
window.Presets = {};

// Define the preset collection
Presets.COLLECTIONS = [
  {
    id: "beginner",
    name: "Beginner",
    presets: [
      {
        id: "major-minor-triads-root",
        name: "Major & Minor Triads in Root Position",
        description: "Major and minor triads in root position",
        settings: {
          chordTypes: ['major', 'minor'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "maj-min-triads-inversions",
        name: "Major & Minor Triads with Inversions",
        description: "Major and minor triads with all inversions",
        settings: {
          chordTypes: ['major', 'minor'],
          allowInversions: true,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "aug-dim-root",
        name: "Augmented & Diminished Triads",
        description: "Augmented and diminished triads in root position",
        settings: {
          chordTypes: ['augmented', 'diminished'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "sus2-sus4-root",
        name: "Sus2 & Sus4 Triads",
        description: "Suspended 2nd and 4th chords in root position",
        settings: {
          chordTypes: ['sus2', 'sus4'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "all-triads-inversions",
        name: "All Triads with Inversions",
        description: "All triad types with all inversions",
        settings: {
          chordTypes: ['major', 'minor', 'augmented', 'diminished', 'sus2', 'sus4'],
          allowInversions: true,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      }
    ]
  },
  {
    id: "intermediate",
    name: "Intermediate",
    presets: [
      {
        id: "maj7-min7-dom7-root",
        name: "Maj7, m7 & 7 in Root",
        description: "Major 7th, minor 7th and dominant 7th chords in root position",
        settings: {
          chordTypes: ['major7', 'minor7', 'dominant7'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 12,
          questionCount: 15,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "dim7-m7b5-mmaj7-root",
        name: "Dim7, m7b5 & m(maj7) in Root",
        description: "Diminished 7th, half-diminished 7th and minor-major 7th in root position",
        settings: {
          chordTypes: ['diminished7', 'halfDiminished7', 'minorMajor7'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 12,
          questionCount: 15,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "maj6-min6-root",
        name: "Maj & Min 6 in Root",
        description: "Major 6th and minor 6th chords in root position",
        settings: {
          chordTypes: ['6', 'm6'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 12,
          questionCount: 15,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "all-6ths-7ths-root",
        name: "All 6ths & 7ths in Root",
        description: "All 6th and 7th chord types in root position",
        settings: {
          chordTypes: ['6', 'm6', 'major7', 'minor7', 'dominant7', 'diminished7', 'halfDiminished7', 'minorMajor7'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 12,
          questionCount: 15,
          questionDelay: 1500,
          optionalFifth: false
        }
      }
    ]
  },
  {
    id: "advanced",
    name: "Advanced",
    presets: [
      {
        id: "all-sevenths-inversions",
        name: "All Sevenths with Inversions",
        description: "All types of 7th chords with all inversions",
        settings: {
          chordTypes: ['major7', 'minor7', 'dominant7', 'diminished7', 'halfDiminished7', 'minorMajor7'],
          allowInversions: true,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      },
      {
        id: "maj9-min9-dom9-mM9root",
        name: "Primary Ninths",
        description: "Major 9th, minor 9th, dominant 9th, and minor-major 9th in root position",
        settings: {
          chordTypes: ['major9', 'minor9', 'dominant9', 'minorMajor9'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      },
      {
        id: "six-nine-chords-root",
        name: "6(9) & m6(9) in Root",
        description: "Major 6/9 and minor 6/9 in root position",
        settings: {
          chordTypes: ['6(9)', 'm6(9)'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      },
      {
        id: "all-ninths-root",
        name: "All Ninths in Root",
        description: "All types of 9th chords in root position",
        settings: {
          chordTypes: ['major9', 'minor9', 'dominant9', '6(9)', 'm6(9)'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      },
      {
        id: "all-chords",
        name: "All Chords",
        description: "All chord types in root position",
        settings: {
          chordTypes: ['major', 'minor', 'augmented', 'diminished', 'sus2', 'sus4', '6', 'm6', 'major7', 'minor7', 'dominant7', 'diminished7', 'halfDiminished7', 'minorMajor7', 'major9', 'minor9', 'dominant9', '6(9)', 'm6(9)'],
          allowInversions: false,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      },
      {
        id: "all-chords-inversions",
        name: "All Chords with Inversions",
        description: "All chord types with all inversions",
        settings: {
          chordTypes: ['major', 'minor', 'augmented', 'diminished', 'sus2', 'sus4', '6', 'm6', 'major7', 'minor7', 'dominant7', 'diminished7', 'halfDiminished7', 'minorMajor7', 'major9', 'minor9', 'dominant9', '6(9)', 'm6(9)'],
          allowInversions: true,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 10,
          questionCount: 15,
          questionDelay: 1200,
          optionalFifth: true
        }
      }
    ]
  }
];

// Helper function to get a preset by ID
Presets.getPresetById = function(presetId) {
  for (const collection of Presets.COLLECTIONS) {
    for (const preset of collection.presets) {
      if (preset.id === presetId) {
        return preset;
      }
    }
  }
  return null;
};

// Helper function to apply a preset to the current settings
Presets.applyPreset = function(presetId, currentSettings) {
  const preset = Presets.getPresetById(presetId);
  if (!preset) {
    console.error(`Preset with ID ${presetId} not found`);
    return currentSettings;
  }
  
  // Create a new settings object by merging the preset settings with current settings
  const mergedSettings = { ...currentSettings, ...preset.settings };
  
  // Set inversionMode based on allowInversions from the preset
  if (preset.settings.hasOwnProperty('allowInversions')) {
    if (preset.settings.allowInversions) {
      mergedSettings.inversionMode = 'inversions';
    } else {
      mergedSettings.inversionMode = 'root';
    }
  }
  
  return mergedSettings;
};
