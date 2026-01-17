'use client';

import React, { useState } from 'react';
import { DeploymentOrder, Resources, RESOURCE_COLORS, ResourceType, IdeologyTracks, PowerUsage } from '@/types/game';
import { canAfford } from '@/lib/gameEngine';
import { hasUnlockedPower, canUsePower } from '@/data/powers';

interface DeploymentShopProps {
  market: DeploymentOrder[];
  playerResources: Resources;
  playerIdeologyTracks?: IdeologyTracks;
  powerUsage?: PowerUsage;
  marketVersion?: number;
  onBuy: (cardId: string, useGoingViral?: boolean, useHelpingHands?: boolean) => void;
  disabled?: boolean;
}

const resourceIcons: Record<ResourceType, string> = {
  funds: '📦', // Supply
  clout: '💥', // Firepower
  media: '🔍', // Intel
  trust: '🛡️', // Morale
};

export default function DeploymentShop({
  market,
  playerResources,
  playerIdeologyTracks,
  powerUsage,
  marketVersion,
  onBuy,
  disabled,
}: DeploymentShopProps) {
  // Market Cooldown Logic to prevent buying glitched cards
  const [isCooldown, setIsCooldown] = useState(false);
  const [prevVersion, setPrevVersion] = useState(marketVersion);

  // Purchase Cooldown - 1 second delay between purchases
  const [isPurchaseCooldown, setIsPurchaseCooldown] = useState(false);

  // Trigger cooldown when market version changes
  React.useEffect(() => {
    if (marketVersion !== prevVersion) {
      if (prevVersion !== undefined) { // Don't trigger on initial mount
        setIsCooldown(true);
        const timer = setTimeout(() => setIsCooldown(false), 1500); // 1.5s delay
        return () => clearTimeout(timer);
      }
      setPrevVersion(marketVersion);
    }
  }, [marketVersion, prevVersion]);

  // Check if powers are available
  const hasGoingViral = playerIdeologyTracks && hasUnlockedPower(playerIdeologyTracks, 'showstopper', 3);
  const canUseGoingViral = hasGoingViral && powerUsage && canUsePower(powerUsage, 'showstopper', 3);

  const hasHelpingHands = playerIdeologyTracks && hasUnlockedPower(playerIdeologyTracks, 'idealist', 3);
  const canUseHelpingHands = hasHelpingHands && powerUsage && canUsePower(powerUsage, 'idealist', 3);

  // Powers are AUTO-APPLIED by default when available (user can toggle off)
  const [useGoingViral, setUseGoingViral] = useState(true);
  const [useHelpingHands, setUseHelpingHands] = useState(true);

  // Calculate effective cost with Helping Hands discount (only if power can be used)
  const effectiveHelpingHandsActive = canUseHelpingHands && useHelpingHands;
  const effectiveGoingViralActive = canUseGoingViral && useGoingViral;

  const getEffectiveCost = (cost: Partial<Resources>): Partial<Resources> => {
    if (!effectiveHelpingHandsActive) return cost;

    // Apply 1 resource discount
    const newCost = { ...cost };
    const types: ResourceType[] = ['funds', 'clout', 'media', 'trust'];
    for (const type of types) {
      if (newCost[type] && newCost[type]! > 0) {
        newCost[type] = newCost[type]! - 1;
        break;
      }
    }
    return newCost;
  };

  const handleBuy = (cardId: string) => {
    // Prevent purchase if in cooldown
    if (isPurchaseCooldown) return;

    // Only pass power flags if the power can actually be used
    const effectiveGoingViral = canUseGoingViral && useGoingViral;
    const effectiveHelpingHands = canUseHelpingHands && useHelpingHands;
    onBuy(cardId, effectiveGoingViral, effectiveHelpingHands);

    // Trigger 1-second purchase cooldown
    setIsPurchaseCooldown(true);
    setTimeout(() => setIsPurchaseCooldown(false), 1000);

    // Reset to auto-apply (true) after purchase - powers will auto-apply again if still available
    setUseGoingViral(true);
    setUseHelpingHands(true);
  };

  // Early return if market is not yet loaded
  if (!market || market.length === 0) {
    return (
      <div className="tactical-panel rounded p-3 font-mono">
        <div className="flex items-center justify-between mb-3 border-b border-[#4caf50]/30 pb-2">
          <h3 className="text-sm font-bold text-[#4caf50] uppercase tracking-widest glow-green">
            UNIT REQUISITION
          </h3>
        </div>
        <div className="text-center text-[#4caf50]/80 text-sm py-4">
          Loading deployment orders...
        </div>
      </div>
    );
  }

  return (
    <div className="tactical-panel rounded p-3 font-mono">
      <div className="flex items-center justify-between mb-3 border-b border-[#4caf50]/30 pb-2">
        <h3 className="text-sm font-bold text-[#4caf50] uppercase tracking-widest glow-green">
          UNIT REQUISITION
        </h3>
        {isPurchaseCooldown && (
          <span className="text-xs text-[#f44336] animate-pulse glow-red">
            STANDBY...
          </span>
        )}
      </div>

      {/* Power Options - Auto-applied by default */}
      {(canUseGoingViral || canUseHelpingHands) && (
        <div className="mb-3 p-2 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-xs text-green-400 mb-2">Powers auto-applied (uncheck to disable):</p>
          <div className="flex flex-wrap gap-2">
            {canUseGoingViral && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGoingViral}
                  onChange={(e) => setUseGoingViral(e.target.checked)}
                  className="w-4 h-4 accent-purple-500"
                />
                <span className="text-sm text-purple-300">
                  Phantom Unit (+1 Battalion)
                  <span className="text-xs text-gray-500 ml-1">
                    ({powerUsage!.showstopperL3}/2 used)
                  </span>
                </span>
              </label>
            )}
            {canUseHelpingHands && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useHelpingHands}
                  onChange={(e) => setUseHelpingHands(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm text-blue-300">
                  Local Coalition (-1 cost)
                  <span className="text-xs text-gray-500 ml-1">
                    ({powerUsage!.idealistL3}/2 used)
                  </span>
                </span>
              </label>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {market.map(card => {
          const effectiveCost = getEffectiveCost(card.cost);
          const affordable = canAfford(playerResources, effectiveCost);
          const bonusBattalions = effectiveGoingViralActive ? 1 : 0;

          return (
            <button
              key={card.id}
              onClick={() => handleBuy(card.id)}
              disabled={disabled || !affordable || isCooldown || isPurchaseCooldown}
              className={`
                p-2 rounded border transition-all duration-150 font-mono
                ${(isCooldown || isPurchaseCooldown)
                  ? 'border-[#4caf50]/20 bg-black/50 opacity-50 cursor-wait'
                  : (affordable && !disabled
                    ? 'border-[#4caf50] hover:bg-[#4caf50]/10 hover:shadow-[0_0_10px_rgba(76,175,80,0.3)]'
                    : 'border-[#4caf50]/30 opacity-60 cursor-not-allowed')
                }
              `}
            >
              {/* Battalion Count */}
              <div className="text-center mb-1">
                <div className="text-xl font-bold text-[#4caf50] glow-green">
                  {card.battalions + bonusBattalions}
                  {bonusBattalions > 0 && (
                    <span className="text-xs text-[#03a9f4] ml-1">
                      +{bonusBattalions}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-[#4caf50]/60 uppercase tracking-wider">
                  UNIT{card.battalions + bonusBattalions > 1 ? 'S' : ''}
                </div>
              </div>

              {/* Cost */}
              <div className="flex flex-wrap justify-center gap-1">
                {(Object.entries(effectiveCost) as [ResourceType, number][])
                  .filter(([, amount]) => amount > 0)
                  .map(([resource, amount]) => {
                    const originalAmount = card.cost[resource] || 0;
                    const isDiscounted = amount < originalAmount;

                    return (
                      <span
                        key={resource}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${RESOURCE_COLORS[resource]}30`,
                          color: RESOURCE_COLORS[resource],
                        }}
                      >
                        {resourceIcons[resource]} {amount}
                        {isDiscounted && (
                          <span className="line-through text-gray-500 ml-1">
                            {originalAmount}
                          </span>
                        )}
                      </span>
                    );
                  })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
