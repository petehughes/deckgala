import React, { useState, useEffect, useCallback } from 'react';
import { useApp, useStopwatchState } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { playBeep, triggerHapticFeedback } from '../../lib/audio';
import type { ViewName } from '../../types';

interface PieMenuItem {
  id: ViewName;
  label: string;
  shortLabel: string;
  icon: string;
  angleDeg: number;
  accentColor: string;
}

const PIE_ITEMS: PieMenuItem[] = [
  {
    id: 'deck',
    label: 'Pool Deck',
    shortLabel: 'Deck',
    icon: 'stopwatch',
    angleDeg: 270, // 12 o'clock (top)
    accentColor: '#00E5FF' // Electric Cyan
  },
  {
    id: 'results',
    label: 'Results',
    shortLabel: 'Results',
    icon: 'results',
    angleDeg: 342, // ~2 o'clock
    accentColor: '#FF5A36' // Start Horn Coral
  },
  {
    id: 'attendance',
    label: 'Attendance',
    shortLabel: 'Attendance',
    icon: 'attendance',
    angleDeg: 54, // ~4 o'clock
    accentColor: '#00E676' // Pace Green
  },
  {
    id: 'session',
    label: 'Session',
    shortLabel: 'Session',
    icon: 'session',
    angleDeg: 126, // ~8 o'clock
    accentColor: '#FFB300' // Caution Amber
  },
  {
    id: 'swimmers',
    label: 'Swimmers',
    shortLabel: 'Swimmers',
    icon: 'users',
    angleDeg: 198, // ~10 o'clock
    accentColor: '#29D8FF' // Electric Sky
  }
];

export interface PieMenuProps {
  isOpen?: boolean;
  onToggle?: (nextOpen: boolean) => void;
}

export function PieMenu({ isOpen: controlledOpen, onToggle }: PieMenuProps = {}) {
  const { currentView, setCurrentView, results, club, config } = useApp();
  const { stopwatch } = useStopwatchState();
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = typeof controlledOpen === 'boolean';
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (isControlled && onToggle) {
        onToggle(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, onToggle]
  );

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  const handleSelectScreen = (viewId: ViewName) => {
    playBeep('pip');
    triggerHapticFeedback();
    setCurrentView(viewId);
    setOpen(false);
  };

  const handleToggleFab = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBeep('pip');
    triggerHapticFeedback();
    setOpen(!isOpen);
  };

  const radius = 135; // radial distance from center in px

  const getItemBadge = (id: ViewName) => {
    switch (id) {
      case 'attendance': {
        const count = (config.presentSwimmerIds || []).length;
        return count > 0 ? count : undefined;
      }
      case 'swimmers': {
        const count = club.groups.reduce((acc, g) => acc + g.swimmers.length, 0);
        return count > 0 ? count : undefined;
      }
      case 'results': {
        return results.length > 0 ? results.length : undefined;
      }
      case 'deck': {
        return stopwatch.isRunning ? 'LIVE' : undefined;
      }
      default:
        return undefined;
    }
  };

  return (
    <>
      {/* Floating Trigger Button (FAB) */}
      <button
        type="button"
        className={`pie-menu-fab ${isOpen ? 'active' : ''}`}
        onClick={handleToggleFab}
        title={isOpen ? 'Close Screen Switcher' : 'Quick Screen Switcher (Pie Menu)'}
        aria-label="Toggle screen navigation pie menu"
        aria-expanded={isOpen}
      >
        <span className="pie-fab-ripple" />
        <Icon name={isOpen ? 'close' : 'pie'} size={24} />
        <span className="pie-fab-label">{isOpen ? 'CLOSE' : 'SCREENS'}</span>
      </button>

      {/* Radial Pie Menu Overlay */}
      {isOpen && (
        <div
          className="pie-menu-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Screen Navigation Pie Menu"
        >
          <div
            className="pie-menu-container"
            onClick={e => e.stopPropagation()}
            style={{ width: radius * 2 + 160, height: radius * 2 + 160 }}
          >
            {/* SVG Olympic Chronometer Guide Ring & Sector Ticks */}
            <svg
              className="pie-menu-track-svg"
              viewBox="0 0 380 380"
              aria-hidden="true"
            >
              <circle
                cx="190"
                cy="190"
                r={radius}
                className="pie-track-circle"
              />
              <circle
                cx="190"
                cy="190"
                r={radius + 36}
                className="pie-outer-bezel"
              />
              <circle
                cx="190"
                cy="190"
                r="44"
                className="pie-inner-hub-ring"
              />
              {/* Radial spoke dividers */}
              {PIE_ITEMS.map((item, idx) => {
                const spokeRad = ((item.angleDeg - 36) * Math.PI) / 180;
                const x1 = 190 + 44 * Math.cos(spokeRad);
                const y1 = 190 + 44 * Math.sin(spokeRad);
                const x2 = 190 + (radius + 36) * Math.cos(spokeRad);
                const y2 = 190 + (radius + 36) * Math.sin(spokeRad);
                return (
                  <line
                    key={`spoke-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    className="pie-spoke-line"
                  />
                );
              })}
            </svg>

            {/* Central Hub Button */}
            <button
              type="button"
              className="pie-center-hub"
              onClick={() => setOpen(false)}
              title="Close menu"
              aria-label="Close pie menu"
            >
              <div className="pie-hub-icon">
                <Icon name="close" size={20} />
              </div>
              <span className="pie-hub-title">CLOSE</span>
            </button>

            {/* 5 Radial Pie Slice Buttons */}
            {PIE_ITEMS.map((item, idx) => {
              const rad = (item.angleDeg * Math.PI) / 180;
              const x = Math.round(radius * Math.cos(rad));
              const y = Math.round(radius * Math.sin(rad));
              const isActive = currentView === item.id;
              const badge = getItemBadge(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pie-slice-btn ${isActive ? 'active' : ''}`}
                  style={
                    {
                      '--slice-x': `${x}px`,
                      '--slice-y': `${y}px`,
                      '--slice-color': item.accentColor,
                      animationDelay: `${idx * 40}ms`
                    } as React.CSSProperties
                  }
                  onClick={() => handleSelectScreen(item.id)}
                  title={`Switch to ${item.label}`}
                >
                  <div className="pie-slice-icon-wrap">
                    <Icon name={item.icon} size={22} />
                  </div>
                  <span className="pie-slice-label">{item.shortLabel}</span>
                  {isActive && <span className="pie-active-indicator" />}
                  {badge !== undefined && (
                    <span
                      className={`pie-slice-badge ${
                        badge === 'LIVE' ? 'live-badge' : ''
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pie-menu-hint" aria-hidden="true">
            <span>Tap any screen to switch · ESC or center to close</span>
          </div>
        </div>
      )}
    </>
  );
}

