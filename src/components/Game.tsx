'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GameState, GameAction, ResourceType, Resources } from '@/types/game';
import { useGameState } from '@/lib/GameContext';
import { calculateZoneMajority, canRedeploy, getTotalResources, getRedeploymentRightsHolder } from '@/lib/gameEngine';
import { hasUnlockedPower } from '@/data/powers';
import GameBoard from './GameBoard';
import PlayerHUD, { CockpitDashboard, SidebarAgentCard } from './PlayerHUD';
import IdeologyCard from './IdeologyCard';
import DeploymentShop from './DeploymentShop';
import PhaseIndicator from './PhaseIndicator';
import GameLog from './GameLog';
import GameOverScreen from './GameOverScreen';
import SetupScreen from './SetupScreen';
import LandingPage from './LandingPage';
import MultiplayerGame from './MultiplayerGame';
import ConspiracyCardShop from './ConspiracyCardShop';
import HeadlineDisplay from './HeadlineDisplay';
import PowersPanel from './PowersPanel';
import InGameHelp from './InGameHelp';
import PlayerTradingPanel from './PlayerTradingPanel';
import FirstPlayerSelectionScreen from './FirstPlayerSelectionScreen';
import ResourceSelectionScreen from './ResourceSelectionScreen';
import ResourceGainDisplay from './ResourceGainDisplay';
import PhoneBlocker from './PhoneBlocker';
import MissionBriefing from './MissionBriefing';
import GerrymanderPanel from './GerrymanderPanel';
import { playSound, startBGM } from '@/lib/SoundManager';

type GameMode = 'lobby' | 'local' | 'online';

interface OnlineSession {
  roomId: string;
  playerId: string;
  playerName: string;
}

