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
function GameSummary({ questionCount, settings, score, accuracy, highestStreak, onRestart }) {
  // Load previous best streak from localStorage if available
  const previousBest = parseInt(localStorage.getItem('bestStreak') || '0');
  const isNewRecord = highestStreak > previousBest;
  
  // Save new record if applicable
  useEffect(() => {
    if (isNewRecord && highestStreak > 0) {
      localStorage.setItem('bestStreak', highestStreak.toString());
    }
  }, [isNewRecord, highestStreak]);
  
  return (
    <div className="game-summary">
      <h3>Game Summary</h3>
      <div className="summary-stats">
        <div className="summary-item">
          <div className="summary-value">{questionCount}</div>
          <div className="summary-label">Chords Played</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{accuracy}%</div>
          <div className="summary-label">Accuracy</div>
        </div>
        <div className="summary-item">
          <div className={`summary-value ${isNewRecord ? 'new-record' : ''}`}>
            {highestStreak} {isNewRecord && '🏆'}
          </div>
          <div className="summary-label">
            Highest Streak
            {isNewRecord && previousBest > 0 && (
              <div className="previous-best">(Previous: {previousBest})</div>
            )}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{score}</div>
          <div className="summary-label">Final Score</div>
        </div>
      </div>
      <button className="restart-button" onClick={onRestart}>
        Play Again
      </button>
    </div>
  );
}

// Helper function to get time in milliseconds based on difficulty
function getDifficultyTime(difficulty) {
  switch(difficulty) {
    case 'easy': return 12;
    case 'hard': return 3;
    case 'medium':
    default: return 6;
  }
}

// Shared AudioContext for sound effects
let sharedAudioContext = null;

// Sound effect function
const playSound = (type) => {
  // Create AudioContext if it doesn't exist
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  const oscillator = sharedAudioContext.createOscillator();
  const gainNode = sharedAudioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(sharedAudioContext.destination);
  
  switch(type) {
    case 'correct':
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.value = 0.1;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 0.5);
      oscillator.stop(sharedAudioContext.currentTime + 0.5);
      break;
    case 'lifeLoss':
      oscillator.type = 'sine';
      oscillator.frequency.value = 220; // A3
      gainNode.gain.value = 0.2;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 0.7);
      oscillator.stop(sharedAudioContext.currentTime + 0.7);
      break;
    case 'gameOver':
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 220; // A3
      gainNode.gain.value = 0.15;
      oscillator.start();
      
      // Descending pitch for game over
      setTimeout(() => {
        oscillator.frequency.value = 165; // E3
      }, 200);
      setTimeout(() => {
        oscillator.frequency.value = 110; // A2
      }, 400);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, sharedAudioContext.currentTime + 1.0);
      oscillator.stop(sharedAudioContext.currentTime + 1.0);
      break;
  }
};

