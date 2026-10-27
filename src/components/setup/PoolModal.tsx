import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { DraftNumberInput } from '../common/DraftNumberInput';
import { POOL_COURSES } from '../../lib/constants';
import type { PoolCourse, SwimmingPool } from '../../types';

export interface PoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditingPoolId?: string | null;
}

const QUICK_LANES = [4, 6, 8, 10];

export function PoolModal({ isOpen, onClose, initialEditingPoolId = null }: PoolModalProps) {
  const { club, config, selectPool, savePool, deletePool } = useApp();

  const [editingPoolId, setEditingPoolId] = useState<string | null>(initialEditingPoolId);
  const [name, setName] = useState('');
  const [laneCount, setLaneCount] = useState<number>(6);
  const [length, setLength] = useState<PoolCourse>('25m');
  const [notes, setNotes] = useState('');

  // Reset form when modal opens or editingPoolId changes
  useEffect(() => {
    if (isOpen) {
      if (initialEditingPoolId) {
        const target = (club.pools || []).find(p => p.id === initialEditingPoolId);
        if (target) {
          setEditingPoolId(target.id);
          setName(target.name);
          setLaneCount(target.laneCount);
          setLength(target.length);
          setNotes(target.notes || '');
          return;
        }
      }
      // Default to new pool state
      setEditingPoolId(null);
      setName('');
      setLaneCount(6);
      setLength('25m');
      setNotes('');
    }
  }, [isOpen, initialEditingPoolId, club.pools]);

  const handleStartEdit = (pool: SwimmingPool) => {
    setEditingPoolId(pool.id);
    setName(pool.name);
    setLaneCount(pool.laneCount);
    setLength(pool.length);
    setNotes(pool.notes || '');
  };

  const handleCancelEdit = () => {
    setEditingPoolId(null);
    setName('');
    setLaneCount(6);
    setLength('25m');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const ok = savePool(
      {
        name: name.trim(),
        laneCount,
        length,
        notes: notes.trim()
      },
      editingPoolId
    );

    if (ok) {
      handleCancelEdit();
    }
  };

  const handleDelete = (pool: SwimmingPool) => {
    if (confirm(`Are you sure you want to delete "${pool.name}"?`)) {
      deletePool(pool.id);
      if (editingPoolId === pool.id) {
        handleCancelEdit();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Swimming Pools"
      size="lg"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="pool-modal-container">
        {/* Pool Configuration Form */}
        <form className="pool-config-form" onSubmit={handleSubmit} aria-label="Swimming Pool Form">
          <div className="pool-form-header">
            <h4>{editingPoolId ? 'Edit Swimming Pool' : 'Add New Swimming Pool'}</h4>
            <span className="pool-form-hint">
              Configure pool name, number of lanes, and length
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="poolNameInput">Pool Facility Name *</label>
            <input
              type="text"
              id="poolNameInput"
              placeholder="e.g. Olympic Competition Pool"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          {/* Lane Selection */}
          <div className="form-field">
            <label>Select Lanes ({laneCount} Lanes)</label>
            <div className="pool-lane-pills" role="radiogroup" aria-label="Pool lane count">
              {QUICK_LANES.map(count => (
                <button
                  key={count}
                  type="button"
                  className={`count-pill ${laneCount === count ? 'active' : ''}`}
                  onClick={() => setLaneCount(count)}
                >
                  {count} Lanes
                </button>
              ))}
              <div className="custom-lane-stepper">
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label="Decrease pool lanes"
                  onClick={() => setLaneCount(prev => Math.max(1, prev - 1))}
                >
                  −
                </button>
                <DraftNumberInput
                  id="poolLaneCountInput"
                  min={1}
                  max={10}
                  fallback={6}
                  value={laneCount}
                  onCommit={val => setLaneCount(Math.min(10, Math.max(1, Math.round(val))))}
                  aria-label="Pool lanes"
                />
                <button
                  type="button"
                  className="stepper-btn"
                  aria-label="Increase pool lanes"
                  onClick={() => setLaneCount(prev => Math.min(10, prev + 1))}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Length Selection */}
          <div className="form-field">
            <label>Select Length (Course)</label>
            <div className="pool-course-pills" role="radiogroup" aria-label="Pool length">
              {POOL_COURSES.map(course => (
                <button
                  key={course.value}
                  type="button"
                  className={`course-pill ${length === course.value ? 'active' : ''}`}
                  onClick={() => setLength(course.value)}
                >
                  <span className="course-val">{course.value}</span>
                  <span className="course-lbl">
                    {course.value === '25m'
                      ? 'Short Course'
                      : course.value === '50m'
                      ? 'Long Course'
                      : 'Yards'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="poolNotesInput">Facility Notes (Optional)</label>
            <input
              type="text"
              id="poolNotesInput"
              placeholder="e.g. Indoor heated, diving blocks, touchpads"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="pool-form-actions">
            {editingPoolId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              <Icon name={editingPoolId ? 'check' : 'plus'} size={18} />
              <span>{editingPoolId ? 'Update Swimming Pool' : 'Add Swimming Pool'}</span>
            </button>
          </div>
        </form>

        {/* Existing Pools List */}
        <div className="pool-list-section">
          <div className="pool-list-header">
            <h4>Club Swimming Pools ({(club.pools || []).length})</h4>
            <span className="pool-list-hint">Select a pool to use in this session</span>
          </div>

          <div className="pool-card-grid">
            {(club.pools || []).map(pool => {
              const isActive = config.selectedPoolId === pool.id;
              const isBeingEdited = editingPoolId === pool.id;

              return (
                <div
                  key={pool.id}
                  className={`pool-item-card ${isActive ? 'active-pool' : ''} ${
                    isBeingEdited ? 'editing-pool' : ''
                  }`}
                >
                  <div className="pool-item-top">
                    <div className="pool-item-info">
                      <div className="pool-name-row">
                        <span className="pool-item-name">{pool.name}</span>
                        {isActive && (
                          <span className="pool-active-badge">Active in Session</span>
                        )}
                      </div>
                      <div className="pool-badge-row">
                        <span className="pool-spec-badge lanes-badge">
                          🏊 {pool.laneCount} Lanes
                        </span>
                        <span className="pool-spec-badge length-badge">
                          📏 {pool.length}
                        </span>
                        {pool.notes && (
                          <span className="pool-notes-snippet">{pool.notes}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pool-item-actions">
                    {!isActive ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-cyan"
                        onClick={() => selectPool(pool.id)}
                      >
                        <Icon name="check" size={14} />
                        <span>Select for Session</span>
                      </button>
                    ) : (
                      <span className="pool-current-indicator">
                        <Icon name="check" size={14} />
                        <span>Selected</span>
                      </span>
                    )}

                    <div className="pool-btn-group">
                      <button
                        type="button"
                        className="btn-icon-subtle"
                        title={`Edit ${pool.name}`}
                        aria-label={`Edit ${pool.name}`}
                        onClick={() => handleStartEdit(pool)}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      {(club.pools || []).length > 1 && (
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

