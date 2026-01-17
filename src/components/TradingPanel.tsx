'use client';

import React, { useState } from 'react';
import { Resources, ResourceType, RESOURCE_COLORS } from '@/types/game';

interface TradingPanelProps {
  playerResources: Resources;
  onTrade: (giveResource: ResourceType, getResource: ResourceType) => void;
}

const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

export default function TradingPanel({ playerResources, onTrade }: TradingPanelProps) {
  const [giveResource, setGiveResource] = useState<ResourceType | null>(null);
  const [getResource, setGetResource] = useState<ResourceType | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleTrade = () => {
    if (giveResource && getResource && giveResource !== getResource) {
      onTrade(giveResource, getResource);
      setGiveResource(null);
      setGetResource(null);
    }
  };

  const canTrade = giveResource && getResource &&
    giveResource !== getResource &&
    playerResources[giveResource] >= 2;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">Public Reserve Trading</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {isOpen ? 'Hide' : 'Trade'}
        </button>
      </div>

      {!isOpen && (
        <p className="text-gray-500 text-sm">Trade 2 of one resource for 1 of another</p>
      )}

      {isOpen && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 mb-2">Give 2:</p>
            <div className="flex gap-2">
              {resourceTypes.map(res => {
                const count = playerResources[res];
                const canGive = count >= 2;
                const isSelected = giveResource === res;

                return (
                  <button
                    key={res}
                    onClick={() => {
                      setGiveResource(isSelected ? null : res);
                      if (getResource === res) setGetResource(null);
                    }}
                    disabled={!canGive}
                    className={`
                      px-3 py-2 rounded-lg text-sm flex flex-col items-center
                      ${isSelected ? 'ring-2 ring-white' : ''}
                      ${!canGive ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                    style={{
                      backgroundColor: isSelected ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}30`,
                      color: 'white',
                    }}
                  >
                    <span className="font-bold">{count}</span>
                    <span className="text-xs capitalize">{res}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span className="text-gray-500 text-2xl">→</span>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-2">Get 1:</p>
            <div className="flex gap-2">
              {resourceTypes.map(res => {
                const isSelected = getResource === res;
                const isGiving = giveResource === res;

                return (
                  <button
                    key={res}
                    onClick={() => setGetResource(isSelected ? null : res)}
                    disabled={isGiving}
                    className={`
                      px-3 py-2 rounded-lg text-sm flex flex-col items-center
                      ${isSelected ? 'ring-2 ring-white' : ''}
                      ${isGiving ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                    style={{
                      backgroundColor: isSelected ? RESOURCE_COLORS[res] : `${RESOURCE_COLORS[res]}30`,
                      color: 'white',
                    }}
                  >
                    <span className="font-bold">+1</span>
                    <span className="text-xs capitalize">{res}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleTrade}
            disabled={!canTrade}
            className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg"
          >
            {canTrade ? `Trade 2 ${giveResource} for 1 ${getResource}` : 'Select resources to trade'}
          </button>
        </div>
      )}
    </div>
  );
}
