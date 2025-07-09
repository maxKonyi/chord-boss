// Import React hooks from the global React object
const { useState, useEffect, useRef, useCallback } = React;
// Reference the Sidebar component exposed on the window object
const Sidebar = window.Sidebar;

// Note: PresetSelector has been moved to sidebar.js

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
  
  // Settings for chord generation
  const [settings, setSettings] = useState({
    chordTypes: ['major', 'minor'], // Start with just major and minor triads
    allowInversions: false,
    // Empty array means use all valid note names with equal sharp/flat probability
    rootNotes: [],
    octave: 4,
    timerMaxSeconds: 10, // Maximum time for timer bar
    questionCount: 10, // Number of questions per session
    questionDelay: 1500, // Delay between questions in milliseconds (default 1.5 seconds)
    optionalFifth: false, // 5th optional for 7th chords and larger
    activePresetId: null // Track the currently active preset
  });
  
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
    setSettings({
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
    
    // Show a feedback message with the final score
    setFeedback({
      type: 'complete',
      message: `Game ended. Final score: ${score}`
    });
    
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
        
        // Calculate score (faster = more points) based on timer settings
        const responseTime = elapsedTime;
        const maxTime = settings.timerMaxSeconds * 1000;
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
        
        // Update score and question count
        setScore(prevScore => prevScore + pointsEarned);
        const newQuestionCount = questionCount + 1;
        setQuestionCount(newQuestionCount);
        setIsRunning(false);
        
        // Show feedback
        setFeedback({
          type: 'correct',
          message: `Correct! +${pointsEarned} points`,
          time: responseTime
        });
        
        // Check if we've reached the question limit
        if (newQuestionCount >= settings.questionCount) {
          // End of session
          if (settings.questionDelay === 0) {
            // If instant, show completion message immediately
            setFeedback({
              type: 'complete',
              message: `Training complete! Final score: ${score + pointsEarned}`
            });
          } else {
            // Otherwise wait for the configured delay
            setTimeout(() => {
              setFeedback({
                type: 'complete',
                message: `Training complete! Final score: ${score + pointsEarned}`
              });
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
        {/* Question display - always visible */}
        <div className="question-display">
          {currentChord ? currentChord.displayName : 'C#m'}
        </div>
        
        {/* Timer - always visible */}
        <Timer isRunning={isRunning} elapsedTime={elapsedTime} maxSeconds={settings.timerMaxSeconds} />
        
        {/* Score display - always visible */}
        <div className="score-display">
          <div className="score-item">
            <div className="score-value">{score}</div>
            <div className="score-label">Score</div>
          </div>
          <div className="score-item">
            <div className="score-value">{questionCount}/{settings.questionCount}</div>
            <div className="score-label">Progress</div>
          </div>
          <div className="score-item">
            <div className="score-value">{elapsedTime > 0 ? (elapsedTime / 1000).toFixed(1) : '0.0'}s</div>
            <div className="score-label">Time</div>
          </div>
        </div>
        
        {/* Controls - always visible */}
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
        
        {/* Feedback message area - fixed height */}
        <div className={`result-feedback ${feedback ? (feedback.type === 'correct' ? 'result-correct' : feedback.type === 'skipped' ? 'result-skipped' : feedback.type === 'preset' ? 'result-preset' : 'result-incorrect') : ''}`}>
          {feedback ? feedback.message : ''}
          {/* Removed duplicate Start New Session button */}
        </div>
        
        {/* Piano keyboard inside the main content area */}
        <div className="keyboard-wrapper">
          <PianoKeyboard activeNotes={activeNotes} startOctave={3} endOctave={5} />
        </div>
      </div>
    </div>
  );
}
