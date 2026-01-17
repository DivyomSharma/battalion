import type * as Party from "partykit/server";

// Message types
interface JoinMessage {
  type: "join";
  playerName: string;
  playerId: string;
}

interface StartGameMessage {
  type: "start_game";
}

interface GameActionMessage {
  type: "game_action";
  action: unknown;
  playerId: string;
}

interface SyncStateMessage {
  type: "sync_state";
  state: unknown;
}

interface PingMessage {
  type: "ping";
}

interface LeaveGameMessage {
  type: "leave_game";
  playerId: string;
}

interface PlayerInfo {
  id: string;
  name: string;
  connectionId: string;
  isHost: boolean;
  isReady: boolean;
  disconnectedAt?: number; // Timestamp when player disconnected (for grace period)
}

interface RoomState {
  players: PlayerInfo[];
  gameStarted: boolean;
  gameState: unknown | null;
  hostId: string | null;
}

interface ResetRoomMessage {
  type: "reset_room";
}

type IncomingMessage = JoinMessage | StartGameMessage | GameActionMessage | SyncStateMessage | PingMessage | LeaveGameMessage | ResetRoomMessage;

// Grace period in milliseconds before removing a disconnected player
const DISCONNECT_GRACE_PERIOD_MS = 60000; // 60 seconds

export default class GameRoom implements Party.Server {
  // Enable hibernation to prevent connection drops during idle periods
  static options = {
    hibernate: true,
  };

  room: RoomState = {
    players: [],
    gameStarted: false,
    gameState: null,
    hostId: null,
  };

  // Track last ping time for each connection
  lastPingTime: Map<string, number> = new Map();

  // Track pending disconnection timers (playerId -> timer)
  pendingDisconnects: Map<string, ReturnType<typeof setTimeout>> = new Map();

  constructor(readonly party: Party.Party) { }

  async onStart() {
    try {
      // Load persisted state if exists
      // VERSION BUMP: Changed key to 'room_v2' to force reset all old rooms
      const stored = await this.party.storage.get<RoomState>("room_v2");
      if (stored) {
        this.room = stored;
      }
    } catch (error) {
      console.error("[GameRoom] Error in onStart:", error);
    }
  }

  async saveState() {
    try {
      await this.party.storage.put("room_v2", this.room);
    } catch (error) {
      console.error("[GameRoom] Error saving state:", error);
    }
  }

