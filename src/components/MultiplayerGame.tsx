'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, GameAction, Player, ResourceType, Resources, PLAYER_COLORS } from '@/types/game';
import { useMultiplayer } from '@/lib/useMultiplayer';
import {
  initializeGame,
  drawIdeologyCard,
  redrawIdeologyCard,
  answerIdeologyCard,
  buyDeploymentOrder,
  buyDeploymentOrderWithPowers,
  placeBattalion,
  placeEvictedBattalion,
  executeRedeployment,
  endActionPhase,
  endDeployment,
  endTurn,
  endPlaceEvictedPhase,
  buyConspiracyCard,
  playConspiracyCard,
  useProspecting,
  useLandGrab,
  useDonations,
  usePayback,
  useToughLove,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  clearHeadline,
  clearResourceGain,
  selectStartingResources,
  voteFirstPlayer,
  bidFirstPlayer,
  calculateZoneMajority,
  canRedeploy,
  getTotalResources,
  getRedeploymentRightsHolder,
  removePlayer,
} from '@/lib/gameEngine';
import { generateDeploymentOrder } from '@/data/deploymentOrders';
import { hasUnlockedPower } from '@/data/powers';
import GameBoard from './GameBoard';

import PlayerHUD, { CockpitDashboard, TacticalRoster, SidebarAgentCard } from './PlayerHUD';
import IdeologyCard from './IdeologyCard';
import DeploymentShop from './DeploymentShop';
import PhaseIndicator from './PhaseIndicator';
import GameLog from './GameLog';
import GameOverScreen from './GameOverScreen';
import WaitingRoom from './WaitingRoom';
import ConspiracyCardShop from './ConspiracyCardShop';
import HeadlineDisplay from './HeadlineDisplay';
import ResourceGainDisplay from './ResourceGainDisplay';
import PowersPanel from './PowersPanel';
import PlayerTradingPanel from './PlayerTradingPanel';
import ResourceSelectionScreen from './ResourceSelectionScreen';
import FirstPlayerSelectionScreen from './FirstPlayerSelectionScreen';
import InGameHelp from './InGameHelp';
import GerrymanderPanel from './GerrymanderPanel';
import PhoneBlocker from './PhoneBlocker';
import MissionBriefing from './MissionBriefing';
import { playSound, startBGM } from '@/lib/SoundManager';
import { terminology } from '@/data/displayNames';

interface PlayerInfo {
  id: string;
  name: string;
  connectionId: string;
  isHost: boolean;
  isReady: boolean;
}

interface MultiplayerGameProps {
  roomId: string;
  playerId: string;
  playerName: string;
  onLeave: () => void;
}

