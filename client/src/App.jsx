import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { useSocket } from './hooks/useSocket.js';
import { useGame } from './hooks/useGame.js';
import { Toast } from './components/Toast.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { LobbyPage } from './pages/LobbyPage.jsx';
import { GamePage } from './pages/GamePage.jsx';
import { RoundResultsPage } from './pages/RoundResultsPage.jsx';
import { GameOverPage } from './pages/GameOverPage.jsx';

function RoomRoute({ gameProps }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (roomCode && gameProps.gameState === 'home') {
      const storedName = sessionStorage.getItem('wordle_player_name');
      if (storedName) {
        gameProps.joinRoom(roomCode, storedName);
      }
    }
  }, [roomCode, gameProps.gameState]);

  return <GameController gameProps={gameProps} defaultRoomCode={roomCode} />;
}

function GameController({ gameProps, defaultRoomCode = '' }) {
  const {
    gameState,
    room,
    playerId,
    isHost,
    isWordSetter,
    wordSetter,
    isWordSet,
    currentGuess,
    wordSetterWord,
    setWordSetterWord,
    guesses,
    usedLetters,
    isShaking,
    roundResults,
    gameOverData,
    createRoom,
    joinRoom,
    startGame,
    submitWord,
    submitGuess,
    requestNextRound,
    requestSkipRound,
    handleKey,
    playAgain,
    leaveRoom,
    showToast
  } = gameProps;

  switch (gameState) {
    case 'lobby':
      return (
        <LobbyPage
          room={room}
          playerId={playerId}
          isHost={isHost}
          onStartGame={startGame}
          onLeaveRoom={leaveRoom}
          showToast={showToast}
        />
      );

    case 'game':
      return (
        <GamePage
          room={room}
          playerId={playerId}
          isHost={isHost}
          isWordSetter={isWordSetter}
          wordSetter={wordSetter}
          isWordSet={isWordSet}
          currentGuess={currentGuess}
          wordSetterWord={wordSetterWord}
          setWordSetterWord={setWordSetterWord}
          guesses={guesses}
          usedLetters={usedLetters}
          isShaking={isShaking}
          onSubmitWord={submitWord}
          onSubmitGuess={submitGuess}
          onKey={handleKey}
          onRequestSkipRound={requestSkipRound}
        />
      );

    case 'round_results':
      return (
        <RoundResultsPage
          room={room}
          playerId={playerId}
          isHost={isHost}
          roundResults={roundResults}
          onRequestNextRound={requestNextRound}
        />
      );

    case 'game_over':
      return (
        <GameOverPage
          gameOverData={gameOverData}
          playerId={playerId}
          onPlayAgain={playAgain}
          onLeaveRoom={leaveRoom}
        />
      );

    case 'home':
    default:
      return (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          defaultRoomCode={defaultRoomCode}
        />
      );
  }
}

export function App() {
  const { connected } = useSocket();
  const game = useGame();

  return (
    <BrowserRouter>
      {/* Global Header */}
      <header className="app-header">
        <a href="/" className="app-title-logo" onClick={(e) => {
          if (game.gameState !== 'home') {
            e.preventDefault();
            if (confirm('Leave current room and return to home?')) {
              game.leaveRoom();
            }
          }
        }}>
          <span className="logo-letter">W</span>
          <span style={{ marginLeft: '4px' }}>WORDLE MULTIPLAYER</span>
        </a>

        <div className="status-badge">
          <span className={`status-dot ${connected ? 'connected' : ''}`} />
          <span>{connected ? 'Live' : 'Connecting...'}</span>
        </div>
      </header>

      {/* Floating Toast Notification */}
      <Toast toast={game.toast} onClose={game.closeToast} />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<GameController gameProps={game} />} />
        <Route path="/room/:roomCode" element={<RoomRoute gameProps={game} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
