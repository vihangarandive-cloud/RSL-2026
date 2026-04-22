/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, TournamentData } from './types';

export function calculateInningsStats(match: Match, inningIndex: number) {
  const inning = match.innings[inningIndex];
  if (!inning) return { runs: 0, wickets: 0, overs: 0, balls: 0 };

  let totalRuns = 0;
  let totalWickets = 0;
  let totalLegalBalls = 0;

  inning.overs.forEach(over => {
    over.balls.forEach(ball => {
      totalRuns += ball.runs + ball.extras;
      if (ball.type === 'wicket') totalWickets++;
      if (ball.type !== 'wide' && ball.type !== 'no-ball') totalLegalBalls++;
    });
  });

  let oversCompleted = 0;
  let extraBalls = 0;

  if (totalLegalBalls <= 4) {
    oversCompleted = totalLegalBalls === 4 ? 1 : 0;
    extraBalls = totalLegalBalls === 4 ? 0 : totalLegalBalls;
  } else {
    const ballsAfterFirst = totalLegalBalls - 4;
    oversCompleted = Math.floor(ballsAfterFirst / 6) + 1;
    extraBalls = ballsAfterFirst % 6;
  }

  const oversFormatted = `${oversCompleted}.${extraBalls}`;

  const effectiveOvers = oversCompleted + (extraBalls / (oversCompleted === 0 ? 4 : 6));

  return {
    runs: totalRuns,
    wickets: totalWickets,
    overs: oversFormatted,
    balls: totalLegalBalls,
    effectiveOvers: effectiveOvers || 1
  };
}

export function calculateNRR(teamId: string, tournament: TournamentData) {
  let runsScored = 0;
  let oversFaced = 0;
  let runsConceded = 0;
  let oversBowled = 0;
  const MAX_OVERS = 6;

  tournament.matches.filter(m => m.status === 'completed').forEach(match => {
    const isTeamA = match.teamA === teamId;
    const isTeamB = match.teamB === teamId;
    
    if (!isTeamA && !isTeamB) return;

    const teamIndex = isTeamA ? 0 : 1;
    const oppIndex = isTeamA ? 1 : 0;

    const teamInning = match.innings[teamIndex];
    const oppInning = match.innings[oppIndex];

    if (teamInning) {
      const stats = calculateInningsStats(match, teamIndex);
      runsScored += stats.runs;
      if (stats.wickets >= 5) { 
         oversFaced += MAX_OVERS;
      } else {
         oversFaced += Math.floor(stats.balls / 6) + (stats.balls % 6) / 6;
      }
    }

    if (oppInning) {
      const stats = calculateInningsStats(match, oppIndex);
      runsConceded += stats.runs;
      if (stats.wickets >= 5) {
        oversBowled += MAX_OVERS;
      } else {
        oversBowled += Math.floor(stats.balls / 6) + (stats.balls % 6) / 6;
      }
    }
  });

  if (oversFaced === 0 || oversBowled === 0) return 0;
  return (runsScored / oversFaced) - (runsConceded / oversBowled);
}

