import { DeploymentOrder } from '@/types/game';

export const deploymentOrderTemplates: DeploymentOrder[] = [
  // 1-battalion orders (cheap) - costs 2-3 total
  {
    id: 'battalion_1_funds',
    battalions: 1,
    cost: { funds: 2 },
  },
  {
    id: 'battalion_1_clout',
    battalions: 1,
    cost: { clout: 2 },
  },
  {
    id: 'battalion_1_media',
    battalions: 1,
    cost: { media: 2 },
  },
  {
    id: 'battalion_1_trust',
    battalions: 1,
    cost: { trust: 2 },
  },
  {
    id: 'battalion_1_mixed_1',
    battalions: 1,
    cost: { funds: 1, clout: 1 },
  },
  {
    id: 'battalion_1_mixed_2',
    battalions: 1,
    cost: { media: 1, trust: 1 },
  },

  // 2-battalion orders (medium) - costs 2-4 per resource type
  {
    id: 'battalion_2_funds_clout',
    battalions: 2,
    cost: { funds: 2, clout: 2 },
  },
  {
    id: 'battalion_2_media_trust',
    battalions: 2,
    cost: { media: 2, trust: 2 },
  },
  {
    id: 'battalion_2_funds_media',
    battalions: 2,
    cost: { funds: 2, media: 2 },
  },
  {
    id: 'battalion_2_clout_trust',
    battalions: 2,
    cost: { clout: 2, trust: 2 },
  },
  {
    id: 'battalion_2_funds_trust',
    battalions: 2,
    cost: { funds: 2, trust: 2 },
  },
  {
    id: 'battalion_2_clout_media',
    battalions: 2,
    cost: { clout: 2, media: 2 },
  },
  {
    id: 'battalion_2_all',
    battalions: 2,
    cost: { funds: 1, clout: 1, media: 1, trust: 1 },
  },

  // 3-battalion orders (expensive) - 3-3, 4-2, or 2-2-2 splits
  {
    id: 'battalion_3_funds_clout_33',
    battalions: 3,
    cost: { funds: 3, clout: 3 },
  },
  {
    id: 'battalion_3_media_trust_33',
    battalions: 3,
    cost: { media: 3, trust: 3 },
  },
  {
    id: 'battalion_3_funds_media_33',
    battalions: 3,
    cost: { funds: 3, media: 3 },
  },
  {
    id: 'battalion_3_clout_trust_33',
    battalions: 3,
    cost: { clout: 3, trust: 3 },
  },
  // 4-2 splits
  {
    id: 'battalion_3_funds4_clout2',
    battalions: 3,
    cost: { funds: 4, clout: 2 },
  },
  {
    id: 'battalion_3_funds4_media2',
    battalions: 3,
    cost: { funds: 4, media: 2 },
  },
  {
    id: 'battalion_3_funds4_trust2',
    battalions: 3,
    cost: { funds: 4, trust: 2 },
  },
  {
    id: 'battalion_3_clout4_funds2',
    battalions: 3,
    cost: { clout: 4, funds: 2 },
  },
  {
    id: 'battalion_3_clout4_media2',
    battalions: 3,
    cost: { clout: 4, media: 2 },
  },
  {
    id: 'battalion_3_clout4_trust2',
    battalions: 3,
    cost: { clout: 4, trust: 2 },
  },
  {
    id: 'battalion_3_media4_funds2',
    battalions: 3,
    cost: { media: 4, funds: 2 },
  },
  {
    id: 'battalion_3_media4_clout2',
    battalions: 3,
    cost: { media: 4, clout: 2 },
  },
  {
    id: 'battalion_3_media4_trust2',
    battalions: 3,
    cost: { media: 4, trust: 2 },
  },
  {
    id: 'battalion_3_trust4_funds2',
    battalions: 3,
    cost: { trust: 4, funds: 2 },
  },
  {
    id: 'battalion_3_trust4_clout2',
    battalions: 3,
    cost: { trust: 4, clout: 2 },
  },
  {
    id: 'battalion_3_trust4_media2',
    battalions: 3,
    cost: { trust: 4, media: 2 },
  },
  // 2-2-2 triple splits
  {
    id: 'battalion_3_triple_1',
    battalions: 3,
    cost: { funds: 2, clout: 2, media: 2 },
  },
  {
    id: 'battalion_3_triple_2',
    battalions: 3,
    cost: { funds: 2, clout: 2, trust: 2 },
  },
  {
    id: 'battalion_3_triple_3',
    battalions: 3,
    cost: { funds: 2, media: 2, trust: 2 },
  },
  {
    id: 'battalion_3_triple_4',
    battalions: 3,
    cost: { clout: 2, media: 2, trust: 2 },
  },
];

export function generateDeploymentShop(): DeploymentOrder[] {
  // 4 open Deployment Orders in Unit Requisition
  const shuffled = [...deploymentOrderTemplates].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4).map((card, index) => ({
    ...card,
    id: `shop_${index}_${card.id}`,
  }));
}

export function refreshDeploymentOrder(currentShop: DeploymentOrder[], boughtCardId: string): DeploymentOrder[] {
  const newShop = currentShop.filter(card => card.id !== boughtCardId);
  const availableCards = deploymentOrderTemplates.filter(
    template => !newShop.some(m => m.id.includes(template.id))
  );
  if (availableCards.length > 0) {
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    newShop.push({
      ...randomCard,
      id: `shop_${Date.now()}_${randomCard.id}`,
    });
  }
  return newShop;
}

export function generateDeploymentOrder(): DeploymentOrder {
  const randomCard = deploymentOrderTemplates[Math.floor(Math.random() * deploymentOrderTemplates.length)];
  return {
    ...randomCard,
    id: `shop_${Date.now()}_${randomCard.id}`,
  };
}
