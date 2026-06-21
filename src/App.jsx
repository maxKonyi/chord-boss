/* Chord Boss - Milestone 3
   Added Chord Mode functionality with basic triads. */

import { useState, useEffect } from 'react';
import ChordTrainer from './ChordTrainer.jsx';
import MidiUtils from './midi-utils.js';
import MusicTheory from './music-theory.js';

// Note mapping constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIDI_NOTE_NAMES = {};
for (let i = 0; i < 128; i++) {
  const octave = Math.floor(i / 12) - 1; // MIDI octaves start at -1
  const noteName = NOTES[i % 12];
  MIDI_NOTE_NAMES[i] = { name: noteName, octave };
}

function refreshMidiInputs(access) {
  const inputs = [];
  if (!access) return inputs;

  access.inputs.forEach(input => {
    if (input.state !== 'disconnected') {
      inputs.push(input);
    }
  });
  return inputs;
}

function getSavedMidiInput(inputs) {
  const savedInput = localStorage.getItem('selectedMidiInput');
  return savedInput && inputs.some(input => input.id === savedInput) ? savedInput : null;
}

function getSelectedInputName(midiInputs, selectedInput) {
  if (!selectedInput) return 'All inputs';

  const input = midiInputs.find(candidate => candidate.id === selectedInput);
  return input ? (input.name || input.manufacturer || 'Unknown Device') : 'Unavailable input';
}

function App() {
  const [page, setPage] = useState('chord'); // 'chord' | 'scale'
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiAccessState, setMidiAccessState] = useState('initializing');
  const [midiError, setMidiError] = useState(null);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [midiInputs, setMidiInputs] = useState([]);
  const [lastMidiMessage, setLastMidiMessage] = useState(null);
  const [selectedInput, setSelectedInput] = useState(() => {
    // Try to get the saved MIDI input from localStorage
    return localStorage.getItem('selectedMidiInput');
  });
  
  // Request MIDI access when component mounts
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      setMidiAccessState('requesting');
      navigator.requestMIDIAccess()
        .then(access => {
          console.log('MIDI Access granted!');
          setMidiAccessState('ready');
          setMidiAccess(access);
          
          // Get list of inputs
          const inputs = refreshMidiInputs(access);
          setMidiInputs(inputs);
          
          // Use saved input or default to "All inputs" (null means listen to all inputs)
          setSelectedInput(getSavedMidiInput(inputs));

          access.onstatechange = () => {
            const refreshedInputs = refreshMidiInputs(access);
            setMidiInputs(refreshedInputs);
            setSelectedInput(currentSelection => {
              if (!currentSelection || refreshedInputs.some(input => input.id === currentSelection)) {
                return currentSelection;
              }

              localStorage.removeItem('selectedMidiInput');
              return null;
            });
          };
        })
        .catch(err => {
          console.error('MIDI Access denied!', err);
          setMidiAccessState('error');
          setMidiError('Could not access your MIDI devices: ' + err.message);
        });
    } else {
      setMidiAccessState('unsupported');
      setMidiError('Web MIDI API is not supported in your browser');
    }
  }, []);
  
  // Set up MIDI input listeners when selected input changes
  useEffect(() => {
    const handleMIDIMessage = (message) => {
      const noteMessage = MidiUtils.parseNoteMessage(message.data);
      
      if (!noteMessage) return;

      setLastMidiMessage({
        ...noteMessage,
        noteName: MidiUtils.getMidiNoteName(noteMessage.note),
        receivedAt: Date.now()
      });

      if (noteMessage.type === 'noteon') {
        setActiveNotes(prev => {
          const updated = new Set(prev);
          updated.add(noteMessage.note);
          return updated;
        });
      }
      else if (noteMessage.type === 'noteoff') {
        setActiveNotes(prev => {
          const updated = new Set(prev);
          updated.delete(noteMessage.note);
          return updated;
        });
      }
    };
    
    // If selectedInput is null, listen to all inputs
    if (selectedInput === null && midiAccess) {
      // Set up listeners for all inputs
      const inputListeners = new Map();
      
      midiInputs.forEach(input => {
        input.onmidimessage = handleMIDIMessage;
        inputListeners.set(input.id, input);
      });
      
      // Clean up function to remove all listeners
      return () => {
        inputListeners.forEach(input => {
          input.onmidimessage = null;
        });
      };
    } 
    // Otherwise listen to just the selected input
    else if (selectedInput && midiAccess) {
      // Find the input object by ID
      const inputObj = midiInputs.find(input => input.id === selectedInput);
      
      // If we found the input, set up the listener
      if (inputObj) {
        inputObj.onmidimessage = handleMIDIMessage;
        
        return () => {
          inputObj.onmidimessage = null;
        };
      }
    }
  }, [selectedInput, midiAccess, midiInputs]);
  
  // Handle MIDI input selection change
  const handleMidiInputChange = (e) => {
    const inputId = e.target.value;
    const newValue = MidiUtils.normalizeInputSelection(inputId);
    
    // Update state
    setSelectedInput(newValue);
    
    // Save to localStorage
    if (newValue === null) {
      localStorage.removeItem('selectedMidiInput');
    } else {
      localStorage.setItem('selectedMidiInput', newValue);
    }
  };

  const renderContent = () => {
    return (
      <TrainerLayout 
        title="Piano Chord Trainer" 
        activeNotes={activeNotes}
      >
        <ChordTrainer 
          activeNotes={activeNotes} 
          midiStatus={{
            midiAccess,
            midiError,
            midiInputs,
            selectedInput,
            selectedInputName: getSelectedInputName(midiInputs, selectedInput),
            accessState: midiAccessState,
            activeNoteCount: activeNotes.size,
            lastMidiMessage,
            lastNoteName: lastMidiMessage ? lastMidiMessage.noteName : '',
            lastMessageType: lastMidiMessage ? lastMidiMessage.type : '',
            handleInputChange: handleMidiInputChange
          }}
        />
      </TrainerLayout>
    );
  };

  return <div className="app-container">{renderContent()}</div>;
}

