import React from 'react';

/**
 * Floating Toast notification.
 * @param {{message: string, type: 'error' | 'success' | 'info'} | null} toast
 * @param {function(): void} onClose
 */
export function Toast({ toast, onClose }) {
  if (!toast || !toast.message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type || 'info'}`}>
        <span>{toast.message}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginLeft: '8px'
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
