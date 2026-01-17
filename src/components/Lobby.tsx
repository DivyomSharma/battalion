'use client';

import React, { useState, useEffect } from 'react';
import { PLAYER_COLORS } from '@/types/game';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function generatePlayerId() {
  return 'player_' + Math.random().toString(36).substr(2, 9);
}
import { gameTitle, gameSubtitle } from '@/data/displayNames';
import Tutorial from './Tutorial';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerId: string, playerName: string) => void;
  onPlayLocal: () => void;
}

export default function Lobby({ onJoinRoom, onPlayLocal }: LobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  useEffect(() => {
    let storedId = sessionStorage.getItem('shasn_player_id');
    if (!storedId) {
      storedId = generatePlayerId();
      sessionStorage.setItem('shasn_player_id', storedId);
    }
    setPlayerId(storedId);
    const storedName = localStorage.getItem('shasn_player_name');
    if (storedName) setPlayerName(storedName);
  }, []);

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) { alert('Please enter your name'); return; }
    localStorage.setItem('shasn_player_name', playerName);
    try {
      const { roomId, playerId: newPlayerId } = await createRoom({ playerName });
      onJoinRoom(roomId, newPlayerId, playerName);
    } catch (e) {
      console.error(e);
      alert("Failed to create room: " + e);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) { alert('Please enter your name'); return; }
    if (!roomCode.trim()) { alert('Please enter a room code'); return; }
    localStorage.setItem('shasn_player_name', playerName);
    try {
      const { roomId, playerId: newPlayerId } = await joinRoom({ roomCode: roomCode.toUpperCase(), playerName });
      onJoinRoom(roomId, newPlayerId, playerName);
    } catch (e: any) {
      console.error(e);
      alert("Failed to join room: " + (e.message || e));
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-3 sm:p-4 relative overflow-hidden font-mono">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#050508] to-[#0a0812] animate-gradient-shift" />

      {/* Perspective grid floor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[200%] h-[200%] left-[-50%] top-[30%] opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(76, 175, 80, 0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(76, 175, 80, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: 'perspective(500px) rotateX(65deg)',
            transformOrigin: 'center top',
            maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
          }}
        />
      </div>

      {/* Floating 3D Cubes - Hidden on mobile for performance */}
      <div className="hidden sm:block">
        {/* Green cubes */}
        <div className="absolute top-[8%] left-[8%] w-16 md:w-20 h-16 md:h-20 animate-float-slow preserve-3d" style={{ animationDelay: '0s' }}>
          <div className="absolute inset-0 border-2 border-[#4caf50]/60 bg-[#4caf50]/10 backdrop-blur-sm shadow-[0_0_30px_rgba(76,175,80,0.3)]" />
          <div className="absolute inset-0 border-2 border-[#4caf50]/30 bg-[#4caf50]/5 transform translate-x-3 translate-y-3" />
          <div className="absolute inset-0 border border-[#4caf50]/15 transform translate-x-6 translate-y-6" />
        </div>

        <div className="absolute top-[15%] right-[12%] w-10 md:w-14 h-10 md:h-14 animate-float-medium preserve-3d" style={{ animationDelay: '1.5s' }}>
          <div className="absolute inset-0 border-2 border-[#4caf50]/50 bg-[#4caf50]/10 backdrop-blur-sm shadow-[0_0_20px_rgba(76,175,80,0.2)]" />
          <div className="absolute inset-0 border border-[#4caf50]/25 transform translate-x-2 translate-y-2" />
        </div>

        <div className="absolute bottom-[20%] left-[5%] w-12 md:w-16 h-12 md:h-16 animate-float-medium preserve-3d" style={{ animationDelay: '0.8s' }}>
          <div className="absolute inset-0 border-2 border-[#4caf50]/40 bg-[#4caf50]/5 shadow-[0_0_25px_rgba(76,175,80,0.2)]" />
          <div className="absolute inset-0 border border-[#4caf50]/20 transform translate-x-2.5 translate-y-2.5" />
        </div>

        {/* Red/Orange cubes */}
        <div className="absolute top-[25%] right-[6%] w-16 md:w-24 h-16 md:h-24 animate-float-slow preserve-3d" style={{ animationDelay: '2s' }}>
          <div className="absolute inset-0 border-2 border-[#f44336]/50 bg-[#f44336]/10 backdrop-blur-sm shadow-[0_0_35px_rgba(244,67,54,0.3)]" />
          <div className="absolute inset-0 border-2 border-[#f44336]/25 bg-[#f44336]/5 transform translate-x-4 translate-y-4" />
          <div className="absolute inset-0 border border-[#f44336]/10 transform translate-x-8 translate-y-8" />
        </div>

        <div className="absolute bottom-[12%] right-[15%] w-10 md:w-12 h-10 md:h-12 animate-float-fast preserve-3d" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 border-2 border-[#ff5722]/60 bg-[#ff5722]/10 shadow-[0_0_20px_rgba(255,87,34,0.3)]" />
          <div className="absolute inset-0 border border-[#ff5722]/30 transform translate-x-2 translate-y-2" />
        </div>

        {/* Blue/Cyan cubes */}
        <div className="absolute top-[45%] left-[3%] animate-float-medium preserve-3d" style={{ animationDelay: '1s' }}>
          <div className="w-14 md:w-[72px] h-14 md:h-[72px] border-2 border-[#2196f3]/50 bg-[#2196f3]/10 backdrop-blur-sm shadow-[0_0_25px_rgba(33,150,243,0.3)]" />
        </div>

        <div className="absolute bottom-[35%] right-[4%] w-10 md:w-14 h-10 md:h-14 animate-float-slow preserve-3d" style={{ animationDelay: '2.5s' }}>
          <div className="absolute inset-0 border-2 border-[#00bcd4]/50 bg-[#00bcd4]/10 shadow-[0_0_20px_rgba(0,188,212,0.25)]" />
          <div className="absolute inset-0 border border-[#00bcd4]/25 transform translate-x-2 translate-y-2" />
        </div>

        {/* Purple cubes */}
        <div className="absolute top-[60%] right-[8%] w-12 md:w-16 h-12 md:h-16 animate-float-medium preserve-3d" style={{ animationDelay: '1.8s' }}>
          <div className="absolute inset-0 border-2 border-[#9c27b0]/50 bg-[#9c27b0]/10 backdrop-blur-sm shadow-[0_0_25px_rgba(156,39,176,0.3)]" />
          <div className="absolute inset-0 border border-[#9c27b0]/25 transform translate-x-2.5 translate-y-2.5" />
        </div>

        <div className="absolute bottom-[25%] left-[12%] w-8 md:w-10 h-8 md:h-10 animate-float-fast preserve-3d" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 border-2 border-[#673ab7]/60 bg-[#673ab7]/15 shadow-[0_0_15px_rgba(103,58,183,0.3)]" />
          <div className="absolute inset-0 border border-[#673ab7]/30 transform translate-x-1.5 translate-y-1.5" />
        </div>

        {/* Yellow/Gold cubes */}
        <div className="absolute top-[12%] left-[25%] w-10 md:w-12 h-10 md:h-12 animate-float-fast preserve-3d" style={{ animationDelay: '1.2s' }}>
          <div className="absolute inset-0 border-2 border-[#ffc107]/60 bg-[#ffc107]/10 shadow-[0_0_20px_rgba(255,193,7,0.3)]" />
          <div className="absolute inset-0 border border-[#ffc107]/30 transform translate-x-2 translate-y-2" />
        </div>

        <div className="absolute bottom-[8%] left-[30%] w-10 md:w-14 h-10 md:h-14 animate-float-medium preserve-3d" style={{ animationDelay: '2.2s' }}>
          <div className="absolute inset-0 border-2 border-[#ffeb3b]/50 bg-[#ffeb3b]/10 shadow-[0_0_20px_rgba(255,235,59,0.25)]" />
          <div className="absolute inset-0 border border-[#ffeb3b]/25 transform translate-x-2 translate-y-2" />
        </div>

        {/* Small floating particles/dots */}
        <div className="absolute top-[20%] left-[40%] w-2 h-2 bg-[#4caf50] rounded-full animate-pulse-glow shadow-[0_0_10px_#4caf50,0_0_20px_#4caf50]" />
        <div className="absolute top-[35%] right-[30%] w-1.5 h-1.5 bg-[#f44336] rounded-full animate-pulse-glow shadow-[0_0_8px_#f44336]" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[40%] left-[20%] w-2 h-2 bg-[#2196f3] rounded-full animate-pulse-glow shadow-[0_0_10px_#2196f3]" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[50%] left-[15%] w-1.5 h-1.5 bg-[#9c27b0] rounded-full animate-pulse-glow shadow-[0_0_8px_#9c27b0]" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[30%] right-[25%] w-2 h-2 bg-[#ffc107] rounded-full animate-pulse-glow shadow-[0_0_10px_#ffc107]" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[70%] right-[35%] w-1.5 h-1.5 bg-[#00bcd4] rounded-full animate-pulse-glow shadow-[0_0_8px_#00bcd4]" style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Corner accent lines */}
      <div className="absolute top-0 left-0 w-24 h-24 hidden sm:block">
        <div className="absolute top-6 left-6 w-12 h-px bg-gradient-to-r from-[#4caf50] to-transparent" />
        <div className="absolute top-6 left-6 w-px h-12 bg-gradient-to-b from-[#4caf50] to-transparent" />
      </div>
      <div className="absolute top-0 right-0 w-24 h-24 hidden sm:block">
        <div className="absolute top-6 right-6 w-12 h-px bg-gradient-to-l from-[#4caf50] to-transparent" />
        <div className="absolute top-6 right-6 w-px h-12 bg-gradient-to-b from-[#4caf50] to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 w-24 h-24 hidden sm:block">
        <div className="absolute bottom-6 left-6 w-12 h-px bg-gradient-to-r from-[#4caf50] to-transparent" />
        <div className="absolute bottom-6 left-6 w-px h-12 bg-gradient-to-t from-[#4caf50] to-transparent" />
      </div>
      <div className="absolute bottom-0 right-0 w-24 h-24 hidden sm:block">
        <div className="absolute bottom-6 right-6 w-12 h-px bg-gradient-to-l from-[#4caf50] to-transparent" />
        <div className="absolute bottom-6 right-6 w-px h-12 bg-gradient-to-t from-[#4caf50] to-transparent" />
      </div>

      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Main Terminal Card */}
      <div className="relative bg-[#0a0a0a] border border-[#4caf50]/70 rounded-sm sm:rounded p-4 sm:p-6 w-full max-w-[340px] sm:max-w-sm shadow-[0_0_30px_rgba(76,175,80,0.15)] z-10">
        {/* Terminal header */}
        <div className="absolute -top-px left-4 right-4 h-px bg-[#4caf50]/50" />

        {/* Corner brackets */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t border-l border-[#4caf50]" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t border-r border-[#4caf50]" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b border-l border-[#4caf50]" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b border-r border-[#4caf50]" />

        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.5) 2px, rgba(76,175,80,0.5) 4px)',
          }} />
        </div>

        {/* Title */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#4caf50] tracking-widest uppercase" style={{ textShadow: '0 0 10px rgba(76,175,80,0.5)' }}>
            {gameTitle}
          </h1>
          <p className="text-[#4caf50]/50 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs mt-1">{gameSubtitle}</p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#4caf50]/40 to-transparent" />
        </div>

        {mode === 'select' && (
          <div className="space-y-2 sm:space-y-2.5">
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full py-2 sm:py-2.5 bg-transparent hover:bg-[#f44336]/10 border border-[#f44336]/60 hover:border-[#f44336] text-[#f44336] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all"
            >
              [ HOW TO PLAY ]
            </button>

            <div className="flex items-center gap-2 my-3 sm:my-4">
              <div className="flex-1 h-px bg-[#4caf50]/30" />
              <span className="text-[#4caf50]/60 text-[9px] sm:text-[10px] uppercase tracking-widest">Online</span>
              <div className="flex-1 h-px bg-[#4caf50]/30" />
            </div>

            <button
              onClick={() => setMode('create')}
              className="w-full py-2.5 sm:py-3 bg-[#4caf50]/10 hover:bg-[#4caf50]/20 border border-[#4caf50] text-[#4caf50] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all hover:shadow-[0_0_15px_rgba(76,175,80,0.3)]"
            >
              &gt; CREATE ROOM
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full py-2.5 sm:py-3 bg-transparent hover:bg-[#4caf50]/10 border border-[#4caf50]/50 hover:border-[#4caf50] text-[#4caf50]/80 hover:text-[#4caf50] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all"
            >
              &gt; JOIN ROOM
            </button>

            <div className="flex items-center gap-2 my-3 sm:my-4">
              <div className="flex-1 h-px bg-[#4caf50]/30" />
              <span className="text-[#4caf50]/60 text-[9px] sm:text-[10px] uppercase tracking-widest">Local</span>
              <div className="flex-1 h-px bg-[#4caf50]/30" />
            </div>

            <button
              onClick={() => onPlayLocal()}
              className="w-full py-2 sm:py-2.5 bg-transparent hover:bg-[#4caf50]/10 border border-[#4caf50]/30 hover:border-[#4caf50]/60 text-[#4caf50]/60 hover:text-[#4caf50] uppercase tracking-wider text-xs sm:text-sm rounded-sm transition-all"
            >
              &gt; LOCAL MULTIPLAYER
            </button>

            <div className="flex items-center gap-2 my-3 sm:my-4">
              <div className="flex-1 h-px bg-[#4caf50]/30" />
              <span className="text-[#4caf50]/60 text-[9px] sm:text-[10px] uppercase tracking-widest">Links</span>
              <div className="flex-1 h-px bg-[#4caf50]/30" />
            </div>

            <a
              href="https://discord.gg/mNXK4ejYpf"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2 sm:py-2.5 bg-transparent hover:bg-[#5865F2]/10 border border-[#5865F2]/60 hover:border-[#5865F2] text-[#5865F2] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all text-center"
            >
              [ DISCORD ]
            </a>

            <button
              onClick={() => setShowBugReport(true)}
              className="w-full py-1.5 sm:py-2 bg-transparent hover:bg-[#f44336]/10 border border-[#f44336]/30 hover:border-[#f44336]/60 text-[#f44336]/50 hover:text-[#f44336] uppercase tracking-wider text-[10px] sm:text-xs rounded-sm transition-all"
            >
              [ REPORT BUG ]
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3 sm:space-y-4">
            <button onClick={() => setMode('select')} className="text-[#4caf50]/50 hover:text-[#4caf50] text-xs flex items-center gap-1 uppercase tracking-wider transition-colors">
              &lt;-- BACK
            </button>

            <h2 className="text-base sm:text-lg font-bold text-[#4caf50] uppercase tracking-widest">&gt; CREATE ROOM</h2>

            <div>
              <label className="block text-[#4caf50]/50 text-[10px] sm:text-xs mb-1.5 uppercase tracking-wider">Codename:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="enter_codename"
                className="w-full bg-[#0a0a0a] text-[#4caf50] px-3 py-2 sm:py-2.5 rounded-sm border border-[#4caf50]/40 focus:border-[#4caf50] focus:outline-none focus:shadow-[0_0_10px_rgba(76,175,80,0.2)] placeholder-[#4caf50]/25 font-mono text-xs sm:text-sm transition-all"
                maxLength={20}
              />
            </div>

            <button
              onClick={handleCreateRoom}
              className="w-full py-2.5 sm:py-3 bg-[#4caf50] hover:bg-[#66bb6a] text-[#0a0a0a] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all shadow-[0_0_20px_rgba(76,175,80,0.3)]"
            >
              INITIALIZE
            </button>

            <p className="text-[#4caf50]/30 text-[10px] sm:text-xs text-center uppercase tracking-wider">
              Room code auto-generated
            </p>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3 sm:space-y-4">
            <button onClick={() => setMode('select')} className="text-[#4caf50]/50 hover:text-[#4caf50] text-xs flex items-center gap-1 uppercase tracking-wider transition-colors">
              &lt;-- BACK
            </button>

            <h2 className="text-base sm:text-lg font-bold text-[#4caf50] uppercase tracking-widest">&gt; JOIN ROOM</h2>

            <div>
              <label className="block text-[#4caf50]/50 text-[10px] sm:text-xs mb-1.5 uppercase tracking-wider">Codename:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="enter_codename"
                className="w-full bg-[#0a0a0a] text-[#4caf50] px-3 py-2 sm:py-2.5 rounded-sm border border-[#4caf50]/40 focus:border-[#4caf50] focus:outline-none focus:shadow-[0_0_10px_rgba(76,175,80,0.2)] placeholder-[#4caf50]/25 font-mono text-xs sm:text-sm transition-all"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-[#4caf50]/50 text-[10px] sm:text-xs mb-1.5 uppercase tracking-wider">Access Code:</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full bg-[#0a0a0a] text-[#4caf50] px-3 py-2 sm:py-2.5 rounded-sm border border-[#4caf50]/40 focus:border-[#4caf50] focus:outline-none focus:shadow-[0_0_10px_rgba(76,175,80,0.2)] text-center text-lg sm:text-xl tracking-[0.4em] sm:tracking-[0.5em] font-mono placeholder-[#4caf50]/25 transition-all"
                maxLength={6}
              />
            </div>

            <button
              onClick={handleJoinRoom}
              className="w-full py-2.5 sm:py-3 bg-[#4caf50] hover:bg-[#66bb6a] text-[#0a0a0a] uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all shadow-[0_0_20px_rgba(76,175,80,0.3)]"
            >
              CONNECT
            </button>
          </div>
        )}

        {/* Status bar */}
        <div className="mt-4 sm:mt-5 pt-3 border-t border-[#4caf50]/20 flex justify-between items-center text-[9px] sm:text-[10px] text-[#4caf50]/40 uppercase tracking-wider">
          <span>SYS:READY</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#4caf50] rounded-full animate-pulse" />
            ONLINE
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(3deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(-2deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 6s ease-in-out infinite;
        }
        .animate-float-fast {
          animation: float-fast 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>

      {/* Bug Report Modal */}
      {showBugReport && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowBugReport(false)}>
          <div
            className="bg-[#0a0a0a] border border-[#f44336]/50 rounded-sm p-4 sm:p-5 max-w-sm w-full shadow-[0_0_30px_rgba(244,67,54,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm sm:text-base font-bold text-[#f44336] uppercase tracking-widest mb-3 text-center">Report Bug</h3>
            <p className="text-gray-500 text-xs mb-3 text-center">Send report to:</p>

            <div className="bg-[#0a0a0a] border border-[#4caf50]/30 rounded-sm p-3 mb-3 flex items-center justify-between gap-2">
              <span className="text-[#4caf50] font-mono text-xs sm:text-sm select-all truncate">theplotarmour@gmail.com</span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText('theplotarmour@gmail.com');
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  } catch (e) {
                    const textArea = document.createElement('textarea');
                    textArea.value = 'theplotarmour@gmail.com';
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    setEmailCopied(true);
                    setTimeout(() => setEmailCopied(false), 2000);
                  }
                }}
                className={`px-3 py-1.5 rounded-sm font-bold uppercase text-[10px] sm:text-xs transition-all flex-shrink-0 ${emailCopied
                  ? 'bg-[#4caf50] text-black'
                  : 'bg-[#4caf50]/20 text-[#4caf50] hover:bg-[#4caf50]/30'
                  }`}
              >
                {emailCopied ? 'OK' : 'COPY'}
              </button>
            </div>

            <button
              onClick={() => setShowBugReport(false)}
              className="w-full py-2 border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 rounded-sm uppercase tracking-wider text-xs transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
