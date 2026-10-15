/**
 * Validates whether a word is exactly 5 alphabetic characters.
 * @param {string} word
 * @returns {boolean}
 */
export function isValidWord(word) {
  if (typeof word !== 'string') return false;
  return /^[a-zA-Z]{5}$/.test(word.trim());
}

/**
 * Sanitizes player display names: trimmed, max 20 characters, alphanumeric + spaces only.
 * @param {string} name
 * @returns {string}
 */
export function sanitizeDisplayName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 20);
}

/**
 * Validates whether a room code is exactly 6 alphanumeric characters.
 * @param {string} code
 * @returns {boolean}
 */
export function isValidRoomCode(code) {
  if (typeof code !== 'string') return false;
  return /^[a-zA-Z0-9]{6}$/.test(code.trim());
}
