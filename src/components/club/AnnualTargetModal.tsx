import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Icon } from '../common/Icon';
import { STANDARD_STROKES, STROKE_DISTANCES, parseTimeToMs, formatMsToTime } from '../../lib/targets';
import type { AnnualTarget, TargetCompetitionLevel, SwimStroke, PoolCourse, Gender } from '../../types';

export interface AnnualTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTarget?: AnnualTarget | null;
}

export function AnnualTargetModal({ isOpen, onClose, editingTarget = null }: AnnualTargetModalProps) {
  const { saveAnnualTarget } = useApp();

  const [competitionName, setCompetitionName] = useState('');
  const [level, setLevel] = useState<TargetCompetitionLevel>('county');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [stroke, setStroke] = useState<SwimStroke>('Freestyle');
  const [distance, setDistance] = useState<number>(100);
  const [course, setCourse] = useState<PoolCourse>('SCM');
  const [gender, setGender] = useState<'open' | 'female' | 'male'>('open');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [qualifyingTime, setQualifyingTime] = useState('');
  const [considerationTime, setConsiderationTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTarget) {
      setCompetitionName(editingTarget.competitionName || '');
      setLevel(editingTarget.level || 'county');
      setYear(editingTarget.year || new Date().getFullYear());
      setStroke(editingTarget.stroke || 'Freestyle');
      setDistance(editingTarget.distance || 100);
      setCourse(editingTarget.course || 'SCM');
      setGender(editingTarget.gender || 'open');
      setMinAge(editingTarget.minAge !== undefined ? String(editingTarget.minAge) : '');
      setMaxAge(editingTarget.maxAge !== undefined ? String(editingTarget.maxAge) : '');
      setQualifyingTime(editingTarget.qualifyingTime || '');
      setConsiderationTime(editingTarget.considerationTime || '');
      setNotes(editingTarget.notes || '');
    } else {
      setCompetitionName('');
      setLevel('county');
      setYear(new Date().getFullYear());
      setStroke('Freestyle');
      setDistance(100);
      setCourse('SCM');
      setGender('open');
      setMinAge('');
      setMaxAge('');
      setQualifyingTime('');
      setConsiderationTime('');
      setNotes('');
    }
  }, [isOpen, editingTarget]);

  // Adjust distance if stroke changes and current distance is not valid for stroke
  const availableDistances = STROKE_DISTANCES[stroke] || [100, 200];
  useEffect(() => {
    if (!availableDistances.includes(distance)) {
      setDistance(availableDistances[0] || 100);
    }
  }, [stroke, availableDistances, distance]);

  const parsedQtMs = parseTimeToMs(qualifyingTime);
  const parsedCtMs = considerationTime ? parseTimeToMs(considerationTime) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = saveAnnualTarget(
      {
        competitionName,
        level,
        year: Number(year) || new Date().getFullYear(),
        stroke,
        distance: Number(distance),
        course,
        gender,
        minAge: minAge !== '' ? Number(minAge) : undefined,
        maxAge: maxAge !== '' ? Number(maxAge) : undefined,
        qualifyingTime,
        qualifyingTimeMs: parsedQtMs || undefined,
        considerationTime: considerationTime || undefined,
        considerationTimeMs: parsedCtMs || undefined,
        notes
      },
      editingTarget?.id || null
    );

    if (success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTarget ? 'Edit Entry Requirement' : 'Add Annual Target Standard'}
      size="md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="annual-target-form" className="btn btn-primary">
            <Icon name="check" size={16} />
            <span>{editingTarget ? 'Save Target' : 'Create Target Standard'}</span>
          </button>
        </>
      }
    >
      <form id="annual-target-form" className="modal-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="targetCompName">Competition Name *</label>
          <input
            id="targetCompName"
            type="text"
            placeholder="e.g. County Championships, Regional Winter Meet, British Nationals"
            value={competitionName}
            onChange={e => setCompetitionName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="targetLevel">Competition Level</label>
            <select
              id="targetLevel"
              value={level}
              onChange={e => setLevel(e.target.value as TargetCompetitionLevel)}
            >
              <option value="county">County Championship</option>
              <option value="regional">Regional Championship</option>
              <option value="national">National Championship</option>
              <option value="club">Club Championship / Trophy</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="targetYear">Target Year</label>
            <input
              id="targetYear"
              type="number"
              min="2020"
              max="2035"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label htmlFor="targetStroke">Stroke</label>
            <select
              id="targetStroke"
              value={stroke}
              onChange={e => setStroke(e.target.value as SwimStroke)}
            >
              {STANDARD_STROKES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="targetDistance">Distance (100m+)</label>
            <select
              id="targetDistance"
              value={distance}
              onChange={e => setDistance(Number(e.target.value))}
            >
              {availableDistances.map(d => (
                <option key={d} value={d}>{d}m</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="targetCourse">Course</label>
            <select
              id="targetCourse"
              value={course}
              onChange={e => setCourse(e.target.value as PoolCourse)}
            >
              <option value="SCM">SCM (Short Course 25m)</option>
              <option value="LCM">LCM (Long Course 50m)</option>
            </select>
          </div>
        </div>

        <div className="form-row-3">
          <div className="form-field">
            <label htmlFor="targetGender">Gender Category</label>
            <select
              id="targetGender"
              value={gender}
              onChange={e => setGender(e.target.value as 'open' | 'female' | 'male')}
            >
              <option value="open">Open / Mixed</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="targetMinAge">Min Age (opt)</label>
            <input
              id="targetMinAge"
              type="number"
              min="8"
              max="99"
              placeholder="e.g. 13"
              value={minAge}
              onChange={e => setMinAge(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="targetMaxAge">Max Age (opt)</label>
            <input
              id="targetMaxAge"
              type="number"
              min="8"
              max="99"
              placeholder="e.g. 14"
              value={maxAge}
              onChange={e => setMaxAge(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="targetQualifyingTime">
              Automatic Qualifying Time (QT) *
            </label>
            <input
              id="targetQualifyingTime"
              type="text"
              placeholder="e.g. 1:02.50 or 58.40"
              value={qualifyingTime}
              onChange={e => setQualifyingTime(e.target.value)}
              required
            />
            <span className="field-hint">
              {parsedQtMs
                ? `Standard time: ${formatMsToTime(parsedQtMs, true)}`
                : 'Enter format MM:SS.hh or SS.hh'}
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="targetConsiderationTime">
              Consideration Time (CT) (Optional)
            </label>
            <input
              id="targetConsiderationTime"
              type="text"
              placeholder="e.g. 1:04.20"
              value={considerationTime}
              onChange={e => setConsiderationTime(e.target.value)}
            />
            <span className="field-hint">
              {parsedCtMs ? `Consideration: ${formatMsToTime(parsedCtMs, true)}` : 'Optional secondary entry time'}
            </span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="targetNotes">Notes / Qualification Guidance</label>
          <input
            id="targetNotes"
            type="text"
            placeholder="e.g. Must be achieved at a licensed Level 1, 2 or 3 gala"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

