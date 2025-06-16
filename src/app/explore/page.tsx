'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NFTCard } from '@/components/features/gallery/NFTCard';
import { NFTDetailModal } from '@/components/features/gallery/NFTDetailModal';
import type { NFTData } from '@/hooks/useNFTData';
import { RARITY_CONFIG, getRarityInfo, type RarityLevel } from '@/config/rarity';

type FilterType = 'all' | RarityLevel;

interface GlobalStats {
  totalNFTs: number;
  totalUsers: number;
  rarityBreakdown: Record<RarityLevel, number>;
  topStyles: Array<{ style: string; count: number }>;
}

export default function ExplorePage() {
  const [allNFTs, setAllNFTs] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRarity, setFilterRarity] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);

  // 加载所有NFT数据
  useEffect(() => {
    loadAllNFTs();
  }, []);

  const loadAllNFTs = async () => {
    try {
      console.log('🌐 加载所有NFT数据...');
      setIsLoading(true);
      
      const response = await fetch('/api/nfts', { method: 'PUT' });
      const data = await response.json();
      
      if (data.success) {
        const nfts = data.nfts.map((nft: any) => ({
          ...nft,
          mintedAt: new Date(nft.mintedAt).getTime()
        }));
        
        console.log('✅ 全局NFT数据加载成功:', nfts.length, '个');
        setAllNFTs(nfts);
        setGlobalStats(calculateGlobalStats(nfts));
      }
    } catch (error) {
      console.error('❌ 加载全局NFT数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGlobalStats = (nfts: NFTData[]): GlobalStats => {
    const rarityBreakdown = nfts.reduce((acc, nft) => {
      acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
      return acc;
    }, {} as Record<RarityLevel, number>);

    for (let i = 0; i <= 4; i++) {
      if (!(i in rarityBreakdown)) {
        rarityBreakdown[i as RarityLevel] = 0;
      }
    }

    const styleCount = nfts.reduce((acc, nft) => {
      acc[nft.style] = (acc[nft.style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topStyles = Object.entries(styleCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 4)
      .map(([style, count]) => ({ style, count }));

    const uniqueUsers = new Set(nfts.map(nft => nft.creator)).size;

    return {
      totalNFTs: nfts.length,
      totalUsers: uniqueUsers,
      rarityBreakdown,
      topStyles
    };
  };

  const filteredNFTs = allNFTs.filter(nft => {
    // 稀有度筛选
    if (filterRarity !== 'all' && nft.rarity !== filterRarity) {
      return false;
    }
    
    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return nft.name.toLowerCase().includes(query) ||
             nft.originalInput.toLowerCase().includes(query) ||
             nft.tokenId.toString().includes(query);
    }
    
    return true;
  }).sort((a, b) => b.mintedAt - a.mintedAt);

  const handleNFTClick = (nft: NFTData) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const handleShare = (nft: NFTData) => {
    const shareText = `发现一只${getRarityInfo(nft.rarity).name}级别的${nft.name}！#神图计划 #ShanHaiVerse #NFT`;
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('分享内容已复制到剪贴板！');
    }
  };

  const getDisplayImageUrl = (nft: NFTData) => {
    if (nft.ipfsImageUrl && nft.ipfsImageUrl.startsWith('ipfs://')) {
      return `https://gateway.pinata.cloud/ipfs/${nft.ipfsImageUrl.replace('ipfs://', '')}`;
    }
    return nft.imageUrl || nft.gatewayImageUrl || nft.ipfsImageUrl || 'https://via.placeholder.com/400x400/6B7280/FFFFFF?text=No+Image';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
            <span className="text-3xl">🌐</span>
            探索神兽世界
          </h1>
          <p className="text-white/70">发现所有用户创造的山海经神兽</p>
        </div>

        {/* 全局统计 */}
        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{globalStats.totalNFTs}</div>
                <div className="text-sm text-blue-300/80">总神兽数</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{globalStats.totalUsers}</div>
                <div className="text-sm text-green-300/80">创作者数</div>
              </CardContent>
            </Card>
            
            {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
              <Card key={level} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold ${config.color}`}>
                    {globalStats.rarityBreakdown[Number(level) as RarityLevel] || 0}
                  </div>
                  <div className="text-sm text-white/60">{config.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 搜索和筛选 */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索神兽名称、描述或Token ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder:text-white/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value as FilterType)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-purple-500/50 focus:outline-none"
                >
                  <option value="all">全部稀有度</option>
                  {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
                    <option key={level} value={level}>{config.name}</option>
                  ))}
                </select>
                
                <Button
                  onClick={loadAllNFTs}
                  variant="outline"
                  size="sm"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  🔄 刷新
                </Button>
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center text-sm text-white/60">
              <span>找到 {filteredNFTs.length} 只神兽</span>
              <span>共 {globalStats?.totalNFTs || 0} 只神兽</span>
            </div>
          </CardContent>
        </Card>

        {/* NFT展示 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-xl font-bold text-white mb-2">加载中...</h3>
            <p className="text-white/60">正在获取全球神兽数据</p>
          </div>
        ) : filteredNFTs.length === 0 ? (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">没有找到神兽</h3>
              <p className="text-white/60 mb-6">尝试调整搜索条件或筛选器</p>
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterRarity('all');
                }}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                清除筛选
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id || nft.tokenId}
                nft={nft}
                onClick={handleNFTClick}
                onShare={handleShare}
                getDisplayImageUrl={getDisplayImageUrl}
              />
            ))}
          </div>
        )}

        <NFTDetailModal
          nft={selectedNFT}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onShare={handleShare}
        />
      </div>
    </div>
  );
}
