'use client';

import React, { useState, useEffect } from 'react';
import { PLAYER_COLORS } from '@/types/game';

interface PlayerInfo {
  id: string;
  name: string;
  connectionId: string;
  isHost: boolean;
  isReady: boolean;
}

interface WaitingRoomProps {
  roomCode: string;
  players: PlayerInfo[];
  currentPlayerId: string;
  isHost: boolean;
  connected: boolean;
  error: string | null;
  onStart: () => void;
  onLeave: () => void;
}

export default function WaitingRoom({
  roomCode,
  players,
  currentPlayerId,
  isHost,
  connected,
  error,
  onStart,
  onLeave,
}: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [smokePuffStyles, setSmokePuffStyles] = useState<Array<{width: number, height: number, opacity: number, duration: number, delay: number}>>([]);

  // Generate smoke puff styles on mount to avoid hydration mismatch
  useEffect(() => {
    setSmokePuffStyles(
      [...Array(12)].map(() => ({
        width: 80 + Math.random() * 100,
        height: 60 + Math.random() * 80,
        opacity: 0.3 + Math.random() * 0.2,
        duration: 3 + Math.random() * 3,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = roomCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = players.length >= 2 && players.length <= 5;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a08]">
      {/* Enhanced Smoke Overlay - Matching LandingPage */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        {/* Bottom smoke layer */}
        <div className="absolute bottom-0 left-0 right-0 h-[60%]" style={{
          background: 'linear-gradient(to top, rgba(30,25,20,0.95) 0%, rgba(30,25,20,0.7) 30%, rgba(30,25,20,0.3) 60%, transparent 100%)'
        }} />

        {/* Smoke puffs */}
        {smokePuffStyles?.map((puff, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              left: `${5 + i * 8}%`,
              bottom: `${5 + (i % 3) * 8}%`,
              width: `${puff.width}px`,
              height: `${puff.height}px`,
              background: `radial-gradient(ellipse, rgba(60,50,40,${puff.opacity}) 0%, transparent 70%)`,
              animationDuration: `${puff.duration}s`,
              animationDelay: `${puff.delay}s`,
              filter: 'blur(10px)',
            }}
          />
        ))}

        {/* Fire glow effects */}
        <div className="absolute bottom-[10%] left-[15%] w-40 h-32 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,100,30,0.4) 0%, rgba(255,50,0,0.2) 40%, transparent 70%)',
          animationDuration: '2s',
          filter: 'blur(20px)',
        }} />
        <div className="absolute bottom-[8%] right-[25%] w-32 h-28 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,80,20,0.35) 0%, rgba(255,40,0,0.15) 40%, transparent 70%)',
          animationDuration: '3s',
          animationDelay: '1s',
          filter: 'blur(15px)',
        }} />
        <div className="absolute bottom-[15%] left-[50%] w-24 h-20 animate-pulse" style={{
          background: 'radial-gradient(ellipse, rgba(255,120,40,0.3) 0%, transparent 60%)',
          animationDuration: '2.5s',
          animationDelay: '0.5s',
          filter: 'blur(12px)',
        }} />
      </div>

      {/* Vignette */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)'
      }} />

      {/* Military Corner Brackets */}
      <div className="fixed inset-0 z-[3] pointer-events-none">
        <div className="absolute top-4 left-4 w-20 h-20 border-l-2 border-t-2 border-[#4caf50]/60" />
        <div className="absolute top-4 right-4 w-20 h-20 border-r-2 border-t-2 border-[#4caf50]/60" />
        <div className="absolute bottom-4 left-4 w-20 h-20 border-l-2 border-b-2 border-[#4caf50]/60" />
        <div className="absolute bottom-4 right-4 w-20 h-20 border-r-2 border-b-2 border-[#4caf50]/60" />
      </div>

      {/* Radar Display - Top Right */}
      <div className="fixed top-6 right-6 z-[4] pointer-events-none">
        <div className="w-24 h-24 rounded-full border-2 border-[#4caf50]/40 relative bg-black/40 backdrop-blur-sm">
          <div className="absolute inset-2 rounded-full border border-[#4caf50]/20" />
          <div className="absolute inset-4 rounded-full border border-[#4caf50]/15" />
          <div className="absolute inset-6 rounded-full border border-[#4caf50]/10" />
          <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 bg-gradient-to-r from-[#4caf50] to-transparent origin-left animate-spin" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#4caf50] rounded-full -translate-x-1/2 -translate-y-1/2" />
          {players.map((_, i) => (
            <div key={i} className="absolute w-1.5 h-1.5 bg-[#4caf50] rounded-full animate-ping" style={{
              top: `${30 + i * 15}%`,
              left: `${35 + (i % 2) * 25}%`,
              animationDelay: `${i * 0.5}s`
            }} />
          ))}
        </div>
        <p className="text-[#4caf50]/60 text-[10px] font-mono text-center mt-1">TACTICAL RADAR</p>
      </div>

      {/* Status Panel - Top Left */}
      <div className="fixed top-6 left-6 z-[4] pointer-events-none">
        <div className="bg-black/50 backdrop-blur-sm border border-[#4caf50]/30 rounded px-3 py-2">
          <div className="text-[#4caf50] font-mono text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#4caf50] rounded-full animate-pulse" />
              <span>{connected ? 'UPLINK SECURE' : 'CONNECTING...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span>STAGING AREA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${canStart ? 'bg-[#4caf50]' : 'bg-red-500'}`} />
              <span>{players.length}/5 OPERATIVES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scanline Effect */}
      <div className="fixed inset-0 z-[3] pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.1) 2px, rgba(76,175,80,0.1) 4px)',
      }} />

      {/* Main Content Card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 font-mono">
        <div className="relative bg-black/70 backdrop-blur-xl border border-[#4caf50]/30 rounded-lg p-8 max-w-md w-full shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(76,175,80,0.1)]">

          {/* Command Center Header */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4">
            <span className="text-[#4caf50] text-xs font-mono tracking-wider">STAGING AREA</span>
          </div>

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#4caf50]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#4caf50]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#4caf50]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#4caf50]" />

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="military-header text-2xl font-bold mb-2">
              STAGING AREA
            </h1>

            {/* Room Code */}
            <div className="bg-black/50 border border-[#4caf50]/40 rounded p-4 mb-4">
              <p className="text-[#4caf50]/60 text-xs mb-2 uppercase tracking-wider">ACCESS CODE</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-[#4caf50] tracking-[0.5em]" style={{ textShadow: '0 0 15px rgba(76,175,80,0.8)' }}>
                  {roomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-[#0a0a0a] hover:bg-[#4caf50]/20 border border-[#4caf50]/50 rounded transition-colors text-[#4caf50]"
                  title="Copy room code"
                >
                  {copied ? '✓' : '⧉'}
                </button>
              </div>
              <p className="text-[#4caf50]/70 text-xs mt-2 uppercase tracking-wider">
                Share with operatives
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-center gap-2">
              <div className={`status-dot ${connected ? 'status-dot-online' : 'status-dot-danger'}`} />
              <span className={`text-xs uppercase tracking-wider ${connected ? 'text-[#4caf50]' : 'text-[#f44336]'}`}>
                {connected ? 'LINK ESTABLISHED' : 'CONNECTING...'}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="military-alert bg-[#f44336]/10 rounded p-3 mb-4">
              <p className="text-[#f44336] text-sm">{error}</p>
            </div>
          )}

          {/* Players List */}
          <div className="mb-6">
            <h3 className="text-[#4caf50]/60 text-xs mb-3 uppercase tracking-wider">
              OPERATIVES [{players.length}/5]
            </h3>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={`
                  flex items-center justify-between p-3 rounded border transition-all
                  ${player.id === currentPlayerId
                      ? 'bg-[#4caf50]/10 border-[#4caf50]'
                      : 'bg-black/30 border-[#4caf50]/30'}
                `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: PLAYER_COLORS[index], boxShadow: `0 0 8px ${PLAYER_COLORS[index]}` }}
                    />
                    <span className="text-[#e0e0e0] font-bold uppercase tracking-wider">
                      {player.name}
                      {player.id === currentPlayerId && (
                        <span className="text-[#4caf50]/60 text-xs ml-2">[YOU]</span>
                      )}
                    </span>
                  </div>
                  {player.isHost && (
                    <span className="text-xs bg-[#f44336] text-[#0a0a0a] px-2 py-0.5 rounded font-bold uppercase">
                      HOST
                    </span>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 5 - players.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center p-3 rounded border-2 border-dashed border-[#4caf50]/20"
                >
                  <span className="text-[#4caf50]/60 uppercase tracking-wider text-sm">Awaiting operative...</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isHost ? (
              <>
                <button
                  onClick={onStart}
                  disabled={!canStart}
                  className={`
                  w-full py-4 text-lg font-bold rounded uppercase tracking-wider transition-all
                  ${canStart
                      ? 'bg-[#4caf50] hover:bg-[#66bb6a] text-[#0a0a0a] shadow-[0_0_20px_rgba(76,175,80,0.4)]'
                      : 'bg-[#1a1a1a] text-[#4caf50]/60 cursor-not-allowed border border-[#4caf50]/20'}
                `}
                >
                  {canStart ? 'COMMENCE OPERATION' : `NEED ${2 - players.length} MORE`}
                </button>
                <p className="text-[#4caf50]/70 text-xs text-center uppercase tracking-wider">
                  You are commanding. Deploy when ready.
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#4caf50]/60 uppercase tracking-wider transmission-text">
                  Awaiting host command...
                </p>
              </div>
            )}

            <button
              onClick={onLeave}
              className="w-full py-2 bg-[#0a0a0a] hover:bg-[#f44336]/20 border border-[#f44336]/50 text-[#f44336] rounded uppercase tracking-wider transition-all"
            >
              ABORT MISSION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
