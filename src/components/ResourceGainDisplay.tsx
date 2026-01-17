'use client';

import React, { useEffect, useState } from 'react';
import { ResourceGain, ResourceType, RESOURCE_COLORS } from '@/types/game';
import { resourceNames } from '@/data/displayNames';

interface ResourceGainDisplayProps {
  gain: ResourceGain | null;
  onDismiss: () => void;
}

const resourceIcons: Record<ResourceType, string> = {
  funds: '📦',
  clout: '💥',
  media: '🔍',
  trust: '🛡️',
};

const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

export default function ResourceGainDisplay({
  gain,
  onDismiss,
}: ResourceGainDisplayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (gain) {
      setVisible(true);
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gain, onDismiss]);

  if (!gain || !visible) return null;

  // Calculate total gain
  const totalGainAmount = Object.values(gain.total).reduce((sum, v) => sum + (v || 0), 0);

  if (totalGainAmount === 0) {
    return null;
  }

  // Get non-zero resources
  const gainedResources = resourceTypes.filter(res => (gain.total[res] || 0) > 0);

  return (
    <div
      className="fixed top-20 left-52 z-50 pointer-events-none hidden lg:block"
      style={{
        animation: 'slideInLeft 0.2s ease-out, fadeOut 0.5s ease-out 2.5s forwards'
      }}
    >
      <div className="bg-[#0a0a0a]/95 border border-[#4caf50] rounded px-2 py-1 font-mono shadow-[0_0_10px_rgba(76,175,80,0.3)]">
        <div className="flex items-center gap-1.5">
          {gainedResources.map(res => {
            const amount = gain.total[res] || 0;
            return (
              <div
                key={res}
                className="flex items-center gap-0.5 px-1 py-0.5 rounded"
                style={{ backgroundColor: `${RESOURCE_COLORS[res]}20` }}
              >
                <span className="text-xs">{resourceIcons[res]}</span>
                <span
                  className="text-xs font-bold"
                  style={{ color: RESOURCE_COLORS[res] }}
                >
                  +{amount}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
