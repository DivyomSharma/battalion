"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { GameAction, GameState } from "@/types/game";

export interface PlayerInfo {
  id: string;
  name: string;
  connectionId: string;
  isHost: boolean;
  isReady: boolean;
  disconnectedAt?: number;
}

export interface RoomInfo {
  players: PlayerInfo[];
  gameStarted: boolean;
  hostId: string | null;
  code: string;
}

interface ActionLog {
  _id: string;
  roomId: string; // or Id
  playerId: string;
  action: GameAction;
  timestamp: number;
}

interface UseMultiplayerOptions {
  roomId: string;
  playerId: string;
  playerName: string;
  onGameStart?: (players: PlayerInfo[]) => void;
  onGameAction?: (action: GameAction, playerId: string) => void;
  onStateSync?: (state: GameState) => void;
  onError?: (message: string) => void;
  onPlayerLeft?: (playerId: string, newHostId: string | null) => void;
  onPlayerDisconnecting?: (playerId: string, playerName: string, gracePeriodMs: number) => void;
  onPlayerReconnected?: (playerId: string, playerName: string) => void;
  onRoomReset?: (reason: string) => void;
}

export function useMultiplayer({
  roomId,
  playerId,
  playerName,
  onGameStart,
  onGameAction,
  onStateSync,
  onError,
  onPlayerLeft,
  onPlayerDisconnecting,
  onPlayerReconnected,
  onRoomReset,
}: UseMultiplayerOptions) {

  const convexRoomId = roomId as Id<"rooms">;

  // Query room state
  const roomState = useQuery(api.rooms.getRoomState, roomId ? { roomId: convexRoomId } : "skip");

  // Subscribe to actions
  // We cast to any or unknown first to avoid "missing property" errors if types aren't fully generated yet
  const recentActionsRaw = useQuery(api.rooms.getActions, roomId ? { roomId: convexRoomId } : "skip");
  const recentActions = recentActionsRaw as ActionLog[] | undefined;

  // Mutations
  const startGameMutation = useMutation(api.rooms.startGame);
  const sendActionMutation = useMutation(api.rooms.gameAction);
  const syncStateMutation = useMutation(api.rooms.syncState);
  const leaveGameMutation = useMutation(api.rooms.leaveRoom);

  // Local state to track changes and fire callbacks
  const prevRoomStateRef = useRef<any>(null);
  const lastProcessedActionTimeRef = useRef<number>(Date.now());

  // Handle Action Stream
  useEffect(() => {
    if (recentActions) {
      // Filter for new actions we haven't processed
      const newActions = recentActions
        .filter(a => a.timestamp > lastProcessedActionTimeRef.current)
        .sort((a, b) => a.timestamp - b.timestamp);

      newActions.forEach(a => {
        // Fire callback
        onGameAction?.(a.action, a.playerId);

        // Update cursor
        lastProcessedActionTimeRef.current = Math.max(lastProcessedActionTimeRef.current, a.timestamp);
      });
    }
  }, [recentActions, onGameAction]);

  // Handle Room State syncing
  useEffect(() => {
    if (!roomState) return;

    // Check for game start
    if (roomState.gameStarted && !prevRoomStateRef.current?.gameStarted) {
      // Explicit mapping to avoid type errors
      const players: PlayerInfo[] = roomState.players.map((p: any) => ({
        id: p._id,
        name: p.name,
        connectionId: p.connectionId,
        isHost: p.isHost,
        isReady: p.isReady,
        disconnectedAt: undefined // p.lastSeen logic todo
      }));
      onGameStart?.(players);
    }

    // Check for state sync
    if (roomState.gameState) {
      if (JSON.stringify(roomState.gameState) !== JSON.stringify(prevRoomStateRef.current?.gameState)) {
        onStateSync?.(roomState.gameState);
      }
    }

    prevRoomStateRef.current = roomState;
  }, [roomState, onGameStart, onStateSync]);

  const startGame = useCallback(async () => {
    if (roomId) {
      await startGameMutation({ roomId: convexRoomId });
    }
  }, [roomId, convexRoomId, startGameMutation]);

  const sendAction = useCallback(async (action: GameAction) => {
    if (roomId && playerId) {
      // Send to server - do NOT fire locally (wait for subscription echo)
      await sendActionMutation({ roomId: convexRoomId, action, playerId });
    }
  }, [roomId, playerId, convexRoomId, sendActionMutation]);

  const syncState = useCallback(async (state: GameState) => {
    if (roomId) {
      await syncStateMutation({ roomId: convexRoomId, state });
    }
  }, [roomId, convexRoomId, syncStateMutation]);

  const leaveGame = useCallback(async () => {
    if (playerId) {
      await leaveGameMutation({ playerId: playerId as Id<"players"> });
    }
  }, [playerId, leaveGameMutation]);

  const isHost = roomState?.hostId === playerId;

  // explicit map to verify types
  const mappedPlayers: PlayerInfo[] = roomState ? roomState.players.map((p: any) => ({
    id: p._id,
    name: p.name,
    connectionId: p.connectionId,
    isHost: p.isHost,
    isReady: p.isReady,
    disconnectedAt: p.lastSeen ? (Date.now() - p.lastSeen > 10000 ? p.lastSeen : undefined) : undefined
  })) : [];

  // Derived disconnected players for UI
  const disconnectedPlayers: { playerId: string; playerName: string }[] = mappedPlayers
    .filter(p => p.disconnectedAt)
    .map(p => ({ playerId: p.id, playerName: p.name }));

  return {
    connected: !!roomState,
    reconnecting: false,
    room: roomState ? {
      players: mappedPlayers,
      gameStarted: roomState.gameStarted,
      hostId: roomState.hostId,
      code: roomState.code,
    } : null,
    error: null,
    isHost,
    disconnectedPlayers,
    startGame,
    sendAction,
    syncState,
    leaveGame,
  };
}
