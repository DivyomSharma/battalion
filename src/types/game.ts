// The Battalion - Game Type Definitions

export type ResourceType = 'funds' | 'clout' | 'media' | 'trust';
export type IdeologyType = 'capitalist' | 'supremo' | 'showstopper' | 'idealist';
// The Battalion Turn Phases (in order):
// 0. RESOURCE_SELECTION - (3+ players only) Each Commander chooses their starting resources
// 1. FIRST_PLAYER_SELECTION - Vote (3+ players) or bid (2 players) for first Commander
// 2. PLACE_EVICTED - Place back any Battalions evicted by Supply Blockade (if any)
// 3. ANSWERING - Draw and answer a Situation Report card
// 4. ACTION - Deploy Battalions, use powers, play Black Ops
// 5. DEPLOYMENT - Place your Battalions on the map
// 6. REDEPLOYMENT - Redeploy Battalions between adjacent Sectors (if you have rights)
// 7. LAST_TURN - (Optional) Final round if map full but no Control
// 8. END_TURN - Transition to next Commander
export type GamePhase = 'SETUP' | 'RESOURCE_SELECTION' | 'FIRST_PLAYER_SELECTION' | 'PLACE_EVICTED' | 'ANSWERING' | 'ACTION' | 'DEPLOYMENT' | 'REDEPLOYMENT' | 'LAST_TURN' | 'END_TURN' | 'GAME_OVER';

export interface Resources {
  funds: number;
  clout: number;
  media: number;
  trust: number;
}

export interface IdeologyTracks {
  capitalist: number;
  supremo: number;
  showstopper: number;
  idealist: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  resources: Resources;
  ideologyTracks: IdeologyTracks;
  battalionReserve: number;
  evictedBattalions: number; // Battalions evicted by Supply Blockade - must be placed next turn
  conspiracyCards: ConspiracyCard[];
  isActive: boolean;
  unlockedElites: EliteId[]; // Elites the player has unlocked
  activeElite: EliteId | null; // Currently active elite (only one can be active)
  storedBattalions: number; // For Technocrat: battalions stored on player mat
  eliteUsedThisTurn: boolean; // Whether the active elite ability was used this turn
}

// Power usage tracking for turn limits
export interface PowerUsage {
  capitalistL3: number; // Prospecting uses this turn (max 1)
  capitalistL5: number; // Land Grab evictions this turn (max 3)
  supremoL3: number; // Donations snatches this turn (max 2)
  supremoL5: number; // Payback discards this turn (max 2)
  showstopperL3: number; // Going Viral bonuses this turn (max 2)
  idealistL3: number; // Helping Hands discounts this turn (max 2)
  idealistL5: number; // Tough Love conversions this turn (max 1)
  redeploymentUsed: number; // Number of redeployments used this turn
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  majorityRequired: number; // More than half of capacity, e.g., 6 for 11 slots
  volatileSlots: number[]; // Indices of volatile slots within this zone
  slots: (string | null)[]; // Player ID or null
  lockedSlots: boolean[]; // Tracks which slots are locked (voters in volatile areas can't move)
  adjacentZones: string[];
  position: { x: number; y: number };
  majorityOwner: string | null; // Player who has formed Control (locked in)
  majorityBattalionCount: number; // Number of battalions that count toward Control scoring
}

export interface IdeologyCard {
  id: string;
  question: string;
  optionA: {
    text: string;
    resources: Partial<Resources>;
    ideology: IdeologyType;
  };
  optionB: {
    text: string;
    resources: Partial<Resources>;
    ideology: IdeologyType;
  };
}

export interface DeploymentOrder {
  id: string;
  battalions: number;
  cost: Partial<Resources>;
}

export interface HeadlineCard {
  id: string;
  title: string;
  description: string;
  effect: HeadlineEffect;
}

export interface HeadlineEffect {
  type:
  | 'GLOBAL_RESOURCE_MOD'     // Modify resources for all/some players
  | 'PLAYER_RESOURCE_MOD'     // Modify resources for specific player
  | 'ZONE_EFFECT'             // Affect a specific zone
  | 'VOTER_EFFECT'            // Affect battalions on the board
  | 'IDEOLOGY_BONUS'          // Bonus based on ideology cards held
  | 'MAJORITY_BONUS'          // Bonus for Control holders
  | 'MARKET_EFFECT';          // Affect the deployment shop
  resource?: ResourceType;
  ideology?: IdeologyType;
  value?: number;
  targetType?: 'all' | 'active' | 'others' | 'majority_holders' | 'no_majority';
  zoneEffect?: 'LOCK_ZONE' | 'UNLOCK_ZONE' | 'SHUFFLE_VOTERS';
  battalionEffect?: 'REMOVE_RANDOM' | 'ADD_FREE_BATTALION' | 'EVICT_RANDOM';
}

export interface ConspiracyCard {
  id: string;
  name: string;
  description: string;
  cost: Partial<Resources>;
  effect: ConspiracyEffect;
  isInstant: boolean; // Can be played immediately when drawn/bought
}

