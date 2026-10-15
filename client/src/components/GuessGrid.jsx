import React from 'react';

/**
 * GuessGrid displays completed guesses with colored tiles.
 * Useful for reviewing player performance in Round Results.
 * @param {Array<{word: string, feedback: Array<{letter: string, status: string}>}>} guesses
 * @param {number} maxGuesses
 * @param {boolean} mini
 */
export function GuessGrid({ guesses = [], maxGuesses = 5, mini = false }) {
  const tileSize = mini ? '28px' : '40px';
  const fontSize = mini ? '13px' : '18px';

  const rows = [];
  for (let rowIndex = 0; rowIndex < maxGuesses; rowIndex++) {
    const guessObj = guesses[rowIndex];
    if (guessObj) {
      const feedback = guessObj.feedback || [];
      rows.push(
        <div key={rowIndex} style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
          {Array.from({ length: 5 }).map((_, colIndex) => {
            const tile = feedback[colIndex] || { letter: '', status: 'absent' };
            let bgColor = 'var(--color-absent)';
            if (tile.status === 'correct') bgColor = 'var(--color-correct)';
            if (tile.status === 'present') bgColor = 'var(--color-present)';

            return (
              <div
                key={colIndex}
                style={{
                  width: tileSize,
                  height: tileSize,
                  backgroundColor: bgColor,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize,
                  borderRadius: '3px',
                  textTransform: 'uppercase'
                }}
              >
                {tile.letter}
              </div>
            );
          })}
        </div>
      );
    } else {
      // Empty row placeholder
      rows.push(
        <div key={rowIndex} style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '4px' }}>
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <div
              key={colIndex}
              style={{
                width: tileSize,
                height: tileSize,
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                opacity: 0.3
              }}
            />
          ))}
        </div>
      );
    }
  }

  return <div>{rows}</div>;
}
