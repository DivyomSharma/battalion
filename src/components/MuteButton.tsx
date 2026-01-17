'use client';

import React, { useState, useEffect } from 'react';
import { toggleBGM, isBGMMuted } from '@/lib/SoundManager';

export default function MuteButton() {
    const [isMuted, setIsMuted] = useState(false);

    // Sync with actual BGM state on mount
    useEffect(() => {
        setIsMuted(isBGMMuted());
    }, []);

    const handleToggle = () => {
        const newMuted = toggleBGM();
        setIsMuted(newMuted);
    };

    return (
        <button
            onClick={handleToggle}
            className="fixed bottom-20 right-4 z-40 w-10 h-10 flex items-center justify-center rounded-full bg-black/80 border border-[#4caf50]/50 hover:border-[#4caf50] transition-all hover:shadow-[0_0_10px_rgba(76,175,80,0.3)]"
            title={isMuted ? 'Unmute music' : 'Mute music'}
        >
            {isMuted ? (
                // Muted icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
            ) : (
                // Unmuted icon
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
            )}
        </button>
    );
}
