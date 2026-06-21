const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');

let MidiUtils;
let GameLogic;
let MusicTheory;
let Presets;
let TrainerSettings;

async function importSrcModule(relativePath) {
  const fullPath = path.join(root, relativePath);
  return import(pathToFileURL(fullPath).href);
}

const modulesReady = (async () => {
  global.window = global;

  MidiUtils = (await importSrcModule('src/midi-utils.js')).default;
  GameLogic = (await importSrcModule('src/game-logic.js')).default;
  const gameStateModule = await importSrcModule('src/hooks/useGameState.js');
  MusicTheory = (await importSrcModule('src/music-theory.js')).default;
  Presets = (await importSrcModule('src/presets.js')).default;
  TrainerSettings = (await importSrcModule('src/trainer-settings.js')).default;

  window.hooks = window.hooks || {};
  window.hooks.__gameStateTest = {
    GAME_STATES: gameStateModule.GAME_STATES,
    ACTIONS: gameStateModule.ACTIONS,
    initialState: gameStateModule.initialState,
    gameStateReducer: gameStateModule.gameStateReducer
  };
})();

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test('normalizes All MIDI inputs sentinel to null', () => {
  assert.strictEqual(MidiUtils.normalizeInputSelection('all'), null);
  assert.strictEqual(MidiUtils.normalizeInputSelection(''), null);
  assert.strictEqual(MidiUtils.normalizeInputSelection('keyboard-1'), 'keyboard-1');
});

test('parses MIDI note messages across all channels', () => {
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x90, 60, 100]), { type: 'noteon', note: 60, velocity: 100 });
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x91, 61, 64]), { type: 'noteon', note: 61, velocity: 64 });
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x9f, 62, 1]), { type: 'noteon', note: 62, velocity: 1 });
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x80, 60, 0]), { type: 'noteoff', note: 60, velocity: 0 });
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x8e, 61, 20]), { type: 'noteoff', note: 61, velocity: 20 });
  assert.deepStrictEqual(MidiUtils.parseNoteMessage([0x90, 62, 0]), { type: 'noteoff', note: 62, velocity: 0 });
  assert.strictEqual(MidiUtils.parseNoteMessage([0xb0, 1, 64]), null);
});

test('MIDI helpers format notes and expand keyboard octave range', () => {
  assert.strictEqual(MidiUtils.getMidiNoteName(60), 'C4');
  assert.strictEqual(MidiUtils.getMidiNoteName(61), 'C#4');
  assert.strictEqual(MidiUtils.getMidiNoteName(21), 'A0');
  assert.strictEqual(MidiUtils.getMidiNoteName(null), '');

  assert.deepStrictEqual(MidiUtils.getKeyboardOctaveRange(new Set(), new Set(), 3, 5), {
    startOctave: 3,
    endOctave: 5
  });
  assert.deepStrictEqual(MidiUtils.getKeyboardOctaveRange(new Set([36]), new Set(), 3, 5), {
    startOctave: 2,
    endOctave: 5
  });
  assert.deepStrictEqual(MidiUtils.getKeyboardOctaveRange(new Set([96]), new Set([24]), 3, 5), {
    startOctave: 1,
    endOctave: 7
  });
});

test('app MIDI wiring refreshes devices and listener setup when inputs change', () => {
  const source = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');

  assert.ok(source.includes('refreshMidiInputs'), 'expected shared MIDI input refresh helper in App');
  assert.ok(source.includes('access.onstatechange'), 'expected Web MIDI statechange handling');
  assert.ok(source.includes('const refreshedInputs = refreshMidiInputs(access)'), 'expected state changes to capture a refreshed input snapshot');
  assert.ok(source.includes('setMidiInputs(refreshedInputs)'), 'expected device snapshot refresh on state changes');
  assert.ok(source.includes('input.onmidimessage = handleMIDIMessage'), 'expected MIDI message listener attachment');
  assert.ok(source.includes('[selectedInput, midiAccess, midiInputs]'), 'expected listener setup to rerun when inputs refresh');
  assert.ok(source.includes('lastMidiMessage'), 'expected last MIDI message diagnostics state');
  assert.ok(source.includes('activeNoteCount'), 'expected active note count to be passed through diagnostics');
});

