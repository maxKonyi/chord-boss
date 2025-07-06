/* Composer Piano Trainer – Milestone 3
   Added Chord Mode functionality with basic triads. */

const { useState, useEffect, useRef } = React;

// Note mapping constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MIDI_NOTE_NAMES = {};
for (let i = 0; i < 128; i++) {
  const octave = Math.floor(i / 12) - 1; // MIDI octaves start at -1
  const noteName = NOTES[i % 12];
  MIDI_NOTE_NAMES[i] = { name: noteName, octave };
}

function App() {
  const [page, setPage] = useState('home'); // 'home' | 'chord' | 'scale'
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiError, setMidiError] = useState(null);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [midiInputs, setMidiInputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState(null);
  
  // Request MIDI access when component mounts
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(access => {
          console.log('MIDI Access granted!');
          setMidiAccess(access);
          
          // Get list of inputs
          const inputs = [];
          access.inputs.forEach(input => {
            inputs.push(input);
          });
          setMidiInputs(inputs);
          
          // Set to "All inputs" by default (null means listen to all inputs)
          setSelectedInput(null);
        })
        .catch(err => {
          console.error('MIDI Access denied!', err);
          setMidiError('Could not access your MIDI devices: ' + err.message);
        });
    } else {
      setMidiError('Web MIDI API is not supported in your browser');
    }
  }, []);
  
  // Set up MIDI input listeners when selected input changes
  useEffect(() => {
    const handleMIDIMessage = (message) => {
      const command = message.data[0];
      const note = message.data[1];
      const velocity = message.data[2];
      
      // Note on with velocity > 0
      if ((command === 144) && (velocity > 0)) {
        setActiveNotes(prev => {
          const updated = new Set(prev);
          updated.add(note);
          return updated;
        });
      }
      // Note off or note on with velocity = 0
      else if ((command === 128) || ((command === 144) && (velocity === 0))) {
        setActiveNotes(prev => {
          const updated = new Set(prev);
          updated.delete(note);
          return updated;
        });
      }
    };
    
    // If selectedInput is null, listen to all inputs
    if (selectedInput === null && midiAccess) {
      // Set up listeners for all inputs
      const inputListeners = new Map();
      
      midiAccess.inputs.forEach(input => {
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
    else if (selectedInput) {
      selectedInput.onmidimessage = handleMIDIMessage;
      
      return () => {
        selectedInput.onmidimessage = null;
      };
    }
  }, [selectedInput, midiAccess]);
  
  // Handle input device selection
  const handleInputChange = (e) => {
    const selectedId = e.target.value;
    // If "all" is selected, set to null to listen to all inputs
    if (selectedId === "all") {
      setSelectedInput(null);
    } else {
      const input = midiInputs.find(input => input.id === selectedId);
      setSelectedInput(input);
    }
  };

  const renderContent = () => {
    switch (page) {
      case 'chord':
        return (
          <TrainerLayout 
            title="Chord Trainer" 
            onBack={() => setPage('home')}
            activeNotes={activeNotes}
            midiStatus={{ midiAccess, midiError, midiInputs, selectedInput, handleInputChange }}
          >
            <ChordTrainer activeNotes={activeNotes} />
          </TrainerLayout>
        );
      case 'scale':
        return (
          <TrainerLayout 
            title="Scale Trainer" 
            onBack={() => setPage('home')}
            activeNotes={activeNotes}
            midiStatus={{ midiAccess, midiError, midiInputs, selectedInput, handleInputChange }}
          >
            <p>Scale trainer coming soon!</p>
          </TrainerLayout>
        );
      default:
        return (
          <Home 
            onSelect={setPage} 
            midiStatus={{ midiAccess, midiError, midiInputs, selectedInput, handleInputChange }}
            activeNotes={activeNotes}
          />
        );
    }
  };

  return <div className="app-container">{renderContent()}</div>;
}

function Home({ onSelect, midiStatus, activeNotes }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Composer Piano Trainer</h1>
      <p style={{ margin: '1rem 0 2rem' }}>Choose a training mode:</p>
      <div>
        <button onClick={() => onSelect('chord')}>Chord Trainer</button>
        <button onClick={() => onSelect('scale')}>Scale Trainer</button>
      </div>
      
      <MidiStatus {...midiStatus} />
      
      {/* Show keyboard even on home screen */}
      <PianoKeyboard activeNotes={activeNotes} startOctave={3} endOctave={5} />
      
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#888' }}>
        <p>Connect a MIDI keyboard and play some notes to test your setup.</p>
      </div>
    </div>
  );
}

function TrainerLayout({ title, onBack, children, activeNotes, midiStatus }) {
  return (
    <div style={{ width: '100%', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
        <h2>{title}</h2>
        <button onClick={onBack}>Back</button>
      </div>
      
      <MidiStatus {...midiStatus} />
      
      <div style={{ margin: '1rem 0' }}>
        {children}
      </div>
      
      <PianoKeyboard activeNotes={activeNotes} startOctave={3} endOctave={5} />
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
          value={selectedInput ? selectedInput.id : 'all'} 
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

function PianoKeyboard({ activeNotes, startOctave = 3, endOctave = 5 }) {
  // Generate keys for the specified octave range
  const keys = [];
  for (let octave = startOctave; octave <= endOctave; octave++) {
    NOTES.forEach((note, index) => {
      const isSharp = note.includes('#');
      const midiNote = (octave + 1) * 12 + index; // MIDI octaves start at -1
      const isActive = activeNotes.has(midiNote);
      
      keys.push({
        note,
        octave,
        midiNote,
        isSharp,
        isActive
      });
    });
  }
  
  // Calculate the width percentage for each white key
  const whiteKeysCount = keys.filter(key => !key.isSharp).length;
  const whiteKeyWidth = 100 / whiteKeysCount;
  
  // Track white key index for positioning black keys
  let whiteKeyIndex = 0;
  
  return (
    <div className="keyboard-container">
      <div className="piano-keyboard">
        {/* Render white keys first (lower z-index) */}
        {keys.filter(key => !key.isSharp).map((key) => {
          whiteKeyIndex++;
          return (
            <div 
              key={`${key.note}${key.octave}`}
              className={`piano-key white ${key.isActive ? 'active' : ''}`}
              style={{ width: `${whiteKeyWidth}%` }}
            >
              <span className="key-label">{key.note}{key.octave}</span>
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
          let offset = 0.7;
          if (key.note === 'D#' || key.note === 'G#' || key.note === 'A#') {
            offset = 0.8;
          }
          
          return (
            <div 
              key={`${key.note}${key.octave}`}
              className={`piano-key black ${key.isActive ? 'active' : ''}`}
              style={{ left: `${(whiteKeysBefore - offset) * whiteKeyWidth}%` }}
            >
              <span className="key-label">{key.note}{key.octave}</span>
            </div>
          );
        })}
        
        {/* Octave indicators */}
        {Array.from({ length: endOctave - startOctave + 1 }, (_, i) => startOctave + i).map(octave => (
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
function Timer({ isRunning, elapsedTime, maxSeconds = 10 }) {
  // Calculate color based on elapsed time percentages
  const maxMs = maxSeconds * 1000;
  const yellowThreshold = maxMs * 0.3; // 30% of max time
  const redThreshold = maxMs * 0.5;    // 50% of max time
  
  let timerClass = 'timer-green';
  if (elapsedTime > redThreshold) {
    timerClass = 'timer-red';
  } else if (elapsedTime > yellowThreshold) {
    timerClass = 'timer-yellow';
  }
  
  // Calculate width percentage based on maxSeconds
  const widthPercentage = Math.min(elapsedTime / maxMs * 100, 100);
  
  return (
    <div className="timer-container">
      {isRunning && (
        <div 
          className={`timer-progress ${timerClass}`} 
          style={{ width: `${widthPercentage}%` }}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// Add a test function for enharmonic spellings
// You can run this in the browser console by typing: testEnharmonicSpellings()
window.testEnharmonicSpellings = function() {
  return MusicTheory.testEnharmonicSpellings();
};
