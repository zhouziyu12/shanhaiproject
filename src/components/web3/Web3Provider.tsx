'use client';

import { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/* 1. wagmi v2 基础引入                                               */
/* ------------------------------------------------------------------ */
import {
  WagmiProvider,          // React Context provider
  createConfig,           // 创建全局 config
  http,                   // v2 推荐的 RPC helper
} from 'wagmi';
import { sepolia } from 'wagmi/chains'; // 需要的链常量

/* ------------------------------------------------------------------ */
/* 2. RainbowKit v1                                                   */
/* ------------------------------------------------------------------ */
import {
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

/* ------------------------------------------------------------------ */
/* 3. TanStack React-Query v4                                         */
/* ------------------------------------------------------------------ */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

/* ------------------------------------------------------------------ */
/* 4. wagmi v2 配置                                                   */
/* ------------------------------------------------------------------ */

/** 4-1 你要支持的链列表（可加 mainnet、polygon 等） */
const chains = [sepolia];

/** 4-2 RPC 端点（这里用公共 RPC；若要用 Alchemy/Infura，可手动填写 http('https://…')） */
const transports = {
  [sepolia.id]: http(),               // 默认用户 IP 就近的公共节点
};

/** 4-3 钱包连接器（RainbowKit 会把常用钱包都自动打包） */
const { connectors } = getDefaultWallets({
  appName: 'ShanHaiVerse',
  projectId: 'YOUR_WC_PROJECT_ID',    // WalletConnect v2 的 projectId
  chains,
});

/** 4-4 生成 wagmi 全局配置对象 */
const wagmiConfig = createConfig({
  chains,
  transports,
  connectors,
  autoConnect: true,  // 自动重连上一次已连接的钱包
  ssr: true,          // Next.js 环境建议开启
});

/* ------------------------------------------------------------------ */
/* 5. 导出 Web3Provider 组件                                          */
/* ------------------------------------------------------------------ */
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
