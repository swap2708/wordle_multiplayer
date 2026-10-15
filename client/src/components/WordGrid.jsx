import React from 'react';

/**
 * WordGrid renders the 5x5 Wordle grid.
 * @param {Array<{word: string, feedback: Array<{letter: string, status: string}>}>} guesses
 * @param {string} currentGuess
 * @param {number} maxGuesses
 * @param {boolean} isShaking
 */
export function WordGrid({ guesses = [], currentGuess = '', maxGuesses = 5, isShaking = false }) {
  const rows = [];

  for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex++) {
    if (rowIndex < guesses.length) {
      // Completed guess row
      const guessObj = guesses[rowIndex];
      const feedback = guessObj.feedback || [];
      rows.push(
        <div key={rowIndex} className="grid-row">
          {Array.from({ length: 5 }).map((_, colIndex) => {
            const tile = feedback[colIndex] || { letter: '', status: 'absent' };
            const style = { animationDelay: `${colIndex * 120}ms` };
            return (
              <div
                key={colIndex}
                className={`tile flip ${tile.status}`}
                style={style}
              >
                {tile.letter.toUpperCase()}
              </div>
            );
          })}
        </div>
      );
    } else if (rowIndex === guesses.length) {
      // Current active typing row
      const letters = currentGuess.split('');
      rows.push(
        <div key={rowIndex} className={`grid-row ${isShaking ? 'shake' : ''}`}>
          {Array.from({ length: 5 }).map((_, colIndex) => {
            const letter = letters[colIndex] || '';
            return (
              <div
                key={colIndex}
                className={`tile ${letter ? 'filled' : ''}`}
              >
                {letter.toUpperCase()}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Empty future row
      rows.push(
        <div key={rowIndex} className="grid-row">
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <div key={colIndex} className="tile" />
          ))}
        </div>
      );
    }
  }

  return <div className="word-grid">{rows}</div>;
}