export function getTournamentAwards(tournament: TournamentData) {
  const playerStats: { [name: string]: { runs: number, balls: number, wickets: number, runsConceded: number, ballsBowled: number, gender: 'male' | 'female', team: string } } = {};

  // Initialize all players
  tournament.teams.forEach(team => {
    team.players.forEach(player => {
      playerStats[player.name] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, gender: player.gender, team: team.name };
    });
  });

  // Calculate stats from all matches
  tournament.matches.forEach(match => {
    match.innings.forEach(inning => {
      inning.overs.forEach(over => {
        over.balls.forEach(ball => {
          // Batting
          const strikerName = ball.striker?.trim();
          if (strikerName && playerStats[strikerName]) {
            playerStats[strikerName].runs += ball.runs;
            if (ball.type !== 'wide' && ball.type !== 'no-ball') {
              playerStats[strikerName].balls += 1;
            }
          }
          // Bowling
          const bowlerName = ball.bowler?.trim();
          if (bowlerName && playerStats[bowlerName]) {
            playerStats[bowlerName].runsConceded += ball.runs + ball.extras;
            if (ball.type !== 'wide' && ball.type !== 'no-ball') {
               playerStats[bowlerName].ballsBowled += 1;
            }
            if (ball.type === 'wicket') {
              playerStats[bowlerName].wickets += 1;
            }
          }
        });
      });
    });
  });

  const players = Object.keys(playerStats).map(name => ({
    name,
    ...playerStats[name],
    allRoundScore: playerStats[name].runs + (playerStats[name].wickets * 20)
  })).filter(p => p.runs > 0 || p.wickets > 0);

  const malePlayers = players.filter(p => p.gender === 'male');
  const femalePlayers = players.filter(p => p.gender === 'female');

  const finalMatch = tournament.matches.find(m => m.id === 'm15');
  let motmFinale = 'N/A';
  if (finalMatch && finalMatch.status === 'completed') {
    // Basic MOTM logic for finale: most runs or wickets in that match
    const matchPlayers: { [name: string]: number } = {};
    finalMatch.innings.forEach(inn => inn.overs.forEach(ov => ov.balls.forEach(b => {
      matchPlayers[b.striker] = (matchPlayers[b.striker] || 0) + b.runs;
      if (b.type === 'wicket') matchPlayers[b.bowler] = (matchPlayers[b.bowler] || 0) + 20;
    })));
    const best = Object.entries(matchPlayers).sort((a, b) => b[1] - a[1])[0];
    if (best) motmFinale = best[0];
  }

  return {
    playerOfSeriesMale: malePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0] ? {
      ...malePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0],
      reason: `${malePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0].runs} Runs & ${malePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0].wickets} Wkts`
    } : null,
    playerOfSeriesFemale: femalePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0] ? {
      ...femalePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0],
      reason: `${femalePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0].runs} Runs & ${femalePlayers.sort((a, b) => b.allRoundScore - a.allRoundScore)[0].wickets} Wkts`
    } : null,
    bestBatsmanMale: malePlayers.sort((a, b) => b.runs - a.runs)[0] ? {
      ...malePlayers.sort((a, b) => b.runs - a.runs)[0],
      reason: `${malePlayers.sort((a, b) => b.runs - a.runs)[0].runs} Runs`
    } : null,
    bestBatsmanFemale: femalePlayers.sort((a, b) => b.runs - a.runs)[0] ? {
      ...femalePlayers.sort((a, b) => b.runs - a.runs)[0],
      reason: `${femalePlayers.sort((a, b) => b.runs - a.runs)[0].runs} Runs`
    } : null,
    bestBowlerMale: malePlayers.sort((a, b) => b.wickets - a.wickets)[0] ? {
      ...malePlayers.sort((a, b) => b.wickets - a.wickets)[0],
      reason: `${malePlayers.sort((a, b) => b.wickets - a.wickets)[0].wickets} Wickets`
    } : null,
    bestBowlerFemale: femalePlayers.sort((a, b) => b.wickets - a.wickets)[0] ? {
      ...femalePlayers.sort((a, b) => b.wickets - a.wickets)[0],
      reason: `${femalePlayers.sort((a, b) => b.wickets - a.wickets)[0].wickets} Wickets`
    } : null,
    manOfTheMatchFinale: motmFinale
  };
}

export function getStandings(tournament: TournamentData) {
  const table = tournament.teams.map(team => {
    let played = 0;
    let won = 0;
    let lost = 0;
    let nr = 0;
    
    tournament.matches.filter(m => m.status === 'completed').forEach(m => {
      if (m.teamA === team.id || m.teamB === team.id) {
        played++;
        // Very basic result logic
        if (m.result?.includes(team.name)) won++;
        else lost++;
      }
    });

    return {
      ...team,
      played,
      won,
      lost,
      nr,
      points: won * 2 + nr * 1,
      nrr: calculateNRR(team.id, tournament)
    };
  });

  return table.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
}
