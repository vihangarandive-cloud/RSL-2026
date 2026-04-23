/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { TournamentData } from './types';
import { INITIAL_DATA } from './initialData';
import { supabase } from './supabase';

const STORAGE_KEY = 'cricket_tournament_data';
const ROW_ID = 1; // We use a single row to store the tournament data

export function useTournament() {
  const [data, setData] = useState<TournamentData>(INITIAL_DATA);
  const isInitialLoad = useRef(true);
  const skipNextCloudUpdate = useRef(false);

  // 1. Initial Data Loading (Local then Cloud)
  useEffect(() => {
    const loadData = async () => {
      // Step A: Load from LocalStorage first for instant UI
      let localData = INITIAL_DATA;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (INITIAL_DATA.version && (!parsed.version || INITIAL_DATA.version > parsed.version)) {
            localData = INITIAL_DATA;
          } else {
            localData = parsed;
          }
        }
      } catch (e) {
        console.error("Local storage error:", e);
      }
      setData(localData);

      // Step B: Load from Supabase Cloud and MERGE
      const { data: cloudData, error } = await supabase
        .from('tournament_data')
        .select('data')
        .eq('id', ROW_ID)
        .single();

      if (!error && cloudData?.data) {
        const remoteData = cloudData.data as Partial<TournamentData>;
        
        // IMPORTANT: Merge remote matches into local data to avoid losing teams/logos
        setData(prev => {
          const merged = {
            ...prev,
            ...remoteData,
            matches: remoteData.matches || prev.matches,
            config: remoteData.config || prev.config,
            version: remoteData.version || prev.version
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });
        skipNextCloudUpdate.current = true;
      } else if (error && error.code === 'PGRST116') {
        // No row exists yet, create it with initial data
        await supabase.from('tournament_data').insert({ id: ROW_ID, data: INITIAL_DATA });
      }
      
      isInitialLoad.current = false;
    };

    loadData();

    // 2. Realtime Subscription (Sync Cloud -> Device)
    const channel = supabase
      .channel('live-scores')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournament_data', filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const remoteSyncData = payload.new.data;
          if (!remoteSyncData) return;

          setData(prev => {
            // Avoid loops
            if (JSON.stringify(prev.matches) === JSON.stringify(remoteSyncData.matches)) {
              return prev;
            }
            
            skipNextCloudUpdate.current = true;
            const updated = {
              ...prev,
              matches: remoteSyncData.matches || prev.matches,
              config: remoteSyncData.config || prev.config,
              version: remoteSyncData.version || prev.version
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Save Changes (Device -> Cloud & LocalStorage)
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    // Save to local storage for offline access
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Save to Cloud (only if not an incoming update)
    const saveToCloud = async () => {
      if (skipNextCloudUpdate.current) {
        skipNextCloudUpdate.current = false;
        return;
      }
      
      // OPTIMIZATION: Only sync matches and config to keep it fast
      const syncData = {
        version: data.version,
        matches: data.matches,
        config: data.config,
        // We only include teams if the size is small, but for scores we just stick to matches
      };

      const { error } = await supabase
        .from('tournament_data')
        .upsert({ 
          id: ROW_ID, 
          data: syncData, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) {
        console.error("Cloud Save Error:", error);
      }
    };

    const timeout = setTimeout(saveToCloud, 400); 
    return () => clearTimeout(timeout);
  }, [data.matches, data.config, data.version]); 

  // Helper to manually force a reset
  const resetToFactory = async () => {
    if (confirm("This will reset everything to the code defaults. Continue?")) {
      localStorage.removeItem(STORAGE_KEY);
      await supabase.from('tournament_data').delete().eq('id', ROW_ID);
      window.location.reload();
    }
  };

  return [data, setData, resetToFactory] as const;
}
