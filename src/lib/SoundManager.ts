'use client';

// Sound IDs that map to files in /public/sounds/
export type SoundId = 'click_short' | 'alert_error' | 'deploy_troop' | 'redeploy_move' | 'success_chime' | 'victory_fanfare';

const SOUND_FILES: Record<SoundId, string> = {
    click_short: '/sounds/click_short.wav',
    alert_error: '/sounds/alert_error.mp3',
    deploy_troop: '/sounds/deploy_troop.mp3',
    redeploy_move: '/sounds/redeploy_move.mp3',
    success_chime: '/sounds/success_chime.wav',
    victory_fanfare: '/sounds/success_chime.wav', // Uses same file, plays louder
};

// Per-sound volume multipliers (1.0 = 100%)
const SOUND_VOLUME_MULTIPLIERS: Record<SoundId, number> = {
    click_short: 0.6,
    alert_error: 0.8,
    deploy_troop: 0.8,
    redeploy_move: 0.7,
    success_chime: 1.0, // Loud and clear!
    victory_fanfare: 1.0, // Victory celebration!
};

class SoundManager {
    private static instance: SoundManager;
    private audioCache: Map<SoundId, HTMLAudioElement> = new Map();
    private muted: boolean = false;
    private volume: number = 0.7; // Base volume (70%)

    private constructor() {
        // Preload sounds
        if (typeof window !== 'undefined') {
            this.preloadSounds();
        }
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private preloadSounds(): void {
        Object.entries(SOUND_FILES).forEach(([id, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.audioCache.set(id as SoundId, audio);
        });
    }

    public play(soundId: SoundId): void {
        if (this.muted || typeof window === 'undefined') return;

        // Calculate effective volume with per-sound multiplier
        const multiplier = SOUND_VOLUME_MULTIPLIERS[soundId] || 1.0;
        const effectiveVolume = Math.min(1.0, this.volume * multiplier);

        try {
            // Clone the audio to allow overlapping sounds
            const cachedAudio = this.audioCache.get(soundId);
            if (cachedAudio) {
                const audio = cachedAudio.cloneNode() as HTMLAudioElement;
                audio.volume = effectiveVolume;
                audio.play().catch(() => {
                    // Ignore autoplay restrictions silently
                });
            } else {
                // Fallback: create and play directly
                const audio = new Audio(SOUND_FILES[soundId]);
                audio.volume = effectiveVolume;
                audio.play().catch(() => { });
            }
        } catch {
            // Silently fail if audio is not available
        }
    }

    public setMuted(muted: boolean): void {
        this.muted = muted;
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioCache.forEach(audio => {
            audio.volume = this.volume;
        });
    }

    public getVolume(): number {
        return this.volume;
    }
}

// Export singleton instance getter
export const getSoundManager = () => SoundManager.getInstance();

// Convenience function for playing sounds
export const playSound = (soundId: SoundId) => {
    getSoundManager().play(soundId);
};

// Background Music Manager
class BGMManager {
    private static instance: BGMManager;
    private audio: HTMLAudioElement | null = null;
    private loopStartTime: number = 108; // 1:48 in seconds
    private hasPlayedOnce: boolean = false;

    private constructor() { }

    public static getInstance(): BGMManager {
        if (!BGMManager.instance) {
            BGMManager.instance = new BGMManager();
        }
        return BGMManager.instance;
    }

    public start(): void {
        if (typeof window === 'undefined') return;
        if (this.audio) return; // Already playing

        this.audio = new Audio('/sounds/bgm.mp3');
        this.audio.volume = 0.04; // Barely audible ambient background

        // Handle the end of the track
        this.audio.addEventListener('ended', () => {
            if (this.audio) {
                // After first full play, loop from 1:48
                this.audio.currentTime = this.loopStartTime;
                this.audio.play().catch(() => { });
            }
        });

        // Handle timeupdate to ensure proper looping
        this.audio.addEventListener('timeupdate', () => {
            // This is just for monitoring, actual loop happens on 'ended'
        });

        this.audio.play().catch(() => {
            // Autoplay might be blocked - we'll try again on user interaction
            console.log('BGM autoplay blocked - will start on user interaction');
        });
    }

    public stop(): void {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
            this.hasPlayedOnce = false;
        }
    }

    public setVolume(volume: number): void {
        if (this.audio) {
            this.audio.volume = Math.max(0, Math.min(1, volume));
        }
    }

    public isPlaying(): boolean {
        return this.audio !== null && !this.audio.paused;
    }

    public mute(): void {
        if (this.audio) {
            this.audio.muted = true;
        }
    }

    public unmute(): void {
        if (this.audio) {
            this.audio.muted = false;
        }
    }

    public toggleMute(): boolean {
        if (this.audio) {
            this.audio.muted = !this.audio.muted;
            return this.audio.muted;
        }
        return false;
    }

    public isMuted(): boolean {
        return this.audio?.muted ?? false;
    }
}

export const getBGMManager = () => BGMManager.getInstance();
export const startBGM = () => getBGMManager().start();
export const stopBGM = () => getBGMManager().stop();
export const muteBGM = () => getBGMManager().mute();
export const unmuteBGM = () => getBGMManager().unmute();
export const toggleBGM = () => getBGMManager().toggleMute();
export const isBGMMuted = () => getBGMManager().isMuted();

