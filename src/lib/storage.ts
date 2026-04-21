/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { TournamentData } from './types';

const STORAGE_KEY = 'cricket_tournament_data';

const INITIAL_DATA: TournamentData = {
  teams: [
    { id: '1', name: 'Design Dynamos', group: 'A', players: [
      { id: 'p1', name: 'John', gender: 'male' }, { id: 'p2', name: 'Mike', gender: 'male' }, { id: 'p3', name: 'Sam', gender: 'male' }, 
      { id: 'p4', name: 'Dave', gender: 'male' }, { id: 'p5', name: 'Chris', gender: 'male' }, { id: 'p6', name: 'Alex', gender: 'male' }, 
      { id: 'p7', name: 'Tom', gender: 'male' }, { id: 'p8', name: 'Bob', gender: 'male' }, { id: 'p9', name: 'Sarah', gender: 'female' }, { id: 'p10', name: 'Emma', gender: 'female' }
    ] },
    { id: '2', name: 'Sales Sharks', group: 'A', players: [
      { id: 'p11', name: 'Alan', gender: 'male' }, { id: 'p12', name: 'Ben', gender: 'male' }, { id: 'p13', name: 'Cole', gender: 'male' }, 
      { id: 'p14', name: 'Dax', gender: 'male' }, { id: 'p15', name: 'Eli', gender: 'male' }, { id: 'p16', name: 'Finn', gender: 'male' }, 
      { id: 'p17', name: 'Gabe', gender: 'male' }, { id: 'p18', name: 'Hank', gender: 'male' }, { id: 'p19', name: 'Lily', gender: 'female' }, { id: 'p20', name: 'Grace', gender: 'female' }
    ] },
    { id: '3', name: 'Ops Owls', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `o-${i}`, name: `Owl-${i}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: '4', name: 'Dev Dragons', group: 'A', players: Array.from({ length: 10 }).map((_, i) => ({ id: `d-${i}`, name: `Drag-${i}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: '5', name: 'HR Heroes', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `h-${i}`, name: `Hero-${i}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: '6', name: 'Tech Titans', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `t-${i}`, name: `Titan-${i}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: '7', name: 'Admin Aces', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `a-${i}`, name: `Ace-${i}`, gender: i < 8 ? 'male' : 'female' })) },
    { id: '8', name: 'Finance Falcons', group: 'B', players: Array.from({ length: 10 }).map((_, i) => ({ id: `f-${i}`, name: `Falc-${i}`, gender: i < 8 ? 'male' : 'female' })) }
  ],
  matches: [
    { id: 'm1', title: 'Group A: Dynamos vs Sharks', teamA: '1', teamB: '2', status: 'live', date: '2026-04-21T09:00:00Z', innings: [{ teamId: '1', battingOrder: ['John', 'Mike'], overs: [{ number: 0, bowler: 'Alan', balls: [{ id: 'b1', type: '1', runs: 1, extras: 0, striker: 'John', nonStriker: 'Mike', bowler: 'Alan' }, { id: 'b2', type: '4', runs: 4, extras: 0, striker: 'Mike', nonStriker: 'John', bowler: 'Alan' }] }] }, { teamId: '2', battingOrder: ['Alan', 'Ben'], overs: [] }] },
    { id: 'm2', title: 'Group A: Owls vs Dragons', teamA: '3', teamB: '4', status: 'upcoming', date: '2026-04-21T10:30:00Z', innings: [{ teamId: '3', battingOrder: [], overs: [] }, { teamId: '4', battingOrder: [], overs: [] }] },
    { id: 'm3', title: 'Group B: Heroes vs Titans', teamA: '5', teamB: '6', status: 'upcoming', date: '2026-04-21T12:00:00Z', innings: [{ teamId: '5', battingOrder: [], overs: [] }, { teamId: '6', battingOrder: [], overs: [] }] },
    { id: 'm4', title: 'Group B: Aces vs Falcons', teamA: '7', teamB: '8', status: 'upcoming', date: '2026-04-21T13:30:00Z', innings: [{ teamId: '7', battingOrder: [], overs: [] }, { teamId: '8', battingOrder: [], overs: [] }] },
    { id: 'm5', title: 'Group A: Dynamos vs Owls', teamA: '1', teamB: '3', status: 'upcoming', date: '2026-04-22T09:00:00Z', innings: [{ teamId: '1', battingOrder: [], overs: [] }, { teamId: '3', battingOrder: [], overs: [] }] },
    { id: 'm6', title: 'Group A: Sharks vs Dragons', teamA: '2', teamB: '4', status: 'upcoming', date: '2026-04-22T10:30:00Z', innings: [{ teamId: '2', battingOrder: [], overs: [] }, { teamId: '4', battingOrder: [], overs: [] }] },
    { id: 'm7', title: 'Group B: Heroes vs Aces', teamA: '5', teamB: '7', status: 'upcoming', date: '2026-04-22T12:00:00Z', innings: [{ teamId: '5', battingOrder: [], overs: [] }, { teamId: '7', battingOrder: [], overs: [] }] },
    { id: 'm8', title: 'Group B: Titans vs Falcons', teamA: '6', teamB: '8', status: 'upcoming', date: '2026-04-22T13:30:00Z', innings: [{ teamId: '6', battingOrder: [], overs: [] }, { teamId: '8', battingOrder: [], overs: [] }] },
    { id: 'm9', title: 'Group A: Dynamos vs Dragons', teamA: '1', teamB: '4', status: 'upcoming', date: '2026-04-23T09:00:00Z', innings: [{ teamId: '1', battingOrder: [], overs: [] }, { teamId: '4', battingOrder: [], overs: [] }] },
    { id: 'm10', title: 'Group A: Sharks vs Owls', teamA: '2', teamB: '3', status: 'upcoming', date: '2026-04-23T10:30:00Z', innings: [{ teamId: '2', battingOrder: [], overs: [] }, { teamId: '3', battingOrder: [], overs: [] }] },
    { id: 'm11', title: 'Group B: Heroes vs Falcons', teamA: '5', teamB: '8', status: 'upcoming', date: '2026-04-23T12:00:00Z', innings: [{ teamId: '5', battingOrder: [], overs: [] }, { teamId: '8', battingOrder: [], overs: [] }] },
    { id: 'm12', title: 'Group B: Titans vs Aces', teamA: '6', teamB: '7', status: 'upcoming', date: '2026-04-23T13:30:00Z', innings: [{ teamId: '6', battingOrder: [], overs: [] }, { teamId: '7', battingOrder: [], overs: [] }] },
    { id: 'm13', title: 'Semi-Final 1 (A1 vs B2)', teamA: '1', teamB: '7', status: 'upcoming', date: '2026-04-24T10:00:00Z', innings: [{ teamId: '1', battingOrder: [], overs: [] }, { teamId: '7', battingOrder: [], overs: [] }] },
    { id: 'm14', title: 'Semi-Final 2 (B1 vs A2)', teamA: '6', teamB: '2', status: 'upcoming', date: '2026-04-24T13:00:00Z', innings: [{ teamId: '6', battingOrder: [], overs: [] }, { teamId: '2', battingOrder: [], overs: [] }] },
    { id: 'm15', title: 'Grand Final', teamA: '1', teamB: '6', status: 'upcoming', date: '2026-04-25T14:00:00Z', innings: [{ teamId: '1', battingOrder: [], overs: [] }, { teamId: '6', battingOrder: [], overs: [] }] }
  ],
  config: {
    tournamentName: 'Company Cricket Cup 2026',
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
