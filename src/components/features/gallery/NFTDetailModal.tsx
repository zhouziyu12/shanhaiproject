'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRarityInfo } from '@/config/rarity';
import type { NFTData } from '@/hooks/useNFTData';

interface NFTDetailModalProps {
  nft: NFTData | null;
  isOpen: boolean;
  onClose: () => void;
  onShare?: (nft: NFTData) => void;
}

export function NFTDetailModal({ nft, isOpen, onClose, onShare }: NFTDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'attributes' | 'history'>('details');

  if (!isOpen || !nft) return null;

  const rarityInfo = getRarityInfo(nft.rarity);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleShare = () => {
    onShare?.(nft);
  };

  const copyIPFSUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('IPFS URL已复制到剪贴板！');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-white text-xl">
              {nft.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-black/30 text-white">
                #{nft.tokenId}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-white border-white/30 hover:bg-white/10"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="max-h-[calc(90vh-120px)] overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="relative">
                  <div className={`aspect-square rounded-lg overflow-hidden border-2 ${rarityInfo.borderColor}`}>
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="absolute top-4 left-4">
                    <Badge 
                      className={`${rarityInfo.bgColor} ${rarityInfo.color} ${rarityInfo.borderColor} border text-sm font-bold`}
                    >
                      {nft.rarity === 4 ? '🌟' : 
                       nft.rarity === 3 ? '⭐' : 
                       nft.rarity === 2 ? '💜' : 
                       nft.rarity === 1 ? '💙' : '⚪'} {rarityInfo.name}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleShare}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                  >
                    🔗 分享NFT
                  </Button>
                  <Button
                    onClick={() => window.open(`https://ipfs.io/ipfs/${nft.ipfsImageUrl.replace('ipfs://', '')}`, '_blank')}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                  >
                    🌐 查看IPFS
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
                  {[
                    { key: 'details', label: '详情' },
                    { key: 'attributes', label: '属性' },
                    { key: 'history', label: '历史' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm transition-all ${
                        activeTab === tab.key
                          ? 'bg-white/20 text-white'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {activeTab === 'details' && (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-white/60 text-sm">原始创意</label>
                          <p className="text-white bg-white/5 p-3 rounded mt-1">
                            {nft.originalInput}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-white/60 text-sm">AI优化描述</label>
                          <p className="text-white bg-white/5 p-3 rounded mt-1 text-sm">
                            {nft.optimizedPrompt}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-white/60 text-sm">艺术风格</label>
                            <p className="text-white">
                              {nft.style === 'classic' ? '古典水墨' :
                               nft.style === 'modern' ? '现代插画' :
                               nft.style === 'fantasy' ? '奇幻艺术' :
                               nft.style === 'ink' ? '水墨写意' : nft.style}
                            </p>
                          </div>
                          <div>
                            <label className="text-white/60 text-sm">稀有度等级</label>
                            <p className={`font-bold ${rarityInfo.color}`}>
                              {nft.rarity}/4 - {rarityInfo.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <h4 className="text-blue-400 font-medium mb-3">🔧 技术信息</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-white/60">AI模型:</span>
                            <span className="text-white">DeepSeek + 智谱AI</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">存储方式:</span>
                            <span className="text-green-400">Pinata IPFS</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">稀有度来源:</span>
                            <span className="text-purple-400">Chainlink VRF</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">区块链:</span>
                            <span className="text-blue-400">以太坊</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'attributes' && (
                    <div className="space-y-3">
                      {nft.attributes.map((attr, index) => (
                        <div 
                          key={index}
                          className="bg-white/5 border border-white/10 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-white/60 text-sm">{attr.trait_type}</span>
                            <span className="text-white font-medium">{attr.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="space-y-3">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                            <span className="text-green-400 text-sm">⛏️</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">NFT铸造</p>
                            <p className="text-white/60 text-sm">
                              {new Date(nft.mintedAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400">成功</Badge>
                        </div>
                      </div>

                      {nft.vrfRequestId && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                              <span className="text-purple-400 text-sm">🎲</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">稀有度分配</p>
                              <p className="text-white/60 text-sm">
                                Chainlink VRF: {nft.vrfRequestId.slice(0, 20)}...
                              </p>
                            </div>
                            <Badge className={`${rarityInfo.bgColor} ${rarityInfo.color}`}>
                              {rarityInfo.name}
                            </Badge>
                          </div>
                        </div>
                      )}

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <span className="text-blue-400 text-sm">📦</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">IPFS存储</p>
                            <p className="text-white/60 text-sm">
                              去中心化永久存储
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyIPFSUrl(nft.ipfsImageUrl)}
                            className="text-blue-400 border-blue-500/30"
                          >
                            复制
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
