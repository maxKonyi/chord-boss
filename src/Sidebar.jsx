// Import React hooks from the global React object
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MidiUtils from './midi-utils.js';
import Presets from './presets.js';

// Help Modal Component
function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  // Create the modal content
  const modalContent = (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={e => e.stopPropagation()}>
        <button className="help-close-btn" onClick={onClose}>×</button>
        <h3>How to Use Chord Boss</h3>
        
        <div className="help-section">
          <h4>Getting Started</h4>
          <p>Welcome to Chord Boss, a tool to help you learn and practice piano chords!</p>
          <p>To begin, make sure your MIDI keyboard is connected. Then either:</p>
          <ul>
            <li>Select a preset from the dropdown menu, or</li>
            <li>Customize your training using the settings in the sidebar</li>
          </ul>
          <p>Click the <strong>Start</strong> button when you're ready to begin.</p>
        </div>
        
        <div className="help-section">
          <h4>Session Settings</h4>
          <ul>
            <li><strong>Q:</strong> Number of questions in your practice session</li>
            <li><strong>Diff:</strong> Difficulty level (Practice mode gives unlimited time)</li>
            <li><strong>Inv:</strong> Inversion mode
              <ul>
                <li>No - Play chords in root position only</li>
                <li>Yes - Play specific inversions as shown</li>
                <li>Free - Any inversion of the chord is accepted</li>
              </ul>
            </li>
            <li><strong>Delay:</strong> Time between questions</li>
          </ul>
        </div>
        
        <div className="help-section">
          <h4>Chord Types</h4>
          <p>Select which chord types you want to practice:</p>
          <ul>
            <li><strong>Triads:</strong> Major, Minor, Diminished, Augmented, Sus2, Sus4</li>
            <li><strong>6th Chords:</strong> Major 6th, Minor 6th</li>
            <li><strong>7th Chords:</strong> Dominant 7th, Major 7th, Minor 7th, etc.</li>
          </ul>
          <p>Use the <strong>Clear All</strong> button to deselect all chord types.</p>
        </div>
        
        <div className="help-section">
          <h4>Playing the Game</h4>
          <p>When a chord appears on screen:</p>
          <ol>
            <li>Read the chord name and any inversion indicator</li>
            <li>Play the chord on your MIDI keyboard</li>
            <li>If correct, you'll see a green confirmation</li>
            <li>If incorrect, you can try again until time runs out</li>
          </ol>
          <p>In Practice mode, there's no time limit, so you can take your time learning each chord.</p>
        </div>
        
        <div className="help-section">
          <h4>Tips</h4>
          <ul>
            <li>Start with the Basic Triads preset if you're new to piano chords</li>
            <li>Use Practice mode to learn new chord types without pressure</li>
            <li>Gradually increase difficulty as you improve</li>
            <li>Toggle between light and dark keyboard modes using the button above the keyboard</li>
          </ul>
        </div>
      </div>
    </div>
  );
  
  // Use createPortal to render the modal at the document body level
  // This ensures it's outside any stacking contexts that might affect z-index
  return createPortal(modalContent, document.body);
}

