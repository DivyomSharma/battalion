'use client';

import React, { useState, useEffect } from 'react';

/**
 * PhoneBlocker - Blocks phones (width < 640px) but allows tablets/iPads.
 * Shows a message telling users the game is not available on phones.
 */
export default function PhoneBlocker() {
    const [isPhone, setIsPhone] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            // Phone detection: width < 640px (sm breakpoint)
            // This allows tablets (typically >= 768px) to pass through
            const phone = window.innerWidth < 640;
            setIsPhone(phone);
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    if (!isPhone) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0e14] flex flex-col items-center justify-center p-6 text-center">
            {/* Border frame */}
            <div className="absolute inset-4 border border-cyan-600/30 rounded pointer-events-none" />

            {/* Icon */}
            <div className="text-6xl mb-6 opacity-50">📱</div>

            {/* Title */}
            <h1 className="text-xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">
                Desktop Required
            </h1>

            {/* Message */}
            <p className="text-gray-400 text-sm mb-4 max-w-xs">
                This tactical game requires a larger screen for the best experience.
            </p>

            <p className="text-gray-500 text-xs">
                Please use a tablet, iPad, or desktop computer.
            </p>

            {/* Corner brackets */}
            <div className="absolute top-8 left-8 w-6 h-6 border-t border-l border-cyan-500/40" />
            <div className="absolute top-8 right-8 w-6 h-6 border-t border-r border-cyan-500/40" />
            <div className="absolute bottom-8 left-8 w-6 h-6 border-b border-l border-cyan-500/40" />
            <div className="absolute bottom-8 right-8 w-6 h-6 border-b border-r border-cyan-500/40" />
        </div>
    );
}
