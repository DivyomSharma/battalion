'use client';

import React from 'react';
import { IdeologyCard as IdeologyCardType } from '@/types/game';

interface IdeologyCardProps {
  card: IdeologyCardType;
  onAnswer: (choice: 'A' | 'B') => void;
  disabled?: boolean;
  onRedraw?: () => void;
  canRedraw?: boolean;
}

export default function IdeologyCard({ card, onAnswer, disabled, onRedraw, canRedraw }: IdeologyCardProps) {
  return (
    <div className="tactical-modal rounded p-4 md:p-6 max-w-full mx-auto relative overflow-hidden font-mono">
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#4caf50]/50 pointer-events-none" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#4caf50]/50 pointer-events-none" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#4caf50]/50 pointer-events-none" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#4caf50]/50 pointer-events-none" />

      {/* Question Header */}
      <div className="text-center mb-5 relative z-10">
        <div className="inline-block px-3 py-1 bg-[#f44336]/20 border border-[#f44336]/50 rounded mb-3">
          <span className="text-xs text-[#f44336] tracking-[0.3em] uppercase animate-pulse font-bold glow-red">
            INCOMING TRANSMISSION
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-[#4caf50] mb-4 tracking-widest uppercase glow-green">
          SITUATION REPORT REQUIRED
        </h2>

        <div className="bg-black/60 p-4 border-l-2 border-[#4caf50] text-left backdrop-blur-sm">
          <p className="text-[#e0e0e0] text-base md:text-lg leading-relaxed">
            "{card.question}"
          </p>
        </div>

        {canRedraw && onRedraw && (
          <button
            onClick={onRedraw}
            className="tactical-btn mt-4 text-xs px-4 py-2 rounded uppercase tracking-wider"
          >
            ↻ REQUEST NEW INTEL [COST: 4 RES]
          </button>
        )}
      </div>

      {/* Options - Hidden ideology */}
      <div className="grid grid-cols-1 gap-3 relative z-10">
        {['A', 'B'].map((optionLabel) => {
          const option = optionLabel === 'A' ? card.optionA : card.optionB;

          return (
            <button
              key={optionLabel}
              onClick={() => onAnswer(optionLabel as 'A' | 'B')}
              disabled={disabled}
              className={`
                group relative p-1 rounded transition-all duration-200 w-full text-left
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-[1.01]
              `}
            >
              <div
                className="absolute inset-0 border border-[#4caf50]/40 rounded bg-[#0a0a0a] group-hover:border-[#4caf50] group-hover:shadow-[0_0_15px_rgba(76,175,80,0.3)] transition-all"
              />

              <div className="relative p-3 flex flex-row items-center gap-3">
                {/* Option Label */}
                <div className="flex flex-col items-center justify-center shrink-0 border-r border-[#4caf50]/30 pr-3 h-full">
                  <span className="text-2xl font-bold text-[#4caf50]" style={{ textShadow: '0 0 10px rgba(76,175,80,0.5)' }}>
                    {optionLabel}
                  </span>
                </div>

                {/* Text - No ideology shown */}
                <div className="flex-1 min-w-0">
                  <p className="text-[#e0e0e0] text-sm leading-snug">
                    {option.text}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-center text-[#4caf50]/80 text-[9px] mt-4 uppercase tracking-[0.3em] relative z-10">
        [ RESPONSE REQUIRED TO PROCEED ]
      </p>
    </div>
  );
}
