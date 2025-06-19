'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  balance: string | null;
  chainId: string | null;
  ensName: string | null;
}

interface NetworkInfo {
  chainId: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorer: string;
}

const SUPPORTED_NETWORKS: Record<string, NetworkInfo> = {
  '0x1': {
    chainId: '0x1',
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorer: 'https://etherscan.io'
  },
  '0xaa36a7': {
    chainId: '0xaa36a7',
    name: 'Sepolia Testnet',
    symbol: 'ETH',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io'
  }
};

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: null,
    chainId: null,
    ensName: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 组件挂载后再渲染
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
              balance: balanceInEth,
              chainId,
              ensName: null // 可以后续添加 ENS 解析
            });
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

  // 监听账户和网络变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // 用户断开连接
          disconnectWallet();
        } else {
          // 账户切换
          const newAddress = accounts[0];
          setWalletState(prev => ({
            ...prev,
            address: newAddress
          }));
          // 重新获取余额
          updateBalance(newAddress);
          
          // 触发账户变更事件
          window.dispatchEvent(new CustomEvent('walletAccountChanged', {
            detail: { address: newAddress }
          }));
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId
        }));
        // 重新获取余额
        if (walletState.address) {
          updateBalance(walletState.address);
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [walletState.address]);

  const updateBalance = async (address: string) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
      setWalletState(prev => ({
        ...prev,
        balance: balanceInEth
      }));
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('请安装 MetaMask 或其他以太坊钱包');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        const chainId = await window.ethereum.request({
          method: 'eth_chainId',
        });
        
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest'],
        });
        
        const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
        
        setWalletState({
          address,
          isConnected: true,
          balance: balanceInEth,
          chainId,
          ensName: null
        });

        localStorage.setItem('walletConnected', 'true');
        
        // 触发自定义事件通知其他组件状态变更
        window.dispatchEvent(new CustomEvent('walletConnected', {
          detail: { address, balance: balanceInEth, chainId }
        }));
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      if (error.code === 4001) {
        setError('用户拒绝了连接请求');
      } else {
        setError('连接失败，请重试');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      balance: null,
      chainId: null,
      ensName: null
    });
    setShowDropdown(false);
    localStorage.removeItem('walletConnected');
    
    // 触发自定义事件通知其他组件状态变更
    window.dispatchEvent(new CustomEvent('walletDisconnected'));
  };

  const switchNetwork = async (targetChainId: string) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // 网络不存在，尝试添加
        const network = SUPPORTED_NETWORKS[targetChainId];
        if (network) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer],
              }],
            });
          } catch (addError) {
            console.error('添加网络失败:', addError);
          }
        }
      }
    }
  };

  const copyAddress = async () => {
    if (walletState.address) {
      await navigator.clipboard.writeText(walletState.address);
      // 可以添加一个 toast 提示
    }
  };

  const openInExplorer = () => {
    if (walletState.address && walletState.chainId) {
      const network = SUPPORTED_NETWORKS[walletState.chainId];
      if (network) {
        window.open(`${network.blockExplorer}/address/${walletState.address}`, '_blank');
      }
    }
  };

  // SSR 阶段不渲染
  if (!mounted) {
    return (
      <div className="w-32 h-10 bg-white/10 rounded-lg animate-pulse" />
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="text-red-400 text-sm max-w-48 text-center">{error}</div>
        <Button 
          onClick={() => setError(null)} 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          重试
        </Button>
      </div>
    );
  }

  // 已连接状态
  if (walletState.isConnected && walletState.address) {
    const currentNetwork = walletState.chainId ? SUPPORTED_NETWORKS[walletState.chainId] : null;
    
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="group relative flex items-center space-x-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 hover:border-blue-400/50 backdrop-blur-xl rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105"
        >
          {/* 状态指示器 */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-20" />
            </div>
            <span className="text-green-400 text-sm font-medium">已连接</span>
          </div>

          {/* 地址显示 */}
          <div className="flex flex-col items-start">
            <div className="font-mono text-white text-sm">
              {walletState.address.slice(0, 6)}...{walletState.address.slice(-4)}
            </div>
            {walletState.balance && (
              <div className="text-xs text-gray-400">
                {walletState.balance} ETH
              </div>
            )}
          </div>

          {/* 下拉箭头 */}
          <div className={`transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* 下拉菜单 */}
        {showDropdown && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDropdown(false)}
            />
            
            {/* 菜单内容 */}
            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-scale">
              {/* 账户信息 */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">账户信息</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-green-400 text-sm">活跃</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* 地址 */}
                  <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">钱包地址</div>
                      <div className="font-mono text-white text-sm">
                        {walletState.address.slice(0, 12)}...{walletState.address.slice(-8)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={copyAddress}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="复制地址"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={openInExplorer}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="在浏览器中查看"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 余额 */}
                  {walletState.balance && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">余额</div>
                      <div className="font-mono text-white text-lg">
                        {walletState.balance} ETH
                      </div>
                    </div>
                  )}

                  {/* 网络信息 */}
                  {currentNetwork && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">当前网络</div>
                      <div className="flex items-center justify-between">
                        <span className="text-white">{currentNetwork.name}</span>
                        {walletState.chainId !== '0xaa36a7' && (
                          <button
                            onClick={() => switchNetwork('0xaa36a7')}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            切换到 Sepolia
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => updateBalance(walletState.address!)}
                  className="w-full flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 rounded-lg py-2.5 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-white text-sm">刷新余额</span>
                </button>
                
                <button
                  onClick={disconnectWallet}
                  className="w-full flex items-center justify-center space-x-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 rounded-lg py-2.5 transition-colors"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-red-400 text-sm">断开连接</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // 未连接状态
  return (
    <Button 
      onClick={connectWallet}
      disabled={isConnecting}
      className="relative group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
    >
      {isConnecting ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          连接中...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          连接钱包
        </>
      )}
      
      {/* 悬停光效 */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-xl transition-all duration-300" />
    </Button>
  );
}

// 导出 Hook 供其他组件使用
export function useWallet() {
  const [mounted, setMounted] = useState(false);
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    balance: null,
    chainId: null,
    ensName: null
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
            const address = accounts[0];
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
              balance: balanceInEth,
              chainId,
              ensName: null
            });
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

  // 监听钱包状态变化事件
  useEffect(() => {
    const handleWalletConnected = (event: any) => {
      const { address, balance, chainId } = event.detail;
      setWalletState({
        address,
        isConnected: true,
        balance,
        chainId,
        ensName: null
      });
    };

    const handleWalletDisconnected = () => {
      setWalletState({
        address: null,
        isConnected: false,
        balance: null,
        chainId: null,
        ensName: null
      });
    };

    const handleAccountChanged = (event: any) => {
      const { address } = event.detail;
      setWalletState(prev => ({
        ...prev,
        address
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('walletConnected', handleWalletConnected);
      window.addEventListener('walletDisconnected', handleWalletDisconnected);
      window.addEventListener('walletAccountChanged', handleAccountChanged);

      return () => {
        window.removeEventListener('walletConnected', handleWalletConnected);
        window.removeEventListener('walletDisconnected', handleWalletDisconnected);
        window.removeEventListener('walletAccountChanged', handleAccountChanged);
      };
    }
  }, []);

  // 监听 MetaMask 原生事件
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            address: null,
            isConnected: false,
            balance: null,
            chainId: null,
            ensName: null
          });
        } else {
          setWalletState(prev => ({
            ...prev,
            address: accounts[0]
          }));
        }
      };

      const handleChainChanged = (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId
        }));
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  return {
    ...walletState,
    mounted
  };
}