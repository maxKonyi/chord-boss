// Import React hooks from the global React object
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import GameLogic from './game-logic.js';
import MidiUtils from './midi-utils.js';
import MusicTheory from './music-theory.js';
import Presets from './presets.js';
import TrainerSettings from './trainer-settings.js';
import useGameState from './hooks/useGameState.js';
import useTimer from './hooks/useTimer.js';
import { PianoKeyboard, Timer } from './App.jsx';
// Access React hooks from the global React object
// Note: useTimer is accessed directly from window.hooks when needed

// Note: PresetSelector has been moved to sidebar.js

// Lives display component
function LivesDisplay({ lives }) {
  return (
    <div className="lives-display">
      {[...Array(3)].map((_, i) => (
        <div key={i} className={`life-icon ${i < lives ? 'life-active' : 'life-lost'}`}>
          ♥
        </div>
      ))}
    </div>
  );
}

// Game summary component
function GameSummary({ questionCount, settings, score, accuracy, highestStreak, wrongNotesCount, totalAttempts, difficulty, failedChordName, onRestart }) {
  // Check if we're in practice mode using the passed difficulty parameter
  const isPractice = isPracticeMode(difficulty || settings.difficulty);
  
  // Load previous best streak from localStorage if available
  const previousBest = parseInt(localStorage.getItem('bestStreak') || '0');
  const isNewRecord = !isPractice && highestStreak > previousBest;
  
  // Calculate gem rating purely from accuracy (simpler & deterministic)
  // Skip for practice mode
  let gemCount = 0;
  if (!isPractice) {
    if (accuracy === 100 && wrongNotesCount === 0) {
      gemCount = 5; // Perfect play: 5 gems
    } else if (accuracy >= 80) {
      gemCount = 4; // 80–99%
    } else if (accuracy >= 60) {
      gemCount = 3; // 60–79%
    } else if (accuracy >= 40) {
      gemCount = 2; // 40–59%
    } else if (accuracy >= 20) {
      gemCount = 1; // 20–39%
    } else {
      gemCount = 0; // 0–19%
    }
  }
  
  // Save new record if applicable
  useEffect(() => {
    if (isNewRecord && highestStreak > 0) {
      localStorage.setItem('bestStreak', highestStreak.toString());
    }
    
    // Store gem rating in localStorage
    const gameResults = {
      score,
      gemCount,
      accuracy,
      highestStreak,
      wrongNotesCount,
      date: new Date().toISOString()
    };
    
    // Get existing results or initialize empty array
    const existingResults = JSON.parse(localStorage.getItem('gameResults') || '[]');
    existingResults.push(gameResults);
    
    // Store up to 10 most recent results
    localStorage.setItem('gameResults', 
      JSON.stringify(existingResults.slice(-10)));
  }, [isNewRecord, highestStreak, score, gemCount, accuracy, wrongNotesCount]);
  
  return (
    <div className="game-summary">
      <h3>Game Summary</h3>
      
      {/* Failed Chord - Prominently displayed at the top if present */}
      {!isPractice && failedChordName && (
        <div className="failed-chord-display">
          <div className="failed-chord-value">{failedChordName}</div>
          <div className="failed-chord-label">Failed Chord</div>
        </div>
      )}
      
      {/* Row 1: Questions and Difficulty */}
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-value">
            {isPractice ? questionCount : settings.questionCount}
          </div>
          <div className="summary-label">Questions</div>
        </div>
        
        <div className="summary-divider">|</div>
        
        <div className="summary-item">
          <div className="summary-value">
            {(difficulty || settings.difficulty).charAt(0).toUpperCase() + (difficulty || settings.difficulty).slice(1)}
          </div>
          <div className="summary-label">Difficulty</div>
        </div>
      </div>
      
      {/* Row 2: Accuracy, Score, and Streak */}
      <div className="summary-row">
        <div className="summary-item">
          <div className="summary-value">{accuracy}%</div>
          <div className="summary-label">Accuracy</div>
        </div>
        
        {/* Only show score in non-practice mode */}
        {!isPractice && (
          <>
            <div className="summary-divider">|</div>
            <div className="summary-item">
              <div className="summary-value">{score}</div>
              <div className="summary-label">Final Score</div>
            </div>
          </>
        )}
        
        {/* Only show streak in non-practice mode */}
        {!isPractice && (
          <>
            <div className="summary-divider">|</div>
            <div className="summary-item">
              <div className={`summary-value ${isNewRecord ? 'new-record' : ''}`}>
                {highestStreak} {isNewRecord && '🏆'}
              </div>
              <div className="summary-label">
                Highest Streak
                {isNewRecord && previousBest > 0 && (
                  <div className="previous-best">Previous: {previousBest}</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Row 3: Gem Rating Display - hidden in Practice mode */}
      {!isPractice && (
        <div className="gem-row">
          <div className="gem-container">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`gem ${i < gemCount ? 'filled' : ''}`}
              >
                ♦
              </div>
            ))}
          </div>
          <div className="gem-label"></div>
        </div>
      )}
      
      <button className="restart-button" onClick={onRestart}>Play Again</button>
    </div>
  );
}

