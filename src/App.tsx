/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
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
  GitBranch
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

function MatchBanner({ match, tournament }: { match: Match, tournament: any }) {
  if (!match) return null;
  const teamA = tournament.teams.find((t: any) => t.id === match.teamA);
  const teamB = tournament.teams.find((t: any) => t.id === match.teamB);
  
  const statsA = calculateInningsStats(match, 0);

  return (
    <div className="high-contrast-card p-4 bg-white border-l-8 border-l-slate-900 shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-3 pb-2 border-b border-slate-100 gap-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase text-white", teamA?.group === 'A' ? "bg-blue-600" : "bg-emerald-600")}>
            Group {teamA?.group}
          </div>
          <div className="flex items-center gap-3">
            {teamA?.logo && <img src={teamA.logo} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />}
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">{teamA?.name}</h2>
          </div>
          <span className="label-caps opacity-30 text-[10px]">vs</span>
          <div className="flex items-center gap-3">
            {teamB?.logo && <img src={teamB.logo} className="w-12 h-12 object-contain opacity-40 grayscale" referrerPolicy="no-referrer" />}
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-400">{teamB?.name}</h2>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">{match.title}</span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex-1 flex items-baseline gap-4">
          <div className="text-5xl font-black leading-none tracking-tighter text-slate-900">
            {statsA.runs}<span className="text-slate-300 mx-1">/</span><span className="text-2xl">{statsA.wickets}</span>
          </div>
          <div className="text-xl font-bold text-slate-400">
            {statsA.overs} <span className="text-[10px] uppercase text-slate-300">Overs</span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
           <div className="text-center bg-slate-50 px-3 py-1 rounded border border-slate-100">
              <div className="label-caps !text-[10px] mb-1">CRR</div>
              <div className="font-mono font-black text-sm text-slate-700">{((statsA.runs / (statsA.balls / 6 || 1))).toFixed(2)}</div>
           </div>
           <div className="flex flex-wrap gap-1 items-center bg-white p-1 rounded max-w-[200px] justify-end">
             {match.innings[0].overs.length > 0 && (
               match.innings[0].overs[match.innings[0].overs.length - 1].balls.map((b, i) => (
                 <BallBadge key={i} type={b.type} />
               ))
             )}
           </div>
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