test('sidebar displays MIDI diagnostics for troubleshooting hardware input', () => {
  const source = fs.readFileSync(path.join(root, 'src/Sidebar.jsx'), 'utf8');
  const sidebarCss = fs.readFileSync(path.join(root, 'src/styles/sidebar.css'), 'utf8');

  assert.ok(source.includes('midi-diagnostics'), 'expected MIDI diagnostics block');
  assert.ok(source.includes('midiStatus.accessState'), 'expected access state diagnostic');
  assert.ok(source.includes('midiStatus.activeNoteCount'), 'expected active note count diagnostic');
  assert.ok(source.includes('midiStatus.lastNoteName'), 'expected last note diagnostic');
  assert.ok(source.includes('midiStatus.lastMessageType'), 'expected last message type diagnostic');
  assert.ok(sidebarCss.includes('.midi-diagnostics'), 'expected diagnostics styling');
});

test('trainer settings defaults and saved settings keep expected shape', () => {
  const defaults = TrainerSettings.getDefaultSettings();
  assert.deepStrictEqual(defaults.chordTypes, ['major', 'minor']);
  assert.deepStrictEqual(defaults.rootNotes, []);
  assert.strictEqual(defaults.difficulty, 'medium');
  assert.strictEqual(defaults.useProgressions, false);
  assert.deepStrictEqual(defaults.selectedProgressions, []);

  defaults.chordTypes.push('dominant7');
  assert.deepStrictEqual(TrainerSettings.getDefaultSettings().chordTypes, ['major', 'minor']);

  const normalized = TrainerSettings.normalizeSettings({
    chordTypes: [],
    rootNotes: null,
    selectedProgressions: null
  });
  assert.deepStrictEqual(normalized.chordTypes, []);
  assert.deepStrictEqual(normalized.rootNotes, []);
  assert.deepStrictEqual(normalized.selectedProgressions, []);
});

test('empty chord selection is preserved until single chord generation fallback', () => {
  const settings = TrainerSettings.mergeSettings(TrainerSettings.getDefaultSettings(), {
    chordTypes: []
  });

  assert.deepStrictEqual(settings.chordTypes, []);

  const prepared = GameLogic.prepareSingleChordSettings(settings);
  assert.deepStrictEqual(prepared.chordTypes, ['major', 'minor']);
});

test('trainer settings loads saved JSON and falls back safely', () => {
  assert.strictEqual(TrainerSettings.loadSettings('not json').difficulty, 'medium');
  assert.deepStrictEqual(TrainerSettings.loadSettings('{"difficulty":"hard","rootNotes":null}').rootNotes, []);
  assert.strictEqual(TrainerSettings.loadSettings('{"difficulty":"hard"}').difficulty, 'hard');
});

test('preset application normalizes root note shape and active preset id', () => {
  const current = TrainerSettings.getDefaultSettings();
  const next = TrainerSettings.applyPresetSettings('major-minor-triads-root', current, Presets);

  assert.strictEqual(next.activePresetId, 'major-minor-triads-root');
  assert.deepStrictEqual(next.rootNotes, []);
  assert.strictEqual(next.inversionMode, 'root');
});

test('trainer settings persistent updater merges and saves sidebar changes', () => {
  let state = TrainerSettings.getDefaultSettings();
  const storage = {
    saved: null,
    setItem(key, value) {
      assert.strictEqual(key, 'chordTrainerSettings');
      this.saved = value;
    }
  };
  const setSettings = (updater) => {
    state = updater(state);
    return state;
  };

  const updateSettings = TrainerSettings.createPersistentUpdater(setSettings, storage);
  updateSettings({ difficulty: 'hard', chordTypes: ['major7'] });

  assert.strictEqual(state.difficulty, 'hard');
  assert.deepStrictEqual(state.chordTypes, ['major7']);
  assert.deepStrictEqual(JSON.parse(storage.saved).chordTypes, ['major7']);
  assert.strictEqual(JSON.parse(storage.saved).difficulty, 'hard');
});

