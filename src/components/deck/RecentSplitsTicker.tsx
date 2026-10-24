import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatMs } from '../../lib/format';

export function RecentSplitsTicker() {
  const { results } = useApp();
  const recent = results.slice(0, 8);

  return (
    <div className="recent-splits-bar">
      <span className="ticker-label">LAST SPLITS</span>
      <div className="ticker-items">
        {recent.length === 0 ? (
          <span className="ticker-empty">
            No splits recorded yet — tap a swimmer or lane stop button as they touch the wall.
          </span>
        ) : (
          recent.map(r => (
            <div key={r.id} className="ticker-chip">
              <span className="ticker-chip-lane">L{r.lane}</span>
              <span className="ticker-chip-name">{r.swimmer}</span>
              <span className="ticker-chip-time">{formatMs(r.netTimeMs)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

