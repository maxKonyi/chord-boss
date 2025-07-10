# Piano Chord Trainer - Gamification Implementation Plan

## Overview

This document outlines the implementation plan for enhancing the gamification aspects of the Piano Chord Trainer application. The goal is to make the experience more engaging, fun, and addictive while maintaining the educational value of the app.

## Game Mechanics

### Core Loop
1. Player is presented with a chord to play
2. A timer bar fills up over time (horizontal, as it is now)
3. If the player answers correctly before the timer fills:
   - They earn points based on speed
   - The next chord is presented
4. If the timer fills completely:
   - Player loses one life (out of 3)
   - The same chord remains for another attempt
5. If all three lives are lost:
   - Game over
   - Final score is displayed
6. If the player completes all questions with lives remaining:
   - Game complete
   - Final score is displayed (includes remaining lives bonus)

### Difficulty Levels
- **Easy**: 12 seconds per question
- **Medium**: 6 seconds per question
- **Hard**: 3 seconds per question

### Engagement Features
1. **Lives System**:
   - Visual representation of 3 lives (piano key or heart icons)
   - Animation when a life is lost (shake + flash red)
   - Audio feedback for life loss (low "thud" sound)

2. **Streak Multiplier**:
   - Consecutive correct answers increase score multiplier (×1, ×2, ×3...)
   - Visual indicator of current streak/multiplier
   - Regain one life at streak 5 (never exceeding starting max)

3. **Audio Feedback**:
   - Pleasant chime on correct answers
   - Low "thud" note on life loss

4. **Visual Feedback**:
   - Timer bar flashes red when a life is lost
   - Different timer bar colors based on difficulty (Easy: green tint, Medium: neutral, Hard: red tint)

5. **End-of-Game Summary**:
   - Chords attempted
   - Accuracy percentage
   - Highest streak
   - Final score
   - Highlight if player beat their previous record

## Implementation Steps

### 1. Update State Management
Add new state variables to the ChordTrainer component:
```javascript
const [lives, setLives] = useState(3);
const [streak, setStreak] = useState(0);
const [multiplier, setMultiplier] = useState(1);
const [difficulty, setDifficulty] = useState('medium'); // 'easy', 'medium', 'hard'
const [highestStreak, setHighestStreak] = useState(0);
```

### 2. Add Difficulty Selection to Sidebar
Add a new dropdown in the Session settings group:
```jsx
<label>
  Difficulty: 
  <select 
    value={settings.difficulty}
    onChange={e => setSettings({...settings, difficulty: e.target.value})}
    style={{ marginLeft: '0.25rem', padding: '0.25rem', background: '#222', color: 'white', border: '1px solid #444' }}
  >
    <option value="easy">Easy (12s)</option>
    <option value="medium">Medium (6s)</option>
    <option value="hard">Hard (3s)</option>
  </select>
</label>
```

### 3. Modify Timer Logic
Update the Timer component to use difficulty-based timing:
```javascript
function Timer({ isRunning, elapsedTime, maxSeconds, difficulty }) {
  // Calculate max time based on difficulty
  const difficultyTimes = {
    easy: 12,
    medium: 6,
    hard: 3
  };
  
  const actualMaxSeconds = difficultyTimes[difficulty] || maxSeconds;
  const maxMs = actualMaxSeconds * 1000;
  
  // Calculate color based on elapsed time percentages and difficulty
  const yellowThreshold = maxMs * 0.3;
  const redThreshold = maxMs * 0.5;
  
  let timerClass = 'timer-green';
  if (elapsedTime > redThreshold) {
    timerClass = 'timer-red';
  } else if (elapsedTime > yellowThreshold) {
    timerClass = 'timer-yellow';
  }
  
  // Add difficulty-based tint
  if (difficulty === 'hard') {
    timerClass += ' timer-hard';
  } else if (difficulty === 'easy') {
    timerClass += ' timer-easy';
  }
  
  // Calculate width percentage
  const widthPercentage = Math.min(elapsedTime / maxMs * 100, 100);
  
  return (
    <div className="timer-container">
      {isRunning && (
        <div 
          className={`timer-progress ${timerClass}`} 
          style={{ width: `${widthPercentage}%` }}
        />
      )}
      <div className="timer-ticks">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="timer-tick" style={{ left: `${(i + 1) * 10}%` }} />
        ))}
      </div>
    </div>
  );
}
```

