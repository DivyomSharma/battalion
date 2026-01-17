'use client';

import React, { useState } from 'react';

interface TutorialProps {
  onClose: () => void;
}

// Tutorial slides - self-contained content
const SLIDES = [
  {
    id: 'objective',
    title: 'MISSION OBJECTIVE',
    icon: '🎯',
    content: (
      <div className="h-full flex flex-col gap-6">
        <div className="bg-[#4caf50]/10 border border-[#4caf50]/40 rounded-xl p-6 group hover:bg-[#4caf50]/20 transition-all duration-300">
          <p className="text-[#4caf50] font-bold text-2xl lg:text-3xl uppercase tracking-wider mb-2 group-hover:scale-[1.02] transition-transform origin-left">Goal: Lock the Most Battalions</p>
          <p className="text-gray-300 text-lg lg:text-xl leading-relaxed">Unlike typical territory games, you win by <span className="text-[#4caf50] font-bold">LOCKING</span> your troops in place, not just occupying land.</p>
        </div>

        <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="bg-black/40 border-2 border-[#4caf50]/30 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:bg-[#4caf50]/10 hover:border-[#4caf50] transition-all duration-300 group cursor-default">
            <div className="text-5xl lg:text-6xl mb-4 group-hover:scale-110 transition-transform">🔒</div>
            <p className="text-[#4caf50] text-sm lg:text-base uppercase tracking-wider font-bold mb-2">1 Locked Battalion</p>
            <p className="text-white font-bold text-3xl lg:text-5xl group-hover:text-[#4caf50] transition-colors">= 1 Point</p>
          </div>
          <div className="bg-black/40 border-2 border-[#f44336]/30 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:bg-[#f44336]/10 hover:border-[#f44336] transition-all duration-300 group cursor-default">
            <div className="text-5xl lg:text-6xl mb-4 group-hover:rotate-12 transition-transform">⏱️</div>
            <p className="text-[#f44336] text-sm lg:text-base uppercase tracking-wider font-bold mb-2">Game Ends When</p>
            <p className="text-white font-bold text-xl lg:text-2xl leading-tight group-hover:text-[#f44336] transition-colors">All 9 sectors controlled<br />OR map is full</p>
          </div>
        </div>

        <div className="bg-[#ff9800]/10 border border-[#ff9800]/40 rounded-xl p-4 mt-auto hover:bg-[#ff9800]/20 transition-colors cursor-help">
          <p className="text-[#ff9800] text-lg lg:text-xl">
            <span className="font-bold">🔐 HOW TO LOCK:</span> Deploy enough troops to secure a sector (&gt;50% capacity). Your units become permanent statues!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'map',
    title: 'THE BATTLEFIELD',
    icon: '🗺️',
    content: (
      <div className="h-full flex flex-col gap-4">
        <p className="text-gray-300 text-xl text-center shrink-0">The map is a 3x3 grid with 9 sectors of different sizes</p>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="bg-[#4caf50]/10 border-2 border-[#4caf50]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:scale-[1.02] hover:bg-[#4caf50]/20 transition-all duration-300 cursor-cell md:p-6">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className="text-3xl lg:text-4xl shrink-0">🏔️</span>
              <span className="text-[#4caf50] font-bold text-xl lg:text-2xl uppercase">Corners ×4</span>
            </div>
            <p className="text-gray-400 text-base lg:text-lg mb-1">11 slots • Need 6 to control</p>
            <p className="text-white font-bold text-2xl lg:text-3xl">+6 Points</p>
          </div>

          <div className="bg-[#03a9f4]/10 border-2 border-[#03a9f4]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:scale-[1.02] hover:bg-[#03a9f4]/20 transition-all duration-300 cursor-cell md:p-6">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className="text-3xl lg:text-4xl shrink-0">🌉</span>
              <span className="text-[#03a9f4] font-bold text-xl lg:text-2xl uppercase">Edges ×2</span>
            </div>
            <p className="text-gray-400 text-base lg:text-lg mb-1">17 slots • Need 9 to control</p>
            <p className="text-white font-bold text-2xl lg:text-3xl">+9 Points</p>
          </div>

          <div className="bg-[#9c27b0]/10 border-2 border-[#9c27b0]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:scale-[1.02] hover:bg-[#9c27b0]/20 transition-all duration-300 cursor-cell md:p-6">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className="text-3xl lg:text-4xl shrink-0">⭐</span>
              <span className="text-[#9c27b0] font-bold text-xl lg:text-2xl uppercase">Center ×1</span>
            </div>
            <p className="text-gray-400 text-base lg:text-lg mb-1">9 slots • Need 5 to control</p>
            <p className="text-white font-bold text-2xl lg:text-3xl">+5 Points</p>
          </div>

          <div className="bg-[#f44336]/10 border-2 border-[#f44336]/40 rounded-xl p-4 flex flex-col justify-center items-center text-center hover:scale-[1.02] hover:bg-[#f44336]/20 transition-all duration-300 cursor-cell md:p-6">
            <div className="flex items-center gap-2 mb-2 lg:mb-3">
              <span className="text-3xl lg:text-4xl shrink-0">🏰</span>
              <span className="text-[#f44336] font-bold text-xl lg:text-2xl uppercase">Citadels ×2</span>
            </div>
            <p className="text-gray-400 text-base lg:text-lg mb-1">21 slots • Need 11 to control</p>
            <p className="text-white font-bold text-2xl lg:text-3xl">+11 Points</p>
          </div>
        </div>

        <div className="bg-[#f44336]/10 border border-[#f44336]/40 rounded-xl p-4 shrink-0 hover:bg-[#f44336]/20 transition-colors">
          <p className="text-[#f44336] text-lg lg:text-xl text-center">
            <span className="font-bold">⚡ HOT ZONES:</span> Some slots trigger random events. Units here become PERMANENT and cannot move!
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'resources',
    title: 'RESOURCES',
    icon: '💰',
    content: (
      <div className="h-full flex flex-col justify-center">
        <p className="text-gray-300 text-xl text-center mb-8 shrink-0">You have 4 types of currency. Maximum 12 total resources!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1 min-h-0 items-stretch content-center">
          <div className="flex items-center gap-4 bg-[#4caf50]/10 border-2 border-[#4caf50]/30 rounded-xl p-4 md:p-6 hover:bg-[#4caf50]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(76,175,80,0.2)] transition-all duration-300 cursor-pointer">
            <span className="text-5xl lg:text-6xl shrink-0">🟢</span>
            <div>
              <p className="text-[#4caf50] font-bold text-xl lg:text-2xl uppercase tracking-wider mb-1">Supply</p>
              <p className="text-gray-300 text-sm lg:text-lg">Earned by answering Contractor type answers (Economy type)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#f44336]/10 border-2 border-[#f44336]/30 rounded-xl p-4 md:p-6 hover:bg-[#f44336]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(244,67,54,0.2)] transition-all duration-300 cursor-pointer">
            <span className="text-5xl lg:text-6xl shrink-0">🔴</span>
            <div>
              <p className="text-[#f44336] font-bold text-xl lg:text-2xl uppercase tracking-wider mb-1">Firepower</p>
              <p className="text-gray-300 text-sm lg:text-lg">Earned by answering Hardliner type answers (Attack type)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#5AB4FF]/10 border-2 border-[#5AB4FF]/30 rounded-xl p-4 md:p-6 hover:bg-[#5AB4FF]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(90,180,255,0.2)] transition-all duration-300 cursor-pointer">
            <span className="text-5xl lg:text-6xl shrink-0">🔵</span>
            <div>
              <p className="text-[#5AB4FF] font-bold text-xl lg:text-2xl uppercase tracking-wider mb-1">Intel</p>
              <p className="text-gray-300 text-sm lg:text-lg">Earned by answering Operative type answers (Information type)</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#FFC734]/10 border-2 border-[#FFC734]/30 rounded-xl p-4 md:p-6 hover:bg-[#FFC734]/20 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,199,52,0.2)] transition-all duration-300 cursor-pointer">
            <span className="text-5xl lg:text-6xl shrink-0">🟡</span>
            <div>
              <p className="text-[#FFC734] font-bold text-xl lg:text-2xl uppercase tracking-wider mb-1">Morale</p>
              <p className="text-gray-300 text-sm lg:text-lg">Earned by answering Diplomat type answers (Defense type)</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'turn',
    title: 'YOUR TURN',
    icon: '📋',
    content: (
      <div className="h-full flex flex-col justify-center">
        <p className="text-gray-300 text-xl text-center mb-6 shrink-0">Each turn has 4 phases in order</p>

        <div className="flex flex-col gap-4 flex-1 min-h-0 justify-center">
          <div className="flex items-center gap-6 bg-[#4caf50]/10 border-2 border-[#4caf50]/30 rounded-xl p-4 lg:p-6 hover:translate-x-4 hover:bg-[#4caf50]/20 transition-all duration-300 cursor-pointer group">
            <span className="bg-[#4caf50] text-black font-bold w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-2xl shadow-[0_0_15px_#4caf50] group-hover:scale-110 transition-transform">1</span>
            <div>
              <p className="text-[#4caf50] font-bold text-xl lg:text-2xl uppercase mb-1">Situation Report</p>
              <p className="text-gray-300 text-base lg:text-lg">Answer a question card to gain resources + level up a commander</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-[#ff9800]/10 border-2 border-[#ff9800]/30 rounded-xl p-4 lg:p-6 hover:translate-x-4 hover:bg-[#ff9800]/20 transition-all duration-300 cursor-pointer group">
            <span className="bg-[#ff9800] text-black font-bold w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-2xl shadow-[0_0_15px_#ff9800] group-hover:scale-110 transition-transform">2</span>
            <div>
              <p className="text-[#ff9800] font-bold text-xl lg:text-2xl uppercase mb-1">Action Phase</p>
              <p className="text-gray-300 text-base lg:text-lg">Buy battalions, purchase Black Ops cards, use commander powers</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-[#03a9f4]/10 border-2 border-[#03a9f4]/30 rounded-xl p-4 lg:p-6 hover:translate-x-4 hover:bg-[#03a9f4]/20 transition-all duration-300 cursor-pointer group">
            <span className="bg-[#03a9f4] text-black font-bold w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-2xl shadow-[0_0_15px_#03a9f4] group-hover:scale-110 transition-transform">3</span>
            <div>
              <p className="text-[#03a9f4] font-bold text-xl lg:text-2xl uppercase mb-1">Deployment</p>
              <p className="text-gray-300 text-base lg:text-lg">Place all purchased battalions on the map in empty slots</p>
            </div>
          </div>

          <div className="flex items-center gap-6 bg-[#9c27b0]/10 border-2 border-[#9c27b0]/30 rounded-xl p-4 lg:p-6 hover:translate-x-4 hover:bg-[#9c27b0]/20 transition-all duration-300 cursor-pointer group">
            <span className="bg-[#9c27b0] text-black font-bold w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full text-2xl shadow-[0_0_15px_#9c27b0] group-hover:scale-110 transition-transform">4</span>
            <div>
              <p className="text-[#9c27b0] font-bold text-xl lg:text-2xl uppercase mb-1">Redeployment</p>
              <p className="text-gray-300 text-base lg:text-lg">Move unlocked units between adjacent sectors (optional)</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'movement',
    title: 'MOVEMENT RULES',
    icon: '🚀',
    content: (
      <div className="h-full flex flex-col gap-6">
        <p className="text-gray-300 text-xl text-center shrink-0">Strict rules govern how units can move</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="bg-black/40 border-l-4 border-[#4caf50] rounded-r-xl p-6 flex flex-col justify-center hover:bg-white/5 transition-colors group cursor-not-allowed">
            <p className="text-[#4caf50] font-bold text-2xl mb-2 flex items-center gap-3 group-hover:translate-x-2 transition-transform"><span className="text-3xl">📌</span> MAJORITY RULE</p>
            <p className="text-gray-300 text-lg">You can only move OUT of sectors you currently <span className="text-white font-bold">CONTROL</span> (&gt;50% occupancy).</p>
          </div>

          <div className="bg-black/40 border-l-4 border-[#ff9800] rounded-r-xl p-6 flex flex-col justify-center hover:bg-white/5 transition-colors group cursor-copy">
            <p className="text-[#ff9800] font-bold text-2xl mb-2 flex items-center gap-3 group-hover:translate-x-2 transition-transform"><span className="text-3xl">🔓</span> UNLOCKED RULE</p>
            <p className="text-gray-300 text-lg">Only <span className="text-white font-bold">EXTRA</span> units above the control threshold can move. Locked units stay put.</p>
          </div>

          <div className="bg-black/40 border-l-4 border-[#03a9f4] rounded-r-xl p-6 flex flex-col justify-center hover:bg-white/5 transition-colors group cursor-move">
            <p className="text-[#03a9f4] font-bold text-2xl mb-2 flex items-center gap-3 group-hover:translate-x-2 transition-transform"><span className="text-3xl">🔗</span> ADJACENCY RULE</p>
            <p className="text-gray-300 text-lg">Units can only move to <span className="text-white font-bold">CONNECTED</span> neighboring sectors.</p>
          </div>

          <div className="bg-black/40 border-l-4 border-[#f44336] rounded-r-xl p-6 flex flex-col justify-center hover:bg-white/5 transition-colors group cursor-crosshair">
            <p className="text-[#f44336] font-bold text-2xl mb-2 flex items-center gap-3 group-hover:translate-x-2 transition-transform"><span className="text-3xl">⚔️</span> HOSTILE RULE</p>
            <p className="text-gray-300 text-lg">You can move <span className="text-white font-bold">ANY</span> unlocked unit - even enemy units! Use this to evict squatters.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'commanders',
    title: 'COMMANDERS',
    icon: '⭐',
    content: (
      <div className="h-full flex flex-col gap-4">
        <p className="text-gray-300 text-xl text-center shrink-0">Level up 4 commander tracks for powerful abilities</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1 min-h-0">
          <div className="bg-[#4caf50]/10 border-2 border-[#4caf50]/30 rounded-xl p-5 lg:p-6 flex flex-col hover:bg-[#4caf50]/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(76,175,80,0.2)]">
            <p className="text-[#4caf50] font-bold text-2xl uppercase mb-3 border-b border-[#4caf50]/30 pb-2">🟢 Contractor</p>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 3:</span>
                <span className="text-white font-bold">Trade resources</span>
              </div>
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 5:</span>
                <span className="text-[#f44336] font-bold">Evict enemy unit</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f44336]/10 border-2 border-[#f44336]/30 rounded-xl p-5 lg:p-6 flex flex-col hover:bg-[#f44336]/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(244,67,54,0.2)]">
            <p className="text-[#f44336] font-bold text-2xl uppercase mb-3 border-b border-[#f44336]/30 pb-2">🔴 Hardliner</p>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 3:</span>
                <span className="text-white font-bold">Steal resources</span>
              </div>
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 5:</span>
                <span className="text-[#f44336] font-bold">Destroy unit</span>
              </div>
            </div>
          </div>

          <div className="bg-[#5AB4FF]/10 border-2 border-[#5AB4FF]/30 rounded-xl p-5 lg:p-6 flex flex-col hover:bg-[#5AB4FF]/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(90,180,255,0.2)]">
            <p className="text-[#5AB4FF] font-bold text-2xl uppercase mb-3 border-b border-[#5AB4FF]/30 pb-2">🔵 Operative</p>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 3:</span>
                <span className="text-white font-bold">+1 Free Battalion</span>
              </div>
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 5:</span>
                <span className="text-white font-bold">Move 2 units/sector</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFC734]/10 border-2 border-[#FFC734]/30 rounded-xl p-5 lg:p-6 flex flex-col hover:bg-[#FFC734]/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,199,52,0.2)]">
            <p className="text-[#FFC734] font-bold text-2xl uppercase mb-3 border-b border-[#FFC734]/30 pb-2">🟡 Diplomat</p>
            <div className="space-y-3 flex-1">
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 3:</span>
                <span className="text-white font-bold">Purchase discount</span>
              </div>
              <div className="flex justify-between items-center text-lg hover:text-white transition-colors cursor-pointer">
                <span className="text-gray-400">Level 5:</span>
                <span className="text-white font-bold">Convert enemies</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#4caf50]/10 border border-[#4caf50]/30 rounded-xl p-3 text-center mt-auto shrink-0 animate-pulse-slow">
          <p className="text-[#4caf50] text-lg font-bold">Tip: Level up by answering situation reports with matching colors!</p>
        </div>
      </div>
    ),
  },
  {
    id: 'blackops',
    title: 'BLACK OPS',
    icon: '🎴',
    content: (
      <div className="h-full flex flex-col gap-4">
        <p className="text-gray-300 text-xl text-center shrink-0">Secret cards that break the rules (Max 3 in hand)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 min-h-0 content-center">
          <div className="bg-black/40 border-2 border-[#f44336]/30 rounded-xl p-4 hover:border-[#f44336] hover:bg-[#f44336]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#f44336] font-bold text-lg mb-1">TACTICAL VETO</p>
            <p className="text-gray-400">Block a redeployment</p>
          </div>
          <div className="bg-black/40 border-2 border-[#f44336]/30 rounded-xl p-4 hover:border-[#f44336] hover:bg-[#f44336]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#f44336] font-bold text-lg mb-1">SURGICAL STRIKE</p>
            <p className="text-gray-400">Destroy an enemy unit</p>
          </div>
          <div className="bg-black/40 border-2 border-[#FFC734]/30 rounded-xl p-4 hover:border-[#FFC734] hover:bg-[#FFC734]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#FFC734] font-bold text-lg mb-1">ASSET SEIZURE</p>
            <p className="text-gray-400">Steal 2 resources of a type</p>
          </div>
          <div className="bg-black/40 border-2 border-[#FFC734]/30 rounded-xl p-4 hover:border-[#FFC734] hover:bg-[#FFC734]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#FFC734] font-bold text-lg mb-1">SABOTAGE</p>
            <p className="text-gray-400">All enemies lose 1 resource</p>
          </div>
          <div className="bg-black/40 border-2 border-[#5AB4FF]/30 rounded-xl p-4 hover:border-[#5AB4FF] hover:bg-[#5AB4FF]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#5AB4FF] font-bold text-lg mb-1">FORCE REDEPLOY</p>
            <p className="text-gray-400">Force-move enemy unit</p>
          </div>
          <div className="bg-black/40 border-2 border-[#4caf50]/30 rounded-xl p-4 hover:border-[#4caf50] hover:bg-[#4caf50]/10 transition-all duration-300 cursor-help hover:scale-105">
            <p className="text-[#4caf50] font-bold text-lg mb-1">INTEL SWEEP</p>
            <p className="text-gray-400">Gain 4 resources of each type</p>
          </div>
        </div>

        <div className="bg-[#f44336]/10 border border-[#f44336]/30 rounded-xl p-4 text-center mt-auto shrink-0 hover:bg-[#f44336]/20 transition-colors">
          <p className="text-[#f44336] text-lg font-bold">Purchase cards with resources to get tactical advantages!</p>
        </div>
      </div>
    ),
  },
  {
    id: 'tips',
    title: 'QUICK TIPS',
    icon: '💡',
    content: (
      <div className="h-full flex flex-col justify-center">
        <div className="flex flex-col gap-4 flex-1 min-h-0 justify-center">
          <div className="bg-[#4caf50]/10 border-l-8 border-[#4caf50] rounded-r-xl p-4 lg:p-6 flex items-center gap-4 lg:gap-6 hover:translate-x-3 hover:bg-[#4caf50]/20 transition-all duration-300 cursor-help group">
            <span className="text-4xl group-hover:scale-125 transition-transform shrink-0">🏔️</span>
            <p className="text-gray-300 text-lg lg:text-xl"><span className="text-[#4caf50] font-bold text-xl lg:text-2xl block mb-1">Rush Corners Early</span> They're easier to lock and give solid points.</p>
          </div>

          <div className="bg-[#ff9800]/10 border-l-8 border-[#ff9800] rounded-r-xl p-4 lg:p-6 flex items-center gap-4 lg:gap-6 hover:translate-x-3 hover:bg-[#ff9800]/20 transition-all duration-300 cursor-help group">
            <span className="text-4xl group-hover:scale-125 transition-transform shrink-0">🎯</span>
            <p className="text-gray-300 text-lg lg:text-xl"><span className="text-[#ff9800] font-bold text-xl lg:text-2xl block mb-1">Don't Spread Thin</span> Focus on securing sectors fully before expanding.</p>
          </div>

          <div className="bg-[#f44336]/10 border-l-8 border-[#f44336] rounded-r-xl p-4 lg:p-6 flex items-center gap-4 lg:gap-6 hover:translate-x-3 hover:bg-[#f44336]/20 transition-all duration-300 cursor-help group">
            <span className="text-4xl group-hover:scale-125 transition-transform shrink-0">⚡</span>
            <p className="text-gray-300 text-lg lg:text-xl"><span className="text-[#f44336] font-bold text-xl lg:text-2xl block mb-1">Beware Hot Zones</span> They are traps. Use them strategically - units can't leave!</p>
          </div>

          <div className="bg-[#9c27b0]/10 border-l-8 border-[#9c27b0] rounded-r-xl p-4 lg:p-6 flex items-center gap-4 lg:gap-6 hover:translate-x-3 hover:bg-[#9c27b0]/20 transition-all duration-300 cursor-help group">
            <span className="text-4xl group-hover:scale-125 transition-transform shrink-0">🎴</span>
            <p className="text-gray-300 text-lg lg:text-xl"><span className="text-[#9c27b0] font-bold text-xl lg:text-2xl block mb-1">Hold Black Ops</span> Save your cards to disrupt enemy locks at crucial moments.</p>
          </div>

          <div className="bg-[#03a9f4]/10 border-l-8 border-[#03a9f4] rounded-r-xl p-4 lg:p-6 flex items-center gap-4 lg:gap-6 hover:translate-x-3 hover:bg-[#03a9f4]/20 transition-all duration-300 cursor-help group">
            <span className="text-4xl group-hover:scale-125 transition-transform shrink-0">⭐</span>
            <p className="text-gray-300 text-lg lg:text-xl"><span className="text-[#03a9f4] font-bold text-xl lg:text-2xl block mb-1">Level Up Fast</span> Level 5 powers can turn the game around instantly!</p>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Tutorial({ onClose }: TutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      goNext();
    } else if (e.key === 'ArrowLeft') {
      goPrev();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 md:p-8 backdrop-blur-md"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="bg-[#0a0a0a] border-2 border-[#4caf50] rounded-xl max-w-7xl w-full h-[95vh] flex flex-col shadow-[0_0_100px_rgba(76,175,80,0.15)] font-mono relative overflow-hidden transition-all duration-500">

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[#4caf50]/30 bg-black/80 relative z-10 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(76,175,80,0.5)] animate-pulse">{slide.icon}</span>
            <h2 className="text-3xl font-bold text-[#4caf50] uppercase tracking-[0.2em] animate-pulse-slow">
              {slide.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#4caf50]/60 hover:text-[#f44336] text-4xl transition-colors font-bold transform hover:scale-110 active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b border-[#4caf50]/10 bg-black/40 relative z-10 shrink-0">
          <div className="flex gap-2 h-2">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`flex-1 rounded-full transition-all duration-300 cursor-pointer hover:h-3 ${index === currentSlide
                  ? 'bg-[#4caf50] shadow-[0_0_15px_#4caf50]'
                  : index < currentSlide
                    ? 'bg-[#4caf50]/40'
                    : 'bg-[#4caf50]/10 hover:bg-[#4caf50]/30'
                  }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
          <p className="text-right text-[#4caf50]/60 text-xs mt-2 uppercase tracking-wider font-bold">
            SECTION {currentSlide + 1} / {SLIDES.length}
          </p>
        </div>

        {/* Slide Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 bg-black/20 scrollbar-thin scrollbar-thumb-[#4caf50]/30 scrollbar-track-transparent">
          <div className="max-w-6xl mx-auto min-h-full flex flex-col">
            {slide.content}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-[#4caf50]/30 bg-black/80 relative z-10 shrink-0">
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className={`px-8 py-4 rounded-lg font-bold uppercase tracking-widest text-lg transition-all ${currentSlide === 0
              ? 'text-[#4caf50]/20 cursor-not-allowed border-2 border-[#4caf50]/10'
              : 'text-[#4caf50] border-2 border-[#4caf50]/50 hover:bg-[#4caf50]/10 hover:shadow-[0_0_20px_rgba(76,175,80,0.2)]'
              }`}
          >
            ← PREVIOUS
          </button>

          {/* Quick Nav Dots */}
          <div className="hidden lg:flex gap-3">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-3 h-3 rounded-full transition-all ${i === currentSlide
                  ? 'bg-[#4caf50] shadow-[0_0_10px_#4caf50] scale-150'
                  : 'bg-[#4caf50]/20 hover:bg-[#4caf50]/50 hover:scale-125'
                  }`}
                title={s.title}
              />
            ))}
          </div>

          {currentSlide === SLIDES.length - 1 ? (
            <button
              onClick={onClose}
              className="px-8 py-4 bg-[#f44336] text-black font-bold uppercase tracking-widest text-lg rounded-lg hover:bg-[#d32f2f] transition-all shadow-[0_0_30px_rgba(244,67,54,0.4)] animate-pulse hover:scale-105 transform"
            >
              DEPLOY TO BATTLE
            </button>
          ) : (
            <button
              onClick={goNext}
              className="px-8 py-4 bg-[#4caf50] text-black font-bold uppercase tracking-widest text-lg rounded-lg hover:bg-[#43a047] transition-all shadow-[0_0_30px_rgba(76,175,80,0.4)] hover:scale-105 transform"
            >
              NEXT BRIEFING →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
