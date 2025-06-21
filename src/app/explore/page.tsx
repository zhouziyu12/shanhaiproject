'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock数据类型定义
interface Creator {
  address: string;
  name: string;
  avatar: string;
  totalNFTs: number;
  totalVolume: number;
  followers: number;
  verified: boolean;
}

interface NFTTrending {
  tokenId: number;
  name: string;
  image: string;
  rarity: string;
  rarityColor: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  creator: string;
  likes: number;
}

interface MarketStats {
  totalVolume: number;
  volumeChange24h: number;
  floorPrice: number;
  floorPriceChange24h: number;
  uniqueHolders: number;
  holdersChange24h: number;
  totalListings: number;
  listingsChange24h: number;
}

interface ActivityLog {
  id: string;
  type: 'mint' | 'sale' | 'transfer' | 'list';
  tokenId: number;
  nftName: string;
  from: string;
  to: string;
  price?: number;
  timestamp: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'trending' | 'analytics'>('overview');
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [liveStats, setLiveStats] = useState({
    totalNFTs: 24857,
    activeUsers: 8934,
    totalVolume: 12847.5,
    avgPrice: 0.85
  });

  // Mock数据
  const marketStats: MarketStats = {
    totalVolume: 12847.5,
    volumeChange24h: 15.7,
    floorPrice: 0.12,
    floorPriceChange24h: -3.2,
    uniqueHolders: 8934,
    holdersChange24h: 2.8,
    totalListings: 1247,
    listingsChange24h: -8.5
  };

  const topCreators: Creator[] = [
    {
      address: "0x7f2A...a2b8",
      name: "DragonMaster",
      avatar: "🐲",
      totalNFTs: 156,
      totalVolume: 2847.3,
      followers: 12450,
      verified: true
    },
    {
      address: "0x3a4B...9c4d",
      name: "MythicForge",
      avatar: "⚡",
      totalNFTs: 142,
      totalVolume: 2234.8,
      followers: 9873,
      verified: true
    },
    {
      address: "0x8e1F...1f7c",
      name: "PhoenixArt",
      avatar: "🔥",
      totalNFTs: 128,
      totalVolume: 1967.4,
      followers: 8234,
      verified: false
    },
    {
      address: "0x5b6D...6d2a",
      name: "ForestGuard",
      avatar: "🌲",
      totalNFTs: 234,
      totalVolume: 1845.2,
      followers: 7892,
      verified: true
    },
    {
      address: "0x9c8E...3a5f",
      name: "IceWarrior",
      avatar: "❄️",
      totalNFTs: 98,
      totalVolume: 1623.7,
      followers: 6543,
      verified: false
    }
  ];

  const trendingNFTs: NFTTrending[] = [
    {
      tokenId: 24857,
      name: "Celestial Dragon Emperor",
      image: "🐉",
      rarity: "Legendary",
      rarityColor: "from-yellow-400 to-orange-500",
      price: 15.7,
      priceChange24h: 23.5,
      volume24h: 87.3,
      creator: "DragonMaster",
      likes: 1247
    },
    {
      tokenId: 24856,
      name: "Frost Phoenix Guardian",
      image: "🦅",
      rarity: "Epic",
      rarityColor: "from-purple-400 to-pink-500",
      price: 8.9,
      priceChange24h: 18.2,
      volume24h: 45.6,
      creator: "PhoenixArt",
      likes: 892
    },
    {
      tokenId: 24855,
      name: "Thunder Qilin Beast",
      image: "⚡",
      rarity: "Epic",
      rarityColor: "from-purple-400 to-pink-500",
      price: 7.2,
      priceChange24h: -5.8,
      volume24h: 34.2,
      creator: "MythicForge",
      likes: 675
    },
    {
      tokenId: 24854,
      name: "Ancient Tree Spirit",
      image: "🌳",
      rarity: "Rare",
      rarityColor: "from-blue-400 to-cyan-500",
      price: 3.4,
      priceChange24h: 12.7,
      volume24h: 28.9,
      creator: "ForestGuard",
      likes: 534
    }
  ];

