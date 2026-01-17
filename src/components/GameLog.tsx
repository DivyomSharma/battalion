'use client';

import React, { useRef, useEffect } from 'react';
import { GameLogEntry, Player } from '@/types/game';

interface GameLogProps {
  entries: GameLogEntry[];
  players: Record<string, Player>;
  maxEntries?: number;
}

export default function GameLog({ entries, players, maxEntries = 50 }: GameLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const displayEntries = entries.slice(-maxEntries);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'DRAW_CARD':
        return '📡';
      case 'ANSWER_CARD':
        return '✓';
      case 'BUY_VOTERS':
        return '⬆';
      case 'PLACE_VOTER':
        return '▶';
      case 'REDEPLOYMENT':
        return '↔';
      case 'FLASHPOINT':
      case 'FLASHPOINT_EFFECT':
      case 'FLASHPOINT_BONUS':
        return '⚡';
      case 'POWER_UNLOCK':
        return '★';
      case 'START_TURN':
        return '►';
      case 'MAJORITY_FORMED':
        return '◉';
      case 'MAJORITY_BROKEN':
        return '◯';
      default:
        return '•';
    }
  };

  return (
    <div className="flex-1 flex flex-col font-mono bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-[#4caf50]/30 bg-black/40 shrink-0">
        <span className="text-xs font-bold text-[#4caf50] uppercase tracking-widest" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
          COMMS LOG
        </span>
      </div>

      {/* Log Entries - Full Height Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {displayEntries.map(entry => {
          const player = players[entry.playerId];
          return (
            <div
              key={entry.id}
              className="text-[10px] flex items-start gap-2 py-1 border-b border-[#4caf50]/10"
            >
              <span className="text-[#4caf50]/60 shrink-0">{getActionIcon(entry.action)}</span>
              <span
                className="font-bold shrink-0 uppercase tracking-wider"
                style={{ color: player?.color || '#4caf50' }}
              >
                {player?.name || 'SYS'}:
              </span>
              <span className="text-[#4caf50]/80 break-words">{entry.details}</span>
            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>

      {entries.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#4caf50]/70 text-xs uppercase tracking-wider">
            NO TRANSMISSIONS
          </p>
        </div>
      )}
    </div>
  );
}
