import {
  GameState,
  Player,
  Zone,
  Resources,
  IdeologyType,
  ResourceType,
  GamePhase,
  GameLogEntry,
  ZoneMajority,
  PowerUsage,
  ConspiracyCard,
  TradeOffer,
  FirstPlayerSelection,
  ResourceSelection,
  ResourceGain,
  EliteId,
  MAX_RESOURCES,
  PLAYER_COLORS,
  IdeologyCard,
  HeadlineCard,
  DeploymentOrder,
} from '@/types/game';
import { initializeZones, isAdjacent, isVolatileSlot } from '@/data/zones';
import { ideologyCards, shuffleDeck } from '@/data/ideologyCards';
import { shuffleHeadlineDeck } from '@/data/headlineCards';
import { generateDeploymentShop, refreshDeploymentOrder } from '@/data/deploymentOrders';
import { hasUnlockedPower, canUsePower } from '@/data/powers';
import { conspiracyCardTemplates } from '@/data/conspiracyCards';
import {
  getQualifiedElites,
  meetsEliteRequirements,
  getEliteCard,
  hasActiveElite,
  getResourceCap,
  getIdeologyRewardMultiplier,
  getConspiracyDiscount,
  getBonusRedeploymentMoves,
  hasDictatorConversion,
} from '@/data/elites';
import { resourceNames, commanderNames } from '@/data/displayNames';

export function createPlayer(id: string, name: string, color: string, startingResources?: Partial<Resources>): Player {
  return {
    id,
    name,
    color,
    resources: {
      funds: startingResources?.funds ?? 0,
      clout: startingResources?.clout ?? 0,
      media: startingResources?.media ?? 0,
      trust: startingResources?.trust ?? 0,
    },
    ideologyTracks: { capitalist: 0, supremo: 0, showstopper: 0, idealist: 0 },
    battalionReserve: 0,
    evictedBattalions: 0, // Battalions evicted by Supply Blockade - must be placed next turn
    conspiracyCards: [],
    isActive: true,
    // Elite-related fields
    unlockedElites: [],
    activeElite: null,
    storedBattalions: 0, // For Technocrat
    eliteUsedThisTurn: false,
  };
}

export function createPowerUsage(): PowerUsage {
  return {
    capitalistL3: 0, // Prospecting uses this turn (max 1)
    capitalistL5: 0, // Land Grab evictions this turn (max 3)
    supremoL3: 0,    // Donations snatches this turn (max 2)
    supremoL5: 0,    // Payback discards this turn (max 2)
    showstopperL3: 0, // Going Viral bonuses this turn (max 2)
    idealistL3: 0,   // Helping Hands discounts this turn (max 2)
    idealistL5: 0,   // Tough Love conversions this turn (max 1)
    redeploymentUsed: 0, // Number of redeploys used this turn
  };
}

export function initializeGame(playerNames: string[], playerColors?: string[]): GameState {
  const players: Record<string, Player> = {};
  const playerIds: string[] = [];
  const playerCount = playerNames.length;

  // For 2-player mode: each player gets 8 resources (2 of each type)
  // For 3+ player mode: players will choose their resources in RESOURCE_SELECTION phase
  const twoPlayerResources: Partial<Resources> = { funds: 2, clout: 2, media: 2, trust: 2 };

  // Prepare colors
  let assignedColors: string[] = [];

  if (playerColors && playerColors.length >= playerCount) {
    // Use provided colors (already shuffled/assigned by Setup)
    assignedColors = [...playerColors];
  } else {
    // Fallback: Shuffle internal PLAYER_COLORS
    // We need to map shuffled indices to color strings
    const colorIndices = Array.from({ length: 5 }, (_, i) => i);
    for (let i = colorIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colorIndices[i], colorIndices[j]] = [colorIndices[j], colorIndices[i]];
    }
    assignedColors = colorIndices.map(i => PLAYER_COLORS[i]);
  }

  playerNames.forEach((name, index) => {
    const id = `player_${index + 1}`;
    const startingResources = playerCount === 2 ? twoPlayerResources : undefined;

    // Safety check for color
    const color = assignedColors[index] || PLAYER_COLORS[index % PLAYER_COLORS.length];

    players[id] = createPlayer(id, name, color, startingResources);
    playerIds.push(id);
  });

  // For 3+ players: set up resource selection
  // Starting resources: 4-5-6-7-8 for players 1-5
  const STARTING_RESOURCES = [4, 5, 6, 7, 8];
  let resourceSelection: ResourceSelection | null = null;
  if (playerCount >= 3) {
    const allowedAmounts: Record<string, number> = {};
    playerIds.forEach((id, index) => {
      allowedAmounts[id] = STARTING_RESOURCES[index] || 4;
    });
    resourceSelection = {
      selections: {},
      allowedAmounts,
    };
  }

  // Determine starting phase
  // 2 players: go straight to FIRST_PLAYER_SELECTION (bidding)
  // 3+ players: start with FIRST_PLAYER_SELECTION (voting), then RESOURCE_SELECTION
  const startingPhase: GamePhase = 'FIRST_PLAYER_SELECTION';

  return {
    id: `game_${Date.now()}`,
    turnNumber: 1,
    activePlayerId: playerIds[0], // Will be updated after first player selection
    phase: startingPhase,
    zones: initializeZones(),
    players,
    deploymentShop: generateDeploymentShop(),
    currentIdeologyCard: null,
    currentHeadlineCard: null,
    ideologyDeck: shuffleDeck(ideologyCards),
    headlineDeck: shuffleHeadlineDeck(),
    gameLog: [],
    winner: null,
    powerUsage: createPowerUsage(),
    pendingTrade: null,
    lastResourceGain: null,
    firstPlayerSelection: {
      votes: {},
      bids: {},
      revoteCount: 0,
    },
    resourceSelection,
    stateVersion: 0,
    protectedZones: [],
    redeploymentBlocked: false,
    extraActionPhase: false,
    // Elite-related state
    mafiosoOwnerId: null,
    pendingMafiosoTax: false,
    activistPeekResult: null,
    patronTriggered: false,
    whistleblowerActive: null,
    conspiracyPlayedThisRound: false,
    turnsRemaining: null,
    redeploymentBlockerId: null,
    protectedZoneExpirations: {},
    startingPlayerId: null,
    marketVersion: 0,
    lastBlackOpsPlayed: null,
  };
}

export function addToLog(state: GameState, playerId: string, action: string, details: string): GameState {
  const entry: GameLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    playerId,
    action,
    details,
  };
  return {
    ...state,
    gameLog: [...state.gameLog, entry],
  };
}

// Resource helpers
export function getTotalResources(resources: Resources): number {
  return resources.funds + resources.clout + resources.media + resources.trust;
}

export function canAfford(playerResources: Resources, cost: Partial<Resources>): boolean {
  return (
    (cost.funds ?? 0) <= playerResources.funds &&
    (cost.clout ?? 0) <= playerResources.clout &&
    (cost.media ?? 0) <= playerResources.media &&
    (cost.trust ?? 0) <= playerResources.trust
  );
}

export function subtractResources(resources: Resources, cost: Partial<Resources>): Resources {
  return {
    funds: Math.max(0, resources.funds - (cost.funds ?? 0)),
    clout: Math.max(0, resources.clout - (cost.clout ?? 0)),
    media: Math.max(0, resources.media - (cost.media ?? 0)),
    trust: Math.max(0, resources.trust - (cost.trust ?? 0)),
  };
}

export function addResources(resources: Resources, gain: Partial<Resources>): Resources {
  const currentTotal = getTotalResources(resources);
  const maxResources = MAX_RESOURCES;
  const space = maxResources - currentTotal;

  // If already at or over cap, do not add anything (keep old ones)
  if (space <= 0) {
    return resources;
  }

  // Calculate potential gain total
  const gainFunds = gain.funds ?? 0;
  const gainClout = gain.clout ?? 0;
  const gainMedia = gain.media ?? 0;
  const gainTrust = gain.trust ?? 0;
  const totalGain = gainFunds + gainClout + gainMedia + gainTrust;

  // If gain fits entirely, just add it
  if (totalGain <= space) {
    return {
      funds: resources.funds + gainFunds,
      clout: resources.clout + gainClout,
      media: resources.media + gainMedia,
      trust: resources.trust + gainTrust,
    };
  }

  // If gain exceeds space, adding only up to the limit
  // We need to decide WHICH resources to discard.
  // Logic: Pro-rate the gain to fill the remaining space.
  // Or simplified: Fill in order? No, pro-rate is fairer.
  // Actually, since resources are integers, pro-rating is messy.
  // Let's just add as much as we can while maintaining approximate ratio, or just clamp sequentially.
  // User just said "not adding the additional ones".
  // Let's try filling sequentially for simplicity and predictability.
  let remainingSpace = space;
  let newFunds = resources.funds;
  let newClout = resources.clout;
  let newMedia = resources.media;
  let newTrust = resources.trust;

  const toAdd = [
    { type: 'funds', amount: gainFunds },
    { type: 'clout', amount: gainClout },
    { type: 'media', amount: gainMedia },
    { type: 'trust', amount: gainTrust }
  ] as const;

  for (const item of toAdd) {
    if (remainingSpace <= 0) break;
    const addAmount = Math.min(item.amount, remainingSpace);
    if (item.type === 'funds') newFunds += addAmount;
    if (item.type === 'clout') newClout += addAmount;
    if (item.type === 'media') newMedia += addAmount;
    if (item.type === 'trust') newTrust += addAmount;
    remainingSpace -= addAmount;
  }

  return {
    funds: newFunds,
    clout: newClout,
    media: newMedia,
    trust: newTrust,
  };
}

// Zone majority calculation - per SHASN rules:
// A majority is formed when a player has >= majorityRequired voters in the zone
// Once formed, the majority is locked until broken (if player falls below requirement)
export function calculateZoneMajority(zone: Zone, players: Record<string, Player>): ZoneMajority {
  const counts: Record<string, number> = {};

  for (const playerId of Object.keys(players)) {
    counts[playerId] = 0;
  }

  for (const slot of zone.slots) {
    if (slot) {
      counts[slot] = (counts[slot] || 0) + 1;
    }
  }

  // Check if anyone has reached the majority requirement
  let majorityOwner: string | null = null;
  const majorityRequired = zone.majorityRequired;

  for (const [playerId, count] of Object.entries(counts)) {
    if (count >= majorityRequired) {
      majorityOwner = playerId;
      break;
    }
  }

  // Calculate if there's a tie for most voters (for redeployment purposes)
  let maxCount = 0;
  let isTied = false;
  for (const count of Object.values(counts)) {
    if (count > maxCount) {
      maxCount = count;
      isTied = false;
    } else if (count === maxCount && count > 0) {
      isTied = true;
    }
  }

  return {
    zoneId: zone.id,
    counts,
    majorityOwner,
    isTied,
  };
}

// Get the player with the most voters in a zone (for redeployment rights)
// Returns null if tied or no voters
export function getRedeploymentRightsHolder(zone: Zone, players: Record<string, Player>): string | null {
  const counts: Record<string, number> = {};

  for (const playerId of Object.keys(players)) {
    counts[playerId] = 0;
  }

  for (const slot of zone.slots) {
    if (slot) {
      counts[slot] = (counts[slot] || 0) + 1;
    }
  }

  let maxCount = 0;
  let leader: string | null = null;
  let isTied = false;

  for (const [playerId, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      leader = playerId;
      isTied = false;
    } else if (count === maxCount && count > 0) {
      isTied = true;
    }
  }

  // Per SHASN rules: if tied, no one has redeployment rights
  // CRITICAL FIX: To have redeployment rights, you must have the MAJORITY of the zone (> 50% of capacity),
  // not just the plurality (most) of the currently filled slots.
  if (isTied || maxCount === 0 || maxCount < zone.majorityRequired) {
    return null;
  }

  return leader;
}

export function getPlayerVoterCountInZone(zone: Zone, playerId: string): number {
  return zone.slots.filter(slot => slot === playerId).length;
}

export function getFilledSlotsCount(zone: Zone): number {
  return zone.slots.filter(slot => slot !== null).length;
}

export function getMajorityThreshold(zone: Zone): number {
  const filled = getFilledSlotsCount(zone);
  return Math.floor(filled / 2) + 1;
}

// Per SHASN rules for redeployment:
// - You gain redeployment rights by having the MOST voters in a zone (not majority)
// - If tied for most, no one has rights
// - Can move ANY player's voters (not just your own)
// - Cannot move voters from volatile slots
// - Can only move NON-MAJORITY voters (voters used to form a majority are locked)
// - Three movement types:
//   * IN: Move voter from adjacent zone INTO controlled zone (use destination's rights)
//   * OUT: Move voter from controlled zone OUT to adjacent zone (use source's rights)
//   * BETWEEN: Move voter through controlled zone (from adjacent to adjacent via controlled)
export function canRedeploy(
  state: GameState,
  playerId: string,
  fromZoneId: string,
  toZoneId: string,
  fromSlot: number,
  toSlot: number
): { valid: boolean; reason?: string } {
  // Check if redeployment is globally blocked (by conspiracy card)
  if (state.redeploymentBlocked) {
    const blockerName = state.redeploymentBlockerId ? state.players[state.redeploymentBlockerId]?.name : 'Consipracy Card';
    return { valid: false, reason: `Redeployment is blocked this round by ${blockerName}` };
  }

  // Check if either zone is protected
  if (state.protectedZones.includes(fromZoneId)) {
    return { valid: false, reason: 'Source Sector is protected from redeployment' };
  }
  if (state.protectedZones.includes(toZoneId)) {
    return { valid: false, reason: 'Destination Sector is protected from redeployment' };
  }

  const fromZone = state.zones[fromZoneId];
  const toZone = state.zones[toZoneId];

  if (!fromZone || !toZone) {
    return { valid: false, reason: 'Invalid Sector' };
  }

  // Check adjacency
  if (!isAdjacent(fromZoneId, toZoneId, state.zones)) {
    return { valid: false, reason: 'Sectors are not adjacent' };
  }

  // Determine which zone gives the player redeployment rights
  const fromZoneGerryHolder = getRedeploymentRightsHolder(fromZone, state.players);
  const toZoneGerryHolder = getRedeploymentRightsHolder(toZone, state.players);

  // Player must have redeployment rights in EITHER the source OR destination zone
  // OUT: rights in source, IN: rights in destination
  const hasRightsInSource = fromZoneGerryHolder === playerId;
  const hasRightsInDestination = toZoneGerryHolder === playerId;

  if (!hasRightsInSource && !hasRightsInDestination) {
    return { valid: false, reason: 'You need redeployment rights in either the source or destination Sector' };
  }

  // Check source slot has a voter
  if (fromZone.slots[fromSlot] === null) {
    return { valid: false, reason: 'Source slot is empty' };
  }

  // Check if source slot is a volatile area - cannot move voters from volatile slots
  if (isVolatileSlot(fromZone, fromSlot)) {
    return { valid: false, reason: 'Cannot move Battalions from Hot Zones' };
  }

  // Check if voter is locked (part of a formed majority)
  // Showstopper L5 (Election Fever) allows moving majority voters
  const player = state.players[playerId];
  const canMoveMajorityVoters = hasUnlockedPower(player.ideologyTracks, 'showstopper', 5);
  if (fromZone.lockedSlots[fromSlot] && !canMoveMajorityVoters) {
    return { valid: false, reason: 'Cannot move Control Battalions (unlock Operative L5 to enable)' };
  }

  // Check destination slot is empty
  if (toZone.slots[toSlot] !== null) {
    return { valid: false, reason: 'Destination slot is occupied' };
  }

  // Check destination slot is not volatile
  if (isVolatileSlot(toZone, toSlot)) {
    return { valid: false, reason: 'Cannot move Battalions into Hot Zones' };
  }

  // Special rule: Cannot move your only voter out of a zone using that zone's redeployment rights
  // This only applies when using OUT movement (rights in source zone)
  const voterOwner = fromZone.slots[fromSlot]!;
  if (hasRightsInSource && voterOwner === playerId) {
    const currentCount = getPlayerVoterCountInZone(fromZone, playerId);
    if (currentCount === 1) {
      return { valid: false, reason: 'Cannot move your only Battalion out using this Sector\'s rights' };
    }
  }

  return { valid: true };
}