function AwardsDashboard({ tournament }: { tournament: TournamentData }) {
  const awards = getTournamentAwards(tournament);
  
  const AwardItem = ({ label, player, icon: Icon, color }: { label: string, player: any, icon: any, color: string }) => {
    const team = tournament.teams.find(t => t.name === player?.team);
    
    return (
      <div className={cn("p-4 rounded-xl border-t-4 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow", color)}>
        <div className="flex justify-between items-start mb-2">
          <span className="label-caps !text-slate-400">{label}</span>
          <Icon className="w-5 h-5 text-slate-200" />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xl font-black uppercase text-slate-800 leading-none truncate">{player?.name || 'N/A'}</p>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase flex items-center gap-2">
              {team?.logo && <img src={team.logo} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
              {player?.team || 'TBD'}
            </p>
          </div>
          {team?.logo && (
            <div className="w-8 h-8 opacity-10 grayscale absolute right-4 bottom-4 pointer-events-none">
              <img src={team.logo} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-4 border-amber-500 pl-4">Tournament Honours</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AwardItem 
          label="Player of the Series - Male" 
          player={awards.playerOfSeriesMale} 
          icon={Trophy} 
          color="border-blue-600" 
        />
        <AwardItem 
          label="Player of the Series - Female" 
          player={awards.playerOfSeriesFemale} 
          icon={Trophy} 
          color="border-pink-500" 
        />
        <AwardItem 
          label="Best Batsman - Male" 
          player={awards.bestBatsmanMale} 
          icon={Trophy} 
          color="border-amber-500" 
        />
        <AwardItem 
          label="Best Batsman - Female" 
          player={awards.bestBatsmanFemale} 
          icon={Trophy} 
          color="border-pink-400" 
        />
        <AwardItem 
          label="Best Bowler - Male" 
          player={awards.bestBowlerMale} 
          icon={Trophy} 
          color="border-emerald-600" 
        />
        <AwardItem 
          label="Best Bowler - Female" 
          player={awards.bestBowlerFemale} 
          icon={Trophy} 
          color="border-rose-400" 
        />
         <AwardItem 
          label="Man of the Match - Finale" 
          player={{ name: awards.manOfTheMatchFinale, team: 'Grand Finalist' }} 
          icon={Trophy} 
          color="border-slate-900" 
        />
      </div>
    </div>
  );
}

function TournamentTree({ tournament, setData, onSelect }: { tournament: TournamentData, setData: (d: any) => void, onSelect: (idx: number) => void }) {
  const matches = tournament.matches || [];
  const teams = tournament.teams || [];
  
  const quarters = [matches[8], matches[9], matches[10], matches[11]];
  const semis = [matches[12], matches[13]];
  const final = matches[14];

  const MatchNode = ({ match, label, championship = false }: { match: Match | undefined, label: string, championship?: boolean }) => {
    if (!match) return null;
    const actualIdx = tournament.matches.findIndex(m => m.id === match.id);

    return (
      <div className={cn("flex flex-col gap-0.5", championship ? "w-56" : "w-36")}>
        <div className="bg-slate-800/90 px-2 py-0.5 rounded-t-md flex justify-between items-center border-t border-x border-white/10">
          <span className="text-[6px] font-black uppercase text-slate-400 tracking-widest truncate">{label}</span>
          <button onClick={() => onSelect(actualIdx)} className="text-[5px] text-blue-400 hover:text-white uppercase font-black">Score</button>
        </div>
        <div className="flex flex-col gap-px bg-slate-700/50 rounded-b-md overflow-hidden border border-white/5">
          {[
            { id: match.teamA, key: 'teamA' as const, color: 'border-blue-500' },
            { id: match.teamB, key: 'teamB' as const, color: 'border-emerald-500' }
          ].map((slot) => {
            const team = teams.find(t => t.id === slot.id);
            return (
              <div key={slot.key} className={cn("flex items-center bg-slate-900 h-8 px-2 border-l-2 hover:bg-slate-800 transition-colors relative group", slot.color)}>
                 {team?.logo ? (
                   <img src={team.logo} className="w-6 h-6 object-contain mr-2" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center mr-2"><div className="w-1 h-1 bg-white/10 rounded-full"></div></div>
                 )}
                 <select
                   value={slot.id || ''}
                   onChange={(e) => {
                      const newMatches = [...tournament.matches];
                      newMatches[actualIdx] = { ...newMatches[actualIdx], [slot.key]: e.target.value };
                      setData({ ...tournament, matches: newMatches });
                   }}
                   className="flex-1 bg-transparent text-[8px] font-black uppercase text-white outline-none cursor-pointer appearance-none pr-4"
                 >
                   <option value="" className="bg-slate-900">SELECT</option>
                   {teams.map(t => <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>)}
                 </select>
                 <ChevronRight className="w-2 h-2 text-white/20 absolute right-1 group-hover:text-white/60 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative bg-[#070b14] rounded-[32px] p-6 lg:p-12 border-4 border-slate-900 overflow-hidden shadow-3xl">
       {/* High-Tech Background Decor */}
       <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[120px] rounded-full"></div>
       <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[120px] rounded-full"></div>

       <div className="relative z-10 flex flex-col items-center">
          <div className="mb-12 text-center">
             <h2 className="text-3xl font-black italic text-white tracking-tight flex items-center justify-center gap-4">
                TOURNAMENT <span className="text-blue-500">SCHEDULE</span>
             </h2>
             <div className="h-0.5 w-16 bg-blue-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>

          <div className="grid grid-cols-5 items-center w-full max-w-5xl">
             {/* Left Quarters */}
             <div className="flex flex-col gap-16">
                <MatchNode match={quarters[0]} label="QUARTER-FINAL 01" />
                <MatchNode match={quarters[1]} label="QUARTER-FINAL 02" />
             </div>

             {/* Connector 1 */}
             <div className="flex items-center justify-center">
                <div className="w-8 h-40 border-y-2 border-r-2 border-white/5 rounded-r-2xl relative left-2">
                   <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-white/5"></div>
                </div>
             </div>

             {/* Semis & Finals */}
             <div className="flex flex-col items-center gap-16">
                <MatchNode match={semis[0]} label="SEMI-FINAL 01" />
                
                <div className="relative flex flex-col items-center py-10">
                   <div className="absolute -top-6 animate-bounce">
                      <Trophy className="w-16 h-16 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                   </div>
                   <MatchNode match={final} label="CHAMPIONSHIP FINALE" championship />
                   <div className="mt-4 px-8 py-1.5 bg-yellow-500 rounded-full shadow-lg">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-[0.3em]">CHAMPION</span>
                   </div>
                </div>

                <MatchNode match={semis[1]} label="SEMI-FINAL 02" />
             </div>

             {/* Connector 2 */}
             <div className="flex items-center justify-center">
                <div className="w-8 h-40 border-y-2 border-l-2 border-white/5 rounded-l-2xl relative right-2">
                   <div className="absolute top-1/2 -left-4 w-4 h-0.5 bg-white/5"></div>
                </div>
             </div>

             {/* Right Quarters */}
             <div className="flex flex-col gap-16 items-end">
                <MatchNode match={quarters[2]} label="QUARTER-FINAL 03" />
                <MatchNode match={quarters[3]} label="QUARTER-FINAL 04" />
             </div>
          </div>
       </div>

       {/* Pool Standings Summary - Ultra Compact */}
       <div className="grid grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/5">
          {['A', 'B'].map((group) => (
             <React.Fragment key={group}>
                {[1, 2].map((num) => {
                   const gKey = `${group}${num}`;
                   const poolTeams = teams.filter(t => t.group === group).slice((num-1)*2, num*2);
                   return (
                      <div key={gKey} className="bg-slate-900/40 p-2 rounded-xl border border-white/5">
                         <div className="text-[7px] font-black uppercase text-slate-500 mb-2 tracking-widest text-center">Group Pool {gKey}</div>
                         <div className="space-y-1">
                            {poolTeams.map((t, idx) => (
                               <div key={idx} className="bg-slate-950/50 p-1.5 rounded-lg flex items-center gap-2 border border-white/5">
                                  {t.logo && <img src={t.logo} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />}
                                  <span className="text-[7px] font-black uppercase text-white/80 truncate">{t.name}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )
                })}
             </React.Fragment>
          ))}
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
                  match.status === 'completed' ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-500"
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

function ScorerPanel({ match, onUpdate, tournament, onComplete }: { match: Match, onUpdate: (m: Match) => void, tournament: any, onComplete: (res: string) => void }) {
  if (!match) return (
    <div className="p-8 text-center bg-white rounded-2xl border-4 border-dashed border-slate-200">
      <p className="text-xl font-black uppercase text-slate-300">No match selected for scoring</p>
    </div>
  );
  
  const teamA = tournament.teams.find((t: any) => t.id === match.teamA);
  const teamB = tournament.teams.find((t: any) => t.id === match.teamB);
  
  const [striker, setStriker] = useState(teamA?.players?.[0] || 'Striker');
  const [nonStriker, setNonStriker] = useState(teamA?.players?.[1] || 'Non-Striker');
  const [bowler, setBowler] = useState(teamB?.players?.[0] || 'Bowler');

  const handleBall = (type: RunType) => {
    const updatedMatch = { ...match };
    const currentInning = updatedMatch.innings[0];
    
    const lastOverIndex = currentInning.overs.length - 1;
    const lastOverRef = currentInning.overs[lastOverIndex];
    const legalBallsCount = lastOverRef ? lastOverRef.balls.filter(b => b.type !== 'wide' && b.type !== 'no-ball').length : 0;

    if (currentInning.overs.length === 0 || legalBallsCount === 6) {
      currentInning.overs.push({
        number: currentInning.overs.length,
        bowler: bowler,
        balls: []
      });
    }
    
    const lastOver = currentInning.overs[currentInning.overs.length - 1];
    let actualRuns = 0;
    let actualExtras = 0;

    if (type === 'wide') actualExtras = 4;
    else if (type === 'no-ball') actualExtras = 1;
    else if (type !== 'wicket' && type !== 'dot') actualRuns = parseInt(type);

    lastOver.balls.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      runs: actualRuns,
      extras: actualExtras,
      striker: striker,
      nonStriker: nonStriker,
      bowler: bowler,
      wicket: type === 'wicket' ? { player: striker, type: 'bowled' } : undefined
    });
    
    onUpdate(updatedMatch);
  };

  return (
    <div className="mt-4 p-4 high-contrast-card bg-slate-50 border-slate-900">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black uppercase text-slate-800">Scoring Controls</h3>
        <button 
           onClick={() => {
             const statsA = calculateInningsStats(match, 0);
             const statsB = calculateInningsStats(match, 1);
             const winner = statsA.runs > statsB.runs ? tournament.teams.find((t: any) => t.id === match.teamA)?.name : tournament.teams.find((t: any) => t.id === match.teamB)?.name;
             onComplete(`${winner} won by ${Math.abs(statsA.runs - statsB.runs)} runs`);
           }}
           className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[11px] font-black uppercase shadow-md active:scale-95 transition-all"
        >
          Finish & Close Match
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
        <div>
          <label className="manage-label-sm">On Strike</label>
          <select 
            value={striker} 
            onChange={(e) => setStriker(e.target.value)}
            className="w-full bg-white border border-slate-200 p-1.5 rounded text-[12px] font-bold"
          >
            {teamA?.players?.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="manage-label-sm">Non-Striker</label>
          <select 
            value={nonStriker} 
            onChange={(e) => setNonStriker(e.target.value)}
            className="w-full bg-white border border-slate-200 p-1.5 rounded text-[12px] font-bold"
          >
            {teamA?.players?.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="manage-label-sm">Bowler</label>
          <select 
            value={bowler} 
            onChange={(e) => setBowler(e.target.value)}
            className="w-full bg-white border border-slate-200 p-1.5 rounded text-[12px] font-bold"
          >
            {teamB?.players?.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="label-caps !text-[11px]">Tap to Score</div>
        <button 
          onClick={() => {
             const updatedMatch = { ...match };
             const currentInning = updatedMatch.innings[0];
             const lastOver = currentInning.overs[currentInning.overs.length - 1];
             if (lastOver?.balls.length > 0) {
               lastOver.balls.pop();
               if (lastOver.balls.length === 0) currentInning.overs.pop();
               onUpdate(updatedMatch);
             }
          }}
          className="text-[11px] font-black uppercase text-red-500 hover:text-red-700 underline"
        >
          Undo
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-9 gap-2">
        {(['dot', '1', '2', '3', '4', '6', 'wide', 'no-ball', 'wicket'] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleBall(type)}
            className={cn(
              "flex flex-col items-center justify-center aspect-square bg-white border border-slate-200 hover:bg-slate-900 hover:text-white rounded-lg transition-all shadow-sm active:scale-95",
              type === 'wicket' && "border-rose-200 bg-rose-50/30",
              (type === '4' || type === '6') && "border-amber-200 bg-amber-50/30"
            )}
          >
            <BallBadge type={type} />
            <span className="text-[10px] font-black uppercase mt-1 opacity-60">{type}</span>
          </button>
        ))}
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

function ManagementPanel({ data, setData }: { data: TournamentData, setData: (d: any) => void }) {
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

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tournament Info */}
        <div className="high-contrast-card p-3 bg-white md:col-span-1 border-blue-100">
           <div className="flex items-center gap-4">
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
                  className="bg-transparent border-b border-slate-200 font-black uppercase text-xs w-full outline-none focus:border-blue-600 transition-colors py-1"
                />
             </div>
           </div>
        </div>

        {/* Quick Add Team */}
        <div className="high-contrast-card p-3 md:col-span-2 border-slate-200 bg-slate-50/50">
          <span className="manage-label-sm">Register New Team</span>
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
            <input 
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="ENTER TEAM NAME..."
              className="manage-text-sm px-3 flex-1 outline-none font-bold"
            />
            <div className="flex border-l border-slate-200 pl-2 gap-1 items-center">
              <select 
                value={teamGroup}
                onChange={(e) => setTeamGroup(e.target.value as any)}
                className="manage-text-sm bg-transparent px-2 outline-none font-black text-blue-600"
              >
                <option value="A">GRP A</option>
                <option value="B">GRP B</option>
              </select>
              <button onClick={addTeam} className="bg-slate-900 text-white px-6 py-2 rounded-md text-[10px] font-black uppercase hover:bg-black transition-colors active:scale-95">Add Team</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.matches.map((match, idx) => (
          <div key={match.id} className="high-contrast-card p-3 bg-white border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black uppercase text-slate-400">{match.title}</span>
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
                        {team.players?.map((p: any, idx: number) => (
                          <span key={idx} className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-1 border transition-colors",
                            p.gender === 'male' ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-pink-50 border-pink-100 text-pink-700"
                          )}>
                            {p.name}
                            <Trash2 
                              onClick={() => updateTeamField(team.id, 'players', team.players.filter((_: any, i: number) => i !== idx))}
                              className="w-2 h-2 opacity-30 hover:opacity-100 cursor-pointer" 
                            />
                          </span>
                        ))}
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

      <div className="pt-8 border-t border-slate-200 mt-12">
        <div className="bg-red-50 p-6 rounded-2xl border-2 border-dashed border-red-100 flex flex-col items-center gap-4">
          <div className="text-center">
            <h4 className="text-sm font-black uppercase text-red-900 mb-1">System Recovery</h4>
            <p className="text-[10px] text-red-600 uppercase font-bold tracking-tight">Use this if the app crashes or goes white due to large images</p>
          </div>
          <button 
            onClick={() => {
              if (confirm("DANGEROUS: This will delete ALL tournament data, teams, and matches. Continue?")) {
                localStorage.removeItem('cricket_tournament_data');
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const [data, setData] = useTournament();
  const [view, setView] = useState<'home' | 'players' | 'admin' | 'config' | 'awards'>('home');
  const [selectedMatchIdx, setSelectedMatchIdx] = useState(0);

  const selectedMatch = data.matches[selectedMatchIdx];

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
      {/* Colorful High-Contrast Header */}
      <header className="bg-header-bg text-white px-4 py-3 sticky top-0 z-50 border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {data.config.logo ? (
              <img src={data.config.logo} alt="Logo" className="w-24 h-24 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 bg-blue-600 flex items-center justify-center rounded-lg shadow-inner">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">{data.config.tournamentName}</h1>
              <span className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase">Tournament Dashboard</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {[
              { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'players', icon: GitBranch, label: 'Agenda' },
              { id: 'awards', icon: Trophy, label: 'Honours' },
              { id: 'admin', icon: Edit, label: 'Scoring' },
              { id: 'config', icon: Settings, label: 'Manage' }
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-wider flex items-center gap-2 transition-all",
                  view === item.id 
                    ? "bg-white text-slate-900 shadow-md scale-105" 
                    : "text-white/60 hover:text-white"
                )}
              >
                <item.icon className="w-3 h-3" /> {item.label}
              </button>
            ))}
          </nav>
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
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-4 border-blue-600 pl-4">Live Action</h2>
                <MatchBanner match={selectedMatch} tournament={data} />
              </div>
              
              <div className="space-y-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 border-l-4 border-emerald-600 pl-4">Table Standings</h2>
                <StandingsTable tournament={data} />
              </div>
            </motion.div>
          )}

          {view === 'awards' && (
            <motion.div key="awards" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AwardsDashboard tournament={data} />
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
              
              <MatchBanner match={selectedMatch} tournament={data} />
              <ScorerPanel 
                match={selectedMatch} 
                onUpdate={updateMatch} 
                tournament={data} 
                onComplete={completeMatch}
              />
            </motion.div>
          )}

          {view === 'players' && (
            <motion.div key="players" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
               <TournamentTree 
                tournament={data} 
                setData={setData}
                onSelect={(idx) => {
                  setSelectedMatchIdx(idx);
                  setView('admin');
                }} 
              />
               <MatchGrid 
                tournament={data} 
                onSelect={(idx) => {
                  setSelectedMatchIdx(idx);
                  setView('admin');
                }} 
              />
            </motion.div>
          )}

          {view === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ManagementPanel data={data} setData={setData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-8 border-t border-slate-100 py-8 text-center text-[13px] font-bold text-slate-400 uppercase tracking-[0.2em]">
        Copyright © 2026 | r-pac Lanka (Pvt) Ltd.
      </footer>
    </div>
  );
}