  // Reset the room to initial state (for reuse after game ends)
  async resetRoom() {
    // Cancel all pending disconnect timers
    for (const timer of this.pendingDisconnects.values()) {
      clearTimeout(timer);
    }
    this.pendingDisconnects.clear();
    this.lastPingTime.clear();

    // Reset room state
    this.room = {
      players: [],
      gameStarted: false,
      gameState: null,
      hostId: null,
    };

    // Delete persisted state
    await this.party.storage.delete("room_v2");
    console.log("[GameRoom] Room has been reset for reuse");
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      console.log(`[GameRoom] New connection: ${conn.id}`);

      // Track connection time
      this.lastPingTime.set(conn.id, Date.now());

      // Send current room state to new connection
      conn.send(JSON.stringify({
        type: "room_state",
        room: {
          players: this.room.players,
          gameStarted: this.room.gameStarted,
          hostId: this.room.hostId,
        },
        gameState: this.room.gameState,
      }));
    } catch (error) {
      console.error("[GameRoom] Error in onConnect:", error);
    }
  }

  async onClose(conn: Party.Connection) {
    try {
      console.log(`[GameRoom] Connection closed: ${conn.id}`);

      // Clean up ping tracking
      this.lastPingTime.delete(conn.id);

      // Need to find which player disconnected
      const playerIndex = this.room.players.findIndex(p => p.connectionId === conn.id);

      if (playerIndex !== -1) {
        const player = this.room.players[playerIndex];
        console.log(`[GameRoom] Player disconnected: ${player.name} (${player.id})`);

        // If game hasn't started, remove immediately (lobby behavior)
        if (!this.room.gameStarted) {
          this.room.players.splice(playerIndex, 1);

          // If room is empty, RESET state
          if (this.room.players.length === 0) {
            this.room = {
              players: [],
              gameStarted: false,
              gameState: null,
              hostId: null,
            };
            await this.party.storage.delete("room_v2");
            return;
          }

          // Reassign host if needed
          if (player.isHost && this.room.players.length > 0) {
            this.room.players[0].isHost = true;
            this.room.hostId = this.room.players[0].id;
          }

          this.party.broadcast(JSON.stringify({
            type: "player_left",
            playerId: player.id,
            players: this.room.players,
            hostId: this.room.hostId,
            gameStarted: this.room.gameStarted,
          }));

          await this.saveState();
          return;
        }

        // GAME IN PROGRESS: Use grace period for reconnection
        // Mark player as disconnected but don't remove yet
        player.disconnectedAt = Date.now();

        // Notify other players that this player is temporarily disconnected
        this.party.broadcast(JSON.stringify({
          type: "player_disconnecting",
          playerId: player.id,
          playerName: player.name,
          gracePeriodMs: DISCONNECT_GRACE_PERIOD_MS,
        }));

        await this.saveState();

        // Start grace period timer
        const disconnectTimer = setTimeout(async () => {
          // Check if player is still disconnected (didn't reconnect)
          const currentPlayer = this.room.players.find(p => p.id === player.id);
          if (currentPlayer && currentPlayer.disconnectedAt) {
            console.log(`[GameRoom] Grace period expired for ${player.name}, removing from game`);

            // Remove player now
            const idx = this.room.players.findIndex(p => p.id === player.id);
            if (idx !== -1) {
              this.room.players.splice(idx, 1);
            }

            // Clean up timer tracking
            this.pendingDisconnects.delete(player.id);

            // If room is empty, reset
            if (this.room.players.length === 0) {
              this.room = {
                players: [],
                gameStarted: false,
                gameState: null,
                hostId: null,
              };
              await this.party.storage.delete("room_v2");
              return;
            }

            // Reassign host if needed
            if (player.isHost && this.room.players.length > 0) {
              this.room.players[0].isHost = true;
              this.room.hostId = this.room.players[0].id;
            }

            // Broadcast final removal
            this.party.broadcast(JSON.stringify({
              type: "player_left",
              playerId: player.id,
              players: this.room.players,
              hostId: this.room.hostId,
              gameStarted: this.room.gameStarted,
            }));

            await this.saveState();
          }
        }, DISCONNECT_GRACE_PERIOD_MS);

        // Track the timer so we can cancel it if player reconnects
        this.pendingDisconnects.set(player.id, disconnectTimer);
      }
    } catch (error) {
      console.error("[GameRoom] Error in onClose:", error);
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as IncomingMessage;

      switch (data.type) {
        // Handle ping for keep-alive
        case "ping": {
          this.lastPingTime.set(sender.id, Date.now());
          sender.send(JSON.stringify({ type: "pong" }));
          break;
        }

        case "join": {
          // Check if game already started
          if (this.room.gameStarted) {
            // Allow rejoin if player was in game (strict ID match only)
            const existingPlayer = this.room.players.find(p => p.id === data.playerId);

            if (existingPlayer) {
              // Cancel any pending disconnect timer
              const pendingTimer = this.pendingDisconnects.get(data.playerId);
              if (pendingTimer) {
                clearTimeout(pendingTimer);
                this.pendingDisconnects.delete(data.playerId);
                console.log(`[GameRoom] Cancelled disconnect timer for ${existingPlayer.name} - player reconnected`);
              }

              // Clear disconnected state
              const wasDisconnected = !!existingPlayer.disconnectedAt;
              existingPlayer.disconnectedAt = undefined;
              existingPlayer.connectionId = sender.id;

              sender.send(JSON.stringify({
                type: "rejoined",
                room: {
                  players: this.room.players,
                  gameStarted: this.room.gameStarted,
                  hostId: this.room.hostId,
                },
                gameState: this.room.gameState,
              }));

              // Notify other players that this player is back
              if (wasDisconnected) {
                this.party.broadcast(JSON.stringify({
                  type: "player_reconnected",
                  playerId: data.playerId,
                  playerName: existingPlayer.name,
                  players: this.room.players,
                }), [sender.id]);
              }

              // Also save state so the new connectionId is persisted
              await this.saveState();
              return;
            }
            sender.send(JSON.stringify({
              type: "error",
              message: "Game already in progress",
            }));
            return;
          }

          // Check if room is full (max 5 players)
          if (this.room.players.length >= 5) {
            sender.send(JSON.stringify({
              type: "error",
              message: "Room is full",
            }));
            return;
          }

          // Check if player ID already exists
          const existingPlayer = this.room.players.find(p => p.id === data.playerId);
          if (existingPlayer) {
            existingPlayer.connectionId = sender.id;
            existingPlayer.name = data.playerName;
          } else {
            // Add new player
            const isHost = this.room.players.length === 0;
            const player: PlayerInfo = {
              id: data.playerId,
              name: data.playerName,
              connectionId: sender.id,
              isHost,
              isReady: false,
            };
            this.room.players.push(player);
            if (isHost) {
              this.room.hostId = player.id;
            }
          }

          // Broadcast updated player list
          this.party.broadcast(JSON.stringify({
            type: "player_joined",
            players: this.room.players,
            hostId: this.room.hostId,
          }));

          await this.saveState();
          break;
        }

        case "start_game": {
          // Only host can start
          const starter = this.room.players.find(p => p.connectionId === sender.id);
          if (!starter?.isHost) {
            sender.send(JSON.stringify({
              type: "error",
              message: "Only the host can start the game",
            }));
            return;
          }

          // Need at least 2 players
          if (this.room.players.length < 2) {
            sender.send(JSON.stringify({
              type: "error",
              message: "Need at least 2 players to start",
            }));
            return;
          }

          this.room.gameStarted = true;

          // Broadcast game start
          this.party.broadcast(JSON.stringify({
            type: "game_started",
            players: this.room.players,
          }));

          await this.saveState();
          break;
        }

        case "game_action": {
          // Validate it's from active player (done on client, but could add server validation)
          // Broadcast action to all players
          this.party.broadcast(JSON.stringify({
            type: "game_action",
            action: data.action,
            playerId: data.playerId,
          }), [sender.id]); // Don't send back to sender

          break;
        }

        case "leave_game": {
          // Intentional leave - remove player immediately (no grace period)
          const playerIndex = this.room.players.findIndex(p => p.id === data.playerId);

          if (playerIndex !== -1) {
            const player = this.room.players[playerIndex];
            console.log(`[GameRoom] Player ${player.name} intentionally left the game`);

            // Cancel any pending disconnect timer for this player
            const pendingTimer = this.pendingDisconnects.get(data.playerId);
            if (pendingTimer) {
              clearTimeout(pendingTimer);
              this.pendingDisconnects.delete(data.playerId);
            }

            // Remove player immediately
            this.room.players.splice(playerIndex, 1);

            // If room is empty, reset for reuse
            if (this.room.players.length === 0) {
              console.log('[GameRoom] Room is empty, resetting for reuse');
              await this.resetRoom();
              return;
            }

            // Reassign host if needed
            if (player.isHost && this.room.players.length > 0) {
              this.room.players[0].isHost = true;
              this.room.hostId = this.room.players[0].id;
            }

            // Broadcast player left to all (including the leaver for confirmation)
            this.party.broadcast(JSON.stringify({
              type: "player_left",
              playerId: player.id,
              players: this.room.players,
              hostId: this.room.hostId,
              gameStarted: this.room.gameStarted,
            }));

            await this.saveState();
          }
          break;
        }

        case "sync_state": {
          // Host syncs authoritative state
          const syncer = this.room.players.find(p => p.connectionId === sender.id);
          if (syncer?.isHost) {
            this.room.gameState = data.state;

            // Broadcast to all other players, include players list for ID mapping
            this.party.broadcast(JSON.stringify({
              type: "state_sync",
              state: data.state,
              players: this.room.players,
            }), [sender.id]);

            // Note: We don't auto-reset on GAME_OVER - let players view the screen
            // They will be redirected to home when they click "Play Again" or leave

            // Check if only 1 player remains during active game - auto-reset
            // But only if the game is NOT over (so winner can still see the screen)
            const gameState = data.state as { phase?: string } | null;
            if (this.room.gameStarted && this.room.players.length === 1 && gameState?.phase !== 'GAME_OVER') {
              console.log('[GameRoom] Only 1 player remaining, resetting room');
              // Notify the remaining player
              this.party.broadcast(JSON.stringify({
                type: "room_reset",
                reason: "All other players left the game",
              }));
              await this.resetRoom();
            }

            await this.saveState();
          }
          break;
        }

        case "reset_room": {
          // Manual reset request (e.g., from game over screen)
          console.log('[GameRoom] Manual room reset requested');

          // Notify all players
          this.party.broadcast(JSON.stringify({
            type: "room_reset",
            reason: "Game ended",
          }));

          await this.resetRoom();
          break;
        }
      }
    } catch (error) {
      console.error("[GameRoom] Error in onMessage:", error);
      // Send error to the sender so they know something went wrong
      try {
        sender.send(JSON.stringify({
          type: "error",
          message: "Server error processing message",
        }));
      } catch {
        // Ignore send errors
      }
    }
  }
}

