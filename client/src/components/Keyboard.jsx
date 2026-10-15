import React, { useEffect } from 'react';

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

/**
 * Keyboard component supporting virtual clicks and physical keyboard presses.
 * @param {function(string): void} onKey
 * @param {Map<string, string> | Object} usedLetters
 */
export function Keyboard({ onKey, usedLetters = {} }) {
  const getStatus = (letter) => {
    const key = letter.toLowerCase();
    if (usedLetters instanceof Map) {
      return usedLetters.get(key) || '';
    }
    return usedLetters[key] || '';
  };

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toUpperCase();
      if (key === 'ENTER') {
        e.preventDefault();
        onKey('ENTER');
      } else if (key === 'BACKSPACE') {
        e.preventDefault();
        onKey('BACKSPACE');
      } else if (/^[A-Z]$/.test(key)) {
        e.preventDefault();
        onKey(key);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKey]);

  return (
    <div className="keyboard-container" aria-label="Virtual Keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map(key => {
            const isWide = key === 'ENTER' || key === '⌫';
            const statusClass = !isWide ? getStatus(key) : '';
            return (
              <button
                type="button"
                key={key}
                className={`key-button ${isWide ? 'key-wide' : ''} ${statusClass}`}
                onClick={() => onKey(key === '⌫' ? 'BACKSPACE' : key)}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
