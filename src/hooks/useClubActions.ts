import { useCallback } from 'react';
import { uid } from '../lib/ids';
import { parseBulkSwimmersText } from '../lib/roster';
import { applyImportToClub } from '../lib/exporters';
import { getSwimmerNamesForLane, distributeSwimmersAcrossLanes, getSessionPoolSwimmers } from '../lib/lanes';
import { getISOWeek, formatSetItem, cloneWeeklyPlan } from '../lib/weeks';
import { DEFAULT_ANNUAL_TARGETS, parseTimeToMs } from '../lib/targets';
import type {
  AppConfig,
  ClubData,
  GroupColor,
  ImportOptions,
  PendingImport,
  PersistedState,
  Swimmer,
  SwimmerGroup,
  SwimmingPool,
  PoolCourse,
  Coach,
  CoachRole,
  ScheduledSession,
  WeeklySessionPlan,
  ClubClosure,
  SessionStaffOverride,
  AnnualTarget,
  SwimmerPB,
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
    const name = clubName.trim() || 'DeckGala Swim Club';
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        clubName: name
      }
    }));
    showToast(`Club name updated to ${name}`, 'success');
  }, [setPersisted, showToast]);

  const updateClubProfile = useCallback((profile: {
    clubName: string;
    shortName?: string;
    city?: string;
    country?: string;
    contactEmail?: string;
    contactPhone?: string;
    headCoachName?: string;
    establishedYear?: string;
    motto?: string;
    primaryPoolId?: string;
  }) => {
    const clubName = (profile.clubName || '').trim() || 'DeckGala Swim Club';
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        clubName,
        shortName: (profile.shortName || '').trim() || prev.club.shortName || 'DGSC',
        city: (profile.city || '').trim(),
        country: (profile.country || '').trim(),
        contactEmail: (profile.contactEmail || '').trim(),
        contactPhone: (profile.contactPhone || '').trim(),
        headCoachName: (profile.headCoachName || '').trim(),
        establishedYear: (profile.establishedYear || '').trim(),
        motto: (profile.motto || '').trim(),
        primaryPoolId: profile.primaryPoolId || prev.club.primaryPoolId
      }
    }));
    showToast(`Club profile updated for ${clubName}`, 'success');
    return true;
  }, [setPersisted, showToast]);

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

        const existingSwimmer = currentGrp?.swimmers.find(s => s.id === editingSwimmerId);
        const pbs = swimmerData.personalBests !== undefined ? swimmerData.personalBests : existingSwimmer?.personalBests;

        const updatedSwimmer: Swimmer = {
          id: editingSwimmerId,
          ...payload,
          ...(pbs ? { personalBests: pbs } : {})
        };

        if (currentGrp && currentGrp.id !== groupId) {
          currentGrp.swimmers = currentGrp.swimmers.filter(s => s.id !== editingSwimmerId);
          const destGrp = nextGroups.find(g => g.id === groupId);
          if (destGrp) {
            destGrp.swimmers.push(updatedSwimmer);
          }
        } else if (currentGrp) {
          currentGrp.swimmers = currentGrp.swimmers.map(s =>
            s.id === editingSwimmerId ? updatedSwimmer : s
          );
        }
      } else {
        const destGrp = nextGroups.find(g => g.id === groupId);
        if (destGrp) {
          const newId = uid('sw');
          destGrp.swimmers.push({
            id: newId,
            ...payload,
            ...(swimmerData.personalBests ? { personalBests: swimmerData.personalBests } : {})
          });
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

  const selectPool = useCallback((poolId: string) => {
    setPersisted(prev => {
      const pool = (prev.club.pools || []).find(p => p.id === poolId);
      if (!pool) return prev;
      return {
        ...prev,
        config: {
          ...prev.config,
          selectedPoolId: pool.id,
          laneCount: pool.laneCount,
          poolCourse: pool.length
        }
      };
    });
    const pool = (club.pools || []).find(p => p.id === poolId);
    if (pool) {
      showToast(`Selected ${pool.name} (${pool.laneCount} lanes, ${pool.length})`, 'info');
    }
  }, [club.pools, setPersisted, showToast]);

  const savePool = useCallback((
    poolData: { name: string; laneCount: number; length: PoolCourse; notes?: string },
    editingPoolId?: string | null
  ) => {
    const name = (poolData.name || '').trim();
    if (!name) {
      showToast('Please enter a pool name', 'warning');
      return false;
    }
    const laneCount = Math.min(10, Math.max(1, Math.round(poolData.laneCount) || 6));
    const length = poolData.length || '25m';
    const notes = (poolData.notes || '').trim();

    setPersisted(prev => {
      let nextPools = [...(prev.club.pools || [])];
      let selectedPoolId = prev.config.selectedPoolId;
      let nextLaneCount = prev.config.laneCount;
      let nextPoolCourse = prev.config.poolCourse;

      if (editingPoolId) {
        nextPools = nextPools.map(p =>
          p.id === editingPoolId
            ? { ...p, name, laneCount, length, notes }
            : p
        );
        if (selectedPoolId === editingPoolId) {
          nextLaneCount = laneCount;
          nextPoolCourse = length;
        }
      } else {
        const newPool: SwimmingPool = {
          id: uid('pool'),
          name,
          laneCount,
          length,
          notes
        };
        nextPools.push(newPool);
        selectedPoolId = newPool.id;
        nextLaneCount = laneCount;
        nextPoolCourse = length;
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          pools: nextPools
        },
        config: {
          ...prev.config,
          selectedPoolId,
          laneCount: nextLaneCount,
          poolCourse: nextPoolCourse
        }
      };
    });

    showToast(editingPoolId ? `Updated pool "${name}"` : `Added pool "${name}"`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deletePool = useCallback((poolId: string) => {
    let deleted = false;
    setPersisted(prev => {
      const pools = prev.club.pools || [];
      if (pools.length <= 1) {
        showToast('At least one swimming pool is required', 'warning');
        return prev;
      }
      deleted = true;
      const nextPools = pools.filter(p => p.id !== poolId);
      let selectedPoolId = prev.config.selectedPoolId;
      let nextLaneCount = prev.config.laneCount;
      let nextPoolCourse = prev.config.poolCourse;

      if (selectedPoolId === poolId) {
        const fallback = nextPools[0];
        selectedPoolId = fallback.id;
        nextLaneCount = fallback.laneCount;
        nextPoolCourse = fallback.length;
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          pools: nextPools
        },
        config: {
          ...prev.config,
          selectedPoolId,
          laneCount: nextLaneCount,
          poolCourse: nextPoolCourse
        }
      };
    });

    if (deleted) {
      showToast('Deleted swimming pool', 'info');
    }
    return deleted;
  }, [setPersisted, showToast]);

  const updateSessionDetails = useCallback((details: {
    sessionName?: string;
    sessionDate?: string;
    sessionTime?: string;
    selectedGroupIds?: string[];
    selectedPoolId?: string;
  }) => {
    setPersisted(prev => {
      let nextLaneCount = prev.config.laneCount;
      let nextPoolCourse = prev.config.poolCourse;
      let nextPoolId = details.selectedPoolId !== undefined ? details.selectedPoolId : prev.config.selectedPoolId;
      if (details.selectedPoolId) {
        const pool = (prev.club.pools || []).find(p => p.id === details.selectedPoolId);
        if (pool) {
          nextLaneCount = pool.laneCount;
          nextPoolCourse = pool.length;
        }
      }
      return {
        ...prev,
        config: {
          ...prev.config,
          sessionName: details.sessionName !== undefined ? details.sessionName : prev.config.sessionName,
          sessionDate: details.sessionDate !== undefined ? details.sessionDate : prev.config.sessionDate,
          sessionTime: details.sessionTime !== undefined ? details.sessionTime : prev.config.sessionTime,
          selectedGroupIds: details.selectedGroupIds !== undefined ? details.selectedGroupIds : prev.config.selectedGroupIds,
          selectedPoolId: nextPoolId,
          laneCount: nextLaneCount,
          poolCourse: nextPoolCourse
        }
      };
    });
    showToast('Updated session details', 'success');
  }, [setPersisted, showToast]);

  const saveCoach = useCallback((
    coachData: Partial<Coach> & { name: string; role: CoachRole },
    editingCoachId?: string | null
  ) => {
    const name = (coachData.name || '').trim();
    if (!name) {
      showToast('Please enter a coach name', 'warning');
      return false;
    }

    setPersisted(prev => {
      const coaches = prev.club.coaches || [];
      let nextCoaches: Coach[];
      if (editingCoachId) {
        nextCoaches = coaches.map(c =>
          c.id === editingCoachId
            ? {
                ...c,
                ...coachData,
                name,
                role: coachData.role || 'coach',
                isHeadCoach: Boolean(coachData.isHeadCoach)
              }
            : c
        );
      } else {
        const newCoach: Coach = {
          id: uid('coach'),
          name,
          role: coachData.role || 'coach',
          email: coachData.email || '',
          phone: coachData.phone || '',
          certifications: coachData.certifications || '',
          notes: coachData.notes || '',
          color: coachData.color || 'cyan',
          isHeadCoach: Boolean(coachData.isHeadCoach)
        };
        nextCoaches = [...coaches, newCoach];
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          coaches: nextCoaches
        }
      };
    });

    showToast(editingCoachId ? `Updated coach "${name}"` : `Added coach "${name}"`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteCoach = useCallback((coachId: string) => {
    let deleted = false;
    setPersisted(prev => {
      const coaches = prev.club.coaches || [];
      if (coaches.length <= 1) {
        showToast('At least one coach is required in the club', 'warning');
        return prev;
      }
      deleted = true;
      const nextCoaches = coaches.filter(c => c.id !== coachId);
      return {
        ...prev,
        club: {
          ...prev.club,
          coaches: nextCoaches
        }
      };
    });

    if (deleted) {
      showToast('Deleted coach', 'info');
    }
    return deleted;
  }, [setPersisted, showToast]);

  const saveScheduledSession = useCallback((
    sessionData: Omit<ScheduledSession, 'id'>,
    editingSessionId?: string | null
  ) => {
    const title = (sessionData.title || '').trim();
    if (!title) {
      showToast('Please enter a session title', 'warning');
      return false;
    }

    setPersisted(prev => {
      const sessions = prev.club.scheduledSessions || [];
      let nextSessions: ScheduledSession[];

      if (editingSessionId) {
        nextSessions = sessions.map(s =>
          s.id === editingSessionId
            ? { ...sessionData, id: s.id, title }
            : s
        );
      } else {
        const newSession: ScheduledSession = {
          ...sessionData,
          id: uid('sched'),
          title
        };
        nextSessions = [...sessions, newSession];
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          scheduledSessions: nextSessions
        }
      };
    });

    showToast(editingSessionId ? `Updated scheduled session "${title}"` : `Added scheduled session "${title}"`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteScheduledSession = useCallback((sessionId: string) => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        scheduledSessions: (prev.club.scheduledSessions || []).filter(s => s.id !== sessionId),
        staffOverrides: (prev.club.staffOverrides || []).filter(o => o.scheduledSessionId !== sessionId)
      }
    }));
    showToast('Deleted scheduled session', 'info');
    return true;
  }, [setPersisted, showToast]);

  const saveStaffOverride = useCallback((
    overrideData: Omit<SessionStaffOverride, 'id'>,
    editingOverrideId?: string | null
  ) => {
    setPersisted(prev => {
      const overrides = prev.club.staffOverrides || [];
      let nextOverrides: SessionStaffOverride[];

      if (editingOverrideId) {
        nextOverrides = overrides.map(o =>
          o.id === editingOverrideId
            ? { ...overrideData, id: o.id }
            : o
        );
      } else {
        const filtered = overrides.filter(
          o => !(o.scheduledSessionId === overrideData.scheduledSessionId && o.date === overrideData.date)
        );
        const newOverride: SessionStaffOverride = {
          ...overrideData,
          id: uid('override')
        };
        nextOverrides = [...filtered, newOverride];
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          staffOverrides: nextOverrides
        }
      };
    });

    showToast('Saved staffing cover override', 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteStaffOverride = useCallback((overrideId: string) => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        staffOverrides: (prev.club.staffOverrides || []).filter(o => o.id !== overrideId)
      }
    }));
    showToast('Removed staffing override', 'info');
    return true;
  }, [setPersisted, showToast]);

  const saveClubClosure = useCallback((
    closureData: Omit<ClubClosure, 'id'>,
    editingClosureId?: string | null
  ) => {
    const title = (closureData.title || '').trim();
    if (!title) {
      showToast('Please enter a closure name', 'warning');
      return false;
    }

    setPersisted(prev => {
      const closures = prev.club.clubClosures || [];
      let nextClosures: ClubClosure[];

      if (editingClosureId) {
        nextClosures = closures.map(c =>
          c.id === editingClosureId
            ? { ...closureData, id: c.id, title }
            : c
        );
      } else {
        const newClosure: ClubClosure = {
          ...closureData,
          id: uid('closure'),
          title
        };
        nextClosures = [...closures, newClosure];
      }

      return {
        ...prev,
        club: {
          ...prev.club,
          clubClosures: nextClosures
        }
      };
    });

    showToast(editingClosureId ? `Updated closure "${title}"` : `Added closure "${title}"`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteClubClosure = useCallback((closureId: string) => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        clubClosures: (prev.club.clubClosures || []).filter(c => c.id !== closureId)
      }
    }));
    showToast('Deleted club closure', 'info');
    return true;
  }, [setPersisted, showToast]);

  const saveWeeklySessionPlan = useCallback((
    sessionId: string,
    planData: Omit<WeeklySessionPlan, 'id'>,
    existingPlanId?: string | null
  ) => {
    setPersisted(prev => {
      const sessions = prev.club.scheduledSessions || [];
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return prev;

      const currentPlans = session.weeklyPlans || [];
      const planId = existingPlanId || `wplan-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newPlan: WeeklySessionPlan = {
        ...planData,
        id: planId
      };

      let nextPlans: WeeklySessionPlan[];
      if (existingPlanId) {
        nextPlans = currentPlans.map(p => (p.id === existingPlanId ? newPlan : p));
      } else {
        const exists = currentPlans.some(p => p.weekKey === planData.weekKey);
        if (exists) {
          nextPlans = currentPlans.map(p => (p.weekKey === planData.weekKey ? newPlan : p));
        } else {
          nextPlans = [...currentPlans, newPlan];
        }
      }

      const nextSessions = sessions.map(s =>
        s.id === sessionId ? { ...s, weeklyPlans: nextPlans } : s
      );

      return {
        ...prev,
        club: {
          ...prev.club,
          scheduledSessions: nextSessions
        }
      };
    });

    showToast(`Saved Week ${planData.weekNumber} Briefing & Set List`, 'success');
    return true;
  }, [setPersisted, showToast]);

  const deleteWeeklySessionPlan = useCallback((sessionId: string, weekKey: string) => {
    setPersisted(prev => {
      const sessions = prev.club.scheduledSessions || [];
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return prev;

      const nextPlans = (session.weeklyPlans || []).filter(p => p.weekKey !== weekKey);
      const nextSessions = sessions.map(s =>
        s.id === sessionId ? { ...s, weeklyPlans: nextPlans } : s
      );

      return {
        ...prev,
        club: {
          ...prev.club,
          scheduledSessions: nextSessions
        }
      };
    });

    showToast(`Removed weekly plan for ${weekKey}`, 'info');
    return true;
  }, [setPersisted, showToast]);

  const cloneWeeklySessionPlan = useCallback((sessionId: string, fromWeekKey: string, toWeekKey: string) => {
    let success = false;
    setPersisted(prev => {
      const sessions = prev.club.scheduledSessions || [];
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return prev;

      const sourcePlan = (session.weeklyPlans || []).find(p => p.weekKey === fromWeekKey);
      if (!sourcePlan) return prev;

      const cloned = cloneWeeklyPlan(sourcePlan, toWeekKey);
      const currentPlans = (session.weeklyPlans || []).filter(p => p.weekKey !== toWeekKey);
      const nextPlans = [...currentPlans, cloned];

      const nextSessions = sessions.map(s =>
        s.id === sessionId ? { ...s, weeklyPlans: nextPlans } : s
      );

      success = true;
      return {
        ...prev,
        club: {
          ...prev.club,
          scheduledSessions: nextSessions
        }
      };
    });

    if (success) {
      showToast(`Cloned briefing & set list from ${fromWeekKey} to ${toWeekKey}`, 'success');
    } else {
      showToast(`No plan found to clone from ${fromWeekKey}`, 'warning');
    }
    return success;
  }, [setPersisted, showToast]);

  const loadSessionFromSchedule = useCallback((
    scheduledSession: ScheduledSession,
    targetDate?: string
  ) => {
    setPersisted(prev => {
      const today = targetDate || new Date().toISOString().slice(0, 10);
      const pool = (prev.club.pools || []).find(p => p.id === scheduledSession.poolId) || prev.club.pools[0];

      const override = (prev.club.staffOverrides || []).find(
        o => o.scheduledSessionId === scheduledSession.id && o.date === today
      );

      const assignedCoachId = override ? override.assignedCoachId : scheduledSession.defaultCoachId;
      const coveringCoachId = override ? override.assignedCoachId : undefined;

      const presentIds = prev.club.groups
        .filter(g => scheduledSession.groupIds.includes(g.id))
        .flatMap(g => g.swimmers.map(s => s.id));

      const { weekKey, week } = getISOWeek(today);
      const weeklyPlan = (scheduledSession.weeklyPlans || []).find(
        wp => wp.weekKey === weekKey || wp.weekNumber === week
      );

      const notes = weeklyPlan?.briefing || scheduledSession.headCoachNotes || '';
      let setName = prev.config.setName;
      if (weeklyPlan && weeklyPlan.setList && weeklyPlan.setList.length > 0) {
        const mainSet = weeklyPlan.setList.find(s => s.intensity === 'threshold' || s.intensity === 'lactate' || s.intensity === 'sprint') || weeklyPlan.setList[0];
        setName = formatSetItem(mainSet);
      }

      return {
        ...prev,
        currentView: 'session',
        config: {
          ...prev.config,
          sessionName: scheduledSession.title,
          sessionDate: today,
          sessionTime: scheduledSession.startTime,
          selectedPoolId: pool?.id,
          laneCount: pool?.laneCount || prev.config.laneCount,
          poolCourse: pool?.length || prev.config.poolCourse,
          selectedGroupIds: scheduledSession.groupIds,
          presentSwimmerIds: presentIds,
          assignedCoachId,
          coveringCoachId,
          headCoachNotes: notes,
          setName,
          scheduledSessionId: scheduledSession.id,
          activeWeeklyPlan: weeklyPlan
        }
      };
    });

    showToast(`Loaded "${scheduledSession.title}" into Session`, 'success');
  }, [setPersisted, showToast]);

  const saveAnnualTarget = useCallback((
    targetData: Partial<AnnualTarget> & { competitionName: string },
    editingTargetId: string | null = null
  ) => {
    const compName = (targetData.competitionName || '').trim();
    if (!compName) {
      showToast('Please enter the competition name', 'warning');
      return false;
    }
    const qualTime = (targetData.qualifyingTime || '').trim();
    if (!qualTime) {
      showToast('Please enter a qualifying time (e.g. 1:02.50)', 'warning');
      return false;
    }

    const qualMs = targetData.qualifyingTimeMs || parseTimeToMs(qualTime) || 0;
    const consTime = (targetData.considerationTime || '').trim();
    const consMs = consTime ? (targetData.considerationTimeMs || parseTimeToMs(consTime) || undefined) : undefined;

    const payload: AnnualTarget = {
      id: editingTargetId || uid('target'),
      competitionName: compName,
      level: targetData.level || 'county',
      year: targetData.year || new Date().getFullYear(),
      stroke: targetData.stroke || 'Freestyle',
      distance: Number(targetData.distance) || 100,
      course: targetData.course || 'SCM',
      gender: targetData.gender || 'open',
      minAge: targetData.minAge !== undefined && targetData.minAge !== null && targetData.minAge !== '' ? Number(targetData.minAge) : undefined,
      maxAge: targetData.maxAge !== undefined && targetData.maxAge !== null && targetData.maxAge !== '' ? Number(targetData.maxAge) : undefined,
      qualifyingTime: qualTime,
      qualifyingTimeMs: qualMs,
      considerationTime: consTime || undefined,
      considerationTimeMs: consMs,
      notes: (targetData.notes || '').trim()
    };

    setPersisted(prev => {
      const currentTargets = prev.club.annualTargets || [];
      let updated: AnnualTarget[];
      if (editingTargetId) {
        updated = currentTargets.map(t => (t.id === editingTargetId ? payload : t));
      } else {
        updated = [...currentTargets, payload];
      }
      return {
        ...prev,
        club: {
          ...prev.club,
          annualTargets: updated
        }
      };
    });

    showToast(
      editingTargetId ? `Updated target for ${compName}` : `Added target standard for ${compName}`,
      'success'
    );
    return true;
  }, [setPersisted, showToast]);

  const deleteAnnualTarget = useCallback((targetId: string) => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        annualTargets: (prev.club.annualTargets || []).filter(t => t.id !== targetId)
      }
    }));
    showToast('Deleted annual target standard', 'info');
    return true;
  }, [setPersisted, showToast]);

  const resetAnnualTargetsToDefault = useCallback(() => {
    setPersisted(prev => ({
      ...prev,
      club: {
        ...prev.club,
        annualTargets: [...DEFAULT_ANNUAL_TARGETS]
      }
    }));
    showToast('Reset annual targets to official default standards', 'success');
  }, [setPersisted, showToast]);

  const saveSwimmerPBs = useCallback((swimmerId: string, pbs: SwimmerPB[]) => {
    setPersisted(prev => {
      const nextGroups = prev.club.groups.map(g => ({
        ...g,
        swimmers: g.swimmers.map(s => {
          if (s.id === swimmerId) {
            // Also update legacy pb100m if a 100m Free PB exists
            const free100 = pbs.find(p => p.stroke === 'Freestyle' && p.distance === 100);
            return {
              ...s,
              personalBests: pbs,
              ...(free100?.time ? { pb100m: free100.time } : {})
            };
          }
          return s;
        })
      }));

      return {
        ...prev,
        club: {
          ...prev.club,
          groups: nextGroups
        }
      };
    });

    showToast('Personal bests and target standards saved', 'success');
    return true;
  }, [setPersisted, showToast]);

  return {
    setClubName,
    updateClubProfile,
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
    updateSessionDetails,
    selectPool,
    savePool,
    deletePool,
    saveCoach,
    deleteCoach,
    saveScheduledSession,
    deleteScheduledSession,
    saveStaffOverride,
    deleteStaffOverride,
    saveClubClosure,
    deleteClubClosure,
    saveWeeklySessionPlan,
    deleteWeeklySessionPlan,
    cloneWeeklySessionPlan,
    loadSessionFromSchedule,
    saveAnnualTarget,
    deleteAnnualTarget,
    resetAnnualTargetsToDefault,
    saveSwimmerPBs
  };
}

