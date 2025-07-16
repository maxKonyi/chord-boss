// Import React hooks from the global React object
const { useState, useEffect, useRef, useCallback } = React;
// Reference the Sidebar component exposed on the window object
const Sidebar = window.Sidebar;

// Note: PresetSelector has been moved to sidebar.js

// Lives display component
function LivesDisplay({ lives }) {
  return (
    <div className="lives-display">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`life-icon ${i < lives ? 'life-active' : 'life-lost'}`}>
          ♥
        </div>
      ))}
    </div>
  );
}

// Game summary component
function GameSummary({ questionCount, settings, score, accuracy, highestStreak, wrongNotesCount, totalAttempts, difficulty, failedChordName, onRestart }) {
  // Check if we're in practice mode using the passed difficulty parameter
  const isPractice = isPracticeMode(difficulty || settings.difficulty);
  
  // Load previous best streak from localStorage if available
  const previousBest = parseInt(localStorage.getItem('bestStreak') || '0');
  const isNewRecord = !isPractice && highestStreak > previousBest;
  
  // Calculate gem rating purely from accuracy (simpler & deterministic)
  // Skip for practice mode
  let gemCount = 0;
  if (!isPractice) {
    if (accuracy === 100 && wrongNotesCount === 0) {
      gemCount = 5; // Perfect play: 5 gems
    } else if (accuracy >= 80) {
      gemCount = 4; // 80–99%
    } else if (accuracy >= 60) {
      gemCount = 3; // 60–79%
    } else if (accuracy >= 40) {
      gemCount = 2; // 40–59%
    } else if (accuracy >= 20) {
      gemCount = 1; // 20–39%
    } else {
      gemCount = 0; // 0–19%
    }
  }
  
  // Save new record if applicable
  useEffect(() => {
    if (isNewRecord && highestStreak > 0) {
      localStorage.setItem('bestStreak', highestStreak.toString());
    }
    
    // Store gem rating in localStorage
    const gameResults = {
      score,
      gemCount,
      accuracy,
      highestStreak,
      wrongNotesCount,
      date: new Date().toISOString()
    };
    
    // Get existing results or initialize empty array
    const existingResults = JSON.parse(localStorage.getItem('gameResults') || '[]');
    existingResults.push(gameResults);
    
    // Store up to 10 most recent results
    localStorage.setItem('gameResults', 
      JSON.stringify(existingResults.slice(-10)));
  }, [isNewRecord, highestStreak, score, gemCount, accuracy, wrongNotesCount]);
  
  return (
    <div className="game-summary">
      <h3>Game Summary</h3>
      
      {/* Failed Chord - Prominently displayed at the top if present */}
      {!isPractice && failedChordName && (
        <div className="failed-chord-display">
          <div className="failed-chord-value">{failedChordName}</div>
          <div className="failed-chord-label">Failed Chord</div>
        </div>
      )}
      
      {/* Row 1: Questions and Difficulty */}
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-value">
            {isPractice ? questionCount : settings.questionCount}
          </div>
          <div className="summary-label">Questions</div>
        </div>
        
        <div className="summary-divider">|</div>
        
        <div className="summary-item">
          <div className="summary-value">
            {(difficulty || settings.difficulty).charAt(0).toUpperCase() + (difficulty || settings.difficulty).slice(1)}
          </div>
          <div className="summary-label">Difficulty</div>
        </div>
      </div>
      
      {/* Row 2: Accuracy, Score, and Streak */}
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-value">{accuracy}%</div>
          <div className="summary-label">Accuracy</div>
        </div>
        
        {/* Only show score in non-practice mode */}
        {!isPractice && (
          <>
            <div className="summary-divider">|</div>
            <div className="summary-item">
              <div className="summary-value">{score}</div>
              <div className="summary-label">Final Score</div>
            </div>
          </>
        )}
        
        {/* Only show streak in non-practice mode */}
        {!isPractice && (
          <>
            <div className="summary-divider">|</div>
            <div className="summary-item">
              <div className={`summary-value ${isNewRecord ? 'new-record' : ''}`}>
                {highestStreak} {isNewRecord && '🏆'}
              </div>
              <div className="summary-label">
                Highest Streak
                {isNewRecord && previousBest > 0 && (
                  <div className="previous-best">Previous: {previousBest}</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Row 3: Gem Rating Display - hidden in Practice mode */}
      {!isPractice && (
        <div className="gem-row">
          <div className="gem-container">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`gem ${i < gemCount ? 'gem-active' : 'gem-inactive'}`}
              >
                ♦
              </div>
            ))}
          </div>
          <div className="gem-label"></div>
        </div>
      )}
      
      <button className="restart-button" onClick={onRestart}>Play Again</button>
    </div>
  );
}

