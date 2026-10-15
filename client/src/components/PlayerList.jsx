import React from 'react';

/**
 * PlayerList renders the active players and their status.
 * @param {Array<{id: string, name: string, connected: boolean, isHost: boolean}>} players
 * @param {string} hostId
 * @param {string} currentPlayerId
 */
export function PlayerList({ players = [], hostId = '', currentPlayerId = '' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '0.75rem 0' }}>
      {players.map(player => {
        const isHost = player.isHost || player.id === hostId;
        const isMe = player.id === currentPlayerId;
        return (
          <div
            key={player.id}
            className={`player-tag ${isHost ? 'is-host' : ''}`}
          >
            <span
              className={`status-dot ${player.connected ? 'connected' : ''}`}
              title={player.connected ? 'Connected' : 'Disconnected'}
            />
            <span>{player.name}</span>
            {isHost && <span className="badge-host">Host</span>}
            {isMe && <span className="badge-you">You</span>}
          </div>
        );
      })}
    </div>
  );
}
