// Shared trainer settings helpers. Keep these free of React so they can be tested in Node.
window.TrainerSettings = window.TrainerSettings || {};

TrainerSettings.DEFAULT_SETTINGS = {
  chordTypes: ['major', 'minor'],
  allowInversions: false,
  inversionMode: 'root',
  rootNotes: [],
  octave: 4,
  timerMaxSeconds: 10,
  questionCount: 10,
  questionDelay: 1500,
  optionalFifth: false,
  activePresetId: null,
  difficulty: 'medium',
  useProgressions: false,
  keyMode: 'random',
  fixedKey: 'C',
  selectedProgressions: []
};

TrainerSettings.getDefaultSettings = function() {
  return {
    ...TrainerSettings.DEFAULT_SETTINGS,
    chordTypes: [...TrainerSettings.DEFAULT_SETTINGS.chordTypes],
    rootNotes: [...TrainerSettings.DEFAULT_SETTINGS.rootNotes],
    selectedProgressions: [...TrainerSettings.DEFAULT_SETTINGS.selectedProgressions]
  };
};

TrainerSettings.normalizeSettings = function(settings) {
  const normalized = {
    ...TrainerSettings.getDefaultSettings(),
    ...(settings || {})
  };

  if (!Array.isArray(normalized.chordTypes)) {
    normalized.chordTypes = ['major', 'minor'];
  } else {
    normalized.chordTypes = [...normalized.chordTypes];
  }

  normalized.rootNotes = Array.isArray(normalized.rootNotes) ? [...normalized.rootNotes] : [];
  normalized.selectedProgressions = Array.isArray(normalized.selectedProgressions)
    ? [...normalized.selectedProgressions]
    : [];

  return normalized;
};

TrainerSettings.loadSettings = function(savedSettingsJson) {
  if (!savedSettingsJson) {
    return TrainerSettings.getDefaultSettings();
  }

  try {
    return TrainerSettings.normalizeSettings(JSON.parse(savedSettingsJson));
  } catch (error) {
    return TrainerSettings.getDefaultSettings();
  }
};

TrainerSettings.mergeSettings = function(currentSettings, newSettings) {
  return TrainerSettings.normalizeSettings({
    ...(currentSettings || {}),
    ...(newSettings || {})
  });
};

TrainerSettings.applyPresetSettings = function(presetId, currentSettings, presets) {
  if (!presets || typeof presets.applyPreset !== 'function') {
    return TrainerSettings.mergeSettings(currentSettings, { activePresetId: presetId });
  }

  return TrainerSettings.mergeSettings(presets.applyPreset(presetId, currentSettings), {
    activePresetId: presetId
  });
};