test('game reducer applies response-time points before streak multiplier', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const state = { ...initialState, score: 100, streak: 4 };
  const next = gameStateReducer(state, {
    type: ACTIONS.CORRECT_ANSWER,
    payload: { points: 8 }
  });

  assert.strictEqual(next.streak, 5);
  assert.strictEqual(next.multiplier, 2);
  assert.strictEqual(next.score, 116);
});

test('game reducer tracks highest streak across answer transitions', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const first = gameStateReducer(initialState, {
    type: ACTIONS.CORRECT_ANSWER,
    payload: { points: 10 }
  });
  const second = gameStateReducer({ ...first, streak: 4, highestStreak: 4 }, {
    type: ACTIONS.CORRECT_ANSWER,
    payload: { points: 10 }
  });
  const wrong = gameStateReducer(second, { type: ACTIONS.WRONG_ANSWER });

  assert.strictEqual(first.highestStreak, 1);
  assert.strictEqual(second.streak, 5);
  assert.strictEqual(second.highestStreak, 5);
  assert.strictEqual(wrong.streak, 0);
  assert.strictEqual(wrong.highestStreak, 5);
});

test('game reducer owns transient feedback metadata', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const withFeedback = gameStateReducer(initialState, {
    type: ACTIONS.SET_FEEDBACK,
    payload: { feedbackType: 'info', feedbackMessage: 'Next question...' }
  });
  const cleared = gameStateReducer(withFeedback, { type: ACTIONS.CLEAR_FEEDBACK });

  assert.strictEqual(withFeedback.showFeedback, true);
  assert.strictEqual(withFeedback.feedbackType, 'info');
  assert.strictEqual(withFeedback.feedbackMessage, 'Next question...');
  assert.strictEqual(cleared.showFeedback, false);
  assert.strictEqual(cleared.feedbackType, null);
  assert.strictEqual(cleared.feedbackMessage, '');
});

test('game reducer accepts explicit correct-answer feedback text', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const next = gameStateReducer(initialState, {
    type: ACTIONS.CORRECT_ANSWER,
    payload: { points: 7, feedbackMessage: 'Correct! +7 points' }
  });

  assert.strictEqual(next.feedbackType, 'correct');
  assert.strictEqual(next.feedbackMessage, 'Correct! +7 points');
});

test('game reducer transitions wrong answer to game over at zero lives', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const state = { ...initialState, state: 'playing', lives: 1, streak: 3, multiplier: 2 };
  const next = gameStateReducer(state, { type: ACTIONS.WRONG_ANSWER });

  assert.strictEqual(next.lives, 0);
  assert.strictEqual(next.state, 'summary');
  assert.strictEqual(next.showSummary, true);
  assert.strictEqual(next.feedbackType, 'gameover');
  assert.strictEqual(next.streak, 0);
  assert.strictEqual(next.multiplier, 1);
});

test('game reducer transitions timeout to game over at zero lives', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const state = { ...initialState, state: 'playing', lives: 1, streak: 2, multiplier: 2 };
  const next = gameStateReducer(state, { type: ACTIONS.TIMEOUT });

  assert.strictEqual(next.lives, 0);
  assert.strictEqual(next.state, 'summary');
  assert.strictEqual(next.showSummary, true);
  assert.strictEqual(next.feedbackType, 'gameover');
  assert.strictEqual(next.totalAttempts, 1);
});

test('practice mode disables timeout and scoring pressure', () => {
  assert.strictEqual(GameLogic.getDifficultyTime('practice'), Infinity);
  assert.strictEqual(GameLogic.isPracticeMode('practice'), true);
  assert.strictEqual(GameLogic.calculateScore(100000, 'practice'), 0);
});

test('wrong-answer attempts are counted once per distinct full-chord signature', () => {
  const first = GameLogic.getWrongAttemptUpdate([67, 60, 64], null);
  const duplicate = GameLogic.getWrongAttemptUpdate([64, 67, 60], first.signature);
  const distinct = GameLogic.getWrongAttemptUpdate([60, 63, 67], first.signature);

  assert.deepStrictEqual(first, { signature: '60-64-67', shouldPenalize: true });
  assert.strictEqual(duplicate.shouldPenalize, false);
  assert.strictEqual(distinct.shouldPenalize, true);
  assert.strictEqual(GameLogic.getRequiredNoteCount({ midiNotes: [60, 64, 67, 70], optionalFifth: true }), 3);
  assert.strictEqual(GameLogic.getRequiredNoteCount({ midiNotes: [60, 64, 67, 69], optionalFifth: true, type: '6' }), 4);
});

