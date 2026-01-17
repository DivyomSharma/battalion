'use client';

import React, { useState } from 'react';
import { ConspiracyCard, Resources, Player, RESOURCE_COLORS, ResourceType, Zone } from '@/types/game';
import { conspiracyCardTemplates } from '@/data/conspiracyCards';

interface ConspiracyCardShopProps {
  playerResources: Resources;
  playerCards: ConspiracyCard[];
  players: Record<string, Player>;
  zones: Record<string, Zone>;
  activePlayerId: string;
  onBuyCard: (cardId: string) => void;
  onPlayCard: (
    cardId: string,
    targetPlayerId?: string,
    targetResource?: ResourceType,
    targetZoneId?: string,
    targetSlotIndex?: number,
    targetZoneId2?: string,
    targetSlotIndex2?: number
  ) => void;
  disabled?: boolean; // Disables buying cards
  canPlayCards?: boolean; // Can play cards from hand even when buying is disabled
}

function canAfford(playerResources: Resources, cost: Partial<Resources>): boolean {
  return (
    (cost.funds ?? 0) <= playerResources.funds &&
    (cost.clout ?? 0) <= playerResources.clout &&
    (cost.media ?? 0) <= playerResources.media &&
    (cost.trust ?? 0) <= playerResources.trust
  );
}

function renderCost(cost: Partial<Resources>) {
  const parts: React.ReactNode[] = [];
  const resourceOrder: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

  for (const type of resourceOrder) {
    if (cost[type] && cost[type]! > 0) {
      parts.push(
        <span key={type} className="flex items-center gap-1">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: RESOURCE_COLORS[type] }}
          />
          <span>{cost[type]}</span>
        </span>
      );
    }
  }

  return <div className="flex gap-2 text-sm">{parts}</div>;
}

// Helper to check if a slot is volatile
function isVolatileSlot(zone: Zone, slotIndex: number): boolean {
  return zone.volatileSlots.includes(slotIndex);
}

