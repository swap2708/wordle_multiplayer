import React, { useState, useEffect } from 'react';

export function HomePage({ onCreateRoom, onJoinRoom, defaultRoomCode = '' }) {
  const [name, setName] = useState(() => sessionStorage.getItem('wordle_player_name') || '');
  const [code, setCode] = useState(defaultRoomCode);

  useEffect(() => {
    if (defaultRoomCode) {
      setCode(defaultRoomCode.toUpperCase());
    }
  }, [defaultRoomCode]);

  const handleCreate = (e) => {
    e.preventDefault();
    onCreateRoom(name);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    onJoinRoom(code, name);
  };

  return (
    <div className="page-container" style={{ maxWidth: '540px' }}>
      {/* Title with Wordle style tiles */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
          {['W', 'O', 'R', 'D', 'L', 'E'].map((letter, i) => (
            <div
              key={i}
              className="tile correct"
              style={{
                width: '44px',
                height: '44px',
                fontSize: '22px',
                animationDelay: `${i * 100}ms`
              }}
            >
              {letter}
            </div>
          ))}
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          MULTIPLAYER
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Take turns picking the word, race your friends in real-time!
        </p>
      </div>

      {/* Main card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="input-group">
          <label className="input-label" htmlFor="player-name">Your Display Name</label>
          <input
            id="player-name"
            type="text"
            className="input-field"
            placeholder="e.g. WordMaster"
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', marginBottom: '1.25rem' }}
          onClick={handleCreate}
        >
          <span>✨</span> Create New Room
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '1rem 0',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span>or join with code</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="room-code">Room Code (6 characters)</label>
          <input
            id="room-code"
            type="text"
            className="input-field uppercase"
            placeholder="ABC123"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>

        <button
          type="button"
          className="btn btn-accent btn-lg"
          style={{ width: '100%' }}
          onClick={handleJoin}
        >
          <span>🚀</span> Join Room
        </button>
      </div>

      {/* How to play card */}
      <div className="card" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📖</span> How Multiplayer Wordle Works
        </h3>
        <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Players take turns rotating as the <strong>Word Setter</strong> each round.</li>
          <li>The Word Setter secretly picks a 5-letter English word.</li>
          <li>All other players race to guess the word in 5 attempts or less!</li>
          <li><strong>Private Guesses:</strong> No one sees your guesses during the round.</li>
          <li><strong>Scoring:</strong> 15 points to the first player to solve it. Other players earn 1 point per green tile in their best guess!</li>
        </ul>
      </div>
    </div>
  );
}