// Game phase transitions
export function drawIdeologyCard(state: GameState): GameState {
  if (state.ideologyDeck.length === 0) {
    // Reshuffle
    state = {
      ...state,
      ideologyDeck: shuffleDeck(ideologyCards),
    };
  }

  const [drawnCard, ...remainingDeck] = state.ideologyDeck;

  return addToLog(
    {
      ...state,
      currentIdeologyCard: drawnCard,
      ideologyDeck: remainingDeck,
    },
    state.activePlayerId,
    'DRAW_CARD',
    `Received Situation Report briefing`
  );
}

// Per SHASN rules: Before answering, you can redraw by paying any 4 resources
export function redrawIdeologyCard(state: GameState): GameState {
  const player = state.players[state.activePlayerId];
  const totalResources = getTotalResources(player.resources);

  // Need at least 4 resources to redraw
  if (totalResources < 4) {
    return state;
  }

  // Must be in answering phase with a current card
  if (state.phase !== 'ANSWERING' || !state.currentIdeologyCard) {
    return state;
  }

  // Deduct 4 resources (any combination - for simplicity, deduct evenly)
  let remaining = 4;
  const newResources = { ...player.resources };
  const types: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

  for (const type of types) {
    if (remaining <= 0) break;
    const deduct = Math.min(newResources[type], remaining);
    newResources[type] -= deduct;
    remaining -= deduct;
  }

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
  };

  // Discard current card and draw a new one
  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [player.id]: updatedPlayer,
    },
  };

  newState = addToLog(newState, player.id, 'REDRAW_CARD', 'Paid 4 resources to request new Situation Report');

  // Draw new card
  return drawIdeologyCard(newState);
}

export function answerIdeologyCard(state: GameState, choice: 'A' | 'B'): GameState {
  if (!state.currentIdeologyCard) {
    return state;
  }

  const card = state.currentIdeologyCard;
  const option = choice === 'A' ? card.optionA : card.optionB;
  const player = state.players[state.activePlayerId];

  // Get old tracks to calculate passive bonus change
  const oldTracks = player.ideologyTracks;

  // Update ideology track
  const newTracks = {
    ...player.ideologyTracks,
    [option.ideology]: player.ideologyTracks[option.ideology] + 1,
  };

  // Apply Lobbyist elite bonus: double the base resources
  const rewardMultiplier = getIdeologyRewardMultiplier(player);
  const baseResources: Partial<Resources> = {
    funds: (option.resources.funds || 0) * rewardMultiplier,
    clout: (option.resources.clout || 0) * rewardMultiplier,
    media: (option.resources.media || 0) * rewardMultiplier,
    trust: (option.resources.trust || 0) * rewardMultiplier,
  };

  // Add resources from the card answer (with Lobbyist bonus if applicable)
  let newResources = addResources(player.resources, baseResources);

  // Apply passive bonuses per L2 powers:
  // Once you have 2+ cards of an ideology type (L2 unlocked), you get +1 of that resource type
  // for EVERY ideology card you answer (not just when crossing thresholds)
  // Each passive bonus triggers independently based on your track levels
  const passiveBonus: Partial<Resources> = {
    funds: newTracks.capitalist >= 2 ? 1 : 0,   // Contractor L2: +1 Supply per answer
    clout: newTracks.supremo >= 2 ? 1 : 0,      // Hardliner L2: +1 Firepower per answer
    media: newTracks.showstopper >= 2 ? 1 : 0,  // Operative L2: +1 Intel per answer
    trust: newTracks.idealist >= 2 ? 1 : 0,     // Diplomat L2: +1 Morale per answer
  };

  // Only add the passive bonus if there's any
  const totalPassive = (passiveBonus.funds || 0) + (passiveBonus.clout || 0) +
    (passiveBonus.media || 0) + (passiveBonus.trust || 0);
  if (totalPassive > 0) {
    newResources = addResources(newResources, passiveBonus);
  }

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
    ideologyTracks: newTracks,
  };

  // Calculate total resources gained for display (including Lobbyist bonus)
  const totalGain: Partial<Resources> = {
    funds: (baseResources.funds || 0) + (passiveBonus.funds || 0),
    clout: (baseResources.clout || 0) + (passiveBonus.clout || 0),
    media: (baseResources.media || 0) + (passiveBonus.media || 0),
    trust: (baseResources.trust || 0) + (passiveBonus.trust || 0),
  };

  const resourceGain: ResourceGain = {
    base: baseResources, // Shows doubled if Lobbyist
    passiveBonus: totalPassive > 0 ? passiveBonus : {},
    total: totalGain,
  };

  let updatedState = addToLog(
    {
      ...state,
      players: {
        ...state.players,
        [player.id]: updatedPlayer,
      },
      currentIdeologyCard: null,
      phase: 'ACTION' as GamePhase,
      lastResourceGain: resourceGain,
    },
    player.id,
    'ANSWER_CARD',
    `Answered "${choice === 'A' ? card.optionA.text : card.optionB.text}" (+${commanderNames[option.ideology]})`
  );

  // Log passive bonus if any
  if (totalPassive > 0) {
    const bonusStr = Object.entries(passiveBonus)
      .filter(([, v]) => v && v > 0)
      .map(([k, v]) => `+${v} ${resourceNames[k as ResourceType]}`)
      .join(', ');
    updatedState = addToLog(updatedState, player.id, 'PASSIVE_BONUS', `Passive bonus: ${bonusStr}`);
  }

  // Check for power unlocks at level 3 and 5
  const newLevel = newTracks[option.ideology];
  if (newLevel === 3 || newLevel === 5) {
    updatedState = addToLog(
      updatedState,
      player.id,
      'POWER_UNLOCK',
      `Unlocked ${commanderNames[option.ideology]} L${newLevel} power!`
    );
  }

  // Check for elite unlocks after gaining ideology cards
  updatedState = checkAndUnlockElites(updatedState, player.id);

  // Log Lobbyist bonus if applicable
  if (rewardMultiplier > 1) {
    updatedState = addToLog(updatedState, player.id, 'LOBBYIST_BONUS', 'Lobbyist doubled Situation Report rewards!');
  }

  return updatedState;
}

export function buyDeploymentOrder(state: GameState, cardId: string): GameState {
  const card = state.deploymentShop.find(c => c.id === cardId);
  if (!card) return state;

  const player = state.players[state.activePlayerId];
  if (!canAfford(player.resources, card.cost)) return state;

  const newResources = subtractResources(player.resources, card.cost);
  const newBattalionBank = player.battalionReserve + card.battalions;

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
    battalionReserve: newBattalionBank,
  };

  const newMarket = refreshDeploymentOrder(state.deploymentShop, cardId);

  let newState = addToLog(
    {
      ...state,
      players: {
        ...state.players,
        [player.id]: updatedPlayer,
      },
      deploymentShop: newMarket,
    },
    player.id,
    'BUY_VOTERS',
    `Requisitioned ${card.battalions} Battalion(s)`
  );

  // Check for Patron trigger (opponent with Patron gets free voter when 3+ voter card bought)
  newState = checkPatronTrigger(newState, player.id, card.battalions);

  return newState;
}

export function placeBattalion(state: GameState, zoneId: string, slotIndex: number): GameState {
  const zone = state.zones[zoneId];
  const player = state.players[state.activePlayerId];

  if (!zone || player.battalionReserve <= 0) return state;
  if (zone.slots[slotIndex] !== null) return state;

  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[slotIndex] = player.id;

  // If placing in volatile slot, lock it immediately
  const isVolatile = isVolatileSlot(zone, slotIndex);
  if (isVolatile) {
    newLockedSlots[slotIndex] = true;
  }

  let updatedZone: Zone = {
    ...zone,
    slots: newSlots,
    lockedSlots: newLockedSlots,
  };

  const updatedPlayer: Player = {
    ...player,
    battalionReserve: player.battalionReserve - 1,
  };

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: updatedZone,
    },
    players: {
      ...state.players,
      [player.id]: updatedPlayer,
    },
  };

  newState = addToLog(newState, player.id, 'PLACE_BATTALION', `Deployed Battalion to ${zone.name}`);

  // Check if a majority was just formed
  newState = checkAndFormMajority(newState, zoneId);

  // Check for volatile slot trigger - triggers headline at end of turn
  if (isVolatile) {
    newState = triggerHeadline(newState);
  }

  // Check if all slots are now filled - end game immediately
  const gameEndCheck = checkGameEnd(newState);
  if (gameEndCheck.ended) {
    return {
      ...newState,
      phase: 'GAME_OVER',
      winner: gameEndCheck.winner,
    };
  }

  return newState;
}

// Check if a player has formed a majority in a zone and lock in the majority voters
export function checkAndFormMajority(state: GameState, zoneId: string): GameState {
  const zone = state.zones[zoneId];
  const majority = calculateZoneMajority(zone, state.players);

  // If majority already formed, check if it should be broken
  if (zone.majorityOwner) {
    const currentCount = getPlayerVoterCountInZone(zone, zone.majorityOwner);
    if (currentCount < zone.majorityRequired) {
      // Majority is broken - unlock all voters and reset
      const newLockedSlots = zone.lockedSlots.map((locked, i) => {
        // Keep volatile slots locked
        if (isVolatileSlot(zone, i)) return locked;
        return false;
      });

      return addToLog(
        {
          ...state,
          zones: {
            ...state.zones,
            [zoneId]: {
              ...zone,
              majorityOwner: null,
              majorityBattalionCount: 0,
              lockedSlots: newLockedSlots,
            },
          },
        },
        zone.majorityOwner,
        'MAJORITY_BROKEN',
        `Lost Control of ${zone.name}`
      );
    }
    return state;
  }

  // Check if someone just formed a majority
  if (majority.majorityOwner) {
    const majorityPlayerId = majority.majorityOwner;
    const majorityRequired = zone.majorityRequired;

    // Lock in the majority voters (mark the first N voters of this player)
    const newLockedSlots = [...zone.lockedSlots];
    let locked = 0;
    for (let i = 0; i < zone.slots.length && locked < majorityRequired; i++) {
      if (zone.slots[i] === majorityPlayerId && !newLockedSlots[i]) {
        newLockedSlots[i] = true;
        locked++;
      }
    }

    return addToLog(
      {
        ...state,
        zones: {
          ...state.zones,
          [zoneId]: {
            ...zone,
            majorityOwner: majorityPlayerId,
            majorityBattalionCount: majorityRequired,
            lockedSlots: newLockedSlots,
          },
        },
      },
      majorityPlayerId,
      'MAJORITY_FORMED',
      `Secured Control of ${zone.name} (${majorityRequired} Battalions)`
    );
  }

  return state;
}

export function triggerHeadline(state: GameState): GameState {
  if (state.headlineDeck.length === 0) {
    state = {
      ...state,
      headlineDeck: shuffleHeadlineDeck(),
    };
  }

  const [headline, ...remainingDeck] = state.headlineDeck;

  let newState: GameState = {
    ...state,
    currentHeadlineCard: headline,
    headlineDeck: remainingDeck,
  };

  newState = addToLog(newState, state.activePlayerId, 'FLASHPOINT', `Flashpoint: ${headline.title} - ${headline.description}`);

  // Apply headline effect
  newState = applyHeadlineEffect(newState, headline);

  // Keep the headline card visible for display (will be cleared by UI)
  return newState;
}

// Clear headline after it's been displayed
export function clearHeadline(state: GameState): GameState {
  return {
    ...state,
    currentHeadlineCard: null,
  };
}

// Clear resource gain display
export function clearResourceGain(state: GameState): GameState {
  return {
    ...state,
    lastResourceGain: null,
  };
}

// =============================================================================
// RESOURCE SELECTION (3+ players)
// =============================================================================

/**
 * Select starting resources (3+ players mode)
 * Each player chooses which resources they want based on their allowed amount
 * Player N gets to choose N resources (to offset first player advantage)
 */
export function selectStartingResources(
  state: GameState,
  playerId: string,
  resources: Partial<Resources>
): GameState {
  if (state.phase !== 'RESOURCE_SELECTION') return state;
  if (!state.resourceSelection) return state;

  const player = state.players[playerId];
  if (!player) return state;

  // Check if player has already selected
  if (state.resourceSelection.selections[playerId]) return state;

  // Validate total resources matches allowed amount
  const allowedAmount = state.resourceSelection.allowedAmounts[playerId];
  const totalSelected = (resources.funds || 0) + (resources.clout || 0) +
    (resources.media || 0) + (resources.trust || 0);

  if (totalSelected !== allowedAmount) return state;

  // Apply resources to player
  const updatedPlayer: Player = {
    ...player,
    resources: {
      funds: resources.funds || 0,
      clout: resources.clout || 0,
      media: resources.media || 0,
      trust: resources.trust || 0,
    },
  };

  // Record the selection
  const newSelections = {
    ...state.resourceSelection.selections,
    [playerId]: resources,
  };

  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    resourceSelection: {
      ...state.resourceSelection,
      selections: newSelections,
    },
  };

  newState = addToLog(newState, playerId, 'SELECT_RESOURCES', `${player.name} selected their starting resources`);

  // Check if all players have selected - then move to ANSWERING (start game)
  const playerCount = Object.keys(state.players).length;
  if (Object.keys(newSelections).length === playerCount) {
    newState = {
      ...newState,
      phase: 'ANSWERING' as GamePhase,
      resourceSelection: null,
    };
    newState = addToLog(newState, '', 'PHASE_CHANGE', 'All players have selected resources. Starting the game!');

    // Draw initial ideology card for the first player
    newState = drawIdeologyCard(newState);
  }

  return newState;
}

// =============================================================================
// FIRST PLAYER SELECTION
// =============================================================================

/**
 * Vote for first player (3+ players mode)
 * Each player votes for who they want to go first
 * Most votes wins, ties cause a revote
 */
export function voteFirstPlayer(state: GameState, voterId: string, voteForId: string): GameState {
  if (state.phase !== 'FIRST_PLAYER_SELECTION') return state;
  if (!state.firstPlayerSelection) return state;

  const playerCount = Object.keys(state.players).length;
  if (playerCount <= 2) return state; // Use bidding for 2 players

  // Can't vote for yourself
  if (voterId === voteForId) return state;

  // Record the vote
  const newVotes = {
    ...state.firstPlayerSelection.votes,
    [voterId]: voteForId,
  };

  let newState: GameState = {
    ...state,
    firstPlayerSelection: {
      ...state.firstPlayerSelection,
      votes: newVotes,
    },
  };

  newState = addToLog(newState, voterId, 'VOTE', `Voted for ${state.players[voteForId].name} to go first`);

  // Check if all players have voted
  if (Object.keys(newVotes).length === playerCount) {
    return resolveFirstPlayerVote(newState);
  }

  return newState;
}

