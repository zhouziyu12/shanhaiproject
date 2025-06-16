'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/web3/ConnectWallet';
import type { RarityLevel } from '@/config/rarity';

export interface NFTData {
  tokenId: number;
  name: string;
  imageUrl: string;
  ipfsImageUrl: string;
  ipfsMetadataUrl: string;
  gatewayImageUrl: string;
  localImageData?: string; // 本地图片base64数据
  rarity: RarityLevel;
  rarityRevealed: boolean;
  originalInput: string;
  optimizedPrompt: string;
  style: string;
  creator: string;
  mintedAt: number;
  vrfRequestId?: string;
  attributes: Array<{
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

// 本地存储的键名
const STORAGE_KEY = 'shanhaiverse_nfts';
const IMAGE_CACHE_KEY = 'shanhaiverse_images';

// 从localStorage获取NFT数据 - 完全动态，从空开始
function getNFTsFromStorage(): NFTData[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    console.log('📦 从localStorage读取NFT数据:', stored ? '有数据' : '无数据');
    
    if (!stored) {
      console.log('📝 首次使用，从空数据开始');
      return [];
    }
    
    const data = JSON.parse(stored);
    const nfts = Array.isArray(data) ? data : [];
    console.log('✅ 成功读取NFT数据:', nfts.length, '个NFT', nfts);
    return nfts;
  } catch (error) {
    console.error('❌ 读取NFT数据失败:', error);
    return [];
  }
}

// 保存NFT数据到localStorage
function saveNFTsToStorage(nfts: NFTData[]) {
  if (typeof window === 'undefined') return;
  
  try {
    const dataToSave = JSON.stringify(nfts);
    localStorage.setItem(STORAGE_KEY, dataToSave);
    console.log('💾 NFT数据已保存到localStorage:', nfts.length, '个NFT');
    console.log('💾 保存的数据:', nfts);
  } catch (error) {
    console.error('❌ 保存NFT数据失败:', error);
  }
}

// 缓存图片到本地存储 (通过IPFS URL)
async function cacheImageToLocal(imageUrl: string, tokenId: number): Promise<string | null> {
  try {
    console.log('📸 开始缓存图片到本地:', imageUrl);
    
    // 如果是IPFS URL，尝试通过网关访问
    let fetchUrl = imageUrl;
    if (imageUrl.startsWith('ipfs://')) {
      fetchUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.replace('ipfs://', '')}`;
      console.log('🌐 转换IPFS URL:', fetchUrl);
    }
    
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error(`图片下载失败: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        
        // 保存到localStorage
        try {
          const imageCache = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}');
          imageCache[tokenId] = base64Data;
          localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(imageCache));
          console.log('✅ 图片已缓存到本地, Token ID:', tokenId, '大小:', Math.round(base64Data.length / 1024), 'KB');
          resolve(base64Data);
        } catch (error) {
          console.error('❌ 图片缓存失败:', error);
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.error('❌ 图片读取失败');
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ 图片缓存失败:', error);
    return null;
  }
}

