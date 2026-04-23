/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  LayoutDashboard, 
  Users, 
  Settings, 
  ChevronRight, 
  Circle,
  PlusCircle,
  ArrowLeft,
  BarChart3,
  Edit,
  Trash2,
  Upload,
  UserPlus,
  GitBranch,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useTournament } from './lib/storage';
import { getStandings, calculateInningsStats, getTournamentAwards } from './lib/cricket-utils';
import { RunType, Match, TournamentData, Player } from './lib/types';
import { cn } from './lib/utils';

// --- Components ---

function ImageUpload({ currentImage, onImageSelect, label, circular = false, alignment = 'items-center' }: { currentImage?: string, onImageSelect: (base64: string) => void, label: string, circular?: boolean, alignment?: 'items-center' | 'items-start' }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 200;
          const MAX_HEIGHT = 200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          onImageSelect(canvas.toDataURL('image/webp', 0.7));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", alignment)}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer transition-all active:scale-95 shadow-sm border-2 border-slate-200 hover:border-blue-600",
          circular ? "w-12 h-12 rounded-full" : "w-14 h-14 rounded-xl",
          "bg-white flex items-center justify-center overflow-hidden"
        )}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt="Logo" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <PlusCircle className="w-5 h-5 mb-0.5" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter whitespace-nowrap">{label}</span>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
}

function LeaderboardsSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 shadow-text text-brand-accent">Official Player Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="high-contrast-card overflow-hidden">
          <div className="p-4 bg-orange-cap text-white font-black uppercase flex justify-between items-center">
            <span>Orange Cap (Runs)</span>
            <Trophy className="w-5 h-5" />
          </div>
          <div className="p-4 divide-y divide-white/10">
            {[
              { name: 'John Doe', runs: 154, team: 'Warriors', sr: 145.2 },
              { name: 'Sam Smith', runs: 120, team: 'Warriors', sr: 180.5 },
              { name: 'Alan Brown', runs: 98, team: 'Titans', sr: 110.0 }
            ].map((p, i) => (
              <div key={i} className="py-4 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <span className="font-mono text-white/30">0{i+1}</span>
                  <div>
                    <p className="font-black uppercase text-sm">{p.name}</p>
                    <p className="label-caps !text-white/40 !text-[10px]">{p.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black leading-none">{p.runs}</p>
                  <p className="label-caps !text-white/30 !text-[10px] mt-1">SR: {p.sr}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="high-contrast-card overflow-hidden">
          <div className="p-4 bg-purple-cap text-white font-black uppercase flex justify-between items-center">
            <span>Purple Cap (Wkts)</span>
            <Trophy className="w-5 h-5" />
          </div>
          <div className="p-4 divide-y divide-white/10">
            {[
              { name: 'Ben Cole', wickets: 8, team: 'Titans', econ: 6.2 },
              { name: 'Hank Jed', wickets: 5, team: 'Titans', econ: 7.5 },
              { name: 'Dave Wood', wickets: 4, team: 'Warriors', econ: 8.8 }
            ].map((p, i) => (
              <div key={i} className="py-4 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <span className="font-mono text-white/30">0{i+1}</span>
                  <div>
                    <p className="font-black uppercase text-white text-sm">{p.name}</p>
                    <p className="label-caps !text-white/40 !text-[10px]">{p.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black leading-none">{p.wickets}</p>
                  <p className="label-caps !text-white/30 !text-[10px] mt-1">ECON: {p.econ}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BallBadge(props: any) {
  const { type } = props;
  const classes = {
    dot: 'ball-dot',
    '1': 'ball-run',
    '2': 'ball-run',
    '3': 'ball-run',
    '4': 'ball-four',
    '6': 'ball-six',
    wicket: 'ball-wicket',
    wide: 'ball-extra',
    'no-ball': 'ball-extra',
  };
  
  const labels = {
    dot: '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '6': '6',
    wicket: 'W',
    wide: 'Wd',
    'no-ball': 'Nb',
  };

  return (
    <div className={cn("ball-circle", classes[type])}>
      {labels[type]}
    </div>
  );
}

function OverTrackerPanel({ inning, className }: { inning: any, className?: string }) {
  if (!inning || !inning.overs || inning.overs.length === 0) return null;

  return (
    <div className={cn("bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 p-4 lg:p-5 w-full max-w-[340px] mx-auto", className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_#2563eb]"></div>
        <h3 className="text-[11px] font-black italic tracking-widest uppercase text-slate-700">Tracker</h3>
      </div>
      
      <div className="space-y-4">
        {inning.overs.map((over: any, idx: number) => {
          // Rule: 4 balls for the first over, 6 for others. Every ball is valid.
          const currentBallsCount = over.balls.length;
          const targetBalls = over.number === 0 ? 4 : 6;
          const emptyBoxesCount = Math.max(0, targetBalls - currentBallsCount);
          const emptyBoxes = Array(emptyBoxesCount).fill(null);

          return (
            <div key={idx} className="space-y-1.5">
              <h4 className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                Over {over.number + 1}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {over.balls.map((ball: any, bIdx: number) => {
                  const isExtra = ball.type === 'wide' || ball.type === 'no-ball';
                  const isBoundary = ball.runs >= 4 || ball.runs === 6;
                  const isWicket = ball.type === 'wicket';
                  const isDot = ball.type === 'dot';
                  
                  return (
                    <div key={bIdx} className={cn(
                      "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center font-black text-[10px] sm:text-[12px] shadow-sm transition-all",
                      isExtra ? "bg-blue-400 text-white" : // Light blue for Wd, Nb
                      isBoundary ? "bg-orange-500 text-white" : // Orange for Boundaries
                      isWicket ? "bg-red-500 text-white text-[11px] sm:text-[13px]" : // Red for Wicket
                      "bg-blue-600 text-white" // Standard Deep Blue for 0, 1, 2, 3
                    )}>
                       {isWicket ? 'W' : isDot ? '0' : ball.type === 'wide' ? 'Wd' : ball.type === 'no-ball' ? 'Nb' : ball.type}
                    </div>
                  )
                })}
                {/* Render empty boxes to complete the over visually if it is the current over */}
                {idx === inning.overs.length - 1 && emptyBoxes.map((_, i) => (
                  <div key={`empty-${i}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center border border-slate-100 bg-slate-50/50"></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchBanner({ match, tournament, inningIndex = 0, striker, nonStriker, hideRecentTrackers = false, onTeamClick }: { match: Match, tournament: any, inningIndex?: number, striker?: string, nonStriker?: string, hideRecentTrackers?: boolean, onTeamClick?: (teamId: string) => void }) {
  if (!match) return null;
  const teamA = tournament.teams.find((t: any) => t.id === match.teamA);
  const teamB = tournament.teams.find((t: any) => t.id === match.teamB);
  
  // Batting team order: Batting team should come first
  const battingTeam = inningIndex === 0 ? teamA : teamB;
  const bowlingTeam = inningIndex === 0 ? teamB : teamA;
  const stats = calculateInningsStats(match, inningIndex);

  const getPlayerScore = (name: string) => {
    if (!name) return 0;
    let runs = 0;
    if (!match.innings[inningIndex]) return 0;
    match.innings[inningIndex].overs.forEach(o => o.balls.forEach(b => {
      if (b.striker === name) runs += b.runs;
    }));
    return runs;
  };

  // Only show balls for the CURRENT over
  const currentOver = match.innings[inningIndex]?.overs[match.innings[inningIndex]?.overs.length - 1];
  const recentBalls = currentOver ? currentOver.balls : [];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-[24px] sm:rounded-[32px] shadow-lg border-t-[6px] sm:border-t-[8px] border-blue-600 overflow-hidden relative">
      <div className="p-3 sm:p-7 space-y-4 sm:space-y-6">
        {/* Header Section: Match ID, Teams, and Players */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-blue-600 text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest">
              MATCH {match.id.toUpperCase().replace('M', '')}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <div 
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onTeamClick && battingTeam?.id && onTeamClick(battingTeam.id)}
              >
                {battingTeam?.logo && <img src={battingTeam.logo} className="w-6 h-6 sm:w-10 sm:h-10 object-contain" referrerPolicy="no-referrer" />}
                <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tight text-slate-800 leading-none hover:underline decoration-blue-500">
                  {battingTeam?.name}
                </h2>
                <span className="text-slate-200 font-bold text-[10px] sm:text-xs italic">vs</span>
              </div>
              <div 
                className="flex items-center gap-2 sm:gap-3 opacity-30 cursor-pointer hover:opacity-60 transition-opacity"
                onClick={() => onTeamClick && bowlingTeam?.id && onTeamClick(bowlingTeam.id)}
              >
                <h2 className="text-md sm:text-2xl font-black uppercase tracking-tight text-slate-600 leading-none hover:underline decoration-slate-400">
                  {bowlingTeam?.name}
                </h2>
                {bowlingTeam?.logo && <img src={bowlingTeam.logo} className="w-5 h-5 sm:w-8 sm:h-8 object-contain" referrerPolicy="no-referrer" />}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 sm:gap-3 items-end shrink-0">
             <div className="flex items-center justify-end gap-2 sm:gap-4">
               <span className="text-[8px] sm:text-[11px] font-black uppercase text-blue-600 tracking-tight">{striker} (B) ★</span>
               <div className="bg-blue-600 text-white w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center text-xs sm:text-lg font-black shadow-md border-b-2 sm:border-b-4 border-blue-800">
                 {getPlayerScore(striker || '')}
               </div>
             </div>
             <div className="flex items-center justify-end gap-2 sm:gap-4 opacity-40">
               <span className="text-[8px] sm:text-[11px] font-black uppercase text-slate-500 tracking-tight">{nonStriker}</span>
               <div className="bg-slate-100 text-slate-500 w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-2xl flex items-center justify-center text-xs sm:text-lg font-black border-b-2 sm:border-b-4 border-slate-200">
                 {getPlayerScore(nonStriker || '')}
               </div>
             </div>
          </div>
        </div>

        {/* Subtle Divider */}
        <div className="border-t border-slate-50 sm:border-slate-100"></div>

        {/* Score & Live Stats Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
            <div className="flex items-baseline gap-0.5 sm:gap-1">
              <span className="text-4xl sm:text-8xl font-black leading-none tracking-tighter text-slate-900">{stats.runs}</span>
              <span className="text-xl sm:text-5xl font-black text-slate-200 mx-1">/</span>
              <span className="text-2xl sm:text-6xl font-black text-slate-900 leading-none">{stats.wickets}</span>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-4 ml-1 sm:ml-4">
              <div className="flex flex-col items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-slate-50 border border-slate-100 min-w-[50px] sm:min-w-[80px]">
                <span className="text-lg sm:text-3xl font-black text-slate-900 leading-none">{stats.overs}</span>
                <span className="text-[6px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest mt-0.5 sm:mt-1">OVERS</span>
              </div>

              <div className="flex flex-col items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 min-w-[50px] sm:min-w-[80px] opacity-70">
                <span className="text-lg sm:text-3xl font-black text-slate-500 leading-none">{(stats.runs / stats.effectiveOvers).toFixed(2)}</span>
                <span className="text-[6px] sm:text-[8px] font-black uppercase text-slate-400 tracking-widest mt-0.5 sm:mt-1">CRR</span>
              </div>
            </div>
          </div>

          {!hideRecentTrackers && (
            <div className="flex gap-1.5 sm:gap-2 flex-wrap items-center justify-end">
              {recentBalls.map((ball, k) => (
                <div 
                  key={k} 
                  className={cn(
                    "w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-[9px] sm:text-lg shadow-sm border-b-2 sm:border-b-4 transition-all",
                    (ball.type === 'wide' || ball.type === 'no-ball') ? "bg-white border-orange-500 text-orange-500 border-2" :
                    (ball.runs >= 4 || ball.runs === 6) ? "bg-orange-500 text-white border-orange-700" :
                    (ball.runs > 0) ? "bg-blue-600 text-white border-blue-800" :
                    ball.type === 'wicket' ? "bg-red-600 text-white border-red-800" :
                    "bg-slate-300 text-white border-slate-400"
                  )}
                >
                  {ball.type === 'wicket' ? 'W' : ball.type === 'dot' ? '0' : ball.type === 'wide' ? 'Wd' : ball.type === 'no-ball' ? 'Nb' : ball.type}
                </div>
              ))}
              {recentBalls.length === 0 && (
                <span className="text-[7px] sm:text-[9px] font-black uppercase text-slate-300 italic">Waiting for ball...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StandingsTable({ tournament }: { tournament: any }) {
  const standings = getStandings(tournament);
  const groupA = standings.filter(t => t.group === 'A');
  const groupB = standings.filter(t => t.group === 'B');
  
  const GroupSection = ({ title, teams, colorClass }: { title: string, teams: any[], colorClass: string }) => (
    <div className="high-contrast-card">
      <div className={cn("p-3 border-b border-slate-100 flex justify-between items-center", colorClass)}>
        <h3 className="label-caps !text-white">{title}</h3>
        <span className="text-[11px] font-black uppercase text-white/60 tracking-widest">Top 2 Qualify</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="p-2 label-caps !text-[11px]">Team</th>
              <th className="p-2 text-center label-caps !text-[11px]">W/L</th>
              <th className="p-2 text-center label-caps !text-[11px]">NRR</th>
              <th className="p-2 text-center label-caps !text-[11px]">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team, idx) => (
              <tr key={team.id} className={cn("hover:bg-slate-50/50 transition-colors", idx < 2 && "bg-slate-50/30")}>
                <td className="p-2 flex items-center gap-3">
                   {team.logo ? (
                     <img src={team.logo} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                   ) : (
                     <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                   )}
                   <span className="text-[13px] font-black uppercase text-slate-700">{team.name}</span>
                </td>
                <td className="p-2 text-center font-mono text-[12px] font-bold">{team.won}/{team.lost}</td>
                <td className="p-2 text-center font-mono text-[12px] text-slate-500">{(team.nrr || 0).toFixed(2)}</td>
                <td className="p-2 text-center font-mono font-black text-slate-900 text-sm">{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full content-start">
      <GroupSection title="Group A Standing" teams={groupA} colorClass="bg-blue-600" />
      <GroupSection title="Group B Standing" teams={groupB} colorClass="bg-emerald-600" />
    </div>
  );
}

function AwardsSection({ tournament }: { tournament: TournamentData }) {
  const awards = getTournamentAwards(tournament);

  const AwardCard = ({ title, player, color }: { title: string, player: any, color: string }) => (
    <div className={cn("high-contrast-card overflow-hidden h-full flex flex-col group transition-all hover:scale-[1.02]", color)}>
      <div className="p-3 bg-white/10 backdrop-blur-sm flex justify-between items-center border-b border-white/5">
        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">{title}</span>
        <Trophy className="w-4 h-4 text-white/50 group-hover:text-yellow-400 transition-colors" />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-center min-h-[100px]">
        {player ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-xl md:text-2xl font-black uppercase text-white leading-tight mb-1 break-words">{player.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-bold uppercase py-0.5 px-2 bg-white/20 rounded text-white">{player.team}</span>
                <span className="text-[9px] font-black uppercase text-yellow-300 tracking-wider bg-black/20 px-2 py-0.5 rounded italic">{player.reason}</span>
              </div>
           </motion.div>
        ) : (
          <p className="text-white/30 font-black uppercase text-sm italic">N/A</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">Tournament Honours</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AwardCard title="Man of the Tournament" player={awards.playerOfSeriesMale} color="bg-slate-900" />
        <AwardCard title="Woman of the Tournament" player={awards.playerOfSeriesFemale} color="bg-rose-600" />
        <AwardCard title="Best Batsman (M)" player={awards.bestBatsmanMale} color="bg-blue-600" />
        <AwardCard title="Best Batsman (F)" player={awards.bestBatsmanFemale} color="bg-pink-600" />
        <AwardCard title="Best Bowler (M)" player={awards.bestBowlerMale} color="bg-emerald-600" />
        <AwardCard title="Best Bowler (F)" player={awards.bestBowlerFemale} color="bg-emerald-500" />
        <div className="sm:col-span-2 lg:col-span-3">
           <AwardCard title="Man of the Match - Grand Finale" player={awards.manOfTheMatchFinale !== 'N/A' ? { name: awards.manOfTheMatchFinale, team: 'Finale Star', reason: 'Grand Finale Hero' } : null} color="bg-amber-500" />
        </div>
      </div>
    </div>
  );
}

function TournamentTree({ tournament, onSelect, isAdmin, setData }: { tournament: TournamentData, onSelect: (idx: number) => void, isAdmin?: boolean, setData: (d: any) => void }) {
  const allFixtures = (tournament.matches || []).filter(m => m && !['m13', 'm14', 'm15'].includes(m.id)).sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  const semis = (tournament.matches || []).filter(m => m && ['m13', 'm14'].includes(m.id));
  const final = (tournament.matches || []).find(m => m && m.id === 'm15');

  const MatchMiniNode = ({ match, isKnockout }: { match: Match | undefined, isKnockout?: boolean, key?: string }) => {
    if (!match) return <div className="bg-slate-100 border border-slate-200 p-2 rounded-lg h-16 w-full animate-pulse" />;
    const idx = tournament.matches.findIndex(m => m.id === match.id);
    const teamA = tournament.teams.find(t => t.id === match.teamA);
    const teamB = tournament.teams.find(t => t.id === match.teamB);
    const statsA = calculateInningsStats(match, 0);
    const statsB = calculateInningsStats(match, 1);
    
    return (
      <div 
        onClick={() => onSelect(idx)}
        className="bg-white border-2 border-slate-200 p-3 rounded-xl hover:border-blue-600 hover:shadow-lg transition-all cursor-pointer group flex flex-col gap-2 w-full"
      >
        <div className="flex justify-between items-center px-1 border-b border-slate-50 pb-2">
          <span className="text-[9px] font-black text-slate-400 uppercase leading-none">{match.title || match.id}</span>
          <span className={cn(
             "text-[8px] font-black uppercase leading-none px-2 py-1 rounded",
             match.status === 'live' ? "bg-red-100 text-red-600 animate-pulse" : 
             match.status === 'completed' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"
          )}>{match.status}</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5 py-1">
          {[
            { team: teamA, stats: statsA, field: 'teamA' }, 
            { team: teamB, stats: statsB, field: 'teamB' }
          ].map(({ team: t, stats, field }, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {t?.logo ? <img src={t.logo} className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 bg-slate-100 rounded-sm" />}
                
                {isAdmin && isKnockout ? (
                  <select 
                    value={t?.id || ''} 
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const updatedMatches = [...tournament.matches];
                      updatedMatches[idx] = { ...match, [field]: e.target.value };
                      setData({ ...tournament, matches: updatedMatches });
                    }}
                    className="text-[10px] font-black uppercase bg-slate-50 border border-slate-100 p-0.5 rounded outline-none focus:border-blue-600 flex-1 min-w-0"
                  >
                    <option value="">Select Team</option>
                    {tournament.teams.map((team: any) => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                ) : (
                  <span className={cn(
                    "text-[11px] font-black uppercase leading-none truncate",
                     match.status === 'completed' && match.result?.includes(t?.name || '') ? "text-slate-900" : "text-slate-600" 
                  )}>{t?.name || 'TBD'}</span>
                )}
              </div>
              
              {(match.status === 'live' || match.status === 'completed') && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black text-slate-900 tabular-nums">{stats.runs}/{stats.wickets}</span>
                  <span className="text-[9px] font-bold text-slate-400 tabular-nums">({Math.floor(stats.balls / 6)}.{stats.balls % 6})</span>
                </div>
              )}
            </div>
          ))}
        </div>
        {match.status === 'completed' && match.result && (
           <div className="mt-1 pt-2 border-t border-slate-50">
             <span className="text-[9px] font-bold text-slate-500 uppercase">{match.result}</span>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-white rounded-[32px] p-4 lg:p-12 border-4 border-slate-100 min-h-[800px] shadow-sm">
       {/* Background Grid */}
       <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:20px_20px]"></div>
       
       <div className="relative z-10 flex flex-col items-center gap-16">
          
          <div className="w-full">
            <div className="text-center mb-8">
              <span className="bg-slate-900 text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">Group Stage Fixtures</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {allFixtures.map(m => <MatchMiniNode key={m.id} match={m} />)}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-8 mt-8 border-t-2 border-dashed border-slate-200 pt-16">
             <div className="text-center mb-4">
              <span className="bg-orange-500 text-white text-xs font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl">Knockout Stage</span>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative">
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-2 bg-slate-100 -z-10 translate-y-8"></div>
                <div className="space-y-4">
                   <div className="text-center font-black text-xs text-slate-400 uppercase tracking-widest bg-slate-50 py-1 rounded-full w-max mx-auto px-4">Semi Final 01</div>
                   <MatchMiniNode match={semis[0]} isKnockout={true} />
                </div>
                <div className="space-y-4">
                   <div className="text-center font-black text-xs text-slate-400 uppercase tracking-widest bg-slate-50 py-1 rounded-full w-max mx-auto px-4">Semi Final 02</div>
                   <MatchMiniNode match={semis[1]} isKnockout={true} />
                </div>
             </div>

             <div className="flex flex-col items-center justify-center py-12 w-full relative mt-4">
                <div className="hidden md:block absolute -top-12 w-1 h-12 bg-slate-200 -z-10"></div>
                
                <div className="absolute w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <Trophy className="w-20 h-20 text-yellow-500 mb-6 drop-shadow-xl z-10" />
                
                <div className="w-full max-w-sm relative z-10 shadow-2xl rounded-xl">
                   <MatchMiniNode match={final} isKnockout={true} />
                </div>
                
                <div className="mt-6 bg-slate-900 px-8 py-3 rounded-xl shadow-xl border-b-4 border-slate-700 relative z-10 text-center">
                   <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">Grand Finale Winner</span>
                </div>
             </div>
          </div>

       </div>
    </div>
  );
}

function MatchGrid({ tournament, onSelect }: { tournament: TournamentData, onSelect: (idx: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">Tournament Schedule</h2>
        <span className="label-caps !text-blue-600">15 Matches Total</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tournament.matches.map((match, idx) => {
          const teamA = tournament.teams.find(t => t.id === match.teamA);
          const teamB = tournament.teams.find(t => t.id === match.teamB);
          
          return (
            <motion.div 
              key={match.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(idx)}
              className={cn(
                "high-contrast-card p-2 cursor-pointer relative group border-slate-200 hover:border-blue-600 transition-all",
                match.status === 'live' && "border-blue-500 bg-blue-50/11",
                match.status === 'completed' && "opacity-75 bg-slate-50 border-slate-200"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[8px] font-black uppercase text-slate-400">{match.date.split('T')[0].split('-').slice(1).join('/')}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[7px] font-black uppercase",
                  match.status === 'live' ? "bg-red-500 text-white animate-pulse" : 
                  match.status === 'completed' ? "text-blue-600 bg-transparent px-0" : "bg-slate-100 text-slate-500"
                )}>
                  {match.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 mx-auto mb-1 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {teamA?.logo ? <img src={teamA.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <Trophy className="w-4 h-4 text-slate-300" />}
                  </div>
                  <div className="text-[8px] font-black uppercase text-slate-800 truncate">{teamA?.name || 'TBD'}</div>
                </div>
                
                <div className="text-[8px] font-black text-slate-300">VS</div>
                
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 mx-auto mb-1 bg-slate-100 rounded flex items-center justify-center overflow-hidden">
                    {teamB?.logo ? <img src={teamB.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <Trophy className="w-4 h-4 text-slate-300" />}
                  </div>
                  <div className="text-[8px] font-black uppercase text-slate-800 truncate">{teamB?.name || 'TBD'}</div>
                </div>
              </div>

              {match.status === 'completed' && match.result && (
                <div className="mt-2 pt-1 border-t border-slate-200 text-[6px] font-bold text-center text-blue-600 line-clamp-1">
                   {match.result}
                </div>
              )}
              
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                 <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-[7px] font-black uppercase shadow-lg">Score</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ScorerPanel({ match, onUpdate, tournament, onComplete, inningOverride, onInningOverride, activePlayers }: { match: Match, onUpdate: (m: Match) => void, tournament: any, onComplete: (res: string) => void, inningOverride?: number | null, onInningOverride?: (idx: number | null) => void, activePlayers?: {striker: string, nonStriker: string} }) {
  if (!match) return (
    <div className="p-8 text-center bg-white rounded-2xl border-4 border-dashed border-slate-200">
      <p className="text-xl font-black uppercase text-slate-300 italic">No Match Active</p>
    </div>
  );
  
  const teamA = tournament.teams.find((t: any) => t.id === match.teamA);
  const teamB = tournament.teams.find((t: any) => t.id === match.teamB);
  
  // Decide which inning is active (0 if inning 0 not full, else 1)
  const stats0 = calculateInningsStats(match, 0);
  const autoInningIndex = (stats0.balls >= 28 || stats0.wickets >= 5) ? 1 : 0;
  
  const activeInningIndex = inningOverride !== undefined && inningOverride !== null ? inningOverride : autoInningIndex;
  
  const battingTeam = activeInningIndex === 0 ? teamA : teamB;
  const bowlingTeam = activeInningIndex === 0 ? teamB : teamA;

  const outPlayers = useMemo(() => {
    const currentInning = match.innings[activeInningIndex];
    if (!currentInning) return [];
    return currentInning.overs.flatMap((o: any) => o.balls)
      .filter((b: any) => b.type === 'wicket' && b.wicket?.player)
      .map((b: any) => b.wicket.player);
  }, [match, activeInningIndex]);

  const [strikerName, setStrikerName] = useState(activePlayers?.striker || battingTeam?.players?.[0]?.name || '');
  const [nonStrikerName, setNonStrikerName] = useState(activePlayers?.nonStriker || battingTeam?.players?.[1]?.name || '');
  const [bowlerName, setBowlerName] = useState(bowlingTeam?.players?.[0]?.name || '');

  // Handle player updates when inning switches
  useEffect(() => {
    if (activePlayers) {
      setStrikerName(activePlayers.striker);
      setNonStrikerName(activePlayers.nonStriker);
    } else {
      setStrikerName(battingTeam?.players?.[0]?.name || '');
      setNonStrikerName(battingTeam?.players?.[1]?.name || '');
    }
    setBowlerName(bowlingTeam?.players?.[0]?.name || '');
  }, [activeInningIndex, activePlayers?.striker, activePlayers?.nonStriker, battingTeam, bowlingTeam]);

  const handleBall = (type: RunType) => {
    const updatedMatch = JSON.parse(JSON.stringify(match));
    const currentInning = updatedMatch.innings[activeInningIndex];
    if (!currentInning) return;

    // Use current state for the ball being bowled
    const currentStriker = strikerName;
    const currentNonStriker = nonStrikerName;
    const currentBowler = bowlerName;

    // RULE: Calculate current over status
    const currentOverIdx = currentInning.overs.length > 0 ? currentInning.overs.length - 1 : -1;
    const lastOverRef = currentOverIdx >= 0 ? currentInning.overs[currentOverIdx] : null;
    
    // Every ball is valid
    const ballsInOverCount = lastOverRef ? lastOverRef.balls.length : 0;
    const requiredBallsForThisOver = (currentOverIdx === 0) ? 4 : 6;

    // Check if we need to start a NEW over
    const needsNewOver = (currentOverIdx === -1) || (ballsInOverCount === requiredBallsForThisOver);

    if (needsNewOver) {
      if (currentInning.overs.length >= 5) return; // Max 5 overs
      currentInning.overs.push({
        number: currentInning.overs.length,
        bowler: bowlerName,
        balls: []
      });
    }
    
    const lastOver = currentInning.overs[currentInning.overs.length - 1];
    const overNumberLabel = lastOver.number; // 0 to 4
    let actualRuns = 0;
    let actualExtras = 0;

    // Basic scoring
    if (type !== 'wicket' && type !== 'dot' && type !== 'wide' && type !== 'no-ball') {
      actualRuns = parseInt(type);
    }

    // EXTRA SCORING RULES
    if (type === 'wide' || type === 'no-ball') {
      // Default: Men's over = 4 runs
      actualExtras = 4;

      // Rule: First over (Women's) = 2 runs
      if (overNumberLabel === 0) {
        actualExtras = 2;
      }

      // Rule: Last 2 balls of 5th over in 2nd inning = 1 run
      // activeInningIndex 1 = 2nd inning
      // overNumberLabel 4 = 5th over
      // lastOver.balls.length 4 or 5 = 5th or 6th ball
      if (activeInningIndex === 1 && overNumberLabel === 4) {
        if (lastOver.balls.length >= 4) {
          actualExtras = 1;
        }
      }
    }

    lastOver.balls.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      runs: actualRuns,
      extras: actualExtras,
      striker: currentStriker,
      nonStriker: currentNonStriker,
      bowler: currentBowler,
      wicket: type === 'wicket' ? { player: currentStriker, type: 'bowled' } : undefined
    });

    let nextStriker = currentStriker;
    let nextNonStriker = currentNonStriker;

    // Striker Rotation on 1 or 3 runs
    if (actualRuns === 1 || actualRuns === 3) {
      nextStriker = currentNonStriker;
      nextNonStriker = currentStriker;
    }

    // Over rotation when over completes
    const completedBalls = lastOver.balls.length;
    const requiredForComplete = overNumberLabel === 0 ? 4 : 6;
    if (completedBalls === requiredForComplete) {
      const temp = nextStriker;
      nextStriker = nextNonStriker;
      nextNonStriker = temp;
    }

    setStrikerName(nextStriker);
    setNonStrikerName(nextNonStriker);
    
    onUpdate(updatedMatch);
  };

  const swapStrikers = () => {
    const temp = strikerName;
    setStrikerName(nonStrikerName);
    setNonStrikerName(temp);
  };

  return (
    <div className="mt-4 p-4 high-contrast-card bg-slate-50 border-slate-900 border-2">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col">
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-tighter">Match Scoring Center</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">Inning {activeInningIndex + 1}: {battingTeam?.name} Batting</p>
                {match.innings[activeInningIndex]?.overs.length <= 1 && (match.innings[activeInningIndex]?.overs[0]?.balls.length || 0) < 4 && (
                  <div className="flex items-center gap-1.5 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full animate-pulse border border-rose-200">
                    <Users className="w-2.5 h-2.5" />
                    <span className="text-[8px] font-black uppercase">First Over: Woman Bowler & Batters Required</span>
                  </div>
                )}
                <button 
                  onClick={() => onInningOverride?.(activeInningIndex === 0 ? 1 : 0)}
                  className="text-[8px] font-black uppercase bg-blue-600 text-white px-2 py-1 rounded-full transition-all shadow-[0_2px_0_0_#1e40af] active:translate-y-[1px]"
                >
                  SWAP INNING
                </button>
              </div>
            </div>
            <button 
               onClick={() => {
                 const statsA = calculateInningsStats(match, 0);
                 const statsB = calculateInningsStats(match, 1);
                 if (statsA.runs === statsB.runs) {
                   if (confirm("Scores are TIED! Rule: A Super Over shall be played. Mark as Tied for now?")) {
                     onComplete("Match Tied - Super Over Required");
                   } else {
                     onComplete("Draw - Both teams shared points");
                   }
                 } else {
                   const winner = statsA.runs > statsB.runs ? teamA?.name : teamB?.name;
                   onComplete(`${winner} won by ${Math.abs(statsA.runs - statsB.runs)} runs`);
                 }
               }}
               className="w-full sm:w-auto bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-black uppercase shadow-[0_4px_0_0_#059669] active:translate-y-[2px] transition-all"
            >
              Finish Match
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 pt-4 border-t border-slate-200">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase text-slate-500 underline decoration-blue-500 decoration-2">STRIKER</label>
                <button onClick={swapStrikers} className="text-[8px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded">SWAP</button>
              </div>
              <select 
                value={strikerName} 
                onChange={(e) => setStrikerName(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 p-2 rounded-xl text-[12px] font-black uppercase shadow-sm focus:border-blue-600 outline-none"
              >
                {battingTeam?.players?.map((p: any) => {
                  const pName = p?.name || p;
                  const isOut = outPlayers.includes(pName);
                  return <option key={pName} value={pName} disabled={isOut} className={isOut ? "text-slate-400 bg-slate-100" : ""}>{pName.toUpperCase()} {isOut ? '(OUT)' : ''}</option>
                })}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 underline decoration-slate-300 decoration-2">NON-STRIKER</label>
              <select 
                value={nonStrikerName} 
                onChange={(e) => setNonStrikerName(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 p-2 rounded-xl text-[12px] font-black uppercase shadow-sm focus:border-blue-600 outline-none"
              >
                {battingTeam?.players?.map((p: any) => {
                  const pName = p?.name || p;
                  const isOut = outPlayers.includes(pName);
                  return <option key={pName} value={pName} disabled={isOut} className={isOut ? "text-slate-400 bg-slate-100" : ""}>{pName.toUpperCase()} {isOut ? '(OUT)' : ''}</option>
                })}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500">BOWLER</label>
              <select 
                value={bowlerName} 
                onChange={(e) => setBowlerName(e.target.value)}
                className="w-full bg-white border-2 border-slate-200 p-2 rounded-xl text-[12px] font-black uppercase shadow-sm focus:border-blue-600 outline-none"
              >
                {bowlingTeam?.players?.map((p: any) => {
                  const pName = p?.name || p;
                  return <option key={pName} value={pName}>{pName.toUpperCase()}</option>
                })}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 italic">OFFICIAL SCORE INPUT</div>
            <button 
              onClick={() => {
                 const updatedMatch = JSON.parse(JSON.stringify(match));
                 const currentInning = updatedMatch.innings[activeInningIndex];
                 const lastOver = currentInning.overs[currentInning.overs.length - 1];
                 if (lastOver?.balls.length > 0) {
                   lastOver.balls.pop();
                   if (lastOver.balls.length === 0) currentInning.overs.pop();
                   onUpdate(updatedMatch);
                 }
              }}
              className="text-[11px] font-black uppercase text-rose-500 border border-rose-100 bg-rose-50 px-4 py-1 rounded-xl hover:bg-rose-100 active:scale-95 transition-all"
            >
              CORRECTION (UNDO)
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-9 gap-3">
            {(['dot', '1', '2', '3', '4', '6', 'wide', 'no-ball', 'wicket'] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleBall(type)}
                className={cn(
                  "flex flex-col items-center justify-center aspect-square bg-white border-2 border-slate-200 hover:border-slate-900 rounded-2xl transition-all shadow-sm active:scale-90",
                  type === 'wicket' && "border-rose-400 bg-rose-50 text-rose-600",
                  (type === '4' || type === '6') && "border-amber-400 bg-amber-50 text-amber-700"
                )}
              >
                <BallBadge type={type} />
                <span className="text-[10px] font-black uppercase mt-1.5">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Side Ball Tracker */}
        <div className="w-full lg:w-40 bg-white/50 p-3 rounded-2xl border-2 border-slate-200 flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest italic flex items-center gap-2">
              <Circle className="w-2 h-2 text-blue-600 fill-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" /> Tracker
            </h4>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
            {match.innings[activeInningIndex]?.overs.map((over, oidx) => (
              <div key={oidx} className="space-y-1">
                <div className="flex justify-between items-center px-0.5">
                  <span className="text-[7px] font-black text-slate-400 uppercase">OVER {oidx+1}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {over.balls.map((ball, bidx) => (
                    <div 
                      key={bidx} 
                      className={cn(
                        "w-5 h-5 rounded-[2px] flex items-center justify-center text-[7px] font-black text-white shrink-0 shadow-sm",
                        ball.type === 'dot' ? "bg-slate-300" :
                        ball.type === 'wicket' ? "bg-rose-500" :
                        (ball.type === '4' || ball.type === '6') ? "bg-amber-500" :
                        (ball.type === 'wide' || ball.type === 'no-ball') ? "bg-blue-400" : "bg-blue-600"
                      )}
                    >
                      {ball.type === 'wicket' ? 'W' : 
                       ball.type === 'wide' ? 'Wd' : 
                       ball.type === 'no-ball' ? 'Nb' : 
                       ball.type === 'dot' ? '0' : ball.type}
                    </div>
                  ))}
                  {/* Empty dots for legal balls */}
                  {Array.from({ length: Math.max(0, (oidx === 0 ? 4 : 6) - over.balls.filter((b: any) => b.type !== 'wide' && b.type !== 'no-ball').length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="w-5 h-5 bg-slate-100 border border-slate-200 rounded-[2px] opacity-40"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 10-Over Box Visual */}
      <div className="mt-8 pt-6 border-t border-slate-200">
         <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wider font-mono italic">ROUND PROGRESS (10 OVERS TOTAL)</h4>
         </div>
         <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {[...(match.innings[0]?.overs || []), ...(match.innings[1]?.overs || [])].map((over, idx) => (
               <div key={idx} className={cn(
                 "p-2 rounded-xl flex flex-col items-center border-2 transition-all",
                 idx < (match.innings[0]?.overs.length || 0) ? "bg-blue-50 border-blue-100" : "bg-emerald-50 border-emerald-100"
               )}>
                  <span className="text-[9px] font-black text-slate-400 leading-none mb-1">O{idx+1}</span>
                  <span className="text-[12px] font-black text-slate-900 leading-none">
                    {over.balls.reduce((acc: number, b: any) => acc + b.runs + b.extras, 0)}
                  </span>
               </div>
            ))}
            {Array.from({ length: 10 - ([...(match.innings[0]?.overs || []), ...(match.innings[1]?.overs || [])].length) }).map((_, i) => (
               <div key={`empty-${i}`} className="p-2 rounded-xl flex flex-col items-center border-2 border-dashed border-slate-200 opacity-30">
                  <span className="text-[9px] font-black text-slate-400">-</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}

function OverChart({ match }: { match: Match }) {
  if (!match) return null;
  const data = match.innings[0].overs.map(o => ({
    over: o.number + 1,
    runs: o.balls.reduce((acc, b) => acc + b.runs + b.extras, 0),
    wickets: o.balls.filter(b => b.type === 'wicket').length
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="over" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            cursor={{ fill: '#1e293b' }}
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#fff' }}
          />
          <Bar dataKey="runs" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.wickets > 0 ? '#ef4444' : '#38bdf8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ManagementPanel({ data, setData, resetToFactory }: { data: TournamentData, setData: (d: any) => void, resetToFactory: () => void }) {
  const [teamName, setTeamName] = useState('');
  const [teamGroup, setTeamGroup] = useState<'A' | 'B'>('A');
  const [playerGender, setPlayerGender] = useState<'male' | 'female'>('male');
  
  const addTeam = () => {
    if (!teamName) return;
    const newTeam: any = {
      id: Math.random().toString(36).substr(2, 9),
      name: teamName,
      logo: '',
      group: teamGroup,
      players: []
    };
    setData({ ...data, teams: [...data.teams, newTeam] });
    setTeamName('');
  };

  const updateTeamField = (teamId: string, field: string, value: any) => {
    setData({
      ...data,
      teams: data.teams.map((t: any) => t.id === teamId ? { ...t, [field]: value } : t)
    });
  };

  const addPlayer = (teamId: string, name: string) => {
    if (!name) return;
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      gender: playerGender
    };
    setData({
      ...data,
      teams: data.teams.map((t: any) => t.id === teamId ? { ...t, players: [...(t.players || []), newPlayer] } : t)
    });
  };

  const addMatch = () => {
    const newMatch: Match = {
      id: `m${data.matches.length + 1}`,
      title: `Match ${data.matches.length + 1}`,
      status: 'upcoming',
      teamA: '',
      teamB: '',
      date: new Date().toLocaleDateString(),
      innings: [
        { teamId: '', battingOrder: [], overs: [] },
        { teamId: '', battingOrder: [], overs: [] }
      ]
    };
    setData({ ...data, matches: [...data.matches, newMatch] });
  };

  const deleteMatch = (id: string) => {
    setData({ ...data, matches: data.matches.filter(m => m.id !== id) });
  };

  const copyDataToClipboard = () => {
    const code = `import { TournamentData } from './types';

export const INITIAL_DATA: TournamentData = ${JSON.stringify(data, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Data copied to clipboard! Open AI Studio code editor, go to /src/lib/initialData.ts, select all, and paste to overwrite. Then deploy!');
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tournament Info */}
        <div className="high-contrast-card p-3 bg-white border-blue-100 flex items-center gap-4 relative">
           <ImageUpload 
              currentImage={data.config.logo} 
              onImageSelect={(b) => setData({...data, config: {...data.config, logo: b}})} 
              label="Main Logo" 
           />
           <div className="flex-1">
              <span className="manage-label-sm">Tournament Title</span>
              <input 
                value={data.config.tournamentName} 
                onChange={(e) => setData({ ...data, config: { ...data.config, tournamentName: e.target.value }})}
                className="bg-transparent border-b border-slate-200 font-black uppercase text-xs w-full outline-none focus:border-blue-600 transition-colors py-1 mb-2"
              />
              <button 
                onClick={copyDataToClipboard}
                className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors w-full"
              >
                Export for Vercel Deploy
              </button>
           </div>
        </div>

        {/* Quick Add Team & Match */}
        <div className="high-contrast-card p-3 border-slate-200 bg-slate-50/50 space-y-4">
          <div className="space-y-1">
             <span className="manage-label-sm">Actions</span>
             <div className="flex gap-2">
                <button onClick={addTeam} className="flex-1 bg-white border-2 border-slate-200 p-2 rounded-xl text-[10px] font-black uppercase hover:border-blue-600 transition-all flex items-center justify-center gap-2">
                   <Users className="w-3 h-3" /> New Team
                </button>
                <button onClick={addMatch} className="flex-1 bg-slate-900 text-white p-2 rounded-xl text-[10px] font-black uppercase hover:bg-black transition-all flex items-center justify-center gap-2">
                   <Circle className="w-3 h-3" /> New Match
                </button>
             </div>
          </div>
          
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
            <input 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="QUICK TEAM NAME..."
              className="manage-text-sm px-3 flex-1 outline-none font-bold"
            />
            <select 
              value={teamGroup}
              onChange={(e) => setTeamGroup(e.target.value as any)}
              className="manage-text-sm bg-transparent px-2 outline-none font-black text-blue-600 border-l border-slate-100"
            >
              <option value="A">GRP A</option>
              <option value="B">GRP B</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.matches.map((match, idx) => (
          <div key={match.id} className="high-contrast-card p-3 bg-white border-slate-200 group relative">
            <button 
              onClick={() => deleteMatch(match.id)}
              className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="flex justify-between items-center mb-2">
              <input 
                value={match.title}
                onChange={(e) => {
                  const newMatches = [...data.matches];
                  newMatches[idx] = { ...match, title: e.target.value };
                  setData({ ...data, matches: newMatches });
                }}
                className="text-[9px] font-black uppercase text-slate-400 bg-transparent outline-none focus:text-slate-900"
              />
              <select 
                value={match.status}
                onChange={(e) => {
                  const newMatches = [...data.matches];
                  newMatches[idx] = { ...match, status: e.target.value as any };
                  setData({ ...data, matches: newMatches });
                }}
                className="text-[8px] font-black uppercase bg-slate-100 rounded px-1"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <select 
                value={match.teamA}
                onChange={(e) => {
                  const newMatches = [...data.matches];
                  newMatches[idx] = { ...match, teamA: e.target.value };
                  setData({ ...data, matches: newMatches });
                }}
                className="flex-1 text-[10px] font-black uppercase bg-slate-50 border border-slate-100 p-1 rounded outline-none focus:border-blue-600"
              >
                <option value="">Select Team A</option>
                {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <span className="text-[10px] font-black text-slate-300">VS</span>
              <select 
                value={match.teamB}
                onChange={(e) => {
                  const newMatches = [...data.matches];
                  newMatches[idx] = { ...match, teamB: e.target.value };
                  setData({ ...data, matches: newMatches });
                }}
                className="flex-1 text-[10px] font-black uppercase bg-slate-50 border border-slate-100 p-1 rounded outline-none focus:border-blue-600"
              >
                <option value="">Select Team B</option>
                {data.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['A', 'B'].map((group) => (
          <div key={group} className="space-y-4">
            <div className={cn("p-2 rounded-lg text-white font-black text-[10px] uppercase tracking-[0.2em] px-4", group === 'A' ? "bg-blue-600" : "bg-emerald-600")}>
              Group {group} Rosters
            </div>
            {data.teams.filter((t: any) => t.group === group).map((team: any) => (
              <div key={team.id} className="high-contrast-card p-3 relative group border-slate-100 hover:border-slate-300 transition-all">
                <div className="flex gap-4">
                   <div className="shrink-0">
                     <ImageUpload 
                        currentImage={team.logo} 
                        onImageSelect={(b) => updateTeamField(team.id, 'logo', b)} 
                        label="Team Logo" 
                        alignment="items-start"
                     />
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <input 
                          defaultValue={team.name}
                          onBlur={(e) => updateTeamField(team.id, 'name', e.target.value)}
                          className="manage-text-sm font-black uppercase bg-transparent p-1 border-b border-transparent focus:border-slate-900 outline-none w-full"
                        />
                        <button 
                          onClick={() => setData({ ...data, teams: data.teams.filter((t: any) => t.id !== team.id) })}
                          className="p-1 text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {team.players?.map((p: any, idx: number) => {
                          const pName = p?.name || p;
                          const pGender = p?.gender || 'male';
                          return (
                          <span key={idx} className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-1 border transition-colors",
                            pGender === 'male' ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-pink-50 border-pink-100 text-pink-700"
                          )}>
                            {pName}
                            <Trash2 
                              onClick={() => updateTeamField(team.id, 'players', team.players.filter((_: any, i: number) => i !== idx))}
                              className="w-2 h-2 opacity-30 hover:opacity-100 cursor-pointer" 
                            />
                          </span>
                          );
                        })}
                      </div>
                      <div className="flex flex-col gap-2 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex gap-1">
                          <button 
                            onClick={() => setPlayerGender('male')}
                            className={cn("flex-1 text-[8px] font-black uppercase py-1 rounded transition-all", playerGender === 'male' ? "bg-slate-900 text-white" : "bg-white text-slate-400")}
                          >Male (8)</button>
                          <button 
                            onClick={() => setPlayerGender('female')}
                            className={cn("flex-1 text-[8px] font-black uppercase py-1 rounded transition-all", playerGender === 'female' ? "bg-slate-900 text-white" : "bg-white text-slate-400")}
                          >Female (2)</button>
                        </div>
                        <div className="flex gap-1 overflow-hidden rounded-md border border-slate-200 shadow-sm focus-within:border-blue-600 transition-colors bg-white">
                          <input 
                            placeholder="+ Add Player Name"
                            className="manage-text-sm flex-1 outline-none px-3 py-1.5 font-bold"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                addPlayer(team.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                            id={`player-input-${team.id}`}
                          />
                          <button 
                            onClick={() => {
                              const input = document.getElementById(`player-input-${team.id}`) as HTMLInputElement;
                              addPlayer(team.id, input.value);
                              input.value = '';
                            }}
                            className="bg-slate-900 text-white px-4 text-[9px] font-black uppercase hover:bg-black transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between items-center text-[8px] font-black text-slate-400 uppercase">
                         <span>M: {team.players?.filter((p: any) => p.gender === 'male').length}/8</span>
                         <span>F: {team.players?.filter((p: any) => p.gender === 'female').length}/2</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-200 mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-2xl border-2 border-dashed border-blue-100 flex flex-col items-center gap-4">
          <div className="text-center">
            <h4 className="text-sm font-black uppercase text-blue-900 mb-1">Cloud Sync Status</h4>
            <p className="text-[10px] text-blue-600 uppercase font-bold tracking-tight text-center">Connected to Supabase Realtime</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100">
             <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase text-slate-600">Syncing Live</span>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl border-2 border-dashed border-red-100 flex flex-col items-center gap-4">
          <div className="text-center">
            <h4 className="text-sm font-black uppercase text-red-900 mb-1">System Recovery</h4>
            <p className="text-[10px] text-red-600 uppercase font-bold tracking-tight whitespace-pre-line text-center">
              Current Version: {data.version || 'Legacy'}{'\n'}
              Use "Force Refresh" to pull latest logos from code.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                if (confirm("Reset to latest code version? This will update logos/details but keep custom team changes if possible.")) {
                  localStorage.removeItem('cricket_tournament_data');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <GitBranch className="w-3 h-3" /> Force Refresh
            </button>
            <button 
              onClick={resetToFactory}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [data, setData, resetToFactory] = useTournament();
  const [view, setView] = useState<'home' | 'players' | 'admin' | 'config' | 'awards'>('home');
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingView, setPendingView] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [adminInningOverride, setAdminInningOverride] = useState<number | null>(null);
  const [selectedTeamModalId, setSelectedTeamModalId] = useState<string | null>(null);

  // Migration for Black Panther rename to Black Panthers and update match titles
  useEffect(() => {
    let changed = false;
    const updatedData = JSON.parse(JSON.stringify(data));
    updatedData.teams = updatedData.teams.map((t: any) => {
      if (t.name === 'Black Panther') {
        changed = true;
        return { ...t, name: 'Black Panthers' };
      }
      return t;
    });
    updatedData.matches = updatedData.matches.map((m: any) => {
      if (m.title.includes('Black Panther') && !m.title.includes('Black Panthers')) {
        changed = true;
        return { ...m, title: m.title.replace('Black Panther', 'Black Panthers') };
      }
      return m;
    });
    if (changed) setData(updatedData);
  }, []);

  // Update Title and Favicon dynamically
  useEffect(() => {
    document.title = data.config.tournamentName || "RSL 2026";
    if (data.config.logo) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = data.config.logo;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [data.config.tournamentName, data.config.logo]);

  // Removed Auto-sync knockout fixtures to allow manual Admin selection

  const selectedMatch = data.matches[selectedMatchIdx];
  const stats0 = selectedMatch ? calculateInningsStats(selectedMatch, 0) : { balls: 0, wickets: 0 };
  const autoActiveIdx = selectedMatch ? ((stats0.balls >= 28 || stats0.wickets >= 5) ? 1 : 0) : 0;
  const currentActiveIdx = adminInningOverride !== null ? adminInningOverride : autoActiveIdx;

  const getActivePlayers = () => {
    if (!selectedMatch) return { striker: '', nonStriker: '' };
    const inning = selectedMatch.innings[currentActiveIdx];
    const teamId = currentActiveIdx === 0 ? selectedMatch.teamA : selectedMatch.teamB;
    const team = data.teams.find(t => t.id === teamId);

    if (inning?.overs.length > 0) {
      const outPlayers = inning.overs.flatMap(o => o.balls)
        .filter(b => b.type === 'wicket' && b.wicket?.player)
        .map(b => b.wicket.player);

      const lastOver = inning.overs[inning.overs.length - 1];
      const lastBall = lastOver?.balls.slice(-1)[0];
      
      if (lastBall) {
        let nextStriker = lastBall.striker;
        let nextNonStriker = lastBall.nonStriker;

        if (lastBall.type === 'wicket') {
           const currentOutPlayers = [...outPlayers];
           const allPlayers = team?.players?.map((p: any) => p?.name || p) || [];
           const availablePlayers = allPlayers.filter(p => !currentOutPlayers.includes(p) && p !== nextNonStriker);
           if (availablePlayers.length > 0) nextStriker = availablePlayers[0];
           else nextStriker = '';
        }

        // Apply run rotation (1 or 3 runs)
        if (lastBall.runs === 1 || lastBall.runs === 3) {
          const temp = nextStriker;
          nextStriker = nextNonStriker;
          nextNonStriker = temp;
        }

        // Apply end-of-over rotation
        const legalBallsCount = lastOver.balls.filter((b: any) => b.type !== 'wide' && b.type !== 'no-ball').length;
        const maxLegalBallsForOver = lastOver.number === 0 ? 4 : 6;
        if (legalBallsCount === maxLegalBallsForOver) {
          const temp = nextStriker;
          nextStriker = nextNonStriker;
          nextNonStriker = temp;
        }

        return { striker: nextStriker, nonStriker: nextNonStriker };
      }
    }
    return { 
      striker: team?.players?.[0]?.name || '', 
      nonStriker: team?.players?.[1]?.name || '' 
    };
  };
  const activePlayers = getActivePlayers();

  const handleNavClick = (id: string) => {
    if (id === 'admin' || id === 'config') {
      if (!isAdmin) {
        setPendingView(id);
        setShowLogin(true);
        return;
      }
    }
    setView(id as any);
  };

  const handleLogin = () => {
    if (pin === 'admin123') {
      setIsAdmin(true);
      setShowLogin(false);
      if (pendingView) setView(pendingView as any);
      setPin('');
    } else {
      alert("Invalid PIN");
    }
  };

  const updateMatch = (updatedMatch: Match) => {
    const newMatches = [...data.matches];
    newMatches[selectedMatchIdx] = updatedMatch;
    setData({ ...data, matches: newMatches });
  };

  const completeMatch = (result: string) => {
    const newMatches = [...data.matches];
    newMatches[selectedMatchIdx] = { 
      ...newMatches[selectedMatchIdx], 
      status: 'completed' as const,
      result 
    };
    setData({ ...data, matches: newMatches });
    setView('home');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans">
      {/* Admin Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative border-4 border-slate-900"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Settings className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter">Admin Access</h3>
                <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">Enter Admin PIN to Secure Console</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="password"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-center text-3xl font-black tracking-[0.5em] focus:border-blue-600 focus:bg-white outline-none transition-all"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => setShowLogin(false)}
                    className="w-full bg-slate-100 text-slate-600 px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLogin}
                    className="w-full bg-slate-900 text-white px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all border-b-4 border-black"
                  >
                    Login
                  </button>
                </div>
                <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest">Pin: admin123</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Dark Dashboard Header */}
      <header className="bg-[#0f111a] text-white px-2 sm:px-4 py-2 sm:py-3 sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3 sm:gap-4 border-r border-white/10 pr-4 sm:pr-6 h-8">
              {data.config.logo ? (
                <img src={data.config.logo} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center rounded-lg shadow-lg">
                  <Trophy className="w-5 text-white" />
                </div>
              )}
              <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase whitespace-nowrap leading-none text-white">
                {data.config.tournamentName || "RSL 2026"}
              </h1>
            </div>

            {isAdmin && (
              <div className="md:hidden flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">Admin</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 sm:gap-8 h-full w-full md:w-auto justify-center md:justify-end">
            <nav className="flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { id: 'home', icon: LayoutDashboard, label: 'Dash' },
                { id: 'players', icon: GitBranch, label: 'Agenda' },
                { id: 'awards', icon: Trophy, label: 'Honours' },
                { id: 'admin', icon: Edit, label: 'Score' },
                { id: 'config', icon: Settings, label: 'Manage' }
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2.5 transition-all shrink-0",
                    view === item.id 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className={cn(view === item.id ? "inline" : "hidden sm:inline")}>{item.label}</span>
                </button>
              ))}
            </nav>

            {isAdmin && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Admin</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-4 border-blue-600 pl-4 mb-4">Live Action</h2>
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                  <div className="flex-1 w-full min-w-0">
                    <MatchBanner match={selectedMatch} tournament={data} 
                      inningIndex={currentActiveIdx}
                      striker={activePlayers.striker}
                      nonStriker={activePlayers.nonStriker}
                      onTeamClick={setSelectedTeamModalId}
                    />
                  </div>
                  
                  <div className="w-full justify-center flex lg:block lg:w-[340px] shrink-0">
                    <OverTrackerPanel inning={selectedMatch?.innings[currentActiveIdx]} className="!mx-0 lg:mr-auto" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-4 border-emerald-600 pl-4">Table Standings</h2>
                <StandingsTable tournament={data} />
              </div>
            </motion.div>
          )}

          {view === 'awards' && (
            <motion.div key="awards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AwardsSection tournament={data} />
            </motion.div>
          )}

          {view === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('home')} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-black uppercase">Scoring Console</h2>
                </div>
                <div className="text-[11px] font-black bg-yellow-400 text-slate-900 px-3 py-1 rounded uppercase flex items-center gap-1 shadow-sm">
                   <div className="w-2 h-2 bg-slate-900 rounded-full animate-pulse"></div> Live Sync
                </div>
              </div>
              
              <MatchBanner match={selectedMatch} tournament={data} 
                inningIndex={currentActiveIdx}
                striker={activePlayers.striker}
                nonStriker={activePlayers.nonStriker}
                hideRecentTrackers={true}
                onTeamClick={setSelectedTeamModalId}
              />
              <ScorerPanel 
                match={selectedMatch} 
                onUpdate={updateMatch} 
                tournament={data} 
                onComplete={completeMatch}
                inningOverride={adminInningOverride}
                onInningOverride={setAdminInningOverride}
                activePlayers={activePlayers}
              />
              <div className="mt-8 flex justify-center">
                <OverTrackerPanel inning={selectedMatch?.innings[currentActiveIdx]} />
              </div>
            </motion.div>
          )}

          {view === 'players' && (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <TournamentTree 
                tournament={data} 
                isAdmin={isAdmin}
                setData={setData}
                onSelect={(idx) => {
                  setSelectedMatchIdx(idx);
                  handleNavClick('admin');
                }} 
              />
            </motion.div>
          )}

          {view === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ManagementPanel data={data} setData={setData} resetToFactory={resetToFactory} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedTeamModalId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex justify-center items-center p-4"
            onClick={() => setSelectedTeamModalId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {(() => {
                const modalTeam = data.teams.find(t => t.id === selectedTeamModalId);
                if (!modalTeam) return null;
                return (
                  <div>
                    <div className="bg-gradient-to-r gap-3 from-blue-700 to-blue-900 p-6 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         {modalTeam.logo ? <img src={modalTeam.logo} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" /> : <Trophy className="w-8 h-8 text-white" />}
                         <h2 className="text-xl font-black uppercase text-white tracking-widest leading-none">{modalTeam.name}</h2>
                       </div>
                       <button onClick={() => setSelectedTeamModalId(null)} className="text-white/60 hover:text-white transition-colors">
                         <X className="w-6 h-6" />
                       </button>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Player Roster</h3>
                      </div>
                      <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
                        {modalTeam.players.map((p: any, i: number) => (
                          <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl hover:border-slate-300 transition-all">
                             <div className="flex items-center gap-3">
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                               <span className="font-bold text-slate-800 text-sm">{p.name.toUpperCase()}</span>
                             </div>
                             <span className="text-[10px] font-black uppercase text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{p.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-4 border-t border-slate-100 py-4 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        Copyright © 2026 | r-pac Lanka (Pvt) Ltd.
      </footer>
    </div>
  );
}
