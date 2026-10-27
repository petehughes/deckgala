import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from './Icon';
import type { Coach } from '../../types';

export interface CoachSelectorProps {
  id?: string;
  label?: string;
  multiple?: boolean;
  value: string | string[]; // ID(s) or Name(s)
  onChange: (value: string | string[], selectedCoaches: Coach[]) => void;
  valueKey?: 'id' | 'name';
  allowUnassigned?: boolean;
  unassignedLabel?: string;
  required?: boolean;
  badgeFilter?: (coach: Coach) => string | undefined;
  className?: string;
  allowCustomInput?: boolean;
  placeholder?: string;
}

export function CoachSelector({
  id = 'coach-selector',
  label = 'Select Coach',
  multiple = false,
  value,
  onChange,
  valueKey = 'id',
  allowUnassigned = true,
  unassignedLabel = 'Unassigned / None',
  required = false,
  badgeFilter,
  className = '',
  allowCustomInput = false,
  placeholder = 'Custom coach name...'
}: CoachSelectorProps) {
  const { club } = useApp();
  const coaches = club.coaches || [];

  // Normalize selected values into an array of strings
  const selectedValues: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
    ? multiple && value.includes(',')
      ? value.split(',').map(s => s.trim()).filter(Boolean)
      : [value.trim()]
    : [];

  const isSelected = (coach: Coach): boolean => {
    const key = valueKey === 'name' ? coach.name : coach.id;
    return selectedValues.some(v => v.toLowerCase() === key.toLowerCase());
  };

  const handleToggle = (coach: Coach) => {
    const key = valueKey === 'name' ? coach.name : coach.id;

    if (multiple) {
      let nextValues: string[];
      if (isSelected(coach)) {
        nextValues = selectedValues.filter(v => v.toLowerCase() !== key.toLowerCase());
      } else {
        nextValues = [...selectedValues, key];
      }
      const matchedCoaches = coaches.filter(c =>
        nextValues.some(v => v.toLowerCase() === (valueKey === 'name' ? c.name : c.id).toLowerCase())
      );
      onChange(nextValues, matchedCoaches);
    } else {
      // Single select
      if (isSelected(coach)) {
        if (!required && allowUnassigned) {
          onChange(valueKey === 'name' ? '' : '', []);
        }
      } else {
        onChange(key, [coach]);
      }
    }
  };

  const handleClear = () => {
    onChange(multiple ? [] : '', []);
  };

  const handleSelectAll = () => {
    if (!multiple) return;
    const allKeys = coaches.map(c => (valueKey === 'name' ? c.name : c.id));
    onChange(allKeys, coaches);
  };

  // Find custom entries that do not match any known coach
  const customEntries = selectedValues.filter(
    v => !coaches.some(c => (valueKey === 'name' ? c.name : c.id).toLowerCase() === v.toLowerCase())
  );

  return (
    <div className={`coach-selector-field ${className}`}>
      {/* Label & Header Controls */}
      <div className="coach-selector-header">
        <label htmlFor={id} className="coach-selector-label">
          {label}
          {required && <span className="req-star"> *</span>}
        </label>

        {multiple && (
          <div className="coach-selector-actions">
            <span className="coach-count-pill">
              {selectedValues.length} selected
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Hidden / accessible select for form compatibility and test queries */}
      <select
        id={id}
        name={id}
        className="sr-only"
        multiple={multiple}
        value={multiple ? selectedValues : selectedValues[0] || ''}
        onChange={e => {
          if (multiple) {
            const opts = Array.from(e.target.selectedOptions).map(o => o.value);
            const matched = coaches.filter(c => opts.includes(valueKey === 'name' ? c.name : c.id));
            onChange(opts, matched);
          } else {
            const val = e.target.value;
            const matched = coaches.filter(c => (valueKey === 'name' ? c.name : c.id) === val);
            onChange(val, matched);
          }
        }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {!multiple && allowUnassigned && <option value="">{unassignedLabel}</option>}
        {coaches.map(c => {
          const val = valueKey === 'name' ? c.name : c.id;
          return (
            <option key={c.id} value={val}>
              {c.name} {c.isHeadCoach ? '(Head Coach)' : `(${c.role.replace('_', ' ')})`}
            </option>
          );
        })}
      </select>

      {/* Visual Touch Pills Grid */}
      <div
        className="coach-picker-grid"
        role={multiple ? 'group' : 'radiogroup'}
      >
        {!multiple && allowUnassigned && (
          <button
            type="button"
            className={`coach-picker-pill unassigned-pill ${selectedValues.length === 0 ? 'active' : ''}`}
            onClick={handleClear}
            role="radio"
            aria-checked={selectedValues.length === 0}
          >
            <span className="coach-pill-avatar unassigned">✕</span>
            <div className="coach-pill-info">
              <span className="coach-pill-name">{unassignedLabel}</span>
            </div>
            {selectedValues.length === 0 && <span className="coach-pill-check">✓</span>}
          </button>
        )}

        {coaches.map(c => {
          const active = isSelected(c);
          const badge = badgeFilter ? badgeFilter(c) : c.isHeadCoach ? 'Head Coach' : undefined;

          return (
            <button
              key={c.id}
              type="button"
              className={`coach-picker-pill ${active ? 'active' : ''}`}
              onClick={() => handleToggle(c)}
              role={multiple ? 'checkbox' : 'radio'}
              aria-checked={active}
              title={`${c.name} (${c.role.replace('_', ' ')})`}
            >
              {/* Color Dot / Avatar */}
              <span className={`coach-pill-avatar dot-${c.color || 'cyan'}`}>
                {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>

              <div className="coach-pill-info">
                <span className="coach-pill-name">{c.name}</span>
                <span className="coach-pill-role">
                  {badge || c.role.replace('_', ' ')}
                </span>
              </div>

              {active && <span className="coach-pill-check">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Display custom entries if any */}
      {customEntries.length > 0 && (
        <div className="coach-custom-tags">
          <span className="custom-tags-label">Custom / Other:</span>
          {customEntries.map(customVal => (
            <span key={customVal} className="custom-coach-tag">
              <span>{customVal}</span>
              <button
                type="button"
                className="btn-remove-custom"
                onClick={() => {
                  const next = selectedValues.filter(v => v !== customVal);
                  onChange(multiple ? next : '', []);
                }}
                title="Remove"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Optional Custom Input for typing another name */}
      {allowCustomInput && (
        <div className="coach-custom-input-row">
          <input
            type="text"
            placeholder={placeholder}
            className="coach-custom-input"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const target = e.currentTarget;
                const val = target.value.trim();
                if (val && !selectedValues.includes(val)) {
                  if (multiple) {
                    onChange([...selectedValues, val], []);
                  } else {
                    onChange(val, []);
                  }
                  target.value = '';
                }
              }
            }}
          />
          <span className="custom-input-hint">Press Enter to add custom coach</span>
        </div>
      )}
    </div>
  );
}
