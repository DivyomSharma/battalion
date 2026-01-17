'use client';

import React from 'react';

interface MissionBriefingProps {
    onComplete: () => void;
}

export default function MissionBriefing({ onComplete }: MissionBriefingProps) {
    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
            {/* Background grid */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `
                    linear-gradient(rgba(76, 175, 80, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(76, 175, 80, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
            }} />

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-5" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76, 175, 80, 0.1) 2px, rgba(76, 175, 80, 0.1) 4px)',
            }} />

            {/* Content */}
            <div className="relative max-w-md w-full glass-card rounded-lg p-8 border border-[#4caf50]/50 shadow-[0_0_40px_rgba(76,175,80,0.2)] text-center">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#4caf50]" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#4caf50]" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#4caf50]" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#4caf50]" />

                {/* Title */}
                <h1 className="text-3xl font-bold text-[#4caf50] uppercase tracking-widest mb-4" style={{
                    fontFamily: 'var(--font-header)',
                    textShadow: '0 0 20px rgba(76, 175, 80, 0.5)'
                }}>
                    THE BATTALION
                </h1>

                {/* Brief Instructions */}
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                    Command your Battalions across 9 Sectors. Answer strategic dilemmas to gain resources and unlock abilities.
                    <span className="text-[#4caf50] font-bold"> Control 9 Sectors to achieve victory.</span>
                </p>

                {/* Commander Types */}
                <div className="grid grid-cols-2 gap-2 mb-6 text-[10px] font-mono uppercase">
                    <div className="p-2 rounded bg-[#4caf50]/10 border border-[#4caf50]/30 text-[#4caf50]">◆ CONTRACTOR</div>
                    <div className="p-2 rounded bg-[#f44336]/10 border border-[#f44336]/30 text-[#f44336]">◆ HARDLINER</div>
                    <div className="p-2 rounded bg-[#03a9f4]/10 border border-[#03a9f4]/30 text-[#03a9f4]">◆ OPERATIVE</div>
                    <div className="p-2 rounded bg-[#ffeb3b]/10 border border-[#ffeb3b]/30 text-[#ffeb3b]">◆ DIPLOMAT</div>
                </div>

                {/* Start Button */}
                <button
                    onClick={onComplete}
                    className="w-full py-4 bg-[#4caf50] hover:bg-[#66bb6a] text-black font-bold rounded uppercase tracking-widest transition-all hover:shadow-[0_0_30px_rgba(76,175,80,0.5)]"
                    style={{ fontFamily: 'var(--font-header)' }}
                >
                    BEGIN OPERATION
                </button>
            </div>

            {/* Version */}
            <div className="absolute bottom-4 text-[#4caf50]/60 text-xs font-mono">
                v1.0 // CLASSIFIED
            </div>
        </div>
    );
}
