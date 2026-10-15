# Multiplayer Wordle

A real-time multiplayer Wordle game built with React, Vite, Node.js, Express, and Socket.IO.

## Overview

Multiplayer Wordle lets friends take turns choosing the secret 5-letter word while everyone else races to solve it within 5 attempts. Guesses remain completely private until the round ends, at which point all player guess boards and points are revealed.

### Key Features
- **Rotating Word Setter**: Each round, a different player becomes the Word Setter and picks a secret 5-letter word from the dictionary.
- **Real-Time Guessing**: All other players race simultaneously with private guesses and instant letter-color feedback.
- **Duplicate Letter Precision**: Standard Wordle duplicate-letter algorithm (green exact matches prioritized, then yellow present matches according to remaining unmatched occurrences).
- **Comprehensive Scoring System**:
  - Winner who cracks the word first: **15 points** (10 base + 5 speed bonus)
  - Other guessers: **1 point per green tile** in their best guess
  - Word setter: **0 points** for the round they set the word
- **Interactive UI**:
  - Wordle 5x5 grid with reveal flip animations, pop-in letter typing, and error shakes
  - Virtual on-screen keyboard with color status tags + full physical keyboard support
  - Live Lobby with room codes, one-click copy, and shareable URL auto-joining
  - Round summary showing all players' full guess boards side-by-side
  - Final game celebration podium with gold trophy and ranked leaderboard
- **Built-in Resilience**:
  - Reconnection support via `sessionStorage`
  - In-memory rate limiting on room creation, joining, and guesses
  - Host skip controls if a word setter disconnects or stalls
  - Automatic stale room cleanup

---

## Architecture & Directory Structure

```
c:\Users\admin\multiplayer_wordle\
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GuessGrid.jsx
│   │   │   ├── Keyboard.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── PlayerList.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── WordGrid.jsx
│   │   ├── hooks/
│   │   │   ├── useGame.js
│   │   │   └── useSocket.js
│   │   ├── pages/
│   │   │   ├── GameOverPage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LobbyPage.jsx
│   │   │   └── RoundResultsPage.jsx
│   │   ├── services/
│   │   │   └── socket.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── server/
│   ├── data/
│   │   └── words.txt             # >2200 5-letter English words
│   ├── src/
│   │   ├── game/
│   │   │   ├── scoring.js
│   │   │   └── wordleEngine.js
│   │   ├── rooms/
│   │   │   └── roomManager.js
│   │   ├── socket/
│   │   │   └── handlers.js
│   │   ├── utils/
│   │   │   ├── rateLimiter.js
│   │   │   └── validation.js
│   │   └── index.js
│   ├── test/
│   │   └── gameEngine.test.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── package.json                  # Root runner with concurrently
├── .gitignore
└── README.md
```

---

## Installation & Setup

### 1. Install Dependencies
Run the installation command from the repository root (remember to use `;` instead of `&&` in Windows PowerShell):

```powershell
# From root
npm install ; npm --prefix server install ; npm --prefix client install
```

Or install inside each folder:

```powershell
cd server ; npm install ; cd .. ; cd client ; npm install ; cd ..
```

---

## Running the Application

### Option A: Run Both Frontend and Backend Concurrently
From the root directory:
```powershell
npm run dev
```

### Option B: Run Services Separately
In terminal 1 (Backend Server):
```powershell
cd server ; npm run dev
```
Server starts on `http://localhost:3001`.

In terminal 2 (Frontend Client):
```powershell
cd client ; npm run dev
```
Vite dev server starts on `http://localhost:5173`.

Open your browser to `http://localhost:5173`.

---

## Running Automated Tests

The server uses Node.js's built-in test runner (`node:test` and `node:assert/strict`):

```powershell
cd server ; npm test
```

### Tests Covered
1. **evaluateGuess**: Correct (green), Present (yellow), and Absent (gray) tile evaluations
2. **Duplicate letter handling**: E.g., `speed` vs `spade`, `erase` vs `spade`
3. **wordExists**: Case-insensitive dictionary lookups and invalid word handling
4. **Dictionary Validation**: Verifies >2200 unique 5-letter words including all prompt-specified keywords
5. **calculateRoundScores**: Winner 15-point scoring, non-winner green tile scoring, setter 0-point rule
6. **Room creation**: Initial state, host assignment, 6-character unique uppercase code generation
7. **Room joining**: Joining active lobby, reconnection preserving socket state, non-existent room handling
8. **Room capacity**: Rejection when room reaches max 8 players
9. **Code validation**: Rejection of malformed room codes
10. **Word setter scoring exclusion**: Setter earns 0 points regardless of best guesses
11. **Round rotation**: Multi-round rotation and game completion lifecycle
12. **Input validation**: Name sanitization, length boundaries, alphanumeric checks

---

## Game Rules & Scoring

- **Attempts**: Each guesser gets up to 5 attempts per round.
- **Round End**:
  - Immediate win if any guesser solves the word.
  - Or when all guessers exhaust their 5 attempts.
- **Points Awarded**:
  - **Round Winner**: 15 points (10 base + 5 bonus).
  - **Non-winners**: 1 point per green tile in their single best guess (e.g. best guess had 3 green letters = 3 points).
  - **Word Setter**: 0 points for setting the word.
- **Rounds**: The game plays through as many rounds as there are players, giving everyone one turn as Word Setter.