function resolveFirstPlayerVote(state: GameState): GameState {
  if (!state.firstPlayerSelection) return state;

  const votes = state.firstPlayerSelection.votes;
  const voteCounts: Record<string, number> = {};

  // Count votes
  for (const voteForId of Object.values(votes)) {
    voteCounts[voteForId] = (voteCounts[voteForId] || 0) + 1;
  }

  // Find winner(s)
  let maxVotes = 0;
  let winners: string[] = [];

  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winners = [playerId];
    } else if (count === maxVotes) {
      winners.push(playerId);
    }
  }

  // If tie, need to revote
  if (winners.length > 1) {
    const newState = addToLog(state, '', 'REVOTE', `Tie between ${winners.map(id => state.players[id].name).join(' and ')} - voting again`);
    return {
      ...newState,
      firstPlayerSelection: {
        votes: {},
        bids: {},
        revoteCount: state.firstPlayerSelection.revoteCount + 1,
      },
    };
  }

  // We have a winner!
  const winnerId = winners[0];
  let newState = addToLog(state, winnerId, 'FIRST_PLAYER', `${state.players[winnerId].name} was voted to go first!`);

  // Calculate resource allowances based on turn order starting from winner
  const playerIds = Object.keys(state.players);
  // Assuming playerIds are sorted/stable ['player_1', 'player_2', ...]
  // We need to find the index of winner, then assign 1 to winner, 2 to next, etc.
  const winnerIndex = playerIds.indexOf(winnerId);
  const allowedAmounts: Record<string, number> = {};

  for (let i = 0; i < playerIds.length; i++) {
    // Offset index: (originalIndex - winnerIndex + total) % total
    // Wait, simpler: The winner gets 1 (index 0 relative), next gets 2...
    const relativeIndex = (i - winnerIndex + playerIds.length) % playerIds.length;
    // But we are iterating i as the original index.
    // Let's iterate steps 0 to N-1
    // Step 0 is winner.
  }

  // Iterate 0 to N-1 to assign allowances
  // Starting resources: 4-5-6-7-8 based on turn order
  const STARTING_RESOURCES_BY_ORDER = [4, 5, 6, 7, 8];
  for (let step = 0; step < playerIds.length; step++) {
    const targetIndex = (winnerIndex + step) % playerIds.length;
    const targetPlayerId = playerIds[targetIndex];
    // First player gets 4, second gets 5, etc.
    allowedAmounts[targetPlayerId] = STARTING_RESOURCES_BY_ORDER[step] || 4;
  }

  // For 3+ players: Go to RESOURCE_SELECTION
  // For 2 players: This function (vote) isn't used (bid is used), but for safety/completeness:
  const isMultiplayer = playerIds.length >= 3;

  if (isMultiplayer) {
    newState = {
      ...newState,
      activePlayerId: winnerId,
      startingPlayerId: winnerId,
      phase: 'RESOURCE_SELECTION' as GamePhase,
      firstPlayerSelection: null,
      resourceSelection: {
        selections: {},
        allowedAmounts,
      },
    };
    return addToLog(newState, '', 'PHASE_CHANGE', 'Starting resource selection phase.');
  } else {
    // Fallback for 2 players (shouldn't happen here usually)
    newState = {
      ...newState,
      activePlayerId: winnerId,
      phase: 'ANSWERING' as GamePhase,
      firstPlayerSelection: null,
    };
    return drawIdeologyCard(newState);
  }
}

/**
 * Bid for first player (2 players mode)
 * Each player secretly bids resources
 * Highest total bid wins, all bid resources return to public reserve
 */
export function bidFirstPlayer(state: GameState, bidderId: string, bid: Partial<Resources>): GameState {
  if (state.phase !== 'FIRST_PLAYER_SELECTION') return state;
  if (!state.firstPlayerSelection) return state;

  const playerCount = Object.keys(state.players).length;
  if (playerCount !== 2) return state; // Only for 2 players

  const player = state.players[bidderId];
  if (!player) return state;

  // Verify player can afford the bid
  if (!canAfford(player.resources, bid)) return state;

  // Record the bid
  const newBids = {
    ...state.firstPlayerSelection.bids,
    [bidderId]: bid,
  };

  let newState: GameState = {
    ...state,
    firstPlayerSelection: {
      ...state.firstPlayerSelection,
      bids: newBids,
    },
  };

  const bidTotal = (bid.funds || 0) + (bid.clout || 0) + (bid.media || 0) + (bid.trust || 0);
  newState = addToLog(newState, bidderId, 'BID', `Placed a bid of ${bidTotal} total resources`);

  // Check if both players have bid
  if (Object.keys(newBids).length === 2) {
    return resolveFirstPlayerBid(newState);
  }

  return newState;
}

function resolveFirstPlayerBid(state: GameState): GameState {
  if (!state.firstPlayerSelection) return state;

  const bids = state.firstPlayerSelection.bids;
  const playerIds = Object.keys(state.players);

  // Calculate bid totals
  const bidTotals: Record<string, number> = {};
  for (const playerId of playerIds) {
    const bid = bids[playerId] || {};
    bidTotals[playerId] = (bid.funds || 0) + (bid.clout || 0) + (bid.media || 0) + (bid.trust || 0);
  }

  const [player1, player2] = playerIds;
  const total1 = bidTotals[player1];
  const total2 = bidTotals[player2];

  // If tie, rebid
  if (total1 === total2) {
    const newState = addToLog(state, '', 'REBID', `Both players bid ${total1} - bidding again`);
    return {
      ...newState,
      firstPlayerSelection: {
        votes: {},
        bids: {},
        revoteCount: state.firstPlayerSelection.revoteCount + 1,
      },
    };
  }

  // Determine winner (highest bid)
  const winnerId = total1 > total2 ? player1 : player2;

  // Remove bid resources from both players (return to public reserve)
  const updatedPlayers: Record<string, Player> = {};
  for (const playerId of playerIds) {
    const player = state.players[playerId];
    const bid = bids[playerId] || {};
    updatedPlayers[playerId] = {
      ...player,
      resources: subtractResources(player.resources, bid),
    };
  }

  let newState = addToLog(
    { ...state, players: updatedPlayers },
    winnerId,
    'FIRST_PLAYER',
    `${state.players[winnerId].name} won the bid with ${bidTotals[winnerId]} resources!`
  );

  // Start the game with the winner going first
  newState = {
    ...newState,
    activePlayerId: winnerId,
    startingPlayerId: winnerId,
    phase: 'ANSWERING' as GamePhase,
    firstPlayerSelection: null,
  };

  return drawIdeologyCard(newState);
}

function applyHeadlineEffect(state: GameState, headline: HeadlineCard): GameState {
  const effect = headline.effect;
  let newState = { ...state };
  const players = { ...state.players };

  switch (effect.type) {
    case 'GLOBAL_RESOURCE_MOD':
      if (effect.resource && effect.value !== undefined) {
        for (const playerId of Object.keys(players)) {
          if (effect.targetType === 'all' ||
            (effect.targetType === 'active' && playerId === state.activePlayerId) ||
            (effect.targetType === 'others' && playerId !== state.activePlayerId)) {
            const player = players[playerId];
            const change: Partial<Resources> = { [effect.resource]: Math.abs(effect.value) };
            players[playerId] = {
              ...player,
              resources: effect.value > 0
                ? addResources(player.resources, change)
                : subtractResources(player.resources, change),
            };
            newState = addToLog(newState, playerId, 'FLASHPOINT_EFFECT', `${effect.value > 0 ? 'Gained' : 'Lost'} ${Math.abs(effect.value)} ${resourceNames[effect.resource as ResourceType]} from flashpoint`);
          }
        }
      }
      break;

    case 'PLAYER_RESOURCE_MOD':
      if (effect.resource && effect.value !== undefined) {
        const targetId = effect.targetType === 'active' ? state.activePlayerId : null;
        if (targetId) {
          const player = players[targetId];
          const change: Partial<Resources> = { [effect.resource]: Math.abs(effect.value) };
          players[targetId] = {
            ...player,
            resources: effect.value > 0
              ? addResources(player.resources, change)
              : subtractResources(player.resources, change),
          };
          newState = addToLog(newState, targetId, 'FLASHPOINT_EFFECT', `${effect.value > 0 ? 'Gained' : 'Lost'} ${Math.abs(effect.value)} ${resourceNames[effect.resource as ResourceType]} from flashpoint`);
        }
      }
      break;

    case 'IDEOLOGY_BONUS':
      if (effect.ideology && effect.resource && effect.value !== undefined) {
        for (const playerId of Object.keys(players)) {
          const player = players[playerId];
          const ideologyCount = player.ideologyTracks[effect.ideology];
          const bonus = ideologyCount * effect.value;
          if (bonus > 0) {
            const change: Partial<Resources> = { [effect.resource]: bonus };
            players[playerId] = {
              ...player,
              resources: addResources(player.resources, change),
            };
            newState = addToLog(newState, playerId, 'FLASHPOINT_EFFECT', `Gained ${bonus} ${resourceNames[effect.resource as ResourceType]} (${ideologyCount} ${commanderNames[effect.ideology as IdeologyType]} cards)`);
          }
        }
      }
      break;

    case 'MAJORITY_BONUS':
      if (effect.value !== undefined) {
        // Find players with/without majorities
        const playersWithMajority = new Set<string>();
        for (const zone of Object.values(state.zones)) {
          if (zone.majorityOwner) {
            playersWithMajority.add(zone.majorityOwner);
          }
        }

        for (const playerId of Object.keys(players)) {
          const hasMajority = playersWithMajority.has(playerId);
          const shouldApply =
            (effect.targetType === 'majority_holders' && hasMajority) ||
            (effect.targetType === 'no_majority' && !hasMajority);

          if (shouldApply) {
            const player = players[playerId];
            // If specific resource is given, add that; otherwise distribute evenly
            if (effect.resource) {
              const change: Partial<Resources> = { [effect.resource]: effect.value };
              players[playerId] = {
                ...player,
                resources: addResources(player.resources, change),
              };
              newState = addToLog(newState, playerId, 'FLASHPOINT_BONUS', `Gained ${effect.value} ${resourceNames[effect.resource as ResourceType]} from flashpoint!`);
            } else {
              // Distribute evenly (for "choice" effects, we'll split evenly)
              const perType = Math.floor(effect.value / 4);
              const remainder = effect.value % 4;
              const change: Partial<Resources> = {
                funds: perType + (remainder > 0 ? 1 : 0),
                clout: perType + (remainder > 1 ? 1 : 0),
                media: perType + (remainder > 2 ? 1 : 0),
                trust: perType + (remainder > 3 ? 1 : 0),
              };
              players[playerId] = {
                ...player,
                resources: addResources(player.resources, change),
              };
              const totalGained = (change.funds || 0) + (change.clout || 0) + (change.media || 0) + (change.trust || 0);
              newState = addToLog(newState, playerId, 'FLASHPOINT_BONUS', `Gained ${totalGained} resources from flashpoint!`);
            }
          }
        }
      }
      break;

    case 'VOTER_EFFECT':
      if (effect.battalionEffect === 'REMOVE_RANDOM') {
        // Find a random non-volatile voter and remove them
        const removableVoters: { zoneId: string; slotIndex: number; playerId: string }[] = [];
        for (const [zoneId, zone] of Object.entries(state.zones)) {
          for (let i = 0; i < zone.slots.length; i++) {
            if (zone.slots[i] && !isVolatileSlot(zone, i) && !zone.lockedSlots[i]) {
              removableVoters.push({ zoneId, slotIndex: i, playerId: zone.slots[i]! });
            }
          }
        }

        if (removableVoters.length > 0) {
          const target = removableVoters[Math.floor(Math.random() * removableVoters.length)];
          const zone = state.zones[target.zoneId];
          const newSlots = [...zone.slots];
          newSlots[target.slotIndex] = null;

          newState = {
            ...newState,
            zones: {
              ...newState.zones,
              [target.zoneId]: {
                ...zone,
                slots: newSlots,
              },
            },
          };
          newState = checkAndFormMajority(newState, target.zoneId);
        }
      } else if (effect.battalionEffect === 'ADD_FREE_BATTALION') {
        // Active player gains 1 voter in their bank
        const activePlayer = players[state.activePlayerId];
        players[state.activePlayerId] = {
          ...activePlayer,
          battalionReserve: activePlayer.battalionReserve + 1,
        };
      }
      break;

    case 'MARKET_EFFECT':
      // Reshuffle the voter market
      newState = {
        ...newState,
        deploymentShop: generateDeploymentShop(),
      };
      break;

    case 'ZONE_EFFECT':
      // Zone effects would need UI interaction to select a zone
      // For now, these are logged but not fully implemented
      break;
  }

  return { ...newState, players };
}

// Count how many zones a player has redeployment rights in
function countZonesWithRedeploymentRights(state: GameState, playerId: string): number {
  let count = 0;
  for (const zone of Object.values(state.zones)) {
    if (getRedeploymentRightsHolder(zone, state.players) === playerId) {
      count++;
    }
  }
  return count;
}

// Check if player has any valid redeploy moves available
function hasValidRedeploymentMoves(state: GameState, playerId: string): boolean {
  // If redeployment is globally blocked, no moves available
  if (state.redeploymentBlocked) {
    return false;
  }

  const player = state.players[playerId];
  const canMoveMajorityVoters = hasUnlockedPower(player.ideologyTracks, 'showstopper', 5);

  // Check each zone where player has redeployment rights
  for (const zone of Object.values(state.zones)) {
    const rightsHolder = getRedeploymentRightsHolder(zone, state.players);

    // Skip if player doesn't have rights in this zone
    if (rightsHolder !== playerId) continue;

    // Skip if zone is protected
    if (state.protectedZones.includes(zone.id)) continue;

    // Check for OUT moves: move voters from this zone to adjacent zones
    for (let fromSlot = 0; fromSlot < zone.slots.length; fromSlot++) {
      const voter = zone.slots[fromSlot];

      // Skip empty slots, volatile slots, and locked slots (unless player can move majority voters)
      if (voter === null) continue;
      if (isVolatileSlot(zone, fromSlot)) continue;
      if (zone.lockedSlots[fromSlot] && !canMoveMajorityVoters) continue;

      // Special rule: cannot move your only voter out
      if (voter === playerId && getPlayerVoterCountInZone(zone, playerId) === 1) continue;

      // Check if we can move this voter to any adjacent zone
      for (const adjZoneId of zone.adjacentZones) {
        const adjZone = state.zones[adjZoneId];
        if (!adjZone || state.protectedZones.includes(adjZoneId)) continue;

        // Look for empty, non-volatile slots in the adjacent zone
        for (let toSlot = 0; toSlot < adjZone.slots.length; toSlot++) {
          if (adjZone.slots[toSlot] === null && !isVolatileSlot(adjZone, toSlot)) {
            return true; // Found a valid move!
          }
        }
      }
    }

    // Check for IN moves: move voters from adjacent zones into this zone
    for (const adjZoneId of zone.adjacentZones) {
      const adjZone = state.zones[adjZoneId];
      if (!adjZone || state.protectedZones.includes(adjZoneId)) continue;

      // Look for moveable voters in adjacent zone
      for (let fromSlot = 0; fromSlot < adjZone.slots.length; fromSlot++) {
        const voter = adjZone.slots[fromSlot];

        // Skip empty slots, volatile slots, and locked slots (unless player can move majority voters)
        if (voter === null) continue;
        if (isVolatileSlot(adjZone, fromSlot)) continue;
        if (adjZone.lockedSlots[fromSlot] && !canMoveMajorityVoters) continue;

        // Check if we can move this voter to our controlled zone
        for (let toSlot = 0; toSlot < zone.slots.length; toSlot++) {
          if (zone.slots[toSlot] === null && !isVolatileSlot(zone, toSlot)) {
            return true; // Found a valid move!
          }
        }
      }
    }
  }

  return false; // No valid moves found
}

