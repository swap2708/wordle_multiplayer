import React from 'react';
import { WordGrid } from '../components/WordGrid.jsx';
import { Keyboard } from '../components/Keyboard.jsx';
import { PlayerList } from '../components/PlayerList.jsx';

export function GamePage({
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
  onSubmitWord,
  onSubmitGuess,
  onKey,
  onRequestSkipRound
}) {
  const currentRound = room ? room.currentRound : 1;
  const totalRounds = room ? room.totalRounds : 1;
  const setterName = wordSetter ? wordSetter.name : 'Unknown';
  const attemptsCount = guesses.length;
  const solved = guesses.some(g => g.feedback && g.feedback.every(f => f.status === 'correct'));

  // ----------------------------------------------------
  // WORD SETTER VIEW
  // ----------------------------------------------------
  if (isWordSetter) {
    return (
      <div className="page-container" style={{ maxWidth: '600px' }}>
        {/* Round Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          marginBottom: '1rem',
          padding: '0 0.5rem'
        }}>
          <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>
            ROUND {currentRound} OF {totalRounds}
          </span>
          <span className="badge-host" style={{ background: 'var(--accent)', color: '#fff' }}>
            👑 Word Setter
          </span>
        </div>

        {!isWordSet ? (
          <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              🎯 You are the Word Setter!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Choose a tricky 5-letter English word for everyone else to guess.
            </p>

            {/* Word preview tiles */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.5rem' }}>
              {Array.from({ length: 5 }).map((_, i) => {
                const char = (wordSetterWord[i] || '').toUpperCase();
                return (
                  <div
                    key={i}
                    className={`tile ${char ? 'filled' : ''}`}
                    style={{ width: '56px', height: '56px', fontSize: '26px' }}
                  >
                    {char}
                  </div>
                );
              })}
            </div>

            {/* Input field */}
            <div className="input-group" style={{ maxWidth: '320px', margin: '0 auto 1.25rem' }}>
              <input
                type="text"
                className="input-field uppercase"
                placeholder="TYPE WORD"
                maxLength={5}
                value={wordSetterWord}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 5);
                  setWordSetterWord(cleaned.toUpperCase());
                }}
                autoFocus
              />
            </div>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', maxWidth: '320px' }}
              disabled={wordSetterWord.length !== 5}
              onClick={() => onSubmitWord(wordSetterWord)}
            >
              Set Secret Word
            </button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Word Locked In!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Waiting for players to finish guessing...
            </p>
            <div style={{
              display: 'inline-block',
              background: 'var(--surface-hover)',
              padding: '0.5rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontWeight: '700',
              letterSpacing: '0.15em',
              color: 'var(--color-correct)'
            }}>
              YOUR WORD: {wordSetterWord.toUpperCase()}
            </div>
          </div>
        )}

        {/* Players guessing in this round */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Guessing Players
          </h3>
          <PlayerList
            players={(room ? room.players : []).filter(p => p.id !== playerId)}
            hostId={room ? room.hostId : ''}
            currentPlayerId={playerId}
          />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GUESSER VIEW
  // ----------------------------------------------------
  return (
    <div className="page-container" style={{ maxWidth: '680px' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '0.75rem',
        padding: '0 0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: '800', fontSize: '1.1rem' }}>
            ROUND {currentRound}/{totalRounds}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Setter: <strong style={{ color: 'var(--text-main)' }}>{setterName}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            background: 'var(--surface-color)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            Attempts: {attemptsCount}/5
          </span>
          {isHost && !isWordSet && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRequestSkipRound}
              title="Skip this round if setter is unresponsive"
            >
              Skip Round
            </button>
          )}
        </div>
      </div>

      {!isWordSet ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 2s infinite' }}>⏳</div>
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>
            Waiting for {setterName} to pick a word...
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sharpen your vocabulary, the guessing round will begin automatically once set!
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Privacy badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(83, 141, 78, 0.15)',
            border: '1px solid rgba(83, 141, 78, 0.4)',
            color: '#86efac',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            <span>🛡️</span> Your guesses are private until the round ends!
          </div>

          {/* 5x5 Grid */}
          <WordGrid
            guesses={guesses}
            currentGuess={currentGuess}
            maxGuesses={5}
            isShaking={isShaking}
          />

          {/* Solved or Finished banner */}
          {solved && (
            <div style={{
              margin: '0.5rem 0',
              color: 'var(--color-correct)',
              fontWeight: '700',
              fontSize: '1rem'
            }}>
              🎉 You cracked the code! Waiting for others to finish...
            </div>
          )}

          {!solved && attemptsCount >= 5 && (
            <div style={{
              margin: '0.5rem 0',
              color: 'var(--text-muted)',
              fontWeight: '700',
              fontSize: '1rem'
            }}>
              Round finished! Waiting for other players...
            </div>
          )}

          {/* Keyboard */}
          <Keyboard
            onKey={onKey}
            usedLetters={usedLetters}
          />
        </div>
      )}

      {/* Mini Leaderboard footer */}
      {room && room.leaderboard && room.leaderboard.length > 0 && (
        <div style={{
          width: '100%',
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {room.leaderboard.slice(0, 4).map((p, idx) => (
            <span
              key={p.id}
              style={{
                fontSize: '0.85rem',
                color: p.id === playerId ? 'var(--color-correct)' : 'var(--text-muted)',
                fontWeight: p.id === playerId ? '700' : '500'
              }}
            >
              {idx === 0 ? '🥇' : ''} {p.name}: {p.score} pts
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
