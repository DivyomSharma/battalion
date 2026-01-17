'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  GameState,
  GameAction,
  GamePhase,
} from '@/types/game';
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
  tradeWithReserve,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  clearHeadline,
  clearResourceGain,
  selectStartingResources,
  voteFirstPlayer,
  bidFirstPlayer,
  ProspectingData,
  LandGrabData,
  DonationsData,
  PaybackData,
  ToughLoveData,
  PlayConspiracyData,
} from './gameEngine';

interface GameContextValue {
  state: GameState | null;
  dispatch: (action: GameAction) => void;
  startGame: (playerNames: string[], playerColors?: string[]) => void;
  isInitialized: boolean;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  if (!state) {
    if (action.type === 'START_GAME') {
      return null; // Handled by startGame function
    }
    return null;
  }

  switch (action.type) {
    case 'DRAW_IDEOLOGY_CARD':
      if (state.phase !== 'ANSWERING') return state;
      return drawIdeologyCard(state);

    case 'ANSWER_IDEOLOGY_CARD':
      if (state.phase !== 'ANSWERING' || !state.currentIdeologyCard) return state;
      return answerIdeologyCard(state, action.choice);

    case 'BUY_DEPLOYMENT_ORDER':
      if (state.phase !== 'ACTION') return state;
      return buyDeploymentOrder(state, action.cardId);

    case 'PLACE_BATTALION':
      if (state.phase !== 'DEPLOYMENT') return state;
      return placeBattalion(state, action.zoneId, action.slotIndex);

    case 'REDEPLOYMENT':
      if (state.phase !== 'REDEPLOYMENT') return state;
      return executeRedeployment(state, action.fromZone, action.toZone, action.fromSlot, action.toSlot);

    case 'END_ACTION_PHASE':
      if (state.phase !== 'ACTION') return state;
      return endActionPhase(state);

    case 'END_TURN':
      if (state.phase === 'DEPLOYMENT') {
        return endDeployment(state);
      }
      if (state.phase === 'REDEPLOYMENT') {
        return endTurn(state);
      }
      return state;

    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatchAction] = useReducer(gameReducer, null);

  const startGame = useCallback((playerNames: string[], playerColors?: string[]) => {
    const initialState = initializeGame(playerNames, playerColors);
    // Draw first card
    const stateWithCard = drawIdeologyCard(initialState);
    dispatchAction({ type: 'START_GAME' });
    // Force state update by using a ref or direct setState
    // Since useReducer doesn't handle this well, we'll use a workaround
    setTimeout(() => {
      dispatchAction({ type: 'START_GAME' });
    }, 0);
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    dispatchAction(action);
  }, []);

