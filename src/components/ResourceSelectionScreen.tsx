'use client';

import React, { useState } from 'react';
import { GameState, Player, Resources, ResourceType, RESOURCE_COLORS } from '@/types/game';
import { resourceNames } from '@/data/displayNames';

interface ResourceSelectionScreenProps {
  state: GameState;
  currentPlayerId?: string;
  onSelectResources: (playerId: string, resources: Partial<Resources>) => void;
}

const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

export default function ResourceSelectionScreen({
  state,
  currentPlayerId,
  onSelectResources,
}: ResourceSelectionScreenProps) {
  const players = Object.values(state.players);

  const selectedPlayerIds = state.resourceSelection?.selections
    ? Object.keys(state.resourceSelection.selections)
    : [];

  const getCurrentPlayer = (): Player | null => {
    if (currentPlayerId && state.players[currentPlayerId]) {
      if (!selectedPlayerIds.includes(currentPlayerId)) {
        return state.players[currentPlayerId];
      }
      return null;
    }
    return players.find(p => !selectedPlayerIds.includes(p.id)) || null;
  };

  const currentPlayer = getCurrentPlayer();
  const allowedAmount = currentPlayer && state.resourceSelection
    ? state.resourceSelection.allowedAmounts[currentPlayer.id]
    : 0;

  const [selected, setSelected] = useState<Partial<Resources>>({
    funds: 0,
    clout: 0,
    media: 0,
    trust: 0,
  });

  const totalSelected = (selected.funds || 0) + (selected.clout || 0) +
    (selected.media || 0) + (selected.trust || 0);

  const handleSubmit = () => {
    if (!currentPlayer) return;
    if (totalSelected !== allowedAmount) return;
    onSelectResources(currentPlayer.id, selected);
    setSelected({ funds: 0, clout: 0, media: 0, trust: 0 });
  };

  if (!currentPlayer || !state.resourceSelection) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono war-bg relative overflow-hidden">
        {/* War Theme Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 tactical-grid-bg opacity-20" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to top, rgba(30,25,20,0.5) 0%, transparent 60%)'
          }} />
        </div>
        <div className="war-vignette" />

        <div className="text-center p-8 rounded-lg war-panel relative z-10">
          <div className="military-spinner mx-auto mb-4" />
          <h2 className="military-header text-xl mb-4">
            AWAITING SATELLITE UPLINK...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 war-bg relative overflow-hidden">
      {/* War Theme Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Tactical Grid */}
        <div className="absolute inset-0 tactical-grid-bg opacity-30" />

        {/* Smoke Overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, rgba(30,25,20,0.6) 0%, rgba(20,18,15,0.3) 40%, transparent 70%)'
        }} />

        {/* Fire Glow Effects */}
        <div className="fire-glow" style={{ bottom: '5%', left: '20%', width: '90px', height: '60px', background: 'radial-gradient(ellipse, rgba(255,100,30,0.3) 0%, transparent 70%)' }} />
        <div className="fire-glow" style={{ bottom: '8%', right: '12%', width: '70px', height: '50px', background: 'radial-gradient(ellipse, rgba(255,80,20,0.25) 0%, transparent 70%)', animationDelay: '2s' }} />
      </div>

      {/* Vignette */}
      <div className="war-vignette" />

      {/* Radar Display - Top Right */}
      <div className="fixed top-4 right-4 z-20 pointer-events-none opacity-40">
        <div className="radar-sweep w-16 h-16">
          <div className="absolute inset-2 rounded-full border border-[#4caf50]/20" />
          <div className="absolute inset-4 rounded-full border border-[#4caf50]/10" />
        </div>
      </div>

      {/* Status Panel - Top Left */}
      <div className="fixed top-4 left-4 z-20 pointer-events-none opacity-60">
        <div className="tactical-status-bar rounded px-3 py-2">
          <div className="flex items-center gap-2 text-[#4caf50] text-xs">
            <div className="status-dot status-dot-warning" />
            <span className="uppercase tracking-wider">LOADOUT</span>
          </div>
        </div>
      </div>

      <div className="relative max-w-lg w-full rounded-lg p-6 war-panel z-10">
        {/* Corner brackets */}
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#4caf50]" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#4caf50]" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#4caf50]" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#4caf50]" />

        <h1 className="military-header text-2xl text-center mb-2">
          MISSION LOADOUT
        </h1>
        <p className="text-center mb-6 font-mono uppercase tracking-widest text-xs text-white/60">
          ALLOCATE STARTING RESOURCES
        </p>

        {/* Current Commander */}
        <div className="mb-6 p-4 rounded-lg text-center border-2 border-[#4caf50] bg-[#4caf50]/10">
          <p className="text-xs font-mono tracking-widest text-white/50 uppercase">COMMANDER</p>
          <h2 className="text-xl font-bold uppercase text-white" style={{ fontFamily: 'var(--font-header)' }}>
            {currentPlayer.name}
          </h2>
          <div className="mt-2 inline-block px-3 py-1 border border-[#4caf50] rounded bg-black">
            <p className="text-xs font-mono text-[#4caf50]">
              ALLOCATE: {allowedAmount} UNIT{allowedAmount > 1 ? 'S' : ''}
            </p>
          </div>
        </div>

        {/* Resource Selection */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="text-xs text-white/50 font-mono uppercase">ALLOCATION</span>
            <span className={`text-sm font-bold font-mono ${totalSelected === allowedAmount ? 'text-[#4caf50]' : 'text-white'}`}>
              {totalSelected} / {allowedAmount}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {resourceTypes.map(res => {
              const current = selected[res] || 0;
              const canAdd = totalSelected < allowedAmount;

              return (
                <div key={res} className="flex flex-col items-center bg-black p-3 rounded border border-[#4caf50]/50">
                  <span className="text-[10px] font-bold mb-2 tracking-wider uppercase" style={{ color: RESOURCE_COLORS[res] }}>
                    {resourceNames[res]}
                  </span>

                  <div className="w-12 h-12 flex items-center justify-center text-xl font-bold mb-2 font-mono bg-black rounded border border-[#4caf50] text-white">
                    {current}
                  </div>

                  <div className="flex gap-1 w-full justify-center">
                    <button
                      onClick={() => setSelected({ ...selected, [res]: Math.max(0, current - 1) })}
                      disabled={current === 0}
                      className="w-full h-8 flex items-center justify-center text-sm rounded border border-[#4caf50] bg-black hover:bg-[#4caf50] hover:text-black text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setSelected({ ...selected, [res]: current + 1 })}
                      disabled={!canAdd}
                      className="w-full h-8 flex items-center justify-center text-sm rounded border border-[#4caf50] bg-black hover:bg-[#4caf50] hover:text-black text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={totalSelected !== allowedAmount}
          className={`
            w-full py-4 font-bold text-lg uppercase tracking-widest transition-all duration-300 rounded
            ${totalSelected === allowedAmount
              ? 'bg-[#4caf50] text-black border-2 border-[#4caf50] hover:bg-[#66bb6a] shadow-[0_0_20px_rgba(76,175,80,0.4)]'
              : 'bg-black text-white/30 border border-white/20 cursor-not-allowed'}
          `}
          style={{ fontFamily: 'var(--font-header)' }}
        >
          {totalSelected === allowedAmount ? 'CONFIRM LOADOUT' : 'ALLOCATION INCOMPLETE'}
        </button>

        {/* Show who has selected */}
        {selectedPlayerIds.length > 0 && (
          <div className="mt-6 border-t border-[#4caf50]/30 pt-4">
            <p className="text-[10px] text-white/40 mb-2 font-mono uppercase tracking-wider">
              READY: {selectedPlayerIds.length}/{players.length} COMMANDERS
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedPlayerIds.map(id => {
                const player = state.players[id];
                return (
                  <span
                    key={id}
                    className="px-2 py-0.5 rounded text-[10px] border border-[#4caf50] font-mono uppercase bg-[#4caf50]/20 text-[#4caf50]"
                  >
                    {player.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
