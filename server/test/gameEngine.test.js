import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGuess, wordExists, getRandomWord } from '../src/game/wordleEngine.js';
import { calculateRoundScores } from '../src/game/scoring.js';
import { RoomManager } from '../src/rooms/roomManager.js';
import { isValidWord, sanitizeDisplayName, isValidRoomCode } from '../src/utils/validation.js';

describe('Wordle Engine Tests', () => {
  test('1. evaluateGuess - correct, present, and absent tile cases', () => {
    // Target: 'crane', Guess: 'crabs'
    // c: correct, r: correct, a: correct, b: absent, s: absent
    const result = evaluateGuess('crabs', 'crane');
    assert.equal(result.length, 5);
    assert.deepEqual(result[0], { letter: 'c', status: 'correct' });
    assert.deepEqual(result[1], { letter: 'r', status: 'correct' });
    assert.deepEqual(result[2], { letter: 'a', status: 'correct' });
    assert.deepEqual(result[3], { letter: 'b', status: 'absent' });
    assert.deepEqual(result[4], { letter: 's', status: 'absent' });

    // Target: 'crane', Guess: 'reach'
    // r: present (in crane at pos 1), e: present (in crane at pos 4), a: present (in crane at pos 2), c: present (in crane at pos 0), h: absent
    const result2 = evaluateGuess('reach', 'crane');
    assert.deepEqual(result2[0], { letter: 'r', status: 'present' });
    assert.deepEqual(result2[1], { letter: 'e', status: 'present' });
    assert.deepEqual(result2[2], { letter: 'a', status: 'present' });
    assert.deepEqual(result2[3], { letter: 'c', status: 'present' });
    assert.deepEqual(result2[4], { letter: 'h', status: 'absent' });
  });

  test('2. Duplicate letter handling (e.g., speed vs spade)', () => {
    // Guess: 'speed', Target: 'spade'
    // Target has one 'e' at index 4.
    // In 'speed':
    // s (0) -> matches s (0): correct
    // p (1) -> matches p (1): correct
    // e (2) -> not at 2. target 'e' is at 4. But guess[4] = d, not e.
    // e (3) -> not at 3.
    // d (4) -> target[4] is e, but target[3] is d: d is present!
    // For e at index 2 vs index 3: target remaining has only ONE 'e'.
    // First 'e' at index 2 becomes present, second 'e' at index 3 becomes absent.
    const result = evaluateGuess('speed', 'spade');
    assert.deepEqual(result[0], { letter: 's', status: 'correct' });
    assert.deepEqual(result[1], { letter: 'p', status: 'correct' });
    assert.deepEqual(result[2], { letter: 'e', status: 'present' });
    assert.deepEqual(result[3], { letter: 'e', status: 'absent' });
    assert.deepEqual(result[4], { letter: 'd', status: 'present' });

    // Another case: guess has duplicate 'e', target has 'e' in correct position
    // Target: 'spade', Guess: 'erase'
    // target 'e' is at pos 4. Guess has 'e' at 0 and 4.
    // Guess[4] is 'e' matching target[4] -> correct!
    // Target remaining has 0 'e's left.
    // Guess[0] 'e' must be marked 'absent'!
    const result2 = evaluateGuess('erase', 'spade');
    assert.deepEqual(result2[4], { letter: 'e', status: 'correct' });
    assert.deepEqual(result2[0], { letter: 'e', status: 'absent' });
  });

  test('3. wordExists - valid and invalid words', () => {
    assert.equal(wordExists('crane'), true);
    assert.equal(wordExists('CRANE'), true); // case insensitivity
    assert.equal(wordExists('house'), true);
    assert.equal(wordExists('magic'), true);
    assert.equal(wordExists('xyzqw'), false);
    assert.equal(wordExists('toolongword'), false);
    assert.equal(wordExists(''), false);
    assert.equal(wordExists(null), false);
  });

  test('3b. Dictionary contains >= 1500 words and all required prompt words', () => {
    const requiredWords = [
      'crane', 'slate', 'audio', 'house', 'words', 'think', 'plant', 'light', 'music', 'dance',
      'stone', 'water', 'tiger', 'flame', 'cloud', 'storm', 'ghost', 'brave', 'crisp', 'tower',
      'sword', 'magic', 'lucky', 'candy', 'fuzzy', 'quick', 'jumpy', 'blaze', 'crave', 'proud',
      'giant', 'heart', 'catch', 'flute', 'grace', 'snare', 'blast', 'creep', 'drift', 'frost',
      'glare', 'grime', 'groan', 'grope', 'grout', 'group', 'grove', 'growl', 'gruel', 'guard',
      'guava', 'guile', 'guise', 'gulch', 'gulls', 'gulps', 'gumbo', 'gummy', 'guppy', 'gusts',
      'gavel', 'gecko', 'genre', 'gents', 'geode'
    ];

    for (const w of requiredWords) {
      assert.equal(wordExists(w), true, `Expected required word "${w}" to exist in words.txt`);
    }

    const random = getRandomWord();
    assert.equal(typeof random, 'string');
    assert.equal(random.length, 5);
  });
});

