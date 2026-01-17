'use client';

import { useEffect } from 'react';
import { playSound } from '@/lib/SoundManager';
import MuteButton from './MuteButton';

export default function ClientUIEnforcer() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);

        // Global click sound on any interactive element
        const handleMouseDown = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Check if the clicked element is interactive
            const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'TEXTAREA' ||
                target.closest('button') ||
                target.closest('a') ||
                target.closest('[role="button"]') ||
                target.closest('[onclick]') ||
                target.style.cursor === 'pointer' ||
                window.getComputedStyle(target).cursor === 'pointer';

            if (isInteractive) {
                playSound('click_short');
            }
        };

        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    // Render the global mute button
    return <MuteButton />;
}
