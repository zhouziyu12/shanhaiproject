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

  // Listen for NFT addition events
  useEffect(() => {
    const handleNFTAdded = (event: CustomEvent) => {
      console.log('🎉 Gallery received NFT addition success event:', event.detail);
      // Force refresh to ensure latest data is displayed
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

  // Debug: Log information when component mounts
  useEffect(() => {
    if (mounted && isConnected) {
      console.log('🎯 NFTGallery component debug info:');
      console.log('Wallet address:', address);
      console.log('NFT data length:', nftData.length);
      console.log('NFT data:', nftData);
      console.log('User stats:', userStats);
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
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white">Connect Wallet to View Gallery</h1>
          <p className="text-white/70">Please connect your wallet to view your mythical beast collection</p>
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
    const shareText = `I own a ${getRarityInfo(nft.rarity).name}-tier ${nft.name} in the Divine Image Project! #DivineImageProject #ShanHaiVerse #NFT`;
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Share content copied to clipboard!');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNFT(null);
  };

  // Debug button handler
  const handleDebug = () => {
    console.log('🐛 Manual debug:');
    console.log('localStorage data:', localStorage.getItem('shanhaiverse_nfts'));
    console.log('Image cache:', localStorage.getItem('shanhaiverse_images'));
    console.log('Current wallet address:', address);
    console.log('NFT data:', nftData);
    console.log('User stats:', userStats);
    
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
          My Mythical Beast Gallery
        </h1>
        <p className="text-white/70">Your collection of Shan Hai Jing mythical beasts - fully dynamic version</p>
        
        {/* Debug and management buttons */}
        <div className="flex justify-center gap-2 flex-wrap">
          <Button
            onClick={handleDebug}
            variant="outline"
            size="sm"
            className="text-xs text-white/60 border-white/20 hover:bg-white/10"
          >
            🐛 Debug Info
          </Button>
          <Button
            onClick={clearAllData}
            variant="outline"
            size="sm"
            className="text-xs text-red-400/60 border-red-500/20 hover:bg-red-500/10"
          >
            🧹 Clear Data
          </Button>
          <Button
            onClick={forceAddTestNFT}
            variant="outline"
            size="sm"
            className="text-xs text-green-400/60 border-green-500/20 hover:bg-green-500/10"
          >
            🧪 Add Test NFT
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="text-xs text-blue-400/60 border-blue-500/20 hover:bg-blue-500/10"
          >
            🔄 Refresh Page
          </Button>
        </div>

        {/* Debug information display */}
        {debugMode && (
          <div className="bg-black/50 border border-white/20 rounded-lg p-4 mt-4 text-left">
            <h3 className="text-white font-bold mb-2">🐛 Debug Information</h3>
            <div className="text-xs text-white/70 space-y-1 font-mono">
              <div>Wallet Address: {address}</div>
              <div>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
              <div>NFT Count: {nftData.length}</div>
              <div>localStorage Key: shanhaiverse_nfts</div>
              <div>localStorage Size: {localStorage.getItem('shanhaiverse_nfts')?.length || 0} characters</div>
              <div>Image Cache Size: {localStorage.getItem('shanhaiverse_images')?.length || 0} characters</div>
              <div>Last Updated: {new Date().toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>

      {userStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{userStats.totalNFTs}</div>
              <div className="text-sm text-white/60">Total Beasts</div>
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
                placeholder="Search beast name, description, or Token ID..."
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
                <option value="all">All Rarities</option>
                {Object.entries(RARITY_CONFIG.LEVELS).map(([level, config]) => (
                  <option key={level} value={level}>{config.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center text-sm text-white/60">
            <span>Found {filteredNFTs.length} beasts</span>
            <span>Total {userStats?.totalNFTs || 0} beasts</span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="text-xl font-bold text-white mb-2">Loading...</h3>
          <p className="text-white/60">Fetching your mythical beast collection</p>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            {nftData.length === 0 ? (
              <>
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-bold text-white mb-2">No Mythical Beasts Yet</h3>
                <p className="text-white/60 mb-6">This is a fully dynamic gallery, starting from empty. Go create your first Shan Hai mythical beast!</p>
                <div className="space-y-4">
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button 
                      onClick={() => window.location.href = '/mint'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Start Creating
                    </Button>
                    <Button
                      onClick={forceAddTestNFT}
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      🧪 Add Test NFT
                    </Button>
                  </div>
                  
                  {/* Status information display */}
                  <div className="text-xs text-white/40 mt-4 space-y-1">
                    <div>💳 Wallet Address: {address}</div>
                    <div>📊 Data Status: {isLoading ? 'Loading' : 'Loaded'}</div>
                    <div>💾 localStorage: {typeof localStorage !== 'undefined' ? 'Available' : 'Unavailable'}</div>
                    <div>🎯 Mode: Fully Dynamic Gallery</div>
                    <div>🔑 Storage Key: shanhaiverse_nfts</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-white mb-2">No Matching Beasts Found</h3>
                <p className="text-white/60 mb-6">Try adjusting your search criteria or filters</p>
                <Button 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterRarity('all');
                  }}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Clear Filters
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