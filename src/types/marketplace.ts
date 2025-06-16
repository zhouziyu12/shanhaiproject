// ========== src/types/marketplace.ts ==========
export interface Listing {
  tokenId: number;
  seller: string;
  price: bigint;
  timestamp: number;
  active: boolean;
  // 扩展信息
  beast?: Beast;
  priceInEth?: number;
  timeLeft?: number;
}

export interface Offer {
  tokenId: number;
  bidder: string;
  amount: bigint;
  timestamp: number;
  expiresAt: number;
  active: boolean;
  // 扩展信息
  amountInEth?: number;
  timeLeft?: number;
}

export interface MarketStats {
  totalListings: number;
  totalSales: number;
  totalVolume: bigint;
  marketFee: number;
  // 扩展统计
  averagePrice?: number;
  volumeInEth?: number;
  topSale?: number;
}

export interface UserMarketStats {
  salesCount: number;
  purchaseCount: number;
  activeListings: number;
  activeOffers: number;
  // 扩展统计
  totalEarned?: number;
  totalSpent?: number;
}