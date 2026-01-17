import React from 'react';
import { GameState, Zone, Player } from '@/types/game';
import { getRedeploymentRightsHolder } from '@/lib/gameEngine';
import { hasUnlockedPower } from '@/data/powers';
import { terminology } from '@/data/displayNames';

interface GerrymanderPanelProps {
    state: GameState;
    activePlayer: Player;
    isMyTurn: boolean;
    onEndTurn: () => void;
    redeploySource: { zoneId: string; slotIndex: number } | null;
}

export default function GerrymanderPanel({
    state,
    activePlayer,
    isMyTurn,
    onEndTurn,
    redeploySource,
}: GerrymanderPanelProps) {
    // Calculate rights and moves
    const getRedeployInfo = () => {
        let zonesWithRights = 0;
        const zoneNames: string[] = [];
        for (const zone of Object.values(state.zones)) {
            if (getRedeploymentRightsHolder(zone, state.players) === state.activePlayerId) {
                zonesWithRights++;
                zoneNames.push(zone.name);
            }
        }
        const hasShowstopperL5 = hasUnlockedPower(activePlayer.ideologyTracks, 'showstopper', 5);
        const movesPerZone = hasShowstopperL5 ? 2 : 1;
        const maxMoves = zonesWithRights * movesPerZone;
        const usedMoves = state.powerUsage.redeploymentUsed;
        const remainingMoves = maxMoves - usedMoves;
        return { zonesWithRights, zoneNames, movesPerZone, maxMoves, usedMoves, remainingMoves, hasShowstopperL5 };
    };

    const info = getRedeployInfo();

    return (
        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 animate-fade-in">
            <h3 className="text-lg font-bold text-purple-200 mb-2 flex items-center gap-2">
                <span>🔄</span> Redeployment
            </h3>

            <div className="space-y-4">
                {/* Status Box */}
                <div className="bg-gray-900/50 p-3 rounded border border-purple-500/20">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-400">Moves Remaining:</span>
                        <span className="text-xl font-bold text-white">{info.remainingMoves} <span className="text-gray-500 text-sm">/ {info.maxMoves}</span></span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${(info.remainingMoves / (info.maxMoves || 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Instructions */}
                <div className="text-sm text-gray-300 space-y-2">
                    {info.remainingMoves > 0 ? (
                        <>
                            <p>Select a {terminology.voter} to move, then click an empty slot in an adjacent {terminology.zone}.</p>
                            {info.zonesWithRights > 0 ? (
                                <div className="p-2 bg-purple-500/10 rounded text-xs">
                                    <span className="font-bold text-purple-300">Active Rights in:</span>
                                    <ul className="list-disc list-inside mt-1 text-gray-400">
                                        {info.zoneNames.map(name => (
                                            <li key={name}>{name}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-yellow-400 text-xs mt-2">
                                    No redeployment rights available! (You need majority in a {terminology.zone} to move {terminology.voters} out/in/through it).
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500 italic">No moves remaining.</p>
                    )}
                </div>

                {/* Selected Source Indicator */}
                {redeploySource && (
                    <div className="p-2 bg-blue-900/30 border border-blue-500/30 rounded flex items-center gap-2">
                        <span className="text-blue-400 text-xs font-bold uppercase">Source Selected:</span>
                        <span className="text-white text-sm">
                            {state.zones[redeploySource.zoneId]?.name} (Slot {redeploySource.slotIndex + 1})
                        </span>
                    </div>
                )}

                {/* Actions */}
                {isMyTurn && (
                    <button
                        onClick={onEndTurn}
                        className={`
              w-full py-3 rounded-lg font-bold shadow-lg transition-all
              ${info.remainingMoves > 0
                                ? 'bg-purple-700 hover:bg-purple-600 text-white'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                            }
            `}
                    >
                        {info.remainingMoves > 0 ? 'Skip & End Turn' : 'End Turn'}
                    </button>
                )}
            </div>
        </div>
    );
}
