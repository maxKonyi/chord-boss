/**
 * Gem-rating helper
 * Converts a raw score into 0-5 orange gems based on percentage of max score.
 * 
 * @param {number} playerScore - The score the player achieved
 * @param {number} maxScore - The score of a flawless run
 * @returns {number} Integer 0-5 (number of filled gems)
 */
function getGemCount(playerScore, maxScore) {
  if (!maxScore) return 0;                     // safety check
  
  const pct = playerScore / maxScore;          // 0‒1 percentage
  
  // Map percentage to gem count based on breakpoints
  if (pct < 0.2) return 0;      // 0-19%: 0 gems
  if (pct < 0.4) return 1;      // 20-39%: 1 gem
  if (pct < 0.6) return 2;      // 40-59%: 2 gems
  if (pct < 0.8) return 3;      // 60-79%: 3 gems
  if (pct < 1) return 4;        // 80-99%: 4 gems
  return 5;                     // 100%: 5 gems
}

// Export for use in other files
window.ScoreGems = {
  getGemCount
};
