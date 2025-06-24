// Rarity configuration
export const RARITY_CONFIG = {
  LEVELS: {
    0: { name: 'Common', probability: 60, color: 'text-gray-400', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/30' },
    1: { name: 'Rare', probability: 25, color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30' },
    2: { name: 'Epic', probability: 10, color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30' },
    3: { name: 'Legendary', probability: 4, color: 'text-orange-400', bgColor: 'bg-orange-500/20', borderColor: 'border-orange-500/30' },
    4: { name: 'Mythical', probability: 1, color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/30' }
  },
  VRF: {
    REVEAL_DELAY_MS: 8000,
    RANDOM_RANGE: 10000,
    CUMULATIVE_PROBABILITIES: [6000, 8500, 9500, 9900, 10000]
  },
  BONUSES: {
    0: { multiplier: 1.0, special: [] },
    1: { multiplier: 1.2, special: ['Blue Aura'] },
    2: { multiplier: 1.5, special: ['Purple Aura', 'Special Particles'] },
    3: { multiplier: 2.0, special: ['Golden Aura', 'Legendary Effects', 'Background Change'] },
    4: { multiplier: 3.0, special: ['Rainbow Aura', 'Mythical Effects', 'Fullscreen Effects', 'Exclusive Animation'] }
  }
};

export type RarityLevel = 0 | 1 | 2 | 3 | 4;

export function getRarityInfo(rarity: RarityLevel) {
  return RARITY_CONFIG.LEVELS[rarity];
}

export function generateVRFRequestId(): string {
  return `vrf_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function calculateRarity(randomWord: number): RarityLevel {
  const normalized = randomWord % RARITY_CONFIG.VRF.RANDOM_RANGE;
  
  for (let i = 0; i < RARITY_CONFIG.VRF.CUMULATIVE_PROBABILITIES.length; i++) {
    if (normalized < RARITY_CONFIG.VRF.CUMULATIVE_PROBABILITIES[i]) {
      return i as RarityLevel;
    }
  }
  
  return 0;
}