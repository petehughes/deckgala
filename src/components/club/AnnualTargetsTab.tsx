import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../common/Icon';
import { AnnualTargetModal } from './AnnualTargetModal';
import { SwimmerPBModal } from '../swimmers/SwimmerPBModal';
import { STANDARD_STROKES, evaluateSwimmerTarget } from '../../lib/targets';
import type { AnnualTarget, Swimmer, TargetCompetitionLevel, SwimStroke } from '../../types';

export function AnnualTargetsTab() {
  const { club, deleteAnnualTarget, resetAnnualTargetsToDefault } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'qualifiers' | 'standards'>('qualifiers');

  // Standards filters
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [strokeFilter, setStrokeFilter] = useState<string>('all');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');

  // Qualifiers filters
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'qualified' | 'close'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<AnnualTarget | null>(null);

  const [isPBModalOpen, setIsPBModalOpen] = useState(false);
  const [selectedSwimmerForPB, setSelectedSwimmerForPB] = useState<Swimmer | null>(null);

  const targets = club.annualTargets || [];

  // All swimmers across all squads
  const allSwimmersWithSquad = useMemo(() => {
    return club.groups.flatMap(g =>
      g.swimmers.map(s => ({
        swimmer: s,
        groupName: g.name,
        groupId: g.id,
        groupColor: g.color
      }))
    );
  }, [club.groups]);

  // Swimmer evaluations
  const swimmerTargetSummaries = useMemo(() => {
    return allSwimmersWithSquad.map(({ swimmer, groupName, groupId, groupColor }) => {
      const evaluations = targets
        .map(t => evaluateSwimmerTarget(swimmer, t))
        .filter((e): e is NonNullable<typeof e> => e !== null);
      const qualified = evaluations.filter(e => e.status === 'qualified');
      const close = evaluations.filter(e => e.status === 'close');
      const countyQuals = qualified.filter(e => e.target.level === 'county');
      const regionalQuals = qualified.filter(e => e.target.level === 'regional');
      const nationalQuals = qualified.filter(e => e.target.level === 'national');

      return {
        swimmer,
        groupName,
        groupId,
        groupColor,
        evaluations,
        qualified,
        close,
        countyQuals,
        regionalQuals,
        nationalQuals,
        totalQualifiedCount: qualified.length,
        totalCloseCount: close.length
      };
    });
  }, [allSwimmersWithSquad, targets]);

  // Overall KPIs
  const totalStandardsCount = targets.length;
  const totalSwimmersWithQuals = swimmerTargetSummaries.filter(s => s.totalQualifiedCount > 0).length;
  const totalSwimmersClose = swimmerTargetSummaries.filter(s => s.totalCloseCount > 0).length;
  const totalAchievedEventsCount = swimmerTargetSummaries.reduce((acc, s) => acc + s.totalQualifiedCount, 0);

  // Filtered standards
  const filteredTargets = useMemo(() => {
    return targets.filter(t => {
      if (levelFilter !== 'all' && t.level !== levelFilter) return false;
      if (strokeFilter !== 'all' && t.stroke !== strokeFilter) return false;
      if (distanceFilter !== 'all' && t.distance !== Number(distanceFilter)) return false;
      return true;
    });
  }, [targets, levelFilter, strokeFilter, distanceFilter]);

  // Filtered swimmers for tracker
  const filteredSwimmerSummaries = useMemo(() => {
    return swimmerTargetSummaries.filter(s => {
      if (squadFilter !== 'all' && s.groupId !== squadFilter) return false;
      if (statusFilter === 'qualified' && s.totalQualifiedCount === 0) return false;
      if (statusFilter === 'close' && s.totalCloseCount === 0) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.swimmer.name.toLowerCase().includes(q);
        const matchesGroup = s.groupName.toLowerCase().includes(q);
        if (!matchesName && !matchesGroup) return false;
      }
      return true;
    });
  }, [swimmerTargetSummaries, squadFilter, statusFilter, searchQuery]);

  return (
    <div className="annual-targets-tab-view" aria-label="Annual Targets Tab">
      {/* Top Target Overview KPIs */}
      <div className="targets-kpi-grid">
        <div className="target-kpi-card">
          <div className="kpi-icon-wrap kpi-gold">
            <Icon name="trophy" size={24} />
          </div>
          <div className="kpi-data">
            <div className="kpi-number">{totalSwimmersWithQuals}</div>
            <div className="kpi-title">Qualifiers Achieved</div>
            <div className="kpi-detail">{totalAchievedEventsCount} total event qualifications</div>
          </div>
        </div>

        <div className="target-kpi-card">
          <div className="kpi-icon-wrap kpi-amber">
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
          </div>
          <div className="kpi-data">
            <div className="kpi-number">{totalSwimmersClose}</div>
            <div className="kpi-title">Close to Qualifying</div>
            <div className="kpi-detail">Within 2% or 1.5s of standard</div>
          </div>
        </div>

        <div className="target-kpi-card">
          <div className="kpi-icon-wrap kpi-blue">
            <Icon name="target" size={24} />
          </div>
          <div className="kpi-data">
            <div className="kpi-number">{totalStandardsCount}</div>
            <div className="kpi-title">Target Standards</div>
            <div className="kpi-detail">County, Regional & National</div>
          </div>
        </div>
      </div>

      {/* Sub navigation bar */}
      <div className="targets-subtab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'qualifiers'}
          className={`targets-subtab-btn ${activeSubTab === 'qualifiers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('qualifiers')}
        >
          <Icon name="award" size={18} />
          <span>Club Qualifiers & Target Tracker</span>
          <span className="tab-count-pill">{totalSwimmersWithQuals}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'standards'}
          className={`targets-subtab-btn ${activeSubTab === 'standards' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('standards')}
        >
          <Icon name="target" size={18} />
          <span>Entry Requirements & Standards</span>
          <span className="tab-count-pill">{totalStandardsCount}</span>
        </button>
      </div>

      {/* SUBTAB 1: QUALIFIERS & TRACKER */}
      {activeSubTab === 'qualifiers' && (
        <div className="qualifiers-tracker-container">
          {/* Controls Bar */}
          <div className="tracker-filter-bar">
            <div className="filter-input-wrap">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search swimmers or squads..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search swimmers"
              />
            </div>

            <div className="filter-select-group">
              <label htmlFor="filterSquad">Squad:</label>
              <select
                id="filterSquad"
                value={squadFilter}
                onChange={e => setSquadFilter(e.target.value)}
              >
                <option value="all">All Squads ({allSwimmersWithSquad.length})</option>
                {club.groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.swimmers.length})
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-pills-row" role="radiogroup" aria-label="Status Filter">
              <button
                type="button"
                className={`filter-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All Swimmers
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-qualified ${statusFilter === 'qualified' ? 'active' : ''}`}
                onClick={() => setStatusFilter('qualified')}
              >
                🏆 Qualified Only ({totalSwimmersWithQuals})
              </button>
              <button
                type="button"
                className={`filter-pill-btn pill-close ${statusFilter === 'close' ? 'active' : ''}`}
                onClick={() => setStatusFilter('close')}
              >
                ⚡ Close Only ({totalSwimmersClose})
              </button>
            </div>
          </div>

          {/* Swimmer Target Cards */}
          <div className="swimmer-tracker-grid">
            {filteredSwimmerSummaries.map(s => {
              const hasQuals = s.totalQualifiedCount > 0;
              const hasClose = s.totalCloseCount > 0;

              return (
                <div
                  key={s.swimmer.id}
                  className={`swimmer-tracker-card ${hasQuals ? 'has-qual' : ''} ${hasClose ? 'has-close' : ''}`}
                >
                  <div className="card-top-row">
                    <div className="swimmer-info">
                      <h4 className="swimmer-name">{s.swimmer.name}</h4>
                      <div className="swimmer-meta-pills">
                        <span className="squad-pill" style={{ borderColor: s.groupColor }}>
                          {s.groupName}
                        </span>
                        {s.swimmer.age && <span className="age-pill">{s.swimmer.age}y</span>}
                        {s.swimmer.gender && <span className="gender-pill">{s.swimmer.gender}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm edit-pb-btn"
                      onClick={() => {
                        setSelectedSwimmerForPB(s.swimmer);
                        setIsPBModalOpen(true);
                      }}
                      title="Manage personal bests & target standards"
                    >
                      <Icon name="edit" size={14} />
                      <span>Manage PBs</span>
                    </button>
                  </div>

                  {/* Badges overview */}
                  <div className="target-badge-row">
                    {s.nationalQuals.length > 0 && (
                      <span className="badge-target badge-national">
                        🇬🇧 National ({s.nationalQuals.length})
                      </span>
                    )}
                    {s.regionalQuals.length > 0 && (
                      <span className="badge-target badge-regional">
                        🎖️ Regional ({s.regionalQuals.length})
                      </span>
                    )}
                    {s.countyQuals.length > 0 && (
                      <span className="badge-target badge-county">
                        🏆 County ({s.countyQuals.length})
                      </span>
                    )}
                    {s.totalCloseCount > 0 && (
                      <span className="badge-target badge-close">
                        ⚡ {s.totalCloseCount} Close to QT
                      </span>
                    )}
                    {!hasQuals && !hasClose && (
                      <span className="badge-target badge-none">Developing Standards</span>
                    )}
                  </div>

                  {/* Target Events Breakdown */}
                  <div className="target-events-list">
                    {s.evaluations
                      .filter(e => e.status === 'qualified' || e.status === 'close')
                      .map(e => (
                        <div
                          key={e.target.id}
                          className={`target-event-row status-${e.status}`}
                        >
                          <div className="event-label">
                            <span className="event-name">
                              {e.target.distance}m {e.target.stroke}
                            </span>
                            <span className="event-comp">{e.target.competitionName}</span>
                          </div>

                          <div className="event-times">
                            <span className="swimmer-pb-val">{e.swimmerTime}</span>
                            <span className="target-standard-val">/ QT {e.target.qualifyingTime}</span>
                          </div>

                          <div className="event-status-badge">
                            {e.status === 'qualified' ? (
                              <span className="text-qual">✓ Qualified ({e.gapSec}s)</span>
                            ) : (
                              <span className="text-close">⚡ {e.gapSec}s away</span>
                            )}
                          </div>
                        </div>
                      ))}

                    {s.totalQualifiedCount === 0 && s.totalCloseCount === 0 && (
                      <div className="no-events-hint">
                        {s.swimmer.personalBests && s.swimmer.personalBests.length > 0
                          ? 'Swimmer times are currently building towards entry standards.'
                          : 'No 100m+ personal best times recorded yet. Click "Manage PBs" to enter times.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredSwimmerSummaries.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No Matching Swimmers</h3>
                <p>Try adjusting your search or squad filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ENTRY REQUIREMENTS & STANDARDS */}
      {activeSubTab === 'standards' && (
        <div className="standards-list-container">
          {/* Top standards actions & filters */}
          <div className="standards-toolbar">
            <div className="standards-filters">
              <div className="filter-group">
                <label htmlFor="filterLevel">Level:</label>
                <select
                  id="filterLevel"
                  value={levelFilter}
                  onChange={e => setLevelFilter(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="county">County</option>
                  <option value="regional">Regional</option>
                  <option value="national">National</option>
                  <option value="club">Club</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filterStroke">Stroke:</label>
                <select
                  id="filterStroke"
                  value={strokeFilter}
                  onChange={e => setStrokeFilter(e.target.value)}
                >
                  <option value="all">All Strokes</option>
                  {STANDARD_STROKES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filterDistance">Distance:</label>
                <select
                  id="filterDistance"
                  value={distanceFilter}
                  onChange={e => setDistanceFilter(e.target.value)}
                >
                  <option value="all">All Distances</option>
                  <option value="100">100m</option>
                  <option value="200">200m</option>
                  <option value="400">400m</option>
                  <option value="800">800m</option>
                  <option value="1500">1500m</option>
                </select>
              </div>
            </div>

            <div className="standards-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (confirm('Reset all target standards to default official County, Regional and National qualifying times?')) {
                    resetAnnualTargetsToDefault();
                  }
                }}
                title="Reset to default official targets"
              >
                Reset to Defaults
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingTarget(null);
                  setIsTargetModalOpen(true);
                }}
              >
                <Icon name="plus" size={16} />
                <span>Add Target Standard</span>
              </button>
            </div>
          </div>

          {/* Standards Table */}
          <div className="standards-table-wrapper">
            <table className="standards-table">
              <thead>
                <tr>
                  <th>Competition & Level</th>
                  <th>Stroke & Distance (100m+)</th>
                  <th>Course</th>
                  <th>Age / Gender</th>
                  <th>Automatic QT</th>
                  <th>Consideration CT</th>
                  <th>Notes</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filteredTargets.map(target => {
                  const levelBadgeClass =
                    target.level === 'national'
                      ? 'badge-national'
                      : target.level === 'regional'
                      ? 'badge-regional'
                      : 'badge-county';

                  const ageDisplay =
                    target.minAge || target.maxAge
                      ? `${target.minAge || '8'} - ${target.maxAge || 'Open'} yrs`
                      : 'All Ages';

                  return (
                    <tr key={target.id}>
                      <td className="td-comp-name">
                        <div className="comp-name-wrap">
                          <strong>{target.competitionName}</strong>
                          <span className={`badge-level-mini ${levelBadgeClass}`}>
                            {target.level.toUpperCase()} {target.year}
                          </span>
                        </div>
                      </td>
                      <td className="td-event">
                        <span className="event-badge">
                          {target.distance}m {target.stroke}
                        </span>
                      </td>
                      <td className="td-course">{target.course}</td>
                      <td className="td-age-gender">
                        {ageDisplay} · <span className="gender-tag">{target.gender}</span>
                      </td>
                      <td className="td-time-qt">
                        <strong className="time-highlight">{target.qualifyingTime}</strong>
                      </td>
                      <td className="td-time-ct">
                        {target.considerationTime || '—'}
                      </td>
                      <td className="td-notes">{target.notes || '—'}</td>
                      <td className="td-actions">
                        <button
                          type="button"
                          className="btn-row-edit"
                          onClick={() => {
                            setEditingTarget(target);
                            setIsTargetModalOpen(true);
                          }}
                          title="Edit target standard"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-delete-row"
                          onClick={() => deleteAnnualTarget(target.id)}
                          title="Delete target"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTargets.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No Matching Standards Found</h3>
                <p>Adjust your filter settings or create a new annual entry target.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingTarget(null);
                    setIsTargetModalOpen(true);
                  }}
                >
                  + Add Target Standard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Modal */}
      <AnnualTargetModal
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        editingTarget={editingTarget}
      />

      {/* Swimmer PB Modal */}
      <SwimmerPBModal
        isOpen={isPBModalOpen}
        onClose={() => {
          setIsPBModalOpen(false);
          setSelectedSwimmerForPB(null);
        }}
        swimmer={selectedSwimmerForPB}
      />
    </div>
  );
}
