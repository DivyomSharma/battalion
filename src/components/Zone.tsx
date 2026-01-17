'use client';

import React from 'react';
import { Zone, Player } from '@/types/game';

interface ZoneProps {
  zone: Zone;
  players: Record<string, Player>;
  majorityPlayer: Player | null;
  isTied: boolean;
  onSlotClick: (slotIndex: number) => void;
  selectedSlot: number | null;
  isHighlighted: boolean;
  isProtected?: boolean;
  hideSlots?: boolean;
}

const FALLBACK_COLORS = ['#f44336', '#03a9f4', '#4caf50', '#ff9800', '#9c27b0'];

function getPlayerColor(playerId: string, players: Record<string, Player>): string {
  const player = players[playerId];
  if (player?.color && typeof player.color === 'string' && player.color.length > 0) {
    return player.color;
  }
  const match = playerId.match(/player_(\d+)/);
  if (match) {
    const playerIndex = parseInt(match[1], 10) - 1;
    return FALLBACK_COLORS[playerIndex % FALLBACK_COLORS.length];
  }
  let hash = 0;
  for (let i = 0; i < playerId.length; i++) {
    hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[index];
}

export default function ZoneComponent({
  zone,
  players,
  majorityPlayer,
  isTied,
  onSlotClick,
  selectedSlot,
  isHighlighted,
  isProtected = false,
  hideSlots = false,
}: ZoneProps) {
  const cols = zone.capacity <= 9 ? 3 : zone.capacity <= 12 ? 4 : zone.capacity <= 17 ? 4 : 5;
  const isVolatileSlot = (index: number) => zone.volatileSlots.includes(index);

  const getCellSizeClass = () => {
    if (zone.capacity <= 9) return 'w-[clamp(22px,3.2vw,40px)] h-[clamp(22px,3.2vw,40px)]';
    if (zone.capacity <= 11) return 'w-[clamp(20px,2.8vw,36px)] h-[clamp(20px,2.8vw,36px)]';
    if (zone.capacity <= 17) return 'w-[clamp(18px,2.4vw,32px)] h-[clamp(18px,2.4vw,32px)]';
    return 'w-[clamp(16px,2.2vw,28px)] h-[clamp(16px,2.2vw,28px)]';
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      {!hideSlots && (
        <div
          className="grid gap-1 pointer-events-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {zone.slots.map((slotPlayerId, index) => {
            const isOccupied = !!slotPlayerId;
            const isEmpty = !isOccupied;
            const isVolatile = isVolatileSlot(index);
            const isLocked = zone.lockedSlots[index];
            const playerColor = isOccupied ? getPlayerColor(slotPlayerId!, players) : 'transparent';
            const isSelected = selectedSlot === index;

            return (
              <button
                key={index}
                onClick={() => onSlotClick(index)}
                className={`
                  ${getCellSizeClass()}
                  relative flex items-center justify-center transition-all duration-150 rounded font-mono
                  ${isEmpty ? 'hover:scale-110 hover:brightness-125 cursor-pointer' : ''}
                  ${isSelected ? 'ring-2 ring-white shadow-[0_0_12px_white] scale-110 z-10' : ''}
                `}
                style={{
                  backgroundColor: isOccupied
                    ? playerColor
                    : 'rgba(20, 20, 20, 0.9)',
                  border: isOccupied
                    ? `2px solid ${playerColor}`
                    : isVolatile
                      ? '2px solid #f44336'
                      : '2px solid rgba(76, 175, 80, 0.5)',
                  boxShadow: isOccupied
                    ? `0 0 10px ${playerColor}, inset 0 0 5px rgba(255,255,255,0.2)`
                    : isVolatile
                      ? '0 0 8px rgba(244, 67, 54, 0.4)'
                      : '0 0 4px rgba(76, 175, 80, 0.2)',
                }}
                title={isOccupied ? `${players[slotPlayerId]?.name || slotPlayerId}` : 'Empty Slot'}
              >
                {isOccupied && (
                  <div
                    className="w-3/4 h-3/4 rounded"
                    style={{
                      backgroundColor: playerColor,
                      boxShadow: `0 0 8px ${playerColor}`
                    }}
                  />
                )}

                {isEmpty && !isVolatile && (
                  <div className="text-[#4caf50] text-xs font-bold" style={{ textShadow: '0 0 4px rgba(76,175,80,0.8)' }}>+</div>
                )}

                {isVolatile && isEmpty && (
                  <span className="text-xs text-[#f44336] font-bold" style={{ textShadow: '0 0 4px rgba(244,67,54,0.8)' }}>!</span>
                )}

                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded">
                    <span className="text-xs text-[#4caf50]">■</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
