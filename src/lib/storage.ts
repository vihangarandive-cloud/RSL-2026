/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TournamentData } from './types';

const STORAGE_KEY = 'cricket_tournament_data';

const INITIAL_DATA: TournamentData = {
  teams: [
    { id: 't1', name: 'Royal Warriors', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p1-${i}`, name: `RW Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't2', name: 'Shadow Warriors', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p2-${i}`, name: `SW Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't3', name: 'Black Panthers', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p3-${i}`, name: `BP Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't4', name: 'Thunder Strikers', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p4-${i}`, name: `TS Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't5', name: 'Super Phoenix', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p5-${i}`, name: `SP Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't6', name: 'Gladiators', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p6-${i}`, name: `GL Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't7', name: 'Battle Kings', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p7-${i}`, name: `BK Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: 't8', name: 'RF Fire Bolts', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `p8-${i}`, name: `RF Player ${i+1}`, gender: i < 8 ? 'male' : 'female' })) }
  ],
  matches: [
    // Group A
    { id: 'm1', title: 'Match 1: Royal Warriors vs Shadow Warriors', teamA: 't1', teamB: 't2', status: 'upcoming', date: '2026-04-22T09:00:00Z', innings: [{ teamId: 't1', battingOrder: [], overs: [] }, { teamId: 't2', battingOrder: [], overs: [] }] },
    { id: 'm3', title: 'Match 3: Black Panthers vs Thunder Strikers', teamA: 't3', teamB: 't4', status: 'upcoming', date: '2026-04-22T12:00:00Z', innings: [{ teamId: 't3', battingOrder: [], overs: [] }, { teamId: 't4', battingOrder: [], overs: [] }] },
    { id: 'm5', title: 'Match 5: Royal Warriors vs Black Panthers', teamA: 't1', teamB: 't3', status: 'upcoming', date: '2026-04-23T09:00:00Z', innings: [{ teamId: 't1', battingOrder: [], overs: [] }, { teamId: 't3', battingOrder: [], overs: [] }] },
    { id: 'm7', title: 'Match 7: Shadow Warriors vs Thunder Strikers', teamA: 't2', teamB: 't4', status: 'upcoming', date: '2026-04-23T12:00:00Z', innings: [{ teamId: 't2', battingOrder: [], overs: [] }, { teamId: 't4', battingOrder: [], overs: [] }] },
    { id: 'm9', title: 'Match 9: Royal Warriors vs Thunder Strikers', teamA: 't1', teamB: 't4', status: 'upcoming', date: '2026-04-24T09:00:00Z', innings: [{ teamId: 't1', battingOrder: [], overs: [] }, { teamId: 't4', battingOrder: [], overs: [] }] },
    { id: 'm11', title: 'Match 11: Shadow Warriors vs Black Panthers', teamA: 't2', teamB: 't3', status: 'upcoming', date: '2026-04-24T12:00:00Z', innings: [{ teamId: 't2', battingOrder: [], overs: [] }, { teamId: 't3', battingOrder: [], overs: [] }] },
    
    // Group B
    { id: 'm2', title: 'Match 2: Super Phoenix vs Gladiators', teamA: 't5', teamB: 't6', status: 'upcoming', date: '2026-04-22T10:30:00Z', innings: [{ teamId: 't5', battingOrder: [], overs: [] }, { teamId: 't6', battingOrder: [], overs: [] }] },
    { id: 'm4', title: 'Match 4: Battle Kings vs RF Fire Bolts', teamA: 't7', teamB: 't8', status: 'upcoming', date: '2026-04-22T13:30:00Z', innings: [{ teamId: 't7', battingOrder: [], overs: [] }, { teamId: 't8', battingOrder: [], overs: [] }] },
    { id: 'm6', title: 'Match 6: Super Phoenix vs Battle Kings', teamA: 't5', teamB: 't7', status: 'upcoming', date: '2026-04-23T10:30:00Z', innings: [{ teamId: 't5', battingOrder: [], overs: [] }, { teamId: 't7', battingOrder: [], overs: [] }] },
    { id: 'm8', title: 'Match 8: Gladiators vs RF Fire Bolts', teamA: 't6', teamB: 't8', status: 'upcoming', date: '2026-04-23T13:30:00Z', innings: [{ teamId: 't6', battingOrder: [], overs: [] }, { teamId: 't8', battingOrder: [], overs: [] }] },
    { id: 'm10', title: 'Match 10: Super Phoenix vs RF Fire Bolts', teamA: 't5', teamB: 't8', status: 'upcoming', date: '2026-04-24T10:30:00Z', innings: [{ teamId: 't5', battingOrder: [], overs: [] }, { teamId: 't8', battingOrder: [], overs: [] }] },
    { id: 'm12', title: 'Match 12: Gladiators vs Battle Kings', teamA: 't6', teamB: 't7', status: 'upcoming', date: '2026-04-24T13:30:00Z', innings: [{ teamId: 't6', battingOrder: [], overs: [] }, { teamId: 't7', battingOrder: [], overs: [] }] },

    // Knockouts
    { id: 'm13', title: 'Semi-Final 1 (A1 vs B2)', teamA: 't1', teamB: 't6', status: 'upcoming', date: '2026-04-25T10:00:00Z', innings: [{ teamId: 't1', battingOrder: [], overs: [] }, { teamId: 't6', battingOrder: [], overs: [] }] },
    { id: 'm14', title: 'Semi-Final 2 (B1 vs A2)', teamA: 't5', teamB: 't2', status: 'upcoming', date: '2026-04-25T13:00:00Z', innings: [{ teamId: 't5', battingOrder: [], overs: [] }, { teamId: 't2', battingOrder: [], overs: [] }] },
    { id: 'm15', title: 'Grand Final', teamA: 't1', teamB: 't5', status: 'upcoming', date: '2026-04-26T14:00:00Z', innings: [{ teamId: 't1', battingOrder: [], overs: [] }, { teamId: 't5', battingOrder: [], overs: [] }] }
  ],
  config: {
    tournamentName: 'RSL 2026',
    logo: ''
  }
};

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
