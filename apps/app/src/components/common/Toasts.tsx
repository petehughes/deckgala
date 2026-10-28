import React from 'react';
import { useApp } from '../../context/AppContext';

export function Toasts() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => dismissToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

