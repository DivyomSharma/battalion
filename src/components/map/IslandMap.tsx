'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { calculateZoneMajority } from '@/lib/gameEngine';
import ZoneComponent from '../Zone';

interface IslandMapProps {
  state: GameState;
  onSlotClick: (zoneId: string, slotIndex: number) => void;
  selectedSlot: { zoneId: string; slotIndex: number } | null;
  highlightedZones?: string[];
}

const SECTOR_GRID = [
  ['zone_1', 'zone_6', 'zone_2'],
  ['zone_0', 'zone_8', 'zone_3'],
  ['zone_4', 'zone_7', 'zone_5'],
];

export default function IslandMap({
  state,
  onSlotClick,
  selectedSlot,
  highlightedZones = [],
}: IslandMapProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0a08]">
      {/* Enhanced Smoke Overlay - Bottom Battlefield */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {/* Bottom smoke layer */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%]" style={{
          background: 'linear-gradient(to top, rgba(30,25,20,0.8) 0%, rgba(30,25,20,0.4) 50%, transparent 100%)'
        }} />

        {/* Smoke puffs */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`smoke-${i}`}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${2 + (i % 3) * 5}%`,
              width: `${60 + (i * 10)}px`,
              height: `${40 + (i * 8)}px`,
              background: `radial-gradient(ellipse, rgba(60,50,40,0.4) 0%, transparent 70%)`,
              animationDuration: `${4 + i * 0.5}s`,
              animationDelay: `${i * 0.3}s`,
              filter: 'blur(8px)',
            }}
          />
        ))}

        {/* Fire glow effects */}
        <div className="absolute bottom-[5%] left-[20%] w-24 h-20 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,100,30,0.35) 0%, transparent 70%)',
          animationDuration: '2s',
          filter: 'blur(15px)',
        }} />
        <div className="absolute bottom-[3%] right-[30%] w-20 h-16 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,80,20,0.3) 0%, transparent 70%)',
          animationDuration: '3s',
          animationDelay: '1s',
          filter: 'blur(12px)',
        }} />
        <div className="absolute bottom-[8%] left-[60%] w-16 h-14 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,120,40,0.25) 0%, transparent 60%)',
          animationDuration: '2.5s',
          animationDelay: '0.5s',
          filter: 'blur(10px)',
        }} />
      </div>

      {/* Tactical Grid Background */}
      <div
        className="absolute inset-0 opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(76, 175, 80, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(76, 175, 80, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* CRT Scanlines */}
      <div className="absolute inset-0 z-[2] pointer-events-none opacity-[0.04]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.15) 2px, rgba(76,175,80,0.15) 4px)',
      }} />

      {/* 9 Sector Grid */}
      <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-2 z-10">
        {SECTOR_GRID.flat().map((zoneId, index) => {
          const zone = state.zones[zoneId];
          if (!zone) return <div key={index} />;

          const majority = calculateZoneMajority(zone, state.players);
          const majorityPlayer = majority.majorityOwner
            ? state.players[majority.majorityOwner]
            : null;
          const isProtected = state.protectedZones?.includes(zone.id) || false;
          const isHighlighted = highlightedZones.includes(zone.id);

          return (
            <div
              key={zone.id}
              className={`
                relative flex flex-col rounded-lg overflow-hidden
                transition-all duration-200 font-mono
                ${isHighlighted ? 'z-20 scale-[1.02]' : 'z-10'}
              `}
              style={{
                background: 'linear-gradient(135deg, rgba(15,15,15,0.95) 0%, rgba(10,10,10,0.98) 100%)',
                border: `2px solid ${isHighlighted ? '#4caf50' : 'rgba(76, 175, 80, 0.4)'}`,
                boxShadow: isHighlighted
                  ? '0 0 30px rgba(76, 175, 80, 0.5), inset 0 0 30px rgba(76, 175, 80, 0.1)'
                  : '0 0 15px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Sector Header */}
              <div className="px-3 py-2 flex items-center justify-between border-b-2 border-[#4caf50]/30 bg-black/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-[#4caf50] uppercase tracking-wider font-bold" style={{ textShadow: '0 0 10px rgba(76, 175, 80, 0.8)' }}>
                    {zone.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-[#4caf50]/60 font-mono bg-black/50 px-1.5 py-0.5 rounded">
                    {zone.majorityRequired}/{zone.capacity}
                  </span>
                </div>
                {isProtected && (
                  <span className="text-[#f44336] text-xs animate-pulse">🛡️</span>
                )}
              </div>

              {/* Zone Content */}
              <div className="flex-1 relative flex items-center justify-center p-2">
                <ZoneComponent
                  zone={zone}
                  players={state.players}
                  majorityPlayer={majorityPlayer}
                  isTied={majority.isTied}
                  onSlotClick={slotIndex => onSlotClick(zone.id, slotIndex)}
                  selectedSlot={
                    selectedSlot?.zoneId === zone.id ? selectedSlot.slotIndex : null
                  }
                  isHighlighted={isHighlighted}
                  isProtected={isProtected}
                />
              </div>

              {/* Majority Indicator */}
              {majorityPlayer && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div
                    className="px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: majorityPlayer.color,
                      color: '#0a0a0a',
                      boxShadow: `0 0 20px ${majorityPlayer.color}, 0 0 40px ${majorityPlayer.color}40`
                    }}
                  >
                    {majorityPlayer.name}
                  </div>
                </div>
              )}
              {majority.isTied && !majorityPlayer && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
                  <div className="px-4 py-1.5 rounded-lg text-xs font-bold uppercase bg-[#f44336] text-black animate-pulse" style={{ boxShadow: '0 0 20px #f44336' }}>
                    CONTESTED
                  </div>
                </div>
              )}

              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#4caf50]/70" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#4caf50]/70" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#4caf50]/70" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#4caf50]/70" />
            </div>
          );
        })}
      </div>

      {/* Large Outer Corner Brackets */}
      <div className="absolute top-2 left-2 w-12 h-12 border-t-3 border-l-3 border-[#4caf50] pointer-events-none z-20" style={{ borderWidth: '3px 0 0 3px' }} />
      <div className="absolute top-2 right-2 w-12 h-12 border-t-3 border-r-3 border-[#4caf50] pointer-events-none z-20" style={{ borderWidth: '3px 3px 0 0' }} />
      <div className="absolute bottom-2 left-2 w-12 h-12 border-b-3 border-l-3 border-[#4caf50] pointer-events-none z-20" style={{ borderWidth: '0 0 3px 3px' }} />
      <div className="absolute bottom-2 right-2 w-12 h-12 border-b-3 border-r-3 border-[#4caf50] pointer-events-none z-20" style={{ borderWidth: '0 3px 3px 0' }} />

      {/* Vignette */}
      <div className="absolute inset-0 z-[3] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)'
      }} />
    </div>
  );
}
