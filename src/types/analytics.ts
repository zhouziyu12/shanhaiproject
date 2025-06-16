export interface AnalyticsData {
  // 用户行为
  pageViews: number;
  uniqueVisitors: number;
  averageSessionDuration: number;
  // NFT数据
  totalBeasts: number;
  newBeastsToday: number;
  rarityDistribution: Record<Rarity, number>;
  // 交易数据
  totalVolume: number;
  dailyVolume: number;
  averagePrice: number;
  topSale: number;
  // 用户数据
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
}

// ========== 通用工具类型 ==========
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ========== 响应类型 ==========
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}