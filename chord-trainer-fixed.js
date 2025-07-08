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

// Chord Trainer Component - Basic structure only
function ChordTrainer({ activeNotes, midiStatus }) {
  // State for the trainer
  const [currentChord, setCurrentChord] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [questionCount, setQuestionCount] = useState(0);
  
  // Settings for chord generation
  const [settings, setSettings] = useState({
    chordTypes: ['major', 'minor'],
    allowInversions: false,
    rootNotes: [],
    octave: 4,
    timerMaxSeconds: 10,
    questionCount: 10,
    questionDelay: 1500,
    optionalFifth: false,
    activePresetId: null
  });
  
  // Handle preset selection
  const handleSelectPreset = (presetId) => {
    const newSettings = Presets.applyPreset(presetId, settings);
    setSettings({
      ...newSettings,
      activePresetId: presetId
    });
    const preset = Presets.getPresetById(presetId);
    setFeedback({
      type: 'preset',
      message: `Preset selected: ${preset.name}`
    });
  };
  
  // Simplified render function
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
        </div>
      </div>
      
      {/* Main content area */}
      <div className="main-content">
        {/* Question display */}
        <div className="question-display">
          {currentChord ? currentChord.displayName : 'C#m'}
        </div>
        
        {/* Score display */}
        <div className="score-display">
          <div className="score-item">
            <div className="score-value">{score}</div>
            <div className="score-label">Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
