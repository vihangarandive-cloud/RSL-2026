/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RunType = 'dot' | '1' | '2' | '3' | '4' | '6' | 'wide' | 'no-ball' | 'wicket';

export interface Ball {
  id: string;
  type: RunType;
  runs: number;
  extras: number;
  wicket?: {
    player: string;
    type: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'other';
  };
  striker: string;
  nonStriker: string;
  bowler: string;
}

export interface Over {
  number: number;
  bowler: string;
  balls: Ball[];
}

export interface Player {
  id: string;
  name: string;
  gender: 'male' | 'female';
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  group: 'A' | 'B';
  players: Player[];
}

export interface Inning {
  teamId: string;
  battingOrder: string[];
  overs: Over[];
}

export interface Match {
  id: string;
  title: string;
  teamA: string; // Team ID
  teamB: string; // Team ID
  innings: Inning[];
  status: 'upcoming' | 'live' | 'completed';
  result?: string;
  date: string;
}

export interface TournamentData {
  teams: Team[];
  matches: Match[];
  config: {
    logo?: string;
    tournamentName: string;
  };
}
