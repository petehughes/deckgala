import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  filterAndSortSwimmers,
  getTotalClubSwimmersCount,
  getActiveGroup
} from '../../lib/roster';
import { Icon } from '../common/Icon';
import { ConfirmModal } from '../common/ConfirmModal';
import { GroupList } from './GroupList';
import { SwimmerTable } from './SwimmerTable';
import { SwimmerFormModal } from './SwimmerFormModal';
import { GroupFormModal } from './GroupFormModal';
import { BulkAddModal } from './BulkAddModal';
import { ExportModal } from './ExportModal';
import { ImportModal } from './ImportModal';
import { SwimmerPBModal } from './SwimmerPBModal';
import type { RosterSort, Swimmer, SwimmerGroup } from '../../types';

export function SwimmersView() {
  const {
    club,
    activeGroupId,
    setClubName,
    deleteGroup,
    deleteSwimmer
  } = useApp();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RosterSort>({ field: 'name', dir: 'asc' });

  // Modal states
  const [swimmerModalOpen, setSwimmerModalOpen] = useState(false);
  const [editingSwimmer, setEditingSwimmer] = useState<Swimmer | null>(null);
  const [pbModalOpen, setPbModalOpen] = useState(false);
  const [selectedSwimmerForPB, setSelectedSwimmerForPB] = useState<Swimmer | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SwimmerGroup | null>(null);

  const [groupToDelete, setGroupToDelete] = useState<SwimmerGroup | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [exportModalState, setExportModalState] = useState<{ open: boolean; scope: 'club' | 'group' }>({
    open: false,
    scope: 'club'
  });
  const [importModalState, setImportModalState] = useState<{ open: boolean; source: 'file' | 'qr' }>({
    open: false,
    source: 'file'
  });

  const totalSwimmers = getTotalClubSwimmersCount(club);
  const activeGroup = getActiveGroup(club, activeGroupId);

  const filteredSwimmers = useMemo(() => {
    if (!activeGroup) return [];
    return filterAndSortSwimmers(activeGroup.swimmers, {
      search,
      sort
    });
  }, [activeGroup, search, sort]);

  const handleToggleSort = (field: RosterSort['field']) => {
    setSort(prev => {
      if (prev.field === field) {
        return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { field, dir: 'asc' };
    });
  };

  return (
    <section className="view-panel active" aria-label="Swimmers Management View">
      {/* Top Club Bar */}
      <div className="club-header-card">
        <div className="club-header-left">
          <span className="config-tag">CLUB ROSTER</span>
          <div className="club-title-row">
            <input
              type="text"
              className="club-name-input"
              aria-label="Swimming Club Name"
              value={club.clubName}
              onChange={e => setClubName(e.target.value)}
            />
            <span className="club-stats-pill">
              {club.groups.length} group{club.groups.length === 1 ? '' : 's'} · {totalSwimmers} swimmer{totalSwimmers === 1 ? '' : 's'}
            </span>
          </div>
          <p className="config-help">
            Stored locally on this device for offline poolside use. Export or import full club or individual squad files anytime.
          </p>
        </div>

        <div className="club-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setImportModalState({ open: true, source: 'file' })}
          >
            <Icon name="upload" size={16} />
            <span>Import Club / Group</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setImportModalState({ open: true, source: 'qr' })}
            title="Scan a AquaTeamHub QR Code with your camera or image"
          >
            <Icon name="qr" size={16} />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setExportModalState({ open: true, scope: 'club' })}
          >
            <Icon name="download" size={16} />
            <span>Export Club / Group</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingGroup(null);
              setGroupModalOpen(true);
            }}
          >
            <Icon name="plus" size={16} />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* Two-Column Layout: Groups Sidebar + Swimmer Roster */}
      <div className="swimmers-workspace">
        <GroupList
          onNewGroup={() => {
            setEditingGroup(null);
            setGroupModalOpen(true);
          }}
          onEditGroup={grp => {
            setEditingGroup(grp);
            setGroupModalOpen(true);
          }}
          onDeleteGroup={grp => setGroupToDelete(grp)}
        />

        <div className="roster-panel">
          {activeGroup ? (
            <>
              <div className="roster-panel-header">
                <div className="roster-group-info">
                  <div className="roster-group-title-row">
                    <span className={`group-color-dot dot-${activeGroup.color || 'cyan'}`} />
                    <h2 className="roster-group-title">{activeGroup.name}</h2>
                    <span className="roster-swimmer-count-pill">
                      {activeGroup.swimmers.length} swimmer{activeGroup.swimmers.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="roster-group-meta">
                    {[activeGroup.coach, activeGroup.description].filter(Boolean).join(' — ') ||
                      'Manage swimmers and personal bests in this squad'}
                  </p>
                </div>

                <div className="roster-group-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingGroup(activeGroup);
                      setGroupModalOpen(true);
                    }}
                  >
                    Edit Group
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setExportModalState({ open: true, scope: 'group' })}
                  >
                    Export Group
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-outline btn-sm"
                    onClick={() => setGroupToDelete(activeGroup)}
                  >
                    Delete Group
                  </button>
                </div>
              </div>

              <div className="roster-toolbar">
                <div className="roster-search-wrap">
                  <Icon name="search" size={16} className="search-icon" />
                  <input
                    type="text"
                    className="roster-search-input"
                    placeholder="Search swimmers by name or notes..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div className="roster-toolbar-right">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setBulkModalOpen(true)}
                  >
                    + Bulk Add Names
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingSwimmer(null);
                      setSwimmerModalOpen(true);
                    }}
                  >
                    + Add Swimmer
                  </button>
                </div>
              </div>

              <SwimmerTable
                swimmers={filteredSwimmers}
                totalInGroup={activeGroup.swimmers.length}
                sort={sort}
                onToggleSort={handleToggleSort}
                onEditSwimmer={sw => {
                  setEditingSwimmer(sw);
                  setSwimmerModalOpen(true);
                }}
                onDeleteSwimmer={id => deleteSwimmer(id, activeGroup.id)}
                onAddSwimmer={() => {
                  setEditingSwimmer(null);
                  setSwimmerModalOpen(true);
                }}
                onBulkAdd={() => setBulkModalOpen(true)}
                onOpenPBs={sw => {
                  setSelectedSwimmerForPB(sw);
                  setPbModalOpen(true);
                }}
                annualTargets={club.annualTargets || []}
              />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏊</div>
              <h3>No Swimming Group Selected</h3>
              <p>Create a squad to start adding swimmers.</p>
              <div className="empty-state-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingGroup(null);
                    setGroupModalOpen(true);
                  }}
                >
                  + Create Squad
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SwimmerFormModal
        isOpen={swimmerModalOpen}
        onClose={() => setSwimmerModalOpen(false)}
        editingSwimmer={editingSwimmer}
      />

      <GroupFormModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        editingGroup={editingGroup}
      />

      <BulkAddModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
      />

      <ExportModal
        isOpen={exportModalState.open}
        onClose={() => setExportModalState(prev => ({ ...prev, open: false }))}
        initialScope={exportModalState.scope}
      />

      <ImportModal
        isOpen={importModalState.open}
        onClose={() => setImportModalState(prev => ({ ...prev, open: false }))}
        initialSource={importModalState.source}
      />

      <ConfirmModal
        isOpen={Boolean(groupToDelete)}
        onClose={() => setGroupToDelete(null)}
        onConfirm={() => {
          if (groupToDelete) deleteGroup(groupToDelete.id);
        }}
        title="Delete Swimming Group?"
        message={
          groupToDelete
            ? `Delete "${groupToDelete.name}" and its ${groupToDelete.swimmers.length} swimmer(s)?`
            : ''
        }
        confirmLabel="Delete Group"
      />
      <SwimmerPBModal
        isOpen={pbModalOpen}
        onClose={() => {
          setPbModalOpen(false);
          setSelectedSwimmerForPB(null);
        }}
        swimmer={selectedSwimmerForPB}
      />
    </section>
  );
}

