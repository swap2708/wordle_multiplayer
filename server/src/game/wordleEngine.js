import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const wordsPath = join(__dirname, '../../data/words.txt');
const wordsRaw = readFileSync(wordsPath, 'utf-8');
const wordSet = new Set(
  wordsRaw
    .split(/\r?\n/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length === 5)
);

const wordList = Array.from(wordSet);

/**
 * Checks if a word exists in the dictionary.
 * @param {string} word
 * @returns {boolean}
 */
export function wordExists(word) {
  if (!word || typeof word !== 'string') return false;
  return wordSet.has(word.trim().toLowerCase());
}

/**
 * Evaluates a guess against the target word.
 * Returns an array of 5 objects: { letter: string, status: 'correct' | 'present' | 'absent' }
 * Correct duplicate letter handling:
 * 1. First pass: mark all correct positions (green)
 * 2. Second pass: for remaining letters, mark present (yellow) only if the target has unmatched occurrences of that letter
 *
 * @param {string} guess
 * @param {string} target
 * @returns {Array<{letter: string, status: 'correct' | 'present' | 'absent'}>}
 */
export function evaluateGuess(guess, target) {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();
  const result = Array(5).fill(null).map((_, i) => ({ letter: normalizedGuess[i], status: 'absent' }));
  const targetLetters = normalizedTarget.split('');
  const guessLetters = normalizedGuess.split('');

  // First pass: mark correct
  const targetRemaining = [...targetLetters];
  const guessRemaining = [...guessLetters];

  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i].status = 'correct';
      targetRemaining[i] = null;
      guessRemaining[i] = null;
    }
  }

  // Second pass: mark present
  for (let i = 0; i < 5; i++) {
    if (guessRemaining[i] === null) continue;
    const targetIndex = targetRemaining.indexOf(guessRemaining[i]);
    if (targetIndex !== -1) {
      result[i].status = 'present';
      targetRemaining[targetIndex] = null;
    }
  }

  return result;
}

/**
 * Returns a random 5-letter word from the dictionary.
 * @returns {string}
 */
export function getRandomWord() {
  if (wordList.length === 0) return 'crane';
  const randomIndex = Math.floor(Math.random() * wordList.length);
  return wordList[randomIndex];
}

export { wordSet, wordList };
