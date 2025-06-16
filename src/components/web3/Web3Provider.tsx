'use client';

import { ReactNode } from 'react';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  // 简化版本，只是一个容器
  return <div>{children}</div>;
}