// Helper function to get time in milliseconds based on difficulty
function getDifficultyTime(difficulty) {
  switch(difficulty) {
    case 'practice': return Infinity; // Practice mode has infinite time
    case 'easy': return 12;
    case 'hard': return 3;
    case 'medium':
    default: return 6;
  }
}

// Helper function to check if current difficulty is practice mode
function isPracticeMode(difficulty) {
  return difficulty === 'practice';
}

/**
 * Utility to build a new progression object based on the current settings.
 * Always returns an object of the shape:
 *   { id, name, key, chords:[Chord,…] }
 * Throws an Error if it fails to generate a valid progression.
 */
function createNewProgression(settings) {
  // 1. Choose a progression id
  let progressionId;
  if (settings.selectedProgressions && settings.selectedProgressions.length > 0) {
    const rand = Math.floor(Math.random() * settings.selectedProgressions.length);
    progressionId = settings.selectedProgressions[rand];
  } else {
    progressionId = 'triads-major-key'; // safe default
  }
  const progressionData = Presets.getProgressionById(progressionId);
  if (!progressionData || !Array.isArray(progressionData.romanNumerals) || progressionData.romanNumerals.length === 0) {
    throw new Error(`Invalid progression data for id: ${progressionId}`);
  }

  // 2. Determine key
  let key = 'C';
  if (settings.keyMode === 'fixed') {
    key = settings.fixedKey || 'C';
  } else {
    // random key from valid note names
    const allKeys = MusicTheory.VALID_NOTE_NAMES;
    key = allKeys[Math.floor(Math.random() * allKeys.length)];
  }

  // 3. Build chords array
  const chords = MusicTheory.generateChordProgression(progressionData.romanNumerals, key);
  if (!chords || chords.length === 0) {
    throw new Error('Failed to generate chords for progression');
  }

  return {
    id: progressionId,
    name: progressionData.name || 'Unnamed Progression',
    key,
    chords
  };
}

// Sound effect function
const playSound = (type, settings) => {
  // If audio is muted or this is the wrong chord sound, don't play any sounds
  if ((settings && settings.muteAudio) || type === 'wrong') {
    return;
  }
  
  // Sound file mapping
  const soundFiles = {
    'correct': 'sounds/correct.wav',
    'wrong': 'sounds/wrong.wav',
    'lifeLoss': 'sounds/life-loss.wav',
    'gameOver': 'sounds/game-over.wav'
    // Add more sound mappings here as needed
  };
  
  // Check if we have a sound file for this type
  if (soundFiles[type]) {
    // Create audio element
    const audio = new Audio(soundFiles[type]);
    
    // Play the sound
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
    });
  } else {
    console.warn(`No sound file defined for type: ${type}`);
  }
};