export function executeRedeployment(
  state: GameState,
  fromZoneId: string,
  toZoneId: string,
  fromSlot: number,
  toSlot: number
): GameState {
  const validation = canRedeploy(state, state.activePlayerId, fromZoneId, toZoneId, fromSlot, toSlot);
  if (!validation.valid) return state;

  // Check if player has exceeded redeploy limit
  // Per SHASN rules: you can redeploy once per zone where you have rights
  // Election Fever (Showstopper L5) doubles this to 2 per zone
  // Guerrilla elite adds +4 bonus moves
  const player = state.players[state.activePlayerId];
  const zonesWithRights = countZonesWithRedeploymentRights(state, state.activePlayerId);
  const movesPerZone = hasUnlockedPower(player.ideologyTracks, 'showstopper', 5) ? 2 : 1;
  const bonusMoves = getBonusRedeploymentMoves(player); // Guerrilla gives +4
  const maxRedeploys = (zonesWithRights * movesPerZone) + bonusMoves;

  if (state.powerUsage.redeploymentUsed >= maxRedeploys) {
    return state; // Already used all redeploys this turn
  }

  const fromZone = state.zones[fromZoneId];
  const toZone = state.zones[toZoneId];
  const voterOwner = fromZone.slots[fromSlot]!;

  const newFromSlots = [...fromZone.slots];
  const newToSlots = [...toZone.slots];

  newFromSlots[fromSlot] = null;

  // Check for Dictator conversion: if player has Dictator and moves opponent voter
  // INTO a zone where they have majority, convert the voter
  let finalVoterOwner = voterOwner;
  let converted = false;
  if (hasDictatorConversion(player) && voterOwner !== state.activePlayerId) {
    // Check if active player has majority in destination zone BEFORE the move
    const destMajority = calculateZoneMajority(toZone, state.players);
    if (destMajority.majorityOwner === state.activePlayerId) {
      finalVoterOwner = state.activePlayerId; // Convert the voter!
      converted = true;
    }
  }

  newToSlots[toSlot] = finalVoterOwner;

  // Track redeploy usage
  const newPowerUsage = {
    ...state.powerUsage,
    redeploymentUsed: state.powerUsage.redeploymentUsed + 1,
  };

  let newState = addToLog(
    {
      ...state,
      zones: {
        ...state.zones,
        [fromZoneId]: { ...fromZone, slots: newFromSlots },
        [toZoneId]: { ...toZone, slots: newToSlots },
      },
      powerUsage: newPowerUsage,
    },
    state.activePlayerId,
    'REDEPLOYMENT',
    `Redeployed Battalion from ${fromZone.name} to ${toZone.name} (${newPowerUsage.redeploymentUsed}/${maxRedeploys} this turn)`
  );

  // Log Dictator conversion
  if (converted) {
    newState = addToLog(newState, state.activePlayerId, 'DICTATOR_CONVERT', `Dictator: converted enemy Battalion in ${toZone.name}!`);
  }

  // CRITICAL FIX: Check for majority changes in BOTH zones
  // 1. From Zone: Removing a voter might break a majority
  newState = checkAndFormMajority(newState, fromZoneId);

  // 2. To Zone: Adding a voter might form a majority
  newState = checkAndFormMajority(newState, toZoneId);

  return newState;
}

export function endActionPhase(state: GameState): GameState {
  const player = state.players[state.activePlayerId];

  // Check if game should end (all slots filled)
  const gameEndCheck = checkGameEnd(state);
  if (gameEndCheck.ended) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: gameEndCheck.winner,
    };
  }

  if (player.battalionReserve > 0) {
    // Check if there are any empty slots to place battalions
    const hasEmptySlots = Object.values(state.zones).some(zone =>
      zone.slots.some(slot => slot === null)
    );

    if (hasEmptySlots) {
      return {
        ...state,
        phase: 'DEPLOYMENT',
      };
    }
    // No empty slots - skip deployment, battalions are lost
  }

  // Check if player has any valid redeploy moves available
  // (must have rights in a zone AND have unlocked voters to move)
  if (hasValidRedeploymentMoves(state, state.activePlayerId)) {
    return {
      ...state,
      phase: 'REDEPLOYMENT',
    };
  }

  return endTurn(state);
}

export function endDeployment(state: GameState): GameState {
  // Check if player has any valid redeploy moves available
  // (must have rights in a zone AND have unlocked voters to move)
  if (hasValidRedeploymentMoves(state, state.activePlayerId)) {
    return {
      ...state,
      phase: 'REDEPLOYMENT',
    };
  }

  return endTurn(state);
}

// Check for game end
export function endTurn(state: GameState): GameState {
  const gameEndCheck = checkGameEnd(state);
  if (gameEndCheck.ended) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: gameEndCheck.winner,
    };
  }

  // Check if we need to trigger LAST_TURN phase
  // If all majorities are NOT formed AND all slots are filled, trigger the countdown
  const zones = Object.values(state.zones);
  const allMajoritiesFormed = zones.every(zone => zone.majorityOwner !== null);
  const allSlotsFilled = zones.every(zone => zone.slots.every(slot => slot !== null));

  let newTurnsRemaining = state.turnsRemaining;
  let nextPhase = state.phase;

  if (!allMajoritiesFormed && allSlotsFilled && state.turnsRemaining === null) {
    // Trigger countdown! Everyone gets 1 more turn including the next player.
    // Count = number of players.
    newTurnsRemaining = Object.keys(state.players).length;
    // We don't change phase to LAST_TURN immediately because we still need to process phases like ANSWERING/ACTION
    // But we can flag it or use LAST_TURN as a marker. 
    // Actually, keeping regular phases but tracking turnsRemaining is safer for game flow.
  }

  // If we are in the countdown, decrement it
  if (newTurnsRemaining !== null) {
    newTurnsRemaining--;
  }

  // Check for extra action phase (Emergency Session card)
  if (state.extraActionPhase) {
    return addToLog(
      {
        ...state,
        phase: 'ACTION',
        extraActionPhase: false, // Consume the extra action phase
        powerUsage: createPowerUsage(), // Reset power usage for extra action phase
        turnsRemaining: newTurnsRemaining, // Carry over
      },
      state.activePlayerId,
      'EXTRA_ACTION',
      'Emergency Session: Taking an extra Action phase!'
    );
  }

  // Move to next player
  const playerIds = Object.keys(state.players);
  const currentIndex = playerIds.indexOf(state.activePlayerId);
  const nextIndex = (currentIndex + 1) % playerIds.length;
  const nextPlayerId = playerIds[nextIndex];

  const newTurnNumber = nextIndex === 0 ? state.turnNumber + 1 : state.turnNumber;
  const nextPlayer = state.players[nextPlayerId];

  // Check if next player has evicted voters to place
  // But only if there are empty slots available
  const hasEmptySlots = Object.values(state.zones).some(zone =>
    zone.slots.some(slot => slot === null)
  );
  const startingPhase: GamePhase = (nextPlayer.evictedBattalions > 0 && hasEmptySlots) ? 'PLACE_EVICTED' : 'ANSWERING';

  let newState = addToLog(
    {
      ...state,
      activePlayerId: nextPlayerId,
      turnNumber: newTurnNumber,
      phase: startingPhase,
      powerUsage: createPowerUsage(), // Reset power usage for new turn
      turnsRemaining: newTurnsRemaining, // Save the countdown state

      // Update protected zones - only expire if it's the protector's turn again
      protectedZones: state.protectedZones.filter(zoneId => {
        const protectorId = state.protectedZoneExpirations[zoneId];
        // If no protector recorded (legacy), expire it. If protector is current player, expire it.
        if (!protectorId || protectorId === nextPlayerId) {
          return false; // Remove protection
        }
        return true; // Keep protection
      }),

      // Update redeploy block - only expire if it's the blocker's turn again
      redeploymentBlocked: state.redeploymentBlocked && state.redeploymentBlockerId !== nextPlayerId,
      redeploymentBlockerId: state.redeploymentBlockerId === nextPlayerId ? null : state.redeploymentBlockerId,

      // Update protected zone expirations map
      protectedZoneExpirations: Object.fromEntries(
        Object.entries(state.protectedZoneExpirations).filter(([, protectorId]) => protectorId !== nextPlayerId)
      ),

      extraActionPhase: false, // Reset extra action phase
    },
    nextPlayerId,
    'START_TURN',
    `Turn ${newTurnNumber} begins${nextPlayer.evictedBattalions > 0 ? ` (${nextPlayer.evictedBattalions} evicted Battalions to deploy)` : ''}`
  );

  // Draw ideology card if we're going straight to ANSWERING
  if (startingPhase === 'ANSWERING') {
    newState = drawIdeologyCard(newState);
  }

  return newState;
}

/**
 * Skip the PLACE_EVICTED phase if player has no more evicted voters
 * Also can be called after placing all evicted voters to progress
 */
export function endPlaceEvictedPhase(state: GameState): GameState {
  const player = state.players[state.activePlayerId];

  // Check if game should end (all slots filled)
  const gameEndCheck = checkGameEnd(state);
  if (gameEndCheck.ended) {
    return {
      ...state,
      phase: 'GAME_OVER',
      winner: gameEndCheck.winner,
    };
  }

  // If player still has evicted voters, check if there are empty slots
  if (player.evictedBattalions > 0) {
    const hasEmptySlots = Object.values(state.zones).some(zone =>
      zone.slots.some(slot => slot === null)
    );
    // If no empty slots, skip this phase (battalions are lost)
    if (hasEmptySlots) {
      return state;
    }
  }

  // Progress to ANSWERING phase
  let newState: GameState = {
    ...state,
    phase: 'ANSWERING',
  };

  // Draw ideology card
  newState = drawIdeologyCard(newState);

  return newState;
}

// Per SHASN rules:
// - Game ends when ALL possible majorities in ALL zones have been formed
// - OR when all slots on the board are filled (final round triggered)
// - Winner is player with highest number of MAJORITY VOTERS (not zones!)
// - Only voters used to form a majority count toward the score
export function checkGameEnd(state: GameState): { ended: boolean; winner: string | null; scores: Record<string, number> } {
  const zones = Object.values(state.zones);

  // Check if all zones have a majority formed
  const allMajoritiesFormed = zones.every(zone => zone.majorityOwner !== null);

  // Check if all slots filled
  const allSlotsFilled = zones.every(zone =>
    zone.slots.every(slot => slot !== null)
  );

  if (allMajoritiesFormed) {
    // Game ends immediately if all majorities are formed
    return calculateGameResult(state, zones);
  }

  // Game ends immediately if all slots are filled
  if (allSlotsFilled) {
    return calculateGameResult(state, zones);
  }

  // Check if we are in the final countdown
  if (state.turnsRemaining !== null && state.turnsRemaining <= 0) {
    return calculateGameResult(state, zones);
  }


  function calculateGameResult(state: GameState, zones: Zone[]): { ended: boolean; winner: string | null; scores: Record<string, number> } {
    // Calculate winner based on majority voter count (not zones!)
    const scores: Record<string, number> = {};
    for (const playerId of Object.keys(state.players)) {
      scores[playerId] = 0;
    }

    // Count majority voters for each player
    for (const zone of zones) {
      if (zone.majorityOwner) {
        // Each majority voter (the voters used to form the majority) counts as 1 point
        scores[zone.majorityOwner] += zone.majorityBattalionCount;
      }
    }

    let maxScore = -1;
    let winner: string | null = null;

    // Tie-breaker: Real-life privilege (we will pick randomly/arbitrarily or first highest as fallback for digital)
    // For digital implementation, usually tie-breaker logic is specific. 
    // Rulebook says: "If points are tied, the player with the greater 'real-life privilege' wins."
    // We will stick to first player with max score for now or shared victory logic if needed.
    // Let's stick to standard max score.

    for (const [playerId, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    }

    return { ended: true, winner, scores };
  }

  return { ended: false, winner: null, scores: {} };
}

// Get current scores for display
export function getScores(state: GameState): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const playerId of Object.keys(state.players)) {
    scores[playerId] = 0;
  }

  for (const zone of Object.values(state.zones)) {
    if (zone.majorityOwner) {
      scores[zone.majorityOwner] += zone.majorityBattalionCount;
    }
  }

  return scores;
}

export function getAvailableActions(state: GameState): string[] {
  const actions: string[] = [];
  const player = state.players[state.activePlayerId];

  switch (state.phase) {
    case 'PLACE_EVICTED':
      // Must place evicted voters
      if (player.evictedBattalions > 0) {
        for (const zone of Object.values(state.zones)) {
          for (let i = 0; i < zone.slots.length; i++) {
            if (zone.slots[i] === null) {
              actions.push(`PLACE_EVICTED_${zone.id}_${i}`);
            }
          }
        }
      }
      break;

    case 'ANSWERING':
      if (!state.currentIdeologyCard) {
        actions.push('DRAW_IDEOLOGY_CARD');
      } else {
        actions.push('ANSWER_A', 'ANSWER_B');
        // Can redraw if has 4+ resources
        if (getTotalResources(player.resources) >= 4) {
          actions.push('REDRAW_IDEOLOGY_CARD');
        }
      }
      break;

    case 'ACTION':
      // Can buy voter cards if affordable
      for (const card of state.deploymentShop) {
        if (canAfford(player.resources, card.cost)) {
          actions.push(`BUY_VOTER_${card.id}`);
        }
      }
      // Can buy conspiracy cards if affordable
      for (const card of conspiracyCardTemplates) {
        if (canAfford(player.resources, card.cost)) {
          actions.push(`BUY_CONSPIRACY_${card.id}`);
        }
      }
      // Can play conspiracy cards from hand
      for (const card of player.conspiracyCards) {
        actions.push(`PLAY_CONSPIRACY_${card.id}`);
      }
      // Can use Level 3 and Level 5 powers if unlocked and not exhausted
      if (hasUnlockedPower(player.ideologyTracks, 'capitalist', 3) && canUsePower(state.powerUsage, 'capitalist', 3)) {
        actions.push('USE_POWER_CAPITALIST_3');
      }
      if (hasUnlockedPower(player.ideologyTracks, 'capitalist', 5) && canUsePower(state.powerUsage, 'capitalist', 5)) {
        actions.push('USE_POWER_CAPITALIST_5');
      }
      if (hasUnlockedPower(player.ideologyTracks, 'supremo', 3) && canUsePower(state.powerUsage, 'supremo', 3)) {
        actions.push('USE_POWER_SUPREMO_3');
      }
      if (hasUnlockedPower(player.ideologyTracks, 'supremo', 5) && canUsePower(state.powerUsage, 'supremo', 5)) {
        actions.push('USE_POWER_SUPREMO_5');
      }
      if (hasUnlockedPower(player.ideologyTracks, 'idealist', 3) && canUsePower(state.powerUsage, 'idealist', 3)) {
        actions.push('USE_POWER_IDEALIST_3');
      }
      if (hasUnlockedPower(player.ideologyTracks, 'idealist', 5) && canUsePower(state.powerUsage, 'idealist', 5)) {
        actions.push('USE_POWER_IDEALIST_5');
      }
      // Showstopper L3 is applied during buy, L5 is passive modifier for redeploy
      actions.push('END_ACTION_PHASE');
      break;

    case 'DEPLOYMENT':
      if (player.battalionReserve > 0) {
        // Can place voters
        for (const zone of Object.values(state.zones)) {
          for (let i = 0; i < zone.slots.length; i++) {
            if (zone.slots[i] === null) {
              actions.push(`PLACE_${zone.id}_${i}`);
            }
          }
        }
      }
      // Can always end deployment (even if voters remain - they stay in bank)
      actions.push('END_DEPLOYMENT');
      break;

    case 'REDEPLOYMENT':
      // Check which zones the player has redeployment rights in
      for (const zone of Object.values(state.zones)) {
        if (getRedeploymentRightsHolder(zone, state.players) === state.activePlayerId) {
          actions.push(`REDEPLOY_FROM_${zone.id}`);
        }
      }
      actions.push('SKIP_REDEPLOYMENT');
      break;
  }

  return actions;
}

