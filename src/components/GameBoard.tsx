import React, { useMemo } from 'react';
import { GameState } from '@/types/game';
import { calculateZoneMajority } from '@/lib/gameEngine';
import IslandMap from './map/IslandMap';

interface GameBoardProps {
  state: GameState;
  onSlotClick: (zoneId: string, slotIndex: number) => void;
  selectedSlot: { zoneId: string; slotIndex: number } | null;
  highlightedZones?: string[];
}

export default function GameBoard({
  state,
  onSlotClick,
  selectedSlot,
  highlightedZones = [],
}: GameBoardProps) {
  return (
    <div className="w-full h-full">
      <IslandMap
        state={state}
        onSlotClick={onSlotClick}
        selectedSlot={selectedSlot}
        highlightedZones={highlightedZones}
      />
    </div>
  );
}
