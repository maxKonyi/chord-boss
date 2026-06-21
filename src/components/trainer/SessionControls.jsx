import GameLogic from '../../game-logic.js';

function SessionControls({ difficulty, isRunning, onEnd, onSkip, onStart }) {
  return (
    <div className="controls">
      {!isRunning ? (
        <button onClick={onStart} className="start-button">Start Training</button>
      ) : (
        <>
          {GameLogic.isPracticeMode(difficulty) && (
            <button onClick={onSkip} className="skip-button">Skip</button>
          )}
          <button onClick={onEnd} className="end-button">End Game</button>
        </>
      )}
    </div>
  );
}

export default SessionControls;