// =============================================================================
// TRADING WITH PUBLIC RESERVE
// =============================================================================

/**
 * Trade with the Public Reserve
 * Give 2 resources of one type to get 1 resource of another type
 */
export interface TradeData {
  giveResource: ResourceType;
  getResource: ResourceType;
}

export function tradeWithReserve(state: GameState, data: TradeData): GameState {
  if (state.phase !== 'ACTION') return state;

  const player = state.players[state.activePlayerId];

  // Cannot trade same resource type
  if (data.giveResource === data.getResource) {
    return state;
  }

  // Must have at least 2 of the give resource
  if (player.resources[data.giveResource] < 2) {
    return state;
  }

  // Check if adding 1 would exceed max
  if (getTotalResources(player.resources) - 2 + 1 > MAX_RESOURCES) {
    // Still allow, just won't gain the resource
  }

  const newResources = { ...player.resources };
  newResources[data.giveResource] -= 2;
  newResources[data.getResource] = Math.min(newResources[data.getResource] + 1, MAX_RESOURCES);

  // Cap total at MAX_RESOURCES
  const total = getTotalResources(newResources);
  if (total > MAX_RESOURCES) {
    const excess = total - MAX_RESOURCES;
    let remaining = excess;
    for (const type of ['funds', 'clout', 'media', 'trust'] as ResourceType[]) {
      if (remaining <= 0) break;
      const reduction = Math.min(newResources[type], remaining);
      newResources[type] -= reduction;
      remaining -= reduction;
    }
  }

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
  };

  return addToLog(
    {
      ...state,
      players: { ...state.players, [player.id]: updatedPlayer },
    },
    player.id,
    'TRADE',
    `Traded 2 ${resourceNames[data.giveResource]} for 1 ${resourceNames[data.getResource]}`
  );
}

// =============================================================================
// PLAYER-TO-PLAYER TRADING
// =============================================================================

/**
 * Propose a trade to another player
 */
export interface ProposeTradeData {
  toPlayerId: string;
  offering: Partial<Resources>;
  requesting: Partial<Resources>;
}

export function proposeTrade(state: GameState, data: ProposeTradeData): GameState {
  if (state.phase !== 'ACTION') return state;
  if (state.pendingTrade) return state; // Already have a pending trade

  const fromPlayer = state.players[state.activePlayerId];
  const toPlayer = state.players[data.toPlayerId];

  if (!fromPlayer || !toPlayer) return state;
  if (data.toPlayerId === state.activePlayerId) return state;

  // Check if offering player has the resources
  if (!canAfford(fromPlayer.resources, data.offering)) return state;

  // Check if target player has the requested resources
  if (!canAfford(toPlayer.resources, data.requesting)) return state;

  const trade: TradeOffer = {
    id: `trade_${Date.now()}`,
    fromPlayerId: state.activePlayerId,
    toPlayerId: data.toPlayerId,
    offering: data.offering,
    requesting: data.requesting,
    status: 'pending',
  };

  const offeringStr = Object.entries(data.offering)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${v} ${resourceNames[k as ResourceType]}`)
    .join(', ');

  const requestingStr = Object.entries(data.requesting)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${v} ${resourceNames[k as ResourceType]}`)
    .join(', ');

  return addToLog(
    {
      ...state,
      pendingTrade: trade,
    },
    state.activePlayerId,
    'PROPOSE_TRADE',
    `Proposed trade to ${toPlayer.name}: Offering ${offeringStr} for ${requestingStr}`
  );
}

/**
 * Accept a pending trade
 */
export function acceptTrade(state: GameState, acceptingPlayerId: string): GameState {
  if (!state.pendingTrade) return state;
  if (state.pendingTrade.toPlayerId !== acceptingPlayerId) return state;
  if (state.pendingTrade.status !== 'pending') return state;

  const trade = state.pendingTrade;
  const fromPlayer = state.players[trade.fromPlayerId];
  const toPlayer = state.players[trade.toPlayerId];

  // Re-verify both players can still afford
  if (!canAfford(fromPlayer.resources, trade.offering)) {
    return rejectTrade(state, acceptingPlayerId);
  }
  if (!canAfford(toPlayer.resources, trade.requesting)) {
    return rejectTrade(state, acceptingPlayerId);
  }

  // Execute the trade
  const newFromResources = subtractResources(fromPlayer.resources, trade.offering);
  const newToResources = subtractResources(toPlayer.resources, trade.requesting);

  // Add what each player receives
  const finalFromResources = addResources(newFromResources, trade.requesting);
  const finalToResources = addResources(newToResources, trade.offering);

  const updatedFromPlayer: Player = { ...fromPlayer, resources: finalFromResources };
  const updatedToPlayer: Player = { ...toPlayer, resources: finalToResources };

  return addToLog(
    {
      ...state,
      players: {
        ...state.players,
        [trade.fromPlayerId]: updatedFromPlayer,
        [trade.toPlayerId]: updatedToPlayer,
      },
      pendingTrade: null,
    },
    acceptingPlayerId,
    'ACCEPT_TRADE',
    `${toPlayer.name} accepted trade from ${fromPlayer.name}`
  );
}

/**
 * Reject a pending trade
 */
export function rejectTrade(state: GameState, rejectingPlayerId: string): GameState {
  if (!state.pendingTrade) return state;
  if (state.pendingTrade.toPlayerId !== rejectingPlayerId) return state;

  const fromPlayer = state.players[state.pendingTrade.fromPlayerId];
  const toPlayer = state.players[state.pendingTrade.toPlayerId];

  return addToLog(
    {
      ...state,
      pendingTrade: null,
    },
    rejectingPlayerId,
    'REJECT_TRADE',
    `${toPlayer.name} rejected trade from ${fromPlayer.name}`
  );
}

/**
 * Cancel a pending trade (by the proposer)
 */
export function cancelTrade(state: GameState): GameState {
  if (!state.pendingTrade) return state;
  if (state.pendingTrade.fromPlayerId !== state.activePlayerId) return state;

  return addToLog(
    {
      ...state,
      pendingTrade: null,
    },
    state.activePlayerId,
    'CANCEL_TRADE',
    'Cancelled trade offer'
  );
}

// =============================================================================
// IDEOLOGUE POWERS - Level 3 and Level 5 Active Powers
// =============================================================================

/**
 * Capitalist L3 - Prospecting
 * Once per turn, give 1 resource to the Public Reserve to get up to 2 resources of your choice.
 */
export interface ProspectingData {
  giveResource: ResourceType;
  getResources: ResourceType[]; // Up to 2 resources
}

export function useProspecting(state: GameState, data: ProspectingData): GameState {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'capitalist', 3)) {
    return state;
  }

  // Check if already used this turn
  if (!canUsePower(state.powerUsage, 'capitalist', 3)) {
    return state;
  }

  // Must give exactly 1 resource
  if (player.resources[data.giveResource] < 1) {
    return state;
  }

  // Can get up to 2 resources
  if (data.getResources.length > 2 || data.getResources.length === 0) {
    return state;
  }

  // Subtract the given resource
  const newResources = { ...player.resources };
  newResources[data.giveResource] -= 1;

  // Add the chosen resources
  for (const res of data.getResources) {
    newResources[res] = Math.min(newResources[res] + 1, MAX_RESOURCES);
  }

  // Cap total at MAX_RESOURCES
  const total = getTotalResources(newResources);
  if (total > MAX_RESOURCES) {
    const excess = total - MAX_RESOURCES;
    let remaining = excess;
    for (const type of ['funds', 'clout', 'media', 'trust'] as ResourceType[]) {
      if (remaining <= 0) break;
      const reduction = Math.min(newResources[type], remaining);
      newResources[type] -= reduction;
      remaining -= reduction;
    }
  }

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
  };

  const newPowerUsage = {
    ...state.powerUsage,
    capitalistL3: state.powerUsage.capitalistL3 + 1,
  };

  return addToLog(
    {
      ...state,
      players: { ...state.players, [player.id]: updatedPlayer },
      powerUsage: newPowerUsage,
    },
    player.id,
    'USE_POWER',
    `Used Prospecting: traded 1 ${resourceNames[data.giveResource]} for ${data.getResources.map(r => resourceNames[r]).join(', ')}`
  );
}

/**
 * Capitalist L5 - Land Grab
 * Three times per turn, evict any 1 voter from the board (including majority voters).
 * Evicted voters can be placed back by their owner on their next turn.
 */
export interface LandGrabData {
  zoneId: string;
  slotIndex: number;
}

export function useLandGrab(state: GameState, data: LandGrabData): GameState {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'capitalist', 5)) {
    return state;
  }

  // Check if already used 3 times this turn
  if (!canUsePower(state.powerUsage, 'capitalist', 5)) {
    return state;
  }

  const zone = state.zones[data.zoneId];
  if (!zone) return state;

  const voterOwner = zone.slots[data.slotIndex];
  if (!voterOwner) return state;

  // Cannot evict from volatile slots
  if (isVolatileSlot(zone, data.slotIndex)) {
    return state;
  }

  // Remove the voter from the slot
  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[data.slotIndex] = null;
  newLockedSlots[data.slotIndex] = false;

  // Add the evicted voter to the owner's evicted count
  const targetPlayer = state.players[voterOwner];
  const updatedTargetPlayer: Player = {
    ...targetPlayer,
    evictedBattalions: targetPlayer.evictedBattalions + 1,
  };

  const updatedZone: Zone = {
    ...zone,
    slots: newSlots,
    lockedSlots: newLockedSlots,
  };

  const newPowerUsage = {
    ...state.powerUsage,
    capitalistL5: state.powerUsage.capitalistL5 + 1,
  };

  let newState: GameState = {
    ...state,
    zones: { ...state.zones, [data.zoneId]: updatedZone },
    players: { ...state.players, [voterOwner]: updatedTargetPlayer },
    powerUsage: newPowerUsage,
  };

  newState = addToLog(newState, player.id, 'USE_POWER', `Supply Blockade: evicted Battalion from ${zone.name}`);

  // Check if majority was broken
  newState = checkAndFormMajority(newState, data.zoneId);

  return newState;
}

/**
 * Supremo L3 - Donations
 * Twice per turn, snatch 1 resource from another player (take without giving anything).
 */
export interface DonationsData {
  targetPlayerId: string;
  resource: ResourceType;
}

export function useDonations(state: GameState, data: DonationsData): GameState {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'supremo', 3)) {
    return state;
  }

  // Check if already used 2 times this turn
  if (!canUsePower(state.powerUsage, 'supremo', 3)) {
    return state;
  }

  // Cannot target yourself
  if (data.targetPlayerId === player.id) {
    return state;
  }

  const targetPlayer = state.players[data.targetPlayerId];
  if (!targetPlayer) return state;

  // Target must have the resource
  if (targetPlayer.resources[data.resource] < 1) {
    return state;
  }

  // Check if player has room for resources
  if (getTotalResources(player.resources) >= MAX_RESOURCES) {
    return state;
  }

  // Transfer the resource
  const newTargetResources = { ...targetPlayer.resources };
  newTargetResources[data.resource] -= 1;

  const newPlayerResources = { ...player.resources };
  newPlayerResources[data.resource] += 1;

  const updatedPlayer: Player = { ...player, resources: newPlayerResources };
  const updatedTargetPlayer: Player = { ...targetPlayer, resources: newTargetResources };

  const newPowerUsage = {
    ...state.powerUsage,
    supremoL3: state.powerUsage.supremoL3 + 1,
  };

  return addToLog(
    {
      ...state,
      players: {
        ...state.players,
        [player.id]: updatedPlayer,
        [data.targetPlayerId]: updatedTargetPlayer,
      },
      powerUsage: newPowerUsage,
    },
    player.id,
    'USE_POWER',
    `Used Donations: snatched 1 ${resourceNames[data.resource]} from ${targetPlayer.name}`
  );
}

/**
 * Supremo L5 - Payback
 * Twice per turn, spend 1 resource to permanently discard 1 opponent's voter.
 * Voters in Volatile Areas cannot be discarded.
 */
export interface PaybackData {
  zoneId: string;
  slotIndex: number;
  payResource: ResourceType;
}

export function usePayback(state: GameState, data: PaybackData): GameState {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'supremo', 5)) {
    return state;
  }

  // Check if already used 2 times this turn
  if (!canUsePower(state.powerUsage, 'supremo', 5)) {
    return state;
  }

  // Must have the resource to pay
  if (player.resources[data.payResource] < 1) {
    return state;
  }

  const zone = state.zones[data.zoneId];
  if (!zone) return state;

  const voterOwner = zone.slots[data.slotIndex];
  if (!voterOwner) return state;

  // Cannot discard your own voters
  if (voterOwner === player.id) {
    return state;
  }

  // Cannot discard from volatile slots
  if (isVolatileSlot(zone, data.slotIndex)) {
    return state;
  }

  // Pay the resource
  const newPlayerResources = { ...player.resources };
  newPlayerResources[data.payResource] -= 1;

  // Remove the voter permanently (not added to evicted - it's discarded)
  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[data.slotIndex] = null;
  newLockedSlots[data.slotIndex] = false;

  const updatedPlayer: Player = { ...player, resources: newPlayerResources };
  const updatedZone: Zone = {
    ...zone,
    slots: newSlots,
    lockedSlots: newLockedSlots,
  };

  const newPowerUsage = {
    ...state.powerUsage,
    supremoL5: state.powerUsage.supremoL5 + 1,
  };

  let newState: GameState = {
    ...state,
    zones: { ...state.zones, [data.zoneId]: updatedZone },
    players: { ...state.players, [player.id]: updatedPlayer },
    powerUsage: newPowerUsage,
  };

  newState = addToLog(newState, player.id, 'USE_POWER', `Kinetic Strike: destroyed Battalion in ${zone.name}`);

  // Check if majority was broken
  newState = checkAndFormMajority(newState, data.zoneId);

  return newState;
}

/**
 * Showstopper L3 - Going Viral
 * Twice per turn, get +1 voter for any Voter Card that you influence.
 * This is applied during the buyDeploymentOrder action.
 */
export function applyGoingViralBonus(state: GameState): { state: GameState; bonusVoters: number } {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'showstopper', 3)) {
    return { state, bonusVoters: 0 };
  }

  // Check if already used 2 times this turn
  if (!canUsePower(state.powerUsage, 'showstopper', 3)) {
    return { state, bonusVoters: 0 };
  }

  const newPowerUsage = {
    ...state.powerUsage,
    showstopperL3: state.powerUsage.showstopperL3 + 1,
  };

  return {
    state: {
      ...state,
      powerUsage: newPowerUsage,
    },
    bonusVoters: 1,
  };
}

/**
 * Showstopper L5 - Election Fever
 * Passive: You can Redeploy 2 voters instead of 1 for every zone where you have Redeployment Rights.
 * This modifies the redeploy allowance.
 */
export function getRedeployAllowance(state: GameState): number {
  const player = state.players[state.activePlayerId];

  // Check if player has Election Fever power
  if (hasUnlockedPower(player.ideologyTracks, 'showstopper', 5)) {
    return 2; // Can redeploy 2 voters per zone
  }

  return 1; // Normal: 1 voter per zone
}

