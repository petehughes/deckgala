import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';

export interface PoolSelectorCardProps {
  onManagePools?: () => void;
}

export function PoolSelectorCard({ onManagePools }: PoolSelectorCardProps = {}) {
  const { club, config, selectPool, openPoolModal } = useApp();

  const handleOpen = onManagePools || openPoolModal;
  const pools = club.pools || [];
  const activePool = pools.find(p => p.id === config.selectedPoolId) || pools[0];

  return (
    <div className="config-card pool-selector-card">
      <div className="config-card-header">
        <div className="header-left">
          <span className="config-tag">FACILITY</span>
          <h2>Swimming Pool</h2>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-cyan manage-pools-btn"
          onClick={handleOpen}
          title="Add or edit swimming pools"
        >
          <Icon name="pool" size={16} />
          <span>Manage Pools</span>
        </button>
      </div>

      <div className="pool-selector-body">
        <div className="form-field">
          <label htmlFor="sessionPoolSelect">Session Pool</label>
          <div className="pool-select-wrapper">
            <select
              id="sessionPoolSelect"
              className="pool-select-dropdown"
              value={activePool ? activePool.id : ''}
              onChange={e => selectPool(e.target.value)}
              aria-label="Select Swimming Pool"
            >
              {pools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.laneCount} Lanes · {p.length})
                </option>
              ))}
            </select>
            <div className="pool-select-arrow" aria-hidden="true">
              ▼
            </div>
          </div>
        </div>

        {activePool && (
          <div className="active-pool-display">
            <div className="active-pool-info">
              <div className="active-pool-title-row">
                <span className="active-pool-icon">
                  <Icon name="pool" size={22} />
                </span>
                <span className="active-pool-title">{activePool.name}</span>
              </div>
              <div className="active-pool-meta">
                <span className="pool-pill lanes">
                  <Icon name="users" size={14} />
                  <span>{activePool.laneCount} Lanes</span>
                </span>
                <span className="pool-pill course">
                  <Icon name="clock" size={14} />
                  <span>
                    {activePool.length === '25m'
                      ? '25m (Short Course)'
                      : activePool.length === '50m'
                      ? '50m (Long Course)'
                      : '25y (Yards)'}
                  </span>
                </span>
                {activePool.notes && (
                  <span className="active-pool-notes">{activePool.notes}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pool-selector-tip">
          <Icon name="check" size={14} />
          <span>
            Selecting a pool configures the session with its {activePool ? activePool.laneCount : 6} lanes and {activePool ? activePool.length : '25m'} length.
          </span>
        </div>
      </div>
    </div>
  );
}

