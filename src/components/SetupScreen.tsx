'use client';

import React, { useState } from 'react';
import { PLAYER_COLORS } from '@/types/game';
import { gameTitle, gameSubtitle } from '@/data/displayNames';

interface SetupScreenProps {
  onStart: (playerNames: string[], playerColors: string[]) => void;
  onBack: () => void;
}

export default function SetupScreen({ onStart, onBack }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Operative 1', 'Operative 2', 'Operative 3', 'Operative 4', 'Operative 5']);
  const [shuffledColors, setShuffledColors] = useState<string[]>([]);
  const [smokePuffStyles, setSmokePuffStyles] = useState<Array<{width: number, height: number, opacity: number, duration: number, delay: number}>>([]);

  React.useEffect(() => {
    // Generate smoke puff styles on mount to avoid hydration mismatch
    setSmokePuffStyles(
      [...Array(12)].map(() => ({
        width: 80 + Math.random() * 100,
        height: 60 + Math.random() * 80,
        opacity: 0.3 + Math.random() * 0.2,
        duration: 3 + Math.random() * 3,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  React.useEffect(() => {
    // Shuffle colors once on mount
    const colors = [...PLAYER_COLORS];
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    setShuffledColors(colors);
  }, []);

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const names = playerNames.slice(0, playerCount).map(
      (name, i) => name.trim() || `Operative ${i + 1}`
    );
    // Pass the specific colors assigned to these players
    const colors = shuffledColors.slice(0, playerCount);
    onStart(names, colors);
  };

  if (shuffledColors.length === 0) return null; // Wait for hydration

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a08]">
      {/* Enhanced Smoke Overlay - Matching LandingPage */}
      {/* ... (keep background effects) ... */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        {/* Bottom smoke layer */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%]" style={{
          background: 'linear-gradient(to top, rgba(30,25,20,0.95) 0%, rgba(30,25,20,0.7) 30%, rgba(30,25,20,0.3) 60%, transparent 100%)'
        }} />

        {/* Smoke puffs */}
        {smokePuffStyles.map((puff, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${5 + i * 8}%`,
              bottom: `${5 + (i % 3) * 8}%`,
              width: `${puff.width}px`,
              height: `${puff.height}px`,
              background: `radial-gradient(ellipse, rgba(60,50,40,${puff.opacity}) 0%, transparent 70%)`,
              animationDuration: `${puff.duration}s`,
              animationDelay: `${puff.delay}s`,
              filter: 'blur(10px)',
            }}
          />
        ))}

        {/* Fire glow effects */}
        <div className="absolute bottom-[10%] left-[15%] w-40 h-32 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,100,30,0.4) 0%, rgba(255,50,0,0.2) 40%, transparent 70%)',
          animationDuration: '2s',
          filter: 'blur(20px)',
        }} />
        <div className="absolute bottom-[8%] right-[25%] w-32 h-28 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,80,20,0.35) 0%, rgba(255,40,0,0.15) 40%, transparent 70%)',
          animationDuration: '3s',
          animationDelay: '1s',
          filter: 'blur(15px)',
        }} />
      </div>

      {/* Vignette */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)'
      }} />

      {/* Military Corner Brackets */}
      <div className="fixed inset-0 z-[3] pointer-events-none">
        <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-[#4caf50]/60" />
        <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-[#4caf50]/60" />
        <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-[#4caf50]/60" />
        <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-[#4caf50]/60" />
      </div>

      {/* Radar Display - Top Right */}
      <div className="fixed top-6 right-6 z-[4] pointer-events-none">
        <div className="w-24 h-24 rounded-full border-2 border-[#4caf50]/40 relative bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-2 rounded-full border border-[#4caf50]/20" />
          <div className="absolute inset-4 rounded-full border border-[#4caf50]/15" />
          <div className="absolute inset-6 rounded-full border border-[#4caf50]/10" />
          <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-[#4caf50] to-transparent origin-left animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#4caf50] rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[#4caf50]/60 text-[10px] font-mono text-center mt-1">TACTICAL RADAR</p>
      </div>

      {/* Status Panel - Top Left */}
      <div className="fixed top-6 left-6 z-[4] pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm border border-[#4caf50]/30 rounded px-3 py-2">
          <div className="text-[#4caf50] font-mono text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#4caf50] rounded-full animate-pulse" />
              <span>LOCAL OPS</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span>SETUP PHASE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="fixed inset-0 z-[3] pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.1) 2px, rgba(76,175,80,0.1) 4px)',
      }} />

      {/* Main Content Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 font-mono">
        <div className="relative bg-black/70 backdrop-blur-xl border border-[#4caf50]/30 rounded-lg p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(76,175,80,0.1)]">

          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors mb-6 font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            BACK TO HQ
          </button>

          {/* Command Center Header */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4">
            <span className="text-[#4caf50] text-xs font-mono tracking-wider">LOCAL COMMAND</span>
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#4caf50]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#4caf50]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#4caf50]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#4caf50]" />

          {/* Logo/Title */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-2 tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-[#d4d4d4] via-[#a0a0a0] to-[#606060]" style={{ textShadow: '0 0 30px rgba(76,175,80,0.4)' }}>
              {gameTitle}
            </h1>
            <p className="text-[#4caf50]/80 uppercase tracking-widest text-xs border-y border-[#4caf50]/20 py-1 inline-block px-4">
              {gameSubtitle}
            </p>
          </div>

          {/* Player Count */}
          <div className="mb-8">
            <label className="block text-[#4caf50] text-sm mb-3 uppercase tracking-wider font-bold">
              <span className="mr-2">▶</span> Operation Scale
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(count => (
                <button
                  key={count}
                  onClick={() => setPlayerCount(count)}
                  className={`
                  flex-1 py-3 rounded font-bold transition-all relative overflow-hidden group
                  ${playerCount === count
                      ? 'bg-[#4caf50] text-[#0a0a0a] shadow-[0_0_15px_#4caf50]'
                      : 'bg-[#0a0a0a] border border-[#4caf50]/30 text-[#4caf50]/80 hover:border-[#4caf50] hover:text-[#4caf50]'
                    }
                `}
                >
                  <span className="relative z-10">{count}</span>
                  {playerCount !== count && (
                    <div className="absolute inset-0 bg-[#4caf50]/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Player Names */}
          <div className="mb-10 space-y-3">
            <label className="block text-[#4caf50] text-sm mb-3 uppercase tracking-wider font-bold">
              <span className="mr-2">▶</span> Operative Identities
            </label>
            {Array.from({ length: playerCount }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0 transition-all group-hover:scale-125"
                  style={{
                    backgroundColor: shuffledColors[index],
                    boxShadow: `0 0 10px ${shuffledColors[index]}`
                  }}
                />
                <input
                  type="text"
                  value={playerNames[index]}
                  onChange={e => handleNameChange(index, e.target.value)}
                  placeholder={`OPERATIVE ${index + 1}`}
                  className="
                  flex-1 bg-[#0a0a0a] text-[#4caf50] px-4 py-2.5 rounded
                  border border-[#4caf50]/30 focus:border-[#4caf50] focus:shadow-[0_0_10px_rgba(76,175,80,0.2)]
                  focus:outline-none transition-all placeholder-[#4caf50]/20 font-mono uppercase text-sm
                "
                />
              </div>
            ))}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="
            w-full py-4 bg-[#f44336] hover:bg-[#d32f2f]
            text-[#0a0a0a] text-lg font-bold uppercase tracking-[0.2em]
            rounded transition-all shadow-[0_0_20px_rgba(244,67,54,0.4)]
            hover:shadow-[0_0_30px_rgba(244,67,54,0.6)]
            relative overflow-hidden group
          "
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              INITIATE OPERATION <span className="text-xl">►</span>
            </span>
          </button>

          {/* Instructions */}
          <div className="mt-8 text-center border-t border-[#4caf50]/20 pt-4">
            <p className="text-[#4caf50]/70 text-[10px] uppercase tracking-wider">
              Secure sector majority to establish control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