/**
 * Idealist L3 - Helping Hands
 * Twice per turn, get 1 resource discount on any purchase.
 * This is applied during buyDeploymentOrder or buyConspiracyCard.
 */
export function applyHelpingHandsDiscount(
  state: GameState,
  cost: Partial<Resources>
): { state: GameState; discountedCost: Partial<Resources> } {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'idealist', 3)) {
    return { state, discountedCost: cost };
  }

  // Check if already used 2 times this turn
  if (!canUsePower(state.powerUsage, 'idealist', 3)) {
    return { state, discountedCost: cost };
  }

  // Find the first resource in the cost and reduce it by 1
  const discountedCost = { ...cost };
  const resourceTypes: ResourceType[] = ['funds', 'clout', 'media', 'trust'];

  for (const type of resourceTypes) {
    if (discountedCost[type] && discountedCost[type]! > 0) {
      discountedCost[type] = discountedCost[type]! - 1;
      if (discountedCost[type] === 0) {
        delete discountedCost[type];
      }
      break;
    }
  }

  const newPowerUsage = {
    ...state.powerUsage,
    idealistL3: state.powerUsage.idealistL3 + 1,
  };

  return {
    state: {
      ...state,
      powerUsage: newPowerUsage,
    },
    discountedCost,
  };
}

/**
 * Idealist L5 - Tough Love
 * Once per turn, spend 2 Trust + any 2 resources to convert 2 opponent's voters into yours.
 * Must be same player, same zone. Voters in Volatile Areas cannot be converted.
 */
export interface ToughLoveData {
  zoneId: string;
  slotIndices: [number, number]; // Exactly 2 slots
  targetPlayerId: string;
  payResources: ResourceType[]; // 2 additional resources (Trust is automatic)
}

export function useToughLove(state: GameState, data: ToughLoveData): GameState {
  const player = state.players[state.activePlayerId];

  // Check if player has unlocked this power
  if (!hasUnlockedPower(player.ideologyTracks, 'idealist', 5)) {
    return state;
  }

  // Check if already used this turn
  if (!canUsePower(state.powerUsage, 'idealist', 5)) {
    return state;
  }

  // Must pay exactly 2 Trust + 2 other resources
  if (player.resources.trust < 2) {
    return state;
  }

  if (data.payResources.length !== 2) {
    return state;
  }

  // Check if player has the additional resources
  const resourceCounts: Record<ResourceType, number> = { funds: 0, clout: 0, media: 0, trust: 0 };
  for (const res of data.payResources) {
    resourceCounts[res]++;
  }

  for (const type of ['funds', 'clout', 'media', 'trust'] as ResourceType[]) {
    if (type === 'trust') {
      // Already checking trust separately
      if (resourceCounts.trust > player.resources.trust - 2) {
        return state;
      }
    } else if (resourceCounts[type] > player.resources[type]) {
      return state;
    }
  }

  // Must target exactly 2 slots
  if (data.slotIndices.length !== 2) {
    return state;
  }

  const zone = state.zones[data.zoneId];
  if (!zone) return state;

  // Both slots must belong to the same target player
  for (const slotIndex of data.slotIndices) {
    const slotOwner = zone.slots[slotIndex];
    if (slotOwner !== data.targetPlayerId) {
      return state;
    }

    // Cannot convert from volatile slots
    if (isVolatileSlot(zone, slotIndex)) {
      return state;
    }

    // Cannot convert locked (majority) voters
    if (zone.lockedSlots[slotIndex]) {
      return state;
    }
  }

  // Cannot target yourself
  if (data.targetPlayerId === player.id) {
    return state;
  }

  // Pay 2 Trust
  const newPlayerResources = { ...player.resources };
  newPlayerResources.trust -= 2;

  // Pay the 2 additional resources
  for (const res of data.payResources) {
    newPlayerResources[res] -= 1;
  }

  // Convert the voters
  const newSlots = [...zone.slots];
  for (const slotIndex of data.slotIndices) {
    newSlots[slotIndex] = player.id;
  }

  const updatedPlayer: Player = { ...player, resources: newPlayerResources };
  const updatedZone: Zone = { ...zone, slots: newSlots };

  const newPowerUsage = {
    ...state.powerUsage,
    idealistL5: state.powerUsage.idealistL5 + 1,
  };

  let newState: GameState = {
    ...state,
    zones: { ...state.zones, [data.zoneId]: updatedZone },
    players: { ...state.players, [player.id]: updatedPlayer },
    powerUsage: newPowerUsage,
  };

  const targetPlayer = state.players[data.targetPlayerId];
  newState = addToLog(
    newState,
    player.id,
    'USE_POWER',
    `Used Tough Love: converted 2 of ${targetPlayer.name}'s Battalions in ${zone.name}`
  );

  // Check if majority was formed/broken
  newState = checkAndFormMajority(newState, data.zoneId);

  return newState;
}

/**
 * Buy voter card with optional power bonuses (Going Viral, Helping Hands)
 */
export function buyDeploymentOrderWithPowers(
  state: GameState,
  cardId: string,
  useGoingViral: boolean = false,
  useHelpingHands: boolean = false
): GameState {
  const card = state.deploymentShop.find(c => c.id === cardId);
  if (!card) return state;

  const player = state.players[state.activePlayerId];
  let currentState = state;
  let effectiveCost = { ...card.cost };
  let bonusVoters = 0;

  // Apply Helping Hands discount if requested
  if (useHelpingHands) {
    const discountResult = applyHelpingHandsDiscount(currentState, effectiveCost);
    currentState = discountResult.state;
    effectiveCost = discountResult.discountedCost;
  }

  // Check if player can afford
  if (!canAfford(player.resources, effectiveCost)) return state;

  // Apply Going Viral bonus if requested
  if (useGoingViral) {
    const viralResult = applyGoingViralBonus(currentState);
    currentState = viralResult.state;
    bonusVoters = viralResult.bonusVoters;
  }

  const newResources = subtractResources(player.resources, effectiveCost);
  const totalVoters = card.battalions + bonusVoters;
  const newBattalionBank = player.battalionReserve + totalVoters;

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
    battalionReserve: newBattalionBank,
  };

  const newMarket = refreshDeploymentOrder(currentState.deploymentShop, cardId);

  let logMessage = `Requisitioned ${card.battalions} Battalion(s)`;
  if (bonusVoters > 0) {
    logMessage += ` (+${bonusVoters} from Going Viral bonus)`;
  }
  if (useHelpingHands) {
    logMessage += ` (with Helping Hands discount)`;
  }

  return addToLog(
    {
      ...currentState,
      players: {
        ...currentState.players,
        [player.id]: updatedPlayer,
      },
      deploymentShop: newMarket,
      marketVersion: (currentState.marketVersion || 0) + 1,
    },
    player.id,
    'BUY_VOTERS',
    logMessage
  );
}

/**
 * Place evicted voters back on the board (must be done at start of turn if any)
 */
export function placeEvictedBattalion(state: GameState, zoneId: string, slotIndex: number): GameState {
  const player = state.players[state.activePlayerId];

  if (player.evictedBattalions <= 0) return state;

  const zone = state.zones[zoneId];
  if (!zone || zone.slots[slotIndex] !== null) return state;

  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[slotIndex] = player.id;

  // If placing in volatile slot, lock it
  if (isVolatileSlot(zone, slotIndex)) {
    newLockedSlots[slotIndex] = true;
  }

  const updatedZone: Zone = {
    ...zone,
    slots: newSlots,
    lockedSlots: newLockedSlots,
  };

  const updatedPlayer: Player = {
    ...player,
    evictedBattalions: player.evictedBattalions - 1,
  };

  let newState: GameState = {
    ...state,
    zones: { ...state.zones, [zoneId]: updatedZone },
    players: { ...state.players, [player.id]: updatedPlayer },
  };

  newState = addToLog(newState, player.id, 'PLACE_EVICTED', `Deployed evicted Battalion to ${zone.name}`);

  // Check for majority formation
  newState = checkAndFormMajority(newState, zoneId);

  // Check for volatile slot trigger
  if (isVolatileSlot(zone, slotIndex)) {
    newState = triggerHeadline(newState);
  }

  // Check if all slots are now filled - end game immediately
  const gameEndCheck = checkGameEnd(newState);
  if (gameEndCheck.ended) {
    return {
      ...newState,
      phase: 'GAME_OVER',
      winner: gameEndCheck.winner,
    };
  }

  // If all evicted voters placed, automatically progress to ANSWERING phase
  if (updatedPlayer.evictedBattalions === 0 && state.phase === 'PLACE_EVICTED') {
    newState = endPlaceEvictedPhase(newState);
  }

  return newState;
}

// =============================================================================
// CONSPIRACY CARDS
// =============================================================================

/**
 * Buy a conspiracy card from the available templates
 * Can optionally apply Helping Hands discount
 */
