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
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (INITIAL_DATA.version && (!parsed.version || INITIAL_DATA.version > parsed.version)) {
            setData(INITIAL_DATA);
          } else {
            setData(parsed);
          }
        }
      } catch (e) {
        console.error("Local storage error:", e);
      }

      // Step B: Load from Supabase Cloud
      const { data: cloudData, error } = await supabase
        .from('tournament_data')
        .select('data')
        .eq('id', ROW_ID)
        .single();

      if (!error && cloudData?.data && Object.keys(cloudData.data).length > 0) {
        const remoteData = cloudData.data as TournamentData;
        
        // If cloud data is older than our local versioning, we'll keep local/initial
        if (INITIAL_DATA.version && (!remoteData.version || INITIAL_DATA.version > remoteData.version)) {
          // Push initial data to cloud if cloud is outdated
          await supabase.from('tournament_data').upsert({ id: ROW_ID, data: INITIAL_DATA });
        } else {
          skipNextCloudUpdate.current = true;
          setData(remoteData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
        }
      } else if (error && error.code === 'PGRST116') {
        // No row exists yet, create it with initial data
        await supabase.from('tournament_data').insert({ id: ROW_ID, data: INITIAL_DATA });
      }
      
      isInitialLoad.current = false;
    };

    loadData();

    // Save to Cloud (only if not an incoming update)
    const saveToCloud = async () => {
      if (skipNextCloudUpdate.current) {
        skipNextCloudUpdate.current = false;
        return;
      }
      
      // OPTIMIZATION: Only sync matches and basic config to save bandwidth
      // This prevents the 4MB logo data from crashing the sync
      const syncData = {
        version: data.version,
        matches: data.matches,
        config: data.config
      };

      const { error } = await supabase
        .from('tournament_data')
        .upsert({ 
          id: ROW_ID, 
          data: syncData, // Smaller payload
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) {
        console.error("Cloud Save Error:", error);
      }
    };

    const timeout = setTimeout(saveToCloud, 300);
    return () => clearTimeout(timeout);
  }, [data.matches, data.config, data.version]); // Only trigger when these change

  // 2. Realtime Subscription (Sync Cloud -> Device)
  useEffect(() => {
    const channel = supabase
      .channel('live-scores')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournament_data', filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const remoteSyncData = payload.new.data;
          if (!remoteSyncData) return;

          setData(prev => {
            // Only update if the remote version/data is different to avoid loops
            if (JSON.stringify(prev.matches) === JSON.stringify(remoteSyncData.matches)) {
              return prev;
            }
            
            skipNextCloudUpdate.current = true;
            return {
              ...prev,
              matches: remoteSyncData.matches,
              config: remoteSyncData.config,
              version: remoteSyncData.version
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
