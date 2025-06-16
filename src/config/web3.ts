export const CONTRACTS = {
  SHT_TOKEN: process.env.NEXT_PUBLIC_SHT_TOKEN_ADDRESS || '',
  PROMPT_NFT: process.env.NEXT_PUBLIC_PROMPT_NFT_ADDRESS || '',
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',
};

export const RARITY_CONFIG = {
  NAMES: ['普通', '稀有', '史诗', '传说', '神话'],
  COLORS: {
    0: 'text-gray-400',
    1: 'text-blue-400', 
    2: 'text-purple-400',
    3: 'text-orange-400',
    4: 'text-red-400',
  },
  GLOW: {
    0: 'hover:shadow-gray-500/20',
    1: 'hover:shadow-blue-500/30',
    2: 'hover:shadow-purple-500/40', 
    3: 'hover:shadow-orange-500/50',
    4: 'hover:shadow-red-500/60',
  },
  PROBABILITIES: {
    0: 60, // 普通 60%
    1: 25, // 稀有 25%
    2: 10, // 史诗 10%
    3: 4,  // 传说 4%
    4: 1,  // 神话 1%
  }
};

export const formatTokenAmount = (amount: bigint | string | number): string => {
  if (typeof amount === 'bigint') {
    return (Number(amount) / 1e18).toFixed(2);
  }
  if (typeof amount === 'string') {
    return parseFloat(amount).toFixed(2);
  }
  return amount.toFixed(2);
};

export const formatAddress = {
  short: (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
};
