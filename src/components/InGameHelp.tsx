import React, { useState } from 'react';
import { GamePhase, RESOURCE_COLORS, IDEOLOGY_COLORS, ResourceType, IdeologyType } from '@/types/game';
import { terminology, resourceNames, commanderNames } from '@/data/displayNames';

interface InGameHelpProps {
  currentPhase: GamePhase;
  isOpen: boolean;
  onToggle: () => void;
}

const phaseHelp: Record<GamePhase, { title: string; tips: string[] }> = {
  SETUP: {
    title: 'INITIALIZING',
    tips: ['System boot sequence...'],
  },
  RESOURCE_SELECTION: {
    title: 'RESOURCE ALLOCATION',
    tips: [
      'Each operative selects starting resources',
      'Operative 1: 4, Operative 2: 5, Operative 3: 6, etc.',
      'Compensates for turn order advantage',
      `Allocate ${resourceNames.funds}, ${resourceNames.clout}, ${resourceNames.media}, or ${resourceNames.trust}`,
    ],
  },
  FIRST_PLAYER_SELECTION: {
    title: 'PRIORITY DESIGNATION',
    tips: [
      'Determine command priority',
      '3+ operatives: Vote for first commander',
      '2 operatives: Bid resources - highest wins',
      'Ties trigger re-selection',
    ],
  },
  PLACE_EVICTED: {
    title: 'EVICTED UNIT REDEPLOYMENT',
    tips: [
      'Battalions were evicted by Supply Blockade',
      'Redeploy them to available sectors',
      'Hot zones trigger flashpoint events',
    ],
  },
  ANSWERING: {
    title: 'SITUATION REPORT RESPONSE',
    tips: [
      'Evaluate the tactical scenario',
      'Select response aligned with your doctrine',
      'Each response grants resources + commander track progress',
      '4 resources to request new intel',
      'Level 3/5 unlocks commander powers',
    ],
  },
  ACTION: {
    title: 'ACTION PHASE',
    tips: [
      'Requisition deployment orders',
      'Acquire Black Ops cards',
      'Activate commander powers',
      'Deploy Black Ops from inventory',
      'Multiple acquisitions permitted',
    ],
  },
  DEPLOYMENT: {
    title: 'DEPLOYMENT PHASE',
    tips: [
      'Position battalions from reserve',
      'Select empty slots in any sector',
      'Secure control with majority presence',
      'Hot zone deployment triggers flashpoints',
    ],
  },
  REDEPLOYMENT: {
    title: 'REDEPLOYMENT PHASE',
    tips: [
      'Transfer battalions between adjacent sectors',
      'Requires majority presence in source/dest sector',
      'Tied sectors: no redeployment rights',
      'Can move ANY operative\'s battalions',
      'Cannot move from hot zones or control positions',
    ],
  },
  LAST_TURN: {
    title: 'FINAL OPS',
    tips: [
      'Map at capacity - no control achieved',
      'Final opportunity for each operative',
      'Execute critical maneuvers',
    ],
  },
  END_TURN: {
    title: 'TURN COMPLETE',
    tips: ['Transferring command...'],
  },
  GAME_OVER: {
    title: 'OPERATION COMPLETE',
    tips: [
      'Ceasefire achieved',
      'Victory: Total battalions in controlled sectors',
      'Only control battalions count for scoring',
    ],
  },
};

const quickReference = {
  resources: [
    { name: resourceNames.funds, key: 'funds' as ResourceType, icon: '◆', desc: 'Logistics & economics' },
    { name: resourceNames.clout, key: 'clout' as ResourceType, icon: '◈', desc: 'Direct force projection' },
    { name: resourceNames.media, key: 'media' as ResourceType, icon: '◇', desc: 'Intelligence ops' },
    { name: resourceNames.trust, key: 'trust' as ResourceType, icon: '○', desc: 'Hearts & minds' },
  ],
  ideologies: [
    { name: commanderNames.capitalist, key: 'capitalist' as IdeologyType, power3: 'No-Bid Contract', power5: 'Supply Blockade' },
    { name: commanderNames.supremo, key: 'supremo' as IdeologyType, power3: 'Commandeer', power5: 'Kinetic Strike' },
    { name: commanderNames.showstopper, key: 'showstopper' as IdeologyType, power3: 'Phantom Unit', power5: 'Rapid Redeploy' },
    { name: commanderNames.idealist, key: 'idealist' as IdeologyType, power3: 'Local Coalition', power5: 'Defection' },
  ],
};

