import { HeadlineCard } from '@/types/game';

export const headlineCards: HeadlineCard[] = [
  // Negative Global Effects
  {
    id: 'headline_1',
    title: 'Supply Line Cut',
    description: 'Enemy action disrupts logistics! All Commanders lose 2 Supply.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'funds',
      value: -2,
      targetType: 'all',
    },
  },
  {
    id: 'headline_2',
    title: 'Troop Morale Drops',
    description: 'Reports of civilian casualties damage morale. All Commanders lose 2 Morale.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'trust',
      value: -2,
      targetType: 'all',
    },
  },
  {
    id: 'headline_3',
    title: 'Communications Jammed',
    description: 'Enemy jamming disrupts intelligence networks. All Commanders lose 2 Intel.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'media',
      value: -2,
      targetType: 'all',
    },
  },
  {
    id: 'headline_4',
    title: 'Ammunition Shortage',
    description: 'Depleted stockpiles weaken strike capability. All Commanders lose 2 Firepower.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'clout',
      value: -2,
      targetType: 'all',
    },
  },

  // Positive Active Player Effects
  {
    id: 'headline_5',
    title: 'Supply Drop',
    description: 'Resupply convoy arrives! Active Commander gains 3 Supply.',
    effect: {
      type: 'PLAYER_RESOURCE_MOD',
      resource: 'funds',
      value: 3,
      targetType: 'active',
    },
  },
  {
    id: 'headline_6',
    title: 'Intel Breakthrough',
    description: 'Your operatives decrypt enemy communications! Active Commander gains 3 Intel.',
    effect: {
      type: 'PLAYER_RESOURCE_MOD',
      resource: 'media',
      value: 3,
      targetType: 'active',
    },
  },
  {
    id: 'headline_7',
    title: 'Local Support',
    description: 'Civilians rally to your cause! Active Commander gains 3 Morale.',
    effect: {
      type: 'PLAYER_RESOURCE_MOD',
      resource: 'trust',
      value: 3,
      targetType: 'active',
    },
  },
  {
    id: 'headline_8',
    title: 'Weapons Cache Found',
    description: 'Your forces discover enemy armory! Active Commander gains 3 Firepower.',
    effect: {
      type: 'PLAYER_RESOURCE_MOD',
      resource: 'clout',
      value: 3,
      targetType: 'active',
    },
  },

  // Positive Global Effects
  {
    id: 'headline_9',
    title: 'Supply Airlifted',
    description: 'Emergency airlift delivers supplies. All Commanders gain 1 Supply.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'funds',
      value: 1,
      targetType: 'all',
    },
  },
  {
    id: 'headline_10',
    title: 'Ceasefire Talks',
    description: 'Peace negotiations boost morale. All Commanders gain 1 Morale.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'trust',
      value: 1,
      targetType: 'all',
    },
  },

  // Targeted Effects (hurting others)
  {
    id: 'headline_11',
    title: 'Supply Sabotage',
    description: 'Enemy saboteurs strike supply lines! Other Commanders lose 1 Supply.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'funds',
      value: -1,
      targetType: 'others',
    },
  },
  {
    id: 'headline_12',
    title: 'War Crimes Allegations',
    description: 'Accusations damage credibility. Other Commanders lose 1 Morale.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'trust',
      value: -1,
      targetType: 'others',
    },
  },

  // Commander-Based Bonuses
  {
    id: 'headline_13',
    title: 'Logistics Success',
    description: 'Contractors deliver! Gain 1 Supply per Contractor card you hold.',
    effect: {
      type: 'IDEOLOGY_BONUS',
      ideology: 'capitalist',
      resource: 'funds',
      value: 1,
    },
  },
  {
    id: 'headline_14',
    title: 'Show of Force',
    description: 'Hardliners intimidate enemies! Gain 1 Firepower per Hardliner card you hold.',
    effect: {
      type: 'IDEOLOGY_BONUS',
      ideology: 'supremo',
      resource: 'clout',
      value: 1,
    },
  },
  {
    id: 'headline_15',
    title: 'Intelligence Coup',
    description: 'Operatives crack enemy codes! Gain 1 Intel per Operative card you hold.',
    effect: {
      type: 'IDEOLOGY_BONUS',
      ideology: 'showstopper',
      resource: 'media',
      value: 1,
    },
  },
  {
    id: 'headline_16',
    title: 'Hearts and Minds',
    description: 'Diplomats win local support! Gain 1 Morale per Diplomat card you hold.',
    effect: {
      type: 'IDEOLOGY_BONUS',
      ideology: 'idealist',
      resource: 'trust',
      value: 1,
    },
  },

  // Control-Based Effects
  {
    id: 'headline_17',
    title: 'Fortified Positions',
    description: 'Defenders strengthen! Commanders with Control gain 2 resources of their choice.',
    effect: {
      type: 'MAJORITY_BONUS',
      value: 2,
      targetType: 'majority_holders',
    },
  },
  {
    id: 'headline_18',
    title: 'Guerrilla Aid',
    description: 'Resistance movements assist the underdog! Commanders without Control gain 3 resources of their choice.',
    effect: {
      type: 'MAJORITY_BONUS',
      value: 3,
      targetType: 'no_majority',
    },
  },

  // Battalion Effects
  {
    id: 'headline_19',
    title: 'Insurgency',
    description: 'Guerrilla activity disrupts operations! A random Battalion not in Hot Zone is removed from the map.',
    effect: {
      type: 'VOTER_EFFECT',
      battalionEffect: 'REMOVE_RANDOM',
    },
  },
  {
    id: 'headline_20',
    title: 'Volunteer Recruits',
    description: 'Fresh troops arrive! Active Commander places 1 free Battalion on the map.',
    effect: {
      type: 'VOTER_EFFECT',
      battalionEffect: 'ADD_FREE_BATTALION',
    },
  },

  // Market Effects
  {
    id: 'headline_21',
    title: 'Recruitment Crisis',
    description: 'Deployment orders disrupted! Battalion market is reshuffled.',
    effect: {
      type: 'MARKET_EFFECT',
    },
  },

  // Mixed Effects
  {
    id: 'headline_22',
    title: 'Resource Redistribution',
    description: 'UN aid redistributed. Everyone loses 1 Supply, gains 1 Morale.',
    effect: {
      type: 'GLOBAL_RESOURCE_MOD',
      resource: 'trust',
      value: 1,
      targetType: 'all',
    },
  },
  {
    id: 'headline_23',
    title: 'Information Warfare',
    description: 'Cyber warfare escalates. Active Commander gains 2 Intel, others lose 1 Intel.',
    effect: {
      type: 'PLAYER_RESOURCE_MOD',
      resource: 'media',
      value: 2,
      targetType: 'active',
    },
  },
  {
    id: 'headline_24',
    title: 'Military Alliance',
    description: 'Coalition forces strengthen. Commanders with most Battalions gain 2 Firepower.',
    effect: {
      type: 'MAJORITY_BONUS',
      resource: 'clout',
      value: 2,
      targetType: 'majority_holders',
    },
  },
];

export function shuffleHeadlineDeck(): HeadlineCard[] {
  const shuffled = [...headlineCards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
