/**
 * Calculates round scores for all players according to the rules:
 * - Word setter gets 0 points
 * - Winner gets 15 points (10 base + 5 bonus)
 * - Others get 1 point per green tile in their best guess
 * - If no winner: everyone (except word setter) gets 1 point per green tile in best guess
 *
 * @param {Array<Object|string>} players - Array of player objects or player IDs
 * @param {Map|Object|Array} guessResults - Guess results per player
 * @param {string|null} winnerId - ID of winning player, or null if no winner
 * @param {string} wordSetterId - ID of the word setter for this round
 * @returns {Array<{playerId: string, pointsEarned: number}>}
 */
export function calculateRoundScores(players = [], guessResults = null, winnerId = null, wordSetterId = null) {
  if (!Array.isArray(players)) {
    return [];
  }

  return players.map(player => {
    const playerId = typeof player === 'string' ? player : (player.id || player.playerId);

    // Word setter always gets 0 points
    if (playerId === wordSetterId) {
      return { playerId, pointsEarned: 0 };
    }

    // Winner gets 15 points (10 base + 5 bonus)
    if (winnerId && playerId === winnerId) {
      return { playerId, pointsEarned: 15 };
    }

    // Find guesses for this player
    let playerGuesses = [];
    if (player && Array.isArray(player.guesses)) {
      playerGuesses = player.guesses;
    } else if (guessResults) {
      if (guessResults instanceof Map && guessResults.has(playerId)) {
        const entry = guessResults.get(playerId);
        playerGuesses = entry.guesses || (Array.isArray(entry) ? entry : []);
      } else if (typeof guessResults === 'object' && guessResults[playerId]) {
        const entry = guessResults[playerId];
        playerGuesses = entry.guesses || (Array.isArray(entry) ? entry : []);
      } else if (Array.isArray(guessResults)) {
        const entry = guessResults.find(g => (g.playerId || g.id) === playerId);
        if (entry) {
          playerGuesses = entry.guesses || (Array.isArray(entry) ? entry : []);
        }
      }
    }

    // Non-winners get 1 point per green tile in their best guess
    let maxGreenTiles = 0;
    for (const guessObj of playerGuesses) {
      if (guessObj && Array.isArray(guessObj.feedback)) {
        const greenCount = guessObj.feedback.filter(tile => tile && tile.status === 'correct').length;
        if (greenCount > maxGreenTiles) {
          maxGreenTiles = greenCount;
        }
      }
    }

    return { playerId, pointsEarned: maxGreenTiles };
  });
}
