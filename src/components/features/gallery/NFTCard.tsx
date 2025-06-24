'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getRarityInfo } from '@/config/rarity';
import type { NFTData } from '@/hooks/useNFTData';

interface NFTCardProps {
  nft: NFTData;
  onClick?: (nft: NFTData) => void;
  onShare?: (nft: NFTData) => void;
  showDetails?: boolean;
  getDisplayImageUrl?: (nft: NFTData) => string;
}

export function NFTCard({ 
  nft, 
  onClick, 
  onShare, 
  showDetails = false,
  getDisplayImageUrl 
}: NFTCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const rarityInfo = getRarityInfo(nft.rarity);

  // Get display image URL
  const displayImageUrl = getDisplayImageUrl ? getDisplayImageUrl(nft) : (
    nft.localImageData || nft.imageUrl || nft.gatewayImageUrl
  );

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  };

  const handleCardClick = () => {
    onClick?.(nft);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(nft);
  };

  return (
    <Card 
      className={`bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 cursor-pointer group ${rarityInfo.borderColor} hover:border-opacity-50`}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse flex items-center justify-center">
              <div className="text-white/60 text-center">
                <div className="text-2xl mb-2">🖼️</div>
                <div className="text-xs">Loading...</div>
              </div>
            </div>
          )}
          
          {imageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20 flex items-center justify-center">
              <div className="text-center text-white/60">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-xs">Image load failed</div>
                <div className="text-xs mt-1">Token #{nft.tokenId}</div>
              </div>
            </div>
          ) : (
            <img
              src={displayImageUrl}
              alt={nft.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                setImageLoaded(true);
                console.log('✅ NFT image loaded successfully:', nft.tokenId, displayImageUrl.substring(0, 50) + '...');
              }}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
                console.error('❌ NFT image load failed:', nft.tokenId, displayImageUrl);
              }}
            />
          )}

          {/* Rarity label */}
          <div className="absolute top-3 left-3">
            <Badge 
              className={`${rarityInfo.bgColor} ${rarityInfo.color} ${rarityInfo.borderColor} border text-xs font-bold`}
            >
              {nft.rarity === 4 ? '🌟' : 
               nft.rarity === 3 ? '⭐' : 
               nft.rarity === 2 ? '💜' : 
               nft.rarity === 1 ? '💙' : '⚪'} {rarityInfo.name}
            </Badge>
          </div>

          {/* Token ID */}
          <div className="absolute top-3 right-3">
            <Badge className="bg-black/50 text-white text-xs">
              #{nft.tokenId}
            </Badge>
          </div>

          {/* Local storage indicator */}
          {nft.localImageData && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-green-500/20 text-green-400 text-xs border border-green-500/30">
                📱 Local
              </Badge>
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center justify-center">
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={handleCardClick}
              >
                View Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={handleShare}
              >
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Information area */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-white font-bold text-lg line-clamp-1">
              {nft.name}
            </h3>
            <p className="text-white/60 text-sm line-clamp-2">
              {nft.originalInput}
            </p>
          </div>

          {/* Attribute tags */}
          <div className="flex flex-wrap gap-1">
            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
              {nft.style === 'classic' ? 'Classical Ink' :
               nft.style === 'modern' ? 'Modern Illustration' :
               nft.style === 'fantasy' ? 'Fantasy Art' :
               nft.style === 'ink' ? 'Ink Wash' : nft.style}
            </Badge>
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              AI Generated
            </Badge>
            {nft.vrfRequestId && (
              <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                VRF Verified
              </Badge>
            )}
          </div>

          {/* Detailed information */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/60">Minted:</span>
                  <span className="text-white ml-1">{getTimeAgo(nft.mintedAt)}</span>
                </div>
                <div>
                  <span className="text-white/60">Creator:</span>
                  <span className="text-white ml-1 font-mono">
                    {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                  </span>
                </div>
              </div>
              
              {/* Storage information */}
              <div className="text-xs">
                <span className="text-white/60">Storage:</span>
                <span className="text-green-400 ml-1">
                  {nft.localImageData ? '📱 Local Cache + ' : ''}
                  🌐 IPFS
                </span>
              </div>
            </div>
          )}

          {/* Bottom information */}
          <div className="flex justify-between items-center text-xs text-white/60 pt-2 border-t border-white/10">
            <span>Minted {getTimeAgo(nft.mintedAt)}</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>Confirmed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}