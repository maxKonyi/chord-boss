// Import React hooks from the global React object
const { useState, useEffect, useRef, useCallback } = React;

// Preset Selector Component
function PresetSelector({ onSelectPreset }) {
  const [expandedCollection, setExpandedCollection] = useState(null);
  
  // Toggle collection expansion
  const toggleCollection = (collectionId) => {
    setExpandedCollection(expandedCollection === collectionId ? null : collectionId);
  };
  
  return (
    <div className="preset-selector">
      <h4>Preset Progressions</h4>
      
      {Presets.COLLECTIONS.map(collection => (
        <div key={collection.id} className="preset-collection">
          <div 
            className="preset-collection-header" 
            onClick={() => toggleCollection(collection.id)}
          >
            {collection.name}
            <span className="expand-icon">
              {expandedCollection === collection.id ? '▼' : '►'}
            </span>
          </div>
          
          {expandedCollection === collection.id && (
            <div className="preset-list">
              {collection.presets.map(preset => (
                <div 
                  key={preset.id} 
                  className="preset-item"
                  onClick={() => onSelectPreset(preset.id)}
                >
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-description">{preset.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
    // Apply the preset settings
    const newSettings = Presets.applyPreset(presetId, settings);
    
    // Update settings with the preset and mark this preset as active
    setSettings({
      ...newSettings,
      activePresetId: presetId
    });
    
    // Show feedback about the selected preset
    const preset = Presets.getPresetById(presetId);
    setFeedback({
      type: 'preset',
      message: `Preset selected: ${preset.name}`
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
    
    // Generate a new chord and add checkInversion flag based on settings
    const newChord = MusicTheory.generateRandomChord(settings);
    
    // Make sure we have a valid chord before setting properties
    if (newChord) {
      newChord.checkInversion = settings.allowInversions;
      newChord.optionalFifth = settings.optionalFifth;
      setCurrentChord(newChord);
    } else {
      // If chord generation failed, try again with default settings
      console.warn('Failed to generate chord, trying with default settings');
      const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
      if (defaultChord) {
        defaultChord.checkInversion = settings.allowInversions;
        defaultChord.optionalFifth = settings.optionalFifth;
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
  }, [activeNotes, currentChord, isRunning, elapsedTime, generateNewQuestion, settings.questionDelay, settings.questionCount, settings.timerMaxSeconds, questionCount, score]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Group chord types by family for better organization in the UI
  const chordFamilies = [
    {
      name: 'Triads',
      types: [
        { id: 'major', name: 'Major' },
        { id: 'minor', name: 'Minor' },
        { id: 'diminished', name: 'Diminished' },
        { id: 'augmented', name: 'Augmented' },
        { id: 'sus2', name: 'Sus2' },
        { id: 'sus4', name: 'Sus4' }
      ]
    },
    {
      name: 'Seventh Chords',
      types: [
        { id: 'dominant7', name: 'Dominant 7th' },
        { id: 'major7', name: 'Major 7th' },
        { id: 'minor7', name: 'Minor 7th' },
        { id: 'diminished7', name: 'Diminished 7th' },
        { id: 'half-diminished7', name: 'Half-Diminished 7th' },
        { id: 'augmented7', name: 'Augmented 7th' },
        { id: 'augmentedMajor7', name: 'Augmented Major 7th' },
        { id: 'minorMajor7', name: 'Minor Major 7th' }
      ]
    },
    {
      name: 'Extended Chords',
      types: [
        { id: '9', name: '9th' },
        { id: 'major9', name: 'Major 9th' },
        { id: 'minor9', name: 'Minor 9th' },
        { id: '11', name: '11th' },
        { id: 'major11', name: 'Major 11th' },
        { id: 'minor11', name: 'Minor 11th' },
        { id: '13', name: '13th' },
        { id: 'major13', name: 'Major 13th' },
        { id: 'minor13', name: 'Minor 13th' }
      ]
    },
    {
      name: 'Added Tone Chords',
      types: [
        { id: 'add9', name: 'Add9' },
        { id: 'minorAdd9', name: 'Minor Add9' },
        { id: 'add11', name: 'Add11' },
        { id: 'minorAdd11', name: 'Minor Add11' },
        { id: '6', name: '6th' },
        { id: 'minor6', name: 'Minor 6th' },
        { id: '6add9', name: '6/9' },
        { id: 'minor6add9', name: 'Minor 6/9' }
      ]
    }
  ];
  
  // Calculate timer percentage for the progress bar
  const timerPercentage = Math.min(100, (elapsedTime / (settings.timerMaxSeconds * 1000)) * 100);
  
  // Calculate progress percentage for the question counter
  const progressPercentage = (questionCount / settings.questionCount) * 100;
  
  // Toggle a chord type in the settings
  const toggleChordType = (chordType) => {
    setSettings(prevSettings => {
      const newChordTypes = [...prevSettings.chordTypes];
      const index = newChordTypes.indexOf(chordType);
      
      if (index === -1) {
        // Add the chord type
        newChordTypes.push(chordType);
      } else {
        // Remove the chord type
        newChordTypes.splice(index, 1);
      }
      
      // Make sure we have at least one chord type selected
      if (newChordTypes.length === 0) {
        newChordTypes.push(chordType); // Keep the one we just tried to remove
        return prevSettings; // No change
      }
      
      return {
        ...prevSettings,
        chordTypes: newChordTypes,
        activePresetId: null // Clear active preset when manually changing settings
      };
    });
  };
  
  // Toggle a setting boolean
  const toggleSetting = (settingName) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: !prevSettings[settingName],
      activePresetId: null // Clear active preset when manually changing settings
    }));
  };
  
  // Update a numeric setting
  const updateNumericSetting = (settingName, value) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      [settingName]: value,
      activePresetId: null // Clear active preset when manually changing settings
    }));
  };
  
  // Toggle a root note in the settings
  const toggleRootNote = (rootNote) => {
    setSettings(prevSettings => {
      const newRootNotes = [...prevSettings.rootNotes];
      const index = newRootNotes.indexOf(rootNote);
      
      if (index === -1) {
        // Add the root note
        newRootNotes.push(rootNote);
      } else {
        // Remove the root note
        newRootNotes.splice(index, 1);
      }
      
      return {
        ...prevSettings,
        rootNotes: newRootNotes,
        activePresetId: null // Clear active preset when manually changing settings
      };
    });
  };
  
  // Get the appropriate feedback color based on type
  const getFeedbackColor = () => {
    if (!feedback) return 'transparent';
    
    switch (feedback.type) {
      case 'correct':
        return '#4CAF50'; // Green
      case 'skipped':
        return '#FFC107'; // Amber
      case 'complete':
        return '#2196F3'; // Blue
      case 'preset':
        return '#9C27B0'; // Purple
      default:
        return '#F44336'; // Red (error)
    }
  };
  
  return (
    <div className="app-container">
      {/* Left sidebar for settings */}
      <div className="sidebar">
        <h3>Settings</h3>
        
        {/* MIDI Device Selection */}
        <div className="settings-group">
          {midiStatus && (
            <div style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#333', borderRadius: '4px' }}>
              <label>
                MIDI Input: 
                <select 
                  value={midiStatus.selectedInput ? midiStatus.selectedInput.id : 'all'} 
                  onChange={midiStatus.handleInputChange}
                  style={{ marginLeft: '0.5rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                  <option value="all">All inputs</option>
                  {midiStatus.midiInputs.map(input => (
                    <option key={input.id} value={input.id}>
                      {input.name || input.manufacturer || 'Unknown Device'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>
        
        <div className="settings-container">
          {/* Preset Selector - at the top of the sidebar */}
          <div className="settings-group">
            <PresetSelector onSelectPreset={handleSelectPreset} />
          </div>
          
          <div className="settings-divider"></div>
          
          {/* Session Settings */}
          <div className="settings-group">
            <h4>Session</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <label>
                Questions: 
                <select 
                  value={settings.questionCount}
                  onChange={(e) => updateNumericSetting('questionCount', parseInt(e.target.value))}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="50">50</option>
                </select>
              </label>
              
              <label>
                Timer: 
                <select 
                  value={settings.timerMaxSeconds}
                  onChange={(e) => updateNumericSetting('timerMaxSeconds', parseInt(e.target.value))}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="5">5s</option>
                  <option value="10">10s</option>
                  <option value="15">15s</option>
                  <option value="20">20s</option>
                  <option value="30">30s</option>
                  <option value="60">60s</option>
                </select>
              </label>
              
              <label>
                Delay: 
                <select 
                  value={settings.questionDelay}
                  onChange={(e) => updateNumericSetting('questionDelay', parseInt(e.target.value))}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="0">None</option>
                  <option value="500">0.5s</option>
                  <option value="1000">1s</option>
                  <option value="1500">1.5s</option>
                  <option value="2000">2s</option>
                  <option value="3000">3s</option>
                </select>
              </label>
            </div>
          </div>
          
          <div className="settings-divider"></div>
          
          {/* Chord Options */}
          <div className="settings-group">
            <h4>Chord Options</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.allowInversions} 
                  onChange={() => toggleSetting('allowInversions')}
                />
                Allow Inversions
              </label>
              
              <label>
                <input 
                  type="checkbox" 
                  checked={settings.optionalFifth} 
                  onChange={() => toggleSetting('optionalFifth')}
                />
                Optional 5th in 7th+ Chords
              </label>
              
              <label>
                Octave: 
                <select 
                  value={settings.octave}
                  onChange={(e) => updateNumericSetting('octave', parseInt(e.target.value))}
                  style={{ marginLeft: '0.5rem' }}
                >
                  <option value="3">3 (Low)</option>
                  <option value="4">4 (Middle)</option>
                  <option value="5">5 (High)</option>
                </select>
              </label>
            </div>
          </div>
          
          <div className="settings-divider"></div>
          
          {/* Root Note Selection */}
          <div className="settings-group">
            <h4>Root Notes</h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#aaa' }}>
              {settings.rootNotes.length === 0 ? 'All notes (default)' : `${settings.rootNotes.length} selected`}
            </div>
            <div className="root-notes-grid">
              {MusicTheory.PREFERRED_ROOTS.map(note => (
                <button
                  key={note}
                  className={`root-note-button ${settings.rootNotes.includes(note) ? 'selected' : ''}`}
                  onClick={() => toggleRootNote(note)}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>
          
          <div className="settings-divider"></div>
          
          {/* Chord Type Selection */}
          <div className="settings-group">
            <h4>Chord Types</h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: '#aaa' }}>
              {settings.chordTypes.length} selected
            </div>
            
            {chordFamilies.map(family => (
              <div key={family.name} className="chord-family">
                <div className="chord-family-name">{family.name}</div>
                <div className="chord-types-grid">
                  {family.types.map(type => (
                    <button
                      key={type.id}
                      className={`chord-type-button ${settings.chordTypes.includes(type.id) ? 'selected' : ''}`}
                      onClick={() => toggleChordType(type.id)}
                      title={type.name}
                    >
                      {type.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="main-content">
        {/* Question display */}
        <div className="question-display">
          {currentChord ? currentChord.displayName : 'Press Start'}
        </div>
        
        {/* Timer bar */}
        <div className="timer-container">
          <div 
            className="timer-bar" 
            style={{ 
              width: `${timerPercentage}%`,
              backgroundColor: timerPercentage > 80 ? '#F44336' : timerPercentage > 60 ? '#FFC107' : '#4CAF50'
            }}
          ></div>
        </div>
        
        {/* Progress bar */}
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          <div className="progress-text">{questionCount} / {settings.questionCount}</div>
        </div>
        
        {/* Feedback display */}
        {feedback && (
          <div 
            className="feedback-display"
            style={{ backgroundColor: getFeedbackColor() }}
          >
            {feedback.message}
            {feedback.time !== undefined && (
              <div className="feedback-time">
                {(feedback.time / 1000).toFixed(2)}s
              </div>
            )}
          </div>
        )}
        
        {/* Game controls */}
        <div className="game-controls">
          <button 
            className="control-button start-button"
            onClick={startTraining}
            disabled={isRunning}
          >
            Start
          </button>
          
          <button 
            className="control-button skip-button"
            onClick={skipQuestion}
            disabled={!isRunning}
          >
            Skip
          </button>
          
          <button 
            className="control-button reset-button"
            onClick={resetTraining}
            disabled={!isRunning && !currentChord}
          >
            Reset
          </button>
        </div>
        
        {/* Score display */}
        <div className="score-display">
          <div className="score-item">
            <div className="score-value">{score}</div>
            <div className="score-label">Score</div>
          </div>
        </div>
        
        {/* Piano keyboard visualization */}
        <div className="piano-container">
          <div className="piano-keyboard">
            {/* Generate 2 octaves of keys (24 keys) */}
            {Array.from({ length: 24 }, (_, i) => {
              const noteNum = i + 48; // Start at C3 (MIDI note 48)
              const noteName = MusicTheory.midiNoteToName(noteNum);
              const isBlackKey = noteName.includes('#');
              const isActive = activeNotes.has(noteNum);
              const isTarget = currentChord && currentChord.midiNotes.includes(noteNum);
              
              return (
                <div 
                  key={noteNum}
                  className={`piano-key ${isBlackKey ? 'black-key' : 'white-key'} ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`}
                  data-note={noteName}
                >
                  <div className="key-label">{noteName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
