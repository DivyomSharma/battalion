'use client';

import React, { useEffect, useState } from 'react';
import { HeadlineCard as HeadlineCardType } from '@/types/game';

interface HeadlineCardProps {
  card: HeadlineCardType;
  onDismiss: () => void;
}

export default function HeadlineCard({ card, onDismiss }: HeadlineCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`
        fixed inset-0 flex items-center justify-center z-50
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onDismiss} />

      <div
        className={`
          relative bg-gradient-to-br from-red-900 to-orange-900
          rounded-xl p-6 max-w-md mx-4 shadow-2xl border-2 border-red-500
          transform transition-all duration-300
          ${isVisible ? 'scale-100' : 'scale-90'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">📰</span>
          <div>
            <span className="text-xs text-red-300 uppercase tracking-wider">
              Breaking News
            </span>
            <h2 className="text-xl font-bold text-white">{card.title}</h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-200 text-base mb-4">{card.description}</p>

        {/* Dismiss hint */}
        <p className="text-xs text-gray-400 text-center">
          Click anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
