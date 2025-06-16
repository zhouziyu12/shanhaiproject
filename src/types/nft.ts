export interface Beast {
  tokenId: number;
  name?: string;
  prompt: string;
  ipfsImageUrl: string;
  ipfsMetadataUrl: string;
  imageGatewayUrl?: string;
  rarity: number;
  timestamp: number;
  creator: string;
  rarityRevealed: boolean;
  hasIPFS: boolean;
}

export type Rarity = 0 | 1 | 2 | 3 | 4;

export interface UserStats {
  lastClaimTime: number;
  consecutiveDays: number;
  totalClaimed: bigint;
  mintCount: number;
  totalClaimedInEth: number;
  canClaimToday: boolean;
}
