import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random 6-character room code
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export const createRoom = mutation({
    args: { playerName: v.string() },
    handler: async (ctx, args) => {
        const code = generateRoomCode();

        // Create the room
        const roomId = await ctx.db.insert("rooms", {
            code,
            hostId: "", // Will update after creating player
            gameStarted: false,
            lastAction: Date.now(),
        });

        // Create the host player
        const playerId = await ctx.db.insert("players", {
            roomId,
            name: args.playerName,
            connectionId: "init", // Can be updated later
            isHost: true,
            isReady: false,
            lastSeen: Date.now(),
        });

        // Update room with host ID
        await ctx.db.patch(roomId, { hostId: playerId });

        return { roomId, code, playerId };
    },
});

export const joinRoom = mutation({
    args: { roomCode: v.string(), playerName: v.string() },
    handler: async (ctx, args) => {
        const room = await ctx.db
            .query("rooms")
            .withIndex("by_code", (q) => q.eq("code", args.roomCode))
            .first();

        if (!room) {
            throw new Error("Room not found");
        }

        if (room.gameStarted) {
            // Optional: allow rejoin
        }

        const playerId = await ctx.db.insert("players", {
            roomId: room._id,
            name: args.playerName,
            connectionId: "init",
            isHost: false,
            isReady: false,
            lastSeen: Date.now(),
        });

        return { roomId: room._id, code: room.code, playerId };
    },
});

export const getRoomState = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId);
        if (!room) return null;

        const players = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        return { ...room, players };
    },
});

export const leaveRoom = mutation({
    args: { playerId: v.id("players") },
    handler: async (ctx, args) => {
        const player = await ctx.db.get(args.playerId);
        if (!player) return;

        await ctx.db.delete(args.playerId);

        const remainingPlayers = await ctx.db
            .query("players")
            .withIndex("by_room", (q) => q.eq("roomId", player.roomId))
            .first();

        if (remainingPlayers) {
            if (player.isHost) {
                await ctx.db.patch(remainingPlayers._id, { isHost: true });
                await ctx.db.patch(player.roomId, { hostId: remainingPlayers._id });
            }
        } else {
            await ctx.db.delete(player.roomId);
        }
    },
});

export const startGame = mutation({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roomId, { gameStarted: true });
    },
});

export const syncState = mutation({
    args: { roomId: v.id("rooms"), state: v.any() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.roomId, { gameState: args.state });
    },
});

// Send an action (fire and forget, tracked by DB)
export const gameAction = mutation({
    args: { roomId: v.id("rooms"), action: v.any(), playerId: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert("actions", {
            roomId: args.roomId,
            playerId: args.playerId,
            action: args.action,
            timestamp: Date.now(),
        });
        // Update room timestamp to trigger quick reactivity if needed
        await ctx.db.patch(args.roomId, { lastAction: Date.now() });
    },
});

// Fetch actions for a room (allows simple polling/subscription)
export const getActions = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("actions")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .order("desc")
            .take(20); // Keep it light, we only need recent ones for sync
    },
});
