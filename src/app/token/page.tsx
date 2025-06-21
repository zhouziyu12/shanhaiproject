'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Loader2, RefreshCw, TrendingUp, Zap, CheckCircle, AlertCircle, Trophy, Star, Users, Activity } from 'lucide-react';

// SHT Token Contract Address
const SHT_TOKEN_ADDRESS = '0xDd0C2E81D9134A914fcA7Db9655d9813C87D5701' as const;

// SHT Token Contract ABI
const SHT_TOKEN_ABI = [
  {
    "inputs": [{"internalType": "address","name": "account","type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256","name": "","type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimDailyReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address","name": "user","type": "address"}],
    "name": "canClaimToday",
    "outputs": [{"internalType": "bool","name": "","type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export default function SHTRewardsCenter() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  
  // Mock real-time data
  const [platformStats, setPlatformStats] = useState({
    totalHolders: 28547,
    dailyActiveUsers: 8934,
    totalStaked: 2847521.5,
    avgDailyReward: 125.7,
    circulatingSupply: 18500000
  });

  const [recentActivities] = useState([
    { user: '0x7f2A...a2b8', action: 'Daily Check-in', amount: 150, time: '2 min ago', type: 'checkin' },
    { user: '0x3a4B...9c4d', action: 'NFT Creation Reward', amount: 500, time: '5 min ago', type: 'create' },
    { user: '0x8e1F...1f7c', action: 'Staking Reward', amount: 75, time: '8 min ago', type: 'stake' },
    { user: '0x5b6D...6d2a', action: 'Referral Bonus', amount: 200, time: '12 min ago', type: 'referral' },
    { user: '0x9c8E...3a5f', action: 'Community Contribution', amount: 300, time: '15 min ago', type: 'community' }
  ]);

  const [leaderboard] = useState([
    { rank: 1, address: '0x7f2A...a2b8', nickname: 'DragonMaster', balance: 125840, badge: '🐲' },
    { rank: 2, address: '0x3a4B...9c4d', nickname: 'MythicForge', balance: 98745, badge: '⚡' },
    { rank: 3, address: '0x8e1F...1f7c', nickname: 'PhoenixArt', balance: 87632, badge: '🔥' },
    { rank: 4, address: '0x5b6D...6d2a', nickname: 'ForestGuard', balance: 76521, badge: '🌲' },
    { rank: 5, address: '0x9c8E...3a5f', nickname: 'IceWarrior', balance: 65432, badge: '❄️' }
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPlatformStats(prev => ({
        totalHolders: prev.totalHolders + Math.floor(Math.random() * 3),
        dailyActiveUsers: prev.dailyActiveUsers + Math.floor(Math.random() * 5) - 2,
        totalStaked: prev.totalStaked + (Math.random() * 100),
        avgDailyReward: prev.avgDailyReward + (Math.random() * 2 - 1),
        circulatingSupply: prev.circulatingSupply + Math.floor(Math.random() * 10)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Read SHT balance
  const { data: balance, refetch: refetchBalance, isLoading: balanceLoading, error: balanceError } = useReadContract({
    address: SHT_TOKEN_ADDRESS,
    abi: SHT_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && mounted,
      refetchInterval: 5000,
    },
  });

  // Read total supply
  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: SHT_TOKEN_ADDRESS,
    abi: SHT_TOKEN_ABI,
    functionName: 'totalSupply',
    query: { 
      enabled: mounted,
      refetchInterval: 10000,
    },
  });

  // Read if can claim today
  const { data: canClaim, refetch: refetchCanClaim } = useReadContract({
    address: SHT_TOKEN_ADDRESS,
    abi: SHT_TOKEN_ABI,
    functionName: 'canClaimToday',
    args: address ? [address] : undefined,
    query: { 
      enabled: !!address && mounted,
      refetchInterval: 5000,
    },
  });

  // Daily claim contract call
  const { writeContract, data: hash, error, isPending } = useWriteContract();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Daily claim function
  const handleDailyClaim = async () => {
    if (!address || !isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      writeContract({
        address: SHT_TOKEN_ADDRESS,
        abi: SHT_TOKEN_ABI,
        functionName: 'claimDailyReward',
      });
    } catch (error) {
      console.error('Daily claim failed:', error);
    }
  };

  // Manual refresh all data
  const refreshAllData = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      refetchBalance(),
      refetchCanClaim()
    ]);
  };

  // Listen for transaction completion, auto refresh data
  useEffect(() => {
    if (isConfirmed) {
      setTimeout(() => {
        refreshAllData();
      }, 2000);
    }
  }, [isConfirmed]);

  // Safe format token amount
  const safeFormatEther = (value: any, defaultValue: string = '0') => {
    try {
      if (!value) return defaultValue;
      return Number(formatEther(value)).toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    } catch (error) {
      console.error('Format token amount failed:', error);
      return defaultValue;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin': return '📅';
      case 'create': return '🎨';
      case 'stake': return '💎';
      case 'referral': return '👥';
      case 'community': return '🏆';
      default: return '💰';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="flex items-center space-x-2 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          <span className="text-lg">Loading SHT Rewards Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      <div className="container mx-auto p-6 space-y-6 max-w-6xl">
        {/* Page Title */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            💎 SHT Rewards Center
          </h1>
          <p className="text-gray-300 text-xl">
            Participate • Earn Rewards • Build the Future
          </p>
          <div className="flex justify-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Official Rewards System</Badge>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Live Updates</Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">Sepolia Testnet</Badge>
          </div>
        </div>

        {/* Platform Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {platformStats.totalHolders.toLocaleString('en-US')}
              </div>
              <div className="text-sm text-blue-300">Holders</div>
              <div className="text-xs text-green-400 mt-1">↗ Live</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {platformStats.dailyActiveUsers.toLocaleString('en-US')}
              </div>
              <div className="text-sm text-green-300">Daily Users</div>
              <div className="text-xs text-green-400 mt-1">↗ +2.8%</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {(platformStats.totalStaked / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-purple-300">Total Staked</div>
              <div className="text-xs text-purple-400 mt-1">SHT</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {platformStats.avgDailyReward.toFixed(0)}
              </div>
              <div className="text-sm text-yellow-300">Avg Daily Reward</div>
              <div className="text-xs text-yellow-400 mt-1">SHT/user</div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {(platformStats.circulatingSupply / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-cyan-300">Circulating</div>
              <div className="text-xs text-cyan-400 mt-1">SHT</div>
            </CardContent>
          </Card>
        </div>

        {/* Wallet Connection Status */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Coins className="h-5 w-5 text-yellow-400" />
              Wallet Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            
            {isConnected && address && (
              <div className="text-center space-y-2 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="text-sm text-green-400">✅ Wallet Connected</div>
                <div className="font-mono text-xs bg-black/30 p-2 rounded border border-white/20 text-gray-300">
                  {address}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Feature Area */}
        {isConnected ? (
          <div className="grid md:grid-cols-2 gap-6">
            {/* SHT Balance Display */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400">
                    <TrendingUp className="h-6 w-6" />
                    My SHT Balance
                  </div>
                  <Button 
                    onClick={refreshAllData}
                    variant="outline" 
                    size="sm"
                    disabled={balanceLoading}
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    {balanceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="text-5xl font-bold text-green-400">
                    {balanceLoading ? (
                      <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                    ) : balanceError ? (
                      <div className="text-red-400 text-lg">Read Failed</div>
                    ) : (
                      safeFormatEther(balance)
                    )}
                  </div>
                  <div className="text-xl font-medium text-green-300">SHT</div>
                  <div className="text-sm text-green-400/80">
                    Current wallet token balance
                  </div>
                  {totalSupply && (
                    <div className="text-xs text-gray-400 pt-2 border-t border-green-500/20">
                      Total Supply: {safeFormatEther(totalSupply)} SHT
                    </div>
                  )}
                  {lastRefresh && (
                    <div className="text-xs text-gray-400">
                      Last Updated: {lastRefresh.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Daily Check-in */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-400">
                  <CheckCircle className="h-6 w-6" />
                  Daily Check-in Rewards
                </CardTitle>
                <CardDescription className="text-purple-300">
                  {canClaim ? 'Check-in to get 100-200 SHT + consecutive bonus' : 'Already checked in today'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-purple-400">
                    100-200
                  </div>
                  <div className="text-sm text-purple-300">Base Check-in Reward (SHT)</div>
                  <div className="text-xs text-purple-400/80">
                    Consecutive check-ins earn bonus multipliers
                  </div>
                </div>
                
                <Button 
                  onClick={handleDailyClaim}
                  disabled={isPending || isConfirming || !canClaim}
                  size="lg"
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : canClaim ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check-in Now for Rewards
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Already Checked In Today
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="text-center text-gray-400 py-8">
                <Gift className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <div className="font-medium text-xl mb-2">Please Connect Wallet to Start</div>
                <div className="text-sm">Connect your wallet to view balance and participate in rewards</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Activity and Leaderboard */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Live Activity */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="h-5 w-5 text-blue-400" />
                Live Activity
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-xl">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">
                        {activity.user} {activity.action}
                      </div>
                      <div className="text-xs text-gray-400">
                        {activity.time}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-green-400">
                      +{activity.amount} SHT
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Wealth Leaderboard */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Wealth Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((user) => (
                  <div key={user.rank} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                    <div className="text-lg">{getRankIcon(user.rank)}</div>
                    <div className="text-xl">{user.badge}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">{user.nickname}</div>
                      <div className="text-xs text-gray-400 font-mono">{user.address}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-yellow-400">
                        {user.balance.toLocaleString('en-US')}
                      </div>
                      <div className="text-xs text-gray-400">SHT</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reward Mechanism Explanation */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-400 text-lg">
                <CheckCircle className="h-5 w-5" />
                Daily Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-300 space-y-2">
              <div>• Base Reward: 100-200 SHT</div>
              <div>• 7 days streak: +50% bonus</div>
              <div>• 30 days streak: +100% bonus</div>
              <div className="text-xs text-blue-400/80 pt-2">
                Resets daily at 00:00 UTC
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400 text-lg">
                <Zap className="h-5 w-5" />
                Creation Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-300 space-y-2">
              <div>• Common Creation: 200-500 SHT</div>
              <div>• Rare Creation: 500-1000 SHT</div>
              <div>• Legendary Creation: 1000-2000 SHT</div>
              <div className="text-xs text-green-400/80 pt-2">
                Auto-distributed by rarity
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500/10 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400 text-lg">
                <Users className="h-5 w-5" />
                Community Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-purple-300 space-y-2">
              <div>• Invite Friends: 100 SHT/referral</div>
              <div>• Community Contribution: 300-800 SHT</div>
              <div>• Staking Rewards: 8-12% APY</div>
              <div className="text-xs text-purple-400/80 pt-2">
                Build together, earn together
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Status Display */}
        {(isPending || isConfirming || isConfirmed || error) && (
          <Card className={`border-2 ${
            error ? 'border-red-500/30 bg-red-500/10' : 
            isConfirmed ? 'border-green-500/30 bg-green-500/10' : 
            'border-yellow-500/30 bg-yellow-500/10'
          }`}>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                {isPending && (
                  <div className="text-yellow-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <div className="font-medium">📤 Transaction Sending</div>
                    <div className="text-sm text-yellow-300">Please confirm in your wallet...</div>
                  </div>
                )}

                {isConfirming && (
                  <div className="text-blue-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <div className="font-medium">⏳ Waiting for Confirmation</div>
                    <div className="text-sm text-blue-300">Transaction is being processed...</div>
                  </div>
                )}

                {isConfirmed && (
                  <div className="text-green-400">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">🎉 Check-in Successful!</div>
                    <div className="text-sm text-green-300">Rewards sent to your wallet</div>
                    {hash && (
                      <div className="text-xs mt-2 font-mono bg-black/30 p-2 rounded border border-white/20 text-gray-300">
                        Transaction Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-red-400">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    <div className="font-medium">❌ Transaction Failed</div>
                    <div className="text-sm text-red-300">
                      {error.message.includes('User rejected') 
                        ? 'User cancelled transaction' 
                        : error.message.length > 100 
                          ? error.message.slice(0, 100) + '...' 
                          : error.message}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <Badge className="mb-1 bg-green-500/20 text-green-400 border-green-500/30" variant="outline">
                  ✅ Online
                </Badge>
                <div className="text-gray-400">Page Status</div>
              </div>
              <div className="text-center">
                <Badge className="mb-1" variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? '✅ Connected' : '❌ Disconnected'}
                </Badge>
                <div className="text-gray-400">Wallet Status</div>
              </div>
              <div className="text-center">
                <Badge className="mb-1 bg-blue-500/20 text-blue-400 border-blue-500/30" variant="outline">
                  {balanceLoading ? '⏳ Loading' : '✅ Synced'}
                </Badge>
                <div className="text-gray-400">Balance Status</div>
              </div>
              <div className="text-center">
                <Badge className="mb-1 bg-purple-500/20 text-purple-400 border-purple-500/30" variant="outline">
                  {isPending || isConfirming ? '⏳ Processing' : '✅ Ready'}
                </Badge>
                <div className="text-gray-400">Transaction Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Information */}
        <Card className="bg-black/20 border-white/10">
          <CardHeader>
            <CardTitle className="text-sm text-white">Contract Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-300">Deployed Network:</span>
                <div className="text-gray-400 mt-1">Sepolia Testnet</div>
              </div>
              <div>
                <span className="font-medium text-gray-300">Supported Features:</span>
                <div className="text-gray-400 mt-1">Balance Query • Daily Check-in • Reward Distribution</div>
              </div>
              <div>
                <span className="font-medium text-gray-300">Data Updates:</span>
                <div className="text-gray-400 mt-1">Auto-sync every 5 seconds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ecosystem Roadmap */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white text-xl">🚀 SHT Ecosystem Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6 text-sm">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div className="font-medium text-green-400">Phase 1</div>
                <div className="text-gray-300">Token Launch</div>
                <div className="text-xs text-gray-400">
                  Core Features • Daily Check-in • Creation Rewards
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-blue-400" />
                </div>
                <div className="font-medium text-blue-400">Phase 2</div>
                <div className="text-gray-300">Staking & Mining</div>
                <div className="text-xs text-gray-400">
                  Liquidity Mining • Governance • NFT Staking
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-purple-400" />
                </div>
                <div className="font-medium text-purple-400">Phase 3</div>
                <div className="text-gray-300">Ecosystem Expansion</div>
                <div className="text-xs text-gray-400">
                  Cross-chain Bridge • DeFi Integration • Metaverse
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-yellow-500/20 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="font-medium text-yellow-400">Phase 4</div>
                <div className="text-gray-300">Global Ecosystem</div>
                <div className="text-xs text-gray-400">
                  Mainnet Launch • Global Community • Mature Ecosystem
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Guide */}
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="text-blue-300">
              <div className="font-medium text-xl mb-4 text-center">📖 Platform User Guide</div>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                    <div>
                      <div className="font-medium text-blue-400">Connect Wallet</div>
                      <div className="text-blue-300/80">Ensure your wallet is switched to Sepolia testnet</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                    <div>
                      <div className="font-medium text-blue-400">Check Balance</div>
                      <div className="text-blue-300/80">View your SHT token balance and statistics in real-time</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                    <div>
                      <div className="font-medium text-blue-400">Daily Check-in</div>
                      <div className="text-blue-300/80">Check in daily to earn 100-200 SHT base rewards</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                    <div>
                      <div className="font-medium text-blue-400">Create NFTs</div>
                      <div className="text-blue-300/80">Create NFTs to earn additional SHT token rewards</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">5</div>
                    <div>
                      <div className="font-medium text-blue-400">Invite Friends</div>
                      <div className="text-blue-300/80">Invite friends to join and earn referral bonuses</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mt-0.5">6</div>
                    <div>
                      <div className="font-medium text-blue-400">Community Contribution</div>
                      <div className="text-blue-300/80">Participate in community building for extra rewards</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Announcement */}
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-2xl">📢</div>
              <div className="font-medium text-yellow-400 text-lg">Important Notice</div>
              <div className="text-yellow-300 text-sm max-w-2xl mx-auto">
                This is currently the testnet phase. All features and rewards are for testing purposes only. 
                Final implementations will be executed according to the mainnet launch plan.
                Thank you for participating in building the SHT ecosystem!
              </div>
              <div className="text-xs text-yellow-400/80">
                Last Updated: June 21, 2024
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}