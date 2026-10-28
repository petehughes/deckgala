import React from 'react';
import { getPaceDeltaBadge } from '../../lib/results';

export interface PaceBadgeProps {
  netTimeMs: number;
  targetTimeSec: number;
}

export function PaceBadge({ netTimeMs, targetTimeSec }: PaceBadgeProps) {
  const badge = getPaceDeltaBadge(netTimeMs, targetTimeSec);
  if (!badge) {
    return <span className="pace-badge neutral">—</span>;
  }
  return <span className={`pace-badge ${badge.variant}`}>{badge.label}</span>;
}

