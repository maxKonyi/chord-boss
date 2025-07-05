// Import React hooks from the global React object
const { useState, useEffect, useRef, useCallback } = React;

// Chord Trainer Component
function ChordTrainer({ activeNotes }) {
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
    questionCount: 10 // Number of questions per session
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
    setQuestionCount(prevCount => prevCount + 1);
    setIsRunning(false);
    
    // Show feedback
    setFeedback({
      type: 'skipped',
      message: 'Question skipped'
    });
    
    // Generate next question after a short delay
    setTimeout(() => {
      generateNewQuestion();
    }, 1000);
  };
  
  // Generate a new chord question
  const generateNewQuestion = useCallback(() => {
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
      setCurrentChord(newChord);
    } else {
      // If chord generation failed, try again with default settings
      console.warn('Failed to generate chord, trying with default settings');
      const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
      if (defaultChord) {
        defaultChord.checkInversion = settings.allowInversions;
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
    setIsRunning(false);
    setCurrentChord(null);
    setScore(0);
    setQuestionCount(0);
    setFeedback(null);
    setElapsedTime(0);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Update active notes reference when activeNotes changes
  useEffect(() => {
    activeNotesRef.current = new Set(activeNotes);
    
    // Check if the current chord is played correctly
    if (currentChord && isRunning && activeNotes.size >= currentChord.midiNotes.length) {
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
        setQuestionCount(prevCount => prevCount + 1);
        setIsRunning(false);
        
        // Show feedback
        setFeedback({
          type: 'correct',
          message: `Correct! +${pointsEarned} points`,
          time: responseTime
        });
        
        // Generate next question after a short delay
        setTimeout(() => {
          generateNewQuestion();
        }, 1500);
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
    <div>
      {!currentChord && !isRunning && (
        <div className="controls">
          <button onClick={startTraining}>Start Training</button>
        </div>
      )}
      
      {currentChord && (
        <>
          <div className="question-display">
            {currentChord.displayName}
          </div>
          
          <Timer isRunning={isRunning} elapsedTime={elapsedTime} maxSeconds={settings.timerMaxSeconds} />
          
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
          
          {isRunning && (
            <div className="controls" style={{ marginTop: '1rem' }}>
              <button onClick={skipQuestion} className="skip-button">Skip</button>
            </div>
          )}
        </>
      )}
      
      {feedback && (
        <div className={`result-feedback ${feedback.type === 'correct' ? 'result-correct' : feedback.type === 'skipped' ? 'result-skipped' : 'result-incorrect'}`}>
          {feedback.message}
          {feedback.type === 'complete' && (
            <div className="controls" style={{ marginTop: '1rem' }}>
              <button onClick={startTraining}>Start New Session</button>
            </div>
          )}
        </div>
      )}
      
      {/* Expanded settings panel for M4 */}
      <div className="settings-panel">
        <h3 className="settings-title">Settings</h3>
        
        <div className="settings-group">
          <h4>Chord Types</h4>
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={settings.chordTypes.includes('major')} 
                onChange={e => {
                  const newTypes = [...settings.chordTypes];
                  if (e.target.checked) {
                    if (!newTypes.includes('major')) newTypes.push('major');
                  } else {
                    const index = newTypes.indexOf('major');
                    if (index > -1) newTypes.splice(index, 1);
                  }
                  setSettings({...settings, chordTypes: newTypes});
                }}
              />
              Major Triads
            </label>
          </div>
          
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={settings.chordTypes.includes('minor')} 
                onChange={e => {
                  const newTypes = [...settings.chordTypes];
                  if (e.target.checked) {
                    if (!newTypes.includes('minor')) newTypes.push('minor');
                  } else {
                    const index = newTypes.indexOf('minor');
                    if (index > -1) newTypes.splice(index, 1);
                  }
                  setSettings({...settings, chordTypes: newTypes});
                }}
              />
              Minor Triads
            </label>
          </div>
          
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={settings.chordTypes.includes('diminished')} 
                onChange={e => {
                  const newTypes = [...settings.chordTypes];
                  if (e.target.checked) {
                    if (!newTypes.includes('diminished')) newTypes.push('diminished');
                  } else {
                    const index = newTypes.indexOf('diminished');
                    if (index > -1) newTypes.splice(index, 1);
                  }
                  setSettings({...settings, chordTypes: newTypes});
                }}
              />
              Diminished Triads
            </label>
          </div>
          
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={settings.chordTypes.includes('augmented')} 
                onChange={e => {
                  const newTypes = [...settings.chordTypes];
                  if (e.target.checked) {
                    if (!newTypes.includes('augmented')) newTypes.push('augmented');
                  } else {
                    const index = newTypes.indexOf('augmented');
                    if (index > -1) newTypes.splice(index, 1);
                  }
                  setSettings({...settings, chordTypes: newTypes});
                }}
              />
              Augmented Triads
            </label>
          </div>
        </div>
        
        <div className="settings-group">
          <h4>Inversions</h4>
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
        </div>
        
        <div className="settings-group">
          <h4>Session</h4>
          <div>
            <label>
              Questions: 
              <select 
                value={settings.questionCount}
                onChange={e => setSettings({...settings, questionCount: parseInt(e.target.value)})}
                style={{ marginLeft: '0.5rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
              </select>
            </label>
          </div>
          
          <div style={{ marginTop: '0.5rem' }}>
            <label>
              Timer Max: 
              <select 
                value={settings.timerMaxSeconds}
                onChange={e => setSettings({...settings, timerMaxSeconds: parseInt(e.target.value)})}
                style={{ marginLeft: '0.5rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
              >
                <option value="5">5 seconds</option>
                <option value="10">10 seconds</option>
                <option value="15">15 seconds</option>
                <option value="20">20 seconds</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