export default function Game() {
  const [mode, setMode] = useState<GameMode>('lobby');
  const [onlineSession, setOnlineSession] = useState<OnlineSession | null>(null);

  // Local game state
  const { state, dispatch, startGame, isInitialized } = useGameState();
  const [selectedSlot, setSelectedSlot] = useState<{
    zoneId: string;
    slotIndex: number;
  } | null>(null);
  const [redeploymentSource, setRedeploymentSource] = useState<{
    zoneId: string;
    slotIndex: number;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showHeadline, setShowHeadline] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true); // Show mission briefing on game start
  const [showGameLog, setShowGameLog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBlackOpsAlert, setShowBlackOpsAlert] = useState(false);

  // Auto-dismiss Black Ops alert after 5 seconds
  useEffect(() => {
    if (state?.lastBlackOpsPlayed) {
      setShowBlackOpsAlert(true);
      const timer = setTimeout(() => {
        setShowBlackOpsAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state?.lastBlackOpsPlayed?.timestamp]);

  const handleJoinRoom = useCallback((roomId: string, playerId: string, playerName: string) => {
    setOnlineSession({ roomId, playerId, playerName });
    setMode('online');
  }, []);

  const handlePlayLocal = useCallback(() => {
    setMode('local');
  }, []);

  const handleLeaveOnline = useCallback(() => {
    setOnlineSession(null);
    setMode('lobby');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setMode('lobby');
  }, []);

  // Local game handlers
  const handleSlotClick = useCallback(
    (zoneId: string, slotIndex: number) => {
      if (!state) return;

      const zone = state.zones[zoneId];
      const player = state.players[state.activePlayerId];

      // Handle placing evicted Battalions
      if (state.phase === 'PLACE_EVICTED' && player.evictedBattalions > 0) {
        if (zone.slots[slotIndex] === null) {
          dispatch({ type: 'PLACE_EVICTED_BATTALION', zoneId, slotIndex });
        }
        return;
      }

      if (state.phase === 'DEPLOYMENT' && player.battalionReserve > 0) {
        if (zone.slots[slotIndex] === null) {
          // Check if we had majority before placing
          const hadMajorityBefore = zone.majorityOwner === state.activePlayerId;

          dispatch({ type: 'PLACE_BATTALION', zoneId, slotIndex });
          playSound('deploy_troop');

          // Check if we just gained majority
          const playersInZone: Record<string, number> = {};
          zone.slots.forEach(pid => {
            if (pid) playersInZone[pid] = (playersInZone[pid] || 0) + 1;
          });
          playersInZone[state.activePlayerId] = (playersInZone[state.activePlayerId] || 0) + 1;
          const ourCount = playersInZone[state.activePlayerId] || 0;
          if (!hadMajorityBefore && ourCount >= zone.majorityRequired) {
            setTimeout(() => playSound('success_chime'), 300);
          }
        }
        return;
      }

      if (state.phase === 'REDEPLOYMENT') {
        if (!redeploymentSource) {
          // Allow selecting any non-volatile, non-locked battalion as source
          // Validation of rights happens when destination is selected
          if (zone.slots[slotIndex] !== null &&
            !zone.volatileSlots.includes(slotIndex) &&
            !zone.lockedSlots[slotIndex]) {
            setRedeploymentSource({ zoneId, slotIndex });
          }
        } else {
          // Source is selected
          const isSameSlot = redeploymentSource.zoneId === zoneId && redeploymentSource.slotIndex === slotIndex;

          if (isSameSlot) {
            // Clicking same slot cancels selection
            setRedeploymentSource(null);
          } else if (zone.slots[slotIndex] === null) {
            // Clicking empty slot - try to move battalion there
            const validation = canRedeploy(
              state,
              state.activePlayerId,
              redeploymentSource.zoneId,
              zoneId,
              redeploymentSource.slotIndex,
              slotIndex
            );
            if (validation.valid) {
              dispatch({
                type: 'REDEPLOYMENT',
                fromZone: redeploymentSource.zoneId,
                toZone: zoneId,
                fromSlot: redeploymentSource.slotIndex,
                toSlot: slotIndex,
              });
              playSound('redeploy_move');
              setRedeploymentSource(null);
            } else {
              // Show error feedback like multiplayer
              playSound('alert_error');
              setErrorMessage(validation.reason || 'Invalid move');
              setTimeout(() => setErrorMessage(null), 3000);
              setRedeploymentSource(null);
            }
          } else {
            // Clicking another occupied slot - switch to that as source
            if (!zone.volatileSlots.includes(slotIndex) && !zone.lockedSlots[slotIndex]) {
              setRedeploymentSource({ zoneId, slotIndex });
            } else {
              setRedeploymentSource(null);
            }
          }
        }
      }
    },
    [state, dispatch, redeploymentSource]
  );

  const handleAnswer = useCallback(
    (choice: 'A' | 'B') => {
      dispatch({ type: 'ANSWER_IDEOLOGY_CARD', choice });
    },
    [dispatch]
  );

  const handleRedraw = useCallback(() => {
    dispatch({ type: 'REDRAW_IDEOLOGY_CARD' });
  }, [dispatch]);

  const handleBuyVoter = useCallback(
    (cardId: string, useGoingViral?: boolean, useHelpingHands?: boolean) => {
      dispatch({ type: 'BUY_DEPLOYMENT_ORDER', cardId, useGoingViral, useHelpingHands });
    },
    [dispatch]
  );

  const handleBuyConspiracy = useCallback(
    (cardId: string) => {
      dispatch({ type: 'BUY_CONSPIRACY_CARD', cardId });
    },
    [dispatch]
  );

  const handlePlayConspiracy = useCallback(
    (cardId: string, targetPlayerId?: string, targetResource?: ResourceType, targetZoneId?: string, targetSlotIndex?: number, targetZoneId2?: string, targetSlotIndex2?: number) => {
      dispatch({
        type: 'PLAY_CONSPIRACY_CARD',
        cardId,
        targetPlayerId,
        targetResource,
        targetZoneId,
        targetSlotIndex,
        targetZoneId2,
        targetSlotIndex2,
      });
    },
    [dispatch]
  );

  const handleUseProspecting = useCallback(
    (giveResource: ResourceType, getResources: ResourceType[]) => {
      dispatch({ type: 'USE_PROSPECTING', giveResource, getResources });
    },
    [dispatch]
  );

  const handleUseLandGrab = useCallback(
    (zoneId: string, slotIndex: number) => {
      dispatch({ type: 'USE_LAND_GRAB', zoneId, slotIndex });
    },
    [dispatch]
  );

  const handleUseDonations = useCallback(
    (targetPlayerId: string, resource: ResourceType) => {
      dispatch({ type: 'USE_DONATIONS', targetPlayerId, resource });
    },
    [dispatch]
  );

  const handleUsePayback = useCallback(
    (zoneId: string, slotIndex: number, payResource: ResourceType) => {
      dispatch({ type: 'USE_PAYBACK', zoneId, slotIndex, payResource });
    },
    [dispatch]
  );

  const handleUseToughLove = useCallback(
    (zoneId: string, slotIndices: [number, number], targetPlayerId: string, payResources: ResourceType[]) => {
      dispatch({ type: 'USE_TOUGH_LOVE', zoneId, slotIndices, targetPlayerId, payResources });
    },
    [dispatch]
  );

  const handleClearHeadline = useCallback(() => {
    dispatch({ type: 'CLEAR_HEADLINE' });
  }, [dispatch]);

  const handleProposeTrade = useCallback(
    (toPlayerId: string, offering: Partial<Resources>, requesting: Partial<Resources>) => {
      dispatch({ type: 'PROPOSE_TRADE', toPlayerId, offering, requesting });
    },
    [dispatch]
  );

  const handleAcceptTrade = useCallback(() => {
    dispatch({ type: 'ACCEPT_TRADE' });
  }, [dispatch]);

  const handleRejectTrade = useCallback(() => {
    dispatch({ type: 'REJECT_TRADE' });
  }, [dispatch]);

  const handleCancelTrade = useCallback(() => {
    dispatch({ type: 'CANCEL_TRADE' });
  }, [dispatch]);

  const handleVoteFirstPlayer = useCallback(
    (voterId: string, voteForId: string) => {
      dispatch({ type: 'VOTE_FIRST_PLAYER', voterId, voteForId });
    },
    [dispatch]
  );

  const handleBidFirstPlayer = useCallback(
    (bidderId: string, bid: Partial<Resources>) => {
      dispatch({ type: 'BID_FIRST_PLAYER', bidderId, bid });
    },
    [dispatch]
  );

  const handleClearResourceGain = useCallback(() => {
    dispatch({ type: 'CLEAR_RESOURCE_GAIN' });
  }, [dispatch]);

  const handleSelectStartingResources = useCallback(
    (playerId: string, resources: Partial<Resources>) => {
      dispatch({ type: 'SELECT_STARTING_RESOURCES', playerId, resources });
    },
    [dispatch]
  );

  const handleEndActionPhase = useCallback(() => {
    dispatch({ type: 'END_ACTION_PHASE' });
  }, [dispatch]);

  const handleEndTurn = useCallback(() => {
    dispatch({ type: 'END_TURN' });
    setRedeploymentSource(null);
  }, [dispatch]);

  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  // Show lobby
  if (mode === 'lobby') {
    return <LandingPage onJoinRoom={handleJoinRoom} onPlayLocal={handlePlayLocal} />;
  }

  // Show online multiplayer
  if (mode === 'online' && onlineSession) {
    return (
      <MultiplayerGame
        roomId={onlineSession.roomId}
        playerId={onlineSession.playerId}
        playerName={onlineSession.playerName}
        onLeave={handleLeaveOnline}
      />
    );
  }

  // Local game - show setup screen if not initialized
  if (mode === 'local' && (!isInitialized || !state)) {
    return (
      <SetupScreen onStart={startGame} onBack={handleBackToLobby} />
    );
  }

  // Local game active
  if (!state) return null;

  // Show mission briefing before first phase
  if (showBriefing) {
    return (
      <MissionBriefing onComplete={() => {
        setShowBriefing(false);
        startBGM();
      }} />
    );
  }

  // Show resource selection screen (3+ players)
  if (state.phase === 'RESOURCE_SELECTION') {
    return (
      <div>
        <button
          onClick={handleBackToLobby}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          ← Back
        </button>
        <ResourceSelectionScreen
          state={state}
          onSelectResources={handleSelectStartingResources}
        />
      </div>
    );
  }

  // Show first player selection screen
  if (state.phase === 'FIRST_PLAYER_SELECTION') {
    return (
      <div>
        <button
          onClick={handleBackToLobby}
          className="fixed top-4 left-4 z-50 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          ← Back
        </button>
        <FirstPlayerSelectionScreen
          state={state}
          onVote={handleVoteFirstPlayer}
          onBid={handleBidFirstPlayer}
        />
      </div>
    );
  }

  // Show game over screen
  if (state.phase === 'GAME_OVER') {
    return <GameOverScreen state={state} onPlayAgain={handlePlayAgain} />;
  }

  const activePlayer = state.players[state.activePlayerId];

  const highlightedZones =
    state.phase === 'REDEPLOYMENT' && redeploymentSource
      ? state.zones[redeploymentSource.zoneId]?.adjacentZones || []
      : [];

  const canRedrawCard = getTotalResources(activePlayer.resources) >= 4;

  // Calculate redeployment info for display
  const getRedeploymentInfo = () => {
    let zonesWithRights = 0;
    const zoneNames: string[] = [];
    for (const zone of Object.values(state.zones)) {
      if (getRedeploymentRightsHolder(zone, state.players) === state.activePlayerId) {
        zonesWithRights++;
        zoneNames.push(zone.name);
      }
    }
    const hasShowstopperL5 = hasUnlockedPower(activePlayer.ideologyTracks, 'showstopper', 5);
    const movesPerZone = hasShowstopperL5 ? 2 : 1;
    const maxMoves = zonesWithRights * movesPerZone;
    const usedMoves = state.powerUsage.redeploymentUsed;
    const remainingMoves = maxMoves - usedMoves;
    return { zonesWithRights, zoneNames, movesPerZone, maxMoves, usedMoves, remainingMoves, hasShowstopperL5 };
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a08] text-white">
      {/* Military Corner Brackets - Match LandingPage */}
      <div className="fixed inset-0 z-[5] pointer-events-none">
        <div className="absolute top-2 left-2 w-16 h-16 border-l-2 border-t-2 border-[#4caf50]/50" />
        <div className="absolute top-2 right-2 w-16 h-16 border-r-2 border-t-2 border-[#4caf50]/50" />
        <div className="absolute bottom-2 left-2 w-16 h-16 border-l-2 border-b-2 border-[#4caf50]/50" />
        <div className="absolute bottom-2 right-2 w-16 h-16 border-r-2 border-b-2 border-[#4caf50]/50" />
      </div>

      {/* Scanline Effect */}
      <div className="fixed inset-0 z-[4] pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(76,175,80,0.1) 2px, rgba(76,175,80,0.1) 4px)',
      }} />

      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[3]" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)'
      }} />

      {/* Phone Blocker */}
      <PhoneBlocker />

      {/* Headline Display */}
      <HeadlineDisplay
        headline={state.currentHeadlineCard}
        onDismiss={handleClearHeadline}
      />

      {/* Resource Gain Display */}
      <ResourceGainDisplay
        gain={state.lastResourceGain}
        onDismiss={handleClearResourceGain}
      />

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-[#f44336] text-white px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(244,67,54,0.5)] font-mono uppercase tracking-wider text-sm animate-pulse">
          <span className="mr-2">⚠</span> {errorMessage}
        </div>
      )}

      {/* Black Ops Notification Toast */}
      {showBlackOpsAlert && state.lastBlackOpsPlayed && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.6)] border-2 border-[#dc2626] font-mono animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-[#dc2626] font-bold uppercase tracking-widest text-xs mb-1">BLACK OPS ALERT</div>
              <div className="text-lg font-bold">
                <span className="text-[#fbbf24]">{state.lastBlackOpsPlayed.playerName}</span>
                <span className="text-gray-300"> used </span>
                <span className="text-[#f87171]">{state.lastBlackOpsPlayed.cardName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-Game Help */}
      <InGameHelp
        currentPhase={state.phase}
        isOpen={showHelp}
        onToggle={() => setShowHelp(!showHelp)}
      />

      {/* Main Layout - Responsive for all screens */}
      <div className="flex h-screen">
        {/* Left Sidebar - Hidden on mobile */}
        <div
          className={`hidden md:block ${isSidebarOpen ? 'w-64 lg:w-80' : 'w-0'} bg-black/80 backdrop-blur-sm border-r border-[#4caf50]/30 flex-shrink-0 transition-all duration-300 relative z-10`}
        >
          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0a0a0a] border border-[#4caf50]/40 rounded-r flex items-center justify-center cursor-pointer hover:bg-[#4caf50]/20 z-50 shadow-lg"
          >
            <span className="text-[#4caf50] transform scale-y-150">{isSidebarOpen ? '‹' : '›'}</span>
          </button>

          <div className={`h-full overflow-y-auto p-4 ${!isSidebarOpen && 'invisible'}`}>
            {/* Exit Button - Fixed position in sidebar header */}
            <button
              onClick={() => {
                if (confirm('Are you sure you want to exit the game?')) {
                  handleBackToLobby();
                }
              }}
              className="mb-3 px-3 py-1 bg-[#f44336]/80 hover:bg-[#f44336] text-white rounded text-xs font-mono uppercase tracking-wider transition-all"
            >
              EXIT ⏻
            </button>
            <h2 className="text-lg font-bold mb-4 text-[#4caf50] uppercase tracking-widest glow-green font-mono">AGENTS</h2>
            <div className="space-y-3 pb-4">
              {Object.values(state.players).map(player => (
                <SidebarAgentCard
                  key={player.id}
                  player={player}
                  isActive={player.id === state.activePlayerId}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Game Area - Board (Center Column) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          <div className="px-3 py-2 bg-black/80 backdrop-blur-sm border-b border-[#4caf50]/30 shrink-0 flex justify-between items-center z-20 relative">
            <PhaseIndicator
              phase={state.phase}
              turnNumber={state.turnNumber}
              activePlayerName={activePlayer.name}
              battalionCount={activePlayer.battalionReserve}
              evictedCount={activePlayer.evictedBattalions}
            />
            {/* Help Button */}
            <button
              onClick={() => setShowHelp(true)}
              className="mr-4 px-3 py-1 bg-[#0a0a0a] hover:bg-[#4caf50]/20 border border-[#4caf50]/40 rounded text-[10px] font-mono uppercase tracking-wider text-[#4caf50] transition-colors"
            >
              [ SYSTEM MANUAL ]
            </button>
          </div>

          {/* Center Pane: Game Board + Popups */}
          <div className="flex-1 relative overflow-hidden z-0">

            {/* The Game Board - Full Size (Base Layer) */}
            <div className="absolute inset-0 z-10">
              <GameBoard
                state={state}
                onSlotClick={handleSlotClick}
                selectedSlot={selectedSlot}
                highlightedZones={highlightedZones}
              />
            </div>


            {/* Center Modal Layer - For question card only */}
            {state.phase === 'ANSWERING' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-8">
                <div className="pointer-events-auto animate-fade-in shadow-2xl rounded-xl w-full max-w-lg">
                  {state.currentIdeologyCard ? (
                    <IdeologyCard
                      card={state.currentIdeologyCard}
                      onAnswer={handleAnswer}
                      onRedraw={handleRedraw}
                      canRedraw={canRedrawCard}
                    />
                  ) : (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-600 shadow-xl">
                      <p className="text-gray-400 italic">Waiting for question...</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Action Center */}
        <div className="hidden sm:flex w-48 md:w-64 lg:w-80 bg-black/80 backdrop-blur-sm border-l-2 border-[#4caf50]/50 flex-col flex-shrink-0 z-20 shadow-[0_0_20px_rgba(76,175,80,0.1)] relative font-mono">

          {/* Header with Game Log Toggle */}
          <div className="px-3 py-2 bg-black/60 border-b border-[#4caf50]/30 flex justify-between items-center shrink-0">
            <span className="font-bold text-[#4caf50] uppercase tracking-widest text-xs" style={{ textShadow: '0 0 8px rgba(76,175,80,0.5)' }}>
              {showGameLog ? 'COMMS LOG' : 'ACTIONS'}
            </span>

            <div className="flex items-center gap-2">
              {/* Game Log Toggle */}
              <button
                onClick={() => setShowGameLog(!showGameLog)}
                className={`p-1.5 rounded transition-colors ${showGameLog ? 'bg-[#4caf50] text-[#0a0a0a]' : 'hover:bg-[#4caf50]/20 text-[#4caf50]/60 hover:text-[#4caf50]'}`}
                title={showGameLog ? "Back to Actions" : "View Comms Log"}
              >
                <span className="text-lg">📡</span>
              </button>
            </div>
          </div>

          {/* Active Actions Area or Game Log */}
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {showGameLog ? (
              <GameLog entries={state.gameLog} players={state.players} />
            ) : (
              <div className="p-4 space-y-6">
                {/* Deployment Shop */}
                {state.phase !== 'REDEPLOYMENT' && (
                  <div className="animate-fade-in">
                    <DeploymentShop
                      market={state.deploymentShop}
                      playerResources={activePlayer.resources}
                      playerIdeologyTracks={activePlayer.ideologyTracks}
                      powerUsage={state.powerUsage}
                      onBuy={handleBuyVoter}
                      disabled={state.phase !== 'ACTION'}
                    />
                    {state.phase === 'ACTION' && (
                      <button
                        onClick={handleEndActionPhase}
                        className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-98 transition-all"
                      >
                        End Action Phase
                      </button>
                    )}
                  </div>
                )}

                {/* Gerrymander Panel (Redeployment) */}
                {state.phase === 'REDEPLOYMENT' && (
                  <GerrymanderPanel
                    state={state}
                    activePlayer={activePlayer}
                    isMyTurn={true}
                    onEndTurn={handleEndTurn}
                    redeploySource={redeploymentSource}
                  />
                )}

                {/* Powers Panel */}
                {state.phase !== 'REDEPLOYMENT' && (
                  <PowersPanel
                    player={activePlayer}
                    powerUsage={state.powerUsage}
                    players={state.players}
                    zones={state.zones}
                    onUseProspecting={handleUseProspecting}
                    onUseLandGrab={handleUseLandGrab}
                    onUseDonations={handleUseDonations}
                    onUsePayback={handleUsePayback}
                    onUseToughLove={handleUseToughLove}
                    disabled={state.phase !== 'ACTION'}
                  />
                )}

                {/* Conspiracy Shop */}
                {state.phase !== 'REDEPLOYMENT' && (
                  <div className="animate-fade-in pt-4 border-t border-gray-800">
                    <h3 className="text-xs text-[#f44336] uppercase tracking-widest font-bold mb-3" style={{ textShadow: '0 0 8px rgba(244,67,54,0.5)' }}>BLACK OPS</h3>
                    <ConspiracyCardShop
                      playerResources={activePlayer.resources}
                      playerCards={activePlayer.conspiracyCards}
                      players={state.players}
                      zones={state.zones}
                      activePlayerId={state.activePlayerId}
                      onBuyCard={handleBuyConspiracy}
                      onPlayCard={handlePlayConspiracy}
                      disabled={state.phase !== 'ACTION'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