export default function MultiplayerGame({
  roomId,
  playerId,
  playerName,
  onLeave,
}: MultiplayerGameProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gamePlayerId, setGamePlayerId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ zoneId: string; slotIndex: number } | null>(null);
  const [redeploySource, setRedeploySource] = useState<{ zoneId: string; slotIndex: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showGameLog, setShowGameLog] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBriefing, setShowBriefing] = useState(true); // Show mission briefing when game starts
  const [showBlackOpsAlert, setShowBlackOpsAlert] = useState(false);

  // Auto-dismiss Black Ops alert after 5 seconds
  useEffect(() => {
    if (gameState?.lastBlackOpsPlayed) {
      setShowBlackOpsAlert(true);
      const timer = setTimeout(() => {
        setShowBlackOpsAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.lastBlackOpsPlayed?.timestamp]);

  const isHostRef = useRef(false);
  const playersListRef = useRef<PlayerInfo[]>([]);
  const gameStateRef = useRef<GameState | null>(null);
  const localVersionRef = useRef<number>(0); // Track the version we expect after our actions
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null); // For debouncing state sync
  const pendingSyncRef = useRef(false); // Track if a sync is pending

  // Keep ref in sync with state
  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState) {
      localVersionRef.current = gameState.stateVersion;
    }

    // If a sync is pending and we're the host, do it now that state is updated
    if (pendingSyncRef.current && isHostRef.current && gameState) {
      pendingSyncRef.current = false;
    }
  }, [gameState]);

  // Cleanup sync timer on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  // Helper to apply actions
  const applyAction = useCallback((state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'DRAW_IDEOLOGY_CARD':
        if (state.phase !== 'ANSWERING') return state;
        return drawIdeologyCard(state);

      case 'REDRAW_IDEOLOGY_CARD':
        if (state.phase !== 'ANSWERING') return state;
        return redrawIdeologyCard(state);

      case 'ANSWER_IDEOLOGY_CARD':
        if (state.phase !== 'ANSWERING' || !state.currentIdeologyCard) return state;
        return answerIdeologyCard(state, action.choice);

      case 'BUY_DEPLOYMENT_ORDER':
        if (state.phase !== 'ACTION') return state;
        if (action.useGoingViral || action.useHelpingHands) {
          return buyDeploymentOrderWithPowers(state, action.cardId, action.useGoingViral, action.useHelpingHands);
        }
        return buyDeploymentOrder(state, action.cardId);

      case 'BUY_CONSPIRACY_CARD':
        if (state.phase !== 'ACTION') return state;
        return buyConspiracyCard(state, action.cardId, action.useHelpingHands);

      case 'PLAY_CONSPIRACY_CARD':
        // Conspiracy cards can be played at ANY time, not just during ACTION phase
        return playConspiracyCard(state, {
          cardId: action.cardId,
          playerId: action.playerId,
          targetPlayerId: action.targetPlayerId,
          targetResource: action.targetResource,
          targetZoneId: action.targetZoneId,
          targetSlotIndex: action.targetSlotIndex,
          targetZoneId2: action.targetZoneId2,
          targetSlotIndex2: action.targetSlotIndex2,
        });

      case 'USE_PROSPECTING':
        if (state.phase !== 'ACTION') return state;
        return useProspecting(state, {
          giveResource: action.giveResource,
          getResources: action.getResources,
        });

      case 'USE_LAND_GRAB':
        if (state.phase !== 'ACTION') return state;
        return useLandGrab(state, {
          zoneId: action.zoneId,
          slotIndex: action.slotIndex,
        });

      case 'USE_DONATIONS':
        if (state.phase !== 'ACTION') return state;
        return useDonations(state, {
          targetPlayerId: action.targetPlayerId,
          resource: action.resource,
        });

      case 'USE_PAYBACK':
        if (state.phase !== 'ACTION') return state;
        return usePayback(state, {
          zoneId: action.zoneId,
          slotIndex: action.slotIndex,
          payResource: action.payResource,
        });

      case 'USE_TOUGH_LOVE':
        if (state.phase !== 'ACTION') return state;
        return useToughLove(state, {
          zoneId: action.zoneId,
          slotIndices: action.slotIndices,
          targetPlayerId: action.targetPlayerId,
          payResources: action.payResources,
        });

      case 'PROPOSE_TRADE':
        if (state.phase !== 'ACTION') return state;
        return proposeTrade(state, {
          toPlayerId: action.toPlayerId,
          offering: action.offering,
          requesting: action.requesting,
        });

      case 'ACCEPT_TRADE':
        if (!state.pendingTrade) return state;
        return acceptTrade(state, state.pendingTrade.toPlayerId);

      case 'REJECT_TRADE':
        if (!state.pendingTrade) return state;
        return rejectTrade(state, state.pendingTrade.toPlayerId);

      case 'CANCEL_TRADE':
        return cancelTrade(state);

      case 'CLEAR_HEADLINE':
        return clearHeadline(state);

      case 'CLEAR_RESOURCE_GAIN':
        return clearResourceGain(state);

      case 'SELECT_STARTING_RESOURCES':
        if (state.phase !== 'RESOURCE_SELECTION') return state;
        return selectStartingResources(state, action.playerId, action.resources);

      case 'VOTE_FIRST_PLAYER':
        if (state.phase !== 'FIRST_PLAYER_SELECTION') return state;
        return voteFirstPlayer(state, action.voterId, action.voteForId);

      case 'BID_FIRST_PLAYER':
        if (state.phase !== 'FIRST_PLAYER_SELECTION') return state;
        return bidFirstPlayer(state, action.bidderId, action.bid);

      case 'PLACE_BATTALION':
        if (state.phase !== 'DEPLOYMENT') return state;
        const newState = placeBattalion(state, action.zoneId, action.slotIndex);
        if (newState.players[newState.activePlayerId].battalionReserve === 0) {
          return endDeployment(newState);
        }
        return newState;

      case 'PLACE_EVICTED_BATTALION':
        if (state.phase !== 'PLACE_EVICTED') return state;
        return placeEvictedBattalion(state, action.zoneId, action.slotIndex);

      case 'END_PLACE_EVICTED':
        if (state.phase !== 'PLACE_EVICTED') return state;
        return endPlaceEvictedPhase(state);

      case 'REDEPLOYMENT':
        if (state.phase !== 'REDEPLOYMENT') return state;
        return executeRedeployment(state, action.fromZone, action.toZone, action.fromSlot, action.toSlot);

      case 'END_ACTION_PHASE':
        if (state.phase !== 'ACTION') return state;
        return endActionPhase(state);

      case 'END_TURN':
        if (state.phase === 'DEPLOYMENT') {
          const newState = endDeployment(state);
          return { ...newState, stateVersion: newState.stateVersion + 1 };
        }
        if (state.phase === 'REDEPLOYMENT') {
          const newState = endTurn(state);
          return { ...newState, stateVersion: newState.stateVersion + 1 };
        }
        return state;

      default:
        return state;
    }
  }, []);

  // Wrapper that increments stateVersion after applying action
  const applyActionWithVersion = useCallback((state: GameState, action: GameAction): GameState => {
    const newState = applyAction(state, action);
    // Only increment version if state actually changed
    if (newState !== state) {
      return { ...newState, stateVersion: newState.stateVersion + 1 };
    }
    return state;
  }, [applyAction]);

  const handleGameStart = useCallback((players: PlayerInfo[]) => {
    playersListRef.current = players;

    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    const myGamePlayerId = `player_${playerIndex + 1}`;
    setGamePlayerId(myGamePlayerId);

    const playerNames = players.map(p => p.name);
    const initialState = initializeGame(playerNames);
    setGameState(initialState);

    // Start background music
    startBGM();

    if (isHostRef.current) {
      setTimeout(() => {
        syncState(initialState);
      }, 100);
    }
  }, [playerId]);

  const handleGameAction = useCallback((action: GameAction, fromPlayerId: string) => {
    // Prevent double-application of actions:
    // If the action originated from us, we already applied it optimistically in dispatch().
    // We should ignore the echo from the server.
    if (fromPlayerId === playerId) return;

    // Play sounds for actions from OTHER players so everyone hears them
    if (action.type === 'PLACE_BATTALION') {
      playSound('deploy_troop');
    } else if (action.type === 'REDEPLOYMENT') {
      playSound('redeploy_move');
    }

    setGameState(prev => {
      if (!prev) return null;

      // Check for majority before applying action
      const zoneIdToCheck = action.type === 'PLACE_BATTALION' ? action.zoneId : null;
      const hadMajorityBefore = zoneIdToCheck ? prev.zones[zoneIdToCheck]?.majorityOwner : null;

      const newState = applyActionWithVersion(prev, action);

      // Check if majority was just formed
      if (zoneIdToCheck) {
        const zoneAfter = newState.zones[zoneIdToCheck];
        if (zoneAfter && zoneAfter.majorityOwner && !hadMajorityBefore) {
          setTimeout(() => playSound('success_chime'), 300);
        }
      }

      // Update refs immediately
      localVersionRef.current = newState.stateVersion;
      gameStateRef.current = newState;

      // CRITICAL FIX: If we are the host, we MUST broadcast this new state 
      // to ensure everyone stays in sync, even if they missed the action packet.
      if (isHostRef.current) {
        // Clear existing timer
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

        // Schedule sync
        syncTimerRef.current = setTimeout(() => {
          if (gameStateRef.current && syncStateRef.current) {
            syncStateRef.current(gameStateRef.current);
          }
          syncTimerRef.current = null;
        }, 150);
      }

      return newState;
    });
  }, [applyActionWithVersion, playerId]);

  const handleStateSync = useCallback((state: GameState) => {
    // Only accept state sync if the incoming version is >= our local version
    // This prevents race conditions where stale state overwrites our local changes
    if (state.stateVersion >= localVersionRef.current) {
      setGameState(state);
      localVersionRef.current = state.stateVersion;
    }
    // If incoming version is older, ignore it - our local state is more up-to-date
  }, []);

  const handleError = useCallback((message: string) => {
    console.error('Multiplayer error:', message);
  }, []);

  // Ref to hold the syncState function so we can use it in handleGameAction
  // without circular dependency (since useMultiplayer needs handleGameAction)
  const syncStateRef = useRef<((state: GameState) => void) | null>(null);

  const handlePlayerLeft = useCallback((leftPlayerId: string, newHostId: string | null) => {
    // If I am the host (or just became the host), I am responsible for cleaning up the game state.
    const iAmHost = newHostId === playerId || (isHostRef.current && (!newHostId || newHostId === playerId));

    if (!iAmHost || !gameStateRef.current) return;

    // Convert room player ID to game state player ID
    // Room uses IDs like "player_1234567890_abc123", game state uses "player_1", "player_2", etc.
    const playerIndex = playersListRef.current.findIndex(p => p.id === leftPlayerId);
    if (playerIndex === -1) return;

    const gamePlayerId = `player_${playerIndex + 1}`;

    // Check if this player exists in game state
    if (!gameStateRef.current.players[gamePlayerId]) return;

    console.log(`[handlePlayerLeft] Removing player: room=${leftPlayerId}, game=${gamePlayerId}`);

    // Remove player from game state (remove voters, update turn order, etc)
    let newState = removePlayer(gameStateRef.current, gamePlayerId);

    // Update local state and broadcast
    setGameState(newState);
    gameStateRef.current = newState;
    localVersionRef.current = newState.stateVersion;

    // Trigger sync immediately
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (syncStateRef.current) syncStateRef.current(newState);
  }, [playerId]);

  const handlePlayerDisconnecting = useCallback((leftPlayerId: string, playerName: string, gracePeriodMs: number) => {
    console.log(`[MultiplayerGame] Player ${playerName} disconnected - they have ${gracePeriodMs / 1000}s to reconnect`);
    // Could show toast/notification here if desired
  }, []);

  const handlePlayerReconnected = useCallback((reconnectedPlayerId: string, playerName: string) => {
    console.log(`[MultiplayerGame] Player ${playerName} reconnected!`);
    // Could show toast/notification here if desired
  }, []);

  const handleRoomReset = useCallback((reason: string) => {
    console.log(`[MultiplayerGame] Room reset: ${reason}`);
    // Redirect to home screen
    onLeave();
  }, [onLeave]);

  const { connected, reconnecting, room, error, isHost, disconnectedPlayers, startGame, sendAction, syncState, leaveGame } = useMultiplayer({
    roomId,
    playerId,
    playerName,
    onGameStart: handleGameStart,
    // Pass a stable reference that internally delegates
    onGameAction: handleGameAction,
    onStateSync: handleStateSync,
    onError: handleError,
    onPlayerLeft: handlePlayerLeft,
    onPlayerDisconnecting: handlePlayerDisconnecting,
    onPlayerReconnected: handlePlayerReconnected,
    onRoomReset: handleRoomReset,
  });

  // Update ref when syncState changes
  useEffect(() => {
    syncStateRef.current = syncState;
  }, [syncState]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    if (!gamePlayerId && room?.players && room.players.length > 0) {
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      if (playerIndex !== -1) {
        const myGamePlayerId = `player_${playerIndex + 1}`;
        setGamePlayerId(myGamePlayerId);
        playersListRef.current = room.players;
      }
    }
  }, [room?.players, playerId, gamePlayerId]);

  // Dispatch action and sync
  const dispatch = useCallback((action: GameAction) => {
    // Apply action locally first with version increment
    setGameState(prev => {
      if (!prev) return null;
      const newState = applyActionWithVersion(prev, action);
      // Update refs immediately so sync has latest state
      localVersionRef.current = newState.stateVersion;
      gameStateRef.current = newState;
      return newState;
    });

    // Send action to other players
    sendAction(action);

    // If host, debounce state sync to batch rapid actions
    if (isHostRef.current) {
      // Clear any existing sync timer
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }

      // Schedule a new sync after actions settle
      syncTimerRef.current = setTimeout(() => {
        if (gameStateRef.current) {
          syncState(gameStateRef.current);
        }
        syncTimerRef.current = null;
      }, 150); // Slightly longer delay to let actions batch
    }
  }, [applyActionWithVersion, sendAction, syncState]);

  // Check if it's this player's turn (or if action is allowed for this player)
  const isMyTurn = gameState && gamePlayerId && gameState.activePlayerId === gamePlayerId;

  // For phases where any player can act (resource selection, voting, bidding)
  const canActInCurrentPhase = gameState && gamePlayerId && (
    gameState.phase === 'RESOURCE_SELECTION' ||
    gameState.phase === 'FIRST_PLAYER_SELECTION' ||
    isMyTurn
  );

  // Event handlers
  const handleSlotClick = useCallback(
    (zoneId: string, slotIndex: number) => {
      if (!gameState || !isMyTurn) return;

      const zone = gameState.zones[zoneId];
      const player = gameState.players[gameState.activePlayerId];

      // Handle placing evicted voters
      if (gameState.phase === 'PLACE_EVICTED' && player.evictedBattalions > 0) {
        if (zone.slots[slotIndex] === null) {
          dispatch({ type: 'PLACE_EVICTED_BATTALION', zoneId, slotIndex });
        }
        return;
      }

      if (gameState.phase === 'DEPLOYMENT' && player.battalionReserve > 0) {
        if (zone.slots[slotIndex] === null) {
          // Remember current majority before placing
          const hadMajorityBefore = zone.majorityOwner === gameState.activePlayerId;

          dispatch({ type: 'PLACE_BATTALION', zoneId, slotIndex });
          playSound('deploy_troop');

          // Check if we just gained majority (will be calculated in next state, so we compute manually)
          const playersInZone: Record<string, number> = {};
          zone.slots.forEach(pid => {
            if (pid) playersInZone[pid] = (playersInZone[pid] || 0) + 1;
          });
          // Add the voter we just placed
          playersInZone[gameState.activePlayerId] = (playersInZone[gameState.activePlayerId] || 0) + 1;

          const ourCount = playersInZone[gameState.activePlayerId] || 0;
          if (!hadMajorityBefore && ourCount >= zone.majorityRequired) {
            // We just formed majority!
            setTimeout(() => playSound('success_chime'), 300);
          }
        }
        return;
      }

      if (gameState.phase === 'REDEPLOYMENT') {
        if (!redeploySource) {
          // Allow selecting any non-volatile, non-locked voter as source
          // Validation of rights happens when destination is selected
          if (zone.slots[slotIndex] !== null &&
            !zone.volatileSlots.includes(slotIndex) &&
            !zone.lockedSlots[slotIndex]) {
            setRedeploySource({ zoneId, slotIndex });
          }
        } else {
          const isSameSlot = redeploySource.zoneId === zoneId && redeploySource.slotIndex === slotIndex;

          if (isSameSlot) {
            // Clicking same slot cancels selection
            setRedeploySource(null);
          } else if (zone.slots[slotIndex] === null) {
            // Trying to move to an empty slot - validate the move
            const validation = canRedeploy(
              gameState,
              gameState.activePlayerId,
              redeploySource.zoneId,
              zoneId,
              redeploySource.slotIndex,
              slotIndex
            );
            if (validation.valid) {
              dispatch({
                type: 'REDEPLOYMENT',
                fromZone: redeploySource.zoneId,
                toZone: zoneId,
                fromSlot: redeploySource.slotIndex,
                toSlot: slotIndex,
              });
              playSound('redeploy_move');
              setRedeploySource(null);
            } else {
              // Show reason for failure - use in-game message with new terminology
              playSound('alert_error');
              const reason = validation.reason?.replace(/voter/gi, terminology.voter).replace(/voters/gi, terminology.voters) || 'Invalid move';
              setErrorMessage(reason);
              setTimeout(() => setErrorMessage(null), 3000);
              // Don't clear source if it was just a bad target, let them try another target
              // Unless it was a fundamental issue? No, keep source selected usually better UX
              // But original code cleared it. Let's keep it selected for better UX, 
              // but if they click a bad target, they might want to re-select source.
              // Actually, standard behavior in games is usually to keep source selected.
              // I will not clear source if validation failed for target reasons.
              // But for now, let's just alert and clear to match previous behavior but with feedback.
              setRedeploySource(null);
            }
          } else {
            // Clicking another occupied slot - switch to that as source
            if (!zone.volatileSlots.includes(slotIndex) && !zone.lockedSlots[slotIndex]) {
              setRedeploySource({ zoneId, slotIndex });
            } else {
              setRedeploySource(null);
            }
          }
        }
      }
    },
    [gameState, isMyTurn, dispatch, redeploySource]
  );

  const handleAnswer = useCallback(
    (choice: 'A' | 'B') => {
      if (!isMyTurn) return;
      dispatch({ type: 'ANSWER_IDEOLOGY_CARD', choice });
    },
    [dispatch, isMyTurn]
  );

  const handleRedraw = useCallback(() => {
    if (!isMyTurn) return;
    dispatch({ type: 'REDRAW_IDEOLOGY_CARD' });
  }, [dispatch, isMyTurn]);

  const handleBuyVoter = useCallback(
    (cardId: string, useGoingViral?: boolean, useHelpingHands?: boolean) => {
      if (!isMyTurn) return;

      // Generate the replacement card locally to ensure deterministic sync
      const replacementCard = generateDeploymentOrder();

      dispatch({
        type: 'BUY_DEPLOYMENT_ORDER',
        cardId,
        useGoingViral,
        useHelpingHands,
        replacementCard
      });
    },
    [dispatch, isMyTurn]
  );

  const handleBuyConspiracy = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      dispatch({ type: 'BUY_CONSPIRACY_CARD', cardId });
    },
    [dispatch, isMyTurn]
  );

  // Conspiracy cards can be played at ANY time, not just on your turn
  const handlePlayConspiracy = useCallback(
    (cardId: string, targetPlayerId?: string, targetResource?: ResourceType, targetZoneId?: string, targetSlotIndex?: number, targetZoneId2?: string, targetSlotIndex2?: number) => {
      // Check if the current player (myPlayer) owns this card
      if (!gamePlayerId || !gameState) return;
      const myPlayerData = gameState.players[gamePlayerId];
      if (!myPlayerData) return;
      const ownsCard = myPlayerData.conspiracyCards.some(c => c.id === cardId);
      if (!ownsCard) return;
      // Pass the playerId so the game engine knows who is playing the card
      dispatch({ type: 'PLAY_CONSPIRACY_CARD', cardId, playerId: gamePlayerId, targetPlayerId, targetResource, targetZoneId, targetSlotIndex, targetZoneId2, targetSlotIndex2 });
    },
    [dispatch, gamePlayerId, gameState]
  );

  const handleUseProspecting = useCallback(
    (giveResource: ResourceType, getResources: ResourceType[]) => {
      if (!isMyTurn) return;
      dispatch({ type: 'USE_PROSPECTING', giveResource, getResources });
    },
    [dispatch, isMyTurn]
  );

  const handleUseLandGrab = useCallback(
    (zoneId: string, slotIndex: number) => {
      if (!isMyTurn) return;
      dispatch({ type: 'USE_LAND_GRAB', zoneId, slotIndex });
    },
    [dispatch, isMyTurn]
  );

  const handleUseDonations = useCallback(
    (targetPlayerId: string, resource: ResourceType) => {
      if (!isMyTurn) return;
      dispatch({ type: 'USE_DONATIONS', targetPlayerId, resource });
    },
    [dispatch, isMyTurn]
  );

  const handleUsePayback = useCallback(
    (zoneId: string, slotIndex: number, payResource: ResourceType) => {
      if (!isMyTurn) return;
      dispatch({ type: 'USE_PAYBACK', zoneId, slotIndex, payResource });
    },
    [dispatch, isMyTurn]
  );

  const handleUseToughLove = useCallback(
    (zoneId: string, slotIndices: [number, number], targetPlayerId: string, payResources: ResourceType[]) => {
      if (!isMyTurn) return;
      dispatch({ type: 'USE_TOUGH_LOVE', zoneId, slotIndices, targetPlayerId, payResources });
    },
    [dispatch, isMyTurn]
  );

  const handleProposeTrade = useCallback(
    (toPlayerId: string, offering: Partial<Resources>, requesting: Partial<Resources>) => {
      if (!isMyTurn) return;
      dispatch({ type: 'PROPOSE_TRADE', toPlayerId, offering, requesting });
    },
    [dispatch, isMyTurn]
  );

  const handleAcceptTrade = useCallback(() => {
    // Any player who is target of trade can accept
    if (!gameState?.pendingTrade || gameState.pendingTrade.toPlayerId !== gamePlayerId) return;
    dispatch({ type: 'ACCEPT_TRADE' });
  }, [dispatch, gameState, gamePlayerId]);

  const handleRejectTrade = useCallback(() => {
    if (!gameState?.pendingTrade || gameState.pendingTrade.toPlayerId !== gamePlayerId) return;
    dispatch({ type: 'REJECT_TRADE' });
  }, [dispatch, gameState, gamePlayerId]);

  const handleCancelTrade = useCallback(() => {
    if (!gameState?.pendingTrade || gameState.pendingTrade.fromPlayerId !== gamePlayerId) return;
    dispatch({ type: 'CANCEL_TRADE' });
  }, [dispatch, gameState, gamePlayerId]);

  const handleClearHeadline = useCallback(() => {
    dispatch({ type: 'CLEAR_HEADLINE' });
  }, [dispatch]);

  const handleClearResourceGain = useCallback(() => {
    dispatch({ type: 'CLEAR_RESOURCE_GAIN' });
  }, [dispatch]);

  const handleSelectStartingResources = useCallback(
    (selectingPlayerId: string, resources: Partial<Resources>) => {
      // Only allow selecting for your own player
      if (selectingPlayerId !== gamePlayerId) return;
      dispatch({ type: 'SELECT_STARTING_RESOURCES', playerId: selectingPlayerId, resources });
    },
    [dispatch, gamePlayerId]
  );

  const handleVoteFirstPlayer = useCallback(
    (voterId: string, voteForId: string) => {
      // Only allow voting for your own player
      if (voterId !== gamePlayerId) return;
      dispatch({ type: 'VOTE_FIRST_PLAYER', voterId, voteForId });
    },
    [dispatch, gamePlayerId]
  );

  const handleBidFirstPlayer = useCallback(
    (bidderId: string, bid: Partial<Resources>) => {
      // Only allow bidding for your own player
      if (bidderId !== gamePlayerId) return;
      dispatch({ type: 'BID_FIRST_PLAYER', bidderId, bid });
    },
    [dispatch, gamePlayerId]
  );

  const handleEndActionPhase = useCallback(() => {
    if (!isMyTurn) return;
    dispatch({ type: 'END_ACTION_PHASE' });
  }, [dispatch, isMyTurn]);

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    dispatch({ type: 'END_TURN' });
    setRedeploySource(null);
  }, [dispatch, isMyTurn]);

  const handlePlayAgain = useCallback(() => {
    leaveGame(); // Tell server we're leaving (triggers room reset if last player)
    onLeave(); // Navigate back to home
  }, [leaveGame, onLeave]);

  // Show waiting room if game hasn't started
  if (!room?.gameStarted || !gameState) {
    return (
      <WaitingRoom
        roomCode={room?.code || roomId}
        players={room?.players || []}
        currentPlayerId={playerId}
        isHost={isHost}
        connected={connected}
        error={error}
        onStart={startGame}
        onLeave={onLeave}
      />
    );
  }

  // Show mission briefing before first phase
  if (showBriefing) {
    return (
      <MissionBriefing onComplete={() => setShowBriefing(false)} />
    );
  }

  // Resource Selection Phase (3+ players)
  if (gameState.phase === 'RESOURCE_SELECTION' && gamePlayerId) {
    // Check if this player has already selected
    const hasSelected = gameState.resourceSelection?.selections[gamePlayerId];

    return (
      <div className="relative">


        {hasSelected ? (
          <div className="min-h-screen war-bg flex items-center justify-center font-mono relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 tactical-grid-bg opacity-20" />
            </div>
            <div className="war-vignette" />
            <div className="text-center war-panel rounded-lg p-8 relative z-10">
              <div className="military-spinner mx-auto mb-4" />
              <h2 className="military-header text-xl mb-4">AWAITING OPERATIVES...</h2>
              <p className="text-[#4caf50]/60 uppercase tracking-wider">
                {Object.keys(gameState.resourceSelection?.selections || {}).length} / {Object.keys(gameState.players).length} AGENTS READY
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {Array.from({ length: Object.keys(gameState.players).length }).map((_, i) => (
                  <div key={i} className={`w-3 h-3 rounded ${i < Object.keys(gameState.resourceSelection?.selections || {}).length ? 'bg-[#4caf50] shadow-[0_0_8px_#4caf50]' : 'border border-[#4caf50]/30'}`} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ResourceSelectionScreen
            state={gameState}
            currentPlayerId={gamePlayerId}
            onSelectResources={handleSelectStartingResources}
          />
        )}
      </div>
    );
  }

  // First Player Selection Phase
  if (gameState.phase === 'FIRST_PLAYER_SELECTION' && gamePlayerId) {
    const playerCount = Object.keys(gameState.players).length;
    const isVotingMode = playerCount >= 3;

    // Check if this player has already voted/bid
    const hasVoted = isVotingMode && gameState.firstPlayerSelection?.votes[gamePlayerId];
    const hasBid = !isVotingMode && gameState.firstPlayerSelection?.bids[gamePlayerId];
    const hasActed = hasVoted || hasBid;

    return (
      <div className="relative">


        {hasActed ? (
          <div className="min-h-screen war-bg flex items-center justify-center font-mono relative overflow-hidden">
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 tactical-grid-bg opacity-20" />
            </div>
            <div className="war-vignette" />
            <div className="text-center war-panel rounded-lg p-8 relative z-10">
              <div className="military-spinner mx-auto mb-4" />
              <h2 className="military-header text-xl mb-4">AWAITING OPERATIVES...</h2>
              <p className="text-[#4caf50]/60 uppercase tracking-wider">
                {isVotingMode
                  ? `${Object.keys(gameState.firstPlayerSelection?.votes || {}).length} / ${playerCount} VOTES CAST`
                  : `${Object.keys(gameState.firstPlayerSelection?.bids || {}).length} / ${playerCount} BIDS PLACED`
                }
              </p>
            </div>
          </div>
        ) : (
          <FirstPlayerSelectionScreen
            state={gameState}
            currentPlayerId={gamePlayerId}
            onVote={handleVoteFirstPlayer}
            onBid={handleBidFirstPlayer}
          />
        )}
      </div>
    );
  }

  // Game over
  if (gameState.phase === 'GAME_OVER') {
    return <GameOverScreen state={gameState} onPlayAgain={handlePlayAgain} />;
  }

  const activePlayer = gameState.players[gameState.activePlayerId];
  const myPlayer = gamePlayerId ? gameState.players[gamePlayerId] : null;

  const highlightedZones =
    gameState.phase === 'REDEPLOYMENT' && redeploySource
      ? gameState.zones[redeploySource.zoneId]?.adjacentZones || []
      : [];

  const canRedrawCard = myPlayer && getTotalResources(myPlayer.resources) >= 4;

  // Calculate redeployment info for display
  const getRedeployInfo = () => {
    if (!gameState || !activePlayer) return { zonesWithRights: 0, zoneNames: [], movesPerZone: 1, maxMoves: 0, usedMoves: 0, remainingMoves: 0, hasShowstopperL5: false };

    let zonesWithRights = 0;
    const zoneNames: string[] = [];
    for (const zone of Object.values(gameState.zones)) {
      if (getRedeploymentRightsHolder(zone, gameState.players) === gameState.activePlayerId) {
        zonesWithRights++;
        zoneNames.push(zone.name);
      }
    }
    const hasShowstopperL5 = hasUnlockedPower(activePlayer.ideologyTracks, 'showstopper', 5);
    const movesPerZone = hasShowstopperL5 ? 2 : 1;
    const maxMoves = zonesWithRights * movesPerZone;
    const usedMoves = gameState.powerUsage.redeploymentUsed;
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
        headline={gameState.currentHeadlineCard}
        onDismiss={handleClearHeadline}
      />

      {/* Resource Gain Display */}
      {isMyTurn && (
        <ResourceGainDisplay
          gain={gameState.lastResourceGain}
          onDismiss={handleClearResourceGain}
        />
      )}

      {/* Exit button moved to sidebar */}



      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-[#f44336] text-white px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(244,67,54,0.5)] font-mono uppercase tracking-wider text-sm animate-pulse">
          <span className="mr-2">⚠</span> {errorMessage}
        </div>
      )}

      {/* Reconnecting Banner */}
      {reconnecting && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-[#ff9800] to-[#f57c00] text-white px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(255,152,0,0.5)] font-mono uppercase tracking-wider text-sm flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>RECONNECTING TO SERVER...</span>
        </div>
      )}

      {/* Disconnected Players Notification */}
      {disconnectedPlayers.length > 0 && (
        <div className="fixed top-4 right-4 z-[9998] bg-gradient-to-r from-[#ff5722]/90 to-[#e64a19]/90 text-white px-4 py-3 rounded-lg shadow-[0_0_15px_rgba(255,87,34,0.4)] font-mono text-sm max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            <span className="uppercase tracking-wider font-bold text-xs">Connection Lost</span>
          </div>
          {disconnectedPlayers.map(p => (
            <div key={p.playerId} className="text-white/90 text-xs">
              <span className="font-bold">{p.playerName}</span> reconnecting...
            </div>
          ))}
        </div>
      )}

      {/* Black Ops Notification Toast */}
      {showBlackOpsAlert && gameState.lastBlackOpsPlayed && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.6)] border-2 border-[#dc2626] font-mono animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="text-[#dc2626] font-bold uppercase tracking-widest text-xs mb-1">BLACK OPS ALERT</div>
              <div className="text-lg font-bold">
                <span className="text-[#fbbf24]">{gameState.lastBlackOpsPlayed.playerName}</span>
                <span className="text-gray-300"> used </span>
                <span className="text-[#f87171]">{gameState.lastBlackOpsPlayed.cardName}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Turn indicator for non-active player */}
      {!isMyTurn && gameState.phase !== 'PLACE_EVICTED' && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-yellow-600 text-white px-6 py-2 rounded-full shadow-lg">
          Waiting for {activePlayer.name}'s turn...
        </div>
      )}

      {/* In-Game Help */}
      <InGameHelp
        currentPhase={gameState.phase}
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
                  leaveGame(); // Send explicit leave message for immediate removal
                  onLeave();
                }
              }}
              className="mb-3 px-3 py-1 bg-[#f44336]/80 hover:bg-[#f44336] text-white rounded text-xs font-mono uppercase tracking-wider transition-all"
            >
              EXIT ⏻
            </button>
            <h2 className="text-lg font-bold mb-4 text-[#4caf50] uppercase tracking-widest glow-green font-mono">AGENTS</h2>
            {(() => {
              const players = Object.values(gameState.players);
              let sortedPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));

              if (gamePlayerId) {
                const myIndex = sortedPlayers.findIndex(p => p.id === gamePlayerId);
                if (myIndex !== -1) {
                  sortedPlayers = [
                    ...sortedPlayers.slice(myIndex),
                    ...sortedPlayers.slice(0, myIndex)
                  ];
                }
              }

              return (
                <div className="space-y-3 pb-4">
                  {sortedPlayers.map(player => (
                    <SidebarAgentCard
                      key={player.id}
                      player={player}
                      isActive={player.id === gameState.activePlayerId}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Main Game Area - Board (Center Column) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
          <div className="px-3 py-2 bg-black/80 backdrop-blur-sm border-b border-[#4caf50]/30 shrink-0 flex justify-between items-center z-20 relative">
            <PhaseIndicator
              phase={gameState.phase}
              turnNumber={gameState.turnNumber}
              activePlayerName={activePlayer.name}
              battalionCount={activePlayer.battalionReserve}
              evictedCount={activePlayer.evictedBattalions}
            />
            {/* Restore Help Button */}
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
                state={gameState}
                onSlotClick={handleSlotClick}
                selectedSlot={selectedSlot}
                highlightedZones={highlightedZones}
              />
            </div>


            {/* Center Modal Layer - For question card only */}
            {gameState.phase === 'ANSWERING' && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-8">
                <div className="pointer-events-auto animate-fade-in shadow-2xl rounded-xl w-full max-w-lg">
                  {gameState.currentIdeologyCard ? (
                    <IdeologyCard
                      card={gameState.currentIdeologyCard}
                      onAnswer={handleAnswer}
                      onRedraw={handleRedraw}
                      canRedraw={canRedrawCard || false}
                      disabled={!isMyTurn}
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

        {/* Right Sidebar - Action Center (Hidden on mobile, smaller on tablet) */}
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

          {/* Active Actions Area or Game Log (Full Height) */}
          <div className="flex-1 overflow-y-auto relative flex flex-col">
            {showGameLog ? (
              <GameLog entries={gameState.gameLog} players={gameState.players} />
            ) : (
              <div className="p-4 space-y-6">
                {/* 1. Question Box REMOVED (Moved to Center) */}


                {/* 2. Voter Market */}
                {gameState.phase !== 'RESOURCE_SELECTION' && gameState.phase !== 'FIRST_PLAYER_SELECTION' && gameState.phase !== 'REDEPLOYMENT' && (
                  <div className="animate-fade-in">
                    <DeploymentShop
                      market={gameState.deploymentShop}
                      playerResources={activePlayer.resources}
                      playerIdeologyTracks={activePlayer.ideologyTracks}
                      powerUsage={gameState.powerUsage}
                      onBuy={handleBuyVoter}
                      disabled={!isMyTurn || gameState.phase !== 'ACTION'}
                    />
                    {isMyTurn && gameState.phase === 'ACTION' && (
                      <button
                        onClick={handleEndActionPhase}
                        className="w-full mt-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-98 transition-all"
                      >
                        End Action Phase
                      </button>
                    )}
                  </div>
                )}

                {/* 3. Gerrymander Panel (Redeployment) */}
                {gameState.phase === 'REDEPLOYMENT' && (
                  <GerrymanderPanel
                    state={gameState}
                    activePlayer={activePlayer}
                    isMyTurn={isMyTurn || false}
                    onEndTurn={handleEndTurn}
                    redeploySource={redeploySource}
                  />
                )}

                {/* 4. Powers Panel */}
                {gameState.phase !== 'RESOURCE_SELECTION' && gameState.phase !== 'FIRST_PLAYER_SELECTION' && gameState.phase !== 'REDEPLOYMENT' && (
                  <PowersPanel
                    player={activePlayer}
                    powerUsage={gameState.powerUsage}
                    players={gameState.players}
                    zones={gameState.zones}
                    onUseProspecting={handleUseProspecting}
                    onUseLandGrab={handleUseLandGrab}
                    onUseDonations={handleUseDonations}
                    onUsePayback={handleUsePayback}
                    onUseToughLove={handleUseToughLove}
                    disabled={!isMyTurn || gameState.phase !== 'ACTION'}
                  />
                )}

                {/* 5. Conspiracy Shop */}
                {gameState.phase !== 'RESOURCE_SELECTION' && gameState.phase !== 'FIRST_PLAYER_SELECTION' && gameState.phase !== 'REDEPLOYMENT' && (
                  <div className="animate-fade-in pt-4 border-t border-gray-800">
                    <h3 className="text-xs text-[#f44336] uppercase tracking-widest font-bold mb-3" style={{ textShadow: '0 0 8px rgba(244,67,54,0.5)' }}>BLACK OPS</h3>
                    <ConspiracyCardShop
                      playerResources={activePlayer.resources}
                      playerCards={activePlayer.conspiracyCards}
                      players={gameState.players}
                      zones={gameState.zones}
                      activePlayerId={gamePlayerId || ''}
                      onBuyCard={handleBuyConspiracy}
                      onPlayCard={handlePlayConspiracy}
                      disabled={!isMyTurn || gameState.phase !== 'ACTION'}
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
