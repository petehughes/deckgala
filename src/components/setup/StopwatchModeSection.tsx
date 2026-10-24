import React from 'react';
import { useApp } from '../../context/AppContext';
import type { StopwatchMode } from '../../types';

const MODES: { id: StopwatchMode; badge: string; title: string; desc: string }[] = [
  {
    id: 'interval',
    badge: 'AUTO',
    title: 'Interval Waves (5s / 10s Send-Off)',
    desc: 'Master clock starts Wave 1 at 0:00 and automatically releases subsequent swimmers in each lane based on that lane\'s send-off interval (e.g. +5s, +10s) with audio countdown beeps.'
  },
  {
    id: 'manual',
    badge: 'MANUAL',
    title: 'Coach Manual Push Release',
    desc: 'You manually tap "Release Next Wave" per lane (or all lanes) whenever a swimmer pushes off the wall. Ideal for flexible spacing or relay exchanges.'
  },
  {
    id: 'mass',
    badge: 'MASS',
    title: 'Mass / Simultaneous Start',
    desc: 'All assigned swimmers across all lanes start on the initial gun at 0:00. Tap each swimmer as they finish to record their split.'
  }
];

export function StopwatchModeSection() {
  const { config, updateConfig } = useApp();

  return (
    <div className="mode-section">
      <div className="section-title-row">
        <div>
          <h2 className="section-heading">Stopwatch &amp; Send-Off Mode</h2>
          <p className="section-sub">Choose how swimmers are dispatched in each lane</p>
        </div>
      </div>

      <div className="mode-cards" role="radiogroup" aria-label="Stopwatch Mode">
        {MODES.map(m => {
          const isActive = config.stopwatchMode === m.id;
          return (
            <label
              key={m.id}
              className={`mode-card ${isActive ? 'active' : ''}`}
              onClick={() => updateConfig({ stopwatchMode: m.id })}
            >
              <input
                type="radio"
                name="stopwatchMode"
                value={m.id}
                checked={isActive}
                onChange={() => updateConfig({ stopwatchMode: m.id })}
              />
              <div className="mode-card-top">
                <span className="mode-badge">{m.badge}</span>
                <span className="mode-check" />
              </div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </label>
          );
        })}
      </div>
    </div>
  );
}