export interface ConspiracyEffect {
  type:
  | 'BLOCK_REDEPLOYMENT'    // Prevent redeployment in a zone for this round
  | 'STEAL_RESOURCES'      // Steal resources from another player
  | 'REMOVE_BATTALION'        // Remove an opponent's battalion from the board
  | 'SWAP_BATTALIONS'          // Swap positions of battalions on the board
  | 'EXTRA_TURN'           // Take an extra action phase
  | 'BLOCK_HEADLINE'       // Cancel the current headline effect
  | 'PROTECT_ZONE'         // Protect a zone from all effects this round
  | 'RESOURCE_DRAIN'       // All opponents lose resources
  | 'BATTALION_TRANSFER'   // Transfer a battalion from one sector to another
  | 'GAIN_ALL_RESOURCES';  // Gain 1 of each resource type
  value?: number; // Amount for effects (e.g., resources to steal)
  targetCount?: number; // How many targets (battalions, resources, etc.)
}

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  offering: Partial<Resources>;
  requesting: Partial<Resources>;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

// For starting resource selection (3+ players)
export interface ResourceSelection {
  selections: Record<string, Partial<Resources>>; // playerId -> selected resources
  allowedAmounts: Record<string, number>; // playerId -> total resources allowed
}

// For first player selection
export interface FirstPlayerSelection {
  votes: Record<string, string>; // playerId -> votedForPlayerId (3+ players)
  bids: Record<string, Partial<Resources>>; // playerId -> bid resources (2 players)
  revoteCount: number;
}

// For showing what was gained from last answer
export interface ResourceGain {
  base: Partial<Resources>;
  passiveBonus: Partial<Resources>;
  total: Partial<Resources>;
}

export interface GameState {
  id: string;
  turnNumber: number;
  activePlayerId: string;
  phase: GamePhase;
  zones: Record<string, Zone>;
  players: Record<string, Player>;
  deploymentShop: DeploymentOrder[];
  currentIdeologyCard: IdeologyCard | null;
  currentHeadlineCard: HeadlineCard | null;
  ideologyDeck: IdeologyCard[];
  headlineDeck: HeadlineCard[];
  gameLog: GameLogEntry[];
  winner: string | null;
  powerUsage: PowerUsage; // Tracks power uses for the current turn
  pendingTrade: TradeOffer | null; // Current trade offer being negotiated
  lastResourceGain: ResourceGain | null; // Resources gained from last ideology card answer
  firstPlayerSelection: FirstPlayerSelection | null; // For first player voting/bidding
  resourceSelection: ResourceSelection | null; // For starting resource selection (3+ players)
  stateVersion: number; // Increments with each action for state sync
  marketVersion: number; // Increments when market changes to trigger cooldowns
  protectedZones: string[]; // Zones protected from redeployment this round (conspiracy card effect)
  redeploymentBlocked: boolean; // Whether redeployment is globally blocked this round
  extraActionPhase: boolean; // Player gets extra action phase after current turn (Emergency Session)
  // Elite-related state
  mafiosoOwnerId: string | null; // Player with active Mafioso elite (for tax tracking)
  pendingMafiosoTax: boolean; // Whether current player needs to pay Mafioso tax
  activistPeekResult: ConspiracyCard[] | null; // Result of Activist peek (shown to the player)
  patronTriggered: boolean; // Whether Patron's free voter was already triggered this turn
  whistleblowerActive: string | null; // Player with active Whistleblower (tracks conspiracy usage)
  conspiracyPlayedThisRound: boolean; // Whether anyone played a conspiracy this round (for Whistleblower)
  turnsRemaining: number | null; // For LAST_TURN phase (counts down active players)
  redeploymentBlockerId: string | null; // Player who blocked redeployment (expires on their next turn)
  protectedZoneExpirations: Record<string, string>; // zoneId -> playerId who protected it (expires on their next turn)
  startingPlayerId: string | null; // The player who started the game (first turn)
  lastBlackOpsPlayed: { playerName: string; cardName: string; timestamp: number } | null; // Last Black Ops card played (for notification)
}

export interface GameLogEntry {
  id: string;
  timestamp: number;
  playerId: string;
  action: string;
  details: string;
}

// Power definitions
export interface IdeologyPower {
  ideology: IdeologyType;
  level: 2 | 3 | 5;
  name: string;
  description: string;
  isPassive: boolean;
  cost?: Partial<Resources>;
}

// Elite Card definitions
export type EliteId =
  | 'technocrat'
  | 'lobbyist'
  | 'philanthropist'
  | 'patron'
  | 'provocateur'
  | 'propagandist'
  | 'activist'
  | 'whistleblower'
  | 'guru'
  | 'guerrilla'
  | 'mafioso'
  | 'dictator'
  | 'renegade';

export interface EliteRequirements {
  capitalist?: number;   // Min cards required (undefined = no requirement)
  supremo?: number;
  showstopper?: number;
  idealist?: number;
  // For Renegade: requires passive powers without level 3 powers
  passivePowersActive?: number;
  level3PowersActive?: number;
}

export interface EliteCard {
  id: EliteId;
  name: string;
  requirements: EliteRequirements;
  effect: string;
  isPassive: boolean;  // Whether the effect is always active or must be triggered
}

