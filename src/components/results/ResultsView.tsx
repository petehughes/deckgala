import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  computeResultsKpis,
  filterAndSortResults,
  buildResultsClipboardText,
  buildResultsCsv
} from '../../lib/results';
import { downloadFile } from '../../lib/files';
import { sanitizeFilename } from '../../lib/format';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';
import { ResultsTable } from './ResultsTable';

export function ResultsView() {
  const { results, setResults, config, showToast } = useApp();

  const [laneFilter, setLaneFilter] = useState('all');
  const [waveFilter, setWaveFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'wave' | 'lane' | 'fastest'>('recent');
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const kpis = useMemo(() => computeResultsKpis(results), [results]);

  const filteredResults = useMemo(
    () => filterAndSortResults(results, { laneFilter, waveFilter, sortBy }),
    [results, laneFilter, waveFilter, sortBy]
  );

  const uniqueLanes = useMemo(
    () => Array.from(new Set(results.map(r => r.lane))).sort((a, b) => a - b),
    [results]
  );

  const uniqueWaves = useMemo(
    () => Array.from(new Set(results.map(r => r.wave))).sort((a, b) => a - b),
    [results]
  );

  const handleCopySummary = async () => {
    if (results.length === 0) {
      showToast('No results to copy', 'warning');
      return;
    }
    const text = buildResultsClipboardText(results, config.sessionName || config.setName);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Results summary copied to clipboard!', 'success');
    } catch {
      showToast('Could not access clipboard', 'warning');
    }
  };

  const handleExportCsv = () => {
    if (results.length === 0) {
      showToast('No results to export', 'warning');
      return;
    }
    const csvContent = buildResultsCsv(results);
    const slug = sanitizeFilename(config.sessionName || 'session');
    const filename = `aquapace-${slug}-${config.sessionDate || new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    showToast('Exported CSV file!', 'success');
  };

  const handleDeleteResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
    showToast('Split deleted', 'info');
  };

  const handleClearAll = () => {
    setResults([]);
    showToast('All results cleared', 'info');
  };

  return (
    <section className="view-panel active" aria-label="Results View">
      <div className="results-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Total Swims Recorded</span>
          <span className="kpi-value">{kpis.totalCount}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Fastest Net Time</span>
          <span className="kpi-value accent">{kpis.fastestText}</span>
          <span className="kpi-sub">{kpis.fastestSub}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Set Average Time</span>
          <span className="kpi-value">{kpis.avgText}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Waves Launched</span>
          <span className="kpi-value">{kpis.wavesCount}</span>
        </div>
      </div>

      <div className="results-toolbar">
        <div className="results-filters">
          <div className="filter-group">
            <label htmlFor="filterLaneSelect">Lane</label>
            <select
              id="filterLaneSelect"
              value={laneFilter}
              onChange={e => setLaneFilter(e.target.value)}
            >
              <option value="all">All Lanes</option>
              {uniqueLanes.map(l => (
                <option key={l} value={String(l)}>
                  Lane {l}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filterWaveSelect">Wave</label>
            <select
              id="filterWaveSelect"
              value={waveFilter}
              onChange={e => setWaveFilter(e.target.value)}
            >
              <option value="all">All Waves</option>
              {uniqueWaves.map(w => (
                <option key={w} value={String(w)}>
                  Wave {w}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortResultsSelect">Sort By</label>
            <select
              id="sortResultsSelect"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="recent">Most Recent First</option>
              <option value="wave">Wave &amp; Lane</option>
              <option value="lane">Lane Number</option>
              <option value="fastest">Fastest Net Split</option>
            </select>
          </div>
        </div>

        <div className="results-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopySummary}
          >
            <Icon name="copy" size={16} />
            <span>Copy Summary</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleExportCsv}
          >
            <Icon name="download" size={16} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => setClearModalOpen(true)}
          >
            Clear All
          </button>
        </div>
      </div>

      <ResultsTable results={filteredResults} onDeleteResult={handleDeleteResult} />

      <ConfirmModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleClearAll}
        title="Clear All Recorded Results?"
        message="This will permanently delete all recorded swim splits from this session."
        confirmLabel="Delete Splits"
      />
    </section>
  );
}