  const recentActivity: ActivityLog[] = [
    {
      id: "1",
      type: "sale",
      tokenId: 24857,
      nftName: "Celestial Dragon Emperor",
      from: "0x7f2A...a2b8",
      to: "0x1a3B...c4d5",
      price: 15.7,
      timestamp: Date.now() - 120000
    },
    {
      id: "2",
      type: "mint",
      tokenId: 24858,
      nftName: "Shadow Wolf Spirit",
      from: "0x0000...0000",
      to: "0x3a4B...9c4d",
      timestamp: Date.now() - 240000
    },
    {
      id: "3",
      type: "list",
      tokenId: 24856,
      nftName: "Frost Phoenix Guardian",
      from: "0x8e1F...1f7c",
      to: "Market",
      price: 8.9,
      timestamp: Date.now() - 360000
    },
    {
      id: "4",
      type: "transfer",
      tokenId: 24855,
      nftName: "Thunder Qilin Beast",
      from: "0x5b6D...6d2a",
      to: "0x9c8E...3a5f",
      timestamp: Date.now() - 480000
    },
    {
      id: "5",
      type: "sale",
      tokenId: 24854,
      nftName: "Ancient Tree Spirit",
      from: "0x2d4F...7g8h",
      to: "0x6h9J...k2l3",
      price: 3.4,
      timestamp: Date.now() - 600000
    }
  ];