// Actions
export type GameAction =
  | { type: 'DRAW_IDEOLOGY_CARD' }
  | { type: 'REDRAW_IDEOLOGY_CARD' }
  | { type: 'ANSWER_IDEOLOGY_CARD'; choice: 'A' | 'B' }
  | { type: 'BUY_DEPLOYMENT_ORDER'; cardId: string; useGoingViral?: boolean; useHelpingHands?: boolean; replacementCard?: DeploymentOrder }
  | { type: 'BUY_CONSPIRACY_CARD'; cardId: string; useHelpingHands?: boolean }
  | { type: 'PLAY_CONSPIRACY_CARD'; cardId: string; playerId?: string; targetPlayerId?: string; targetResource?: ResourceType; targetZoneId?: string; targetSlotIndex?: number; targetZoneId2?: string; targetSlotIndex2?: number }
  | { type: 'USE_PROSPECTING'; giveResource: ResourceType; getResources: ResourceType[] }
  | { type: 'USE_LAND_GRAB'; zoneId: string; slotIndex: number }
  | { type: 'USE_DONATIONS'; targetPlayerId: string; resource: ResourceType }
  | { type: 'USE_PAYBACK'; zoneId: string; slotIndex: number; payResource: ResourceType }
  | { type: 'USE_TOUGH_LOVE'; zoneId: string; slotIndices: [number, number]; targetPlayerId: string; payResources: ResourceType[] }
  // Elite actions
  | { type: 'ACTIVATE_ELITE'; eliteId: EliteId }
  | { type: 'USE_PHILANTHROPIST'; targetPlayerId: string; resources: [ResourceType, ResourceType] } // Donate 2 resources for free battalion
  | { type: 'USE_PROPAGANDIST'; targetPlayerId: string } // Force headline on player (costs 3 resources)
  | { type: 'USE_ACTIVIST'; targetPlayerId: string } // Peek at conspiracy cards
  | { type: 'USE_GURU'; zoneId: string; slotIndex: number } // Discard own battalion for 3 resources
  | { type: 'PAY_MAFIOSO_TAX'; resource: ResourceType } // Pay tax to mafioso player
  | { type: 'SKIP_MAFIOSO_TAX' } // Skip turn if can't pay mafioso tax
  | { type: 'DEPLOY_STORED_BATTALION'; zoneId: string; slotIndex: number } // Technocrat: deploy stored battalion
  | { type: 'TRADE'; giveResource: ResourceType; getResource: ResourceType }
  | { type: 'PROPOSE_TRADE'; toPlayerId: string; offering: Partial<Resources>; requesting: Partial<Resources> }
  | { type: 'ACCEPT_TRADE' }
  | { type: 'REJECT_TRADE' }
  | { type: 'CANCEL_TRADE' }
  | { type: 'PLACE_BATTALION'; zoneId: string; slotIndex: number }
  | { type: 'PLACE_EVICTED_BATTALION'; zoneId: string; slotIndex: number }
  | { type: 'REDEPLOYMENT'; fromZone: string; toZone: string; fromSlot: number; toSlot: number }
  | { type: 'END_ACTION_PHASE' }
  | { type: 'END_PLACE_EVICTED' }
  | { type: 'END_TURN' }
  | { type: 'CLEAR_HEADLINE' }
  | { type: 'CLEAR_RESOURCE_GAIN' }
  | { type: 'SELECT_STARTING_RESOURCES'; playerId: string; resources: Partial<Resources> }
  | { type: 'VOTE_FIRST_PLAYER'; voterId: string; voteForId: string }
  | { type: 'BID_FIRST_PLAYER'; bidderId: string; bid: Partial<Resources> }
  | { type: 'START_GAME' };

// Utility type for zone majority calculation
export interface ZoneMajority {
  zoneId: string;
  counts: Record<string, number>;
  majorityOwner: string | null;
  isTied: boolean;
}

// Player colors - The Battalion Tactical Agent Palette (distinct from resource colors)
export const PLAYER_COLORS = ['rgb(246 161 161)', 'rgb(255, 255, 255)', 'rgb(170, 0, 255)', 'rgb(255 191 72)', 'rgb(147 232 255)'] as const;

// Resource colors - The Battalion Military Palette
export const RESOURCE_COLORS: Record<ResourceType, string> = {
  funds: '#4caf50',    // SUPPLY - Neon HUD Green
  clout: '#f44336',    // FIREPOWER - Alert Red
  media: '#03a9f4',    // INTEL - Cyan Data
  trust: '#ffeb3b',    // MORALE - Amber Warning
};

// Commander colors - The Battalion Military Palette
export const IDEOLOGY_COLORS: Record<IdeologyType, string> = {
  capitalist: '#4caf50',    // The Contractor - Green
  supremo: '#f44336',       // The Hardliner - Red
  showstopper: '#03a9f4',   // The Operative - Blue
  idealist: '#ffeb3b',      // The Diplomat - Yellow
};

// Constants
export const MAX_RESOURCES = 12;
export const ZONES_COUNT = 9;
