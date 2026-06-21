import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MidiUtils from './midi-utils.js';
import Presets from './presets.js';

const CHORD_GROUPS = [
  {
    id: 'triads',
    name: 'Triads',
    columns: 3,
    items: [
      { id: 'major', label: 'Major', title: 'Root, Major 3rd, Perfect 5th' },
      { id: 'minor', label: 'Minor', title: 'Root, Minor 3rd, Perfect 5th' },
      { id: 'diminished', label: 'Dim', title: 'Root, Minor 3rd, Diminished 5th' },
      { id: 'augmented', label: 'Aug', title: 'Root, Major 3rd, Augmented 5th' },
      { id: 'sus2', label: 'Sus2', title: 'Root, Major 2nd, Perfect 5th' },
      { id: 'sus4', label: 'Sus4', title: 'Root, Perfect 4th, Perfect 5th' }
    ]
  },
  {
    id: 'sixths',
    name: '6th Chords',
    columns: 2,
    items: [
      { id: '6', label: '6', title: 'Root, Major 3rd, Perfect 5th, Major 6th' },
      { id: 'm6', label: 'm6', title: 'Root, Minor 3rd, Perfect 5th, Major 6th' }
    ]
  },
  {
    id: 'sevenths',
    name: '7th Chords',
    columns: 3,
    items: [
      { id: 'major7', label: 'maj7', title: 'Root, Major 3rd, Perfect 5th, Major 7th' },
      { id: 'dominant7', label: '7', title: 'Root, Major 3rd, Perfect 5th, Minor 7th' },
      { id: 'minor7', label: 'm7', title: 'Root, Minor 3rd, Perfect 5th, Minor 7th' },
      { id: 'diminished7', label: 'dim7', title: 'Root, Minor 3rd, Diminished 5th, Diminished 7th' },
      { id: 'halfDiminished7', label: 'm7b5', title: 'Root, Minor 3rd, Diminished 5th, Minor 7th' },
      { id: 'minorMajor7', label: 'mM7', title: 'Root, Minor 3rd, Perfect 5th, Major 7th' }
    ]
  },
  {
    id: 'ninths',
    name: '9th Chords',
    columns: 3,
    items: [
      { id: 'dominant9', label: '9', title: 'Root, Major 3rd, Perfect 5th, Minor 7th, Major 9th' },
      { id: 'major9', label: 'maj9', title: 'Root, Major 3rd, Perfect 5th, Major 7th, Major 9th' },
      { id: 'minor9', label: 'm9', title: 'Root, Minor 3rd, Perfect 5th, Minor 7th, Major 9th' },
      { id: 'minorMajor9', label: 'mM9', title: 'Root, Minor 3rd, Perfect 5th, Major 7th, Major 9th' },
      { id: '6(9)', label: '6(9)', title: 'Major 6 add 9' },
      { id: 'm6(9)', label: 'm6(9)', title: 'Minor 6 add 9' }
    ]
  }
];

const PROGRESSION_GROUPS = Presets.PROGRESSION_COLLECTIONS.map(collection => ({
  id: collection.id,
  name: collection.name,
  columns: collection.progressions.length > 2 ? 2 : 1,
  items: collection.progressions.map(category => ({
    id: category.id,
    label: category.name,
    title: category.progressions.map(progression => progression.name).join(', ')
  }))
}));

const KEY_OPTIONS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

function getSelectionSummary(items, selectedIds) {
  const selectedCount = items.filter(item => selectedIds.includes(item.id)).length;

  if (selectedCount === 0) return 'None';
  if (selectedCount === items.length) return 'All';
  return `${selectedCount} selected`;
}

function toggleItem(selectedIds, itemId) {
  if (selectedIds.includes(itemId)) {
    return selectedIds.filter(id => id !== itemId);
  }

  return [...selectedIds, itemId];
}

function setGroupSelection(selectedIds, items, isSelected) {
  const itemIds = items.map(item => item.id);

  if (!isSelected) {
    return selectedIds.filter(id => !itemIds.includes(id));
  }

  const next = [...selectedIds];
  itemIds.forEach(id => {
    if (!next.includes(id)) next.push(id);
  });
  return next;
}