test('progression chord advancement prepares chord without hiding reducer action identity', () => {
  const progression = {
    name: 'Test Progression',
    chords: [
      { id: 'first', midiNotes: [60, 64, 67] },
      { id: 'second', midiNotes: [62, 65, 69] }
    ]
  };

  const result = GameLogic.prepareProgressionChord(progression, 1, {
    inversionMode: 'free',
    optionalFifth: true
  });

  assert.strictEqual(result.chord.id, 'second');
  assert.strictEqual(result.chord.inversionMode, 'free');
  assert.strictEqual(result.chord.optionalFifth, true);
  assert.strictEqual(result.chord.progressionIndex, 1);
  assert.strictEqual(result.chord.progressionLength, 2);
  assert.strictEqual(result.chord.progressionName, 'Test Progression');
  assert.strictEqual(result.actionChordId, 'second');
});

test('progression completion records the completed display index', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const next = gameStateReducer(initialState, {
    type: ACTIONS.NEXT_CHORD,
    payload: { chordId: 0 }
  });

  assert.deepStrictEqual(next.completedChords, [0]);
});

test('progression chord advancement preserves current feedback metadata', () => {
  const { ACTIONS, gameStateReducer, initialState } = window.hooks.__gameStateTest;
  const state = {
    ...initialState,
    showFeedback: true,
    feedbackType: 'correct',
    feedbackMessage: 'Correct! +10 points'
  };
  const next = gameStateReducer(state, {
    type: ACTIONS.NEXT_CHORD,
    payload: { chordId: 1 }
  });

  assert.strictEqual(next.feedbackType, 'correct');
  assert.strictEqual(next.feedbackMessage, 'Correct! +10 points');
  assert.strictEqual(next.showFeedback, true);
});

test('progression helper chooses selected progression and fixed key', () => {
  let randomCalls = 0;
  const progression = GameLogic.createProgressionQuestion({
    selectedProgressions: ['triads-major-key', 'triads-minor-key'],
    keyMode: 'fixed',
    fixedKey: 'D'
  }, Presets, MusicTheory, () => {
    randomCalls += 1;
    return 0.75;
  });

  assert.strictEqual(progression.id, 'triads-minor-key');
  assert.strictEqual(progression.key, 'D');
  assert.ok(progression.chords.length > 0);
  assert.strictEqual(randomCalls, 1);
});

test('chord trainer applies generated progression key to display state', () => {
  const source = fs.readFileSync(path.join(root, 'src/ChordTrainer.jsx'), 'utf8');
  assert.ok(source.includes('setProgressionKey(prog.key)'), 'expected generated progression key to update display state');
  assert.ok(source.includes('nextChord(progressionIndex)'), 'expected progression display completion to use current index');
});

test('trainer presentational sections are decomposed into focused components', () => {
  const trainerSource = fs.readFileSync(path.join(root, 'src/ChordTrainer.jsx'), 'utf8');
  const componentDir = path.join(root, 'src', 'components', 'trainer');
  const expectedComponents = [
    'GameSummary',
    'LivesDisplay',
    'ProgressionDisplay',
    'QuestionDisplay',
    'SessionControls',
    'TimerBar'
  ];

  assert.ok(fs.existsSync(componentDir), 'expected trainer component directory');
  for (const componentName of expectedComponents) {
    const componentPath = path.join(componentDir, `${componentName}.jsx`);
    assert.ok(fs.existsSync(componentPath), `expected ${componentName}.jsx`);
    assert.ok(
      trainerSource.includes(`./components/trainer/${componentName}.jsx`),
      `expected ChordTrainer to import ${componentName}`
    );
  }
  assert.ok(!trainerSource.includes('function LivesDisplay'), 'LivesDisplay should not remain inline');
  assert.ok(!trainerSource.includes('function GameSummary'), 'GameSummary should not remain inline');
});

