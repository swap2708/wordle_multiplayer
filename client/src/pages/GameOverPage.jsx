import React from 'react';
import { Leaderboard } from '../components/Leaderboard.jsx';

export function GameOverPage({
  gameOverData,
  playerId,
  onPlayAgain,
  onLeaveRoom
}) {
  const winner = gameOverData ? gameOverData.winner : null;
  const leaderboard = gameOverData ? gameOverData.leaderboard : [];
  const isMeWinner = winner && winner.id === playerId;

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      {/* Trophy and Winner Celebration */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '2.5rem 1.5rem' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '0.75rem', animation: 'bounce 1s infinite' }}>
          🏆
        </div>

        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          GAME OVER!
        </h1>

        {winner ? (
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Champion of the Match
            </p>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '800',
              color: '#fbbf24',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <span>{winner.name}</span>
              {isMeWinner && <span className="badge-you" style={{ fontSize: '0.9rem' }}>You Won!</span>}
            </div>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
              Total Score: {winner.score} points
            </p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>It was a hard fought battle!</p>
        )}
      </div>

      {/* Final Ranked Leaderboard */}
      <div style={{ width: '100%', marginBottom: '1.5rem' }}>
        <Leaderboard
          leaderboard={leaderboard}
          currentPlayerId={playerId}
        />
      </div>

      {/* Action Buttons */}
      <div className="card" style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onPlayAgain}
        >
          🔄 Play Again (Return to Lobby)
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={onLeaveRoom}
        >
          🏠 New Game (Home)
        </button>
      </div>
    </div>
  );
}
