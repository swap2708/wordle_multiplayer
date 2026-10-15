import React, { useState } from 'react';
import { PlayerList } from '../components/PlayerList.jsx';

export function LobbyPage({
  room,
  playerId,
  isHost,
  onStartGame,
  onLeaveRoom,
  showToast
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!room) return null;

  const roomCode = room.code;
  const shareableUrl = `${window.location.origin}/room/${roomCode}`;
  const playerCount = room.players ? room.players.length : 0;
  const canStart = isHost && playerCount >= 2;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    showToast('Room code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    showToast('Shareable link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '640px' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Room Code
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          margin: '0.75rem 0'
        }}>
          <span style={{
            fontSize: '2.5rem',
            fontFamily: 'monospace',
            fontWeight: '900',
            letterSpacing: '0.2em',
            color: 'var(--text-main)',
            background: 'var(--surface-hover)',
            padding: '4px 16px',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border-color)'
          }}>
            {roomCode}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={copyRoomCode}
            title="Copy Code"
          >
            {copiedCode ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={copyShareLink}
          >
            {copiedLink ? '✓ Link Copied' : '🔗 Copy Invite Link'}
          </button>
        </div>
      </div>

      {/* Players List Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <span>👥</span> Players ({playerCount} / {room.maxPlayers || 8})
          </h2>
          <span style={{ fontSize: '0.85rem', color: playerCount >= 2 ? '#22c55e' : '#eab308' }}>
            {playerCount >= 2 ? 'Ready to play' : 'Need at least 2 players'}
          </span>
        </div>

        <PlayerList
          players={room.players || []}
          hostId={room.hostId}
          currentPlayerId={playerId}
        />
      </div>

      {/* Actions Card */}
      <div className="card" style={{ textAlign: 'center' }}>
        {isHost ? (
          <div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '0.75rem' }}
              disabled={!canStart}
              onClick={onStartGame}
            >
              {playerCount < 2 ? 'Waiting for more players...' : '🎮 Start Game'}
            </button>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              As host, you can start the game once at least 2 players have joined.
            </p>
          </div>
        ) : (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              ⏳ Waiting for host to start the game...
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Get ready! The game will begin as soon as the host clicks Start.
            </p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLeaveRoom}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
