'use client';

import React, { useState } from 'react';
import {
  Player,
  Resources,
  ResourceType,
  IdeologyType,
  PowerUsage,
  IDEOLOGY_COLORS,
  RESOURCE_COLORS,
  Zone,
} from '@/types/game';
import { hasUnlockedPower, canUsePower } from '@/data/powers';
import { resourceNames } from '@/data/displayNames';

interface PowersPanelProps {
  player: Player;
  powerUsage: PowerUsage;
  players: Record<string, Player>;
  zones: Record<string, Zone>;
  onUseProspecting: (giveResource: ResourceType, getResources: ResourceType[]) => void;
  onUseLandGrab: (zoneId: string, slotIndex: number) => void;
  onUseDonations: (targetPlayerId: string, resource: ResourceType) => void;
  onUsePayback: (zoneId: string, slotIndex: number, payResource: ResourceType) => void;
  onUseToughLove: (zoneId: string, slotIndices: [number, number], targetPlayerId: string, payResources: ResourceType[]) => void;
  disabled?: boolean;
}

type PowerKey = 'capitalist3' | 'capitalist5' | 'supremo3' | 'supremo5' | 'showstopper3' | 'showstopper5' | 'idealist3' | 'idealist5';

interface PowerInfo {
  ideology: IdeologyType;
  level: 3 | 5;
  name: string;
  description: string;
  usageKey: keyof PowerUsage;
  maxUses: number;
}

const POWERS: Record<PowerKey, PowerInfo> = {
  capitalist3: {
    ideology: 'capitalist',
    level: 3,
    name: 'No-Bid Contract',
    description: 'Trade 1 Supply to Bank for 2 Random Resources',
    usageKey: 'capitalistL3',
    maxUses: 1,
  },
  capitalist5: {
    ideology: 'capitalist',
    level: 5,
    name: 'Supply Blockade',
    description: 'Evict any Battalion (they return next turn)',
    usageKey: 'capitalistL5',
    maxUses: 3,
  },
  supremo3: {
    ideology: 'supremo',
    level: 3,
    name: 'Commandeer',
    description: 'Steal 1 resource from any Commander',
    usageKey: 'supremoL3',
    maxUses: 2,
  },
  supremo5: {
    ideology: 'supremo',
    level: 5,
    name: 'Kinetic Strike',
    description: 'Spend 1 resource to permanently destroy enemy Battalion',
    usageKey: 'supremoL5',
    maxUses: 2,
  },
  showstopper3: {
    ideology: 'showstopper',
    level: 3,
    name: 'Phantom Unit',
    description: '+1 bonus Battalion on any deployment (auto-applied)',
    usageKey: 'showstopperL3',
    maxUses: 2,
  },
  showstopper5: {
    ideology: 'showstopper',
    level: 5,
    name: 'Rapid Redeploy',
    description: 'Redeploy 2 Battalions per Sector instead of 1 (passive)',
    usageKey: 'redeploymentUsed',
    maxUses: 999,
  },
  idealist3: {
    ideology: 'idealist',
    level: 3,
    name: 'Local Coalition',
    description: '1 resource discount on Battalion deployment (auto-applied)',
    usageKey: 'idealistL3',
    maxUses: 2,
  },
  idealist5: {
    ideology: 'idealist',
    level: 5,
    name: 'Defection',
    description: 'Spend 2 Morale + 2 any to Convert 2 enemy Battalions',
    usageKey: 'idealistL5',
    maxUses: 1,
  },
};