### 4. Implement Lives Display
Add a lives display component:
```jsx
function LivesDisplay({ lives }) {
  return (
    <div className="lives-display">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className={`life-icon ${i < lives ? 'life-active' : 'life-lost'}`}
        >
          ♥
        </div>
      ))}
    </div>
  );
}
```

### 5. Update Game Logic
Modify the chord validation logic to handle lives and streaks:
```javascript
// Inside the useEffect that checks if chord is played correctly
if (isCorrect) {
  // Stop timer
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  
  // Calculate score with multiplier
  const responseTime = elapsedTime;
  const maxTime = getDifficultyTime(settings.difficulty) * 1000;
  let pointsEarned = 0;
  
  // Dynamic scoring based on percentage of max time
  if (responseTime <= maxTime * 0.2) {
    pointsEarned = 10;
  } else if (responseTime <= maxTime * 0.4) {
    pointsEarned = 8;
  } else if (responseTime <= maxTime * 0.6) {
    pointsEarned = 6;
  } else if (responseTime <= maxTime * 0.8) {
    pointsEarned = 4;
  } else if (responseTime <= maxTime) {
    pointsEarned = 2;
  } else {
    pointsEarned = 1;
  }
  
  // Update streak and multiplier
  const newStreak = streak + 1;
  setStreak(newStreak);
  
  // Update highest streak if needed
  if (newStreak > highestStreak) {
    setHighestStreak(newStreak);
  }
  
  // Calculate multiplier (cap at 5x)
  const newMultiplier = Math.min(Math.floor(newStreak / 2) + 1, 5);
  setMultiplier(newMultiplier);
  
  // Apply multiplier to points
  pointsEarned *= newMultiplier;
  
  // Check if player should regain a life at streak 5
  if (newStreak === 5 && lives < 3) {
    setLives(lives + 1);
    // Play life gain sound
    playSound('lifeGain');
  }
  
  // Update score and question count
  setScore(prevScore => prevScore + pointsEarned);
  const newQuestionCount = questionCount + 1;
  setQuestionCount(newQuestionCount);
  setIsRunning(false);
  
  // Show feedback
  setFeedback({
    type: 'correct',
    message: `Correct! +${pointsEarned} points (×${newMultiplier})`,
    time: responseTime
  });
  
  // Play correct answer sound
  playSound('correct');
  
  // Rest of the logic for next question...
}
```