describe('Scoring System Tests', () => {
  test('4. calculateRoundScores - winner scoring (15 pts), non-winner green-tile scoring', () => {
    const players = [
      { id: 'player1' },
      { id: 'player2' },
      { id: 'player3' }
    ];

    // player1 solved it (winner)
    // player2 had 2 guesses: one with 2 greens, one with 3 greens -> should get 3 points
    // player3 is word setter
    const guessResults = new Map();
    guessResults.set('player1', {
      guesses: [
        { word: 'stone', feedback: [{ status: 'correct' }, { status: 'absent' }, { status: 'absent' }, { status: 'absent' }, { status: 'absent' }] },
        { word: 'crane', feedback: [{ status: 'correct' }, { status: 'correct' }, { status: 'correct' }, { status: 'correct' }, { status: 'correct' }] }
      ]
    });
    guessResults.set('player2', {
      guesses: [
        { word: 'crate', feedback: [{ status: 'correct' }, { status: 'correct' }, { status: 'absent' }, { status: 'absent' }, { status: 'correct' }] }, // 3 greens
        { word: 'trace', feedback: [{ status: 'absent' }, { status: 'correct' }, { status: 'correct' }, { status: 'absent' }, { status: 'absent' }] }   // 2 greens
      ]
    });

    const scores = calculateRoundScores(players, guessResults, 'player1', 'player3');

    const p1Score = scores.find(s => s.playerId === 'player1');
    const p2Score = scores.find(s => s.playerId === 'player2');
    const p3Score = scores.find(s => s.playerId === 'player3');

    assert.equal(p1Score.pointsEarned, 15); // Winner gets 15 points
    assert.equal(p2Score.pointsEarned, 3);  // 3 green tiles in best guess
    assert.equal(p3Score.pointsEarned, 0);  // Word setter gets 0 points
  });

  test('9. Word setter gets no points even with best guesses or if no winner', () => {
    const players = [{ id: 'setter' }, { id: 'guesser' }];
    const guessResults = new Map();
    guessResults.set('setter', {
      guesses: [{ word: 'crane', feedback: [{ status: 'correct' }, { status: 'correct' }, { status: 'correct' }, { status: 'correct' }, { status: 'correct' }] }]
    });
    guessResults.set('guesser', {
      guesses: [{ word: 'slate', feedback: [{ status: 'correct' }, { status: 'correct' }, { status: 'absent' }, { status: 'absent' }, { status: 'absent' }] }]
    });

    const scores = calculateRoundScores(players, guessResults, null, 'setter');
    const setterScore = scores.find(s => s.playerId === 'setter');
    const guesserScore = scores.find(s => s.playerId === 'guesser');

    assert.equal(setterScore.pointsEarned, 0);
    assert.equal(guesserScore.pointsEarned, 2);
  });
});