export default function PowersPanel({
  player,
  powerUsage,
  players,
  zones,
  onUseProspecting,
  onUseLandGrab,
  onUseDonations,
  onUsePayback,
  onUseToughLove,
  disabled = false,
}: PowersPanelProps) {
  const [expandedPower, setExpandedPower] = useState<PowerKey | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);

  const otherPlayers = Object.values(players).filter(p => p.id !== player.id);
  const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

  const unlockedPowers = (Object.keys(POWERS) as PowerKey[]).filter(key => {
    const power = POWERS[key];
    return hasUnlockedPower(player.ideologyTracks, power.ideology, power.level);
  });

  if (unlockedPowers.length === 0) {
    return null;
  }

  const resetSelection = () => {
    setExpandedPower(null);
    setSelectedResource(null);
    setSelectedResources([]);
    setSelectedTarget(null);
    setSelectedZone(null);
    setSelectedSlots([]);
  };

  const handleUseProspecting = () => {
    if (!selectedResource || selectedResources.length === 0 || selectedResources.length > 2) return;
    onUseProspecting(selectedResource, selectedResources);
    resetSelection();
  };

  const handleUseDonations = () => {
    if (!selectedTarget || !selectedResource) return;
    onUseDonations(selectedTarget, selectedResource);
    resetSelection();
  };

  const handleUseLandGrab = () => {
    if (!selectedZone || selectedSlots.length !== 1) return;
    onUseLandGrab(selectedZone, selectedSlots[0]);
    resetSelection();
  };

  const handleUsePayback = () => {
    if (!selectedZone || selectedSlots.length !== 1 || !selectedResource) return;
    onUsePayback(selectedZone, selectedSlots[0], selectedResource);
    resetSelection();
  };

  const handleUseToughLove = () => {
    if (!selectedZone || selectedSlots.length !== 2 || !selectedTarget || selectedResources.length !== 2) return;
    onUseToughLove(selectedZone, selectedSlots as [number, number], selectedTarget, selectedResources);
    resetSelection();
  };

  const renderZoneSlotSelector = (forPower: 'landGrab' | 'payback' | 'toughLove') => {
    const slotsNeeded = forPower === 'toughLove' ? 2 : 1;

    return (
      <div className="mt-2 space-y-2">
        <p className="text-xs text-gray-400">Select zone:</p>
        <div className="flex flex-wrap gap-1">
          {Object.values(zones).map(zone => {
            const hasValidSlots = zone.slots.some((slot, idx) => {
              if (slot === null) return false;
              if (zone.volatileSlots.includes(idx)) return false;
              if (forPower === 'landGrab') return true;
              if (forPower === 'payback' || forPower === 'toughLove') {
                return slot !== player.id;
              }
              return false;
            });

            if (!hasValidSlots) return null;

            return (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone.id);
                  setSelectedSlots([]);
                }}
                className={`
                  px-2 py-1 rounded text-xs
                  ${selectedZone === zone.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }
                `}
              >
                {zone.name}
              </button>
            );
          })}
        </div>

        {selectedZone && (
          <div>
            <p className="text-xs text-gray-400 mt-2">Select voter slot{slotsNeeded > 1 ? 's' : ''}:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {zones[selectedZone].slots.map((slot, idx) => {
                if (slot === null) return null;
                if (zones[selectedZone].volatileSlots.includes(idx)) return null;
                if ((forPower === 'payback' || forPower === 'toughLove') && slot === player.id) return null;

                const ownerName = players[slot]?.name || 'Unknown';
                const isSelected = selectedSlots.includes(idx);

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSlots(selectedSlots.filter(s => s !== idx));
                      } else if (selectedSlots.length < slotsNeeded) {
                        setSelectedSlots([...selectedSlots, idx]);
                      }
                    }}
                    className={`
                      px-2 py-1 rounded text-xs
                      ${isSelected
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }
                    `}
                  >
                    Slot {idx + 1} ({ownerName})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResourceSelector = (label: string, multi: boolean = false, maxCount: number = 2) => (
    <div className="mt-2">
      <p className="text-[10px] text-[#4caf50]/60 uppercase tracking-wider">{label}</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {resourceTypes.map(res => {
          const isSelected = multi
            ? selectedResources.includes(res)
            : selectedResource === res;
          const hasResource = player.resources[res] > 0;
          const shortNames: Record<ResourceType, string> = { funds: 'SUP', clout: 'FIR', media: 'INT', trust: 'MOR' };

          return (
            <button
              key={res}
              onClick={() => {
                if (multi) {
                  if (isSelected) {
                    setSelectedResources(selectedResources.filter(r => r !== res));
                  } else if (selectedResources.length < maxCount) {
                    setSelectedResources([...selectedResources, res]);
                  }
                } else {
                  setSelectedResource(isSelected ? null : res);
                }
              }}
              disabled={!hasResource && !multi}
              className={`
                px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                ${isSelected ? 'ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}
                ${!hasResource && !multi ? 'opacity-40 cursor-not-allowed' : ''}
              `}
              style={{
                backgroundColor: isSelected ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}30`,
                color: isSelected ? '#0a0a0a' : RESOURCE_COLORS[res],
                border: `1px solid ${RESOURCE_COLORS[res]}60`,
              }}
            >
              {shortNames[res]}
              {!multi && <span className="ml-1">({player.resources[res]})</span>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPlayerSelector = () => (
    <div className="mt-2">
      <p className="text-[10px] text-[#4caf50]/60 uppercase tracking-wider">Select target:</p>
      <div className="flex flex-wrap gap-1 mt-1">
        {otherPlayers.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedTarget(p.id === selectedTarget ? null : p.id)}
            className={`
              px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
              ${selectedTarget === p.id
                ? 'bg-[#f44336] text-[#0a0a0a]'
                : 'bg-[#f44336]/20 text-[#f44336] border border-[#f44336]/40 hover:bg-[#f44336]/30'
              }
            `}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="tactical-panel rounded p-3 font-mono">
      <h3 className="text-sm font-bold text-[#4caf50] mb-3 uppercase tracking-widest" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>COMMANDER POWERS</h3>

      <div className="space-y-2">
        {unlockedPowers.map(key => {
          const power = POWERS[key];
          const used = powerUsage[power.usageKey];
          const available = used < power.maxUses;
          const isExpanded = expandedPower === key;
          const isPassive = key === 'showstopper5' || key === 'showstopper3' || key === 'idealist3';

          return (
            <div
              key={key}
              className={`
                p-2 rounded border transition-all
                ${isExpanded ? 'border-[#4caf50] bg-[#0a0a0a]' : 'border-[#4caf50]/30 bg-[#0a0a0a]/50'}
                ${!available && !isPassive ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: IDEOLOGY_COLORS[power.ideology], boxShadow: `0 0 6px ${IDEOLOGY_COLORS[power.ideology]}` }}
                    />
                    <span className="font-bold text-[#e0e0e0] text-xs uppercase tracking-wider truncate">{power.name}</span>
                    <span className="text-[9px] text-[#4caf50]/60">L{power.level}</span>
                  </div>
                  <p className="text-[10px] text-[#4caf50]/60 mt-1 leading-tight">{power.description}</p>
                  {!isPassive && (
                    <p className="text-[9px] text-[#4caf50]/70 mt-1">
                      {used}/{power.maxUses} USED
                    </p>
                  )}
                </div>

                {!isPassive && available && (
                  <button
                    onClick={() => setExpandedPower(isExpanded ? null : key)}
                    disabled={disabled && !isExpanded}
                    className="px-2 py-1 bg-[#4caf50] hover:bg-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] text-[10px] rounded font-bold uppercase shrink-0 ml-2"
                  >
                    {isExpanded ? 'X' : 'USE'}
                  </button>
                )}

                {isPassive && (
                  <span className="text-[9px] text-[#4caf50] bg-[#4caf50]/20 px-2 py-0.5 rounded border border-[#4caf50]/30 uppercase shrink-0 ml-2">
                    AUTO
                  </span>
                )}
              </div>

              {/* Expanded power usage UI */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  {key === 'capitalist3' && (
                    <>
                      {renderResourceSelector('Give 1 resource:', false)}
                      <div className="mt-2">
                        <p className="text-[10px] text-[#4caf50]/60 uppercase tracking-wider">Get up to 2 resources:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resourceTypes.map(res => {
                            const count = selectedResources.filter(r => r === res).length;
                            const isSelected = count > 0;
                            const shortNames: Record<ResourceType, string> = { funds: 'SUP', clout: 'FIR', media: 'INT', trust: 'MOR' };

                            return (
                              <button
                                key={res}
                                onClick={() => {
                                  if (selectedResources.length < 2) {
                                    setSelectedResources([...selectedResources, res]);
                                  }
                                }}
                                className={`
                                  px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${isSelected ? 'ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}
                                `}
                                style={{
                                  backgroundColor: isSelected ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}30`,
                                  color: isSelected ? '#0a0a0a' : RESOURCE_COLORS[res],
                                  border: `1px solid ${RESOURCE_COLORS[res]}60`,
                                }}
                              >
                                {shortNames[res]}
                                {count > 0 && <span className="ml-1">(x{count})</span>}
                              </button>
                            );
                          })}
                        </div>
                        {selectedResources.length > 0 && (
                          <button
                            onClick={() => setSelectedResources([])}
                            className="text-[10px] text-[#4caf50]/70 mt-1 uppercase tracking-wider hover:text-[#4caf50]"
                          >
                            [CLEAR]
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleUseProspecting}
                        disabled={disabled || !selectedResource || selectedResources.length === 0}
                        className="mt-3 px-3 py-1 bg-[#4caf50] hover:bg-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] text-xs rounded font-bold uppercase tracking-wider w-full"
                      >
                        CONFIRM TRADE
                      </button>
                    </>
                  )}

                  {key === 'capitalist5' && (
                    <>
                      {renderZoneSlotSelector('landGrab')}
                      <button
                        onClick={handleUseLandGrab}
                        disabled={disabled || !selectedZone || selectedSlots.length !== 1}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded w-full"
                      >
                        Evict Voter
                      </button>
                    </>
                  )}

                  {key === 'supremo3' && (
                    <>
                      {renderPlayerSelector()}
                      {selectedTarget && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400">Target's resources (steal one):</p>
                          <div className="flex gap-1 mt-1">
                            {resourceTypes.map(res => {
                              const targetPlayer = players[selectedTarget];
                              const targetHas = targetPlayer?.resources[res] || 0;
                              const isSelected = selectedResource === res;

                              return (
                                <button
                                  key={res}
                                  onClick={() => setSelectedResource(isSelected ? null : res)}
                                  disabled={targetHas === 0}
                                  className={`
                                    px-2 py-1 rounded text-xs flex items-center gap-1
                                    ${isSelected ? 'ring-2 ring-white' : ''}
                                    ${targetHas === 0 ? 'opacity-40 cursor-not-allowed' : ''}
                                  `}
                                  style={{
                                    backgroundColor: isSelected ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}40`,
                                    color: 'white',
                                  }}
                                >
                                  {{ funds: 'Supply', clout: 'Firepower', media: 'Intel', trust: 'Morale' }[res]} ({targetHas})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleUseDonations}
                        disabled={disabled || !selectedTarget || !selectedResource}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded w-full"
                      >
                        Steal Resource
                      </button>
                    </>
                  )}

                  {key === 'supremo5' && (
                    <>
                      {renderResourceSelector('Pay 1 resource:', false)}
                      {renderZoneSlotSelector('payback')}
                      <button
                        onClick={handleUsePayback}
                        disabled={disabled || !selectedResource || !selectedZone || selectedSlots.length !== 1}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded w-full"
                      >
                        Discard Voter
                      </button>
                    </>
                  )}

                  {key === 'idealist5' && (
                    <>
                      <p className="text-[10px] text-[#f44336] mb-2 uppercase tracking-wider">
                        COST: 2 MOR + 2 ANY
                      </p>
                      {renderPlayerSelector()}
                      {renderZoneSlotSelector('toughLove')}
                      <div className="mt-2">
                        <p className="text-[10px] text-[#4caf50]/60 uppercase tracking-wider">Pay 2 additional:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {resourceTypes.filter(r => r !== 'trust').map(res => {
                            const count = selectedResources.filter(r => r === res).length;
                            const hasEnough = player.resources[res] >= count + 1;
                            const shortNames: Record<ResourceType, string> = { funds: 'SUP', clout: 'FIR', media: 'INT', trust: 'MOR' };

                            return (
                              <button
                                key={res}
                                onClick={() => {
                                  if (hasEnough && selectedResources.length < 2) {
                                    setSelectedResources([...selectedResources, res]);
                                  }
                                }}
                                disabled={!hasEnough}
                                className={`
                                  px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider
                                  ${count > 0 ? 'ring-2 ring-white shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''}
                                  ${!hasEnough ? 'opacity-40' : ''}
                                `}
                                style={{
                                  backgroundColor: count > 0 ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}30`,
                                  color: count > 0 ? '#0a0a0a' : RESOURCE_COLORS[res],
                                  border: `1px solid ${RESOURCE_COLORS[res]}60`,
                                }}
                              >
                                {shortNames[res]} {count > 0 && `(x${count})`}
                              </button>
                            );
                          })}
                        </div>
                        {selectedResources.length > 0 && (
                          <button
                            onClick={() => setSelectedResources([])}
                            className="text-[10px] text-[#4caf50]/70 mt-1 uppercase tracking-wider hover:text-[#4caf50]"
                          >
                            [CLEAR]
                          </button>
                        )}
                      </div>
                      <button
                        onClick={handleUseToughLove}
                        disabled={
                          disabled ||
                          !selectedTarget ||
                          !selectedZone ||
                          selectedSlots.length !== 2 ||
                          selectedResources.length !== 2 ||
                          player.resources.trust < 2
                        }
                        className="mt-3 px-3 py-1 bg-[#4caf50] hover:bg-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] text-xs rounded font-bold uppercase tracking-wider w-full"
                      >
                        CONVERT BATTALIONS
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
