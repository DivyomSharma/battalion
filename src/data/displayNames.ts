// The Battalion - Display Name Constants
// This file centralizes all UI terminology for the military theme

import { IdeologyType, ResourceType } from '@/types/game';

// Commander (Ideology) Display Names
export const commanderNames: Record<IdeologyType, string> = {
  capitalist: 'The Contractor',
  supremo: 'The Hardliner',
  showstopper: 'The Operative',
  idealist: 'The Diplomat',
};

// Short 3-letter commander abbreviations for compact displays
export const commanderAbbreviations: Record<IdeologyType, string> = {
  capitalist: 'CON',
  supremo: 'HAR',
  showstopper: 'OPR',
  idealist: 'DIP',
};

export const commanderDescriptions: Record<IdeologyType, string> = {
  capitalist: 'Attrition - Logistics & Economics',
  supremo: 'Annihilation - Direct Force',
  showstopper: 'Subversion - Intelligence & Covert Ops',
  idealist: 'Stabilization - Diplomacy & Hearts/Minds',
};

// Resource Display Names
export const resourceNames: Record<ResourceType, string> = {
  funds: 'Supply',
  clout: 'Firepower',
  media: 'Intel',
  trust: 'Morale',
};

// Game Terminology Mapping
export const terminology = {
  // Original -> New
  politician: 'Commander',
  voter: 'Battalion',
  zone: 'Sector',
  majority: 'Control',
  ideologyCard: 'Situation Report',
  conspiracyCard: 'Black Ops',
  headlineCard: 'Flashpoint',
  voterCard: 'Deployment Order',
  redeploy: 'Redeploy',
  influence: 'Deploy',
  volatileArea: 'Hot Zone',
  homeTurf: 'Forward Operating Base',

  // Plural forms
  politicians: 'Commanders',
  voters: 'Battalions',
  zones: 'Sectors',
  majorities: 'Control',
  ideologyCards: 'Situation Reports',
  conspiracyCards: 'Black Ops',
  headlineCards: 'Flashpoints',
  deploymentOrders: 'Deployment Orders',
};

// UI Messages
export const messages = {
  turnStart: 'Commander, awaiting orders.',
  redeployPrompt: 'Select a Sector to Redeploy troops from.',
  majorityGained: 'Sector Secured! We have Control.',
  volatileWarning: 'Warning: Hot Zone activity detected.',
  gameOver: 'Ceasefire called. Assessing territory control.',
  deploymentPhase: 'Deploy your Battalions to the map.',
  redeployPhase: 'Redeploy Battalions between adjacent Sectors.',
  actionPhase: 'Buy cards, use powers, or play Black Ops.',
  sitrepPhase: 'Answer the Situation Report.',
};

// Game Title
export const gameTitle = 'THE BATTALION';
export const gameSubtitle = 'Tactical Military Strategy';
