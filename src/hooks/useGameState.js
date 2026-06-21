/**
 * useGameState.js - Custom hook for managing game state in the Composer Piano Trainer
 * 
 * This hook implements a finite state machine (FSM) for game states to replace
 * scattered boolean flags with explicit state transitions.
 */

// Access React hooks from the global React object
import { useReducer } from 'react';

/**
 * Game state constants
 */
const GAME_STATES = {
  IDLE: 'idle',           // Initial state, not playing
  PLAYING: 'playing',     // Actively playing/waiting for input
  FEEDBACK: 'feedback',   // Showing feedback after an attempt
  NEXT_CHORD: 'nextChord', // Transitioning to next chord in progression
  SUMMARY: 'summary'      // Game over, showing summary
};

/**
 * Action types for the game state reducer
 */
const ACTIONS = {
  START_GAME: 'startGame',
  CORRECT_ANSWER: 'correctAnswer',
  WRONG_ANSWER: 'wrongAnswer',
  TIMEOUT: 'timeout',
  NEXT_CHORD: 'nextChord',
  NEXT_QUESTION: 'nextQuestion',
  GAME_OVER: 'gameOver',
  RESET_GAME: 'resetGame',
  SET_FEEDBACK: 'setFeedback',
  CLEAR_FEEDBACK: 'clearFeedback',
  SET_PROCESSING: 'setProcessing',
  CLEAR_PROCESSING: 'clearProcessing'
};

/**
 * Initial state for the game
 */
const initialState = {
  state: GAME_STATES.IDLE,
  lives: 3,
  score: 0,
  streak: 0,
  highestStreak: 0,
  multiplier: 1,
  questionCount: 0,
  totalAttempts: 0,
  completedChords: [],
  showFeedback: false,
  feedbackType: null,
  feedbackMessage: '',
  showSummary: false,
  isProcessingChord: false
};

/**
 * Reducer function for game state transitions
 */
function gameStateReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_GAME:
      return {
        ...initialState,
        state: GAME_STATES.PLAYING,
        lives: 3
      };
      
    case ACTIONS.CORRECT_ANSWER:
      const newStreak = state.streak + 1;
      const newMultiplier = Math.min(4, 1 + Math.floor(newStreak / 5));
      const basePoints = Number.isFinite(action.payload?.points) ? action.payload.points : 10;
      const scoreIncrease = basePoints * newMultiplier;
      const feedbackMessage = action.payload?.feedbackMessage ||
        `Correct! +${scoreIncrease} points (${newMultiplier}x multiplier)`;
      
      return {
        ...state,
        state: GAME_STATES.FEEDBACK,
        score: state.score + scoreIncrease,
        streak: newStreak,
        highestStreak: Math.max(state.highestStreak || 0, newStreak),
        multiplier: newMultiplier,
        totalAttempts: state.totalAttempts + 1,
        showFeedback: true,
        feedbackType: 'correct',
        feedbackMessage,
        isProcessingChord: true
      };
      
    case ACTIONS.WRONG_ANSWER:
      const wrongLives = Math.max(0, state.lives - 1);
      if (wrongLives <= 0) {
        return {
          ...state,
          state: GAME_STATES.SUMMARY,
          lives: 0,
          streak: 0,
          multiplier: 1,
          totalAttempts: state.totalAttempts + 1,
          showFeedback: true,
          feedbackType: 'gameover',
          feedbackMessage: 'Game over!',
          showSummary: true,
          isProcessingChord: true
        };
      }
      return {
        ...state,
        state: GAME_STATES.FEEDBACK,
        lives: wrongLives,
        streak: 0,
        multiplier: 1,
        totalAttempts: state.totalAttempts + 1,
        showFeedback: true,
        feedbackType: 'wrong',
        feedbackMessage: `Wrong chord! ${wrongLives} ${wrongLives === 1 ? 'life' : 'lives'} remaining.`,
        isProcessingChord: true
      };
      
    case ACTIONS.TIMEOUT:
      const newLives = Math.max(0, state.lives - 1);
      if (newLives <= 0) {
        return {
          ...state,
          state: GAME_STATES.SUMMARY,
          lives: 0,
          streak: 0,
          multiplier: 1,
          totalAttempts: state.totalAttempts + 1,
          showFeedback: true,
          feedbackType: 'gameover',
          feedbackMessage: 'Game over!',
          showSummary: true,
          isProcessingChord: true
        };
      }
      return {
        ...state,
        state: GAME_STATES.FEEDBACK,
        lives: newLives,
        streak: 0,
        multiplier: 1,
        totalAttempts: state.totalAttempts + 1,
        showFeedback: true,
        feedbackType: 'timeout',
        feedbackMessage: `Time's up! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`,
        isProcessingChord: true
      };
      
    case ACTIONS.NEXT_CHORD:
      return {
        ...state,
        state: GAME_STATES.NEXT_CHORD,
        completedChords: [...state.completedChords, action.payload.chordId],
        isProcessingChord: false
      };
      
    case ACTIONS.NEXT_QUESTION:
      return {
        ...state,
        state: GAME_STATES.PLAYING,
        questionCount: action.payload.isNewQuestion ? state.questionCount + 1 : state.questionCount,
        showFeedback: false,
        feedbackType: null,
        feedbackMessage: '',
        isProcessingChord: false,
        completedChords: action.payload.resetCompletedChords ? [] : state.completedChords
      };
      
    case ACTIONS.GAME_OVER:
      return {
        ...state,
        state: GAME_STATES.SUMMARY,
        lives: 0,
        showFeedback: true,
        feedbackType: 'gameover',
        feedbackMessage: `Game over! ${action.payload.message || ''}`,
        showSummary: true,
        isProcessingChord: true
      };
      
    case ACTIONS.RESET_GAME:
      return {
        ...initialState
      };

    case ACTIONS.SET_FEEDBACK:
      return {
        ...state,
        showFeedback: true,
        feedbackType: action.payload?.feedbackType || null,
        feedbackMessage: action.payload?.feedbackMessage || ''
      };

    case ACTIONS.CLEAR_FEEDBACK:
      return {
        ...state,
        showFeedback: false,
        feedbackType: null,
        feedbackMessage: ''
      };
      
    case ACTIONS.SET_PROCESSING:
      return {
        ...state,
        isProcessingChord: true
      };
      
    case ACTIONS.CLEAR_PROCESSING:
      return {
        ...state,
        isProcessingChord: false
      };
      
    default:
      return state;
  }
}