test('trainer extracted displays preserve key markup and class contracts', () => {
  const componentDir = path.join(root, 'src', 'components', 'trainer');
  const livesSource = fs.readFileSync(path.join(componentDir, 'LivesDisplay.jsx'), 'utf8');
  const questionSource = fs.readFileSync(path.join(componentDir, 'QuestionDisplay.jsx'), 'utf8');
  const progressionSource = fs.readFileSync(path.join(componentDir, 'ProgressionDisplay.jsx'), 'utf8');

  assert.ok(livesSource.includes('Array(3)'), 'expected exactly three life slots');
  assert.ok(livesSource.includes('lives-display'), 'expected lives wrapper class');
  assert.ok(livesSource.includes('life-icon'), 'expected life icon class');
  assert.ok(livesSource.includes('life-active'), 'expected active life class');
  assert.ok(livesSource.includes('life-lost'), 'expected lost life class');
  assert.ok(livesSource.includes('i < lives'), 'expected life classes to depend on remaining lives');

  assert.ok(questionSource.includes('question-display'), 'expected question display class');
  assert.ok(questionSource.includes('currentChord.displayName'), 'expected chord display name');
  assert.ok(questionSource.includes("'---'"), 'expected idle question placeholder');

  assert.ok(progressionSource.includes('progression-display'), 'expected progression wrapper class');
  assert.ok(progressionSource.includes('progression-name'), 'expected progression name class');
  assert.ok(progressionSource.includes('progression-chords'), 'expected progression chord list class');
  assert.ok(progressionSource.includes('progression-chord'), 'expected progression chord class');
  assert.ok(progressionSource.includes('progression-indicator'), 'expected progression indicator class');
  assert.ok(progressionSource.includes('index === progressionIndex'), 'expected current chord index class convention');
  assert.ok(progressionSource.includes('completedChords.includes(index)'), 'expected completed display index convention');
  assert.ok(progressionSource.includes('currentProgression.chords.map'), 'expected all progression chords to render');
  assert.ok(progressionSource.includes('{chord.displayName}'), 'expected progression chord display names');
});

test('trainer extracted controls preserve callbacks and practice-only skip behavior', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'components', 'trainer', 'SessionControls.jsx'), 'utf8');

  assert.ok(source.includes('GameLogic.isPracticeMode(difficulty)'), 'expected skip to be gated by practice mode');
  assert.ok(source.includes('onClick={onStart}'), 'expected start callback binding');
  assert.ok(source.includes('onClick={onSkip}'), 'expected skip callback binding');
  assert.ok(source.includes('onClick={onEnd}'), 'expected end callback binding');
  assert.ok(source.includes('Start Training'), 'expected start button text');
  assert.ok(source.includes('Skip'), 'expected skip button text');
  assert.ok(source.includes('End Game'), 'expected end button text');
  assert.ok(source.includes('skip-button'), 'expected skip button class');
  assert.ok(source.includes('end-button'), 'expected end button class');
  assert.ok(source.includes('!isRunning'), 'expected start/end control split by running state');
});

test('sidebar refresh keeps collapsible summaries, advanced settings, and preset popout contracts', () => {
  const source = fs.readFileSync(path.join(root, 'src/Sidebar.jsx'), 'utf8');
  const sidebarCss = fs.readFileSync(path.join(root, 'src/styles/sidebar.css'), 'utf8');
  const trainerCss = fs.readFileSync(path.join(root, 'src/styles/trainer.css'), 'utf8');

  assert.ok(source.includes('getSelectionSummary'), 'expected selection summary helper');
  assert.ok(source.includes('openChordGroups'), 'expected chord groups to use collapsible state');
  assert.ok(source.includes('openProgressionGroups'), 'expected progression groups to use collapsible state');
  assert.ok(source.includes('Advanced'), 'expected advanced section label');
  assert.ok(source.indexOf('Make 5th Optional for 7th+ chords') > source.indexOf('Advanced'), 'expected optional fifth in Advanced section');
  assert.ok(source.indexOf('Mute audio') > source.indexOf('Advanced'), 'expected mute audio in Advanced section');
  assert.ok(source.includes('popoutPosition'), 'expected preset selector popout positioning to remain');
  assert.ok(source.includes('document.addEventListener'), 'expected outside-click close behavior to remain');
  assert.ok(source.includes('onSelectPreset(preset.id)'), 'expected preset selection callback to remain');
  assert.ok(sidebarCss.includes('width: 450px'), 'expected desktop sidebar width to remain 450px');
  assert.ok(trainerCss.includes('.chord-trainer-score'), 'expected trainer score to be styled in trainer css');
  assert.ok(trainerCss.includes('var(--color-pumpkin)'), 'expected trainer score styling to use refreshed theme tokens');
  assert.ok(source.includes('Use the <strong>Clear All</strong> button'), 'expected help to explain Clear All');
  assert.ok(source.includes('Toggle between light and dark keyboard modes'), 'expected help to preserve keyboard mode guidance');
});

