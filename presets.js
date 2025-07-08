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
        id: "major-triads",
        name: "Major Triads",
        description: "Basic major triads in root position",
        settings: {
          chordTypes: ['major'],
          allowInversions: false,
          rootNotes: ['C', 'F', 'G'],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "major-minor-triads",
        name: "Major & Minor Triads",
        description: "Major and minor triads in root position",
        settings: {
          chordTypes: ['major', 'minor'],
          allowInversions: false,
          rootNotes: ['C', 'F', 'G', 'A', 'D'],
          octave: 4,
          timerMaxSeconds: 15,
          questionCount: 10,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "major-first-inv",
        name: "Major Triads with 1st Inversion",
        description: "Major triads in root and first inversion",
        settings: {
          chordTypes: ['major'],
          allowInversions: true,
          rootNotes: ['C', 'F', 'G'],
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
        id: "all-triads",
        name: "All Triad Types",
        description: "Major, minor, diminished and augmented triads",
        settings: {
          chordTypes: ['major', 'minor', 'diminished', 'augmented'],
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
        id: "triads-all-inv",
        name: "Triads with All Inversions",
        description: "Major and minor triads in all inversions",
        settings: {
          chordTypes: ['major', 'minor'],
          allowInversions: true,
          rootNotes: [],
          octave: 4,
          timerMaxSeconds: 12,
          questionCount: 15,
          questionDelay: 1500,
          optionalFifth: false
        }
      },
      {
        id: "seventh-chords",
        name: "Basic 7th Chords",
        description: "Major 7th and Dominant 7th chords",
        settings: {
          chordTypes: ['major7', 'dominant7'],
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
        id: "all-sevenths",
        name: "All 7th Chord Types",
        description: "All types of 7th chords in root position",
        settings: {
          chordTypes: ['major7', 'dominant7', 'minor7', 'diminished7', 'halfDiminished7', 'minorMajor7'],
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
        id: "sevenths-inversions",
        name: "7th Chords with Inversions",
        description: "Major 7th and Dominant 7th with inversions",
        settings: {
          chordTypes: ['major7', 'dominant7'],
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
        id: "ninth-chords",
        name: "9th Chords",
        description: "Extended 9th chords",
        settings: {
          chordTypes: ['dominant9', 'major9', 'minor9'],
          allowInversions: false,
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
  // This ensures any future settings we add won't break existing presets
  return { ...currentSettings, ...preset.settings };
};