// Chord Trainer Component
function ChordTrainer({ activeNotes, midiStatus }) {
  // State for the trainer
  const [currentChord, setCurrentChord] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  // Total questions will come from settings
  
  // Game state variables
  const [lives, setLives] = useState(3);           // Player starts with 3 lives
  const [streak, setStreak] = useState(0);         // Current streak of correct answers
  const [multiplier, setMultiplier] = useState(1); // Score multiplier based on streak
  const [highestStreak, setHighestStreak] = useState(0); // Track highest streak
  const [accuracy, setAccuracy] = useState(0);     // Percentage of correct answers
  const [showSummary, setShowSummary] = useState(false); // Whether to show the game summary
  
  // Settings for chord generation with localStorage persistence
  const [settings, setSettings] = useState(() => {
    // Try to get saved settings from localStorage
    const savedSettings = localStorage.getItem('chordTrainerSettings');
    
    // Default settings
    const defaultSettings = {
      chordTypes: ['major', 'minor'], // Start with just major and minor triads
      allowInversions: false,
      // Empty array means use all valid note names with equal sharp/flat probability
      rootNotes: [],
      octave: 4,
      timerMaxSeconds: 10, // Maximum time for timer bar
      questionCount: 10, // Number of questions per session
      questionDelay: 1500, // Delay between questions in milliseconds (default 1.5 seconds)
      optionalFifth: false, // 5th optional for 7th chords and larger
      activePresetId: null, // Track the currently active preset
      difficulty: 'medium' // 'easy' (12s), 'medium' (6s), or 'hard' (3s)
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
  
  // Generate a new chord question
  const generateNewQuestion = useCallback(() => {
    // Check if we've already reached the question limit
    if (questionCount >= settings.questionCount) {
      // End of session
      setIsRunning(false);
      setFeedback({
        type: 'complete',
        message: `Training complete! Final score: ${score}`
      });
      return;
    }
    
    // Make sure any previous timer is cleared
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Ensure settings are valid before generating a chord
    const safeSettings = {...settings};
    
    // Make sure we have at least one chord type selected
    if (!safeSettings.chordTypes || safeSettings.chordTypes.length === 0) {
      safeSettings.chordTypes = ['major', 'minor'];
      console.warn('No chord types selected, defaulting to major and minor');
    }
    
    // Ensure rootNotes is an array (even if empty)
    if (!safeSettings.rootNotes) {
      safeSettings.rootNotes = [];
    }
    
    try {
      // Generate a new chord and add checkInversion flag based on settings
      const newChord = MusicTheory.generateRandomChord(safeSettings);
      
      // Make sure we have a valid chord before setting properties
      if (newChord) {
        newChord.checkInversion = safeSettings.allowInversions;
        newChord.optionalFifth = safeSettings.optionalFifth;
        setCurrentChord(newChord);
      } else {
        // If chord generation failed, try again with default settings
        console.warn('Failed to generate chord, trying with default settings');
        const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
        if (defaultChord) {
          defaultChord.checkInversion = safeSettings.allowInversions;
          defaultChord.optionalFifth = safeSettings.optionalFifth;
          setCurrentChord(defaultChord);
        }
      }
    } catch (error) {
      // Handle any errors during chord generation
      console.error('Error generating chord:', error);
      const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
      if (defaultChord) {
        defaultChord.checkInversion = safeSettings.allowInversions;
        defaultChord.optionalFifth = safeSettings.optionalFifth;
        setCurrentChord(defaultChord);
      }
    }
    
    // Update game state
    setIsRunning(true);
    const now = Date.now();
    setStartTime(now);
    setFeedback(null);
    
    // Start a new timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - now);
    }, 100);
    
  }, [settings, questionCount, score]);
  
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
    setShowSummary(false); // Hide game summary
    
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
      if (currentChord && isRunning && activeNotes.size >= requiredNoteCount) {
      // Convert activeNotes Set to an array of MIDI note numbers
      const playedNotesArray = Array.from(activeNotes);
      const isCorrect = MusicTheory.validateChord(playedNotesArray, currentChord);
      
      if (isCorrect) {
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
        
        // Update accuracy
        const correctAnswers = questionCount + 1; // Current question is correct
        const totalAttempts = correctAnswers; // For now, total attempts equals correct answers
        const newAccuracy = Math.round((correctAnswers / totalAttempts) * 100);
        setAccuracy(newAccuracy);
        
        // Update score and question count
        setScore(prevScore => prevScore + pointsEarned);
        const newQuestionCount = questionCount + 1;
        setQuestionCount(newQuestionCount);
        setIsRunning(false);
        
        // Show feedback with multiplier information
        setFeedback({
          type: 'correct',
          message: `Correct! +${pointsEarned} points (×${newMultiplier})`,
          time: responseTime
        });
        
        // Play correct answer sound
        playSound('correct');
        
        // Check if we've reached the question limit
        if (newQuestionCount >= settings.questionCount) {
          // End of session
          if (settings.questionDelay === 0) {
            // If instant, show completion message immediately
            setFeedback({
              type: 'complete',
              message: `Training complete! Final score: ${score + pointsEarned}`
            });
            
            // Show game summary
            setTimeout(() => {
              setShowSummary(true);
            }, 1500);
          } else {
            // Otherwise wait for the configured delay
            setTimeout(() => {
              setFeedback({
                type: 'complete',
                message: `Training complete! Final score: ${score + pointsEarned}`
              });
              
              // Show game summary
              setTimeout(() => {
                setShowSummary(true);
              }, 1500);
            }, settings.questionDelay);
          }
          return;
        }
        
        // If delay is 0 (instant), move to next question immediately
        if (settings.questionDelay === 0) {
          generateNewQuestion();
          return;
        }
        
        // Otherwise wait for the configured delay
        setTimeout(() => {
          generateNewQuestion();
        }, settings.questionDelay);
      }
    }
  }, [activeNotes, currentChord, isRunning, elapsedTime, generateNewQuestion]);
  
  // Monitor timer completion
  useEffect(() => {
    if (isRunning && elapsedTime >= getDifficultyTime(settings.difficulty) * 1000) {
      // Timer is complete, lose a life
      const newLives = lives - 1;
      setLives(newLives);
      
      // Reset streak and multiplier
      setStreak(0);
      setMultiplier(1);
      
      // Stop the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Play life loss sound
      playSound('lifeLoss');
      
      if (newLives <= 0) {
        // Game over
        setIsRunning(false);
        setFeedback({
          type: 'gameover',
          message: `Game over! Final score: ${score}`
        });
        
        // Play game over sound
        playSound('gameOver');
        
        // Show game summary after a short delay
        setTimeout(() => {
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
      }
    }
  }, [isRunning, elapsedTime, settings.difficulty, lives, score]);
  
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
            onRestart={startTraining}
          />
        ) : (
          <>
            {/* Question display */}
            <div className="question-display">
              {currentChord ? currentChord.displayName : 'C#m'}
            </div>
            
            {/* Timer */}
            <Timer 
              isRunning={isRunning} 
              elapsedTime={elapsedTime} 
              maxSeconds={settings.timerMaxSeconds} 
              difficulty={settings.difficulty} 
            />
            
            {/* Lives display */}
            <LivesDisplay lives={lives} />
            
            {/* Score display */}
            <div className="chord-trainer-score">
              Score: {score}
            </div>
            
            {/* Controls */}
            <div className="controls" style={{ marginTop: '1rem' }}>
              {!isRunning ? (
                <button onClick={startTraining}>Start Training</button>
              ) : (
                <>
                  <button onClick={skipQuestion} className="skip-button">Skip</button>
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
          <PianoKeyboard activeNotes={activeNotes} startOctave={3} endOctave={5} />
        </div>
      </div>
    </div>
  );
}