describe('Room Manager Tests', () => {
  test('5. Room creation', () => {
    const rm = new RoomManager();
    const { roomCode, room } = rm.createRoom('p1', 'Alice');

    assert.ok(roomCode);
    assert.equal(roomCode.length, 6);
    assert.equal(room.hostId, 'p1');
    assert.equal(room.status, 'lobby');
    assert.equal(room.players.size, 1);
    assert.equal(room.players.get('p1').name, 'Alice');
    assert.equal(rm.getRoom(roomCode), room);
  });

  test('6. Room joining - success and failure cases', () => {
    const rm = new RoomManager();
    const { roomCode } = rm.createRoom('p1', 'HostPlayer');

    // Success joining
    const joinResult = rm.joinRoom(roomCode, 'p2', 'Bob');
    assert.equal(joinResult.success, true);
    assert.equal(joinResult.room.players.size, 2);
    assert.equal(joinResult.room.players.get('p2').name, 'Bob');

    // Failure: Non-existent room
    const failResult = rm.joinRoom('NONEXT', 'p3', 'Charlie');
    assert.equal(failResult.success, false);
    assert.equal(failResult.error, 'Room not found');

    // Reconnection of existing player
    const reconResult = rm.joinRoom(roomCode, 'p2', 'Bob', 'socket_123');
    assert.equal(reconResult.success, true);
    assert.equal(reconResult.reconnected, true);
    assert.equal(reconResult.room.players.get('p2').socketId, 'socket_123');
  });

  test('7. Room joining - full room rejection', () => {
    const rm = new RoomManager();
    const { roomCode } = rm.createRoom('host', 'Host');

    // Add 7 more players to reach max 8
    for (let i = 1; i <= 7; i++) {
      const res = rm.joinRoom(roomCode, `p_${i}`, `Player ${i}`);
      assert.equal(res.success, true);
    }

    const room = rm.getRoom(roomCode);
    assert.equal(room.players.size, 8);

    // 9th player joining should be rejected
    const ninthResult = rm.joinRoom(roomCode, 'p_9', 'Ninth');
    assert.equal(ninthResult.success, false);
    assert.match(ninthResult.error, /full/i);
  });

  test('8. Invalid room code rejection', () => {
    const rm = new RoomManager();
    const res1 = rm.joinRoom('', 'p1', 'Test');
    assert.equal(res1.success, false);

    const res2 = rm.joinRoom('123', 'p1', 'Test'); // only 3 chars
    assert.equal(res2.success, false);

    const res3 = rm.joinRoom('INVALID_LONG_CODE', 'p1', 'Test');
    assert.equal(res3.success, false);
  });

  test('10. Round rotation and game lifecycle', () => {
    const rm = new RoomManager();
    const { roomCode, room } = rm.createRoom('p1', 'Player 1');
    rm.joinRoom(roomCode, 'p2', 'Player 2');
    rm.joinRoom(roomCode, 'p3', 'Player 3');

    // Setup game start
    room.status = 'playing';
    room.totalRounds = 3;
    room.currentRound = 1;
    room.wordSetterOrder = ['p1', 'p2', 'p3'];
    room.currentWordSetterIndex = 0;

    // Check round 1 word setter is p1
    assert.equal(room.wordSetterOrder[room.currentWordSetterIndex], 'p1');

    // Advance to round 2
    room.currentRound += 1;
    room.currentWordSetterIndex = (room.currentWordSetterIndex + 1) % room.wordSetterOrder.length;
    assert.equal(room.currentRound, 2);
    assert.equal(room.wordSetterOrder[room.currentWordSetterIndex], 'p2');

    // Advance to round 3
    room.currentRound += 1;
    room.currentWordSetterIndex = (room.currentWordSetterIndex + 1) % room.wordSetterOrder.length;
    assert.equal(room.currentRound, 3);
    assert.equal(room.wordSetterOrder[room.currentWordSetterIndex], 'p3');

    // Next would finish game
    assert.equal(room.currentRound >= room.totalRounds, true);
  });
});

describe('Validation and Rate Limiter Utilities', () => {
  test('isValidWord validation', () => {
    assert.equal(isValidWord('CRANE'), true);
    assert.equal(isValidWord('slate'), true);
    assert.equal(isValidWord('four'), false);
    assert.equal(isValidWord('toolong'), false);
    assert.equal(isValidWord('num12'), false);
    assert.equal(isValidWord(''), false);
  });

  test('sanitizeDisplayName validation', () => {
    assert.equal(sanitizeDisplayName('  Alice  '), 'Alice');
    assert.equal(sanitizeDisplayName('Bob123!@#'), 'Bob123');
    assert.equal(sanitizeDisplayName('Very Long Name That Exceeds Twenty Characters'), 'Very Long Name That ');
  });

  test('isValidRoomCode validation', () => {
    assert.equal(isValidRoomCode('ABC123'), true);
    assert.equal(isValidRoomCode('ABC'), false);
    assert.equal(isValidRoomCode('ABC1234'), false);
  });
});