  return (
    <GameContext.Provider
      value={{
        state,
        dispatch,
        startGame,
        isInitialized: state !== null,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Simpler approach - use direct state management
export function useGameState() {
  const [gameState, setGameState] = React.useState<GameState | null>(null);

  const startGame = useCallback((playerNames: string[], playerColors?: string[]) => {
    const initialState = initializeGame(playerNames, playerColors);
    const stateWithCard = drawIdeologyCard(initialState);
    setGameState(stateWithCard);
  }, []);

  const dispatch = useCallback((action: GameAction) => {
    setGameState(prev => {
      if (!prev) return null;

      switch (action.type) {
        case 'DRAW_IDEOLOGY_CARD':
          if (prev.phase !== 'ANSWERING') return prev;
          return drawIdeologyCard(prev);

        case 'REDRAW_IDEOLOGY_CARD':
          if (prev.phase !== 'ANSWERING') return prev;
          return redrawIdeologyCard(prev);

        case 'ANSWER_IDEOLOGY_CARD':
          if (prev.phase !== 'ANSWERING' || !prev.currentIdeologyCard) return prev;
          return answerIdeologyCard(prev, action.choice);

        case 'BUY_DEPLOYMENT_ORDER':
          if (prev.phase !== 'ACTION') return prev;
          if (action.useGoingViral || action.useHelpingHands) {
            return buyDeploymentOrderWithPowers(prev, action.cardId, action.useGoingViral, action.useHelpingHands);
          }
          return buyDeploymentOrder(prev, action.cardId);

        case 'BUY_CONSPIRACY_CARD':
          if (prev.phase !== 'ACTION') return prev;
          return buyConspiracyCard(prev, action.cardId, action.useHelpingHands);

        case 'PLAY_CONSPIRACY_CARD':
          if (prev.phase !== 'ACTION') return prev;
          return playConspiracyCard(prev, {
            cardId: action.cardId,
            targetPlayerId: action.targetPlayerId,
            targetResource: action.targetResource,
            targetZoneId: action.targetZoneId,
            targetSlotIndex: action.targetSlotIndex,
            targetZoneId2: action.targetZoneId2,
            targetSlotIndex2: action.targetSlotIndex2,
          });

        case 'USE_PROSPECTING':
          if (prev.phase !== 'ACTION') return prev;
          return useProspecting(prev, {
            giveResource: action.giveResource,
            getResources: action.getResources,
          });

        case 'USE_LAND_GRAB':
          if (prev.phase !== 'ACTION') return prev;
          return useLandGrab(prev, {
            zoneId: action.zoneId,
            slotIndex: action.slotIndex,
          });

        case 'USE_DONATIONS':
          if (prev.phase !== 'ACTION') return prev;
          return useDonations(prev, {
            targetPlayerId: action.targetPlayerId,
            resource: action.resource,
          });

        case 'USE_PAYBACK':
          if (prev.phase !== 'ACTION') return prev;
          return usePayback(prev, {
            zoneId: action.zoneId,
            slotIndex: action.slotIndex,
            payResource: action.payResource,
          });

        case 'USE_TOUGH_LOVE':
          if (prev.phase !== 'ACTION') return prev;
          return useToughLove(prev, {
            zoneId: action.zoneId,
            slotIndices: action.slotIndices,
            targetPlayerId: action.targetPlayerId,
            payResources: action.payResources,
          });

        case 'TRADE':
          if (prev.phase !== 'ACTION') return prev;
          return tradeWithReserve(prev, {
            giveResource: action.giveResource,
            getResource: action.getResource,
          });

        case 'PROPOSE_TRADE':
          if (prev.phase !== 'ACTION') return prev;
          return proposeTrade(prev, {
            toPlayerId: action.toPlayerId,
            offering: action.offering,
            requesting: action.requesting,
          });

        case 'ACCEPT_TRADE':
          // Any player who is the target of the trade can accept
          // For local game, we need to know which player is accepting
          // In local mode, we'll use a simple approach - the target player accepts
          if (!prev.pendingTrade) return prev;
          return acceptTrade(prev, prev.pendingTrade.toPlayerId);

        case 'REJECT_TRADE':
          if (!prev.pendingTrade) return prev;
          return rejectTrade(prev, prev.pendingTrade.toPlayerId);

        case 'CANCEL_TRADE':
          return cancelTrade(prev);

        case 'CLEAR_HEADLINE':
          return clearHeadline(prev);

        case 'CLEAR_RESOURCE_GAIN':
          return clearResourceGain(prev);

        case 'SELECT_STARTING_RESOURCES':
          if (prev.phase !== 'RESOURCE_SELECTION') return prev;
          return selectStartingResources(prev, action.playerId, action.resources);

        case 'VOTE_FIRST_PLAYER':
          if (prev.phase !== 'FIRST_PLAYER_SELECTION') return prev;
          return voteFirstPlayer(prev, action.voterId, action.voteForId);

        case 'BID_FIRST_PLAYER':
          if (prev.phase !== 'FIRST_PLAYER_SELECTION') return prev;
          return bidFirstPlayer(prev, action.bidderId, action.bid);

        case 'PLACE_BATTALION':
          if (prev.phase !== 'DEPLOYMENT') return prev;
          const newState = placeBattalion(prev, action.zoneId, action.slotIndex);
          // Auto-end deployment if no more voters
          if (newState.players[newState.activePlayerId].battalionReserve === 0) {
            return endDeployment(newState);
          }
          return newState;

        case 'PLACE_EVICTED_BATTALION':
          if (prev.phase !== 'PLACE_EVICTED') return prev;
          return placeEvictedBattalion(prev, action.zoneId, action.slotIndex);

        case 'END_PLACE_EVICTED':
          if (prev.phase !== 'PLACE_EVICTED') return prev;
          return endPlaceEvictedPhase(prev);

        case 'REDEPLOYMENT':
          if (prev.phase !== 'REDEPLOYMENT') return prev;
          return executeRedeployment(prev, action.fromZone, action.toZone, action.fromSlot, action.toSlot);

        case 'END_ACTION_PHASE':
          if (prev.phase !== 'ACTION') return prev;
          return endActionPhase(prev);

        case 'END_TURN':
          if (prev.phase === 'DEPLOYMENT') {
            return endDeployment(prev);
          }
          if (prev.phase === 'REDEPLOYMENT') {
            return endTurn(prev);
          }
          return prev;

        default:
          return prev;
      }
    });
  }, []);

  return {
    state: gameState,
    dispatch,
    startGame,
    isInitialized: gameState !== null,
  };
}
