import { useState, useEffect, useCallback } from 'react';
import { loadPersistedState, savePersistedState } from '../lib/storage';
import type { AppConfig, ClubData, PersistedState, SwimResult, ViewName } from '../types';

export function usePersistentState() {
  const [persisted, setPersisted] = useState<PersistedState>(() => loadPersistedState());

  useEffect(() => {
    savePersistedState(persisted);
  }, [persisted]);

  const setCurrentView = useCallback((view: ViewName) => {
    setPersisted(prev => ({ ...prev, currentView: view }));
  }, []);

  const updateConfig = useCallback((updater: Partial<AppConfig> | ((prev: AppConfig) => AppConfig)) => {
    setPersisted(prev => {
      const nextConfig = typeof updater === 'function' ? updater(prev.config) : { ...prev.config, ...updater };
      return { ...prev, config: nextConfig };
    });
  }, []);

  const setResults = useCallback((updater: SwimResult[] | ((prev: SwimResult[]) => SwimResult[])) => {
    setPersisted(prev => {
      const nextResults = typeof updater === 'function' ? updater(prev.results) : updater;
      return { ...prev, results: nextResults };
    });
  }, []);

  const updateClub = useCallback((updater: Partial<ClubData> | ((prev: ClubData) => ClubData)) => {
    setPersisted(prev => {
      const nextClub = typeof updater === 'function' ? updater(prev.club) : { ...prev.club, ...updater };
      return { ...prev, club: nextClub };
    });
  }, []);

  const setActiveGroupId = useCallback((groupId: string | null) => {
    setPersisted(prev => ({ ...prev, activeGroupId: groupId }));
  }, []);

  return {
    currentView: persisted.currentView,
    config: persisted.config,
    results: persisted.results,
    club: persisted.club,
    activeGroupId: persisted.activeGroupId,
    setCurrentView,
    updateConfig,
    setResults,
    updateClub,
    setActiveGroupId,
    setPersisted
  };
}

