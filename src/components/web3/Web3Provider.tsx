'use client';

import { ReactNode } from 'react';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // 简化版本，暂时不包含真实的Web3功能
  // 等基础功能正常后再添加 RainbowKit 和 Wagmi
  
  return (
    <div>
      {children}
    </div>
  );
}