export default function ConspiracyCardShop({
  playerResources,
  playerCards,
  players,
  zones,
  activePlayerId,
  onBuyCard,
  onPlayCard,
  disabled = false,
  canPlayCards = false, // By default, can only play cards when not disabled
}: ConspiracyCardShopProps) {
  // Can play cards if explicitly allowed OR if buying is not disabled
  const canPlayCardsFromHand = canPlayCards || !disabled;
  const [showShop, setShowShop] = useState(false);
  const [selectedPlayCard, setSelectedPlayCard] = useState<ConspiracyCard | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [targetResource, setTargetResource] = useState<ResourceType | null>(null);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  const [targetZoneId2, setTargetZoneId2] = useState<string | null>(null);
  const [targetSlotIndex2, setTargetSlotIndex2] = useState<number | null>(null);
  const [selectionStep, setSelectionStep] = useState<1 | 2>(1); // For multi-step selections like SWAP_BATTALIONS

  const otherPlayers = Object.values(players).filter(p => p.id !== activePlayerId);

  // Get opponent voters that can be targeted (for REMOVE_BATTALION and BATTALION_TRANSFER)
  // Can target any opponent battalion that is not volatile or locked (part of Control)
  const targetableVoters: { zoneId: string; zoneName: string; slotIndex: number; playerId: string; playerName: string; playerColor: string }[] = [];
  for (const [zoneId, zone] of Object.entries(zones)) {
    zone.slots.forEach((voterId, slotIndex) => {
      // Only target opponent voters (not own voters, not empty, not volatile, not locked)
      if (voterId && voterId !== activePlayerId && !isVolatileSlot(zone, slotIndex) && !zone.lockedSlots[slotIndex]) {
        const player = players[voterId];
        if (player) {
          targetableVoters.push({
            zoneId,
            zoneName: zone.name,
            slotIndex,
            playerId: voterId,
            playerName: player.name,
            playerColor: player.color,
          });
        }
      }
    });
  }

  // Get ALL voters for SWAP_BATTALIONS (can swap any two voters, not just opponents)
  // Can select any battalion that is not volatile or locked (part of Control)
  const allVoters: { zoneId: string; zoneName: string; slotIndex: number; playerId: string; playerName: string; playerColor: string }[] = [];
  for (const [zoneId, zone] of Object.entries(zones)) {
    zone.slots.forEach((voterId, slotIndex) => {
      // Skip if volatile, locked (part of Control), or empty
      if (voterId && !isVolatileSlot(zone, slotIndex) && !zone.lockedSlots[slotIndex]) {
        const player = players[voterId];
        if (player) {
          allVoters.push({
            zoneId,
            zoneName: zone.name,
            slotIndex,
            playerId: voterId,
            playerName: player.name,
            playerColor: player.color,
          });
        }
      }
    });
  }

  // Get adjacent zones for BATTALION_TRANSFER destination
  const getAdjacentZones = (sourceZoneId: string) => {
    const sourceZone = zones[sourceZoneId];
    if (!sourceZone) return [];
    return sourceZone.adjacentZones
      .map(zId => ({ id: zId, name: zones[zId]?.name || zId }))
      .filter(z => {
        const zone = zones[z.id];
        // Must have empty non-volatile slot
        return zone && !zone.majorityOwner &&
          zone.slots.some((s, i) => s === null && !isVolatileSlot(zone, i));
      });
  };

  // Display names for resources
  const resourceNames: Record<ResourceType, string> = {
    funds: 'Supply',
    clout: 'Firepower',
    media: 'Intel',
    trust: 'Morale',
  };

  const resetSelection = () => {
    setSelectedPlayCard(null);
    setTargetPlayerId(null);
    setTargetResource(null);
    setTargetZoneId(null);
    setTargetSlotIndex(null);
    setTargetZoneId2(null);
    setTargetSlotIndex2(null);
    setSelectionStep(1);
  };

  const handlePlayCard = () => {
    if (!selectedPlayCard) return;

    const effectType = selectedPlayCard.effect.type;

    // Validation based on card type
    const needsPlayerTarget = effectType === 'STEAL_RESOURCES' && selectedPlayCard.effect.targetCount !== -1;
    const needsResourceTarget = ['STEAL_RESOURCES', 'RESOURCE_DRAIN'].includes(effectType);
    const needsBattalionTarget = effectType === 'REMOVE_BATTALION';
    const needsBattalionAndDestination = effectType === 'BATTALION_TRANSFER';
    const needsZoneTarget = effectType === 'PROTECT_ZONE';
    const needsTwoBattalions = effectType === 'SWAP_BATTALIONS';

    if (needsPlayerTarget && !targetPlayerId) return;
    if (needsResourceTarget && !targetResource) return;
    if (needsBattalionTarget && (!targetZoneId || targetSlotIndex === null)) return;
    if (needsBattalionAndDestination && (!targetZoneId || targetSlotIndex === null || !targetZoneId2)) return;
    if (needsZoneTarget && !targetZoneId) return;
    if (needsTwoBattalions && (!targetZoneId || targetSlotIndex === null || !targetZoneId2 || targetSlotIndex2 === null)) return;

    onPlayCard(
      selectedPlayCard.id,
      targetPlayerId || undefined,
      targetResource || undefined,
      targetZoneId || undefined,
      targetSlotIndex ?? undefined,
      targetZoneId2 || undefined,
      targetSlotIndex2 ?? undefined
    );

    resetSelection();
  };

  // Determine what UI to show for target selection
  const effectType = selectedPlayCard?.effect.type;

  const needsPlayerTarget = !!(selectedPlayCard &&
    effectType === 'STEAL_RESOURCES' &&
    selectedPlayCard.effect.targetCount !== -1);

  const needsResourceTarget = !!(selectedPlayCard &&
    ['STEAL_RESOURCES', 'RESOURCE_DRAIN'].includes(effectType || ''));

  const needsBattalionTarget = !!(selectedPlayCard && effectType === 'REMOVE_BATTALION');

  const needsBattalionAndDestination = !!(selectedPlayCard && effectType === 'BATTALION_TRANSFER');

  const needsZoneTarget = !!(selectedPlayCard && effectType === 'PROTECT_ZONE');

  const needsTwoBattalions = !!(selectedPlayCard && effectType === 'SWAP_BATTALIONS');

  const needsTargetSelection = needsPlayerTarget || needsResourceTarget || needsBattalionTarget ||
    needsBattalionAndDestination || needsZoneTarget || needsTwoBattalions;

  // Get available zones for PROTECT_ZONE
  const availableZones = Object.entries(zones)
    .filter(([zoneId, zone]) => !zone.majorityOwner)
    .map(([zoneId, zone]) => ({ id: zoneId, name: zone.name }));

  // Get adjacent zones for BATTALION_TRANSFER (only if voter selected)
  const adjacentZonesForTransfer = targetZoneId ? getAdjacentZones(targetZoneId) : [];

  // For SWAP_BATTALIONS, filter out already selected voter
  const availableVotersForSwap = allVoters.filter(v =>
    !(v.zoneId === targetZoneId && v.slotIndex === targetSlotIndex)
  );

  return (
    <div className={`tactical-panel rounded p-3 font-mono ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-3 border-b border-[#4caf50]/30 pb-2">
        <h3 className="text-sm font-bold text-[#f44336] uppercase tracking-widest flex items-center gap-2" style={{ textShadow: '0 0 8px rgba(244,67,54,0.5)' }}>
          <span>BLACK OPS</span>
          {playerCards.length > 0 && (
            <span className="bg-[#f44336] text-[#0a0a0a] text-xs px-2 py-0.5 rounded">
              {playerCards.length}
            </span>
          )}
        </h3>
        <button
          onClick={() => !disabled && setShowShop(!showShop)}
          disabled={disabled}
          className={`text-xs uppercase tracking-wider ${disabled ? 'text-[#4caf50]/60 cursor-not-allowed' : 'text-[#4caf50] hover:text-[#66bb6a]'}`}
        >
          {showShop && !disabled ? '[ HIDE ]' : '[ BUY ]'}
        </button>
      </div>

      {/* Show disabled message when not player's turn */}
      {disabled && !canPlayCards && (
        <p className="text-[#4caf50]/70 text-xs uppercase tracking-wider">Awaiting authorization...</p>
      )}

      {/* Player's Black Ops cards - can be played anytime */}
      {playerCards.length > 0 && canPlayCardsFromHand && (
        <div className="mb-3">
          <p className="text-[10px] text-[#4caf50]/60 mb-2 uppercase tracking-wider">YOUR OPS [CLICK TO DEPLOY]</p>
          <div className="flex flex-col gap-2">
            {playerCards.map(card => (
              <button
                key={card.id}
                onClick={() => setSelectedPlayCard(card)}
                className={`
                  p-2 rounded border text-left transition-all
                  ${selectedPlayCard?.id === card.id
                    ? 'bg-[#f44336]/20 border-[#f44336] shadow-[0_0_10px_rgba(244,67,54,0.3)]'
                    : 'bg-[#0a0a0a] border-[#4caf50]/30 hover:border-[#4caf50]/60'
                  }
                `}
              >
                <span className="font-bold text-[#f44336] text-sm uppercase tracking-wider">{card.name}</span>
                <p className="text-[10px] text-[#4caf50]/60 mt-1">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Target selection for playing cards */}
      {needsTargetSelection && (
        <div className="mb-3 p-3 bg-[#0a0a0a] rounded border border-[#f44336]/50">
          <p className="text-xs text-[#f44336] mb-2 uppercase tracking-wider">
            TARGET: {selectedPlayCard.name}
          </p>

          {/* Only show player selection for cards that target a specific player */}
          {needsPlayerTarget && (
            <div className="flex flex-wrap gap-2 mb-2">
              <p className="text-[10px] text-[#4caf50]/60 w-full mb-1 uppercase tracking-wider">Select operative:</p>
              {otherPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setTargetPlayerId(player.id)}
                  className={`
                    px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                    ${targetPlayerId === player.id
                      ? 'bg-[#f44336] text-[#0a0a0a]'
                      : 'bg-[#f44336]/20 text-[#f44336] border border-[#f44336]/40 hover:bg-[#f44336]/30'
                    }
                  `}
                >
                  {player.name}
                </button>
              ))}
            </div>
          )}

          {/* Show resource selection for cards that need it */}
          {needsResourceTarget && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">
                {selectedPlayCard.effect.type === 'RESOURCE_DRAIN'
                  ? 'Resource to drain from all opponents:'
                  : 'Resource to steal:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(['funds', 'clout', 'media', 'trust'] as ResourceType[]).map(res => (
                  <button
                    key={res}
                    onClick={() => setTargetResource(res)}
                    className={`
                      px-3 py-1 rounded text-sm flex items-center gap-1
                      ${targetResource === res
                        ? 'ring-2 ring-white'
                        : ''
                      }
                    `}
                    style={{
                      backgroundColor: targetResource === res ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}50`,
                      color: 'white',
                    }}
                  >
                    {resourceNames[res]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REMOVE_BATTALION: Select opponent Battalion to remove */}
          {needsBattalionTarget && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Select opponent Battalion to remove:</p>
              {targetableVoters.length === 0 ? (
                <p className="text-yellow-400 text-sm">No opponent Battalions can be targeted</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {targetableVoters.map((voter) => {
                    const isSelected = targetZoneId === voter.zoneId && targetSlotIndex === voter.slotIndex;
                    return (
                      <button
                        key={`${voter.zoneId}-${voter.slotIndex}`}
                        onClick={() => {
                          setTargetZoneId(voter.zoneId);
                          setTargetSlotIndex(voter.slotIndex);
                        }}
                        className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${isSelected ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                      >
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: voter.playerColor }} />
                        <span className="text-white">{voter.playerName}</span>
                        <span className="text-gray-400 text-xs">in {voter.zoneName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* BATTALION_TRANSFER: Step 1 - Select voter, Step 2 - Select destination */}
          {needsBattalionAndDestination && (
            <div className="mb-3">
              {!targetZoneId || targetSlotIndex === null ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Step 1: Select opponent Battalion to move:</p>
                  {targetableVoters.length === 0 ? (
                    <p className="text-yellow-400 text-sm">No opponent Battalions can be targeted</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {targetableVoters.map((voter) => (
                        <button
                          key={`${voter.zoneId}-${voter.slotIndex}`}
                          onClick={() => {
                            setTargetZoneId(voter.zoneId);
                            setTargetSlotIndex(voter.slotIndex);
                          }}
                          className="w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 bg-gray-700 hover:bg-gray-600"
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: voter.playerColor }} />
                          <span className="text-white">{voter.playerName}</span>
                          <span className="text-gray-400 text-xs">in {voter.zoneName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-1">
                    Step 2: Select destination zone (adjacent to {zones[targetZoneId]?.name}):
                  </p>
                  <div className="mb-2 p-2 bg-gray-700 rounded text-sm">
                    Moving: <span style={{ color: players[zones[targetZoneId]?.slots[targetSlotIndex] || '']?.color }}>
                      {players[zones[targetZoneId]?.slots[targetSlotIndex] || '']?.name}
                    </span> from {zones[targetZoneId]?.name}
                  </div>
                  {adjacentZonesForTransfer.length === 0 ? (
                    <p className="text-yellow-400 text-sm">No adjacent zones have empty slots</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {adjacentZonesForTransfer.map((zone) => (
                        <button
                          key={zone.id}
                          onClick={() => setTargetZoneId2(zone.id)}
                          className={`w-full px-3 py-2 rounded text-sm text-left ${targetZoneId2 === zone.id ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          <span className="text-white">{zone.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setTargetZoneId(null); setTargetSlotIndex(null); setTargetZoneId2(null); }}
                    className="mt-2 text-xs text-gray-400 hover:text-white"
                  >
                    ← Back to Battalion selection
                  </button>
                </>
              )}
            </div>
          )}

          {/* SWAP_BATTALIONS: Select two voters */}
          {needsTwoBattalions && (
            <div className="mb-3">
              {!targetZoneId || targetSlotIndex === null ? (
                <>
                  <p className="text-xs text-gray-400 mb-1">Step 1: Select first Battalion to swap:</p>
                  {allVoters.length === 0 ? (
                    <p className="text-yellow-400 text-sm">No Battalions can be swapped</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {allVoters.map((voter) => (
                        <button
                          key={`${voter.zoneId}-${voter.slotIndex}`}
                          onClick={() => {
                            setTargetZoneId(voter.zoneId);
                            setTargetSlotIndex(voter.slotIndex);
                          }}
                          className="w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 bg-gray-700 hover:bg-gray-600"
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: voter.playerColor }} />
                          <span className="text-white">{voter.playerName}</span>
                          <span className="text-gray-400 text-xs">in {voter.zoneName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-1">Step 2: Select second Battalion to swap with:</p>
                  <div className="mb-2 p-2 bg-gray-700 rounded text-sm">
                    First voter: <span style={{ color: players[zones[targetZoneId]?.slots[targetSlotIndex] || '']?.color }}>
                      {players[zones[targetZoneId]?.slots[targetSlotIndex] || '']?.name}
                    </span> in {zones[targetZoneId]?.name}
                  </div>
                  {availableVotersForSwap.length === 0 ? (
                    <p className="text-yellow-400 text-sm">No other voters available to swap</p>
                  ) : (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availableVotersForSwap.map((voter) => (
                        <button
                          key={`${voter.zoneId}-${voter.slotIndex}`}
                          onClick={() => {
                            setTargetZoneId2(voter.zoneId);
                            setTargetSlotIndex2(voter.slotIndex);
                          }}
                          className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 ${targetZoneId2 === voter.zoneId && targetSlotIndex2 === voter.slotIndex ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: voter.playerColor }} />
                          <span className="text-white">{voter.playerName}</span>
                          <span className="text-gray-400 text-xs">in {voter.zoneName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setTargetZoneId(null); setTargetSlotIndex(null); setTargetZoneId2(null); setTargetSlotIndex2(null); }}
                    className="mt-2 text-xs text-gray-400 hover:text-white"
                  >
                    ← Back to first Battalion selection
                  </button>
                </>
              )}
            </div>
          )}

          {/* PROTECT_ZONE: Select zone */}
          {needsZoneTarget && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-1">Select zone to protect:</p>
              {availableZones.length === 0 ? (
                <p className="text-yellow-400 text-sm">No zones available to protect</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableZones.map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => { setTargetZoneId(zone.id); setTargetSlotIndex(null); }}
                      className={`w-full px-3 py-2 rounded text-sm text-left ${targetZoneId === zone.id ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      <span className="text-white">{zone.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handlePlayCard}
              disabled={
                (needsPlayerTarget && !targetPlayerId) ||
                (needsResourceTarget && !targetResource) ||
                (needsBattalionTarget && (!targetZoneId || targetSlotIndex === null)) ||
                (needsBattalionAndDestination && (!targetZoneId || targetSlotIndex === null || !targetZoneId2)) ||
                (needsTwoBattalions && (!targetZoneId || targetSlotIndex === null || !targetZoneId2 || targetSlotIndex2 === null)) ||
                (needsZoneTarget && !targetZoneId)
              }
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-medium"
            >
              Play Card
            </button>
            <button
              onClick={resetSelection}
              className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#4caf50] border border-[#4caf50]/30 rounded text-xs uppercase tracking-wider"
            >
              ABORT
            </button>
          </div>
        </div>
      )}

      {/* Play button for cards that don't need targets */}
      {selectedPlayCard && !needsTargetSelection && (
        <div className="mb-3 p-3 bg-[#0a0a0a] rounded border border-[#f44336]/50">
          <p className="text-xs text-[#f44336] mb-2 uppercase tracking-wider">
            DEPLOY {selectedPlayCard.name}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePlayCard}
              className="px-3 py-1 bg-[#4caf50] hover:bg-[#66bb6a] text-[#0a0a0a] rounded font-bold text-xs uppercase tracking-wider"
            >
              CONFIRM
            </button>
            <button
              onClick={() => setSelectedPlayCard(null)}
              className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#4caf50] border border-[#4caf50]/30 rounded text-xs uppercase tracking-wider"
            >
              ABORT
            </button>
          </div>
        </div>
      )}

      {/* Shop - only show when not disabled */}
      {showShop && !disabled && (
        <div className="border-t border-[#4caf50]/30 pt-3 mt-3">
          <p className="text-xs text-[#4caf50]/60 mb-2 uppercase tracking-wider">Available for purchase:</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {conspiracyCardTemplates.map(card => {
              const affordable = canAfford(playerResources, card.cost);
              return (
                <div
                  key={card.id}
                  className={`
                    p-3 rounded border transition-all
                    ${affordable
                      ? 'bg-[#0a0a0a] border-[#4caf50]/50 hover:border-[#4caf50] hover:shadow-[0_0_10px_rgba(76,175,80,0.3)]'
                      : 'bg-[#0a0a0a] border-[#4caf50]/20 opacity-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-[#f44336] text-sm uppercase tracking-wider">{card.name}</h4>
                      <p className="text-xs text-[#4caf50]/70 mt-1">{card.description}</p>
                    </div>
                    <button
                      onClick={() => onBuyCard(card.id)}
                      disabled={disabled || !affordable}
                      className={`
                        px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-all
                        ${affordable
                          ? 'bg-[#4caf50] hover:bg-[#66bb6a] text-[#0a0a0a] shadow-[0_0_10px_rgba(76,175,80,0.4)]'
                          : 'bg-[#1a1a1a] text-[#4caf50]/60 cursor-not-allowed'
                        }
                      `}
                    >
                      BUY
                    </button>
                  </div>
                  <div className="mt-2">{renderCost(card.cost)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {playerCards.length === 0 && !showShop && canPlayCardsFromHand && (
        <p className="text-[#4caf50]/70 text-sm uppercase tracking-wider">No ops cards. {!disabled ? 'Click "Buy Cards" to acquire.' : ''}</p>
      )}
    </div>
  );
}