  // 实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        totalNFTs: prev.totalNFTs + Math.floor(Math.random() * 3),
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 5) - 2,
        totalVolume: prev.totalVolume + (Math.random() * 2),
        avgPrice: prev.avgPrice + (Math.random() * 0.1 - 0.05)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'mint': return '🎨';
      case 'sale': return '💰';
      case 'transfer': return '📤';
      case 'list': return '🏷️';
      default: return '📋';
    }
  };

  const getActivityText = (activity: ActivityLog) => {
    switch (activity.type) {
      case 'mint':
        return `${activity.to} minted ${activity.nftName}`;
      case 'sale':
        return `${activity.nftName} sold for ${activity.price} ETH`;
      case 'transfer':
        return `${activity.nftName} transferred to ${activity.to}`;
      case 'list':
        return `${activity.nftName} listed for ${activity.price} ETH`;
      default:
        return 'Unknown activity';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题和导航 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">📊</span>
              Platform Dashboard
            </h1>
            <p className="text-white/70 mt-2">Real-time analytics and leaderboards</p>
          </div>
          
          <div className="flex gap-2">
            {['24h', '7d', '30d', 'all'].map((period) => (
              <Button
                key={period}
                onClick={() => setTimeFilter(period as any)}
                variant={timeFilter === period ? "default" : "outline"}
                size="sm"
                className={timeFilter === period ? 
                  "bg-blue-500 hover:bg-blue-600" : 
                  "border-white/30 text-white hover:bg-white/10"
                }
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/10">
          {[
            { id: 'overview', label: 'Overview', icon: '📈' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
            { id: 'trending', label: 'Trending', icon: '🔥' },
            { id: 'analytics', label: 'Analytics', icon: '📊' }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant="ghost"
              className={`flex-1 ${activeTab === tab.id ? 
                'bg-white/10 text-white' : 
                'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 核心指标 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {liveStats.totalNFTs.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-300">Total NFTs</div>
                  <div className="text-xs text-green-400 mt-1">↗ Live</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {liveStats.activeUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-300">Active Users</div>
                  <div className="text-xs text-green-400 mt-1">↗ +2.8%</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {liveStats.totalVolume.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-300">Volume (ETH)</div>
                  <div className="text-xs text-green-400 mt-1">↗ +15.7%</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {liveStats.avgPrice.toFixed(2)}
                  </div>
                  <div className="text-sm text-yellow-300">Avg Price (ETH)</div>
                  <div className="text-xs text-red-400 mt-1">↘ -3.2%</div>
                </CardContent>
              </Card>
            </div>

            {/* 市场统计和实时活动 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    📈 Market Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">Floor Price</div>
                      <div className="text-2xl font-bold text-white">
                        {marketStats.floorPrice} ETH
                      </div>
                      <div className={`text-xs ${marketStats.floorPriceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {marketStats.floorPriceChange24h >= 0 ? '↗' : '↘'} {Math.abs(marketStats.floorPriceChange24h)}%
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">24h Volume</div>
                      <div className="text-2xl font-bold text-white">
                        {marketStats.totalVolume} ETH
                      </div>
                      <div className="text-xs text-green-400">
                        ↗ {marketStats.volumeChange24h}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">Unique Holders</div>
                      <div className="text-xl font-bold text-white">
                        {marketStats.uniqueHolders.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-white/60">Listed Items</div>
                      <div className="text-xl font-bold text-white">
                        {marketStats.totalListings.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 实时活动 */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    ⚡ Live Activity
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-auto"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                        <div className="text-xl">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">
                            {getActivityText(activity)}
                          </div>
                          <div className="text-xs text-white/60">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                        {activity.price && (
                          <div className="text-sm font-medium text-green-400">
                            {activity.price} ETH
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🏆 Top Creators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCreators.map((creator, index) => (
                    <div key={creator.address} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-400' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-2xl">{creator.avatar}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{creator.name}</span>
                            {creator.verified && <span className="text-blue-400">✓</span>}
                          </div>
                          <div className="text-sm text-white/60 font-mono">{creator.address}</div>
                        </div>
                      </div>
                      
                      <div className="ml-auto grid grid-cols-3 gap-6 text-center">
                        <div>
                          <div className="text-lg font-bold text-white">{creator.totalNFTs}</div>
                          <div className="text-xs text-white/60">NFTs</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-400">{creator.totalVolume.toFixed(1)} ETH</div>
                          <div className="text-xs text-white/60">Volume</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-purple-400">{creator.followers.toLocaleString()}</div>
                          <div className="text-xs text-white/60">Followers</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="space-y-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🔥 Trending NFTs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {trendingNFTs.map((nft) => (
                    <div key={nft.tokenId} className="group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all hover:scale-105">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-3 group-hover:scale-110 transition-transform">
                          {nft.image}
                        </div>
                        <div className="text-sm text-white/60 mb-1">#{nft.tokenId}</div>
                        <h3 className="text-white font-semibold text-lg mb-2 truncate">{nft.name}</h3>
                        <Badge className={`bg-gradient-to-r ${nft.rarityColor} text-white text-xs`}>
                          {nft.rarity}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-white/60">Price:</span>
                          <div className="flex items-center gap-1">
                            <span className="text-white font-bold">{nft.price} ETH</span>
                            <span className={`text-xs ${nft.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {nft.priceChange24h >= 0 ? '↗' : '↘'} {Math.abs(nft.priceChange24h)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">24h Vol:</span>
                          <span className="text-blue-400">{nft.volume24h} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Creator:</span>
                          <span className="text-purple-400 truncate">{nft.creator}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Likes:</span>
                          <span className="text-red-400">❤️ {nft.likes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 稀有度分布 */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Rarity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'Legendary', count: 234, percentage: 0.9, color: 'text-yellow-400' },
                      { name: 'Epic', count: 1247, percentage: 5.0, color: 'text-purple-400' },
                      { name: 'Rare', count: 3981, percentage: 16.0, color: 'text-blue-400' },
                      { name: 'Uncommon', count: 7456, percentage: 30.0, color: 'text-green-400' },
                      { name: 'Common', count: 11939, percentage: 48.1, color: 'text-gray-400' }
                    ].map((rarity) => (
                      <div key={rarity.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-current ${rarity.color}`}></div>
                          <span className="text-white text-sm">{rarity.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white/60">{rarity.count}</span>
                          <span className={`${rarity.color} font-medium`}>({rarity.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 创作风格统计 */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Popular Styles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { style: 'Classic', count: 8234, icon: '🎨' },
                      { style: 'Modern', count: 6789, icon: '🖼️' },
                      { style: 'Ethereal', count: 4567, icon: '✨' },
                      { style: 'Dark', count: 3456, icon: '🌙' },
                      { style: 'Vibrant', count: 1811, icon: '🌈' }
                    ].map((style) => (
                      <div key={style.style} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{style.icon}</span>
                          <span className="text-white">{style.style}</span>
                        </div>
                        <span className="text-blue-400 font-medium">{style.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 网络统计 */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Network Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">AI Response Time</span>
                      <span className="text-green-400 font-medium">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">VRF Latency</span>
                      <span className="text-blue-400 font-medium">45s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">IPFS Upload Speed</span>
                      <span className="text-purple-400 font-medium">15.2 MB/s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Success Rate</span>
                      <span className="text-green-400 font-medium">99.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Gas Price</span>
                      <span className="text-yellow-400 font-medium">23 gwei</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 价格趋势模拟图表 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Price Trends Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-black/20 rounded-lg flex items-center justify-center border border-white/10">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📈</div>
                    <div className="text-white font-medium mb-2">Price Chart Placeholder</div>
                    <div className="text-white/60 text-sm">Real-time market data visualization</div>
                    <div className="mt-4 grid grid-cols-4 gap-4 text-xs">
                      <div className="text-center">
                        <div className="text-green-400 font-bold">+15.7%</div>
                        <div className="text-white/60">24h Change</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 font-bold">0.85 ETH</div>
                        <div className="text-white/60">Avg Price</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 font-bold">12.8K</div>
                        <div className="text-white/60">Volume</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">8.9K</div>
                        <div className="text-white/60">Holders</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 交易活动热力图 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Trading Activity Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {Array.from({ length: 168 }, (_, i) => {
                    const intensity = Math.random();
                    return (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-sm ${
                          intensity > 0.8 ? 'bg-green-500' :
                          intensity > 0.6 ? 'bg-green-400' :
                          intensity > 0.4 ? 'bg-green-300' :
                          intensity > 0.2 ? 'bg-green-200' :
                          'bg-gray-700'
                        }`}
                        title={`Activity level: ${(intensity * 100).toFixed(0)}%`}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-white/60">
                  <span>Less Activity</span>
                  <span>More Activity</span>
                </div>
              </CardContent>
            </Card>

            {/* AI系统性能监控 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">AI System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">DeepSeek AI</span>
                        <span className="text-green-400">99.8% ✓</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '99.8%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">ZhipuAI</span>
                        <span className="text-green-400">97.3% ✓</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '97.3%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Image Generation</span>
                        <span className="text-yellow-400">95.1% ⚠</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '95.1%' }}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">IPFS Upload</span>
                        <span className="text-blue-400">98.7% ✓</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{ width: '98.7%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Blockchain Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Gas Price</span>
                      <div className="text-right">
                        <div className="text-white font-medium">23 gwei</div>
                        <div className="text-xs text-green-400">↘ -15%</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Block Time</span>
                      <div className="text-right">
                        <div className="text-white font-medium">12.1s</div>
                        <div className="text-xs text-green-400">Normal</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Network Usage</span>
                      <div className="text-right">
                        <div className="text-white font-medium">67%</div>
                        <div className="text-xs text-yellow-400">Moderate</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">VRF Requests</span>
                      <div className="text-right">
                        <div className="text-white font-medium">1,247</div>
                        <div className="text-xs text-blue-400">Today</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Avg Confirmation</span>
                      <div className="text-right">
                        <div className="text-white font-medium">45s</div>
                        <div className="text-xs text-green-400">Fast</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* 全局通知横幅 */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-400 font-medium">System Status:</span>
                <span className="text-white">All systems operational</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white/60">Last updated:</span>
                <span className="text-white">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}