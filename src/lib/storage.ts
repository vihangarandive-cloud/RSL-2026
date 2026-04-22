/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TournamentData } from './types';
import { INITIAL_DATA } from './initialData';

const STORAGE_KEY = 'cricket_tournament_data';

export function useTournament() {
  const [data, setData] = useState<TournamentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error("Storage error:", e);
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e instanceof Error && e.name === 'QuotaExceededError') {
        alert("Memory full! Please use smaller images or clear some data.");
      }
      console.error("Failed to save tournament data:", e);
    }
  }, [data]);

  return [data, setData] as const;
}
