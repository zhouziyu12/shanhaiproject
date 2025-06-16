'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string | null;
}

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: null
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // 组件挂载后再渲染（保证只在客户端渲染钱包数据）
  useEffect(() => setMounted(true), []);

  // 检查现有连接
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletState(prev => ({
              ...prev,
              address,
              isConnected: true
            }));
            
            // 获取余额
            const balance = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest'],
            });
            
            const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
            setWalletState(prev => ({
              ...prev,
              balance: balanceInEth
            }));
          }
        } catch (error) {
          console.error('检查连接失败:', error);
        }
      }
    };

    if (mounted) {
      checkConnection();
    }
  }, [mounted]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('请安装MetaMask钱包！\n\n下载地址：https://metamask.io/');
      return;
    }

    try {
      setIsConnecting(true);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        
        // 检查网络
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        
        // 获取余额
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        
        const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
        
        setWalletState({
          address,
          isConnected: true,
          balance: balanceInEth
        });

        // 保存连接状态
        localStorage.setItem('walletConnected', 'true');
        
        // 显示连接成功消息
        console.log('钱包连接成功！', {
          address,
          chainId,
          balance: balanceInEth + ' ETH'
        });
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      if (error.code === 4001) {
        alert('用户拒绝了连接请求');
      } else {
        alert('连接失败，请重试');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      balance: null
    });
    localStorage.removeItem('walletConnected');
  };

  // SSR 阶段直接不渲染任何与钱包相关的内容
  if (!mounted) {
    return (
      <div className="bg-white/10 px-4 py-2 rounded-lg text-white animate-pulse">
        连接中...
      </div>
    );
  }

  // 已连接状态
  if (walletState.isConnected && walletState.address) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 px-3 py-2 rounded-lg text-white text-sm font-mono">
            {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
          </div>
          <button 
            onClick={disconnectWallet}
            className="bg-red-500/20 hover:bg-red-500/30 px-3 py-2 rounded-lg text-red-400 text-sm transition-colors"
          >
            断开
          </button>
        </div>
        
        {walletState.balance && (
          <div className="bg-white/5 p-3 rounded-lg text-center">
            <div className="text-xs text-white/60 mb-1">钱包余额</div>
            <div className="font-mono text-white text-sm">
              {walletState.balance} ETH
            </div>
          </div>
        )}
      </div>
    );
  }

  // 未连接状态
  return (
    <button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          连接中...
        </>
      ) : (
        '连接钱包'
      )}
    </button>
  );
}

// 导出 Hook 供其他组件使用
export function useWallet() {
  const [mounted, setMounted] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: null
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          });
          
          if (accounts.length > 0) {
            setWalletState(prev => ({
              ...prev,
              address: accounts[0],
              isConnected: true
            }));
          }
        } catch (error) {
          console.error('检查连接失败:', error);
        }
      }
    };

    if (mounted) {
      checkConnection();
    }
  }, [mounted]);

  return {
    ...walletState,
    mounted
  };
}