// Helper function to get time in milliseconds based on difficulty
function getDifficultyTime(difficulty) {
  return GameLogic.getDifficultyTime(difficulty);
}

// Helper function to check if current difficulty is practice mode
function isPracticeMode(difficulty) {
  return GameLogic.isPracticeMode(difficulty);
}

/**
 * Utility to build a new progression object based on the current settings.
 * Always returns an object of the shape:
 *   { id, name, key, chords:[Chord,…] }
 * Throws an Error if it fails to generate a valid progression.
 */
function createNewProgression(settings) {
  return GameLogic.createProgressionQuestion(settings, Presets, MusicTheory);
}

// Sound effect function
const playSound = (type, settings) => {
  // If audio is muted or this is the wrong chord sound, don't play any sounds
  if ((settings && settings.muteAudio) || type === 'wrong') {
    return;
  }
  
  // Sound file mapping
  const soundFiles = {
    'correct': 'sounds/correct.wav',
    'wrong': 'sounds/wrong.wav',
    'lifeLoss': 'sounds/life-Loss.wav',
    'gameOver': 'sounds/game-Over.wav'
    // Add more sound mappings here as needed
  };
  
  // Check if we have a sound file for this type
  if (soundFiles[type]) {
    // Create audio element
    const audio = new Audio(soundFiles[type]);
    
    // Play the sound
    audio.play().catch(error => {
      console.error('Error playing sound:', error);
    });
  } else {
    console.warn(`No sound file defined for type: ${type}`);
  }
};

// The useTimer hook is already accessed from window.hooks at the top of the file

/**
 * Centralized function to calculate score based on response time and difficulty
 * @param {number} responseTime - Time taken to answer in milliseconds
 * @param {string} difficulty - Game difficulty level ('easy', 'medium', 'hard', 'practice')
 * @returns {number} - Points earned for this answer
 */
const calculateScore = (responseTime, difficulty) => {
  return GameLogic.calculateScore(responseTime, difficulty);
};

/**
 * Centralized function to calculate accuracy based on question count and attempts
 * @param {number} questionCount - Number of questions correctly answered
 * @param {number} totalAttempts - Total number of attempts made
 * @param {number} wrongNotesCount - Number of wrong notes played
 * @returns {number} - Accuracy percentage (0-100)
 */
const calculateAccuracy = (questionCount, totalAttempts, wrongNotesCount) => {
  // If no questions have been answered yet, accuracy is 0
  if (questionCount === 0) return 0;
  
  // Calculate effective attempts - each wrong note counts as half an attempt
  // This prevents excessive wrong note penalties while still accounting for them
  const effectiveAttempts = Math.max(questionCount, totalAttempts + wrongNotesCount * 0.25);
  
  // Calculate accuracy percentage (questions correct / effective attempts)
  // Ensure we don't divide by zero by using max of 1 for effectiveAttempts
  const accuracyPercentage = Math.round((questionCount / effectiveAttempts) * 100);
  
  // Clamp accuracy between 0-100%
  return Math.max(0, Math.min(100, accuracyPercentage));
};