// Home component removed as we now go directly to the chord trainer

function TrainerLayout({ title, children, activeNotes }) {
  return (
    <div style={{ width: '100%', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
        <h2>{title}</h2>
      </div>
      
      <div style={{ margin: '1rem 0' }}>
        {children}
      </div>
    </div>
  );
}

function MidiStatus({ midiAccess, midiError, midiInputs, selectedInput, handleInputChange }) {
  if (midiError) {
    return (
      <div style={{ margin: '1rem 0', padding: '0.5rem', background: '#ff5555', color: 'white', borderRadius: '4px' }}>
        <p>{midiError}</p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Try using Chrome or Edge, and make sure your MIDI device is connected.
        </p>
      </div>
    );
  }
  
  if (!midiAccess) {
    return (
      <div style={{ margin: '1rem 0', padding: '0.5rem', background: '#555', color: 'white', borderRadius: '4px' }}>
        <p>Initializing MIDI...</p>
      </div>
    );
  }
  
  if (midiInputs.length === 0) {
    return (
      <div style={{ margin: '1rem 0', padding: '0.5rem', background: '#ff9900', color: 'white', borderRadius: '4px' }}>
        <p>No MIDI devices detected. Please connect a MIDI device and refresh the page.</p>
      </div>
    );
  }
  
  return (
    <div style={{ margin: '1rem 0', padding: '0.5rem', background: '#333', borderRadius: '4px' }}>
      <label>
        MIDI Input: 
        <select 
          value={selectedInput || MidiUtils.ALL_INPUTS_VALUE} 
          onChange={handleInputChange}
          style={{ marginLeft: '0.5rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
        >
          <option value="all">All inputs</option>
          {midiInputs.map(input => (
            <option key={input.id} value={input.id}>
              {input.name || input.manufacturer || 'Unknown Device'}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function PianoKeyboard({ activeNotes, failedChordNotes = new Set(), startOctave = 3, endOctave = 5 }) {
  // State for dark mode toggle with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Try to get the saved preference from localStorage
    const savedDarkMode = localStorage.getItem('pianoKeyboardDarkMode');
    // Return the parsed value if it exists, otherwise default to false
    return savedDarkMode ? JSON.parse(savedDarkMode) : false;
  });

  const keyboardRange = MidiUtils.getKeyboardOctaveRange(activeNotes, failedChordNotes, startOctave, endOctave);
  const visibleStartOctave = keyboardRange.startOctave;
  const visibleEndOctave = keyboardRange.endOctave;
  
  // Generate keys for the specified octave range
  const keys = [];
  for (let octave = visibleStartOctave; octave <= visibleEndOctave; octave++) {
    NOTES.forEach((note, index) => {
      const isSharp = note.includes('#');
      const midiNote = (octave + 1) * 12 + index; // MIDI octaves start at -1
      const isActive = activeNotes.has(midiNote);
      const isFailed = failedChordNotes.has(midiNote);
      
      keys.push({
        note,
        octave,
        midiNote,
        isSharp,
        isActive,
        isFailed
      });
    });
  }
  
  // Calculate the width percentage for each white key
  const whiteKeysCount = keys.filter(key => !key.isSharp).length;
  const whiteKeyWidth = 100 / whiteKeysCount;
  
  // Track white key index for positioning black keys
  let whiteKeyIndex = 0;
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    // Update state
    setIsDarkMode(newDarkMode);
    // Save to localStorage
    localStorage.setItem('pianoKeyboardDarkMode', JSON.stringify(newDarkMode));
  };
  
  return (
    <div className={`keyboard-container ${isDarkMode ? 'dark-mode-keyboard' : ''}`}>
      <div className="keyboard-mode-toggle">
        <button 
          onClick={toggleDarkMode} 
          className={`mode-toggle-btn ${isDarkMode ? 'dark' : 'light'}`}
        >
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <div className="piano-keyboard">
        {/* Render white keys first (lower z-index) */}
        {keys.filter(key => !key.isSharp).map((key) => {
          whiteKeyIndex++;
          return (
            <div 
              key={`${key.note}${key.octave}`}
              className={`piano-key white ${key.isActive ? 'active' : ''} ${key.isFailed ? 'failed' : ''}`}
              style={{ width: `${whiteKeyWidth}%` }}
            >
              {key.note === 'C' && <span className="key-label">C{key.octave}</span>}
            </div>
          );
        })}
        
        {/* Reset white key index for black key positioning */}
        {(() => {
          whiteKeyIndex = 0;
          return null;
        })()}
        
        {/* Render black keys on top (higher z-index) */}
        {keys.filter(key => key.isSharp).map((key) => {
          // Calculate position based on the note
          const noteIndex = NOTES.indexOf(key.note);
          const prevWhiteNoteIndex = noteIndex - 1;
          
          // Find the position of the white key to the left
          const whiteKeyPosition = keys.findIndex(k => 
            !k.isSharp && 
            k.octave === key.octave && 
            NOTES.indexOf(k.note) === prevWhiteNoteIndex
          );
          
          // Calculate the white key index (0-based)
          const whiteKeysBefore = keys.filter(k => 
            !k.isSharp && 
            (k.octave < key.octave || 
             (k.octave === key.octave && NOTES.indexOf(k.note) <= prevWhiteNoteIndex))
          ).length;
          
          // Position the black key between white keys
          // For C# and F#, they need slightly different positioning than D#, G#, A#
          let offset = 0.4; // Adjusted to center black keys better
          if (key.note === 'D#' || key.note === 'G#' || key.note === 'A#') {
            offset = 0.35; // Adjusted to center black keys better
          }
          
          return (
            <div 
              key={`${key.note}${key.octave}`}
              className={`piano-key black ${key.isActive ? 'active' : ''} ${key.isFailed ? 'failed' : ''}`}
              style={{ left: `${(whiteKeysBefore - offset) * whiteKeyWidth}%` }}
            >
              {/* No labels for black keys */}
            </div>
          );
        })}
        
        {/* Octave indicators */}
        {Array.from({ length: visibleEndOctave - visibleStartOctave + 1 }, (_, i) => visibleStartOctave + i).map(octave => (
          <div 
            key={`octave-${octave}`}
            className="octave-indicator"
            style={{ 
              left: `${(keys.findIndex(k => k.octave === octave && k.note === 'C') / keys.length) * 100}%` 
            }}
          >
            C{octave}
          </div>
        ))}
      </div>
    </div>
  );
}

// Timer component for chord and scale trainers
function Timer({ isRunning, elapsedTime, maxSeconds = 10, difficulty }) {
  // Detect when timer is at zero to disable transition
  const noTransition = elapsedTime === 0;
  // Check if we're in practice mode (infinite time)
  const isPractice = difficulty === 'practice';
  
  // Calculate max time based on difficulty if provided
  const difficultyTimes = {
    practice: Infinity, // Practice mode has infinite time
    easy: 12,
    medium: 6,
    hard: 3
  };
  
  // Use difficulty-based timing if provided, otherwise fall back to maxSeconds
  const actualMaxSeconds = difficulty ? (difficultyTimes[difficulty] || maxSeconds) : maxSeconds;
  const maxMs = actualMaxSeconds * 1000;
  
  // For practice mode, always show empty timer bar in green
  if (isPractice) {
    return (
      <div className="timer-container">
        {isRunning && (
          <div className="timer-progress timer-green" style={{ width: '0%' }} />
        )}
      </div>
    );
  }
  
  // Regular timer logic for non-practice modes
  // Calculate color based on elapsed time percentages
  const yellowThreshold = maxMs * 0.3; // 30% of max time
  const redThreshold = maxMs * 0.75;   // 75% of max time - turn red in last quarter
  
  let timerClass = 'timer-green';
  if (elapsedTime > redThreshold) {
    timerClass = 'timer-red';
  } else if (elapsedTime > yellowThreshold) {
    timerClass = 'timer-yellow';
  }
  
  // Calculate width percentage based on actualMaxSeconds
  const widthPercentage = Math.min(elapsedTime / maxMs * 100, 100);
  
  return (
    <div className="timer-container">
      {isRunning && (
        <div 
          className={`timer-progress ${timerClass} ${noTransition ? 'timer-no-transition' : ''}`} 
          style={{ width: `${widthPercentage}%` }}
        />
      )}
    </div>
  );
}

if (typeof window !== 'undefined') {
  window.MidiStatus = MidiStatus;
  window.testEnharmonicSpellings = function() {
    return MusicTheory.testEnharmonicSpellings();
  };
}

export { TrainerLayout, MidiStatus, PianoKeyboard, Timer };
export default App;
