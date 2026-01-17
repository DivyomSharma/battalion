'use client';

import React, { useState } from 'react';
import { Resources, ResourceType, Player, TradeOffer, RESOURCE_COLORS } from '@/types/game';

interface PlayerTradingPanelProps {
  currentPlayer: Player;
  players: Record<string, Player>;
  pendingTrade: TradeOffer | null;
  onProposeTrade: (toPlayerId: string, offering: Partial<Resources>, requesting: Partial<Resources>) => void;
  onAcceptTrade: () => void;
  onRejectTrade: () => void;
  onCancelTrade: () => void;
  disabled?: boolean;
}

const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

export default function PlayerTradingPanel({
  currentPlayer,
  players,
  pendingTrade,
  onProposeTrade,
  onAcceptTrade,
  onRejectTrade,
  onCancelTrade,
  disabled = false,
}: PlayerTradingPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [offering, setOffering] = useState<Partial<Resources>>({});
  const [requesting, setRequesting] = useState<Partial<Resources>>({});

  const otherPlayers = Object.values(players).filter(p => p.id !== currentPlayer.id);

  const handlePropose = () => {
    if (!selectedPlayer) return;

    // Validate at least something is being offered or requested
    const offeringTotal = Object.values(offering).reduce((sum, v) => sum + (v || 0), 0);
    const requestingTotal = Object.values(requesting).reduce((sum, v) => sum + (v || 0), 0);

    if (offeringTotal === 0 && requestingTotal === 0) return;

    onProposeTrade(selectedPlayer, offering, requesting);
    setOffering({});
    setRequesting({});
    setSelectedPlayer(null);
  };

  const renderResourceSelector = (
    resources: Partial<Resources>,
    setResources: (r: Partial<Resources>) => void,
    maxResources: Resources,
    label: string
  ) => (
    <div>
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      <div className="flex gap-2">
        {resourceTypes.map(res => {
          const current = resources[res] || 0;
          const max = maxResources[res];

          return (
            <div key={res} className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${RESOURCE_COLORS[res]}30` }}
              >
                {current}
              </div>
              <span className="text-xs text-gray-500 capitalize">{res.slice(0, 1)}</span>
              <div className="flex gap-1 mt-1">
                <button
                  onClick={() => setResources({ ...resources, [res]: Math.max(0, current - 1) })}
                  disabled={current === 0}
                  className="w-5 h-5 rounded bg-gray-700 text-white text-xs disabled:opacity-30"
                >
                  -
                </button>
                <button
                  onClick={() => setResources({ ...resources, [res]: Math.min(max, current + 1) })}
                  disabled={current >= max}
                  className="w-5 h-5 rounded bg-gray-700 text-white text-xs disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // If there's a pending trade that involves the current player
  const isTradeTarget = pendingTrade && pendingTrade.toPlayerId === currentPlayer.id;
  const isTradeProposer = pendingTrade && pendingTrade.fromPlayerId === currentPlayer.id;

  if (pendingTrade && (isTradeTarget || isTradeProposer)) {
    const fromPlayer = players[pendingTrade.fromPlayerId];
    const toPlayer = players[pendingTrade.toPlayerId];

    return (
      <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">
          {isTradeTarget ? 'Trade Offer Received!' : 'Trade Offer Pending...'}
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{fromPlayer.name} offers:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(pendingTrade.offering)
                .filter(([, v]) => v && v > 0)
                .map(([res, amount]) => (
                  <span
                    key={res}
                    className="px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: `${RESOURCE_COLORS[res as ResourceType]}30`,
                      color: RESOURCE_COLORS[res as ResourceType],
                    }}
                  >
                    {amount} {res}
                  </span>
                ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">{fromPlayer.name} wants:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(pendingTrade.requesting)
                .filter(([, v]) => v && v > 0)
                .map(([res, amount]) => (
                  <span
                    key={res}
                    className="px-2 py-1 rounded text-sm"
                    style={{
                      backgroundColor: `${RESOURCE_COLORS[res as ResourceType]}30`,
                      color: RESOURCE_COLORS[res as ResourceType],
                    }}
                  >
                    {amount} {res}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {isTradeTarget && (
          <div className="flex gap-2">
            <button
              onClick={onAcceptTrade}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
            >
              Accept Trade
            </button>
            <button
              onClick={onRejectTrade}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
            >
              Reject Trade
            </button>
          </div>
        )}

        {isTradeProposer && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Waiting for {toPlayer.name} to respond...</p>
            <button
              onClick={onCancelTrade}
              className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel Trade
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Player Trading</h3>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`text-sm ${disabled ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
        >
          {isOpen ? 'Hide' : 'Propose Trade'}
        </button>
      </div>

      {!isOpen && (
        <p className="text-gray-500 text-sm">
          {disabled ? 'Wait for your turn to trade' : 'Trade resources with other players'}
        </p>
      )}

      {isOpen && !disabled && (
        <div className="space-y-4">
          {/* Player Selection */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Trade with:</p>
            <div className="flex flex-wrap gap-2">
              {otherPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => setSelectedPlayer(player.id)}
                  className={`
                    px-3 py-2 rounded-lg text-sm
                    ${selectedPlayer === player.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>

          {selectedPlayer && (
            <>
              {/* What you're offering */}
              {renderResourceSelector(
                offering,
                setOffering,
                currentPlayer.resources,
                `You offer (max: your resources)`
              )}

              {/* What you want */}
              {renderResourceSelector(
                requesting,
                setRequesting,
                players[selectedPlayer].resources,
                `You want (max: ${players[selectedPlayer].name}'s resources)`
              )}

              <button
                onClick={handlePropose}
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
              >
                Propose Trade
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