export function buyConspiracyCard(
  state: GameState,
  cardId: string,
  useHelpingHands: boolean = false
): GameState {
  const cardTemplate = conspiracyCardTemplates.find(c => c.id === cardId);
  if (!cardTemplate) return state;

  const player = state.players[state.activePlayerId];
  let currentState = state;
  let effectiveCost = { ...cardTemplate.cost };

  // Apply Helping Hands discount if requested
  if (useHelpingHands) {
    const discountResult = applyHelpingHandsDiscount(currentState, effectiveCost);
    currentState = discountResult.state;
    effectiveCost = discountResult.discountedCost;
  }

  // Check if player can afford
  if (!canAfford(player.resources, effectiveCost)) return state;

  const newResources = subtractResources(player.resources, effectiveCost);

  // Create a new instance of the card for the player
  const newCard: ConspiracyCard = {
    ...cardTemplate,
    id: `${cardTemplate.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
    conspiracyCards: [...player.conspiracyCards, newCard],
  };

  let logMessage = `Bought conspiracy card: ${newCard.name}`;
  if (useHelpingHands) {
    logMessage += ' (with Helping Hands discount)';
  }

  return addToLog(
    {
      ...currentState,
      players: {
        ...currentState.players,
        [player.id]: updatedPlayer,
      },
    },
    player.id,
    'BUY_CONSPIRACY',
    logMessage
  );
}

/**
 * Play a conspiracy card from the player's hand
 * Conspiracy cards can be played at ANY time, not just during the active player's turn
 */
export interface PlayConspiracyData {
  cardId: string;
  playerId?: string; // The player playing the card (defaults to activePlayerId for backwards compatibility)
  targetPlayerId?: string;
  targetZoneId?: string;
  targetSlotIndex?: number;
  targetZoneId2?: string; // For destination zone (BATTALION_TRANSFER) or second voter zone (SWAP_BATTALIONS)
  targetSlotIndex2?: number; // For swap effects - second voter slot
  targetResource?: ResourceType;
}

export function playConspiracyCard(state: GameState, data: PlayConspiracyData): GameState {
  // Conspiracy cards can be played by any player at any time
  const playingPlayerId = data.playerId || state.activePlayerId;
  const player = state.players[playingPlayerId];
  if (!player) return state;

  const card = player.conspiracyCards.find(c => c.id === data.cardId);

  if (!card) return state;

  // Remove the card from player's hand
  const newConspiracyCards = player.conspiracyCards.filter(c => c.id !== data.cardId);
  let updatedPlayer: Player = {
    ...player,
    conspiracyCards: newConspiracyCards,
  };

  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [player.id]: updatedPlayer,
    },
  };

  // Apply the card effect based on type
  switch (card.effect.type) {
    case 'STEAL_RESOURCES':
      newState = applyStealResources(newState, data, card);
      break;

    case 'RESOURCE_DRAIN':
      newState = applyResourceDrain(newState, data, card);
      break;

    case 'REMOVE_BATTALION':
      newState = applyRemoveVoter(newState, data);
      break;

    case 'BATTALION_TRANSFER':
      newState = applyVoterTransfer(newState, data);
      break;

    case 'SWAP_BATTALIONS':
      newState = applySwapVoters(newState, data);
      break;

    case 'BLOCK_HEADLINE':
      // Simply nullify the current headline
      newState = {
        ...newState,
        currentHeadlineCard: null,
      };
      break;

    case 'EXTRA_TURN':
      // Set flag to give player an extra action phase after this turn
      newState = {
        ...newState,
        extraActionPhase: true,
      };
      newState = addToLog(newState, player.id, 'CONSPIRACY_EXTRA_TURN', 'Emergency Session activated - will take an additional Action phase after this turn');
      break;

    case 'BLOCK_REDEPLOYMENT':
      // Block all redeployment for the rest of this round
      newState = {
        ...newState,
        redeploymentBlocked: true,
        redeploymentBlockerId: playingPlayerId, // Track who blocked it
      };
      newState = addToLog(newState, player.id, 'CONSPIRACY_BLOCK_REDEPLOY', 'Blocked all redeployment for this round');
      break;

    case 'PROTECT_ZONE':
      // Protect a specific zone from redeployment (needs zone selection)
      if (data.targetZoneId) {
        newState = {
          ...newState,
          protectedZones: [...newState.protectedZones, data.targetZoneId],
          protectedZoneExpirations: {
            ...newState.protectedZoneExpirations,
            [data.targetZoneId]: playingPlayerId, // Track who protected it
          },
        };
        const zoneName = newState.zones[data.targetZoneId]?.name || data.targetZoneId;
        newState = addToLog(newState, player.id, 'CONSPIRACY_PROTECT_ZONE', `Protected ${zoneName} from redeployment`);
      }
      break;

    case 'GAIN_ALL_RESOURCES':
      // Gain 1 of each resource type (respecting max 12 total)
      {
        const currentTotal = getTotalResources(player.resources);
        const canAdd = Math.min(4, MAX_RESOURCES - currentTotal); // Maximum 4 resources (1 of each)

        if (canAdd > 0) {
          const newResources = { ...player.resources };
          const resourceOrder: ResourceType[] = ['funds', 'clout', 'media', 'trust'];
          let added = 0;

          for (const resType of resourceOrder) {
            if (added >= canAdd) break;
            newResources[resType] += 1;
            added++;
          }

          const playerWithResources: Player = { ...newState.players[player.id], resources: newResources };
          newState = {
            ...newState,
            players: { ...newState.players, [player.id]: playerWithResources },
          };
          newState = addToLog(newState, player.id, 'CONSPIRACY_INTEL_SWEEP', `Gained ${added} resources from Intel Sweep`);
        }
      }
      break;
  }

  // BROADCAST: Log the Black Ops card usage so ALL players can see it
  newState = addToLog(newState, player.id, 'PLAY_CONSPIRACY', `⚠️ BLACK OPS: ${player.name} used ${card.name}!`);

  // Set the lastBlackOpsPlayed for visual notification
  newState = {
    ...newState,
    lastBlackOpsPlayed: {
      playerName: player.name,
      cardName: card.name,
      timestamp: Date.now(),
    },
  };

  // Apply Whistleblower punishment if applicable
  newState = applyWhistleblowerPunishment(newState, playingPlayerId);

  return newState;
}

function applyStealResources(
  state: GameState,
  data: PlayConspiracyData,
  card: ConspiracyCard
): GameState {
  if (!data.targetResource) return state;

  const player = state.players[state.activePlayerId];
  const stealAmount = card.effect.value || 1;

  // targetCount === -1 means steal from ALL opponents
  if (card.effect.targetCount === -1) {
    // Steal from all opponents
    const newPlayers = { ...state.players };
    let totalStolen = 0;

    for (const playerId of Object.keys(newPlayers)) {
      if (playerId === state.activePlayerId) continue;

      const targetPlayer = newPlayers[playerId];
      const actualSteal = Math.min(stealAmount, targetPlayer.resources[data.targetResource]);

      if (actualSteal > 0) {
        newPlayers[playerId] = {
          ...targetPlayer,
          resources: {
            ...targetPlayer.resources,
            [data.targetResource]: targetPlayer.resources[data.targetResource] - actualSteal,
          },
        };
        totalStolen += actualSteal;
      }
    }

    // Add stolen resources to player (respecting max)
    const currentResources = newPlayers[state.activePlayerId].resources;
    const canAdd = Math.min(totalStolen, MAX_RESOURCES - getTotalResources(currentResources));

    newPlayers[state.activePlayerId] = {
      ...newPlayers[state.activePlayerId],
      resources: {
        ...currentResources,
        [data.targetResource]: currentResources[data.targetResource] + canAdd,
      },
    };

    return { ...state, players: newPlayers };
  }

  // Single target steal
  if (!data.targetPlayerId) return state;

  const targetPlayer = state.players[data.targetPlayerId];

  if (!targetPlayer || targetPlayer.id === player.id) return state;

  const actualSteal = Math.min(stealAmount, targetPlayer.resources[data.targetResource]);

  if (actualSteal <= 0) return state;

  // Check if player has room
  if (getTotalResources(player.resources) >= MAX_RESOURCES) return state;

  const newPlayerResources = { ...player.resources };
  const newTargetResources = { ...targetPlayer.resources };

  newTargetResources[data.targetResource] -= actualSteal;
  newPlayerResources[data.targetResource] = Math.min(
    newPlayerResources[data.targetResource] + actualSteal,
    MAX_RESOURCES - getTotalResources(newPlayerResources) + newPlayerResources[data.targetResource]
  );

  return {
    ...state,
    players: {
      ...state.players,
      [player.id]: { ...state.players[player.id], resources: newPlayerResources },
      [data.targetPlayerId]: { ...targetPlayer, resources: newTargetResources },
    },
  };
}

function applyResourceDrain(
  state: GameState,
  data: PlayConspiracyData,
  card: ConspiracyCard
): GameState {
  if (!data.targetResource) return state;

  const drainAmount = card.effect.value || 1;
  const newPlayers = { ...state.players };

  for (const playerId of Object.keys(newPlayers)) {
    if (playerId === state.activePlayerId) continue; // Don't drain self

    const targetPlayer = newPlayers[playerId];
    const actualDrain = Math.min(drainAmount, targetPlayer.resources[data.targetResource]);

    newPlayers[playerId] = {
      ...targetPlayer,
      resources: {
        ...targetPlayer.resources,
        [data.targetResource]: targetPlayer.resources[data.targetResource] - actualDrain,
      },
    };
  }

  return { ...state, players: newPlayers };
}

function applyRemoveVoter(state: GameState, data: PlayConspiracyData): GameState {
  if (!data.targetZoneId || data.targetSlotIndex === undefined) return state;

  const zone = state.zones[data.targetZoneId];
  if (!zone) return state;

  const voterOwner = zone.slots[data.targetSlotIndex];
  if (!voterOwner || voterOwner === state.activePlayerId) return state;

  // Cannot remove from volatile slots
  if (isVolatileSlot(zone, data.targetSlotIndex)) return state;

  // Cannot remove locked battalions (part of a formed majority/Control)
  if (zone.lockedSlots[data.targetSlotIndex]) return state;

  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[data.targetSlotIndex] = null;
  newLockedSlots[data.targetSlotIndex] = false;

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [data.targetZoneId]: {
        ...zone,
        slots: newSlots,
        lockedSlots: newLockedSlots,
      },
    },
  };

  // Check if majority was broken
  newState = checkAndFormMajority(newState, data.targetZoneId);

  return newState;
}

function applyVoterTransfer(state: GameState, data: PlayConspiracyData): GameState {
  if (!data.targetZoneId || data.targetSlotIndex === undefined || !data.targetZoneId2) {
    return state;
  }

  const sourceZone = state.zones[data.targetZoneId];
  const destZone = state.zones[data.targetZoneId2];
  if (!sourceZone || !destZone) return state;

  // Verify destination is adjacent
  if (!sourceZone.adjacentZones.includes(data.targetZoneId2)) return state;

  const voterOwner = sourceZone.slots[data.targetSlotIndex];
  if (!voterOwner || voterOwner === state.activePlayerId) return state;

  // Cannot transfer from volatile slots
  if (isVolatileSlot(sourceZone, data.targetSlotIndex)) return state;

  // Cannot transfer locked battalions (part of a formed majority/Control)
  if (sourceZone.lockedSlots[data.targetSlotIndex]) return state;

  // Cannot transfer to zone with formed majority
  if (destZone.majorityOwner) return state;

  // Find empty slot in destination zone
  const emptySlot = destZone.slots.findIndex((s, i) => s === null && !isVolatileSlot(destZone, i));
  if (emptySlot === -1) return state;

  const newSourceSlots = [...sourceZone.slots];
  const newSourceLocked = [...sourceZone.lockedSlots];
  newSourceSlots[data.targetSlotIndex] = null;
  newSourceLocked[data.targetSlotIndex] = false;

  const newDestSlots = [...destZone.slots];
  newDestSlots[emptySlot] = voterOwner;

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [data.targetZoneId]: { ...sourceZone, slots: newSourceSlots, lockedSlots: newSourceLocked },
      [data.targetZoneId2]: { ...destZone, slots: newDestSlots },
    },
  };

  newState = checkAndFormMajority(newState, data.targetZoneId);
  newState = checkAndFormMajority(newState, data.targetZoneId2);

  const destZoneName = destZone.name;
  return addToLog(newState, state.activePlayerId, 'BATTALION_TRANSFER', `Transferred enemy Battalion to ${destZoneName}`);
}

function applySwapVoters(state: GameState, data: PlayConspiracyData): GameState {
  if (!data.targetZoneId || data.targetSlotIndex === undefined ||
    !data.targetZoneId2 || data.targetSlotIndex2 === undefined) {
    return state;
  }

  const zone1 = state.zones[data.targetZoneId];
  const zone2 = state.zones[data.targetZoneId2];
  if (!zone1 || !zone2) return state;

  const voter1 = zone1.slots[data.targetSlotIndex];
  const voter2 = zone2.slots[data.targetSlotIndex2];
  if (!voter1 || !voter2) return state;

  // Cannot swap locked slots (battalions that form part of a majority/Control)
  if (zone1.lockedSlots[data.targetSlotIndex] || zone2.lockedSlots[data.targetSlotIndex2]) {
    return state;
  }

  // Cannot swap volatile slots
  if (isVolatileSlot(zone1, data.targetSlotIndex) || isVolatileSlot(zone2, data.targetSlotIndex2)) {
    return state;
  }

  // Perform the swap
  const newZone1Slots = [...zone1.slots];
  const newZone2Slots = [...zone2.slots];
  newZone1Slots[data.targetSlotIndex] = voter2;
  newZone2Slots[data.targetSlotIndex2] = voter1;

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [data.targetZoneId]: { ...zone1, slots: newZone1Slots },
      [data.targetZoneId2]: { ...zone2, slots: newZone2Slots },
    },
  };

  newState = checkAndFormMajority(newState, data.targetZoneId);
  newState = checkAndFormMajority(newState, data.targetZoneId2);

  return addToLog(newState, state.activePlayerId, 'SWAP_BATTALIONS', `Swapped Battalions between ${zone1.name} and ${zone2.name}`);
}

/**
 * Get available conspiracy cards for purchase
 */
export function getAvailableConspiracyCards(): ConspiracyCard[] {
  return conspiracyCardTemplates;
}

// =============================================================================
// ELITE SYSTEM
// =============================================================================

/**
 * Check if player qualifies for any new elites after gaining ideology cards
 */
export function checkAndUnlockElites(state: GameState, playerId: string): GameState {
  const player = state.players[playerId];
  if (!player) return state;

  const qualifiedElites = getQualifiedElites(player.ideologyTracks);
  const newUnlocked: EliteId[] = [];

  for (const elite of qualifiedElites) {
    if (!player.unlockedElites.includes(elite.id)) {
      newUnlocked.push(elite.id);
    }
  }

  if (newUnlocked.length === 0) return state;

  const updatedPlayer: Player = {
    ...player,
    unlockedElites: [...player.unlockedElites, ...newUnlocked],
  };

  let newState: GameState = {
    ...state,
    players: { ...state.players, [playerId]: updatedPlayer },
  };

  for (const eliteId of newUnlocked) {
    const elite = getEliteCard(eliteId);
    if (elite) {
      newState = addToLog(newState, playerId, 'UNLOCK_ELITE', `Unlocked ${elite.name}!`);
    }
  }

  return newState;
}

/**
 * Activate an elite that the player has unlocked
 */
export function activateElite(state: GameState, eliteId: EliteId): GameState {
  const player = state.players[state.activePlayerId];
  if (!player) return state;

  // Must have unlocked the elite
  if (!player.unlockedElites.includes(eliteId)) return state;

  // Already have this elite active
  if (player.activeElite === eliteId) return state;

  const elite = getEliteCard(eliteId);
  if (!elite) return state;

  // Verify player still meets requirements
  if (!meetsEliteRequirements(player.ideologyTracks, elite.requirements)) {
    return state;
  }

  const updatedPlayer: Player = {
    ...player,
    activeElite: eliteId,
  };

  let newState: GameState = {
    ...state,
    players: { ...state.players, [player.id]: updatedPlayer },
  };

  // Special handling for Mafioso activation
  if (eliteId === 'mafioso') {
    newState = { ...newState, mafiosoOwnerId: player.id };
  }

  // Special handling for Whistleblower activation
  if (eliteId === 'whistleblower') {
    newState = { ...newState, whistleblowerActive: player.id };
  }

  return addToLog(newState, player.id, 'ACTIVATE_ELITE', `Activated ${elite.name}`);
}

/**
 * Use Philanthropist ability: Donate 2 resources to opponent for 1 free voter
 */
export function usePhilanthropist(
  state: GameState,
  targetPlayerId: string,
  resources: [ResourceType, ResourceType]
): GameState {
  const player = state.players[state.activePlayerId];
  if (!player || !hasActiveElite(player, 'philanthropist')) return state;
  if (player.eliteUsedThisTurn) return state;
  if (targetPlayerId === player.id) return state;

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer) return state;

  // Check player has the resources
  const resourceCounts: Record<ResourceType, number> = { funds: 0, clout: 0, media: 0, trust: 0 };
  for (const r of resources) {
    resourceCounts[r]++;
  }

  for (const [type, count] of Object.entries(resourceCounts)) {
    if (player.resources[type as ResourceType] < count) return state;
  }

  // Transfer resources
  const newPlayerResources = { ...player.resources };
  const newTargetResources = { ...targetPlayer.resources };

  for (const r of resources) {
    newPlayerResources[r]--;
    newTargetResources[r] = Math.min(newTargetResources[r] + 1, MAX_RESOURCES);
  }

  // Give player a free voter
  const updatedPlayer: Player = {
    ...player,
    resources: newPlayerResources,
    battalionReserve: player.battalionReserve + 1,
    eliteUsedThisTurn: true,
  };

  const updatedTarget: Player = {
    ...targetPlayer,
    resources: newTargetResources,
  };

  return addToLog(
    {
      ...state,
      players: {
        ...state.players,
        [player.id]: updatedPlayer,
        [targetPlayerId]: updatedTarget,
      },
    },
    player.id,
    'USE_PHILANTHROPIST',
    `Donated 2 resources to ${targetPlayer.name} for a free Battalion`
  );
}

/**
 * Use Activist ability: Peek at opponent's conspiracy cards
 */
export function useActivist(state: GameState, targetPlayerId: string): GameState {
  const player = state.players[state.activePlayerId];
  if (!player || !hasActiveElite(player, 'activist')) return state;
  if (player.eliteUsedThisTurn) return state;
  if (targetPlayerId === player.id) return state;

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer) return state;

  const updatedPlayer: Player = {
    ...player,
    eliteUsedThisTurn: true,
  };

  return addToLog(
    {
      ...state,
      players: { ...state.players, [player.id]: updatedPlayer },
      activistPeekResult: [...targetPlayer.conspiracyCards],
    },
    player.id,
    'USE_ACTIVIST',
    `Peeked at ${targetPlayer.name}'s conspiracy cards`
  );
}

/**
 * Use Guru ability: Discard own voter for 3 resources
 */
export function useGuru(
  state: GameState,
  zoneId: string,
  slotIndex: number,
  resourceChoices: [ResourceType, ResourceType, ResourceType]
): GameState {
  const player = state.players[state.activePlayerId];
  if (!player || !hasActiveElite(player, 'guru')) return state;

  const zone = state.zones[zoneId];
  if (!zone) return state;

  // Must be player's own voter
  const voterId = zone.slots[slotIndex];
  if (voterId !== player.id) return state;

  // Cannot remove from volatile slots
  if (isVolatileSlot(zone, slotIndex)) return state;

  // Remove the voter
  const newSlots = [...zone.slots];
  const newLockedSlots = [...zone.lockedSlots];
  newSlots[slotIndex] = null;
  newLockedSlots[slotIndex] = false;

  // Add 3 resources
  const newResources = { ...player.resources };
  const resourceCap = getResourceCap(player);
  for (const r of resourceChoices) {
    if (getTotalResources(newResources) < resourceCap) {
      newResources[r]++;
    }
  }

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
  };

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: { ...zone, slots: newSlots, lockedSlots: newLockedSlots },
    },
    players: { ...state.players, [player.id]: updatedPlayer },
  };

  // Check if majority was affected
  newState = checkAndFormMajority(newState, zoneId);

  return addToLog(newState, player.id, 'USE_GURU', `Sacrificed Battalion in ${zone.name} for 3 resources`);
}

/**
 * Use Propagandist ability: Force a headline on a player (costs 3 resources)
 */
export function usePropagandist(
  state: GameState,
  targetPlayerId: string,
  payResources: [ResourceType, ResourceType, ResourceType]
): GameState {
  const player = state.players[state.activePlayerId];
  if (!player || !hasActiveElite(player, 'propagandist')) return state;
  if (player.eliteUsedThisTurn) return state;

  const targetPlayer = state.players[targetPlayerId];
  if (!targetPlayer) return state;

  // Check player has the resources
  const resourceCounts: Record<ResourceType, number> = { funds: 0, clout: 0, media: 0, trust: 0 };
  for (const r of payResources) {
    resourceCounts[r]++;
  }

  for (const [type, count] of Object.entries(resourceCounts)) {
    if (player.resources[type as ResourceType] < count) return state;
  }

  // Deduct resources
  const newResources = { ...player.resources };
  for (const r of payResources) {
    newResources[r]--;
  }

  // Draw and apply a headline to the target
  if (state.headlineDeck.length === 0) return state;

  const [headline, ...remainingDeck] = state.headlineDeck;

  const updatedPlayer: Player = {
    ...player,
    resources: newResources,
    eliteUsedThisTurn: true,
  };

  return addToLog(
    {
      ...state,
      headlineDeck: remainingDeck,
      currentHeadlineCard: headline,
      players: { ...state.players, [player.id]: updatedPlayer },
    },
    player.id,
    'USE_PROPAGANDIST',
    `Forced Flashpoint "${headline.title}" targeting ${targetPlayer.name}`
  );
}

/**
 * Pay Mafioso tax at start of turn
 */
