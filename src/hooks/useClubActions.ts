import { useCallback } from 'react';
import { uid } from '../lib/ids';
import { parseBulkSwimmersText } from '../lib/roster';
import { applyImportToClub } from '../lib/exporters';
import { getSwimmerNamesForLane, distributeSwimmersAcrossLanes, getSessionPoolSwimmers } from '../lib/lanes';
import type {
  AppConfig,
  ClubData,
  GroupColor,
  ImportOptions,
  PendingImport,
  PersistedState,
  Swimmer,
  SwimmerGroup,
  ToastItem
} from '../types';

interface UseClubActionsParams {
  club: ClubData;
  activeGroupId: string | null;
  config: AppConfig;
  setPersisted: React.Dispatch<React.SetStateAction<PersistedState>>;
  showToast: (message: string, type?: ToastItem['type']) => void;
}

export function useClubActions({ club, activeGroupId, config, setPersisted, showToast }: UseClubActionsParams) {
  const setClubName = useCallback((clubName: string) => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        clubName: clubName.trim() || 'AquaPace Swim Club'
      }
    }));
  }, [setPersisted]);

  const saveGroup = useCallback((
    groupData: { name: string; coach: string; description: string; color: GroupColor },
    editingGroupId: string | null = null
  ) => {
    const name = (groupData.name || '').trim();
    if (!name) {
      showToast('Please enter a squad name', 'warning');
      return false;
    }

    setPersisted(prev => {
      if (editingGroupId) {
        const nextGroups = prev.club.groups.map(g =>
          g.id === editingGroupId
            ? {
                ...g,
                name,
                coach: (groupData.coach || '').trim(),
                description: (groupData.description || '').trim(),
                color: groupData.color || 'cyan'
              }
            : g
        );
        return {
          ...prev,
          club: { ...prev.club, groups: nextGroups }
        };
      } else {
        const newGrp: SwimmerGroup = {
          id: uid('grp'),
          name,
          coach: (groupData.coach || '').trim(),
          description: (groupData.description || '').trim(),
          color: groupData.color || 'cyan',
          swimmers: []
        };
        return {
          ...prev,
          activeGroupId: newGrp.id,
          config: {
            ...prev.config,
            selectedGroupIds: prev.config.selectedGroupIds.includes(newGrp.id)
              ? prev.config.selectedGroupIds
              : [...prev.config.selectedGroupIds, newGrp.id]
          },
          club: {
            ...prev.club,
            groups: [...prev.club.groups, newGrp]
          }
        };
      }
    });

    showToast(editingGroupId ? `Updated "${name}"` : `Created squad "${name}"`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteGroup = useCallback((groupId: string) => {
    const grp = club.groups.find(g => g.id === groupId);
    if (!grp) return;

    setPersisted(prev => {
      const nextGroups = prev.club.groups.filter(g => g.id !== groupId);
      const nextSelected = prev.config.selectedGroupIds.filter(id => id !== groupId);
      const nextActive = prev.activeGroupId === groupId
        ? (nextGroups[0]?.id || null)
        : prev.activeGroupId;

      return {
        ...prev,
        activeGroupId: nextActive,
        config: { ...prev.config, selectedGroupIds: nextSelected },
        club: { ...prev.club, groups: nextGroups }
      };
    });

    showToast(`Deleted squad "${grp.name}"`, 'info');
  }, [club.groups, setPersisted, showToast]);

  const saveSwimmer = useCallback((
    swimmerData: Partial<Swimmer> & { name: string },
    targetGroupId?: string,
    editingSwimmerId: string | null = null
  ) => {
    const name = (swimmerData.name || '').trim();
    if (!name) {
      showToast('Please enter the swimmer name', 'warning');
      return false;
    }

    const groupId = targetGroupId || activeGroupId;
    if (!groupId) return false;

    const payload: Omit<Swimmer, 'id'> = {
      name,
      age: swimmerData.age !== '' && swimmerData.age !== null && swimmerData.age !== undefined
        ? parseInt(String(swimmerData.age), 10) || ''
        : '',
      gender: swimmerData.gender || '',
      pb50m: (swimmerData.pb50m || '').trim(),
      pb100m: (swimmerData.pb100m || '').trim(),
      notes: (swimmerData.notes || '').trim()
    };

    setPersisted(prev => {
      let nextGroups = prev.club.groups.map(g => ({ ...g, swimmers: [...g.swimmers] }));

      let nextPresent = prev.config.presentSwimmerIds || [];
      if (editingSwimmerId) {
        let currentGrp = nextGroups.find(g => g.swimmers.some(s => s.id === editingSwimmerId));
        if (!currentGrp) currentGrp = nextGroups.find(g => g.id === prev.activeGroupId);

        if (currentGrp && currentGrp.id !== groupId) {
          currentGrp.swimmers = currentGrp.swimmers.filter(s => s.id !== editingSwimmerId);
          const destGrp = nextGroups.find(g => g.id === groupId);
          if (destGrp) {
            destGrp.swimmers.push({ id: editingSwimmerId, ...payload });
          }
        } else if (currentGrp) {
          currentGrp.swimmers = currentGrp.swimmers.map(s =>
            s.id === editingSwimmerId ? { ...s, ...payload } : s
          );
        }
      } else {
        const destGrp = nextGroups.find(g => g.id === groupId);
        if (destGrp) {
          const newId = uid('sw');
          destGrp.swimmers.push({ id: newId, ...payload });
          nextPresent = [...nextPresent, newId];
        }
      }

      return {
        ...prev,
        activeGroupId: groupId,
        config: {
          ...prev.config,
          presentSwimmerIds: nextPresent
        },
        club: { ...prev.club, groups: nextGroups }
      };
    });

    showToast(
      editingSwimmerId ? `Updated ${name}` : `Added ${name}`,
      'success'
    );
    return true;
  }, [activeGroupId, setPersisted, showToast]);

  const deleteSwimmer = useCallback((swimmerId: string, groupId: string | null = activeGroupId) => {
    const grp = club.groups.find(g => g.id === groupId);
    const sw = grp?.swimmers.find(s => s.id === swimmerId);
    if (!grp || !sw) return;

    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        groups: prev.club.groups.map(g =>
          g.id === groupId
            ? { ...g, swimmers: g.swimmers.filter(s => s.id !== swimmerId) }
            : g
        )
      }
    }));

    showToast(`Removed ${sw.name} from ${grp.name}`, 'info');
  }, [activeGroupId, club.groups, setPersisted, showToast]);

  const bulkAddSwimmers = useCallback((rawText: string, groupId: string | null = activeGroupId) => {
    const parsed = parseBulkSwimmersText(rawText);
    if (parsed.length === 0) {
      showToast('Enter at least one swimmer name', 'warning');
      return false;
    }

    const grp = club.groups.find(g => g.id === groupId);
    if (!grp) return false;

    const newIds = parsed.map(s => s.id);
    setPersisted(prev => ({
      ...prev,
      config: {
        ...prev.config,
        presentSwimmerIds: [...(prev.config.presentSwimmerIds || []), ...newIds]
      },
      club: {
        ...prev.club,
        groups: prev.club.groups.map(g =>
          g.id === groupId
            ? { ...g, swimmers: [...g.swimmers, ...parsed] }
            : g
        )
      }
    }));

    showToast(`Added ${parsed.length} swimmers to ${grp.name}`, 'success');
    return true;
  }, [activeGroupId, club.groups, setPersisted, showToast]);

  const executeImport = useCallback((pendingImport: PendingImport, options: ImportOptions) => {
    try {
      const result = applyImportToClub(
        club,
        activeGroupId,
        config.selectedGroupIds,
        pendingImport,
        options
      );

      setPersisted(prev => ({
        ...prev,
        activeGroupId: result.activeGroupId,
        config: {
          ...prev.config,
          selectedGroupIds: result.selectedGroupIds
        },
        club: result.club
      }));

      showToast(result.message, 'success');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      showToast(msg, 'danger');
      return false;
    }
  }, [activeGroupId, club, config.selectedGroupIds, setPersisted, showToast]);

  const toggleSessionGroup = useCallback((groupId: string) => {
    setPersisted(prev => {
      const exists = prev.config.selectedGroupIds.includes(groupId);
      const nextSelected = exists
        ? prev.config.selectedGroupIds.filter(id => id !== groupId)
        : [...prev.config.selectedGroupIds, groupId];
      return {
        ...prev,
        config: { ...prev.config, selectedGroupIds: nextSelected }
      };
    });
  }, [setPersisted]);

  const selectAllSessionGroups = useCallback(() => {
    setPersisted(prev => ({
      ...prev,
      config: {
        ...prev.config,
        selectedGroupIds: prev.club.groups.map(g => g.id)
      }
    }));
    showToast('Selected all club squads for this session', 'info');
  }, [setPersisted, showToast]);

  const clearSessionGroups = useCallback(() => {
    setPersisted(prev => ({
      ...prev,
      config: { ...prev.config, selectedGroupIds: [] }
    }));
    showToast('Cleared active session squads', 'info');
  }, [setPersisted, showToast]);

  const autoDistributeSwimmers = useCallback(() => {
    const pool = getSessionPoolSwimmers(club, config.selectedGroupIds, config.presentSwimmerIds);
    if (pool.length === 0) {
      showToast('No present swimmers in selected squads (check Attendance)', 'warning');
      return;
    }

    setPersisted(prev => ({
      ...prev,
      config: {
        ...prev.config,
        lanes: distributeSwimmersAcrossLanes(prev.config.lanes, prev.config.laneCount, pool)
      }
    }));

    showToast(`Distributed ${pool.length} present swimmers across ${config.laneCount} lanes`, 'success');
  }, [club, config.laneCount, config.selectedGroupIds, config.presentSwimmerIds, setPersisted, showToast]);

  const clearAllLanesSwimmers = useCallback(() => {
    setPersisted(prev => ({
      ...prev,
      config: {
        ...prev.config,
        lanes: prev.config.lanes.map((lane, idx) =>
          idx < prev.config.laneCount ? { ...lane, swimmersText: '' } : lane
        )
      }
    }));
    showToast('Cleared all lane assignments', 'info');
  }, [setPersisted, showToast]);

  const addSwimmerToLane = useCallback((laneIndex: number, swimmerName: string) => {
    const clean = (swimmerName || '').trim();
    if (!clean) return;

    const currentNames = getSwimmerNamesForLane(config.lanes[laneIndex]);
    if (currentNames.some(n => n.toLowerCase() === clean.toLowerCase())) {
      showToast(`${clean} is already in Lane ${laneIndex + 1}`, 'warning');
      return;
    }

    setPersisted(prev => {
      const nextLanes = prev.config.lanes.map((lane, idx) => {
        if (idx !== laneIndex) return lane;
        const names = getSwimmerNamesForLane(lane);
        return { ...lane, swimmersText: [...names, clean].join('\n') };
      });
      return { ...prev, config: { ...prev.config, lanes: nextLanes } };
    });
  }, [config.lanes, setPersisted, showToast]);

  const removeSwimmerFromLane = useCallback((laneIndex: number, waveIdx: number) => {
    setPersisted(prev => {
      const nextLanes = prev.config.lanes.map((lane, idx) => {
        if (idx !== laneIndex) return lane;
        const names = getSwimmerNamesForLane(lane);
        names.splice(waveIdx, 1);
        return { ...lane, swimmersText: names.join('\n') };
      });
      return { ...prev, config: { ...prev.config, lanes: nextLanes } };
    });
  }, [setPersisted]);

  const moveSwimmerInLane = useCallback((laneIndex: number, waveIdx: number, direction: number) => {
    setPersisted(prev => {
      const nextLanes = prev.config.lanes.map((lane, idx) => {
        if (idx !== laneIndex) return lane;
        const names = getSwimmerNamesForLane(lane);
        const targetIdx = waveIdx + direction;
        if (targetIdx < 0 || targetIdx >= names.length) return lane;
        const temp = names[waveIdx];
        names[waveIdx] = names[targetIdx];
        names[targetIdx] = temp;
        return { ...lane, swimmersText: names.join('\n') };
      });
      return { ...prev, config: { ...prev.config, lanes: nextLanes } };
    });
  }, [setPersisted]);

  const setLaneInterval = useCallback((laneIndex: number, intervalSec: number) => {
    const val = Math.min(300, Math.max(0, parseInt(String(intervalSec), 10) || 0));
    setPersisted(prev => {
      const nextLanes = prev.config.lanes.map((lane, idx) =>
        idx === laneIndex ? { ...lane, interval: val } : lane
      );
      return { ...prev, config: { ...prev.config, lanes: nextLanes } };
    });
  }, [setPersisted]);

  const setLaneSwimmersText = useCallback((laneIndex: number, text: string) => {
    setPersisted(prev => {
      const nextLanes = prev.config.lanes.map((lane, idx) =>
        idx === laneIndex ? { ...lane, swimmersText: text } : lane
      );
      return { ...prev, config: { ...prev.config, lanes: nextLanes } };
    });
  }, [setPersisted]);

  const toggleSwimmerAttendance = useCallback((swimmerId: string) => {
    setPersisted(prev => {
      const current = prev.config.presentSwimmerIds || [];
      const next = current.includes(swimmerId)
        ? current.filter(id => id !== swimmerId)
        : [...current, swimmerId];
      return {
        ...prev,
        config: { ...prev.config, presentSwimmerIds: next }
      };
    });
  }, [setPersisted]);

  const markAllSwimmersPresent = useCallback((swimmerIds: string[]) => {
    setPersisted(prev => {
      const merged = Array.from(new Set([...(prev.config.presentSwimmerIds || []), ...swimmerIds]));
      return {
        ...prev,
        config: { ...prev.config, presentSwimmerIds: merged }
      };
    });
    showToast(`Marked ${swimmerIds.length} swimmers present`, 'success');
  }, [setPersisted, showToast]);

  const clearSwimmersAttendance = useCallback((swimmerIds?: string[]) => {
    setPersisted(prev => {
      let next: string[] = [];
      if (swimmerIds && swimmerIds.length > 0) {
        const toRemove = new Set(swimmerIds);
        next = (prev.config.presentSwimmerIds || []).filter(id => !toRemove.has(id));
      }
      return {
        ...prev,
        config: { ...prev.config, presentSwimmerIds: next }
      };
    });
    showToast('Cleared attendance', 'info');
  }, [setPersisted, showToast]);

  const updateSessionDetails = useCallback((details: {
    sessionName?: string;
    sessionDate?: string;
    sessionTime?: string;
    selectedGroupIds?: string[];
  }) => {
    setPersisted(prev => ({
      ...prev,
      config: {
        ...prev.config,
        sessionName: details.sessionName !== undefined ? details.sessionName : prev.config.sessionName,
        sessionDate: details.sessionDate !== undefined ? details.sessionDate : prev.config.sessionDate,
        sessionTime: details.sessionTime !== undefined ? details.sessionTime : prev.config.sessionTime,
        selectedGroupIds: details.selectedGroupIds !== undefined ? details.selectedGroupIds : prev.config.selectedGroupIds
      }
    }));
    showToast('Updated session details', 'success');
  }, [setPersisted, showToast]);

  return {
    setClubName,
    saveGroup,
    deleteGroup,
    saveSwimmer,
    deleteSwimmer,
    bulkAddSwimmers,
    executeImport,
    toggleSessionGroup,
    selectAllSessionGroups,
    clearSessionGroups,
    autoDistributeSwimmers,
    clearAllLanesSwimmers,
    addSwimmerToLane,
    removeSwimmerFromLane,
    moveSwimmerInLane,
    setLaneInterval,
    setLaneSwimmersText,
    toggleSwimmerAttendance,
    markAllSwimmersPresent,
    clearSwimmersAttendance,
    updateSessionDetails
  };
}

