/**
 * useTimer.js - Custom hook for managing timers in the Composer Piano Trainer
 * 
 * This hook centralizes timer logic to ensure only one timer/interval is active at a time
 * and provides consistent timer management across the application.
 */

// Access React hooks from the global React object
import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing timers with consistent behavior
 * 
 * @param {Object} options - Timer configuration options
 * @param {boolean} options.autoStart - Whether to start the timer automatically on mount
 * @param {number} options.interval - Interval in milliseconds for timer updates (default: 100ms)
 * @param {number} options.maxTime - Maximum time in milliseconds before timeout
 * @param {Function} options.onTimeout - Callback function to execute when timer expires
 * @returns {Object} Timer state and control functions
 */
function useTimer({ 
  autoStart = false, 
  interval = 100, 
  maxTime = 10000, 
  onTimeout = null 
}) {
  // Timer state
  const [isRunning, setIsRunning] = useState(autoStart);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Use ref to track the interval ID to ensure proper cleanup
  const timerRef = useRef(null);
  const didTimeoutRef = useRef(false);
  
  // Start the timer
  const startTimer = () => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const now = Date.now();
    didTimeoutRef.current = false;
    setStartTime(now);
    setElapsedTime(0);
    setIsRunning(true);
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - now;
      setElapsedTime(elapsed);
      
      // Check if timer has expired
      if (elapsed >= maxTime && onTimeout && !didTimeoutRef.current) {
        didTimeoutRef.current = true;
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsRunning(false);
        onTimeout();
      }
    }, interval);
  };
  
  // Stop the timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    didTimeoutRef.current = false;
    setIsRunning(false);
  };
  
  // Reset the timer
  const resetTimer = () => {
    stopTimer();
    setElapsedTime(0);
    setStartTime(null);
  };
  
  // Restart the timer (stop, reset, and start again)
  const restartTimer = () => {
    resetTimer();
    startTimer();
  };
  
  // Auto-start timer if configured
  useEffect(() => {
    if (autoStart) {
      startTimer();
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);
  
  return {
    isRunning,
    elapsedTime,
    startTime,
    startTimer,
    stopTimer,
    resetTimer,
    restartTimer,
    // Helper to get percentage of time elapsed (useful for progress bars)
    percentElapsed: maxTime > 0 ? Math.min(100, (elapsedTime / maxTime) * 100) : 0
  };
}

// Create a global hooks object if it doesn't exist
if (typeof window !== 'undefined') {
  window.hooks = window.hooks || {};

  // Add the useTimer hook to the global hooks object
  window.hooks.useTimer = useTimer;
}

// For direct access in JSX
const useTimerHook = useTimer;

export { useTimerHook };
export default useTimer;
