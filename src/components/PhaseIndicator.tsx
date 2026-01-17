'use client';

import React from 'react';
import { GamePhase } from '@/types/game';
import { terminology } from '@/data/displayNames';

interface PhaseIndicatorProps {
  phase: GamePhase;
  turnNumber: number;
  activePlayerName: string;
  battalionCount?: number; // For deployment phase
  evictedCount?: number; // For place evicted phase
}

const phaseInfo: Record<GamePhase, { label: string; icon: string; description: string }> = {
  SETUP: { label: 'INIT', icon: '▶', description: 'SYSTEM BOOT' },
  RESOURCE_SELECTION: { label: 'ALLOCATE', icon: '◆', description: 'SELECT RESOURCES' },
  FIRST_PLAYER_SELECTION: { label: 'PRIORITY', icon: '★', description: 'INITIATIVE BID' },
  PLACE_EVICTED: { label: 'REDEPLOY', icon: '◀', description: `REPOSITION ${terminology.voters.toUpperCase()}` },
  ANSWERING: { label: terminology.ideologyCard.toUpperCase(), icon: '■', description: 'SITUATION REPORT RESPONSE' },
  ACTION: { label: 'ACTION', icon: '●', description: 'TACTICAL OPTIONS' },
  DEPLOYMENT: { label: 'DEPLOY', icon: '▼', description: `POSITION ${terminology.voters.toUpperCase()}` },
  REDEPLOYMENT: { label: 'MANEUVER', icon: '↔', description: 'ADJUST POSITIONS' },
  LAST_TURN: { label: 'FINAL', icon: '!', description: 'LAST CHANCE' },
  END_TURN: { label: 'STANDBY', icon: '→', description: 'NEXT TURN' },
  GAME_OVER: { label: 'CEASEFIRE', icon: '✓', description: 'CONFLICT END' },
};

const phaseOrder: GamePhase[] = ['PLACE_EVICTED', 'ANSWERING', 'ACTION', 'DEPLOYMENT', 'REDEPLOYMENT'];

export default function PhaseIndicator({
  phase,
  turnNumber,
  activePlayerName,
  battalionCount,
  evictedCount,
}: PhaseIndicatorProps) {
  const currentPhase = phaseInfo[phase];
  const currentPhaseIndex = phaseOrder.indexOf(phase);

  // Show battalion count during deployment phases
  const showBattalionAlert = (phase === 'DEPLOYMENT' && battalionCount !== undefined && battalionCount > 0) ||
    (phase === 'PLACE_EVICTED' && evictedCount !== undefined && evictedCount > 0);
  const alertCount = phase === 'DEPLOYMENT' ? battalionCount : evictedCount;
  const alertLabel = phase === 'DEPLOYMENT' ? 'DEPLOY' : 'PLACE EVICTED';

  return (
    <div className="flex items-center gap-4 flex-1 font-mono">
      {/* Phase Icon and Label */}
      <div className="flex items-center gap-2">
        <span className="text-lg text-[#4caf50] glow-green">{currentPhase.icon}</span>
        <div>
          <h3 className="text-sm font-bold text-[#4caf50] uppercase tracking-widest glow-green">
            {currentPhase.label}
          </h3>
          <p className="text-[10px] text-[#4caf50]/60 hidden sm:block uppercase tracking-wider">
            {currentPhase.description}
          </p>
        </div>
      </div>

      {/* Phase Progress Bar */}
      {phase !== 'GAME_OVER' && phase !== 'SETUP' && phase !== 'RESOURCE_SELECTION' && phase !== 'FIRST_PLAYER_SELECTION' && (
        <div className="flex gap-0.5 flex-1 max-w-[200px]">
          {phaseOrder.map((p, index) => (
            <div
              key={p}
              className={`
                flex-1 h-1.5 transition-all duration-300
                ${index < currentPhaseIndex
                  ? 'bg-[#4caf50] shadow-[0_0_4px_#4caf50]'
                  : index === currentPhaseIndex
                    ? 'bg-[#03a9f4] shadow-[0_0_6px_#03a9f4] animate-pulse'
                    : 'bg-[#1a1a1a] border border-[#4caf50]/20'
                }
              `}
              title={phaseInfo[p].label}
            />
          ))}
        </div>
      )}

      {/* Battalion Count Alert - Shows during deployment phases */}
      {showBattalionAlert && (
        <div className="ml-auto px-4 py-1.5 bg-[#4caf50]/20 border border-[#4caf50] rounded-lg animate-pulse">
          <span className="text-[#4caf50] font-bold text-sm tracking-wider" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
            {alertLabel}: <span className="text-white text-lg">{alertCount}</span> BATTALION{alertCount !== 1 ? 'S' : ''}
          </span>
        </div>
      )}
    </div>
  );
}
