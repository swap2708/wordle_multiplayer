import React from 'react';
import { GuessGrid } from '../components/GuessGrid.jsx';
import { Leaderboard } from '../components/Leaderboard.jsx';

export function RoundResultsPage({
  room,
  playerId,
  isHost,
  roundResults,
  onRequestNextRound
}) {
  if (!roundResults) return null;

  const { secretWord, results = [], winnerName, winnerId, leaderboard = [] } = roundResults;
  const currentRound = room ? room.currentRound : 1;
  const totalRounds = room ? room.totalRounds : 1;
  const isLastRound = currentRound >= totalRounds;

  return (
    <div className="page-container" style={{ maxWidth: '780px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Round {currentRound} of {totalRounds} Completed
        </p>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginTop: '4px' }}>
          Round Results
        </h1>
      </div>

      {/* Secret Word Reveal */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
          The Secret Word Was
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1rem' }}>
          {secretWord.toUpperCase().split('').map((letter, idx) => (
            <div
              key={idx}
              className="tile correct"
              style={{
                width: '52px',
                height: '52px',
                fontSize: '24px',
                animation: 'bounce 0.8s ease',
                animationDelay: `${idx * 100}ms`
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        {winnerId ? (
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fbbf24' }}>
            🎉 {winnerName} solved the word and won 15 points!
          </div>
        ) : (
          <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-muted)' }}>
            Nobody managed to crack the word this round!
          </div>
        )}
      </div>

      {/* All Players' Guess Grids */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title">
          <span>🔍</span> Player Guesses & Round Scores
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem'
        }}>
          {results.map((res) => {
            const isMe = res.playerId === playerId;
            const isWinner = res.playerId === winnerId;
            return (
              <div
                key={res.playerId}
                style={{
                  background: 'var(--surface-hover)',
                  border: isWinner ? '2px solid #fbbf24' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{res.playerName}</span>
                  {isMe && <span className="badge-you">You</span>}
                  {isWinner && <span>👑</span>}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {res.isWordSetter ? (
                    <span style={{ color: 'var(--accent)' }}>Word Setter (0 pts)</span>
                  ) : (
                    <span>+{res.pointsEarned} points earned</span>
                  )}
                </div>

                {!res.isWordSetter ? (
                  <GuessGrid
                    guesses={res.guesses || []}
                    maxGuesses={5}
                    mini={false}
                  />
                ) : (
                  <div style={{
                    padding: '1.5rem 0',
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}>
                    Set the secret word
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Updated Leaderboard */}
      <div style={{ marginBottom: '1.5rem', width: '100%' }}>
        <Leaderboard
          leaderboard={leaderboard}
          currentPlayerId={playerId}
        />
      </div>

      {/* Host Controls */}
      <div className="card" style={{ textAlign: 'center' }}>
        {isHost ? (
          <div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={onRequestNextRound}
            >
              {isLastRound ? '🏆 View Final Game Results' : `▶ Start Round ${currentRound + 1}`}
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontWeight: '600' }}>
            ⏳ Waiting for the host to proceed to the next round...
          </div>
        )}
      </div>
    </div>
  );
}
