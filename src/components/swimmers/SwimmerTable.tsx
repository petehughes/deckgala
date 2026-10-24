import React from 'react';
import { Icon } from '../common/Icon';
import type { Swimmer, RosterSort } from '../../types';

export interface SwimmerTableProps {
  swimmers: Swimmer[];
  totalInGroup: number;
  sort: RosterSort;
  onToggleSort: (field: RosterSort['field']) => void;
  onEditSwimmer: (swimmer: Swimmer) => void;
  onDeleteSwimmer: (swimmerId: string) => void;
  onAddSwimmer: () => void;
  onBulkAdd: () => void;
}

export function SwimmerTable({
  swimmers,
  totalInGroup,
  sort,
  onToggleSort,
  onEditSwimmer,
  onDeleteSwimmer,
  onAddSwimmer,
  onBulkAdd
}: SwimmerTableProps) {
  const renderSortIndicator = (field: RosterSort['field']) => {
    if (sort.field !== field) return null;
    return <span className="sort-indicator">{sort.dir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="swimmers-table-wrapper">
      <table className="swimmers-table">
        <thead>
          <tr>
            <th className="th-sortable" onClick={() => onToggleSort('name')}>
              Swimmer Name {renderSortIndicator('name')}
            </th>
            <th className="th-sortable" onClick={() => onToggleSort('age')}>
              Age / Gender {renderSortIndicator('age')}
            </th>
            <th>50m PB</th>
            <th>100m PB</th>
            <th>Coach Notes</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {swimmers.map(s => {
            const ageGen =
              [s.age ? `${s.age}y` : '', s.gender || ''].filter(Boolean).join(' · ') || '—';
            return (
              <tr key={s.id}>
                <td className="td-swimmer-name">{s.name}</td>
                <td className="td-swimmer-meta">{ageGen}</td>
                <td className="td-pb">{s.pb50m || '—'}</td>
                <td className="td-pb">{s.pb100m || '—'}</td>
                <td className="td-notes">{s.notes || '—'}</td>
                <td className="td-row-actions">
                  <button
                    type="button"
                    className="btn-row-edit"
                    title="Edit swimmer"
                    onClick={() => onEditSwimmer(s)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-delete-row"
                    title="Remove swimmer"
                    onClick={() => onDeleteSwimmer(s.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {swimmers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏊</div>
          <h3>
            {totalInGroup === 0
              ? 'No Swimmers in This Group Yet'
              : 'No Matching Swimmers'}
          </h3>
          <p>
            {totalInGroup === 0
              ? 'Add swimmers individually, bulk paste a squad list, or import a JSON/CSV roster file.'
              : 'Try clearing your search query.'}
          </p>
          <div className="empty-state-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onAddSwimmer}
            >
              + Add Swimmer
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onBulkAdd}
            >
              Bulk Add Names
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