/**
 * Custom hook for managing game state with a reducer
 * 
 * @returns {Object} Game state and dispatch function
 */
function useGameState() {
  const [gameState, dispatch] = useReducer(gameStateReducer, initialState);
  
  // Helper functions for common actions
  const startGame = () => dispatch({ type: ACTIONS.START_GAME });
  
  const correctAnswer = (points, feedbackMessage) => dispatch({
    type: ACTIONS.CORRECT_ANSWER,
    payload: { points, feedbackMessage }
  });
  
  const wrongAnswer = () => dispatch({ type: ACTIONS.WRONG_ANSWER });
  
  const timeout = () => dispatch({ type: ACTIONS.TIMEOUT });
  
  const nextChord = (chordId) => dispatch({ 
    type: ACTIONS.NEXT_CHORD,
    payload: { chordId }
  });
  
  const nextQuestion = (isNewQuestion = true, resetCompletedChords = false) => dispatch({
    type: ACTIONS.NEXT_QUESTION,
    payload: { isNewQuestion, resetCompletedChords }
  });
  
  const gameOver = (message = '') => dispatch({
    type: ACTIONS.GAME_OVER,
    payload: { message }
  });
  
  const resetGame = () => dispatch({ type: ACTIONS.RESET_GAME });

  const setFeedback = (feedbackType, feedbackMessage = '') => dispatch({
    type: ACTIONS.SET_FEEDBACK,
    payload: { feedbackType, feedbackMessage }
  });

  const clearFeedback = () => dispatch({ type: ACTIONS.CLEAR_FEEDBACK });
  
  // Add actions for processing state
  const setProcessing = () => dispatch({ type: ACTIONS.SET_PROCESSING });
  const clearProcessing = () => dispatch({ type: ACTIONS.CLEAR_PROCESSING });
  
  return {
    ...gameState,
    GAME_STATES,
    startGame,
    correctAnswer,
    wrongAnswer,
    timeout,
    nextChord,
    setFeedback,
    clearFeedback,
    setProcessing,
    clearProcessing,
    nextQuestion,
    gameOver,
    resetGame
  };
}

// Create a global hooks object if it doesn't exist
if (typeof window !== 'undefined') {
  window.hooks = window.hooks || {};

  // Add the useGameState hook to the global hooks object
  window.hooks.useGameState = useGameState;
  window.hooks.__gameStateTest = {
    GAME_STATES,
    ACTIONS,
    initialState,
    gameStateReducer
  };
}

export {
  GAME_STATES,
  ACTIONS,
  initialState,
  gameStateReducer
};

export default useGameState;
