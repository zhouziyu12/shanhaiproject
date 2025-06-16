'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/web3/ConnectWallet';
import type { RarityLevel } from '@/config/rarity';

export interface NFTData {
  id?: string;
  tokenId: number;
  name: string;
  imageUrl: string;
  ipfsImageUrl?: string;
  ipfsMetadataUrl?: string;
  gatewayImageUrl?: string;
  rarity: RarityLevel;
  rarityRevealed: boolean;
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  creator: string;
  mintedAt: number;
  vrfRequestId?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface UserStats {
  totalNFTs: number;
  rarityBreakdown: Record<RarityLevel, number>;
  totalValue: number;
  favoriteStyle: string;
}

// 生成神兽名称
function generateBeastName(input: string): string {
  const prefixes = ['天', '玄', '神', '灵', '圣', '仙', '古', '幻', '紫', '金'];
  const suffixes = ['龙', '凤', '麟', '虎', '狮', '鹏', '鹰', '狐', '龟', '蛇'];
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const prefix = prefixes[Math.abs(hash) % prefixes.length];
  const suffix = suffixes[Math.abs(hash >> 8) % suffixes.length];
  
  return `${prefix}${suffix}`;
}

export function useNFTData() {
  const { address, isConnected } = useWallet();
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // 从数据库加载NFT数据
  const loadNFTData = useCallback(async () => {
    if (!isConnected || !address) {
      console.log('❌ 钱包未连接，清空数据');
      setNftData([]);
      setUserStats(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 从数据库加载NFT数据...', address);
      
      const response = await fetch(`/api/nfts?address=${address}`);
      const data = await response.json();
      
      if (data.success) {
        const nfts = data.nfts.map((nft: any) => ({
          ...nft,
          mintedAt: new Date(nft.mintedAt).getTime(),
          attributes: [
            { trait_type: '艺术风格', value: nft.style },
            { trait_type: '稀有度', value: ['普通', '稀有', '史诗', '传说', '神话'][nft.rarity] },
            { trait_type: 'AI模型', value: 'DeepSeek + 智谱AI' },
            { trait_type: '存储方式', value: 'Pinata IPFS' }
          ]
        }));
        
        console.log('✅ 数据库NFT数据加载成功:', nfts.length, '个', nfts);
        setNftData(nfts);
        setUserStats(calculateUserStats(nfts));
      } else {
        console.error('❌ 数据库NFT数据加载失败:', data.error);
        setNftData([]);
        setUserStats(null);
      }
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      setNftData([]);
      setUserStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // 添加NFT到数据库
  const addNFT = async (newNFTData: {
    tokenId: number;
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    creator: string;
    imageUrl: string;
    ipfsImageUrl?: string;
    ipfsMetadataUrl?: string;
    gatewayImageUrl?: string;
    rarity: RarityLevel;
    vrfRequestId?: string;
  }) => {
    console.log('🆕 addNFT函数被调用！参数:', newNFTData);
    
    if (!address) {
      console.error('❌ 无法添加NFT：钱包未连接');
      return false;
    }

    try {
      console.log('📝 开始添加NFT到数据库...');

      const beastName = generateBeastName(newNFTData.originalInput);
      
      const nftToCreate = {
        ...newNFTData,
        name: `山海神兽 · ${beastName}`,
        creator: newNFTData.creator.toLowerCase() // 确保地址小写
      };

      console.log('🎨 完整NFT数据:', nftToCreate);

      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nftToCreate)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ NFT成功添加到数据库!', data.nft);
        
        // 重新加载数据
        await loadNFTData();
        
        // 触发成功事件
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('nftAddedToGallery', { 
            detail: { nft: data.nft, success: true } 
          });
          window.dispatchEvent(event);
          console.log('📡 已触发nftAddedToGallery事件');
        }
        
        return true;
      } else {
        console.error('❌ 数据库添加失败:', data.error, data.details);
        return false;
      }
    } catch (error) {
      console.error('❌ 添加NFT到数据库失败:', error);
      return false;
    }
  };

  // 强制添加测试NFT
  const forceAddTestNFT = async () => {
    if (!address) return false;
    
    const testNFT = {
      tokenId: Date.now(), // 使用时间戳作为唯一ID
      originalInput: '测试神兽描述 - 数据库版本',
      optimizedPrompt: '这是一个数据库版本的测试神兽，用于验证完整的数据存储功能...',
      style: 'modern',
      creator: address,
      imageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      ipfsImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      ipfsMetadataUrl: 'ipfs://test-metadata-db',
      gatewayImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      rarity: 1 as RarityLevel,
      vrfRequestId: 'test-db-' + Date.now()
    };

    console.log('🧪 强制添加数据库测试NFT:', testNFT);
    return await addNFT(testNFT);
  };

  // 计算统计数据
  const calculateUserStats = (nfts: NFTData[]): UserStats => {
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

    const favoriteStyle = Object.entries(styleCount).sort(([,a], [,b]) => b - a)[0]?.[0] || 'modern';

    return {
      totalNFTs: nfts.length,
      rarityBreakdown,
      totalValue: nfts.length * 0.01,
      favoriteStyle
    };
  };

  // 调试函数
  const debugInfo = () => {
    console.log('🐛 useNFTData调试信息 (数据库版本):');
    console.log('- 钱包连接:', isConnected);
    console.log('- 钱包地址:', address);
    console.log('- NFT数据长度:', nftData.length);
    console.log('- NFT数据:', nftData);
    console.log('- 用户统计:', userStats);
    console.log('- 数据来源: 数据库 (Prisma + SQLite)');
  };

  // 清空数据库数据（开发用）
  const clearAllData = async () => {
    if (confirm('确定要清空数据库中的所有NFT数据吗？此操作不可逆！')) {
      try {
        // 这里可以添加一个清空数据库的API
        console.log('🧹 清空数据库数据 - 需要实现API');
        setNftData([]);
        setUserStats(null);
      } catch (error) {
        console.error('清空数据失败:', error);
      }
    }
  };

  // 初始化加载
  useEffect(() => {
    loadNFTData();
  }, [loadNFTData]);

  return {
    nftData,
    userStats,
    isLoading,
    addNFT,
    forceAddTestNFT,
    loadNFTData,
    debugInfo,
    clearAllData,
    // 筛选和搜索
    filterByRarity: (rarity: RarityLevel | 'all') => {
      if (rarity === 'all') return nftData;
      return nftData.filter(nft => nft.rarity === rarity);
    },
    filterByStyle: (style: string | 'all') => {
      if (style === 'all') return nftData;
      return nftData.filter(nft => nft.style === style);
    },
    searchNFTs: (query: string) => {
      if (!query.trim()) return nftData;
      const lowerQuery = query.toLowerCase();
      return nftData.filter(nft => 
        nft.name.toLowerCase().includes(lowerQuery) ||
        nft.originalInput.toLowerCase().includes(lowerQuery) ||
        nft.tokenId.toString().includes(query)
      );
    },
    // 获取显示图片的URL
    getDisplayImageUrl: (nft: NFTData) => {
      // 优先使用IPFS网关URL
      if (nft.ipfsImageUrl && nft.ipfsImageUrl.startsWith('ipfs://')) {
        return `https://gateway.pinata.cloud/ipfs/${nft.ipfsImageUrl.replace('ipfs://', '')}`;
      }
      return nft.imageUrl || nft.gatewayImageUrl || nft.ipfsImageUrl || 'https://via.placeholder.com/400x400/6B7280/FFFFFF?text=No+Image';
    }
  };
}
