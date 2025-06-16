// ========== src/types/events.ts ==========
export interface ContractEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
  args: Record<string, any>;
}

export interface BeastMintedEvent extends ContractEvent {
  eventName: 'BeastMinted';
  args: {
    tokenId: number;
    creator: string;
    prompt: string;
    hasIPFS: boolean;
  };
}

export interface RarityRevealedEvent extends ContractEvent {
  eventName: 'RarityRevealed';
  args: {
    tokenId: number;
    rarity: Rarity;
    randomValue: number;
  };
}

export interface ItemListedEvent extends ContractEvent {
  eventName: 'ItemListed';
  args: {
    tokenId: number;
    seller: string;
    price: bigint;
    timestamp: number;
  };
}

export interface ItemSoldEvent extends ContractEvent {
  eventName: 'ItemSold';
  args: {
    tokenId: number;
    seller: string;
    buyer: string;
    price: bigint;
    fee: bigint;
    timestamp: number;
  };
}

export interface DailyRewardClaimedEvent extends ContractEvent {
  eventName: 'DailyRewardClaimed';
  args: {
    user: string;
    amount: bigint;
    consecutiveDays: number;
  };
}
