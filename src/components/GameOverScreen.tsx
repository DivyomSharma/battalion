'use client';

import React, { useEffect } from 'react';
import { GameState } from '@/types/game';
import { getScores } from '@/lib/gameEngine';
import { playSound } from '@/lib/SoundManager';

interface GameOverScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

export default function GameOverScreen({ state, onPlayAgain }: GameOverScreenProps) {
  const winner = state.winner ? state.players[state.winner] : null;

  // Calculate scores (Control Battalion count)
  const scores = getScores(state);

  // Calculate Sector counts for display
  const zoneCounts: Record<string, number> = {};
  for (const playerId of Object.keys(state.players)) {
    zoneCounts[playerId] = 0;
  }

  Object.values(state.zones).forEach(zone => {
    if (zone.majorityOwner) {
      zoneCounts[zone.majorityOwner]++;
    }
  });

  // Sort players by score (majority voters), not zones
  const sortedPlayers = Object.values(state.players).sort(
    (a, b) => scores[b.id] - scores[a.id]
  );

  // Play victory sound on mount
  useEffect(() => {
    playSound('victory_fanfare');
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 war-bg overflow-hidden">
      {/* War Theme Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Tactical Grid */}
        <div className="absolute inset-0 tactical-grid-bg opacity-20" />

        {/* Smoke Overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(30,25,20,0.7) 0%, rgba(20,18,15,0.4) 40%, transparent 70%)'
        }} />

        {/* Victory Fire Glows - Brighter for celebration */}
        <div className="fire-glow" style={{ bottom: '5%', left: '10%', width: '150px', height: '100px', background: 'radial-gradient(ellipse, rgba(255,150,50,0.5) 0%, transparent 70%)' }} />
        <div className="fire-glow" style={{ bottom: '8%', right: '15%', width: '130px', height: '90px', background: 'radial-gradient(ellipse, rgba(255,120,40,0.4) 0%, transparent 70%)', animationDelay: '1s' }} />
        <div className="fire-glow" style={{ bottom: '3%', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '80px', background: 'radial-gradient(ellipse, rgba(255,200,100,0.3) 0%, transparent 70%)', animationDelay: '0.5s' }} />
      </div>

      {/* Vignette */}
      <div className="war-vignette" />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-5 z-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)',
      }} />

      <div className="relative war-panel rounded-lg p-8 max-w-md mx-4 text-center z-20">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#4caf50]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#4caf50]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#4caf50]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#4caf50]" />

        {/* Victory Icon - Military Medal */}
        <div className="text-6xl mb-4 animate-pulse" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' }}>🎖️</div>

        {/* Winner */}
        <h1 className="military-header text-3xl mb-2">
          {winner ? `${winner.name} VICTORIOUS` : 'MISSION COMPLETE'}
        </h1>

        {winner && (
          <div
            className="inline-block px-4 py-2 rounded-lg mb-6 border"
            style={{
              backgroundColor: `${winner.color}20`,
              borderColor: winner.color,
              boxShadow: `0 0 20px ${winner.color}50`
            }}
          >
            <span
              className="text-lg font-bold uppercase tracking-wider font-mono"
              style={{ color: winner.color }}
            >
              {scores[winner.id]} CONTROL BATTALIONS
            </span>
          </div>
        )}

        {/* Scoring Explanation */}
        <p className="text-[#4caf50]/60 text-xs mb-4 uppercase tracking-wider font-mono">
          SCORE = BATTALIONS SECURING CONTROL IN COMMANDED SECTORS
        </p>

        {/* Leaderboard */}
        <div className="mb-6">
          <h3 className="text-[#4caf50] text-sm mb-3 uppercase tracking-widest font-mono border-b border-[#4caf50]/30 pb-2">
            FINAL TACTICAL STANDINGS
          </h3>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`
                  flex items-center justify-between p-3 rounded border transition-all duration-300
                  ${index === 0 ? 'bg-[#4caf50]/10 border-[#4caf50]/50 shadow-[0_0_10px_rgba(76,175,80,0.2)]' : 'bg-black/30 border-gray-800 hover:border-gray-600'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl w-6 text-center">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-gray-600 text-sm font-mono">{index + 1}</span>}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: player.color,
                      boxShadow: `0 0 8px ${player.color}`
                    }}
                  />
                  <span className="text-white font-medium uppercase tracking-wider" style={{ fontFamily: 'var(--font-header)' }}>{player.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold font-mono">{scores[player.id]} <span className="text-[#4caf50]/60 text-xs">PTS</span></span>
                  <span className="text-gray-500 text-xs ml-2 font-mono">({zoneCounts[player.id]} SECTORS)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Play Again */}
        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-[#f44336] text-black font-bold rounded-lg transition-all duration-300 uppercase tracking-widest hover:bg-[#d32f2f] shadow-[0_0_20px_rgba(244,67,54,0.4)] hover:shadow-[0_0_30px_rgba(244,67,54,0.6)]"
          style={{ fontFamily: 'var(--font-header)' }}
        >
          NEW OPERATION
        </button>
      </div>
    </div>
  );
}
