'use client';

import React from 'react';
import { Player, Resources, IdeologyTracks, RESOURCE_COLORS, IDEOLOGY_COLORS, ResourceType, IdeologyType } from '@/types/game';
import { hasUnlockedPower } from '@/data/powers';
import { resourceNames, commanderAbbreviations } from '@/data/displayNames';

interface CockpitDashboardProps {
  player: Player;
  isActive: boolean;
}

const resourceIcons: Record<ResourceType, string> = {
  funds: '📦',
  clout: '💥',
  media: '🔍',
  trust: '🛡️',
};

const ideologyIcons: Record<IdeologyType, string> = {
  capitalist: '🏗️',
  supremo: '⚔️',
  showstopper: '📡',
  idealist: '🕊️',
};

// --- Helper Components ---

function SegmentedBar({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  // Cap visual segments at max to prevent overflow, but value can be higher
  const visualMax = Math.max(max, value);

  return (
    <div className="flex gap-0.5 mt-1 h-2 w-full max-w-[100px]">
      {Array.from({ length: 8 }).map((_, i) => {
        // 8 segments representing "fullness" roughly? 
        // Better: just distinct segments for small numbers
        const isActive = i < value;
        return (
          <div
            key={i}
            className={`flex-1 ${isActive ? 'opacity-100 box-shadow-glow' : 'opacity-20'}`}
            style={{
              backgroundColor: isActive ? color : '#333',
              border: '1px solid',
              borderColor: isActive ? color : '#555',
              boxShadow: isActive ? `0 0 5px ${color}` : 'none'
            }}
          />
        );
      })}
      {value > 8 && <span style={{ color }} className="text-[10px] ml-1 font-bold">+{value - 8}</span>}
    </div>
  );
}

// --- Main Components ---

export function CockpitDashboard({ player, isActive }: CockpitDashboardProps) {
  if (!player) return null;

  return (
    <div className="command-terminal flex items-center justify-between px-4 py-2 h-24">

      {/* 1. Commander Identity (Left) */}
      <div className="flex items-center gap-4 border-r border-gray-700 pr-6 h-full">
        <div className="hex-frame shadow-lg relative shrink-0">
          <div className="hex-frame-inner relative">
            <div
              className="absolute inset-0 opacity-30"
              style={{ backgroundColor: player.color }}
            />
            <span className="text-2xl z-10 font-bold" style={{ color: player.color }}>
              {player.name.charAt(0)}
            </span>
          </div>
          {isActive && <div className="absolute top-0 right-0 status-light" />}
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase mb-0.5">Commander</span>
          <span className="text-lg font-bold uppercase glow-text leading-none" style={{ color: player.color, fontFamily: 'var(--font-header)' }}>
            {player.name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded border border-gray-600 ${isActive ? 'bg-green-900/50 text-green-400 border-green-500' : 'text-gray-500'}`}>
              {isActive ? 'STATUS: ACTIVE' : 'STATUS: STANDBY'}
            </span>
            <span className="text-[10px] text-yellow-500 font-mono">
              RES: {Object.values(player.resources).reduce((a, b) => a + b, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Resource Grid (Center-Left) */}
      <div className="flex gap-4 px-6 border-r border-gray-700 h-full items-center">
        {(Object.entries(player.resources) as [ResourceType, number][]).map(([res, amount]) => (
          <div key={res} className="w-20">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: RESOURCE_COLORS[res] }}>
                {resourceNames[res]}
              </span>
              <span className="text-xl font-bold font-mono leading-none" style={{ color: RESOURCE_COLORS[res] }}>
                {amount}
              </span>
            </div>
            {/* Custom Segmented Bar CSS Logic */}
            <div className="flex gap-0.5 h-1.5 w-full bg-gray-800/50">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[1px]"
                  style={{
                    backgroundColor: i < amount ? RESOURCE_COLORS[res] : 'transparent',
                    opacity: i < amount ? 1 : 0.1,
                    border: i < amount ? 'none' : `1px solid ${RESOURCE_COLORS[res]}`
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        {/* Voter Bank Display */}
        <div className="ml-2 pl-4 border-l border-gray-800 flex flex-col items-center">
          <span className="text-[10px] text-gray-500 uppercase">RESERVE</span>
          <span className="text-2xl font-bold text-white font-mono">{player.battalionReserve}</span>
          <span className="text-[10px] text-gray-500">UNITS</span>
        </div>
      </div>

      {/* 3. Ideology Tracks / Powers (Center-Right) */}
      <div className="flex-1 px-6 h-full flex items-center justify-around">
        {(Object.entries(player.ideologyTracks) as [IdeologyType, number][]).map(([ideology, level]) => (
          <div key={ideology} className="flex flex-col items-center group relative">
            <div className="w-10 h-10 border border-gray-700 rounded bg-gray-900/50 flex items-center justify-center mb-1 group-hover:border-gray-500 transition-colors">
              <span className="text-lg opacity-80" style={{ filter: level === 0 ? 'grayscale(1)' : 'none' }}>
                {ideologyIcons[ideology]}
              </span>
              {level > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-black" style={{ backgroundColor: IDEOLOGY_COLORS[ideology] }}>
                  {level}
                </div>
              )}
            </div>
            {/* Power Pips */}
            <div className="flex gap-1">
              {[2, 3, 5].map(pLvl => (
                <div
                  key={pLvl}
                  className={`w-1.5 h-1.5 rounded-full ${level >= pLvl ? 'animate-pulse-glow' : 'opacity-20'}`}
                  style={{ backgroundColor: level >= pLvl ? IDEOLOGY_COLORS[ideology] : '#555' }}
                  title={`Power Level ${pLvl}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

// Side-bar compact roster
export function TacticalRoster({ players, activePlayerId, gamePlayerId }: { players: Player[], activePlayerId: string, gamePlayerId: string | null }) {
  // Sort logic handled by parent, we just render
  return (
    <div className="space-y-1 p-2">
      <h3 className="text-[10px] font-mono text-gray-500 mb-2 uppercase tracking-widest pl-1">
        Field Agents // {players.length} Active
      </h3>
      {players.map(p => {
        const isActive = p.id === activePlayerId;
        const isMe = p.id === gamePlayerId;

        return (
          <div
            key={p.id}
            className={`
                        relative flex items-center p-2 rounded border transition-all duration-300
                        ${isActive ? 'bg-gray-800 border-l-4' : 'bg-transparent border-transparent opacity-60 hover:opacity-100'}
                     `}
            style={{
              borderLeftColor: isActive ? p.color : 'transparent',
              boxShadow: isActive ? `inset 10px 0 20px -10px ${p.color}20` : 'none'
            }}
          >
            <div className="w-2 h-2 rounded-full mr-3 shrink-0" style={{ backgroundColor: p.color, boxShadow: `0 0 5px ${p.color}` }} />

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-bold truncate uppercase ${isActive ? 'text-white' : 'text-gray-400'}`} style={{ fontFamily: isActive ? 'var(--font-header)' : 'inherit' }}>
                  {isMe ? 'YOU' : p.name}
                </span>
                {isActive && <span className="text-[8px] bg-red-500 text-black px-1 rounded font-bold animate-pulse">ACT</span>}
              </div>
              <div className="flex gap-2 mt-0.5">
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                  <span>RES:</span>
                  <span className="text-gray-300 font-mono">{Object.values(p.resources).reduce((a, b) => a + b, 0)}</span>
                </div>
                <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                  <span>TRK:</span>
                  <span className="text-gray-300 font-mono">{Object.values(p.ideologyTracks).reduce((a, b) => a + b, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )
}

// Default export compatibility? Ideally explicit.
// Side-bar detailed dossier card
export function SidebarAgentCard({ player, isActive }: { player: Player; isActive: boolean }) {
  return (
    <div
      className={`
        w-full rounded border transition-all duration-300 relative overflow-hidden font-mono bg-[#0a0a0a]
        ${isActive ? 'opacity-100' : 'border-[#4caf50]/30 opacity-70 hover:opacity-100'}
      `}
      style={{
        borderColor: isActive ? player.color : undefined,
        borderWidth: isActive ? '2px' : '1px',
        boxShadow: isActive ? `0 0 20px ${player.color}50` : 'none',
      }}
    >
      {/* Header: Identity */}
      <div className="flex items-center p-2 border-b border-[#4caf50]/30 bg-black/40">
        <div className="w-8 h-8 rounded shrink-0 mr-2 flex items-center justify-center font-bold text-[#0a0a0a] text-sm" style={{ backgroundColor: player.color, boxShadow: `0 0 10px ${player.color}` }}>
          {player.name.charAt(0)}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold uppercase truncate text-[#e0e0e0] leading-tight tracking-wider">
            {player.name}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${isActive ? 'bg-[#4caf50]/20 text-[#4caf50] border border-[#4caf50]/50' : 'text-[#4caf50]/70'}`}>
              {isActive ? 'ACTIVE' : 'STANDBY'}
            </span>
            {player.battalionReserve > 0 && (
              <span className="text-xs bg-[#4caf50]/20 border border-[#4caf50]/40 px-1.5 py-0.5 rounded">
                <span className="text-[#4caf50]/60 text-[9px]">BNK</span> <span className="text-[#4caf50] font-bold">{player.battalionReserve}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body: Resources with Full indicator */}
      <div className="p-2 bg-black/20">
        {/* Resource Cap Indicator */}
        {(() => {
          const total = player.resources.funds + player.resources.clout + player.resources.media + player.resources.trust;
          const isFull = total >= 12;
          return (
            <div className={`text-center text-[9px] font-bold uppercase tracking-wider mb-1.5 py-0.5 rounded ${isFull ? 'bg-[#f44336]/20 text-[#f44336] border border-[#f44336]/50' : 'text-[#4caf50]/70'}`} style={isFull ? { textShadow: '0 0 8px rgba(244,67,54,0.5)' } : {}}>
              {total}/12 {isFull && '⚠ FULL'}
            </div>
          );
        })()}
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.entries(player.resources) as [ResourceType, number][]).map(([res, amount]) => (
            <div key={res} className="flex justify-between items-center bg-[#0a0a0a] px-2 py-1 rounded border border-[#4caf50]/20">
              <span className="text-[8px] uppercase font-bold tracking-wider flex items-center gap-1" style={{ color: RESOURCE_COLORS[res] }}>
                <span className="text-xs">{resourceIcons[res]}</span>
                {resourceNames[res]}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: RESOURCE_COLORS[res], textShadow: `0 0 5px ${RESOURCE_COLORS[res]}50` }}>
                {amount}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Ideology Tracks */}
      <div className="px-2 pb-2 pt-1.5 flex justify-around border-t border-[#4caf50]/20 bg-black/30">
        {(Object.entries(player.ideologyTracks) as [IdeologyType, number][]).map(([ideology, level]) => (
          <div key={ideology} className="flex flex-col items-center">
            <span className="text-[7px] uppercase tracking-wider mb-1" style={{ color: IDEOLOGY_COLORS[ideology] }}>
              {commanderAbbreviations[ideology]}
            </span>
            <div className="h-10 w-1.5 bg-[#1a1a1a] rounded-full relative overflow-hidden border border-[#4caf50]/20">
              <div
                className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                style={{
                  height: `${(level / 5) * 100}%`,
                  backgroundColor: IDEOLOGY_COLORS[ideology],
                  boxShadow: `0 0 6px ${IDEOLOGY_COLORS[ideology]}`
                }}
              />
            </div>
            <span className="text-[9px] font-mono mt-1 font-bold" style={{ color: IDEOLOGY_COLORS[ideology] }}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SidebarAgentCard;
