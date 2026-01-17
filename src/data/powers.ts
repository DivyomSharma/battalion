import { IdeologyPower, IdeologyType, Resources } from '@/types/game';

// The Battalion Commander Powers
export const ideologyPowers: IdeologyPower[] = [
  // The Contractor Powers (Green/Supply)
  {
    ideology: 'capitalist',
    level: 2,
    name: 'Logistics Network',
    description: 'Passive: Gain +1 Supply for every 2 Green cards held.',
    isPassive: true,
  },
  {
    ideology: 'capitalist',
    level: 3,
    name: 'No-Bid Contract',
    description: 'Trade 1 Supply to Bank for 2 Random Resources.',
    isPassive: false,
    cost: {},
  },
  {
    ideology: 'capitalist',
    level: 5,
    name: 'Supply Blockade',
    description: 'Spend Supply to Evict an enemy Battalion. Three times per turn (including Control units). Evicted Battalions can be placed back next turn.',
    isPassive: false,
    cost: {},
  },

  // The Hardliner Powers (Red/Firepower)
  {
    ideology: 'supremo',
    level: 2,
    name: 'Arsenal',
    description: 'Passive: Gain +1 Firepower for every 2 Red cards held.',
    isPassive: true,
  },
  {
    ideology: 'supremo',
    level: 3,
    name: 'Commandeer',
    description: 'Steal 1 Resource from an opponent. Twice per turn.',
    isPassive: false,
    cost: {},
  },
  {
    ideology: 'supremo',
    level: 5,
    name: 'Kinetic Strike',
    description: 'Spend Firepower to Destroy an enemy Battalion. Twice per turn (including Control units). Battalions in Hot Zones cannot be destroyed.',
    isPassive: false,
    cost: {},
  },

  // The Operative Powers (Blue/Intel)
  {
    ideology: 'showstopper',
    level: 2,
    name: 'Surveillance Net',
    description: 'Passive: Gain +1 Intel for every 2 Blue cards held.',
    isPassive: true,
  },
  {
    ideology: 'showstopper',
    level: 3,
    name: 'Phantom Unit',
    description: 'Get +1 extra Battalion when Deploying troops. Twice per turn (extra Battalions can be split across Sectors).',
    isPassive: false,
    cost: {},
  },
  {
    ideology: 'showstopper',
    level: 5,
    name: 'Rapid Redeploy',
    description: 'Redeploy 2 Battalions per Sector. Can move Control units. For every Sector where you have Redeployment Rights.',
    isPassive: false,
    cost: {},
  },

  // The Diplomat Powers (Yellow/Morale)
  {
    ideology: 'idealist',
    level: 2,
    name: 'Local Support',
    description: 'Passive: Gain +1 Morale for every 2 Yellow cards held.',
    isPassive: true,
  },
  {
    ideology: 'idealist',
    level: 3,
    name: 'Local Coalition',
    description: 'Deploy Battalions at a discount. Twice per turn, get 1 resource discount on deploying Battalion cards.',
    isPassive: false,
    cost: {},
  },
  {
    ideology: 'idealist',
    level: 5,
    name: 'Defection',
    description: 'Once per turn, spend 2 Morale + any 2 resources to Convert 2 enemy Battalions to yours (must be same player, same Sector). Battalions in Hot Zones cannot be converted.',
    isPassive: false,
    cost: { trust: 2 },
  },
];

export function getPowersByIdeology(ideology: IdeologyType): IdeologyPower[] {
  return ideologyPowers.filter(p => p.ideology === ideology);
}

export function getUnlockedPowers(ideologyTracks: Record<IdeologyType, number>): IdeologyPower[] {
  const unlocked: IdeologyPower[] = [];

  for (const ideology of Object.keys(ideologyTracks) as IdeologyType[]) {
    const level = ideologyTracks[ideology];
    const powers = getPowersByIdeology(ideology);

    for (const power of powers) {
      if (level >= power.level) {
        unlocked.push(power);
      }
    }
  }

  return unlocked;
}

export function getActivePowers(ideologyTracks: Record<IdeologyType, number>): IdeologyPower[] {
  return getUnlockedPowers(ideologyTracks).filter(p => !p.isPassive);
}

export function hasUnlockedPower(
  ideologyTracks: Record<IdeologyType, number>,
  ideology: IdeologyType,
  level: 2 | 3 | 5
): boolean {
  return ideologyTracks[ideology] >= level;
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
  redeploymentUsed: number; // Number of redeploys used this turn
}

export function createPowerUsage(): PowerUsage {
  return {
    capitalistL3: 0,
    capitalistL5: 0,
    supremoL3: 0,
    supremoL5: 0,
    showstopperL3: 0,
    idealistL3: 0,
    idealistL5: 0,
    redeploymentUsed: 0,
  };
}

export function canUsePower(
  usage: PowerUsage,
  ideology: IdeologyType,
  level: 3 | 5
): boolean {
  switch (ideology) {
    case 'capitalist':
      return level === 3 ? usage.capitalistL3 < 1 : usage.capitalistL5 < 3;
    case 'supremo':
      return level === 3 ? usage.supremoL3 < 2 : usage.supremoL5 < 2;
    case 'showstopper':
      return level === 3 ? usage.showstopperL3 < 2 : true; // L5 is passive modifier
    case 'idealist':
      return level === 3 ? usage.idealistL3 < 2 : usage.idealistL5 < 1;
    default:
      return false;
  }
}
