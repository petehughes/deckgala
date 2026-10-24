import React from 'react';
import { formatMs } from '../../lib/format';
import { PaceBadge } from '../common/PaceBadge';
import type { SwimResult } from '../../types';

export interface ResultsTableProps {
  results: SwimResult[];
  onDeleteResult: (id: string) => void;
}

export function ResultsTable({ results, onDeleteResult }: ResultsTableProps) {
  return (
    <div className="results-table-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Lane</th>
            <th>Swimmer</th>
            <th>Wave</th>
            <th>Rep</th>
            <th>Net Split Time</th>
            <th>vs Target</th>
            <th>Wall Finish</th>
            <th>Session / Set</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {results.map((r, index) => (
            <tr key={r.id}>
              <td className="td-wall">{results.length - index}</td>
              <td>
                <span className="td-lane-pill">Lane {r.lane}</span>
              </td>
              <td className="td-swimmer">{r.swimmer}</td>
              <td>
                <span className="td-wave-pill">W{r.wave}</span>
              </td>
              <td>#{r.rep}</td>
              <td className="td-net-time">{formatMs(r.netTimeMs)}</td>
              <td>
                <PaceBadge netTimeMs={r.netTimeMs} targetTimeSec={r.targetTimeSec} />
              </td>
              <td className="td-wall">{formatMs(r.finishWallMs)}</td>
              <td className="td-wall">
                <div style={{ fontWeight: 600 }}>{r.sessionName || 'Session'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {r.setName} {r.sessionDate ? `· ${r.sessionDate}` : ''}
                </div>
              </td>
              <td>
                <button
                  type="button"
                  className="btn-delete-row"
                  title="Delete split"
                  onClick={() => onDeleteResult(r.id)}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⏱️</div>
          <h3>No Splits Recorded Yet</h3>
          <p>
            Head to the <strong>Pool Deck</strong> tab, start the master clock, and tap each swimmer as they finish their rep.
          </p>
        </div>
      )}
    </div>
  );
}

