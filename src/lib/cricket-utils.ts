/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, TournamentData, Team } from './types';

export function getMatchResultString(match: Match, teams: Team[]): string {
  if (match.result && (match.result.includes('Super Over') || match.result.includes('Draw'))) {
    return match.result;
  }
  const statsA = calculateInningsStats(match, 0);
  const statsB = calculateInningsStats(match, 1);
  const teamA = teams.find(t => t.id === match.teamA);
  const teamB = teams.find(t => t.id === match.teamB);

  if (statsA.runs > statsB.runs) {
    return `${teamA?.name} won by ${statsA.runs - statsB.runs} runs`;
  } else if (statsB.runs > statsA.runs) {
    const wicketsLeft = 10 - statsB.wickets; // Assuming 10 wickets available
    return `${teamB?.name} won by ${wicketsLeft} wickets`;
  } else {
    return 'Match Tied';
  }
}

export function calculateInningsStats(match: Match, inningIndex: number) {
  const inning = match.innings[inningIndex];
  if (!inning) return { runs: 0, wickets: 0, overs: 0, balls: 0 };

  let totalRuns = 0;
  let totalWickets = 0;
  let totalBalls = 0;

  inning.overs.forEach(over => {
    over.balls.forEach(ball => {
      totalRuns += ball.runs + ball.extras;
      if (ball.type === 'wicket') totalWickets++;
      // All balls are "valid" EXCEPT those explicitly marked isInvalid (re-bowled)
      if (!ball.isInvalid) {
        totalBalls++;
      }
    });
  });

  // Calculate overs completed based on rules:
  // Over 1 (idx 0): 4 balls
  // Others: 6 balls
  let oversCompleted = 0;
  let extraBalls = 0;

  for (let i = 0; i < inning.overs.length; i++) {
    const validBallsInThisOver = inning.overs[i].balls.filter(b => !b.isInvalid).length;
    const targetBalls = i === 0 ? 4 : 6;
    
    if (validBallsInThisOver === targetBalls) {
      oversCompleted++;
    } else {
      extraBalls = validBallsInThisOver;
      break;
    }
  }

  const oversFormatted = `${oversCompleted}.${extraBalls}`;
  
  // Effective overs for NRR computation
  let effectiveOvers = 0;
  for (let i = 0; i < oversCompleted; i++) {
    effectiveOvers += 1;
  }
  if (extraBalls > 0) {
    const divider = oversCompleted === 0 ? 4 : 6;
    effectiveOvers += extraBalls / divider;
  }

  return {
    runs: totalRuns,
    wickets: totalWickets,
    overs: oversFormatted,
    balls: totalBalls,
    effectiveOvers: effectiveOvers || 0.1 // Prevent division by zero
  };
}

export function calculateNRR(teamId: string, tournament: TournamentData) {
  let runsScored = 0;
  let oversFaced = 0;
  let runsConceded = 0;
  let oversBowled = 0;
  const MAX_OVERS = 5;

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
      // All out at 7 wickets (8 players)
      if (stats.wickets >= 7) { 
         oversFaced += MAX_OVERS;
      } else {
         oversFaced += stats.effectiveOvers;
      }
    }

    if (oppInning) {
      const stats = calculateInningsStats(match, oppIndex);
      runsConceded += stats.runs;
      if (stats.wickets >= 7) {
        oversBowled += MAX_OVERS;
      } else {
        oversBowled += stats.effectiveOvers;
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
      const pName = player.name || player;
      const pGender = player.gender || 'male';
      playerStats[pName] = { runs: 0, balls: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, gender: pGender as 'male' | 'female', team: team.name };
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
            if (!ball.isInvalid) {
              playerStats[strikerName].balls += 1;
            }
          }
          // Bowling
          const bowlerName = ball.bowler?.trim();
          if (bowlerName && playerStats[bowlerName]) {
            playerStats[bowlerName].runsConceded += ball.runs + ball.extras;
            if (!ball.isInvalid) {
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
        const resultString = getMatchResultString(m, tournament.teams);
        if (resultString.includes(team.name)) won++;
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
