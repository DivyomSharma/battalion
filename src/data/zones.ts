import { Zone } from '@/types/game';

// The Battalion Map Layout:
// 3x3 Grid displayed as:
//   zone_1 | zone_6 | zone_2
//   zone_0 | zone_8 | zone_3
//   zone_4 | zone_7 | zone_5
//
// Adjacency is based on grid neighbors (orthogonal + diagonal)

export const zoneDefinitions: Omit<Zone, 'slots' | 'lockedSlots' | 'majorityOwner' | 'majorityBattalionCount'>[] = [
  // ROW 2 (middle-left): zone_0 - Iron Gate
  {
    id: 'zone_0', name: 'Iron Gate', capacity: 17, majorityRequired: 9, volatileSlots: [8],
    adjacentZones: ['zone_1', 'zone_6', 'zone_8', 'zone_4', 'zone_7'], // up, up-right, right, down, down-right
    position: { x: 0, y: 50 }
  },

  // ROW 1 (top-left): zone_1 - Frozen Reach
  {
    id: 'zone_1', name: 'Frozen Reach', capacity: 11, majorityRequired: 6, volatileSlots: [5],
    adjacentZones: ['zone_6', 'zone_0', 'zone_8'], // right, down, down-right
    position: { x: 0, y: 0 }
  },

  // ROW 1 (top-right): zone_2 - Storm Peak
  {
    id: 'zone_2', name: 'Storm Peak', capacity: 11, majorityRequired: 6, volatileSlots: [5],
    adjacentZones: ['zone_6', 'zone_8', 'zone_3'], // left, down-left, down
    position: { x: 100, y: 0 }
  },

  // ROW 2 (middle-right): zone_3 - Shadow Pass
  {
    id: 'zone_3', name: 'Shadow Pass', capacity: 17, majorityRequired: 9, volatileSlots: [8],
    adjacentZones: ['zone_2', 'zone_6', 'zone_8', 'zone_7', 'zone_5'], // up, up-left, left, down, down-left
    position: { x: 100, y: 50 }
  },

  // ROW 3 (bottom-left): zone_4 - Dead Drop
  {
    id: 'zone_4', name: 'Dead Drop', capacity: 11, majorityRequired: 6, volatileSlots: [5],
    adjacentZones: ['zone_0', 'zone_8', 'zone_7'], // up, up-right, right
    position: { x: 0, y: 100 }
  },

  // ROW 3 (bottom-right): zone_5 - Ember Coast
  {
    id: 'zone_5', name: 'Ember Coast', capacity: 11, majorityRequired: 6, volatileSlots: [5],
    adjacentZones: ['zone_8', 'zone_3', 'zone_7'], // up-left, up, left
    position: { x: 100, y: 100 }
  },

  // ROW 1 (top-center): zone_6 - Northern Citadel
  {
    id: 'zone_6', name: 'Northern Citadel', capacity: 21, majorityRequired: 11, volatileSlots: [10, 20],
    adjacentZones: ['zone_1', 'zone_2', 'zone_0', 'zone_8', 'zone_3'], // left, right, down-left, down, down-right
    position: { x: 50, y: 0 }
  },

  // ROW 3 (bottom-center): zone_7 - Southern Bastion
  {
    id: 'zone_7', name: 'Southern Bastion', capacity: 21, majorityRequired: 11, volatileSlots: [10, 20],
    adjacentZones: ['zone_0', 'zone_8', 'zone_3', 'zone_4', 'zone_5'], // up-left, up, up-right, left, right
    position: { x: 50, y: 100 }
  },

  // ROW 2 (center): zone_8 - The Nexus
  {
    id: 'zone_8', name: 'The Nexus', capacity: 9, majorityRequired: 5, volatileSlots: [4],
    adjacentZones: ['zone_1', 'zone_6', 'zone_2', 'zone_0', 'zone_3', 'zone_4', 'zone_7', 'zone_5'], // all 8 surrounding
    position: { x: 50, y: 50 }
  },
];

export function initializeZones(): Record<string, Zone> {
  const zones: Record<string, Zone> = {};
  for (const zoneDef of zoneDefinitions) {
    zones[zoneDef.id] = {
      ...zoneDef,
      slots: Array(zoneDef.capacity).fill(null),
      lockedSlots: Array(zoneDef.capacity).fill(false),
      majorityOwner: null,
      majorityBattalionCount: 0,
    };
  }
  return zones;
}

export function isAdjacent(zoneAId: string, zoneBId: string, zones: Record<string, Zone>): boolean {
  const zoneA = zones[zoneAId];
  return zoneA ? zoneA.adjacentZones.includes(zoneBId) : false;
}

export function isVolatileSlot(zone: Zone, slotIndex: number): boolean {
  return zone.volatileSlots.includes(slotIndex);
}

export function getMajorityRequirement(zone: Zone): number {
  return zone.majorityRequired;
}