function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={event => event.stopPropagation()}>
        <button className="help-close-btn" onClick={onClose} aria-label="Close help">×</button>
        <h3>How to Use Chord Boss</h3>

        <div className="help-section">
          <h4>Getting Started</h4>
          <p>Welcome to Chord Boss, a tool to help you learn and practice piano chords.</p>
          <p>Connect your MIDI keyboard, pick a preset or customize the sidebar settings, then start a session.</p>
        </div>

        <div className="help-section">
          <h4>Session Settings</h4>
          <ul>
            <li><strong>Questions:</strong> Number of questions in your practice session.</li>
            <li><strong>Difficulty:</strong> Practice mode gives unlimited time.</li>
            <li><strong>Inversions:</strong> Choose root position, prompted inversions, or free inversions.</li>
            <li><strong>Delay:</strong> Time between questions.</li>
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
          <ol>
            <li>Read the chord name and inversion indicator.</li>
            <li>Play the chord on your MIDI keyboard.</li>
            <li>Correct answers advance the session; incorrect answers can be retried until time runs out.</li>
          </ol>
        </div>

        <div className="help-section">
          <h4>Tips</h4>
          <ul>
            <li>Start with the Basic Triads preset if you're new to piano chords.</li>
            <li>Use Practice mode to learn new chord types without pressure.</li>
            <li>Gradually increase difficulty as you improve.</li>
            <li>Toggle between light and dark keyboard modes using the button above the keyboard.</li>
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CollapsibleSelectionGroup({
  group,
  isOpen,
  onToggleOpen,
  selectedIds,
  onToggleItem,
  onSetGroupSelection
}) {
  const summary = getSelectionSummary(group.items, selectedIds);
  const allSelected = group.items.every(item => selectedIds.includes(item.id));

  return (
    <section className={`selection-group ${isOpen ? 'is-open' : ''}`}>
      <button
        type="button"
        className="selection-group-header"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
      >
        <span className="selection-group-title">{group.name}</span>
        <span className="selection-group-meta">{summary}</span>
        <span className="selection-group-chevron">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="selection-group-content">
          <label className="select-all-switch">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={event => onSetGroupSelection(event.target.checked)}
            />
            <span className="select-all-label">All</span>
          </label>
          <div
            className="chip-grid"
            style={{ '--chip-columns': group.columns }}
          >
            {group.items.map(item => (
              <button
                key={item.id}
                type="button"
                className={`chip-toggle ${selectedIds.includes(item.id) ? 'active' : ''}`}
                onClick={() => onToggleItem(item.id)}
                title={item.title}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Sidebar({ settings, setSettings, midiStatus, handleSelectPreset }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [openChordGroups, setOpenChordGroups] = useState({
    triads: true,
    sixths: false,
    sevenths: false,
    ninths: false
  });
  const [openProgressionGroups, setOpenProgressionGroups] = useState({
    simple: true,
    intermediate: false,
    complex: false
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateSettings = updates => setSettings({ ...settings, ...updates });
  const selectedChordTypes = settings.chordTypes || [];
  const selectedProgressions = settings.selectedProgressions || [];
  const midiDeviceLabel = midiStatus
    ? `${midiStatus.midiInputs.length} ${midiStatus.midiInputs.length === 1 ? 'device' : 'devices'}`
    : '0 devices';
  const midiLastNoteLabel = midiStatus && midiStatus.lastNoteName
    ? `${midiStatus.lastNoteName} ${midiStatus.lastMessageType === 'noteon' ? 'on' : 'off'}`
    : 'None yet';

  const setDifficulty = difficulty => {
    const nextSettings = { ...settings, difficulty };
    setSettings(nextSettings);
    localStorage.setItem('chordTrainerSettings', JSON.stringify(nextSettings));
  };

  const setInversionMode = inversionMode => {
    const nextSettings = {
      ...settings,
      inversionMode,
      allowInversions: inversionMode === 'inversions'
        ? true
        : inversionMode === 'free'
          ? false
          : settings.allowInversions
    };
    setSettings(nextSettings);
    localStorage.setItem('chordTrainerSettings', JSON.stringify(nextSettings));
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Settings</h3>
        <button
          type="button"
          className="button button-secondary help-button"
          onClick={() => setIsHelpOpen(true)}
          title="View help and tutorial"
        >
          Help
        </button>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {midiStatus && (
        <section className="settings-group midi-settings">
          <label className="field-row">
            <span>MIDI Input</span>
            <select
              className="form-select"
              value={midiStatus.selectedInput || MidiUtils.ALL_INPUTS_VALUE}
              onChange={midiStatus.handleInputChange}
            >
              <option value="all">All inputs</option>
              {midiStatus.midiInputs.map(input => (
                <option key={input.id} value={input.id}>
                  {input.name || input.manufacturer || 'Unknown Device'}
                </option>
              ))}
            </select>
          </label>
          <div className="midi-diagnostics" aria-live="polite">
            <div className="midi-diagnostic-row">
              <span>Status</span>
              <strong>{midiStatus.midiError ? 'Error' : midiStatus.accessState}</strong>
            </div>
            <div className="midi-diagnostic-row">
              <span>Devices</span>
              <strong>{midiDeviceLabel}</strong>
            </div>
            <div className="midi-diagnostic-row">
              <span>Listening</span>
              <strong>{midiStatus.selectedInputName}</strong>
            </div>
            <div className="midi-diagnostic-row">
              <span>Active Notes</span>
              <strong>{midiStatus.activeNoteCount}</strong>
            </div>
            <div className="midi-diagnostic-row">
              <span>Last Note</span>
              <strong>{midiLastNoteLabel}</strong>
            </div>
            {midiStatus.midiError && (
              <p className="midi-diagnostic-error">{midiStatus.midiError}</p>
            )}
          </div>
        </section>
      )}

      <section className="settings-group preset-settings">
        <PresetSelector onSelectPreset={handleSelectPreset} />
      </section>

      <section className="settings-group session-settings">
        <h4>Session</h4>
        <div className="session-control-grid">
          <label className="field-stack">
            <span>Questions</span>
            <select
              className="form-select"
              value={settings.questionCount}
              onChange={event => updateSettings({ questionCount: parseInt(event.target.value, 10) })}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
          </label>

          <label className="field-stack">
            <span>Difficulty</span>
            <select
              className="form-select"
              value={settings.difficulty}
              onChange={event => setDifficulty(event.target.value)}
            >
              <option value="practice">Practice (∞)</option>
              <option value="easy">Easy (12s)</option>
              <option value="medium">Medium (6s)</option>
              <option value="hard">Hard (3s)</option>
            </select>
          </label>

          <label className="field-stack">
            <span>Inversions</span>
            <select
              className="form-select"
              value={settings.inversionMode}
              onChange={event => setInversionMode(event.target.value)}
            >
              <option value="root">No</option>
              <option value="inversions">Yes</option>
              <option value="free">Free</option>
            </select>
          </label>
        </div>

        <label className="delay-control">
          <span>Delay</span>
          <strong>{(settings.questionDelay / 1000).toFixed(1)}s</strong>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={settings.questionDelay}
            onChange={event => updateSettings({ questionDelay: parseInt(event.target.value, 10) })}
          />
        </label>
      </section>

      <section className="settings-group selection-panel">
        <div className="sidebar-tabs" role="tablist" aria-label="Training mode">
          <button
            type="button"
            className={`sidebar-tab ${!settings.useProgressions ? 'active' : ''}`}
            onClick={() => updateSettings({ useProgressions: false })}
          >
            Qualities
          </button>
          <button
            type="button"
            className={`sidebar-tab ${settings.useProgressions ? 'active' : ''}`}
            onClick={() => updateSettings({ useProgressions: true })}
          >
            Progressions
          </button>
        </div>

        {settings.useProgressions && (
          <div className="key-selector">
            <label className="field-row">
              <span>Key Mode</span>
              <select
                className="form-select"
                value={settings.keyMode}
                onChange={event => {
                  const keyMode = event.target.value;
                  updateSettings({
                    keyMode,
                    fixedKey: keyMode === 'fixed' && !settings.fixedKey ? 'C' : settings.fixedKey
                  });
                }}
              >
                <option value="random">Random Key</option>
                <option value="fixed">Fixed Key</option>
              </select>
            </label>

            {settings.keyMode === 'fixed' && (
              <label className="field-row">
                <span>Fixed Key</span>
                <select
                  className="form-select"
                  value={settings.fixedKey || 'C'}
                  onChange={event => updateSettings({ fixedKey: event.target.value })}
                >
                  {KEY_OPTIONS.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}

        {!settings.useProgressions ? (
          <div className="selection-section">
            <div className="selection-section-header">
              <h4>Chord Types</h4>
              {selectedChordTypes.length > 0 && (
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={() => updateSettings({ chordTypes: [] })}
                  title="Clear all selected chord types"
                >
                  Clear All
                </button>
              )}
            </div>

            {CHORD_GROUPS.map(group => (
              <CollapsibleSelectionGroup
                key={group.id}
                group={group}
                isOpen={openChordGroups[group.id]}
                selectedIds={selectedChordTypes}
                onToggleOpen={() => setOpenChordGroups({
                  ...openChordGroups,
                  [group.id]: !openChordGroups[group.id]
                })}
                onToggleItem={itemId => updateSettings({
                  chordTypes: toggleItem(selectedChordTypes, itemId)
                })}
                onSetGroupSelection={isSelected => updateSettings({
                  chordTypes: setGroupSelection(selectedChordTypes, group.items, isSelected)
                })}
              />
            ))}
          </div>
        ) : (
          <div className="selection-section progression-selection">
            <div className="selection-section-header">
              <h4>Progression Types</h4>
              {selectedProgressions.length > 0 && (
                <button
                  type="button"
                  className="clear-all-btn"
                  onClick={() => updateSettings({ selectedProgressions: [] })}
                  title="Clear all selected progression types"
                >
                  Clear All
                </button>
              )}
            </div>

            {PROGRESSION_GROUPS.map(group => (
              <CollapsibleSelectionGroup
                key={group.id}
                group={group}
                isOpen={openProgressionGroups[group.id]}
                selectedIds={selectedProgressions}
                onToggleOpen={() => setOpenProgressionGroups({
                  ...openProgressionGroups,
                  [group.id]: !openProgressionGroups[group.id]
                })}
                onToggleItem={itemId => updateSettings({
                  selectedProgressions: toggleItem(selectedProgressions, itemId)
                })}
                onSetGroupSelection={isSelected => updateSettings({
                  selectedProgressions: setGroupSelection(selectedProgressions, group.items, isSelected)
                })}
              />
            ))}
          </div>
        )}
      </section>

      <section className="settings-group advanced-settings">
        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          aria-expanded={isAdvancedOpen}
        >
          <span>Advanced</span>
          <span>{isAdvancedOpen ? '▼' : '▶'}</span>
        </button>

        {isAdvancedOpen && (
          <div className="advanced-content">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.optionalFifth}
                onChange={event => updateSettings({ optionalFifth: event.target.checked })}
              />
              <span>Make 5th Optional for 7th+ chords</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.muteAudio || false}
                onChange={event => updateSettings({ muteAudio: event.target.checked })}
              />
              <span>Mute audio</span>
            </label>
          </div>
        )}
      </section>
    </aside>
  );
}

function PresetSelector({ onSelectPreset }) {
  const [expandedCollection, setExpandedCollection] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const popoutRef = useRef(null);
  const buttonRef = useRef(null);
  const [popoutPosition, setPopoutPosition] = useState({ top: 0, left: 0 });

  const toggleCollection = collectionId => {
    setExpandedCollection(expandedCollection === collectionId ? null : collectionId);
  };

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoutPosition({
        top: rect.top,
        left: rect.right + 5
      });
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popoutRef.current &&
        !popoutRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
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
    <div className="preset-selector">
      <button
        ref={buttonRef}
        type="button"
        className="preset-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Preset Progressions</span>
        <span>{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div
          ref={popoutRef}
          className="preset-popout"
          style={{
            top: `${popoutPosition.top}px`,
            left: `${popoutPosition.left}px`
          }}
        >
          <h4>Preset Progressions</h4>

          {Presets.COLLECTIONS.map(collection => (
            <div key={collection.id} className="preset-collection">
              <button
                type="button"
                className="preset-collection-header"
                onClick={() => toggleCollection(collection.id)}
              >
                <span>{collection.name}</span>
                <span className="expand-icon">
                  {expandedCollection === collection.id ? '▼' : '▶'}
                </span>
              </button>

              {expandedCollection === collection.id && (
                <div className="preset-list">
                  {collection.presets.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      className="preset-item"
                      onClick={() => {
                        onSelectPreset(preset.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-description">{preset.description}</span>
                    </button>
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

if (typeof window !== 'undefined') {
  window.Sidebar = Sidebar;
}

export default Sidebar;
