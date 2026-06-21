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
