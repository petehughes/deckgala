import React from 'react';
import { useApp } from '../../context/AppContext';
import { SET_PRESETS, POOL_COURSES } from '../../lib/constants';
import { DraftNumberInput } from '../common/DraftNumberInput';
import { formatSetItem } from '../../lib/weeks';
import type { PoolCourse } from '../../types';

export function SetDetailsCard() {
  const { config, updateConfig } = useApp();

  const weeklySets = config.activeWeeklyPlan?.setList || [];

  return (
    <div className="config-card">
      <div className="config-card-header">
        <span className="config-tag">WORKOUT</span>
        <h2>Training Set Details</h2>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="setNameInput">Set Name / Distance</label>
          <input
            type="text"
            id="setNameInput"
            placeholder="e.g. 10 x 100m Free @ 1:30"
            value={config.setName}
            onChange={e => updateConfig({ setName: e.target.value })}
          />

          {/* Active Weekly Plan Sets */}
          {weeklySets.length > 0 && (
            <div className="weekly-set-presets-group">
              <span className="weekly-presets-tag">
                Week {config.activeWeeklyPlan?.weekNumber} Scheduled Workout Sets:
              </span>
              <div className="preset-chips">
                {weeklySets.map((setItem, idx) => {
                  const label = formatSetItem(setItem);
                  const isSelected = config.setName === label;
                  return (
                    <button
                      key={setItem.id || idx}
                      type="button"
                      className={`preset-chip weekly-set-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => updateConfig({ setName: label })}
                      title="Load this weekly scheduled set"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="preset-chips">
            {SET_PRESETS.slice(0, 4).map(preset => (
              <button
                key={preset}
                type="button"
                className="preset-chip"
                onClick={() => updateConfig({ setName: preset })}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <div className="form-field-group">
          <div className="form-field">
            <label htmlFor="targetTimeInput">Target Time (sec)</label>
            <DraftNumberInput
              id="targetTimeInput"
              min={0}
              max={3600}
              step={1}
              fallback={0}
              value={config.targetTime}
              onCommit={val => updateConfig({ targetTime: val })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="poolCourseSelect">Pool Course</label>
            <select
              id="poolCourseSelect"
              value={config.poolCourse}
              onChange={e => updateConfig({ poolCourse: e.target.value as PoolCourse })}
            >
              {POOL_COURSES.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