// Sidebar Component
function Sidebar({ settings, setSettings, midiStatus, handleSelectPreset }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Settings</h3>
        <button 
          className="help-button" 
          onClick={() => setIsHelpOpen(true)}
          title="View help and tutorial"
        >
          Help
        </button>
      </div>
      
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      
      {/* MIDI Device Selection */}
      <div className="settings-group">
        {midiStatus && (
          <div style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#333', borderRadius: '4px' }}>
            <label>
              MIDI Input: 
              <select 
                value={midiStatus.selectedInput || MidiUtils.ALL_INPUTS_VALUE} 
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
        {/* Preset Selector - Pop-out style */}
        <div className="settings-group" style={{ marginBottom: '0.5rem', width: '100%' }}>
          <PresetSelector onSelectPreset={handleSelectPreset} />
        </div>
        
        {/* Session Settings - Compact Layout */}
        <div className="settings-group">
          <h4 style={{ marginBottom: '0.1rem', fontSize: '0.9rem' }}>Session</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            Q: 
            <select 
              value={settings.questionCount}
              onChange={e => setSettings({...settings, questionCount: parseInt(e.target.value)})}
              style={{ marginLeft: '0.15rem', padding: '0.15rem', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>
          
          {/* Timer option removed as it's now controlled by difficulty */}
          
          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            Diff: 
            <select 
              value={settings.difficulty}
              onChange={e => {
                // Use the updateSettings function to ensure localStorage is updated
                const newSettings = {...settings, difficulty: e.target.value};
                setSettings(newSettings);
                localStorage.setItem('chordTrainerSettings', JSON.stringify(newSettings));
              }}
              style={{ marginLeft: '0.15rem', padding: '0.15rem', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}
            >
              <option value="practice">Practice (∞)</option>
              <option value="easy">Easy (12s)</option>
              <option value="medium">Medium (6s)</option>
              <option value="hard">Hard (3s)</option>
            </select>
          </label>
          
          {/* Inversion Mode Selector */}
          <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
            Inv: 
            <select 
              value={settings.inversionMode}
              onChange={e => {
                // Update inversion mode and ensure localStorage is updated
                const newSettings = {
                  ...settings, 
                  inversionMode: e.target.value,
                  // If switching to 'inversions' mode, ensure allowInversions is true
                  // If switching to 'free' mode, ensure allowInversions is false
                  allowInversions: e.target.value === 'inversions' ? true : 
                                  e.target.value === 'free' ? false : 
                                  settings.allowInversions
                };
                setSettings(newSettings);
                localStorage.setItem('chordTrainerSettings', JSON.stringify(newSettings));
              }}
              style={{ marginLeft: '0.15rem', padding: '0.15rem', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}
            >
              <option value="root">No</option>
              <option value="inversions">Yes</option>
              <option value="free">Free</option>
            </select>
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
              Delay: <span style={{ minWidth: '1.8rem', textAlign: 'right' }}>{(settings.questionDelay / 1000).toFixed(1)}s</span>
            </label>
            {/* Custom slider implementation */}
            <div 
              style={{
                width: '60px',
                position: 'relative',
                height: '8px',
                display: 'flex',
                alignItems: 'center',
                margin: '0 0.1rem'
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
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#bb86fc', /* Purple to match theme */
                  position: 'absolute',
                  left: `${(settings.questionDelay / 3000) * 100}%`,
                  transform: 'translateX(-50%)',
                  cursor: 'pointer',
                  boxShadow: '0 0 2px rgba(0,0,0,0.3)'
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
      
      {/* Tabs for Chord Types and Progressions */}
      <div className="settings-group chord-selection">
        <div className="sidebar-tabs">
          <button 
            className={`sidebar-tab ${!settings.useProgressions ? 'active' : ''}`}
            onClick={() => setSettings({...settings, useProgressions: false})}
          >
            Qualities
          </button>
          <button 
            className={`sidebar-tab ${settings.useProgressions ? 'active' : ''}`}
            onClick={() => setSettings({...settings, useProgressions: true})}
          >
            Progressions
          </button>
        </div>
        
        {/* Key Selector - Only visible when progressions are enabled */}
        {settings.useProgressions && (
          <div className="key-selector" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Key:
              <select
                value={settings.keyMode}
                onChange={e => {
                  const newKeyMode = e.target.value;
                  const newSettings = {
                    ...settings,
                    keyMode: newKeyMode
                  };
                  // If switching to fixed key, set a default key if not already set
                  if (newKeyMode === 'fixed' && !settings.fixedKey) {
                    newSettings.fixedKey = 'C';
                  }
                  setSettings(newSettings);
                }}
                style={{ marginLeft: '0.5rem', padding: '0.15rem', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}
              >
                <option value="random">Random Key</option>
                <option value="fixed">Fixed Key</option>
              </select>
            </label>
            
            {/* Fixed Key Selector - Only visible when fixed key is selected */}
            {settings.keyMode === 'fixed' && (
              <div style={{ marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Fixed Key:
                  <select
                    value={settings.fixedKey || 'C'}
                    onChange={e => setSettings({...settings, fixedKey: e.target.value})}
                    style={{ marginLeft: '0.5rem', padding: '0.15rem', background: '#222', color: 'white', border: '1px solid #444', fontSize: '0.85rem' }}
                  >
                    {['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'].map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
        )}
        
        {/* Chord Qualities Tab Content */}
        {!settings.useProgressions && (
          <>
            <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Chord Types
              {settings.chordTypes.length > 0 && (
                <button 
                  className="clear-all-btn" 
                  onClick={() => setSettings({...settings, chordTypes: []})}
                  title="Clear all selected chord types"
                  style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                >
                  Clear All
                </button>
              )}
            </h4>
          </>  
        )}
        
        {/* Progressions Tab Content */}
        {settings.useProgressions && (
          <div className="progression-selection">
            <h4 style={{ marginBottom: '0.25rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Progression Types
              {(settings.selectedProgressions && settings.selectedProgressions.length > 0) && (
                <button 
                  className="clear-all-btn" 
                  onClick={() => setSettings({...settings, selectedProgressions: []})}
                  title="Clear all selected progression types"
                  style={{ fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}
                >
                  Clear All
                </button>
              )}
            </h4>
            
            {/* Simple Progressions */}
            <div className="chord-family-accordion" style={{ marginBottom: '0.3rem' }}>
              <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                <span>Simple</span>
              </div>
              
              <div className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
                <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                  {Presets.PROGRESSION_COLLECTIONS[0].progressions.map(category => (
                    <button 
                      key={category.id}
                      className={`chord-type-toggle ${settings.selectedProgressions && settings.selectedProgressions.includes(category.id) ? 'active' : ''}`}
                      onClick={() => {
                        const newSelected = [...(settings.selectedProgressions || [])];
                        if (newSelected.includes(category.id)) {
                          const index = newSelected.indexOf(category.id);
                          newSelected.splice(index, 1);
                        } else {
                          newSelected.push(category.id);
                        }
                        setSettings({...settings, selectedProgressions: newSelected});
                      }}
                      style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Intermediate Progressions */}
            <div className="chord-family-accordion" style={{ marginBottom: '0.3rem' }}>
              <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                <span>Intermediate</span>
              </div>
              
              <div className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
                <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                  {Presets.PROGRESSION_COLLECTIONS[1].progressions.map(category => (
                    <button 
                      key={category.id}
                      className={`chord-type-toggle ${settings.selectedProgressions && settings.selectedProgressions.includes(category.id) ? 'active' : ''}`}
                      onClick={() => {
                        const newSelected = [...(settings.selectedProgressions || [])];
                        if (newSelected.includes(category.id)) {
                          const index = newSelected.indexOf(category.id);
                          newSelected.splice(index, 1);
                        } else {
                          newSelected.push(category.id);
                        }
                        setSettings({...settings, selectedProgressions: newSelected});
                      }}
                      style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Complex Progressions */}
            <div className="chord-family-accordion" style={{ marginBottom: '0.3rem' }}>
              <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                <span>Complex</span>
              </div>
              
              <div className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
                <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem' }}>
                  {Presets.PROGRESSION_COLLECTIONS[2].progressions.map(category => (
                    <button 
                      key={category.id}
                      className={`chord-type-toggle ${settings.selectedProgressions && settings.selectedProgressions.includes(category.id) ? 'active' : ''}`}
                      onClick={() => {
                        const newSelected = [...(settings.selectedProgressions || [])];
                        if (newSelected.includes(category.id)) {
                          const index = newSelected.indexOf(category.id);
                          newSelected.splice(index, 1);
                        } else {
                          newSelected.push(category.id);
                        }
                        setSettings({...settings, selectedProgressions: newSelected});
                      }}
                      style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Triads Section - Compact Layout */}
        <div className="chord-family-accordion" style={{ marginBottom: '0.3rem', display: settings.useProgressions ? 'none' : 'block' }}>
          <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
            <span>Triads</span>
            <label className="select-all-switch" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                checked={['major', 'minor', 'diminished', 'augmented', 'sus2', 'sus4'].every(type => 
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
                style={{ margin: '0 0.2rem 0 0' }}
              />
              <span className="select-all-label">All</span>
            </label>
          </div>
          
          <div id="triads-content" className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
            <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                Dim
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                Aug
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                Sus4
              </button>
            </div>
          </div>
        </div>
        
        {/* 6th Chords Category - Compact Layout */}
        <div className="chord-family-accordion" style={{ marginBottom: '0.3rem', display: settings.useProgressions ? 'none' : 'block' }}>
          <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
            <span>6th Chords</span>
            <label className="select-all-switch" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
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
                style={{ margin: '0 0.2rem 0 0' }}
              />
              <span className="select-all-label">All</span>
            </label>
          </div>
          <div id="sixths-content" className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
            <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                m6
              </button>
            </div>
          </div>
        </div>

        {/* 7th Chords Section - Compact Layout */}
        <div className="chord-family-accordion" style={{ marginBottom: '0.3rem', display: settings.useProgressions ? 'none' : 'block' }}>
          <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
            <span>7th Chords</span>
            <label className="select-all-switch" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
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
                style={{ margin: '0 0.2rem 0 0' }}
              />
              <span className="select-all-label">All</span>
            </label>
          </div>
          
          <div id="sevenths-content" className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
            <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                mM7
              </button>
            </div>
          </div>
        </div>
        
        {/* 9th Chords Section - Compact Layout */}
        <div className="chord-family-accordion" style={{ marginBottom: '0.3rem', display: settings.useProgressions ? 'none' : 'block' }}>
          <div className="chord-family-header" style={{ padding: '0.2rem 0.3rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
            <span>9th Chords</span>
            <label className="select-all-switch" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
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
                style={{ margin: '0 0.2rem 0 0' }}
              />
              <span className="select-all-label">All</span>
            </label>
          </div>
          
          <div id="ninths-content" className="chord-family-content" style={{display: 'block', marginTop: '0.2rem'}}>
            <div className="chord-type-toggles" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.25rem' }}>
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                mM9
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
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
                style={{ padding: '0.15rem 0.1rem', fontSize: '0.8rem' }}
              >
                m6(9)
              </button>
            </div>
          </div>
        </div>
      </div>
     </div> {/* Close settings-panel */}
      
      <div className="settings-group" style={{ marginTop: '0.3rem' }}>
        <h4 style={{ fontSize: '0.9rem', margin: '0.2rem 0', padding: '0.2rem 0' }}>Options</h4>
        {/* Inversion checkbox removed - replaced by inversion mode selector */}
        <div style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={settings.optionalFifth}
              onChange={e => setSettings({ ...settings, optionalFifth: e.target.checked })}
              style={{ margin: '0 0.3rem 0 0' }}
            />
            Make 5th Optional for 7th+ chords
          </label>
        </div>
        <div style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={settings.muteAudio || false}
              onChange={e => setSettings({ ...settings, muteAudio: e.target.checked })}
              style={{ margin: '0 0.3rem 0 0' }}
            />
            Mute audio
          </label>
        </div>
      </div>
    </div>
  );
}

// Preset Selector Component
function PresetSelector({ onSelectPreset }) {
  const [expandedCollection, setExpandedCollection] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoutRef = useRef(null);
  const buttonRef = useRef(null);
  const [popoutPosition, setPopoutPosition] = useState({ top: 0, left: 0 });
  
  // Toggle collection expansion
  const toggleCollection = (collectionId) => {
    setExpandedCollection(expandedCollection === collectionId ? null : collectionId);
  };
  
  // Update popout position when button position changes or when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoutPosition({
        top: rect.top,
        left: rect.right + 5 // 5px offset from the button
      });
    }
  }, [isOpen]);
  
  // Close popout when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoutRef.current && !popoutRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div className="preset-selector" style={{ width: '100%' }}>
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)} 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0.3rem 0.5rem',
          fontSize: '0.85rem',
          backgroundColor: '#333',
          color: 'white',
          border: '1px solid #444',
          borderRadius: '4px',
          cursor: 'pointer',
          margin: '0 auto'
        }}
      >
        <span>Preset Progressions</span>
        <span>{isOpen ? '▼' : '►'}</span>
      </button>
      
      {isOpen && (
        <div 
          ref={popoutRef}
          style={{
            position: 'fixed',
            top: `${popoutPosition.top}px`,
            left: `${popoutPosition.left}px`,
            width: '220px',
            backgroundColor: '#222',
            border: '1px solid #444',
            borderRadius: '4px',
            padding: '0.5rem',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>Preset Progressions</h4>
          
          {Presets.COLLECTIONS.map(collection => (
            <div key={collection.id} className="preset-collection" style={{ marginBottom: '0.5rem' }}>
              <div 
                className="preset-collection-header" 
                onClick={() => toggleCollection(collection.id)}
                style={{
                  padding: '0.25rem',
                  backgroundColor: '#333',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem'
                }}
              >
                {collection.name}
                <span className="expand-icon">
                  {expandedCollection === collection.id ? '▼' : '►'}
                </span>
              </div>
              
              {expandedCollection === collection.id && (
                <div className="preset-list" style={{ marginTop: '0.25rem' }}>
                  {collection.presets.map(preset => (
                    <div 
                      key={preset.id} 
                      className="preset-item"
                      onClick={() => {
                        onSelectPreset(preset.id);
                        setIsOpen(false); // Close after selection
                      }}
                      style={{
                        padding: '0.25rem',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        marginBottom: '0.25rem',
                        ':hover': { backgroundColor: '#444' }
                      }}
                    >
                      <div className="preset-name" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{preset.name}</div>
                      <div className="preset-description" style={{ fontSize: '0.75rem', color: '#aaa' }}>{preset.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Export the Sidebar component to make it available to other files
if (typeof window !== 'undefined') {
  window.Sidebar = Sidebar;
}

export default Sidebar;
