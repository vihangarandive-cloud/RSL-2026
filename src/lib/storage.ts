/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { TournamentData } from './types';
import { INITIAL_DATA } from './initialData';
import { supabase } from './supabase';

const STORAGE_KEY = 'cricket_tournament_data';
const ROW_ID = 1;

export function useTournament() {
  const [data, setData] = useState<TournamentData>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.matches) && Array.isArray(parsed.teams)) {
            if (!INITIAL_DATA.version || (parsed.version && parsed.version >= INITIAL_DATA.version)) {
              return parsed;
            }
          }
        } catch (e) {
          console.error("Local storage initialization error:", e);
        }
      }
    }
    return INITIAL_DATA;
  });
  const isInitialLoad = useRef(true);
  const skipNextCloudUpdate = useRef(false);

  useEffect(() => {
    // EMERGENCY RESET: If user visits with ?reset=true, wipe everything
    if (window.location.search.includes('reset=true')) {
      console.log("Emergency reset triggered.");
      localStorage.removeItem(STORAGE_KEY);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
      return;
    }

    const loadData = async () => {
      // 1. Load from Supabase (with heavy safety)
      try {
        const { data: cloudData, error } = await supabase
          .from('tournament_data')
          .select('data')
          .eq('id', ROW_ID)
          .single();

        if (!error && cloudData?.data) {
          const remoteData = cloudData.data as TournamentData;
          
          setData(prev => {
            // Only update if there's an actual change to prevent flicker/redundant updates
            if (prev && 
                JSON.stringify(prev.matches) === JSON.stringify(remoteData.matches) && 
                JSON.stringify(prev.config) === JSON.stringify(remoteData.config) &&
                JSON.stringify(prev.teams) === JSON.stringify(remoteData.teams) &&
                prev.version >= (remoteData.version || 0)) {
              return prev;
            }

            const updated = {
               ...prev,
               matches: remoteData.matches || prev.matches || [],
               config: remoteData.config || prev.config || INITIAL_DATA.config,
               teams: remoteData.teams || prev.teams || INITIAL_DATA.teams,
               version: Math.max(remoteData.version || 0, prev.version || 0)
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
          skipNextCloudUpdate.current = true;
        }
      } catch (e) {
        console.error("Cloud load error:", e);
      }
      
      isInitialLoad.current = false;
    };

    loadData();

    // 3. Realtime Listener (with safety)
    const channel = supabase
      .channel('live-scores')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournament_data', filter: `id=eq.${ROW_ID}` },
        (payload) => {
          try {
            const remote = payload.new.data as Partial<TournamentData>;
            if (!remote || !remote.matches) return;

            setData(prev => {
              if (JSON.stringify(prev.matches) === JSON.stringify(remote.matches) && JSON.stringify(prev.teams) === JSON.stringify(remote.teams)) return prev;
              
              skipNextCloudUpdate.current = true;
              const updated = {
                ...prev,
                matches: remote.matches || prev.matches,
                config: remote.config || prev.config,
                teams: remote.teams || prev.teams,
                version: remote.version || prev.version
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
              return updated;
            });
          } catch (e) {
            console.error("Realtime update error:", e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 4. Save to Cloud (Matches only)
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    // Save locally
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const saveToCloud = async () => {
      if (skipNextCloudUpdate.current) {
        skipNextCloudUpdate.current = false;
        return;
      }
      
      try {
        const syncData = {
          version: data.version,
          matches: data.matches,
          config: data.config,
          teams: data.teams
        };

        await supabase
          .from('tournament_data')
          .upsert({ id: ROW_ID, data: syncData, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      } catch (e) {
        console.error("Cloud save failed:", e);
      }
    };

    const timeout = setTimeout(saveToCloud, 1000); // 1s debounce for stability
    return () => clearTimeout(timeout);
  }, [data.matches, data.config, data.teams, data.version]);

  const resetToFactory = async () => {
    if (confirm("Factory Reset: Wipe all data and cloud scores?")) {
      localStorage.removeItem(STORAGE_KEY);
      await supabase.from('tournament_data').delete().eq('id', ROW_ID);
      window.location.reload();
    }
  };

  return [data, setData, resetToFactory] as const;
}