export default function InGameHelp({ currentPhase, isOpen, onToggle }: InGameHelpProps) {
  const [tab, setTab] = useState<'phase' | 'resources' | 'powers'>('phase');

  const currentHelp = phaseHelp[currentPhase];

  return (
    <>
      {/* Help Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg
          flex items-center justify-center text-xl font-bold font-mono
          transition-all duration-200 border-2
          ${isOpen
            ? 'bg-[#f44336] border-[#f44336] text-[#0a0a0a]'
            : 'bg-[#0a0a0a] border-[#4caf50] text-[#4caf50] hover:bg-[#4caf50]/20 animate-pulse'
          }
        `}
        style={{ boxShadow: isOpen ? '0 0 20px rgba(244,67,54,0.5)' : '0 0 20px rgba(76,175,80,0.3)' }}
        title={isOpen ? 'Close Intel' : 'Open Intel'}
      >
        {isOpen ? '×' : '?'}
      </button>

      {/* Help Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-h-[60vh] bg-[#0a0a0a] border-2 border-[#4caf50] rounded font-mono shadow-2xl overflow-hidden" style={{ boxShadow: '0 0 30px rgba(76,175,80,0.2)' }}>
          {/* Corner brackets */}
          <div className="absolute top-1 left-1 w-4 h-4 border-t-2 border-l-2 border-[#4caf50]/50 pointer-events-none" />
          <div className="absolute top-1 right-1 w-4 h-4 border-t-2 border-r-2 border-[#4caf50]/50 pointer-events-none" />

          {/* Tabs */}
          <div className="flex border-b border-[#4caf50]/30">
            {[
              { key: 'phase', label: 'PHASE' },
              { key: 'resources', label: 'RES' },
              { key: 'powers', label: 'CMDR' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as 'phase' | 'resources' | 'powers')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${tab === t.key
                  ? 'bg-[#4caf50] text-[#0a0a0a]'
                  : 'bg-[#0a0a0a] text-[#4caf50]/60 hover:text-[#4caf50]'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-3 overflow-y-auto max-h-[calc(60vh-40px)]">
            {tab === 'phase' && (
              <div>
                <h3 className="text-sm font-bold text-[#4caf50] mb-3 uppercase tracking-widest" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
                  {currentHelp.title}
                </h3>
                <ul className="space-y-2">
                  {currentHelp.tips.map((tip, i) => (
                    <li key={i} className="text-[10px] text-[#4caf50]/80 flex items-start gap-2">
                      <span className="text-[#4caf50] mt-0.5">▶</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-[#4caf50]/20">
                  <p className="text-[9px] text-[#4caf50]/70 mb-2 uppercase tracking-wider">Phase Sequence:</p>
                  <div className="flex flex-wrap gap-1">
                    {(['ANSWERING', 'ACTION', 'DEPLOYMENT', 'REDEPLOYMENT'] as GamePhase[]).map(phase => (
                      <span
                        key={phase}
                        className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider ${phase === currentPhase
                          ? 'bg-[#4caf50] text-[#0a0a0a] font-bold'
                          : 'border border-[#4caf50]/30 text-[#4caf50]/70'
                          }`}
                      >
                        {phase.slice(0, 4)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'resources' && (
              <div>
                <h3 className="text-sm font-bold text-[#4caf50] mb-3 uppercase tracking-widest" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
                  RESOURCES
                </h3>
                <div className="space-y-2">
                  {quickReference.resources.map(res => (
                    <div key={res.name} className="flex items-center gap-2 p-2 rounded border border-[#4caf50]/20 bg-black/30">
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: RESOURCE_COLORS[res.key], color: '#0a0a0a' }}
                      >
                        {res.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: RESOURCE_COLORS[res.key] }}>{res.name}</p>
                        <p className="text-[9px] text-[#4caf50]/80">{res.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-[#4caf50]/20">
                  <p className="text-[9px] text-[#f44336]">
                    ⚠ Maximum 12 total resources
                  </p>
                </div>
              </div>
            )}

            {tab === 'powers' && (
              <div>
                <h3 className="text-sm font-bold text-[#4caf50] mb-3 uppercase tracking-widest" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
                  COMMANDER POWERS
                </h3>
                <p className="text-[9px] text-[#4caf50]/80 mb-3">
                  L2: Passive bonus per answer | L3/L5: Active abilities
                </p>
                <div className="space-y-2">
                  {quickReference.ideologies.map(ideology => (
                    <div
                      key={ideology.name}
                      className="p-2 rounded border"
                      style={{ borderColor: `${IDEOLOGY_COLORS[ideology.key]}40`, backgroundColor: `${IDEOLOGY_COLORS[ideology.key]}10` }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: IDEOLOGY_COLORS[ideology.key], boxShadow: `0 0 6px ${IDEOLOGY_COLORS[ideology.key]}` }}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: IDEOLOGY_COLORS[ideology.key] }}>{ideology.name}</span>
                      </div>
                      <div className="text-[9px] text-[#4caf50]/60 ml-5 space-y-0.5">
                        <p>L3: {ideology.power3}</p>
                        <p>L5: {ideology.power5}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