test('dark blue hardware style pass keeps palette and tactile control contracts', () => {
  const globalCss = fs.readFileSync(path.join(root, 'src/styles/style.css'), 'utf8');
  const sidebarCss = fs.readFileSync(path.join(root, 'src/styles/sidebar.css'), 'utf8');
  const trainerCss = fs.readFileSync(path.join(root, 'src/styles/trainer.css'), 'utf8');

  assert.ok(globalCss.includes('--color-bg: #080d14'), 'expected main background to lean dark blue-charcoal');
  assert.ok(globalCss.includes('--color-sidebar: #0d1520'), 'expected sidebar surface to lean dark blue');
  assert.ok(globalCss.includes('--shadow-control:'), 'expected shared raised control shadow token');
  assert.ok(globalCss.includes('--shadow-control-inset:'), 'expected shared inset control shadow token');
  assert.ok(globalCss.includes('--color-pumpkin: #e57f32'), 'expected warm orange to remain dominant accent');
  assert.ok(globalCss.includes('--color-teal: #38b8aa'), 'expected restrained teal secondary accent');

  assert.ok(sidebarCss.includes('box-shadow: var(--shadow-control-inset)'), 'expected sidebar controls to use inset tactile treatment');
  assert.ok(sidebarCss.includes('box-shadow: var(--shadow-control)'), 'expected sidebar controls to use raised tactile treatment');
  assert.ok(sidebarCss.includes('.delay-control input[type="range"]::-webkit-slider-thumb'), 'expected delay range thumb styling');
  assert.ok(sidebarCss.includes('.delay-control input[type="range"]::-moz-range-thumb'), 'expected delay range thumb styling for Firefox');

  assert.ok(trainerCss.includes('box-shadow: var(--shadow-panel), var(--shadow-control-inset)'), 'expected trainer panels to align with hardware style');
  assert.ok(trainerCss.includes('.score-item'), 'expected score items to remain styled');
});

test('trainer extracted summary preserves practice gates and summary classes', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'components', 'trainer', 'GameSummary.jsx'), 'utf8');

  assert.ok(source.includes('GameLogic.isPracticeMode'), 'expected practice mode detection');
  assert.ok(source.includes('game-summary'), 'expected summary wrapper class');
  assert.ok(source.includes('failed-chord-display'), 'expected failed chord display class');
  assert.ok(source.includes('failed-chord-value'), 'expected failed chord value class');
  assert.ok(source.includes('failed-chord-label'), 'expected failed chord label class');
  assert.ok(source.includes('summary-row'), 'expected summary row class');
  assert.ok(source.includes('summary-item'), 'expected summary item class');
  assert.ok(source.includes('summary-value'), 'expected summary value class');
  assert.ok(source.includes('summary-label'), 'expected summary label class');
  assert.ok(source.includes('summary-divider'), 'expected summary divider class');
  assert.ok(source.includes('gem-row'), 'expected gem row class');
  assert.ok(source.includes('gem-container'), 'expected gem container class');
  assert.ok(source.includes("className={`gem ${i < gemCount ? 'filled' : ''}`}"), 'expected filled gem class behavior');
  assert.ok(source.includes('restart-button'), 'expected restart button class');
  assert.ok(source.includes('onClick={onRestart}'), 'expected restart callback binding');
  assert.ok(source.includes('!isPractice && failedChordName'), 'expected failed chord hidden in practice mode');
  assert.ok(source.includes('!isPractice && ('), 'expected non-practice-only score/streak/gem sections');
  assert.ok(source.includes('isPractice ? questionCount : settings.questionCount'), 'expected practice summary question count behavior');
  assert.ok(source.includes('Final Score'), 'expected final score label');
  assert.ok(source.includes('Highest Streak'), 'expected highest streak label');
  assert.ok(source.includes('Play Again'), 'expected restart button text');
});

