import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    rooms: defineTable({
        code: v.string(),
        hostId: v.string(), // ID of the player who is host
        gameStarted: v.boolean(),
        lastAction: v.optional(v.number()), // Timestamp of last action
        gameState: v.optional(v.any()), // Full game state object
    }).index("by_code", ["code"]),

    actions: defineTable({
        roomId: v.id("rooms"),
        playerId: v.string(),
        action: v.any(),
        timestamp: v.number(),
    }).index("by_room", ["roomId"]),

    players: defineTable({
        roomId: v.id("rooms"),
        name: v.string(),
        connectionId: v.string(), // For tracking active connections if needed
        isHost: v.boolean(),
        isReady: v.boolean(),
        lastSeen: v.number(),
    }).index("by_room", ["roomId"]),
});
