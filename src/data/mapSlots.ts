
import { SLOT_LAYOUTS } from './slotLayouts';

export interface BattalionSlot {
    id: string; // "zone_X-slot_Y"
    x: number;  // 0-100%
    y: number;  // 0-100%
    sectorId: string; // "zone_X"
    index: number;
}

export const SLOTS_BY_SECTOR: Record<string, BattalionSlot[]> = {};
export const ALL_SLOTS: BattalionSlot[] = [];

Object.entries(SLOT_LAYOUTS).forEach(([zoneId, coords]) => {
    const slots: BattalionSlot[] = coords.map((pos, idx) => ({
        id: `${zoneId}-slot-${idx}`,
        x: pos.x,
        y: pos.y,
        sectorId: zoneId,
        index: idx
    }));

    SLOTS_BY_SECTOR[zoneId] = slots;
    ALL_SLOTS.push(...slots);
});