test('trainer extracted timer bar delegates to existing Timer with passthrough props', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'components', 'trainer', 'TimerBar.jsx'), 'utf8');

  assert.ok(source.includes("import { Timer } from '../../App.jsx'"), 'expected existing Timer import');
  assert.ok(source.includes('<Timer'), 'expected Timer render');
  assert.ok(source.includes('isRunning={isRunning}'), 'expected isRunning passthrough');
  assert.ok(source.includes('elapsedTime={elapsedTime}'), 'expected elapsedTime passthrough');
  assert.ok(source.includes('maxSeconds={maxSeconds}'), 'expected maxSeconds passthrough');
  assert.ok(source.includes('difficulty={difficulty}'), 'expected difficulty passthrough');
});

test('single chord helper prepares inversion and fallback metadata', () => {
  const generated = GameLogic.prepareSingleChord({ midiNotes: [60, 64, 67] }, {
    inversionMode: 'inversions',
    allowInversions: false,
    optionalFifth: true
  });

  assert.strictEqual(generated.chord.checkInversion, true);
  assert.strictEqual(generated.chord.inversionMode, 'inversions');
  assert.strictEqual(generated.chord.optionalFifth, true);
  assert.strictEqual(generated.settings.allowInversions, true);

  const fallback = GameLogic.prepareSingleChord(null, {
    inversionMode: 'free',
    allowInversions: true,
    optionalFifth: false
  }, { midiNotes: [60, 64, 67] });

  assert.strictEqual(fallback.chord.inversionMode, 'free');
  assert.strictEqual(fallback.chord.optionalFifth, false);
  assert.strictEqual(fallback.settings.allowInversions, false);
});

test('music theory validates required notes and root position', () => {
  const chord = MusicTheory.generateChord('C', 'major', 'root', 4);

  assert.strictEqual(MusicTheory.validateChord([60, 64, 67], chord), true);
  assert.strictEqual(MusicTheory.validateChord([64, 67, 72], chord), false);
});

test('music theory validates free inversions by exact pitch classes', () => {
  const chord = MusicTheory.generateChord('C', 'major', 'root', 4);
  chord.inversionMode = 'free';

  assert.strictEqual(MusicTheory.validateChord([64, 67, 72], chord), true);
  assert.strictEqual(MusicTheory.validateChord([64, 67, 72, 74], chord), false);
});

test('music theory validates specific inversion bass note', () => {
  const chord = MusicTheory.generateChord('C', 'major', 'first', 4);
  chord.checkInversion = true;

  assert.strictEqual(MusicTheory.validateChord([64, 67, 72], chord), true);
  assert.strictEqual(MusicTheory.validateChord([60, 64, 67], chord), false);
});

test('optional fifth accepts seventh chords without the fifth', () => {
  const chord = MusicTheory.generateChord('C', 'dominant7', 'root', 4);
  chord.optionalFifth = true;

  assert.strictEqual(MusicTheory.validateChord([60, 64, 70], chord), true);
});

test('optional fifth does not apply to plain sixth chords', () => {
  const chord = MusicTheory.generateChord('C', '6', 'root', 4);
  chord.optionalFifth = true;

  assert.strictEqual(MusicTheory.validateChord([60, 64, 69], chord), false);
});

