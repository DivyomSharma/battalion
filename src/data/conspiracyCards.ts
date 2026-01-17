import { ConspiracyCard } from '@/types/game';

// The Battalion Black Ops Cards
// Black Ops cards are covert instant actions costing 4-5 resources
// They can be purchased during the Action phase and played immediately or held

export const conspiracyCardTemplates: ConspiracyCard[] = [
  // Redeployment Blockers
  {
    id: 'conspiracy_veto',
    name: 'Tactical Veto',
    description: 'Block any one Redeployment action this round. The Battalion stays in place.',
    cost: { clout: 2, trust: 2 },
    effect: { type: 'BLOCK_REDEPLOYMENT' },
    isInstant: true,
  },
  {
    id: 'conspiracy_safe_zone',
    name: 'Fortified Position',
    description: 'Protect one Sector from all Redeployments for the rest of this round.',
    cost: { funds: 2, trust: 2 },
    effect: { type: 'PROTECT_ZONE' },
    isInstant: true,
  },

  // Resource Manipulation
  {
    id: 'conspiracy_bribe',
    name: 'Asset Seizure',
    description: 'Seize 2 resources of your choice from any one enemy Commander.',
    cost: { funds: 3, clout: 1 },
    effect: { type: 'STEAL_RESOURCES', value: 2 },
    isInstant: true,
  },
  {
    id: 'conspiracy_scandal',
    name: 'Sabotage',
    description: 'All enemy Commanders lose 1 resource of your choice.',
    cost: { media: 3, clout: 1 },
    effect: { type: 'RESOURCE_DRAIN', value: 1 },
    isInstant: true,
  },
  {
    id: 'conspiracy_embezzle',
    name: 'Supply Raid',
    description: 'Steal 1 resource from each enemy Commander.',
    cost: { funds: 4 },
    effect: { type: 'STEAL_RESOURCES', value: 1, targetCount: -1 }, // -1 means all opponents
    isInstant: true,
  },

  // Battalion Manipulation
  {
    id: 'conspiracy_coup',
    name: 'Surgical Strike',
    description: 'Remove one enemy Battalion from any Sector (not Hot Zones). The Battalion is eliminated permanently.',
    cost: { clout: 3, funds: 2 },
    effect: { type: 'REMOVE_BATTALION', targetCount: 1 },
    isInstant: true,
  },
  {
    id: 'conspiracy_defection',
    name: 'Force Redeploy',
    description: 'Move one of your enemy\'s Battalions to an adjacent Sector.',
    cost: { trust: 2, media: 2 },
    effect: { type: 'BATTALION_TRANSFER', targetCount: 1 },
    isInstant: true,
  },
  {
    id: 'conspiracy_swap',
    name: 'Tactical Shuffle',
    description: 'Swap the positions of any two Battalions on the map (cannot involve Hot Zones).',
    cost: { media: 2, clout: 2 },
    effect: { type: 'SWAP_BATTALIONS', targetCount: 2 },
    isInstant: true,
  },

  // Intel Manipulation
  {
    id: 'conspiracy_intel_sweep',
    name: 'Intel Sweep',
    description: 'Gain 1 resource of each type (if room permits). Maximum 12 total resources.',
    cost: { media: 4 },
    effect: { type: 'GAIN_ALL_RESOURCES' },
    isInstant: true,
  },

  // Turn Manipulation
  {
    id: 'conspiracy_emergency',
    name: 'Rapid Response',
    description: 'Take an additional Action phase after your current turn ends.',
    cost: { funds: 2, clout: 2, trust: 1 },
    effect: { type: 'EXTRA_TURN' },
    isInstant: false, // Held until used
  },
];

// Conspiracy card deck for the game
let conspiracyDeck: ConspiracyCard[] = [];

export function initializeConspiracyDeck(): ConspiracyCard[] {
  // Create multiple copies of each card for the deck
  const deck: ConspiracyCard[] = [];

  for (const template of conspiracyCardTemplates) {
    // Add 2 copies of each card
    for (let i = 0; i < 2; i++) {
      deck.push({
        ...template,
        id: `${template.id}_${i}_${Date.now()}`,
      });
    }
  }

  // Shuffle the deck
  conspiracyDeck = deck.sort(() => Math.random() - 0.5);
  return conspiracyDeck;
}

export function drawConspiracyCard(): ConspiracyCard | null {
  if (conspiracyDeck.length === 0) {
    initializeConspiracyDeck();
  }

  return conspiracyDeck.pop() || null;
}

export function getConspiracyDeck(): ConspiracyCard[] {
  return conspiracyDeck;
}

export function shuffleConspiracyDeck(): ConspiracyCard[] {
  if (conspiracyDeck.length === 0) {
    return initializeConspiracyDeck();
  }
  conspiracyDeck = conspiracyDeck.sort(() => Math.random() - 0.5);
  return conspiracyDeck;
}