// 获取本地缓存的图片
function getLocalImage(tokenId: number): string | null {
  try {
    const imageCache = JSON.parse(localStorage.getItem(IMAGE_CACHE_KEY) || '{}');
    return imageCache[tokenId] || null;
  } catch (error) {
    console.error('❌ 获取本地图片失败:', error);
    return null;
  }
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

  // 加载用户的NFT数据
  useEffect(() => {
    console.log('🔄 useNFTData Hook执行:', { isConnected, address });
    
    if (!isConnected || !address) {
      console.log('❌ 钱包未连接，清空数据');
      setNftData([]);
      setUserStats(null);
      return;
    }

    setIsLoading(true);
    
    // 模拟加载延迟
    setTimeout(() => {
      const allNFTs = getNFTsFromStorage();
      console.log('📊 所有NFT数据:', allNFTs);
      
      // 过滤当前用户的NFT（忽略大小写）
      const userNFTs = allNFTs.filter(nft => {
        const match = nft.creator.toLowerCase() === address.toLowerCase();
        console.log('🔍 NFT匹配检查:', {
          nftCreator: nft.creator.toLowerCase(),
          currentAddress: address.toLowerCase(),
          match,
          tokenId: nft.tokenId
        });
        return match;
      });
      
      console.log('✅ 用户NFT数据:', userNFTs.length, '个NFT', userNFTs);
      setNftData(userNFTs);
      
      // 计算用户统计
      const stats = calculateUserStats(userNFTs);
      console.log('📈 用户统计:', stats);
      setUserStats(stats);
      
      setIsLoading(false);
    }, 500);
  }, [address, isConnected]);

  // 添加新的NFT - 增强版本，支持多种保存方式
  const addNFT = async (newNFTData: {
    tokenId: number;
    originalInput: string;
    optimizedPrompt: string;
    style: string;
    creator: string;
    imageUrl: string;
    ipfsImageUrl: string;
    ipfsMetadataUrl: string;
    gatewayImageUrl: string;
    rarity: RarityLevel;
    vrfRequestId: string;
  }) => {
    console.log('🆕 addNFT函数被调用！参数:', newNFTData);
    
    if (!address) {
      console.error('❌ 无法添加NFT：钱包未连接');
      return;
    }

    try {
      console.log('📝 开始构建NFT数据...');

      // 1. 尝试缓存图片到本地（支持多种图片源）
      let localImageData: string | null = null;
      
      // 优先使用IPFS图片
      const imageToCache = newNFTData.ipfsImageUrl || newNFTData.gatewayImageUrl || newNFTData.imageUrl;
      console.log('📸 准备缓存图片:', imageToCache);
      
      try {
        localImageData = await cacheImageToLocal(imageToCache, newNFTData.tokenId);
      } catch (error) {
        console.warn('⚠️ 图片缓存失败，继续使用URL:', error);
      }

      // 2. 生成神兽名称和属性
      const styleNames = {
        classic: '古典水墨',
        modern: '现代插画',
        fantasy: '奇幻艺术',
        ink: '水墨写意'
      };

      const beastName = generateBeastName(newNFTData.originalInput);
      
      const nft: NFTData = {
        ...newNFTData,
        name: `山海神兽 · ${beastName}`,
        localImageData, // 添加本地图片数据
        rarityRevealed: true,
        mintedAt: Date.now(),
        attributes: [
          {
            trait_type: '艺术风格',
            value: styleNames[newNFTData.style as keyof typeof styleNames] || newNFTData.style
          },
          {
            trait_type: '稀有度',
            value: ['普通', '稀有', '史诗', '传说', '神话'][newNFTData.rarity]
          },
          {
            trait_type: 'AI模型',
            value: 'DeepSeek + 智谱AI'
          },
          {
            trait_type: '存储方式',
            value: 'Pinata IPFS'
          },
          {
            trait_type: '创作时间',
            value: new Date().toISOString().split('T')[0]
          }
        ]
      };

      console.log('🎨 完整NFT数据构建完成:', nft);

      // 3. 获取现有数据并添加新NFT
      const allNFTs = getNFTsFromStorage();
      console.log('📋 当前所有NFT:', allNFTs.length, '个');
      
      // 检查是否已存在
      const existingIndex = allNFTs.findIndex(existingNFT => existingNFT.tokenId === nft.tokenId);
      if (existingIndex >= 0) {
        console.log('🔄 更新现有NFT, Token ID:', nft.tokenId);
        allNFTs[existingIndex] = nft;
      } else {
        console.log('➕ 添加新NFT, Token ID:', nft.tokenId);
        allNFTs.unshift(nft); // 添加到开头
      }

      // 4. 保存到localStorage
      saveNFTsToStorage(allNFTs);

      // 5. 更新前端状态
      const userNFTs = allNFTs.filter(nft => 
        nft.creator.toLowerCase() === address.toLowerCase()
      );
      
      console.log('📱 更新前端状态, 用户NFT数量:', userNFTs.length);
      setNftData(userNFTs);

      // 6. 重新计算统计
      const newStats = calculateUserStats(userNFTs);
      setUserStats(newStats);
      console.log('📈 统计已更新:', newStats);

      console.log('🎉 NFT成功添加到图鉴！');
      
      // 7. 触发成功事件
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('nftAddedToGallery', { 
          detail: { nft, success: true } 
        });
        window.dispatchEvent(event);
        console.log('📡 已触发nftAddedToGallery事件');
      }

      return true;

    } catch (error) {
      console.error('❌ 添加NFT到图鉴失败:', error);
      return false;
    }
  };

  // 强制添加NFT的方法（用于测试）
  const forceAddTestNFT = () => {
    if (!address) return;
    
    const testNFT = {
      tokenId: Date.now(), // 使用时间戳作为唯一ID
      originalInput: '测试神兽描述',
      optimizedPrompt: '这是一个测试用的神兽，用于验证图鉴功能...',
      style: 'modern',
      creator: address,
      imageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Test+Beast',
      ipfsImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Test+Beast',
      ipfsMetadataUrl: 'ipfs://test-metadata',
      gatewayImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=Test+Beast',
      rarity: 1 as RarityLevel,
      vrfRequestId: 'test-vrf-' + Date.now()
    };

    console.log('🧪 强制添加测试NFT:', testNFT);
    addNFT(testNFT);
  };

  // 按稀有度筛选NFT
  const filterByRarity = (rarity: RarityLevel | 'all') => {
    if (rarity === 'all') return nftData;
    return nftData.filter(nft => nft.rarity === rarity);
  };

  // 按风格筛选NFT
  const filterByStyle = (style: string | 'all') => {
    if (style === 'all') return nftData;
    return nftData.filter(nft => nft.style === style);
  };

  // 搜索NFT
  const searchNFTs = (query: string) => {
    if (!query.trim()) return nftData;
    const lowerQuery = query.toLowerCase();
    return nftData.filter(nft => 
      nft.name.toLowerCase().includes(lowerQuery) ||
      nft.originalInput.toLowerCase().includes(lowerQuery) ||
      nft.tokenId.toString().includes(query)
    );
  };

  // 调试函数
  const debugInfo = () => {
    console.log('🐛 useNFTData调试信息:');
    console.log('- 钱包连接:', isConnected);
    console.log('- 钱包地址:', address);
    console.log('- NFT数据长度:', nftData.length);
    console.log('- NFT数据:', nftData);
    console.log('- 用户统计:', userStats);
    console.log('- localStorage数据:', getNFTsFromStorage());
    console.log('- 图片缓存:', localStorage.getItem(IMAGE_CACHE_KEY));
  };

  // 清空所有数据（用于测试）
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(IMAGE_CACHE_KEY);
    setNftData([]);
    setUserStats(null);
    console.log('🧹 所有数据已清空');
  };

  return {
    nftData,
    userStats,
    isLoading,
    filterByRarity,
    filterByStyle,
    searchNFTs,
    addNFT,
    debugInfo,
    clearAllData,
    forceAddTestNFT, // 添加测试方法
    // 管理函数
    updateNFT: (tokenId: number, updates: Partial<NFTData>) => {
      setNftData(prev => prev.map(nft => 
        nft.tokenId === tokenId ? { ...nft, ...updates } : nft
      ));
    },
    // 获取显示图片的URL（优先使用本地缓存）
    getDisplayImageUrl: (nft: NFTData) => {
      if (nft.localImageData) {
        return nft.localImageData;
      }
      // 如果是IPFS URL，使用网关
      if (nft.ipfsImageUrl && nft.ipfsImageUrl.startsWith('ipfs://')) {
        return `https://gateway.pinata.cloud/ipfs/${nft.ipfsImageUrl.replace('ipfs://', '')}`;
      }
      return nft.imageUrl || nft.gatewayImageUrl || nft.ipfsImageUrl;
    }
  };
}

// 计算用户统计
function calculateUserStats(nfts: NFTData[]): UserStats {
  const rarityBreakdown = nfts.reduce((acc, nft) => {
    acc[nft.rarity] = (acc[nft.rarity] || 0) + 1;
    return acc;
  }, {} as Record<RarityLevel, number>);

  // 填充缺失的稀有度
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
}