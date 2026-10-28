import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { SessionModal } from './SessionModal';

export function AttendanceView() {
  const {
    config,
    club,
    setCurrentView,
    toggleSwimmerAttendance,
    markAllSwimmersPresent,
    clearSwimmersAttendance
  } = useApp();

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'present' | 'absent'>('all');

  const selectedGroups = useMemo(
    () => club.groups.filter(g => config.selectedGroupIds.includes(g.id)),
    [club.groups, config.selectedGroupIds]
  );

  const squadSwimmers = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      age: number | '';
      gender: string;
      pb50m: string;
      pb100m: string;
      notes: string;
      groupId: string;
      groupName: string;
      groupColor: string;
    }> = [];

    selectedGroups.forEach(g => {
      g.swimmers.forEach(s => {
        list.push({
          ...s,
          groupId: g.id,
          groupName: g.name,
          groupColor: g.color
        });
      });
    });

    return list;
  }, [selectedGroups]);

  const presentSet = useMemo(
    () => new Set(config.presentSwimmerIds || []),
    [config.presentSwimmerIds]
  );

  const filteredSwimmers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return squadSwimmers.filter(s => {
      const isPresent = presentSet.has(s.id);

      if (filterMode === 'present' && !isPresent) return false;
      if (filterMode === 'absent' && isPresent) return false;

      if (query) {
        return (
          s.name.toLowerCase().includes(query) ||
          s.groupName.toLowerCase().includes(query) ||
          (s.notes && s.notes.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [squadSwimmers, presentSet, filterMode, search]);

  const presentCountInSession = useMemo(
    () => squadSwimmers.filter(s => presentSet.has(s.id)).length,
    [squadSwimmers, presentSet]
  );

  const absentCountInSession = squadSwimmers.length - presentCountInSession;

  const handleMarkAllPresent = () => {
    markAllSwimmersPresent(squadSwimmers.map(s => s.id));
  };

  const handleClearAttendance = () => {
    clearSwimmersAttendance(squadSwimmers.map(s => s.id));
  };

  return (
    <section className="view-panel active" aria-label="Attendance View">
      {/* Session Details Header Card */}
      <div className="attendance-session-card">
        <div className="attendance-session-main">
          <div className="attendance-tag-row">
            <span className="config-tag">ACTIVE SESSION</span>
            <span className="attendance-date-badge">
              <Icon name="calendar" size={14} />
              <span>{config.sessionDate || 'Today'}</span>
            </span>
            <span className="attendance-date-badge">
              <Icon name="clock" size={14} />
              <span>{config.sessionTime || 'Now'}</span>
            </span>
          </div>

          <h1 className="attendance-session-title">
            {config.sessionName || 'Training Session'}
          </h1>

          <div className="attendance-squads-row">
            <span className="attendance-squads-label">Squads in water:</span>
            {selectedGroups.length === 0 ? (
              <span className="attendance-no-squads">No squads selected</span>
            ) : (
              selectedGroups.map(grp => (
                <span key={grp.id} className="attendance-squad-chip">
                  <span className={`group-color-dot dot-${grp.color || 'cyan'}`} />
                  <span>{grp.name}</span>
                  <span className="attendance-chip-count">({grp.swimmers.length})</span>
                </span>
              ))
            )}
          </div>
        </div>

        <div className="attendance-session-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSessionModalOpen(true)}
          >
            <Icon name="edit" size={16} />
            <span>Edit Session Details</span>
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setCurrentView('session')}
          >
            <span>Proceed to Session</span>
            <Icon name="play" size={14} />
          </button>
        </div>
      </div>

      {/* Attendance KPI Summary */}
      <div className="results-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Active Squads</span>
          <span className="kpi-value accent">{selectedGroups.length}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Squad Athletes</span>
          <span className="kpi-value">{squadSwimmers.length}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Marked Present</span>
          <span className="kpi-value" style={{ color: '#34d399' }}>
            {presentCountInSession}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Absent / Not Checked</span>
          <span className="kpi-value" style={{ color: absentCountInSession > 0 ? '#fb7185' : 'var(--text-secondary)' }}>
            {absentCountInSession}
          </span>
        </div>
      </div>

      {/* Swimmer Attendance Roster */}
      <div className="attendance-roster-section">
        <div className="section-title-row">
          <div>
            <h2 className="section-heading">Swimmer Attendance Checklist</h2>
            <p className="section-sub">
              Tap each swimmer to mark Present or Absent for this session. Recorded times will save with this session info.
            </p>
          </div>
          <div className="bulk-actions">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleMarkAllPresent}
              disabled={squadSwimmers.length === 0}
            >
              ✓ Mark All Present
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleClearAttendance}
              disabled={squadSwimmers.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="attendance-toolbar">
          <div className="roster-search-wrap">
            <Icon name="search" size={16} className="search-icon" />
            <input
              type="text"
              className="roster-search-input"
              placeholder="Search swimmers by name or squad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="attendance-filter-pills" role="radiogroup" aria-label="Filter Attendance">
            <button
              type="button"
              className={`filter-pill ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >
              All ({squadSwimmers.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterMode === 'present' ? 'active' : ''}`}
              onClick={() => setFilterMode('present')}
            >
              Present ({presentCountInSession})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterMode === 'absent' ? 'active' : ''}`}
              onClick={() => setFilterMode('absent')}
            >
              Absent ({absentCountInSession})
            </button>
          </div>
        </div>

        {squadSwimmers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Squads in Current Session</h3>
            <p>Select which squad(s) are training in this session to take attendance.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setSessionModalOpen(true)}
            >
              Select Session Squads
            </button>
          </div>
        ) : (
          <div className="attendance-grid">
            {filteredSwimmers.map(sw => {
              const isPresent = presentSet.has(sw.id);
              const ageGender = [sw.age ? `${sw.age}y` : '', sw.gender].filter(Boolean).join(' · ');

              return (
                <div
                  key={sw.id}
                  className={`attendance-card ${isPresent ? 'present' : 'absent'}`}
                  onClick={() => toggleSwimmerAttendance(sw.id)}
                >
                  <div className="attendance-card-left">
                    <button
                      type="button"
                      className={`attendance-toggle-pill ${isPresent ? 'is-present' : 'is-absent'}`}
                      aria-label={`Toggle attendance for ${sw.name}`}
                      onClick={e => {
                        e.stopPropagation();
                        toggleSwimmerAttendance(sw.id);
                      }}
                    >
                      <span className="attendance-toggle-icon">
                        {isPresent ? '✓' : '○'}
                      </span>
                      <span>{isPresent ? 'PRESENT' : 'ABSENT'}</span>
                    </button>

                    <div className="attendance-swimmer-details">
                      <span className="attendance-swimmer-name">{sw.name}</span>
                      <div className="attendance-swimmer-meta">
                        <span className={`group-color-dot dot-${sw.groupColor || 'cyan'}`} />
                        <span>{sw.groupName}</span>
                        {ageGender && <span>· {ageGender}</span>}
                        {sw.pb100m && <span>· PB {sw.pb100m}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="setup-footer-cta">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={() => setCurrentView('session')}
        >
          <span>Continue to Session</span>
          <Icon name="play" size={18} />
        </button>
      </div>

      {/* Session Details Modal */}
      <SessionModal
        isOpen={sessionModalOpen}
        onClose={() => setSessionModalOpen(false)}
      />
    </section>
  );
}

