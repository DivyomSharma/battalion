'use client';

import React, { useState, useEffect } from 'react';

/**
 * PortraitPrompt - Shows a full-screen overlay on mobile devices in portrait mode,
 * prompting users to rotate their phone to landscape for the best experience.
 */
export default function PortraitPrompt() {
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            // Check if device is mobile (viewport width < 1024px is typical for tablets/phones)
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);

            // Check if in portrait mode (height > width)
            const portrait = window.innerHeight > window.innerWidth;
            setIsPortrait(portrait);
        };

        // Initial check
        checkOrientation();

        // Listen for resize and orientation changes
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    // Only show on mobile devices in portrait mode
    if (!isMobile || !isPortrait) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
            {/* Rotate Icon Animation */}
            <div className="mb-8 animate-bounce">
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-cyan-400"
                >
                    {/* Phone outline */}
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    {/* Screen */}
                    <rect x="7" y="4" width="10" height="14" rx="1" className="fill-cyan-900/50" />
                    {/* Home button */}
                    <circle cx="12" cy="20" r="1" className="fill-cyan-400" />
                    {/* Rotation arrow */}
                    <path
                        d="M20 8 C 22 12, 20 18, 16 20"
                        className="stroke-yellow-400"
                        strokeWidth="2"
                    />
                    <path
                        d="M16 20 L 18 17 M 16 20 L 13 19"
                        className="stroke-yellow-400"
                        strokeWidth="2"
                    />
                </svg>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-white mb-4 font-[family-name:var(--font-header)]">
                Rotate Your Device
            </h1>

            {/* Message */}
            <p className="text-gray-300 text-lg mb-6 max-w-sm">
                This tactical game is best experienced in <span className="text-cyan-400 font-bold">landscape mode</span>.
            </p>

            <p className="text-gray-500 text-sm">
                Please rotate your phone horizontally to continue.
            </p>

            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
        </div>
    );
}
