// Import React hooks from the global React object
const { useState, useEffect, useRef, useCallback } = React;

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
    optionalFifth: false // 5th optional for 7th chords and larger
  });
  
  // Reference to track active notes
  const activeNotesRef = useRef(new Set());
  
  // Timer interval reference
  const timerRef = useRef(null);
  
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
    
    // Generate next question after the configured delay
    setTimeout(() => {
      generateNewQuestion();
    }, settings.questionDelay);
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
    setIsRunning(true);
    const now = Date.now();
    setStartTime(now);
    setFeedback(null);
    
    // Start the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - now);
    }, 100);
    
  }, [settings, questionCount, score]);
  
  // Start the training session
  const startTraining = () => {
    setScore(0);
    setQuestionCount(0);
    generateNewQuestion();
  };
  
  // Reset everything
  const resetTraining = () => {
    // Stop the timer if it's running
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Reset all game state
    setIsRunning(false);
    setCurrentChord(null);
    setScore(0);
    setQuestionCount(0);
    setElapsedTime(0);
    
    // Show a feedback message briefly before clearing it
    setFeedback({
      type: 'info',
      message: 'Game ended'
    });
    
    // Clear the feedback message after a short delay
    setTimeout(() => {
      setFeedback(null);
    }, 1000);
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
        
        <div className="settings-panel">
          {/* Session Settings - Moved to top */}
          <div className="settings-group">
            <h4>Session</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <label>
              Questions: 
              <select 
                value={settings.questionCount}
                onChange={e => setSettings({...settings, questionCount: parseInt(e.target.value)})}
                style={{ marginLeft: '0.25rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </label>
            
            <label>
              Timer: 
              <select 
                value={settings.timerMaxSeconds}
                onChange={e => setSettings({...settings, timerMaxSeconds: parseInt(e.target.value)})}
                style={{ marginLeft: '0.25rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="15">15s</option>
                <option value="20">20s</option>
              </select>
            </label>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.9rem' }}>
                Delay: {(settings.questionDelay / 1000).toFixed(1)}s
              </label>
              {/* Custom slider implementation */}
              <div 
                style={{
                  width: '80px',
                  position: 'relative',
                  height: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  marginTop: '20px'
                }}
              >
                {/* Slider track */}
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#222',
                    borderRadius: '4px',
                    position: 'absolute'
                  }}
                  onClick={e => {
                    // Calculate position click within track
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    const newValue = Math.round((pos * 3000) / 100) * 100; // Step of 100
                    setSettings({...settings, questionDelay: newValue});
                  }}
                ></div>
                
                {/* Slider thumb */}
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#4a90e2',
                    position: 'absolute',
                    left: `${(settings.questionDelay / 3000) * 100}%`,
                    transform: 'translateX(-50%)',
                    cursor: 'pointer',
                    boxShadow: '0 0 3px rgba(0,0,0,0.4)'
                  }}
                  onMouseDown={e => {
                    e.preventDefault();
                    
                    // Get initial position
                    const startX = e.clientX;
                    const startValue = settings.questionDelay;
                    const parentRect = e.currentTarget.parentElement.getBoundingClientRect();
                    const trackWidth = parentRect.width;
                    
                    // Handle mouse move
                    const handleMouseMove = moveEvent => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaRatio = deltaX / trackWidth;
                      const deltaValue = deltaRatio * 3000;
                      let newValue = Math.round((startValue + deltaValue) / 100) * 100; // Step of 100
                      
                      // Clamp value
                      newValue = Math.max(0, Math.min(3000, newValue));
                      
                      setSettings({...settings, questionDelay: newValue});
                    };
                    
                    // Handle mouse up
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    // Add document-level event listeners
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chord Types Selection */}
        <div className="settings-group chord-selection">
          <h4>
            Chord Types
            {settings.chordTypes.length > 0 && (
              <button 
                className="clear-all-btn" 
                onClick={() => setSettings({...settings, chordTypes: []})}
                title="Clear all selected chord types"
              >
                Clear All
              </button>
            )}
          </h4>
          
          {/* Triads Section */}
          <div className="chord-family-accordion">
            <div className="chord-family-header">
              Triads
              <label className="select-all-switch">
                <input 
                  type="checkbox" 
                  checked={['major', 'minor', 'diminished', 'augmented'].every(type => 
                    settings.chordTypes.includes(type)
                  )}
                  onChange={e => {
                    const triadTypes = ['major', 'minor', 'diminished', 'augmented', 'sus2', 'sus4'];
                    let newTypes = [...settings.chordTypes];
                    
                    if (e.target.checked) {
                      // Add all triad types that aren't already included
                      triadTypes.forEach(type => {
                        if (!newTypes.includes(type)) newTypes.push(type);
                      });
                    } else {
                      // Remove all triad types
                      newTypes = newTypes.filter(type => !triadTypes.includes(type));
                    }
                    
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                />
                <span className="select-all-label">Select All</span>
              </label>
            </div>
            
            <div id="triads-content" className="chord-family-content" style={{display: 'block'}}>
              <div className="chord-type-toggles">
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('major') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('major')) {
                      const index = newTypes.indexOf('major');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('major');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Major
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('minor') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('minor')) {
                      const index = newTypes.indexOf('minor');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('minor');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Minor
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('diminished') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('diminished')) {
                      const index = newTypes.indexOf('diminished');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('diminished');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Diminished
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('augmented') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('augmented')) {
                      const index = newTypes.indexOf('augmented');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('augmented');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Augmented
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('sus2') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('sus2')) {
                      const index = newTypes.indexOf('sus2');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('sus2');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Sus2
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('sus4') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('sus4')) {
                      const index = newTypes.indexOf('sus4');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('sus4');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                >
                  Sus4
                </button>
              </div>
            </div>
          </div>
          
          {/* 6th Chords Category */}
          <div className="chord-family-accordion">
            <div className="chord-family-header">
              6th Chords
              <label className="select-all-switch">
                <input
                  type="checkbox"
                  checked={['6','m6'].every(type => settings.chordTypes.includes(type))}
                  onChange={e => {
                    const sixthTypes = ['6','m6'];
                    let newTypes = [...settings.chordTypes];
                    if (e.target.checked) {
                      sixthTypes.forEach(type => {
                        if (!newTypes.includes(type)) newTypes.push(type);
                      });
                    } else {
                      newTypes = newTypes.filter(type => !sixthTypes.includes(type));
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                />
                <span className="select-all-label">Select All</span>
              </label>
            </div>
            <div id="sixths-content" className="chord-family-content" style={{display: 'block'}}>
              <div className="chord-type-toggles">
                {/* Major 6 */}
                <button
                  className={`chord-type-toggle ${settings.chordTypes.includes('6') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('6')) {
                      newTypes.splice(newTypes.indexOf('6'),1);
                    } else {
                      newTypes.push('6');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Major 3rd, Perfect 5th, Major 6th"
                >
                  6
                </button>
                {/* Minor 6 */}
                <button
                  className={`chord-type-toggle ${settings.chordTypes.includes('m6') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('m6')) {
                      newTypes.splice(newTypes.indexOf('m6'),1);
                    } else {
                      newTypes.push('m6');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Perfect 5th, Major 6th"
                >
                  m6
                </button>
              </div>
            </div>
          </div>

          {/* 7th Chords Section */}
          <div className="chord-family-accordion">
            <div className="chord-family-header">
              7th Chords
              <label className="select-all-switch">
                <input 
                  type="checkbox" 
                  checked={['major7', 'dominant7', 'minor7', 'diminished7', 'halfDiminished7'].every(type => 
                    settings.chordTypes.includes(type)
                  )}
                  onChange={e => {
                    const seventhTypes = ['major7', 'dominant7', 'minor7', 'diminished7', 'halfDiminished7', 'minorMajor7'];
                    let newTypes = [...settings.chordTypes];
                    
                    if (e.target.checked) {
                      // Add all 7th chord types that aren't already included
                      seventhTypes.forEach(type => {
                        if (!newTypes.includes(type)) newTypes.push(type);
                      });
                    } else {
                      // Remove all 7th chord types
                      newTypes = newTypes.filter(type => !seventhTypes.includes(type));
                    }
                    
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                />
                <span className="select-all-label">Select All</span>
              </label>
            </div>
            
            <div id="sevenths-content" className="chord-family-content" style={{display: 'block'}}>
              <div className="chord-type-toggles">
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('major7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('major7')) {
                      const index = newTypes.indexOf('major7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('major7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Major 3rd, Perfect 5th, Major 7th"
                >
                  maj7
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('dominant7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('dominant7')) {
                      const index = newTypes.indexOf('dominant7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('dominant7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Major 3rd, Perfect 5th, Minor 7th"
                >
                  7
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('minor7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('minor7')) {
                      const index = newTypes.indexOf('minor7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('minor7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Perfect 5th, Minor 7th"
                >
                  m7
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('diminished7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('diminished7')) {
                      const index = newTypes.indexOf('diminished7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('diminished7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Diminished 5th, Diminished 7th"
                >
                  dim7
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('halfDiminished7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('halfDiminished7')) {
                      const index = newTypes.indexOf('halfDiminished7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('halfDiminished7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Diminished 5th, Minor 7th"
                >
                  m7b5
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('minorMajor7') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('minorMajor7')) {
                      const index = newTypes.indexOf('minorMajor7');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('minorMajor7');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Perfect 5th, Major 7th"
                >
                  m(maj7)
                </button>
              </div>
            </div>
          </div>
          
          {/* 9th Chords Section */}
          <div className="chord-family-accordion">
            <div className="chord-family-header">
              9th Chords
              <label className="select-all-switch">
                <input 
                  type="checkbox" 
                  checked={['dominant9', 'major9', 'minor9', '6(9)', 'm6(9)'].every(type => 
                    settings.chordTypes.includes(type)
                  )}
                  onChange={e => {
                    const ninthTypes = ['dominant9', 'major9', 'minor9', 'minorMajor9', '6(9)', 'm6(9)'];
                    let newTypes = [...settings.chordTypes];
                    
                    if (e.target.checked) {
                      // Add all 9th chord types that aren't already included
                      ninthTypes.forEach(type => {
                        if (!newTypes.includes(type)) newTypes.push(type);
                      });
                    } else {
                      // Remove all 9th chord types
                      newTypes = newTypes.filter(type => !ninthTypes.includes(type));
                    }
                    
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                />
                <span className="select-all-label">Select All</span>
              </label>
            </div>
            
            <div id="ninths-content" className="chord-family-content" style={{display: 'block'}}>
              <div className="chord-type-toggles">
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('dominant9') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('dominant9')) {
                      const index = newTypes.indexOf('dominant9');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('dominant9');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Major 3rd, Perfect 5th, Minor 7th, Major 9th"
                >
                  9
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('major9') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('major9')) {
                      const index = newTypes.indexOf('major9');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('major9');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Major 3rd, Perfect 5th, Major 7th, Major 9th"
                >
                  maj9
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('minor9') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('minor9')) {
                      const index = newTypes.indexOf('minor9');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('minor9');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Perfect 5th, Minor 7th, Major 9th"
                >
                  m9
                </button>
                
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('minorMajor9') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('minorMajor9')) {
                      const index = newTypes.indexOf('minorMajor9');
                      newTypes.splice(index, 1);
                    } else {
                      newTypes.push('minorMajor9');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Root, Minor 3rd, Perfect 5th, Major 7th, Major 9th"
                >
                  m(maj9)
                </button>
                {/* 6(9) */}
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('6(9)') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('6(9)')) {
                      newTypes.splice(newTypes.indexOf('6(9)'),1);
                    } else {
                      newTypes.push('6(9)');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Major 6 add 9"
                >
                  6(9)
                </button>
                {/* m6(9) */}
                <button 
                  className={`chord-type-toggle ${settings.chordTypes.includes('m6(9)') ? 'active' : ''}`}
                  onClick={() => {
                    const newTypes = [...settings.chordTypes];
                    if (newTypes.includes('m6(9)')) {
                      newTypes.splice(newTypes.indexOf('m6(9)'),1);
                    } else {
                      newTypes.push('m6(9)');
                    }
                    setSettings({...settings, chordTypes: newTypes});
                  }}
                  title="Minor 6 add 9"
                >
                  m6(9)
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-group">
          <h4>Options</h4>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={settings.allowInversions} 
                onChange={e => setSettings({...settings, allowInversions: e.target.checked})}
              />
              Include Inversions
            </label>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <label>
              <input
                type="checkbox"
                checked={settings.optionalFifth}
                onChange={e => setSettings({ ...settings, optionalFifth: e.target.checked })}
              />
              Make Perfect 5th Optional for 7th chords and larger
            </label>
          </div>
        </div>
        </div>
      </div>
      
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
        <div className={`result-feedback ${feedback ? (feedback.type === 'correct' ? 'result-correct' : feedback.type === 'skipped' ? 'result-skipped' : 'result-incorrect') : ''}`}>
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
