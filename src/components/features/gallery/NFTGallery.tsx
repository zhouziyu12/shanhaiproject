'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NFTCard } from './NFTCard';
import { NFTDetailModal } from './NFTDetailModal';
import { useNFTData, type NFTData } from '@/hooks/useNFTData';
import { useWallet } from '@/components/web3/ConnectWallet';
import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { RARITY_CONFIG, getRarityInfo, type RarityLevel } from '@/config/rarity';

type FilterType = 'all' | RarityLevel;

export function NFTGallery() {
  const { isConnected, mounted, address } = useWallet();
  const { 
    nftData, 
    userStats, 
    isLoading, 
    filterByRarity, 
    debugInfo, 
    clearAllData,
    getDisplayImageUrl,
    forceAddTestNFT
  } = useNFTData();
  
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRarity, setFilterRarity] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debugMode, setDebugMode] = useState(false);

  // 监听NFT添加事件
  useEffect(() => {
    const handleNFTAdded = (event: CustomEvent) => {
      console.log('🎉 图鉴收到NFT添加成功事件:', event.detail);
      // 强制刷新以确保显示最新数据
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('nftAddedToGallery', handleNFTAdded as EventListener);
      return () => {
        window.removeEventListener('nftAddedToGallery', handleNFTAdded as EventListener);
      };
    }
  }, []);

  // 调试：组件挂载时输出信息
  useEffect(() => {
    if (mounted && isConnected) {
      console.log('🎯 NFTGallery组件调试信息:');
      console.log('钱包地址:', address);
      console.log('NFT数据长度:', nftData.length);
      console.log('NFT数据:', nftData);
      console.log('用户统计:', userStats);
    }
  }, [mounted, isConnected, address, nftData, userStats]);

  const filteredNFTs = useMemo(() => {
    let filtered = filterByRarity(filterRarity);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(query) ||
        nft.originalInput.toLowerCase().includes(query) ||
        nft.tokenId.toString().includes(query)
      );
    }

    return filtered.sort((a, b) => b.mintedAt - a.mintedAt);
  }, [nftData, filterRarity, searchQuery, filterByRarity]);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white">连接钱包查看图鉴</h1>
          <p className="text-white/70">请先连接您的钱包，然后查看您的神兽收藏</p>
          <ConnectWallet />
        </div>
      </div>
    );
  }

  const handleNFTClick = (nft: NFTData) => {
    setSelectedNFT(nft);
    setIsModalOpen(true);
  };

  const handleShare = (nft: NFTData) => {
    const shareText = `我在神图计划拥有一只${getRarityInfo(nft.rarity).name}级别的${nft.name}！#神图计划 #ShanHaiVerse #NFT`;
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  // 调试按钮
  const handleDebug = () => {
    console.log('🐛 手动调试:');
    console.log('localStorage数据:', localStorage.getItem('shanhaiverse_nfts'));
    console.log('图片缓存:', localStorage.getItem('shanhaiverse_images'));
    console.log('当前钱包地址:', address);
    console.log('NFT数据:', nftData);
    console.log('用户统计:', userStats);
    
    if (debugInfo) {
      debugInfo();
    }
    
    setDebugMode(!debugMode);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <span className="text-2xl">📚</span>
          我的神兽图鉴
        </h1>
        <p className="text-white/70">您创造的山海经神兽收藏 - 完全动态版本</p>
        
        {/* 调试和管理按钮 */}
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            onClick={handleDebug}
            variant="outline"
            size="sm"
            className="text-xs text-white/60 border-white/20 hover:bg-white/10"
          >
            🐛 调试信息
          </Button>
          <Button
            onClick={clearAllData}
            variant="outline"
            size="sm"
            className="text-xs text-red-400/60 border-red-500/20 hover:bg-red-500/10"
          >
            🧹 清空数据
          </Button>
          <Button
            onClick={forceAddTestNFT}
            variant="outline"
            size="sm"
            className="text-xs text-green-400/60 border-green-500/20 hover:bg-green-500/10"
          >
            🧪 添加测试NFT
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="text-xs text-blue-400/60 border-blue-500/20 hover:bg-blue-500/10"
          >
            🔄 刷新页面
          </Button>
        </div>

        {/* 调试信息显示 */}
        {debugMode && (
          <div className="bg-black/50 border border-white/20 rounded-lg p-4 mt-4 text-left">
            <h3 className="text-white font-bold mb-2">🐛 调试信息</h3>
            <div className="text-xs text-white/70 space-y-1 font-mono">
              <div>钱包地址: {address}</div>
              <div>连接状态: {isConnected ? '已连接' : '未连接'}</div>
              <div>NFT数量: {nftData.length}</div>
              <div>localStorage键值: shanhaiverse_nfts</div>
              <div>localStorage大小: {localStorage.getItem('shanhaiverse_nfts')?.length || 0} 字符</div>
              <div>图片缓存大小: {localStorage.getItem('shanhaiverse_images')?.length || 0} 字符</div>
              <div>最后更新: {new Date().toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{userStats.totalNFTs}</div>
              <div className="text-sm text-white/60">总神兽数</div>
            </CardContent>
          </Card>
          
          {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
            <Card key={level} className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${config.color}`}>
                  {userStats.rarityBreakdown[Number(level) as RarityLevel] || 0}
                </div>
                <div className="text-sm text-white/60">{config.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-sm text-white/60">
            <span>找到 {filteredNFTs.length} 只神兽</span>
            <span>共 {userStats?.totalNFTs || 0} 只神兽</span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-white mb-2">加载中...</h3>
          <p className="text-white/60">正在获取您的神兽收藏</p>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            {nftData.length === 0 ? (
              <>
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">还没有神兽</h3>
                <p className="text-white/60 mb-6">这是完全动态的图鉴，从空开始。快去创造您的第一只山海神兽吧！</p>
                <div className="space-y-4">
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button 
                      onClick={() => window.location.href = '/mint'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      开始创造
                    </Button>
                    <Button
                      onClick={forceAddTestNFT}
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      🧪 添加测试NFT
                    </Button>
                  </div>
                  
                  {/* 状态信息显示 */}
                  <div className="text-xs text-white/40 mt-4 space-y-1">
                    <div>💳 钱包地址: {address}</div>
                    <div>📊 数据状态: {isLoading ? '加载中' : '已加载'}</div>
                    <div>💾 localStorage: {typeof localStorage !== 'undefined' ? '可用' : '不可用'}</div>
                    <div>🎯 模式: 完全动态图鉴</div>
                    <div>🔑 存储键: shanhaiverse_nfts</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">没有找到匹配的神兽</h3>
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
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={nft.tokenId}
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
        onClose={handleCloseModal}
        onShare={handleShare}
      />
    </div>
  );
}