### 6. Add Timer Completion Logic
Add logic to handle when the timer fills completely:
```javascript
// Add a new useEffect to monitor timer completion
useEffect(() => {
  if (isRunning && elapsedTime >= getDifficultyTime(settings.difficulty) * 1000) {
    // Timer is complete, lose a life
    const newLives = lives - 1;
    setLives(newLives);
    
    // Reset streak and multiplier
    setStreak(0);
    setMultiplier(1);
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Flash the timer bar red
    setTimerFlash(true);
    setTimeout(() => setTimerFlash(false), 200);
    
    // Play life loss sound
    playSound('lifeLoss');
    
    if (newLives <= 0) {
      // Game over
      setIsRunning(false);
      setFeedback({
        type: 'gameover',
        message: `Game over! Final score: ${score}`
      });
      
      // Show end of game summary
      showGameSummary();
    } else {
      // Continue with same chord
      setFeedback({
        type: 'timeout',
        message: `Time's up! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`
      });
      
      // Restart timer for the same chord
      const now = Date.now();
      setStartTime(now);
      setElapsedTime(0);
      
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - now);
      }, 100);
    }
  }
}, [isRunning, elapsedTime, settings.difficulty, lives, score]);
```

### 7. Add Sound Effects
Create a simple sound effect system:
```javascript
// Sound effect function
const playSound = (type) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch(type) {
    case 'correct':
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5
      gainNode.gain.value = 0.1;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
      oscillator.stop(audioContext.currentTime + 0.5);
      break;
    case 'lifeLoss':
      oscillator.type = 'sine';
      oscillator.frequency.value = 220; // A3
      gainNode.gain.value = 0.2;
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7);
      oscillator.stop(audioContext.currentTime + 0.7);
      break;
    case 'lifeGain':
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4
      gainNode.gain.value = 0.1;
      oscillator.start();
      
      // Create a quick arpeggio effect
      setTimeout(() => {
        oscillator.frequency.value = 554.37; // C#5
      }, 100);
      setTimeout(() => {
        oscillator.frequency.value = 659.25; // E5
      }, 200);
      
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);
      oscillator.stop(audioContext.currentTime + 0.6);
      break;
  }
};
```

### 8. Add Game Summary
Create a game summary component:
```jsx
function GameSummary({ questionCount, settings, score, accuracy, highestStreak }) {
  // Load previous best streak from localStorage
  const previousBest = localStorage.getItem('bestStreak') || 0;
  const isNewRecord = highestStreak > previousBest;
  
  // Save new record if applicable
  if (isNewRecord) {
    localStorage.setItem('bestStreak', highestStreak);
  }
  
  return (
    <div className="game-summary">
      <h3>Game Summary</h3>
      <div className="summary-stats">
        <div className="summary-item">
          <div className="summary-value">{questionCount}/{settings.questionCount}</div>
          <div className="summary-label">Chords Attempted</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{accuracy}%</div>
          <div className="summary-label">Accuracy</div>
        </div>
        <div className="summary-item">
          <div className={`summary-value ${isNewRecord ? 'new-record' : ''}`}>
            {highestStreak} {isNewRecord && '🏆'}
          </div>
          <div className="summary-label">Highest Streak</div>
        </div>
        <div className="summary-item">
          <div className="summary-value">{score}</div>
          <div className="summary-label">Final Score</div>
        </div>
      </div>
    </div>
  );
}
```

### 9. Add CSS Styles
Add new CSS styles for the game elements:
```css
/* Lives display */
.lives-display {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.life-icon {
  font-size: 20px;
  transition: transform 0.3s, opacity 0.3s;
}

.life-active {
  color: #ff6b6b;
  opacity: 1;
}

.life-lost {
  color: #444;
  opacity: 0.5;
}

.life-shake {
  animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}

/* Timer enhancements */
.timer-container {
  position: relative;
  height: 10px;
  background: #222;
  border-radius: 5px;
  overflow: hidden;
  margin: 15px 0;
}

.timer-progress {
  height: 100%;
  transition: width 0.1s linear;
}

.timer-flash {
  animation: flash 0.2s;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-ticks {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.timer-tick {
  position: absolute;
  height: 50%;
  width: 1px;
  background: rgba(255, 255, 255, 0.2);
  top: 25%;
}

/* Difficulty-based timer colors */
.timer-easy {
  background: linear-gradient(to right, #4caf50, #8bc34a);
}

.timer-hard {
  background: linear-gradient(to right, #f44336, #ff9800);
}

/* Game summary */
.game-summary {
  background: #222;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: space-between;
}

.summary-item {
  text-align: center;
  flex: 1;
  min-width: 80px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 12px;
  opacity: 0.7;
}

.new-record {
  color: #bb86fc; /* Purple highlight for new records */
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Streak multiplier display */
.streak-display {
  font-size: 14px;
  margin-top: 5px;
  color: #bb86fc;
}
```

### 10. LocalStorage Integration
Add localStorage to remember difficulty settings:
```javascript
// In the ChordTrainer component initialization
useEffect(() => {
  // Load saved difficulty from localStorage
  const savedDifficulty = localStorage.getItem('chordTrainerDifficulty');
  if (savedDifficulty) {
    setSettings(prev => ({...prev, difficulty: savedDifficulty}));
  }
}, []);

// When difficulty changes
useEffect(() => {
  // Save difficulty to localStorage
  localStorage.setItem('chordTrainerDifficulty', settings.difficulty);
}, [settings.difficulty]);
```

## Testing Plan

1. **Basic Functionality**:
   - Verify that the timer adjusts based on selected difficulty
   - Confirm lives are lost when timer fills
   - Ensure the same chord remains after losing a life
   - Verify game ends when all lives are lost

2. **Streak & Multiplier**:
   - Verify streak counter increases with consecutive correct answers
   - Confirm multiplier increases at appropriate intervals
   - Test life regain at streak 5
   - Verify streak resets on timeout

3. **Visual & Audio Feedback**:
   - Test timer bar color changes
   - Verify life icon animations
   - Confirm sound effects play correctly
   - Test timer flash on life loss

4. **Game Summary**:
   - Verify accuracy calculation
   - Confirm highest streak tracking
   - Test new record detection and highlighting
   - Verify localStorage persistence

## Conclusion

This implementation enhances the gamification aspects of the Piano Chord Trainer while maintaining its educational value. The lives system provides forgiveness for mistakes, while the streak multiplier rewards consistent performance. The difficulty settings allow players of all skill levels to enjoy the game and progress at their own pace.
