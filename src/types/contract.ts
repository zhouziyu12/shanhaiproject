// ========== src/types/contract.ts ==========
export interface ContractConfig {
  SHT_TOKEN: `0x${string}`;
  PROMPT_NFT: `0x${string}`;
  MARKETPLACE: `0x${string}`;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  currency: string;
  rpcUrl: string;
  blockExplorer: string;
}

export interface TransactionStatus {
  hash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  isError: boolean;
  error?: Error;
}

// ========== src/types/ui.ts ==========
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface FilterOptions {
  rarity?: Rarity[];
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'price' | 'rarity' | 'timestamp' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}
