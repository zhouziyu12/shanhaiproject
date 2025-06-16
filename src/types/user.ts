// ========== src/types/user.ts ==========
export interface UserStats {
  lastClaimTime: number;
  consecutiveDays: number;
  totalClaimed: bigint;
  mintCount: number;
  // 扩展统计
  totalClaimedInEth?: number;
  nextClaimTime?: number;
  canClaimToday?: boolean;
  estimatedReward?: number;
}

export interface UserProfile {
  address: string;
  ensName?: string;
  avatar?: string;
  // Token相关
  shtBalance: bigint;
  shtBalanceInEth: number;
  userStats: UserStats;
  // NFT相关
  beastCount: number;
  beasts: Beast[];
  rarityDistribution: number[];
  // 市场相关
  marketStats: UserMarketStats;
  // 设置
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  notifications: {
    newListings: boolean;
    priceChanges: boolean;
    offers: boolean;
    sales: boolean;
  };
  privacy: {
    showProfile: boolean;
    showStats: boolean;
    showCollection: boolean;
  };
}

// ========== src/types/api.ts ==========
export interface AIGenerationRequest {
  userInput: string;
  style: ArtStyle;
  rarity?: 'random' | Rarity;
  enhancePrompt?: boolean;
}

export interface AIGenerationResponse {
  success: boolean;
  originalInput: string;
  optimizedPrompt: string;
  imageUrl: string;
  imageId: string;
  style: ArtStyle;
  timestamp: string;
  workflow: {
    step1: string;
    step2: string;
    step3: string;
  };
  error?: string;
}

export interface IPFSUploadRequest {
  imageUrl: string;
  originalInput: string;
  optimizedPrompt: string;
  style: ArtStyle;
  rarity?: number;
  creator: string;
  imageId?: string;
}

export interface IPFSUploadResponse {
  success: boolean;
  ipfs: {
    imageUrl: string;
    metadataUrl: string;
    imageGatewayUrl: string;
    metadataGatewayUrl: string;
    cids: {
      image: string;
      metadata: string;
    };
  };
  metadata: BeastMetadata;
  originalInput: string;
  optimizedPrompt: string;
  workflow: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
  mintInfo: {
    tokenURI: string;
    imageUrl: string;
    gatewayUrl: string;
  };
  error?: string;
}

export type ArtStyle = 'classic' | 'modern' | 'fantasy' | 'ink';

export interface StyleConfig {
  name: string;
  description: string;
  prompt: string;
  color: string;
}