/* Preset System for Composer Piano Trainer
   Provides a collection of predefined settings at different difficulty levels */

// Create a global Presets object to expose our functions and data
const Presets = {};

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

// Define chord progression presets
Presets.PROGRESSION_COLLECTIONS = [
  {
    id: "simple",
    name: "Simple",
    progressions: [
      {
        id: "triads-major-key",
        name: "Triads - Major Key",
        category: "Simple",
        progressions: [
          { id: "1-4-5-1", name: "I-IV-V-I", roman: "I IV V I" },
          { id: "1-5-6-4", name: "I-V-vi-IV", roman: "I V vi IV" },
          { id: "1-6-4-5", name: "I-vi-IV-V", roman: "I vi IV V" },
          { id: "2-5-1", name: "ii-V-I", roman: "ii V I" }
        ]
      },
      {
        id: "triads-minor-key",
        name: "Triads - Minor Key",
        category: "Simple",
        progressions: [
          { id: "1m-4m-5m-1m", name: "i-iv-v-i", roman: "i iv v i" },
          { id: "1m-6-3-7", name: "i-VI-III-VII", roman: "i VI III VII" },
          { id: "1m-4m-7-3", name: "i-iv-VII-III", roman: "i iv VII III" },
          { id: "2dim-5m-1m", name: "ii°-v-i", roman: "ii° v i" }
        ]
      },
      {
        id: "triads-mixed",
        name: "Triads - Mixed",
        category: "Simple",
        progressions: [
          { id: "1-5-6m-4", name: "I-V-vi-IV", roman: "I V vi IV" },
          { id: "6m-4-1-5", name: "vi-IV-I-V", roman: "vi IV I V" },
          { id: "1-4-1-5", name: "I-IV-I-V", roman: "I IV I V" },
          { id: "1-2m-5-1", name: "I-ii-V-I", roman: "I ii V I" }
        ]
      }
    ]
  },
  {
    id: "intermediate",
    name: "Intermediate",
    progressions: [
      {
        id: "sevenths-major-key",
        name: "Sevenths - Major Key",
        category: "Intermediate",
        progressions: [
          { id: "1maj7-4maj7-5dom7-1maj7", name: "Imaj7-IVmaj7-V7-Imaj7", roman: "Imaj7 IVmaj7 V7 Imaj7" },
          { id: "2m7-5dom7-1maj7", name: "ii7-V7-Imaj7", roman: "ii7 V7 Imaj7" },
          { id: "1maj7-6m7-2m7-5dom7", name: "Imaj7-vi7-ii7-V7", roman: "Imaj7 vi7 ii7 V7" },
          { id: "3m7-6m7-2m7-5dom7", name: "iii7-vi7-ii7-V7", roman: "iii7 vi7 ii7 V7" }
        ]
      },
      {
        id: "sevenths-minor-key",
        name: "Sevenths - Minor Key",
        category: "Intermediate",
        progressions: [
          { id: "1m7-4m7-5m7-1m7", name: "i7-iv7-v7-i7", roman: "i7 iv7 v7 i7" },
          { id: "2m7b5-5dom7-1m7", name: "iiø7-V7-i7", roman: "iiø7 V7 i7" },
          { id: "1m7-4m7-7dom7-3maj7", name: "i7-iv7-VII7-IIImaj7", roman: "i7 iv7 VII7 IIImaj7" },
          { id: "1m7-6maj7-2m7b5-5dom7", name: "i7-VImaj7-iiø7-V7", roman: "i7 VImaj7 iiø7 V7" }
        ]
      }
    ]
  },
  {
    id: "complex",
    name: "Complex",
    progressions: [
      {
        id: "jazz-standards",
        name: "Jazz Standards",
        category: "Complex",
        progressions: [
          { id: "2-5-1-turnaround", name: "ii-V-I Turnaround", roman: "ii7 V7 Imaj7 VI7 ii7 V7" },
          { id: "rhythm-changes-a", name: "Rhythm Changes A", roman: "Imaj7 VI7 ii7 V7 IIImaj7 VI7 ii7 V7" },
          { id: "minor-251-variations", name: "Minor ii-V-i Variations", roman: "iiø7 V7b9 i7 IVmaj7" },
          { id: "coltrane-changes", name: "Coltrane Changes", roman: "Imaj7 bIIImaj7 bVmaj7 Imaj7" }
        ]
      },
      {
        id: "extended-chords",
        name: "Extended Chords",
        category: "Complex",
        progressions: [
          { id: "extended-251", name: "Extended ii-V-I", roman: "iim9 V13 Imaj9" },
          { id: "altered-dominants", name: "Altered Dominants", roman: "iim7 V7#5 Imaj7 V7b9" },
          { id: "modal-interchange", name: "Modal Interchange", roman: "Imaj7 bVImaj7 iim7 V7sus4" },
          { id: "sus-progressions", name: "Sus Progressions", roman: "Isus4 IV7sus4 bVIImaj7 Imaj7" }
        ]
      }
    ]
  }
];

// Helper function to get a progression by ID
Presets.getProgressionById = function(progressionId) {
  if (!progressionId) {
    console.error('No progression ID provided');
    return null;
  }
  
  // First check if this is a category ID
  for (const collection of Presets.PROGRESSION_COLLECTIONS) {
    for (const category of collection.progressions) {
      if (category.id === progressionId) {
        // If it's a category ID, select a random progression from this category
        if (category.progressions && category.progressions.length > 0) {
          const randomIndex = Math.floor(Math.random() * category.progressions.length);
          const progression = category.progressions[randomIndex];
          
          if (progression && progression.roman) {
            // Add the roman numerals property that the chord trainer expects
            return {
              ...progression,
              romanNumerals: progression.roman.split(' ')
            };
          }
        }
        console.error(`Category ${progressionId} has no valid progressions`);
        return null;
      }
      
      // Also check for individual progression IDs
      if (category.progressions) {
        for (const progression of category.progressions) {
          if (progression && progression.id === progressionId) {
            if (progression.roman) {
              // Add the roman numerals property that the chord trainer expects
              return {
                ...progression,
                romanNumerals: progression.roman.split(' ')
              };
            } else {
              console.error(`Progression ${progressionId} has no roman numeral data`);
              return null;
            }
          }
        }
      }
    }
  }
  
  console.error(`Progression with ID ${progressionId} not found`);
  return null;
};

if (typeof window !== 'undefined') {
  window.Presets = Presets;
}

export default Presets;