test('referenced sound files exist with exact static-site casing', () => {
  const source = fs.readFileSync(path.join(root, 'src/ChordTrainer.jsx'), 'utf8');
  const soundPaths = [...source.matchAll(/sounds\/[^'"]+\.wav/g)].map(match => match[0]);

  assert.ok(soundPaths.length > 0, 'expected sound paths in chord-trainer.js');
  for (const soundPath of soundPaths) {
    assert.ok(fs.existsSync(path.join(root, 'public', soundPath)), soundPath);
  }
});

test('vite entry does not depend on CDN React or in-browser Babel', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.ok(source.includes('type="module"'), 'expected Vite module script entry');
  assert.ok(source.includes('/src/main.jsx'), 'expected Vite React entrypoint');
  assert.ok(!source.includes('unpkg.com/react'), 'React should be package-based');
  assert.ok(!source.includes('unpkg.com/react-dom'), 'ReactDOM should be package-based');
  assert.ok(!source.includes('@babel/standalone'), 'Babel Standalone should not be used');
  assert.ok(!source.includes('text/babel'), 'browser JSX transform should not be used');
});

test('package exposes vite development and production scripts', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  assert.strictEqual(packageJson.name, 'chord-boss');
  assert.ok(packageJson.description.includes('Chord Boss'), 'expected product name in package description');
  assert.strictEqual(packageJson.scripts.test, 'node tests/run-tests.js');
  assert.strictEqual(packageJson.scripts.dev, 'vite');
  assert.strictEqual(packageJson.scripts.build, 'vite build');
  assert.strictEqual(packageJson.scripts.preview, 'vite preview');
  assert.ok(packageJson.dependencies.react, 'expected react dependency');
  assert.ok(packageJson.dependencies['react-dom'], 'expected react-dom dependency');
  assert.ok(packageJson.devDependencies.vite, 'expected vite devDependency');
  assert.ok(packageJson.devDependencies['@vitejs/plugin-react'], 'expected Vite React plugin');
});

test('vite config reads GitHub Pages base path with local fallback', () => {
  const source = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');

  assert.ok(source.includes('process.env.VITE_BASE_PATH'), 'expected env-driven base path');
  assert.ok(source.includes("base: process.env.VITE_BASE_PATH || './'"), 'expected relative local fallback');
  assert.ok(source.includes('@vitejs/plugin-react'), 'expected React plugin');
});

test('browser metadata uses Chord Boss product name', () => {
  const source = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.ok(source.includes('<title>Chord Boss</title>'), 'expected Chord Boss browser title');
});

test('GitHub Pages workflow builds and deploys Vite dist artifact', () => {
  const workflowPath = path.join(root, '.github', 'workflows', 'deploy-pages.yml');
  assert.ok(fs.existsSync(workflowPath), 'expected deploy-pages workflow');

  const source = fs.readFileSync(workflowPath, 'utf8');
  assert.ok(source.includes('branches: [main]'), 'expected push trigger for main branch');
  assert.ok(source.includes('workflow_dispatch:'), 'expected manual dispatch trigger');
  assert.ok(source.includes('contents: read'), 'expected read permission');
  assert.ok(source.includes('pages: write'), 'expected pages write permission');
  assert.ok(source.includes('id-token: write'), 'expected OIDC permission');
  assert.ok(source.includes('actions/checkout@'), 'expected checkout action');
  assert.ok(source.includes('actions/setup-node@'), 'expected Node setup action');
  assert.ok(source.includes('actions/configure-pages@'), 'expected Pages configuration action');
  assert.ok(source.includes('npm ci'), 'expected npm ci install');
  assert.ok(source.includes('npm test'), 'expected tests before build');
  assert.ok(source.includes('VITE_BASE_PATH: /${{ github.event.repository.name }}/'), 'expected repository-derived base path');
  assert.ok(source.includes('npm run build'), 'expected Vite build');
  assert.ok(source.includes('actions/upload-pages-artifact@'), 'expected Pages artifact upload');
  assert.ok(source.includes('path: dist'), 'expected dist artifact path');
  assert.ok(source.includes('actions/deploy-pages@'), 'expected Pages deployment action');
  assert.ok(source.includes('environment:'), 'expected deployment environment');
  assert.ok(source.includes('name: github-pages'), 'expected github-pages environment');
});

test('local static server uses Vite build output instead of docs runtime', () => {
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

  assert.ok(source.includes("'dist'"), 'expected server.js to serve dist');
  assert.ok(!source.includes("'docs'"), 'server.js should not serve the legacy docs app');
});

async function run() {
  await modulesReady;

  let failures = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`not ok - ${name}`);
      console.error(error.stack || error.message);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  } else {
    console.log(`${tests.length} tests passed`);
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