export function payMafiosoTax(state: GameState, resource: ResourceType): GameState {
  if (!state.pendingMafiosoTax || !state.mafiosoOwnerId) return state;

  const player = state.players[state.activePlayerId];
  const mafiosoOwner = state.players[state.mafiosoOwnerId];

  if (!player || !mafiosoOwner) return state;
  if (player.id === state.mafiosoOwnerId) return state; // Mafioso doesn't pay self

  if (player.resources[resource] < 1) return state;

  const newPlayerResources = { ...player.resources };
  newPlayerResources[resource]--;

  const newMafiosoResources = { ...mafiosoOwner.resources };
  const mafiosoCap = getResourceCap(mafiosoOwner);
  if (getTotalResources(newMafiosoResources) < mafiosoCap) {
    newMafiosoResources[resource]++;
  }

  return addToLog(
    {
      ...state,
      pendingMafiosoTax: false,
      players: {
        ...state.players,
        [player.id]: { ...player, resources: newPlayerResources },
        [state.mafiosoOwnerId]: { ...mafiosoOwner, resources: newMafiosoResources },
      },
    },
    player.id,
    'PAY_MAFIOSO_TAX',
    `Paid 1 ${resourceNames[resource]} tax to ${mafiosoOwner.name} (Mafioso)`
  );
}

/**
 * Trigger a headline from a volatile slot
 */
export function triggerVolatileHeadline(state: GameState): GameState {
  if (state.headlineDeck.length === 0) return state;

  const [headline, ...remainingDeck] = state.headlineDeck;

  let newState: GameState = {
    ...state,
    headlineDeck: remainingDeck,
    currentHeadlineCard: headline,
  };

  return addToLog(
    newState,
    state.activePlayerId,
    'VOLATILE_HEADLINE',
    `Hot Zone Flashpoint triggered: "${headline.title}"`
  );
}

/**
 * Deploy a stored voter (Technocrat ability)
 */
export function deployStoredVoter(state: GameState, zoneId: string, slotIndex: number): GameState {
  const player = state.players[state.activePlayerId];
  if (!player || !hasActiveElite(player, 'technocrat')) return state;
  if (player.storedBattalions < 1) return state;

  const zone = state.zones[zoneId];
  if (!zone || zone.slots[slotIndex] !== null) return state;

  const newSlots = [...zone.slots];
  newSlots[slotIndex] = player.id;

  const updatedPlayer: Player = {
    ...player,
    storedBattalions: player.storedBattalions - 1,
  };

  let newState: GameState = {
    ...state,
    zones: {
      ...state.zones,
      [zoneId]: { ...zone, slots: newSlots },
    },
    players: { ...state.players, [player.id]: updatedPlayer },
  };

  // Check volatile slot and majority
  if (isVolatileSlot(zone, slotIndex)) {
    newState = triggerVolatileHeadline(newState);
    newState = {
      ...newState,
      zones: {
        ...newState.zones,
        [zoneId]: {
          ...newState.zones[zoneId],
          lockedSlots: newState.zones[zoneId].lockedSlots.map((locked, i) =>
            i === slotIndex ? true : locked
          ),
        },
      },
    };
  }

  newState = checkAndFormMajority(newState, zoneId);
  return addToLog(newState, player.id, 'DEPLOY_STORED', `Deployed stored Battalion to ${zone.name}`);
}

/**
 * Check for Whistleblower punishment when conspiracy is played
 */
function applyWhistleblowerPunishment(state: GameState, conspiracyPlayerId: string): GameState {
  if (!state.whistleblowerActive) return state;
  if (state.whistleblowerActive === conspiracyPlayerId) return state; // Can't punish self

  const whistleblower = state.players[state.whistleblowerActive];
  const conspiracyPlayer = state.players[conspiracyPlayerId];

  if (!whistleblower || !conspiracyPlayer) return state;

  // Find a voter to discard from the conspiracy player
  for (const zone of Object.values(state.zones)) {
    for (let i = 0; i < zone.slots.length; i++) {
      if (zone.slots[i] === conspiracyPlayerId && !isVolatileSlot(zone, i) && !zone.lockedSlots[i]) {
        // Remove this voter
        const newSlots = [...zone.slots];
        const newLockedSlots = [...zone.lockedSlots];
        newSlots[i] = null;
        newLockedSlots[i] = false;

        let newState: GameState = {
          ...state,
          zones: {
            ...state.zones,
            [zone.id]: { ...zone, slots: newSlots, lockedSlots: newLockedSlots },
          },
          conspiracyPlayedThisRound: true,
        };

        newState = checkAndFormMajority(newState, zone.id);

        return addToLog(
          newState,
          state.whistleblowerActive,
          'WHISTLEBLOWER_PUNISH',
          `Whistleblower discarded ${conspiracyPlayer.name}'s Battalion in ${zone.name}`
        );
      }
    }
  }

  return { ...state, conspiracyPlayedThisRound: true };
}

/**
 * Check for Patron trigger when 3-voter card is bought
 */
function checkPatronTrigger(state: GameState, buyerPlayerId: string, voterCount: number): GameState {
  if (voterCount < 3) return state;

  // Find player with active Patron (not the buyer)
  for (const player of Object.values(state.players)) {
    if (player.id !== buyerPlayerId && hasActiveElite(player, 'patron') && !state.patronTriggered) {
      const updatedPlayer: Player = {
        ...player,
        battalionReserve: player.battalionReserve + 1,
      };

      return addToLog(
        {
          ...state,
          players: { ...state.players, [player.id]: updatedPlayer },
          patronTriggered: true,
        },
        player.id,
        'PATRON_TRIGGER',
        `Patron gained a free Battalion when ${state.players[buyerPlayerId].name} requisitioned 3+ units`
      );
    }
  }

  return state;
}

// Re-export elite helper functions
export {
  getQualifiedElites,
  hasActiveElite,
  getResourceCap,
  getBonusRedeploymentMoves,
  hasDictatorConversion,
  getConspiracyDiscount,
  getIdeologyRewardMultiplier,
};

// =============================================================================
// PLAYER MANAGEMENT (DISCONNECTS)
// =============================================================================

export function removePlayer(state: GameState, playerId: string): GameState {
  const player = state.players[playerId];
  if (!player) return state;

  let newState = { ...state, stateVersion: state.stateVersion + 1 };

  // 1. Remove voters from all zones
  const zoneIds = Object.keys(newState.zones);
  for (const zoneId of zoneIds) {
    const zone = newState.zones[zoneId];
    let slotsChanged = false;

    // Remove voters from slots
    const newSlots = zone.slots.map(slot => {
      // If the slot belonged to the removed player, clear it
      if (slot === playerId) {
        slotsChanged = true;
        return null;
      }
      return slot;
    });

    // Reset locked status for freed slots or existing slots
    const newLockedSlots = zone.lockedSlots.map((locked, i) => {
      if (zone.slots[i] === playerId) {
        // Unlock slot if player removed
        return false;
      }
      return locked;
    });

    if (slotsChanged) {
      newState = {
        ...newState,
        zones: {
          ...newState.zones,
          [zoneId]: {
            ...zone,
            slots: newSlots,
            lockedSlots: newLockedSlots,
          },
        },
      };

      // Recalculate majority (breaking it if needed, or re-forming if others now dominate?)
      newState = checkAndFormMajority(newState, zoneId);
    }
  }

  // 2. Handle special phases - remove player's selections/votes/bids
  if (newState.phase === 'RESOURCE_SELECTION' && newState.resourceSelection) {
    // Remove their resource selection if they made one
    const newSelections = { ...newState.resourceSelection.selections };
    delete newSelections[playerId];
    newState.resourceSelection = {
      ...newState.resourceSelection,
      selections: newSelections,
    };
  }

  if (newState.phase === 'FIRST_PLAYER_SELECTION' && newState.firstPlayerSelection) {
    // Remove their vote or bid
    const newVotes = { ...newState.firstPlayerSelection.votes };
    const newBids = { ...newState.firstPlayerSelection.bids };
    delete newVotes[playerId];
    delete newBids[playerId];
    newState.firstPlayerSelection = {
      ...newState.firstPlayerSelection,
      votes: newVotes,
      bids: newBids,
    };
  }

  // 3. Log the exit BEFORE removing player (so we have access to their name)
  newState = addToLog(newState, playerId, 'PLAYER_LEFT', `${player.name || playerId} left the game (assets removed)`);

  // 4. Remove Player from State
  const newPlayers = { ...newState.players };
  delete newPlayers[playerId];
  newState.players = newPlayers;

  // 5. Check if only 1 player remains - they win by default
  const remainingPlayers = Object.values(newState.players);
  if (remainingPlayers.length === 1) {
    // Last player standing wins!
    const winner = remainingPlayers[0];
    newState.phase = 'GAME_OVER';
    newState.winner = winner.id;
    newState = addToLog(newState, winner.id, 'GAME_OVER', `${winner.name} wins by default - last player standing!`);
    return newState;
  }

  // 6. Check if no players remain (edge case)
  if (remainingPlayers.length === 0) {
    newState.phase = 'GAME_OVER';
    return newState;
  }

  // 7. Check if special phases can now complete with fewer players
  if (newState.phase === 'RESOURCE_SELECTION' && newState.resourceSelection) {
    const selectionsCount = Object.keys(newState.resourceSelection.selections).length;
    const playersCount = Object.keys(newState.players).length;
    if (selectionsCount >= playersCount) {
      // All remaining players have selected, advance to next phase
      newState = checkResourceSelectionComplete(newState);
    }
  }

  if (newState.phase === 'FIRST_PLAYER_SELECTION' && newState.firstPlayerSelection) {
    const playersCount = Object.keys(newState.players).length;
    const votesCount = Object.keys(newState.firstPlayerSelection.votes).length;
    const bidsCount = Object.keys(newState.firstPlayerSelection.bids).length;

    // Check if voting is complete (3+ players use voting)
    if (playersCount >= 3 && votesCount >= playersCount) {
      newState = resolveFirstPlayerVoting(newState);
    }
    // Check if bidding is complete (2 players use bidding)
    else if (playersCount === 2 && bidsCount >= playersCount) {
      newState = resolveFirstPlayerBidding(newState);
    }
  }

  // 8. Determine Next Active Player if the removed player was active (and not in special phases)
  if (state.activePlayerId === playerId &&
    newState.phase !== 'RESOURCE_SELECTION' &&
    newState.phase !== 'FIRST_PLAYER_SELECTION' &&
    newState.phase !== 'GAME_OVER') {
    // Sort remaining players by ID to determine order
    const sortedPlayers = remainingPlayers.sort((a, b) => a.id.localeCompare(b.id));

    // Find where the removed player would have been in the original order
    const originalPlayers = Object.values(state.players).sort((a, b) => a.id.localeCompare(b.id));
    const removedIndex = originalPlayers.findIndex(p => p.id === playerId);

    // Find the next player after the removed one
    let nextPlayerId: string | null = null;
    for (let i = 1; i <= originalPlayers.length; i++) {
      const checkIndex = (removedIndex + i) % originalPlayers.length;
      const candidateId = originalPlayers[checkIndex].id;
      if (candidateId !== playerId && newState.players[candidateId]) {
        nextPlayerId = candidateId;
        break;
      }
    }

    if (nextPlayerId && newState.players[nextPlayerId]) {
      newState.activePlayerId = nextPlayerId;

      // Reset turn state and start fresh turn for next player
      newState.phase = 'ANSWERING';
      newState.powerUsage = createPowerUsage();
      newState.conspiracyPlayedThisRound = false;
      newState.currentIdeologyCard = null; // Will be drawn when they start

      newState = addToLog(newState, nextPlayerId, 'TURN_START', `Turn passed to ${newState.players[nextPlayerId].name}`);

      // Draw a new ideology card for the next player
      newState = drawIdeologyCard(newState);
    }
  }

  return newState;
}

// Helper to check if resource selection is complete and advance
function checkResourceSelectionComplete(state: GameState): GameState {
  if (!state.resourceSelection) return state;

  const playersCount = Object.keys(state.players).length;
  const selectionsCount = Object.keys(state.resourceSelection.selections).length;

  if (selectionsCount < playersCount) return state;

  // All players have selected - apply resources and move to next phase
  let newState = { ...state };

  // Apply each player's selected resources
  for (const [pId, resources] of Object.entries(state.resourceSelection.selections)) {
    if (newState.players[pId]) {
      newState.players = {
        ...newState.players,
        [pId]: {
          ...newState.players[pId],
          resources: {
            funds: (newState.players[pId].resources.funds || 0) + (resources.funds || 0),
            clout: (newState.players[pId].resources.clout || 0) + (resources.clout || 0),
            media: (newState.players[pId].resources.media || 0) + (resources.media || 0),
            trust: (newState.players[pId].resources.trust || 0) + (resources.trust || 0),
          },
        },
      };
    }
  }

  // Move to first player selection
  newState.phase = 'FIRST_PLAYER_SELECTION';
  newState.firstPlayerSelection = {
    votes: {},
    bids: {},
    revoteCount: 0,
  };

  return newState;
}

// Helper to resolve first player voting (3+ players)
function resolveFirstPlayerVoting(state: GameState): GameState {
  if (!state.firstPlayerSelection) return state;

  const votes = state.firstPlayerSelection.votes;
  const voteCounts: Record<string, number> = {};

  // Count votes
  for (const voteForId of Object.values(votes)) {
    voteCounts[voteForId] = (voteCounts[voteForId] || 0) + 1;
  }

  // Find winner (most votes)
  let winnerId = Object.keys(state.players)[0];
  let maxVotes = 0;

  for (const [pId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes && state.players[pId]) {
      maxVotes = count;
      winnerId = pId;
    }
  }

  // Start game with winner as first player
  let newState = { ...state };
  newState.activePlayerId = winnerId;
  newState.startingPlayerId = winnerId;
  newState.phase = 'ANSWERING';

  newState = addToLog(newState, winnerId, 'FIRST_PLAYER', `${newState.players[winnerId].name} goes first (won vote)`);
  newState = drawIdeologyCard(newState);

  return newState;
}

// Helper to resolve first player bidding (2 players)
function resolveFirstPlayerBidding(state: GameState): GameState {
  if (!state.firstPlayerSelection) return state;

  const bids = state.firstPlayerSelection.bids;
  const playerIds = Object.keys(state.players);

  if (playerIds.length !== 2) return state;

  // Calculate bid totals
  let highestBidder = playerIds[0];
  let highestBid = 0;

  for (const [pId, bid] of Object.entries(bids)) {
    const total = (bid.funds || 0) + (bid.clout || 0) + (bid.media || 0) + (bid.trust || 0);
    if (total > highestBid && state.players[pId]) {
      highestBid = total;
      highestBidder = pId;
    }
  }

  // Deduct bid from winner
  let newState = { ...state };
  const winnerBid = bids[highestBidder] || {};
  if (newState.players[highestBidder]) {
    newState.players = {
      ...newState.players,
      [highestBidder]: {
        ...newState.players[highestBidder],
        resources: {
          funds: Math.max(0, newState.players[highestBidder].resources.funds - (winnerBid.funds || 0)),
          clout: Math.max(0, newState.players[highestBidder].resources.clout - (winnerBid.clout || 0)),
          media: Math.max(0, newState.players[highestBidder].resources.media - (winnerBid.media || 0)),
          trust: Math.max(0, newState.players[highestBidder].resources.trust - (winnerBid.trust || 0)),
        },
      },
    };
  }

  // Start game with winner as first player
  newState.activePlayerId = highestBidder;
  newState.startingPlayerId = highestBidder;
  newState.phase = 'ANSWERING';

  newState = addToLog(newState, highestBidder, 'FIRST_PLAYER', `${newState.players[highestBidder].name} goes first (won bid: ${highestBid} resources)`);
  newState = drawIdeologyCard(newState);

  return newState;
}