// Chord Trainer Component
function ChordTrainer({ activeNotes, midiStatus }) {
  // State for the trainer
  const [currentChord, setCurrentChord] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessingChord, setIsProcessingChord] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0); // Track total attempts including mistakes
  const [wrongNotesCount, setWrongNotesCount] = useState(0); // Track incorrect notes played
  const [lastWrongAttemptSignature, setLastWrongAttemptSignature] = useState(null);
  const [failedChordNotes, setFailedChordNotes] = useState(new Set()); // Store failed chord notes to display on keyboard
  const [failedChordName, setFailedChordName] = useState(null); // Store failed chord display name
  
  // Progression mode state
  const [currentProgression, setCurrentProgression] = useState(null); // Current progression data
  const [progressionIndex, setProgressionIndex] = useState(0); // Current chord index in progression
  const [completedChords, setCompletedChords] = useState([]); // Indices of completed chords in progression
  const [progressionKey, setProgressionKey] = useState('C'); // Key for current progression
  // Total questions will come from settings
  
  // Game state variables
  const [lives, setLives] = useState(3);           // Player starts with 3 lives
  const [streak, setStreak] = useState(0);         // Current streak of correct answers
  const [multiplier, setMultiplier] = useState(1); // Score multiplier based on streak
  const [highestStreak, setHighestStreak] = useState(0); // Track highest streak
  const [accuracy, setAccuracy] = useState(0);     // Percentage of correct answers
  const [showSummary, setShowSummary] = useState(false); // Whether to show the game summary
  const [gameDifficulty, setGameDifficulty] = useState(null); // Store the game difficulty
  
  // Settings for chord generation with localStorage persistence
  const [settings, setSettings] = useState(() => {
    // Try to get saved settings from localStorage
    const savedSettings = localStorage.getItem('chordTrainerSettings');
    
    // Default settings
    const defaultSettings = {
      chordTypes: ['major', 'minor'], // Start with just major and minor triads
      allowInversions: false,
      inversionMode: 'root', // 'root', 'inversions', or 'free'
      // Empty array means use all valid note names with equal sharp/flat probability
      rootNotes: [],
      octave: 4,
      timerMaxSeconds: 10, // Maximum time for timer bar
      questionCount: 10, // Number of questions per session
      questionDelay: 1500, // Delay between questions in milliseconds (default 1.5 seconds)
      optionalFifth: false, // 5th optional for 7th chords and larger
      activePresetId: null, // Track the currently active preset
      difficulty: 'medium', // 'easy' (12s), 'medium' (6s), or 'hard' (3s)
      // Progression mode settings
      useProgressions: false, // Whether to use chord progressions instead of single chords
      keyMode: 'random', // 'random' or 'fixed'
      fixedKey: 'C', // Key to use when keyMode is 'fixed'
      selectedProgressions: [] // Array of selected progression IDs
    };
    
    // If we have saved settings, parse and return them, otherwise use defaults
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });
  
  // Update settings and save to localStorage
  const updateSettings = (newSettings) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      // Save to localStorage
      localStorage.setItem('chordTrainerSettings', JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  };
  
  // Reference to track active notes
  const activeNotesRef = useRef(new Set());
  
  // Timer interval reference
  const timerRef = useRef(null);
  
  // Reference to track the question delay timeout
  const questionDelayTimeoutRef = useRef(null);
  
  // Skip the current question and move to the next one
  const skipQuestion = () => {
    setLastWrongAttemptSignature(null);
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Update question count but don't add points
    const newQuestionCount = questionCount + 1;
    setQuestionCount(newQuestionCount);
    
    // Check if we've reached the question limit
    if (newQuestionCount >= settings.questionCount) {
      // End of session
      setIsRunning(false); // Only set to false when training is complete
      setFeedback({
        type: 'complete',
        message: `Training complete! Final score: ${score}`
      });
      return;
    }
    
    // If delay is 0 (instant), skip the feedback and move to next question immediately
    if (settings.questionDelay === 0) {
      generateNewQuestion();
      return;
    }
    
    // Otherwise show feedback and wait for the configured delay
    setFeedback({
      type: 'skipped',
      message: 'Question skipped'
    });
    
    // Clear any existing timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Generate next question after the configured delay
    questionDelayTimeoutRef.current = setTimeout(() => {
      generateNewQuestion();
      questionDelayTimeoutRef.current = null; // Clear the reference after it's used
    }, settings.questionDelay);
  };
  
  // Handle preset selection
  const handleSelectPreset = (presetId) => {
    // Get the preset
    const preset = Presets.getPresetById(presetId);
    if (!preset) {
      console.error(`Preset with ID ${presetId} not found`);
      return;
    }
    
    // Apply the preset settings
    const newSettings = Presets.applyPreset(presetId, settings);
    
    // Ensure rootNotes is always an array (even if empty)
    if (!newSettings.rootNotes) {
      newSettings.rootNotes = [];
    }
    
    // Update settings with the preset and mark this preset as active
    updateSettings({
      ...newSettings,
      activePresetId: presetId
    });
    
    // Reset the game state when selecting a preset
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear any pending question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Reset game state
    setIsRunning(false);
    setCurrentChord(null);
    setElapsedTime(0);
    setScore(0);
    setQuestionCount(0);
    
    // Show feedback about the selected preset
    setFeedback({
      type: 'preset',
      message: `Preset selected: ${preset.name}. Click Start to begin training.`
    });
  };
  
  // -----------------------------
  // Progression helper callbacks
  // -----------------------------
  
  // Create and start a new progression
  const startNewProgression = useCallback(() => {
    try {
      const prog = createNewProgression(settings);
      setCurrentProgression(prog);
      setProgressionIndex(0);
      
      // We don't increment the question count here because:
      // 1. For the first progression, it's handled in startTraining
      // 2. For subsequent progressions, it's handled in advanceChord when completing a progression
      // first chord becomes the active question
      const firstChord = prog.chords[0];
      if (firstChord) {
        firstChord.checkInversion = false; // respect inversion later if needed
        firstChord.inversionMode = settings.inversionMode;
        firstChord.optionalFifth = settings.optionalFifth;
        firstChord.progressionIndex = 0;
        firstChord.progressionLength = prog.chords.length;
        firstChord.progressionName = prog.name;
        setCurrentChord(firstChord);
      // Ensure game is flagged as running
      setIsRunning(true);
      }
      // (Re)start timer for the first chord in the new progression
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - now);
      }, 100);
    } catch (err) {
      console.error('Failed to start new progression:', err.message);
      // Do not fall back to single-chord mode anymore; just log the error.
    }
  }, [settings, generateNewQuestion]);

  // Move to the next chord or start a new progression
  const advanceChord = useCallback(() => {
    // For non-progression mode, use the standard generateNewQuestion with delay
    if (!settings.useProgressions) {
      generateNewQuestion();
      return;
    }
    
    // For progression mode, check if we're at the end of a progression
    if (!currentProgression || progressionIndex >= currentProgression.chords.length - 1) {
      // We're at the end of a progression or need to start a new one
      // Increment question count when completing a full progression
      setQuestionCount(prevCount => prevCount + 1);
      
      // Use generateNewQuestion which will handle the delay
      generateNewQuestion();
      return;
    } else {
      // We're advancing to the next chord in the same progression
      // No delay needed between chords in the same progression
      const nextIndex = progressionIndex + 1;
      setProgressionIndex(nextIndex);
      const nextChord = currentProgression.chords[nextIndex];
      if (nextChord) {
        nextChord.checkInversion = false;
        nextChord.inversionMode = settings.inversionMode;
        nextChord.optionalFifth = settings.optionalFifth;
        nextChord.progressionIndex = nextIndex;
        nextChord.progressionLength = currentProgression.chords.length;
        nextChord.progressionName = currentProgression.name;
        setCurrentChord(nextChord);
      }

      // restart timer for the new chord (for progression mode, next chord in same progression)
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - now);
      }, 100);
    }
  }, [settings, currentProgression, progressionIndex, generateNewQuestion, startNewProgression]);

  // Generate a new chord question
  const generateNewQuestion = useCallback(() => {
    if (!settings || questionCount >= settings.questionCount) {
      return;
    }
    
    // Clear any existing question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Show feedback that we're generating a new question
    setFeedback({
      type: 'info',
      message: settings.useProgressions ? 'Next progression...' : 'Next question...'
    });
    
    // Apply the question delay before generating the new question
    // Use the question delay from settings, default to 1500ms if not set
    const delayTime = settings.questionDelay !== undefined ? settings.questionDelay : 1500;
    questionDelayTimeoutRef.current = setTimeout(() => {
      // If progression mode is active, delegate to startNewProgression and exit.
      if (settings.useProgressions) {
        startNewProgression();
        return;
      }
      
      // ---- single-chord mode below ----
      
      // Make sure any previous timer is cleared
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Ensure settings are valid before generating a chord
      const safeSettings = {...settings};
      
      // Make sure we have at least one chord type selected (only for single chord mode)
      if (!safeSettings.useProgressions && (!safeSettings.chordTypes || safeSettings.chordTypes.length === 0)) {
        safeSettings.chordTypes = ['major', 'minor'];
        console.warn('No chord types selected, defaulting to major and minor');
      }
      
      // Ensure rootNotes is an array (even if empty)
      if (!safeSettings.rootNotes) {
        safeSettings.rootNotes = [];
      }
      
      try {
        // Standard single chord mode
        generateRandomSingleChord(safeSettings);
      } catch (error) {
        // Handle any errors during chord generation
        console.error('Error generating chord:', error);
        const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
        if (defaultChord) {
          defaultChord.checkInversion = false;
          defaultChord.inversionMode = settings.inversionMode || 'root';
          defaultChord.optionalFifth = safeSettings.optionalFifth;
          setCurrentChord(defaultChord);
        }
      }
      
      // Update game state
      setIsRunning(true);
      setIsProcessingChord(false); // Reset processing flag when generating a new question
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0); // Explicitly reset elapsed time to 0 for immediate timer bar reset
      setFeedback(null);
      setLastWrongAttemptSignature(null);
      
      // Start a new timer
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - now);
      }, 100);
    }, delayTime); // Use the question delay from settings
    
  }, [settings, questionCount, score, currentProgression, progressionIndex, completedChords]);
  
  // Helper function to generate a random single chord
  const generateRandomSingleChord = (safeSettings) => {
    // Generate a new chord and add checkInversion flag based on settings
    const newChord = MusicTheory.generateRandomChord(safeSettings);
    
    // Make sure we have a valid chord before setting properties
    if (newChord) {
      // Determine if we should check inversions based on the inversion mode
      let checkInversion = false;
      
      switch(safeSettings.inversionMode) {
        case 'root':
          // Root position only - don't check specific inversion, but require root position
          checkInversion = false;
          break;
        case 'inversions':
          // Specific inversions - check for the exact inversion
          checkInversion = true;
          // Make sure allowInversions is true when in 'inversions' mode
          if (!safeSettings.allowInversions) {
            safeSettings.allowInversions = true;
          }
          break;
        case 'free':
          // Any inversion is acceptable, but generate in root position
          checkInversion = false;
          // Make sure allowInversions is false to generate root position chords
          safeSettings.allowInversions = false;
          break;
        default:
          // Default to root position
          checkInversion = false;
      }
      
      newChord.checkInversion = checkInversion;
      newChord.inversionMode = safeSettings.inversionMode;
      newChord.optionalFifth = safeSettings.optionalFifth;
      setCurrentChord(newChord);
    } else {
      // If chord generation failed, try again with default settings
      console.warn('Failed to generate chord, trying with default settings');
      const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
      if (defaultChord) {
        defaultChord.checkInversion = false;
        defaultChord.inversionMode = safeSettings.inversionMode || 'root';
        defaultChord.optionalFifth = safeSettings.optionalFifth;
        setCurrentChord(defaultChord);
      }
    }
  };
  
  // Start a new training session
  const startTraining = () => {
    // Reset all game state completely
    setScore(0);
    setQuestionCount(0);
    setElapsedTime(0);
    setFeedback(null); // Clear any feedback messages
    setCurrentChord(null); // Clear current chord before generating a new one
    setLives(3); // Reset lives
    setStreak(0); // Reset streak
    setMultiplier(1); // Reset multiplier
    setHighestStreak(0); // Reset highest streak
    setAccuracy(0); // Reset accuracy
    setTotalAttempts(0); // Reset total attempts
    setWrongNotesCount(0); // Reset wrong notes count
    setLastWrongAttemptSignature(null);
    setFailedChordNotes(new Set()); // Clear failed chord notes
    setFailedChordName(null);
    setShowSummary(false); // Hide game summary
    // Mark the game as running
    setIsRunning(true);
    setGameDifficulty(settings.difficulty); // Store difficulty for this game
    
    // Stop any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Small delay to ensure state is reset before generating a new question
    // This prevents potential race conditions
    setTimeout(() => {
      generateNewQuestion();
    }, 10);
  };
  
  // Reset everything and end the current game
  const resetTraining = () => {
    setLastWrongAttemptSignature(null);
    setFailedChordNotes(new Set()); // Clear failed chord notes
    setFailedChordName(null);
    // Stop the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Clear any pending question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Reset all game state
    setIsRunning(false);
    setCurrentChord(null);
    setElapsedTime(0);
    setLives(3);
    setStreak(0);
    setMultiplier(1);
    
    // Show a feedback message with the final score
    setFeedback({
      type: 'complete',
      message: `Game ended. Final score: ${score}`
    });
    
    // Show game summary
    setTimeout(() => {
      setShowSummary(true);
    }, 1000);
    
    // Don't reset score and question count immediately
    // This allows the player to see their final stats
  };
  
  // Update active notes reference when activeNotes changes
  useEffect(() => {
    activeNotesRef.current = new Set(activeNotes);
    
    // Check if the current chord is played correctly
    // Determine how many notes are actually required (handle optional 5th)
    const requiredNoteCount = (() => {
        if (!currentChord) return 0;
        let count = currentChord.midiNotes.length;
        if (currentChord.optionalFifth && currentChord.midiNotes.length >= 4) {
          // Allow one note fewer when perfect 5th is optional
          count -= 1;
        }
        return count;
      })();
    if (currentChord && isRunning && !isProcessingChord && activeNotes.size >= requiredNoteCount) {
      // Set processing flag to prevent re-entry while handling this chord
      setIsProcessingChord(true);
        
      // Convert activeNotes Set to an array of MIDI note numbers
      const playedNotesArray = Array.from(activeNotes);
      const isCorrect = MusicTheory.validateChord(playedNotesArray, currentChord);
      
      // Track wrong attempts when an incorrect full chord is played
      if (!isCorrect) {
        // Create a canonical signature of the currently pressed notes
        const signature = playedNotesArray.sort((a,b)=>a-b).join('-');
        // Only penalise if this signature hasn't already been counted for this question
        if (signature !== lastWrongAttemptSignature) {
          setWrongNotesCount(prev => prev + 1);
          setLastWrongAttemptSignature(signature);
          // Reset streak and multiplier on wrong attempt
          setStreak(0);
          setMultiplier(1);
          playSound('wrong', settings);
        }
        // Reset processing flag after a short delay for wrong answers
        setTimeout(() => {
          setIsProcessingChord(false);
        }, 500);
      }
      
      if (isCorrect) {
        // Reset wrong attempt tracker for next question
        setLastWrongAttemptSignature(null);
        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Calculate score with multiplier
        const responseTime = elapsedTime;
        const maxTime = getDifficultyTime(settings.difficulty) * 1000;
        let pointsEarned = 0;
        
        // Dynamic scoring based on percentage of max time
        if (responseTime <= maxTime * 0.2) { // Super fast (0-20% of max time)
          pointsEarned = 10;
        } else if (responseTime <= maxTime * 0.4) { // Very fast (20-40% of max time)
          pointsEarned = 8;
        } else if (responseTime <= maxTime * 0.6) { // Fast (40-60% of max time)
          pointsEarned = 6;
        } else if (responseTime <= maxTime * 0.8) { // Medium (60-80% of max time)
          pointsEarned = 4;
        } else if (responseTime <= maxTime) { // Slow (80-100% of max time)
          pointsEarned = 2;
        } else { // Over max time
          pointsEarned = 1;
        }
        
        // Update streak and multiplier
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        // Update highest streak if needed
        if (newStreak > highestStreak) {
          setHighestStreak(newStreak);
        }
        
        // Calculate multiplier (cap at 5x)
        const newMultiplier = Math.min(Math.floor(newStreak / 2) + 1, 5);
        setMultiplier(newMultiplier);
        
        // Apply multiplier to points
        pointsEarned *= newMultiplier;
        
        // Increment total attempts and update accuracy
        setTotalAttempts(prev => prev + 1);
        const correctAnswers = questionCount + 1; // Current question is correct
        const newTotalAttempts = totalAttempts + 1;
        
        // Calculate accuracy including wrong notes
        // Formula: correctAnswers / (totalAttempts + wrongNotesCount * 0.5)
        const effectiveAttempts = newTotalAttempts + wrongNotesCount * 0.5;
        const newAccuracy = correctAnswers > 0 ? Math.round((correctAnswers / effectiveAttempts) * 100) : 0;
        setAccuracy(newAccuracy);
        
        // Update score
        setScore(prevScore => prevScore + pointsEarned);
        
        // Play correct sound
        playSound('correct', settings);
        
        // Show feedback
        setFeedback({
          type: 'correct',
          message: `Correct! +${pointsEarned} points`
        });
        
        // Only increment question count in single-chord mode
        // In progression mode, we count the entire progression as one question
        if (!settings.useProgressions) {
          setQuestionCount(prevCount => prevCount + 1);
        }
        
        // Handle next step
        advanceChord();
        
        // After a short delay, reset processing flag and check if we've reached max questions
        setTimeout(() => {
          // Reset processing flag
          setIsProcessingChord(false);
          
          // Check if we've reached the max question count
          if (questionCount + 1 >= settings.questionCount) {
            // Game completed successfully
            setIsRunning(false);
            setGameDifficulty(settings.difficulty);
            
            // Show game summary after a short delay
            setTimeout(() => {
              setShowSummary(true);
            }, 1000);
           // Processing flag will be reset in the main setTimeout callback
          } else if (!settings.useProgressions || !currentProgression) {
            // No-op
          }
          // We don't need any additional logic here - advanceChord() already handles
          // progression advancement and timer restart
        }, 1000);
      }
    }
    
    if (isRunning && elapsedTime >= getDifficultyTime(settings.difficulty) * 1000) {
      // Timer is complete, lose a life
      const newLives = lives - 1;
      // Temporarily block further processing until we load the next chord
      setIsProcessingChord(true);
      setLives(newLives);
      
      // Increment total attempts since this counts as a failed attempt
      setTotalAttempts(prev => prev + 1);
      
      // Update accuracy calculation
      const correctAnswers = questionCount;
      const newTotalAttempts = totalAttempts + 1;
      
      // Calculate accuracy including wrong notes
      // Formula: correctAnswers / (totalAttempts + wrongNotesCount * 0.5)
      // This counts each wrong note as half an attempt, giving a more nuanced accuracy score
      const effectiveAttempts = newTotalAttempts + wrongNotesCount * 0.5;
      const newAccuracy = correctAnswers > 0 ? Math.round((correctAnswers / effectiveAttempts) * 100) : 0;
      setAccuracy(newAccuracy);
      
      // Reset streak and multiplier
      setStreak(0);
      setMultiplier(1);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Play life loss sound
      playSound('lifeLoss', settings);
      
      if (newLives <= 0) {
        // Game over
        setIsRunning(false);
        
        // Generate and display the failed chord notes
        if (currentChord) {
          // Get the MIDI notes for the current chord
          const midiNotes = MusicTheory.getChordVoicing(currentChord);
          // Convert to a Set for the PianoKeyboard component
          setFailedChordNotes(new Set(midiNotes));
          setFailedChordName(currentChord.displayName);
          
          setFeedback({
            type: 'gameover',
            message: `Game over! The correct chord is shown on the keyboard. Final score: ${score}`
          });
        } else {
          setFeedback({
            type: 'gameover',
            message: `Game over! Final score: ${score}`
          });
        }
        
        // Play game over sound
        playSound('gameOver', settings);
        
        // Store current difficulty and show game summary after a short delay
        setTimeout(() => {
          setGameDifficulty(settings.difficulty);
          setShowSummary(true);
        }, 1500);
      } else {
        // Continue with same chord
        setFeedback({
          type: 'timeout',
          message: `Time's up! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`
        });
        
        // Restart timer for the same chord
        const now = Date.now();
        setStartTime(now);
        setElapsedTime(0);
        
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - now);
        }, 100);

        // Allow processing of chord again
        setIsProcessingChord(false);
      }
    }
  }, [isRunning, elapsedTime, settings.difficulty, lives, score, questionCount, activeNotes, currentChord, isProcessingChord, lastWrongAttemptSignature, streak, highestStreak, multiplier, wrongNotesCount, totalAttempts]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // No duplicate imports or invalid syntax here

  return (
    <div className="app-container">
      {/* Use our new Sidebar component that's available on the window object */}
      <Sidebar 
        settings={settings} 
        setSettings={setSettings} 
        midiStatus={midiStatus}
        handleSelectPreset={handleSelectPreset}
      />
      
      {/* Main content area */}
      <div className="main-content">
        {showSummary ? (
          <GameSummary 
            questionCount={questionCount}
            settings={settings}
            score={score}
            accuracy={accuracy}
            highestStreak={highestStreak}
            wrongNotesCount={wrongNotesCount}
            totalAttempts={totalAttempts}
            difficulty={gameDifficulty}
            failedChordName={failedChordName}
            onRestart={startTraining}
          />
        ) : (
      <>
        {/* Question display */}
        <div className="question-display">
          {currentChord ? currentChord.displayName : '---'}
        </div>

        {/* Progression display - only shown when in progression mode */}
        {settings.useProgressions && currentProgression && (
          <div className="progression-display">
            {/* Show progression name */}
            <div className="progression-name">
              {progressionKey} - {currentProgression.name}
            </div>
            {/* Display all chords in the progression with indicators */}
            <div className="progression-chords">
              {currentProgression.chords.map((chord, index) => (
                <div 
                  key={index} 
                  className={`progression-chord ${index === progressionIndex ? 'current' : ''} ${completedChords.includes(index) ? 'completed' : ''}`}
                >
                  {chord.displayName}
                  <div 
                    className={`progression-indicator ${index === progressionIndex ? 'current' : ''} ${completedChords.includes(index) ? 'completed' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
            
            {/* Timer */}
            <Timer 
              isRunning={isRunning} 
              elapsedTime={elapsedTime} 
              maxSeconds={settings.timerMaxSeconds} 
              difficulty={settings.difficulty} 
            />
            
            {/* Lives display */}
            <LivesDisplay lives={lives} />
            
            {/* Score display - hidden in Practice mode */}
            {!isPracticeMode(settings.difficulty) && (
              <div className="chord-trainer-score">
                Score: {score}
              </div>
            )}
            
            {/* Controls */}
            <div className="controls" style={{ marginTop: '1rem' }}>
              {!isRunning ? (
                <button onClick={startTraining}>Start Training</button>
              ) : (
                <>
                  {/* Skip button only shown in Practice mode */}
                  {isPracticeMode(settings.difficulty) && (
                    <button onClick={skipQuestion} className="skip-button">Skip</button>
                  )}
                  <button onClick={resetTraining} className="end-button">End Game</button>
                </>
              )}
            </div>
            
            {/* Feedback message area */}
            <div className={`result-feedback ${feedback ? (feedback.type === 'correct' ? 'result-correct' : feedback.type === 'skipped' ? 'result-skipped' : feedback.type === 'preset' ? 'result-preset' : 'result-incorrect') : ''}`}>
              {feedback ? feedback.message : ''}
            </div>
          </>
        )}
        
        {/* Piano keyboard inside the main content area */}
        <div className="keyboard-wrapper">
          <PianoKeyboard activeNotes={activeNotes} failedChordNotes={failedChordNotes} startOctave={3} endOctave={5} />
        </div>
      </div>
    </div>
  );
}

// Export the ChordTrainer component to the global window object
window.ChordTrainer = ChordTrainer;
