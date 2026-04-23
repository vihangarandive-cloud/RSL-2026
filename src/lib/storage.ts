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

    // 2. Realtime Subscription (Sync Cloud -> Device)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournament_data', filter: `id=eq.${ROW_ID}` },
        (payload) => {
          const newData = payload.new.data as TournamentData;
          // Avoid loop: Only update state if someone else changed the data
          skipNextCloudUpdate.current = true;
          setData(newData);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
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
      
      const { error } = await supabase
        .from('tournament_data')
        .upsert({ 
          id: ROW_ID, 
          data: data, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });

      if (error) {
        console.error("Cloud Save Error:", error);
      }
    };

    const timeout = setTimeout(saveToCloud, 200); // 200ms is near-instant
    return () => clearTimeout(timeout);
  }, [data]);

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
