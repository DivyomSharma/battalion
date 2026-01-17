// Elite Card Definitions for SHASN

import { EliteCard, EliteId, EliteRequirements, IdeologyTracks, Player } from '@/types/game';

// All elite cards in the game
export const eliteCards: EliteCard[] = [
  {
    id: 'technocrat',
    name: 'The Technocrat',
    requirements: { capitalist: 3, showstopper: 3, supremo: 0 },
    effect: 'Resource limit increases to 12. Store influenced voters on mat instead of placing immediately.',
    isPassive: true,
  },
  {
    id: 'lobbyist',
    name: 'The Lobbyist',
    requirements: { capitalist: 3, showstopper: 3, idealist: 0 },
    effect: 'Double resources earned from answering Ideology Cards.',
    isPassive: true,
  },
  {
    id: 'philanthropist',
    name: 'The Philanthropist',
    requirements: { capitalist: 3, idealist: 3, supremo: 0 },
    effect: 'Once per turn, donate 2 resources to an opponent to influence 1 free voter.',
    isPassive: false,
  },
  {
    id: 'patron',
    name: 'The Patron',
    requirements: { capitalist: 3, idealist: 3, showstopper: 0 },
    effect: 'Gain 1 free voter when an opponent buys a 3-Voter card.',
    isPassive: true,
  },
  {
    id: 'provocateur',
    name: 'The Provocateur',
    requirements: { showstopper: 3, supremo: 3, capitalist: 0 },
    effect: 'Buy Conspiracy Cards at discount: -2 from deck, -1 from discard.',
    isPassive: true,
  },
  {
    id: 'propagandist',
    name: 'The Propagandist',
    requirements: { showstopper: 3, supremo: 3, idealist: 0 },
    effect: 'Pay 3 resources to force a Headline card effect on any player.',
    isPassive: false,
  },
  {
    id: 'activist',
    name: 'The Activist',
    requirements: { showstopper: 3, idealist: 3, capitalist: 0 },
    effect: 'Once per turn, peek at an opponent\'s Conspiracy cards.',
    isPassive: false,
  },
  {
    id: 'whistleblower',
    name: 'The Whistleblower',
    requirements: { showstopper: 3, idealist: 3, supremo: 0 },
    effect: 'Discard 1 opponent voter when they use Conspiracy. Gain 2 voters if no Conspiracy used in a round.',
    isPassive: true,
  },
  {
    id: 'guru',
    name: 'The Guru',
    requirements: { supremo: 3, idealist: 3, capitalist: 0 },
    effect: 'Discard 1 of your own voters to gain 3 resources of your choice.',
    isPassive: false,
  },
  {
    id: 'guerrilla',
    name: 'The Guerrilla',
    requirements: { supremo: 3, idealist: 3, showstopper: 0 },
    effect: 'Move 4 of your own voters into adjacent zones (stacks with Redeployment rights).',
    isPassive: true,
  },
  {
    id: 'mafioso',
    name: 'The Mafioso',
    requirements: { supremo: 3, capitalist: 3, showstopper: 0 },
    effect: 'Opponents must pay 1 resource to you at the start of their turn.',
    isPassive: true,
  },
  {
    id: 'dictator',
    name: 'The Dictator',
    requirements: { supremo: 3, capitalist: 3, idealist: 0 },
    effect: 'Convert opponent voters to yours when Redeployment them into zones you control.',
    isPassive: true,
  },
  {
    id: 'renegade',
    name: 'The Renegade',
    requirements: { passivePowersActive: 3, level3PowersActive: 0 },
    effect: 'Use any other Elite power once per turn.',
    isPassive: false,
  },
];

// Get elite card by ID
export function getEliteCard(id: EliteId): EliteCard | undefined {
  return eliteCards.find(e => e.id === id);
}

// Check if a player meets the requirements for an elite
export function meetsEliteRequirements(tracks: IdeologyTracks, requirements: EliteRequirements): boolean {
  // Check minimum requirements (must have at least X cards)
  if (requirements.capitalist !== undefined && requirements.capitalist > 0) {
    if (tracks.capitalist < requirements.capitalist) return false;
  }
  if (requirements.supremo !== undefined && requirements.supremo > 0) {
    if (tracks.supremo < requirements.supremo) return false;
  }
  if (requirements.showstopper !== undefined && requirements.showstopper > 0) {
    if (tracks.showstopper < requirements.showstopper) return false;
  }
  if (requirements.idealist !== undefined && requirements.idealist > 0) {
    if (tracks.idealist < requirements.idealist) return false;
  }

  // Check exclusion requirements (must have 0 cards)
  if (requirements.capitalist === 0 && tracks.capitalist > 0) return false;
  if (requirements.supremo === 0 && tracks.supremo > 0) return false;
  if (requirements.showstopper === 0 && tracks.showstopper > 0) return false;
  if (requirements.idealist === 0 && tracks.idealist > 0) return false;

  // Special case for Renegade: check passive powers and level 3 powers
  if (requirements.passivePowersActive !== undefined) {
    // Count passive powers (level 2) active
    let passiveCount = 0;
    if (tracks.capitalist >= 2) passiveCount++;
    if (tracks.supremo >= 2) passiveCount++;
    if (tracks.showstopper >= 2) passiveCount++;
    if (tracks.idealist >= 2) passiveCount++;
    if (passiveCount < requirements.passivePowersActive) return false;
  }

  if (requirements.level3PowersActive === 0) {
    // Must have no level 3 powers active
    if (tracks.capitalist >= 3) return false;
    if (tracks.supremo >= 3) return false;
    if (tracks.showstopper >= 3) return false;
    if (tracks.idealist >= 3) return false;
  }

  return true;
}

// Get all elites a player qualifies for
export function getQualifiedElites(tracks: IdeologyTracks): EliteCard[] {
  return eliteCards.filter(elite => meetsEliteRequirements(tracks, elite.requirements));
}

// Check if player has a specific elite active
export function hasActiveElite(player: Player, eliteId: EliteId): boolean {
  return player.activeElite === eliteId;
}

// Check if player has unlocked a specific elite
export function hasUnlockedElite(player: Player, eliteId: EliteId): boolean {
  return player.unlockedElites.includes(eliteId);
}

// Get the resource cap for a player (12 for Technocrat, 10 otherwise)
export function getResourceCap(player: Player): number {
  return hasActiveElite(player, 'technocrat') ? 12 : 10;
}

// Get the ideology reward multiplier (2x for Lobbyist)
export function getIdeologyRewardMultiplier(player: Player): number {
  return hasActiveElite(player, 'lobbyist') ? 2 : 1;
}

// Get conspiracy card discount for a player (Provocateur effect)
export function getConspiracyDiscount(player: Player): number {
  return hasActiveElite(player, 'provocateur') ? 2 : 0;
}

// Get bonus redeployment moves (Guerrilla gives +4)
export function getBonusRedeploymentMoves(player: Player): number {
  return hasActiveElite(player, 'guerrilla') ? 4 : 0;
}

// Check if player with Dictator converts voters on redeploy
export function hasDictatorConversion(player: Player): boolean {
  return hasActiveElite(player, 'dictator');
}