// Chord Trainer Component
function ChordTrainer({ activeNotes, midiStatus }) {
  // State for the trainer
  const [currentChord, setCurrentChord] = useState(null);
  
  // Use the game state hook to manage game state
  const {
    state: gameState,
    GAME_STATES,
    lives,
    score,
    streak,
    multiplier,
    questionCount,
    totalAttempts,
    showFeedback,
    feedbackType,
    feedbackMessage,
    showSummary,
    isProcessingChord,
    completedChords,
    startGame,
    correctAnswer,
    wrongAnswer,
    timeout,
    nextChord,
    nextQuestion,
    gameOver,
    resetGame,
    setProcessing,
    clearProcessing
  } = useGameState();
  
  // Track if the game is running
  const [isRunning, setIsRunning] = useState(false);
  // ... (rest of the code remains the same)
  // Immediate lock to prevent duplicate validation within the same chord
  const processingLockRef = useRef(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  // Using feedback from useGameState instead of local state
  const [feedback, setFeedback] = useState(null);
  // score, questionCount, and totalAttempts now come from useGameState
  const [wrongNotesCount, setWrongNotesCount] = useState(0); // Track incorrect notes played
  const [lastWrongAttemptSignature, setLastWrongAttemptSignature] = useState(null);
  const [failedChordNotes, setFailedChordNotes] = useState(new Set()); // Store failed chord notes to display on keyboard
  const [failedChordName, setFailedChordName] = useState(null); // Store failed chord display name
  
  // Progression mode state
  const [currentProgression, setCurrentProgression] = useState(null); // Current progression data
  const [progressionIndex, setProgressionIndex] = useState(0); // Current chord index in progression
  // completedChords now comes from useGameState
  const [progressionKey, setProgressionKey] = useState('C'); // Key for current progression
  // Total questions will come from settings
  
  // Game state variables (lives, streak, multiplier) now come from useGameState
  const [highestStreak, setHighestStreak] = useState(0); // Track highest streak
  const [accuracy, setAccuracy] = useState(0);     // Percentage of correct answers

  // Recalculate accuracy whenever questionCount, totalAttempts, or wrongNotesCount changes
  useEffect(() => {
    // Use the centralized calculateAccuracy function
    const acc = calculateAccuracy(questionCount, totalAttempts, wrongNotesCount);
    setAccuracy(acc);
  }, [questionCount, totalAttempts, wrongNotesCount]);

  // showSummary now comes from useGameState
  const [gameDifficulty, setGameDifficulty] = useState(null); // Store the game difficulty
  
  // Settings for chord generation with localStorage persistence
  const [settings, setSettings] = useState(() => {
    return TrainerSettings.loadSettings(localStorage.getItem('chordTrainerSettings'));
  });
  
  // Update settings and save to localStorage
  const updateSettings = useCallback((newSettings) => {
    const storage = typeof localStorage !== 'undefined' ? localStorage : null;
    TrainerSettings.createPersistentUpdater(setSettings, storage)(newSettings);
  }, []);
  
  // Reference to track active notes
  const activeNotesRef = useRef(new Set());
  
  // Reference to track the question delay timeout
  const questionDelayTimeoutRef = useRef(null);
  
  // Get difficulty time in milliseconds
  const getMaxTime = () => getDifficultyTime(settings.difficulty) * 1000;
  
  // Initialize the timer using our custom hook from window.hooks
  const { 
    isRunning: timerIsRunning, 
    elapsedTime: timerElapsedTime, 
    startTimer, 
    stopTimer, 
    resetTimer, 
    restartTimer,
    percentElapsed
  } = useTimer({
    autoStart: false,
    interval: 100,
    maxTime: getMaxTime(),
    onTimeout: () => {
      // Timer is complete, lose a life
      const newLives = lives - 1;
      // Temporarily block further processing until we load the next chord
      setProcessing(); // Use FSM action instead of direct state setting
      
      // Show feedback
      playSound('wrong', settings);
      
      // Use timeout action from FSM to handle lives, streak, multiplier, and totalAttempts
      timeout();
      
      // If out of lives (after timeout action), end the game
      if (newLives <= 0) {
        setIsRunning(false);
        setGameDifficulty(settings.difficulty);
        
        // Generate and display the failed chord notes
        // Make sure to stop the timer to prevent callbacks from firing
        stopTimer();
        
        if (currentChord) {
          // Get the MIDI notes for the current chord
          const midiNotes = MusicTheory.getChordVoicing(currentChord);
          // Convert to a Set for the PianoKeyboard component
          setFailedChordNotes(new Set(midiNotes));
          setFailedChordName(currentChord.displayName);
          
          // Use gameOver action to transition to summary state
          gameOver(`Game over! The correct chord is shown on the keyboard. Final score: ${score}`);
        } else {
          // Use gameOver action to transition to summary state
          gameOver(`Game over! Final score: ${score}`);
        }
        
        // Play game over sound once
        playSound('gameOver', settings);
      } else {
        // Show feedback with remaining lives
        setFeedback({
          type: 'timeout',
          message: `Time's up! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`
        });
        
        // In progression mode, move to next chord
        if (settings.useProgressions && currentProgression) {
          // Move to next chord in progression
          advanceChord(false); // false indicates this was not a correct answer
        } else {
          // In single chord mode, restart timer for the same chord
          restartTimer();
          
          // Allow processing of chord again
          clearProcessing(); // Use FSM action instead of direct state setting
        }
      }
    }
  });
  
  // Sync our timer state with component state
  useEffect(() => {
    setElapsedTime(timerElapsedTime);
  }, [timerElapsedTime]);
  
  // Update maxTime when difficulty changes
  useEffect(() => {
    // This will update the maxTime in the useTimer hook
    resetTimer();
  }, [settings.difficulty]);
  
  // Skip the current question and move to the next one
  const skipQuestion = () => {
    setLastWrongAttemptSignature(null);
    // Stop timer
    stopTimer();
    
    // Check if we've reached the question limit
    if (questionCount + 1 >= settings.questionCount) {
      // End of session
      setIsRunning(false); // Only set to false when training is complete
      gameOver(`Training complete! Final score: ${score}`);
      return;
    }
    
    // If delay is 0 (instant), skip the feedback and move to next question immediately
    if (settings.questionDelay === 0) {
      // Use nextQuestion action to increment question count
      nextQuestion(true);
      generateNewQuestion();
      return;
    }
    
    // Otherwise show feedback and wait for the configured delay
    setFeedback({
      type: 'skipped',
      message: 'Question skipped.'
    });
    
    // Clear any existing timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Generate next question after the configured delay
    questionDelayTimeoutRef.current = setTimeout(() => {
      generateNewQuestion();
      questionDelayTimeoutRef.current = null; // Clear the reference after it's used
    }, settings.questionDelay);
  };
  
  // Handle preset selection
  const handleSelectPreset = (presetId) => {
    // Get the preset
    const preset = Presets.getPresetById(presetId);
    if (!preset) {
      console.error(`Preset with ID ${presetId} not found`);
      return;
    }
    
    // Update settings with the preset and mark this preset as active
    updateSettings(TrainerSettings.applyPresetSettings(presetId, settings, Presets));
    
    // Reset the game state when selecting a preset
    // Stop any existing timer
    stopTimer();
    
    // Clear any pending question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Reset game state using the FSM resetGame action
    resetGame();
    setIsRunning(false);
    setCurrentChord(null);
    setElapsedTime(0);
    
    // Show feedback about the selected preset
    setFeedback({
      type: 'preset',
      message: `Preset selected: ${preset.name}. Click Start to begin training.`
    });
  };
  
  // -----------------------------
  // Progression helper callbacks
  // -----------------------------
  
  // Create and start a new progression
  const startNewProgression = useCallback(() => {
    try {
      const prog = createNewProgression(settings);
      setCurrentProgression(prog);
      setProgressionIndex(0);
      setProgressionKey(prog.key);
      
      // We don't increment the question count here because:
      // 1. For the first progression, it's handled in startTraining
      // 2. For subsequent progressions, it's handled in advanceChord when completing a progression
      // first chord becomes the active question
      const firstChord = prog.chords[0];
      if (firstChord) {
        setCurrentChord(GameLogic.prepareProgressionChord(prog, 0, settings).chord);
      // Ensure game is flagged as running
      setIsRunning(true);
      }
      // (Re)start timer for the first chord in the new progression
      resetTimer();
      startTimer();
    } catch (err) {
      console.error('Failed to start new progression:', err.message);
      // Do not fall back to single-chord mode anymore; just log the error.
    }
  }, [settings]);

  // Generate a new chord question
  const generateNewQuestion = useCallback(() => {
    if (!settings || questionCount >= settings.questionCount) {
      return;
    }
    
    // Clear any existing question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Show feedback that we're generating a new question
    setFeedback({
      type: 'info',
      message: settings.useProgressions ? 'Next progression...' : 'Next question...'
    });
    
    // Apply the question delay before generating the new question
    // Use the question delay from settings, default to 1500ms if not set
    const delayTime = settings.questionDelay !== undefined ? settings.questionDelay : 1500;
    questionDelayTimeoutRef.current = setTimeout(() => {
      // If progression mode is active, delegate to startNewProgression and exit.
      if (settings.useProgressions) {
        startNewProgression();
        return;
      }
      
      // ---- single-chord mode below ----
      
      // Make sure any previous timer is cleared
      stopTimer();
      
      const safeSettings = GameLogic.prepareSingleChordSettings(settings);
      
      try {
        // Standard single chord mode
        generateRandomSingleChord(safeSettings);
      } catch (error) {
        // Handle any errors during chord generation
        console.error('Error generating chord:', error);
        const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
        setCurrentChord(GameLogic.prepareSingleChord(defaultChord, safeSettings).chord);
      }
      
      // Update game state
      setIsRunning(true);
      clearProcessing(); // Reset processing flag when generating a new question
      setFeedback(null);
      setLastWrongAttemptSignature(null);
      
      // Start a new timer
      resetTimer();
      startTimer();
    }, delayTime); // Use the question delay from settings
    
  }, [settings, questionCount, score, currentProgression, progressionIndex, completedChords, startNewProgression]);

  // Move to the next chord or start a new progression
  const advanceChord = useCallback((wasCorrect = true) => {
    // For non-progression mode, use the standard generateNewQuestion with delay
    if (!settings.useProgressions) {
      generateNewQuestion();
      return;
    }
    
    // For progression mode, check if we're at the end of a progression
    if (!currentProgression || progressionIndex >= currentProgression.chords.length - 1) {
      // We're at the end of a progression
      // Use nextQuestion action to increment question count if the last chord was correct
      if (wasCorrect) {
        nextQuestion(true, true); // true = new question, true = reset completedChords
      }
      
      // Use generateNewQuestion which will handle the delay and start a new progression
      generateNewQuestion();
      return;
    } else {
      // We're advancing to the next chord in the same progression
      const nextIndex = progressionIndex + 1;
      setProgressionIndex(nextIndex);
      const prepared = GameLogic.prepareProgressionChord(currentProgression, nextIndex, settings);
      if (prepared.chord) {
        setCurrentChord(prepared.chord);
      }

      // Reset timer for the next chord in the progression
      resetTimer();
      startTimer();
      
      // Use nextChord action to move to the next chord in the progression
      // This will reset lives and update completedChords
      nextChord(progressionIndex);
    }
  }, [settings, currentProgression, progressionIndex, generateNewQuestion, nextQuestion, nextChord]);
  
  // Helper function to generate a random single chord
  const generateRandomSingleChord = (safeSettings) => {
    // Generate a new chord and add checkInversion flag based on settings
    const newChord = MusicTheory.generateRandomChord(safeSettings);
    
    // Make sure we have a valid chord before setting properties
    if (newChord) {
      setCurrentChord(GameLogic.prepareSingleChord(newChord, safeSettings).chord);
    } else {
      // If chord generation failed, try again with default settings
      console.warn('Failed to generate chord, trying with default settings');
      const defaultChord = MusicTheory.generateChord('C', 'major', 'root', 4);
      setCurrentChord(GameLogic.prepareSingleChord(defaultChord, safeSettings).chord);
    }
  };
  
  // Start a new training session
  const startTraining = () => {
    // Reset UI-specific state
    setElapsedTime(0);
    setCurrentChord(null); // Clear current chord before generating a new one
    setHighestStreak(0); // Reset highest streak
    setWrongNotesCount(0); // Reset wrong notes count
    setLastWrongAttemptSignature(null);
    setFailedChordNotes(new Set()); // Clear failed chord notes
    setFailedChordName(null);
    setGameDifficulty(settings.difficulty); // Store difficulty for this game
    
    // Use startGame action from FSM to reset game state and transition to PLAYING state
    startGame();
    
    // Mark the game as running
    setIsRunning(true);
    
    // Stop any existing timer
    stopTimer();
    
    // Small delay to ensure state is reset before generating a new question
    // This prevents potential race conditions
    setTimeout(() => {
      generateNewQuestion();
    }, 10);
  };
  
  // Reset everything and end the current game
  const resetTraining = () => {
    setLastWrongAttemptSignature(null);
    setFailedChordNotes(new Set()); // Clear failed chord notes
    setFailedChordName(null);
    // Stop the timer if it's running
    stopTimer();
    
    // Clear any pending question delay timeout
    if (questionDelayTimeoutRef.current) {
      clearTimeout(questionDelayTimeoutRef.current);
      questionDelayTimeoutRef.current = null;
    }
    
    // Reset UI state
    setIsRunning(false);
    setCurrentChord(null);
    setElapsedTime(0);
    
    // Use gameOver action from FSM to transition to summary state
    // This will handle showing feedback and summary
    gameOver(`Game ended. Final score: ${score}`);
    
    // Don't reset score and question count immediately
    // This allows the player to see their final stats
  };
  
  // Update active notes reference when activeNotes changes
  useEffect(() => {
    activeNotesRef.current = new Set(activeNotes);
    
    // Prevent duplicate validation for the same chord instance
    if (processingLockRef.current) return;
    
    // Check if the current chord is played correctly
    // Determine how many notes are actually required (handle optional 5th)
    const requiredNoteCount = (() => {
        return GameLogic.getRequiredNoteCount(currentChord);
      })();
    if (currentChord && isRunning && !isProcessingChord && activeNotes.size >= requiredNoteCount) {
      // Lock processing to avoid duplicate validations
      processingLockRef.current = true;
      setProcessing(); // Use FSM action instead of direct state setting
        
      // Convert activeNotes Set to an array of MIDI note numbers
      const playedNotesArray = Array.from(activeNotes);
      const isCorrect = MusicTheory.validateChord(playedNotesArray, currentChord);
      
      // Track wrong attempts when an incorrect full chord is played
      if (!isCorrect) {
        const wrongAttempt = GameLogic.getWrongAttemptUpdate(playedNotesArray, lastWrongAttemptSignature);
        const signature = wrongAttempt.signature;
        // Only penalise if this signature hasn't already been counted for this question
        if (wrongAttempt.shouldPenalize) {
          const remainingLives = lives - 1;
          setWrongNotesCount(prev => prev + 1);
          setLastWrongAttemptSignature(signature);
          // Use wrongAnswer action from FSM to handle streak, multiplier, and lives
          wrongAnswer();
          playSound('wrong', settings);

          if (remainingLives <= 0) {
            setIsRunning(false);
            setGameDifficulty(settings.difficulty);
            stopTimer();

            if (currentChord) {
              const midiNotes = MusicTheory.getChordVoicing(currentChord);
              setFailedChordNotes(new Set(midiNotes));
              setFailedChordName(currentChord.displayName);
              gameOver(`Game over! The correct chord is shown on the keyboard. Final score: ${score}`);
            } else {
              gameOver(`Game over! Final score: ${score}`);
            }

            playSound('gameOver', settings);
            return;
          }
        }
        // Reset processing flag after a short delay for wrong answers
        setTimeout(() => {
          clearProcessing(); // Use FSM action instead of direct state setting
          processingLockRef.current = false;
        }, 500);
      }
      
      if (isCorrect) {
        // Reset wrong attempt tracker for next question
        setLastWrongAttemptSignature(null);
        // Stop timer
        stopTimer();
        
        // Use the centralized calculateScore function
        const pointsEarned = calculateScore(elapsedTime, settings.difficulty);
        const nextMultiplier = Math.min(4, 1 + Math.floor((streak + 1) / 5));
        const totalPointsEarned = pointsEarned * nextMultiplier;
        
        // Update highest streak if needed
        if (streak + 1 > highestStreak) {
          setHighestStreak(streak + 1);
        }
        
        // Use correctAnswer action from FSM to handle score, streak, multiplier, and totalAttempts
        correctAnswer(pointsEarned);
        
        // Play correct sound
        playSound('correct', settings);
        
        // Show feedback
        setFeedback({
          type: 'correct',
          message: `Correct! +${totalPointsEarned} points`
        });
        
        // Only increment question count in single-chord mode
        // In progression mode, we count the entire progression as one question
        if (!settings.useProgressions) {
          nextQuestion(true); // true = new question
        }
        
        // Handle next step
        advanceChord();
        
        // After a short delay, reset processing flag and check if we've reached max questions
        setTimeout(() => {
          // Reset processing flag
          clearProcessing(); // Use FSM action instead of direct state setting
          processingLockRef.current = false;
          
          // Check if we've reached the max question count
          if (questionCount + 1 >= settings.questionCount) {
            // Game completed successfully
            setIsRunning(false);
            setGameDifficulty(settings.difficulty);
            
            // Make sure to stop the timer to prevent callbacks from firing
            stopTimer();
            
            // Show game summary after a short delay using FSM action
            setTimeout(() => {
              gameOver('Game completed successfully!');
            }, 1000);
           // Processing flag will be reset in the main setTimeout callback
          } else if (!settings.useProgressions || !currentProgression) {
            // No-op
          }
          // We don't need any additional logic here - advanceChord() already handles
          // progression advancement and timer restart
        }, 1000);
      }
    }
    
    // Timer expiration is now handled by the useTimer hook's onTimeout callback
  }, [isRunning, elapsedTime, settings.difficulty, lives, score, questionCount, activeNotes, currentChord, isProcessingChord, lastWrongAttemptSignature, streak, highestStreak, multiplier, wrongNotesCount, totalAttempts]);
  
  // Clean up timer on unmount is handled by the useTimer hook
  
  // No duplicate imports or invalid syntax here

  return (
    <div className="app-container">
      {/* Use our new Sidebar component that's available on the window object */}
      <Sidebar 
        settings={settings} 
        setSettings={updateSettings} 
        midiStatus={midiStatus}
        handleSelectPreset={handleSelectPreset}
      />
      
      {/* Main content area */}
      <div className="main-content">
        {showSummary ? (
          <GameSummary 
            questionCount={questionCount}
            settings={settings}
            score={score}
            accuracy={accuracy}
            highestStreak={highestStreak}
            wrongNotesCount={wrongNotesCount}
            totalAttempts={totalAttempts}
            difficulty={gameDifficulty}
            failedChordName={failedChordName}
            onRestart={startTraining}
          />
        ) : (
      <>
        {/* Question display */}
        <div className="question-display">
          {currentChord ? currentChord.displayName : '---'}
        </div>

        {/* Progression display - only shown when in progression mode */}
        {settings.useProgressions && currentProgression && (
          <div className="progression-display">
            {/* Show progression name */}
            <div className="progression-name">
              {progressionKey} - {currentProgression.name}
            </div>
            {/* Display all chords in the progression with indicators */}
            <div className="progression-chords">
              {currentProgression.chords.map((chord, index) => (
                <div 
                  key={index} 
                  className={`progression-chord ${index === progressionIndex ? 'current' : ''} ${completedChords.includes(index) ? 'completed' : ''}`}
 >
                  {chord.displayName}
                  <div 
                    className={`progression-indicator ${index === progressionIndex ? 'current' : ''} ${completedChords.includes(index) ? 'completed' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
            
            {/* Timer */}
            <Timer 
              isRunning={isRunning} 
              elapsedTime={elapsedTime} 
              maxSeconds={settings.timerMaxSeconds} 
              difficulty={settings.difficulty} 
            />
            
            {/* Lives display */}
            <LivesDisplay lives={lives} />
            
            {/* Score display - hidden in Practice mode */}
            {!isPracticeMode(settings.difficulty) && (
              <div className="chord-trainer-score">
                Score: {score}
              </div>
            )}
            
            {/* Controls */}
            <div className="controls" style={{ marginTop: '1rem' }}>
              {!isRunning ? (
                <button onClick={startTraining}>Start Training</button>
              ) : (
                <>
                  {/* Skip button only shown in Practice mode */}
                  {isPracticeMode(settings.difficulty) && (
                    <button onClick={skipQuestion} className="skip-button">Skip</button>
                  )}
                  <button onClick={resetTraining} className="end-button">End Game</button>
                </>
              )}
            </div>
            
            {/* Feedback message area */}
            <div className={`result-feedback ${feedback ? (feedback.type === 'correct' ? 'result-correct' : feedback.type === 'skipped' ? 'result-skipped' : feedback.type === 'preset' ? 'result-preset' : 'result-incorrect') : ''}`}>
              {feedback ? feedback.message : ''}
            </div>
          </>
        )}
        
        {/* Piano keyboard inside the main content area */}
        <div className="keyboard-wrapper">
          <PianoKeyboard activeNotes={activeNotes} failedChordNotes={failedChordNotes} startOctave={3} endOctave={5} />
        </div>
      </div>
    </div>
  );
}

// Export the ChordTrainer component to the global window object
if (typeof window !== 'undefined') {
  window.ChordTrainer = ChordTrainer;
}

export default ChordTrainer;
