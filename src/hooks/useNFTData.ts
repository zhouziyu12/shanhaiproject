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

// Generate mythical beast names
function generateBeastName(input: string): string {
  const prefixes = ['Divine', 'Mystic', 'Sacred', 'Spirit', 'Holy', 'Celestial', 'Ancient', 'Phantom', 'Cosmic', 'Golden'];
  const suffixes = ['Dragon', 'Phoenix', 'Qilin', 'Tiger', 'Lion', 'Roc', 'Eagle', 'Fox', 'Turtle', 'Serpent'];
  
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const prefix = prefixes[Math.abs(hash) % prefixes.length];
  const suffix = suffixes[Math.abs(hash >> 8) % suffixes.length];
  
  return `${prefix} ${suffix}`;
}

export function useNFTData() {
  const { address, isConnected } = useWallet();
  const [nftData, setNftData] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  // Load NFT data from database
  const loadNFTData = useCallback(async () => {
    if (!isConnected || !address) {
      console.log('❌ Wallet not connected, clearing data');
      setNftData([]);
      setUserStats(null);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Loading NFT data from database...', address);
      
      const response = await fetch(`/api/nfts?address=${address}`);
      const data = await response.json();
      
      if (data.success) {
        const nfts = data.nfts.map((nft: any) => ({
          ...nft,
          mintedAt: new Date(nft.mintedAt).getTime(),
          attributes: [
            { trait_type: 'Art Style', value: nft.style },
            { trait_type: 'Rarity', value: ['Common', 'Rare', 'Epic', 'Legendary', 'Mythical'][nft.rarity] },
            { trait_type: 'AI Model', value: 'DeepSeek + ZhipuAI' },
            { trait_type: 'Storage', value: 'Pinata IPFS' }
          ]
        }));
        
        console.log('✅ Database NFT data loaded successfully:', nfts.length, 'items', nfts);
        setNftData(nfts);
        setUserStats(calculateUserStats(nfts));
      } else {
        console.error('❌ Database NFT data loading failed:', data.error);
        setNftData([]);
        setUserStats(null);
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      setNftData([]);
      setUserStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Add NFT to database
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
    console.log('🆕 addNFT function called! Parameters:', newNFTData);
    
    if (!address) {
      console.error('❌ Cannot add NFT: wallet not connected');
      return false;
    }

    try {
      console.log('📝 Starting to add NFT to database...');

      const beastName = generateBeastName(newNFTData.originalInput);
      
      const nftToCreate = {
        ...newNFTData,
        name: `Shan Hai Beast · ${beastName}`,
        creator: newNFTData.creator.toLowerCase() // Ensure address is lowercase
      };

      console.log('🎨 Complete NFT data:', nftToCreate);

      const response = await fetch('/api/nfts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nftToCreate)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ NFT successfully added to database!', data.nft);
        
        // Reload data
        await loadNFTData();
        
        // Trigger success event
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('nftAddedToGallery', { 
            detail: { nft: data.nft, success: true } 
          });
          window.dispatchEvent(event);
          console.log('📡 nftAddedToGallery event triggered');
        }
        
        return true;
      } else {
        console.error('❌ Database addition failed:', data.error, data.details);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to add NFT to database:', error);
      return false;
    }
  };

  // Force add test NFT
  const forceAddTestNFT = async () => {
    if (!address) return false;
    
    const testNFT = {
      tokenId: Date.now(), // Use timestamp as unique ID
      originalInput: 'Test mythical beast description - Database version',
      optimizedPrompt: 'This is a database version test mythical beast, used to verify complete data storage functionality...',
      style: 'modern',
      creator: address,
      imageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      ipfsImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      ipfsMetadataUrl: 'ipfs://test-metadata-db',
      gatewayImageUrl: 'https://via.placeholder.com/400x400/8B5CF6/FFFFFF?text=DB+Test+Beast',
      rarity: 1 as RarityLevel,
      vrfRequestId: 'test-db-' + Date.now()
    };

    console.log('🧪 Force adding database test NFT:', testNFT);
    return await addNFT(testNFT);
  };

  // Calculate statistics
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

  // Debug function
  const debugInfo = () => {
    console.log('🐛 useNFTData debug info (Database version):');
    console.log('- Wallet connected:', isConnected);
    console.log('- Wallet address:', address);
    console.log('- NFT data length:', nftData.length);
    console.log('- NFT data:', nftData);
    console.log('- User stats:', userStats);
    console.log('- Data source: Database (Prisma + SQLite)');
  };

  // Clear database data (development use)
  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all NFT data from the database? This action is irreversible!')) {
      try {
        // Can add a database clearing API here
        console.log('🧹 Clear database data - API implementation needed');
        setNftData([]);
        setUserStats(null);
      } catch (error) {
        console.error('Failed to clear data:', error);
      }
    }
  };

  // Initialize loading
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
    // Filter and search
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
    // Get display image URL
    getDisplayImageUrl: (nft: NFTData) => {
      // Prioritize IPFS gateway URL
      if (nft.ipfsImageUrl && nft.ipfsImageUrl.startsWith('ipfs://')) {
        return `https://gateway.pinata.cloud/ipfs/${nft.ipfsImageUrl.replace('ipfs://', '')}`;
      }
      return nft.imageUrl || nft.gatewayImageUrl || nft.ipfsImageUrl || 'https://via.placeholder.com/400x400/6B7280/FFFFFF?text=No+Image';
    }
  };
}