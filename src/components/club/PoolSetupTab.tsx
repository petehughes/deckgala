import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { PoolModal } from '../setup/PoolModal';
import type { SwimmingPool } from '../../types';

export function PoolSetupTab() {
  const { club, config, selectPool, deletePool } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null);

  const pools = club.pools || [];

  const handleCreate = () => {
    setEditingPoolId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingPoolId(id);
    setIsModalOpen(true);
  };

  const handleDelete = (pool: SwimmingPool) => {
    if (confirm(`Are you sure you want to delete "${pool.name}"?`)) {
      deletePool(pool.id);
    }
  };

  return (
    <div className="pool-setup-tab-container">
      <div className="pool-tab-header">
        <div className="header-info">
          <h3>Club Swimming Pools & Courses ({pools.length})</h3>
          <p className="header-desc">
            Define swimming facilities by lane count and course length (25m, 50m, 25y) for automatic session lane distribution.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleCreate}>
          <Icon name="plus" size={16} />
          <span>+ Add Swimming Pool</span>
        </button>
      </div>

      <div className="pool-cards-grid">
        {pools.map(pool => {
          const isActive = config.selectedPoolId === pool.id;

          return (
            <div
              key={pool.id}
              className={`pool-facility-card ${isActive ? 'active-facility' : ''}`}
            >
              <div className="facility-top-row">
                <div className="facility-icon-wrap">
                  <Icon name="pool" size={24} />
                </div>
                <div className="facility-title-block">
                  <div className="facility-name-row">
                    <h4 className="facility-name">{pool.name}</h4>
                    {isActive && <span className="active-session-badge">Active in Session</span>}
                  </div>
                  <div className="facility-badges">
                    <span className="spec-badge lanes">🏊 {pool.laneCount} Lanes</span>
                    <span className="spec-badge course">
                      📏{' '}
                      {pool.length === '25m'
                        ? '25m Short Course'
                        : pool.length === '50m'
                        ? '50m Long Course'
                        : '25y Yards'}
                    </span>
                  </div>
                </div>

                <div className="facility-actions">
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    title={`Edit ${pool.name}`}
                    aria-label={`Edit ${pool.name}`}
                    onClick={() => handleEdit(pool.id)}
                  >
                    <Icon name="edit" size={16} />
                  </button>
                  {pools.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon-subtle danger"
                      title={`Delete ${pool.name}`}
                      aria-label={`Delete ${pool.name}`}
                      onClick={() => handleDelete(pool)}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              </div>

              {pool.notes && (
                <p className="facility-notes">
                  {pool.notes}
                </p>
              )}

              <div className="facility-footer">
                {!isActive ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-cyan"
                    onClick={() => selectPool(pool.id)}
                  >
                    <Icon name="check" size={14} />
                    <span>Select for Live Session Deck</span>
                  </button>
                ) : (
                  <span className="current-active-tag">
                    <Icon name="check" size={14} />
                    <span>Currently Active on Pool Deck</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <PoolModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPoolId(null);
        }}
        initialEditingPoolId={editingPoolId}
      />
    </div>
  );
}

