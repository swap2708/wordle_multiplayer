import React from 'react';

/**
 * Leaderboard displays ranked players and their current scores.
 * @param {Array<{id: string, name: string, score: number}>} leaderboard
 * @param {string} currentPlayerId
 */
export function Leaderboard({ leaderboard = [], currentPlayerId = '' }) {
  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="card">
      <div className="card-title">
        <span>🏆</span>
        <span>Leaderboard</span>
      </div>
      <div className="leaderboard-table">
        {leaderboard.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            No scores recorded yet.
          </p>
        ) : (
          leaderboard.map((player, index) => {
            const isMe = player.id === currentPlayerId;
            return (
              <div
                key={player.id}
                className={`leaderboard-row ${isMe ? 'highlight' : ''}`}
              >
                <div className="leaderboard-rank">{getRankBadge(index)}</div>
                <div className="leaderboard-name">
                  <span>{player.name}</span>
                  {isMe && <span className="badge-you">You</span>}
                </div>
                <div className="leaderboard-score">{player.score} pts</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
